// ===========================================================================
//  USUARIOS Y GESTIÓN DE SESIÓN
// ===========================================================================
//  La autenticación real vive en el servidor (/api/cuenta/login). Aquí solo
//  se guardan las marcas de sesión para la interfaz: rol, nombre, foto y
//  caducidad. La cookie HttpOnly es la que valida el servidor; el
//  localStorage no puede leerla ni modificarla.
//
//  Las marcas locales sirven para el control de acceso de la interfaz
//  (PageGuard), que ya está documentado como una barrera de operación, no de
//  seguridad. Las operaciones del perfil sí se validan contra la cookie.
// ===========================================================================
import { limpiarSnapshot } from '../core/snapshot.js';

export const CLAVE_SESION = "pdi_sesion_activa";
export const CLAVE_ROL = "pdi_active_role";
export const CLAVE_USUARIO_NOMBRE = "pdi_usuario_nombre";
export const CLAVE_USUARIO_LOGIN = "pdi_usuario_login";
export const CLAVE_USUARIO_FOTO = "pdi_usuario_foto";
export const CLAVE_SESSION_EXP = "pdi_session_exp";
// Sedes asignadas a la cuenta: alcance de lectura de las vistas clínicas.
export const CLAVE_SEDES = "pdi_usuario_sedes";
// Copia de la última sesión confirmada por el servidor, para no preguntar en
// cada cambio de página. Vive en sessionStorage: se va con la pestaña.
const CLAVE_SESION_CACHE = "pdi_sesion_cache";
const SESION_CACHE_MS = 5 * 60 * 1000;

function leerSesionCache() {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION_CACHE);
    if (!crudo) return null;
    const guardado = JSON.parse(crudo);
    if (!guardado?.cuenta || !Number.isFinite(guardado.ts)) return null;
    if (Date.now() - guardado.ts > SESION_CACHE_MS) return null;
    // Si las marcas locales desaparecieron, la copia ya no sirve: hay que
    // preguntar al servidor para no pintar una sesión cerrada.
    if (localStorage.getItem(CLAVE_SESION) !== "1") return null;
    return guardado.cuenta;
  } catch {
    return null;
  }
}

function guardarSesionCache(cuenta) {
  try {
    sessionStorage.setItem(CLAVE_SESION_CACHE, JSON.stringify({ cuenta, ts: Date.now() }));
  } catch {
    // Sin almacenamiento disponible se sigue preguntando al servidor.
  }
}

/** Guarda la lista de sedes de la cuenta, normalizada a cadenas. */
function guardarSedes(sedes) {
  const lista = Array.isArray(sedes) ? sedes.filter((s) => typeof s === "string" && s) : [];
  localStorage.setItem(CLAVE_SEDES, JSON.stringify(lista));
}

// Expiración por inactividad: 8 horas (en ms), igual que la cookie.
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

/**
 * Verifica si hay una sesión activa y no expirada. Es una comprobación de
 * interfaz: el servidor vuelve a validar la cookie en cada operación.
 * @returns {boolean}
 */
