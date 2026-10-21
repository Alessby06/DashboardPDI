// ===========================================================================
//  Migración de esquema del Lote 2B
// ===========================================================================
//  Cierra la ventana de valores heredados y deja la salud como el programa la
// definió:
//
//    - persona.esquema_salud: solo los 6 valores canonicos (incluye "Privado"
//      y "Desconocido", que antes vivian solo en el esquema)
//    - persona.alergias: se elimina (la alergia vive en la tabla `alergia`)
//    - persona.plan_salud: se elimina (nadie lo llenaba)
//    - inscripcion.modalidad, inscripcion.tipo_atencion, sede.tipo_local y
//      usuario_vinculado.parentesco: solo la forma canonica
//    - alergia.activo, alergia.fecha_baja y alergia.motivo_baja: la baja
//      logica de una alergia, con fecha y motivo (Ley 29733)
//    - idx_alergia_persona: indice por persona para la subconsulta del padron
//
//  Los datos se normalizan antes (migrar-lote-2b.mjs --apply): si un registro
//  guardara todavia una forma vieja, apretar el esquema le impediria
//  actualizarse.
//
//  Uso:
//    node scripts/migrar-esquema-lote-2b.mjs             # dry-run
//    node scripts/migrar-esquema-lote-2b.mjs --apply     # aplica con respaldo
//    node scripts/migrar-esquema-lote-2b.mjs --rollback  # restaura el ultimo
// ===========================================================================
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Surreal } from 'surrealdb';
import { conectarMigracion } from './conexion-migracion.mjs';
import {
  SEGUROS,
  MODALIDADES,
  TIPOS_LOCAL,
  PARENTESCOS,
} from '../src/data/opcionesBeneficiario.js';

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

const lista = (valores) => valores.map((v) => `'${v}'`).join(', ');

const CAMBIOS = [
  {
    tabla: 'persona',
    tipo: 'campo',
    nombre: 'esquema_salud',
    nuevo:
      "DEFINE FIELD OVERWRITE esquema_salud ON persona TYPE string DEFAULT 'SIS Gratuito' "
      + `ASSERT $value INSIDE [${lista(SEGUROS.map((s) => s.valor))}] PERMISSIONS FULL;`,
  },
  { tabla: 'persona', tipo: 'campo', nombre: 'alergias', quitar: true },
  { tabla: 'persona', tipo: 'campo', nombre: 'plan_salud', quitar: true },
  {
    tabla: 'inscripcion',
    tipo: 'campo',
    nombre: 'modalidad',
    nuevo:
      'DEFINE FIELD OVERWRITE modalidad ON inscripcion TYPE string '
      + `ASSERT $value INSIDE [${lista(MODALIDADES.map((m) => m.valor))}] PERMISSIONS FULL;`,
  },
  {
    tabla: 'inscripcion',
    tipo: 'campo',
    nombre: 'tipo_atencion',
    nuevo:
      "DEFINE FIELD OVERWRITE tipo_atencion ON inscripcion TYPE string DEFAULT 'Atención fija' "
      + "ASSERT $value INSIDE ['Atención fija', 'Atención itinerante'] PERMISSIONS FULL;",
  },
  {
    tabla: 'sede',
    tipo: 'campo',
    nombre: 'tipo_local',
    nuevo:
      'DEFINE FIELD OVERWRITE tipo_local ON sede TYPE string '
      + `ASSERT $value INSIDE [${lista(TIPOS_LOCAL.map((t) => t.valor))}] PERMISSIONS FULL;`,
  },
  {
    tabla: 'usuario_vinculado',
    tipo: 'campo',
    nombre: 'parentesco',
    nuevo:
      'DEFINE FIELD OVERWRITE parentesco ON usuario_vinculado TYPE string '
      + `ASSERT $value INSIDE [${lista(PARENTESCOS)}] PERMISSIONS FULL;`,
  },
  {
    tabla: 'alergia',
    tipo: 'campo',
    nombre: 'activo',
    nuevo: 'DEFINE FIELD OVERWRITE activo ON alergia TYPE bool DEFAULT true PERMISSIONS FULL;',
  },
  {
    tabla: 'alergia',
    tipo: 'campo',
    nombre: 'fecha_baja',
    nuevo: 'DEFINE FIELD OVERWRITE fecha_baja ON alergia TYPE none | datetime PERMISSIONS FULL;',
  },
  {
    tabla: 'alergia',
    tipo: 'campo',
    nombre: 'motivo_baja',
    nuevo: 'DEFINE FIELD OVERWRITE motivo_baja ON alergia TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'alergia',
    tipo: 'indice',
    nombre: 'idx_alergia_persona',
    nuevo: 'DEFINE INDEX OVERWRITE idx_alergia_persona ON alergia FIELDS persona_id;',
  },
];

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
    .filter((f) => f.startsWith('lote-2b-esquema-backup-') && f.endsWith('.json'))
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
  return m[1]
    .split(',')
    .map((valor) => valor.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function defaultDefinicion(definicion) {
  const m = String(definicion || '').match(/DEFAULT\s+'([^']*)'/);
  return m ? m[1] : null;
}

