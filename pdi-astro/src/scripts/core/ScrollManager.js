import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Lenis suaviza el viewport principal. Los paneles internos (sidebar,
 * modales, filtros) conservan el scroll nativo: en un wrapper con
 * overflow-y:auto, Lenis compite con la barra del navegador y la deja clavada.
 * La barra de todos los paneles se unifica por CSS.
 */
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

function esFino() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function prefiereReducido() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const ScrollManager = {
  main: null,
  mainWrapper: null,
  rafId: null,
  modalObserver: null,
  locked: false,
  enabled: false,
  touch: false,
  _bound: false,

  init() {
    if (this._bound) return;
    this._bound = true;

    const touchOptIn = document.documentElement.hasAttribute('data-smooth-touch')
      || new URLSearchParams(location.search).get('smoothTouch') === '1'
      || localStorage.getItem('pdi:smooth-touch') === '1';
    this.touch = !esFino() && touchOptIn;
    this.enabled = (esFino() || this.touch) && !prefiereReducido();

    if (!this.enabled) {
      window.__pdiScroll = this;
      return;
    }

    this._createMain();
    this._observeModales();
    this._syncModales();
    this._tick();

    window.__pdiScroll = this;
  },

  _createMain() {
    const wrapper = document.querySelector('.content-viewport');
    if (!wrapper) return;
    this.mainWrapper = wrapper;

    const content = wrapper.querySelector(':scope > .app-view.active')
      || document.querySelector('.smooth-content');

    this.main = new Lenis({
      wrapper,
      ...(content ? { content } : {}),
      lerp: 0.1,
      smoothWheel: true,
      smoothTouch: this.touch,
      syncTouch: this.touch,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      autoRaf: false
    });

    // La tabla y el triaje crecen después del montaje: sin remirar, el límite
    // se queda en el alto del esqueleto.
    const remide = () => this.main?.resize();
    requestAnimationFrame(remide);
    setTimeout(remide, 120);
    setTimeout(remide, 800);
    window.addEventListener('load', remide, { once: true });

    let intentos = 0;
    const insistir = () => {
      if (!this.main) return;
      this.main.resize();
      if (intentos++ < 16) setTimeout(insistir, 250);
    };
    insistir();
  },

  _tick() {
    if (this.rafId !== null) return;
    const loop = (time) => {
      this.main?.raf(time);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  },

  _observeModales() {
    if (typeof MutationObserver !== 'function') return;
    this.modalObserver = new MutationObserver((mutaciones) => {
      const tocaModal = mutaciones.some((m) => m.target.matches?.('.modal-backdrop'));
      if (tocaModal) this._syncModales();
    });
    this.modalObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'aria-hidden'],
      subtree: true
    });
  },

  _syncModales() {
    if (!this.enabled) return;
    const abiertos = [...document.querySelectorAll('.modal-backdrop')]
      .some((b) => b.classList.contains('open') || b.getAttribute('aria-hidden') === 'false');
    if (abiertos) this.lock();
    else this.unlock();
  },

  lock() {
    if (this.locked) return;
    this.locked = true;
    this.main?.stop();
  },

  unlock() {
    if (!this.locked) return;
    this.locked = false;
    this.main?.start();
  },

  rebind() {
    const wrapper = document.querySelector('.content-viewport');
    if (!wrapper) return;
    if (this.main && this.mainWrapper === wrapper) return;
    this.main?.destroy();
    this.main = null;
    this._createMain();
  },

  refresh() {
    this.main?.resize();
  },

  stop() {
    this.main?.stop();
  },

  start() {
    this.main?.start();
  },

  reset() {
    try {
      this.main?.scrollTo(0, { immediate: true });
    } catch {}
    document.querySelector('.content-viewport')?.scrollTo({ top: 0, behavior: 'auto' });
    window.scrollTo(0, 0);
  },

  onScroll(cb) {
    this.main?.on('scroll', cb);
  },

  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.modalObserver?.disconnect();
    this.modalObserver = null;
    this.main?.destroy();
    this.main = null;
    this.mainWrapper = null;
    this._bound = false;
  }
};
