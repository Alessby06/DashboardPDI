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

// Consulta optimizada SurrealQL para obtener menores con apoderado, sede, inscripcion y tamizaje
const [beneficiariosCompletos] = await db.query(`
  SELECT *,
    (SELECT * FROM inscripcion WHERE persona_id = $parent.id AND activo = true LIMIT 1)[0] AS ins,
    (SELECT * FROM tamizaje_hemoglobina WHERE persona_id = $parent.id AND activo = true ORDER BY fecha_tamizaje DESC LIMIT 1)[0] AS tam,
    (SELECT cuidador_id.nombres AS c_nom, cuidador_id.apellidos AS c_ape, cuidador_id.numero_documento AS c_dni, parentesco FROM persona_vinculada WHERE menor_id = $parent.id LIMIT 1)[0] AS apo
  FROM persona
  WHERE string::starts_with(string::slice(codigo, 0, 3), 'PDI') OR id = persona:pdi_001;
`);

console.log('Total menores recuperados con joins:', beneficiariosCompletos.length);
console.log('Muestra de menor completo:');
const m = beneficiariosCompletos[0];
console.log({
  id: m.id,
  codigo: m.codigo,
  nombreCompleto: `${m.nombres} ${m.apellidos}`,
  dni: m.numero_documento,
  apoderado: m.apo ? `${m.apo.c_nom} ${m.apo.c_ape} (${m.apo.parentesco})` : 'Sin apoderado',
  programa: m.ins?.programa,
  sedeId: m.ins?.sede_id,
  hb: m.tam?.hb_valor,
  anemia: m.tam?.resultado,
  peso: m.tam?.peso_kg,
  talla: m.tam?.talla_cm,
});

// Prueba de consulta de casos sociales
const [casosCompletos] = await db.query(`
  SELECT *,
    persona_id.nombres AS p_nom,
    persona_id.apellidos AS p_ape,
    persona_id.codigo AS p_cod,
    sede_id.nombre AS s_nom
  FROM caso_social;
`);
console.log('Total casos recuperados:', casosCompletos.length);
console.log('Muestra caso social:', {
  codigo: casosCompletos[0].codigo_caso,
  menor: `${casosCompletos[0].p_nom} ${casosCompletos[0].p_ape}`,
  sede: casosCompletos[0].s_nom,
  urgencia: casosCompletos[0].urgencia,
  quienDeriva: casosCompletos[0].quien_deriva_nombre,
});

await db.close();
