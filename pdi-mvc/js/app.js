// Punto de Entrada Principal (Bootstrap MVC)
import { AppController } from './controllers/AppController.js';
import { BeneficiarioController } from './controllers/BeneficiarioController.js';
import { SaludController } from './controllers/SaludController.js';
import { SocialController } from './controllers/SocialController.js';
import { DashboardView } from './views/DashboardView.js';
import { ModalView } from './views/ModalView.js';
import { SpotlightView } from './views/SpotlightView.js';

// Asignar al contexto global para handlers inline de compatibilidad
window.app = AppController;

// Exponer funciones invocadas por inline handlers en el HTML
window.clearSignatureCanvas = () => BeneficiarioController.clearSignature();
window.subirImagenFirma = (e) => {
  const file = e.target.files[0];
  if (file) BeneficiarioController.loadSignatureFile(file);
};
window.handleFotoUpload = (input, previewId, roleKey) => BeneficiarioController.handleFotoUpload(input, previewId, roleKey);
window.toggleMismoApoderado = (checked) => BeneficiarioController.syncMismoApoderado(checked);
window.closeModalExpediente = () => ModalView.closeExpediente();
window.closeModalNuevoMenor = () => ModalView.closeNuevoMenor();
window.openModalNuevoMenor = () => ModalView.openNuevoMenor();
window.closeModalInforme = () => ModalView.closeInforme();
window.closeSpotlightTour = () => SpotlightView.closeTour();
window.spotlightNext = () => SpotlightView.next((view) => AppController.navigateToView(view));
window.spotlightPrev = () => SpotlightView.prev((view) => AppController.navigateToView(view));
window.calculateAnemiaPreview = () => {
  const inputEl = document.getElementById("calcHbInput");
  const sliderEl = document.getElementById("quickHbSlider");
  const val = inputEl ? inputEl.value : (sliderEl ? sliderEl.value : 10.4);
  SaludController.handleHbChange(val);
};
window.toggleCalculadoraCred = () => {
  if (window.PDI && window.PDI.SaludCredView) {
    window.PDI.SaludCredView.toggleCalculadora();
  }
};
window.calculateVulnerabilidad = () => SocialController.handleVulnerabilidadChange();
window.calcularEvaluacionSocioeconomica = () => SocialController.calcularEvaluacion();
window.syncScoreSimulador = (dimKey, val) => SocialController.syncScore(dimKey, val);
window.cargarCasoEnSimulador = (codigo) => SocialController.cargarCasoEnSimulador(codigo);
window.guardarNuevoMenor = (e) => BeneficiarioController.saveNuevoMenor(e, () => AppController.refreshAllViews());
window.exportDataCSV = () => AppController.exportCSV();
window.exportAuditCSV = () => AppController.exportAuditCSV();

// Handlers de Auditoría / Historial de Cambios
window.toggleAuditInnerDropdown = (id) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleInnerDropdown(id);
};
window.toggleAuditAction = (val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleAction(val);
};
window.filterAuditAction = (action) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleAction(action);
};
window.selectAuditAction = (val, label) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleAction(val);
};
window.selectAuditDate = (val, label) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.selectDate(val, label);
};
window.filterAuditDate = (dateKey) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.selectDate(dateKey);
};
window.toggleAuditRole = (val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleRole(val);
};
window.filterAuditRole = (role) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleRole(role);
};
window.selectAuditRole = (val, label) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleRole(val);
};
window.toggleAuditStatus = (val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleStatus(val);
};
window.removeAuditChip = (key, val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.removeAuditFilter(key, val);
};
window.resetAuditFilters = () => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.resetAuditFilters();
};
window.filterAuditSearch = (q) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.filterBySearch(q);
};
window.clearAuditSearch = () => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.clearSearch();
};
window.changeAuditPageSize = (size) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.changePageSize(size);
};
window.prevAuditPage = () => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.changePage((window.PDI.DashboardView._auditCurrentPage || 1) - 1);
};
window.nextAuditPage = () => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.changePage((window.PDI.DashboardView._auditCurrentPage || 1) + 1);
};
window.openAuditDetail = (logId) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.openLogDetail(logId);
};
window.closeModalAuditDetail = () => ModalView.closeAuditDetail();
window.handleAuditDatePickerChange = (type, val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.handleDatePickerChange(type, val);
};
window.handleAuditDateManualInput = (type, el) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.handleDateManualInput(type, el);
};

