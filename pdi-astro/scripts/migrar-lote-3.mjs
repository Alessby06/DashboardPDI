// ===========================================================================
//  Migración de datos del Lote 3 · Alineación con el modelo oficial
// ===========================================================================
//  Traduce los datos al formato de los documentos del programa (la carpeta
//  "Proyecto Infancia Saludable"):
//
//    - persona.codigo: "PDI-2026-007" -> "0007-IS2026" (ficha A1:
//      CODIGO DE USUARIO: 0001-IS2026).
//    - inscripcion.programa: "Mixto" -> la estrategia principal. El programa
//      no tiene un programa "Mixto": la estrategia es una de las tres.
//    - inscripcion.modalidad: "Institucion Educativa" -> "I.E." (la ficha
//      escribe COMUNITARIA o I.E.).
//    - inscripcion.tipo_atencion: vacio en los servicios que no lo piden. La
//      modalidad de atencion (fija o itinerante) solo existe en Casita del
//      Saber (ficha A1 de Casita).
//
//  Los cambios que el esquema todavia no admite se saltan y se reportan:
//  primero va el esquema (migrar-esquema-lote-3.mjs) y despues se vuelve a
//  ejecutar este script.
//
//  Uso:
//    node scripts/migrar-lote-3.mjs             # dry-run, no escribe nada
//    node scripts/migrar-lote-3.mjs --apply     # aplica con respaldo previo
//    node scripts/migrar-lote-3.mjs --rollback  # restaura el ultimo respaldo
// ===========================================================================
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conectarMigracion } from './conexion-migracion.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');
const DIR_BACKUPS = resolve(RAIZ, 'backups');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ROLLBACK = args.includes('--rollback');
const ARCHIVO_ARG = args.find((a) => a.startsWith('--file='));
const ARCHIVO = ARCHIVO_ARG ? ARCHIVO_ARG.slice('--file='.length) : '';
if (APPLY && ROLLBACK) {
  console.error('No se puede usar --apply y --rollback a la vez.');
  process.exit(1);
}

function marcaTiempo() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function guardarJson(nombre, datos) {
  mkdirSync(DIR_BACKUPS, { recursive: true });
  const ruta = resolve(DIR_BACKUPS, nombre);
  writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n', 'utf8');
  return ruta;
}

function ultimoRespaldo() {
  if (!existsSync(DIR_BACKUPS)) return null;
  const archivos = readdirSync(DIR_BACKUPS)
    .filter((f) => f.startsWith('lote-3-backup-') && f.endsWith('.json'))
    .sort();
  return archivos.length ? resolve(DIR_BACKUPS, archivos[archivos.length - 1]) : null;
}

/** "PDI-2026-007" -> "0007-IS2026". Devuelve null si no es de ese formato. */
function codigoOficial(codigo, anio) {
  const m = String(codigo || '').match(/^PDI-\d{4}-(\d+)$/);
  if (!m) return null;
  return `${String(parseInt(m[1], 10)).padStart(4, '0')}-IS${anio}`;
}

