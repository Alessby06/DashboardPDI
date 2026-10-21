import test from 'node:test';
import assert from 'node:assert/strict';
import {
  claveCatalogo,
  normalizarParentesco,
  parentescoValido,
  migracionParentesco,
  seguroDbAUi,
  seguroUiADb,
  seguroValido,
  modalidadDbAUi,
  modalidadUiADb,
  modalidadValida,
  exoneracionDesdePct,
  pctDesdeExoneracion,
  tipoDocumentoCanonico,
  tipoLocalCanonico,
  tipoAlergiaCanonico,
  severidadAlergiaCanonico,
  descripcionAlergia,
  alergiaPrincipal,
  resumenAlergias,
  pesoSeveridadAlergia,
  sedeOperativa,
  sedeConocida,
  distritoDeSede,
  etiquetaSede,
  valorCompuestoSede,
  SEDES_POR_DISTRITO,
  SEDES_NOMBRES,
} from '../src/scripts/core/catalogos.js';
import { PARENTESCOS, SEDES, SEGUROS, MODALIDADES } from '../src/data/opcionesBeneficiario.js';

test('el catálogo de parentescos tiene las 18 opciones acordadas', () => {
  assert.equal(PARENTESCOS.length, 18);
  for (const valor of ['Padrastro', 'Madrastra', 'Hermano/a', 'Otro']) {
    assert.ok(PARENTESCOS.includes(valor), `falta ${valor}`);
  }
});

test('claveCatalogo ignora tildes, mayúsculas y espacios', () => {
  assert.equal(claveCatalogo('  TÍA  '), 'tia');
  assert.equal(claveCatalogo('Institucion Educativa'), 'institucion educativa');
});

test('tipoDocumentoCanonico conserva los valores de la base y corrige alias', () => {
  assert.equal(tipoDocumentoCanonico('DNI', true), 'DNI');
  assert.equal(tipoDocumentoCanonico('Carnet de Extranjería', true), 'Carnet Extranjeria');
  assert.equal(tipoDocumentoCanonico('Partida de Nacimiento', true), 'Partida Nacimiento');
  assert.equal(tipoDocumentoCanonico('Sin Documento', false), 'Sin Documento');
  assert.equal(tipoDocumentoCanonico('', true), 'DNI');
  assert.equal(tipoDocumentoCanonico('', false), 'Sin Documento');
});

test('tipoLocalCanonico unifica el colegio aliado y el legado sin tilde', () => {
  assert.equal(tipoLocalCanonico('Colegio Público Aliado'), 'Colegio Público (I.E.)');
  assert.equal(tipoLocalCanonico('Colegio Publico (I.E.)'), 'Colegio Público (I.E.)');
  assert.equal(tipoLocalCanonico('Iglesia Aliada'), 'Iglesia Aliada');
  assert.equal(tipoLocalCanonico(''), 'Local Comunal');
});

test('el catálogo de seguros admite plan privado y cobertura desconocida', () => {
  const valores = SEGUROS.map((opcion) => opcion.valor);
  assert.equal(valores.length, 6);
  for (const valor of ['Privado', 'Desconocido', 'SIS Gratuito', 'EsSalud', 'PNP / FFAA', 'Ninguno']) {
    assert.ok(valores.includes(valor), `falta ${valor}`);
  }
  assert.equal(seguroValido('Privado'), true);
  assert.equal(seguroValido('Desconocido'), true);
  assert.equal(seguroUiADb('Privado'), 'Privado');
  assert.equal(seguroUiADb('Desconocido'), 'Desconocido');
});

test('la alergia se normaliza: "Ninguna" no es un tipo que se guarde', () => {
  assert.equal(tipoAlergiaCanonico('Medicamento'), 'Medicamento');
  assert.equal(tipoAlergiaCanonico('medicamento'), 'Medicamento');
  assert.equal(tipoAlergiaCanonico('Ninguna'), '');
  assert.equal(tipoAlergiaCanonico(''), '');
  assert.equal(tipoAlergiaCanonico('Inventado'), '');
  assert.equal(severidadAlergiaCanonico('Grave / Anafilaxia'), 'Grave / Anafilaxia');
  assert.equal(severidadAlergiaCanonico('leve'), 'Leve');
  assert.equal(severidadAlergiaCanonico('No existe'), '');
  assert.equal(descripcionAlergia('Ninguna'), '');
  assert.equal(descripcionAlergia('  '), '');
  assert.equal(descripcionAlergia('Penicilina'), 'Penicilina');
});

