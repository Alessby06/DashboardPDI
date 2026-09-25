// Motor de Animaciones e Interacciones Web (AnimationEngine)
// Proporciona animaciones fluidas, contadores reactivos (CounterUP) y utilidades IxD.

export const AnimationEngine = {
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

    const items = parent.querySelectorAll(itemSelector);
    
    items.forEach((item, index) => {
      item.style.animationDelay = `${index * 45}ms`;
      item.classList.remove("stagger-animate");
      void item.offsetWidth;
      item.classList.add("stagger-animate");
    });
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AnimationEngine = AnimationEngine;
}
