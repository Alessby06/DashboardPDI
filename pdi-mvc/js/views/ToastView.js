// Vista: Sistema de Notificaciones Toast Flotantes
export const ToastView = {
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
        <strong style="color:${borderCol}; display:block; font-size:13px;">${title}</strong>
        <span style="font-size:12px; color:var(--text-muted);">${message}</span>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(40px)";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ToastView = ToastView;
}
