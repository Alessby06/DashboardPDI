// ===========================================================================
//  CONTRATO CON EL HTML - Puentes window.* para los atributos onclick
// ===========================================================================
//  Este archivo no es logica de negocio: es la frontera que hace que los
//  atributos onclick="foo(...)" del HTML sigan funcionando. El HTML ya no
//  puede llamar a un enrutador de vistas (no hay vistas: hay paginas), asi que
//  cada puente que antes cambiaba de seccion ahora navega de verdad, y cada
//  puente que antes redibujaba todas las tablas ahora pide refrescar solo la
//  pagina en curso.
//
//  Que sigue siendo deuda y conviene KNOW: casi 90 atributos onclick
//  embebidos. Es mantenible mientras esten centralizados aqui, pero cada uno es
//  un acoplamiento invisible entre el marcado y un modulo concreto. La
//  siguiente migracion natural, cuando el tiempo lo permita, es sustituirlos por
//  delegacion de eventos o por data-atributos, y borrar este archivo entero.
//
//  No debe importarse desde los modelos: se carga una vez por pagina desde
//  Bootstrap, que es el unico que conoce el orden de arranque.
import { BeneficiarioController } from "../controllers/BeneficiarioController.js";
import { SaludController } from "../controllers/SaludController.js";
import { SocialController } from "../controllers/SocialController.js";
import { DashboardView } from "../views/DashboardView.js";
import { ModalView } from "../views/ModalView.js";
import { AjustesView } from "../views/AjustesView.js";
import { AppController } from "../controllers/AppController.js";
import { BeneficiarioModel } from "../models/BeneficiarioModel.js";
import { AuditModel } from "../models/AuditModel.js";
import { CsvExporter } from "../utils/CsvExporter.js";
import { ToastView } from "../views/ToastView.js";
import { PageGuard } from "../auth/PageGuard.js";
import { Navigation } from "./Navigation.js";
import { urlDe } from "../auth/RouteMap.js";

/**
 * Refresca lo que haya que refrescar en la pagina actual.
 * Cada js/pages/<slug>.js publica aqui su propio redibujado; si la pagina
 * actual no registro ninguno (porque no tiene datos vivos), no hace nada.
 */
function refrescarVistaActual() {
  const fn = window.PDI?.refrescarVistaActual;
  if (typeof fn === "function") fn();
}

// ---------------------------------------------------------------------------
//  Firma, fotos y alta de BENEFICIARIOS
// ---------------------------------------------------------------------------
window.clearSignatureCanvas = () => BeneficiarioController.clearSignature();
window.subirImagenFirma = (e) => {
  const file = e.target.files[0];
  if (file) BeneficiarioController.loadSignatureFile(file);
};
window.handleFotoUpload = (input, previewId, roleKey) =>
  BeneficiarioController.handleFotoUpload(input, previewId, roleKey);
window.toggleMismoApoderado = (checked) => BeneficiarioController.syncMismoApoderado(checked);
window.handleAddressInputDebounce = (ctx = "reg") =>
  window.PDI?.BeneficiarioController?.handleAddressDebounce(ctx);
window.capturarGpsCampo = (ctx = "reg") => window.PDI?.BeneficiarioController?.capturarGps(ctx);
window.toggleBeneficiarioServicio = (id, servicio) => BeneficiarioController.toggleServicio(id, servicio);

window.guardarNuevoMenor = (e) => BeneficiarioController.saveNuevoMenor(e, refrescarVistaActual);
window.guardarNuevoBeneficiario = (e) => BeneficiarioController.saveNuevoMenor(e, refrescarVistaActual);

