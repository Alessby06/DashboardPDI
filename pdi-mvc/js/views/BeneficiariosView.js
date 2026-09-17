// Vista: Padrón de Menores Beneficiarios
export const BeneficiariosView = {
  renderTable(beneficiarios) {
    const tbody = document.getElementById("tbodyBeneficiarios");
    const mobileContainer = document.getElementById("mobileCardsBeneficiarios");

    const badgeTotal = document.getElementById("badgeTotalBeneficiarios");
    if (badgeTotal) badgeTotal.textContent = beneficiarios.length;

    // 1. Renderizar tabla tradicional para pantallas grandes (Desktop)
    if (tbody) {
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
          <td><span class="badge badge-green">${b.estado}</span></td>
          <td style="text-align: right;">
            <button type="button" class="btn-action" onclick="window.openExpediente ? window.openExpediente(${b.id}) : window.app.beneficiarioController.openExpediente(${b.id})">
              Ver Expediente
            </button>
          </td>
        </tr>
      `).join("");
    }

    // 2. Renderizar lista de tarjetas Data Card para teléfonos móviles (Patrón Beezlebub)
    if (mobileContainer) {
      mobileContainer.innerHTML = beneficiarios.map(b => `
        <div class="mobile-card-item" id="mobile-card-${b.id}">
          <!-- Cabecera: ID + Badge Estado -->
          <div class="datacard-header">
            <div class="datacard-id">
              <span>ID:</span> ${b.codigo}
            </div>
            <div class="datacard-header-right">
              <span class="badge badge-green">${b.estado}</span>
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
