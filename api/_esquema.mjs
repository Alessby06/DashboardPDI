// ===========================================================================
//  BANDERAS DE DESPLIEGUE: ESQUEMA Y ALCANCE
// ===========================================================================
//  El cliente decide con `PUBLIC_*` en tiempo de build; el servidor lo lee en
//  tiempo de ejecución. Si ambos valores no coinciden, la API y el navegador
//  consultan cosas distintas. Las variables sin prefijo permiten fijar el
//  valor del servidor sin depender del build.
// ===========================================================================

function bandera(env, nombre) {
  const crudo = env[nombre] ?? env[`PUBLIC_${nombre}`] ?? '0';
  return String(crudo).trim() === '1';
}

/** `true` si se usa usuario_id / usuario_vinculado. */
export function resolverEsquema(env = {}) {
  return bandera(env, 'ESQUEMA_USUARIO');
}

/** `true` si una cuenta sin sedes deja de tener alcance completo. */
export function resolverSedesObligatorias(env = {}) {
  return bandera(env, 'SEDES_OBLIGATORIAS');
}
