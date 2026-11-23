import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clasificarCategoria,
  CATEGORIAS_COLABORADOR,
  PROGRAMAS_ARTICULADOS,
  validarDatosColaborador,
  normalizarColaborador
} from '../src/scripts/models/ColaboradorModel.js';

test('clasificarCategoria asigna correctamente colegios, iglesias y pdi', () => {
  assert.equal(clasificarCategoria('Director(a) I.E.'), CATEGORIAS_COLABORADOR.COLEGIO);
  assert.equal(clasificarCategoria('Docente Enlace'), CATEGORIAS_COLABORADOR.COLEGIO);
  assert.equal(clasificarCategoria('Pastor(a) / Líder Comunitario'), CATEGORIAS_COLABORADOR.IGLESIA);
  assert.equal(clasificarCategoria('Enlace Parroquial / Iglesia'), CATEGORIAS_COLABORADOR.IGLESIA);
  assert.equal(clasificarCategoria('Facilitador(a) Comunitario(a)'), CATEGORIAS_COLABORADOR.PDI);
  assert.equal(clasificarCategoria('Promotora Social'), CATEGORIAS_COLABORADOR.PDI);
  assert.equal(clasificarCategoria('Promotora Educativa'), CATEGORIAS_COLABORADOR.PDI);
  assert.equal(clasificarCategoria('Cualquier otro'), CATEGORIAS_COLABORADOR.PDI);
});

test('PROGRAMAS_ARTICULADOS contiene el nombre canónico de JAC', () => {
  assert.ok(PROGRAMAS_ARTICULADOS.includes('Juntos Aprendemos en Cristo (JAC)'));
  assert.ok(!PROGRAMAS_ARTICULADOS.includes('Jóvenes en Acción Comunitaria (JAC)'));
  assert.ok(PROGRAMAS_ARTICULADOS.includes('Buen Trato en Familia (BTF)'));
  assert.ok(PROGRAMAS_ARTICULADOS.includes('Repostería'));
  assert.ok(PROGRAMAS_ARTICULADOS.includes('Casita del Saber'));
  assert.ok(PROGRAMAS_ARTICULADOS.includes('Desayuno Infantil'));
});

test('validarDatosColaborador exige nombres, apellidos y sede/institución', () => {
  const sinNombres = validarDatosColaborador({ apellidos: 'Reyes', sedeInstitucion: 'Sede Comas' });
  assert.equal(sinNombres.valido, false);
  assert.ok(sinNombres.errores.some(e => e.includes('nombres')));

  const sinApellidos = validarDatosColaborador({ nombres: 'María', sedeInstitucion: 'Sede Comas' });
  assert.equal(sinApellidos.valido, false);
  assert.ok(sinApellidos.errores.some(e => e.includes('apellidos')));

  const sinSede = validarDatosColaborador({ nombres: 'María', apellidos: 'Reyes' });
  assert.equal(sinSede.valido, false);
  assert.ok(sinSede.errores.some(e => e.includes('sede')));
});

test('validarDatosColaborador rechaza celular que no empiece con 9 o de longitud distinta a 9', () => {
  const corto = validarDatosColaborador({
    nombres: 'María',
    apellidos: 'Reyes',
    sedeInstitucion: 'Sede Comas',
    celular: '12345678'
  });
  assert.equal(corto.valido, false);
  assert.ok(corto.errores.some(e => e.includes('celular')));

  const noEmpieza9 = validarDatosColaborador({
    nombres: 'María',
    apellidos: 'Reyes',
    sedeInstitucion: 'Sede Comas',
    celular: '887654321'
  });
  assert.equal(noEmpieza9.valido, false);
  assert.ok(noEmpieza9.errores.some(e => e.includes('celular')));

  const valido = validarDatosColaborador({
    nombres: 'María',
    apellidos: 'Reyes',
    sedeInstitucion: 'Sede Comas',
    celular: '987654321'
  });
  assert.equal(valido.valido, true);
});

test('validarDatosColaborador exige 7 dígitos en código modular cuando se suministra', () => {
  const invalido = validarDatosColaborador({
    nombres: 'Juan',
    apellidos: 'Pérez',
    sedeInstitucion: 'I.E. 3088',
    codigoModular: '123'
  });
  assert.equal(invalido.valido, false);
  assert.ok(invalido.errores.some(e => e.includes('modular')));

  const valido = validarDatosColaborador({
    nombres: 'Juan',
    apellidos: 'Pérez',
    sedeInstitucion: 'I.E. 3088',
    codigoModular: '0584920'
  });
  assert.equal(valido.valido, true);
});

test('validarDatosColaborador exige 8 dígitos en DNI cuando se suministra', () => {
  const invalido = validarDatosColaborador({
    nombres: 'Juan',
    apellidos: 'Pérez',
    sedeInstitucion: 'Sede Comas',
    dni: '123'
  });
  assert.equal(invalido.valido, false);
  assert.ok(invalido.errores.some(e => e.includes('DNI')));

  const valido = validarDatosColaborador({
    nombres: 'Juan',
    apellidos: 'Pérez',
    sedeInstitucion: 'Sede Comas',
    dni: '12345678'
  });
  assert.equal(valido.valido, true);
});

test('normalizarColaborador limpia espacios y asegura estrategias válidas', () => {
  const normal = normalizarColaborador({
    nombres: '  Ana  ',
    apellidos: '  Gómez  ',
    sedeInstitucion: '  I.E. 3088  ',
    celular: ' 987 654 321 ',
    dni: ' 12345678 ',
    tipoColaborador: 'Docente Enlace',
    estrategias: ['Jóvenes en Acción Comunitaria (JAC)', 'Desayuno Infantil']
  });

  assert.equal(normal.nombres, 'Ana');
  assert.equal(normal.apellidos, 'Gómez');
  assert.equal(normal.sedeInstitucion, 'I.E. 3088');
  assert.equal(normal.celular, '987654321');
  assert.equal(normal.dni, '12345678');
  assert.equal(normal.categoria, CATEGORIAS_COLABORADOR.COLEGIO);
  // Debe convertir el nombre obsoleto de JAC al canónico
  assert.ok(normal.estrategias.includes('Juntos Aprendemos en Cristo (JAC)'));
  assert.ok(!normal.estrategias.includes('Jóvenes en Acción Comunitaria (JAC)'));
});
