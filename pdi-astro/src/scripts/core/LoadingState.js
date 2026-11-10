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
import { prefetch } from "astro:prefetch";

const MIN_VISIBLE_MS = 350;
const ERROR_AFTER_MS = 7000;
const FADE_MS = 240;
const RUTAS_PREFETCH = [
  "/dashboard",
  "/padron",
  "/salud",
  "/social",
  "/voluntariados",
  "/auditoria",
];

/** Prefetch ocioso de los módulos principales.
 *
 * Con `hover` (la estrategia configurada) un enlace solo se adelanta cuando
 * hay puntero fino; en móvil el primer toque paga la descarga completa del
 * HTML. Una vez que los datos están en memoria y la pantalla ya se reveló, se
 * piden esas rutas en tiempo muerto. `prefetch()` respeta Data Saver y las
 * conexiones lentas. */
function prefetchRutasPrincipales() {
  if (window.__pdiPrefetchHecho) return;
  window.__pdiPrefetchHecho = true;
  const rutas = rutasDelMenu();
  if (!rutas.length) return;
  const lanzar = async () => {
    rutas.forEach((ruta) => prefetch(ruta));
    // El HTML por sí solo no basta: el chunk de la página se importa recién al
    // navegar y eso es lo que dejaba un segundo de tabla vacía o de cifras en
    // "…". Se importa ahora, en serie, para no competir con la hidratación.
    for (const ruta of rutas) await precargarModulos(ruta);
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(lanzar, { timeout: 3000 });
  } else {
    setTimeout(lanzar, 1200);
  }
}

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

/** Rutas que el rol puede ver en el menú, más las de la barra superior. */
function rutasDelMenu() {
  const rutas = new Set(["/perfil"]);
  const sidebar = document.getElementById("sidebarNav");
  try {
    sidebar?.querySelectorAll('a[href^="/"]').forEach((a) => {
      if (a.classList.contains("role-restricted")) return;
      const ruta = normalizarRuta(a.getAttribute("href"));
      if (ruta) rutas.add(ruta);
    });
  } catch {
    // Sin sidebar (login, 404) se usan las rutas conocidas.
  }
  // Si el menú aún no está montado, se conserva la lista mínima histórica.
  if (!sidebar) RUTAS_PREFETCH.forEach((ruta) => rutas.add(normalizarRuta(ruta)));
  rutas.delete(normalizarRuta(location.href));
  return [...rutas].filter(Boolean);
}

/** La precarga no debe gastar datos móviles ni competir en redes lentas. */
function permitePrecarga() {
  const conexion = navigator.connection;
  if (!conexion) return true;
  if (conexion.saveData) return false;
  return !/^(slow-2g|2g)$/.test(String(conexion.effectiveType || ""));
}

const rutasEnCurso = new Map();
const modulosEnCurso = new Map();

/**
 * Deja el módulo de una ruta en la caché del navegador. El HTML se lee una vez
 * y se marcan sus `script[type="module"]` con `modulepreload`: se descargan y
 * compilan, pero **no se ejecutan** hasta la navegación real. Importarlos aquí
 * ejecutaba el código de todas las secciones y podía bloquear el hilo principal
 * justo cuando el usuario cambiaba de página.
 */
async function precargarModulos(ruta) {
  if (!ruta || !permitePrecarga()) return;
  window.PDI = window.PDI || {};
  const listas = (window.PDI.__pdiRutasListas = window.PDI.__pdiRutasListas || new Set());
  if (listas.has(ruta)) return;
  if (rutasEnCurso.has(ruta)) return rutasEnCurso.get(ruta);

  const tarea = (async () => {
    try {
      const respuesta = await fetch(ruta, {
        headers: { Accept: "text/html" },
        credentials: "same-origin",
      });
      if (!respuesta.ok) return;
      const doc = new DOMParser().parseFromString(await respuesta.text(), "text/html");
      const fuentes = [...doc.querySelectorAll('script[type="module"][src]')]
        .map((script) => script.getAttribute("src"))
        .filter(Boolean)
        .map((src) => new URL(src, location.origin).href);

      const resultados = await Promise.all(fuentes.map(cargarModulo));
      if (resultados.every(Boolean)) listas.add(ruta);
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

/** Adelanta la ruta al pasar el puntero o al enfocar un enlace del menú. */
function enlazarPrecargaPorIntencion() {
  if (window.__pdiPrecargaIntencion) return;
  window.__pdiPrecargaIntencion = true;
  const activar = (evento) => {
    const el = evento.target instanceof Element
      ? evento.target.closest('a[href^="/"]')
      : null;
    if (!el || el.classList.contains("role-restricted")) return;
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

  // La ruta actual ya tiene su módulo ejecutándose: al volver a ella no hace
  // falta enseñar el esqueleto. Se anota antes de cualquier salida temprana.
  window.PDI = window.PDI || {};
  const rutasListas = (window.PDI.__pdiRutasListas = window.PDI.__pdiRutasListas || new Set());
  rutasListas.add(normalizarRuta(location.href));
  enlazarPrecargaPorIntencion();

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
    document.documentElement.classList.remove("pdi-navegando");

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

    prefetchRutasPrincipales();
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
