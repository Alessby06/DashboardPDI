// Un despliegue puede servir HTML nuevo antes que su chunk, y un HTML cacheado
// puede pedir un chunk de la versión anterior. En los dos casos el script de la
// página da 404 y la vista queda muerta. La app recarga una sola vez, con la
// URL marcada para saltarse la copia cacheada.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test('si el script de la página no carga, la app recarga una vez', async ({ page }) => {
  await entrar(page, cuentas().coord);

  let intentos = 0;
  await page.route('**/perfil.astro*', (ruta) => {
    intentos += 1;
    return ruta.fulfill({ status: 404, contentType: 'text/javascript', body: '' });
  });

  await page.goto('/perfil');

  // La recuperación agrega una marca a la URL para pedir un documento fresco.
  await page.waitForURL(/\?v=\d+/, { timeout: 15_000 });
  await page.waitForTimeout(1500);

  expect(intentos, 'no se reintentó el script').toBeGreaterThan(0);
  expect(intentos, 'la recuperación entró en bucle').toBeLessThan(5);
  expect(new URL(page.url()).searchParams.get('v')).toMatch(/^\d+$/);
});
