// ===========================================================================
//  Expediente - Punto de entrada de expediente.html
// ===========================================================================
import "../core/legacy-globals.js";
import { arrancarComun, publicarRefresco } from "../core/Bootstrap.js";
import { ExpedienteView } from "../views/ExpedienteView.js";

/** Engancha los eventos del DOM de la página. Es idempotente. */
function enlazar() {
  ExpedienteView.init();
}

/** Dibuja lo propio de esta pagina. Es idempotente. */
function montar() {
  ExpedienteView.render();
}

function iniciar() {
  // Acceso y chrome comun. Si devuelve null, PageGuard ya redirigio y no hay
  // nada mas que hacer en este documento.
  if (!arrancarComun()) return;

  enlazar();
  montar();

  publicarRefresco(montar);

  console.log("[PDI] Expediente listo (expediente.html).");
}

function arrancarSiAplica() {
  if (document.body && document.body.getAttribute("data-page") === "expediente") {
    iniciar();
  }
}

// 1. Ejecutar de inmediato sin esperar a recursos diferidos si el DOM ya está parseado
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", arrancarSiAplica);
} else {
  arrancarSiAplica();
}

// 2. Soporte para navegación instantánea entre páginas con Astro ClientRouter
document.addEventListener("astro:page-load", arrancarSiAplica);