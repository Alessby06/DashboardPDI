// ===========================================================================
//  Migración de esquema del Lote 1
// ===========================================================================
//  Alinea las validaciones de la base con los catálogos de la interfaz:
//    - persona.esquema_salud
//    - usuario_vinculado.parentesco
//    - inscripcion.modalidad
//
//  Los valores legados se mantienen tolerados para que el rollback y los
//  registros históricos sigan siendo válidos. La interfaz solo ofrece los
//  valores canónicos.
//
//  Uso:
//    node scripts/migrar-esquema-lote-1.mjs             # dry-run
//    node scripts/migrar-esquema-lote-1.mjs --apply     # aplica con respaldo
//    node scripts/migrar-esquema-lote-1.mjs --rollback  # restaura el último
//
//  Para revertir el Lote 1 completo, primero se revierten los datos
//  (migrar-lote-1.mjs --rollback) y después el esquema: las definiciones
//  antiguas no aceptan las etiquetas nuevas.
// ===========================================================================
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Surreal } from 'surrealdb';
import { conectarMigracion } from './conexion-migracion.mjs';

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
    campo: 'esquema_salud',
    nuevo:
      "DEFINE FIELD OVERWRITE esquema_salud ON persona TYPE string DEFAULT 'SIS Gratuito' " +
      "ASSERT $value INSIDE ['SIS Gratuito', 'EsSalud', 'PNP / FFAA', 'Ninguno', 'SIS', 'PNP/FFAA', 'No tiene', 'Privado', 'Desconocido'] " +
      'PERMISSIONS FULL;',
  },
  {
    tabla: 'usuario_vinculado',
    campo: 'parentesco',
    nuevo:
      'DEFINE FIELD OVERWRITE parentesco ON usuario_vinculado TYPE string ' +
      "ASSERT $value INSIDE ['Madre', 'Padre', 'Abuela', 'Abuelo', 'Tía', 'Tío', 'Prima', 'Primo', 'Hermana', 'Hermano', 'Padrino', 'Madrina', 'Cuidador Legal', 'Familiar', 'Padrastro', 'Madrastra', 'Hermano/a', 'Otro', 'Tia', 'Tio', 'Tutor Legal'] " +
      'PERMISSIONS FULL;',
  },
  {
    tabla: 'inscripcion',
    campo: 'modalidad',
    nuevo:
      'DEFINE FIELD OVERWRITE modalidad ON inscripcion TYPE string ' +
      "ASSERT $value INSIDE ['Comunitaria', 'Institución Educativa', 'Institucion Educativa'] " +
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
    .filter((f) => f.startsWith('lote-1-esquema-backup-') && f.endsWith('.json'))
    .sort();
  return archivos.length ? resolve(DIR_BACKUPS, archivos[archivos.length - 1]) : null;
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
  const actuales = new Set(valoresAssert(actual) || []);
  const nuevos = valoresAssert(nuevo) || [];
  if (!nuevos.length || !nuevos.every((valor) => actuales.has(valor))) return false;
  const defNuevo = defaultDefinicion(nuevo);
  if (defNuevo !== null && defaultDefinicion(actual) !== defNuevo) return false;
  return true;
}

async function conectar() {
  return await conectarMigracion({ esquema: true });
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
    if (!actual) {
      console.warn(`No existe ${campo.tabla}.${campo.campo}; se omite.`);
      continue;
    }
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
  console.log('=== Lote 1 · esquema · ' + (APPLY ? 'APPLY' : ROLLBACK ? 'ROLLBACK' : 'DRY-RUN') + ' ===');
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
  const ruta = guardarJson(`lote-1-esquema-backup-${marcaTiempo()}.json`, {
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
      console.error(`Definición anterior inválida para ${cambio.tabla}.${cambio.campo}; se omite.`);
      continue;
    }
    const sql = cambio.antes.replace('DEFINE FIELD ', 'DEFINE FIELD OVERWRITE ');
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
      `lote-1-esquema-${APPLY ? 'apply' : 'dry-run'}-${marcaTiempo()}.json`,
      { generado: new Date().toISOString(), cambios },
    );
    imprimirPlan(cambios, ruta);
    if (APPLY) await aplicar(db, cambios);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migración de esquema del Lote 1:', err?.message || err);
  process.exit(1);
});
