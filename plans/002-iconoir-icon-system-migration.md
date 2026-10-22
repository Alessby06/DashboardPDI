# 002 — Migración del sistema de iconos a Iconoir

- Status: TODO
- Category: Iconografía / Design system
- Autor: análisis con `@impeccable` (modo Operate)
- Alcance estimado: 1 módulo nuevo + 1 componente + 27 archivos de icono (377 etiquetas `<svg>`, 97 paths únicos)
- Dependencias nuevas: **ninguna**

## Problema

El sistema usa hoy la familia **Lucide** (línea fina, `stroke-width: 2`, `viewBox 0 0 24 24`, `currentColor`), con un SVG corrupto ya corregido en `Sidebar.astro` (ícono de Colaboradores). Se decide migrar a **Iconoir** (1 671 iconos, MIT, grilla 24×24, `stroke-width: 1.5` nativo).

El problema de fondo no es el ícono suelto: es que **no existe un sistema de iconos**. Hoy hay 377 etiquetas `<svg>` inline repartidas en 27 archivos, con 97 paths únicos duplicados a mano, `stroke-width` escrito como número mágico en cada instancia (1.8 / 2 / 2.2 / 2.5 / 3) y tamaño controlado por CSS en 30+ selectores distintos. Cualquier cambio de familia o de peso es hoy una operación de 377 ediciones.

## Decisiones tomadas en el análisis

| Eje | Decisión | Razón |
|---|---|---|
| Familia | Iconoir (1 671 iconos, MIT) | Requisito del usuario. Cubre los 13 iconos de la barra lateral con equivalencia casi 1:1. |
| Entrega | **Vendorizado en el repo**, sin dependencia npm | 97 SVG de runtime viven en `.js` que arman HTML por `innerHTML`: un componente Astro no los cubre. El CSS oficial `iconoir.css` fija el `stroke-width` a 1.5 y añade dependencia de red (sedes con conectividad intermitente). Un sprite `<use>` rompe `currentColor` y el control por CSS de tamaño. |
| Fuente de verdad | Módulo central `src/data/icons.js` | Un solo lugar define geometría, nombre canónico y peso; la sustitución futura de familia deja de ser 377 ediciones. |
| Peso del trazo | Escala óptica propia (1.5 / 1.75 / 2 / 2.25) | Iconoir está calibrado a 1.5, no a 2. Mantener 2 saturaría sus paths más detallados. La tabla conserva legibilidad en 10–14 px. |
| Ilustraciones propias | **No se migran** | 6 SVG con geometría única (viewBox 160×170, 120×120, 100×100) y 4 SVG animados con clases CSS que animan paths internos. No son iconografía de sistema. |

## Anatomía verificada de Iconoir

Del repositorio oficial (`iconoir-icons/iconoir`, MIT) y de la colección Iconify `iconoir` (1 671 iconos, `lastModified` 1791400821):

```html
<!-- crudo del repo: github.com/iconoir-icons/iconoir/tree/main/icons/regular -->
<svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 20V19C1 15.134 4.13401 12 8 12V12C11.866 12 15 15.134 15 19V20" stroke="currentColor" stroke-linecap="round"/>
  …
</svg>
```

- Grilla **24×24**, trazo **1.5** nativo, `stroke-linecap="round"` y `stroke-linejoin="round"` en la mayoría de paths.
- Nomenclatura jerárquica `[Objeto]-[Modificador]-[Contenedor]` en kebab-case: `user-plus`, `map-pin-circle`, `nav-arrow-down`. Los iconos sólidos terminan en `-solid`.
- Doble fuente programática: `https://api.iconify.design/iconoir.json?icons=…` (JSON con `body` listo) o `raw.githubusercontent.com/iconoir-icons/iconoir/main/icons/regular/<nombre>.svg`.
- 0 necesitas para 13 iconos de la barra lateral.

## Inventario real del proyecto

```
Total etiquetas <svg> ............ 377   en 27 archivos
  .astro  (build-time) ........... 280
  .js      (runtime innerHTML) ...  97
Paths <path d="…"> únicos .........  97
```

Archivos con mayor densidad: `GlobalModals.astro` (40), `auditoria.astro` (34), `social.astro` (33), `voluntariados.astro` (25), `expediente.astro` (24), `padron.astro` (23), `salud.astro` (20), `ajustes.astro` (17), `Sidebar.astro` (13).

