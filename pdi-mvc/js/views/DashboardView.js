// Vista: Tablero Principal Dashboard
export const DashboardView = {
  render(stats, auditLogs) {
    const statEl = document.getElementById("statTotalNinos");
    if (statEl) statEl.textContent = stats.total;

    const pctNormalEl = document.getElementById("pctNormal");
    if (pctNormalEl) pctNormalEl.textContent = stats.pctNormal + "%";

    const pctLeveEl = document.getElementById("pctLeve");
    if (pctLeveEl) pctLeveEl.textContent = stats.pctLeve + "%";

    const pctModEl = document.getElementById("pctModerada");
    if (pctModEl) pctModEl.textContent = stats.pctMod + "%";

    const barNormal = document.getElementById("barNormal");
    if (barNormal) barNormal.style.width = stats.pctNormal + "%";

    const barLeve = document.getElementById("barLeve");
    if (barLeve) barLeve.style.width = stats.pctLeve + "%";

    const barMod = document.getElementById("barMod");
    if (barMod) barMod.style.width = stats.pctMod + "%";

    const coverageContainer = document.getElementById("dashDistrictCoverage");
    if (coverageContainer) {
      const pctComas = stats.total > 0 ? Math.round((stats.comasCount / stats.total) * 100) : 0;
      const pctCarabayllo = stats.total > 0 ? Math.round((stats.carabaylloCount / stats.total) * 100) : 0;
      coverageContainer.innerHTML = `
        <div class="district-coverage-card">
          <div class="district-coverage-header">
            <div>
              <strong>Distrito de Comas</strong>
              <div class="district-coverage-sedes">Sedes: La Libertad, Año Nuevo, Collique</div>
            </div>
            <span class="badge badge-green district-coverage-badge">${stats.comasCount} Beneficiarios (${pctComas}%)</span>
          </div>
          <div class="district-coverage-track">
            <div class="district-coverage-bar" style="width: ${pctComas}%; background: var(--gt-green);"></div>
          </div>
        </div>

        <div class="district-coverage-card">
          <div class="district-coverage-header">
            <div>
              <strong>Distrito de Carabayllo</strong>
              <div class="district-coverage-sedes">Sedes: El Progreso, San Pedro</div>
            </div>
            <span class="badge badge-blue district-coverage-badge">${stats.carabaylloCount} Beneficiarios (${pctCarabayllo}%)</span>
          </div>
          <div class="district-coverage-track">
            <div class="district-coverage-bar" style="width: ${pctCarabayllo}%; background: var(--gt-blue, #0d9488);"></div>
          </div>
        </div>
      `;
    }
    
    const anemiaContainer = document.getElementById("dashAnemiaBars");
    if (anemiaContainer) {
      const C = 251.32;
      const sNormal = (stats.pctNormal / 100) * C;
      const sLeve = (stats.pctLeve / 100) * C;
      const sMod = (stats.pctMod / 100) * C;
      
      anemiaContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-around; gap: 20px; flex-wrap: wrap; padding: 6px 0;">
          <div style="position: relative; width: 140px; height: 140px; flex-shrink: 0;">
            <svg viewBox="0 0 100 100" width="140" height="140" style="transform: rotate(-90deg);">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border-subtle)" stroke-width="14" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-green)" stroke-width="14"
                stroke-dasharray="${sNormal} ${C}" stroke-dashoffset="0" stroke-linecap="round" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-yellow)" stroke-width="14"
                stroke-dasharray="${sLeve} ${C}" stroke-dashoffset="${-sNormal}" stroke-linecap="round" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-red)" stroke-width="14"
                stroke-dasharray="${sMod} ${C}" stroke-dashoffset="${-(sNormal + sLeve)}" stroke-linecap="round" />
            </svg>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none;">
              <span style="font-size: 20px; font-weight: 800; color: var(--text-main); font-family: var(--mono-font);">${stats.total}</span>
              <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Menores</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 170px;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-green); display: inline-block;"></span>
                <span>Normal (&ge; 11.0)</span>
              </div>
              <strong style="color: var(--gt-green); font-family: var(--mono-font);">${stats.normales} (${stats.pctNormal}%)</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-yellow); display: inline-block;"></span>
                <span>Anemia Leve</span>
              </div>
              <strong style="color: var(--gt-yellow); font-family: var(--mono-font);">${stats.leves} (${stats.pctLeve}%)</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-red); display: inline-block;"></span>
                <span>Anemia Mod/Sev</span>
              </div>
              <strong style="color: var(--gt-red); font-family: var(--mono-font);">${stats.moderadas} (${stats.pctMod}%)</strong>
            </div>
          </div>
        </div>
      `;
    }

    this.renderAuditLogs(auditLogs);
  },

  renderAuditLogs(logs) {
    this._currentAuditLogs = logs || [];
    this.updateAuditKpis(this._currentAuditLogs);
    this.applyAuditFilters();
  },

  updateAuditKpis(logs) {
    const totalEl = document.getElementById("auditKpiTotal");
    const sensEl = document.getElementById("auditKpiSensibles");
    const lastActivityEl = document.getElementById("auditLastActivity");

    if (totalEl) totalEl.textContent = logs.length;
    
    if (sensEl) {
      const sensibles = logs.filter(l => 
        (l.action && l.action.toLowerCase().includes("derivaci")) || 
        (l.detail && l.detail.toLowerCase().includes("demuna"))
      );
      sensEl.textContent = sensibles.length;
    }

    if (lastActivityEl) {
      if (logs && logs.length > 0) {
        const latest = logs[0];
        lastActivityEl.textContent = `${latest.timestamp} · ${latest.user} (${latest.action})`;
      } else {
        lastActivityEl.textContent = "Sin registros coincidentes";
      }
    }
  },

  _auditSearchQuery: "",
  _auditCurrentPage: 1,
  _auditPageSize: 10,
  _customDateSpecific: "",
  _customDateRangeStart: "",
  _customDateRangeEnd: "",

  filterByAction(actionType) {
    this._selectedAuditAction = actionType;
    this._auditCurrentPage = 1;
    // Actualizar estilo activo en items del dropdown
    const items = document.querySelectorAll("#dropdownAuditAction .custom-dropdown-item");
    items.forEach(it => {
      if (it.getAttribute("data-value") === actionType) {
        it.classList.add("selected");
        const labelEl = document.getElementById("labelAuditAction");
        if (labelEl) {
          const clone = it.cloneNode(true);
          const badge = clone.querySelector(".badge");
          if (badge) badge.remove();
          labelEl.textContent = clone.textContent.trim();
        }
      } else {
        it.classList.remove("selected");
      }
    });
    this.updateActiveFiltersBadge();
    this.applyAuditFilters();
  },

  filterByRole(role) {
    this._selectedAuditRole = role;
    this._auditCurrentPage = 1;
    this.updateActiveFiltersBadge();
    this.applyAuditFilters();
  },

  filterByDate(dateKey) {
    this._selectedAuditDate = dateKey;
    this._auditCurrentPage = 1;

    // Conmutar visibilidad de paneles interactivos de fecha
    const panelSpecific = document.getElementById("panelAuditDateSpecific");
    const panelRange = document.getElementById("panelAuditDateRange");

    if (panelSpecific) panelSpecific.style.display = (dateKey === "specific") ? "flex" : "none";
    if (panelRange) panelRange.style.display = (dateKey === "range") ? "flex" : "none";

    this.updateActiveFiltersBadge();
    this.applyAuditFilters();
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
      this.updateActiveFiltersBadge();
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
      this.updateActiveFiltersBadge();
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
  },

  clearSearch() {
    const input = document.getElementById("inputAuditSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  resetAuditFilters() {
    this._customDateSpecific = "";
    this._customDateRangeStart = "";
    this._customDateRangeEnd = "";

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

    this.selectAction("all", "Todos los Eventos");
    this.selectDate("all", "Todas las Fechas");
    this.selectRole("all", "Todos los Roles");
  },

  updateActiveFiltersBadge() {
    let count = 0;
    if (this._selectedAuditAction && this._selectedAuditAction !== "all") count++;
    if (this._selectedAuditDate && this._selectedAuditDate !== "all") count++;
    if (this._selectedAuditRole && this._selectedAuditRole !== "all") count++;

    const badge = document.getElementById("auditActiveFiltersCount");
    const filterBtn = document.getElementById("btnDropdownAuditFilterPanel");

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }
    if (filterBtn) {
      if (count > 0) {
        filterBtn.classList.add("has-filters");
      } else {
        filterBtn.classList.remove("has-filters");
      }
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

  applyAuditFilters() {
    const logs = this._currentAuditLogs || [];
    const actionFilter = this._selectedAuditAction || "all";
    const roleFilter = this._selectedAuditRole || "all";
    const dateFilter = this._selectedAuditDate || "all";
    const query = this._auditSearchQuery || "";

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const filtered = logs.filter(l => {
      let matchAction = true;
      if (actionFilter === "salud") {
        matchAction = (l.action && l.action.toLowerCase().includes("cred")) || (l.action && l.action.toLowerCase().includes("tamizaje"));
      } else if (actionFilter === "social") {
        matchAction = (l.action && l.action.toLowerCase().includes("derivaci")) || (l.role && l.role.toLowerCase().includes("social"));
      } else if (actionFilter === "educativo") {
        matchAction = (l.action && l.action.toLowerCase().includes("asistencia")) || (l.role && l.role.toLowerCase().includes("promotora"));
      } else if (actionFilter === "padron") {
        matchAction = (l.action && l.action.toLowerCase().includes("padrón")) || (l.role && l.role.toLowerCase().includes("coordinaci"));
      }

      let matchRole = true;
      if (roleFilter !== "all") {
        matchRole = l.role && l.role.toLowerCase().includes(roleFilter.toLowerCase());
      }

      let matchDate = true;
      const logDateStr = (l.timestamp || "").slice(0, 10);
      if (dateFilter === "today") {
        matchDate = logDateStr === todayStr;
      } else if (dateFilter === "week") {
        const logDate = new Date(logDateStr);
        matchDate = !isNaN(logDate) && logDate >= sevenDaysAgo;
      } else if (dateFilter === "specific") {
        if (this._customDateSpecific) {
          matchDate = logDateStr === this._customDateSpecific;
        }
      } else if (dateFilter === "range") {
        const start = this._customDateRangeStart;
        const end = this._customDateRangeEnd;
        if (start && end) {
          matchDate = logDateStr >= start && logDateStr <= end;
        } else if (start) {
          matchDate = logDateStr >= start;
        } else if (end) {
          matchDate = logDateStr <= end;
        }
      }

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

      return matchAction && matchRole && matchDate && matchQuery;
    });

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

    const getActionBadgeClass = (action) => {
      const act = (action || "").toLowerCase();
      if (act.includes("cred") || act.includes("tamizaje")) return "badge-yellow";
      if (act.includes("derivaci")) return "badge-red";
      if (act.includes("asistencia")) return "badge-blue";
      if (act.includes("padrón") || act.includes("aprobación")) return "badge-green";
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

    if (tbody) {
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
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo ? window.openExpedienteByCodigo('${l.entity}') : (window.PDI?.BeneficiarioController?.openExpedienteByCodigo ? window.PDI.BeneficiarioController.openExpedienteByCodigo('${l.entity}') : null)" class="audit-entity-link" title="Abrir expediente del menor"><code style="font-family:var(--mono-font); font-weight:700; color:var(--gt-green); text-decoration:underline;">${l.entity}</code></a>`
            : `<code style="font-family:var(--mono-font); font-weight:700; color:var(--text-main);">${l.entity}</code>`;

          const logIdStr = l.id || "";
          return `
            <tr class="audit-row-interactive" onclick="window.openAuditDetail ? window.openAuditDetail('${logIdStr}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${logIdStr}') : null)" title="Clic para ver detalle de auditoría y cambios">
              <td style="font-family:var(--mono-font); font-size:12px; color:var(--text-dim); white-space:nowrap;">${l.timestamp}</td>
              <td>
                <div class="audit-user-cell">
                  <div class="audit-user-avatar">${getInitials(l.user)}</div>
                  <div>
                    <strong>${l.user}</strong>
                    <div style="font-size:11px; color:var(--text-muted);">${l.role}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge ${getActionBadgeClass(l.action)}">${l.action}</span></td>
              <td>${entityHtml}</td>
              <td style="font-size:12.5px; color:var(--text-muted); max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${l.detail}</td>
              <td><span class="badge ${getStatusBadgeClass(l.status)}">${l.status}</span></td>
              <td style="text-align:right;">
                <button type="button" class="btn-action-sm" onclick="event.stopPropagation(); window.openAuditDetail ? window.openAuditDetail('${logIdStr}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${logIdStr}') : null)" title="Ver detalle de trazabilidad">
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

    if (mobileContainer) {
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
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo ? window.openExpedienteByCodigo('${l.entity}') : (window.PDI?.BeneficiarioController?.openExpedienteByCodigo ? window.PDI.BeneficiarioController.openExpedienteByCodigo('${l.entity}') : null)" class="audit-entity-link" title="Abrir expediente del menor"><code style="font-family:var(--mono-font); font-weight:700; color:var(--gt-green); text-decoration:underline;">${l.entity}</code></a>`
            : `<code style="font-family:var(--mono-font); font-weight:700; color:var(--text-main);">${l.entity}</code>`;

          const logIdStr = l.id || "";
          return `
            <div class="mobile-card-item" id="mobile-audit-${index}">
              <div class="datacard-header">
                <div class="datacard-id">
                  <span>REG:</span> ${l.timestamp}
                </div>
                <div class="datacard-header-right">
                  <span class="badge ${getStatusBadgeClass(l.status)}">${l.status}</span>
                </div>
              </div>

              <div class="datacard-body">
                <div class="datacard-row">
                  <span class="datacard-label">Acción Registrada</span>
                  <span class="datacard-value"><span class="badge ${getActionBadgeClass(l.action)}">${l.action}</span></span>
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
                      ${l.user}
                    </span>
                  </div>
                  <div class="datacard-row">
                    <span class="datacard-label">Perfil / Rol</span>
                    <span class="datacard-value">${l.role}</span>
                  </div>
                  <div class="datacard-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
                    <span class="datacard-label">Detalle de la Operación</span>
                    <span class="datacard-value" style="text-align:left; font-size:12.5px; font-weight:500; color:var(--text-muted);">${l.detail}</span>
                  </div>
                  <div style="margin-top:10px;">
                    <button type="button" class="btn-action-sm primary" style="width:100%; justify-content:center;" onclick="window.openAuditDetail ? window.openAuditDetail('${logIdStr}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${logIdStr}') : null)">
                      <span>Ver Ficha Completa de Auditoría</span>
                    </button>
                  </div>
                </div>

                <button type="button" class="datacard-toggle-btn" id="btnToggleAudit-${index}" onclick="window.PDI ? window.PDI.DashboardView.toggleAuditCard(${index}) : DashboardView.toggleAuditCard(${index})">
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
    const target = document.getElementById(dropdownId);
    const allDropdowns = document.querySelectorAll(".custom-dropdown");
    allDropdowns.forEach(d => {
      // No cerrar dropdowns anidados ni el contenedor padre si se está abriendo un hijo
      if (d !== target && !d.contains(target) && !target?.contains(d)) {
        d.classList.remove("open");
      }
    });
    if (target) {
      target.classList.toggle("open");
    }
  },

  toggleInnerDropdown(dropdownId) {
    const target = document.getElementById(dropdownId);
    const container = document.getElementById("menuAuditFilterPanel");
    if (container) {
      container.querySelectorAll(".custom-dropdown").forEach(d => {
        if (d !== target) d.classList.remove("open");
      });
    }
    if (target) {
      target.classList.toggle("open");
    }
  },

  selectDate(value, label) {
    const selectEl = document.getElementById("selectAuditDateFilter");
    if (selectEl && selectEl.value !== value) {
      selectEl.value = value;
    }
    const labelEl = document.getElementById("labelAuditDate");
    if (labelEl) labelEl.textContent = label;

    this.filterByDate(value);
  },

  selectRole(value, label) {
    const selectEl = document.getElementById("selectAuditRoleFilter");
    if (selectEl && selectEl.value !== value) {
      selectEl.value = value;
    }
    const labelEl = document.getElementById("labelAuditRole");
    if (labelEl) labelEl.textContent = label;

    this.filterByRole(value);
  },

  selectAction(value, label) {
    // Actualizar botones segmentados
    const segButtons = document.querySelectorAll("#auditActionSegmented .audit-seg-btn");
    segButtons.forEach(btn => {
      if (btn.getAttribute("data-value") === value) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const labelEl = document.getElementById("labelAuditAction");
    if (labelEl) labelEl.textContent = label;

    this.filterByAction(value);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}
