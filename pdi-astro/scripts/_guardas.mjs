// ===========================================================================
//  GUARDAS PARA OPERACIONES DESTRUCTIVAS
// ===========================================================================
//  Regla unica: sin --apply, sin PDI_ALLOW_DESTRUCTIVE=1, sin backup reciente
//  y fuera de la lista blanca de base, no se escribe.
// ===========================================================================
import { existsSync, readdirSync, statSync } from 'node:fs';

export const BASES_PERMITIDAS = [
  { ns: 'johannes_gutenberg', db: 'infancia_saludable' },
];

const BACKUP_MAX_MS = 24 * 60 * 60 * 1000;

/** Ruta de backup: --backup, PDI_BACKUP o el .env ya parseado. */
export function backupDeEntorno(env = {}, argv = process.argv) {
  const i = argv.indexOf('--backup');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return process.env.PDI_BACKUP || env.PDI_BACKUP || '';
}

/** Campo que enlaza la inscripcion con la persona segun el esquema desplegado. */
export function campoUsuario(env = {}) {
  return String(env.PUBLIC_ESQUEMA_USUARIO || '') === '1' ? 'usuario_id' : 'persona_id';
}

/**
 * Un destino de export no debe pisar evidencia previa. Devuelve ok=false si
 * ya existe y tiene contenido, salvo --force.
 */
export function destinoSeguro(ruta, { force = false } = {}) {
  if (!ruta) return { ok: false, motivo: 'sin-destino' };
  if (!existsSync(ruta)) return { ok: true, motivo: 'nuevo' };
  const stats = statSync(ruta);
  if (stats.isFile()) {
    return { ok: false, motivo: 'archivo-existente', detalle: 'El destino es un archivo.' };
  }
  const entradas = readdirSync(ruta);
  if (entradas.length && !force) {
    return {
      ok: false,
      motivo: 'directorio-no-vacio',
      detalle: `${entradas.length} archivos; usa --force o un --out nuevo.`,
    };
  }
  return { ok: true, motivo: entradas.length ? 'forzado' : 'vacio' };
}

export function exigirPermiso({
  apply = false,
  backup = '',
  env = {},
  ns = '',
  db = '',
} = {}) {
  if (!apply) {
    return { ok: false, motivo: 'dry-run', detalle: 'Falta --apply: no se escribira nada.' };
  }
  if (String(env.PDI_ALLOW_DESTRUCTIVE || '') !== '1') {
    return {
      ok: false,
      motivo: 'sin-confirmacion',
      detalle: 'Falta PDI_ALLOW_DESTRUCTIVE=1 en el entorno.',
    };
  }
  if (!backup || !existsSync(backup)) {
    return {
      ok: false,
      motivo: 'sin-backup',
      detalle: `El backup indicado no existe: ${backup || '(vacio)'}`,
    };
  }
  let stats;
  try {
    stats = statSync(backup);
  } catch {
    return { ok: false, motivo: 'sin-backup', detalle: `No se pudo leer el backup: ${backup}` };
  }
  if (stats.isDirectory() && readdirSync(backup).length === 0) {
    return { ok: false, motivo: 'backup-vacio', detalle: `El directorio de backup esta vacio: ${backup}` };
  }
  if (Date.now() - stats.mtimeMs > BACKUP_MAX_MS) {
    return {
      ok: false,
      motivo: 'backup-viejo',
      detalle: `El backup tiene mas de 24 h: ${backup}`,
    };
  }
  if (ns || db) {
    const permitida = BASES_PERMITIDAS.some(b => b.ns === ns && b.db === db);
    if (!permitida) {
      return {
        ok: false,
        motivo: 'base-no-permitida',
        detalle: `La base ${ns}/${db} no esta en la lista blanca.`,
      };
    }
  } else {
    return {
      ok: false,
      motivo: 'base-no-especificada',
      detalle: 'Faltan ns/db: no se puede verificar la lista blanca.',
    };
  }
  return { ok: true, motivo: 'ok', detalle: `Autorizado sobre ${ns}/${db}.` };
}
