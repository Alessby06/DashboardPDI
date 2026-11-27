import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('modalColaborador vive en GlobalModals.astro fuera de .content-viewport', () => {
  const rutaGlobalModals = path.join(process.cwd(), 'src/components/GlobalModals.astro');
  const rutaColaboradores = path.join(process.cwd(), 'src/pages/colaboradores.astro');

  const contenidoGlobal = fs.readFileSync(rutaGlobalModals, 'utf-8');
  const contenidoColab = fs.readFileSync(rutaColaboradores, 'utf-8');

  // Debe estar en GlobalModals.astro para no ser atrapado por contain: layout de .content-viewport
  assert.ok(
    contenidoGlobal.includes('id="modalColaborador"'),
    'GlobalModals.astro debe contener el modalColaborador a nivel raíz'
  );

  // No debe estar duplicado dentro de la página colaboradores.astro
  assert.ok(
    !contenidoColab.includes('id="modalColaborador"'),
    'colaboradores.astro no debe contener id="modalColaborador" dentro del mainContent'
  );
});

test('backdrop tiene desenfoque y transición completa en views-comun.css', () => {
  const rutaCss = path.join(process.cwd(), 'src/styles/views-comun.css');
  const contenidoCss = fs.readFileSync(rutaCss, 'utf-8');

  assert.ok(
    contenidoCss.includes('backdrop-filter: blur(4px)') || contenidoCss.includes('backdrop-filter: blur(3px)'),
    'views-comun.css debe declarar backdrop-filter con desenfoque en el telón abierto'
  );
  assert.ok(
    contenidoCss.includes('backdrop-filter var(--dur-norm)'),
    'views-comun.css debe declarar transición suave para backdrop-filter'
  );
});
