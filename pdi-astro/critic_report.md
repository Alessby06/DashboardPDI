# Stage 7: Critic Review Report

* **Document Under Audit**: `concepts_brief.md` (lines 1–163)
* **Date**: 2026-11-14
* **Standard Evaluated Against**: `feature-spec-standard.md`
* **Reviewers**:
  * **Design Critic Goldfish (`egm-design`)**: System architecture, scalability, security, and unmitigated failure modes.
  * **Structural Goldfish (`egm-structural`)**: Document blueprint, heading hierarchy, layout symmetry, and section completeness.
  * **Style Goldfish (`egm-style`)**: Technical copy clarity, objective framing, calibration of claims, and elimination of marketing fluff.

---

## Executive Summary & Stage Verdict

### Verdict: 🔴 REJECTED (REQUIRES REVISION)

The document establishes strong foundational concepts (structured event titles, standardized module taxonomy, and readable diffs), but fails several core requirements of the Feature Specification Standard:
1. **Critical Architectural Blockers**:
   - In-memory client pagination and filtering over capped API queries (`LIMIT 200`) produces false negatives during audit searches and renders database indexes inert.
   - Declaring `SCHEMAFULL` with mandatory string fields without defaults will break internal server-side authentication events (`auditar()` in `api/_cuentaBase.mjs`), causing HTTP 500 crashes during login and password resets.
   - Client-side diff calculation and `PERMISSIONS FULL` in SurrealDB violate audit immutability and allow client-side tampering.
   - Proposing the complete destruction of historical audit logs ("vaciado previo") violates Ley N.° 29733.
2. **Structural Deficiencies**: Completely missing mandatory sections: `Problem Statement` and `Risks & Limits / Mitigations`. Inverted blueprint order (Architecture precedes Goals/Scope).
3. **Style & Editorial Issues**: Uncalibrated security claims ("no repudio" without digital signatures), blanket legal claims, and emotional/promotional phrasing in UI descriptions.

---

## Section 1: Design Critic Findings (`egm-design`)

