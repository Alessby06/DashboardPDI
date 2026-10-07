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

await db.query(`UPDATE persona:pdi_001 SET codigo = 'PDI-2026-001';`);
console.log('Actualizado codigo en persona:pdi_001 a PDI-2026-001');

await db.close();
