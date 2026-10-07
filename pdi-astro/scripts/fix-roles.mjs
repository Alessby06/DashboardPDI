import { readFileSync } from 'node:fs';
import { Surreal } from 'surrealdb';
import { defaultVoluntarios } from '../src/data/fixtures/voluntarios.js';
import { defaultSedes } from '../src/data/fixtures/sedes.js';

const env = {};
for (const l of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const db = new Surreal();
await db.connect(env.PUBLIC_SURREAL_URL);
await db.signin({ username: env.PUBLIC_SURREAL_USER, password: env.PUBLIC_SURREAL_PASS, namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });
await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });
const id = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_');
const rolMap = { 'Voluntaria Responsable': 'Voluntaria Responsable', 'Voluntaria de Apoyo': 'Voluntaria de Apoyo', 'Mediadora Lectora': 'Mediadora Lectora', 'AcompaÃ±ante Pedagogica': 'Acompanante Pedagogica', 'Pastoral Comunitario': 'Pastoral Comunitario', 'Facilitadora': 'Facilitadora', 'Promotora Educativa': 'Promotora Educativa', 'Trabajadora Social ASP': 'Trabajadora Social ASP', 'Coordinadora General': 'Coordinacion General' };
for (const v of defaultVoluntarios) {
  const rows = await db.query('SELECT id FROM persona WHERE numero_documento = $d', { d: v.dni });
  const arr = rows[0]?.map ? rows[0] : (rows[0]?.result || []);
  const pid = arr?.[0]?.id ?? rows[0]?.[0]?.id;
  if (!pid) { console.log('persona no encontrada', v.dni); continue; }
  const sedeRef = defaultSedes.find(s => (v.sedeAsignada || '').toLowerCase().includes((s.nombre || '').toLowerCase()));
  const sedeSql = sedeRef ? `sede:\`${id(sedeRef.nombre)}\`` : 'NONE';
  const pidStr = String(pid).includes(':') ? String(pid) : `persona:\`${pid}\``;
  await db.query(`CREATE persona_rol SET persona_id = ${pidStr}, rol = $rol, sede_id = ${sedeSql}, activo = true`, { rol: rolMap[v.rol] || 'Voluntaria de Apoyo' });
  console.log('rol OK', v.nombres);
}
const c = await db.query('SELECT count() FROM persona_rol GROUP ALL');
console.log('persona_rol', JSON.stringify(c));
await db.close();

