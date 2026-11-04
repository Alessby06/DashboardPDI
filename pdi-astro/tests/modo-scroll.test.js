import test from 'node:test';
import assert from 'node:assert/strict';

import { esScrollNativo, ANCHO_SCROLL_NATIVO } from '../src/scripts/core/scrollMode.js';

test('un teléfono con puntero grueso usa scroll nativo', () => {
  assert.equal(esScrollNativo({ punteroFino: false, ancho: 390, optIn: false }), true);
});

test('una tablet táctil ancha también usa scroll nativo', () => {
  assert.equal(esScrollNativo({ punteroFino: false, ancho: 1180, optIn: false }), true);
});

test('una ventana estrecha de escritorio usa scroll nativo', () => {
  assert.equal(esScrollNativo({ punteroFino: true, ancho: ANCHO_SCROLL_NATIVO, optIn: false }), true);
  assert.equal(esScrollNativo({ punteroFino: true, ancho: ANCHO_SCROLL_NATIVO + 1, optIn: false }), false);
});

test('un escritorio ancho con ratón conserva Lenis', () => {
  assert.equal(esScrollNativo({ punteroFino: true, ancho: 1440, optIn: false }), false);
});

test('el opt-in devuelve Lenis aunque sea móvil', () => {
  assert.equal(esScrollNativo({ punteroFino: false, ancho: 390, optIn: true }), false);
  assert.equal(esScrollNativo({ punteroFino: true, ancho: 800, optIn: true }), false);
});
