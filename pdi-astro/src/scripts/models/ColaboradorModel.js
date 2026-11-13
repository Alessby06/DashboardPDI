// Modelo: Padrón y Gestión Operativa de Colaboradores (PDI)
// Asociación Cultural y Educativa Johannes Gutenberg - Lima Norte
// Basado en las Fichas Oficiales del Programa:
// - A4: Ficha de Datos Facilitadora / Promotora Social / Voluntaria (Casita del Saber)
// - A4: Ficha de Datos Facilitador / Iglesia Aliada (Desayuno Infantil)
// - A5: Ficha de Datos Voluntarias / Directores de I.E. (Lonchera Infantil)

import { StorageService } from './StorageService.js';

const STORAGE_KEY = 'pdi_colaboradores_data';

export const TIPOS_COLABORADOR = [
  'Facilitador(a) Comunitario(a)',
  'Promotora Social',
  'Promotora Educativa',
  'Director(a) I.E.',
  'Docente Enlace',
  'Enlace Parroquial / Iglesia'
];

export const DISTRITOS_COLABORADOR = ['Comas', 'Carabayllo', 'El Agustino'];

// El directorio arranca vacio: cada colaborador se registra desde la ficha.
// No se siembran nombres, documentos ni telefonos inventados: los datos
// personales que se muestran deben venir del equipo, no de un ejemplo.

export const ColaboradorModel = {
  _data: null,

  init() {
    const almacenados = StorageService.getItem(STORAGE_KEY, null);
    this._data = Array.isArray(almacenados) ? almacenados : [];
  },

  _guardar() {
    if (this._data) {
      StorageService.setItem(STORAGE_KEY, this._data);
    }
  },

  getAll() {
    if (!this._data) this.init();
    return [...this._data];
  },

  getById(id) {
    if (!this._data) this.init();
    return this._data.find(c => String(c.id) === String(id) || String(c.codigo) === String(id)) || null;
  },

  getByDni(dni) {
    if (!this._data) this.init();
    const dniLimpio = String(dni || '').trim();
    return this._data.find(c => String(c.dni).trim() === dniLimpio) || null;
  },

  create(colabData) {
    if (!this._data) this.init();
    const maxId = this._data.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);
    const nextId = maxId + 1;
    const year = new Date().getFullYear();
    const padded = String(nextId).padStart(3, '0');

    const nuevo = {
      id: nextId,
      codigo: `COL-${year}-${padded}`,
      nombres: (colabData.nombres || '').trim(),
      apellidos: (colabData.apellidos || '').trim(),
      dni: (colabData.dni || '').trim(),
      celular: (colabData.celular || '').trim(),
      email: (colabData.email || '').trim(),
      fechaNacimiento: colabData.fechaNacimiento || '',
      direccion: (colabData.direccion || '').trim(),
      distrito: colabData.distrito || 'Comas',
      sedeInstitucion: (colabData.sedeInstitucion || '').trim(),
      tipoColaborador: colabData.tipoColaborador || 'Facilitador(a) Comunitario(a)',
      estrategias: Array.isArray(colabData.estrategias) ? colabData.estrategias : (colabData.estrategia ? [colabData.estrategia] : ['Desayuno Infantil']),
      cuentaUsuarioId: colabData.cuentaUsuarioId || null,
      usuarioLogin: (colabData.usuarioLogin || '').trim(),
      fechaIngreso: colabData.fechaIngreso || new Date().toISOString().split('T')[0],
      estado: colabData.estado || 'Activo',
      observaciones: (colabData.observaciones || '').trim()
    };

    this._data.unshift(nuevo);
    this._guardar();
    return nuevo;
  },

  update(id, updates) {
    if (!this._data) this.init();
    const index = this._data.findIndex(c => String(c.id) === String(id));
    if (index === -1) return null;

    const actual = this._data[index];
    const actualizado = {
      ...actual,
      ...updates,
      id: actual.id,
      codigo: actual.codigo,
      nombres: updates.nombres !== undefined ? updates.nombres.trim() : actual.nombres,
      apellidos: updates.apellidos !== undefined ? updates.apellidos.trim() : actual.apellidos,
      dni: updates.dni !== undefined ? updates.dni.trim() : actual.dni,
      celular: updates.celular !== undefined ? updates.celular.trim() : actual.celular,
      email: updates.email !== undefined ? updates.email.trim() : actual.email,
      direccion: updates.direccion !== undefined ? updates.direccion.trim() : actual.direccion,
      sedeInstitucion: updates.sedeInstitucion !== undefined ? updates.sedeInstitucion.trim() : actual.sedeInstitucion,
      observaciones: updates.observaciones !== undefined ? updates.observaciones.trim() : actual.observaciones,
      estrategias: Array.isArray(updates.estrategias) ? updates.estrategias : actual.estrategias
    };

    this._data[index] = actualizado;
    this._guardar();
    return actualizado;
  },

  delete(id) {
    if (!this._data) this.init();
    const index = this._data.findIndex(c => String(c.id) === String(id));
    if (index === -1) return false;

    this._data.splice(index, 1);
    this._guardar();
    return true;
  }
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.ColaboradorModel = ColaboradorModel;
}
