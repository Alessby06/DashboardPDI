import { test } from 'node:test';
import assert from 'node:assert/strict';

import { puedeVer } from '../../api/expediente.mjs';

const sede = { id: 'sede:a', nombre: 'Comas', distrito: 'Comas', activo: true };
const fila = (extra = {}) => ({
  ins: { sede_id: 'sede:a', programa: 'Desayuno Infantil', estrategias: ['Desayuno Infantil'], ...extra },
});

test('coordinación y administración ven cualquier expediente', () => {
  assert.equal(puedeVer(fila(), null, { rol: 'coord', sedes: [] }), true);
  assert.equal(puedeVer(fila({ sede_id: 'sede:otra' }), null, { rol: 'admin', sedes: [] }), true);
});

test('sin rol no hay acceso', () => {
  assert.equal(puedeVer(fila(), sede, {}), false);
  assert.equal(puedeVer(fila(), sede, { rol: 'visitante', sedes: [] }), false);
});

test('facilitadora entra por área de alimentación', () => {
  assert.equal(puedeVer(fila(), sede, { rol: 'facilitadora', sedes: [] }), true);
});

test('promotora no entra a un expediente solo de desayuno', () => {
  assert.equal(puedeVer(fila(), sede, { rol: 'promotora', sedes: [] }), false);
});

test('promotora entra cuando el programa es mixto', () => {
  const mixto = fila({ programa: 'Mixto', estrategias: ['Desayuno Infantil', 'Casita del Saber'] });
  assert.equal(puedeVer(mixto, sede, { rol: 'promotora', sedes: [] }), true);
});

test('social entra por estrategia ASP', () => {
  const asp = fila({ estrategias: ['ASP'] });
  assert.equal(puedeVer(asp, sede, { rol: 'social', sedes: [] }), true);
});

test('una cuenta con sedes asignadas no ve otra sede', () => {
  assert.equal(puedeVer(fila({ sede_id: 'sede:b' }), sede, { rol: 'facilitadora', sedes: ['sede:a'] }), false);
  assert.equal(puedeVer(fila(), sede, { rol: 'facilitadora', sedes: ['sede:a'] }), true);
});

test('un registro sin sede se deja pasar, igual que en el padrón', () => {
  // `alcance.js` ya aplica esta regla al listado; el servidor la replica para
  // que una fila visible no termine en un 403 al abrirla.
  assert.equal(puedeVer(fila({ sede_id: '' }), null, { rol: 'facilitadora', sedes: ['sede:a'] }), true);
});

test('una cuenta sin sedes asignadas conserva el alcance por área', () => {
  // Es el comportamiento actual de la vista; se prueba para que no cambie por
  // accidente. Endurecerlo a «sin sedes = sin acceso» debe ser una decisión
  // explícita, no un efecto colateral.
  assert.equal(puedeVer(fila(), sede, { rol: 'facilitadora', sedes: [] }), true);
});

test('sin inscripción nunca es visible, ni para administración', () => {
  assert.equal(puedeVer({ ins: null }, sede, { rol: 'facilitadora', sedes: [] }), false);
  assert.equal(puedeVer({ ins: null }, sede, { rol: 'admin', sedes: [] }), false);
});
