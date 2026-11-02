// Controlador único de los menús de orden de las tablas. Cada vista lo
// inicializa una vez y le pasa su callback; el componente SortMenu.astro solo
// dibuja la estructura. Así el teclado, el aria y el cierre por clic fuera no
// se copian seis veces.
const controles = new Map();

export function initSortMenu({ id, onSelect }) {
  if (!id || typeof document === "undefined") return null;

  const dropdown = document.getElementById(`dropdown${id}`);
  const boton = document.getElementById(`btn${id}`);
  const menu = document.getElementById(`menu${id}`);
  const etiqueta = document.getElementById(`${id}Value`);
  if (!dropdown || !boton || !menu) return null;

  // La navegación cliente puede reemplazar el DOM: si el nodo cambió, se
  // vuelve a enlazar en vez de devolver un control con referencias muertas.
  const previo = controles.get(id);
  if (previo?.dropdown === dropdown) return previo;

  const opciones = () => [...menu.querySelectorAll('[role="option"]')];

  const sync = (valor) => {
    let texto = "";
    opciones().forEach((opcion) => {
      const activa = opcion.dataset.sortValue === valor;
      opcion.setAttribute("aria-selected", activa ? "true" : "false");
      if (activa) texto = opcion.textContent.trim();
    });
    if (etiqueta && texto) etiqueta.textContent = texto;
  };

  const cerrar = (devolverFoco = false) => {
    dropdown.classList.remove("open");
    boton.setAttribute("aria-expanded", "false");
    if (devolverFoco) boton.focus();
  };

  const abrir = () => {
    dropdown.classList.add("open");
    boton.setAttribute("aria-expanded", "true");
    const activa = opciones().find((opcion) => opcion.getAttribute("aria-selected") === "true")
      || opciones()[0];
    activa?.focus();
  };

  boton.addEventListener("click", () => {
    if (dropdown.classList.contains("open")) cerrar(false);
    else abrir();
  });

  boton.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowDown" || evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      abrir();
    }
  });

  menu.addEventListener("click", (evento) => {
    const opcion = evento.target.closest("[data-sort-value]");
    if (!opcion) return;
    onSelect?.(opcion.dataset.sortValue);
    cerrar(true);
  });

  menu.addEventListener("keydown", (evento) => {
    const lista = opciones();
    const indice = lista.indexOf(document.activeElement);
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      lista[Math.min(indice + 1, lista.length - 1)]?.focus();
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      lista[Math.max(indice - 1, 0)]?.focus();
    } else if (evento.key === "Home") {
      evento.preventDefault();
      lista[0]?.focus();
    } else if (evento.key === "End") {
      evento.preventDefault();
      lista[lista.length - 1]?.focus();
    } else if (evento.key === "Escape") {
      evento.preventDefault();
      cerrar(true);
    }
  });

  document.addEventListener("click", (evento) => {
    if (!dropdown.contains(evento.target)) cerrar(false);
  });

  const control = { sync, cerrar, dropdown };
  controles.set(id, control);
  return control;
}