// ---------------------------------------------------------------------------
//  MODALES
// ---------------------------------------------------------------------------
window.openModalNuevoMenor = () => ModalView.openNuevoMenor();
window.openModalNuevoBeneficiario = () => ModalView.openNuevoMenor();
window.closeModalNuevoMenor = () => ModalView.closeNuevoMenor();
window.closeModalNuevoBeneficiario = () => ModalView.closeNuevoMenor();
window.closeModalInforme = () => ModalView.closeInforme();
window.closeModalAuditDetail = () => ModalView.closeAuditDetail();
window.openModalExportAudit = () => {
  const modal = document.getElementById("modalConfirmExportAudit");
  const countBadge = document.getElementById("exportAuditCountBadge");
  const dv = window.PDI?.DashboardView;
  const logs = dv?._filteredAuditLogs || dv?._currentAuditLogs || [];
  if (countBadge) countBadge.textContent = `${logs.length} eventos`;
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
  AppController.exportAuditCSV();
};

// ---------------------------------------------------------------------------
//  EXPEDIENTE
// ---------------------------------------------------------------------------
// Antes eran un modal de 456 lineas con 6 pestanas. Ahora es una pagina: el
// motivo es que el expediente tiene que salir impreso como oficio formal de
// derivacion a DEMUNA, y un modal no se imprime con contexto propio.
window.openExpediente = (id) => {
  window.location.href = urlDe("expediente", { id });
};
window.openExpedienteByCodigo = (codigo) => {
  window.location.href = urlDe("expediente", { codigo });
};
window.toggleEditExpediente = () => window.PDI?.ExpedienteView?.toggleEdit?.();
window.saveExpedienteChanges = () => window.PDI?.ExpedienteView?.saveChanges?.();
window.deleteBeneficiarioExpediente = () => window.PDI?.ExpedienteView?.deleteBeneficiario?.();
// No queda shim de cerrar el expediente: el boton de cerrar estaba en el marco
// del modal, y el modal se fue. Quien quiera volver al padron usa el enlace de
// la cabecera de la pagina, que sale de RouteMap.

// ---------------------------------------------------------------------------
//  CALCULADORAS
// ---------------------------------------------------------------------------
window.calculateAnemiaPreview = () => {
  const inputEl = document.getElementById("calcHbInput");
  const sliderEl = document.getElementById("quickHbSlider");
  const val = inputEl ? inputEl.value : sliderEl ? sliderEl.value : 10.4;
  SaludController.handleHbChange(val);
};
window.toggleCalculadoraCred = () => window.PDI?.SaludCredView?.toggleCalculadora?.();
window.calculateVulnerabilidad = () => SocialController.handleVulnerabilidadChange();
window.calcularEvaluacionSocioeconomica = () => SocialController.calcularEvaluacion();
window.syncScoreSimulador = (dimKey, val) => SocialController.syncScore(dimKey, val);
window.cargarCasoEnSimulador = (codigo) => SocialController.cargarCasoEnSimulador(codigo);
window.moverCaso = (id, etapa) => SocialController.moverCaso(id, etapa);
window.toggleSimuladorSocio = () => window.PDI?.SocialKanbanView?.toggleSimulador?.();

/**
 * Calcula la edad en años a partir de la fecha de nacimiento y la refleja en el
 * campo "Edad Calculada" del modal de alta. El onchange de #regFechaNacimiento
 * lo invoca; sin esta definición el alta lanzaba ReferenceError.
 */
window.calcularEdadAutomatica = () => {
  const inputFecha = document.getElementById("regFechaNacimiento");
  const inputEdad = document.getElementById("regEdad");
  if (!inputFecha || !inputEdad) return;

  const valor = inputFecha.value;
  if (!valor) {
    inputEdad.value = "";
    return;
  }

  // Se interpreta como fecha local. new Date("AAAA-MM-DD") se resuelve en UTC y
  // puede retroceder un día según la zona horaria del dispositivo.
  const [anio, mes, dia] = valor.split("-").map(Number);
  const nacimiento = new Date(anio, mes - 1, dia);
  if (isNaN(nacimiento.getTime())) return;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (nacimiento > hoy) {
    console.warn("calcularEdadAutomatica: la fecha de nacimiento es futura, se omite el cálculo.");
    inputEdad.value = "";
    return;
  }

  // Años cumplidos: se descuenta si el cumpleaños de este año aún no ha ocurrido.
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  const cumpleEsteAnio =
    hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!cumpleEsteAnio) anios--;
  if (anios < 0) anios = 0;

  inputEdad.value = anios === 1 ? "1 año" : `${anios} años`;
};

