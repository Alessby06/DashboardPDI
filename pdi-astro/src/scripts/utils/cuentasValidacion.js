// ===========================================================================
//  VALIDACIÓN Y REGLAS DE ALCANCE PARA CUENTAS (COMPARTIDO CON PRUEBAS)
// ===========================================================================
//  Alinea las validaciones en cliente con `api/_cuentaBase.mjs` y las reglas
//  de minimización territorial (Ley N.° 29733).
// ===========================================================================

const RE_USUARIO = /^[a-z0-9._-]{3,32}$/;
const RE_CORREO = /^[^\s@]+@[^\s@]+\.(com|org|pe)$/;
const RE_TELEFONO = /^9\d{8}$/;

export const ROLES_CON_ALCANCE_GLOBAL = new Set(['admin', 'social']);

/**
 * Indica si el rol tiene acceso a todas las sedes por política del sistema.
 * @param {string} rol
 * @returns {boolean}
 */
export function esRolAlcanceGlobal(rol) {
  return ROLES_CON_ALCANCE_GLOBAL.has(String(rol || '').trim());
}

/**
 * Normaliza un teléfono móvil al formato esperado por el backend (9 dígitos).
 * @param {string} valor
 * @returns {string}
 */
export function normalizarTelefonoCliente(valor) {
  return String(valor || '').replace(/\D/g, '');
}

/**
 * Valida la regla de sedes (Ley N.° 29733) según el rol seleccionado.
 * @param {{ rol?: string, sedes?: string[], accesoGlobal?: boolean, sedesDisponiblesCount?: number }} params
 * @returns {{ ok: boolean, error?: string, sedes: string[] }}
 */
export function validarPermisosCuenta({
  rol = 'facilitadora',
  sedes = [],
  accesoGlobal = false,
  sedesDisponiblesCount = 0,
}) {
  if (esRolAlcanceGlobal(rol)) {
    return { ok: true, sedes: [] };
  }

  const seleccionadas = Array.isArray(sedes)
    ? [...new Set(sedes.map((s) => String(s || '').trim()).filter(Boolean))]
    : [];

  if (accesoGlobal) {
    return { ok: true, sedes: [] };
  }

  if (seleccionadas.length > 0) {
    return { ok: true, sedes: seleccionadas };
  }

  if (sedesDisponiblesCount === 0) {
    return {
      ok: false,
      sedes: [],
      error: 'Carga las sedes disponibles o marca acceso a todas las sedes de forma explícita.',
    };
  }

  return {
    ok: false,
    sedes: [],
    error: 'Selecciona al menos una sede o marca "Acceso a todas las sedes".',
  };
}

/**
 * Valida los campos del formulario de creación de cuenta antes de enviar al servidor.
 * @param {{
 *   nombre?: string,
 *   usuario?: string,
 *   rol?: string,
 *   correo?: string,
 *   telefono?: string,
 *   sedes?: string[],
 *   accesoGlobal?: boolean,
 *   sedesDisponiblesCount?: number,
 * }} entrada
 */
export function validarFormularioCrearCuenta(entrada = {}) {
  const errores = {};
  const nombre = String(entrada.nombre || '').trim();
  const usuario = String(entrada.usuario || '').trim().toLowerCase();
  const rol = String(entrada.rol || 'facilitadora').trim();
  const correo = String(entrada.correo || '').trim().toLowerCase();
  const telefonoCrudo = String(entrada.telefono || '').trim();
  const telefono = normalizarTelefonoCliente(telefonoCrudo);

  if (nombre.length < 2 || nombre.length > 80) {
    errores.nombre = 'Ingresa el nombre completo (entre 2 y 80 caracteres).';
  }

  if (!RE_USUARIO.test(usuario)) {
    errores.usuario = 'Usa entre 3 y 32 caracteres: minúsculas, números, punto o guion.';
  }

  if (correo && (correo.length > 120 || !RE_CORREO.test(correo))) {
    errores.correo = 'Usa un correo válido terminado en .com, .org o .pe.';
  }

  if (telefonoCrudo && !RE_TELEFONO.test(telefono)) {
    errores.telefono = telefono.startsWith('51') && telefono.length >= 10
      ? 'Ingresa solo 9 dígitos sin +51 (ej. 987654321).'
      : 'Ingresa un celular peruano de 9 dígitos que empiece con 9.';
  }

  const permisos = validarPermisosCuenta({
    rol,
    sedes: entrada.sedes,
    accesoGlobal: Boolean(entrada.accesoGlobal),
    sedesDisponiblesCount: Number(entrada.sedesDisponiblesCount || 0),
  });
  if (!permisos.ok && permisos.error) {
    errores.sedes = permisos.error;
  }

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    errores: {},
    datos: {
      nombre,
      usuario,
      rol,
      correo,
      telefono,
      sedes: permisos.sedes,
    },
  };
}
