// ===========================================================================
//  Modelo: Acciones Socio-Educativas, Monitoreo y Seguimiento (Ficha A5)
// ===========================================================================
//  Gestiona los tres instrumentos operativos de Casita del Saber:
//  1. Acciones socio-educativas comunitarias (talleres, consejería, cuentacuentos, canastas).
//  2. Monitoreo de lugares de atención / infraestructura de sede.
//  3. Seguimiento individual socio-educativo y enlace con ASP.
// ===========================================================================
import { StorageService } from './StorageService.js';
import { AuditModel } from './AuditModel.js';

const STORAGE_KEY_ACCIONES = 'pdi_acciones_educativas';
const STORAGE_KEY_MONITOREO = 'pdi_monitoreos_educativos';
const STORAGE_KEY_SEGUIMIENTO = 'pdi_seguimientos_educativos';

function usuarioActivo() {
  try {
    return {
      nombre: localStorage.getItem('pdi_usuario_nombre') || 'Equipo Educativo',
      rol: localStorage.getItem('pdi_active_role') || 'facilitadora',
    };
  } catch {
    return { nombre: 'Equipo Educativo', rol: 'facilitadora' };
  }
}

export const AccionEducativaModel = {
  // --- 1. ACCIONES SOCIO-EDUCATIVAS COLECTIVAS ---
  getAllAcciones() {
    return StorageService.getItem(STORAGE_KEY_ACCIONES, []);
  },

  getAccionesPorSede(sede) {
    const list = this.getAllAcciones();
    if (!sede) return list;
    return list.filter(item => item.sede === sede);
  },

  guardarAccion(data) {
    const list = this.getAllAcciones();
    const { nombre, rol } = usuarioActivo();
    const id = 'ASE-' + Date.now();
    const registro = {
      id,
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      sede: data.sede || 'Sin sede',
      distrito: data.distrito || 'Comas',
      modalidad: data.modalidad || 'Comunitaria',
      estrategia: data.estrategia || 'Atención fija',
      facilitadora: data.facilitadora || nombre,
      acciones: Array.isArray(data.acciones) ? data.acciones : [],
      participantesAdultos: Number(data.participantesAdultos) || 0,
      participantesNinos: Number(data.participantesNinos) || 0,
      canastas: Number(data.canastas) || 0,
      observaciones: String(data.observaciones || '').trim(),
      creadoPor: nombre,
      creadoEn: new Date().toISOString(),
    };

    list.unshift(registro);
    StorageService.setItem(STORAGE_KEY_ACCIONES, list);

    try {
      AuditModel?.log?.(
        nombre,
        rol,
        'REGISTRAR_ACCION_SOCIOEDUCATIVA',
        'Casita del Saber',
        `Registro de acción colectiva en ${registro.sede} (${registro.acciones.join(', ')}) con ${registro.participantesNinos} NNA y ${registro.canastas} canastas.`,
        null,
        '192.168.1.x',
        registro.sede
      );
    } catch (e) {
      console.warn('[AccionEducativaModel] Error en auditoría:', e);
    }

    return registro;
  },

  // --- 2. MONITOREO DE LUGARES DE ATENCIÓN ---
  getAllMonitoreos() {
    return StorageService.getItem(STORAGE_KEY_MONITOREO, []);
  },

  getMonitoreosPorSede(sede) {
    const list = this.getAllMonitoreos();
    if (!sede) return list;
    return list.filter(item => item.sede === sede);
  },

  guardarMonitoreo(data) {
    const list = this.getAllMonitoreos();
    const { nombre, rol } = usuarioActivo();
    const id = 'MON-' + Date.now();
    const registro = {
      id,
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      sede: data.sede || 'Sin sede',
      distrito: data.distrito || 'Comas',
      facilitadora: data.facilitadora || nombre,
      observacionesItems: {
        espacio: Boolean(data.items?.espacio),
        promotora: Boolean(data.items?.promotora),
        usuarios: Boolean(data.items?.usuarios),
        cuidadores: Boolean(data.items?.cuidadores),
      },
      observacionesDetalle: String(data.observacionesDetalle || '').trim(),
      creadoPor: nombre,
      creadoEn: new Date().toISOString(),
    };

    list.unshift(registro);
    StorageService.setItem(STORAGE_KEY_MONITOREO, list);

    try {
      AuditModel?.log?.(
        nombre,
        rol,
        'REGISTRAR_MONITOREO_SEDE',
        'Casita del Saber',
        `Monitoreo de sede realizado en ${registro.sede} (${registro.distrito}) por ${registro.facilitadora}.`,
        null,
        '192.168.1.x',
        registro.sede
      );
    } catch (e) {
      console.warn('[AccionEducativaModel] Error en auditoría:', e);
    }

    return registro;
  },

  // --- 3. SEGUIMIENTO INDIVIDUAL SOCIO-EDUCATIVO ---
  getAllSeguimientos() {
    return StorageService.getItem(STORAGE_KEY_SEGUIMIENTO, []);
  },

  getSeguimientosPorBeneficiario(beneficiarioId) {
    const list = this.getAllSeguimientos();
    if (!beneficiarioId) return list;
    return list.filter(item => String(item.beneficiarioId) === String(beneficiarioId));
  },

  guardarSeguimiento(data) {
    const list = this.getAllSeguimientos();
    const { nombre, rol } = usuarioActivo();
    const id = 'SEG-' + Date.now();
    const registro = {
      id,
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      sede: data.sede || 'Sin sede',
      distrito: data.distrito || 'Comas',
      modalidad: data.modalidad || 'Comunitaria',
      estrategia: data.estrategia || 'Atención fija',
      facilitadora: data.facilitadora || nombre,
      beneficiarioId: data.beneficiarioId,
      beneficiarioNombre: data.beneficiarioNombre || 'Usuario',
      acciones: Array.isArray(data.acciones) ? data.acciones : [],
      notas: String(data.notas || '').trim(),
      creadoPor: nombre,
      creadoEn: new Date().toISOString(),
    };

    list.unshift(registro);
    StorageService.setItem(STORAGE_KEY_SEGUIMIENTO, list);

    try {
      AuditModel?.log?.(
        nombre,
        rol,
        'REGISTRAR_SEGUIMIENTO_USUARIO',
        'Casita del Saber',
        `Seguimiento registrado para ${registro.beneficiarioNombre}: ${registro.acciones.join(', ')}.`,
        null,
        '192.168.1.x',
        registro.sede
      );
    } catch (e) {
      console.warn('[AccionEducativaModel] Error en auditoría:', e);
    }

    return registro;
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.AccionEducativaModel = AccionEducativaModel;
}
