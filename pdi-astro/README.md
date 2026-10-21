# Sistema PDI — Edición Astro (MPA Moderna)

**Asociación Cultural Johannes Gutenberg**  
Gestión web Programa Desarrollo Integral (PDI): padrón beneficiarios, Expediente Integral, acompañamiento Social Pastoral, Casitas del Saber, sedes, voluntariado, ajustes.

Lógica MVC envuelta en **Astro 5**: cero duplicación plantillas, transiciones fluidas sin recarga.

---

## 🚀 Cómo arrancarlo

1. **Doble clic `iniciar_dev.bat`** (abre `http://localhost:4321`).
2. Terminal:
   ```bash
   npm install      # solo la primera vez
   npm run dev      # servidor de desarrollo local
   ```

Compilar producción:
```bash
npm run build    # genera el sitio estático optimizado en la carpeta /dist
```

---

## 🏛️ Qué cambió respecto a la versión anterior

| Aspecto | Versión Anterior (`pdi-mvc`) | Nueva Versión (`pdi-astro`) |
|---|---|---|
| **Menú y Cabecera** | Copiados a mano en 11 HTML. Modificar menú requería 11 ediciones. | Extraídos a `Sidebar.astro` y `Topbar.astro`. Editar 1 archivo actualiza todo. |
| **Modales Globales** | 1,170 líneas modales duplicadas en cada HTML. | Centralizados en `GlobalModals.astro` persistentes con `transition:persist`. |
| **Navegación** | Recarga completa navegador por enlace (parpadeo blanco). | Transiciones instantáneas vía `<ClientRouter />` (Astro 5). |
| **Tirón Menú Lateral** | Recalculaba geometría, perdía caché rasterizado GPU por página. | `<Sidebar transition:persist />` persiste en DOM sin destruirse. |
| **Lógica MVC en JS** | Modelos, Controladores, Vistas en módulos ES nativos. | **100% intacta** en `src/scripts/`, sin dependencias externas pesadas. |

---

## 📂 Organización del Proyecto

```text
pdi-astro/
├── public/                 # Archivos servidos directamente en la raíz
│   ├── assets/             # Logos e iconos institucionales
│   └── data/               # Datos simulados y fixtures
├── src/
│   ├── components/         # Componentes de interfaz reutilizables
│   │   ├── Sidebar.astro       # Menú lateral con estado activo automático
│   │   ├── Topbar.astro        # Barra superior con selector de roles
│   │   └── GlobalModals.astro  # Modales compartidos (Alta, Ficha, etc.)
│   ├── layouts/
│   │   └── AppLayout.astro     # Cascarón global con ClientRouter y estilos
│   ├── pages/              # Las 11 pantallas del sistema (.astro)
│   ├── scripts/            # Código JavaScript del sistema (MVC)
│   │   ├── auth/               # PageGuard.js, RouteMap.js
│   │   ├── controllers/        # Controladores de eventos
│   │   ├── core/               # Bootstrap.js, Navigation.js, Theme.js
│   │   ├── models/             # BeneficiarioModel, AuditModel, etc.
│   │   ├── pages/              # Scripts de montaje por página
│   │   ├── utils/              # Calculadoras, filtros y validadores
│   │   └── views/              # Vistas de renderizado DOM
│   └── styles/             # Hojas de estilo modulares (CSS nativo)
├── astro.config.mjs        # Salida estática pura compatible con Vercel
├── iniciar_dev.bat         # Inicio rápido en Windows
└── package.json
```

---

## 💡 Para añadir una pantalla nueva

Dos pasos (en lugar de cuatro con once ediciones):

1. **`src/pages/<slug>.astro`**: Crea archivo página. Define título y `<section>` contenido:
   ```astro
   ---
   import AppLayout from '../layouts/AppLayout.astro';
   import '../styles/views-<slug>.css';
   ---

   <AppLayout title="Mi Nueva Pantalla" currentPage="<slug>">
     <section id="view-<slug>" class="content-section">
       <!-- Tu contenido específico aquí -->
     </section>

     <script>
       import '../scripts/pages/<slug>.js';
     </script>
   </AppLayout>
   ```
2. **`src/components/Sidebar.astro`**: Agrega objeto a lista `navItems` con ruta y rol. Menú lateral actualiza en todo el sitio al instante.

---

## ☁️ Conexión con SurrealDB Cloud (variable crítica)

La aplicación **no tiene servidor propio**: toda la información vive en una
instancia de SurrealDB Cloud y se accede por WebSocket. Si la variable
`PUBLIC_SURREAL_URL` no apunta a la instancia correcta, la aplicación abre
pero **se queda vacía y no se puede guardar nada**.

Valor vigente (única instancia de la organización `pdi-infancia-sa`):

```env
PUBLIC_SURREAL_URL=wss://pdi-infancia-sa-06gkpubrg5rg31f1nhhb4dbr34.azure-brs.surreal.cloud
PUBLIC_SURREAL_NS=johannes_gutenberg
PUBLIC_SURREAL_DB=infancia_saludable
```

> **Ojo con el despliegue en Vercel.** Las variables de entorno de Vercel son
> las que usa el sitio publicado, no el `.env` del repositorio. Si
> `PUBLIC_SURREAL_URL` allí apunta a otra instancia, el sitio arranca sin
> errores visibles y sin datos. Para comprobarlo, sin depender de la
> consola del navegador:
>
> ```bash
> curl -s -o /dev/null -w "%{http_code}\n" https://<host-de-la-instancia>/health
> ```
>
> `200` = la instancia existe. `404` = la URL apunta a una instancia que no
> existe, y el WebSocket no podrá conectarse.

La capa de datos (`src/scripts/core/db.js`) avisa con un aviso en pantalla
cuando no consigue conectar, y reintenta sola con backoff (5 s → 30 s).

