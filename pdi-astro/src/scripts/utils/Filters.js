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
//               ejemplo. Ademas obliga a repintar, porque pushState no recarga,
//               y el repintado se queda activo para la vuelta con el boton
//               atras. Es simetrico a proposito: un paso que se puede deshacer
//               tiene que poder deshacerse en pantalla, no solo en la barra de
//               direcciones.
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
   *
   * @param {Object} cambios    Claves del esquema a cambiar.
   * @param {string} [hash]     Fragmento con el que cerrar la URL.
   * @param {string[]} [quitar] Claves que hay que borrar y que no son del
   *   esquema. Se usan para deshacer un alias con el que se ha llegado: el
   *   expediente acepta "?codigo=" y "?id=", y al resolver el primero hay que
   *   quitarlo, no basta con escribir el segundo al lado. Si las dos se
   *   quedaran, la direccion que se comparte seria "?codigo=X&id=3", y bastaria
   *   con que alguien la editara para dejar ambas en contradiccion sin que nada
   *   avise de ello.
   */
  function componer(cambios, hash, quitar) {
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
    for (const clave of quitar || []) params.delete(clave);

    const cadena = params.toString();
    const fragmento = hash !== undefined ? hash : window.location.hash;
    return window.location.pathname + (cadena ? "?" + cadena : "") + (fragmento || "");
  }

  /**
   * Escribe el estado con replaceState.
   *
   * @param {Object} cambios  Subconjunto de claves a cambiar.
   * @param {Object} [opciones]
   * @param {string} [opciones.hash]    Reemplazar tambien el fragmento.
   * @param {string[]} [opciones.quitar] Claves ajenas al esquema a borrar.
   */
  function escribir(cambios, opciones) {
    const quitar = (opciones && opciones.quitar) || [];
    const hayCambios = cambios && Object.keys(cambios).length;
    // Tambien se escribe cuando no hay cambios de esquema pero si claves que
    // quitar: canonizar "?codigo=X" a "?id=3" no cambia ninguna clave, solo
    // se lleva por delante el alias.
    if (!hayCambios && !quitar.length) return;

    const hash = (opciones && opciones.hash !== undefined)
      ? opciones.hash
      : window.location.hash;
    const completa = componer(cambios, hash, quitar);

    // Sin esta comprobacion, la vista se repinta y se toca el historial aunque
    // el valor no haya cambiado de verdad: pulsar "todas" dos veces, por ejemplo.
    const actual = window.location.pathname + window.location.search + window.location.hash;
    if (completa === actual) return;

    window.history.replaceState(null, "", completa);
  }

  /**
   * Callbacks de repintado de los pasos anadidos con pushState.
   *
   * Vive en el cierre de crear(), no en el ambito del modulo, para que no se
   * pueda tocar desde fuera.
   */
  const alRetroceder = [];

  function repintarTrasRetroceso() {
    const estado = leer();
    for (const fn of alRetroceder.slice()) {
      try {
        fn(estado);
      } catch (e) {
        // Un repintado que falla no puede impedir que los demas se repinten: el
        // usuario ya ha pulsado atras y espera ver lo anterior.
        console.error("Filters: fallo al repintar tras un paso de historial", e);
      }
    }
  }

  /**
   * Escribe el estado con pushState y llama a repintar.
   *
   * Para pasos navegables de verdad. A diferencia de escribir(), aqui el
   * usuario quiere poder volver con el boton atras, y como pushState no
   * recarga, quien repinte es el que lo pide.
   *
   * El mismo repintado se queda activo para la vuelta. PushState crea la entrada
   * y avanza, pero no hace nada con el boton atras: cuando el usuario retrocede,
   * el navegador restaura la URL y dispara popstate sin recargar, y si nadie
   * escucha, la barra de direcciones anuncia un expediente y la pantalla sigue
   * mostrando otro. Se vio en el expediente: tras pulsar Siguiente dos veces y
   * luego Atras, la URL volvia a ?id=2 con la ficha de ?id=3 en pantalla.
   *
   * El oyente se registra una sola vez por ventana, la primera vez que alguien
   * anade un paso, y repinta con todos los callbacks registrados. Registrar uno
   * por llamada habria dejado oyentes acumulados. La guarda mira que ventana es
   * y no un booleano: en el navegador hay una sola, asi que equivale, pero si
   * algun dia el modulo se carga con otra ventana (las pruebas hacen eso) sigue
   * registrandolo donde toca en vez de darlo por hecho.
   */
  let ventanaConOyente = null;

  function anadir(cambios, alCambiar) {
    if (!cambios || !Object.keys(cambios).length) return;
    const url = componer(cambios);
    window.history.pushState(null, "", url);
    if (typeof alCambiar !== "function") return;

    if (ventanaConOyente !== window) {
      ventanaConOyente = window;
      window.addEventListener("popstate", repintarTrasRetroceso);
    }
    if (!alRetroceder.includes(alCambiar)) {
      alRetroceder.push(alCambiar);
    }
    alCambiar(leer());
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
