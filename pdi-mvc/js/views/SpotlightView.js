// Vista: Tour Interactivo Spotlight (10 Minutos)
export const spotlightSteps = [
  {
    targetId: "roleSelector",
    title: "1. Selector de Roles y RBAC Dinámico",
    desc: "Permite simular en vivo las 5 perspectivas operativas: Coordinación, Facilitadora Nutricional (CRED), Promotora Educativa, Área Social Pastoral y Administrador TI. Cada rol filtra estrictamente las pestañas y controles visibles.",
    view: "view-dashboard"
  },
  {
    targetId: "quickCredSlider",
    title: "2. Métricas y Tamizaje Anemia CRED",
    desc: "En el Dashboard y módulo CRED, calcule en vivo la severidad de anemia según normas MINSA ingresando el valor de hemoglobina. El sistema prescribe automáticamente el esquema de suplementación.",
    view: "view-dashboard"
  },
  {
    targetId: "tbodyBeneficiarios",
    title: "3. Padrón Nominal y Filtro Reactivo",
    desc: "Muestra la ficha técnica consolidada de los menores atendidos en las sedes Año Nuevo, La Libertad, El Progreso y San Pedro. Use el buscador superior para filtrar instantáneamente por nombre o DNI.",
    view: "view-beneficiarios"
  },
  {
    targetId: "boardKanbanSocial",
    title: "4. Flujograma Social y Tablero Kanban ASP",
    desc: "Tablero de 4 fases para canalización de casos de riesgo social y desnutrición: Pendiente, Evaluación, Canalizado y Cerrado. Puede avanzar los casos con un solo clic conforme avanza la intervención.",
    view: "view-social"
  },
  {
    targetId: "btnNuevoMenorHeader",
    title: "5. Firma Ley 29733 y Ficha Integral",
    desc: "Al registrar un menor o consultar su expediente, el sistema integra la firma digital manuscrita de consentimiento del apoderado, cumpliendo con la Ley de Protección de Datos Personales del Perú.",
    view: "view-beneficiarios"
  }
];

export const SpotlightView = {
  currentStep: 0,

  startTour(onNavigate) {
    this.currentStep = 0;
    this.showStep(this.currentStep, onNavigate);
  },

  showStep(index, onNavigate) {
    this.clearHighlight();
    const bar = document.getElementById("spotlightBar");
    if (!bar) return;

    if (index < 0 || index >= spotlightSteps.length) {
      this.closeTour();
      return;
    }

    this.currentStep = index;
    const step = spotlightSteps[index];

    const stepNum = document.getElementById("spotlightStepNum");
    if (stepNum) stepNum.textContent = `${index + 1}/${spotlightSteps.length}`;

    const titleEl = document.getElementById("spotlightTitle");
    if (titleEl) titleEl.textContent = step.title;

    const descEl = document.getElementById("spotlightDesc");
    if (descEl) descEl.textContent = step.desc;

    bar.classList.add("visible");

    if (onNavigate && step.view) {
      onNavigate(step.view);
    }

    setTimeout(() => {
      const target = document.getElementById(step.targetId);
      if (target) {
        target.classList.add("spotlight-highlight-target");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 180);
  },

  next(onNavigate) {
    if (this.currentStep < spotlightSteps.length - 1) {
      this.showStep(this.currentStep + 1, onNavigate);
    } else {
      this.closeTour();
    }
  },

  prev(onNavigate) {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1, onNavigate);
    }
  },

  clearHighlight() {
    document.querySelectorAll(".spotlight-highlight-target").forEach(el => {
      el.classList.remove("spotlight-highlight-target");
    });
  },

  closeTour() {
    this.clearHighlight();
    const bar = document.getElementById("spotlightBar");
    if (bar) bar.classList.remove("visible");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.spotlightSteps = spotlightSteps;
  window.PDI.SpotlightView = SpotlightView;
}
