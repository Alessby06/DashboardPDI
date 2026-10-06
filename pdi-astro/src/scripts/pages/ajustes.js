// ===========================================================================
//  Ajustes - Punto de entrada de ajustes.html
// ===========================================================================
//  Preferencias visuales, tema, modo foco y mantenimiento de la base local.
import "../core/legacy-globals.js";
import { arrancarComun, publicarRefresco } from "../core/Bootstrap.js";
import { AjustesView } from "../views/AjustesView.js";

/** Engancha eventos del DOM e inicializa controles de la vista. */
function enlazar() {
  AjustesView.init();
}

/** Dibuja lo propio de esta pagina. Es idempotente. */
function montar() {
  AjustesView.render();
}

function iniciar() {
  if (!arrancarComun()) return;

  enlazar();
  montar();

  publicarRefresco(montar);

  console.log("[PDI] Ajustes lista (ajustes.html).");
}

function arrancarSiAplica() {
  if (document.body && document.body.getAttribute("data-page") === "ajustes") {
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