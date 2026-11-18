---
name: PDI Johannes Gutenberg
description: "Gestión del Programa de Desarrollo Infantil: una sala de situación cálida, operativa y legible en sedes comunitarias, con paridad entre tema claro y oscuro."
colors:
  brand-green: "#00b494"
  brand-green-text: "#00715d"
  brand-action: "#00715d"
  success-green-text: "#147235"
  clinical-amber: "#f59e0b"
  clinical-amber-text: "#9a4a05"
  territory-blue: "#0284c7"
  alert-red: "#ef4444"
  alert-red-text: "#b91c1c"
  signal-orange: "#ea580c"
  canvas: "#f2ece1"
  paper: "#f5f0e6"
  hover: "#ece4d6"
  surface: "#fbf8f1"
  ink: "#1b1a17"
  ink-soft: "#5c574d"
  ink-dim: "#6f685c"
  rule: "#e0d8c9"
  rule-strong: "#a89d8b"
  rule-mid: "#c8bfae"
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
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "0.08em"
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
  button-neutral:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary:
    backgroundColor: "{colors.brand-action}"
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

**Creative North Star: "La Sala de Situación"**

El sistema se lee como la sala de situación que una coordinadora revisa antes de empezar la jornada: una superficie de papel cálido, tres cifras que ordenan la lectura, una franja de atención con lo que no puede esperar y el resto dispuesto para escanearse en segundos. Nada compite con el dato. El color no decora: informa estado clínico o territorial, y cuando no hay estado que informar, la interfaz es tinta cálida sobre papel.

La densidad es la de un documento de trabajo, no la de un panel de marketing. Cada tarjeta responde a una pregunta operativa concreta y la responde una sola vez. La jerarquía se construye con tamaño y posición, no con peso acumulado ni con cajas dentro de cajas.

El registro cálido es el del sistema completo: papel, tinta cálida y tarjetas color crema en todas las vistas, no solo en el dashboard. El dashboard es la referencia de esa gramática; `--dash-*` conserva los alias históricos del tablero y apunta a los tokens núcleo.

La referencia viva es `/dashboard`, y su gramática se organiza en seis capas: lienzo, cabecera, tira de KPI, paneles de datos, contenido y estados. Toda superficie nueva hereda esas piezas; ninguna las vuelve a dibujar por su cuenta. El sistema funciona igual en tema claro y oscuro: no son dos diseños, es el mismo con dos juegos de valores.

**Key Characteristics:**
- El sistema usa papel cálido (`#f5f0e6`) con tarjetas color crema (`#fbf8f1`); en oscuro, negro cálido (`#12110f`) con tinta crema (`#f4efe5`), no blanco puro.
- Separación por borde de 1 px; una sola sombra ambiente.
- Manrope en todo el sistema, del rótulo al número.
- Una cifra dominante por tarjeta; los conteos se quedan en tamaño micro.
- Verde, ámbar, azul y rojo reservados a semántica.
- Dos temas con paridad obligatoria: nada se aprueba mirando uno solo.

## Colors

Paleta de cuatro colores de marca sobre neutros cálidos. El color aparece solo cuando comunica estado, serie de datos o acción.

