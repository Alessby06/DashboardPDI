# Dashboard: casos sueltos de la cabecera y la tarjeta de atención

## Intención y por qué

El dashboard ya tiene la forma correcta. Este lote no rediseña la pantalla, sólo cierra cinco detalles que todavía se sienten a medio terminar: el feedback del filtro de sede, la descarga del parte diario, la tarjeta de atención, las notas de pie y los nombres de la sección de servicios. La coordinadora debe poder confiar en que cada número viene de los datos y en que cada acción hace lo que dice.

## Goals

- El filtro de sede responde al pulso con feedback consistente, sin cambiar su geometría.
- Exportar pide confirmación antes de descargar, con información concreta y sin estorbar.
- "Requiere atención" muestra cifras vivas con nombres concretos y nada de texto que hable del sistema.
- Las notas que explican un denominador se conservan; las que explican la implementación se quitan.
- Los títulos y nombres de servicios usan el vocabulario real del proyecto.

## Non-goals

- No se toca AppLayout, los estilos globales ni otras páginas.
- No se cambia la estructura del dashboard ni sus tokens.
- No se implementa autenticación real; la verificación usa la sesión simulada ya empleada en este repo.
- No se añaden enlaces a las filas de atención.

## Constraints

- Proyecto Astro 7 con CSS propio, `DESIGN.md` como dirección y `views-dashboard.css` como estilo de la vista.
- El modal `confirmar({ titulo, mensaje, confirmar, cancelar, origen })` ya existe en `src/scripts/ui/confirmacion.js` y es el patrón del proyecto.
- `_renderAtencion()` en `DashboardView.js` ya calcula los tres frentes desde el estado real.
- Otras sesiones trabajan en el mismo árbol: se editan sólo los cuatro archivos acordados y se revisa `git status` antes de cada cambio.

## Approaches consideradas

1. **Reemplazar "Requiere atención" por "Siguiente acción"**, una sola prioridad con enlace. Más foco, pero cambia la identidad de una tarjeta que la usuaria ya reconoce. Descartada.
2. **Conservar la tarjeta y su título, con el contenido reescrito**. Elegida: mantiene el nombre, elimina lo hardcodeado y no promete resolución mediante enlaces.
3. **Quitar la tarjeta y plegar los frentes en la cabecera**. Descartada: hace saltar el layout y pierde un resumen útil.

Para el confirm de exportación se consideró un doble clic en el botón y se descartó: es menos claro que el modal existente. Se decide usar el modal **siempre**, porque la descarga es irreversible.

## Decisiones acordadas

- **Alcance**: `src/pages/dashboard.astro`, `src/styles/views-dashboard.css`, `src/styles/custom-select.css`, `src/scripts/views/DashboardView.js`.
- **Select**: microfeedback, caret con `ease-out` corto, anillo de foco consistente y press `0.97` existente. Sin cambios de medidas ni de comportamiento.
- **Exportar**: `confirmar()` antes de descargar, siempre. Mensaje con fecha de corte y ámbito (sede o distrito). Botón sigue diciendo "Exportar".
- **Atención**: se mantiene "Requiere atención". Cada fila activa muestra cifra viva y nombre concreto; desaparecen las descripciones fijas y el pie que habla de hidratación y voluntariado. Sin frentes: "Sin pendientes abiertos". Sin enlaces.
- **Notas**: se conserva "Porcentajes calculados sobre niños tamizados, no sobre el padrón completo" y la nota dinámica "X de Y niños con acompañamiento". Se quita el pie de atención.
- **Conciliación**: se acorta la línea aria-live a una frase breve con población y frentes.
- **Sección**: "Tríada de servicios" pasa a "Servicios del programa".
- **Servicios**: "Servicio Alimentario y Nutricional", "Servicio de Acompañamiento Educativo" y "Servicio Social Pastoral (ASP)".
- **Verificación**: servidor local, Playwright en escritorio, cierre del servidor y del navegador al terminar.

## Lo que queda al implementador

Los detalles de CSS (valores de easing y duración dentro de lo ya definido en el sistema), la reescritura concreta de los textos y la forma de acortar la línea de conciliación son decisiones de implementación, siempre que respeten las decisiones anteriores y no introduzcan nuevos enlaces ni nuevas medidas en el filtro.
