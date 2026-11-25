// FLIP de filas y tarjetas para las tablas y sus listas móviles.
//
//   pintarFilas(tbody, html);            // tabla, html ya armado
//   pintarTarjetas(contenedor, html);    // tarjetas móviles, html ya armado
//
//   const flip = prepararFilas(tbody);   // tabla, cuando hay que armar el html
//   tbody.innerHTML = ...;
//   animarFilas(tbody, flip);
//
//   const flip = prepararTarjetas(contenedor);
//   contenedor.innerHTML = ...;
//   animarTarjetas(contenedor, flip);
//
// preparar* guarda dónde estaba cada fila o tarjeta. animar* mueve las que
// siguen desde su posición anterior, hace entrar las nuevas desde abajo y
// desvanece hacia arriba las que salen, clonadas en una capa absoluta.

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

function reducido() {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function soportaAnimacion() {
  return typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
}

function visible(el) {
  return el.getClientRects().length > 0;
}

function clave(el) {
  return el.dataset.id
    || el.dataset.flipKey
    || el.id
    || `t:${(el.textContent || "").replace(/\s+/g, " ").trim()}`;
}

export function prepararFilas(tbody) {
  if (!tbody || !tbody.isConnected || tbody.ownerDocument !== document || reducido()) return null;

  const tabla = tbody.closest("table");
  const contenedor = tabla && tabla.parentElement;
  if (!tabla || !contenedor) return null;

  const filas = [...tbody.querySelectorAll(":scope > tr")].filter(visible);
  if (!filas.length) return null;

  const rects = new Map();
  filas.forEach((tr) => rects.set(clave(tr), tr.getBoundingClientRect()));

  contenedor.querySelectorAll(".flip-exit-layer").forEach((capa) => capa.remove());
  if (getComputedStyle(contenedor).position === "static") {
    contenedor.style.position = "relative";
  }

  const capa = document.createElement("div");
  capa.className = "flip-exit-layer";
  capa.style.cssText = "position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden;";

  const clon = tabla.cloneNode(true);
  clon.style.width = `${tabla.getBoundingClientRect().width}px`;
  clon.style.tableLayout = "fixed";
  clon.style.borderCollapse = "separate";
  clon.style.borderSpacing = "0";

  const clonThead = clon.querySelector("thead");
  if (clonThead) clonThead.style.visibility = "hidden";

  const clonTbody = clon.querySelector("tbody");
  if (!clonTbody) return null;

  // Se apunta la clave de cada fila clonada antes de quitarle los id: si no,
  // la capa dejaría id repetidos en el documento mientras vive.
  const clonadas = [...clonTbody.querySelectorAll(":scope > tr")].map((tr) => {
    tr.style.visibility = "hidden";
    return { tr, key: clave(tr) };
  });

  clon.removeAttribute("id");
  clon.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));

  capa.appendChild(clon);
  contenedor.appendChild(capa);

  return { capa, clonadas, rects };
}

/** Las que siguen suben desde su posición anterior; las nuevas entran. */
function animarItems(nuevas, rects) {
  let i = 0;
  nuevas.forEach((el) => {
    const previo = rects.get(clave(el));
    if (previo) {
      const delta = previo.top - el.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) {
        el.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
          { duration: 220, easing: EASE, delay: i * 10 },
        );
      }
    } else {
      el.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 200, easing: EASE, delay: i * 16 },
      );
    }
    i++;
  });
}

/** Desvanece hacia arriba lo que salió. */
function animarSalidas(salidas) {
  salidas.forEach((el, i) => {
    el.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-10px)" },
      ],
      { duration: 160, easing: EASE, fill: "forwards", delay: i * 6 },
    );
  });
  return 280;
}

export function animarFilas(tbody, ctx) {
  if (!ctx || !tbody) return;

  const { capa, clonadas, rects } = ctx;

  // Sin Web Animations la tabla ya está pintada: solo se retira la capa.
  if (!soportaAnimacion()) {
    capa.remove();
    return;
  }

  const nuevas = [...tbody.querySelectorAll(":scope > tr")].filter(visible);
  const clavesNuevas = new Set(nuevas.map(clave));

  // Filas que ya no están: se revelan en el clon con su fondo para tapar la
  // tabla nueva que hay debajo, y se van hacia arriba.
  const salidas = clonadas.filter(({ tr, key }) => rects.has(key) && !clavesNuevas.has(key));

  if (!salidas.length) {
    capa.remove();
  } else {
    const trs = salidas.map(({ tr }) => {
      tr.style.visibility = "visible";
      tr.style.background = "var(--surface-1)";
      tr.querySelectorAll("td").forEach((td) => {
        td.style.background = "var(--surface-1)";
      });
      return tr;
    });
    setTimeout(() => capa.remove(), animarSalidas(trs));
  }

  animarItems(nuevas, rects);
}

/** Pinta el html de un tbody y anima el cambio de filas. */
export function pintarFilas(tbody, html) {
  if (!tbody) return;
  const flip = prepararFilas(tbody);
  tbody.innerHTML = html;
  animarFilas(tbody, flip);
}

// --- Tarjetas móviles -------------------------------------------------------
// Mismo criterio que las filas, pero sobre los hijos directos del contenedor:
// no hay tabla que clonar, así que la tarjeta que sale se recoloca donde
// estaba (el nodo desmontado se conserva entero) y se desvanece ahí.

export function prepararTarjetas(contenedor) {
  if (!contenedor || !contenedor.isConnected || contenedor.ownerDocument !== document || reducido()) {
    return null;
  }
  if (!soportaAnimacion()) return null;

  const items = [...contenedor.children].filter(visible);
  if (!items.length) return null;

  const contRect = contenedor.getBoundingClientRect();
  const rects = new Map();
  const salidas = [];

  // Se guarda la referencia, no un clon: al reemplazar el innerHTML el nodo
  // queda desmontado pero entero, y solo se recoloca si de verdad sale.
  items.forEach((el) => {
    const key = clave(el);
    const r = el.getBoundingClientRect();
    rects.set(key, r);
    salidas.push({ el, key, top: r.top - contRect.top + contenedor.scrollTop, alto: r.height });
  });

  return { rects, items: salidas };
}

export function animarTarjetas(contenedor, ctx) {
  if (!ctx || !contenedor) return;

  const nuevas = [...contenedor.children].filter(visible);
  const clavesNuevas = new Set(nuevas.map(clave));
  const salidas = ctx.items.filter(({ key }) => !clavesNuevas.has(key));

  if (salidas.length) {
    contenedor.querySelectorAll(".flip-exit-layer").forEach((capa) => capa.remove());
    if (getComputedStyle(contenedor).position === "static") {
      contenedor.style.position = "relative";
    }

    const capa = document.createElement("div");
    capa.className = "flip-exit-layer";
    capa.style.cssText = "position:absolute;inset:0;z-index:3;pointer-events:none;";

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

/** Pinta el html de una lista de tarjetas y anima el cambio. */
export function pintarTarjetas(contenedor, html) {
  if (!contenedor) return;
  const flip = prepararTarjetas(contenedor);
  contenedor.innerHTML = html;
  animarTarjetas(contenedor, flip);
}
