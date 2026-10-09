// Motor de Animaciones e Interacciones Web (AnimationEngine)
// Proporciona animaciones fluidas (odómetro de dígitos) y utilidades IxD.

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
      });
    });
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

    // Red de seguridad. La entrada se aplica con animation-fill-mode: backwards,
    // asi que mientras la animacion no avance el elemento esta en su fotograma
    // inicial, con opacity 0. Si no llega a avanzar (documento oculto, reloj de
    // animacion congelado, pestaña en segundo plano) el contenido se queda invisible
    // sin que haya ninguna otra regla que lo revele. Pasado el tiempo en que la
    // animacion deberia haber terminado, se quita la clase: el elemento vuelve a su
    // estado normal, que es visible. Si la animacion corrio bien, quitarla ahora no
    // cambia nada, porque el estado final es el mismo.
    const desfaseTope = maxDesfase * (paso / 32) * 28;
    const espera = desfaseTope + this._duracionNormaMs() + 150;

    items.forEach((item, i) => {
      item.style.setProperty("--ixd-i", Math.min(i, maxDesfase) * (paso / 32));
      item.classList.remove("ixd-entrada");
      void item.offsetWidth; // reinicia la animacion si ya estaba puesta
      item.classList.add("ixd-entrada");

      if (item._ixdSalida) clearTimeout(item._ixdSalida);
      item._ixdSalida = setTimeout(() => {
        item._ixdSalida = null;
        item.classList.remove("ixd-entrada");
      }, espera);
    });
  },

  /**
   * Valor en ms de --dur-norm, que es la duracion de .ixd-entrada.
   *
   * Se lee del documento porque la variable puede cambiar de tema o de version;
   * si no se pudiera leer se devuelve un valor por defecto generoso, que solo
   * retrasa el momento en que se quita la clase, nunca lo impide.
   */
  _duracionNormaMs() {
    if (typeof getComputedStyle !== "function") return 400;
    const bruto = getComputedStyle(document.documentElement).getPropertyValue("--dur-norm");
    const numero = parseFloat(bruto);
    if (!isFinite(numero)) return 400;
    return bruto.includes("s") && !bruto.includes("ms") ? numero * 1000 : numero;
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
