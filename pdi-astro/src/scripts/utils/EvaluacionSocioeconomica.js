// ===========================================================================
//  EVALUACIÓN SOCIOECONÓMICA · MOTOR DE CÁLCULO
// ===========================================================================
//  Reproduce la hoja "Indicadores" del instrumento oficial:
//    - 10 dimensiones ponderadas (pesos F/J, los vigentes).
//    - Vivienda se compone de 11 subdimensiones.
//    - Edad, instrucción, ocupación, tiempo y seguro se promedian entre los
//      miembros adultos del hogar.
//  El resultado es una recomendación; la aprobación es humana (Social propone,
//  Coordinación aprueba).
// ===========================================================================

export const PESOS = {
  edad: 0.04,
  instruccion: 0.10,
  ocupacion: 0.16,
  tiempo: 0.05,
  ingreso: 0.28,
  vivienda: 0.20,
  seguro: 0.05,
  enfermedades: 0.07,
  apoyo: 0.00,
  identificacion: 0.05,
};

export const PESOS_VIVIENDA = {
  tipo: 0.15,
  espacio: 0.10,
  tenencia: 0.35,
  piso: 0.03,
  pared: 0.10,
  techo: 0.05,
  agua: 0.05,
  desague: 0.05,
  equipamiento: 0.04,
  bienes: 0.03,
  electricidad: 0.05,
};

export const VERSION_INSTRUMENTO = 'FJ-2026-1';

const ETIQUETAS = {
  edad: 'Edad',
  instruccion: 'Nivel de instrucción',
  ocupacion: 'Ocupación',
  tiempo: 'Tiempo de servicio',
  ingreso: 'Ingreso / Egreso',
  vivienda: 'Vivienda',
  seguro: 'Seguro',
  enfermedades: 'Enfermedades',
  apoyo: 'Apoyo institucional',
  identificacion: 'Identificación con el proyecto',
};

const PUNTAJE_EDAD = {
  padre: [[20, 25, 60], [26, 30, 40], [31, 35, 40], [36, 40, 30], [41, 50, 40], [51, 65, 60], [66, 200, 80]],
  hermano: [[0, 1, 100], [2, 3, 80], [4, 5, 60], [6, 10, 50], [11, 13, 50], [14, 200, 50]],
  otro: [[0, 1, 80], [2, 3, 60], [4, 5, 40], [6, 10, 20], [11, 13, 10], [14, 200, 0]],
};

const PUNTAJE_INSTRUCCION = {
  'primaria-incompleta': 100,
  'primaria-completa': 80,
  'secundaria-incompleta': 60,
  'secundaria-completa': 40,
  'instituto-incompleto': 30,
  'instituto-completo': 0,
  'universidad-incompleto': 0,
  'universidad-completo': 0,
  'sin-instruccion': 100,
};

const PUNTAJE_OCUPACION = {
  'sin-actividad': 100,
  'hogar': 45,
  'jubilado': 30,
  'estudiante': 25,
  'ama-casa': 45,
  'microempresario': 5,
  'independiente-inestable': 70,
  'independiente-intermedio': 50,
  'dependiente': 10,
};

const PUNTAJE_TIEMPO = {
  'informal-inestable': 80,
  'informal-estable': 50,
  'formal-corto': 50,
  'formal-largo': 0,
  'ama-casa': 50,
};

const PUNTAJE_SEGURO = { SIS: 100, EsSalud: 10, PNP: 10, Otro: 10, Ninguno: 80 };

const PUNTAJE_ENFERMEDAD = {
  'crónica': [80, 60],
  adicciones: [40, 20],
  'discapacidad-mental': [100, 80],
  'discapacidad-física': [90, 60],
};

const PUNTAJE_IDENTIFICACION = {
  bueno: 100,
  'más-que-regular': 75,
  regular: 50,
  'más-o-menos': 25,
  deficiente: 0,
};