window.toggleCustomDropdown = (id) => DashboardView.toggleDropdown(id);
window.toggleInnerFilterDropdown = (id) => DashboardView.toggleInnerDropdown(id);
window.selectActiveRole = (roleValue, roleTitle) => AppController.switchRole(roleValue, roleTitle);
window.toggleTheme = (e) => AppController.toggleTheme(e);
window.openExpediente = (id) => BeneficiarioController.openExpediente(id);
window.openExpedienteByCodigo = (codigo) => BeneficiarioController.openExpedienteByCodigo(codigo);
window.moverCaso = (id, etapa) => SocialController.moverCaso(id, etapa);

window.toggleRoleInfo = (e) => {
  if (e) e.stopPropagation();
  const wrap = document.querySelector(".role-info-wrap");
  if (wrap) wrap.classList.toggle("open");
};

// Handlers de Información Legal y Confirmación de Exportación de Auditoría
window.toggleAuditLegalInfo = (e) => {
  if (e) e.stopPropagation();
  const wrap = document.getElementById("wrapAuditLegalPopover");
  if (wrap) wrap.classList.toggle("open");
};

window.openModalExportAudit = () => {
  const modal = document.getElementById("modalConfirmExportAudit");
  const countBadge = document.getElementById("exportAuditCountBadge");
  const currentLogs = (window.PDI?.DashboardView && window.PDI.DashboardView._filteredAuditLogs) 
    ? window.PDI.DashboardView._filteredAuditLogs 
    : (window.PDI?.DashboardView && window.PDI.DashboardView._currentAuditLogs ? window.PDI.DashboardView._currentAuditLogs : []);
  if (countBadge) countBadge.textContent = `${currentLogs.length} eventos`;
  if (modal) {
    modal.classList.add("active");
    modal.classList.add("open");
  }
};

window.closeModalExportAudit = () => {
  const modal = document.getElementById("modalConfirmExportAudit");
  if (modal) {
    modal.classList.remove("active");
    modal.classList.remove("open");
  }
};

window.confirmExportAuditCSV = () => {
  window.closeModalExportAudit();
  if (window.PDI?.AppController?.exportAuditCSV) {
    window.PDI.AppController.exportAuditCSV();
  } else if (window.exportAuditCSV) {
    window.exportAuditCSV();
  }
};

// Handlers de Búsqueda y Filtros de Padrón Único de Beneficiarios
window.filterPadronSearch = (q) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.filterBySearch(q);
};
window.clearPadronSearch = () => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.clearSearch();
};
window.togglePadronInnerDropdown = (id) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleInnerDropdown(id);
};
window.togglePadronServicio = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleServicio(val);
};
window.selectPadronServicio = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleServicio(val);
};
window.togglePadronSede = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleSede(val);
};
window.selectPadronSede = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleSede(val);
};
window.togglePadronAnemia = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleAnemia(val);
};
window.selectPadronAnemia = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleAnemia(val);
};
window.setPadronEdadExacta = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.setEdadExacta(val);
};
window.syncPadronEdadRango = (handle, val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.syncEdadRango(handle, val);
};
window.syncPadronEdad = (val, source) => {
  if (source === "slider") {
    if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.syncEdadRango("min", val);
  } else {
    if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.setEdadExacta(val);
  }
};
window.clearPadronEdad = () => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.clearEdad();
};
window.removePadronChip = (filterKey, specificVal) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.removeFilter(filterKey, specificVal);
};
window.selectPadronEstado = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.selectEstado(val);
};
window.resetPadronFilters = () => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.resetFilters();
};

