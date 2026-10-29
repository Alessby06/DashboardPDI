// ===========================================================================
//  Reintento de escrituras transitorias
// ===========================================================================
//  SurrealDB puede rechazar una escritura con "Transaction conflict: Resource
//  busy" cuando dos operaciones tocan el mismo registro a la vez. El propio
//  mensaje indica que la transacción se puede repetir. Este helper reintenta
//  solo esos casos, con espera exponencial y un poco de jitter para que dos
//  pestañas no vuelvan a chocar en el mismo instante.
//
//  Los errores que no son transitorios (campo inexistente, permisos, datos
//  inválidos) se propagan de inmediato: reintentarlos solo repetiría el fallo.
// ===========================================================================

/** ¿El error es un conflicto temporal que conviene reintentar? */
export function esConflictoTransitorio(error) {
  const mensaje = String(error?.message || error || "").toLowerCase();
  // Solo los conflictos que SurrealDB garantiza que no confirmaron la
  // transacción. Un timeout es ambiguo: el servidor pudo haber aplicado el
  // cambio y reintentar un `+=` lo duplicaría.
  return (
    mensaje.includes("transaction conflict") ||
    mensaje.includes("resource busy")
  );
}

/**
 * Ejecuta `fn` y la reintenta si falla por un conflicto transitorio.
 *
 * @template T
 * @param {() => Promise<T>} fn
 * @param {object} [opciones]
 * @param {number} [opciones.intentos]     Intentos totales (incluido el primero).
 * @param {number} [opciones.baseMs]       Espera base entre intentos.
 * @param {number} [opciones.maxMs]        Tope de la espera.
 * @param {(error: unknown) => boolean} [opciones.reintentable]
 * @returns {Promise<T>}
 */
export async function conReintentos(fn, {
  intentos = 3,
  baseMs = 120,
  maxMs = 1200,
  reintentable = esConflictoTransitorio,
} = {}) {
  const total = Math.max(1, Number(intentos) || 1);
  let ultimoError;

  for (let intento = 0; intento < total; intento += 1) {
    try {
      return await fn();
    } catch (error) {
      ultimoError = error;
      if (intento >= total - 1 || !reintentable(error)) throw error;
      const espera = Math.min(maxMs, baseMs * 2 ** intento);
      await new Promise((resolver) => {
        setTimeout(resolver, espera + Math.random() * baseMs);
      });
    }
  }

  throw ultimoError;
}
