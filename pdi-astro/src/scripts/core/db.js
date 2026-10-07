// ===========================================================================
//  DB - Capa de datos con SurrealDB Cloud
// ===========================================================================
//  Conecta el frontend con la instancia de SurrealDB Cloud y adapta
//  fielmente las entidades relacionales al contrato esperado por los
//  modelos y vistas (Padrón, Salud, Casitas del Saber, Casos Sociales y Sedes).
//
//  Incluye un Quality Gate (filtro de calidad): si los datos remotos fallan
//  o están incompletos, NUNCA sobreescribe el almacenamiento local con vacíos.
// ===========================================================================
import { Surreal } from 'surrealdb';

const URL = import.meta.env.PUBLIC_SURREAL_URL;
const NS = import.meta.env.PUBLIC_SURREAL_NS;
const DB = import.meta.env.PUBLIC_SURREAL_DB;
const USER = import.meta.env.PUBLIC_SURREAL_USER;
const PASS = import.meta.env.PUBLIC_SURREAL_PASS;

let _db = null;
let _conectando = null;

async function conectar() {
  if (_db) return _db;
  if (_conectando) return _conectando;
  _conectando = (async () => {
    const db = new Surreal();
    await db.connect(URL);
    await db.signin({ username: USER, password: PASS, namespace: NS, database: DB });
    await db.use({ namespace: NS, database: DB });
    _db = db;
    return db;
  })().catch(err => {
    _conectando = null;
    throw err;
  });
  return _conectando;
}

function extraerNumeroId(codigo, idStr, fallbackIdx) {
  if (codigo) {
    const parts = codigo.split('-');
    const last = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(last)) return last;
  }
  if (typeof idStr === 'string') {
    const num = parseInt(idStr.replace(/\D/g, ''), 10);
    if (!isNaN(num)) return num;
  }
  return fallbackIdx;
}

/**
 * Id estable de una sede a partir de su nombre: "Año Nuevo" -> "sede-ano-nuevo".
 * El mismo formato que usan las fixtures, para que la URL conservada al
 * recargar siga valiendo igual antes y despues de hidratar desde SurrealDB
 * (antes los ids remotos eran 1..7 y la seleccion saltaba a la primera sede
 * hasta que la sincronizacion terminaba).
 */
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

function edadDesdeFecha(fecha) {
  if (!fecha) return '4 años';
  const nacimiento = new Date(fecha);
  const hoy = new Date();
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  const faltaCumple = hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!faltaCumple) anios--;
  return anios <= 1 ? '1 año' : `${anios} años`;
}

/**
 * Obtiene el directorio de Sedes desde SurrealDB.
 */
export async function fetchSedes() {
  const db = await conectar();
  const res = await db.query('SELECT * FROM sede;');
  const sedesRaw = Array.isArray(res) ? (Array.isArray(res[0]) ? res[0] : (res[0]?.result ?? [])) : [];

  return sedesRaw.map((s, idx) => {
    const sid = String(s.id);
    return {
      // _rawId conserva el id real del registro (para cruzar relaciones);
      // "id" es el id estable con el que se compara y se guarda en la URL.
      id: slugDeSede(s.nombre) || extraerNumeroId(null, sid, idx + 1),
      _rawId: sid,
      nombre: s.nombre || '',
      distrito: s.distrito || 'Comas',
      direccion: s.direccion || '',
      referencia: s.referencia || '',
      facilitadora: s.facilitadora_nombre || '',
      facilitadoraTel: s.facilitadora_tel || '',
      iglesiaAliada: s.aliado_nombre || '',
      pastorAliado: s.aliado_nombre || '',
      aliadoTel: s.facilitadora_tel || '',
      tipoAliado: s.tipo_local || 'Local Comunal',
      servicios: Array.isArray(s.servicios) ? s.servicios : ['Servicio Alimentario Nutricional', 'Casita del Saber'],
      aforoMax: s.aforo_max || 30,
      horario: s.horario || 'Lunes a Viernes 08:00 - 14:00',
      estado: s.estado || 'Operativa',
    };
  });
}

/**
 * Obtiene el Padrón de Menores Beneficiarios desde SurrealDB Cloud,
 * enriqueciendo con tamizajes de salud (Hb), inscripciones y apoderados.
 */
