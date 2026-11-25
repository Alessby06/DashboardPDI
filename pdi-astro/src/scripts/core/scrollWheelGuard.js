const VENTANA_REBOTE_MS = 400;

/** Ignora pulsos inversos solo mientras Lenis sigue avanzando hacia abajo. */
export function crearFiltroReversaRueda() {
  let ultimoDeltaAbajo = -Infinity;

  return ({ deltaY, ahora, isScrolling, direction }) => {
    if (deltaY > 0) {
      ultimoDeltaAbajo = ahora;
      return false;
    }

    if (deltaY >= 0) return false;

    return ahora - ultimoDeltaAbajo < VENTANA_REBOTE_MS
      && isScrolling === 'smooth'
      && direction >= 0;
  };
}
