// El panel de filtros de escritorio debe comportarse como una continuación de
// su botón, no como otra caja flotando: mismo ancho, sin pie con una acción que
// no existe (el filtrado es en vivo) y sin X, porque se cierra con clic fuera,
// Escape o el propio disparador. Y orden y filtros no pueden estar abiertos a
// la vez: se tapan entre ellos.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

const FILTROS = '#dropdownSedesFilterPanel';
const ORDEN = '#dropdownSedesSort';

test('orden y filtros no se abren a la vez', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/sedes');
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 20_000 });

  await page.click('#btnSedesSort');
  await expect(page.locator(ORDEN)).toHaveClass(/open/);

  await page.click('#btnDropdownSedesFilterPanel');
  await expect(page.locator(FILTROS)).toHaveClass(/open/);
  await expect(page.locator(ORDEN), 'el menú de orden siguió abierto').not.toHaveClass(/open/);

  // Y al revés: abrir orden cierra el panel de filtros.
  await page.click('#btnSedesSort');
  await expect(page.locator(ORDEN)).toHaveClass(/open/);
  await expect(page.locator(FILTROS), 'el panel de filtros siguió abierto').not.toHaveClass(/open/);
});

test('el panel no trae pie de acción ni botón de cerrar', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/sedes');
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 20_000 });
  await page.click('#btnDropdownSedesFilterPanel');

  const panel = page.locator(`${FILTROS} .audit-filters-menu`);
  await expect(panel).toBeVisible();
  await expect(panel.locator('.audit-filters-footer')).toHaveCount(0);
  await expect(panel.locator('.btn-close-sheet')).toHaveCount(0);
  await expect(panel.locator('.btn-apply-filters')).toHaveCount(0);
});

test('en escritorio el panel mide lo mismo que su botón', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/sedes');
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 20_000 });
  await page.click('#btnDropdownSedesFilterPanel');

  const medidas = await page.evaluate((sel) => {
    const boton = document.querySelector(`${sel} .audit-filter-btn`);
    const menu = document.querySelector(`${sel} .audit-filters-menu`);
    return {
      boton: Math.round(boton.getBoundingClientRect().width),
      menu: Math.round(menu.getBoundingClientRect().width),
    };
  }, FILTROS);

  expect(medidas.boton).toBeGreaterThan(0);
  expect(Math.abs(medidas.menu - medidas.boton), `panel ${medidas.menu}px vs botón ${medidas.boton}px`).toBeLessThanOrEqual(1);
});

// El ancho se medía al abrir, al redimensionar la ventana y al hacer scroll. Si
// el disparador cambia de ancho por otra razón (la barra se reacomoda, aparece
// el badge, cambia una fuente), el panel se quedaba con la medida vieja.
test('el panel sigue al botón si este cambia de ancho con el panel abierto', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/sedes');
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 20_000 });
  await page.click('#btnDropdownSedesFilterPanel');
  await page.waitForTimeout(300);

  const ancho = () => page.evaluate(() => {
    const b = document.querySelector('#btnDropdownSedesFilterPanel').getBoundingClientRect().width;
    const m = document.querySelector('#dropdownSedesFilterPanel .audit-filters-menu').getBoundingClientRect().width;
    return { boton: Math.round(b), menu: Math.round(m) };
  });

  for (const nuevo of [360, 180]) {
    await page.evaluate((w) => { document.querySelector('#btnDropdownSedesFilterPanel').style.width = `${w}px`; }, nuevo);
    await expect
      .poll(() => ancho(), { timeout: 3_000 })
      .toMatchObject({ menu: expect.any(Number) });
    const m = await ancho();
    expect(Math.abs(m.menu - m.boton), `el panel no siguió: ${JSON.stringify(m)}`).toBeLessThanOrEqual(1);
  }
});
