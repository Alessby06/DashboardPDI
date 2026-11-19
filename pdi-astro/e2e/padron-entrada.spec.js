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

// La instantánea de la transición no debe llevar el aviso de carga: si el
// documento entrante llega con "Cargando usuarios…", ese texto es lo que se
// anima durante los 220 ms del cambio de página, aunque las filas lleguen justo
// después. El primer frame de /padron tiene que traer ya la tabla pintada.
test('la sección entrante ya trae las filas cuando se intercambia', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/dashboard');
  // Condición real del contrato: los datos ya están en memoria y la vista del
  // padrón está registrada. Antes de eso no hay filas que adelantar y el aviso
  // de carga es lo correcto.
  await page.waitForFunction(
    () => window.PDI?.__pdiDatosListos === true && typeof window.PDI?.BeneficiariosView?.preSwap === 'function',
    null,
    { timeout: 20_000 },
  );
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    window.__m = [];
    window.__fin = false;
    const tick = () => {
      if (location.pathname.replace(/\/+$/, '') === '/padron') {
        window.__m.push({
          ph: document.querySelectorAll('#padronCargando').length,
          filas: document.querySelectorAll('#tbodyBeneficiarios > tr').length,
        });
      }
      if (!window.__fin) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.click('a[href="/padron"]');
  await page.waitForURL((url) => url.pathname === '/padron', { timeout: 20_000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => { window.__fin = true; });

  const muestras = await page.evaluate(() => window.__m);
  expect(muestras.length).toBeGreaterThan(0);
  console.log(`PADRON-PREPAINT muestras=${muestras.length} primera=${JSON.stringify(muestras[0])}`);
  expect(muestras[0].filas, 'el primer frame de /padron llega sin filas').toBeGreaterThan(0);
  expect(
    muestras.filter((s) => s.ph > 0).map((s) => `ph=${s.ph} filas=${s.filas}`),
    'frames con el aviso de carga',
  ).toEqual([]);
});
