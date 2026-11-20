# Seguimiento de la auditoria antislop 003

- Fecha: 2026-11-20
- Hallazgos aprobados: 1, 2, 3 y 4
- Archivos tocados: `src/scripts/views/BeneficiariosView.js` y `src/styles/views-padron.css`
- No se tocaron estilos compartidos de `views-voluntariados.css`

## Cambios

1. Hallazgo 1: la tarjeta movil añade una fila `Apoderado` con el nombre y el parentesco cuando existen. Antes el dato solo vivia en la tabla de escritorio.
2. Hallazgo 2: el valor usa `.padron-apoderado-nombre` con 13 px / 500, frente al 13,5 px / 600 del nombre del usuario. Razon: el apoderado es dato de apoyo, no identidad de la fila.
3. Hallazgo 3: el parentesco usa `.padron-apoderado-sub` con 11,5 px y color `--text-muted`, y no se renderiza cuando esta vacio. Razon: es texto, no una metrica con `tabular-nums`.
4. Hallazgo 4: el `title` lleva el nombre completo del apoderado, escapado, y el valor se recorta a una linea con elipsis dentro de la columna. Razon: el titulo anterior repetia la cabecera y un nombre largo alteraba el alto de la fila.

## Verificacion

- Build: 17 paginas, correcto.
- Tests: 128/128.
- Medido a 1440 px con el CSS de `dist`: alto de fila 59 px en las tres filas de prueba, incluida la de un apoderado con nombre largo; tipografia del apoderado 13 px / 500, parentesco 11,5 px, usuario 13,5 px; `title` con el valor real; `text-overflow: ellipsis` activo.
- Medido a 390 px con una tarjeta movil de muestra: desbordamiento horizontal 0, valor del apoderado de 254 px dentro de una tarjeta de 366 px.
- Bundle de produccion: etiqueta `Apoderado` presente en la vista movil y ausente el titulo generico `title="Apoderado"`.

## Delivery Gate

- R-02 PASS: sin guion em en el texto nuevo.
- R-03 PASS: la tarjeta movil no desborda a 390 px.
- R-14, R-31 PASS: cada tamaño y cada clase nueva tienen una razon escrita arriba.
- R-25 PASS: `--text-main` y `--text-muted` son tokens del sistema ya verificados en claro y oscuro.
- R-34 PASS: el mismo dato existe en los dos breakpoints, con estilos propios por contexto.
- R-38 PASS: el titulo muestra el valor real, no una etiqueta repetida.
- R-35 PARCIAL: build, tests y mediciones con el CSS construido; sin servidor ni click-through en vivo.

Estado global: PASS para los hallazgos aprobados, con R-35 marcado como PARCIAL por la ausencia de servidor en vivo.
