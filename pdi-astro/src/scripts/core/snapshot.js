// ===========================================================================
//  COPIA DE SESIÓN
// ===========================================================================
//  Última hidratación guardada en sessionStorage. Sirve para pintar la app al
//  instante tras una recarga mientras SurrealDB confirma en segundo plano.
//
//  Vive solo en la pestaña: sobrevive a la recarga y se borra al cerrarla
//  (sessionStorage) y al cerrar sesión. No guarda contraseñas, hashes ni
//  tokens: solo los datasets que ese usuario ya puede ver.
//
//  La copia se invalida si cambia el usuario, el rol o las sedes asignadas, y
//  caduca a las 12 horas. La hidratación real siempre tiene la última palabra.
// ===========================================================================

export const CLAVE_SNAPSHOT = "pdi_snapshot_v1";
const PREFIJO_CACHE = "pdi_cache_v1:";
const TTL_MS = 12 * 60 * 60 * 1000;
const LIMITE_BYTES = 4_800_000; // margen bajo los ~5 MB de sessionStorage

const CLAVES = {
  login: "pdi_usuario_login",
  rol: "pdi_active_role",
  sedes: "pdi_usuario_sedes",
};

function leerClave(nombre) {
  try {
    return localStorage.getItem(nombre) || "";
  } catch {
    return "";
  }
}

/** Usuario, rol y sedes: si cambia cualquiera, la copia no sirve. */
function alcanceActual() {
  return `${leerClave(CLAVES.rol)}|${leerClave(CLAVES.sedes)}`;
}

/**
 * Guarda los datasets hidratados. Si no cabe o el almacenamiento está
 * bloqueado, se ignora: la app sigue funcionando y la próxima recarga pedirá
 * los datos a la nube.
 */
export function guardarSnapshot(datos) {
  try {
    const login = leerClave(CLAVES.login);
    if (!login || !datos) return;
    const texto = JSON.stringify({
      v: 1,
      usuario: login,
      alcance: alcanceActual(),
      ts: Date.now(),
      datos,
    });
    if (texto.length > LIMITE_BYTES) return;
    sessionStorage.setItem(CLAVE_SNAPSHOT, texto);
  } catch (e) {
    // Cuota llena o almacenamiento deshabilitado: no es un error de la app.
  }
}

/** Devuelve la copia válida para esta pestaña, usuario y alcance, o null. */
export function leerSnapshot() {
  try {
    const bruto = sessionStorage.getItem(CLAVE_SNAPSHOT);
    if (!bruto) return null;

    const snap = JSON.parse(bruto);
    if (!snap || snap.v !== 1) return null;

    const login = leerClave(CLAVES.login);
    if (!login || snap.usuario !== login) return null;
    if (snap.alcance !== alcanceActual()) return null;
    if (!Number.isFinite(snap.ts) || Date.now() - snap.ts > TTL_MS) return null;

    const d = snap.datos;
    if (!d
      || !Array.isArray(d.beneficiarios)
      || !Array.isArray(d.sedes)
      || !Array.isArray(d.casos)
      || !Array.isArray(d.voluntarios)
      || !Array.isArray(d.retirados)
      || !d.asistencia
      || typeof d.asistencia !== "object"
      || Array.isArray(d.asistencia)) {
      return null;
    }
    return snap;
  } catch (e) {
    return null;
  }
}

/** Borra la copia al cambiar de usuario o cerrar sesión. */
export function limpiarSnapshot() {
  try {
    sessionStorage.removeItem(CLAVE_SNAPSHOT);
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const clave = sessionStorage.key(i);
      if (clave && clave.startsWith(PREFIJO_CACHE)) sessionStorage.removeItem(clave);
    }
  } catch (e) {
    // Sin almacenamiento no hay nada que borrar.
  }
}

/**
 * Copia de una respuesta de servidor (bitácora, listado de cuentas). Misma
 * validación de usuario y alcance que el snapshot clínico; TTL corto porque
 * son datos que cambian con frecuencia. La vista pinta la copia y revalida.
 */
export function guardarCache(clave, datos, opciones = {}) {
  try {
    const login = leerClave(CLAVES.login);
    if (!login || !clave || datos === undefined || datos === null) return;
    const ttlMs = opciones.ttlMs || 15 * 60 * 1000;
    const maxBytes = opciones.maxBytes || 1_800_000;
    const texto = JSON.stringify({
      v: 1,
      usuario: login,
      alcance: alcanceActual(),
      ts: Date.now(),
      ttlMs,
      datos,
    });
    if (texto.length > maxBytes) return;
    sessionStorage.setItem(PREFIJO_CACHE + clave, texto);
  } catch (e) {
    // Cuota llena o almacenamiento deshabilitado: se ignora.
  }
}

/** Devuelve la copia válida de una respuesta, o null. */
export function leerCache(clave, opciones = {}) {
  try {
    const bruto = sessionStorage.getItem(PREFIJO_CACHE + clave);
    if (!bruto) return null;

    const cache = JSON.parse(bruto);
    if (!cache || cache.v !== 1) return null;

    const login = leerClave(CLAVES.login);
    if (!login || cache.usuario !== login) return null;
    if (cache.alcance !== alcanceActual()) return null;

    const ttlMs = opciones.ttlMs || cache.ttlMs || 15 * 60 * 1000;
    if (!Number.isFinite(cache.ts) || Date.now() - cache.ts > ttlMs) return null;

    return cache.datos;
  } catch (e) {
    return null;
  }
}
