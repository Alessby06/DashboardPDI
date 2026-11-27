import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

async function listo(page, ruta) {
  await page.goto(ruta);
  await page.waitForFunction(() => window.PDI?.__pdiDatosListos === true, null, { timeout: 20_000 });
}

test('Social: rango de fechas y orden', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await listo(page, '/social');
  await page.click('#btnDropdownSocialFilterPanel');
  await page.fill('#socialFechaDesde', '2026-01-01');
  await page.fill('#socialFechaHasta', '2026-12-31');
  await page.keyboard.press('Escape');
  await expect(page.locator('#socialActiveChipsList')).toContainText('2026-01-01');
  await page.click('#btnSocialSort');
  await page.click('[data-sort-value="urgencia"]');
  await expect(page.locator('#SocialSortValue')).toHaveText(/Urgencia/);
});

test('Colaboradores: rol e inactivos', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await listo(page, '/colaboradores');
  await page.click('#btnDropdownColabFilterPanel');
  await page.click('#menuColabRol [data-value="Director(a) I.E."]');
  await page.keyboard.press('Escape');
  await expect(page.locator('#tablaColaboradores tbody tr')).toHaveCount(3);
  await page.click('#btnDropdownColabFilterPanel');
  await page.check('#chkColabInactivos');
  await page.keyboard.press('Escape');
  await expect(page.locator('#chkColabInactivos')).toBeChecked();
  await expect(page.locator('#colabActiveChipsList')).toContainText(/inactivos/i);
});

test('Padrón: modalidad y seguro', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await listo(page, '/padron');
  await page.click('#btnDropdownPadronFilterPanel');
  await page.click('#menuPadronModalidad [data-value="I.E."]');
  await page.keyboard.press('Escape');
  await expect(page.locator('#padronActiveChipsList')).toContainText('I.E.');
});

test('Salud: sin tamizaje', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await listo(page, '/salud');
  await page.click('#btnDropdownSaludFilterPanel');
  await page.click('#menuSaludTamizaje [data-value="sin"]');
  await page.keyboard.press('Escape');
  await expect(page.locator('#saludActiveChipsList')).toContainText('Sin tamizaje');
});
