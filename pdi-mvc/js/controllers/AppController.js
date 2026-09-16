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

    // 5. Configurar selector de rol
    this.bindRoleSelector();

    // 6. Configurar búsqueda contextual en tiempo real
    this.bindSearch();

    // 7. Configurar tabs en modales
    this.bindModalTabs();

    // 8. Inicializar valores de calculadoras
    SaludController.handleHbChange(10.4);
    SocialController.handleVulnerabilidadChange();

    // 9. Estado inicial de la barra de búsqueda (en Dashboard se oculta)
    this.updateSearchVisibility("view-dashboard");

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

    // Control de visibilidad de la barra de búsqueda: solo en módulos con tablas
    this.updateSearchVisibility(viewId);
  },

  updateSearchVisibility(viewId) {
    const searchWrap = document.querySelector(".search-wrap");
    const searchInput = document.getElementById("globalSearchInput");
    if (!searchWrap) return;

    // Módulos con tablas y sus placeholders específicos
    const viewsConTablas = {
      "view-beneficiarios": "Buscar en padrón por DNI, nombres o sede...",
      "view-salud": "Buscar en tamizaje CRED por DNI, menor o sede...",
      "view-educativo": "Buscar en asistencia Casitas por menor o grado...",
      "view-auditoria": "Buscar en auditoría por acción, usuario o entidad..."
    };

    if (viewsConTablas[viewId]) {
      searchWrap.classList.remove("search-hidden");
      searchWrap.style.removeProperty("display");
      searchWrap.style.display = "flex";
      if (searchInput) {
        searchInput.placeholder = viewsConTablas[viewId];
        searchInput.disabled = false;
        // Si hay una búsqueda previa, aplicarla al módulo actual
        if (searchInput.value.trim() !== "") {
          this.executeFilter(searchInput.value, viewId);
        }
      }
    } else {
      // Módulos sin tablas (Dashboard, Social ASP, Sedes): Ocultar barra de búsqueda
      searchWrap.classList.add("search-hidden");
      searchWrap.style.display = "none";
      if (searchInput) {
        searchInput.disabled = true;
        searchInput.value = "";
      }
    }
  },

  executeFilter(query, viewId) {
    const q = query.toLowerCase().trim();
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const allBeneficiarios = bModel.getAll();

    if (viewId === "view-beneficiarios") {
      const filtered = q === "" ? allBeneficiarios : allBeneficiarios.filter(b =>
        b.nombres.toLowerCase().includes(q) ||
        b.apellidos.toLowerCase().includes(q) ||
        b.codigo.toLowerCase().includes(q) ||
        b.dni.includes(q) ||
        b.distrito.toLowerCase().includes(q) ||
        b.sede.toLowerCase().includes(q)
      );
      BeneficiariosView.renderTable(filtered);
    } else if (viewId === "view-salud") {
      const filtered = q === "" ? allBeneficiarios : allBeneficiarios.filter(b =>
        b.nombres.toLowerCase().includes(q) ||
        b.apellidos.toLowerCase().includes(q) ||
        b.dni.includes(q) ||
        b.sede.toLowerCase().includes(q) ||
        (b.anemia && b.anemia.toLowerCase().includes(q))
      );
      SaludCredView.renderTable(filtered);
    } else if (viewId === "view-educativo") {
      const filtered = q === "" ? allBeneficiarios : allBeneficiarios.filter(b =>
        b.nombres.toLowerCase().includes(q) ||
        b.apellidos.toLowerCase().includes(q) ||
        (b.grado && b.grado.toLowerCase().includes(q)) ||
        (b.colegio && b.colegio.toLowerCase().includes(q)) ||
        b.sede.toLowerCase().includes(q)
      );
      CasitasView.renderTable(filtered);
    } else if (viewId === "view-auditoria") {
      const audit = window.PDI?.AuditModel || AuditModel;
      const logs = audit.getAll();
      const filtered = q === "" ? logs : logs.filter(l =>
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.user && l.user.toLowerCase().includes(q)) ||
        (l.entity && l.entity.toLowerCase().includes(q)) ||
        (l.detail && l.detail.toLowerCase().includes(q))
      );
      // Re-render audit table if container exists
      const auditTbody = document.getElementById("auditTableBody");
      if (auditTbody) {
        auditTbody.innerHTML = filtered.map(log => `
          <tr>
            <td style="font-family:var(--mono-font); font-size:12px; color:var(--text-dim);">${log.timestamp}</td>
            <td><strong>${log.user}</strong> <span style="font-size:11px; color:var(--text-dim);">(${log.role})</span></td>
            <td><span class="badge badge-blue">${log.action}</span></td>
            <td style="font-family:var(--mono-font); font-size:12px; color:var(--gt-green);">${log.entity}</td>
            <td style="font-size:12.5px;">${log.detail}</td>
            <td><span class="badge badge-green">${log.status}</span></td>
          </tr>
        `).join("");
      }
    }
  },

  bindNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const viewId = btn.getAttribute("data-view");
        if (viewId && !btn.classList.contains("role-restricted")) {
          this.navigateToView(viewId);
        }
      });
    });
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

  bindSearch() {
    const searchInput = document.getElementById("globalSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const activeViewEl = document.querySelector(".app-view.active, .content-view.active");
        const activeViewId = activeViewEl ? activeViewEl.id : "view-beneficiarios";
        this.executeFilter(e.target.value, activeViewId);
      });
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
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AppController = AppController;
}
