import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollManager } from './ScrollManager.js';

gsap.registerPlugin(ScrollTrigger);

let iniciado = false;

/**
 * Animaciones atadas al scroll. Se ejecutan después de ScrollManager.init().
 * Un solo eje: progreso de lectura, reveals de bloques principales y la
 * entrada de las marcas del triaje. Nada de animar cada tarjeta.
 */
export function initScrollAnimations() {
  if (iniciado) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const viewport = document.querySelector('.content-viewport');
  const scroller = viewport || window;
  ScrollTrigger.defaults({ scroller });
  iniciado = true;

  const bar = document.getElementById('scrollProgress');
  if (bar) {
    const setBar = (p) => {
      const valor = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
      bar.style.transform = `scaleX(${valor})`;
    };
    if (ScrollManager.main) {
      ScrollManager.onScroll(({ progress }) => setBar(progress));
      setBar(ScrollManager.main.progress || 0);
    } else {
      const box = viewport;
      const actualizar = () => {
        const max = (box?.scrollHeight || document.body.scrollHeight)
          - (box?.clientHeight || window.innerHeight);
        setBar(max > 0 ? (box?.scrollTop || window.scrollY) / max : 0);
      };
      (box || window).addEventListener('scroll', actualizar, { passive: true });
      actualizar();
    }
  }

  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 14,
      duration: 0.45,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  // La regla de Hb: las marcas de cada fila entran escalonadas una sola vez.
  const marcas = gsap.utils.toArray('.triaje-mark');
  if (marcas.length) {
    gsap.from(marcas, {
      scale: 0,
      opacity: 0,
      duration: 0.35,
      stagger: 0.025,
      ease: 'back.out(1.6)',
      scrollTrigger: { trigger: '.triaje', start: 'top 80%', once: true }
    });
  }

  // El login no tiene layout de panel: su scroll es el de la ventana y la
  // columna del showcase se mueve más despacio que el formulario.
  const showcase = document.querySelector('.showcase-column');
  if (showcase && !viewport) {
    gsap.to(showcase, {
      yPercent: -6,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  // Snap opt-in: solo actúa si hay más de una sección marcada con data-snap.
  const snaps = gsap.utils.toArray('[data-snap]');
  if (snaps.length > 1) {
    const maxScroll = () => ScrollTrigger.maxScroll(scroller);
    const posiciones = () => {
      const box = viewport || document.documentElement;
      const rectBox = box.getBoundingClientRect();
      return snaps.map((el) => {
        const rect = el.getBoundingClientRect();
        const top = rect.top - rectBox.top + (viewport ? viewport.scrollTop : window.scrollY);
        return Math.max(0, Math.min(maxScroll(), top));
      });
    };

    ScrollTrigger.create({
      trigger: snaps[0],
      start: 'top top',
      end: () => `+=${maxScroll()}`,
      snap: {
        snapTo: (value) => {
          const max = maxScroll();
          if (!max) return 0;
          const y = value * max;
          const pos = posiciones();
          const cercano = pos.reduce((best, p) => (
            Math.abs(p - y) < Math.abs(best - y) ? p : best
          ), 0);
          return cercano / max;
        },
        duration: 0.35,
        delay: 0.12,
        ease: 'power1.inOut'
      }
    });
  }

  ScrollTrigger.refresh();
}

export function destroyScrollAnimations() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  iniciado = false;
}
