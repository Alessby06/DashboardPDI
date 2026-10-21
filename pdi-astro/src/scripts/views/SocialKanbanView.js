// Vista: Tablero Kanban de Casos Sociales (ASP), Filtros y Ficha Detallada
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { AnimationEngine } from '../utils/AnimationEngine.js';
import { crear as crearFiltros } from '../utils/Filters.js';

import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";;
import { SEDES_NOMBRES } from "../core/catalogos.js";
// Filtros del tablero que viajan en la URL. Los valores son los de los
// desplegables de social.html.
const FILTROS_SOCIAL = {
  q:        { valor: "" },
  urgencia: { valor: "all", valores: ["all", "Alta", "Media", "Baja"] },
  sede:     { valor: "all", valores: ["all", ...SEDES_NOMBRES] },
  // En movil el tablero muestra una etapa por vez. Tambien es estado de vista,
  // asi que va en la URL: compartir un enlace debe mostrar la misma columna.
  etapa:    { valor: "pendiente", valores: ["pendiente", "evaluacion", "canalizado", "cerrado"] },
};

export const ETAPA_NOMBRES_OFICIALES = {
  pendiente: "Pendientes / Alerta",
  evaluacion: "En Evaluación Social",
  canalizado: "Canalizados (DEMUNA / BTF)",
  cerrado: "Cerrados con Informe"
};

/**
 * Contador de caracteres de los cuadros de texto con tope. El cuadro tiene
 * `maxlength`, asi que el navegador recorta solo: el contador dice cuanto
 * queda, para que nadie descubra el recorte al escribir.
 */
function conectarContador(inputId, contadorId) {
  const input = document.getElementById(inputId);
  const salida = document.getElementById(contadorId);
  if (!input || !salida) return;
  const max = input.getAttribute("maxlength") || "500";
  const refrescar = () => {
    salida.textContent = `${input.value.length} / ${max}`;
  };
  input.oninput = refrescar;
  refrescar();
}

// Titulo del tab del navegador por pestana de /social, con el mismo nombre que
// la sidebar (ver activarPanelDirecto(), el punto unico de cambio de tab).
const TITULOS_TAB = {
  kanban: "Área Social Pastoral",
  autorizaciones: "Autorizaciones ASP",
  "mis-solicitudes": "Mis Solicitudes ASP",
};

