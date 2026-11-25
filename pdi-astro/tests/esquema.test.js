import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolverEsquema } from '../../api/_esquema.mjs';

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
