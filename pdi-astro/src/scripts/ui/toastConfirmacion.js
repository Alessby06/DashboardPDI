// ===========================================================================
//  Confirmación con acciones dentro de un toast
// ===========================================================================
//  Mismo patrón que descargaToast.js: cartón persistente, dos botones, foco
//  seguro en la salida y cierre con Escape. Aquí lo usa «Cancelar Edición»
//  para avisar de que los cambios sin guardar se van a perder, sin abrir un
//  modal que tape el expediente.
//
//  Si el aviso desapareciera solo, el usuario no sabría si descartó o no.
//  Por eso no tiene temporizador: vive hasta que se elige una acción, se
//  pulsa Escape o se cambia de página. Escape equivale a no descartar.
// ===========================================================================
import { escapar } from "../utils/HtmlHelper.js";
import { iconHtml } from '../../data/iconos.js';
import { confirmar as confirmarModal } from "./confirmacion.js";

const ID = "pdiToastConfirmacion";
let abierto = null;
let alTeclear = null;

function quitar() {
  if (alTeclear) {
    document.removeEventListener("keydown", alTeclear);
    alTeclear = null;
  }
  if (abierto) abierto.remove();
  abierto = null;
}

/**
 * @param {object} opciones
 * @param {string} opciones.titulo
 * @param {string} [opciones.mensaje]
 * @param {string} [opciones.textoConfirmar]
 * @param {string} [opciones.textoCancelar]
 * @param {boolean} [opciones.peligro]  Pinta la acción principal en rojo.
 * @param {() => void} [opciones.onConfirm]
 * @param {() => void} [opciones.onCancel]
 */
export function confirmarEnToast({
  titulo = "¿Continuar?",
  mensaje = "",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligro = false,
  onConfirm,
  onCancel,
} = {}) {
  const container = document.getElementById("toastContainer");
  if (!container) {
    // Sin contenedor de toasts se usa el modal del sistema; nunca el nativo.
    confirmarModal({
      titulo,
      mensaje,
      confirmar: textoConfirmar,
      cancelar: textoCancelar,
      peligro,
    }).then((ok) => (ok ? onConfirm?.() : onCancel?.()));
    return;
  }

  quitar();

  if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent || "")) {
    container.classList.add("toast-container--android");
  }

  const toast = document.createElement("div");
  toast.id = ID;
  toast.className = "toast-msg toast-confirmacion";
  toast.dataset.persistente = "true";
  toast.setAttribute("role", "dialog");
  toast.setAttribute("aria-modal", "false");
  toast.setAttribute("aria-labelledby", `${ID}-titulo`);
  toast.setAttribute("aria-describedby", `${ID}-texto`);

  toast.innerHTML = `
    <div class="toast-confirmacion-head">
      <span class="toast-icono" style="--toast-tono: ${peligro ? "var(--text-danger)" : "var(--text-warning)"};" aria-hidden="true">
        ${iconHtml("estado.alerta", { size: 16 })}
      </span>
      <div class="toast-cuerpo">
        <strong class="toast-titulo" id="${ID}-titulo">${escapar(titulo)}</strong>
        ${mensaje ? `<span class="toast-texto" id="${ID}-texto">${escapar(mensaje)}</span>` : ""}
      </div>
    </div>
    <div class="toast-confirmacion-actions">
      <button type="button" class="btn-action btn-secondary" data-cancelar>${escapar(textoCancelar)}</button>
      <button type="button" class="btn-action ${peligro ? "danger" : "primary"}" data-confirmar>${escapar(textoConfirmar)}</button>
    </div>
  `;

  const cancelar = toast.querySelector("[data-cancelar]");
  const confirmar = toast.querySelector("[data-confirmar]");

  const cerrar = () => quitar();

  const aceptar = () => {
    quitar();
    try {
      if (typeof onConfirm === "function") onConfirm();
    } catch (error) {
      console.error("[PDI] No se pudo completar la confirmación:", error);
    }
  };

  const rechazar = () => {
    quitar();
    if (typeof onCancel === "function") onCancel();
  };

  cancelar.addEventListener("click", rechazar);
  confirmar.addEventListener("click", aceptar);

  alTeclear = (evento) => {
    if (evento.key === "Escape") {
      evento.preventDefault();
      rechazar();
    }
  };
  document.addEventListener("keydown", alTeclear);

  container.appendChild(toast);
  abierto = toast;

  // Foco seguro en la salida: un Enter accidental no descarta los cambios.
  try {
    cancelar.focus({ preventScroll: true });
  } catch {
    // Sin foco programático, los botones siguen siendo accesibles con Tab.
  }
}

export function cerrarToastConfirmacion() {
  quitar();
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ToastConfirmacion = { confirmarEnToast, cerrar: quitar };
}

// Un cambio de página no puede dejar la confirmación huérfana.
if (typeof document !== "undefined") {
  document.addEventListener("astro:after-swap", quitar);
  document.addEventListener("astro:page-load", quitar);
}
