# Stage 5: Initial Zoom Out Review Report

* **Document Under Audit**: `concepts_brief.md` (lines 1–163)
* **Date**: 2026-11-14
* **Reviewers**:
  * **Skeptical Architect (Zoom Out Goldfish)**: High-altitude simplicity, YAGNI, codebase reuse, anti-weeds.
  * **Inventive Catalyst Goldfish**: TRIZ contradiction elimination and architectural trade-off analysis.
* **Context Files Inspected**: `api/_cuentaBase.mjs`, `src/scripts/models/AuditModel.js`, `src/scripts/views/AuditView.js`, `src/scripts/views/ModalView.js`, `src/pages/auditoria.astro`, `src/styles/views-auditoria.css`, `src/scripts/core/db.js`.

---

## Executive Summary & Stage Verdict

### Verdict: 🔴 REVISE REQUIRED (BLOCKER)

While the proposal introduces valuable concepts for readability (structured deterministic titles and semantic diffs), the foundational architecture suffers from critical blockers, speculative over-engineering, and disconnect from the current codebase:
1. **SurrealDB `SCHEMAFULL` Fatal Flaw**: Declaring 13 mandatory string fields without defaults will immediately crash backend security/auth audit emissions in `api/_cuentaBase.mjs`. Furthermore, declaring `diff TYPE none | object` without `FLEXIBLE` causes SurrealDB to reject arbitrary key-value diffs.
2. **Reinventing the Wheel across 30+ Call Sites**: Proposing a new `AuditHelper.js` with an incompatible signature breaks >15 controllers, models, and views actively using `AuditModel.js`.
3. **Speculative Features (YAGNI)**: Fields like `visados` (approval endorsement array) and `operador_campo` (unauthenticated secondary actor) have no operational basis or UI consumer in the current platform.
4. **Forensic Integrity Contradiction**: Listing the destruction of previous audit logs as an in-scope goal directly contradicts Ley N.° 29733 immutability mandates.
5. **Pagination & Query Scalability False Compromise**: Relying on in-memory client pagination and filtering over a capped API response (200 records) leads to silent false negatives when searching older audit records.

---

## Section 1: Skeptical Architect (Zoom-Out) Findings

### 1.1 Vector: Simplicity & YAGNI (You Aren't Gonna Need It)

* **Finding 1.1.1 (Blocker) - Speculative Fields (`visados`, `operador_campo`)**:
  * *Affected Scope*: Section 3 (`bitacora_auditoria` schema, lines 80, 85).
  * *Analysis*: Line 85 defines `visados: array<object> DEFAULT [] PERMISSIONS FULL`, and line 80 defines `operador_campo: none | string`. Neither the project overview, the UI ledger, nor any operational workflow mentions multi-signature audit endorsements. In PDI, user actions are strictly authenticated via cookie sessions (`sesionDe(request, cfg)`). There is no operational role for an unauthenticated field operator separate from the active session.
  * *Recommendation*: Remove `visados` and `operador_campo` from the schema. Keep audit logs strictly focused on the authenticated actor and contextual request data.

* **Finding 1.1.2 (Major) - Over-Engineered 4-Tier Taxonomy**:
  * *Affected Scope*: Section 2 (Taxonomía de Clasificación Multinivel, lines 26–61).
  * *Analysis*: Declares 8 modules, 24+ hardcoded submodules, 7 operation types, and 3 severities. However, the UI filter panel in `auditoria.astro` / `AuditView.js` only exposes **Módulo Oficial** and **Severidad**. Enforcing 24+ rigid submodules across 30+ form actions adds significant developer friction and cognitive overhead without delivering user-facing value.
  * *Recommendation*: Prune to a streamlined 2-tier model: `modulo` (8 core system modules) and `severidad` (`Rutinario`, `Sensible`, `Crítico`), with an optional operation descriptor (`tipo_operacion`). Remove the rigid 24-submodule constraint from the mandatory schema.

