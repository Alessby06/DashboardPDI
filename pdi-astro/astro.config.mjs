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
    },
  },

  // Dev toolbar deshabilitada a nivel de proyecto: tiene prioridad sobre la
  // preferencia global de cada máquina (%APPDATA%\astro\Config\settings.json).
  devToolbar: {
    enabled: false
  }
});
