// Reglas de tipo de campo que comparten la ficha, el expediente, la evaluación
// y el perfil. El teléfono es un celular peruano: 9 dígitos y empieza con 9.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarTipo } from '../src/scripts/ui/tiposCampo.js';

test('el teléfono exige 9 dígitos y empieza con 9', () => {
  assert.equal(validarTipo('telefono', '987654321'), true);
  assert.equal(validarTipo('telefono', '987-654-321'), true);
  assert.equal(validarTipo('telefono', '887654321'), false);
  assert.equal(validarTipo('telefono', '98765432'), false);
  assert.equal(validarTipo('telefono', '9876543210'), false);
  assert.equal(validarTipo('telefono', '+51 987654321'), false);
  assert.equal(validarTipo('telefono', ''), false);
  assert.equal(validarTipo('telefono', 'abcdefghi'), false);
});

test('el DNI son exactamente 8 dígitos', () => {
  assert.equal(validarTipo('dni', '12345678'), true);
  assert.equal(validarTipo('dni', '1234567'), false);
  assert.equal(validarTipo('dni', '123456789'), false);
  assert.equal(validarTipo('dni', '1234abcd'), false);
});
