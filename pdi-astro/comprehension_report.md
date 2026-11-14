# Stage 6: Comprehension Test Report

* **Document Under Audit**: `concepts_brief.md` (lines 1–163)
* **Date**: 2026-11-14
* **Reviewer**: Comprehension Goldfish (`egm-comprehension`) - Naive Reader Persona
* **Scope**: FeatureRange (1..163) / DetailedRange: N/A

---

### What this proposes
This document proposes a complete architectural and visual overhaul of the audit trail and traceability system for the *Programa Infancia Saludable* across the Comas and San Pedro (Carabayllo) sites. It establishes a deterministic naming convention (`Action Verb + Operational Concept · Entity Code`), semantic diff summaries, a classification taxonomy, and a key-value difference tracking model stored in SurrealDB (`bitacora_auditoria`) under Peru's Data Protection Law (Ley N.° 29733). On the user interface side, it replaces the current audit view with an expandable ledger in `auditoria.astro` featuring reactive facet filtering, client-side pagination, CSV export, and a shared frontend helper (`AuditHelper.js`/`AuditModel.js`) to capture mutation diffs across application forms.

### How the existing system works, per this document
Based strictly on what is written, the existing system maintains an audit log stored in SurrealDB Cloud that is accessed via `auditoria.astro` and served through `/api/auditoria` (restricted to Coordination and IT Admin roles). Historically, entries allowed free-text titling that resulted in vague, inconsistent entries (e.g., "cambio", "ok", "corregido"), lacked structured diff breakdowns, and accumulated records that have now been purged or targeted for complete wiping to zero records. The document indicates that previous or alternative table views relied on intrusive manual "load more" buttons, but it does not specify the legacy schema, the previous diff mechanism, or how authorship was previously validated.

---

### Audit Findings

#### 1. Diff Acquisition Lifecycle and Client-Side Tampering Risk
- **Severity**: Blocker
- **Affected Scope**: Section 4 (Lines 94-110) & Section 5 / Goals (Line 139)
- **Discrepancy Description & Rationale**: The document specifies a key-value diff structure containing `"antes"` and `"despues"` values, and notes that a frontend utility (`AuditHelper.js`) will "automatically capture titles and diffs from any form". However, it never explains how the initial `"antes"` state is captured, stored, or reconciled. Does each form keep a pristine snapshot in memory? How does the system handle concurrent updates where the database state changed between form presentation and submission? Crucially, computing and dispatching audit diffs directly from the browser client introduces an acute data-integrity gap (the client can manipulate what the "before" state was or omit altered fields), which directly undermines non-repudiation.

#### 2. Local In-Memory Pagination vs. Audit Trail Volume
- **Severity**: Blocker
- **Affected Scope**: Section 5 (Line 127) & Section 3 (Lines 87-90) & Alternatives (Lines 160-163)
- **Discrepancy Description & Rationale**: The specification calls for "Paginación local ultra-rápida (10, 25, 50 por página)" without server "load more" buttons. In frontend architecture, "paginación local" implies loading all records into browser memory and slicing them locally. For a high-throughput institutional system logging daily meal rations, attendance, vital signs, and case transitions, loading an unbounded historical record set into memory will cause severe browser performance degradation. Furthermore, defining indexes on `timestamp`, `modulo`, and `severidad` in SurrealDB is rendered moot if the backend API dumps the entire table to the client rather than serving indexed, paginated cursor/limit queries.

#### 3. Unspecified Mechanism for "Doble Autoría" and Undefined "Visados"
- **Severity**: Blocker
- **Affected Scope**: Overview (Line 10) & Section 3 Schema (Lines 77-80, 85)
- **Discrepancy Description & Rationale**: The Overview claims the architecture provides "doble autoría para garantizar el no repudio" (dual authorship to guarantee non-repudiation). However, the SurrealDB table schema only provides standard author fields (`autor_usuario_id`, `autor_nombre`, `autor_rol`) alongside an optional string field: `operador_campo TYPE none | string`. The brief never explains what constitutes an `operador_campo`, how their identity is authenticated, or how an optional unverified string guarantees non-repudiation. Furthermore, the schema defines `visados ON bitacora_auditoria TYPE array<object> DEFAULT []`, yet the term "visado" is never defined, its object structure is omitted, and no corresponding workflow (e.g., supervisory approvals or secondary sign-offs) is documented.