test('la alergia vigente es la de mayor gravedad', () => {
  const lista = [
    { descripcion: 'Sulfas', severidad: 'Leve', activo: true },
    { descripcion: 'Penicilina', severidad: 'Grave / Anafilaxia', activo: true },
    { descripcion: 'Arroz', severidad: 'Moderada', activo: false },
  ];
  assert.equal(alergiaPrincipal(lista).descripcion, 'Penicilina');
  assert.equal(resumenAlergias(lista), 'Penicilina (Grave / Anafilaxia)');
  assert.equal(resumenAlergias([]), 'Ninguna');
  assert.equal(resumenAlergias([{ descripcion: 'Ninguna', severidad: 'Leve' }]), 'Ninguna');
  assert.equal(pesoSeveridadAlergia('Grave / Anafilaxia') > pesoSeveridadAlergia('Moderada'), true);
});

test('normalizarParentesco acepta las 18 opciones y los alias históricos', () => {
  for (const valor of PARENTESCOS) {
    assert.equal(normalizarParentesco(valor), valor);
  }
  assert.equal(normalizarParentesco('Tia'), 'Tía');
  assert.equal(normalizarParentesco('Tio'), 'Tío');
  assert.equal(normalizarParentesco('TUTOR LEGAL'), 'Cuidador Legal');
  assert.equal(normalizarParentesco('Padrastro'), 'Padrastro');
  assert.equal(normalizarParentesco('Hermano/a'), 'Hermano/a');
});

test('normalizarParentesco manda lo desconocido a Otro', () => {
  assert.equal(normalizarParentesco('Vecino'), 'Otro');
  assert.equal(normalizarParentesco(''), 'Otro');
});

test('parentescoValido solo acepta valores exactos del catálogo', () => {
  assert.equal(parentescoValido('Tía'), true);
  assert.equal(parentescoValido('Tia'), false);
  assert.equal(parentescoValido('Otro'), true);
});

test('migracionParentesco distingue migrar, sin cambio y revisar', () => {
  assert.deepEqual(migracionParentesco('Tia'), {
    original: 'Tia', destino: 'Tía', accion: 'migrar',
  });
  assert.deepEqual(migracionParentesco('Tutor Legal'), {
    original: 'Tutor Legal', destino: 'Cuidador Legal', accion: 'migrar',
  });
  assert.deepEqual(migracionParentesco('Madre'), {
    original: 'Madre', destino: 'Madre', accion: 'sin_cambio',
  });
  assert.deepEqual(migracionParentesco('Vecino'), {
    original: 'Vecino', destino: 'Vecino', accion: 'revisar',
  });
});

test('seguro: etiquetas exactas y valores históricos', () => {
  assert.equal(seguroDbAUi('SIS Gratuito'), 'SIS Gratuito');
  assert.equal(seguroDbAUi('SIS'), 'SIS Gratuito');
  assert.equal(seguroDbAUi('PNP/FFAA'), 'PNP / FFAA');
  assert.equal(seguroDbAUi('No tiene'), 'Ninguno');
  assert.equal(seguroDbAUi('Privado'), 'Privado');
  assert.equal(seguroDbAUi(''), '');
  assert.equal(seguroUiADb('SIS Gratuito'), 'SIS Gratuito');
  assert.equal(seguroUiADb(''), 'Ninguno');
  assert.equal(seguroValido('SIS Gratuito'), true);
  assert.equal(seguroValido('SIS'), false);
  for (const opcion of SEGUROS) {
    assert.equal(seguroDbAUi(opcion.valor), opcion.valor);
  }
});

