// ===========================================================================
//  ESTADO DE CARGA INICIAL
// ===========================================================================
//  El esqueleto (LoadingSkeleton.astro) llega en el HTML. Este controlador
//  decide cuando se retira:
//
//    - 'ok'          -> fundido al contenido real (minimo 350 ms en pantalla)
//    - 'sin_conexion'-> no corta el esqueleto: db.js reintenta sola con backoff.
//                       El aviso con reintento aparece si la espera supera 7 s.
//    - 'cargando'    -> sigue el esqueleto; las actualizaciones LIVE posteriores
//                       no lo vuelven a mostrar
//
//  En navegacion interna, la marca window.PDI.__pdiDatosListos (y su atributo
//  en <html>) hace que el esqueleto ni siquiera se pinte. La marca vive en
//  window porque Astro reemplaza el <html> en cada transicion.
// ===========================================================================
import { suscribirEstado } from "./db.js";
import { extraerRecursos } from "./recursosDocumento.js";

const MIN_VISIBLE_MS = 350;
const ERROR_AFTER_MS = 7000;
const FADE_MS = 240;

// Ya no hay rastreo ocioso de todas las secciones. Descargaba el HTML y los
// módulos de las seis rutas del menú apenas se revelaba el contenido, y en la
// traza de producción todavía seguía pidiendo chunks (salud a los 187 ms,
// educativo a los 720, social a los 1141…) mientras el usuario navegaba: en vez
// de adelantar el destino, competía con él. Ahora solo se adelanta la sección
// sobre la que hay intención (puntero o foco en el menú).

/** Ruta comparable: sin barra final y sin query. */
function normalizarRuta(valor) {
  try {
    const url = new URL(valor || location.href, location.href);
    const ruta = url.pathname.replace(/\/+$/, "");
    return ruta || "/";
  } catch {
    return "";
  }
}

/** La precarga no debe gastar datos móviles ni competir en redes lentas. */
function permitePrecarga() {
  const conexion = navigator.connection;
  if (!conexion) return true;
  if (conexion.saveData) return false;
  return !/^(slow-2g|2g)$/.test(String(conexion.effectiveType || ""));
}

// Se deja también en `window.PDI` porque es el estado que observan las pruebas
// de navegación para saber que la sección ya está adelantada, y es lo único que
// distingue "precargada" de "pedida al navegar".
window.PDI = window.PDI || {};
const rutasListas = (window.PDI.__pdiRutasListas =
  window.PDI.__pdiRutasListas || new Set());
const rutasEnCurso = new Map();
const modulosEnCurso = new Map();
const estilosEnCurso = new Set();

/**
 * Deja en la caché del navegador lo que la ruta destino necesita antes de
 * navegar: sus módulos y sus hojas de estilo. Los módulos se marcan con
 * `modulepreload` (se descargan y compilan, pero **no se ejecutan** hasta la
 * navegación real; importarlos acá ejecutaba todas las secciones y bloqueaba el
 * hilo justo cuando el usuario cambiaba de página).
 *
 * La hoja de estilo también se adelanta: Astro no cambia de documento hasta que
 * el CSS del destino está cargado, y medido en producción eso costaba 168 ms de
 * espera antes del intercambio.
 */
async function precargarModulos(ruta) {
  if (!ruta || !permitePrecarga()) return;
  if (rutasListas.has(ruta)) return;
  if (rutasEnCurso.has(ruta)) return rutasEnCurso.get(ruta);

  const tarea = (async () => {
    try {
      const respuesta = await fetch(ruta, {
        headers: { Accept: "text/html" },
        credentials: "same-origin",
      });
      if (!respuesta.ok) return;
      const { modulos, estilos } = extraerRecursos(await respuesta.text(), location.origin);

      estilos.forEach(precargarEstilo);
      const resultados = await Promise.all(modulos.map(cargarModulo));
      if (resultados.every(Boolean)) rutasListas.add(ruta);
    } catch {
      // Red lenta o ruta no disponible: la página conserva su esqueleto.
    }
  })().finally(() => rutasEnCurso.delete(ruta));

  rutasEnCurso.set(ruta, tarea);
  return tarea;
}

