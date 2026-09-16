// Controlador: Acompañamiento Educativo (Casita del Saber)
import { ToastView } from '../views/ToastView.js';

export const CasitasController = {
  toggleAsistencia(id, estado) {
    const el = document.getElementById(`badgeAsist_${id}`);
    if (!el) return;

    if (estado === "P") {
      el.textContent = "Presente";
      el.className = "badge badge-green";
    } else if (estado === "T") {
      el.textContent = "Tardanza";
      el.className = "badge badge-yellow";
    } else if (estado === "F") {
      el.textContent = "Falta Justificada";
      el.className = "badge badge-red";
    }

    const toast = window.PDI?.ToastView || ToastView;
    toast.show("Asistencia Actualizada", `Estado registrado para el menor ID ${id}`, "info");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasController = CasitasController;
}
