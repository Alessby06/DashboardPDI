// Vista: Sistema de Notificaciones Toast Flotantes
import { escapar } from "../utils/HtmlHelper.js";

/**
 * Marca de cada tipo de aviso: el tono del chip de icono.
 *
 * El tono sale de los tokens --text-* y no de los colores de marca crudos.
 * El ambar y el azul de marca sobre el fondo blanco no llegan a 4,5:1 (el
 * ambar se queda en 2,2:1), y el icono tampoco debe quedar por debajo de 3:1
 * porque es lo unico que distingue un tipo de otro. Los --text-* ya estan
 * ajustados por tema para cumplir ese suelo.
 *
 * El titulo, en cambio, es neutro (--text-main): el color del tipo vive solo
 * en el chip, asi el aviso se lee como un carton del sistema y no como una
 * calcomania de color.
 */
const TONOS = {
  success: {
    tono: "var(--text-brand)",
    icono: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8.2 12.4 2.6 2.6 5-5.4" /></svg>`,
  },
  warning: {
    tono: "var(--text-warning)",
    icono: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.6 3.8 2.4 17.6A1.8 1.8 0 0 0 4 20.4h16a1.8 1.8 0 0 0 1.6-2.8L13.4 3.8a1.8 1.8 0 0 0-2.8 0Z" /><path d="M12 9.5v4.6" /><path d="M12 17.2h.01" /></svg>`,
  },
  danger: {
    tono: "var(--text-danger)",
    icono: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6" /><path d="m15 9-6 6" /></svg>`,
  },
  info: {
    tono: "var(--text-info)",
    icono: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.7h.01" /></svg>`,
  },
};

/** Cuantos avisos se apilan como maximo antes de retirar el mas viejo. */
const MAX_VISIBLES = 3;

/**
 * Tiempo de lectura, no de exposicion fija. Un aviso de una linea necesita
 * menos que uno con el texto legal del consentimiento, que hoy desaparecia a
 * los 3,4 s. Se acota para que ninguno se quede pegado a la pantalla.
 */
function duracionDe(title, message) {
  if (!message) return 3800;
  const caracteres = title.length + message.length;
  return Math.min(9000, 4200 + caracteres * 45);
}

export const ToastView = {
  /**
   * Pinta un aviso flotante.
   *
   * @param {string} title    Lo que se lee en negrita.
   * @param {string} [message] Segunda linea. Es opcional a proposito: muchos
   *   avisos no tienen nada que anadir, y hacerlos pasar por
   *   `show(texto, texto)` para que la firma no se quejara dibujaba el mismo
   *   texto dos veces seguidas, que es ruido, no informacion.
   * @param {"success"|"warning"|"danger"|"info"} [type]
   */
  show(title, message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const tono = TONOS[type] || TONOS.success;

    const toast = document.createElement("div");
    toast.className = "toast-msg";
    // Los errores se anuncian de inmediato (role="alert"); el resto espera a
    // que el lector termine la frase en curso (role="status" ya implica
    // aria-live="polite").
    toast.setAttribute("role", type === "danger" ? "alert" : "status");
    toast.setAttribute("aria-atomic", "true");

    // El titulo y el mensaje se escapan. No es una precaution teorica: casi
    // todos los avisos llevan el nombre de un beneficiario o de un voluntario
    // en el mensaje ("Se guardo la fotografia de <nombre>"), y sin escapar un
    // nombre con una etiqueta dentro ejecutaria JavaScript en cuanto saltaba
    // el aviso, que es justo al guardar. Ninguno de los llamantes pasa HTML a
    // proposito, asi que escaparlos no cambia nada de lo que se ve. El icono
    // es un SVG fijo del codigo, no entra escape.
    toast.innerHTML = `
      <span class="toast-icono" style="--toast-tono:${tono.tono};">${tono.icono}</span>
      <div class="toast-cuerpo">
        <strong class="toast-titulo">${escapar(title)}</strong>
        ${message ? `<span class="toast-texto">${escapar(message)}</span>` : ""}
      </div>
      <button type="button" class="toast-cerrar" aria-label="Cerrar aviso">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    `;

    const cerrar = toast.querySelector(".toast-cerrar");

    // Un solo temporizador por aviso, con pausa real: si el puntero entra o el
    // foco llega al boton, el aviso deja de contar. Sin esto, el texto legal
    // del consentimiento se iba antes de poder leerlo.
    let restante = duracionDe(title, message);
    let inicio = 0;
    let temporizador = null;
    let saliendo = false;

    function salir() {
      if (saliendo) return;
      saliendo = true;
      clearTimeout(temporizador);
      toast.classList.add("toast-saliendo");
      const quitar = () => toast.remove();
      // Solo la transicion del propio carton cierra el aviso: los hijos
      // (el boton de cerrar) tambien emiten transitionend y no deben
      // adelantar la salida.
      const alTerminar = (evento) => {
        if (evento.target !== toast) return;
        toast.removeEventListener("transitionend", alTerminar);
        quitar();
      };
      toast.addEventListener("transitionend", alTerminar);
      // Red de seguridad por si la transicion no llega a dispararse (pestaña
      // en segundo plano, movimiento reducido).
      setTimeout(quitar, 280);
    }

    function reanudar() {
      if (saliendo || temporizador !== null) return;
      inicio = Date.now();
      temporizador = setTimeout(salir, restante);
    }

    function pausar() {
      if (saliendo || temporizador === null) return;
      clearTimeout(temporizador);
      temporizador = null;
      restante = Math.max(1200, restante - (Date.now() - inicio));
    }

    toast.addEventListener("pointerenter", pausar);
    toast.addEventListener("pointerleave", reanudar);
    toast.addEventListener("focusin", pausar);
    toast.addEventListener("focusout", (evento) => {
      if (!toast.contains(evento.relatedTarget)) reanudar();
    });
    cerrar.addEventListener("click", salir);

    // La pila no crece sin limite: si llegan varios avisos de golpe, el mas
    // viejo se retira para que el monton no tape la pantalla.
    while (container.children.length >= MAX_VISIBLES) {
      container.firstElementChild?.remove();
    }

    container.appendChild(toast);
    reanudar();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ToastView = ToastView;
}
