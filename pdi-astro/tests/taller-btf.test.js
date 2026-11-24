import test from 'node:test';
import assert from 'node:assert/strict';

// Mock mínimo de localStorage para StorageService en Node
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { TallerBtfModel, SESIONES_BTF } = await import('../src/scripts/models/TallerBtfModel.js');

test('SESIONES_BTF define las 4 sesiones del ciclo de Buen Trato en Familia', () => {
  assert.equal(SESIONES_BTF.length, 4);
  assert.equal(SESIONES_BTF[0].numero, 1);
  assert.equal(SESIONES_BTF[3].numero, 4);
});

test('TallerBtfModel.guardarTaller deriva distrito, sanea negativos y resume por distrito', () => {
  store.clear();
  const r1 = TallerBtfModel.guardarTaller({
    fecha: '2026-11-24',
    sede: 'Año Nuevo',
    aliado: 'Iglesia Alianza Cristiana',
    sesionNumero: 2,
    participantesPadres: 18,
    familiasPadron: 12,
    responsable: 'Lic. Ana Social',
  });

  assert.equal(r1.distrito, 'Comas');
  assert.equal(r1.sesionNumero, 2);
  assert.equal(r1.sesionTitulo, 'Disciplina sin Violencia');

  const r2 = TallerBtfModel.guardarTaller({
    fecha: '2026-11-24',
    sede: 'El Progreso',
    sesionNumero: 99,
    participantesPadres: -5,
    familiasPadron: 4,
  });

  assert.equal(r2.distrito, 'Carabayllo');
  assert.equal(r2.sesionNumero, 4);
  assert.equal(r2.participantesPadres, 0);

  const resumen = TallerBtfModel.resumenPorDistrito();
  assert.equal(resumen.comas, 18);
  assert.equal(resumen.carabayllo, 0);
  assert.equal(resumen.totalSesiones, 2);
  assert.equal(resumen.totalPadres, 18);
  assert.equal(resumen.totalFamilias, 16);
});
