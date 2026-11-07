# Pruebas de extremo a extremo

Playwright prueba los flujos que no cubren las pruebas unitarias: login, roles,
auditoría, token clínico, validaciones del perfil y la página 404.

## Requisitos

- `pdi-astro/.env` con las credenciales de la base de cuentas (`CUENTAS_SECRETO`,
  `SURREAL_AUTH_*`). Las pruebas crean y borran tres cuentas temporales con
  prefijo `e2e-` (coordinación, promotora y administración); no tocan las
  cuentas reales.
- Microsoft Edge instalado. El proyecto usa `channel: 'msedge'` para no
  descargar un navegador aparte. Si no está, cambia el canal o ejecuta
  `npx playwright install chromium`.

## Ejecutar

```bash
npm run test:e2e
```

Por defecto se prueba el despliegue de producción
(`https://mvc-pdi.vercel.app`). Para otro despliegue:

```bash
$env:PLAYWRIGHT_BASE_URL = "https://mi-preview.vercel.app"; npm run test:e2e
```

Las cuentas temporales se crean en la base configurada y se eliminan al
terminar. No apuntes la suite a una base que no controlas.

## Por qué no se usa `astro dev`

El servidor de desarrollo de Astro entrega al middleware un request sin cuerpo
(`content-length` nulo), así que el login por API responde “Escribe tu usuario y
tu contraseña”. Las Functions de Vercel sí conservan el cuerpo y son las que se
prueban aquí. Queda pendiente un proxy de desarrollo que lea el cuerpo antes de
que Astro lo consuma.

## Archivos

- `login.spec.js`: tipografía local, ojo de contraseña, login correcto e incorrecto.
- `security.spec.js`: 401 sin sesión, 403 de auditoría para promotora, token clínico.
- `perfil.spec.js`: filtro de teléfono, correo, botones condicionados, MFA por rol.
- `cuentas.spec.js`: alta con clave temporal, primer ingreso, reinicio de clave, baja y acceso denegado por rol.
- `404.spec.js`: página propia con la ruta solicitada.
- `global-setup.js` / `global-teardown.js`: cuentas temporales y limpieza.
