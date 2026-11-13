// ===========================================================================
//  FIRMA DE LA BITÁCORA
// ===========================================================================
//  La vista pinta la copia de sesión y, en paralelo, revalida contra el
//  servidor. Si los eventos no cambiaron, no hay nada que repintar: comparar
//  una firma barata evita reemplazar la tabla y reiniciar las cifras en cada
//  visita. La firma usa la longitud y los extremos porque la lista llega
//  ordenada por marca de tiempo descendente.
// ===========================================================================

/** Identifica el conjunto de eventos sin serializarlo entero. */
export function firmaBitacora(logs) {
  const lista = Array.isArray(logs) ? logs : [];
  const primero = lista[0] || {};
  const ultimo = lista[lista.length - 1] || {};
  return [
    lista.length,
    primero.id || "",
    primero.timestamp || "",
    ultimo.timestamp || "",
  ].join("|");
}

/** Verdadero si ambas listas representan la misma bitácora visible. */
export function mismaBitacora(actuales, nuevos) {
  return firmaBitacora(actuales) === firmaBitacora(nuevos);
}
