import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ALIAS,
  CLAVES,
  HUGEICONS_VERSION,
  ICONOS,
  ICON_STROKE,
  iconBody,
  iconHtml,
} from '../src/data/iconos.js';

test('el set está fijado a la versión elegida y completo', () => {
  assert.equal(HUGEICONS_VERSION, '4.4.0');
  assert.equal(CLAVES.length, 64);
  assert.equal(new Set(CLAVES).size, 64);
});

test('los paths no llevan grosor ni color incrustados', () => {
  for (const clave of CLAVES) {
    const cuerpo = ICONOS[clave];
    assert.ok(Array.isArray(cuerpo) && cuerpo.length > 0, `${clave} vacío`);
    for (const [tag, attrs] of cuerpo) {
      assert.equal(typeof tag, 'string');
      for (const prohibido of ['stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'key']) {
        assert.equal(attrs[prohibido], undefined, `${clave} conserva ${prohibido}`);
      }
    }
  }
});

test('todos los alias apuntan a un icono existente', () => {
  for (const [alias, clave] of Object.entries(ALIAS)) {
    assert.ok(ICONOS[clave], `${alias} → ${clave} no existe`);
  }
});

test('el SVG por defecto es decorativo, de 16 px y con el token de trazo', () => {
  const svg = iconHtml('accion.cerrar');
  assert.match(svg, /viewBox="0 0 24 24"/);
  assert.match(svg, /width="16"/);
  assert.match(svg, /height="16"/);
  assert.match(svg, /stroke="currentColor"/);
  assert.match(svg, /stroke-width:var\(--icon-stroke, 1\.75\)/);
  assert.match(svg, /aria-hidden="true"/);
  assert.doesNotMatch(svg, /role="img"/);
});

test('el alias resuelve al mismo cuerpo que la clave del set', () => {
  const porAlias = iconHtml('accion.cerrar');
  const porClave = iconHtml('cancel-01');
  assert.equal(porAlias, porClave);
});

test('un título lo convierte en imagen accesible', () => {
  const svg = iconHtml('accion.confirmar', { title: 'Confirmar' });
  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="Confirmar"/);
  assert.match(svg, /<title>Confirmar<\/title>/);
  assert.doesNotMatch(svg, /aria-hidden/);
});

test('el tamaño admite null para que lo controle el CSS', () => {
  const svg = iconHtml('nav.inicio', { size: null });
  assert.doesNotMatch(svg, /width="/);
  assert.doesNotMatch(svg, /height="/);
});

test('las clases se reenvían y se escapan', () => {
  const svg = iconHtml('accion.buscar', { className: 'filter-caret' });
  assert.match(svg, /class="filter-caret"/);

  const conComillas = iconHtml('accion.buscar', { className: 'a"b' });
  assert.match(conComillas, /class="a&quot;b"/);
});

test('un grosor explícito no depende del token', () => {
  const svg = iconHtml('estado.ok', { stroke: 2 });
  assert.match(svg, /stroke-width:2/);
  assert.doesNotMatch(svg, /var\(--icon-stroke/);
});

test('el token global coincide con el grosor declarado', () => {
  assert.equal(ICON_STROKE, 1.75);
});

test('el id se conserva y el cuerpo se puede inyectar aparte', () => {
  const svg = iconHtml('seguridad.candado', { id: 'iconPassEye' });
  assert.match(svg, /id="iconPassEye"/);

  const cuerpo = iconBody('accion.ver');
  assert.match(cuerpo, /^<path /);
  assert.doesNotMatch(cuerpo, /<svg/);
});

test('un icono desconocido falla en vez de pintar un hueco', () => {
  assert.throws(() => iconHtml('accion.inexistente'), /Icono desconocido/);
});