/** Marca un módulo para descarga y compilación, sin ejecutarlo. */
function cargarModulo(src) {
  if (modulosEnCurso.has(src)) return modulosEnCurso.get(src);
  const tarea = new Promise((resolve) => {
    const enlace = document.createElement("link");
    enlace.rel = "modulepreload";
    enlace.href = src;
    enlace.addEventListener("load", () => resolve(true), { once: true });
    enlace.addEventListener("error", () => resolve(false), { once: true });
    document.head.appendChild(enlace);
  });
  modulosEnCurso.set(src, tarea);
  return tarea;
}

/** Deja la hoja de estilo en la caché, sin aplicarla a esta página. */
function precargarEstilo(href) {
  if (!href || estilosEnCurso.has(href)) return;
  estilosEnCurso.add(href);
  const enlace = document.createElement("link");
  enlace.rel = "preload";
  enlace.as = "style";
  enlace.href = href;
  document.head.appendChild(enlace);
}

/** Adelanta la ruta al pasar el puntero o al enfocar un enlace del menú. */
function enlazarPrecargaPorIntencion() {
  if (window.__pdiPrecargaIntencion) return;
  window.__pdiPrecargaIntencion = true;
  const activar = (evento) => {
    const el = evento.target instanceof Element
      ? evento.target.closest('a[href^="/"]')
      : null;
    if (!el) return;
    // Solo el menú y la barra superior. La tabla del padrón tiene una ficha
    // distinta por fila: adelantarlas al pasar el puntero descargaba la sección
    // entera una vez por fila, y esas URLs no se reutilizan nunca.
    if (!el.closest("#sidebarNav, .topbar")) return;
    if (el.classList.contains("role-restricted")) return;
    precargarModulos(normalizarRuta(el.getAttribute("href")));
  };
  document.addEventListener("pointerover", activar, { passive: true });
  document.addEventListener("focusin", activar);
}

let iniciadoEn = 0;
let revelado = false;
let desuscribir = null;
let temporizadorMinimo = null;
let temporizadorError = null;

function limpiarTemporizadores() {
  clearTimeout(temporizadorMinimo);
  clearTimeout(temporizadorError);
  temporizadorMinimo = null;
  temporizadorError = null;
}

/**
 * Arranca el estado de carga de la pagina actual. Es idempotente por pagina:
 * Bootstrap lo llama una vez tras cada astro:page-load.
 */
