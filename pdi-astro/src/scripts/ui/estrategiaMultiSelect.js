// ===========================================================================
//  Control de seleccion multiple de la estrategia asignada
// ===========================================================================
//  Lo usan dos pantallas (la ficha de inscripcion y el expediente), asi que
//  vive en un solo archivo y expone una API corta:
//
//    setValues(id, valores)  pinta un estado guardado
//    getValues(id)          devuelve lo que el usuario marco
//    setDisabled(id, bool)  apaga y enciende el control
//
//  Las opciones son pisoras con casilla: se marca y se desmarca con un clic,
//  y se ve de un vistazo cuales estan elegidas.
// ===========================================================================

const controles = new Map();
const pendientes = new Map();

function itemsDe(control) {
  return Array.from(control.root.querySelectorAll(".estr-chip"));
}

function pintar(control) {
  // Sin transicion mientras se aplica el estado. Si la pisora se pinta
  // cuando el control todavia estaba oculto (el modal cerrado), la
  // transicion se congela y la pisora se queda con el color viejo: el
  // navegador no avanza una transicion sobre algo que no ve.
  const raiz = control.root;
  raiz.classList.add("estr-chips-sin-transicion");

  itemsDe(control).forEach((item) => {
    const marcado = control.seleccion.has(item.dataset.value);
    item.setAttribute("aria-checked", marcado ? "true" : "false");
    item.classList.toggle("active", marcado);
  });

  // El expediente oculta las pisoras hasta que recibe los valores reales.
  // Asi no aparece un selector vacio mientras la pagina hidrata.
  if (control.datosAplicados) raiz.dataset.listo = "1";
  else delete raiz.dataset.listo;

  // Un reflujo obliga al navegador a aplicar el color ya, sin animacion.
  void raiz.offsetWidth;
  raiz.classList.remove("estr-chips-sin-transicion");

  // Avisa a quien escuchte: la ficha usa esto para saber si ya puede guardar.
  control.root.dispatchEvent(new CustomEvent("pdi:estrategia-change", {
    bubbles: true,
    detail: { id: control.id, valores: Array.from(control.seleccion) },
  }));
}

function alternar(control, item) {
  if (control.deshabilitado) return;
  const valor = item?.dataset?.value;
  if (!valor) return;
  if (control.seleccion.has(valor)) control.seleccion.delete(valor);
  else control.seleccion.add(valor);
  pintar(control);
}

/** Conecta un control y lo deja listo para usarse. */
function conectar(root) {
  const id = root.id;
  if (!id) return;

  // Astro reemplaza el DOM en cada navegacion interna. El control anterior
  // queda huerfano con el mismo id; si se conserva, el nuevo nunca se conecta
  // y las estrategias aparecen vacias hasta recargar la pagina.
  const existente = controles.get(id);
  if (existente) {
    if (existente.root === root) return;
    controles.delete(id);
  }

  const control = {
    id,
    root,
    seleccion: new Set(),
    deshabilitado: root.dataset.disabled === "true",
    datosAplicados: false,
  };
  controles.set(id, control);

  root.addEventListener("click", (evento) => {
    const item = evento.target.closest(".estr-chip");
    if (!item || !root.contains(item)) return;
    evento.preventDefault();
    alternar(control, item);
  });

  if (pendientes.has(id)) {
    control.seleccion = new Set(pendientes.get(id));
    pendientes.delete(id);
    control.datosAplicados = true;
  } else {
    // La pre-hidratacion del expediente corre antes que este modulo y deja
    // las estrategias preparadas en una variable global.
    const preparado = typeof window !== "undefined" ? window.__pdiEstrategias?.[id] : null;
    if (Array.isArray(preparado)) {
      control.seleccion = new Set(preparado);
      control.datosAplicados = true;
    }
  }

  pintar(control);
  // El control puede nacer apagado (en el expediente solo se edita en modo
  // edicion), asi que el estado inicial se aplica igual que en el resto.
  if (control.deshabilitado) setDisabled(id, true);
}

/** Conecta todos los controles presentes en la pagina. */
export function initEstrategiaMultiSelect() {
  document.querySelectorAll("[data-estrategia-multiselect]").forEach(conectar);
}

/** Pinta las estrategias de un control (estado guardado o recien leido). */
export function setValues(id, valores) {
  const lista = (Array.isArray(valores) ? valores : [valores]).filter(Boolean);
  // El puente global es la red de seguridad cuando el control aún no existe:
  // la vista puede pintar antes de que se cargue este módulo.
  if (typeof window !== "undefined") {
    window.__pdiEstrategias = window.__pdiEstrategias || {};
    window.__pdiEstrategias[id] = lista;
  }
  const control = controles.get(id);
  if (!control) {
    pendientes.set(id, lista);
    return;
  }
  control.seleccion = new Set(lista);
  control.datosAplicados = true;
  pintar(control);
}

/** Devuelve las estrategias marcadas, en el orden en que se marcaron. */
export function getValues(id) {
  const control = controles.get(id);
  if (!control) return [];
  return Array.from(control.seleccion);
}

/** Enciende o apaga el control (lo usa el modo edicion del expediente). */
export function setDisabled(id, deshabilitado) {
  const control = controles.get(id);
  if (!control) return;
  control.deshabilitado = !!deshabilitado;
  control.root.classList.toggle("is-disabled", control.deshabilitado);
  itemsDe(control).forEach((item) => {
    item.disabled = control.deshabilitado;
  });
  pintar(control);
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.EstrategiaMultiSelect = { initEstrategiaMultiSelect, setValues, getValues, setDisabled };
}

// El ClientRouter reemplaza el marcado sin recargar el documento. Hay que
// reconectar los controles nuevos después de cada intercambio y al terminar
// la carga de la página; de lo contrario el expediente se queda con el
// control de la página anterior y muestra las estrategias vacías.
if (typeof document !== "undefined") {
  document.addEventListener("astro:after-swap", initEstrategiaMultiSelect);
  document.addEventListener("astro:page-load", initEstrategiaMultiSelect);
}
