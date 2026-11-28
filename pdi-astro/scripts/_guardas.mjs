// ===========================================================================
//  GUARDAS PARA OPERACIONES DESTRUCTIVAS
// ===========================================================================
//  Regla unica: sin --apply, sin PDI_ALLOW_DESTRUCTIVE=1, sin backup reciente
//  y fuera de la lista blanca de base, no se escribe.
// ===========================================================================
import { existsSync, statSync } from 'node:fs';

export const BASES_PERMITIDAS = [
  { ns: 'johannes_gutenberg', db: 'infancia_saludable' },
];

const BACKUP_MAX_MS = 24 * 60 * 60 * 1000;

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
  }
  return { ok: true, motivo: 'ok', detalle: `Autorizado sobre ${ns}/${db}.` };
}
