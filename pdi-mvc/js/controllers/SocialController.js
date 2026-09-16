// Controlador: Tablero Kanban y Evaluación de Vulnerabilidad ASP
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { AuditModel } from '../models/AuditModel.js';
import { VulnerabilityCalculator } from '../utils/VulnerabilityCalculator.js';
import { SocialKanbanView } from '../views/SocialKanbanView.js';
import { ToastView } from '../views/ToastView.js';

export const SocialController = {
  moverCaso(id, nuevaEtapa) {
    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const caso = model.updateStage(id, nuevaEtapa);
    if (!caso) return;

    const audit = window.PDI?.AuditModel || AuditModel;
    audit.log(
      "Lic. Ruth Soto",
      "Trabajadora Social",
      "Transición Kanban",
      caso.codigo,
      `Caso de ${caso.menor} trasladado a etapa: ${nuevaEtapa.toUpperCase()}`,
      "Activo"
    );

    const toast = window.PDI?.ToastView || ToastView;
    toast.show("Tablero Kanban Actualizado", `Caso ${caso.codigo} ahora en etapa: ${nuevaEtapa}`, "success");

    const view = window.PDI?.SocialKanbanView || SocialKanbanView;
    view.renderKanban(model.getAll());
  },

  handleVulnerabilidadChange() {
    const factors = {
      ing: document.getElementById("valIngreso")?.value || 70,
      viv: document.getElementById("valVivienda")?.value || 80,
      emp: document.getElementById("valEmpleo")?.value || 60,
      ins: document.getElementById("valInseguridad")?.value || 85,
      sal: document.getElementById("valSalud")?.value || 75,
      sop: document.getElementById("valSoporte")?.value || 90
    };

    const calc = window.PDI?.VulnerabilityCalculator || VulnerabilityCalculator;
    const res = calc.calculate(factors);

    const scoreEl = document.getElementById("scoreVulnerabilidad");
    const badgeEl = document.getElementById("badgeNivelVulnerabilidad");
    const accionEl = document.getElementById("accionVulnerabilidad");

    if (scoreEl) scoreEl.textContent = `${res.total}/100`;

    if (badgeEl) {
      badgeEl.textContent = res.category;
      badgeEl.className = `badge ${res.badgeClass}`;
    }

    if (accionEl) {
      accionEl.textContent = res.accion;
      accionEl.style.color = res.color;
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialController = SocialController;
}
