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

const UMBRAL_CIERRE = 80; // px de arrastre hacia abajo que cierran la hoja
const UMBRAL_VELOCIDAD = 0.45; // px/ms: un flick mas rapido que esto cierra
const INTERACTIVOS = "button, a, input, select, textarea, [role='button'], [contenteditable='true']";

/** El arrastre desde la cabecera solo se habilita en la variante móvil. */
function esMovil() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(max-width: 768px)").matches;
}

/** Cierre propio de cada hoja, para Escape. */
const cerradores = new WeakMap();

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
  cerradores.set(hoja, alCerrar || (() => telon?.classList.remove("open")));

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

  // Retorno de un arrastre corto. No puede heredar la entrada completa de la
  // hoja: en Android son 420 ms y devolver 40 px a ese ritmo se siente pastoso.
  const volver = (arrastre) => {
    if (!arrastre) {
      limpiar();
      return;
    }
    let hecho = false;
    const terminar = () => {
      if (hecho) return;
      hecho = true;
      hoja.removeEventListener("transitionend", terminar);
      if (!activo) limpiar();
    };
    hoja.style.transition = "transform 260ms var(--ease-out)";
    hoja.style.transform = "";
    hoja.addEventListener("transitionend", terminar);
    setTimeout(terminar, 320);
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
      volver(arrastre);
      if (velo && telon) {
        pintarVelo(1);
        setTimeout(() => telon.style.removeProperty(velo.variable), 320);
      }
    }
  };

  hoja.addEventListener("pointerdown", (evento) => {
    if (!abierta()) return;
    const asa = evento.target.closest(asaSelector);
    if (!asa) return;
    // Los controles del encabezado (sobre todo la X) no arrastran la hoja.
    if (evento.target.closest(INTERACTIVOS)) return;
    // Arrastrar desde la cabecera es una comodidad móvil; en el drawer de
    // escritorio solo el asa visible inicia el gesto.
    if (asa.classList.contains("modal-header") && !esMovil()) return;
    if (evento.pointerType === "mouse" && evento.button !== 0) return;

    if (evento.cancelable) evento.preventDefault();
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

  const mover = (evento) => {
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
  };

  hoja.addEventListener("pointermove", mover);
  hoja.addEventListener("pointerup", soltar);
  hoja.addEventListener("pointercancel", soltar);
  // Respaldo: si el puntero sale de la hoja y no llega el pointerup del
  // elemento, el gesto no puede quedarse congelado a medio arrastre.
  window.addEventListener("pointerup", soltar);
  window.addEventListener("pointercancel", soltar);
}

function engancharAsaDeModal(asa) {
  const caja = asa.closest(".modal-box");
  const telon = asa.closest(".modal-backdrop");
  if (!caja || !telon) return;

  conectarHoja({
    hoja: caja,
    // El asa grande y la cabecera arrastran; los controles de dentro se
    // excluyen en conectarHoja.
    asaSelector: ".sheet-grab, .modal-header",
    telon,
    alCerrar: () => {
      // El cierre por asa delega en la X de cada ficha: así se conserva el
      // borrador, se limpia el estado y se actualizan inert/aria-hidden.
      const cerrar = telon.querySelector(".btn-close-modal");
      if (cerrar) cerrar.click();
      else telon.classList.remove("open");
    },
  });
}

let escapeListo = false;

/** Escape cierra la hoja superior abierta. */
function conectarEscape() {
  if (escapeListo) return;
  escapeListo = true;
  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;
    const abiertos = Array.from(document.querySelectorAll(".modal-backdrop.drawer.open"));
    const abierto = abiertos[abiertos.length - 1];
    if (!abierto) return;
    const caja = abierto.querySelector(".modal-box");
    const cerrar = caja ? cerradores.get(caja) : null;
    if (typeof cerrar !== "function") return;
    evento.preventDefault();
    cerrar();
  });
}

let observadorFondo = null;
const observadosFondo = new WeakSet();

/** Bloquea el scroll de la página mientras haya una hoja abierta. */
function actualizarBloqueoFondo() {
  if (typeof document === "undefined" || !document.body) return;
  const abierta = Array.from(document.querySelectorAll(".modal-backdrop.drawer"))
    .some((modal) => modal.classList.contains("open"));
  document.body.classList.toggle("pdi-drawer-open", abierta);
  if (abierta) window.__pdiLenis?.stop?.();
  else window.__pdiLenis?.start?.();
}

function observarFondo() {
  if (typeof MutationObserver === "undefined") return;
  if (!observadorFondo) observadorFondo = new MutationObserver(actualizarBloqueoFondo);
  document.querySelectorAll(".modal-backdrop.drawer").forEach((modal) => {
    if (observadosFondo.has(modal)) return;
    observadosFondo.add(modal);
    observadorFondo.observe(modal, { attributes: true, attributeFilter: ["class"] });
  });
  actualizarBloqueoFondo();
}

export function iniciarSheets() {
  document.querySelectorAll(".modal-backdrop.drawer .sheet-grab").forEach(engancharAsaDeModal);
  conectarEscape();
  observarFondo();
}

// Los modales globales viajan con transition:persist: persisten entre
// páginas. Se repite el intento en cada navegación por si el DOM cambió; el
// dataset.sheetArrastreListo evita el doble enganche de la misma hoja.
iniciarSheets();
document.addEventListener("astro:page-load", iniciarSheets);
document.addEventListener("astro:after-swap", iniciarSheets);
