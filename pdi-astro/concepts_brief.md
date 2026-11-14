# Remake del Sistema de Historial de Cambios y Trazabilidad

* **Author:** Piero
* **Date:** 2026-11-14
* **Status:** Approved Architecture (Post EGM-Review Stages 5–8)

---

## Problem Statement

El sistema actual de auditoría en el Programa Infancia Saludable (`bitacora_auditoria`) presenta tres deficiencias operativas y forenses críticas:
1. **Opacidad y Títulos Libres**: Las entradas históricas se registran con cadenas libres y dispares (p. ej., `"Registro de asistencia"`, `"PDI - Perfil"`, `"Contraseña actualizada"`), impidiendo que la coordinación institucional y los administradores identifiquen con rapidez qué cambió, sobre qué niño o beneficiario específico y con qué severidad.
2. **Pérdida de Diferencias Estructuradas (Diffs)**: Los valores anteriores y nuevos no se capturan de forma normalizada, quedando omitidos o sepultados como texto plano no parseable en `detalle`, lo que dificulta auditorías clínicas y legales bajo la Ley N.° 29733.
3. **Escalabilidad y Consulta Ineficiente**: El endpoint actual limita arbitrariamente a 200 registros y la vista carece de filtrado por facetas institucionales (módulos oficiales y niveles de severidad), imposibilitando la búsqueda exhaustiva en tablas de alto volumen.

---

## Goals & Non-Goals

### In-Scope Goals
- **Titulado Determinista**: Generar automáticamente títulos legibles bajo la fórmula `Verbo de Acción + Concepto Operativo · Código de Entidad` (p. ej., `Inscripción de Usuario en Padrón · PDI-0082`).
- **Diffs Clave-Valor Normalizados**: Registrar diferencias explícitas en un array de objetos (`[{ campo, etiqueta, antes, despues }]`), omitiendo campos intactos y enmascarando contraseñas/secretos.
- **Taxonomía Institucional de 2 Niveles**: Clasificación estandarizada en 8 Módulos Oficiales del sistema y 3 Niveles de Severidad (`Rutinario`, `Sensible`, `Crítico/Legal`).
- **Esquema SurrealDB Append-Only con Valores por Defecto**: Tabla `bitacora_auditoria` con permisos `update NONE, delete NONE`, campos con `DEFAULT` para evitar caídas en eventos del backend y soporte para diffs flexibles.
- **Fachada Compatible en `AuditModel.js`**: Mantener las firmas existentes `AuditModel.log()` y `AuditModel.addLog()` para garantizar compatibilidad con los más de 30 puntos de llamada en el código actual.
- **Endpoint Servidor `/api/auditoria` Mejorado**: Soporte para filtrado indexado (`modulo`, `severidad`, `q`) y paginación con `limit` y `offset`.
- **Vista Tabular Expandible en `auditoria.astro`**: Componente de registros expandibles que muestra de un vistazo severidad, título, módulo, autor, sede y fecha, expandiendo in-situ el visualizador de diferencias.
- **Exportación CSV Auditada**: Exportación filtrada en formato UTF-8 con BOM que a su vez emite un evento de auditoría para registrar la extracción.

### Out-of-Scope Non-Goals
- **Sin Firma Digital Criptográfica**: El sistema proporciona trazabilidad y atribución basada en la sesión autenticada (`sesionDe`), pero no implementa infraestructura PKI o firmas criptográficas asimétricas.
- **Sin Destrucción de Datos Históricos**: Se descarta el vaciado destructivo de logs históricos en producción; los registros previos se proyectan con valores por defecto mediante `mapearBitacora`.
- **Sin Reescribir Formularios de Dominio**: No se alteran los formularios de salud, educación o pastoral; la emisión se realiza mediante la fachada existente `AuditModel.js`.

---

## Proposed Architecture

```
+-------------------------------------------------------------------------+
|                              Astro Frontend                             |
|  - auditoria.astro: Vista tabular expandible con FilterPanel existente  |
|  - AuditModel.js: Fachada unificada con generador de títulos y diffs    |
+------------------------------------+------------------------------------+
                                     | POST { action, entity, detail, diff, sede }
                                     | GET  ?limit=25&offset=0&modulo=...
                                     v
+-------------------------------------------------------------------------+
|                  Endpoint Serverless (api/_cuentaBase.mjs)              |
|  - handleAuditoria(): Validación de cookie de sesión institucional      |
|  - Inyección segura de: usuario_nombre, rol, ip_origen, timestamp       |
|  - SELECT paginado con LIMIT / START + Cláusulas WHERE indexadas        |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                        SurrealDB Cloud Database                         |
|  - TABLE bitacora_auditoria SCHEMAFULL (update/delete: NONE)            |
|  - Campos con DEFAULT para compatibilidad retroactiva                   |
|  - diff: TYPE none | array<object> | object FLEXIBLE                    |
|  - Índices: timestamp, modulo, severidad, entidad_codigo                |
+-------------------------------------------------------------------------+
```