Los `.js` de runtime son módulos ES con `export`: `SocialKanbanView.js` (25), `SedesView.js` (17), `ExpedienteView.js` (12), `VoluntariadosView.js` (10), `SaludCredView.js` (6), `AjustesView.js` (5), `BeneficiariosView.js` (5), `DashboardView.js` (5), `CasitasView.js` (4), `ToastView.js` (5), `SocialController.js` (1), `BeneficiarioController.js` (2).

Escala de tamaño en uso: 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24 px.
`stroke-width` en uso: 1.8, 2, 2.2, 2.5, 3.

## Mapeo de la barra lateral (pilot, 13 iconos)

Equivalencias verificadas una por una contra la API de Iconify.

| Uso actual | Path Lucide | Iconoir | Nota |
|---|---|---|---|
| Dashboard General | 4 cuadrados | `cell-2x2` | Equivalencia directa. Alternativa: `dashboard` (velocímetro), más semántico pero cambia la lectura de "panorama". |
| Padrón de Usuarios | 2 personas | `user` | Silueta individual. |
| Padrón de Colaboradores | 2 personas | `community` | 3 figuras: lectura de grupo. |
| Padrón de Voluntarios | 3 personas | `group` | 2 figuras: distingue de Colaboradores. |
| Servicio Alimentario | cuenco con vapor | `cutlery` | Iconoir no tiene cuenco; los cubiertos son el equivalente honesto. |
| Acompañamiento Educativo | gorra | `graduation-cap` | Equivalencia exacta. |
| Social Pastoral (ASP) | escudo + check | `shield-check` | Equivalencia exacta. |
| Autorizaciones ASP | check en círculo | `check-circle` | Equivalencia exacta. |
| Mis Solicitudes ASP | reloj | `clock` | Equivalencia exacta. |
| Sedes e Iglesias Aliadas | pin | `map-pin` | Equivalencia exacta. |
| Historial de Cambios | documento | `notes` | Portapapeles con líneas. |
| Ajustes | engranaje | `settings` | Equivalencia exacta. |
| Cerrar sesión | flecha saliendo | `log-out` | Equivalencia exacta. |

> Nota de la sidebar: los tres módulos de padrón (Usuarios / Colaboradores / Voluntarios) son hoy casi indistinguibles en Lucide. El mapeo a Iconoir los diferencia por número de figuras — es una mejora de escaneabilidad, no un capricho.

## Tabla de peso óptico

Un solo valor por bucket de tamaño, en lugar del número mágico por instancia:

| Tamaño renderizado | `stroke-width` |
|---|---|
| ≥ 19 px | 1.5 |
| 15 – 18 px | 1.75 |
| 12 – 14 px | 2 |
| ≤ 11 px | 2.25 |

Se implementa como token CSS (`--icon-stroke-lg|md|sm|xs`) en `src/styles/variables.css`, no como atributo en el markup.

## Fases

### Fase 0 — Cimientos

1. Crear `src/data/icons.js`:
   - Exporta `ICONS`, un objeto `nombreIconoir → { body, viewBox }` con **solo** los paths (sin `<svg>`), para poder inyectarlos en cualquier contexto.
   - Exporta `iconHtml(name, { size, stroke, className })` → string SVG completo, para los `.js` de runtime.
   - Fuente: `https://api.iconify.design/iconoir.json?icons=<lista>` (verificable, determinista, sin red en build).
2. Crear `src/components/Icon.astro`:
   - Props: `name`, `size` (px, opcional), `class`, `label` (opcional → `aria-label` + `role="img"`; por defecto `aria-hidden="true"`).
   - Renderiza `<svg viewBox fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width=…>` con `set:html` del body.
   - `currentColor` preservado: los paths llevan `stroke="currentColor"`, nunca un color literal.
3. Añadir tokens `--icon-stroke-*` a `src/styles/variables.css`.

### Fase 1 — Barra lateral (piloto)

4. `src/components/Sidebar.astro`: sustituir los 13 SVG inline por `<Icon name="…" />`, incluido el de Colaboradores ya corregido.
5. Verificar que `base.css:466` (`.nav-btn svg { width:19px; height:19px; stroke:currentColor }`) y `base.css:492` (`.nav-btn.active svg`) siguen aplicando → el componente hereda color y tamaño sin CSS nuevo.
6. `Topbar.astro`: 1 ícono.

### Fase 2 — Módulos `.astro`

7. `GlobalModals.astro` (40), `ajustes.astro` (17), `auditoria.astro` (34), `dashboard.astro` (8), `educativo.astro` (14), `expediente.astro` (24), `padron.astro` (23), `salud.astro` (20), `sedes.astro` (14), `social.astro` (33), `voluntariados.astro` (25), `EstrategiaMultiSelect.astro` (1).

