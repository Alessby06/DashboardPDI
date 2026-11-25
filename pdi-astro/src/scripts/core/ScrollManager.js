import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { ScrollPane, puedeScrollear, resizeLenis } from './ScrollPane.js';
import { esScrollNativo } from './scrollMode.js';
import { crearFiltroReversaRueda } from './scrollWheelGuard.js';

// Primera fase de diagnóstico: solo una instancia en el viewport principal.
const HABILITAR_LENIS_EN_PANELES = false;

/**
 * Lenis en el viewport principal. Durante la prueba, los paneles internos
 * conservan el scroll nativo para evitar instancias anidadas. En móvil
 * (puntero grueso o ventana <= 900 px) el navegador lleva el scroll nativo.
 */
const PANE_SELECTOR = [
  '[data-smooth-scroll]',
  // `.nav-sections` (el menú lateral) queda fuera a proposito: su Lenis
  // anidado reiniciaba el scrollTop al moverse el <aside> en cada navegacion
  // del ClientRouter. El menu scrollea nativo y conserva la posicion.
  '.modal-body',
  '.modal-box',
  '.drawer-body',
  '.sheet-body',
  '.filter-panel-body',
  '.notificaciones-lista',
  '.audit-filters-body',
  '.padron-inner-dropdown-menu',
  '.padron-sort-menu',
  '.sedes-master-list',
  '.sedes-detail-column',
  '.expediente-content-area',
  '.kanban-col-body',
  '.cuentas-sedes-grid',
  '.deriv-body'
].join(',');

