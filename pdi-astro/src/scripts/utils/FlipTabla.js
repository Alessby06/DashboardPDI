// FLIP fluido y estable para tablas y tarjetas en modo Operate.
// Cumple con el estándar de movimiento de Impeccable y DESIGN.md:
// - Columnas con sincronización pixel-perfect (sin temblores de ancho).
// - Desplazamiento acotado a un rango armónico (sin saltos violentos a 3000px/s).
// - Salidas desvanecidas limpiamente sin parpadeos ni deformaciones de avatares.
// - Cero scrollbars verticales espurias ni layout shift.

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Preferencia del sistema: sin movimiento, los cambios son instantáneos. */
export function movimientoReducido() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function soportaAnimacion() {
  return typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
}

function visible(el) {
  return el && el.getClientRects && el.getClientRects().length > 0;
}

/** Detecta filas o tarjetas de carga/placeholder que no deben participar en FLIP. */
function esPlaceholder(el) {
  if (!el) return true;
  const id = (el.id || "").toLowerCase();
  const cl = (el.className || "").toLowerCase();
  if (id.includes("cargando") || id.includes("loading") || cl.includes("cargando") || cl.includes("loading")) return true;
  if (cl.includes("pdi-loading") || cl.includes("pdi-sk") || cl.includes("skeleton")) return true;
  if (el.tagName === "TR") {
    const celdas = el.querySelectorAll("td");
    if (celdas.length === 1 && (celdas[0].colSpan > 1 || (celdas[0].textContent || "").toLowerCase().includes("cargando"))) {
      return true;
    }
  }
  return false;
}

function clave(el) {
  return el.dataset.id
    || el.dataset.flipKey
    || el.id
    || `t:${(el.textContent || "").replace(/\s+/g, " ").trim()}`;
}

export function prepararFilas(tbody) {
  if (typeof document === "undefined" || !tbody || !tbody.isConnected || tbody.ownerDocument !== document || movimientoReducido()) return null;

  const tabla = tbody.closest("table");
  const contenedor = tabla && tabla.parentElement;
  if (!tabla || !contenedor) return null;

  const filas = [...tbody.querySelectorAll(":scope > tr")].filter(visible);
  if (!filas.length || filas.some(esPlaceholder)) return null;

  const rects = new Map();
  filas.forEach((tr) => rects.set(clave(tr), tr.getBoundingClientRect()));

  contenedor.querySelectorAll(".flip-exit-layer").forEach((capa) => capa.remove());
  if (getComputedStyle(contenedor).position === "static") {
    contenedor.style.position = "relative";
  }

  const capa = document.createElement("div");
  capa.className = "flip-exit-layer";
  capa.style.cssText = "position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;";

  const clon = tabla.cloneNode(true);
  const rectTabla = tabla.getBoundingClientRect();
  clon.style.width = `${rectTabla.width}px`;
  clon.style.tableLayout = "fixed";
  clon.style.borderCollapse = "separate";
  clon.style.borderSpacing = "0";

  // Sincronización pixel-perfect de anchos de columna para evitar cualquier temblor
  const ths = tabla.querySelectorAll("thead th");
  const clonThs = clon.querySelectorAll("thead th");
  ths.forEach((th, idx) => {
    if (clonThs[idx]) {
      const w = th.getBoundingClientRect().width;
      clonThs[idx].style.width = `${w}px`;
      clonThs[idx].style.minWidth = `${w}px`;
      clonThs[idx].style.maxWidth = `${w}px`;
      clonThs[idx].style.boxSizing = "border-box";
    }
  });

  const clonThead = clon.querySelector("thead");
  if (clonThead) clonThead.style.visibility = "hidden";

  const clonTbody = clon.querySelector("tbody");
  if (!clonTbody) return null;

  // Claves de filas clonadas antes de limpiar IDs
  const clonadas = [...clonTbody.querySelectorAll(":scope > tr")].map((tr) => {
    tr.style.visibility = "hidden";
    return { tr, key: clave(tr) };
  });

  const tablaId = tabla.id;
  clon.removeAttribute("id");
  if (tablaId) clon.classList.add(tablaId, `clone-of-${tablaId}`, "is-flip-clone");
  clon.querySelectorAll("[id]").forEach((n) => {
    n.classList.add(`clone-id-${n.id}`);
    n.removeAttribute("id");
  });

  capa.appendChild(clon);
  contenedor.appendChild(capa);

  return { capa, clonadas, rects };
}