const PUNTAJE_VIVIENDA = {
  tipo: { independiente: 40, compartida: 100, alojado: 40 },
  tenencia: { familiar: 70, alquilada: 100, propia: 0, guardiania: 70, terreno: 10 },
  piso: {
    'vinilicos': 40, losetas: 20, madera: 0, cemento: 60, tierra: 100, 'falso-piso': 80,
  },
  pared: {
    'ladrillo-sin-tarrajeo': 10, 'ladrillo-acabado': 0, piedra: 20, adobe: 60,
    'madera-prefabricada': 40, 'madera-provisional': 80, estera: 100,
  },
  techo: { concreto: 10, estera: 100, calamina: 40, cana: 60 },
  agua: { 'red-dentro': 10, 'red-fuera': 60, pilon: 80, cisterna: 100 },
  desague: { 'red-dentro': 10, 'red-fuera': 60, pozo: 80, 'no-tiene': 100 },
  equipamiento: { '1-3': 100, '4-6': 80, '7-9': 40, '10+': 10 },
  bienes: {
    propiedades: 30, casa: 20, maquinas: 10, mototaxi: 40,
    carro: 30, moto: 60, triciclo: 80, ninguno: 100,
  },
};

function num(valor, porDefecto = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : porDefecto;
}

function limitar(valor, min = 0, max = 100) {
  return Math.max(min, Math.min(max, valor));
}

function promedio(valores) {
  const validos = valores.filter(v => Number.isFinite(v));
  if (!validos.length) return 0;
  return validos.reduce((a, b) => a + b, 0) / validos.length;
}

function rangoPuntaje(edad, tabla) {
  const anios = num(edad, -1);
  if (anios < 0) return null;
  const fila = tabla.find(([min, max]) => anios >= min && anios <= max);
  return fila ? fila[2] : 0;
}

export function puntajeEdad(edad, parentesco = 'padre') {
  const clave = /herman/i.test(parentesco) ? 'hermano' : (/madre|padre|padrastro|madrastra/i.test(parentesco) ? 'padre' : 'otro');
  return rangoPuntaje(edad, PUNTAJE_EDAD[clave]);
}

export function puntajeInstruccion(valor) {
  return PUNTAJE_INSTRUCCION[valor] ?? 0;
}

export function puntajeOcupacion(valor) {
  return PUNTAJE_OCUPACION[valor] ?? 0;
}

export function puntajeTiempo(valor, esPadre = true) {
  const base = PUNTAJE_TIEMPO[valor] ?? 0;
  if (esPadre) return base;
  // La hoja baja el puntaje de los miembros que no son padre/madre.
  if (base >= 80) return 60;
  if (base >= 50) return 30;
  return 0;
}

export function puntajeIngresoPerCapita(monto) {
  const valor = num(monto, 0);
  if (valor < 200) return 100;
  if (valor <= 250) return 80;
  if (valor <= 300) return 50;
  if (valor <= 400) return 30;
  return 0;
}

export function puntajeSeguro(valor) {
  return PUNTAJE_SEGURO[valor] ?? 0;
}

export function puntajeEnfermedad(tipo, esPadre = true) {
  const fila = PUNTAJE_ENFERMEDAD[tipo];
  if (!fila) return 0;
  return esPadre ? fila[0] : fila[1];
}

export function puntajeIdentificacion(valor) {
  return PUNTAJE_IDENTIFICACION[valor] ?? 0;
}

function miembrosAdultos(datos) {
  const lista = [];
  const padres = datos?.padres || {};
  for (const [clave, persona] of Object.entries(padres)) {
    if (!persona || typeof persona !== 'object') continue;
    lista.push({ ...persona, parentesco: clave === 'madre' ? 'Madre' : 'Padre' });
  }
  for (const miembro of (datos?.composicion || [])) {
    if (!miembro || typeof miembro !== 'object') continue;
    if (/usuario|niño|nna/i.test(String(miembro.parentesco || ''))) continue;
    lista.push(miembro);
  }
  return lista;
}

