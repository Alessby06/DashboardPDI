import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filtrarCasosSociales,
  ordenarCasosSociales,
  enRangoFecha,
} from '../src/scripts/utils/filtrosSocial.js';

const CASOS = [
  { _casoId: 'c1', usuario: 'Ana Pérez', dni: '12345678', codigo: 'ASP-001', sede: 'Año Nuevo', urgencia: 'Alta', fechaDerivacion: '2026-11-20', situacionEncontrada: 'Violencia', tipoProblematica: 'Familiar' },
  { _casoId: 'c2', usuario: 'Luis Gómez', dni: '87654321', codigo: 'ASP-002', sede: 'San Pedro', urgencia: 'Baja', fechaDerivacion: '2026-10-01', situacionEncontrada: 'Salud', tipoProblematica: 'Salud' },
  { _casoId: 'c3', usuario: 'Ana Torres', dni: '', codigo: 'ASP-003', sede: 'Año Nuevo', urgencia: 'Media', fechaDerivacion: '', situacionEncontrada: '', tipoProblematica: '' },
];

test('encuentra por DNI exacto y con espacios', () => {
  assert.deepEqual(
    filtrarCasosSociales(CASOS, { q: '12345678' }).map((c) => c._casoId),
    ['c1'],
  );
  assert.deepEqual(
    filtrarCasosSociales(CASOS, { q: '12 345 678' }).map((c) => c._casoId),
    ['c1'],
  );
});

test('encuentra por nombre sin distinguir tildes ni mayúsculas', () => {
  assert.deepEqual(
    filtrarCasosSociales(CASOS, { q: 'perez' }).map((c) => c._casoId),
    ['c1'],
  );
});

test('el rango de fechas es inclusivo, excluye los casos sin fecha y normaliza un rango invertido', () => {
  const ids = filtrarCasosSociales(CASOS, { desde: '2026-10-01', hasta: '2026-11-20' })
    .map((c) => c._casoId);
  assert.deepEqual(ids, ['c1', 'c2']);
  const invertido = filtrarCasosSociales(CASOS, { desde: '2026-11-20', hasta: '2026-10-01' })
    .map((c) => c._casoId);
  assert.deepEqual(invertido, ['c1', 'c2']);
});

test('ordena por urgencia Alta > Media > Baja y desempata por nombre', () => {
  assert.deepEqual(
    ordenarCasosSociales(CASOS, 'urgencia').map((c) => c._casoId),
    ['c1', 'c3', 'c2'],
  );
});

test('ordena por fecha descendente y por nombre', () => {
  assert.deepEqual(ordenarCasosSociales(CASOS, 'fecha').map((c) => c._casoId), ['c1', 'c2', 'c3']);
  assert.deepEqual(ordenarCasosSociales(CASOS, 'nombre').map((c) => c._casoId), ['c1', 'c3', 'c2']);
});

test('una fecha inválida no entra en ningún rango', () => {
  assert.equal(enRangoFecha('', '2026-01-01', '2026-12-31'), false);
  assert.equal(enRangoFecha('no-es-fecha', '2026-01-01', '2026-12-31'), false);
  assert.equal(enRangoFecha('2026-05-10', '2026-05-10', '2026-05-10'), true);
});
