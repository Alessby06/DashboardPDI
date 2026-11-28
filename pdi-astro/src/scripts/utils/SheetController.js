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

const UMBRAL_CIERRE = 75; // px de arrastre hacia abajo que cierran la hoja
const UMBRAL_VELOCIDAD = 0.35; // px/ms: un flick mas rapido que esto cierra
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
  let baseY = 0;
  let yInicio = 0;
  let yAnterior = 0;
  let tAnterior = 0;
  let velocidad = 0;
  let historial = [];
  let animacion = null;

  const raiz = document.documentElement;
  const estiloRaiz = getComputedStyle(raiz);
  const easeCierre = estiloRaiz.getPropertyValue("--sheet-exit-ease").trim()
    || "cubic-bezier(0.32, 0.72, 0, 1)";
  const easeVuelta = estiloRaiz.getPropertyValue("--sheet-ease").trim()
    || "cubic-bezier(0.32, 0.72, 0, 1)";
  const duracionMax = parseInt(estiloRaiz.getPropertyValue("--sheet-out"), 10) || 260;

  const pintarVelo = (valor) => {
    if (velo && telon) telon.style.setProperty(velo.variable, String(valor));
  };

  /** Desplazamiento visible actual: si la hoja venía entrando, el dedo debe
   * agarrarla donde está, no donde acabaría. */
  const transformActual = () => {
    const valor = getComputedStyle(hoja).transform;
    if (!valor || valor === "none") return 0;
    try { return new DOMMatrixReadOnly(valor).m42 || 0; } catch { return 0; }
  };

  const limpiar = () => {
    hoja.style.transform = "";
    hoja.style.transition = "";
    delete hoja.dataset.sheetArrastre;
  };

  const detenerAnimacion = () => {
    if (!animacion) return;
    try { animacion.cancel(); } catch { /* ya terminó */ }
    animacion = null;
  };

  /**
   * Si la hoja se vuelve a abrir mientras termina la salida, la animación de
   * cierre deja de aplicar: la persona ya pidió que vuelva. Se cancela antes
   * de pintar, así no se ve un fotograma fuera de sitio.
   */
  const telonDeEstado = telon || hoja;
  if (typeof MutationObserver === "function") {
    new MutationObserver(() => {
      if (!abierta()) return;
      detenerAnimacion();
      limpiar();
      if (telon) telon.style.removeProperty("visibility");
    }).observe(telonDeEstado, { attributes: true, attributeFilter: ["class"] });
  }

  /** Suelta con inercia, igual que la hoja de filtros: la duración sale de lo
   * que queda por recorrer y de la velocidad con la que soltó el dedo. */
  const soltarConInercia = (total, cerrarPorGesto) => {
    const accion = alCerrar || (() => telon?.classList.remove("open"));
    const alto = hoja.offsetHeight || hoja.getBoundingClientRect().height || 1;
    const destino = cerrarPorGesto ? alto * (velo ? 1.05 : 1) : 0;
    const distancia = Math.abs(destino - total);
    const rapidez = Math.max(0.35, Math.abs(velocidad));
    const duracion = Math.round(
      Math.min(duracionMax, Math.max(140, distancia / rapidez))
    );

    detenerAnimacion();
    animacion = hoja.animate(
      [
        { transform: `translateY(${total}px)` },
        { transform: `translateY(${destino}px)` }
      ],
      { duration: duracion, easing: cerrarPorGesto ? easeCierre : easeVuelta, fill: "forwards" }
    );

    if (cerrarPorGesto) {
      // El estado cerrado se aplica ya, no al terminar la animación. Antes el
      // velo seguía en `.open` durante toda la salida y se comía el primer
      // toque de quien volvía a abrir la hoja; parecía que los botones no
      // respondían durante un segundo. La animación que acaba de arrancar es
      // solo el movimiento visual. El velo se mantiene visible —sin recibir
      // toques, porque ya no tiene `.open`— hasta que la hoja termina de bajar.
      if (telon) telon.style.visibility = "visible";
      accion({ porGesto: true });
    }

    let terminado = false;
    const terminar = () => {
      if (terminado) return;
      terminado = true;
      limpiar();
      detenerAnimacion();
      if (cerrarPorGesto && telon) telon.style.removeProperty("visibility");
    };
    animacion.finished.then(terminar, () => { /* interrumpida por otro gesto */ });
    // Respaldo por si la pestaña se congela a mitad de la animación.
    setTimeout(() => { if (animacion) terminar(); }, duracion + 80);
  };

  const soltar = () => {
    if (!activo) return;
    activo = false;

    const arrastre = Number(hoja.dataset.sheetArrastre || "0");
    const visible = transformActual();
    const total = visible;

    // Velocidad media del último tramo, como en la hoja de filtros: el último
    // sample aislado puede ser un temblor del dedo.
    if (historial.length >= 2) {
      const ultimo = historial[historial.length - 1];
      const primero = historial[0];
      const dt = ultimo.t - primero.t;
      if (dt > 0) velocidad = (ultimo.y - primero.y) / dt;
    }

    const cerrarPorGesto = arrastre >= umbral || (arrastre > 0 && velocidad >= umbralVelocidad);
    telon?.classList.remove("is-dragging");

    if (!abierta()) {
      limpiar();
      return;
    }
    if (velo) {
      if (cerrarPorGesto) {
        pintarVelo(0);
      } else {
        pintarVelo(1);
        setTimeout(() => telon.style.removeProperty(velo.variable), 320);
      }
    }
    soltarConInercia(total, cerrarPorGesto);
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
    // Congela la hoja donde está: si venía entrando, agarrarla no debe saltarla
    // al destino. Después se cancela cualquier suelta que siguiera en curso.
    const visible = transformActual();
    detenerAnimacion();
    baseY = Math.max(0, visible);
    activo = true;
    yInicio = evento.clientY;
    yAnterior = evento.clientY;
    tAnterior = performance.now();
    historial = [{ y: yInicio, t: tAnterior }];
    velocidad = 0;
    delete hoja.dataset.sheetArrastre;
    hoja.style.transition = "none";
    hoja.style.transform = `translateY(${baseY}px)`;
    telon?.classList.add("is-dragging");
    if (velo) pintarVelo(Math.max(0, 1 - baseY / velo.rango));
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

    const dedo = evento.clientY - yInicio;
    let total = baseY + dedo;
    // Resistencia elástica logarítmica si se tira hacia arriba (damping natural)
    if (total < 0) {
      total = -Math.pow(Math.abs(total), 0.72) * 1.5;
    }
    hoja.dataset.sheetArrastre = String(dedo);
    hoja.style.transform = `translateY(${total}px)`;
    if (velo) pintarVelo(Math.max(0, Math.min(1, 1 - total / velo.rango)));

    historial.push({ y: evento.clientY, t: ahora });
    if (historial.length > 5) historial.shift();
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
    alCerrar: ({ porGesto = false } = {}) => {
      // El cierre por asa delega en la X de cada ficha: así se conserva el
      // borrador, se limpia el estado y se actualizan inert/aria-hidden.
      const cerrar = telon.querySelector(".btn-close-modal");
      if (cerrar) cerrar.click();
      else telon.classList.remove("open");
      // El cierre por gesto no debe dejar el anillo de foco en el botón que
      // abrió la hoja: el usuario viene de tocar, no de tabular. En Escape se
      // conserva el foco devuelto al disparador para usuarios de teclado.
      if (porGesto) {
        const foco = document.activeElement;
        if (foco instanceof HTMLElement && !telon.contains(foco)) foco.blur();
      }
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
    if (document.querySelector(".pdi-select.is-open")) return;
    if (document.getElementById("modalConfirmacion")?.classList.contains("open")) return;
    const abiertos = Array.from(document.querySelectorAll(".modal-backdrop.drawer.open"));
    const abierto = abiertos[abiertos.length - 1];
    if (!abierto) return;
    const caja = abierto.querySelector(".modal-box");
    const cerrar = caja ? cerradores.get(caja) : null;
    if (typeof cerrar !== "function") return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();
    cerrar();
  });
}

