// ===========================================================================
//  ESQUEMA DE DATOS: PUENTE DE MIGRACIÓN
// ===========================================================================
//  El cliente decide con `PUBLIC_ESQUEMA_USUARIO` en tiempo de build; el
//  servidor lo lee en tiempo de ejecución. Si ambos valores no coinciden, la
//  API consultaría columnas que el navegador no usa. `ESQUEMA_USUARIO` (sin
//  prefijo PUBLIC_) permite fijar el valor del servidor sin depender del build.
// ===========================================================================

/** @returns {boolean} `true` si se usa usuario_id / usuario_vinculado. */
export function resolverEsquema(env = {}) {
  const crudo = env.ESQUEMA_USUARIO ?? env.PUBLIC_ESQUEMA_USUARIO ?? '0';
  return String(crudo).trim() === '1';
}
