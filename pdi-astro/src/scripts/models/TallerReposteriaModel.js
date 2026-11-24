// ===========================================================================
//  Modelo: Talleres Productivos de Repostería (Voluntariados / Sedes)
// ===========================================================================
//  Registra sesiones prácticas de panadería, repostería nutritiva e higiene
//  alimentaria con madres voluntarias, comités de apoyo y maestras reposteras.
// ===========================================================================
import { StorageService } from './StorageService.js';
import { distritoDeSede } from '../core/catalogos.js';

const STORAGE_KEY = 'pdi_talleres_reposteria';

export const TEMATICAS_REPOSTERIA = [
  { clave: 'panaderia', titulo: 'Panadería y Masas Saludables', corto: 'Panadería Saludable' },
  { clave: 'reposteria_nutritiva', titulo: 'Repostería Nutritiva (Hierro / Sangrecita)', corto: 'Repostería Nutritiva' },
  { clave: 'higiene', titulo: 'Higiene y Manipulación de Alimentos', corto: 'Higiene Alimentaria' },
  { clave: 'emprendimiento', titulo: 'Costos y Emprendimiento Familiar', corto: 'Costos y Emprendimiento' },
];

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

export const TallerReposteriaModel = {
  getAll() {
    const data = StorageService.getItem(STORAGE_KEY, []);
    return Array.isArray(data) ? data : [];
  },

  guardarTaller(data = {}) {
    const list = this.getAll();
    const { nombre, rol } = usuarioActivo();
    const sede = String(data.sede || '').trim() || 'Sin sede';
    const distrito = String(data.distrito || '').trim() || distritoDeSede(sede) || 'Comas';
    const tematicaMeta = TEMATICAS_REPOSTERIA.find(t => t.clave === data.tematicaClave || t.titulo === data.tematicaTitulo) || TEMATICAS_REPOSTERIA[0];

    const registro = {
      id: 'REP-' + Date.now(),
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      sede,
      distrito,
      comiteAnfitrion: String(data.comiteAnfitrion || '').trim() || 'Comité de Comedor / Iglesia Aliada',
      maestra: String(data.maestra || '').trim() || nombre,
      tematicaClave: tematicaMeta.clave,
      tematicaTitulo: tematicaMeta.titulo,
      participantesMadres: Math.max(0, Number(data.participantesMadres) || 0),
      porcionesElaboradas: Math.max(0, Number(data.porcionesElaboradas) || 0),
      destino: String(data.destino || '').trim() || 'Consumo Desayuno PDI',
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
        'REGISTRAR_TALLER_REPOSTERIA',
        'Talleres Productivos de Repostería',
        `${registro.tematicaTitulo} en ${registro.sede} (${registro.comiteAnfitrion}): ${registro.participantesMadres} madres, ${registro.porcionesElaboradas} porciones (${registro.destino}).`,
        null,
      );
    } catch (e) {
      console.warn('[TallerReposteriaModel] Error en auditoría:', e);
    }

    return registro;
  },

  resumenPorDistrito() {
    const list = this.getAll();
    const resumen = {
      comas: 0,
      carabayllo: 0,
      otras: 0,
      totalTalleres: list.length,
      totalMadres: 0,
      totalPorciones: 0,
    };

    list.forEach(item => {
      const dist = String(item.distrito || distritoDeSede(item.sede) || '').trim().toLowerCase();
      const madres = Math.max(0, Number(item.participantesMadres) || 0);
      const porciones = Math.max(0, Number(item.porcionesElaboradas) || 0);

      resumen.totalMadres += madres;
      resumen.totalPorciones += porciones;

      if (dist === 'comas') resumen.comas += madres;
      else if (dist === 'carabayllo') resumen.carabayllo += madres;
      else resumen.otras += madres;
    });

    return resumen;
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.TallerReposteriaModel = TallerReposteriaModel;
}
