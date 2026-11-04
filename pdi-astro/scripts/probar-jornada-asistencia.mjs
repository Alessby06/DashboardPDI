// Prueba controlada de la jornada de asistencia.
//
//   node scripts/probar-jornada-asistencia.mjs
//
// Usa un día futuro (2099-12-31) y dos inscripciones reales, escribe la misma
// transacción que usa la aplicación, comprueba el índice único, simula un
// conflicto entre dispositivos y borra TODO lo que creó, incluso si falla.
// No toca la asistencia real.

import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import {
  construirGuardadoJornada,
  compararJornadas,
  claveRegistro,
} from '../src/scripts/core/jornadaAsistencia.js';

const { conectarMigracion } = await import(pathToFileURL(
  join(process.cwd(), 'scripts', 'conexion-migracion.mjs'),
).href);

const DIA = '2099-12-31';
const POR = 'Prueba controlada';
const db = await conectarMigracion({ esquema: false });

function ok(nombre, condicion, detalle = '') {
  console.log(`${condicion ? 'OK ' : 'FALLO'} · ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!condicion) process.exitCode = 1;
}

async function filas() {
  const [res] = await db.query(
    `SELECT inscripcion_id, sede_id, estado, observacion, racion_entregada, registrado_por_nombre
     FROM asistencia_diaria WHERE dia = $dia;`,
    { dia: DIA },
  );
  return res || [];
}

async function filasDeSede(nombreSede) {
  const [res] = await db.query(
    `SELECT inscripcion_id, sede_id, estado, observacion, racion_entregada, registrado_por_nombre
     FROM asistencia_diaria WHERE dia = $dia AND sede_id.nombre = $sede;`,
    { dia: DIA, sede: nombreSede },
  );
  return res || [];
}

try {
  // 0. Limpieza de restos de una ejecución anterior.
  await db.query('DELETE asistencia_diaria WHERE dia = $dia;', { dia: DIA });

  // 1. Dos inscripciones activas de la misma sede.
  const [inscripciones] = await db.query(
    `SELECT id, sede_id, sede_id.nombre AS sede_nombre
     FROM inscripcion WHERE activo = true AND sede_id != NONE LIMIT 40;`,
  );
  const porSede = new Map();
  for (const ins of inscripciones || []) {
    if (!ins.sede_id || !ins.sede_nombre) continue;
    const clave = String(ins.sede_id);
    if (!porSede.has(clave)) porSede.set(clave, []);
    porSede.get(clave).push(ins);
  }
  const par = [...porSede.values()].find(lista => lista.length >= 2);
  if (!par) throw new Error('No hay dos inscripciones activas en la misma sede para probar.');

  const [uno, dos] = par;
  const sede = uno.sede_nombre;
  console.log(`Sede de prueba: ${sede} · inscripciones ${uno.id} y ${dos.id}`);

  // 2. Primera jornada: P y FJ con motivo.
  const primera = {
    [String(uno.id)]: { estado: 'P', sedeId: String(uno.sede_id) },
    [String(dos.id)]: { estado: 'FJ', observacion: '  Prueba controlada  ', sedeId: String(dos.sede_id) },
  };
  const guardado1 = construirGuardadoJornada({ dia: DIA, cambios: primera, registradoPorNombre: POR });
  await db.query(guardado1.ql, guardado1.params);

  let actuales = await filas();
  ok('guarda dos alumnos en una transacción', actuales.length === 2, `${actuales.length} filas`);
  const filaUno = actuales.find(f => String(f.inscripcion_id) === String(uno.id));
  const filaDos = actuales.find(f => String(f.inscripcion_id) === String(dos.id));
  ok('P queda con ración', filaUno?.estado === 'P' && filaUno?.racion_entregada === true);
  ok('FJ queda con motivo y sin ración',
    filaDos?.estado === 'FJ' && filaDos?.observacion === 'Prueba controlada' && filaDos?.racion_entregada === false);

  // 3. El índice único rechaza un duplicado del mismo alumno y día.
  let duplicadoRechazado = false;
  try {
    await db.query(
      `CREATE asistencia_diaria CONTENT {
        inscripcion_id: type::record('inscripcion', $iid),
        sede_id: type::record('sede', $sid),
        dia: $dia, estado: 'P'
      };`,
      { iid: claveRegistro(uno.id), sid: claveRegistro(uno.sede_id), dia: DIA },
    );
  } catch (e) {
    duplicadoRechazado = /index|unique|duplicate/i.test(String(e?.message || e));
  }
  ok('el índice único rechaza el duplicado alumno/día', duplicadoRechazado);

  // 4. Segunda jornada: T y quitar la marca del segundo.
  const segunda = {
    [String(uno.id)]: { estado: 'T', sedeId: String(uno.sede_id) },
    [String(dos.id)]: { estado: '', sedeId: String(dos.sede_id) },
  };
  const guardado2 = construirGuardadoJornada({ dia: DIA, cambios: segunda, registradoPorNombre: POR });
  await db.query(guardado2.ql, guardado2.params);

  actuales = await filas();
  const trasSegunda = actuales.find(f => String(f.inscripcion_id) === String(uno.id));
  ok('el upsert cambia P por T', trasSegunda?.estado === 'T');
  ok('un estado vacío borra la fila', actuales.length === 1, `${actuales.length} fila`);

  // 5. Conflicto: la línea base dice T, otro dispositivo dejó FI.
  const lineaBase = {
    [String(uno.id)]: { estado: 'T', observacion: '' },
  };
  const actual = {
    [String(uno.id)]: { estado: 'FI', observacion: '' },
  };
  const cambios = { [String(uno.id)]: { estado: 'P', sedeId: String(uno.sede_id) } };
  const conflictos = compararJornadas(lineaBase, actual, cambios);
  ok('el conflicto detecta el cambio de otro dispositivo', conflictos.length === 1,
    conflictos[0] ? `${conflictos[0].antes.estado} → ${conflictos[0].ahora.estado}` : '');

  // 6. La consulta por nombre de sede es la que usa la aplicación.
  const filasSede = await filasDeSede(sede);
  ok('la consulta por sede devuelve la jornada', filasSede.length === 1,
    `${filasSede.length} fila · ${sede}`);
  const filasOtraSede = await filasDeSede('Sede que no existe');
  ok('la consulta por sede no mezcla otras sedes', filasOtraSede.length === 0);
} catch (err) {
  console.error('FALLO ·', err?.message || err);
  process.exitCode = 1;
} finally {
  const antes = await filas().catch(() => []);
  await db.query('DELETE asistencia_diaria WHERE dia = $dia;', { dia: DIA }).catch(() => {});
  const despues = await filas().catch(() => []);
  console.log(`Limpieza: ${antes.length} filas de prueba borradas; quedan ${despues.length}.`);
  await db.close();
}
