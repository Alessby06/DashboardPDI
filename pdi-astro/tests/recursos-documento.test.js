// `extraerRecursos` decide qué se adelanta de una ruta antes de navegar. Si se
// equivoca, el precargador o descarga de más (enlaces sueltos) o de menos (deja
// el CSS bloqueando el cambio de página).
import test from 'node:test';
import assert from 'node:assert/strict';
import { extraerRecursos } from '../src/scripts/core/recursosDocumento.js';

const BASE = 'https://pdi.example';

test('saca los módulos con src, sin importar el orden de los atributos', () => {
  const html = `
    <script type="module" src="/_astro/padron.CB2.js"></script>
    <script src="/_astro/otro.js" type="module" async></script>
  `;
  const { modulos } = extraerRecursos(html, BASE);
  assert.deepEqual(modulos, [
    'https://pdi.example/_astro/padron.CB2.js',
    'https://pdi.example/_astro/otro.js',
  ]);
});

test('ignora scripts inline y scripts que no son módulos', () => {
  const html = `
    <script>console.log("inline")</script>
    <script src="/js/clasico.js"></script>
    <script type="application/json">{"a":1}</script>
  `;
  assert.deepEqual(extraerRecursos(html, BASE).modulos, []);
});

test('saca las hojas de estilo, que son las que bloquean el intercambio', () => {
  const html = `
    <link rel="stylesheet" href="/_astro/padron.Bd4A.css">
    <link href="https://cdn.example/tema.css" rel="stylesheet">
  `;
  assert.deepEqual(extraerRecursos(html, BASE).estilos, [
    'https://pdi.example/_astro/padron.Bd4A.css',
    'https://cdn.example/tema.css',
  ]);
});

test('no confunde iconos ni precargas con hojas de estilo', () => {
  const html = `
    <link rel="icon" href="/assets/jg-icon.png">
    <link rel="preload" as="font" href="/fonts/manrope.woff2">
  `;
  assert.deepEqual(extraerRecursos(html, BASE).estilos, []);
});

test('no repite la misma URL dos veces', () => {
  const html = `
    <link rel="stylesheet" href="/_astro/a.css">
    <link rel="stylesheet" href="/_astro/a.css">
    <script type="module" src="/_astro/a.js"></script>
    <script type="module" src="/_astro/a.js"></script>
  `;
  const { modulos, estilos } = extraerRecursos(html, BASE);
  assert.deepEqual(modulos, ['https://pdi.example/_astro/a.js']);
  assert.deepEqual(estilos, ['https://pdi.example/_astro/a.css']);
});

test('sobrevive a un documento sin recursos o a algo que no es HTML', () => {
  assert.deepEqual(extraerRecursos('<p>hola</p>', BASE), { modulos: [], estilos: [] });
  assert.deepEqual(extraerRecursos(null, BASE), { modulos: [], estilos: [] });
});
