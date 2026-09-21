// Vista: Padrón de Menores Beneficiarios
export const BeneficiariosView = {
  _allBeneficiarios: [],
  _searchQuery: "",
  _filterServicio: "all",
  _filterSede: "all",
  _filterAnemia: "all",
  _filterEdad: "all", // "all" or specific number (e.g. 4)
  _filterEstado: "all",

  init(beneficiarios) {
    this._allBeneficiarios = beneficiarios || [];
    this.applyFilters();
  },

  renderTable(beneficiarios) {
    if (beneficiarios) {
      this._allBeneficiarios = beneficiarios;
    }
    this.applyFilters();
  },

  filterBySearch(query) {
    this._searchQuery = (query || "").trim().toLowerCase();
    const clearBtn = document.getElementById("btnPadronSearchClear");
    if (clearBtn) {
      clearBtn.style.display = this._searchQuery.length > 0 ? "flex" : "none";
    }
    this.applyFilters();
  },

  clearSearch() {
    const input = document.getElementById("inputPadronSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  selectServicio(servicioKey) {
    this._filterServicio = servicioKey || "all";
    const btns = document.querySelectorAll("#padronServicioSegmented .audit-seg-btn");
    btns.forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-value") === this._filterServicio);
    });
    this.applyFilters();
  },

  selectSede(sedeVal) {
    this._filterSede = sedeVal || "all";
    const select = document.getElementById("selectPadronSedeFilter");
    if (select) select.value = this._filterSede;
    this.applyFilters();
  },

  selectAnemia(anemiaVal) {
    this._filterAnemia = anemiaVal || "all";
    const btns = document.querySelectorAll("#padronAnemiaSegmented .audit-seg-btn");
    btns.forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-value") === this._filterAnemia);
    });
    this.applyFilters();
  },

  syncEdad(val, source) {
    if (val === "" || val === null || val === undefined) {
      this._filterEdad = "all";
    } else {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0) {
        this._filterEdad = "all";
      } else {
        this._filterEdad = Math.min(18, Math.max(0, num));
      }
    }

    const slider = document.getElementById("sliderPadronEdad");
    const numInput = document.getElementById("numPadronEdad");

    if (source === "slider") {
      if (numInput) numInput.value = this._filterEdad === "all" ? "" : this._filterEdad;
    } else if (source === "num") {
      if (slider) slider.value = this._filterEdad === "all" ? 0 : this._filterEdad;
    } else {
      if (slider) slider.value = this._filterEdad === "all" ? 0 : this._filterEdad;
      if (numInput) numInput.value = this._filterEdad === "all" ? "" : this._filterEdad;
    }

    this.applyFilters();
  },

  clearEdad() {
    this.syncEdad("", "all");
  },

  selectEstado(estadoVal) {
    this._filterEstado = estadoVal || "all";
    const btns = document.querySelectorAll("#padronEstadoSegmented .audit-seg-btn");
    btns.forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-value") === this._filterEstado);
    });
    this.applyFilters();
  },

  removeFilter(filterKey) {
    if (filterKey === "search") this.clearSearch();
    if (filterKey === "servicio") this.selectServicio("all");
    if (filterKey === "sede") this.selectSede("all");
    if (filterKey === "anemia") this.selectAnemia("all");
    if (filterKey === "edad") this.clearEdad();
    if (filterKey === "estado") this.selectEstado("all");
  },

  resetFilters() {
    this._searchQuery = "";
    this._filterServicio = "all";
    this._filterSede = "all";
    this._filterAnemia = "all";
    this._filterEdad = "all";
    this._filterEstado = "all";

    const input = document.getElementById("inputPadronSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnPadronSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    const sSede = document.getElementById("selectPadronSedeFilter");
    if (sSede) sSede.value = "all";

    const slider = document.getElementById("sliderPadronEdad");
    if (slider) slider.value = 0;
    const numInput = document.getElementById("numPadronEdad");
    if (numInput) numInput.value = "";

    const sServBtns = document.querySelectorAll("#padronServicioSegmented .audit-seg-btn");
    sServBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-value") === "all"));

    const sAnemiaBtns = document.querySelectorAll("#padronAnemiaSegmented .audit-seg-btn");
    sAnemiaBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-value") === "all"));

    const sEstadoBtns = document.querySelectorAll("#padronEstadoSegmented .audit-seg-btn");
    sEstadoBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-value") === "all"));

    this.applyFilters();
  },

  applyFilters() {
    let list = [...this._allBeneficiarios];

    // 1. Buscador texto libre
    if (this._searchQuery) {
      const q = this._searchQuery;
      list = list.filter(b => {
        const full = `${b.nombres} ${b.apellidos} ${b.codigo} ${b.dni} ${b.sede} ${b.distrito} ${b.apoderado}`.toLowerCase();
        return full.includes(q);
      });
    }

    // 2. Servicio / Programa
    if (this._filterServicio !== "all") {
      if (this._filterServicio === "desayuno") {
        list = list.filter(b => b.servicios && b.servicios.some(s => s.toLowerCase().includes("desayuno") || s.toLowerCase().includes("alimento")));
      } else if (this._filterServicio === "casita") {
        list = list.filter(b => b.servicios && b.servicios.some(s => s.toLowerCase().includes("casita") || s.toLowerCase().includes("educativ")));
      } else if (this._filterServicio === "mixto") {
        list = list.filter(b => b.servicios && b.servicios.length >= 2);
      }
    }

    // 3. Sede Operativa
    if (this._filterSede !== "all") {
      list = list.filter(b => b.sede && b.sede.toLowerCase().includes(this._filterSede.toLowerCase()));
    }

    // 4. Condición Nutricional (Anemia)
    if (this._filterAnemia !== "all") {
      if (this._filterAnemia === "Moderada") {
        list = list.filter(b => b.anemia === "Moderada" || b.anemia === "Severa");
      } else {
        list = list.filter(b => b.anemia === this._filterAnemia);
      }
    }

    // 5. Edad Exacta (0 a 18 años)
    if (this._filterEdad !== "all") {
      const targetEdad = parseInt(this._filterEdad, 10);
      list = list.filter(b => {
        const numEdad = parseInt(b.edad, 10);
        return !isNaN(numEdad) && numEdad === targetEdad;
      });
    }

    // 6. Estado
    if (this._filterEstado !== "all") {
      list = list.filter(b => b.estado === this._filterEstado);
    }

    // Actualizar badge de filtros activos
    let activeFiltersCount = 0;
    if (this._filterServicio !== "all") activeFiltersCount++;
    if (this._filterSede !== "all") activeFiltersCount++;
    if (this._filterAnemia !== "all") activeFiltersCount++;
    if (this._filterEdad !== "all") activeFiltersCount++;
    if (this._filterEstado !== "all") activeFiltersCount++;

    const badgeEl = document.getElementById("padronActiveFiltersCount");
    const btnFilterEl = document.getElementById("btnDropdownPadronFilterPanel");

    if (badgeEl) {
      badgeEl.textContent = activeFiltersCount;
      badgeEl.style.display = activeFiltersCount > 0 ? "inline-flex" : "none";
    }
    if (btnFilterEl) {
      btnFilterEl.classList.toggle("has-filters", activeFiltersCount > 0);
    }

    this._updateFacetCounts();
    this._renderActiveChips();
    this._renderFilteredList(list);
  },

  _updateFacetCounts() {
    // Calculo facetado con respecto a los otros filtros activos excepto la propia categoría
    const getFilteredExcluding = (excludeKey) => {
      let l = [...this._allBeneficiarios];
      if (this._searchQuery) {
        const q = this._searchQuery;
        l = l.filter(b => `${b.nombres} ${b.apellidos} ${b.codigo} ${b.dni} ${b.sede} ${b.distrito} ${b.apoderado}`.toLowerCase().includes(q));
      }
      if (excludeKey !== "servicio" && this._filterServicio !== "all") {
        if (this._filterServicio === "desayuno") l = l.filter(b => b.servicios && b.servicios.some(s => s.toLowerCase().includes("desayuno") || s.toLowerCase().includes("alimento")));
        else if (this._filterServicio === "casita") l = l.filter(b => b.servicios && b.servicios.some(s => s.toLowerCase().includes("casita") || s.toLowerCase().includes("educativ")));
        else if (this._filterServicio === "mixto") l = l.filter(b => b.servicios && b.servicios.length >= 2);
      }
      if (excludeKey !== "sede" && this._filterSede !== "all") {
        l = l.filter(b => b.sede && b.sede.toLowerCase().includes(this._filterSede.toLowerCase()));
      }
      if (excludeKey !== "anemia" && this._filterAnemia !== "all") {
        if (this._filterAnemia === "Moderada") l = l.filter(b => b.anemia === "Moderada" || b.anemia === "Severa");
        else l = l.filter(b => b.anemia === this._filterAnemia);
      }
      if (excludeKey !== "edad" && this._filterEdad !== "all") {
        const tEdad = parseInt(this._filterEdad, 10);
        l = l.filter(b => (parseInt(b.edad, 10) || 0) === tEdad);
      }
      if (excludeKey !== "estado" && this._filterEstado !== "all") {
        l = l.filter(b => b.estado === this._filterEstado);
      }
      return l;
    };

    // 1. Facetas de Servicio
    const forServ = getFilteredExcluding("servicio");
    const countServDesayuno = forServ.filter(b => b.servicios && b.servicios.some(s => s.toLowerCase().includes("desayuno") || s.toLowerCase().includes("alimento"))).length;
    const countServCasita = forServ.filter(b => b.servicios && b.servicios.some(s => s.toLowerCase().includes("casita") || s.toLowerCase().includes("educativ"))).length;
    const countServMixto = forServ.filter(b => b.servicios && b.servicios.length >= 2).length;
    const countServAll = forServ.length;

    const servBtns = document.querySelectorAll("#padronServicioSegmented .audit-seg-btn");
    servBtns.forEach(btn => {
      const val = btn.getAttribute("data-value");
      let c = countServAll;
      let label = "Todos";
      if (val === "desayuno") { c = countServDesayuno; label = "Nutrición SAN"; }
      if (val === "casita") { c = countServCasita; label = "Casita del Saber"; }
      if (val === "mixto") { c = countServMixto; label = "Mixto / Ambos"; }

      btn.classList.toggle("zero-facet", c === 0 && val !== "all");
      btn.innerHTML = `${label} <span class="audit-seg-count">(${c})</span>`;
    });

    // 2. Facetas de Sede
    const forSede = getFilteredExcluding("sede");
    const selectSede = document.getElementById("selectPadronSedeFilter");
    if (selectSede) {
      Array.from(selectSede.options).forEach(opt => {
        const val = opt.value;
        if (val === "all") {
          opt.textContent = `Todas las Sedes (${forSede.length})`;
          opt.classList.remove("zero-facet");
        } else {
          const c = forSede.filter(b => b.sede && b.sede.toLowerCase().includes(val.toLowerCase())).length;
          const baseName = val.includes("Comas") || val.includes("Carabayllo") ? val : `${val} (${val === "Año Nuevo" || val === "La Libertad" ? "Comas" : "Carabayllo"})`;
          opt.textContent = `${baseName} (${c})`;
          opt.disabled = c === 0;
          opt.classList.toggle("zero-facet", c === 0);
        }
      });
    }

    // 3. Facetas de Anemia
    const forAnemia = getFilteredExcluding("anemia");
    const countAnemiaNormal = forAnemia.filter(b => b.anemia === "Normal").length;
    const countAnemiaLeve = forAnemia.filter(b => b.anemia === "Leve").length;
    const countAnemiaMod = forAnemia.filter(b => b.anemia === "Moderada" || b.anemia === "Severa").length;

    const anemiaBtns = document.querySelectorAll("#padronAnemiaSegmented .audit-seg-btn");
    anemiaBtns.forEach(btn => {
      const val = btn.getAttribute("data-value");
      let c = forAnemia.length;
      let badgeHtml = `Todos`;
      if (val === "Normal") { c = countAnemiaNormal; badgeHtml = `<span class="badge badge-green" style="padding:1px 5px; font-size:10px;">Normal</span>`; }
      if (val === "Leve") { c = countAnemiaLeve; badgeHtml = `<span class="badge badge-yellow" style="padding:1px 5px; font-size:10px;">Leve</span>`; }
      if (val === "Moderada") { c = countAnemiaMod; badgeHtml = `<span class="badge badge-red" style="padding:1px 5px; font-size:10px;">Mod / Sev</span>`; }

      btn.classList.toggle("zero-facet", c === 0 && val !== "all");
      btn.innerHTML = `${badgeHtml} <span class="audit-seg-count">(${c})</span>`;
    });

    // 4. Facetas de Estado
    const forEstado = getFilteredExcluding("estado");
    const countActivo = forEstado.filter(b => b.estado === "Activo").length;
    const countInactivo = forEstado.filter(b => b.estado === "Inactivo" || b.estado === "Baja").length;

    const estadoBtns = document.querySelectorAll("#padronEstadoSegmented .audit-seg-btn");
    estadoBtns.forEach(btn => {
      const val = btn.getAttribute("data-value");
      let c = forEstado.length;
      let label = "Todos";
      if (val === "Activo") { c = countActivo; label = "Activo"; }
      if (val === "Inactivo") { c = countInactivo; label = "Inactivo / Baja"; }

      btn.classList.toggle("zero-facet", c === 0 && val !== "all");
      btn.innerHTML = `${label} <span class="audit-seg-count">(${c})</span>`;
    });
  },

  _renderActiveChips() {
    const bar = document.getElementById("padronActiveChipsBar");
    const list = document.getElementById("padronActiveChipsList");
    if (!bar || !list) return;

    const chips = [];

    if (this._searchQuery) {
      chips.push({
        id: "search",
        label: `Búsqueda: "${this._searchQuery}"`,
      });
    }

    if (this._filterServicio !== "all") {
      let servLabel = this._filterServicio;
      if (this._filterServicio === "desayuno") servLabel = "Nutrición SAN";
      if (this._filterServicio === "casita") servLabel = "Casita del Saber";
      if (this._filterServicio === "mixto") servLabel = "Mixto / Ambos";
      chips.push({
        id: "servicio",
        label: `Programa: ${servLabel}`,
      });
    }

    if (this._filterSede !== "all") {
      chips.push({
        id: "sede",
        label: `Sede: ${this._filterSede}`,
      });
    }

    if (this._filterAnemia !== "all") {
      chips.push({
        id: "anemia",
        label: `Anemia: ${this._filterAnemia === "Moderada" ? "Mod / Severa" : this._filterAnemia}`,
      });
    }

    if (this._filterEdad !== "all") {
      chips.push({
        id: "edad",
        label: `Edad: ${this._filterEdad} años`,
      });
    }

    if (this._filterEstado !== "all") {
      chips.push({
        id: "estado",
        label: `Estado: ${this._filterEstado}`,
      });
    }

    if (chips.length === 0) {
      bar.style.display = "none";
      list.innerHTML = "";
    } else {
      bar.style.display = "flex";
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${chip.label}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removePadronChip ? window.removePadronChip('${chip.id}') : null" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      `).join("");
    }
  },

  _renderFilteredList(beneficiarios) {
    const tbody = document.getElementById("tbodyBeneficiarios");
    const mobileContainer = document.getElementById("mobileCardsBeneficiarios");

    const badgeTotal = document.getElementById("badgeTotalBeneficiarios");
    if (badgeTotal) badgeTotal.textContent = beneficiarios.length;

    // 1. Renderizar tabla tradicional para pantallas grandes (Desktop)
    if (tbody) {
      if (beneficiarios.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 32px 16px; color: var(--text-dim);">
              <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 8px; display:block; opacity:0.6;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              No se encontraron beneficiarios con los filtros seleccionados.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = beneficiarios.map(b => `
          <tr>
            <td><strong style="font-family:var(--mono-font); color:var(--gt-green);">${b.codigo}</strong></td>
            <td><strong>${b.nombres} ${b.apellidos}</strong></td>
            <td>${b.dni}</td>
            <td>${b.edad} / ${b.sexo}</td>
            <td>${b.distrito}: ${b.sede}</td>
            <td>
              ${b.servicios.map(s => `<span class="badge badge-blue" style="margin-right:4px;">${s}</span>`).join("")}
            </td>
            <td><span class="badge ${b.estado === 'Activo' ? 'badge-green' : 'badge-yellow'}">${b.estado}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn-action" onclick="window.openExpediente ? window.openExpediente(${b.id}) : window.app.beneficiarioController.openExpediente(${b.id})">
                Ver Expediente
              </button>
            </td>
          </tr>
        `).join("");
      }
    }

    // 2. Renderizar lista de tarjetas Data Card para teléfonos móviles (Patrón Beezlebub)
    if (mobileContainer) {
      if (beneficiarios.length === 0) {
        mobileContainer.innerHTML = `
          <div style="text-align: center; padding: 28px 14px; color: var(--text-dim); background: var(--surface-1); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            No se encontraron beneficiarios con los criterios seleccionados.
          </div>
        `;
      } else {
        mobileContainer.innerHTML = beneficiarios.map(b => `
          <div class="mobile-card-item" id="mobile-card-${b.id}">
            <!-- Cabecera: ID + Badge Estado -->
            <div class="datacard-header">
              <div class="datacard-id">
                <span>ID:</span> ${b.codigo}
              </div>
              <div class="datacard-header-right">
                <span class="badge ${b.estado === 'Activo' ? 'badge-green' : 'badge-yellow'}">${b.estado}</span>
              </div>
            </div>

            <!-- Cuerpo: Datos principales siempre visibles -->
            <div class="datacard-body">
              <div class="datacard-row">
                <span class="datacard-label">Nombre del Menor</span>
                <span class="datacard-value">${b.nombres} ${b.apellidos}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">DNI / Documento</span>
                <span class="datacard-value">${b.dni}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Distrito / Sede</span>
                <span class="datacard-value">${b.distrito}: ${b.sede}</span>
              </div>

              <!-- Bloque Desplegable "Ver más" -->
              <div class="datacard-extra" id="extra-card-${b.id}">
                <div class="datacard-row">
                  <span class="datacard-label">Edad / Sexo</span>
                  <span class="datacard-value">${b.edad} / ${b.sexo}</span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Servicios Activos</span>
                  <span class="datacard-value" style="display:flex; flex-wrap:wrap; gap:4px; justify-content:flex-end;">
                    ${b.servicios.map(s => `<span class="badge badge-blue">${s}</span>`).join("")}
                  </span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Seguro de Salud</span>
                  <span class="datacard-value">${b.seguro || 'SIS Gratuito'}</span>
                </div>
                <div class="datacard-actions-footer">
                  <button type="button" class="btn-action primary" style="width:100%; justify-content:center;" onclick="event.stopPropagation(); window.openExpediente ? window.openExpediente(${b.id}) : window.app.beneficiarioController.openExpediente(${b.id})">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:6px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ver Expediente Completo
                  </button>
                </div>
              </div>

              <!-- Botón Ver más / Ver menos -->
              <button type="button" class="datacard-toggle-btn" id="btnToggleCard-${b.id}" onclick="window.PDI ? window.PDI.BeneficiariosView.toggleCard(${b.id}) : BeneficiariosView.toggleCard(${b.id})">
                <span class="btn-text">Ver más</span>
                <svg fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          </div>
        `).join("");
      }
    }
  },

  toggleCard(id) {
    const card = document.getElementById(`mobile-card-${id}`);
    const btn = document.getElementById(`btnToggleCard-${id}`);
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
  window.PDI.BeneficiariosView = BeneficiariosView;
}

