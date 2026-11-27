import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrarColaboradores } from '../src/scripts/utils/filtrosColaboradores.js';

const LISTA = [
  { nombres: 'Ana', apellidos: 'Pérez', dni: '12345678', tipoColaborador: 'Director(a) I.E.', categoria: 'colegios', distrito: 'Comas', estrategias: ['Desayuno Infantil'], estado: 'Activo', sedeInstitucion: 'I.E. San Pedro' },
  { nombres: 'Luis', apellidos: 'Gómez', dni: '87654321', tipoColaborador: 'Pastor(a) / Líder Comunitario', categoria: 'iglesias', distrito: 'Carabayllo', estrategias: ['Casita del Saber'], estado: 'Inactivo', sedeInstitucion: 'Iglesia El Progreso' },
  { nombres: 'Rosa', apellidos: 'Díaz', dni: '', tipoColaborador: 'Facilitador(a) Comunitario(a)', categoria: 'pdi', distrito: 'Comas', estrategias: ['Desayuno Infantil'], estado: 'Activo', sedeInstitucion: 'Sede Año Nuevo' },
];

test('filtra por rol y por categoría', () => {
  assert.deepEqual(
    filtrarColaboradores(LISTA, { categoria: 'colegios', rol: 'Director(a) I.E.' }).map((c) => c.nombres),
    ['Ana'],
  );
  assert.deepEqual(
    filtrarColaboradores(LISTA, { categoria: 'iglesias' }).map((c) => c.nombres),
    [],
    'Luis está inactivo y por defecto no se muestra',
  );
});

test('incluye inactivos solo con el toggle', () => {
  assert.deepEqual(
    filtrarColaboradores(LISTA, { categoria: 'iglesias', incluirInactivos: true }).map((c) => c.nombres),
    ['Luis'],
  );
});

test('busca por DNI y por rol sin distinguir tildes', () => {
  assert.deepEqual(filtrarColaboradores(LISTA, { categoria: 'colegios', q: '12345678' }).map((c) => c.nombres), ['Ana']);
  assert.deepEqual(filtrarColaboradores(LISTA, { categoria: 'pdi', q: 'facilitador' }).map((c) => c.nombres), ['Rosa']);
});
