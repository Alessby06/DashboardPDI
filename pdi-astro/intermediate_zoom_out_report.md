# Stage 8: Intermediate Zoom Out Review Report

* **Persona**: Skeptical Architect (`egm-zoom-out`)  
* **Document Under Audit**: `concepts_brief.md` (lines 1–163)  
* **Date**: 2026-11-14  
* **Evaluated Against**: `zoom-out-standard.md` & Prior Reports (Stage 5 Zoom Out, Stage 6 Comprehension, Stage 7 Critic)  
* **Context Codebase**: `api/_cuentaBase.mjs`, `src/scripts/models/AuditModel.js`, `src/pages/auditoria.astro`, `src/scripts/core/db.js`

---

## 1. High-Altitude Synthesis (The 30,000-Foot Perspective)

Stepping back from the detailed findings of the previous review phases, the core problem and value proposition remain fundamentally valid:
* **The Root Problem**: Historical audit entries in PDI are opaque, unstructured strings (e.g., `"Registro de asistencia"`, `"PDI - Perfil"`, `"Contraseña actualizada"`), diffs are discarded or buried as unparsed text strings in `detalle`, and coordinators cannot quickly trace institutional health, nutritional, or case management changes.
* **The High-Value Core**: The two central ideas—**deterministic structured titles** (`Verbo + Concepto Operativo · Código`) and **semantic field-level diffs** (`antes -> después`)—solve this problem directly and cleanly.

However, the initial proposal in `concepts_brief.md` suffered from classic **architectural bloat and speculative over-engineering**:
1. **Speculative Abstractions (YAGNI)**: It introduced unauthenticated field operators (`operador_campo`), undefined sign-off workflows (`visados`), and a rigid 4-tier taxonomy (24+ submodules) that no user-facing UI consumes.
2. **Fatal Database Traps**: Declaring a rigid `SCHEMAFULL` table without default values would crash critical backend authentication events (`auditar()` in `_cuentaBase.mjs`), while `diff: NONE` and unconstrained object types risked runtime rejection in SurrealDB.
3. **Reinventing Established Wheels**: It proposed creating a redundant `AuditHelper.js` with an "automatic form interceptor" that bypassed `AuditModel.js` (used across >15 controllers and views) and ignored the existing `FilterPanel` / `FilterStore` architecture.
4. **False Scalability Assumptions**: It proposed client-side in-memory pagination over a capped query (`LIMIT 200`), creating silent false negatives where older records disappear from search results.
5. **Regulatory Violation**: Purging production audit logs to zero records directly violates Ley N.° 29733 immutability mandates.

The path forward requires stripping away the speculative weeds and hardening the core integration against the existing codebase.

---

## 2. Architectural Pruning Decisions

### A. What to Keep (Core Essentials)
* **Deterministic Structured Titles**: `Verbo de Acción + Concepto Operativo · Código de Entidad` (e.g., `Inscripción de Usuario · PDI-0082`, `Actualización de Tamizaje Nutricional · PDI-0042`).
* **Semantic Diffs**: Displaying discrete changes (`etiqueta`, `antes`, `despues`) for edited entities.
* **Core 2-Tier Classification**: `modulo` (the 8 official PDI modules) and `severidad` (`Rutinario`, `Sensible`, `Crítico/Legal`).
* **Expandable Ledger UI in `auditoria.astro`**: Replacing static tables with expandable cards that reveal diff deltas and session telemetry on demand.
* **Audited CSV Export**: Exporting filtered ledger views with mandatory audit log emission upon export.

### B. What to Prune & Abandon (YAGNI & Dangerous Compromises)
* ❌ **Prune `visados: array<object>`**: No supervisory sign-off workflow exists in PDI. Table must be strictly append-only (`FOR update NONE`).
* ❌ **Prune `operador_campo: none | string`**: An unverified secondary string adds zero security. The authenticated session cookie (`sesionDe`) is the sole authoritative identity.
* ❌ **Prune 24+ Submodules & 7 Operation Verbs from Mandatory Schema**: Do not enforce 24 rigid submodules across 30+ form controllers. Keep `modulo` and `severidad` as primary indexes; leave operation descriptors as optional free-text strings.
* ❌ **Prune `AuditHelper.js`**: Do not build a second audit dispatcher. All audit calls must flow through the existing `AuditModel.js`.
* ❌ **Prune Historical Wiping ("Vaciado Previo")**: Never purge the audit table. Retain legacy rows and project them gracefully via `mapearBitacora`.
* ❌ **Prune Unbounded Client-Side In-Memory Pagination**: Drop the idea of loading all records into browser memory; rely on server-assisted queries.
* ❌ **Prune Relational Coupling (`record<cuenta>`)**: Store `autor_usuario_id` as scalar `none | string` to prevent cross-namespace pointer breakages.

