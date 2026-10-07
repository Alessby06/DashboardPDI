// Migra los fixtures (datos semilla) a la instancia real de SurrealDB.
// Uso: node scripts/migrar-fixtures.mjs
import { readFileSync } from 'node:fs';
import { Surreal } from 'surrealdb';

// Lee .env manualmente (sin dependencia de dotenv)
const env = {};
for (const linea of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = linea.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}

const { defaultBeneficiarios } = await import('../src/data/fixtures/beneficiarios.js');
const { defaultSedes } = await import('../src/data/fixtures/sedes.js');
const { defaultVoluntarios } = await import('../src/data/fixtures/voluntarios.js');
const { defaultCasosSociales } = await import('../src/data/fixtures/casos-sociales.js');

const db = new Surreal();
await db.connect(env.PUBLIC_SURREAL_URL);
await db.signin({ username: env.PUBLIC_SURREAL_USER, password: env.PUBLIC_SURREAL_PASS, namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });
await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });

const id = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_');

// Limpia tablas que vamos a poblar (los registros demo previos se reemplazan).
for (const t of ['inscripcion', 'caso_social', 'evento_caso', 'evaluacion_socioeconomica', 'aporte', 'atencion_usuario', 'persona_rol', 'persona', 'sede', 'institucion']) {
  try { await db.query(`DELETE ${t};`); console.log('limpia tabla', t); }
  catch (e) { console.log('omitida', t, '-', e.message?.split('\n')[0]); }
}

const programaDesde = (b) => {
  const e = (b.estrategia || '').toLowerCase();
  if (e.includes('mixto')) return 'Mixto';
  if (e.includes('lonchera')) return 'Lonchera Infantil';
  if (e.includes('casita') || e.includes('educat') || e.includes('acompaÃ±')) return 'Casita del Saber';
  return 'Desayuno Infantil';
};
const tipoAtencionDesde = (b) => (b.estrategia || '').toLowerCase().includes('itinerante') ? 'Atencion itinerante' : 'Atencion fija';
const modalidadDesde = (b) => (b.modalidad || '').toLowerCase().includes('institucion') ? 'Institucion Educativa' : 'Comunitaria';
const seguroDesde = (s) => (s || '').toLowerCase().includes('essalud') ? 'EsSalud' : (s || '').toLowerCase().includes('ningun') ? 'No tiene' : 'SIS';

// 1) Sedes
for (const s of defaultSedes) {
  const sid = `sede:\`${id(s.nombre)}\``;
  await db.query(`
    CREATE ${sid} SET nombre = $nom, distrito = $dist, direccion = $dir,
      referencia = $ref, facilitadora_nombre = $fac, facilitadora_tel = $factel,
      aliado_nombre = $aliado, aliado_institucion = $aliadoInst, aforo_max = $aforo, servicios = $serv,
      horario = $hor, estado = $estado, tipo_local = $tipo,
      coordenadas = NONE`,
    {
      nom: s.nombre, dist: s.distrito, dir: s.direccion, ref: s.referencia || '',
      fac: s.facilitadora || '', factel: s.facilitadoraTel || '',
      aliado: s.iglesiaAliada || s.tipoAliado || '',
      aliadoInst: s.tipoAliado || '',
      aforo: s.aforoMax || 1, serv: s.servicios || [],
      hor: s.horario || '', estado: s.estado || 'Operativa',
      tipo: ['Comedor Comunitario', 'Iglesia Aliada', 'Colegio Publico (I.E.)', 'Biblioteca Comunal', 'Local Comunal'].includes(s.tipoAliado) ? s.tipoAliado : 'Local Comunal',
    });
  console.log('sede OK', s.nombre);
}

const existentesRaw = await db.query(`SELECT id, numero_documento FROM persona`);
const existentesRows = Array.isArray(existentesRaw)
  ? (Array.isArray(existentesRaw[0]) ? existentesRaw[0] : (existentesRaw[0]?.result ?? existentesRaw[0]))
  : [];
const existentesMap = new Map((existentesRows || []).map(p => [String(p.numero_documento), p.id]));

// 2) Personas (beneficiarios) + inscripciones + tamizajes
for (const b of defaultBeneficiarios) {
  let pid;
  if (existentesMap.has(String(b.dni))) {
    pid = existentesMap.get(String(b.dni));
    console.log('persona YA EXISTE, se reutiliza:', b.dni);
  } else {
    pid = `persona:\`${id(b.codigo || b.dni)}\``;
    await db.query(`
    CREATE ${pid} SET nombres = $nom, apellidos = $ape, numero_documento = $dni,
      fecha_nacimiento = <datetime>$fn, sexo = $sexo, direccion = $dir,
      referencia = $ref, distrito = $dist, grado = $grado, nivel_educativo = $nivel,
      telefono = $tel, telefono_alt = $telalt, codigo = $cod,
      esquema_salud = $esquema`,
      {
        nom: b.nombres, ape: b.apellidos, dni: b.dni, fn: b.fechaNacimiento || null,
        sexo: b.sexo || 'M', dir: b.direccion || '', ref: b.referencia || '',
        dist: b.distrito || 'Otro', grado: b.grado || null, nivel: b.nivelEducativo || 'N.A.',
        tel: b.telefono || null, telalt: b.telefonoAlt || null, cod: b.codigo || '',
        esquema: seguroDesde(b.seguro),
      });
  }

  const sedeRef = defaultSedes.find(s => (b.sede || '').toLowerCase().includes((s.nombre || '').toLowerCase()));
  const sedeId = sedeRef ? `sede:\`${id(sedeRef.nombre)}\`` : null;
  if (sedeId) {
    await db.query(`
      CREATE inscripcion SET persona_id = ${pid}, sede_id = ${sedeId},
        programa = $prog, modalidad = $mod, tipo_atencion = $tipo,
        estado = $estado, periodo = 2026, activo = true`,
      { prog: programaDesde(b), mod: modalidadDesde(b), tipo: tipoAtencionDesde(b), estado: b.estado || 'Activo' });
  }

  if (b.hb != null && !existentesMap.has(String(b.dni))) {
    await db.query(`
      CREATE tamizaje_hemoglobina SET persona_id = ${pid},
        sede_id = ${sedeId || 'NONE'}, hb_valor = $hb, hb_ajustada = $hb, peso_kg = $peso, talla_cm = $talla,
        resultado = $rest, fecha_tamizaje = time::now(), activo = true`,
      { hb: b.hb, peso: b.peso || null, talla: b.talla || null, rest: (b.anemia || '').toLowerCase().includes('moderada') ? 'Anemia moderada' : (b.anemia || '').toLowerCase().includes('leve') ? 'Anemia leve' : 'Regular' });
  }
  console.log('persona OK', b.nombres, b.apellidos);
}

