import { readFileSync } from 'node:fs';
import { Surreal } from 'surrealdb';
const env = {};
for (const l of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const db = new Surreal();
await db.connect(env.PUBLIC_SURREAL_URL);
await db.signin({ username: env.PUBLIC_SURREAL_USER, password: env.PUBLIC_SURREAL_PASS, namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });
await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });
const p = await db.select('persona');
console.log('persona select elem0 keys:', p && p[0] && Object.keys(p[0]), p && p[0] && p[0].id, Array.isArray(p[0]));
const c1 = await db.query('SELECT count() FROM persona GROUP ALL');
console.log('persona count via query:', JSON.stringify(c1));
const c2 = await db.query('SELECT id FROM persona LIMIT 5');
console.log('persona ids:', JSON.stringify(c2).slice(0, 500));
const s = await db.select('sede');
console.log('sede:', Array.isArray(s) ? s.length : typeof s);
await db.close();
