import test from 'node:test';
import assert from 'node:assert/strict';
import { AnemiaCalculator } from '../src/scripts/utils/AnemiaCalculator.js';

test('calculate() devuelve la clase canónica que se guarda en el padrón', () => {
  assert.equal(AnemiaCalculator.calculate(6.9).clase, 'Severa');
  assert.equal(AnemiaCalculator.calculate(7.0).clase, 'Moderada');
  assert.equal(AnemiaCalculator.calculate(9.9).clase, 'Moderada');
  assert.equal(AnemiaCalculator.calculate(10.0).clase, 'Leve');
  assert.equal(AnemiaCalculator.calculate(10.9).clase, 'Leve');
  assert.equal(AnemiaCalculator.calculate(11.0).clase, 'Normal');
  assert.equal(AnemiaCalculator.calculate('').clase, null);
});

test('normalizar() reconoce las etiquetas históricas y las claves canónicas', () => {
  assert.equal(AnemiaCalculator.normalizar('Normal'), 'Normal');
  assert.equal(AnemiaCalculator.normalizar('Normal (Sin Anemia)'), 'Normal');
  assert.equal(AnemiaCalculator.normalizar('Leve'), 'Leve');
  assert.equal(AnemiaCalculator.normalizar('Anemia Leve'), 'Leve');
  assert.equal(AnemiaCalculator.normalizar('En riesgo'), 'Leve');
  assert.equal(AnemiaCalculator.normalizar('Anemia Moderada'), 'Moderada');
  assert.equal(AnemiaCalculator.normalizar('Anemia Severa'), 'Severa');
  assert.equal(AnemiaCalculator.normalizar(''), null);
  assert.equal(AnemiaCalculator.normalizar(null), null);
});

test('resultadoDb() traduce la clase o etiqueta al catálogo exacto de la nube', () => {
  assert.equal(AnemiaCalculator.resultadoDb(AnemiaCalculator.calculate(10.4).clase), 'Anemia leve');
  assert.equal(AnemiaCalculator.resultadoDb('Anemia Leve'), 'Anemia leve');
  assert.equal(AnemiaCalculator.resultadoDb('anemia leve'), 'Anemia leve');
  assert.equal(AnemiaCalculator.resultadoDb('Anemia severa'), 'Anemia grave');
  assert.equal(AnemiaCalculator.resultadoDb('Anemia grave'), 'Anemia grave');
  assert.equal(AnemiaCalculator.resultadoDb('Normal'), 'Regular');
  assert.equal(AnemiaCalculator.resultadoDb('Normal (Sin Anemia)'), 'Regular');
  assert.equal(AnemiaCalculator.resultadoDb('Regular'), 'Regular');
  assert.equal(AnemiaCalculator.resultadoDb('En riesgo'), 'En riesgo');
  assert.equal(AnemiaCalculator.resultadoDb(''), null);
  assert.equal(AnemiaCalculator.resultadoDb(null), null);
});

test('un dosaje registrado con la clase canónica cuenta en el semáforo', () => {
  // Reproduce el guardado real: se persiste calc.clase, no calc.label.
  const calc = AnemiaCalculator.calculate(10.4);
  const registro = { anemia: calc.clase };
  const cuenta = { Normal: 0, Leve: 0, Moderada: 0, Severa: 0 };
  const clase = AnemiaCalculator.normalizar(registro.anemia);
  cuenta[clase] += 1;

  assert.equal(clase, 'Leve');
  assert.equal(cuenta.Leve, 1);
  assert.equal(AnemiaCalculator.normalizar('Anemia Leve').startsWith('Leve'), true);
});
