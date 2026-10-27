// ===========================================================================
//  ESTADO DE FILTROS
// ===========================================================================
//  Una sola implementacion del estado de seleccion para todas las vistas.
//
//  Antes cada vista guardaba sus filtros a mano: un array por faceta multiple,
//  un string por faceta simple, y en cada toggle repetia la misma regla de
//  "si marco todas las opciones, vuelvo a Todas". Nueve copias de esa regla en
//  siete archivos, con comportamientos que ya habian divergido.
//
//  El store no sabe de DOM ni de URL: recibe la definicion de las facetas y
//  devuelve valores ya normalizados. Quien lo usa solo pregunta y escucha.
//
//    const store = crearStore({
//      sede:    { tipo: 'multi',  opciones: ['Comas', 'Carabayllo'], defecto: [] },
//      estado:  { tipo: 'single', opciones: ['all', 'Activo', 'Inactivo'], defecto: 'all' },
//    });
//
//    store.alternar('sede', 'Comas');   // ['Comas']
//    store.alternar('sede', 'Carabayllo'); // [] (todas las opciones = Todas)
//    store.fijar('estado', 'Activo');
//    store.activos();  // [{ clave: 'estado', valor: 'Activo' }]
// ===========================================================================

/**
 * @param {Object} facetas  clave -> { tipo: 'multi'|'single', opciones, defecto }
 * @param {Object} [inicial] Valores de arranque (por ejemplo, los de la URL).
 */
export function crearStore(facetas, inicial = {}) {
  const oyentes = new Set();

  /** Deja el valor en una forma valida para su faceta. */
  function normalizar(def, bruto) {
    if (def.tipo === "multi") {
      // Dominio abierto (p. ej. roles que salen de los datos): se acepta
      // cualquier valor razonable, sin regla de "todas las opciones".
      if (!def.opciones || def.opciones.length === 0) {
        const lista = (Array.isArray(bruto) ? bruto : bruto == null ? [] : [bruto])
          .map((v) => String(v).trim())
          .filter((v) => v && v.length <= 60);
        return [...new Set(lista)];
      }
      const opciones = def.opciones.filter((v) => v !== "all");
      const lista = Array.isArray(bruto) ? bruto : bruto == null ? [] : [bruto];
      const unicos = [...new Set(lista.filter((v) => opciones.includes(v)))];
      // Marcar todas las opciones equivale a no filtrar.
      return unicos.length === opciones.length ? [] : unicos;
    }
    if (!def.opciones || def.opciones.length === 0) {
      const valor = String(bruto ?? "").trim();
      return valor && valor.length <= 60 ? valor : def.defecto;
    }
    return def.opciones.includes(bruto) ? bruto : def.defecto;
  }

  const estado = {};
  for (const [clave, def] of Object.entries(facetas)) {
    estado[clave] = normalizar(def, inicial[clave] ?? def.defecto);
  }

  const instantanea = () => JSON.parse(JSON.stringify(estado));

  function avisar() {
    for (const fn of oyentes) {
      try {
        fn(instantanea());
      } catch (e) {
        // Un oyente roto no puede impedir que los demas se enteren.
        console.error("FilterStore: fallo un oyente", e);
      }
    }
  }

  /** Marca o desmarca una opcion. En simple, fija el valor. */
  function alternar(clave, valor) {
    const def = facetas[clave];
    if (!def) return;
    if (def.tipo === "multi") {
      if (valor === "all") {
        estado[clave] = [];
      } else {
        const actual = new Set(estado[clave]);
        if (actual.has(valor)) actual.delete(valor);
        else actual.add(valor);
        estado[clave] = normalizar(def, [...actual]);
      }
    } else {
      estado[clave] = normalizar(def, valor);
    }
    avisar();
  }

  /** Fija un valor sin alternarlo (faceta simple o seleccion programatica). */
  function fijar(clave, valor) {
    const def = facetas[clave];
    if (!def) return;
    if (def.tipo === "multi") {
      estado[clave] = valor === "all" ? [] : normalizar(def, valor);
    } else {
      estado[clave] = normalizar(def, valor);
    }
    avisar();
  }

  /** Vuelve a los valores por defecto. */
  function limpiar() {
    for (const [clave, def] of Object.entries(facetas)) {
      estado[clave] = def.tipo === "multi" ? [] : def.defecto;
    }
    avisar();
  }

  /** Carga un conjunto de valores (URL, estado guardado). */
  function cargar(valores) {
    for (const [clave, def] of Object.entries(facetas)) {
      if (!(clave in valores)) continue;
      estado[clave] = normalizar(def, valores[clave]);
    }
    avisar();
  }

  /** Facetas que no estan en su valor por defecto. */
  function activos() {
    const lista = [];
    for (const [clave, def] of Object.entries(facetas)) {
      const valor = estado[clave];
      const enDefecto = def.tipo === "multi" ? valor.length === 0 : valor === def.defecto;
      if (!enDefecto) lista.push({ clave, valor });
    }
    return lista;
  }

  /** Cuenta para el badge: cada opcion marcada suma uno. */
  function contarActivos() {
    return activos().reduce(
      (total, f) => total + (Array.isArray(f.valor) ? f.valor.length : 1),
      0
    );
  }

  function suscribir(fn) {
    oyentes.add(fn);
    return () => oyentes.delete(fn);
  }

  return {
    valor: (clave) => estado[clave],
    instantanea,
    alternar,
    fijar,
    limpiar,
    cargar,
    activos,
    contarActivos,
    suscribir,
    facetas,
  };
}
