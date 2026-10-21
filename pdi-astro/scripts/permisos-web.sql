-- ===========================================================================
--  PERMISOS DEL USUARIO DE LA APLICACIÓN WEB  (pdi_web)
-- ===========================================================================
--  Qué resuelve esto
--  ----------------
--  El sitio público se autenticaba contra la base con la cuenta 'pdi_app',
--  que es OWNER (root): con su contraseña se podía redefinir el esquema,
--  crear usuarios y ver el resto de la base. Y esa contraseña viajaba dentro
--  del bundle JavaScript, o sea, pública.
--
--  'pdi_web' es un usuario de nivel DATABASE con el rol integrado VIEWER:
--
--    - NO puede tocar el esquema (definir tablas, campos, índices).
--    - NO puede crear ni modificar usuarios (IAM).
--    - NO puede salir de esta base de datos.
--    - Solo puede escribir en las tablas que el sistema usa; en las demás
--      no puede ni crear, ni modificar, ni borrar.
--    - Su sesión y sus tokens caducan a los 30 minutos.
--
--  Un aviso honesto sobre lo que NO se puede cerrar aquí
--  ---------------------------------------------------
--  En SurrealDB 3.x el rol VIEWER hereda el permiso de lectura sobre todas
--  las tablas de su nivel, y los PERMISSIONS de tabla regulan la escritura.
--  No hay roles personalizados (DEFINE ROLE ya no existe en 3.x), asi que un
--  token de la web puede LEER el padron completo. Eso es inevitable con este
--  diseno: el navegador habla directo con la base y la aplicacion necesita
--  ver todo el padron.
--
--  Para que un token filtrado no alcance a leer los datos habria que poner
--  un proxy de consultas en el servidor, que decidiera que se devuelve.
--  Es un cambio mayor, y no se ha hecho aqui.
--
--  Cómo se aplica
--  --------------
--  Se ejecuta con una cuenta de administracion (pdi_app). Es reversible:
--  ./permisos-web-revertir.sql devuelve las tablas a FULL y borra el
--  usuario de la web.
-- ===========================================================================

USE NS johannes_gutenberg;
USE DB infancia_saludable;

-- ---------------------------------------------------------------------------
--  1. El usuario de la web
-- ---------------------------------------------------------------------------
--  ROLES VIEWER: no es root. La contraseña va en el servidor (variable de
--  entorno SURREAL_PASS), nunca en el bundle del navegador. Si se cambia la
--  contraseña, los tokens emitidos hasta ese momento dejan de valer.
DEFINE USER OVERWRITE pdi_web ON DATABASE
  PASSWORD 'M4VXid^3vo*#9Ky^H@4bReqXA%JMxVmWvMizaqZW'
  ROLES VIEWER
  DURATION FOR TOKEN 30m, FOR SESSION 30m;

-- ---------------------------------------------------------------------------
--  2. Tablas que el sistema usa: lectura y escritura
-- ---------------------------------------------------------------------------
--  'persona' y 'voluntario' tienen un evento que prohibe el borrado fisico
--  (Ley 29733). La baja de una persona es logica (activo = false).
ALTER TABLE persona                   PERMISSIONS FULL;
ALTER TABLE inscripcion                PERMISSIONS FULL;
ALTER TABLE tamizaje_hemoglobina       PERMISSIONS FULL;
ALTER TABLE usuario_vinculado          PERMISSIONS FULL;
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
--  4. Comprobacion
-- ---------------------------------------------------------------------------
INFO FOR DB;
