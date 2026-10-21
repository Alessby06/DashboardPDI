-- ===========================================================================
--  REVERSIÓN DE LOS PERMISOS DEL USUARIO WEB  (pdi_web)
-- ===========================================================================
--  Deja las 34 tablas como estaban antes: todas con PERMISSIONS FULL, que es
--  como vivian con la cuenta de administracion 'pdi_app'.
--
--  Ojo: con esto, cualquier token de 'pdi_web' vuelve a poder escribir en
--  todas las tablas. Para cerrar de verdad la puerta, ademas hay que
--  revocar el token:
--
--    REMOVE USER pdi_web ON DATABASE;
--
--  Se ejecuta con una cuenta de administracion (pdi_app).
-- ===========================================================================

USE NS johannes_gutenberg;
USE DB infancia_saludable;

ALTER TABLE acceso                PERMISSIONS FULL;
ALTER TABLE alergia               PERMISSIONS FULL;
ALTER TABLE aporte                PERMISSIONS FULL;
ALTER TABLE asignacion_personal  PERMISSIONS FULL;
ALTER TABLE asistencia_diaria     PERMISSIONS FULL;
ALTER TABLE atencion_usuario     PERMISSIONS FULL;
ALTER TABLE autorizacion_salida   PERMISSIONS FULL;
ALTER TABLE autorizado_salida     PERMISSIONS FULL;
ALTER TABLE bitacora_auditoria    PERMISSIONS FULL;
ALTER TABLE canasta_alimentaria   PERMISSIONS FULL;
ALTER TABLE caso_social           PERMISSIONS FULL;
ALTER TABLE catalogo_item         PERMISSIONS FULL;
ALTER TABLE consentimiento        PERMISSIONS FULL;
ALTER TABLE criterio_intervencion PERMISSIONS FULL;
ALTER TABLE escala_anemia         PERMISSIONS FULL;
ALTER TABLE evaluacion_socioeconomica PERMISSIONS FULL;
ALTER TABLE evento_caso           PERMISSIONS FULL;
ALTER TABLE inscripcion           PERMISSIONS FULL;
ALTER TABLE institucion           PERMISSIONS FULL;
ALTER TABLE integrante_hogar      PERMISSIONS FULL;
ALTER TABLE persona               PERMISSIONS FULL;
ALTER TABLE puntaje_indicador     PERMISSIONS FULL;
ALTER TABLE registro              PERMISSIONS FULL;
ALTER TABLE registro_item         PERMISSIONS FULL;
ALTER TABLE registro_lugar        PERMISSIONS FULL;
ALTER TABLE salud_hogar           PERMISSIONS FULL;
ALTER TABLE sede                  PERMISSIONS FULL;
ALTER TABLE solicitud_caso        PERMISSIONS FULL;
ALTER TABLE tamizaje_hemoglobina  PERMISSIONS FULL;
ALTER TABLE tamizaje_item         PERMISSIONS FULL;
ALTER TABLE usuario_rol           PERMISSIONS FULL;
ALTER TABLE usuario_vinculado     PERMISSIONS FULL;
ALTER TABLE vivienda_hogar        PERMISSIONS FULL;
ALTER TABLE voluntario            PERMISSIONS FULL;

-- Si además se quiere revocar el acceso del sitio:
-- REMOVE USER pdi_web ON DATABASE;

-- Y devolver el control al administrador (pdi_app sigue siendo OWNER):
-- REMOVE USER pdi_web ON DATABASE;

INFO FOR DB;
