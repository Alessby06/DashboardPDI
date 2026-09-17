// Vista: Acompañamiento Educativo (Casita del Saber)
export const CasitasView = {
  renderTable(beneficiarios) {
    const tbody = document.getElementById("tbodyAsistenciaCasita");
    const mobileContainer = document.getElementById("mobileCardsCasita");

    const casitaList = beneficiarios.filter(b => b.servicios.includes("Casita del Saber"));

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
              <button type="button" class="btn-asist active-P" data-asist-btn="P" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'P')">P</button>
              <button type="button" class="btn-asist" data-asist-btn="T" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'T')">T</button>
              <button type="button" class="btn-asist" data-asist-btn="FJ" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'FJ')">FJ</button>
              <button type="button" class="btn-asist" data-asist-btn="FI" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'FI')">FI</button>
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
                <button type="button" class="btn-asist active-P" data-asist-btn="P" onclick="event.stopPropagation(); window.app.casitasController.toggleAsistencia(${b.id}, 'P')">P</button>
                <button type="button" class="btn-asist" data-asist-btn="T" onclick="event.stopPropagation(); window.app.casitasController.toggleAsistencia(${b.id}, 'T')">T</button>
                <button type="button" class="btn-asist" data-asist-btn="FJ" onclick="event.stopPropagation(); window.app.casitasController.toggleAsistencia(${b.id}, 'FJ')">FJ</button>
                <button type="button" class="btn-asist" data-asist-btn="FI" onclick="event.stopPropagation(); window.app.casitasController.toggleAsistencia(${b.id}, 'FI')">FI</button>
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
}
