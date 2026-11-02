// Marca cada botón con .pdi-motion para que reciba el contrato único de
// movimiento (styles/button-motion.css). Se ejecuta en todas las vistas porque
// AppLayout lo importa una sola vez, y observa el DOM para cubrir los botones
// que se pintan después: tablas, filtros, ordenaciones y modales.
//
// Las acciones de navegación del sidebar (.nav-btn) se excluyen a propósito:
// ya tienen su propio deslizamiento horizontal y su propia pulsación.

const SELECTOR = [
  'button',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  '[role="button"]',
  'a.btn-action',
  'a.btn-secondary',
  'a.btn-action-icon',
  'a.btn-page',
  'a.btn-micro-action',
  'a.row-action',
  'a.btn-text-subtle',
  'a.btn-asist',
].join(',');

const EXCLUDE = '.nav-btn, .no-motion, [data-no-motion]';

function marcar(raiz) {
  if (!raiz || raiz.nodeType !== 1) return;

  if (raiz.matches(SELECTOR) && !raiz.matches(EXCLUDE)) {
    raiz.classList.add('pdi-motion');
  }

  raiz.querySelectorAll(SELECTOR).forEach((el) => {
    if (!el.matches(EXCLUDE)) el.classList.add('pdi-motion');
  });
}

function iniciar() {
  // Con ClientRouter el layout puede reejectutarse; un solo observador basta.
  if (window.__pdiButtonMotion) {
    marcar(document.body || document.documentElement);
    return;
  }
  window.__pdiButtonMotion = true;

  marcar(document.body || document.documentElement);

  let pendiente = false;
  const observer = new MutationObserver((mutaciones) => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      for (const mutacion of mutaciones) {
        mutacion.addedNodes.forEach((nodo) => {
          if (nodo.nodeType === 1) marcar(nodo);
        });
      }
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
