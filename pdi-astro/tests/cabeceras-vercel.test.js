// Las cabeceras de caché de los assets tienen que vivir en el vercel.json de la
// raíz: es el único que Vercel lee (buildCommand y outputDirectory están ahí).
// pdi-astro/vercel.json declaraba `immutable` para /_astro/*, pero producción
// respondía `max-age=0, must-revalidate` para /assets/jg-icon.png y para los
// chunks: esa regla nunca se aplicó.
//
// Sin caché de un año, cada navegación revalida los módulos de la página y el
// prefetch de Astro falla en Firefox y Safari (necesita cabeceras de caché).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = new URL('../../vercel.json', import.meta.url);
const config = JSON.parse(readFileSync(fileURLToPath(RAIZ), 'utf8'));

/** Cabeceras declaradas para una fuente, ya normalizadas a un objeto. */
function cabecerasDe(source) {
  const regla = (config.headers || []).find((h) => h.source === source);
  assert.ok(regla, `falta la regla de cabeceras para ${source} en el vercel.json de la raíz`);
  return Object.fromEntries(regla.headers.map((h) => [h.key.toLowerCase(), h.value]));
}

test('los chunks de /_astro se cachean como inmutables', () => {
  const c = cabecerasDe('/_astro/(.*)');
  assert.equal(c['cache-control'], 'public, max-age=31536000, immutable');
});

test('los archivos de /assets no se revalidan en cada visita', () => {
  const c = cabecerasDe('/assets/(.*)');
  assert.match(c['cache-control'], /max-age=\d+/);
  assert.ok(
    Number(c['cache-control'].match(/max-age=(\d+)/)[1]) >= 86400,
    `max-age demasiado bajo: ${c['cache-control']}`,
  );
});

test('las cabeceras de seguridad se conservan en la regla general', () => {
  const c = cabecerasDe('/(.*)');
  assert.match(c['content-security-policy'], /default-src 'self'/);
  assert.equal(c['x-content-type-options'], 'nosniff');
  assert.equal(c['x-frame-options'], 'DENY');
});
