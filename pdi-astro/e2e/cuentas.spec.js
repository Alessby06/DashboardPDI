// ===========================================================================
//  GESTIÓN DE CUENTAS
// ===========================================================================
//  Recorrido completo del piloto: administración crea una cuenta, entrega la
//  contraseña temporal, la persona entra obligada a cambiarla, y la baja corta
//  el acceso. Las cuentas creadas llevan prefijo `e2e-` para que el teardown
//  las elimine aunque la prueba falle a mitad.
// ===========================================================================
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

const SEDE = 'sede:carmen_alto';

async function abrirCuentas(page) {
  await entrar(page, cuentas().admin);
  await page.goto('/cuentas');
  await expect(page.locator('#cuentasLista .cuenta-fila').first()).toBeVisible({ timeout: 20_000 });
}

async function crearCuenta(page, { nombre, usuario, rol = 'promotora' }) {
  await page.locator('#btnNuevaCuenta').click();
  await expect(page.locator('#cuentasModal')).toHaveClass(/open/);

  await page.fill('#ctaNombre', nombre);
  await page.fill('#ctaUsuario', usuario);
  // El <select> real queda recortado por el componente de selección propio;
  // `force` evita la comprobación de visibilidad sin saltarse el cambio.
  await page.selectOption('#ctaRol', rol, { force: true });
  await page.check(`#ctaSedes input[value="${SEDE}"]`);
  await page.locator('#btnCrearCuenta').click();

  await expect(page.locator('#cuentasClaveModal')).toHaveClass(/open/, { timeout: 20_000 });
  const clave = (await page.locator('#claveModalValor').textContent())?.trim() || '';
  await page.locator('#btnCopiarClave').click();
  await expect(page.locator('#claveCopiaEstado')).toContainText(/Copiada/);
  await page.locator('#cuentasClaveModal [data-cerrar]').first().click();
  await expect(page.locator('#cuentasClaveModal')).not.toHaveClass(/open/);
  return clave;
}

async function entrarComo(browser, usuario, clave) {
  const contexto = await browser.newContext();
  const pagina = await contexto.newPage();
  await pagina.goto('/login');
  await pagina.fill('#inputUsuario', usuario);
  await pagina.fill('#inputClave', clave);
  await pagina.click('#btnLogin');
  return { contexto, pagina };
}

test.describe('gestión de cuentas', () => {
  test('administración crea una cuenta y la persona debe cambiar la clave', async ({ page, browser }) => {
    const usuario = `e2e-alta-${Date.now()}`;
    await abrirCuentas(page);

    const clave = await crearCuenta(page, {
      nombre: 'Alta E2E',
      usuario,
      rol: 'promotora',
    });
    expect(clave.length).toBe(16);

    const fila = page.locator(`#cuentasLista .cuenta-fila:has-text("${usuario}")`);
    await expect(fila).toBeVisible();
    await expect(fila).toContainText('Promotora');
    await expect(fila).toContainText('Carmen Alto');
    await expect(fila).toContainText('Activa');

    // Primer ingreso: la contraseña temporal obliga a pasar por el perfil.
    const { contexto, pagina } = await entrarComo(browser, usuario, clave);
    await expect(pagina).toHaveURL(/\/perfil/, { timeout: 25_000 });
    await contexto.close();
  });

  test('el reinicio de clave y la baja cortan el acceso', async ({ page, browser }) => {
    const usuario = `e2e-baja-${Date.now()}`;
    await abrirCuentas(page);

    const claveInicial = await crearCuenta(page, {
      nombre: 'Baja E2E',
      usuario,
      rol: 'facilitadora',
    });

    const fila = page.locator(`#cuentasLista .cuenta-fila:has-text("${usuario}")`);
    await expect(fila).toBeVisible();

    // Reinicio de contraseña desde el menú contextual y resguardo al cerrar sin copiar.
    await fila.locator('[data-accion="menu-fila"]').click();
    await page.locator('#cuentaMenuFlotante [data-menu-accion="clave"]').click();
    await page.locator('#btnConfirmacionAceptar').click();
    await expect(page.locator('#cuentasClaveModal')).toHaveClass(/open/, { timeout: 20_000 });
    const claveNueva = (await page.locator('#claveModalValor').textContent())?.trim() || '';
    expect(claveNueva.length).toBe(16);
    expect(claveNueva).not.toBe(claveInicial);
    await page.locator('#cuentasClaveModal [data-cerrar]').first().click();
    await expect(page.locator('#modalConfirmacion')).toHaveClass(/open/);
    await page.locator('#btnConfirmacionAceptar').click();
    await expect(page.locator('#cuentasClaveModal')).not.toHaveClass(/open/);

    // La clave anterior ya no sirve.
    const primero = await entrarComo(browser, usuario, claveInicial);
    await expect(primero.pagina.locator('#loginError')).toBeVisible({ timeout: 20_000 });
    await primero.contexto.close();

    // Baja desde el menú contextual de la fila.
    await fila.locator('[data-accion="menu-fila"]').click();
    await page.locator('#cuentaMenuFlotante [data-menu-accion="estado"]').click();
    await page.locator('#btnConfirmacionAceptar').click();
    await expect(fila).toContainText('Desactivada', { timeout: 20_000 });

    // La persona desactivada no entra ni con la clave vigente.
    const segundo = await entrarComo(browser, usuario, claveNueva);
    await expect(segundo.pagina.locator('#loginError')).toBeVisible({ timeout: 20_000 });
    await expect(segundo.pagina).toHaveURL(/\/login/);
    await segundo.contexto.close();
  });
});

test('una cuenta operativa no puede abrir la gestión de cuentas', async ({ page }) => {
  await entrar(page, cuentas().promo);
  await page.goto('/cuentas');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.locator('#cuentasLista')).toHaveCount(0);
});
