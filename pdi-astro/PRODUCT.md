# Programa Desarrollo Infantil (PDI) - Johannes Gutenberg

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Coordinación General (`coord`)**: supervisión estratégica, aprobación o rechazo de transiciones de fase de derivaciones, monitoreo presupuestario y de exoneraciones.
- **Administrador TI (`admin`)**: soporte de plataforma, auditoría y configuración de accesos.
- **Área Social Pastoral (`social`, trabajadora social)**: evaluación técnica, visitas domiciliarias, solicitud justificada de transiciones de etapa en derivaciones y cálculo socioeconómico.
- **Educación, promotoras y facilitadoras (`facilitadora`, `promotora`)**: control de asistencia, tamizajes antropométricos, talleres educativos y nutrición.

Todos los roles usan el sistema también desde el teléfono, con Chrome para Android. No hay app instalada: el canal móvil es la misma web responsive.

## Product Purpose

Sistema integral de gestión para el Programa Infancia Saludable de la Asociación Cultural y Educativa Johannes Gutenberg (El Agustino y Comas). Administra el padrón de beneficiarios, los tamizajes de salud, el refuerzo educativo, las derivaciones del Área Social Pastoral, las sedes parroquiales e iglesias y el cuerpo de voluntariados. El éxito es que una coordinadora o una promotora pueda registrar, consultar y decidir sobre un beneficiario en el mismo lugar donde ocurre la atención, sin duplicar el registro en otro sistema.

## Positioning

Un único expediente longitudinal por beneficiario es el eje del sistema: padrón, tamizaje CRED, escolaridad, familia, derivaciones ASP, sedes y voluntariado se leen y se editan desde el mismo registro, con trazabilidad de auditoría de cada acción. Un sistema por módulos separados no podría reconstruir esa historia sin conciliaciones manuales.

## Operating Context

- Sedes comunitarias en El Agustino y Comas: El Progreso, San Pedro, Año Nuevo, Santa Rosa, Los Bendecidos y La Libertad.
- Escritorio y tablet en sede para la operación administrativa; teléfonos con Chrome Android para todos los roles.
- Conexión a SurrealDB Cloud con persistencia y respaldo offline en `localStorage`.
- Sesiones por rol en `localStorage`; las vistas y acciones se ajustan al rol activo.

## Capabilities and Constraints

- Astro 7 con salida estática, CSS nativo con tokens, JavaScript modular sin framework y SDK de SurrealDB.
- Padrón único, salud CRED, educativo, familia y retiro, ASP, sedes, voluntariados, expediente, auditoría y ajustes.
- Exportación CSV de bitácoras y listados; auditoría de acciones por usuario.
- Tratamiento de datos personales de menores bajo la Ley N.° 29733, citada en la interfaz y en los flujos de exportación.
- Hojas inferiores con gesto táctil en móvil; popovers anclados en escritorio.

## Brand Commitments

- Nombre: Programa Desarrollo Infantil (PDI) / Programa Infancia Saludable, de la Asociación Cultural y Educativa Johannes Gutenberg.
- Voz sobria, clínica y operativa: el sistema habla como un parte de trabajo, no como una campaña.

## Evidence on Hand

- Datos operativos reales de beneficiarios, sedes, tamizajes y derivaciones en la base SurrealDB del proyecto.
- No hay testimonios, casos de prensa ni material de marketing; el trabajo futuro no debe inventarlos.

## Product Principles

1. El expediente del beneficiario es la unidad de trabajo, no el módulo.
2. Toda decisión sobre un beneficiario deja rastro auditable.
3. El sistema se usa en la sede y en el campo, con conexión o con el respaldo local.
4. Cada rol ve y registra lo que su tarea necesita, sin duplicar el dato en otra bandeja.
5. La información sensible de menores se trata bajo la Ley N.° 29733 por defecto.

## Accessibility & Inclusion

- Uso en campo, con luz ambiente variable: los dos temas del sistema tienen paridad obligatoria.
- Objetivos táctiles de al menos 44 px en móvil.
- `prefers-reduced-motion` conserva el cambio de estado y retira el desplazamiento.
