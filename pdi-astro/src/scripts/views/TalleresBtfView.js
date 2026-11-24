// ===========================================================================
//  Vista: Talleres BTF — Buen Trato en Familia (Escuelas para Padres)
// ===========================================================================
//  Subvista de /social para registrar sesiones vivenciales de crianza
//  positiva y prevención de violencia articuladas con aliados territoriales.
// ===========================================================================
import { TallerBtfModel } from '../models/TallerBtfModel.js';
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

function obtenerAliadosBtf() {
  try {
    const lista = typeof ColaboradorModel?.getAll === 'function' ? ColaboradorModel.getAll() : [];
    return lista.filter(c => {
      if (c.estado && c.estado !== 'Activo') return false;
      const est = Array.isArray(c.estrategias) ? c.estrategias : [];
      return est.some(e => {
        const low = String(e || '').toLowerCase();
        return low.includes('btf') || low.includes('buen trato');
      });
    });
  } catch {
    return [];
  }
}

export const TalleresBtfView = {
  _bound: false,

  init() {
    this.enlazarFormulario();
    this.poblarAliados();
    this.render();
  },

  poblarAliados() {
    const datalist = porId('datalistAliadosBtf');
    if (!datalist) return;
    const aliados = obtenerAliadosBtf();
    const vistos = new Set();
    const opciones = [];

    aliados.forEach(a => {
      const nombre = `${a.nombres || ''} ${a.apellidos || ''}`.trim();
      const sede = a.sedeInstitucion || a.distrito || '';
      const etiqueta = sede ? `${sede} — ${nombre}` : nombre;
      if (etiqueta && !vistos.has(etiqueta.toLowerCase())) {
        vistos.add(etiqueta.toLowerCase());
        opciones.push(`<option value="${escapar(etiqueta)}">${escapar(a.tipoColaborador || 'Aliado BTF')} · ${escapar(a.distrito || '')}</option>`);
      }
    });

    datalist.innerHTML = opciones.join('');
  },

  enlazarFormulario() {
    const form = porId('formTallerBtf');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const inputFecha = porId('btfFecha');
    if (inputFecha && !inputFecha.value) inputFecha.value = hoyISO();

    const inputResp = porId('btfResponsable');
    if (inputResp && !inputResp.value) inputResp.value = usuarioActivo().nombre;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sede = porId('btfSede')?.value;
      if (!sede) {
        ToastView.show('Selecciona una sede', 'Indica la sede territorial donde se realizó el taller BTF.', 'warning');
        porId('btfSede')?.focus();
        return;
      }

      const sesionRadio = form.querySelector('input[name="btfSesion"]:checked');
      if (!sesionRadio) {
        ToastView.show('Selecciona la sesión', 'Elige la sesión del ciclo Buen Trato en Familia (1 a 4).', 'warning');
        return;
      }

      const fecha = porId('btfFecha')?.value || hoyISO();
      const aliado = porId('btfAliado')?.value || 'Local Comunal PDI';
      const padres = Math.max(0, parseInt(porId('btfPadres')?.value, 10) || 0);
      const familias = Math.max(0, parseInt(porId('btfFamilias')?.value, 10) || 0);
      const responsable = porId('btfResponsable')?.value || usuarioActivo().nombre;
      const observaciones = porId('btfObservaciones')?.value || '';
      const distrito = distritoDeSede(sede) || 'Comas';

      const registro = TallerBtfModel.guardarTaller({
        fecha,
        sede,
        distrito,
        aliado,
        sesionNumero: Number(sesionRadio.value),
        participantesPadres: padres,
        familiasPadron: familias,
        responsable,
        observaciones,
      });

      ToastView.show(
        'Taller BTF registrado',
        `Sesión ${registro.sesionNumero} en ${sede} con ${padres} padres/cuidadores.`,
        'success'
      );

      form.reset();
      if (inputFecha) inputFecha.value = hoyISO();
      if (inputResp) inputResp.value = usuarioActivo().nombre;
      if (porId('btfPadres')) porId('btfPadres').value = '0';
      if (porId('btfFamilias')) porId('btfFamilias').value = '0';
      const firstRadio = form.querySelector('input[name="btfSesion"][value="1"]');
      if (firstRadio) firstRadio.checked = true;

      this.render();
    });
  },

  render() {
    this.poblarAliados();
    const lista = TallerBtfModel.getAll();
    const resumen = TallerBtfModel.resumenPorDistrito();
    const aliadosCount = obtenerAliadosBtf().length;

    const setTxt = (id, val) => {
      const el = porId(id);
      if (el) el.textContent = String(val);
    };

    setTxt('statBtfSesiones', resumen.totalSesiones);
    setTxt('statBtfPadres', resumen.totalPadres);
    setTxt('statBtfFamilias', resumen.totalFamilias);
    setTxt('statBtfAliados', aliadosCount);

    const tbody = porId('tbodyTalleresBtf');
    if (!tbody) return;

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-dim);">
            Aún no hay sesiones de Buen Trato en Familia (BTF) registradas. Utiliza el formulario superior para registrar la primera escuela para padres.
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
          <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
            <span class="badge" style="background: var(--chart-blue-bg); color: var(--chart-blue-ink); border: 1px solid var(--chart-blue-border); font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 600;">
              Sesión ${escapar(String(item.sesionNumero))}: ${escapar(item.sesionTitulo)}
            </span>
          </div>
          ${item.observaciones ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; font-style: italic;">${escapar(item.observaciones)}</div>` : ''}
        </td>
        <td style="font-size: 12px; color: var(--text-main);">${escapar(item.aliado)}</td>
        <td style="text-align: center;">
          <span style="font-weight: 700; color: var(--chart-blue-ink);">${item.participantesPadres}</span>
          <span style="font-size: 11px; color: var(--text-dim); display: block;">(${item.familiasPadron} fam. PDI)</span>
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.responsable)}</td>
      </tr>
    `).join('');
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.TalleresBtfView = TalleresBtfView;
}
