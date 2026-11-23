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

export const PROGRAMAS_ARTICULADOS = [
  'Desayuno Infantil',
  'Casita del Saber',
  'Buen Trato en Familia (BTF)',
  'Juntos Aprendemos en Cristo (JAC)',
  'Repostería',
  'Área Social Pastoral'
];

export function clasificarCategoria(tipo) {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('director') || t.includes('docente')) return CATEGORIAS_COLABORADOR.COLEGIO;
  if (t.includes('facilitador') || t.includes('promotor')) return CATEGORIAS_COLABORADOR.PDI;
  if (t.includes('iglesia') || t.includes('parroquial') || t.includes('pastor') || t.includes('líder') || t.includes('lider')) return CATEGORIAS_COLABORADOR.IGLESIA;
  return CATEGORIAS_COLABORADOR.PDI;
}

export function validarDatosColaborador(c = {}) {
  const errores = [];
  const nombres = String(c.nombres || '').trim();
  const apellidos = String(c.apellidos || '').trim();
  const sede = String(c.sedeInstitucion || '').trim();
  const celular = String(c.celular || '').replace(/\D/g, '');
  const dni = String(c.dni || '').replace(/\D/g, '');
  const modular = String(c.codigoModular || '').replace(/\D/g, '');

  if (nombres.length < 2) errores.push('Los nombres deben tener al menos 2 caracteres.');
  if (apellidos.length < 2) errores.push('Los apellidos deben tener al menos 2 caracteres.');
  if (!sede) errores.push('La sede o institución vinculada es obligatoria.');

  if (c.celular && (celular.length !== 9 || !celular.startsWith('9'))) {
    errores.push('El celular debe tener 9 dígitos y comenzar con 9.');
  }
  if (c.dni && dni.length !== 8) {
    errores.push('El DNI debe tener exactamente 8 dígitos.');
  }
  if (c.codigoModular && modular.length !== 7) {
    errores.push('El código modular debe tener exactamente 7 dígitos.');
  }

  return { valido: errores.length === 0, errores };
}

export function normalizarColaborador(c = {}) {
  const tipo = c.tipoColaborador || 'Director(a) I.E.';
  const categoria = c.categoria || clasificarCategoria(tipo);

  // Normalizar estrategias (convirtiendo cualquier mención obsoleta de JAC al nombre canónico)
  const estsRaw = Array.isArray(c.estrategias) ? c.estrategias : (c.estrategia ? [c.estrategia] : ['Desayuno Infantil']);
  const estrategias = estsRaw.map(e => {
    const s = String(e || '').trim();
    if (s.toLowerCase().includes('jóvenes') || s.toLowerCase().includes('jovenes') || s.toUpperCase() === 'JAC') {
      return 'Juntos Aprendemos en Cristo (JAC)';
    }
    return s;
  });

  return {
    ...c,
    nombres: String(c.nombres || '').trim(),
    apellidos: String(c.apellidos || '').trim(),
    dni: String(c.dni || '').replace(/\D/g, '').slice(0, 8),
    celular: String(c.celular || '').replace(/\D/g, '').slice(0, 9),
    telefonoFijo: String(c.telefonoFijo || '').trim(),
    email: String(c.email || '').trim().toLowerCase(),
    fechaNacimiento: c.fechaNacimiento || '',
    direccion: String(c.direccion || '').trim(),
    distrito: c.distrito || 'Comas',
    sedeInstitucion: String(c.sedeInstitucion || '').trim(),
    tipoColaborador: tipo,
    categoria,
    codigoModular: String(c.codigoModular || '').replace(/\D/g, '').slice(0, 7),
    nivel: c.nivel || '',
    turno: c.turno || '',
    denominacion: String(c.denominacion || '').trim(),
    estrategias: estrategias.length > 0 ? estrategias : ['Desayuno Infantil'],
    fechaIngreso: c.fechaIngreso || new Date().toISOString().split('T')[0],
    estado: c.estado || 'Activo',
    observaciones: String(c.observaciones || '').trim()
  };
}

export function extraerNumeroId(codigo, idStr, fallbackIdx) {
  if (codigo) {
    const parts = String(codigo).split('-');
    const last = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(last)) return last;
  }
  if (typeof idStr === 'string') {
    const num = parseInt(idStr.replace(/\D/g, ''), 10);
    if (!isNaN(num)) return num;
  }
  return fallbackIdx;
}

export function isoFecha(v) {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return '';
}

