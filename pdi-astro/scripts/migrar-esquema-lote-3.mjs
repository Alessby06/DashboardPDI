// ===========================================================================
//  Migración de esquema del Lote 3 · Alineación con el modelo oficial
// ===========================================================================
//  Ajusta el esquema a los documentos del programa:
//
//    - inscripcion.modalidad: solo "Comunitaria" e "I.E." (la ficha escribe
//      COMUNITARIA o I.E.).
//    - inscripcion.tipo_atencion: puede quedar vacio. La modalidad de atencion
//      (fija o itinerante) solo la pide el servicio educativo: la ficha A1 de
//      Casita del Saber. En Desayuno y Lonchera no existe el dato.
//    - inscripcion.programa: solo las tres estrategias reales. El programa no
//      tiene un programa "Mixto".
//    - indicador_socioeconomico: tabla nueva con los 13 indicadores y sus
//      pesos, que hasta ahora vivian escritos a mano en el codigo del
//      simulador social. Los pesos salen de la hoja "Indicadores" de
//      "Evaluacion Socioeconomica.xlsx".
//
//  Este script cambia el esquema: necesita la cuenta de administracion
//  (pdi_app). Con la cuenta de la web (pdi_web) se detiene y lo dice.
//
//  Antes hay que correr los DATOS (migrar-lote-3.mjs --apply) con el esquema
//  viejo: si un registro guardara todavia "Mixto" o "Institucion Educativa",
//  apretar el esquema le impediria actualizarse.
//
//  Uso:
//    node scripts/migrar-esquema-lote-3.mjs             # dry-run
//    node scripts/migrar-esquema-lote-3.mjs --apply     # aplica con respaldo
//    node scripts/migrar-esquema-lote-3.mjs --rollback  # restaura el ultimo
// ===========================================================================
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const CAMBIOS = [
  {
    tabla: 'inscripcion',
    tipo: 'campo',
    nombre: 'modalidad',
    nuevo:
      'DEFINE FIELD OVERWRITE modalidad ON inscripcion TYPE string '
      + "ASSERT $value INSIDE ['Comunitaria', 'I.E.'] PERMISSIONS FULL;",
  },
  {
    tabla: 'inscripcion',
    tipo: 'campo',
    nombre: 'tipo_atencion',
    nuevo:
      'DEFINE FIELD OVERWRITE tipo_atencion ON inscripcion TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'inscripcion',
    tipo: 'campo',
    nombre: 'programa',
    nuevo:
      'DEFINE FIELD OVERWRITE programa ON inscripcion TYPE string '
      + "ASSERT $value INSIDE ['Desayuno Infantil', 'Lonchera Infantil', 'Casita del Saber'] PERMISSIONS FULL;",
  },
  {
    tabla: 'indicador_socioeconomico',
    tipo: 'tabla',
    nombre: 'indicador_socioeconomico',
    nuevo: [
      'DEFINE TABLE indicador_socioeconomico SCHEMAFULL;',
      "DEFINE FIELD dimension ON indicador_socioeconomico TYPE string ASSERT $value != '' PERMISSIONS FULL;",
      'DEFINE FIELD peso ON indicador_socioeconomico TYPE decimal ASSERT $value >= 0f AND $value <= 1f PERMISSIONS FULL;',
      'DEFINE FIELD orden ON indicador_socioeconomico TYPE int PERMISSIONS FULL;',
      'DEFINE FIELD descripcion ON indicador_socioeconomico TYPE none | string PERMISSIONS FULL;',
      'DEFINE FIELD activo ON indicador_socioeconomico TYPE bool DEFAULT true PERMISSIONS FULL;',
      'DEFINE INDEX idx_indicador_orden ON indicador_socioeconomico FIELDS orden;',
    ].join('\n'),
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
  const archivos = readdirSync(DIR_BACKUPS)
    .filter((f) => f.startsWith('lote-3-esquema-backup-') && f.endsWith('.json'))
    .sort();
  return archivos.length ? resolve(DIR_BACKUPS, archivos[archivos.length - 1]) : null;
}

function normalizarDefinicion(definicion) {
  return String(definicion || '')
    .replace(/\bOVERWRITE\s+/g, '')
    .replace(/;\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function valoresAssert(definicion) {
  const m = String(definicion || '').match(/ASSERT\s+\$value\s+INSIDE\s+\[(.*?)\]/s);
  if (!m) return null;
  return m[1].split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function conforme(antes, nuevo) {
  const nuevos = valoresAssert(nuevo);
  if (nuevos) {
    const actuales = valoresAssert(antes);
    if (!actuales) return false;
    return actuales.length === nuevos.length && nuevos.every((v) => actuales.includes(v));
  }
  if (String(nuevo).includes('DEFINE TABLE')) return !String(antes || '').trim();
  return normalizarDefinicion(antes) === normalizarDefinicion(nuevo);
}

async function planificar(db) {
  const definiciones = {};
  const tablas = [...new Set(CAMBIOS.map((c) => c.tabla))];
  for (const tabla of tablas) {
    const res = await db.query(`INFO FOR TABLE ${tabla};`);
    definiciones[tabla] = res[0] || {};
  }
  return CAMBIOS.map((cambio) => {
    const info = definiciones[cambio.tabla] || {};
    const antes = cambio.tipo === 'indice'
      ? (info.indexes || {})[cambio.nombre] || ''
      : (info.fields || {})[cambio.nombre] || '';
    return { ...cambio, antes, conforme: conforme(antes, cambio.nuevo) };
  });
}

function imprimirPlan(cambios, ruta) {
  console.log('');
  console.log('=== Lote 3 · esquema · ' + (APPLY ? 'APPLY' : ROLLBACK ? 'ROLLBACK' : 'DRY-RUN') + ' ===');
  for (const cambio of cambios) {
    console.log(`\n${cambio.tabla}.${cambio.nombre} (${cambio.tipo})`);
    console.log('  actual : ' + (cambio.antes || '(sin definicion)'));
    console.log('  nuevo  : ' + String(cambio.nuevo).split('\n').join(' | '));
    console.log('  estado : ' + (cambio.conforme ? 'ya conforme' : 'requiere actualizacion'));
  }
  console.log('');
  if (ruta) console.log('Reporte completo:', ruta);
  console.log('');
}

async function aplicar(db, cambios) {
  const pendientes = cambios.filter((c) => !c.conforme);
  if (!pendientes.length) {
    console.log('El esquema ya esta conforme.');
    return;
  }
  const ruta = guardarJson(`lote-3-esquema-backup-${marcaTiempo()}.json`, {
    generado: new Date().toISOString(),
    cambios: pendientes.map(({ tabla, tipo, nombre, antes, nuevo }) => ({
      tabla, tipo, nombre, antes, nuevo,
    })),
  });
  console.log(`Respaldo de definiciones: ${ruta}`);
  for (const cambio of pendientes) {
    await db.query(cambio.nuevo);
    console.log(`Actualizado: ${cambio.tabla}.${cambio.nombre}`);
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
    if (!cambio.antes) {
      if (cambio.tipo === 'tabla') {
        await db.query(`REMOVE TABLE ${cambio.nombre};`);
      } else if (cambio.tipo === 'indice') {
        await db.query(`REMOVE INDEX ${cambio.nombre} ON ${cambio.tabla};`);
      } else {
        await db.query(`REMOVE FIELD ${cambio.nombre} ON ${cambio.tabla};`);
      }
      console.log(`Eliminado: ${cambio.tabla}.${cambio.nombre}`);
      continue;
    }
    const sql = cambio.antes
      .replace(/^DEFINE FIELD /, 'DEFINE FIELD OVERWRITE ')
      .replace(/^DEFINE INDEX /, 'DEFINE INDEX OVERWRITE ');
    await db.query(sql);
    console.log(`Restaurado: ${cambio.tabla}.${cambio.nombre}`);
  }
  console.log(`Revertidos ${(respaldo.cambios || []).length} cambios de esquema desde ${ruta}.`);
}

async function main() {
  const db = await conectarMigracion({ esquema: true });
  try {
    if (ROLLBACK) {
      await revertir(db, ARCHIVO);
      return;
    }
    const cambios = await planificar(db);
    const ruta = guardarJson(
      `lote-3-esquema-${APPLY ? 'apply' : 'dry-run'}-${marcaTiempo()}.json`,
      { generado: new Date().toISOString(), cambios },
    );
    imprimirPlan(cambios, ruta);
    if (APPLY) await aplicar(db, cambios);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migracion de esquema del Lote 3:', err?.message || err);
  process.exit(1);
});
