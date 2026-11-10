// Guardas del contrato de movimiento.
//
// Reglas que este test protege:
//  1. Todo `:hover` con efecto visual vive dentro de
//     `@media (hover: hover) and (pointer: fine)`. En táctil el navegador deja
//     el hover pegado tras el toque y el control queda como pulsado.
//  2. Ninguna regla usa `transition: all`: anima propiedades de layout sin
//     querer y saca el trabajo del compositor.
//
// El recorrido es deliberadamente simple: sigue llaves, ignora comentarios y
// arrastra la condición de los @media que envuelven cada regla.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ESTILOS = path.join(AQUI, '..', 'src', 'styles');

const VISUAL = /(^|;)\s*(background|border|color|box-shadow|transform|translate|scale|opacity|filter|text-decoration|outline|fill|stroke|backdrop-filter)\b/i;

function archivosCss() {
  return fs.readdirSync(ESTILOS).filter((f) => f.endsWith('.css')).sort();
}

/** Devuelve las reglas con su selector, cuerpo y la cadena de @media. */
function reglasDe(css) {
  const reglas = [];
  let i = 0;
  let buffer = '';
  let inicioPreludio = 0;
  const pila = [];

  while (i < css.length) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const fin = css.indexOf('*/', i + 2);
      i = fin < 0 ? css.length : fin + 2;
      continue;
    }
    if (ch === '{') {
      const preludio = buffer.trim();
      pila.push({ preludio, inicioCuerpo: i + 1, esAt: preludio.startsWith('@') });
      if (/^@(-webkit-)?keyframes/i.test(preludio)) {
        let profundidad = 1;
        let j = i + 1;
        while (j < css.length && profundidad > 0) {
          if (css[j] === '{') profundidad++;
          else if (css[j] === '}') profundidad--;
          j++;
        }
        i = j;
        pila.pop();
        buffer = '';
        inicioPreludio = j;
        continue;
      }
      i++;
      buffer = '';
      inicioPreludio = i;
      continue;
    }
    if (ch === '}') {
      const abierta = pila.pop();
      if (abierta && !abierta.esAt) {
        reglas.push({
          selector: abierta.preludio.replace(/\s+/g, ' ').trim(),
          cuerpo: css.slice(abierta.inicioCuerpo, i),
          media: pila.filter((p) => p.esAt).map((p) => p.preludio).join(' && '),
        });
      }
      i++;
      buffer = '';
      inicioPreludio = i;
      continue;
    }
    if (ch === ';' && pila.length === 0) {
      buffer = '';
      i++;
      inicioPreludio = i;
      continue;
    }
    buffer += ch;
    i++;
  }
  return reglas;
}

test('todo :hover visual está guardado para puntero fino', () => {
  const fallos = [];
  for (const archivo of archivosCss()) {
    const css = fs.readFileSync(path.join(ESTILOS, archivo), 'utf8');
    for (const regla of reglasDe(css)) {
      if (!/:hover/.test(regla.selector)) continue;
      if (/hover:\s*hover/i.test(regla.media)) continue;
      if (!VISUAL.test(regla.cuerpo)) continue;
      fallos.push(`${archivo}: ${regla.selector.slice(0, 110)}`);
    }
  }
  assert.deepEqual(fallos, [], `Hover sin guarda (${fallos.length}). Envolver en "@media (hover: hover) and (pointer: fine)":\n${fallos.join('\n')}`);
});

test('ninguna regla usa transition: all', () => {
  const fallos = [];
  for (const archivo of archivosCss()) {
    const css = fs.readFileSync(path.join(ESTILOS, archivo), 'utf8');
    for (const regla of reglasDe(css)) {
      if (/transition(?:-property)?\s*:\s*all\b/i.test(regla.cuerpo)) {
        fallos.push(`${archivo}: ${regla.selector.slice(0, 110)}`);
      }
    }
  }
  assert.deepEqual(fallos, [], `transition: all encontrado:\n${fallos.join('\n')}`);
});

test('cada keyframe se define una sola vez', () => {
  const veces = new Map();
  for (const archivo of archivosCss()) {
    const css = fs.readFileSync(path.join(ESTILOS, archivo), 'utf8');
    for (const m of css.matchAll(/@(?:-webkit-)?keyframes\s+([A-Za-z0-9_-]+)\s*\{/g)) {
      const nombre = m[1];
      veces.set(nombre, [...(veces.get(nombre) || []), archivo]);
    }
  }
  const duplicados = [...veces.entries()]
    .filter(([, archivos]) => archivos.length > 1)
    .map(([nombre, archivos]) => `${nombre}: ${archivos.join(', ')}`);
  assert.deepEqual(duplicados, [], `Keyframes declarados más de una vez:\n${duplicados.join('\n')}`);
});

test('el producto respeta prefers-reduced-motion', () => {
  const base = fs.readFileSync(path.join(ESTILOS, 'base.css'), 'utf8');
  assert.match(
    base,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)/i,
    'base.css debe retirar el desplazamiento con movimiento reducido',
  );

  const motor = fs.readFileSync(
    path.join(AQUI, '..', 'src', 'scripts', 'utils', 'AnimationEngine.js'),
    'utf8',
  );
  assert.match(motor, /prefers-reduced-motion/, 'el contador debe consultar la preferencia');
  assert.match(motor, /contar\(/, 'el motor debe exponer el conteo de cifras');
});