let fondoListo = false;

/**
 * En móvil, tocar el velo cierra la hoja. Se hace en captura para que el
 * cierre pase por la X canónica de cada ficha (borradores, inert, foco) y no
 * por el `remove("open")` suelto de cada vista. En escritorio el drawer
 * conserva su X y su comportamiento.
 */
function conectarFondo() {
  if (fondoListo) return;
  fondoListo = true;
  document.addEventListener("click", (evento) => {
    if (!esMovil()) return;
    const telon = evento.target.closest?.(".modal-backdrop.drawer");
    if (!telon || evento.target !== telon || !telon.classList.contains("open")) return;
    evento.preventDefault();
    evento.stopPropagation();
    const caja = telon.querySelector(".modal-box");
    const cerrar = caja ? cerradores.get(caja) : null;
    if (typeof cerrar === "function") {
      cerrar({ porGesto: true });
      return;
    }
    const x = telon.querySelector(".btn-close-modal");
    if (x) x.click();
    else telon.classList.remove("open");
  }, true);
}

let cierresListo = false;

/**
 * La X desaparece del móvil: el cierre táctil es el velo o el arrastre, y el
 * de teclado, Escape. Se oculta con estilo inline para ganar a las reglas de
 * cada ficha sin añadir un `!important` al presupuesto de la hoja.
 */
