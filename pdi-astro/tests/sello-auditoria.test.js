import { test } from 'node:test';
import assert from 'node:assert/strict';

import { firmarSello, verificarSello } from '../../api/_cuentaBase.mjs';

const SECRETO = 'secreto-de-prueba';
const AHORA = 1_000_000;

function selloDe(extra = {}) {
  return firmarSello({
    v: 1,
    sub: 'cuenta:abc',
    rol: 'facilitadora',
    nombre: 'Ana',
    ip: '10.0.0.1',
    iat: AHORA,
    exp: AHORA + 60_000,
    lote: 'lote-1',
    ...extra,
  }, SECRETO);
}

test('un sello válido devuelve la identidad firmada', () => {
  const datos = verificarSello(selloDe(), SECRETO, AHORA);
  assert.equal(datos.sub, 'cuenta:abc');
  assert.equal(datos.rol, 'facilitadora');
  assert.equal(datos.nombre, 'Ana');
  assert.equal(datos.ip, '10.0.0.1');
});

test('un sello alterado no verifica', () => {
  const sello = selloDe();
  const [payload, firma] = sello.split('.');
  const alterado = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')), sub: 'cuenta:otra' }),
  ).toString('base64url');
  assert.equal(verificarSello(`${alterado}.${firma}`, SECRETO, AHORA), null);
  assert.equal(verificarSello(`${payload}.${firma.slice(0, -2)}xx`, SECRETO, AHORA), null);
});

test('un sello de otro secreto no verifica', () => {
  assert.equal(verificarSello(selloDe(), 'otro-secreto', AHORA), null);
});

test('un sello vencido no verifica', () => {
  assert.equal(verificarSello(selloDe(), SECRETO, AHORA + 60_001), null);
});

test('un sello sin versión o sin sujeto no verifica', () => {
  assert.equal(verificarSello(selloDe({ v: 2 }), SECRETO, AHORA), null);
  assert.equal(verificarSello(selloDe({ sub: '' }), SECRETO, AHORA), null);
});

test('una cadena cualquiera no verifica', () => {
  assert.equal(verificarSello('', SECRETO, AHORA), null);
  assert.equal(verificarSello('sin-punto', SECRETO, AHORA), null);
  assert.equal(verificarSello(undefined, SECRETO, AHORA), null);
});
