-- Campos nuevos que ya existían en registros de consentimiento pero no en el
-- esquema. La tabla es SCHEMAFULL, así que sin estas definiciones un export
-- completo no se puede restaurar.
--
-- Detectado por la prueba de restauración del 2026-11-06.

USE NS johannes_gutenberg;
USE DB infancia_saludable;

DEFINE FIELD IF NOT EXISTS firmante_id ON consentimiento TYPE option<record<persona>>;
DEFINE FIELD IF NOT EXISTS usuario_id ON consentimiento TYPE option<record<persona>>;
