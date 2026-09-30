// ===========================================================================
//  Ajustes - Punto de entrada de ajustes.html
// ===========================================================================
//  Preferencias visuales, tema, modo foco y mantenimiento de la base local.
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
// Esta vista solo se importa en su pagina. Antes la cargaba Bootstrap en las
// diez, y por el solo hecho de tener el boton de tema en la barra superior cada
// pagina pagaba sus 11 KB.
import { AjustesView } from "../views/AjustesView.js";
// El resto de esta pagina es declarativa: no consume ningun modelo.

let enlazado = false;

/** Engancha lo que debe ocurrir una sola vez por carga. */
function enlazar() {
  if (enlazado) return;
  enlazado = true;
  // Los tres botones de tema y la mascota de foco. El tema en si ya quedo
  // restaurado por Theme.cargar() dentro de arrancarComun().
  AjustesView.init();
}

/** Dibuja lo propio de esta pagina. Es idempotente. */
function montar() {
  // La pagina es declarativa: no hay tabla que dibujar. Lo unico vivo, el
  // modo foco y el tema, ya quedo enganchado por AjustesView.init().
}

function iniciar() {
  // Acceso y chrome comun. Si devuelve null, PageGuard ya redirigio y no hay
  // nada mas que hacer en este documento.
  if (!arrancarComun()) return;

  enlazar();
  montar();

  // Que redibujar cuando algo guarde en esta pagina, por ejemplo al dar de
  // alta a un menor: antes era refreshAllViews(), que refrescaba las ocho
  // tablas; ahora solo la que esta a la vista.
  publicarRefresco(montar);

  console.log("[PDI] Ajustes lista (ajustes.html).");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar, { once: true });
} else {
  iniciar();
}
