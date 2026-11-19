// Una prueba de píxeles no serviría: durante la transición lo que se ve es la
// instantánea que pinta la View Transition, no el DOM. Pero la causa sí es una
// decisión de configuración, y esa se puede fijar aquí.
//
// Si la familia se sirve con `font-display: swap`, la captura de la sección
// entrante se hace con la fuente aún "en carga" y el texto aparece con la de
// respaldo durante toda la animación. Se ve otra tipografía al entrar.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

test('la tipografía no se pinta con la fuente de respaldo al entrar a una sección', () => {
  const css = leer('src/styles/fonts.css');
  const familia = css.match(/@font-face\s*\{[^}]*\}/)?.[0] || '';

  assert.match(familia, /font-family:\s*["']Manrope["']/, 'fonts.css ya no declara Manrope');
  assert.doesNotMatch(
    familia,
    /font-display:\s*swap/,
    'font-display: swap hace que la instantánea de la View Transition entre con la fuente de respaldo',
  );
  assert.match(
    familia,
    /font-display:\s*block/,
    'con block la captura espera la fuente; cualquier otro valor devuelve el parpadeo',
  );
});

test('la fuente se precarga para que el block no deje el texto en blanco', () => {
  const layout = leer('src/layouts/AppLayout.astro');
  assert.match(
    layout,
    /rel="preload"[^>]*href="\/fonts\/manrope-latin\.woff2"[^>]*as="font"/,
    'sin la precarga en AppLayout, font-display: block retrasa el texto hasta descargar el WOFF2',
  );
});

test('la fuente tiene un solo origen y no viaja a terceros', () => {
  const css = leer('src/styles/fonts.css');
  assert.doesNotMatch(css, /https?:\/\/(?!localhost)/, 'fonts.css volvió a apuntar a un origen externo');
  assert.match(css, /src:\s*url\("\/fonts\/manrope-latin\.woff2"\)/, 'cambió la ruta del WOFF2');
});
