// Controlador: Simulador de Roles y RBAC Dinámico
import { ToastView } from '../views/ToastView.js';

export const RoleController = {
  rolesConfig: {
    coord: {
      title: "Dirección y Coordinación General",
      desc: "Acceso global integral para supervisión estratégica de sedes, validación de padrón e indicadores de impacto.",
      tag: "Acceso Total / Dirección",
      tagCol: "var(--gt-green)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-salud", "view-educativo", "view-social"]
    },
    facilitadora: {
      title: "Facilitadora Nutricional / CRED",
      desc: "Especializada en tamizaje de anemia, curvas de peso/talla MINSA y prescripción de suplementos.",
      tag: "Operativo Nutrición / CRED",
      tagCol: "var(--gt-blue)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-salud"]
    },
    promotora: {
      title: "Promotora Educativa (Casitas del Saber)",
      desc: "Responsable del pase de asistencia escolar, nivelación pedagógica y talleres con materiales Faber-Castell.",
      tag: "Operativo Pedagógico",
      tagCol: "var(--gt-yellow)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-educativo"]
    },
    social: {
      title: "Trabajadora Social (Área Social Pastoral)",
      desc: "Canalización de casos vulnerables, derivaciones a DEMUNA y evaluación del núcleo familiar completo.",
      tag: "Protección Social / ASP",
      tagCol: "var(--gt-red)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-social"]
    },
    admin: {
      title: "Administrador de Sistemas TI",
      desc: "Gestión de seguridad perimetral, trazabilidad de accesos, auditoría inviolable y exportación de bases de datos.",
      tag: "Sistemas & Seguridad TI",
      tagCol: "var(--text-muted)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-salud", "view-educativo", "view-social"]
    }
  },

  applyRolePermissions(role, onNavigate) {
    const navButtons = document.querySelectorAll(".nav-btn");
    const bannerTitle = document.getElementById("roleBannerTitle");
    const bannerDesc = document.getElementById("roleBannerDesc");
    const bannerTag = document.getElementById("roleBannerAccessTag");

    const conf = this.rolesConfig[role] || this.rolesConfig.coord;

    navButtons.forEach(btn => {
      const allowedRoles = btn.getAttribute("data-roles")?.split(",") || [];
      const view = btn.getAttribute("data-view");

      if (allowedRoles.includes(role)) {
        btn.classList.remove("role-restricted");
        btn.removeAttribute("disabled");
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
      } else {
        btn.classList.add("role-restricted");
        btn.setAttribute("disabled", "true");
        btn.style.opacity = "0.35";
        btn.style.pointerEvents = "none";
      }
    });

    if (bannerTitle) bannerTitle.textContent = conf.title;
    if (bannerDesc) bannerDesc.textContent = conf.desc;
    if (bannerTag) {
      bannerTag.textContent = conf.tag;
      bannerTag.style.borderColor = conf.tagCol;
      bannerTag.style.color = conf.tagCol;
    }

    const toast = window.PDI?.ToastView || ToastView;
    toast.show("Perfil Simulado", `Cambiando a vista: ${conf.title}`, "info");

    const currentActiveBtn = document.querySelector(".nav-btn.active");
    const currentViewId = currentActiveBtn?.getAttribute("data-view");

    if (!conf.allowedViews.includes(currentViewId)) {
      if (onNavigate) {
        onNavigate("view-dashboard");
      }
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.RoleController = RoleController;
}