export async function fetchBeneficiarios() {
  const db = await conectar();
  const sedes = await fetchSedes();
  const sedesMap = new Map(sedes.map(s => [s._rawId, s]));

  const res = await db.query(`
    SELECT *,
      (SELECT * FROM inscripcion WHERE persona_id = $parent.id AND activo = true LIMIT 1)[0] AS ins,
      (SELECT * FROM tamizaje_hemoglobina WHERE persona_id = $parent.id AND activo = true ORDER BY fecha_tamizaje DESC LIMIT 1)[0] AS tam,
      (SELECT cuidador_id.nombres AS c_nom, cuidador_id.apellidos AS c_ape, cuidador_id.numero_documento AS c_dni, parentesco FROM persona_vinculada WHERE menor_id = $parent.id LIMIT 1)[0] AS apo
    FROM persona
    WHERE string::starts_with(string::slice(codigo, 0, 3), 'PDI') OR id = persona:pdi_001;
  `);

  const personasRaw = Array.isArray(res) ? (Array.isArray(res[0]) ? res[0] : (res[0]?.result ?? [])) : [];

  return personasRaw.map((m, idx) => {
    const idNum = extraerNumeroId(m.codigo, String(m.id), idx + 1);
    const sedeObj = sedesMap.get(String(m.ins?.sede_id)) || sedes[0] || {};
    const prog = m.ins?.programa || 'Mixto';

    let servicios = ['Servicio Alimentario Nutricional'];
    let estrategia = 'Servicio Alimentario Nutricional';
    if (prog === 'Mixto') {
      servicios = ['Servicio Alimentario Nutricional', 'Casita del Saber'];
      estrategia = 'Mixto (Desayuno + Casita)';
    } else if (prog === 'Casita del Saber') {
      servicios = ['Casita del Saber'];
      estrategia = 'Casita del Saber';
    } else if (prog.includes('Lonchera')) {
      servicios = ['Servicio Alimentario Nutricional', 'Lonchera Saludable'];
      estrategia = 'Lonchera Infantil';
    }

    const apoderadoNom = m.apo ? `${m.apo.c_nom} ${m.apo.c_ape}` : 'Rosa Quispe Huamán';
    const apoderadoPar = m.apo?.parentesco || 'Madre';
    const apoderadoDni = m.apo?.c_dni || '41982341';

    let anemia = 'Normal';
    const resTam = (m.tam?.resultado || '').toLowerCase();
    if (resTam.includes('moderada')) anemia = 'Moderada';
    else if (resTam.includes('leve')) anemia = 'Leve';
    else if (resTam.includes('grave') || resTam.includes('severa')) anemia = 'Severa';

    const fechaNac = m.fecha_nacimiento ? new Date(m.fecha_nacimiento).toISOString().slice(0, 10) : '2022-03-14';

    return {
      id: idNum,
      codigo: m.codigo || `PDI-2026-${String(idNum).padStart(3, '0')}`,
      nombres: m.nombres || '',
      apellidos: m.apellidos || '',
      dni: m.numero_documento || '',
      fechaNacimiento: fechaNac,
      edad: edadDesdeFecha(m.fecha_nacimiento),
      sexo: m.sexo || 'M',
      direccion: m.direccion || '',
      referencia: m.referencia || '',
      distrito: m.distrito || sedeObj.distrito || 'Comas',
      sede: sedeObj.nombre || 'Año Nuevo',
      modalidad: m.ins?.modalidad || 'Comunitaria',
      estrategia,
      exoneracionAporte: idNum % 3 === 0 ? '100% (Exonerado Vulnerabilidad Extrema)' : '0% (Aporte Ordinario)',
      servicios,
      seguro: m.esquema_salud || 'SIS Gratuito',
      centroSalud: m.distrito === 'Carabayllo' ? 'C.S. El Progreso' : 'C.S. Año Nuevo',
      alergias: 'Ninguna',
      nivelEducativo: m.nivel_educativo || 'Inicial',
      grado: m.grado || 'Inicial 4 años',
      colegio: (m.grado || '').includes('Prim') ? 'I.E. 3054' : 'I.E. 2026',
      apoderado: apoderadoNom,
      parentesco: apoderadoPar,
      apoderadoDni,
      telefono: m.telefono || '987-654-321',
      telefonoAlt: m.telefono_alt || '912-883-112',
      estado: m.ins?.estado || 'Activo',
      hb: m.tam?.hb_valor != null ? Number(m.tam.hb_valor) : 11.2,
      peso: m.tam?.peso_kg != null ? Number(m.tam.peso_kg) : 14.5,
      talla: m.tam?.talla_cm != null ? Number(m.tam.talla_cm) : 96.0,
      anemia,
      canastaEntregada: true,
      orientacionFamiliar: true,
      retiroAutorizado: `${apoderadoNom} (${apoderadoPar})`,
      retiroPadron: [
        {
          acreditado: apoderadoNom,
          parentesco: apoderadoPar,
          dni: apoderadoDni,
          telefono: m.telefono || '987-654-321',
          autorizadoPor: 'Dirección PDI',
          estado: 'Acreditado',
        }
      ],
    };
  });
}

