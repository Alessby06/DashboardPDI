// Modelo: Padrón y Gestión Territorial de Colaboradores e Instituciones Aliadas (PDI)
// Asociación Cultural y Educativa Johannes Gutenberg - Lima Norte
// Basado en las Fichas Oficiales del Programa:
// - A4: Ficha de Datos Facilitadora / Promotora Social (Casita del Saber)
// - A4: Ficha de Datos Facilitador / Iglesia Aliada (Desayuno Infantil)
// - A5: Ficha de Datos Directores y Docentes Enlace de I.E. (Lonchera / Desayuno Infantil)

import { StorageService } from './StorageService.js';

const STORAGE_KEY = 'pdi_colaboradores_data';

export const CATEGORIAS_COLABORADOR = {
  COLEGIO: 'colegios',
  IGLESIA: 'iglesias',
  PDI: 'pdi',
};

export const TIPOS_COLABORADOR = [
  'Director(a) I.E.',
  'Docente Enlace',
  'Enlace Parroquial / Iglesia',
  'Pastor(a) / Líder Comunitario',
  'Facilitador(a) Comunitario(a)',
  'Promotora Social',
  'Promotora Educativa',
];

export const DISTRITOS_COLABORADOR = ['Comas', 'Carabayllo', 'El Agustino'];

export function clasificarCategoria(tipo) {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('director') || t.includes('docente')) return CATEGORIAS_COLABORADOR.COLEGIO;
  if (t.includes('iglesia') || t.includes('parroquial') || t.includes('pastor') || t.includes('comunitario')) return CATEGORIAS_COLABORADOR.IGLESIA;
  return CATEGORIAS_COLABORADOR.PDI;
}

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

  getByCategoria(categoria) {
    if (!this._data) this.init();
    if (!categoria || categoria === 'todos') return this.getAll();
    return this._data.filter(c => (c.categoria || clasificarCategoria(c.tipoColaborador)) === categoria);
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

    const tipo = colabData.tipoColaborador || 'Director(a) I.E.';
    const categoria = colabData.categoria || clasificarCategoria(tipo);

    const nuevo = {
      id: nextId,
      codigo: `COL-${year}-${padded}`,
      nombres: (colabData.nombres || '').trim(),
      apellidos: (colabData.apellidos || '').trim(),
      dni: (colabData.dni || '').trim(),
      celular: (colabData.celular || '').trim(),
      telefonoFijo: (colabData.telefonoFijo || '').trim(),
      email: (colabData.email || '').trim(),
      fechaNacimiento: colabData.fechaNacimiento || '',
      direccion: (colabData.direccion || '').trim(),
      distrito: colabData.distrito || 'Comas',
      sedeInstitucion: (colabData.sedeInstitucion || '').trim(),
      tipoColaborador: tipo,
      categoria,
      codigoModular: (colabData.codigoModular || '').trim(),
      nivel: colabData.nivel || '',
      turno: colabData.turno || '',
      denominacion: (colabData.denominacion || '').trim(),
      estrategias: Array.isArray(colabData.estrategias) ? colabData.estrategias : (colabData.estrategia ? [colabData.estrategia] : ['Desayuno Infantil']),
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
    const tipo = updates.tipoColaborador !== undefined ? updates.tipoColaborador : actual.tipoColaborador;
    const categoria = updates.categoria || clasificarCategoria(tipo);

    const actualizado = {
      ...actual,
      ...updates,
      id: actual.id,
      codigo: actual.codigo,
      nombres: updates.nombres !== undefined ? updates.nombres.trim() : actual.nombres,
      apellidos: updates.apellidos !== undefined ? updates.apellidos.trim() : actual.apellidos,
      dni: updates.dni !== undefined ? updates.dni.trim() : actual.dni,
      celular: updates.celular !== undefined ? updates.celular.trim() : actual.celular,
      telefonoFijo: updates.telefonoFijo !== undefined ? updates.telefonoFijo.trim() : actual.telefonoFijo,
      email: updates.email !== undefined ? updates.email.trim() : actual.email,
      direccion: updates.direccion !== undefined ? updates.direccion.trim() : actual.direccion,
      sedeInstitucion: updates.sedeInstitucion !== undefined ? updates.sedeInstitucion.trim() : actual.sedeInstitucion,
      codigoModular: updates.codigoModular !== undefined ? updates.codigoModular.trim() : actual.codigoModular,
      nivel: updates.nivel !== undefined ? updates.nivel : actual.nivel,
      turno: updates.turno !== undefined ? updates.turno : actual.turno,
      denominacion: updates.denominacion !== undefined ? updates.denominacion.trim() : actual.denominacion,
      observaciones: updates.observaciones !== undefined ? updates.observaciones.trim() : actual.observaciones,
      estrategias: Array.isArray(updates.estrategias) ? updates.estrategias : actual.estrategias,
      tipoColaborador: tipo,
      categoria,
    };

    // Asegurar remoción de campos de login heredados
    delete actualizado.cuentaUsuarioId;
    delete actualizado.usuarioLogin;

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
