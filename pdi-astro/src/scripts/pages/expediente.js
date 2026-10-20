// ===========================================================================
//  Expediente - Punto de entrada de expediente.html
// ===========================================================================
import "../core/legacy-globals.js";
import { arrancarComun, publicarRefresco } from "../core/Bootstrap.js";
import { ExpedienteView } from "../views/ExpedienteView.js";
import { iniciarTiposCampo } from "../ui/tiposCampo.js";

/** Engancha los eventos del DOM de la página. Es idempotente. */
function enlazar() {
  ExpedienteView.init();
  // Los campos con tipo propio (DNI, telefono, nombres) filtran lo que se
  // escribe. El modulo es idempotente: conectarlo dos veces no duplica nada.
  iniciarTiposCampo();
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

document.addEventListener("astro:page-load", () => {
  if (document.body && document.body.getAttribute("data-page") === "expediente") {
    iniciar();
  }
});