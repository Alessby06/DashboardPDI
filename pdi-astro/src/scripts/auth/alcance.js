// ===========================================================================
//  ALCANCE POR SEDE
// ===========================================================================
//  Cada cuenta puede cubrir una o varias sedes. Las listas y tableros se
//  limitan a esa selección para que quien atiende dos sedes no tenga que
//  revisar las siete.
//
//  Honestidad sobre el alcance: esto es un filtro de trabajo, no una barrera
//  de seguridad. Las listas y tableros siguen consultando SurrealDB con un
//  token clínico compartido, así que una persona con la consola abierta puede
//  leer la base completa. La ficha puntual ya se lee por /api/expediente, que
//  valida rol, área y sede en el servidor; mover el resto de lecturas es el
//  paso pendiente.
//
//  Una lista vacía significa «sin restricción»: la cuenta ve todas las sedes.
//  Se eligió así para no vaciar la vista de las cuentas que ya existían; la
//  pantalla de cuentas muestra el aviso «Sin sede» para que la decisión sea
//  visible.
// ===========================================================================
import { CLAVE_SEDES, CLAVE_ROL } from './usuarios.js';

let cache = null;
let cacheCrudo = null;

function texto(valor) {
  try {
    return localStorage.getItem(valor) || '';
  } catch {
    return '';
  }
}

// Se activa solo después de asignar sedes a las cuentas existentes. Con la
// bandera apagada, una cuenta sin sedes conserva alcance completo (comporta-
// miento histórico y visible en la pantalla de cuentas como «Sin sede»).
let OBLIGATORIAS = false;
try { OBLIGATORIAS = import.meta.env.PUBLIC_SEDES_OBLIGATORIAS === '1'; } catch {}
export const SEDES_OBLIGATORIAS_ACTIVAS = OBLIGATORIAS;

/** Sedes asignadas a la cuenta activa. Lista vacía = todas (salvo bandera). */
export function sedesDeCuenta() {
  const crudo = texto(CLAVE_SEDES);
  if (crudo === cacheCrudo && cache) return cache;
  let lista = [];
  try {
    const datos = crudo ? JSON.parse(crudo) : [];
    lista = Array.isArray(datos) ? datos.filter((s) => typeof s === 'string' && s) : [];
  } catch {
    lista = [];
  }
  cache = lista;
  cacheCrudo = crudo;
  return cache;
}

/** ¿La cuenta ve todas las sedes? */
export function alcanceCompleto() {
  if (OBLIGATORIAS) return false;
  return sedesDeCuenta().length === 0;
}

/**
 * Regla pura, para poder probarla con y sin la bandera.
 * @param {string} idSede
 * @param {string[]} sedes
 * @param {boolean} obligatorias
 */
export function evaluarSede(idSede, sedes, obligatorias = OBLIGATORIAS) {
  const lista = Array.isArray(sedes) ? sedes.filter(Boolean) : [];
  if (!lista.length) return !obligatorias;
  if (!idSede) return false;
  return lista.includes(String(idSede));
}

/** ¿Puede ver un registro de esta sede? Con alcance limitado, un registro sin sede queda fuera. */
export function sedePermitida(idSede) {
  return evaluarSede(idSede, sedesDeCuenta(), OBLIGATORIAS);
}

/**
 * Recorta una lista a las sedes de la cuenta.
 * @param {Array<object>} filas
 * @param {(fila: object) => string} [obtenerId]
 */
export function filtrarPorSede(filas, obtenerId = (fila) => fila._sedeRawId) {
  if (!Array.isArray(filas)) return [];
  if (alcanceCompleto()) return filas;
  const permitidas = new Set(sedesDeCuenta());
  return filas.filter((fila) => permitidas.has(String(obtenerId(fila) || '')));
}

/**
 * Casos sociales: el equipo ASP recibe derivaciones de todas las sedes, así
 * que Trabajo Social conserva la bandeja completa. El resto se limita a sus
 * sedes.
 */
export function filtrarCasos(filas) {
  if (texto(CLAVE_ROL) === 'social') return Array.isArray(filas) ? filas : [];
  return filtrarPorSede(filas);
}

/** Rol activo según las marcas locales (mismo criterio que PageGuard). */
export function rolDeCuenta() {
  return texto(CLAVE_ROL);
}

/** Se llama al cerrar sesión para no arrastrar el alcance anterior. */
export function limpiarAlcance() {
  cache = null;
  cacheCrudo = null;
}
