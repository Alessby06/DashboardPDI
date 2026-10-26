// ===========================================================================
//  PANEL DE FILTROS - ACCESIBILIDAD, ESTADO Y CIERRE HONESTO
// ===========================================================================
//  El marcado de los siete paneles (.audit-filters-dropdown) se genero a mano
//  en cada pagina y quedo sin capa accesible: el disparador no anunciaba si el
//  panel estaba abierto, las etiquetas no estaban asociadas a su control, las
//  opciones eran <div onclick> sin foco, y el boton del pie decia "Aplicar
//  Filtros" cuando el filtrado ya ocurria en vivo.
//
//  Todo eso se resuelve aqui, una vez, sobre el DOM real y sin tocar el
//  marcado de cada vista. El modulo es idempotente: puede correr en cada
//  navegacion sin duplicar atributos ni escuchadores.
// ===========================================================================

const FOCALIZABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let idSeq = 0;
const nuevoId = (base) => `fil-${base}-${++idSeq}`;

/**
 * Un elemento cuenta para el teclado solo si se ve. Los submenus cerrados
 * siguen en layout (visibility:hidden) y su offsetParent no es nulo: sin esta
 * comprobacion la trampa de foco calculaba mal el ultimo elemento y dejaba
 * escapar el Tab hacia la tabla.
 */
function esVisible(el) {
  if (!el || el.offsetParent === null) return false;
  const cs = getComputedStyle(el);
  if (cs.visibility === 'hidden' || cs.display === 'none') return false;
  if (cs.pointerEvents === 'none') return false;
  return true;
}

/** Funcion que limpia los filtros de la pagina en curso, si la vista la expone. */
function limpiarFiltrosDePagina() {
  const pagina = document.body.dataset.page;
  const mapa = {
    auditoria: () => window.resetAuditFilters?.(),
    padron: () => window.resetPadronFilters?.(),
    salud: () => window.resetSaludFilters?.(),
    educativo: () => window.resetCasitasFilters?.(),
    voluntariados: () => window.resetVoluntariosFilters?.(),
    social: () => window.PDI?.SocialKanbanView?.clearFilters?.(),
    sedes: () => window.PDI?.SedesView?.resetFilters?.(),
  };
  const fn = mapa[pagina];
  return typeof fn === 'function' ? fn() : null;
}

/**
 * Total de coincidencias que anuncia el paginador de la vista. Es la unica
 * cifra honesta cuando hay paginacion: contar filas pintadas diria "20" con
 * doscientas coincidencias.
 */
