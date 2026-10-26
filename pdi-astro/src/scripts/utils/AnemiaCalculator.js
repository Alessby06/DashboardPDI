// Utilidad: Calculadora de Anemia según Norma Técnica MINSA
export const AnemiaCalculator = {
  /**
   * Clave canónica del semáforo. Es la que se guarda y la que comparan los
   * filtros y los conteos; el `label` es solo para mostrar.
   */
  normalizar(valor) {
    const txt = String(valor == null ? "" : valor).trim().toLowerCase();
    if (!txt) return null;
    if (txt === "normal" || txt.includes("sin anemia")) return "Normal";
    if (txt.includes("severa")) return "Severa";
    if (txt.includes("moderada")) return "Moderada";
    if (txt.includes("leve") || txt.includes("riesgo")) return "Leve";
    return null;
  },

  calculate(hb) {
    const val = parseFloat(hb);
    if (isNaN(val)) {
      return {
        label: "Dato inválido",
        clase: null,
        accion: "Ingrese un valor numérico de hemoglobina",
        color: "var(--text-muted)",
        badgeClass: "badge-blue"
      };
    }

    if (val < 7.0) {
      return {
        label: "Anemia Severa",
        clase: "Severa",
        accion: "Derivación Hospitalaria Inmediata + Alerta Médica",
        color: "var(--gt-red)",
        badgeClass: "badge-red"
      };
    } else if (val < 10.0) {
      return {
        label: "Anemia Moderada",
        clase: "Moderada",
        accion: "Sulfato Ferroso 2 gotas/kg/día + Visita Domiciliaria ASP",
        color: "var(--gt-orange)",
        badgeClass: "badge-red"
      };
    } else if (val < 11.0) {
      return {
        label: "Anemia Leve",
        clase: "Leve",
        accion: "Suplementación con Gotas de Hierro + Taller Nutricional",
        color: "var(--gt-yellow)",
        badgeClass: "badge-yellow"
      };
    } else {
      return {
        label: "Normal (Sin Anemia)",
        clase: "Normal",
        accion: "Desayuno Fortificado Diario + Control de Crecimiento cada 3 meses",
        color: "var(--gt-green)",
        badgeClass: "badge-green"
      };
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AnemiaCalculator = AnemiaCalculator;
}
