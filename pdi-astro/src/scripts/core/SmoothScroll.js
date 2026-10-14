import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

let active = null;
let rafId = null;

function startLoop() {
  if (rafId !== null) return;
  const step = (time) => {
    active?.raf(time);
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

function teardown() {
  if (active) {
    active.destroy();
    active = null;
  }
}

function setup() {
  if (reducedMotion) return;
  const container = document.querySelector('.content-viewport');
  const content = document.querySelector('.smooth-content');
  if (!container || !content || active) return;

  active = new Lenis({
    wrapper: container,
    content: content,
    duration: 1.0,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 1.6
  });

  try {
    active.scrollTo(0, { immediate: true });
  } catch {}
}

if (!window.__pdiSmoothScrollBound) {
  window.__pdiSmoothScrollBound = true;
  document.addEventListener('astro:before-swap', teardown);
  document.addEventListener('astro:page-load', setup);
  startLoop();
}

setup();
