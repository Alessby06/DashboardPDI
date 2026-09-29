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
//  No debe importarse desde los modelos: cada entrada de js/pages lo importa
//  una vez, y el orden de arranque lo fija arrancarComun() dentro de Bootstrap.
//
// ---------------------------------------------------------------------------
//  Las importaciones, que son cuatro y por cuatro razones
// ---------------------------------------------------------------------------
//  Eran catorce, y por eso las diez paginas descargaban 338 KB de JavaScript
//  de media para llegar a este archivo. Lo que se arrastraba no era codigo de
//  aqui: eran las vistas ajenas de las que dependian los puentes de mas abajo.
//  Treinta y tres archivos de JavaScript se cargaban en las diez paginas,
//  incluidas DashboardView (53 KB) o BeneficiariosView (44 KB) en la de sedes.
//  Ahora son veintiuno, y la media baja a 188 KB.
//
//  - ModalView: los seis botones de abrir y cerrar modales. Los modales viven
//    en el chrome comun, o sea en las diez paginas, y no los carga nadie mas
//    (BeneficiarioController solo llega al padron). Si esto se difiriera, en
//    auditoria el boton de cerrar el detalle se quedaria mudo.
//  - Dropdown: el conmutador de la barra superior y los filtros de ocho paginas
//    lo invocan desde el marcado, asi que tiene que estar en las diez. Son
//    1 KB, frente a los 53 KB de DashboardView donde vivia antes.
//  - urlDe: lo traen PageGuard y, por el, Bootstrap, asi que no cuesta un byte.
//  - Theme: tambien lo carga Bootstrap en todas las paginas.
//
//  Todo lo demas se resuelve en la llamada por window.PDI, que es donde cada
//  modulo se publica a si mismo al importarse. Una pagina que no necesita la
//  vista de salud no la descarga, y los puentes de las que si la necesitan
//  siguen funcionando porque alli si esta.
import { ModalView } from "../views/ModalView.js";
import { Dropdown } from "../utils/Dropdown.js";
import { urlDe } from "../auth/RouteMap.js";
import { Theme } from "./Theme.js";

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
//  Todos resuelven por window.PDI, y no por importacion. Antes todos usaban el
//  BeneficiarioController importado, lo que arrastraba 66 KB (el controlador y
//  BeneficiariosView) a las diez paginas para once botones de un modal.
//
//  Quedan mudos en las nueve paginas que no son el padron, y eso es lo
//  correcto: viven dentro de modalNuevoMenor, que solo se abre desde alli. El
//  patron ya estaba probado dos lineas mas abajo, en capturarGpsCampo y
//  handleAddressInputDebounce, que ya resolvian asi.
window.clearSignatureCanvas = () => window.PDI?.BeneficiarioController?.clearSignature?.();
window.subirImagenFirma = (e) => {
  const file = e.target.files[0];
  if (file) window.PDI?.BeneficiarioController?.loadSignatureFile?.(file);
};
window.handleFotoUpload = (input, previewId, roleKey) =>
  window.PDI?.BeneficiarioController?.handleFotoUpload?.(input, previewId, roleKey);
window.toggleMismoApoderado = (checked) =>
  window.PDI?.BeneficiarioController?.syncMismoApoderado?.(checked);
window.handleAddressInputDebounce = (ctx = "reg") =>
  window.PDI?.BeneficiarioController?.handleAddressDebounce?.(ctx);
window.capturarGpsCampo = (ctx = "reg") => window.PDI?.BeneficiarioController?.capturarGps?.(ctx);

// toggleBeneficiarioServicio no se cablea aqui: lo define al final
// BeneficiarioController.js. Estaba en los dos sitios a la vez y ganaba el
// ultimo que se evaluaba, que dependia del orden de las importaciones. Ahora
// manda el controlador y solo uno de los dos puede equivocarce.

window.guardarNuevoMenor = (e) =>
  window.PDI?.BeneficiarioController?.saveNuevoMenor?.(e, refrescarVistaActual);

