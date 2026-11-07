import { test, expect } from '@playwright/test';
import { BASE, cuentas } from './env.js';

test('sin sesión no se lee la auditoría ni se emite token', async ({ playwright }) => {
  const ctx = await playwright.request.newContext({ baseURL: BASE });
  expect((await ctx.get('/api/auditoria')).status()).toBe(401);
  expect((await ctx.post('/api/pdi')).status()).toBe(401);
  await ctx.dispose();
});

test('la promotora no puede leer la bitácora', async ({ playwright }) => {
  const { promo } = cuentas();
  const ctx = await playwright.request.newContext({ baseURL: BASE });
  const login = await ctx.post('/api/cuenta/login', {
    data: { usuario: promo.usuario, clave: promo.clave },
  });
  expect(login.ok()).toBeTruthy();
  expect((await ctx.get('/api/auditoria?limit=1')).status()).toBe(403);
  await ctx.dispose();
});

test('coordinación lee la bitácora y recibe un token clínico', async ({ playwright }) => {
  const { coord } = cuentas();
  const ctx = await playwright.request.newContext({ baseURL: BASE });
  const login = await ctx.post('/api/cuenta/login', {
    data: { usuario: coord.usuario, clave: coord.clave },
  });
  expect(login.ok()).toBeTruthy();

  expect((await ctx.get('/api/auditoria?limit=1')).status()).toBe(200);

  const respuesta = await ctx.post('/api/pdi');
  expect(respuesta.ok()).toBeTruthy();
  const datos = await respuesta.json();
  expect(typeof datos.token).toBe('string');
  expect(datos.token.length).toBeGreaterThan(20);
  await ctx.dispose();
});
