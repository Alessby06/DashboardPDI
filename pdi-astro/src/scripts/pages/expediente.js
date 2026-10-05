// ===========================================================================
//  Expediente - Punto de entrada de expediente.html
// ===========================================================================
//  La unica pagina de la MPA que no esta en el menu lateral. RouteMap la declara
//  con enMenu:false y se llega desde el padron con expediente?id=N, o desde el
//  kanban social y el dashboard con expediente?codigo=PDI-2026-001. Al no
//  figurar en el menu, no hay ningun enlace que marcar como activo, y
//  por eso esta pagina lleva su propio boton de vuelta.
//
//  Montar y enlazar van separados a proposito, como en las otras ocho paginas:
//  montar() dibuja y puede ejecutarse tantas veces como haga falta; enlazar()
//  engancha lo que solo debe ocurrir una vez por carga, que es el caso de los
//  seis botones de seccion, porque un listener repetido haria que cada clic
//  cambiase de seccion dos veces.
//
//  Cero consultas al DOM en nivel de modulo: todo ocurre dentro de iniciar(),
//  que se invoca con el documento ya listo. Por eso importar este archivo nunca
//  falla por un elemento que todavia no existe.
import "../core/legacy-globals.js";
import { arrancarComun, publicarRefresco } from "../core/Bootstrap.js";
import { ExpedienteView } from "../views/ExpedienteView.js";

let enlazado = false;

/** Engancha lo que debe ocurrir una sola vez por carga. */
function enlazar() {
  if (enlazado) return;
  enlazado = true;
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

  // Tras guardar, publicarRefresco vuelve a montar(). Aqui eso no descarta nada:
  // render() vuelve a leer la URL, que es de donde sale el menor, y el id sigue
  // siendo el mismo.
  publicarRefresco(montar);

  console.log("[PDI] Expediente listo (expediente.html).");
}



document.addEventListener("astro:page-load", () => {
  if (document.body && document.body.getAttribute("data-page") === "expediente") {
    iniciar();
  }
});