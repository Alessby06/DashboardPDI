// ===========================================================================
//  Area Social Pastoral (ASP) - Punto de entrada de social.astro
// ===========================================================================
//  Tablero kanban del area social pastoral, de recepcion a seguimiento.
//
//  Esta pagina es un documento, no una seccion. Al cargarse este archivo es lo
//  unico que corre: primero comprueba el acceso, despues arma el chrome y solo
//  entonces dibuja lo suyo. El orden no es decorativo, arrancarComun() puede
//  redirigir si el rol no corresponde, y en ese caso lo de abajo no debe
//  ejecutarse.
//
//  Montar y enlazar van separados a proposito. montar() dibuja y puede
//  ejecutarse tantas veces como haga falta; enlazar() engancha escuchadores y
//  se ejecuta una sola vez, porque un listener al documento registrado dos
//  veces hace que cada clic se procese dos veces.
//
//  Cero consultas al DOM en nivel de modulo: todo ocurre dentro de iniciar(),
//  que se invoca con el documento ya listo. Por eso importar este archivo nunca
//  falla por un elemento que todavia no existe.
import "../core/legacy-globals.js";
import { arrancarComun, publicarRefresco } from "../core/Bootstrap.js";
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { SocialKanbanView } from '../views/SocialKanbanView.js';
import { SocialController } from '../controllers/SocialController.js';
// El boton de exportar la bandeja ASP abre el modal de confirmacion, y su
// handler resuelve la descarga por window.PDI.AppController.
import { AppController } from '../controllers/AppController.js';

let enlazado = false;

/** Engancha lo que debe ocurrir una sola vez por carga. */
function enlazar() {
  if (enlazado) return;
  enlazado = true;
}

/** Dibuja lo propio de esta pagina. Es idempotente. */
function montar() {
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get("tab");
  const rol = localStorage.getItem("pdi_active_role") || "coord";

  if (tab === "autorizaciones" && (rol === "coord" || rol === "admin")) {
    SocialKanbanView.activarPanelDirecto("autorizaciones");
    SocialKanbanView.renderVistaAutorizaciones();
  } else if (tab === "mis-solicitudes" && rol === "social") {
    SocialKanbanView.activarPanelDirecto("mis-solicitudes");
    SocialKanbanView.renderVistaMisSolicitudes();
  } else {
    SocialKanbanView.activarPanelDirecto("kanban");
    SocialKanbanView.renderKanban(CasoSocialModel.getAll());
    // El simulador socioeconomico se calcula con los valores iniciales del formulario.
    SocialController.handleVulnerabilidadChange();
  }
}

function iniciar() {
  // Acceso y chrome comun. Si devuelve null, PageGuard ya redirigio y no hay
  // nada mas que hacer en este documento.
  if (!arrancarComun()) return;

  SocialKanbanView.reiniciarEntrada();
  enlazar();
  montar();

  // Que redibujar cuando algo guarde en esta pagina, por ejemplo al dar de
  // alta a un menor: antes era refreshAllViews(), que refrescaba las ocho
  // tablas; ahora solo la que esta a la vista.
  publicarRefresco(montar);

  console.log("[PDI] Área Social Pastoral lista (social.astro).");
}

document.addEventListener("astro:page-load", () => {
  if (document.body && document.body.getAttribute("data-page") === "social") {
    iniciar();
  }
});