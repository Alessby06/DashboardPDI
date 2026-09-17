// Controlador: Acompañamiento Educativo (Casita del Saber)
import { ToastView } from '../views/ToastView.js';

export const CasitasController = {
  toggleAsistencia(id, estado) {
    const config = {
      "P": { label: "Presente", badgeClass: "badge badge-green", activeClass: "active-P" },
      "T": { label: "Tardanza", badgeClass: "badge badge-yellow", activeClass: "active-T" },
      "FJ": { label: "Falta Justificada", badgeClass: "badge badge-orange", activeClass: "active-FJ" },
      "FI": { label: "Falta Injustificada", badgeClass: "badge badge-red", activeClass: "active-FI" }
    };

    const target = config[estado] || config["P"];

    // 1. Sincronizar badge de Escritorio (PC)
    const badgeDesk = document.getElementById(`badgeAsist_${id}`);
    if (badgeDesk) {
      badgeDesk.textContent = target.label;
      badgeDesk.className = target.badgeClass;
    }

    // 2. Sincronizar badge de Móvil
    const badgeMob = document.getElementById(`badgeAsistMob_${id}`);
    if (badgeMob) {
      badgeMob.textContent = target.label;
      badgeMob.className = target.badgeClass;
    }

    // 3. Sincronizar botones activos en Escritorio
    const btnGroupDesk = document.getElementById(`btnGroupAsist_${id}`);
    if (btnGroupDesk) {
      btnGroupDesk.querySelectorAll("button").forEach(btn => {
        btn.className = "btn-asist";
        if (btn.getAttribute("data-asist-btn") === estado) {
          btn.classList.add(target.activeClass);
        }
      });
    }

    // 4. Sincronizar botones activos en Móvil
    const btnGroupMob = document.getElementById(`btnGroupMobAsist_${id}`);
    if (btnGroupMob) {
      btnGroupMob.querySelectorAll("button").forEach(btn => {
        btn.className = "btn-asist";
        if (btn.getAttribute("data-asist-btn") === estado) {
          btn.classList.add(target.activeClass);
        }
      });
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast && toast.show) {
      toast.show("Asistencia Actualizada", `${target.label} registrado para el menor ID ${id}`, "info");
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasController = CasitasController;
}
