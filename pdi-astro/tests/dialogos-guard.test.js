// Guardas de diálogos.
//
// Ningún flujo del producto abre alert(), confirm() ni prompt() nativos, y
// nadie depende de beforeunload. Todo pasa por el modal propio de
// ui/confirmacion.js, que conserva el lenguaje visual del sistema.
//
// El test ignora comentarios: los encabezados de los módulos explican qué
// sustituyen y mencionan los diálogos nativos sin usarlos.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..', 'src', 'scripts');

function archivosJs(dir, salida = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) archivosJs(ruta, salida);
    else if (entrada.name.endsWith('.js')) salida.push(ruta);
  }
  return salida;
}

function sinComentarios(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

test('ningún flujo abre diálogos nativos ni usa beforeunload', () => {
  const fallos = [];
  for (const ruta of archivosJs(RAIZ)) {
    const texto = sinComentarios(fs.readFileSync(ruta, 'utf8'));
    const nativo = /\b(alert|prompt|confirm)\s*\(/.test(texto);
    const salida = /\bbeforeunload\b/.test(texto);
    if (nativo || salida) fallos.push(path.relative(RAIZ, ruta));
  }
  assert.deepEqual(
    fallos,
    [],
    `Usa el modal de confirmación del sistema (src/scripts/ui/confirmacion.js):\n${fallos.join('\n')}`,
  );
});
