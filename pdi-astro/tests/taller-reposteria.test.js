import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { TallerReposteriaModel, TEMATICAS_REPOSTERIA } = await import('../src/scripts/models/TallerReposteriaModel.js');

test('TEMATICAS_REPOSTERIA define las 4 líneas de talleres productivos', () => {
  assert.equal(TEMATICAS_REPOSTERIA.length, 4);
  assert.equal(TEMATICAS_REPOSTERIA[0].clave, 'panaderia');
});

test('TallerReposteriaModel.guardarTaller deriva distrito, sanea negativos y resume por distrito', () => {
  store.clear();
  const r1 = TallerReposteriaModel.guardarTaller({
    fecha: '2026-11-24',
    sede: 'Carmen Alto',
    comiteAnfitrion: 'Comité Madres Carmen Alto',
    maestra: 'Sra. Rosa Repostera',
    tematicaClave: 'reposteria_nutritiva',
    participantesMadres: 14,
    porcionesElaboradas: 60,
    destino: 'Consumo Desayuno PDI',
  });

  assert.equal(r1.distrito, 'Comas');
  assert.equal(r1.tematicaTitulo, 'Repostería Nutritiva (Hierro / Sangrecita)');

  const r2 = TallerReposteriaModel.guardarTaller({
    fecha: '2026-11-24',
    sede: 'El Progreso',
    tematicaClave: 'emprendimiento',
    participantesMadres: -3,
    porcionesElaboradas: 30,
  });

  assert.equal(r2.distrito, 'Carabayllo');
  assert.equal(r2.participantesMadres, 0);

  const resumen = TallerReposteriaModel.resumenPorDistrito();
  assert.equal(resumen.comas, 14);
  assert.equal(resumen.carabayllo, 0);
  assert.equal(resumen.totalTalleres, 2);
  assert.equal(resumen.totalMadres, 14);
  assert.equal(resumen.totalPorciones, 90);
});
