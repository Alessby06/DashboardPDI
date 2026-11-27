import { attrsDe } from '../core/inlineCall.js';
import { prepararFilas, animarFilas, pintarTarjetas } from '../utils/FlipTabla.js';
// Vista: Padrón y Directorio de Colaboradores e Instituciones Aliadas (PDI)
// Asociación Cultural y Educativa Johannes Gutenberg - Lima Norte

import { ColaboradorModel, clasificarCategoria, CATEGORIAS_COLABORADOR, validarDatosColaborador, TIPOS_COLABORADOR } from '../models/ColaboradorModel.js';
import { filtrarColaboradores, ordenarColaboradores, contarFacetasColaboradores } from '../utils/filtrosColaboradores.js';
import { ToastView } from './ToastView.js';
import { AuditModel } from '../models/AuditModel.js';
import { escapar } from '../utils/HtmlHelper.js';
import { confirmar } from '../ui/confirmacion.js';
import { initSortMenu } from '../ui/SortMenu.js';
import { iconHtml } from '../../data/iconos.js';

let busquedaActual = '';
let categoriaTabActual = 'colegios';
let filtroDistritoActual = '';
let filtroEstrategiaActual = '';
let filtroRolActual = '';
let incluirInactivos = false;
let ordenActual = 'apellido-asc';
let listenersEnlazados = false;

