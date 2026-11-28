import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  marcarCasosHuerfanos,
  bajaTuvoEfecto,
  puedeReactivar,
  clasificarDuplicado,
  resumirExpedientesIncompletos,
  tieneCasoAbierto,
} from '../src/scripts/core/integridad.js';

test('marca caso cuya persona no esta en el padron', () => {
  const r = marcarCasosHuerfanos([{ _personaId: 'persona:a', usuario: 'Ana' }], []);
  assert.equal(r[0].sinExpediente, true);
});

test('no marca caso con expediente', () => {
  const r = marcarCasosHuerfanos(
    [{ _personaId: 'persona:a' }],
    [{ _personaId: 'persona:a' }],
  );
  assert.equal(r[0].sinExpediente, false);
});

test('baja sin filas no es exito', () => {
  assert.equal(bajaTuvoEfecto([]), false);
  assert.equal(bajaTuvoEfecto([{ id: 'inscripcion:1', activo: false }]), true);
});

test('reactivar sin inscripcion exige sede, programa y modalidad', () => {
  assert.deepEqual(
    puedeReactivar({ _inscripcionId: '', sede: '', programa: '', modalidad: '' }),
    { ok: false, faltan: ['sede', 'programa', 'modalidad'] },
  );
  assert.equal(puedeReactivar({ _inscripcionId: 'inscripcion:1' }).ok, true);
});

test('clasifica DNI activo, retirado y sin expediente', () => {
  assert.equal(clasificarDuplicado({ persona: { activo: true }, inscripcionActiva: { id: 'x' } }), 'ACTIVO');
  assert.equal(clasificarDuplicado({ persona: { activo: false }, inscripcionActiva: null }), 'RETIRADO');
  assert.equal(clasificarDuplicado({ persona: { activo: true }, inscripcionActiva: null }), 'SIN_INSCRIPCION');
});

test('resume personas activas sin inscripcion', () => {
  const r = resumirExpedientesIncompletos(
    [
      { id: 'persona:a', activo: true, codigo: '0001-IS2026', nombres: 'Ana' },
      { id: 'persona:b', activo: true, codigo: 'APO-1', nombres: 'Madre' },
    ],
    [],
  );
  assert.equal(r.total, 1);
  assert.equal(r.filas[0].personaId, 'persona:a');
});

test('detecta caso abierto y no caso cerrado', () => {
  assert.equal(tieneCasoAbierto([{ _personaId: 'persona:a', etapa: 'evaluacion' }], 'persona:a'), true);
  assert.equal(tieneCasoAbierto([{ _personaId: 'persona:a', etapa: 'cerrado' }], 'persona:a'), false);
});
