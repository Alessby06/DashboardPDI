import { test } from 'node:test';
import assert from 'node:assert/strict';

import { crearLimite } from '../../api/_limite.mjs';

test('permite hasta el máximo y luego bloquea', () => {
  const limite = crearLimite({ maximo: 2, ventanaMs: 1000 });

  assert.deepEqual(limite.permitir('cuenta:1', 0), { ok: true, restantes: 1 });
  assert.deepEqual(limite.permitir('cuenta:1', 100), { ok: true, restantes: 0 });

  const bloqueado = limite.permitir('cuenta:1', 200);
  assert.equal(bloqueado.ok, false);
  // La ventana arranca en 0; faltan 800 ms → 1 segundo redondeado hacia arriba.
  assert.equal(bloqueado.reintentarEn, 1);
});

test('la ventana se desliza y vuelve a permitir', () => {
  const limite = crearLimite({ maximo: 1, ventanaMs: 1000 });

  assert.equal(limite.permitir('a', 0).ok, true);
  assert.equal(limite.permitir('a', 500).ok, false);
  assert.equal(limite.permitir('a', 1000).ok, true);
});

test('cada clave tiene su propio cupo', () => {
  const limite = crearLimite({ maximo: 1, ventanaMs: 1000 });

  assert.equal(limite.permitir('a', 0).ok, true);
  assert.equal(limite.permitir('b', 0).ok, true);
  assert.equal(limite.permitir('a', 0).ok, false);
  assert.equal(limite.permitir('b', 0).ok, false);
});

test('la memoria no crece sin límite: expulsa las claves más viejas', () => {
  const limite = crearLimite({ maximo: 5, ventanaMs: 1000, maxClaves: 2 });

  limite.permitir('a', 1);
  limite.permitir('b', 1);
  limite.permitir('c', 1);

  assert.equal(limite.claves, 2);
  // 'a' fue la primera insertada: su cupo se perdió.
  assert.equal(limite.permitir('a', 1).ok, true);
});

test('una clave vacía cae en el cupo anónimo', () => {
  const limite = crearLimite({ maximo: 1, ventanaMs: 1000 });

  assert.equal(limite.permitir('', 0).ok, true);
  assert.equal(limite.permitir('anon', 0).ok, false);
});
