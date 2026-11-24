import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { EncuentroJacModel, TIPOS_JAC } = await import('../src/scripts/models/EncuentroJacModel.js');

test('TIPOS_JAC define las 4 modalidades formativas de Juntos Aprendemos en Cristo', () => {
  assert.equal(TIPOS_JAC.length, 4);
  assert.equal(TIPOS_JAC[0].clave, 'circulo_formativo');
});

test('EncuentroJacModel.guardarEncuentro deriva distrito, sanea negativos y resume por distrito', () => {
  store.clear();
  const r1 = EncuentroJacModel.guardarEncuentro({
    fecha: '2026-11-24',
    sede: 'Año Nuevo',
    iglesiaAliada: 'Iglesia Bíblica Emanuel — Samuel Valdivia',
    tipoClave: 'discipulado',
    participantesNinos: 15,
    participantesPreadolescentes: 7,
    lideresIglesia: 3,
    facilitadora: 'Carmen Mendoza',
  });

  assert.equal(r1.distrito, 'Comas');
  assert.equal(r1.tipoTitulo, 'Discipulado Infantil / Bíblico');

  const r2 = EncuentroJacModel.guardarEncuentro({
    fecha: '2026-11-24',
    sede: 'Los Bendecidos',
    tipoClave: 'escuela_biblica',
    participantesNinos: -4,
    participantesPreadolescentes: 10,
  });

  assert.equal(r2.distrito, 'Carabayllo');
  assert.equal(r2.participantesNinos, 0);

  const resumen = EncuentroJacModel.resumenPorDistrito();
  assert.equal(resumen.comas, 22);
  assert.equal(resumen.carabayllo, 10);
  assert.equal(resumen.totalEncuentros, 2);
  assert.equal(resumen.totalParticipantes, 32);
});
