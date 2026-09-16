// Modelo de Casos Sociales (Derivaciones ASP - Área Social Pastoral)
// Basado fielmente en la FICHA DE DERIVACIÓN DE CASO SOCIAL oficial
import { StorageService } from './StorageService.js';

export const defaultCasosSociales = [
  {
    id: 101,
    menor: "Liam Mateo Sanchez Diaz",
    codigo: "PDI-2026-003",
    etapa: "pendiente",
    urgencia: "Alta",
    tipoProblematica: "Salud",
    fechaDerivacion: "2026-04-12",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Hb 9.6 g/dL (Anemia Moderada). Cuidadora principal es abuela de 64 años sin empleo formal ni pensión.",
    accionesPrevias: "Prescripción de gotas de sulfato ferroso y primera sesión demostrativa de alimentos ricos en hierro.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Padres ausentes. Solo cuenta con apoyo esporádico de vecina de la capilla."
    },
    detalle: "Hb: 9.6 g/dL (Anemia Moderada) + Abuela a cargo sin ingresos fijos.",
    sede: "El Progreso (Carabayllo)"
  },
  {
    id: 102,
    menor: "Thiago Gael Flores Quispe",
    codigo: "PDI-2026-001",
    etapa: "evaluacion",
    urgencia: "Media",
    tipoProblematica: "Familiar",
    fechaDerivacion: "2026-04-08",
    quienDeriva: {
      nombre: "Prof. Delia Morales",
      cargo: "Promotora Educativa Casitas",
      telefono: "912-334-556"
    },
    situacionEncontrada: "Vivienda precaria con piso de tierra y hacinamiento severo (5 miembros en 1 habitación).",
    accionesPrevias: "Visita domiciliaria preliminar y llenado de Ficha Socioeconómica de 6 factores.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Padre trabaja de estibador eventual; madre apoya en el cuidado pero sin ingresos estables."
    },
    detalle: "Evaluación de vivienda y soporte de alimentos familiares.",
    sede: "Año Nuevo (Comas)"
  },
  {
    id: 103,
    menor: "Mateo Sebastian Castillo Ruiz",
    codigo: "PDI-2026-005",
    etapa: "canalizado",
    urgencia: "Alta",
    tipoProblematica: "Familiar",
    fechaDerivacion: "2026-03-28",
    quienDeriva: {
      nombre: "Lic. Carmen Vargas",
      cargo: "Trabajadora Social ASP",
      telefono: "945-667-889"
    },
    situacionEncontrada: "Presunto abandono económico y riesgo de vulneración de derechos alimentarios.",
    accionesPrevias: "Derivación con oficio oficial a DEMUNA Carabayllo y entrega de Canasta Alimentaria BTF.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Madre sola a cargo de 3 menores dependientes."
    },
    detalle: "Derivado a DEMUNA y asignada Bolsa de Alimentos BTF.",
    sede: "San Pedro (Carabayllo)"
  },
  {
    id: 104,
    menor: "Mia Valentina Mendoza Ramos",
    codigo: "PDI-2026-002",
    etapa: "cerrado",
    urgencia: "Baja",
    tipoProblematica: "Salud",
    fechaDerivacion: "2026-03-10",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Ingresó con anemia leve (Hb 10.8 g/dL).",
    accionesPrevias: "Cumplió tratamiento de hierro supervisado y sesiones de platos saludables.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Ambos padres comprometidos con la alimentación del hogar."
    },
    detalle: "Recuperada a Hb 11.6 g/dL con informe social final archivado.",
    sede: "La Libertad (Comas)"
  }
];

export const CasoSocialModel = {
  _data: null,

  init() {
    const storage = window.PDI?.StorageService || StorageService;
    this._data = storage.getItem("pdi_mock_casos", defaultCasosSociales);
    return this._data;
  },

  getAll() {
    if (!this._data) this.init();
    return this._data;
  },

  getByStage(stage) {
    const list = this.getAll();
    return list.filter(c => c.etapa === stage);
  },

  updateStage(id, nuevaEtapa) {
    const list = this.getAll();
    const caso = list.find(c => c.id === Number(id));
    if (caso) {
      caso.etapa = nuevaEtapa;
      const storage = window.PDI?.StorageService || StorageService;
      storage.setItem("pdi_mock_casos", list);
      return caso;
    }
    return null;
  },

  add(nuevoCaso) {
    const list = this.getAll();
    list.unshift(nuevoCaso);
    const storage = window.PDI?.StorageService || StorageService;
    storage.setItem("pdi_mock_casos", list);
    return nuevoCaso;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.defaultCasosSociales = defaultCasosSociales;
  window.PDI.CasoSocialModel = CasoSocialModel;
}