### C. What to Fix & Harden (Codebase Realignment)
* 🔧 **SurrealDB Safe Defaults & Append-Only Permissions**: All descriptive fields (`titulo`, `subtitulo`, `modulo`, etc.) must have `DEFAULT ""` or `none | string` so backend auth calls (`_cuentaBase.mjs`) never fail. Declare table permissions: `FOR select WHERE $auth.rol IN ['admin', 'coord']`, `FOR create FULL`, `FOR update NONE`, `FOR delete NONE`.
* 🔧 **Flexible Diff Schema**: Define `diff ON bitacora_auditoria TYPE none | array<object> | object FLEXIBLE;`.
* 🔧 **Backward-Compatible Facade in `AuditModel.js`**: Keep `AuditModel.log(user, role, action, entity, detail, diff, ip, sede)` and `addLog(entry)` signatures intact, automatically generating default structured titles and routing them to `/api/auditoria`.
* 🔧 **Server-Assisted Pagination in `_cuentaBase.mjs`**: Leverage the existing `limit` and `offset` (`START`) support in `handleAuditoria`, adding backend filter push-down for `modulo`, `severidad`, and `q`.

---

## 3. Minimal Viable Architecture Recommendation

```
+-------------------------------------------------------------------------+
|                              Astro Frontend                             |
|  - auditoria.astro: Expandable Ledger UI reusing FilterPanel & FilterStore|
|  - AuditModel.js: Unified Facade (log() & addLog() with title generator)|
+------------------------------------+------------------------------------+
                                     | POST { action, entity, detail, diff, sede }
                                     | GET  ?limit=25&offset=0&modulo=...
                                     v
+-------------------------------------------------------------------------+
|                  Serverless Endpoint (api/_cuentaBase.mjs)              |
|  - handleAuditoria(): Validates session cookie (no client tampering)   |
|  - Injects: usuario_nombre, rol, ip_origen, timestamp (time::now())    |
|  - Executes: Paginated SELECT with LIMIT / START + Indexed WHERE        |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                        SurrealDB Cloud Database                         |
|  - TABLE bitacora_auditoria SCHEMAFULL (Append-Only: update/delete NONE)|
|  - Fields: titulo, subtitulo, modulo, severidad (with DEFAULT "")       |
|  - diff: TYPE none | array<object> | object FLEXIBLE                    |
|  - Indexes: timestamp, modulo, severidad, entidad_codigo                |
+-------------------------------------------------------------------------+
```

### 1. Hardened SurrealDB Schema (`bitacora_auditoria`)
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
DEFINE FIELD OVERWRITE timestamp ON bitacora_auditoria TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

DEFINE INDEX idx_bitacora_timestamp ON bitacora_auditoria FIELDS timestamp;
DEFINE INDEX idx_bitacora_modulo ON bitacora_auditoria FIELDS modulo;
DEFINE INDEX idx_bitacora_severidad ON bitacora_auditoria FIELDS severidad;
```

---

## 4. Stage 8 Readiness Verdict

### **Verdict: 🟢 GO WITH REMEDIATION**

**Rationale**:
The core concept is sound, highly valuable, and fully achievable with minimal complexity once stripped of speculative bloat. By:
1. Reusing `AuditModel.js` and `_cuentaBase.mjs`,
2. Declaring safe defaults and append-only permissions in SurrealDB,
3. Simplifying the taxonomy to 2 tiers (`modulo` + `severidad`), and
4. Preserving historical audit data with server-assisted pagination,

the architecture transitions from a high-risk, crashing liability into a clean, resilient, and production-ready system.
