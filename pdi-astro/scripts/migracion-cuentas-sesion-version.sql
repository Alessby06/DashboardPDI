-- Versión de sesión de las cuentas.
--
-- Se incrementa al cambiar o restablecer la contraseña. La cookie de sesión
-- lleva el número y el servidor la rechaza si no coincide con la cuenta, de
-- modo que un cambio de contraseña invalida las demás sesiones abiertas.
--
-- Ejecutar una sola vez sobre la base de cuentas:
--   USE NS johannes_gutenberg;
--   USE DB infancia_saludable;
--   DEFINE FIELD IF NOT EXISTS session_version ON cuenta TYPE int DEFAULT 0;

DEFINE FIELD IF NOT EXISTS session_version ON cuenta TYPE int DEFAULT 0;