// ---------------------------------------------------------------------------
//  MODALES
// ---------------------------------------------------------------------------
window.openModalNuevoMenor = () => ModalView.openNuevoMenor();
window.openModalNuevoBeneficiario = () => ModalView.openNuevoMenor();
window.closeModalNuevoMenor = () => ModalView.closeNuevoMenor();
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
  window.PDI?.AppController?.exportAuditCSV?.();
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
//  CALCULADORAS
// ---------------------------------------------------------------------------
//  Resuelven por window.PDI. Sus controladores los cargan las paginas que los
//  necesitan y solo esas: salud.js y social.js. Antes los importaba este
//  archivo, y eso metia en las otras ocho paginas SaludController, que arrastra
//  SaludCredView, y SocialController, que arrastra SocialKanbanView.
window.calculateAnemiaPreview = () => {
  const inputEl = document.getElementById("calcHbInput");
  const sliderEl = document.getElementById("quickHbSlider");
  const val = inputEl ? inputEl.value : sliderEl ? sliderEl.value : 10.4;
  window.PDI?.SaludController?.handleHbChange?.(val);
};
window.calcularEvaluacionSocioeconomica = () => window.PDI?.SocialController?.calcularEvaluacion?.();
window.syncScoreSimulador = (dimKey, val) => window.PDI?.SocialController?.syncScore?.(dimKey, val);
window.cargarCasoEnSimulador = (codigo) => window.PDI?.SocialController?.cargarCasoEnSimulador?.(codigo);
window.moverCaso = (id, etapa) => window.PDI?.SocialController?.moverCaso?.(id, etapa);

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
window.showToast = (mensaje, tipo = "success") =>
  window.PDI?.ToastView?.show?.(mensaje, undefined, tipo);

// El conmutador de la barra superior vive en el chrome, asi que el tema tiene
// que funcionar en las diez paginas. Por eso Theme lo carga Bootstrap y no este
// archivo: asi AjustesView (11 KB) se queda solo en ajustes.html.
window.toggleTheme = (e) => Theme.alternar(e);
window.selectActiveRole = (roleValue, roleTitle) =>
  window.PDI?.Navigation?.seleccionarRol?.(roleValue, roleTitle);
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

// Las dos exportaciones de datos las carga AppController en las paginas que las
// ofrecen: el panel y la auditoria. Antes las importaba este archivo y por eso
// AppController con CsvExporter llegaban a las diez.
window.exportDataCSV = () => window.PDI?.AppController?.exportCSV?.();
window.exportAuditCSV = () => window.PDI?.AppController?.exportAuditCSV?.();

// ---------------------------------------------------------------------------
//  AUDITORIA
// ---------------------------------------------------------------------------
window.toggleAuditInnerDropdown = (id) => window.PDI?.DashboardView?.toggleInnerDropdown?.(id);
window.toggleAuditAction = (val) => window.PDI?.DashboardView?.toggleAction?.(val);
window.selectAuditDate = (val, label) => window.PDI?.DashboardView?.selectDate?.(val, label);
window.toggleAuditRole = (val) => window.PDI?.DashboardView?.toggleRole?.(val);
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
//  Estas dos son las que costaban 53 KB en ocho paginas. Estaban en
//  DashboardView, pero no son de la vista: alternan una clase "open" sobre
//  cualquier .custom-dropdown de la pagina. Viven ahora en utils/Dropdown.js, y
//  DashboardView se limita a delegar.
window.toggleCustomDropdown = (id) => Dropdown.alternar(id);
window.toggleInnerFilterDropdown = (id) => Dropdown.alternarInterno(id);

// Puente a un metodo de una vista registrada en window.PDI. Se resuelve en la
// llamada, no al definir el puente: la vista se cuelga de PDI al importarse, y
// el orden de los modulos no es cosa de este archivo.
//
// Se declaraba asi:
//
//     const vista = (nombre) => (fn) => (fn ? (...args) => ... : undefined);
//
// Es decir, curryingada y de un solo argumento, mientras que los usos de abajo la
// llamaban con los dos a la vez: vista("BeneficiariosView", "filterBySearch"). El
// segundo argumento se descartaba sin avisar, y lo que acababa en
// window.filterPadronSearch era la funcion intermedia. Cuando el HTML la llamaba
// con el texto tecleado, ese texto ocupaba el hueco del nombre del metodo, la
// busqueda daba undefined y no se filtraba nada. Sin error en consola y con el
// puente correctamente definido, asi que no habia forma de verlo desde fuera: la
// tabla se dibujaba entera y, al teclear, no cambiaba. Por aquel entonces esto
// rompia los cinco buscadores y filtros del padron, salud, educativo, sedes y
// voluntarios. De los cuarenta y dos puentes que aqui se cableaban, hoy quedan
// diecisiete: los demas los define su propia vista, al final de su archivo, y
// estan comentados mas abajo.
const vista = (nombre, fn) => (...args) => window.PDI?.[nombre]?.[fn]?.(...args);

