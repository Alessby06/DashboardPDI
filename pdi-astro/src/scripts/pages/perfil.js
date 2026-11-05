// ===========================================================================
//  Página de perfil - punto de entrada de /perfil
// ===========================================================================
import { arrancarComun } from '../core/Bootstrap.js';
import { PerfilView } from '../views/PerfilView.js';

function iniciar() {
  if (document.body?.getAttribute('data-page') !== 'perfil') return;
  if (!arrancarComun()) return;
  PerfilView.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
document.addEventListener('astro:page-load', iniciar);
