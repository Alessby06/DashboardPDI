# Sistema PDI — Edición Astro (MPA Moderna)

**Asociación Cultural Johannes Gutenberg**  
Aplicación web para la gestión del Programa de Desarrollo Integral (PDI): padrón de beneficiarios, Expediente Integral, acompañamiento Social Pastoral, Casitas del Saber, sedes, gestión de voluntariado y ajustes del sistema.

Esta versión toma toda la lógica MVC existente y la envuelve en **Astro 5**, resolviendo la duplicación de plantillas y habilitando transiciones fluidas de página sin recargas completas.

---

## 🚀 Cómo arrancarlo

1. **Doble clic en `iniciar_dev.bat`** (abrirá el navegador automáticamente en `http://localhost:4321`).
2. O manualmente desde la terminal:
   ```bash
   npm install      # solo la primera vez
   npm run dev      # servidor de desarrollo local
   ```

Para compilar para producción:
```bash
npm run build    # genera el sitio estático optimizado en la carpeta /dist
```

---

## 🏛️ Qué cambió respecto a la versión anterior

| Aspecto | Versión Anterior (`pdi-mvc`) | Nueva Versión (`pdi-astro`) |
|---|---|---|
| **Menú y Cabecera** | Copiados a mano en los 11 HTML. Modificar el menú requería 11 ediciones. | Extraídos a `Sidebar.astro` y `Topbar.astro`. Editar un archivo actualiza todo el sistema. |
| **Modales Globales** | 1,170 líneas de modales duplicadas en cada HTML. | Centralizados en `GlobalModals.astro` y persistentes con `transition:persist`. |
| **Navegación** | Recarga completa del navegador por cada enlace (parpadeo blanco). | Transiciones instantáneas y suaves mediante `<ClientRouter />` (Astro 5). |
| **Tirón del Menú Lateral** | Recalculaba geometría y perdía caché de rasterizado de GPU en cada página. | `<Sidebar transition:persist />` se mantiene en el DOM entre páginas sin destruirse. |
| **Lógica MVC en JS** | Modelos, Controladores y Vistas en módulos ES nativos. | **Se mantiene 100% intacta** en `src/scripts/`, sin dependencias externas pesadas. |

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

Ahora solo requieres **dos pasos** (en lugar de cuatro con once ediciones):

1. **`src/pages/<slug>.astro`**: Crea el archivo de la página. Solo defines el título y tu `<section>` de contenido:
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
2. **`src/components/Sidebar.astro`**: Agrega un objeto a la lista `navItems` con la ruta y rol correspondiente. El menú lateral se actualizará en todo el sitio al instante.
