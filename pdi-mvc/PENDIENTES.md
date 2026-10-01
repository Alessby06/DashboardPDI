# Pendientes

## 1. Tirón en el primer cierre del menú lateral

**Estado:** abierto. Cinco commits sin verificar y ninguno lo resuelve.

### Síntoma

Al plegar el riel lateral (el botón hamburguesa), el primer clic de cada
carga de página da un tirón perceptible. A partir del segundo clic va limpio.
Al recargar, el problema vuelve. Se nota más en tema claro.

### Lo que ya está descartado, con medición

- El JavaScript del clic: es un `classList.toggle`. Hilo principal, primer
  cierre 208 ms frente a segundo cierre 189 ms. Nueve milisegundos.
- El trabajo de arranque (probado por el usuario con 30 s de espera).
- El volumen de contenido (todas las páginas se comportan igual).
- `will-change: width`: el ancho es una propiedad de maquetación, la GPU no la
  compone.
- `transform: translate3d(0,0,0)` + `backface-visibility: hidden` en `.sidebar`:
  dejaron de forzar capa en Chrome desde M61.
- `text-overflow: ellipsis`: las etiquetas están en `visibility: hidden` durante
  todo el encogido.
- El ciclo de realimentación de la barra de desplazamiento: medido fotograma a
  fotograma, el margen es constante en las seis combinaciones.
- Los `backdrop-filter` y `background-attachment: fixed` (retirados).
- Las sombras del contenido: quitarlas apenas baja el coste (27 ms frente a
  31 ms de rasterizado).

### La hipótesis que sigue en pie

`.app-shell` es un `flex`. Al plegarse el riel de 280 a 72 px, la columna de
contenido crece 208 px y **en cada uno de los ~17 fotogramas de la transición
tiene que maquetar y pintar de nuevo todo lo que hay dentro, a una anchura que
no había visto nunca**. La primera vez esas anchuras no están en la caché de
rasterizado del navegador; a partir de la segunda sí, y por eso solo tira el
primer cierre.

Medido con cinco variantes en un mismo Chrome (A/B, 2 repeticiones):

| variante | rasterizado, primer cierre |
|---|---|
| sin cambios | 31 ms |
| contenido sin sombras | 27 ms |
| etiquetas sin transición de opacidad | 24 ms |
| **columna de contenido que no cambia de ancho** | **14 ms** |

### Falta el dato decisivo

La traza del panel Rendimiento de DevTools en la máquina del usuario, grabando
un solo clic. Sin ella no se puede distinguir si en su equipo manda el pintado
o el maquetado.

Cómo obtenerla (no sirve una captura de pantalla, hace falta el archivo):

1. `F12` → panel Rendimiento.
2. Grabar → esperar un segundo → un solo clic en el hamburguesa → esperar dos
   segundos → parar.
3. Clic derecho sobre el gráfico → Guardar perfil. Se descarga un `.json`.
4. Pasarle el nombre del archivo. El analizador está en
   `%TEMP%\opencode\analizar.js` y acepta tanto el `.json` de DevTools como las
   trazas propias.

Herramientas en `%TEMP%\opencode\`: `analizar.js` (analiza cualquier traza),
`ab.js` (A/B de variantes), `hilos.js` (trabajo por hilo y por tramo),
`primerCierre.js`, `validar.js`, `muestrear.js`.

### Advertencia

Las medidas absolutas del navegador sin ventana **no son fiables**: rasteriza
por software, el hilo de la GPU está saturado el 100 % del tiempo y el motor
baja a 30 fps. Solo valen las comparaciones entre variantes dentro de una misma
ejecución. El síntoma no se reproduce en headless.

### Caché del navegador

El CSS se sirve sin parámetro de versión. Antes de cada prueba, `Ctrl+Shift+R`,
o versionar las URL (`?v=`) en los once HTML.

---

## 2. Cambiar el menú de PC por el de móvil

**Estado:** hecho el 30/09/2026, a la espera de que el usuario lo revise.

No había dos menús. Hay **uno solo** (`<aside class="sidebar" id="appSidebar">`,
las once páginas) con dos comportamientos según `window.innerWidth`:

- **PC** (>900 px): columna fija de 280 px que se pliega a un riel de iconos de
  72 px. Clase `.collapsed`. Definido en `base.css`, dentro de
  `@media (min-width: 901px)`.
- **Móvil** (≤900 px): cajón fuera de pantalla con fondo oscurecido. Clase
  `.open` + `.sidebar-backdrop.active`. Definido por separado en **cada** hoja
  de vista, dentro de `@media (max-width: 900px)`.

Se ha impuesto el comportamiento de cajón también en pantalla grande:

- `Navigation.js`: constante `Navigation.MENU_COMO_CAJON`. Con `?cajon=0` en la
  URL se recupera el riel de iconos sin tocar los archivos.
- `base.css`: bloque `html[data-menu-cajon]` al final, que replica las reglas del
  cajón para cualquier anchura.

**Para deshacer:** borrar el bloque `PRUEBA TEMPORAL` del final de `base.css` y
poner `MENU_COMO_CAJON = false`.

**Medición del antes y el después** (dashboard, tres repeticiones por modo en el
mismo Chrome, ciclo de abrir y cerrar de 1400 ms):

| | riel de iconos | cajón |
|---|---|---|
| cambios de anchura de la columna de contenido | 17 | **0** |
| maquetado | 58,2 ms | 7,1 ms |
| pintado | 32,3 ms | 1,4 ms |
| rasterizado | 43,0 ms | 0,5 ms |
| hilo de JavaScript | 243,7 ms | 81,3 ms |
| eventos de pintado | 183 | 15 |

El cajón anima `transform`, no `width`. La columna de contenido no cambia de
anchura ni una sola vez, así que no hay nada que remaquetar ni que volver a
pintar. Si el tirón venía de ahí, esto lo quita de raíz. Queda por confirmar en
la máquina del usuario.

Las once páginas pasan la comprobación: el menú abre, cierra, no hay errores de
consola y la columna de contenido conserva la anchura.

Herramientas: `verificarCajon.js` (un antes/después), `todasPaginas.js` (las
once), `dom.js` (estructura), `comparar.js` (antes/después con traza).

---

## 3. Lo que quedó atrasado

- Cargar los modales bajo demanda (79,6 KB × 10 páginas).
- Decidir qué hacer con el `vercel.json` de la raíz.
- `PRODUCT.md` y `README.md` de la raíz están borrados y sin confirmar. No
  tocarlos ni confirmarlos sin permiso.
- Los cinco commits de rendimiento (`fde2d6c`, `89ed136`, `1188dcb`, `43ee015`,
  `f42672d`) están **sin subir**. No subir nada a ciegas: verificar producción
  después de cualquier `push`.
---

## 4. Revisión general del código (30/09/2026)

Buscada a partir del fallo de las tarjetas blancas en tema oscuro, que es el
mismo patrón que se repite por todo el proyecto: un color puesto a mano que no
sigue al tema.

### Arreglado en esta revisión

- **Barra de pestañas del expediente sin tema oscuro.** `.expediente-nav-item`
  lleva el color, el fondo de `hover` y el de `.active` escritos a mano con los
  valores del tema claro, y no había ninguna regla `[data-theme="dark"]` que los
  contradijera. Medido: la barra era idéntica en los dos temas; la etiqueta
  inactiva caía en 1,78:1 y al pasar el ratón salía un fondo `rgb(241,245,249)`,
  un fogonazo blanco en una pantalla oscura. Añadidas las tres reglas de tema
  oscuro en `views-expediente.css`. El tema claro no cambia.
- **Tarjetas de consentimiento** (la que reportó el usuario): `background:
  #ffffff` fijo, ilegible en oscuro. Resuelto con `var(--surface-1)`.

