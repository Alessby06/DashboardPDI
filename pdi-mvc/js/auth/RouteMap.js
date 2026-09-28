// ===========================================================================
//  MAPA DE RUTAS - Fuente unica de verdad de la topologia de la aplicacion
// ===========================================================================
//  Cada pagina de la MPA tiene aqui su ficha. El PageGuard decide el acceso a
//  partir de este archivo y de nada mas, de modo que las reglas no pueden
//  desincronizarse del markup.
//
//  El atributo data-roles del sidebar se derivaba de aqui antes; ya no existe
//  en el HTML. Si alguna vez hay que cambiar quien entra a donde, se cambia
//  SOLO en este archivo.
//
//  Al agregar una pagina nueva hay que:
//    1. Crear el HTML y su js/pages/<slug>.js
//    2. Anadirla aqui en PAGINAS
//    3. Anadirla en build.py (PAGINAS)
//    4. Anadir el <a href> en src/chrome/sidebar.html, si debe figurar en el menu
// ===========================================================================

/**
 * allowedRoles: quien puede entrar. Omitir el rol en una lista es lo mismo que
 * no permitirlo; no hay comodines.
 */
export const PAGINAS = {
  dashboard: {
    archivo: "dashboard.html",
    etiqueta: "Dashboard General",
    view: "view-dashboard",
    grupo: "General",
    enMenu: true,
    allowedRoles: ["coord", "facilitadora", "promotora", "social", "admin"],
  },

  padron: {
    archivo: "padron.html",
    etiqueta: "Padrón de Beneficiarios",
    view: "view-beneficiarios",
    grupo: "General",
    enMenu: true,
    allowedRoles: ["coord", "facilitadora", "promotora", "social", "admin"],
  },

  salud: {
    archivo: "salud.html",
    etiqueta: "Salud y Nutrición (CRED)",
    view: "view-salud",
    grupo: "Operación",
    enMenu: true,
    // Solo quien hace tamizaje de anemia y prescribe suplementos.
    allowedRoles: ["coord", "facilitadora", "admin"],
  },

  educativo: {
    archivo: "educativo.html",
    etiqueta: "Casita del Saber",
    view: "view-educativo",
    grupo: "Operación",
    enMenu: true,
    allowedRoles: ["coord", "promotora", "admin"],
  },

  social: {
    archivo: "social.html",
    etiqueta: "Derivaciones Sociales (ASP)",
    view: "view-social",
    grupo: "Operación",
    enMenu: true,
    allowedRoles: ["coord", "social", "admin"],
  },

  sedes: {
    archivo: "sedes.html",
    etiqueta: "Sedes e Iglesias",
    view: "view-sedes",
    grupo: "Operación",
    enMenu: true,
    allowedRoles: ["coord", "facilitadora", "promotora", "admin"],
  },

  // La clave es el slug, y el slug es data-page del <body>: "voluntariados",
  // no "voluntarios". El identificador de vista heredado si es "view-voluntarios"
  // y no tiene por que coincidir, porque lo traduce slugDesdeView().
  voluntariados: {
    archivo: "voluntariados.html",
    etiqueta: "Voluntariados",
    view: "view-voluntarios",
    grupo: "Operación",
    enMenu: true,
    allowedRoles: ["coord", "facilitadora", "promotora", "social", "admin"],
  },

  auditoria: {
    archivo: "auditoria.html",
    etiqueta: "Historial de Cambios",
    view: "view-auditoria",
    grupo: "Sistema",
    enMenu: true,
    // La bitacora de auditoria es sensible: no va al alcance operativo.
    allowedRoles: ["coord", "admin"],
  },

  ajustes: {
    archivo: "ajustes.html",
    etiqueta: "Ajustes",
    view: "view-ajustes",
    grupo: "Sistema",
    enMenu: true,
    allowedRoles: ["coord", "facilitadora", "promotora", "social", "admin"],
  },

  // Pagina de detalle. No figura en el menu: se llega por expediente?id=N.
  // El expediente cruza padron y caso social, asi que exige poder ver el
  // padron; quien no lo ve, no lo abre.
  expediente: {
    archivo: "expediente.html",
    etiqueta: "Expediente",
    view: "view-expediente",
    grupo: null,
    enMenu: false,
    requiereParametro: "id",
    allowedRoles: ["coord", "facilitadora", "promotora", "social", "admin"],
  },
};

/** Orden del menu lateral. Debe coincidir con src/chrome/sidebar.html. */
export const ORDEN_MENU = [
  "dashboard",
  "padron",
  "salud",
  "educativo",
  "social",
  "sedes",
  "voluntariados",
  "auditoria",
  "ajustes",
];

/** Paginas que el PageGuard debe bloquear al cambiar de rol. */
export function paginasDeMenu() {
  return ORDEN_MENU.map((slug) => PAGINAS[slug]).filter(Boolean);
}

/** Ruta segura ante un slug desconocido: nunca devolver undefined. */
export function pagina(slug) {
  return PAGINAS[slug] || null;
}

/** Resuelve el slug de la pagina actual a partir del DOM. */
export function slugActual() {
  return document.body?.dataset?.page || null;
}

/** Verifica si un rol puede entrar a una pagina. */
export function puedeAcceder(slug, rol) {
  const p = pagina(slug);
  if (!p) return false;
  return p.allowedRoles.includes(rol);
}

/**
 * Traduce el identificador de vista legado (view-dashboard) al slug de pagina
 * (dashboard). Lo necesitan los manejadores heredados: navigateToView() ya no
 * existe como enrutador, pero su equivalent es una navegacion de verdad.
 */
export function slugDesdeView(viewId) {
  const encontrado = Object.entries(PAGINAS).find(([, p]) => p.view === viewId);
  return encontrado ? encontrado[0] : null;
}

/** URL relativa de una pagina, con parametros opcionales ya serializados. */
export function urlDe(slug, params = null) {
  const p = pagina(slug);
  if (!p) return "./dashboard.html";

  let url = `./${p.archivo}`;
  if (params) {
    const limpio = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined && v !== "") limpio[k] = v;
    }
    const qs = new URLSearchParams(limpio).toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

/** Primera pagina a la que puede caer un rol, para redirigir cuando no accede. */
export function paginaDeRespaldo(rol) {
  for (const slug of ORDEN_MENU) {
    if (puedeAcceder(slug, rol)) return slug;
  }
  return "dashboard";
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.RouteMap = {
    PAGINAS,
    ORDEN_MENU,
    pagina,
    puedeAcceder,
    paginaDeRespaldo,
    slugDesdeView,
    urlDe,
  };
}
