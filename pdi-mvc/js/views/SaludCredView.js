// Vista: Módulo de Salud y Nutrición CRED
export const SaludCredView = {
  renderTable(beneficiarios) {
    const tbody = document.getElementById("tbodySaludCred");
    if (!tbody) return;

    tbody.innerHTML = beneficiarios.map(b => {
      let badgeClass = "badge-green";
      if (b.anemia === "Leve") badgeClass = "badge-yellow";
      if (b.anemia === "Moderada" || b.anemia === "Severa") badgeClass = "badge-red";

      return `
        <tr>
          <td><strong>${b.nombres} ${b.apellidos}</strong><div style="font-size:11.5px; color:var(--text-dim);">${b.codigo}</div></td>
          <td>${b.edad}</td>
          <td>${b.peso} kg / ${b.talla} cm</td>
          <td><strong style="font-family:var(--mono-font);">${b.hb} g/dL</strong></td>
          <td><span class="badge ${badgeClass}">${b.anemia}</span></td>
          <td>${b.anemia !== "Normal" ? "Sulfato Ferroso 1 dosis/día" : "Dieta Preventiva"}</td>
          <td><button type="button" class="btn-action" onclick="window.app.beneficiarioController.openExpediente(${b.id})">Detalle</button></td>
        </tr>
      `;
    }).join("");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SaludCredView = SaludCredView;
}
