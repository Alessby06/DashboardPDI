let reduce = false;
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

function contenedor() {
  return document.querySelector('.content-viewport');
}

function offsetSuperior() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return -16;
  const estilo = getComputedStyle(topbar);
  const flotante = estilo.position === 'sticky' || estilo.position === 'fixed';
  return flotante ? -(topbar.getBoundingClientRect().height + 12) : -16;
}

function animarScroll(box, destino, duracion = 520) {
  const desde = box.scrollTop;
  const delta = destino - desde;
  if (reduce || Math.abs(delta) < 1) {
    box.scrollTop = destino;
    return;
  }
  const inicio = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const paso = (ahora) => {
    const p = Math.min(1, (ahora - inicio) / duracion);
    box.scrollTop = desde + delta * ease(p);
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/**
 * Anclaje suave con interpolación propia. Lenis queda fuera: en este layout
 * de contenedor anidado se queda en `isScrolling` y revierte el scroll.
 */
function scrollToHash(hash) {
  if (!hash || hash === '#') return false;
  const target = document.querySelector(hash);
  const box = contenedor();
  if (!target || !box) return false;

  const destino = Math.max(0,
    target.getBoundingClientRect().top
    - box.getBoundingClientRect().top
    + box.scrollTop
    + offsetSuperior());

  animarScroll(box, destino);
  return true;
}

function enlazarAnclas() {
  // En captura: el ClientRouter de Astro también escucha los clics y, si
  // llega primero, el ancla salta sin animación.
  document.addEventListener('click', (ev) => {
    if (ev.button !== 0) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

    const enlace = ev.target.closest('a[href^="#"]');
    if (!enlace) return;
    const href = enlace.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;

    ev.preventDefault();
    ev.stopPropagation();
    scrollToHash(href);
    if (history.pushState) history.pushState(null, '', href);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }, { capture: true });

  if (location.hash) {
    requestAnimationFrame(() => scrollToHash(location.hash));
  }
}

function resetScroll() {
  if (location.hash) return;
  const box = contenedor();
  if (box) box.scrollTo({ top: 0, behavior: 'auto' });
  window.scrollTo(0, 0);
}

if (!window.__pdiSmoothScrollBound) {
  window.__pdiSmoothScrollBound = true;
  reduce = mqReduce.matches;

  document.addEventListener('astro:before-swap', () => {
    // La transición de Astro toma el control; el scroll se reinicia después.
  });
  document.addEventListener('astro:after-swap', resetScroll);
  document.addEventListener('astro:page-load', resetScroll);

  if (typeof mqReduce.addEventListener === 'function') {
    mqReduce.addEventListener('change', () => {
      reduce = mqReduce.matches;
    });
  }

  enlazarAnclas();
}
