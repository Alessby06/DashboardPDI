// Arrastre de casos entre columnas del tablero Kanban (solo escritorio).
//
// Reglas del gesto:
//  - Un pointerdown sobre una tarjeta no arrastra hasta superar 6 px: por
//    debajo de ese umbral sigue siendo un clic que abre la ficha.
//  - Solo se engancha con puntero fino y viewport >= 769 px. En movil el
//    gesto nativo es el scroll y las acciones viven en los botones.
//  - Solo se puede soltar en la fase anterior o siguiente (lo mismo que
//    ofrecen los botones de la tarjeta) y nunca si hay una solicitud de
//    cambio pendiente (data-bloqueada="1").
//  - Al soltar se llama exactamente a SocialController.moverCaso(), el mismo
//    camino que el boton: Coordinacion mueve y re-renderiza; el rol social
//    abre el modal de solicitud. La vista nunca escribe la etapa por su cuenta.
//
// Coreografia sin desfases:
//  - Un unico bucle rAF mueve el ghost y decide el carril bajo el puntero.
//  - Antes de delegar la accion se limpia todo (ghost, clases, listeners).
//  - El re-render que hace el controlador se aprovecha para un FLIP: la
//    tarjeta nueva nace en la posicion del drop y viaja a su hueco final con
//    Web Animations. Se cancelan animaciones previas del nodo para que no se
//    sumen. Con prefers-reduced-motion no hay FLIP ni sacudida.

const ETAPAS = ["pendiente", "evaluacion", "canalizado", "cerrado"];
const UMBRAL_ARRASTRE = 6;
const UMBRAL_AUTOSCROLL = 64;
const VELOCIDAD_AUTOSCROLL = 14;

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

function limpiarCarril() {
  document.querySelectorAll(".kanban-col.is-drop-target, .kanban-col.is-drop-invalida")
    .forEach((col) => col.classList.remove("is-drop-target", "is-drop-invalida"));
  destinoActual = null;
}

function soltarListenersDeGesto() {
  window.removeEventListener("pointermove", alMover, true);
  window.removeEventListener("pointerup", alSoltar, true);
  window.removeEventListener("pointercancel", alCancelar, true);
  window.removeEventListener("keydown", alTeclear, true);
  window.removeEventListener("blur", alCancelar);
  document.removeEventListener("visibilitychange", alCambiarVisibilidad);
}

function terminarGesto() {
  cancelAnimationFrame(raf);
  raf = 0;
  limpiarCarril();
  soltarListenersDeGesto();

  if (ghost) {
    ghost.remove();
    ghost = null;
  }
  if (tarjeta) {
    tarjeta.classList.remove("is-dragging");
    tarjeta.style.transition = "";
    tarjeta.style.willChange = "";
  }
  document.body.classList.remove("kanban-drag-activo");

  tarjeta = null;
  tablero = null;
  gesto = null;
  pendiente = null;

  // Si llegó un re-render mientras el dedo sostenía la tarjeta, se aplica
  // ahora, con el DOM en reposo.
  const vista = window.PDI?.SocialKanbanView;
  if (vista && vista._renderPendiente) {
    vista._renderPendiente = false;
    vista.renderKanban();
  }
}

function alTeclear(evento) {
  if (evento.key === "Escape" && gesto) {
    evento.preventDefault();
    terminarGesto();
  }
}

function alCambiarVisibilidad() {
  if (document.hidden && gesto) terminarGesto();
}

function alCancelar() {
  if (pendiente || gesto) terminarGesto();
}

function hitTest() {
  const bajo = document.elementFromPoint(xPunta, yPunta);
  return bajo ? bajo.closest(".kanban-col") : null;
}

function marcarDestino() {
  const col = hitTest();
  if (col === destinoActual && col) return;

  limpiarCarril();
  if (!col) return;

  const etapa = col.getAttribute("data-col-stage");
  const valido = Boolean(etapa) && esMovimientoValido(etapa);
  col.classList.add(valido ? "is-drop-target" : "is-drop-invalida");
  destinoActual = col;
}

