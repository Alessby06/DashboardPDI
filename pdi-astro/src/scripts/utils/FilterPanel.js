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
/** Durante la apertura se ignora el scroll que provoca el propio encaje. */
let aperturaHasta = 0;

/**
 * Navegador con anclaje CSS y Popover: el panel se coloca solo bajo el boton,
 * en el top layer, sin calculos de geometria ni correcciones por el transform
 * de Lenis. En el resto se mantiene el posicionamiento manual.
 */
const SOPORTA_ANCLA =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("anchor-name: --x") &&
  CSS.supports("position-anchor: --x");

/**
 * Popover API, detectada al margen del anclaje CSS. Antes solo se usaba el
 * popover si tambien habia anclaje, y los navegadores con popover pero sin
 * anchor segian colocando el panel a mano dentro del bloque contenedor que
 * crea el transform de Lenis: ahi venian el desfase, el recorte y el
 * parpadeo. Con popover solo, el panel ya vive en el top layer y ningun
 * ancestro lo descoloca ni lo recorta. El anclaje CSS decide como se coloca;
 * el popover, donde se pinta.
 */
const SOPORTA_POPOVER =
  typeof HTMLElement !== "undefined" &&
  typeof HTMLElement.prototype === "object" &&
  typeof HTMLElement.prototype.showPopover === "function";
const nuevoId = (base) => `fil-${base}-${++idSeq}`;

/** Separación entre el disparador y el panel, y margen con el borde. */
const HUECO_PANEL = 8;
const MARGEN_PANEL = 16;
/** Por debajo de este hueco, el panel se abre hacia arriba. */
const HUECO_MINIMO = 260;

/**
 * Decide si el panel cabe mejor debajo o encima del botón.
 * Antes siempre abría hacia abajo y, con el disparador en la mitad inferior,
 * el encabezado y el pie se comían el cuerpo: quedaban 0-74 px para los campos.
 */
function decidirDireccion(boton) {
  const r = boton.getBoundingClientRect();
  const abajo = window.innerHeight - r.bottom - HUECO_PANEL - MARGEN_PANEL;
  // Al abrir hacia arriba no se invade la barra superior: el panel se detiene
  // bajo el topbar (68 px en escritorio), que es el chrome persistente.
  const topbar = document.querySelector('.topbar');
  const techo = Math.max(MARGEN_PANEL, topbar ? topbar.getBoundingClientRect().bottom + HUECO_PANEL : 0);
  const arriba = r.top - HUECO_PANEL - techo;
  const usarArriba = abajo < HUECO_MINIMO && arriba > abajo;
  return { usarArriba, disponible: usarArriba ? arriba : abajo };
}

/**
 * Un elemento cuenta para el teclado solo si se ve. Los submenus cerrados
 * siguen en layout (visibility:hidden) y su offsetParent no es nulo: sin esta
 * comprobacion la trampa de foco calculaba mal el ultimo elemento y dejaba
 * escapar el Tab hacia la tabla.
 */
