import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test('la tipografía es local y no se pide nada a Google', async ({ page }) => {
  const externas = [];
  page.on('request', (peticion) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(peticion.url())) externas.push(peticion.url());
  });

  await page.goto('/login');
  await expect(page).toHaveTitle(/Acceso al Sistema/);

  const cargada = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('16px Manrope');
  });
  expect(cargada).toBe(true);
  expect(externas).toEqual([]);
});

test('el ojo alterna la visibilidad de la contraseña', async ({ page }) => {
  await page.goto('/login');
  const input = page.locator('#inputClave');
  await input.fill('clave-de-prueba');
  await expect(input).toHaveAttribute('type', 'password');

  await page.locator('#btnTogglePass').click();
  await expect(input).toHaveAttribute('type', 'text');

  await page.locator('#btnTogglePass').click();
  await expect(input).toHaveAttribute('type', 'password');
});

test('las credenciales válidas entran al dashboard', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await expect(page).toHaveURL(/\/dashboard/);
});

test('una clave incorrecta muestra el aviso y no navega', async ({ page }) => {
  const { coord } = cuentas();
  await page.goto('/login');
  await page.fill('#inputUsuario', coord.usuario);
  await page.fill('#inputClave', 'incorrecta-123');
  await page.click('#btnLogin');

  await expect(page.locator('#loginError')).toHaveClass(/visible/);
  await expect(page).toHaveURL(/\/login/);
});
