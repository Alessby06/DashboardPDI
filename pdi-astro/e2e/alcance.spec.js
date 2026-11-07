// ===========================================================================
//  ALCANCE POR SEDE
// ===========================================================================
//  Una cuenta con una sede asignada debe ver solo los usuarios de esa sede.
//  Se compara contra lo que ve coordinación, que no tiene sedes y por tanto
//  conserva el padrón completo.
//
//  El filtro es de trabajo, no una barrera: el token clínico es compartido.
//  Lo que se comprueba aquí es que el recorte se aplica de verdad al modelo.
// ===========================================================================
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

const SEDE = 'sede:la_libertad';

async function padronDe(page) {
  return page.evaluate(() => {
    const lista = window.PDI?.BeneficiarioModel?.getAll?.() || [];
    return lista.map((b) => ({ id: b.id, sede: b._sedeRawId || '' }));
  });
}

async function esperarPadron(page) {
  await expect(page.locator('#view-beneficiarios')).toBeVisible();
  await expect.poll(async () => (await padronDe(page)).length).toBeGreaterThan(0);
}

test('una cuenta con una sede solo ve el padrón de esa sede', async ({ page, browser }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/padron');
  await esperarPadron(page);

  const completo = await padronDe(page);
  const esperado = completo.filter((b) => b.sede === SEDE);
  expect(esperado.length).toBeGreaterThan(0);
  expect(completo.length).toBeGreaterThan(esperado.length);

  // La cuenta se crea por la API con la misma sesión de administración.
  const usuario = `e2e-scope-${Date.now()}`;
  const admin = cuentas().admin;
  const contextoAdmin = await browser.newContext();
  const peticion = contextoAdmin.request;
  expect((await peticion.post('/api/cuenta/login', {
    data: { usuario: admin.usuario, clave: admin.clave },
  })).ok()).toBeTruthy();
  const alta = await peticion.post('/api/cuenta/admin', {
    data: { accion: 'crear', nombre: 'Alcance E2E', usuario, rol: 'promotora', sedes: [SEDE] },
  });
  expect(alta.status()).toBe(201);
  const clave = (await alta.json()).claveTemporal;
  await contextoAdmin.close();

  const contexto = await browser.newContext();
  const pag = await contexto.newPage();
  await pag.goto('/login');
  await pag.fill('#inputUsuario', usuario);
  await pag.fill('#inputClave', clave);
  await pag.click('#btnLogin');
  // La clave es temporal: el primer destino es el perfil.
  await expect(pag).toHaveURL(/\/perfil/, { timeout: 25_000 });

  await pag.goto('/padron');
  await esperarPadron(pag);
  const filtrado = await padronDe(pag);

  expect(filtrado.length).toBe(esperado.length);
  expect(filtrado.map((b) => b.id).sort()).toEqual(esperado.map((b) => b.id).sort());
  expect(filtrado.every((b) => b.sede === SEDE)).toBe(true);

  await contexto.close();
});
