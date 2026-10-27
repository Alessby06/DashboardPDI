import test from 'node:test';
import assert from 'node:assert/strict';
import { crearStore } from '../src/scripts/utils/FilterStore.js';

const facetas = {
  sede: { tipo: 'multi', opciones: ['Comas', 'Carabayllo', 'Año Nuevo'], defecto: [] },
  estado: { tipo: 'single', opciones: ['all', 'Activo', 'Inactivo'], defecto: 'all' },
};

test('alternar acumula y desmarca', () => {
  const s = crearStore(facetas);
  s.alternar('sede', 'Comas');
  assert.deepEqual(s.valor('sede'), ['Comas']);
  s.alternar('sede', 'Carabayllo');
  assert.deepEqual(s.valor('sede'), ['Comas', 'Carabayllo']);
  s.alternar('sede', 'Comas');
  assert.deepEqual(s.valor('sede'), ['Carabayllo']);
});

test('marcar todas las opciones vuelve a Todas', () => {
  const s = crearStore(facetas);
  s.alternar('sede', 'Comas');
  s.alternar('sede', 'Carabayllo');
  s.alternar('sede', 'Año Nuevo');
  assert.deepEqual(s.valor('sede'), []);
});

test('"all" limpia la seleccion multiple', () => {
  const s = crearStore(facetas);
  s.alternar('sede', 'Comas');
  s.alternar('sede', 'all');
  assert.deepEqual(s.valor('sede'), []);
});

test('single rechaza valores fuera del catalogo', () => {
  const s = crearStore(facetas);
  s.fijar('estado', 'Activo');
  assert.equal(s.valor('estado'), 'Activo');
  s.fijar('estado', 'inventado');
  assert.equal(s.valor('estado'), 'all');
});

test('cargar normaliza lo que llega (URL)', () => {
  const s = crearStore(facetas);
  s.cargar({ sede: ['Comas', 'NoExiste'], estado: 'Activo' });
  assert.deepEqual(s.valor('sede'), ['Comas']);
  assert.equal(s.valor('estado'), 'Activo');
});

test('cargar todas las opciones equivale a Todas', () => {
  const s = crearStore(facetas);
  s.cargar({ sede: ['Comas', 'Carabayllo', 'Año Nuevo'] });
  assert.deepEqual(s.valor('sede'), []);
});

test('activos y contarActivos reflejan solo lo distinto del defecto', () => {
  const s = crearStore(facetas);
  assert.deepEqual(s.activos(), []);
  s.alternar('sede', 'Comas');
  s.alternar('sede', 'Carabayllo');
  s.fijar('estado', 'Inactivo');
  assert.equal(s.contarActivos(), 3);
  assert.deepEqual(s.activos().map((f) => f.clave).sort(), ['estado', 'sede']);
});

test('limpiar vuelve a los defectos', () => {
  const s = crearStore(facetas);
  s.alternar('sede', 'Comas');
  s.fijar('estado', 'Activo');
  s.limpiar();
  assert.deepEqual(s.valor('sede'), []);
  assert.equal(s.valor('estado'), 'all');
});

test('los oyentes reciben la instantanea y se pueden dar de baja', () => {
  const s = crearStore(facetas);
  let llamadas = 0;
  let ultima = null;
  const baja = s.suscribir((estado) => {
    llamadas++;
    ultima = estado;
  });
  s.alternar('sede', 'Comas');
  assert.equal(llamadas, 1);
  assert.deepEqual(ultima.sede, ['Comas']);
  baja();
  s.alternar('sede', 'Comas');
  assert.equal(llamadas, 1);
});

test('la instantanea es una copia, no el estado vivo', () => {
  const s = crearStore(facetas);
  const copia = s.instantanea();
  copia.sede.push('Comas');
  assert.deepEqual(s.valor('sede'), []);
});

test('multi sin catálogo acepta valores libres (roles)', () => {
  const s = crearStore({ rol: { tipo: 'multi', defecto: [] } });
  s.alternar('rol', 'Voluntaria de Apoyo');
  s.alternar('rol', 'Loncherita');
  assert.deepEqual(s.valor('rol'), ['Voluntaria de Apoyo', 'Loncherita']);
  s.cargar({ rol: ['A', 'A', ' '] });
  assert.deepEqual(s.valor('rol'), ['A']);
});
