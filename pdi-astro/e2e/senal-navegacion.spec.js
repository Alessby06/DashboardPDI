// La espera entre el clic y el documento nuevo no tiene señal visual. Medido en
// producción: el router tarda ~750 ms en llegar al intercambio y hasta entonces
// la pantalla no cambia en nada. Esta prueba comprueba que la barra del topbar
// arranca con la navegación, se ve mientras espera y se apaga al terminar.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

const ESCALA = /matrix\(([^,]+)/;

test('el topbar avisa que está navegando mientras el router prepara la página', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/dashboard');
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 20_000 });

  // Se muestrea la barra en cada frame desde antes del clic. Leer el estilo
  // computado una sola vez no sirve: al arrancar, la transición todavía está
  // en 0 y en el intercambio ya está en 1.
  await page.evaluate(() => {
    window.__pdiMarca = 1;
    const el = document.getElementById('pdiNavProgress');
    const inicio = performance.now();
    window.__pdiSenal = [];
    const paso = () => {
      const m = getComputedStyle(el).transform;
      window.__pdiSenal.push({
        estado: el.dataset.estado || '',
        escala: m === 'none' ? 1 : Number(m.match(/matrix\(([^,]+)/)?.[1] ?? 0),
        opacidad: Number(getComputedStyle(el).opacity),
      });
      if (performance.now() - inicio < 4000) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });

  await page.click('a[href="/salud"]');
  await page.waitForURL('**/salud');
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 20_000 });

  const senal = await page.evaluate(() => window.__pdiSenal || []);
  const contexto = await page.evaluate(() => ({
    sobrevivio: window.__pdiMarca === 1,
    hayBarra: !!document.getElementById('pdiNavProgress'),
    muestras: (window.__pdiSenal || []).length,
  }));
  const arranque = senal.filter((s) => s.estado === 'corriendo');
  expect(arranque.length, `la barra no arrancó con la navegación. contexto: ${JSON.stringify(contexto)}`).toBeGreaterThan(0);

  // Visible y a medio camino mientras el router trabaja. El umbral de opacidad
  // no es 1: en desarrollo, con todo precargado, el intercambio llega a los
  // ~110 ms y la barra alcanza a verse sin llegar al final del fundido.
  const vistas = arranque.map((s) => `o=${s.opacidad.toFixed(2)} e=${s.escala.toFixed(2)}`).join(' ');
  expect(
    arranque.some((s) => s.opacidad > 0.5 && s.escala > 0.05 && s.escala < 1),
    `la barra arrancó pero no se vio avanzar. muestras: ${vistas || '(ninguna)'}`,
  ).toBe(true);

  // Al terminar vuelve a cero: una barra que se queda llena miente. Se espera
  // el fundido de salida (340 ms) antes de mirar, porque el muestreo sigue
  // corriendo cuando el intercambio ya ocurrió.
  const leerBarra = () =>
    page.evaluate(() => {
      const el = document.getElementById('pdiNavProgress');
      const m = getComputedStyle(el).transform;
      return { estado: el.dataset.estado || '', escala: m === 'none' ? 1 : Number(m.match(/matrix\(([^,]+)/)?.[1] ?? 0) };
    });
  await expect.poll(async () => (await leerBarra()).escala, { timeout: 5_000 }).toBeLessThan(0.05);
  const final = await leerBarra();
  expect(final.estado, 'la barra quedó en estado de navegación').not.toBe('corriendo');
});