* **Finding 1.1.3 (Blocker) - SurrealDB `SCHEMAFULL` Crash Risk**:
  * *Affected Scope*: Section 3 (lines 63–86) & Section 4 (lines 93–107).
  * *Analysis*: In `api/_cuentaBase.mjs`, internal authentication/security events (`auditar()` in lines 524, 659, 740, etc.) record events such as "MFA activado" or "Contraseña actualizada" directly on the backend with only `usuario_nombre`, `rol`, `accion`, `entidad`, `detalle`. Declaring `SCHEMAFULL` where `titulo`, `subtitulo`, `modulo`, `submodulo`, `tipo_operacion`, `entidad_tipo`, and `entidad_codigo` are mandatory `TYPE string` without `DEFAULT` will cause all backend auth events to fail with database schema rejection errors. Additionally, `diff TYPE none | object` will reject arbitrary properties unless declared `FLEXIBLE`.
  * *Recommendation*:
    1. Declare descriptive taxonomy fields with safe defaults (e.g. `DEFAULT ""` or `none | string`).
    2. Define diff as `TYPE none | object FLEXIBLE;` or retain a normalized array `array<object>`.

---

### 1.2 Vector: Codebase Reuse & Reinventing the Wheel

* **Finding 1.2.1 (Blocker) - Bypassing `AuditModel.js` Across 30+ Existing Call Sites**:
  * *Affected Scope*: Section 6 (In-Scope Goals, line 139).
  * *Analysis*: Line 139 proposes creating a new `AuditHelper.js` with an "automatic form diff interceptor". `src/scripts/models/AuditModel.js` is already the unified audit entry point across the application, called by `BeneficiarioController`, `SocialController`, `AccionNutricionalModel`, `AccionEducativaModel`, `ExpedienteView`, `SaludCredView`, etc. Changing the contract or creating a parallel helper breaks or duplicates audit infrastructure. Furthermore, PDI uses decoupled Astro views and controllers rather than a single form-intercept pipeline.
  * *Recommendation*: Reuse and enhance `AuditModel.js`. Maintain `AuditModel.log()` and `AuditModel.addLog()` as backward-compatible adapter facades that inject default metadata so existing callers do not break.

* **Finding 1.2.2 (Major) - Re-Inventing Faceted Filtering Infrastructure**:
  * *Affected Scope*: Section 5 (lines 119–130).
  * *Analysis*: `auditoria.astro` already integrates `FilterPanel.astro`, `FilterField.astro`, `FilterStore.js`, `Filters.js`, and `Responsive.js` with active chip bars, URL sync, and mobile-card toggling.
  * *Recommendation*: Leverage the existing `FilterPanel` and `FilterStore` architecture. Update facet definitions and query keys rather than proposing a bespoke filtering engine.

* **Finding 1.2.3 (Major) - Incompatible Diff Representation Breaking `ModalView`**:
  * *Affected Scope*: Section 4 (lines 94–107) & Section 5 (line 116).
  * *Analysis*: Currently `ModalView.js` (lines 242–262) expects diffs as an array of objects: `[{ campo, etiqueta, antes, despues }]`. Changing this to a keyed dictionary (`{ [campo]: { etiqueta, antes, despues } }`) breaks modal detail rendering unless explicitly normalized.
  * *Recommendation*: Store or project diffs as a normalized array of objects `array<object>` to maintain compatibility with existing visualizers.

---

### 1.3 Vector: Context Insufficiency & Root Problem Focus

* **Finding 1.3.1 (Major) - Missing Problem Statement & Motivation**:
  * *Affected Scope*: Overview (lines 6–12).
  * *Analysis*: The document jumps straight into technical solutions without defining why the existing audit system is inadequate (e.g. unreadable raw JSON logs for non-technical coordinators, lack of structured search facets, slow audit queries).
  * *Recommendation*: Add a concise "Problem & Motivation" section establishing the baseline pain points.

* **Finding 1.3.2 (Major) - Anti-Pattern: Wiping Historical Audit Logs**:
  * *Affected Scope*: Section 6 (In-Scope Goals, line 136).
  * *Analysis*: Purging the production audit log to accommodate a new schema directly contradicts Ley N.° 29733 requirements for continuous historical traceability.
  * *Recommendation*: Remove audit purging from the design goals. Specify backward-compatible projections in `db.js:mapearBitacora` so legacy log entries render cleanly alongside new structured entries.

