// ===========================================================================
//  EMISIÓN DE TOKENS DE SESIÓN PARA SURREALDB
// ===========================================================================
//  La contraseña de la base de datos NO sale del servidor. Este módulo la usa
//  para pedir a SurrealDB un token de sesión de corta duración y se lo
//  entrega al navegador, que se autentica con ese token en vez de con la
//  contraseña.
//
//  Se usa desde dos sitios, con el mismo archivo:
//    - api/pdi.mjs      -> Function de Vercel (producción)
//    - src/middleware.js -> servidor de Astro (desarrollo local)
//
//  Por eso no usa import.meta.env (que solo existe dentro del build de
//  Astro) sino que recibe las credenciales como argumentos: las lee quien lo
//  llama, de process.env en Vercel y de import.meta.env en el middleware.
//
//  El usuario de la base que se usa aquí es 'pdi_web', sin rol OWNER: puede
//  operar sobre las tablas del sistema y nada más. La cuenta de
//  administración ('pdi_app') no sale de este servidor en ningún momento.
// ===========================================================================

// La duración la fija el usuario de la base (DURATION FOR SESSION). Este valor
// es solo la referencia que el cliente usa para saber cuándo renovar.
export const DURACION_TOKEN_SEGUNDOS = 1800;

/** Convierte la URL de la base a su forma HTTP: el WebSocket es wss://. */
export function urlHttp(url) {
  return String(url || '')
    .trim()
    .replace(/^ws:/, 'http:')
    .replace(/^wss:/, 'https:')
    .replace(/\/+$/, '');
}

/**
 * Pide un token de sesión a SurrealDB con las credenciales del servidor.
 * Devuelve { token, exp } donde exp es la fecha de caducidad estimada.
 */
export async function emitirToken({ url, ns, db, user, pass }) {
  if (!url || !user || !pass) {
    throw new Error('Faltan credenciales de la base de datos en el servidor (SURREAL_URL / SURREAL_USER / SURREAL_PASS)');
  }
  const res = await fetch(urlHttp(url) + '/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ user, pass, ns, db }),
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new Error(
      'SurrealDB no acepto las credenciales del servidor (' + res.status + '): ' + detalle.slice(0, 160),
    );
  }
  const datos = await res.json();
  if (!datos || !datos.token) {
    throw new Error('SurrealDB no devolvio token de sesion');
  }
  return {
    token: datos.token,
    exp: Date.now() + DURACION_TOKEN_SEGUNDOS * 1000,
  };
}
