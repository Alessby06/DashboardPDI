// ===========================================================================
//  PAGE GUARD - Control de acceso por pagina
// ===========================================================================
//  Sustituye al bloqueo cosmetico de la SPA. Ahi, RoleController solo bajaba la
//  opacidad del enlace del menu: los datos ya estaban en memoria, de modo que
//  quien quisiera verlos no tenia mas que llamar al enrutador desde la consola.
//  En una MPA cada pagina es un documento aparte, asi que el bloqueo tiene que
//  actuar sobre la CARGA, no sobre el enlace.
//
//  Que hace, en orden:
//    1. Lee el rol activo y lo valida contra los roles conocidos.
//    2. Si la pagina actual no le corresponde al rol, redirige a la primera que
//       si le corresponde. No se dibuja nada de la pagina denegada.
//    3. Aplica el bloqueo visual a los enlaces del menu, leyendo las reglas de
//       RouteMap y no de los atributos del HTML.
//
//  Honestidad sobre el modelo de seguridad: esto es control de acceso en el
//  cliente y el rol vive en localStorage, que cualquier persona con acceso al
//  navegador puede editar. Sirve para evitar errores de operacion y para que la
//  interfaz no ofrezca lo que no corresponde; NO es una barrera frente a un
//  usuario deliberado. Esa barrera solo puede existir cuando los datos dejen de
//  estar en el navegador, es decir, con un backend que valide el rol en cada
//  consulta. Ver js/models/StorageService.js.
//
//  Uso: llamar PageGuard.init() como PRIMERA instruccion de cada
//  js/pages/<slug>.js, antes de ejecutar cualquier vista.
import { pagina, puedeAcceder, paginaDeRespaldo } from "./RouteMap.js";

const CLAVE_ROL = "pdi_active_role";
const ROL_POR_DEFECTO = "coord";

/** Roles que el sistema reconoce. Deben coincidir con RoleController.rolesConfig. */
const ROLES_CONOCIDOS = ["coord", "facilitadora", "promotora", "social", "admin"];

