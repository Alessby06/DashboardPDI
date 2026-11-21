import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearLlamada, parsearManejador, attrsDe } from '../src/scripts/core/inlineCall.js';

test('parsearLlamada: llamadas simples directas y con guarda', () => {
  const c1 = parsearLlamada("window.toggleCustomDropdown ? window.toggleCustomDropdown('dropdownPadronFilterPanel') : null");
  assert.deepEqual(c1, { nombre: 'toggleCustomDropdown', args: ['dropdownPadronFilterPanel'] });

  const c2 = parsearLlamada("toggleCustomDropdown('dropdownPadronFilterPanel')");
  assert.deepEqual(c2, { nombre: 'toggleCustomDropdown', args: ['dropdownPadronFilterPanel'] });

  const c3 = parsearLlamada("window.resetPadronFilters ? window.resetPadronFilters() : null");
  assert.deepEqual(c3, { nombre: 'resetPadronFilters', args: [] });
});

test('parsearLlamada: expresiones con fallback anidado (educativo, salud, social)', () => {
  const codigo = "window.toggleInnerFilterDropdown ? window.toggleInnerFilterDropdown('dropdownCasitasGrado') : (window.toggleCustomDropdown ? window.toggleCustomDropdown('dropdownCasitasGrado') : null)";
  const res = parsearLlamada(codigo);
  assert.deepEqual(res, { nombre: 'toggleInnerFilterDropdown', args: ['dropdownCasitasGrado'] });
});

test('parsearLlamada: rutas con propiedades anidadas y optional chaining (social, sedes)', () => {
  const r1 = parsearLlamada("window.PDI?.SocialKanbanView?.filterByUrgencia('alta')");
  assert.deepEqual(r1, { nombre: 'PDI.SocialKanbanView.filterByUrgencia', args: ['alta'] });

  const r2 = parsearLlamada("window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.clearFilters() : null");
  assert.deepEqual(r2, { nombre: 'PDI.SocialKanbanView.clearFilters', args: [] });

  const r3 = parsearLlamada("window.PDI?.SedesView ? window.PDI.SedesView.resetFilters() : null");
  assert.deepEqual(r3, { nombre: 'PDI.SedesView.resetFilters', args: [] });
});
