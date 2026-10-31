// ===========================================================================
//  Selects nativos -> dropdown propio
// ===========================================================================
//  Mejora progresiva: el <select> original sigue en el DOM (con su id, name,
//  value, required y disabled), pero se oculta visualmente y se sustituye por
//  un botón + listbox con el lenguaje del sistema. Asi los formularios, los
//  getElementById(id).value y los onchange existentes siguen funcionando.
//
//  El menu se reconstruye al abrir, de modo que las opciones que llena el JS
//  (sedes, grados, tematicas...) aparecen sin volver a inicializar nada.
// ===========================================================================

import { iconHtml } from '../../data/iconos.js';

const MARCA = 'data-pdi-select';
const CLASE_WRAP = 'pdi-select';
const CLASE_ABIERTO = 'is-open';

const esMejorable = (select) => {
  if (!(select instanceof HTMLSelectElement)) return false;
  if (select.multiple) return false;
  if (select.size && select.size > 1) return false;
  if (select.dataset.pdiSelect === 'native') return false;
  return !select.hasAttribute(MARCA);
};

const etiquetaVisible = (select) => {
  const opcion = select.selectedOptions && select.selectedOptions[0];
  return opcion && opcion.textContent.trim() ? opcion.textContent.trim() : '';
};

const textoDeLabel = (select) => {
  if (!select.id) return '';
  const label = document.querySelector(`label[for="${CSS.escape(select.id)}"]`);
  return label ? label.textContent.trim() : '';
};

const crearTrigger = (select) => {
  const boton = document.createElement('button');
  boton.type = 'button';
  // No copiar `pdi-select-native`: es la clase que oculta al select original.
  const clases = [...select.classList].filter((clase) => clase !== 'pdi-select-native').join(' ');
  boton.className = `pdi-select-trigger ${clases}`.trim();
  boton.id = `${select.id || 'pdi-select'}-trigger`;
  boton.setAttribute('aria-haspopup', 'listbox');
  boton.setAttribute('aria-expanded', 'false');

  const ariaLabel = select.getAttribute('aria-label') || textoDeLabel(select);
  if (ariaLabel) boton.setAttribute('aria-label', ariaLabel);
  if (select.disabled) boton.disabled = true;

  // Conserva la geometria que el select tenia por estilo en linea.
  const estilo = select.getAttribute('style');
  if (estilo) {
    boton.style.cssText = estilo;
    boton.style.paddingRight = '32px';
  }

  const valor = document.createElement('span');
  valor.className = 'pdi-select-value';
  valor.textContent = etiquetaVisible(select) || 'Selecciona…';

  const caret = document.createElement('span');
  caret.className = 'pdi-select-caret';
  caret.setAttribute('aria-hidden', 'true');
  caret.innerHTML = iconHtml('nav.desplegar', { size: 12 });

  boton.append(valor, caret);
  return boton;
};

const construirMenu = (select, menu) => {
  menu.textContent = '';
  const opciones = [...select.options];
  opciones.forEach((opcion, indice) => {
    if (opcion.hidden) return;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'pdi-select-option';
    item.dataset.indice = String(indice);
    item.setAttribute('role', 'option');
    item.textContent = opcion.textContent.trim();
    item.disabled = opcion.disabled;
    item.setAttribute('aria-selected', indice === select.selectedIndex ? 'true' : 'false');
    item.addEventListener('click', () => elegir(select, indice));
    menu.append(item);
  });
};

const sincronizar = (select) => {
  const wrap = select.closest(`.${CLASE_WRAP}`);
  if (!wrap) return;
  const trigger = wrap.querySelector('.pdi-select-trigger');
  const valor = wrap.querySelector('.pdi-select-value');
  const menu = wrap.__pdiMenu;
  if (!trigger || !valor) return;

  trigger.disabled = select.disabled;
  valor.textContent = etiquetaVisible(select) || 'Selecciona…';

  if (menu) {
    menu.querySelectorAll('.pdi-select-option').forEach((item) => {
      const indice = Number(item.dataset.indice);
      const opcion = select.options[indice];
      if (!opcion) return;
      item.disabled = opcion.disabled;
      item.setAttribute('aria-selected', indice === select.selectedIndex ? 'true' : 'false');
    });
  }
};

const cerrar = (select) => {
  const wrap = select.closest(`.${CLASE_WRAP}`);
  if (!wrap) return;
  wrap.classList.remove(CLASE_ABIERTO);
  wrap.querySelector('.pdi-select-trigger')?.setAttribute('aria-expanded', 'false');
  wrap.__pdiMenu?.classList.remove('is-open');
};

