// El movimiento de estado tiene que ocurrir de verdad: no basta con que la
// transición esté declarada. Se muestrea la opacidad mientras se abre el modo
// edición y se comprueba que el diálogo sigue pintado mientras se cierra.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test('el modo edición entra con transición, no de golpe', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/perfil');
  await page.waitForFunction(() => window.PDI?.DB?.estadoActual?.() === 'ok', null, { timeout: 30_000 });
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    window.__m = [];
    const form = document.getElementById('formPerfil');
    const t0 = performance.now();
    const paso = () => {
      window.__m.push({ t: Math.round(performance.now() - t0), o: Number(getComputedStyle(form).opacity) });
      if (performance.now() - t0 < 500) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });

  await page.click('[data-editar="formPerfil"]');
  await page.waitForTimeout(600);

  const muestras = await page.evaluate(() => window.__m.filter((m) => m.t > 0));
  const intermedias = muestras.filter((m) => m.o > 0.02 && m.o < 0.98);
  expect(muestras.length, 'no se muestreó nada').toBeGreaterThan(3);
  expect(intermedias.length, `no hubo transición: ${JSON.stringify(muestras.slice(0, 4))}`).toBeGreaterThan(0);
});

test('el diálogo sigue pintado mientras se cierra', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/perfil');
  await page.waitForFunction(() => window.PDI?.DB?.estadoActual?.() === 'ok', null, { timeout: 30_000 });

  const dialogo = page.locator('#perfilFotoDialog');
  await page.evaluate(() => document.getElementById('perfilFotoDialog').showModal());
  await page.waitForTimeout(80);
  expect(await dialogo.evaluate((d) => getComputedStyle(d).display)).not.toBe('none');

  await page.evaluate(() => document.getElementById('perfilFotoDialog').close());
  const durante = await dialogo.evaluate((d) => ({ abierto: d.open, display: getComputedStyle(d).display }));
  expect(durante.abierto).toBe(false);
  expect(durante.display, 'el diálogo desapareció de golpe').not.toBe('none');

  await page.waitForTimeout(320);
  expect(await dialogo.evaluate((d) => getComputedStyle(d).display)).toBe('none');
});
