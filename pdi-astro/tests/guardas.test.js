import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exigirPermiso } from '../scripts/_guardas.mjs';

test('sin --apply no permite escribir', () => {
  const r = exigirPermiso({ apply: false, backup: 'x', env: {} });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'dry-run');
});

test('sin PDI_ALLOW_DESTRUCTIVE no permite escribir', () => {
  const r = exigirPermiso({ apply: true, backup: process.cwd(), env: {} });
  assert.equal(r.ok, false);
});

test('sin backup existente no permite escribir', () => {
  const r = exigirPermiso({
    apply: true, backup: 'no-existe', env: { PDI_ALLOW_DESTRUCTIVE: '1' },
  });
  assert.equal(r.ok, false);
});

test('con apply, backup y env permite en la base esperada', () => {
  const r = exigirPermiso({
    apply: true,
    backup: process.cwd(),
    env: { PDI_ALLOW_DESTRUCTIVE: '1' },
    ns: 'johannes_gutenberg',
    db: 'infancia_saludable',
  });
  assert.equal(r.ok, true);
});

test('rechaza una base fuera de la lista blanca', () => {
  const r = exigirPermiso({
    apply: true,
    backup: process.cwd(),
    env: { PDI_ALLOW_DESTRUCTIVE: '1' },
    ns: 'johannes_gutenberg',
    db: 'otra_base',
  });
  assert.equal(r.ok, false);
});
