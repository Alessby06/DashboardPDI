import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Guardián de la migración: la iconografía de sistema vive en Icon.astro /
// iconHtml. Los únicos <svg> admitidos son las ilustraciones propias, con su
// número exacto. Si alguien vuelve a pegar un icono suelto, esto falla.
//
// src/data/iconos.js queda fuera del recuento: es el renderizador y contiene
// las etiquetas <svg> de sus plantillas internas, no iconos.
const PERMITIDOS = {
  'pages/ajustes.astro': 2,          // mascota del foco y su cursor de ayuda
  'scripts/views/ExpedienteView.js': 3, // silueta y dos rostros de avatar
  'scripts/views/SaludCredView.js': 1,  // serie de hemoglobina
};

const RAIZ = path.resolve('src');
const EXCLUIDOS = new Set(['data/iconos.js']);

function archivos(dir) {
  const salida = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...archivos(completo));
    else if (/\.(astro|js)$/.test(entrada.name)) salida.push(completo);
  }
  return salida;
}

test('no hay SVG sueltos fuera de las ilustraciones permitidas', () => {
  const encontrados = new Map();
  for (const completo of archivos(RAIZ)) {
    const relativo = path.relative(RAIZ, completo).split(path.sep).join('/');
    if (EXCLUIDOS.has(relativo)) continue;
    const texto = fs.readFileSync(completo, 'utf8');
    const n = (texto.match(/<svg\b/g) || []).length;
    if (n > 0) encontrados.set(relativo, n);
  }

  const inesperados = [...encontrados.entries()].filter(([archivo]) => !(archivo in PERMITIDOS));
  assert.deepEqual(inesperados, [], `SVG fuera de la lista permitida: ${JSON.stringify(inesperados)}`);

  for (const [archivo, esperado] of Object.entries(PERMITIDOS)) {
    assert.equal(encontrados.get(archivo), esperado, `${archivo}: se esperaban ${esperado} ilustraciones`);
  }

  const total = [...encontrados.values()].reduce((a, b) => a + b, 0);
  assert.equal(total, 6, 'el número de ilustraciones propias cambió: actualiza la lista con motivo');
});
