import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TOPE_COLA,
  MAX_INTENTOS,
  BASE_ESPERA_MS,
  ESPERA_MAX_MS,
  normalizarCola,
  encolar,
  listos,
  esperaTrasFallo,
  registrarFallo,
  quitar,
  resumenCola,
} from '../src/scripts/utils/colaAuditoria.js';

const ev = (id) => ({ evento_id: id, action: 'editar', entity: 'persona:pdi_001' });

test('normalizarCola descarta basura y duplicados por evento_id', () => {
  const crudo = [
    null,
    { intentos: 2 },
    { payload: { sin: 'id' } },
    { payload: ev('evt-1'), intentos: 1, proximoIntento: 50 },
    { payload: ev('evt-1'), intentos: 9 },
    { payload: ev('evt-2') },
  ];
  const cola = normalizarCola(crudo);
  assert.deepEqual(cola.map((i) => i.payload.evento_id), ['evt-1', 'evt-2']);
  assert.equal(cola[0].intentos, 1);
  assert.equal(cola[1].intentos, 0);
  assert.equal(cola[1].proximoIntento, 0);
});

test('normalizarCola tolera un valor que no es lista', () => {
  assert.deepEqual(normalizarCola(null), []);
  assert.deepEqual(normalizarCola('[]'), []);
});

test('encolar no repite un evento que ya está en la cola', () => {
  const primera = encolar([], ev('evt-1'));
  assert.equal(primera.cola.length, 1);
  assert.equal(primera.duplicado, false);

  const segunda = encolar(primera.cola, ev('evt-1'));
  assert.equal(segunda.cola.length, 1);
  assert.equal(segunda.duplicado, true);
  assert.equal(segunda.descartado, 0);
});

test('encolar sin evento_id no guarda nada: sin id no hay idempotencia', () => {
  const { cola } = encolar([], { action: 'editar' });
  assert.equal(cola.length, 0);
});

test('al pasar del tope se descarta el más antiguo y se informa', () => {
  let cola = [];
  for (let i = 0; i < TOPE_COLA; i += 1) cola = encolar(cola, ev(`evt-${i}`)).cola;
  assert.equal(cola.length, TOPE_COLA);

  const { cola: llena, descartado } = encolar(cola, ev('evt-nuevo'));
  assert.equal(llena.length, TOPE_COLA);
  assert.equal(descartado, 1);
  assert.equal(llena[0].payload.evento_id, 'evt-1');
  assert.equal(llena.at(-1).payload.evento_id, 'evt-nuevo');
});

test('la espera crece y se queda en el máximo', () => {
  assert.equal(esperaTrasFallo(1), BASE_ESPERA_MS);
  assert.equal(esperaTrasFallo(2), BASE_ESPERA_MS * 2);
  assert.equal(esperaTrasFallo(3), BASE_ESPERA_MS * 4);
  assert.equal(esperaTrasFallo(50), ESPERA_MAX_MS);
});

test('registrarFallo reprograma y aparca al agotar intentos', () => {
  const item = { payload: ev('evt-1'), intentos: 0, proximoIntento: 0 };
  const primero = registrarFallo(item, 1000);
  assert.equal(primero.intentos, 1);
  assert.equal(primero.proximoIntento, 1000 + BASE_ESPERA_MS);
  assert.equal(primero.agotado, false);

  const ultimo = registrarFallo({ ...item, intentos: MAX_INTENTOS - 1 }, 1000);
  assert.equal(ultimo.intentos, MAX_INTENTOS);
  assert.equal(ultimo.agotado, true);
  assert.equal(ultimo.proximoIntento, Number.MAX_SAFE_INTEGER);
});

test('un rechazo permanente se aparca de inmediato', () => {
  const item = { payload: ev('evt-1'), intentos: 0, proximoIntento: 0 };
  const fallo = registrarFallo(item, 1000, true);
  assert.equal(fallo.intentos, MAX_INTENTOS);
  assert.equal(fallo.agotado, true);
  assert.equal(fallo.proximoIntento, Number.MAX_SAFE_INTEGER);
});

test('listos respeta la espera de cada evento', () => {
  const cola = [
    { payload: ev('evt-1'), intentos: 1, proximoIntento: 500 },
    { payload: ev('evt-2'), intentos: 1, proximoIntento: 5000 },
  ];
  assert.deepEqual(listos(cola, 1000).map((i) => i.payload.evento_id), ['evt-1']);
  assert.deepEqual(listos(cola, 6000).map((i) => i.payload.evento_id), ['evt-1', 'evt-2']);
});

test('quitar borra solo el evento confirmado', () => {
  const cola = [ev('evt-1'), ev('evt-2')].map((payload) => ({ payload, intentos: 0, proximoIntento: 0 }));
  assert.deepEqual(quitar(cola, 'evt-1').map((i) => i.payload.evento_id), ['evt-2']);
  assert.equal(quitar(cola, 'no-existe').length, 2);
});

test('resumenCola separa listos y agotados', () => {
  const ahora = 10_000;
  const cola = [
    { payload: ev('evt-1'), intentos: 0, proximoIntento: 0 },
    { payload: ev('evt-2'), intentos: MAX_INTENTOS, proximoIntento: Number.MAX_SAFE_INTEGER },
    { payload: ev('evt-3'), intentos: 2, proximoIntento: 60_000 },
  ];
  assert.deepEqual(resumenCola(cola, ahora), { total: 3, listos: 1, agotados: 1 });
});
