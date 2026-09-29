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
      target.classList.toggle('open');
    }
  },

  /** Alterna un .padron-inner-dropdown y cierra los de su misma familia. */
  alternarInterno(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const isCurrentlyOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.padron-inner-dropdown.open').forEach(d => {
      if (d !== dropdown) d.classList.remove('open');
    });
    dropdown.classList.toggle('open', !isCurrentlyOpen);
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.Dropdown = Dropdown;
}
