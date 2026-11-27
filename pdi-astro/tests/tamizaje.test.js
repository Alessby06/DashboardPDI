import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoTamizaje, coincideTamizaje } from '../src/scripts/utils/tamizaje.js';

const HOY = new Date('2026-11-27T12:00:00Z');
const conFecha = (fecha) => ({ tamizajes: [{ fecha }] });

test('sin tamizajes', () => {
  assert.equal(estadoTamizaje({ tamizajes: [] }, HOY), 'sin');
  assert.equal(estadoTamizaje({}, HOY), 'sin');
});

test('vencido a más de 6 meses y vigente dentro de 6 meses', () => {
  assert.equal(estadoTamizaje(conFecha('2026-04-01'), HOY), 'vencido');
  assert.equal(estadoTamizaje(conFecha('2026-06-01'), HOY), 'vigente');
});

test('una fecha inválida cuenta como sin tamizaje', () => {
  assert.equal(estadoTamizaje(conFecha('no-es-fecha'), HOY), 'sin');
});

test('coincideTamizaje respeta all, sin y vencido', () => {
  assert.equal(coincideTamizaje({}, 'all', HOY), true);
  assert.equal(coincideTamizaje({}, 'sin', HOY), true);
  assert.equal(coincideTamizaje(conFecha('2026-04-01'), 'vencido', HOY), true);
  assert.equal(coincideTamizaje(conFecha('2026-06-01'), 'vencido', HOY), false);
});
