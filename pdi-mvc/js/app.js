// Punto de Entrada Principal (Bootstrap MVC)
import { AppController } from './controllers/AppController.js';
import { BeneficiarioController } from './controllers/BeneficiarioController.js';
import { SaludController } from './controllers/SaludController.js';
import { SocialController } from './controllers/SocialController.js';
import { ModalView } from './views/ModalView.js';
import { SpotlightView } from './views/SpotlightView.js';

// Asignar al contexto global para handlers inline de compatibilidad
window.app = AppController;

// Exponer funciones invocadas por inline handlers en el HTML
window.clearSignatureCanvas = () => BeneficiarioController.clearSignature();
window.closeModalExpediente = () => ModalView.closeExpediente();
window.closeModalNuevoMenor = () => ModalView.closeNuevoMenor();
window.openModalNuevoMenor = () => ModalView.openNuevoMenor();
window.closeModalInforme = () => ModalView.closeInforme();
window.closeSpotlightTour = () => SpotlightView.closeTour();
window.spotlightNext = () => SpotlightView.next((view) => AppController.navigateToView(view));
window.spotlightPrev = () => SpotlightView.prev((view) => AppController.navigateToView(view));
window.calculateAnemiaPreview = () => {
  const val = document.getElementById("quickHbSlider")?.value || 10.4;
  SaludController.handleHbChange(val);
};
window.calculateVulnerabilidad = () => SocialController.handleVulnerabilidadChange();
window.guardarNuevoMenor = (e) => BeneficiarioController.saveNuevoMenor(e, () => AppController.refreshAllViews());
window.exportDataCSV = () => AppController.exportCSV();
window.toggleTheme = (e) => AppController.toggleTheme(e);
window.openExpediente = (id) => BeneficiarioController.openExpediente(id);
window.moverCaso = (id, etapa) => SocialController.moverCaso(id, etapa);

// Arrancar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  AppController.init();
});


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
