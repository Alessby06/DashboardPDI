// ===========================================================================
//  AUDITOR DE INTEGRIDAD CONTRA LA NUBE (SOLO LECTURA)
// ===========================================================================
//  Uso:
//    node scripts/auditar-integridad.mjs
//    node scripts/auditar-integridad.mjs --json
//
//  Sale con 1 si hay violaciones bloqueantes. Las advertencias historicas no
//  cambian el codigo de salida.
// ===========================================================================
import { readFileSync } from 'node:fs';
import { Surreal } from 'surrealdb';
import { auditar } from './_integridad-core.mjs';
import { campoUsuario } from './_guardas.mjs';

function leerEnv(ruta = '.env') {
  const env = {};
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
  return env;
}

const env = leerEnv();
if (!env.PUBLIC_SURREAL_URL || !env.SURREAL_USER || !env.SURREAL_PASS) {
  console.error('[audit] Faltan PUBLIC_SURREAL_URL, SURREAL_USER o SURREAL_PASS en .env');
  process.exit(2);
}

const db = new Surreal();
let resultado;
try {
  await db.connect(env.PUBLIC_SURREAL_URL);
  await db.signin({
    username: env.SURREAL_USER,
    password: env.SURREAL_PASS,
    namespace: env.PUBLIC_SURREAL_NS,
    database: env.PUBLIC_SURREAL_DB,
  });
  await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });

  const campo = campoUsuario(env);
  const [personasRes, inscripcionesRes, casosRes, tamizajesRes, aportesRes, asistenciasRes, evaluacionesRes, esquemaRes] =
    await Promise.all([
      db.query('SELECT id, activo, codigo FROM persona;'),
      db.query(`SELECT id, ${campo} AS persona_id, activo FROM inscripcion;`),
      db.query('SELECT id, usuario_id AS persona_id, activo FROM caso_social;'),
      db.query('SELECT id, persona_id, inscripcion_id, activo FROM tamizaje_hemoglobina;'),
      db.query('SELECT id, inscripcion_id FROM aporte;'),
      db.query('SELECT id, inscripcion_id FROM asistencia_diaria;'),
      db.query('SELECT id, persona_id, activo FROM evaluacion_socioeconomica;'),
      db.query('INFO FOR TABLE inscripcion; INFO FOR TABLE caso_social;'),
    ]);

  const filas = (res) => {
    const primera = Array.isArray(res) ? res[0] : res;
    return Array.isArray(primera) ? primera : [];
  };
  const info = (Array.isArray(esquemaRes) ? esquemaRes : []).map(x => (Array.isArray(x) ? x[0] : x));

  resultado = auditar({
    personas: filas(personasRes),
    inscripciones: filas(inscripcionesRes),
    casos: filas(casosRes),
    tamizajes: filas(tamizajesRes),
    aportes: filas(aportesRes),
    asistencias: filas(asistenciasRes),
    evaluaciones: filas(evaluacionesRes),
    esquema: { inscripcion: info[0], caso_social: info[1] },
  });
} catch (err) {
  console.error('[audit] Fallo:', err?.message || err);
  process.exitCode = 2;
} finally {
  await db.close().catch(() => {});
}

if (!resultado) process.exit(2);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(resultado, null, 2));
} else {
  console.log('=== Integridad del padrón ===');
  console.log(`Personas: ${resultado.resumen.personas} (${resultado.resumen.personasActivas} activas)`);
  console.log(`Inscripciones: ${resultado.resumen.inscripciones} (${resultado.resumen.inscripcionesActivas} activas)`);
  console.log(`Casos activos: ${resultado.resumen.casosActivos}`);
  console.log(`Tamizajes: ${resultado.resumen.tamizajes}`);
  console.log(`Violaciones: ${resultado.violaciones.length}`);
  for (const v of resultado.violaciones.slice(0, 30)) {
    console.log(`  [${v.codigo}] ${v.id} — ${v.detalle}`);
  }
  if (resultado.violaciones.length > 30) console.log(`  ... y ${resultado.violaciones.length - 30} más`);
  console.log(`Advertencias historicas: ${resultado.advertencias.length}`);
  for (const a of resultado.advertencias.slice(0, 10)) {
    console.log(`  [${a.codigo}] ${a.id}`);
  }
  if (resultado.advertencias.length > 10) console.log(`  ... y ${resultado.advertencias.length - 10} más`);
  console.log(resultado.ok ? 'RESULTADO: OK' : 'RESULTADO: CON VIOLACIONES');
}

process.exitCode = resultado.ok ? 0 : 1;
