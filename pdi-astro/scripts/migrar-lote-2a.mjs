// ===========================================================================
//  Migración de datos del Lote 2A
// ===========================================================================
//  Solo toca valores que la interfaz ya no escribe con la forma legada:
//    - inscripcion.tipo_atencion: "Atencion fija" -> "Atención fija"
//    - sede.tipo_local: "Colegio Publico (I.E.)" / "Colegio Público Aliado"
//      -> "Colegio Público (I.E.)"
//
//  No toca persona.alergias, centro_salud ni institucion_origen: hoy están
//  vacíos y los llena el alta/expediente a partir de este lote.
//
//  Uso:
//    node scripts/migrar-lote-2a.mjs             # dry-run, no escribe nada
//    node scripts/migrar-lote-2a.mjs --apply     # aplica con respaldo previo
//    node scripts/migrar-lote-2a.mjs --rollback  # restaura el último respaldo
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

const MAPAS = [
  {
    tabla: 'inscripcion',
    campo: 'tipo_atencion',
    valores: new Map([
      ['Atencion fija', 'Atención fija'],
      ['Atencion itinerante', 'Atención itinerante'],
    ]),
  },
  {
    tabla: 'sede',
    campo: 'tipo_local',
    valores: new Map([
      ['Colegio Publico (I.E.)', 'Colegio Público (I.E.)'],
      ['Colegio Público Aliado', 'Colegio Público (I.E.)'],
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
    .filter((f) => f.startsWith('lote-2a-backup-') && f.endsWith('.json'))
    .sort();
  return archivos.length ? resolve(DIR_BACKUPS, archivos[archivos.length - 1]) : null;
}

async function conectar() {
  return await conectarMigracion({ esquema: false });
}

async function recolectar(db) {
  const cambios = [];
  for (const mapa of MAPAS) {
    const [filas] = await db.query(
      `SELECT id, ${mapa.campo} AS valor FROM ${mapa.tabla} WHERE ${mapa.campo} INSIDE $valores;`,
      { valores: [...mapa.valores.keys()] },
    );
    for (const fila of filas || []) {
      const antes = fila.valor;
      const despues = mapa.valores.get(antes);
      if (!despues || despues === antes) continue;
      cambios.push({
        tabla: mapa.tabla,
        campo: mapa.campo,
        id: String(fila.id),
        antes,
        despues,
      });
    }
  }
  return cambios;
}

function resumen(cambios) {
  const porCampo = new Map();
  for (const cambio of cambios) {
    const clave = `${cambio.tabla}.${cambio.campo}: ${cambio.antes} -> ${cambio.despues}`;
    porCampo.set(clave, (porCampo.get(clave) || 0) + 1);
  }
  return [...porCampo.entries()].map(([cambio, total]) => ({ cambio, total }));
}

function imprimirPlan(cambios, ruta) {
  console.log('');
  console.log('=== Lote 2A · datos · ' + (APPLY ? 'APPLY' : ROLLBACK ? 'ROLLBACK' : 'DRY-RUN') + ' ===');
  if (!cambios.length) {
    console.log('No hay valores legados que migrar.');
  } else {
    for (const linea of resumen(cambios)) {
      console.log(`${linea.total} registro(s): ${linea.cambio}`);
    }
  }
  console.log(`Total: ${cambios.length} cambio(s).`);
  console.log('');
  if (ruta) console.log('Reporte completo:', ruta);
  console.log('');
}

async function aplicar(db, cambios) {
  if (!cambios.length) {
    console.log('No hay cambios que aplicar.');
    return;
  }
  const ruta = guardarJson(`lote-2a-backup-${marcaTiempo()}.json`, {
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
    const cambios = await recolectar(db);
    const ruta = guardarJson(
      `lote-2a-${APPLY ? 'apply' : 'dry-run'}-${marcaTiempo()}.json`,
      { generado: new Date().toISOString(), cambios },
    );
    imprimirPlan(cambios, ruta);
    if (APPLY) {
      await aplicar(db, cambios);
      await verificar(db);
    }
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migración de datos del Lote 2A:', err?.message || err);
  process.exit(1);
});