function totalDeclarado() {
  const el = document.querySelector('[id$="PaginationInfo"], [data-total-registros]');
  if (!el) return null;
  const texto = el.getAttribute('data-total-registros') || el.textContent || '';
  const m = texto.match(/de\s+([\d.]+)/i);
  if (!m) return null;
  const n = Number(String(m[1]).replace(/\./g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Cuenta resultados visibles de la pagina. Devuelve null cuando la vista no
 * usa una estructura reconocible: mejor no ensenar cifra que ensenar una falsa.
 */
function contarResultados() {
  const main = document.getElementById('mainContent');
  if (!main) return null;

  // Mientras la vista pinta esqueletos no hay cifra honesta que dar. El
  // esqueleto se queda en el DOM despues de cargar: solo cuenta si se ve.
  const cargando = Array.from(main.querySelectorAll('.pdi-skeleton, [aria-busy="true"]')).some(esVisible);
  if (cargando) return null;

  const declarado = totalDeclarado();
  if (declarado !== null) return declarado;

  let filas = 0;
  let hayTabla = false;
  main.querySelectorAll('tbody tr').forEach((tr) => {
    if (tr.offsetParent === null) return;
    const celdas = tr.children;
    if (!celdas.length) return;
    if (celdas.length === 1 && Number(celdas[0].colSpan) > 1) return; // fila de vacio
    hayTabla = true;
    filas++;
  });
  if (hayTabla) return filas;

  const tarjetas = main.querySelectorAll(
    '.mobile-card-item, .kanban-card, .social-kanban-card, .sedes-master-item, .audit-user-card, .casita-card'
  );
  if (tarjetas.length) {
    return Array.from(tarjetas).filter((el) => el.offsetParent !== null).length;
  }
  return null;
}

function textoCifra(n) {
  if (n === null) {
    const main = document.getElementById('mainContent');
    const cargando = main && Array.from(main.querySelectorAll('.pdi-skeleton')).some(esVisible);
    return cargando ? 'Contando…' : '—';
  }
  if (n === 0) return 'Sin coincidencias';
  return `${n} ${n === 1 ? 'coincidencia' : 'coincidencias'}`;
}

/**
 * Anade "Limpiar filtros" al estado vacio visible, si la vista expone un reset.
 * Acepta tanto cajas con clase como la celda colspan que pintan padrón y
 * auditoría: antes solo miraba divs y el boton no llegaba a existir.
 */
function decorarEstadoVacio() {
  const pagina = document.body.dataset.page;
  if (!pagina) return;
  const candidatos = document.querySelectorAll(
    '#mainContent .dash-empty-state, #mainContent .sedes-empty-state, #mainContent .empty-state, #mainContent td[colspan], #mainContent .padron-empty-state'
  );
  candidatos.forEach((caja) => {
    if (caja.offsetParent === null) return;
    if (!/No se encontr|Sin resultados|No hay |Mostrando 0 de 0/i.test(caja.textContent || '')) return;
    if (caja.querySelector('.btn-clear-empty-filters')) return;
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn-clear-empty-filters';
    boton.textContent = 'Limpiar filtros';
    boton.addEventListener('click', () => {
      const resultado = limpiarFiltrosDePagina();
      if (resultado === null) {
        window.location.href = window.location.pathname;
      }
    });
    caja.appendChild(boton);
  });
}

function actualizarEtiqueta(panel) {
  const n = contarResultados();
  const boton = panel.querySelector('.btn-apply-filters');
  if (boton) {
    const texto = boton.querySelector('span');
    if (texto) texto.textContent = n === null ? 'Ver resultados' : `Ver resultados (${n})`;
    boton.setAttribute('aria-label', n === null
      ? 'Cerrar filtros y ver resultados'
      : `Cerrar filtros y ver ${textoCifra(n)}`);
  }
  const cifra = panel.querySelector('.filter-count');
  if (cifra) cifra.textContent = textoCifra(n);
}

function marcarOpcion(item) {
  const vacia = item.classList.contains('zero-facet');
  item.setAttribute('aria-checked', item.classList.contains('selected') ? 'true' : 'false');
  if (vacia) {
    item.setAttribute('aria-disabled', 'true');
    item.setAttribute('tabindex', '-1');
  } else {
    item.removeAttribute('aria-disabled');
    item.setAttribute('tabindex', '0');
  }
}

function prepararOpciones(menu) {
  menu.querySelectorAll('.padron-dropdown-item').forEach((item) => {
    if (!item.dataset.filOpcion) {
      item.dataset.filOpcion = '1';
      item.setAttribute('role', 'checkbox');
      item.addEventListener('click', () => marcarOpcion(item));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const hermanos = Array.from(item.parentElement.querySelectorAll('.padron-dropdown-item:not(.zero-facet)'));
          const i = hermanos.indexOf(item);
          const siguiente = hermanos[i + (e.key === 'ArrowDown' ? 1 : -1)];
          siguiente?.focus();
        }
      });
    }
    marcarOpcion(item);
    new MutationObserver(() => marcarOpcion(item)).observe(item, { attributes: true, attributeFilter: ['class'] });
  });
}

function prepararEtiquetas(panel) {
  panel.querySelectorAll('.audit-filter-field').forEach((campo) => {
    const etiqueta = campo.querySelector('.audit-field-label');
    if (!etiqueta) return;
    if (!etiqueta.id) etiqueta.id = nuevoId('label');
    const control = campo.querySelector('.padron-inner-dropdown-btn, input, select, textarea');
    if (!control) return;
    // Los campos con id se asocian de forma nativa; los botones, por referencia.
    if (control.id && /^(input|select|textarea)$/i.test(control.tagName)) {
      etiqueta.setAttribute('for', control.id);
    } else if (!control.getAttribute('aria-labelledby')) {
      control.setAttribute('aria-labelledby', etiqueta.id);
    }
  });
}

/** Ajusta el popover al hueco real bajo el boton. */
function ajustarAltura(panel) {
  if (window.innerWidth <= 768) {
    panel.querySelector('.audit-filters-menu')?.style.removeProperty('max-height');
    return;
  }
  const boton = panel.querySelector('.audit-filter-btn');
  const menu = panel.querySelector('.audit-filters-menu');
  if (!boton || !menu) return;

  const r = boton.getBoundingClientRect();
  const margen = 16;
  let abajo = window.innerHeight - r.bottom - margen;
  const arriba = r.top - margen;
  const quiere = 320;

  menu.style.top = '';
  menu.style.bottom = '';
  menu.style.maxHeight = '';

  if (abajo < quiere && arriba > abajo) {
    menu.style.top = 'auto';
    menu.style.bottom = 'calc(100% + 8px)';
    abajo = arriba;
  }
  menu.style.maxHeight = `${Math.max(200, Math.min(Math.floor(abajo), window.innerHeight - 32))}px`;
}

