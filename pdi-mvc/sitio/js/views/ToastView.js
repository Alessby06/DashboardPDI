// Vista: Sistema de Notificaciones Toast Flotantes
import { escapar } from "../utils/HtmlHelper.js";

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

    const toast = document.createElement("div");
    toast.className = "toast-msg";

    // El borde del aviso y el titulo NO llevan el mismo color. El borde puede
    // usar el color de marca tal cual, porque no hay texto encima y ahi el
    // verde funciona. El titulo si lleva texto, y el verde de marca daba
    // 2,6:1 sobre el fondo del aviso, ilegible. Por eso el titulo de los avisos
    // de exito usa --text-brand, el mismo verde oscurecido que el resto de la
    // pagina. Ambar, rojo y azul se quedan como estaban: son otros colores y
    // ajustarlos es otra decision.
    let borderCol = "var(--gt-green)";
    let textCol = "var(--text-brand)";
    if (type === "warning") { borderCol = "var(--gt-yellow)"; textCol = "var(--gt-yellow)"; }
    if (type === "danger") { borderCol = "var(--gt-red)"; textCol = "var(--gt-red)"; }
    if (type === "info") { borderCol = "var(--gt-blue)"; textCol = "var(--gt-blue)"; }

    toast.style.borderColor = borderCol;
    // El titulo y el mensaje se escapan. No es una precaution teorica: casi
    // todos los avisos llevan el nombre de un beneficiario o de un voluntario
    // en el mensaje ("Se guardo la fotografia de <nombre>"), y sin escapar un
    // nombre con una etiqueta dentro ejecutaria JavaScript en cuanto saltaba
    // el aviso, que es justo al guardar. Ninguno de los llamantes pasa HTML a
    // proposito, asi que escaparlos no cambia nada de lo que se ve.
    toast.innerHTML = `
      <div style="flex:1;">
        <strong style="color:${textCol}; display:block; font-size:${message ? "13px" : "12.5px"};">${escapar(title)}</strong>
        ${message ? `<span style="font-size:12px; color:var(--text-muted);">${escapar(message)}</span>` : ""}
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ToastView = ToastView;
}
