# 001 — Smoother module card open/close/switch durations

- Status: TODO
- Commit: 5a0fa4d
- Severity: MEDIUM
- Category: Easing & duration
- Estimated scope: `pdi-astro/src/pages/login.astro`, 2 CSS blocks (~40 lines)

## Problem

Module accordions take too long to open/close, especially in dark showcase:
- `pdi-astro/src/pages/login.astro:1541`: `transition: max-height 0.582s ... opacity 0.437s ... margin-top 0.437s ...`
- `pdi-astro/src/pages/login.astro:914`: `transition: max-height 0.35s ... opacity 0.25s ... margin-top 0.25s ...`

Switching from one open module to another feels abrupt precisely because the old panel is still running a long max-height animation. Duration stays >300ms for a UI reveal, which feels sluggish.

## Target

```css
/* target (base) */
.module-text-wrap p {
  transition: max-height 0.28s var(--ease-mod), opacity 0.20s var(--ease-mod), margin-top 0.20s var(--ease-mod);
}
/* checked max-height stays same (80px / 120px / 140px) */

/* target (showcase dark) */
.showcase-column .modules-card .module-text-wrap p {
  transition: max-height 0.28s var(--ease-mod), opacity 0.20s var(--ease-mod), margin-top 0.20s var(--ease-mod);
}
.showcase-column .modules-card .module-chev {
  transition: transform 0.24s var(--ease-mod);
}
```

Token (add near existing easing tokens):

```css
--ease-mod: cubic-bezier(0.23, 1, 0.32, 1);
```

## Repo conventions to follow

- Use strong `ease-out` curve per audit, not `ease`/strong custom weaker.
- Lift duration per AUDIT: UI under 300ms.

## Steps

1. Open `pdi-astro/src/pages/login.astro`.
2. Add `--ease-mod: cubic-bezier(0.23, 1, 0.32, 1);` in the `:root` tokens near `--ease-out`.
3. Replace line 914 transition with shorter tokenized one.
4. Replace showcase transition block at line 1541 with shorter tokenized one.
5. Ensure chevron showcase transforms are 0.24s with same token.
6. Save and verify polish.

## Boundaries

- Do NOT touch markup/structure.
- Do NOT add dependencies.
- Keep `max-height` open values (80/120/140) untouched.

## Verification

- Typecheck/lint/build (Astro project). No console errors on `/login`.
- Feel: open/close and switch module rapidly in dark mode; animation should not feel too long.
```