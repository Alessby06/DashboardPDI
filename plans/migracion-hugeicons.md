# Migración de iconografía a Hugeicons

Plan técnico. No implementa nada todavía; fija el inventario, la arquitectura del reemplazo
y el orden de los lotes.

> **Relación con `plans/002-iconoir-icon-system-migration.md`.** Ese plan (status TODO) nació
> para migrar a Iconoir. La petición actual cambia la familia a Hugeicons, así que este
> documento lo **sustituye** en la decisión de familia. Se conservan sus aciertos: entrega
> vendorizada sin dependencia npm, `Icon.astro` + módulo central, prohibición de colores
> literales y lista de ilustraciones que no se migran.
> El plan 002 queda desactualizado en cifras (habla de 377 SVG; el recuento real a hoy es 294)
> y debe marcarse como reemplazado al aprobar este.

## 0. Decisiones cerradas

| Fecha | Decisión | Motivo | Consecuencia |
|---|---|---|---|
| 2026-10-30 | Migrar a Hugeicons por **coherencia visual** | Los iconos actuales se ven genéricos | Se aceptan 288 reemplazos y 12–15 commits |
| 2026-10-30 | **Vendorizar** los 64 iconos (4.4.0) | Sin dependencia ni lockfile; build sin red | Actualización manual y deliberada |
| 2026-10-30 | **Trazo 1.75 global** | Elegido en la muestra de la fase 0 | Un solo token `--icon-stroke` |
| 2026-10-30 | **Conservar** las 9 ilustraciones | Son ilustraciones, no iconos | Frontera documentada |
| 2026-10-30 | **Desplegar por superficies** | Commits revisables y reversibles | Dos familias conviven unos días |
| 2026-10-30 | **QA con capturas manuales** | Sin dependencias nuevas | Antes/después por lote, claro/oscuro y 3 anchos |

**Fase 0 completada:** muestra real en `/fase0-iconos` (matriz de tamaños, barra lateral,
tarjeta de kanban y botones; claro/oscuro), verificada a 1440 px y con las cuatro columnas
midiendo lo mismo. La página temporal se eliminó al cerrar la decisión. Sin captura automática:
la ventana del navegador integrado no era visible; la comparación se hizo en vivo.

## 1. Inventario medido (base actual)

| Métrica | Valor |
|---|---|
| SVG en línea | **294** |
| Archivos afectados | **32** (12 páginas, 6 componentes, 14 módulos JS de vistas) |
| Iconos únicos (por `d`) | **93** |
| Usos reemplazables por Hugeicons | **288** |
| Iconos Hugeicons distintos necesarios | **64** |
| Ilustraciones propias que se conservan | **6 usos** |
| Lienzo | 289 de 294 son `0 0 24 24` |
| Relleno | **0 SVG con `fill` distinto de none** (todo trazo) |
| Trazos | 2 (200 usos), 2.5 (45), 1.8 (24), 2.2 (21), 3.5 (7), 3 (7), 2.4 (4), 1.5 (3), 2.8 (1), 1 (1) |
| Tamaños | 15 (60), 18 (41), 14 (35), 12 (29), 20 (21), 13 (15), 24 (11), 16 (11), 10 (3) |

Concentración por archivo:

| Archivo | SVG |
|---|---|
| `components/GlobalModals.astro` | 46 |
| `scripts/views/SocialKanbanView.js` | 26 |
| `pages/expediente.astro` | 24 |
| `pages/social.astro` | 21 |
| `pages/ajustes.astro` | 17 |
| `scripts/views/SedesView.js` | 16 |
| `pages/login.astro` | 13 |
| `components/Sidebar.astro` | 13 |
| `pages/auditoria.astro` | 12 |
| `scripts/views/ExpedienteView.js` / `SaludCredView.js` | 11 cada uno |
| `VoluntariadosView.js` | 10 |
| resto (20 archivos) | 72 |

Los iconos actuales son **Heroicons outline**: mismo grid de 24, mismas convenciones de trazo
redondeado. Eso hace que Hugeicons encaje sin cambiar la retícula ni el flujo de los layouts.

### Dependencias CSS que hay que respetar

- Reglas globales que dimensionan por descendencia: `.nav-btn svg`, `.btn-action svg`,
  `.kpi-icon-wrap svg`, `.theme-toggle-btn svg`, `.toast-icono svg`, `.audit-kpi-icon-box svg`.