export function iniciarEstadoCarga() {
  const shell = document.getElementById("pdiViewShell");
  if (!shell) return;

  // La precarga por intención se engancha una sola vez por carga.
  enlazarPrecargaPorIntencion();

  // La ruta actual ya tiene su módulo ejecutándose: no hace falta volver a
  // adelantarla ni enseñar su esqueleto al regresar.
  rutasListas.add(normalizarRuta(location.href));

  // Si el controlador ya corrio en esta misma pagina, no dupliques listeners.
  if (shell.dataset.pdiCargaIniciada === "1") return;
  shell.dataset.pdiCargaIniciada = "1";

  limpiarTemporizadores();
  if (desuscribir) {
    desuscribir();
    desuscribir = null;
  }

  iniciadoEn = performance.now();
  revelado = false;

  const contenido = document.getElementById("pdiViewContent");
  const esqueleto = document.getElementById("pdiSkeleton");
  const estado = document.getElementById("pdiLoadingStatus");
  const errorTexto = document.getElementById("pdiSkeletonErrorText");
  const boton = document.getElementById("pdiSkeletonRetry");

  // Navegacion interna con la capa ya hidratada: no hay nada que esperar.
  // La marca vive en window (sobrevive al reemplazo del <html> que hace Astro);
  // el atributo del documento es solo el puente visual para el CSS.
  if (window.PDI?.__pdiDatosListos || document.documentElement.dataset.pdiReady === "1") {
    document.documentElement.dataset.pdiReady = "1";
    revelar({ animar: false, marcarListo: false });
    return;
  }

  // Recarga con copia de sesión: los modelos ya tienen los datos de la última
  // hidratación, así que no se espera al esqueleto mínimo ni a la nube.
  if (window.PDI?.__pdiSnapshotListo) {
    document.documentElement.dataset.pdiReady = "1";
    revelar({ animar: false, marcarListo: false });
    return;
  }

  if (contenido) {
    contenido.setAttribute("inert", "");
    contenido.setAttribute("aria-busy", "true");
  }
  if (estado) estado.textContent = "Cargando datos del sistema…";
  if (errorTexto) errorTexto.textContent = "Revisa la conexión e inténtalo de nuevo.";
  shell.removeAttribute("data-pdi-loading-error");

  if (boton) {
    boton.onclick = () => {
      shell.removeAttribute("data-pdi-loading-error");
      if (estado) estado.textContent = "Reintentando conexión…";
      if (esqueleto) esqueleto.removeAttribute("hidden");
      clearTimeout(temporizadorError);
      temporizadorError = setTimeout(
        () => mostrarError(mensajeDeError()),
        ERROR_AFTER_MS,
      );
      window.PDI?.DB?.reintentarAhora?.();
    };
  }

  desuscribir = suscribirEstado((nuevoEstado) => {
    if (revelado) return;

    if (nuevoEstado === "ok") {
      clearTimeout(temporizadorError);
      temporizadorError = null;
      programarRevelado();
      return;
    }

    // 'sin_conexion' no corta el esqueleto de inmediato: db.js reintenta sola
    // con backoff. El aviso aparece si la espera supera ERROR_AFTER_MS.
  });

  temporizadorError = setTimeout(
    () => mostrarError(mensajeDeError()),
    ERROR_AFTER_MS,
  );

  function mensajeDeError() {
    const actual = window.PDI?.DB?.estadoActual?.();
    if (actual === "sin_conexion") {
      // db.js usa 'sin_conexion' para cualquier fallo de hidratación, no solo
      // para una caída de red. Si el detalle no parece de conexión, no se
      // culpa a la base: se muestra un mensaje neutro y se conserva el log.
      const detalle = String(window.PDI?.DB?.ultimoError?.()?.message || "");
      const pareceRed = !detalle
        || /fetch|network|offline|timeout|ECONN|ENOTFOUND|token|servidor|conexi|acceso a la base|database/i.test(detalle);
      return pareceRed
        ? "No hay conexión con la base de datos. Revisa tu conexión e inténtalo de nuevo."
        : "No se pudo cargar la información. Reintenta; si persiste, contacta a Administración TI.";
    }
    return "La carga está tardando más de lo esperado. Revisa tu conexión e inténtalo de nuevo.";
  }

  function programarRevelado() {
    if (revelado) return;
    const transcurrido = performance.now() - iniciadoEn;
    const restante = Math.max(0, MIN_VISIBLE_MS - transcurrido);
    clearTimeout(temporizadorMinimo);
    temporizadorMinimo = setTimeout(() => revelar({ animar: true, marcarListo: true }), restante);
  }

  function revelar({ animar = true, marcarListo = true } = {}) {
    if (revelado) return;
    revelado = true;
    limpiarTemporizadores();

    if (desuscribir) {
      desuscribir();
      desuscribir = null;
    }

    // Navegación interna: el contenido ya está en el DOM y viene de la caché
    // de módulos. Se muestra sin fundido para no retrasar la lectura; la
    // transición de Astro ya hace la entrada entre páginas.
    if (!animar) {
      if (contenido) contenido.style.transition = "none";
      if (esqueleto) esqueleto.style.transition = "none";
      requestAnimationFrame(() => {
        if (contenido) contenido.style.removeProperty("transition");
        if (esqueleto) esqueleto.style.removeProperty("transition");
      });
    }

    // El velo de navegación ya cumplió: la página tiene sus datos pintados.
    document.documentElement.classList.remove("pdi-contenido-pendiente");

    shell.classList.add("is-ready");
    shell.removeAttribute("data-pdi-loading-error");
    if (contenido) {
      contenido.removeAttribute("inert");
      contenido.removeAttribute("aria-busy");
    }
    if (estado) estado.textContent = "Datos cargados.";

    // Marca de sesion: los datos ya estan en memoria aunque el documento
    // cambie de <html> en la siguiente navegacion del ClientRouter.
    window.PDI = window.PDI || {};
    window.PDI.__pdiDatosListos = true;

    const espera = animar ? FADE_MS : 0;

    setTimeout(() => {
      if (marcarListo) document.documentElement.dataset.pdiReady = "1";
      if (esqueleto) esqueleto.setAttribute("hidden", "");
    }, espera);
  }

  function mostrarError(mensaje) {
    if (revelado) return;
    clearTimeout(temporizadorError);
    temporizadorError = null;
    shell.setAttribute("data-pdi-loading-error", "");
    if (errorTexto) errorTexto.textContent = mensaje || "Revisa la conexión e inténtalo de nuevo.";
    if (estado) estado.textContent = "No se pudo cargar la información. Puedes reintentar.";
  }
}