// Cierre automático de Custom Dropdowns, Inner Dropdowns, Role Tooltips y Audit Legal Popover al hacer clic afuera
document.addEventListener("click", (e) => {
  if (!e.target.closest(".custom-dropdown")) {
    document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
  }
  if (!e.target.closest(".padron-inner-dropdown")) {
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));
  }
  if (!e.target.closest(".role-info-wrap")) {
    const wrap = document.querySelector(".role-info-wrap");
    if (wrap) wrap.classList.remove("open");
  }
  if (!e.target.closest(".audit-legal-popover-wrapper")) {
    const pop = document.getElementById("wrapAuditLegalPopover");
    if (pop) pop.classList.remove("open");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));
    const pop = document.getElementById("wrapAuditLegalPopover");
    if (pop) pop.classList.remove("open");
    const exportModal = document.getElementById("modalConfirmExportAudit");
    if (exportModal && exportModal.classList.contains("active")) {
      exportModal.classList.remove("active");
    }
  }
});

// Arrancar cuando el DOM esté listo (tolerante a readyState interactive o complete)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    AppController.init();
  });
} else {
  AppController.init();
}

window.toggleEditExpediente = () => {
  if (window.PDI?.ModalView) window.PDI.ModalView.toggleEdit();
};
window.saveExpedienteChanges = () => {
  if (window.PDI?.ModalView) window.PDI.ModalView.saveChanges();
};
window.deleteBeneficiarioExpediente = () => {
  if (window.PDI?.ModalView) window.PDI.ModalView.deleteBeneficiario();
};
window.closeModalExpediente = () => {
  if (window.PDI?.ModalView) window.PDI.ModalView.closeExpediente();
};

window.handleAddressInputDebounce = (ctx = 'reg') => {
  if (window.PDI?.BeneficiarioController) window.PDI.BeneficiarioController.handleAddressDebounce(ctx);
};
window.capturarGpsCampo = (ctx = 'reg') => {
  if (window.PDI?.BeneficiarioController) window.PDI.BeneficiarioController.capturarGps(ctx);
};
window.handleFotoUpload = (input, previewId, roleKey) => {
  if (window.PDI?.BeneficiarioController) window.PDI.BeneficiarioController.handleFotoUpload(input, previewId, roleKey);
};

window.filterSedesSearch = (val) => {
  if (window.PDI?.SedesController) window.PDI.SedesController.handleSearch(val);
  else if (window.PDI?.SedesView) window.PDI.SedesView.filterBySearch(val);
};
window.clearSedesSearch = () => {
  if (window.PDI?.SedesController) window.PDI.SedesController.clearSearch();
  else if (window.PDI?.SedesView) window.PDI.SedesView.clearSearch();
};
window.filterSedesByDistrito = (dist) => {
  if (window.PDI?.SedesController) window.PDI.SedesController.handleDistritoFilter(dist);
  else if (window.PDI?.SedesView) window.PDI.SedesView.filterByDistrito(dist);
};
window.filterSedesByServicio = (serv) => {
  if (window.PDI?.SedesController) window.PDI.SedesController.handleServicioFilter(serv);
  else if (window.PDI?.SedesView) window.PDI.SedesView.filterByServicio(serv);
};
window.clearSedesFilters = () => {
  if (window.PDI?.SedesController) window.PDI.SedesController.clearFilters();
};
window.filterPadronBySede = (sedeName) => {
  if (window.PDI?.BeneficiariosView) {
    window.PDI.BeneficiariosView._filterSede = [sedeName];
    if (window.PDI.BeneficiariosView._updateSedeDropdownUI) {
      window.PDI.BeneficiariosView._updateSedeDropdownUI();
    }
    window.PDI.BeneficiariosView.applyFilters();
  }
  if (window.app && window.app.navigateToView) {
    window.app.navigateToView("view-beneficiarios");
  } else if (window.PDI?.AppController) {
    window.PDI.AppController.navigateToView("view-beneficiarios");
  }
};


