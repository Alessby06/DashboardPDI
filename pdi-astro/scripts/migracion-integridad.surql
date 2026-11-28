-- ===========================================================================
--  INTEGRIDAD DEL PADRON — eventos, campos e indices
-- ===========================================================================
--  Idempotente. No borra datos. Se aplica con scripts/aplicar-migracion.mjs.
-- ===========================================================================

-- 1. Prohibir el borrado fisico de las tablas de dominio.
DEFINE EVENT IF NOT EXISTS previene_delete_inscripcion ON inscripcion
  WHEN $event = 'DELETE'
  THEN { THROW 'Operacion rechazada: la inscripcion se da de baja, no se borra.' };

DEFINE EVENT IF NOT EXISTS previene_delete_caso_social ON caso_social
  WHEN $event = 'DELETE'
  THEN { THROW 'Operacion rechazada: el caso social se cierra, no se borra.' };

DEFINE EVENT IF NOT EXISTS previene_delete_evaluacion ON evaluacion_socioeconomica
  WHEN $event = 'DELETE'
  THEN { THROW 'Operacion rechazada: la evaluacion socioeconomica no se borra.' };

DEFINE EVENT IF NOT EXISTS previene_delete_solicitud ON solicitud_caso
  WHEN $event = 'DELETE'
  THEN { THROW 'Operacion rechazada: la solicitud de caso no se borra.' };

DEFINE EVENT IF NOT EXISTS previene_delete_evento_caso ON evento_caso
  WHEN $event = 'DELETE'
  THEN { THROW 'Operacion rechazada: la atencion del caso no se borra.' };

DEFINE EVENT IF NOT EXISTS previene_delete_aporte ON aporte
  WHEN $event = 'DELETE'
  THEN { THROW 'Operacion rechazada: el aporte no se borra.' };

DEFINE EVENT IF NOT EXISTS previene_delete_asistencia ON asistencia_diaria
  WHEN $event = 'DELETE'
  THEN { THROW 'Operacion rechazada: la asistencia no se borra.' };

-- 2. Una sola inscripcion activa por persona.
--    Esquema 0 (PUBLIC_ESQUEMA_USUARIO=0): persona_id.
--    Esquema 1 (PUBLIC_ESQUEMA_USUARIO=1): reemplazar persona_id por usuario_id
--    en este evento y en idx_inscripcion_persona_activo antes de aplicar.
DEFINE EVENT IF NOT EXISTS una_inscripcion_activa ON inscripcion
  WHEN $event IN ['CREATE', 'UPDATE'] AND $after.activo = true
  THEN {
    IF array::len((SELECT VALUE id FROM inscripcion
      WHERE persona_id = $after.persona_id AND activo = true AND id != $after.id)) > 0 {
      THROW 'Operacion rechazada: la persona ya tiene una inscripcion activa.';
    }
  };

-- 3. Trazabilidad de reconstrucciones.
DEFINE FIELD IF NOT EXISTS reconstruida_el ON inscripcion TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS origen_reconstruccion ON inscripcion TYPE option<string>;

-- 4. Indices de consulta e integridad.
DEFINE INDEX IF NOT EXISTS idx_caso_usuario ON caso_social FIELDS usuario_id;
DEFINE INDEX IF NOT EXISTS idx_caso_activo ON caso_social FIELDS activo;
DEFINE INDEX IF NOT EXISTS idx_inscripcion_persona_activo ON inscripcion FIELDS persona_id, activo;
DEFINE INDEX IF NOT EXISTS idx_evaluacion_persona ON evaluacion_socioeconomica FIELDS persona_id;