### 1. Modelo de Titulación Estructurado
* **Fórmula Determinista**: `Verbo de Acción + Concepto Operativo · Código de Entidad`.
  * *Padrón*: `Inscripción de Usuario en Padrón · PDI-0082`
  * *Salud y Nutrición*: `Actualización de Tamizaje Nutricional · PDI-0042`
  * *Social Pastoral*: `Derivación Externa a DEMUNA · CAS-0015`
  * *Educación*: `Registro de Asistencia en Casita del Saber · SEDE-SP`
* **Subtítulo Descriptivo**: Resumen semántico sintetizado a partir de los campos del diff:
  * *Ejemplo*: `Hemoglobina actualizada de 10.8 a 11.6 g/dL · Peso: 14.2 kg`

### 2. Taxonomía Institucional de Clasificación

#### Nivel 1: Módulos Oficiales del Sistema (8 Módulos)
1. `Padrón de Usuarios`
2. `Padrón de Colaboradores`
3. `Padrón de Voluntarios`
4. `Servicio Alimentario y Nutricional`
5. `Servicio de Acompañamiento Educativo`
6. `Servicio Social Pastoral (ASP)`
7. `Sedes e Iglesias Aliadas`
8. `Cuentas y Acceso`

#### Nivel 2: Severidad Institucional
* `Rutinario` (Verde): Operaciones diarias sin impacto crítico ni legal (asistencias, raciones de alimentos, datos de contacto ordinarios).
* `Sensible` (Ámbar): Datos de salud infantil (dosajes con anemia, diagnósticos nutricionales), evaluación de vulnerabilidad extrema, información patrimonial o familiar confidencial.
* `Crítico/Legal` (Rojo): Medidas de protección infantil, derivaciones a DEMUNA o CEM, oficios policiales, bajas disciplinarias, modificaciones de seguridad y cuentas administrativas.

### 3. Esquema Hardened en SurrealDB (`bitacora_auditoria`)
```surql
DEFINE TABLE bitacora_auditoria TYPE NORMAL SCHEMAFULL 
  PERMISSIONS 
    FOR select WHERE $auth.rol IN ['admin', 'coord']
    FOR create FULL
    FOR update NONE
    FOR delete NONE;

DEFINE FIELD OVERWRITE id ON bitacora_auditoria TYPE record<bitacora_auditoria>;
DEFINE FIELD OVERWRITE titulo ON bitacora_auditoria TYPE string DEFAULT "" PERMISSIONS FULL;
DEFINE FIELD OVERWRITE subtitulo ON bitacora_auditoria TYPE string DEFAULT "" PERMISSIONS FULL;
DEFINE FIELD OVERWRITE modulo ON bitacora_auditoria TYPE string DEFAULT "General" PERMISSIONS FULL;
DEFINE FIELD OVERWRITE submodulo ON bitacora_auditoria TYPE none | string DEFAULT NONE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE severidad ON bitacora_auditoria TYPE string DEFAULT "Rutinario" PERMISSIONS FULL;
DEFINE FIELD OVERWRITE entidad_codigo ON bitacora_auditoria TYPE none | string DEFAULT NONE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE registro_id ON bitacora_auditoria TYPE none | string DEFAULT NONE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE detalle ON bitacora_auditoria TYPE string DEFAULT "" PERMISSIONS FULL;
DEFINE FIELD OVERWRITE diff ON bitacora_auditoria TYPE none | array<object> | object FLEXIBLE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE usuario_nombre ON bitacora_auditoria TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE rol ON bitacora_auditoria TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE autor_usuario_id ON bitacora_auditoria TYPE none | string DEFAULT NONE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE sede_nombre ON bitacora_auditoria TYPE string DEFAULT "Central" PERMISSIONS FULL;
DEFINE FIELD OVERWRITE ip_origen ON bitacora_auditoria TYPE string DEFAULT "" PERMISSIONS FULL;
DEFINE FIELD OVERWRITE user_agent ON bitacora_auditoria TYPE none | string DEFAULT NONE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE timestamp ON bitacora_auditoria TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

DEFINE INDEX idx_bitacora_timestamp ON bitacora_auditoria FIELDS timestamp;
DEFINE INDEX idx_bitacora_modulo ON bitacora_auditoria FIELDS modulo;
DEFINE INDEX idx_bitacora_severidad ON bitacora_auditoria FIELDS severidad;
DEFINE INDEX idx_bitacora_entidad ON bitacora_auditoria FIELDS entidad_codigo;
```