function esPadreOMadre(parentesco) {
  return /madre|padre|padrastro|madrastra/i.test(String(parentesco || ''));
}

function ingresoMensual(item) {
  if (!item) return 0;
  if (typeof item === 'number') return num(item);
  const monto = num(item.monto, 0);
  const frecuencia = String(item.frecuencia || 'mensual').toLowerCase();
  if (frecuencia.includes('diario')) return monto * 30;
  if (frecuencia.includes('semanal')) return monto * 4.33;
  if (frecuencia.includes('quincenal')) return monto * 2;
  return monto;
}

export function calcularVivienda(vivienda = {}) {
  const claves = ['tipo', 'tenencia', 'piso', 'pared', 'techo', 'agua', 'desague', 'equipamiento'];
  const tieneDatos = claves.some(k => vivienda[k])
    || num(vivienda.ambientes, 0) > 0
    || num(vivienda.personas, 0) > 0
    || (Array.isArray(vivienda.bienes) && vivienda.bienes.length > 0)
    || vivienda.electricidad === false;
  const vacio = {
    tipo: 0, espacio: 0, tenencia: 0, piso: 0, pared: 0, techo: 0,
    agua: 0, desague: 0, equipamiento: 0, bienes: 0, electricidad: 0,
  };
  if (!tieneDatos) return { puntaje: 0, dimensiones: vacio };

  const tipo = PUNTAJE_VIVIENDA.tipo[vivienda.tipo] ?? 0;
  const personas = Math.max(1, num(vivienda.personas, 1));
  const ambientes = Math.max(1, num(vivienda.ambientes, 1));
  const porAmbiente = personas / ambientes;
  let espacio = 0;
  if (porAmbiente >= 6) espacio = 100;
  else if (porAmbiente >= 4) espacio = 80;
  else if (porAmbiente >= 3) espacio = 40;
  else if (porAmbiente >= 2) espacio = 20;

  const tenencia = PUNTAJE_VIVIENDA.tenencia[vivienda.tenencia] ?? 0;
  const piso = PUNTAJE_VIVIENDA.piso[vivienda.piso] ?? 0;
  const pared = PUNTAJE_VIVIENDA.pared[vivienda.pared] ?? 0;
  const techo = PUNTAJE_VIVIENDA.techo[vivienda.techo] ?? 0;
  const agua = PUNTAJE_VIVIENDA.agua[vivienda.agua] ?? 0;
  const desague = PUNTAJE_VIVIENDA.desague[vivienda.desague] ?? 0;
  const equipamiento = PUNTAJE_VIVIENDA.equipamiento[vivienda.equipamiento] ?? 0;
  const bienesLista = Array.isArray(vivienda.bienes) ? vivienda.bienes : [];
  const bienes = bienesLista.length
    ? Math.max(...bienesLista.map(b => PUNTAJE_VIVIENDA.bienes[b] ?? 0))
    : 100;
  const electricidad = vivienda.electricidad === false ? 100 : 0;

  const dimensiones = {
    tipo, espacio, tenencia, piso, pared, techo,
    agua, desague, equipamiento, bienes, electricidad,
  };
  const puntaje = Object.entries(PESOS_VIVIENDA)
    .reduce((total, [clave, peso]) => total + (dimensiones[clave] || 0) * peso, 0);
  return { puntaje: Math.round(puntaje * 10) / 10, dimensiones };
}

