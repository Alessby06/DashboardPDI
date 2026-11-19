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

test('la navegacion por cliente tampoco deja frames con la saliente opaca', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/dashboard');
  await page.waitForTimeout(900);

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

  await page.evaluate(() => window.PDI.navigate('/perfil'));
  await page.waitForURL((url) => url.pathname === '/perfil', { timeout: 20_000 });
  await page.waitForTimeout(900);

  const entrantes = (await page.evaluate(() => window.__cuadros))
    .filter((c) => c.path === '/perfil' && c.newOpacity !== null);
  expect(entrantes.length).toBeGreaterThan(0);
  expect(entrantes[0].newOpacity).toBeGreaterThan(0.5);
  expect(entrantes.filter((c) => c.oldOpacity > 0.95 && c.newOpacity < 0.05).length).toBe(0);
});

test('en movil la navegacion sin direccion tampoco deja la saliente opaca', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  await page.waitForTimeout(900);

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

  await page.evaluate(() => window.PDI.navigate('/perfil'));
  await page.waitForURL((url) => url.pathname === '/perfil', { timeout: 20_000 });
  await page.waitForTimeout(900);

  const entrantes = (await page.evaluate(() => window.__cuadros))
    .filter((c) => c.path === '/perfil' && c.newOpacity !== null);
  expect(entrantes.length).toBeGreaterThan(0);
  expect(entrantes[0].newOpacity).toBeGreaterThan(0.5);
  expect(entrantes.filter((c) => c.oldOpacity > 0.95 && c.newOpacity < 0.05).length).toBe(0);
});

test('el highlight del sidebar no se superpone al cambiar de sección', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    window.__Mu = [];
    window.__finM = false;
    const btn = (p) => document.querySelector(`.nav-btn[data-page="${p}"]`);
    const alfa = (b) => {
      if (!b) return 0;
      const nums = getComputedStyle(b).backgroundColor.match(/\d+(?:\.\d+)?/g) || [];
      return nums.length >= 4 ? parseFloat(nums[3]) : 1;
    };
    const tick = () => {
      const d = btn('dashboard');
      window.__Mu.push({
        dAct: d ? d.classList.contains('active') : null,
        dA: alfa(d),
      });
      if (!window.__finM) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.click('a[href="/padron"]');
  await page.waitForURL((url) => url.pathname === '/padron', { timeout: 20_000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => { window.__finM = true; });

  const mu = await page.evaluate(() => window.__Mu);
  const primeraInactiva = mu.find((x) => !x.dAct);
  // Control: la sonda tiene que haber visto Dashboard perder el .active.
  expect(primeraInactiva).toBeTruthy();
  // El highlight debe desaparecer en el mismo fotograma en que Dashboard
  // pierde .active; una cruzado lo mantiene visible mientras entra el de
  // la sección nueva (parpadeo en el sidebar).
  const highlightTrasInactivar = mu.filter((x) => !x.dAct && x.dA > 0.3);
  expect(
    highlightTrasInactivar.map((x) => `t=${x.t}ms`),
    'muestras donde Dashboard se ve sin highlight tras soltar .active',
  ).toEqual([]);
});
