// Vista: Tablero Kanban de Derivaciones ASP
export const SocialKanbanView = {
  renderKanban(casos) {
    const pCol = document.getElementById("colPendiente");
    const eCol = document.getElementById("colEvaluacion");
    const cCol = document.getElementById("colCanalizado");
    const zCol = document.getElementById("colCerrado");

    if (!pCol || !eCol || !cCol || !zCol) return;

    pCol.innerHTML = "";
    eCol.innerHTML = "";
    cCol.innerHTML = "";
    zCol.innerHTML = "";

    let countP = 0;
    casos.forEach(c => {
      const card = document.createElement("div");
      card.className = "kanban-card";

      let actionsHtml = "";
      if (c.etapa === "pendiente") {
        actionsHtml = `<button type="button" class="btn-action" style="width:100%; font-size:11px; margin-top:8px;" onclick="window.app.socialController.moverCaso(${c.id}, 'evaluacion')">Iniciar Evaluación &rarr;</button>`;
        countP++;
      } else if (c.etapa === "evaluacion") {
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action" style="flex:1; font-size:10px;" onclick="window.app.socialController.moverCaso(${c.id}, 'pendiente')">&larr; Pendiente</button>
            <button type="button" class="btn-action" style="flex:1; font-size:10px;" onclick="window.app.socialController.moverCaso(${c.id}, 'canalizado')">Canalizar &rarr;</button>
          </div>
        `;
      } else if (c.etapa === "canalizado") {
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action" style="flex:1; font-size:10px;" onclick="window.app.socialController.moverCaso(${c.id}, 'evaluacion')">&larr; Evaluar</button>
            <button type="button" class="btn-action" style="flex:1; font-size:10px;" onclick="window.app.socialController.moverCaso(${c.id}, 'cerrado')">Cerrar Caso &check;</button>
          </div>
        `;
      } else if (c.etapa === "cerrado") {
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action" style="flex:1; font-size:10px;" onclick="window.app.socialController.moverCaso(${c.id}, 'canalizado')">&larr; Reabrir</button>
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <strong style="font-size:13px;">${c.menor}</strong>
          <span class="badge badge-${c.urgencia === 'Alta' ? 'red' : (c.urgencia === 'Media' ? 'yellow' : 'blue')}">${c.urgencia}</span>
        </div>
        <div style="font-size:11px; font-family:var(--mono-font); color:var(--gt-green); margin-bottom:4px;">${c.codigo} &bull; ${c.sede}</div>
        <p style="font-size:12px; color:var(--text-muted); margin:0 0 4px 0; line-height:1.4;">${c.detalle}</p>
        ${actionsHtml}
      `;

      if (c.etapa === "pendiente") pCol.appendChild(card);
      if (c.etapa === "evaluacion") eCol.appendChild(card);
      if (c.etapa === "canalizado") cCol.appendChild(card);
      if (c.etapa === "cerrado") zCol.appendChild(card);
    });

    const badgeCriticos = document.getElementById("badgeCasosCriticos");
    if (badgeCriticos) badgeCriticos.textContent = countP;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialKanbanView = SocialKanbanView;
}
