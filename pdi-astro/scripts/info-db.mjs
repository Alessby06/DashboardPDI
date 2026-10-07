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

for (const t of ['sede', 'caso_social', 'tamizaje_hemoglobina', 'inscripcion', 'persona_vinculada', 'autorizado_salida']) {
  const info = await db.query(`INFO FOR TABLE ${t};`);
  console.log(`=== INFO FOR TABLE ${t} ===`);
  const fields = info[0]?.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    console.log(`  ${k}: ${v}`);
  }
}

await db.close();
