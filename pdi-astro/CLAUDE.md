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
