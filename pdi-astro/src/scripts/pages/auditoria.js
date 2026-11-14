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
import { fetchBitacora, LIMITE_BITACORA } from '../core/db.js';
import { guardarCache, leerCache } from '../core/snapshot.js';
import { AuditModel } from '../models/AuditModel.js';
import { AuditView } from '../views/AuditView.js';
import { mismaBitacora } from '../utils/bitacora.js';
// El boton de confirmar la exportacion vive en el chrome comun
// (el chrome comun, que ahora va en linea en cada HTML) y su puente resuelve
// por window.PDI, asi que el
// controlador tiene que estar cargado aqui. Antes lo traia legacy-globals a
// todas las paginas; con 2 KB en las que lo necesitan basta.
import { AppController } from '../controllers/AppController.js';

/** Engancha el botón de la carga ampliada. El documento se reemplaza en cada
 *  navegación, así que el guardia vive en el propio botón y no en el módulo. */
function enlazar() {
  // La paginación de la tabla es local; este botón pide más eventos al
  // servidor solo cuando el total conocido supera lo cargado.
  const mas = document.getElementById("btnAuditCargarMas");
  if (!mas || mas.dataset.enlazado === "1") return;
  mas.dataset.enlazado = "1";
  mas.addEventListener("click", () => { void cargarBitacora({ ampliar: true }); });
}

/** Dibuja lo propio de esta pagina. Es idempotente. */
function montar() {
  // Si la bitácora ya viajó en esta sesión, se pinta de inmediato; el HTML
  // trae una fila "Cargando bitácora…" para no confundir la espera con una
  // tabla sin registros.
  const enMemoria = AuditModel.getAll();
  if (enMemoria.length) {
    AuditView._auditTotalServidor = Math.max(totalBitacora, enMemoria.length);
    AuditView.renderAuditLogs(enMemoria);
  } else {
    const cache = leerCache("bitacora", { ttlMs: 10 * 60 * 1000 });
    if (Array.isArray(cache) && cache.length) {
      totalBitacora = Math.max(totalBitacora, cache.length);
      AuditView._auditTotalServidor = totalBitacora;
      AuditModel.aplicarDatos(cache);
      AuditView.renderAuditLogs(cache);
    }
  }
  cargarBitacora();
}

let cargandoBitacora = false;
let totalBitacora = 0;
let limiteBitacora = LIMITE_BITACORA;

async function cargarBitacora({ ampliar = false } = {}) {
  if (cargandoBitacora) return;
  cargandoBitacora = true;
  try {
    // «Cargar más» vuelve a pedir la lista completa ampliada en lugar de
    // paginar por offset: los ids visibles se numeran por posición, y así no
    // se duplican al mezclar dos páginas.
    limiteBitacora = ampliar
      ? Math.min(limiteBitacora + LIMITE_BITACORA, 1000)
      : LIMITE_BITACORA;
    // La bitácora ya no viaja en la hidratación clínica: se pide al servidor,
    // que es el único que puede abrir el namespace de auditoría.
    const { logs, total } = await fetchBitacora({ limit: limiteBitacora });
    totalBitacora = total;
    AuditView._auditTotalServidor = totalBitacora;
    const actuales = AuditModel.getAll();
    const teniaCache = actuales.length > 0;
    // Si la copia ya muestra exactamente lo mismo, no se repinta: reemplazar
    // la tabla reinicia las cifras y produce el parpadeo que se quiere quitar.
    const cambio = !mismaBitacora(actuales, logs);
    const hayMas = totalBitacora > actuales.length;
    // Un fallo de red devuelve [] (fetchBitacora lo absorbe). Si ya había una
    // copia en pantalla, no se borra: se conserva y la próxima vuelta reintenta.
    if (!teniaCache || (logs.length && (cambio || hayMas))) {
      AuditModel.aplicarDatos(logs);
      AuditView.renderAuditLogs(logs);
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