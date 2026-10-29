import { ScrollManager } from './ScrollManager.js';
import { initScrollAnimations, destroyScrollAnimations } from './ScrollAnimations.js';

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

/** Interpolación propia para el ancla: no depende del scrollTo de Lenis. */
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

  ScrollManager.main?.resize();
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
  ScrollManager.reset();
}

if (!window.__pdiSmoothScrollBound) {
  window.__pdiSmoothScrollBound = true;
  reduce = mqReduce.matches;

  ScrollManager.init();
  initScrollAnimations();

  document.addEventListener('astro:before-swap', () => {
    destroyScrollAnimations();
    ScrollManager.stop();
  });
  document.addEventListener('astro:after-swap', () => {
    ScrollManager.rebind();
    resetScroll();
    ScrollManager.refresh();
    ScrollManager.start();
    ScrollManager._syncModales?.();
    initScrollAnimations();
  });
  document.addEventListener('astro:page-load', () => ScrollManager.refresh());

  if (typeof mqReduce.addEventListener === 'function') {
    mqReduce.addEventListener('change', () => {
      reduce = mqReduce.matches;
      if (reduce) ScrollManager.stop();
      else ScrollManager.start();
    });
  }

  enlazarAnclas();
}
