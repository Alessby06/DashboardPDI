// ===========================================================================
//  Vista: Acciones Nutricionales, Monitoreo y Campañas (Desayuno Infantil - Ficha A6)
// ===========================================================================
//  Administra las subvistas y los 4 instrumentos operativos de la Ficha A6:
//  - Pestaña 1: Control antropométrico individual CRED (SaludCredView)
//  - Pestaña 2: Monitoreo de reparto, capacitaciones, sesiones y campañas CRED
// ===========================================================================
import { AccionNutricionalModel } from '../models/AccionNutricionalModel.js';
import { BeneficiarioModel } from '../models/BeneficiarioModel.js';
import { ToastView } from './ToastView.js';
import { escapar } from '../utils/HtmlHelper.js';
import { CsvExporter } from '../utils/CsvExporter.js';
import { confirmar } from '../ui/confirmacion.js';

function porId(id) {
  return document.getElementById(id);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function usuarioActivo() {
  try {
    return {
      nombre: localStorage.getItem('pdi_usuario_nombre') || 'Facilitadora Nutricional',
      rol: localStorage.getItem('pdi_active_role') || 'facilitadora',
    };
  } catch {
    return { nombre: 'Facilitadora Nutricional', rol: 'facilitadora' };
  }
}

export const AccionesNutricionalesView = {
  _tabActiva: 'individual',
  _subseccionActiva: 'monitoreo',

  init() {
    this.enlazarPestanasPrincipales();
    this.enlazarSubsecciones();
    this.enlazarFormularioMonitoreo();
    this.enlazarFormularioCapacitacion();
    this.enlazarFormularioSesionFamilias();
    this.enlazarFormularioCampanaSalud();
    this.actualizarSelectorUsuarios();
    this.renderTodasLasTablas();

    // Comprobar parámetro en URL
    const urlParams = new URLSearchParams(window.location.search);
    const subview = urlParams.get('subview');
    if (subview === 'colectiva' || subview === 'campanas' || subview === 'capacitaciones') {
      this.cambiarPestanaPrincipal('colectiva');
      if (subview === 'campanas') this.cambiarSubseccion('campanas');
      if (subview === 'capacitaciones') this.cambiarSubseccion('capacitaciones');
    }
  },

  enlazarPestanasPrincipales() {
    const btnInd = porId('tabBtnSaludIndividual');
    const btnCol = porId('tabBtnSaludColectiva');

    if (btnInd) {
      btnInd.addEventListener('click', () => this.cambiarPestanaPrincipal('individual'));
    }
    if (btnCol) {
      btnCol.addEventListener('click', () => this.cambiarPestanaPrincipal('colectiva'));
    }

    const btnExportMon = porId('btnExportMonitoreoRepartoCSV');
    if (btnExportMon) {
      btnExportMon.addEventListener('click', () => this.exportarMonitoreoCSV());
    }

    const btnExportCap = porId('btnExportCapacitacionesCSV');
    if (btnExportCap) {
      btnExportCap.addEventListener('click', () => this.exportarCapacitacionesCSV());
    }

    const btnExportSes = porId('btnExportSesionesFamiliasCSV');
    if (btnExportSes) {
      btnExportSes.addEventListener('click', () => this.exportarSesionesFamiliasCSV());
    }

    const btnExportCam = porId('btnExportCampanasSaludCSV');
    if (btnExportCam) {
      btnExportCam.addEventListener('click', () => this.exportarCampanasSaludCSV());
    }
  },

  cambiarPestanaPrincipal(tab) {
    this._tabActiva = tab;
    const btnInd = porId('tabBtnSaludIndividual');
    const btnCol = porId('tabBtnSaludColectiva');
    const viewInd = porId('viewSaludIndividual');
    const viewCol = porId('viewSaludColectiva');

    if (btnInd) btnInd.classList.toggle('active', tab === 'individual');
    if (btnCol) btnCol.classList.toggle('active', tab === 'colectiva');

    if (viewInd) viewInd.style.display = tab === 'individual' ? '' : 'none';
    if (viewCol) viewCol.style.display = tab === 'colectiva' ? '' : 'none';

    try {
      const url = new URL(window.location);
      if (tab === 'colectiva') {
        url.searchParams.set('subview', 'colectiva');
      } else {
        url.searchParams.delete('subview');
      }
      window.history.replaceState({}, '', url);
    } catch (e) {}

    if (tab === 'colectiva') {
      this.renderTodasLasTablas();
    }
  },

  enlazarSubsecciones() {
    const botones = [
      { id: 'btnSubSaludMonitoreo', sub: 'monitoreo' },
      { id: 'btnSubSaludCapacitacion', sub: 'capacitacion' },
      { id: 'btnSubSaludSesiones', sub: 'sesiones' },
      { id: 'btnSubSaludCampanas', sub: 'campanas' },
    ];

    botones.forEach(({ id, sub }) => {
      const btn = porId(id);
      if (btn) {
        btn.addEventListener('click', () => this.cambiarSubseccion(sub));
      }
    });
  },

  cambiarSubseccion(sub) {
    this._subseccionActiva = sub;

    const botones = {
      monitoreo: porId('btnSubSaludMonitoreo'),
      capacitacion: porId('btnSubSaludCapacitacion'),
      sesiones: porId('btnSubSaludSesiones'),
      campanas: porId('btnSubSaludCampanas'),
    };

    const secciones = {
      monitoreo: porId('secSaludMonitoreo'),
      capacitacion: porId('secSaludCapacitacion'),
      sesiones: porId('secSaludSesiones'),
      campanas: porId('secSaludCampanas'),
    };

    Object.keys(botones).forEach(k => {
      if (botones[k]) botones[k].classList.toggle('active', k === sub);
      if (secciones[k]) secciones[k].style.display = k === sub ? '' : 'none';
    });
  },

  // --- 1. MONITOREO DE REPARTO E INOCUIDAD (HOJA 1) ---
  enlazarFormularioMonitoreo() {
    const form = porId('formMonitoreoReparto');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const inputFecha = porId('monRepFecha');
    if (inputFecha && !inputFecha.value) inputFecha.value = hoyISO();

    const inputFac = porId('monRepFacilitadora');
    if (inputFac && !inputFac.value) inputFac.value = usuarioActivo().nombre;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sede = porId('monRepSede')?.value;
      if (!sede) {
        ToastView.show('Selecciona una sede', 'El lugar de reparto es obligatorio', 'warning');
        return;
      }

      const items = {
        incidenteAlimentos: Boolean(porId('chkIncidenteAlim')?.checked),
        sobraronRaciones: Boolean(porId('chkSobroRaciones')?.checked),
        inadecuadaManipulacion: Boolean(porId('chkInadecuadaManip')?.checked),
        baldesBolsasPiso: Boolean(porId('chkBaldesPiso')?.checked),
        ambienteSucio: Boolean(porId('chkAmbienteSucio')?.checked),
      };

      const distrito = porId('monRepDistrito')?.value || 'Comas';
      const modalidad = porId('monRepModalidad')?.value || 'Comunitaria';
      const estrategia = porId('monRepEstrategia')?.value || 'Desayuno Infantil';
      const facilitadora = porId('monRepFacilitadora')?.value || usuarioActivo().nombre;
      const fecha = porId('monRepFecha')?.value || hoyISO();
      const familias = parseInt(porId('monRepFamiliasOrientadas')?.value || '0', 10);
      const obs = porId('monRepObservaciones')?.value || '';

      AccionNutricionalModel.guardarMonitoreo({
        fecha,
        sede,
        distrito,
        modalidad,
        estrategia,
        facilitadora,
        items,
        familiasOrientadas: familias,
        observacionesDetalle: obs,
      });

      ToastView.show('Monitoreo registrado', `Supervisión de reparto en ${sede} guardada exitosamente`, 'success');
      form.reset();
      if (inputFecha) inputFecha.value = hoyISO();
      if (inputFac) inputFac.value = usuarioActivo().nombre;
      this.renderTablaMonitoreos();
    });
  },

  // --- 2. CAPACITACIONES A VOLUNTARIAS (HOJA 2) ---
  enlazarFormularioCapacitacion() {
    const form = porId('formCapacitacionVoluntarias');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const inputFecha = porId('capVolFecha');
    if (inputFecha && !inputFecha.value) inputFecha.value = hoyISO();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sede = porId('capVolSede')?.value;
      if (!sede) {
        ToastView.show('Selecciona una sede', 'El lugar de la capacitación es obligatorio', 'warning');
        return;
      }

      const tematicas = [];
      document.querySelectorAll('input[name="chkCapTematica"]:checked').forEach(chk => {
        tematicas.push(chk.value);
      });

      if (!tematicas.length) {
        ToastView.show('Selecciona temáticas', 'Debes marcar al menos un tema abordado en la capacitación', 'warning');
        return;
      }

      const fecha = porId('capVolFecha')?.value || hoyISO();
      const distrito = porId('capVolDistrito')?.value || 'Comas';
      const participantes = parseInt(porId('capVolParticipantes')?.value || '0', 10);
      const canastas = parseInt(porId('capVolCanastas')?.value || '0', 10);
      const lugares = porId('capVolLugaresParticipantes')?.value || sede;
      const obs = porId('capVolObservaciones')?.value || '';

      AccionNutricionalModel.guardarCapacitacion({
        fecha,
        sede,
        distrito,
        tematicas,
        participantes,
        lugaresParticipantes: lugares,
        canastas,
        observaciones: obs,
      });

      ToastView.show('Capacitación registrada', `Jornada para voluntarias en ${sede} guardada con éxito`, 'success');
      form.reset();
      if (inputFecha) inputFecha.value = hoyISO();
      this.renderTablaCapacitaciones();
    });
  },

  // --- 3. SESIONES EDUCATIVAS A FAMILIAS (HOJA 3) ---
  enlazarFormularioSesionFamilias() {
    const form = porId('formSesionEducativaFamilias');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const inputFecha = porId('sesFamFecha');
    if (inputFecha && !inputFecha.value) inputFecha.value = hoyISO();

    const inputFac = porId('sesFamFacilitadora');
    if (inputFac && !inputFac.value) inputFac.value = usuarioActivo().nombre;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sede = porId('sesFamSede')?.value;
      if (!sede) {
        ToastView.show('Selecciona una sede', 'El lugar de la sesión es obligatorio', 'warning');
        return;
      }

      const tematicas = [];
      document.querySelectorAll('input[name="chkSesTematica"]:checked').forEach(chk => {
        tematicas.push(chk.value);
      });

      if (!tematicas.length) {
        ToastView.show('Selecciona temáticas', 'Marca al menos una temática abordada con las familias', 'warning');
        return;
      }

      const fecha = porId('sesFamFecha')?.value || hoyISO();
      const distrito = porId('sesFamDistrito')?.value || 'Comas';
      const modalidad = porId('sesFamModalidad')?.value || 'Comunitaria';
      const estrategia = porId('sesFamEstrategia')?.value || 'Desayuno Infantil';
      const facilitadora = porId('sesFamFacilitadora')?.value || usuarioActivo().nombre;
      const adultos = parseInt(porId('sesFamAdultos')?.value || '0', 10);
      const ninos = parseInt(porId('sesFamNinos')?.value || '0', 10);
      const canastas = parseInt(porId('sesFamCanastas')?.value || '0', 10);
      const obs = porId('sesFamObservaciones')?.value || '';

      AccionNutricionalModel.guardarSesionFamilia({
        fecha,
        sede,
        distrito,
        modalidad,
        estrategia,
        facilitadora,
        tematicas,
        participantesAdultos: adultos,
        participantesNinos: ninos,
        canastas,
        observaciones: obs,
      });

      ToastView.show('Sesión guardada', `Taller con ${adultos} adultos y ${canastas} canastas en ${sede}`, 'success');
      form.reset();
      if (inputFecha) inputFecha.value = hoyISO();
      if (inputFac) inputFac.value = usuarioActivo().nombre;
      this.renderTablaSesionesFamilias();
    });
  },

  // --- 4. CAMPAÑAS INTEGRALES CRED (HOJA 4) ---
  enlazarFormularioCampanaSalud() {
    const form = porId('formCampanaSaludCred');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const inputFecha = porId('camSalFecha');
    if (inputFecha && !inputFecha.value) inputFecha.value = hoyISO();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selectUser = porId('camSalBeneficiarioSelect');
      const benefId = selectUser?.value;
      if (!benefId) {
        ToastView.show('Selecciona un usuario', 'Debes elegir el niño/a atendido en la campaña', 'warning');
        return;
      }

      const opt = selectUser.options[selectUser.selectedIndex];
      const benefNombre = opt ? opt.text : 'Usuario';

      const intervenciones = [];
      document.querySelectorAll('input[name="chkCamIntervencion"]:checked').forEach(chk => {
        intervenciones.push(chk.value);
      });

      const fecha = porId('camSalFecha')?.value || hoyISO();
      const sede = porId('camSalSede')?.value || 'Central';
      const distrito = porId('camSalDistrito')?.value || 'Comas';
      const modalidad = porId('camSalModalidad')?.value || 'Comunitaria';
      const estrategia = porId('camSalEstrategia')?.value || 'Desayuno Infantil';
      const eess = porId('camSalEstablecimiento')?.value || 'Posta Local';
      const resultadoHb = porId('camSalResultadoHb')?.value || 'Regular';
      const obs = porId('camSalObservaciones')?.value || '';

      AccionNutricionalModel.guardarCampanaSalud({
        fecha,
        sede,
        distrito,
        modalidad,
        estrategia,
        establecimientoSalud: eess,
        beneficiarioId: benefId,
        beneficiarioNombre: benefNombre,
        resultadoHb,
        intervenciones,
        observaciones: obs,
      });

      ToastView.show('Atención registrada', `Evaluación en campaña para ${benefNombre} guardada con éxito`, 'success');

      // Si incluye derivación ASP, activar flujo
      if (intervenciones.includes('Derivación ASP')) {
        const confirmarDeriv = await confirmar({
          titulo: 'Derivación ASP',
          mensaje: `Has seleccionado "Derivación ASP" para ${benefNombre}.\n¿Deseas abrir la ficha de derivación formal ahora?`,
          confirmar: 'Abrir derivación',
          cancelar: 'En otro momento',
        });
        if (confirmarDeriv) {
          const btnDerivar = porId('btnNuevaDerivacion');
          if (btnDerivar) {
            btnDerivar.click();
          } else if (window.PDI?.DerivacionView?.abrir) {
            window.PDI.DerivacionView.abrir(benefId);
          }
        }
      }

      form.reset();
      if (inputFecha) inputFecha.value = hoyISO();
      this.renderTablaCampanasSalud();
    });
  },

  actualizarSelectorUsuarios() {
    const select = porId('camSalBeneficiarioSelect');
    if (!select) return;

    const beneficiarios = BeneficiarioModel.getAll();
    select.innerHTML = '<option value="">Selecciona un usuario para la campaña CRED...</option>';

    beneficiarios.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `${b.apellidos}, ${b.nombres} (${b.codigo || b.dni || 'Sin código'}) - Sede: ${b.sede || 'Sin sede'}`;
      select.appendChild(opt);
    });
  },

  // --- RENDERIZADO DE TABLAS HISTÓRICAS ---
  renderTodasLasTablas() {
    this.renderTablaMonitoreos();
    this.renderTablaCapacitaciones();
    this.renderTablaSesionesFamilias();
    this.renderTablaCampanasSalud();
  },

  renderTablaMonitoreos() {
    const tbody = porId('tbodyMonitoreoReparto');
    if (!tbody) return;

    const lista = AccionNutricionalModel.getAllMonitoreos();
    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-dim);">
            No hay registros de monitoreo de reparto. Utiliza el formulario superior para registrar la supervisión de un punto de entrega.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista.map(item => {
      const o = item.observacionesItems || {};
      const hallazgos = [];
      if (o.incidenteAlimentos) hallazgos.push('<span class="badge" style="background:var(--gt-red-bg); color:var(--gt-red); font-size:11px;">Incidente Alimentos</span>');
      if (o.sobraronRaciones) hallazgos.push('<span class="badge" style="background:var(--gt-yellow-bg); color:var(--gt-yellow); font-size:11px;">Sobraron Raciones</span>');
      if (o.inadecuadaManipulacion) hallazgos.push('<span class="badge" style="background:var(--gt-orange-bg); color:var(--gt-orange); font-size:11px;">Manipulación Inadecuada</span>');
      if (o.baldesBolsasPiso) hallazgos.push('<span class="badge" style="background:var(--gt-orange-bg); color:var(--gt-orange); font-size:11px;">Alimentos en Piso</span>');
      if (o.ambienteSucio) hallazgos.push('<span class="badge" style="background:var(--gt-red-bg); color:var(--gt-red); font-size:11px;">Ambiente Sucio</span>');
      if (!hallazgos.length) hallazgos.push('<span class="badge" style="background:var(--gt-green-bg); color:var(--gt-green); font-size:11px;">Conforme / Sin Incidentes</span>');

      return `
        <tr class="padron-tr">
          <td style="font-weight: 600; color: var(--text-main);">${escapar(item.fecha)}</td>
          <td>
            <span class="padron-tag padron-tag-sede">${escapar(item.sede)}</span>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">${escapar(item.distrito)} · ${escapar(item.modalidad)}</div>
          </td>
          <td>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">${hallazgos.join('')}</div>
            ${item.observacionesDetalle ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">${escapar(item.observacionesDetalle)}</div>` : ''}
          </td>
          <td style="text-align: center; font-weight: 700; color: var(--gt-green);">${item.familiasOrientadas}</td>
          <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.facilitadora || item.creadoPor)}</td>
        </tr>
      `;
    }).join('');
  },

  renderTablaCapacitaciones() {
    const tbody = porId('tbodyCapacitacionesVoluntarias');
    if (!tbody) return;

    const lista = AccionNutricionalModel.getAllCapacitaciones();
    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-dim);">
            No hay capacitaciones a voluntarias registradas.
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
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">${escapar(item.distrito)}</div>
        </td>
        <td>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${(item.tematicas || []).map(t => `<span class="badge" style="background:var(--gt-blue-bg); color:var(--gt-blue); font-size:11px; padding:2px 6px; border-radius:4px;">${escapar(t)}</span>`).join('')}
          </div>
          ${item.lugaresParticipantes ? `<div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">Sedes: ${escapar(item.lugaresParticipantes)}</div>` : ''}
        </td>
        <td style="text-align: center; font-weight: 700;">${item.participantes}</td>
        <td style="text-align: center; font-weight: 700; color: var(--gt-yellow);">${item.canastas}</td>
        <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.creadoPor)}</td>
      </tr>
    `).join('');
  },

  renderTablaSesionesFamilias() {
    const tbody = porId('tbodySesionesFamilias');
    if (!tbody) return;

    const lista = AccionNutricionalModel.getAllSesionesFamilias();
    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-dim);">
            No hay sesiones educativas a familias registradas.
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
            ${(item.tematicas || []).map(t => `<span class="badge" style="background:var(--gt-green-bg); color:var(--gt-green); font-size:11px; padding:2px 6px; border-radius:4px;">${escapar(t)}</span>`).join('')}
          </div>
          ${item.observaciones ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">${escapar(item.observaciones)}</div>` : ''}
        </td>
        <td style="text-align: center; font-weight: 600;">${item.participantesAdultos}</td>
        <td style="text-align: center; font-weight: 600; color: var(--gt-green);">${item.participantesNinos}</td>
        <td style="text-align: center; font-weight: 700; color: var(--gt-yellow);">${item.canastas}</td>
        <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.facilitadora || item.creadoPor)}</td>
      </tr>
    `).join('');
  },

  renderTablaCampanasSalud() {
    const tbody = porId('tbodyCampanasSaludCred');
    if (!tbody) return;

    const lista = AccionNutricionalModel.getAllCampanasSalud();
    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-dim);">
            No hay atenciones de campañas CRED registradas.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista.map(item => {
      let badgeHb = 'var(--gt-green)';
      let bgHb = 'var(--gt-green-bg)';
      if (item.resultadoHb === 'En riesgo') { badgeHb = 'var(--gt-yellow)'; bgHb = 'var(--gt-yellow-bg)'; }
      else if (item.resultadoHb === 'Anemia Leve') { badgeHb = 'var(--gt-orange)'; bgHb = 'var(--gt-orange-bg)'; }
      else if (item.resultadoHb === 'Anemia Moderada' || item.resultadoHb === 'Anemia Grave') { badgeHb = 'var(--gt-red)'; bgHb = 'var(--gt-red-bg)'; }

      return `
        <tr class="padron-tr">
          <td style="font-weight: 600; color: var(--text-main);">${escapar(item.fecha)}</td>
          <td style="font-weight: 600; color: var(--text-main);">${escapar(item.beneficiarioNombre)}</td>
          <td>
            <span class="padron-tag padron-tag-sede">${escapar(item.sede)}</span>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">C.S. ${escapar(item.establecimientoSalud || 'MINSA')}</div>
          </td>
          <td>
            <span class="badge" style="background:${bgHb}; color:${badgeHb}; font-weight:700; font-size:11.5px; padding:3px 8px; border-radius:4px;">
              ${escapar(item.resultadoHb)}
            </span>
          </td>
          <td>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${(item.intervenciones || []).map(inv => {
                const esDeriv = inv.includes('Derivación');
                const col = esDeriv ? 'var(--gt-red)' : 'var(--gt-green)';
                const bg = esDeriv ? 'var(--gt-red-bg)' : 'var(--gt-green-bg)';
                return `<span class="badge" style="background:${bg}; color:${col}; font-size:11px; padding:2px 6px; border-radius:4px;">${escapar(inv)}</span>`;
              }).join('')}
            </div>
            ${item.observaciones ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">${escapar(item.observaciones)}</div>` : ''}
          </td>
          <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.creadoPor)}</td>
        </tr>
      `;
    }).join('');
  },

  // --- EXPORTACIONES A CSV ---
  exportarMonitoreoCSV() {
    const lista = AccionNutricionalModel.getAllMonitoreos();
    if (!lista.length) {
      ToastView.show('Sin datos', 'No hay registros de monitoreo para exportar', 'warning');
      return;
    }
    const headers = ['ID', 'Fecha', 'Sede', 'Distrito', 'Modalidad', 'Estrategia', 'Incidente Alimentos', 'Sobraron Raciones', 'Inadecuada Manipulacion', 'Alimentos Piso', 'Ambiente Sucio', 'Familias Orientadas', 'Observaciones', 'Facilitadora'];
    const rows = lista.map(i => [
      i.id, i.fecha, i.sede, i.distrito, i.modalidad, i.estrategia,
      i.observacionesItems?.incidenteAlimentos ? 'SÍ' : 'NO',
      i.observacionesItems?.sobraronRaciones ? 'SÍ' : 'NO',
      i.observacionesItems?.inadecuadaManipulacion ? 'SÍ' : 'NO',
      i.observacionesItems?.baldesBolsasPiso ? 'SÍ' : 'NO',
      i.observacionesItems?.ambienteSucio ? 'SÍ' : 'NO',
      i.familiasOrientadas, i.observacionesDetalle, i.facilitadora,
    ]);
    CsvExporter._descargar(`Monitoreo_Reparto_Inocuidad_DI_${hoyISO()}.csv`, headers, rows);
    ToastView.show('Descarga iniciada', 'Reporte CSV de monitoreo de reparto descargado', 'success');
  },

  exportarCapacitacionesCSV() {
    const lista = AccionNutricionalModel.getAllCapacitaciones();
    if (!lista.length) {
      ToastView.show('Sin datos', 'No hay capacitaciones registradas para exportar', 'warning');
      return;
    }
    const headers = ['ID', 'Fecha', 'Sede', 'Distrito', 'Tematicas', 'Participantes', 'Lugares Participantes', 'Canastas Donadas', 'Observaciones', 'Responsable'];
    const rows = lista.map(i => [
      i.id, i.fecha, i.sede, i.distrito, (i.tematicas || []).join('; '),
      i.participantes, i.lugaresParticipantes, i.canastas, i.observaciones, i.creadoPor,
    ]);
    CsvExporter._descargar(`Capacitaciones_Voluntarias_DI_${hoyISO()}.csv`, headers, rows);
    ToastView.show('Descarga iniciada', 'Reporte CSV de capacitaciones a voluntarias descargado', 'success');
  },

  exportarSesionesFamiliasCSV() {
    const lista = AccionNutricionalModel.getAllSesionesFamilias();
    if (!lista.length) {
      ToastView.show('Sin datos', 'No hay sesiones registradas para exportar', 'warning');
      return;
    }
    const headers = ['ID', 'Fecha', 'Sede', 'Distrito', 'Modalidad', 'Estrategia', 'Tematicas', 'Adultos', 'Ninos', 'Canastas', 'Observaciones', 'Facilitadora'];
    const rows = lista.map(i => [
      i.id, i.fecha, i.sede, i.distrito, i.modalidad, i.estrategia,
      (i.tematicas || []).join('; '), i.participantesAdultos, i.participantesNinos, i.canastas, i.observaciones, i.facilitadora,
    ]);
    CsvExporter._descargar(`Sesiones_Educativas_Familias_DI_${hoyISO()}.csv`, headers, rows);
    ToastView.show('Descarga iniciada', 'Reporte CSV de sesiones a familias descargado', 'success');
  },

  exportarCampanasSaludCSV() {
    const lista = AccionNutricionalModel.getAllCampanasSalud();
    if (!lista.length) {
      ToastView.show('Sin datos', 'No hay atenciones de campañas para exportar', 'warning');
      return;
    }
    const headers = ['ID', 'Fecha', 'Sede', 'Distrito', 'Establecimiento Salud', 'Usuario', 'Resultado Hb', 'Intervenciones', 'Observaciones', 'Responsable'];
    const rows = lista.map(i => [
      i.id, i.fecha, i.sede, i.distrito, i.establecimientoSalud, i.beneficiarioNombre,
      i.resultadoHb, (i.intervenciones || []).join('; '), i.observaciones, i.creadoPor,
    ]);
    CsvExporter._descargar(`Campanas_Integrales_Salud_CRED_${hoyISO()}.csv`, headers, rows);
    ToastView.show('Descarga iniciada', 'Reporte CSV de campañas integrales de salud descargado', 'success');
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.AccionesNutricionalesView = AccionesNutricionalesView;
}
