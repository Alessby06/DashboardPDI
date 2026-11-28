// ===========================================================================
//  REPARACION DE INSCRIPCIONES DESDE UN MANIFIESTO
// ===========================================================================
//  Uso:
//    node scripts/reparar-inscripciones.mjs --manifest ../backups/.../manifiesto.json
//    PDI_ALLOW_DESTRUCTIVE=1 node scripts/reparar-inscripciones.mjs \
//      --manifest ... --apply --backup ../backups/.../export
//
//  Solo procesa filas con accion "reconstruir". Las de "requiere_revision"
//  quedan fuera salvo --incluir-revision. Todo el alta va en una transaccion:
//  si una fila falla, no se crea ninguna.
// ===========================================================================
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Surreal } from 'surrealdb';
import { exigirPermiso, campoUsuario } from './_guardas.mjs';

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

function q(valor) {
  return `'${String(valor ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function idSeguro(id) {
  const texto = String(id || '').trim();
  if (!texto.startsWith('inscripcion:')) return '';
  if (texto.includes('`')) return '';
  if (texto.includes(';') || texto.includes('\n')) return '';
  return texto;
}

const manifiestoRuta = resolve(argumento('--manifest', '../backups/incidente-2026-11-27/manifiesto.json'));
if (!existsSync(manifiestoRuta)) {
  console.error('[reparar] No existe el manifiesto:', manifiestoRuta);
  process.exit(2);
}
const manifiesto = JSON.parse(readFileSync(manifiestoRuta, 'utf8'));
const incluirRevision = process.argv.includes('--incluir-revision');
const apply = process.argv.includes('--apply');

const filas = (manifiesto.filas || []).filter(f =>
  f.accion === 'reconstruir' || (incluirRevision && f.accion === 'requiere_revision'));

if (!filas.length) {
  console.error('[reparar] El manifiesto no tiene filas para reconstruir.');
  process.exit(2);
}

const usados = new Set();
const plan = [];
const omitidas = [];
for (const fila of filas) {
  if (!fila.personaId || !fila.sedeId || !fila.programa || !fila.modalidad || !fila.estrategias?.length) {
    omitidas.push({ codigo: fila.codigo, motivo: 'Faltan campos obligatorios.' });
    continue;
  }
  let id = idSeguro(fila.inscripcionIdOriginal);
  if (id && usados.has(id)) id = '';
  if (id) usados.add(id);
  plan.push({ ...fila, idFinal: id });
}

const env = leerEnv();
const campo = campoUsuario(env);
if (apply) {
  const permiso = exigirPermiso({
    apply,
    backup: argumento('--backup', process.env.PDI_BACKUP || ''),
    env: process.env,
    ns: env.PUBLIC_SURREAL_NS,
    db: env.PUBLIC_SURREAL_DB,
  });
  if (!permiso.ok) {
    console.error(`[reparar] Rechazado (${permiso.motivo}): ${permiso.detalle}`);
    process.exit(2);
  }
}

const listaQuery = (res) => {
  const primera = Array.isArray(res) ? res[0] : res;
  return Array.isArray(primera) ? primera : [];
};

const db = new Surreal();
let antes = null;
try {
  await db.connect(env.PUBLIC_SURREAL_URL);
  await db.signin({
    username: env.SURREAL_USER,
    password: env.SURREAL_PASS,
    namespace: env.PUBLIC_SURREAL_NS,
    database: env.PUBLIC_SURREAL_DB,
  });
  await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });

  // Idempotencia: nunca crear una segunda inscripcion activa para la misma persona.
  const activasRes = await db.query(`SELECT VALUE ${campo} FROM inscripcion WHERE activo = true;`);
  const conActiva = new Set(listaQuery(activasRes).map(String));
  const efectivas = [];
  for (const fila of plan) {
    if (conActiva.has(String(fila.personaId))) {
      omitidas.push({ codigo: fila.codigo, motivo: 'Ya tiene inscripcion activa.' });
    } else {
      efectivas.push(fila);
    }
  }

  console.log(`[reparar] manifiesto: ${manifiestoRuta}`);
  console.log(`[reparar] filas a crear: ${efectivas.length}; omitidas: ${omitidas.length}`);
  for (const fila of efectivas) {
    console.log(`  ${fila.codigo} → ${fila.sedeId} / ${fila.programa} / ${fila.modalidad}${fila.idFinal ? ` (id ${fila.idFinal})` : ' (id nuevo)'}`);
  }
  for (const fila of omitidas) console.log(`  OMITIDA ${fila.codigo}: ${fila.motivo}`);

  if (!apply) {
    console.log('[reparar] dry-run: no se escribio nada. Agrega --apply con backup y PDI_ALLOW_DESTRUCTIVE=1.');
  } else if (!efectivas.length) {
    console.log('[reparar] Nada pendiente: todas las filas del manifiesto ya tienen inscripcion activa.');
  } else {
    const sentencias = efectivas.map((fila) => {
      const destino = fila.idFinal ? fila.idFinal : 'inscripcion';
      return `CREATE ${destino} CONTENT {
        ${campo}: ${fila.personaId},
        sede_id: ${fila.sedeId},
        programa: ${q(fila.programa)},
        estrategias: [${fila.estrategias.map(q).join(', ')}],
        modalidad: ${q(fila.modalidad)},
        periodo: ${Number(fila.periodo) || 2026},
        estado: 'Activo',
        activo: true,
        reconstruida_el: time::now(),
        origen_reconstruccion: 'incidente-2026-11-27'
      };`;
    });

    const previo = await db.query('SELECT count() FROM inscripcion GROUP ALL;');
    antes = listaQuery(previo)?.[0]?.count ?? 0;

    await db.query(`BEGIN;\n${sentencias.join('\n')}\nCOMMIT;`);

    const despuesRes = await db.query('SELECT count() FROM inscripcion GROUP ALL;');
    const despues = listaQuery(despuesRes)?.[0]?.count ?? 0;

    const log = {
      generado: new Date().toISOString(),
      manifiesto: manifiestoRuta,
      antes,
      despues,
      creadas: despues - antes,
      filas: efectivas.map(f => ({
        codigo: f.codigo, personaId: f.personaId, sedeId: f.sedeId,
        programa: f.programa, modalidad: f.modalidad, id: f.idFinal || '(nuevo)',
      })),
      omitidas,
    };
    const logRuta = join(dirname(manifiestoRuta), `reparacion-${Date.now()}.json`);
    writeFileSync(logRuta, JSON.stringify(log, null, 2), 'utf8');
    console.log(`[reparar] OK: ${log.creadas} inscripciones creadas (${antes} → ${despues}).`);
    console.log(`[reparar] log: ${logRuta}`);
  }
} catch (err) {
  console.error('[reparar] Fallo; la transaccion no se confirmo:', err?.message || err);
  process.exitCode = 1;
} finally {
  await db.close().catch(() => {});
}