export function mapearColaboradores(colabRaw) {
  if (!Array.isArray(colabRaw)) return [];
  return colabRaw.map((c, idx) => {
    const tipo = c.tipo_colaborador || c.tipoColaborador || c.rol || 'Director(a) I.E.';
    const cat = c.categoria || clasificarCategoria(tipo);
    const sede = c.sede_nombre || c.sedeInstitucion || c.sede_institucion || '';
    const ests = Array.isArray(c.estrategias) ? c.estrategias : (c.estrategia ? [c.estrategia] : ['Desayuno Infantil']);
    const estrategias = ests.map(e => {
      const s = String(e || '').trim();
      if (s.toLowerCase().includes('jóvenes') || s.toLowerCase().includes('jovenes') || s.toUpperCase() === 'JAC') {
        return 'Juntos Aprendemos en Cristo (JAC)';
      }
      return s;
    });

    return {
      _qid: String(c.id || c._qid || ''),
      id: extraerNumeroId(c.codigo, String(c.id), idx + 1),
      codigo: c.codigo || `COL-${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
      nombres: String(c.nombres || '').trim(),
      apellidos: String(c.apellidos || '').trim(),
      dni: String(c.numero_documento || c.dni || '').replace(/\D/g, '').slice(0, 8),
      celular: String(c.telefono_celular || c.telefono || c.celular || '').replace(/\D/g, '').slice(0, 9),
      telefonoFijo: String(c.telefono_fijo || c.telefonoFijo || '').trim(),
      email: String(c.email || '').trim().toLowerCase(),
      fechaNacimiento: isoFecha(c.fecha_nacimiento || c.fechaNacimiento),
      direccion: String(c.direccion || '').trim(),
      distrito: c.distrito || 'Comas',
      sedeInstitucion: sede,
      tipoColaborador: tipo,
      categoria: cat,
      codigoModular: String(c.codigo_modular || c.codigoModular || '').replace(/\D/g, '').slice(0, 7),
      nivel: c.nivel || '',
      turno: c.turno || '',
      denominacion: String(c.denominacion || '').trim(),
      estrategias: estrategias.length > 0 ? estrategias : ['Desayuno Infantil'],
      fechaIngreso: isoFecha(c.fecha_ingreso || c.fechaIngreso) || new Date().toISOString().split('T')[0],
      estado: c.estado || 'Activo',
      observaciones: String(c.observaciones || '').trim()
    };
  });
}

export const ColaboradorModel = {
  _data: null,

  init() {
    if (!this._data) {
      const almacenados = StorageService.getItem(STORAGE_KEY, null);
      this._data = Array.isArray(almacenados) ? almacenados : [];
    }
  },

  /** La capa de datos entrega el padrón hidratado de la nube. */
  aplicarDatos(lista) {
    if (!Array.isArray(lista)) return;
    this._data = lista;
    this._guardar();
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

  getBySede(sedeNombre) {
    if (!this._data) this.init();
    if (!sedeNombre) return [];
    const term = String(sedeNombre).toLowerCase().trim();
    return this._data.filter(c => {
      const s = String(c.sedeInstitucion || '').toLowerCase();
      return s.includes(term) || term.includes(s);
    });
  },

  getById(id) {
    if (!this._data) this.init();
    return this._data.find(c => String(c.id) === String(id) || String(c.codigo) === String(id)) || null;
  },

  getByDni(dni) {
    if (!this._data) this.init();
    const dniLimpio = String(dni || '').replace(/\D/g, '');
    return this._data.find(c => String(c.dni).replace(/\D/g, '') === dniLimpio) || null;
  },

  async create(colabData) {
    if (!this._data) this.init();
    const maxId = this._data.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);
    const nextId = maxId + 1;
    const year = new Date().getFullYear();
    const padded = String(nextId).padStart(3, '0');

    const normal = normalizarColaborador(colabData);
    const nuevo = {
      ...normal,
      id: nextId,
      codigo: normal.codigo || `COL-${year}-${padded}`,
    };

    this._data.unshift(nuevo);
    this._guardar();

    // Sincronizar con SurrealDB si la capa de datos está activa
    if (typeof window !== 'undefined' && window.PDI?.DB?.crearColaborador) {
      try {
        const ok = await window.PDI.DB.crearColaborador(nuevo);
        if (ok && ok.qid) nuevo._qid = ok.qid;
      } catch (err) {
        console.warn('[PDI] Error al persistir colaborador en la nube:', err);
      }
    }

    return nuevo;
  },

  async update(id, updates) {
    if (!this._data) this.init();
    const index = this._data.findIndex(c => String(c.id) === String(id));
    if (index === -1) return null;

    const actual = this._data[index];
    const tipo = updates.tipoColaborador !== undefined ? updates.tipoColaborador : actual.tipoColaborador;
    const categoria = updates.categoria || clasificarCategoria(tipo);

    const normal = normalizarColaborador({
      ...actual,
      ...updates,
      id: actual.id,
      codigo: actual.codigo,
      tipoColaborador: tipo,
      categoria
    });

    const actualizado = {
      ...actual,
      ...normal,
      id: actual.id,
      codigo: actual.codigo,
      _qid: actual._qid
    };

    // Asegurar remoción de campos de login heredados
    delete actualizado.cuentaUsuarioId;
    delete actualizado.usuarioLogin;

    this._data[index] = actualizado;
    this._guardar();

    // Sincronizar con SurrealDB si la capa de datos está activa
    if (typeof window !== 'undefined' && window.PDI?.DB?.actualizarColaborador) {
      try {
        await window.PDI.DB.actualizarColaborador(actualizado);
      } catch (err) {
        console.warn('[PDI] Error al actualizar colaborador en la nube:', err);
      }
    }

    return actualizado;
  },

  async delete(id) {
    if (!this._data) this.init();
    const index = this._data.findIndex(c => String(c.id) === String(id));
    if (index === -1) return false;

    const colab = this._data[index];
    this._data.splice(index, 1);
    this._guardar();

    // Sincronizar baja lógica en SurrealDB si la capa de datos está activa
    if (typeof window !== 'undefined' && window.PDI?.DB?.darBajaColaborador) {
      try {
        await window.PDI.DB.darBajaColaborador(colab);
      } catch (err) {
        console.warn('[PDI] Error al dar de baja colaborador en la nube:', err);
      }
    }

    return true;
  }
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.ColaboradorModel = ColaboradorModel;
}
