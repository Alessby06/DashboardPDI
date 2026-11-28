// ===========================================================================
//  LIMPIEZA DE REGISTROS DE PRUEBA DUPLICADOS (BAJA LOGICA, SIN BORRAR)
// ===========================================================================
//  Uso:
//    node scripts/limpiar-duplicados.mjs
//    PDI_ALLOW_DESTRUCTIVE=1 node scripts/limpiar-duplicados.mjs \
//      --apply --backup ../backups/incidente-2026-11-27/export
//
//  Solo toca los registros listados. No decide sobre personas reales con
//  codigo duplicado (0010 Jose Carlos, 0012 Alfonso): eso queda para revision.
// ===========================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Surreal } from 'surrealdb';
import { exigirPermiso } from './_guardas.mjs';

function leerEnv(ruta = '.env') {
  const env = {};
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
  return env;
}

function argumento(nombre, defecto = '') {
  const i = process.argv.indexOf(nombre);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : defecto;
}

const TEST = [
  { id: 'persona:⟨2qqms3i961ebhhtlxm11⟩', codigo: 'QA-PRUEBA-0014-A' },
  { id: 'persona:⟨2x3xjahrtdffehi47ozu⟩', codigo: 'QA-PRUEBA-0014-B' },
  { id: 'persona:qcdm7x4qegbyqgus26dq', codigo: 'QA-PRUEBA-0014-C' },
  { id: 'persona:hbzezv0ctt4czcnrz1nv', codigo: 'QA-BODOQUE-0011-A' },
  { id: 'persona:p8zxez0jj4p276nhhgna', codigo: 'QA-BODOQUE-0011-B' },
  { id: 'persona:t22ucrnfu6bw9o163ig9', codigo: 'QA-BODOQUE-0011-C' },
  { id: 'persona:⟨6q2e3homxd1jnkd2xqzs⟩', codigo: 'QA-0010-DUP' },
  { id: 'persona:n76cxcmmha2dx6o5epzo', codigo: 'QA-0011-DUP' },
];

const apply = process.argv.includes('--apply');
const env = leerEnv();
const db = new Surreal();
let log = [];

try {
  await db.connect(env.PUBLIC_SURREAL_URL);
  await db.signin({
    username: env.SURREAL_USER,
    password: env.SURREAL_PASS,
    namespace: env.PUBLIC_SURREAL_NS,
    database: env.PUBLIC_SURREAL_DB,
  });
  await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });

  // Comprobar que ninguno tiene caso o inscripcion activa.
  for (const item of TEST) {
    const res = await db.query(`SELECT
      (SELECT count() FROM caso_social WHERE usuario_id = $id AND activo = true) AS casos,
      (SELECT count() FROM inscripcion WHERE persona_id = $id AND activo = true) AS activas
      FROM ONLY $id;`, { id: item.id });
    const fila = (Array.isArray(res) ? res[0] : res)?.[0] || {};
    const casos = Number(fila.casos?.[0]?.count ?? fila.casos ?? 0);
    const activas = Number(fila.activas?.[0]?.count ?? fila.activas ?? 0);
    log.push({ ...item, casos, activas });
    console.log(`${casos === 0 && activas === 0 ? 'OK  ' : 'BLOQ'} ${item.id} → ${item.codigo} (casos=${casos}, inscripciones=${activas})`);
  }

  if (log.some(f => f.casos > 0 || f.activas > 0)) {
    console.error('[limpieza] Hay registros con caso o inscripcion activa: no se toca ninguno.');
    process.exitCode = 1;
  } else if (!apply) {
    console.log('[limpieza] dry-run: no se escribio nada.');
  } else {
    const permiso = exigirPermiso({
      apply,
      backup: argumento('--backup', process.env.PDI_BACKUP || ''),
      env: process.env,
      ns: env.PUBLIC_SURREAL_NS,
      db: env.PUBLIC_SURREAL_DB,
    });
    if (!permiso.ok) {
      console.error(`[limpieza] Rechazado (${permiso.motivo}): ${permiso.detalle}`);
      process.exitCode = 2;
    } else {
      for (const item of TEST) {
        await db.query(`
          UPDATE ${item.id} SET
            activo = false,
            codigo = $codigo,
            eliminado_el = time::now()
          RETURN AFTER;
        `, { codigo: item.codigo });
      }
      const logRuta = join(
        dirname(resolve(argumento('--backup', '../backups/incidente-2026-11-27/export'))),
        `limpieza-${Date.now()}.json`,
      );
      writeFileSync(logRuta, JSON.stringify({ generado: new Date().toISOString(), registros: log }, null, 2), 'utf8');
      console.log(`[limpieza] ${TEST.length} registros de prueba dados de baja. Log: ${logRuta}`);
    }
  }
} catch (err) {
  console.error('[limpieza] Fallo:', err?.message || err);
  process.exitCode = 1;
} finally {
  await db.close().catch(() => {});
}
