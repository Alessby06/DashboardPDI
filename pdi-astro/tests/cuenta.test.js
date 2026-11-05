import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cifrar,
  descifrar,
  firmarSesion,
  verificarSesion,
  validarClave,
  validarUsuario,
  validarNombre,
  validarCorreo,
} from '../../api/_cuentaBase.mjs';

const SECRETO = 'secreto-de-prueba-para-el-perfil';

test('el usuario de acceso se normaliza y valida', () => {
  assert.deepEqual(validarUsuario('Coordinacion'), {
    ok: true,
    usuario: 'coordinacion',
    error: '',
  });
  assert.equal(validarUsuario('a').ok, false);
  assert.equal(validarUsuario('con espacios').ok, false);
  assert.equal(validarUsuario('usuario@raro').ok, false);
  assert.equal(validarUsuario('admin.ti-2').ok, true);
});

test('la contraseña exige longitud mínima y no acepta solo espacios', () => {
  assert.equal(validarClave('1234567890'), '');
  assert.match(validarClave('corta'), /10 caracteres/);
  assert.match(validarClave('          '), /espacios/);
  assert.match(validarClave('a'.repeat(129)), /128 caracteres/);
});

test('el nombre se recorta y se rechazan longitudes imposibles', () => {
  assert.deepEqual(validarNombre('  Ana   María  '), {
    ok: true,
    nombre: 'Ana María',
    error: '',
  });
  assert.equal(validarNombre('').ok, false);
  assert.equal(validarNombre('a'.repeat(81)).ok, false);
});

test('el correo es opcional y se valida cuando existe', () => {
  assert.equal(validarCorreo('').ok, true);
  assert.equal(validarCorreo('persona@dominio.org').ok, true);
  assert.equal(validarCorreo('sin-arroba').ok, false);
  assert.equal(validarCorreo('a@b').ok, false);
});

test('el hash cifrado va y vuelve solo con el secreto correcto', () => {
  const original = '$argon2id$v=19$m=19456,t=2,p=1$hash-de-prueba';
  const paquete = cifrar(original, SECRETO);
  assert.match(paquete, /^v1\./);
  assert.equal(descifrar(paquete, SECRETO), original);
  assert.throws(() => descifrar(paquete, 'otro-secreto'));
});

test('la cookie de sesión se firma, caduca y detecta manipulación', () => {
  const datos = { sub: 'cuenta:abc123', usuario: 'ana', rol: 'coord', exp: Date.now() + 60_000 };
  const token = firmarSesion(datos, SECRETO);
  const leidos = verificarSesion(token, SECRETO);
  assert.equal(leidos.sub, 'cuenta:abc123');
  assert.equal(leidos.usuario, 'ana');
  assert.equal(verificarSesion(token, 'otro-secreto'), null);

  const [payload, firma] = token.split('.');
  const manipulado = Buffer.from(JSON.stringify({ ...datos, rol: 'admin' }), 'utf8').toString('base64url');
  assert.equal(verificarSesion(`${manipulado}.${firma}`, SECRETO), null);

  const vencido = firmarSesion({ ...datos, exp: Date.now() - 1000 }, SECRETO);
  assert.equal(verificarSesion(vencido, SECRETO), null);
  assert.equal(verificarSesion(payload, SECRETO), null);
});
