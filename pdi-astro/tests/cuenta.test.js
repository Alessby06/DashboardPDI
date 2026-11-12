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
  validarEliminacionCuentas,
} from '../../api/_cuentaBase.mjs';
import { clasificarCuentaBasura, esCuentaBasura } from '../src/scripts/utils/cuentasBasura.js';

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

// --- Detección y eliminación de cuentas basura ------------------------------

test('clasificarCuentaBasura detecta restos E2E y cuentas de prueba sin falsos positivos comunes', () => {
  assert.equal(clasificarCuentaBasura({ usuario: 'e2e-alta-17313', nombre: 'Alta E2E' })?.tipo, 'e2e');
  assert.equal(clasificarCuentaBasura({ usuario: 'e2e-coord-999', nombre: 'E2E coord' })?.tipo, 'e2e');
  assert.equal(clasificarCuentaBasura({ usuario: 'usuario.prueba', nombre: 'Usuario Prueba' })?.tipo, 'prueba');
  assert.equal(clasificarCuentaBasura({ usuario: 'test123', nombre: 'Cuenta Demo' })?.tipo, 'prueba');
  assert.equal(clasificarCuentaBasura({ usuario: 'asdf', nombre: 'aaaa' })?.tipo, 'prueba');
  assert.equal(clasificarCuentaBasura({ usuario: '123456', nombre: '123456' })?.tipo, 'prueba');
  assert.equal(
    clasificarCuentaBasura({ usuario: 'maria.lopez', nombre: 'Maria Lopez', correo: 'maria@example.com' })?.tipo,
    'prueba',
  );

  assert.equal(esCuentaBasura({ usuario: 'coordinacion', nombre: 'Coordinación General' }), false);
  assert.equal(esCuentaBasura({ usuario: 'admin', nombre: 'Administrador TI' }), false);
  assert.equal(esCuentaBasura({ usuario: 'camila.quispe', nombre: 'Camila Quispe Rojas' }), false);
  assert.equal(esCuentaBasura({ usuario: 'esteban.testa', nombre: 'Esteban Demetrio Testa' }), false);
});

test('validarEliminacionCuentas protege la cuenta propia y al último admin activo', () => {
  const todas = [
    { id: 'cuenta:adm1', usuario: 'admin', nombre: 'Admin Uno', rol: 'admin', activo: true },
    { id: 'cuenta:adm2', usuario: 'e2e-admin-1', nombre: 'E2E admin', rol: 'admin', activo: true },
    { id: 'cuenta:adm3', usuario: 'admin.inactivo', nombre: 'Admin Viejo', rol: 'admin', activo: false },
    { id: 'cuenta:pro1', usuario: 'e2e-promo-1', nombre: 'E2E promo', rol: 'promotora', activo: true },
  ];

  assert.equal(validarEliminacionCuentas(todas, [], 'cuenta:adm1').status, 400);
  assert.equal(validarEliminacionCuentas(todas, ['cuenta:bad-id!'], 'cuenta:adm1').status, 400);
  assert.equal(validarEliminacionCuentas(todas, ['cuenta:noexiste'], 'cuenta:adm1').status, 404);
  assert.equal(validarEliminacionCuentas(todas, ['cuenta:adm1'], 'cuenta:adm1').status, 400);
  assert.equal(validarEliminacionCuentas(todas, ['cuenta:adm2', 'cuenta:adm1'], 'cuenta:adm1').status, 400);

  // Si solo queda un admin activo y otro actor intenta borrarlo, también se bloquea.
  const unSoloAdmin = [
    { id: 'cuenta:adm1', usuario: 'admin', rol: 'admin', activo: true },
    { id: 'cuenta:adm3', usuario: 'admin.inactivo', rol: 'admin', activo: false },
  ];
  assert.equal(validarEliminacionCuentas(unSoloAdmin, ['cuenta:adm1'], 'cuenta:otro').status, 400);

  // Borrado válido en lote (admin E2E + promo E2E + admin inactivo) conserva a adm1.
  const ok = validarEliminacionCuentas(
    todas,
    ['cuenta:adm2', 'cuenta:pro1', 'cuenta:adm3', 'cuenta:adm2'],
    'cuenta:adm1',
  );
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.objetivos.map((o) => o.id), ['cuenta:adm2', 'cuenta:pro1', 'cuenta:adm3']);

  const demasiadas = Array.from({ length: 101 }, (_, i) => `cuenta:c${i}`);
  assert.equal(validarEliminacionCuentas(todas, demasiadas, 'cuenta:adm1').status, 400);
});
