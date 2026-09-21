// Controlador Principal: Enrutador de Vistas, Temas y Ciclo de Vida
import { StorageService } from '../models/StorageService.js';
import { BeneficiarioModel } from '../models/BeneficiarioModel.js';
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { AuditModel } from '../models/AuditModel.js';
import { RoleController } from './RoleController.js';
import { BeneficiarioController } from './BeneficiarioController.js';
import { SaludController } from './SaludController.js';
import { SocialController } from './SocialController.js';
import { CasitasController } from './CasitasController.js';
import { DashboardView } from '../views/DashboardView.js';
import { BeneficiariosView } from '../views/BeneficiariosView.js';
import { SaludCredView } from '../views/SaludCredView.js';
import { CasitasView } from '../views/CasitasView.js';
import { SocialKanbanView } from '../views/SocialKanbanView.js';
import { ModalView } from '../views/ModalView.js';
import { SpotlightView } from '../views/SpotlightView.js';
import { ToastView } from '../views/ToastView.js';
import { CsvExporter } from '../utils/CsvExporter.js';

export const AppController = {
  roleController: RoleController,
  beneficiarioController: BeneficiarioController,
  saludController: SaludController,
  socialController: SocialController,
  casitasController: CasitasController,

  init() {
    // 1. Inicializar modelos
    BeneficiarioModel.init();
    CasoSocialModel.init();

    // 2. Inicializar componentes de vista
    this.refreshAllViews();

    // 3. Inicializar firma digital
    BeneficiarioController.initSignature();

    // 4. Configurar escuchadores de navegación
    this.bindNavigation();

    // 4.1 Configurar botón menú lateral (hamburguesa) y responsive backdrop
    this.bindSidebar();

    // 5. Configurar selector de rol
    this.bindRoleSelector();

    // 6. Configurar tabs en modales
    this.bindModalTabs();

    // 7. Inicializar valores de calculadoras
    SaludController.handleHbChange(10.4);
    SocialController.handleVulnerabilidadChange();

    console.log('Sistema "PDI" MVC inicializado correctamente.');
  },

  refreshAllViews() {
    const stats = BeneficiarioModel.getStats();
    const auditLogs = AuditModel.getAll();
    const beneficiarios = BeneficiarioModel.getAll();
    const casos = CasoSocialModel.getAll();

    DashboardView.render(stats, auditLogs);
    BeneficiariosView.renderTable(beneficiarios);
    SaludCredView.renderTable(beneficiarios);
    CasitasView.renderTable(beneficiarios);
    SocialKanbanView.renderKanban(casos);
  },

  navigateToView(viewId) {
    const navButtons = document.querySelectorAll(".nav-btn");
    const appViews = document.querySelectorAll(".content-view, .app-view");

    navButtons.forEach(b => b.classList.remove("active"));
    appViews.forEach(v => v.classList.remove("active"));

    const targetBtn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
    if (targetBtn) targetBtn.classList.add("active");

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add("active");

    const mainContent = document.getElementById("mainContent");
    if (mainContent) mainContent.scrollTop = 0;
  },

  bindNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const viewId = btn.getAttribute("data-view");
        if (viewId && !btn.classList.contains("role-restricted")) {
          this.navigateToView(viewId);
          this.closeSidebar();
        }
      });
    });
  },

  bindSidebar() {
    const toggleBtn = document.getElementById("btnSidebarToggle");
    const backdrop = document.getElementById("sidebarBackdrop");
    const sidebar = document.getElementById("appSidebar");

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    // Cerrar con tecla Escape en caso de estar abierto en móvil
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeSidebar();
      }
    });
  },

  toggleSidebar() {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!sidebar) return;

    if (window.innerWidth > 900) {
      sidebar.classList.toggle("collapsed");
    } else {
      const isOpen = sidebar.classList.toggle("open");
      if (backdrop) {
        if (isOpen) {
          backdrop.classList.add("active");
        } else {
          backdrop.classList.remove("active");
        }
      }
    }
  },

  closeSidebar() {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!sidebar) return;

    if (window.innerWidth <= 900) {
      if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
      if (backdrop && backdrop.classList.contains("active")) {
        backdrop.classList.remove("active");
      }
    }
  },

  bindRoleSelector() {
    const selector = document.getElementById("roleSelector");
    if (selector) {
      selector.addEventListener("change", (e) => {
        RoleController.applyRolePermissions(e.target.value, (view) => this.navigateToView(view));
      });
      RoleController.applyRolePermissions(selector.value, (view) => this.navigateToView(view));
    }
  },

  switchRole(roleValue, roleTitle) {
    const labelEl = document.getElementById("labelActiveRole");
    if (labelEl) labelEl.textContent = roleTitle;

    const menuEl = document.querySelector("#dropdownRoleSelector .custom-dropdown-menu");
    const items = document.querySelectorAll("#dropdownRoleSelector .custom-dropdown-item");
    let selectedItem = null;
    items.forEach(it => {
      if (it.getAttribute("data-value") === roleValue) {
        it.classList.add("selected");
        selectedItem = it;
      } else {
        it.classList.remove("selected");
      }
    });

    // Mover el rol activo primero en la lista visual del desplegable
    if (menuEl && selectedItem) {
      menuEl.prepend(selectedItem);
    }

    const dropdown = document.getElementById("dropdownRoleSelector");
    if (dropdown) dropdown.classList.remove("open");

    const hiddenInput = document.getElementById("roleSelector");
    if (hiddenInput) {
      hiddenInput.value = roleValue;
      hiddenInput.dispatchEvent(new Event("change"));
    } else {
      RoleController.applyRolePermissions(roleValue, (view) => this.navigateToView(view));
    }
  },

  bindModalTabs() {
    const tabBtns = document.querySelectorAll(".modal-tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        tabBtns.forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-view-content, .modal-tab-pane").forEach(v => {
          v.classList.remove("active");
          v.style.display = "none";
        });

        btn.classList.add("active");
        const targetTabId = btn.getAttribute("data-tab");
        const targetTab = document.getElementById(targetTabId);
        if (targetTab) {
          targetTab.classList.add("active");
          targetTab.style.display = "block";
        }
      });
    });
  },

  toggleTheme(event) {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "light" ? "dark" : "light";

    const applyTheme = () => {
      if (nextTheme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        StorageService.setItem("pdi_app_theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
        StorageService.setItem("pdi_app_theme", "dark");
      }
    };

    if (!document.startViewTransition) {
      applyTheme();
      return;
    }

    const btn = event.currentTarget || document.getElementById("btnThemeToggle");
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    if (nextTheme === "dark") {
      document.documentElement.classList.add("theme-transitioning-to-dark");
    }

    const transition = document.startViewTransition(applyTheme);
    transition.ready.then(() => {
      if (nextTheme === "light") {
        document.documentElement.animate(
          [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }],
          { duration: 400, easing: "cubic-bezier(0.2, 0, 0, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }
    });
  },

  exportCSV() {
    const data = BeneficiarioModel.getAll();
    CsvExporter.exportBeneficiarios(data);
    ToastView.show("Reporte Exportado", 'Consolidado oficial "PDI" descargado en formato CSV', "success");
  },

  exportAuditCSV() {
    const audit = window.PDI?.AuditModel || AuditModel;
    const logs = audit.getAll();
    const exporter = window.PDI?.CsvExporter || CsvExporter;
    exporter.exportAuditLogs(logs);
    const toast = window.PDI?.ToastView || ToastView;
    toast.show("Bitácora Descargada", "Registro oficial de auditoría descargado en formato CSV (Ley 29733)", "success");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AppController = AppController;
}
