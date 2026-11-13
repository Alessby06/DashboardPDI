import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firmaBitacora, mismaBitacora } from '../src/scripts/utils/bitacora.js';

const A = [
  { id: 'LOG-0001', timestamp: '2026-11-12 10:00' },
  { id: 'LOG-0002', timestamp: '2026-11-12 09:00' },
];

test('la firma no cambia si los eventos son los mismos', () => {
  const copia = A.map((x) => ({ ...x }));
  assert.equal(firmaBitacora(A), firmaBitacora(copia));
  assert.equal(mismaBitacora(A, copia), true);
  assert.equal(mismaBitacora([], []), true);
  assert.equal(mismaBitacora(null, []), true);
});

test('la firma cambia cuando entra un evento nuevo o cambia el primero', () => {
  const nuevo = [{ id: 'LOG-0001', timestamp: '2026-11-12 11:00' }, ...A.slice(1)];
  assert.equal(mismaBitacora(A, nuevo), false);
  assert.equal(mismaBitacora(A, A.slice(1)), false);
  assert.equal(mismaBitacora(A, []), false);
});