function esFino() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
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
  native: false,
  touch: false,
  _bound: false,

  _evaluarModo() {
    const optIn = document.documentElement.hasAttribute('data-smooth-touch')
      || new URLSearchParams(location.search).get('smoothTouch') === '1'
      || localStorage.getItem('pdi:smooth-touch') === '1';
    const punteroFino = esFino();

    // En móvil el navegador es el que scrollea. El opt-in permite comparar y
    // volver a Lenis sin desplegar. `touch` conserva el significado anterior
    // para el caso en que Lenis sí se monte (tablet con ratón, opt-in).
    this.native = esScrollNativo({
      punteroFino,
      ancho: window.innerWidth,
      optIn,
    });
    this.touch = !punteroFino || optIn;
    this.enabled = !this.native;
  },

  _montar() {
    this._createMain();
    if (HABILITAR_LENIS_EN_PANELES) {
      this.discover();
      this._observe();
      this._observeModales();
    }
    this._syncModales();
    this._tick();
  },

  _desmontar() {
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
    this.locked = false;
  },

  init() {
    if (this._bound) return;
    this._bound = true;

    this._evaluarModo();

    if (this.enabled) {
      this._montar();
    }

    // Al cambiar el tamaño de la ventana pueden aparecer o desaparecer
    // desbordamientos, o cruzarse el corte entre scroll nativo y Lenis.
    this._onResize = () => {
      if (this._resizeId) clearTimeout(this._resizeId);
      this._resizeId = setTimeout(() => {
        const estabaActivo = this.enabled;
        this._evaluarModo();
        if (estabaActivo && !this.enabled) {
          this._desmontar();
        } else if (!estabaActivo && this.enabled) {
          this._montar();
        } else if (this.enabled) {
          this.refresh();
        }
      }, 180);
    };
    window.addEventListener('resize', this._onResize);

    window.__pdiScroll = this;
  },

  _createMain() {
    if (!this.enabled) return;
    const wrapper = document.querySelector('.content-viewport');

    const preventNested = (node) => {
      if (!node || node === wrapper) return false;
      if (node.hasAttribute?.('data-lenis-prevent') || node.hasAttribute?.('data-scroll-native')) return true;
      if (node.classList?.contains('pdi-scroll-pane')) return true;
      if (node.closest?.('.pdi-scroll-pane, [data-lenis-prevent], [data-scroll-native]')) return true;

      // Contenedores registrados en PANE_SELECTOR con scroll vertical activo
      const elScroll = node.closest?.(PANE_SELECTOR);
      if (elScroll && !enModalCerrado(elScroll) && puedeScrollear(elScroll)) return true;

      // Índice lateral del expediente (scroll nativo propio)
      const elSidebarExp = node.closest?.('.expediente-sidebar');
      if (elSidebarExp && puedeScrollear(elSidebarExp)) return true;

      // Textareas o bloques preformateados con desbordamiento vertical
      const elTexto = node.closest?.('textarea, pre, code');
      if (elTexto && elTexto.scrollHeight > elTexto.clientHeight + 2) return true;

      return false;
    };

    const virtualScroll = ({ event }) => {
      if (event.type !== 'wheel') return true;
      return true;
    };

    // Login e index no usan AppLayout: Lenis va sobre la ventana.
    if (!wrapper) {
      this.mainWrapper = null;
      this.main = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: this.touch,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        allowNestedScroll: false,
        prevent: preventNested,
        virtualScroll,
        autoRaf: false
      });
      const remide = () => resizeLenis(this.main);
      requestAnimationFrame(remide);
      setTimeout(remide, 200);
      return;
    }

    this.mainWrapper = wrapper;

    const content = wrapper.querySelector('.smooth-content') || wrapper.firstElementChild;

    this.main = new Lenis({
      wrapper,
      ...(content ? { content } : {}),
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: this.touch,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      allowNestedScroll: false,
      prevent: preventNested,
      virtualScroll,
      autoRaf: false
    });

    // Solo medidas tempranas: Lenis ya observa el wrapper con autoResize.
    // Medir mas tarde reinicia targetScroll al animatedScroll actual y se
    // come parte del giro del raton, sobre todo al querer subir desde el
    // fondo (los 16 reintentos cada 250 ms hacian que no respondiera).
    const remide = () => resizeLenis(this.main);
    requestAnimationFrame(remide);
    setTimeout(remide, 120);
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
        const objetivos = new Set();
        mutaciones.forEach((m) => {
          if (m.target && m.target.nodeType === 1) {
            const pane = m.target.closest(PANE_SELECTOR);
            if (pane) objetivos.add(pane);
            else objetivos.add(m.target);
          }
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1) {
              objetivos.add(n);
              n.querySelectorAll?.(PANE_SELECTOR)?.forEach((p) => objetivos.add(p));
            }
          });
        });
        objetivos.forEach((el) => {
          if (el.matches?.(PANE_SELECTOR)) {
            if (el.closest('[data-lenis-prevent], [data-scroll-native]') || enModalCerrado(el)) {
              ScrollPane.detach(el);
            } else if (puedeScrollear(el)) {
              ScrollPane.attach(el);
            } else {
              ScrollPane.detach(el);
            }
          } else {
            this.autoAttach(el);
          }
        });
        this.main?.dimensions?.resize?.();
        this._cleanup();
      });
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  },

  autoAttach(el) {
    if (!HABILITAR_LENIS_EN_PANELES || !this.enabled || !el || el.nodeType !== 1) return;
    if (el === this.mainWrapper) return;
    // El menu lateral scrollea nativo: su Lenis anidado reiniciaba la
    // posicion al mover el <aside> en cada navegacion del ClientRouter.
    if (el.closest('.sidebar')) return;
    if (el.classList.contains('pdi-scroll-pane') || el.closest('[data-lenis-prevent], [data-scroll-native]')) return;
    if (enModalCerrado(el)) return;
    if (el.matches('pre, code, textarea, input, select, .table-container, .table-responsive, .kanban-board, .expediente-sidebar, .sidebar')) return;
    if (el.clientHeight < 40 || el.scrollHeight <= el.clientHeight + 4) return;
    const cs = getComputedStyle(el);
    if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') return;
    ScrollPane.attach(el);
  },

  discover(root = document) {
    if (!HABILITAR_LENIS_EN_PANELES || !this.enabled) return;
    root.querySelectorAll(PANE_SELECTOR).forEach((el) => {
      if (el.closest('[data-lenis-prevent], [data-scroll-native]')) return;
      if (el === this.mainWrapper) return;
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

    if (HABILITAR_LENIS_EN_PANELES && abiertos.length) {
      abiertos.forEach((b) => this.discover(b));
      // El modal acaba de cambiar a visible: se repite en el siguiente frame
      // y tras la transición de apertura para medir con el layout ya aplicado.
      requestAnimationFrame(() => abiertos.forEach((b) => this.discover(b)));
      setTimeout(() => abiertos.forEach((b) => {
        if (b.isConnected && (b.classList.contains('open') || b.getAttribute('aria-hidden') === 'false')) {
          this.discover(b);
        }
      }), 320);
    }

    this.syncLock();

    if (HABILITAR_LENIS_EN_PANELES) {
      backdrops.forEach((b) => {
        if (b.classList.contains('open') || b.getAttribute('aria-hidden') === 'false') return;
        b.querySelectorAll(PANE_SELECTOR).forEach((el) => ScrollPane.detach(el));
      });
    }
  },

  /** Única fuente de verdad para bloquear o reanudar el scroll principal según modales u hojas abiertas. */
  syncLock() {
    if (!this.enabled) return;
    const hayModal = [...document.querySelectorAll('.modal-backdrop')].some(
      (b) => b.classList.contains('open') || b.getAttribute('aria-hidden') === 'false'
    );
    const hayHoja = Boolean(
      document.body?.classList?.contains('filter-sheet-open')
      || document.body?.classList?.contains('sedes-sheet-open')
      || document.body?.classList?.contains('pdi-drawer-open')
    );
    if (hayModal || hayHoja) this.lock();
    else this.unlock();
  },

  resetEl(el) {
    if (!el) return;
    const pane = ScrollPane.panes.get(el);
    try {
      pane?.lenis?.scrollTo(0, { immediate: true, force: true });
    } catch {}
    el.scrollTop = 0;
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
    if (!this.enabled) return;
    const wrapper = document.querySelector('.content-viewport');
    if (!wrapper) return;
    const content = wrapper.querySelector('.smooth-content') || wrapper.firstElementChild;
    if (this.main && this.mainWrapper === wrapper && this.main.options?.content === content) return;
    this.main?.destroy();
    this.main = null;
    this._createMain();
    this._tick();
  },

  refresh() {
    this._cleanup();
    resizeLenis(this.main);
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