#### 4. Undefined Domain Acronyms and Program Terminology
- **Severity**: Major
- **Affected Scope**: Section 1 & Section 2 (Lines 18-21, 34, 41-44, 53, 60)
- **Discrepancy Description & Rationale**: The document assumes deep institutional knowledge by introducing several specialized domain acronyms without definition:
  - **`ASP`** (Lines 20, 24, 34, 44): Associated with "Servicio Social Pastoral", but the acronym mismatch (ASP vs SSP) is unexplained (e.g., does it mean *Área Social Pastoral* or *Acompañamiento Social Pastoral*?).
  - **`JAC` and `BTF`** (Line 41): Listed under community initiatives (`Iniciativas Comunitarias (JAC/BTF/Repostería)`) with no context.
  - **`CRED`** (Line 42): Listed under nutritional health (`Control CRED / Dosaje Hb`) without stating it refers to Peru's *Control de Crecimiento y Desarrollo*.
  - **`F/J`** (Line 44): Used in `Evaluación de Vulnerabilidad F/J` without definition.
  - **`DEMUNA` and `CEM`** (Lines 20, 44, 53): Peruvian public protection entities (*Defensoría Municipal del Niño y del Adolescente*, *Centro Emergencia Mujer*) that external or new developers will not understand without context.
  - **Entity Codes** (Lines 18-21): Prefixes like `PDI-0082`, `CAS-0015`, and `SEDE-SP` are introduced without stating the code generation pattern or entity type mapping.

#### 5. Ambiguous Source of Semantic Business Logic in Subtitles
- **Severity**: Major
- **Affected Scope**: Section 1 (Lines 22-25) & Section 4 (Lines 94-107)
- **Discrepancy Description & Rationale**: The specification presents generated summaries containing qualitative clinical evaluations, such as `"Hemoglobina actualizada de 10.8 a 11.6 g/dL (cambio a Normal)"`. Transforming numeric diffs into clinical qualitative labels (`cambio a Normal`) requires domain-specific thresholds (e.g., pediatric altitude-adjusted anemia curves). The document fails to clarify where this evaluation logic executes: does `AuditHelper.js` maintain clinical evaluation formulas for all modules, does the triggering business form supply semantic delta labels, or does a backend service enrich the diff?

#### 6. Purge of Audit History Without Archival or Migration Plan
- **Severity**: Major
- **Affected Scope**: Goals (Line 136)
- **Discrepancy Description & Rationale**: Goal item 1 notes `"✅ Vaciado previo de la bitácora anterior (0 registros en SurrealDB Cloud)"`. Purging an institutional audit log to zero records in an environment subject to legal data protection (Ley N.° 29733) and child protection audits without documenting a formal archival, backup snapshot, or data retention policy presents an operational and compliance gap.

#### 7. Contradiction in Taxonomy Depth
- **Severity**: Nit
- **Affected Scope**: Overview (Line 10) vs Section 2 (Lines 26-61)
- **Discrepancy Description & Rationale**: Line 10 states that the design introduces `"una taxonomía jerárquica de dos niveles"` (two-level hierarchy: Module and Submodule). However, Section 2 immediately lays out a 4-level taxonomy: Nivel 1 (Módulos Oficiales), Nivel 2 (Submódulos Operativos), Nivel 3 (Tipo de Operación), and Nivel 4 (Severidad Institucional).

#### 8. Architectural Placement of Endpoint in `_cuentaBase.mjs`
- **Severity**: Nit
- **Affected Scope**: Goals (Line 138)
- **Discrepancy Description & Rationale**: Line 138 specifies updating `/api/auditoria` in `api/_cuentaBase.mjs`. Housing general audit logging logic inside an account-specific base file (`_cuentaBase`) is counter-intuitive to a new engineer unless the project's routing architecture is clarified.

---

### Comprehension Summary
The brief provides a strong visual and conceptual vision for standardizing audit log entries and UI presentation. However, from the perspective of an incoming engineer with zero institutional knowledge, the proposal contains critical operational blanks: it does not define the data lifecycle for capturing before-and-after states, relies on an unsustainable "local pagination" model for an enterprise audit ledger, and leaves core schema properties (`operador_campo`, `visados`, and the promise of "doble autoría") completely undefined. Additionally, widespread undefined local acronyms (ASP, JAC, BTF, CRED, F/J) and unstated business logic boundaries (how clinical thresholds in subtitles are resolved) prevent the document from being fully self-contained.
