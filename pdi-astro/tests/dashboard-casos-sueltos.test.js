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

test('exportar usa el modal de descarga compartido antes de descargar', () => {
  assert.doesNotMatch(vista, /import \{ confirmar \}/);
  const iConfirmar = vista.indexOf('window.openModalExportGeneric({');
  const iDescarga = vista.indexOf('CsvExporter._descargar');
  assert.ok(iConfirmar > 0 && iDescarga > iConfirmar);
  assert.match(vista, /Descarga del Parte Diario/);
  assert.match(vista, /corte del .+ para /);
  assert.match(vista, /onConfirm: \(\) => this\.exportarParteDiario\(\)/);
  assert.doesNotMatch(vista, /ToastView\.mostrar/);
  assert.match(vista, /ToastView\.show\([^,]+,\s*"",\s*"warning"\)/);
});

test('el caret respeta movimiento reducido', () => {
  assert.match(cssSelect, /transition: transform var\(--dur-fast\) var\(--ease-out\)/);
  assert.match(cssSelect, /prefers-reduced-motion/);
});
