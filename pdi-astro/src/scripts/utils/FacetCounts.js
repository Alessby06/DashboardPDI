// ===========================================================================
//  CONTADORES DE FACETA
// ===========================================================================
//  Las siete vistas comparten la misma lectura: "cuantas coincidencias quedan
//  si elijo esta opcion", calculada con los demas filtros y la busqueda ya
//  aplicados (nunca con la propia faceta, o el contador solo repetiria la
//  seleccion actual).
//
//  El marcado lo pone FilterField.astro: cada opcion lleva un
//  `<span id="${countPrefix}-${valor}">`. Aqui solo se rellena y se marca la
//  opcion como cero para que el panel la deshabilite.
// ===========================================================================

/**
 * Pinta una cifra en una opcion. En las opciones normales tambien enciende o
 * apaga `zero-facet`; la opcion "todos" no se deshabilita nunca.
 */
export function pintarContador(id, n) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = `(${n})`;
  const item = el.closest('.padron-dropdown-item');
  if (item && item.getAttribute('data-value') !== 'all') {
    item.classList.toggle('zero-facet', n === 0);
  }
}

/**
 * Recorre todas las opciones de un menu y cuenta con el predicado dado.
 *
 * @param {string} menuId   id del `.padron-inner-dropdown-menu`
 * @param {Array<unknown>} base  datos ya filtrados por busqueda y por el resto
 *                               de facetas
 * @param {(item: unknown, valor: string) => boolean} coincide
 */
export function contarOpciones(menuId, base, coincide) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  menu.querySelectorAll('.padron-dropdown-item').forEach((item) => {
    const valor = item.getAttribute('data-value');
    const contador = item.querySelector('.padron-item-count');
    if (!valor || !contador) return;
    const n = valor === 'all' ? base.length : base.filter((x) => coincide(x, valor)).length;
    pintarContador(contador.id, n);
  });
}
