import test from 'node:test';
import assert from 'node:assert/strict';

import {
  diaEnZona,
  puedeEditarJornada,
  motivoEdicionBloqueada,
  estadoEfectivo,
  infoEstado,
  compararJornadas,
  resumenJornada,
  validarMotivoFJ,
  normalizarMarca,
  SIN_MARCAR,
  construirGuardadoJornada,
} from '../src/scripts/core/jornadaAsistencia.js';

test('diaEnZona usa la fecha de Lima, no la de UTC', () => {
  // 02:30 UTC del 3 de noviembre son las 21:30 del 2 en Lima (UTC-5).
  assert.equal(diaEnZona(new Date('2026-11-03T02:30:00Z')), '2026-11-02');
  // 05:00 UTC ya es el 3 en Lima.
  assert.equal(diaEnZona(new Date('2026-11-03T05:00:00Z')), '2026-11-03');
});

test('promotora solo edita hoy; coordinación edita el periodo actual', () => {
  const hoy = '2026-11-03';
  assert.equal(puedeEditarJornada('promotora', hoy, hoy), true);
  assert.equal(puedeEditarJornada('promotora', '2026-11-02', hoy), false);
  assert.equal(puedeEditarJornada('coord', '2026-01-05', hoy), true);
  assert.equal(puedeEditarJornada('admin', '2025-12-31', hoy), false);
  assert.equal(puedeEditarJornada('coord', '2026-11-04', hoy), false);
  assert.equal(puedeEditarJornada('social', hoy, hoy), false);
});

test('el motivo del bloqueo explica el caso y no inventa permisos', () => {
  assert.match(motivoEdicionBloqueada('promotora', '2026-11-02', '2026-11-03'), /solo puede registrar la jornada de hoy/);
  assert.match(motivoEdicionBloqueada('coord', '2025-12-31', '2026-11-03'), /periodo está cerrado/);
  assert.match(motivoEdicionBloqueada('coord', '2026-11-04', '2026-11-03'), /jornada futura/);
});

test('sin marca no es una falta ni un presente', () => {
  assert.deepEqual(infoEstado({ estado: '', observacion: '' }), SIN_MARCAR);
  const guardado = {};
  const borrador = {};
  assert.deepEqual(estadoEfectivo(guardado, borrador, 'inscripcion:1'), { estado: '', observacion: '' });
});

test('el borrador manda sobre lo guardado y un null borra la marca', () => {
  const guardado = { 'inscripcion:1': { estado: 'P', observacion: '' } };
  const borrador = { 'inscripcion:1': { estado: 'FJ', observacion: 'Cita médica' } };
  assert.deepEqual(estadoEfectivo(guardado, borrador, 'inscripcion:1'), {
    estado: 'FJ',
    observacion: 'Cita médica',
  });
  assert.deepEqual(estadoEfectivo(guardado, { 'inscripcion:1': null }, 'inscripcion:1'), {
    estado: '',
    observacion: '',
  });
});

test('el conflicto solo mira a los alumnos que se van a escribir', () => {
  const lineaBase = {
    'inscripcion:1': { estado: 'P', observacion: '' },
    'inscripcion:2': { estado: 'P', observacion: '' },
  };
  const actuales = {
    'inscripcion:1': { estado: 'P', observacion: '' },
    // Otro dispositivo cambió al alumno 2, pero no lo vamos a tocar.
    'inscripcion:2': { estado: 'FJ', observacion: 'Médico' },
    'inscripcion:3': { estado: 'T', observacion: '' },
  };
  const cambios = {
    'inscripcion:1': { estado: 'FI', observacion: '' },
    'inscripcion:3': { estado: 'P', observacion: '' },
  };
  const conflictos = compararJornadas(lineaBase, actuales, cambios);
  assert.equal(conflictos.length, 1);
  assert.equal(conflictos[0].inscripcionId, 'inscripcion:3');
  assert.deepEqual(conflictos[0].antes, { estado: '', observacion: '' });
  assert.deepEqual(conflictos[0].ahora, { estado: 'T', observacion: '' });
});

test('el resumen separa sin marcar de las faltas', () => {
  const marcas = {
    1: { estado: 'P', observacion: '' },
    2: { estado: 'T', observacion: '' },
    3: { estado: 'FJ', observacion: 'Cita' },
    4: { estado: 'FJ', observacion: '' },
    5: { estado: '', observacion: '' },
  };
  const r = resumenJornada([1, 2, 3, 4, 5, 6], id => marcas[id] || { estado: '', observacion: '' });
  assert.deepEqual(r, {
    total: 6, P: 1, T: 1, FJ: 2, FI: 0, sinMarcar: 2, conMotivo: 1,
  });
});

test('FJ exige motivo y lo recorta; los demás estados lo ignoran', () => {
  assert.equal(validarMotivoFJ('P', 'texto').observacion, '');
  assert.equal(validarMotivoFJ('FJ', '   ').ok, false);
  assert.equal(validarMotivoFJ('FJ', 'x'.repeat(121)).ok, false);
  assert.deepEqual(validarMotivoFJ('FJ', '  Cita médica  '), {
    ok: true,
    observacion: 'Cita médica',
  });
});

test('normalizarMarca descarta observaciones de estados que no son FJ', () => {
  assert.deepEqual(normalizarMarca({ estado: 'P', observacion: 'ruido' }), {
    estado: 'P',
    observacion: '',
  });
});

test('la transacción de guardado inserta, actualiza y borra en un solo bloque', () => {
  const { ql, params } = construirGuardadoJornada({
    dia: '2026-11-03',
    registradoPorNombre: 'Promotora Educativa',
    cambios: {
      'inscripcion:abc': { estado: 'P', sedeId: 'sede:a_o_nuevo' },
      'inscripcion:def': { estado: 'FJ', observacion: '  Cita médica  ', sedeId: 'sede:a_o_nuevo' },
      'inscripcion:ghi': { estado: '', sedeId: 'sede:a_o_nuevo' },
    },
  });
  assert.match(ql, /^BEGIN TRANSACTION;/);
  assert.match(ql, /COMMIT TRANSACTION;$/);
  assert.match(ql, /INSERT INTO asistencia_diaria/);
  assert.match(ql, /DELETE asistencia_diaria/);
  assert.equal((ql.match(/INSERT INTO asistencia_diaria/g) || []).length, 2);
  assert.equal(params.data1.observacion, 'Cita médica');
  assert.equal(params.data0.racion_entregada, true);
  assert.equal(params.dia, '2026-11-03');
});

test('la transacción rechaza un alumno sin sede y no genera escritura parcial', () => {
  assert.throws(() => construirGuardadoJornada({
    dia: '2026-11-03',
    cambios: { 'inscripcion:abc': { estado: 'P', sedeId: '' } },
  }), /sede registrada/);
});

