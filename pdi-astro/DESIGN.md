---
name: PDI Johannes Gutenberg
description: "Gestión del Programa de Desarrollo Infantil: un parte clínico sobrio, operativo y legible en sedes comunitarias, con paridad entre tema claro y oscuro."
colors:
  brand-green: "#00b494"
  brand-green-text: "#00876f"
  brand-green-deep: "#00715d"
  clinical-amber: "#f59e0b"
  clinical-amber-text: "#b45309"
  territory-blue: "#0284c7"
  alert-red: "#ef4444"
  alert-red-text: "#dc2626"
  signal-orange: "#ea580c"
  canvas: "#f4f6f9"
  paper: "#f8fafc"
  hover: "#eef2f6"
  surface: "#ffffff"
  ink: "#0f172a"
  ink-soft: "#334155"
  ink-dim: "#64748b"
  rule: "#e2e8f0"
  rule-strong: "#94a3b8"
  rule-mid: "#cbd5e1"
  on-brand: "#ffffff"
  on-solid: "#ffffff"
  on-scrim: "#ffffff"
typography:
  metric:
    fontFamily: "Manrope, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.035em"
  metric-compact:
    fontFamily: "Manrope, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  metric-secondary:
    fontFamily: "Manrope, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  metric-light:
    fontFamily: "Manrope, sans-serif"
    fontSize: "30px"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.04em"
  data-value:
    fontFamily: "Manrope, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(18px, 4.5vw, 22px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  panel-title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16.5px"
    fontWeight: 700
    lineHeight: 1.3
  subtitle:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(12.5px, 3.2vw, 14px)"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "0.1em"
  caption:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.5
  micro:
    fontFamily: "Manrope, sans-serif"
    fontSize: "9.5px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "22px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "18px 20px"
  kpi-plate:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "18px 20px"
  badge-green:
    backgroundColor: "rgba(0, 180, 148, 0.16)"
    textColor: "{colors.brand-green-text}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-amber:
    backgroundColor: "rgba(245, 158, 11, 0.16)"
    textColor: "{colors.clinical-amber-text}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-red:
    backgroundColor: "rgba(239, 68, 68, 0.16)"
    textColor: "{colors.alert-red-text}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  button-neutral:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary:
    backgroundColor: "{colors.brand-green}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

# Design System: PDI Johannes Gutenberg

## Overview

**Creative North Star: "El Parte Clínico"**

El sistema se lee como el parte que una coordinadora revisa antes de empezar la jornada: una superficie blanca, un borde fino, una cifra que manda y el resto ordenado para escanearse en segundos. Nada compite con el dato. El color no decora: informa estado clínico o territorial, y cuando no hay estado que informar, la interfaz es tinta sobre papel.

La densidad es la de un documento de trabajo, no la de un panel de marketing. Cada tarjeta responde a una pregunta operativa concreta y la responde una sola vez. La jerarquía se construye con tamaño y posición, no con peso acumulado ni con cajas dentro de cajas.

La referencia viva es `/dashboard`, y su gramática se organiza en seis capas: lienzo, cabecera, tira de KPI, paneles de datos, contenido y estados. Toda superficie nueva hereda esas piezas; ninguna las vuelve a dibujar por su cuenta. El sistema funciona igual en tema claro y oscuro: no son dos diseños, es el mismo con dos juegos de valores.

**Key Characteristics:**
- Superficie blanca sobre lienzo frío en claro; negro real y superficies casi negras en oscuro.
- Separación por borde de 1 px; una sola sombra ambiente.
- Manrope en todo el sistema, del rótulo al número.
- Una cifra dominante por tarjeta; los conteos se quedan en tamaño micro.
- Verde, ámbar, azul y rojo reservados a semántica.
- Dos temas con paridad obligatoria: nada se aprueba mirando uno solo.

## Colors

Paleta de cuatro colores de marca sobre neutros fríos. El color aparece solo cuando comunica estado, serie de datos o acción.

