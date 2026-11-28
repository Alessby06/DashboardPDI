# Incidente 2026-11-27 — pérdida de inscripciones del padrón

## Resumen

Un proceso automatizado eliminó todas las filas de `inscripcion` de la base
`johannes_gutenberg / infancia_saludable`. Las personas (`persona`) y los casos
sociales (`caso_social`) sobrevivieron, por lo que el padrón quedó en 0 y
`social.astro` siguió mostrando 10 casos con nombres. No fue un problema de
réplica: son dos fuentes de verdad distintas y `inscripcion` no tenía
protección contra `DELETE`.

## Evidencia medida (antes de reparar)

| Tabla | Filas |
|---|---:|
| `persona` | 73 (47 activas, 26 inactivas) |
| `inscripcion` | **0** |
| `caso_social` | 11 (10 activas) |
| `tamizaje_hemoglobina` | 67 (24 con `inscripcion_id`) |
| `aporte` | 10 (todos huérfanos) |
| `asistencia_diaria` | 2 (ambas huérfanas) |
| `evaluacion_socioeconomica` | 2 |
| `solicitud_caso` | 13 |

`SQL_PADRON` devolvía 0 porque exige `inscripcion.activo = true`.
`SQL_RETIRADOS` devolvía 0 porque exigía `inscripcion.activo = false`.
`fetchCasosSociales` devolvía 10 porque resuelve el nombre por `persona_id`.

La baja normal de la interfaz no borra: apaga `inscripcion.activo` y
`persona.activo`. Aquí no quedó ninguna inscripción y sí 47 personas activas:
fue un `DELETE` directo sobre `inscripcion`.

## Causa raíz

1. `persona` ya tenía un evento que impide `DELETE`; `inscripcion` no.
2. Los módulos no comparten un agregado: padrón/asistencia/aportes cuelgan de
   `inscripcion`; social/salud cuelgan de `persona`.
3. El alta nueva se bloquea por DNI existente y no existe un camino de
   reparación para recrear una inscripción.

## Recuperación ejecutada

- Export completo de 36 tablas a `backups/incidente-2026-11-27/export`
  (fuera de git, por contener datos personales).
- Fixture anterior al commit `ee1da5b` preservado como fuente de `programa` y
  `modalidad` para los registros semilla.
- 10 inscripciones reconstruidas en una transacción desde el manifiesto:
  `0001`–`0010`.
- 2 inscripciones adicionales con decisión documentada:
  - `0011`: sede de inscripción Carmen Alto (tamizaje + fixture); el caso
    conserva La Libertad como sede de derivación.
  - `0012`: la persona activa conserva el código; el duplicado inactivo pasó a
    `0012-IS2026-RET`.
- `0010` sin vínculos pasó a `0010-IS2026-DUP`; los registros de prueba
  (`Bodoque`, `Prueba`) pasaron a códigos `QA-*` y quedaron inactivos.
- 5 tamizajes y 1 aporte con el ID corrupto
  ``inscripcion:`⟨2upvsxwp5utmytazyd0n⟩` `` se reenlazaron a la inscripción
  canónica de la persona.
- `sede:ano_nuevo` (inexistente) se normalizó a `sede:a_o_nuevo`.

## Estado después de la reparación

- `SQL_PADRON`: **12** usuarios activos.
- `inscripcion`: 14 filas, 12 activas (2 de prueba, inactivas).
- `caso_social`: 10 casos activos, **10 con expediente**.
- `npm run db:audit`: **0 violaciones**; 15 advertencias históricas
  (9 aportes y 1 asistencia sin inscripción, más 5 retirados sin historial).
- Los 12 tienen sede, programa, modalidad, estrategias y periodo 2026.

## Prevención implementada

- Eventos de esquema que rechazan `DELETE` en `inscripcion`, `caso_social`,
  evaluaciones, solicitudes, atenciones, aportes y asistencias.
- Evento `una_inscripcion_activa`: rechaza una segunda inscripción activa.
- Campos `reconstruida_el` y `origen_reconstruccion` en `inscripcion`.
- `scripts/auditar-integridad.mjs` (`npm run db:audit`), read-only, con salida
  distinta de cero si hay violaciones.
- `scripts/exportar-base.mjs`, manifiesto con evidencia y reparación
  transaccional idempotente.
- Guardas en scripts destructivos: sin `--apply`, `PDI_ALLOW_DESTRUCTIVE=1` y
  un backup reciente, no escriben.
- Baja y reactivación honestas: ya no reportan éxito si no actualizaron una
  inscripción.
- El archivo de retirados se basa en `persona.activo = false`, no en una
  inscripción inactiva.
- Dashboard y kanban marcan casos sin expediente; Ajustes muestra el panel de
  integridad.

## Pendiente

- Capturar el `localStorage['pdi_snapshot_v1']` de navegadores con sesión
  anterior al incidente (TTL 24 h). Es la única fuente que podría recuperar
  `inscripcion_id` originales que hoy quedaron como advertencia.
- Verificar backup/PITR en la consola de SurrealDB Cloud.
- Completar el modal de reactivación para un retirado sin inscripción (hoy la
  operación se rechaza con un mensaje honesto, pero no ofrece el formulario).
- Revisar los 19 tamizajes activos frente a los 48 inactivos: confirmar si la
  desactivación masiva fue intencional.
- Tarea de colaboradores (fallback local) postergada porque
  `ColaboradorModel.js` está siendo editado por otra sesión.
- Vincular `caso_social` y evaluaciones a `inscripcion_id` (fase 3).

## Rulings

- **0011:** se prioriza tamizaje + fixture (Carmen Alto) sobre la sede del caso
  (La Libertad). Si el equipo confirma que la inscripción era La Libertad, se
  corrige con un `UPDATE` y queda registrado.
- **0012:** la persona activa conserva el código; el duplicado inactivo se
  renombra, no se borra. Si el equipo identifica a Alfonso como el usuario
  vigente, se intercambian los códigos.
- **0010:** el registro inactivo sin vínculos se renombra a `-DUP`; no se borra.