export const PageGuard = {
  /** Rol con el que se resolvio la ultima comprobacion. */
  rolActual: null,

  /** Pagina que se esta mostrando. Se fija en init(). */
  slugActual: null,

  /** Devuelve el rol activo, validado. Nunca devuelve un rol desconocido. */
  leerRol() {
    try {
      const guardado = localStorage.getItem(CLAVE_ROL);
      return ROLES_CONOCIDOS.includes(guardado) ? guardado : ROL_POR_DEFECTO;
    } catch (e) {
      // localStorage puede estar bloqueado (modo privado, cookies de terceros
      // deshabilitadas). Se sigue con el rol por defecto en vez de fallar.
      console.warn("[PageGuard] No se pudo leer el rol activo:", e);
      return ROL_POR_DEFECTO;
    }
  },

  /**
   * Guarda el rol. Lo llama el selector de rol, no el guardian.
   */
  guardarRol(rol) {
    if (!ROLES_CONOCIDOS.includes(rol)) {
      console.warn("[PageGuard] Rol desconocido, se ignora:", rol);
      return;
    }
    try {
      localStorage.setItem(CLAVE_ROL, rol);
    } catch (e) {
      console.warn("[PageGuard] No se pudo guardar el rol activo:", e);
    }
  },

  /**
   * Punto de entrada. Debe ser la primera instruccion del script de pagina.
   * Devuelve el slug de la pagina, o null si la carga fue denegada (en cuyo
   * caso ya se lanzo la redireccion y el resto de la pagina no debe correr).
   */
  init() {
    const slug = document.body?.dataset?.page || null;
    const rol = this.leerRol();

    this.rolActual = rol;

    if (!slug || !pagina(slug)) {
      console.error("[PageGuard] La pagina no declara data-page o el slug no existe en RouteMap:", slug);
      this.redirigir(paginaDeRespaldo(rol));
      return null;
    }

    this.slugActual = slug;

    if (!puedeAcceder(slug, rol)) {
      this.denegar(slug, rol);
      return null;
    }

    this.aplicarBloqueoMenu(rol);
    return slug;
  },

  /**
   * Deniega el acceso: avisa y manda a la primera pagina permitida. Usa
   * location.replace para que el documento denegado no quede en el historial,
   * de modo que el boton "atras" no devuelva al usuario a una pagina que no
   * le corresponde.
   */
  denegar(slug, rol) {
    const destino = paginaDeRespaldo(rol);
    const etiqueta = pagina(slug)?.etiqueta || slug;

    console.warn(`[PageGuard] Rol '${rol}' sin acceso a '${slug}'. Redirigiendo a '${destino}'.`);
    this.aviso(`El rol activo no tiene acceso a ${etiqueta}.`);

    this.redirigir(destino);
  },

  /** Redireccion dura, sin dejar rastro en el historial. */
  redirigir(slug) {
    const destino = pagina(slug);
    if (!destino) {
      console.error("[PageGuard] Destino de redireccion inexistente:", slug);
      return;
    }
    window.location.replace(`/${slug}`);
  },

  /**
   * Marca los enlaces del menu a los que el rol no puede entrar. La informacion
   * sale de RouteMap, no de data-roles, para que no existan dos verdades.
   *
   * Se usa aria-disabled y se intercepta el clic en lugar de pointer-events,
   * porque opacity con pointer-events no es accesible: el enlace seguiria
   * siendo tabulable y announced como disponible, y se activaria con Enter.
   */
  aplicarBloqueoMenu(rol) {
    const enlaces = document.querySelectorAll(".nav-btn[data-page]");

    enlaces.forEach((enlace) => {
      const slug = enlace.getAttribute("data-page");
      const permitido = puedeAcceder(slug, rol);

      if (permitido) {
        enlace.classList.remove("role-restricted");
        enlace.removeAttribute("aria-disabled");
        enlace.removeAttribute("data-restricted-reason");
        enlace.onclick = null;
      } else {
        enlace.classList.add("role-restricted");
        enlace.setAttribute("aria-disabled", "true");
        enlace.setAttribute("data-restricted-reason", "Restringido para el rol activo");
        // El href se conserva para que el enlace siga siendo un enlace real
        // (navegacion con teclado, abrir en pestana nueva, historial); lo que se
        // anula es la navegacion desde la aplicacion.
        enlace.onclick = (evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          this.aviso(`No tienes acceso a ${pagina(slug)?.etiqueta || slug} con el rol activo.`);
        };
      }
    });
  },

  /** Aviso breve. Usa el sistema de notificaciones si ya esta montado. */
  aviso(mensaje) {
    const pila = document.getElementById("toastContainer");
    if (!pila) {
      console.warn(`[PageGuard] ${mensaje}`);
      return;
    }
    const toaster = window.PDI?.ToastView;
    if (toaster && typeof toaster.show === "function") {
      // show(titulo, mensaje, tipo): aqui solo hay un texto que decir, y el
      // mensaje es opcional. Pasar el texto dos veces lo dibujaba dos veces.
      toaster.show(mensaje, undefined, "warning");
      return;
    }
    // El ToastView puede no estar montado todavia (esta es una redireccion
    // temprana): se muestra un aviso propio para que el motivo no se pierda.
    // La clase es toast-msg, la que tiene estilo; antes se usaba "toast
    // toast-warning", que no aparece en ninguna hoja, y el aviso salia como un
    // texto pelado dentro de la pila. Se rellena con textContent y no con
    // innerHTML: el mensaje es texto, no marcado.
    const aviso = document.createElement("div");
    aviso.className = "toast-msg";
    aviso.style.borderColor = "var(--gt-yellow)";
    aviso.style.color = "var(--gt-yellow)";
    aviso.style.fontWeight = "700";
    aviso.textContent = mensaje;
    pila.appendChild(aviso);
    setTimeout(() => aviso.remove(), 4000);
  },
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.PageGuard = PageGuard;
}