### Primary
- **Gutenberg Green** (#00b494): marca, barra de estado normal, puntos y acentos de identidad. Como texto usa **Gutenberg Ink** (#00715d). **Gutenberg Action** (#00715d): relleno de acciones sólidas, con tinta `On Brand` (blanca en claro; casi negra sobre el verde aclarado en oscuro). El verde brillante no se usa como relleno de botón en el producto; la única excepción es el CTA del login, que usa #00b494 con tinta #00130c (7,2:1), documentado en Login Showcase.

### Secondary
- **Clinical Amber** (#f59e0b): anemia leve, advertencias y seguimiento. Como texto, **Amber Ink** (#9a4a05).
- **Territory Blue** (#0284c7): segundo distrito y datos informativos. Como texto, **Territory Ink** (#0369a1).

### Tertiary
- **Alert Red** (#ef4444): anemia moderada/severa y casos críticos. Como texto, **Alert Ink** (#b91c1c).
- **Signal Orange** (#ea580c): cuarto nivel del semáforo MINSA; separa «moderada» de «severa».
- **Success Ink** (#147235; oscuro `#2ee6a0`): confirmación y mejora como texto (`--text-success`). No es un verde de acción ni sustituye a `--text-brand`.

### Neutral
- **Canvas** (#f2ece1): fondo de página.
- **Paper** (#f5f0e6): fondo del área de contenido.
- **Sunken** (#efe8db): superficie hundida (cabecera de tabla, campo en reposo, pista de barra).
- **Hover** (#ece4d6): estado hover neutro. No lleva tinte de marca.
- **Surface** (#fbf8f1): tarjetas, paneles y modales.
- **Ink** (#1b1a17): texto principal y cifras. **Ink Soft** (#5c574d): texto secundario. **Ink Dim** (#6f685c): rótulos, notas y metadatos.
- **Rule** (#e0d8c9): bordes y divisores. **Rule Strong** (#a89d8b): foco y hover de borde. **Rule Mid** (#c8bfae): paso intermedio para checkboxes y marcos que no llegan a Rule Strong.
- **On Brand** (#ffffff; oscuro `#00130c`): tinta que se pinta encima del verde de marca. **On Solid** (#ffffff; oscuro `#00130c`): la misma tinta sobre cualquier relleno sólido saturado (rojo, ámbar, azul). **On Scrim** (#ffffff): tinta sobre un velo oscuro que se mantiene oscuro en ambos temas.

### Warm Register (global)

El sistema usa un registro cálido de neutros. Los valores viven en `variables.css`; el dashboard conserva alias `--dash-*` que apuntan a los tokens núcleo, no una paleta paralela.

| Rol | Claro | Oscuro |
|---|---|---|
| Papel (`--dash-paper` → `--bg-base`) | `#f5f0e6` | `#12110f` |
| Superficie (`--dash-surface` → `--surface-1`) | `#fbf8f1` | `#1b1915` |
| Superficie hundida (`--dash-surface-2` → `--surface-2`) | `#efe8db` | `#191713` |
| Hover (`--dash-hover` → `--surface-hover`) | `#ece4d6` | `rgba(244,239,229,0.08)` |
| Regla (`--dash-rule` → `--border-subtle`) | `#e0d8c9` | `#2f2b25` |
| Regla fuerte (`--dash-rule-strong` → `--border-bright`) | `#a89d8b` | `#8a8172` |
| Tinta (`--dash-ink` → `--text-main`) | `#1b1a17` | `#f4efe5` |
| Secundaria (`--dash-muted`) | `#5c574d` | `#c9c2b4` |
| Dim (`--dash-dim`) | `#6f685c` | `#a39b8c` |
| Verde texto (`--dash-green`) | `#00715d` | `#2ee6a0` |
| Ámbar texto (`--dash-amber`) | `#9a4a05` | `#ffc247` |
| Rojo texto (`--dash-danger`) | `#b91c1c` | `#ff8b8b` |
| Azul texto (`--dash-info`) | `#0369a1` | `#7cc4ff` |

**Contraste:** tinta sobre papel 15,3:1; dim sobre papel 4,85:1; ámbar sobre papel 5,5:1; crema sobre negro cálido 16,5:1; dim oscura 6,85:1 sobre el lienzo (`#12110f`) y 6,37:1 sobre la tarjeta (`#1b1915`). El dim y el ámbar de la maqueta original se corrigieron para pasar AA en texto pequeño; no se usan los valores `#8b8478` ni `#b45309` sobre papel.

**The Warm Register Rule.** El registro cálido es global: los tokens núcleo de `variables.css` son la fuente. `--dash-*` son alias del dashboard y no se duplican en otras hojas.

### Login Showcase

La pantalla de acceso es una composición de 1040 px en dos columnas a partir de 1080: placa de programa (592) y tarjeta (400). La placa lleva el nombre del programa, una frase de expediente en una línea y los cuatro módulos en 2×2, con celdas de 11 px que comparten el compás de las etiquetas del formulario; no lleva notas de sedes, leyes ni fechas. La tarjeta usa Surface, radio 16, padding 22 y sombra Ambiente; el formulario separa campos cada 14 px. Los campos miden 36 px (44 en táctil), con texto de 15 (16 en táctil), borde inset de 1 px y foco de tinta de 2 px sin halo ni cambio de fondo; no llevan icono de lead porque la etiqueta y el placeholder bastan, y solo la contraseña conserva el ojo de 36. El h1 es 26/700; el CTA mide 44 y usa el verde de marca `#00b494` con tinta `#00130c` en claro (7,2:1; hover `#00a886`) y `#2ee6a0`/`#00130c` en oscuro. Es una excepción local del login: el resto del producto conserva `--brand-fill` `#00715d`; el brillante no se usa con blanco. La tira «Usuarios de prueba» vive bajo la tarjeta, sin nota ni fecha visible; caduca el 5 de diciembre y se oculta. El pie es solo el copyright. El diálogo usa radio 16, sombra Overlay y 440 px; el código de recuperación usa monoespaciada. Los tokens se declaran en la propia página porque el login no importa `variables.css`; esa duplicación es aislamiento de superficie.

### Dark Theme

No es una paleta nueva: son los mismos roles con otros valores. El fondo es un negro cálido para separar al máximo en pantallas mates y con luz ambiente alta, sin la dureza del blanco puro sobre negro.

| Rol | Claro | Oscuro |
|---|---|---|
| Canvas / fondo | `#f2ece1` | `#12110f` |
| Surface (tarjeta) | `#fbf8f1` | `#1b1915` |
| Paper (hundido) | `#efe8db` | `#191713` |
| Rule | `#e0d8c9` | `#2f2b25` |
| Rule Strong | `#a89d8b` | `#8a8172` |
| Rule Mid | `#c8bfae` | `#4a443a` |
| Ink | `#1b1a17` | `#f4efe5` |
| Ink Soft | `#5c574d` | `#c9c2b4` |
| Ink Dim | `#6f685c` | `#a39b8c` |
| Brand Green | `#00b494` | `#2ee6a0` |
| Action Green | `#00715d` | `#2ee6a0` |
| Success Ink | `#147235` | `#2ee6a0` |
| Amber / Blue / Red | `#f59e0b` / `#0284c7` / `#ef4444` | `#ffc247` / `#7cc4ff` / `#ff8b8b` |
| On Brand | `#ffffff` | `#00130c` |
| On Solid | `#ffffff` | `#00130c` |
| On Scrim | `#ffffff` | `#ffffff` |

### Named Rules
**The Clinical Color Rule.** Un color saturado solo aparece si representa un estado, una serie de datos o la marca. Si el elemento no informa nada, va en neutro.

**The Green Is Not Decoration Rule.** El verde no rellena fondos grandes ni titula secciones: marca acción, estado normal y pertenencia.

**The Two-Green Rule.** `#00b494` identifica (logo, puntos, barras, tintes); `#00715d` actúa en claro y el verde aclarado actúa en oscuro. Los botones sólidos y los CTA usan `--brand-fill`; las pestañas y selecciones usan `--brand-soft` con `--text-brand-strong`. El verde brillante no rellena una acción ni una pestaña activa. `--brand-hover` es un token de relleno: como texto se usa `--text-brand-strong` (7,5:1), nunca `--brand-hover` (3,16:1).

**The Two-Ink Rule.** La tinta sobre marca o sobre un relleno saturado sale de `On Brand`/`On Solid`, nunca de un blanco fijo: en claro el relleno de acción es profundo y pide blanco; en oscuro el relleno se aclara y pide tinta casi negra (`#00130c`). Sobre un velo oscuro que no cambia con el tema, `On Scrim`. Blanco sobre #00715d da 5,6:1; sobre #00b494 da 2,6:1 y por eso el brillante no es un relleno de acción.

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

**The Closed Ramp Rule.** Solo existen estos tamaños: 9.5, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 16.5, 20, 22, 26, 30, 40 px, más el `clamp` del Title. Un tamaño nuevo se añade al contrato antes de usarse. **15** es el texto de campo en escritorio; **16** el de táctil, mínimo de iOS para no ampliar la página al enfocar. No se usan para prosa.

**The Panel vs Card Rule.** El título de un panel de datos es más pequeño que el de una tarjeta de contenido: 14/800 frente a 16.5/700. El panel gana densidad; la tarjeta gana lectura.

**The Code Exception.** El texto de código (p. ej. la clave temporal) usa pila monoespaciada para distinguir caracteres; no es texto corrido y no sustituye a Manrope en la prosa.

## Layout

Área de contenido con 24 px de padding en escritorio, 16/14 px por debajo de 900 px y 12/10 px por debajo de 640 px. Las vistas apilan bloques cada 24 px.

Rejillas del tablero, en este orden:
- **KPI:** `repeat(auto-fit, minmax(230px, 1fr))`, `gap` 20, margen inferior 20. En el dashboard son tres placas en una sola superficie; en el resto de las vistas, cuatro.
- **Paneles de datos:** `repeat(auto-fit, minmax(min(100%, 340px), 1fr))`, `gap` 20.
- **Contenido:** `repeat(auto-fit, minmax(350px, 1fr))`, `gap` 20.

### Dashboard Layout

- **Hero:** `1.3fr 1fr 1fr` sin gap; una sola superficie con divisores de 1 px.
- **Clínica + atención:** `1.55fr / 0.75fr`, gap 20.
- **Servicios:** `repeat(3, 1fr)`, gap 18.
- **Territorio + equipo:** `1.6fr / 0.75fr`, gap 20.
- **Breakpoints:** 1080 px (hero a dos columnas, clínica y territorio a una, atención primero), 900 px (márgenes del viewport), 820 px (servicios a una, clínica apilada, bandas 2×2), 640 px (hero a una, matriz en bloques), 480 px (bandas a una).

Breakpoints generales: 1024 px (KPI a dos columnas), 900 px (padding reducido), 640 px (KPI 2×2, cabeceras apiladas), 420 px (se ocultan las etiquetas de acción y queda el icono).

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

Radios cortos y contenidos: 6 px para controles pequeños, 10 px para botones, campos y desplegables, 16 px para tarjetas, paneles y placas, `9999px` solo para puntos de estado, avatares y controles circulares.

No se usan 4, 8, 12 ni 20 px en superficies, con dos excepciones documentadas: las **hojas inferiores** llevan 20 px solo en las esquinas superiores, porque nacen del borde de la pantalla y el radio inferior no existe; y las **opciones dentro de un marco de 6 px** derivan su esquina con `calc(var(--radius-sm) - 2px)` para que el resalte quede concéntrico con el marco. Las marcas de datos conservan sus medidas: pista de barra de 2 px, barra de 3–6 px y punto de estado de 50 %.

## Components

### Page Header
- **Title:** rol Title, Ink, y el **único `h1` de la página**. La marca del sidebar y del login es texto, no un encabezado. Las secciones van en `h2` y las subsecciones en `h3`.
- **Subtitle:** rol Subtitle, Ink Dim, 4 px de separación.
- **Separation:** 32 px entre el bloque de título y el primer contenido de la vista (24 px del `gap` de `.app-view` + 8 px de margen de la cabecera). La cabecera nunca arranca pegada a las tarjetas.
- **Actions:** icono de 36×36 con borde Rule y radio 10; texto visible solo si hay espacio.
- **Mobile:** bajo 640 px, título y acciones se apilan; bajo 420 px la acción queda solo con icono, con un objetivo táctil de 44×44.

**The Single H1 Rule.** Cada página declara un solo `h1`: el título de la vista. La marca del sidebar y la del login se dibujan como texto, nunca como encabezado; las secciones de la vista son `h2` y las subsecciones `h3`. Un modal abierto es un contexto nuevo y su título es `h2`.

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

### Status Mark

- **Forma:** punto de 6 px + etiqueta 12.5/600 en Ink Soft, separados 7 px. Sin fondo, sin borde, sin padding ni radio: la fila ya tiene su regla de 1 px y no necesita una caja dentro.
- **Color:** solo el punto. Verde (normal), ámbar (atención o pendiente), azul (informativo), rojo (crítico), naranja (severo), gris (sin dato o inactivo). La etiqueta no cambia de color: la palabra dice el estado y el color lo confirma, así el dato sobrevive a la impresión, al daltonismo y al tema oscuro.
- **Implementación:** `.status-mark` + `.status-mark-dot` en `components.css`; variantes `--ok`, `--warn`, `--info`, `--danger`, `--severe`, `--idle`. El punto es `aria-hidden`; el texto va siempre y no se sustituye por el color.
- **Los otros dos trabajos:** un conteo va en micro (9.5/600, Ink Dim, `tabular-nums`) junto a su etiqueta, sin contenedor; una etiqueta o categoría usa Chip (radio 6, tinte al 9 %). Solo el estado lleva marca.
- **Auditoría:** la severidad (“Sensible”, “Rutinario”) usa esta marca de punto + palabra; no se dibuja como píldora.

**The No Badge Rule.** Ningún estado, conteo o etiqueta se dibuja como píldora con fondo tintado y borde. El badge metía una caja y un óvalo donde el sistema pide un punto, una palabra o una regla de 1 px, y repetía en color lo que la fila ya decía. Si algo necesita fondo para leerse, el problema es la jerarquía: se corrige ahí, no añadiendo una insignia.

### Buttons
- **Neutral:** fondo Paper, borde Rule, Ink, 13.5/600, radio 10, padding 8/16.
- **Primary:** fondo Gutenberg Action (`--brand-fill`: #00715d en claro; #2ee6a0 en oscuro), tinta `On Brand` (blanca en claro; casi negra en oscuro) y Sombra Small; solo la acción que cierra la tarea. El blanco sobre #00715d da 5,6:1. El hover usa `--brand-fill-hover` (#005c4b en claro; #6bffc4 en oscuro). El verde brillante #00b494 no se usa como relleno de acción.
- **Micro action:** 30×30 con icono en puntero fino; con puntero grueso, 44×44. Toda acción táctil mide al menos 44 px de alto (PRODUCT.md).
- **Hover / Focus:** fondo Hover, borde Rule Strong; foco visible con anillo de 2 px de `--border-focus` (#00715d en claro; verde aclarado en oscuro), que da 5,97:1 sobre papel. El verde brillante no se usa para el foco: su 2,32:1 no alcanza el 3:1 de WCAG 1.4.11.

### Inputs / Fields
- **Style:** fondo Paper, borde Rule, radio 10, padding 10/14, 14 px. En los modales los campos van sobre Paper para dar un paso de tono frente a la Surface del diálogo.
- **Focus:** borde Rule Strong y anillo de teclado de 2 px con `--border-focus` y offset 2, sin glow ni sombra. El campo nunca pierde el contorno al enfocarse con teclado.
- **Error / Disabled:** error con texto y borde Alert; deshabilitado en Ink Dim.
- **Selects:** ningún `<select>` nativo se muestra sin mejorar. `src/scripts/ui/customSelect.js` los convierte al dropdown propio (`pdi-select` + `pdi-select-trigger` + `pdi-select-menu`, hoja `custom-select.css`): mismo `<select>` vivo para `id`, `name`, `value`, `required`, `disabled` y `onchange`; menú en `<body>` con `position: fixed` para que ningún modal lo recorte; entrada de 6 px + fundido en `--dur-norm` y salida en `--dur-fast`. Un `<select>` nuevo se mejora solo; si no se puede, se marca `data-pdi-select="native"` y se documenta la excepción.

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
- **Barra:** 4 px, pista Rule, relleno según banda, transición 600 ms `spring`. Las barras de medida del tablero comparten el mismo lenguaje, no el mismo grosor: la clínica del dashboard usa 10 px, la cobertura 4 px y el equipo 2 px, cada una según su función.
- **Orden fijo:** normal, leve, moderada/severa.
- **En el dashboard:** la franja se compone como prevalencia 30/800 + barra apilada de 10 px + cuatro columnas con punto, rango, porcentaje y conteo. La fila `8px | 1fr | 88px | 64px` se conserva para las vistas clínicas que necesitan el detalle por caso.

### Dashboard — Sala de situación

- **Estructura:** una página cálida, no una hoja única. Cabecera, hero de tres cifras, clínica y atención, tríada de servicios, territorio y equipo. Las tarjetas usan `--dash-surface` y `--dash-rule`; el fondo es `--dash-paper`.
- **Cabecera:** eyebrow 11/800, fecha en `h1` 30/700, subtítulo con sedes activas y sello en vivo (punto + palabra). A la derecha, selector de sede/distrito (por `customSelect`) y exportación secundaria.
- **Hero:** tres placas en una sola superficie con divisores de 1 px: niños acompañados (40/500, distribución Comas/Carabayllo/Otras), cobertura de tamizaje (40/500, barra de 4 px y aviso de pendientes) y casos ASP activos (40/500, usuarios y casos abiertos). No son cuatro KPIs simétricos.
- **Clínica y atención:** `1.55fr / 0.75fr`. La clínica lleva prevalencia 30/800, barra apilada de 10 px (normal, riesgo, leve, moderada/severa) y cuatro bandas en columnas con punto, rango, porcentaje y conteo. La atención lista tres frentes con punto de estado, texto y enlace; las filas con cero se ocultan y el vacío dice “Sin pendientes abiertos.” sin inventar un cero.
- **Servicios:** tres tarjetas (alimentación, educativo, ASP) con icono, cifra 30/800, filas de desglose y una nota de cobertura en educativo. La cifra y las filas bastan; no se añade una barra decorativa.
- **Territorio y equipo:** `1.6fr / 0.75fr`. La matriz es una tabla semántica con grupos (tríada troncal / iniciativas) y bloque móvil por distrito; el equipo lista voluntarias por servicio con brechas en ámbar, sin badges.
- **Movimiento:** la barra de cobertura y la barra clínica dibujan una vez en la primera entrada (720 ms `spring`, `transform: scaleX()`); las cifras cuentan en `--dur-count` desde el valor visible. Sin cascada por sección. El hover vive en `(hover: hover) and (pointer: fine)`.
- **Responsive:** 1080 px (hero a dos columnas, clínica y territorio a una, atención primero), 900 px (márgenes del viewport), 820 px (servicios a una, clínica apilada, bandas 2×2), 640 px (hero a una, matriz en bloques), 480 px (bandas a una, botón solo icono).
- **Estados:** si la capa no está en `ok`, las cifras muestran “—” (no 0), el sello dice “Sincronizando…” o “Sin conexión”, y la atención muestra carga o error. La prehidratación con la copia de sesión escribe los valores antes de que llegue la nube; la hidratación real siempre tiene la última palabra.
- **Navegación interna:** el `<header>` del topbar persiste entre páginas, igual que el sidebar, para que nombre, rol y avatar no parpadeen. Las rutas visibles del menú precargan su módulo con `modulepreload` en tiempo muerto (descarga y compila, no ejecuta); al navegar, la página entrante se pinta con su marcado real desde el primer frame: no hay esqueleto de bloques grises ni velo de contenido, y los datos se escriben encima cuando llegan. El esqueleto solo reaparece si la carga falla, como tarjeta de error con reintento. Auditoría muestra “Cargando bitácora…” mientras responde el servidor.

### Territory Row
- **Grid:** `1fr 66px`, gap 14, padding 11/0.
- **Cifra:** Metric Secondary en Brand Ink; segundo distrito en Territory Blue.
- **Barra:** 4 px. **Sedes:** chips al pie, agrupados por distrito.

### List Rows
- **Priority:** avatar 26 (36 en móvil), nombre 13/700, meta 11/400 Ink Dim, marca de estado, acción al final.
- **Timeline:** hilo vertical de 1 px, punto de 10, hora en 11 Ink Dim, acción 12.5 Ink Soft, meta 10.5 en mayúsculas.

### Empty / Loading / Error
- **Empty:** centrado, padding 24/16, 12.5 Ink Dim, fondo Paper, borde discontinuo, radio 10.
- **Loading:** mismo espacio, texto «Cargando datos…».
- **Sin conexión:** «Sin conexión con la base de datos. Reintentando…». Nunca se afirma que no hay datos si la hidratación está en curso.

### Filter Panel (signature)
- **Estructura:** `FilterPanel.astro` dibuja contenedor, botón, cabecera (título, Restablecer, cerrar) y pie; `FilterField.astro` dibuja cada campo estándar (etiqueta, desplegable, opción «todos», opciones y contadores). Las facetas despliegan sus opciones en acordeón dentro del cuerpo del panel, no en un segundo popover: hay un solo scroll y ninguna opción queda cortada. Las páginas solo pasan arrays de opciones y el manejador; lo que es un widget distinto (slider de edad, paneles de fecha) va en el slot del campo.
- **Marcador:** multiselección con checkbox; selección única con radio. El radio vive en `views-filters.css` una sola vez, no copiado por vista.
- **Estado:** `FilterStore` es la única fuente. Multiselección, selección simple, dominio abierto (roles, distritos sin catálogo), «marcar todas las opciones = Todas» y `activos()` viven ahí. Las vistas no repiten esa regla.
- **Contadores:** cada opción muestra cuántas coincidencias quedarían al elegirla, calculadas con la búsqueda y el resto de facetas (nunca con su propia selección). Las opciones con cero se deshabilitan. `FacetCounts` pinta la cifra y el estado; cada vista solo aporta sus datos y su predicado.
- **Escritorio:** popover en el top layer, anclado al botón con `anchor-name` / `position-anchor`. Debajo si hay hueco; si no, encima con el mismo anclaje. 330 px, altura recortada al hueco y scroll interno. El respaldo (sin anclaje) calcula y reancla a mano.
- **Móvil:** hoja inferior a 85dvh, cabecera con asa de arrastre real (40×4.5 px, centrada, con feedback al presionar) y cierre; el asa sigue el dedo 1:1, cierra pasados 75 px o un flick y vuelve elástica si el gesto es corto. Pie fijo con «Ver resultados (N)». La limpieza vive en la cabecera («Restablecer») y en los chips, no duplicada en el pie.
- **Estados:** contador de facetas activas del store (micro, sin píldora); chips descartables; contador desde el total del paginador, no contando filas; vacío con «Limpiar filtros».
- **Accesibilidad:** `aria-expanded` / `aria-controls`, `role="dialog"`, foco al primer campo, trampa de Tab, Escape por capas (faceta y luego panel) y retorno al disparador; opciones con `role="checkbox"` o `role="radio"` y teclado.
- **Motion:** la hoja se despliega, no salta. El panel nace desde el borde que toca al disparador con un `clip-path` direccional, sube o baja 6 px y funde en 220 ms `ease-out`; pliega hacia ese mismo borde en 160 ms. El submenú de cada faceta conserva su gesto de 4 px en 175 ms. El acordeón de faceta anima su **altura** (`grid-template-rows: 0fr → 1fr`, 190 ms al abrir y 150 ms al cerrar) para que el cuerpo no cambie de golpe; el scroll del cuerpo espera a esa expansión y se hace suave. La barra de chips entra y sale con la misma técnica (175 ms) y el contador del pie se actualiza a los 80 ms, no 160. En móvil la hoja sube desde el borde inferior en un desplazamiento vertical puro, sin perspectiva ni escala, para que el texto no se deforme mientras viaja: entra en `--sheet-in` (400 ms) con la curva del cajón lateral y sale en `--sheet-out` (260 ms) con `--sheet-exit-ease`. El velo entra antes (140 ms) y se apaga con la curva y la duración de la salida, de modo que la página no reaparece mientras la hoja todavía baja. El contenido entra con la hoja, sin fundido escalonado; el compás queda para el popover de escritorio. La hoja se oculta con `visibility`, no con `display`, para que una pulsación rápida no la deje abierta e invisible a medio camino. Al filtrar no se relanza la cascada de filas: los resultados cambian en el sitio.
- **Pruebas:** `npm run test:filtros` recorre las siete vistas (apertura, dirección, scroll, foco, reinicio, auto-todos, móvil) y `npm test` cubre el store.

### Bottom Sheets (móvil)

- **Estructura:** `.modal-backdrop.drawer` con `.modal-box.drawer-box` (92dvh) para las fichas, o una hoja propia (filtros, sedes). El asa `.sheet-grab` mide 44 px de alto.
- **Movimiento (deslizamiento):** la misma en las nueve fichas, la hoja de filtros y el detalle de sedes. La hoja sube desde su borde inferior en un desplazamiento vertical puro, sin perspectiva ni escala, para que el contenido no se deforme; entra en `--sheet-in` (400 ms) con la curva del cajón lateral y sale en `--sheet-out` (260 ms) con `--sheet-exit-ease`. El velo se apaga con la curva y la duración de la salida. El contenido entra con la hoja, sin fundido escalonado. Solo `transform` y `visibility`; el lienzo de firma y el estado del pie se restauran al terminar la entrada.
- **Gesto:** arrastre 1:1 con captura de puntero, cierre a 80 px o con un flick y retorno elástico de 260 ms. Al cerrar por arrastre, el estado se retira al terminar la salida, con temporizador solo como respaldo.
- **Accesibilidad:** `inert` y `aria-hidden` mientras están cerradas; Escape cierra la hoja superior; foco al primer control al abrir y retorno al disparador al cerrar. La hoja de sedes se anuncia como diálogo modal con el nombre de la sede, atrapa el tabulador y ofrece un cierre visible además del asa.
- **Rendimiento:** el aviso de composición (`will-change`) queda solo en la hoja que recorre la pantalla, no en cada modal ni en el telón.

### Motion

- **Pulsación:** todo botón comprime a `scale(0.97)` en `--dur-fast`, con `--surface-3` y borde `--text-dim` en neutros; los primarios conservan su relleno y bajan `brightness(0.96)`. El botón de filtros no mueve su caja porque ancla el panel: allí solo cambia el tinte.
- **Dropdowns:** todo menú entra con fundido + 6 px en `--dur-norm` y sale en `--dur-fast`, con `@starting-style` y `display … allow-discrete`. El subnivel de facetas dentro del panel conserva su gesto de 4 px / 175 ms.
- **Hover:** todo `:hover` con efecto visual vive dentro de `@media (hover: hover) and (pointer: fine)`. En táctil el navegador deja el hover pegado tras el toque y el control parece seguir pulsado. `tests/motion-guard.test.js` lo impone.
- **Transiciones:** nunca `transition: all`. Se enumeran las propiedades visuales (`background-color`, `border-color`, `color`, `box-shadow`, `transform`, `opacity`, `filter`); animar `width`, `height` o `padding` provoca layout. El test también lo prohíbe.
- **Curvas:** todas salen de `variables.css` (`--ease-out`, `--ease-spring`, `--ease-smooth`, `--ease-drawer`, `--sheet-*`). No hay curvas con sobrepaso ni duraciones escritas a mano en las transiciones: `--dur-press`, `--dur-fast`, `--dur-popover`, `--dur-norm`, `--dur-panel`, `--dur-nav`, `--dur-rail`, `--dur-theme`, `--dur-bar`, `--dur-count` y `--dur-highlight`.
- **Keyframes:** una sola definición por nombre, en `base.css`. Las hojas de vista no redeclaran animaciones compartidas; el test falla si aparece un duplicado. `slideUp` y `pulseHighlight` se retiraron por no usarse.
- **`will-change`:** solo en elementos con movimiento real y continuo (sidebar, hojas, fantasma de arrastre). No se deja en tarjetas, botones o toasts por un hover puntual.
- **Cascadas:** una lista escalona su entrada una sola vez por contenedor. En re-renders (cambiar de pestaña, resolver, filtrar) las filas o tarjetas cambian en el sitio. `.social-requests-grid` usa `.social-cards--entrada` solo en el primer montaje.
- **Scroll:** sin scroll snap y sin GSAP. No hay parallax de login: el scroll suave vive en `ScrollManager`; `ScrollAnimations.js` se retiró con el showcase.
- **Carga y navegación:** `astro.config.mjs` activa `prefetch` con `hover` y `prefetchAll`; además, una vez que los datos están en memoria, `LoadingState` pide en tiempo muerto las rutas principales (`/dashboard`, `/padron`, `/salud`, `/social`, `/voluntariados`, `/auditoria`). En desarrollo, `vite.server.warmup.clientFiles` pretransforma las entradas de página, vistas y núcleo al arrancar, para que la primera visita no compile 0,6–2,7 s.
- **Estados vacíos y contadores:** el vacío entra con un fundido de `--dur-norm`; un contador que cambia de valor pulsa 260 ms con `contadorPulso`. El primer pintado no pulsa. Las cifras métricas usan `AnimationEngine.contar()`: cuentan desde el valor visible, no desde 0, y la primera pintura con datos se escribe directa. La fila o tarjeta que acaba de cambiar se marca con `destacar()` (`--dur-highlight`); no se relanza la cascada de filas.
- **Dashboard:** la barra de cobertura y la barra clínica se dibujan una vez en la primera entrada (720 ms `spring`); las cifras cuentan desde el valor visible; no hay cascada por sección. El registro cálido no cambia la mecánica.
- **Navegación entre páginas:** el mismo empuje lateral de Social en ambos anchos. El contenido viaja 6 % de su ancho en escritorio y 12 % en móvil, con 260 ms de entrada (`--ease-spring`) y 160 ms de salida (`--ease-out`); el saliente recorre 1,1 veces ese desplazamiento y se funde. La dirección la fija `Navigation` en `data-page-dir` según el orden del menú y se retira al terminar. La raíz no funde, así que el sidebar y el topbar no parpadean. La profundidad contenida (`pdiPageDepthIn/Out`) queda como respaldo para las rutas fuera del menú.
- **Subpaneles:** en Social, un solo gesto para las tres pestañas: el panel nuevo empuja al anterior en el sentido del orden (9 % del ancho del panel en escritorio y 12 % en móvil, no una medida fija: 24 px sobre 1120 px eran el 2 % y se leían como un fundido), con 260 ms de entrada y 160 ms de salida. El panel nuevo se aclara en el primer 30 % del recorrido y luego viaja opaco, y el saliente recorre 1,1 veces ese desplazamiento, para que los dos se separen y el gesto se lea como empuje. La raíz y el `<main>` no se animan, así que el sidebar y el topbar no parpadean y el contenido no sube mientras el panel empuja. La dirección la fija `switchSocialTab` en `data-social-dir` y se retira al terminar; sin View Transition, el mismo empuje se anima sobre el panel. En el expediente, la sección viaja sola: se retira un momento el nombre del `<main>` y la raíz no funde, de modo que el sidebar y el topbar no parpadean. La salida dura `--dur-fast` y la entrada `--dur-norm` con una espera de la mitad de la salida: la sección nueva no empieza hasta que la vieja se apagó, así que nunca se leen dos secciones superpuestas. El sentido sigue al orden del sidebar (bajar entra desde abajo, subir desde arriba) con 4-7 px de recorrido. Donde no exista View Transition, un fundido de respaldo de `--dur-fast`; nunca las dos a la vez.
- **Movimiento reducido:** el producto consulta `prefers-reduced-motion: reduce`. Se retiran escalas, traslaciones, cascadas y transiciones espaciales; se conservan opacidad, color, borde y sombra para que el cambio de estado siga siendo legible. El contador de cifras escribe el valor final de inmediato. `tests/motion-guard.test.js` exige el bloque.

### Iconografía

- **Familia:** Hugeicons Free **4.4.0** (MIT), trazo redondeado sobre retícula de 24. Los 62 iconos que usa el producto están **vendorizados** en `src/data/hugeicons.js`; no hay dependencia npm ni peticiones en runtime. `scripts/generar-hugeicons.mjs` fija la versión y regenera el archivo.
- **Fuente única:** `src/data/iconos.js` expone los alias semánticos (`accion.cerrar`, `nav.desplegar`, `estado.pendiente`…) y las dos puertas de render: `Icon.astro` para plantillas y `iconHtml()` / `iconBody()` para las vistas que construyen HTML por JS. Las vistas no escriben `<svg>` ni conocen nombres del set.
- **Trazo:** token único `--icon-stroke: 1.75` en `src/styles/iconos.css`. Ningún path lleva `stroke-width` incrustado; un cambio de peso se hace en un solo sitio. El color siempre es `currentColor`.
- **Tamaño:** lo fija la vista o el CSS existente. `size={null}` deja que el CSS dimensione; los selectores `.nav-btn svg`, `.btn-action svg`, `.audit-search-icon`, `.filter-caret` y `.caret` siguen mandando.
- **Accesibilidad:** decorativo por defecto (`aria-hidden="true"`); con `title` pasa a `role="img"` + `aria-label` + `<title>`. Los botones icono-only conservan su `aria-label`, que no se sustituye por el icono.
- **Excepciones (no son iconografía de sistema):** la silueta y los dos rostros de avatar del expediente, la serie de hemoglobina, la mascota del foco y su cursor de ayuda. El login no añade iconos fuera del set. `tests/iconos-guard.test.js` impide que aparezcan nuevos `<svg>` fuera de esa lista.
- **Prohibido:** hex en paths, `stroke-width` por instancia, importar Hugeicons en runtime y duplicar geometría en una vista. Si falta un icono, se añade al generador y se regenera.

## Do's and Don'ts

### Do:
- **Do** usar las primitivas compartidas (`.card`, `.panel`, `.kpi-plate`, `.data-table`, `.status-mark`, `.form-control`, `.btn-action`) antes de crear una clase.
- **Do** mantener una sola cifra dominante por tarjeta y una sola barra por fila.
- **Do** resolver hover, foco y estados con los tokens de `variables.css`.
- **Do** usar `tabular-nums` en toda cifra alineada.
- **Do** dejar el borde de 1 px como separador principal; la sombra es solo ambiente.
- **Do** verificar cada pieza en claro, en oscuro, en escritorio y en móvil antes de darla por terminada.
- **Do** declarar los tokens de un componente compartido en su propia hoja, una vez por tema, en lugar de parchear la vista.
- **Do** usar los tokens núcleo cálidos en todas las vistas; el dashboard puede usar los alias `--dash-*`, que apuntan a ellos.
- **Do** usar `--brand-fill` para acciones sólidas y `--brand-soft` con `--text-brand-strong` para pestañas y selecciones; el verde brillante es identidad e indicador.
- **Do** usar `--border-focus` para todo anillo de teclado, con 2 px y offset 2; es el único indicador de foco y debe superar 3:1.
- **Do** reservar el `h1` para el título de la vista y usar `h2` para sus secciones; la marca es texto.
- **Do** dar 44 px de alto a toda acción táctil con puntero grueso.

### Don't:
- **Don't** redeclarar tokens núcleo (color, superficie, borde, texto, sombra) en una hoja de vista. Los tokens de componente —`--filter-border`, `--sk-base`— viven en su hoja compartida y se declaran una sola vez por tema.
- **Don't** escribir colores hex ni `rgba()` fuera de `variables.css` (incluidos blancos y negros fijos).
- **Don't** resolver la cascada con `!important`; si una regla no gana, el selector está mal planteado.
- **Don't** inventar tamaños fuera de la rampa cerrada.
- **Don't** anidar tarjetas ni duplicar la receta de tarjeta dentro de una hoja de vista.
- **Don't** usar el color de marca como relleno decorativo de secciones.
- **Don't** reutilizar una clase de otra página cambiándole tamaño o peso (el caso `.dash-kpi-value` en salud).
- **Don't** fijar un tema con valores absolutos (`#ffffff`, `#000000`) en pantalla; usa los tokens. La impresión sí puede forzar papel blanco y tinta negra.
- **Don't** dibujar badges ni píldoras tintadas para estado, conteo o etiqueta: el estado va como marca de punto + palabra, el conteo en micro y la etiqueta como Chip.
- **Don't** añadir sombras de color para señalar alertas.
- **Don't** crear una paleta paralela: `--dash-*` son alias del dashboard, no valores propios que se copian a otras hojas.
- **Don't** usar `--gt-green` o `--brand-primary` como relleno de un botón o de una pestaña activa, ni blanco sobre `#00b494`: una acción sólida va con `--brand-fill` y `--on-brand`. La excepción es el CTA del login (`#00b494` + `#00130c`), documentada en Login Showcase.
- **Don't** usar rojo en una barra de cobertura que no sea una alerta: el color de estado va en el punto o en el texto, no en la longitud de la barra.
- **Don't** pintar texto con `--gt-green`, `--gt-yellow`, `--gt-blue` o `--gt-orange`: sobre un tinte claro el verde brillante da 2,2:1. La tinta de servicio usa `--text-brand`, `--text-warning`, `--text-info`, `--text-danger` o `--text-success` (≥4,8:1 sobre su tinte).
- **Don't** usar `--brand-hover` ni `--brand-fill` como color de texto de un enlace: el primero da 3,16:1 sobre papel. El hover de un enlace va con `--text-brand-strong`.
- **Don't** quitar el `outline` de un control con `:focus-visible`: el borde de 1 px no es un indicador de foco suficiente.
- **Don't** usar `h1` para la marca ni `h2` para el título de la página: rompe el árbol de navegación por encabezados.
- **Don't** dejar una acción táctil por debajo de 44 px de alto, aunque en escritorio se vea a 30 o 34.
- **Don't** dejar un `<select>` nativo visible ni estilizarlo por vista: todo desplegable de selección pasa por `customSelect.js` y `custom-select.css`. La única excepción es un control que no pueda mejorarse (por ejemplo, `multiple` o `size > 1`); se marca `data-pdi-select="native"` y se justifica en el código.

### CSS Debt Budget

La deuda de `!important` se paga por hoja y con medición, no por intuición. `tests/important-guard.test.js` fija un tope por archivo: puede bajar, nunca subir; una hoja nueva con `!important` falla con tope 0.

Para bajar una hoja: se capturan los estilos computados de todos los elementos a 390 y 1440 px, con el estado cerrado y el estado abierto de la vista; se retira el `!important` de las reglas que no protegen una hoja inferior y se comparan las dos capturas. Solo se aplica al código si la diferencia es cero en los cuatro estados. Sedes fue la primera hoja: 199 → 113 sin un solo cambio medido.

Antes de tocar la cascada, se deduplica. Un bloque idéntico copiado en varias hojas se mueve a una hoja compartida que importan solo las páginas que lo usaban, y se mide igual. Así se hizo con el icono de exportación (siete copias) y con los botones de `.view-actions` (dos copias). La deduplicación no cambia el estilo computado; reduce lo que compite.

Las capas `@layer` no se introducen por componente. Un estilo sin capa gana a cualquiera que esté en una capa, así que envolver solo una familia hunde el componente en vez de ordenarlo: se probó con `.btn-action` y se revirtió al medir entre 70 y 125 elementos alterados por página. Migrar a capas exige mover de una vez todo lo que compite por esos elementos —en este proyecto, casi todo `base.css`, `components.css` y las vistas— y no es un piloto.

### Conformance Checklist
1. Ninguna hoja de vista declara tokens núcleo ni bloques `[data-theme]`; los de componente viven en su hoja compartida.
2. Cero hex o `rgba()` nuevos fuera de `variables.css`.
3. Toda cifra alineada lleva `tabular-nums` y pertenece a la rampa.
4. Toda superficie nueva usa una primitiva; ninguna repite la receta de tarjeta.
5. La pieza se ve correcta en ambos temas y en 375 px de ancho.
6. Ningún `<select>` nativo visible: todos pasan por `customSelect.js`; las excepciones llevan `data-pdi-select="native"` y están justificadas.
7. Ningún badge: el estado se lee como marca (punto + palabra), el conteo como micro y la etiqueta como Chip. Una píldora tintada es una violación del contrato, no una variante.
8. El registro cálido es global; `--dash-*` son alias del dashboard y no duplican valores.
9. Ningún sólido verde usa `#00b494` con blanco: las acciones usan `--brand-fill` + `--on-brand`; las pestañas y selecciones usan `--brand-soft` + `--text-brand-strong`.
