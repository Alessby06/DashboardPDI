// ===========================================================================
//  Padrón de Colaboradores - Punto de entrada de colaboradores.astro
// ===========================================================================

import '../core/legacy-globals.js';
import { arrancarComun, publicarRefresco } from '../core/Bootstrap.js';
import { ColaboradorModel } from '../models/ColaboradorModel.js';
import { ColaboradoresView } from '../views/ColaboradoresView.js';

let enlazado = false;

function enlazar() {
  if (enlazado) return;
  enlazado = true;
  ColaboradoresView.enlazarEventos();
}

function montar() {
  ColaboradoresView.render();
}

function iniciar() {
  if (!arrancarComun()) return;

  enlazar();
  montar();

  publicarRefresco(montar);
  console.log('[PDI] Red Territorial de Colaboradores lista (colaboradores.astro).');
}

document.addEventListener('astro:page-load', () => {
  if (document.body && document.body.getAttribute('data-page') === 'colaboradores') {
    iniciar();
  }
});

// Respaldo para carga estándar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body && document.body.getAttribute('data-page') === 'colaboradores') {
      iniciar();
    }
  });
} else {
  if (document.body && document.body.getAttribute('data-page') === 'colaboradores') {
    iniciar();
  }
}
