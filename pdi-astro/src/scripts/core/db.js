// ===========================================================================
//  DB - Capa de datos con SurrealDB Cloud (fuente �aNICA de verdad)
// ===========================================================================
//  El proyecto depende por completo de la instancia de SurrealDB Cloud:
//
//    - SIN CONEXI�N: no se muestra ning�n dato (los modelos inician vac�os);
//      no hay fixtures ni espejo en localStorage. db.js reintenta sola con
//      backoff y rehidrata apenas vuelve la conexi�n.
//    - CRUD: toda mutación va SIEMPRE a la nube. Los modelos actualizan la
//      memoria en forma optimista y esta capa confirma escribiendo en las
//      tablas reales: persona, inscripcion, tamizaje_hemoglobina,
//      usuario_vinculado, sede, caso_social, solicitud_caso, voluntario,
//      asistencia_diaria y bitacora_auditoria.
//    - SINCRONIZACI�N: suscripciones LIVE SELECT a las diez tablas; cualquier
//      cambio de otro usuario dispara una re-hidrataci�n con debounce y
//      refresco de la vista activa. Si la conexi�n cae, hay reintentos con
//      backoff hasta recuperarse.
//
//  Ya no hay valores fabricados: los campos que la nube no tiene se presentan
//  vacíos o como "Sin registro". La apariencia de datos corruptos del pasado
//  viene de mezclar datos ficticios con reales; esa mezcla está eliminada.
// ===========================================================================
import { Surreal } from 'surrealdb';
import { AnemiaCalculator } from '../utils/AnemiaCalculator.js';
import { ToastView } from '../views/ToastView.js';
import { estrategiasDesdePrograma, SERVICIOS_VOLUNTARIADO } from '../../data/opcionesBeneficiario.js';
import {
  normalizarParentesco,
  seguroDbAUi,
  seguroUiADb,
  modalidadDbAUi,
  modalidadUiADb,
  exoneracionDesdePct,
  pctDesdeExoneracion,
  distritoDeSede,
  sedeConocida,
  etiquetaSede,
  tipoDocumentoCanonico,
  tipoLocalCanonico,
  tipoAlergiaCanonico,
  severidadAlergiaCanonico,
  descripcionAlergia,
  resumenAlergias,
  alergiaPrincipal,
} from './catalogos.js';
import { campoUsuario, campoViveCon } from './esquemaCampos.js';
import { consultaCapacitacion } from './consultasVoluntario.js';
import { conReintentos } from '../utils/reintento.js';

const URL = import.meta.env.PUBLIC_SURREAL_URL;
const NS = import.meta.env.PUBLIC_SURREAL_NS;
const DB = import.meta.env.PUBLIC_SURREAL_DB;

// La contraseña de la base NO está aquí. El servidor (api/pdi.mjs) la usa
// para emitir tokens de sesión de corta duración y el navegador se
// autentica con ese token. En el bundle publicado no queda ninguna
// credencial de la base: solo un token que caduca en 30 minutos.
const RUTA_TOKEN = '/api/pdi';

/**
 * Pide al servidor un token de sesión para la base de datos.
 * Si el servidor no lo entrega, la app se queda sin datos: por eso el error
 * se propaga con un mensaje claro en vez de tragarse.
 */
async function pedirToken() {
  const res = await fetch(RUTA_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) {
    throw new Error('El servidor no concedio acceso a la base de datos (' + res.status + ')');
  }
  const datos = await res.json();
  if (!datos || !datos.token) {
    throw new Error('El servidor no concedio acceso a la base de datos');
  }
  return datos.token;
}

// Puente de migración: mientras producción conserve el esquema anterior y
// staging use el nuevo, la misma aplicación puede apuntar a uno u otro.
// PUBLIC_ESQUEMA_USUARIO=0 usa persona_id / persona_vinculada / menor_id;
// PUBLIC_ESQUEMA_USUARIO=1 usa usuario_id / usuario_vinculado / firmante_id.
// Cuando producción termine la migración, la bandera se retira.
const ESQUEMA_USUARIO = import.meta.env.PUBLIC_ESQUEMA_USUARIO === '1';
const F_USUARIO = campoUsuario(ESQUEMA_USUARIO);
const T_VINCULO = ESQUEMA_USUARIO ? 'usuario_vinculado' : 'persona_vinculada';
const F_MENOR = ESQUEMA_USUARIO ? 'usuario_id' : 'menor_id';
const F_FIRMANTE = ESQUEMA_USUARIO ? 'firmante_id' : 'apoderado_firmante';
// El booleano del vínculo también cambió de nombre en el esquema nuevo.
// Escribir `vive_con_usuario` contra `persona_vinculada` (SCHEMAFULL) rompe
// el alta y la edición del expediente; por eso se resuelve con la bandera.
const F_VIVE_CON = campoViveCon(ESQUEMA_USUARIO);

// `caso_social` se migró antes que el resto de tablas: en la nube solo existe
// `usuario_id`. Si se usara la bandera global con producción en 0, la consulta
// pediría `persona_id.nombres` (campo inexistente) y los casos aparecerían sin
// nombre. Se mantiene separado hasta que la migración termine en todas las
// tablas y la bandera desaparezca.
const F_CASO = 'usuario_id';

// ---------------------------------------------------------------------------
//  Estado de conexión y eventos
// ---------------------------------------------------------------------------
//  'conectando' | 'cargando' | 'ok' | 'sin_conexion' (solo internos; la
//  conexi�n es silenciosa: ninguna pantalla de espera ni de bloqueo).
let _estado = 'conectando';
const _oyentes = new Set();
let _db = null;
let _conectando = null;
let _iniciada = false;
let _hidratado = false;
let _jsonDeReintento = 5000;
const MAXIMO_REINTENTO_MS = 30000;
let _temporizadorReintento = null;
let _liveHandle = [];
let _liveGeneracion = 0;
let _tempDebounceLive = null;

export function estadoActual() {
  return _estado;
}

/** Suscribe a cambios de estado de la capa. Devuelve función de des-suscripción. */
export function suscribirEstado(cb) {
  _oyentes.add(cb);
  cb(_estado);
  return () => _oyentes.delete(cb);
}

function notificarEstado() {
  _oyentes.forEach(cb => { try { cb(_estado); } catch (e) { /* oyente muerto no tumba la capa */ } });
}

function cambiarEstado(nuevo) {
  if (_estado === nuevo) return;
  _estado = nuevo;
  notificarEstado();
}

// ---------------------------------------------------------------------------
//  Conexión
// ---------------------------------------------------------------------------
async function conectar() {
  if (_db) return _db;
  if (_conectando) return _conectando;
  _conectando = (async () => {
    const db = new Surreal();
    try {
      // Autenticación por token de sesión: el SDK llama a este callback al
      // conectar y cada vez que la sesión caduca, así que la renovación es
      // automática y nadie tiene que pedirla. connect + use en una ida y
      // vuelta (medido contra São Paulo: ahorra ~2 RTT ≈ 240 ms).
      await db.connect(URL, {
        namespace: NS,
        database: DB,
        authentication: async () => await pedirToken(),
        // El probe de versión del SDK cuesta un RPC por conexión y la versión
        // ya es estable en producción (SurrealDB 3.3.2): se desactiva.
        versionCheck: false,
        // El SDK 2.x reintenta el WebSocket por su cuenta (5 veces con backoff
        // propio) y, al rendirse, deja SEIS errores "WebSocket connection
        // failed" en la consola. El reintento de la app es uno solo y con su
        // propio backoff, así que el del SDK se apaga: si la URL está mal,
        // un intento basta para saberlo.
        reconnect: { enabled: false },
      });
      _db = db;
      vigilarCaida(db);
      return db;
    } catch (errAuth) {
      // El fallo mas probable es que el servidor no entregue el token. Se
      // deja escrito con su mensaje: es la causa real, no un sintoma.
      console.warn('[PDI] No se pudo autenticar contra la base de datos:', errAuth?.message || errAuth);
      try { await db.disconnect(); } catch (e) { /* ya estaba cerrada */ }
      throw errAuth;
    }
  })().catch(err => {
    _conectando = null;
    _db = null;
    throw err;
  });
  return _conectando;
}

/** Avisa cuando el socket se cae: el backoff de la app se encarga de rearmar. */
function vigilarCaida(db) {
  try {
    db.subscribe('disconnected', () => colapsarConexion('socket caído'));
  } catch (e) { /* el SDK no expone el evento: el backoff sigue cubriendo */ }
}

/** Desconecta a propósito y avisa el estado: el backoff se encarga de rearmar. */
function colapsarConexion(origen) {
  _db = null;
  _conectando = null;
  cambiarEstado('sin_conexion');
  console.warn('[PDI] Conexión caída (' + origen + '); reintentos automáticos activos.');
  agendarReintento();
}

/**
 * Ejecuta SurrealQL. Es la única puerta de entrada a la nube: si la consulta
 * falla por transporte, colapsa la sesión para que el backoff reconecte.
 */
async function ejecutar(ql, params) {
  const escritura = esSentenciaDeEscritura(ql);
  if (escritura) {
    _escriturasEnVuelo += 1;
    _versionEscrituras += 1;
  }
  try {
    const db = await conectar();
    return await db.query(ql, params);
  } catch (err) {
    if (esErrorTransporte(err)) {
      colapsarConexion(err?.message || 'transporte');
    }
    throw err;
  } finally {
    if (escritura) {
      _escriturasEnVuelo -= 1;
      if (_escriturasEnVuelo === 0 && _hidratacionDiferida) {
        _hidratacionDiferida = false;
        hidratar(true);
      }
    }
  }
}

function esErrorTransporte(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('websocket') || msg.includes('connection') ||
    msg.includes('network') || msg.includes('fetch') ||
    msg.includes('econn') || msg.includes('timeout') ||
    (err?.name === 'VersionMismatch')
  );
}

/** Extrae el resultado de la primera sentencia respetando el formato del SDK. */
function comoLista(res) {
  if (Array.isArray(res)) {
    const primero = res[0];
    if (Array.isArray(primero)) return primero;
    if (primero && Array.isArray(primero.result)) return primero.result;
    if (primero && Array.isArray(primero.value)) return primero.value;
    return [];
  }
  return [];
}

/**
 * Ejecuta varias sentencias en UNA sola ida y vuelta. Devuelve un array con el
 * resultado de cada sentencia, en el orden en que se escribieron. Es la base
 * de la hidratación: 7 consultas cuestan lo mismo que 1.
 */
