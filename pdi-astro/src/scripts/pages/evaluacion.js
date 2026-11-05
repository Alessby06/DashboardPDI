// ===========================================================================
//  Página de evaluación socioeconómica - punto de entrada de /evaluacion
// ===========================================================================
import { arrancarComun } from '../core/Bootstrap.js';
import { EvaluacionView } from '../views/EvaluacionView.js';

function iniciar() {
  if (document.body?.getAttribute('data-page') !== 'evaluacion') return;
  if (!arrancarComun()) return;
  EvaluacionView.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
document.addEventListener('astro:page-load', iniciar);
