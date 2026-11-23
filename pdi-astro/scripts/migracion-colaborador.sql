-- ===========================================================================
--  MIGRACIÓN: Esquema de la tabla `colaborador` y permisos
-- ===========================================================================
--  Red Territorial y Alianzas Institucionales (PDI - Johannes Gutenberg).
--  Colegios, Iglesias, Pastores, Directores, Docentes Enlace y Facilitadoras PDI.
--  Alineado a Ley 29733 (baja lógica: activo = false, estado = 'Inactivo').
-- ===========================================================================

USE NS johannes_gutenberg;
USE DB infancia_saludable;

DEFINE TABLE IF NOT EXISTS colaborador TYPE NORMAL SCHEMAFULL PERMISSIONS FULL;

DEFINE FIELD IF NOT EXISTS codigo ON colaborador TYPE string;
DEFINE FIELD IF NOT EXISTS nombres ON colaborador TYPE string ASSERT $value != '';
DEFINE FIELD IF NOT EXISTS apellidos ON colaborador TYPE string ASSERT $value != '';
DEFINE FIELD IF NOT EXISTS numero_documento ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS telefono_celular ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS telefono_fijo ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS email ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS fecha_nacimiento ON colaborador TYPE none | datetime;
DEFINE FIELD IF NOT EXISTS direccion ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS distrito ON colaborador TYPE string DEFAULT 'Comas';
DEFINE FIELD IF NOT EXISTS sede_nombre ON colaborador TYPE string;
DEFINE FIELD IF NOT EXISTS tipo_colaborador ON colaborador TYPE string;
DEFINE FIELD IF NOT EXISTS categoria ON colaborador TYPE string;
DEFINE FIELD IF NOT EXISTS codigo_modular ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS nivel ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS turno ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS denominacion ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS estrategias ON colaborador TYPE array<string> DEFAULT ['Desayuno Infantil'];
DEFINE FIELD IF NOT EXISTS estrategias.* ON colaborador TYPE string;
DEFINE FIELD IF NOT EXISTS fecha_ingreso ON colaborador TYPE none | datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS estado ON colaborador TYPE string DEFAULT 'Activo';
DEFINE FIELD IF NOT EXISTS activo ON colaborador TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS observaciones ON colaborador TYPE none | string;
DEFINE FIELD IF NOT EXISTS creado_el ON colaborador TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS actualizado_el ON colaborador TYPE datetime VALUE time::now();

DEFINE INDEX IF NOT EXISTS idx_colaborador_activo ON colaborador FIELDS activo, creado_el;
DEFINE INDEX IF NOT EXISTS idx_colaborador_categoria ON colaborador FIELDS categoria, activo;
DEFINE INDEX IF NOT EXISTS idx_colaborador_sede ON colaborador FIELDS sede_nombre;

ALTER TABLE colaborador PERMISSIONS FULL;
