// Foco al cerrar modales.
// El foco debe salir del modal ANTES de aplicar `inert`/`aria-hidden`; si no,
// Chrome avisa y deja el foco atrapado en un subárbol oculto.

/** Elige el primero de los candidatos que esté visible y no sea inerte. */
export function elegirReenganche(candidatos) {
  return candidatos.find((elemento) => (
    elemento
    && elemento.getClientRects?.().length > 0
    && !elemento.closest?.('[inert]')
  )) || null;
}

/**
 * Enfoca `destino` con `preventScroll` y, si el foco anterior seguía dentro
 * del modal, lo blurea. Devuelve si el destino estaba conectado.
 * `doc` se pasa como argumento para poder probar la conducta sin DOM.
 */
export function moverFocoFueraDeModal(doc, modal, destino) {
  const anterior = doc.activeElement;
  const conectado = Boolean(destino && doc.contains?.(destino));
  // Conectado no basta: un destino oculto o inerte hace que focus() no opere
  // sin lanzar, y el foco acabaría en BODY tras blurear el modal.
  const enfocable = conectado ? elegirReenganche([destino]) : null;

  if (enfocable && typeof enfocable.focus === 'function') {
    try { enfocable.focus({ preventScroll: true }); } catch {}
  }
  if (anterior && modal?.contains?.(anterior) && typeof anterior.blur === 'function') {
    try { anterior.blur(); } catch {}
  }
  return conectado;
}