function esVisible(el) {
  if (!el || el.offsetParent === null) return false;
  // Las facetas cerradas siguen en el DOM para animar su altura; inert las
  // saca del foco y del arbol accesible.
  if (el.closest('[inert]')) return false;
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
      // El tipo se deduce del marcador que dibuja el campo: un círculo es
      // selección única (radio) y una casilla es multiselección (checkbox).
      // Antes todo se anunciaba como checkbox, incluso "Distrito" en sedes.
      const esRadio = !!item.parentElement?.querySelector('.padron-item-radio');
      item.setAttribute('role', esRadio ? 'radio' : 'checkbox');
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

/**
 * Los desplegables internos necesitan anunciar su estado. El panel exterior ya
 * lo hacía; las facetas no, y un lector de pantalla no sabía que se abrían.
 */
function prepararSubpaneles(panel) {
  panel.querySelectorAll('.padron-inner-dropdown').forEach((sub) => {
    const boton = sub.querySelector('.padron-inner-dropdown-btn');
    const menu = sub.querySelector('.padron-inner-dropdown-menu');
    if (!boton || !menu) return;

    if (!menu.id) menu.id = nuevoId('submenu');
    boton.setAttribute('aria-controls', menu.id);
    menu.setAttribute('role', menu.querySelector('.padron-item-radio') ? 'radiogroup' : 'group');

    const sincronizar = () => {
      const abierto = sub.classList.contains('open');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      menu.inert = !abierto;
    };
    sincronizar();
    if (!sub.dataset.filSub) {
      sub.dataset.filSub = '1';
      new MutationObserver(sincronizar).observe(sub, { attributes: true, attributeFilter: ['class'] });
      // El acordeon cambia la altura del cuerpo; la señal de desborde tiene
      // que reevaluarse al terminar la transicion, no solo al hacer scroll.
      const reveal = sub.querySelector('.padron-inner-dropdown-reveal');
      if (reveal) {
        reveal.addEventListener('transitionend', (ev) => {
          if (ev.target === reveal && ev.propertyName === 'grid-template-rows') {
            marcarDesborde(panel);
          }
        });
      }
    }
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

/** Avisa al panel si el cuerpo sigue por debajo, para pintar la señal. */
function marcarDesborde(panel) {
  const menu = panel.querySelector('.audit-filters-menu');
  const cuerpo = menu?.querySelector('.audit-filters-body');
  if (!menu || !cuerpo) return;
  const desborda = cuerpo.scrollHeight - cuerpo.scrollTop > cuerpo.clientHeight + 4;
  menu.dataset.scrollAbajo = desborda ? 'si' : 'no';
}

/**
 * El panel vive en una capa fija anclada al boton. Asi no participa del scroll
 * de la vista (Lenis lo mueve por codigo y `overflow:hidden` no lo detiene),
 * no lo recorta ningun ancestro y su altura no cambia al desplazarse: el
 * parpadeo venia de recalcular la altura en cada scroll.
 */
/**
 * Reancla un panel abierto sin cambiar su altura: solo mueve la caja bajo el
 * boton. Se usa al desplazar la vista con la barra de la seccion, para que el
 * panel no se cierre ni cambie de tamano.
 */
function seguirAlBoton(panel) {
  // En movil el panel es una hoja inferior anclada al borde: no se reancla.
  if (window.innerWidth <= 768) return;
  // Con anclaje CSS el panel sigue al boton solo: no hay nada que recolocar.
  if (SOPORTA_ANCLA) return;
  const menu = panel.querySelector('.audit-filters-menu');
  const boton = panel.querySelector('.audit-filter-btn');
  if (!menu || !boton) return;

  const r = boton.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) {
    window.closeAllFilterSheets?.();
    return;
  }

  const { usarArriba } = decidirDireccion(boton);
  menu.classList.toggle('is-above', usarArriba);
  menu.style.left = 'auto';
  menu.style.right = `${Math.round(window.innerWidth - r.right)}px`;
  if (usarArriba) {
    menu.style.top = 'auto';
    menu.style.bottom = `${Math.round(window.innerHeight - r.top + HUECO_PANEL)}px`;
  } else {
    menu.style.bottom = 'auto';
    menu.style.top = `${Math.round(r.bottom + HUECO_PANEL)}px`;
  }
  // Con popover en el top layer, position:fixed mide contra el viewport: no
  // hay desfase que corregir. Sin el, el transform de Lenis desplaza el panel
  // y hay que medir y ajustar.
  if (SOPORTA_POPOVER || usarArriba) return;
  const objetivo = Math.round(r.bottom + HUECO_PANEL);
  for (let i = 0; i < 2; i++) {
    const desfase = menu.getBoundingClientRect().top - objetivo;
    if (Math.abs(desfase) < 1) break;
    menu.style.top = `${Math.round(parseFloat(menu.style.top) - desfase)}px`;
  }
}

/** Muestra el panel en el top layer (solo escritorio; la hoja movil es fija). */
function abrirPopover(menu) {
  if (!SOPORTA_POPOVER || window.innerWidth <= 768) return;
  if (!menu.hasAttribute("popover")) menu.setAttribute("popover", "manual");
  if (!menu.matches(":popover-open")) {
    try { menu.showPopover(); } catch {}
  }
  // El click previo deja display:flex para poder mostrar el top layer antes de
  // la clase .open; ya con la clase, el CSS lo mantiene y el inline sobra.
  menu.style.removeProperty('display');
  menu.style.removeProperty('pointer-events');
}

/** Lo retira del top layer al cerrar. */
function cerrarPopover(menu) {
  if (!menu.hasAttribute("popover")) return;
  if (menu.matches(":popover-open")) {
    try { menu.hidePopover(); } catch {}
  }
}

function posicionarPanel(panel) {
  const menu = panel.querySelector('.audit-filters-menu');
  if (!menu) return;

  if (window.innerWidth <= 768) {
    menu.classList.remove('is-above');
    menu.style.removeProperty('top');
    menu.style.removeProperty('right');
    menu.style.removeProperty('left');
    menu.style.removeProperty('bottom');
    menu.style.removeProperty('max-height');
    return;
  }

  const boton = panel.querySelector('.audit-filter-btn');
  if (!boton) return;

  const r = boton.getBoundingClientRect();
  const { usarArriba, disponible } = decidirDireccion(boton);
  menu.classList.toggle('is-above', usarArriba);
  // La altura se recorta al hueco real del lado elegido; el resto se desplaza
  // dentro del panel. Nunca se deja la vista con un cuerpo de 0 px.
  menu.style.maxHeight = `${Math.max(90, Math.floor(disponible))}px`;

  // El CSS ancla el panel al boton y la clase .is-above decide el lado.
  if (SOPORTA_ANCLA) {
    menu.style.removeProperty('top');
    menu.style.removeProperty('right');
    menu.style.removeProperty('left');
    menu.style.removeProperty('bottom');
    return;
  }

  // Respaldo sin anclaje CSS.
  menu.style.left = 'auto';
  menu.style.right = `${Math.round(window.innerWidth - r.right)}px`;
  if (usarArriba) {
    menu.style.top = 'auto';
    menu.style.bottom = `${Math.round(window.innerHeight - r.top + HUECO_PANEL)}px`;
  } else {
    menu.style.bottom = 'auto';
    menu.style.top = `${Math.round(r.bottom + HUECO_PANEL)}px`;
  }

  // Sin popover, el transform de Lenis convierte al ancestro en bloque
  // contenedor de position:fixed y desplaza el panel: se mide y se ajusta.
  // En el top layer no hay desfase que corregir.
  if (SOPORTA_POPOVER || usarArriba) return;
  const objetivo = Math.round(r.bottom + HUECO_PANEL);
  for (let i = 0; i < 2; i++) {
    const desfase = menu.getBoundingClientRect().top - objetivo;
    if (Math.abs(desfase) < 1) break;
    menu.style.top = `${Math.round(parseFloat(menu.style.top) - desfase)}px`;
  }
}

/**
 * Los quitar de los chips llevan solo un svg; el nombre accesible sale del
 * texto de la propia píldora. Se le una sola vez, sin tocar el marcado de
 * cada vista.
 */
function nombrarQuitarChips() {
  document.querySelectorAll('.padron-chip').forEach((chip) => {
    const boton = chip.querySelector('.padron-chip-remove');
    if (!boton) return;
    const etiqueta = (chip.firstElementChild?.textContent || chip.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
    boton.setAttribute('aria-label', etiqueta ? `Quitar filtro: ${etiqueta}` : 'Quitar filtro');
  });
}

/**
 * Prepara el panel antes de que Dropdown le agregue `.open`: decide el lado y
 * lo muestra en el top layer. Mostrarlo despues movia la capa a mitad de la
 * transicion y dejaba un silencio de ~70 ms antes del despliegue.
 */
function prepararApertura(panel) {
  if (!panel || panel.classList.contains('open')) return;
  const boton = panel.querySelector('.audit-filter-btn');
  const menu = panel.querySelector('.audit-filters-menu');
  if (!boton || !menu || window.innerWidth <= 768) return;

  const { usarArriba } = decidirDireccion(boton);
  menu.classList.toggle('is-above', usarArriba);

  if (!SOPORTA_POPOVER) return;
  if (!menu.hasAttribute('popover')) menu.setAttribute('popover', 'manual');
  menu.style.display = 'flex';
  menu.style.pointerEvents = 'none';
  try { menu.showPopover(); } catch {}

  window.setTimeout(() => {
    if (!panel.classList.contains('open')) {
      cerrarPopover(menu);
      menu.style.removeProperty('display');
      menu.style.removeProperty('pointer-events');
    }
  }, 0);
}

/**
 * El asa de la hoja movil arrastra para cerrar: seguimiento 1:1, velo que
 * acompana y retorno elastico si el gesto no alcanza el umbral. Es el mismo
 * gesto que la ficha de sedes.
 */
function enlazarArrastreHoja(panel) {
  if (panel.dataset.filArrastre) return;
  panel.dataset.filArrastre = '1';
  // Con movimiento reducido el arrastre no se engancha: la hoja no se mueve y
  // la X y Escape siguen siendo el cierre. Un gesto sin seguimiento confunde.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const menu = panel.querySelector('.audit-filters-menu');
  const header = menu?.querySelector('.audit-filters-header');
  if (!menu || !header) return;

  const UMBRAL_PX = 75;
  const UMBRAL_VEL = 0.35;
  const VELO_RANGO = 280;
  const EASE_CIERRE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  const EASE_VUELTA = 'cubic-bezier(0.32, 0.72, 0, 1)';

  let startY = 0;
  let baseY = 0;
  let desplazamiento = 0;
  let arrastrando = false;
  let pointerId = null;
  let historial = [];
  let animacion = null;

  const esControl = (el) => !!el.closest?.('.btn-text-subtle, .btn-close-sheet');

  /** Desplazamiento visible actual: si la hoja venía entrando, el dedo debe
   * agarrarla donde está, no donde acabaría. */
  const transformActual = () => {
    const valor = getComputedStyle(menu).transform;
    if (!valor || valor === 'none') return 0;
    try { return new DOMMatrixReadOnly(valor).m42 || 0; } catch { return 0; }
  };

  const limpiarEstilos = () => {
    menu.style.removeProperty('transform');
    menu.style.removeProperty('transition');
    menu.style.removeProperty('will-change');
    panel.style.removeProperty('--filtro-velo');
  };

  const soltarCaptura = () => {
    if (pointerId === null) return;
    try { header.releasePointerCapture(pointerId); } catch { /* ya liberado */ }
    pointerId = null;
  };

  const detenerAnimacion = () => {
    if (!animacion) return;
    try { animacion.cancel(); } catch { /* ya terminó */ }
    animacion = null;
  };

  // Puntero y captura, como el resto de hojas: el gesto sigue al dedo aunque
  // salga de la cabecera y Android no lo interpreta como scroll de la hoja.
  header.addEventListener('pointerdown', (e) => {
    if (window.innerWidth > 768) return;
    if (esControl(e.target)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Si venía una animación (entrada o suelta anterior), se congela en el
    // punto exacto antes de cancelarla: sin esto la hoja saltaba al destino.
    const visible = transformActual();
    detenerAnimacion();
    baseY = Math.max(0, visible);
    startY = e.clientY;
    desplazamiento = 0;
    historial = [{ y: startY, t: performance.now() }];
    arrastrando = true;
    pointerId = e.pointerId;
    panel.classList.add('is-dragging');
    panel.style.setProperty('--filtro-velo', String(Math.max(0, 1 - baseY / VELO_RANGO)));
    // Se mueve en el compositor: sin esto, cada frame repinta la hoja entera.
    menu.style.willChange = 'transform';
    menu.style.transition = 'none';
    menu.style.transform = `translateY(${baseY}px)`;
    try { header.setPointerCapture(e.pointerId); } catch { /* el gesto sigue */ }
  });

  header.addEventListener('pointermove', (e) => {
    if (!arrastrando || e.pointerId !== pointerId) return;
    desplazamiento = e.clientY - startY;
    const total = Math.max(0, baseY + desplazamiento);

    menu.style.transform = `translateY(${total}px)`;
    panel.style.setProperty('--filtro-velo', String(Math.max(0, 1 - total / VELO_RANGO)));

    historial.push({ y: e.clientY, t: performance.now() });
    if (historial.length > 5) historial.shift();
  });

  const finalizar = (e) => {
    if (!arrastrando) return;
    if (e && e.pointerId !== undefined && e.pointerId !== pointerId) return;
    arrastrando = false;
    panel.classList.remove('is-dragging');
    soltarCaptura();

    const total = Math.max(0, baseY + desplazamiento);
    let velocidad = 0;
    if (historial.length >= 2) {
      const ultimo = historial[historial.length - 1];
      const primero = historial[0];
      const dt = ultimo.t - primero.t;
      if (dt > 0) velocidad = (ultimo.y - primero.y) / dt;
    }

    // Cierra por gesto, no por base: agarrar una hoja a medio entrar no debe
    // cerrarla solo porque aún no había llegado a su sitio.
    const cerrar = desplazamiento > UMBRAL_PX || velocidad > UMBRAL_VEL;
    const alto = menu.offsetHeight || menu.getBoundingClientRect().height || 1;
    const destino = cerrar ? alto : 0;
    const distancia = Math.abs(destino - total);
    const rapidez = Math.max(0.35, Math.abs(velocidad));
    const duracion = Math.round(Math.min(cerrar ? 320 : 260, Math.max(140, distancia / rapidez)));

    panel.style.setProperty('--filtro-velo', cerrar ? '0' : '1');

    // La suelta continúa el gesto: la duración sale de lo que queda por
    // recorrer y de la velocidad con la que soltó el dedo, no de un valor fijo.
    detenerAnimacion();
    animacion = menu.animate(
      [
        { transform: `translateY(${total}px)` },
        { transform: `translateY(${destino}px)` }
      ],
      { duration: duracion, easing: cerrar ? EASE_CIERRE : EASE_VUELTA, fill: 'forwards' }
    );

    let terminado = false;
    const terminar = () => {
      if (terminado) return;
      terminado = true;
      // Primero el estado (quita .open y resetea el botón), después los
      // estilos en línea: la hoja ya está en su sitio final.
      if (cerrar) window.closeAllFilterSheets?.();
      limpiarEstilos();
      detenerAnimacion();
    };

    animacion.finished.then(terminar, () => { /* interrumpida: la maneja el nuevo gesto */ });
    // Respaldo por si la pestaña se congela a mitad de la animación.
    window.setTimeout(() => { if (animacion) terminar(); }, duracion + 80);
  };

  header.addEventListener('pointerup', finalizar);
  header.addEventListener('pointercancel', finalizar);
  // Respaldo: si la captura falla y el dedo suelta fuera de la cabecera, el
  // gesto no puede quedarse a medio arrastre con la hoja desplazada.
  window.addEventListener('pointerup', finalizar);
  window.addEventListener('pointercancel', finalizar);
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
      aperturaHasta = Date.now() + 450;
      abrirPopover(menu);
      actualizarEtiqueta(panel);
      posicionarPanel(panel);
      marcarDesborde(panel);
      decorarEstadoVacio();
      const primero = menu.querySelector('.audit-filters-body :is(' + FOCALIZABLES + ')');
      const enfocar = () => (primero || menu).focus({ preventScroll: true });
      enfocar();
      // La entrada dura 220 ms; enfocar a los 180 hacia que el anillo de foco
      // viajara con el panel. A los 240 el panel ya esta quieto.
      setTimeout(enfocar, 240);
    } else if (panel.contains(document.activeElement)) {
      disparador.focus({ preventScroll: true });
    }
    if (!abierto) cerrarPopover(menu);
  }).observe(panel, { attributes: true, attributeFilter: ['class'] });

  menu.addEventListener('scroll', () => marcarDesborde(panel), { passive: true, capture: true });

  // Lenis escucha la rueda en el contenedor de la vista y se tragaba el
  // scroll del panel. Al cortar la propagacion, la rueda desplaza el cuerpo
  // del panel y no la pagina (que ademas bloquea el encadenamiento).
  menu.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });

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

  // Mientras la hoja esta abierta, cada repintado actualiza cifra, vacio y
  // los nombres accesibles de los chips, que se repintan con cada filtro.
  // 80 ms: la cifra acompana a la barra de chips (175 ms de entrada) en vez
  // de llegar 160 ms despues y dar un segundo golpe visual.
  const observador = new MutationObserver(() => {
    if (!panel.classList.contains('open')) return;
    clearTimeout(observador._t);
    observador._t = setTimeout(() => {
      actualizarEtiqueta(panel);
      marcarDesborde(panel);
      decorarEstadoVacio();
      nombrarQuitarChips();
    }, 80);
  });
  const main = document.getElementById('mainContent');
  if (main) observador.observe(main, { childList: true, subtree: true });

  // Si el panel ya estaba abierto cuando el modulo arranco (clic inmediato
  // tras la carga), el observador nunca vera el cambio: se aplican aqui las
  // mismas consecuencias de apertura.
  if (panel.classList.contains('open')) {
    aperturaHasta = Date.now() + 450;
    abrirPopover(menu);
    actualizarEtiqueta(panel);
    posicionarPanel(panel);
    const primero = menu.querySelector('.audit-filters-body :is(' + FOCALIZABLES + ')');
    setTimeout(() => (primero || menu).focus({ preventScroll: true }), 0);
  }
}

