// ===========================================================================
//  Migración del Lote 1
// ===========================================================================
//  Uso:
//    node scripts/migrar-lote-1.mjs                          # dry-run, no escribe nada
//    node scripts/migrar-lote-1.mjs --apply                  # aplica con respaldo previo
//    node scripts/migrar-lote-1.mjs --apply --fix-cuidadores # además corrige el sexo
//    node scripts/migrar-lote-1.mjs --rollback               # restaura el último respaldo
//
//  El dry-run es el modo por defecto. El respaldo se guarda en backups/, que
//  está ignorado por git porque puede contener datos personales.
// ===========================================================================
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Surreal } from 'surrealdb';
import { conectarMigracion } from './conexion-migracion.mjs';
import {
  SEDES_OPERATIVAS,
} from '../src/data/opcionesBeneficiario.js';
import {
  claveCatalogo,
  migracionParentesco,
  normalizarParentesco,
  seguroDbAUi,
  seguroValido,
  modalidadDbAUi,
  modalidadValida,
  sedeConocida,
  SEDES_POR_DISTRITO,
} from '../src/scripts/core/catalogos.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');
const DIR_BACKUPS = resolve(RAIZ, 'backups');

// ---------------------------------------------------------------------------
//  Argumentos
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ROLLBACK = args.includes('--rollback');
const FIX_CUIDADORES = args.includes('--fix-cuidadores');
const ARCHIVO_ARG = args.find((a) => a.startsWith('--file='));
const ARCHIVO = ARCHIVO_ARG ? ARCHIVO_ARG.slice('--file='.length) : '';
if (APPLY && ROLLBACK) {
  console.error('No se puede usar --apply y --rollback a la vez.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
//  Entorno
// ---------------------------------------------------------------------------
function cargarEnv() {
  const env = {};
  const texto = readFileSync(resolve(RAIZ, '.env'), 'utf8');
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
  return env;
}

const env = cargarEnv();
const ESQUEMA_USUARIO = env.PUBLIC_ESQUEMA_USUARIO === '1';
const T_VINCULO = ESQUEMA_USUARIO ? 'usuario_vinculado' : 'persona_vinculada';
const F_USUARIO = ESQUEMA_USUARIO ? 'usuario_id' : 'persona_id';

// Sexo esperado por parentesco determinista. Los parentescos neutros
// (Cuidador Legal, Familiar, Otro, Hermano/a) no se corrigen solos.
const SEXO_ESPERADO = new Map([
  ['Madre', 'F'], ['Padre', 'M'], ['Abuela', 'F'], ['Abuelo', 'M'],
  ['Tía', 'F'], ['Tío', 'M'], ['Prima', 'F'], ['Primo', 'M'],
  ['Hermana', 'F'], ['Hermano', 'M'], ['Padrino', 'M'], ['Madrina', 'F'],
  ['Padrastro', 'M'], ['Madrastra', 'F'],
]);

// ---------------------------------------------------------------------------
//  Utilidades
// ---------------------------------------------------------------------------
function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
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
  if (!readdirSync(DIR_BACKUPS).length) return null;
  const archivos = readdirSync(DIR_BACKUPS)
    .filter((f) => f.startsWith('lote-1-backup-') && f.endsWith('.json'))
    .sort();
  return archivos.length ? resolve(DIR_BACKUPS, archivos[archivos.length - 1]) : null;
}

// ---------------------------------------------------------------------------
//  Conexión
// ---------------------------------------------------------------------------
async function conectar() {
  return await conectarMigracion({ esquema: false });
}

// ---------------------------------------------------------------------------
//  Recolección
// ---------------------------------------------------------------------------
async function recolectar(db) {
  const [parentescos] = await db.query(
    `SELECT parentesco, count() AS total FROM ${T_VINCULO} GROUP BY parentesco;`,
  );
  const [seguros] = await db.query(
    'SELECT esquema_salud, count() AS total FROM persona WHERE esquema_salud != NONE GROUP BY esquema_salud;',
  );
  const [modalidades] = await db.query(
    'SELECT modalidad, count() AS total FROM inscripcion WHERE modalidad != NONE GROUP BY modalidad;',
  );
  const [aportes] = await db.query(
    'SELECT count() AS total FROM aporte WHERE pct_exoneracion = NONE;',
  );
  const [sedes] = await db.query(
    'SELECT id, nombre, distrito FROM sede WHERE activo = true ORDER BY nombre;',
  );
  const [voluntarios] = await db.query(
    'SELECT sede_nombre, distrito, count() AS total FROM voluntario WHERE activo = true GROUP BY sede_nombre, distrito;',
  );
  const [vinculos] = await db.query(
    `SELECT parentesco, cuidador_id.sexo AS sexo, count() AS total FROM ${T_VINCULO} GROUP BY parentesco, cuidador_id.sexo;`,
  );
  const [personas] = await db.query(
    `SELECT id, codigo, distrito,
       (SELECT * FROM inscripcion WHERE ${F_USUARIO} = $parent.id AND activo = true LIMIT 1)[0] AS ins
     FROM persona;`,
  );
  return { parentescos, seguros, modalidades, aportes, sedes, voluntarios, vinculos, personas };
}

// ---------------------------------------------------------------------------
//  Reporte
// ---------------------------------------------------------------------------
function clasificarParentescos(rows) {
  const resultado = { migrar: [], sinCambio: [], revisar: [], total: 0 };
  for (const row of rows || []) {
    const original = row.parentesco ?? '';
    const total = numero(row.total);
    const clas = migracionParentesco(original);
    const item = { valor: original, total, destino: clas.destino };
    resultado.total += total;
    if (clas.accion === 'migrar') resultado.migrar.push(item);
    else if (clas.accion === 'sin_cambio') resultado.sinCambio.push(item);
    else resultado.revisar.push(item);
  }
  return resultado;
}

function clasificarValores(rows, campo, mapper, valido) {
  const resultado = { migrar: [], sinCambio: [], revisar: [], sinDato: [], total: 0 };
  for (const row of rows || []) {
    const original = row[campo] ?? '';
    const total = numero(row.total);
    resultado.total += total;
    if (!String(original).trim()) {
      resultado.sinDato.push({ valor: original, total });
      continue;
    }
    const destino = mapper(original);
    const item = { valor: original, total, destino };
    if (original === destino && valido(original)) resultado.sinCambio.push(item);
    else if (destino !== original && valido(destino)) resultado.migrar.push(item);
    else resultado.revisar.push(item);
  }
  return resultado;
}

function compararSedes(sedesNube) {
  const catalogo = SEDES_OPERATIVAS.map((s) => ({ nombre: s.nombre, distrito: s.distrito }));
  const nube = (sedesNube || []).map((s) => ({
    id: String(s.id),
    nombre: s.nombre || '',
    distrito: s.distrito || '',
  }));
  const clavesCatalogo = new Set(catalogo.map((s) => claveCatalogo(s.nombre)));
  const clavesNube = new Set(nube.map((s) => claveCatalogo(s.nombre)));
  return {
    catalogo,
    nube,
    faltanEnNube: catalogo.filter((s) => !clavesNube.has(claveCatalogo(s.nombre))),
    faltanEnCatalogo: nube.filter((s) => !clavesCatalogo.has(claveCatalogo(s.nombre))),
    distritos: SEDES_POR_DISTRITO,
  };
}

function analizarVoluntarios(rows) {
  const fuera = [];
  for (const row of rows || []) {
    const sede = String(row.sede_nombre || '').trim();
    if (!sede || !sedeConocida(sede)) {
      fuera.push({
        sede: sede || '(sin sede)',
        distrito: row.distrito || '',
        total: numero(row.total),
      });
    }
  }
  return { fuera };
}

function analizarDistritos(personas, sedesNube) {
  const mapaSedes = new Map((sedesNube || []).map((s) => [String(s.id), s]));
  const incoherentes = [];
  for (const p of personas || []) {
    if (!p.ins) continue;
    const sedeId = String(p.ins.sede_id || '');
    const sede = mapaSedes.get(sedeId);
    const distritoPersona = String(p.distrito || '');
    if (!sede) {
      incoherentes.push({
        codigo: p.codigo || '',
        persona: String(p.id),
        sedeId,
        motivo: 'sede_no_encontrada',
        distritoPersona,
      });
      continue;
    }
    if (claveCatalogo(distritoPersona) !== claveCatalogo(sede.distrito || '')) {
      incoherentes.push({
        codigo: p.codigo || '',
        persona: String(p.id),
        sede: sede.nombre || '',
        distritoPersona,
        distritoSede: sede.distrito || '',
      });
    }
  }
  return { incoherentes };
}

function analizarCuidadores(rows) {
  const neutrales = new Set(['Cuidador Legal', 'Familiar', 'Otro', 'Hermano/a']);
  const salida = { neutrales: [], posiblesIncoherencias: [] };
  for (const row of rows || []) {
    const parentesco = normalizarParentesco(row.parentesco || '');
    const sexo = String(row.sexo || '').toUpperCase();
    const total = numero(row.total);
    if (neutrales.has(parentesco)) {
      salida.neutrales.push({ parentesco, sexo: sexo || '(sin dato)', total });
    } else if (SEXO_ESPERADO.has(parentesco) && sexo && SEXO_ESPERADO.get(parentesco) !== sexo) {
      salida.posiblesIncoherencias.push({
        parentesco,
        sexo,
        esperado: SEXO_ESPERADO.get(parentesco),
        total,
      });
    }
  }
  return salida;
}

function construirReporte(datos) {
  const parentescos = clasificarParentescos(datos.parentescos);
  const seguros = clasificarValores(datos.seguros, 'esquema_salud', seguroDbAUi, seguroValido);
  const modalidades = clasificarValores(datos.modalidades, 'modalidad', modalidadDbAUi, modalidadValida);
  return {
    generado: new Date().toISOString(),
    esquema: ESQUEMA_USUARIO ? 'usuario' : 'persona',
    tablas: { vinculo: T_VINCULO },
    parentescos,
    seguros,
    modalidades,
    aportesSinPct: numero(datos.aportes?.[0]?.total),
    sedes: compararSedes(datos.sedes),
    voluntarios: analizarVoluntarios(datos.voluntarios),
    distritos: analizarDistritos(datos.personas, datos.sedes),
    cuidadores: analizarCuidadores(datos.vinculos),
  };
}

// ---------------------------------------------------------------------------
//  Presentación
// ---------------------------------------------------------------------------
function imprimirResumen(reporte, ruta) {
  const linea = (etiqueta, valor) => console.log(`  ${etiqueta.padEnd(34)} ${valor}`);
  console.log('');
  console.log('=== Lote 1 · ' + (APPLY ? 'APPLY' : ROLLBACK ? 'ROLLBACK' : 'DRY-RUN') + ' ===');
  linea('Esquema', reporte.esquema);
  linea('Tabla de vínculo', reporte.tablas.vinculo);
  linea('Vínculos con parentesco', reporte.parentescos.total);
  linea('  por migrar', reporte.parentescos.migrar.length + ' valores');
  linea('  por revisar', reporte.parentescos.revisar.length + ' valores');
  linea('Seguros', reporte.seguros.total);
  linea('  por migrar', reporte.seguros.migrar.length + ' valores');
  linea('  por revisar', reporte.seguros.revisar.length + ' valores');
  linea('Modalidades', reporte.modalidades.total);
  linea('  por migrar', reporte.modalidades.migrar.length + ' valores');
  linea('  por revisar', reporte.modalidades.revisar.length + ' valores');
  linea('Aportes sin pct_exoneracion', reporte.aportesSinPct);
  linea('Sedes en catálogo', reporte.sedes.catalogo.length);
  linea('Sedes en la nube', reporte.sedes.nube.length);
  linea('  faltan en la nube', reporte.sedes.faltanEnNube.length);
  linea('  fuera del catálogo', reporte.sedes.faltanEnCatalogo.length);
  linea('Voluntarios fuera de catálogo', reporte.voluntarios.fuera.length + ' grupos');
  linea('Distritos incoherentes', reporte.distritos.incoherentes.length);
  linea('Cuidadores con parentesco neutro', reporte.cuidadores.neutrales.length + ' grupos');
  linea('Cuidadores con sexo a revisar', reporte.cuidadores.posiblesIncoherencias.length + ' grupos');
  linea('Corregir sexo en --apply', APPLY ? (FIX_CUIDADORES ? 'sí' : 'no') : 'solo reporte');
  console.log('');
  if (ruta) console.log('Reporte completo:', ruta);
  console.log('');
}

// ---------------------------------------------------------------------------
//  Aplicación y reversión
// ---------------------------------------------------------------------------
async function recolectarCambios(db, reporte) {
  const cambios = [];
  for (const item of reporte.parentescos.migrar) {
    const [filas] = await db.query(
      `SELECT id, parentesco FROM ${T_VINCULO} WHERE parentesco = $valor;`,
      { valor: item.valor },
    );
    for (const fila of filas || []) {
      cambios.push({
        tabla: T_VINCULO,
        id: String(fila.id),
        campo: 'parentesco',
        antes: fila.parentesco,
        despues: item.destino,
      });
    }
  }
  for (const item of reporte.seguros.migrar) {
    const [filas] = await db.query(
      'SELECT id, esquema_salud FROM persona WHERE esquema_salud = $valor;',
      { valor: item.valor },
    );
    for (const fila of filas || []) {
      cambios.push({
        tabla: 'persona',
        id: String(fila.id),
        campo: 'esquema_salud',
        antes: fila.esquema_salud,
        despues: item.destino,
      });
    }
  }
  for (const item of reporte.modalidades.migrar) {
    const [filas] = await db.query(
      'SELECT id, modalidad FROM inscripcion WHERE modalidad = $valor;',
      { valor: item.valor },
    );
    for (const fila of filas || []) {
      cambios.push({
        tabla: 'inscripcion',
        id: String(fila.id),
        campo: 'modalidad',
        antes: fila.modalidad,
        despues: item.destino,
      });
    }
  }
  return cambios;
}

async function recolectarCambiosSexo(db) {
  const [filas] = await db.query(
    `SELECT id, parentesco, cuidador_id, cuidador_id.sexo AS sexo FROM ${T_VINCULO};`,
  );
  const porCuidador = new Map();
  for (const fila of filas || []) {
    const parentesco = normalizarParentesco(fila.parentesco || '');
    const esperado = SEXO_ESPERADO.get(parentesco);
    if (!esperado) continue;
    const id = String(fila.cuidador_id || '');
    if (!id) continue;
    if (!porCuidador.has(id)) {
      porCuidador.set(id, {
        id,
        sexo: String(fila.sexo || '').toUpperCase(),
        esperados: new Set(),
        vinculos: [],
      });
    }
    const grupo = porCuidador.get(id);
    grupo.esperados.add(esperado);
    grupo.vinculos.push(String(fila.id));
  }
  const cambios = [];
  for (const grupo of porCuidador.values()) {
    if (grupo.esperados.size !== 1) {
      console.warn(`[PDI] Cuidador ${grupo.id}: parentescos con sexo esperado en conflicto; no se corrige.`);
      continue;
    }
    const esperado = [...grupo.esperados][0];
    if (grupo.sexo && grupo.sexo !== esperado) {
      cambios.push({
        tabla: 'persona',
        id: grupo.id,
        campo: 'sexo',
        antes: grupo.sexo,
        despues: esperado,
        origen: `vinculos:${grupo.vinculos.join(',')}`,
      });
    }
  }
  return cambios;
}

async function aplicar(db, reporte) {
  const cambios = await recolectarCambios(db, reporte);
  if (FIX_CUIDADORES) {
    cambios.push(...await recolectarCambiosSexo(db));
  }
  if (!cambios.length) {
    console.log('No hay cambios que aplicar.');
    return;
  }
  const respaldo = {
    generado: new Date().toISOString(),
    esquema: reporte.esquema,
    cambios,
  };
  const ruta = guardarJson(`lote-1-backup-${marcaTiempo()}.json`, respaldo);
  console.log(`Respaldo con ${cambios.length} cambios: ${ruta}`);
  for (const cambio of cambios) {
    await db.query(
      `UPDATE type::record($rid) SET ${cambio.campo} = $destino;`,
      { rid: cambio.id, destino: cambio.despues },
    );
  }
  console.log(`Aplicados ${cambios.length} cambios.`);
}

async function revertir(db, archivo) {
  const ruta = archivo || ultimoRespaldo();
  if (!ruta) {
    console.error('No hay respaldo para revertir.');
    process.exit(1);
  }
  const respaldo = JSON.parse(readFileSync(ruta, 'utf8'));
  for (const cambio of respaldo.cambios || []) {
    await db.query(
      `UPDATE type::record($rid) SET ${cambio.campo} = $antes;`,
      { rid: cambio.id, antes: cambio.antes },
    );
  }
  console.log(`Revertidos ${(respaldo.cambios || []).length} cambios desde ${ruta}.`);
}

// ---------------------------------------------------------------------------
//  Principal
// ---------------------------------------------------------------------------
async function main() {
  const db = await conectar();
  try {
    if (ROLLBACK) {
      await revertir(db, ARCHIVO);
      return;
    }
    const datos = await recolectar(db);
    const reporte = construirReporte(datos);
    const ruta = guardarJson(`lote-1-${APPLY ? 'apply' : 'dry-run'}-${marcaTiempo()}.json`, reporte);
    imprimirResumen(reporte, ruta);
    if (APPLY) await aplicar(db, reporte);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migración del Lote 1:', err?.message || err);
  process.exit(1);
});
