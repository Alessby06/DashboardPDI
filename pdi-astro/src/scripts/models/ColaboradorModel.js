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

/** Directorio semilla de contrapartes territoriales vinculado a las 7 sedes operativas PDI */
export const COLABORADORES_SEMILLA = [
  // --- Facilitadoras PDI (7 Sedes Operativas Oficiales) ---
  {
    nombres: 'Carmen',
    apellidos: 'Mendoza Huamán',
    dni: '08234567',
    celular: '987123456',
    sedeInstitucion: 'Año Nuevo',
    distrito: 'Comas',
    tipoColaborador: 'Facilitador(a) Comunitario(a)',
    categoria: 'pdi',
    estrategias: ['Desayuno Infantil', 'Casita del Saber', 'Buen Trato en Familia (BTF)'],
    observaciones: 'Facilitadora a cargo de la Sede Año Nuevo Sector B. Coordinación con comedor San Benito.'
  },
  {
    nombres: 'Maritza',
    apellidos: 'Soto Cárdenas',
    dni: '09345678',
    celular: '991882334',
    sedeInstitucion: 'Carmen Alto',
    distrito: 'Comas',
    tipoColaborador: 'Facilitador(a) Comunitario(a)',
    categoria: 'pdi',
    estrategias: ['Casita del Saber', 'Desayuno Infantil'],
    observaciones: 'Facilitadora de Sede Carmen Alto. Enlace en Paradero 5 de Av. Revolución.'
  },
  {
    nombres: 'Elizabeth',
    apellidos: 'Huamán Rivas',
    dni: '10456789',
    celular: '984112993',
    sedeInstitucion: 'El Progreso',
    distrito: 'Carabayllo',
    tipoColaborador: 'Facilitador(a) Comunitario(a)',
    categoria: 'pdi',
    estrategias: ['Casita del Saber', 'Desayuno Infantil'],
    observaciones: 'Facilitadora territorial en Carabayllo Km 21. Enlace con I.E. 3058.'
  },
  {
    nombres: 'Rosa',
    apellidos: 'Flores Quispe',
    dni: '11567890',
    celular: '976543210',
    sedeInstitucion: 'La Libertad',
    distrito: 'Comas',
    tipoColaborador: 'Facilitador(a) Comunitario(a)',
    categoria: 'pdi',
    estrategias: ['Desayuno Infantil', 'Buen Trato en Familia (BTF)'],
    observaciones: 'Facilitadora en A.H. La Libertad. Coordinación con Módulo de Salud.'
  },
  {
    nombres: 'Silvia',
    apellidos: 'Palacios Tello',
    dni: '12678901',
    celular: '962331778',
    sedeInstitucion: 'Los Bendecidos',
    distrito: 'Carabayllo',
    tipoColaborador: 'Facilitador(a) Comunitario(a)',
    categoria: 'pdi',
    estrategias: ['Desayuno Infantil', 'Casita del Saber', 'Buen Trato en Familia (BTF)'],
    observaciones: 'Facilitadora en Ampliación Los Bendecidos. Raciones y refuerzo escolar.'
  },
  {
    nombres: 'Juana',
    apellidos: 'Condori Mamani',
    dni: '13789012',
    celular: '955443219',
    sedeInstitucion: 'San Pedro',
    distrito: 'Carabayllo',
    tipoColaborador: 'Facilitador(a) Comunitario(a)',
    categoria: 'pdi',
    estrategias: ['Desayuno Infantil', 'Área Social Pastoral'],
    observaciones: 'Facilitadora en San Pedro Comité 14. Atención y seguimiento nutricional.'
  },
  {
    nombres: 'Patricia',
    apellidos: 'Alarcón Vera',
    dni: '14890123',
    celular: '948223990',
    sedeInstitucion: 'Santa Rosa',
    distrito: 'Carabayllo',
    tipoColaborador: 'Facilitador(a) Comunitario(a)',
    categoria: 'pdi',
    estrategias: ['Desayuno Infantil', 'Casita del Saber'],
    observaciones: 'Facilitadora en Sede Santa Rosa. Convenio pastoral Gracia y Paz.'
  },

  // --- Iglesias y Puntos Pastorales Aliados (Sedes Operativas) ---
  {
    nombres: 'Samuel',
    apellidos: 'Valdivia Quispe',
    dni: '07123456',
    celular: '987123450',
    telefonoFijo: '01-5428811',
    sedeInstitucion: 'Año Nuevo',
    denominacion: 'Iglesia Bíblica Emanuel',
    distrito: 'Comas',
    tipoColaborador: 'Pastor(a) / Líder Comunitario',
    categoria: 'iglesias',
    estrategias: ['Desayuno Infantil', 'Juntos Aprendemos en Cristo (JAC)'],
    observaciones: 'Pastor principal de Iglesia Bíblica Emanuel. Apoyo en local y logística comunitaria.'
  },
  {
    nombres: 'Héctor',
    apellidos: 'Ramos Morales',
    dni: '08456789',
    celular: '991882330',
    telefonoFijo: '01-5427722',
    sedeInstitucion: 'Carmen Alto',
    denominacion: 'Iglesia Alianza Cristiana y Misionera',
    distrito: 'Comas',
    tipoColaborador: 'Pastor(a) / Líder Comunitario',
    categoria: 'iglesias',
    estrategias: ['Desayuno Infantil', 'Buen Trato en Familia (BTF)'],
    observaciones: 'Pastor de la Alianza Cristiana y Misionera de Carmen Alto. Local de atención diaria.'
  },
  {
    nombres: 'Félix',
    apellidos: 'Alarcón Méndez',
    dni: '09567890',
    celular: '976543219',
    telefonoFijo: '01-5416633',
    sedeInstitucion: 'La Libertad',
    denominacion: 'Iglesia Cristiana Aposento Alto',
    distrito: 'Comas',
    tipoColaborador: 'Pastor(a) / Líder Comunitario',
    categoria: 'iglesias',
    estrategias: ['Desayuno Infantil', 'Área Social Pastoral'],
    observaciones: 'Pastor en A.H. La Libertad. Apoyo en soporte espiritual y espacio comunal.'
  },
  {
    nombres: 'David',
    apellidos: 'Cárdenas Tello',
    dni: '10678901',
    celular: '962331770',
    telefonoFijo: '01-5475544',
    sedeInstitucion: 'Los Bendecidos',
    denominacion: 'Centro Cristiano Familiar',
    distrito: 'Carabayllo',
    tipoColaborador: 'Pastor(a) / Líder Comunitario',
    categoria: 'iglesias',
    estrategias: ['Desayuno Infantil', 'Juntos Aprendemos en Cristo (JAC)'],
    observaciones: 'Líder eclesial Centro Cristiano Familiar. Distribución de desayunos y talleres infantiles.'
  },
  {
    nombres: 'Walter',
    apellidos: 'Vega Ríos',
    dni: '11789012',
    celular: '955443210',
    telefonoFijo: '01-5473355',
    sedeInstitucion: 'San Pedro',
    denominacion: 'Iglesia Evangélica Bautista San Pedro',
    distrito: 'Carabayllo',
    tipoColaborador: 'Pastor(a) / Líder Comunitario',
    categoria: 'iglesias',
    estrategias: ['Desayuno Infantil', 'Buen Trato en Familia (BTF)'],
    observaciones: 'Pastor Iglesia Bautista San Pedro. Monitoreo comunitario y talleres BTF.'
  },
  {
    nombres: 'Marcos',
    apellidos: 'Gutiérrez Paredes',
    dni: '12890123',
    celular: '948223999',
    telefonoFijo: '01-5472266',
    sedeInstitucion: 'Santa Rosa',
    denominacion: 'Comunidad Cristiana Gracia y Paz',
    distrito: 'Carabayllo',
    tipoColaborador: 'Pastor(a) / Líder Comunitario',
    categoria: 'iglesias',
    estrategias: ['Desayuno Infantil', 'Casita del Saber', 'Juntos Aprendemos en Cristo (JAC)'],
    observaciones: 'Pastor Comunidad Cristiana Gracia y Paz. Instalaciones para Casita del Saber y raciones.'
  },
  {
    nombres: 'Andrés',
    apellidos: 'Villanueva Rojas',
    dni: '06789012',
    celular: '961552233',
    telefonoFijo: '01-3624477',
    sedeInstitucion: 'El Agustino',
    denominacion: 'Comunidad Cristiana El Agustino',
    distrito: 'El Agustino',
    tipoColaborador: 'Pastor(a) / Líder Comunitario',
    categoria: 'iglesias',
    estrategias: ['Repostería', 'Buen Trato en Familia (BTF)', 'Juntos Aprendemos en Cristo (JAC)'],
    observaciones: 'Punto pastoral y comunal en El Agustino para talleres productivos de repostería y BTF.'
  },

  // --- Colegios Aliados (I.E.) y Docentes Enlace ---
  {
    nombres: 'Roberto',
    apellidos: 'Silva Castillo',
    dni: '06234567',
    celular: '942331122',
    telefonoFijo: '01-5432101',
    email: 'd3058_virgenmercedes@ugel04.gob.pe',
    sedeInstitucion: 'El Progreso',
    codigoModular: '0584920',
    nivel: 'Primaria',
    turno: 'Completo',
    distrito: 'Carabayllo',
    tipoColaborador: 'Director(a) I.E.',
    categoria: 'colegios',
    estrategias: ['Casita del Saber', 'Desayuno Infantil'],
    observaciones: 'Director de la I.E. N.° 3058 Virgen de las Mercedes (Av. Túpac Amaru Km 21). Convenio institucional firmado.'
  },
  {
    nombres: 'Juana',
    apellidos: 'Dávila Rivas',
    dni: '07345678',
    celular: '981223344',
    telefonoFijo: '01-5432101',
    email: 'jdavila@ugel04.gob.pe',
    sedeInstitucion: 'El Progreso',
    codigoModular: '0584920',
    nivel: 'Primaria',
    turno: 'Mañana',
    distrito: 'Carabayllo',
    tipoColaborador: 'Docente Enlace',
    categoria: 'colegios',
    estrategias: ['Casita del Saber'],
    observaciones: 'Docente enlace pedagógico de I.E. 3058. Monitoreo de asistencia y rendimiento escolar en Casitas.'
  },
  {
    nombres: 'Carlos',
    apellidos: 'Morales Soto',
    dni: '08901234',
    celular: '993445566',
    telefonoFijo: '01-5421199',
    email: 'd3088_angeles@ugel04.gob.pe',
    sedeInstitucion: 'Año Nuevo',
    codigoModular: '0432115',
    nivel: 'Primaria',
    turno: 'Mañana',
    distrito: 'Comas',
    tipoColaborador: 'Director(a) I.E.',
    categoria: 'colegios',
    estrategias: ['Casita del Saber', 'Desayuno Infantil'],
    observaciones: 'Director I.E. N.° 3088 Los Ángeles (Comas Sector Año Nuevo). Articulación con Casitas del Saber.'
  },
  {
    nombres: 'Gladys',
    apellidos: 'Ramos Quispe',
    dni: '09012345',
    celular: '971224455',
    telefonoFijo: '01-5471188',
    email: 'gramos@ugel04.gob.pe',
    sedeInstitucion: 'San Pedro',
    codigoModular: '0621345',
    nivel: 'Primaria',
    turno: 'Tarde',
    distrito: 'Carabayllo',
    tipoColaborador: 'Docente Enlace',
    categoria: 'colegios',
    estrategias: ['Casita del Saber'],
    observaciones: 'Docente de enlace en I.E. 2024 (Carabayllo). Enlace para derivación de menores con rezago.'
  },
  {
    nombres: 'Miguel Ángel',
    apellidos: 'Torres Villegas',
    dni: '05678901',
    celular: '982113355',
    telefonoFijo: '01-3621122',
    email: 'direccion_jbasadre@ugel06.gob.pe',
    sedeInstitucion: 'El Agustino',
    codigoModular: '0714231',
    nivel: 'Secundaria',
    turno: 'Mañana',
    distrito: 'El Agustino',
    tipoColaborador: 'Director(a) I.E.',
    categoria: 'colegios',
    estrategias: ['Buen Trato en Familia (BTF)', 'Repostería', 'Juntos Aprendemos en Cristo (JAC)'],
    observaciones: 'Director I.E. Jorge Basadre. Alianza formativa para proyectos de repostería y orientación familiar BTF.'
  }
];

