// ===========================================================================
//  Vista: Talleres Productivos de Repostería (Voluntariados / Sedes)
// ===========================================================================
import { TallerReposteriaModel } from '../models/TallerReposteriaModel.js';
import { VoluntarioModel } from '../models/VoluntarioModel.js';
import { ColaboradorModel } from '../models/ColaboradorModel.js';
import { ToastView } from './ToastView.js';
import { escapar } from '../utils/HtmlHelper.js';
import { pintarFilas } from '../utils/FlipTabla.js';
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
      nombre: localStorage.getItem('pdi_usuario_nombre') || 'Equipo Voluntariado PDI',
      rol: localStorage.getItem('pdi_active_role') || 'facilitadora',
    };
  } catch {
    return { nombre: 'Equipo Voluntariado PDI', rol: 'facilitadora' };
  }
}

export const TalleresReposteriaView = {
  init() {
    this.enlazarFormulario();
    this.poblarDatalists();
    this.render();
  },

  poblarDatalists() {
    const dlComites = porId('datalistComitesRep');
    if (dlComites) {
      try {
        const colabs = typeof ColaboradorModel?.getAll === 'function' ? ColaboradorModel.getAll() : [];
        const vistos = new Set();
        const opts = [];
        colabs.forEach(c => {
          if (c.estado && c.estado !== 'Activo') return;
          const est = Array.isArray(c.estrategias) ? c.estrategias : [];
          const tieneRep = est.some(e => {
            const low = String(e || '').toLowerCase();
            return low.includes('reposter') || low.includes('desayuno');
          });
          if (!tieneRep) return;
          const nom = `${c.nombres || ''} ${c.apellidos || ''}`.trim();
          const sede = c.sedeInstitucion || c.distrito || '';
          const val = sede ? `${sede} — ${nom}` : nom;
          if (val && !vistos.has(val.toLowerCase())) {
            vistos.add(val.toLowerCase());
            opts.push(`<option value="${escapar(val)}">${escapar(c.tipoColaborador || 'Aliado')} · ${escapar(c.distrito || '')}</option>`);
          }
        });
        dlComites.innerHTML = opts.join('');
      } catch {
        // Sin colaboradores cargados
      }
    }

    const dlMaestras = porId('datalistMaestrasRep');
    if (dlMaestras) {
      try {
        const vols = typeof VoluntarioModel?.getAll === 'function' ? VoluntarioModel.getAll() : [];
        const vistos = new Set();
        const opts = [];
        vols.forEach(v => {
          if (v.estado && v.estado !== 'Activo') return;
          const serv = String(v.servicio || '').toLowerCase();
          if (!serv.includes('reposter') && !serv.includes('desayuno')) return;
          const nom = `${v.nombres || ''} ${v.apellidos || ''}`.trim();
          if (nom && !vistos.has(nom.toLowerCase())) {
            vistos.add(nom.toLowerCase());
            opts.push(`<option value="${escapar(nom)}">${escapar(v.servicio || 'Voluntaria')} · ${escapar(v.sede || v.distrito || '')}</option>`);
          }
        });
        dlMaestras.innerHTML = opts.join('');
      } catch {
        // Sin voluntarias cargadas
      }
    }
  },

  enlazarFormulario() {
    const form = porId('formTallerReposteria');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const inputFecha = porId('repFecha');
    if (inputFecha && !inputFecha.value) inputFecha.value = hoyISO();

    const inputMaestra = porId('repMaestra');
    if (inputMaestra && !inputMaestra.value) inputMaestra.value = usuarioActivo().nombre;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sede = porId('repSede')?.value;
      if (!sede) {
        ToastView.show('Selecciona una sede', 'Indica la sede territorial del taller productivo.', 'warning');
        porId('repSede')?.focus();
        return;
      }

      const tematicaRadio = form.querySelector('input[name="repTematica"]:checked');
      if (!tematicaRadio) {
        ToastView.show('Selecciona la temática', 'Elige la línea formativa del taller de repostería.', 'warning');
        return;
      }

      const fecha = porId('repFecha')?.value || hoyISO();
      const comiteAnfitrion = porId('repComite')?.value || 'Comité de Comedor / Iglesia Aliada';
      const maestra = porId('repMaestra')?.value || usuarioActivo().nombre;
      const madres = Math.max(0, parseInt(porId('repMadres')?.value, 10) || 0);
      const porciones = Math.max(0, parseInt(porId('repPorciones')?.value, 10) || 0);
      const destino = porId('repDestino')?.value || 'Consumo Desayuno PDI';
      const observaciones = porId('repObservaciones')?.value || '';
      const distrito = distritoDeSede(sede) || 'Comas';

      const registro = TallerReposteriaModel.guardarTaller({
        fecha,
        sede,
        distrito,
        comiteAnfitrion,
        maestra,
        tematicaClave: tematicaRadio.value,
        participantesMadres: madres,
        porcionesElaboradas: porciones,
        destino,
        observaciones,
      });

      ToastView.show(
        'Taller productivo registrado',
        `${registro.tematicaTitulo} en ${sede}: ${madres} madres y ${porciones} porciones.`,
        'success'
      );

      form.reset();
      if (inputFecha) inputFecha.value = hoyISO();
      if (inputMaestra) inputMaestra.value = usuarioActivo().nombre;
      if (porId('repMadres')) porId('repMadres').value = '0';
      if (porId('repPorciones')) porId('repPorciones').value = '0';
      const firstRadio = form.querySelector('input[name="repTematica"][value="panaderia"]');
      if (firstRadio) firstRadio.checked = true;

      this.render();
    });
  },

  render() {
    this.poblarDatalists();
    const lista = TallerReposteriaModel.getAll();
    const resumen = TallerReposteriaModel.resumenPorDistrito();

    const setTxt = (id, val) => {
      const el = porId(id);
      if (el) el.textContent = String(val);
    };

    setTxt('statRepTalleres', resumen.totalTalleres);
    setTxt('statRepMadres', resumen.totalMadres);
    setTxt('statRepPorciones', resumen.totalPorciones);

    const tbody = porId('tbodyTalleresReposteria');
    if (!tbody) return;

    if (!lista.length) {
      pintarFilas(tbody, `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-dim);">
            Aún no hay talleres productivos de repostería registrados. Utiliza el formulario superior para registrar una sesión.
          </td>
        </tr>
      `);
      return;
    }

    pintarFilas(tbody, lista.map(item => `
      <tr class="padron-tr">
        <td style="font-weight: 600; color: var(--text-main);">${escapar(item.fecha)}</td>
        <td>
          <span class="padron-tag padron-tag-sede">${escapar(item.sede)}</span>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">${escapar(item.distrito)}</div>
        </td>
        <td>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
            <span class="badge" style="background: var(--gt-yellow-bg); color: var(--text-main); border: 1px solid var(--border-subtle); font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 600;">
              ${escapar(item.tematicaTitulo)}
            </span>
            <span class="badge" style="background: var(--surface-2); color: var(--text-muted); border: 1px solid var(--border-subtle); font-size: 10.5px; padding: 2px 6px; border-radius: 4px;">
              ${escapar(item.destino)}
            </span>
          </div>
          ${item.observaciones ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; font-style: italic;">${escapar(item.observaciones)}</div>` : ''}
        </td>
        <td style="font-size: 12px; color: var(--text-main);">${escapar(item.comiteAnfitrion)}</td>
        <td style="text-align: center;">
          <span style="font-weight: 700; color: var(--chart-blue-ink);">${item.participantesMadres} madres</span>
          <span style="font-size: 11px; color: var(--text-dim); display: block;">${item.porcionesElaboradas} porciones</span>
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">${escapar(item.maestra)}</td>
      </tr>
    `).join(''));
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.TalleresReposteriaView = TalleresReposteriaView;
}
