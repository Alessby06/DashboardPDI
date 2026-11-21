// ===========================================================================
//  Página de cuentas - punto de entrada de /cuentas
// ===========================================================================
//  Solo administración. PageGuard decide el acceso y arrancarComun monta el
//  chrome; después la vista pide el listado real al servidor.
import { arrancarComun } from '../core/Bootstrap.js';
import { CuentasView } from '../views/CuentasView.js';

document.addEventListener('astro:before-swap', (ev) => {
  try {
    const ruta = new URL(ev.to, location.href).pathname.replace(/\/+$/, '') || '/';
    if (ruta === '/cuentas') {
      CuentasView.preSwap?.(ev.newDocument, ev.to);
    }
  } catch {}
});

document.addEventListener('astro:page-load', () => {
  if (document.body?.getAttribute('data-page') !== 'cuentas') return;
  if (!arrancarComun()) return;
  CuentasView.iniciar();
});
