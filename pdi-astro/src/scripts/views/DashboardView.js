import { AnimationEngine } from '../utils/AnimationEngine.js';
import { crear as crearFiltros } from '../utils/Filters.js';
import { Dropdown } from '../utils/Dropdown.js';
import { Responsive } from '../utils/Responsive.js';

import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";;
// Filtros del historial de cambios que viajan en la URL. Los mismos sirven para
// dashboard.html y para auditoria.html: es la misma vista en las dos paginas,
// y el fragmento de auditoria es solo su version a pantalla completa.
//
// Valores tomados de los desplegables de auditoria.html.
const FILTROS_AUDITORIA = {
  q:       { valor: "" },
  accion:  { valor: [], valores: ["salud", "social", "educativo", "padron"], multiple: true },
  fecha:   { valor: "all", valores: ["all", "today", "week", "specific", "range"] },
  // Las fechas sueltas son YYYY-MM-DD, que entra en la lista de caracteres
  // permitidos para texto libre.
  fechaEspecifica: { valor: "" },
  rangoDesde:      { valor: "" },
  rangoHasta:      { valor: "" },
  rol:     { valor: [], valores: ["Coordinación", "Facilitadora", "Promotora", "Trabajadora Social"], multiple: true },
  estado:  { valor: [], valores: ["Registrado", "Sensible", "Observado"], multiple: true },
  pagina:  { valor: 1, numeros: { min: 1, max: 10000 } },
  tam:     { valor: 10, numeros: { min: 5, max: 100 } },
};

