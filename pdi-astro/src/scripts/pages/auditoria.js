// ===========================================================================
//  Historial de Cambios - Punto de entrada de auditoria.html
// ===========================================================================
//  Bitacora de trazabilidad con facetas por accion, rol, estado y fecha.
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
import { fetchBitacora } from '../core/db.js';
import { guardarCache, leerCache } from '../core/snapshot.js';
import { AuditModel } from '../models/AuditModel.js';
import { DashboardView } from '../views/DashboardView.js';
// El boton de confirmar la exportacion vive en el chrome comun
// (el chrome comun, que ahora va en linea en cada HTML) y su puente resuelve
// por window.PDI, asi que el
// controlador tiene que estar cargado aqui. Antes lo traia legacy-globals a
// todas las paginas; con 2 KB en las que lo necesitan basta.
import { AppController } from '../controllers/AppController.js';

let enlazado = false;

/** Engancha lo que debe ocurrir una sola vez por carga. */
function enlazar() {
  if (enlazado) return;
  enlazado = true;
}

/** Dibuja lo propio de esta pagina. Es idempotente. */
function montar() {
  // Si la bitácora ya viajó en esta sesión, se pinta de inmediato; el HTML
  // trae una fila "Cargando bitácora…" para no confundir la espera con una
  // tabla sin registros.
  const enMemoria = AuditModel.getAll();
  if (enMemoria.length) {
    DashboardView.renderAuditLogs(enMemoria);
  } else {
    const cache = leerCache("bitacora", { ttlMs: 10 * 60 * 1000 });
    if (Array.isArray(cache) && cache.length) {
      AuditModel.aplicarDatos(cache);
      DashboardView.renderAuditLogs(cache);
    }
  }
  cargarBitacora();
}

let cargandoBitacora = false;

async function cargarBitacora() {
  if (cargandoBitacora) return;
  cargandoBitacora = true;
  try {
    // La bitácora ya no viaja en la hidratación clínica: se pide al servidor,
    // que es el único que puede abrir el namespace de auditoría.
    const logs = await fetchBitacora();
    const teniaCache = AuditModel.getAll().length > 0;
    // Un fallo de red devuelve [] (fetchBitacora lo absorbe). Si ya había una
    // copia en pantalla, no se borra: se conserva y la próxima vuelta reintenta.
    if (logs.length || !teniaCache) {
      AuditModel.aplicarDatos(logs);
      DashboardView.renderAuditLogs(AuditModel.getAll());
    }
    if (logs.length) {
      guardarCache("bitacora", logs, { ttlMs: 10 * 60 * 1000, maxBytes: 2_000_000 });
    }
  } catch (e) {
    // Sin respuesta no se miente con un "sin registros": se dice qué pasó.
    pintarAvisoBitacora("No se pudo cargar la bitácora. Vuelve a intentarlo.");
  } finally {
    cargandoBitacora = false;
  }
}

function pintarAvisoBitacora(mensaje) {
  const tbody = document.getElementById("tbodyAuditLogs");
  const movil = document.getElementById("mobileCardsAuditoria");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px; color:var(--text-dim);">${mensaje}</td>
      </tr>
    `;
  }
  if (movil) {
    movil.innerHTML = `
      <div style="text-align:center; padding:32px; color:var(--text-dim); background:var(--surface-1); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
        ${mensaje}
      </div>
    `;
  }
}

function iniciar() {
  // Acceso y chrome comun. Si devuelve null, PageGuard ya redirigio y no hay
  // nada mas que hacer en este documento.
  if (!arrancarComun()) return;

  enlazar();
  montar();

  // Que redibujar cuando algo guarde en esta pagina, por ejemplo al dar de
  // alta a un usuario: antes era refreshAllViews(), que refrescaba las ocho
  // tablas; ahora solo la que esta a la vista.
  publicarRefresco(montar);

  console.log("[PDI] Historial de Cambios lista (auditoria.html).");
}



document.addEventListener("astro:page-load", () => {
  if (document.body && document.body.getAttribute("data-page") === "auditoria") {
    iniciar();
  }
});