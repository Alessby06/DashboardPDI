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
  validarTelefono,
  codigoTotp,
  generarSecretoTotp,
  verificarTotp,
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
  assert.equal(validarCorreo('persona@dominio.com').ok, true);
  assert.equal(validarCorreo('persona@dominio.org').ok, true);
  assert.equal(validarCorreo('persona@dominio.pe').ok, true);
  assert.equal(validarCorreo('sin-arroba').ok, false);
  assert.equal(validarCorreo('a@b').ok, false);
  assert.equal(validarCorreo('@dominio.com').ok, false);
  assert.equal(validarCorreo('persona@dominio.net').ok, false);
});

test('el teléfono exige 9 dígitos y empieza con 9', () => {
  assert.equal(validarTelefono('').ok, true);
  assert.equal(validarTelefono('987654321').ok, true);
  assert.equal(validarTelefono('987-654-321').ok, true);
  assert.equal(validarTelefono('887654321').ok, false);
  assert.equal(validarTelefono('98765432').ok, false);
  assert.equal(validarTelefono('9876543210').ok, false);
  assert.equal(validarTelefono('+51 987654321').ok, false);
  assert.equal(validarTelefono('98765432a').ok, false);
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

// --- Segundo factor ---------------------------------------------------------

test('el TOTP coincide con los vectores del RFC 6238', () => {
  // Secreto de prueba del RFC: ASCII "12345678901234567890" en Base32.
  const secreto = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const casos = [
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ];
  for (const [segundos, esperado] of casos) {
    assert.equal(codigoTotp(secreto, segundos * 1000), esperado, `paso ${segundos}`);
  }
});

test('el secreto nuevo es Base32 de 160 bits', () => {
  const secreto = generarSecretoTotp();
  assert.match(secreto, /^[A-Z2-7]{32}$/);
  assert.notEqual(secreto, generarSecretoTotp());
});

test('se acepta el paso actual y el anterior, nunca el futuro', () => {
  const secreto = generarSecretoTotp();
  const instante = Math.floor(1_700_000_000_000 / 30000) * 30000;
  const actual = instante / 30000;

  assert.equal(verificarTotp(secreto, codigoTotp(secreto, instante), 0, instante), actual);
  assert.equal(
    verificarTotp(secreto, codigoTotp(secreto, instante - 30000), 0, instante),
    actual - 1,
  );
  assert.equal(verificarTotp(secreto, codigoTotp(secreto, instante + 30000), 0, instante), null);
  assert.equal(verificarTotp(secreto, '12345', 0, instante), null);
  assert.equal(verificarTotp(secreto, '000000', 0, instante), null);
});

test('un código ya consumido no se vuelve a aceptar', () => {
  const secreto = generarSecretoTotp();
  const instante = Math.floor(1_700_000_000_000 / 30000) * 30000;
  const actual = instante / 30000;
  const codigo = codigoTotp(secreto, instante);

  assert.equal(verificarTotp(secreto, codigo, 0, instante), actual);
  assert.equal(verificarTotp(secreto, codigo, actual, instante), null);
  // Tampoco vale retroceder al paso anterior una vez consumido el actual.
  assert.equal(
    verificarTotp(secreto, codigoTotp(secreto, instante - 30000), actual, instante),
    null,
  );
});
