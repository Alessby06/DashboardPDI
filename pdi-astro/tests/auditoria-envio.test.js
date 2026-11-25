import { test } from 'node:test';
import assert from 'node:assert/strict';

import { crearColaAuditoria } from '../src/scripts/core/auditoriaEnvio.js';

function crearAlmacen({ fallaEscritura = false } = {}) {
  const datos = new Map();
  return {
    getItem: (clave) => (datos.has(clave) ? datos.get(clave) : null),
    setItem: (clave, valor) => {
      if (fallaEscritura) throw new Error('cuota llena');
      datos.set(clave, String(valor));
    },
    removeItem: (clave) => { datos.delete(clave); },
  };
}

const ev = (id) => ({ evento_id: id, action: 'editar', entity: 'persona:pdi_001' });

test('si el envío falla, el evento queda guardado y sobrevive a una recarga', async () => {
  const almacen = crearAlmacen();
  const caido = async () => { throw new Error('sin red'); };
  const cola = crearColaAuditoria({ almacen, enviar: caido, ahora: () => 1000 });

  const resultado = await cola.registrar(ev('evt-1'));

  assert.equal(resultado.ok, false);
  assert.equal(resultado.guardado, true);
  assert.equal(cola.resumen().total, 1);

  // Otra instancia sobre el mismo almacén simula volver a abrir la app.
  const trasRecarga = crearColaAuditoria({ almacen, enviar: caido, ahora: () => 1000 });
  assert.equal(trasRecarga.resumen().total, 1);
});

test('el reintento envía el pendiente y lo borra', async () => {
  const almacen = crearAlmacen();
  let enviados = 0;
  const caido = async () => { throw new Error('sin red'); };
  const bueno = async () => { enviados += 1; };

  const cola = crearColaAuditoria({ almacen, enviar: caido, ahora: () => 1000 });
  await cola.registrar(ev('evt-1'));
  assert.equal(cola.resumen().total, 1);

  const trasRecarga = crearColaAuditoria({ almacen, enviar: bueno, ahora: () => 1000 });
  const resumen = await trasRecarga.reintentar();

  assert.equal(resumen.enviados, 1);
  assert.equal(resumen.total, 0);
  assert.equal(enviados, 1);
  assert.equal(almacen.getItem('pdi_auditoria_pendiente'), null);
});

test('un envío correcto no deja nada en la cola', async () => {
  const almacen = crearAlmacen();
  const bueno = async () => {};
  const cola = crearColaAuditoria({ almacen, enviar: bueno });

  const resultado = await cola.registrar(ev('evt-1'));

  assert.equal(resultado.ok, true);
  assert.equal(cola.resumen().total, 0);
});

test('el mismo evento no se guarda dos veces', async () => {
  const almacen = crearAlmacen();
  const caido = async () => { throw new Error('sin red'); };
  const cola = crearColaAuditoria({ almacen, enviar: caido });

  await cola.registrar(ev('evt-1'));
  const segundo = await cola.registrar(ev('evt-1'));

  assert.equal(segundo.duplicado, true);
  assert.equal(cola.resumen().total, 1);
});

test('un rechazo permanente se aparca y no se vuelve a enviar', async () => {
  const almacen = crearAlmacen();
  let llamadas = 0;
  const permanente = async () => {
    llamadas += 1;
    const error = new Error('400');
    error.permanente = true;
    throw error;
  };
  const cola = crearColaAuditoria({ almacen, enviar: permanente, ahora: () => 1000 });

  await cola.registrar(ev('evt-1'));      // 1.ª llamada, queda en cola
  const primero = await cola.reintentar(); // 2.ª llamada, se aparca
  const segundo = await cola.reintentar(); // no debe llamar

  assert.equal(llamadas, 2);
  assert.equal(primero.agotados, 1);
  assert.equal(segundo.enviados, 0);
  assert.equal(segundo.total, 1, 'el evento agotado no se borra');
});

test('la espera crece: no reintenta antes de tiempo y sí después', async () => {
  const almacen = crearAlmacen();
  let reloj = 1000;
  const caido = async () => { throw new Error('sin red'); };
  const cola = crearColaAuditoria({ almacen, enviar: caido, ahora: () => reloj });

  await cola.registrar(ev('evt-1'));
  await cola.reintentar(); // falla → proximoIntento = 1000 + 30 s

  const inmediato = await cola.reintentar();
  assert.equal(inmediato.enviados, 0, 'todavía no vence la espera');

  reloj = 1000 + 31_000;
  let enviados = 0;
  const bueno = async () => { enviados += 1; };
  const trasEspera = crearColaAuditoria({ almacen, enviar: bueno, ahora: () => reloj });
  const resumen = await trasEspera.reintentar();

  assert.equal(resumen.enviados, 1);
  assert.equal(enviados, 1);
});

test('si el almacenamiento está lleno, lo informa en vez de fingir que guardó', async () => {
  const almacen = crearAlmacen({ fallaEscritura: true });
  const caido = async () => { throw new Error('sin red'); };
  const cola = crearColaAuditoria({ almacen, enviar: caido });

  const resultado = await cola.registrar(ev('evt-1'));

  assert.equal(resultado.ok, false);
  assert.equal(resultado.guardado, false);
  assert.equal(cola.resumen().total, 0);
});

test('confirmar quita solo los identificadores indicados', async () => {
  const almacen = crearAlmacen();
  const caido = async () => { throw new Error('sin red'); };
  const cola = crearColaAuditoria({ almacen, enviar: caido });

  await cola.registrar(ev('evt-1'));
  await cola.registrar(ev('evt-2'));
  cola.confirmar(['evt-1']);

  assert.deepEqual(cola.leer().map((i) => i.payload.evento_id), ['evt-2']);
});
