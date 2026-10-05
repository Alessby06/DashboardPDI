// Vista: Tablero Kanban de Casos Sociales (ASP), Filtros y Ficha Detallada
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { AnimationEngine } from '../utils/AnimationEngine.js';
import { crear as crearFiltros } from '../utils/Filters.js';

import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";;
// Filtros del tablero que viajan en la URL. Los valores son los de los
// desplegables de social.html.
const FILTROS_SOCIAL = {
  q:        { valor: "" },
  urgencia: { valor: "all", valores: ["all", "Alta", "Media", "Baja"] },
  sede:     { valor: "all", valores: ["all", "El Progreso", "San Pedro", "Año Nuevo", "Santa Rosa", "Los Bendecidos", "La Libertad"] },
  // En movil el tablero muestra una etapa por vez. Tambien es estado de vista,
  // asi que va en la URL: compartir un enlace debe mostrar la misma columna.
  etapa:    { valor: "pendiente", valores: ["pendiente", "evaluacion", "canalizado", "cerrado"] },
};

export const SocialKanbanView = {
  _searchQuery: "",
  _filterUrgencia: "all",
  _filterSede: "all",
  _activeCaso: null,
  _mobileActiveStage: "pendiente",

  _filtros: null,
  _filtrosLeidos: false,

  _obtenerFiltros() {
    if (!this._filtros) {
      this._filtros = crearFiltros(FILTROS_SOCIAL);
    }
    return this._filtros;
  },

  _persistirFiltros(extra) {
    this._obtenerFiltros().escribir({
      q: this._searchQuery,
      urgencia: this._filterUrgencia,
      sede: this._filterSede,
      etapa: this._mobileActiveStage,
      ...(extra || {}),
    });
  },

  _leerFiltrosDeURL() {
    if (this._filtrosLeidos) return;
    this._filtrosLeidos = true;

    const f = this._obtenerFiltros().leer();
    this._searchQuery = f.q;
    this._filterUrgencia = f.urgencia;
    this._filterSede = f.sede;
    this._mobileActiveStage = f.etapa;

    const input = document.getElementById("inputSearchCasosSociales");
    if (input) input.value = f.q;

    this._updateUrgenciaUI();
    this._updateSedeUI();

    // El HTML trae data-mobile-active-stage="pendiente" fijo. Sin esto, un
    // enlace con ?etapa=evaluacion mostraria el tablero de alerta en movil
    // mientras el selector dice "Evaluacion".
    const board = document.getElementById("kanbanCasosSociales");
    if (board) board.setAttribute("data-mobile-active-stage", f.etapa);
  },

  init() {
    this.renderKanban();
  },

  renderKanban(casos) {
    this._leerFiltrosDeURL();

    const pCol = document.getElementById("kanbanColPendientes");
    const eCol = document.getElementById("kanbanColEvaluacion");
    const cCol = document.getElementById("kanbanColCanalizados");
    const zCol = document.getElementById("kanbanColCerrados");

    if (!pCol || !eCol || !cCol || !zCol) return;

    pCol.innerHTML = "";
    eCol.innerHTML = "";
    cCol.innerHTML = "";
    zCol.innerHTML = "";

    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const allCasos = casos || (model.getAll ? model.getAll() : []);

    // Aplicar filtros de búsqueda, urgencia y sede
    const filtered = allCasos.filter(c => {
      const q = this._searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (c.menor && c.menor.toLowerCase().includes(q)) ||
        (c.codigo && c.codigo.toLowerCase().includes(q)) ||
        (c.sede && c.sede.toLowerCase().includes(q)) ||
        (c.situacionEncontrada && c.situacionEncontrada.toLowerCase().includes(q)) ||
        (c.tipoProblematica && c.tipoProblematica.toLowerCase().includes(q));

      const matchUrgencia = (this._filterUrgencia === "all") || (c.urgencia === this._filterUrgencia);
      const matchSede = (this._filterSede === "all") || (c.sede && c.sede.includes(this._filterSede));

      return matchQuery && matchUrgencia && matchSede;
    });

    let countP = 0;
    let countE = 0;
    let countC = 0;
    let countZ = 0;

    filtered.forEach(c => {
      const card = document.createElement("div");
      card.className = "kanban-card";
      card.setAttribute("onclick", `window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.openDetalleCaso(${c.id}) : null`);
      card.title = "Haz clic para ver la ficha completa del caso";

      let actionsHtml = "";
      if (c.etapa === "pendiente") {
        countP++;
        actionsHtml = `
          <div class="kanban-actions-row">
            <button type="button" class="kanban-btn primary full-width"
              onclick="event.stopPropagation(); window.PDI?.SocialController ? window.PDI.SocialController.moverCaso(${escaparEnManejador(c.id)}, 'evaluacion') : (window.app?.socialController?.moverCaso(${escaparEnManejador(c.id)}, 'evaluacion'))">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span>Iniciar Evaluación</span>
            </button>
          </div>
        `;
      } else if (c.etapa === "evaluacion") {
        countE++;
        actionsHtml = `
          <div class="kanban-actions-row">
            <button type="button" class="kanban-btn secondary flex-1"
              onclick="event.stopPropagation(); window.PDI?.SocialController ? window.PDI.SocialController.moverCaso(${escaparEnManejador(c.id)}, 'pendiente') : (window.app?.socialController?.moverCaso(${escaparEnManejador(c.id)}, 'pendiente'))">
              <svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Alerta</span>
            </button>
            <button type="button" class="kanban-btn primary flex-1"
              onclick="event.stopPropagation(); window.PDI?.SocialController ? window.PDI.SocialController.moverCaso(${escaparEnManejador(c.id)}, 'canalizado') : (window.app?.socialController?.moverCaso(${escaparEnManejador(c.id)}, 'canalizado'))">
              <svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              <span>Canalizar</span>
            </button>
          </div>
        `;
      } else if (c.etapa === "canalizado") {
        countC++;
        actionsHtml = `
          <div class="kanban-actions-row">
            <button type="button" class="kanban-btn secondary flex-1"
              onclick="event.stopPropagation(); window.PDI?.SocialController ? window.PDI.SocialController.moverCaso(${escaparEnManejador(c.id)}, 'evaluacion') : (window.app?.socialController?.moverCaso(${escaparEnManejador(c.id)}, 'evaluacion'))">
              <svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Evaluar</span>
            </button>
            <button type="button" class="kanban-btn success flex-1"
              onclick="event.stopPropagation(); window.PDI?.SocialController ? window.PDI.SocialController.moverCaso(${escaparEnManejador(c.id)}, 'cerrado') : (window.app?.socialController?.moverCaso(${escaparEnManejador(c.id)}, 'cerrado'))">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>Cerrar</span>
            </button>
          </div>
        `;
      } else if (c.etapa === "cerrado") {
        countZ++;
        actionsHtml = `
          <div class="kanban-actions-row">
            <button type="button" class="kanban-btn warning full-width"
              onclick="event.stopPropagation(); window.PDI?.SocialController ? window.PDI.SocialController.moverCaso(${escaparEnManejador(c.id)}, 'canalizado') : (window.app?.socialController?.moverCaso(${escaparEnManejador(c.id)}, 'canalizado'))">
              <svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span>Reabrir Caso</span>
            </button>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="kanban-card-header-row">
          <strong class="kanban-card-title">${escapar(c.menor)}</strong>
          <span class="badge badge-${c.urgencia === 'Alta' ? 'red' : (c.urgencia === 'Media' ? 'yellow' : 'blue')}" style="font-size:10.5px; padding:2px 7px;">${escapar(c.urgencia)}</span>
        </div>
        <div class="kanban-card-meta">
          <a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo('${escaparEnManejador(c.codigo)}')" style="font-size:11.5px; font-family:var(--mono-font); color:var(--text-brand); font-weight:700; text-decoration:underline;" title="Abrir expediente">
            ${escapar(c.codigo)}
          </a>
          <span style="font-size:11.5px; color:var(--text-dim);">${escapar(c.sede)}</span>
        </div>
        <div class="kanban-card-desc">
          <strong style="color:var(--text-main);">Situación:</strong> ${escapar(c.situacionEncontrada || c.detalle)}
        </div>
        <div class="kanban-card-footer">
          <span>Deriva: <strong>${escapar(c.quienDeriva ? c.quienDeriva.nombre.split(' ')[0] + ' ' + (c.quienDeriva.nombre.split(' ')[1] || '') : 'PDI')}</strong></span>
          <span style="font-family:var(--mono-font);">${escapar(c.fechaDerivacion)}</span>
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

    // Actualizar contadores en selector móvil
    setBadge("mobileStageCountPendientes", countP);
    setBadge("mobileStageCountEvaluacion", countE);
    setBadge("mobileStageCountCanalizados", countC);
    setBadge("mobileStageCountCerrados", countZ);
    this._syncMobileStageSelector();

    // Las tarjetas entran en cascada al repintar el tablero. Al buscar o filtrar,
    // el tablero se rehace entero: sin esta entrada, el cambio de contenido hay
    // que deducirlo comparando de memoria con lo que habia un segundo antes.
    for (const col of [pCol, eCol, cCol, zCol]) {
      AnimationEngine.entradaEscalonada(col, ":scope > .kanban-card", { paso: 24, maxDesfase: 8 });
    }

    // Actualizar barra de chips y badge de filtros
    this._updateFilterChips();

    // Un solo punto de escritura para los cuatro filtros: handleSearch(),
    // filterByUrgencia(), filterBySede() y clearFilters() terminan todos aqui,
    // y en cuanto cambian un filtro lo unico que hacen falta es repintar.
    this._persistirFiltros({ q: this._searchQuery });
  },

  handleSearch(query) {
    this._searchQuery = query || "";
    this.renderKanban();
  },

  filterByUrgencia(urgencia) {
    this._filterUrgencia = urgencia;
    this._updateUrgenciaUI();
    this.renderKanban();
  },

  _updateUrgenciaUI() {
    const label = document.getElementById("labelSocialUrgenciaSelect");
    if (label) {
      label.textContent = (this._filterUrgencia === 'all') ? "Todas las Urgencias" : this._filterUrgencia;
    }

    const items = document.querySelectorAll("#menuSocialUrgencia .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterUrgencia);
    });
  },

  filterBySede(sede) {
    this._filterSede = sede;
    this._updateSedeUI();
    this.renderKanban();
  },

  _updateSedeUI() {
    const label = document.getElementById("labelSocialSedeSelect");
    if (label) {
      label.textContent = (this._filterSede === 'all') ? "Todas las Sedes" : this._filterSede;
    }

    const items = document.querySelectorAll("#menuSocialSede .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterSede);
    });
  },

  clearFilters() {
    this._searchQuery = "";
    this._filterUrgencia = "all";
    this._filterSede = "all";

    const searchInput = document.getElementById("inputSearchCasosSociales");
    if (searchInput) searchInput.value = "";

    this._updateUrgenciaUI();
    this._updateSedeUI();

    this.renderKanban();
  },

  _updateFilterChips() {
    const chipsBar = document.getElementById("socialActiveChipsBar");
    const chipsList = document.getElementById("socialActiveChipsList");
    const countBadge = document.getElementById("socialActiveFiltersCount");

    let activeCount = 0;
    const chips = [];

    if (this._filterUrgencia !== "all") {
      activeCount++;
      chips.push({
        label: `Urgencia: ${this._filterUrgencia}`,
        clear: () => this.filterByUrgencia("all")
      });
    }

    if (this._filterSede !== "all") {
      activeCount++;
      chips.push({
        label: `Sede: ${this._filterSede}`,
        clear: () => this.filterBySede("all")
      });
    }

    if (countBadge) {
      if (activeCount > 0) {
        countBadge.textContent = activeCount;
        countBadge.style.display = "inline-flex";
      } else {
        countBadge.style.display = "none";
      }
    }

    if (!chipsBar || !chipsList) return;

    if (chips.length > 0) {
      chipsBar.style.display = "flex";
      chipsList.innerHTML = "";
      chips.forEach(chip => {
        const chipEl = document.createElement("span");
        chipEl.className = "padron-filter-chip";
        chipEl.innerHTML = `
          <span>${escapar(chip.label)}</span>
          <button type="button" class="padron-chip-remove" title="Quitar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        `;
        chipEl.querySelector(".padron-chip-remove").onclick = chip.clear;
        chipsList.appendChild(chipEl);
      });
    } else {
      chipsBar.style.display = "none";
      chipsList.innerHTML = "";
    }
  },

  toggleSimulador() {
    const card = document.getElementById("cardSimuladorVulnerabilidad");
    const body = document.getElementById("simuladorSocioBody");
    if (!card || !body) return;

    const isOpen = card.classList.contains("open");
    if (isOpen) {
      card.classList.remove("open");
      body.style.display = "none";
    } else {
      card.classList.add("open");
      body.style.display = "block";
    }
  },

  openDetalleCaso(id) {
    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const all = model.getAll ? model.getAll() : [];
    const caso = all.find(c => c.id === Number(id));
    if (!caso) return;

    this._activeCaso = caso;

    const setTxt = (elId, val) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = val || "-";
    };

    setTxt("modalCasoMenorNombre", caso.menor);
    setTxt("modalCasoCodigo", caso.codigo);
    setTxt("modalCasoSede", caso.sede);
    setTxt("modalCasoProblematica", caso.tipoProblematica || "Evaluación Social General");
    setTxt("modalCasoSituacion", caso.situacionEncontrada || caso.detalle);
    setTxt("modalCasoFecha", caso.fechaDerivacion);
    setTxt("modalCasoVulnerabilidadScore", `${caso.vulnerabilidadPuntaje || 75} / 100`);

    if (caso.quienDeriva) {
      setTxt("modalCasoDerivadorNombre", caso.quienDeriva.nombre);
      setTxt("modalCasoDerivadorCargo", caso.quienDeriva.cargo || "Equipo PDI");
      setTxt("modalCasoDerivadorTel", `Tel: ${caso.quienDeriva.telefono || 'Sin teléfono'}`);
    } else {
      setTxt("modalCasoDerivadorNombre", "Área Social Pastoral");
      setTxt("modalCasoDerivadorCargo", "Equipo PDI");
      setTxt("modalCasoDerivadorTel", "Tel: S/N");
    }

    if (caso.soporteFamiliar) {
      setTxt("modalCasoSoporteFamiliar", caso.soporteFamiliar.detalle || (caso.soporteFamiliar.tiene ? "Cuenta con soporte familiar" : "Sin red de soporte familiar"));
    } else {
      setTxt("modalCasoSoporteFamiliar", "No especificado");
    }

    setTxt("modalCasoAccionesPrevias", caso.accionesPrevias || "Sin acciones previas registradas.");

    // Badges de urgencia y etapa
    const urgBadge = document.getElementById("modalCasoUrgenciaBadge");
    if (urgBadge) {
      urgBadge.className = `badge badge-${caso.urgencia === 'Alta' ? 'red' : (caso.urgencia === 'Media' ? 'yellow' : 'blue')}`;
      urgBadge.textContent = caso.urgencia;
    }

    const etapaBadge = document.getElementById("modalCasoEtapaBadge");
    const etapaMap = {
      pendiente: { label: "Pendiente / Alerta", cls: "badge-red" },
      evaluacion: { label: "En Evaluación Social", cls: "badge-yellow" },
      canalizado: { label: "Canalizado (DEMUNA / BTF)", cls: "badge-blue" },
      cerrado: { label: "Cerrado con Informe", cls: "badge-green" }
    };
    if (etapaBadge) {
      const eInfo = etapaMap[caso.etapa] || { label: caso.etapa, cls: "badge-gray" };
      etapaBadge.className = `badge ${eInfo.cls}`;
      etapaBadge.textContent = eInfo.label;
    }

    // Dynamic actions in modal footer
    const dynamicBox = document.getElementById("modalCasoDynamicActions");
    if (dynamicBox) {
      dynamicBox.innerHTML = "";
      if (caso.etapa === "pendiente") {
        dynamicBox.innerHTML = `
          <button type="button" class="btn-action primary" onclick="window.PDI?.SocialKanbanView?.moverCasoFromModal('evaluacion')">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span>Iniciar Evaluación</span>
          </button>
        `;
      } else if (caso.etapa === "evaluacion") {
        dynamicBox.innerHTML = `
          <button type="button" class="btn-action btn-secondary" onclick="window.PDI?.SocialKanbanView?.moverCasoFromModal('pendiente')">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Regresar a Alerta</span>
          </button>
          <button type="button" class="btn-action primary" onclick="window.PDI?.SocialKanbanView?.moverCasoFromModal('canalizado')">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            <span>Canalizar Caso</span>
          </button>
        `;
      } else if (caso.etapa === "canalizado") {
        dynamicBox.innerHTML = `
          <button type="button" class="btn-action btn-secondary" onclick="window.PDI?.SocialKanbanView?.moverCasoFromModal('evaluacion')">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Regresar a Evaluación</span>
          </button>
          <button type="button" class="btn-action success" onclick="window.PDI?.SocialKanbanView?.moverCasoFromModal('cerrado')">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>Cerrar Caso con Informe</span>
          </button>
        `;
      } else if (caso.etapa === "cerrado") {
        dynamicBox.innerHTML = `
          <button type="button" class="btn-action btn-secondary" onclick="window.PDI?.SocialKanbanView?.moverCasoFromModal('canalizado')">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Reabrir Caso</span>
          </button>
        `;
      }
    }

    const modal = document.getElementById("modalDetalleCasoSocial");
    if (modal) {
      modal.classList.add("open");
    }
  },

  closeModalDetalleCaso() {
    const modal = document.getElementById("modalDetalleCasoSocial");
    if (modal) {
      modal.classList.remove("open");
    }
  },

  moverCasoFromModal(nuevaEtapa) {
    if (!this._activeCaso) return;
    const controller = window.PDI?.SocialController;
    if (controller && controller.moverCaso) {
      controller.moverCaso(this._activeCaso.id, nuevaEtapa);
    }
    this.closeModalDetalleCaso();

    // Se resalta la columna que acaba de recibir el caso. Hasta ahora, mover una
    // etapa dejaba como unico rastro que la tarjeta ya no estaba donde estaba:
    // el cambio de estado no se anunciaba en ningun sitio de la pantalla.
    AnimationEngine.destacar(
      document.querySelector(`.kanban-col[data-col-stage="${nuevaEtapa}"] .kanban-col-header`)
    );
  },

  openExpedienteFromModal() {
    if (!this._activeCaso) return;
    const codigo = this._activeCaso.codigo;
    this.closeModalDetalleCaso();
    window.openExpedienteByCodigo(codigo);
  },

  openInSimuladorFromModal() {
    if (!this._activeCaso) return;
    const codigo = this._activeCaso.codigo;
    this.closeModalDetalleCaso();

    // Abrir acordeón del simulador
    const card = document.getElementById("cardSimuladorVulnerabilidad");
    const body = document.getElementById("simuladorSocioBody");
    if (card && body) {
      card.classList.add("open");
      body.style.display = "block";
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Seleccionar menor y cargar caso
    const select = document.getElementById("selBeneficiarioSimulador");
    if (select) {
      select.value = codigo;
    }

    const controller = window.PDI?.SocialController;
    if (controller && controller.cargarCasoEnSimulador) {
      controller.cargarCasoEnSimulador(codigo);
    }
  },

  _syncMobileStageSelector() {
    const stage = this._mobileActiveStage || "pendiente";
    const stageData = {
      "pendiente": {
        label: "Alerta",
        color: "var(--gt-red)",
        badgeClass: "badge badge-red",
        countId: "kanbanCountPendientes"
      },
      "evaluacion": {
        label: "Evaluación",
        color: "var(--gt-yellow)",
        badgeClass: "badge badge-yellow",
        countId: "kanbanCountEvaluacion"
      },
      "canalizado": {
        label: "Canalizados",
        color: "var(--gt-blue)",
        badgeClass: "badge badge-blue",
        countId: "kanbanCountCanalizados"
      },
      "cerrado": {
        label: "Cerrados",
        color: "var(--gt-green)",
        badgeClass: "badge badge-green",
        countId: "kanbanCountCerrados"
      }
    };

    const current = stageData[stage] || stageData["pendiente"];
    const dot = document.getElementById("mobileSelectedStageDot");
    const label = document.getElementById("mobileSelectedStageLabel");
    const badge = document.getElementById("mobileSelectedStageBadge");

    if (dot) dot.style.background = current.color;
    if (label) label.textContent = current.label;
    if (badge) {
      const sourceCount = document.getElementById(current.countId);
      badge.textContent = sourceCount ? sourceCount.textContent : "0";
      badge.className = current.badgeClass;
    }

    const items = document.querySelectorAll("#menuSocialMobileStage .social-mobile-dropdown-item");
    items.forEach(item => {
      if (item.getAttribute("data-stage") === stage) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });
  },

  setMobileActiveStage(stage) {
    this._mobileActiveStage = stage;
    const board = document.getElementById("kanbanCasosSociales");
    if (board) {
      board.setAttribute("data-mobile-active-stage", stage);
    }

    this._syncMobileStageSelector();

    const dropdown = document.getElementById("dropdownSocialMobileStage");
    if (dropdown) {
      dropdown.classList.remove("open");
    }

    // Este metodo no repinta el tablero: cambiar de columna en movil no altera
    // los datos. Aun asi la etapa es parte de lo que se esta viendo, asi que
    // va a la URL.
    this._persistirFiltros();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialKanbanView = SocialKanbanView;
}
