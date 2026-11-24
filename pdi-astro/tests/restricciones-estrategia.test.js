import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularAniosDesdeFecha } from '../src/scripts/ui/fichaInscripcion.js';
import {
  setValues,
  getValues,
  setOptionDisabled,
  initEstrategiaMultiSelect,
} from '../src/scripts/ui/estrategiaMultiSelect.js';

test('calcularAniosDesdeFecha calcula con precisión los años cumplidos', () => {
  assert.equal(calcularAniosDesdeFecha(''), null, 'Fecha vacía debe devolver null');
  assert.equal(calcularAniosDesdeFecha('fecha-invalida'), null, 'Fecha inválida debe devolver null');

  const hoy = new Date();
  const anioActual = hoy.getFullYear();

  // Menor de 3 años (nacido hace 2 años)
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  const fecha2Anios = `${anioActual - 2}-${mes}-${dia}`;
  assert.equal(calcularAniosDesdeFecha(fecha2Anios), 2, 'Debe calcular 2 años');

  // En rango (5 años)
  const fecha5Anios = `${anioActual - 5}-${mes}-${dia}`;
  assert.equal(calcularAniosDesdeFecha(fecha5Anios), 5, 'Debe calcular 5 años');

  // Límite superior permitido (12 años)
  const fecha12Anios = `${anioActual - 12}-${mes}-${dia}`;
  assert.equal(calcularAniosDesdeFecha(fecha12Anios), 12, 'Debe calcular 12 años');

  // Fuera de rango superior (14 años)
  const fecha14Anios = `${anioActual - 14}-${mes}-${dia}`;
  assert.equal(calcularAniosDesdeFecha(fecha14Anios), 14, 'Debe calcular 14 años');
});

test('setOptionDisabled inhabilita opciones y desmarca automáticamente', () => {
  // Simular DOM mínimo de EstrategiaMultiSelect
  const domRoot = {
    id: 'testEstrategia',
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    querySelectorAll(selector) {
      if (selector === '.estr-chip') return this._chips;
      return [];
    },
    addEventListener() {},
    dispatchEvent() {},
    contains() { return true; },
  };

  const crearChip = (val) => ({
    dataset: { value: val },
    classList: {
      toggle() {},
    },
    setAttribute(k, v) { this[k] = v; },
    removeAttribute(k) { delete this[k]; },
    getAttribute(k) { return this[k]; },
    querySelector() { return null; },
  });

  const chipDesayuno = crearChip('Desayuno Infantil');
  const chipLonchera = crearChip('Lonchera Infantil');
  const chipCasita = crearChip('Casita del Saber');
  domRoot._chips = [chipDesayuno, chipLonchera, chipCasita];

  // Registrar en el mapa conectando el root simulado
  globalThis.document = {
    querySelectorAll() { return [domRoot]; }
  };

  initEstrategiaMultiSelect();

  // Marcar Desayuno y Casita
  setValues('testEstrategia', ['Desayuno Infantil', 'Casita del Saber']);
  assert.deepEqual(getValues('testEstrategia'), ['Desayuno Infantil', 'Casita del Saber']);

  // Inhabilitar Desayuno (por ejemplo porque edad > 12)
  setOptionDisabled(
    'testEstrategia',
    'Desayuno Infantil',
    true,
    'Exclusivo para menores de 3 a 12 años'
  );

  // Debe haberse desmarcado automáticamente
  assert.equal(chipDesayuno.dataset.inhabilitado, 'true');
  assert.equal(chipDesayuno['aria-disabled'], 'true');
  assert.equal(chipDesayuno.title, 'Exclusivo para menores de 3 a 12 años');
  assert.deepEqual(getValues('testEstrategia'), ['Casita del Saber'], 'Desayuno debe haberse desmarcado');

  // Habilitar nuevamente
  setOptionDisabled('testEstrategia', 'Desayuno Infantil', false);
  assert.equal(chipDesayuno.dataset.inhabilitado, undefined);
  assert.equal(chipDesayuno['aria-disabled'], undefined);
  assert.equal(chipDesayuno.title, undefined);
});
