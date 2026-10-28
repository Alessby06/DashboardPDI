## Development

Start dev server background mode:

```
astro dev --background
```

Manage background server: `astro dev stop`, `astro dev status`, `astro dev logs`.

Run `astro dev status` before starting: a second instance will fight over the port.

## Dev toolbar

The dev toolbar is intentionally disabled at the project level (`devToolbar.enabled: false` in `astro.config.mjs`). Do not re-enable it.

Precedence: `astro.config.mjs` → project preferences (`.astro/settings.json`) → global preferences (`%APPDATA%\astro\Config\settings.json` on Windows) → default (enabled).

Preferences are read once at server startup and cached in the process. If a preference change (e.g. `astro preferences disable devToolbar`) does not take effect, the running server is stale — `astro dev stop` and start again.

## Documentation

Full docs: https://docs.astro.build

Guides:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## UI & Fast Iteration Protocol

- **Time Ceiling (5 Minutes Max)**: Under no circumstances should a styling, CSS, or layout task exceed 5 minutes. The natural goal is 1–2 minutes, taking enough time to deliver clean, robust UI without overthinking or rushing poor quality.
- **No Automatic Background Servers**: Do NOT start `astro dev` or background processes unless the user explicitly requests live verification. The developer already has HMR running in their own browser.
- **Surgical Edits & Quality**: Target only the requested elements and CSS rules with precision. Maintain visual polish and clean responsive behavior, but avoid refactoring unrelated JavaScript logic or theme mechanics.
- **No Scope Creep**: Keep diffs minimal, focused, and directly addressing the user prompt.

## Concurrencia y checkpoints

- **Paralelismo con alcance explícito.** Varias sesiones pueden trabajar en el mismo árbol si, antes de empezar, el coordinador asigna a cada una una lista exclusiva de archivos. Una sesión es la única escritora de sus archivos; no edites fuera de tu lista. Si los alcances se solapan, son ambiguos o afectan la misma zona, usa un worktree o serializa esas tareas.
- **Protege los cambios ajenos.** Antes de editar, ejecuta `git status --short` y revisa los diffs de los archivos que planeas tocar. Los cambios fuera de tu alcance se dejan intactos: no los reformatees, reemplaces, reviertas ni incluyas al preparar el commit. Usa `git add <rutas explícitas>`, nunca `git add -A` cuando haya trabajo paralelo.
- **Archivos de alto riesgo de colisión.** `AppLayout.astro`, estilos globales, configuración, lockfiles y esquema/migraciones requieren un único dueño por lote. Si dos tareas necesitan el mismo archivo, sepáralas en worktrees o acuerda un orden de integración.
- **Edición quirúrgica.** Relee cada archivo justo antes de editar y aplica reemplazos dirigidos; no reescribas archivos completos desde una copia antigua.
- **Integración explícita.** Al terminar, cada sesión informa archivos modificados, pruebas ejecutadas y limitaciones. El integrador revisa los diffs y combina solo los hunks asignados. Los cambios de un worktree no aparecen en el checkout canónico ni en su `localhost` hasta integrarlos.
- **Checkpoints.** Cierra cada lote lógico con un diff revisable. Un commit facilita recuperar cambios, pero no es un bloqueo ni sustituye la asignación de archivos.
- **Servidores aislados.** Un servidor por checkout y puerto. Los worktrees usan puertos y cachés propios; nunca compartas `node_modules/.vite` entre worktrees.