// 3) Voluntarios -> persona + persona_rol
for (const v of defaultVoluntarios) {
  if (existentesMap.has(String(v.dni))) { console.log('voluntario YA EXISTE:', v.dni); continue; }
  const vid = `persona:\`vol_${id(v.codigo || v.dni)}\``;
  await db.query(`
    CREATE ${vid} SET nombres = $nom, apellidos = $ape, numero_documento = $dni,
      fecha_nacimiento = <datetime>$fn, sexo = 'M', direccion = $dir, distrito = $dist,
      telefono = $tel, codigo = $cod`,
    { nom: v.nombres, ape: v.apellidos, dni: v.dni, fn: v.fechaNacimiento || null, dir: v.domicilio || '', dist: v.distrito || 'Otro', tel: v.celular || null, cod: v.codigo || '' });
  const sedeRef = defaultSedes.find(s => (v.sedeAsignada || '').toLowerCase().includes((s.nombre || '').toLowerCase()));
  const sedeId = sedeRef ? `sede:\`${id(sedeRef.nombre)}\`` : null;
  const rolMap = { 'Voluntaria Responsable': 'Voluntaria Responsable', 'Voluntaria de Apoyo': 'Voluntaria de Apoyo', 'Mediadora Lectora': 'Mediadora Lectora', 'AcompaÃ±ante Pedagogica': 'Acompanante Pedagogica', 'Pastoral Comunitario': 'Pastoral Comunitario', 'Facilitadora': 'Facilitadora', 'Promotora Educativa': 'Promotora Educativa', 'Trabajadora Social ASP': 'Trabajadora Social ASP', 'Coordinadora General': 'Coordinacion General' };
  await db.query(`
    CREATE persona_rol SET persona_id = ${vid}, rol = $rol, sede_id = ${sedeId || 'NONE'}, activo = true`,
    { rol: rolMap[v.rol] || 'Voluntaria de Apoyo' });
  console.log('voluntario OK', v.nombres);
}

// 4) Casos sociales
for (const c of defaultCasosSociales) {
  const menor = defaultBeneficiarios.find(b => (b.codigo || '') === c.codigo);
  const personaId = menor ? `persona:\`${id(menor.codigo || menor.dni)}\`` : null;
  const sedeRef = defaultSedes.find(s => (c.sede || '').toLowerCase().includes((s.nombre || '').toLowerCase()));
  const sedeId = sedeRef ? `sede:\`${id(sedeRef.nombre)}\`` : null;
  if (!personaId || !sedeId) { console.log('caso SKIP (sin persona/sede):', c.codigo); continue; }
  await db.query(`
    CREATE caso_social SET persona_id = ${personaId}, sede_id = ${sedeId},
      codigo_caso = $cod, etapa = $etapa, urgencia = $urg,
      tipo_problematica = $tipo, fecha_derivacion = <datetime>$fecha,
      quien_deriva_nombre = $nom, quien_deriva_cargo = $cargo, quien_deriva_tel = $tel,
      situacion_encontrada = $sit, acciones_previas = $acc,
      tiene_soporte_familiar = $soporte, detalle_soporte_familiar = $detalle, activo = true`,
    {
      cod: c.codigo || '', etapa: ['pendiente', 'en_evaluacion', 'canalizado', 'resuelto'].includes(c.etapa) ? c.etapa : 'pendiente',
      urg: c.urgencia || 'Media', tipo: (c.tipoProblematica || '').toLowerCase().includes('nutric') ? 'Nutricional / Abandono' : (c.tipoProblematica || '').toLowerCase().includes('educ') ? 'Educativo' : (c.tipoProblematica || '').toLowerCase().includes('salud') ? 'Salud' : (c.tipoProblematica || '').toLowerCase().includes('violen') ? 'Violencia' : 'Familiar',
      fecha: c.fechaDerivacion || null, nom: c.quienDeriva?.nombre || '', cargo: c.quienDeriva?.cargo || '', tel: c.quienDeriva?.telefono || null,
      sit: c.situacionEncontrada || c.detalle || '', acc: c.accionesPrevias || null,
      soporte: c.soporteFamiliar?.tiene || false, detalle: c.soporteFamiliar?.detalle || null,
    });
  console.log('caso OK', c.codigo);
}

console.log('MigraciÃ³n completada.');
await db.close();

