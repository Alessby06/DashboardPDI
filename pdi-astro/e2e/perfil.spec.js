import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test.describe('perfil con coordinación', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, cuentas().coord);
    await page.goto('/perfil');
    await expect(page.locator('#formPerfil')).toBeVisible();
  });

  test('el teléfono solo admite 9 dígitos', async ({ page }) => {
    const tel = page.locator('#perfilInputTelefono');
    await tel.click();
    await tel.pressSequentially('98a76-543210');
    await expect(tel).toHaveValue('987654321');
  });

  test('teléfono y correo avisan si no cumplen', async ({ page }) => {
    const tel = page.locator('#perfilInputTelefono');
    await tel.fill('887654321');
    await tel.blur();
    await expect(page.locator('#perfilErrorTelefono')).toContainText('9 dígitos');

    await tel.fill('987654321');
    await tel.blur();
    await expect(page.locator('#perfilErrorTelefono')).toBeEmpty();

    const correo = page.locator('#perfilInputCorreo');
    await correo.fill('persona@dominio.net');
    await correo.blur();
    await expect(page.locator('#perfilErrorCorreo')).toContainText('terminación');

    await correo.fill('persona@dominio.org');
    await correo.blur();
    await expect(page.locator('#perfilErrorCorreo')).toBeEmpty();
  });

  test('los botones de seguridad esperan los datos necesarios', async ({ page }) => {
    await expect(page.locator('#btnGuardarUsuario')).toBeDisabled();
    await expect(page.locator('#btnGuardarClave')).toBeDisabled();

    const usuario = page.locator('#perfilInputUsuario');
    const original = await usuario.inputValue();
    await usuario.fill(`${original}-x`);
    await page.locator('#perfilInputUsuarioClave').fill('algo');
    await expect(page.locator('#btnGuardarUsuario')).toBeEnabled();

    await page.locator('#perfilInputClaveActual').fill(cuentas().coord.clave);
    await page.locator('#perfilInputClaveNueva').fill('ClaveE2E-2026-larga');
    await page.locator('#perfilInputClaveRepetir').fill('ClaveE2E-2026-larga');
    await expect(page.locator('#btnGuardarClave')).toBeEnabled();
  });

  test('el ojo del perfil alterna la visibilidad', async ({ page }) => {
    const input = page.locator('#perfilInputUsuarioClave');
    const boton = page.locator('.perfil-clave-toggle').first();
    await input.fill('algo');
    await expect(input).toHaveAttribute('type', 'password');

    await boton.click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(boton).toHaveAttribute('aria-pressed', 'true');

    await boton.click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('coordinación ve la verificación en dos pasos', async ({ page }) => {
    await expect(page.locator('#perfilTotpFila')).toBeVisible();
  });

  test('la guarda de cambios no se queda en otras páginas', async ({ page }) => {
    const nombre = page.locator('#perfilInputNombre');
    const original = await nombre.inputValue();
    await nombre.fill(`${original} X`);

    await page.locator('#sidebarNav a[href="/dashboard"]').click();
    await expect(page.locator('#modalConfirmacion')).toHaveClass(/open/);
    await page.locator('#btnConfirmacionAceptar').click();
    await page.waitForURL(/\/dashboard/);

    await page.locator('#sidebarNav a[href="/padron"]').click();
    await page.waitForURL(/\/padron/);
    await expect(page.locator('#modalConfirmacion')).not.toHaveClass(/open/);
    await expect(page.locator('#modalConfirmacion')).toHaveAttribute('aria-hidden', 'true');
  });
});

test('la promotora no ve la verificación en dos pasos', async ({ page }) => {
  await entrar(page, cuentas().promo);
  await page.goto('/perfil');
  await expect(page.locator('#formPerfil')).toBeVisible();
  await expect(page.locator('#perfilTotpFila')).toBeHidden();
});
