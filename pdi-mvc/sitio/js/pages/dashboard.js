const sesionActiva = localStorage.getItem("pdi_sesion");

if (sesionActiva !== "activa") {
  window.location.replace("./index.html");
}

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
import { AuditModel } from '../models/AuditModel.js';
import { DashboardView } from '../views/DashboardView.js';
// El boton de exportar del panel invoca window.exportDataCSV, y ese puente
// resuelve por window.PDI. Antes AppController lo traia legacy-globals a las
// diez paginas; con 2 KB aqui basta.
import { AppController } from '../controllers/AppController.js';

let enlazado = false;

/** Engancha lo que debe ocurrir una sola vez por carga. */
function enlazar() {
  if (enlazado) return;
  enlazado = true;
}

/** Dibuja lo propio de esta pagina. Es idempotente. */
function montar() {
  DashboardView.render(BeneficiarioModel.getStats(), AuditModel.getAll());
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

  console.log("[PDI] Dashboard General lista (dashboard.html).");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar, { once: true });
} else {
  iniciar();
}

const btnLogout = document.getElementById("btnLogout");

if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    const sesionId = localStorage.getItem("pdi_sesion_id");

    if (sesionId) {
      try {
        await fetch("http://localhost:3001/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sesionId: sesionId
          })
        });
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    }

    localStorage.removeItem("pdi_sesion");
    localStorage.removeItem("pdi_proyecto");
    localStorage.removeItem("pdi_sesion_id");

    window.location.href = "./index.html";
  });
}