async function ejecutarLote(ql) {
  try {
    const db = await conectar();
    const res = await db.query(ql);
    return (Array.isArray(res) ? res : []).map(bloque => {
      if (Array.isArray(bloque)) return bloque;
      if (bloque && Array.isArray(bloque.result)) return bloque.result;
      if (bloque && Array.isArray(bloque.value)) return bloque.value;
      return [];
    });
  } catch (err) {
    if (esErrorTransporte(err)) {
      colapsarConexion(err?.message || 'transporte');
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
//  Encendido, hidratación y vigilancia
// ---------------------------------------------------------------------------
const TABLAS_LIVE = [
  'persona', 'inscripcion', 'tamizaje_hemoglobina', T_VINCULO,
  'sede', 'caso_social', 'solicitud_caso', 'voluntario',
  'asistencia_diaria', 'bitacora_auditoria'
];

/** Punto de arranque de la capa: lo invoca Bootstrap en todas las páginas. */
export async function iniciarCapaDatos() {
  if (_iniciada) return;
  _iniciada = true;
  intentarLevantar();
  // El reintento lo encaja el backoff de esta misma capa (5 s -> 30 s). Antes
  // había además un intervalo de vigilancia de 8 s: dos temporizadores
  // compitiendo, que multiplicaban los intentos y los errores en consola.
}

async function intentarLevantar() {
  try {
    cambiarEstado(_hidratado ? 'sin_conexion' : 'conectando');
    await conectar();
    // El registro LIVE y la primera hidratación viajan en paralelo: el render
    // inicial no debe esperar a las suscripciones (medido: ~0.3–1 s menos).
    await Promise.allSettled([suscribirLive(), hidratar()]);
  } catch (err) {
    console.warn('[PDI] No se conectó a SurrealDB:', err?.message || err);
    cambiarEstado('sin_conexion');
    avisarSinConexion(err);
    agendarReintento();
  }
}

/**
 * Sin nube no hay datos: la aplicación queda vacía y no se puede escribir.
 * El aviso sale una vez por conexión fallida, no en cada reintento.
 */
let _avisoConexionMostrado = false;
function avisarSinConexion(err) {
  if (_avisoConexionMostrado) return;
  _avisoConexionMostrado = true;
  const detalle = String(err?.message || err || '').slice(0, 120);
  try {
    ToastView.show(
      'Sin conexión con la base de datos',
      detalle || 'Los datos no se pueden leer ni guardar. Revisa la conexión.',
      'danger',
    );
  } catch (e) { /* ToastView puede no estar listo */ }
}

async function reintentar() {
  if (_estado === 'ok') return;
  clearTimeout(_temporizadorReintento);
  try {
    await conectar();
    await Promise.allSettled([suscribirLive(), hidratar()]);
  } catch (err) {
    cambiarEstado('sin_conexion');
    agendarReintento();
  }
}

function agendarReintento() {
  clearTimeout(_temporizadorReintento);
  _temporizadorReintento = setTimeout(reintentar, _jsonDeReintento);
  _jsonDeReintento = Math.min(_jsonDeReintento * 2, MAXIMO_REINTENTO_MS);
}

/** Reintento inmediato de conexi�n (queda expuesto en window.PDI.DB). */
export async function reintentarAhora() {
  clearTimeout(_temporizadorReintento);
  _jsonDeReintento = 5000;
  await reintentar();
}

/**
 * Suscripciones LIVE manuales, los 10 registros en UNA ida y vuelta. La ruta
 * "managed" de SDK 2.0.10 compila la tabla como valor ligado (FROM $what) y
 * SurrealDB 3.3.2 la rechaza con "Cannot execute LIVE statement using value:
 * ..." — así que emitimos los LIVE SELECT con el nombre de la tabla en línea,
 * en un solo viaje (cada sentencia devuelve su UUID en orden; medido: ahorra
 * ~9 RTT ≈ 1.1 s), y colgamos cada suscripción con db.liveOf(id), que es
 * local (sin red: ~3 ms las diez). Los unmanaged no se re-registran solos,
 * pero este suscribirLive() se ejecuta en cada reconexión, que es
 * exactamente cuando los id viejos quedan muertos.
 */
async function suscribirLive() {
  if (!_db) return;
  const generacionActual = ++_liveGeneracion;
  try {
    while (_liveHandle.length) {
      const h = _liveHandle.pop();
      try { await h.kill(); } catch (e) { /* lo viejo ya murió */ }
    }
    // 10 LIVE SELECT en un lote: 1 RTT en lugar de 10.
    const ql = TABLAS_LIVE.map(tabla => `LIVE SELECT * FROM ${tabla};`).join('\n');
    const res = await _db.query(ql);
    const ids = (Array.isArray(res) ? res : []).map(b =>
      Array.isArray(b) ? b[0] : (b?.result ?? b?.value ?? b)
    );
    // liveOf es local: las diez suscripciones cuelgan en paralelo sin red.
    const subs = await Promise.all(ids.filter(Boolean).map(async id => {
      const sub = await _db.liveOf(id);
      sub.subscribe(() => {
        if (generacionActual !== _liveGeneracion) return;
        if (_estado !== 'ok') return;
        clearTimeout(_tempDebounceLive);
        _tempDebounceLive = setTimeout(() => {
          if (_estado === 'ok') hidratar(true);
        }, 400);
      });
      return sub;
    }));
    _liveHandle.push(...subs);
  } catch (e) {
    console.warn('[PDI] Live sync no disponible:', e?.message || e);
  }
}

/** Re-hidratación por evento LIVE: una sola pasada, artistas equivalents. */
let _hidratando = null;

// Escrituras en vuelo. Las mutaciones son optimistas: el modelo cambia al
// instante y la nube confirma despues. Si una suscripcion LIVE dispara una
// hidratacion mientras la escritura aun no ha llegado, el snapshot traeria la
// etapa anterior y la pintaria encima (el caso "vuelve solo" a su fase). Por
// eso la aplicacion de datasets se difiere mientras haya escrituras
// pendientes y se relanza en cuanto terminan.
let _escriturasEnVuelo = 0;
// Version monotona de escrituras. Una hidratacion anota la version al salir a
// la red; si al volver la version cambio, su snapshot es anterior a una
// escritura y se descarta (aunque la escritura ya haya terminado).
let _versionEscrituras = 0;
let _hidratacionDiferida = false;

const RE_ESCRITURA = /^\s*(INSERT|UPDATE|UPSERT|CREATE|DELETE|RELATE|REMOVE)\b/i;
// Las escrituras compuestas empiezan con LET/IF y llevan UPDATE dentro
// (resolucion de solicitudes): mirar solo el inicio las dejaba fuera del
// guard, y una hidratacion posterior podia pintar la etapa anterior.
const RE_ESCRITURA_INTERNA = /\b(INSERT|UPDATE|UPSERT|CREATE|DELETE|RELATE|REMOVE)\b/i;

function esSentenciaDeEscritura(ql) {
  const texto = String(ql || '');
  return RE_ESCRITURA.test(texto) || RE_ESCRITURA_INTERNA.test(texto);
}

function programarHidratacion() {
  _hidratacionDiferida = true;
  if (_escriturasEnVuelo > 0) return; // la relanza el finally de ejecutar
  setTimeout(() => {
    if (_escriturasEnVuelo || !_hidratacionDiferida) return;
    _hidratacionDiferida = false;
    hidratar(true);
  }, 0);
}
/** Consulta del padrón completa (también usada en el lote de hidratación). */
const SQL_PADRON = `SELECT *,
  centro_salud.nombre AS centro_salud_nombre,
  institucion_origen.nombre AS institucion_origen_nombre,
  (SELECT * FROM alergia WHERE persona_id = $parent.id) AS alergias,
  (SELECT * FROM inscripcion WHERE ${F_USUARIO} = $parent.id AND activo = true LIMIT 1)[0] AS ins,
  (SELECT * FROM tamizaje_hemoglobina WHERE ${F_USUARIO} = $parent.id AND activo = true ORDER BY fecha_tamizaje DESC) AS tams,
  (SELECT cuidador_id.nombres AS c_nom, cuidador_id.apellidos AS c_ape, cuidador_id.numero_documento AS c_dni, cuidador_id.sexo AS c_sexo, parentesco FROM ${T_VINCULO} WHERE ${F_MENOR} = $parent.id LIMIT 1)[0] AS apo,
  (SELECT VALUE pct_exoneracion FROM aporte WHERE inscripcion_id.${F_USUARIO} = $parent.id ORDER BY periodo DESC, mes DESC LIMIT 1)[0] AS pct
FROM persona
WHERE activo = true
  AND id IN (SELECT VALUE ${F_USUARIO} FROM inscripcion WHERE activo = true);`;

/**
 * Lote de consultas del padrón completo. Van pegadas para que la hidratación
 * sea UNA sola ida y vuelta (ejecutarLote devuelve una lista por sentencia,
 * en este orden).
 */
const SQL_LOTE_HIDRATACION = [
  // 0 · sedes activas
  'SELECT * FROM sede WHERE activo = true ORDER BY creado_el;',
  // 1 · padrón con inscripción, tamizaje, apoderado y aporte por usuario
  SQL_PADRON,
  // 2 · casos sociales activos
  `SELECT *,
    ${F_CASO}.nombres AS p_nom,
    ${F_CASO}.apellidos AS p_ape,
    ${F_CASO}.codigo AS p_cod,
    sede_id.nombre AS s_nom
  FROM caso_social WHERE activo = true ORDER BY creado_el DESC;`,
  // 3 · solicitudes de cambio de etapa
  'SELECT * FROM solicitud_caso WHERE activo = true ORDER BY fecha_solicitud DESC;',
  // 4 · voluntariados activos
  'SELECT * FROM voluntario WHERE activo = true ORDER BY fecha_ingreso DESC;',
  // 5 · bitácora (últimos 500)
  'SELECT * FROM bitacora_auditoria ORDER BY timestamp DESC LIMIT 500;',
  // 6 · asistencia de hoy
  `SELECT inscripcion_id AS iid, estado FROM asistencia_diaria
  WHERE fecha >= time::floor(time::now(), 1d) AND fecha < time::floor(time::now(), 1d) + 1d;`,
].join('\n');

export async function hidratar(promedioSilencioso = false) {
  // Con una escritura en vuelo, el snapshot que traeria esta hidratacion es
  // anterior al cambio: se pospone hasta que la nube confirme.
  if (_escriturasEnVuelo > 0) {
    programarHidratacion();
    return;
  }
  if (_hidratando) return _hidratando;
  const versionAlSalir = _versionEscrituras;
  _hidratando = (async () => {
    cambiarEstado('cargando');
    try {
      // Un solo viaje: el lote completo cuesta 1 RTT en lugar de 6-8.
      const [sedesRaw, personasRaw, casosRaw, solicitudesRaw, voluntariosRaw, logsRaw, asistenciaRaw] =
        await ejecutarLote(SQL_LOTE_HIDRATACION);

      const sedes = mapearSedes(sedesRaw);
      const beneficiarios = mapearBeneficiarios(personasRaw, sedes);
      const casos = mapearCasos(casosRaw, solicitudesRaw);
      const voluntarios = mapearVoluntarios(voluntariosRaw);
      const logs = mapearBitacora(logsRaw);
      const asistencia = mapearAsistencia(asistenciaRaw, beneficiarios);

      // Segunda comprobacion: la escritura pudo empezar (o terminar) durante
      // el viaje. En cualquier caso este snapshot es anterior a ella.
      if (_escriturasEnVuelo > 0 || _versionEscrituras !== versionAlSalir) {
        programarHidratacion();
        return;
      }

      aplicarDatasets(beneficiarios, sedes, casos, voluntarios, logs, asistencia);
      _hidratado = true;
      _jsonDeReintento = 5000;
      // La nube volvió: el próximo corte puede avisar de nuevo.
      _avisoConexionMostrado = false;
      cambiarEstado('ok');
      document.dispatchEvent(new CustomEvent('pdi:datos-actualizados'));
      refrescarVistaActual();
      if (!promedioSilencioso) {
        console.log('[PDI] Sincronización completa con SurrealDB Cloud.',
          beneficiarios.length, 'usuarios ·', sedes.length, 'sedes ·',
          casos.length, 'casos ·', voluntarios.length, 'voluntarios ·', logs.length, 'eventos.');
      }
    } catch (err) {
      console.warn('[PDI] Hidratación fallida:', err?.message || err);
      cambiarEstado('sin_conexion');
      agendarReintento();
    } finally {
      _hidratando = null;
    }
  })();
  return _hidratando;
}

/** Alias de compatibilidad con Bootstrap. */
export async function hidratarDesdeSurreal() {
  if (_estado !== 'ok') return;
  await hidratar();
}

function aplicarDatasets(beneficiarios, sedes, casos, voluntarios, logs, asistencia) {
  const pdi = (typeof window !== 'undefined' && window.PDI) || {};
  pdi.BeneficiarioModel?.aplicarDatos?.(beneficiarios);
  pdi.SedeModel?.aplicarDatos?.(sedes);
  pdi.CasoSocialModel?.aplicarDatos?.(casos);
  pdi.VoluntarioModel?.aplicarDatos?.(voluntarios);
  pdi.AuditModel?.aplicarDatos?.(logs);
  pdi.CasitasController?.aplicarDatosAsistencia?.(asistencia);
  // AjustesView y las páginas leen Restaurar desde aqui.
  pdi.recopilacionNube = { beneficiarios, sedes, casos, voluntarios, logs, asistencia };
}

function refrescarVistaActual() {
  if (_estado !== 'ok') return;
  const fn = (typeof window !== 'undefined' && window.PDI?.refrescarVistaActual);
  if (typeof fn === 'function') fn();
  // Los badges del menu lateral salen de los modelos.
  (typeof window !== 'undefined' && window.PDI?.Bootstrap?.actualizarBadgesSidebar?.());
}

/** fuerza re-hidratación desde la nube (Botón "Restablecer datos" de Ajustes). */
export async function refrescarDesdeNube() {
  if (_estado !== 'ok') return;
  await hidratar();
}

// ---------------------------------------------------------------------------
//  Funciones utilitarias y mapeos de dominio
// ---------------------------------------------------------------------------
/**
 * Clave de registro utilizable en type::record('tabla', $clave).
 *
 * SurrealDB muestra entre corchetes angulares las claves que empiezan por
 * digito (caso_social:⟨53p9b0z...⟩). Partir por ':' devolvia "⟨53p9b0z...⟩"
 * CON los corchetes y type::record construia una clave distinta: el UPDATE
 * no encontraba ninguna fila, no lanzaba error y la escritura se perdia sin
 * aviso (el caso "vuelve solo" al recargar). Aqui se quitan los corchetes.
 */
function claveRegistro(rid) {
  return String(rid == null ? '' : rid).split(':').pop().replace(/^⟨/, '').replace(/⟩$/, '');
}

function extraerNumeroId(codigo, idStr, fallbackIdx) {
  if (codigo) {
    const parts = String(codigo).split('-');
    const last = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(last)) return last;
  }
  if (typeof idStr === 'string') {
    const num = parseInt(idStr.replace(/\D/g, ''), 10);
    if (!isNaN(num)) return num;
  }
  return fallbackIdx;
}

export function edadDesdeFecha(fecha) {
  if (!fecha) return '';
  const nacimiento = new Date(fecha);
  if (isNaN(nacimiento.getTime())) return '';
  const hoy = new Date();
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  const faltaCumple = hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!faltaCumple) anios--;
  return anios <= 1 ? '1 año' : `${anios} años`;
}

function isoFecha(fecha) {
  if (!fecha) return '';
  try {
    return new Date(fecha).toISOString().slice(0, 10);
  } catch (e) {
    return '';
  }
}

function textoTiempo(fecha) {
  if (!fecha) return '';
  try {
    const d = new Date(fecha);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (e) {
    return '';
  }
}

/** Etapas de caso: la nube es en_evaluacion/resuelto; la UI es evaluacion/cerrado. */
const ETAPA_NUBE_A_UI = { pendiente: 'pendiente', en_evaluacion: 'evaluacion', canalizado: 'canalizado', resuelto: 'cerrado' };
const ETAPA_UI_A_NUBE = { pendiente: 'pendiente', evaluacion: 'en_evaluacion', canalizado: 'canalizado', cerrado: 'resuelto' };

function etapaUi(etapaNube) {
  return ETAPA_NUBE_A_UI[etapaNube] || etapaNube || 'pendiente';
}

function etapaNubeDe(etapaUiValor) {
  return ETAPA_UI_A_NUBE[etapaUiValor] || 'pendiente';
}

function programaDesdeServicios(servicios, estrategia) {
  const junta = [...(servicios || []), estrategia || ''].join(' ').toLowerCase();
  const casita = junta.includes('casita') || junta.includes('educat') || junta.includes('acompañ');
  const nutricion = junta.includes('desayuno') || junta.includes('nutric') || junta.includes('alimento');
  const lonchera = junta.includes('lonchera');
  if (lonchera && !casita) return 'Lonchera Infantil';
  if (casita && nutricion) return 'Mixto';
  if (casita) return 'Casita del Saber';
  return 'Desayuno Infantil';
}

function resultadoDesdeAnemia(anemia) {
  // El catálogo de valores vive en AnemiaCalculator.resultadoDb: la nube exige
  // mayúscula inicial y nombres exactos ('Anemia leve', no 'anemia leve').
  return AnemiaCalculator.resultadoDb(anemia) || 'Regular';
}

function anemiaDesdeResultado(resultado) {
  const r = (resultado || '').toLowerCase();
  if (r.includes('moder')) return 'Moderada';
  if (r.includes('leve')) return 'Leve';
  if (r.includes('grave') || r.includes('sever')) return 'Severa';
  if (r.includes('riesgo')) return 'En riesgo';
  if (r.includes('regular') || r.includes('normal')) return 'Normal';
  return 'Sin tamizaje';
}

/** Convierte los tamizajes crudos de una persona en filas de historial.
 *  La nube devuelve la lista ordenada de mas reciente a mas antiguo y ese
 *  orden se conserva: el primero es el valor vigente. */
function mapearTamizajes(tamsCrudos) {
  if (!Array.isArray(tamsCrudos)) return [];
  return tamsCrudos.map(t => ({
    _tamizajeId: String(t.id),
    fecha: t.fecha_tamizaje || '',
    hb: t.hb_valor != null ? Number(t.hb_valor) : null,
    hbAjustada: t.hb_ajustada != null ? Number(t.hb_ajustada) : null,
    peso: t.peso_kg != null ? Number(t.peso_kg) : null,
    talla: t.talla_cm != null ? Number(t.talla_cm) : null,
    resultado: t.resultado || '',
    anemia: anemiaDesdeResultado(t.resultado),
    sedeId: t.sede_id ? String(t.sede_id) : '',
  }));
}

/** Aviso reutilizable cuando la nube rechaza una escritura. */
function avisarFallo(operacion, err) {
  const detalle = err?.message || String(err || 'Error desconocido');
  console.error('[PDI] Fallo al escribir en SurrealDB (' + operacion + '):', detalle);
  
  // Traducciones amigables para errores técnicos comunes
  let mensajeAmigable = detalle;
  if (detalle.includes('no such field')) {
    mensajeAmigable = 'Error al guardar: algunos campos no están disponibles en la base de datos. Contacte al administrador.';
  } else if (detalle.includes('Transaction conflict') || detalle.includes('Resource busy')) {
    mensajeAmigable = 'La operación no se pudo completar por falta de espacio temporal. Intente de nuevo en un momento.';
  } else if (detalle.includes('Found field') && detalle.includes('does not exist')) {
    mensajeAmigable = 'Error de sincronización de datos. Por favor, recargue la página e intente de nuevo.';
  }
  
  try {
    ToastView.show('No se pudo guardar en la base de datos', `${operacion}: ${mensajeAmigable}`.slice(0, 160), 'danger');
  } catch (e) {
    // Si ToastView no está listo, el error queda en consola.
  }
  return null;
}

// ---------------------------------------------------------------------------
//  LECTURAS (fetch + mapeo fiel)
// ---------------------------------------------------------------------------
/** Obtiene el directorio de Sedes desde SurrealDB. */
export async function fetchSedes() {
  return mapearSedes(comoLista(await ejecutar('SELECT * FROM sede WHERE activo = true ORDER BY creado_el;')));
}

/** Convierte los registros crudos de sedan en objetos del modelo. */
function mapearSedes(raw) {
  return raw.map((s, idx) => {
    const sid = String(s.id);
    const slug = slugDeSede(s.nombre);
    return {
      _rawId: sid,
      id: slug || extraerNumeroId(null, sid, idx + 1),
      nombre: s.nombre || '',
      distrito: s.distrito || 'Comas',
      direccion: s.direccion || '',
      referencia: s.referencia || '',
      facilitadora: s.facilitadora_nombre || '',
      facilitadoraCargo: 'Facilitadora Comunitaria PDI',
      facilitadoraTel: s.facilitadora_tel || '',
      iglesiaAliada: s.aliado_nombre || '',
      pastorAliado: '',
      aliadoTel: s.facilitadora_tel || '',
      tipoAliado: s.aliado_institucion || s.tipo_local || '',
      servicios: Array.isArray(s.servicios) ? s.servicios : [],
      aforoMax: s.aforo_max || 0,
      horario: s.horario || '',
      estado: s.estado || 'Operativa',
      coordenadas: s.coordenadas || null,
    };
  });
}

/** Id estable de una sede a partir de su nombre (compatibilidad URL). */
function slugDeSede(nombre) {
  if (!nombre) return null;
  const slug = String(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `sede-${slug}` : null;
}

/** Obtiene el Padrón de Usuarios Beneficiarios con inscripción, tamizaje y apoderado. */
export async function fetchBeneficiarios() {
  const sedes = await fetchSedes();
  return mapearBeneficiarios(comoLista(await ejecutar(SQL_PADRON)), sedes);
}

/** Convierte los registros crudos de persona en objetos del modelo (requiere sedes ya mapeadas). */
function mapearBeneficiarios(personasRes, sedes) {
  const sedesMap = new Map(sedes.map(s => [s._rawId, s]));

  const personasRaw = personasRes.filter(m => m.ins);

  return personasRaw.map((m, idx) => {
    const idNum = extraerNumeroId(m.codigo, String(m.id), idx + 1);
    const sedeObj = sedesMap.get(String(m.ins?.sede_id)) || null;
    const prog = m.ins?.programa || 'Desayuno Infantil';

    // La estrategia son varias. La nube las guarda como arreglo; si el dato
    // es anterior a ese cambio, se reconstruyen desde el programa guardado.
    const estrategias = Array.isArray(m.ins?.estrategias) && m.ins.estrategias.length
      ? m.ins.estrategias
      : estrategiasDesdePrograma(prog);
    const estrategia = estrategias.join(' + ');

    let servicios = ['Servicio Alimentario Nutricional'];
    if (prog === 'Mixto') {
      servicios = ['Servicio Alimentario Nutricional', 'Casita del Saber'];
    } else if (prog === 'Casita del Saber') {
      servicios = ['Casita del Saber'];
    } else if (prog === 'Lonchera Infantil') {
      servicios = ['Servicio Alimentario Nutricional', 'Lonchera Saludable'];
    }

    const apoderadoNom = m.apo ? `${m.apo.c_nom || ''} ${m.apo.c_ape || ''}`.trim() : '';
    const parentescoApo = m.apo?.parentesco ? normalizarParentesco(m.apo.parentesco) : '';
    // La alergia vigente es la de mayor gravedad entre las que la persona tiene.
    const alergiaVigente = alergiaPrincipal(m.alergias);

    // El tamizaje vigente es el mas reciente de la lista completa; la lista
    // entera viaja en b.tamizajes para el historial de salud.
    const tam = Array.isArray(m.tams) && m.tams.length ? m.tams[0] : null;
    const colegioOrigen = [
      m.institucion_origen_nombre,
      m.institucion_origen?.nombre,
      m.colegio,
    ].find(nombre => typeof nombre === 'string' && nombre.trim());

    return {
      _personaId: String(m.id),
      _inscripcionId: m.ins ? String(m.ins.id) : '',
      _tamizajeId: tam ? String(tam.id) : '',
      _sedeRawId: sedeObj ? sedeObj._rawId : '',
      id: idNum,
      codigo: m.codigo || '',
      nombres: m.nombres || '',
      apellidos: m.apellidos || '',
      dni: m.numero_documento || '',
      fechaNacimiento: isoFecha(m.fecha_nacimiento),
      edad: edadDesdeFecha(m.fecha_nacimiento),
      sexo: m.sexo || '',
      fotoUrl: m.foto_url || '',
      direccion: m.direccion || '',
      referencia: m.referencia || '',
      distrito: sedeObj?.distrito || m.distrito || '',
      sede: sedeObj?.nombre || '',
      modalidad: modalidadDbAUi(m.ins?.modalidad),
      estrategia,
      estrategias,
      exoneracionAporte: exoneracionDesdePct(m.pct),
      servicios,
      seguro: seguroDbAUi(m.esquema_salud),
      centroSalud: m.centro_salud_nombre || '',
      alergias: resumenAlergias(m.alergias),
      alergiaDescripcion: descripcionAlergia(alergiaVigente?.descripcion),
      alergiaTipo: tipoAlergiaCanonico(alergiaVigente?.tipo),
      alergiaSeveridad: severidadAlergiaCanonico(alergiaVigente?.severidad),
      nivelEducativo: m.nivel_educativo || '',
      grado: m.grado || '',
      colegio: colegioOrigen ? colegioOrigen.trim() : '',
      tipoDocumento: m.tipo_documento || 'DNI',
      tipoAtencion: m.ins?.tipo_atencion || '',
      apoderado: apoderadoNom,
      parentesco: parentescoApo,
      apoderadoDni: m.apo?.c_dni || '',
      sexoApoderado: m.apo?.c_sexo || '',
      telefono: m.telefono || '',
      telefonoAlt: m.telefono_alt || '',
      estado: m.ins?.estado || 'Activo',
      hb: tam?.hb_valor != null ? Number(tam.hb_valor) : null,
      peso: tam?.peso_kg != null ? Number(tam.peso_kg) : null,
      talla: tam?.talla_cm != null ? Number(tam.talla_cm) : null,
      anemia: anemiaDesdeResultado(tam?.resultado),
      tamizajes: mapearTamizajes(m.tams),
      canastaEntregada: null,
      orientacionFamiliar: null,
      retiroAutorizado: apoderadoNom ? `${apoderadoNom}${parentescoApo ? ' (' + parentescoApo + ')' : ''}` : '',
      retiroPadron: apoderadoNom ? [{
        acreditado: apoderadoNom,
        parentesco: parentescoApo,
        dni: m.apo?.c_dni || '',
        telefono: m.telefono || '',
        autorizadoPor: 'Dirección PDI',
        estado: 'Acreditado',
      }] : [],
    };
  });
}

/** Obtiene los Casos Sociales (ASP) y sus solicitudes de cambio de etapa. */
export async function fetchCasosSociales() {
  return mapearCasos(
    comoLista(await ejecutar(`SELECT *, ${F_CASO}.nombres AS p_nom, ${F_CASO}.apellidos AS p_ape, ${F_CASO}.codigo AS p_cod, sede_id.nombre AS s_nom FROM caso_social WHERE activo = true ORDER BY creado_el DESC;`)),
    comoLista(await ejecutar('SELECT * FROM solicitud_caso WHERE activo = true ORDER BY fecha_solicitud DESC;')),
  );
}

/** Convierte los registros crudos de caso social en objetos del modelo. */
function mapearCasos(casosRaw, solicitudesRaw) {
  const porCaso = new Map();
  solicitudesRaw.forEach(s => {
    const clave = String(s.caso_id);
    if (!porCaso.has(clave)) porCaso.set(clave, []);
    porCaso.get(clave).push(s);
  });

  return casosRaw.map((c, idx) => {
    const idNum = c.id_numerico || extraerNumeroId(c.codigo_caso, String(c.id), 101 + idx);
    const usuarioNom = c.p_nom && c.p_ape ? `${c.p_nom} ${c.p_ape}` : '';
    const listaSol = porCaso.get(String(c.id)) || [];

    const historial = listaSol.map(s => ({
      id: s.codigo_solicitud || String(s.id),
      evento: s.estado === 'pendiente' ? 'solicitud' : s.estado,
      etapaOrigen: etapaUi(s.etapa_origen),
      etapaDestino: etapaUi(s.etapa_destino),
      solicitadoPor: s.solicitado_por,
      cargoSolicitante: s.cargo_solicitante,
      fecha: textoTiempo(s.fecha_solicitud),
      motivo: s.motivo || 'Solicitud de transición de etapa',
      resueltoPor: s.resuelto_por || null,
      cargoResuelve: s.cargo_resuelve || null,
      comentario: s.comentario_resolucion || '',
    })).reverse();

    const pendiente = listaSol.find(s => s.estado === 'pendiente');
    const resuelta = listaSol.filter(s => s.estado !== 'pendiente')
      .sort((a, b) => (b.fecha_resolucion || '').localeCompare(a.fecha_resolucion || ''))[0];

    const retorna = {
      _casoId: String(c.id),
      _personaId: c[F_CASO] ? String(c[F_CASO]) : '',
      _sedeRawId: c.sede_id ? String(c.sede_id) : '',
      id: idNum,
      beneficiarioId: idNum,
      usuario: usuarioNom,
      codigo: c.p_cod || c.codigo_caso || '',
      etapa: etapaUi(c.etapa),
      urgencia: c.urgencia || 'Media',
      tipoProblematica: c.tipo_problematica || '',
      fechaDerivacion: isoFecha(c.fecha_derivacion),
      quienDeriva: {
        nombre: c.quien_deriva_nombre || '',
        cargo: c.quien_deriva_cargo || '',
        telefono: c.quien_deriva_tel || '',
      },
      situacionEncontrada: c.situacion_encontrada || '',
      accionesPrevias: c.acciones_previas || '',
      soporteFamiliar: {
        tiene: c.tiene_soporte_familiar ?? false,
        detalle: c.detalle_soporte_familiar || '',
      },
      detalle: c.situacion_encontrada || '',
      sede: c.s_nom || '',
      vulnerabilidadPuntaje: c.urgencia === 'Alta' ? 90 : (c.urgencia === 'Media' ? 70 : 45),
    };
    if (pendiente) {
      retorna.solicitudCambio = {
        id: pendiente.codigo_solicitud || String(pendiente.id),
        etapaOrigen: etapaUi(pendiente.etapa_origen),
        etapaDestino: etapaUi(pendiente.etapa_destino),
        solicitadoPor: pendiente.solicitado_por,
        cargoSolicitante: pendiente.cargo_solicitante,
        fechaSolicitud: textoTiempo(pendiente.fecha_solicitud),
        motivo: pendiente.motivo || 'Solicitud de transición de etapa',
        estado: 'pendiente',
      };
    }
    if (resuelta) {
      retorna.ultimaResolucion = {
        id: resuelta.codigo_solicitud || String(resuelta.id),
        etapaOrigen: etapaUi(resuelta.etapa_origen),
        etapaDestino: etapaUi(resuelta.etapa_destino),
        solicitadoPor: resuelta.solicitado_por,
        cargoSolicitante: resuelta.cargo_solicitante,
        fechaSolicitud: textoTiempo(resuelta.fecha_solicitud),
        motivo: resuelta.motivo || 'Solicitud de transición de etapa',
        estado: resuelta.estado,
        fechaResolucion: textoTiempo(resuelta.fecha_resolucion),
        resueltoPor: resuelta.resuelto_por,
        cargoResuelve: resuelta.cargo_resuelve,
        comentarioResolucion: resuelta.comentario_resolucion || '',
      };
    }
    if (historial.length) retorna.historialSolicitudes = historial;
    return retorna;
  });
}

/** Padrón de voluntariados. */
export async function fetchVoluntarios() {
  return mapearVoluntarios(comoLista(await ejecutar('SELECT * FROM voluntario WHERE activo = true ORDER BY fecha_ingreso DESC;')));
}

/** Convierte los registros crudos de voluntario en objetos del modelo. */
function mapearVoluntarios(volRaw) {
  return volRaw.map((v, idx) => {
    const sede = v.sede_nombre || '';
    return {
      _qid: String(v.id),
      id: extraerNumeroId(v.codigo, String(v.id), idx + 1),
      codigo: v.codigo || '',
      nombres: v.nombres || '',
      apellidos: v.apellidos || '',
      dni: v.numero_documento || '',
      celular: v.telefono || '',
      fechaNacimiento: isoFecha(v.fecha_nacimiento),
      edad: v.edad ?? '',
      domicilio: v.direccion || '',
      distrito: v.distrito || distritoDeSede(sede) || 'Comas',
      sedeAsignada: sede,
      sedeRegistrada: !sede || sedeConocida(sede),
      sedeEtiqueta: sede ? etiquetaSede(sede) : 'Sin sede',
      servicio: v.servicio || '',
      rol: v.rol || '',
      estrategia: v.estrategia || 'Atención Fija',
      tipoVoluntariado: v.tipo_voluntariado || '',
      capacitaciones: Array.isArray(v.capacitaciones) ? v.capacitaciones : [],
      canastasRecibidas: v.canastas_recibidas ?? 0,
      fechaIngreso: isoFecha(v.fecha_ingreso),
      estado: v.estado || 'Activo',
      disponibilidad: v.disponibilidad || 'Disponibilidad estándar',
      observaciones: v.observaciones || '',
    };
  });
}

/** Bitácora de auditoría. */
export async function fetchBitacora() {
  return mapearBitacora(comoLista(await ejecutar('SELECT * FROM bitacora_auditoria ORDER BY timestamp DESC LIMIT 500;')));
}

/** Convierte los registros crudos de bitácora en objetos del modelo. */
function mapearBitacora(raw) {
  return raw.map((b, i) => ({
    id: 'LOG-' + String(i + 1).padStart(4, '0'),
    timestamp: textoTiempo(b.timestamp),
    user: b.usuario_nombre || 'Sistema',
    role: b.rol || 'Sistema',
    action: b.accion || '',
    entity: b.registro_id || '',
    detail: b.detalle || '',
    status: 'Registrado',
    ip: b.ip_origen || '',
    sede: b.sede_nombre || 'Central',
    diff: Array.isArray(b.diff) && b.diff.length ? b.diff[0] : null,
  }));
}

/** Asistencia de hoy para la Casita del Saber: { [beneficiarioId]: 'P'|'T'|'FJ'|'FI' } */
export async function fetchAsistencia() {
  return mapearAsistencia(
    comoLista(await ejecutar(`SELECT inscripcion_id AS iid, estado FROM asistencia_diaria
      WHERE fecha >= time::floor(time::now(), 1d) AND fecha < time::floor(time::now(), 1d) + 1d;`)),
    (window.PDI?.BeneficiarioModel?.getAll?.() || []),
  );
}

/** Convierte los registros crudos de asistencia en { [beneficiarioId]: estado }. */
function mapearAsistencia(raw, beneficiarios) {
  const mapa = {};
  raw.forEach(r => {
    if (!r.iid) return;
    const s = String(r.iid);
    for (const b of (beneficiarios || [])) {
      if (b._inscripcionId === s && r.estado) mapa[b.id] = r.estado;
    }
  });
  return mapa;
}

// ---------------------------------------------------------------------------
//  CRUD · Padrón de beneficiarios
// ---------------------------------------------------------------------------
/** Verifica documento duplicado y crea usuario + inscripción + apoderado + aporte. */
/**
 * Correlativo oficial del usuario: cuatro dígitos, "-IS" y el año, tal como lo
 * pide la ficha de inscripción A1 del programa (0001-IS2026). El correlativo
 * sale de la base y no del índice en memoria: la base es la que ordena, y así
 * dos altas seguidas no se pisan el número.
 */
async function correlativoUsuario() {
  const anio = new Date().getFullYear();
  const sufijo = `-IS${anio}`;
  const existentes = comoLista(await ejecutar(
    'SELECT VALUE codigo FROM persona WHERE codigo != NONE AND string::ends_with(codigo, $sufijo);',
    { sufijo },
  ));
  const mayor = existentes.reduce((max, codigo) => {
    const numero = parseInt(String(codigo).slice(0, 4), 10);
    return Number.isFinite(numero) && numero > max ? numero : max;
  }, 0);
  return `${String(mayor + 1).padStart(4, '0')}${sufijo}`;
}

/**
 * Qué admite ahora mismo el esquema de `inscripcion`.
 *
 * El Lote 3 cambia dos cosas que el esquema todavía no tiene aplicadas: la
 * modalidad del programa ("I.E." en vez de "Institucion Educativa") y la
 * modalidad de atención, que solo existe en Casita del Saber y por tanto puede
 * quedar vacía. Para que un alta no se caiga por un detalle de esquema, se
 * escribe el valor canónico cuando el esquema lo admite y el valor anterior
 * cuando todavía no: en cuanto se aplique la migración, la app empieza a
 * guardar la forma nueva sin tocar nada más.
 */
let _esquemaInscripcion = null;

async function esquemaInscripcion() {
  if (_esquemaInscripcion) return _esquemaInscripcion;
  const [info] = await ejecutar('INFO FOR TABLE inscripcion;');
  const definiciones = info?.fields || {};
  const admitidos = (campo) => {
    const m = String(definiciones[campo] || '').match(/INSIDE\s+\[(.*?)\]/s);
    if (!m) return null;
    return m[1].split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  };
  _esquemaInscripcion = {
    modalidad: admitidos('modalidad'),
    tipo_atencion: admitidos('tipo_atencion'),
  };
  return _esquemaInscripcion;
}

/** La modalidad que el esquema admite hoy: la del programa si ya puede. */
async function modalidadGuardable(valor) {
  const esquema = await esquemaInscripcion();
  if (!esquema.modalidad) return valor;
  return esquema.modalidad.includes(valor) ? valor : 'Institución Educativa';
}

/** La modalidad de atención: vacía solo si el esquema ya lo permite. */
async function tipoAtencionGuardable(valor) {
  const esquema = await esquemaInscripcion();
  if (!esquema.tipo_atencion) return valor; // el campo admite vacio
  return valor || 'Atención fija';
}

export async function crearBeneficiario(m) {
  const documento = (m.dni || '').trim();
  if (documento) {
    try {
      const dup = comoLista(await ejecutar(
        'SELECT id FROM persona WHERE numero_documento = $doc LIMIT 1;', { doc: documento }));
      if (dup.length) {
        avisarFallo('DNI duplicado', `El documento ${documento} ya está registrado en el Padrón.`);
        return null;
      }
    } catch (err) {
      return avisarFallo('Registro de usuario', err);
    }
  }

  // El codigo lo pone la base con el formato del programa. Solo se respeta el
  // que trae la ficha si ya viene en ese formato (importaciones y semillas).
  const cod = /^\d{4}-IS\d{4}$/.test(String(m.codigo || ''))
    ? String(m.codigo)
    : await correlativoUsuario();
  // La estrategia son varias: se guardan todas y `programa` sigue siendo el
  // resumen que usan los reportes y el indice unico.
  const progInscripcion = programaDesdeServicios(m.servicios, m.estrategia);
  const estrategiasInscripcion = (Array.isArray(m.estrategias) && m.estrategias.length)
    ? m.estrategias
    : estrategiasDesdePrograma(progInscripcion);
  const tipoDoc = !documento
    ? 'Sin Documento'
    : tipoDocumentoCanonico(m.tipoDocumento, true);
  const params = {
    cod,
    nom: (m.nombres || '').trim(),
    ape: (m.apellidos || '').trim(),
    doc: documento || 'Sin DNI-' + Date.now(),
    tipoDoc,
    fnac: m.fechaNacimiento || new Date().toISOString().slice(0, 10),
    sexo: (m.sexo || 'M').toUpperCase().includes('F') ? 'F' : 'M',
    dir: m.direccion || '',
    ref: m.referencia || null,
    dist: ['Comas', 'Carabayllo'].includes(m.distrito) ? m.distrito : 'Comas',
    tel: m.telefono || null,
    tel2: (m.telefonoAlt && m.telefonoAlt !== '-') ? m.telefonoAlt : null,
    niv: m.nivelEducativo || 'Inicial',
    // El grado se elige de la lista del nivel: si no hay, se guarda vacio en
    // vez de inventar "Inicial 4 años", que ensuciaba los reportes.
    grado: m.grado || '',
    seg: seguroUiADb(m.seguro),
    prog: progInscripcion,
    estrategias: estrategiasInscripcion,
    mod: modalidadUiADb(m.modalidad),
    periodo: new Date().getFullYear(),
    estado: ['Activo', 'Inactivo', 'Graduado', 'Trasladado', 'Retirado'].includes(m.estado) ? m.estado : 'Activo',
  };

  try {
    // 0) La inscripción exige una sede real: sin sede en la nube no se inscribe.
    const sedeFound = comoLista(await ejecutar(
      'SELECT id, distrito FROM sede WHERE nombre = $sedeNom LIMIT 1;', {
      sedeNom: m.sede || '',
    }));
    if (!sedeFound.length) {
      return avisarFallo('Registro de usuario', `La sede "${m.sede || '(vacío)'}" no existe en la nube. Créala en el Directorio Territorial primero.`) === null ? null : null;
    }
    params.sid = claveRegistro(sedeFound[0].id);
    // El distrito operativo sale de la sede, no de lo que haya quedado escrito
    // a mano en la ficha. Si la sede no lo trae, se conserva el valor previo.
    params.dist = sedeFound[0].distrito || params.dist;

    // 0.1) Salud y educación: el centro de salud y la I.E. son registros de
    //      institucion. Se crean o reutilizan antes de la transacción para no
    //      dejar el alta a medias si el nombre no se puede guardar.
    const centroNombre = String(m.centroSalud || '').trim();
    if (centroNombre) {
      params.centroId = await asegurarInstitucion(centroNombre, 'Centro de Salud', params.dist) || '';
      if (!params.centroId) return null;
    }
    const colegioNombre = String(m.colegio || '').trim();
    if (colegioNombre) {
      params.colegioId = await asegurarInstitucion(colegioNombre, 'Institucion Educativa', params.dist) || '';
      if (!params.colegioId) return null;
    }
    params.centroId = params.centroId || '';
    params.colegioId = params.colegioId || '';
    // La alergia no es un campo de la persona: es un registro propio con tipo
    // y gravedad. "Ninguna" no genera ninguno.
    params.algDesc = descripcionAlergia(m.alergia?.descripcion ?? m.alergias);
    params.algTipo = tipoAlergiaCanonico(m.alergia?.tipo);
    params.algSev = severidadAlergiaCanonico(m.alergia?.severidad);
    // La modalidad de atencion solo existe en Casita del Saber; en los demas
    // servicios se guarda vacia, como en la ficha del programa.
    params.tipoAtencion = String(m.tipoAtencion || '').trim() || null;
    params.tipoAtencionGuardable = await tipoAtencionGuardable(params.tipoAtencion);
    params.modalidadGuardable = await modalidadGuardable(modalidadUiADb(m.modalidad));

    // 1) Apoderado: se crea (o reutiliza) ANTES de la transacción, porque los
    //    consentimientos lo requieren como firmante.
    const nomAp = (m.apoderado || '').trim();
    let cuiId = null;
    if (nomAp) {
      cuiId = await asegurarPersonaCuidador({
        nombres: nomAp,
        documento: m.apoderadoDni || '',
        parentesco: m.parentesco || 'Madre',
        sexo: m.sexoApoderado || '',
      });
      if (!cuiId) return avisarFallo('Registro de usuario', 'No se pudo registrar al apoderado (revisa su DNI).') === null ? null : null;
    }

    // 2) Transacción: usuario + inscripción + vínculo + consentimiento + aporte.
    const pct = pctDesdeExoneracion(m.exoneracionAporte);
    const hb = m.hb != null && m.hb !== '' && !isNaN(Number(m.hb)) ? Number(m.hb) : null;

    const res = await ejecutar(`
      LET $sede = type::record('sede', $sid);
      LET $usuario = array::first((CREATE persona CONTENT {
        tipo_documento: $tipoDoc, codigo: $cod,
        nombres: $nom, apellidos: $ape, numero_documento: $doc,
        fecha_nacimiento: type::datetime($fnac), sexo: $sexo,
        direccion: $dir, referencia: $ref ?? NONE, distrito: $dist,
        telefono: $tel ?? NONE, telefono_alt: $tel2 ?? NONE,
        nivel_educativo: $niv, grado: $grado,
        esquema_salud: $seg,
        centro_salud: IF string::len($centroId) > 0 { type::record('institucion', $centroId) } ELSE { NONE },
        institucion_origen: IF string::len($colegioId) > 0 { type::record('institucion', $colegioId) } ELSE { NONE },
        foto_url: $foto ?? NONE,
        activo: true
      } RETURN VALUE id));
      IF string::len($algDesc) > 0 {
        CREATE alergia CONTENT {
          persona_id: $usuario, tipo: $algTipo, severidad: $algSev,
          descripcion: $algDesc, activo: true
        };
      };
      LET $ins = array::first((CREATE inscripcion CONTENT {
        ${F_USUARIO}: $usuario, sede_id: $sede,
        periodo: $periodo, programa: $prog, estrategias: $estrategias,
        modalidad: $modalidadGuardable,
        tipo_atencion: $tipoAtencionGuardable ?? NONE, estado: $estado,
        activo: true
      } RETURN VALUE id));
      IF string::len($cuiId) > 0 {
        CREATE ${T_VINCULO} CONTENT {
          ${F_MENOR}: $usuario, cuidador_id: type::record('persona', $cuiId),
          parentesco: $par, rol_vinculo: 'Responsable', ${F_VIVE_CON}: true
        };
        CREATE consentimiento CONTENT {
          ${F_USUARIO}: $usuario, ${F_FIRMANTE}: type::record('persona', $cuiId),
          periodo: $periodo,
          eval_social: $cEval, uso_fotografia: $cFoto,
          recaudacion_fondos: $cFondos, flujo_transfronterizo: $cFlujo,
          firmado: true
        };
      };
      CREATE aporte CONTENT {
        inscripcion_id: $ins,
        periodo: $periodo,
        mes: $mes,
        pct_exoneracion: $pct,
        exonerado: IF $pct = 100 { true } ELSE { false },
        monto_simbolico: 0f,
        fecha_pago: NONE
      };
      IF string::len($hbStr) > 0 {
        CREATE tamizaje_hemoglobina CONTENT {
          ${F_USUARIO}: $usuario, sede_id: $sede,
          inscripcion_id: $ins,
          resultado: $res,
          hb_valor: type::decimal($hbStr), hb_ajustada: type::decimal($hbStr),
          msnm: 150, activo: true
        };
      };
      RETURN { usuario: $usuario, ins: $ins };
    `, {
      ...params,
      foto: m.fotoUrl || null,
      cuiId: cuiId ? claveRegistro(cuiId) : '',
      par: normalizarParentesco(m.parentesco || 'Otro'),
      cEval: m.consentimientos?.evaluacionSocial ?? true,
      cFoto: m.consentimientos?.usoFotografia ?? true,
      cFondos: m.consentimientos?.gestionDonaciones ?? true,
      cFlujo: m.consentimientos?.flujoTransfronterizo ?? true,
      mes: new Date().getMonth() + 1,
      pct,
      res: resultadoDesdeAnemia(m.anemia),
      hbStr: hb != null ? String(hb) : '',
    });

    const lista = comoLista(res);
    const paquete = lista.find(x => x && typeof x === 'object' && (x.usuario || x.ins)) || null;
    return { ok: true, personaId: paquete?.usuario ?? null, codigo: cod };
  } catch (err) {
    return avisarFallo('Registro de usuario', err);
  }
}

/**
 * Registra una nueva prueba de hemoglobina en el historial del usuario.
 * Append-only: no toca ni anula tamizajes previos; el vigente siempre es el de
 * fecha mas reciente con activo = true. El resultado (semáforo MINSA) lo
 * calcula la vista con AnemiaCalculator antes de llamar aqui; si no viene, se
 * deduce del diagnostico con el mismo mapeo que usa el alta inicial.
 */
export async function crearTamizaje(m) {
  try {
    const hoy = new Date();
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    // Los ids crudos llegan como 'tabla:id' o ':id'; la base quiere el sufijo.
    const pid = claveRegistro(m._personaId);
    const insId = m._inscripcionId ? claveRegistro(m._inscripcionId) : '';
    const sedId = m._sedeRawId ? claveRegistro(m._sedeRawId) : '';
    await ejecutar(`
      CREATE tamizaje_hemoglobina CONTENT {
        ${F_USUARIO}: type::record('persona', $pid),
        inscripcion_id: IF string::len($insId) > 0 { type::record('inscripcion', $insId) } ELSE { NONE },
        sede_id: IF string::len($sedId) > 0 { type::record('sede', $sedId) } ELSE { NONE },
        fecha_tamizaje: type::datetime($fecha),
        resultado: $res,
        hb_valor: type::decimal($hbStr), hb_ajustada: type::decimal($hbStr),
        peso_kg: IF string::len($pesoStr) > 0 { type::decimal($pesoStr) } ELSE { NONE },
        talla_cm: IF string::len($tallaStr) > 0 { type::decimal($tallaStr) } ELSE { NONE },
        msnm: 150, activo: true
      };`, {
      pid,
      insId,
      sedId,
      fecha: (m.fecha || fechaHoy) + 'T12:00:00Z',
      res: AnemiaCalculator.resultadoDb(m.resultado) || resultadoDesdeAnemia(m.anemia),
      hbStr: String(m.hb),
      pesoStr: m.peso != null && m.peso !== '' ? String(m.peso) : '',
      tallaStr: m.talla != null && m.talla !== '' ? String(m.talla) : '',
    });
    return true;
  } catch (err) {
    return avisarFallo('Registro de tamizaje', err) !== null;
  }
}

/**
 * Desactiva un tamizaje (soft delete: activo = false). Solo toca el campo que
 * el esquema en la nube ya conoce; el motivo de la desactivacion es un dato de
 * auditoria y como tal queda registrado en bitacora_auditoria, no aqui.
 * La lista de tamizajes de SQL_PADRON filtra activo = true, asi que la prueba
 * desaparece del historial en la proxima hidratacion.
 */
export async function desactivarTamizaje(tamId) {
  try {
    const tid = claveRegistro(tamId);
    if (!tid) return false;
    await ejecutar(`UPDATE tamizaje_hemoglobina SET activo = false
      WHERE id = type::record('tamizaje_hemoglobina', $tid);`, { tid });
    return true;
  } catch (err) {
    return avisarFallo('Desactivación de tamizaje', err) !== null;
  }
}

/** Normaliza el sexo explícito de la ficha; devuelve '' si no viene. */
function normalizarSexoPersona(sexo) {
  const s = String(sexo || '').trim().toLowerCase();
  if (s === 'f' || s === 'femenino' || s === 'mujer') return 'F';
  if (s === 'm' || s === 'masculino' || s === 'hombre' || s === 'varon' || s === 'varón') return 'M';
  return '';
}

/** Crea al apoderado si no existe (DNI único) y devuelve su record id completo. */
async function asegurarPersonaCuidador(apoderado) {
  try {
    const sexoExplicito = normalizarSexoPersona(apoderado.sexo);
    const esVaron = /padre|abuelo|tio|tío|padrastro|padrasto/i.test(apoderado.parentesco || '');
    // Si la llamada no trae sexo (flujos antiguos), se conserva la inferencia
    // por parentesco. La ficha nueva lo exige y manda el valor explícito.
    const sexo = sexoExplicito || (esVaron ? 'M' : 'F');
    if (apoderado.documento) {
      const found = comoLista(await ejecutar(
        'SELECT id FROM persona WHERE numero_documento = $doc LIMIT 1;', { doc: apoderado.documento }));
      if (found.length) {
        const id = String(found[0].id);
        // Si la ficha trae sexo explícito, se corrige el registro existente.
        if (sexoExplicito) {
          await ejecutar('UPDATE type::record($rid) SET sexo = $sexo;', { rid: id, sexo });
        }
        return id;
      }
    }
    // La ficha guarda al apoderado como un solo nombre completo: se reparte en
    // nombres/apellidos (el esquema de la nube exige ambos no vacíos).
    const partes = String(apoderado.nombres || 'Apoderado').trim().split(/\s+/);
    const nom = partes[0] || 'Apoderado';
    const ape = partes.slice(1).join(' ') || 'No registrado';
    const doc = apoderado.documento || 'Sin DNI-' + Date.now();
    const res = await ejecutar(`CREATE persona CONTENT {
      tipo_documento: $tipoDoc,
      codigo: $cod,
      nombres: $nom,
      apellidos: $ape,
      numero_documento: $doc,
      fecha_nacimiento: type::datetime('1991-01-01'),
      sexo: $sexo,
      direccion: '', distrito: 'Comas',
      activo: true
    } RETURN VALUE id;`, {
      tipoDoc: doc.startsWith('Sin DNI') ? 'Sin Documento' : 'DNI',
      cod: 'APO-' + Date.now(),
      nom,
      ape,
      doc,
      sexo,
    });
    const lista = comoLista(res);
    return lista.length ? 'persona:' + claveRegistro(lista[0].id ?? lista[0]) : null;
  } catch (err) {
    return avisarFallo('Registro del apoderado', err) === null ? null : null;
  }
}

/** Crea o reutiliza una institución por nombre y tipo; devuelve su id corto. */
async function asegurarInstitucion(nombre, tipo, distrito) {
  const limpio = String(nombre || '').trim();
  if (!limpio) return null;
  try {
    const found = comoLista(await ejecutar(
      'SELECT id FROM institucion WHERE nombre = $nombre AND tipo = $tipo LIMIT 1;',
      { nombre: limpio, tipo },
    ));
    if (found.length) return claveRegistro(found[0].id);

    const res = await ejecutar(`CREATE institucion CONTENT {
      nombre: $nombre, tipo: $tipo, distrito: $distrito, activo: true
    } RETURN VALUE id;`, {
      nombre: limpio,
      tipo,
      distrito: ['Comas', 'Carabayllo', 'Otro'].includes(distrito) ? distrito : 'Comas',
    });
    const lista = comoLista(res);
    return lista.length ? claveRegistro(lista[0].id ?? lista[0]) : null;
  } catch (err) {
    avisarFallo('Registro de institución', err);
    return null;
  }
}

/**
 * Guarda la alergia de una persona. El modelo es una sola alergia vigente:
 * si el registro venía con más de una (importación o edición a mano), se
 * conserva la de mayor gravedad y las demás quedan dadas de baja. Sin
 * alergia (descripción vacía o "Ninguna") se da de baja, nunca se borra: la
 * Ley 29733 prohibe borrar datos de salud de los usuarios.
 */
async function guardarAlergia(personaId, entrada, motivo) {
  const descripcion = descripcionAlergia(entrada?.descripcion);
  const tipo = tipoAlergiaCanonico(entrada?.tipo);
  const severidad = severidadAlergiaCanonico(entrada?.severidad);
  try {
    const registros = comoLista(await ejecutar(
      "SELECT * FROM alergia WHERE persona_id = type::record('persona', $pid);",
      { pid: personaId },
    ));
    const vigentes = (registros || []).filter((r) => r && r.activo !== false);
    if (!descripcion) {
      for (const registro of vigentes) {
        await ejecutar(
          'UPDATE type::record($rid) SET activo = false, fecha_baja = time::now(), motivo_baja = $motivo;',
          { rid: String(registro.id), motivo: motivo || 'Sin alergia registrada' },
        );
      }
      return true;
    }
    // Una alergia a medias (sin tipo o sin gravedad) no se registra: no sirve
    // para decidir en una urgencia y ensucia el padrón.
    if (!tipo || !severidad) return false;
    const principal = alergiaPrincipal(vigentes);
    if (principal) {
      await ejecutar(
        'UPDATE type::record($rid) SET tipo = $tipo, severidad = $sev, descripcion = $desc, activo = true, fecha_baja = NONE, motivo_baja = NONE;',
        { rid: String(principal.id), tipo, sev: severidad, desc: descripcion },
      );
      for (const registro of vigentes) {
        if (String(registro.id) === String(principal.id)) continue;
        await ejecutar(
          'UPDATE type::record($rid) SET activo = false, fecha_baja = time::now(), motivo_baja = $motivo;',
          { rid: String(registro.id), motivo: 'Consolidado: se conserva la alergia mas grave' },
        );
      }
    } else {
      await ejecutar(
        "CREATE alergia CONTENT { persona_id: type::record('persona', $pid), tipo: $tipo, severidad: $sev, descripcion: $desc, activo: true };",
        { pid: personaId, tipo, sev: severidad, desc: descripcion },
      );
    }
    return true;
  } catch (err) {
    avisarFallo('Registro de alergia', err);
    return false;
  }
}

/** Actualiza los datos del usuario que la UI edita (expediente / servicios). */
export async function actualizarBeneficiario(b) {
  const pid = claveRegistro(b._personaId);
  if (!pid) return false;
  try {
    // Un solo viaje de ida al cuidador (si la ficha trae apoderado).
    let cuiId = '';
    const nomAp = (b.apoderado || '').trim();
    if (nomAp) {
      const creado = await asegurarPersonaCuidador({
        nombres: nomAp,
        apellidos: '',
        documento: b.apoderadoDni || '',
        parentesco: b.parentesco || 'Madre',
        sexo: b.sexoApoderado || '',
      });
      cuiId = claveRegistro(creado);
    }

    // El distrito operativo se deriva de la sede elegida. Si la sede no existe
    // en el Directorio Territorial, se conserva el distrito de la ficha.
    const sedeNom = (b.sede || '').trim();
    let distrito = ['Comas', 'Carabayllo'].includes(b.distrito) ? b.distrito : 'Comas';
    if (sedeNom) {
      const sedeFound = comoLista(await ejecutar(
        'SELECT distrito FROM sede WHERE nombre = $sedeNom LIMIT 1;', { sedeNom }));
      if (sedeFound.length) distrito = sedeFound[0].distrito || distrito;
    }

    // Salud y educación: se crean o reutilizan las instituciones antes de
    // actualizar la persona, para que el expediente no pierda estos datos.
    let centroId = '';
    const centroNombre = String(b.centroSalud || '').trim();
    if (centroNombre) {
      centroId = await asegurarInstitucion(centroNombre, 'Centro de Salud', distrito) || '';
      if (!centroId) return false;
    }
    let colegioId = '';
    const colegioNombre = String(b.colegio || '').trim();
    if (colegioNombre) {
      colegioId = await asegurarInstitucion(colegioNombre, 'Institucion Educativa', distrito) || '';
      if (!colegioId) return false;
    }

    // Todo lo demás en UNA sola ida y vuelta: persona + vínculo + inscripción.
    await ejecutar(`
      LET $usuario = type::record('persona', $pid);
      UPDATE $usuario SET
        nombres = $nom, apellidos = $ape, sexo = $sexo,
        direccion = $dir, referencia = $ref ?? NONE,
        telefono = $tel ?? NONE, telefono_alt = $tel2 ?? NONE,
        nivel_educativo = $niv, grado = $grado ?? NONE,
        esquema_salud = $seg, distrito = $dist, foto_url = $foto ?? NONE,
        tipo_documento = $tipoDoc,
        centro_salud = IF string::len($centroId) > 0 { type::record('institucion', $centroId) } ELSE { NONE },
        institucion_origen = IF string::len($colegioId) > 0 { type::record('institucion', $colegioId) } ELSE { NONE };
      IF string::len($cuiId) = 0 {
        DELETE ${T_VINCULO} WHERE ${F_MENOR} = $usuario;
      };
      IF string::len($cuiId) > 0 {
        DELETE ${T_VINCULO} WHERE ${F_MENOR} = $usuario;
        CREATE ${T_VINCULO} CONTENT {
          ${F_MENOR}: $usuario, cuidador_id: type::record('persona', $cuiId),
          parentesco: $par, rol_vinculo: 'Responsable', ${F_VIVE_CON}: true
        };
      };
      UPDATE inscripcion SET
        programa = $prog, estrategias = $estrategias, estado = $estado,
        modalidad = $modalidadGuardable,
        tipo_atencion = $tipoAtencionGuardable ?? NONE
      WHERE ${F_USUARIO} = $usuario AND activo = true;
      IF string::len($fnac) > 0 {
        UPDATE $usuario SET fecha_nacimiento = type::datetime($fnac);
      };
      // La sede elegida en el desplegable reemplaza la inscripcion actual; si
      // el nombre no existe en el Directorio Territorial se queda como estaba.
      IF string::len($sedeNom) > 0 {
        LET $nuevaSede = (SELECT VALUE id FROM sede WHERE nombre = $sedeNom LIMIT 1)[0];
        IF $nuevaSede != NONE {
          UPDATE inscripcion SET sede_id = $nuevaSede WHERE ${F_USUARIO} = $usuario AND activo = true;
        };
      };
      // La escala de exoneracion vive en el ultimo aporte del usuario, igual que
      // la lee el padron: se replica ahi para que la vista y la nube coincidan.
      IF string::len($exon) > 0 {
        LET $aporteUltimo = (SELECT VALUE id FROM aporte WHERE inscripcion_id.${F_USUARIO} = $usuario ORDER BY periodo DESC, mes DESC LIMIT 1)[0];
        IF $aporteUltimo != NONE {
          UPDATE $aporteUltimo SET pct_exoneracion = $pctAporte;
        };
      };`, {
      pid, cuiId,
      nom: b.nombres, ape: b.apellidos,
      sexo: (b.sexo || 'M').toUpperCase().includes('F') ? 'F' : 'M',
      tipoDoc: tipoDocumentoCanonico(b.tipoDocumento, Boolean(b.dni)),
      centroId: centroId || '',
      colegioId: colegioId || '',
      fnac: b.fechaNacimiento || '',
      dist: distrito,
      sedeNom,
      exon: b.exoneracionAporte || '',
      pctAporte: pctDesdeExoneracion(b.exoneracionAporte),
      mod: modalidadUiADb(b.modalidad),
      modalidadGuardable: await modalidadGuardable(modalidadUiADb(b.modalidad)),
      // La modalidad de atencion solo existe en Casita del Saber: si la
      // inscripcion deja de ser de Casita, el dato se vacia.
      tipoAtencionGuardable: await tipoAtencionGuardable(
        (b.estrategias || []).includes('Casita del Saber') || b.estrategia === 'Casita del Saber'
          ? (b.tipoAtencion || 'Atención fija')
          : null,
      ),
      foto: b.fotoUrl || null,
      dir: b.direccion || '', ref: b.referencia || '',
      tel: b.telefono || null, tel2: b.telefonoAlt || null,
      niv: b.nivelEducativo || 'Inicial', grado: b.grado || '',
      seg: seguroUiADb(b.seguro),
      par: normalizarParentesco(b.parentesco || 'Otro'),
      prog: programaDesdeServicios(b.servicios, b.estrategia),
      estrategias: (Array.isArray(b.estrategias) && b.estrategias.length)
        ? b.estrategias
        : estrategiasDesdePrograma(programaDesdeServicios(b.servicios, b.estrategia)),
      estado: b.estado || 'Activo',
    });

    // La alergia se guarda aparte, en su propia tabla. Si la vista no trae
    // el dato (flujos que no tocan salud) no se toca lo que ya está escrito.
    if (b.alergia && typeof b.alergia === 'object') {
      const alergiaOk = await guardarAlergia(pid, b.alergia, b.alergiaMotivo);
      if (!alergiaOk) return false;
    }
    return true;
  } catch (err) {
    return avisarFallo('Actualización de expediente', err) !== null ? false : false;
  }
}

/** Baja del padrón: la Ley 29733 prohibe borrado físico; se retira con baja lógica. */
export async function darBajaBeneficiario(b, motivo = 'Baja administrativa') {
  const pid = claveRegistro(b._personaId);
  if (!pid) return false;
  try {
    await ejecutar(`
      UPDATE inscripcion SET
        activo = false, estado = 'Retirado',
        motivo_baja = $motivo
      WHERE ${F_USUARIO} = type::record('persona', $pid) AND activo = true;
      UPDATE persona SET activo = false WHERE id = type::record('persona', $pid);`, {
      pid, motivo,
    });
    return true;
  } catch (err) {
    return avisarFallo('Baja del usuario', err) !== null ? false : false;
  }
}

// ---------------------------------------------------------------------------
//  CRUD · Sedes
// ---------------------------------------------------------------------------
export async function crearSede(s) {
  try {
    await ejecutar(`CREATE sede CONTENT {
      nombre: $nombre, distrito: $distrito, direccion: $dir, referencia: $ref ?? NONE,
      tipo_local: $tipo, aliado_nombre: $aliado, aliado_institucion: $aliadoInst,
      facilitadora_nombre: $fac, facilitadora_tel: $facTel ?? NONE,
      servicios: $serv, aforo_max: $aforo, horario: $horario ?? NONE,
      estado: $estado, activo: true
    };`, {
      nombre: s.nombre, distrito: s.distrito === 'Carabayllo' ? 'Carabayllo' : 'Comas',
      dir: s.direccion, ref: s.referencia || null,
      tipo: tipoLocalCanonico(s.tipoAliado),
      aliado: s.iglesiaAliada || s.pastorAliado || s.nombre,
      aliadoInst: s.tipoAliado || 'Local Comunal',
      fac: s.facilitadora || '', facTel: s.facilitadoraTel || '',
      serv: Array.isArray(s.servicios) && s.servicios.length ? s.servicios : ['Servicio Alimentario Nutricional'],
      aforo: Number(s.aforoMax) > 0 ? Number(s.aforoMax) : 30,
      horario: s.horario || null, estado: s.estado || 'Operativa',
    });
    return true;
  } catch (err) {
    return avisarFallo('Registro de sede', err) !== null;
  }
}

export async function actualizarSede(s) {
  const sid = claveRegistro(s._rawId);
  if (!sid) return false;
  try {
    await ejecutar(`UPDATE sede SET
      nombre = $nombre, distrito = $distrito, direccion = $dir, referencia = $ref ?? NONE,
      tipo_local = $tipo, aliado_nombre = $aliado, aliado_institucion = $aliadoInst,
      facilitadora_nombre = $fac, facilitadora_tel = $facTel ?? NONE,
      servicios = $serv, aforo_max = $aforo, horario = $horario ?? NONE,
      estado = $estado
    WHERE id = type::record('sede', $sid);`, {
      sid, nombre: s.nombre, distrito: s.distrito === 'Carabayllo' ? 'Carabayllo' : 'Comas',
      dir: s.direccion, ref: s.referencia || null,
      tipo: tipoLocalCanonico(s.tipoAliado),
      aliado: s.iglesiaAliada || s.nombre,
      aliadoInst: s.tipoAliado || 'Local Comunal',
      fac: s.facilitadora || '', facTel: s.facilitadoraTel || '',
      serv: Array.isArray(s.servicios) && s.servicios.length ? s.servicios : ['Servicio Alimentario Nutricional'],
      aforo: Number(s.aforoMax) > 0 ? Number(s.aforoMax) : 30,
      horario: s.horario || null, estado: s.estado || 'Operativa',
    });
    return true;
  } catch (err) {
    return avisarFallo('Actualización de sede', err) !== null;
  }
}

// ---------------------------------------------------------------------------
//  CRUD · Casos sociales (ASP)
// ---------------------------------------------------------------------------
/** Alta de caso social: localiza a la persona del usuario por código. */
export async function crearCasoSocial(ui) {
  try {
    const hayBeneficiario = window.PDI?.BeneficiarioModel?.getAll?.() || [];
    const usuario = hayBeneficiario.find(b => String(b.id) === String(ui.beneficiarioId) ||
      (ui.codigo && b.codigo && b.codigo.toLowerCase() === ui.codigo.toLowerCase()));
    if (!usuario || !usuario._personaId) {
      avisarElUsuarioNoEsta();
      return null;
    }
    if (!usuario._sedeRawId) {
      avisarFallo('Registro de caso social', 'El usuario no tiene sede asignada en la nube.');
      return null;
    }
    await ejecutar(`CREATE caso_social CONTENT {
      ${F_CASO}: type::record('persona', $pid),
      sede_id: type::record('sede', $sid),
      codigo_caso: $cod,
      etapa: 'pendiente',
      urgencia: $urg,
      tipo_problematica: $tipo,
      fecha_derivacion: type::datetime($fecha),
      quien_deriva_nombre: $derNom,
      quien_deriva_cargo: $derCargo,
      quien_deriva_tel: $derTel ?? NONE,
      situacion_encontrada: $situacion,
      acciones_previas: $previas,
      tiene_soporte_familiar: $soporte,
      detalle_soporte_familiar: $soporteDet ?? NONE,
      activo: true
    };`, {
      pid: claveRegistro(usuario._personaId),
      sid: usuario._sedeRawId ? claveRegistro(usuario._sedeRawId) : null,
      cod: 'CAS-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5),
      urg: ['Alta', 'Media', 'Baja'].includes(ui.prioridad || ui.urgencia) ? (ui.prioridad || ui.urgencia) : 'Media',
      tipo: TIPO_PROBLEMATICA.includes(ui.tipoProblematica) ? ui.tipoProblematica : 'Nutricional / Abandono',
      fecha: (ui.fecha || new Date().toISOString().slice(0, 10)),
      derNom: ui.quienDeriva?.nombre || window.PDI?.Navigation?.usuarioActivo?.() || 'Trabajadora Social ASP',
      derCargo: ui.quienDeriva?.cargo || 'Trabajadora Social ASP',
      derTel: ui.quienDeriva?.telefono || null,
      situacion: ui.situacionEncontrada || ui.motivo || 'Derivación registrada',
      previas: ui.accionesPrevias || 'Visita preliminar realizada',
      soporte: ui.soporteFamiliar?.tiene ?? false,
      soporteDet: ui.soporteFamiliar?.detalle || null,
    });
    return true;
  } catch (err) {
    return avisarFallo('Registro de caso social', err);
  }
}

const TIPO_PROBLEMATICA = ['Familiar', 'Educativo', 'Salud', 'Nutricional / Abandono', 'Violencia'];

function avisarElUsuarioNoEsta() {
  avisarFallo('Registro de caso social', 'El usuario no tiene expediente en la nube todavía.');
}

/** Movimiento directo de etapa desde el kanban (sin flujo de autorización). */
export async function cambiarEtapaCaso(caso, etapaUiValor) {
  const cid = claveRegistro(caso._casoId);
  if (!cid) return false;
  try {
    // RETURN AFTER: un UPDATE sin coincidencias no lanza error. Sin comprobar
    // la fila devuelta, una clave mal formada se reportaba como guardada y la
    // etapa volvia a la anterior al recargar (la base nunca cambio).
    const res = await ejecutar(
      `UPDATE caso_social SET etapa = $etapa WHERE id = type::record('caso_social', $cid) RETURN AFTER;`,
      { cid, etapa: etapaNubeDe(etapaUiValor) },
    );
    if (!comoLista(res).length) {
      avisarFallo('Cambio de etapa', `No se encontro el caso ${caso.codigo || cid} en la base de datos.`);
      return false;
    }
    return true;
  } catch (err) {
    return avisarFallo('Cambio de etapa', err) !== null;
  }
}

/** Registra una solicitud de cambio de estado (requiere autorización). */
export async function crearSolicitudCaso(caso, sol) {
  const cid = claveRegistro(caso._casoId);
  if (!cid) return false;
  try {
    const res = await ejecutar(`CREATE solicitud_caso CONTENT {
      caso_id: type::record('caso_social', $cid),
      codigo_solicitud: $codigo,
      etapa_origen: $origen, etapa_destino: $destino,
      solicitado_por: $por, cargo_solicitante: $cargo,
      motivo: $motivo,
      estado: 'pendiente',
      activo: true
    };`, {
      cid,
      codigo: sol.id,
      origen: etapaNubeDe(sol.etapaOrigen),
      destino: etapaNubeDe(sol.etapaDestino),
      por: sol.solicitadoPor || 'Trabajadora Social ASP',
      cargo: sol.cargoSolicitante || 'Trabajadora Social ASP',
      motivo: sol.motivo || 'Solicitud de transición de etapa',
    });
    const arr = comoLista(res);
    const qid = arr.length ? String(arr[0]?.id ?? arr[0]) : null;
    if (qid) caso._solRid = qid;
    return true;
  } catch (err) {
    return avisarFallo('Solicitud de etapa', err) !== null;
  }
}

/** Resuelve una solicitud (aprobada/rechazada); si se aprueba, cambia la etapa. */
export async function resolverSolicitudCaso(solId, caso, decision, comentario, autorizador) {
  const sid = String(solId);
  const aprobada = decision === 'aprobada';
  try {
    if (aprobada && caso?._casoId) {
      await ejecutar(`
        LET $sol = (SELECT * FROM solicitud_caso WHERE codigo_solicitud = $codigo LIMIT 1)[0];
        IF $sol {
          UPDATE $sol SET
            estado = 'aprobada',
            resuelto_por = $por,
            cargo_resuelve = $cargo,
            comentario_resolucion = $coment,
            fecha_resolucion = time::now();
          UPDATE caso_social SET etapa = $sol.etapa_destino WHERE id = $sol.caso_id;
        };`, {
        codigo: sid,
        por: autorizador?.nombre || 'Dirección y Coordinación General',
        cargo: autorizador?.cargo || 'Coordinación General PDI',
        coment: comentario || '',
      });
    } else {
      await ejecutar(`
        LET $sol = (SELECT * FROM solicitud_caso WHERE codigo_solicitud = $codigo LIMIT 1)[0];
        IF $sol {
          UPDATE $sol SET
            estado = 'rechazada',
            resuelto_por = $por,
            cargo_resuelve = $cargo,
            comentario_resolucion = $coment,
            fecha_resolucion = time::now();
        };`, {
        codigo: sid,
        por: autorizador?.nombre || 'Dirección y Coordinación General',
        cargo: autorizador?.cargo || 'Coordinación General PDI',
        coment: comentario || '',
      });
    }
    return true;
  } catch (err) {
    return avisarFallo('Resolución de solicitud', err) !== null;
  }
}

// ---------------------------------------------------------------------------
//  CRUD · Voluntariados (tabla nueva en la nube)
// ---------------------------------------------------------------------------
/**
 * Distrito operativo del voluntario. Manda el elegido en la ficha; la sede
 * solo se usa como respaldo para registros antiguos que no traen distrito.
 */
function distritoVoluntario(v) {
  const elegido = String(v.distrito || '').trim();
  if (elegido === 'Comas' || elegido === 'Carabayllo') return elegido;
  return distritoDeSede(v.sedeAsignada) || 'Comas';
}

export async function crearVoluntario(v) {
  try {
    const dup = comoLista(await ejecutar(
      'SELECT id FROM voluntario WHERE numero_documento = $doc LIMIT 1;', { doc: (v.dni || '').trim() }));
    if (dup.length) {
      return avisarFallo('Documento duplicado', `La voluntaria con DNI ${v.dni} ya está registrada.`) === null ? null : null;
    }
    if (v.sedeAsignada && !sedeConocida(v.sedeAsignada)) {
      console.warn(`[PDI] Sede no registrada en el catálogo de voluntariado: "${v.sedeAsignada}". Se conserva el valor.`);
    }
    const res = await ejecutar(`CREATE voluntario CONTENT {
      codigo: $codigo,
      nombres: $nom, apellidos: $ape,
      numero_documento: $doc, telefono: $tel ?? NONE,
      fecha_nacimiento: IF string::len($fnac) = 0 { NONE } ELSE { type::datetime($fnac) }, edad: $edad ?? NONE,

      direccion: $dir ?? NONE, distrito: $distrito,
      sede_nombre: $sede, servicio: $servicio,
      rol: $rol, estrategia: $estrategia,
      tipo_voluntariado: $tipo ?? NONE,
      capacitaciones: $caps,
      canastas_recibidas: $canastas,
      fecha_ingreso: type::datetime($ingreso),
      estado: $estado,
      disponibilidad: $disponibilidad,
      observaciones: $obs ?? NONE,
      activo: true
    };`, {
      codigo: v.codigo,
      nom: v.nombres, ape: v.apellidos,
      doc: v.dni, tel: v.celular || null,
      fnac: v.fechaNacimiento || '',
      edad: v.edad ? Number(v.edad) : null,
      dir: v.domicilio || null,
      distrito: distritoVoluntario(v),
      sede: v.sedeAsignada || '', servicio: SERVICIOS_VOLUNTARIADO.includes(v.servicio) ? v.servicio : 'Desayuno Infantil',
      rol: v.rol || 'Voluntaria de Apoyo',
      estrategia: v.estrategia || 'Atención Fija',
      tipo: v.tipoVoluntariado || null,
      caps: Array.isArray(v.capacitaciones) ? v.capacitaciones : [],
      canastas: Number(v.canastasRecibidas) || 0,
      ingreso: v.fechaIngreso || new Date().toISOString().slice(0, 10),
      estado: ['Activo', 'En Pausa', 'Inactivo'].includes(v.estado) ? v.estado : 'Activo',
      disponibilidad: v.disponibilidad || 'Disponibilidad estándar',
      obs: v.observaciones || null,
    });
    const arr = comoLista(res);
    const qid = arr.length ? String(arr[0]?.id ?? arr[0]) : null;
    return { ok: true, qid };
  } catch (err) {
    return avisarFallo('Registro de voluntaria', err);
  }
}

/** Los servicios válidos salen del catálogo único de programas. */

export async function actualizarVoluntario(v) {
  // El ID completo puede venir con corchetes angulares: `voluntario:⟨...⟩`.
  // Partirlo por ':' dejaba `⟨...⟩` y type::record no encontraba la fila.
  const rid = String(v._qid || '').trim();
  if (!rid) return false;
  try {
    if (v.sedeAsignada && !sedeConocida(v.sedeAsignada)) {
      console.warn(`[PDI] Sede no registrada en el catálogo de voluntariado: "${v.sedeAsignada}". Se conserva el valor.`);
    }
    const res = await ejecutar(`UPDATE voluntario SET
      nombres = $nom, apellidos = $ape, numero_documento = $doc, telefono = $tel ?? NONE,
      fecha_nacimiento = IF string::len($fnac) = 0 { NONE } ELSE { type::datetime($fnac) },
      edad = $edad ?? NONE,
      direccion = $dir ?? NONE, distrito = $distrito,
      sede_nombre = $sede, servicio = $servicio,
      rol = $rol, estrategia = $estrategia,
      tipo_voluntariado = $tipo ?? NONE,
      estado = $estado, disponibilidad = $disponibilidad,
      observaciones = $obs ?? NONE
    WHERE id = type::record($rid)
    RETURN AFTER;`, {
      rid, nom: v.nombres, ape: v.apellidos, doc: v.dni, tel: v.celular || null,
      fnac: v.fechaNacimiento || '', edad: v.edad ? Number(v.edad) : null,
      dir: v.domicilio || null, distrito: distritoVoluntario(v),
      sede: v.sedeAsignada || '', servicio: SERVICIOS_VOLUNTARIADO.includes(v.servicio) ? v.servicio : 'Desayuno Infantil',
      rol: v.rol || 'Voluntaria de Apoyo', estrategia: v.estrategia || 'Atención Fija',
      tipo: v.tipoVoluntariado || null,
      estado: ['Activo', 'En Pausa', 'Inactivo'].includes(v.estado) ? v.estado : 'Activo',
      disponibilidad: v.disponibilidad || 'Disponibilidad estándar',
      obs: v.observaciones || null,
    });
    // Un UPDATE sin coincidencias no lanza error: hay que comprobar que la
    // fila exista para no mostrar "guardado" cuando no cambio nada.
    if (!comoLista(res).length) {
      avisarFallo('Actualización de voluntaria', `No se encontró el registro ${v.codigo || rid} en la base de datos.`);
      return false;
    }
    return true;
  } catch (err) {
    return avisarFallo('Actualización de voluntaria', err) !== null;
  }
}

/** Baja en la nube: estado Inactivo + activo=false (Ley 29733: sin borrado físico). */
export async function darBajaVoluntario(vol) {
  const rid = String(vol._qid || '').trim();
  if (!rid) return false;
  try {
    const res = await ejecutar(`UPDATE voluntario SET estado = 'Inactivo', activo = false WHERE id = type::record($rid) RETURN AFTER;`, { rid });
    if (!comoLista(res).length) {
      avisarFallo('Baja de voluntaria', `No se encontró el registro ${vol.codigo || rid} en la base de datos.`);
      return false;
    }
    return true;
  } catch (err) {
    return avisarFallo('Baja de voluntaria', err) !== null;
  }
}

/**
 * Registra el taller y, si corresponde, la canasta en UNA sola escritura.
 * Antes eran dos UPDATE simultáneos sobre el mismo registro y SurrealDB
 * respondía "Transaction conflict: Resource busy"; el taller quedaba y la
 * canasta se perdía. Una sola sentencia hace que ambos cambios se confirmen
 * juntos. El reintento cubre conflictos con otras pestañas o sesiones.
 */
export async function registrarCapacitacionVoluntario(vol, tematica, { canasta = false, conTematica = true } = {}) {
  const rid = String(vol._qid || '').trim();
  if (!rid) return false;
  const consulta = consultaCapacitacion({ conCanasta: canasta, conTematica });
  if (!consulta) return false;
  try {
    const res = await conReintentos(() => ejecutar(consulta, { rid, tematica }));
    if (!comoLista(res).length) {
      avisarFallo('Registro de capacitación', `No se encontró el registro ${vol.codigo || rid} en la base de datos.`);
      return false;
    }
    return true;
  } catch (err) {
    return avisarFallo('Registro de capacitación', err) !== null;
  }
}

export async function addCapacitacionVoluntario(vol, tematica) {
  return registrarCapacitacionVoluntario(vol, tematica, { canasta: false, conTematica: true });
}

export async function incrementarCanastaVoluntario(vol) {
  const rid = String(vol._qid || '').trim();
  if (!rid) return false;
  const consulta = consultaCapacitacion({ conCanasta: true, conTematica: false });
  try {
    const res = await conReintentos(() => ejecutar(consulta, { rid }));
    if (!comoLista(res).length) {
      avisarFallo('Entrega de canasta', `No se encontró el registro ${vol.codigo || rid} en la base de datos.`);
      return false;
    }
    return true;
  } catch (err) {
    return avisarFallo('Entrega de canasta', err) !== null;
  }
}

// ---------------------------------------------------------------------------
//  CRUD · Asistencia diaria (Casita del Saber)
// ---------------------------------------------------------------------------
export async function registrarAsistencia(beneficiario, estadoClave) {
  const inscripcionId = claveRegistro(beneficiario._inscripcionId);
  if (!inscripcionId) {
    avisarFallo('Asistencia', 'El usuario no tiene inscripción activa en la nube.');
    return false;
  }
  try {
    await ejecutar(`INSERT INTO asistencia_diaria {
      inscripcion_id: type::record('inscripcion', $iid),
      sede_id: type::record('sede', $sid),
      fecha: type::datetime($fecha),
      estado: $estado,
      racion_entregada: $racion,
      observacion: $obs ?? NONE
    } ON DUPLICATE KEY UPDATE
      estado = $data.estado, racion_entregada = $data.racion_entregada;`, {
      iid: inscripcionId,
      sid: claveRegistro(beneficiario._sedeRawId || 'sede:sin_sede'),
      fecha: new Date().toISOString().slice(0, 10),
      estado: ['P', 'T', 'FJ', 'FI'].includes(estadoClave) ? estadoClave : 'P',
      racion: estadoClave === 'P' || estadoClave === 'T',
      obs: null,
      data: {
        estado: ['P', 'T', 'FJ', 'FI'].includes(estadoClave) ? estadoClave : 'P',
        racion_entregada: estadoClave === 'P' || estadoClave === 'T',
      },
    });
    return true;
  } catch (err) {
    return avisarFallo('Registro de asistencia', err) !== null;
  }
}

// ---------------------------------------------------------------------------
//  CRUD · Bitácora de auditoría
// ---------------------------------------------------------------------------
export async function crearBitacora(entry) {
  try {
    // El campo diff de la nube es none|array<object>: strings (como el status
    // que la firma antigua enviaba en esa posición) no son diff y se omiten.
    const diffValido = entry.diff && typeof entry.diff === 'object' && !Array.isArray(entry.diff)
      ? [entry.diff] : null;
    await ejecutar(`CREATE bitacora_auditoria CONTENT {
      usuario_nombre: $user, rol: $role,
      accion: $accion, entidad: $entidad, registro_id: $registro,
      detalle: $detalle, ip_origen: $ip, sede_nombre: $sede,
      diff: $diff ?? NONE
    };`, {
      user: entry.user || 'Sistema',
      role: entry.role || 'Sistema',
      accion: entry.action || '',
      entidad: 'PDI · Sistema',
      registro: entry.entity || '',
      detalle: entry.detail || '',
      ip: entry.ip || '192.168.1.x',
      sede: entry.sede || 'Central',
      diff: diffValido,
    });
    return true;
  } catch (err) {
    return avisarFallo('Bitácora de auditoría', err) !== null;
  }
}

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.DB = {
    iniciarCapaDatos, suscribirEstado, estadoActual,
    hidratarDesdeSurreal, refrescarDesdeNube, reintentarAhora,
  };
}
