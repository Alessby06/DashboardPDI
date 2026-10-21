// ===========================================================================
//  Migración de esquema del Lote 2A
// ===========================================================================
//  Alinea la base con los datos que el Lote 2A empieza a guardar:
//    - persona.alergias (campo nuevo)
//    - voluntario.servicio (Biblioteca Comunitaria y Repostería)
//    - sede.tipo_local (Colegio Público (I.E.) canónico)
//    - inscripcion.tipo_atencion (Atención fija con tilde)
//
//  Los valores legados se mantienen tolerados para que el rollback y los
//  registros históricos sigan siendo válidos. La interfaz solo escribe los
//  valores canónicos.
//
//  Uso:
//    node scripts/migrar-esquema-lote-2a.mjs             # dry-run
//    node scripts/migrar-esquema-lote-2a.mjs --apply     # aplica con respaldo
//    node scripts/migrar-esquema-lote-2a.mjs --rollback  # restaura el último
// ===========================================================================
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Surreal } from 'surrealdb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');
const DIR_BACKUPS = resolve(RAIZ, 'backups');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ROLLBACK = args.includes('--rollback');
const ARCHIVO_ARG = args.find((a) => a.startsWith('--file='));
const ARCHIVO = ARCHIVO_ARG ? ARCHIVO_ARG.slice('--file='.length) : '';
if (APPLY && ROLLBACK) {
  console.error('No se puede usar --apply y --rollback a la vez.');
  process.exit(1);
}

function cargarEnv() {
  const env = {};
  const texto = readFileSync(resolve(RAIZ, '.env'), 'utf8');
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
  return env;
}

const env = cargarEnv();

const CAMPOS = [
  {
    tabla: 'persona',
    campo: 'alergias',
    nuevo:
      'DEFINE FIELD OVERWRITE alergias ON persona TYPE none | string ' +
      'PERMISSIONS FULL;',
  },
  {
    tabla: 'voluntario',
    campo: 'servicio',
    nuevo:
      'DEFINE FIELD OVERWRITE servicio ON voluntario TYPE string ' +
      "ASSERT $value INSIDE ['Desayuno Infantil', 'Lonchera Infantil', 'Casita del Saber', 'Área Social Pastoral (ASP)', 'Biblioteca Comunitaria', 'Talleres de Repostería'] " +
      'PERMISSIONS FULL;',
  },
  {
    tabla: 'sede',
    campo: 'tipo_local',
    nuevo:
      'DEFINE FIELD OVERWRITE tipo_local ON sede TYPE string ' +
      "ASSERT $value INSIDE ['Comedor Comunitario', 'Iglesia Aliada', 'Colegio Publico (I.E.)', 'Colegio Público (I.E.)', 'Colegio Público Aliado', 'Biblioteca Comunal', 'Local Comunal'] " +
      'PERMISSIONS FULL;',
  },
  {
    tabla: 'inscripcion',
    campo: 'tipo_atencion',
    nuevo:
      'DEFINE FIELD OVERWRITE tipo_atencion ON inscripcion TYPE string DEFAULT \'Atención fija\' ' +
      "ASSERT $value INSIDE ['Atención fija', 'Atención itinerante', 'Atencion fija', 'Atencion itinerante'] " +
      'PERMISSIONS FULL;',
  },
];

function marcaTiempo() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function guardarJson(nombre, datos) {
  mkdirSync(DIR_BACKUPS, { recursive: true });
  const ruta = resolve(DIR_BACKUPS, nombre);
  writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n', 'utf8');
  return ruta;
}

function ultimoRespaldo() {
  if (!existsSync(DIR_BACKUPS)) return null;
  if (!readdirSync(DIR_BACKUPS).length) return null;
  const archivos = readdirSync(DIR_BACKUPS)
    .filter((f) => f.startsWith('lote-2a-esquema-backup-') && f.endsWith('.json'))
    .sort();
  return archivos.length ? resolve(DIR_BACKUPS, archivos[archivos.length - 1]) : null;
}