/** Un cambio esta conforme cuando la base ya dice exactamente lo que se pide. */
function conforme(antes, nuevo, quitar) {
  if (quitar) return !String(antes || '').trim();
  const nuevos = valoresAssert(nuevo);
  if (nuevos) {
    const actuales = valoresAssert(antes);
    if (!actuales) return false;
    if (actuales.length !== nuevos.length) return false;
    if (!nuevos.every((valor) => actuales.includes(valor))) return false;
    return defaultDefinicion(antes) === defaultDefinicion(nuevo);
  }
  return normalizarDefinicion(antes) === normalizarDefinicion(nuevo);
}

async function conectar() {
  return await conectarMigracion({ esquema: true });
}

async function leerDefiniciones(db) {
  const tablas = [...new Set(CAMBIOS.map((c) => c.tabla))];
  const definiciones = {};
  for (const tabla of tablas) {
    const res = await db.query(`INFO FOR TABLE ${tabla};`);
    definiciones[tabla] = res[0] || {};
  }
  return definiciones;
}

async function planificar(db) {
  const definiciones = await leerDefiniciones(db);
  const cambios = [];
  for (const cambio of CAMBIOS) {
    const info = definiciones[cambio.tabla] || {};
    const antes = cambio.tipo === 'indice'
      ? (info.indexes || {})[cambio.nombre] || ''
      : (info.fields || {})[cambio.nombre] || '';
    cambios.push({
      ...cambio,
      antes,
      conforme: conforme(antes, cambio.nuevo, cambio.quitar),
    });
  }
  return cambios;
}

function imprimirPlan(cambios, ruta) {
  console.log('');
  console.log('=== Lote 2B · esquema · ' + (APPLY ? 'APPLY' : ROLLBACK ? 'ROLLBACK' : 'DRY-RUN') + ' ===');
  for (const cambio of cambios) {
    console.log(`\n${cambio.tabla}.${cambio.nombre} (${cambio.tipo})`);
    console.log('  actual : ' + (cambio.antes || '(sin definicion)'));
    if (cambio.quitar) {
      console.log('  nuevo  : se elimina');
    } else {
      console.log('  nuevo  : ' + cambio.nuevo);
    }
    console.log('  estado : ' + (cambio.conforme ? 'ya conforme' : 'requiere actualizacion'));
  }
  console.log('');
  if (ruta) console.log('Reporte completo:', ruta);
  console.log('');
}

async function aplicar(db, cambios) {
  const pendientes = cambios.filter((c) => !c.conforme);
  if (!pendientes.length) {
    console.log('El esquema ya esta conforme. No hay cambios que aplicar.');
    return;
  }
  const ruta = guardarJson(`lote-2b-esquema-backup-${marcaTiempo()}.json`, {
    generado: new Date().toISOString(),
    cambios: pendientes.map(({ tabla, tipo, nombre, antes, nuevo, quitar }) => ({
      tabla, tipo, nombre, antes, nuevo, quitar: Boolean(quitar),
    })),
  });
  console.log(`Respaldo de definiciones: ${ruta}`);
  for (const cambio of pendientes) {
    if (cambio.quitar) {
      await db.query(`REMOVE FIELD ${cambio.nombre} ON ${cambio.tabla};`);
      console.log(`Eliminado: ${cambio.tabla}.${cambio.nombre}`);
      continue;
    }
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
      if (cambio.tipo === 'indice') {
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
  const db = await conectar();
  try {
    if (ROLLBACK) {
      await revertir(db, ARCHIVO);
      return;
    }
    const cambios = await planificar(db);
    const ruta = guardarJson(
      `lote-2b-esquema-${APPLY ? 'apply' : 'dry-run'}-${marcaTiempo()}.json`,
      { generado: new Date().toISOString(), cambios },
    );
    imprimirPlan(cambios, ruta);
    if (APPLY) await aplicar(db, cambios);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migracion de esquema del Lote 2B:', err?.message || err);
  process.exit(1);
});