function calcularDimensiones(datos = {}) {
  const adultos = miembrosAdultos(datos);
  const edades = adultos.map(a => puntajeEdad(a.edad, a.parentesco)).filter(v => v != null);
  const instrucciones = adultos.filter(a => a.instruccion).map(a => puntajeInstruccion(a.instruccion));
  const ocupaciones = adultos.filter(a => a.ocupacion).map(a => puntajeOcupacion(a.ocupacion));
  const tiempos = adultos.filter(a => a.tiempoServicio).map(a => puntajeTiempo(a.tiempoServicio, esPadreOMadre(a.parentesco)));
  const seguros = adultos.filter(a => a.seguro).map(a => puntajeSeguro(a.seguro));

  const ingresos = Object.values(datos?.economia?.ingresos || {}).reduce((t, i) => t + ingresoMensual(i), 0);
  const egresos = Object.values(datos?.economia?.egresos || {}).reduce((t, e) => t + num(e, 0), 0);
  const hayEconomia = Object.values(datos?.economia?.ingresos || {})
    .some(i => i && i.monto !== '' && i.monto != null && Number(i.monto) > 0)
    || Object.values(datos?.economia?.egresos || {})
      .some(e => e !== '' && e != null && Number(e) > 0);
  const personasHogar = Math.max(
    1,
    num(datos?.economia?.dependientes, 0) || num(datos?.vivienda?.personas, 1),
  );
  const ingresoPerCapita = ingresos / personasHogar;
  const egresoPerCapita = egresos / personasHogar;
  const ingresoScore = hayEconomia
    ? (puntajeIngresoPerCapita(ingresoPerCapita) * 0.6)
      + (puntajeIngresoPerCapita(egresoPerCapita) * 0.4)
    : 0;

  const vivienda = calcularVivienda(datos?.vivienda || {});

  const salud = datos?.salud || {};
  let enfermedad = 0;
  if (salud.enfermedadCronica || (salud.miembros || []).length) {
    const puntajes = (salud.miembros || []).map(m =>
      puntajeEnfermedad(m.tipo, esPadreOMadre(m.parentesco)));
    enfermedad = puntajes.length ? Math.max(...puntajes) : 60;
  }
  const apoyo = (salud.ayudas || []).length ? 0 : 100;
  const identificacion = puntajeIdentificacion(datos?.observaciones?.identificacion);

  return {
    edad: Math.round(promedio(edades) * 10) / 10,
    instruccion: Math.round(promedio(instrucciones) * 10) / 10,
    ocupacion: Math.round(promedio(ocupaciones) * 10) / 10,
    tiempo: Math.round(promedio(tiempos) * 10) / 10,
    ingreso: Math.round(limitar(ingresoScore) * 10) / 10,
    vivienda: vivienda.puntaje,
    seguro: Math.round(promedio(seguros) * 10) / 10,
    enfermedades: enfermedad,
    apoyo,
    identificacion,
    _vivienda: vivienda.dimensiones,
  };
}

export function clasificar(puntaje) {
  if (puntaje >= 80) return 'Extrema Pobreza / Vulnerabilidad Crítica';
  if (puntaje >= 60) return 'Vulnerabilidad Alta / Prioridad Social';
  if (puntaje >= 40) return 'Vulnerabilidad Moderada';
  return 'Baja Vulnerabilidad / Situación Estable';
}

export function exoneracionSugerida(puntaje) {
  if (puntaje >= 80) return '100%';
  if (puntaje >= 60) return '50%';
  return '0%';
}

export function calcularEvaluacion(datos = {}) {
  const dimensiones = calcularDimensiones(datos);
  const detalle = Object.entries(PESOS).map(([clave, peso]) => ({
    clave,
    etiqueta: ETIQUETAS[clave] || clave,
    puntaje: dimensiones[clave] ?? 0,
    peso,
    aporte: Math.round((dimensiones[clave] ?? 0) * peso * 100) / 100,
  }));
  const puntaje = Math.round(detalle.reduce((t, d) => t + d.aporte, 0) * 10) / 10;
  return {
    version: VERSION_INSTRUMENTO,
    puntaje,
    clasificacion: clasificar(puntaje),
    exoneracionSugerida: exoneracionSugerida(puntaje),
    dimensiones: detalle,
    vivienda: dimensiones._vivienda || {},
  };
}
