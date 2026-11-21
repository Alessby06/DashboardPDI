// GENERADO por la migración de manejadores inline. No editar a mano.
// La CSP del producto prohíbe atributos on*= en el HTML; estos manejadores
// viven aquí y se conectan por delegación desde otro script externo.
(function () {
  'use strict';
  var MANEJADORES = {
    h001: function (event) { closeModalNuevoUsuario() },
    h002: function (event) { guardarNuevoUsuario(event) },
    h003: function (event) { document.getElementById('regFotoUsuarioInput').click() },
    h004: function (event) { handleFotoUpload(this, 'regFotoUsuarioPreview', 'usuario') },
    h005: function (event) { calcularEdadAutomatica() },
    h006: function (event) { window.handleAddressInputDebounce ? window.handleAddressInputDebounce('reg') : null },
    h007: function (event) { window.capturarGpsCampo ? window.capturarGpsCampo('reg') : null },
    h008: function (event) { window.handleFotoUpload ? window.handleFotoUpload(this, 'regFachadaPreview', 'fachada') : null },
    h009: function (event) { document.getElementById('regFotoApoderadoInput').click() },
    h010: function (event) { handleFotoUpload(this, 'regFotoApoderadoPreview', 'apoderado') },
    h011: function (event) { window.cambiarPersonaInscribe ? window.cambiarPersonaInscribe('mismo') : null },
    h012: function (event) { window.cambiarPersonaInscribe ? window.cambiarPersonaInscribe('otro') : null },
    h013: function (event) { window.cambiarModalidadRetiro ? window.cambiarModalidadRetiro('acompanado') : null },
    h014: function (event) { window.cambiarModalidadRetiro ? window.cambiarModalidadRetiro('solo') : null },
    h015: function (event) { toggleMismoApoderado(this.checked) },
    h016: function (event) { document.getElementById('regFotoRetiro1Input').click() },
    h017: function (event) { handleFotoUpload(this, 'regFotoRetiro1Preview', 'retiro1') },
    h018: function (event) { document.getElementById('regFotoRetiro2Input').click() },
    h019: function (event) { handleFotoUpload(this, 'regFotoRetiro2Preview', 'retiro2') },
    h020: function (event) { subirImagenFirma(event) },
    h021: function (event) { clearSignatureCanvas() },
    h022: function (event) { closeModalAuditDetail() },
    h023: function (event) { window.closeModalExportAudit ? window.closeModalExportAudit() : null },
    h024: function (event) { window.confirmExportAuditCSV ? window.confirmExportAuditCSV() : null },
    h025: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.closeModalDetalleCaso() : null },
    h026: function (event) { window.PDI?.DerivacionView?.abrirAtencion(window.PDI?.SocialKanbanView?._activeCaso) },
    h027: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.openExpedienteFromModal() : null },
    h028: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.abrirEvaluacionCaso() : null },
    h029: function (event) { window.PDI?.DerivacionView ? window.PDI.DerivacionView.imprimir(window.PDI?.SocialKanbanView?._activeCaso) : null },
    h030: function (event) { window.PDI?.SaludCredView ? window.PDI.SaludCredView.closeModalHistorialTamizaje() : (window.closeHistorialTamizaje ? window.closeHistorialTamizaje() : null) },
    h031: function (event) { window.actualizarPreviewNuevaPrueba ? window.actualizarPreviewNuevaPrueba() : null },
    h032: function (event) { window.ocultarFormularioNuevaPrueba ? window.ocultarFormularioNuevaPrueba() : null },
    h033: function (event) { window.guardarNuevaPrueba ? window.guardarNuevaPrueba() : null },
    h034: function (event) { window.mostrarFormularioNuevaPrueba ? window.mostrarFormularioNuevaPrueba() : null },
    h035: function (event) { window.exportarHistorialCsv ? window.exportarHistorialCsv() : null },
    h036: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.cerrarModalSolicitarCambio() : null },
    h037: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.confirmarSolicitudCambio() : null },
    h038: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.cerrarModalResolverSolicitud() : null },
    h039: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.ejecutarResolucion('rechazada') : null },
    h040: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.ejecutarResolucion('aprobada') : null },
    h041: function (event) { window.closeModalInscripcionVoluntario ? window.closeModalInscripcionVoluntario() : null },
    h042: function (event) { window.saveInscripcionVoluntario ? window.saveInscripcionVoluntario(event) : null },
    h043: function (event) { window.PDI && window.PDI.VoluntariadosView ? window.PDI.VoluntariadosView.handleDistritoChange(this.value) : null },
    h044: function (event) { window.closeModalFichaVoluntario ? window.closeModalFichaVoluntario() : null },
    h045: function (event) { window.closeModalCapacitacionVoluntarias ? window.closeModalCapacitacionVoluntarias() : null },
    h046: function (event) { window.saveCapacitacionVoluntaria ? window.saveCapacitacionVoluntaria() : null },
    h047: function (event) { window.imprimirDocumentoA1 ? window.imprimirDocumentoA1() : window.print() },
    h048: function (event) { window.cerrarModalFichaA1 ? window.cerrarModalFichaA1() : null },
    h049: function (event) { window.closeSidebar ? window.closeSidebar(event) : null },
    h050: function (event) { window.toggleAuditLegalInfo ? window.toggleAuditLegalInfo(event) : null },
    h051: function (event) { window.filterAuditSearch ? window.filterAuditSearch(this.value) : (window.PDI?.AuditView?.filterBySearch ? window.PDI.AuditView.filterBySearch(this.value) : (window.PDI?.DashboardView?.filterBySearch ? window.PDI.DashboardView.filterBySearch(this.value) : null)) },
    h052: function (event) { window.clearAuditSearch ? window.clearAuditSearch() : null },
    h053: function (event) { window.openModalExportAudit ? window.openModalExportAudit() : null },
    h054: function (event) { window.toggleAuditAction },
    h055: function (event) { window.selectAuditDate },
    h056: function (event) { window.handleAuditDateManualInput ? window.handleAuditDateManualInput('specific', this) : null },
    h057: function (event) { window.handleAuditDatePickerChange ? window.handleAuditDatePickerChange('specific', this.value) : null },
    h058: function (event) { document.getElementById('pickerAuditSpecificDate').showPicker ? document.getElementById('pickerAuditSpecificDate').showPicker() : document.getElementById('pickerAuditSpecificDate').focus() },
    h059: function (event) { window.handleAuditDateManualInput ? window.handleAuditDateManualInput('range-start', this) : null },
    h060: function (event) { window.handleAuditDatePickerChange ? window.handleAuditDatePickerChange('range-start', this.value) : null },
    h061: function (event) { document.getElementById('pickerAuditRangeStart').showPicker ? document.getElementById('pickerAuditRangeStart').showPicker() : document.getElementById('pickerAuditRangeStart').focus() },
    h062: function (event) { window.handleAuditDateManualInput ? window.handleAuditDateManualInput('range-end', this) : null },
    h063: function (event) { window.handleAuditDatePickerChange ? window.handleAuditDatePickerChange('range-end', this.value) : null },
    h064: function (event) { document.getElementById('pickerAuditRangeEnd').showPicker ? document.getElementById('pickerAuditRangeEnd').showPicker() : document.getElementById('pickerAuditRangeEnd').focus() },
    h065: function (event) { window.toggleAuditRole },
    h066: function (event) { window.toggleAuditStatus },
    h067: function (event) { window.resetAuditFilters ? window.resetAuditFilters() : null },
    h068: function (event) { window.changeAuditPageSize ? window.changeAuditPageSize(this.value) : (window.PDI?.AuditView?.changePageSize ? window.PDI.AuditView.changePageSize(this.value) : (window.PDI?.DashboardView?.changePageSize ? window.PDI.DashboardView.changePageSize(this.value) : null)) },
    h069: function (event) { window.prevAuditPage ? window.prevAuditPage() : (window.PDI?.AuditView?.changePage ? window.PDI.AuditView.changePage((window.PDI.AuditView._auditCurrentPage || 1) - 1) : (window.PDI?.DashboardView?.changePage ? window.PDI.DashboardView.changePage((window.PDI.DashboardView._auditCurrentPage || 1) - 1) : null)) },
    h070: function (event) { window.nextAuditPage ? window.nextAuditPage() : (window.PDI?.AuditView?.changePage ? window.PDI.AuditView.changePage((window.PDI.AuditView._auditCurrentPage || 1) + 1) : (window.PDI?.DashboardView?.changePage ? window.PDI.DashboardView.changePage((window.PDI.DashboardView._auditCurrentPage || 1) + 1) : null)) },
    h071: function (event) { window.openNuevoColaborador ? window.openNuevoColaborador() : null },
    h072: function (event) { window.filterColabSearch ? window.filterColabSearch(this.value) : null },
    h073: function (event) { window.clearColabSearch ? window.clearColabSearch() : null },
    h074: function (event) { window.exportColaboradoresCSV ? window.exportColaboradoresCSV() : null },
    h075: function (event) { window.setFilterColabDistrito },
    h076: function (event) { window.setFilterColabEstrategia },
    h077: function (event) { window.resetColabFilters ? window.resetColabFilters() : null },
    h078: function (event) { window.cerrarModalColaborador ? window.cerrarModalColaborador() : null },
    h079: function (event) { window.casitasCambiarDia ? window.casitasCambiarDia(this.value) : null },
    h080: function (event) { window.casitasCambiarSede ? window.casitasCambiarSede(this.value) : null },
    h081: function (event) { window.casitasRecargarJornada ? window.casitasRecargarJornada() : null },
    h082: function (event) { window.casitasGuardarJornada ? window.casitasGuardarJornada() : null },
    h083: function (event) { window.filterCasitasSearch ? window.filterCasitasSearch(this.value) : (window.PDI?.CasitasView ? window.PDI.CasitasView.filterBySearch(this.value) : null) },
    h084: function (event) { window.clearCasitasSearch ? window.clearCasitasSearch() : (window.PDI?.CasitasView ? window.PDI.CasitasView.clearSearch() : null) },
    h085: function (event) { window.openModalExportEducativo ? window.openModalExportEducativo() : null },
    h086: function (event) { window.selectCasitasGrado },
    h087: function (event) { window.resetCasitasFilters ? window.resetCasitasFilters() : null },
    h088: function (event) { window.casitasSetPageSize ? window.casitasSetPageSize(this.value) : (window.PDI?.CasitasView?.setPageSize ? window.PDI.CasitasView.setPageSize(this.value) : null) },
    h089: function (event) { window.casitasPrevPage ? window.casitasPrevPage() : (window.PDI?.CasitasView?.prevPage ? window.PDI.CasitasView.prevPage() : null) },
    h090: function (event) { window.casitasNextPage ? window.casitasNextPage() : (window.PDI?.CasitasView?.nextPage ? window.PDI.CasitasView.nextPage() : null) },
    h091: function (event) { window.casitasCerrarMotivoFJ ? window.casitasCerrarMotivoFJ() : null },
    h092: function (event) { window.PDI?.CasitasView?._actualizarContadorMotivo?.() },
    h093: function (event) { window.casitasConfirmarMotivoFJ ? window.casitasConfirmarMotivoFJ() : null },
    h094: function (event) { window.desplazarExpediente ? window.desplazarExpediente(-1) : null },
    h095: function (event) { window.desplazarExpediente ? window.desplazarExpediente(1) : null },
    h096: function (event) { window.abrirModalFichaA1 ? window.abrirModalFichaA1() : null },
    h097: function (event) { window.print() },
    h098: function (event) { window.verFotoExpediente ? window.verFotoExpediente() : null },
    h099: function (event) { window.eliminarFotoExpediente ? window.eliminarFotoExpediente() : null },
    h100: function (event) { window.handleAddressInputDebounce ? window.handleAddressInputDebounce('exp') : null },
    h101: function (event) { window.abrirRegistroAtencionExpediente ? window.abrirRegistroAtencionExpediente() : null },
    h102: function (event) { deleteBeneficiarioExpediente() },
    h103: function (event) { reactivarBeneficiarioExpediente() },
    h104: function (event) { toggleEditExpediente() },
    h105: function (event) { saveExpedienteChanges() },
    h106: function (event) { window.togglePadronArchivo ? window.togglePadronArchivo() : null },
    h107: function (event) { window.openModalNuevoBeneficiario ? window.openModalNuevoBeneficiario() : (window.openModalNuevoUsuario ? window.openModalNuevoUsuario() : null) },
    h108: function (event) { window.filterPadronSearch ? window.filterPadronSearch(this.value) : null },
    h109: function (event) { window.clearPadronSearch ? window.clearPadronSearch() : null },
    h110: function (event) { window.openModalExportPadron ? window.openModalExportPadron() : window.exportDataCSV() },
    h111: function (event) { window.togglePadronSortMenu ? window.togglePadronSortMenu() : (window.toggleCustomDropdown ? window.toggleCustomDropdown('dropdownPadronSort') : null) },
    h112: function (event) { window.sortPadronOpcion ? window.sortPadronOpcion('apellido-asc') : null },
    h113: function (event) { window.sortPadronOpcion ? window.sortPadronOpcion('apellido-desc') : null },
    h114: function (event) { window.sortPadronOpcion ? window.sortPadronOpcion('sede-asc') : null },
    h115: function (event) { window.sortPadronOpcion ? window.sortPadronOpcion('edad-asc') : null },
    h116: function (event) { window.sortPadronOpcion ? window.sortPadronOpcion('edad-desc') : null },
    h117: function (event) { window.sortPadronOpcion ? window.sortPadronOpcion('creado-desc') : null },
    h118: function (event) { window.sortPadronOpcion ? window.sortPadronOpcion('creado-asc') : null },
    h119: function (event) { window.sortPadronOpcion ? window.sortPadronOpcion('actualizado-desc') : null },
    h120: function (event) { window.sortPadronOpcion ? window.sortPadronOpcion('actualizado-asc') : null },
    h121: function (event) { window.togglePadronEstrategia },
    h122: function (event) { window.togglePadronSede },
    h123: function (event) { window.togglePadronAnemia },
    h124: function (event) { window.clearPadronEdad ? window.clearPadronEdad() : null },
    h125: function (event) { window.setPadronEdadExacta ? window.setPadronEdadExacta(this.value) : null },
    h126: function (event) { window.syncPadronEdadRango ? window.syncPadronEdadRango('min', this.value) : null },
    h127: function (event) { window.syncPadronEdadRango ? window.syncPadronEdadRango('max', this.value) : null },
    h128: function (event) { window.selectPadronSexo },
    h129: function (event) { window.resetPadronFilters ? window.resetPadronFilters() : null },
    h130: function (event) { window.padronSetPageSize ? window.padronSetPageSize(this.value) : (window.PDI?.BeneficiariosView?.setPageSize ? window.PDI.BeneficiariosView.setPageSize(this.value) : null) },
    h131: function (event) { window.padronPrevPage ? window.padronPrevPage() : (window.PDI?.BeneficiariosView?.prevPage ? window.PDI.BeneficiariosView.prevPage() : null) },
    h132: function (event) { window.padronNextPage ? window.padronNextPage() : (window.PDI?.BeneficiariosView?.nextPage ? window.PDI.BeneficiariosView.nextPage() : null) },
    h133: function (event) { window.filterSaludSearch ? window.filterSaludSearch(this.value) : (window.PDI?.SaludCredView ? window.PDI.SaludCredView.filterBySearch(this.value) : null) },
    h134: function (event) { window.clearSaludSearch ? window.clearSaludSearch() : (window.PDI?.SaludCredView ? window.PDI.SaludCredView.clearSearch() : null) },
    h135: function (event) { window.openModalExportSalud ? window.openModalExportSalud() : null },
    h136: function (event) { window.toggleSaludAnemia },
    h137: function (event) { window.toggleSaludSede },
    h138: function (event) { window.selectSaludHb },
    h139: function (event) { window.resetSaludFilters ? window.resetSaludFilters() : null },
    h140: function (event) { window.saludSetPageSize ? window.saludSetPageSize(this.value) : (window.PDI?.SaludCredView?.setPageSize ? window.PDI.SaludCredView.setPageSize(this.value) : null) },
    h141: function (event) { window.saludPrevPage ? window.saludPrevPage() : (window.PDI?.SaludCredView?.prevPage ? window.PDI.SaludCredView.prevPage() : null) },
    h142: function (event) { window.saludNextPage ? window.saludNextPage() : (window.PDI?.SaludCredView?.nextPage ? window.PDI.SaludCredView.nextPage() : null) },
    h143: function (event) { window.filterSedesSearch ? window.filterSedesSearch(this.value) : null },
    h144: function (event) { window.clearSedesSearch ? window.clearSedesSearch() : null },
    h145: function (event) { window.openModalExportSedes ? window.openModalExportSedes() : null },
    h146: function (event) { window.filterSedesByDistrito },
    h147: function (event) { window.filterSedesByServicio },
    h148: function (event) { window.clearSedesFilters ? window.clearSedesFilters() : null },
    h149: function (event) { window.PDI?.SedesView?.cerrarDetalleMovil() },
    h150: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.handleSearch(this.value) : null },
    h151: function (event) { window.openModalExportSocial ? window.openModalExportSocial() : null },
    h152: function (event) { window.PDI?.SocialKanbanView?.filterByUrgencia },
    h153: function (event) { window.PDI?.SocialKanbanView?.filterBySede },
    h154: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.clearFilters() : null },
    h155: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.setMobileActiveStage('pendiente') : null },
    h156: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.setMobileActiveStage('evaluacion') : null },
    h157: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.setMobileActiveStage('canalizado') : null },
    h158: function (event) { window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.setMobileActiveStage('cerrado') : null },
    h159: function (event) { window.PDI?.SocialKanbanView?.toggleSimulador ? window.PDI.SocialKanbanView.toggleSimulador() : null },
    h160: function (event) { window.cargarCasoEnSimulador ? window.cargarCasoEnSimulador(this.value) : (window.PDI?.SocialController?.cargarCasoEnSimulador ? window.PDI.SocialController.cargarCasoEnSimulador(this.value) : null) },
    h161: function (event) { window.syncScoreSimulador('Ingreso', this.value) },
    h162: function (event) { window.syncScoreSimulador('Vivienda', this.value) },
    h163: function (event) { window.syncScoreSimulador('Soporte', this.value) },
    h164: function (event) { window.syncScoreSimulador('Empleo', this.value) },
    h165: function (event) { window.syncScoreSimulador('Instruccion', this.value) },
    h166: function (event) { window.syncScoreSimulador('SaludFam', this.value) },
    h167: function (event) { window.calcularEvaluacionSocioeconomica() },
    h168: function (event) { window.PDI?.SocialKanbanView?.switchSocialTab('kanban') },
    h169: function (event) { window.PDI?.SocialKanbanView?.renderVistaAutorizaciones() },
    h170: function (event) { window.PDI?.SocialKanbanView?.renderVistaMisSolicitudes() },
    h171: function (event) { window.openInscripcionVoluntario ? window.openInscripcionVoluntario() : null },
    h172: function (event) { window.clearVoluntariosSearch ? window.clearVoluntariosSearch() : (window.PDI?.VoluntariadosView?.clearSearch ? window.PDI.VoluntariadosView.clearSearch() : null) },
    h173: function (event) { window.openModalExportVoluntarios ? window.openModalExportVoluntarios() : window.exportVoluntariosCSV() },
    h174: function (event) { window.toggleVoluntariosDistrito },
    h175: function (event) { window.toggleVoluntariosServicio },
    h176: function (event) { window.toggleVoluntariosRol },
    h177: function (event) { window.toggleVoluntariosEstado },
    h178: function (event) { window.resetVoluntariosFilters ? window.resetVoluntariosFilters() : null },
    h179: function (event) { window.voluntariosSetPageSize ? window.voluntariosSetPageSize(this.value) : (window.PDI?.VoluntariadosView?.setPageSize ? window.PDI.VoluntariadosView.setPageSize(this.value) : null) },
    h180: function (event) { window.voluntariosPrevPage ? window.voluntariosPrevPage() : (window.PDI?.VoluntariadosView?.prevPage ? window.PDI.VoluntariadosView.prevPage() : null) },
    h181: function (event) { window.voluntariosNextPage ? window.voluntariosNextPage() : (window.PDI?.VoluntariadosView?.nextPage ? window.PDI.VoluntariadosView.nextPage() : null) }
  };

  function despachar(ev) {
    if (ev.__pdiDespachado) return;
    ev.__pdiDespachado = true;
    var nodo = ev.target;
    while (nodo && nodo.nodeType === 1) {
      var id = nodo.getAttribute && nodo.getAttribute('data-pdi-h');
      var tipo = nodo.getAttribute && nodo.getAttribute('data-pdi-on');
      if (!tipo || tipo === ev.type) {
        if (nodo.getAttribute && nodo.getAttribute('data-pdi-stop')) ev.stopPropagation();
        var crudoLlamadas = nodo.getAttribute && nodo.getAttribute('data-pdi-llamadas');
        if (crudoLlamadas) {
          var desc;
          try { desc = JSON.parse(crudoLlamadas); } catch (e) { desc = null; }
          if (desc && desc.llamadas) {
            for (var i = 0; i < desc.llamadas.length; i++) {
              var llamada = desc.llamadas[i];
              var objetivo = window;
              var partes = llamada.ruta.split('.');
              for (var j = 0; j < partes.length && objetivo; j++) objetivo = objetivo[partes[j]];
              if (typeof objetivo !== 'function') continue;
              var parametros = llamada.args.map(function (a) {
                return a === '@event' ? ev : a === '@this' ? nodo : a;
              });
              objetivo.apply(nodo, parametros);
              break;
            }
          }
        }
        if (id) {
          var fn = MANEJADORES[id];
          if (fn) fn.call(nodo, ev);
        }
        var nombre = nodo.getAttribute && nodo.getAttribute('data-pdi-call');
        if (nombre && typeof window[nombre] === 'function') {
          var crudo = nodo.getAttribute('data-pdi-args') || '[]';
          var args;
          try { args = JSON.parse(crudo); } catch (e) { args = []; }
          var resueltos = args.map(function (a) {
            return a === '@event' ? ev : a === '@this' ? nodo : a;
          });
          window[nombre].apply(nodo, resueltos);
        }
      }
      nodo = nodo.parentElement;
    }
  }

  var TIPOS = ["click","submit","change","input"];
  // Captura: los manejadores inline originales corrían en el propio objetivo,
  // antes de que otros listeners pudieran cortar la propagación. Registrar en
  // burbuja dejaba sin efecto los clics de filtros y orden.
  TIPOS.forEach(function (tipo) { document.addEventListener(tipo, despachar, true); });
})();
