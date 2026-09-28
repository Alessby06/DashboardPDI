// Estado de filtros en la URL.
//
// En la SPA los filtros vivian en memoria, en campos del objeto de la vista.
// Eso tenia tres consecuencias: al recargar se perdia todo, un filtro no se
// podia compartir ni mandar por mensaje, y el boton atras arrastraba la pagina
// entera porque todas las vistas vivian en el mismo documento.
//
// Aqui el estado vive en la cadena de consulta, que es lo unico que sobrevive a
// una recarga y lo unico que se puede copiar de la barra de direcciones.
//
// Hay dos modos de escritura y la diferencia importa:
//
//   escribir()  replaceState. Un filtro no es un paso navegable. Si escribiera
//               una entrada por pulsacion de tecla, el historial se llenaria de
//               basura y el boton atras dejaria de servir para lo unico que la
//               gente quiere que haga: volver al filtro anterior, no a la
//               pagina anterior.
//
//   anadir()    pushState. Para lo que si es un paso: recorrer expedientes, por
//               ejemplo. Ademas obliga a repintar, porque pushState no recarga.
//
// Un valor que coincide con el defecto no se escribe. Asi una URL sin filtros se
// queda limpia y se puede compartir sin ensuciar con defaults.

/** Longitud maxima de un valor de texto libre. Acota lo que llega por la URL. */
const MAX_TEXTO = 120;