### Fase 3 — Runtime `.js`

8. `SocialKanbanView.js` (25), `SedesView.js` (17), `ExpedienteView.js` (12), `VoluntariadosView.js` (10), `SaludCredView.js` (6), `AjustesView.js` (5), `BeneficiariosView.js` (5), `DashboardView.js` (5), `ToastView.js` (5), `CasitasView.js` (4), `SocialController.js` (1), `BeneficiarioController.js` (2).
9. Sustituir los `<svg …>` literales por `` ${iconHtml('check-circle', { size: 15 })} ``.

### Fase 4 — Excepciones y cierre

10. `src/styles/components.css:522`: el `background-image: url("data:image/svg+xml,…")` del chevron del `select.form-control` → path de Iconoir `nav-arrow-down`, re-codificado en el data URI.
11. `DESIGN.md`: documentar la familia, la escala de peso y el componente `Icon.astro` (el documento está en estado `under_revision`; se añade la sección sin tocar el resto).

## Excepciones: NO se migran

| Ubicación | Razón |
|---|---|
| `login.astro:1696,1704,1712,1720` — `anim-svg-sprout`, `anim-svg-book`, `anim-svg-social`, `anim-svg-pulse` | SVG animados; el CSS de `login.astro:312-381` anima paths internos por clase (`.anim-leaf-main`, `.anim-book-spine`, `.anim-social-hands`, `.anim-ecg-path`). Cambiar la geometría rompe la animación. |
| `ajustes.astro:117` — viewBox `0 0 160 170` | Ilustración propia del asistente "foco", con `.foco-svg` / `.foco-halo` en `views-ajustes.css:2009-2115`. |
| `ExpedienteView.js:85,97` — viewBox `0 0 120 120` | Ilustraciones de ficha de niño. |
| `ExpedienteView.js:120,134` — viewBox `0 0 100 100` | Ilustraciones de croquis de fachada. |
| `public/favicon.svg` — viewBox `0 0 128 128` | Isotipo de la organización. No es iconografía de sistema. |

## Nombres de Iconoir que NO existen (evitar error de mapeo)

Verificado contra la API: `people`, `grid`, `users`, `book-open`, `print`, `pencil`, `home-smile`, `chart-bar`, `clipboard`, `dots-vertical`, `login`, `logout`, `users-group`, `domain`, `lightbulb`, `document-text`, `meal`, `restaurant`, `bowl`, `salad`, `stats`, `note`, `education`, `world`, `paper-clip`, `location-pin`, `chart-pie`, `external-link`, `funnel`, `medical-cross`, `stethoscope`, `doctor`.

Sustitutos validados: `group` / `community` / `user` (personas), `cell-2x2` / `view-grid` (rejilla), `printer` (imprimir), `edit-pencil` (editar), `open-book` (libro), `notes` (documento), `more-vert` (⋮), `log-in` / `log-out`, `building` (dominio), `light-bulb`, `cutlery` / `bread-slice` / `egg` (alimentación), `reports` / `graph-up` (gráficas), `page` (documento de texto), `filter-alt` (embudo), `health-shield` / `pharmacy-cross-circle` (salud), `globe`, `attachment`.

## Fronteras

- **No** añadir dependencias npm (ni `astro-icon`, ni `@iconify-json/iconoir`, ni `iconoir.css` por CDN).
- **No** migrar las 10 ilustraciones/animaciones listadas arriba.
- **No** tocar la lógica JS ni los hooks de `data-view` / `data-page` / `data-roles`.
- **No** cambiar el layout, los tamaños en píxel ni los selectores CSS de tamaño existentes.
- **No** introducir colores literales en paths: solo `currentColor`.
- Mantener el `viewBox="0 0 24 24"` en todo icono de sistema.

## Verificación

- `npm run build` (Astro 7.3.5, output static) sin errores.
- `npm test` (`node --test "tests/**/*.test.js"`) en verde.
- `impeccable detect --json <archivos cambiados>` → `[]`.
- Recuento automático: tras la migración, 0 coincidencias de `stroke-width="2"` en SVG de sistema, y el nº de `<svg` en `.astro` baja a solo los no migrables.
- Contraste: los iconos heredan `currentColor` de sus contenedores, así que el tema claro/oscuro y los estados activo/hover se verifican sin CSS adicional.
- Responsive: los tamaños los fija el CSS existente, no el markup → sin regresión en móvil.
- Teclado/foco: `aria-hidden="true"` por defecto; `label` solo donde el ícono es el único contenido informativo.
