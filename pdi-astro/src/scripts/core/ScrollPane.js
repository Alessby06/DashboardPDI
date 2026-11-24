import Lenis from 'lenis';

/**
 * Pane con Lenis conservando la barra nativa. El wrapper sigue siendo el que
 * scrollea (overflow-y: auto); Lenis mueve su scrollTop y la barra del
 * navegador se desplaza con él. No se oculta la barra ni se dibuja otra.
 */
const panes = new Map();

/** Un contenedor solo debe capturar la rueda si de verdad tiene contenido que
 * desplazar. Los que no desbordan se dejan nativos para que el evento suba al
 * viewport y la página siga moviéndose. */
export function puedeScrollear(el) {
  return Boolean(el && el.scrollHeight > el.clientHeight + 2);
}

function attach(wrapper) {
  if (!wrapper) return null;
  const existing = panes.get(wrapper);
  if (existing) {
    if (puedeScrollear(wrapper)) {
      existing.lenis.resize();
      return existing;
    }
    detach(wrapper);
    return null;
  }

  const cs = getComputedStyle(wrapper);
  if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') return null;
  if (!puedeScrollear(wrapper)) return null;

  wrapper.classList.add('lenis-pane');

  const content = wrapper.querySelector(':scope > [data-scroll-content]') || wrapper;

  const lenis = new Lenis({
    wrapper,
    content,
    lerp: 0.12,
    smoothWheel: true,
    syncTouch: true,
    allowNestedScroll: false,
    autoRaf: false
  });

  const ro = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => {
        // Si el panel deja de desbordar (o aún no tiene contenido), se suelta
        // para no bloquear la rueda del viewport.
        if (!puedeScrollear(wrapper)) {
          detach(wrapper);
          return;
        }
        lenis.resize();
      })
    : null;
  ro?.observe(wrapper);
  if (content !== wrapper) ro?.observe(content);

  const mo = typeof MutationObserver === 'function'
    ? new MutationObserver(() => {
        if (!puedeScrollear(wrapper)) {
          detach(wrapper);
          return;
        }
        lenis.resize();
      })
    : null;
  mo?.observe(wrapper, { childList: true, subtree: true });

  requestAnimationFrame(() => lenis.resize());

  const state = { lenis, content, ro, mo };
  panes.set(wrapper, state);
  return state;
}

function detach(wrapper) {
  const state = panes.get(wrapper);
  if (!state) return;
  state.mo?.disconnect();
  state.ro?.disconnect();
  state.lenis.destroy();
  wrapper.classList.remove('lenis-pane');
  panes.delete(wrapper);
}

export const ScrollPane = {
  panes,
  attach,
  detach,
  raf(time) {
    panes.forEach((state) => state.lenis.raf(time));
  },
  stop() {
    panes.forEach((state) => state.lenis.stop());
  },
  start() {
    panes.forEach((state) => state.lenis.start());
  },
  refresh() {
    [...panes.keys()].forEach((el) => {
      const state = panes.get(el);
      if (!state) return;
      if (puedeScrollear(el)) state.lenis.resize();
      else detach(el);
    });
  },
  detachAll() {
    [...panes.keys()].forEach(detach);
  }
};

if (typeof window !== 'undefined') window.__pdiPanes = panes;
