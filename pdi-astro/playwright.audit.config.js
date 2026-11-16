import { defineConfig } from '@playwright/test';

// Auditoría visual: no sustituye a `playwright.config.js` (suite funcional).
// Corre contra el mismo destino que la suite E2E para reutilizar sus cuentas
// temporales y su forma de entrar. Para apuntar a un `astro dev` local:
//   $env:PLAYWRIGHT_BASE_URL='http://localhost:4321'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://mvc-pdi.vercel.app';

export default defineConfig({
  testDir: './e2e',
  testMatch: /auditoria-visual\.spec\.js/,
  timeout: 300_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'auditoria-visual/informe', open: 'never' }]],
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  outputDir: 'test-results/auditoria-visual',
  use: {
    baseURL,
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
