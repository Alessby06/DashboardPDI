import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolverEsquema, resolverSedesObligatorias } from '../../api/_esquema.mjs';

test('sin variables usa el esquema anterior', () => {
  assert.equal(resolverEsquema({}), false);
  assert.equal(resolverEsquema(), false);
});

test('reconoce la bandera del esquema nuevo', () => {
  assert.equal(resolverEsquema({ PUBLIC_ESQUEMA_USUARIO: '1' }), true);
  assert.equal(resolverEsquema({ PUBLIC_ESQUEMA_USUARIO: '0' }), false);
});

test('ESQUEMA_USUARIO del servidor manda sobre la bandera pública', () => {
  assert.equal(resolverEsquema({ ESQUEMA_USUARIO: '0', PUBLIC_ESQUEMA_USUARIO: '1' }), false);
  assert.equal(resolverEsquema({ ESQUEMA_USUARIO: '1', PUBLIC_ESQUEMA_USUARIO: '0' }), true);
});

test('tolera espacios y valores vacíos', () => {
  assert.equal(resolverEsquema({ ESQUEMA_USUARIO: ' 1 ' }), true);
  assert.equal(resolverEsquema({ ESQUEMA_USUARIO: '' }), false);
  assert.equal(resolverEsquema({ ESQUEMA_USUARIO: null, PUBLIC_ESQUEMA_USUARIO: '1' }), true);
});

test('la bandera de sedes obligatorias se lee igual y está apagada por defecto', () => {
  assert.equal(resolverSedesObligatorias({}), false);
  assert.equal(resolverSedesObligatorias({ PUBLIC_SEDES_OBLIGATORIAS: '1' }), true);
  assert.equal(resolverSedesObligatorias({ SEDES_OBLIGATORIAS: '1' }), true);
  assert.equal(resolverSedesObligatorias({ SEDES_OBLIGATORIAS: '0', PUBLIC_SEDES_OBLIGATORIAS: '1' }), false);
});
