import { test, expect } from '@playwright/test';

test('una ruta inexistente muestra el 404 propio con la ruta pedida', async ({ page }) => {
  const ruta = '/ruta-inexistente-e2e-123';
  await page.goto(ruta);

  await expect(page.locator('h1')).toHaveText('No encontramos esta página');
  await expect(page.locator('[data-ruta]')).toHaveText(ruta);
  await expect(page.locator('.migas')).toContainText('Dashboard');
});
