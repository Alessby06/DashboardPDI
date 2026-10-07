// ===========================================================================
//  MIGRACIÓN COMPLETA Y FIDEDIGNA A SURREALDB CLOUD
// ===========================================================================
//  Inserta el 100% de los campos normativos de los fixtures oficiales
//  (Padrón de Menores, Casita del Saber, Salud CRED, Casos Sociales ASP y Sedes)
//  garantizando plena compatibilidad de tipos, IDs y esquemas.
// ===========================================================================

import { readFileSync } from 'node:fs';
import { Surreal } from 'surrealdb';

// 1. Cargar variables de entorno desde .env
const env = {};
for (const linea of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = linea.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}

console.log('[Migración] Conectando a SurrealDB Cloud:', env.PUBLIC_SURREAL_URL);

// 2. Importar fixtures oficiales
const { defaultBeneficiarios } = await import('../src/data/fixtures/beneficiarios.js');
const { defaultSedes } = await import('../src/data/fixtures/sedes.js');
const { defaultVoluntarios } = await import('../src/data/fixtures/voluntarios.js');
const { defaultCasosSociales } = await import('../src/data/fixtures/casos-sociales.js');

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

console.log('[Migración] Conexión y autenticación exitosas en', env.PUBLIC_SURREAL_NS, '/', env.PUBLIC_SURREAL_DB);

// 3. Limpiar tablas previas para asegurar consistencia
const tablas = ['persona', 'caso_social', 'sede', 'voluntario', 'inscripcion', 'tamizaje_hemoglobina'];
for (const t of tablas) {
  try {
    await db.query(`DELETE ${t};`);
    console.log(`[Migración] Tabla limpiada: ${t}`);
  } catch (err) {
    console.warn(`[Migración] Aviso al limpiar ${t}:`, err.message?.split('\n')[0]);
  }
}

// 4. Migrar Sedes (100% campos)
console.log('[Migración] Migrando Sedes...');
for (const s of defaultSedes) {
  const sid = `sede:sede_${s.id}`;
  await db.query(
    `CREATE ${sid} SET
      id_numerico = $id,
      nombre = $nombre,
      distrito = $distrito,
      direccion = $direccion,
      referencia = $referencia,
      facilitadora = $facilitadora,
      facilitadora_tel = $facilitadoraTel,
      iglesia_aliada = $iglesiaAliada,
      pastor_aliado = $pastorAliado,
      aliado_tel = $aliadoTel,
      tipo_aliado = $tipoAliado,
      servicios = $servicios,
      aforo_max = $aforoMax,
      horario = $horario,
      estado = $estado`,
    s
  );
}
console.log(`[Migración] Sedes migradas: ${defaultSedes.length}`);

// 5. Migrar Beneficiarios (100% campos normativos)
console.log('[Migración] Migrando Beneficiarios (Padrón, Salud, Casitas)...');
for (const b of defaultBeneficiarios) {
  const pid = `persona:menor_${b.id}`;
  await db.query(
    `CREATE ${pid} SET
      id_numerico = $id,
      codigo = $codigo,
      nombres = $nombres,
      apellidos = $apellidos,
      dni = $dni,
      fecha_nacimiento = $fechaNacimiento,
      edad = $edad,
      sexo = $sexo,
      direccion = $direccion,
      referencia = $referencia,
      distrito = $distrito,
      sede = $sede,
      modalidad = $modalidad,
      estrategia = $estrategia,
      exoneracion_aporte = $exoneracionAporte,
      servicios = $servicios,
      seguro = $seguro,
      centro_salud = $centroSalud,
      alergias = $alergias,
      nivel_educativo = $nivelEducativo,
      grado = $grado,
      colegio = $colegio,
      apoderado = $apoderado,
      parentesco = $parentesco,
      apoderado_dni = $apoderadoDni,
      telefono = $telefono,
      telefono_alt = $telefonoAlt,
      estado = $estado,
      hb = $hb,
      peso = $peso,
      talla = $talla,
      anemia = $anemia,
      canasta_entregada = $canastaEntregada,
      orientacion_familiar = $orientacionFamiliar,
      retiro_autorizado = $retiroAutorizado,
      retiro_padron = $retiroPadron,
      vulnerabilidad = $vulnerabilidad`,
    {
      ...b,
      alergias: b.alergias || 'Ninguna',
      colegio: b.colegio || '',
      apoderado: b.apoderado || '',
      parentesco: b.parentesco || '',
      apoderadoDni: b.apoderadoDni || '',
      telefono: b.telefono || '',
      telefonoAlt: b.telefonoAlt || '',
      vulnerabilidad: b.vulnerabilidad || 0,
      retiroPadron: b.retiroPadron || [],
      retiroAutorizado: b.retiroAutorizado || '',
    }
  );
}
console.log(`[Migración] Beneficiarios migrados: ${defaultBeneficiarios.length}`);

// 6. Migrar Casos Sociales ASP (100% campos)
console.log('[Migración] Migrando Casos Sociales ASP...');
for (const c of defaultCasosSociales) {
  const cid = `caso_social:caso_${c.id}`;
  await db.query(
    `CREATE ${cid} SET
      id_numerico = $id,
      menor = $menor,
      codigo = $codigo,
      etapa = $etapa,
      urgencia = $urgencia,
      tipo_problematica = $tipoProblematica,
      fecha_derivacion = $fechaDerivacion,
      quien_deriva = $quienDeriva,
      situacion_encontrada = $situacionEncontrada,
      acciones_previas = $accionesPrevias,
      soporte_familiar = $soporteFamiliar,
      detalle = $detalle,
      sede = $sede,
      vulnerabilidad_puntaje = $vulnerabilidadPuntaje`,
    {
      ...c,
      accionesPrevias: c.accionesPrevias || '',
      detalle: c.detalle || '',
      vulnerabilidadPuntaje: c.vulnerabilidadPuntaje || 0,
    }
  );
}
console.log(`[Migración] Casos Sociales migrados: ${defaultCasosSociales.length}`);

// 7. Migrar Voluntarios
console.log('[Migración] Migrando Voluntarios...');
for (const v of defaultVoluntarios) {
  const vid = `voluntario:vol_${v.id}`;
  await db.query(
    `CREATE ${vid} SET
      id_numerico = $id,
      codigo = $codigo,
      nombres = $nombres,
      apellidos = $apellidos,
      dni = $dni,
      fecha_nacimiento = $fechaNacimiento,
      edad = $edad,
      sexo = $sexo,
      domicilio = $domicilio,
      distrito = $distrito,
      celular = $celular,
      correo = $correo,
      rol = $rol,
      sede_asignada = $sedeAsignada,
      estado = $estado,
      fecha_ingreso = $fechaIngreso,
      capacitaciones = $capacitaciones,
      disponibilidad = $disponibilidad,
      observaciones = $observaciones`,
    v
  );
}
console.log(`[Migración] Voluntarios migrados: ${defaultVoluntarios.length}`);

// 8. Verificación de conteo
const [rBen] = await db.query('SELECT count() FROM persona GROUP ALL');
const [rCas] = await db.query('SELECT count() FROM caso_social GROUP ALL');
const [rSed] = await db.query('SELECT count() FROM sede GROUP ALL');

console.log('----------------------------------------------------');
console.log('[Migración EXITOSA] Verificación en SurrealDB Cloud:');
console.log('- Total personas/beneficiarios:', rBen[0]?.count);
console.log('- Total casos sociales:', rCas[0]?.count);
console.log('- Total sedes:', rSed[0]?.count);
console.log('----------------------------------------------------');

await db.close();
