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

const FIXTURES_INICIALES = [
  {
    id: 1,
    codigo: 'COL-2026-001',
    nombres: 'María Elena',
    apellidos: 'Quispe Huamán',
    dni: '42819203',
    celular: '984123847',
    email: 'mquispe@pdi-gutenberg.org',
    fechaNacimiento: '1988-05-14',
    direccion: 'Jr. Los Claveles 240, Año Nuevo, Comas',
    distrito: 'Comas',
    sedeInstitucion: 'Comas - Año Nuevo',
    tipoColaborador: 'Facilitador(a) Comunitario(a)',
    estrategias: ['Desayuno Infantil'],
    cuentaUsuarioId: 'usr_facil_comas',
    usuarioLogin: 'mquispe',
    fechaIngreso: '2024-03-01',
    estado: 'Activo',
    observaciones: 'Facilitadora de reparto y responsable de punto de entrega.'
  },
  {
    id: 2,
    codigo: 'COL-2026-002',
    nombres: 'Rosa Luz',
    apellidos: 'Medina Torres',
    dni: '09384721',
    celular: '991823746',
    email: 'rmedina@pdi-gutenberg.org',
    fechaNacimiento: '1985-11-20',
    direccion: 'Av. Túpac Amaru Km 13, La Libertad, Comas',
    distrito: 'Comas',
    sedeInstitucion: 'Comas - La Libertad',
    tipoColaborador: 'Promotora Educativa',
    estrategias: ['Casita del Saber'],
    cuentaUsuarioId: 'usr_prom_comas',
    usuarioLogin: 'rmedina',
    fechaIngreso: '2023-04-15',
    estado: 'Activo',
    observaciones: 'Acompañamiento pedagógico y mediación en biblioteca comunitaria.'
  },
  {
    id: 3,
    codigo: 'COL-2026-003',
    nombres: 'Carlos Alberto',
    apellidos: 'Mendoza Ramos',
    dni: '10485920',
    celular: '972384192',
    email: 'direccion@ie3088.edu.pe',
    fechaNacimiento: '1976-08-09',
    direccion: 'Av. Universitaria Nte. 450, El Progreso, Carabayllo',
    distrito: 'Carabayllo',
    sedeInstitucion: 'I.E. 3088 Vista Alegre',
    tipoColaborador: 'Director(a) I.E.',
    estrategias: ['Lonchera Infantil'],
    cuentaUsuarioId: null,
    usuarioLogin: '',
    fechaIngreso: '2025-03-01',
    estado: 'Activo',
    observaciones: 'Director de I.E. aliada para entrega de loncheras saludables.'
  },
  {
    id: 4,
    codigo: 'COL-2026-004',
    nombres: 'Gladys',
    apellidos: 'Paucar Soto',
    dni: '25893012',
    celular: '963829104',
    email: 'gpaucar@colegioslima.edu.pe',
    fechaNacimiento: '1982-01-30',
    direccion: 'Calle San Martín 112, Carmen Alto, Comas',
    distrito: 'Comas',
    sedeInstitucion: 'I.E. San Martín de Porres',
    tipoColaborador: 'Docente Enlace',
    estrategias: ['Lonchera Infantil', 'Casita del Saber'],
    cuentaUsuarioId: null,
    usuarioLogin: '',
    fechaIngreso: '2025-04-10',
    estado: 'Activo',
    observaciones: 'Docente coordinadora de tutores para seguimiento escolar.'
  },
  {
    id: 5,
    codigo: 'COL-2026-005',
    nombres: 'Jorge Luis',
    apellidos: 'Valenzuela Ruiz',
    dni: '08492019',
    celular: '951029384',
    email: 'jvalenzuela@alianzapdi.pe',
    fechaNacimiento: '1972-12-05',
    direccion: 'Av. Las Lomas s/n, San Pedro, Carabayllo',
    distrito: 'Carabayllo',
    sedeInstitucion: 'Carabayllo - San Pedro (Iglesia Aliada)',
    tipoColaborador: 'Enlace Parroquial / Iglesia',
    estrategias: ['Desayuno Infantil', 'Área Social Pastoral'],
    cuentaUsuarioId: null,
    usuarioLogin: '',
    fechaIngreso: '2024-01-15',
    estado: 'Activo',
    observaciones: 'Pastor de la iglesia aliada y enlace de distribución comunitaria.'
  },
  {
    id: 6,
    codigo: 'COL-2026-006',
    nombres: 'Patricia',
    apellidos: 'Morales Díaz',
    dni: '41092834',
    celular: '948291038',
    email: 'pmorales@pdi-gutenberg.org',
    fechaNacimiento: '1990-09-18',
    direccion: 'Mz. K Lt. 4, El Progreso, Carabayllo',
    distrito: 'Carabayllo',
    sedeInstitucion: 'Carabayllo - El Progreso',
    tipoColaborador: 'Promotora Social',
    estrategias: ['Área Social Pastoral'],
    cuentaUsuarioId: 'usr_social_carabayllo',
    usuarioLogin: 'pmorales',
    fechaIngreso: '2023-08-01',
    estado: 'Activo',
    observaciones: 'Trabajadora social de campo y visitas domiciliarias ASP.'
  },
  {
    id: 7,
    codigo: 'COL-2026-007',
    nombres: 'Beatriz',
    apellidos: 'Campos Navarro',
    dni: '07392019',
    celular: '981039482',
    email: 'bcampos@parroquia-carmenalto.pe',
    fechaNacimiento: '1969-04-22',
    direccion: 'Calle Los Pinos 105, Carmen Alto, Comas',
    distrito: 'Comas',
    sedeInstitucion: 'Comas - Carmen Alto',
    tipoColaborador: 'Enlace Parroquial / Iglesia',
    estrategias: ['Desayuno Infantil'],
    cuentaUsuarioId: null,
    usuarioLogin: '',
    fechaIngreso: '2024-06-01',
    estado: 'Activo',
    observaciones: 'Coordinadora de local parroquial y reparto matutino.'
  },
  {
    id: 8,
    codigo: 'COL-2026-008',
    nombres: 'Miguel Ángel',
    apellidos: 'Tello Paredes',
    dni: '44920192',
    celular: '992837461',
    email: 'mtello@pdi-gutenberg.org',
    fechaNacimiento: '1992-07-11',
    direccion: 'Sector Los Bendecidos Mz. B Lt. 12, Carabayllo',
    distrito: 'Carabayllo',
    sedeInstitucion: 'Carabayllo - Los Bendecidos',
    tipoColaborador: 'Facilitador(a) Comunitario(a)',
    estrategias: ['Desayuno Infantil'],
    cuentaUsuarioId: null,
    usuarioLogin: '',
    fechaIngreso: '2025-01-20',
    estado: 'Activo',
    observaciones: 'Facilitador logístico y apoyo en campañas de salud.'
  }
];

export const ColaboradorModel = {
  _data: null,

  init() {
    const almacenados = StorageService.getItem(STORAGE_KEY, null);
    if (Array.isArray(almacenados) && almacenados.length > 0) {
      this._data = almacenados;
    } else {
      this._data = [...FIXTURES_INICIALES];
      this._guardar();
    }
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
