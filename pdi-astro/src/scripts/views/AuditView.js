import { crear as crearFiltros } from '../utils/Filters.js';
import { crearStore } from '../utils/FilterStore.js';
import { Dropdown } from '../utils/Dropdown.js';
import { Responsive } from '../utils/Responsive.js';
import { initSortMenu } from '../ui/SortMenu.js';
import { AnimationEngine } from '../utils/AnimationEngine.js';
import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";
import { iconHtml } from '../../data/iconos.js';

// Filtros de la bitácora de trazabilidad que viajan en la URL de auditoria.html.
const FILTROS_AUDITORIA = {
  q:       { valor: "" },
  accion:  { valor: [], valores: ["salud", "social", "educativo", "padron"], multiple: true },
  fecha:   { valor: "all", valores: ["all", "today", "week", "specific", "range"] },
  fechaEspecifica: { valor: "" },
  rangoDesde:      { valor: "" },
  rangoHasta:      { valor: "" },
  rol:     { valor: [], valores: ["Coordinación", "Facilitadora", "Promotora", "Trabajadora Social"], multiple: true },
  estado:  { valor: [], valores: ["Registrado", "Sensible", "Observado"], multiple: true },
  pagina:  { valor: 1, numeros: { min: 1, max: 10000 } },
  tam:     { valor: 10, numeros: { min: 5, max: 100 } },
};

const FACETAS_AUDITORIA = {
  accion: { tipo: "multi", opciones: FILTROS_AUDITORIA.accion.valores, defecto: [] },
  rol: { tipo: "multi", opciones: FILTROS_AUDITORIA.rol.valores, defecto: [] },
  estado: { tipo: "multi", opciones: FILTROS_AUDITORIA.estado.valores, defecto: [] },
  fecha: { tipo: "single", opciones: FILTROS_AUDITORIA.fecha.valores, defecto: "all" },
};

/**
 * Vista de Auditoría y Trazabilidad (auditoria.astro)
 * Gestiona el filtrado, ordenación, facetas, paginación y renderizado de la bitácora.
 */
