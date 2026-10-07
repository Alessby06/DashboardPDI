import { readFileSync } from 'node:fs';
import { Surreal } from 'surrealdb';

const env = {};
for (const l of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}

const db = new Surreal();
await db.connect(env.PUBLIC_SURREAL_URL);
await db.signin({
  username: env.PUBLIC_SURREAL_USER,
  password: env.PUBLIC_SURREAL_PASS,
  namespace: env.PUBLIC_SURREAL_NS,
  database: env.PUBLIC_SURREAL_DB,
});
await db.use({
  namespace: env.PUBLIC_SURREAL_NS,
  database: env.PUBLIC_SURREAL_DB,
});

const { defaultBeneficiarios } = await import('../src/data/fixtures/beneficiarios.js');
const { defaultSedes } = await import('../src/data/fixtures/sedes.js');
const { defaultCasosSociales } = await import('../src/data/fixtures/casos-sociales.js');

const idClean = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_');

// 1. Limpiar sede, inscripcion, caso_social
for (const t of ['inscripcion', 'caso_social', 'sede']) {
  try {
    await db.query(`DELETE ${t};`);
    console.log(`[OK] Limpiada tabla: ${t}`);
  } catch (e) {
    console.log(`[Aviso] ${t}:`, e.message?.split('\n')[0]);
  }
}

// 2. Insertar Sedes
const tipoLocalValido = (t) => {
  if (['Comedor Comunitario', 'Iglesia Aliada', 'Colegio Publico (I.E.)', 'Biblioteca Comunal', 'Local Comunal'].includes(t)) {
    return t;
  }
  return 'Local Comunal';
};

const sedeMap = new Map();
for (const s of defaultSedes) {
  const sid = `sede:\`${idClean(s.nombre)}\``;
  const res = await db.query(
    `CREATE ${sid} SET
      nombre = $nombre,
      distrito = $distrito,
      direccion = $direccion,
      referencia = $referencia,
      facilitadora_nombre = $facNom,
      facilitadora_tel = $facTel,
      aliado_nombre = $aliado,
      aliado_institucion = $aliadoInst,
      aforo_max = $aforo,
      horario = $horario,
      estado = $estado,
      tipo_local = $tipo,
      servicios = $servicios`,
    {
      nombre: s.nombre,
      distrito: s.distrito === 'Carabayllo' ? 'Carabayllo' : 'Comas',
      direccion: s.direccion || 'Sin direccion',
      referencia: s.referencia || '',
      facNom: s.facilitadora || 'Coordinacion',
      facTel: s.facilitadoraTel || '999-000-000',
      aliado: s.iglesiaAliada || s.pastorAliado || 'Comunidad Local',
      aliadoInst: s.tipoAliado || 'Local Comunal',
      aforo: s.aforoMax || 30,
      horario: s.horario || 'Lunes a Viernes 08:00 - 14:00',
      estado: 'Operativa',
      tipo: tipoLocalValido(s.tipoAliado),
      servicios: Array.isArray(s.servicios) ? s.servicios : ['Servicio Alimentario Nutricional'],
    }
  );
  sedeMap.set(s.nombre.toLowerCase(), sid);
  console.log('[OK] Sede creada:', s.nombre);
}

// 3. Mapear personas existentes
const [personasExistentes] = await db.query('SELECT id, numero_documento, codigo FROM persona');
const personaPorDoc = new Map(personasExistentes.map(p => [String(p.numero_documento), p.id]));
const personaPorCod = new Map(personasExistentes.map(p => [String(p.codigo).toLowerCase(), p.id]));

// 4. Crear inscripciones y tamizajes para menores
const programaDesde = (b) => {
  const e = (b.estrategia || '').toLowerCase();
  if (e.includes('mixto')) return 'Mixto';
  if (e.includes('lonchera')) return 'Lonchera Infantil';
  if (e.includes('casita') || e.includes('educat') || e.includes('acompañ')) return 'Casita del Saber';
  return 'Desayuno Infantil';
};

const resultadoTamizaje = (anemia) => {
  const a = (anemia || '').toLowerCase();
  if (a.includes('moderada')) return 'Anemia moderada';
  if (a.includes('leve')) return 'Anemia leve';
  if (a.includes('severa') || a.includes('grave')) return 'Anemia grave';
  if (a.includes('riesgo')) return 'En riesgo';
  return 'Regular';
};

