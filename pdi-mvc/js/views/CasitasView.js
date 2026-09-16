// Vista: Acompañamiento Educativo (Casita del Saber)
export const CasitasView = {
  renderTable(beneficiarios) {
    const tbody = document.getElementById("tbodyAsistenciaCasita");
    if (!tbody) return;

    tbody.innerHTML = beneficiarios
      .filter(b => b.servicios.includes("Casita del Saber"))
      .map(b => `
        <tr>
          <td><strong>${b.nombres} ${b.apellidos}</strong><div style="font-size:11px; color:var(--text-dim);">${b.codigo}</div></td>
          <td>${b.grado}</td>
          <td>${b.colegio}</td>
          <td>${b.distrito} - Sede ${b.sede}</td>
          <td>
            <span class="badge badge-green" id="badgeAsist_${b.id}">Presente</span>
          </td>
          <td>
            <button type="button" class="btn-action" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'P')">P</button>
            <button type="button" class="btn-action" style="margin-left:4px;" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'T')">T</button>
            <button type="button" class="btn-action" style="margin-left:4px;" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'F')">F</button>
          </td>
        </tr>
      `).join("");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasView = CasitasView;
}
