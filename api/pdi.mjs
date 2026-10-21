// ===========================================================================
//  FUNCTION DE VERCEL: EMISIÓN DE TOKENS DE LA BASE DE DATOS
// ===========================================================================
//  Ruta: POST /api/pdi/token
//
//  Es la única puerta por la que el navegador obtiene acceso a SurrealDB.
//  Aquí viven las credenciales (variables de entorno SIN el prefijo PUBLIC_,
//  que Vercel no expone al cliente). El navegador recibe un token de sesión
//  de corta duración y se autentica con él contra la base.
//
//  Lo que el token NO puede hacer:
//    - el usuario de la base es 'pdi_web', sin rol OWNER: no puede tocar el
//      esquema, crear usuarios ni salir de esta base de datos;
//    - el token caduca a los 30 minutos y se renueva solo.
//
//  Formato de archivo .mjs porque la raíz del proyecto no tiene package.json
//  con "type": "module" y Vercel compila los .js como CommonJS.
// ===========================================================================
import { emitirToken, DURACION_TOKEN_SEGUNDOS } from './pdi-astro/src/scripts/server/tokenBase.mjs';

// El token se reutiliza un minuto: así un正常使用 de la app no golpea el
// signin en cada petición, y el token de todos modos caduca a los 30 min.
const TTL_CACHE_MS = 60 * 1000;

// Freno básico de abuso. La Function no tiene memoria compartida entre
// instancias, asi que esto acota por instancia: suficiente para que un
// script no se lleve el numero de tokens que quiera.
const MAX_PETICIONES_POR_HORA = 120;
const peticiones = new Map();

let cache = null;

function limiteAlcanzado(ip) {
  const ahora = Date.now();
  const hora = ahora - 3600 * 1000;
  const lista = (peticiones.get(ip) || []).filter((t) => t > hora);
  if (lista.length >= MAX_PETICIONES_POR_HORA) {
    peticiones.set(ip, lista);
    return true;
  }
  lista.push(ahora);
  peticiones.set(ip, lista);
  return false;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== '/api/pdi/token') {
      return Response.json({ error: 'Ruta no encontrada' }, { status: 404 });
    }
    if (request.method !== 'POST') {
      return Response.json({ error: 'Se espera POST' }, { status: 405 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida';
    if (limiteAlcanzado(ip)) {
      return Response.json(
        { error: 'Demasiadas peticiones de credenciales. Intenten de nuevo en un momento.' },
        { status: 429 },
      );
    }

    try {
      const ahora = Date.now();
      if (!cache || cache.exp <= ahora) {
        cache = await emitirToken({
          url: process.env.SURREAL_URL || process.env.PUBLIC_SURREAL_URL,
          ns: process.env.SURREAL_NS || process.env.PUBLIC_SURREAL_NS,
          db: process.env.SURREAL_DB || process.env.PUBLIC_SURREAL_DB,
          user: process.env.SURREAL_USER,
          pass: process.env.SURREAL_PASS,
        });
        cache.cacheadoHasta = ahora + TTL_CACHE_MS;
        console.log('[pdi/token] token emitido para', ip);
      }
      return Response.json({
        token: cache.token,
        exp: cache.exp,
        duracion: DURACION_TOKEN_SEGUNDOS,
      });
    } catch (err) {
      console.error('[pdi/token] no se pudo emitir el token:', err?.message || err);
      return Response.json(
        { error: 'El servidor no pudo conceder acceso a la base de datos.' },
        { status: 502 },
      );
    }
  },
};
