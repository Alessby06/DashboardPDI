import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let active = null;
let reduce = false;
let rafId = null;
let resizeObserver = null;
let mutationObserver = null;
let resizeRaf = null;
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

const loop = (time) => {
  active?.raf(time);
  rafId = requestAnimationFrame(loop);
};

function startLoop() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  if (rafId === null) return;
  cancelAnimationFrame(rafId);
  rafId = null;
}

function contenedor() {
  return document.querySelector('.content-viewport');
}

function teardown() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  if (resizeRaf !== null) {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = null;
  }
  const instancia = window.__pdiLenis || active;
  if (instancia) instancia.destroy();
  window.__pdiLenis = null;
  active = null;
  stopLoop();
}

function observar(content) {
  const remide = () => {
    if (resizeRaf !== null) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      window.__pdiLenis?.resize();
    });
  };
  if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver(remide);
    resizeObserver.observe(content);
  }
  if (typeof MutationObserver === 'function') {
    mutationObserver = new MutationObserver(remide);
    mutationObserver.observe(content, { childList: true, subtree: true });
  }
}

function setup() {
  reduce = mqReduce.matches;
  if (reduce) {
    teardown();
    return;
  }

  const wrapper = contenedor();
  // Lenis transforma el content: debe ser el hijo directo del wrapper. El
  // .smooth-content está dos niveles más adentro y no mueve el scroll.
  const content = wrapper?.querySelector(':scope > .app-view.active')
    || document.querySelector('.smooth-content');
  if (!wrapper || !content) return;

  if (window.__pdiLenis) {
    active = window.__pdiLenis;
    active.resize();
    startLoop();
    return;
  }

  active = new Lenis({
    wrapper,
    content,
    lerp: 0.1,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
    autoResize: true
  });

  window.__pdiLenis = active;
  observar(content);
  startLoop();

  try {
    active.scrollTo(0, { immediate: true });
  } catch {}
  requestAnimationFrame(() => window.__pdiLenis?.resize());
  setTimeout(() => window.__pdiLenis?.resize(), 120);
  setTimeout(() => window.__pdiLenis?.resize(), 800);
  window.addEventListener('load', () => window.__pdiLenis?.resize(), { once: true });

  // La tabla se hidrata por tramos: se remide durante los primeros segundos
  // hasta que el alto real estabiliza el límite de scroll.
  let intentos = 0;
  const remide = () => {
    if (!window.__pdiLenis) return;
    window.__pdiLenis.resize();
    if (intentos++ < 16) setTimeout(remide, 250);
  };
  remide();
}

function offsetSuperior() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return -16;
  const estilo = getComputedStyle(topbar);
  const flotante = estilo.position === 'sticky' || estilo.position === 'fixed';
  return flotante ? -(topbar.getBoundingClientRect().height + 12) : -16;
}

/** Interpolación de respaldo si Lenis no acepta el destino. */
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

  const lenis = window.__pdiLenis;
  if (lenis) lenis.resize();

  // El ancla usa la interpolación propia: scrollTo() de Lenis no acepta el
  // destino en este contenedor anidado. Lenis queda para la rueda.
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

  document.addEventListener('astro:before-swap', teardown);
  document.addEventListener('astro:after-swap', () => {
    resetScroll();
    setup();
  });
  document.addEventListener('astro:page-load', setup);

  if (typeof mqReduce.addEventListener === 'function') {
    mqReduce.addEventListener('change', () => {
      reduce = mqReduce.matches;
      if (reduce) teardown();
      else setup();
    });
  }

  enlazarAnclas();
  setup();
}
