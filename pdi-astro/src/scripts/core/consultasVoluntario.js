// ===========================================================================
//  Consultas de voluntariado que deben viajar en una sola escritura
// ===========================================================================
//  Registrar un taller y entregar una canasta toca el mismo registro de
//  `voluntario`. Si se lanzan dos UPDATE sin esperar, SurrealDB responde
//  "Transaction conflict: Resource busy" y una de las dos se pierde.
//
//  Esta función construye una sola sentencia con los cambios que realmente
//  se pidieron. Así el taller y la canasta se confirman juntos, o no se
//  confirma ninguno.
// ===========================================================================

/**
 * @param {object} opciones
 * @param {boolean} [opciones.conCanasta]  Sumar una canasta recibida.
 * @param {boolean} [opciones.conTematica] Agregar la temática del taller.
 * @returns {string} SurrealQL, o cadena vacía si no hay nada que cambiar.
 */
export function consultaCapacitacion({ conCanasta = false, conTematica = true } = {}) {
  const cambios = [];
  if (conTematica) cambios.push("capacitaciones += $tematica");
  if (conCanasta) cambios.push("canastas_recibidas += 1");
  if (!cambios.length) return "";
  return `UPDATE voluntario SET ${cambios.join(", ")} WHERE id = type::record($rid) RETURN AFTER;`;
}