- Reglas que apuntan a **clases puestas en el propio `<svg>`**: `svg.audit-search-icon`,
  `svg.filter-caret`, `svg.caret`. El componente debe reenviar `class`.
- **Dos chevrones de `<select>` como `background-image` con data-URI** (`components.css:613`,
  `expediente.css:179`): también son iconos a reemplazar.
- **14 reglas `svg` dentro de estilos con alcance de componente**; solo 3 dejarían de aplicar
  si el SVG pasa a otro componente (`Sidebar .nav-btn-logout svg`, `login .status-error-callout svg`,
  `login .module-chev svg`). Se resuelven con `:global(...)` o moviéndolas a la hoja global.
- Iconos inyectados con `innerHTML` en JS (tema claro/oscuro/sistema, toasts): necesitan una
  función que devuelva el SVG como cadena.

## 2. Ficha de Hugeicons (verificada en el registro npm)

| Dato | Valor |
|---|---|
| Paquete | `@hugeicons/core-free-icons` **4.4.0** |
| Licencia | **MIT** (paquete e iconos gratuitos) |
| Formato | ESM, un módulo por icono, `sideEffects: false` → tree-shaking real |
| Catálogo | **6.157** iconos |
| Estilo | `stroke-rounded`, 24×24, trazo nativo **1.5**, `currentColor`, extremos redondos |
| Estructura | `[["path", { d, stroke, strokeWidth, strokeLinecap, ... }], ...]` |
| Astro | **no hay** paquete oficial de Astro → componente propio (trivial) |

## 3. Entrega: vendorizar, no depender

Siguiendo la frontera del plan 002 (**ninguna dependencia npm nueva**) y como aquí solo hacen
falta **64 iconos**, se vendorizan:

- `scripts/generar-hugeicons.mjs` — descarga los 64 módulos desde `unpkg` con la versión fijada
  (`4.4.0`), normaliza la geometría (quita `stroke`, `strokeWidth`, `strokeLinecap`,
  `strokeLinejoin`) y escribe `src/data/hugeicons.js`.
- `src/data/hugeicons.js` — generado, con `HUGICONS_VERSION = "4.4.0"`, licencia MIT y los
  cuerpos listos para renderizar. ~30 KB de fuente.
- Ventajas: reproducible, sin 80 MB en `node_modules`, sin cambios de nombres entre versiones,
  y el build no depende de la red. Actualizar la familia o un icono es volver a ejecutar el
  script con otra versión.
- Contra: la actualización es manual y deliberada (que es justo lo que se quiere en un sistema
  clínico).

Alternativa descartada por ahora: `npm i -D @hugeicons/core-free-icons` e importar los 64
módulos. Aporta tipos y actualización con `npm update`, pero añade dependencia, lockfile y
churn de nombres; no compensa para 64 iconos.

## 4. Arquitectura del reemplazo

### 4.1 Registro semántico único — `src/data/hugeicons.js` + alias

No se usan los nombres de Hugeicons en las vistas. Se define un alias por uso:

```js
export const ICONOS = {
  "accion.cerrar": "cancel-01",
  "accion.confirmar": "tick-02",
  "nav.desplegar": "arrow-down-01",
  // ...
};
export function iconHtml(alias, { size = 16, stroke, className = "" } = {}) { ... }
```

Motivos: el alias expresa la intención (no la metáfora), permite cambiar de icono sin tocar
las vistas, evita depender de la nomenclatura del set y sirve tanto a Astro como al JS del
navegador.

### 4.2 Componente Astro — `src/components/Icon.astro`

```astro
<Icon name="accion.cerrar" size={14} class="filter-caret" />
```

- Renderiza un `<svg>` real (no `<img>` ni sprite), con `viewBox="0 0 24 24"`,
  `fill="none"`, `stroke="currentColor"`, `stroke-linecap/linejoin="round"`.
- El grosor sale de un token CSS, nunca de un atributo incrustado en el path.
- Reenvía `class`, `style`, `aria-hidden` y `title`. Por defecto `aria-hidden="true"`;
  los botones que solo llevan icono conservan su `aria-label` actual.
- `size` mantiene los tamaños existentes (12/13/14/15/16/18/20/24) para no mover ni un píxel
  de layout en el primer lote.

### 4.3 Función para plantillas JS — `iconHtml()`

