// ===========================================================================
//  Padron de Usuarios - Punto de entrada de padron.html
// ===========================================================================
//  Tabla maestra con busqueda, filtros combinables y paginacion.
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
import { BeneficiarioModel } from '../models/BeneficiarioModel.js';
import { BeneficiariosView } from '../views/BeneficiariosView.js';
import { BeneficiarioController } from '../controllers/BeneficiarioController.js';

let enlazado = false;

/** Engancha lo que debe ocurrir una sola vez por carga. */
function enlazar() {
  if (enlazado) return;
  enlazado = true;
  // El lienzo de firma del alta de menores se prepara una vez por carga.
  BeneficiarioController.initSignature();
}

/** Dibuja lo propio de esta pagina. Es idempotente. */
function montar() {
  BeneficiariosView.renderTable(BeneficiarioModel.getAll());
}

function iniciar() {
  // Acceso y chrome comun. Si devuelve null, PageGuard ya redirigio y no hay
  // nada mas que hacer en este documento.
  if (!arrancarComun()) return;

  BeneficiariosView.reiniciarEntrada();
  enlazar();
  montar();

  // Que redibujar cuando algo guarde en esta pagina, por ejemplo al dar de
  // alta a un menor: antes era refreshAllViews(), que refrescaba las ocho
  // tablas; ahora solo la que esta a la vista.
  publicarRefresco(montar);

  console.log("[PDI] Padron de Usuarios lista (padron.html).");
}

document.addEventListener("astro:page-load", () => {
  if (document.body && document.body.getAttribute("data-page") === "padron") {
    iniciar();
  }
});