const cerrarTodos = (excepto) => {
  document.querySelectorAll(`.${CLASE_WRAP}.${CLASE_ABIERTO}`).forEach((wrap) => {
    if (wrap === excepto) return;
    const select = wrap.querySelector('select');
    if (select) cerrar(select);
  });
};

/** Coloca el menú fijo junto al disparador, dentro del viewport. */
const posicionar = (wrap) => {
  const trigger = wrap.querySelector('.pdi-select-trigger');
  const menu = wrap.__pdiMenu;
  if (!trigger || !menu) return;

  const rect = trigger.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) {
    const select = wrap.querySelector('select');
    if (select) cerrar(select);
    return;
  }

  const margen = 6;
  const ancho = Math.min(rect.width, window.innerWidth - 16);
  const izquierda = Math.max(8, Math.min(rect.left, window.innerWidth - ancho - 8));
  menu.style.position = 'fixed';
  menu.style.left = `${izquierda}px`;
  menu.style.width = `${ancho}px`;
  menu.style.minWidth = `${ancho}px`;
  menu.style.maxHeight = `${Math.min(320, window.innerHeight * 0.6)}px`;
  menu.style.top = `${rect.bottom + margen}px`;
  menu.style.bottom = 'auto';

  const alto = menu.getBoundingClientRect().height;
  const cabeAbajo = rect.bottom + margen + alto <= window.innerHeight - 8;
  const cabeArriba = rect.top - margen - alto >= 8;
  if (!cabeAbajo && cabeArriba) {
    menu.style.top = `${rect.top - margen - alto}px`;
    menu.classList.add('pdi-select-menu--up');
  } else {
    menu.classList.remove('pdi-select-menu--up');
  }
};

const abrir = (select) => {
  const wrap = select.closest(`.${CLASE_WRAP}`);
  if (!wrap) return;
  const trigger = wrap.querySelector('.pdi-select-trigger');
  const menu = wrap.__pdiMenu;
  if (!trigger || !menu || trigger.disabled) return;

  cerrarTodos(wrap);
  construirMenu(select, menu);
  // El menú vive en <body> con position:fixed: ningún modal con overflow lo
  // recorta y no depende de transforms ni de contain de los ancestros.
  if (menu.parentElement !== document.body) document.body.appendChild(menu);
  menu.classList.add('is-open');
  wrap.classList.add(CLASE_ABIERTO);
  trigger.setAttribute('aria-expanded', 'true');
  posicionar(wrap);

  const activa = menu.querySelector('[aria-selected="true"]:not(:disabled)')
    || menu.querySelector('.pdi-select-option:not(:disabled)');
  activa?.focus();
};

const elegir = (select, indice) => {
  const opcion = select.options[indice];
  if (!opcion || opcion.disabled) return;
  select.selectedIndex = indice;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  sincronizar(select);
  cerrar(select);
  select.closest(`.${CLASE_WRAP}`)?.querySelector('.pdi-select-trigger')?.focus();
};

const tecladoMenu = (evento, select) => {
  const menu = evento.currentTarget;
  const items = [...menu.querySelectorAll('.pdi-select-option:not(:disabled)')];
  if (!items.length) return;
  const indice = items.indexOf(document.activeElement);

  if (evento.key === 'ArrowDown') {
    evento.preventDefault();
    items[Math.min(indice + 1, items.length - 1)]?.focus();
  } else if (evento.key === 'ArrowUp') {
    evento.preventDefault();
    items[Math.max(indice - 1, 0)]?.focus();
  } else if (evento.key === 'Home') {
    evento.preventDefault();
    items[0]?.focus();
  } else if (evento.key === 'End') {
    evento.preventDefault();
    items[items.length - 1]?.focus();
  } else if (evento.key === 'Escape') {
    evento.preventDefault();
    cerrar(select);
    select.closest(`.${CLASE_WRAP}`)?.querySelector('.pdi-select-trigger')?.focus();
  } else if (evento.key === 'Tab') {
    evento.preventDefault();
    cerrar(select);
    select.closest(`.${CLASE_WRAP}`)?.querySelector('.pdi-select-trigger')?.focus();
  }
};

