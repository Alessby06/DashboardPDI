// Vista: Padrón de Menores Beneficiarios
export const BeneficiariosView = {
  renderTable(beneficiarios) {
    const tbody = document.getElementById("tbodyBeneficiarios");
    if (!tbody) return;

    const badgeTotal = document.getElementById("badgeTotalBeneficiarios");
    if (badgeTotal) badgeTotal.textContent = beneficiarios.length;

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
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.BeneficiariosView = BeneficiariosView;
}