function normalizarDefinicion(definicion) {
  return String(definicion || '')
    .replace(/\bOVERWRITE\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function valoresAssert(definicion) {
  const m = String(definicion || '').match(/ASSERT\s+\$value\s+INSIDE\s+\[(.*?)\]/s);
  if (!m) return null;
  return m[1]
    .split(',')
    .map((valor) => valor.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function defaultDefinicion(definicion) {
  const m = String(definicion || '').match(/DEFAULT\s+'([^']*)'/);
  return m ? m[1] : null;
}

/** Un campo está conforme si ya admite todos los valores nuevos y su default coincide. */
function conforme(actual, nuevo) {
  const actualNorm = normalizarDefinicion(actual);
  const nuevoNorm = normalizarDefinicion(nuevo);
  const actuales = valoresAssert(actual);
  const nuevos = valoresAssert(nuevo);
  if (!nuevos) return actualNorm === nuevoNorm;
  if (!actuales) return false;
  const setActual = new Set(actuales);
  if (!nuevos.every((valor) => setActual.has(valor))) return false;
  const defNuevo = defaultDefinicion(nuevo);
  if (defNuevo !== null && defaultDefinicion(actual) !== defNuevo) return false;
  return true;
}

async function conectar() {
  const db = new Surreal();
  await db.connect(env.PUBLIC_SURREAL_URL);
  await db.signin({
    username: env.PUBLIC_SURREAL_USER,
    password: env.PUBLIC_SURREAL_PASS,
    namespace: env.PUBLIC_SURREAL_NS,
    database: env.PUBLIC_SURREAL_DB,
  });
  await db.use({
    namespace: env.PUBLIC_SURREAL_NS,
    database: env.PUBLIC_SURREAL_DB,
  });
  return db;
}

async function leerDefiniciones(db) {
  const tablas = [...new Set(CAMPOS.map((c) => c.tabla))];
  const definiciones = {};
  for (const tabla of tablas) {
    const res = await db.query(`INFO FOR TABLE ${tabla};`);
    definiciones[tabla] = res[0]?.fields || res[0]?.fd || {};
  }
  return definiciones;
}

async function planificar(db) {
  const definiciones = await leerDefiniciones(db);
  const cambios = [];
  for (const campo of CAMPOS) {
    const actual = definiciones[campo.tabla]?.[campo.campo] || '';
    cambios.push({
      tabla: campo.tabla,
      campo: campo.campo,
      antes: actual,
      despues: campo.nuevo,
      conforme: conforme(actual, campo.nuevo),
    });
  }
  return cambios;
}

function imprimirPlan(cambios, ruta) {
  console.log('');
  console.log('=== Lote 2A · esquema · ' + (APPLY ? 'APPLY' : ROLLBACK ? 'ROLLBACK' : 'DRY-RUN') + ' ===');
  for (const cambio of cambios) {
    console.log(`\n${cambio.tabla}.${cambio.campo}`);
    console.log('  actual : ' + (cambio.antes || '(sin definición)'));
    console.log('  nuevo  : ' + cambio.despues);
    console.log('  estado : ' + (cambio.conforme ? 'ya conforme' : 'requiere actualización'));
  }
  console.log('');
  if (ruta) console.log('Reporte completo:', ruta);
  console.log('');
}

async function aplicar(db, cambios) {
  const pendientes = cambios.filter((c) => !c.conforme);
  if (!pendientes.length) {
    console.log('El esquema ya está conforme. No hay cambios que aplicar.');
    return;
  }
  const ruta = guardarJson(`lote-2a-esquema-backup-${marcaTiempo()}.json`, {
    generado: new Date().toISOString(),
    cambios: pendientes,
  });
  console.log(`Respaldo de definiciones: ${ruta}`);
  for (const cambio of pendientes) {
    await db.query(cambio.despues);
    console.log(`Actualizado: ${cambio.tabla}.${cambio.campo}`);
  }
  console.log(`Aplicados ${pendientes.length} cambios de esquema.`);
}

async function revertir(db, archivo) {
  const ruta = archivo || ultimoRespaldo();
  if (!ruta) {
    console.error('No hay respaldo de esquema para revertir.');
    process.exit(1);
  }
  const respaldo = JSON.parse(readFileSync(ruta, 'utf8'));
  for (const cambio of respaldo.cambios || []) {
    if (!String(cambio.antes || '').startsWith('DEFINE FIELD ')) {
      try {
        await db.query(`REMOVE FIELD ${cambio.campo} ON ${cambio.tabla};`);
        console.log(`Eliminado: ${cambio.tabla}.${cambio.campo}`);
      } catch (err) {
        console.warn(`No se pudo eliminar ${cambio.tabla}.${cambio.campo}: ${err?.message || err}`);
      }
      continue;
    }
    const sql = cambio.antes.replace(/^DEFINE FIELD /, 'DEFINE FIELD OVERWRITE ');
    await db.query(sql);
    console.log(`Restaurado: ${cambio.tabla}.${cambio.campo}`);
  }
  console.log(`Revertidos ${(respaldo.cambios || []).length} cambios de esquema desde ${ruta}.`);
}

async function main() {
  const db = await conectar();
  try {
    if (ROLLBACK) {
      await revertir(db, ARCHIVO);
      return;
    }
    const cambios = await planificar(db);
    const ruta = guardarJson(
      `lote-2a-esquema-${APPLY ? 'apply' : 'dry-run'}-${marcaTiempo()}.json`,
      { generado: new Date().toISOString(), cambios },
    );
    imprimirPlan(cambios, ruta);
    if (APPLY) await aplicar(db, cambios);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migración de esquema del Lote 2A:', err?.message || err);
  process.exit(1);
});