/** Valores que el esquema admite ahora mismo en un campo. */
async function valoresAdmitidos(db, tabla, campo) {
  const [info] = await db.query(`INFO FOR TABLE ${tabla};`);
  const definicion = info?.fields?.[campo] || '';
  const m = definicion.match(/INSIDE\s+\[(.*?)\]/s);
  if (!m) return null;
  return m[1].split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

async function recolectar(db) {
  const anio = new Date().getFullYear();
  const cambios = [];
  const pendientes = [];

  // 1) Codigo de usuario con el formato de la ficha A1.
  const [personas] = await db.query('SELECT id, codigo FROM persona WHERE codigo != NONE;');
  for (const persona of personas || []) {
    const oficial = codigoOficial(persona.codigo, anio);
    if (oficial && oficial !== persona.codigo) {
      cambios.push({
        tabla: 'persona', campo: 'codigo', id: String(persona.id),
        antes: persona.codigo, despues: oficial,
      });
    }
  }

  // 2) El programa no tiene "Mixto": la estrategia principal manda.
  const [inscripciones] = await db.query('SELECT id, programa, estrategias FROM inscripcion;');
  const admitsPrograma = await valoresAdmitidos(db, 'inscripcion', 'programa');
  for (const inscripcion of inscripciones || []) {
    const lista = Array.isArray(inscripcion.estrategias) ? inscripcion.estrategias : [];
    if (!lista.length) continue;
    const principal = lista[0];
    if (inscripcion.programa === principal) continue;
    if (admitsPrograma && !admitsPrograma.includes(principal)) {
      pendientes.push({
        tabla: 'inscripcion', campo: 'programa', id: String(inscripcion.id),
        antes: inscripcion.programa, despues: principal,
        motivo: `el esquema todavia no admite "${principal}"`,
      });
      continue;
    }
    cambios.push({
      tabla: 'inscripcion', campo: 'programa', id: String(inscripcion.id),
      antes: inscripcion.programa, despues: principal,
    });
  }

  // 3) Modalidad: el valor del programa es "I.E.".
  const admiteModalidad = await valoresAdmitidos(db, 'inscripcion', 'modalidad');
  const [modalidades] = await db.query('SELECT id, modalidad FROM inscripcion;');
  for (const fila of modalidades || []) {
    if (fila.modalidad !== 'Institución Educativa') continue;
    if (admiteModalidad && !admiteModalidad.includes('I.E.')) {
      pendientes.push({
        tabla: 'inscripcion', campo: 'modalidad', id: String(fila.id),
        antes: fila.modalidad, despues: 'I.E.',
        motivo: 'el esquema todavia no admite "I.E."',
      });
      continue;
    }
    cambios.push({
      tabla: 'inscripcion', campo: 'modalidad', id: String(fila.id),
      antes: fila.modalidad, despues: 'I.E.',
    });
  }

  // 4) La modalidad de atencion solo existe en Casita del Saber.
  const admiteAtencion = await valoresAdmitidos(db, 'inscripcion', 'tipo_atencion');
  const admiteVacio = !admiteAtencion || admiteAtencion.length === 0;
  for (const inscripcion of inscripciones || []) {
    const esCasita = (inscripcion.estrategias || []).includes('Casita del Saber')
      || inscripcion.programa === 'Casita del Saber';
    if (esCasita) continue;
    if (!admiteVacio) {
      pendientes.push({
        tabla: 'inscripcion', campo: 'tipo_atencion', id: String(inscripcion.id),
        antes: 'Atención fija', despues: '(vacio)',
        motivo: 'el esquema todavia no admite un valor vacio',
      });
      continue;
    }
    cambios.push({
      tabla: 'inscripcion', campo: 'tipo_atencion', id: String(inscripcion.id),
      antes: 'Atención fija', despues: null,
    });
  }

  return { cambios, pendientes };
}

function imprimirPlan(cambios, pendientes, ruta) {
  console.log('');
  console.log('=== Lote 3 · datos · ' + (APPLY ? 'APPLY' : ROLLBACK ? 'ROLLBACK' : 'DRY-RUN') + ' ===');
  if (!cambios.length) console.log('No hay cambios que aplicar.');
  for (const cambio of cambios) {
    console.log(`${cambio.tabla}.${cambio.campo}: ${cambio.antes} -> ${cambio.despues ?? '(vacio)'}  (${cambio.id})`);
  }
  if (pendientes.length) {
    console.log('\nPendientes de esquema (no se tocan):');
    for (const pendiente of pendientes) {
      console.log(`  ${pendiente.tabla}.${pendiente.campo}: ${pendiente.antes} -> ${pendiente.despues} · ${pendiente.motivo}`);
    }
  }
  console.log(`\nTotal: ${cambios.length} cambio(s) · ${pendientes.length} pendiente(s).`);
  console.log('');
  if (ruta) console.log('Reporte completo:', ruta);
  console.log('');
}

async function aplicar(db, cambios) {
  if (!cambios.length) {
    console.log('No hay cambios que aplicar.');
    return;
  }
  const ruta = guardarJson(`lote-3-backup-${marcaTiempo()}.json`, {
    generado: new Date().toISOString(),
    cambios,
  });
  console.log(`Respaldo de datos: ${ruta}`);
  for (const cambio of cambios) {
    if (cambio.despues === null) {
      await db.query(`UPDATE type::record($rid) REMOVE ${cambio.campo};`, { rid: cambio.id });
    } else {
      await db.query(`UPDATE type::record($rid) SET ${cambio.campo} = $valor;`, {
        rid: cambio.id, valor: cambio.despues,
      });
    }
  }
  console.log(`Aplicados ${cambios.length} cambios de datos.`);
}

async function revertir(db, archivo) {
  const ruta = archivo || ultimoRespaldo();
  if (!ruta) {
    console.error('No hay respaldo de datos para revertir.');
    process.exit(1);
  }
  const respaldo = JSON.parse(readFileSync(ruta, 'utf8'));
  for (const cambio of respaldo.cambios || []) {
    await db.query(`UPDATE type::record($rid) SET ${cambio.campo} = $valor;`, {
      rid: cambio.id, valor: cambio.antes,
    });
  }
  console.log(`Revertidos ${(respaldo.cambios || []).length} cambios de datos desde ${ruta}.`);
}

async function main() {
  const db = await conectarMigracion({ esquema: false });
  try {
    if (ROLLBACK) {
      await revertir(db, ARCHIVO);
      return;
    }
    const { cambios, pendientes } = await recolectar(db);
    const ruta = guardarJson(
      `lote-3-${APPLY ? 'apply' : 'dry-run'}-${marcaTiempo()}.json`,
      { generado: new Date().toISOString(), cambios, pendientes },
    );
    imprimirPlan(cambios, pendientes, ruta);
    if (APPLY) await aplicar(db, cambios);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migracion de datos del Lote 3:', err?.message || err);
  process.exit(1);
});
