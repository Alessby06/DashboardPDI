// ===========================================================================
//  MODO DE SCROLL - Regla pura
// ===========================================================================
//  Decide si una visita debe usar scroll nativo o Lenis. Vive aparte de
//  ScrollManager para poder probarla sin cargar Lenis ni tocar el DOM.
//
//  Criterio acordado:
//   - Puntero no fino (teléfono/tablet) -> nativo.
//   - Ventana de 900 px o menos -> nativo, aunque el puntero sea fino.
//   - El opt-in explícito devuelve Lenis en cualquier caso.
// ===========================================================================

/** Mismo corte que el cajón del menú lateral. */
export const ANCHO_SCROLL_NATIVO = 900;

/**
 * @param {object} opciones
 * @param {boolean} opciones.punteroFino  `(hover: hover) and (pointer: fine)`.
 * @param {number}  opciones.ancho        Ancho del viewport en píxeles.
 * @param {boolean} opciones.optIn        `?smoothTouch=1`, atributo o localStorage.
 * @returns {boolean} true si debe usarse scroll nativo.
 */
export function esScrollNativo({ punteroFino, ancho, optIn }) {
  if (optIn) return false;
  return !punteroFino || ancho <= ANCHO_SCROLL_NATIVO;
}
