# Plan de filtros

Estado: **fase 0 y 1 completadas** (red de seguridad + store con padrón).
Siguiente: fase 2 (marcado único).

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
| 2 | `<FilterPanel>` declarativo; borrar las 7 copias de marcado | Pendiente |
| 3 | Popover API + anclaje; retirar posicionamiento manual | Pendiente |
| 4 | Migrar las 6 vistas restantes | Pendiente |
| 5 | Retirar deuda (selectores, `!important`, contadores por DOM) y documentar | Pendiente |

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
