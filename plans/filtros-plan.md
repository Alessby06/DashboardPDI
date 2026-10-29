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

- Abre junto al botón (debajo si hay hueco; encima si no), 330px, dentro del viewport, sin recortes.
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
- **Lado del panel.** Se elige el lado con hueco: debajo si quedan al menos
  260 px; si no, encima con el mismo anclaje. Antes abría siempre abajo y, con
  el disparador en la mitad inferior (voluntariados a 1536×774), el cuerpo
  quedaba en 74 px; a 720 px de alto, en 0.
- **Facetas en acordeón.** Las opciones de cada faceta ocupan su sitio dentro
  del cuerpo del panel. Antes eran un segundo popover absoluto dentro de un
  cuerpo con scroll: en padrón, la octava sede quedaba fuera y en ventanas
  cortas la lista sobresalía 80 px del panel.
- **Contadores en las siete vistas.** `FacetCounts` centraliza el cálculo
  (búsqueda + resto de facetas, sin la propia) y el estado a cero. Sedes,
  social, salud, casitas y voluntariados pasaron de no tener cifras a marcar
  las opciones sin resultados como deshabilitadas, igual que padrón y
  auditoría.
- **Una limpieza por contexto.** Se retiró el «Limpiar» inyectado en el pie
  móvil: quedan «Restablecer» en la cabecera y «Limpiar filtros» en la barra
  de chips/estado vacío. El pie móvil solo cierra y confirma («Ver resultados»).
- **Escape por capas.** La primera pulsación cierra la faceta abierta y
  devuelve el foco a su botón; la segunda cierra el panel. El detector de modal
  mira opacidad y visibilidad, no solo `display`, porque los backdrops viven
  ocultos con `display:flex; opacity:0`.
- **Popover antes de `.open`.** `Dropdown` llama a `FilterPanel.prepararApertura`
  antes de alternar la clase: decide el lado y muestra el top layer con el panel
  todavía cerrado. Mostrarlo después movía la capa a mitad de la transición y
  dejaba ~70 ms de silencio antes del despliegue. El clip deja 56 px negativos
  para que la sombra overlay no se recorte.
- **Asa de la hoja móvil.** El `::before` con `flex-basis:100%` se estiraba a
  todo el ancho y parecía una línea divisoria; no tenía gesto. Ahora es un
  elemento real de 40×4.5 px, centrado, con `scaleX(1.15)` y color de marca al
  presionar. La cabecera entera es la zona de agarre (botones excluidos) y
  arrastra la hoja 1:1; cierra a los 75 px o con flick y vuelve si el gesto es
  corto. El velo sigue la mano con `--filtro-velo`. Sedes ya tenía este gesto
  con su propia píldora; se conserva.
- **Movimiento.** La hoja se despliega desde el borde del disparador con un
  clip direccional, 6 px y opacidad en 220 ms `ease-out`, y pliega en 160 ms;
  el submenú conserva 4 px/175 ms. El acordeón anima su altura (190/150 ms) y
  el scroll del cuerpo arranca al terminar la expansión; los chips entran con
  175 ms y el contador a los 80 ms. En móvil la hoja sube con `ease-drawer` y
  el velo comparte sus tiempos (260/220 ms); se quitó el `backdrop-filter`, que
  en tablets de sede perdía fotogramas. Filtrar no relanza la cascada de filas:
  solo la primera entrada de la vista anima la lista. Con movimiento reducido
  se quitan clip, transformaciones, altura animada y scroll; queda el fundido.
- **Ajustes de movimiento (auditoría).** La salida del panel de escritorio
  usaba `--ease-in-out`, que arranca al 77 % del recorrido y hacía dudar al
  panel antes de irse: pasó a `--ease-out`. Al cerrar arrastrando, la hoja iba
  a `translateY(105%)` y perdía `.open` a los 230 ms de una transición de 240;
  como su estado cerrado es `100%`, retrocedía ~29 px mientras se desvanecía.
  Ahora cierra en `100%` y espera 240 ms. El asentado usa los tokens
  (`--dur-norm`/`--ease-out` al cerrar, `--dur-panel`/`--ease-drawer` al
  volver) en vez de curvas escritas a mano. `.padron-item-radio` dejó de usar
  `transition: all`; la sombra de scroll del cuerpo funde en 160 ms y el foco
  espera a que el panel termine de entrar (240 ms).
- **El disparador no se hunde.** El botón de filtros lleva `.btn-action`, y esa
  clase aplica `translateY(-1.5px)` al pasar el ratón y `scale(0.97)` con
  `!important` al pulsar. Como el panel se ancla a su caja y se coloca al
  soltar, el ancla se encogía 3,6 px: el panel nacía 5 px más arriba y se
  desplazaba durante la entrada. Ahora ese botón no transforma su caja
  (`transform: none !important`, `will-change: auto`) y la pulsación se pinta
  con `filter: brightness(0.95)`. El resto de botones conserva el `scale`.
- La entrada del panel dependía de una regla de `components.css`
  (`.custom-dropdown.open .custom-dropdown-menu`, 0,3,0) que ganaba al
  `@starting-style` y lo dejaba en un aparecer seco. El selector del panel sube
  a 0,3,0 con `.audit-filter-panel-wrap` y, al cargar después, gana la cascada.

## Hallazgos corregidos de paso

- `resetSedesFilters` no existía: «Restablecer» en sedes no hacía nada. Ahora
  apunta a `window.PDI.SedesView.resetFilters()`.
- El título de salud llegaba como `&amp;` literal; se pasa el `&` sin escapar
  en la prop.
- El botón de cerrar la hoja móvil seguía con `scale(0.92) !important` en
  `views-comun.css`, que ganaba a la hoja de filtros. Se retiró junto con el
  `@keyframes` muerto del velo.
- **Toolbar única.** Se retiraron las siete copias de `.audit-toolbar` y
  `.audit-search-*`; la definición vive solo en `views-comun.css`. Se
  conservan las reglas de página que describen la geometría de su card (banda
  full-bleed, barra de voluntariados, buscador del kanban). Medición
  antes/después en las siete vistas, escritorio y móvil: solo cambia el margen
  inferior de sedes y del móvil de auditoría (10→16 px) y el `z-index` del
  botón de limpiar (2→3); tamaños, colores e iconos quedan idénticos.
