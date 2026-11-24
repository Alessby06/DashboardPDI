// ===========================================================================
//  Modelo: Talleres BTF — Buen Trato en Familia (Área Social Pastoral)
// ===========================================================================
//  Gestiona el ciclo formativo de 4 sesiones de Escuelas para Padres (BTF)
//  dictadas en sedes PDI, iglesias y colegios aliados.
// ===========================================================================
import { StorageService } from './StorageService.js';
import { distritoDeSede } from '../core/catalogos.js';

const STORAGE_KEY = 'pdi_talleres_btf';

export const SESIONES_BTF = [
  { numero: 1, clave: 'sesion_1', titulo: 'Crianza Positiva y Apego', corto: 'S1 · Crianza Positiva' },
  { numero: 2, clave: 'sesion_2', titulo: 'Disciplina sin Violencia', corto: 'S2 · Disciplina sin Violencia' },
  { numero: 3, clave: 'sesion_3', titulo: 'Comunicación en el Hogar', corto: 'S3 · Comunicación Familiar' },
  { numero: 4, clave: 'sesion_4', titulo: 'Prevención y Red de Protección', corto: 'S4 · Prevención y Cierre' },
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

export const TallerBtfModel = {
  getAll() {
    const data = StorageService.getItem(STORAGE_KEY, []);
    return Array.isArray(data) ? data : [];
  },

  guardarTaller(data = {}) {
    const list = this.getAll();
    const { nombre, rol } = usuarioActivo();
    const sede = String(data.sede || '').trim() || 'Sin sede';
    const distrito = String(data.distrito || '').trim() || distritoDeSede(sede) || 'Comas';
    const sesionNum = Math.min(4, Math.max(1, Number(data.sesionNumero) || 1));
    const sesionMeta = SESIONES_BTF.find(s => s.numero === sesionNum) || SESIONES_BTF[0];

    const registro = {
      id: 'BTF-' + Date.now(),
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      sede,
      distrito,
      aliado: String(data.aliado || '').trim() || 'Local Comunal PDI',
      sesionNumero: sesionMeta.numero,
      sesionTitulo: sesionMeta.titulo,
      participantesPadres: Math.max(0, Number(data.participantesPadres) || 0),
      familiasPadron: Math.max(0, Number(data.familiasPadron) || 0),
      responsable: String(data.responsable || '').trim() || nombre,
      observaciones: String(data.observaciones || '').trim(),
      creadoPor: nombre,
      creadoEn: new Date().toISOString(),
    };

    list.unshift(registro);
    StorageService.setItem(STORAGE_KEY, list);

    try {
      const audit = typeof window !== 'undefined' ? window.PDI?.AuditModel : null;
      audit?.log?.(
        nombre,
        rol,
        'REGISTRAR_TALLER_BTF',
        'Buen Trato en Familia (BTF)',
        `Sesión ${registro.sesionNumero} (${registro.sesionTitulo}) en ${registro.sede} (${registro.aliado}): ${registro.participantesPadres} padres/cuidadores y ${registro.familiasPadron} familias PDI.`,
        null,
      );
    } catch (e) {
      console.warn('[TallerBtfModel] Error en auditoría:', e);
    }

    return registro;
  },

  resumenPorDistrito() {
    const list = this.getAll();
    const resumen = {
      comas: 0,
      carabayllo: 0,
      otras: 0,
      totalSesiones: list.length,
      totalPadres: 0,
      totalFamilias: 0,
    };

    list.forEach(item => {
      const dist = String(item.distrito || distritoDeSede(item.sede) || '').trim().toLowerCase();
      const padres = Math.max(0, Number(item.participantesPadres) || 0);
      const familias = Math.max(0, Number(item.familiasPadron) || 0);
      resumen.totalPadres += padres;
      resumen.totalFamilias += familias;

      if (dist === 'comas') resumen.comas += padres;
      else if (dist === 'carabayllo') resumen.carabayllo += padres;
      else resumen.otras += padres;
    });

    return resumen;
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.TallerBtfModel = TallerBtfModel;
}