---

### 1.4 Vector: Architectural Dead-Ends & Coupling

* **Finding 1.4.1 (Major) - Referential Coupling on `record<cuenta>`**:
  * *Affected Scope*: Section 3 (line 77).
  * *Analysis*: Setting `autor_usuario_id TYPE none | record<cuenta>` creates relational coupling across database namespaces. The PDI architecture is moving towards isolated user/account namespaces. If an account is pruned or anonymized, strict foreign record links in SurrealDB cause dangling pointer errors.
  * *Recommendation*: Store `autor_usuario_id` as `none | string` (an immutable scalar snapshot of the account ID).

---

## Section 2: Inventive Catalyst (TRIZ Contradictions) Findings

* **Finding 2.1 (Major) - False Compromise: In-Memory Client Pagination vs. Forensic Completeness**:
  * *Affected Scope*: Section 5 & Section 7 (Alternativa 3).
  * *Contradiction*: Fast, responsive local filtering versus exhaustive forensic querying across large datasets. Capping `/api/auditoria` at 200 records causes client-side search to miss older records silently.
  * *TRIZ Resolution Pattern*: **Dynamics (Pattern 6)** + **Extraction (Pattern 2)**.
    - Extract heavy `diff` payloads from the main ledger table listing (fetch row metadata first, load diff on-demand when a row expands).
    - Delegate search filters and pagination to indexed SurrealDB queries using cursor/keyset pagination (`WHERE timestamp < $cursor LIMIT 50`) driven transparently by user scroll/page selection.
  * *Secondary Trade-off*: Requires query parameter support in `/api/auditoria` and input debouncing.

* **Finding 2.2 (Major) - False Compromise: Client-Side Diff Calculation vs. Legal Non-Repudiation**:
  * *Affected Scope*: Section 1, Section 3, Section 6.
  * *Contradiction*: Minimizing backend refactoring versus guaranteeing untampered audit records under Ley N.° 29733. If client scripts calculate and emit diffs, network drops or modified client payloads can forge or drop audit records.
  * *TRIZ Resolution Pattern*: **Intermediary (Pattern 8)** / **Inversion (Pattern 5)**.
    - Compute diffs either via backend transactional endpoints or SurrealDB table events (`DEFINE EVENT audit_capture ON TABLE ...`).
  * *Secondary Trade-off*: Increased database write compute or serverless function routing.

* **Finding 2.3 (Nit) - In-Place Mutation of `visados` within an Immutable Table**:
  * *Affected Scope*: Section 3 (line 85).
  * *Contradiction*: Supporting supervisor sign-offs while maintaining strict append-only table permissions (`FOR update NONE`).
  * *TRIZ Resolution Pattern*: **Segmentation (Pattern 1)**.
    - If supervisor endorsements are ever required in the future, store them in a separate append-only table (`bitacora_visado`) pointing to the original immutable log entry.

---

## Consolidated Action Plan for `concepts_brief.md`

To resolve the Stage 5 blockers and prepare for Stage 6:
1. **Prune Speculative Scope**: Remove `visados` and `operador_campo`. Simplify taxonomy from 4 tiers (24+ submodules) to 2 core tiers (`modulo` and `severidad`).
2. **SurrealDB Schema Hardening**: Add `none | string` or defaults to taxonomy fields; declare `diff TYPE none | object FLEXIBLE;` or use `array<object>`. Change `autor_usuario_id` to `none | string`.
3. **Preserve Codebase Reuse**: Explicitly preserve and adapt `AuditModel.js`, `FilterPanel.astro`, `FilterStore.js`, and `ModalView.js`.
4. **Data Integrity & Immutability**: Drop audit wiping; specify schema migration / backward-compatible mapping.
5. **Server-Side Keyset Pagination**: Replace purely client-side filtering over capped data with server-assisted keyset queries and on-demand diff loading.
