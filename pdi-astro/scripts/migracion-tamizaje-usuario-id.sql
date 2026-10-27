-- ===========================================================================
--  Migración correctiva: residuo `usuario_id` en tamizaje_hemoglobina
-- ===========================================================================
--  Problema:
--    La tabla es SCHEMAFULL y solo define `persona_id`. Una migración anterior
--    escribió `usuario_id` en los 45 registros existentes, pero nunca definió
--    el campo. Cualquier UPDATE (por ejemplo, desactivar una prueba) falla con:
--      "Found field 'usuario_id', but no such field exists for table
--       'tamizaje_hemoglobina'"
--
--  Decisión:
--    La aplicación en producción usa `persona_id` (PUBLIC_ESQUEMA_USUARIO no
--    está activo). Por eso se elimina el residuo `usuario_id` en vez de
--    completar la migración a medias.
--
--  ANTES DE EJECUTAR:
--    1. Hacer respaldo de la base (surreal export) y guardarlo fuera del repo.
--    2. Ejecutar primero en staging y probar "Desactivar esta prueba".
--    3. Ejecutar los pasos en orden, revisando el resultado entre cada uno.
-- ===========================================================================

-- Paso 0 · Diagnóstico (solo lectura)
SELECT count() FROM tamizaje_hemoglobina GROUP ALL;
SELECT count() FROM tamizaje_hemoglobina WHERE usuario_id != NONE GROUP ALL;
INFO FOR TABLE tamizaje_hemoglobina;

-- Paso 1 · Definir el campo para que SCHEMAFULL acepte los registros actuales.
--          Sin este paso, el UPDATE del paso 2 vuelve a fallar.
DEFINE FIELD OVERWRITE usuario_id ON tamizaje_hemoglobina
  TYPE none | record<persona> PERMISSIONS FULL;

-- Paso 2 · Quitar el residuo de todos los registros.
UPDATE tamizaje_hemoglobina UNSET usuario_id;

-- Paso 3 · Verificar que ya no queda ninguno. El resultado debe ser 0.
SELECT count() FROM tamizaje_hemoglobina WHERE usuario_id != NONE GROUP ALL;

-- Paso 4 · Retirar la definición temporal. Ejecutar SOLO si el paso 3 dio 0.
REMOVE FIELD IF EXISTS usuario_id ON tamizaje_hemoglobina;

-- Paso 5 · Verificación final.
INFO FOR TABLE tamizaje_hemoglobina;
SELECT count() FROM tamizaje_hemoglobina WHERE usuario_id != NONE GROUP ALL;

-- Rollback de emergencia (no recupera los datos borrados, solo vuelve a
-- permitir escrituras si algo quedó a medias):
-- DEFINE FIELD OVERWRITE usuario_id ON tamizaje_hemoglobina
--   TYPE none | record<persona> PERMISSIONS FULL;
