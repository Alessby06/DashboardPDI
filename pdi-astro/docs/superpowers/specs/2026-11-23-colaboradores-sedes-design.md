# Especificación de Diseño: Módulo Colaboradores y Articulación Territorial con Sedes

**Fecha:** 2026-11-23  
**Proyecto:** Programa Desarrollo Infantil (PDI) - Asociación Cultural y Educativa Johannes Gutenberg (Lima Norte)  
**Estado:** Aprobado para Planificación  

---

## 1. Definiciones Oficiales de Dominio (Fichas del Proyecto)

A partir de la auditoría de los documentos oficiales (`1. FLUJOGRAMAS DE PROYECTO INFANCIA SALUDABLE 30.04.26.docx`, `Hoja de cálculo sin título.xlsx`, `A4 - FICHA DE DATOS FACILITADORA`, `A4 - FICHA DE DATOS IGLESIA ALIADA`, `A5 - FICHA DE DATOS VOLUNTARIAS / DIRECTORES 2026`):

1. **Biblioteca Comunitaria:**
   - **Definición:** Espacio no formal de mediación lectora, refuerzo lúdico y acceso a literatura infantil implementado en las Casitas del Saber y locales comunales.
   - **Servicio matriz:** Servicio de Acompañamiento Educativo (Casitas del Saber).
   - **Propósito:** Desarrollar hábitos de lectura, comprensión lectora temprana y soporte escolar en niños de 3 a 12 años en situación de vulnerabilidad.

2. **JAC — «Juntos Aprendemos en Cristo»:**
   - **Definición:** Programa formativo-pastoral cristiano de discipulado infantil y afirmación de valores ético-espirituales en iglesias aliadas.
   - **Corrección histórica:** En versiones preliminares del prototipo figuraba erróneamente como *"Jóvenes en Acción Comunitaria"*. Su nombre oficial y canónico en el Programa Infancia Saludable es **«Juntos Aprendemos en Cristo» (JAC)**.
   - **Servicio matriz:** Componente pastoral y formativo articulado con el Servicio Alimentario-Nutricional en las Iglesias Aliadas.

3. **BTF — «Buen Trato en Familia»:**
   - **Definición:** Ciclo de talleres vivenciales y formativos dirigidos a padres, madres y cuidadores principales.
   - **Servicio matriz:** Área Social Pastoral (ASP) y Acompañamiento Familiar.
   - **Propósito:** Prevenir la violencia intrafamiliar y el castigo físico/humillante, promoviendo pautas de crianza respetuosa, apego seguro y bienestar socioemocional infantil.

4. **Talleres de Repostería:**
   - **Definición:** Módulos de capacitación técnica, higiene alimentaria y emprendimiento productivo dirigidos a madres voluntarias y comités de apoyo.
   - **Servicio matriz:** Emprendimiento Comunitario / Comedores e Iglesias Aliadas.
   - **Propósito:** Brindar herramientas de autosostenimiento económico a las familias a la par de asegurar refrigerios balanceados y nutritivos en las actividades del programa.

5. **Colaboradores e Instituciones Aliadas:**
   - **Definición:** Red territorial de actores institucionales y comunitarios que articulan y viabilizan las intervenciones del PDI en los tres distritos de operación (Comas, Carabayllo, El Agustino).
   - **Tres Categorías Canónicas:**
     - **Colegios Aliados (`colegios`):** Directores(as) de I.E. y Docentes Enlace (Ficha A5). Requieren Código Modular (7 dígitos), Nivel (Inicial, Primaria, Secundaria, Integrado) y Turno (Mañana, Tarde, Completo).
     - **Iglesias y Puntos Pastorales (`iglesias`):** Pastores(as), Sacerdotes y Enlaces Parroquiales (Ficha A4). Articulan comedores infantiles, JAC, BTF y Talleres de Repostería.
     - **Facilitadoras y Promotoras PDI (`pdi`):** Facilitadoras comunitarias, promotoras sociales y educativas asignadas por el PDI a territorio (Ficha A4).
   - **Vínculo con Sedes:** Cada colaborador opera en una Sede física del PDI o en una institución aliada vinculada al catálogo de Sedes.

---

## 2. Requerimientos de la Administración de Colaboradores

### R1. Capa de Datos Persistente en SurrealDB
- Crear la tabla `colaborador` en SurrealDB con soporte de alta, baja lógica (`activo = false`, cumpliendo la Ley 29733 de Protección de Datos Personales) y edición.
- Integrar la tabla `colaborador` en el lote de hidratación única (`SQL_LOTE_HIDRATACION`) de `src/scripts/core/db.js` para carga en 1 RTT.
- Almacenar en caché de sesión/snapshot (`pdi.recopilacionNube` / `StorageService`) para carga instantánea offline.
- Auditoría automática: Cada alta, edición o baja de colaborador debe registrarse en la tabla `bitacora_auditoria`.

### R2. Integración Bidireccional con Sedes
- **Desde `/sedes` hacia `/colaboradores`:**
  - El botón "Equipo Territorial" (`/colaboradores?sede=${encodeURIComponent(sede.nombre)}`) debe abrir la vista de Colaboradores filtrando automáticamente la tabla por dicha sede y actualizando los chips y contadores.
  - La tarjeta de detalle de Sede (`SedesView.js`) debe mostrar el equipo de campo asignado: Facilitadora, Pastor/Aliado y recuento de colaboradores vinculados.
- **Desde `/colaboradores` hacia `/sedes`:**
  - En el modal de alta/edición de Colaboradores, el campo `Sede / Institución` debe disponer de una lista desplegable/datalist alimentada dinámicamente con las Sedes activas de `SedeModel.getAll()`.
  - En la tabla y tarjetas móviles de Colaboradores, el nombre de la sede debe tener un enlace directo a `/sedes?filtro=${encodeURIComponent(sedeNombre)}`.

### R3. Reglas de Validación de Formularios
- **Nombres y Apellidos:** Requeridos, mínimo 2 caracteres, recorte de espacios.
- **DNI:** Opcional u obligatorio según rol; cuando se ingrese, exactamente 8 dígitos numéricos.
- **Celular / WhatsApp:** 9 dígitos numéricos empezando con el dígito `9` (formato Perú).
- **Teléfono Fijo:** Formato 7 dígitos o con prefijo de ciudad (ej. `01-5421234`).
- **Código Modular:** 7 dígitos numéricos (para I.E. / Colegios).
- **Estrategias:** Selección múltiple mediante checkboxes (`Desayuno Infantil`, `Casita del Saber`, `Buen Trato en Familia (BTF)`, `Juntos Aprendemos en Cristo (JAC)`, `Repostería`, `Área Social Pastoral`).

### R4. Interfaz y Experiencia de Usuario (UI/UX)
- Mantener la paleta y diseño institucional de PDI (Astro 7, tokens CSS).
- Respetar la regla de accesibilidad `prefers-reduced-motion` y el límite de 5 minutos de tiempo de iteración rápida según `AGENTS.md`.
- No incrementar el presupuesto de `!important` (`tests/important-guard.test.js`).
- Mantener en verde el 100% de la suite de pruebas unitarias (152/152 pruebas pasando).
