// Motor de Animaciones e Interacciones Web (AnimationEngine)
// Proporciona animaciones fluidas, contadores reactivos (CounterUP) y utilidades IxD.

export const AnimationEngine = {
  /**
   * Si la persona ha pedido al sistema operativo que no se mueva nada.
   *
   * Ninguna de las animaciones de este motor es imprescindible: todas son
   * refuerzos de algo que ya cambia en pantalla por si solo. Asi que, cuando la
   * respuesta es que si, se escribe el estado final y no se anima.
   *
   * Antes este motor animaba siempre, sin mirar la consulta, de modo que el CSS
   * podia pedir quietud y el JavaScript seguia moviendo cosas por su cuenta. Eso
   * hacia que el ajuste de accesibilidad del sistema se cumpliera a medias.
   */
  prefiereMenosMovimiento() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) {
      return false;
    }
  },

  /**
   * Anima un contador numérico con desaceleración orgánica de alta precisión (Out-Quart / Spring).
   * @param {string|HTMLElement} elementOrId - ID del elemento o el nodo HTML.
   * @param {number|string} targetVal - Valor numérico objetivo.
   * @param {object} options - Opciones de configuración (duration, prefix, suffix, decimals).
   */
  animateCounter(elementOrId, targetVal, options = {}) {
    const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;

    const prefix = options.prefix || "";
    const suffix = options.suffix || "";

    // Con movimiento reducido se escribe el valor final de una vez: el dato es
    // exactamente el mismo, solo se ahorra el recorrido. Se respetan el prefijo,
    // el sufijo y los decimales para que el texto coincida con el animado.
    if (this.prefiereMenosMovimiento()) {
      const dec = options.decimals !== undefined
        ? options.decimals
        : (typeof targetVal === "number" && targetVal % 1 !== 0 ? 1 : 0);
      el.textContent = typeof targetVal === "number"
        ? `${prefix}${targetVal.toFixed(dec)}${suffix}`
        : `${targetVal}`;
      return;
    }

    // Soporte para formato de fracción/ratio "X / Y" (ej. "15 / 15")
    if (typeof targetVal === "string" && targetVal.includes("/")) {
      const parts = targetVal.split("/").map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const duration = options.duration || 750; // ms optimizados
        const startTime = performance.now();
        const updateRatio = (currentTime) => {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          // Easing Out Quart: dinámico al inicio y suave al fijarse
          const easeProgress = 1 - Math.pow(1 - progress, 4);
          const cur1 = Math.round(parts[0] * easeProgress);
          const cur2 = Math.round(parts[1] * easeProgress);
          el.textContent = `${cur1} / ${cur2}`;
          if (progress < 1) {
            requestAnimationFrame(updateRatio);
          } else {
            el.textContent = targetVal;
            el.classList.remove("vitality-glow");
            void el.offsetWidth;
            el.classList.add("vitality-glow");
          }
        };
        requestAnimationFrame(updateRatio);
        return;
      }
    }

    const numVal = typeof targetVal === "number" ? targetVal : parseFloat(targetVal) || 0;
    const decimals = options.decimals !== undefined ? options.decimals : (numVal % 1 !== 0 ? 1 : 0);

    const duration = options.duration || 750; // Duración ideal para dashboards (700-800ms)
    const startVal = 0;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing Out Quart: 1 - (1 - t)^4
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentVal = startVal + (numVal - startVal) * easeProgress;

      el.textContent = `${prefix}${currentVal.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        el.textContent = `${prefix}${numVal.toFixed(decimals)}${suffix}`;
        el.classList.remove("vitality-glow");
        void el.offsetWidth;
        el.classList.add("vitality-glow");
      }
    };

    requestAnimationFrame(updateCounter);
  },

  /**
   * Dispara animaciones de entrada en cascada viva (stagger) agregando clases CSS a elementos hijos.
   * @param {string|HTMLElement} parentOrId - Contenedor padre.
   * @param {string} itemSelector - Selector de los elementos hijos.
   */
  triggerStagger(parentOrId, itemSelector = ".stagger-item") {
    const parent = typeof parentOrId === "string" ? document.getElementById(parentOrId) : parentOrId;
    if (!parent) return;

    // Sin cascada no hay nada que hacer, y ademas hay que devolver el contenido:
    // la regla que oculta los .stagger-item tambien vive dentro de la consulta
    // de movimiento, asi que con movimiento reducido ya se ven por si solos.
    if (this.prefiereMenosMovimiento()) return;

    const items = parent.querySelectorAll(itemSelector);
    
    items.forEach((item, index) => {
      item.style.animationDelay = `${index * 45}ms`;
      item.classList.remove("stagger-animate");
      void item.offsetWidth;
      item.classList.add("stagger-animate");
    });
  },

  /**
   * Da entrada en cascada a los hijos de un contenedor recién pintado.
   *
   * Anade una clase que anima con animation-fill-mode: backwards, en vez de
   * ocultar los elementos antes y mostrarlos después. Con este patrón, si el
   * JavaScript no llegara a ejecutarse, el contenido se ve igual.
   *
   * @param {string|HTMLElement} contenedorOrId Contenedor cuyos hijos entran.
   * @param {string} selector Hijos que entran. Por defecto, los directos.
   * @param {object} opciones paso (ms por elemento) y maxDesfase (tope).
   */
  entradaEscalonada(contenedorOrId, selector = ":scope > *", opciones = {}) {
    const contenedor = typeof contenedorOrId === "string"
      ? document.getElementById(contenedorOrId)
      : contenedorOrId;
    if (!contenedor || this.prefiereMenosMovimiento()) return;

    // El desfase se corta a partir de maxDesfase. Sin ese tope, filtrar una
    // lista de doscientas filas haria que la ultima entrase casi ocho segundos
    // despues de la primera; el escalonado es para leer el arranque, no para
    // repartir la espera entre todas las filas.
    const paso = opciones.paso !== undefined ? opciones.paso : 32;
    const maxDesfase = opciones.maxDesfase !== undefined ? opciones.maxDesfase : 10;

    const items = contenedor.querySelectorAll(selector);
    items.forEach((item, i) => {
      item.style.setProperty("--ixd-i", Math.min(i, maxDesfase) * (paso / 32));
      item.classList.remove("ixd-entrada");
      void item.offsetWidth; // reinicia la animacion si ya estaba puesta
      item.classList.add("ixd-entrada");
    });
  },

  /**
   * Resalta un elemento que acaba de cambiar, para que el cambio se vea sin
   * tener que comparar de memoria con lo que habia antes.
   *
   * La clase pinta el fondo y lo devuelve con una transicion, no con una
   * animacion por fotogramas clave. La diferencia importa: con movimiento
   * reducido las animaciones se apagan, pero un cambio de color se conserva, de
   * modo que el aviso no desaparece justo para quien necesita mas claridad.
   */
  destacar(elementoOrId) {
    const el = typeof elementoOrId === "string"
      ? document.getElementById(elementoOrId)
      : elementoOrId;
    if (!el) return;

    el.classList.remove("ixd-destello");
    void el.offsetWidth;
    el.classList.add("ixd-destello");

    // Se retira en el fotograma siguiente: asi el color entra de golpe y se va
    // desvaneciendose por la transicion. Si se quedara puesta, un segundo cambio
    // sobre el mismo elemento no se veria.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.remove("ixd-destello"));
    });
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AnimationEngine = AnimationEngine;
}
