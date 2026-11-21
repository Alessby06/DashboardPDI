// El dashboard entra una vez completo y después corto, y todas las tarjetas
// responden al puntero en los dos temas. Antes solo lo hacían los servicios y
// en claro no se notaba: el borde pasaba de 1,33 a 2,52:1.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test('la llegada es completa la primera vez y corta después', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.waitForFunction(() => window.PDI?.DB?.estadoActual?.() === 'ok', null, { timeout: 30_000 });

  const primera = await page.evaluate(() => document.documentElement.getAttribute('data-dash-entrada'));
  expect(primera).toBe('completa');

  const animaciones = await page.evaluate(() =>
    document.querySelector('.dash-hero').getAnimations().map((a) => a.animationName),
  );
  expect(animaciones).toContain('dash-entra');

  await page.click('a[href="/padron"]');
  await page.waitForURL('**/padron');
  await page.click('a[href="/dashboard"]');
  await page.waitForURL('**/dashboard');
  await page.waitForTimeout(150);

  expect(await page.evaluate(() => document.documentElement.getAttribute('data-dash-entrada'))).toBe('corta');
  const corta = await page.evaluate(() =>
    document.querySelector('.dash-hero').getAnimations().map((a) => a.animationName),
  );
  expect(corta).toContain('dash-entra-corta');
});

test('todas las tarjetas responden al puntero, en claro y en oscuro', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/dashboard');
  await page.waitForFunction(() => window.PDI?.DB?.estadoActual?.() === 'ok', null, { timeout: 30_000 });
  await page.waitForTimeout(400);

  for (const tema of ['light', 'dark']) {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), tema);
    for (const selector of ['.dash-hero', '.dash-panel', '.dash-servicio']) {
      const tarjeta = page.locator(selector).first();
      const leer = () =>
        tarjeta.evaluate((el) => {
          const cs = getComputedStyle(el);
          return `${cs.borderTopColor}|${cs.backgroundColor}`;
        });
      const antes = await leer();
      await tarjeta.hover();
      await page.waitForTimeout(260);
      const despues = await leer();
      expect(despues, `${selector} no respondió en ${tema}`).not.toBe(antes);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(220);
    }
  }
});
