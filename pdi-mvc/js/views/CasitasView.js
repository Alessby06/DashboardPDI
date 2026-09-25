// Vista: Acompañamiento Educativo (Casita del Saber)
export const CasitasView = {
  _allBeneficiarios: [],
  _filteredBeneficiarios: [],
  _searchQuery: "",
  _filterAsistencia: "all",
  _filterSede: [],
  _filterGrado: "all",

  renderTable(beneficiarios) {
    if (beneficiarios && Array.isArray(beneficiarios)) {
      this._allBeneficiarios = beneficiarios;
    } else if (window.PDI?.BeneficiarioModel) {
      this._allBeneficiarios = window.PDI.BeneficiarioModel.getAll();
    }
    this.applyFilters();
  },

  filterBySearch(query) {
    this._searchQuery = (query || "").trim().toLowerCase();
    const clearBtn = document.getElementById("btnCasitasSearchClear");
    if (clearBtn) {
      clearBtn.style.display = this._searchQuery.length > 0 ? "flex" : "none";
    }
    this.applyFilters();
  },

  clearSearch() {
    const input = document.getElementById("inputCasitasSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  selectAsistencia(val, label) {
    this._filterAsistencia = val || "all";
    const items = document.querySelectorAll("#menuCasitasAsistencia .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterAsistencia);
    });

    const labelEl = document.getElementById("labelCasitasAsistenciaSelect");
    if (labelEl) {
      labelEl.textContent = label || "Todos los Estados";
    }

    const drop = document.getElementById("dropdownCasitasAsistencia");
    if (drop) drop.classList.remove("open");

    this.applyFilters();
  },

  toggleSede(val) {
    const allSedes = ["Año Nuevo", "La Libertad", "San Pedro", "El Progreso", "Santa Rosa", "Los Bendecidos"];
    if (val === "all") {
      this._filterSede = [];
    } else {
      const idx = this._filterSede.indexOf(val);
      if (idx > -1) {
        this._filterSede.splice(idx, 1);
      } else {
        this._filterSede.push(val);
      }
      if (allSedes.every(s => this._filterSede.includes(s))) {
        this._filterSede = [];
      }
    }
    this._updateSedeDropdownUI();
    this.applyFilters();
  },

  _updateSedeDropdownUI() {
    const isAll = this._filterSede.length === 0;
    const items = document.querySelectorAll("#menuCasitasSede .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterSede.includes(v));
      }
    });

    const labelEl = document.getElementById("labelCasitasSedeSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todas las Sedes";
      } else if (this._filterSede.length === 1) {
        const s = this._filterSede[0];
        const dist = (s === "Año Nuevo" || s === "La Libertad") ? "Comas" : "Carabayllo";
        labelEl.textContent = `${s} (${dist})`;
      } else {
        labelEl.textContent = `${this._filterSede.length} seleccionadas`;
      }
    }
  },

  selectGrado(val, label) {
    this._filterGrado = val || "all";
    const items = document.querySelectorAll("#menuCasitasGrado .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterGrado);
    });

    const labelEl = document.getElementById("labelCasitasGradoSelect");
    if (labelEl) {
      labelEl.textContent = label || "Todos los Grados";
    }

    const drop = document.getElementById("dropdownCasitasGrado");
    if (drop) drop.classList.remove("open");

    this.applyFilters();
  },

  removeFilter(filterKey, specificVal) {
    if (filterKey === "search") this.clearSearch();
    if (filterKey === "asistencia") {
      this.selectAsistencia("all", "Todos los Estados");
    }
    if (filterKey === "sede") {
      if (specificVal) this.toggleSede(specificVal);
      else this.toggleSede("all");
    }
    if (filterKey === "grado") {
      this.selectGrado("all", "Todos los Grados");
    }
  },

  resetFilters() {
    this._searchQuery = "";
    this._filterAsistencia = "all";
    this._filterSede = [];
    this._filterGrado = "all";

    const input = document.getElementById("inputCasitasSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnCasitasSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this.selectAsistencia("all", "Todos los Estados");
    this._updateSedeDropdownUI();
    this.selectGrado("all", "Todos los Grados");

    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this.applyFilters();
  },

  _matchesGrado(b, gradoKey) {
    if (!gradoKey || gradoKey === "all") return true;
    const g = (b.grado || "").toLowerCase();
    if (gradoKey === "inicial") return g.includes("inicial") || g.includes("kinder") || g.includes("pre");
    if (gradoKey === "primaria") return g.includes("prim") || g.includes("1°") || g.includes("2°") || g.includes("3°") || g.includes("4°") || g.includes("5°") || g.includes("6°");
    if (gradoKey === "secundaria") return g.includes("sec") || g.includes("secundaria");
    return true;
  },

  applyFilters() {
    // Filtrar base casita (servicio de acompañamiento educativo)
    let casitaList = (this._allBeneficiarios || []).filter(b => 
      Array.isArray(b.servicios) && b.servicios.some(s => 
        s === "Servicio Acompañamiento Educativo" || 
        s === "Casita del Saber" || 
        (s || "").toLowerCase().includes("educat") || 
        (s || "").toLowerCase().includes("casita") || 
        (s || "").toLowerCase().includes("acompañ")
      )
    );

    // 1. Buscador texto libre
    if (this._searchQuery) {
      const q = this._searchQuery;
      casitaList = casitaList.filter(b => {
        const full = `${b.nombres} ${b.apellidos} ${b.codigo} ${b.colegio} ${b.grado} ${b.apoderado} ${b.sede} ${b.distrito}`.toLowerCase();
        return full.includes(q);
      });
    }

    // 2. Sede
    if (this._filterSede.length > 0) {
      casitaList = casitaList.filter(b => b.sede && this._filterSede.some(s => b.sede.toLowerCase().includes(s.toLowerCase())));
    }

    // 3. Grado / Nivel
    if (this._filterGrado !== "all") {
      casitaList = casitaList.filter(b => this._matchesGrado(b, this._filterGrado));
    }

    // 4. Asistencia
    if (this._filterAsistencia !== "all") {
      // Estado Asistencia actual simulado (por defecto 'P')
      const targetAsist = this._filterAsistencia;
      casitaList = casitaList.filter(b => {
        const currentAsist = (window.PDI?.CasitasController && window.PDI.CasitasController._asistenciaMap && window.PDI.CasitasController._asistenciaMap[b.id]) || "P";
        return currentAsist === targetAsist;
      });
    }

    this._filteredBeneficiarios = casitaList;

    // Actualizar badge de filtros activos
    let count = 0;
    if (this._filterAsistencia !== "all") count++;
    if (this._filterSede.length > 0) count += this._filterSede.length;
    if (this._filterGrado !== "all") count++;

    const badgeEl = document.getElementById("casitasActiveFiltersCount");
    const btnFilterEl = document.getElementById("btnDropdownCasitasFilterPanel");
    if (badgeEl) {
      badgeEl.textContent = count;
      badgeEl.style.display = count > 0 ? "inline-flex" : "none";
    }
    if (btnFilterEl) {
      btnFilterEl.classList.toggle("has-filters", count > 0);
    }

    const countHeaderEl = document.getElementById("casitasRecordsCount");
    if (countHeaderEl) {
      countHeaderEl.textContent = `Mostrando ${casitaList.length} de ${(this._allBeneficiarios || []).length} menores`;
    }

    this._renderActiveChips();
    this._renderTableAndCards(casitaList);
  },

  _renderActiveChips() {
    const bar = document.getElementById("casitasActiveChipsBar");
    const list = document.getElementById("casitasActiveChipsList");
    if (!bar || !list) return;

    const chips = [];

    if (this._filterAsistencia !== "all") {
      const asistNames = {
        "P": "Presente",
        "T": "Tardanza",
        "FJ": "Falta Justificada",
        "FI": "Falta Injustificada"
      };
      chips.push({
        id: "asistencia",
        label: `Asistencia: ${asistNames[this._filterAsistencia] || this._filterAsistencia}`
      });
    }

    if (this._filterSede.length > 0) {
      this._filterSede.forEach(s => {
        const dist = (s === "Año Nuevo" || s === "La Libertad") ? "Comas" : "Carabayllo";
        chips.push({
          id: "sede",
          val: s,
          label: `Sede: ${s} (${dist})`
        });
      });
    }

    if (this._filterGrado !== "all") {
      const gradoNames = {
        "inicial": "Inicial / Pre-escolar",
        "primaria": "Primaria (1° a 6°)",
        "secundaria": "Secundaria (1° a 5°)"
      };
      chips.push({
        id: "grado",
        label: `Nivel: ${gradoNames[this._filterGrado] || this._filterGrado}`
      });
    }

    if (chips.length > 0) {
      bar.style.display = "flex";
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${chip.label}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeCasitasChip ? window.removeCasitasChip('${chip.id}', '${chip.val || ''}') : null" title="Eliminar filtro">
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

  _renderTableAndCards(casitaList) {
    const tbody = document.getElementById("tbodyAsistenciaCasita");
    const mobileContainer = document.getElementById("mobileCardsCasita");

    if (casitaList.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px 16px;">
            <div style="width: 44px; height: 44px; margin: 0 auto 10px; border-radius: 50%; background: var(--gt-yellow-bg, rgba(254, 215, 102, 0.12)); display: flex; align-items: center; justify-content: center; color: var(--gt-yellow, #fed766);">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 14.5px;">No se encontraron registros de asistencia</div>
            <div style="color: var(--text-muted); font-size: 12.5px; margin-top: 4px;">Prueba con otro término de búsqueda o restablece los filtros.</div>
            <button type="button" class="btn-action btn-secondary" style="margin-top: 14px; display: inline-flex;" onclick="window.resetCasitasFilters ? window.resetCasitasFilters() : null">
              Restablecer Filtros
            </button>
          </td>
        </tr>
      `;
      if (tbody) tbody.innerHTML = emptyHtml;

      if (mobileContainer) {
        mobileContainer.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; background: var(--surface-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 8px;">
            <div style="width: 44px; height: 44px; margin: 0 auto 10px; border-radius: 50%; background: var(--gt-yellow-bg, rgba(254, 215, 102, 0.12)); display: flex; align-items: center; justify-content: center; color: var(--gt-yellow, #fed766);">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">No se encontraron menores</div>
            <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">No hay menores que coincidan con la búsqueda o filtros.</div>
            <button type="button" class="btn-action btn-secondary" style="margin-top: 12px; display: inline-flex;" onclick="window.resetCasitasFilters ? window.resetCasitasFilters() : null">
              Restablecer Filtros
            </button>
          </div>
        `;
      }
      return;
    }

    if (tbody) {
      tbody.innerHTML = casitaList.map(b => `
        <tr>
          <td><strong>${b.nombres} ${b.apellidos}</strong><div style="font-size:11px; color:var(--text-dim);">${b.codigo}</div></td>
          <td>${b.grado}</td>
          <td>${b.colegio}</td>
          <td>
            <div style="font-weight:600; color:var(--text-main);">${b.apoderado}</div>
            <div style="font-size:11.5px; color:var(--text-muted);">${b.parentesco} &bull; ${b.telefono || 'Sin tel'}</div>
          </td>
          <td>
            <span class="badge badge-green" id="badgeAsist_${b.id}">Presente</span>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 4px;" id="btnGroupAsist_${b.id}">
              <button type="button" class="btn-asist active-P" data-asist-btn="P" onclick="window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'P') : (window.PDI?.CasitasController ? window.PDI.CasitasController.toggleAsistencia(${b.id}, 'P') : null)">P</button>
              <button type="button" class="btn-asist" data-asist-btn="T" onclick="window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'T') : (window.PDI?.CasitasController ? window.PDI.CasitasController.toggleAsistencia(${b.id}, 'T') : null)">T</button>
              <button type="button" class="btn-asist" data-asist-btn="FJ" onclick="window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'FJ') : (window.PDI?.CasitasController ? window.PDI.CasitasController.toggleAsistencia(${b.id}, 'FJ') : null)">FJ</button>
              <button type="button" class="btn-asist" data-asist-btn="FI" onclick="window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'FI') : (window.PDI?.CasitasController ? window.PDI.CasitasController.toggleAsistencia(${b.id}, 'FI') : null)">FI</button>
            </div>
          </td>
        </tr>
      `).join("");
    }

    if (mobileContainer) {
      mobileContainer.innerHTML = casitaList.map(b => `
        <div class="mobile-card-item" id="mobile-casita-${b.id}">
          <!-- Cabecera: ID + Badge Asistencia -->
          <div class="datacard-header">
            <div class="datacard-id">
              <span>ID:</span> ${b.codigo}
            </div>
            <div class="datacard-header-right">
              <span class="badge badge-green" id="badgeAsistMob_${b.id}">Presente</span>
            </div>
          </div>

          <!-- Cuerpo: Datos principales y Botonera Rápida -->
          <div class="datacard-body">
            <div class="datacard-row">
              <span class="datacard-label">Menor Beneficiario</span>
              <span class="datacard-value">${b.nombres} ${b.apellidos}</span>
            </div>
            <div class="datacard-row">
              <span class="datacard-label">Apoderado Autorizado</span>
              <span class="datacard-value">${b.apoderado} <span style="color:var(--text-muted); font-size:11.5px;">(${b.parentesco})</span></span>
            </div>

            <!-- Botonera de Asistencia Rápida -->
            <div style="padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); background: var(--surface-2);">
              <div style="font-size: 11px; font-weight: 800; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.04em;">
                Marcar Asistencia Hoy:
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;" id="btnGroupMobAsist_${b.id}">
                <button type="button" class="btn-asist active-P" data-asist-btn="P" onclick="event.stopPropagation(); window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'P') : (window.PDI?.CasitasController ? window.PDI.CasitasController.toggleAsistencia(${b.id}, 'P') : null)">P</button>
                <button type="button" class="btn-asist" data-asist-btn="T" onclick="event.stopPropagation(); window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'T') : (window.PDI?.CasitasController ? window.PDI.CasitasController.toggleAsistencia(${b.id}, 'T') : null)">T</button>
                <button type="button" class="btn-asist" data-asist-btn="FJ" onclick="event.stopPropagation(); window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'FJ') : (window.PDI?.CasitasController ? window.PDI.CasitasController.toggleAsistencia(${b.id}, 'FJ') : null)">FJ</button>
                <button type="button" class="btn-asist" data-asist-btn="FI" onclick="event.stopPropagation(); window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'FI') : (window.PDI?.CasitasController ? window.PDI.CasitasController.toggleAsistencia(${b.id}, 'FI') : null)">FI</button>
              </div>
            </div>

            <!-- Bloque Desplegable "Ver más" -->
            <div class="datacard-extra" id="extra-casita-${b.id}">
              <div class="datacard-row">
                <span class="datacard-label">Grado Escolar</span>
                <span class="datacard-value">${b.grado}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Colegio de Origen</span>
                <span class="datacard-value">${b.colegio}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Sede Casita</span>
                <span class="datacard-value">${b.distrito} - ${b.sede}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Teléfono de Salida</span>
                <span class="datacard-value">${b.telefono || 'Sin registro'}</span>
              </div>
            </div>

            <!-- Botón Ver más / Ver menos -->
            <button type="button" class="datacard-toggle-btn" id="btnToggleCasita-${b.id}" onclick="window.PDI ? window.PDI.CasitasView.toggleCard(${b.id}) : CasitasView.toggleCard(${b.id})">
              <span class="btn-text">Ver más</span>
              <svg fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>
      `).join("");
    }
  },

  toggleCard(id) {
    const card = document.getElementById(`mobile-casita-${id}`);
    const btn = document.getElementById(`btnToggleCasita-${id}`);
    if (card) {
      const isExp = card.classList.toggle("expanded");
      if (btn) {
        const textSpan = btn.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = isExp ? "Ver menos" : "Ver más";
      }
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasView = CasitasView;
  window.filterCasitasSearch = (val) => CasitasView.filterBySearch(val);
  window.clearCasitasSearch = () => CasitasView.clearSearch();
  window.selectCasitasAsistencia = (val, label) => CasitasView.selectAsistencia(val, label);
  window.toggleCasitasSede = (val) => CasitasView.toggleSede(val);
  window.selectCasitasGrado = (val, label) => CasitasView.selectGrado(val, label);
  window.removeCasitasChip = (key, val) => CasitasView.removeFilter(key, val);
  window.resetCasitasFilters = () => CasitasView.resetFilters();
}
