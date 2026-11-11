// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  build: {
    format: 'directory'
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },

  // En desarrollo, la primera visita a cada ruta compilaba su cadena de
  // módulos al vuelo (0,6–2,7 s). Vite pretransforma estas entradas al
  // arrancar el servidor para que la primera navegación no espere.
  vite: {
    server: {
      warmup: {
        clientFiles: [
          './src/scripts/pages/*.js',
          './src/scripts/views/*.js',
          './src/scripts/core/db.js',
          './src/scripts/core/Bootstrap.js',
          './src/scripts/core/LoadingState.js',
          './src/scripts/core/Navigation.js',
          './src/scripts/utils/*.js',
        ],
      },

      // El login local no funcionaba: en `astro dev` Astro entrega el cuerpo
      // de los POST ya consumido al middleware, así que la Function de Vercel
      // recibía "{}" y contestaba 400. En desarrollo, /api se redirige al
      // despliegue (que sí conserva el cuerpo) contra la misma base de datos:
      // entrar en local trabaja con los datos reales. Solo afecta a `astro
      // dev`; el build no usa el proxy.
      proxy: {
        '/api': {
          target: 'https://mvc-pdi.vercel.app',
          changeOrigin: true,
          secure: true,
          // La Function valida que el Origin coincida con su host.
          headers: { origin: 'https://mvc-pdi.vercel.app' },
        },
      },
    },
  },

  // Dev toolbar deshabilitada a nivel de proyecto: tiene prioridad sobre la
  // preferencia global de cada máquina (%APPDATA%\astro\Config\settings.json).
  devToolbar: {
    enabled: false
  }
});
