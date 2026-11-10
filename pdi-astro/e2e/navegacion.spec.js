import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

/** Espera a que la capa de datos haya hidratado en esta sesión. */
async function esperarDatos(page) {
  await page.waitForFunction(
    () => window.PDI?.DB?.estadoActual?.() === 'ok',
    null,
    { timeout: 30_000 },
  );
}

/** Espera a que la ruta tenga su módulo precargado. */
async function esperarRuta(page, ruta) {
  await page.waitForFunction(
    (destino) => !!window.PDI?.__pdiRutasListas?.has(destino),
    ruta,
    { timeout: 20_000 },
  );
}

/**
 * Observa el cambio de documento desde `astro:after-swap` y devuelve:
 *  - `cubierto`: la página entrante estaba tapada por el esqueleto (no se vio
 *    su marcado vacío).
 *  - `ms`: cuánto tardó en pintarse el dato pedido, o -1 si no llegó.
 */
function observarSwap(page, selector, patron) {
  return page.evaluate(
    ({ selector, patron }) => new Promise((resolve) => {
      document.addEventListener('astro:after-swap', () => {
        const contenido = document.querySelector('#pdiViewContent');
        const esqueleto = document.querySelector('#pdiSkeleton');
        const estiloContenido = contenido ? getComputedStyle(contenido) : null;
        const estiloEsqueleto = esqueleto ? getComputedStyle(esqueleto) : null;
        const contenidoOculto = !estiloContenido
          || estiloContenido.visibility === 'hidden'
          || Number(estiloContenido.opacity) === 0;
        const esqueletoVisible = !!estiloEsqueleto
          && estiloEsqueleto.display !== 'none'
          && Number(estiloEsqueleto.opacity) > 0;
        const cubierto = contenidoOculto || esqueletoVisible;

        const inicio = performance.now();
        const expresion = new RegExp(patron);
        const revisar = () => {
          const texto = document.querySelector(selector)?.textContent?.trim() || '';
          if (expresion.test(texto)) {
            obs.disconnect();
            clearTimeout(limite);
            resolve({ cubierto, ms: Math.round(performance.now() - inicio) });
          }
        };
        const obs = new MutationObserver(revisar);
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        const limite = setTimeout(() => {
          obs.disconnect();
          resolve({ cubierto, ms: -1 });
        }, 4000);
        revisar();
      }, { once: true });
    }),
    { selector, patron },
  );
}

test.describe('navegación interna — sin estados vacíos', () => {
  test('precarga los módulos de las secciones del menú', async ({ page }) => {
    await entrar(page, cuentas().coord);
    await esperarDatos(page);

    // Las tres rutas de tabla que se quejaban de llegar vacías, más el panel.
    await esperarRuta(page, '/padron');
    await esperarRuta(page, '/salud');
    await esperarRuta(page, '/auditoria');

    const listas = await page.evaluate(() => [...(window.PDI?.__pdiRutasListas || [])]);
    expect(listas).toContain('/padron');
    expect(listas).toContain('/salud');
    expect(listas).toContain('/auditoria');
  });

  test('el encabezado persiste y las cifras aparecen al cambiar de sección', async ({ page }) => {
    await entrar(page, cuentas().coord);
    await esperarDatos(page);
    await esperarRuta(page, '/padron');
    await esperarRuta(page, '/dashboard');

    // Marca sobre el nodo real: si Astro lo recrea, la marca desaparece.
    await page.evaluate(() => {
      window.__topbarMarca = Math.random().toString(36).slice(2);
      document.querySelector('.topbar').__marca = window.__topbarMarca;
    });

    // Padrón: el esqueleto tapa la página hasta que hay filas.
    const padron = observarSwap(page, '#tbodyBeneficiarios tr', '.+');
    await page.waitForTimeout(60);
    await page.click('a[href="/padron"]');
    await page.waitForURL(/\/padron/);
    await expect(page.locator('#tbodyBeneficiarios tr').first()).toBeVisible();
    const padronResultado = await padron;
    expect(padronResultado.cubierto).toBe(true);
    expect(padronResultado.ms).toBeGreaterThanOrEqual(0);
    expect(padronResultado.ms).toBeLessThan(1500);

    const visible = await page.locator('#pdiViewContent').evaluate((el) => {
      const estilo = getComputedStyle(el);
      return estilo.visibility === 'visible' && Number(estilo.opacity) === 1;
    });
    expect(visible).toBe(true);

    const encabezado = await page.evaluate(() => ({
      misma: document.querySelector('.topbar')?.__marca === window.__topbarMarca,
      iniciales: document.querySelector('#topbarAvatarIniciales')?.textContent?.trim() || '',
      nombre: document.querySelector('#topbarUsuarioNombre')?.textContent?.trim() || '',
    }));
    expect(encabezado.misma).toBe(true);
    expect(encabezado.iniciales).not.toBe('?');
    expect(encabezado.nombre).toBe('E2E coord');

    // Dashboard: las cifras no pueden quedarse en "…" esperando la bitácora.
    const cifras = observarSwap(page, '#dashAlimUsuarios', '^\\d+$');
    await page.waitForTimeout(60);
    await page.click('a[href="/dashboard"]');
    await page.waitForURL(/\/dashboard/);
    await expect(page.locator('#dashAlimUsuarios')).toHaveText(/^\d+$/);
    const cifrasResultado = await cifras;
    expect(cifrasResultado.cubierto).toBe(true);
    expect(cifrasResultado.ms).toBeGreaterThanOrEqual(0);
    expect(cifrasResultado.ms).toBeLessThan(1500);
  });

  test('auditoría anuncia la carga en vez de una tabla vacía', async ({ page }) => {
    await entrar(page, cuentas().coord);
    await esperarDatos(page);
    await esperarRuta(page, '/auditoria');

    await page.click('a[href="/auditoria"]');
    await page.waitForURL(/\/auditoria/);

    // Antes de que responda la bitácora no se afirma "sin registros".
    const textoInicial = await page.locator('#tbodyAuditLogs').innerText();
    expect(textoInicial).not.toContain('No se encontraron eventos');

    await expect(page.locator('#tbodyAuditLogs tr').first()).toBeVisible();
    await expect(page.locator('#tbodyAuditLogs')).not.toContainText('Cargando bitácora…', {
      timeout: 20_000,
    });
  });
});
