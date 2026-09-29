# Sistema PDI — Asociación Cultural Johannes Gutenberg

Aplicación web para la gestión del Programa de Desarrollo Integral: padrón de
beneficiarios, Expediente Integral, acompañamiento Social Pastoral, Casitas del
Saber, sedes, gestión de voluntariado y ajustes del sistema.

No tiene dependencias: HTML, CSS y JavaScript con módulos ES nativos. No hay
`package.json`, ni `node_modules`, ni paso de compilación.

---

## Cómo arrancarlo

Doble clic en **`iniciar_mvc.bat`**. Abre el navegador en el panel general.

Si eso no funciona, con Python a mano:

```
python scripts\serve.py          # http://localhost:8080/paginas/index.html
python scripts\serve.py 3000     # en otro puerto, si el 8080 está ocupado
```

**No abras los HTML con doble clic.** Los módulos ES no cargan con `file://`
por política de origen del navegador, y la página se queda en blanco.

---

## Cómo está organizado

```
pdi-mvc/
├── paginas/        las 11 pantallas
├── js/             la aplicación, separada por capas
│   ├── models/     datos y su normalización (no tocan el DOM)
│   ├── views/      todo lo que pinta en pantalla
│   ├── controllers/ lo que engancha los eventos
│   ├── core/       arranque, navegación, tema y compatibilidad
│   ├── auth/       quién entra y a qué puede entrar
│   ├── utils/      cálculos y ayudantes
│   └── pages/      un punto de entrada por pantalla
├── css/            15 hojas: base, componentes y una por pantalla
├── assets/         3 imágenes
├── data/           5 conjuntos de datos de prueba
└── scripts/        herramientas (solo desarrollo)
```

### La regla que hay que saberse

**En `paginas/` está todo.** No hay archivos generados: los once HTML se editan a
mano y no los regenera nadie. Lo que ves es lo que se publica.

**El precio de esa simplicidad:** el menú lateral, la barra superior y los
modales están copiados en cada uno de los once HTML. Si añades un elemento al
menú, o un modal, tienes que ponerlo en los once. Es un trabajo de unos segundos
por archivo, pero no lo saltes: si no, un compañero verá un sitio distinto al
tuyo.

---

## Para añadir una pantalla nueva

Cuatro sitios, en este orden:

1. **`paginas/<slug>.html`** — el documento completo. Copia uno que se le parezca
   y cambia el contenido. Deja el `data-page="<slug>"` en el `<body>`.
2. **`js/pages/<slug>.js`** — el punto de entrada. Mira `js/pages/salud.js`:
   importa la vista, el modelo, arranca lo común y exporta lo que las vistas
   heredadas necesitan por `window.PDI`.
3. **`js/auth/RouteMap.js`** — declara la página en `PAGINAS`: qué archivo es, qué
   etiqueta tiene, qué `view` es, qué roles entran y si aparece en el menú.
   **El orden de `ORDEN_MENU` tiene que coincidir con el del `<nav>`** en los
   HTML, o la página se abrirá pero sin que nada la señale como la activa.
4. **El `<a href>` en el `<nav>` de cada HTML** que muestre el menú. Son once
   ediciones, una por archivo. A la que le toca: ponle `data-view` con el mismo
   `view` que declaraste en `RouteMap.js`, y `class="nav-btn active"` solo en su
   propia página.

Después, para no romper nada:

- Comprueba que la página nueva tiene su `<section id="...">` con el mismo
  `view` que dice `RouteMap.js`. **Nada lo comprueba automáticamente.**
- Abre las pantallas y mira que no salga nada en rojo en la consola del navegador.

---

## Publicación

El sitio se publica en **Vercel** como archivos estáticos. La configuración está
en `vercel.json`, **en la raíz del repositorio, no aquí dentro**: Vercel solo lee
el `vercel.json` de la raíz del proyecto, que es la del repositorio.

Son tres reglas y **el orden es lo único que importa**:

```
/            ->  /pdi-mvc/paginas/index.html
/(.*).html   ->  /pdi-mvc/paginas/$1.html
/(.*)        ->  /pdi-mvc/$1
```

La tercera es la genérica y tiene que ser la última. Si se sube, `/js/...`
buscaría dentro de `paginas/` y `/padron.html` en la raíz: justo al revés.

Desde fuera, las direcciones siguen siendo limpias: `/padron.html`, `/salud.html`.

---

## Cosas que conviene saber antes de tocar nada

- **El JavaScript usa módulos ES nativos**, así que las rutas de los `import`
  llevan la extensión: `import { SedeModel } from "../models/SedeModel.js"`.
- **Los datos de `data/` son de prueba.** Viven en el navegador, en el
  `localStorage`. No hay servidor ni base de datos conectado: lo que se carga al
  abrir la pestaña es lo que hay en `data/fixtures/`.
- **Cada archivo se carga solo con su página.** No hay un `app.js` que arrastre
  todo. Si añades un archivo a `js/`, importa en la página que lo necesite, y en
  esa basta.
- **El control de acceso está en un solo sitio**, `js/auth/RouteMap.js`. Si
  cambia quién entra a dónde, se cambia ahí y en ningún otro archivo.
- **Los archivos de texto están en UTF-8.** Si los editas con un editor que
  guarde en otro alfabeto, te entran caracteres raros. Usa «guardar como UTF-8».
