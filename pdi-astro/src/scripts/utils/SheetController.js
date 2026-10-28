// Controlador compartido del asa de las hojas inferiores.
//
// Lo usan dos familias:
//  - Los modales convertidos a drawer/bottom sheet (Lotes 0-3): el asa es
//    .sheet-grab y la hoja es .modal-box; la apertura y el cierre siguen
//    siendo la clase .open del backdrop, como en el resto de modales.
//  - El detalle de sedes (Lote 4): su asa es la cabecera de la hoja, que se
//    repinta con cada sede, y el telon tiene su propio velo que sigue al dedo.
//
// Núcleo común: arrastre 1:1, cierre por distancia o por flick, retorno
// elástico. La escucha va delegada sobre la hoja (no sobre el asa) porque la
// cabecera de sedes se reemplaza por innerHTML entre aperturas.

const UMBRAL_CIERRE = 90; // px de arrastre hacia abajo que cierran la hoja
const UMBRAL_VELOCIDAD = 0.55; // px/ms: un flick mas rapido que esto cierra

/**
 * Engancha el arrastre de una hoja por su asa.
 *
 * @param {object} opciones
 * @param {HTMLElement} opciones.hoja        Elemento que se desplaza.
 * @param {string}      opciones.asaSelector Selector del asa dentro de la hoja.
 * @param {HTMLElement|null} [opciones.telon] Capa que acompana el gesto.
 * @param {Function|null} [opciones.alCerrar] Cierre propio; por defecto quita
 *   la clase .open del telon.
 * @param {number} [opciones.umbral]          Px de arrastre que cierran.
 * @param {number} [opciones.umbralVelocidad] Flick (px/ms) que cierra.
 * @param {{variable: string, rango: number}|null} [opciones.velo] Velo que se
 *   desvanece con el arrastre (detalle de sedes).
 */
export function conectarHoja({
  hoja,
  asaSelector,
  telon = null,
  alCerrar = null,
  umbral = UMBRAL_CIERRE,
  umbralVelocidad = UMBRAL_VELOCIDAD,
  velo = null,
}) {
  if (!hoja || hoja.dataset.sheetArrastreListo) return;
  hoja.dataset.sheetArrastreListo = "1";

  const abierta = () => (telon ? telon.classList.contains("open") : hoja.classList.contains("open"));

  let activo = false;
  let yInicio = 0;
  let yAnterior = 0;
  let tAnterior = 0;
  let velocidad = 0;

  const pintarVelo = (valor) => {
    if (velo && telon) telon.style.setProperty(velo.variable, String(valor));
  };

  const limpiar = () => {
    hoja.style.transform = "";
    hoja.style.transition = "";
    delete hoja.dataset.sheetArrastre;
  };

  const cerrar = () => {
    const accion = alCerrar || (() => telon?.classList.remove("open"));
    if (velo && telon) {
      // La hoja termina su salida con el mismo gesto que traia el arrastre y
      // el velo se apaga con ella; el cierre real ocurre al acabar la salida.
      telon.classList.remove("is-dragging");
      pintarVelo(0);
      hoja.style.transition = "transform 240ms var(--ease-out)";
      hoja.style.transform = "translateY(105%)";
      setTimeout(() => {
        limpiar();
        accion();
      }, 240);
    } else {
      limpiar();
      accion();
    }
  };

  const soltar = () => {
    if (!activo) return;
    activo = false;

    const arrastre = Number(hoja.dataset.sheetArrastre || "0");
    const cerrarPorGesto = arrastre >= umbral || velocidad >= umbralVelocidad;
    telon?.classList.remove("is-dragging");

    if (!abierta()) {
      limpiar();
      return;
    }
    if (cerrarPorGesto) {
      cerrar();
    } else {
      limpiar();
      if (velo && telon) {
        pintarVelo(1);
        setTimeout(() => telon.style.removeProperty(velo.variable), 320);
      }
    }
  };

  hoja.addEventListener("pointerdown", (evento) => {
    if (!abierta()) return;
    if (!evento.target.closest(asaSelector)) return;
    if (evento.pointerType === "mouse" && evento.button !== 0) return;

    activo = true;
    yInicio = evento.clientY;
    yAnterior = evento.clientY;
    tAnterior = performance.now();
    velocidad = 0;
    delete hoja.dataset.sheetArrastre;
    hoja.style.transition = "none";
    telon?.classList.add("is-dragging");
    if (velo) pintarVelo(1);
    try {
      hoja.setPointerCapture(evento.pointerId);
    } catch { /* sin captura el arrastre sigue: buen fallback */ }
  });

  hoja.addEventListener("pointermove", (evento) => {
    if (!activo) return;
    const ahora = performance.now();
    const dt = ahora - tAnterior;
    if (dt > 0) velocidad = Math.max(0, (evento.clientY - yAnterior) / dt);
    yAnterior = evento.clientY;
    tAnterior = ahora;

    const dy = Math.max(0, evento.clientY - yInicio);
    hoja.dataset.sheetArrastre = String(dy);
    // Hacia arriba no hay gesto que completar: la hoja no se mueve.
    hoja.style.transform = dy > 0 ? `translateY(${dy}px)` : "";
    if (velo) pintarVelo(Math.max(0, 1 - dy / velo.rango));
  });

  hoja.addEventListener("pointerup", soltar);
  hoja.addEventListener("pointercancel", soltar);
}

function engancharAsaDeModal(asa) {
  const caja = asa.closest(".modal-box");
  const telon = asa.closest(".modal-backdrop");
  if (!caja || !telon) return;

  conectarHoja({
    hoja: caja,
    asaSelector: ".sheet-grab",
    telon,
    alCerrar: () => {
      // El cierre por asa delega en quien ya sabe cerrar cada ficha, para
      // conservar el borrador y el toast: mismo camino que pulsar la X.
      if (telon.id === "modalNuevoUsuario" && window.PDI?.ModalView) {
        window.PDI.ModalView.closeNuevoUsuario({ conservarBorrador: true });
      } else {
        telon.classList.remove("open");
      }
    },
  });
}

let listo = false;

export function iniciarSheets() {
  if (listo) return;
  const asas = document.querySelectorAll(".modal-backdrop.drawer .sheet-grab");
  if (!asas.length) return;
  listo = true;
  asas.forEach(engancharAsaDeModal);
}

// Los modales globales viajan con transition:persist: persisten entre
// paginas. Se repite el intento en cada navegacion por si el asa todavia no
// existia cuando el script cargo; el dataset.sheetArrastreListo evita el
// doble enganche.
iniciarSheets();
document.addEventListener("astro:page-load", iniciarSheets);
