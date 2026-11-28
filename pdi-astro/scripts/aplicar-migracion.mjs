// ===========================================================================
//  APLICADOR DE MIGRACIONES DE ESQUEMA
// ===========================================================================
//  Uso:
//    node scripts/aplicar-migracion.mjs --file scripts/migracion-integridad.surql
//    node scripts/aplicar-migracion.mjs --file ... --verify
//    PDI_ALLOW_DESTRUCTIVE=1 node scripts/aplicar-migracion.mjs \
//      --file ... --apply --backup ../backups/incidente-2026-11-27/export
//
//  Sin --apply o --verify no conecta: solo imprime el DDL y el target.
// ===========================================================================
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

const archivo = argumento('--file');
if (!archivo) {
  console.error('[migracion] Falta --file');
  process.exit(2);
}
const sql = readFileSync(resolve(archivo), 'utf8');
const env = leerEnv();
const apply = process.argv.includes('--apply');
const verify = process.argv.includes('--verify');

if (!apply && !verify) {
  console.log(`[migracion] dry-run sobre ${env.PUBLIC_SURREAL_NS}/${env.PUBLIC_SURREAL_DB}`);
  console.log(sql);
  process.exit(0);
}

if (apply) {
  const permiso = exigirPermiso({
    apply,
    backup: argumento('--backup', process.env.PDI_BACKUP || ''),
    env: process.env,
    ns: env.PUBLIC_SURREAL_NS,
    db: env.PUBLIC_SURREAL_DB,
  });
  if (!permiso.ok) {
    console.error(`[migracion] Rechazado (${permiso.motivo}): ${permiso.detalle}`);
    process.exit(2);
  }
}

const db = new Surreal();
try {
  await db.connect(env.PUBLIC_SURREAL_URL);
  await db.signin({
    username: env.SURREAL_USER,
    password: env.SURREAL_PASS,
    namespace: env.PUBLIC_SURREAL_NS,
    database: env.PUBLIC_SURREAL_DB,
  });
  await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });

  if (verify) {
    try {
      const res = await db.query(`BEGIN;\n${sql}\nCANCEL;`);
      console.log('[migracion] verify OK (rollback). Resultado:', JSON.stringify(res)?.slice(0, 300));
    } catch (err) {
      const mensaje = String(err?.message || err);
      // CANCEL revierte la transaccion y el SDK la reporta como cancelada:
      // eso significa que todo el DDL se ejecuto sin error.
      if (/cancel+ed transaction|transaction .*cancel/i.test(mensaje)) {
        console.log('[migracion] verify OK (rollback).');
      } else {
        throw err;
      }
    }
  } else {
    const res = await db.query(sql);
    console.log('[migracion] apply OK. Resultado:', JSON.stringify(res)?.slice(0, 300));
  }
} catch (err) {
  console.error('[migracion] Fallo:', err?.message || err);
  process.exitCode = 1;
} finally {
  await db.close().catch(() => {});
}
