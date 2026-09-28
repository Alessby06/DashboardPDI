// Vista: Padrón y Gestión de Voluntariados y Personal Comunitario (PDI)
// Asociación Cultural Johannes Gutenberg - Lima Norte

import { VoluntarioModel, TEMATICAS_CAPACITACION } from '../models/VoluntarioModel.js';
import { crear as crearFiltros } from '../utils/Filters.js';

// Etiquetas cortas para los nombres largos de servicio (chips y dropdowns de filtro)
const SERVICIO_LABELS = {
  "Desayuno Infantil": "Desayuno Infantil",
  "Casita del Saber": "Casita del Saber",
  "Área Social Pastoral (ASP)": "Pastoral ASP"
};

// Filtros del padrón de voluntarios que viajan en la URL.
const FILTROS_VOLUNTARIOS = {
  q:        { valor: "" },
  distrito: { valor: [], valores: ["Comas", "Carabayllo"], multiple: true },
  servicio: { valor: [], valores: ["Desayuno Infantil", "Casita del Saber", "Área Social Pastoral (ASP)"], multiple: true },
  // El rol no tiene desplegable: se marca desde las pildoras de cada fila, asi
  // que el dominio son los roles que existan en los datos, no una lista cerrada.
  // Por eso se declara sin `valores` y Filters.js lo acota por longitud y
  // caracteres. Fijar aqui una lista seria hacer que un rol nuevo no se pudiera
  // filtrar ni compartir por enlace.
  rol:      { valor: [], multiple: true },
  estado:   { valor: "all", valores: ["all", "Activo", "En Pausa"] },
};

