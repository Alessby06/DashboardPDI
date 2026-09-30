// ===========================================================================
//  QUE VARIANTE DE TABLA SE PINTA
// ===========================================================================
//  Cada pagina con tabla tiene dos representaciones del mismo dato: la tabla de
//  escritorio, dentro de .desktop-table-view, y la lista de tarjetas para
//  movil, dentro de .mobile-accordion-list. El corte esta en components.css,
//  en una consulta de medios a 768 px.
//
//  Las dos se pintaban siempre, visible la que fuese. En el padron la version
//  movil que nadie ve ocupaba 546 de los 1794 nodos del documento, el 30 %, y
//  50 KB de marcado, y se volvia a generar en cada pulsacion del buscador. En
//  las demas paginas pasaba lo mismo: entre 240 y 525 nodos, de 12 a 50 KB.
//
//  Aqui solo se decide cual de las dos toca, y se avisa cuando el navegador
//  cambia de lado para que la vista se repinte. El corte se lee de una
//  consulta de medios, no de window.innerWidth, porque el ancho de la ventana
//  incluye la barra lateral y el margen, y no coincide con el ancho que aplica
//  el CSS.
// ===========================================================================

export const Responsive = {
  /** El mismo corte que la consulta de medios de components.css. */
  ANCHO_MAX_MOVIL: 768,

  _consulta() {
    return window.matchMedia(`(max-width: ${Responsive.ANCHO_MAX_MOVIL}px)`);
  },

  /** true si en este momento se ve la lista de tarjetas en vez de la tabla. */
  esMovil() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return this._consulta().matches;
  },

  /**
   * Avisa de los cruces del corte, no de cada redimension. Recibe true cuando
   * se pasa a movil y false cuando se vuelve a escritorio, que es justo lo que
   * la vista necesita para saber que hay que repintar.
   *
   * Devuelve la funcion para darse de baja, por si la vista quiere desmontar.
   */
  alCambiarDeVariante(alCambiar) {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const consulta = this._consulta();
    const manejar = (e) => alCambiar(e.matches);
    if (consulta.addEventListener) {
      consulta.addEventListener('change', manejar);
      return () => consulta.removeEventListener('change', manejar);
    }
    // Navegadores antiguos: addListener, y sin forma de quitarlo.
    if (consulta.addListener) consulta.addListener(manejar);
    return () => {};
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.Responsive = Responsive;
}
