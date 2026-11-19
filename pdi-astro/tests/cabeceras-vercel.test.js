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
import { existsSync } from 'node:fs';
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

// Un segundo vercel.json dentro del subdirectorio no lo lee Vercel (el proyecto
// se construye desde la raíz), pero parece la configuración activa y hace
// perder horas: las reglas de caché estuvieron ahí sin aplicarse nunca.
test('no queda un vercel.json en el subdirectorio que Vercel no lee', () => {
  assert.equal(
    existsSync(fileURLToPath(new URL('../vercel.json', import.meta.url))),
    false,
    'pdi-astro/vercel.json no lo lee Vercel: las reglas van en el de la raíz',
  );
});

// El clic muerto medido en producción: dashboard -> padrón tardaba ~750 ms en
// llegar al intercambio y 336 ms eran el HTML del destino revalidándose (la
// respuesta era 304: Vercel ya lo tenía, el navegador preguntaba igual). Con
// stale-while-revalidate entrega su copia al instante y revalida en segundo
// plano, así que el viaje sale del camino crítico.
const FUENTE_HTML = '/((?!_astro|assets|fonts|api).*)';

test('el HTML de la aplicación se sirve al instante y revalida en segundo plano', () => {
  const c = cabecerasDe(FUENTE_HTML);
  // La ventana tiene que cubrir el `Age` que manda el borde de Vercel: con 60 s
  // el documento ya llegaba vencido (Age ~620) y el navegador revalidaba igual.
  assert.equal(c['cache-control'], 'public, max-age=0, stale-while-revalidate=86400');
});

test('la regla del HTML no cubre assets, fuentes ni la API', () => {
  const patron = new RegExp(`^${FUENTE_HTML}$`);
  for (const ruta of ['/padron', '/dashboard', '/expediente', '/salud', '/voluntariados']) {
    assert.ok(patron.test(ruta), `el HTML de ${ruta} debería cachearse`);
  }
  for (const ruta of [
    '/_astro/padron.CB2.js',
    '/assets/jg-icon.png',
    '/fonts/manrope-latin.woff2',
    '/api/beneficiarios',
  ]) {
    assert.equal(patron.test(ruta), false, `${ruta} no puede quedar con la caché del HTML`);
  }
});