// ---------------------------------------------------------------------------
//  TEMA, ROL Y EXPORTACION
// ---------------------------------------------------------------------------

// showToast(mensaje, tipo) era el nombre que usaba el codigo de AjustesView para
// pedir un aviso. No habia puente: los cuatro avisos de esa vista (cambio de
// tema, sincronizacion, las preferencias de alertas y la limpieza de cache) caian
// `if (window.showToast)` que nunca se cumplia, asi que ninguno se mostraba y
// nadie se enteraba. La comprobacion existia para que un TypeError no tumbara
// la accion; lo que hacia era tapar que faltaba la funcion.
window.showToast = (mensaje, tipo = "success") => ToastView.show(mensaje, undefined, tipo);

window.toggleTheme = (e) => AppController.toggleTheme(e);
window.setTheme = (theme, showToast = true, event = null) => AjustesView.setTheme(theme, showToast, event);
window.toggleFocoMode = (event = null) => AjustesView.toggleFocoMode(event);
window.triggerSync = () => AjustesView.triggerSync();
window.clearCache = () => AjustesView.clearCache();
window.selectActiveRole = (roleValue, roleTitle) =>
  Navigation.seleccionarRol(roleValue, roleTitle);
window.toggleRoleInfo = (e) => {
  // En PC el tooltip se muestra por hover y no reacciona al clic.
  if (window.innerWidth > 768) return;
  if (e) e.stopPropagation();
  const wrap = document.querySelector(".role-info-wrap");
  const btn = document.getElementById("btnRoleInfo");
  if (wrap) {
    const abierto = wrap.classList.contains("open");
    wrap.classList.toggle("open", !abierto);
    if (abierto && btn) btn.blur();
  }
};

window.exportDataCSV = () => AppController.exportCSV();
window.exportAuditCSV = () => AppController.exportAuditCSV();
window.exportVoluntariosCSV = () => window.PDI?.VoluntariadosView?.exportCSV?.();

// ---------------------------------------------------------------------------
//  AUDITORIA
// ---------------------------------------------------------------------------
window.toggleAuditInnerDropdown = (id) => window.PDI?.DashboardView?.toggleInnerDropdown?.(id);
window.toggleAuditAction = (val) => window.PDI?.DashboardView?.toggleAction?.(val);
window.filterAuditAction = (action) => window.PDI?.DashboardView?.toggleAction?.(action);
window.selectAuditAction = (val, label) => window.PDI?.DashboardView?.toggleAction?.(val);
window.selectAuditDate = (val, label) => window.PDI?.DashboardView?.selectDate?.(val, label);
window.filterAuditDate = (dateKey) => window.PDI?.DashboardView?.selectDate?.(dateKey);
window.toggleAuditRole = (val) => window.PDI?.DashboardView?.toggleRole?.(val);
window.filterAuditRole = (role) => window.PDI?.DashboardView?.toggleRole?.(role);
window.selectAuditRole = (val, label) => window.PDI?.DashboardView?.toggleRole?.(val);
window.toggleAuditStatus = (val) => window.PDI?.DashboardView?.toggleStatus?.(val);
window.removeAuditChip = (key, val) => window.PDI?.DashboardView?.removeAuditFilter?.(key, val);
window.resetAuditFilters = () => window.PDI?.DashboardView?.resetAuditFilters?.();
window.filterAuditSearch = (q) => window.PDI?.DashboardView?.filterBySearch?.(q);
window.clearAuditSearch = () => window.PDI?.DashboardView?.clearSearch?.();
window.changeAuditPageSize = (size) => window.PDI?.DashboardView?.changePageSize?.(size);
window.prevAuditPage = () =>
  window.PDI?.DashboardView?.changePage?.((window.PDI.DashboardView._auditCurrentPage || 1) - 1);
window.nextAuditPage = () =>
  window.PDI?.DashboardView?.changePage?.((window.PDI.DashboardView._auditCurrentPage || 1) + 1);
