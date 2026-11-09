import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test.describe('dashboard — parte firmado', () => {
  test('muestra la franja clínica, los servicios, la matriz y los voluntarios', async ({ page }) => {
    await entrar(page, cuentas().coord);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Panel de Infancia Saludable' }),
    ).toBeVisible();
    await expect(page.locator('.dash-strip-cell')).toHaveCount(3);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Programas del parte' }),
    ).toBeVisible();
    await expect(page.locator('#dashFolioFecha')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
    await expect(page.locator('#dashEstadoTexto')).toContainText('Actualizado');
    await expect(page.locator('.dash-service')).toHaveCount(3);
    await expect(page.locator('.dash-matrix tbody tr')).toHaveCount(7);
    await expect(page.locator('.dash-vol-row')).toHaveCount(6);
    await expect(page.locator('#dashReconcile')).toContainText('Población:');
    await expect(page.locator('#dashTamizados')).toContainText('tamizados');
    const asp = page.locator('.dash-service').nth(2);
    await expect(asp.locator('dt').first()).toContainText('Usuarios con caso ASP activo');
    await expect(asp.locator('#dashAspCasosMicro')).toContainText('caso');
    await expect(page.locator('#dashMatrixNote')).toContainText('usuarios ubicados');
    await expect(page.locator('.dash-priority-item')).toHaveCount(0);
    await expect(page.locator('.dash-timeline-item')).toHaveCount(0);
  });

  test('en 390 px la matriz se pliega y no hay scroll horizontal', async ({ page }) => {
    await entrar(page, cuentas().coord);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.locator('.dash-matrix')).toBeHidden();
    await expect(page.locator('.dash-matrix-mobile-district')).toHaveCount(2);
    await expect(page.locator('.dash-matrix-mobile-row')).toHaveCount(14);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