function esMovimientoValido(etapaDestino) {
  if (!tarjeta || !etapaDestino) return false;
  if (tarjeta.dataset.bloqueada === "1") return false;
  const origen = tarjeta.dataset.etapa;
  const iOrigen = ETAPAS.indexOf(origen);
  const iDestino = ETAPAS.indexOf(etapaDestino);
  if (iOrigen < 0 || iDestino < 0 || iOrigen === iDestino) return false;
  return Math.abs(iOrigen - iDestino) === 1;
}

function frame() {
  if (!ghost) return;

  // Auto-scroll horizontal del tablero cuando el puntero se acerca al borde.
  const rectTablero = tablero.getBoundingClientRect();
  if (xPunta < rectTablero.left + UMBRAL_AUTOSCROLL) {
    tablero.scrollLeft -= VELOCIDAD_AUTOSCROLL;
  } else if (xPunta > rectTablero.right - UMBRAL_AUTOSCROLL) {
    tablero.scrollLeft += VELOCIDAD_AUTOSCROLL;
  }

  ghost.style.transform = `translate3d(${xPunta - offsetX}px, ${yPunta - offsetY}px, 0)`;
  marcarDestino();
  raf = requestAnimationFrame(frame);
}

function iniciarArrastre(evento) {
  const rect = tarjeta.getBoundingClientRect();
  offsetX = pendiente.startX - rect.left;
  offsetY = pendiente.startY - rect.top;
  xPunta = evento.clientX;
  yPunta = evento.clientY;

  try {
    tarjeta.setPointerCapture(evento.pointerId);
  } catch { /* el gesto sigue con los listeners de window */ }

  ghost = tarjeta.cloneNode(true);
  ghost.classList.add("kanban-drag-ghost");
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

  tarjeta.classList.add("is-dragging");
  document.body.classList.add("kanban-drag-activo");
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
    // A partir de aqui el gesto es arrastre: se corta la seleccion de texto.
    if (evento.cancelable) evento.preventDefault();
    iniciarArrastre(evento);
    return;
  }

  if (evento.cancelable) evento.preventDefault();
}

function flipADestino(id, etapaDestino, rectSalida) {
  if (menosMovimiento()) return;

  requestAnimationFrame(() => {
    const candidatas = document.querySelectorAll(".kanban-card");
    const nueva = Array.from(candidatas).find(
      (c) => c.dataset.casoId === String(id) && c.dataset.etapa === etapaDestino,
    );
    if (!nueva) return;

    // Una sola animacion por tarjeta: nada de sumar capas.
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

// Un click que nace de un arrastre no debe abrir la ficha.
function suprimirClickSiguiente() {
  const suprimir = (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
  };
  document.addEventListener("click", suprimir, { capture: true, once: true });
  setTimeout(() => {
    document.removeEventListener("click", suprimir, { capture: true });
  }, 400);
}

function alSoltar(evento) {
  if (!pendiente) return;
  xPunta = evento.clientX;
  yPunta = evento.clientY;
  if (!ghost) {
    // Fue un clic: se deja pasar tal cual.
    terminarGesto();
    return;
  }

  const col = hitTest();
  const etapaDestino = col ? col.getAttribute("data-col-stage") : null;
  const valido = esMovimientoValido(etapaDestino);
  const rectSalida = ghost ? ghost.getBoundingClientRect() : null;
  const id = tarjeta ? tarjeta.dataset.casoId : null;
  const cardOriginal = tarjeta;

  terminarGesto();
  suprimirClickSiguiente();

  if (!valido) {
    if (col && etapaDestino) {
      avisar("Solo puedes mover el caso a la fase anterior o siguiente.");
    }
    sacudir(cardOriginal);
    return;
  }

  const controlador = window.PDI?.SocialController || (window.app && window.app.socialController);
  if (!controlador || typeof controlador.moverCaso !== "function") return;

  // Mismo camino que el boton de la tarjeta: el controlador decide si mueve
  // de inmediato (Coordinacion/Admin) o si abre el modal de solicitud.
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

KanbanDrag.iniciar();
document.addEventListener("astro:page-load", () => KanbanDrag.iniciar());
