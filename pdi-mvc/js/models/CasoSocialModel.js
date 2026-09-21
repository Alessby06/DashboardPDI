// Modelo de Casos Sociales (Derivaciones ASP - Área Social Pastoral)
// Sincronizado integralmente con los menores del Padrón Oficial de Beneficiarios
import { StorageService } from './StorageService.js';

export const defaultCasosSociales = [
  {
    id: 101,
    menor: "Liam Mateo Sanchez Diaz",
    codigo: "PDI-2026-003",
    etapa: "pendiente",
    urgencia: "Alta",
    tipoProblematica: "Nutricional / Abandono",
    fechaDerivacion: "2026-04-12",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Hb 9.6 g/dL (Anemia Moderada). Cuidadora principal es abuela Gladys Diaz (64 años) sin empleo formal ni pensión; alto riesgo de deserción alimentaria.",
    accionesPrevias: "Prescripción de sulfato ferroso y primera visita domiciliaria preliminar en El Progreso.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Padres ausentes. Solo cuenta con apoyo esporádico de vecina de la capilla."
    },
    detalle: "Hb: 9.6 g/dL (Anemia Moderada) + Abuela a cargo sin ingresos fijos en El Progreso.",
    sede: "El Progreso (Carabayllo)",
    vulnerabilidadPuntaje: 92
  },
  {
    id: 102,
    menor: "Dylan Josué Quispe Córdova",
    codigo: "PDI-2026-008",
    etapa: "pendiente",
    urgencia: "Alta",
    tipoProblematica: "Nutricional / Extrema Pobreza",
    fechaDerivacion: "2026-04-10",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Hb 9.8 g/dL (Anemia Moderada). Hogar monoparental con madre Karina Córdova a cargo de 3 dependientes en vivienda precaria de madera sin red de agua.",
    accionesPrevias: "Sesión demostrativa de alimentos ricos en hierro y entrega de suplementos ferrosos.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Madre soltera sin pensión de alimentos ni apoyo de familiares directos."
    },
    detalle: "Hb 9.8 g/dL + Madre sola con 3 hijos en AA.HH. San Pedro sin agua potable.",
    sede: "San Pedro (Carabayllo)",
    vulnerabilidadPuntaje: 90
  },
  {
    id: 103,
    menor: "Lucas Alejandro Torres Vilchez",
    codigo: "PDI-2026-010",
    etapa: "pendiente",
    urgencia: "Media",
    tipoProblematica: "Socioeconómica",
    fechaDerivacion: "2026-04-09",
    quienDeriva: {
      nombre: "Lic. Carmen Vargas",
      cargo: "Trabajadora Social ASP",
      telefono: "945-667-889"
    },
    situacionEncontrada: "Cuidadora Sonia Vilchez en desempleo prolongado. Solicita canasta de contingencia y exoneración de aporte simbólico.",
    accionesPrevias: "Evaluación preliminar de balance de ingresos y encuesta de vulnerabilidad.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Tía materna brinda apoyo con alimentos de forma quincenal."
    },
    detalle: "Desempleo prolongado del hogar en Los Bendecidos; requiere canasta de contingencia.",
    sede: "Los Bendecidos (Carabayllo)",
    vulnerabilidadPuntaje: 82
  },
  {
    id: 104,
    menor: "Thiago Gael Flores Quispe",
    codigo: "PDI-2026-001",
    etapa: "evaluacion",
    urgencia: "Media",
    tipoProblematica: "Familiar / Hábitat",
    fechaDerivacion: "2026-04-08",
    quienDeriva: {
      nombre: "Prof. Delia Morales",
      cargo: "Promotora Educativa Casitas",
      telefono: "912-334-556"
    },
    situacionEncontrada: "Vivienda precaria con piso de tierra y hacinamiento en Comité 12 de Año Nuevo. Se realiza evaluación socioeconómica de 6 dimensiones.",
    accionesPrevias: "Visita domiciliaria preliminar realizada y aplicación de ficha socioeconómica en curso.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Padre trabaja de estibador eventual; madre Rosa Quispe al cuidado del hogar."
    },
    detalle: "Evaluación socioeconómica y de hábitat en curso en Año Nuevo.",
    sede: "Año Nuevo (Comas)",
    vulnerabilidadPuntaje: 84
  },
  {
    id: 105,
    menor: "Benjamín Elías Navarro Huamán",
    codigo: "PDI-2026-006",
    etapa: "evaluacion",
    urgencia: "Media",
    tipoProblematica: "Familiar / Salud",
    fechaDerivacion: "2026-04-05",
    quienDeriva: {
      nombre: "Lic. Carmen Vargas",
      cargo: "Trabajadora Social ASP",
      telefono: "945-667-889"
    },
    situacionEncontrada: "Madre Patricia Huamán con tratamiento médico crónico. En evaluación para subsidio nutricional y acompañamiento pastoral.",
    accionesPrevias: "Coordinación con posta médica Santa Rosa para verificación de recetas y atenciones.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Abuelo apoya en traslados del menor hacia la sede de atención."
    },
    detalle: "Salud crónica de la madre y evaluación de subsidio alimentario en Santa Rosa.",
    sede: "Santa Rosa (Carabayllo)",
    vulnerabilidadPuntaje: 78
  },
  {
    id: 106,
    menor: "Camila Fernanda Rojas Morales",
    codigo: "PDI-2026-007",
    etapa: "evaluacion",
    urgencia: "Media",
    tipoProblematica: "Vulnerabilidad Intermedia",
    fechaDerivacion: "2026-04-02",
    quienDeriva: {
      nombre: "Prof. Delia Morales",
      cargo: "Promotora Educativa Casitas",
      telefono: "912-334-556"
    },
    situacionEncontrada: "Madre Miriam Morales solicita reconsideración para exoneración total debido al cese laboral del cónyuge.",
    accionesPrevias: "Recepción de solicitud escrita y programación de visita domiciliaria de constatación.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Núcleo familiar nuclear con apoyo de abuela materna."
    },
    detalle: "Revisión de aporte y estado laboral de los cuidadores en Año Nuevo.",
    sede: "Año Nuevo (Comas)",
    vulnerabilidadPuntaje: 68
  },
  {
    id: 107,
    menor: "Mateo Sebastian Castillo Ruiz",
    codigo: "PDI-2026-005",
    etapa: "canalizado",
    urgencia: "Alta",
    tipoProblematica: "Legal / Abandono",
    fechaDerivacion: "2026-03-28",
    quienDeriva: {
      nombre: "Lic. Carmen Vargas",
      cargo: "Trabajadora Social ASP",
      telefono: "945-667-889"
    },
    situacionEncontrada: "Presunto abandono económico paterno y riesgo de vulneración de derechos de alimentos del menor.",
    accionesPrevias: "Derivación mediante Oficio Oficial a DEMUNA Carabayllo y asignación de Canasta Familiar Banco BTF.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Madre Elena Ruiz sola al cuidado de 3 hijos dependientes."
    },
    detalle: "Derivado a DEMUNA Carabayllo con Canasta de Alimentos BTF asignada.",
    sede: "San Pedro (Carabayllo)",
    vulnerabilidadPuntaje: 88
  },
  {
    id: 108,
    menor: "Mia Valentina Mendoza Ramos",
    codigo: "PDI-2026-002",
    etapa: "cerrado",
    urgencia: "Baja",
    tipoProblematica: "Salud / Recuperación",
    fechaDerivacion: "2026-03-10",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Ingresó con anemia leve y vulnerabilidad económica. Madre Carmen Ramos completó sesiones demostrativas y el menor recuperó niveles normales de hemoglobina (Hb 11.6 g/dL).",
    accionesPrevias: "Cumplió esquema de suplementación y asistencia perfecta al comedor.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Ambos padres plenamente comprometidos y con empleo recuperado."
    },
    detalle: "Recuperada a Hb 11.6 g/dL (Normal). Caso cerrado con informe favorable.",
    sede: "La Libertad (Comas)",
    vulnerabilidadPuntaje: 62
  },
  {
    id: 109,
    menor: "Luciana Sofia Alvarez Vega",
    codigo: "PDI-2026-004",
    etapa: "cerrado",
    urgencia: "Baja",
    tipoProblematica: "Escolaridad / Nivelación",
    fechaDerivacion: "2026-03-05",
    quienDeriva: {
      nombre: "Prof. Delia Morales",
      cargo: "Promotora Educativa Casitas",
      telefono: "912-334-556"
    },
    situacionEncontrada: "Presentaba rezago en lectoescritura al inicio de año. Culminó módulo de refuerzo escolar con materiales Faber-Castell con 96% de asistencia.",
    accionesPrevias: "Tutoría personalizada semanal y entrega de kit de útiles escolares.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Padre Jorge Alvarez brinda acompañamiento activo en tareas."
    },
    detalle: "Nivelación escolar completada en Casitas del Saber. Informe favorable.",
    sede: "Año Nuevo (Comas)",
    vulnerabilidadPuntaje: 45
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
