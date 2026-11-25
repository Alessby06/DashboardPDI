import { test } from 'node:test';
import assert from 'node:assert/strict';

import { sedePermitida, filtrarPorSede, evaluarSede } from '../src/scripts/auth/alcance.js';

function almacen(datos) {
  const mapa = new Map(Object.entries(datos));
  return {
    getItem: (clave) => (mapa.has(clave) ? mapa.get(clave) : null),
    setItem: (clave, valor) => { mapa.set(clave, String(valor)); },
    removeItem: (clave) => { mapa.delete(clave); },
  };
}

test('una cuenta con sede asignada solo ve su sede y ningún registro sin sede', () => {
  globalThis.localStorage = almacen({ pdi_usuario_sedes: JSON.stringify(['sede:a']) });

  assert.equal(sedePermitida('sede:a'), true);
  assert.equal(sedePermitida('sede:b'), false);
  assert.equal(sedePermitida(''), false);
  assert.equal(sedePermitida(undefined), false);
});

test('una cuenta sin sedes asignadas conserva alcance completo', () => {
  globalThis.localStorage = almacen({ pdi_usuario_sedes: '[]' });

  assert.equal(sedePermitida('sede:b'), true);
  assert.equal(sedePermitida('sede:a'), true);
  assert.equal(sedePermitida(''), true);
});

test('filtrarPorSede recorta la lista y descarta los registros sin sede', () => {
  globalThis.localStorage = almacen({ pdi_usuario_sedes: JSON.stringify(['sede:a']) });

  const filas = [
    { _sedeRawId: 'sede:a' },
    { _sedeRawId: 'sede:b' },
    { _sedeRawId: '' },
  ];

  assert.deepEqual(filtrarPorSede(filas).map((f) => f._sedeRawId), ['sede:a']);
});

test('filtrarPorSede respeta un selector de sede alternativo', () => {
  globalThis.localStorage = almacen({ pdi_usuario_sedes: JSON.stringify(['sede:a']) });

  const filas = [{ sede_id: 'sede:a' }, { sede_id: 'sede:b' }];
  assert.deepEqual(
    filtrarPorSede(filas, (fila) => fila.sede_id).map((f) => f.sede_id),
    ['sede:a'],
  );
});

test('evaluarSede con la bandera apagada deja pasar una cuenta sin sedes', () => {
  assert.equal(evaluarSede('sede:x', [], false), true);
  assert.equal(evaluarSede('', [], false), true);
});

test('evaluarSede con la bandera activa niega una cuenta sin sedes', () => {
  assert.equal(evaluarSede('sede:x', [], true), false);
  assert.equal(evaluarSede('', [], true), false);
});

test('evaluarSede nunca deja pasar un registro sin sede si la cuenta está limitada', () => {
  assert.equal(evaluarSede('', ['sede:a'], false), false);
  assert.equal(evaluarSede('', ['sede:a'], true), false);
});
