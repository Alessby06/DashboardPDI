import test from 'node:test';
import assert from 'node:assert/strict';

import { ScrollPane } from '../src/scripts/core/ScrollPane.js';

test('actualiza las dimensiones sin cancelar un desplazamiento activo del pane', () => {
  const llamadas = [];
  const lenis = {
    isScrolling: 'smooth',
    dimensions: { resize: () => llamadas.push('dimensions.resize') },
    resize: () => llamadas.push('resize'),
  };

  ScrollPane.resizeLenis(lenis);

  assert.deepEqual(llamadas, ['dimensions.resize']);
});

test('conserva también un desplazamiento nativo en curso', () => {
  const llamadas = [];
  const lenis = {
    isScrolling: 'native',
    dimensions: { resize: () => llamadas.push('dimensions.resize') },
    resize: () => llamadas.push('resize'),
  };

  ScrollPane.resizeLenis(lenis);

  assert.deepEqual(llamadas, ['dimensions.resize']);
});

test('redimensiona Lenis cuando el pane está quieto', () => {
  const llamadas = [];
  const lenis = {
    isScrolling: false,
    dimensions: { resize: () => llamadas.push('dimensions.resize') },
    resize: () => llamadas.push('resize'),
  };

  ScrollPane.resizeLenis(lenis);

  assert.deepEqual(llamadas, ['resize']);
});
