-- ===========================================================================
--  PERMISOS DEL USUARIO DE LA APLICACIÓN WEB (pdi_web) - CORREGIDO
-- ===========================================================================
--  Schema: persona_vinculada (schema viejo, producción actual)
--  Removed: referencias a usuario_vinculado (no existe en esta BD)
-- ===========================================================================

USE NS johannes_gutenberg;
USE DB infancia_saludable;

-- ---------------------------------------------------------------------------
--  1. El usuario de la web
-- ---------------------------------------------------------------------------
DEFINE USER OVERWRITE pdi_web ON DATABASE
  PASSWORD 'M4VXid^3vo*#9Ky^H@4bReqXA%JMxVmWvMizaqZW'
  ROLES VIEWER
  DURATION FOR TOKEN 30m, FOR SESSION 30m;

-- ---------------------------------------------------------------------------
--  2. Tablas que el sistema usa: lectura y escritura (SCHEMA VIEJO)
-- ---------------------------------------------------------------------------
ALTER TABLE persona                   PERMISSIONS FULL;
ALTER TABLE inscripcion                PERMISSIONS FULL;
ALTER TABLE tamizaje_hemoglobina       PERMISSIONS FULL;
ALTER TABLE persona_vinculada          PERMISSIONS FULL;  -- Schema viejo (no usuario_vinculado)
ALTER TABLE sede                       PERMISSIONS FULL;
ALTER TABLE caso_social                PERMISSIONS FULL;
ALTER TABLE solicitud_caso             PERMISSIONS FULL;
ALTER TABLE voluntario                 PERMISSIONS FULL;
ALTER TABLE asistencia_diaria          PERMISSIONS FULL;
ALTER TABLE bitacora_auditoria         PERMISSIONS FULL;
ALTER TABLE alergia                    PERMISSIONS FULL;
ALTER TABLE aporte                     PERMISSIONS FULL;
ALTER TABLE evento_caso                PERMISSIONS FULL;
ALTER TABLE evaluacion_socioeconomica  PERMISSIONS FULL;
ALTER TABLE institucion                PERMISSIONS FULL;

-- ---------------------------------------------------------------------------
--  3. Tablas que el sistema no usa: sin escritura
-- ---------------------------------------------------------------------------
ALTER TABLE acceso                PERMISSIONS NONE;
ALTER TABLE asignacion_personal   PERMISSIONS NONE;
ALTER TABLE atencion_usuario      PERMISSIONS NONE;
ALTER TABLE autorizacion_salida    PERMISSIONS NONE;
ALTER TABLE autorizado_salida      PERMISSIONS NONE;
ALTER TABLE canasta_alimentaria    PERMISSIONS NONE;
ALTER TABLE catalogo_item          PERMISSIONS NONE;
ALTER TABLE consentimiento         PERMISSIONS NONE;
ALTER TABLE criterio_intervencion  PERMISSIONS NONE;
ALTER TABLE escala_anemia          PERMISSIONS NONE;
ALTER TABLE integrante_hogar       PERMISSIONS NONE;
ALTER TABLE puntaje_indicador      PERMISSIONS NONE;
ALTER TABLE registro               PERMISSIONS NONE;
ALTER TABLE registro_item          PERMISSIONS NONE;
ALTER TABLE registro_lugar         PERMISSIONS NONE;
ALTER TABLE salud_hogar            PERMISSIONS NONE;
ALTER TABLE tamizaje_item          PERMISSIONS NONE;
ALTER TABLE usuario_rol            PERMISSIONS NONE;
ALTER TABLE vivienda_hogar         PERMISSIONS NONE;

-- ---------------------------------------------------------------------------
--  4. Comprobación
-- ---------------------------------------------------------------------------
INFO FOR DB;