for (const b of defaultBeneficiarios) {
  const pid = personaPorDoc.get(String(b.dni)) || personaPorCod.get(String(b.codigo).toLowerCase());
  if (!pid) {
    console.log('[SKIP] Menor no registrado en persona:', b.nombres, b.dni);
    continue;
  }

  // Buscar sede
  let targetSedeId = null;
  for (const [sNom, sId] of sedeMap.entries()) {
    if ((b.sede || '').toLowerCase().includes(sNom)) {
      targetSedeId = sId;
      break;
    }
  }
  if (!targetSedeId) {
    targetSedeId = sedeMap.get('año nuevo') || [...sedeMap.values()][0];
  }

  // Crear Inscripcion
  await db.query(
    `CREATE inscripcion SET
      persona_id = ${pid},
      sede_id = ${targetSedeId},
      programa = $prog,
      modalidad = $mod,
      tipo_atencion = 'Atencion fija',
      periodo = 2026,
      estado = 'Activo',
      activo = true`,
    {
      prog: programaDesde(b),
      mod: (b.modalidad || '').toLowerCase().includes('instituc') ? 'Institucion Educativa' : 'Comunitaria',
    }
  );

  // Crear o actualizar Tamizaje si tiene hb
  if (b.hb != null) {
    await db.query(
      `CREATE tamizaje_hemoglobina SET
        persona_id = ${pid},
        sede_id = ${targetSedeId},
        hb_valor = <decimal>$hb,
        hb_ajustada = <decimal>$hb,
        peso_kg = <decimal>$peso,
        talla_cm = <decimal>$talla,
        resultado = $res,
        fecha_tamizaje = time::now(),
        activo = true`,
      {
        hb: Number(b.hb),
        peso: Number(b.peso || 14.0),
        talla: Number(b.talla || 95.0),
        res: resultadoTamizaje(b.anemia),
      }
    );
  }
}
console.log('[OK] Inscripciones y Tamizajes registrados.');

// 5. Crear Casos Sociales
for (const c of defaultCasosSociales) {
  const pid = personaPorCod.get(String(c.codigo).toLowerCase());
  if (!pid) {
    console.log('[SKIP] Caso sin persona vinculada:', c.codigo);
    continue;
  }

  let targetSedeId = null;
  for (const [sNom, sId] of sedeMap.entries()) {
    if ((c.sede || '').toLowerCase().includes(sNom)) {
      targetSedeId = sId;
      break;
    }
  }
  if (!targetSedeId) targetSedeId = [...sedeMap.values()][0];

  const etapaValida = ['pendiente', 'en_evaluacion', 'canalizado', 'resuelto'].includes(c.etapa) ? c.etapa : 'pendiente';
  const tipoValido = (c.tipoProblematica || '').toLowerCase().includes('nutric') ? 'Nutricional / Abandono' :
                     (c.tipoProblematica || '').toLowerCase().includes('educ') ? 'Educativo' :
                     (c.tipoProblematica || '').toLowerCase().includes('salud') ? 'Salud' :
                     (c.tipoProblematica || '').toLowerCase().includes('violen') ? 'Violencia' : 'Familiar';

  await db.query(
    `CREATE caso_social SET
      persona_id = ${pid},
      sede_id = ${targetSedeId},
      codigo_caso = $cod,
      etapa = $etapa,
      urgencia = $urg,
      tipo_problematica = $tipo,
      quien_deriva_nombre = $derivaNom,
      quien_deriva_cargo = $derivaCargo,
      quien_deriva_tel = $derivaTel,
      situacion_encontrada = $sit,
      acciones_previas = $acc,
      tiene_soporte_familiar = $soporte,
      detalle_soporte_familiar = $detSoporte,
      fecha_derivacion = time::now(),
      activo = true`,
    {
      cod: c.codigo || 'CASO-001',
      etapa: etapaValida,
      urg: c.urgencia || 'Media',
      tipo: tipoValido,
      derivaNom: c.quienDeriva?.nombre || 'Lic. Miriam Soto Paredes',
      derivaCargo: c.quienDeriva?.cargo || 'Facilitadora Nutricional',
      derivaTel: c.quienDeriva?.telefono || '987-223-114',
      sit: c.situacionEncontrada || c.detalle || 'En seguimiento',
      acc: c.accionesPrevias || 'Visita preliminar realizada',
      soporte: c.soporteFamiliar?.tiene ?? false,
      detSoporte: c.soporteFamiliar?.detalle || 'Sin soporte adicional',
    }
  );
  console.log('[OK] Caso social registrado:', c.codigo);
}

// 6. Verificar conteos
const [rSed] = await db.query('SELECT count() FROM sede GROUP ALL');
const [rIns] = await db.query('SELECT count() FROM inscripcion GROUP ALL');
const [rTam] = await db.query('SELECT count() FROM tamizaje_hemoglobina GROUP ALL');
const [rCas] = await db.query('SELECT count() FROM caso_social GROUP ALL');

console.log('=== CONTEOS FINALES EN SURREALDB CLOUD ===');
console.log('Sedes:', rSed[0]?.count);
console.log('Inscripciones:', rIns[0]?.count);
console.log('Tamizajes:', rTam[0]?.count);
console.log('Casos Sociales:', rCas[0]?.count);

await db.close();
