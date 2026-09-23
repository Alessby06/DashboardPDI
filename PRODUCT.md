# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

HTML5, CSS nativo con variables de diseño, Google Sans Flex (fuente UI principal), stack monoespaciado nativo del SO (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`) para atributos técnicos y código SQL. Preparado para arquitectura cliente-servidor / despliegue web estático (GitHub Pages) y posterior backend relacional SQL.

## Users

1. **Facilitador(a) Comunitario(a):** Registra inscripciones, monitorea puntos de distribución de alimentos y convenios con iglesias/colegios en Comas y Carabayllo.
2. **Promotora Educativa:** Administra asistencia, fichas de Casitas del Saber, autorizaciones de salida y bitácoras socioeducativas.
3. **Trabajador(a) Social (Área Social Pastoral - ASP):** Evalúa fichas socioeconómicas familiares, gestiona derivaciones críticas y canaliza ayudas (bolsas BTF, DEMUNA, MINSA).
4. **Coordinador(a) General PDI / Dirección Gutenberg:** Supervisa indicadores globales, toma de decisiones, reportes de impacto y trazabilidad del padrón maestro.

## Product Purpose

Digitalizar, centralizar y automatizar la gestión operativa del Programa de Desarrollo Infantil (PDI) de la Asociación Cultural Johannes Gutenberg en Lima Norte (Comas y Carabayllo). Su éxito significa erradicar el extravío de datos, unificar los expedientes de menores entre 3 servicios antes aislados y alertar de forma oportuna casos críticos de desnutrición/anemia y vulnerabilidad social.

## Positioning

Es el primer sistema integrado de gestión social y comunitaria de Johannes Gutenberg que consolida el ciclo de vida del menor (desde su inscripción en el padrón maestro hasta el egreso), conectando en tiempo real la intervención alimentaria, pedagógica y pastoral sobre una sola identidad única de usuario (`codigo_beneficiario`).

## Operating Context

- Operación en campo y sedes comunitarias en zonas periurbanas de Lima Norte (comedores, iglesias aliadas, bibliotecas comunales y aulas de Casita del Saber).
- Trabajo con formularios físicos históricos (fichas A0 a A7, evaluaciones socioeconómicas y consentimientos informados bajo la Ley 29733).
- Conectividad variable: requiere interfaces ligeras, responsivas, con alta legibilidad bajo cualquier condición de luz (modo día y noche) y capacidad de consulta rápida.

## Capabilities and Constraints

- **Capacidades clave:**
  - Padrón Único de Beneficiarios con validación estricta de DNI y duplicados.
  - Semaforización y diagnóstico automatizado de Anemia según normativas MINSA.
  - Registro de personas acreditadas para retiro seguro de menores en Casita del Saber.
  - Algoritmo de cálculo de índice de vulnerabilidad socioeconómica familiar.
  - Trazabilidad y derivación de casos de riesgo al Área Social Pastoral.
- **Restricciones:**
  - Cumplimiento estricto de la Ley N.° 29733 de Protección de Datos Personales del Perú y D.S. Nº 016-2024-JUS.
  - Cero eliminación física destructiva de historiales de salud (Soft Delete obligatorio).

## Brand Commitments

- **Institución:** Asociación Cultural Johannes Gutenberg.
- **Tipografía Oficial:** `Google Sans Flex` (UI general) y stack monoespaciado nativo del SO para datos técnicos, atributos de BD y código SQL. Prohibido `JetBrains Mono`.
- **Paleta de Diseño Oficial (Variante 3A — Zenith Minimal):**
  - `Obsidian` (`#000000`): Fondo absoluto puro. Nunca azul marino ni slate.
  - `Violeta Amatista` (`#9d78f5`): Color de marca y acciones primarias.
  - `Violeta Dim` (`#7c5cc4`): Estado hover y elementos secundarios.
  - `Superficie Glass` (`rgba(18, 14, 26, 0.90)` con `backdrop-filter: blur(12px)`): Tarjetas y paneles.
  - `Texto Principal` (`#f0eaff`): Legibilidad máxima sobre fondo negro.
  - `Texto Muted` (`#7e7591`): Etiquetas, metadatos y campos secundarios.
  - `Rojo` (`#f87171`): Prioridad Alta / alertas de salud.
  - `Ámbar` (`#fbbf24`): Prioridad Media.
  - `Esmeralda` (`#34d399`): Prioridad Baja / estados normales.
- **Tono:** Humano, institucional, sobrio, sin emojis, de máxima claridad y empatía social.


## Evidence on Hand

- Catálogo completo de 46 Requerimientos Funcionales normalizados en `Matriz_Requerimientos_PDI_Johannes_Gutenberg.csv`.
- Archivos físicos originales de relevamiento (Fichas `A0` a `A6` con atenciones CRED consolidadas en Ficha A6 Hoja 4, `Evaluación Socioeconómica.xlsx`, `FICHA DE DERIVACIÓN DE CASO SOCIAL.docx`, `Flujogramas PDI.docx`).
- Matriz de levantamiento de información y contrato de datos (33 procesos normalizados en 6 columnas oficiales) en `Matriz PDI.html`.
- Plan de trabajo de desarrollo del sistema en PDF (`Plan_Inicial_Desarrollo_Sistema_PDI_Johannes_Gutenberg.pdf`).
- Visores interactivos funcionales en `Matriz PDI.html`.

## Product Principles

1. **La Identidad del Menor es Única:** Ningún servicio puede duplicar expedientes; todas las atenciones alimentarias, educativas y sociales se enlazan al mismo código correlativo y DNI.
2. **Prioridad a la Salvaguarda y Salud:** Las alertas de anemia y las listas autorizadas de retiro de menores tienen máxima visibilidad y validación estricta.
3. **Claridad Operativa de Campo:** Interfaces de alto contraste, legibles y directas para facilitadoras y promotoras sin jerga técnica innecesaria.
4. **Respeto a la Privacidad:** La protección de datos de los menores y el consentimiento informado son requisitos ineludibles en todo registro.

## Accessibility & Inclusion

- Contraste visual accesible en modo claro y modo oscuro conforme a estándares WCAG AA.
- Tipografía escalada confortable (14px–15px base) para evitar fatiga visual en jornadas de campo.
- Soporte completo para navegación por teclado y controles táctiles amplios en pantallas táctiles y móviles.
