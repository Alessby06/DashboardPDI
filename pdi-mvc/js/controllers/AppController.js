// Controlador Principal: Enrutador de Vistas, Temas y Ciclo de Vida
import { StorageService } from '../models/StorageService.js';
import { BeneficiarioModel } from '../models/BeneficiarioModel.js';
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { AuditModel } from '../models/AuditModel.js';
import { SedeModel } from '../models/SedeModel.js';
import { RoleController } from './RoleController.js';
import { BeneficiarioController } from './BeneficiarioController.js';
import { SaludController } from './SaludController.js';
import { SocialController } from './SocialController.js';
import { CasitasController } from './CasitasController.js';
import { SedesController } from './SedesController.js';
import { DashboardView } from '../views/DashboardView.js';
import { BeneficiariosView } from '../views/BeneficiariosView.js';
import { SaludCredView } from '../views/SaludCredView.js';
import { CasitasView } from '../views/CasitasView.js';
import { SocialKanbanView } from '../views/SocialKanbanView.js';
import { SedesView } from '../views/SedesView.js';
import { AjustesView } from '../views/AjustesView.js';
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
  sedesController: SedesController,

  init() {
    // 1. Inicializar modelos
    BeneficiarioModel.init();
    CasoSocialModel.init();
    SedeModel.init();

    // 1.5 Inicializar tema visual y ajustes
    AjustesView.init();

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
    SedesView.render();
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

    if (viewId === "view-dashboard") {
      const stats = BeneficiarioModel.getStats();
      const auditLogs = AuditModel.getAll();
      DashboardView.render(stats, auditLogs);
    }
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

    // Asignación de índice para animación de cascada escalonada en móviles
    document.querySelectorAll(".nav-sections .nav-btn").forEach((btn, idx) => {
      btn.style.setProperty("--nav-idx", idx);
    });

    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.toggleSidebar();
      };
    }

    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e) e.preventDefault();
        this.closeSidebar();
      };
    }

    window.toggleSidebar = () => this.toggleSidebar();
    window.closeSidebar = () => this.closeSidebar();

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeSidebar();
      }
    });

    // Sincronización al cambiar tamaño de ventana entre PC y Móvil
    window.addEventListener("resize", () => {
      const sidebar = document.getElementById("appSidebar");
      const backdrop = document.getElementById("sidebarBackdrop");
      if (!sidebar) return;

      if (window.innerWidth > 900) {
        // Al pasar a PC: cerrar drawer móvil y desactivar overlay
        sidebar.classList.remove("open");
        if (backdrop) backdrop.classList.remove("active");
      } else {
        // Al pasar a Móvil: remover colapso de PC
        sidebar.classList.remove("collapsed");
      }
    });
  },

  toggleSidebar() {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!sidebar) return;

    if (window.innerWidth <= 900) {
      // En móvil / pantalla angosta: alternar clase open con backdrop inteligente
      const isOpen = sidebar.classList.toggle("open");
      if (backdrop) backdrop.classList.toggle("active", isOpen);
    } else {
      // En PC / pantalla completa o dividida: alternar colapso Icon Rail (72px)
      sidebar.classList.toggle("collapsed");
      if (backdrop) backdrop.classList.remove("active");
    }
  },

  closeSidebar() {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
  },

  bindRoleSelector() {
    let savedRole = "coord";
    try {
      savedRole = localStorage.getItem("pdi_active_role") || "coord";
    } catch (e) {
      console.warn("No se pudo leer pdi_active_role de localStorage:", e);
    }

    const selector = document.getElementById("roleSelector");
    if (selector) {
      selector.value = savedRole;
      selector.addEventListener("change", (e) => {
        RoleController.applyRolePermissions(e.target.value, (view) => this.navigateToView(view), false);
      });
    }

    // Sincronizar UI del dropdown visual con el rol inicial / guardado
    const menuEl = document.querySelector("#dropdownRoleSelector .custom-dropdown-menu");
    const items = document.querySelectorAll("#dropdownRoleSelector .custom-dropdown-item");
    let selectedItem = null;
    items.forEach(it => {
      if (it.getAttribute("data-value") === savedRole) {
        it.classList.add("selected");
        selectedItem = it;
      } else {
        it.classList.remove("selected");
      }
    });

    if (selectedItem) {
      const itemText = selectedItem.querySelector(".item-text")?.textContent?.trim();
      const labelEl = document.getElementById("labelActiveRole");
      if (labelEl && itemText) {
        labelEl.textContent = itemText;
      }
      if (menuEl) {
        menuEl.prepend(selectedItem);
      }
    }

    RoleController.applyRolePermissions(savedRole, (view) => this.navigateToView(view), false);
  },

  switchRole(roleValue, roleTitle) {
    try {
      localStorage.setItem("pdi_active_role", roleValue);
    } catch (e) {
      console.warn("No se pudo guardar pdi_active_role en localStorage:", e);
    }

    const labelEl = document.getElementById("labelActiveRole");
    if (labelEl && roleTitle) {
      labelEl.textContent = roleTitle;
    }

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
    }

    RoleController.applyRolePermissions(roleValue, (view) => this.navigateToView(view), false);
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
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    AjustesView.setTheme(nextTheme, true, event);
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
