import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PESOS,
  PESOS_VIVIENDA,
  calcularEvaluacion,
  calcularVivienda,
  clasificar,
  exoneracionSugerida,
  puntajeEdad,
  puntajeInstruccion,
  puntajeOcupacion,
  puntajeIngresoPerCapita,
} from '../src/scripts/utils/EvaluacionSocioeconomica.js';

test('los pesos F/J suman 1,00', () => {
  const total = Object.values(PESOS).reduce((a, b) => a + b, 0);
  assert.equal(Math.round(total * 100) / 100, 1);
});

test('las subdimensiones de vivienda suman 1,00', () => {
  const total = Object.values(PESOS_VIVIENDA).reduce((a, b) => a + b, 0);
  assert.equal(Math.round(total * 100) / 100, 1);
});

test('las rúbricas principales devuelven los valores de la hoja', () => {
  assert.equal(puntajeEdad(25, 'Madre'), 60);
  assert.equal(puntajeEdad(70, 'Padre'), 80);
  assert.equal(puntajeEdad(3, 'Hermano'), 80);
  assert.equal(puntajeInstruccion('primaria-incompleta'), 100);
  assert.equal(puntajeInstruccion('universidad-completo'), 0);
  assert.equal(puntajeOcupacion('independiente-inestable'), 70);
  assert.equal(puntajeOcupacion('dependiente'), 10);
  assert.equal(puntajeIngresoPerCapita(199), 100);
  assert.equal(puntajeIngresoPerCapita(250), 80);
  assert.equal(puntajeIngresoPerCapita(401), 0);
});

test('una familia en vulnerabilidad extrema obtiene 100 %', () => {
  const datos = {
    padres: {
      madre: {
        edad: 70, instruccion: 'primaria-incompleta', ocupacion: 'sin-actividad',
        tiempoServicio: 'informal-inestable', seguro: 'Ninguno',
      },
      padre: {
        edad: 70, instruccion: 'primaria-incompleta', ocupacion: 'sin-actividad',
        tiempoServicio: 'informal-inestable', seguro: 'Ninguno',
      },
    },
    economia: {
      ingresos: { padre: { monto: 100, frecuencia: 'mensual' } },
      egresos: { alimentacion: 100 },
      dependientes: 6,
    },
    vivienda: {
      tipo: 'compartida', ambientes: 1, personas: 6, tenencia: 'alquilada',
      piso: 'tierra', pared: 'estera', techo: 'estera', agua: 'cisterna',
      desague: 'no-tiene', equipamiento: '1-3', bienes: ['ninguno'], electricidad: false,
    },
    salud: {
      enfermedadCronica: true,
      miembros: [{ parentesco: 'Madre', tipo: 'discapacidad-mental' }],
      ayudas: [],
    },
    observaciones: { identificacion: 'deficiente' },
  };
  const r = calcularEvaluacion(datos);
  assert.ok(r.puntaje >= 90, `puntaje ${r.puntaje}`);
  assert.equal(r.exoneracionSugerida, '100%');
  assert.equal(r.clasificacion, 'Extrema Pobreza / Vulnerabilidad Crítica');
});

test('una familia estable queda por debajo de 40 y sin exoneración', () => {
  const datos = {
    padres: {
      madre: { edad: 35, instruccion: 'universidad-completo', ocupacion: 'dependiente', tiempoServicio: 'formal-largo', seguro: 'EsSalud' },
      padre: { edad: 35, instruccion: 'universidad-completo', ocupacion: 'dependiente', tiempoServicio: 'formal-largo', seguro: 'EsSalud' },
    },
    economia: {
      ingresos: { padre: { monto: 3000, frecuencia: 'mensual' }, madre: { monto: 2500, frecuencia: 'mensual' } },
      egresos: { alimentacion: 1200, alquiler: 900 },
      dependientes: 4,
    },
    vivienda: {
      tipo: 'independiente', ambientes: 3, personas: 3, tenencia: 'propia',
      piso: 'vinilicos', pared: 'ladrillo-acabado', techo: 'concreto', agua: 'red-dentro',
      desague: 'red-dentro', equipamiento: '10+', bienes: ['propiedades'], electricidad: true,
    },
    salud: { enfermedadCronica: false, miembros: [], ayudas: [] },
    observaciones: { identificacion: 'bueno' },
  };
  const r = calcularEvaluacion(datos);
  assert.ok(r.puntaje < 40, `puntaje ${r.puntaje}`);
  assert.equal(r.exoneracionSugerida, '0%');
  assert.equal(r.clasificacion, 'Baja Vulnerabilidad / Situación Estable');
});

test('los adultos se promedian y la vivienda devuelve sus subdimensiones', () => {
  const datos = {
    padres: {
      madre: { edad: 25, instruccion: 'primaria-incompleta', ocupacion: 'dependiente', seguro: 'SIS' },
      padre: { edad: 70, instruccion: 'universidad-completo', ocupacion: 'dependiente', seguro: 'SIS' },
    },
    vivienda: {
      tipo: 'independiente', ambientes: 2, personas: 4, tenencia: 'propia',
      piso: 'cemento', pared: 'adobe', techo: 'calamina', agua: 'red-fuera',
      desague: 'pozo', equipamiento: '4-6', bienes: ['casa'], electricidad: true,
    },
  };
  const r = calcularEvaluacion(datos);
  const edad = r.dimensiones.find(d => d.clave === 'edad');
  const instruccion = r.dimensiones.find(d => d.clave === 'instruccion');
  assert.equal(edad.puntaje, 70);
  assert.equal(instruccion.puntaje, 50);
  const vivienda = calcularVivienda(datos.vivienda);
  assert.ok(Object.keys(vivienda.dimensiones).length === 11);
});

test('los umbrales de clasificación y exoneración son los acordados', () => {
  assert.equal(clasificar(80), 'Extrema Pobreza / Vulnerabilidad Crítica');
  assert.equal(clasificar(60), 'Vulnerabilidad Alta / Prioridad Social');
  assert.equal(clasificar(40), 'Vulnerabilidad Moderada');
  assert.equal(clasificar(39.9), 'Baja Vulnerabilidad / Situación Estable');
  assert.equal(exoneracionSugerida(80), '100%');
  assert.equal(exoneracionSugerida(60), '50%');
  assert.equal(exoneracionSugerida(59.9), '0%');
});

test('sin datos no revienta y devuelve un resultado estable', () => {
  const r = calcularEvaluacion({});
  assert.equal(typeof r.puntaje, 'number');
  assert.ok(r.puntaje >= 0 && r.puntaje <= 100);
  assert.equal(r.exoneracionSugerida, '0%');
});
