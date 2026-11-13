// ===========================================================================
//  Modelo: Acciones Nutricionales, Monitoreo y Campañas (Desayuno Infantil - Ficha A6)
// ===========================================================================
//  Gestiona los cuatro instrumentos operativos de Desayuno Infantil:
//  1. Monitoreo de lugares de reparto / control de higiene e inocuidad alimentaria.
//  2. Capacitaciones técnicas a madres voluntarias de cocina.
//  3. Sesiones educativas formativas a familias usuarias.
//  4. Campañas integrales de salud CRED en articulación con postas/MINSA.
// ===========================================================================
import { StorageService } from './StorageService.js';
import { AuditModel } from './AuditModel.js';

const STORAGE_KEY_MONITOREO_REPARTO = 'pdi_monitoreo_reparto_di';
const STORAGE_KEY_CAPACITACIONES = 'pdi_capacitaciones_voluntarias_di';
const STORAGE_KEY_SESIONES_FAMILIAS = 'pdi_sesiones_familias_di';
const STORAGE_KEY_CAMPANAS_SALUD = 'pdi_campanas_salud_cred_di';

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

export const AccionNutricionalModel = {
  // --- 1. MONITOREO DE LUGARES DE REPARTO (Hoja 1) ---
  getAllMonitoreos() {
    return StorageService.getItem(STORAGE_KEY_MONITOREO_REPARTO, []);
  },

  guardarMonitoreo(data) {
    const list = this.getAllMonitoreos();
    const { nombre, rol } = usuarioActivo();
    const id = 'MON-DI-' + Date.now();
    const registro = {
      id,
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      distrito: data.distrito || 'Comas',
      modalidad: data.modalidad || 'Comunitaria',
      estrategia: data.estrategia || 'Desayuno Infantil',
      sede: data.sede || 'Sin sede',
      facilitadora: data.facilitadora || nombre,
      observacionesItems: {
        incidenteAlimentos: Boolean(data.items?.incidenteAlimentos),
        sobraronRaciones: Boolean(data.items?.sobraronRaciones),
        inadecuadaManipulacion: Boolean(data.items?.inadecuadaManipulacion),
        baldesBolsasPiso: Boolean(data.items?.baldesBolsasPiso),
        ambienteSucio: Boolean(data.items?.ambienteSucio),
      },
      familiasOrientadas: Number(data.familiasOrientadas) || 0,
      observacionesDetalle: String(data.observacionesDetalle || '').trim(),
      creadoPor: nombre,
      creadoEn: new Date().toISOString(),
    };

    list.unshift(registro);
    StorageService.setItem(STORAGE_KEY_MONITOREO_REPARTO, list);

    try {
      AuditModel?.log?.(
        nombre,
        rol,
        'REGISTRAR_MONITOREO_REPARTO',
        'Desayuno Infantil',
        `Monitoreo de reparto e inocuidad en ${registro.sede} (${registro.distrito}) - Familias orientadas: ${registro.familiasOrientadas}.`,
        null,
        '192.168.1.x',
        registro.sede
      );
    } catch (e) {
      console.warn('[AccionNutricionalModel] Error en auditoría:', e);
    }

    return registro;
  },

  // --- 2. CAPACITACIONES A VOLUNTARIAS (Hoja 2) ---
  getAllCapacitaciones() {
    return StorageService.getItem(STORAGE_KEY_CAPACITACIONES, []);
  },

  guardarCapacitacion(data) {
    const list = this.getAllCapacitaciones();
    const { nombre, rol } = usuarioActivo();
    const id = 'CAP-VOL-' + Date.now();
    const registro = {
      id,
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      distrito: data.distrito || 'Comas',
      sede: data.sede || 'Sin sede',
      tematicas: Array.isArray(data.tematicas) ? data.tematicas : [],
      participantes: Number(data.participantes) || 0,
      lugaresParticipantes: String(data.lugaresParticipantes || '').trim(),
      canastas: Number(data.canastas) || 0,
      observaciones: String(data.observaciones || '').trim(),
      creadoPor: nombre,
      creadoEn: new Date().toISOString(),
    };

    list.unshift(registro);
    StorageService.setItem(STORAGE_KEY_CAPACITACIONES, list);

    try {
      AuditModel?.log?.(
        nombre,
        rol,
        'REGISTRAR_CAPACITACION_VOLUNTARIAS',
        'Desayuno Infantil',
        `Capacitación a voluntarias en ${registro.sede} (${registro.tematicas.join(', ')}) - ${registro.participantes} participantes.`,
        null,
        '192.168.1.x',
        registro.sede
      );
    } catch (e) {
      console.warn('[AccionNutricionalModel] Error en auditoría:', e);
    }

    return registro;
  },

  // --- 3. SESIONES EDUCATIVAS A FAMILIAS (Hoja 3) ---
  getAllSesionesFamilias() {
    return StorageService.getItem(STORAGE_KEY_SESIONES_FAMILIAS, []);
  },

  guardarSesionFamilia(data) {
    const list = this.getAllSesionesFamilias();
    const { nombre, rol } = usuarioActivo();
    const id = 'SES-FAM-' + Date.now();
    const registro = {
      id,
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      distrito: data.distrito || 'Comas',
      modalidad: data.modalidad || 'Comunitaria',
      estrategia: data.estrategia || 'Desayuno Infantil',
      sede: data.sede || 'Sin sede',
      facilitadora: data.facilitadora || nombre,
      tematicas: Array.isArray(data.tematicas) ? data.tematicas : [],
      participantesAdultos: Number(data.participantesAdultos) || 0,
      participantesNinos: Number(data.participantesNinos) || 0,
      canastas: Number(data.canastas) || 0,
      observaciones: String(data.observaciones || '').trim(),
      creadoPor: nombre,
      creadoEn: new Date().toISOString(),
    };

    list.unshift(registro);
    StorageService.setItem(STORAGE_KEY_SESIONES_FAMILIAS, list);

    try {
      AuditModel?.log?.(
        nombre,
        rol,
        'REGISTRAR_SESION_FAMILIAS',
        'Desayuno Infantil',
        `Sesión educativa a familias en ${registro.sede} (${registro.tematicas.join(', ')}) - Adultos: ${registro.participantesAdultos}, Niños: ${registro.participantesNinos}, Canastas: ${registro.canastas}.`,
        null,
        '192.168.1.x',
        registro.sede
      );
    } catch (e) {
      console.warn('[AccionNutricionalModel] Error en auditoría:', e);
    }

    return registro;
  },

  // --- 4. CAMPAÑAS INTEGRALES DE SALUD CRED (Hoja 4) ---
  getAllCampanasSalud() {
    return StorageService.getItem(STORAGE_KEY_CAMPANAS_SALUD, []);
  },

  guardarCampanaSalud(data) {
    const list = this.getAllCampanasSalud();
    const { nombre, rol } = usuarioActivo();
    const id = 'CAM-CRED-' + Date.now();
    const registro = {
      id,
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      distrito: data.distrito || 'Comas',
      modalidad: data.modalidad || 'Comunitaria',
      estrategia: data.estrategia || 'Desayuno Infantil',
      sede: data.sede || 'Sin sede',
      establecimientoSalud: String(data.establecimientoSalud || '').trim(),
      beneficiarioId: data.beneficiarioId || null,
      beneficiarioNombre: String(data.beneficiarioNombre || 'Usuario').trim(),
      resultadoHb: data.resultadoHb || 'Regular',
      intervenciones: Array.isArray(data.intervenciones) ? data.intervenciones : [],
      observaciones: String(data.observaciones || '').trim(),
      creadoPor: nombre,
      creadoEn: new Date().toISOString(),
    };

    list.unshift(registro);
    StorageService.setItem(STORAGE_KEY_CAMPANAS_SALUD, list);

    try {
      AuditModel?.log?.(
        nombre,
        rol,
        'REGISTRAR_ATENCION_CAMPANA_CRED',
        'Desayuno Infantil',
        `Atención CRED en campaña: ${registro.beneficiarioNombre} en C.S. ${registro.establecimientoSalud} - Resultado Hb: ${registro.resultadoHb} (${registro.intervenciones.join(', ')}).`,
        null,
        '192.168.1.x',
        registro.sede
      );
    } catch (e) {
      console.warn('[AccionNutricionalModel] Error en auditoría:', e);
    }

    return registro;
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.AccionNutricionalModel = AccionNutricionalModel;
}
