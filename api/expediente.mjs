// ===========================================================================
//  FUNCTION DE VERCEL: EXPEDIENTE PUNTUAL
// ===========================================================================
//  Ruta: GET /api/expediente?persona=<clave>&inactivo=1
//
//  Es la única vía de lectura del expediente en producción. Valida la cookie
//  de sesión y aplica rol + área + sede en el servidor: el navegador ya no
//  puede saltarse el ámbito cambiando localStorage.
//
//  La respuesta conserva la forma que espera `mapearBeneficiarios`: la fila de
//  `persona` con `ins`, `tams`, `alergias`, `apo` y `pct`, más la sede de la
//  inscripción en `sedes`. El cliente no vuelve a consultar la base.
// ===========================================================================
import { sesionDeRequest, consultaLote, configClinicaDe } from './_cuentaBase.mjs';

const CLAVE_VALIDA = /^[A-Za-z0-9_-]{1,64}$/;

// Puente de migración compartido con el cliente (db.js). Si producción cambia
// la bandera, la Function y el navegador deben leer las mismas columnas.
const ESQUEMA_NUEVO = String(process.env.PUBLIC_ESQUEMA_USUARIO || '0') === '1';
const F_USUARIO = ESQUEMA_NUEVO ? 'usuario_id' : 'persona_id';
const T_VINCULO = ESQUEMA_NUEVO ? 'usuario_vinculado' : 'persona_vinculada';
const F_MENOR = ESQUEMA_NUEVO ? 'usuario_id' : 'menor_id';

function json(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** Servicios visibles que aporta cada programa, igual que en la vista. */
function serviciosDe(programa) {
  if (programa === 'Mixto') return ['Desayuno Infantil', 'Casita del Saber'];
  if (programa === 'Casita del Saber') return ['Casita del Saber'];
  if (programa === 'Lonchera Infantil') return ['Desayuno Infantil', 'Lonchera Saludable'];
  return ['Desayuno Infantil'];
}

/**
 * Regla única de alcance: rol + área + sede. Es la misma idea que
 * `puedeVerExpediente` del cliente, pero aquí no se puede manipular.
 * Coordinación y administración ven todo.
 */
export function puedeVer(fila, sede, cuenta) {
  // Sin inscripción no hay área ni sede que evaluar: nunca es visible.
  if (!fila?.ins) return false;
  const rol = cuenta?.rol;
  if (!rol) return false;
  if (rol === 'coord' || rol === 'admin') return true;

  const areas = {
    facilitadora: /alimentari|nutricion|nutrici|desayuno|lonchera|comedor|salud|cred/i,
    promotora: /educativ|casita|saber/i,
    social: /social|pastoral|asp/i,
  };
  const patron = areas[rol];
  if (!patron) return false;

  const programa = fila?.ins?.programa || 'Desayuno Infantil';
  const estrategias = Array.isArray(fila?.ins?.estrategias) ? fila.ins.estrategias : [];
  const texto = [sede?.nombre || '', ...serviciosDe(programa), ...estrategias].join(' ');
  if (!patron.test(texto)) return false;

  // `cuenta.sedes` guarda identificadores de registro (sede:xxx), no nombres.
  // Un registro sin sede se deja pasar: es la misma regla que `alcance.js`
  // aplica al padrón.
  const sedes = Array.isArray(cuenta.sedes) ? cuenta.sedes : [];
  if (!sedes.length) return true;
  const sedeId = String(fila?.ins?.sede_id || '');
  if (!sedeId) return true;
  return sedes.includes(sedeId);
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') return json({ ok: false, error: 'Método no permitido.' }, 405);

    const url = new URL(request.url);
    const clave = String(url.searchParams.get('persona') || '').trim();
    if (!CLAVE_VALIDA.test(clave)) return json({ ok: false, error: 'Identificador no válido.' }, 400);
    const inactivo = url.searchParams.get('inactivo') === '1';
    const estado = inactivo ? 'false' : 'true';

    let sesion;
    try {
      sesion = await sesionDeRequest(request, process.env);
    } catch (err) {
      console.error('[expediente] sesión:', err?.message || err);
      return json({ ok: false, error: 'No se pudo verificar la sesión.' }, 503);
    }
    if (!sesion?.cuenta) return json({ ok: false, error: 'Sesión requerida.' }, 401);

    try {
      const cfg = configClinicaDe(process.env);
      // `clave` ya pasó por una lista blanca estricta: no puede salir del
      // literal de la consulta. La persona y el catálogo de sedes viajan en un
      // solo viaje a la base; la sede se elige en memoria por `ins.sede_id`.
      const [filas, sedesTodas] = await consultaLote(cfg, [`SELECT *,
        centro_salud.nombre AS centro_salud_nombre,
        institucion_origen.nombre AS institucion_origen_nombre,
        (SELECT * FROM alergia WHERE persona_id = $parent.id) AS alergias,
        (SELECT * FROM inscripcion WHERE ${F_USUARIO} = $parent.id AND activo = ${estado} LIMIT 1)[0] AS ins,
        (SELECT * FROM tamizaje_hemoglobina WHERE persona_id = $parent.id AND activo = true ORDER BY fecha_tamizaje DESC) AS tams,
        (SELECT cuidador_id.nombres AS c_nom, cuidador_id.apellidos AS c_ape, cuidador_id.numero_documento AS c_dni, cuidador_id.sexo AS c_sexo, parentesco FROM ${T_VINCULO} WHERE ${F_MENOR} = $parent.id LIMIT 1)[0] AS apo,
        (SELECT VALUE pct_exoneracion FROM aporte WHERE inscripcion_id.${F_USUARIO} = $parent.id ORDER BY periodo DESC, mes DESC LIMIT 1)[0] AS pct
      FROM persona
      WHERE id = type::record('persona', '${clave}') LIMIT 1;`,
      'SELECT * FROM sede ORDER BY creado_el;']);

      const fila = Array.isArray(filas) ? filas[0] : null;
      if (!fila) return json({ ok: false, error: 'No encontrado.' }, 404);
      // Sin inscripción en el estado pedido no hay expediente que mostrar: el
      // cliente lo descartaría igual, así que se responde 404 sin filtrar más.
      if (!fila.ins) return json({ ok: false, error: 'No encontrado.' }, 404);

      const sedeId = String(fila.ins.sede_id || '');
      const sede = (Array.isArray(sedesTodas) ? sedesTodas : [])
        .find((s) => String(s.id) === sedeId) || null;

      if (!puedeVer(fila, sede, sesion.cuenta)) {
        return json({ ok: false, error: 'Sin acceso a este expediente.' }, 403);
      }

      return json({
        ok: true,
        fila,
        sedes: sede ? [{
          _rawId: String(sede.id || ''),
          nombre: sede.nombre || '',
          distrito: sede.distrito || '',
          direccion: sede.direccion || '',
          activo: sede.activo !== false,
        }] : [],
      });
    } catch (err) {
      console.error('[expediente] consulta:', err?.message || err);
      return json({ ok: false, error: 'No se pudo leer el expediente.' }, 500);
    }
  },
};
