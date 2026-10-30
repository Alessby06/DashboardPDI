// ===========================================================================
//  Confirmación de descarga como toast inferior
// ===========================================================================
//  En Android el modal de exportación se reemplaza por un aviso compacto en
//  la parte inferior. No descarga solo: conserva la confirmación explícita con
//  los botones Cancelar / Descargar.
//
//  El aviso es persistente (no se autodestruye), se cierra al confirmar, al
//  cancelar, con Escape o al cambiar de página. Solo puede existir uno a la vez.
// ===========================================================================
import { escapar } from "../utils/HtmlHelper.js";
import { iconHtml } from '../../data/iconos.js';

const ID = "pdiDescargaToast";
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
 * @param {string} opciones.mensaje
 * @param {() => void} opciones.onConfirm
 * @param {() => void} [opciones.onCancel]
 */
export function confirmarDescarga({ titulo = "Descargar reporte", mensaje = "", onConfirm, onCancel } = {}) {
  const container = document.getElementById("toastContainer");
  if (!container) {
    // Sin contenedor de toasts, la confirmación nativa es el último recurso.
    if (window.confirm(`${titulo}\n\n${mensaje}`)) onConfirm?.();
    else onCancel?.();
    return;
  }

  quitar();

  if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent || "")) {
    container.classList.add("toast-container--android");
  }

  const toast = document.createElement("div");
  toast.id = ID;
  toast.className = "toast-msg download-toast";
  toast.dataset.persistente = "true";
  toast.setAttribute("role", "dialog");
  toast.setAttribute("aria-modal", "false");
  toast.setAttribute("aria-labelledby", `${ID}-titulo`);
  toast.setAttribute("aria-describedby", `${ID}-texto`);

  toast.innerHTML = `
    <div class="download-toast-head">
      <span class="toast-icono" style="--toast-tono: var(--text-brand);" aria-hidden="true">
        ${iconHtml("accion.descargar", { size: 16 })}
      </span>
      <div class="toast-cuerpo">
        <strong class="toast-titulo" id="${ID}-titulo">${escapar(titulo)}</strong>
        <span class="toast-texto" id="${ID}-texto">${escapar(mensaje)}</span>
      </div>
    </div>
    <div class="download-toast-actions">
      <button type="button" class="btn-action btn-secondary" data-cancelar>Cancelar</button>
      <button type="button" class="btn-action primary" data-descargar>Descargar</button>
    </div>
  `;

  const cancelar = toast.querySelector("[data-cancelar]");
  const descargar = toast.querySelector("[data-descargar]");

  const cerrar = () => {
    quitar();
  };

  const confirmar = () => {
    quitar();
    try {
      if (typeof onConfirm === "function") onConfirm();
    } catch (error) {
      console.error("[PDI] No se pudo iniciar la descarga:", error);
      window.PDI?.ToastView?.show?.(
        "No se pudo descargar",
        "Revisa la conexión e inténtalo de nuevo.",
        "danger",
      );
    }
  };

  const cancelarAccion = () => {
    quitar();
    if (typeof onCancel === "function") onCancel();
  };

  cancelar.addEventListener("click", cancelarAccion);
  descargar.addEventListener("click", confirmar);

  alTeclear = (evento) => {
    if (evento.key === "Escape") {
      evento.preventDefault();
      cancelarAccion();
    }
  };
  document.addEventListener("keydown", alTeclear);

  container.appendChild(toast);
  abierto = toast;

  // Foco seguro en Cancelar: la descarga no ocurre por un Enter accidental.
  try {
    cancelar.focus({ preventScroll: true });
  } catch {
    // Sin foco programático, los botones siguen siendo accesibles con Tab.
  }
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DescargaToast = { confirmarDescarga, cerrar: quitar };
}

// Un cambio de página no puede dejar una confirmación de descarga huérfana.
if (typeof document !== "undefined") {
  document.addEventListener("astro:after-swap", quitar);
  document.addEventListener("astro:page-load", quitar);
}
