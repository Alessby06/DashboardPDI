// ===========================================================================
//  ALCANCE POR SEDE
// ===========================================================================
//  Cada cuenta puede cubrir una o varias sedes. Las listas y tableros se
//  limitan a esa selección para que quien atiende dos sedes no tenga que
//  revisar las siete.
//
//  Honestidad sobre el alcance: esto es un filtro de trabajo, no una barrera
//  de seguridad. El navegador consulta SurrealDB con un token clínico
//  compartido, así que una persona con la consola abierta puede leer la base
//  completa. La barrera real es la bitácora y, más adelante, mover las
//  lecturas al servidor.
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

/** Sedes asignadas a la cuenta activa. Lista vacía = todas. */
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
  return sedesDeCuenta().length === 0;
}

/** ¿Puede ver un registro de esta sede? Sin sede asignada en el registro, se deja pasar. */
export function sedePermitida(idSede) {
  if (!idSede) return true;
  if (alcanceCompleto()) return true;
  return sedesDeCuenta().includes(String(idSede));
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
  return filas.filter((fila) => {
    const id = obtenerId(fila);
    return !id || permitidas.has(String(id));
  });
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
