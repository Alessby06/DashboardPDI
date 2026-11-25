// ===========================================================================
//  Migración de esquema: outbox de auditoría
// ===========================================================================
//  Tabla en la base clínica donde el navegador deja un evento cuando la API de
//  auditoría no responde. Cada fila lleva un sello firmado por el servidor con
//  la identidad del autor; el drenaje lo verifica antes de escribir en
//  bitacora_auditoria.
//
//  Uso:
//    node scripts/migrar-outbox-auditoria.mjs            # dry-run
//    node scripts/migrar-outbox-auditoria.mjs --apply    # aplica
//
//  El esquema lo cambia la cuenta de administración (SURREAL_ADMIN_USER /
//  SURREAL_ADMIN_PASS). pdi_web no puede definir campos.
//  Es idempotente: usa IF NOT EXISTS.
// ===========================================================================
import { conectarMigracion } from './conexion-migracion.mjs';

const SENTENCIAS = [
  'DEFINE TABLE IF NOT EXISTS auditoria_outbox SCHEMAFULL PERMISSIONS FULL;',
  'DEFINE FIELD IF NOT EXISTS evento_id ON auditoria_outbox TYPE string;',
  'DEFINE FIELD IF NOT EXISTS sello ON auditoria_outbox TYPE string;',
  'DEFINE FIELD IF NOT EXISTS payload ON auditoria_outbox TYPE object FLEXIBLE;',
  'DEFINE FIELD IF NOT EXISTS creado_el ON auditoria_outbox TYPE datetime DEFAULT time::now();',
  'DEFINE FIELD IF NOT EXISTS enviado_el ON auditoria_outbox TYPE option<datetime>;',
  'DEFINE FIELD IF NOT EXISTS intentos ON auditoria_outbox TYPE int DEFAULT 0;',
  'DEFINE FIELD IF NOT EXISTS ultimo_error ON auditoria_outbox TYPE option<string>;',
  'DEFINE INDEX IF NOT EXISTS idx_outbox_evento ON auditoria_outbox FIELDS evento_id UNIQUE;',
  'DEFINE INDEX IF NOT EXISTS idx_outbox_pendiente ON auditoria_outbox FIELDS enviado_el;',
];

const APPLY = process.argv.includes('--apply');

async function main() {
  const db = await conectarMigracion({ esquema: true });
  try {
    for (const sql of SENTENCIAS) {
      if (APPLY) {
        await db.query(sql);
        console.log('Aplicado:', sql.slice(0, 72) + (sql.length > 72 ? '…' : ''));
      } else {
        console.log('[dry-run]', sql);
      }
    }
    console.log(
      APPLY
        ? `Listo: ${SENTENCIAS.length} sentencias verificadas en auditoria_outbox.`
        : 'Dry-run completado. Ejecuta con --apply para cambiar el esquema.',
    );
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migración de la outbox:', err?.message || err);
  process.exit(1);
});
