// Motor de Animaciones e Interacciones Web (AnimationEngine)
// Proporciona animaciones fluidas (odómetro de dígitos) y utilidades IxD.

export const AnimationEngine = {
  /**
   * Contador estilo odómetro (kilometraje / slot roll) impulsado por GPU.
   * Rueda verticalmente cada dígito en columnas independientes con física orgánica.
   * @param {string|HTMLElement} elementOrId - ID del elemento o el nodo HTML.
   * @param {number|string} targetVal - Valor objetivo (soporta números, ratios '15 / 15', porcentajes).
   * @param {object} options - Configuración opcional (duration, prefix, suffix, decimals, stagger, mergeGlyphs).
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
        const glyph = ch === " " ? "&nbsp;" : ch;
        // mergeGlyphs: emitir los caracteres no numericos como texto, no como
        // spans. Un span por letra rompe el kerning (cada uno es un text run
        // aparte) y desalinea las palabras hasta ~0.6px respecto al texto plano;
        // al volver de odometro a texto la palabra se reacomoda y se percibe un
        // micro-movimiento. Como texto, el kerning se conserva.
        html += options.mergeGlyphs ? glyph : `<span class="odometer-glyph">${glyph}</span>`;
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
   * Cuenta una cifra desde el valor que ya se ve hasta el nuevo.
   *
   * A diferencia del odómetro, no depende de una transición CSS: si la pestaña
   * se oculta, llega otro valor o el elemento desaparece, escribe el objetivo y
   * termina. La primera vez que un elemento recibe un valor no anima: solo lo
   * escribe. Con movimiento reducido, también lo escribe de inmediato.
   *
   * @param {string|HTMLElement} elementoOrId
   * @param {number|string} objetivo
   * @param {{ formato?: (valor: number) => string, duracion?: number }} opciones
   */
  contar(elementoOrId, objetivo, opciones = {}) {
    const el = typeof elementoOrId === "string"
      ? document.getElementById(elementoOrId)
      : elementoOrId;
    if (!el) return;

    const destino = Number(objetivo);
    const formato = typeof opciones.formato === "function"
      ? opciones.formato
      : (valor) => String(Math.round(valor));
    const final = Number.isFinite(destino) ? formato(destino) : String(objetivo);

    const aplicarFinal = () => {
      el.textContent = final;
      if (Number.isFinite(destino)) el.dataset.contadorValor = String(destino);
      else delete el.dataset.contadorValor;
    };

    // Un valor nuevo cancela el anterior y arranca desde lo que se ve ahora.
    let desde;
    const previo = this._contadores.get(el);
    if (previo) {
      cancelAnimationFrame(previo.raf);
      this._contadores.delete(el);
      desde = previo.valor;
    } else {
      desde = Number(el.dataset.contadorValor);
    }

    const reducido = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!Number.isFinite(destino)
      || !Number.isFinite(desde)
      || desde === destino
      || reducido
      || document.hidden) {
      aplicarFinal();
      return;
    }

    const duracion = opciones.duracion || this._duracionToken("--dur-count", 560);
    const inicio = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const estado = { el, raf: 0, valor: desde, final, destino };

    const paso = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / duracion);
      const valor = desde + (destino - desde) * ease(p);
      estado.valor = valor;
      el.textContent = formato(valor);
      if (p < 1) {
        estado.raf = requestAnimationFrame(paso);
      } else {
        this._contadores.delete(el);
        aplicarFinal();
      }
    };

    this._contadores.set(el, estado);
    estado.raf = requestAnimationFrame(paso);
  },

  /**
   * Escribe una cifra con la regla de la app: la primera vez que el elemento
   * recibe un valor se escribe directo; las siguientes se cuentan desde el
   * valor anterior. Es el punto de entrada para las vistas que no construyen
   * su propio estado de primera pintura.
   */
  escribir(elementoOrId, valor, opciones = {}) {
    const el = typeof elementoOrId === "string"
      ? document.getElementById(elementoOrId)
      : elementoOrId;
    if (!el) return;

    const formato = typeof opciones.formato === "function"
      ? opciones.formato
      : (n) => String(Math.round(n));
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      el.textContent = String(valor);
      delete el.dataset.contadorValor;
      return;
    }

    if (opciones.animar === false || !el.dataset.contadorValor) {
      el.textContent = formato(numero);
      el.dataset.contadorValor = String(numero);
      return;
    }

    this.contar(el, numero, { formato });
  },

  /** Acaba de inmediato todos los contadores abiertos (pestaña oculta). */
  _alOcultarContadores() {
    if (typeof document === "undefined" || !document.hidden) return;
    [...this._contadores.values()].forEach((estado) => {
      cancelAnimationFrame(estado.raf);
      estado.el.textContent = estado.final;
      if (Number.isFinite(estado.destino)) {
        estado.el.dataset.contadorValor = String(estado.destino);
      } else {
        delete estado.el.dataset.contadorValor;
      }
      this._contadores.delete(estado.el);
    });
  },

  _contadores: new Map(),

  /** Lee una duración de un token CSS; si no existe, usa el valor de respaldo. */
  _duracionToken(nombre, porDefecto = 400) {
    if (typeof getComputedStyle !== "function") return porDefecto;
    const bruto = getComputedStyle(document.documentElement).getPropertyValue(nombre);
    const numero = parseFloat(bruto);
    if (!isFinite(numero)) return porDefecto;
    return bruto.includes("s") && !bruto.includes("ms") ? numero * 1000 : numero;
  },

  /**
   * Dispara animaciones de entrada en cascada viva (stagger) agregando clases CSS a elementos hijos.
   * @param {string|HTMLElement} parentOrId - Contenedor padre.
   * @param {string} itemSelector - Selector de los elementos hijos.
   */
  triggerStagger(parentOrId, itemSelector = ".stagger-item") {
    const parent = typeof parentOrId === "string" ? document.getElementById(parentOrId) : parentOrId;
    if (!parent) return;

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
    if (!contenedor) return;

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
   * animacion por fotogramas clave: es un cambio de color, no un desplazamiento,
   * asi que se percibe sin marear y encaja con el resto de transiciones.
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

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => AnimationEngine._alOcultarContadores());
}
