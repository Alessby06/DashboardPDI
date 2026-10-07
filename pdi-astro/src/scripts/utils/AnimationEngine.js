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
   * Contador estilo odómetro (kilometraje / slot roll) impulsado por GPU.
   * Rueda verticalmente cada dígito en columnas independientes con física orgánica.
   * @param {string|HTMLElement} elementOrId - ID del elemento o el nodo HTML.
   * @param {number|string} targetVal - Valor objetivo (soporta números, ratios '15 / 15', porcentajes).
   * @param {object} options - Configuración opcional (duration, prefix, suffix, decimals, stagger).
   */
  odometerRoll(elementOrId, targetVal, options = {}) {
    const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;

    const prefix = options.prefix || "";
    const suffix = options.suffix || "";

    let formatted = "";
    if (typeof targetVal === "number") {
      const dec = options.decimals !== undefined ? options.decimals : (targetVal % 1 !== 0 ? 1 : 0);
      formatted = `${prefix}${targetVal.toFixed(dec)}${suffix}`;
    } else {
      formatted = `${prefix}${targetVal}${suffix}`;
    }

    el.setAttribute("aria-label", formatted.trim());
    el.setAttribute("role", "text");

    // Accesibilidad: Si prefiere menos movimiento, mostrar el dato fijado inmediatamente
    if (this.prefiereMenosMovimiento()) {
      el.textContent = formatted;
      el._odometerTarget = formatted;
      return;
    }

    // Evitar reiniciar si ya tiene este valor objetivo renderizado como odómetro
    if (el._odometerTarget === formatted && el.querySelector(".odometer-wrap")) {
      return;
    }
    el._odometerTarget = formatted;

    const chars = formatted.split("");
    const duration = options.duration || 800;
    const stagger = options.stagger !== undefined ? options.stagger : 40;

    let html = '<span class="odometer-wrap" aria-hidden="true">';
    let digitIdx = 0;
    const digitTargets = [];

    chars.forEach((ch) => {
      if (/[0-9]/.test(ch)) {
        const d = parseInt(ch, 10);
        digitTargets.push({ index: digitIdx, digit: d });
        html += `<span class="odometer-digit" data-digit-idx="${digitIdx}"><span class="odometer-ribbon" style="transform: translateY(0%);"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></span></span>`;
        digitIdx++;
      } else {
        html += `<span class="odometer-glyph">${ch === " " ? "&nbsp;" : ch}</span>`;
      }
    });
    html += '</span>';

    el.innerHTML = html;

    // Ejecutar el rodamiento en doble frame para garantizar que el DOM y layout estén consolidados
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const ribbons = el.querySelectorAll(".odometer-ribbon");
        ribbons.forEach((ribbon, i) => {
          const target = digitTargets[i];
          if (!target) return;
          const delay = target.index * stagger;
          ribbon.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
          ribbon.style.transform = `translateY(-${target.digit * 10}%)`;
        });

        clearTimeout(el._odometerGlowTimer);
        const totalTime = duration + (digitIdx * stagger);
        el._odometerGlowTimer = setTimeout(() => {
          el.classList.remove("vitality-glow");
          void el.offsetWidth;
          el.classList.add("vitality-glow");
        }, totalTime);
      });
    });
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

    // Si ya hay una animación corriendo en este elemento, cancelarla
    if (el._counterRafId) {
      cancelAnimationFrame(el._counterRafId);
      el._counterRafId = null;
    }

    // Soporte para formato de fracción/ratio "X / Y" (ej. "15 / 15")
    if (typeof targetVal === "string" && targetVal.includes("/")) {
      const parts = targetVal.split("/").map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        // Evitar reiniciar si ya tiene este objetivo registrado en la sesión
        if (el._lastCounterTarget === targetVal) return;
        el._lastCounterTarget = targetVal;

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
            el._counterRafId = requestAnimationFrame(updateRatio);
          } else {
            el._counterRafId = null;
            el.textContent = targetVal;
            el.classList.remove("vitality-glow");
            void el.offsetWidth;
            el.classList.add("vitality-glow");
          }
        };
        el._counterRafId = requestAnimationFrame(updateRatio);
        return;
      }
    }

    const numVal = typeof targetVal === "number" ? targetVal : parseFloat(targetVal) || 0;
    const decimals = options.decimals !== undefined ? options.decimals : (numVal % 1 !== 0 ? 1 : 0);

    // Evitar reiniciar si el elemento ya animó este mismo objetivo
    const targetFormatted = `${prefix}${numVal.toFixed(decimals)}${suffix}`;
    if (el._lastCounterTarget === targetFormatted) {
      return;
    }
    el._lastCounterTarget = targetFormatted;

    // Si ya tenía un número parcial o previo, partir desde ahí en vez de volver a 0
    let startVal = 0;
    if (el._lastNumVal !== undefined) {
      startVal = el._lastNumVal;
    }
    el._lastNumVal = numVal;

    const duration = options.duration || 750; // Duración ideal para dashboards (700-800ms)
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing Out Quart: 1 - (1 - t)^4
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentVal = startVal + (numVal - startVal) * easeProgress;

      el.textContent = `${prefix}${currentVal.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        el._counterRafId = requestAnimationFrame(updateCounter);
      } else {
        el._counterRafId = null;
        el.textContent = `${prefix}${numVal.toFixed(decimals)}${suffix}`;
        el.classList.remove("vitality-glow");
        void el.offsetWidth;
        el.classList.add("vitality-glow");
      }
    };

    el._counterRafId = requestAnimationFrame(updateCounter);
  },

  /**
   * Dispara animaciones de entrada en cascada viva (stagger) agregando clases CSS a elementos hijos.
   * @param {string|HTMLElement} parentOrId - Contenedor padre.
   * @param {string} itemSelector - Selector de los elementos hijos.
   */
  triggerStagger(parentOrId, itemSelector = ".stagger-item") {
    const parent = typeof parentOrId === "string" ? document.getElementById(parentOrId) : parentOrId;
    if (!parent) return;

    // Sin cascada no hay nada que hacer con movimiento reducido
    if (this.prefiereMenosMovimiento()) return;

    // Evitar que la entrada escalonada se repita en refrescos de datos (evita que desaparezcan los elementos)
    if (parent._hasStaggered) return;
    parent._hasStaggered = true;

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
