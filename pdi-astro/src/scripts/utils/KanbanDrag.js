// Arrastre de casos entre columnas del tablero Kanban (solo escritorio).
//
// Reglas del gesto:
//  - Un pointerdown sobre una tarjeta no arrastra hasta superar 6 px: por
//    debajo de ese umbral sigue siendo un clic que abre la ficha.
//  - Solo se engancha con puntero fino y viewport >= 769 px. En movil el
//    gesto nativo es el scroll y las acciones viven en los botones.
//  - Al levantar la tarjeta sale del flujo: los casos de su columna suben y
//    ocupan su hueco. Al entrar en un carril valido se abre un hueco del mismo
//    alto en el punto donde caeria, y los casos de ese carril bajan. Si el
//    puntero vuelve al carril de origen, el hueco viaja con el.
//  - Solo vale el carril de origen (volver) o una fase contigua. Nunca si la
//    tarjeta tiene una solicitud de cambio pendiente (data-bloqueada="1").
//  - Al soltar en otra fase se llama exactamente a SocialController.moverCaso(),
//    el mismo camino que el boton: Coordinacion mueve y re-renderiza; el rol
//    social abre el modal de solicitud. La vista nunca escribe la etapa.
//
// Coreografia sin desfases:
//  - Un unico bucle rAF mueve el ghost, decide el carril y coloca el hueco.
//  - Cada vez que el hueco cambia de sitio se hace FLIP sobre las tarjetas
//    afectadas y se cancelan sus animaciones anteriores: una sola animacion
//    por nodo y ninguna capa acumulada.
//  - Al soltar se limpia todo antes de delegar en el controlador; el render
//    que este hace se aprovecha para un FLIP desde el punto del drop.
//  - Con prefers-reduced-motion no hay reflujo ni FLIP, solo el cambio final.

const ETAPAS = ["pendiente", "evaluacion", "canalizado", "cerrado"];
const UMBRAL_ARRASTRE = 6;
const UMBRAL_AUTOSCROLL = 64;
const VELOCIDAD_AUTOSCROLL = 14;
const DURACION_REFLUJO = 190;

const menosMovimiento = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const escritorioConPunteroFino = () =>
  typeof window !== "undefined" &&
  window.innerWidth >= 769 &&
  window.matchMedia &&
  window.matchMedia("(pointer: fine)").matches;

let listo = false;
let pendiente = null;
let gesto = null;
let ghost = null;
let tarjeta = null;
let tablero = null;
let slot = null;
let slotCarril = null;
let slotIndice = -1;
let cardAlto = 0;
let destinoActual = null;
let raf = 0;
let xPunta = 0;
let yPunta = 0;
let offsetX = 0;
let offsetY = 0;

function avisar(mensaje) {
  if (typeof window.showToast === "function") {
    window.showToast(mensaje, "info");
  }
}

function limpiarSeleccion() {
  try {
    const seleccion = window.getSelection && window.getSelection();
    if (seleccion && seleccion.rangeCount) seleccion.removeAllRanges();
  } catch { /* sin seleccion activa */ }
}

function limpiarCarriles() {
  document
    .querySelectorAll(".kanban-col.is-drop-target, .kanban-col.is-drop-invalida")
    .forEach((col) => col.classList.remove("is-drop-target", "is-drop-invalida"));
  destinoActual = null;
}

function tarjetasVisibles() {
  return Array.from(document.querySelectorAll(".kanban-col-body > .kanban-card")).filter(
    (card) => card !== tarjeta && card.offsetParent !== null,
  );
}

/** Instantanea de posiciones para el FLIP del reflujo. */
function congelarPosiciones() {
  const posiciones = new Map();
  for (const card of tarjetasVisibles()) {
    posiciones.set(card, card.getBoundingClientRect());
  }
  return posiciones;
}

