# Plan de filtros

Estado: **todas las fases completadas** (sistema de filtros cerrado).
Siguiente: mantenimiento; una vista nueva solo declara sus facetas.

## Problema

El sistema de filtros no es un componente: es un patrón copiado siete veces.
El CSS se unificó, el comportamiento no.

- 7 paneles escritos a mano, uno por vista.
- ~486 referencias a estado de filtro repartidas en 7 archivos de vista.
- 9 copias de la regla «marcar todas las opciones = Todas».
- `FilterPanel.js` (493 líneas) descubre estructura y geometría del DOM.

## Fases

| Fase | Entregable | Estado |
|---|---|---|
| 0 | Prueba de humo de las 7 vistas + unitarios del store | Hecha |
| 1 | `FilterStore` y padrón como piloto (el store manda, `_filter*` es espejo) | Hecha |
| 2a | `<FilterPanel>`: esqueleto común (contenedor, botón, cabecera, pie) en las 7 vistas | Hecha |
| 2b | `<FilterField>`: 23 facetas declarativas; la edad conserva su slider en el slot | Hecha |
| 3 | Popover API como capa base; el anclaje CSS y el cálculo manual quedan como respaldo | Hecha |
| 4 | Store en las siete vistas; la regla «todos» vive solo en el store | Hecha |
| 5 | Deuda retirada: 27 `!important`, 3 clases muertas y badges desde el store | Hecha |

## Contrato de aceptación

- Abre bajo el botón, 330px, dentro del viewport, sin recortes.
- Abrir/cerrar no altera el scroll de la vista.
- Rueda sobre el panel desplaza el panel; la barra de la vista no lo cierra.
- Marcar todas las opciones de una faceta vuelve a «Todas» (solo multiselección).
- Contador = coincidencias reales; vacío con «Limpiar filtros».
- Teclado: foco atrapado, Escape cierra, foco vuelve al disparador.
- Sin hex fuera de tokens, sin animaciones de layout, ≤200ms.

## Cómo se comprueba

```bash
npm run test        # unitarios del store y del resto del proyecto
npm run test:filtros # humo de navegador contra el dev server
```

`test:filtros` requiere Chrome y el servidor en `http://localhost:4321`
(configurable con `PDI_BASE`, `PDI_CHROME`, `PDI_CDP_PORT`, `PDI_VISTAS`).

## Decisiones

- El store no conoce DOM ni URL: recibe facetas y devuelve valores normalizados.
  La URL sigue en `Filters.js`.
- Durante la migración, `_filter*` se mantiene como espejo para no reescribir
  el render de cada vista de golpe.
- Las facetas de selección única no aplican «todas las opciones → Todas»; el
  test lo detecta por comportamiento y lo marca como omitido, no como fallo.
- `<FilterPanel>` dibuja solo el esqueleto; `<FilterField>` dibuja cada campo
  estándar (botón, opción «todos», opciones con checkbox o radio, contador e
  insignia). Las páginas solo declaran arrays de opciones y el nombre del
  manejador; los ids y los `onclick` siguen siendo los mismos. Lo que es un
  widget distinto —el slider de edad y los paneles de fecha— sigue en la
  página, dentro del slot del campo. `reset` se pasa como expresión JS porque
  social no usa un `resetXFilters` global.
- **Popover API como capa base.** Antes el popover solo se abría si también
  había CSS anchor positioning, y los navegadores con popover pero sin anchor
  seguían colocando el panel a mano dentro del bloque contenedor que crea el
  `transform` de Lenis: ahí venían el desfase, el recorte y el parpadeo. Ahora
  el popover se abre con independencia de que haya anclaje. En el *top layer*
  `position: fixed` mide contra el viewport, así que la corrección de desfase
  se omite; el cálculo manual solo corre en los navegadores sin popover.
- En escritorio el panel es un `popover` en el top layer, anclado al botón con
  `anchor-name` / `position-anchor`. Al desplazar la vista lo sigue el CSS, sin
  JS ni corrección por el transform de Lenis. Si el navegador no soporta el
  anclaje, se usa el cálculo y el reanclaje anteriores.
- **Movimiento.** La hoja se posa: panel a 6 px y submenú a 4 px, 175 ms
  `ease-out`, salida en 120 ms. Sin escalas de texto, rebotes ni sombras que
  suban. En móvil la hoja sube con `ease-drawer` y el velo se desvanece con
  ella; se quitó el `backdrop-filter`, que en tablets de sede perdía fotogramas.
  Filtrar no relanza la cascada de filas: solo la primera entrada de la vista
  anima la lista.
- La entrada del panel dependía de una regla de `components.css`
  (`.custom-dropdown.open .custom-dropdown-menu`, 0,3,0) que ganaba al
  `@starting-style` y lo dejaba en un aparecer seco. El selector del panel sube
  a 0,3,0 con `.audit-filter-panel-wrap` y, al cargar después, gana la cascada.

## Hallazgos corregidos de paso

- `resetSedesFilters` no existía: «Restablecer» en sedes no hacía nada. Ahora
  apunta a `window.PDI.SedesView.resetFilters()`.
- El título de salud llegaba como `&amp;` literal; se pasa el `&` sin escapar
  en la prop.