export const VoluntariadosView = {
  _voluntarios: [],
  _searchQuery: "",
  _filterDistrito: [],
  _filterServicio: [],
  _filterRol: [],
  _filterEstado: "all",
  // Estado de edicion en curso. No va en la URL: es un modal, no una vista, y
  // relajar a alguien a mitad de una ficha es peor que no recorderlo.
  _currentEditingId: null,

  _filtros: null,
  _filtrosLeidos: false,

  _obtenerFiltros() {
    if (!this._filtros) {
      this._filtros = crearFiltros(FILTROS_VOLUNTARIOS);
    }
    return this._filtros;
  },

  _persistirFiltros(extra) {
    this._obtenerFiltros().escribir({
      q: this._searchQuery,
      distrito: this._filterDistrito,
      servicio: this._filterServicio,
      rol: this._filterRol,
      estado: this._filterEstado,
      ...(extra || {}),
    });
  },

  _leerFiltrosDeURL() {
    if (this._filtrosLeidos) return;
    this._filtrosLeidos = true;

    const f = this._obtenerFiltros().leer();
    this._searchQuery = (f.q || "").toLowerCase();
    this._filterDistrito = f.distrito;
    this._filterServicio = f.servicio;
    this._filterRol = f.rol;
    this._filterEstado = f.estado;

    const input = document.getElementById("inputVoluntariosSearch");
    if (input) input.value = f.q;
    const clearBtn = document.getElementById("btnVoluntariosSearchClear");
    if (clearBtn) clearBtn.style.display = f.q ? "inline-flex" : "none";

    this._updateFilterDropdownUI();
  },

  init(voluntarios) {
    this._voluntarios = voluntarios || VoluntarioModel.getAll();
    this._attachEventListeners();
  },

  _attachEventListeners() {
    // Search input
    const searchInput = document.getElementById("inputVoluntariosSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this._searchQuery = e.target.value.toLowerCase().trim();
        const clearBtn = document.getElementById("btnVoluntariosSearchClear");
        if (clearBtn) clearBtn.style.display = this._searchQuery ? "inline-flex" : "none";
        this.applyFilters();
        this._persistirFiltros({ q: e.target.value });
      });
    }

    // Close dropdowns on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-dropdown")) {
        document.querySelectorAll(".custom-dropdown.open").forEach(d => {
          if (d.id.startsWith("dropdownVoluntarios") || d.id === "dropdownVoluntariosFilterPanel") {
            d.classList.remove("open");
          }
        });
      }
    });
  },

  render() {
    this._leerFiltrosDeURL();
    this._voluntarios = VoluntarioModel.getAll();
    this._renderKPIs();
    this._renderActiveChips();
    this.applyFilters();
  },

  _renderKPIs() {
    const stats = VoluntarioModel.getStats();
    
    const kpiTotal = document.getElementById("kpiVoluntariosTotal");
    if (kpiTotal) kpiTotal.textContent = stats.total;

    const kpiActivos = document.getElementById("kpiVoluntariosActivos");
    if (kpiActivos) kpiActivos.textContent = `${stats.activos} activos`;

    const kpiDesayuno = document.getElementById("kpiVoluntariosDesayuno");
    if (kpiDesayuno) kpiDesayuno.textContent = stats.desayuno;

    const kpiCasita = document.getElementById("kpiVoluntariosCasitas");
    if (kpiCasita) kpiCasita.textContent = stats.casita;

    const kpiCanastas = document.getElementById("kpiVoluntariosCanastas");
    if (kpiCanastas) kpiCanastas.textContent = stats.canastasTotal;

    const badgeNav = document.getElementById("badgeTotalVoluntarios");
    if (badgeNav) badgeNav.textContent = stats.total;
  },

  applyFilters() {
    let list = [...this._voluntarios];

    // Search query
    if (this._searchQuery) {
      const q = this._searchQuery;
      list = list.filter(v => 
        (v.nombres && v.nombres.toLowerCase().includes(q)) ||
        (v.apellidos && v.apellidos.toLowerCase().includes(q)) ||
        (v.dni && v.dni.includes(q)) ||
        (v.codigo && v.codigo.toLowerCase().includes(q)) ||
        (v.sedeAsignada && v.sedeAsignada.toLowerCase().includes(q)) ||
        (v.servicio && v.servicio.toLowerCase().includes(q)) ||
        (v.rol && v.rol.toLowerCase().includes(q))
      );
    }

    // Filter Distrito
    if (this._filterDistrito.length > 0) {
      list = list.filter(v => this._filterDistrito.includes(v.distrito));
    }

    // Filter Servicio
    if (this._filterServicio.length > 0) {
      list = list.filter(v => this._filterServicio.includes(v.servicio));
    }

    // Filter Rol
    if (this._filterRol.length > 0) {
      list = list.filter(v => this._filterRol.includes(v.rol));
    }

    // Filter Estado
    if (this._filterEstado !== "all") {
      list = list.filter(v => v.estado === this._filterEstado);
    }

    const countHeaderEl = document.getElementById("voluntariosRecordsCount");
    if (countHeaderEl) {
      countHeaderEl.textContent = `Mostrando ${list.length} de ${this._voluntarios.length} voluntarias y personal comunitario`;
    }

    this._updateActiveFilterBadge();
    this._renderActiveChips();
    this._renderTableAndCards(list);
  },

  _updateActiveFilterBadge() {
    const count = this._filterDistrito.length
      + this._filterServicio.length
      + (this._filterEstado !== "all" ? 1 : 0);

    const badge = document.getElementById("voluntariosActiveFiltersCount");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }

    const btn = document.getElementById("btnDropdownVoluntariosFilterPanel");
    if (btn) btn.classList.toggle("has-filters", count > 0);
  },

  _renderActiveChips() {
    const bar = document.getElementById("voluntariosActiveChipsBar");
    const list = document.getElementById("voluntariosActiveChipsList");
    if (!bar || !list) return;

    const chips = [];

    if (this._filterDistrito.length > 0) {
      this._filterDistrito.forEach(d => {
        chips.push({ id: "distrito", val: d, label: `Distrito: ${d}` });
      });
    }

    if (this._filterServicio.length > 0) {
      this._filterServicio.forEach(s => {
        chips.push({ id: "servicio", val: s, label: `Servicio: ${SERVICIO_LABELS[s] || s}` });
      });
    }

    if (this._filterRol.length > 0) {
      this._filterRol.forEach(r => {
        chips.push({ id: "rol", val: r, label: `Rol: ${r}` });
      });
    }

    if (this._filterEstado !== "all") {
      chips.push({ id: "estado", val: this._filterEstado, label: `Estado: ${this._filterEstado}` });
    }

    if (chips.length > 0) {
      bar.style.display = "flex";
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${chip.label}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeVoluntarioChip ? window.removeVoluntarioChip('${chip.id}', '${chip.val || ''}') : null" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      `).join("");
    } else {
      bar.style.display = "none";
      list.innerHTML = "";
    }
  },

  _renderTableAndCards(voluntarios) {
    const tbody = document.getElementById("tbodyVoluntarios");
    const mobileContainer = document.getElementById("mobileCardsVoluntarios");

    if (voluntarios.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px 16px;">
            <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 50%; background: var(--gt-green-bg, rgba(52, 211, 153, 0.12)); display: flex; align-items: center; justify-content: center; color: var(--gt-green, #34d399);">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 15px;">No se encontraron voluntarias o personal comunitario</div>
            <div style="color: var(--text-muted); font-size: 12.5px; margin-top: 4px;">Prueba ajustando el término de búsqueda o restableciendo los filtros.</div>
            <button type="button" class="btn-action btn-secondary" style="margin-top: 14px; display: inline-flex;" onclick="window.resetVoluntariosFilters ? window.resetVoluntariosFilters() : null">
              Restablecer Filtros
            </button>
          </td>
        </tr>
      `;
      if (tbody) tbody.innerHTML = emptyHtml;

      if (mobileContainer) {
        mobileContainer.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; background: var(--surface-1); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 8px;">
            <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 50%; background: var(--gt-green-bg, rgba(52, 211, 153, 0.12)); display: flex; align-items: center; justify-content: center; color: var(--gt-green, #34d399);">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">No se encontraron registros</div>
            <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">No hay voluntarias que coincidan con la búsqueda o filtros.</div>
            <button type="button" class="btn-action btn-secondary" style="margin-top: 12px; display: inline-flex;" onclick="window.resetVoluntariosFilters ? window.resetVoluntariosFilters() : null">
              Restablecer Filtros
            </button>
          </div>
        `;
      }
      return;
    }

    // Render Table (PC)
    if (tbody) {
      tbody.innerHTML = voluntarios.map(v => {
        let badgeServClass = "badge-green";
        if (v.servicio === "Casita del Saber") badgeServClass = "badge-yellow";
        if (v.servicio === "Área Social Pastoral (ASP)") badgeServClass = "badge-blue";

        let badgeEstadoClass = v.estado === "Activo" ? "badge-green" : (v.estado === "En Pausa" ? "badge-yellow" : "badge-gray");
        const capCount = (v.capacitaciones && v.capacitaciones.length) || 0;

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--surface-2); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: var(--gt-green);">
                  ${v.nombres.charAt(0)}${v.apellidos.charAt(0)}
                </div>
                <div>
                  <strong>${v.nombres} ${v.apellidos}</strong>
                  <div style="font-size: 11.5px; color: var(--text-dim); font-family: var(--mono-font);">${v.codigo} &bull; DNI: ${v.dni}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-weight: 600; color: var(--text-main);">${v.sedeAsignada}</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">${v.distrito} &bull; ${v.estrategia}</div>
            </td>
            <td>
              <span class="badge ${badgeServClass}">${v.servicio}</span>
              <div style="font-size: 11px; color: var(--text-dim); margin-top: 3px;">${v.rol}</div>
            </td>
            <td>
              <div style="font-size: 12.5px; color: var(--text-main); font-weight: 600;">${v.celular}</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">${v.edad} años</div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="badge ${capCount >= 3 ? 'badge-green' : (capCount >= 1 ? 'badge-yellow' : 'badge-gray')}">
                  ${capCount} taller${capCount === 1 ? '' : 'es'}
                </span>
                ${v.canastasRecibidas > 0 ? `
                  <span class="badge badge-blue" title="Canastas de alimentos entregadas">
                    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" style="flex-shrink: 0;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <span>${v.canastasRecibidas}</span>
                  </span>
                ` : ''}
              </div>
            </td>
            <td>
              <span class="badge ${badgeEstadoClass}">${v.estado}</span>
            </td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 6px;">
                <button type="button" class="btn-action" onclick="window.openFichaVoluntario ? window.openFichaVoluntario(${v.id}) : null" title="Ver Ficha y Credencial">
                  Ver Ficha
                </button>
                <button type="button" class="btn-action primary" onclick="window.openEditVoluntario ? window.openEditVoluntario(${v.id}) : null" title="Editar Voluntario">
                  Editar
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    // Render Cards (Mobile)
    if (mobileContainer) {
      mobileContainer.innerHTML = voluntarios.map(v => {
        let badgeServClass = "badge-green";
        if (v.servicio === "Casita del Saber") badgeServClass = "badge-yellow";
        if (v.servicio === "Área Social Pastoral (ASP)") badgeServClass = "badge-blue";

        let badgeEstadoClass = v.estado === "Activo" ? "badge-green" : (v.estado === "En Pausa" ? "badge-yellow" : "badge-gray");
        const capCount = (v.capacitaciones && v.capacitaciones.length) || 0;

        return `
          <div class="padron-mobile-card" style="background: var(--surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div>
                <strong style="font-size: 14.5px; color: var(--text-main);">${v.nombres} ${v.apellidos}</strong>
                <div style="font-size: 11.5px; color: var(--text-dim); font-family: var(--mono-font); margin-top: 1px;">
                  ${v.codigo} &bull; DNI: ${v.dni}
                </div>
              </div>
              <span class="badge ${badgeEstadoClass}">${v.estado}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; margin-bottom: 10px; background: var(--surface-2); padding: 8px 10px; border-radius: var(--radius-sm);">
              <div><span style="color: var(--text-dim);">Sede:</span> <strong>${v.sedeAsignada}</strong> (${v.distrito})</div>
              <div><span style="color: var(--text-dim);">Tel:</span> <strong>${v.celular}</strong></div>
              <div><span style="color: var(--text-dim);">Servicio:</span> <span class="badge ${badgeServClass}" style="font-size: 10.5px;">${v.servicio}</span></div>
              <div><span style="color: var(--text-dim);">Rol:</span> <strong>${v.rol}</strong></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
              <div style="font-size: 11.5px; color: var(--text-muted); display: flex; gap: 10px; align-items: center;">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                  </svg>
                  ${capCount} cap.
                </span>
                ${v.canastasRecibidas > 0 ? `<span style="display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  ${v.canastasRecibidas} canastas
                </span>` : ''}
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn-action" style="padding: 4px 10px; font-size: 11.5px;" onclick="window.openFichaVoluntario ? window.openFichaVoluntario(${v.id}) : null">
                  Ficha
                </button>
                <button type="button" class="btn-action primary" style="padding: 4px 10px; font-size: 11.5px;" onclick="window.openEditVoluntario ? window.openEditVoluntario(${v.id}) : null">
                  Editar
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  },

  // Modal Inscripción (Ficha A4 / A5)
  openModalInscripcion(voluntarioId = null) {
    this._currentEditingId = voluntarioId;
    const modal = document.getElementById("modalInscripcionVoluntario");
    const titleEl = document.getElementById("modalInscripcionVoluntarioTitle");
    const form = document.getElementById("formInscripcionVoluntario");
    if (!modal) return;

    if (form) form.reset();

    if (voluntarioId) {
      const vol = VoluntarioModel.getById(voluntarioId);
      if (vol) {
        if (titleEl) titleEl.textContent = `Editar Ficha de Voluntario(a) • ${vol.codigo}`;
        this._setVal("volInputNombres", vol.nombres);
        this._setVal("volInputApellidos", vol.apellidos);
        this._setVal("volInputDni", vol.dni);
        this._setVal("volInputCelular", vol.celular);
        this._setVal("volInputFechaNac", vol.fechaNacimiento);
        this._setVal("volInputDomicilio", vol.domicilio);
        this._setVal("volSelectDistrito", vol.distrito);
        this._setVal("volSelectSede", vol.sedeAsignada);
        this._setVal("volSelectServicio", vol.servicio);
        this._setVal("volSelectRol", vol.rol);
        this._setVal("volSelectEstrategia", vol.estrategia);
        this._setVal("volSelectTipo", vol.tipoVoluntariado);
        this._setVal("volSelectEstado", vol.estado);
        this._setVal("volInputDisponibilidad", vol.disponibilidad);
        this._setVal("volInputObservaciones", vol.observaciones);
      }
    } else {
      if (titleEl) titleEl.textContent = "Nueva Ficha de Inscripción de Voluntario(a) (Ficha A4/A5)";
      this._setVal("volSelectDistrito", "Comas");
      this._setVal("volSelectSede", "Año Nuevo");
      this._setVal("volSelectServicio", "Desayuno Infantil");
      this._setVal("volSelectRol", "Voluntaria de Apoyo");
      this._setVal("volSelectEstrategia", "Atención Fija");
      this._setVal("volSelectTipo", "Distribución y Cocina");
      this._setVal("volSelectEstado", "Activo");
    }

    modal.classList.add("open");
  },

  closeModalInscripcion() {
    const modal = document.getElementById("modalInscripcionVoluntario");
    if (modal) modal.classList.remove("open");
    this._currentEditingId = null;
  },

  saveInscripcion(e) {
    if (e) e.preventDefault();
    const nombres = this._getVal("volInputNombres");
    const apellidos = this._getVal("volInputApellidos");
    const dni = this._getVal("volInputDni");
    const celular = this._getVal("volInputCelular");
    const fechaNacimiento = this._getVal("volInputFechaNac");
    const domicilio = this._getVal("volInputDomicilio");
    const distrito = this._getVal("volSelectDistrito");
    const sedeAsignada = this._getVal("volSelectSede");
    const servicio = this._getVal("volSelectServicio");
    const rol = this._getVal("volSelectRol");
    const estrategia = this._getVal("volSelectEstrategia");
    const tipoVoluntariado = this._getVal("volSelectTipo");
    const estado = this._getVal("volSelectEstado");
    const disponibilidad = this._getVal("volInputDisponibilidad");
    const observaciones = this._getVal("volInputObservaciones");

    if (!nombres || !apellidos || !dni) {
      alert("Por favor complete los campos obligatorios (Nombres, Apellidos y DNI).");
      return;
    }

    if (dni.length < 8) {
      alert("El DNI debe tener al menos 8 dígitos.");
      return;
    }

    const payload = {
      nombres,
      apellidos,
      dni,
      celular,
      fechaNacimiento,
      domicilio,
      distrito,
      sedeAsignada,
      servicio,
      rol,
      estrategia,
      tipoVoluntariado,
      estado,
      disponibilidad,
      observaciones
    };

    if (this._currentEditingId) {
      VoluntarioModel.update(this._currentEditingId, payload);
    } else {
      VoluntarioModel.create(payload);
    }

    this.closeModalInscripcion();
    this.render();
  },

  // Modal Ficha y Credencial del Voluntario
  openModalFicha(id) {
    const vol = VoluntarioModel.getById(id);
    if (!vol) return;

    this._setTxt("fichaVolNombreCompleto", `${vol.nombres} ${vol.apellidos}`);
    this._setTxt("fichaVolCodigo", vol.codigo);
    this._setTxt("fichaVolDni", vol.dni);
    this._setTxt("fichaVolCelular", vol.celular || "Sin teléfono");
    this._setTxt("fichaVolEdad", `${vol.edad} años (${vol.fechaNacimiento || 'Fecha N/A'})`);
    this._setTxt("fichaVolDomicilio", vol.domicilio || "No registrado");
    this._setTxt("fichaVolSede", `${vol.sedeAsignada} (${vol.distrito})`);
    this._setTxt("fichaVolServicio", vol.servicio);
    this._setTxt("fichaVolRol", vol.rol);
    this._setTxt("fichaVolEstrategia", `${vol.estrategia} &bull; ${vol.tipoVoluntariado}`);
    this._setTxt("fichaVolDisponibilidad", vol.disponibilidad || "Estándar");
    this._setTxt("fichaVolObservaciones", vol.observaciones || "Sin observaciones registradas.");
    this._setTxt("fichaVolCanastasCount", `${vol.canastasRecibidas || 0} canastas entregadas`);

    const estadoBadge = document.getElementById("fichaVolEstadoBadge");
    if (estadoBadge) {
      let badgeCls = vol.estado === "Activo" ? "badge-green" : (vol.estado === "En Pausa" ? "badge-yellow" : "badge-gray");
      estadoBadge.className = `badge ${badgeCls}`;
      estadoBadge.textContent = vol.estado;
    }

    // Capacitaciones list
    const capListEl = document.getElementById("fichaVolCapacitacionesList");
    if (capListEl) {
      const caps = vol.capacitaciones || [];
      if (caps.length === 0) {
        capListEl.innerHTML = `<div style="font-size: 12px; color: var(--text-dim); padding: 6px 0;">No registra capacitaciones oficiales aún.</div>`;
      } else {
        capListEl.innerHTML = caps.map(c => `
          <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border-subtle); font-size: 12.5px; color: var(--text-main);">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="color: var(--gt-green); flex-shrink: 0;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>${c}</span>
          </div>
        `).join("");
      }
    }

    // Action buttons inside modal
    const btnCap = document.getElementById("btnFichaVolRegistrarCap");
    if (btnCap) {
      btnCap.onclick = () => {
        this.closeModalFicha();
        this.openModalCapacitacion(vol.id);
      };
    }

    const btnCanasta = document.getElementById("btnFichaVolEntregarCanasta");
    if (btnCanasta) {
      btnCanasta.onclick = () => {
        VoluntarioModel.incrementCanasta(vol.id);
        this.render();
        this.openModalFicha(vol.id);
      };
    }

    const btnEdit = document.getElementById("btnFichaVolEditar");
    if (btnEdit) {
      btnEdit.onclick = () => {
        this.closeModalFicha();
        this.openModalInscripcion(vol.id);
      };
    }

    const modal = document.getElementById("modalFichaVoluntario");
    if (modal) modal.classList.add("open");
  },

  closeModalFicha() {
    const modal = document.getElementById("modalFichaVoluntario");
    if (modal) modal.classList.remove("open");
  },

  // Modal Registrar Capacitación (Ficha A6)
  openModalCapacitacion(voluntarioId) {
    const vol = VoluntarioModel.getById(voluntarioId);
    if (!vol) return;

    this._currentEditingId = voluntarioId;
    this._setTxt("modalCapVoluntariaNombre", `${vol.nombres} ${vol.apellidos} (${vol.sedeAsignada})`);

    const selectEl = document.getElementById("selectCapacitacionTematica");
    if (selectEl) {
      selectEl.innerHTML = TEMATICAS_CAPACITACION.map(t => {
        const isDone = (vol.capacitaciones || []).includes(t);
        return `<option value="${t}" ${isDone ? 'disabled' : ''}>${t} ${isDone ? '(Ya completado)' : ''}</option>`;
      }).join("");
    }

    const modal = document.getElementById("modalCapacitacionVoluntarias");
    if (modal) modal.classList.add("open");
  },

  closeModalCapacitacion() {
    const modal = document.getElementById("modalCapacitacionVoluntarias");
    if (modal) modal.classList.remove("open");
    this._currentEditingId = null;
  },

  saveCapacitacion() {
    if (!this._currentEditingId) return;
    const selectEl = document.getElementById("selectCapacitacionTematica");
    if (!selectEl || !selectEl.value) return;

    VoluntarioModel.addCapacitacion(this._currentEditingId, selectEl.value);
    
    // Check if canasta delivery checkbox was checked
    const chkCanasta = document.getElementById("chkEntregarCanastaCap");
    if (chkCanasta && chkCanasta.checked) {
      VoluntarioModel.incrementCanasta(this._currentEditingId);
      chkCanasta.checked = false;
    }

    this.closeModalCapacitacion();
    this.render();
  },

  // Exportar Padrón en CSV
  exportCSV() {
    const list = VoluntarioModel.getAll();
    if (list.length === 0) {
      alert("No hay registros de voluntariados para exportar.");
      return;
    }

    const headers = ["Código", "Nombres", "Apellidos", "DNI", "Celular", "Edad", "Distrito", "Sede Asignada", "Servicio", "Rol", "Estrategia", "Capacitaciones Completadas", "Canastas Recibidas", "Estado"];
    const rows = list.map(v => [
      `"${v.codigo}"`,
      `"${v.nombres}"`,
      `"${v.apellidos}"`,
      `"${v.dni}"`,
      `"${v.celular}"`,
      v.edad,
      `"${v.distrito}"`,
      `"${v.sedeAsignada}"`,
      `"${v.servicio}"`,
      `"${v.rol}"`,
      `"${v.estrategia}"`,
      `"${(v.capacitaciones || []).join('; ')}"`,
      v.canastasRecibidas || 0,
      `"${v.estado}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Padron_Voluntariados_PDI_Johannes_Gutenberg_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Helpers
  _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : "";
  },

  _getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  },

  _setTxt(id, txt) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = txt !== undefined && txt !== null ? txt : "";
  },

  clearSearch() {
    this._searchQuery = "";
    const input = document.getElementById("inputVoluntariosSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnVoluntariosSearchClear");
    if (clearBtn) clearBtn.style.display = "none";
    this.applyFilters();
    this._persistirFiltros();
  },

  toggleDistrito(dist) {
    if (dist === "all") {
      this._filterDistrito = [];
    } else {
      const idx = this._filterDistrito.indexOf(dist);
      if (idx > -1) this._filterDistrito.splice(idx, 1);
      else this._filterDistrito.push(dist);
    }
    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  toggleServicio(serv) {
    if (serv === "all") {
      this._filterServicio = [];
    } else {
      const idx = this._filterServicio.indexOf(serv);
      if (idx > -1) this._filterServicio.splice(idx, 1);
      else this._filterServicio.push(serv);
    }
    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  toggleRol(rol) {
    if (rol === "all") {
      this._filterRol = [];
    } else {
      const idx = this._filterRol.indexOf(rol);
      if (idx > -1) this._filterRol.splice(idx, 1);
      else this._filterRol.push(rol);
    }
    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  toggleEstado(estado) {
    this._filterEstado = estado;
    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  removeFilter(filterKey, specificVal) {
    if (filterKey === "distrito") {
      if (specificVal) this.toggleDistrito(specificVal);
      else this.toggleDistrito("all");
    }
    if (filterKey === "servicio") {
      if (specificVal) this.toggleServicio(specificVal);
      else this.toggleServicio("all");
    }
    if (filterKey === "rol") {
      if (specificVal) this.toggleRol(specificVal);
      else this.toggleRol("all");
    }
    if (filterKey === "estado") {
      this.toggleEstado("all");
    }
  },

  resetFilters() {
    this._searchQuery = "";
    this._filterDistrito = [];
    this._filterServicio = [];
    this._filterRol = [];
    this._filterEstado = "all";

    const input = document.getElementById("inputVoluntariosSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnVoluntariosSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  _updateDistritoDropdownUI() {
    const isAll = this._filterDistrito.length === 0;
    const items = document.querySelectorAll("#menuVoluntariosDistrito .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterDistrito.includes(v));
      }
    });

    const label = document.getElementById("labelVoluntariosDistritoSelect");
    if (label) {
      if (isAll) label.textContent = "Todos los Distritos";
      else if (this._filterDistrito.length === 1) label.textContent = this._filterDistrito[0];
      else label.textContent = `${this._filterDistrito.length} seleccionados`;
    }
  },

  _updateServicioDropdownUI() {
    const isAll = this._filterServicio.length === 0;
    const items = document.querySelectorAll("#menuVoluntariosServicio .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterServicio.includes(v));
      }
    });

    const label = document.getElementById("labelVoluntariosServicioSelect");
    if (label) {
      if (isAll) {
        label.textContent = "Todos los Servicios";
      } else if (this._filterServicio.length === 1) {
        label.textContent = SERVICIO_LABELS[this._filterServicio[0]] || this._filterServicio[0];
      } else {
        label.textContent = `${this._filterServicio.length} seleccionados`;
      }
    }
  },

  _updateEstadoDropdownUI() {
    const items = document.querySelectorAll("#menuVoluntariosEstado .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterEstado);
    });

    const label = document.getElementById("labelVoluntariosEstadoSelect");
    if (label) {
      label.textContent = this._filterEstado === "all" ? "Todos los Estados" : this._filterEstado;
    }
  },

  _updateFilterDropdownUI() {
    this._updateDistritoDropdownUI();
    this._updateServicioDropdownUI();
    this._updateEstadoDropdownUI();
  }
};

// Global handlers for window onclick bindings
if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.VoluntariadosView = VoluntariadosView;

  window.openInscripcionVoluntario = () => VoluntariadosView.openModalInscripcion();
  window.openEditVoluntario = (id) => VoluntariadosView.openModalInscripcion(id);
  window.openFichaVoluntario = (id) => VoluntariadosView.openModalFicha(id);
  window.closeModalInscripcionVoluntario = () => VoluntariadosView.closeModalInscripcion();
  window.closeModalFichaVoluntario = () => VoluntariadosView.closeModalFicha();
  window.closeModalCapacitacionVoluntarias = () => VoluntariadosView.closeModalCapacitacion();
  window.saveInscripcionVoluntario = (e) => VoluntariadosView.saveInscripcion(e);
  window.saveCapacitacionVoluntaria = () => VoluntariadosView.saveCapacitacion();
  window.removeVoluntarioChip = (k, v) => VoluntariadosView.removeFilter(k, v);
  window.resetVoluntariosFilters = () => VoluntariadosView.resetFilters();
  window.clearVoluntariosSearch = () => VoluntariadosView.clearSearch();
  window.exportVoluntariosCSV = () => VoluntariadosView.exportCSV();
  window.toggleVoluntariosDistrito = (d) => VoluntariadosView.toggleDistrito(d);
  window.toggleVoluntariosServicio = (s) => VoluntariadosView.toggleServicio(s);
  window.toggleVoluntariosRol = (r) => VoluntariadosView.toggleRol(r);
  window.toggleVoluntariosEstado = (e) => VoluntariadosView.toggleEstado(e);
  window.toggleVoluntariosInnerDropdown = function (dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains("open");
    // Cerrar los demás dropdowns internos del panel
    document.querySelectorAll("#menuVoluntariosFilterPanel .padron-inner-dropdown.open").forEach(d => {
      if (d !== dropdown) d.classList.remove("open");
    });
    dropdown.classList.toggle("open", !isOpen);
  };
}