/** Anima cada tarjeta desde su posicion anterior a la actual. */
function animarReflujo(posiciones) {
  if (menosMovimiento()) return;
  for (const [card, antes] of posiciones) {
    if (!card.isConnected) continue;
    card.getAnimations().forEach((animacion) => animacion.cancel());
    const ahora = card.getBoundingClientRect();
    const dx = antes.left - ahora.left;
    const dy = antes.top - ahora.top;
    if (!dx && !dy) continue;
    card.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
      { duration: DURACION_REFLUJO, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  }
}

function quitarSlot() {
  if (!slot || !slot.isConnected) {
    slotCarril = null;
    slotIndice = -1;
    return;
  }
  const posiciones = congelarPosiciones();
  slot.remove();
  slotCarril = null;
  slotIndice = -1;
  animarReflujo(posiciones);
}

function indiceDeInsercion(cuerpo) {
  const tarjetas = Array.from(cuerpo.children).filter(
    (nodo) => nodo.classList.contains("kanban-card") && nodo !== tarjeta,
  );
  for (let i = 0; i < tarjetas.length; i += 1) {
    const rect = tarjetas[i].getBoundingClientRect();
    if (yPunta < rect.top + rect.height / 2) return i;
  }
  return tarjetas.length;
}

function colocarSlot(carril) {
  const cuerpo = carril.querySelector(".kanban-col-body");
  if (!cuerpo) return;

  const indice = indiceDeInsercion(cuerpo);
  if (slotCarril === carril && slotIndice === indice && slot && slot.isConnected) return;

  const posiciones = congelarPosiciones();
  const tarjetas = Array.from(cuerpo.children).filter(
    (nodo) => nodo.classList.contains("kanban-card") && nodo !== tarjeta,
  );
  cuerpo.insertBefore(slot, tarjetas[indice] || null);
  slotCarril = carril;
  slotIndice = indice;
  animarReflujo(posiciones);
}

function soltarListenersDeGesto() {
  window.removeEventListener("pointermove", alMover, true);
  window.removeEventListener("pointerup", alSoltar, true);
  window.removeEventListener("pointercancel", alCancelar, true);
  window.removeEventListener("keydown", alTeclear, true);
  window.removeEventListener("blur", alCancelar);
  document.removeEventListener("visibilitychange", alCambiarVisibilidad);
}

function terminarGesto({ conservarTarjetaOculta = false } = {}) {
  cancelAnimationFrame(raf);
  raf = 0;
  quitarSlot();
  limpiarCarriles();
  soltarListenersDeGesto();

  if (ghost) {
    ghost.remove();
    ghost = null;
  }

  const card = tarjeta;
  tarjeta = null;
  tablero = null;
  gesto = null;
  pendiente = null;
  slot = null;
  cardAlto = 0;

  document.body.classList.remove("kanban-drag-activo");

  if (card) {
    if (conservarTarjetaOculta) {
      // El render del controlador va a sustituirla; si por lo que sea no
      // llega, se restaura en el siguiente frame para no dejarla invisible.
      requestAnimationFrame(() => {
        if (card.isConnected) card.classList.remove("is-dragging");
      });
    } else {
      card.classList.remove("is-dragging");
    }
  }

  // Si llego un re-render mientras el dedo sostenia la tarjeta, se aplica
  // ahora, con el DOM en reposo.
  const vista = window.PDI?.SocialKanbanView;
  if (vista && vista._renderPendiente) {
    vista._renderPendiente = false;
    vista.renderKanban();
  }
}

function alTeclear(evento) {
  if (evento.key === "Escape" && (gesto || pendiente)) {
    evento.preventDefault();
    terminarGesto();
  }
}

function alCambiarVisibilidad() {
  if (document.hidden && (gesto || pendiente)) terminarGesto();
}

function alCancelar() {
  if (pendiente || gesto) terminarGesto();
}

function hitTest() {
  const bajo = document.elementFromPoint(xPunta, yPunta);
  return bajo ? bajo.closest(".kanban-col") : null;
}

function etapaDeCarril(carril) {
  return carril ? carril.getAttribute("data-col-stage") : null;
}

function esFaseValida(etapaDestino) {
  const origen = tarjeta ? tarjeta.dataset.etapa : null;
  if (!origen || !etapaDestino) return false;
  if (origen === etapaDestino) return true; // volver al carril de origen
  const iOrigen = ETAPAS.indexOf(origen);
  const iDestino = ETAPAS.indexOf(etapaDestino);
  if (iOrigen < 0 || iDestino < 0) return false;
  return Math.abs(iOrigen - iDestino) === 1;
}

function actualizarDestino() {
  const carril = hitTest();
  if (!carril) {
    quitarSlot();
    limpiarCarriles();
    return;
  }

  if (carril !== destinoActual) {
    limpiarCarriles();
    destinoActual = carril;
  }

  const valido = esFaseValida(etapaDeCarril(carril));
  carril.classList.toggle("is-drop-target", valido);
  carril.classList.toggle("is-drop-invalida", !valido);

  if (valido) {
    colocarSlot(carril);
  } else {
    quitarSlot();
  }
}

function frame() {
  if (!ghost) return;

  const rectTablero = tablero.getBoundingClientRect();
  if (xPunta < rectTablero.left + UMBRAL_AUTOSCROLL) {
    tablero.scrollLeft -= VELOCIDAD_AUTOSCROLL;
  } else if (xPunta > rectTablero.right - UMBRAL_AUTOSCROLL) {
    tablero.scrollLeft += VELOCIDAD_AUTOSCROLL;
  }

  ghost.style.transform = `translate3d(${xPunta - offsetX}px, ${yPunta - offsetY}px, 0)`;
  actualizarDestino();
  raf = requestAnimationFrame(frame);
}

function iniciarArrastre(evento) {
  const rect = tarjeta.getBoundingClientRect();
  offsetX = pendiente.startX - rect.left;
  offsetY = pendiente.startY - rect.top;
  xPunta = evento.clientX;
  yPunta = evento.clientY;
  cardAlto = rect.height;

  try {
    tarjeta.setPointerCapture(evento.pointerId);
  } catch { /* el gesto sigue con los listeners de window */ }

  ghost = tarjeta.cloneNode(true);
  ghost.classList.add("kanban-drag-ghost");
  ghost.classList.remove("is-dragging");
  ghost.removeAttribute("id");
  ghost.removeAttribute("onclick");
  ghost.setAttribute("aria-hidden", "true");
  ghost.querySelectorAll("[id]").forEach((nodo) => nodo.removeAttribute("id"));
  ghost.querySelectorAll("a, button").forEach((nodo) => nodo.setAttribute("tabindex", "-1"));
  ghost.style.width = `${rect.width}px`;
  ghost.style.left = "0";
  ghost.style.top = "0";
  ghost.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
  document.body.appendChild(ghost);

  slot = document.createElement("div");
  slot.className = "kanban-drop-slot";
  slot.setAttribute("aria-hidden", "true");
  slot.style.height = `${cardAlto}px`;

  // La tarjeta sale del flujo Y de la seleccion de texto. Los casos de su
  // columna suben a ocupar el hueco con el mismo FLIP del reflujo.
  const posiciones = congelarPosiciones();
  tarjeta.classList.add("is-dragging");
  animarReflujo(posiciones);
  document.body.classList.add("kanban-drag-activo");
  limpiarSeleccion();

  gesto = { id: tarjeta.dataset.casoId, origen: tarjeta.dataset.etapa };

  window.addEventListener("keydown", alTeclear, true);
  window.addEventListener("blur", alCancelar);
  document.addEventListener("visibilitychange", alCambiarVisibilidad);
  raf = requestAnimationFrame(frame);
}

function alMover(evento) {
  if (!pendiente || !tarjeta) return;

  xPunta = evento.clientX;
  yPunta = evento.clientY;

  if (!ghost) {
    const dx = xPunta - pendiente.startX;
    const dy = yPunta - pendiente.startY;
    if (Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;
    if (evento.cancelable) evento.preventDefault();
    iniciarArrastre(evento);
    return;
  }

  if (evento.cancelable) evento.preventDefault();
}

function flipADestino(id, etapaDestino, rectSalida) {
  if (menosMovimiento()) return;

  requestAnimationFrame(() => {
    const nueva = Array.from(document.querySelectorAll(".kanban-card")).find(
      (card) => card.dataset.casoId === String(id) && card.dataset.etapa === etapaDestino,
    );
    if (!nueva) return;

    nueva.getAnimations().forEach((animacion) => animacion.cancel());

    const rectLlegada = nueva.getBoundingClientRect();
    const dx = rectSalida.left - rectLlegada.left;
    const dy = rectSalida.top - rectLlegada.top;
    if (!dx && !dy) return;

    nueva.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)`, opacity: 0.85 },
        { transform: "translate(0, 0)", opacity: 1 },
      ],
      { duration: 220, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  });
}

function sacudir(card) {
  if (!card || menosMovimiento()) return;
  card.classList.add("is-drop-invalida");
  const quitar = () => card.classList.remove("is-drop-invalida");
  card.addEventListener("animationend", quitar, { once: true });
  setTimeout(quitar, 220);
}

/** Un click que nace de un arrastre no debe abrir la ficha. Solo se bloquea
 *  dentro del tablero: si el gesto abre un modal, sus botones responden. */
function suprimirClickSiguiente() {
  const suprimir = (evento) => {
    const enTablero = evento.target instanceof Element && evento.target.closest(".kanban-board");
    if (!enTablero) return;
    evento.preventDefault();
    evento.stopPropagation();
  };
  document.addEventListener("click", suprimir, { capture: true });
  setTimeout(() => {
    document.removeEventListener("click", suprimir, { capture: true });
  }, 400);
}

function alSoltar(evento) {
  if (!pendiente) return;
  xPunta = evento.clientX;
  yPunta = evento.clientY;

  if (!ghost) {
    terminarGesto();
    return;
  }

  const carril = hitTest();
  const etapaDestino = etapaDeCarril(carril);
  const origen = tarjeta ? tarjeta.dataset.etapa : null;
  const esMismaFase = Boolean(etapaDestino) && etapaDestino === origen;
  const esContigua = Boolean(etapaDestino) && esFaseValida(etapaDestino) && !esMismaFase;
  const rectSalida = ghost.getBoundingClientRect();
  const id = tarjeta ? tarjeta.dataset.casoId : null;
  const cardOriginal = tarjeta;

  if (esMismaFase) {
    // Volver al carril de origen no pide autorizacion: solo se reacomoda.
    terminarGesto();
    suprimirClickSiguiente();
    // terminarGesto dejo la tarjeta visible; se anima desde el punto del drop.
    if (cardOriginal) {
      requestAnimationFrame(() => {
        if (!cardOriginal.isConnected) return;
        const destino = cardOriginal.getBoundingClientRect();
        const dx = rectSalida.left - destino.left;
        const dy = rectSalida.top - destino.top;
        if (!dx && !dy) return;
        cardOriginal.getAnimations().forEach((animacion) => animacion.cancel());
        cardOriginal.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
          { duration: 220, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        );
      });
    }
    return;
  }

  if (!esContigua) {
    terminarGesto();
    suprimirClickSiguiente();
    if (carril && etapaDestino) {
      avisar("Solo puedes mover el caso a la fase anterior o siguiente.");
    }
    sacudir(cardOriginal);
    return;
  }

  const controlador = window.PDI?.SocialController || (window.app && window.app.socialController);
  if (!controlador || typeof controlador.moverCaso !== "function") {
    terminarGesto();
    return;
  }

  // Coordinacion/Admin mueven de inmediato: la tarjeta vieja se oculta hasta
  // que el render la sustituya. El rol social solo abre una solicitud, asi
  // que su tarjeta se revela ya (no hay nueva tarjeta que la reemplace).
  let rol = "coord";
  try {
    rol = localStorage.getItem("pdi_active_role") || "coord";
  } catch { /* sin storage: se asume coordinacion */ }
  const mueveInmediato = rol === "coord" || rol === "admin";

  terminarGesto({ conservarTarjetaOculta: mueveInmediato });
  suprimirClickSiguiente();
  controlador.moverCaso(id, etapaDestino);
  flipADestino(id, etapaDestino, rectSalida);
}

function alPresionar(evento) {
  if (!escritorioConPunteroFino()) return;
  if (evento.pointerType === "touch" || (evento.pointerType === "mouse" && evento.button !== 0)) return;

  const card = evento.target.closest(".kanban-card");
  if (!card) return;
  if (!card.closest(".kanban-board")) return;
  if (evento.target.closest("button, a, input, select, textarea")) return;
  if (card.dataset.bloqueada === "1") return;

  pendiente = {
    card,
    startX: evento.clientX,
    startY: evento.clientY,
  };
  tarjeta = card;
  tablero = card.closest(".kanban-board");

  window.addEventListener("pointermove", alMover, true);
  window.addEventListener("pointerup", alSoltar, true);
  window.addEventListener("pointercancel", alCancelar, true);
}

export const KanbanDrag = {
  iniciar() {
    if (listo) return;
    document.addEventListener("pointerdown", alPresionar, { passive: true });
    listo = true;
  },

  arrastrando() {
    return Boolean(gesto);
  },
};

/** El navegador no debe iniciar su propio "drag" de texto: secuestra el gesto
 *  y cancela nuestro arrastre (era la causa de que el ghost no llegara a
 *  verse). Se engancha una sola vez sobre el tablero. */
function evitarDragNativo(evento) {
  const enTablero = evento.target instanceof Element && evento.target.closest(".kanban-board");
  if (enTablero && evento.target.closest(".kanban-card")) evento.preventDefault();
}

KanbanDrag.iniciar();
document.addEventListener("dragstart", evitarDragNativo, { capture: true });
document.addEventListener("astro:page-load", () => KanbanDrag.iniciar());