Misma fuente de datos, devuelve la cadena SVG. Sustituye los `innerHTML` del tema y de los
toasts y las plantillas de kanban, sedes, expediente, salud y voluntariados.

### 4.4 Peso de trazo: 1.75 global (decidido en fase 0)

Hugeicons nace en 1.5 sobre grid de 24. La muestra comparativa de la fase 0 (matriz de
tamaños, barra lateral real, tarjeta de kanban y botones) se resolvió por **1.75 en todos los
tamaños**: conserva el carácter del set sin el aspecto tenue de 1.5 en 12–14 px.

Se implementa como un único token `--icon-stroke: 1.75`. No hay escala por tamaño ni
`stroke-width` incrustado en los paths. Si más adelante hace falta una variante (por ejemplo,
acciones destacadas), se añade `--icon-stroke-strong` y se usa de forma explícita, sin
convertir el grosor en un número mágico por instancia.

### 4.5 Accesibilidad

- Decorativos: `aria-hidden="true"` (igual que hoy).
- Icono con significado propio: prop `title` → `<title>` dentro del SVG.
- Botones icono-only: se conserva el `aria-label` existente; no se toca su texto.
- Ningún cambio de foco ni de orden de tabulación.

### 4.6 Higiene y red de seguridad

- Test guardián: falla si aparece `<svg` en `src/` fuera de la lista permitida
  (`Icon.astro` + ilustraciones propias). Evita que vuelvan a colarse iconos sueltos.
- Las ilustraciones propias viven en `src/components/Ilustracion.astro` o
  `src/assets/ilustraciones/`, con comentario de por qué no son iconos.
- El archivo generado lleva versión y licencia; el script es la única vía de actualización.

## 5. Mapa de equivalencias

### 5.1 Los más usados

| Uso actual | Usos | Hugeicons |
|---|---|---|
| Cerrar / quitar (X) | 33 | `Cancel01Icon` |
| Confirmar / check | 25 | `Tick02Icon` |
| Flecha derecha (siguiente, canalizar) | 13 | `ArrowRight01Icon` |
| Flecha izquierda (volver) | 13 | `ArrowLeft01Icon` |
| Desplegar (chevron) | 11 | `ArrowDown01Icon` |
| Subir archivo / foto | 10 | `Upload01Icon` |
| Grupo de personas | 10 | `UserGroupIcon` |
| Ubicación / sede | 9 | `Location01Icon` |
| Sincronizar | 9 | `RefreshIcon` |
| Información | 9 | `InformationCircleIcon` |
| Ver / ojo | 9 | `EyeIcon` |
| Cámara / foto | 8 | `Camera01Icon` |
| Escudo verificado | 7 | `ShieldCheckIcon` |
| Añadir (+) | 7 | `Add01Icon` |
| Editar | 7 | `PencilEdit02Icon` |
| Buscar | 7 | `Search01Icon` |
| Advertencia | 5 | `Alert02Icon` |
| Check en círculo | 5 | `CheckmarkCircle02Icon` |
| Escolaridad | 5 | `Mortarboard01Icon` |
| Tema claro | 5 | `Sun03Icon` |
| Casa / inicio | 4 | `Home01Icon` |
| Usuario | 4 | `UserIcon` |
| Reloj / pendiente | 4 | `Clock01Icon` |
| Carpeta | 4 | `Folder01Icon` |
| Tema oscuro | 4 | `Moon02Icon` |

### 5.2 Resto (64 iconos distintos)

El detalle de los 93 únicos, con archivo, número de usos y nombre propuesto, está en
`plans/icon-map-draft.json`. Nombres verificados contra el índice del paquete (todos existen).
La metáfora visual de cada uno se valida en pantalla al migrar su lote; si un nombre no
representa bien el concepto PDI, se cambia solo en el alias.

### 5.3 Ilustraciones que NO se reemplazan (6 usos)

| Elemento | Dónde | Motivo |
|---|---|---|
| Mascota "foco" y su sonrisa | `ajustes.astro` | Ilustración con animación propia |
| Cursor de ayuda del foco | `ajustes.astro` | Parte de la ilustración interactiva, no icono de sistema |
| Avatares generados (silueta y dos variantes) | `Avatar.js` | Ilustración generada con datos |
| Serie de hemoglobina | `SaludCredView.js` | Visualización de datos, no icono |
| Logotipo / marca | layout y login | Identidad, no iconografía |

## 6. Fases y commits

