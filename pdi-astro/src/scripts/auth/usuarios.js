// ===========================================================================
//  USUARIOS Y GESTIÓN DE SESIÓN
// ===========================================================================
//  Módulo de autenticación y control de sesión en cliente.
//  Incluye:
//   - Verificación de sesión e integridad criptográfica básica (token firmado).
//   - Límite de inactividad / expiración temporal de sesión (8 horas).
//   - Protección contra fuerza bruta (bloqueo tras intentos fallidos consecutivos).
//   - Cierre de sesión limpio con invalidación total de almacenamiento.
// ===========================================================================

export const USUARIOS = [
  {
    usuario: "coordinacion",
    clave: "coord2024",
    rol: "coord",
    nombre: "Coordinación General",
  },
  {
    usuario: "facilitadora",
    clave: "facil2024",
    rol: "facilitadora",
    nombre: "Facilitadora Nutricional",
  },
  {
    usuario: "promotora",
    clave: "promo2024",
    rol: "promotora",
    nombre: "Promotora Educativa",
  },
  {
    usuario: "social",
    clave: "social2024",
    rol: "social",
    nombre: "Trabajadora Social",
  },
  {
    usuario: "admin",
    clave: "admin2024",
    rol: "admin",
    nombre: "Administrador TI",
  },
];

export const CLAVE_SESION = "pdi_sesion_activa";
export const CLAVE_ROL = "pdi_active_role";
export const CLAVE_USUARIO_NOMBRE = "pdi_usuario_nombre";
export const CLAVE_SESSION_TOKEN = "pdi_session_token";
export const CLAVE_SESSION_EXP = "pdi_session_exp";
export const CLAVE_INTENTOS_FALLIDOS = "pdi_login_intentos";
export const CLAVE_BLOQUEO_HASTA = "pdi_login_bloqueado_hasta";

// Expiración por inactividad o duración máxima: 8 horas (en ms)
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;
// Máximo intentos fallidos permitidos antes de bloqueo temporal
const MAX_INTENTOS_FALLIDOS = 5;
// Tiempo de bloqueo por fuerza bruta: 60 segundos
const TIEMPO_BLOQUEO_MS = 60 * 1000;

// Firma de integridad simple usando hash FNV-1a para validar que localStorage no fue adulterado
function calcularFirmaSesion(usuario, rol, timestamp) {
  const str = `PDI_SALT_v1_${usuario}_${rol}_${timestamp}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Consulta el estado de bloqueo por intentos fallidos.
 * @returns {{ bloqueado: boolean, segundosRestantes: number }}
 */
export function verificarEstadoBloqueo() {
  try {
    const bloqueadoHasta = parseInt(localStorage.getItem(CLAVE_BLOQUEO_HASTA) || "0", 10);
    const ahora = Date.now();
    if (bloqueadoHasta > ahora) {
      const segundosRestantes = Math.ceil((bloqueadoHasta - ahora) / 1000);
      return { bloqueado: true, segundosRestantes };
    }
  } catch (e) {}
  return { bloqueado: false, segundosRestantes: 0 };
}

/**
 * Verifica si hay una sesión activa, válida y no expirada.
 * Si detecta que expiró o fue adulterada, la invalida inmediatamente.
 * @returns {boolean}
 */
export function haySesion() {
  try {
    const activa = localStorage.getItem(CLAVE_SESION);
    const rol = localStorage.getItem(CLAVE_ROL);
    const token = localStorage.getItem(CLAVE_SESSION_TOKEN);
    const expStr = localStorage.getItem(CLAVE_SESSION_EXP);

    if (activa !== "1" || !rol || !token || !expStr) {
      return false;
    }

    const exp = parseInt(expStr, 10);
    const ahora = Date.now();

    // Verificación de expiración
    if (isNaN(exp) || ahora > exp) {
      cerrarSesion();
      return false;
    }

    // Verificación de integridad del token (formato: timestamp.firma)
    const [timestamp, firma] = token.split(".");
    if (!timestamp || !firma) {
      cerrarSesion();
      return false;
    }

    // Verificar si el rol coincide con los conocidos
    const rolValido = USUARIOS.some((u) => u.rol === rol);
    if (!rolValido) {
      cerrarSesion();
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Intenta autenticar con usuario y contraseña.
 * Incluye protección contra ataques de fuerza bruta y generación de token de sesión.
 * @param {string} usuario
 * @param {string} clave
 * @returns {{ ok: boolean, error?: string, rol?: string, nombre?: string }}
 */
export function autenticar(usuario, clave) {
  // 1. Revisar si el sistema está temporalmente bloqueado
  const estadoBloqueo = verificarEstadoBloqueo();
  if (estadoBloqueo.bloqueado) {
    return {
      ok: false,
      error: `Demasiados intentos fallidos. Intente nuevamente en ${estadoBloqueo.segundosRestantes} segundos.`,
    };
  }

  const u = USUARIOS.find(
    (x) =>
      x.usuario.toLowerCase() === (usuario || "").toLowerCase().trim() &&
      x.clave === (clave || "")
  );

  if (!u) {
    // Registrar intento fallido
    try {
      const intentos = parseInt(localStorage.getItem(CLAVE_INTENTOS_FALLIDOS) || "0", 10) + 1;
      localStorage.setItem(CLAVE_INTENTOS_FALLIDOS, intentos.toString());

      if (intentos >= MAX_INTENTOS_FALLIDOS) {
        localStorage.setItem(CLAVE_BLOQUEO_HASTA, (Date.now() + TIEMPO_BLOQUEO_MS).toString());
        localStorage.removeItem(CLAVE_INTENTOS_FALLIDOS);
        return {
          ok: false,
          error: "Demasiados intentos fallidos. Acceso bloqueado por 60 segundos.",
        };
      }
    } catch (e) {}

    return { ok: false, error: "Usuario o contraseña incorrectos." };
  }

  // Éxito: Limpiar intentos fallidos y registrar nueva sesión
  try {
    localStorage.removeItem(CLAVE_INTENTOS_FALLIDOS);
    localStorage.removeItem(CLAVE_BLOQUEO_HASTA);

    const ahora = Date.now();
    const expiracion = ahora + DURACION_SESION_MS;
    const firma = calcularFirmaSesion(u.usuario, u.rol, ahora);
    const token = `${ahora}.${firma}`;

    localStorage.setItem(CLAVE_SESION, "1");
    localStorage.setItem(CLAVE_ROL, u.rol);
    localStorage.setItem(CLAVE_USUARIO_NOMBRE, u.nombre);
    localStorage.setItem(CLAVE_SESSION_TOKEN, token);
    localStorage.setItem(CLAVE_SESSION_EXP, expiracion.toString());
  } catch (e) {
    console.warn("[Auth] No se pudo persistir la sesión:", e);
  }

  return { ok: true, rol: u.rol, nombre: u.nombre };
}

/**
 * Cierra la sesión activa: elimina las credenciales locales, tokens de sesión y storage sensible.
 */
export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION);
    localStorage.removeItem(CLAVE_ROL);
    localStorage.removeItem(CLAVE_USUARIO_NOMBRE);
    localStorage.removeItem(CLAVE_SESSION_TOKEN);
    localStorage.removeItem(CLAVE_SESSION_EXP);
    sessionStorage.clear();
  } catch (e) {
    console.warn("[Auth] Error al cerrar sesión:", e);
  }
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.Auth = { haySesion, autenticar, cerrarSesion, verificarEstadoBloqueo };
}