// Vista: Tablero Principal Dashboard
export const DashboardView = {
  _filtros: null,
  _filtrosLeidos: false,
  _haEntrado: false,

  reiniciarEntrada() {
    this._haEntrado = false;
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
    this._filterAuditAction = f.accion;
    this._filterAuditDate = f.fecha;
    this._filterAuditRole = f.rol;
    this._filterAuditStatus = f.estado;
    this._auditCurrentPage = f.pagina;
    this._auditPageSize = f.tam;

    // El rango personalizado necesita los dos extremos. Si solo llega uno, se
    // descarta el rango entero: filtrar por un intervalo con un extremo
    // inventado no significaria nada.
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

  render(stats, auditLogs) {
    const esPrimeraEntrada = !this._haEntrado;
    this._haEntrado = true;

    const rollNum = (el, val, isPct = false) => {
      if (!el) return;
      AnimationEngine.odometerRoll(el, val, { suffix: isPct ? "%" : "" });
    };

    const statEl = document.getElementById("statTotalNinos");
    if (statEl) rollNum(statEl, stats.total);

    const dashBenEl = document.getElementById("dashKpiBeneficiarios");
    if (dashBenEl) rollNum(dashBenEl, stats.total);

    const dashTamEl = document.getElementById("dashKpiTamizados");
    if (dashTamEl) rollNum(dashTamEl, `${stats.total} / ${stats.total}`);

    const dashAsisEl = document.getElementById("dashKpiAsistencia");
    if (dashAsisEl) rollNum(dashAsisEl, 92.4, true);

    const dashCasosEl = document.getElementById("dashKpiCasosSociales");
    if (dashCasosEl) {
      const criticos = window.PDI?.CasoSocialModel?.contarCriticos
        ? window.PDI.CasoSocialModel.contarCriticos()
        : 0;
      rollNum(dashCasosEl, criticos);
    }

    const coverageContainer = document.getElementById("dashDistrictCoverage");
    if (coverageContainer) {
      // Obtener sedes actualizadas del modelo de Sedes e Iglesias
      const sedesModel = window.PDI?.SedeModel || (typeof SedeModel !== "undefined" ? SedeModel : null);
      const allSedes = sedesModel && sedesModel.getAll ? sedesModel.getAll() : [];
      
      const bModel = window.PDI?.BeneficiarioModel || (typeof BeneficiarioModel !== "undefined" ? BeneficiarioModel : null);
      const allBeneficiarios = bModel && bModel.getAll ? bModel.getAll() : [];
      const totalBeneficiarios = stats.total || allBeneficiarios.length || 1;

      // Agrupación de sedes por distrito
      const distritosMap = {
        "Comas": {
          sedes: ["Año Nuevo", "La Libertad", "Carmen Alto"],
          color: "var(--gt-green)",
          badgeClass: "badge-green"
        },
        "Carabayllo": {
          sedes: ["El Progreso", "San Pedro", "Los Bendecidos", "Santa Rosa"],
          color: "var(--gt-blue, #0284c7)",
          badgeClass: "badge-blue"
        }
      };

      if (allSedes.length > 0) {
        allSedes.forEach(s => {
          const dist = s.distrito || "Comas";
          if (!distritosMap[dist]) {
            distritosMap[dist] = {
              sedes: [],
              color: dist.toLowerCase() === "comas" ? "var(--gt-green)" : (dist.toLowerCase() === "carabayllo" ? "var(--gt-blue, #0284c7)" : "var(--gt-yellow, #f59e0b)"),
              badgeClass: dist.toLowerCase() === "comas" ? "badge-green" : (dist.toLowerCase() === "carabayllo" ? "badge-blue" : "badge-yellow")
            };
          }
          if (!distritosMap[dist].sedes.includes(s.nombre)) {
            distritosMap[dist].sedes.push(s.nombre);
          }
        });
      }

      const distritosKeys = Object.keys(distritosMap);

      coverageContainer.innerHTML = distritosKeys.map(dist => {
        const dInfo = distritosMap[dist];
        const distSlug = dist.toLowerCase().replace(/[^a-z0-9]/g, "");
        const distCount = allBeneficiarios.length > 0
          ? allBeneficiarios.filter(b => (b.distrito || "").toLowerCase() === dist.toLowerCase()).length
          : (dist.toLowerCase() === "comas" ? stats.comasCount : (dist.toLowerCase() === "carabayllo" ? stats.carabaylloCount : 0));
        const distPct = totalBeneficiarios > 0 ? Math.round((distCount / totalBeneficiarios) * 100) : 0;
        const sedesText = dInfo.sedes.length > 0 ? `Sedes (${dInfo.sedes.length}): ${dInfo.sedes.join(", ")}` : "Sedes activas";
        const barColorClass = dist.toLowerCase() === "comas" ? "green" : (dist.toLowerCase() === "carabayllo" ? "blue" : "yellow");
        const startWidth = esPrimeraEntrada ? "0%" : `${distPct}%`;

        return `
          <div class="dash-territory-row">
            <div class="dash-territory-head">
              <div class="dash-territory-info">
                <strong>Distrito de ${escapar(dist)}</strong>
                <span class="dash-territory-sub">${escapar(sedesText)}</span>
              </div>
              <div class="dash-territory-metric">
                <strong id="badgeDistrict_${distSlug}">${distCount} menores</strong>
                <span class="dash-territory-pct" id="pctDistrict_${distSlug}">(${distPct}%)</span>
              </div>
            </div>
            <div class="dash-territory-track">
              <div class="dash-territory-bar ${barColorClass}" style="width: ${startWidth};" data-target-width="${distPct}%" id="barDistrict_${distSlug}"></div>
            </div>
          </div>
        `;
      }).join("");

      if (esPrimeraEntrada) {
        requestAnimationFrame(() => {
          coverageContainer.querySelectorAll(".dash-territory-bar").forEach(bar => {
            const tw = bar.getAttribute("data-target-width");
            if (tw) bar.style.width = tw;
          });
        });
      }
    }

    // Da entrada a los elementos del tablero solo en la primera carga
    if (esPrimeraEntrada) {
      AnimationEngine.triggerStagger("view-dashboard");
    }

    // Panel de Anemia MINSA - Actualización de estado clínico directa con animación fluida
    const anemiaContainer = document.getElementById("dashAnemiaBars");
    if (anemiaContainer) {
      const segNormal = document.getElementById("segAnemiaNormal");
      const segLeve = document.getElementById("segAnemiaLeve");
      const segMod = document.getElementById("segAnemiaMod");
      const legNormal = document.getElementById("anemiaLegendNormal");
      const legLeve = document.getElementById("anemiaLegendLeve");
      const legMod = document.getElementById("anemiaLegendMod");
      const pctNormal = document.getElementById("anemiaPctNormal");
      const pctLeve = document.getElementById("anemiaPctLeve");
      const pctMod = document.getElementById("anemiaPctMod");
      const totalEval = document.getElementById("dashAnemiaTotalEvaluados");

      if (esPrimeraEntrada) {
        // Animar barras segmentadas desde 0% hacia su porcentaje con transición orgánica solo en entrada
        if (segNormal) {
          segNormal.style.width = "0%";
          void segNormal.offsetWidth;
          requestAnimationFrame(() => { segNormal.style.width = `${stats.pctNormal}%`; });
        }
        if (segLeve) {
          segLeve.style.width = "0%";
          void segLeve.offsetWidth;
          requestAnimationFrame(() => { segLeve.style.width = `${stats.pctLeve}%`; });
        }
        if (segMod) {
          segMod.style.width = "0%";
          void segMod.offsetWidth;
          requestAnimationFrame(() => { segMod.style.width = `${stats.pctMod}%`; });
        }
      } else {
        // En refrescos posteriores de datos, transicionar suavemente sin reiniciar a 0%
        if (segNormal) segNormal.style.width = `${stats.pctNormal}%`;
        if (segLeve) segLeve.style.width = `${stats.pctLeve}%`;
        if (segMod) segMod.style.width = `${stats.pctMod}%`;
      }

      if (totalEval) rollNum(totalEval, stats.total);
      if (legNormal) rollNum(legNormal, stats.normales);
      if (pctNormal) pctNormal.textContent = `(${stats.pctNormal}%)`;
      if (legLeve) rollNum(legLeve, stats.leves);
      if (pctLeve) pctLeve.textContent = `(${stats.pctLeve}%)`;
      if (legMod) rollNum(legMod, stats.moderadas);
      if (pctMod) pctMod.textContent = `(${stats.pctMod}%)`;
    }

    this.renderPriorityCases(esPrimeraEntrada);
    this.renderRecentActivity(auditLogs, esPrimeraEntrada);
    this.renderAuditLogs(auditLogs);
  },

  renderPriorityCases(animar = false) {
    const container = document.getElementById("dashPriorityCasesList");
    if (!container) return;

    const bModel = window.PDI?.BeneficiarioModel || (typeof BeneficiarioModel !== "undefined" ? BeneficiarioModel : null);
    const all = bModel && bModel.getAll ? bModel.getAll() : [];
    if (!all.length) {
      container.innerHTML = '<div class="dash-empty-state">No hay menores registrados actualmente.</div>';
      return;
    }

    const priorizados = [...all].sort((a, b) => {
      const score = (x) => {
        if (x.anemia === "Severa") return 4;
        if (x.anemia === "Moderada") return 3;
        if (x.estado === "Observado" || x.estado === "Sensible") return 2;
        if (x.anemia === "Leve") return 1;
        return 0;
      };
      return score(b) - score(a);
    }).slice(0, 4);

    container.innerHTML = priorizados.map(m => {
      const isCritical = m.anemia === "Moderada" || m.anemia === "Severa";
      const badgeCls = isCritical ? "badge-red" : (m.anemia === "Leve" ? "badge-yellow" : "badge-green");
      const badgeText = m.anemia ? ("Hb " + (m.hb || "--") + " g/dL (" + m.anemia + ")") : m.estado;
      const nombresArr = (m.nombres || "").trim().split(/\s+/);
      const apellidosArr = (m.apellidos || "").trim().split(/\s+/);
      const iniciales = (((nombresArr[0]?.[0] || "") + (apellidosArr[0]?.[0] || "")) || "NN").toUpperCase();

      return '<div class="dash-priority-item">' +
        '<div class="dash-priority-avatar ' + (isCritical ? 'critical' : '') + '">' + escapar(iniciales) + '</div>' +
        '<div class="dash-priority-info">' +
          '<div class="dash-priority-name">' +
            '<strong>' + escapar(m.nombres) + ' ' + escapar(m.apellidos) + '</strong>' +
            '<span class="dash-priority-meta">' + escapar(m.edad || '') + ' · ' + escapar(m.sede || m.distrito || '') + '</span>' +
          '</div>' +
          '<div class="dash-priority-tags">' +
            '<span class="badge ' + badgeCls + '">' + escapar(badgeText) + '</span>' +
            '<span class="dash-priority-code">' + escapar(m.codigo) + '</span>' +
          '</div>' +
        '</div>' +
        '<a href="/expediente?id=' + encodeURIComponent(m.id) + '" class="btn-micro-action" title="Abrir expediente de ' + escapar(m.nombres) + '" data-astro-prefetch>' +
          '<span>Expediente</span>' +
          '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"></path>' +
          '</svg>' +
        '</a>' +
      '</div>';
    }).join("");

    if (animar) {
      AnimationEngine.entradaEscalonada(container, ".dash-priority-item", { paso: 35 });
    }
  },

  renderRecentActivity(auditLogs, animar = false) {
    const container = document.getElementById("dashRecentActivityList");
    if (!container) return;

    const logs = (auditLogs && auditLogs.length) ? auditLogs.slice(0, 4) : [];
    if (!logs.length) {
      container.innerHTML = '<div class="dash-empty-state">Sin eventos recientes registrados.</div>';
      return;
    }

    container.innerHTML = logs.map(l => {
      const isSensitive = (l.status && l.status.toLowerCase().includes("sensible")) ||
                          (l.action && l.action.toLowerCase().includes("derivaci"));
      const timeClean = l.timestamp ? l.timestamp.replace(/^\d{4}-\d{2}-\d{2}\s*/, "") : "--:--";

      return '<div class="dash-timeline-item">' +
        '<div class="dash-timeline-dot ' + (isSensitive ? 'alert' : '') + '"></div>' +
        '<div class="dash-timeline-body">' +
          '<div class="dash-timeline-header">' +
            '<span class="dash-timeline-user"><strong>' + escapar(l.user || "Operador") + '</strong> (' + escapar(l.role || "PDI") + ')</span>' +
            '<span class="dash-timeline-time">' + escapar(timeClean) + '</span>' +
          '</div>' +
          '<p class="dash-timeline-action"><strong>' + escapar(l.action) + '</strong>: ' + escapar(l.detail || "") + '</p>' +
          '<div class="dash-timeline-meta">' +
            '<span>Sede: ' + escapar(l.sede || "Central") + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join("");

    if (animar) {
      AnimationEngine.entradaEscalonada(container, ".dash-timeline-item", { paso: 35 });
    }
  },

  renderAuditLogs(logs) {
    // La lectura va antes de los indicadores: si se lee despues, el total que
    // se muestra es el de la pagina entera y no el de lo que se esta viendo.
    this._leerFiltrosDeURL();
    this._currentAuditLogs = logs || [];
    this.updateAuditKpis(this._currentAuditLogs);
    this.applyAuditFilters();
  },

  updateAuditKpis(logs) {
    const totalEl = document.getElementById("auditKpiTotal");
    const sensEl = document.getElementById("auditKpiSensibles");
    const exportCountEl = document.getElementById("exportAuditCountBadge");

    const totalCount = (logs && logs.length) || 0;
    if (totalEl) totalEl.textContent = totalCount;
    if (exportCountEl) exportCountEl.textContent = `${totalCount} eventos`;
    
    if (sensEl) {
      const sensibles = logs ? logs.filter(l => 
        (l.action && l.action.toLowerCase().includes("derivaci")) || 
        (l.detail && l.detail.toLowerCase().includes("demuna")) ||
        (l.status && l.status.toLowerCase().includes("sensible"))
      ) : [];
      sensEl.textContent = sensibles.length;
    }
  },

  _currentAuditLogs: [],
  _auditSearchQuery: "",
  _filterAuditAction: [], // array de acciones seleccionadas (vacío = todas)
  _filterAuditDate: "all", // "all" | "today" | "week" | "specific" | "range"
  _filterAuditRole: [],   // array de roles seleccionados (vacío = todos)
  _filterAuditStatus: [], // array de estados seleccionados (vacío = todos)
  _customDateSpecific: "",
  _customDateRangeStart: "",
  _customDateRangeEnd: "",
  _auditCurrentPage: 1,
  _auditPageSize: 10,

  toggleInnerDropdown(dropdownId) {
    Dropdown.alternarInterno(dropdownId);
  },

  toggleAction(val) {
    const allActions = ["salud", "social", "educativo", "padron"];
    if (val === "all") {
      this._filterAuditAction = [];
    } else {
      const idx = this._filterAuditAction.indexOf(val);
      if (idx > -1) {
        this._filterAuditAction.splice(idx, 1);
      } else {
        this._filterAuditAction.push(val);
      }
      if (allActions.every(a => this._filterAuditAction.includes(a))) {
        this._filterAuditAction = [];
      }
    }
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
    this._filterAuditDate = dateKey || "all";
    this._updateDateUI(label);

    // Cerrar dropdown si es selección directa de fecha fija
    if (dateKey !== "specific" && dateKey !== "range") {
      const drop = document.getElementById("dropdownAuditDate");
      if (drop) drop.classList.remove("open");
    }

    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  /**
   * Pinta el desplegable de fecha y muestra el panel que corresponda.
   *
   * Se separa de selectDate() porque al restaurar desde la URL hay que mostrar
   * el panel de fecha especifica o de rango sin cerrar el desplegable ni
   * reiniciar la paginacion: en ese momento no hay pulsacion, hay una URL.
   */
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

    // Los <input type="date"> del panel de rango conservan su valor: al recargar
    // un enlace con rango, los dos campos tienen que mostrarlo.
    const inputSpecific = document.getElementById("inputAuditDateSpecific");
    if (inputSpecific) inputSpecific.value = this._customDateSpecific || "";
    const inputDesde = document.getElementById("inputAuditDateRangeStart");
    if (inputDesde) inputDesde.value = this._customDateRangeStart || "";
    const inputHasta = document.getElementById("inputAuditDateRangeEnd");
    if (inputHasta) inputHasta.value = this._customDateRangeEnd || "";
  },

  toggleRole(val) {
    const allRoles = ["Coordinación", "Facilitadora", "Promotora", "Trabajadora Social"];
    if (val === "all") {
      this._filterAuditRole = [];
    } else {
      const idx = this._filterAuditRole.indexOf(val);
      if (idx > -1) {
        this._filterAuditRole.splice(idx, 1);
      } else {
        this._filterAuditRole.push(val);
      }
      if (allRoles.every(r => this._filterAuditRole.includes(r))) {
        this._filterAuditRole = [];
      }
    }
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
    const allStatuses = ["Registrado", "Sensible", "Observado"];
    if (val === "all") {
      this._filterAuditStatus = [];
    } else {
      const idx = this._filterAuditStatus.indexOf(val);
      if (idx > -1) {
        this._filterAuditStatus.splice(idx, 1);
      } else {
        this._filterAuditStatus.push(val);
      }
      if (allStatuses.every(s => this._filterAuditStatus.includes(s))) {
        this._filterAuditStatus = [];
      }
    }
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
    
    // Auto-formateo con slashes si el usuario escribe solo dígitos
    const cleanDigits = val.replace(/\D/g, "").slice(0, 8);
    if (cleanDigits.length >= 5) {
      val = `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2, 4)}/${cleanDigits.slice(4)}`;
    } else if (cleanDigits.length >= 3) {
      val = `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2)}`;
    } else {
      val = cleanDigits;
    }
    inputEl.value = val;

    // Si tiene 10 caracteres (DD/MM/AAAA) validar y parsear
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
    // Se escribe lo tecleado, no _auditSearchQuery: este va en minusculas y sin
    // espacios, y al recargar el buscador mostraria un texto que nadie escribio.
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
    this._filterAuditAction = [];
    this._filterAuditDate = "all";
    this._filterAuditRole = [];
    this._filterAuditStatus = [];
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
        return (log.action && (log.action.toLowerCase().includes("padrón") || log.action.toLowerCase().includes("aprobación") || log.action.toLowerCase().includes("menor") || log.action.toLowerCase().includes("ingreso"))) || (log.role && log.role.toLowerCase().includes("coordinaci"));
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

  /**
   * Se suscribe una sola vez por carga al cruce del corte de 768 px. Se
   * registra desde applyAuditFilters(), que es el unico camino por el que la
   * tabla de auditoria se dibuja, para que valga tanto desde el panel como
   * desde la pagina de auditoria. Al cruzar, hay que repintar: la variante que
   * estaba vacia es la que pasa a verse.
   */
  _vigilarVariante() {
    if (this._vigilaVariante) return;
    this._vigilaVariante = true;
    Responsive.alCambiarDeVariante(() => this.applyAuditFilters());
  },

  applyAuditFilters() {
    this._vigilarVariante();
    const logs = this._currentAuditLogs || [];
    const query = this._auditSearchQuery || "";

    const filtered = logs.filter(l => {
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

    // Actualizar badge de filtros activos
    let count = 0;
    if (this._filterAuditAction.length > 0) count += this._filterAuditAction.length;
    if (this._filterAuditDate !== "all") count++;
    if (this._filterAuditRole.length > 0) count += this._filterAuditRole.length;
    if (this._filterAuditStatus.length > 0) count += this._filterAuditStatus.length;

    const badge = document.getElementById("auditActiveFiltersCount");
    const filterBtn = document.getElementById("btnDropdownAuditFilterPanel");

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }
    if (filterBtn) {
      filterBtn.classList.toggle("has-filters", count > 0);
    }

    this._updateAuditFacetCounts();
    this._renderAuditActiveChips();

    // Paginación
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

    // Un solo punto de escritura para los nueve filtros: toggleAction(),
    // selectDate(), toggleRole(), toggleStatus(), handleDatePickerChange(),
    // handleDateManualInput(), filterBySearch(), changePage(), changePageSize()
    // y resetAuditFilters() terminan todos en applyAuditFilters(), y en cuanto
    // cambian algo lo unico que hacen falta es repintar. Se escribe al final, ya
    // con la pagina normalizada, para que la URL no anuncie una pagina que
    // despues el propio filtro deja fuera de rango.
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

    // 1. Facetas de Tipo de Evento
    const forAction = getFilteredExcluding("action");
    setFacetBadge("countFacetAuditAction-all", `(${forAction.length})`, forAction.length === 0);
    const actionsList = ["salud", "social", "educativo", "padron"];
    actionsList.forEach(act => {
      const c = forAction.filter(log => this._matchesAuditAction(log, [act])).length;
      setFacetBadge(`countFacetAuditAction-${act}`, `(${c})`, c === 0);
    });

    // 2. Facetas de Periodo Temporal
    const forDate = getFilteredExcluding("date");
    setFacetBadge("countFacetAuditDate-all", `(${forDate.length})`, forDate.length === 0);
    const cToday = forDate.filter(log => this._matchesAuditDate(log, "today")).length;
    const cWeek = forDate.filter(log => this._matchesAuditDate(log, "week")).length;
    setFacetBadge("countFacetAuditDate-today", `(${cToday})`, cToday === 0);
    setFacetBadge("countFacetAuditDate-week", `(${cWeek})`, cWeek === 0);

    // 3. Facetas de Rol del Usuario
    const forRole = getFilteredExcluding("role");
    setFacetBadge("countFacetAuditRole-all", `(${forRole.length})`, forRole.length === 0);
    const rolesList = ["Coordinación", "Facilitadora", "Promotora", "Trabajadora Social"];
    rolesList.forEach(r => {
      const c = forRole.filter(log => this._matchesAuditRole(log, [r])).length;
      setFacetBadge(`countFacetAuditRole-${r}`, `(${c})`, c === 0);
    });

    // 4. Facetas de Estado de Registro
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
        chips.push({
          id: "action",
          val: act,
          label: `Evento: ${label}`
        });
      });
    }

    if (this._filterAuditDate !== "all") {
      let dateLabel = this._filterAuditDate;
      if (this._filterAuditDate === "today") dateLabel = "Fecha: Hoy";
      if (this._filterAuditDate === "week") dateLabel = "Fecha: Últimos 7 días";
      if (this._filterAuditDate === "specific") dateLabel = `Fecha: ${this._customDateSpecific || "Específica"}`;
      if (this._filterAuditDate === "range") dateLabel = `Rango: ${this._customDateRangeStart || "..."} a ${this._customDateRangeEnd || "..."}`;
      chips.push({
        id: "date",
        label: dateLabel
      });
    }

    if (this._filterAuditRole.length > 0) {
      this._filterAuditRole.forEach(r => {
        chips.push({
          id: "role",
          val: r,
          label: `Rol: ${r}`
        });
      });
    }

    if (this._filterAuditStatus.length > 0) {
      this._filterAuditStatus.forEach(s => {
        let sLabel = s;
        if (s === "Registrado") sLabel = "Conforme";
        if (s === "Sensible") sLabel = "Sensible / Crítico";
        if (s === "Observado") sLabel = "En Revisión";
        chips.push({
          id: "status",
          val: s,
          label: `Estado: ${sLabel}`
        });
      });
    }

    if (chips.length === 0) {
      bar.style.display = "none";
      list.innerHTML = "";
    } else {
      bar.style.display = "flex";
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${escapar(chip.label)}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeAuditChip ? window.removeAuditChip('${escaparEnManejador(chip.id)}', '${escaparEnManejador(chip.val || '')}') : null" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
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
    if (infoEl) {
      if (total === 0) {
        infoEl.textContent = "Sin registros coincidentes";
      } else {
        infoEl.textContent = `Mostrando ${start + 1} a ${end} de ${total} eventos`;
      }
    }

    const btnPrev = document.getElementById("btnAuditPagePrev");
    const btnNext = document.getElementById("btnAuditPageNext");
    const pageNumEl = document.getElementById("auditCurrentPageNum");

    if (pageNumEl) pageNumEl.textContent = `Página ${this._auditCurrentPage} de ${totalPages}`;
    if (btnPrev) btnPrev.disabled = (this._auditCurrentPage <= 1);
    if (btnNext) btnNext.disabled = (this._auditCurrentPage >= totalPages);
  },

  renderAuditTableAndCards(logs) {
    const tbody = document.getElementById("tbodyAuditLogs");
    const mobileContainer = document.getElementById("mobileCardsAuditoria");

    // Solo se dibuja la variante que se va a ver. La lista de tarjetas
    // ocupaba 135 de los 1251 nodos del documento y 13 KB de marcado, y se
    // regeneraba en cada filtrado. Al cruzar el corte, _vigilarVariante()
    // repinta.
    const enMovil = Responsive.esMovil();

    // La que no se dibuja se vacia, y no se deja con lo que hubiera de antes:
    // si no, girar el movil con la ventana sola dejaria las dos pintadas.
    if (enMovil) { if (tbody) tbody.innerHTML = ""; }
    else { if (mobileContainer) mobileContainer.innerHTML = ""; }

    const getActionBadgeClass = (action) => {
      const act = (action || "").toLowerCase();
      if (act.includes("cred") || act.includes("tamizaje") || act.includes("salud")) return "badge-yellow";
      if (act.includes("derivaci") || act.includes("social")) return "badge-red";
      if (act.includes("asistencia") || act.includes("casita")) return "badge-blue";
      if (act.includes("padrón") || act.includes("aprobación") || act.includes("ingreso")) return "badge-green";
      return "badge-blue";
    };

    const getStatusBadgeClass = (status) => {
      const s = (status || "").toLowerCase();
      if (s.includes("sensible") || s.includes("crítico") || s.includes("derivaci")) return "badge-red";
      if (s.includes("observado") || s.includes("revisión") || s.includes("pendiente")) return "badge-yellow";
      return "badge-green"; // Registrado / Conforme
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
          const isMenor = (l.entity && l.entity.startsWith("PDI-"));
          const entityHtml = isMenor 
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo('${escaparEnManejador(l.entity)}')" class="audit-entity-link" title="Abrir expediente del menor"><code style="font-family:var(--mono-font); font-weight:700; color:var(--text-brand); text-decoration:underline;">${escapar(l.entity)}</code></a>`
            : `<code style="font-family:var(--mono-font); font-weight:700; color:var(--text-main);">${escapar(l.entity)}</code>`;

          const logIdStr = l.id || "";
          return `
            <tr class="audit-row-interactive" onclick="window.openAuditDetail ? window.openAuditDetail('${escaparEnManejador(logIdStr)}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${escaparEnManejador(logIdStr)}') : null)" title="Clic para ver detalle de auditoría y cambios">
              <td style="font-family:var(--mono-font); font-size:12px; color:var(--text-dim); white-space:nowrap;">${escapar(l.timestamp)}</td>
              <td>
                <div class="audit-user-cell">
                  <div class="audit-user-avatar">${getInitials(l.user)}</div>
                  <div>
                    <strong>${escapar(l.user)}</strong>
                    <div style="font-size:11px; color:var(--text-muted);">${escapar(l.role)}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge ${getActionBadgeClass(l.action)}">${escapar(l.action)}</span></td>
              <td>${entityHtml}</td>
              <td style="font-size:12.5px; color:var(--text-muted); max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapar(l.detail)}</td>
              <td><span class="badge ${getStatusBadgeClass(l.status)}">${escapar(l.status)}</span></td>
              <td style="text-align:right;">
                <button type="button" class="btn-action-sm" onclick="event.stopPropagation(); window.openAuditDetail ? window.openAuditDetail('${escaparEnManejador(logIdStr)}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${escaparEnManejador(logIdStr)}') : null)" title="Ver detalle de trazabilidad">
                  <span>Detalle</span>
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
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
          const isMenor = (l.entity && l.entity.startsWith("PDI-"));
          const entityHtml = isMenor 
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo('${escaparEnManejador(l.entity)}')" class="audit-entity-link" title="Abrir expediente del menor"><code style="font-family:var(--mono-font); font-weight:700; color:var(--text-brand); text-decoration:underline;">${escapar(l.entity)}</code></a>`
            : `<code style="font-family:var(--mono-font); font-weight:700; color:var(--text-main);">${escapar(l.entity)}</code>`;

          const logIdStr = l.id || "";
          return `
            <div class="mobile-card-item" id="mobile-audit-${index}">
              <div class="datacard-header">
                <div class="datacard-id">
                  <span>REG:</span> ${escapar(l.timestamp)}
                </div>
                <div class="datacard-header-right">
                  <span class="badge ${getStatusBadgeClass(l.status)}">${escapar(l.status)}</span>
                </div>
              </div>

              <div class="datacard-body">
                <div class="datacard-row">
                  <span class="datacard-label">Acción Registrada</span>
                  <span class="datacard-value"><span class="badge ${getActionBadgeClass(l.action)}">${escapar(l.action)}</span></span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Entidad Afectada</span>
                  <span class="datacard-value">${entityHtml}</span>
                </div>

                <div class="datacard-extra" id="extra-audit-${index}">
                  <div class="datacard-row">
                    <span class="datacard-label">Usuario Responsable</span>
                    <span class="datacard-value" style="display:flex; align-items:center; gap:6px;">
                      <span class="audit-user-avatar" style="width:22px; height:22px; font-size:9.5px;">${getInitials(l.user)}</span>
                      ${escapar(l.user)}
                    </span>
                  </div>
                  <div class="datacard-row">
                    <span class="datacard-label">Perfil / Rol</span>
                    <span class="datacard-value">${escapar(l.role)}</span>
                  </div>
                  <div class="datacard-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
                    <span class="datacard-label">Detalle de la Operación</span>
                    <span class="datacard-value" style="text-align:left; font-size:12.5px; font-weight:500; color:var(--text-muted);">${escapar(l.detail)}</span>
                  </div>
                  <div style="margin-top:10px;">
                    <button type="button" class="btn-action-sm primary" style="width:100%; justify-content:center;" onclick="window.openAuditDetail ? window.openAuditDetail('${escaparEnManejador(logIdStr)}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${escaparEnManejador(logIdStr)}') : null)">
                      <span>Ver Ficha Completa de Auditoría</span>
                    </button>
                  </div>
                </div>

                <button type="button" class="datacard-toggle-btn" id="btnToggleAudit-${index}" onclick="window.PDI ? window.PDI.DashboardView.toggleAuditCard(${escaparEnManejador(index)}) : DashboardView.toggleAuditCard(${escaparEnManejador(index)})">
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
    }
  },

  openLogDetail(logId) {
    const logs = this._currentAuditLogs || [];
    const log = logs.find(l => l.id === logId) || (logs.length > 0 ? logs[0] : null);
    if (!log) return;
    const modalView = window.PDI?.ModalView || ModalView;
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
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}
