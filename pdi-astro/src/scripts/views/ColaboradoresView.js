// Vista: Padrón y Directorio de Colaboradores e Instituciones Aliadas (PDI)
// Asociación Cultural y Educativa Johannes Gutenberg - Lima Norte

import { ColaboradorModel, clasificarCategoria, CATEGORIAS_COLABORADOR } from '../models/ColaboradorModel.js';
import { ToastView } from './ToastView.js';
import { AuditModel } from '../models/AuditModel.js';
import { escapar } from '../utils/HtmlHelper.js';

let busquedaActual = '';
let categoriaTabActual = 'colegios';
let filtroDistritoActual = '';
let filtroEstrategiaActual = '';
let ordenActual = 'apellido-asc';
let listenersEnlazados = false;

function esCelularValido(num) {
  const limpio = String(num || '').replace(/\D/g, '');
  return limpio.length === 9 && limpio.startsWith('9');
}

export const ColaboradoresView = {
  init() {
    this.enlazarEventos();
    this.render();
  },

  enlazarEventos() {
    if (listenersEnlazados) return;
    listenersEnlazados = true;

    // Tabs de categoría
    const tabs = [
      { id: 'tabBtnColabColegios', cat: 'colegios' },
      { id: 'tabBtnColabIglesias', cat: 'iglesias' },
      { id: 'tabBtnColabPDI', cat: 'pdi' }
    ];

    tabs.forEach(({ id, cat }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.setTabCategoria(cat);
        });
      }
    });

    // Toggle de campos de colegio según el rol en el modal
    const selectTipo = document.getElementById('colabTipo');
    if (selectTipo) {
      selectTipo.addEventListener('change', () => {
        this.actualizarCamposContextualesModal(selectTipo.value);
      });
    }

    // Submit del formulario
    const form = document.getElementById('formColaborador');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.guardar();
      });
    }
  },

  setTabCategoria(cat) {
    categoriaTabActual = cat;

    // Actualizar estado visual de los botones de pestañas
    const tabs = [
      { id: 'tabBtnColabColegios', cat: 'colegios' },
      { id: 'tabBtnColabIglesias', cat: 'iglesias' },
      { id: 'tabBtnColabPDI', cat: 'pdi' }
    ];

    tabs.forEach(({ id, cat: c }) => {
      const btn = document.getElementById(id);
      if (btn) {
        const activo = c === cat;
        btn.classList.toggle('active', activo);
        btn.setAttribute('aria-selected', activo ? 'true' : 'false');
      }
    });

    // Actualizar título de la tarjeta
    const titleEl = document.getElementById('colaboradoresHeaderTitle');
    if (titleEl) {
      if (cat === 'colegios') titleEl.textContent = 'Directorio de Colegios Aliados (I.E.)';
      else if (cat === 'iglesias') titleEl.textContent = 'Directorio de Iglesias y Puntos Pastorales';
      else titleEl.textContent = 'Equipo Técnico y Facilitadoras PDI';
    }

    this.aplicarFiltrosYOrden();
  },

  render() {
    const todos = ColaboradorModel.getAll();
    this.renderStats(todos);
    this.aplicarFiltrosYOrden();
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

    const enComas = datos.filter(c => c.distrito === 'Comas').length;
    const enCarabayllo = datos.filter(c => c.distrito === 'Carabayllo').length;
    const enAgustino = datos.filter(c => c.distrito === 'El Agustino').length;

    if (totalEl) totalEl.textContent = `${activos} activos / ${total} total`;
    if (colegiosEl) colegiosEl.textContent = colegios;
    if (iglesiasEl) iglesiasEl.textContent = iglesias;
    if (pdiEl) pdiEl.textContent = pdi;

    if (badgeCol) badgeCol.textContent = colegios;
    if (badgeIgl) badgeIgl.textContent = iglesias;
    if (badgePdi) badgePdi.textContent = pdi;

    if (comasEl) comasEl.textContent = enComas;
    if (carabaylloEl) carabaylloEl.textContent = enCarabayllo;
    if (agustinoEl) agustinoEl.textContent = enAgustino;
  },

  aplicarFiltrosYOrden() {
    let res = ColaboradorModel.getAll();

    // 1. Filtrar por la Pestaña Activa
    res = res.filter(c => {
      const cat = c.categoria || clasificarCategoria(c.tipoColaborador);
      return cat === categoriaTabActual;
    });

    // 2. Filtro por búsqueda de texto
    if (busquedaActual) {
      const q = busquedaActual.toLowerCase().trim();
      res = res.filter(c =>
        (c.nombres || '').toLowerCase().includes(q) ||
        (c.apellidos || '').toLowerCase().includes(q) ||
        (c.dni || '').toLowerCase().includes(q) ||
        (c.celular || '').toLowerCase().includes(q) ||
        (c.telefonoFijo || '').toLowerCase().includes(q) ||
        (c.sedeInstitucion || '').toLowerCase().includes(q) ||
        (c.codigo || '').toLowerCase().includes(q) ||
        (c.codigoModular || '').toLowerCase().includes(q) ||
        (c.tipoColaborador || '').toLowerCase().includes(q) ||
        (c.distrito || '').toLowerCase().includes(q)
      );
    }

    // 3. Filtro por Distrito
    if (filtroDistritoActual) {
      res = res.filter(c => c.distrito === filtroDistritoActual);
    }

    // 4. Filtro por Estrategia
    if (filtroEstrategiaActual) {
      res = res.filter(c => Array.isArray(c.estrategias) && c.estrategias.includes(filtroEstrategiaActual));
    }

    // 5. Ordenación
    res.sort((a, b) => {
      switch (ordenActual) {
        case 'apellido-desc':
          return (b.apellidos || '').localeCompare(a.apellidos || '');
        case 'sede-asc':
          return (a.sedeInstitucion || '').localeCompare(b.sedeInstitucion || '');
        case 'distrito-asc':
          return (a.distrito || '').localeCompare(b.distrito || '');
        case 'tipo-asc':
          return (a.tipoColaborador || '').localeCompare(b.tipoColaborador || '');
        case 'apellido-asc':
        default:
          return (a.apellidos || '').localeCompare(b.apellidos || '');
      }
    });

    this.renderChipsActivos();
    this.renderTable(res);
    this.renderMobileCards(res);
  },

  renderChipsActivos() {
    const bar = document.getElementById('colabActiveChipsBar');
    const list = document.getElementById('colabActiveChipsList');
    if (!bar || !list) return;

    const chips = [];
    if (filtroDistritoActual) {
      chips.push({ tipo: 'distrito', label: `Distrito: ${filtroDistritoActual}` });
    }
    if (filtroEstrategiaActual) {
      chips.push({ tipo: 'estrategia', label: `Programa: ${filtroEstrategiaActual}` });
    }

    if (chips.length === 0) {
      bar.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    bar.style.display = 'flex';
    list.innerHTML = chips.map(c => `
      <span class="padron-filter-chip">
        <span>${escapar(c.label)}</span>
        <button type="button" class="padron-chip-remove" onclick="window.removeColabFilterChip('${c.tipo}')" title="Quitar filtro">×</button>
      </span>
    `).join('');
  },

  renderTable(datos) {
    const tbody = document.getElementById('tbodyColaboradores');
    const emptyState = document.getElementById('emptyColaboradores');
    const counterEl = document.getElementById('colaboradoresCount');

    if (counterEl) {
      counterEl.textContent = `${datos.length} registros`;
    }

    if (!tbody) return;

    if (!datos || datos.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
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
      const sedeUrl = `/sedes?filtro=${encodeURIComponent(sedeNombre)}`;

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
              ${estrategiasHtml || '<span style="font-size:11px; color:var(--text-dim);">—</span>'}
            </div>
          </td>
          <td>
            <div class="colab-contact-actions">
              ${telefonoPrincipal ? `
                <a href="tel:${escapar(telefonoPrincipal)}" class="btn-contact-action btn-contact-call" title="Llamar a ${escapar(telefonoPrincipal)}">
                  <span>📞 ${escapar(telefonoPrincipal)}</span>
                </a>
              ` : '<span class="text-muted" style="font-size:11.5px;">Sin teléfono</span>'}

              ${tieneCelular ? `
                <a href="https://wa.me/51${escapar(c.celular)}?text=Hola%20${encodeURIComponent(c.nombres)}%2C%20le%20escribimos%20del%20Programa%20Desarrollo%20Infantil%20PDI" target="_blank" rel="noopener noreferrer" class="btn-contact-action btn-contact-wa" title="Escribir por WhatsApp">
                  <span>💬 WhatsApp</span>
                </a>
              ` : ''}
            </div>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              <button type="button" class="btn-action-icon" onclick="window.editarColaborador('${escapar(c.id)}')" title="Editar ficha del colaborador">
                ✏️
              </button>
              <button type="button" class="btn-action-icon text-danger" onclick="window.eliminarColaborador('${escapar(c.id)}')" title="Eliminar del directorio">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderMobileCards(datos) {
    const container = document.getElementById('mobileCardsColaboradores');
    if (!container) return;

    if (!datos || datos.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = datos.map(c => {
      const cat = c.categoria || clasificarCategoria(c.tipoColaborador);
      const iniciales = `${(c.nombres || '')[0] || ''}${(c.apellidos || '')[0] || ''}`.toUpperCase();
      const sedeNombre = c.sedeInstitucion || 'Por asignar';
      const sedeUrl = `/sedes?filtro=${encodeURIComponent(sedeNombre)}`;
      const tieneCelular = esCelularValido(c.celular);
      const telefonoPrincipal = c.celular || c.telefonoFijo || '';

      let chipClase = 'chip-colab--colegio';
      if (cat === 'iglesias') chipClase = 'chip-colab--iglesia';
      else if (cat === 'pdi') chipClase = 'chip-colab--pdi';

      const estrategiasHtml = (c.estrategias || []).map(est =>
        `<span class="badge-estrategia-mini">${escapar(est)}</span>`
      ).join('');

      return `
        <article class="colab-mobile-card">
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
            <div>📍 <strong>${escapar(c.distrito)}</strong> · <a href="${sedeUrl}" class="colab-sede-link">${escapar(sedeNombre)}</a></div>
            ${c.turno ? `<div>⏰ Turno: <strong>${escapar(c.turno)}</strong></div>` : ''}
            ${c.codigoModular ? `<div>🏛️ Código Modular: <strong>${escapar(c.codigoModular)}</strong></div>` : ''}
            <div>🪪 DNI: ${escapar(c.dni || 'Sin DNI')} · ${escapar(c.codigo)}</div>
          </div>

          <div class="colab-card-estrategias">
            ${estrategiasHtml}
          </div>

          <div class="colab-card-actions">
            ${telefonoPrincipal ? `
              <a href="tel:${escapar(telefonoPrincipal)}" class="btn-mobile-touch btn-mobile-call">
                📞 Llamar
              </a>
            ` : ''}
            ${tieneCelular ? `
              <a href="https://wa.me/51${escapar(c.celular)}?text=Hola%20${encodeURIComponent(c.nombres)}%2C%20le%20escribimos%20del%20Programa%20Desarrollo%20Infantil%20PDI" target="_blank" rel="noopener noreferrer" class="btn-mobile-touch btn-mobile-wa">
                💬 WhatsApp
              </a>
            ` : ''}
            <button type="button" class="btn-mobile-touch btn-mobile-edit" onclick="window.editarColaborador('${escapar(c.id)}')">
              ✏️ Ficha
            </button>
          </div>
        </article>
      `;
    }).join('');
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
    this.aplicarFiltrosYOrden();
  },

  setFilterDistrito(d) {
    filtroDistritoActual = d || '';
    this.aplicarFiltrosYOrden();
  },

  setFilterEstrategia(e) {
    filtroEstrategiaActual = e || '';
    this.aplicarFiltrosYOrden();
  },

  removeChip(tipo) {
    if (tipo === 'distrito') filtroDistritoActual = '';
    if (tipo === 'estrategia') filtroEstrategiaActual = '';
    this.aplicarFiltrosYOrden();
  },

  resetFilters() {
    busquedaActual = '';
    filtroDistritoActual = '';
    filtroEstrategiaActual = '';
    const input = document.getElementById('inputColabSearch');
    if (input) input.value = '';
    const btnClear = document.getElementById('btnColabSearchClear');
    if (btnClear) btnClear.style.display = 'none';
    this.aplicarFiltrosYOrden();
  },

  sort(criterio) {
    ordenActual = criterio || 'apellido-asc';
    this.aplicarFiltrosYOrden();
  },

  openModalNuevo() {
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

    modal.classList.add('active');
    modal.style.display = 'flex';
  },

  openModalEditar(id) {
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

    modal.classList.add('active');
    modal.style.display = 'flex';
  },

  cerrarModal() {
    const modal = document.getElementById('modalColaborador');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  },

  guardar() {
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

    if (!nombres || !apellidos) {
      ToastView.show('Datos Incompletos', 'Por favor ingresa los nombres y apellidos de la persona de contacto.', 'error');
      return;
    }

    if (!sedeInstitucion) {
      ToastView.show('Sede Requerida', 'Por favor ingresa el nombre de la I.E., Iglesia o Sede vinculada.', 'error');
      return;
    }

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

    if (isEdit) {
      const act = ColaboradorModel.update(idInput.value, payload);
      if (act) {
        ToastView.show('Ficha Actualizada', `${act.apellidos}, ${act.nombres} ha sido actualizado con éxito.`, 'success');
        if (AuditModel && typeof AuditModel.registrarAccion === 'function') {
          AuditModel.registrarAccion('Edición Colaborador', `Modificó ficha de ${act.codigo} (${act.apellidos})`);
        }
      }
    } else {
      const creado = ColaboradorModel.create(payload);
      ToastView.show('Colaborador Registrado', `${creado.codigo}: ${creado.apellidos}, ${creado.nombres} fue añadido a la red.`, 'success');
      if (AuditModel && typeof AuditModel.registrarAccion === 'function') {
        AuditModel.registrarAccion('Alta Colaborador', `Registró a ${creado.codigo} (${creado.apellidos})`);
      }
    }

    this.cerrarModal();
    this.render();
  },

  eliminar(id) {
    const colab = ColaboradorModel.getById(id);
    if (!colab) return;

    if (confirm(`¿Estás seguro de dar de baja la ficha de ${colab.apellidos}, ${colab.nombres}?`)) {
      ColaboradorModel.delete(id);
      ToastView.show('Ficha Eliminada', `Se eliminó el registro de ${colab.codigo}.`, 'info');
      if (AuditModel && typeof AuditModel.registrarAccion === 'function') {
        AuditModel.registrarAccion('Baja Colaborador', `Eliminó ficha de ${colab.codigo}`);
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
  window.resetColabFilters = () => ColaboradoresView.resetFilters();
  window.removeColabFilterChip = t => ColaboradoresView.removeChip(t);
  window.sortColaboradores = s => ColaboradoresView.sort(s);
}