const mejorar = (select) => {
  if (!esMejorable(select)) return;
  select.setAttribute(MARCA, '1');

  const wrap = document.createElement('span');
  wrap.className = CLASE_WRAP;
  const full = select.classList.contains('form-control')
    || /width\s*:\s*100%/i.test(select.getAttribute('style') || '');
  if (full) wrap.classList.add('pdi-select--full');

  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add('pdi-select-native');
  select.setAttribute('tabindex', '-1');
  select.setAttribute('aria-hidden', 'true');

  const trigger = crearTrigger(select);
  const menu = document.createElement('div');
  menu.className = 'pdi-select-menu';
  menu.id = `${select.id || 'pdi-select'}-menu`;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-labelledby', trigger.id);
  trigger.setAttribute('aria-controls', menu.id);

  wrap.append(trigger);
  wrap.__pdiMenu = menu;
  wrap.__pdiSelect = select;
  construirMenu(select, menu);

  trigger.addEventListener('click', () => {
    if (wrap.classList.contains(CLASE_ABIERTO)) cerrar(select);
    else abrir(select);
  });

  trigger.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp' || evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      abrir(select);
    }
  });

  menu.addEventListener('keydown', (evento) => tecladoMenu(evento, select));

  // Los cambios programaticos (select.value = x) tambien actualizan el boton.
  const proto = HTMLSelectElement.prototype;
  const descValor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descValor && !select.__pdiValorParcheado) {
    Object.defineProperty(select, 'value', {
      configurable: true,
      get() { return descValor.get.call(this); },
      set(nuevo) {
        descValor.set.call(this, nuevo);
        sincronizar(this);
      },
    });
    select.__pdiValorParcheado = true;
  }
  const descIndice = Object.getOwnPropertyDescriptor(proto, 'selectedIndex');
  if (descIndice && !select.__pdiIndiceParcheado) {
    Object.defineProperty(select, 'selectedIndex', {
      configurable: true,
      get() { return descIndice.get.call(this); },
      set(nuevo) {
        descIndice.set.call(this, nuevo);
        sincronizar(this);
      },
    });
    select.__pdiIndiceParcheado = true;
  }

  select.addEventListener('change', () => sincronizar(select));

  // Opciones y estados que cambian por JS.
  const observador = new MutationObserver(() => {
    construirMenu(select, menu);
    sincronizar(select);
  });
  observador.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'required'] });
};

const init = () => {
  document.querySelectorAll('select').forEach(mejorar);
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('astro:page-load', init);

  // Selects creados despues (modales, tablas, formularios dinamicos).
  const observadorDocumento = new MutationObserver((mutaciones) => {
    mutaciones.forEach((mutacion) => {
      mutacion.addedNodes.forEach((nodo) => {
        if (!(nodo instanceof Element)) return;
        if (nodo.matches?.('select')) mejorar(nodo);
        nodo.querySelectorAll?.('select').forEach(mejorar);
      });
    });
  });
  observadorDocumento.observe(document.documentElement, { childList: true, subtree: true });

  // Clic fuera: cierra el menu abierto.
  document.addEventListener('click', (evento) => {
    document.querySelectorAll(`.${CLASE_WRAP}.${CLASE_ABIERTO}`).forEach((wrap) => {
      if (wrap.contains(evento.target) || wrap.__pdiMenu?.contains(evento.target)) return;
      const select = wrap.querySelector('select');
      if (select) cerrar(select);
    });
  });

  // El menu es fijo: al hacer scroll o cambiar el tamaño se recoloca.
  const reposicionar = () => {
    const wrap = document.querySelector(`.${CLASE_WRAP}.${CLASE_ABIERTO}`);
    if (wrap) posicionar(wrap);
  };
  window.addEventListener('scroll', reposicionar, true);
  window.addEventListener('resize', reposicionar);

  // Esc cierra el menú abierto aunque el foco se haya ido a otro sitio.
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    document.querySelectorAll(`.${CLASE_WRAP}.${CLASE_ABIERTO}`).forEach((wrap) => {
      const select = wrap.querySelector('select');
      if (select) cerrar(select);
    });
  });

  // Un label[for] abre el trigger del select mejorado.
  document.addEventListener('click', (evento) => {
    const label = evento.target.closest?.('label[for]');
    if (!label) return;
    const select = document.getElementById(label.getAttribute('for'));
    if (!select || !select.hasAttribute(MARCA)) return;
    const wrap = select.closest(`.${CLASE_WRAP}`);
    const trigger = wrap?.querySelector('.pdi-select-trigger');
    if (!trigger || trigger.disabled) return;
    evento.preventDefault();
    trigger.focus();
    abrir(select);
  });

  // Validacion nativa: el select oculto sigue siendo el valido.
  document.addEventListener('invalid', (evento) => {
    const select = evento.target;
    if (!(select instanceof HTMLSelectElement) || !select.hasAttribute(MARCA)) return;
    const wrap = select.closest(`.${CLASE_WRAP}`);
    wrap?.classList.add('is-invalid');
    wrap?.querySelector('.pdi-select-trigger')?.focus();
  }, true);

  document.addEventListener('change', (evento) => {
    const select = evento.target;
    if (!(select instanceof HTMLSelectElement) || !select.hasAttribute(MARCA)) return;
    select.closest(`.${CLASE_WRAP}`)?.classList.remove('is-invalid');
  }, true);
}
