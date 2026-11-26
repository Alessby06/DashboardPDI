import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararTarjetas, animarTarjetas } from '../src/scripts/utils/FlipTabla.js';

test('prepararTarjetas retorna null si no hay document o contenedor es nulo', () => {
  assert.equal(prepararTarjetas(null), null);
});

test('prepararTarjetas y animarTarjetas manejan listas de tarjetas y filas div', () => {
  const fakeDoc = {};
  globalThis.document = fakeDoc;

  // Simulador mínimo de DOM
  const mockContainer = {
    isConnected: true,
    ownerDocument: fakeDoc,
    scrollTop: 0,
    style: {},
    getBoundingClientRect: () => ({ top: 100, height: 200, width: 800 }),
    querySelectorAll: (sel) => [],
    children: []
  };

  // Sin elementos no debe romper y debe retornar null
  const flipVacio = prepararTarjetas(mockContainer);
  assert.equal(flipVacio, null);
});

test('prepararTarjetas extrae rectángulos y claves de filas con data-id', () => {
  const fakeDoc = {};
  globalThis.document = fakeDoc;

  const item1 = {
    dataset: { id: 'cuenta-1' },
    getClientRects: () => [{ width: 800, height: 50 }],
    getBoundingClientRect: () => ({ top: 100, height: 50, width: 800 }),
    classList: { contains: () => false },
    animate: () => ({ onfinish: null })
  };
  const item2 = {
    dataset: { id: 'cuenta-2' },
    getClientRects: () => [{ width: 800, height: 50 }],
    getBoundingClientRect: () => ({ top: 150, height: 50, width: 800 }),
    classList: { contains: () => false },
    animate: () => ({ onfinish: null })
  };

  const mockContainer = {
    isConnected: true,
    ownerDocument: fakeDoc,
    scrollTop: 0,
    style: {},
    getBoundingClientRect: () => ({ top: 100, height: 100, width: 800 }),
    querySelectorAll: () => [],
    children: [item1, item2]
  };

  // Mock global Element
  globalThis.Element = class {};
  globalThis.Element.prototype.animate = () => {};

  const ctx = prepararTarjetas(mockContainer);
  assert.ok(ctx);
  assert.equal(ctx.rects.size, 2);
  assert.ok(ctx.rects.has('cuenta-1'));
  assert.ok(ctx.rects.has('cuenta-2'));
  assert.equal(ctx.items.length, 2);
  assert.equal(ctx.altoPrevio, 100);
});

test('prepararTarjetas reconoce data-sede-id como clave estable', () => {
  const fakeDoc = {};
  globalThis.document = fakeDoc;

  const sede1 = {
    dataset: { sedeId: 'sede-ano-nuevo' },
    getClientRects: () => [{ width: 280, height: 72 }],
    getBoundingClientRect: () => ({ top: 80, height: 72, width: 280 }),
    classList: { contains: () => false },
    animate: () => ({ onfinish: null })
  };

  const mockContainer = {
    isConnected: true,
    ownerDocument: fakeDoc,
    scrollTop: 0,
    style: {},
    getBoundingClientRect: () => ({ top: 80, height: 72, width: 280 }),
    querySelectorAll: () => [],
    children: [sede1]
  };

  const ctx = prepararTarjetas(mockContainer);
  assert.ok(ctx);
  assert.ok(ctx.rects.has('sede-ano-nuevo'));
});

test('prepararTarjetas reconoce data-caso-id en tarjetas kanban', () => {
  const fakeDoc = {};
  globalThis.document = fakeDoc;

  const caso1 = {
    dataset: { casoId: 'CASO-2026-001' },
    getClientRects: () => [{ width: 260, height: 110 }],
    getBoundingClientRect: () => ({ top: 120, height: 110, width: 260 }),
    classList: { contains: () => false },
    animate: () => ({ onfinish: null })
  };

  const mockCol = {
    isConnected: true,
    ownerDocument: fakeDoc,
    scrollTop: 0,
    style: {},
    getBoundingClientRect: () => ({ top: 120, height: 220, width: 260 }),
    querySelectorAll: () => [],
    children: [caso1]
  };

  const ctx = prepararTarjetas(mockCol);
  assert.ok(ctx);
  assert.ok(ctx.rects.has('CASO-2026-001'));
});
