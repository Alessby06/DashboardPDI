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
        <div style="padding: 12px 16px; border-radius: var(--radius-md); background: var(--surface-2); border: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <strong>Distrito de Comas</strong>
              <div style="font-size: 12px; color: var(--text-muted);">Sedes: La Libertad, Año Nuevo, Collique</div>
            </div>
            <span class="badge badge-green">${stats.comasCount} Beneficiarios (${pctComas}%)</span>
          </div>
          <div style="height: 6px; width: 100%; background: var(--surface-3); border-radius: 999px; overflow: hidden;">
            <div style="height: 100%; width: ${pctComas}%; background: var(--gt-green); border-radius: 999px; transition: width 0.4s ease;"></div>
          </div>
        </div>

        <div style="padding: 12px 16px; border-radius: var(--radius-md); background: var(--surface-2); border: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <strong>Distrito de Carabayllo</strong>
              <div style="font-size: 12px; color: var(--text-muted);">Sedes: El Progreso, San Pedro</div>
            </div>
            <span class="badge badge-blue">${stats.carabaylloCount} Beneficiarios (${pctCarabayllo}%)</span>
          </div>
          <div style="height: 6px; width: 100%; background: var(--surface-3); border-radius: 999px; overflow: hidden;">
            <div style="height: 100%; width: ${pctCarabayllo}%; background: var(--gt-blue, #0d9488); border-radius: 999px; transition: width 0.4s ease;"></div>
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
    const tbody = document.getElementById("tbodyAuditLogs");
    const mobileContainer = document.getElementById("mobileCardsAuditoria");

    if (tbody) {
      tbody.innerHTML = logs.map(l => `
        <tr>
          <td style="font-family:var(--mono-font); font-size:12px; color:var(--text-dim);">${l.timestamp}</td>
          <td><strong>${l.user}</strong><div style="font-size:11px; color:var(--text-muted);">${l.role}</div></td>
          <td><span class="badge badge-blue">${l.action}</span></td>
          <td><code style="font-family:var(--mono-font);">${l.entity}</code></td>
          <td style="font-size:12px;">${l.detail}</td>
          <td><span class="badge badge-green">${l.status}</span></td>
        </tr>
      `).join("");
    }

    if (mobileContainer) {
      mobileContainer.innerHTML = logs.map((l, index) => `
        <div class="mobile-card-item" id="mobile-audit-${index}">
          <!-- Cabecera: ID (Timestamp) + Badge Estado -->
          <div class="datacard-header">
            <div class="datacard-id">
              <span>REG:</span> ${l.timestamp}
            </div>
            <div class="datacard-header-right">
              <span class="badge badge-green">${l.status}</span>
            </div>
          </div>

          <!-- Cuerpo: Datos principales siempre visibles -->
          <div class="datacard-body">
            <div class="datacard-row">
              <span class="datacard-label">Acción Registrada</span>
              <span class="datacard-value"><span class="badge badge-blue">${l.action}</span></span>
            </div>
            <div class="datacard-row">
              <span class="datacard-label">Entidad Afectada</span>
              <span class="datacard-value" style="color:var(--gt-green); font-weight:700;">${l.entity}</span>
            </div>

            <!-- Bloque Desplegable "Ver más" -->
            <div class="datacard-extra" id="extra-audit-${index}">
              <div class="datacard-row">
                <span class="datacard-label">Usuario Responsable</span>
                <span class="datacard-value">${l.user}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Perfil / Rol</span>
                <span class="datacard-value">${l.role}</span>
              </div>
              <div class="datacard-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
                <span class="datacard-label">Detalle de la Operación</span>
                <span class="datacard-value" style="text-align:left; font-size:12.5px; font-weight:500; color:var(--text-muted);">${l.detail}</span>
              </div>
            </div>

            <!-- Botón Ver más / Ver menos -->
            <button type="button" class="datacard-toggle-btn" id="btnToggleAudit-${index}" onclick="window.PDI ? window.PDI.DashboardView.toggleAuditCard(${index}) : DashboardView.toggleAuditCard(${index})">
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
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}
