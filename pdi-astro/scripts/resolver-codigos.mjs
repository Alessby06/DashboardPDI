// ===========================================================================
//  RESUELVE CODIGOS DUPLICADOS DE PERSONAS INACTIVAS (SIN BORRAR)
// ===========================================================================
//  Uso:
//    node scripts/resolver-codigos.mjs
//    PDI_ALLOW_DESTRUCTIVE=1 node scripts/resolver-codigos.mjs --apply \
//      --backup ../backups/incidente-2026-11-27/export
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

const CAMBIOS = [
  { id: 'persona:qpovuwx25b01zav3wt2n', codigo: '0012-IS2026-RET', nota: 'Duplicado inactivo de 0012; conserva historial.' },
  { id: 'persona:iechchfe1nzkuxi4g6q1', codigo: '0010-IS2026-DUP', nota: 'Persona inactiva sin vinculos; libera el codigo 0010.' },
];

const apply = process.argv.includes('--apply');
const env = leerEnv();
const db = new Surreal();
const resumen = [];

try {
  await db.connect(env.PUBLIC_SURREAL_URL);
  await db.signin({
    username: env.SURREAL_USER,
    password: env.SURREAL_PASS,
    namespace: env.PUBLIC_SURREAL_NS,
    database: env.PUBLIC_SURREAL_DB,
  });
  await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });

  for (const c of CAMBIOS) {
    const res = await db.query(`SELECT id, codigo, activo,
      (SELECT count() FROM inscripcion WHERE persona_id = ${c.id} AND activo = true) AS activas,
      (SELECT count() FROM caso_social WHERE usuario_id = ${c.id} AND activo = true) AS casos
      FROM ${c.id};`);
    const primera = Array.isArray(res) ? res[0] : res;
    const fila = (Array.isArray(primera) ? primera[0] : primera) || {};
    const activas = Number(fila.activas?.[0]?.count ?? fila.activas ?? 0);
    const casos = Number(fila.casos?.[0]?.count ?? fila.casos ?? 0);
    const seguro = fila.activo === false && activas === 0 && casos === 0;
    console.log(`${seguro ? 'OK  ' : 'BLOQ'} ${c.id}: ${fila.codigo} → ${c.codigo} (activo=${fila.activo}, ins=${activas}, casos=${casos})`);
    resumen.push({ ...c, seguro, anterior: fila.codigo });
  }

  if (resumen.some(r => !r.seguro)) {
    console.error('[codigos] Hay registros activos o vinculados: no se toca ninguno.');
    process.exitCode = 1;
  } else if (!apply) {
    console.log('[codigos] dry-run: no se escribio nada.');
  } else {
    const permiso = exigirPermiso({
      apply,
      backup: argumento('--backup', process.env.PDI_BACKUP || ''),
      env: process.env,
      ns: env.PUBLIC_SURREAL_NS,
      db: env.PUBLIC_SURREAL_DB,
    });
    if (!permiso.ok) {
      console.error(`[codigos] Rechazado (${permiso.motivo}): ${permiso.detalle}`);
      process.exitCode = 2;
    } else {
      for (const c of CAMBIOS) {
        await db.query(`UPDATE ${c.id} SET codigo = $codigo RETURN AFTER;`, { codigo: c.codigo });
      }
      const logRuta = join(
        dirname(resolve(argumento('--backup', '../backups/incidente-2026-11-27/export'))),
        `codigos-${Date.now()}.json`,
      );
      writeFileSync(logRuta, JSON.stringify({ generado: new Date().toISOString(), cambios: resumen }, null, 2), 'utf8');
      console.log(`[codigos] ${CAMBIOS.length} codigos actualizados. Log: ${logRuta}`);
    }
  }
} catch (err) {
  console.error('[codigos] Fallo:', err?.message || err);
  process.exitCode = 1;
} finally {
  await db.close().catch(() => {});
}