function prepararPanel(panel) {
  if (panel.dataset.filPreparado) return;
  panel.dataset.filPreparado = '1';

  const disparador = panel.querySelector('.audit-filter-btn');
  const menu = panel.querySelector('.audit-filters-menu');
  if (!disparador || !menu) return;

  if (!menu.id) menu.id = nuevoId('menu');
  disparador.setAttribute('aria-controls', menu.id);
  disparador.setAttribute('aria-haspopup', 'dialog');
  disparador.setAttribute('aria-expanded', panel.classList.contains('open') ? 'true' : 'false');

  menu.setAttribute('role', 'dialog');
  const titulo = menu.querySelector('.audit-filters-header-title');
  if (titulo) {
    if (!titulo.id) titulo.id = nuevoId('title');
    menu.setAttribute('aria-labelledby', titulo.id);
  } else {
    menu.setAttribute('aria-label', 'Filtros');
  }
  if (!menu.hasAttribute('tabindex')) menu.setAttribute('tabindex', '-1');
  // Cerrado, el panel no participa del orden de tabulacion ni del arbol.
  menu.inert = !panel.classList.contains('open');

  prepararEtiquetas(panel);
  prepararOpciones(menu);
  actualizarEtiqueta(panel);

  panel.addEventListener('change', () => actualizarEtiqueta(panel));
  panel.addEventListener('input', () => actualizarEtiqueta(panel));

  const pie = menu.querySelector('.audit-filters-footer');
  if (pie) {
    if (!pie.querySelector('.btn-clear-filters')) {
      const limpiar = document.createElement('button');
      limpiar.type = 'button';
      limpiar.className = 'btn-clear-filters';
      limpiar.textContent = 'Limpiar';
      limpiar.addEventListener('click', () => {
        limpiarFiltrosDePagina();
        actualizarEtiqueta(panel);
      });
      pie.insertBefore(limpiar, pie.firstChild);
    }
    if (!pie.querySelector('.filter-count')) {
      const cifra = document.createElement('span');
      cifra.className = 'filter-count';
      cifra.setAttribute('aria-live', 'polite');
      pie.insertBefore(cifra, pie.firstChild);
    }
    if (!pie.querySelector('.btn-close-filter')) {
      const cerrar = document.createElement('button');
      cerrar.type = 'button';
      cerrar.className = 'btn-text-subtle btn-close-filter';
      cerrar.textContent = 'Cerrar';
      cerrar.addEventListener('click', () => {
        window.closeAllFilterSheets?.();
        disparador.focus({ preventScroll: true });
      });
      pie.appendChild(cerrar);
    }
  }

  let eraAbierto = panel.classList.contains('open');
  new MutationObserver(() => {
    const abierto = panel.classList.contains('open');
    if (abierto === eraAbierto) return;
    eraAbierto = abierto;
    disparador.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    menu.setAttribute('aria-modal', abierto && window.innerWidth <= 768 ? 'true' : 'false');
    menu.inert = !abierto;

    if (abierto) {
      actualizarEtiqueta(panel);
      ajustarAltura(panel);
      decorarEstadoVacio();
      const primero = menu.querySelector('.audit-filters-body :is(' + FOCALIZABLES + ')');
      const enfocar = () => (primero || menu).focus({ preventScroll: true });
      enfocar();
      setTimeout(enfocar, 180);
    } else if (panel.contains(document.activeElement)) {
      disparador.focus({ preventScroll: true });
    }
  }).observe(panel, { attributes: true, attributeFilter: ['class'] });

  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !panel.classList.contains('open')) return;
    const focos = Array.from(menu.querySelectorAll(FOCALIZABLES)).filter(esVisible);
    if (!focos.length) return;
    const primero = focos[0];
    const ultimo = focos[focos.length - 1];
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === menu)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  });

  // Mientras la hoja esta abierta, cada repintado actualiza cifra y vacio.
  const observador = new MutationObserver(() => {
    if (!panel.classList.contains('open')) return;
    clearTimeout(observador._t);
    observador._t = setTimeout(() => {
      actualizarEtiqueta(panel);
      decorarEstadoVacio();
    }, 160);
  });
  const main = document.getElementById('mainContent');
  if (main) observador.observe(main, { childList: true, subtree: true });

  // Si el panel ya estaba abierto cuando el modulo arranco (clic inmediato
  // tras la carga), el observador nunca vera el cambio: se aplican aqui las
  // mismas consecuencias de apertura.
  if (panel.classList.contains('open')) {
    actualizarEtiqueta(panel);
    ajustarAltura(panel);
    const primero = menu.querySelector('.audit-filters-body :is(' + FOCALIZABLES + ')');
    setTimeout(() => (primero || menu).focus({ preventScroll: true }), 0);
  }
}

export function mejorarPanelesFiltro() {
  document.querySelectorAll('.audit-filters-dropdown').forEach(prepararPanel);
  document.querySelectorAll('.audit-filters-menu').forEach(prepararOpciones);
  decorarEstadoVacio();
}

if (typeof document !== 'undefined') {
  const iniciar = () => mejorarPanelesFiltro();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
  document.addEventListener('astro:page-load', iniciar);
  document.addEventListener('astro:after-swap', iniciar);
  window.addEventListener('resize', () => {
    document.querySelectorAll('.audit-filters-dropdown.open').forEach(ajustarAltura);
  });
  window.PDI = window.PDI || {};
  window.PDI.FilterPanel = { mejorar: mejorarPanelesFiltro, contarResultados };
}
