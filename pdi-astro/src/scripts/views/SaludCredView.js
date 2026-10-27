// Vista: Módulo de Salud y Nutrición CRED
import { crear as crearFiltros } from '../utils/Filters.js';
import { Responsive } from '../utils/Responsive.js';

import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";;
import { AnemiaCalculator } from "../utils/AnemiaCalculator.js";
import { ToastView } from "./ToastView.js";
import { AuditModel } from "../models/AuditModel.js";
import { SEDES_NOMBRES, etiquetaSede } from "../core/catalogos.js";
// Filtros del modulo CRED que viajan en la URL. Valores tomados de los
// desplegables de salud.html.
const FILTROS_SALUD = {
  q:       { valor: "" },
  anemia:  { valor: [], valores: ["Normal", "Leve", "Moderada"], multiple: true },
  sede:    { valor: [], valores: [...SEDES_NOMBRES], multiple: true },
  hb:      { valor: "all", valores: ["all", "anemia", "normal", "critico"] },
};

export const SaludCredView = {
  _allBeneficiarios: [],
  _filteredBeneficiarios: [],
  _searchQuery: "",
  _filterAnemia: [],
  _filterSede: [],
  _filterHbNivel: "all",
  _currentPage: 1,
  _pageSize: 20,

  _filtros: null,
  _filtrosLeidos: false,

  _obtenerFiltros() {
    if (!this._filtros) {
      this._filtros = crearFiltros(FILTROS_SALUD);
    }
    return this._filtros;
  },

  _getEffectivePageSize() {
    if (Responsive.esMovil()) {
      return Math.min(20, this._pageSize || 20);
    }
    return Math.min(50, this._pageSize || 20);
  },

  _syncPageSizeSelectUI() {
    const select = document.getElementById("selectSaludPageSize");
    if (select) {
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
      const opt50 = select.querySelector('option[value="50"]');
      if (opt50) {
        opt50.disabled = isMobile;
        if (isMobile && select.value === "50") {
          select.value = "20";
          this._pageSize = 20;
        }
      }
      select.value = String(this._pageSize);
    }
  },

  setPageSize(size) {
    const num = parseInt(size, 10);
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    const maxAllowed = isMobile ? 20 : 50;
    this._pageSize = isNaN(num) ? 20 : Math.min(maxAllowed, Math.max(5, num));
    this._currentPage = 1;
    this._syncPageSizeSelectUI();
    this.applyFilters(false);
  },

  goToPage(page) {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    this._currentPage = Math.min(totalPages, Math.max(1, page));
    this._renderTableAndCards(this._filteredBeneficiarios);
  },

  prevPage() {
    if (this._currentPage > 1) {
      this.goToPage(this._currentPage - 1);
    }
  },

  nextPage() {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    if (this._currentPage < totalPages) {
      this.goToPage(this._currentPage + 1);
    }
  },

  _renderPagination(totalCount) {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startRecord = totalCount === 0 ? 0 : (this._currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(totalCount, this._currentPage * pageSize);

    const infoEl = document.getElementById("saludPaginationInfo");
    if (infoEl) {
      infoEl.textContent = totalCount === 0
        ? "Mostrando 0 de 0 evaluaciones"
        : `Mostrando ${startRecord}–${endRecord} de ${totalCount} evaluaciones`;
    }

    const pageNumEl = document.getElementById("saludCurrentPageNum");
    if (pageNumEl) {
      pageNumEl.textContent = `Página ${this._currentPage} de ${totalPages}`;
    }

    const btnPrev = document.getElementById("btnSaludPagePrev");
    if (btnPrev) {
      btnPrev.disabled = this._currentPage <= 1 || totalCount === 0;
    }

    const btnNext = document.getElementById("btnSaludPageNext");
    if (btnNext) {
      btnNext.disabled = this._currentPage >= totalPages || totalCount === 0;
    }

    this._syncPageSizeSelectUI();
  },

  _persistirFiltros(extra) {
    this._obtenerFiltros().escribir({
      q: this._searchQuery,
      anemia: this._filterAnemia,
      sede: this._filterSede,
      hb: this._filterHbNivel,
      ...(extra || {}),
    });
  },

  _leerFiltrosDeURL() {
    if (this._filtrosLeidos) return;
    this._filtrosLeidos = true;

    const f = this._obtenerFiltros().leer();
    this._searchQuery = (f.q || "").toLowerCase();
    this._filterAnemia = f.anemia;
    this._filterSede = f.sede;
    this._filterHbNivel = f.hb;

    const input = document.getElementById("inputSaludSearch");
    if (input) input.value = f.q;
    const clearBtn = document.getElementById("btnSaludSearchClear");
    if (clearBtn) clearBtn.style.display = f.q ? "flex" : "none";

    this._updateAnemiaDropdownUI();
    this._updateSedeDropdownUI();
    this._updateHbUI();
  },

  renderTable(beneficiarios) {
    this._leerFiltrosDeURL();
    if (beneficiarios && Array.isArray(beneficiarios)) {
      this._allBeneficiarios = beneficiarios;
    } else if (window.PDI?.BeneficiarioModel) {
      this._allBeneficiarios = window.PDI.BeneficiarioModel.getAll();
    }
    this._vigilarVariante();
    this.applyFilters();
  },

  /**
   * Se suscribe una sola vez por carga al cruce del corte de 768 px. Cuando se
   * cruza hay que repintar, porque la variante que estaba vacia es la que pasa
   * a verse: solo se dibuja la que se ve, y no las dos.
   */
  _vigilarVariante() {
    if (this._vigilaVariante) return;
    this._vigilaVariante = true;
    Responsive.alCambiarDeVariante(() => this.applyFilters());
  },

  filterBySearch(query) {
    this._searchQuery = (query || "").trim().toLowerCase();
    const clearBtn = document.getElementById("btnSaludSearchClear");
    if (clearBtn) {
      clearBtn.style.display = this._searchQuery.length > 0 ? "flex" : "none";
    }
    this.applyFilters();
    this._persistirFiltros({ q: query || "" });
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
    this._persistirFiltros();
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
    const allSedes = SEDES_NOMBRES;
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
    this._persistirFiltros();
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
        labelEl.textContent = etiquetaSede(s);
      } else {
        labelEl.textContent = `${this._filterSede.length} seleccionadas`;
      }
    }
  },

  selectHbNivel(val, label) {
    this._filterHbNivel = val || "all";
    this._updateHbUI(label);

    const drop = document.getElementById("dropdownSaludHb");
    if (drop) drop.classList.remove("open");

    this.applyFilters();
    this._persistirFiltros();
  },

  /**
   * Pinta el desplegable de hemoglobina.
   *
   * La etiqueta se lee del propio <span class="padron-item-label"> y no del
   * argumento que le pasa el onclick. El texto ya está escrito en el HTML, y
   * duplicarlo en JavaScript es garantizar que acaben discrepando; además, al
   * restaurar desde la URL no hay ningún onclick que consultar.
   */
  _updateHbUI(etiquetaAlternativa) {
    const items = document.querySelectorAll("#menuSaludHb .padron-dropdown-item");
    let texto = null;
    items.forEach(item => {
      const coincide = item.getAttribute("data-value") === this._filterHbNivel;
      item.classList.toggle("selected", coincide);
      if (coincide) {
        const span = item.querySelector(".padron-item-label");
        if (span) texto = span.textContent.trim();
      }
    });

    const labelEl = document.getElementById("labelSaludHbSelect");
    if (labelEl) {
      labelEl.textContent = texto || etiquetaAlternativa || "Todos los Niveles";
    }
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
    this._updateHbUI();

    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this.applyFilters();
    this._persistirFiltros();
  },

  _matchesAnemia(b, anemiaKeys) {
    if (!anemiaKeys || anemiaKeys.length === 0) return true;
    const actual = AnemiaCalculator.normalizar(b && b.anemia);
    return anemiaKeys.some(key => {
      if (key === "Moderada") {
        return actual === "Moderada" || actual === "Severa";
      }
      return actual === key;
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

    this._renderActiveChips();
    this._renderTableAndCards(list);
    this._pintarDashboard();
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
        chips.push({
          id: "sede",
          val: s,
          label: `Sede: ${etiquetaSede(s)}`
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
          <span>${escapar(chip.label)}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeSaludChip ? window.removeSaludChip('${escaparEnManejador(chip.id)}', '${escaparEnManejador(chip.val || '')}') : null" title="Eliminar filtro">
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
    const paginationBar = document.getElementById("saludPaginationBar");

    const totalCount = beneficiarios.length;
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (this._currentPage > totalPages) this._currentPage = totalPages;
    if (this._currentPage < 1) this._currentPage = 1;

    const startIndex = (this._currentPage - 1) * pageSize;
    const pageItems = beneficiarios.slice(startIndex, startIndex + pageSize);

    this._renderPagination(totalCount);
    if (paginationBar) {
      paginationBar.style.display = totalCount === 0 ? "none" : "flex";
    }

    const enMovil = Responsive.esMovil();

    if (enMovil) { if (tbody) tbody.innerHTML = ""; }
    else { if (mobileContainer) mobileContainer.innerHTML = ""; }

    if (beneficiarios.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px 16px;">
            <div style="width: 44px; height: 44px; margin: 0 auto 10px; border-radius: 50%; background: var(--gt-green-bg); display: flex; align-items: center; justify-content: center; color: var(--text-brand);">
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
      if (tbody && !enMovil) tbody.innerHTML = emptyHtml;

      if (mobileContainer && enMovil) {
        mobileContainer.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; background: var(--surface-1); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 8px;">
            <div style="width: 44px; height: 44px; margin: 0 auto 10px; border-radius: 50%; background: var(--gt-green-bg); display: flex; align-items: center; justify-content: center; color: var(--text-brand);">
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

    if (tbody && !enMovil) {
      tbody.innerHTML = pageItems.map(b => {
        const nTamizajes = Array.isArray(b.tamizajes) ? b.tamizajes.length : 0;
        let badgeClass = "badge-green";
        if (b.anemia === "Leve") badgeClass = "badge-yellow";
        if (b.anemia === "Moderada" || b.anemia === "Severa") badgeClass = "badge-red";

        return `
          <tr>
            <td><strong>${escapar(b.nombres)} ${escapar(b.apellidos)}</strong><div style="font-size:11.5px; color:var(--text-dim); font-family:var(--mono-font);">${escapar(b.codigo)}</div></td>
            <td>${escapar(b.edad)}</td>
            <td>${escapar(b.peso)} kg / ${escapar(b.talla)} cm</td>
            <td><strong style="font-family:var(--mono-font);">${escapar(b.hb)} g/dL</strong>${this._chipTendenciaHb(b)}${nTamizajes > 1 ? `<div style="font-size:11px; color:var(--text-dim); margin-top:2px;">${nTamizajes} pruebas registradas</div>` : ''}</td>
            <td><span class="badge ${badgeClass}">${escapar(b.anemia)}</span></td>
            <td>${b.anemia !== "Normal" ? "Sulfato Ferroso 1 dosis/día" : "Dieta Preventiva"}</td>
            <td>
              <div class="row-actions">
                <button type="button" class="row-action" onclick="window.registrarDosaje ? window.registrarDosaje(${escaparEnManejador(b.id)}) : null" title="Registrar dosaje" aria-label="Registrar un dosaje de hemoglobina">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <button type="button" class="row-action" onclick="window.openHistorialTamizaje ? window.openHistorialTamizaje(${escaparEnManejador(b.id)}) : window.openExpediente(${escaparEnManejador(b.id)})" title="Historial de tamizajes de hemoglobina" aria-label="Ver historial de tamizajes de hemoglobina">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2.25 12S5.75 5.25 12 5.25 21.75 12 21.75 12 18.25 18.75 12 18.75 2.25 12 2.25 12Z" />
                    <circle cx="12" cy="12" r="3.25" />
                    <circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none" />
                  </svg>
                </button>
                <button type="button" class="row-action" onclick="window.openExpediente(${escaparEnManejador(b.id)})" title="Abrir expediente integral" aria-label="Abrir expediente integral">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M9 15h6" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    if (mobileContainer && enMovil) {
      mobileContainer.innerHTML = pageItems.map(b => {
        const nTamizajes = Array.isArray(b.tamizajes) ? b.tamizajes.length : 0;
        let badgeClass = "badge-green";
        if (b.anemia === "Leve") badgeClass = "badge-yellow";
        if (b.anemia === "Moderada" || b.anemia === "Severa") badgeClass = "badge-red";

        return `
          <div class="mobile-card-item" id="mobile-salud-${escapar(b.id)}">
            <!-- Cabecera: ID + Badge Diagnóstico Anemia -->
            <div class="datacard-header">
              <div class="datacard-id">
                <span>ID:</span> ${escapar(b.codigo)}
              </div>
              <div class="datacard-header-right">
                <span class="badge ${badgeClass}">${escapar(b.anemia)}</span>
              </div>
            </div>

            <!-- Cuerpo: Datos principales siempre visibles -->
            <div class="datacard-body">
              <div class="datacard-row">
                <span class="datacard-label">Usuario</span>
                <span class="datacard-value">${escapar(b.nombres)} ${escapar(b.apellidos)}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Hemoglobina (Hb)</span>
                <span class="datacard-value" style="color:var(--text-warning); font-weight:800; font-family:var(--mono-font);">${escapar(b.hb)} g/dL</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Diagnóstico Anemia</span>
                <span class="datacard-value">${escapar(b.anemia)}</span>
              </div>

              <!-- Bloque Desplegable "Ver más" -->
              <div class="datacard-extra" id="extra-salud-${escapar(b.id)}">
                <div class="datacard-row">
                  <span class="datacard-label">Edad</span>
                  <span class="datacard-value">${escapar(b.edad)}</span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Peso / Talla</span>
                  <span class="datacard-value">${escapar(b.peso)} kg / ${escapar(b.talla)} cm</span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Suplementación</span>
                  <span class="datacard-value">${b.anemia !== "Normal" ? "Sulfato Ferroso 1 dosis/día" : "Dieta Preventiva"}</span>
                </div>
                <div class="datacard-actions-footer">
                  <button type="button" class="btn-action primary" style="width:100%; justify-content:center; margin-bottom:6px;" onclick="event.stopPropagation(); window.registrarDosaje ? window.registrarDosaje(${escaparEnManejador(b.id)}) : null">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:6px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    Registrar dosaje
                  </button>
                  <button type="button" class="btn-action primary" style="width:100%; justify-content:center;" onclick="event.stopPropagation(); window.openHistorialTamizaje ? window.openHistorialTamizaje(${escaparEnManejador(b.id)}) : window.openExpediente(${escaparEnManejador(b.id)})">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:6px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12S5.75 5.25 12 5.25 21.75 12 21.75 12 18.25 18.75 12 18.75 2.25 12 2.25 12Z" />
                      <circle cx="12" cy="12" r="3.25" />
                    </svg>
                    Historial de Tamizajes (Hb)
                  </button>
                </div>
              </div>

              <!-- Botón Ver más / Ver menos -->
              <button type="button" class="datacard-toggle-btn" id="btnToggleSalud-${escapar(b.id)}" onclick="window.PDI ? window.PDI.SaludCredView.toggleCard(${escaparEnManejador(b.id)}) : SaludCredView.toggleCard(${escaparEnManejador(b.id)})">
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

  // ---------------------------------------------------------------------------
  //  Historial de tamizajes de hemoglobina (modal)
  // ---------------------------------------------------------------------------
  /**
   * Abre el modal con la linea de tiempo de tamizajes del usuario. Los datos
   * ya viajan con el padron (b.tamizajes), no hay segunda consulta: el modal
   * pinta lo que la vista ya tenia.
   */
  openHistorialTamizaje(id) {
    const num = Number(id);
    const b = this._allBeneficiarios.find(x => x.id === num)
      || (window.PDI?.BeneficiarioModel?.getById ? window.PDI.BeneficiarioModel.getById(num) : null);
    if (!b) return;

    // Cada apertura arranca con el formulario recogido y el usuario fijado.
    this._pruebaUsuarioId = num;
    this._ocultarFormularioNuevaPrueba();

    const setTxt = (elId, val) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = val || "-";
    };
    setTxt("histTamUsuarioNombre", `${b.nombres} ${b.apellidos}`);
    setTxt("histTamUsuarioCodigo", b.codigo);
    setTxt("histTamUsuarioSede", b.sede);

    const listado = document.getElementById("histTamListado");
    if (listado) listado.innerHTML = this._renderTamizajes(b);

    const modal = document.getElementById("modalHistorialTamizaje");
    if (!modal) return;
    modal.removeAttribute("inert");
    modal.removeAttribute("aria-hidden");
    modal.classList.add("open");
  },

  /**
   * Chip de avance junto al valor de Hb de la tabla: compara las dos pruebas
   * activas mas recientes. La flecha sigue la direccion del valor de Hb (sube
   * = mejora en verde, baja = empeora en rojo). Sin dos pruebas no hay
   * tendencia y no se pinta nada.
   */
  _chipTendenciaHb(b) {
    const tams = Array.isArray(b.tamizajes) ? b.tamizajes.filter(t => t.hb != null) : [];
    if (tams.length < 2) return "";
    const ult = Number(tams[0].hb);
    const prev = Number(tams[1].hb);
    if (isNaN(ult) || isNaN(prev)) return "";
    const delta = Number((ult - prev).toFixed(1));
    const prevTxt = escapar(prev);
    if (delta === 0) {
      return ` <span title="Sin cambio frente a la prueba anterior (${prevTxt} g/dL)" style="font-size:11px; font-weight:700; color:var(--text-muted);">(igual)</span>`;
    }
    const mejora = delta > 0; // subir Hb es mejorar
    const color = mejora ? "var(--text-success)" : "var(--text-danger)";
    const signo = mejora ? "▲" : "▼";
    return ` <span title="Prueba anterior: ${prevTxt} g/dL" style="font-size:11px; font-weight:800; color:${color}; white-space:nowrap;">${signo} ${Math.abs(delta)}</span>`;
  },

  /**
   * Mini-grafica SVG de la evolucion de la Hb en el modal de historial.
   * La lista llega de la nube con la mas reciente primero, aqui se invierte a
   * orden cronologico. Con menos de dos puntos no hay evolucion y no se pinta.
   * La linea punteada marca 11.0 g/dL (umbral MINSA); cada punto lleva el
   * color de su semaforo y el ultimo se resalta con su valor.
   */
  _sparklineHb(registros) {
    const puntos = registros
      .filter(t => t.hb != null && !isNaN(Number(t.hb)))
      .slice()                       // copia: no revolvemos la lista del modal
      .reverse();                    // cronologico: mas antiguo → mas reciente
    if (puntos.length < 2) return "";

    const cont = document.getElementById("histTamListado");
    const w = Math.max(220, Math.min(520, (cont && cont.clientWidth ? cont.clientWidth : 360) - 48));
    const h = 76;
    const izq = 10, der = 46, arriba = 10, abajo = 20; // margen der para la etiqueta final
    const ancho = w - izq - der, alto = h - arriba - abajo;

    const vals = puntos.map(t => Number(t.hb));
    let lo = Math.min(...vals, 11);
    let hi = Math.max(...vals, 11);
    const holgura = Math.max((hi - lo) * 0.18, 0.6);
    lo = Math.max(0, lo - holgura);
    hi = hi + holgura;

    const px = i => izq + (i * ancho) / (puntos.length - 1);
    const py = v => arriba + ((hi - v) / (hi - lo)) * alto;

    const linea = vals.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
    const y11 = py(11).toFixed(1);
    const y11Visible = 11 >= lo && 11 <= hi;

    const puntosSvg = puntos.map((t, i) => {
      const calc = AnemiaCalculator.calculate(vals[i]);
      const fecha = t.fecha ? new Date(t.fecha) : null;
      const fechaTxt = fecha && !isNaN(fecha.getTime())
        ? fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
        : "sin fecha";
      const esUltimo = i === puntos.length - 1;
      return `
        <circle cx="${px(i).toFixed(1)}" cy="${py(vals[i]).toFixed(1)}" r="${esUltimo ? 4.5 : 2.8}"
          fill="${calc.color}" ${esUltimo ? 'stroke="var(--surface-1)" stroke-width="1.5"' : ''}>
          <title>${escapar(fechaTxt)}: ${escapar(vals[i])} g/dL — ${escapar(calc.label)}</title>
        </circle>`;
    }).join('');

    const ultimo = vals[vals.length - 1];
    const etiquetaFinal = `
      <text x="${(w - der + 6).toFixed(1)}" y="${(py(ultimo) + 3.5).toFixed(1)}"
        font-size="10.5" font-weight="800" font-family="var(--mono-font)"
        fill="${AnemiaCalculator.calculate(ultimo).color}">${escapar(ultimo)}</text>`;

    return `
      <div style="background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:12px 14px 8px; margin-bottom:6px;">
        <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--text-dim); letter-spacing:0.5px; margin-bottom:4px;">
          Evolución de Hb (g/dL) · ${puntos.length} pruebas${y11Visible ? " · línea punteada = 11.0" : ""}
        </div>
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolución del valor de hemoglobina">
          ${y11Visible ? `<line x1="${izq}" y1="${y11}" x2="${(w - der).toFixed(1)}" y2="${y11}" stroke="var(--text-success)" stroke-width="1" stroke-dasharray="3 3" opacity="0.7" />` : ""}
          <polyline points="${linea}" fill="none" stroke="var(--text-brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          ${puntosSvg}
          ${etiquetaFinal}
        </svg>
      </div>`;
  },

  /**
   * Filas del historial, la mas reciente primero (orden con el que la nube
   * entrega la lista). Si el usuario no trae lista padronizada (datos viejos
   * de seed), el valor unico del padron se presenta como unico punto.
   */
  _renderTamizajes(b) {
    const registros = Array.isArray(b.tamizajes) && b.tamizajes.length
      ? b.tamizajes
      : (b.hb != null ? [{ fecha: "", hb: b.hb, anemia: b.anemia, peso: b.peso, talla: b.talla }] : []);

    if (registros.length === 0) {
      return `
        <div style="text-align:center; padding:30px 16px; color:var(--text-muted); font-size:12.5px;">
          Sin tamizajes de hemoglobina registrados para este usuario.
        </div>`;
    }

    return this._sparklineHb(registros) + registros.map((t, idx) => {
      const calc = AnemiaCalculator.calculate(t.hb);
      const fecha = t.fecha ? new Date(t.fecha) : null;
      const fechaTxt = fecha && !isNaN(fecha.getTime())
        ? fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
        : "Fecha no registrada";
      const ptTxt = (t.peso != null || t.talla != null)
        ? `${t.peso != null ? `${escapar(t.peso)} kg` : '—'} / ${t.talla != null ? `${escapar(t.talla)} cm` : '—'}`
        : "No registrados en la prueba";
      const borde = idx < registros.length - 1 ? " border-bottom:1px solid var(--border-subtle);" : "";

      return `
        <div style="display:flex; align-items:flex-start; gap:12px; padding:12px 4px;${borde}">
          <div style="width:10px; height:10px; border-radius:50%; margin-top:5px; flex-shrink:0; background:${calc.color};"></div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span style="font-size:12.5px; font-weight:700; color:var(--text-main); font-family:var(--mono-font);">${escapar(t.hb)} g/dL</span>
              <span class="badge ${calc.badgeClass}">${escapar(calc.label)}</span>
              ${idx === 0 ? `<span class="badge badge-blue">Última prueba</span>` : ""}
            </div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:3px;">${escapar(fechaTxt)}</div>
            <div style="font-size:11.5px; color:var(--text-dim); margin-top:3px;">
              <span style="font-weight:600; color:var(--text-dim);">Acción sugerida:</span> ${escapar(calc.accion)}
            </div>
            ${t._tamizajeId ? `
              <div style="margin-top:6px;">
                <button type="button"
                  onclick="window.abrirMotivoDesactivar ? window.abrirMotivoDesactivar(${idx}) : null"
                  style="background:none; border:none; padding:0; color:var(--text-danger); font-size:11px; cursor:pointer; text-decoration:underline dotted;">
                  Desactivar esta prueba
                </button>
              </div>
              <div id="tamDesact_${idx}" style="display:none; margin-top:8px; gap:8px; flex-wrap:wrap; align-items:center; background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px 12px;">
                <input id="tamDesactMotivo_${idx}" type="text" class="form-control" maxlength="140"
                  style="flex:1 1 180px; min-width:150px; margin:0; font-size:12px;"
                  placeholder="Motivo (obligatorio), p. ej. captura errónea"
                  onkeydown="if (event.key === 'Enter' &amp;&amp; window.confirmarDesactivarPrueba) window.confirmarDesactivarPrueba(${idx});" />
                <button type="button" class="btn-action primary" style="font-size:11.5px;"
                  onclick="window.confirmarDesactivarPrueba ? window.confirmarDesactivarPrueba(${idx}) : null">Confirmar</button>
                <button type="button" class="btn-action btn-secondary" style="font-size:11.5px;"
                  onclick="window.ocultarMotivoDesactivar ? window.ocultarMotivoDesactivar(${idx}) : null">Cancelar</button>
              </div>` : ""}
          </div>
          <div style="flex-shrink:0; text-align:right; font-size:11.5px; color:var(--text-muted); font-family:var(--mono-font); line-height:1.5;">
            <div>${ptTxt}</div>
          </div>
        </div>
      `;
    }).join("");
  },

  closeModalHistorialTamizaje() {
    const modal = document.getElementById("modalHistorialTamizaje");
    if (!modal) return;
    this._ocultarFormularioNuevaPrueba();
    this._pruebaUsuarioId = null;
    modal.classList.remove("open");
    modal.setAttribute("inert", "");
    modal.setAttribute("aria-hidden", "true");
  },

  // ---------------------------------------------------------------------------
  //  Añadir prueba de hemoglobina (append-only)
  // ---------------------------------------------------------------------------
  /** Despliega el formulario de nueva prueba del usuario del modal abierto. */
  mostrarFormularioNuevaPrueba() {
    if (!this._pruebaUsuarioId) return;
    const form = document.getElementById("formNuevaPrueba");
    if (!form) return;
    form.style.display = "flex";

    const fechaInput = document.getElementById("nuevaPruebaFecha");
    if (fechaInput) {
      const hoy = new Date();
      const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
      fechaInput.max = hoyStr;
      fechaInput.value = hoyStr;
    }
    ["nuevaPruebaHb", "nuevaPruebaPeso", "nuevaPruebaTalla"].forEach(idEl => {
      const campo = document.getElementById(idEl);
      if (campo) campo.value = "";
    });
    this._actualizarPreviewNuevaPrueba();
    form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  },

  /** Recoge el formulario sin perder el listado ni el usuario activo. */
  _ocultarFormularioNuevaPrueba() {
    const form = document.getElementById("formNuevaPrueba");
    if (form) form.style.display = "none";
  },

  /** Semáforo MINSA en vivo mientras se digita el valor de Hb. */
  _actualizarPreviewNuevaPrueba() {
    const campo = document.getElementById("nuevaPruebaHb");
    const diagEl = document.getElementById("nuevaPruebaPreviewDiagnostico");
    const accionEl = document.getElementById("nuevaPruebaPreviewAccion");
    if (!campo || !diagEl || !accionEl) return;

    const calc = AnemiaCalculator.calculate(campo.value);
    const vacio = String(campo.value).trim() === "";
    diagEl.textContent = vacio ? "—" : calc.label;
    diagEl.style.color = vacio ? "var(--text-muted)" : calc.color;
    accionEl.textContent = vacio
      ? "Ingrese el valor de Hb para calcular la clasificación y la acción sugerida."
      : `Acción: ${calc.accion}`;
  },

  /**
   * Valida y registra el dosaje. Reglas: fecha obligatoria no futura y sin
   * duplicar un día ya registrado para el usuario; Hb obligatoria dentro del
   * rango clinicamente plausible (3-20 g/dL); peso y talla opcionales.
   */
  async guardarNuevaPrueba() {
    const b = this._allBeneficiarios.find(x => x.id === this._pruebaUsuarioId)
      || (window.PDI?.BeneficiarioModel?.getById ? window.PDI.BeneficiarioModel.getById(this._pruebaUsuarioId) : null);
    if (!b) return;

    const valorDe = id => document.getElementById(id);
    const fechaStr = (valorDe("nuevaPruebaFecha") || {}).value || "";
    const pesoRaw = (valorDe("nuevaPruebaPeso") || {}).value || "";
    const tallaRaw = (valorDe("nuevaPruebaTalla") || {}).value || "";
    const hbVal = parseFloat((valorDe("nuevaPruebaHb") || {}).value);

    const aviso = (titulo, msg) => {
      (window.PDI?.ToastView || ToastView).show(titulo, msg, "danger");
    };

    if (!fechaStr) return aviso("Falta la fecha", "Indica la fecha en que se tomó el dosaje.");
    if (new Date(`${fechaStr}T23:59:59`) > new Date()) return aviso("Fecha futura", "El dosaje se registra con fecha igual o anterior a hoy.");
    if (Array.isArray(b.tamizajes) && b.tamizajes.some(t => String(t.fecha || "").slice(0, 10) === fechaStr)) {
      return aviso("Fecha duplicada", "Ya existe una prueba registrada para ese día; completa el formulario con otra fecha.");
    }
    if (isNaN(hbVal) || hbVal < 3 || hbVal > 20) {
      return aviso("Hemoglobina fuera de rango", "El valor debe estar entre 3.0 y 20.0 g/dL (rango clínicamente plausible).");
    }
    const pesoVal = parseFloat(pesoRaw);
    if (pesoRaw !== "" && (isNaN(pesoVal) || pesoVal <= 0 || pesoVal > 60)) {
      return aviso("Peso inválido", "Si se registra el peso, debe estar entre 0.1 y 60 kg.");
    }
    const tallaVal = parseFloat(tallaRaw);
    if (tallaRaw !== "" && (isNaN(tallaVal) || tallaVal <= 0 || tallaVal > 180)) {
      return aviso("Talla inválida", "Si se registra la talla, debe estar entre 0.1 y 180 cm.");
    }

    const calc = AnemiaCalculator.calculate(hbVal);
    const esNormal = calc.label.includes("Normal");
    const prueba = {
      fecha: fechaStr,
      hb: hbVal,
      resultado: esNormal ? "Normal" : calc.label.toLowerCase(), // "Anemia leve" | "Anemia moderada" | "Anemia severa"
      // Clave canónica: la que comparan filtros y conteos del panel.
      anemia: calc.clase || (esNormal ? "Normal" : "Leve"),
      peso: pesoRaw !== "" ? pesoVal : null,
      talla: tallaRaw !== "" ? tallaVal : null,
    };

    window.PDI?.BeneficiarioModel?.registrarTamizaje(b.id, prueba);
    this._ocultarFormularioNuevaPrueba();
    this.applyFilters(); // la fila del padron pasa al nuevo valor vigente

    const listado = document.getElementById("histTamListado");
    if (listado) listado.innerHTML = this._renderTamizajes(b);

    // Bitácora: los filtros de auditoria ya reconocen la accion "Tamizaje".
    const rol = localStorage.getItem("pdi_active_role") || "facilitadora";
    const cargo = rol === "admin"
      ? "Administrador de Sistemas TI"
      : (rol === "coord" ? "Dirección y Coordinación General" : "Facilitadora Nutricional");
    const audit = window.PDI?.AuditModel || AuditModel;
    if (audit) {
      audit.log(
        localStorage.getItem("pdi_usuario_nombre") || "Especialista Salud PDI",
        cargo,
        "Tamizaje CRED Registrado",
        b.codigo,
        `Nuevo dosaje de hemoglobina: ${b.nombres} ${b.apellidos} → ${prueba.hb} g/dL (${calc.label}).`,
        "Válido"
      );
    }
    (window.PDI?.ToastView || ToastView).show(
      "Prueba Registrada",
      `Dosaje de ${b.nombres} ${b.apellidos}: ${prueba.hb} g/dL (${calc.label}).`,
      "success"
    );

    // La nube confirma la escritura y realinea ids y fechas canonicas.
    try {
      if (window.PDI?.DB?.refrescarDesdeNube) await window.PDI.DB.refrescarDesdeNube();
      const vigente = window.PDI?.BeneficiarioModel?.getById(b.id) || b;
      if (document.getElementById("modalHistorialTamizaje")?.classList.contains("open")) {
        const listaViva = document.getElementById("histTamListado");
        if (listaViva) listaViva.innerHTML = this._renderTamizajes(vigente);
      }
    } catch (e) {
      // La interfaz ya refleja el cambio optimista; la siguiente hidratacion corrige.
    }
  },

  // ---------------------------------------------------------------------------
  //  Desactivar prueba (soft delete) y exportación del historial
  // ---------------------------------------------------------------------------
  /** Abre el panel de motivo de desactivación de la fila idx del listado. */
  abrirMotivoDesactivar(idx) {
    const panel = document.getElementById(`tamDesact_${idx}`);
    if (!panel) return;
    panel.style.display = "flex";
    const campo = document.getElementById(`tamDesactMotivo_${idx}`);
    if (campo) { campo.value = ""; campo.focus(); }
  },

  /** Recoge el panel de motivo sin tocar la fila. */
  ocultarMotivoDesactivar(idx) {
    const panel = document.getElementById(`tamDesact_${idx}`);
    if (panel) panel.style.display = "none";
  },

  /**
   * Confirma la desactivación: motivo obligatorio (queda en la bitácora, que
   * es el registro inalterable), la fila sale del historial (optimista) y la
   * nube la marca activo = false. Solo procede si la fila trae id canónico.
   */
  async confirmarDesactivarPrueba(idx) {
    const b = this._allBeneficiarios.find(x => x.id === this._pruebaUsuarioId)
      || (window.PDI?.BeneficiarioModel?.getById ? window.PDI.BeneficiarioModel.getById(this._pruebaUsuarioId) : null);
    if (!b || !Array.isArray(b.tamizajes)) return;

    const fila = b.tamizajes[idx];
    if (!fila || !fila._tamizajeId) return; // fila sin id canonico (datos seed)

    const motivo = ((document.getElementById(`tamDesactMotivo_${idx}`) || {}).value || "").trim();
    if (motivo.length < 4) {
      (window.PDI?.ToastView || ToastView).show(
        "Falta el motivo", "Describe por qué se desactiva la prueba (mínimo 4 caracteres).", "danger");
      return;
    }

    const fecha = fila.fecha ? new Date(fila.fecha) : null;
    const fechaTxt = fecha && !isNaN(fecha.getTime())
      ? fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })
      : "fecha no registrada";

    window.PDI?.BeneficiarioModel?.desactivarTamizaje(b.id, fila._tamizajeId);

    // Bitácora: el motivo vive aqui, en el registro inalterable de auditoría.
    const rol = localStorage.getItem("pdi_active_role") || "facilitadora";
    const cargo = rol === "admin"
      ? "Administrador de Sistemas TI"
      : (rol === "coord" ? "Dirección y Coordinación General" : "Facilitadora Nutricional");
    const audit = window.PDI?.AuditModel || AuditModel;
    if (audit) {
      audit.log(
        localStorage.getItem("pdi_usuario_nombre") || "Especialista Salud PDI",
        cargo,
        "Tamizaje CRED Desactivado",
        b.codigo,
        `Prueba del ${fechaTxt} (${fila.hb} g/dL) desactivada. Motivo: ${motivo}`,
        "Válido"
      );
    }
    (window.PDI?.ToastView || ToastView).show(
      "Prueba Desactivada",
      `La prueba del ${fechaTxt} ya no cuenta para el historial de ${b.nombres} ${b.apellidos}.`,
      "success"
    );

    const listado = document.getElementById("histTamListado");
    if (listado) listado.innerHTML = this._renderTamizajes(b);
    this.applyFilters(); // la fila del padron pasa a su valor vigente real

    try {
      if (window.PDI?.DB?.refrescarDesdeNube) await window.PDI.DB.refrescarDesdeNube();
      const vigente = window.PDI?.BeneficiarioModel?.getById(b.id) || b;
      if (document.getElementById("modalHistorialTamizaje")?.classList.contains("open")) {
        const listaViva = document.getElementById("histTamListado");
        if (listaViva) listaViva.innerHTML = this._renderTamizajes(vigente);
      }
    } catch (e) {
      // La interfaz ya reflejó el cambio optimista; la siguiente hidratacion corrige.
    }
  },

  /** Escapa una celda CSV (separador ';' compatible con Excel en español). */
  _csvCelda(valor) {
    const s = valor == null ? "" : String(valor);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  },

  /**
   * Exporta el historial visible del usuario como .csv (UTF-8 con BOM, punto y
   * coma: lo abre Excel directo en es-PE). Una fila por prueba activa.
   */
  exportarHistorialCsv() {
    const b = this._allBeneficiarios.find(x => x.id === this._pruebaUsuarioId)
      || (window.PDI?.BeneficiarioModel?.getById ? window.PDI.BeneficiarioModel.getById(this._pruebaUsuarioId) : null);
    if (!b) return;
    const regs = Array.isArray(b.tamizajes) && b.tamizajes.length
      ? b.tamizajes
      : (b.hb != null ? [{ fecha: "", hb: b.hb, hbAjustada: null, peso: b.peso, talla: b.talla }] : []);
    if (regs.length === 0) {
      (window.PDI?.ToastView || ToastView).show(
        "Sin datos", "Este usuario no tiene pruebas activas que exportar.", "info");
      return;
    }

    const filas = [[
      "Fecha", "Hemoglobina (g/dL)", "Hb ajustada (g/dL)", "Peso (kg)", "Talla (cm)",
      "Diagnóstico MINSA", "Acción sugerida",
    ]];
    regs.forEach(t => {
      const calc = AnemiaCalculator.calculate(t.hb);
      const fecha = t.fecha ? new Date(t.fecha) : null;
      filas.push([
        fecha && !isNaN(fecha.getTime()) ? fecha.toISOString().slice(0, 10) : "",
        t.hb ?? "", t.hbAjustada ?? "", t.peso ?? "", t.talla ?? "",
        calc.label, calc.accion,
      ]);
    });

    const csv = "\uFEFF" + filas.map(f => f.map(v => this._csvCelda(v)).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tamizajes_${String(b.codigo || "usuario").replace(/[^\w-]+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 400);

    (window.PDI?.ToastView || ToastView).show(
      "Historial Exportado",
      `${filas.length - 1} prueba(s) de ${b.nombres} ${b.apellidos} en archivo CSV.`,
      "success"
    );
  },

  // ---------------------------------------------------------------------------
  //  Panel rápido CRED · semáforo MINSA + KPIs
  // ---------------------------------------------------------------------------
  /**
   * Pinta el panel rápido: anillo de distribución, leyenda y 4 KPIs. Las
   * cifras salen del padrón completo (no de la tabla filtrada) y el estado de
   * los filtros se refleja en leyenda y KPI.
   *
   * Se construye una sola vez (arcs y leyenda conservan su animación de
   * entrada); después solo actualiza cifras, largos de arco y estados. Corre
   * al final de applyFilters, así que todos los caminos de filtrado quedan
   * sincronizados sin código extra en cada acción.
   */
  _pintarDashboard() {
    const root = document.getElementById("dashRapido");
    if (!root) return;
    const lista = Array.isArray(this._allBeneficiarios) ? this._allBeneficiarios : [];

    const CLASES = [
      { key: "Normal",   color: "var(--gt-green)",  rango: "≥ 11.0",    opacidad: 1 },
      { key: "Leve",     color: "var(--gt-yellow)", rango: "10.0–10.9", opacidad: 1 },
      { key: "Moderada", color: "var(--gt-orange)", rango: "7.0–9.9",   opacidad: 1 },
      { key: "Severa",   color: "var(--gt-red)",    rango: "< 7.0",     opacidad: 1 },
    ];
    // La leyenda agrupa Moderada y Severa en una sola fila (el filtro ya las
    // trata juntas en _matchesAnemia); el anillo conserva los dos colores y el
    // punto de la fila muestra ambos.
    const LEYENDA = CLASES
      .filter(c => c.key !== "Severa")
      .map(c => c.key === "Moderada"
        ? { ...c, etiqueta: "Moderada o severa", color: "linear-gradient(90deg, var(--gt-orange) 50%, var(--gt-red) 50%)" }
        : { ...c, etiqueta: c.key });
    const cuenta = { Normal: 0, Leve: 0, Moderada: 0, Severa: 0 };
    let conDato = 0;
    let sumaHb = 0;
    let nHb = 0;
    const hoy = new Date();
    let pruebasMes = 0;

    lista.forEach(b => {
      // El almacenamiento puede traer etiquetas históricas ("Anemia Leve",
      // "En riesgo"): se normalizan para que el semáforo y los filtros cuenten
      // siempre lo mismo.
      const clase = AnemiaCalculator.normalizar(b && b.anemia);
      if (clase && Object.prototype.hasOwnProperty.call(cuenta, clase)) {
        cuenta[clase]++;
        conDato++;
      }
      const hb = parseFloat(b.hb);
      if (!isNaN(hb)) {
        sumaHb += hb;
        nHb++;
      }
      if (Array.isArray(b.tamizajes)) {
        b.tamizajes.forEach(t => {
          const f = t.fecha ? new Date(t.fecha) : null;
          if (f && !isNaN(f.getTime())
            && f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()) {
            pruebasMes++;
          }
        });
      }
    });

    const filtroClase = this._filterAnemia && this._filterAnemia.length === 1
      ? this._filterAnemia[0]
      : null;
    // Porcentajes con reparto por mayor resto: las cuatro clases suman 100 y
    // «Con anemia» coincide con Leve + Moderada + Severa. El redondeo
    // independiente dejaba 46 + 38 + 15 + 0 = 99 frente al 54 % del KPI.
    const pctClase = (() => {
      if (conDato <= 0) return { Normal: 0, Leve: 0, Moderada: 0, Severa: 0 };
      const exactos = CLASES.map(c => (cuenta[c.key] / conDato) * 100);
      const bases = exactos.map(Math.floor);
      const resto = 100 - bases.reduce((a, b) => a + b, 0);
      const orden = exactos
        .map((v, i) => ({ i, frac: v - bases[i] }))
        .sort((a, b) => b.frac - a.frac);
      for (let j = 0; j < resto; j++) bases[orden[j % orden.length].i]++;
      return Object.fromEntries(CLASES.map((c, i) => [c.key, bases[i]]));
    })();
    const pctSinAnemia = pctClase.Normal;
    const conAnemia = conDato - cuenta.Normal;
    const pctConAnemia = conDato > 0 ? 100 - pctSinAnemia : 0;
    const promedio = nHb > 0 ? Math.round((sumaHb / nHb) * 10) / 10 : null;
    const mesNombre = hoy.toLocaleDateString("es-PE", { month: "long" }).toLocaleLowerCase("es-PE");

    // --- Anillo: arcos proporcionales con separación fija entre segmentos ---
    const R = 66;
    const C = 2 * Math.PI * R;
    const GAP = 3;
    const grupo = document.getElementById("dashDonutArcs");
    if (grupo && grupo.childElementCount === 0) {
      grupo.innerHTML = CLASES.map((c, i) => `
        <circle class="dash-arc" id="dashArc${c.key}" cx="84" cy="84" r="${R}"
          data-clase="${c.key}" aria-hidden="true"
          stroke="${c.color}" stroke-opacity="${c.opacidad}"
          style="--dash-arc-delay:${240 + i * 90}ms;">
          <title>${c.key}</title>
        </circle>`).join("");
    }
    if (grupo && !grupo.dataset.wired) {
      grupo.dataset.wired = "1";
      const activar = (ev) => {
        const arco = ev.target && ev.target.closest ? ev.target.closest("[data-clase]") : null;
        if (!arco) return;
        if (ev.type === "keydown") {
          if (ev.key !== "Enter" && ev.key !== " ") return;
          ev.preventDefault();
        }
        const clase = arco.getAttribute("data-clase");
        if (clase && typeof window.dashboardFiltrar === "function") {
          // El anillo conserva el arco rojo de Severa, pero la leyenda y el
          // filtro agrupan Moderada + Severa: pulsar el rojo filtra el grupo.
          window.dashboardFiltrar("clase", clase === "Severa" ? "Moderada" : clase);
        }
      };
      grupo.addEventListener("click", activar);
      grupo.addEventListener("keydown", activar);
    }

    let avance = 0;
    CLASES.forEach(c => {
      const arco = document.getElementById(`dashArc${c.key}`);
      if (!arco) return;
      const frac = conDato > 0 ? cuenta[c.key] / conDato : 0;
      const largo = frac > 0 ? Math.max(frac * C - GAP, 1) : 0;
      arco.setAttribute("stroke-dasharray", `${largo.toFixed(2)} ${(C - largo).toFixed(2)}`);
      arco.setAttribute("stroke-dashoffset", (-avance).toFixed(2));
      // Con un filtro de clase activo, el resto del anillo se atenúa para que
      // el segmento elegido quede identificado sin perder el contexto.
      const cubierto = !filtroClase
        || c.key === filtroClase
        || (filtroClase === "Moderada" && c.key === "Severa");
      arco.setAttribute("stroke-opacity", String(!filtroClase ? c.opacidad : (cubierto ? 1 : 0.24)));
      const titulo = arco.querySelector("title");
      if (titulo) {
        titulo.textContent = `${c.key} (${c.rango} g/dL): ${cuenta[c.key]} · ${conDato ? Math.round(frac * 100) : 0}%`;
      }
      avance += frac * C;
    });

    // --- Centro: sin filtro informa el porcentaje sano; con filtro, la clase ---
    const foco = filtroClase
      ? {
          pct: filtroClase === "Moderada"
            ? pctClase.Moderada + pctClase.Severa
            : pctClase[filtroClase],
          label: filtroClase === "Moderada" ? "moderada o severa" : filtroClase.toLowerCase(),
        }
      : { pct: pctSinAnemia, label: "Normal" };
    const pctEl = document.getElementById("dashDonutPct");
    if (pctEl) pctEl.textContent = foco.pct != null ? `${foco.pct}%` : "—";
    const labelEl = document.getElementById("dashDonutLabel");
    if (labelEl) labelEl.textContent = foco.label;

    const svg = document.getElementById("dashDonut");
    if (svg) {
      svg.setAttribute("aria-label", conDato > 0
        ? `Distribución por semáforo MINSA: ${cuenta.Normal} Normal, ${cuenta.Leve} Leve, ${cuenta.Moderada} Moderada y ${cuenta.Severa} Severa; ${pctSinAnemia}% Normal.`
        : "Distribución por semáforo MINSA: sin diagnósticos registrados.");
    }

    // --- Leyenda: se construye una sola vez; luego solo cifras y estados ---
    const leyenda = document.getElementById("dashLeyenda");
    if (leyenda && !leyenda.dataset.built) {
      leyenda.innerHTML = LEYENDA.map((c, i) => `
        <button type="button" class="dash-leyenda-item" data-clase="${c.key}"
          style="--dash-seg:${c.color}; --dash-legend-delay:${340 + i * 80}ms;"
          aria-pressed="false"
          title="Filtrar la tabla por ${c.etiqueta.toLowerCase()}"
          onclick="window.dashboardFiltrar ? window.dashboardFiltrar('clase', '${c.key}') : null">
          <span class="dash-leyenda-dot" aria-hidden="true"></span>
          <span class="dash-leyenda-name">${c.etiqueta} <span class="dash-leyenda-rango">${c.rango}</span></span>
          <span class="dash-leyenda-count" id="dashCuenta${c.key}">0</span>
          <span class="dash-leyenda-pct" id="dashPct${c.key}">0%</span>
        </button>`).join("");
      leyenda.dataset.built = "1";
    }
    LEYENDA.forEach(c => {
      const cuentaEl = document.getElementById(`dashCuenta${c.key}`);
      const pctItem = document.getElementById(`dashPct${c.key}`);
      const item = leyenda ? leyenda.querySelector(`[data-clase="${c.key}"]`) : null;
      const esModerada = c.key === "Moderada";
      const n = esModerada ? cuenta.Moderada + cuenta.Severa : cuenta[c.key];
      const pct = esModerada ? pctClase.Moderada + pctClase.Severa : pctClase[c.key];
      if (cuentaEl) cuentaEl.textContent = String(n);
      if (pctItem) pctItem.textContent = conDato > 0 ? `${pct}%` : "0%";
      if (item) {
        // Solo la clase elegida queda pulsada; «Moderada» incluye filas severas
        // sin afirmar que el filtro activo sea «Severa».
        item.setAttribute("aria-pressed", filtroClase === c.key ? "true" : "false");
      }
    });

    // --- Estado del panel: qué parte del padrón se está viendo ---
    const total = lista.length;
    const mostrados = Array.isArray(this._filteredBeneficiarios)
      ? this._filteredBeneficiarios.length
      : total;
    const hayFiltros = Boolean(this._searchQuery)
      || (this._filterAnemia && this._filterAnemia.length > 0)
      || (this._filterSede && this._filterSede.length > 0)
      || (this._filterHbNivel && this._filterHbNivel !== "all");
    const stateEl = document.getElementById("dashRapidoState");
    if (stateEl) {
      stateEl.textContent = hayFiltros
        ? `Mostrando ${mostrados} de ${total} · filtros activos`
        : `Mostrando ${total} de ${total} · sin filtros`;
    }
    const clearBtn = document.getElementById("dashRapidoClear");
    if (clearBtn) clearBtn.hidden = !hayFiltros;

    // --- KPIs: describen el padrón completo ---
    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };
    setTxt("dashKpiCarteraVal", String(lista.length));
    setTxt("dashKpiCarteraNote", conDato > 0
      ? `${conDato} con diagnóstico activo`
      : "Sin diagnósticos registrados");
    setTxt("dashKpiAnemiaVal", String(conAnemia));
    setTxt("dashKpiAnemiaNote", pctConAnemia != null
      ? `${pctConAnemia}% de los diagnosticados`
      : "Hb menor a 11.0 g/dL");
    // El número de «Con anemia» toma el color del caso más grave presente:
    // ámbar si solo hay leves, naranja con moderadas, rojo con severas.
    const estadoAnemia = cuenta.Severa > 0
      ? "is-alerta"
      : cuenta.Moderada > 0
        ? "is-moderada"
        : cuenta.Leve > 0
          ? "is-leve"
          : "is-normal";
    const anemiaVal = document.getElementById("dashKpiAnemiaVal");
    if (anemiaVal) {
      anemiaVal.classList.remove("is-normal", "is-leve", "is-moderada", "is-alerta");
      anemiaVal.classList.add(estadoAnemia);
    }
    setTxt("dashKpiHbVal", promedio != null ? promedio.toFixed(1) : "—");
    const hbEl = document.getElementById("dashKpiHbVal");
    if (hbEl) {
      // El color va por clase (no en línea) para que el tema claro use tonos
      // profundos y el oscuro los tokens vivos del semáforo.
      hbEl.style.removeProperty("color");
      hbEl.classList.remove("is-normal", "is-leve", "is-alerta");
      if (promedio != null) {
        const diag = AnemiaCalculator.calculate(promedio).label;
        const estado = /Severa|Moderada/.test(diag)
          ? "is-alerta"
          : /Leve/.test(diag)
            ? "is-leve"
            : "is-normal";
        hbEl.classList.add(estado);
      }
    }
    setTxt("dashKpiHbNote", promedio != null
      ? `g/dL · promedio de ${nHb} con dato`
      : "Sin valores de Hb");
    setTxt("dashKpiMesVal", String(pruebasMes));
    setTxt("dashKpiMesNote", `dosajes en ${mesNombre}`);

    const anemiaBtn = document.getElementById("dashKpiAnemia");
    if (anemiaBtn) {
      anemiaBtn.setAttribute("aria-pressed", this._filterHbNivel === "anemia" ? "true" : "false");
      const ring = estadoAnemia === "is-alerta" ? "var(--gt-red)"
        : estadoAnemia === "is-moderada" ? "var(--gt-orange)"
          : estadoAnemia === "is-leve" ? "var(--gt-yellow)"
            : "var(--gt-green)";
      anemiaBtn.style.setProperty("--dash-kpi-ring", ring);
    }
  },
  /**
   * Selector de usuario para registrar un dosaje desde la cabecera.
   * Evita el camino de tres clics (fila → historial → añadir prueba).
   */
  abrirSelectorDosaje() {
    const cont = document.getElementById("elegirDosajeLista");
    const modal = document.getElementById("modalElegirDosaje");
    if (!cont || !modal) return;

    const lista = [...(this._allBeneficiarios || [])]
      .filter(b => b && b.activo !== false)
      .sort((a, b) => String(a.apellidos || "").localeCompare(String(b.apellidos || ""), "es"));

    cont.innerHTML = lista.length
      ? lista.map(b => {
        const clase = AnemiaCalculator.normalizar(b.anemia);
        const badge = clase === "Normal"
          ? "badge-green"
          : clase === "Leve"
            ? "badge-yellow"
            : clase
              ? "badge-red"
              : "badge-blue";
        const etiqueta = clase || "Sin dato";
        return `
          <button type="button" class="elegir-dosaje-item" onclick="window.registrarDosaje ? window.registrarDosaje(${escaparEnManejador(b.id)}) : null">
            <span>
              <span class="nombre">${escapar(b.nombres)} ${escapar(b.apellidos)}</span>
              <span class="meta">${escapar(b.codigo)} · ${escapar(b.sede || "Sin sede")}</span>
            </span>
            <span class="badge ${badge}">${escapar(etiqueta)}</span>
          </button>`;
      }).join("")
      : '<p class="elegir-dosaje-empty">Sin usuarios en el padrón.</p>';

    modal.removeAttribute("inert");
    modal.removeAttribute("aria-hidden");
    modal.classList.add("open");
    const primero = cont.querySelector(".elegir-dosaje-item");
    if (primero) requestAnimationFrame(() => primero.focus());
  },

  cerrarSelectorDosaje() {
    const modal = document.getElementById("modalElegirDosaje");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("inert", "");
  },

  /**
   * Abre el historial del usuario y despliega el formulario de dosaje.
   * Se usa tanto desde la cabecera como desde la acción de cada fila.
   */
  registrarDosaje(id) {
    this.cerrarSelectorDosaje();
    this.openHistorialTamizaje(id);
    this.mostrarFormularioNuevaPrueba();
    requestAnimationFrame(() => {
      const campo = document.getElementById("nuevaPruebaFecha");
      if (campo) campo.focus();
    });
  },

  /**
   * Acción desde el panel rápido: fija un filtro de forma determinista (no lo
   * alterna como el desplegable), repinta tabla, chips y panel, y baja hasta
   * la tabla de evaluaciones. Pulsar de nuevo la misma clase lo despeja.
   */
  aplicarFiltroDashboard(tipo, valor) {
    if (tipo === "clase") {
      const yaActivo = this._filterAnemia.length === 1 && this._filterAnemia[0] === valor;
      this._filterAnemia = yaActivo ? [] : [valor];
      this._updateAnemiaDropdownUI();
      this.applyFilters();
      this._persistirFiltros();
    } else if (tipo === "hb") {
      this.selectHbNivel(valor, null);
    } else if (tipo === "todo") {
      this.resetFilters();
    }
    const tabla = document.getElementById("cardSaludEvaluaciones");
    const reducido = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (tabla) {
      tabla.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
    }
    // Al filtrar, el foco viaja al estado del panel: el lector anuncia cuántos
    // resultados quedaron y el teclado no se pierde en la leyenda.
    const estado = document.getElementById("dashRapidoState");
    if (estado) {
      estado.focus({ preventScroll: true });
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SaludCredView = SaludCredView;
  window.dashboardFiltrar = (tipo, valor) => SaludCredView.aplicarFiltroDashboard(tipo, valor);
  window.filterSaludSearch = (val) => SaludCredView.filterBySearch(val);
  window.clearSaludSearch = () => SaludCredView.clearSearch();
  window.toggleSaludAnemia = (val) => SaludCredView.toggleAnemia(val);
  window.toggleSaludSede = (val) => SaludCredView.toggleSede(val);
  window.selectSaludHb = (val, label) => SaludCredView.selectHbNivel(val, label);
  window.removeSaludChip = (key, val) => SaludCredView.removeFilter(key, val);
  window.resetSaludFilters = () => SaludCredView.resetFilters();
  window.saludSetPageSize = (size) => SaludCredView.setPageSize(size);
  window.saludPrevPage = () => SaludCredView.prevPage();
  window.saludNextPage = () => SaludCredView.nextPage();
  window.openHistorialTamizaje = (id) => SaludCredView.openHistorialTamizaje(id);
  window.closeHistorialTamizaje = () => SaludCredView.closeModalHistorialTamizaje();
  window.abrirSelectorDosaje = () => SaludCredView.abrirSelectorDosaje();
  window.cerrarSelectorDosaje = () => SaludCredView.cerrarSelectorDosaje();
  window.registrarDosaje = (id) => SaludCredView.registrarDosaje(id);
  window.mostrarFormularioNuevaPrueba = () => SaludCredView.mostrarFormularioNuevaPrueba();
  window.ocultarFormularioNuevaPrueba = () => SaludCredView._ocultarFormularioNuevaPrueba();
  window.actualizarPreviewNuevaPrueba = () => SaludCredView._actualizarPreviewNuevaPrueba();
  window.guardarNuevaPrueba = () => SaludCredView.guardarNuevaPrueba();
  window.abrirMotivoDesactivar = (idx) => SaludCredView.abrirMotivoDesactivar(idx);
  window.ocultarMotivoDesactivar = (idx) => SaludCredView.ocultarMotivoDesactivar(idx);
  window.confirmarDesactivarPrueba = (idx) => SaludCredView.confirmarDesactivarPrueba(idx);
  window.exportarHistorialCsv = () => SaludCredView.exportarHistorialCsv();
}
