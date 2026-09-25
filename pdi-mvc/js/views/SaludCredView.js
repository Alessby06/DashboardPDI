// Vista: Módulo de Salud y Nutrición CRED
export const SaludCredView = {
  _allBeneficiarios: [],
  _filteredBeneficiarios: [],
  _searchQuery: "",
  _filterAnemia: [],
  _filterSede: [],
  _filterHbNivel: "all",

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
    const clearBtn = document.getElementById("btnSaludSearchClear");
    if (clearBtn) {
      clearBtn.style.display = this._searchQuery.length > 0 ? "flex" : "none";
    }
    this.applyFilters();
  },

  clearSearch() {
    const input = document.getElementById("inputSaludSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  toggleAnemia(val) {
    const allAnemias = ["Normal", "Leve", "Moderada"];
    if (val === "all") {
      this._filterAnemia = [];
    } else {
      const idx = this._filterAnemia.indexOf(val);
      if (idx > -1) {
        this._filterAnemia.splice(idx, 1);
      } else {
        this._filterAnemia.push(val);
      }
      if (allAnemias.every(a => this._filterAnemia.includes(a))) {
        this._filterAnemia = [];
      }
    }
    this._updateAnemiaDropdownUI();
    this.applyFilters();
  },

  _updateAnemiaDropdownUI() {
    const isAll = this._filterAnemia.length === 0;
    const items = document.querySelectorAll("#menuSaludAnemia .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAnemia.includes(v));
      }
    });

    const labelEl = document.getElementById("labelSaludAnemiaSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todas las Condiciones";
      } else if (this._filterAnemia.length === 1) {
        const a = this._filterAnemia[0];
        labelEl.textContent = a === "Moderada" ? "Mod / Severa" : a;
      } else {
        labelEl.textContent = `${this._filterAnemia.length} seleccionadas`;
      }
    }
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
    const items = document.querySelectorAll("#menuSaludSede .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterSede.includes(v));
      }
    });

    const labelEl = document.getElementById("labelSaludSedeSelect");
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

  selectHbNivel(val, label) {
    this._filterHbNivel = val || "all";
    const items = document.querySelectorAll("#menuSaludHb .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterHbNivel);
    });

    const labelEl = document.getElementById("labelSaludHbSelect");
    if (labelEl) {
      labelEl.textContent = label || "Todos los Niveles";
    }

    const drop = document.getElementById("dropdownSaludHb");
    if (drop) drop.classList.remove("open");

    this.applyFilters();
  },

  removeFilter(filterKey, specificVal) {
    if (filterKey === "search") this.clearSearch();
    if (filterKey === "anemia") {
      if (specificVal) this.toggleAnemia(specificVal);
      else this.toggleAnemia("all");
    }
    if (filterKey === "sede") {
      if (specificVal) this.toggleSede(specificVal);
      else this.toggleSede("all");
    }
    if (filterKey === "hb") {
      this.selectHbNivel("all", "Todos los Niveles");
    }
  },

  resetFilters() {
    this._searchQuery = "";
    this._filterAnemia = [];
    this._filterSede = [];
    this._filterHbNivel = "all";

    const input = document.getElementById("inputSaludSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnSaludSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this._updateAnemiaDropdownUI();
    this._updateSedeDropdownUI();
    this.selectHbNivel("all", "Todos los Niveles");

    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this.applyFilters();
  },

  _matchesAnemia(b, anemiaKeys) {
    if (!anemiaKeys || anemiaKeys.length === 0) return true;
    return anemiaKeys.some(key => {
      if (key === "Moderada") {
        return b.anemia === "Moderada" || b.anemia === "Severa";
      }
      return b.anemia === key;
    });
  },

  _matchesHbNivel(b, nivelKey) {
    if (!nivelKey || nivelKey === "all") return true;
    const hbVal = parseFloat(b.hb);
    if (isNaN(hbVal)) return true;

    if (nivelKey === "anemia") return hbVal < 11.0;
    if (nivelKey === "normal") return hbVal >= 11.0;
    if (nivelKey === "critico") return hbVal < 10.0;
    return true;
  },

  applyFilters() {
    let list = [...(this._allBeneficiarios || [])];

    // 1. Buscador de texto
    if (this._searchQuery) {
      const q = this._searchQuery;
      list = list.filter(b => {
        const full = `${b.nombres} ${b.apellidos} ${b.codigo} ${b.dni} ${b.sede} ${b.distrito} ${b.apoderado}`.toLowerCase();
        return full.includes(q);
      });
    }

    // 2. Condición Anemia
    if (this._filterAnemia.length > 0) {
      list = list.filter(b => this._matchesAnemia(b, this._filterAnemia));
    }

    // 3. Sede Operativa
    if (this._filterSede.length > 0) {
      list = list.filter(b => b.sede && this._filterSede.some(s => b.sede.toLowerCase().includes(s.toLowerCase())));
    }

    // 4. Rango Hemoglobina
    if (this._filterHbNivel !== "all") {
      list = list.filter(b => this._matchesHbNivel(b, this._filterHbNivel));
    }

    this._filteredBeneficiarios = list;

    // Actualizar badge de filtros activos
    let count = 0;
    if (this._filterAnemia.length > 0) count += this._filterAnemia.length;
    if (this._filterSede.length > 0) count += this._filterSede.length;
    if (this._filterHbNivel !== "all") count++;

    const badgeEl = document.getElementById("saludActiveFiltersCount");
    const btnFilterEl = document.getElementById("btnDropdownSaludFilterPanel");
    if (badgeEl) {
      badgeEl.textContent = count;
      badgeEl.style.display = count > 0 ? "inline-flex" : "none";
    }
    if (btnFilterEl) {
      btnFilterEl.classList.toggle("has-filters", count > 0);
    }

    const countHeaderEl = document.getElementById("saludRecordsCount");
    if (countHeaderEl) {
      countHeaderEl.textContent = `Mostrando ${list.length} de ${this._allBeneficiarios.length} menores`;
    }

    this._renderActiveChips();
    this._renderTableAndCards(list);
  },

  _renderActiveChips() {
    const bar = document.getElementById("saludActiveChipsBar");
    const list = document.getElementById("saludActiveChipsList");
    if (!bar || !list) return;

    const chips = [];

    if (this._filterAnemia.length > 0) {
      this._filterAnemia.forEach(a => {
        chips.push({
          id: "anemia",
          val: a,
          label: `Anemia: ${a === "Moderada" ? "Mod / Severa" : a}`
        });
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

    if (this._filterHbNivel !== "all") {
      let hbLabel = "Todos los Niveles";
      if (this._filterHbNivel === "anemia") hbLabel = "Hb < 11.0 g/dL (Anemia)";
      if (this._filterHbNivel === "normal") hbLabel = "Hb ≥ 11.0 g/dL (Normal)";
      if (this._filterHbNivel === "critico") hbLabel = "Hb < 10.0 g/dL (Crítico)";
      chips.push({
        id: "hb",
        label: `Nivel: ${hbLabel}`
      });
    }

    if (chips.length > 0) {
      bar.style.display = "flex";
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${chip.label}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeSaludChip ? window.removeSaludChip('${chip.id}', '${chip.val || ''}') : null" title="Eliminar filtro">
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

  _renderTableAndCards(beneficiarios) {
    const tbody = document.getElementById("tbodySaludCred");
    const mobileContainer = document.getElementById("mobileCardsSalud");

    if (beneficiarios.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px 16px;">
            <div style="width: 44px; height: 44px; margin: 0 auto 10px; border-radius: 50%; background: var(--gt-green-bg, rgba(52, 211, 153, 0.12)); display: flex; align-items: center; justify-content: center; color: var(--gt-green, #34d399);">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 14.5px;">No se encontraron evaluaciones CRED</div>
            <div style="color: var(--text-muted); font-size: 12.5px; margin-top: 4px;">Prueba ajustando el término de búsqueda o restableciendo los filtros.</div>
            <button type="button" class="btn-action btn-secondary" style="margin-top: 14px; display: inline-flex;" onclick="window.resetSaludFilters ? window.resetSaludFilters() : null">
              Restablecer Filtros
            </button>
          </td>
        </tr>
      `;
      if (tbody) tbody.innerHTML = emptyHtml;

      if (mobileContainer) {
        mobileContainer.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; background: var(--surface-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 8px;">
            <div style="width: 44px; height: 44px; margin: 0 auto 10px; border-radius: 50%; background: var(--gt-green-bg, rgba(52, 211, 153, 0.12)); display: flex; align-items: center; justify-content: center; color: var(--gt-green, #34d399);">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">No se encontraron evaluaciones</div>
            <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">No hay registros que coincidan con la búsqueda o filtros.</div>
            <button type="button" class="btn-action btn-secondary" style="margin-top: 12px; display: inline-flex;" onclick="window.resetSaludFilters ? window.resetSaludFilters() : null">
              Restablecer Filtros
            </button>
          </div>
        `;
      }
      return;
    }

    if (tbody) {
      tbody.innerHTML = beneficiarios.map(b => {
        let badgeClass = "badge-green";
        if (b.anemia === "Leve") badgeClass = "badge-yellow";
        if (b.anemia === "Moderada" || b.anemia === "Severa") badgeClass = "badge-red";

        return `
          <tr>
            <td><strong>${b.nombres} ${b.apellidos}</strong><div style="font-size:11.5px; color:var(--text-dim); font-family:var(--mono-font);">${b.codigo}</div></td>
            <td>${b.edad}</td>
            <td>${b.peso} kg / ${b.talla} cm</td>
            <td><strong style="font-family:var(--mono-font);">${b.hb} g/dL</strong></td>
            <td><span class="badge ${badgeClass}">${b.anemia}</span></td>
            <td>${b.anemia !== "Normal" ? "Sulfato Ferroso 1 dosis/día" : "Dieta Preventiva"}</td>
            <td style="text-align: right;"><button type="button" class="btn-action" onclick="window.openExpediente ? window.openExpediente(${b.id}) : (window.app ? window.app.beneficiarioController.openExpediente(${b.id}) : null)">Ver Historial</button></td>
          </tr>
        `;
      }).join("");
    }

    if (mobileContainer) {
      mobileContainer.innerHTML = beneficiarios.map(b => {
        let badgeClass = "badge-green";
        if (b.anemia === "Leve") badgeClass = "badge-yellow";
        if (b.anemia === "Moderada" || b.anemia === "Severa") badgeClass = "badge-red";

        return `
          <div class="mobile-card-item" id="mobile-salud-${b.id}">
            <!-- Cabecera: ID + Badge Diagnóstico Anemia -->
            <div class="datacard-header">
              <div class="datacard-id">
                <span>ID:</span> ${b.codigo}
              </div>
              <div class="datacard-header-right">
                <span class="badge ${badgeClass}">${b.anemia}</span>
              </div>
            </div>

            <!-- Cuerpo: Datos principales siempre visibles -->
            <div class="datacard-body">
              <div class="datacard-row">
                <span class="datacard-label">Beneficiario</span>
                <span class="datacard-value">${b.nombres} ${b.apellidos}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Hemoglobina (Hb)</span>
                <span class="datacard-value" style="color:var(--gt-yellow); font-weight:800; font-family:var(--mono-font);">${b.hb} g/dL</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Diagnóstico Anemia</span>
                <span class="datacard-value">${b.anemia}</span>
              </div>

              <!-- Bloque Desplegable "Ver más" -->
              <div class="datacard-extra" id="extra-salud-${b.id}">
                <div class="datacard-row">
                  <span class="datacard-label">Edad</span>
                  <span class="datacard-value">${b.edad}</span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Peso / Talla</span>
                  <span class="datacard-value">${b.peso} kg / ${b.talla} cm</span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Suplementación</span>
                  <span class="datacard-value">${b.anemia !== "Normal" ? "Sulfato Ferroso 1 dosis/día" : "Dieta Preventiva"}</span>
                </div>
                <div class="datacard-actions-footer">
                  <button type="button" class="btn-action primary" style="width:100%; justify-content:center;" onclick="event.stopPropagation(); window.openExpediente ? window.openExpediente(${b.id}) : (window.app ? window.app.beneficiarioController.openExpediente(${b.id}) : null)">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:6px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ver Historial CRED Completo
                  </button>
                </div>
              </div>

              <!-- Botón Ver más / Ver menos -->
              <button type="button" class="datacard-toggle-btn" id="btnToggleSalud-${b.id}" onclick="window.PDI ? window.PDI.SaludCredView.toggleCard(${b.id}) : SaludCredView.toggleCard(${b.id})">
                <span class="btn-text">Ver más</span>
                <svg fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join("");
    }
  },

  toggleCard(id) {
    const card = document.getElementById(`mobile-salud-${id}`);
    const btn = document.getElementById(`btnToggleSalud-${id}`);
    if (card) {
      const isExp = card.classList.toggle("expanded");
      if (btn) {
        const textSpan = btn.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = isExp ? "Ver menos" : "Ver más";
      }
    }
  },

  toggleCalculadora() {
    const card = document.getElementById("cardCalculadoraCred");
    const body = document.getElementById("credCalcBody");
    const badgeState = document.getElementById("credCalcBadgeState");
    if (!body) return;

    const isHidden = body.style.display === "none";
    body.style.display = isHidden ? "block" : "none";
    if (card) {
      card.classList.toggle("open", isHidden);
    }
    if (badgeState) {
      badgeState.textContent = isHidden ? "Ocultar" : "Desplegar";
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SaludCredView = SaludCredView;
  window.toggleCalculadoraCred = () => SaludCredView.toggleCalculadora();
  window.filterSaludSearch = (val) => SaludCredView.filterBySearch(val);
  window.clearSaludSearch = () => SaludCredView.clearSearch();
  window.toggleSaludAnemia = (val) => SaludCredView.toggleAnemia(val);
  window.toggleSaludSede = (val) => SaludCredView.toggleSede(val);
  window.selectSaludHb = (val, label) => SaludCredView.selectHbNivel(val, label);
  window.removeSaludChip = (key, val) => SaludCredView.removeFilter(key, val);
  window.resetSaludFilters = () => SaludCredView.resetFilters();
}
