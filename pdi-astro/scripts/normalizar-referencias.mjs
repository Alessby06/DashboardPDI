// ===========================================================================
//  NORMALIZA REFERENCIAS CORRUPTAS O HUERFANAS
// ===========================================================================
//  Uso:
//    node scripts/normalizar-referencias.mjs
//    PDI_ALLOW_DESTRUCTIVE=1 node scripts/normalizar-referencias.mjs --apply \
//      --backup ../backups/incidente-2026-11-27/export
//
//  1. IDs de inscripcion con backticks literales -> inscripcion activa de la persona.
//  2. sede:ano_nuevo (inexistente) -> sede:a_o_nuevo (mismo nombre en el directorio).
//  No borra nada.
// ===========================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Surreal } from 'surrealdb';
import { exigirPermiso } from './_guardas.mjs';

function leerEnv(ruta = '.env') {
  const env = {};
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
  return env;
}

function argumento(nombre, defecto = '') {
  const i = process.argv.indexOf(nombre);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : defecto;
}

const lista = (res) => {
  const primera = Array.isArray(res) ? res[0] : res;
  return Array.isArray(primera) ? primera : [];
};

const apply = process.argv.includes('--apply');
const env = leerEnv();
const db = new Surreal();
let cambios = [];

try {
  await db.connect(env.PUBLIC_SURREAL_URL);
  await db.signin({
    username: env.SURREAL_USER,
    password: env.SURREAL_PASS,
    namespace: env.PUBLIC_SURREAL_NS,
    database: env.PUBLIC_SURREAL_DB,
  });
  await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });

  const sedes = lista(await db.query('SELECT VALUE id FROM sede;'));
  const sedesValidas = new Set(sedes.map(String));

  const [tamRes, insRes, aportesRes, asistenciasRes] = await Promise.all([
    db.query('SELECT id, persona_id, inscripcion_id, sede_id FROM tamizaje_hemoglobina;'),
    db.query('SELECT id, persona_id, activo FROM inscripcion;'),
    db.query('SELECT id, inscripcion_id FROM aporte;'),
    db.query('SELECT id, inscripcion_id FROM asistencia_diaria;'),
  ]);
  const tamizajes = lista(tamRes);
  const inscripciones = lista(insRes);
  const aportes = lista(aportesRes);
  const asistencias = lista(asistenciasRes);

  const activaPorPersona = new Map();
  for (const ins of inscripciones) {
    if (ins.activo !== true) continue;
    activaPorPersona.set(String(ins.persona_id), String(ins.id));
  }

  const corruptas = new Map(); // id corrupto -> id canónico
  const claveRef = (v) => String(v ?? '').replace(/[`⟨⟩]/g, '');
  for (const tam of tamizajes) {
    const iid = String(tam.inscripcion_id || '');
    if (!iid.includes('`')) continue;
    const canonica = activaPorPersona.get(String(tam.persona_id));
    if (!canonica) continue;
    corruptas.set(iid, canonica);
    corruptas.set(claveRef(iid), canonica);
    cambios.push({
      tipo: 'tamizaje_inscripcion', id: String(tam.id),
      antes: iid, despues: canonica,
    });
  }

  for (const aporte of aportes) {
    const iid = String(aporte.inscripcion_id || '');
    const canonica = corruptas.get(iid) || corruptas.get(claveRef(iid));
    if (!canonica) continue;
    cambios.push({ tipo: 'aporte_inscripcion', id: String(aporte.id), antes: iid, despues: canonica });
  }
  for (const asistencia of asistencias) {
    const iid = String(asistencia.inscripcion_id || '');
    const canonica = corruptas.get(iid) || corruptas.get(claveRef(iid));
    if (!canonica) continue;
    cambios.push({ tipo: 'asistencia_inscripcion', id: String(asistencia.id), antes: iid, despues: canonica });
  }

  // Sede inexistente con alias evidente.
  if (!sedesValidas.has('sede:ano_nuevo') && sedesValidas.has('sede:a_o_nuevo')) {
    for (const tam of tamizajes) {
      if (String(tam.sede_id || '') !== 'sede:ano_nuevo') continue;
      cambios.push({
        tipo: 'tamizaje_sede', id: String(tam.id),
        antes: 'sede:ano_nuevo', despues: 'sede:a_o_nuevo',
      });
    }
  }

  for (const c of cambios) {
    console.log(`${c.tipo.padEnd(22)} ${c.id} | ${c.antes} → ${c.despues}`);
  }

  if (!cambios.length) {
    console.log('[normalizar] Nada que normalizar.');
  } else if (!apply) {
    console.log(`[normalizar] dry-run: ${cambios.length} cambios, nada escrito.`);
  } else {
    const permiso = exigirPermiso({
      apply,
      backup: argumento('--backup', process.env.PDI_BACKUP || ''),
      env: process.env,
      ns: env.PUBLIC_SURREAL_NS,
      db: env.PUBLIC_SURREAL_DB,
    });
    if (!permiso.ok) {
      console.error(`[normalizar] Rechazado (${permiso.motivo}): ${permiso.detalle}`);
      process.exitCode = 2;
    } else {
      for (const c of cambios) {
        if (c.tipo === 'tamizaje_inscripcion') {
          await db.query(`UPDATE ${c.id} SET inscripcion_id = ${c.despues};`);
        } else if (c.tipo === 'aporte_inscripcion') {
          await db.query(`UPDATE ${c.id} SET inscripcion_id = ${c.despues};`);
        } else if (c.tipo === 'asistencia_inscripcion') {
          await db.query(`UPDATE ${c.id} SET inscripcion_id = ${c.despues};`);
        } else if (c.tipo === 'tamizaje_sede') {
          await db.query(`UPDATE ${c.id} SET sede_id = ${c.despues};`);
        }
      }
      const logRuta = join(
        dirname(resolve(argumento('--backup', '../backups/incidente-2026-11-27/export'))),
        `normalizacion-${Date.now()}.json`,
      );
      writeFileSync(logRuta, JSON.stringify({ generado: new Date().toISOString(), cambios }, null, 2), 'utf8');
      console.log(`[normalizar] ${cambios.length} referencias actualizadas. Log: ${logRuta}`);
    }
  }
} catch (err) {
  console.error('[normalizar] Fallo:', err?.message || err);
  process.exitCode = 1;
} finally {
  await db.close().catch(() => {});
}
