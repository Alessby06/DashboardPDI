// ===========================================================================
//  COPIA LOCAL PERSISTENTE (SNAPSHOT CLÍNICO & CACHÉ)
// ===========================================================================
//  Última hidratación guardada prioritariamente en localStorage (con fallback
//  a sessionStorage). Permite pintar la app al instante (0 ms) en cualquier
//  pestaña, recarga o nueva visita mientras SurrealDB confirma en segundo plano
//  (estrategia Stale-While-Revalidate).
//
//  No guarda contraseñas, hashes ni tokens: solo los datasets clínicos
//  que ese usuario ya tiene autorizados.
//
//  La copia se invalida si cambia el usuario o el alcance, y caduca a las
//  24 horas. La hidratación real de SurrealDB siempre tiene la última palabra.
// ===========================================================================

export const CLAVE_SNAPSHOT = "pdi_snapshot_v1";
const PREFIJO_CACHE = "pdi_cache_v1:";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas de vigencia de caché base
const LIMITE_BYTES = 3_500_000; // margen seguro bajo las cuotas de almacenamiento

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

/** Acceso transparente y seguro a almacenamiento: intenta localStorage y luego sessionStorage. */
function leerItemStorage(clave) {
  try {
    const valLocal = localStorage.getItem(clave);
    if (valLocal) return valLocal;
  } catch {}
  try {
    const valSession = sessionStorage.getItem(clave);
    if (valSession) return valSession;
  } catch {}
  return null;
}

function guardarItemStorage(clave, valor) {
  let guardado = false;
  try {
    localStorage.setItem(clave, valor);
    guardado = true;
  } catch {}
  try {
    sessionStorage.setItem(clave, valor);
    guardado = true;
  } catch {}
  return guardado;
}

function removerItemStorage(clave) {
  try { localStorage.removeItem(clave); } catch {}
  try { sessionStorage.removeItem(clave); } catch {}
}

/** Usuario, rol y sedes: normalizado canónicamente para evitar falsos positivos de cambio. */
function alcanceActual() {
  const rol = (leerClave(CLAVES.rol) || "").toLowerCase().trim();
  const sedesRaw = leerClave(CLAVES.sedes);
  let sedesNorm = "";
  try {
    const parsed = JSON.parse(sedesRaw);
    if (Array.isArray(parsed)) {
      sedesNorm = parsed.map(s => String(s || "").trim().toLowerCase()).filter(Boolean).sort().join(",");
    } else {
      sedesNorm = String(sedesRaw || "").toLowerCase().trim();
    }
  } catch {
    sedesNorm = String(sedesRaw || "").toLowerCase().trim();
  }
  return `${rol}|${sedesNorm}`;
}

/**
 * Guarda los datasets hidratados. Si no cabe o el almacenamiento está
 * bloqueado, se ignora: la app sigue funcionando y la próxima recarga pedirá
 * los datos a la nube.
 */
export function guardarSnapshot(datos) {
  try {
    const login = leerClave(CLAVES.login).toLowerCase().trim();
    if (!datos) return;
    const texto = JSON.stringify({
      v: 1,
      usuario: login,
      alcance: alcanceActual(),
      ts: Date.now(),
      datos,
    });
    if (texto.length > LIMITE_BYTES) return;
    guardarItemStorage(CLAVE_SNAPSHOT, texto);
  } catch (e) {
    // Cuota llena o almacenamiento deshabilitado: no es un error de la app.
  }
}

/** Devuelve la copia válida persistente o de sesión, usuario y alcance, o null. */
export function leerSnapshot() {
  try {
    const bruto = leerItemStorage(CLAVE_SNAPSHOT);
    if (!bruto) return null;

    const snap = JSON.parse(bruto);
    if (!snap || snap.v !== 1) return null;

    const loginActual = leerClave(CLAVES.login).toLowerCase().trim();
    const snapUsuario = String(snap.usuario || "").toLowerCase().trim();
    // Si hay usuario explícito configurado y difiere del snapshot, se descarta.
    if (loginActual && snapUsuario && loginActual !== snapUsuario) return null;

    const alcance = alcanceActual();
    // Si ambos alcances están definidos y no concuerdan, se descarta.
    if (alcance && snap.alcance && alcance !== snap.alcance) return null;

    if (!Number.isFinite(snap.ts) || Date.now() - snap.ts > TTL_MS) return null;

    const d = snap.datos;
    if (!d
      || !Array.isArray(d.beneficiarios)
      || !Array.isArray(d.sedes)
      || !Array.isArray(d.casos)
      || !Array.isArray(d.voluntarios)) {
      return null;
    }

    // Normalización de colecciones para robustez máxima
    if (!Array.isArray(d.retirados)) d.retirados = [];
    if (!d.asistencia || typeof d.asistencia !== "object" || Array.isArray(d.asistencia)) d.asistencia = {};

    return snap;
  } catch (e) {
    return null;
  }
}

/** Borra la copia al cambiar de usuario o cerrar sesión. */
export function limpiarSnapshot() {
  removerItemStorage(CLAVE_SNAPSHOT);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const clave = localStorage.key(i);
      if (clave && clave.startsWith(PREFIJO_CACHE)) localStorage.removeItem(clave);
    }
  } catch {}
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const clave = sessionStorage.key(i);
      if (clave && clave.startsWith(PREFIJO_CACHE)) sessionStorage.removeItem(clave);
    }
  } catch {}
}

/**
 * Copia persistente de una respuesta de servidor (bitácora, listado de cuentas).
 * Misma validación de usuario y alcance que el snapshot clínico.
 */
export function guardarCache(clave, datos, opciones = {}) {
  try {
    const login = leerClave(CLAVES.login).toLowerCase().trim();
    if (!clave || datos === undefined || datos === null) return;
    const ttlMs = opciones.ttlMs || 30 * 60 * 1000;
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
    guardarItemStorage(PREFIJO_CACHE + clave, texto);
  } catch (e) {
    // Cuota llena o almacenamiento deshabilitado: se ignora.
  }
}

/** Devuelve la copia válida de una respuesta, o null. */
export function leerCache(clave, opciones = {}) {
  try {
    const bruto = leerItemStorage(PREFIJO_CACHE + clave);
    if (!bruto) return null;

    const cache = JSON.parse(bruto);
    if (!cache || cache.v !== 1) return null;

    const loginActual = leerClave(CLAVES.login).toLowerCase().trim();
    const snapUsuario = String(cache.usuario || "").toLowerCase().trim();
    if (loginActual && snapUsuario && loginActual !== snapUsuario) return null;

    const alcance = alcanceActual();
    if (alcance && cache.alcance && alcance !== cache.alcance) return null;

    const ttlMs = opciones.ttlMs || cache.ttlMs || 30 * 60 * 1000;
    if (!Number.isFinite(cache.ts) || Date.now() - cache.ts > ttlMs) return null;

    return cache.datos;
  } catch (e) {
    return null;
  }
}
