// Controlador: presentacion del rol activo
// ===========================================================================
//  QUE DEJO DE HACER ESTE ARCHIVO
// ===========================================================================
//  Antes era el unico lugar donde se decidia el acceso, y lo hacia de dos
//  maneras incompatibles: por un lado atenuaba los botones del menu segun
//  data-roles, y por otro mantenia una lista allowedViews por rol. Dos listas,
//  dos fuentes, y nada que comprobara que siguieran coincidiendo.
//
//  Ahora las reglas viven solo en auth/RouteMap.js y las aplica auth/PageGuard.js.
//  Este modulo conserva lo que si es suyo: pintar el banner, el tooltip y el
//  descriptor del rol activo. No decide nada de acceso.
//
//  Las listas allowedViews se conservan en los comentarios de abajo como
//  referencia historica de que roles veian que, y para poder contrastar la
//  migracion. No se leen en ningun sitio.
import { ToastView } from '../views/ToastView.js';

export const RoleController = {
  rolesConfig: {
    coord: {
      title: "Dirección y Coordinación General",
      desc: "Acceso global integral para supervisión estratégica de sedes, validación de padrón e indicadores de impacto.",
      tag: "Acceso Total / Dirección",
      tagCol: "var(--gt-green)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-salud", "view-educativo", "view-social", "view-sedes", "view-voluntarios", "view-auditoria", "view-ajustes"]
    },
    facilitadora: {
      title: "Facilitadora Nutricional / CRED",
      desc: "Especializada en tamizaje de anemia, curvas de peso/talla MINSA y prescripción de suplementos.",
      tag: "Operativo Nutrición / CRED",
      tagCol: "var(--gt-blue)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-salud", "view-sedes", "view-voluntarios", "view-ajustes"]
    },
    promotora: {
      title: "Promotora Educativa (Casitas del Saber)",
      desc: "Responsable del pase de asistencia escolar, nivelación pedagógica y talleres con materiales Faber-Castell.",
      tag: "Operativo Pedagógico",
      tagCol: "var(--gt-yellow)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-educativo", "view-sedes", "view-voluntarios", "view-ajustes"]
    },
    social: {
      title: "Trabajadora Social (Área Social Pastoral)",
      desc: "Canalización de casos vulnerables, derivaciones a DEMUNA y evaluación del núcleo familiar completo.",
      tag: "Protección Social / ASP",
      tagCol: "var(--gt-red)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-social", "view-voluntarios", "view-ajustes"]
    },
    admin: {
      title: "Administrador de Sistemas TI",
      desc: "Gestión de seguridad perimetral, trazabilidad de accesos, auditoría inviolable y exportación de bases de datos.",
      tag: "Sistemas & Seguridad TI",
      tagCol: "var(--text-muted)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-salud", "view-educativo", "view-social", "view-sedes", "view-voluntarios", "view-auditoria", "view-ajustes"]
    }
  },

  get ROLES() {
    return this.rolesConfig;
  },

  /**
   * Pinta el banner, el tooltip y el descriptor del rol activo.
   *
   * onNavigate y showToast se conservan en la firma por compatibilidad con las
   * llamadas existentes, pero ya no se usan: el acceso lo decide PageGuard y el
   * cambio de rol no debe interrumpir con un aviso.
   */
  applyRolePermissions(role, onNavigate = null, showToast = true) {
    const bannerTitle = document.getElementById("roleBannerTitle");
    const bannerDesc = document.getElementById("roleBannerDesc");
    const bannerTag = document.getElementById("roleBannerAccessTag");

    const conf = this.rolesConfig[role] || this.rolesConfig.coord;

    if (bannerTitle) bannerTitle.textContent = conf.title;
    if (bannerDesc) bannerDesc.textContent = conf.desc;
    if (bannerTag) {
      bannerTag.textContent = conf.tag;
      bannerTag.style.borderColor = conf.tagCol;
      bannerTag.style.color = conf.tagCol;
    }

    // Actualizar Tooltip dinámico del botón de información de rol
    const tipTitle = document.getElementById("roleTooltipTitle");
    const tipDesc = document.getElementById("roleTooltipDesc");
    const tipTag = document.getElementById("roleTooltipTag");
    const btnInfo = document.getElementById("btnRoleInfo");

    if (tipTitle) tipTitle.textContent = conf.title;
    if (tipDesc) tipDesc.textContent = conf.desc;
    if (tipTag) {
      tipTag.textContent = conf.tag;
      tipTag.style.color = conf.tagCol;
      tipTag.style.background = `${conf.tagCol}20`;
    }
    if (btnInfo) {
      btnInfo.setAttribute("title", `${conf.title}: ${conf.desc}`);
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.RoleController = RoleController;
}
