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
    if (!tbody) return;

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
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}
