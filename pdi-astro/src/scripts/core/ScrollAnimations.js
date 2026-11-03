import { ScrollManager } from './ScrollManager.js';

// Animaciones atadas al scroll, sin dependencias externas.
//
// Quedan tres responsabilidades: la barra de progreso de lectura, el parallax
// del showcase del login y nada más. Los reveals con GSAP nunca tuvieron
// elementos que animar y el snap del scroll competía con el gesto del usuario;
// ambos se retiraron.

let iniciado = false;
let limpiar = [];

function pintarBarra(barra, progreso) {
  const valor = Number.isFinite(progreso) ? Math.min(1, Math.max(0, progreso)) : 0;
  barra.style.transform = `scaleX(${valor})`;
}

export function initScrollAnimations() {
  if (iniciado) return;
  iniciado = true;

  const viewport = document.querySelector('.content-viewport');
  const barra = document.getElementById('scrollProgress');

  if (barra) {
    if (ScrollManager.main) {
      const alScrollear = ({ progress }) => pintarBarra(barra, progress);
      ScrollManager.onScroll(alScrollear);
      pintarBarra(barra, ScrollManager.main.progress || 0);
      limpiar.push(() => {
        try { ScrollManager.main?.off?.('scroll', alScrollear); } catch { /* ya destruido */ }
      });
    } else {
      const box = viewport || document.scrollingElement || document.documentElement;
      const actualizar = () => {
        const max = (box.scrollHeight || document.body.scrollHeight)
          - (box.clientHeight || window.innerHeight);
        const actual = box === document.documentElement ? window.scrollY : box.scrollTop;
        pintarBarra(barra, max > 0 ? actual / max : 0);
      };
      const objetivo = box === document.documentElement ? window : box;
      objetivo.addEventListener('scroll', actualizar, { passive: true });
      actualizar();
      limpiar.push(() => objetivo.removeEventListener('scroll', actualizar));
    }
  }

  // El login no tiene layout de panel: su scroll es el de la ventana y la
  // columna del showcase se mueve más despacio que el formulario. Sustituye al
  // parallax con ScrollTrigger que traía GSAP (~50 KB para un 6 %).
  const showcase = document.querySelector('.showcase-column');
  if (showcase && !viewport) {
    const actualizar = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progreso = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const desplazamiento = -progreso * 0.06 * showcase.offsetHeight;
      showcase.style.transform = `translate3d(0, ${desplazamiento.toFixed(2)}px, 0)`;
    };
    window.addEventListener('scroll', actualizar, { passive: true });
    actualizar();
    limpiar.push(() => {
      window.removeEventListener('scroll', actualizar);
      showcase.style.removeProperty('transform');
    });
  }
}

export function destroyScrollAnimations() {
  limpiar.forEach((fn) => { try { fn(); } catch { /* nada que limpiar */ } });
  limpiar = [];
  iniciado = false;
}
