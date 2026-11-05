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
import { fetchCasosSociales } from '../core/db.js';
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { SocialKanbanView } from '../views/SocialKanbanView.js';
import { SocialController } from '../controllers/SocialController.js';
import { DerivacionView } from '../views/DerivacionView.js';
// El boton de exportar la bandeja ASP abre el modal de confirmacion, y su
// handler resuelve la descarga por window.PDI.AppController.
import { AppController } from '../controllers/AppController.js';

let enlazado = false;
let cargandoCasos = false;

/**
 * El lote global ya no trae evaluaciones ni atenciones: esas consultas solo
 * las necesita Social. Se piden aparte, después de la hidratación base, para
 * que las demás secciones no esperen por ellas.
 *
 * El módulo de datos sobrevive a las navegaciones de Astro, así que la
 * hidratación global solo ocurre una vez por documento y su evento no vuelve a
 * dispararse. Por eso esta carga también se lanza al entrar en Social.
 */
async function cargarCasosCompletos() {
  // El módulo sobrevive a las navegaciones: si ya se salió de Social, el
  // evento de otra sección no debe intentar repintar un tablero que no existe.
  if (document.body?.getAttribute("data-page") !== "social") return;
  if (cargandoCasos) return;
  cargandoCasos = true;
  try {
    const casos = await fetchCasosSociales();
    CasoSocialModel.aplicarDatos(casos);
    SocialKanbanView.renderKanban(casos);
  } catch {
    // La capa base ya reintenta y avisa; aquí se conserva lo que haya.
  } finally {
    cargandoCasos = false;
  }
}

/** Engancha lo que debe ocurrir una sola vez por carga. */
function enlazar() {
  if (enlazado) return;
  enlazado = true;
  document.addEventListener("pdi:datos-actualizados", cargarCasosCompletos);
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

  // El selector de quien deriva se llena con el voluntariado ya hidratado.
  // init() es idempotente: enlaza una vez y vuelve a poblar la lista.
  DerivacionView.init();
}

function iniciar() {
  // Acceso y chrome comun. Si devuelve null, PageGuard ya redirigio y no hay
  // nada mas que hacer en este documento.
  if (!arrancarComun()) return;

  SocialKanbanView.reiniciarEntrada();
  enlazar();
  montar();

  // Navegación interna: la capa de datos ya está hidratada y no volverá a
  // emitir pdi:datos-actualizados. En la primera carga espera ese evento.
  if (window.PDI?.__pdiDatosListos) cargarCasosCompletos();

  // Que redibujar cuando algo guarde en esta pagina, por ejemplo al dar de
  // alta a un usuario: antes era refreshAllViews(), que refrescaba las ocho
  // tablas; ahora solo la que esta a la vista.
  publicarRefresco(montar);

  console.log("[PDI] Área Social Pastoral lista (social.astro).");
}

document.addEventListener("astro:page-load", () => {
  if (document.body && document.body.getAttribute("data-page") === "social") {
    iniciar();
  }
});