### 4. Estructura Normalizada del Diff
Para mantener compatibilidad con `ModalView.js` y tablas semánticas:
```json
[
  {
    "campo": "hb",
    "etiqueta": "Hemoglobina (g/dL)",
    "antes": 10.8,
    "despues": 11.6
  },
  {
    "campo": "estado_anemia",
    "etiqueta": "Diagnóstico de Anemia",
    "antes": "Anemia leve",
    "despues": "Sin anemia"
  }
]
```
* **Lista de Exclusión (Denylist)**: Contraseñas, hashes, tokens y secretos se excluyen automáticamente antes de la persistencia.
* **Supresión de No-Ops**: Si no hay cambios reales entre el estado anterior y el nuevo, el campo `diff` se almacena como `NONE`.

### 5. Interfaz de Usuario en `auditoria.astro`
* **Vista Tabular Expandible**:
  * Fila colapsada: Badge de Severidad (`Rutinario` verde, `Sensible` ámbar, `Crítico` rojo), `Título`, `Módulo`, `Autor`, `Sede`, `Fecha y Hora`.
  * Expansión in-situ: Muestra el subtítulo semántico, cajas comparativas de valor anterior tachado vs nuevo valor resaltado, IP y User-Agent del autor, y enlace al expediente si aplica.
* **Panel de Filtros y Búsqueda**:
  * Reutiliza `FilterPanel.astro` y `FilterStore.js` con facetas por:
    - Búsqueda multi-campo (`q`: título, DNI, código de caso).
    - Módulo Oficial (los 8 módulos).
    - Severidad (`Rutinario`, `Sensible`, `Crítico/Legal`).
    - Sede territorial (`Todas las sedes`, `Comas`, `San Pedro`, etc.).
    - Rango temporal (`Hoy`, `Últimos 7 días`, `Este mes`).
* **Paginación Asistida por Servidor**:
  * Navegación fluida por páginas (10, 25, 50 registros) que consulta al backend mediante `LIMIT` y `START`, evitando sobrecarga de memoria en dispositivos móviles.
* **Exportación CSV**:
  * Descarga del conjunto de datos filtrado en formato UTF-8 con BOM para Excel.

---

## Alternatives Considered

1. **Diff del Lado del Cliente vs. Diff en Servidor/Base de Datos**:
   - *Alternativa descartada*: Calcular y validar diffs exclusivamente en la base de datos mediante triggers `EVENT`.
   - *Motivo*: Complejidad operacional alta en SurrealDB Cloud para esquemas heterogéneos y mayor costo de cómputo en escrituras frecuentes.
   - *Decisión adoptada*: El cliente frontend (`AuditModel.js`) construye el payload del diff de forma declarativa, pero el endpoint servidor valida la sesión del autor (`sesionDe`), inyecta metadatos forenses inmutables (IP, timestamp, rol) y bloquea mutaciones o eliminaciones posteriores.
2. **Instantánea Completa (Full Snapshot) vs. Diff Normalizado**:
   - *Alternativa descartada*: Guardar el documento completo antes y después (JSON blobs de toda la entidad).
   - *Motivo*: Multiplica sustancialmente el volumen de almacenamiento requerido y traslada al navegador el costo computacional de buscar diferencias en tiempo de renderizado.
   - *Decisión adoptada*: Array normalizado de campos modificados (`campo`, `etiqueta`, `antes`, `despues`).
3. **Paginación Puramente en Memoria vs. Paginación Asistida por Servidor**:
   - *Alternativa descartada*: Descargar toda la bitácora histórica y paginar exclusivamente en la memoria del navegador.
   - *Motivo*: Falsos negativos en búsquedas cuando la API trunca a 200/1000 registros y degradación de memoria en tablets de campo.
   - *Decisión adoptada*: Paginación asistida por servidor con parámetros `limit` y `offset`, complementada con caché local de sesión.
