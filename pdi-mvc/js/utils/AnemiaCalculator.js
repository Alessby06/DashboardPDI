// Utilidad: Calculadora de Anemia según Norma Técnica MINSA
export const AnemiaCalculator = {
  calculate(hb) {
    const val = parseFloat(hb);
    if (isNaN(val)) {
      return {
        label: "Dato inválido",
        accion: "Ingrese un valor numérico de hemoglobina",
        color: "var(--text-muted)",
        badgeClass: "badge-blue"
      };
    }

    if (val < 7.0) {
      return {
        label: "Anemia Severa",
        accion: "Derivación Hospitalaria Inmediata + Alerta Médica",
        color: "var(--gt-red)",
        badgeClass: "badge-red"
      };
    } else if (val < 10.0) {
      return {
        label: "Anemia Moderada",
        accion: "Sulfato Ferroso 2 gotas/kg/día + Visita Domiciliaria ASP",
        color: "var(--gt-red)",
        badgeClass: "badge-red"
      };
    } else if (val < 11.0) {
      return {
        label: "Anemia Leve",
        accion: "Suplementación con Gotas de Hierro + Taller Nutricional",
        color: "var(--gt-yellow)",
        badgeClass: "badge-yellow"
      };
    } else {
      return {
        label: "Normal (Sin Anemia)",
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
