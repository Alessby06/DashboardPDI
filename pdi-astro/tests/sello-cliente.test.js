import { test } from 'node:test';
import assert from 'node:assert/strict';

import { crearSelloAuditoria, CLAVE_SELLO } from '../src/scripts/core/selloAuditoria.js';

function almacen(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem: (clave) => (datos.has(clave) ? datos.get(clave) : null),
    setItem: (clave, valor) => { datos.set(clave, String(valor)); },
    removeItem: (clave) => { datos.delete(clave); },
    _datos: datos,
  };
}

function respuesta(datos, ok = true) {
  return { ok, json: async () => datos };
}

test('pide un sello y lo guarda', async () => {
  const guardado = almacen();
  let llamadas = 0;
  const fetchImpl = async () => { llamadas += 1; return respuesta({ sello: 's-1', exp: 2000 }); };
  const sello = crearSelloAuditoria({ almacen: guardado, fetchImpl, ahora: () => 1000, margenMs: 100 });

  assert.equal(await sello.obtener(), 's-1');
  assert.equal(llamadas, 1);
  assert.deepEqual(JSON.parse(guardado.getItem(CLAVE_SELLO)), { sello: 's-1', exp: 2000 });
});

test('reutiliza el sello vigente sin volver a pedirlo', async () => {
  const guardado = almacen({ [CLAVE_SELLO]: JSON.stringify({ sello: 's-1', exp: 2000 }) });
  let llamadas = 0;
  const fetchImpl = async () => { llamadas += 1; return respuesta({ sello: 's-2', exp: 3000 }); };
  const sello = crearSelloAuditoria({ almacen: guardado, fetchImpl, ahora: () => 1000, margenMs: 100 });

  assert.equal(await sello.obtener(), 's-1');
  assert.equal(llamadas, 0);
});

test('renueva cuando está por vencer', async () => {
  const guardado = almacen({ [CLAVE_SELLO]: JSON.stringify({ sello: 's-1', exp: 2000 }) });
  const fetchImpl = async () => respuesta({ sello: 's-2', exp: 4000 });
  // 1950 está dentro del margen de 100: hay que renovar.
  const sello = crearSelloAuditoria({ almacen: guardado, fetchImpl, ahora: () => 1950, margenMs: 100 });

  assert.equal(await sello.obtener(), 's-2');
});

test('si la red falla pero el sello aún vive, lo usa', async () => {
  const guardado = almacen({ [CLAVE_SELLO]: JSON.stringify({ sello: 's-1', exp: 2000 }) });
  const fetchImpl = async () => { throw new Error('sin red'); };
  const sello = crearSelloAuditoria({ almacen: guardado, fetchImpl, ahora: () => 1950, margenMs: 100 });

  assert.equal(await sello.obtener(), 's-1');
});

test('si el sello venció y no hay red, devuelve null', async () => {
  const guardado = almacen({ [CLAVE_SELLO]: JSON.stringify({ sello: 's-1', exp: 2000 }) });
  const fetchImpl = async () => { throw new Error('sin red'); };
  const sello = crearSelloAuditoria({ almacen: guardado, fetchImpl, ahora: () => 2001, margenMs: 100 });

  assert.equal(await sello.obtener(), null);
});

test('una respuesta sin sello no rompe: cae al guardado vigente', async () => {
  const guardado = almacen({ [CLAVE_SELLO]: JSON.stringify({ sello: 's-1', exp: 2000 }) });
  const fetchImpl = async () => respuesta({ ok: false });
  const sello = crearSelloAuditoria({ almacen: guardado, fetchImpl, ahora: () => 1950, margenMs: 100 });

  assert.equal(await sello.obtener(), 's-1');
});

test('forzar ignora la caché vigente', async () => {
  const guardado = almacen({ [CLAVE_SELLO]: JSON.stringify({ sello: 's-1', exp: 9000 }) });
  let llamadas = 0;
  const fetchImpl = async () => { llamadas += 1; return respuesta({ sello: 's-2', exp: 9999 }); };
  const sello = crearSelloAuditoria({ almacen: guardado, fetchImpl, ahora: () => 1000, margenMs: 100 });

  assert.equal(await sello.obtener({ forzar: true }), 's-2');
  assert.equal(llamadas, 1);
});

test('una caché corrupta se ignora', async () => {
  const guardado = almacen({ [CLAVE_SELLO]: 'esto no es json' });
  const fetchImpl = async () => respuesta({ sello: 's-2', exp: 5000 });
  const sello = crearSelloAuditoria({ almacen: guardado, fetchImpl, ahora: () => 1000 });

  assert.equal(await sello.obtener(), 's-2');
});
