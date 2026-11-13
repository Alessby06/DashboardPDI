// ===========================================================================
//  Vista: Acciones Socio-Educativas y Monitoreo (Casita del Saber - Ficha A5)
// ===========================================================================
//  Administra las pestañas de /educativo y los instrumentos de la Ficha A5:
//  - Pestaña 1: Jornada de Asistencia diaria (CasitasView)
//  - Pestaña 2: Acciones Socio-Educativas comunitarias, Monitoreo de Sede y Seguimiento
// ===========================================================================
import { AccionEducativaModel } from '../models/AccionEducativaModel.js';
import { BeneficiarioModel } from '../models/BeneficiarioModel.js';
import { ToastView } from './ToastView.js';
import { escapar } from '../utils/HtmlHelper.js';
import { CsvExporter } from '../utils/CsvExporter.js';

function porId(id) {
  return document.getElementById(id);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function usuarioActivo() {
  try {
    return {
      nombre: localStorage.getItem('pdi_usuario_nombre') || 'Facilitadora Casita',
      rol: localStorage.getItem('pdi_active_role') || 'facilitadora',
    };
  } catch {
    return { nombre: 'Facilitadora Casita', rol: 'facilitadora' };
  }
}

export const AccionesEducativasView = {
  _tabActiva: 'asistencia',
  _subseccionActiva: 'colectivas',
  _enlazado: false,

  init() {
    this.enlazarPestanas();
    this.enlazarFormularioAcciones();
    this.enlazarFormularioMonitoreo();
    this.enlazarSeguimientoModal();
    this.renderTablas();

    // Comprobar parámetro en URL
    const urlParams = new URLSearchParams(window.location.search);
    const subview = urlParams.get('subview');
    if (subview === 'acciones' || subview === 'monitoreo') {
      this.cambiarPestana('acciones');
      if (subview === 'monitoreo') {
        this.cambiarSubseccion('monitoreo');
      }
    }
  },

  enlazarPestanas() {
    const btnAsistencia = porId('tabBtnEducativoAsistencia');
    const btnAcciones = porId('tabBtnEducativoAcciones');

    if (btnAsistencia) {
      btnAsistencia.addEventListener('click', () => this.cambiarPestana('asistencia'));
    }
    if (btnAcciones) {
      btnAcciones.addEventListener('click', () => this.cambiarPestana('acciones'));
    }

    const btnSubColectivas = porId('btnSubSecColectivas');
    const btnSubMonitoreo = porId('btnSubSecMonitoreo');
    const btnSubSeguimiento = porId('btnSubSecSeguimiento');

    if (btnSubColectivas) {
      btnSubColectivas.addEventListener('click', () => this.cambiarSubseccion('colectivas'));
    }
    if (btnSubMonitoreo) {
      btnSubMonitoreo.addEventListener('click', () => this.cambiarSubseccion('monitoreo'));
    }
    if (btnSubSeguimiento) {
      btnSubSeguimiento.addEventListener('click', () => this.cambiarSubseccion('seguimiento'));
    }

    const btnExportAcciones = porId('btnExportAccionesCSV');
    if (btnExportAcciones) {
      btnExportAcciones.addEventListener('click', () => this.exportarAccionesCSV());
    }

    const btnExportMonitoreo = porId('btnExportMonitoreoCSV');
    if (btnExportMonitoreo) {
      btnExportMonitoreo.addEventListener('click', () => this.exportarMonitoreoCSV());
    }
  },

  cambiarPestana(tab) {
    this._tabActiva = tab;
    const btnAsistencia = porId('tabBtnEducativoAsistencia');
    const btnAcciones = porId('tabBtnEducativoAcciones');
    const viewAsistencia = porId('viewEducativoAsistencia');
    const viewAcciones = porId('viewEducativoAcciones');

    if (btnAsistencia) btnAsistencia.classList.toggle('active', tab === 'asistencia');
    if (btnAcciones) btnAcciones.classList.toggle('active', tab === 'acciones');

    if (viewAsistencia) viewAsistencia.style.display = tab === 'asistencia' ? '' : 'none';
    if (viewAcciones) viewAcciones.style.display = tab === 'acciones' ? '' : 'none';

    // Actualizar URL de forma limpia
    try {
      const url = new URL(window.location);
      if (tab === 'acciones') {
        url.searchParams.set('subview', 'acciones');
      } else {
        url.searchParams.delete('subview');
      }
      window.history.replaceState({}, '', url);
    } catch (e) {}

    if (tab === 'acciones') {
      this.renderTablas();
    }
  },

  cambiarSubseccion(sub) {
    this._subseccionActiva = sub;
    const btnSubColectivas = porId('btnSubSecColectivas');
    const btnSubMonitoreo = porId('btnSubSecMonitoreo');
    const btnSubSeguimiento = porId('btnSubSecSeguimiento');

    const secColectivas = porId('secEducativoColectivas');
    const secMonitoreo = porId('secEducativoMonitoreo');
    const secSeguimiento = porId('secEducativoSeguimiento');

    if (btnSubColectivas) btnSubColectivas.classList.toggle('active', sub === 'colectivas');
    if (btnSubMonitoreo) btnSubMonitoreo.classList.toggle('active', sub === 'monitoreo');
    if (btnSubSeguimiento) btnSubSeguimiento.classList.toggle('active', sub === 'seguimiento');

    if (secColectivas) secColectivas.style.display = sub === 'colectivas' ? '' : 'none';
    if (secMonitoreo) secMonitoreo.style.display = sub === 'monitoreo' ? '' : 'none';
    if (secSeguimiento) secSeguimiento.style.display = sub === 'seguimiento' ? '' : 'none';
  },

  // --- FORMULARIO ACCIONES COLECTIVAS (HOJA 3) ---
  enlazarFormularioAcciones() {
    const form = porId('formAccionSocioeducativa');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    // Precargar fecha y facilitadora
    const inputFecha = porId('aseFecha');
    if (inputFecha && !inputFecha.value) inputFecha.value = hoyISO();

    const inputFac = porId('aseFacilitadora');
    if (inputFac && !inputFac.value) inputFac.value = usuarioActivo().nombre;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sede = porId('aseSede')?.value;
      if (!sede) {
        ToastView.show('Selecciona una sede', 'La sede de la acción colectiva es obligatoria', 'warning');
        return;
      }

      // Checkboxes de acciones
      const acciones = [];
      document.querySelectorAll('input[name="chkAccionEducativa"]:checked').forEach(chk => {
        acciones.push(chk.value);
      });

      if (!acciones.length) {
        ToastView.show('Selecciona al menos una acción', 'Debes marcar al menos una actividad formativa o comunitaria', 'warning');
        return;
      }

      const adultos = parseInt(porId('aseAdultos')?.value || '0', 10);
      const ninos = parseInt(porId('aseNinos')?.value || '0', 10);
      const canastas = parseInt(porId('aseCanastas')?.value || '0', 10);
      const distrito = porId('aseDistrito')?.value || 'Comas';
      const modalidad = porId('aseModalidad')?.value || 'Comunitaria';
      const estrategia = porId('aseEstrategia')?.value || 'Atención fija';
      const facilitadora = porId('aseFacilitadora')?.value || usuarioActivo().nombre;
      const fecha = porId('aseFecha')?.value || hoyISO();
      const obs = porId('aseObservaciones')?.value || '';

      AccionEducativaModel.guardarAccion({
        fecha,
        sede,
        distrito,
        modalidad,
        estrategia,
        facilitadora,
        acciones,
        participantesAdultos: adultos,
        participantesNinos: ninos,
        canastas,
        observaciones: obs,
      });

      ToastView.show('Acción registrada', `Se guardó la actividad con ${ninos} niños y ${canastas} canastas en ${sede}`, 'success');
      form.reset();
      if (inputFecha) inputFecha.value = hoyISO();
      if (inputFac) inputFac.value = usuarioActivo().nombre;
      this.renderTablaAcciones();
    });
  },

  // --- FORMULARIO MONITOREO DE ESPACIOS (HOJA 1) ---
  enlazarFormularioMonitoreo() {
    const form = porId('formMonitoreoSede');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const inputFecha = porId('monFecha');
    if (inputFecha && !inputFecha.value) inputFecha.value = hoyISO();

    const inputFac = porId('monFacilitadora');
    if (inputFac && !inputFac.value) inputFac.value = usuarioActivo().nombre;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sede = porId('monSede')?.value;
      if (!sede) {
        ToastView.show('Selecciona una sede', 'El lugar de monitoreo es obligatorio', 'warning');
        return;
      }

      const items = {
        espacio: Boolean(porId('chkMonEspacio')?.checked),
        promotora: Boolean(porId('chkMonPromotora')?.checked),
        usuarios: Boolean(porId('chkMonUsuarios')?.checked),
        cuidadores: Boolean(porId('chkMonCuidadores')?.checked),
      };

      const distrito = porId('monDistrito')?.value || 'Comas';
      const facilitadora = porId('monFacilitadora')?.value || usuarioActivo().nombre;
      const fecha = porId('monFecha')?.value || hoyISO();
      const detalle = porId('monDetalle')?.value || '';

      AccionEducativaModel.guardarMonitoreo({
        fecha,
        sede,
        distrito,
        facilitadora,
        items,
        observacionesDetalle: detalle,
      });

      ToastView.show('Monitoreo guardado', `Supervisión de ${sede} registrada correctamente`, 'success');
      form.reset();
      if (inputFecha) inputFecha.value = hoyISO();
      if (inputFac) inputFac.value = usuarioActivo().nombre;
      this.renderTablaMonitoreos();
    });
  },

  // --- SEGUIMIENTO INDIVIDUAL SOCIO-EDUCATIVO (HOJA 2) ---
  enlazarSeguimientoModal() {
    const form = porId('formSeguimientoIndividual');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    // Llenar selector de usuarios
    this.actualizarSelectorUsuarios();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectUser = porId('segBeneficiarioSelect');
      const benefId = selectUser?.value;
      if (!benefId) {
        ToastView.show('Selecciona un usuario', 'Debes elegir el niño/a para el seguimiento', 'warning');
        return;
      }

      const optSelected = selectUser.options[selectUser.selectedIndex];
      const benefNombre = optSelected ? optSelected.text : 'Usuario';

      const acciones = [];
      document.querySelectorAll('input[name="chkAccionSeguimiento"]:checked').forEach(chk => {
        acciones.push(chk.value);
      });

      if (!acciones.length) {
        ToastView.show('Selecciona al menos una acción', 'Marca al menos una acción realizada', 'warning');
        return;
      }

      const fecha = porId('segFecha')?.value || hoyISO();
      const sede = porId('segSede')?.value || 'Central';
      const distrito = porId('segDistrito')?.value || 'Comas';
      const modalidad = porId('segModalidad')?.value || 'Comunitaria';
      const estrategia = porId('segEstrategia')?.value || 'Atención fija';
      const facilitadora = porId('segFacilitadora')?.value || usuarioActivo().nombre;
      const notas = porId('segNotas')?.value || '';

      AccionEducativaModel.guardarSeguimiento({
        fecha,
        sede,
        distrito,
        modalidad,
        estrategia,
        facilitadora,
        beneficiarioId: benefId,
        beneficiarioNombre: benefNombre,
        acciones,
        notas,
      });

      ToastView.show('Seguimiento guardado', `Acciones registradas para ${benefNombre}`, 'success');

      // Si incluye derivación ASP, ofrecer abrir el flujo formal de derivación
      if (acciones.includes('Derivación ASP')) {
        const confirmarDerivacion = window.confirm(
          `Has marcado "Derivación ASP" para ${benefNombre}.\n¿Deseas abrir la ficha de derivación formal ahora?`
        );
        if (confirmarDerivacion) {
          const btnDerivar = porId('btnNuevaDerivacion');
          if (btnDerivar) {
            btnDerivar.click();
          } else if (window.PDI?.DerivacionView?.abrir) {
            window.PDI.DerivacionView.abrir(benefId);
          }
        }
      }

      form.reset();
      this.renderTablaSeguimiento();
    });
  },

  actualizarSelectorUsuarios() {
    const select = porId('segBeneficiarioSelect');
    if (!select) return;

    const beneficiarios = BeneficiarioModel.getAll();
    select.innerHTML = '<option value="">Selecciona un usuario de Casita del Saber...</option>';

    beneficiarios.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `${b.apellidos}, ${b.nombres} (${b.codigo || b.dni || 'Sin código'}) - Sede: ${b.sede || 'Sin sede'}`;
      select.appendChild(opt);
    });
  },

  // --- RENDERIZADO DE TABLAS ---
  renderTablas() {
    this.renderTablaAcciones();
    this.renderTablaMonitoreos();
    this.renderTablaSeguimiento();
  },

  renderTablaAcciones() {
    const tbody = porId('tbodyAccionesColectivas');
    if (!tbody) return;

    const lista = AccionEducativaModel.getAllAcciones();
    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-dim);">
            No hay acciones socio-educativas comunitarias registradas. Utiliza el formulario superior para registrar una sesión.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista.map(item => `
      <tr class="padron-tr">
        <td style="font-weight: 600; color: var(--text-main);">${escapar(item.fecha)}</td>
        <td>
          <span class="padron-tag padron-tag-sede">${escapar(item.sede)}</span>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">${escapar(item.distrito)} · ${escapar(item.modalidad)}</div>
        </td>
        <td>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${(item.acciones || []).map(a => `<span class="badge" style="background: var(--gt-green-bg); color: var(--gt-green); font-size: 11px; padding: 2px 6px; border-radius: 4px;">${escapar(a)}</span>`).join('')}
          </div>
          ${item.observaciones ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; font-style: italic;">${escapar(item.observaciones)}</div>` : ''}
        </td>
        <td style="text-align: center; font-weight: 600;">${item.participantesAdultos}</td>
        <td style="text-align: center; font-weight: 600; color: var(--gt-green);">${item.participantesNinos}</td>
        <td style="text-align: center; font-weight: 700; color: var(--gt-yellow);">${item.canastas}</td>
        <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.facilitadora || item.creadoPor)}</td>
      </tr>
    `).join('');
  },

  renderTablaMonitoreos() {
    const tbody = porId('tbodyMonitoreoEspacios');
    if (!tbody) return;

    const lista = AccionEducativaModel.getAllMonitoreos();
    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-dim);">
            No hay monitoreos de sedes registrados. Utiliza el formulario para registrar la supervisión de un espacio.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista.map(item => {
      const items = item.observacionesItems || {};
      return `
        <tr class="padron-tr">
          <td style="font-weight: 600; color: var(--text-main);">${escapar(item.fecha)}</td>
          <td>
            <span class="padron-tag padron-tag-sede">${escapar(item.sede)}</span>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">${escapar(item.distrito)}</div>
          </td>
          <td>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${items.espacio ? '<span class="badge" style="background: var(--gt-blue-bg); color: var(--gt-blue); font-size: 11px; padding: 2px 6px; border-radius: 4px;">Espacio / Infraestructura</span>' : ''}
              ${items.promotora ? '<span class="badge" style="background: var(--gt-green-bg); color: var(--gt-green); font-size: 11px; padding: 2px 6px; border-radius: 4px;">Promotora Educativa</span>' : ''}
              ${items.usuarios ? '<span class="badge" style="background: var(--gt-yellow-bg); color: var(--gt-yellow); font-size: 11px; padding: 2px 6px; border-radius: 4px;">Usuarios / NNA</span>' : ''}
              ${items.cuidadores ? '<span class="badge" style="background: var(--chip-green-bg); color: var(--brand-green-deep); font-size: 11px; padding: 2px 6px; border-radius: 4px;">Cuidadores / Familias</span>' : ''}
            </div>
          </td>
          <td style="font-size: 12.5px; color: var(--text-main);">${escapar(item.observacionesDetalle || 'Sin observaciones adicionales')}</td>
          <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.facilitadora || item.creadoPor)}</td>
        </tr>
      `;
    }).join('');
  },

  renderTablaSeguimiento() {
    const tbody = porId('tbodySeguimientoUsuarios');
    if (!tbody) return;

    const lista = AccionEducativaModel.getAllSeguimientos();
    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-dim);">
            No hay registros de seguimiento socio-educativo individual.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista.map(item => `
      <tr class="padron-tr">
        <td style="font-weight: 600; color: var(--text-main);">${escapar(item.fecha)}</td>
        <td style="font-weight: 600; color: var(--text-main);">${escapar(item.beneficiarioNombre)}</td>
        <td>
          <span class="padron-tag padron-tag-sede">${escapar(item.sede)}</span>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">${escapar(item.distrito)} · ${escapar(item.modalidad)}</div>
        </td>
        <td>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${(item.acciones || []).map(a => {
              const esDerivacion = a.includes('Derivación');
              const bg = esDerivacion ? 'var(--gt-red-bg)' : 'var(--gt-green-bg)';
              const col = esDerivacion ? 'var(--gt-red)' : 'var(--gt-green)';
              return `<span class="badge" style="background: ${bg}; color: ${col}; font-size: 11px; padding: 2px 6px; border-radius: 4px;">${escapar(a)}</span>`;
            }).join('')}
          </div>
          ${item.notas ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">${escapar(item.notas)}</div>` : ''}
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.facilitadora || item.creadoPor)}</td>
      </tr>
    `).join('');
  },

  exportarAccionesCSV() {
    const lista = AccionEducativaModel.getAllAcciones();
    if (!lista.length) {
      ToastView.show('Sin datos', 'No hay acciones registradas para exportar', 'warning');
      return;
    }
    const headers = ['ID', 'Fecha', 'Sede', 'Distrito', 'Modalidad', 'Estrategia', 'Acciones', 'Adultos', 'Niños', 'Canastas', 'Observaciones', 'Facilitadora'];
    const rows = lista.map(item => [
      item.id,
      item.fecha,
      item.sede,
      item.distrito,
      item.modalidad,
      item.estrategia,
      (item.acciones || []).join('; '),
      item.participantesAdultos,
      item.participantesNinos,
      item.canastas,
      item.observaciones,
      item.facilitadora,
    ]);
    CsvExporter._descargar(`Acciones_SocioEducativas_Casita_${hoyISO()}.csv`, headers, rows);
    ToastView.show('Descarga iniciada', 'Reporte CSV de acciones socio-educativas descargado', 'success');
  },

  exportarMonitoreoCSV() {
    const lista = AccionEducativaModel.getAllMonitoreos();
    if (!lista.length) {
      ToastView.show('Sin datos', 'No hay monitoreos registrados para exportar', 'warning');
      return;
    }
    const headers = ['ID', 'Fecha', 'Sede', 'Distrito', 'Obs Espacio', 'Obs Promotora', 'Obs Usuarios', 'Obs Cuidadores', 'Detalle', 'Facilitadora'];
    const rows = lista.map(item => [
      item.id,
      item.fecha,
      item.sede,
      item.distrito,
      item.observacionesItems?.espacio ? 'SÍ' : 'NO',
      item.observacionesItems?.promotora ? 'SÍ' : 'NO',
      item.observacionesItems?.usuarios ? 'SÍ' : 'NO',
      item.observacionesItems?.cuidadores ? 'SÍ' : 'NO',
      item.observacionesDetalle,
      item.facilitadora,
    ]);
    CsvExporter._descargar(`Monitoreo_Lugares_Atencion_Casita_${hoyISO()}.csv`, headers, rows);
    ToastView.show('Descarga iniciada', 'Reporte CSV de monitoreo descargado', 'success');
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.AccionesEducativasView = AccionesEducativasView;
}
