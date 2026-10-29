-- ===========================================================================
--  Migración de higiene: residuo `usuario_id` en inscripcion
-- ===========================================================================
--  Problema:
--    La tabla es SCHEMAFULL y solo define `persona_id`. Los 19 registros
--    existentes conservaron un `usuario_id` de una migración anterior; el
--    campo ya no está definido, pero sigue en los datos y aparece en
--    SELECT *. Cualquier escritura futura que use el nombre nuevo contra el
--    esquema viejo vuelve a fallar con:
--      "Found field 'usuario_id', but no such field exists for table
--       'inscripcion'"
--
--  Decisión:
--    Producción usa `persona_id` (PUBLIC_ESQUEMA_USUARIO no está activo).
--    Se elimina el residuo en vez de completar la migración a medias.
--    `caso_social.usuario_id` NO se toca: esa tabla sí migró y lo usa.
--
--  ANTES DE EJECUTAR:
--    1. Hacer respaldo de la base (surreal export) y guardarlo fuera del repo.
--    2. Ejecutar primero en staging y probar alta, edición y baja de usuario.
--    3. Ejecutar los pasos en orden, revisando el resultado entre cada uno.
-- ===========================================================================

-- Paso 0 · Diagnóstico (solo lectura)
SELECT count() FROM inscripcion GROUP ALL;                            -- 19
SELECT count() FROM inscripcion WHERE usuario_id != NONE GROUP ALL;   -- 19
SELECT count() FROM inscripcion WHERE usuario_id != persona_id GROUP ALL; -- 0
INFO FOR TABLE inscripcion;

-- Paso 1 · Definir el campo temporalmente para que SCHEMAFULL acepte el
--          UNSET de los registros actuales. Sin este paso, el UPDATE falla.
DEFINE FIELD OVERWRITE usuario_id ON inscripcion
  TYPE none | record<persona> PERMISSIONS FULL;

-- Paso 2 · Quitar el residuo de todos los registros.
UPDATE inscripcion UNSET usuario_id;

-- Paso 3 · Verificar que ya no queda ninguno. El resultado debe ser 0.
SELECT count() FROM inscripcion WHERE usuario_id != NONE GROUP ALL;

-- Paso 4 · Retirar la definición temporal. Ejecutar SOLO si el paso 3 dio 0.
REMOVE FIELD IF EXISTS usuario_id ON inscripcion;

-- Paso 5 · Verificación final.
INFO FOR TABLE inscripcion;
SELECT count() FROM inscripcion WHERE usuario_id != NONE GROUP ALL;   -- 0
SELECT count() FROM inscripcion WHERE persona_id != NONE GROUP ALL;   -- 19

-- Rollback de emergencia (no recupera los datos borrados, solo vuelve a
-- permitir escrituras si algo quedó a medias):
-- DEFINE FIELD OVERWRITE usuario_id ON inscripcion
--   TYPE none | record<persona> PERMISSIONS FULL;
