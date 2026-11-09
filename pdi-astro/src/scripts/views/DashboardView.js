import { AnimationEngine } from '../utils/AnimationEngine.js';
import { crear as crearFiltros } from '../utils/Filters.js';
import { crearStore } from '../utils/FilterStore.js';
import { Dropdown } from '../utils/Dropdown.js';
import { Responsive } from '../utils/Responsive.js';
import { initSortMenu } from '../ui/SortMenu.js';

import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";;
import { iconHtml } from '../../data/iconos.js';

// Filtros del historial de cambios que viajan en la URL. Los mismos sirven para
// dashboard.html y para auditoria.html: es la misma vista en las dos paginas,
// y el fragmento de auditoria es solo su version a pantalla completa.
//
// Valores tomados de los desplegables de auditoria.html.
const FILTROS_AUDITORIA = {
  q:       { valor: "" },
  accion:  { valor: [], valores: ["salud", "social", "educativo", "padron"], multiple: true },
  fecha:   { valor: "all", valores: ["all", "today", "week", "specific", "range"] },
  // Las fechas sueltas son YYYY-MM-DD, que entra en la lista de caracteres
  // permitidos para texto libre.
  fechaEspecifica: { valor: "" },
  rangoDesde:      { valor: "" },
  rangoHasta:      { valor: "" },
  rol:     { valor: [], valores: ["Coordinación", "Facilitadora", "Promotora", "Trabajadora Social"], multiple: true },
  estado:  { valor: [], valores: ["Registrado", "Sensible", "Observado"], multiple: true },
  pagina:  { valor: 1, numeros: { min: 1, max: 10000 } },
  tam:     { valor: 10, numeros: { min: 5, max: 100 } },
};

const FACETAS_AUDITORIA = {
  accion: { tipo: "multi", opciones: FILTROS_AUDITORIA.accion.valores, defecto: [] },
  rol: { tipo: "multi", opciones: FILTROS_AUDITORIA.rol.valores, defecto: [] },
  estado: { tipo: "multi", opciones: FILTROS_AUDITORIA.estado.valores, defecto: [] },
  fecha: { tipo: "single", opciones: FILTROS_AUDITORIA.fecha.valores, defecto: "all" },
};

