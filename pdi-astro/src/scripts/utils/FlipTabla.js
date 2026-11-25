// FLIP de filas para las tablas de la app.
//
//   pintarFilas(tbody, html);          // cuando el html ya está armado
//
//   const flip = prepararFilas(tbody); // cuando hay que armar el html antes
//   tbody.innerHTML = ...;
//   animarFilas(tbody, flip);
//
// prepararFilas guarda dónde estaba cada fila y clona la tabla en una capa
// sobre el contenedor. animarFilas revela ahí las filas que salen y mueve las
// que siguen desde su posición anterior; las nuevas entran desde abajo.

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

function reducido() {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

export function animarFilas(tbody, ctx) {
  if (!ctx || !tbody) return;

  const { capa, clonadas, rects } = ctx;

  // Sin Web Animations la tabla ya está pintada: solo se retira la capa.
  if (typeof Element.prototype.animate !== "function") {
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
    salidas.forEach(({ tr }, i) => {
      tr.style.visibility = "visible";
      tr.style.background = "var(--surface-1)";
      tr.querySelectorAll("td").forEach((td) => {
        td.style.background = "var(--surface-1)";
      });
      tr.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-10px)" },
        ],
        { duration: 160, easing: EASE, fill: "forwards", delay: i * 6 },
      );
    });
    setTimeout(() => capa.remove(), 280);
  }

  let i = 0;
  nuevas.forEach((tr) => {
    const previo = rects.get(clave(tr));
    if (previo) {
      const delta = previo.top - tr.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) {
        tr.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
          { duration: 220, easing: EASE, delay: i * 10 },
        );
      }
    } else {
      tr.animate(
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

/** Pinta el html de un tbody y anima el cambio de filas. */
export function pintarFilas(tbody, html) {
  if (!tbody) return;
  const flip = prepararFilas(tbody);
  tbody.innerHTML = html;
  animarFilas(tbody, flip);
}
