
// Vista: Modales (Registro Nuevo Menor, Informe Ejecutivo, Detalle de Auditoria)
// El expediente integral ya no esta aqui: es una pagina propia, expediente.html,
// con su vista en ExpedienteView. Se decidio al convertir la SPA en MPA que un
// documento que se imprime, se comparte y se navega por URL no puede vivir
// dentro de una ventana encima de otra pagina.
export const ModalView = {
  openNuevoMenor() {
    const modal = document.getElementById("modalNuevoMenor");
    if (modal) {
      modal.classList.add("open");
      setTimeout(() => {
        const ctrl = window.PDI?.BeneficiarioController || (window.app && window.app.beneficiarioController);
        if (ctrl && ctrl.initSignature) ctrl.initSignature();
      }, 100);
    }
  },

  closeNuevoMenor() {
    const modal = document.getElementById("modalNuevoMenor");
    if (modal) modal.classList.remove("open");
  },

  openInforme(stats, activeRole) {
    const fecha = new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
    const fechaEl = document.getElementById("informeFecha");
    if (fechaEl) fechaEl.textContent = fecha;

    const opEl = document.getElementById("informeOperador");
    if (opEl) opEl.textContent = `${activeRole.title} (${activeRole.desc.split(' ')[0]})`;

    const totalEl = document.getElementById("infTotalMenores");
    if (totalEl) totalEl.textContent = stats.total;

    const normEl = document.getElementById("infNormales");
    if (normEl) normEl.textContent = `${stats.normales} (${stats.pctNormal}%)`;

    const anEl = document.getElementById("infAnemia");
    if (anEl) anEl.textContent = `${stats.leves + stats.moderadas} (${stats.pctLeve + stats.pctMod}%)`;

    const modal = document.getElementById("modalInformeEjecutivo") || document.getElementById("modalInforme");
    if (modal) modal.classList.add("open");
  },

  closeInforme() {
    const modal = document.getElementById("modalInformeEjecutivo") || document.getElementById("modalInforme");
    if (modal) modal.classList.remove("open");
  },

  openAuditDetail(log) {
    if (!log) return;
    const modal = document.getElementById("modalAuditDetail");
    if (!modal) return;

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl("auditDetailId", log.id || "LOG-2026-REG");
    setEl("auditDetailTimestamp", log.timestamp);
    setEl("auditDetailUser", log.user);
    setEl("auditDetailRole", log.role);
    setEl("auditDetailAction", log.action);
    setEl("auditDetailStatus", log.status);
    setEl("auditDetailIp", log.ip || "192.168.1.x (Red Segura)");
    setEl("auditDetailSede", log.sede || "Central");
    setEl("auditDetailDetail", log.detail);

    const entityContainer = document.getElementById("auditDetailEntityLink");
    if (entityContainer) {
      if (log.entity && log.entity.startsWith("PDI-")) {
        entityContainer.innerHTML = `
          <a href="javascript:void(0)" onclick="window.openExpedienteByCodigo('${log.entity}')" class="audit-entity-link" title="Abrir expediente del menor">
            <code style="font-family:var(--mono-font); font-size:13px; font-weight:700; color:var(--gt-green); text-decoration:underline;">${log.entity}</code>
            <span style="font-size:11px; margin-left:4px; color:var(--gt-green); font-weight:600;">(Ver Expediente &rarr;)</span>
          </a>
        `;
      } else {
        entityContainer.innerHTML = `<code style="font-family:var(--mono-font); font-size:13px; font-weight:700; color:var(--text-main);">${log.entity || 'N/A'}</code>`;
      }
    }

    // Render diff table
    const diffContainer = document.getElementById("auditDetailDiffContainer");
    if (diffContainer) {
      if (log.diff && log.diff.length > 0) {
        diffContainer.innerHTML = `
          <table class="audit-diff-table">
            <thead>
              <tr>
                <th>Campo Modificado</th>
                <th>Estado Anterior</th>
                <th>Nuevo Valor Asignado</th>
              </tr>
            </thead>
            <tbody>
              ${log.diff.map(d => `
                <tr>
                  <td><strong>${d.campo}</strong></td>
                  <td class="diff-prev"><span>${d.valorAnterior || '-'}</span></td>
                  <td class="diff-curr"><span>${d.valorNuevo || '-'}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } else {
        diffContainer.innerHTML = `
          <div style="padding:14px; background:var(--surface-2); border-radius:var(--radius-sm); border:1px solid var(--border-subtle); color:var(--text-dim); font-size:12.5px;">
            Este evento registra una operación de consulta o certificación sin alteración de campos individuales.
          </div>
        `;
      }
    }

    modal.classList.add("open");
  },

  closeAuditDetail() {
    const modal = document.getElementById("modalAuditDetail");
    if (modal) modal.classList.remove("open");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ModalView = ModalView;
}
