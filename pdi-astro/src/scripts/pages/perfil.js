// ===========================================================================
//  Página de perfil - punto de entrada de /perfil
// ===========================================================================
import { arrancarComun } from '../core/Bootstrap.js';
import { PerfilView } from '../views/PerfilView.js';

/**
 * Modo lectura de la ficha.
 *
 * El marcado trae los formularios y, al lado, una vista de lectura con los
 * mismos valores. Sin JavaScript los formularios se ven tal cual: no se pierde
 * nada. Con JavaScript, la ficha se lee y cada bloque se abre a pedido.
 */
let vistaArmada = false;

function montarVista() {
  if (vistaArmada || document.body?.getAttribute('data-page') !== 'perfil') return;
  vistaArmada = true;

  const sincronizar = () => {
    document.querySelectorAll('[data-lectura]').forEach((destino) => {
      const origen = document.getElementById(destino.dataset.lectura);
      const valor = (origen?.value || '').trim();
      destino.textContent = valor || '—';
    });
  };

  const alternar = (boton, destinoId, alAbrir) => {
    const destino = document.getElementById(destinoId);
    if (!destino) return;
    const abrir = destino.hidden;
    destino.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
    if (abrir && alAbrir) alAbrir(destino);
  };

  document.addEventListener('click', (e) => {
    const editar = e.target.closest('[data-editar]');
    if (editar) {
      const form = document.getElementById(editar.dataset.editar);
      if (!form) return;
      const abrir = form.hidden;
      form.hidden = !abrir;
      const lectura = document.querySelector(`[data-lectura-de="${editar.dataset.editar}"]`);
      if (lectura) lectura.hidden = abrir;
      editar.setAttribute('aria-expanded', String(abrir));
      editar.textContent = abrir ? 'Listo' : 'Editar';
      if (abrir) form.querySelector('input')?.focus({ preventScroll: true });
      else sincronizar();
      return;
    }

    const abrir = e.target.closest('[data-abrir]');
    if (abrir) {
      alternar(abrir, abrir.dataset.abrir, (destino) => {
        destino.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        destino.querySelector('input')?.focus({ preventScroll: true });
      });
    }
  });

  // Al guardar, la ficha refleja lo que quedó en los campos.
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'formPerfil' || e.target.id === 'formUsuario') {
      setTimeout(sincronizar, 120);
    }
  }, true);

  sincronizar();

  // La cuenta llega por red: cuando el nombre se pinta, se sincroniza la ficha.
  const nombre = document.getElementById('perfilNombre');
  if (nombre) {
    new MutationObserver(sincronizar).observe(nombre, { childList: true, characterData: true, subtree: true });
  }
}

function iniciar() {
  if (document.body?.getAttribute('data-page') !== 'perfil') return;
  if (!arrancarComun()) return;
  PerfilView.init();
  montarVista();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
document.addEventListener('astro:page-load', iniciar);
