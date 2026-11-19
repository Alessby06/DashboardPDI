// La precarga por intención tiene que ser barata y apuntar al menú. Medido en
// producción: con `prefetchAll` y un enlazador global, pasar el puntero por la
// tabla descargaba la ficha de cada fila (una URL distinta por fila) y la
// precarga de todas las secciones seguía pidiendo chunks durante la navegación.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test('pasar el puntero por las filas del padrón no descarga las fichas', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/padron');
  await page.waitForFunction(
    () => document.querySelectorAll('#tbodyBeneficiarios .row-action').length > 0,
    null,
    { timeout: 20_000 },
  );

  const fichas = [];
  page.on('request', (r) => {
    if (r.url().includes('/expediente')) fichas.push(new URL(r.url()).pathname + new URL(r.url()).search);
  });

  const acciones = page.locator('#tbodyBeneficiarios .row-action');
  const cuantas = Math.min(await acciones.count(), 5);
  for (let i = 0; i < cuantas; i++) {
    await acciones.nth(i).hover();
    await page.waitForTimeout(250);
  }

  expect(fichas, 'cada fila recorrida con el puntero descarga su ficha').toEqual([]);
});

test('el menú sigue adelantando el módulo de la sección al pasar el puntero', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/dashboard');
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 20_000 });

  const modulos = [];
  page.on('request', (r) => {
    // En producción el chunk es `/_astro/salud*.js`; en desarrollo la entrada
    // de la página es `/src/pages/salud.astro?astro&type=script&…`.
    if (/\/src\/pages\/salud\.astro|\/_astro\/salud[^/]*\.js|\/src\/scripts\/pages\/salud\.js/.test(r.url())) {
      modulos.push(r.url());
    }
  });

  await page.hover('a[href="/salud"]');
  await page.waitForTimeout(1500);

  // Astro prefetchea el HTML; el módulo de la página solo lo adelanta nuestro
  // precargador, así que esta petición es la prueba de que sigue vivo.
  expect(modulos.length, 'el menú dejó de adelantar la sección').toBeGreaterThan(0);
});