### Primary
- **Gutenberg Green** (#00b494): marca, acción primaria, barra de estado normal y acentos de datos. Como texto usa **Gutenberg Ink** (#00876f), porque el verde vivo no alcanza AA sobre blanco. **Gutenberg Deep** (#00715d) queda para estados presionados.

### Secondary
- **Clinical Amber** (#f59e0b): anemia leve, advertencias y seguimiento. Como texto, **Amber Ink** (#b45309).
- **Territory Blue** (#0284c7): segundo distrito y datos informativos; sirve igual como texto.

### Tertiary
- **Alert Red** (#ef4444): anemia moderada/severa y casos críticos. Como texto, **Alert Ink** (#dc2626).
- **Signal Orange** (#ea580c): cuarto nivel del semáforo MINSA; separa «moderada» de «severa».

### Neutral
- **Canvas** (#f4f6f9): fondo del área de contenido.
- **Paper** (#f8fafc): fondo base y superficie hundida (cabecera de tabla, campo en reposo).
- **Hover** (#eef2f6): estado hover neutro. No lleva tinte de marca.
- **Surface** (#ffffff): tarjetas, paneles y modales.
- **Ink** (#0f172a): texto principal y cifras. **Ink Soft** (#334155): texto secundario. **Ink Dim** (#64748b): rótulos, notas y metadatos.
- **Rule** (#e2e8f0): bordes y divisores. **Rule Strong** (#94a3b8): foco y hover de borde. **Rule Mid** (#cbd5e1): paso intermedio para checkboxes y marcos que no llegan a Rule Strong.
- **On Brand** (#ffffff; oscuro `#00130c`): tinta que se pinta encima del verde de marca. **On Solid** (#ffffff; oscuro `#00130c`): la misma tinta sobre cualquier relleno sólido saturado (rojo, ámbar, azul). **On Scrim** (#ffffff): tinta sobre un velo oscuro que se mantiene oscuro en ambos temas.

### Login Showcase

La pantalla de acceso es una maqueta oscura fija, independiente del tema del panel. Usa su propio grupo de tokens —`--showcase-black`, `--showcase-surface`, `--showcase-ink` y `--showcase-shadow*`— y no debe reutilizar las superficies del tablero. Se declaran en la propia página porque el login no importa `variables.css`; esa duplicación es aislamiento de superficie, no deriva.

### Dark Theme

No es una paleta nueva: son los mismos roles con otros valores. El fondo es negro real para separar al máximo en pantallas mates y con luz ambiente alta.

| Rol | Claro | Oscuro |
|---|---|---|
| Canvas / fondo | `#f4f6f9` | `#000000` |
| Surface (tarjeta) | `#ffffff` | `#0d0d0f` |
| Paper (hundido) | `#f8fafc` | `#151518` |
| Rule | `#e2e8f0` | `#34343c` |
| Rule Strong | `#94a3b8` | `#9494a3` |
| Rule Mid | `#cbd5e1` | `#4a4a55` |
| Ink | `#0f172a` | `#ffffff` |
| Ink Soft | `#334155` | `#dcdce4` |
| Ink Dim | `#64748b` | `#b4b4c0` |
| Brand Green | `#00b494` | `#2ee6a0` |
| Amber / Blue / Red | `#f59e0b` / `#0284c7` / `#ef4444` | `#ffc247` / `#7cc4ff` / `#ff8b8b` |
| On Brand | `#ffffff` | `#00130c` |
| On Solid | `#ffffff` | `#00130c` |
| On Scrim | `#ffffff` | `#ffffff` |

### Named Rules
**The Clinical Color Rule.** Un color saturado solo aparece si representa un estado, una serie de datos o la marca. Si el elemento no informa nada, va en neutro.

**The Green Is Not Decoration Rule.** El verde no rellena fondos grandes ni titula secciones: marca acción, estado normal y pertenencia.

**The Two-Ink Rule.** La tinta sobre marca o sobre un relleno saturado sale de `On Brand`/`On Solid`, nunca de un blanco fijo: en claro el relleno es oscuro y pide blanco; en oscuro el relleno se aclara y pide tinta casi negra (`#00130c`). Sobre un velo oscuro que no cambia con el tema, `On Scrim`. Blanco sobre el verde oscuro da 1,6:1.

**The Contrast Per Theme Rule.** El contraste se verifica dos veces, una por tema. Un texto que pasa en claro puede fallar en oscuro porque los tokens de tinta cambian de valor.

## Typography

**Display Font:** Manrope (fallback `sans-serif`)
**Body Font:** Manrope (una sola voz en todo el sistema)
**Numeric:** Manrope con `font-variant-numeric: tabular-nums` en toda cifra alineada.

**Character:** Una sola familia con pesos de 300 a 800. La jerarquía se resuelve por tamaño y posición; el peso se usa para densidad, nunca para gritar.

### Hierarchy
- **Metric** (500, 40 px, −0.035em): la cifra de una placa de KPI. Una por placa.
- **Metric Compact** (800, 30 px): variante para cabeceras clínicas densas que ya compiten con otras cifras. No es el valor por defecto.
- **Metric Secondary** (700, 26 px): porcentaje de detalle en tarjetas de datos.
- **Metric Light** (300, 30 px, −0.04em): cifras del panel rápido de salud; el trazo fino las separa de las métricas de cabecera.
- **Data Value** (700, 20 px): cifra de banda clínica o de fila de datos.
- **Title** (700, `clamp(18px, 4.5vw, 22px)`, −0.02em): título de página.
- **Panel Title** (800, 14 px, −0.01em): encabezado de panel de datos. Convive con icono de 16 px.
- **Card Title** (700, 16.5 px): encabezado de tarjeta de contenido.
- **Subtitle** (400, `clamp(12.5px, 3.2vw, 14px)`, 1.45): subtítulo de página, en Ink Muted.
- **Body** (400, 15 px, 1.5): texto corriente. **Body Small** (400, 13 px): celdas de tabla y apoyo.
- **Label** (800, 11 px, 0.1em, mayúsculas): rótulo de KPI y cabecera de tabla.
- **Caption** (400, 12.5 px): notas y contexto.
- **Micro** (600, 9.5 px): conteos que acompañan a una cifra.

### Named Rules
**The Single Metric Rule.** Cada tarjeta declara una sola cifra dominante. Los conteos que la acompañan se quedan en 9.5–11 px y peso ≤ 600; nunca se igualan al número principal.

**The Tabular Rule.** Toda cifra que forme columna o se compare verticalmente lleva `font-variant-numeric: tabular-nums`.

**The Closed Ramp Rule.** Solo existen estos tamaños: 9.5, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16.5, 20, 22, 26, 30, 40 px, más el `clamp` del Title. Un tamaño nuevo se añade al contrato antes de usarse.

**The Panel vs Card Rule.** El título de un panel de datos es más pequeño que el de una tarjeta de contenido: 14/800 frente a 16.5/700. El panel gana densidad; la tarjeta gana lectura.

## Layout

Área de contenido con 24 px de padding en escritorio, 16/14 px por debajo de 900 px y 12/10 px por debajo de 640 px. Las vistas apilan bloques cada 24 px.

Rejillas del tablero, en este orden:
- **KPI:** `repeat(auto-fit, minmax(230px, 1fr))`, `gap` 20, margen inferior 20. Cuatro placas en escritorio; 2×2 en móvil.
- **Paneles de datos:** `repeat(auto-fit, minmax(min(100%, 340px), 1fr))`, `gap` 20.
- **Contenido:** `repeat(auto-fit, minmax(350px, 1fr))`, `gap` 20.

Breakpoints: 1024 px (KPI a dos columnas), 900 px (padding reducido), 640 px (KPI 2×2, cabeceras apiladas), 420 px (se ocultan las etiquetas de acción y queda el icono).

El ancho lo manda el contenido: las tablas se desplazan dentro de su tarjeta antes que romper la página. La densidad es compacta: filas de 11 px de padding vertical; tarjetas de 18–22 px de padding.

## Elevation & Depth

Sistema plano con borde. La tarjeta se separa del lienzo con `1 px solid Rule` y una única sombra ambiente muy tenue. No hay sombras estructurales ni capas apiladas dentro de una tarjeta: una tarjeta dentro de otra es un error de composición, no una variante.

En tema oscuro la sombra difusa desaparece y el borde asume toda la elevación; solo queda un anillo tenue de 1 px y la sombra profunda de los menús.

### Shadow Vocabulary
- **Small** (`0 1px 3px rgba(0,0,0,0.06)`): controles, chips, miniaturas y estados activos. No compite con la tarjeta.
- **Ambient** (`0 10px 25px -5px rgba(0,0,0,0.08)`; en claro `0 4px 16px -2px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)`): tarjetas, paneles, placas y su hover.
- **Overlay** (`0 16px 40px -8px rgba(15,23,42,0.18), 0 6px 16px -8px rgba(15,23,42,0.12)`; en oscuro `0 0 0 1px rgba(255,255,255,0.05), 0 20px 40px -16px rgba(0,0,0,0.9)`): modales, menús, popovers y tooltips.
- **Press** (sin token): el feedback de presión se resuelve con `transform: scale(0.96)`, no con sombra. Excepción: los controles que **anclan un panel** (el disparador de filtros) no mueven su caja; el panel se coloca al soltar y seguiría al botón durante la entrada. Ahí la presión es `filter: brightness(0.95)`, que solo pinta.

### Named Rules
**The Single Border Rule.** Una superficie = un borde de 1 px + una sombra ambiente. Si necesitas una segunda caja, el problema es la jerarquía, no la profundidad.

**The No Glow Rule.** No se permiten sombras de color (`rgba` del estado) para decorar tarjetas de alerta o tendencias. El estado ya lo dice el color del texto y del borde.

## Shapes

Radios cortos y contenidos: 6 px para controles pequeños, 10 px para botones, campos y desplegables, 16 px para tarjetas, paneles y placas, `9999px` solo para insignias y píldoras.

No se usan 4, 8, 12 ni 20 px en superficies, con dos excepciones documentadas: las **hojas inferiores** llevan 20 px solo en las esquinas superiores, porque nacen del borde de la pantalla y el radio inferior no existe; y las **opciones dentro de un marco de 6 px** derivan su esquina con `calc(var(--radius-sm) - 2px)` para que el resalte quede concéntrico con el marco. Las marcas de datos conservan sus medidas: pista de barra de 2 px, barra de 3–6 px y punto de estado de 50 %.

## Components

### Page Header
- **Title:** rol Title, Ink. **Subtitle:** rol Subtitle, Ink Dim, 4 px de separación.
- **Separation:** 32 px entre el bloque de título y el primer contenido de la vista (24 px del `gap` de `.app-view` + 8 px de margen de la cabecera). La cabecera nunca arranca pegada a las tarjetas.
- **Actions:** icono de 36×36 con borde Rule y radio 10; texto visible solo si hay espacio.
- **Mobile:** bajo 640 px, título y acciones se apilan; bajo 420 px la acción queda solo con icono.

### Data Panel (signature)
- **Skin:** Surface, borde Rule, radio 16, sombra ambiente, padding 18/20/10.
- **Head:** flex con línea base compartida; icono 16 del color del área; Panel Title; enlace de 11/600 en Brand Ink.
- **Rows:** 15 px de padding vertical, divisor Rule de 1 px, sin caja por fila.
- **States:** vacío con mensaje centrado y borde discontinuo; cargando y sin conexión usan el mismo espacio.

### Card (content)
- **Skin:** la misma que el panel, con padding 22.
- **Head:** Card Title + acción opcional alineada a la derecha.
- **Uso:** listas, bitácoras y fichas. Nunca contiene otro panel.

### KPI Plate
- **Skin:** superficie, radio 16, padding 18/20, sombra ambiente.
- **Label:** rol Label, Ink Dim. **Value:** rol Metric, Ink. **Context:** 12.5/500, Ink Soft.
- **Alert variant:** fondo `rgba(239,68,68,0.05)`, borde `rgba(239,68,68,0.26)`, textos en Alert Ink.
- **Compact variant:** Metric Compact (30/800) para cabeceras clínicas densas; se declara explícitamente.

### Badges
- **Style:** píldora completa, padding 4/10, 12/700, fondo al 16 %, borde al 38 %, texto en la variante Ink.
- **Variants:** `badge-green`, `badge-yellow`, `badge-blue`, `badge-red`, `badge-orange`. El naranja de insignia se alinea con Signal Orange.

### Buttons
- **Neutral:** fondo Paper, borde Rule, Ink, 13.5/600, radio 10, padding 8/16.
- **Primary:** fondo Brand Green, tinta On Brand; solo la acción que cierra la tarea.
- **Micro action:** 30×30 con icono; en móvil, botón cuadrado de 34 con borde.
- **Hover / Focus:** fondo Hover, borde Rule Strong; foco visible con anillo de 2 px del color de marca.

### Inputs / Fields
- **Style:** fondo Paper, borde Rule, radio 10, padding 10/14, 14 px.
- **Focus:** borde Rule Strong, sin glow ni sombra.
- **Error / Disabled:** error con texto y borde Alert; deshabilitado en Ink Dim.

### Tables
- **Header:** 11.5/700, 0.05em, mayúsculas, fondo Paper, borde inferior.
- **Cell:** 13 px, padding 11/14, borde inferior Rule, `tabular-nums` en columnas de cifras.
- **Hover:** fila en Hover. **Mobile:** acordeón de tarjetas con la misma jerarquía.

### Chip
- **Sede / etiqueta:** radio 6, padding 4/8, 10.5/600, tinte del distrito al 9 %.
- **Count:** rol Micro en Ink Dim, separado 6 px.

### Clinical Band (signature)
- **Grid:** `8px | 1fr | 88px | 64px`, gap 12, padding 15/0, divisor inferior.
- **Punto:** 6 px, verde normal, ámbar leve, rojo moderada/severa.
- **Textos:** nombre 13.5/700; nota 10.5/500 Ink Dim; rango 10.5/600 Ink Dim; cifra Data Value; conteo Micro.
- **Barra:** 3 px, pista Rule, relleno según banda, transición 600 ms `spring`.
- **Orden fijo:** normal, leve, moderada/severa.

### Territory Row
- **Grid:** `1fr 66px`, gap 14, padding 11/0.
- **Cifra:** Metric Secondary en Brand Ink; segundo distrito en Territory Blue.
- **Barra:** 4 px. **Sedes:** chips al pie, agrupados por distrito.

### List Rows
- **Priority:** avatar 26 (36 en móvil), nombre 13/700, meta 11/400 Ink Dim, badge de estado, acción al final.
- **Timeline:** hilo vertical de 1 px, punto de 10, hora en 11 Ink Dim, acción 12.5 Ink Soft, meta 10.5 en mayúsculas.

### Empty / Loading / Error
- **Empty:** centrado, padding 24/16, 12.5 Ink Dim, fondo Paper, borde discontinuo, radio 10.
- **Loading:** mismo espacio, texto «Cargando datos…».
- **Sin conexión:** «Sin conexión con la base de datos. Reintentando…». Nunca se afirma que no hay datos si la hidratación está en curso.

### Filter Panel (signature)
- **Estructura:** `FilterPanel.astro` dibuja contenedor, botón, cabecera (título, Restablecer, cerrar) y pie; `FilterField.astro` dibuja cada campo estándar (etiqueta, desplegable, opción «todos», opciones e insignias). Las facetas despliegan sus opciones en acordeón dentro del cuerpo del panel, no en un segundo popover: hay un solo scroll y ninguna opción queda cortada. Las páginas solo pasan arrays de opciones y el manejador; lo que es un widget distinto (slider de edad, paneles de fecha) va en el slot del campo.
- **Marcador:** multiselección con checkbox; selección única con radio. El radio vive en `views-filters.css` una sola vez, no copiado por vista.
- **Estado:** `FilterStore` es la única fuente. Multiselección, selección simple, dominio abierto (roles, distritos sin catálogo), «marcar todas las opciones = Todas» y `activos()` viven ahí. Las vistas no repiten esa regla.
- **Contadores:** cada opción muestra cuántas coincidencias quedarían al elegirla, calculadas con la búsqueda y el resto de facetas (nunca con su propia selección). Las opciones con cero se deshabilitan. `FacetCounts` pinta la cifra y el estado; cada vista solo aporta sus datos y su predicado.
- **Escritorio:** popover en el top layer, anclado al botón con `anchor-name` / `position-anchor`. Debajo si hay hueco; si no, encima con el mismo anclaje. 330 px, altura recortada al hueco y scroll interno. El respaldo (sin anclaje) calcula y reancla a mano.
- **Móvil:** hoja inferior a 85dvh, cabecera con asa de arrastre real (40×4.5 px, centrada, con feedback al presionar) y cierre; el asa sigue el dedo 1:1, cierra pasados 75 px o un flick y vuelve elástica si el gesto es corto. Pie fijo con «Ver resultados (N)». La limpieza vive en la cabecera («Restablecer») y en los chips, no duplicada en el pie.
- **Estados:** badge con facetas activas del store; chips descartables; contador desde el total del paginador, no contando filas; vacío con «Limpiar filtros».
- **Accesibilidad:** `aria-expanded` / `aria-controls`, `role="dialog"`, foco al primer campo, trampa de Tab, Escape por capas (faceta y luego panel) y retorno al disparador; opciones con `role="checkbox"` o `role="radio"` y teclado.
- **Motion:** la hoja se despliega, no salta. El panel nace desde el borde que toca al disparador con un `clip-path` direccional, sube o baja 6 px y funde en 220 ms `ease-out`; pliega hacia ese mismo borde en 160 ms. El submenú de cada faceta conserva su gesto de 4 px en 175 ms. El acordeón de faceta anima su **altura** (`grid-template-rows: 0fr → 1fr`, 190 ms al abrir y 150 ms al cerrar) para que el cuerpo no cambie de golpe; el scroll del cuerpo espera a esa expansión y se hace suave. La barra de chips entra y sale con la misma técnica (175 ms) y el contador del pie se actualiza a los 80 ms, no 160. En móvil la hoja sube con `ease-drawer` (260 ms); en Android usa los tokens de hoja (`--sheet-in` 320 ms, `--sheet-out` 220 ms, `--sheet-ease`), porque un recorrido de casi toda la pantalla no admite la curva de los popovers. El velo entra antes que la hoja (140 ms) y la salida lo deja atrás. El contenido se asienta en tres tiempos (cabecera 40 ms, cuerpo 100 ms, pie 160 ms) cuando la hoja ya está arriba. La hoja se oculta con `visibility`, no con `display`, para que una pulsación rápida no la deje abierta e invisible a medio camino. Al filtrar no se relanza la cascada de filas: los resultados cambian en el sitio. Con `prefers-reduced-motion` se retiran el clip, los desplazamientos, la altura animada y el scroll; solo queda el fundido.
- **Pruebas:** `npm run test:filtros` recorre las siete vistas (apertura, dirección, scroll, foco, reinicio, auto-todos, móvil) y `npm test` cubre el store.

### Bottom Sheets (móvil)

- **Estructura:** `.modal-backdrop.drawer` con `.modal-box.drawer-box` (92dvh) para las fichas, o una hoja propia (filtros, sedes). El asa `.sheet-grab` mide 44 px de alto.
- **Movimiento:** el telón entra en 160 ms y la hoja arranca cuando el fondo ya está atenuado: sube en 360 ms con `--sheet-ease` y funde en 180 ms. La salida es más corta (200 ms, `--ease-out`) y el telón se apaga después. Solo `transform` y `opacity`; el lienzo de firma y el estado del pie se restauran al terminar la entrada, no durante ella.
- **Gesto:** arrastre 1:1 con captura de puntero, cierre a 80 px o con un flick y retorno elástico de 260 ms. Al cerrar por arrastre, el estado se retira al terminar la salida, con temporizador solo como respaldo.
- **Accesibilidad:** `inert` y `aria-hidden` mientras están cerradas; Escape cierra la hoja superior; foco al primer control al abrir y retorno al disparador al cerrar.
- **Rendimiento:** el aviso de composición (`will-change`) queda solo en la hoja que recorre la pantalla, no en cada modal ni en el telón.

## Do's and Don'ts

### Do:
- **Do** usar las primitivas compartidas (`.card`, `.panel`, `.kpi-plate`, `.data-table`, `.badge`, `.form-control`, `.btn-action`) antes de crear una clase.
- **Do** mantener una sola cifra dominante por tarjeta y una sola barra por fila.
- **Do** resolver hover, foco y estados con los tokens de `variables.css`.
- **Do** usar `tabular-nums` en toda cifra alineada.
- **Do** dejar el borde de 1 px como separador principal; la sombra es solo ambiente.
- **Do** verificar cada pieza en claro, en oscuro, en escritorio y en móvil antes de darla por terminada.
- **Do** declarar los tokens de un componente compartido en su propia hoja, una vez por tema, en lugar de parchear la vista.

### Don't:
- **Don't** redeclarar tokens núcleo (color, superficie, borde, texto, sombra) en una hoja de vista. Los tokens de componente —`--filter-border`, `--sk-base`— viven en su hoja compartida y se declaran una sola vez por tema.
- **Don't** escribir colores hex ni `rgba()` fuera de `variables.css` (incluidos blancos y negros fijos).
- **Don't** resolver la cascada con `!important`; si una regla no gana, el selector está mal planteado.
- **Don't** inventar tamaños fuera de la rampa cerrada.
- **Don't** anidar tarjetas ni duplicar la receta de tarjeta dentro de una hoja de vista.
- **Don't** usar el color de marca como relleno decorativo de secciones.
- **Don't** reutilizar una clase de otra página cambiándole tamaño o peso (el caso `.dash-kpi-value` en salud).
- **Don't** fijar un tema con valores absolutos (`#ffffff`, `#000000`) en pantalla; usa los tokens. La impresión sí puede forzar papel blanco y tinta negra.
- **Don't** añadir sombras de color para señalar alertas.

### Conformance Checklist
1. Ninguna hoja de vista declara tokens núcleo ni bloques `[data-theme]`; los de componente viven en su hoja compartida.
2. Cero hex o `rgba()` nuevos fuera de `variables.css`.
3. Toda cifra alineada lleva `tabular-nums` y pertenece a la rampa.
4. Toda superficie nueva usa una primitiva; ninguna repite la receta de tarjeta.
5. La pieza se ve correcta en ambos temas y en 375 px de ancho.
