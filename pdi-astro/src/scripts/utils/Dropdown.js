// ===========================================================================
//  DESPLEGABLES GENERICOS
// ===========================================================================
//  Hay dos familias de desplegables en la aplicacion: los .custom-dropdown,
//  que son los filtros de casi todas las paginas, y los .padron-inner-dropdown,
//  que son los desplegables dentro de una celda del padron.
//
//  Los dos llevaba alternar su clase "open" DashboardView, de 53 KB, y como el
//  conmutador de la barra superior y los filtros de ocho paginas lo invocan
//  desde el marcado, el archivo de puentes arrastraba esa vista entera a las diez
//  paginas para ejecutar unas diez lineas. Aqui viven.
//
//  Cerrar al pulsar fuera ya no es cosa de este modulo: lo resuelve
//  legacy-globals con un unico escuchador en el documento, que en la MPA muere
//  con la pagina en lugar de acumularse como en la SPA.
// ===========================================================================

/** Ancho de la barra que el bloqueo de fondo retira (0 con barras superpuestas). */
function anchoBarra() {
  if (typeof window === 'undefined') return 0;
  return Math.max(
    0,
    window.innerWidth - document.documentElement.clientWidth,
    document.body.offsetWidth - document.body.clientWidth
  );
}

export const Dropdown = {
  /**
   * Alterna un .custom-dropdown y cierra los hermanos, sin tocar los anidados:
   * abrir un desplegable dentro de otro no debe cerrar al contenedor.
   */
  alternar(dropdownId) {
    const target = document.getElementById(dropdownId);
    const allDropdowns = document.querySelectorAll('.custom-dropdown');
    allDropdowns.forEach(d => {
      // No cerrar dropdowns anidados ni el contenedor padre si se esta abriendo un hijo
      if (d !== target && !d.contains(target) && !target?.contains(d)) {
        d.classList.remove('open');
      }
    });
    if (target) {
      const willOpen = !target.classList.contains('open');
      if (willOpen && target.classList.contains('audit-filters-dropdown')) {
        // El panel se muestra en el top layer antes de la clase .open para que
        // la transicion no se reinicie al moverlo de capa.
        window.PDI?.FilterPanel?.prepararApertura?.(target);
      }
      target.classList.toggle('open');
      if (target.classList.contains('audit-filters-dropdown')) {
        if (willOpen && typeof window !== 'undefined' && window.innerWidth <= 768) {
          // Se mide antes de bloquear: después la barra ya no está.
          document.documentElement.style.setProperty('--pdi-scrollbar-lock', `${anchoBarra()}px`);
          document.body.classList.add('filter-sheet-open');
        } else {
          document.body.classList.remove('filter-sheet-open');
          document.documentElement.style.removeProperty('--pdi-scrollbar-lock');
        }
      }
    }
  },

  /** Cierra todas las hojas y dropdowns de filtros abiertos, restaurando el scroll del body */
  cerrarHojasFiltro() {
    document.querySelectorAll('.custom-dropdown.open, .audit-filters-dropdown.open').forEach(d => {
      d.classList.remove('open');
    });
    // El cierre por arrastre puede dejar el disparador marcado como abierto y
    // los estilos del gesto en linea; se limpian siempre, venga de donde venga.
    document.querySelectorAll('.audit-filter-btn[aria-expanded="true"]').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.audit-filters-dropdown').forEach(d => {
      d.style.removeProperty('--filtro-velo');
      d.querySelectorAll('.audit-filters-menu').forEach(m => {
        m.style.removeProperty('transform');
        m.style.removeProperty('transition');
        m.style.removeProperty('will-change');
      });
    });
    if (typeof document !== 'undefined') {
      document.body.classList.remove('filter-sheet-open');
      document.documentElement.style.removeProperty('--pdi-scrollbar-lock');
    }
  },

  /** Alterna un .padron-inner-dropdown y cierra los de su misma familia. */
  alternarInterno(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const isCurrentlyOpen = dropdown.classList.contains('open');
    const abrir = !isCurrentlyOpen;
    document.querySelectorAll('.padron-inner-dropdown.open').forEach(d => {
      if (d !== dropdown) d.classList.remove('open');
    });
    dropdown.classList.toggle('open', abrir);
    // En el panel las facetas ya no flotan: crecen dentro del cuerpo. El
    // desplazamiento espera a que la altura termine (190 ms) y se hace suave;
    // en el mismo clic se sentia como un tiron. Con movimiento reducido no se
    // mueve el contexto: el usuario conserva su posicion.
    if (abrir && dropdown.closest('.audit-filters-menu')) {
      const reducir = typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!reducir) {
        const lista = dropdown.querySelector('.padron-inner-dropdown-menu');
        window.setTimeout(() => {
          if (!dropdown.classList.contains('open') || !lista?.isConnected) return;
          lista.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 190);
      }
    }
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.Dropdown = Dropdown;
}
