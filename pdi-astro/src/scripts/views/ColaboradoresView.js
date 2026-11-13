// Vista: Padrón y Directorio de Colaboradores (PDI)
// Asociación Cultural y Educativa Johannes Gutenberg - Lima Norte

import { ColaboradorModel, TIPOS_COLABORADOR, DISTRITOS_COLABORADOR } from '../models/ColaboradorModel.js';
import { ToastView } from './ToastView.js';
import { AuditModel } from '../models/AuditModel.js';
import { escapar, escaparEnManejador } from '../utils/HtmlHelper.js';
import { iconHtml } from '../../data/iconos.js';

let listaFiltrada = [];
let busquedaActual = '';
let filtroRolActual = '';
let filtroDistritoActual = '';
let filtroEstrategiaActual = '';
let filtroCuentaActual = '';
let ordenActual = 'apellido-asc';

export const ColaboradoresView = {
  init() {
    this.render();
  },

  render() {
    const todos = ColaboradorModel.getAll();
    this.renderStats(todos);
    this.aplicarFiltrosYOrden();
  },

  renderStats(datos) {
    const totalEl = document.getElementById('statColabTotal');
    const facilsEl = document.getElementById('statColabFacilitadores');
    const directoresEl = document.getElementById('statColabDirectores');
    const enlacesEl = document.getElementById('statColabEnlaces');
    const comasEl = document.getElementById('statColabComas');
    const carabaylloEl = document.getElementById('statColabCarabayllo');

    const total = datos.length;
    const activos = datos.filter(c => c.estado === 'Activo').length;
    const facils = datos.filter(c => c.tipoColaborador.includes('Facilitador') || c.tipoColaborador.includes('Promotora')).length;
    const directores = datos.filter(c => c.tipoColaborador.includes('Director') || c.tipoColaborador.includes('Docente')).length;
    const enlaces = datos.filter(c => c.tipoColaborador.includes('Enlace')).length;
    const enComas = datos.filter(c => c.distrito === 'Comas').length;
    const enCarabayllo = datos.filter(c => c.distrito === 'Carabayllo').length;

    if (totalEl) totalEl.textContent = `${activos} activos / ${total} total`;
    if (facilsEl) facilsEl.textContent = facils;
    if (directoresEl) directoresEl.textContent = directores;
    if (enlacesEl) enlacesEl.textContent = enlaces;
    if (comasEl) comasEl.textContent = enComas;
    if (carabaylloEl) carabaylloEl.textContent = enCarabayllo;
  },

  aplicarFiltrosYOrden() {
    let res = ColaboradorModel.getAll();

    // Filtro por búsqueda de texto
    if (busquedaActual) {
      const q = busquedaActual.toLowerCase().trim();
      res = res.filter(c =>
        (c.nombres || '').toLowerCase().includes(q) ||
        (c.apellidos || '').toLowerCase().includes(q) ||
        (c.dni || '').toLowerCase().includes(q) ||
        (c.celular || '').toLowerCase().includes(q) ||
        (c.sedeInstitucion || '').toLowerCase().includes(q) ||
        (c.codigo || '').toLowerCase().includes(q) ||
        (c.tipoColaborador || '').toLowerCase().includes(q)
      );
    }

    // Filtro por Rol
    if (filtroRolActual) {
      res = res.filter(c => c.tipoColaborador === filtroRolActual);
    }

    // Filtro por Distrito
    if (filtroDistritoActual) {
      res = res.filter(c => c.distrito === filtroDistritoActual);
    }

    // Filtro por Estrategia
    if (filtroEstrategiaActual) {
      res = res.filter(c => Array.isArray(c.estrategias) && c.estrategias.includes(filtroEstrategiaActual));
    }

    // Filtro por Cuenta de Acceso
    if (filtroCuentaActual === 'con-cuenta') {
      res = res.filter(c => Boolean(c.cuentaUsuarioId || c.usuarioLogin));
    } else if (filtroCuentaActual === 'sin-cuenta') {
      res = res.filter(c => !c.cuentaUsuarioId && !c.usuarioLogin);
    }

    // Ordenación
    res.sort((a, b) => {
      switch (ordenActual) {
        case 'apellido-desc':
          return (b.apellidos || '').localeCompare(a.apellidos || '');
        case 'nombre-asc':
          return (a.nombres || '').localeCompare(b.nombres || '');
        case 'distrito-asc':
          return (a.distrito || '').localeCompare(b.distrito || '');
        case 'tipo-asc':
          return (a.tipoColaborador || '').localeCompare(b.tipoColaborador || '');
        case 'ingreso-desc':
          return (b.fechaIngreso || '').localeCompare(a.fechaIngreso || '');
        case 'apellido-asc':
        default:
          return (a.apellidos || '').localeCompare(b.apellidos || '');
      }
    });

    listaFiltrada = res;
    this.renderTable(res);
  },

  renderTable(datos) {
    const tbody = document.getElementById('tbodyColaboradores');
    const emptyState = document.getElementById('emptyColaboradores');
    const counterEl = document.getElementById('colaboradoresCount');

    if (counterEl) {
      counterEl.textContent = `${datos.length} colaboradores`;
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
      
      let chipClase = 'chip-colab--facilitador';
      if (c.tipoColaborador.includes('Promotora Educativa')) chipClase = 'chip-colab--promotora-edu';
      else if (c.tipoColaborador.includes('Promotora Social')) chipClase = 'chip-colab--promotora-soc';
      else if (c.tipoColaborador.includes('Director') || c.tipoColaborador.includes('Docente')) chipClase = 'chip-colab--director';
      else if (c.tipoColaborador.includes('Enlace')) chipClase = 'chip-colab--enlace';

      const tieneCuenta = Boolean(c.cuentaUsuarioId || c.usuarioLogin);
      const estrategiasHtml = (c.estrategias || []).map(est =>
        `<span class="badge-estrategia-mini">${escapar(est)}</span>`
      ).join('');

      return `
        <tr data-id="${escapar(c.id)}">
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="user-avatar" style="width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--surface-3); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: var(--text-main); flex-shrink: 0; border: 1px solid var(--border-subtle);">
                ${iniciales}
              </div>
              <div class="colab-name-group">
                <strong style="color: var(--text-main); font-size: 13.5px;">${escapar(c.apellidos)}, ${escapar(c.nombres)}</strong>
                <span class="colab-code">${escapar(c.codigo)} · DNI: ${escapar(c.dni || 'Sin registrar')}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="chip-colab ${chipClase}">
              ${escapar(c.tipoColaborador)}
            </span>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <strong style="font-size: 13px; color: var(--text-main);">${escapar(c.sedeInstitucion || 'No asignada')}</strong>
              <span style="font-size: 11px; color: var(--text-muted);">${escapar(c.distrito || '')}</span>
            </div>
          </td>
          <td>
            <div class="colab-estrategias">
              ${estrategiasHtml || '<span style="font-size:11px; color:var(--text-dim);">—</span>'}
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <a href="tel:${escapar(c.celular)}" class="colab-phone-link" title="Llamar al colaborador">
                <span style="font-family: var(--font-mono); font-size: 12.5px;">${escapar(c.celular || '—')}</span>
              </a>
              ${c.email ? `<span style="font-size: 11px; color: var(--text-muted);">${escapar(c.email)}</span>` : ''}
            </div>
          </td>
          <td>
            ${tieneCuenta
              ? `<span class="badge-acceso badge-acceso--activo" title="Usuario vinculado: ${escapar(c.usuarioLogin || c.cuentaUsuarioId)}">
                   <span style="width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
                   <span>${escapar(c.usuarioLogin || 'Con acceso')}</span>
                 </span>`
              : `<span class="badge-acceso badge-acceso--campo" title="Ficha operativa de campo (sin login directo)">
                   <span>Solo campo</span>
                 </span>`
            }
          </td>
          <td>
            <span class="status-pill status-${c.estado === 'Activo' ? 'favorable' : 'cerrado'}" style="font-size: 11px;">
              ${escapar(c.estado || 'Activo')}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              <button type="button" class="btn-action-icon" onclick="window.editarColaborador ? window.editarColaborador('${escaparEnManejador(c.id)}') : null" title="Editar Ficha Técnica" aria-label="Editar">
                ${iconHtml('accion.editar', { size: 14 })}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  filterBySearch(query) {
    busquedaActual = query || '';
    const btnClear = document.getElementById('btnColabSearchClear');
    if (btnClear) {
      btnClear.style.display = busquedaActual ? 'flex' : 'none';
    }
    this.aplicarFiltrosYOrden();
  },

  clearSearch() {
    const input = document.getElementById('inputColabSearch');
    if (input) input.value = '';
    this.filterBySearch('');
  },

  setFilterRol(rol) {
    filtroRolActual = rol || '';
    this.actualizarEtiquetasFiltros();
    this.aplicarFiltrosYOrden();
  },

  setFilterDistrito(distrito) {
    filtroDistritoActual = distrito || '';
    this.actualizarEtiquetasFiltros();
    this.aplicarFiltrosYOrden();
  },

  setFilterEstrategia(estrategia) {
    filtroEstrategiaActual = estrategia || '';
    this.actualizarEtiquetasFiltros();
    this.aplicarFiltrosYOrden();
  },

  setFilterCuenta(cuenta) {
    filtroCuentaActual = cuenta || '';
    this.actualizarEtiquetasFiltros();
    this.aplicarFiltrosYOrden();
  },

  resetFilters() {
    busquedaActual = '';
    filtroRolActual = '';
    filtroDistritoActual = '';
    filtroEstrategiaActual = '';
    filtroCuentaActual = '';

    const input = document.getElementById('inputColabSearch');
    if (input) input.value = '';
    const btnClear = document.getElementById('btnColabSearchClear');
    if (btnClear) btnClear.style.display = 'none';

    this.actualizarEtiquetasFiltros();
    this.aplicarFiltrosYOrden();
    ToastView.show('Filtros Restablecidos', 'Se muestran todos los colaboradores registrados.', 'info');
  },

  actualizarEtiquetasFiltros() {
    let count = 0;
    if (filtroRolActual) count++;
    if (filtroDistritoActual) count++;
    if (filtroEstrategiaActual) count++;
    if (filtroCuentaActual) count++;

    const countBadge = document.getElementById('colabActiveFiltersCount');
    if (countBadge) {
      countBadge.textContent = count > 0 ? String(count) : '';
      countBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  },

  sort(criterio) {
    ordenActual = criterio;
    this.aplicarFiltrosYOrden();
  },

  exportCSV() {
    const datos = listaFiltrada.length > 0 ? listaFiltrada : ColaboradorModel.getAll();
    if (!datos || datos.length === 0) {
      ToastView.show('Sin Datos', 'No hay colaboradores disponibles para exportar.', 'warning');
      return;
    }

    const cabeceras = [
      'Código',
      'Apellidos',
      'Nombres',
      'DNI',
      'Celular',
      'Email',
      'Distrito',
      'Sede o Institución Educativa',
      'Tipo de Colaborador',
      'Estrategias',
      'Acceso al Sistema',
      'Estado',
      'Fecha Ingreso',
      'Observaciones'
    ];

    const filas = datos.map(c => [
      `"${c.codigo || ''}"`,
      `"${(c.apellidos || '').replace(/"/g, '""')}"`,
      `"${(c.nombres || '').replace(/"/g, '""')}"`,
      `"${c.dni || ''}"`,
      `"${c.celular || ''}"`,
      `"${c.email || ''}"`,
      `"${c.distrito || ''}"`,
      `"${(c.sedeInstitucion || '').replace(/"/g, '""')}"`,
      `"${c.tipoColaborador || ''}"`,
      `"${(c.estrategias || []).join('; ')}"`,
      `"${c.usuarioLogin ? `Vinculado (${c.usuarioLogin})` : 'Solo campo'}"`,
      `"${c.estado || 'Activo'}"`,
      `"${c.fechaIngreso || ''}"`,
      `"${(c.observaciones || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [cabeceras.join(','), ...filas.map(f => f.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Padron_Colaboradores_PDI_Johannes_Gutenberg_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    ToastView.show('Descarga Exitosa', `Se exportaron ${datos.length} registros del Padrón de Colaboradores.`, 'success');

    if (AuditModel && typeof AuditModel.registrarAccion === 'function') {
      AuditModel.registrarAccion('Exportación CSV', `Descargó el Padrón de Colaboradores (${datos.length} registros)`);
    }
  },

  openModalNuevo() {
    const modal = document.getElementById('modalColaborador');
    const form = document.getElementById('formColaborador');
    const title = document.getElementById('modalColabTitle');
    const idInput = document.getElementById('colabEditId');

    if (!modal || !form) return;

    form.reset();
    if (idInput) idInput.value = '';
    if (title) title.textContent = 'Nuevo Colaborador de Campo';

    // Desmarcar checkboxes de estrategias
    form.querySelectorAll('input[name="colabEstrategias"]').forEach(cb => cb.checked = false);

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
    if (title) title.textContent = `Editar Colaborador: ${colab.codigo}`;

    document.getElementById('colabNombres').value = colab.nombres || '';
    document.getElementById('colabApellidos').value = colab.apellidos || '';
    document.getElementById('colabDni').value = colab.dni || '';
    document.getElementById('colabCelular').value = colab.celular || '';
    document.getElementById('colabEmail').value = colab.email || '';
    document.getElementById('colabDistrito').value = colab.distrito || 'Comas';
    document.getElementById('colabSede').value = colab.sedeInstitucion || '';
    document.getElementById('colabTipo').value = colab.tipoColaborador || 'Facilitador(a) Comunitario(a)';
    document.getElementById('colabUsuario').value = colab.usuarioLogin || '';
    document.getElementById('colabEstado').value = colab.estado || 'Activo';
    document.getElementById('colabObservaciones').value = colab.observaciones || '';

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

  guardar(event) {
    if (event && event.preventDefault) event.preventDefault();

    const idInput = document.getElementById('colabEditId');
    const isEdit = idInput && idInput.value;

    const nombres = document.getElementById('colabNombres').value.trim();
    const apellidos = document.getElementById('colabApellidos').value.trim();
    const dni = document.getElementById('colabDni').value.trim();
    const celular = document.getElementById('colabCelular').value.trim();
    const email = document.getElementById('colabEmail').value.trim();
    const distrito = document.getElementById('colabDistrito').value;
    const sedeInstitucion = document.getElementById('colabSede').value.trim();
    const tipoColaborador = document.getElementById('colabTipo').value;
    const usuarioLogin = document.getElementById('colabUsuario').value.trim();
    const estado = document.getElementById('colabEstado').value;
    const observaciones = document.getElementById('colabObservaciones').value.trim();

    if (!nombres || !apellidos) {
      ToastView.show('Datos Incompletos', 'Por favor ingresa los nombres y apellidos del colaborador.', 'error');
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
      email,
      distrito,
      sedeInstitucion,
      tipoColaborador,
      estrategias: estrategias.length > 0 ? estrategias : ['Desayuno Infantil'],
      usuarioLogin,
      cuentaUsuarioId: usuarioLogin ? `usr_${usuarioLogin}` : null,
      estado,
      observaciones
    };

    if (isEdit) {
      const act = ColaboradorModel.update(idInput.value, payload);
      if (act) {
        ToastView.show('Colaborador Actualizado', `${act.apellidos}, ${act.nombres} ha sido actualizado con éxito.`, 'success');
        if (AuditModel && typeof AuditModel.registrarAccion === 'function') {
          AuditModel.registrarAccion('Edición Colaborador', `Modificó ficha de ${act.codigo} (${act.apellidos})`);
        }
      }
    } else {
      const creado = ColaboradorModel.create(payload);
      ToastView.show('Colaborador Registrado', `${creado.codigo}: ${creado.apellidos}, ${creado.nombres} fue añadido al padrón.`, 'success');
      if (AuditModel && typeof AuditModel.registrarAccion === 'function') {
        AuditModel.registrarAccion('Alta Colaborador', `Registró a ${creado.codigo} (${creado.apellidos})`);
      }
    }

    this.cerrarModal();
    this.render();
  }
};

// Exponer en window para los manejadores inline de Astro
if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.ColaboradoresView = ColaboradoresView;
  window.filterColabSearch = (val) => ColaboradoresView.filterBySearch(val);
  window.clearColabSearch = () => ColaboradoresView.clearSearch();
  window.openNuevoColaborador = () => ColaboradoresView.openModalNuevo();
  window.editarColaborador = (id) => ColaboradoresView.openModalEditar(id);
  window.cerrarModalColaborador = () => ColaboradoresView.cerrarModal();
  window.guardarColaborador = (e) => ColaboradoresView.guardar(e);
  window.exportColaboradoresCSV = () => ColaboradoresView.exportCSV();
  window.setFilterColabRol = (r) => ColaboradoresView.setFilterRol(r);
  window.setFilterColabDistrito = (d) => ColaboradoresView.setFilterDistrito(d);
  window.setFilterColabEstrategia = (e) => ColaboradoresView.setFilterEstrategia(e);
  window.setFilterColabCuenta = (c) => ColaboradoresView.setFilterCuenta(c);
  window.resetColabFilters = () => ColaboradoresView.resetFilters();
  window.sortColaboradores = (s) => ColaboradoresView.sort(s);
}
