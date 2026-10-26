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

const MIN_VISIBLE_MS = 350;
const ERROR_AFTER_MS = 7000;
const FADE_MS = 240;

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
      return "No hay conexión con la base de datos. Revisa tu conexión e inténtalo de nuevo.";
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

    const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const espera = animar && !reducir ? FADE_MS : 0;

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
