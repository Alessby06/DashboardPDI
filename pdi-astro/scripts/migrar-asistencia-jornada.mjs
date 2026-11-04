// Migración: asistencia por jornada (sede + día)
//
//   1. Guarda un respaldo JSON de la asistencia actual.
//   2. Copia todas las filas a `asistencia_diaria_archivo` (histórico sin UI).
//   3. Vacía `asistencia_diaria`.
//   4. Añade `dia`, `actualizado_el` y `registrado_por_nombre`.
//   5. Sustituye el índice único por `(inscripcion_id, dia)`.
//
// Uso:
//   node scripts/migrar-asistencia-jornada.mjs           # dry-run
//   node scripts/migrar-asistencia-jornada.mjs --apply   # aplica
//
// El archivo de respaldo se escribe en el directorio temporal del sistema; no
// se versiona porque contiene datos de menores.

import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { conectarMigracion } = await import(pathToFileURL(
  join(process.cwd(), 'scripts', 'conexion-migracion.mjs'),
).href);

const APLICAR = process.argv.includes('--apply');
const db = await conectarMigracion({ esquema: false });

async function contar(tabla) {
  const [res] = await db.query(`SELECT count() AS n FROM ${tabla} GROUP ALL;`);
  return res?.[0]?.n ?? 0;
}

try {
  const [filas] = await db.query('SELECT * FROM asistencia_diaria;');
  console.log(`Asistencia actual: ${filas.length} filas.`);

  if (!filas.length) {
    console.log('No hay filas: la migración solo aplicará el esquema.');
  }

  if (!APLICAR) {
    console.log('DRY-RUN. Se archivarían', filas.length, 'filas y se añadirían dia/índices.');
    console.log('Ejecuta con --apply para aplicarlo.');
  } else {
    const respaldo = join(tmpdir(), `asistencia-pre-jornada-${Date.now()}.json`);
    writeFileSync(respaldo, JSON.stringify(filas, null, 2), 'utf8');
    console.log('Respaldo:', respaldo);

    await db.query('DEFINE TABLE IF NOT EXISTS asistencia_diaria_archivo TYPE NORMAL SCHEMALESS PERMISSIONS FULL;');
    let copiadas = 0;
    for (const fila of filas) {
      const datos = { ...fila };
      delete datos.id;
      await db.query('CREATE type::table($tabla) CONTENT $datos;', {
        tabla: 'asistencia_diaria_archivo',
        datos,
      });
      copiadas++;
    }
    const enArchivo = await contar('asistencia_diaria_archivo');
    console.log(`Copiadas al archivo: ${copiadas} (en tabla: ${enArchivo}).`);
    if (enArchivo < filas.length) {
      throw new Error('La copia al archivo quedó incompleta: no se vacía la tabla actual.');
    }

    await db.query('DELETE asistencia_diaria;');
    console.log('Asistencia actual vaciada:', await contar('asistencia_diaria'));

    await db.query(`
      DEFINE FIELD IF NOT EXISTS dia ON asistencia_diaria
        TYPE string ASSERT string::len($value) = 10 PERMISSIONS FULL;
      DEFINE FIELD IF NOT EXISTS actualizado_el ON asistencia_diaria
        TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
      DEFINE FIELD IF NOT EXISTS registrado_por_nombre ON asistencia_diaria
        TYPE option<string> PERMISSIONS FULL;
      REMOVE INDEX IF EXISTS idx_asistencia_diaria_unica ON asistencia_diaria;
      DEFINE INDEX IF NOT EXISTS idx_asistencia_dia_unica
        ON asistencia_diaria FIELDS inscripcion_id, dia UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_asistencia_dia_sede
        ON asistencia_diaria FIELDS dia, sede_id;
    `);
    console.log('Esquema actualizado.');
  }

  const [info] = await db.query('INFO FOR TABLE asistencia_diaria;');
  console.log('Campos:', Object.keys(info.fields || {}).join(', '));
  console.log('Índices:', Object.keys(info.indexes || {}).join(', '));
} catch (e) {
  console.error('ERROR:', e?.message || e);
  process.exitCode = 1;
} finally {
  await db.close();
}
