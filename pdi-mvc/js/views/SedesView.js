// Vista: Directorio Territorial de Sedes, Iglesias y Redes Aliadas
import { SedeModel } from '../models/SedeModel.js';

export const SedesView = {
  _allSedes: [],
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
      <div class="kpi-card" style="border-left: 4px solid var(--gt-green);">
        <div class="kpi-icon-box" style="background: var(--gt-green-bg); color: var(--gt-green);">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Sedes Operativas</span>
          <span class="kpi-value" style="color: var(--gt-green);">${stats.sedesOperativas} / ${stats.totalSedes}</span>
          <span class="kpi-subtext" style="font-size:11px; color:var(--text-dim);">Comas y Carabayllo 100% Activas</span>
        </div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid var(--gt-blue);">
        <div class="kpi-icon-box" style="background: var(--gt-blue-bg); color: var(--gt-blue);">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Niños en Cobertura</span>
          <span class="kpi-value" style="color: var(--gt-blue);">${stats.totalNinos} menores</span>
          <span class="kpi-subtext" style="font-size:11px; color:var(--text-dim);">Matriculados en sedes PDI</span>
        </div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid var(--gt-yellow);">
        <div class="kpi-icon-box" style="background: var(--gt-yellow-bg); color: var(--gt-yellow);">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.125 1.125 0 0018.375 9.21H5.625A1.125 1.125 0 004.5 10.333V21h15z" />
          </svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Iglesias y Aliados</span>
          <span class="kpi-value" style="color: var(--gt-yellow);">${stats.totalAliados} instituciones</span>
          <span class="kpi-subtext" style="font-size:11px; color:var(--text-dim);">Red comunitaria y pastoral</span>
        </div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid var(--gt-purple);">
        <div class="kpi-icon-box" style="background: var(--gt-purple-bg); color: var(--gt-purple);">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
          </svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Aforo Promedio</span>
          <span class="kpi-value" style="color: var(--gt-purple);">${stats.tasaOcupacionPromedio}%</span>
          <span class="kpi-subtext" style="font-size:11px; color:var(--text-dim);">Capacidad instalada: ${stats.totalAforo}</span>
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
    const items = document.querySelectorAll(".sedes-chip-distrito");
    items.forEach(el => {
      const v = el.getAttribute("data-distrito");
      el.classList.toggle("active", v === distrito);
    });
    this.applyFilters();
  },

  filterByServicio(servicio) {
    this._filterServicio = servicio;
    const items = document.querySelectorAll(".sedes-chip-servicio");
    items.forEach(el => {
      const v = el.getAttribute("data-servicio");
      el.classList.toggle("active", v === servicio);
    });
    this.applyFilters();
  },

  applyFilters() {
    const grid = document.getElementById("sedesGridContainer");
    const countBadge = document.getElementById("sedesCountBadge");
    if (!grid) return;

    let filtered = [...this._allSedes];

    // 1. Búsqueda de texto
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

    // 2. Filtro de distrito
    if (this._filterDistrito && this._filterDistrito !== "all") {
      filtered = filtered.filter(s => s.distrito.toLowerCase() === this._filterDistrito.toLowerCase());
    }

    // 3. Filtro de servicio
    if (this._filterServicio && this._filterServicio !== "all") {
      const srv = this._filterServicio.toLowerCase();
      filtered = filtered.filter(s =>
        s.servicios.some(sv => sv.toLowerCase().includes(srv))
      );
    }

    if (countBadge) {
      countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'sede encontrada' : 'sedes encontradas'}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; background: var(--surface-1); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          <svg width="40" height="40" fill="none" stroke="var(--text-dim)" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 12px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">No se encontraron sedes</div>
          <div style="font-size: 13px; color: var(--text-muted); max-width: 420px; margin: 0 auto;">No hay locales que coincidan con los criterios de búsqueda o filtros seleccionados.</div>
          <button type="button" class="btn-action" style="margin-top: 14px; display: inline-flex;" onclick="window.clearSedesFilters ? window.clearSedesFilters() : null">
            Limpiar filtros
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(sede => {
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

      // Homologar visualización de nombres de servicios
      const servicioLabels = {
        "Desayuno Infantil": "Desayuno Nutricional",
        "Casita del Saber": "Acompañamiento Educativo",
        "Lonchera Infantil": "Lonchera Saludable"
      };

      return `
        <div class="sede-card">
          <!-- Cabecera de Sede Renovada -->
          <div class="sede-card-header">
            <div class="sede-header-identity">
              <div class="sede-avatar-box" title="Sede Territorial PDI">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.125 1.125 0 0018.375 9.21H5.625A1.125 1.125 0 004.5 10.333V21h15z" />
                </svg>
              </div>
              <div class="sede-header-info">
                <span class="sede-distrito-tag">${sede.distrito}</span>
                <h3 class="sede-card-title">Sede ${sede.nombre}</h3>
              </div>
            </div>
            <div class="sede-header-badge">
              <span class="badge ${sede.estado === 'Operativa' ? 'badge-green' : 'badge-gray'}">${sede.estado}</span>
            </div>
          </div>

          <!-- Servicios Institucionales Homologados (SVGs específicos) -->
          <div class="sede-servicios-wrap">
            ${sede.servicios.map(serv => {
              const displayServ = servicioLabels[serv] || serv;
              let sIcon = `
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
              `;
              if (serv.toLowerCase().includes("desayuno") || serv.toLowerCase().includes("nutricional")) {
                sIcon = `
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                `;
              } else if (serv.toLowerCase().includes("casita") || serv.toLowerCase().includes("educativ")) {
                sIcon = `
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                `;
              } else if (serv.toLowerCase().includes("lonchera")) {
                sIcon = `
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                `;
              }
              return `
                <span class="sede-servicio-pill">
                  ${sIcon}
                  <span>${displayServ}</span>
                </span>
              `;
            }).join("")}
          </div>

          <!-- Barra de Aforo y Ocupación Pulida -->
          <div class="sede-aforo-section">
            <div class="sede-aforo-labels">
              <span class="sede-aforo-title">Aforo y Capacidad:</span>
              <span class="sede-aforo-count">
                <strong>${sede.ninosInscritos}</strong> / ${sede.aforoMax} beneficiarios
                <span class="badge ${badgeAforoClass}" style="font-size:10.5px; padding:1px 6px;">${pct}%</span>
              </span>
            </div>
            <div class="sede-aforo-bar">
              <div class="sede-aforo-fill" style="width: ${pct}%; background: ${barColor};"></div>
            </div>
          </div>

          <!-- Grid de Detalles Operativos con Iconos Nítidos -->
          <div class="sede-info-grid">
            <!-- Facilitadora a Cargo -->
            <div class="sede-info-item">
              <div class="sede-info-label">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span>Responsable de Sede:</span>
              </div>
              <div class="sede-info-val">${sede.facilitadora}</div>
              <div class="sede-info-sub">
                <span>${sede.facilitadoraCargo}</span>
                <a href="tel:${sede.facilitadoraTel.replace(/[^0-9]/g, '')}" class="sede-tel-link" title="Llamar al ${sede.facilitadoraTel}">
                  <svg width="10.5" height="10.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span>${sede.facilitadoraTel}</span>
                </a>
              </div>
            </div>

            <!-- Iglesia o Institución Aliada -->
            <div class="sede-info-item">
              <div class="sede-info-label">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.125 1.125 0 0018.375 9.21H5.625A1.125 1.125 0 004.5 10.333V21h15z" />
                </svg>
                <span>${sede.tipoAliado}:</span>
              </div>
              <div class="sede-info-val">${sede.iglesiaAliada}</div>
              <div class="sede-info-sub" style="color:var(--text-muted);">${sede.pastorAliado}</div>
            </div>

            <!-- Dirección Física y Ubicación -->
            <div class="sede-info-item sede-info-address">
              <div class="sede-info-label">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>Ubicación y Referencia:</span>
              </div>
              <div class="sede-info-val">
                ${sede.direccion}
                <div style="font-size:11px; font-weight:normal; color:var(--text-dim); margin-top:2px;">Ref: ${sede.referencia}</div>
              </div>
            </div>
          </div>

          <!-- Pie de Acciones de Sede -->
          <div class="sede-card-footer">
            <a href="${mapsNavUrl}" target="_blank" class="btn-action btn-sede-map" title="Abrir ubicación en Google Maps">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934a1.12 1.12 0 01-1.006 0L9.503 3.31a1.125 1.125 0 00-1.006 0L3.623 5.748A1.125 1.125 0 003 6.754v11.926c0 .836.88 1.38 1.628 1.006l3.869-1.934a1.12 1.12 0 011.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <span>Ver Mapa</span>
            </a>
            <button type="button" class="btn-action primary btn-sede-padron" onclick="window.filterPadronBySede ? window.filterPadronBySede('${sede.nombre}') : null" title="Ver beneficiarios de esta sede en el Padrón">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>Ver Beneficiarios</span>
            </button>
          </div>
        </div>
      `;
    }).join("");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SedesView = SedesView;
}
