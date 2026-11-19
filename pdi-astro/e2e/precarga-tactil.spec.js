// En el teléfono no hay hover: el toque y la descarga empiezan al mismo tiempo.
// La única señal previa es abrir el cajón del menú, así que ahí se adelantan las
// secciones que ese menú muestra. Esta prueba lo mide con pantalla táctil.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('abrir el menú en el teléfono adelanta las secciones que muestra', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 30_000 });

  expect(
    await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches),
    'la prueba necesita emular puntero táctil',
  ).toBe(true);

  const documentos = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'document' || r.resourceType() === 'fetch') {
      documentos.push(new URL(r.url()).pathname);
    }
  });

  await page.tap('#btnSidebarToggle');
  await page.waitForFunction(
    () => (window.PDI?.__pdiRutasListas?.size || 0) >= 2,
    null,
    { timeout: 15_000 },
  );

  const listas = await page.evaluate(() => [...(window.PDI?.__pdiRutasListas || [])]);
  expect(listas.length, 'el menú táctil no adelantó ninguna sección').toBeGreaterThan(1);
  expect(documentos, 'no se pidió ningún documento al abrir el menú').not.toEqual([]);
});

test('después de abrir el menú, la sección entra sin descargarse en el toque', async ({ page, baseURL }) => {
  // En `astro dev` el servidor manda `no-cache` y no hay caché que aprovechar:
  // esta propiedad solo se puede medir con las cabeceras de producción.
  test.skip(/localhost|127\.0\.0\.1/.test(baseURL || ''), 'requiere las cabeceras de caché de producción');

  await entrar(page, cuentas().coord);
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 30_000 });

  await page.tap('#btnSidebarToggle');
  await page.waitForFunction(
    () => !!window.PDI?.__pdiRutasListas?.has('/padron'),
    null,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(300);

  await page.evaluate(() => { window.__pdiToque = Math.round(performance.now()); });
  await page.tap('a[href="/padron"]');
  await page.waitForURL('**/padron');
  // En móvil el padrón se pinta como tarjetas, no como filas de tabla.
  await page.waitForFunction(
    () => document.querySelectorAll('#mobileCardsBeneficiarios > *, #tbodyBeneficiarios tr').length > 0,
    null,
    { timeout: 20_000 },
  );

  const pedido = await page.evaluate(() => {
    const desde = window.__pdiToque;
    return performance.getEntriesByType('resource')
      .filter((r) => new URL(r.name).pathname === '/padron' && r.startTime >= desde)
      .map((r) => ({ dur: Math.round(r.duration), bytes: r.transferSize }));
  });

  // Si el toque volvió a descargar el documento, bytes > 0 y la duración es la
  // de la red. Servido del caché, llega en pocos milisegundos y sin bytes.
  for (const p of pedido) {
    expect(p.bytes, `el toque volvió a descargar el documento: ${JSON.stringify(pedido)}`).toBe(0);
  }
});
