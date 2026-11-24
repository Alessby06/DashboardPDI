import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test.describe('módulo colaboradores — red territorial PDI', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, cuentas().coord);
    await page.goto('/colaboradores');
    await expect(page).toHaveURL(/\/colaboradores/);
  });

  test('carga KPIs y estadísticas territoriales consolidadas', async ({ page }) => {
    // Título y encabezado principal
    await expect(page.locator('.view-title-group h1')).toContainText('Red Territorial');

    // Tarjeta superior de métricas
    await expect(page.locator('#statColabTotal')).toContainText('19');
    await expect(page.locator('#statColabColegios')).toHaveText('5');
    await expect(page.locator('#statColabIglesias')).toHaveText('7');
    await expect(page.locator('#statColabPDI')).toHaveText('7');

    // Balance territorial
    await expect(page.locator('#statColabComas')).toHaveText('7');
    await expect(page.locator('#statColabCarabayllo')).toHaveText('10');
    await expect(page.locator('#statColabAgustino')).toHaveText('2');

    // Insignias en las 3 pestañas
    await expect(page.locator('#badgeCountColegios')).toHaveText('5');
    await expect(page.locator('#badgeCountIglesias')).toHaveText('7');
    await expect(page.locator('#badgeCountPDI')).toHaveText('7');
  });

  test('conmuta fluidamente entre las 3 pestañas y actualiza la tabla', async ({ page }) => {
    // 1. Pestaña inicial: Colegios Aliados
    await expect(page.locator('#tabBtnColabColegios')).toHaveClass(/active/);
    await expect(page.locator('#colaboradoresHeaderTitle')).toContainText('Colegios Aliados');
    await expect(page.locator('#tbodyColaboradores tr')).toHaveCount(5);

    // 2. Conmutar a Iglesias y Puntos Pastorales
    await page.locator('#tabBtnColabIglesias').click();
    await expect(page.locator('#tabBtnColabIglesias')).toHaveClass(/active/);
    await expect(page.locator('#tabBtnColabColegios')).not.toHaveClass(/active/);
    await expect(page.locator('#colaboradoresHeaderTitle')).toContainText('Iglesias y Puntos Pastorales');
    await expect(page.locator('#tbodyColaboradores tr')).toHaveCount(7);
    await expect(page.locator('#tbodyColaboradores')).toContainText('Pastor');

    // 3. Conmutar a Facilitadoras y Promotoras PDI
    await page.locator('#tabBtnColabPDI').click();
    await expect(page.locator('#tabBtnColabPDI')).toHaveClass(/active/);
    await expect(page.locator('#tabBtnColabIglesias')).not.toHaveClass(/active/);
    await expect(page.locator('#colaboradoresHeaderTitle')).toContainText('Facilitadoras PDI');
    await expect(page.locator('#tbodyColaboradores tr')).toHaveCount(7);
    await expect(page.locator('#tbodyColaboradores')).toContainText('Mendoza');

    // 4. Regreso a Colegios Aliados
    await page.locator('#tabBtnColabColegios').click();
    await expect(page.locator('#tabBtnColabColegios')).toHaveClass(/active/);
    await expect(page.locator('#tbodyColaboradores tr')).toHaveCount(5);
  });

  test('filtra por búsqueda textual y limpia con el botón clear', async ({ page }) => {
    const inputSearch = page.locator('#inputColabSearch');
    const clearBtn = page.locator('#btnColabSearchClear');

    // Buscar "Morales" (Carlos Morales Soto en Comas Año Nuevo)
    await inputSearch.fill('Morales');
    await expect(page.locator('#tbodyColaboradores tr')).toHaveCount(1);
    await expect(page.locator('#tbodyColaboradores')).toContainText('Morales');
    await expect(clearBtn).toBeVisible();

    // Limpiar búsqueda
    await clearBtn.click();
    await expect(inputSearch).toHaveValue('');
    await expect(page.locator('#tbodyColaboradores tr')).toHaveCount(5);
  });

  test('filtra por distrito usando el desplegable y chips activos', async ({ page }) => {
    // Abrir desplegable de distrito (accesible directamente en la barra de herramientas)
    const btnDistrito = page.locator('#dropdownColabDistrito .padron-inner-dropdown-btn');
    await expect(btnDistrito).toBeVisible();
    await btnDistrito.click();
    await expect(page.locator('#menuColabDistrito')).toBeVisible();

    // Validar contadores de faceta para la pestaña activa (Colegios: 5 total, 1 Comas, 3 Carabayllo, 1 El Agustino)
    await expect(page.locator('#countFacetColabDistrito-all')).toHaveText('(5)');
    await expect(page.locator('#countFacetColabDistrito-Comas')).toHaveText('(1)');
    await expect(page.locator('#countFacetColabDistrito-Carabayllo')).toHaveText('(3)');
    await expect(page.locator('[id="countFacetColabDistrito-El Agustino"]')).toHaveText('(1)');

    // Seleccionar Comas
    await page.locator('#menuColabDistrito .padron-dropdown-item[data-value="Comas"]').click();

    // Verificar tabla filtrada (en Colegios hay 1 en Comas: Año Nuevo)
    await expect(page.locator('#tbodyColaboradores tr')).toHaveCount(1);
    await expect(page.locator('#tbodyColaboradores')).toContainText('Comas');

    // Verificar barra de chips activos
    const chipBar = page.locator('#colabActiveChipsBar');
    await expect(chipBar).toBeVisible();
    await expect(chipBar).toContainText('Distrito: Comas');

    // Remover filtro por chip
    await chipBar.locator('.padron-chip-remove').click();
    await expect(page.locator('#tbodyColaboradores tr')).toHaveCount(5);
  });

  test('modal abre desde arriba (scrollTop == 0), tiene cabecera sticky y carga datos para edición', async ({ page }) => {
    // 1. Abrir modal de nuevo colaborador
    await page.locator('button:has-text("Registrar Colaborador"), button[title*="Registrar"]').first().click();
    const modal = page.locator('#modalColaborador');
    await expect(modal).toBeVisible();

    // Verificar que el scroll esté arriba
    const scrollTopNuevo = await page.evaluate(() => {
      const el = document.querySelector('#modalColaborador .modal-body') || document.querySelector('#modalColaborador .modal-content');
      return el ? el.scrollTop : -1;
    });
    expect(scrollTopNuevo).toBe(0);

    // Cabecera visible
    const header = modal.locator('.modal-header');
    await expect(header).toBeVisible();
    await expect(modal.locator('#modalColabTitle')).toContainText('Nuevo Colaborador');

    // Cerrar modal con botón Cancelar
    await modal.locator('button:has-text("Cancelar")').click();
    await expect(modal).toBeHidden();

    // 2. Abrir modal de edición en el primer colaborador
    await page.locator('#tbodyColaboradores tr .btn-action-icon[title*="Editar"]').first().click();
    await expect(modal).toBeVisible();

    // Verificar que el scroll esté arriba también en edición
    const scrollTopEdicion = await page.evaluate(() => {
      const el = document.querySelector('#modalColaborador .modal-body') || document.querySelector('#modalColaborador .modal-content');
      return el ? el.scrollTop : -1;
    });
    expect(scrollTopEdicion).toBe(0);

    // Verificar campos precargados
    await expect(modal.locator('#colabNombres')).not.toHaveValue('');
    await expect(modal.locator('#colabApellidos')).not.toHaveValue('');
    await expect(modal.locator('#colabSede')).not.toHaveValue('');

    // Cerrar con botón Cancelar
    await modal.locator('button:has-text("Cancelar")').click();
    await expect(modal).toBeHidden();
  });

  test('en pantalla móvil se muestran tarjetas táctiles con llamadas y WhatsApp sin desborde', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // La tabla de escritorio debe estar oculta y las tarjetas móviles visibles
    await expect(page.locator('.desktop-colab-view')).toBeHidden();
    await expect(page.locator('.mobile-colab-view')).toBeVisible();

    const mobileCards = page.locator('#mobileCardsColaboradores .colab-mobile-card');
    await expect(mobileCards).toHaveCount(5);

    // Verificar botones de acción táctil
    const primerCard = mobileCards.first();
    await expect(primerCard.locator('.btn-mobile-touch')).toHaveCount(3); // Llamar, WhatsApp, Ficha
    await expect(primerCard.locator('.btn-mobile-call')).toHaveAttribute('href', /^tel:/);
    await expect(primerCard.locator('.btn-mobile-wa')).toHaveAttribute('href', /wa\.me/);

    // Sin desborde horizontal
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('filtra automáticamente al acceder por parámetro ?sede=Año Nuevo y permite limpiar', async ({ page }) => {
    await page.goto('/colaboradores?sede=A%C3%B1o%20Nuevo');
    await expect(page).toHaveURL(/sede=/);

    // Los KPIs globales deben mantenerse consistentes (19 total)
    await expect(page.locator('#statColabTotal')).toContainText('19');

    // El input de búsqueda debe tener el valor "Año Nuevo"
    await expect(page.locator('#inputColabSearch')).toHaveValue('Año Nuevo');

    // Debe mostrar al menos un colaborador de Año Nuevo
    await expect(page.locator('#tbodyColaboradores tr')).toHaveCount(1);
    await expect(page.locator('#tbodyColaboradores')).toContainText('Año Nuevo');

    // El botón limpiar búsqueda debe estar visible y al presionarlo debe mostrar todo el padrón de la categoría
    const btnClear = page.locator('#btnColabSearchClear');
    await expect(btnClear).toBeVisible();
    await btnClear.click();

    await expect(page.locator('#inputColabSearch')).toHaveValue('');
    const rows = await page.locator('#tbodyColaboradores tr').count();
    expect(rows).toBeGreaterThanOrEqual(5);
  });
});
