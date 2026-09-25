// Vista: Tablero Principal Dashboard
export const DashboardView = {
  render(stats, auditLogs) {
    const animateNum = (el, val, isPct = false) => {
      if (!el) return;
      if (window.PDI && window.PDI.AnimationEngine) {
        window.PDI.AnimationEngine.animateCounter(el, val, { suffix: isPct ? "%" : "" });
      } else {
        el.textContent = isPct ? `${val}%` : val;
      }
    };

    const statEl = document.getElementById("statTotalNinos");
    if (statEl) animateNum(statEl, stats.total);

    const dashBenEl = document.getElementById("dashKpiBeneficiarios");
    if (dashBenEl) animateNum(dashBenEl, stats.total);

    const dashTamEl = document.getElementById("dashKpiTamizados");
    if (dashTamEl) {
      if (window.PDI && window.PDI.AnimationEngine) {
        window.PDI.AnimationEngine.animateCounter(dashTamEl, `${stats.total} / ${stats.total}`);
      } else {
        dashTamEl.textContent = `${stats.total} / ${stats.total}`;
      }
    }

    const dashAsisEl = document.getElementById("dashKpiAsistencia");
    if (dashAsisEl) animateNum(dashAsisEl, 92.4, true);

    const dashCasosEl = document.getElementById("dashKpiCasosSociales");
    if (dashCasosEl) animateNum(dashCasosEl, 4);

    const pctNormalEl = document.getElementById("pctNormal");
    if (pctNormalEl) animateNum(pctNormalEl, stats.pctNormal, true);

    const pctLeveEl = document.getElementById("pctLeve");
    if (pctLeveEl) animateNum(pctLeveEl, stats.pctLeve, true);

    const pctModEl = document.getElementById("pctModerada");
    if (pctModEl) animateNum(pctModEl, stats.pctMod, true);

    const barNormal = document.getElementById("barNormal");
    if (barNormal) {
      barNormal.style.width = "0%";
      void barNormal.offsetWidth;
      requestAnimationFrame(() => { barNormal.style.width = stats.pctNormal + "%"; });
    }

    const barLeve = document.getElementById("barLeve");
    if (barLeve) {
      barLeve.style.width = "0%";
      void barLeve.offsetWidth;
      requestAnimationFrame(() => { barLeve.style.width = stats.pctLeve + "%"; });
    }

    const barMod = document.getElementById("barMod");
    if (barMod) {
      barMod.style.width = "0%";
      void barMod.offsetWidth;
      requestAnimationFrame(() => { barMod.style.width = stats.pctMod + "%"; });
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
          color: "var(--gt-blue, #0d9488)",
          badgeClass: "badge-blue"
        }
      };

      if (allSedes.length > 0) {
        allSedes.forEach(s => {
          const dist = s.distrito || "Comas";
          if (!distritosMap[dist]) {
            distritosMap[dist] = {
              sedes: [],
              color: dist.toLowerCase() === "comas" ? "var(--gt-green)" : (dist.toLowerCase() === "carabayllo" ? "var(--gt-blue, #0d9488)" : "var(--gt-yellow, #f59e0b)"),
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
        const sedesText = dInfo.sedes.length > 0 ? `Sedes (${dInfo.sedes.length}): ${dInfo.sedes.join(", ")}` : "Sedes activas";

        return `
          <div class="district-coverage-card stagger-item">
            <div class="district-coverage-header">
              <div>
                <strong>Distrito de ${dist}</strong>
                <div class="district-coverage-sedes">${sedesText}</div>
              </div>
              <span class="badge ${dInfo.badgeClass} district-coverage-badge" id="badgeDistrict_${distSlug}">0 Beneficiarios (0%)</span>
            </div>
            <div class="district-coverage-track">
              <div class="district-coverage-bar" style="width: 0%; background: ${dInfo.color};" id="barDistrict_${distSlug}"></div>
            </div>
          </div>
        `;
      }).join("");

      // Animación continua y garantizada cuadro a cuadro (sin dependencias ni conflictos CSS)
      setTimeout(() => {
        distritosKeys.forEach(dist => {
          const distSlug = dist.toLowerCase().replace(/[^a-z0-9]/g, "");
          const distCount = allBeneficiarios.length > 0
            ? allBeneficiarios.filter(b => (b.distrito || "").toLowerCase() === dist.toLowerCase()).length
            : (dist.toLowerCase() === "comas" ? stats.comasCount : (dist.toLowerCase() === "carabayllo" ? stats.carabaylloCount : 0));
          
          const distPct = totalBeneficiarios > 0 ? Math.round((distCount / totalBeneficiarios) * 100) : 0;

          const barEl = document.getElementById(`barDistrict_${distSlug}`);
          const badgeEl = document.getElementById(`badgeDistrict_${distSlug}`);

          if (barEl) {
            barEl.style.transition = "none";
            barEl.style.width = "0%";
          }

          const startT = performance.now();
          const dur = 1000; // 1.0s de subida continua y sedosa
          
          const updateDistrict = (now) => {
            const elapsed = now - startT;
            const p = Math.min(elapsed / dur, 1);
            // Curva orgánica Out-Cubic (aceleración inicial y desaceleración ultra-suave)
            const ep = 1 - Math.pow(1 - p, 3);

            if (barEl) {
              const currentW = (distPct * ep).toFixed(2);
              barEl.style.width = `${currentW}%`;
            }

            if (badgeEl) {
              const currentVal = Math.round(distCount * ep);
              const currentPct = Math.round(distPct * ep);
              badgeEl.textContent = `${currentVal} Beneficiarios (${currentPct}%)`;
            }

            if (p < 1) {
              requestAnimationFrame(updateDistrict);
            } else {
              if (barEl) barEl.style.width = `${distPct}%`;
              if (badgeEl) {
                badgeEl.textContent = `${distCount} Beneficiarios (${distPct}%)`;
                badgeEl.classList.remove("vitality-glow");
                void badgeEl.offsetWidth;
                badgeEl.classList.add("vitality-glow");
              }
            }
          };

          requestAnimationFrame(updateDistrict);
        });
      }, 50);
    }

    if (window.PDI && window.PDI.AnimationEngine) {
      window.PDI.AnimationEngine.triggerStagger("view-dashboard");
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
              <circle id="semNormalCircle" cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-green)" stroke-width="14"
                stroke-dasharray="0 ${C}" stroke-dashoffset="0" stroke-linecap="round" />
              <circle id="semLeveCircle" cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-yellow)" stroke-width="14"
                stroke-dasharray="0 ${C}" stroke-dashoffset="0" stroke-linecap="round" />
              <circle id="semModCircle" cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-red)" stroke-width="14"
                stroke-dasharray="0 ${C}" stroke-dashoffset="0" stroke-linecap="round" />
            </svg>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none;">
              <span id="dashChartCenterNum" style="font-size: 20px; font-weight: 800; color: var(--text-main); font-family: var(--mono-font);">0</span>
              <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Menores</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 170px;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-green); display: inline-block;"></span>
                <span>Normal (&ge; 11.0)</span>
              </div>
              <strong style="color: var(--gt-green); font-family: var(--mono-font);" id="anemiaLegendNormal">0 (0%)</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-yellow); display: inline-block;"></span>
                <span>Anemia Leve</span>
              </div>
              <strong style="color: var(--gt-yellow); font-family: var(--mono-font);" id="anemiaLegendLeve">0 (0%)</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-red); display: inline-block;"></span>
                <span>Anemia Mod/Sev</span>
              </div>
              <strong style="color: var(--gt-red); font-family: var(--mono-font);" id="anemiaLegendMod">0 (0%)</strong>
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        const cNorm = document.getElementById("semNormalCircle");
        const cLeve = document.getElementById("semLeveCircle");
        const cMod = document.getElementById("semModCircle");
        const cNum = document.getElementById("dashChartCenterNum");
        const legNorm = document.getElementById("anemiaLegendNormal");
        const legLeve = document.getElementById("anemiaLegendLeve");
        const legMod = document.getElementById("anemiaLegendMod");

        const dur = 950;
        const startT = performance.now();

        const tickDonut = (now) => {
          const p = Math.min((now - startT) / dur, 1);
          const ep = 1 - Math.pow(1 - p, 3); // Curva suave Out-Cubic

          const curNorm = sNormal * ep;
          const curLeve = sLeve * ep;
          const curMod = sMod * ep;

          if (cNorm) {
            cNorm.setAttribute("stroke-dasharray", `${curNorm} ${C}`);
            cNorm.setAttribute("stroke-dashoffset", `0`);
          }
          if (cLeve) {
            cLeve.setAttribute("stroke-dasharray", `${curLeve} ${C}`);
            cLeve.setAttribute("stroke-dashoffset", `${-curNorm}`);
          }
          if (cMod) {
            cMod.setAttribute("stroke-dasharray", `${curMod} ${C}`);
            cMod.setAttribute("stroke-dashoffset", `${-(curNorm + curLeve)}`);
          }

          if (cNum) {
            cNum.textContent = Math.round(stats.total * ep);
          }

          if (legNorm) {
            const v = Math.round(stats.normales * ep);
            const pct = Math.round(stats.pctNormal * ep);
            legNorm.textContent = `${v} (${pct}%)`;
          }
          if (legLeve) {
            const v = Math.round(stats.leves * ep);
            const pct = Math.round(stats.pctLeve * ep);
            legLeve.textContent = `${v} (${pct}%)`;
          }
          if (legMod) {
            const v = Math.round(stats.moderadas * ep);
            const pct = Math.round(stats.pctMod * ep);
            legMod.textContent = `${v} (${pct}%)`;
          }

          if (p < 1) {
            requestAnimationFrame(tickDonut);
          } else {
            if (cNorm) cNorm.setAttribute("stroke-dasharray", `${sNormal} ${C}`);
            if (cLeve) {
              cLeve.setAttribute("stroke-dasharray", `${sLeve} ${C}`);
              cLeve.setAttribute("stroke-dashoffset", `${-sNormal}`);
            }
            if (cMod) {
              cMod.setAttribute("stroke-dasharray", `${sMod} ${C}`);
              cMod.setAttribute("stroke-dashoffset", `${-(sNormal + sLeve)}`);
            }
            if (cNum) {
              cNum.textContent = stats.total;
              cNum.classList.remove("vitality-glow");
              void cNum.offsetWidth;
              cNum.classList.add("vitality-glow");
            }
            if (legNorm) legNorm.textContent = `${stats.normales} (${stats.pctNormal}%)`;
            if (legLeve) legLeve.textContent = `${stats.leves} (${stats.pctLeve}%)`;
            if (legMod) legMod.textContent = `${stats.moderadas} (${stats.pctMod}%)`;
          }
        };

        requestAnimationFrame(tickDonut);
      }, 50);
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
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const isCurrentlyOpen = dropdown.classList.contains("open");
    // Cerrar otros dropdowns internos abiertos
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => {
      if (d !== dropdown) d.classList.remove("open");
    });
    dropdown.classList.toggle("open", !isCurrentlyOpen);
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
    const items = document.querySelectorAll("#menuAuditDate .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterAuditDate);
    });

    const labelEl = document.getElementById("labelAuditDateSelect");
    if (labelEl) {
      labelEl.textContent = label || "Todas las Fechas";
    }

    // Conmutar paneles de fecha
    const panelSpecific = document.getElementById("panelAuditDateSpecific");
    const panelRange = document.getElementById("panelAuditDateRange");
    if (panelSpecific) panelSpecific.style.display = (dateKey === "specific") ? "flex" : "none";
    if (panelRange) panelRange.style.display = (dateKey === "range") ? "flex" : "none";

    // Cerrar dropdown si es selección directa de fecha fija
    if (dateKey !== "specific" && dateKey !== "range") {
      const drop = document.getElementById("dropdownAuditDate");
      if (drop) drop.classList.remove("open");
    }

    this._auditCurrentPage = 1;
    this.applyAuditFilters();
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

  applyAuditFilters() {
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
          <span>${chip.label}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeAuditChip ? window.removeAuditChip('${chip.id}', '${chip.val || ''}') : null" title="Eliminar filtro">
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
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}
