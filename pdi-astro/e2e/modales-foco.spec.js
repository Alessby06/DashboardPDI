// Foco al cerrar modales: el foco debe volver al disparador ANTES de que el
// modal quede inerte/aria-hidden, y no debe caer en BODY.
// La ficha A1 usa el mismo helper (`moverFocoFueraDeModal`); su comportamiento
// se cubre en tests/foco-modal.test.js porque en el modal global de Astro el
// foco no entra en el subárbol desde un evaluate.
import { test, expect } from '@playwright/test';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

test('cerrarAtencion(false) devuelve el foco al disparador sin reabrir detalle', async ({ page }) => {
  await entrar(page, cuentas().coord);
  await page.goto('/social');

  await page.evaluate(() => {
    window.PDI.DerivacionView.abrirAtencion({ _casoId: 'e2e-foco' });
  });
  // abrirAtencion enfoca la descripción a los 60 ms.
  await page.waitForTimeout(150);

  const cierre = await page.evaluate(() => {
    const modal = document.getElementById('modalAtencionCaso');
    const disparador = document.getElementById('btnSidebarToggle');
    // Representa el disparador capturado al abrir.
    window.PDI.DerivacionView._focoAtencion = disparador;
    const residual = document.createElement('button');
    residual.type = 'button';
    modal.appendChild(residual);
    residual.focus();
    const dentroAntes = modal.contains(document.activeElement);
    window.PDI.DerivacionView.cerrarAtencion(false);
    residual.remove();
    return {
      dentroAntes,
      focoDevuelto: document.activeElement === disparador,
      focoTag: document.activeElement?.tagName,
      inerte: modal.hasAttribute('inert'),
      ariaHidden: modal.getAttribute('aria-hidden'),
    };
  });
  expect(cierre.dentroAntes).toBe(true);
  expect(cierre.focoDevuelto).toBe(true);
  expect(cierre.focoTag).not.toBe('BODY');
  expect(cierre.inerte).toBe(true);
  expect(cierre.ariaHidden).toBe('true');
});
