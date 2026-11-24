// ===========================================================================
//  Modelo: Encuentros JAC — Juntos Aprendemos en Cristo (Área Social Pastoral)
// ===========================================================================
//  Registra círculos formativos, discipulado infantil y encuentros barriales
//  articulados con pastores y líderes de iglesias aliadas (quienes no tienen
//  cuenta en el sistema; registra la Facilitadora PDI o el equipo ASP).
// ===========================================================================
import { StorageService } from './StorageService.js';
import { distritoDeSede } from '../core/catalogos.js';

const STORAGE_KEY = 'pdi_encuentros_jac';

export const TIPOS_JAC = [
  { clave: 'circulo_formativo', titulo: 'Círculo Formativo y Valores', corto: 'Círculo Formativo y Valores' },
  { clave: 'discipulado', titulo: 'Discipulado Infantil / Bíblico', corto: 'Discipulado Infantil' },
  { clave: 'escuela_biblica', titulo: 'Escuela Bíblica / Vacacional', corto: 'Escuela Bíblica' },
  { clave: 'integracion_familiar', titulo: 'Integración Comunitaria y Familia', corto: 'Integración Comunitaria' },
];

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

export const EncuentroJacModel = {
  getAll() {
    const data = StorageService.getItem(STORAGE_KEY, []);
    return Array.isArray(data) ? data : [];
  },

  guardarEncuentro(data = {}) {
    const list = this.getAll();
    const { nombre, rol } = usuarioActivo();
    const sede = String(data.sede || '').trim() || 'Sin sede';
    const distrito = String(data.distrito || '').trim() || distritoDeSede(sede) || 'Comas';
    const tipoMeta = TIPOS_JAC.find(t => t.clave === data.tipoClave || t.titulo === data.tipoTitulo) || TIPOS_JAC[0];

    const registro = {
      id: 'JAC-' + Date.now(),
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      sede,
      distrito,
      iglesiaAliada: String(data.iglesiaAliada || '').trim() || 'Iglesia Aliada Territorial',
      tipoClave: tipoMeta.clave,
      tipoTitulo: tipoMeta.titulo,
      participantesNinos: Math.max(0, Number(data.participantesNinos) || 0),
      participantesPreadolescentes: Math.max(0, Number(data.participantesPreadolescentes) || 0),
      lideresIglesia: Math.max(0, Number(data.lideresIglesia) || 0),
      facilitadora: String(data.facilitadora || '').trim() || nombre,
      observaciones: String(data.observaciones || '').trim(),
      creadoPor: nombre,
      creadoEn: new Date().toISOString(),
    };

    list.unshift(registro);
    StorageService.setItem(STORAGE_KEY, list);

    try {
      const audit = typeof window !== 'undefined' ? window.PDI?.AuditModel : null;
      const total = registro.participantesNinos + registro.participantesPreadolescentes;
      audit?.log?.(
        nombre,
        rol,
        'REGISTRAR_ENCUENTRO_JAC',
        'Juntos Aprendemos en Cristo (JAC)',
        `${registro.tipoTitulo} en ${registro.sede} (${registro.iglesiaAliada}): ${total} NNA (${registro.participantesNinos} niños, ${registro.participantesPreadolescentes} preadolescentes).`,
        null,
      );
    } catch (e) {
      console.warn('[EncuentroJacModel] Error en auditoría:', e);
    }

    return registro;
  },

  resumenPorDistrito() {
    const list = this.getAll();
    const resumen = {
      comas: 0,
      carabayllo: 0,
      otras: 0,
      totalEncuentros: list.length,
      totalNinos: 0,
      totalPreadolescentes: 0,
      totalParticipantes: 0,
    };

    list.forEach(item => {
      const dist = String(item.distrito || distritoDeSede(item.sede) || '').trim().toLowerCase();
      const ninos = Math.max(0, Number(item.participantesNinos) || 0);
      const pre = Math.max(0, Number(item.participantesPreadolescentes) || 0);
      const total = ninos + pre;

      resumen.totalNinos += ninos;
      resumen.totalPreadolescentes += pre;
      resumen.totalParticipantes += total;

      if (dist === 'comas') resumen.comas += total;
      else if (dist === 'carabayllo') resumen.carabayllo += total;
      else resumen.otras += total;
    });

    return resumen;
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.EncuentroJacModel = EncuentroJacModel;
}
