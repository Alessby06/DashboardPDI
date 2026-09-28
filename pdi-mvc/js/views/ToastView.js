// Vista: Sistema de Notificaciones Toast Flotantes
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

    let borderCol = "var(--gt-green)";
    if (type === "warning") borderCol = "var(--gt-yellow)";
    if (type === "danger") borderCol = "var(--gt-red)";
    if (type === "info") borderCol = "var(--gt-blue)";

    toast.style.borderColor = borderCol;
    toast.innerHTML = `
      <div style="flex:1;">
        <strong style="color:${borderCol}; display:block; font-size:${message ? "13px" : "12.5px"};">${title}</strong>
        ${message ? `<span style="font-size:12px; color:var(--text-muted);">${message}</span>` : ""}
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