export function limpiarCelularPeru(val) {
  let num = String(val || '').replace(/\D/g, '');
  if (num.length === 11 && num.startsWith('51')) {
    num = num.slice(2);
  }
  return num;
}

function quitarDiacriticos(str) {
  return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

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
  const celular = limpiarCelularPeru(c.celular);
  const rawDni = String(c.dni || '').trim();
  const dni = rawDni.replace(/\D/g, '');
  const rawModular = String(c.codigoModular || '').trim();
  const modular = rawModular.replace(/\D/g, '');

  if (nombres.length < 2) errores.push('Los nombres deben tener al menos 2 caracteres.');
  if (apellidos.length < 2) errores.push('Los apellidos deben tener al menos 2 caracteres.');
  if (!sede) errores.push('La sede o institución vinculada es obligatoria.');

  if (c.celular && String(c.celular).trim().length > 0 && (celular.length !== 9 || !celular.startsWith('9'))) {
    errores.push('El celular debe tener 9 dígitos y comenzar con 9.');
  }
  if (rawDni && dni.length !== 8) {
    errores.push('El DNI debe tener exactamente 8 dígitos.');
  }
  if (rawModular && modular.length !== 7) {
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
    celular: limpiarCelularPeru(c.celular).slice(0, 9),
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
      celular: limpiarCelularPeru(c.telefono_celular || c.telefono || c.celular),
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
      if (Array.isArray(almacenados) && almacenados.length > 0) {
        this._data = almacenados;
      } else {
        this._data = COLABORADORES_SEMILLA.map((c, idx) => normalizarColaborador({
          ...c,
          id: idx + 1,
          codigo: `COL-${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
        }));
        this._guardar();
      }
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
    const term = quitarDiacriticos(sedeNombre);
    return this._data.filter(c => {
      const s = quitarDiacriticos(c.sedeInstitucion);
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
        if (ok && ok.qid) {
          nuevo._qid = ok.qid;
          this._guardar();
        }
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
