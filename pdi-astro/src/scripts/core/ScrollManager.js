import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Un solo Lenis para el scroll principal y una instancia por panel con scroll
 * vertical. Todas comparten un único requestAnimationFrame.
 *
 * Regla: un contenedor con scroll vertical se registra con
 * `data-smooth-scroll`. Los selectores conocidos se descubren solos para no
 * depender de tocar cada plantilla; los horizontales y los formularios quedan
 * fuera con `data-scroll-native` o `data-lenis-prevent`.
 */
const PANE_SELECTOR = [
  '[data-smooth-scroll]',
  '.nav-sections',
  '.audit-filters-body',
  '.padron-inner-dropdown-menu',
  '.sedes-master-list',
  '.sedes-detail-column',
  '.expediente-content-area',
  '.kanban-col-body'
].join(',');

const MODAL_PANE_SELECTOR = '.modal-body, .modal-box';

const NATIVE_SELECTOR = '[data-scroll-native], [data-lenis-prevent]';

function esFino() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function prefiereReducido() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tieneScrollVertical(el) {
  if (!el || el.nodeType !== 1) return false;
  const cs = getComputedStyle(el);
  if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') return false;
  return el.scrollHeight > el.clientHeight + 1;
}

export const ScrollManager = {
  main: null,
  mainWrapper: null,
  panes: new Map(),
  paneObservers: new Map(),
  rafId: null,
  observer: null,
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
    this.discover();
    this._observe();
    this._observeModales();
    this._syncModales();
    this._tick();
    this._devAudit();

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
      this.panes.forEach((pane) => pane.raf(time));
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  },

  _observe() {
    if (typeof MutationObserver !== 'function') return;
    let refreshRaf = null;
    const schedule = () => {
      if (refreshRaf !== null) return;
      refreshRaf = requestAnimationFrame(() => {
        refreshRaf = null;
        this.main?.resize();
        this.discover();
        this._cleanup();
      });
    };
    this.observer = new MutationObserver(schedule);
    this.observer.observe(document.body, { childList: true, subtree: true });
  },

  discover(root = document, selector = PANE_SELECTOR) {
    if (!this.enabled) return;
    root.querySelectorAll(selector).forEach((el) => {
      if (el.closest(NATIVE_SELECTOR)) return;
      // .modal-box solo interesa cuando es el que scrollea (el modal de dosaje
      // lleva el overflow en la caja, no en el body).
      if (el.matches('.modal-box')) {
        const oy = getComputedStyle(el).overflowY;
        if (oy !== 'auto' && oy !== 'scroll') return;
      }
      this.register(el);
    });
  },

  register(el) {
    if (!this.enabled || !el || this.panes.has(el) || el === this.main?.wrapper) return;
    const pane = new Lenis({
      wrapper: el,
      lerp: 0.12,
      smoothWheel: true,
      smoothTouch: this.touch,
      syncTouch: this.touch,
      autoRaf: false
    });
    this.panes.set(el, pane);
    requestAnimationFrame(() => pane.resize());

    // Un modal nace oculto y crece al abrirse: se remide con su propio tamaño.
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => pane.resize());
      ro.observe(el);
      this.paneObservers.set(el, ro);
    }
  },

  unregister(el) {
    const pane = this.panes.get(el);
    if (!pane) return;
    pane.destroy();
    this.panes.delete(el);
    const ro = this.paneObservers.get(el);
    if (ro) {
      ro.disconnect();
      this.paneObservers.delete(el);
    }
  },

  _cleanup() {
    this.panes.forEach((_pane, el) => {
      if (!el.isConnected) this.unregister(el);
    });
  },

  rebind() {
    const wrapper = document.querySelector('.content-viewport');
    if (!wrapper) return;
    if (this.main && this.mainWrapper === wrapper) return;
    this.main?.destroy();
    this.main = null;
    this._createMain();
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
    const backdrops = [...document.querySelectorAll('.modal-backdrop')];
    const abiertos = backdrops.filter((b) => b.classList.contains('open')
      || b.getAttribute('aria-hidden') === 'false');

    if (abiertos.length) {
      this.lock();
      abiertos.forEach((b) => this.discover(b, MODAL_PANE_SELECTOR));
    } else {
      this.unlock();
    }

    // Los panes de un modal cerrado no deben seguir vivos.
    backdrops.forEach((b) => {
      if (b.classList.contains('open') || b.getAttribute('aria-hidden') === 'false') return;
      b.querySelectorAll(MODAL_PANE_SELECTOR).forEach((el) => this.unregister(el));
    });
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

  refresh() {
    this.main?.resize();
    this.panes.forEach((pane) => pane.resize());
    this.discover();
  },

  stop() {
    this.main?.stop();
    this.panes.forEach((pane) => pane.stop());
  },

  start() {
    this.main?.start();
    this.panes.forEach((pane) => pane.start());
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
    this.observer?.disconnect();
    this.observer = null;
    this.modalObserver?.disconnect();
    this.modalObserver = null;
    this.main?.destroy();
    this.main = null;
    this.mainWrapper = null;
    this.panes.forEach((pane) => pane.destroy());
    this.panes.clear();
    this.paneObservers.forEach((ro) => ro.disconnect());
    this.paneObservers.clear();
    this._bound = false;
  },

  _devAudit() {
    if (!import.meta.env?.DEV) return;
    setTimeout(() => {
      const mainWrapper = document.querySelector('.content-viewport');
      document.querySelectorAll('*').forEach((el) => {
        if (el === mainWrapper) return;
        // El aside del sidebar computa overflow-y:auto por su overflow-x:hidden;
        // el scroll real vive en su .nav-sections.
        if (el.matches('.sidebar')) return;
        if (el.closest('.modal-backdrop')) return;
        if (!tieneScrollVertical(el) || this.panes.has(el)) return;
        if (el.closest(NATIVE_SELECTOR)) return;
        if (el.matches(PANE_SELECTOR)) return;
        console.warn('[ScrollManager] scroll vertical sin data-smooth-scroll:', el);
      });
    }, 1500);
  }
};