// Vista: Tablero Principal Dashboard
export const DashboardView = {
  _filtros: null,
  _filtrosLeidos: false,
  _haEntrado: false,

  _store: null,

  _obtenerStore() {
    if (!this._store) this._store = crearStore(FACETAS_AUDITORIA);
    return this._store;
  },

  _espejarStore() {
    const s = this._obtenerStore().instantanea();
    this._filterAuditAction = s.accion;
    this._filterAuditRole = s.rol;
    this._filterAuditStatus = s.estado;
    this._filterAuditDate = s.fecha;
  },

  reiniciarEntrada() {
    this._haEntrado = false;
  },

  _obtenerFiltros() {
    if (!this._filtros) {
      this._filtros = crearFiltros(FILTROS_AUDITORIA);
    }
    return this._filtros;
  },

  _persistirFiltros(extra) {
    this._obtenerFiltros().escribir({
      q: this._auditSearchQuery,
      accion: this._filterAuditAction,
      fecha: this._filterAuditDate,
      fechaEspecifica: this._customDateSpecific,
      rangoDesde: this._customDateRangeStart,
      rangoHasta: this._customDateRangeEnd,
      rol: this._filterAuditRole,
      estado: this._filterAuditStatus,
      pagina: this._auditCurrentPage,
      tam: this._auditPageSize,
      ...(extra || {}),
    });
  },

  _leerFiltrosDeURL() {
    if (this._filtrosLeidos) return;
    this._filtrosLeidos = true;

    const f = this._obtenerFiltros().leer();
    this._auditSearchQuery = (f.q || "").toLowerCase();
    this._obtenerStore().cargar({ accion: f.accion, rol: f.rol, estado: f.estado, fecha: f.fecha });
    this._espejarStore();
    this._auditCurrentPage = f.pagina;
    this._auditPageSize = f.tam;

    // El rango personalizado necesita los dos extremos. Si solo llega uno, se
    // descarta el rango entero: filtrar por un intervalo con un extremo
    // inventado no significaria nada.
    this._customDateSpecific = f.fechaEspecifica || "";
    this._customDateRangeStart = f.rangoDesde || "";
    this._customDateRangeEnd = f.rangoHasta || "";

    const input = document.getElementById("inputAuditSearch");
    if (input) input.value = f.q;
    const clearBtn = document.getElementById("btnAuditSearchClear");
    if (clearBtn) clearBtn.style.display = f.q ? "inline-flex" : "none";

    this._updateActionDropdownUI();
    this._updateRoleDropdownUI();
    this._updateStatusDropdownUI();
    this._updateDateUI();
  },

  render(stats, auditLogs) {
    const esPrimeraEntrada = !this._haEntrado;
    this._haEntrado = true;

    const fechaEl = document.getElementById("dashFolioFecha");
    if (fechaEl) {
      try {
        fechaEl.textContent = new Intl.DateTimeFormat("es-PE", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(new Date());
      } catch {
        fechaEl.textContent = "hoy";
      }
    }

    // Franja clínica: mismas bandas MINSA y mismos ids que antes. La barra
    // arranca en 0% solo en la primera entrada; en refrescos transiciona.
    const anemiaContainer = document.getElementById("dashAnemiaTable");
    if (anemiaContainer) {
      const bandas = [
        { fillId: "segAnemiaNormal", pctId: "anemiaPctNormal", legId: "anemiaLegendNormal", pct: stats.pctNormal, casos: stats.normales },
        { fillId: "segAnemiaLeve", pctId: "anemiaPctLeve", legId: "anemiaLegendLeve", pct: stats.pctLeve, casos: stats.leves },
        { fillId: "segAnemiaMod", pctId: "anemiaPctMod", legId: "anemiaLegendMod", pct: stats.pctMod, casos: stats.moderadas },
      ];

      bandas.forEach(({ fillId, pctId, legId, pct, casos }) => {
        const fill = document.getElementById(fillId);
        if (fill) {
          // El destino viaja en el nodo y se lee dentro del rAF, no en el
          // closure: si la hidratación repinta antes del frame, el callback
          // antiguo no devuelve la barra a 0%.
          fill.dataset.targetWidth = `${pct}%`;
          if (esPrimeraEntrada) {
            fill.style.width = "0%";
            void fill.offsetWidth;
            requestAnimationFrame(() => { fill.style.width = fill.dataset.targetWidth; });
          } else {
            fill.style.width = fill.dataset.targetWidth;
          }
        }

        const pctEl = document.getElementById(pctId);
        if (pctEl) this._rodarOdometro(pctEl, `clinica_pct_${pctId}`, pct, "%");
        const legEl = document.getElementById(legId);
        if (legEl) this._rodarOdometro(legEl, `clinica_casos_${legId}`, casos, "");
      });
    }

    this._renderServicios(stats);
    this.renderAuditLogs(auditLogs);
  },

  /** Odometro con memoria: no re-rueda si el valor renderizado no cambio. */
  _rodarOdometro(el, claveMemoria, valor, suffix) {
    if (!this._odometroMemoria) this._odometroMemoria = {};
    const valorStr = String(valor) + (suffix || "");
    if (this._odometroMemoria[claveMemoria] === valorStr) return;
    this._odometroMemoria[claveMemoria] = valorStr;
    // mergeGlyphs: en esta tarjeta el conteo lleva palabras ("8 usuarios"), y el
    // span por letra del odometro rompia el kerning (~0.6px). Al hidratar y
    // volver a texto plano la palabra se reacomodaba: un micro-movimiento. Como
    // texto, el ancho coincide con el del render plano.
    AnimationEngine.odometerRoll(el, valor, { suffix, mergeGlyphs: true });
  },


  /**
   * Un panel vacío no siempre significa "no hay datos": al entrar, la
   * hidratación todavía puede estar en curso o la conexión puede haberse
   * caído. El mensaje lo dice en vez de afirmar que el padrón está vacío.
   */
  _mensajeSinDatos(textoVacio) {
    const estado = window.PDI?.DB?.estadoActual?.() || "ok";
    if (estado === "sin_conexion") {
      return "Sin conexión con la base de datos. Reintentando…";
    }
    if (estado !== "ok") return "Cargando datos…";
    return textoVacio;
  },

  /** Claves de servicio de un usuario, a partir de estrategias y servicios. */
  _clavesServicio(b) {
    const claves = new Set();
    const fuentes = [].concat(
      Array.isArray(b?.estrategias) ? b.estrategias : [],
      Array.isArray(b?.servicios) ? b.servicios : [],
      [b?.estrategia || ""],
    );
    fuentes.forEach((valor) => {
      const low = String(valor || "").toLowerCase();
      if (!low) return;
      if (low.includes("desayuno")) claves.add("desayuno");
      if (low.includes("lonchera")) claves.add("lonchera");
      if (low.includes("casita")) claves.add("casita");
      if (low.includes("biblioteca")) claves.add("biblioteca");
      if (/(^|\s)jac(\s|$)/.test(low)) claves.add("jac");
      if (low.includes("btf") || low.includes("buen trato")) claves.add("btf");
      if (low.includes("reposter")) claves.add("reposteria");
      if (low.includes("pastoral") || low.includes("asp")) claves.add("asp");
    });
    return claves;
  },

  /**
   * Paneles de servicios, voluntariado y cobertura por servicio. Lee los
   * modelos ya hidratados; no consulta la nube. El render es idempotente:
   * se puede llamar en cada refresco sin duplicar nodos.
   */
  _renderServicios(stats) {
    const usuarios = window.PDI?.BeneficiarioModel?.getAll?.() || [];
    const voluntarios = window.PDI?.VoluntarioModel?.getAll?.() || [];
    const casos = window.PDI?.CasoSocialModel?.getAll?.() || [];
    const claves = new Map(usuarios.map(b => [b, this._clavesServicio(b)]));
    const contar = (clave) => usuarios.filter(b => claves.get(b).has(clave)).length;

    const desayuno = contar("desayuno");
    const lonchera = contar("lonchera");
    const casita = contar("casita");
    const biblioteca = contar("biblioteca");
    const alimentario = usuarios.filter(b => {
      const c = claves.get(b);
      return c.has("desayuno") || c.has("lonchera");
    }).length;
    const educativo = usuarios.filter(b => {
      const c = claves.get(b);
      return c.has("casita") || c.has("biblioteca");
    }).length;
    const casosActivos = casos.filter(c => c && c.etapa !== "cerrado").length;
    const voluntariosActivos = voluntarios.filter(v => String(v?.estado || "").toLowerCase() === "activo").length;

    const poner = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(valor);
    };
    const rodar = (id, clave, valor) => {
      const el = document.getElementById(id);
      if (el) this._rodarOdometro(el, clave, valor, "");
    };

    // Leads de servicio: ruedan una vez, no en cada refresco.
    rodar("dashAlimUsuarios", "servicio_alim", alimentario);
    rodar("dashEduActivos", "servicio_edu", educativo);
    rodar("dashAspCasos", "servicio_asp", casosActivos);

    // Filas: texto directo para que la hidratación no deje odómetros a medias.
    poner("dashAlimDesayuno", desayuno);
    poner("dashAlimLonchera", lonchera);
    poner("dashAlimCred", stats.tamizados ?? 0);
    poner("dashEduCasita", casita);
    poner("dashEduBiblioteca", biblioteca);
    poner("dashAspDesayuno", desayuno);
    poner("dashAspLonchera", lonchera);
    poner("dashAspCasita", casita);

    // Voluntarios por servicio: los seis del parte, sin "otros".
    const listaVol = document.getElementById("dashVoluntariosList");
    if (listaVol) {
      const claveVol = (servicio) => {
        const low = String(servicio || "").toLowerCase();
        if (low.includes("desayuno")) return "desayuno";
        if (low.includes("lonchera")) return "lonchera";
        if (low.includes("casita")) return "casita";
        if (low.includes("biblioteca")) return "biblioteca";
        if (low.includes("pastoral") || low.includes("asp")) return "asp";
        if (low.includes("reposter")) return "reposteria";
        return "otros";
      };
      const grupos = {};
      voluntarios.forEach(v => {
        const k = claveVol(v?.servicio);
        grupos[k] = (grupos[k] || 0) + 1;
      });
      const filas = [
        { clave: "desayuno", nombre: "Desayuno infantil" },
        { clave: "lonchera", nombre: "Lonchera infantil" },
        { clave: "casita", nombre: "Casita del Saber" },
        { clave: "biblioteca", nombre: "Biblioteca comunitaria" },
        { clave: "asp", nombre: "Social pastoral (ASP)" },
        { clave: "reposteria", nombre: "Talleres de repostería" },
      ];
      const total = voluntariosActivos || 1;
      listaVol.innerHTML = filas.map(f => {
        const n = grupos[f.clave] || 0;
        const pct = Math.round((n / total) * 100);
        return `
          <li class="dash-vol-row">
            <span class="dash-vol-name">${escapar(f.nombre)}</span>
            <strong class="dash-vol-count">${n}</strong>
            <span class="dash-vol-track" aria-hidden="true"><span class="dash-vol-fill" style="width:${pct}%"></span></span>
          </li>
        `;
      }).join("");
      const totalEl = document.getElementById("dashVolTotal");
      if (totalEl) totalEl.textContent = String(voluntariosActivos);
    }

    this.renderTerritorio(usuarios, claves);
  },

  /**
   * Matriz territorial: los dos distritos del documento por los siete
   * servicios. Es una tabla real en escritorio; en móvil el CSS la convierte
   * en dos bloques con la etiqueta del distrito en cada celda.
   */
  renderTerritorio(usuarios, claves) {
    const container = document.getElementById("dashTerritoryMatrix");
    if (!container) return;

    const distritos = ["Comas", "Carabayllo"];
    const programas = [
      { clave: "desayuno", nombre: "Desayuno infantil" },
      { clave: "lonchera", nombre: "Lonchera infantil" },
      { clave: "casita", nombre: "Casita del Saber" },
      { clave: "biblioteca", nombre: "Biblioteca comunitaria" },
      { clave: "jac", nombre: "JAC" },
      { clave: "btf", nombre: "BTF" },
      { clave: "reposteria", nombre: "Talleres de repostería" },
    ];
    const mapaClaves = claves || new Map(usuarios.map(b => [b, this._clavesServicio(b)]));
    const resumen = Object.fromEntries(distritos.map(d => [d, {
      total: 0,
      servicios: Object.fromEntries(programas.map(p => [p.clave, 0])),
    }]));

    usuarios.forEach(b => {
      const distrito = String(b?.distrito || "").trim();
      const dist = distritos.find(d => d.toLowerCase() === distrito.toLowerCase());
      if (!dist) return;
      resumen[dist].total += 1;
      const c = mapaClaves.get(b);
      programas.forEach(p => { if (c.has(p.clave)) resumen[dist].servicios[p.clave] += 1; });
    });

    const totalUsuarios = distritos.reduce((s, d) => s + resumen[d].total, 0) || 1;
    const cabeceras = distritos.map(d => {
      const info = resumen[d];
      const pct = Math.round((info.total / totalUsuarios) * 100);
      return `<th scope="col" data-dist="${d.toLowerCase()}">
        <span class="dash-matrix-dist">${escapar(d)}</span>
        <span class="dash-matrix-total">${info.total} usuarios · ${pct} %</span>
      </th>`;
    }).join("");
    const filas = programas.map(p => {
      const celdas = distritos
        .map(d => `<td data-label="${escapar(d)}">${resumen[d].servicios[p.clave]}</td>`)
        .join("");
      return `<tr><th scope="row">${escapar(p.nombre)}</th>${celdas}</tr>`;
    }).join("");
    const totales = distritos
      .map(d => `<td data-label="${escapar(d)}">${resumen[d].total}</td>`)
      .join("");

    const firma = JSON.stringify({ cabeceras, filas, totales });
    if (container.dataset.firma === firma) return;
    container.dataset.firma = firma;
    container.innerHTML = `
      <table class="dash-matrix">
        <caption class="dash-sr-only">Cobertura territorial por distrito y servicio</caption>
        <thead><tr><th scope="col">Servicio</th>${cabeceras}</tr></thead>
        <tbody>${filas}</tbody>
        <tfoot><tr><th scope="row">Total</th>${totales}</tr></tfoot>
      </table>
    `;
  },



  _initAuditSort() {
    this._auditSortMenu = initSortMenu({
      id: "AuditoriaSort",
      onSelect: (valor) => this.sortAuditLogs(valor),
    });
    this._auditSortMenu?.sync(`${this._auditSortKey}-${this._auditSortDir}`);
  },

  sortAuditLogs(valor) {
    const [key, dir] = String(valor || "").split("-");
    if (!key) return;
    this._auditSortKey = key;
    this._auditSortDir = dir === "asc" ? "asc" : "desc";
    this._auditSortMenu?.sync(`${this._auditSortKey}-${this._auditSortDir}`);
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _ordenarAuditoria(lista) {
    const dir = this._auditSortDir === "desc" ? -1 : 1;
    const fecha = (l) => String(l?.timestamp || l?.fecha || "");
    return [...lista].sort((a, b) => {
      let cmp = 0;
      switch (this._auditSortKey) {
        case "usuario":
          cmp = String(a.user || "").localeCompare(String(b.user || ""), "es");
          break;
        case "accion":
          cmp = String(a.action || "").localeCompare(String(b.action || ""), "es");
          break;
        case "entidad":
          cmp = String(a.entity || "").localeCompare(String(b.entity || ""), "es");
          break;
        default:
          cmp = fecha(a).localeCompare(fecha(b));
      }
      if (cmp === 0) cmp = fecha(a).localeCompare(fecha(b));
      return cmp * dir;
    });
  },

  renderAuditLogs(logs) {
    // La lectura va antes de los indicadores: si se lee despues, el total que
    // se muestra es el de la pagina entera y no el de lo que se esta viendo.
    this._leerFiltrosDeURL();
    this._initAuditSort();
    this._currentAuditLogs = logs || [];
    this._filteredAuditLogs = logs || [];
    this.updateAuditKpis(this._currentAuditLogs);
    this.applyAuditFilters();
  },

  updateAuditKpis(logs) {
    const totalEl = document.getElementById("auditKpiTotal");
    const sensEl = document.getElementById("auditKpiSensibles");
    const exportCountEl = document.getElementById("exportAuditCountBadge");

    const totalCount = (logs && logs.length) || 0;
    if (totalEl) totalEl.textContent = totalCount;
    if (exportCountEl) exportCountEl.textContent = `${totalCount} eventos`;
    
    if (sensEl) {
      const sensibles = logs ? logs.filter(l => 
        (l.action && l.action.toLowerCase().includes("derivaci")) || 
        (l.detail && l.detail.toLowerCase().includes("demuna")) ||
        (l.status && l.status.toLowerCase().includes("sensible"))
      ) : [];
      sensEl.textContent = sensibles.length;
    }
  },

  _currentAuditLogs: [],
  _auditSortKey: "reciente",
  _auditSortDir: "desc",
  _auditSearchQuery: "",
  _filterAuditAction: [], // array de acciones seleccionadas (vacío = todas)
  _filterAuditDate: "all", // "all" | "today" | "week" | "specific" | "range"
  _filterAuditRole: [],   // array de roles seleccionados (vacío = todos)
  _filterAuditStatus: [], // array de estados seleccionados (vacío = todos)
  _customDateSpecific: "",
  _customDateRangeStart: "",
  _customDateRangeEnd: "",
  _auditCurrentPage: 1,
  _auditPageSize: 10,

  toggleInnerDropdown(dropdownId) {
    Dropdown.alternarInterno(dropdownId);
  },

  toggleAction(val) {
    this._obtenerStore().alternar("accion", val);
    this._espejarStore();
    this._updateActionDropdownUI();
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateActionDropdownUI() {
    const isAll = this._filterAuditAction.length === 0;
    const items = document.querySelectorAll("#menuAuditAction .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAuditAction.includes(v));
      }
    });

    const labelEl = document.getElementById("labelAuditActionSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Eventos";
      } else if (this._filterAuditAction.length === 1) {
        const a = this._filterAuditAction[0];
        if (a === "salud") labelEl.textContent = "Salud y Nutrición CRED";
        else if (a === "social") labelEl.textContent = "Derivación Social ASP";
        else if (a === "educativo") labelEl.textContent = "Casitas del Saber CS";
        else if (a === "padron") labelEl.textContent = "Padrón / Coordinación";
      } else {
        labelEl.textContent = `${this._filterAuditAction.length} seleccionados`;
      }
    }
  },

  selectDate(dateKey, label) {
    this._obtenerStore().fijar("fecha", dateKey || "all");
    this._espejarStore();
    this._updateDateUI(label);

    // Cerrar dropdown si es selección directa de fecha fija
    if (dateKey !== "specific" && dateKey !== "range") {
      const drop = document.getElementById("dropdownAuditDate");
      if (drop) drop.classList.remove("open");
    }

    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  /**
   * Pinta el desplegable de fecha y muestra el panel que corresponda.
   *
   * Se separa de selectDate() porque al restaurar desde la URL hay que mostrar
   * el panel de fecha especifica o de rango sin cerrar el desplegable ni
   * reiniciar la paginacion: en ese momento no hay pulsacion, hay una URL.
   */
  _updateDateUI(alternativa) {
    const items = document.querySelectorAll("#menuAuditDate .padron-dropdown-item");
    let texto = null;
    items.forEach(item => {
      const coincide = item.getAttribute("data-value") === this._filterAuditDate;
      item.classList.toggle("selected", coincide);
      if (coincide) {
        const span = item.querySelector(".padron-item-label");
        if (span) texto = span.textContent.trim();
      }
    });

    const labelEl = document.getElementById("labelAuditDateSelect");
    if (labelEl) {
      labelEl.textContent = texto || alternativa || "Todas las Fechas";
    }

    const panelSpecific = document.getElementById("panelAuditDateSpecific");
    const panelRange = document.getElementById("panelAuditDateRange");
    if (panelSpecific) panelSpecific.style.display = (this._filterAuditDate === "specific") ? "flex" : "none";
    if (panelRange) panelRange.style.display = (this._filterAuditDate === "range") ? "flex" : "none";

    // Los <input type="date"> del panel de rango conservan su valor: al recargar
    // un enlace con rango, los dos campos tienen que mostrarlo.
    const inputSpecific = document.getElementById("inputAuditDateSpecific");
    if (inputSpecific) inputSpecific.value = this._customDateSpecific || "";
    const inputDesde = document.getElementById("inputAuditDateRangeStart");
    if (inputDesde) inputDesde.value = this._customDateRangeStart || "";
    const inputHasta = document.getElementById("inputAuditDateRangeEnd");
    if (inputHasta) inputHasta.value = this._customDateRangeEnd || "";
  },

  toggleRole(val) {
    this._obtenerStore().alternar("rol", val);
    this._espejarStore();
    this._updateRoleDropdownUI();
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateRoleDropdownUI() {
    const isAll = this._filterAuditRole.length === 0;
    const items = document.querySelectorAll("#menuAuditRole .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAuditRole.includes(v));
      }
    });

    const labelEl = document.getElementById("labelAuditRoleSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Roles";
      } else if (this._filterAuditRole.length === 1) {
        labelEl.textContent = this._filterAuditRole[0];
      } else {
        labelEl.textContent = `${this._filterAuditRole.length} seleccionados`;
      }
    }
  },

  toggleStatus(val) {
    this._obtenerStore().alternar("estado", val);
    this._espejarStore();
    this._updateStatusDropdownUI();
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateStatusDropdownUI() {
    const isAll = this._filterAuditStatus.length === 0;
    const items = document.querySelectorAll("#menuAuditStatus .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAuditStatus.includes(v));
      }
    });

    const labelEl = document.getElementById("labelAuditStatusSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Estados";
      } else if (this._filterAuditStatus.length === 1) {
        const s = this._filterAuditStatus[0];
        if (s === "Registrado") labelEl.textContent = "Registrado / Conforme";
        else if (s === "Sensible") labelEl.textContent = "Sensible / Crítico";
        else if (s === "Observado") labelEl.textContent = "Observado / Revisión";
      } else {
        labelEl.textContent = `${this._filterAuditStatus.length} seleccionados`;
      }
    }
  },

  handleDatePickerChange(type, yyyyMmDd) {
    if (!yyyyMmDd) return;
    const parts = yyyyMmDd.split("-");
    if (parts.length === 3) {
      const ddMmYyyy = `${parts[2]}/${parts[1]}/${parts[0]}`;
      if (type === "specific") {
        const input = document.getElementById("inputAuditSpecificDate");
        if (input) input.value = ddMmYyyy;
        this._customDateSpecific = yyyyMmDd;
      } else if (type === "range-start") {
        const input = document.getElementById("inputAuditRangeStart");
        if (input) input.value = ddMmYyyy;
        this._customDateRangeStart = yyyyMmDd;
      } else if (type === "range-end") {
        const input = document.getElementById("inputAuditRangeEnd");
        if (input) input.value = ddMmYyyy;
        this._customDateRangeEnd = yyyyMmDd;
      }
      this._auditCurrentPage = 1;
      this.applyAuditFilters();
    }
  },

  handleDateManualInput(type, inputEl) {
    if (!inputEl) return;
    let val = inputEl.value;
    
    // Auto-formateo con slashes si el usuario escribe solo dígitos
    const cleanDigits = val.replace(/\D/g, "").slice(0, 8);
    if (cleanDigits.length >= 5) {
      val = `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2, 4)}/${cleanDigits.slice(4)}`;
    } else if (cleanDigits.length >= 3) {
      val = `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2)}`;
    } else {
      val = cleanDigits;
    }
    inputEl.value = val;

    // Si tiene 10 caracteres (DD/MM/AAAA) validar y parsear
    if (val.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      const isoDate = `${y}-${m}-${d}`;
      const pickerId = (type === "specific") ? "pickerAuditSpecificDate" : (type === "range-start" ? "pickerAuditRangeStart" : "pickerAuditRangeEnd");
      const picker = document.getElementById(pickerId);
      if (picker) picker.value = isoDate;

      if (type === "specific") {
        this._customDateSpecific = isoDate;
      } else if (type === "range-start") {
        this._customDateRangeStart = isoDate;
      } else if (type === "range-end") {
        this._customDateRangeEnd = isoDate;
      }
      this._auditCurrentPage = 1;
      this.applyAuditFilters();
    } else if (val.length === 0) {
      if (type === "specific") this._customDateSpecific = "";
      if (type === "range-start") this._customDateRangeStart = "";
      if (type === "range-end") this._customDateRangeEnd = "";
      this.applyAuditFilters();
    }
  },

  filterBySearch(query) {
    this._auditSearchQuery = (query || "").trim().toLowerCase();
    this._auditCurrentPage = 1;
    const clearBtn = document.getElementById("btnAuditSearchClear");
    if (clearBtn) {
      clearBtn.style.display = query && query.length > 0 ? "flex" : "none";
    }
    this.applyAuditFilters();
    // Se escribe lo tecleado, no _auditSearchQuery: este va en minusculas y sin
    // espacios, y al recargar el buscador mostraria un texto que nadie escribio.
    this._persistirFiltros({ q: query || "" });
  },

  clearSearch() {
    const input = document.getElementById("inputAuditSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  removeAuditFilter(filterKey, specificVal) {
    if (filterKey === "search") this.clearSearch();
    if (filterKey === "action") {
      if (specificVal) this.toggleAction(specificVal);
      else this.toggleAction("all");
    }
    if (filterKey === "date") this.selectDate("all", "Todas las Fechas");
    if (filterKey === "role") {
      if (specificVal) this.toggleRole(specificVal);
      else this.toggleRole("all");
    }
    if (filterKey === "status") {
      if (specificVal) this.toggleStatus(specificVal);
      else this.toggleStatus("all");
    }
  },

  resetAuditFilters() {
    this._obtenerStore().limpiar();
    this._espejarStore();
    this._customDateSpecific = "";
    this._customDateRangeStart = "";
    this._customDateRangeEnd = "";
    this._auditSearchQuery = "";
    this._auditCurrentPage = 1;

    const input = document.getElementById("inputAuditSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnAuditSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    const spText = document.getElementById("inputAuditSpecificDate");
    const rStartText = document.getElementById("inputAuditRangeStart");
    const rEndText = document.getElementById("inputAuditRangeEnd");
    if (spText) spText.value = "";
    if (rStartText) rStartText.value = "";
    if (rEndText) rEndText.value = "";

    const panelSpecific = document.getElementById("panelAuditDateSpecific");
    const panelRange = document.getElementById("panelAuditDateRange");
    if (panelSpecific) panelSpecific.style.display = "none";
    if (panelRange) panelRange.style.display = "none";

    this._updateActionDropdownUI();
    this.selectDate("all", "Todas las Fechas");
    this._updateRoleDropdownUI();
    this._updateStatusDropdownUI();

    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this.applyAuditFilters();
  },

  _matchesAuditAction(log, actionKeys) {
    if (!actionKeys || actionKeys.length === 0) return true;
    return actionKeys.some(actionFilter => {
      if (actionFilter === "salud") {
        return (log.action && (log.action.toLowerCase().includes("cred") || log.action.toLowerCase().includes("tamizaje") || log.action.toLowerCase().includes("salud")));
      } else if (actionFilter === "social") {
        return (log.action && (log.action.toLowerCase().includes("derivaci") || log.action.toLowerCase().includes("social") || log.action.toLowerCase().includes("caso"))) || (log.role && log.role.toLowerCase().includes("social"));
      } else if (actionFilter === "educativo") {
        return (log.action && (log.action.toLowerCase().includes("asistencia") || log.action.toLowerCase().includes("casita") || log.action.toLowerCase().includes("saber"))) || (log.role && log.role.toLowerCase().includes("promotora"));
      } else if (actionFilter === "padron") {
        return (log.action && (log.action.toLowerCase().includes("padrón") || log.action.toLowerCase().includes("aprobación") || log.action.toLowerCase().includes("usuario") || log.action.toLowerCase().includes("menor") || log.action.toLowerCase().includes("ingreso"))) || (log.role && log.role.toLowerCase().includes("coordinaci"));
      }
      return false;
    });
  },

  _matchesAuditRole(log, roleKeys) {
    if (!roleKeys || roleKeys.length === 0) return true;
    return roleKeys.some(r => log.role && log.role.toLowerCase().includes(r.toLowerCase()));
  },

  _matchesAuditStatus(log, statusKeys) {
    if (!statusKeys || statusKeys.length === 0) return true;
    return statusKeys.some(s => log.status && log.status.toLowerCase().includes(s.toLowerCase()));
  },

  _matchesAuditDate(log, dateKey) {
    if (!dateKey || dateKey === "all") return true;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const logDateStr = (log.timestamp || "").slice(0, 10);

    if (dateKey === "today") {
      return logDateStr === todayStr;
    } else if (dateKey === "week") {
      const logDate = new Date(logDateStr);
      return !isNaN(logDate) && logDate >= sevenDaysAgo;
    } else if (dateKey === "specific") {
      if (this._customDateSpecific) {
        return logDateStr === this._customDateSpecific;
      }
      return true;
    } else if (dateKey === "range") {
      const start = this._customDateRangeStart;
      const end = this._customDateRangeEnd;
      if (start && end) {
        return logDateStr >= start && logDateStr <= end;
      } else if (start) {
        return logDateStr >= start;
      } else if (end) {
        return logDateStr <= end;
      }
      return true;
    }
    return true;
  },

  /**
   * Se suscribe una sola vez por carga al cruce del corte de 768 px. Se
   * registra desde applyAuditFilters(), que es el unico camino por el que la
   * tabla de auditoria se dibuja, para que valga tanto desde el panel como
   * desde la pagina de auditoria. Al cruzar, hay que repintar: la variante que
   * estaba vacia es la que pasa a verse.
   */
  _vigilarVariante() {
    if (this._vigilaVariante) return;
    this._vigilaVariante = true;
    Responsive.alCambiarDeVariante(() => this.applyAuditFilters());
  },

  applyAuditFilters() {
    this._vigilarVariante();
    const logs = this._currentAuditLogs || [];
    const query = this._auditSearchQuery || "";

    let filtered = logs.filter(l => {
      let matchAction = this._matchesAuditAction(l, this._filterAuditAction);
      let matchRole = this._matchesAuditRole(l, this._filterAuditRole);
      let matchStatus = this._matchesAuditStatus(l, this._filterAuditStatus);
      let matchDate = this._matchesAuditDate(l, this._filterAuditDate);

      let matchQuery = true;
      if (query) {
        const user = (l.user || "").toLowerCase();
        const role = (l.role || "").toLowerCase();
        const action = (l.action || "").toLowerCase();
        const entity = (l.entity || "").toLowerCase();
        const detail = (l.detail || "").toLowerCase();
        const id = (l.id || "").toLowerCase();
        matchQuery = user.includes(query) || role.includes(query) || action.includes(query) || entity.includes(query) || detail.includes(query) || id.includes(query);
      }

      return matchAction && matchRole && matchStatus && matchDate && matchQuery;
    });

    filtered = this._ordenarAuditoria(filtered);
    this._filteredAuditLogs = filtered;

    // Badge desde el store.
    const count = this._obtenerStore().contarActivos();

    const badge = document.getElementById("auditActiveFiltersCount");
    const filterBtn = document.getElementById("btnDropdownAuditFilterPanel");

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }
    if (filterBtn) {
      filterBtn.classList.toggle("has-filters", count > 0);
    }

    this._updateAuditFacetCounts();
    this._renderAuditActiveChips();

    // Paginación
    const totalRecords = filtered.length;
    const pageSize = this._auditPageSize || 10;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    if (this._auditCurrentPage > totalPages) this._auditCurrentPage = totalPages;
    if (this._auditCurrentPage < 1) this._auditCurrentPage = 1;

    const startIndex = (this._auditCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const paginatedLogs = filtered.slice(startIndex, endIndex);

    this.renderAuditTableAndCards(paginatedLogs);
    this.renderAuditPagination(totalRecords, startIndex, endIndex, totalPages);
    this.updateAuditKpis(filtered);

    // Un solo punto de escritura para los nueve filtros: toggleAction(),
    // selectDate(), toggleRole(), toggleStatus(), handleDatePickerChange(),
    // handleDateManualInput(), filterBySearch(), changePage(), changePageSize()
    // y resetAuditFilters() terminan todos en applyAuditFilters(), y en cuanto
    // cambian algo lo unico que hacen falta es repintar. Se escribe al final, ya
    // con la pagina normalizada, para que la URL no anuncie una pagina que
    // despues el propio filtro deja fuera de rango.
    this._persistirFiltros();
  },

  _updateAuditFacetCounts() {
    const getFilteredExcluding = (excludeKey) => {
      let l = [...(this._currentAuditLogs || [])];
      if (this._auditSearchQuery) {
        const q = this._auditSearchQuery;
        l = l.filter(log => {
          const user = (log.user || "").toLowerCase();
          const role = (log.role || "").toLowerCase();
          const action = (log.action || "").toLowerCase();
          const entity = (log.entity || "").toLowerCase();
          const detail = (log.detail || "").toLowerCase();
          const id = (log.id || "").toLowerCase();
          return user.includes(q) || role.includes(q) || action.includes(q) || entity.includes(q) || detail.includes(q) || id.includes(q);
        });
      }
      if (excludeKey !== "action" && this._filterAuditAction.length > 0) {
        l = l.filter(log => this._matchesAuditAction(log, this._filterAuditAction));
      }
      if (excludeKey !== "date" && this._filterAuditDate !== "all") {
        l = l.filter(log => this._matchesAuditDate(log, this._filterAuditDate));
      }
      if (excludeKey !== "role" && this._filterAuditRole.length > 0) {
        l = l.filter(log => this._matchesAuditRole(log, this._filterAuditRole));
      }
      if (excludeKey !== "status" && this._filterAuditStatus.length > 0) {
        l = l.filter(log => this._matchesAuditStatus(log, this._filterAuditStatus));
      }
      return l;
    };

    const setFacetBadge = (badgeId, text, isZero) => {
      const el = document.getElementById(badgeId);
      if (!el) return;
      el.textContent = text;
      const parentItem = el.closest(".padron-dropdown-item");
      if (parentItem && parentItem.getAttribute("data-value") !== "all") {
        parentItem.classList.toggle("zero-facet", isZero);
      }
    };

    // 1. Facetas de Tipo de Evento
    const forAction = getFilteredExcluding("action");
    setFacetBadge("countFacetAuditAction-all", `(${forAction.length})`, forAction.length === 0);
    const actionsList = ["salud", "social", "educativo", "padron"];
    actionsList.forEach(act => {
      const c = forAction.filter(log => this._matchesAuditAction(log, [act])).length;
      setFacetBadge(`countFacetAuditAction-${act}`, `(${c})`, c === 0);
    });

    // 2. Facetas de Periodo Temporal
    const forDate = getFilteredExcluding("date");
    setFacetBadge("countFacetAuditDate-all", `(${forDate.length})`, forDate.length === 0);
    const cToday = forDate.filter(log => this._matchesAuditDate(log, "today")).length;
    const cWeek = forDate.filter(log => this._matchesAuditDate(log, "week")).length;
    setFacetBadge("countFacetAuditDate-today", `(${cToday})`, cToday === 0);
    setFacetBadge("countFacetAuditDate-week", `(${cWeek})`, cWeek === 0);

    // 3. Facetas de Rol del Usuario
    const forRole = getFilteredExcluding("role");
    setFacetBadge("countFacetAuditRole-all", `(${forRole.length})`, forRole.length === 0);
    const rolesList = ["Coordinación", "Facilitadora", "Promotora", "Trabajadora Social"];
    rolesList.forEach(r => {
      const c = forRole.filter(log => this._matchesAuditRole(log, [r])).length;
      setFacetBadge(`countFacetAuditRole-${r}`, `(${c})`, c === 0);
    });

    // 4. Facetas de Estado de Registro
    const forStatus = getFilteredExcluding("status");
    setFacetBadge("countFacetAuditStatus-all", `(${forStatus.length})`, forStatus.length === 0);
    const statusesList = ["Registrado", "Sensible", "Observado"];
    statusesList.forEach(s => {
      const c = forStatus.filter(log => this._matchesAuditStatus(log, [s])).length;
      setFacetBadge(`countFacetAuditStatus-${s}`, `(${c})`, c === 0);
    });
  },

  _renderAuditActiveChips() {
    const bar = document.getElementById("auditActiveChipsBar");
    const list = document.getElementById("auditActiveChipsList");
    if (!bar || !list) return;

    const chips = [];


    if (this._filterAuditAction.length > 0) {
      this._filterAuditAction.forEach(act => {
        let label = act;
        if (act === "salud") label = "Salud CRED";
        if (act === "social") label = "Social ASP";
        if (act === "educativo") label = "Casitas CS";
        if (act === "padron") label = "Padrón Coord.";
        chips.push({
          id: "action",
          val: act,
          label: `Evento: ${label}`
        });
      });
    }

    if (this._filterAuditDate !== "all") {
      let dateLabel = this._filterAuditDate;
      if (this._filterAuditDate === "today") dateLabel = "Fecha: Hoy";
      if (this._filterAuditDate === "week") dateLabel = "Fecha: Últimos 7 días";
      if (this._filterAuditDate === "specific") dateLabel = `Fecha: ${this._customDateSpecific || "Específica"}`;
      if (this._filterAuditDate === "range") dateLabel = `Rango: ${this._customDateRangeStart || "..."} a ${this._customDateRangeEnd || "..."}`;
      chips.push({
        id: "date",
        label: dateLabel
      });
    }

    if (this._filterAuditRole.length > 0) {
      this._filterAuditRole.forEach(r => {
        chips.push({
          id: "role",
          val: r,
          label: `Rol: ${r}`
        });
      });
    }

    if (this._filterAuditStatus.length > 0) {
      this._filterAuditStatus.forEach(s => {
        let sLabel = s;
        if (s === "Registrado") sLabel = "Conforme";
        if (s === "Sensible") sLabel = "Sensible / Crítico";
        if (s === "Observado") sLabel = "En Revisión";
        chips.push({
          id: "status",
          val: s,
          label: `Estado: ${sLabel}`
        });
      });
    }

    if (chips.length === 0) {
      bar.classList.remove("is-visible");
      list.innerHTML = "";
    } else {
      bar.classList.add("is-visible");
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${escapar(chip.label)}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeAuditChip ? window.removeAuditChip('${escaparEnManejador(chip.id)}', '${escaparEnManejador(chip.val || '')}') : null" title="Eliminar filtro">
            ${iconHtml("accion.cerrar", { size: 10 })}
          </button>
        </span>
      `).join("");
    }
  },

  changePage(page) {
    this._auditCurrentPage = page;
    this.applyAuditFilters();
  },

  changePageSize(size) {
    this._auditPageSize = Number(size) || 10;
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  renderAuditPagination(total, start, end, totalPages) {
    const infoEl = document.getElementById("auditPaginationInfo");
    if (infoEl) {
      if (total === 0) {
        infoEl.textContent = "Sin registros coincidentes";
      } else {
        infoEl.textContent = `Mostrando ${start + 1} a ${end} de ${total} eventos`;
      }
    }

    const btnPrev = document.getElementById("btnAuditPagePrev");
    const btnNext = document.getElementById("btnAuditPageNext");
    const pageNumEl = document.getElementById("auditCurrentPageNum");

    if (pageNumEl) pageNumEl.textContent = `Página ${this._auditCurrentPage} de ${totalPages}`;
    if (btnPrev) btnPrev.disabled = (this._auditCurrentPage <= 1);
    if (btnNext) btnNext.disabled = (this._auditCurrentPage >= totalPages);
  },

  renderAuditTableAndCards(logs) {
    const tbody = document.getElementById("tbodyAuditLogs");
    const mobileContainer = document.getElementById("mobileCardsAuditoria");

    // Solo se dibuja la variante que se va a ver. La lista de tarjetas
    // ocupaba 135 de los 1251 nodos del documento y 13 KB de marcado, y se
    // regeneraba en cada filtrado. Al cruzar el corte, _vigilarVariante()
    // repinta.
    const enMovil = Responsive.esMovil();

    // La que no se dibuja se vacia, y no se deja con lo que hubiera de antes:
    // si no, girar el movil con la ventana sola dejaria las dos pintadas.
    if (enMovil) { if (tbody) tbody.innerHTML = ""; }
    else { if (mobileContainer) mobileContainer.innerHTML = ""; }

    const getActionBadgeClass = (action) => {
      const act = (action || "").toLowerCase();
      if (act.includes("cred") || act.includes("tamizaje") || act.includes("salud")) return "badge-yellow";
      if (act.includes("derivaci") || act.includes("social")) return "badge-red";
      if (act.includes("asistencia") || act.includes("casita")) return "badge-blue";
      if (act.includes("padrón") || act.includes("aprobación") || act.includes("ingreso")) return "badge-green";
      return "badge-blue";
    };

    const getStatusBadgeClass = (status) => {
      const s = (status || "").toLowerCase();
      if (s.includes("sensible") || s.includes("crítico") || s.includes("derivaci")) return "badge-red";
      if (s.includes("observado") || s.includes("revisión") || s.includes("pendiente")) return "badge-yellow";
      return "badge-green"; // Registrado / Conforme
    };

    const getInitials = (name) => {
      if (!name) return "US";
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    };

    if (tbody && !enMovil) {
      if (logs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding:32px; color:var(--text-dim);">
              No se encontraron eventos de auditoría con los filtros y búsqueda especificados.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = logs.map(l => {
          const isUsuario = (l.entity && l.entity.startsWith("PDI-"));
          const entityHtml = isUsuario 
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo('${escaparEnManejador(l.entity)}')" class="audit-entity-link audit-entity-link--usuario" title="Abrir expediente del usuario"><code class="audit-entity-code audit-entity-code--usuario">${escapar(l.entity)}</code></a>`
            : `<code class="audit-entity-code" title="${escapar(l.entity)}">${escapar(l.entity)}</code>`;

          const logIdStr = l.id || "";
          return `
            <tr class="audit-row-interactive">
              <td class="audit-timestamp">${escapar(l.timestamp)}</td>
              <td>
                <div class="audit-user-cell">
                  <div class="audit-user-avatar" aria-hidden="true">${getInitials(l.user)}</div>
                  <div>
                    <strong>${escapar(l.user)}</strong>
                    <div class="audit-user-role">${escapar(l.role)}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge ${getActionBadgeClass(l.action)}">${escapar(l.action)}</span></td>
              <td>${entityHtml}</td>
              <td><span class="audit-detail-cell" title="${escapar(l.detail)}">${escapar(l.detail)}</span></td>
              <td><span class="badge ${getStatusBadgeClass(l.status)}">${escapar(l.status)}</span></td>
              <td>
                <button type="button" class="btn-action-sm" onclick="event.stopPropagation(); window.openAuditDetail ? window.openAuditDetail('${escaparEnManejador(logIdStr)}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${escaparEnManejador(logIdStr)}') : null)" title="Ver detalle de trazabilidad">
                  <span>Detalle</span>
                  ${iconHtml("accion.abrir", { size: 13 })}
                </button>
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    if (mobileContainer && enMovil) {
      if (logs.length === 0) {
        mobileContainer.innerHTML = `
          <div style="text-align:center; padding:32px; color:var(--text-dim); background:var(--surface-1); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            No se encontraron eventos con los filtros seleccionados.
          </div>
        `;
      } else {
        mobileContainer.innerHTML = logs.map((l, index) => {
          const isUsuario = (l.entity && l.entity.startsWith("PDI-"));
          const entityHtml = isUsuario 
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo('${escaparEnManejador(l.entity)}')" class="audit-entity-link audit-entity-link--usuario" title="Abrir expediente del usuario"><code class="audit-entity-code audit-entity-code--usuario">${escapar(l.entity)}</code></a>`
            : `<code class="audit-entity-code" title="${escapar(l.entity)}">${escapar(l.entity)}</code>`;

          const logIdStr = l.id || "";
          return `
            <div class="mobile-card-item" id="mobile-audit-${index}">
              <div class="datacard-header">
                <div class="datacard-id">
                  <span>REG:</span> ${escapar(l.timestamp)}
                </div>
                <div class="datacard-header-right">
                  <span class="badge ${getStatusBadgeClass(l.status)}">${escapar(l.status)}</span>
                </div>
              </div>

              <div class="datacard-body">
                <div class="datacard-row audit-row-action">
                  <span class="datacard-label">Acción Registrada</span>
                  <span class="datacard-value"><span class="badge ${getActionBadgeClass(l.action)}">${escapar(l.action)}</span></span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Entidad Afectada</span>
                  <span class="datacard-value">${entityHtml}</span>
                </div>

                <div class="datacard-extra" id="extra-audit-${index}">
                  <div class="datacard-row">
                    <span class="datacard-label">Usuario Responsable</span>
                    <span class="datacard-value" style="display:flex; align-items:center; gap:6px;">
                      <span class="audit-user-avatar" style="width:22px; height:22px; font-size:9.5px;">${getInitials(l.user)}</span>
                      ${escapar(l.user)}
                    </span>
                  </div>
                  <div class="datacard-row">
                    <span class="datacard-label">Perfil / Rol</span>
                    <span class="datacard-value">${escapar(l.role)}</span>
                  </div>
                  <div class="datacard-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
                    <span class="datacard-label">Detalle de la Operación</span>
                    <span class="datacard-value" style="text-align:left; font-size:12.5px; font-weight:500; color:var(--text-muted);">${escapar(l.detail)}</span>
                  </div>
                  <div class="datacard-actions-footer">
                    <button type="button" class="btn-action primary" style="width:100%; justify-content:center;" onclick="event.stopPropagation(); window.openAuditDetail ? window.openAuditDetail('${escaparEnManejador(logIdStr)}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${escaparEnManejador(logIdStr)}') : null)">
                      ${iconHtml("accion.ver", { size: 15, style: "margin-right:6px;" })}
                      Ver Ficha Completa de Auditoría
                    </button>
                  </div>
                </div>

                <button type="button" class="datacard-toggle-btn" id="btnToggleAudit-${index}" onclick="window.PDI ? window.PDI.DashboardView.toggleAuditCard(${escaparEnManejador(index)}) : DashboardView.toggleAuditCard(${escaparEnManejador(index)})">
                  <span class="btn-text">Ver más</span>
                  ${iconHtml("nav.desplegar", { size: null })}
                </button>
              </div>
            </div>
          `;
        }).join("");
      }
    }
  },

  openLogDetail(logId) {
    const logs = this._currentAuditLogs || [];
    const log = logs.find(l => l.id === logId) || (logs.length > 0 ? logs[0] : null);
    if (!log) return;
    const modalView = window.PDI?.ModalView || ModalView;
    if (modalView && modalView.openAuditDetail) {
      modalView.openAuditDetail(log);
    }
  },

  toggleAuditCard(index) {
    const card = document.getElementById(`mobile-audit-${index}`);
    const btn = document.getElementById(`btnToggleAudit-${index}`);
    if (card) {
      const isExp = card.classList.toggle("expanded");
      if (btn) {
        const textSpan = btn.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = isExp ? "Ver menos" : "Ver más";
      }
    }
  },

  toggleDropdown(dropdownId) {
    Dropdown.alternar(dropdownId);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}
