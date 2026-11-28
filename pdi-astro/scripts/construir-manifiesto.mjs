// ===========================================================================
//  MANIFIESTO DE RECONSTRUCCION (SOLO LECTURA)
// ===========================================================================
//  Uso:
//    node scripts/construir-manifiesto.mjs --out ../backups/incidente-2026-11-27
//
//  Cruza personas sin inscripcion con el fixture anterior a ee1da5b, los
//  tamizajes, los casos sociales y los aportes. No escribe en la base.
//  Cada campo lleva su fuente; lo que no tiene evidencia queda en `faltantes`.
// ===========================================================================
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Surreal } from 'surrealdb';
import { campoUsuario } from './_guardas.mjs';

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

function clave(valor) {
  return String(valor ?? '').trim().replace(/^[a-z_]+:/i, '').replace(/[`⟨⟩]/g, '');
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function leerFixture(ruta) {
  const texto = readFileSync(ruta, 'utf8');
  const inicio = texto.indexOf('export const defaultBeneficiarios');
  if (inicio < 0) throw new Error('No se encontro defaultBeneficiarios en el fixture.');
  const desde = texto.indexOf('[', inicio);
  const hasta = texto.lastIndexOf(']');
  if (desde < 0 || hasta < 0) throw new Error('No se pudo delimitar el arreglo del fixture.');
  const cuerpo = texto
    .slice(desde, hasta + 1)
    .replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(cuerpo);
}

function programaDesde(b) {
  const texto = `${b.estrategia || ''} ${(b.servicios || []).join(' ')}`.toLowerCase();
  const casita = /casita|educat|acompan|acompañ/.test(texto);
  const nutricion = /desayuno|nutric|alimento|lonchera/.test(texto);
  if (casita && nutricion) return 'Mixto';
  if (casita) return 'Casita del Saber';
  if (/lonchera/.test(texto)) return 'Lonchera Infantil';
  return 'Desayuno Infantil';
}

function estrategiasDesde(programa) {
  if (programa === 'Mixto') return ['Desayuno Infantil', 'Casita del Saber'];
  if (programa === 'Casita del Saber') return ['Casita del Saber'];
  if (programa === 'Lonchera Infantil') return ['Lonchera Infantil'];
  return ['Desayuno Infantil'];
}

const salida = resolve(argumento('--out', '../backups/incidente-2026-11-27'));
const force = process.argv.includes('--force');
for (const nombre of ['manifiesto.json', 'manifiesto.csv']) {
  const ruta = join(salida, nombre);
  if (existsSync(ruta) && !force) {
    console.error(`[manifiesto] Ya existe ${ruta}. Usa --force o un --out nuevo; no se pisa la evidencia.`);
    process.exit(2);
  }
}
const fixtureRuta = resolve(argumento(
  '--fixture',
  '../backups/incidente-2026-11-27/fixture-pre-ee1da5b.js',
));
mkdirSync(salida, { recursive: true });
const fixture = leerFixture(fixtureRuta);

const env = leerEnv();
const campo = campoUsuario(env);
const db = new Surreal();
await db.connect(env.PUBLIC_SURREAL_URL);
await db.signin({
  username: env.SURREAL_USER,
  password: env.SURREAL_PASS,
  namespace: env.PUBLIC_SURREAL_NS,
  database: env.PUBLIC_SURREAL_DB,
});
await db.use({ namespace: env.PUBLIC_SURREAL_NS, database: env.PUBLIC_SURREAL_DB });

const [personasRes, tamizajesRes, casosRes, aportesRes, inscripcionesRes, sedesRes] = await Promise.all([
  db.query(`SELECT id, codigo, nombres, apellidos, numero_documento AS dni,
    activo, creado_el FROM persona
    WHERE activo = true AND string::lowercase(codigo) CONTAINS '-is'
      AND id NOT IN (SELECT VALUE ${campo} FROM inscripcion WHERE activo = true);`),
  db.query(`SELECT id, ${campo} AS persona_id, sede_id, inscripcion_id, fecha_tamizaje FROM tamizaje_hemoglobina WHERE activo = true;`),
  db.query('SELECT id, usuario_id AS persona_id, sede_id, codigo_caso, etapa FROM caso_social WHERE activo = true;'),
  db.query('SELECT id, inscripcion_id, periodo, mes FROM aporte;'),
  db.query(`SELECT id, ${campo} AS persona_id, activo, estado, periodo, programa, sede_id FROM inscripcion;`),
  db.query('SELECT id, nombre, distrito, activo FROM sede;'),
]);
const filas = (res) => {
  const primera = Array.isArray(res) ? res[0] : res;
  return Array.isArray(primera) ? primera : [];
};

const personas = filas(personasRes);
const tamizajes = filas(tamizajesRes);
const casos = filas(casosRes);
const aportes = filas(aportesRes);
const inscripciones = filas(inscripcionesRes);
const sedes = filas(sedesRes);
const sedesValidas = new Set(sedes.map(s => String(s.id)));

// El seed viejo dejo referencias a sede:ano_nuevo, que ya no existe: la sede
// vigente del Directorio Territorial es sede:a_o_nuevo (mismo nombre).
const ALIAS_SEDES = new Map([
  ['sede:ano_nuevo', 'sede:a_o_nuevo'],
]);
const normalizarSede = (id) => {
  const valor = String(id || '');
  return ALIAS_SEDES.get(valor) || valor;
};

const porPersona = (lista, campo = 'persona_id') => {
  const mapa = new Map();
  for (const fila of lista) {
    const pid = clave(fila[campo]);
    if (!mapa.has(pid)) mapa.set(pid, []);
    mapa.get(pid).push(fila);
  }
  return mapa;
};
const tamizajesPorPersona = porPersona(tamizajes);
const casosPorPersona = porPersona(casos);

const fixturePorDni = new Map(fixture.filter(b => b.dni).map(b => [String(b.dni), b]));
const fixturePorNombre = new Map(fixture.map(b => [
  normalizarTexto(`${b.nombres} ${b.apellidos}`), b,
]));

const manifiesto = [];
for (const persona of personas) {
  const pid = clave(persona.id);
  const tam = (tamizajesPorPersona.get(pid) || [])
    .slice()
    .sort((a, b) => new Date(b.fecha_tamizaje).getTime() - new Date(a.fecha_tamizaje).getTime());
  const casosPersona = casosPorPersona.get(pid) || [];
  const caso = casosPersona[0] || null;

  const nombreNorm = normalizarTexto(`${persona.nombres} ${persona.apellidos}`);
  const porDni = persona.dni ? fixturePorDni.get(String(persona.dni)) : null;
  const porNombre = fixturePorNombre.get(nombreNorm) || null;
  const base = porDni || porNombre || null;

  const sedeTam = normalizarSede(tam.find(t => t.sede_id)?.sede_id);
  const sedeCaso = normalizarSede(caso?.sede_id);
  const sedes = [...new Set([sedeTam, sedeCaso].filter(Boolean).map(String))];
  const sedeId = sedeTam || sedeCaso || '';

  const programa = base ? programaDesde(base) : '';
  const modalidad = base
    ? (/instituc/i.test(String(base.modalidad || '')) ? 'Institución Educativa' : 'Comunitaria')
    : '';
  const estrategias = programa ? estrategiasDesde(programa) : [];

  const idsOriginales = [...new Set(tam.map(t => String(t.inscripcion_id || '')).filter(Boolean))]
    .filter(id => !id.includes('`'));
  const inscripcionIdOriginal = idsOriginales[0] || '';

  const periodos = aportes
    .filter(a => idsOriginales.includes(String(a.inscripcion_id || '')))
    .map(a => Number(a.periodo))
    .filter(Boolean);
  const periodo = periodos[0] || (persona.creado_el ? new Date(persona.creado_el).getFullYear() : 2026);

  const faltantes = [];
  if (!sedeId) faltantes.push('sede');
  if (sedeId && !sedesValidas.has(sedeId)) faltantes.push('sede-inexistente');
  if (!programa) faltantes.push('programa');
  if (!modalidad) faltantes.push('modalidad');
  if (!inscripcionIdOriginal) faltantes.push('inscripcionIdOriginal');

  let accion = 'reconstruir';
  let motivo = 'Coincide con el fixture y tiene sede.';
  if (!base) {
    if (tam.length > 0) {
      accion = 'requiere_revision';
      motivo = 'Sin coincidencia en el fixture, pero tiene historial clinico: confirmar identidad y programa.';
    } else {
      accion = 'no_reconstruir';
      motivo = 'Sin coincidencia en el fixture ni historial clinico: registro de prueba.';
    }
  } else if (sedes.length > 1) {
    accion = 'requiere_revision';
    motivo = `Sede en conflicto: tamizaje=${sedeTam || '-'}, caso=${sedeCaso || '-'}.`;
  } else if (normalizarTexto(`${base.nombres} ${base.apellidos}`) !== nombreNorm) {
    accion = 'requiere_revision';
    motivo = 'El codigo coincide con el fixture pero el nombre no: confirmar identidad.';
  }

  manifiesto.push({
    personaId: String(persona.id),
    codigo: persona.codigo || '',
    nombres: persona.nombres || '',
    apellidos: persona.apellidos || '',
    dni: persona.dni || '',
    activo: persona.activo === true,
    accion,
    motivo,
    sedeId,
    sedesEvidencia: sedes,
    programa,
    modalidad,
    estrategias,
    periodo,
    estado: 'Activo',
    inscripcionIdOriginal,
    idsOriginales,
    evidencia: {
      sede: sedeTam ? (sedeCaso ? 'tamizaje+caso' : 'tamizaje') : (sedeCaso ? 'caso' : ''),
      programa: base ? 'fixture' : '',
      modalidad: base ? 'fixture' : '',
      periodo: periodos.length ? 'aporte' : 'persona.creado_el',
      identidad: porDni ? 'dni' : (porNombre ? 'nombre' : ''),
    },
    faltantes,
    tamizajes: tam.length,
    caso: caso?.codigo_caso || '',
  });
}

manifiesto.sort((a, b) => a.codigo.localeCompare(b.codigo));
const resumen = manifiesto.reduce((acc, fila) => {
  acc[fila.accion] = (acc[fila.accion] || 0) + 1;
  return acc;
}, {});

writeFileSync(join(salida, 'manifiesto.json'), JSON.stringify({
  generado: new Date().toISOString(),
  fixture: fixtureRuta,
  resumen,
  filas: manifiesto,
}, null, 2), 'utf8');

const csv = [
  'codigo,personaId,nombres,apellidos,dni,accion,sedeId,programa,modalidad,periodo,inscripcionIdOriginal,faltantes,motivo',
  ...manifiesto.map(f => [
    f.codigo, f.personaId, f.nombres, f.apellidos, f.dni, f.accion, f.sedeId,
    f.programa, f.modalidad, f.periodo, f.inscripcionIdOriginal,
    f.faltantes.join('|'), f.motivo,
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
].join('\n');
writeFileSync(join(salida, 'manifiesto.csv'), csv + '\n', 'utf8');

console.log(JSON.stringify({ resumen, filas: manifiesto.length, salida }, null, 2));
for (const f of manifiesto) {
  console.log(`${f.accion.padEnd(18)} ${f.codigo.padEnd(14)} ${f.sedeId.padEnd(22)} ${(f.programa || '-').padEnd(18)} ${f.motivo}`);
}
await db.close();
