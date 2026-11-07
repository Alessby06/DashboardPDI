import { defineConfig } from '@playwright/test';

// La suite corre contra el despliegue real: las Functions de Vercel sí
// conservan el cuerpo de los POST. `astro dev` no lo hace (el middleware
// recibe el request ya consumido), así que no se usa como servidor local.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://mvc-pdi.vercel.app';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  use: {
    baseURL,
    channel: 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
