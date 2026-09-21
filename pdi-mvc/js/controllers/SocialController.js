// Controlador: Tablero Kanban y Evaluación de Vulnerabilidad ASP
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { BeneficiarioModel } from '../models/BeneficiarioModel.js';
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
    if (audit) {
      audit.log(
        "Lic. Ruth Soto",
        "Trabajadora Social ASP",
        "Transición Kanban",
        caso.codigo,
        `Caso de ${caso.menor} trasladado a etapa: ${nuevaEtapa.toUpperCase()}`,
        "Válido"
      );
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast) {
      toast.show("Tablero Kanban Actualizado", `Caso ${caso.codigo} ahora en etapa: ${nuevaEtapa.toUpperCase()}`, "success");
    }

    const view = window.PDI?.SocialKanbanView || SocialKanbanView;
    if (view) {
      view.renderKanban(model.getAll());
    }
  },

  syncScore(dimKey, value) {
    const num = Number(value) || 0;
    const slider = document.getElementById(`slider${dimKey}`);
    const input = document.getElementById(`score${dimKey}`);
    const label = document.getElementById(`lblScore${dimKey}`);

    if (slider && slider.value != num) slider.value = num;
    if (input && input.value != num) input.value = num;
    if (label) label.textContent = `${num} pts`;
  },

  cargarCasoEnSimulador(codigo) {
    if (!codigo || codigo === "custom") return;
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const menor = bModel.getByCodigo(codigo);
    if (!menor) return;

    const vScore = menor.vulnerabilidad || 75;
    
    // Distribuir proporcionalmente el puntaje oficial de vulnerabilidad entre las 6 dimensiones
    const factor = vScore / 100;
    const ing = Math.round(28 * factor);
    const viv = Math.round(20 * factor);
    const emp = Math.round(16 * factor);
    const sop = Math.round(19 * factor);
    const ins = Math.round(10 * factor);
    const sal = Math.round(7 * factor);

    this.syncScore("Ingreso", ing);
    this.syncScore("Vivienda", viv);
    this.syncScore("Empleo", emp);
    this.syncScore("Soporte", sop);
    this.syncScore("Instruccion", ins);
    this.syncScore("SaludFam", sal);

    const toast = window.PDI?.ToastView || ToastView;
    if (toast) {
      toast.show("Perfil Cargado", `Datos de ${menor.nombres} ${menor.apellidos} cargados en el simulador. Presione 'Calcular Evaluación' para procesar.`, "info");
    }
  },

  calcularEvaluacion() {
    const getVal = (id, fallback) => {
      const el = document.getElementById(id);
      return el ? (Number(el.value) || 0) : fallback;
    };

    const factors = {
      ing: getVal("scoreIngreso", 24),
      viv: getVal("scoreVivienda", 18),
      emp: getVal("scoreEmpleo", 14),
      sop: getVal("scoreSoporte", 16),
      ins: getVal("scoreInstruccion", 8),
      sal: getVal("scoreSaludFam", 6)
    };

    const calc = window.PDI?.VulnerabilityCalculator || VulnerabilityCalculator;
    const res = calc.calculate(factors);

    // Renderizar resultados en la interfaz
    const scoreValEl = document.getElementById("socioTotalScoreVal");
    const scoreBarEl = document.getElementById("socioTotalScoreBar");
    const categoryBadgeEl = document.getElementById("socioCategoryBadge");
    const exoneracionEl = document.getElementById("socioExoneracionText");
    const listaRecomEl = document.getElementById("listaRecomendacionesSocio");
    const resultBox = document.getElementById("containerResultadoSocioeconomico");

    if (scoreValEl) scoreValEl.textContent = `${res.total} / 100`;
    if (scoreBarEl) {
      scoreBarEl.style.width = `${res.total}%`;
      scoreBarEl.style.backgroundColor = res.color;
    }
    if (categoryBadgeEl) {
      categoryBadgeEl.textContent = res.category;
      categoryBadgeEl.className = `badge ${res.badgeClass}`;
    }
    if (exoneracionEl) {
      exoneracionEl.textContent = res.exoneracion;
      exoneracionEl.style.color = res.color;
    }

    if (listaRecomEl) {
      listaRecomEl.innerHTML = res.recomendaciones.map(r => `
        <li class="socio-recommendation-item">
          <div class="socio-rec-icon">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span>${r}</span>
        </li>
      `).join("");
    }

    if (resultBox) {
      resultBox.style.display = "block";
      if (typeof resultBox.scrollIntoView === "function") {
        resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast && typeof toast.show === "function") {
      toast.show("Evaluación Calculada", `Índice de Vulnerabilidad: ${res.total}/100 (${res.category})`, "success");
    }
  },

  handleVulnerabilidadChange() {
    this.calcularEvaluacion();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialController = SocialController;
}
