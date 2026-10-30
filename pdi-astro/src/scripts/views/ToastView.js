// Vista: Sistema de Notificaciones Toast Flotantes
import { escapar } from "../utils/HtmlHelper.js";
import { iconHtml } from '../../data/iconos.js';

/** Android incluye teléfonos, tablets y WebViews. */
function esAndroid() {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent || "");
}

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
    icono: `${iconHtml("accion.confirmar", { size: 16 })}`,
  },
  warning: {
    tono: "var(--text-warning)",
    icono: `${iconHtml("estado.alerta", { size: 16 })}`,
  },
  danger: {
    tono: "var(--text-danger)",
    icono: `${iconHtml("accion.cerrar", { size: 16 })}`,
  },
  info: {
    tono: "var(--text-info)",
    icono: `${iconHtml("estado.info", { size: 16 })}`,
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

    // En Android el aviso se ancla al ancho útil y al borde inferior, también
    // en tablets donde el corte móvil de 768 px no se aplica.
    if (esAndroid()) container.classList.add("toast-container--android");

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
        ${iconHtml("accion.cerrar", { size: 14 })}
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
      // La confirmación de descarga es persistente: no debe desaparecer
      // porque lleguen otros avisos mientras el usuario decide.
      const candidato = Array.from(container.children)
        .find((elemento) => elemento.dataset.persistente !== "true");
      if (!candidato) break;
      candidato.remove();
    }

    container.appendChild(toast);
    reanudar();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ToastView = ToastView;
}