### Confirmado y pendiente de decisión

1. **Los datos se meten en el DOM sin escapar.** Hay 96 asignaciones a
   `innerHTML` y **ninguna** función de escapado en todo el proyecto. Probado
   con un beneficiario cuyo nombre llevaba `<img src=x onerror=...>`: en
   `padron.html` el manejador **llegó a ejecutarse**. Es inyección de HTML
   almacenada. Ahora mismo los datos viven en `localStorage` y el riesgo es de
   propia cuenta, pero en cuanto se conecte con un servidor pasará a afectar a
   otros usuarios.
2. **El verde de marca se usa como color de texto.** `--gt-green` (#00b494) da
   2,3:1 a 2,6:1 sobre blanco. Afecta a unos 400 textos entre insignias,
   títulos y códigos de ficha. Es un problema de paleta, no un fallo puntual:
   arreglarlo cambia el aspecto de la aplicación y es decisión del usuario.
3. **`--text-dim` en tema oscuro** da 3,3:1 a 3,7:1 sobre `--surface-1` y
   `--surface-2`, en unos 300 elementos. Ya se corrigió en un sitio
   (`.ley-card-art`); queda el resto.
4. **Insignias de ámbar en tema claro** a 1,9:1, y de rojo y azul entre 3,2:1 y
   3,5:1.

### Deuda de estructura (la causa de que los bugs se repitan)

- **392 de los 952 bloques de reglas CSS están repetidos en las diez hojas de
  vista**, unas 3.100 líneas. Las hojas suman 30.558 líneas en total. Por eso un
  arreglo en una hoja no se ve en las otras nueve: es exactamente lo que pasó
  con `.ley-consent-card` (diez copias) y con `.expediente-nav-item` (tres
  definiciones contradictorias en el mismo fichero, dos de ellas de un estilo
  distinto).
- `.ley-consent-card` con `background: #ffffff` sigue en las otras nueve hojas.
  Hoy no se ven porque solo `ExpedienteView.js` pinta esa clase.
- Las hojas de vista redeclaran las variables de tema con valores que **no
  coinciden** con `variables.css`: `--surface-2` es `#f1f5f9` en
  `variables.css` y `#f8fafc` en las hojas de vista.
- `expediente.html:760`: un `<input readonly>` con un valor escrito en el HTML
  ("Seguimiento Domiciliario y Soporte Integral"). Parece un dato guardado y no
  lo es: es una constante.

### Cómo se midio

Las once páginas, en los dos temas, recorriendo el DOM y midiendo el color con
el que se pinta cada elemento. El contraste se calcula mezclando los fondos
semitransparentes con los que tienen debajo. Se apartan los que vienen de un
degradado, porque su color no se puede leer y medirlos produce falsos
positivos. Para texto grande el umbral es 3:1 y para texto normal 4,5:1.

Herramientas en `%TEMP%\opencode\`: `revisar.js` (sintaxis, llaves y maquetado),
`barrido2.js` (las once páginas en los dos temas), `triage.js` (agrupa los
casos), `duplicado.js` (cuánto se repite), `inyeccion.js` (prueba de
inyección), `pestanas.js` (los tres estados de la barra de pestañas),
`consentimiento.js`, `oscuro.js`.

Advertencia: el conteo bruto de «textos con poco contraste» sale disparado y no
es número de fallos. Hay que separar los falsos positivos de los casos reales
y aplicar el umbral que corresponde al tamaño de la letra.