/** Anima filas que se desplazan (FLIP suave con rango acotado) o que entran de nuevo */
function animarItems(nuevas, rects) {
  let i = 0;
  nuevas.forEach((el) => {
    const key = clave(el);
    const previo = rects.get(key);
    if (previo) {
      const delta = Math.round(previo.top - el.getBoundingClientRect().top);
      if (Math.abs(delta) > 1) {
        // Acotamos el desplazamiento a ±70px para un deslizamiento fluido sin tirones violentos
        const travel = Math.min(Math.max(delta, -70), 70);
        const opInicial = Math.abs(delta) > 70 ? 0.5 : 1;
        el.animate(
          [
            { transform: `translateY(${travel}px)`, opacity: opInicial },
            { transform: "translateY(0)", opacity: 1 }
          ],
          { duration: 210, easing: EASE, delay: Math.min(i * 6, 36) }
        );
      }
    } else {
      // Fila nueva: micro-elevación limpia con entrada suave
      el.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: 180, easing: EASE, delay: Math.min(i * 8, 48) }
      );
    }
    i++;
  });
}

/** Desvanece limpiamente hacia arriba las filas salientes */
function animarSalidas(salidas) {
  salidas.forEach((el, i) => {
    el.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-8px)" }
      ],
      { duration: 160, easing: EASE, fill: "forwards", delay: Math.min(i * 6, 30) }
    );
  });
  return 190;
}

export function animarFilas(tbody, ctx) {
  if (!ctx || !tbody || !soportaAnimacion() || movimientoReducido()) {
    if (ctx?.capa) ctx.capa.remove();
    return;
  }

  const { capa, clonadas, rects } = ctx;
  const nuevas = [...tbody.querySelectorAll(":scope > tr")].filter(visible);
  if (!nuevas.length || nuevas.some(esPlaceholder)) {
    if (capa) capa.remove();
    return;
  }

  const clavesNuevas = new Set(nuevas.map(clave));
  const salidas = (clonadas || []).filter(({ tr, key }) => rects.has(key) && !clavesNuevas.has(key));

  if (!salidas.length) {
    if (capa) capa.remove();
  } else {
    const trs = salidas.map(({ tr }) => {
      tr.style.visibility = "visible";
      tr.style.background = "var(--surface-1)";
      tr.querySelectorAll("td").forEach((td) => {
        td.style.background = "var(--surface-1)";
      });
      return tr;
    });
    setTimeout(() => { if (capa) capa.remove(); }, animarSalidas(trs));
  }

  animarItems(nuevas, rects);
}

/** Pinta el html de un tbody y aplica la animación de filas. */
export function pintarFilas(tbody, html) {
  if (!tbody) return;
  const flip = prepararFilas(tbody);
  tbody.innerHTML = html;
  animarFilas(tbody, flip);
}

// --- Tarjetas y listas FLIP (móviles y vistas modulares) --------------------

export function prepararTarjetas(contenedor) {
  if (typeof document === "undefined" || !contenedor || !contenedor.isConnected || contenedor.ownerDocument !== document || movimientoReducido()) {
    return null;
  }
  if (!soportaAnimacion()) return null;

  contenedor.querySelectorAll(".flip-exit-layer").forEach((capa) => capa.remove());

  const items = [...contenedor.children].filter((el) => visible(el) && !el.classList.contains("flip-exit-layer"));
  if (!items.length || items.some(esPlaceholder)) return null;

  const contRect = contenedor.getBoundingClientRect();
  const rects = new Map();
  const salidas = [];

  items.forEach((el) => {
    const key = clave(el);
    const r = el.getBoundingClientRect();
    rects.set(key, r);
    salidas.push({ el, key, top: r.top - contRect.top + contenedor.scrollTop, alto: r.height });
  });

  return { rects, items: salidas, altoPrevio: contRect.height };
}

export function animarTarjetas(contenedor, ctx) {
  if (!ctx || !contenedor || !soportaAnimacion() || movimientoReducido()) return;

  const nuevas = [...contenedor.children].filter((el) => visible(el) && !el.classList.contains("flip-exit-layer"));
  const clavesNuevas = new Set(nuevas.map(clave));
  const salidas = ctx.items.filter(({ key }) => !clavesNuevas.has(key));

  if (salidas.length) {
    contenedor.querySelectorAll(".flip-exit-layer").forEach((capa) => capa.remove());
    if (getComputedStyle(contenedor).position === "static") {
      contenedor.style.position = "relative";
    }

    const capa = document.createElement("div");
    capa.className = "flip-exit-layer";
    capa.style.cssText = `position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;min-height:${ctx.altoPrevio || 0}px;`;

    salidas.forEach(({ el, top, alto }) => {
      if (el.isConnected) return;
      el.removeAttribute("id");
      el.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      el.style.cssText += `;position:absolute;left:0;right:0;top:${top}px;height:${alto}px;margin:0;pointer-events:none;`;
      capa.appendChild(el);
    });

    if (capa.childElementCount) {
      contenedor.appendChild(capa);
      setTimeout(() => capa.remove(), animarSalidas([...capa.children]));
    }
  }

  animarItems(nuevas, ctx.rects);
}

/** Pinta el html de una lista de tarjetas y aplica la animación. */
export function pintarTarjetas(contenedor, html) {
  if (!contenedor) return;
  const flip = prepararTarjetas(contenedor);
  contenedor.innerHTML = html;
  animarTarjetas(contenedor, flip);
}
