// Vista: Directorio Territorial de Sedes, Iglesias y Redes Aliadas
import { SedeModel } from '../models/SedeModel.js';

export const SedesView = {
  _allSedes: [],
  _filteredSedes: [],
  _selectedSedeId: null,
  _searchQuery: "",
  _filterDistrito: "all",
  _filterServicio: "all",

  init(sedes) {
    this._allSedes = sedes || (window.PDI?.SedeModel?.getAll() || SedeModel.getAll());
    this.render();
  },

  render(sedes) {
    if (sedes) {
      this._allSedes = sedes;
    } else {
      this._allSedes = window.PDI?.SedeModel?.getAll ? window.PDI.SedeModel.getAll() : SedeModel.getAll();
    }

    this.renderKpis();
    this.applyFilters();
  },

  renderKpis() {
    const kpiContainer = document.getElementById("sedesKpiContainer");
    if (!kpiContainer) return;

    const stats = window.PDI?.SedeModel?.getStats ? window.PDI.SedeModel.getStats() : SedeModel.getStats();

    kpiContainer.innerHTML = `
      <div class="sedes-metric-strip">
        <div class="sedes-metric-item">
          <div class="sedes-metric-icon green">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div class="sedes-metric-data">
            <span class="sedes-metric-num">${stats.sedesOperativas} / ${stats.totalSedes}</span>
            <span class="sedes-metric-lbl">Sedes Operativas</span>
          </div>
        </div>

        <div class="sedes-metric-divider"></div>

        <div class="sedes-metric-item">
          <div class="sedes-metric-icon blue">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div class="sedes-metric-data">
            <span class="sedes-metric-num">${stats.totalNinos} menores</span>
            <span class="sedes-metric-lbl">Cobertura Infantil</span>
          </div>
        </div>

        <div class="sedes-metric-divider"></div>

        <div class="sedes-metric-item">
          <div class="sedes-metric-icon yellow">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.125 1.125 0 0018.375 9.21H5.625A1.125 1.125 0 004.5 10.333V21h15z" />
            </svg>
          </div>
          <div class="sedes-metric-data">
            <span class="sedes-metric-num">${stats.totalAliados} aliados</span>
            <span class="sedes-metric-lbl">Red Pastoral e Iglesias</span>
          </div>
        </div>

        <div class="sedes-metric-divider"></div>

        <div class="sedes-metric-item">
          <div class="sedes-metric-icon purple">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
          </div>
          <div class="sedes-metric-data">
            <span class="sedes-metric-num">${stats.tasaOcupacionPromedio}% ocupación</span>
            <span class="sedes-metric-lbl">Aforo Instalado (${stats.totalAforo})</span>
          </div>
        </div>
      </div>
    `;
  },

  filterBySearch(query) {
    this._searchQuery = (query || "").trim().toLowerCase();
    const clearBtn = document.getElementById("btnSedesSearchClear");
    if (clearBtn) {
      clearBtn.style.display = this._searchQuery.length > 0 ? "flex" : "none";
    }
    this.applyFilters();
  },

  clearSearch() {
    const input = document.getElementById("inputSedesSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  filterByDistrito(distrito) {
    this._filterDistrito = distrito;
    this._updateDistritoDropdownUI();
    this.applyFilters();
  },

  filterByServicio(servicio) {
    this._filterServicio = servicio;
    this._updateServicioDropdownUI();
    this.applyFilters();
  },

  _updateDistritoDropdownUI() {
    const label = document.getElementById("labelSedesDistritoSelect");
    if (label) {
      if (this._filterDistrito === "all") label.textContent = "Todos los Distritos";
      else label.textContent = this._filterDistrito;
    }
    const items = document.querySelectorAll("#menuSedesDistrito .padron-dropdown-item");
    items.forEach(el => {
      const v = el.getAttribute("data-value");
      el.classList.toggle("selected", v === this._filterDistrito);
    });
  },

  _updateServicioDropdownUI() {
    const label = document.getElementById("labelSedesServicioSelect");
    const names = {
      "all": "Todos los Servicios",
      "Desayuno": "Servicio Alimentario Nutricional",
      "Casita": "Servicio de Acompañamiento Educativo",
      "Lonchera": "Lonchera Saludable"
    };
    if (label) {
      label.textContent = names[this._filterServicio] || "Todos los Servicios";
    }
    const items = document.querySelectorAll("#menuSedesServicio .padron-dropdown-item");
    items.forEach(el => {
      const v = el.getAttribute("data-value");
      el.classList.toggle("selected", v === this._filterServicio);
    });
  },

  resetFilters() {
    this._searchQuery = "";
    this._filterDistrito = "all";
    this._filterServicio = "all";

    const input = document.getElementById("inputSedesSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnSedesSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this._updateDistritoDropdownUI();
    this._updateServicioDropdownUI();
    this.applyFilters();
  },

  removeFilterChip(key) {
    if (key === "distrito") this.filterByDistrito("all");
    if (key === "servicio") this.filterByServicio("all");
    if (key === "search") this.clearSearch();
  },

  _updateActiveChips() {
    const chipsBar = document.getElementById("sedesActiveChipsBar");
    const chipsList = document.getElementById("sedesActiveChipsList");
    const badge = document.getElementById("sedesActiveFiltersCount");
    if (!chipsBar || !chipsList) return;

    let activeCount = 0;
    const chipsHTML = [];

    if (this._filterDistrito !== "all") {
      activeCount++;
      chipsHTML.push(`
        <span class="padron-chip">
          <span>Distrito: ${this._filterDistrito}</span>
          <button type="button" class="padron-chip-remove" onclick="window.PDI?.SedesView?.removeFilterChip('distrito')" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>
      `);
    }

    if (this._filterServicio !== "all") {
      activeCount++;
      const names = {
        "Desayuno": "Servicio Alimentario Nutricional",
        "Casita": "Acompañamiento Educativo",
        "Lonchera": "Lonchera Saludable"
      };
      chipsHTML.push(`
        <span class="padron-chip">
          <span>Servicio: ${names[this._filterServicio] || this._filterServicio}</span>
          <button type="button" class="padron-chip-remove" onclick="window.PDI?.SedesView?.removeFilterChip('servicio')" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>
      `);
    }

    if (badge) {
      if (activeCount > 0) {
        badge.textContent = activeCount;
        badge.style.display = "inline-flex";
      } else {
        badge.style.display = "none";
      }
    }

    if (activeCount > 0) {
      chipsList.innerHTML = chipsHTML.join("");
      chipsBar.style.display = "flex";
    } else {
      chipsList.innerHTML = "";
      chipsBar.style.display = "none";
    }
  },

  selectSede(id) {
    this._selectedSedeId = id;
    this.renderMasterList();
    this.renderDetailPanel();
  },

  applyFilters() {
    let filtered = [...this._allSedes];

    if (this._searchQuery) {
      const q = this._searchQuery;
      filtered = filtered.filter(s =>
        s.nombre.toLowerCase().includes(q) ||
        s.distrito.toLowerCase().includes(q) ||
        s.direccion.toLowerCase().includes(q) ||
        s.facilitadora.toLowerCase().includes(q) ||
        s.iglesiaAliada.toLowerCase().includes(q) ||
        s.pastorAliado.toLowerCase().includes(q)
      );
    }

    if (this._filterDistrito && this._filterDistrito !== "all") {
      filtered = filtered.filter(s => s.distrito.toLowerCase() === this._filterDistrito.toLowerCase());
    }

    if (this._filterServicio && this._filterServicio !== "all") {
      const srv = this._filterServicio.toLowerCase();
      filtered = filtered.filter(s =>
        s.servicios.some(sv => sv.toLowerCase().includes(srv))
      );
    }

    this._filteredSedes = filtered;

    const countBadge = document.getElementById("sedesCountBadge");
    const masterCountBadge = document.getElementById("sedesMasterCountBadge");
    const textCount = `${filtered.length} ${filtered.length === 1 ? 'sede' : 'sedes'}`;
    if (countBadge) countBadge.textContent = textCount;
    if (masterCountBadge) masterCountBadge.textContent = `${filtered.length}`;

    if (filtered.length > 0) {
      const exists = filtered.some(s => s.id === this._selectedSedeId);
      if (!exists) {
        this._selectedSedeId = filtered[0].id;
      }
    } else {
      this._selectedSedeId = null;
    }

    this._updateActiveChips();
    this.renderMasterList();
    this.renderDetailPanel();
  },

  renderMasterList() {
    const listContainer = document.getElementById("sedesMasterList");
    if (!listContainer) return;

    if (this._filteredSedes.length === 0) {
      listContainer.innerHTML = `
        <div class="sedes-empty-state">
          <div style="font-size:13px; color:var(--text-muted);">Sin resultados</div>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this._filteredSedes.map(s => {
      const isSelected = s.id === this._selectedSedeId;
      const pct = s.porcentajeOcupacion;
      let badgeClass = "badge-green";
      if (pct >= 95) badgeClass = "badge-red";
      else if (pct >= 80) badgeClass = "badge-yellow";

      return `
        <div class="sedes-master-item ${isSelected ? 'active' : ''}" onclick="window.PDI?.SedesView?.selectSede('${s.id}')">
          <div class="sedes-master-item-top">
            <span class="sedes-master-item-distrito">${s.distrito}</span>
            <span class="badge ${badgeClass}" style="font-size:10px; padding:1px 5px;">${pct}% Aforo</span>
          </div>
          <div class="sedes-master-item-name">Sede ${s.nombre}</div>
          <div class="sedes-master-item-sub">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>${s.facilitadora}</span>
          </div>
        </div>
      `;
    }).join("");
  },

  renderDetailPanel() {
    const panel = document.getElementById("sedesDetailPanel");
    if (!panel) return;

    if (!this._selectedSedeId) {
      panel.innerHTML = `
        <div class="sedes-detail-empty">
          <svg width="48" height="48" fill="none" stroke="var(--text-dim)" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <div style="font-size:16px; font-weight:700; color:var(--text-main); margin-top:8px;">Ninguna sede seleccionada</div>
          <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">Seleccione una sede del directorio lateral para examinar su ficha oficial.</div>
        </div>
      `;
      return;
    }

    const sede = this._allSedes.find(s => s.id === this._selectedSedeId);
    if (!sede) return;

    const pct = sede.porcentajeOcupacion;
    let barColor = "var(--gt-green)";
    let badgeAforoClass = "badge-green";
    if (pct >= 95) {
      barColor = "var(--gt-red)";
      badgeAforoClass = "badge-red";
    } else if (pct >= 80) {
      barColor = "var(--gt-yellow)";
      badgeAforoClass = "badge-yellow";
    }

    const mapQuery = encodeURIComponent(`${sede.direccion}, ${sede.distrito}, Lima, Peru`);
    const mapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

    const servicioLabels = {
      "Desayuno Infantil": "Servicio Alimentario Nutricional",
      "Casita del Saber": "Servicio de Acompañamiento Educativo",
      "Lonchera Infantil": "Lonchera Saludable"
    };

    panel.innerHTML = `
      <div class="sedes-detail-card">
        <!-- Header de la Ficha Técnica -->
        <div class="sedes-detail-header">
          <div class="sedes-detail-title-group">
            <div class="sedes-detail-avatar">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.125 1.125 0 0018.375 9.21H5.625A1.125 1.125 0 004.5 10.333V21h15z" />
              </svg>
            </div>
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
              <h2 class="sedes-detail-name" style="margin:0;">Sede ${sede.nombre}</h2>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="badge badge-green">${sede.distrito}</span>
                <span class="badge ${sede.estado === 'Operativa' ? 'badge-green' : 'badge-gray'}">${sede.estado}</span>
              </div>
            </div>
          </div>
          <div class="sedes-detail-actions">
            <a href="${mapsNavUrl}" target="_blank" class="btn-action btn-sede-map" title="Navegar en Google Maps">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934a1.12 1.12 0 01-1.006 0L9.503 3.31a1.125 1.125 0 00-1.006 0L3.623 5.748A1.125 1.125 0 003 6.754v11.926c0 .836.88 1.38 1.628 1.006l3.869-1.934a1.12 1.12 0 011.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <span>Ubicación GPS</span>
            </a>
            <button type="button" class="btn-action primary" onclick="window.filterPadronBySede ? window.filterPadronBySede('${sede.nombre}') : null">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>Ver Beneficiarios</span>
            </button>
          </div>
        </div>

        <!-- Cobertura y Capacidad de Aforo -->
        <div class="sedes-detail-section">
          <div class="sedes-section-title">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
            <span>Capacidad Instalada y Aforo</span>
          </div>
          <div class="sede-aforo-section" style="margin-top:8px;">
            <div class="sede-aforo-labels">
              <span class="sede-aforo-title">Inscritos vs Capacidad Máxima:</span>
              <span class="sede-aforo-count">
                <strong>${sede.ninosInscritos}</strong> / ${sede.aforoMax} menores
                <span class="badge ${badgeAforoClass}">${pct}% ocupado</span>
              </span>
            </div>
            <div class="sede-aforo-bar" style="height:10px;">
              <div class="sede-aforo-fill" style="width: ${pct}%; background: ${barColor};"></div>
            </div>
          </div>
        </div>

        <!-- Servicios Institucionales Activos -->
        <div class="sedes-detail-section">
          <div class="sedes-section-title">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Programas Institucionales en Operación</span>
          </div>
          <div class="sede-servicios-wrap" style="margin-top:8px; gap:8px;">
            ${sede.servicios.map(serv => {
              const displayServ = servicioLabels[serv] || serv;
              return `
                <span class="sede-servicio-pill" style="font-size:12px; padding:6px 12px;">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                  <span>${displayServ}</span>
                </span>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Grilla de Responsables y Red Pastoral -->
        <div class="sedes-detail-grid">
          <!-- Responsable de Sede -->
          <div class="sedes-grid-card">
            <div class="sedes-card-icon green">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <div class="sedes-card-label">Responsable / Facilitadora</div>
              <div class="sedes-card-val">${sede.facilitadora}</div>
              <div class="sedes-card-sub">${sede.facilitadoraCargo}</div>
              <a href="tel:${sede.facilitadoraTel.replace(/[^0-9]/g, '')}" class="sede-tel-link" style="margin-top:4px; display:inline-flex;">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>${sede.facilitadoraTel}</span>
              </a>
            </div>
          </div>

          <!-- Red Pastoral e Iglesia Aliada -->
          <div class="sedes-grid-card">
            <div class="sedes-card-icon yellow">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.125 1.125 0 0018.375 9.21H5.625A1.125 1.125 0 004.5 10.333V21h15z" />
              </svg>
            </div>
            <div>
              <div class="sedes-card-label">${sede.tipoAliado}</div>
              <div class="sedes-card-val">${sede.iglesiaAliada}</div>
              <div class="sedes-card-sub">${sede.pastorAliado}</div>
            </div>
          </div>
        </div>

        <!-- Dirección Territorial y Referencia -->
        <div class="sedes-detail-section" style="margin-top:16px;">
          <div class="sedes-section-title">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>Dirección Física y Referencias de Campo</span>
          </div>
          <div style="margin-top:6px; font-size:13.5px; color:var(--text-main); font-weight:600;">
            ${sede.direccion}
          </div>
          <div style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">
            Referencia: ${sede.referencia}
          </div>
        </div>
      </div>
    `;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SedesView = SedesView;

  window.filterSedesSearch = function (val) {
    if (window.PDI?.SedesView) window.PDI.SedesView.filterBySearch(val);
  };
  window.clearSedesSearch = function () {
    if (window.PDI?.SedesView) window.PDI.SedesView.clearSearch();
  };
  window.filterSedesByDistrito = function (dist) {
    if (window.PDI?.SedesView) window.PDI.SedesView.filterByDistrito(dist);
  };
  window.filterSedesByServicio = function (serv) {
    if (window.PDI?.SedesView) window.PDI.SedesView.filterByServicio(serv);
  };
  window.clearSedesFilters = function () {
    if (window.PDI?.SedesView) window.PDI.SedesView.resetFilters();
  };
  window.toggleSedesInnerDropdown = function (dropdownId) {
    const el = document.getElementById(dropdownId);
    if (el) el.classList.toggle("open");
  };
}
