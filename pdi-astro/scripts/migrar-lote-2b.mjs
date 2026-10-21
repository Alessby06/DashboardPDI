// ===========================================================================
//  Migración de datos del Lote 2B
// ===========================================================================
//  Cierra la ventana de valores heredados: antes de apretar el esquema, los
//  datos que todavia guarden una forma vieja se llevan a la canonica. El mapa
//  es explicito a proposito: un valor desconocido se reporta, nunca se
//  reescribe por sorpresa.
//
//    - persona.esquema_salud: "SIS", "PNP/FFAA", "No tiene"
//    - inscripcion.modalidad: "Institucion Educativa"
//    - inscripcion.tipo_atencion: "Atencion fija", "Atencion itinerante"
//    - sede.tipo_local: "Colegio Publico (I.E.)", "Colegio Público Aliado"
//    - usuario_vinculado.parentesco: "Tia", "Tio", "Tutor Legal"
//
//  Uso:
//    node scripts/migrar-lote-2b.mjs             # dry-run, no escribe nada
//    node scripts/migrar-lote-2b.mjs --apply     # aplica con respaldo previo
//    node scripts/migrar-lote-2b.mjs --rollback  # restaura el ultimo respaldo
//
//  El dry-run es el modo por defecto. El respaldo se guarda en backups/, que
//  esta ignorado por git porque puede contener datos personales.
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

const MAPAS = [
  {
    tabla: 'persona',
    campo: 'esquema_salud',
    canonicos: new Set(SEGUROS.map((s) => s.valor)),
    valores: new Map([
      ['SIS', 'SIS Gratuito'],
      ['PNP/FFAA', 'PNP / FFAA'],
      ['No tiene', 'Ninguno'],
    ]),
  },
  {
    tabla: 'inscripcion',
    campo: 'modalidad',
    canonicos: new Set(MODALIDADES.map((m) => m.valor)),
    valores: new Map([
      ['Institucion Educativa', 'Institución Educativa'],
    ]),
  },
  {
    tabla: 'inscripcion',
    campo: 'tipo_atencion',
    canonicos: new Set(['Atención fija', 'Atención itinerante']),
    valores: new Map([
      ['Atencion fija', 'Atención fija'],
      ['Atencion itinerante', 'Atención itinerante'],
    ]),
  },
  {
    tabla: 'sede',
    campo: 'tipo_local',
    canonicos: new Set(TIPOS_LOCAL.map((t) => t.valor)),
    valores: new Map([
      ['Colegio Publico (I.E.)', 'Colegio Público (I.E.)'],
      ['Colegio Público Aliado', 'Colegio Público (I.E.)'],
    ]),
  },
  {
    tabla: 'usuario_vinculado',
    campo: 'parentesco',
    canonicos: new Set(PARENTESCOS),
    valores: new Map([
      ['Tia', 'Tía'],
      ['Tio', 'Tío'],
      ['Tutor Legal', 'Cuidador Legal'],
    ]),
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
    .filter((f) => f.startsWith('lote-2b-backup-') && f.endsWith('.json'))
    .sort();
  return archivos.length ? resolve(DIR_BACKUPS, archivos[archivos.length - 1]) : null;
}

async function conectar() {
  return await conectarMigracion({ esquema: false });
}

async function recolectar(db) {
  const cambios = [];
  const porRevisar = [];
  for (const mapa of MAPAS) {
    const [filas] = await db.query(
      `SELECT id, ${mapa.campo} AS valor FROM ${mapa.tabla} WHERE ${mapa.campo} != NONE;`,
    );
    for (const fila of filas || []) {
      const antes = fila.valor;
      if (antes === null || antes === undefined || antes === '') continue;
      if (mapa.canonicos.has(antes)) continue;
      const despues = mapa.valores.get(antes);
      if (despues && despues !== antes) {
        cambios.push({
          tabla: mapa.tabla,
          campo: mapa.campo,
          id: String(fila.id),
          antes,
          despues,
        });
      } else if (!despues) {
        porRevisar.push({ tabla: mapa.tabla, campo: mapa.campo, valor: antes });
      }
    }
  }
  return { cambios, porRevisar };
}

function imprimirPlan(cambios, porRevisar, ruta) {
  console.log('');
  console.log('=== Lote 2B · datos · ' + (APPLY ? 'APPLY' : ROLLBACK ? 'ROLLBACK' : 'DRY-RUN') + ' ===');
  if (!cambios.length) {
    console.log('No hay valores heredados que migrar.');
  } else {
    for (const cambio of cambios) {
      console.log(`${cambio.tabla}.${cambio.campo}: ${cambio.antes} -> ${cambio.despues}`);
    }
  }
  if (porRevisar.length) {
    console.log('\nValores que no estan en el mapa (se reportan, no se tocan):');
    for (const revision of porRevisar) {
      console.log(`  ${revision.tabla}.${revision.campo}: ${revision.valor}`);
    }
  }
  console.log(`\nTotal: ${cambios.length} cambio(s).`);
  console.log('');
  if (ruta) console.log('Reporte completo:', ruta);
  console.log('');
}

async function aplicar(db, cambios) {
  if (!cambios.length) {
    console.log('No hay cambios que aplicar.');
    return;
  }
  const ruta = guardarJson(`lote-2b-backup-${marcaTiempo()}.json`, {
    generado: new Date().toISOString(),
    cambios,
  });
  console.log(`Respaldo de datos: ${ruta}`);
  for (const cambio of cambios) {
    await db.query(
      `UPDATE type::record($rid) SET ${cambio.campo} = $valor;`,
      { rid: cambio.id, valor: cambio.despues },
    );
  }
  console.log(`Aplicados ${cambios.length} cambios de datos.`);
}

async function revertir(db, archivo) {
  const ruta = archivo || ultimoRespaldo();
  if (!ruta) {
    console.error('No hay respaldo de datos para revertir.');
    process.exit(1);
  }
  const respaldo = JSON.parse(readFileSync(ruta, 'utf8'));
  for (const cambio of respaldo.cambios || []) {
    await db.query(
      `UPDATE type::record($rid) SET ${cambio.campo} = $valor;`,
      { rid: cambio.id, valor: cambio.antes },
    );
  }
  console.log(`Revertidos ${(respaldo.cambios || []).length} cambios de datos desde ${ruta}.`);
}

async function verificar(db) {
  for (const mapa of MAPAS) {
    const [filas] = await db.query(
      `SELECT ${mapa.campo} AS valor, count() AS total FROM ${mapa.tabla} GROUP BY ${mapa.campo} ORDER BY total DESC;`,
    );
    console.log(`\n${mapa.tabla}.${mapa.campo}`);
    for (const fila of filas || []) {
      console.log(`  ${fila.valor ?? '(sin dato)'}: ${fila.total}`);
    }
  }
}

async function main() {
  const db = await conectar();
  try {
    if (ROLLBACK) {
      await revertir(db, ARCHIVO);
      return;
    }
    const { cambios, porRevisar } = await recolectar(db);
    const ruta = guardarJson(
      `lote-2b-${APPLY ? 'apply' : 'dry-run'}-${marcaTiempo()}.json`,
      { generado: new Date().toISOString(), cambios, porRevisar },
    );
    imprimirPlan(cambios, porRevisar, ruta);
    if (APPLY) {
      await aplicar(db, cambios);
      await verificar(db);
    }
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migracion de datos del Lote 2B:', err?.message || err);
  process.exit(1);
});
