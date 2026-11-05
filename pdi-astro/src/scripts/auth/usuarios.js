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

export const CLAVE_SESION = "pdi_sesion_activa";
export const CLAVE_ROL = "pdi_active_role";
export const CLAVE_USUARIO_NOMBRE = "pdi_usuario_nombre";
export const CLAVE_USUARIO_LOGIN = "pdi_usuario_login";
export const CLAVE_USUARIO_FOTO = "pdi_usuario_foto";
export const CLAVE_SESSION_EXP = "pdi_session_exp";

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
export async function autenticar(usuario, clave) {
  try {
    const res = await fetch("/api/cuenta/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ usuario, clave }),
    });
    const datos = await res.json().catch(() => ({}));
    if (!res.ok || !datos.ok) {
      return { ok: false, error: datos.error || "Usuario o contraseña incorrectos." };
    }

    const expiracion = Number(datos.exp) || (Date.now() + DURACION_SESION_MS);
    localStorage.setItem(CLAVE_SESION, "1");
    localStorage.setItem(CLAVE_ROL, datos.rol || "coord");
    localStorage.setItem(CLAVE_USUARIO_NOMBRE, datos.nombre || "");
    localStorage.setItem(CLAVE_USUARIO_LOGIN, datos.usuario || "");
    localStorage.setItem(CLAVE_SESSION_EXP, String(expiracion));
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
    sessionStorage.clear();
  } catch (e) {
    console.warn("[Auth] Error al cerrar sesión:", e);
  }
}

/**
 * Sincroniza las marcas locales con la sesión real del servidor. La usan el
 * topbar y el perfil para pintar el nombre y la foto sin esperar al login.
 * @returns {Promise<object|null>} cuenta pública o null
 */
export async function sincronizarSesion() {
  try {
    const res = await fetch("/api/cuenta/sesion", { credentials: "same-origin" });
    if (!res.ok) return null;
    const datos = await res.json().catch(() => null);
    if (!datos?.ok || !datos.cuenta) return null;

    const cuenta = datos.cuenta;
    localStorage.setItem(CLAVE_SESION, "1");
    localStorage.setItem(CLAVE_ROL, cuenta.rol || "coord");
    localStorage.setItem(CLAVE_USUARIO_NOMBRE, cuenta.nombre || "");
    localStorage.setItem(CLAVE_USUARIO_LOGIN, cuenta.usuario || "");
    if (datos.exp) localStorage.setItem(CLAVE_SESSION_EXP, String(datos.exp));
    if (cuenta.foto) localStorage.setItem(CLAVE_USUARIO_FOTO, cuenta.foto);
    else localStorage.removeItem(CLAVE_USUARIO_FOTO);

    return cuenta;
  } catch (e) {
    return null;
  }
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.Auth = { haySesion, autenticar, cerrarSesion, sincronizarSesion };
}
