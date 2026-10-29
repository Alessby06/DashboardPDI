// ===========================================================================
//  Confirmación modal reutilizable
// ===========================================================================
//  Sustituye a window.confirm() en acciones destructivas. El diálogo nativo
//  muestra la URL de la aplicación en la barra de título; este modal conserva
//  el lenguaje visual del resto del sistema y devuelve una promesa.
//
//  El foco entra en Cancelar: una acción destructiva no se acepta con Enter
//  por accidente. Escape y el clic en el fondo también cancelan.
// ===========================================================================

let inicializado = false;
let resolverActual = null;
let focoAntes = null;

function referencias() {
  return {
    modal: document.getElementById("modalConfirmacion"),
    caja: document.querySelector("#modalConfirmacion .modal-box"),
    titulo: document.getElementById("confirmacionTitulo"),
    mensaje: document.getElementById("confirmacionMensaje"),
    aceptar: document.getElementById("btnConfirmacionAceptar"),
    cancelar: document.getElementById("btnConfirmacionCancelar"),
    cerrar: document.getElementById("btnConfirmacionCerrar"),
  };
}

function enfocables(caja) {
  return Array.from(caja.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((el) => el.getClientRects().length > 0);
}

function terminar(valor) {
  const { modal } = referencias();
  if (!modal) return;

  modal.classList.remove("open");

  // El foco sale antes de inert/aria-hidden: si queda dentro, Chrome bloquea
  // el cambio y avisa por consola.
  const destino = focoAntes
    && document.contains(focoAntes)
    && !modal.contains(focoAntes)
    ? focoAntes
    : null;
  if (destino) {
    try {
      destino.focus({ preventScroll: true });
    } catch {
      // El elemento de origen pudo desaparecer; no hay nada que restaurar.
    }
  } else if (document.activeElement && modal.contains(document.activeElement)) {
    // Sin un origen enfocable (por ejemplo, un clic programático), no se deja
    // el foco atrapado dentro de un modal que acaba de quedar inert.
    try {
      document.activeElement.blur();
    } catch {
      // Nada que hacer.
    }
  }
  focoAntes = null;
  modal.setAttribute("inert", "");
  modal.setAttribute("aria-hidden", "true");

  const resolver = resolverActual;
  resolverActual = null;
  if (resolver) resolver(valor);
}

function alTeclear(evento) {
  const { modal, caja } = referencias();
  if (!modal || !modal.classList.contains("open")) return;

  if (evento.key === "Escape") {
    evento.preventDefault();
    terminar(false);
    return;
  }
  if (evento.key !== "Tab" || !caja) return;

  const lista = enfocables(caja);
  if (!lista.length) return;
  const primero = lista[0];
  const ultimo = lista[lista.length - 1];

  if (evento.shiftKey && document.activeElement === primero) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault();
    primero.focus();
  }
}

/** Conecta los listeners una sola vez (el modal persiste entre páginas). */
export function iniciarConfirmacion() {
  if (inicializado) return;
  const { modal, aceptar, cancelar, cerrar } = referencias();
  if (!modal || !aceptar || !cancelar || !cerrar) return;

  inicializado = true;
  aceptar.addEventListener("click", () => terminar(true));
  cancelar.addEventListener("click", () => terminar(false));
  cerrar.addEventListener("click", () => terminar(false));
  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) terminar(false);
  });
  document.addEventListener("keydown", alTeclear);

  if (typeof window !== "undefined") {
    window.PDI = window.PDI || {};
    window.PDI.Confirmacion = { confirmar };
  }
}

/**
 * Abre el modal y resuelve `true` si se confirma, `false` si se cancela.
 * Si el marcado no está en la página, cae al confirm() nativo.
 */
export function confirmar({
  titulo = "Confirmar acción",
  mensaje = "",
  confirmar: textoAceptar = "Confirmar",
  cancelar: textoCancelar = "Cancelar",
  peligro = false,
  origen = null,
} = {}) {
  const activoAntes = document.activeElement;
  const {
    modal, titulo: elTitulo, mensaje: elMensaje, aceptar, cancelar, cerrar,
  } = referencias();

  if (!modal || !elTitulo || !elMensaje || !aceptar || !cancelar || !cerrar) {
    return Promise.resolve(window.confirm(mensaje || titulo));
  }

  iniciarConfirmacion();

  // Si había otra confirmación abierta, se cierra como cancelada.
  if (resolverActual) {
    const anterior = resolverActual;
    resolverActual = null;
    anterior(false);
  }

  focoAntes = origen instanceof HTMLElement
    ? origen
    : (activoAntes instanceof HTMLElement ? activoAntes : null);
  // Si el origen quedó dentro del propio modal (una confirmación anterior),
  // no sirve para devolver el foco: se deja el blur de cierre.
  if (focoAntes && modal.contains(focoAntes)) focoAntes = null;

  elTitulo.textContent = titulo;
  elMensaje.textContent = mensaje;
  aceptar.textContent = textoAceptar;
  cancelar.textContent = textoCancelar;
  aceptar.classList.toggle("peligro", Boolean(peligro));

  modal.removeAttribute("inert");
  modal.removeAttribute("aria-hidden");
  modal.classList.add("open");

  try {
    cancelar.focus({ preventScroll: true });
  } catch {
    // Sin foco programático, el teclado sigue entrando por el primer control.
  }

  return new Promise((resolver) => {
    resolverActual = resolver;
  });
}
