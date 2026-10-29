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
function puedeScrollear(el) {
  return el.scrollHeight > el.clientHeight + 2;
}

function crearContenido(wrapper) {
  const existente = wrapper.querySelector(':scope > [data-scroll-content]');
  if (existente) return { content: existente, creado: false };

  const cs = getComputedStyle(wrapper);
  const inner = document.createElement('div');
  inner.className = 'scroll-pane-content';
  inner.style.display = cs.display === 'flex' ? 'flex' : 'block';
  if (cs.display === 'flex') {
    inner.style.flexDirection = cs.flexDirection;
    inner.style.flexWrap = cs.flexWrap;
    inner.style.alignItems = cs.alignItems;
    inner.style.justifyContent = cs.justifyContent;
    inner.style.gap = cs.gap;
  }
  while (wrapper.firstChild) inner.appendChild(wrapper.firstChild);
  wrapper.appendChild(inner);
  return { content: inner, creado: true };
}

function attach(wrapper) {
  if (!wrapper || panes.has(wrapper)) return null;
  const cs = getComputedStyle(wrapper);
  if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') return null;
  if (!puedeScrollear(wrapper)) return null;

  const { content, creado } = crearContenido(wrapper);
  wrapper.classList.add('lenis-pane');

  const lenis = new Lenis({
    wrapper,
    content,
    lerp: 0.12,
    smoothWheel: true,
    smoothTouch: true,
    syncTouch: true,
    allowNestedScroll: true,
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
  ro?.observe(content);
  ro?.observe(wrapper);

  requestAnimationFrame(() => lenis.resize());

  const state = { lenis, content, creado, ro };
  panes.set(wrapper, state);
  return state;
}

function detach(wrapper) {
  const state = panes.get(wrapper);
  if (!state) return;
  state.ro?.disconnect();
  state.lenis.destroy();
  wrapper.classList.remove('lenis-pane');
  if (state.creado && state.content.parentElement === wrapper) {
    while (state.content.firstChild) wrapper.insertBefore(state.content.firstChild, state.content);
    state.content.remove();
  }
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
