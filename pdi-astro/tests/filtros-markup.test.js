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

test('Colaboradores expone rol e incluir inactivos', () => {
  const pagina = leer('src/pages/colaboradores.astro');
  assert.match(pagina, /menuId="menuColabRol"/);
  assert.match(pagina, /id="chkColabInactivos"/);
});

test('Padrón expone modalidad y seguro', () => {
  const pagina = leer('src/pages/padron.astro');
  assert.match(pagina, /menuId="menuPadronModalidad"/);
  assert.match(pagina, /menuId="menuPadronSeguro"/);
});

test('Salud expone el filtro de tamizaje', () => {
  const pagina = leer('src/pages/salud.astro');
  assert.match(pagina, /menuId="menuSaludTamizaje"/);
});

test('Padrón usa el menú de orden compartido', () => {
  const pagina = leer('src/pages/padron.astro');
  assert.match(pagina, /<SortMenu[^>]*id="PadronSort"/s);
});