function quitarDiacriticos(str) {
  return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function esCelularValido(num) {
  const limpio = String(num || '').replace(/\D/g, '');
  return limpio.length === 9 && limpio.startsWith('9');
}

export const ColaboradoresView = {
  init() {
    this.enlazarEventos();
    this.actualizarDatalistSedes();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('categoria');
      if (tabParam && ['colegios', 'iglesias', 'pdi'].includes(tabParam)) {
        categoriaTabActual = tabParam;
      }

      const qSede = params.get('sede') || params.get('buscar') || '';
      if (qSede) {
        const input = document.getElementById('inputColabSearch');
        if (input) input.value = qSede;
        busquedaActual = qSede.trim();
        const clearBtn = document.getElementById('btnColabSearchClear');
        if (clearBtn) clearBtn.style.display = 'flex';

        // Auto-seleccionar la pestaña adecuada según los colaboradores de esa sede
        const todos = ColaboradorModel.getAll();
        const qNorm = quitarDiacriticos(busquedaActual);

        // Si la pestaña actual no tiene matches para esta sede, buscar la primera categoría que sí tenga
        const tieneEnActual = todos.some(c => {
          const cat = c.categoria || clasificarCategoria(c.tipoColaborador);
          const s = quitarDiacriticos(c.sedeInstitucion);
          return cat === categoriaTabActual && (s.includes(qNorm) || qNorm.includes(s));
        });

        if (!tieneEnActual) {
          const match = todos.find(c => {
            const s = quitarDiacriticos(c.sedeInstitucion);
            return s.includes(qNorm) || qNorm.includes(s);
          });
          if (match && (match.categoria || clasificarCategoria(match.tipoColaborador))) {
            categoriaTabActual = match.categoria || clasificarCategoria(match.tipoColaborador);
          }
        }
      }
    }
    this.render();
  },

  sincronizarPestañas() {
    const tabs = [
      { id: 'tabBtnColabColegios', cat: 'colegios' },
      { id: 'tabBtnColabIglesias', cat: 'iglesias' },
      { id: 'tabBtnColabPDI', cat: 'pdi' }
    ];

    tabs.forEach(({ id, cat: c }) => {
      const btn = document.getElementById(id);
      if (btn) {
        const activo = c === categoriaTabActual;
        btn.classList.toggle('active', activo);
        btn.setAttribute('aria-selected', activo ? 'true' : 'false');
      }
    });

    const titleEl = document.getElementById('colaboradoresHeaderTitle');
    if (titleEl) {
      if (categoriaTabActual === 'colegios') titleEl.textContent = 'Directorio de Colegios Aliados (I.E.)';
      else if (categoriaTabActual === 'iglesias') titleEl.textContent = 'Directorio de Iglesias y Puntos Pastorales';
      else titleEl.textContent = 'Equipo Técnico y Facilitadoras PDI';
    }
  },

  enlazarEventos() {
    // Delegación limpia en el contenedor de pestañas para máxima robustez
    const tabContainer = document.querySelector('.colab-view-tabs');
    if (tabContainer) {
      tabContainer.onclick = (e) => {
        const btn = e.target.closest('[data-categoria]');
        if (btn) {
          e.preventDefault();
          const cat = btn.getAttribute('data-categoria');
          if (cat) this.setTabCategoria(cat);
        }
      };
    }

    // Tabs de categoría (enlace directo adicional de respaldo)
    const tabs = [
      { id: 'tabBtnColabColegios', cat: 'colegios' },
      { id: 'tabBtnColabIglesias', cat: 'iglesias' },
      { id: 'tabBtnColabPDI', cat: 'pdi' }
    ];

    tabs.forEach(({ id, cat }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = (e) => {
          e.preventDefault();
          this.setTabCategoria(cat);
        };
      }
    });

    // Toggle de campos de colegio según el rol en el modal
    const selectTipo = document.getElementById('colabTipo');
    if (selectTipo) {
      selectTipo.onchange = () => {
        this.actualizarCamposContextualesModal(selectTipo.value);
      };
    }

    // Autocompletar distrito al seleccionar o escribir sede en el modal
    const inputSede = document.getElementById('colabSede');
    const selectDistrito = document.getElementById('colabDistrito');
    if (inputSede && selectDistrito) {
      const mapeoSedesDistrito = {
        'año nuevo': 'Comas',
        'ano nuevo': 'Comas',
        'carmen alto': 'Comas',
        'la libertad': 'Comas',
        'el progreso': 'Carabayllo',
        'los bendecidos': 'Carabayllo',
        'san pedro': 'Carabayllo',
        'santa rosa': 'Carabayllo',
        'el agustino': 'El Agustino'
      };
      const autoSyncDistrito = () => {
        const val = inputSede.value.toLowerCase().trim();
        for (const [sNombre, dist] of Object.entries(mapeoSedesDistrito)) {
          if (val.includes(sNombre)) {
            selectDistrito.value = dist;
            break;
          }
        }
      };
      inputSede.oninput = autoSyncDistrito;
      inputSede.onchange = autoSyncDistrito;
    }

    // Submit del formulario
    const form = document.getElementById('formColaborador');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.guardar();
      };
    }

    // Cerrar drawer al hacer clic fuera de la caja o presionar Escape
    const modalEl = document.getElementById('modalColaborador');
    if (modalEl && !modalEl._pdiDrawerBound) {
      modalEl._pdiDrawerBound = true;
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          this.cerrarModal();
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalEl.classList.contains('open')) {
          this.cerrarModal();
        }
      });
    }

    // Re-renderizar si la capa de datos sincroniza con la nube (listener global único)
    if (!listenersEnlazados) {
      listenersEnlazados = true;
      document.addEventListener('pdi:datos-actualizados', () => {
        this.render();
      });
    }
  },

  setTabCategoria(cat) {
    categoriaTabActual = cat;
    filtroRolActual = '';
    this.sincronizarPestañas();
    this.aplicarFiltrosYOrden();
  },

  render() {
    const todos = ColaboradorModel.getAll();
    this.sincronizarPestañas();
    this._initSort();
    this.renderStats(todos);
    this.aplicarFiltrosYOrden();
  },

  /**
   * El menú de orden es el componente compartido de las tablas. Esta vista
   * dibujaba el marcado pero no llamaba a su controlador: el botón abría el
   * `aria-haspopup` sin listener, no desplegaba y el caret no giraba.
   */
  _initSort() {
    this._sortMenu = initSortMenu({
      id: 'colabSort',
      onSelect: (valor) => this.sort(valor),
    });
    this._sortMenu?.sync(ordenActual);
  },

  renderStats(datos) {
    const totalEl = document.getElementById('statColabTotal');
    const colegiosEl = document.getElementById('statColabColegios');
    const iglesiasEl = document.getElementById('statColabIglesias');
    const pdiEl = document.getElementById('statColabPDI');
    const comasEl = document.getElementById('statColabComas');
    const carabaylloEl = document.getElementById('statColabCarabayllo');
    const agustinoEl = document.getElementById('statColabAgustino');

    const badgeCol = document.getElementById('badgeCountColegios');
    const badgeIgl = document.getElementById('badgeCountIglesias');
    const badgePdi = document.getElementById('badgeCountPDI');

    const total = datos.length;
    const activos = datos.filter(c => c.estado === 'Activo').length;

    const colegios = datos.filter(c => (c.categoria || clasificarCategoria(c.tipoColaborador)) === 'colegios').length;
    const iglesias = datos.filter(c => (c.categoria || clasificarCategoria(c.tipoColaborador)) === 'iglesias').length;
    const pdi = datos.filter(c => (c.categoria || clasificarCategoria(c.tipoColaborador)) === 'pdi').length;

    // Los badges de pestaña acompañan a la lista, que por defecto solo muestra
    // activos; las tarjetas de cobertura conservan el total.
    const activosDe = (cat) => datos.filter(c =>
      (c.categoria || clasificarCategoria(c.tipoColaborador)) === cat && c.estado === 'Activo'
    ).length;

    const enComas = datos.filter(c => c.distrito === 'Comas').length;
    const enCarabayllo = datos.filter(c => c.distrito === 'Carabayllo').length;
    const enAgustino = datos.filter(c => c.distrito === 'El Agustino').length;

    if (totalEl) totalEl.textContent = `${activos} activos / ${total} total`;
    if (colegiosEl) colegiosEl.textContent = colegios;
    if (iglesiasEl) iglesiasEl.textContent = iglesias;
    if (pdiEl) pdiEl.textContent = pdi;

    if (badgeCol) badgeCol.textContent = activosDe('colegios');
    if (badgeIgl) badgeIgl.textContent = activosDe('iglesias');
    if (badgePdi) badgePdi.textContent = activosDe('pdi');

    if (comasEl) comasEl.textContent = enComas;
    if (carabaylloEl) carabaylloEl.textContent = enCarabayllo;
    if (agustinoEl) agustinoEl.textContent = enAgustino;
  },

  aplicarFiltrosYOrden() {
    const normalizados = ColaboradorModel.getAll().map((c) => ({
      ...c,
      categoria: c.categoria || clasificarCategoria(c.tipoColaborador),
    }));

    let res = filtrarColaboradores(normalizados, {
      categoria: categoriaTabActual,
      q: busquedaActual,
      distrito: filtroDistritoActual,
      estrategia: filtroEstrategiaActual,
      rol: filtroRolActual,
      incluirInactivos,
    });

    res = ordenarColaboradores(res, ordenActual);

    this.renderChipsActivos();
    this.actualizarFacetas();
    this.renderTable(res);
    this.renderMobileCards(res);
  },

  actualizarFacetas() {
    const todos = ColaboradorModel.getAll().map((c) => ({
      ...c,
      categoria: c.categoria || clasificarCategoria(c.tipoColaborador),
    }));
    const deCategoria = todos.filter(c => c.categoria === categoriaTabActual);

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = `(${count})`;
        el.classList.toggle('is-zero', count === 0);
        const item = el.closest('.padron-dropdown-item');
        if (item && item.getAttribute('data-value') !== 'all') {
          item.classList.toggle('zero-facet', count === 0);
        }
      }
    };

    // 1. Facetas de Distrito: se cuentan sin la propia faceta, con rol,
    // búsqueda, programa e inactivos aplicados.
    const facetas = contarFacetasColaboradores(deCategoria, {
      categoria: categoriaTabActual,
      q: busquedaActual,
      distrito: filtroDistritoActual,
      estrategia: filtroEstrategiaActual,
      rol: filtroRolActual,
      incluirInactivos,
    });
    setBadge('countFacetColabDistrito-all', facetas.totalDistrito);
    ['Comas', 'Carabayllo', 'El Agustino'].forEach(dist => {
      setBadge(`countFacetColabDistrito-${dist}`, facetas.porDistrito[dist] || 0);
    });

    // 2. Facetas de Estrategia
    setBadge('countFacetColabEstrategia-all', facetas.totalEstrategia);
    const estrategias = [
      'Desayuno Infantil',
      'Casita del Saber',
      'Buen Trato en Familia (BTF)',
      'Juntos Aprendemos en Cristo (JAC)',
      'Repostería',
      'Área Social Pastoral'
    ];
    estrategias.forEach(est => {
      setBadge(`countFacetColabEstrategia-${est}`, facetas.porEstrategia[est] || 0);
    });

    // 3. Facetas de Rol: el total es la base sin rol.
    setBadge('countFacetColabRol-all', facetas.total);
    TIPOS_COLABORADOR.forEach((rol) => {
      setBadge(`countFacetColabRol-${rol}`, facetas.porRol[rol] || 0);
    });
  },

  renderChipsActivos() {
    const bar = document.getElementById('colabActiveChipsBar');
    const list = document.getElementById('colabActiveChipsList');
    const contador = document.getElementById('colabActiveFiltersCount');
    const trigger = document.getElementById('btnDropdownColabFilterPanel');

    const chips = [];
    if (filtroDistritoActual) {
      chips.push({ tipo: 'distrito', label: `Distrito: ${filtroDistritoActual}` });
    }
    if (filtroEstrategiaActual) {
      chips.push({ tipo: 'estrategia', label: `Programa: ${filtroEstrategiaActual}` });
    }
    if (filtroRolActual) {
      chips.push({ tipo: 'rol', label: `Rol: ${filtroRolActual}` });
    }
    if (incluirInactivos) {
      chips.push({ tipo: 'inactivos', label: 'Incluye inactivos' });
    }

    const activeCount = chips.length;

    if (contador) {
      if (activeCount > 0) {
        contador.textContent = activeCount;
        contador.style.display = 'inline-flex';
      } else {
        contador.style.display = 'none';
      }
    }

    if (trigger) {
      trigger.classList.toggle('has-filters', activeCount > 0);
    }

    // Sincronizar etiquetas de desplegables
    const labelDistrito = document.getElementById('labelColabDistritoSelect');
    if (labelDistrito) {
      labelDistrito.textContent = filtroDistritoActual || 'Todos los Distritos';
    }
    const labelEstrategia = document.getElementById('labelColabEstrategiaSelect');
    if (labelEstrategia) {
      labelEstrategia.textContent = filtroEstrategiaActual || 'Todos los Programas';
    }
    const labelRol = document.getElementById('labelColabRolSelect');
    if (labelRol) {
      labelRol.textContent = filtroRolActual || 'Todos los Roles';
    }
    const chkInactivos = document.getElementById('chkColabInactivos');
    if (chkInactivos) chkInactivos.checked = incluirInactivos;

    // Sincronizar clase .selected en ítems de desplegable
    const distritoItems = document.querySelectorAll('#menuColabDistrito .padron-dropdown-item');
    distritoItems.forEach(item => {
      const val = item.getAttribute('data-value') || '';
      const isSelected = (!filtroDistritoActual && val === 'all') || (val === filtroDistritoActual);
      item.classList.toggle('selected', isSelected);
    });

    const estrategiaItems = document.querySelectorAll('#menuColabEstrategia .padron-dropdown-item');
    estrategiaItems.forEach(item => {
      const val = item.getAttribute('data-value') || '';
      const isSelected = (!filtroEstrategiaActual && val === 'all') || (val === filtroEstrategiaActual);
      item.classList.toggle('selected', isSelected);
    });

    const rolItems = document.querySelectorAll('#menuColabRol .padron-dropdown-item');
    rolItems.forEach(item => {
      const val = item.getAttribute('data-value') || '';
      const isSelected = (!filtroRolActual && val === 'all') || (val === filtroRolActual);
      item.classList.toggle('selected', isSelected);
    });

    if (!bar || !list) return;

    if (chips.length === 0) {
      bar.classList.remove('is-visible');
      bar.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    bar.classList.add('is-visible');
    bar.style.display = 'flex';
    list.innerHTML = chips.map(c => `
      <span class="padron-filter-chip">
        <span>${escapar(c.label)}</span>
        <button type="button" class="padron-chip-remove" ${attrsDe(`window.removeColabFilterChip('${c.tipo}')`)} title="Quitar filtro">×</button>
      </span>
    `).join('');
  },

  renderTable(datos) {
    const tbody = document.getElementById('tbodyColaboradores');
    const emptyState = document.getElementById('emptyColaboradores');
    const emptyTitle = document.getElementById('emptyColaboradoresTitle');
    const emptyText = document.getElementById('emptyColaboradoresText');
    const emptyActions = document.getElementById('emptyColaboradoresActions');
    const counterEl = document.getElementById('colaboradoresCount');

    if (counterEl) {
      counterEl.textContent = `${datos.length} registros`;
    }

    if (!tbody) return;

    const flip = prepararFilas(tbody);

    if (!datos || datos.length === 0) {
      tbody.innerHTML = '';
      animarFilas(tbody, flip);
      if (emptyState) {
        emptyState.style.display = 'block';
        const tieneFiltros = Boolean(busquedaActual || filtroDistritoActual || filtroEstrategiaActual);
        if (tieneFiltros) {
          if (emptyTitle) emptyTitle.textContent = 'Sin resultados para los filtros aplicados';
          if (emptyText) {
            const detalles = [];
            if (busquedaActual) detalles.push(`búsqueda "${busquedaActual}"`);
            if (filtroDistritoActual) detalles.push(`distrito "${filtroDistritoActual}"`);
            if (filtroEstrategiaActual) detalles.push(`programa "${filtroEstrategiaActual}"`);
            emptyText.textContent = `No se encontraron colaboradores coincidentes con ${detalles.join(', ')} en esta categoría.`;
          }
          if (emptyActions) {
            emptyActions.innerHTML = `
              <button type="button" class="btn btn-secondary btn-sm" ${attrsDe('window.resetColabFilters()')}>
                Limpiar búsqueda y filtros
              </button>
            `;
          }
        } else {
          if (emptyTitle) emptyTitle.textContent = 'No hay colaboradores en esta categoría';
          if (emptyText) emptyText.textContent = 'Aún no se han registrado colaboradores o instituciones para esta pestaña.';
          if (emptyActions) {
            emptyActions.innerHTML = `
              <button type="button" class="btn btn-primary btn-sm" ${attrsDe('window.openNuevoColaborador()')}>
                + Registrar Colaborador
              </button>
            `;
          }
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = datos.map(c => {
      const iniciales = `${(c.nombres || '')[0] || ''}${(c.apellidos || '')[0] || ''}`.toUpperCase();
      const cat = c.categoria || clasificarCategoria(c.tipoColaborador);

      let chipClase = 'chip-colab--colegio';
      let iconName = 'educacion.libro';
      if (cat === 'iglesias') {
        chipClase = 'chip-colab--iglesia';
        iconName = 'modulo.social';
      } else if (cat === 'pdi') {
        chipClase = 'chip-colab--pdi';
        iconName = 'persona.grupo';
      }

      const estrategiasHtml = (c.estrategias || []).map(est =>
        `<span class="badge-estrategia-mini">${escapar(est)}</span>`
      ).join('');

      const tieneCelular = esCelularValido(c.celular);
      const telefonoPrincipal = c.celular || c.telefonoFijo || '';

      const sedeNombre = c.sedeInstitucion || 'Por asignar';
      const sedeUrl = `/sedes?q=${encodeURIComponent(sedeNombre)}`;

      return `
        <tr data-id="${escapar(c.id)}">
          <td>
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div class="user-avatar colab-avatar colab-avatar--${cat}">
                ${iniciales || 'IE'}
              </div>
              <div class="colab-name-group">
                <strong class="colab-entity-name">${escapar(sedeNombre)}</strong>
                <span class="colab-person-name">${escapar(c.apellidos)}, ${escapar(c.nombres)}</span>
                <span class="colab-meta-info">DNI: ${escapar(c.dni || 'Sin DNI')} · ${escapar(c.codigo)}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="chip-colab ${chipClase}">
              ${escapar(c.tipoColaborador)}
            </span>
            ${c.turno ? `<div class="colab-subdetail">Turno: ${escapar(c.turno)}</div>` : ''}
            ${c.codigoModular ? `<div class="colab-subdetail">Modular: ${escapar(c.codigoModular)}</div>` : ''}
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <a href="${sedeUrl}" class="colab-sede-link" title="Ver sede territorial">
                <strong>${escapar(c.sedeInstitucion || 'Sede sin asignar')}</strong>
              </a>
              <span class="colab-district-tag">${escapar(c.distrito || '')}</span>
            </div>
          </td>
          <td>
            <div class="colab-estrategias">
              ${estrategiasHtml || '<span style="font-size:11px; color:var(--text-dim);">No disponible</span>'}
            </div>
          </td>
          <td>
            <div class="colab-contact-actions">
              ${telefonoPrincipal ? `
                <a href="tel:${escapar(telefonoPrincipal)}" class="btn-contact-action btn-contact-call" title="Llamar a ${escapar(telefonoPrincipal)}">
                  ${iconHtml('comunicacion.llamar', { size: 13 })}
                  <span>${escapar(telefonoPrincipal)}</span>
                </a>
              ` : '<span class="text-muted" style="font-size:11.5px;">Sin teléfono</span>'}

              ${tieneCelular ? `
                <a href="https://wa.me/51${escapar(c.celular)}?text=Hola%20${encodeURIComponent(c.nombres)}%2C%20le%20escribimos%20del%20Programa%20Desarrollo%20Infantil%20PDI" target="_blank" rel="noopener noreferrer" class="btn-contact-action btn-contact-wa" title="Escribir por WhatsApp">
                  ${iconHtml('dispositivo.movil', { size: 13 })}
                  <span>WhatsApp</span>
                </a>
              ` : ''}
            </div>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              <button type="button" class="btn-action-icon" ${attrsDe(`window.editarColaborador('${escapar(c.id)}')`)} title="Editar ficha del colaborador">
                ${iconHtml('accion.editar', { size: 14 })}
              </button>
              <button type="button" class="btn-action-icon text-danger" ${attrsDe(`window.eliminarColaborador('${escapar(c.id)}')`)} title="Eliminar del directorio">
                ${iconHtml('accion.eliminar', { size: 14 })}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    animarFilas(tbody, flip);
  },

  renderMobileCards(datos) {
    const container = document.getElementById('mobileCardsColaboradores');
    if (!container) return;

    if (!datos || datos.length === 0) {
      pintarTarjetas(container, '');
      return;
    }

    pintarTarjetas(container, datos.map(c => {
      const cat = c.categoria || clasificarCategoria(c.tipoColaborador);
      const iniciales = `${(c.nombres || '')[0] || ''}${(c.apellidos || '')[0] || ''}`.toUpperCase();
      const sedeNombre = c.sedeInstitucion || 'Por asignar';
      const sedeUrl = `/sedes?q=${encodeURIComponent(sedeNombre)}`;
      const tieneCelular = esCelularValido(c.celular);
      const telefonoPrincipal = c.celular || c.telefonoFijo || '';

      let chipClase = 'chip-colab--colegio';
      if (cat === 'iglesias') chipClase = 'chip-colab--iglesia';
      else if (cat === 'pdi') chipClase = 'chip-colab--pdi';

      const estrategiasHtml = (c.estrategias || []).map(est =>
        `<span class="badge-estrategia-mini">${escapar(est)}</span>`
      ).join('');

      return `
        <article class="colab-mobile-card" data-id="${escapar(c.id)}">
          <div class="colab-card-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="user-avatar colab-avatar colab-avatar--${cat}" style="width: 38px; height: 38px; font-size: 13px;">
                ${iniciales || 'IE'}
              </div>
              <div>
                <h4 class="colab-card-title">${escapar(sedeNombre)}</h4>
                <div class="colab-card-subtitle">${escapar(c.apellidos)}, ${escapar(c.nombres)}</div>
              </div>
            </div>
            <span class="chip-colab ${chipClase}">${escapar(c.tipoColaborador)}</span>
          </div>

          <div class="colab-card-meta">
            <div>${iconHtml('lugar.ubicacion', { size: 12 })} <strong>${escapar(c.distrito)}</strong> · <a href="${sedeUrl}" class="colab-sede-link">${escapar(sedeNombre)}</a></div>
            ${c.turno ? `<div>${iconHtml('estado.pendiente', { size: 12 })} Turno: <strong>${escapar(c.turno)}</strong></div>` : ''}
            ${c.codigoModular ? `<div>${iconHtml('educacion.libro', { size: 12 })} Modular: <strong>${escapar(c.codigoModular)}</strong></div>` : ''}
            <div>${iconHtml('persona.usuario', { size: 12 })} DNI: ${escapar(c.dni || 'Sin DNI')} · ${escapar(c.codigo)}</div>
          </div>

          <div class="colab-card-estrategias">
            ${estrategiasHtml}
          </div>

          <div class="colab-card-actions">
            ${telefonoPrincipal ? `
              <a href="tel:${escapar(telefonoPrincipal)}" class="btn-mobile-touch btn-mobile-call">
                ${iconHtml('comunicacion.llamar', { size: 14 })}
                <span>Llamar</span>
              </a>
            ` : ''}
            ${tieneCelular ? `
              <a href="https://wa.me/51${escapar(c.celular)}?text=Hola%20${encodeURIComponent(c.nombres)}%2C%20le%20escribimos%20del%20Programa%20Desarrollo%20Infantil%20PDI" target="_blank" rel="noopener noreferrer" class="btn-mobile-touch btn-mobile-wa">
                ${iconHtml('dispositivo.movil', { size: 14 })}
                <span>WhatsApp</span>
              </a>
            ` : ''}
            <button type="button" class="btn-mobile-touch btn-mobile-edit" ${attrsDe(`window.editarColaborador('${escapar(c.id)}')`)}>
              ${iconHtml('accion.editar', { size: 14 })}
              <span>Ficha</span>
            </button>
          </div>
        </article>
      `;
    }).join(''));
  },

  actualizarCamposContextualesModal(tipo) {
    const camposCol = document.getElementById('colabCamposColegio');
    if (!camposCol) return;

    const cat = clasificarCategoria(tipo);
    camposCol.style.display = cat === 'colegios' ? 'grid' : 'none';
  },

  filterBySearch(val) {
    busquedaActual = val || '';
    const btnClear = document.getElementById('btnColabSearchClear');
    if (btnClear) {
      btnClear.style.display = busquedaActual ? 'inline-flex' : 'none';
    }
    this.aplicarFiltrosYOrden();
  },

  clearSearch() {
    busquedaActual = '';
    const input = document.getElementById('inputColabSearch');
    if (input) input.value = '';
    const btnClear = document.getElementById('btnColabSearchClear');
    if (btnClear) btnClear.style.display = 'none';
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    this.aplicarFiltrosYOrden();
  },

  setFilterDistrito(d) {
    filtroDistritoActual = (d === 'all' || !d) ? '' : d;
    document.getElementById('dropdownColabDistrito')?.classList.remove('open');
    this.aplicarFiltrosYOrden();
  },

  setFilterEstrategia(e) {
    filtroEstrategiaActual = (e === 'all' || !e) ? '' : e;
    document.getElementById('dropdownColabEstrategia')?.classList.remove('open');
    this.aplicarFiltrosYOrden();
  },

  setFilterRol(r) {
    filtroRolActual = (r === 'all' || !r) ? '' : r;
    document.getElementById('dropdownColabRol')?.classList.remove('open');
    this.aplicarFiltrosYOrden();
  },

  setIncluirInactivos(activo) {
    incluirInactivos = Boolean(activo);
    this.aplicarFiltrosYOrden();
  },

  removeChip(tipo) {
    if (tipo === 'distrito') filtroDistritoActual = '';
    if (tipo === 'estrategia') filtroEstrategiaActual = '';
    if (tipo === 'rol') filtroRolActual = '';
    if (tipo === 'inactivos') {
      incluirInactivos = false;
      const chk = document.getElementById('chkColabInactivos');
      if (chk) chk.checked = false;
    }
    this.aplicarFiltrosYOrden();
  },

  resetFilters() {
    busquedaActual = '';
    filtroDistritoActual = '';
    filtroEstrategiaActual = '';
    filtroRolActual = '';
    incluirInactivos = false;
    const chk = document.getElementById('chkColabInactivos');
    if (chk) chk.checked = false;
    const input = document.getElementById('inputColabSearch');
    if (input) input.value = '';
    const btnClear = document.getElementById('btnColabSearchClear');
    if (btnClear) btnClear.style.display = 'none';
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    this.aplicarFiltrosYOrden();
  },

  sort(criterio) {
    ordenActual = criterio || 'apellido-asc';
    this._sortMenu?.sync(ordenActual);
    this.aplicarFiltrosYOrden();
  },

  actualizarDatalistSedes() {
    const datalist = document.getElementById('listaSedesDisponibles');
    if (!datalist) return;
    let sedes = window.PDI?.SedeModel?.getAll?.() || [];
    if (!sedes || sedes.length === 0) {
      sedes = [
        { nombre: 'Año Nuevo', distrito: 'Comas' },
        { nombre: 'Carmen Alto', distrito: 'Comas' },
        { nombre: 'El Progreso', distrito: 'Carabayllo' },
        { nombre: 'La Libertad', distrito: 'Comas' },
        { nombre: 'Los Bendecidos', distrito: 'Carabayllo' },
        { nombre: 'San Pedro', distrito: 'Carabayllo' },
        { nombre: 'Santa Rosa', distrito: 'Carabayllo' }
      ];
    }
    datalist.innerHTML = sedes.map(s =>
      `<option value="${escapar(s.nombre)}">Sede ${escapar(s.nombre)} (${escapar(s.distrito || '')})</option>`
    ).join('');
  },

  openModalNuevo() {
    this.actualizarDatalistSedes();
    const modal = document.getElementById('modalColaborador');
    const form = document.getElementById('formColaborador');
    const title = document.getElementById('modalColabTitle');
    const idInput = document.getElementById('colabEditId');

    if (!modal || !form) return;

    form.reset();
    if (idInput) idInput.value = '';
    if (title) title.textContent = 'Nuevo Colaborador o Institución Aliada';

    // Desmarcar checkboxes de estrategias
    form.querySelectorAll('input[name="colabEstrategias"]').forEach(cb => cb.checked = false);

    // Ajustar categoría predeterminada según la pestaña activa
    const selectTipo = document.getElementById('colabTipo');
    if (selectTipo) {
      if (categoriaTabActual === 'colegios') selectTipo.value = 'Director(a) I.E.';
      else if (categoriaTabActual === 'iglesias') selectTipo.value = 'Pastor(a) / Líder Comunitario';
      else selectTipo.value = 'Facilitador(a) Comunitario(a)';
      this.actualizarCamposContextualesModal(selectTipo.value);
    }

    modal.removeAttribute('inert');
    modal.removeAttribute('aria-hidden');
    modal.classList.add('open');
    modal.classList.add('active');

    const resetScroll = () => {
      modal.scrollTop = 0;
      const drawerBox = modal.querySelector('.drawer-box');
      if (drawerBox) drawerBox.scrollTop = 0;
      const modalBody = modal.querySelector('.modal-body');
      if (modalBody) {
        window.__pdiScroll?.resetEl?.(modalBody);
        modalBody.scrollTop = 0;
      }
    };
    resetScroll();
    requestAnimationFrame(resetScroll);
    setTimeout(resetScroll, 60);

    const primerCampo = document.getElementById('colabTipo');
    if (primerCampo) {
      primerCampo.focus({ preventScroll: true });
    }
  },

  openModalEditar(id) {
    this.actualizarDatalistSedes();
    const colab = ColaboradorModel.getById(id);
    if (!colab) return;

    const modal = document.getElementById('modalColaborador');
    const form = document.getElementById('formColaborador');
    const title = document.getElementById('modalColabTitle');
    const idInput = document.getElementById('colabEditId');

    if (!modal || !form) return;

    if (idInput) idInput.value = colab.id;
    if (title) title.textContent = `Editar Ficha: ${colab.codigo}`;

    document.getElementById('colabNombres').value = colab.nombres || '';
    document.getElementById('colabApellidos').value = colab.apellidos || '';
    document.getElementById('colabDni').value = colab.dni || '';
    document.getElementById('colabCelular').value = colab.celular || '';
    document.getElementById('colabTelefonoFijo').value = colab.telefonoFijo || '';
    document.getElementById('colabEmail').value = colab.email || '';
    document.getElementById('colabDistrito').value = colab.distrito || 'Comas';
    document.getElementById('colabSede').value = colab.sedeInstitucion || '';
    document.getElementById('colabTipo').value = colab.tipoColaborador || 'Director(a) I.E.';
    document.getElementById('colabCodigoModular').value = colab.codigoModular || '';
    document.getElementById('colabNivel').value = colab.nivel || '';
    document.getElementById('colabTurno').value = colab.turno || '';
    document.getElementById('colabEstado').value = colab.estado || 'Activo';
    document.getElementById('colabObservaciones').value = colab.observaciones || '';

    this.actualizarCamposContextualesModal(colab.tipoColaborador);

    // Marcar estrategias
    const ests = Array.isArray(colab.estrategias) ? colab.estrategias : [];
    form.querySelectorAll('input[name="colabEstrategias"]').forEach(cb => {
      cb.checked = ests.includes(cb.value);
    });

    modal.removeAttribute('inert');
    modal.removeAttribute('aria-hidden');
    modal.classList.add('open');
    modal.classList.add('active');

    const resetScroll = () => {
      modal.scrollTop = 0;
      const drawerBox = modal.querySelector('.drawer-box');
      if (drawerBox) drawerBox.scrollTop = 0;
      const modalBody = modal.querySelector('.modal-body');
      if (modalBody) {
        window.__pdiScroll?.resetEl?.(modalBody);
        modalBody.scrollTop = 0;
      }
    };
    resetScroll();
    requestAnimationFrame(resetScroll);
    setTimeout(resetScroll, 60);

    const primerCampo = document.getElementById('colabTipo');
    if (primerCampo) {
      primerCampo.focus({ preventScroll: true });
    }
  },

  cerrarModal() {
    const modal = document.getElementById('modalColaborador');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('open');
      modal.setAttribute('inert', '');
      modal.setAttribute('aria-hidden', 'true');
      const drawerBox = modal.querySelector('.drawer-box');
      if (drawerBox) drawerBox.scrollTop = 0;
      const body = modal.querySelector('.modal-body');
      if (body) {
        window.__pdiScroll?.resetEl?.(body);
        body.scrollTop = 0;
      }
    }
  },

  async guardar() {
    const idInput = document.getElementById('colabEditId');
    const isEdit = idInput && idInput.value;

    const nombres = document.getElementById('colabNombres').value.trim();
    const apellidos = document.getElementById('colabApellidos').value.trim();
    const dni = document.getElementById('colabDni').value.trim();
    const celular = document.getElementById('colabCelular').value.trim();
    const telefonoFijo = document.getElementById('colabTelefonoFijo').value.trim();
    const email = document.getElementById('colabEmail').value.trim();
    const distrito = document.getElementById('colabDistrito').value;
    const sedeInstitucion = document.getElementById('colabSede').value.trim();
    const tipoColaborador = document.getElementById('colabTipo').value;
    const codigoModular = document.getElementById('colabCodigoModular').value.trim();
    const nivel = document.getElementById('colabNivel').value;
    const turno = document.getElementById('colabTurno').value;
    const estado = document.getElementById('colabEstado').value;
    const observaciones = document.getElementById('colabObservaciones').value.trim();

    const form = document.getElementById('formColaborador');
    const estrategias = [];
    if (form) {
      form.querySelectorAll('input[name="colabEstrategias"]:checked').forEach(cb => {
        estrategias.push(cb.value);
      });
    }

    const payload = {
      nombres,
      apellidos,
      dni,
      celular,
      telefonoFijo,
      email,
      distrito,
      sedeInstitucion,
      tipoColaborador,
      codigoModular,
      nivel,
      turno,
      estrategias: estrategias.length > 0 ? estrategias : ['Desayuno Infantil'],
      estado,
      observaciones
    };

    const validacion = validarDatosColaborador(payload);
    if (!validacion.valido) {
      ToastView.show('Datos Incompletos o Inválidos', validacion.errores[0], 'error');
      return;
    }

    if (isEdit) {
      const act = await ColaboradorModel.update(idInput.value, payload);
      if (act) {
        ToastView.show('Ficha Actualizada', `${act.apellidos}, ${act.nombres} ha sido actualizado con éxito.`, 'success');
        if (AuditModel && typeof AuditModel.registrarAccion === 'function') {
          AuditModel.registrarAccion('Edición Colaborador', `Modificó ficha de ${act.codigo} (${act.apellidos})`);
        }
      }
    } else {
      const creado = await ColaboradorModel.create(payload);
      ToastView.show('Colaborador Registrado', `${creado.codigo}: ${creado.apellidos}, ${creado.nombres} fue añadido a la red.`, 'success');
      if (AuditModel && typeof AuditModel.registrarAccion === 'function') {
        AuditModel.registrarAccion('Alta Colaborador', `Registró a ${creado.codigo} (${creado.apellidos})`);
      }
    }

    this.cerrarModal();
    this.render();
  },

  async eliminar(id) {
    const colab = ColaboradorModel.getById(id);
    if (!colab) return;

    const aceptar = await confirmar({
      titulo: 'Dar de baja colaborador',
      mensaje: `¿Estás seguro de dar de baja la ficha de ${colab.apellidos}, ${colab.nombres}?`,
      confirmar: 'Dar de baja',
      cancelar: 'Cancelar',
      peligro: true,
    });
    if (aceptar) {
      await ColaboradorModel.delete(id);
      ToastView.show('Ficha Eliminada', `Se dio de baja el registro de ${colab.codigo}.`, 'info');
      if (AuditModel && typeof AuditModel.registrarAccion === 'function') {
        AuditModel.registrarAccion('Baja Colaborador', `Dio de baja la ficha de ${colab.codigo}`);
      }
      this.render();
    }
  },

  exportCSV() {
    const datos = ColaboradorModel.getAll();
    if (!datos || datos.length === 0) {
      ToastView.show('Directorio Vacío', 'No hay colaboradores para exportar.', 'warning');
      return;
    }

    const encabezados = [
      'Codigo', 'Categoria', 'Rol_Institucional', 'Entidad_Sede', 'Codigo_Modular',
      'Nivel', 'Turno', 'Apellidos', 'Nombres', 'DNI', 'Distrito',
      'Celular_WhatsApp', 'Telefono_Fijo', 'Email', 'Programas_Articulados', 'Estado'
    ];

    const filas = datos.map(c => [
      c.codigo,
      c.categoria || clasificarCategoria(c.tipoColaborador),
      c.tipoColaborador,
      c.sedeInstitucion,
      c.codigoModular || '',
      c.nivel || '',
      c.turno || '',
      c.apellidos,
      c.nombres,
      c.dni || '',
      c.distrito,
      c.celular || '',
      c.telefonoFijo || '',
      c.email || '',
      (c.estrategias || []).join('; '),
      c.estado
    ]);

    const celda = v => `"${String(v || '').replace(/"/g, '""')}"`;
    const lineas = [
      encabezados.map(celda).join(','),
      ...filas.map(f => f.map(celda).join(','))
    ];

    const blob = new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `red_territorial_colaboradores_pdi_${new Date().getFullYear()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.ColaboradoresView = ColaboradoresView;
  window.filterColabSearch = val => ColaboradoresView.filterBySearch(val);
  window.clearColabSearch = () => ColaboradoresView.clearSearch();
  window.openNuevoColaborador = () => ColaboradoresView.openModalNuevo();
  window.editarColaborador = id => ColaboradoresView.openModalEditar(id);
  window.eliminarColaborador = id => ColaboradoresView.eliminar(id);
  window.cerrarModalColaborador = () => ColaboradoresView.cerrarModal();
  window.exportColaboradoresCSV = () => ColaboradoresView.exportCSV();
  window.setFilterColabDistrito = d => ColaboradoresView.setFilterDistrito(d);
  window.setFilterColabEstrategia = e => ColaboradoresView.setFilterEstrategia(e);
  window.setFilterColabRol = r => ColaboradoresView.setFilterRol(r);
  window.setColabIncluirInactivos = function () {
    ColaboradoresView.setIncluirInactivos(this && this.checked);
  };
  window.setColabTab = cat => ColaboradoresView.setTabCategoria(cat);
  window.resetColabFilters = () => ColaboradoresView.resetFilters();
  window.removeColabFilterChip = t => ColaboradoresView.removeChip(t);
  window.sortColaboradores = s => ColaboradoresView.sort(s);
}
