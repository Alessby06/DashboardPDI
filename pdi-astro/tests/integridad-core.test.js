import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditar } from '../scripts/_integridad-core.mjs';

const base = {
  personas: [], inscripciones: [], casos: [], tamizajes: [],
  aportes: [], asistencias: [], evaluaciones: [],
};

test('detecta persona activa sin inscripcion', () => {
  const r = auditar({
    ...base,
    personas: [{ id: 'persona:a', activo: true, codigo: '0001-IS2026' }],
  });
  assert.equal(r.ok, false);
  assert.deepEqual(r.violaciones.map(v => v.codigo), ['PERSONA_SIN_INSCRIPCION']);
});

test('no marca personas que no son beneficiarias', () => {
  const r = auditar({
    ...base,
    personas: [{ id: 'persona:a', activo: true, codigo: 'APO-001' }],
  });
  assert.equal(r.ok, true);
});

test('detecta dos inscripciones activas de la misma persona', () => {
  const r = auditar({
    ...base,
    personas: [{ id: 'persona:a', activo: true, codigo: '0001-IS2026' }],
    inscripciones: [
      { id: 'inscripcion:1', persona_id: 'persona:a', activo: true },
      { id: 'inscripcion:2', persona_id: 'persona:a', activo: true },
    ],
  });
  assert.equal(r.ok, false);
  assert.ok(r.violaciones.some(v => v.codigo === 'INSCRIPCION_DUPLICADA_ACTIVA'));
});

test('detecta caso activo sin persona o sin inscripcion', () => {
  const r = auditar({
    ...base,
    personas: [{ id: 'persona:a', activo: true, codigo: '0001-IS2026' }],
    inscripciones: [{ id: 'inscripcion:1', persona_id: 'persona:b', activo: true }],
    casos: [
      { id: 'caso_social:1', persona_id: 'persona:no-existe', activo: true },
      { id: 'caso_social:2', persona_id: 'persona:a', activo: true },
    ],
  });
  const codigos = r.violaciones.map(v => v.codigo);
  assert.ok(codigos.includes('CASO_SIN_PERSONA'));
  assert.ok(codigos.includes('PERSONA_SIN_INSCRIPCION'));
  assert.ok(codigos.includes('CASO_SIN_INSCRIPCION'));
});

test('detecta codigo duplicado', () => {
  const r = auditar({
    ...base,
    personas: [
      { id: 'persona:a', activo: true, codigo: '0011-IS2026' },
      { id: 'persona:b', activo: true, codigo: '0011-IS2026' },
    ],
    inscripciones: [
      { id: 'inscripcion:1', persona_id: 'persona:a', activo: true },
      { id: 'inscripcion:2', persona_id: 'persona:b', activo: true },
    ],
  });
  assert.ok(r.violaciones.some(v => v.codigo === 'CODIGO_DUPLICADO'));
});

test('aporte huerfano es advertencia, no violacion', () => {
  const r = auditar({
    ...base,
    personas: [{ id: 'persona:a', activo: false, codigo: '0001-IS2026' }],
    aportes: [{ id: 'aporte:1', inscripcion_id: 'inscripcion:borrada' }],
  });
  assert.equal(r.ok, true);
  assert.ok(r.advertencias.some(v => v.codigo === 'APORTE_SIN_INSCRIPCION'));
});

test('dataset consistente queda ok', () => {
  const r = auditar({
    ...base,
    personas: [{ id: 'persona:a', activo: true, codigo: '0001-IS2026' }],
    inscripciones: [{ id: 'inscripcion:1', persona_id: 'persona:a', activo: true }],
    casos: [{ id: 'caso_social:1', persona_id: 'persona:a', activo: true }],
    tamizajes: [{ id: 'tam:1', persona_id: 'persona:a', inscripcion_id: 'inscripcion:1', activo: true }],
    aportes: [{ id: 'aporte:1', inscripcion_id: 'inscripcion:1' }],
    asistencias: [{ id: 'asistencia:1', inscripcion_id: 'inscripcion:1' }],
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.violaciones, []);
});
