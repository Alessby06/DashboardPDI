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
  // Dev toolbar deshabilitada a nivel de proyecto: tiene prioridad sobre la
  // preferencia global de cada máquina (%APPDATA%\astro\Config\settings.json).
  devToolbar: {
    enabled: false
  }
});