| Fase | Contenido | Archivos | Commit |
|---|---|---|---|
| **0. Muestra** | Matriz de tamaños, sidebar, tarjeta y botones; 1.75 elegido | página temporal eliminada | sin commit (hecho) |
| **1. Infraestructura** | script generador, `hugeicons.js` con los 64, `Icon.astro`, `iconHtml`, tokens de tamaño/trazo, test guardián | 4 nuevos + tokens | `feat(ui): sistema de iconos Hugeicons` |
| **2. Chrome** | Sidebar (13), botón de tema, toggles de ajustes, chevrones de `<select>` | `Sidebar.astro`, `ajustes.astro`, `base.css`, `components.css`, `expediente.css` | 2 commits |
| **3. Modales** | `GlobalModals.astro` (46) | 1 | 1–2 commits |
| **4. Vistas JS** | Kanban social (26), sedes (16), expediente (11), salud (11), voluntariados (10), dashboard (5), beneficiarios (5), toasts (5), ajustes (5), casitas (4) | 10 JS | 3 commits |
| **5. Páginas** | expediente (24), social (21), ajustes (17), login (13), auditoría (12), dashboard (8), voluntariados (6), salud (6), padrón (6), educativo (5), sedes (3), resto | 12 | 4 commits |
| **6. Cierre** | limpieza de CSS muerto, sección de iconografía en `DESIGN.md`, QA visual y de payload | docs | 1 commit |

Estimación: **5–7 días** de trabajo efectivo, 12–15 commits locales, cada uno revisable y
reversible por superficie.

**Estado:** fases 0–6 completadas.

- Sistema: `ddce977` · Chrome: `5f32b41` · Modales: `a1e73ad`
- Vistas JS: `cdcf82f`, `8d5b268`, `7f84c90`
- Páginas: `601c36c`, `2521cb6`, `8ebcdb7`

Quedan **6 ilustraciones propias** (3 avatares, gráfico de hemoglobina, mascota del foco y su
cursor) y el renderizador. Los módulos del login ya son iconos del set con micro-movimiento
sobre el icono completo. El set completo (64 iconos)
pesa ~15 KB gzip y solo viaja en páginas que importan el registro. `DESIGN.md` documenta la
familia, el token y las reglas; `tests/iconos-guard.test.js` impide nuevos SVG sueltos.

## 7. Criterios de aceptación

1. **288 de 294** SVG reemplazados; las 6 ilustraciones propias documentadas y aisladas.
2. `npm test` verde y nuevo test guardián verde (no quedan `<svg>` sueltos fuera de la lista).
3. Cero cambios de layout: mismas cajas, mismos tamaños, mismos saltos de línea.
4. QA visual en claro y oscuro, a 1440 / 1024 / 768 / 390 px, con ficha, filtros y kanban abiertos.
5. Todos los botones icono-only conservan nombre accesible (revisión manual + árbol de accesibilidad).
6. Peso estable: el HTML no crece más de 5 % y el JS no gana más de 15 KB gzip.
7. Ningún `stroke-width` incrustado en los iconos de sistema (todo por token).
8. `astro build` sin errores ni advertencias nuevas.

## 8. Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El trazo 1.75 no encaja en algún contexto | Bajo | Se ajusta el token global o se añade `--icon-stroke-strong` sin tocar los paths |
| Metáfora distinta en algún icono PDI (casita, lonchera, croquis) | Bajo | Revisión por lote; el alias permite cambiar sin tocar vistas |
| Estilos Astro con alcance que apuntan a `svg` | Bajo | Solo 3 reglas; pasar a `:global` o mover a hoja global |
| Iconos inyectados por `innerHTML` se quedan atrás | Medio | `iconHtml` obligatorio + guardián que busca `<svg` en JS |
| Chevrones de `<select>` en data-URI | Bajo | Regenerarlos desde el mismo set; preferible `mask` con `currentColor` |
| El archivo generado se edita a mano y se desincroniza | Medio | Cabecera "generado por scripts/generar-hugeicons.mjs" + comprobación de versión en el test |
| Inflación del HTML por seguir inline | Bajo | Se mide; si crece, fase opcional de sprite (la geometría ya está normalizada para `<use>`) |

## 9. Decisiones pendientes

Ninguna: entrega, trazo, ilustraciones, despliegue, QA y excepciones están cerradas y
documentadas. El plan 002 queda marcado como reemplazado por este documento.