import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Un BOM UTF-8 al inicio de una hoja invalida su primera regla. En base.css
// esa regla era el reset `* { margin:0; box-sizing:border-box }`: el body
// recuperaba su margen de 8 px y aparecia una segunda barra lateral/doble
// scroll. La prueba evita que vuelva a colarse al guardar con PowerShell.
const DIRECTORIO = fileURLToPath(new URL('../src/styles/', import.meta.url));

test('las hojas de estilo no llevan BOM UTF-8', () => {
  const conBom = readdirSync(DIRECTORIO)
    .filter(nombre => nombre.endsWith('.css'))
    .filter(nombre => {
      const bytes = readFileSync(join(DIRECTORIO, nombre));
      return bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
    });

  assert.deepEqual(conBom, [], `Hojas con BOM: ${conBom.join(', ')}`);
});
