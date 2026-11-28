// ===========================================================================
//  EXPORT COMPLETO DE LA BASE (SOLO LECTURA)
// ===========================================================================
//  Uso:
//    node scripts/exportar-base.mjs --out ../backups/incidente-<fecha>/export
//
//  Escribe un JSONL por tabla y un manifest.json con conteos y sha256.
//  No transforma datos, no escribe en la base y no imprime filas.
// ===========================================================================
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Surreal } from 'surrealdb';

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

function serializar(fila) {
  return JSON.stringify(fila, (_, valor) => {
    if (typeof valor === 'bigint') return valor.toString();
    if (valor instanceof Date) return valor.toISOString();
    return valor;
  });
}

const salida = resolve(argumento('--out', '../backups/incidente-2026-11-27/export'));
const env = leerEnv();
if (!env.PUBLIC_SURREAL_URL || !env.SURREAL_USER || !env.SURREAL_PASS) {
  console.error('[export] Faltan PUBLIC_SURREAL_URL, SURREAL_USER o SURREAL_PASS en .env');
  process.exit(2);
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

  const info = await db.query('INFO FOR DB;');
  const tablas = Object.keys((Array.isArray(info) ? info[0] : info)?.tables || {}).sort();
  if (!tablas.length) throw new Error('INFO FOR DB no devolvio tablas.');

  mkdirSync(salida, { recursive: true });
  const manifest = {
    generado: new Date().toISOString(),
    ns: env.PUBLIC_SURREAL_NS,
    db: env.PUBLIC_SURREAL_DB,
    tablas: [],
  };

  for (const tabla of tablas) {
    const res = await db.query(`SELECT * FROM ${tabla};`);
    const filas = Array.isArray(res) ? res[0] : res;
    const lista = Array.isArray(filas) ? filas : [];
    const texto = lista.map(serializar).join('\n') + (lista.length ? '\n' : '');
    const archivo = join(salida, `${tabla}.jsonl`);
    writeFileSync(archivo, texto, 'utf8');
    manifest.tablas.push({
      tabla,
      filas: lista.length,
      bytes: Buffer.byteLength(texto),
      sha256: createHash('sha256').update(texto).digest('hex'),
    });
    console.log(`${tabla}: ${lista.length}`);
  }

  writeFileSync(join(salida, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[export] ${manifest.tablas.length} tablas en ${salida}`);
} catch (err) {
  console.error('[export] Fallo:', err?.message || err);
  process.exitCode = 1;
} finally {
  await db.close().catch(() => {});
}
