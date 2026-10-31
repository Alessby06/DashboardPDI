import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { ScrollPane } from './ScrollPane.js';

/**
 * Lenis en el viewport principal y en cada panel con scroll vertical. Los
 * paneles usan ScrollPane: wrapper sin barra nativa, contenido transformado y
 * barra propia arrastrable. Un solo requestAnimationFrame para todos.
 */
const PANE_SELECTOR = [
  '[data-smooth-scroll]',
  '.nav-sections',
  '.modal-body',
  '.modal-box',
  '.audit-filters-body',
  '.padron-inner-dropdown-menu',
  '.sedes-master-list',
  '.sedes-detail-column',
  '.expediente-content-area',
  '.kanban-col-body'
].join(',');

const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

function esFino() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function prefiereReducido() {
  return mqReduce.matches;
}

/** Un panel dentro de un modal cerrado no se monta: no recibe puntero y solo
 * gastaría una instancia de Lenis. */
function enModalCerrado(el) {
  const backdrop = el.closest('.modal-backdrop');
  if (!backdrop) return false;
  return !(backdrop.classList.contains('open') || backdrop.getAttribute('aria-hidden') === 'false');
}

export const ScrollManager = {
  main: null,
  mainWrapper: null,
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
    this.touch = !esFino() || touchOptIn;
    this.enabled = !prefiereReducido();

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

    // Al cambiar el tamaño de la ventana pueden aparecer o desaparecer
    // desbordamientos: se vuelve a decidir qué paneles merecen Lenis.
    this._onResize = () => {
      if (this._resizeId) clearTimeout(this._resizeId);
      this._resizeId = setTimeout(() => this.refresh(), 180);
    };
    window.addEventListener('resize', this._onResize);

    window.__pdiScroll = this;
  },

  _createMain() {
    const wrapper = document.querySelector('.content-viewport');

    // Login e index no usan AppLayout: Lenis va sobre la ventana.
    if (!wrapper) {
      this.mainWrapper = null;
      this.main = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        smoothTouch: this.touch,
        syncTouch: this.touch,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        allowNestedScroll: true,
        autoRaf: false
      });
      const remide = () => this.main?.resize();
      requestAnimationFrame(remide);
      setTimeout(remide, 200);
      return;
    }

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
      allowNestedScroll: true,
      autoRaf: false
    });

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
      ScrollPane.raf(time);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  },

  _observe() {
    if (typeof MutationObserver !== 'function') return;
    let raf = null;
    this.observer = new MutationObserver((mutaciones) => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        mutaciones.forEach((m) => {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1) this.discover(n);
          });
        });
        this._cleanup();
      });
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  },

  autoAttach(el) {
    if (!this.enabled || !el || el.nodeType !== 1) return;
    if (el === this.mainWrapper) return;
    if (el.closest('.lenis-pane, [data-lenis-prevent], [data-scroll-native]')) return;
    if (enModalCerrado(el)) return;
    if (el.matches('pre, code, textarea, input, select, .table-container, .table-responsive, .kanban-board, .expediente-sidebar, .sidebar')) return;
    if (el.clientHeight < 40 || el.scrollHeight <= el.clientHeight + 4) return;
    const cs = getComputedStyle(el);
    if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') return;
    ScrollPane.attach(el);
  },

  discover(root = document) {
    if (!this.enabled) return;
    root.querySelectorAll(PANE_SELECTOR).forEach((el) => {
      if (el.closest('[data-lenis-prevent]')) return;
      if (el === this.mainWrapper) return;
      if (el.closest('.lenis-pane')) return;
      if (enModalCerrado(el)) return;
      ScrollPane.attach(el);
    });

    // La regla cubre cualquier panel con scroll vertical, aunque no esté en la
    // lista de selectores. Se revisa una vez por página o por nodo añadido.
    const ambito = root === document ? document.body : root;
    if (ambito && ambito.nodeType === 1) this.autoAttach(ambito);
    ambito?.querySelectorAll?.('*').forEach((el) => this.autoAttach(el));
  },

  _cleanup() {
    ScrollPane.panes.forEach((_state, el) => {
      // Desconectado o sin caja (display: none): se suelta para no dejar una
      // instancia viva en un panel cerrado.
      if (!el.isConnected || el.getClientRects().length === 0) ScrollPane.detach(el);
    });
  },

  _observeModales() {
    if (typeof MutationObserver !== 'function') return;
    this.modalObserver = new MutationObserver((mutaciones) => {
      let tocaModal = false;
      const paneles = new Set();

      mutaciones.forEach((m) => {
        const t = m.target;
        if (!t.matches) return;
        if (t.matches('.modal-backdrop')) tocaModal = true;
        // Desplegables y hojas no existen al descubrir la página: al abrirse
        // hay que medirlos o su scroll interno se queda sin Lenis.
        if (t.matches('.custom-dropdown, .padron-inner-dropdown') && t.classList.contains('open')) {
          paneles.add(t);
        }
      });

      if (tocaModal) this._syncModales();

      paneles.forEach((t) => {
        // Primer frame: el panel ya es visible. Segundo, pasada la animación
        // de apertura, para los menús que crecen en altura.
        requestAnimationFrame(() => this.discover(t));
        setTimeout(() => this.discover(t), 260);
      });
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
      abiertos.forEach((b) => this.discover(b));
      // El modal acaba de cambiar a visible: se repite en el siguiente frame
      // para medir con el layout ya aplicado.
      requestAnimationFrame(() => abiertos.forEach((b) => this.discover(b)));
    } else {
      this.unlock();
    }

    backdrops.forEach((b) => {
      if (b.classList.contains('open') || b.getAttribute('aria-hidden') === 'false') return;
      b.querySelectorAll(PANE_SELECTOR).forEach((el) => ScrollPane.detach(el));
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

  rebind() {
    const wrapper = document.querySelector('.content-viewport');
    if (!wrapper) return;
    if (this.main && this.mainWrapper === wrapper) return;
    this.main?.destroy();
    this.main = null;
    this._createMain();
  },

  refresh() {
    this._cleanup();
    this.main?.resize();
    ScrollPane.refresh();
    this.discover();
  },

  stop() {
    this.main?.stop();
    ScrollPane.stop();
  },

  start() {
    this.main?.start();
    ScrollPane.start();
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
    ScrollPane.detachAll();
    this.main?.destroy();
    this.main = null;
    this.mainWrapper = null;
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    this._onResize = null;
    if (this._resizeId) clearTimeout(this._resizeId);
    this._resizeId = null;
    this._bound = false;
  }
};