window.openAuditDetail = (logId) => window.PDI?.DashboardView?.openLogDetail?.(logId);
window.handleAuditDatePickerChange = (type, val) =>
  window.PDI?.DashboardView?.handleDatePickerChange?.(type, val);
window.handleAuditDateManualInput = (type, el) =>
  window.PDI?.DashboardView?.handleDateManualInput?.(type, el);
window.toggleAuditLegalInfo = (e) => {
  if (e) e.stopPropagation();
  document.getElementById("wrapAuditLegalPopover")?.classList.toggle("open");
};

// ---------------------------------------------------------------------------
//  DROP-DOWNS GENERICOS Y FILTROS POR PAGINA
// ---------------------------------------------------------------------------
window.toggleCustomDropdown = (id) => DashboardView.toggleDropdown(id);
window.toggleInnerFilterDropdown = (id) => DashboardView.toggleInnerDropdown(id);

const vista = (nombre) => (fn) => (fn ? (...args) => window.PDI?.[nombre]?.[fn]?.(...args) : undefined);

// Padrón
window.filterPadronSearch = vista("BeneficiariosView", "filterBySearch");
window.clearPadronSearch = vista("BeneficiariosView", "clearSearch");
window.togglePadronInnerDropdown = vista("BeneficiariosView", "toggleInnerDropdown");
window.togglePadronServicio = vista("BeneficiariosView", "toggleServicio");
window.selectPadronServicio = vista("BeneficiariosView", "toggleServicio");
window.togglePadronSede = vista("BeneficiariosView", "toggleSede");
window.selectPadronSede = vista("BeneficiariosView", "toggleSede");
window.togglePadronAnemia = vista("BeneficiariosView", "toggleAnemia");
window.selectPadronAnemia = vista("BeneficiariosView", "toggleAnemia");
window.setPadronEdadExacta = vista("BeneficiariosView", "setEdadExacta");
window.syncPadronEdadRango = vista("BeneficiariosView", "syncEdadRango");
window.syncPadronEdad = (val, source) =>
  source === "slider" ? vista("BeneficiariosView", "syncEdadRango")("min", val)
                     : vista("BeneficiariosView", "setEdadExacta")(val);
window.clearPadronEdad = vista("BeneficiariosView", "clearEdad");
window.removePadronChip = vista("BeneficiariosView", "removeFilter");
window.selectPadronEstado = vista("BeneficiariosView", "selectEstado");
window.resetPadronFilters = vista("BeneficiariosView", "resetFilters");

// Salud CRED
window.filterSaludSearch = vista("SaludCredView", "filterBySearch");
window.clearSaludSearch = vista("SaludCredView", "clearSearch");
window.toggleSaludAnemia = vista("SaludCredView", "toggleAnemia");
window.toggleSaludSede = vista("SaludCredView", "toggleSede");
window.selectSaludHb = vista("SaludCredView", "selectHbNivel");
window.removeSaludChip = vista("SaludCredView", "removeFilter");
window.resetSaludFilters = vista("SaludCredView", "resetFilters");

// Casitas del Saber
window.filterCasitasSearch = vista("CasitasView", "filterBySearch");
window.clearCasitasSearch = vista("CasitasView", "clearSearch");
window.selectCasitasAsistencia = vista("CasitasView", "selectAsistencia");
window.toggleCasitasSede = vista("CasitasView", "toggleSede");
window.selectCasitasGrado = vista("CasitasView", "selectGrado");
window.removeCasitasChip = vista("CasitasView", "removeFilter");
window.resetCasitasFilters = vista("CasitasView", "resetFilters");

// Sedes. Antes pasaba por SedesController, un envoltorio que solo reenviaba a
// SedesView sin anadir nada. Se llama a la vista directamente.
window.filterSedesSearch = vista("SedesView", "filterBySearch");
window.clearSedesSearch = vista("SedesView", "clearSearch");
window.filterSedesByDistrito = vista("SedesView", "filterByDistrito");
window.filterSedesByServicio = vista("SedesView", "filterByServicio");
window.clearSedesFilters = vista("SedesView", "resetFilters");