export const AuditView = {
  _filtros: null,
  _filtrosLeidos: false,
  _store: null,
  _currentAuditLogs: [],
  _filteredAuditLogs: [],
  _auditSortKey: "reciente",
  _auditSortDir: "desc",
  _auditSearchQuery: "",
  _filterAuditAction: [],
  _filterAuditDate: "all",
  _filterAuditRole: [],
  _filterAuditStatus: [],
  _customDateSpecific: "",
  _customDateRangeStart: "",
  _customDateRangeEnd: "",
  _auditCurrentPage: 1,
  _auditPageSize: 10,
  _auditTotalServidor: 0,
  _vigilaVariante: false,

  _obtenerStore() {
    if (!this._store) this._store = crearStore(FACETAS_AUDITORIA);
    return this._store;
  },

  _espejarStore() {
    const s = this._obtenerStore().instantanea();
    this._filterAuditAction = s.accion;
    this._filterAuditRole = s.rol;
    this._filterAuditStatus = s.estado;
    this._filterAuditDate = s.fecha;
  },

  _obtenerFiltros() {
    if (!this._filtros) {
      this._filtros = crearFiltros(FILTROS_AUDITORIA);
    }
    return this._filtros;
  },

  _persistirFiltros(extra) {
    this._obtenerFiltros().escribir({
      q: this._auditSearchQuery,
      accion: this._filterAuditAction,
      fecha: this._filterAuditDate,
      fechaEspecifica: this._customDateSpecific,
      rangoDesde: this._customDateRangeStart,
      rangoHasta: this._customDateRangeEnd,
      rol: this._filterAuditRole,
      estado: this._filterAuditStatus,
      pagina: this._auditCurrentPage,
      tam: this._auditPageSize,
      ...(extra || {}),
    });
  },

  _leerFiltrosDeURL() {
    if (this._filtrosLeidos) return;
    this._filtrosLeidos = true;

    const f = this._obtenerFiltros().leer();
    this._auditSearchQuery = (f.q || "").toLowerCase();
    this._obtenerStore().cargar({ accion: f.accion, rol: f.rol, estado: f.estado, fecha: f.fecha });
    this._espejarStore();
    this._auditCurrentPage = f.pagina;
    this._auditPageSize = f.tam;

    this._customDateSpecific = f.fechaEspecifica || "";
    this._customDateRangeStart = f.rangoDesde || "";
    this._customDateRangeEnd = f.rangoHasta || "";

    const input = document.getElementById("inputAuditSearch");
    if (input) input.value = f.q;
    const clearBtn = document.getElementById("btnAuditSearchClear");
    if (clearBtn) clearBtn.style.display = f.q ? "inline-flex" : "none";

    this._updateActionDropdownUI();
    this._updateRoleDropdownUI();
    this._updateStatusDropdownUI();
    this._updateDateUI();
  },

  _initAuditSort() {
    this._auditSortMenu = initSortMenu({
      id: "AuditoriaSort",
      onSelect: (valor) => this.sortAuditLogs(valor),
    });
    this._auditSortMenu?.sync(`${this._auditSortKey}-${this._auditSortDir}`);
  },

  sortAuditLogs(valor) {
    const [key, dir] = String(valor || "").split("-");
    if (!key) return;
    this._auditSortKey = key;
    this._auditSortDir = dir === "asc" ? "asc" : "desc";
    this._auditSortMenu?.sync(`${this._auditSortKey}-${this._auditSortDir}`);
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _ordenarAuditoria(lista) {
    const dir = this._auditSortDir === "desc" ? -1 : 1;
    const fecha = (l) => String(l?.timestamp || l?.fecha || "");
    return [...lista].sort((a, b) => {
      let cmp = 0;
      switch (this._auditSortKey) {
        case "usuario":
          cmp = String(a.user || "").localeCompare(String(b.user || ""), "es");
          break;
        case "accion":
          cmp = String(a.action || "").localeCompare(String(b.action || ""), "es");
          break;
        case "entidad":
          cmp = String(a.entity || "").localeCompare(String(b.entity || ""), "es");
          break;
        default:
          cmp = fecha(a).localeCompare(fecha(b));
      }
      if (cmp === 0) cmp = fecha(a).localeCompare(fecha(b));
      return cmp * dir;
    });
  },

  renderAuditLogs(logs) {
    this._leerFiltrosDeURL();
    this._initAuditSort();
    this._currentAuditLogs = logs || [];
    this._filteredAuditLogs = logs || [];
    this.updateAuditKpis(this._currentAuditLogs);
    this.applyAuditFilters();
  },

  updateAuditKpis(logs) {
    const totalEl = document.getElementById("auditKpiTotal");
    const sensEl = document.getElementById("auditKpiSensibles");
    const exportCountEl = document.getElementById("exportAuditCountBadge");

    const totalCount = (logs && logs.length) || 0;
    if (totalEl) AnimationEngine.escribir(totalEl, totalCount, { formato: (n) => String(Math.round(n)) });
    if (exportCountEl) AnimationEngine.escribir(exportCountEl, totalCount, { formato: (n) => `${Math.round(n)} eventos` });
    
    if (sensEl) {
      const sensibles = logs ? logs.filter(l => 
        (l.action && l.action.toLowerCase().includes("derivaci")) || 
        (l.detail && l.detail.toLowerCase().includes("demuna")) ||
        (l.status && l.status.toLowerCase().includes("sensible"))
      ) : [];
      AnimationEngine.escribir(sensEl, sensibles.length, { formato: (n) => String(Math.round(n)) });
    }
  },

  toggleInnerDropdown(dropdownId) {
    Dropdown.alternarInterno(dropdownId);
  },

  toggleAction(val) {
    this._obtenerStore().alternar("accion", val);
    this._espejarStore();
    this._updateActionDropdownUI();
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateActionDropdownUI() {
    const isAll = this._filterAuditAction.length === 0;
    const items = document.querySelectorAll("#menuAuditAction .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAuditAction.includes(v));
      }
    });

    const labelEl = document.getElementById("labelAuditActionSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Eventos";
      } else if (this._filterAuditAction.length === 1) {
        const a = this._filterAuditAction[0];
        if (a === "salud") labelEl.textContent = "Salud y Nutrición CRED";
        else if (a === "social") labelEl.textContent = "Derivación Social ASP";
        else if (a === "educativo") labelEl.textContent = "Casitas del Saber CS";
        else if (a === "padron") labelEl.textContent = "Padrón / Coordinación";
      } else {
        labelEl.textContent = `${this._filterAuditAction.length} seleccionados`;
      }
    }
  },

  selectDate(dateKey, label) {
    this._obtenerStore().fijar("fecha", dateKey || "all");
    this._espejarStore();
    this._updateDateUI(label);

    if (dateKey !== "specific" && dateKey !== "range") {
      const drop = document.getElementById("dropdownAuditDate");
      if (drop) drop.classList.remove("open");
    }

    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateDateUI(alternativa) {
    const items = document.querySelectorAll("#menuAuditDate .padron-dropdown-item");
    let texto = null;
    items.forEach(item => {
      const coincide = item.getAttribute("data-value") === this._filterAuditDate;
      item.classList.toggle("selected", coincide);
      if (coincide) {
        const span = item.querySelector(".padron-item-label");
        if (span) texto = span.textContent.trim();
      }
    });

    const labelEl = document.getElementById("labelAuditDateSelect");
    if (labelEl) {
      labelEl.textContent = texto || alternativa || "Todas las Fechas";
    }

    const panelSpecific = document.getElementById("panelAuditDateSpecific");
    const panelRange = document.getElementById("panelAuditDateRange");
    if (panelSpecific) panelSpecific.style.display = (this._filterAuditDate === "specific") ? "flex" : "none";
    if (panelRange) panelRange.style.display = (this._filterAuditDate === "range") ? "flex" : "none";

    const inputSpecific = document.getElementById("inputAuditDateSpecific");
    if (inputSpecific) inputSpecific.value = this._customDateSpecific || "";
    const inputDesde = document.getElementById("inputAuditDateRangeStart");
    if (inputDesde) inputDesde.value = this._customDateRangeStart || "";
    const inputHasta = document.getElementById("inputAuditDateRangeEnd");
    if (inputHasta) inputHasta.value = this._customDateRangeEnd || "";
  },

  toggleRole(val) {
    this._obtenerStore().alternar("rol", val);
    this._espejarStore();
    this._updateRoleDropdownUI();
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateRoleDropdownUI() {
    const isAll = this._filterAuditRole.length === 0;
    const items = document.querySelectorAll("#menuAuditRole .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAuditRole.includes(v));
      }
    });

    const labelEl = document.getElementById("labelAuditRoleSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Roles";
      } else if (this._filterAuditRole.length === 1) {
        labelEl.textContent = this._filterAuditRole[0];
      } else {
        labelEl.textContent = `${this._filterAuditRole.length} seleccionados`;
      }
    }
  },

  toggleStatus(val) {
    this._obtenerStore().alternar("estado", val);
    this._espejarStore();
    this._updateStatusDropdownUI();
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateStatusDropdownUI() {
    const isAll = this._filterAuditStatus.length === 0;
    const items = document.querySelectorAll("#menuAuditStatus .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAuditStatus.includes(v));
      }
    });

    const labelEl = document.getElementById("labelAuditStatusSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Estados";
      } else if (this._filterAuditStatus.length === 1) {
        const s = this._filterAuditStatus[0];
        if (s === "Registrado") labelEl.textContent = "Registrado / Conforme";
        else if (s === "Sensible") labelEl.textContent = "Sensible / Crítico";
        else if (s === "Observado") labelEl.textContent = "Observado / Revisión";
      } else {
        labelEl.textContent = `${this._filterAuditStatus.length} seleccionados`;
      }
    }
  },

  handleDatePickerChange(type, yyyyMmDd) {
    if (!yyyyMmDd) return;
    const parts = yyyyMmDd.split("-");
    if (parts.length === 3) {
      const ddMmYyyy = `${parts[2]}/${parts[1]}/${parts[0]}`;
      if (type === "specific") {
        const input = document.getElementById("inputAuditSpecificDate");
        if (input) input.value = ddMmYyyy;
        this._customDateSpecific = yyyyMmDd;
      } else if (type === "range-start") {
        const input = document.getElementById("inputAuditRangeStart");
        if (input) input.value = ddMmYyyy;
        this._customDateRangeStart = yyyyMmDd;
      } else if (type === "range-end") {
        const input = document.getElementById("inputAuditRangeEnd");
        if (input) input.value = ddMmYyyy;
        this._customDateRangeEnd = yyyyMmDd;
      }
      this._auditCurrentPage = 1;
      this.applyAuditFilters();
    }
  },

  handleDateManualInput(type, inputEl) {
    if (!inputEl) return;
    let val = inputEl.value;
    
    const cleanDigits = val.replace(/\D/g, "").slice(0, 8);
    if (cleanDigits.length >= 5) {
      val = `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2, 4)}/${cleanDigits.slice(4)}`;
    } else if (cleanDigits.length >= 3) {
      val = `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2)}`;
    } else {
      val = cleanDigits;
    }
    inputEl.value = val;

    if (val.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      const isoDate = `${y}-${m}-${d}`;
      const pickerId = (type === "specific") ? "pickerAuditSpecificDate" : (type === "range-start" ? "pickerAuditRangeStart" : "pickerAuditRangeEnd");
      const picker = document.getElementById(pickerId);
      if (picker) picker.value = isoDate;

      if (type === "specific") {
        this._customDateSpecific = isoDate;
      } else if (type === "range-start") {
        this._customDateRangeStart = isoDate;
      } else if (type === "range-end") {
        this._customDateRangeEnd = isoDate;
      }
      this._auditCurrentPage = 1;
      this.applyAuditFilters();
    } else if (val.length === 0) {
      if (type === "specific") this._customDateSpecific = "";
      if (type === "range-start") this._customDateRangeStart = "";
      if (type === "range-end") this._customDateRangeEnd = "";
      this.applyAuditFilters();
    }
  },

  filterBySearch(query) {
    this._auditSearchQuery = (query || "").trim().toLowerCase();
    this._auditCurrentPage = 1;
    const clearBtn = document.getElementById("btnAuditSearchClear");
    if (clearBtn) {
      clearBtn.style.display = query && query.length > 0 ? "flex" : "none";
    }
    this.applyAuditFilters();
    this._persistirFiltros({ q: query || "" });
  },

  clearSearch() {
    const input = document.getElementById("inputAuditSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  removeAuditFilter(filterKey, specificVal) {
    if (filterKey === "search") this.clearSearch();
    if (filterKey === "action") {
      if (specificVal) this.toggleAction(specificVal);
      else this.toggleAction("all");
    }
    if (filterKey === "date") this.selectDate("all", "Todas las Fechas");
    if (filterKey === "role") {
      if (specificVal) this.toggleRole(specificVal);
      else this.toggleRole("all");
    }
    if (filterKey === "status") {
      if (specificVal) this.toggleStatus(specificVal);
      else this.toggleStatus("all");
    }
  },

  resetAuditFilters() {
    this._obtenerStore().limpiar();
    this._espejarStore();
    this._customDateSpecific = "";
    this._customDateRangeStart = "";
    this._customDateRangeEnd = "";
    this._auditSearchQuery = "";
    this._auditCurrentPage = 1;

    const input = document.getElementById("inputAuditSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnAuditSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    const spText = document.getElementById("inputAuditSpecificDate");
    const rStartText = document.getElementById("inputAuditRangeStart");
    const rEndText = document.getElementById("inputAuditRangeEnd");
    if (spText) spText.value = "";
    if (rStartText) rStartText.value = "";
    if (rEndText) rEndText.value = "";

    const panelSpecific = document.getElementById("panelAuditDateSpecific");
    const panelRange = document.getElementById("panelAuditDateRange");
    if (panelSpecific) panelSpecific.style.display = "none";
    if (panelRange) panelRange.style.display = "none";

    this._updateActionDropdownUI();
    this.selectDate("all", "Todas las Fechas");
    this._updateRoleDropdownUI();
    this._updateStatusDropdownUI();

    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this.applyAuditFilters();
  },

  _matchesAuditAction(log, actionKeys) {
    if (!actionKeys || actionKeys.length === 0) return true;
    return actionKeys.some(actionFilter => {
      if (actionFilter === "salud") {
        return (log.action && (log.action.toLowerCase().includes("cred") || log.action.toLowerCase().includes("tamizaje") || log.action.toLowerCase().includes("salud")));
      } else if (actionFilter === "social") {
        return (log.action && (log.action.toLowerCase().includes("derivaci") || log.action.toLowerCase().includes("social") || log.action.toLowerCase().includes("caso"))) || (log.role && log.role.toLowerCase().includes("social"));
      } else if (actionFilter === "educativo") {
        return (log.action && (log.action.toLowerCase().includes("asistencia") || log.action.toLowerCase().includes("casita") || log.action.toLowerCase().includes("saber"))) || (log.role && log.role.toLowerCase().includes("promotora"));
      } else if (actionFilter === "padron") {
        return (log.action && (log.action.toLowerCase().includes("padrón") || log.action.toLowerCase().includes("aprobación") || log.action.toLowerCase().includes("usuario") || log.action.toLowerCase().includes("menor") || log.action.toLowerCase().includes("ingreso"))) || (log.role && log.role.toLowerCase().includes("coordinaci"));
      }
      return false;
    });
  },

  _matchesAuditRole(log, roleKeys) {
    if (!roleKeys || roleKeys.length === 0) return true;
    return roleKeys.some(r => log.role && log.role.toLowerCase().includes(r.toLowerCase()));
  },

  _matchesAuditStatus(log, statusKeys) {
    if (!statusKeys || statusKeys.length === 0) return true;
    return statusKeys.some(s => log.status && log.status.toLowerCase().includes(s.toLowerCase()));
  },

  _matchesAuditDate(log, dateKey) {
    if (!dateKey || dateKey === "all") return true;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const logDateStr = (log.timestamp || "").slice(0, 10);

    if (dateKey === "today") {
      return logDateStr === todayStr;
    } else if (dateKey === "week") {
      const logDate = new Date(logDateStr);
      return !isNaN(logDate) && logDate >= sevenDaysAgo;
    } else if (dateKey === "specific") {
      if (this._customDateSpecific) {
        return logDateStr === this._customDateSpecific;
      }
      return true;
    } else if (dateKey === "range") {
      const start = this._customDateRangeStart;
      const end = this._customDateRangeEnd;
      if (start && end) {
        return logDateStr >= start && logDateStr <= end;
      } else if (start) {
        return logDateStr >= start;
      } else if (end) {
        return logDateStr <= end;
      }
      return true;
    }
    return true;
  },

  _vigilarVariante() {
    if (this._vigilaVariante) return;
    this._vigilaVariante = true;
    Responsive.alCambiarDeVariante(() => this.applyAuditFilters());
  },

  applyAuditFilters() {
    this._vigilarVariante();
    const logs = this._currentAuditLogs || [];
    const query = this._auditSearchQuery || "";

    let filtered = logs.filter(l => {
      let matchAction = this._matchesAuditAction(l, this._filterAuditAction);
      let matchRole = this._matchesAuditRole(l, this._filterAuditRole);
      let matchStatus = this._matchesAuditStatus(l, this._filterAuditStatus);
      let matchDate = this._matchesAuditDate(l, this._filterAuditDate);

      let matchQuery = true;
      if (query) {
        const user = (l.user || "").toLowerCase();
        const role = (l.role || "").toLowerCase();
        const action = (l.action || "").toLowerCase();
        const entity = (l.entity || "").toLowerCase();
        const detail = (l.detail || "").toLowerCase();
        const id = (l.id || "").toLowerCase();
        matchQuery = user.includes(query) || role.includes(query) || action.includes(query) || entity.includes(query) || detail.includes(query) || id.includes(query);
      }

      return matchAction && matchRole && matchStatus && matchDate && matchQuery;
    });

    filtered = this._ordenarAuditoria(filtered);
    this._filteredAuditLogs = filtered;

    const count = this._obtenerStore().contarActivos();
    const contador = document.getElementById("auditActiveFiltersCount");
    const filterBtn = document.getElementById("btnDropdownAuditFilterPanel");

    if (contador) {
      contador.textContent = count;
      contador.style.display = count > 0 ? "inline-flex" : "none";
    }
    if (filterBtn) {
      filterBtn.classList.toggle("has-filters", count > 0);
    }

    this._updateAuditFacetCounts();
    this._renderAuditActiveChips();

    const totalRecords = filtered.length;
    const pageSize = this._auditPageSize || 10;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    if (this._auditCurrentPage > totalPages) this._auditCurrentPage = totalPages;
    if (this._auditCurrentPage < 1) this._auditCurrentPage = 1;

    const startIndex = (this._auditCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const paginatedLogs = filtered.slice(startIndex, endIndex);

    this.renderAuditTableAndCards(paginatedLogs);
    this.renderAuditPagination(totalRecords, startIndex, endIndex, totalPages);
    this.updateAuditKpis(filtered);

    this._persistirFiltros();
  },

  _updateAuditFacetCounts() {
    const getFilteredExcluding = (excludeKey) => {
      let l = [...(this._currentAuditLogs || [])];
      if (this._auditSearchQuery) {
        const q = this._auditSearchQuery;
        l = l.filter(log => {
          const user = (log.user || "").toLowerCase();
          const role = (log.role || "").toLowerCase();
          const action = (log.action || "").toLowerCase();
          const entity = (log.entity || "").toLowerCase();
          const detail = (log.detail || "").toLowerCase();
          const id = (log.id || "").toLowerCase();
          return user.includes(q) || role.includes(q) || action.includes(q) || entity.includes(q) || detail.includes(q) || id.includes(q);
        });
      }
      if (excludeKey !== "action" && this._filterAuditAction.length > 0) {
        l = l.filter(log => this._matchesAuditAction(log, this._filterAuditAction));
      }
      if (excludeKey !== "date" && this._filterAuditDate !== "all") {
        l = l.filter(log => this._matchesAuditDate(log, this._filterAuditDate));
      }
      if (excludeKey !== "role" && this._filterAuditRole.length > 0) {
        l = l.filter(log => this._matchesAuditRole(log, this._filterAuditRole));
      }
      if (excludeKey !== "status" && this._filterAuditStatus.length > 0) {
        l = l.filter(log => this._matchesAuditStatus(log, this._filterAuditStatus));
      }
      return l;
    };

    const setFacetBadge = (badgeId, text, isZero) => {
      const el = document.getElementById(badgeId);
      if (!el) return;
      el.textContent = text;
      const parentItem = el.closest(".padron-dropdown-item");
      if (parentItem && parentItem.getAttribute("data-value") !== "all") {
        parentItem.classList.toggle("zero-facet", isZero);
      }
    };

    const forAction = getFilteredExcluding("action");
    setFacetBadge("countFacetAuditAction-all", `(${forAction.length})`, forAction.length === 0);
    const actionsList = ["salud", "social", "educativo", "padron"];
    actionsList.forEach(act => {
      const c = forAction.filter(log => this._matchesAuditAction(log, [act])).length;
      setFacetBadge(`countFacetAuditAction-${act}`, `(${c})`, c === 0);
    });

    const forDate = getFilteredExcluding("date");
    setFacetBadge("countFacetAuditDate-all", `(${forDate.length})`, forDate.length === 0);
    const cToday = forDate.filter(log => this._matchesAuditDate(log, "today")).length;
    const cWeek = forDate.filter(log => this._matchesAuditDate(log, "week")).length;
    setFacetBadge("countFacetAuditDate-today", `(${cToday})`, cToday === 0);
    setFacetBadge("countFacetAuditDate-week", `(${cWeek})`, cWeek === 0);

    const forRole = getFilteredExcluding("role");
    setFacetBadge("countFacetAuditRole-all", `(${forRole.length})`, forRole.length === 0);
    const rolesList = ["Coordinación", "Facilitadora", "Promotora", "Trabajadora Social"];
    rolesList.forEach(r => {
      const c = forRole.filter(log => this._matchesAuditRole(log, [r])).length;
      setFacetBadge(`countFacetAuditRole-${r}`, `(${c})`, c === 0);
    });

    const forStatus = getFilteredExcluding("status");
    setFacetBadge("countFacetAuditStatus-all", `(${forStatus.length})`, forStatus.length === 0);
    const statusesList = ["Registrado", "Sensible", "Observado"];
    statusesList.forEach(s => {
      const c = forStatus.filter(log => this._matchesAuditStatus(log, [s])).length;
      setFacetBadge(`countFacetAuditStatus-${s}`, `(${c})`, c === 0);
    });
  },

  _renderAuditActiveChips() {
    const bar = document.getElementById("auditActiveChipsBar");
    const list = document.getElementById("auditActiveChipsList");
    if (!bar || !list) return;

    const chips = [];

    if (this._filterAuditAction.length > 0) {
      this._filterAuditAction.forEach(act => {
        let label = act;
        if (act === "salud") label = "Salud CRED";
        if (act === "social") label = "Social ASP";
        if (act === "educativo") label = "Casitas CS";
        if (act === "padron") label = "Padrón Coord.";
        chips.push({ id: "action", val: act, label: `Evento: ${label}` });
      });
    }

    if (this._filterAuditDate !== "all") {
      let dateLabel = this._filterAuditDate;
      if (this._filterAuditDate === "today") dateLabel = "Fecha: Hoy";
      if (this._filterAuditDate === "week") dateLabel = "Fecha: Últimos 7 días";
      if (this._filterAuditDate === "specific") dateLabel = `Fecha: ${this._customDateSpecific || "Específica"}`;
      if (this._filterAuditDate === "range") dateLabel = `Rango: ${this._customDateRangeStart || "..."} a ${this._customDateRangeEnd || "..."}`;
      chips.push({ id: "date", label: dateLabel });
    }

    if (this._filterAuditRole.length > 0) {
      this._filterAuditRole.forEach(r => {
        chips.push({ id: "role", val: r, label: `Rol: ${r}` });
      });
    }

    if (this._filterAuditStatus.length > 0) {
      this._filterAuditStatus.forEach(s => {
        let sLabel = s;
        if (s === "Registrado") sLabel = "Conforme";
        if (s === "Sensible") sLabel = "Sensible / Crítico";
        if (s === "Observado") sLabel = "En Revisión";
        chips.push({ id: "status", val: s, label: `Estado: ${sLabel}` });
      });
    }

    if (chips.length === 0) {
      bar.classList.remove("is-visible");
      list.innerHTML = "";
    } else {
      bar.classList.add("is-visible");
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${escapar(chip.label)}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeAuditChip ? window.removeAuditChip('${escaparEnManejador(chip.id)}', '${escaparEnManejador(chip.val || '')}') : null" title="Eliminar filtro">
            ${iconHtml("accion.cerrar", { size: 10 })}
          </button>
        </span>
      `).join("");
    }
  },

  changePage(page) {
    this._auditCurrentPage = page;
    this.applyAuditFilters();
  },

  changePageSize(size) {
    this._auditPageSize = Number(size) || 10;
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  renderAuditPagination(total, start, end, totalPages) {
    const infoEl = document.getElementById("auditPaginationInfo");
    const cargados = (this._currentAuditLogs || []).length;
    const enServidor = Math.max(Number(this._auditTotalServidor) || 0, cargados);
    if (infoEl) {
      if (total === 0) {
        infoEl.textContent = "Sin registros coincidentes";
      } else {
        const sufijo = enServidor > cargados ? ` · ${enServidor} en total` : "";
        infoEl.textContent = `Mostrando ${start + 1} a ${end} de ${total} eventos${sufijo}`;
      }
    }

    const btnPrev = document.getElementById("btnAuditPagePrev");
    const btnNext = document.getElementById("btnAuditPageNext");
    const pageNumEl = document.getElementById("auditCurrentPageNum");
    const btnMas = document.getElementById("btnAuditCargarMas");

    if (pageNumEl) pageNumEl.textContent = `Página ${this._auditCurrentPage} de ${totalPages}`;
    if (btnPrev) btnPrev.disabled = (this._auditCurrentPage <= 1);
    if (btnNext) btnNext.disabled = (this._auditCurrentPage >= totalPages);
    if (btnMas) {
      const restantes = Math.max(0, enServidor - cargados);
      btnMas.style.display = restantes ? "inline-flex" : "none";
      if (restantes) btnMas.textContent = `Cargar más (${restantes})`;
    }
  },

  renderAuditTableAndCards(logs) {
    const tbody = document.getElementById("tbodyAuditLogs");
    const mobileContainer = document.getElementById("mobileCardsAuditoria");
    const enMovil = Responsive.esMovil();

    if (enMovil) { if (tbody) tbody.innerHTML = ""; }
    else { if (mobileContainer) mobileContainer.innerHTML = ""; }

    const getAccionClase = (action) => {
      const act = (action || "").toLowerCase();
      if (act.includes("cred") || act.includes("tamizaje") || act.includes("salud")) return "is-salud";
      if (act.includes("derivaci") || act.includes("social")) return "is-social";
      if (act.includes("asistencia") || act.includes("casita")) return "is-educativo";
      if (act.includes("padrón") || act.includes("aprobación") || act.includes("ingreso")) return "is-padron";
      return "is-otro";
    };

    const getEstadoDot = (status) => {
      const s = (status || "").toLowerCase();
      if (s.includes("sensible") || s.includes("crítico") || s.includes("derivaci")) return "dot-red";
      if (s.includes("observado") || s.includes("revisión") || s.includes("pendiente")) return "dot-amber";
      return "dot-green";
    };

    const getInitials = (name) => {
      if (!name) return "US";
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    };

    if (tbody && !enMovil) {
      if (logs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding:32px; color:var(--text-dim);">
              No se encontraron eventos de auditoría con los filtros y búsqueda especificados.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = logs.map(l => {
          const isUsuario = (l.entity && l.entity.startsWith("PDI-"));
          const entityHtml = isUsuario 
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo('${escaparEnManejador(l.entity)}')" class="audit-entity-link audit-entity-link--usuario" title="Abrir expediente del usuario"><code class="audit-entity-code audit-entity-code--usuario">${escapar(l.entity)}</code></a>`
            : `<code class="audit-entity-code" title="${escapar(l.entity)}">${escapar(l.entity)}</code>`;

          const logIdStr = l.id || "";
          return `
            <tr class="audit-row-interactive">
              <td class="audit-timestamp">${escapar(l.timestamp)}</td>
              <td>
                <div class="audit-user-cell">
                  <div class="audit-user-avatar" aria-hidden="true">${getInitials(l.user)}</div>
                  <div>
                    <div class="audit-user-name">${escapar(l.user)}</div>
                    <div class="audit-user-role">${escapar(l.role)}</div>
                  </div>
                </div>
              </td>
              <td><span class="audit-accion ${getAccionClase(l.action)}">${escapar(l.action)}</span></td>
              <td>${entityHtml}</td>
              <td><span class="audit-detail-cell" title="${escapar(l.detail)}">${escapar(l.detail)}</span></td>
              <td>
                <span class="padron-status-tag">
                  <span class="padron-dot ${getEstadoDot(l.status)}"></span>
                  <span>${escapar(l.status)}</span>
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button type="button" class="row-action" onclick="event.stopPropagation(); window.openAuditDetail ? window.openAuditDetail('${escaparEnManejador(logIdStr)}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${escaparEnManejador(logIdStr)}') : null)" title="Ver detalle de trazabilidad" aria-label="Ver detalle de trazabilidad">
                    ${iconHtml("accion.ver", { size: 15 })}
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    if (mobileContainer && enMovil) {
      if (logs.length === 0) {
        mobileContainer.innerHTML = `
          <div style="text-align:center; padding:32px; color:var(--text-dim); background:var(--surface-1); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            No se encontraron eventos con los filtros seleccionados.
          </div>
        `;
      } else {
        mobileContainer.innerHTML = logs.map((l, index) => {
          const isUsuario = (l.entity && l.entity.startsWith("PDI-"));
          const entityHtml = isUsuario 
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo('${escaparEnManejador(l.entity)}')" class="audit-entity-link audit-entity-link--usuario" title="Abrir expediente del usuario"><code class="audit-entity-code audit-entity-code--usuario">${escapar(l.entity)}</code></a>`
            : `<code class="audit-entity-code" title="${escapar(l.entity)}">${escapar(l.entity)}</code>`;

          const logIdStr = l.id || "";
          return `
            <div class="mobile-card-item" id="mobile-audit-${index}">
              <div class="datacard-header">
                <div class="datacard-id">
                  <span>REG:</span> ${escapar(l.timestamp)}
                </div>
                <div class="datacard-header-right">
                  <span class="audit-estado">
                    <span class="padron-dot ${getEstadoDot(l.status)}"></span>
                    <span>${escapar(l.status)}</span>
                  </span>
                </div>
              </div>

              <div class="datacard-body">
                <div class="datacard-row audit-row-action">
                  <span class="datacard-label">Acción Registrada</span>
                  <span class="datacard-value"><span class="audit-accion ${getAccionClase(l.action)}">${escapar(l.action)}</span></span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Entidad Afectada</span>
                  <span class="datacard-value">${entityHtml}</span>
                </div>

                <div class="datacard-extra" id="extra-audit-${index}">
                  <div class="datacard-row">
                    <span class="datacard-label">Autor</span>
                    <span class="datacard-value" style="display:flex; align-items:center; gap:6px;">
                      <span class="audit-user-avatar" style="width:22px; height:22px; font-size:9.5px;">${getInitials(l.user)}</span>
                      ${escapar(l.user)}
                    </span>
                  </div>
                  <div class="datacard-row">
                    <span class="datacard-label">Rol</span>
                    <span class="datacard-value">${escapar(l.role)}</span>
                  </div>
                  <div class="datacard-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
                    <span class="datacard-label">Detalle de la Operación</span>
                    <span class="datacard-value" style="text-align:left; font-size:12.5px; font-weight:500; color:var(--text-muted);">${escapar(l.detail)}</span>
                  </div>
                  <div class="datacard-actions-footer">
                    <button type="button" class="btn-action primary" style="width:100%; justify-content:center;" onclick="event.stopPropagation(); window.openAuditDetail ? window.openAuditDetail('${escaparEnManejador(logIdStr)}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${escaparEnManejador(logIdStr)}') : null)">
                      ${iconHtml("accion.ver", { size: 15, style: "margin-right:6px;" })}
                      Ver Ficha Completa de Auditoría
                    </button>
                  </div>
                </div>

                <button type="button" class="datacard-toggle-btn" id="btnToggleAudit-${index}" onclick="window.PDI ? window.PDI.DashboardView.toggleAuditCard(${escaparEnManejador(index)}) : (window.PDI?.AuditView?.toggleAuditCard ? window.PDI.AuditView.toggleAuditCard(${escaparEnManejador(index)}) : null)">
                  <span class="btn-text">Ver más</span>
                  ${iconHtml("nav.desplegar", { size: null })}
                </button>
              </div>
            </div>
          `;
        }).join("");
      }
    }
  },

  openLogDetail(logId) {
    const logs = this._currentAuditLogs || [];
    const log = logs.find(l => l.id === logId) || (logs.length > 0 ? logs[0] : null);
    if (!log) return;
    const modalView = window.PDI?.ModalView;
    if (modalView && modalView.openAuditDetail) {
      modalView.openAuditDetail(log);
    }
  },

  toggleAuditCard(index) {
    const card = document.getElementById(`mobile-audit-${index}`);
    const btn = document.getElementById(`btnToggleAudit-${index}`);
    if (card) {
      const isExp = card.classList.toggle("expanded");
      if (btn) {
        const textSpan = btn.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = isExp ? "Ver menos" : "Ver más";
      }
    }
  },

  toggleDropdown(dropdownId) {
    Dropdown.alternar(dropdownId);
  },
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AuditView = AuditView;
  // Compatibilidad hacia atrás con referencias directas a DashboardView
  if (window.PDI.DashboardView) {
    window.PDI.DashboardView.renderAuditLogs = (logs) => AuditView.renderAuditLogs(logs);
    window.PDI.DashboardView.openLogDetail = (id) => AuditView.openLogDetail(id);
    window.PDI.DashboardView.toggleAuditCard = (idx) => AuditView.toggleAuditCard(idx);
    window.PDI.DashboardView.filterBySearch = (q) => AuditView.filterBySearch(q);
    window.PDI.DashboardView.changePageSize = (s) => AuditView.changePageSize(s);
    window.PDI.DashboardView.changePage = (p) => AuditView.changePage(p);
  }
}
