// ===========================================================================
//  Vista: Encuentros JAC — Juntos Aprendemos en Cristo
// ===========================================================================
//  Subvista de /social para registrar círculos formativos y discipulado
//  infantil en articulación con pastores y líderes de iglesias aliadas.
// ===========================================================================
import { EncuentroJacModel } from '../models/EncuentroJacModel.js';
import { ColaboradorModel } from '../models/ColaboradorModel.js';
import { ToastView } from './ToastView.js';
import { escapar } from '../utils/HtmlHelper.js';
import { distritoDeSede } from '../core/catalogos.js';

function porId(id) {
  return document.getElementById(id);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function usuarioActivo() {
  try {
    return {
      nombre: localStorage.getItem('pdi_usuario_nombre') || 'Equipo Social Pastoral',
      rol: localStorage.getItem('pdi_active_role') || 'social',
    };
  } catch {
    return { nombre: 'Equipo Social Pastoral', rol: 'social' };
  }
}

function obtenerAliadosJac() {
  try {
    const lista = typeof ColaboradorModel?.getAll === 'function' ? ColaboradorModel.getAll() : [];
    return lista.filter(c => {
      if (c.estado && c.estado !== 'Activo') return false;
      const est = Array.isArray(c.estrategias) ? c.estrategias : [];
      return est.some(e => {
        const low = String(e || '').toLowerCase();
        return low.includes('jac') || low.includes('juntos aprendemos');
      });
    });
  } catch {
    return [];
  }
}

export const EncuentrosJacView = {
  init(sedeInicial = '') {
    this.enlazarFormulario();
    this.poblarAliados();
    if (sedeInicial) {
      const selSede = porId('jacSede');
      if (selSede) {
        const existe = Array.from(selSede.options).some(o => o.value === sedeInicial);
        if (existe) selSede.value = sedeInicial;
      }
    }
    this.render();
  },

  poblarAliados() {
    const datalist = porId('datalistAliadosJac');
    if (!datalist) return;
    const aliados = obtenerAliadosJac();
    const vistos = new Set();
    const opciones = [];

    aliados.forEach(a => {
      const nombre = `${a.nombres || ''} ${a.apellidos || ''}`.trim();
      const sede = a.sedeInstitucion || a.distrito || '';
      const etiqueta = sede ? `${sede} — ${nombre}` : nombre;
      if (etiqueta && !vistos.has(etiqueta.toLowerCase())) {
        vistos.add(etiqueta.toLowerCase());
        opciones.push(`<option value="${escapar(etiqueta)}">${escapar(a.tipoColaborador || 'Iglesia Aliada')} · ${escapar(a.distrito || '')}</option>`);
      }
    });

    datalist.innerHTML = opciones.join('');
  },

  enlazarFormulario() {
    const form = porId('formEncuentroJac');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const inputFecha = porId('jacFecha');
    if (inputFecha && !inputFecha.value) inputFecha.value = hoyISO();

    const inputFac = porId('jacFacilitadora');
    if (inputFac && !inputFac.value) inputFac.value = usuarioActivo().nombre;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sede = porId('jacSede')?.value;
      if (!sede) {
        ToastView.show('Selecciona una sede', 'Indica la sede territorial donde se realizó el encuentro JAC.', 'warning');
        porId('jacSede')?.focus();
        return;
      }

      const tipoRadio = form.querySelector('input[name="jacTipo"]:checked');
      if (!tipoRadio) {
        ToastView.show('Selecciona el tipo de encuentro', 'Elige la modalidad formativa de JAC.', 'warning');
        return;
      }

      const fecha = porId('jacFecha')?.value || hoyISO();
      const iglesiaAliada = porId('jacIglesia')?.value || 'Iglesia Aliada Territorial';
      const ninos = Math.max(0, parseInt(porId('jacNinos')?.value, 10) || 0);
      const preadolescentes = Math.max(0, parseInt(porId('jacPreadolescentes')?.value, 10) || 0);
      const lideres = Math.max(0, parseInt(porId('jacLideres')?.value, 10) || 0);
      const facilitadora = porId('jacFacilitadora')?.value || usuarioActivo().nombre;
      const observaciones = porId('jacObservaciones')?.value || '';
      const distrito = distritoDeSede(sede) || 'Comas';

      const registro = EncuentroJacModel.guardarEncuentro({
        fecha,
        sede,
        distrito,
        iglesiaAliada,
        tipoClave: tipoRadio.value,
        participantesNinos: ninos,
        participantesPreadolescentes: preadolescentes,
        lideresIglesia: lideres,
        facilitadora,
        observaciones,
      });

      const totalNna = registro.participantesNinos + registro.participantesPreadolescentes;
      ToastView.show(
        'Encuentro JAC registrado',
        `${registro.tipoTitulo} en ${sede} con ${totalNna} NNA asistentes.`,
        'success'
      );

      form.reset();
      if (inputFecha) inputFecha.value = hoyISO();
      if (inputFac) inputFac.value = usuarioActivo().nombre;
      if (porId('jacNinos')) porId('jacNinos').value = '0';
      if (porId('jacPreadolescentes')) porId('jacPreadolescentes').value = '0';
      if (porId('jacLideres')) porId('jacLideres').value = '1';
      const firstRadio = form.querySelector('input[name="jacTipo"][value="circulo_formativo"]');
      if (firstRadio) firstRadio.checked = true;

      this.render();
    });
  },

  render() {
    this.poblarAliados();
    const lista = EncuentroJacModel.getAll();
    const resumen = EncuentroJacModel.resumenPorDistrito();
    const aliadosCount = obtenerAliadosJac().length;

    const setTxt = (id, val) => {
      const el = porId(id);
      if (el) el.textContent = String(val);
    };

    setTxt('statJacEncuentros', resumen.totalEncuentros);
    setTxt('statJacParticipantes', resumen.totalParticipantes);
    setTxt('statJacPreadolescentes', resumen.totalPreadolescentes);
    setTxt('statJacAliados', aliadosCount);

    const tbody = porId('tbodyEncuentrosJac');
    if (!tbody) return;

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-dim);">
            Aún no hay encuentros JAC registrados. Utiliza el formulario superior para registrar un círculo formativo o actividad con iglesias aliadas.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista.map(item => {
      const totalNna = (item.participantesNinos || 0) + (item.participantesPreadolescentes || 0);
      return `
        <tr class="padron-tr">
          <td style="font-weight: 600; color: var(--text-main);">${escapar(item.fecha)}</td>
          <td>
            <span class="padron-tag padron-tag-sede">${escapar(item.sede)}</span>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">${escapar(item.distrito)}</div>
          </td>
          <td>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
              <span class="badge" style="background: var(--chart-blue-bg); color: var(--chart-blue-ink); border: 1px solid var(--chart-blue-border); font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 600;">
                ${escapar(item.tipoTitulo)}
              </span>
            </div>
            ${item.observaciones ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; font-style: italic;">${escapar(item.observaciones)}</div>` : ''}
          </td>
          <td style="font-size: 12px; color: var(--text-main);">
            ${escapar(item.iglesiaAliada)}
            <div style="font-size: 11px; color: var(--text-dim);">${item.lideresIglesia || 0} líderes locales</div>
          </td>
          <td style="text-align: center;">
            <span style="font-weight: 700; color: var(--chart-blue-ink);">${totalNna} NNA</span>
            <span style="font-size: 11px; color: var(--text-dim); display: block;">${item.participantesNinos} niños · ${item.participantesPreadolescentes} pread.</span>
          </td>
          <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.facilitadora)}</td>
        </tr>
      `;
    }).join('');
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.EncuentrosJacView = EncuentrosJacView;
}