export const SocialKanbanView = {
  _searchQuery: "",
  _filterUrgencia: "all",
  _filterSede: "all",
  _activeCaso: null,
  _filteredCasos: [],
  _mobileActiveStage: "pendiente",
  _haEntrado: false,
  _lastRenderSerial: "",

  reiniciarEntrada() {
    this._haEntrado = false;
    this._lastRenderSerial = "";
    this._filtrosLeidos = false;
    this._filtros = null;
  },

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

    this.actualizarBadgesPestañas();
  },

  init() {
    this.renderKanban();
  },

  renderKanban(casos, forzarAnimacion = false) {
    this._leerFiltrosDeURL();

    const pCol = document.getElementById("kanbanColPendientes");
    const eCol = document.getElementById("kanbanColEvaluacion");
    const cCol = document.getElementById("kanbanColCanalizados");
    const zCol = document.getElementById("kanbanColCerrados");

    if (!pCol || !eCol || !cCol || !zCol) return;

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

    // Se guarda el conjunto ya filtrado para que la exportacion a CSV baje
    // exactamente lo que se esta viendo y no la bandeja entera.
    this._filteredCasos = filtered;

    const esPrimeraEntrada = !this._haEntrado || forzarAnimacion;
    this._haEntrado = true;

    // Si no es primera entrada y los datos no cambiaron, evitar parpadeo y no reconstruir el DOM
    const serial = `${this._searchQuery}_${this._filterUrgencia}_${this._filterSede}_` + 
      filtered.map(c => `${c.id}_${c.etapa}_${c.urgencia}_${c.solicitudCambio ? c.solicitudCambio.estado : 'none'}`).join("|");

    if (!esPrimeraEntrada && this._lastRenderSerial === serial && (pCol.children.length > 0 || eCol.children.length > 0 || cCol.children.length > 0 || zCol.children.length > 0)) {
      return;
    }
    this._lastRenderSerial = serial;

    pCol.innerHTML = "";
    eCol.innerHTML = "";
    cCol.innerHTML = "";
    zCol.innerHTML = "";

    let countP = 0;
    let countE = 0;
    let countC = 0;
    let countZ = 0;

    filtered.forEach(c => {
      const card = document.createElement("div");
      card.className = "kanban-card";
      const tieneSolicitud = !!(c.solicitudCambio && c.solicitudCambio.estado === "pendiente");
      if (tieneSolicitud) {
        card.classList.add("en-proceso-autorizacion");
      }
      card.setAttribute("data-urgencia", c.urgencia || "Media");
      card.setAttribute("onclick", `window.PDI?.SocialKanbanView ? window.PDI.SocialKanbanView.openDetalleCaso(${c.id}) : null`);
      card.title = tieneSolicitud ? "Solicitud en proceso de revisión por Coordinación. Clic para ver detalles." : "Haz clic para ver la ficha completa del caso";

      let actionsHtml = "";
      if (c.etapa === "pendiente") countP++;
      else if (c.etapa === "evaluacion") countE++;
      else if (c.etapa === "canalizado") countC++;
      else if (c.etapa === "cerrado") countZ++;

      if (tieneSolicitud) {
        const destEtapaNombre = ETAPA_NOMBRES_OFICIALES[c.solicitudCambio.etapaDestino] || c.solicitudCambio.etapaDestino;

        actionsHtml = `
          <div class="kanban-card-pending-notice" title="En espera de aprobación de Coordinación">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>En proceso de autorización → ${escapar(destEtapaNombre)}</span>
          </div>
        `;
      } else if (c.etapa === "pendiente") {
        actionsHtml = `
          <div class="kanban-actions-row">
            <button type="button" class="kanban-btn primary full-width"
              onclick="event.stopPropagation(); window.PDI?.SocialController ? window.PDI.SocialController.moverCaso(${escaparEnManejador(c.id)}, 'evaluacion') : (window.app?.socialController?.moverCaso(${escaparEnManejador(c.id)}, 'evaluacion'))">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span>Iniciar Evaluación</span>
            </button>
          </div>
        `;
      } else if (c.etapa === "evaluacion") {
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
          <strong class="kanban-card-title" title="${escapar(c.menor)}">${escapar(c.menor)}</strong>
          <span class="badge badge-${c.urgencia === 'Alta' ? 'red' : (c.urgencia === 'Media' ? 'yellow' : 'blue')}"><span class="badge-dot"></span>${escapar(c.urgencia)}</span>
        </div>
        <div class="kanban-card-meta">
          <a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo('${escaparEnManejador(c.codigo)}')" class="kanban-card-code-link" title="Abrir expediente">
            ${escapar(c.codigo)}
          </a>
          <span class="kanban-card-sede-badge" title="${escapar(c.sede)}">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
            <span>${escapar(c.sede)}</span>
          </span>
        </div>
        <div class="kanban-card-desc">
          ${escapar(c.situacionEncontrada || c.detalle)}
        </div>
        <div class="kanban-card-footer">
          <span>Deriva: <strong>${escapar(c.quienDeriva ? c.quienDeriva.nombre.split(' ')[0] + ' ' + (c.quienDeriva.nombre.split(' ')[1] || '') : 'PDI')}</strong></span>
          <span class="kanban-card-date">${escapar(c.fechaDerivacion)}</span>
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

    // Actualizar contadores en selector de pastillas móvil
    setBadge("mobileSegCountPendientes", countP);
    setBadge("mobileSegCountEvaluacion", countE);
    setBadge("mobileSegCountCanalizados", countC);
    setBadge("mobileSegCountCerrados", countZ);
    this._syncMobileStageSelector();

    // Las tarjetas entran en cascada solo al montar por primera vez o al interactuar con filtros
    if (esPrimeraEntrada) {
      for (const col of [pCol, eCol, cCol, zCol]) {
        AnimationEngine.entradaEscalonada(col, ":scope > .kanban-card", { paso: 24, maxDesfase: 8 });
      }
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
    this.renderKanban(null, true);
  },

  filterByUrgencia(urgencia) {
    this._filterUrgencia = urgencia;
    this._updateUrgenciaUI();
    document.getElementById("dropdownSocialUrgencia")?.classList.remove("open");
    this.renderKanban(null, true);
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
    document.getElementById("dropdownSocialSede")?.classList.remove("open");
    this.renderKanban(null, true);
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

    document.querySelectorAll("#menuSocialFilterPanel .padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this._updateUrgenciaUI();
    this._updateSedeUI();

    this.renderKanban(null, true);
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
        chipEl.className = "padron-chip";
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
    const tieneSolicitud = !!(caso.solicitudCambio && caso.solicitudCambio.estado === "pendiente");

    // Sección de Autorización de Coordinación en Detalle
    const secAut = document.getElementById("modalCasoSeccionAutorizacion");
    const badgeAut = document.getElementById("modalCasoBadgeAutorizacion");
    const detSol = document.getElementById("modalCasoDetalleSolicitudActiva");
    const listSol = document.getElementById("modalCasoHistorialSolicitudesLista");

    if (secAut) {
      if (tieneSolicitud || (Array.isArray(caso.historialSolicitudes) && caso.historialSolicitudes.length > 0)) {
        secAut.style.display = "block";
        if (tieneSolicitud) {
          if (badgeAut) {
            badgeAut.className = "badge badge-yellow";
            badgeAut.textContent = "Pendiente de Autorización";
          }
          if (detSol) {
            detSol.style.display = "block";
            detSol.innerHTML = `
              <div style="font-weight: 700; color: #fbbf24; margin-bottom: 3px;">
                Solicitud en curso: ${caso.solicitudCambio.etapaOrigen.toUpperCase()} → ${caso.solicitudCambio.etapaDestino.toUpperCase()}
              </div>
              <div><strong>Motivo:</strong> ${escapar(caso.solicitudCambio.motivo)}</div>
              <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">
                Enviada por ${escapar(caso.solicitudCambio.solicitadoPor)} (${escapar(caso.solicitudCambio.cargoSolicitante)}) el ${escapar(caso.solicitudCambio.fechaSolicitud)}
              </div>
            `;
          }
        } else {
          if (badgeAut) {
            badgeAut.className = "badge badge-gray";
            badgeAut.textContent = "Sin solicitudes activas";
          }
          if (detSol) detSol.style.display = "none";
        }

        if (listSol && Array.isArray(caso.historialSolicitudes) && caso.historialSolicitudes.length > 0) {
          listSol.innerHTML = `
            <div style="font-weight: 600; color: var(--text-dim); margin-top: 4px;">Bitácora de Solicitudes y Respuestas:</div>
            ${caso.historialSolicitudes.map(h => `
              <div style="padding: 6px 8px; background: var(--surface-2); border-radius: 4px; border: 1px solid var(--border-subtle);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: ${h.evento === 'aprobada' ? 'var(--gt-green)' : (h.evento === 'rechazada' ? '#f87171' : '#fbbf24')};">
                    ${h.evento === 'aprobada' ? 'Aprobada por Coordinación' : (h.evento === 'rechazada' ? 'Rechazada por Coordinación' : 'Solicitud Enviada')}
                  </strong>
                  <span style="font-family: var(--mono-font); font-size: 10px;">${escapar(h.fecha)}</span>
                </div>
                <div style="margin-top: 2px;">
                  ${h.comentario ? `<strong>Respuesta:</strong> ${escapar(h.comentario)}` : `<strong>Motivo:</strong> ${escapar(h.motivo || '')}`}
                </div>
              </div>
            `).join("")}
          `;
        } else if (listSol) {
          listSol.innerHTML = "";
        }
      } else {
        secAut.style.display = "none";
      }
    }

    if (dynamicBox) {
      dynamicBox.innerHTML = "";
      if (tieneSolicitud) {
        dynamicBox.innerHTML = `
          <button type="button" class="btn-action warning" onclick="window.PDI?.SocialKanbanView?.abrirModalResolverSolicitud(${caso.id})">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
            <span>Gestionar Autorización (Coordinación)</span>
          </button>
        `;
      } else if (caso.etapa === "pendiente") {
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
    const casoId = this._activeCaso.id;
    this.closeModalDetalleCaso();
    this.abrirModalSolicitarCambio(casoId, nuevaEtapa);
  },

  /**
   * Abre modal para que el operador justifique la solicitud de cambio de fase hacia Coordinación.
   */
  abrirModalSolicitarCambio(id, nuevaEtapa) {
    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const caso = model.getAll().find(c => String(c.id) === String(id) || c.id === Number(id));
    if (!caso) return;

    const modal = document.getElementById("modalSolicitarCambioEtapa");
    if (!modal) {
      // Fallback si no está el modal en el DOM
      const controller = window.PDI?.SocialController;
      if (controller) controller.solicitarCambio(id, nuevaEtapa, "Solicitud directa de pase de fase");
      return;
    }

    const setTxt = (elId, val) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = val || "";
    };

    const cId = document.getElementById("solicitudCasoId");
    const nEt = document.getElementById("solicitudNuevaEtapa");
    const mot = document.getElementById("solicitudMotivoInput");

    if (cId) cId.value = caso.id;
    if (nEt) nEt.value = nuevaEtapa;
    if (mot) mot.value = "";

    setTxt("solicitudMenorNombre", caso.menor);
    setTxt("solicitudCodigo", caso.codigo);

    const etapaNombres = {
      pendiente: "Pendiente / Alerta",
      evaluacion: "Evaluación Social",
      canalizado: "Canalizado",
      cerrado: "Cerrado con Informe"
    };

    const bOrigen = document.getElementById("solicitudEtapaOrigenBadge");
    const bDest = document.getElementById("solicitudEtapaDestinoBadge");

    if (bOrigen) bOrigen.textContent = etapaNombres[caso.etapa] || caso.etapa;
    if (bDest) bDest.textContent = etapaNombres[nuevaEtapa] || nuevaEtapa;

    modal.classList.add("open");
    conectarContador("solicitudMotivoInput", "solicitudMotivoContador");
    if (mot) mot.focus();
  },

  cerrarModalSolicitarCambio() {
    const modal = document.getElementById("modalSolicitarCambioEtapa");
    if (modal) modal.classList.remove("open");
  },

  confirmarSolicitudCambio() {
    const cId = document.getElementById("solicitudCasoId")?.value;
    const nEt = document.getElementById("solicitudNuevaEtapa")?.value;
    const mot = document.getElementById("solicitudMotivoInput")?.value || "";

    if (!cId || !nEt) return;

    const controller = window.PDI?.SocialController;
    if (controller && controller.solicitarCambio) {
      controller.solicitarCambio(cId, nEt, mot);
    }

    this.cerrarModalSolicitarCambio();
  },

  /**
   * Abre modal para que Coordinación apruebe o rechace la solicitud con comentarios.
   */
  abrirModalResolverSolicitud(id) {
    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const caso = model.getAll().find(c => String(c.id) === String(id) || c.id === Number(id));
    if (!caso || !caso.solicitudCambio) return;

    this.closeModalDetalleCaso();

    const modal = document.getElementById("modalResolverSolicitudCambio");
    if (!modal) return;

    const setTxt = (elId, val) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = val || "";
    };

    const rId = document.getElementById("resolverCasoId");
    const com = document.getElementById("resolverComentarioInput");

    if (rId) rId.value = caso.id;
    if (com) com.value = "";

    setTxt("resolverMenorNombre", caso.menor);
    setTxt("resolverCodigoBadge", caso.codigo);
    setTxt("resolverSolicitante", caso.solicitudCambio.solicitadoPor);
    setTxt("resolverFechaSolicitud", caso.solicitudCambio.fechaSolicitud);
    setTxt("resolverMotivoTexto", caso.solicitudCambio.motivo);

    const etapaNombres = {
      pendiente: "Pendiente / Alerta",
      evaluacion: "Evaluación Social",
      canalizado: "Canalizado",
      cerrado: "Cerrado con Informe"
    };

    const bOrigen = document.getElementById("resolverEtapaOrigenBadge");
    const bDest = document.getElementById("resolverEtapaDestinoBadge");

    if (bOrigen) bOrigen.textContent = etapaNombres[caso.solicitudCambio.etapaOrigen] || caso.solicitudCambio.etapaOrigen;
    if (bDest) bDest.textContent = etapaNombres[caso.solicitudCambio.etapaDestino] || caso.solicitudCambio.etapaDestino;

    modal.classList.add("open");
    conectarContador("resolverComentarioInput", "resolverComentarioContador");
    if (com) com.focus();
  },

  cerrarModalResolverSolicitud() {
    const modal = document.getElementById("modalResolverSolicitudCambio");
    if (modal) modal.classList.remove("open");
  },

  ejecutarResolucion(decision) {
    const rId = document.getElementById("resolverCasoId")?.value;
    const com = document.getElementById("resolverComentarioInput")?.value || "";

    if (!rId) return;

    const controller = window.PDI?.SocialController;
    if (controller && controller.resolverSolicitud) {
      controller.resolverSolicitud(rId, decision, com);
    }

    this.cerrarModalResolverSolicitud();
    this.renderVistaAutorizaciones();
    this.renderVistaMisSolicitudes();
    this.actualizarBadgesPestañas();
  },

  /**
   * Bandeja superior en desuso (reemplazada por la vista dedicada Autorizaciones ASP).
   */
  renderBandejaAutorizaciones() {},

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
    const segButtons = document.querySelectorAll("#socialMobileStageSegmented .stage-seg-btn");
    segButtons.forEach(btn => {
      const isCurrent = btn.getAttribute("data-stage") === stage;
      btn.classList.toggle("active", isCurrent);
      btn.setAttribute("aria-selected", isCurrent ? "true" : "false");
    });
  },

  setMobileActiveStage(stage) {
    this._mobileActiveStage = stage;
    const board = document.getElementById("kanbanCasosSociales");
    if (board) {
      board.setAttribute("data-mobile-active-stage", stage);
    }

    this._syncMobileStageSelector();

    // Este metodo no repinta el tablero: cambiar de columna en movil no altera
    // los datos. Aun asi la etapa es parte de lo que se esta viendo, asi que
    // va a la URL.
    this._persistirFiltros();
  },

  /**
   * Sincroniza la visibilidad de los paneles y el estado activo en el sidebar directamente.
   */
  activarPanelDirecto(tabKey) {
    const rol = localStorage.getItem("pdi_active_role") || "coord";
    if (tabKey === "autorizaciones" && rol !== "coord" && rol !== "admin") tabKey = "kanban";
    if (tabKey === "mis-solicitudes" && rol !== "social") tabKey = "kanban";

    // Paneles de subvistas principales
    const panelKanban = document.getElementById("viewSocialKanban");
    const panelAutorizaciones = document.getElementById("viewSocialAutorizaciones");
    const panelMisSolicitudes = document.getElementById("viewSocialMisSolicitudes");

    if (panelKanban) panelKanban.classList.toggle("active", tabKey === "kanban");
    if (panelAutorizaciones) panelAutorizaciones.classList.toggle("active", tabKey === "autorizaciones");
    if (panelMisSolicitudes) panelMisSolicitudes.classList.toggle("active", tabKey === "mis-solicitudes");

    // Sincronizar botones del sidebar
    const btnSocial = document.querySelector('#sidebarNav .nav-btn[data-page="social"]');
    const btnAutorizaciones = document.querySelector('#sidebarNav .nav-btn[data-subview="autorizaciones"]');
    const btnMisSolicitudes = document.querySelector('#sidebarNav .nav-btn[data-subview="mis-solicitudes"]');

    if (btnSocial) btnSocial.classList.toggle("active", tabKey === "kanban");
    if (btnAutorizaciones) btnAutorizaciones.classList.toggle("active", tabKey === "autorizaciones");
    if (btnMisSolicitudes) btnMisSolicitudes.classList.toggle("active", tabKey === "mis-solicitudes");

    this.actualizarBadgesPestañas();

    // El tab del navegador refleja la pestana activa con el mismo nombre que la
    // sidebar y el sufijo estandar de la app ("X | Sistema PDI (Astro)"). Este
    // metodo es el punto comun de todo cambio de tab (carga inicial por
    // montar() y clic interno por switchSocialTab), asi que una linea aca
    // cubre todas las rutas, incluidas las entradas directas por URL.
    document.title =
      `${TITULOS_TAB[tabKey] || TITULOS_TAB.kanban} | Sistema PDI (Astro)`;
  },

  /**
   * Cambia la pestaña activa de /social (Tablero, Bandeja de Autorizaciones, Estado de Solicitudes).
   */
  switchSocialTab(tabKey, actualizarUrl = true) {
    const rol = localStorage.getItem("pdi_active_role") || "coord";

    // 1. Autorizaciones Pendientes: SOLO accesible para Coordinación General y Administración
    if (tabKey === "autorizaciones" && rol !== "coord" && rol !== "admin") {
      tabKey = "kanban";
    }

    // 2. Estado de Solicitudes: SOLO accesible para rol social (Trabajadora Social)
    // Para coordinador y admin esta sección NO existe ni debe ser accesible
    if (tabKey === "mis-solicitudes" && rol !== "social") {
      tabKey = "kanban";
    }

    const aplicarCambioDeVista = () => {
      this.activarPanelDirecto(tabKey);

      // Renderizar la vista correspondiente
      if (tabKey === "autorizaciones") {
        this.renderVistaAutorizaciones();
      } else if (tabKey === "mis-solicitudes") {
        this.renderVistaMisSolicitudes();
      } else {
        this.renderKanban();
      }
    };

    // Actualizar parámetro en la URL
    if (actualizarUrl) {
      const url = new URL(window.location.href);
      if (tabKey === "kanban") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tabKey);
      }
      window.history.replaceState({}, "", url.toString());
    }

    // View Transitions API nativa: animación fluida si el navegador lo soporta
    if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
      document.startViewTransition(() => {
        aplicarCambioDeVista();
      });
    } else {
      aplicarCambioDeVista();
    }
  },

  /**
   * Actualiza los contadores numéricos en las pestañas y badges del sidebar.
   */
  actualizarBadgesPestañas() {
    // Refrescar badges del menú lateral
    window.PDI?.Bootstrap?.actualizarBadgesSidebar?.();
  },

  /**
   * Renderiza la subvista completa de Bandeja de Autorizaciones para Coordinación General.
   */
  renderVistaAutorizaciones() {
    const container = document.getElementById("containerListaAutorizacionesPendientes");
    if (!container) return;

    const rol = localStorage.getItem("pdi_active_role") || "coord";
    if (rol !== "coord" && rol !== "admin") {
      this.switchSocialTab("kanban", true);
      return;
    }

    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const pendientes = model.getCasosConSolicitudPendiente ? model.getCasosConSolicitudPendiente() : [];
    this.actualizarBadgesPestañas();

    if (pendientes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-dim);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(34, 197, 94, 0.12); color: #22c55e; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Bandeja de Autorizaciones al Día</h4>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 440px; margin: 0 auto;">
            No existen solicitudes de transición de fase pendientes de evaluación por Coordinación. Todas las derivaciones sociales se encuentran al día.
          </p>
        </div>
      `;
      return;
    }

    const urgenciaBadgeClass = {
      Alta: "badge-red",
      Media: "badge-yellow",
      Baja: "badge-blue"
    };

    container.innerHTML = `
      <div class="social-requests-grid">
        ${pendientes.map((caso, idx) => {
          const sol = caso.solicitudCambio || {};
          return `
            <div class="social-request-card" id="authCard-${caso.id}" style="--item-index: ${idx};">
              <div class="social-request-card-header">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <strong style="font-size: 14.5px; color: var(--text-main); cursor: pointer;"
                    onclick="window.PDI?.SocialKanbanView?.openDetalleCaso(${escaparEnManejador(caso.id)})"
                    title="Clic para ver expediente completo">
                    ${escapar(caso.menor)}
                  </strong>
                  <span class="kanban-card-code-link" style="cursor: pointer;"
                    onclick="window.PDI?.SocialKanbanView?.openDetalleCaso(${escaparEnManejador(caso.id)})">
                    ${escapar(caso.codigo)}
                  </span>
                  <span class="badge ${urgenciaBadgeClass[caso.urgencia] || 'badge-gray'}">
                    ${escapar(caso.urgencia || 'Media')}
                  </span>
                  <span class="badge badge-gray">
                    <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 3px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    ${escapar(caso.sede || 'Sede General')}
                  </span>
                </div>
                <div style="font-size: 11.5px; color: var(--text-dim);">
                  Solicitado: <strong>${escapar(sol.fechaSolicitud || '-')}</strong>
                </div>
              </div>

                <!-- Flujo de Transición -->
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 4px 0;">
                <div class="auth-transition-flow">
                  <span class="auth-phase-tag from">${escapar(ETAPA_NOMBRES_OFICIALES[sol.etapaOrigen] || sol.etapaOrigen)}</span>
                  <span style="color: var(--text-dim);">&rarr;</span>
                  <span class="auth-phase-tag to">${escapar(ETAPA_NOMBRES_OFICIALES[sol.etapaDestino] || sol.etapaDestino)}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted);">
                  Solicitante: <strong style="color: var(--text-main);">${escapar(sol.solicitadoPor || 'Operador ASP')}</strong> 
                  <span style="font-size: 11px; color: var(--text-dim);">(${escapar(sol.cargoSolicitante || 'Trabajadora Social')})</span>
                </div>
              </div>

              <!-- Motivo de la solicitud -->
              <div class="auth-justification-box">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #d97706; margin-bottom: 3px; letter-spacing: 0.3px;">
                  Sustento y Justificación Operativa:
                </div>
                <div style="font-size: 12.5px; line-height: 1.4; color: var(--text-main);">
                  &ldquo;${escapar(sol.motivo || 'Sin justificación detallada')}&rdquo;
                </div>
              </div>

              <!-- Botones de Acción de Coordinación -->
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 6px; padding-top: 8px; border-top: 1px solid var(--border-subtle);">
                <button type="button" class="btn-action" style="font-size: 12px; padding: 6px 12px;"
                  onclick="window.PDI?.SocialKanbanView?.openDetalleCaso(${escaparEnManejador(caso.id)})">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Ver Ficha</span>
                </button>
                <button type="button" class="btn-action primary" style="font-size: 12px; padding: 6px 16px; font-weight: 700;"
                  onclick="window.PDI?.SocialKanbanView?.abrirModalResolverSolicitud(${escaparEnManejador(caso.id)})">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                  </svg>
                  <span>Revisar y Resolver</span>
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  /**
   * Renderiza la subvista completa del Historial y Estado de Solicitudes (visible exclusivamente para rol social).
   */
  renderVistaMisSolicitudes() {
    const container = document.getElementById("containerListaMisSolicitudes");
    if (!container) return;

    const rol = localStorage.getItem("pdi_active_role") || "coord";
    if (rol !== "social") {
      this.switchSocialTab("kanban", true);
      return;
    }

    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const solicitudes = model.getTodasLasSolicitudes ? model.getTodasLasSolicitudes() : [];
    this.actualizarBadgesPestañas();

    // Actualizar contadores en las tarjetas de estadísticas
    const totalCount = solicitudes.length;
    const pendCount = solicitudes.filter(s => s.estado === "pendiente").length;
    const aprobCount = solicitudes.filter(s => s.estado === "aprobada").length;
    const rechCount = solicitudes.filter(s => s.estado === "rechazada").length;

    const elTotal = document.getElementById("statMisSolicitudesTotal");
    const elPend = document.getElementById("statMisSolicitudesPendientes");
    const elAprob = document.getElementById("statMisSolicitudesAprobadas");
    const elRech = document.getElementById("statMisSolicitudesRechazadas");

    if (elTotal) elTotal.textContent = String(totalCount);
    if (elPend) elPend.textContent = String(pendCount);
    if (elAprob) elAprob.textContent = String(aprobCount);
    if (elRech) elRech.textContent = String(rechCount);

    if (solicitudes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-dim);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--surface-2); color: var(--text-dim); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">No hay solicitudes registradas</h4>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 440px; margin: 0 auto;">
            Cuando el equipo operativo solicite una transición de fase en el tablero de derivaciones, aparecerá listada aquí con su estado y retroalimentación de Coordinación.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="social-requests-grid">
        ${solicitudes.map((sol, idx) => {
          let badgeEstado = '<span class="badge badge-yellow">En revisión</span>';
          if (sol.estado === "aprobada") {
            badgeEstado = '<span class="badge badge-green">Aprobada</span>';
          } else if (sol.estado === "rechazada") {
            badgeEstado = '<span class="badge badge-red">Rechazada</span>';
          }

          return `
            <div class="social-request-card" style="--item-index: ${idx};">
              <div class="social-request-card-header">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <strong style="font-size: 14.5px; color: var(--text-main); cursor: pointer;"
                    onclick="window.PDI?.SocialKanbanView?.openDetalleCaso(${escaparEnManejador(sol.casoId)})">
                    ${escapar(sol.menor)}
                  </strong>
                  <span class="kanban-card-code-link" style="cursor: pointer;"
                    onclick="window.PDI?.SocialKanbanView?.openDetalleCaso(${escaparEnManejador(sol.casoId)})">
                    ${escapar(sol.codigo)}
                  </span>
                  ${badgeEstado}
                  <span class="badge badge-gray">
                    <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 3px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    ${escapar(sol.sede || 'Sede General')}
                  </span>
                </div>
                <div style="font-size: 11.5px; color: var(--text-dim);">
                  Solicitud: <strong>${escapar(sol.fechaSolicitud || '-')}</strong>
                </div>
              </div>

              <!-- Flujo de Transición -->
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                <div class="auth-transition-flow">
                  <span class="auth-phase-tag from">${escapar(ETAPA_NOMBRES_OFICIALES[sol.etapaOrigen] || sol.etapaOrigen)}</span>
                  <span style="color: var(--text-dim);">&rarr;</span>
                  <span class="auth-phase-tag to">${escapar(ETAPA_NOMBRES_OFICIALES[sol.etapaDestino] || sol.etapaDestino)}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted);">
                  Solicitó: <strong>${escapar(sol.solicitadoPor || 'Operador ASP')}</strong> 
                  <span style="font-size: 11px; color: var(--text-dim);">(${escapar(sol.cargoSolicitante || 'Trabajadora Social')})</span>
                </div>
              </div>

              <!-- Motivo original -->
              <div class="auth-justification-box" style="border-left-color: var(--border-hover); background: var(--surface-1);">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 2px;">
                  Motivo enviado por el solicitante:
                </div>
                <div style="font-size: 12px; line-height: 1.4; color: var(--text-main);">
                  &ldquo;${escapar(sol.motivo || 'Sin motivo especificado')}&rdquo;
                </div>
              </div>

              <!-- Respuesta / Dictamen de Coordinación si ya fue resuelta -->
              ${(sol.estado === "aprobada" || sol.estado === "rechazada") ? `
                <div class="coordination-feedback-box ${sol.estado}">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${sol.estado === 'aprobada' ? '#16a34a' : '#dc2626'};">
                      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        ${sol.estado === 'aprobada' 
                          ? '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />' 
                          : '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />'}
                      </svg>
                      <span>Dictamen de Coordinación: ${sol.estado.toUpperCase()}</span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-dim);">
                      Resuelto por: <strong>${escapar(sol.resueltoPor || 'Coordinación General')}</strong> (${escapar(sol.fechaResolucion || '-')})
                    </div>
                  </div>
                  <div style="font-size: 12.5px; line-height: 1.4; color: var(--text-main); font-weight: 500;">
                    ${sol.comentarioResolucion ? `&ldquo;${escapar(sol.comentarioResolucion)}&rdquo;` : `<em>Sin observaciones adicionales registradas.</em>`}
                  </div>
                </div>
              ` : `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #d97706; background: rgba(245, 158, 11, 0.08); padding: 7px 12px; border-radius: var(--radius-sm); border: 1px dashed rgba(245, 158, 11, 0.3);">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Esperando resolución de Coordinación General. El caso permanece en su fase actual hasta su aprobación.</span>
                </div>
              `}

              <!-- Botón rápido para ver caso -->
              <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                <button type="button" class="btn-action" style="font-size: 11.5px; padding: 4px 10px;"
                  onclick="window.PDI?.SocialKanbanView?.openDetalleCaso(${escaparEnManejador(sol.casoId)})">
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Ver Ficha del Caso</span>
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialKanbanView = SocialKanbanView;
}