// Padrón
window.filterPadronSearch = vista("BeneficiariosView", "filterBySearch");
window.clearPadronSearch = vista("BeneficiariosView", "clearSearch");
window.togglePadronInnerDropdown = vista("BeneficiariosView", "toggleInnerDropdown");
window.togglePadronServicio = vista("BeneficiariosView", "toggleServicio");
window.togglePadronSede = vista("BeneficiariosView", "toggleSede");
window.togglePadronAnemia = vista("BeneficiariosView", "toggleAnemia");
window.setPadronEdadExacta = vista("BeneficiariosView", "setEdadExacta");
window.syncPadronEdadRango = vista("BeneficiariosView", "syncEdadRango");
window.clearPadronEdad = vista("BeneficiariosView", "clearEdad");
window.removePadronChip = vista("BeneficiariosView", "removeFilter");
window.selectPadronEstado = vista("BeneficiariosView", "selectEstado");
window.resetPadronFilters = vista("BeneficiariosView", "resetFilters");

// Salud CRED, Casitas del Saber, Sedes y los filtros de la tabla de
// voluntarios ya NO se cablean aqui. Cada una de esas vistas cuelga de window
// sus propios puentes al final de su archivo, y son los que mandan: antes los
// definian los dos sitios y gana el ultimo que se evalua, que hoy es la vista
// porque se importa despues. Depender de ese orden es un fallo esperando a que
// alguien reordene las importaciones, asi que se deja un solo dueno por puente.
// La tabla degia de 42 puentes duplicados.
//
// Quedan cuatro, los de cerrar y guardar los modales de voluntarios. Viven en
// el chrome, que esta en las diez paginas, mientras que VoluntariadosView solo
// se importa en la suya. Si el puente viviera en la vista, en las otras nueve
// paginas el boton de cerrar no tendria a quien llamar. Es la unica excepcion a
// la regla de un solo dueno, y por eso esta aqui y no en la vista.
//
// Antes Apuntaban a metodos que la vista no declara: closeInscripcion,
// closeFicha, closeCapacitacion y saveCapacitacion, en vez de closeModalInscripcion,
// closeModalFicha, closeModalCapacitacion y saveCapacitacion. Con el
// encadenamiento opcional no sonaba ningun error, y en la pagina de
// voluntarios ganaba la definicion correcta de la vista, asi que el fallo pasaba
// inadvertido: en cuanto la pagina no carga la vista, esos botones se quedaban
// mudos. verificar_puentes.py vigila las dos cosas.
window.closeModalInscripcionVoluntario = () =>
  window.PDI?.VoluntariadosView?.closeModalInscripcion?.();
window.closeModalFichaVoluntario = () =>
  window.PDI?.VoluntariadosView?.closeModalFicha?.();
window.closeModalCapacitacionVoluntarias = () =>
  window.PDI?.VoluntariadosView?.closeModalCapacitacion?.();
window.saveCapacitacionVoluntaria = () =>
  window.PDI?.VoluntariadosView?.saveCapacitacion?.();

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
}
// Nota sobre lo que aqui no esta. Este archivo solia republicar seis modulos en
// window.PDI (BeneficiarioModel, AuditModel, CsvExporter, ToastView, PageGuard y
// Navigation) y los tres ultimos no los leia nadie. Se quitaron por dos razones:
// todos los modulos se publican a si mismos al importarse, asi que la copia era
// redundante, y mantenerla obligaba a importarlos, que es justo lo que hacia que
// las diez paginas descargaran vistas enteras que no necesitan. Bootstrap, que
// corre en las diez, ya publica ToastView, Navigation, RoleController y
// AuditModel.
