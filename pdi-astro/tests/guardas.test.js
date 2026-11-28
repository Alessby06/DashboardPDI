import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exigirPermiso, destinoSeguro, campoUsuario } from '../scripts/_guardas.mjs';

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

test('rechaza un backup que es un directorio vacio', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pdi-backup-'));
  try {
    const r = exigirPermiso({
      apply: true,
      backup: dir,
      env: { PDI_ALLOW_DESTRUCTIVE: '1' },
      ns: 'johannes_gutenberg',
      db: 'infancia_saludable',
    });
    assert.equal(r.ok, false);
    assert.equal(r.motivo, 'backup-vacio');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('no permite sobrescribir un export con contenido sin --force', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pdi-export-'));
  try {
    assert.equal(destinoSeguro(dir).ok, true);
    writeFileSync(join(dir, 'persona.jsonl'), 'x');
    const r = destinoSeguro(dir);
    assert.equal(r.ok, false);
    assert.equal(r.motivo, 'directorio-no-vacio');
    assert.equal(destinoSeguro(dir, { force: true }).ok, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('campoUsuario respeta la bandera de esquema', () => {
  assert.equal(campoUsuario({ PUBLIC_ESQUEMA_USUARIO: '0' }), 'persona_id');
  assert.equal(campoUsuario({ PUBLIC_ESQUEMA_USUARIO: '1' }), 'usuario_id');
  assert.equal(campoUsuario({}), 'persona_id');
});
