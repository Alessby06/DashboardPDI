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
DEFINE FIELD IF NOT EXISTS intentos_fallidos ON cuenta TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS bloqueado_hasta ON cuenta TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS totp_secret ON cuenta TYPE option<string>;
DEFINE FIELD IF NOT EXISTS totp_activo ON cuenta TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS totp_ultimo_contador ON cuenta TYPE option<int>;
DEFINE FIELD IF NOT EXISTS creado_el ON cuenta TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS actualizado_el ON cuenta TYPE datetime VALUE time::now();
DEFINE INDEX IF NOT EXISTS cuenta_usuario_unico ON cuenta FIELDS usuario UNIQUE;

-- Intentos por IP. Se guarda el hash de la IP, no la dirección en claro.
DEFINE TABLE IF NOT EXISTS intento_login SCHEMAFULL PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS ip_hash ON intento_login TYPE string;
DEFINE FIELD IF NOT EXISTS intentos ON intento_login TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS bloqueado_hasta ON intento_login TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS actualizado_el ON intento_login TYPE datetime VALUE time::now();
DEFINE INDEX IF NOT EXISTS intento_login_ip_unico ON intento_login FIELDS ip_hash UNIQUE;

-- Las filas creadas antes de definir el campo quedan con NONE. Eso rompe
-- cualquier UPDATE posterior con "Expected int but found NONE".
UPDATE cuenta SET intentos_fallidos = 0 WHERE intentos_fallidos = NONE;
UPDATE cuenta SET session_version = 0 WHERE session_version = NONE;
UPDATE cuenta SET totp_activo = false WHERE totp_activo = NONE;

-- La bitácora también vive aquí: el token clínico del navegador no puede
-- abrir este namespace. Solo el servidor lee y escribe.
DEFINE TABLE IF NOT EXISTS bitacora_auditoria SCHEMAFULL PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS usuario_nombre ON bitacora_auditoria TYPE string;
DEFINE FIELD IF NOT EXISTS rol ON bitacora_auditoria TYPE string;
DEFINE FIELD IF NOT EXISTS accion ON bitacora_auditoria TYPE string;
DEFINE FIELD IF NOT EXISTS entidad ON bitacora_auditoria TYPE string;
DEFINE FIELD IF NOT EXISTS registro_id ON bitacora_auditoria TYPE string;
DEFINE FIELD IF NOT EXISTS detalle ON bitacora_auditoria TYPE string;
DEFINE FIELD IF NOT EXISTS ip_origen ON bitacora_auditoria TYPE string;
DEFINE FIELD IF NOT EXISTS sede_nombre ON bitacora_auditoria TYPE string;
DEFINE FIELD IF NOT EXISTS timestamp ON bitacora_auditoria TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS diff ON bitacora_auditoria TYPE option<array<object>>;
DEFINE FIELD IF NOT EXISTS `diff`.* ON bitacora_auditoria TYPE object;
DEFINE FIELD IF NOT EXISTS accion_original ON bitacora_auditoria TYPE option<string>;
DEFINE FIELD IF NOT EXISTS detalle_original ON bitacora_auditoria TYPE option<string>;
DEFINE FIELD IF NOT EXISTS motivo_normalizacion ON bitacora_auditoria TYPE option<string>;
DEFINE FIELD IF NOT EXISTS normalizado_el ON bitacora_auditoria TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS normalizado_por ON bitacora_auditoria TYPE option<string>;
DEFINE FIELD IF NOT EXISTS usuario_id ON bitacora_auditoria TYPE option<record<persona>>;
DEFINE INDEX IF NOT EXISTS idx_bitacora_marca ON bitacora_auditoria FIELDS timestamp;
