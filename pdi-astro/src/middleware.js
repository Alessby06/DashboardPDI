// ===========================================================================
//  MIDDLEWARE: EL PROXY DE TOKENS EN DESARROLLO LOCAL
// ===========================================================================
//  En producción, /api/pdi/token lo sirve la Function de Vercel (api/pdi.mjs).
//  En desarrollo local no hay Function: la sirve este middleware, con la misma
//  logica y las mismas variables de entorno.
//
//  La rama de desarrollo está detrás de import.meta.env.DEV, que en el build
//  vale false: el bloque entero se elimina y las credenciales nunca llegan al
//  bundle que se publica. El sitio es estatico, asi que en produccion este
//  middleware no se ejecuta en absoluto.
// ===========================================================================
import { emitirToken } from '../../api/_tokenBase.mjs';

export const onRequest = async (context, next) => {
  if (!import.meta.env.DEV) return next();

  const url = new URL(context.request.url);
  // La Function de Vercel (api/pdi.mjs) se sirve en /api/pdi. Se acepta
  // tambien /api/pdi/token por si alguien usa esa ruta.
  const rutaOk = url.pathname === '/api/pdi' || url.pathname === '/api/pdi/token';
  if (!rutaOk) return next();
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Se espera POST' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const token = await emitirToken({
      url: import.meta.env.SURREAL_URL || import.meta.env.PUBLIC_SURREAL_URL,
      ns: import.meta.env.SURREAL_NS || import.meta.env.PUBLIC_SURREAL_NS,
      db: import.meta.env.SURREAL_DB || import.meta.env.PUBLIC_SURREAL_DB,
      user: import.meta.env.SURREAL_USER,
      pass: import.meta.env.SURREAL_PASS,
    });
    return new Response(JSON.stringify(token), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[pdi/token] no se pudo emitir el token (dev):', err?.message || err);
    return new Response(
      JSON.stringify({
        error: 'El servidor no pudo conceder acceso a la base de datos.',
        detalle: String(err?.message || err),
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
