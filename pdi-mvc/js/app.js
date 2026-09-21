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
window.filterAuditAction = (action) => DashboardView.filterByAction(action);
window.filterAuditRole = (role) => DashboardView.filterByRole(role);
window.filterAuditDate = (dateKey) => DashboardView.filterByDate(dateKey);
window.toggleCustomDropdown = (id) => DashboardView.toggleDropdown(id);
window.selectAuditDate = (val, label) => DashboardView.selectDate(val, label);
window.selectAuditRole = (val, label) => DashboardView.selectRole(val, label);
window.selectAuditAction = (val, label) => DashboardView.selectAction(val, label);
window.selectActiveRole = (roleValue, roleTitle) => AppController.switchRole(roleValue, roleTitle);
window.toggleTheme = (e) => AppController.toggleTheme(e);
window.openExpediente = (id) => BeneficiarioController.openExpediente(id);
window.openExpedienteByCodigo = (codigo) => BeneficiarioController.openExpedienteByCodigo(codigo);
window.moverCaso = (id, etapa) => SocialController.moverCaso(id, etapa);
window.filterAuditSearch = (q) => DashboardView.filterBySearch(q);
window.changeAuditPageSize = (size) => DashboardView.changePageSize(size);
window.prevAuditPage = () => DashboardView.changePage((DashboardView._auditCurrentPage || 1) - 1);
window.nextAuditPage = () => DashboardView.changePage((DashboardView._auditCurrentPage || 1) + 1);
window.openAuditDetail = (logId) => DashboardView.openLogDetail(logId);
window.closeModalAuditDetail = () => ModalView.closeAuditDetail();
window.clearAuditSearch = () => DashboardView.clearSearch();
window.resetAuditFilters = () => DashboardView.resetAuditFilters();
window.toggleInnerFilterDropdown = (id) => DashboardView.toggleInnerDropdown(id);
window.handleAuditDatePickerChange = (type, val) => DashboardView.handleDatePickerChange(type, val);
window.handleAuditDateManualInput = (type, el) => DashboardView.handleDateManualInput(type, el);

window.toggleRoleInfo = (e) => {
  if (e) e.stopPropagation();
  const wrap = document.querySelector(".role-info-wrap");
  if (wrap) wrap.classList.toggle("open");
};

// Handlers de Búsqueda y Filtros de Padrón Único de Beneficiarios
window.filterPadronSearch = (q) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.filterBySearch(q);
};
window.clearPadronSearch = () => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.clearSearch();
};
window.togglePadronServicio = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleServicio(val);
};
window.selectPadronServicio = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleServicio(val);
};
window.selectPadronSede = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.selectSede(val);
};
window.togglePadronAnemia = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleAnemia(val);
};
window.selectPadronAnemia = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleAnemia(val);
};
window.syncPadronEdad = (val, source) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.syncEdad(val, source);
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

// Cierre automático de Custom Dropdowns y Role Tooltips al hacer clic afuera
document.addEventListener("click", (e) => {
  if (!e.target.closest(".custom-dropdown")) {
    document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
  }
  if (!e.target.closest(".role-info-wrap")) {
    const wrap = document.querySelector(".role-info-wrap");
    if (wrap) wrap.classList.remove("open");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
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