function sincronizarCierres() {
  const movil = esMovil();
  document.querySelectorAll(".modal-backdrop.drawer .btn-close-modal").forEach((boton) => {
    if (movil) boton.style.display = "none";
    else boton.style.removeProperty("display");
  });
}

function conectarCierres() {
  if (cierresListo) {
    sincronizarCierres();
    return;
  }
  cierresListo = true;
  const mq = window.matchMedia("(max-width: 768px)");
  if (mq.addEventListener) mq.addEventListener("change", sincronizarCierres);
  else mq.addListener(sincronizarCierres);
  sincronizarCierres();
}

let observadorFondo = null;
const observadosFondo = new WeakSet();

/** Bloquea el scroll de la página mientras haya una hoja abierta. */
function actualizarBloqueoFondo() {
  if (typeof document === "undefined" || !document.body) return;
  const abierta = Array.from(document.querySelectorAll(".modal-backdrop.drawer"))
    .some((modal) => modal.classList.contains("open"));
  // Solo la clase: el telón cubre la pantalla y el body no necesita overflow
  // oculto. Cambiarlo al cerrar repintaba la tabla y se veía un parpadeo.
  document.body.classList.toggle("pdi-drawer-open", abierta);
  window.__pdiScroll?.syncLock?.();
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

let tecladoListo = false;
let temporizadorTeclado = null;

/**
 * Cuando el teclado reduce el viewport, el campo enfocado puede quedar por
 * debajo. Se ajusta el scroll del contenedor más cercano (cuerpo de la hoja,
 * filtros o contenido) en vez de mover la página entera.
 */
function ajustarCampoVisible() {
  const activo = document.activeElement;
  if (!(activo instanceof HTMLElement)) return;
  if (!activo.matches("input, textarea, select, [contenteditable='true']")) return;

  const vv = window.visualViewport;
  const limite = vv ? vv.height : window.innerHeight;
  const r = activo.getBoundingClientRect();
  if (r.bottom <= limite - 12 && r.top >= 12) return;

  const scroller = activo.closest(".modal-body, .audit-filters-body, .sedes-detail-column, .content-viewport");
  if (!scroller) {
    activo.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  const sr = scroller.getBoundingClientRect();
  const bordeInferior = Math.min(limite, sr.bottom) - 16;
  const delta = r.bottom - bordeInferior;
  if (delta > 0) scroller.scrollTop += delta;
}

function programarAjusteTeclado() {
  clearTimeout(temporizadorTeclado);
  temporizadorTeclado = setTimeout(ajustarCampoVisible, 120);
}

function conectarTeclado() {
  if (tecladoListo) return;
  tecladoListo = true;
  document.addEventListener("focusin", programarAjusteTeclado);
  window.addEventListener("resize", programarAjusteTeclado);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", programarAjusteTeclado);
    window.visualViewport.addEventListener("scroll", programarAjusteTeclado);
  }
}

export function iniciarSheets() {
  document.querySelectorAll(".modal-backdrop.drawer .sheet-grab").forEach(engancharAsaDeModal);
  conectarEscape();
  conectarFondo();
  conectarCierres();
  observarFondo();
  conectarTeclado();
}

// Los modales globales viajan con transition:persist: persisten entre
// páginas. Se repite el intento en cada navegación por si el DOM cambió; el
// dataset.sheetArrastreListo evita el doble enganche de la misma hoja.
iniciarSheets();
document.addEventListener("astro:page-load", iniciarSheets);
document.addEventListener("astro:after-swap", iniciarSheets);
