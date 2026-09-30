// Controlador: Módulo de Salud y Nutrición CRED
import { AnemiaCalculator } from '../utils/AnemiaCalculator.js';

export const SaludController = {
  handleHbChange(hb) {
    const calc = window.PDI?.AnemiaCalculator || AnemiaCalculator;
    const res = calc.calculate(hb);

    // Update embedded CRED calculator
    const diagLabel = document.getElementById("calcDiagnosticoLabel");
    const accionLabel = document.getElementById("calcAccionSugerida");
    if (diagLabel) {
      const numVal = parseFloat(hb);
      const valStr = !isNaN(numVal) ? ` (${numVal.toFixed(1)} g/dL)` : '';
      diagLabel.textContent = `${res.label}${valStr}`;
      diagLabel.style.color = res.color;
    }
    if (accionLabel) {
      accionLabel.textContent = `Acción: ${res.accion}`;
    }

    // Update modal elements if present
    const labelEl = document.getElementById("anemiaCalcResult");
    const accionEl = document.getElementById("anemiaCalcAccion");
    if (labelEl) {
      labelEl.textContent = res.label;
      labelEl.style.color = res.color;
    }
    if (accionEl) {
      accionEl.textContent = `Acción Prescrita: ${res.accion}`;
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SaludController = SaludController;
}