export function mejorarPanelesFiltro() {
  document.querySelectorAll('.audit-filters-dropdown').forEach(prepararPanel);
  document.querySelectorAll('.audit-filters-dropdown').forEach(prepararSubpaneles);
  document.querySelectorAll('.audit-filters-dropdown').forEach(enlazarArrastreHoja);
  document.querySelectorAll('.audit-filters-menu').forEach(prepararOpciones);
  nombrarQuitarChips();
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
  // La altura se fija al abrir (y al cambiar el contenido o el viewport). No
  // se recalcula con el scroll de la pagina: hacerlo redimensionaba el panel
  // mientras se desplazaba y producia el parpadeo de la parte superior.
  window.addEventListener('resize', () => {
    document.querySelectorAll('.audit-filters-dropdown.open').forEach((panel) => {
      posicionarPanel(panel);
      marcarDesborde(panel);
    });
  });

  // Al desplazar la vista (barra de la seccion, teclado o rueda fuera del
  // panel) el panel no se cierra: se reancla bajo el boton manteniendo su
  // altura. Solo se cierra si el disparador sale de la pantalla.
  let pedidoScroll = 0;
  document.addEventListener('scroll', (evento) => {
    const destino = evento.target;
    if (destino && destino.nodeType === 1 && destino.closest?.('.audit-filters-menu')) return;
    if (Date.now() < aperturaHasta) return;
    if (pedidoScroll) return;
    pedidoScroll = requestAnimationFrame(() => {
      pedidoScroll = 0;
      document.querySelectorAll('.audit-filters-dropdown.open').forEach(seguirAlBoton);
    });
  }, { capture: true, passive: true });
  window.PDI = window.PDI || {};
  window.PDI.FilterPanel = { mejorar: mejorarPanelesFiltro, contarResultados, prepararApertura };
}
