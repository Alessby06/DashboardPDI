# Backups, reparación y auditoría de integridad

## Regla de oro

Ninguna operación destructiva se ejecuta sin:

1. `node scripts/exportar-base.mjs --out ../backups/incidente-<fecha>/export`
2. `PDI_ALLOW_DESTRUCTIVE=1`
3. `--apply`
4. `--backup <ruta del export>` con menos de 24 h
5. Revisión del `--dry-run` y del target (`ns/db`) que imprime el script.

Sin esos cinco puntos, los scripts de `scripts/` no escriben.

## Auditoría (solo lectura)

```bash
cd pdi-astro
npm run db:audit          # tabla legible; exit 1 si hay violaciones
npm run db:audit -- --json
```

Qué significa:

- **Violaciones:** bloquean. Persona activa sin inscripción, caso sin
  expediente, doble inscripción activa, código duplicado, tamizaje activo con
  inscripción inexistente.
- **Advertencias:** históricas. Aportes/asistencias huérfanos, retirados sin
  historial. No cambian el exit code, pero deben revisarse.

## Export

```bash
node scripts/exportar-base.mjs --out ../backups/incidente-<fecha>/export
```

Escribe un JSONL por tabla y `manifest.json` con conteos y sha256. No
transforma datos. `backups/` está en `.gitignore`: nunca se versiona.

## Reparación de inscripciones

```bash
# 1. Construir el manifiesto desde el fixture y la evidencia
node scripts/construir-manifiesto.mjs --out ../backups/incidente-<fecha>

# 2. Revisar manifiesto.csv (accion = reconstruir / requiere_revision / no_reconstruir)
# 3. Dry-run
node scripts/reparar-inscripciones.mjs --manifest ../backups/incidente-<fecha>/manifiesto.json

# 4. Aplicar (idempotente: omite personas que ya tienen inscripción activa)
PDI_ALLOW_DESTRUCTIVE=1 node scripts/reparar-inscripciones.mjs \
  --manifest ../backups/incidente-<fecha>/manifiesto.json \
  --apply --backup ../backups/incidente-<fecha>/export
```

El alta va en una transacción: si una fila falla, no se crea ninguna. Las filas
`requiere_revision` quedan fuera salvo `--incluir-revision`.

## Migraciones de esquema

```bash
node scripts/aplicar-migracion.mjs --file scripts/migracion-integridad.surql
node scripts/aplicar-migracion.mjs --file scripts/migracion-integridad.surql --verify
PDI_ALLOW_DESTRUCTIVE=1 node scripts/aplicar-migracion.mjs \
  --file scripts/migracion-integridad.surql --apply \
  --backup ../backups/incidente-<fecha>/export
```

`--verify` ejecuta el DDL dentro de una transacción y hace `CANCEL`; no
persiste.

## Rollback

Nunca `DELETE`. Para deshacer una reparación:

```surql
UPDATE inscripcion SET activo = false, estado = 'Retirado',
  eliminado_el = time::now(), motivo_baja = 'Rollback de reparación'
WHERE origen_reconstruccion = 'incidente-2026-11-27';
```

Después, restaurar el estado desde el export y volver a correr `db:audit`.

## Verificación final

```bash
npm run db:audit
npm test
```

`db:audit` debe salir 0. `npm test` debe pasar; si falla un test de un archivo
que otra sesión está editando, se reporta como ajeno, no se toca.
