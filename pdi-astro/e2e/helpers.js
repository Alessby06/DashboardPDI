/** Inicia sesión con una cuenta temporal y espera el dashboard. */
export async function entrar(page, cuenta) {
  await page.goto('/login');
  await page.fill('#inputUsuario', cuenta.usuario);
  await page.fill('#inputClave', cuenta.clave);
  await page.click('#btnLogin');
  await page.waitForURL(/\/dashboard/, { timeout: 25_000 });
}
