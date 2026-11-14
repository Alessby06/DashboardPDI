// ===========================================================================
//  Dashboard General - Punto de entrada de dashboard.html
// ===========================================================================
//  Consolida cobertura del padron, estado nutricional, asistencia y casos sociales.
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
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { SedeModel } from '../models/SedeModel.js';
import { AuditModel } from '../models/AuditModel.js';
import { DashboardView } from '../views/DashboardView.js';
// El boton de exportar del panel invoca window.exportDataCSV, y ese puente
// resuelve por window.PDI. Antes AppController lo traia legacy-globals a las
// diez paginas; con 2 KB aqui basta.
import { AppController } from '../controllers/AppController.js';

let enlazado = false;
let listo = false;

/** Engancha lo que debe ocurrir una sola vez por carga. */
function enlazar() {
  if (enlazado) return;
  enlazado = true;

  // Reactividad: los datos llegan (o cambian) desde la nube. La capa de datos
  // publica `pdi:datos-actualizados` en cada hidratacion (primera carga o
  // evento LIVE); aqui solo repintamos. En otra pestana, el storage event ya
  // no significa nada: el espejo local sobra cuando la nube es la unica fuente.
  let reprogramado;
  document.addEventListener("pdi:datos-actualizados", () => {
    clearTimeout(reprogramado);
    reprogramado = setTimeout(() => {
      montar();
    }, 120);
  });

  // El sello de frescura también cambia cuando la capa pierde o recupera la
  // conexión, no solo cuando llegan datos. La suscripción se engancha una vez
  // y espera a que la página esté lista para no pintar antes del acceso.
  try {
    window.PDI?.DB?.suscribirEstado?.((estado) => {
      if (!listo) return;
      if (document.body?.getAttribute("data-page") !== "dashboard") return;
      montar();
    });
  } catch {
    // Sin capa de datos no hay estado que suscribir.
  }
}

/** Dibuja lo propio de esta pagina. Es idempotente. */
function montar() {
  // El dashboard no muestra la bitácora. Pedirla aquí antes de pintar solo
  // retrasaba las cifras ~400 ms y las dejaba en "…". Se pinta en el acto con
  // los modelos en memoria; la bitácora sigue viva en /auditoria.
  const filtroSede = DashboardView._filtroSede || "all";
  DashboardView.render(BeneficiarioModel.getStats(filtroSede), AuditModel.getAll());
}

function iniciar() {
  // Engancha la reactividad antes de arrancar: la hidratación puede terminar
  // durante arrancarComun() y el evento no debe perderse.
  enlazar();

  // Acceso y chrome comun. Si devuelve null, PageGuard ya redirigio y no hay
  // nada mas que hacer en este documento.
  if (!arrancarComun()) return;

  listo = true;
  DashboardView.reiniciarEntrada();
  DashboardView.enlazarEventos(montar);
  montar();

  // Que redibujar cuando algo guarde en esta pagina, por ejemplo al dar de
  // alta a un usuario: antes era refreshAllViews(), que refrescaba las ocho
  // tablas; ahora solo la que esta a la vista.
  publicarRefresco(montar);

  console.log("[PDI] Dashboard General lista (dashboard.html).");
}



document.addEventListener("astro:page-load", () => {
  if (document.body && document.body.getAttribute("data-page") === "dashboard") {
    iniciar();
  }
});