/** Caracteres que se permiten en texto libre. Todo lo demas se descarta. */
const RE_TEXTO = /^[\p{L}\p{N}\s.,()'ÁÉÍÓÚÜÑáéíóúüñ%/+-]*$/u;

/** Separa valores multiples. La coma queda prohibida arriba, asi que no hay
 *  ambiguedad al volver a separar. */
const SEPARADOR = ",";

function esEntero(v) {
  return typeof v === "number" && Number.isInteger(v);
}

/**
 * Copia del defecto de una clave.
 *
 * Existe por una razón concreta. El defecto de un filtro multiple es una
 * matriz, y las vistas la usan como estado: hacen _filterSede.push("San
 * Pedro") sobre ella. Si normalizar() devolviera esa misma matriz, el push
 * cambiaría el defecto del esquema para siempre, y a partir de ahi el filtro
 * ya no se escribiría nunca en la URL, porque esDefecto() compararía el valor
 * contra un defecto que ya es el mismo valor y concluiría que no hay filtro
 * activo. El síntoma —un desplegable que filtra pero no cambia la barra de
 * direcciones— no señala ni a Filters.js ni a la vista, y por eso se evita
 * cediendo siempre una copia.
 */
function porDefecto(def) {
  return Array.isArray(def.valor) ? def.valor.slice() : def.valor;
}

/**
 * Normaliza y valida un valor contra la definicion de una clave.
 *
 * Lo que llega por la URL es entrada de usuario, aunque venga del propio sitio:
 * una URL se puede editar a mano, guardar y reenviar. Aqui se decide que se
 * acepta y que se sustituye por el defecto, de modo que el resto del programa
 * solo recibe valores que sabe manejar.
 */
function normalizar(def, bruto) {
  if (bruto === undefined || bruto === null) return porDefecto(def);

  if (def.numeros) {
    const n = parseInt(bruto, 10);
    if (!Number.isFinite(n)) return def.valor;
    const min = def.numeros.min !== undefined ? def.numeros.min : -Infinity;
    const max = def.numeros.max !== undefined ? def.numeros.max : Infinity;
    // Math.min/Math.max en vez de Comparisons: un Number.MAX_SAFE_INTEGER
    // negativo se traga la comparacion si se escribe al reves.
    return Math.max(min, Math.min(max, n));
  }

  if (def.multiple) {
    const partes = String(bruto).split(SEPARADOR);
    const fuera = [];
    for (const p of partes) {
      const v = p.trim();
      if (!v) continue;
      if (def.valores && !def.valores.includes(v)) continue;   // dominio fijo
      if (!def.valores && !RE_TEXTO.test(v)) continue;          // dominio abierto
      if (v.length > MAX_TEXTO) continue;
      if (!fuera.includes(v)) fuera.push(v);
    }
    return fuera;
  }

  const v = String(bruto).trim();

  if (def.valores) {
    // Un valor enumerado que no existe no es un error: se ignora. Asi una URL
    // antigua sigue funcionando aunque luego se retire un filtro.
    return def.valores.includes(v) ? v : porDefecto(def);
  }

  if (!RE_TEXTO.test(v) || v.length > MAX_TEXTO) return porDefecto(def);
  return v;
}

function aTexto(valor) {
  if (Array.isArray(valor)) return valor.join(SEPARADOR);
  if (valor === null || valor === undefined) return "";
  return String(valor);
}

function esDefecto(esquema, clave, valor) {
  const def = esquema[clave];
  if (!def) return true;
  const base = def.valor;
  if (Array.isArray(base)) {
    return Array.isArray(valor) && valor.length === base.length && valor.every((v, i) => v === base[i]);
  }
  return valor === base;
}

/**
 * Crea un controlador de estado de filtros para una pagina.
 *
 * @param {Object} esquema  Mapa clave -> descripcion. Cada descripcion admite:
 *      valor       (obligatorio) defecto, y tambien el tipo: string, number,
 *                          array o null.
 *      valores     lista cerrada de valores admitidos.
 *      multiple    true si la clave admite varios valores separados por coma.
 *      numeros     { min, max } para claves numericas acotadas.
 */
export function crear(esquema) {
  const claves = Object.keys(esquema);

  /** Lee el estado actual de la URL ya validado. */
  function leer() {
    const params = new URLSearchParams(window.location.search);
    const salida = {};
    for (const clave of claves) {
      salida[clave] = normalizar(esquema[clave], params.get(clave));
    }
    return salida;
  }

  /**
   * URL relativa completa (ruta + consulta + fragmento) con los cambios
   * aplicados. Es la unica funcion que decide como queda la barra de
   * direcciones; escribir(), anadir() y enlace() salen de aqui, de modo que
   * no pueden discrepar entre si.
   */
  function componer(cambios, hash) {
    const actual = leer();
    const siguiente = { ...actual, ...cambios };

    const params = new URLSearchParams(window.location.search);
    for (const clave of claves) {
      const valor = normalizar(esquema[clave], siguiente[clave]);
      if (esDefecto(esquema, clave, valor)) {
        params.delete(clave);
      } else {
        params.set(clave, aTexto(valor));
      }
    }

    const cadena = params.toString();
    const fragmento = hash !== undefined ? hash : window.location.hash;
    return window.location.pathname + (cadena ? "?" + cadena : "") + (fragmento || "");
  }

  /**
   * Escribe el estado con replaceState.
   *
   * @param {Object} cambios  Subconjunto de claves a cambiar.
   * @param {Object} [opciones]
   * @param {string} [opciones.hash]  Reemplazar tambien el fragmento.
   */
  function escribir(cambios, opciones) {
    if (!cambios || !Object.keys(cambios).length) return;

    const hash = (opciones && opciones.hash !== undefined)
      ? opciones.hash
      : window.location.hash;
    const completa = componer(cambios, hash);

    // Sin esta comprobacion, la vista se repinta y se toca el historial aunque
    // el valor no haya cambiado de verdad: pulsar "todas" dos veces, por ejemplo.
    const actual = window.location.pathname + window.location.search + window.location.hash;
    if (completa === actual) return;

    window.history.replaceState(null, "", completa);
  }

  /**
   * Escribe el estado con pushState y llama a repintar.
   *
   * Para pasos navegables de verdad. A diferencia de escribir(), aqui el
   * usuario quiere poder volver con el boton atras, y como pushState no
   * recarga, quien repinte es el que lo pide.
   */
  function anadir(cambios, alCambiar) {
    if (!cambios || !Object.keys(cambios).length) return;
    const url = componer(cambios);
    window.history.pushState(null, "", url);
    if (typeof alCambiar === "function") alCambiar(leer());
  }

  /** Quita todas las claves del esquema de la URL. */
  function limpiar() {
    const params = new URLSearchParams(window.location.search);
    for (const clave of claves) params.delete(clave);
    const cadena = params.toString();
    window.history.replaceState(
      null, "",
      window.location.pathname + (cadena ? "?" + cadena : "") + window.location.hash
    );
  }

  /** Cadena "?a=b&c=d" con los cambios, para incrustar en un enlace. */
  function enlace(cambios) {
    const completo = componer(cambios);
    const marca = completo.indexOf("?");
    return marca < 0 ? "" : completo.slice(marca);
  }

  return { leer, escribir, anadir, limpiar, enlace, claves };
}
