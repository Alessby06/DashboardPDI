# Programa Desarrollo Infantil (PDI) - Johannes Gutenberg

## Purpose
Sistema integral de gestión para el Programa Infancia Saludable de la Asociación Cultural y Educativa Johannes Gutenberg (El Agustino / Comas). Administra el padrón de beneficiarios, tamizajes de salud, refuerzo educativo, derivaciones del Área Social Pastoral (ASP), sedes parroquiales e iglesias, y cuerpo de voluntariados.

## Users & Roles
- **Coordinación General (`coord`)**: Supervisión estratégica, aprobación o rechazo de transiciones de fase de derivaciones, monitoreo presupuestario y de exoneraciones.
- **Administrador TI (`admin`)**: Soporte de plataforma, auditoría y configuración de accesos.
- **Área Social Pastoral (`social` / Trabajadora Social)**: Evaluación técnica, visitas domiciliarias, solicitud justificada de transiciones de etapa en derivaciones, cálculo socioeconómico.
- **Educación / Promotoras / Facilitadoras (`facilitadora`, `promotora`)**: Control de asistencia, tamizajes antropométricos, talleres educativos y nutrición.

## Operating Context
- Entorno de escritorio y tablets en sedes comunitarias (El Progreso, San Pedro, Año Nuevo, Santa Rosa, Los Bendecidos, La Libertad).
- Conexión a SurrealDB Cloud con persistencia y fallback offline en `localStorage`.

## Platform & Stack
- **Platform**: Web responsive
- **Stack**: Astro 5 (Static Output), CSS nativo con variables de diseño (Tokens PDI), Vanilla JS modular, SurrealDB SDK.
