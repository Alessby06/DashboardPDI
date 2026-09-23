// Motor de Animaciones e Interacciones Web (AnimationEngine)
// Proporciona animaciones de contadores numéricos (CounterUP) y utilidades IxD.

export const AnimationEngine = {
  /**
   * Anima un contador numérico desde 0 (o su valor actual) hasta el valor final.
   * @param {string|HTMLElement} elementOrId - ID del elemento o el nodo HTML.
   * @param {number} targetVal - Valor numérico objetivo.
   * @param {object} options - Opciones de configuración (duration, prefix, suffix, decimals).
   */
  animateCounter(elementOrId, targetVal, options = {}) {
    const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;

    const duration = options.duration || 1000; // ms
    const decimals = options.decimals !== undefined ? options.decimals : (targetVal % 1 !== 0 ? 1 : 0);
    const prefix = options.prefix || "";
    const suffix = options.suffix || "";

    const startVal = 0;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Funki de Easing (Out Cubic: 1 - Math.pow(1 - progress, 3))
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = startVal + (targetVal - startVal) * easeProgress;

      el.textContent = `${prefix}${currentVal.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        el.textContent = `${prefix}${targetVal.toFixed(decimals)}${suffix}`;
      }
    };

    requestAnimationFrame(updateCounter);
  },

  /**
   * Dispara animaciones de entrada en cascada (stagger) agregando clases CSS a elementos hijos.
   * @param {string|HTMLElement} parentOrId - Contenedor padre.
   * @param {string} itemSelector - Selector de los elementos hijos.
   */
  triggerStagger(parentOrId, itemSelector = ".stagger-item") {
    const parent = typeof parentOrId === "string" ? document.getElementById(parentOrId) : parentOrId;
    if (!parent) return;

    const items = parent.querySelectorAll(itemSelector);
    items.forEach((item, index) => {
      item.style.animationDelay = `${index * 40}ms`;
      item.classList.remove("stagger-animate");
      // Trigger reflow
      void item.offsetWidth;
      item.classList.add("stagger-animate");
    });
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AnimationEngine = AnimationEngine;
}
