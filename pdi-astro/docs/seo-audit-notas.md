# Notas del informe SEO (2026-11-20)

Hallazgos que el escáner marca y que **no son accionables desde este repositorio**.

- **23 registros TXT DKIM vacíos**: pertenecen al dominio compartido `vercel.app`. No los configura esta app.
- **Comprobaciones de WordPress** (plugin SEO, plugin de seguridad, fuerza bruta, consentimiento, enumeración `?author=`): el sitio es Astro, no WordPress.
  - La fuerza bruta **sí está cubierta**: `api/_cuentaBase.mjs` bloquea tras 8 intentos y responde `429`.
  - `/?author=1` no enumera nada: `/` redirige a `/login` y no hay archivos de autor.
- **DNSSEC**: depende del proveedor de DNS, no del código.
- **Banner de cookies**: decidido como no aplicable para una app interna sin cookies de terceros.
- **Título corto**: decidido conservar; el informe lo cuenta dos veces y se deduplica en el seguimiento.

Lo que sí se corrigió: error `closest`, CSP sin `unsafe-inline` en scripts, sitemap, canonical, robots, OG, Twitter Card, JSON-LD, alt descriptivo, WebP y guardas en los listeners del login.