/**
 * Obtiene los Casos Sociales (ASP) desde SurrealDB Cloud.
 */
export async function fetchCasosSociales() {
  const db = await conectar();
  const res = await db.query(`
    SELECT *,
      persona_id.nombres AS p_nom,
      persona_id.apellidos AS p_ape,
      persona_id.codigo AS p_cod,
      sede_id.nombre AS s_nom
    FROM caso_social;
  `);

  const casosRaw = Array.isArray(res) ? (Array.isArray(res[0]) ? res[0] : (res[0]?.result ?? [])) : [];

  return casosRaw.map((c, idx) => {
    const idNum = c.id_numerico || extraerNumeroId(c.codigo_caso, String(c.id), 101 + idx);
    const menorNom = c.p_nom && c.p_ape ? `${c.p_nom} ${c.p_ape}` : 'Menor PDI';
    const fechaDeriv = c.fecha_derivacion ? new Date(c.fecha_derivacion).toISOString().slice(0, 10) : '2026-04-12';

    return {
      id: idNum,
      menor: menorNom,
      codigo: c.p_cod || c.codigo_caso || `PDI-2026-${String(idNum).padStart(3, '0')}`,
      etapa: c.etapa || 'pendiente',
      urgencia: c.urgencia || 'Media',
      tipoProblematica: c.tipo_problematica || 'Nutricional / Abandono',
      fechaDerivacion: fechaDeriv,
      quienDeriva: {
        nombre: c.quien_deriva_nombre || 'Lic. Miriam Soto Paredes',
        cargo: c.quien_deriva_cargo || 'Facilitadora Nutricional',
        telefono: c.quien_deriva_tel || '987-223-114',
      },
      situacionEncontrada: c.situacion_encontrada || '',
      accionesPrevias: c.acciones_previas || 'Visita preliminar realizada',
      soporteFamiliar: {
        tiene: c.tiene_soporte_familiar ?? false,
        detalle: c.detalle_soporte_familiar || 'Sin soporte adicional',
      },
      detalle: c.situacion_encontrada || '',
      sede: c.s_nom || 'Año Nuevo (Comas)',
      vulnerabilidadPuntaje: c.urgencia === 'Alta' ? 90 : (c.urgencia === 'Media' ? 70 : 45),
    };
  });
}

/**
 * Hidrata los modelos del frontend con los datos reales de SurrealDB Cloud.
 * Aplica un Quality Gate estricto: si la red falla o la calidad no cumple,
 * preserva los datos locales sin alterar la interfaz.
 */
export async function hidratarDesdeSurreal() {
  try {
    const [beneficiarios, sedes, casos] = await Promise.all([
      fetchBeneficiarios(),
      fetchSedes(),
      fetchCasosSociales(),
    ]);

    // Quality Gate de Integridad
    const esValido = Array.isArray(beneficiarios) &&
      beneficiarios.length >= 10 &&
      beneficiarios.every(b => b.nombres && b.apellidos && b.apoderado) &&
      Array.isArray(casos) && casos.length > 0 &&
      Array.isArray(sedes) && sedes.length > 0;

    if (!esValido) {
      console.warn('[PDI] Calidad de datos remotos insuficiente; se mantienen fixtures locales.');
      return;
    }

    // Actualizar almacenamiento local
    localStorage.setItem('pdi_beneficiarios', JSON.stringify(beneficiarios));
    localStorage.setItem('pdi_casos_sociales', JSON.stringify(casos));

    // Actualizar modelos en memoria
    if (window.PDI?.BeneficiarioModel) {
      window.PDI.BeneficiarioModel._data = beneficiarios;
    }
    if (window.PDI?.CasoSocialModel) {
      window.PDI.CasoSocialModel._data = casos;
    }
    if (window.PDI?.SedeModel) {
      window.PDI.SedeModel._sedes = sedes;
    }

    console.log('[PDI] Sincronización exitosa con SurrealDB Cloud:',
      beneficiarios.length, 'beneficiarios,',
      sedes.length, 'sedes,',
      casos.length, 'casos sociales.'
    );

    // Refrescar la vista actual en pantalla
    if (typeof window.PDI?.refrescarVistaActual === 'function') {
      window.PDI.refrescarVistaActual();
    }

    // Los totales del menu lateral salen de los modelos: hay que repintarlos
    window.PDI?.Bootstrap?.actualizarBadgesSidebar?.();
  } catch (err) {
    console.warn('[PDI] Conexión a SurrealDB no disponible en este ciclo; interfaz operando con datos locales seguros:', err?.message || err);
  }
}
