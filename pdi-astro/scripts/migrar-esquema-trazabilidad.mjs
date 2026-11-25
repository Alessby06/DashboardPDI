// ===========================================================================
//  Migración de esquema: trazabilidad del expediente
// ===========================================================================
//  Campos aditivos sobre `inscripcion` para el resumen de la pestaña
//  «Trazabilidad». La fuente autoritativa de autoría sigue siendo
//  bitacora_auditoria, donde el servidor valida la sesión.
//
//  Uso:
//    node scripts/migrar-esquema-trazabilidad.mjs            # dry-run
//    node scripts/migrar-esquema-trazabilidad.mjs --apply    # aplica
//
//  Es idempotente: usa DEFINE FIELD IF NOT EXISTS.
// ===========================================================================
import { conectarMigracion } from './conexion-migracion.mjs';

const CAMPOS = [
  ['creado_por_id', 'none | string'],
  ['creado_por_nombre', 'none | string'],
  ['creado_por_rol', 'none | string'],
  ['actualizado_por_id', 'none | string'],
  ['actualizado_por_nombre', 'none | string'],
  ['actualizado_por_rol', 'none | string'],
  ['fecha_baja', 'none | datetime'],
  ['dado_baja_por_id', 'none | string'],
  ['dado_baja_por_nombre', 'none | string'],
  ['dado_baja_por_rol', 'none | string'],
  ['fecha_reactivacion', 'none | datetime'],
  ['motivo_reactivacion', 'none | string'],
  ['reactivado_por_id', 'none | string'],
  ['reactivado_por_nombre', 'none | string'],
  ['reactivado_por_rol', 'none | string'],
];

const APPLY = process.argv.includes('--apply');

async function main() {
  const db = await conectarMigracion({ esquema: true });
  try {
    for (const [campo, tipo] of CAMPOS) {
      const sql = `DEFINE FIELD IF NOT EXISTS ${campo} ON inscripcion TYPE ${tipo} PERMISSIONS FULL;`;
      if (APPLY) {
        await db.query(sql);
        console.log(`Aplicado: inscripcion.${campo}`);
      } else {
        console.log(`[dry-run] ${sql}`);
      }
    }
    console.log(
      APPLY
        ? `Listo: ${CAMPOS.length} campos verificados en inscripcion.`
        : 'Dry-run completado. Ejecuta con --apply para cambiar el esquema.',
    );
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la migración de trazabilidad:', err?.message || err);
  process.exit(1);
});