export function haySesion() {
  try {
    const activa = localStorage.getItem(CLAVE_SESION);
    const rol = localStorage.getItem(CLAVE_ROL);
    const expStr = localStorage.getItem(CLAVE_SESSION_EXP);

    if (activa !== "1" || !rol || !expStr) return false;

    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) {
      cerrarSesion();
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Autentica contra el servidor. Devuelve la misma forma que antes para que
 * el formulario de acceso no cambie.
 * @param {string} usuario
 * @param {string} clave
 * @returns {Promise<{ ok: boolean, error?: string, rol?: string, nombre?: string }>}
 */
export async function autenticar(usuario, clave, codigo = "") {
  try {
    const res = await fetch("/api/cuenta/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ usuario, clave, codigo }),
    });
    const datos = await res.json().catch(() => ({}));
    if (!res.ok || !datos.ok) {
      return {
        ok: false,
        error: datos.error || "Usuario o contraseña incorrectos.",
        requiereTotp: Boolean(datos.requiereTotp),
      };
    }

    const expiracion = Number(datos.exp) || (Date.now() + DURACION_SESION_MS);
    const loginPrevio = (() => {
      try { return (localStorage.getItem(CLAVE_USUARIO_LOGIN) || "").toLowerCase().trim(); } catch { return ""; }
    })();
    const loginNuevo = String(datos.usuario || "").toLowerCase().trim();
    // Solo borra la copia clínica si cambia de usuario. Si es el mismo usuario,
    // conserva la copia para que la entrada al dashboard sea inmediata (0 ms).
    if (loginPrevio && loginNuevo && loginPrevio !== loginNuevo) {
      limpiarSnapshot();
    }
    localStorage.setItem(CLAVE_SESION, "1");
    localStorage.setItem(CLAVE_ROL, datos.rol || "coord");
    localStorage.setItem(CLAVE_USUARIO_NOMBRE, datos.nombre || "");
    localStorage.setItem(CLAVE_USUARIO_LOGIN, datos.usuario || "");
    localStorage.setItem(CLAVE_SESSION_EXP, String(expiracion));
    guardarSedes(datos.sedes);
    if (datos.foto) localStorage.setItem(CLAVE_USUARIO_FOTO, datos.foto);
    else localStorage.removeItem(CLAVE_USUARIO_FOTO);

    return { ok: true, rol: datos.rol, nombre: datos.nombre, debeCambiarClave: Boolean(datos.debeCambiarClave) };
  } catch (err) {
    return { ok: false, error: "No se pudo conectar. Verifica tu conexión e intenta de nuevo." };
  }
}

/**
 * Cierra la sesión: borra las marcas locales y avisa al servidor para que
 * retire la cookie HttpOnly. No espera la respuesta para no retrasar la salida.
 */
export function cerrarSesion() {
  try {
    fetch("/api/cuenta/logout", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => {});
  } catch (e) {}

  try {
    localStorage.removeItem(CLAVE_SESION);
    localStorage.removeItem(CLAVE_ROL);
    localStorage.removeItem(CLAVE_USUARIO_NOMBRE);
    localStorage.removeItem(CLAVE_USUARIO_LOGIN);
    localStorage.removeItem(CLAVE_USUARIO_FOTO);
    localStorage.removeItem(CLAVE_SESSION_EXP);
    localStorage.removeItem(CLAVE_SEDES);
    sessionStorage.clear();
  } catch (e) {
    console.warn("[Auth] Error al cerrar sesión:", e);
  }
}

/**
 * Sincroniza las marcas locales con la sesión real del servidor. La usan el
 * topbar y el perfil para pintar el nombre y la foto sin esperar al login.
 *
 * El topbar la llama en cada cambio de página. Para no pagar una ida al
 * servidor (~0,4-1 s) en cada navegación, el resultado se guarda 5 minutos en
 * `sessionStorage`, que vive y muere con la pestaña. El perfil pide
 * `{ forzar: true }` porque muestra datos que deben estar frescos.
 * @param {{ forzar?: boolean }} [opciones]
 * @returns {Promise<object|null>} cuenta pública o null
 */
export async function sincronizarSesion({ forzar = false } = {}) {
  const cache = !forzar ? leerSesionCache() : null;
  if (cache) return cache;

  const loginPrevio = (() => {
    try { return localStorage.getItem(CLAVE_USUARIO_LOGIN) || ""; } catch { return ""; }
  })();
  try {
    const res = await fetch("/api/cuenta/sesion", { credentials: "same-origin" });

    // 401 sí es "no hay sesión": se limpian las marcas. Un 5xx es un fallo del
    // servidor o de la base y NO debe cerrar la sesión del usuario.
    if (res.status === 401) {
      cerrarSesion();
      return null;
    }
    if (!res.ok) {
      throw new Error("No se pudo verificar la sesión (" + res.status + ").");
    }

    const datos = await res.json().catch(() => null);
    if (!datos?.ok || !datos.cuenta) return null;

    const cuenta = datos.cuenta;
    if (loginPrevio && cuenta.usuario && loginPrevio !== cuenta.usuario) {
      limpiarSnapshot();
    }
    localStorage.setItem(CLAVE_SESION, "1");
    localStorage.setItem(CLAVE_ROL, cuenta.rol || "coord");
    localStorage.setItem(CLAVE_USUARIO_NOMBRE, cuenta.nombre || "");
    localStorage.setItem(CLAVE_USUARIO_LOGIN, cuenta.usuario || "");
    if (datos.exp) localStorage.setItem(CLAVE_SESSION_EXP, String(datos.exp));
    guardarSedes(cuenta.sedes);
    if (cuenta.foto) localStorage.setItem(CLAVE_USUARIO_FOTO, cuenta.foto);
    else localStorage.removeItem(CLAVE_USUARIO_FOTO);

    guardarSesionCache(cuenta);
    return cuenta;
  } catch (e) {
    // Se propaga: el llamador decide si muestra un reintento. Nunca se debe
    // confundir una caída del servidor con una sesión inexistente.
    throw e;
  }
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.Auth = { haySesion, autenticar, cerrarSesion, sincronizarSesion };
}
