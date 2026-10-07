// Vista: Padrón y Gestión de Voluntariados y Personal Comunitario (PDI)
// Asociación Cultural Johannes Gutenberg - Lima Norte

import { VoluntarioModel, TEMATICAS_CAPACITACION } from '../models/VoluntarioModel.js';
import { crear as crearFiltros } from '../utils/Filters.js';
import { Responsive } from '../utils/Responsive.js';
import { AnimationEngine } from '../utils/AnimationEngine.js';
import { ToastView } from './ToastView.js';
import { AuditModel } from '../models/AuditModel.js';
import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";
// Etiquetas cortas para los nombres largos de servicio (chips y dropdowns de filtro)

// Sedes agrupadas por distrito para sincronización en modales
const SEDES_POR_DISTRITO = {
  "Comas": ["Año Nuevo", "La Libertad", "Carmen Alto"],
  "Carabayllo": ["El Progreso", "Torre Blanca", "San Pedro", "Los Bendecidos", "Santa Rosa"]
};
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
  _filteredList: [],
  _haEntrado: false,
  _lastRenderSerial: "",

  reiniciarEntrada() {
    this._haEntrado = false;
    this._lastRenderSerial = "";
  },

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

  render(forzarAnimacion = false) {
    const esPrimeraEntrada = !this._haEntrado || forzarAnimacion;
    this._haEntrado = true;

    this._leerFiltrosDeURL();
    this._voluntarios = VoluntarioModel.getAll();
    this._renderKPIs(esPrimeraEntrada);
    this._renderActiveChips();
    this._vigilarVariante();
    this.applyFilters(esPrimeraEntrada);
  },

  /**
   * Se suscribe una sola vez por carga al cruce del corte de 768 px. Cuando se
   * cruza hay que repintar, porque la variante que estaba vacia es la que pasa
   * a verse: solo se dibuja la que se ve, y no las dos.
   */
  _vigilarVariante() {
    if (this._vigilaVariante) return;
    this._vigilaVariante = true;
    Responsive.alCambiarDeVariante(() => this.applyFilters(false));
  },

  _renderKPIs(animar = false) {
    const stats = VoluntarioModel.getStats();
    
    // Las cifras ruedan en odómetro orgánico en la primera entrada sin parpadear en refrescos
    const rollKPI = (el, val) => {
      if (!el) return;
      if (animar) {
        AnimationEngine.odometerRoll(el, val);
      } else if (!el.querySelector(".odometer-wrap")) {
        el.textContent = val;
      }
    };

    rollKPI(document.getElementById("kpiVoluntariosTotal"), stats.total);

    const kpiActivos = document.getElementById("kpiVoluntariosActivos");
    if (kpiActivos) kpiActivos.textContent = `${stats.activos} activas`;

    rollKPI(document.getElementById("kpiVoluntariosDesayuno"), stats.desayuno);
    rollKPI(document.getElementById("kpiVoluntariosCasitas"), stats.casita);
    rollKPI(document.getElementById("kpiVoluntariosCanastas"), stats.canastasTotal);

    const badgeNav = document.getElementById("badgeTotalVoluntarios");
    if (badgeNav) badgeNav.textContent = stats.total;
  },

  applyFilters(animar = true) {
    let list = [...this._voluntarios];

    // Búsqueda inteligente: insensible a tildes y búsqueda de nombre completo
    if (this._searchQuery) {
      const normalize = s => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const q = normalize(this._searchQuery);
      list = list.filter(v => {
        const fullName = `${normalize(v.nombres)} ${normalize(v.apellidos)}`;
        const reverseName = `${normalize(v.apellidos)} ${normalize(v.nombres)}`;
        return fullName.includes(q) ||
          reverseName.includes(q) ||
          (v.dni && v.dni.includes(q)) ||
          (v.codigo && normalize(v.codigo).includes(q)) ||
          (v.sedeAsignada && normalize(v.sedeAsignada).includes(q)) ||
          (v.distrito && normalize(v.distrito).includes(q)) ||
          (v.servicio && normalize(v.servicio).includes(q)) ||
          (v.rol && normalize(v.rol).includes(q)) ||
          (v.celular && v.celular.includes(q));
      });
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

    const serial = `${this._searchQuery}_${this._filterDistrito.join(',')}_${this._filterServicio.join(',')}_${this._filterRol.join(',')}_${this._filterEstado}_` +
      list.map(v => `${v.id}_${v.estado}`).join('|');

    const tbody = document.getElementById("tbodyVoluntarios");
    const mobileContainer = document.getElementById("mobileCardsVoluntarios");
    const hasContent = (tbody && tbody.children.length > 0) || (mobileContainer && mobileContainer.children.length > 0);

    if (!animar && this._lastRenderSerial === serial && hasContent) {
      return;
    }
    this._lastRenderSerial = serial;

    const countHeaderEl = document.getElementById("voluntariosRecordsCount");
    if (countHeaderEl) {
      countHeaderEl.textContent = `Mostrando ${list.length} de ${this._voluntarios.length} voluntarias y personal comunitario`;
    }

    this._filteredList = list;
    this._updateActiveFilterBadge();
    this._renderActiveChips();
    this._renderTableAndCards(list);

    // La entrada se dispara solo cuando corresponde (primera carga o filtro manual)
    if (animar) {
      AnimationEngine.entradaEscalonada("tbodyVoluntarios", ":scope > tr", { paso: 22, maxDesfase: 10 });
      AnimationEngine.entradaEscalonada("mobileCardsVoluntarios", ":scope > *", { paso: 22, maxDesfase: 10 });
    }
  },

  _updateActiveFilterBadge() {
    const count = this._filterDistrito.length
      + this._filterServicio.length
      + this._filterRol.length
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
          <span>${escapar(chip.label)}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeVoluntarioChip ? window.removeVoluntarioChip('${escaparEnManejador(chip.id)}', '${escaparEnManejador(chip.val || '')}') : null" title="Eliminar filtro">
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

    // Solo se dibuja la variante que se va a ver. La lista de tarjetas
    // ocupaba 240 de los 1397 nodos del documento y 29 KB de marcado, y se
    // regeneraba en cada pulsacion del buscador. Al cruzar el corte,
    // _vigilarVariante() repinta.
    const enMovil = Responsive.esMovil();

    // La que no se dibuja se vacia, y no se deja con lo que hubiera de antes:
    // si no, girar el movil con la ventana sola dejaria las dos pintadas.
    if (enMovil) { if (tbody) tbody.innerHTML = ""; }
    else { if (mobileContainer) mobileContainer.innerHTML = ""; }

    if (voluntarios.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px 16px;">
            <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 50%; background: var(--gt-green-bg); display: flex; align-items: center; justify-content: center; color: var(--gt-green);">
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
      if (tbody && !enMovil) tbody.innerHTML = emptyHtml;

      if (mobileContainer && enMovil) {
        mobileContainer.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; background: var(--surface-1); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 8px;">
            <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 50%; background: var(--gt-green-bg); display: flex; align-items: center; justify-content: center; color: var(--gt-green);">
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
    if (tbody && !enMovil) {
      tbody.innerHTML = voluntarios.map(v => {
        let badgeServClass = "badge-green";
        let servDotClass = "dot-green";
        let servColorClass = "serv-desayuno";
        if (v.servicio === "Casita del Saber") {
          badgeServClass = "badge-yellow";
          servDotClass = "dot-amber";
          servColorClass = "serv-casita";
        }
        if (v.servicio === "Área Social Pastoral (ASP)") {
          badgeServClass = "badge-blue";
          servDotClass = "dot-blue";
          servColorClass = "serv-pastoral";
        }

        let badgeEstadoClass = v.estado === "Activo" ? "badge-green" : (v.estado === "En Pausa" ? "badge-yellow" : "badge-gray");
        let estadoDotClass = v.estado === "Activo" ? "dot-green" : (v.estado === "En Pausa" ? "dot-amber" : "dot-gray");
        const capCount = (v.capacitaciones && v.capacitaciones.length) || 0;

        return `
          <tr class="padron-tr">
            <td>
              <div class="padron-user-cell">
                <div class="padron-avatar ${servColorClass}">
                  ${escapar(v.nombres.charAt(0))}${escapar(v.apellidos.charAt(0))}
                </div>
                <div class="padron-user-info">
                  <div class="padron-user-name">${escapar(v.nombres)} ${escapar(v.apellidos)}</div>
                  <div class="padron-user-meta">
                    <span class="padron-code">${escapar(v.codigo)}</span>
                    <span class="padron-meta-sep">&bull;</span>
                    <span>DNI ${escapar(v.dni)}</span>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="padron-location-title">${escapar(v.sedeAsignada)}</div>
              <div class="padron-location-sub">${escapar(v.distrito)} &bull; ${escapar(v.estrategia)}</div>
            </td>
            <td>
              <div class="padron-service-stack">
                <span class="badge ${badgeServClass} padron-service-badge">
                  <span class="padron-dot ${servDotClass}"></span>
                  ${escapar(v.servicio)}
                </span>
                <button type="button" class="padron-role-pill" onclick="window.toggleVoluntariosRol ? window.toggleVoluntariosRol('${escaparEnManejador(v.rol)}') : null" title="Filtrar por rol: ${escapar(v.rol)}">
                  ${escapar(v.rol)}
                </button>
              </div>
            </td>
            <td>
              <div class="padron-contact-phone">${escapar(v.celular)}</div>
              <div class="padron-contact-sub">${v.edad ? `${escapar(v.edad)} años` : "Edad no reg."}</div>
            </td>
            <td>
              <div class="padron-rewards-wrap">
                <span class="padron-metric-chip chip-talleres" title="Talleres de capacitación">
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                  </svg>
                  <span>${capCount} taller${capCount === 1 ? '' : 'es'}</span>
                </span>
                ${v.canastasRecibidas > 0 ? `
                  <span class="padron-metric-chip chip-canastas" title="Canastas de alimentos entregadas">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <span>${v.canastasRecibidas} canasta${v.canastasRecibidas === 1 ? '' : 's'}</span>
                  </span>
                ` : ''}
              </div>
            </td>
            <td>
              <span class="badge ${badgeEstadoClass} padron-status-badge">
                <span class="padron-dot ${estadoDotClass}"></span>
                ${escapar(v.estado)}
              </span>
            </td>
            <td style="text-align: right;">
              <div class="padron-table-actions">
                <button type="button" class="padron-btn-ficha" onclick="window.openFichaVoluntario ? window.openFichaVoluntario(${escaparEnManejador(v.id)}) : null" title="Ver Ficha y Credencial">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.364a4.125 4.125 0 00-6.338 0" />
                  </svg>
                  <span>Ficha</span>
                </button>
                <button type="button" class="padron-btn-edit" onclick="window.openEditVoluntario ? window.openEditVoluntario(${escaparEnManejador(v.id)}) : null" title="Editar Voluntario">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                  <span>Editar</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    // Render Cards (Mobile)
    if (mobileContainer && enMovil) {
      mobileContainer.innerHTML = voluntarios.map(v => {
        let badgeServClass = "badge-green";
        let servDotClass = "dot-green";
        let servColorClass = "serv-desayuno";
        if (v.servicio === "Casita del Saber") {
          badgeServClass = "badge-yellow";
          servDotClass = "dot-amber";
          servColorClass = "serv-casita";
        }
        if (v.servicio === "Área Social Pastoral (ASP)") {
          badgeServClass = "badge-blue";
          servDotClass = "dot-blue";
          servColorClass = "serv-pastoral";
        }

        let badgeEstadoClass = v.estado === "Activo" ? "badge-green" : (v.estado === "En Pausa" ? "badge-yellow" : "badge-gray");
        let estadoDotClass = v.estado === "Activo" ? "dot-green" : (v.estado === "En Pausa" ? "dot-amber" : "dot-gray");
        const capCount = (v.capacitaciones && v.capacitaciones.length) || 0;

        return `
          <div class="padron-mobile-card">
            <!-- Header: Avatar + Nombre + Estado -->
            <div class="padron-mcard-header">
              <div class="padron-mcard-identity">
                <div class="padron-avatar padron-mcard-avatar ${servColorClass}">
                  ${escapar(v.nombres.charAt(0))}${escapar(v.apellidos.charAt(0))}
                </div>
                <div class="padron-mcard-title-group">
                  <div class="padron-mcard-name">${escapar(v.nombres)} ${escapar(v.apellidos)}</div>
                  <div class="padron-user-meta">
                    <span class="padron-code">${escapar(v.codigo)}</span>
                    <span class="padron-meta-sep">&bull;</span>
                    <span>DNI ${escapar(v.dni)}</span>
                  </div>
                </div>
              </div>
              <span class="badge ${badgeEstadoClass} padron-status-badge">
                <span class="padron-dot ${estadoDotClass}"></span>
                ${escapar(v.estado)}
              </span>
            </div>

            <!-- Datos limpios sin caja interna (Anti-containeritis) -->
            <div class="padron-mcard-body">
              <div class="padron-mcard-detail-item">
                <span class="padron-mcard-detail-label">Sede / Territorio</span>
                <div class="padron-mcard-detail-val">
                  <strong>${escapar(v.sedeAsignada)}</strong>
                  <span class="padron-mcard-detail-sub">(${escapar(v.distrito)})</span>
                </div>
              </div>

              <div class="padron-mcard-detail-item">
                <span class="padron-mcard-detail-label">Contacto</span>
                <div class="padron-mcard-detail-val">
                  <a href="tel:${escapar(v.celular)}" class="padron-mcard-phone-link">${escapar(v.celular)}</a>
                </div>
              </div>

              <div class="padron-mcard-detail-item">
                <span class="padron-mcard-detail-label">Servicio</span>
                <span class="badge ${badgeServClass} padron-service-badge">
                  <span class="padron-dot ${servDotClass}"></span>
                  ${escapar(v.servicio)}
                </span>
              </div>

              <div class="padron-mcard-detail-item">
                <span class="padron-mcard-detail-label">Rol</span>
                <button type="button" class="padron-role-pill" onclick="window.toggleVoluntariosRol ? window.toggleVoluntariosRol('${escaparEnManejador(v.rol)}') : null" title="Filtrar por rol: ${escapar(v.rol)}">
                  ${escapar(v.rol)}
                </button>
              </div>
            </div>

            <!-- Footer: Métricas comunitarias + Acciones primarias -->
            <div class="padron-mcard-footer">
              <div class="padron-rewards-wrap">
                <span class="padron-metric-chip chip-talleres">
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                  </svg>
                  <span>${capCount} cap.</span>
                </span>
                ${v.canastasRecibidas > 0 ? `
                  <span class="padron-metric-chip chip-canastas">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <span>${v.canastasRecibidas}</span>
                  </span>
                ` : ''}
              </div>
              <div class="padron-mcard-actions">
                <button type="button" class="padron-btn-ficha" onclick="window.openFichaVoluntario ? window.openFichaVoluntario(${escaparEnManejador(v.id)}) : null">
                  Ficha
                </button>
                <button type="button" class="padron-btn-edit" onclick="window.openEditVoluntario ? window.openEditVoluntario(${escaparEnManejador(v.id)}) : null">
                  Editar
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  },


  handleDistritoChange(distrito) {
    this.updateSedeSelectOptions(distrito);
  },

  updateSedeSelectOptions(distrito, selectedSede = null) {
    const sedeSelect = document.getElementById("volSelectSede");
    if (!sedeSelect) return;
    const sedes = SEDES_POR_DISTRITO[distrito] || SEDES_POR_DISTRITO["Comas"];
    sedeSelect.innerHTML = sedes.map(s => `
      <option value="${s}" ${selectedSede === s ? 'selected' : ''}>${s} (${distrito})</option>
    `).join("");
    if (!selectedSede && sedes.length > 0) {
      sedeSelect.value = sedes[0];
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
        this._setVal("volSelectDistrito", vol.distrito || "Comas");
        this.updateSedeSelectOptions(vol.distrito || "Comas", vol.sedeAsignada);
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
      this.updateSedeSelectOptions("Comas", "Año Nuevo");
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
      ToastView.show("Campos Incompletos", "Por favor complete los campos obligatorios (Nombres, Apellidos y DNI).", "warning");
      return;
    }

    if (!/^\d{8}$/.test(dni)) {
      ToastView.show("DNI Inválido", "El DNI peruano debe contener exactamente 8 dígitos numéricos.", "danger");
      return;
    }

    // Validación de DNI único para evitar duplicados accidentales
    const existing = VoluntarioModel.getByDni(dni);
    if (existing && String(existing.id) !== String(this._currentEditingId || "")) {
      ToastView.show("DNI Duplicado", `Ya existe un registro a nombre de ${existing.nombres} ${existing.apellidos} con el DNI ${dni}.`, "danger");
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

    let savedRecord = null;
    if (this._currentEditingId) {
      savedRecord = VoluntarioModel.update(this._currentEditingId, payload);
      ToastView.show("Ficha Actualizada", `Los datos de ${nombres} ${apellidos} se guardaron exitosamente.`, "success");
      if (AuditModel && AuditModel.log) {
        AuditModel.log("Sistema", "Coordinación", "Actualización de Voluntario", payload.dni, `Ficha de ${nombres} ${apellidos} editada`);
      }
    } else {
      savedRecord = VoluntarioModel.create(payload);
      ToastView.show("Inscripción Exitosa", `Se registró a ${nombres} ${apellidos} en el padrón de voluntariados.`, "success");
      if (AuditModel && AuditModel.log) {
        AuditModel.log("Sistema", "Coordinación", "Alta de Voluntario", payload.dni, `Inscripción de ${nombres} ${apellidos} (${payload.sedeAsignada})`);
      }
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
    this._setTxt("fichaVolFechaIngreso", vol.fechaIngreso || "No registrada");
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
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="color: var(--text-brand); flex-shrink: 0;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>${escapar(c)}</span>
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
        const updated = VoluntarioModel.incrementCanasta(vol.id);
        this.render();
        this.openModalFicha(vol.id);
        const total = (updated && updated.canastasRecibidas) || (vol.canastasRecibidas || 0) + 1;
        ToastView.show("Canasta Entregada", `Se acreditó una canasta de estímulo a ${vol.nombres} ${vol.apellidos} (Total: ${total}).`, "success");
        if (AuditModel && AuditModel.log) {
          AuditModel.log("Sistema", "Coordinación", "Entrega de Canasta", vol.codigo, `Canasta entregada a ${vol.nombres} ${vol.apellidos}`);
        }
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

    const vol = VoluntarioModel.getById(this._currentEditingId);
    VoluntarioModel.addCapacitacion(this._currentEditingId, selectEl.value);
    
    // Check if canasta delivery checkbox was checked
    const chkCanasta = document.getElementById("chkEntregarCanastaCap");
    if (chkCanasta && chkCanasta.checked) {
      VoluntarioModel.incrementCanasta(this._currentEditingId);
      chkCanasta.checked = false;
    }

    ToastView.show("Capacitación Registrada", `Taller "${selectEl.value}" acreditado para ${vol ? vol.nombres : 'voluntaria'}.`, "success");
    if (AuditModel && AuditModel.log && vol) {
      AuditModel.log("Sistema", "Coordinación", "Capacitación Voluntaria", vol.codigo, `Taller "${selectEl.value}" registrado`);
    }

    this.closeModalCapacitacion();
    this.render();
  },

  // Exportar Padrón en CSV
  exportCSV() {
    const list = (this._filteredList && this._filteredList.length > 0) ? this._filteredList : VoluntarioModel.getAll();
    if (list.length === 0) {
      ToastView.show("Sin Registros", "No hay registros de voluntariados para exportar.", "warning");
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
    ToastView.show("Padrón Exportado", `Se descargó el reporte CSV con ${list.length} voluntaria(s).`, "info");
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


  _updateRolDropdownUI() {
    const isAll = this._filterRol.length === 0;
    const items = document.querySelectorAll("#menuVoluntariosRol .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterRol.includes(v));
      }
    });

    const label = document.getElementById("labelVoluntariosRolSelect");
    if (label) {
      if (isAll) {
        label.textContent = "Todos los Roles";
      } else if (this._filterRol.length === 1) {
        label.textContent = this._filterRol[0];
      } else {
        label.textContent = `${this._filterRol.length} seleccionados`;
      }
    }
  },

  _updateFilterDropdownUI() {
    this._updateDistritoDropdownUI();
    this._updateServicioDropdownUI();
    this._updateRolDropdownUI();
    this._updateEstadoDropdownUI();
  }
};

// Global handlers for window onclick bindings
//
// Los de abrir y guardar son de esta pagina, asi que viven aqui. Los de cerrar el
// modal no: los botones de cerrar estan en el chrome, que va en las diez paginas,
// y esta vista solo se importa en la suya. Esos cuatro los define
// legacy-globals.js, para que existan tambien donde la vista no esta cargada. Un
// puente, un solo dueno: antes cada uno estaba definido aqui y alla, y ganaba el
// ultimo en evaluarse.
if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.VoluntariadosView = VoluntariadosView;

  window.openInscripcionVoluntario = () => VoluntariadosView.openModalInscripcion();
  window.openEditVoluntario = (id) => VoluntariadosView.openModalInscripcion(id);
  window.openFichaVoluntario = (id) => VoluntariadosView.openModalFicha(id);
  window.saveInscripcionVoluntario = (e) => VoluntariadosView.saveInscripcion(e);
  window.removeVoluntarioChip = (k, v) => VoluntariadosView.removeFilter(k, v);
  window.resetVoluntariosFilters = () => VoluntariadosView.resetFilters();
  window.clearVoluntariosSearch = () => VoluntariadosView.clearSearch();
  window.exportVoluntariosCSV = () => VoluntariadosView.exportCSV();
  window.toggleVoluntariosDistrito = (d) => VoluntariadosView.toggleDistrito(d);
  window.toggleVoluntariosServicio = (s) => VoluntariadosView.toggleServicio(s);
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
