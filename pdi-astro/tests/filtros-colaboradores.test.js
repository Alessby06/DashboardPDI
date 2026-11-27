import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrarColaboradores, ordenarColaboradores, contarFacetasColaboradores } from '../src/scripts/utils/filtrosColaboradores.js';

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

const LISTA2 = [
  ...LISTA,
  { nombres: 'Eva', apellidos: 'Ruiz', dni: '11223344', tipoColaborador: 'Docente Enlace', categoria: 'colegios', distrito: 'Comas', estrategias: ['Desayuno Infantil'], estado: 'Activo', sedeInstitucion: 'I.E. Comas' },
];

test('las facetas se cuentan sin su propia faceta', () => {
  const conRol = contarFacetasColaboradores(LISTA2, { categoria: 'colegios', rol: 'Director(a) I.E.' });
  assert.equal(conRol.porRol['Director(a) I.E.'], 1);
  assert.equal(conRol.totalDistrito, 1, 'el distrito respeta el rol activo');
  assert.equal(conRol.porDistrito.Comas, 1);

  const sinRol = contarFacetasColaboradores(LISTA2, { categoria: 'colegios' });
  assert.equal(sinRol.totalDistrito, 2);
  assert.equal(sinRol.porDistrito.Comas, 2);
  assert.equal(sinRol.total, 2);
});

test('ordena por sede y desempata por apellido', () => {
  const lista = [
    { nombres: 'A', apellidos: 'Zeta', sedeInstitucion: 'Misma', tipoColaborador: 'X', categoria: 'colegios', estado: 'Activo' },
    { nombres: 'B', apellidos: 'Alva', sedeInstitucion: 'Misma', tipoColaborador: 'X', categoria: 'colegios', estado: 'Activo' },
  ];
  assert.deepEqual(ordenarColaboradores(lista, 'sede-asc').map((c) => c.apellidos), ['Alva', 'Zeta']);
});
