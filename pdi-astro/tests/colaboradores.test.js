import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clasificarCategoria,
  CATEGORIAS_COLABORADOR,
  PROGRAMAS_ARTICULADOS,
  validarDatosColaborador,
  normalizarColaborador,
  mapearColaboradores,
  ColaboradorModel
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

test('mapearColaboradores transforma registros crudos de SurrealDB con tipos canónicos', () => {
  const crudos = [
    {
      id: 'colaborador:⟨abc123⟩',
      codigo: 'COL-2026-001',
      nombres: 'Rosa',
      apellidos: 'Flores',
      numero_documento: '40123456',
      telefono: '999888777',
      sede_nombre: 'Casita El Ángel',
      tipo_colaborador: 'Facilitador(a) Comunitario(a)',
      distrito: 'Comas',
      estrategias: ['Casita del Saber', 'JAC'],
      activo: true
    },
    {
      id: 'colaborador:⟨xyz890⟩',
      codigo: 'COL-2026-002',
      nombres: 'Alberto',
      apellidos: 'Quispe',
      numero_documento: '10987654',
      telefono_celular: '+51 987 111 222',
      sede_nombre: 'I.E. 3088 Los Ángeles',
      tipo_colaborador: 'Director(a) I.E.',
      codigo_modular: '0584920',
      nivel: 'Primaria',
      turno: 'Mañana',
      distrito: 'Carabayllo',
      estrategias: ['Desayuno Infantil'],
      activo: true
    }
  ];

  const mapeados = mapearColaboradores(crudos);
  assert.equal(mapeados.length, 2);

  const col1 = mapeados[0];
  assert.equal(col1._qid, 'colaborador:⟨abc123⟩');
  assert.equal(col1.codigo, 'COL-2026-001');
  assert.equal(col1.nombres, 'Rosa');
  assert.equal(col1.dni, '40123456');
  assert.equal(col1.celular, '999888777');
  assert.equal(col1.sedeInstitucion, 'Casita El Ángel');
  assert.equal(col1.categoria, CATEGORIAS_COLABORADOR.PDI);
  assert.ok(col1.estrategias.includes('Juntos Aprendemos en Cristo (JAC)'));

  const col2 = mapeados[1];
  assert.equal(col2.celular, '987111222');
  assert.equal(col2.codigoModular, '0584920');
  assert.equal(col2.nivel, 'Primaria');
  assert.equal(col2.turno, 'Mañana');
  assert.equal(col2.categoria, CATEGORIAS_COLABORADOR.COLEGIO);
});

test('ColaboradorModel.aplicarDatos y getBySede localizan colaboradores por sede', () => {
  ColaboradorModel.aplicarDatos([
    {
      id: 1,
      codigo: 'COL-2026-001',
      nombres: 'Carmen',
      apellidos: 'Vega',
      sedeInstitucion: 'Sede Comas San Juan',
      tipoColaborador: 'Facilitador(a) Comunitario(a)',
      categoria: 'pdi'
    },
    {
      id: 2,
      codigo: 'COL-2026-002',
      nombres: 'Pedro',
      apellidos: 'Soto',
      sedeInstitucion: 'Iglesia Alianza Cristiana',
      tipoColaborador: 'Pastor(a) / Líder Comunitario',
      categoria: 'iglesias'
    }
  ]);

  const porSede1 = ColaboradorModel.getBySede('Comas San Juan');
  assert.equal(porSede1.length, 1);
  assert.equal(porSede1[0].codigo, 'COL-2026-001');

  const porSede2 = ColaboradorModel.getBySede('alianza');
  assert.equal(porSede2.length, 1);
  assert.equal(porSede2[0].codigo, 'COL-2026-002');

  const noMatch = ColaboradorModel.getBySede('Inexistente');
  assert.equal(noMatch.length, 0);
});

test('validarDatosColaborador y normalizarColaborador limpian prefijo +51 de celular peruano', () => {
  const conPrefijo = validarDatosColaborador({
    nombres: 'Esther',
    apellidos: 'Mendoza',
    sedeInstitucion: 'Sede Comas',
    celular: '+51 987 654 321'
  });
  assert.equal(conPrefijo.valido, true);

  const normalizado = normalizarColaborador({
    nombres: 'Esther',
    apellidos: 'Mendoza',
    sedeInstitucion: 'Sede Comas',
    celular: '+51 987 654 321'
  });
  assert.equal(normalizado.celular, '987654321');
});

test('validarDatosColaborador tolera campos opcionales con espacios en blanco', () => {
  const res = validarDatosColaborador({
    nombres: 'Esther',
    apellidos: 'Mendoza',
    sedeInstitucion: 'Sede Comas',
    dni: '   ',
    codigoModular: '   '
  });
  assert.equal(res.valido, true);
});

test('ColaboradorModel.getBySede es insensible a tildes y mayúsculas', () => {
  ColaboradorModel.aplicarDatos([
    {
      id: 10,
      codigo: 'COL-2026-010',
      nombres: 'Lucas',
      apellidos: 'Bustamante',
      sedeInstitucion: 'Sede San José Obrero',
      tipoColaborador: 'Director(a) I.E.',
      categoria: 'colegios'
    }
  ]);

  const matchSinTilde = ColaboradorModel.getBySede('san jose');
  assert.equal(matchSinTilde.length, 1);
  assert.equal(matchSinTilde[0].codigo, 'COL-2026-010');

  const matchConTilde = ColaboradorModel.getBySede('SAN JOSÉ');
  assert.equal(matchConTilde.length, 1);
  assert.equal(matchConTilde[0].codigo, 'COL-2026-010');
});

test('ColaboradorModel.delete y update gestionan el estado en memoria y preservan _qid', async () => {
  ColaboradorModel.aplicarDatos([
    {
      id: 50,
      _qid: 'colaborador:⟨record_50⟩',
      codigo: 'COL-2026-050',
      nombres: 'Mario',
      apellidos: 'Vargas',
      sedeInstitucion: 'Sede Carabayllo',
      tipoColaborador: 'Facilitador(a) Comunitario(a)',
      categoria: 'pdi',
      estado: 'Activo'
    }
  ]);

  const actualizado = await ColaboradorModel.update(50, { nombres: 'Mario Paul' });
  assert.equal(actualizado.nombres, 'Mario Paul');
  assert.equal(actualizado._qid, 'colaborador:⟨record_50⟩');

  const borrado = await ColaboradorModel.delete(50);
  assert.equal(borrado, true);
  assert.equal(ColaboradorModel.getById(50), null);
});
