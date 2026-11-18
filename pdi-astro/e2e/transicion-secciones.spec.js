// Al cambiar de sección por el sidebar, la vista entrante debe ser visible
// desde el primer frame. Si la captura saliente sigue opaca mientras la
// entrante está en opacidad 0, se ve la página anterior ya estando en la nueva.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test('la vista entrante no deja un frame con la saliente opaca', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/dashboard');
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const t0 = performance.now();
    window.__cuadros = [];
    const ciclo = (t) => {
      let oldOpacity = null;
      let newOpacity = null;
      try {
        oldOpacity = Number(getComputedStyle(
          document.documentElement, '::view-transition-old(pdi-main-section)',
        ).opacity);
        newOpacity = Number(getComputedStyle(
          document.documentElement, '::view-transition-new(pdi-main-section)',
        ).opacity);
      } catch {}
      window.__cuadros.push({ t: Math.round(t - t0), path: location.pathname, oldOpacity, newOpacity });
      if (t - t0 < 1400) requestAnimationFrame(ciclo);
    };
    requestAnimationFrame(ciclo);
  });

  await page.click('a[href="/padron"]');
  await page.waitForURL((url) => url.pathname === '/padron', { timeout: 20_000 });
  await page.waitForTimeout(900);

  const cuadros = await page.evaluate(() => window.__cuadros);
  const entrantes = cuadros.filter((c) => c.path === '/padron' && c.newOpacity !== null);
  // Control: la sonda tiene que haber visto la transición; si no, el test
  // pasaría porque no midió nada.
  expect(entrantes.length).toBeGreaterThan(0);

  const primero = entrantes[0];
  expect(
    primero.newOpacity,
    `primer frame en /padron: entrante=${primero.newOpacity}, saliente=${primero.oldOpacity} (t=${primero.t}ms)`,
  ).toBeGreaterThan(0.5);

  const opacos = entrantes.filter((c) => c.oldOpacity > 0.95 && c.newOpacity < 0.05);
  expect(
    opacos.map((c) => `t=${c.t}ms`),
    'frames con la vista saliente opaca y la entrante invisible',
  ).toEqual([]);
});
