import test from 'node:test';
import assert from 'node:assert/strict';

import { ScrollManager, DESACTIVAR_LENIS } from '../src/scripts/core/ScrollManager.js';
import { ScrollPane, DESACTIVAR_LENIS as DESACTIVAR_PANE } from '../src/scripts/core/ScrollPane.js';

test('Lenis está completamente desactivado en la configuración del sistema', () => {
  assert.equal(DESACTIVAR_LENIS, true);
  assert.equal(DESACTIVAR_PANE, true);
});

test('ScrollManager entra en modo nativo sin habilitar Lenis', () => {
  ScrollManager._evaluarModo();
  assert.equal(ScrollManager.enabled, false);
  assert.equal(ScrollManager.native, true);
  assert.equal(ScrollManager.touch, false);
  assert.equal(ScrollManager.main, null);
});

test('ScrollPane.attach no instancia Lenis cuando está desactivado', () => {
  const fakeElement = {
    scrollHeight: 500,
    clientHeight: 200,
    classList: { add() {}, remove() {}, contains: () => false },
    querySelector: () => null,
  };
  const resultado = ScrollPane.attach(fakeElement);
  assert.equal(resultado, null);
  assert.equal(ScrollPane.panes.size, 0);
});

test('ScrollManager métodos de ciclo de vida son seguros sin instancias de Lenis', () => {
  assert.doesNotThrow(() => {
    ScrollManager.init();
    ScrollManager.rebind();
    ScrollManager.refresh();
    ScrollManager.stop();
    ScrollManager.start();
    ScrollManager.reset();
  });
});
