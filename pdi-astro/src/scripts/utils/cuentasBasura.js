// ===========================================================================
//  DETECCIÓN DE CUENTAS DE PRUEBA O BASURA
// ===========================================================================
//  Clasifica cuentas probables de prueba/desecho (por ejemplo restos `e2e-*`
//  de Playwright o altas manuales como `test`, `prueba`, `demo`, etc.) para
//  ayudar a administración a revisarlas y limpiarlas.
//
//  No toma acciones destructivas por sí sola: toda eliminación exige acción y
//  confirmación explícita del administrador.
// ===========================================================================

const TOKENS_BASURA = new Set([
  'e2e',
  'test',
  'tests',
  'testing',
  'prueba',
  'pruebas',
  'demo',
  'tmp',
  'temp',
  'basura',
  'fake',
  'dummy',
  'sandbox',
  'borrar',
  'eliminar',
  'asdf',
  'qwer',
  'qwerty',
  'zxcv',
  'xxx',
  'zzz',
  'null',
  'undefined',
]);

const TOKEN_NUMERADO_BASURA = /^(test|tests|prueba|pruebas|demo|tmp|temp|basura|fake|dummy|user|usuario)\d+$/;
const DOMINIOS_CORREO_PRUEBA = /@(example\.(com|org|net)|test\.(com|org|pe)|prueba\.(com|pe)|mailinator\.com)$/i;

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function tokensDe(texto) {
  return normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Clasifica una cuenta si parece una cuenta temporal/de prueba.
 * @param {{ usuario?: string, nombre?: string, correo?: string }} cuenta
 * @returns {{ tipo: 'e2e' | 'prueba', etiqueta: string, motivo: string } | null}
 */
export function clasificarCuentaBasura(cuenta) {
  if (!cuenta || typeof cuenta !== 'object') return null;

  const usuario = normalizar(cuenta.usuario);
  const nombre = normalizar(cuenta.nombre);
  const correo = normalizar(cuenta.correo);

  if (usuario.startsWith('e2e-') || usuario === 'e2e' || /\be2e\b/.test(nombre)) {
    return {
      tipo: 'e2e',
      etiqueta: 'Prueba E2E',
      motivo: 'Cuenta temporal creada por pruebas automatizadas (prefijo e2e-).',
    };
  }

  const tokensUsuario = tokensDe(usuario);
  const tokensNombre = tokensDe(nombre);
  const todosLosTokens = [...tokensUsuario, ...tokensNombre];

  const tokenCoincidente = todosLosTokens.find(
    (t) => TOKENS_BASURA.has(t) || TOKEN_NUMERADO_BASURA.test(t),
  );
  if (tokenCoincidente) {
    return {
      tipo: 'prueba',
      etiqueta: 'Posible prueba',
      motivo: `Contiene el identificador de prueba "${tokenCoincidente}".`,
    };
  }

  if (usuario && /^\d+$/.test(usuario)) {
    return {
      tipo: 'prueba',
      etiqueta: 'Posible prueba',
      motivo: 'El usuario contiene solo dígitos.',
    };
  }

  if (nombre && !/[a-z]/.test(nombre)) {
    return {
      tipo: 'prueba',
      etiqueta: 'Posible prueba',
      motivo: 'El nombre no contiene letras válidas.',
    };
  }

  if (/(.)\1{3,}/.test(usuario) || /(.)\1{3,}/.test(nombre.replace(/\s+/g, ''))) {
    return {
      tipo: 'prueba',
      etiqueta: 'Posible prueba',
      motivo: 'Contiene caracteres repetidos sin sentido.',
    };
  }

  if (correo && DOMINIOS_CORREO_PRUEBA.test(correo)) {
    return {
      tipo: 'prueba',
      etiqueta: 'Posible prueba',
      motivo: 'Usa un dominio de correo de prueba.',
    };
  }

  return null;
}

/** @param {{ usuario?: string, nombre?: string, correo?: string }} cuenta */
export function esCuentaBasura(cuenta) {
  return clasificarCuentaBasura(cuenta) !== null;
}