### Finding 1.1 (Blocker): Scalability Collapse via In-Memory Filtering and Client Pagination
* **Affected Scope**: Lines 126–127 (Paginación Limpia), Lines 160–163 (Alternatives #3), `AuditView.js`, `_cuentaBase.mjs`.
* **Technical Risk**: The brief specifies client-side pagination and local filtering without server queries. In `api/_cuentaBase.mjs`, the endpoint defaults to `LIMIT 200` (max 1000). Searching for older historical records (CRED, daily meals, attendance) will return 0 results even when records exist in SurrealDB. Furthermore, loading unbounded historical records into mobile/tablet browsers in field clinics causes memory exhaustion, while declared database indexes (`idx_bitacora_timestamp`, `idx_bitacora_modulo`, etc.) remain unused.
* **Actionable Recommendation**: Mandate server-side cursor/offset pagination and indexed query filtering (`?modulo=...&severidad=...&q=...&desde=...&hasta=...&limit=25&offset=0`) pushed down to SurrealQL.

### Finding 1.2 (Blocker): Unlawful Audit Destruction ("Vaciado Previo") Violating Forensic Immutability
* **Affected Scope**: Line 136 (`In-Scope Goals`).
* **Technical Risk**: Listing the destruction of the historical audit log down to 0 records violates Peruvian Personal Data Protection Law (Ley N.° 29733) and institutional accountability. Historical data operations cannot be purged to simplify schema evolution.
* **Actionable Recommendation**: Replace table purging with a non-destructive migration script (`scripts/migrar-bitacora-v2.mjs`) or project legacy records cleanly through `db.js:mapearBitacora`.

### Finding 1.3 (Blocker): Non-Repudiation Broken by Client-Side Diffing and Permissive Table Permissions
* **Affected Scope**: Line 10, Lines 64–85, Lines 139–141 (`AuditHelper.js`).
* **Technical Risk**: Computing diffs in client JavaScript allows malicious or compromised clients to falsify before-and-after values or bypass audits entirely. Furthermore, declaring `PERMISSIONS FULL` on `bitacora_auditoria` allows any client query to mutate or delete audit records.
* **Actionable Recommendation**:
  1. Define table permissions as strictly append-only:
     ```surql
     DEFINE TABLE bitacora_auditoria TYPE NORMAL SCHEMAFULL 
       PERMISSIONS 
         FOR select WHERE $auth.rol IN ['admin', 'coord']
         FOR create FULL
         FOR update NONE
         FOR delete NONE;
     ```
  2. Acknowledge client diffing as an operational convenience, and mandate backend-validated diffs for sensitive actions (security, credentials, ASP).

### Finding 1.4 (Blocker): Schema Incompatibility Breaking Internal Server-Side Auth Calls
* **Affected Scope**: Lines 64–91 (SurrealDB Schema) & Line 138 (`api/_cuentaBase.mjs`).
* **Technical Risk**: Internal auth functions (`auditar()` in `_cuentaBase.mjs` lines 524, 659, 740, etc.) record events such as "MFA activado" or "Contraseña actualizada" with legacy keys (`usuario_nombre, rol, accion, entidad, detalle, ip_origen`). Enforcing a `SCHEMAFULL` table where `titulo`, `subtitulo`, `modulo`, `submodulo`, `tipo_operacion`, `entidad_tipo`, and `entidad_codigo` are mandatory string fields will crash all backend authentication and user management routines.
* **Actionable Recommendation**: Redesign server-side `auditar()` to supply default taxonomy values (`modulo = 'Cuentas y Acceso'`, `severidad = 'Crítico/Legal'`) and declare taxonomy fields with `DEFAULT ""` or `none | string`. Declare `diff TYPE none | object FLEXIBLE;`.

### Finding 1.5 (Major): Superficial Alternatives Evaluation Violating The Alternatives Rule
* **Affected Scope**: Lines 150–163 (`## Alternatives Weighed`).
* **Technical Risk**: Evaluates only cosmetic UI choices (free vs structured title, full snapshot vs diff, load more vs local pagination) while omitting core architectural trade-offs: client vs server diffing, synchronous write vs background queuing, single table vs partitioned historical storage.
* **Actionable Recommendation**: Rewrite the alternatives section to evaluate substantive architectural trade-offs with concrete technical justifications.

### Finding 1.6 (Major): Sensitive Data Leakage in Diff Resumes and Unaudited CSV Export
* **Affected Scope**: Lines 22–25, Lines 93–107, Lines 128–130.
* **Technical Risk**: Clinical evaluations and minor health data (`Hemoglobina actualizada de 10.8 a 11.6 g/dL`) appear in unmasked cleartext in top-level subtitles. Furthermore, the bulk CSV export does not generate an audit log of itself.
* **Actionable Recommendation**: Mask clinical identifiers in top-level summaries, and require that bulk CSV exports generate a `Crítico/Legal` audit entry.

---

## Section 2: Structural Goldfish Findings (`egm-structural`)

### Finding 2.1 (Blocker): Completely Missing Mandatory Section "Risks & Limits / Mitigations"
* **Affected Scope**: Post-Line 163.
* **Discrepancy Description**: The standard strictly mandates an explicit section on Risks & Limits detailing failure modes, network timeouts, offline behavior, and mitigation controls. The section is completely absent.
* **Actionable Recommendation**: Add a dedicated `## Risks & Limits / Mitigations` section.

### Finding 2.2 (Blocker): Missing Canonical "Problem Statement" Section
* **Affected Scope**: Lines 6–12 (`## Overview`).
* **Discrepancy Description**: The document opens with proposed solutions without formally defining the existing failure modes, unindexed bottlenecks, or coordinator pain points.
* **Actionable Recommendation**: Add a dedicated `## Problem Statement` section.

### Finding 2.3 (Major): Inverted Blueprint Order
* **Affected Scope**: Lines 14–147.
* **Discrepancy Description**: Technical architecture and database schemas are placed before scope boundaries (`## Goals vs. Non-Goals`). Under standard blueprint conventions, requirements and goals must precede architecture.
* **Actionable Recommendation**: Reorder the document structure to:
  1. `# Title`
  2. `## Problem Statement`
  3. `## Goals & Non-Goals`
  4. `## Proposed Architecture`
  5. `## Alternatives Considered`
  6. `## Risks & Limits / Mitigations`

### Finding 2.4 (Major): Non-Canonical Section Header Names
* **Affected Scope**: Line 14 (`## Analysis & Architectural Decisions`) and Line 150 (`## Alternatives Weighed`).
* **Discrepancy Description**: Standard blueprint headers are `## Proposed Architecture` and `## Alternatives Considered`.
* **Actionable Recommendation**: Adopt canonical section names to support automated spec tooling.

---

## Section 3: Style Goldfish Findings (`egm-style`)

### Finding 3.1 (Major): Uncalibrated Security Claim ("No Repudio")
* **Affected Scope**: Line 10.
* **Style Rationale**: Non-repudiation requires asymmetric digital signatures and cryptographic proof. Logging string identifiers into a mutable database is role attribution, not cryptographic non-repudiation.
* **Editorial Action**: `CALIBRATE` -> "trazabilidad de doble autoría (usuario autenticado y operador de campo)".

### Finding 3.2 (Major): Uncalibrated Legal Claim
* **Affected Scope**: Line 10.
* **Style Rationale**: Omitting passwords from a diff does not constitute complete statutory compliance with Ley N.° 29733.
* **Editorial Action**: `CALIBRATE` -> "aplicando principios de minimización de datos conforme a la Ley N.° 29733 al excluir credenciales y datos sensibles no requeridos".

### Finding 3.3 (Major): Overinflated Terminology and UI Jargon
* **Affected Scope**: Section 5 (Lines 112, 117, 119, 128).
* **Style Rationale**: "Forense", "Metáfora Ledger Expandible", and "Barra de Facetas Reactivas" are buzzwords for standard session telemetry, expandable table rows, and filter panels.
* **Editorial Action**: `CALIBRATE` -> Use neutral engineering terminology ("Vista tabular expandible", "Metadatos de sesión", "Panel de filtros y búsqueda", "Exportación CSV").

### Finding 3.4 (Major): Promotional Adjectives in Pagination Description
* **Affected Scope**: Lines 126–127.
* **Style Rationale**: Phrases like "Paginación Limpia", "ultra-rápida", and "obstructivos" are subjective and promotional.
* **Editorial Action**: `CALIBRATE` -> Neutral technical description of client-side or server-assisted pagination.

### Finding 3.5 (Nit): Absolutist Phrasing & Legacy Idiom
* **Affected Scope**: Lines 108–109.
* **Style Rationale**: Replace emotional words like "jamás ingresan" and legacy terms like "Lista Negra" with "Lista de exclusión" / "Denylist".
* **Editorial Action**: `CALIBRATE`.
