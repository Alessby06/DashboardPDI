// Al entrar a una sección, las filas de la tabla no deben entrar en cascada:
// con 20 filas por página el escalonado (22 ms por fila, tope 10) más la
// duración de la entrada deja la tabla apareciendo durante ~380 ms. En una
// tabla eso se lee como inestabilidad, no como coreografía. La entrada sí se
// conserva para listas cortas y para las actualizaciones dentro de la página.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test('las filas del padrón no entran escalonadas al cambiar de sección', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/dashboard');
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    window.__filas = [];
    window.__finFilas = false;
    const tick = () => {
      const filas = document.querySelectorAll('#tbodyBeneficiarios > tr');
      if (filas.length) {
        const primera = filas[0];
        const ultima = filas[filas.length - 1];
        window.__filas.push({
          n: filas.length,
          conClase: document.querySelectorAll('#tbodyBeneficiarios > tr.ixd-entrada').length,
          anim: getComputedStyle(primera).animationName,
          retrasoPrimera: getComputedStyle(primera).animationDelay,
          retrasoUltima: getComputedStyle(ultima).animationDelay,
        });
      }
      if (!window.__finFilas) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.click('a[href="/padron"]');
  await page.waitForURL((url) => url.pathname === '/padron', { timeout: 20_000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => { window.__finFilas = true; });

  const muestras = await page.evaluate(() => window.__filas);
  // Control: la sonda tiene que haber visto las filas pintadas.
  expect(muestras.length).toBeGreaterThan(0);
  const formas = [...new Set(muestras.map((m) => `${m.n}|${m.conClase}|${m.anim}`))];
  console.log(`PADRON-ENTRADA muestras=${muestras.length} formas=${formas.join(' ')}`);

  const escalonadas = muestras.filter((m) => m.conClase > 0 || m.anim !== 'none');
  expect(
    escalonadas.map((m) => `filas=${m.n} conClase=${m.conClase} anim=${m.anim} d0=${m.retrasoPrimera} dN=${m.retrasoUltima}`),
    'muestras con filas entrando en cascada',
  ).toEqual([]);
});
