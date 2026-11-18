import test from 'node:test';
import assert from 'node:assert/strict';

function instalarDomFalso() {
  const clases = new Set();
  const transiciones = [];
  const documentElement = {
    classList: {
      add: (...nuevas) => nuevas.forEach((clase) => clases.add(clase)),
      remove: (...viejas) => viejas.forEach((clase) => clases.delete(clase)),
      contains: (clase) => clases.has(clase),
    },
    setAttribute() {},
    getAttribute: () => 'light',
  };
  const documento = {
    documentElement,
    visibilityState: 'visible',
    cookie: '',
    getElementById: () => null,
    addEventListener() {},
    startViewTransition(actualizar) {
      actualizar();
      let resolver;
      let rechazar;
      const finished = new Promise((res, rej) => { resolver = res; rechazar = rej; });
      const transicion = { finished, skipTransition() {}, resolver, rechazar };
      transiciones.push(transicion);
      return transicion;
    },
  };
  global.window = { matchMedia: () => ({ matches: false, addEventListener() {} }), PDI: {} };
  global.document = documento;
  global.localStorage = { getItem: () => 'light', setItem() {} };
  global.getComputedStyle = () => ({ getPropertyValue: () => '#f5f0e6' });
  return { clases, transiciones };
}

test('una transición abortada no le quita la clase a la transición activa', async () => {
  const { clases, transiciones } = instalarDomFalso();
  const { Theme } = await import('../src/scripts/core/Theme.js');

  Theme.setTheme('dark', false, null, true);   // A
  Theme.setTheme('light', false, null, true);  // B

  assert.equal(Theme._transicion, transiciones[1]);

  // El navegador aborta A; su .finished se rechaza y corre el .finally().
  transiciones[0].rechazar(new Error('abortada'));
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(clases.has('pdi-cambiando-tema'), true);
  assert.equal(clases.has('disable-theme-transitions'), true);

  // B termina: ahora sí se limpia.
  transiciones[1].resolver();
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(clases.has('pdi-cambiando-tema'), false);
  assert.equal(clases.has('disable-theme-transitions'), false);
  assert.equal(Theme._transicion, null);
});
