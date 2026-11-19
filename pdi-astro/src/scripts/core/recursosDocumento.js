// Del HTML de una ruta se saca lo que hay que dejar en la caché del navegador
// antes de navegar: los módulos de la página y sus hojas de estilo.
//
// El router de Astro no cambia de documento hasta que el CSS del destino está
// cargado, así que adelantar solo los `script[type="module"]` deja la mitad del
// trabajo hecho: medido en producción, `padron.css` bloqueó el intercambio
// 168 ms aunque los módulos ya estuvieran descargados.
//
// Sin DOM: se ejecuta también en Node, donde se prueba.

const ETIQUETA = /<(script|link)\b([^>]*)>/gi;
const ATRIBUTO = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

/** Resuelve una URL relativa contra la base; null si no es utilizable. */
function resolver(valor, base) {
  if (!valor) return null;
  try {
    return new URL(valor, base).href;
  } catch {
    return null;
  }
}

/**
 * @param {string} html documento de destino
 * @param {string} base URL contra la que resolver rutas relativas
 * @returns {{ modulos: string[], estilos: string[] }}
 */
export function extraerRecursos(html, base = "http://localhost/") {
  const modulos = [];
  const estilos = [];
  if (typeof html !== "string") return { modulos, estilos };

  for (const etiqueta of html.matchAll(ETIQUETA)) {
    const nombre = etiqueta[1].toLowerCase();
    const attrs = {};
    for (const a of etiqueta[2].matchAll(ATRIBUTO)) {
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? "";
    }

    if (nombre === "script") {
      if ((attrs.type || "").toLowerCase() !== "module") continue;
      const src = resolver(attrs.src, base);
      if (src) modulos.push(src);
      continue;
    }

    const rel = (attrs.rel || "").toLowerCase().split(/\s+/);
    if (!rel.includes("stylesheet")) continue;
    const href = resolver(attrs.href, base);
    if (href) estilos.push(href);
  }

  return { modulos: [...new Set(modulos)], estilos: [...new Set(estilos)] };
}
