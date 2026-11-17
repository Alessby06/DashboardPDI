import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarUsuario, generarCodigoRecuperacion } from '../../api/_cuentaBase.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

test('usuario de recuperación: normaliza y valida', () => {
  assert.deepEqual(validarUsuario('  Coordinacion '), {
    ok: true,
    usuario: 'coordinacion',
    error: '',
  });
  assert.equal(validarUsuario('ab').ok, false);
  assert.equal(validarUsuario('con espacios').ok, false);
  assert.equal(validarUsuario('a'.repeat(33)).ok, false);
  assert.equal(validarUsuario('admin@x').ok, false);
  assert.equal(validarUsuario('').ok, false);
});

test('código de recuperación: 6 caracteres sin ambiguos', () => {
  for (let i = 0; i < 200; i += 1) {
    const codigo = generarCodigoRecuperacion();
    assert.equal(codigo.length, 6);
    assert.match(codigo, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  }
});

test('la migración define tabla, campos e índices', () => {
  const sql = fs.readFileSync(
    path.join(AQUI, '..', '..', 'api', 'migrations', '001_solicitud_recuperacion.surql'),
    'utf8',
  );
  for (const campo of [
    'usuario',
    'codigo',
    'estado',
    'creado_el',
    'resuelto_el',
    'resuelto_por',
    'motivo_cierre',
    'ip_hash',
  ]) {
    assert.match(sql, new RegExp(`FIELD IF NOT EXISTS ${campo} ON solicitud_recuperacion`));
  }
  assert.match(sql, /codigo UNIQUE/);
  assert.match(sql, /PERMISSIONS NONE/);
});