test('modalidad: el valor del programa es "I.E." y se acepta cualquier forma', () => {
  assert.equal(modalidadDbAUi('I.E.'), 'I.E.');
  assert.equal(modalidadDbAUi('Institucion Educativa'), 'I.E.');
  assert.equal(modalidadDbAUi('Institución Educativa'), 'I.E.');
  assert.equal(modalidadDbAUi('Comunitaria'), 'Comunitaria');
  assert.equal(modalidadDbAUi('I.E'), 'I.E.');
  assert.equal(modalidadDbAUi(''), 'Comunitaria');
  assert.equal(modalidadUiADb('Institucion Educativa'), 'I.E.');
  for (const opcion of MODALIDADES) {
    assert.equal(modalidadDbAUi(opcion.valor), opcion.valor);
    assert.equal(modalidadValida(opcion.valor), true);
  }
});

test('exoneración: el porcentaje manda y el 50 % es Semi-exonerado', () => {
  assert.equal(exoneracionDesdePct(100), '100% (Exonerado Vulnerabilidad Extrema)');
  assert.equal(exoneracionDesdePct(50), '50% (Semi-exonerado)');
  assert.equal(exoneracionDesdePct('50'), '50% (Semi-exonerado)');
  assert.equal(exoneracionDesdePct(0), '0% (Aporte Ordinario)');
  assert.equal(exoneracionDesdePct(null), 'No registrado');
  assert.equal(exoneracionDesdePct(''), 'No registrado');
  assert.equal(pctDesdeExoneracion('100% (Exonerado Vulnerabilidad Extrema)'), 100);
  assert.equal(pctDesdeExoneracion('50% (Aporte Reducido)'), 50);
  assert.equal(pctDesdeExoneracion('0% (Aporte Ordinario)'), 0);
});

test('sedes: el catálogo tiene 7 y no incluye Torre Blanca', () => {
  assert.equal(SEDES.length, 7);
  assert.equal(SEDES_NOMBRES.length, 7);
  assert.equal(SEDES_NOMBRES.includes('Carmen Alto'), true);
  assert.equal(SEDES_NOMBRES.includes('Torre Blanca'), false);
});

test('distritoDeSede resuelve Comas y Carabayllo', () => {
  assert.equal(distritoDeSede('Año Nuevo'), 'Comas');
  assert.equal(distritoDeSede('La Libertad'), 'Comas');
  assert.equal(distritoDeSede('Carmen Alto'), 'Comas');
  assert.equal(distritoDeSede('El Progreso'), 'Carabayllo');
  assert.equal(distritoDeSede('San Pedro'), 'Carabayllo');
  assert.equal(distritoDeSede('Los Bendecidos'), 'Carabayllo');
  assert.equal(distritoDeSede('Santa Rosa'), 'Carabayllo');
  assert.equal(distritoDeSede('Torre Blanca'), null);
  assert.equal(distritoDeSede('Comas - Año Nuevo'), 'Comas');
});

test('sedeConocida y etiquetaSede señalan las sedes no registradas', () => {
  assert.equal(sedeConocida('Carmen Alto'), true);
  assert.equal(sedeConocida('Torre Blanca'), false);
  assert.deepEqual(sedeOperativa('Carmen Alto'), {
    nombre: 'Carmen Alto', distrito: 'Comas', etiqueta: 'Carmen Alto (Comas)',
  });
  assert.equal(etiquetaSede('Carmen Alto'), 'Carmen Alto (Comas)');
  assert.equal(etiquetaSede('Torre Blanca'), 'Torre Blanca (No registrada)');
  assert.equal(etiquetaSede(''), 'Sin sede');
});

test('SEDES_POR_DISTRITO se deriva del catálogo', () => {
  assert.deepEqual(SEDES_POR_DISTRITO, {
    Comas: ['Año Nuevo', 'La Libertad', 'Carmen Alto'],
    Carabayllo: ['El Progreso', 'San Pedro', 'Los Bendecidos', 'Santa Rosa'],
  });
});

test('valorCompuestoSede devuelve el valor del formulario', () => {
  assert.equal(valorCompuestoSede('Año Nuevo'), 'Comas - Año Nuevo');
  assert.equal(valorCompuestoSede('Carmen Alto'), 'Comas - Carmen Alto');
  assert.equal(valorCompuestoSede('San Pedro'), 'Carabayllo - San Pedro');
  assert.equal(valorCompuestoSede('Torre Blanca'), 'Torre Blanca');
});
