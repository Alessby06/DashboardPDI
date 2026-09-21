// Vista: Tablero Kanban de Casos Sociales (ASP)
export const SocialKanbanView = {
  renderKanban(casos) {
    const pCol = document.getElementById("kanbanColPendientes");
    const eCol = document.getElementById("kanbanColEvaluacion");
    const cCol = document.getElementById("kanbanColCanalizados");
    const zCol = document.getElementById("kanbanColCerrados");

    if (!pCol || !eCol || !cCol || !zCol) return;

    pCol.innerHTML = "";
    eCol.innerHTML = "";
    cCol.innerHTML = "";
    zCol.innerHTML = "";

    let countP = 0;
    let countE = 0;
    let countC = 0;
    let countZ = 0;

    casos.forEach(c => {
      const card = document.createElement("div");
      card.className = "kanban-card";

      let actionsHtml = "";
      if (c.etapa === "pendiente") {
        countP++;
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action-sm primary" style="width:100%; justify-content:center; font-size:11px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'evaluacion') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'evaluacion') : null)">
              <span>Iniciar Evaluación &rarr;</span>
            </button>
          </div>
        `;
      } else if (c.etapa === "evaluacion") {
        countE++;
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action-sm" style="flex:1; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'pendiente') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'pendiente') : null)">&larr; Alerta</button>
            <button type="button" class="btn-action-sm primary" style="flex:1; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'canalizado') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'canalizado') : null)">Canalizar &rarr;</button>
          </div>
        `;
      } else if (c.etapa === "canalizado") {
        countC++;
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action-sm" style="flex:1; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'evaluacion') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'evaluacion') : null)">&larr; Evaluar</button>
            <button type="button" class="btn-action-sm success" style="flex:1; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'cerrado') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'cerrado') : null)">Cerrar &check;</button>
          </div>
        `;
      } else if (c.etapa === "cerrado") {
        countZ++;
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action-sm" style="width:100%; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'canalizado') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'canalizado') : null)">&larr; Reabrir Caso</button>
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px; margin-bottom:4px;">
          <strong style="font-size:13px; color:var(--text-main); font-weight:700;">${c.menor}</strong>
          <span class="badge badge-${c.urgencia === 'Alta' ? 'red' : (c.urgencia === 'Media' ? 'yellow' : 'blue')}" style="font-size:10px; padding:2px 6px;">${c.urgencia}</span>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <a href="javascript:void(0)" onclick="window.openExpedienteByCodigo ? window.openExpedienteByCodigo('${c.codigo}') : null" style="font-size:11.5px; font-family:var(--mono-font); color:var(--gt-green); font-weight:700; text-decoration:underline;" title="Abrir expediente">
            ${c.codigo}
          </a>
          <span style="font-size:11px; color:var(--text-dim);">${c.sede}</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); line-height:1.4; margin-bottom:6px; background:var(--surface-hover); padding:7px 9px; border-radius:5px; border:1px solid var(--border-subtle);">
          <strong style="color:var(--text-main);">Situación:</strong> ${c.situacionEncontrada || c.detalle}
        </div>
        <div style="font-size:11px; color:var(--text-dim); display:flex; justify-content:space-between; align-items:center;">
          <span>Deriva: <strong>${c.quienDeriva ? c.quienDeriva.nombre.split(' ')[0] + ' ' + (c.quienDeriva.nombre.split(' ')[1] || '') : 'PDI'}</strong></span>
          <span style="font-family:var(--mono-font);">${c.fechaDerivacion}</span>
        </div>
        ${actionsHtml}
      `;

      if (c.etapa === "pendiente") pCol.appendChild(card);
      if (c.etapa === "evaluacion") eCol.appendChild(card);
      if (c.etapa === "canalizado") cCol.appendChild(card);
      if (c.etapa === "cerrado") zCol.appendChild(card);
    });

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };
    setBadge("kanbanCountPendientes", countP);
    setBadge("kanbanCountEvaluacion", countE);
    setBadge("kanbanCountCanalizados", countC);
    setBadge("kanbanCountCerrados", countZ);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialKanbanView = SocialKanbanView;
}