4. **Vaciado Destructivo vs. Proyección Retrocompatible**:
   - *Alternativa descartada*: Borrar todos los registros históricos en producción.
   - *Motivo*: Violación de la Ley N.° 29733 de Protección de Datos Personales y pérdida de trazabilidad legal.
   - *Decisión adoptada*: Migración no destructiva y proyección segura mediante valores `DEFAULT` en SurrealDB y normalización en `mapearBitacora`.

---

## Risks & Limits / Mitigations

1. **Riesgo de Bloqueo por Fallas de Red en Auditoría**:
   - *Mitigación*: La emisión de auditoría en `AuditModel.js` es no bloqueante (`fail-open` para la experiencia del usuario con logging de errores en consola), evitando que un retraso en `/api/auditoria` impida guardar datos críticos de atención médica o entrega de raciones.
2. **Exposición de Datos Médicos Sensibles en Subtítulos**:
   - *Mitigación*: Los valores de hemoglobina y puntajes de vulnerabilidad solo son visibles para roles con autorización médica o de coordinación (`admin`, `coord`), manteniendo títulos genéricos para operadores sin privilegios.
3. **Sobrecarga de Consultas por Filtros Dinámicos**:
   - *Mitigación*: La búsqueda por texto libre y filtros se debouncea a 300 ms en `AuditView.js` y se apoya en los índices `idx_bitacora_timestamp`, `idx_bitacora_modulo` y `idx_bitacora_severidad` en SurrealDB.

---

## Detailed Implementation Plan

### Phase 1: SurrealDB Database Schema Update
- [ ] Ejecutar sentencia DDL en SurrealDB Cloud para actualizar `bitacora_auditoria` con los nuevos campos, valores `DEFAULT` y permisos append-only (`FOR update NONE, FOR delete NONE`).
- [ ] Crear índices `idx_bitacora_timestamp`, `idx_bitacora_modulo`, `idx_bitacora_severidad`, `idx_bitacora_entidad`.
- [ ] Verificar que inserciones con el formato legado sigan teniendo éxito gracias a los valores `DEFAULT`.

### Phase 2: Serverless Endpoint Enhancements (`api/_cuentaBase.mjs`)
- [ ] Actualizar `handleAuditoria` en `api/_cuentaBase.mjs`:
  - Enriquecer `GET`: soportar parámetros de consulta `modulo`, `severidad`, `q`, `desde`, `hasta` con cláusulas `WHERE` indexadas sobre SurrealDB.
  - Enriquecer `POST`: aceptar y validar los nuevos campos estructurados (`titulo`, `subtitulo`, `modulo`, `severidad`, `diff`), inyectando identidad y sesión inmutables.
  - Asegurar que la función interna `auditar()` en `_cuentaBase.mjs` suministre valores válidos por defecto para eventos de seguridad (MFA, contraseñas, sesiones).

### Phase 3: Client Model & Data Mapping Layer (`src/scripts/models/AuditModel.js` & `db.js`)
- [ ] Actualizar `db.js:mapearBitacora` para normalizar registros legados (generar títulos derivados si faltan, asignar módulo "General" y severidad "Rutinario").
- [ ] Mejorar `AuditModel.js`:
  - Crear helper `AuditModel.generarTitulo(accion, entidad, codigo)`.
  - Crear helper `AuditModel.calcularDiff(estadoAnterior, estadoNuevo, diccionarioEtiquetas)`.
  - Preservar `AuditModel.log()` y `AuditModel.addLog()` para compatibilidad con el resto del sistema.

### Phase 4: UI Ledger Overhaul in `auditoria.astro` & `AuditView.js`
- [ ] Actualizar `src/pages/auditoria.astro` con el contenedor de la vista tabular expandible y selector de límite por página (10, 25, 50).
- [ ] Actualizar `src/scripts/views/AuditView.js`:
  - Conectar filtros de `FilterStore` a peticiones paginadas al endpoint `/api/auditoria`.
  - Renderizar filas expandibles con badge de severidad y título estructurado.
  - Renderizar panel de diferencias (`diff`) al expandir la fila.
  - Implementar exportación CSV respetando los filtros activos y emitiendo traza de auditoría.
- [ ] Ajustar estilos en `src/styles/views-auditoria.css` para acordeón expandible, badges de severidad (`rutinario`, `sensible`, `critico`) y tablas de diff comparativas.

### Phase 5: Verification & Quality Assurance
- [ ] Ejecutar `npm test` para asegurar que ningún test unitario existente se rompa.
- [ ] Ejecutar `npm run build` para verificar integridad de tipos y compilación limpia de Astro.
- [ ] Verificar inserción de un registro de prueba y corroborar renderizado correcto en la vista de auditoría.