// Voluntariados
window.openInscripcionVoluntario = () => window.PDI?.VoluntariadosView?.openInscripcion?.();
window.closeModalInscripcionVoluntario = () => window.PDI?.VoluntariadosView?.closeInscripcion?.();
window.openEditVoluntario = (id) => window.PDI?.VoluntariadosView?.openEdicion?.(id);
window.openFichaVoluntario = (id) => window.PDI?.VoluntariadosView?.openFicha?.(id);
window.closeModalFichaVoluntario = () => window.PDI?.VoluntariadosView?.closeFicha?.();
window.saveInscripcionVoluntario = (e) =>
  window.PDI?.VoluntariadosView?.saveInscripcion?.(e, refrescarVistaActual);
window.saveCapacitacionVoluntaria = (e) =>
  window.PDI?.VoluntariadosView?.saveCapacitacion?.(e, refrescarVistaActual);
window.closeModalCapacitacionVoluntarias = () => window.PDI?.VoluntariadosView?.closeCapacitacion?.();
window.removeVoluntarioChip = vista("VoluntariadosView", "removeFilter");
window.resetVoluntariosFilters = vista("VoluntariadosView", "resetFilters");
window.toggleVoluntariosDistrito = vista("VoluntariadosView", "toggleDistrito");
window.toggleVoluntariosEstado = vista("VoluntariadosView", "toggleEstado");
window.toggleVoluntariosRol = vista("VoluntariadosView", "toggleRol");
window.toggleVoluntariosServicio = vista("VoluntariadosView", "toggleServicio");
window.toggleVoluntariosInnerDropdown = vista("VoluntariadosView", "toggleInnerDropdown");
window.toggleSedesInnerDropdown = vista("SedesView", "toggleInnerDropdown");

// ---------------------------------------------------------------------------
//  CRUZADO ENTRE PAGINAS
// ---------------------------------------------------------------------------
/**
 * Lleva al padrón filtrado por una sede concreta. Antes solo cambiaba de
 * sección y perdía el filtro al recargar; ahora viaja en la URL, así que el
 * enlace es compartible y sobrevive al botón de atrás.
 */
window.filterPadronBySede = (sedeName) => {
  window.location.href = urlDe("padron", { sede: sedeName });
};

/**
 * Cierre de desplegables, tooltips y popovers al hacer clic fuera. Al vivir en
 * un documento por carga, estos escuchadores mueren con la pagina; ya no se
 * acumulan como en la SPA.
 */
document.addEventListener("click", (e) => {
  if (!e.target.closest(".custom-dropdown")) {
    document.querySelectorAll(".custom-dropdown.open").forEach((d) => d.classList.remove("open"));
  }
  if (!e.target.closest(".padron-inner-dropdown")) {
    document.querySelectorAll(".padron-inner-dropdown.open").forEach((d) => d.classList.remove("open"));
  }
  if (!e.target.closest(".role-info-wrap")) {
    document.querySelector(".role-info-wrap")?.classList.remove("open");
    document.getElementById("btnRoleInfo")?.blur();
  }
  if (!e.target.closest(".audit-legal-popover-wrapper")) {
    document.getElementById("wrapAuditLegalPopover")?.classList.remove("open");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".custom-dropdown.open").forEach((d) => d.classList.remove("open"));
  document.querySelectorAll(".padron-inner-dropdown.open").forEach((d) => d.classList.remove("open"));
  document.getElementById("wrapAuditLegalPopover")?.classList.remove("open");
  document.getElementById("modalConfirmExportAudit")?.classList.remove("active");
});

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.legacyGlobals = true;
  window.PDI.BeneficiarioModel = BeneficiarioModel;
  window.PDI.AuditModel = AuditModel;
  window.PDI.CsvExporter = CsvExporter;
  window.PDI.ToastView = ToastView;
  window.PDI.PageGuard = PageGuard;
  window.PDI.Navigation = Navigation;
}
