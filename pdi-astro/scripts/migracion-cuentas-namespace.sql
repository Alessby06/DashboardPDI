-- Aislamiento de cuentas.
--
-- Las cuentas viven en un namespace propio (pdi_auth_ns) y no en
-- johannes_gutenberg. Un usuario de base del namespace clínico no puede
-- cambiar de namespace, así que el token que recibe el navegador para los
-- datos clínicos no alcanza esta tabla.
--
-- El usuario pdi_auth se crea aparte con una contraseña que no se escribe en
-- el repositorio. Debe tener ROLES EDITOR y DURATION FOR TOKEN 15m.
--
-- Ejecutar una sola vez como OWNER:
--   USE NS pdi_auth_ns;
--   USE DB pdi_cuentas;

DEFINE NAMESPACE IF NOT EXISTS pdi_auth_ns;
USE NS pdi_auth_ns;
DEFINE DATABASE IF NOT EXISTS pdi_cuentas;
USE DB pdi_cuentas;

DEFINE TABLE IF NOT EXISTS cuenta SCHEMAFULL PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS usuario ON cuenta TYPE string;
DEFINE FIELD IF NOT EXISTS nombre ON cuenta TYPE string;
DEFINE FIELD IF NOT EXISTS correo ON cuenta TYPE option<string>;
DEFINE FIELD IF NOT EXISTS telefono ON cuenta TYPE option<string>;
DEFINE FIELD IF NOT EXISTS rol ON cuenta TYPE string;
DEFINE FIELD IF NOT EXISTS activo ON cuenta TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS hash_cifrado ON cuenta TYPE string;
DEFINE FIELD IF NOT EXISTS foto ON cuenta TYPE option<string>;
DEFINE FIELD IF NOT EXISTS debe_cambiar_clave ON cuenta TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS session_version ON cuenta TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS creado_el ON cuenta TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS actualizado_el ON cuenta TYPE datetime VALUE time::now();
DEFINE INDEX IF NOT EXISTS cuenta_usuario_unico ON cuenta FIELDS usuario UNIQUE;
