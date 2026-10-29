import Lenis from 'lenis';

/**
 * Panel con scroll suave y barra propia. El wrapper deja de scrollear
 * (overflow: hidden); Lenis mueve el contenido y una barra dibujada refleja el
 * progreso. Así la barra nunca se queda clavada como con la nativa.
 */
const panes = new Map();

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

  const { content, creado } = crearContenido(wrapper);
  const overflowOriginal = wrapper.style.overflow;
  const positionOriginal = wrapper.style.position;

  wrapper.classList.add('is-scroll-pane');
  wrapper.style.overflow = 'hidden';
  if (cs.position === 'static') wrapper.style.position = 'relative';

  const lenis = new Lenis({
    wrapper,
    content,
    lerp: 0.12,
    smoothWheel: true,
    smoothTouch: true,
    syncTouch: true,
    autoRaf: false
  });

  const thumb = document.createElement('div');
  thumb.className = 'scroll-pane-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  wrapper.appendChild(thumb);

  const update = () => {
    const max = content.scrollHeight - wrapper.clientHeight;
    if (max <= 0) {
      thumb.style.opacity = '0';
      return;
    }
    const alto = Math.max(28, (wrapper.clientHeight / content.scrollHeight) * wrapper.clientHeight);
    const top = (lenis.progress || 0) * (wrapper.clientHeight - alto);
    thumb.style.height = `${alto}px`;
    thumb.style.transform = `translateY(${top}px)`;
    thumb.style.opacity = '1';
  };

  lenis.on('scroll', update);

  const arrastrar = (ev) => {
    ev.preventDefault();
    const startY = ev.clientY;
    const startScroll = lenis.actualScroll || 0;
    const max = content.scrollHeight - wrapper.clientHeight;
    const pista = wrapper.clientHeight - thumb.offsetHeight;
    if (pista <= 0) return;

    const mover = (e) => {
      const delta = ((e.clientY - startY) / pista) * max;
      lenis.scrollTo(startScroll + delta, { immediate: true });
    };
    const soltar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  };
  thumb.addEventListener('pointerdown', arrastrar);

  const ro = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => { lenis.resize(); update(); })
    : null;
  ro?.observe(content);
  ro?.observe(wrapper);

  requestAnimationFrame(() => { lenis.resize(); update(); });

  const state = {
    lenis, content, thumb, creado, overflowOriginal, positionOriginal, ro, update
  };
  panes.set(wrapper, state);
  return state;
}

function detach(wrapper) {
  const state = panes.get(wrapper);
  if (!state) return;
  state.ro?.disconnect();
  state.lenis.destroy();
  state.thumb.remove();
  wrapper.classList.remove('is-scroll-pane');
  wrapper.style.overflow = state.overflowOriginal;
  wrapper.style.position = state.positionOriginal;
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
    panes.forEach((state) => { state.lenis.resize(); state.update(); });
  },
  detachAll() {
    [...panes.keys()].forEach(detach);
  }
};

if (typeof window !== 'undefined') window.__pdiPanes = panes;
