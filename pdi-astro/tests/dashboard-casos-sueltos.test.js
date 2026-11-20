import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');

const pagina = leer('src/pages/dashboard.astro');
const vista = leer('src/scripts/views/DashboardView.js');
const cssVista = leer('src/styles/views-dashboard.css');
const cssSelect = leer('src/styles/custom-select.css');

test('la sección de servicios usa nombres reales', () => {
  assert.match(pagina, /Servicios del programa/);
  assert.match(pagina, /Servicio Alimentario y Nutricional/);
  assert.match(pagina, /Servicio de Acompañamiento Educativo/);
  assert.match(pagina, /Servicio Social Pastoral \(ASP\)/);
  assert.doesNotMatch(pagina, /Tríada de servicios/);
});

test('la tarjeta de atención no lleva texto del sistema', () => {
  assert.match(pagina, /Requiere atención/);
  assert.match(vista, /Sin pendientes abiertos/);
  assert.doesNotMatch(pagina, /Se actualiza con la hidratación clínica/);
  assert.doesNotMatch(pagina, /Derivación y seguimiento clínico/);
});

test('las notas útiles se conservan', () => {
  assert.match(pagina, /Porcentajes calculados sobre niños tamizados/);
  assert.match(vista, /dashEduNota/);
});

test('exportar pasa por confirmar() antes de descargar', () => {
  assert.match(vista, /import \{ confirmar \} from '\.\.\/ui\/confirmacion\.js'/);
  const iConfirmar = vista.indexOf('confirmar({');
  const iDescarga = vista.indexOf('CsvExporter._descargar');
  assert.ok(iConfirmar > 0 && iDescarga > iConfirmar);
  assert.match(vista, /corte del .+ para /);
});

test('el caret respeta movimiento reducido', () => {
  assert.match(cssSelect, /transition: transform var\(--dur-fast\) var\(--ease-out\)/);
  assert.match(cssSelect, /prefers-reduced-motion/);
});
