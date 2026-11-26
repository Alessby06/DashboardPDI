// Transición fluida de resultados para tablas y tarjetas en modo Operate.
// Cumple con DESIGN.md: «Al filtrar no se relanza la cascada de filas: los resultados cambian en el sitio».
//
//   pintarFilas(tbody, html);            // tabla, html ya armado
//   pintarTarjetas(contenedor, html);    // tarjetas móviles, html ya armado
//
//   const ctx = prepararFilas(tbody);    // tabla, cuando se arma el html antes
//   tbody.innerHTML = ...;
//   animarFilas(tbody, ctx);
//
//   const ctx = prepararTarjetas(contenedor);
//   contenedor.innerHTML = ...;
//   animarTarjetas(contenedor, ctx);

const EASE_SMOOTH = "cubic-bezier(0.16, 1, 0.3, 1)";
const DUR_MS = 140;

/** Preferencia del sistema: sin movimiento, los cambios son instantáneos. */
export function movimientoReducido() {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function soportaAnimacion() {
  return typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
}

function visible(el) {
  return el && el.getClientRects && el.getClientRects().length > 0;
}

/** Detecta filas o tarjetas de carga/placeholder que no deben participar en animaciones. */
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

export function prepararFilas(tbody) {
  if (!tbody || !tbody.isConnected || tbody.ownerDocument !== document || movimientoReducido()) return null;

  const filas = [...tbody.querySelectorAll(":scope > tr")].filter(visible);
  if (!filas.length || filas.some(esPlaceholder)) return null;

  const tabla = tbody.closest("table");
  const contenedor = tabla && tabla.parentElement;
  if (contenedor) {
    contenedor.querySelectorAll(".flip-exit-layer").forEach((capa) => capa.remove());
  }

  return { animar: true };
}

export function animarFilas(tbody, ctx) {
  if (!ctx || !ctx.animar || !tbody || !soportaAnimacion() || movimientoReducido()) return;

  const nuevas = [...tbody.querySelectorAll(":scope > tr")].filter(visible);
  if (!nuevas.length || nuevas.some(esPlaceholder)) return;

  // Transición suave in-situ a nivel de tbody: rápida, reactiva y sin layout thrashing ni temblores
  try {
    tbody.animate(
      [
        { opacity: 0.65 },
        { opacity: 1 }
      ],
      { duration: DUR_MS, easing: EASE_SMOOTH }
    );
  } catch (_) {}
}

/** Pinta el html de un tbody y aplica una transición suave. */
export function pintarFilas(tbody, html) {
  if (!tbody) return;
  const ctx = prepararFilas(tbody);
  tbody.innerHTML = html;
  animarFilas(tbody, ctx);
}

// --- Tarjetas móviles -------------------------------------------------------

export function prepararTarjetas(contenedor) {
  if (!contenedor || !contenedor.isConnected || contenedor.ownerDocument !== document || movimientoReducido()) {
    return null;
  }
  if (!soportaAnimacion()) return null;

  const items = [...contenedor.children].filter(visible);
  if (!items.length || items.some(esPlaceholder)) return null;

  contenedor.querySelectorAll(".flip-exit-layer").forEach((capa) => capa.remove());

  return { animar: true };
}

export function animarTarjetas(contenedor, ctx) {
  if (!ctx || !ctx.animar || !contenedor || !soportaAnimacion() || movimientoReducido()) return;

  const nuevas = [...contenedor.children].filter(visible);
  if (!nuevas.length || nuevas.some(esPlaceholder)) return;

  try {
    contenedor.animate(
      [
        { opacity: 0.7, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: DUR_MS + 20, easing: EASE_SMOOTH }
    );
  } catch (_) {}
}

/** Pinta el html de una lista de tarjetas y aplica una transición suave. */
export function pintarTarjetas(contenedor, html) {
  if (!contenedor) return;
  const ctx = prepararTarjetas(contenedor);
  contenedor.innerHTML = html;
  animarTarjetas(contenedor, ctx);
}
