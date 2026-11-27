import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.join(import.meta.dirname, '..');
const leer = (ruta) => fs.readFileSync(path.join(RAIZ, ruta), 'utf8');

test('Social expone orden, rango de fechas y DNI en el buscador', () => {
  const pagina = leer('src/pages/social.astro');
  assert.match(pagina, /<SortMenu[^>]*id="SocialSort"/s);
  assert.match(pagina, /id="socialFechaDesde"/);
  assert.match(pagina, /id="socialFechaHasta"/);
  assert.match(pagina, /DNI/);
});
