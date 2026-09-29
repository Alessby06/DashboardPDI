// Vista: Padrón de Beneficiarios
import { crear as crearFiltros } from "../utils/Filters.js";
import { Responsive } from "../utils/Responsive.js";

// Qué filtros del padrón viajan en la URL, con qué valores y cuáles son los
// defectos. La lista de valores no se inventa: es la misma que admiten los
// desplegables de src/pages/padron.html. Si algún día se añade un filtro
// aquí, hay que añadirlo también a src/pages/, o el enlace que comparta
// alguien no reproducirá lo que veía.
const FILTROS_PADRON = {
  q:         { valor: "" },
  servicio:  { valor: [], valores: ["desayuno", "casita", "pastoral"], multiple: true },
  sede:      { valor: [], valores: ["Año Nuevo", "La Libertad", "San Pedro", "El Progreso", "Santa Rosa", "Los Bendecidos"], multiple: true },
  anemia:    { valor: [], valores: ["Normal", "Leve", "Moderada"], multiple: true },
  edadModo:  { valor: "all", valores: ["all", "exacta", "rango"] },
  edadValor: { valor: null, numeros: { min: 0, max: 18 } },
  edadMin:   { valor: 0, numeros: { min: 0, max: 18 } },
  edadMax:   { valor: 18, numeros: { min: 0, max: 18 } },
  estado:    { valor: "all", valores: ["all", "Activo", "Inactivo"] },
  sexo:      { valor: "all", valores: ["all", "F", "M"] },
  pagina:    { valor: 1, numeros: { min: 1, max: 1000 } },
  tam:       { valor: 20, numeros: { min: 5, max: 50 } },
};

export const BeneficiariosView = {
  _allBeneficiarios: [],
  _filteredBeneficiarios: [],
  _currentPage: 1,
  _pageSize: 20,
  _searchQuery: "",
  _filterServicio: [], // array de servicios seleccionados (vacío = todos)
  _filterSede: [],     // array de sedes seleccionadas (vacío = todas)
  _filterAnemia: [],   // array de anemias seleccionadas (vacío = todos)
  _filterEdadModo: "all", // "all" | "exacta" | "rango"
  _filterEdadExacta: null, // number 0-18 o null
  _filterEdadRango: { min: 0, max: 18 },
  _filterEstado: "all", // "all" | "Activo" | "Inactivo"
  _filterSexo: "all",   // "all" | "M" | "F"

  // Controlador de filtros en la URL. Se crea la primera vez porque el objeto
  // es un singleton de modulo: crearlo arriba del todo exigiria que window
  // existiera al cargarlo, y en la prueba de grafos se importa sin DOM.
  _filtros: null,

  // El estado de la URL se lee una sola vez por carga. Sin este guardia,
  // publicarRefresco() vuelve a pintar la vista despues de cada guardado y
  // releeria la URL, pisando lo que la persona acaba de filtrar a mano.
  _filtrosLeidos: false,

  _obtenerFiltros() {
    if (!this._filtros) {
      this._filtros = crearFiltros(FILTROS_PADRON);
    }
    return this._filtros;
  },

  /**
   * Vuelca el estado de filtrado actual a la barra de direcciones.
   *
   * Se llama desde todos los metodos publicos que cambian un filtro. Escriben
   * el estado completo, no un trozo, porque un filtro de este patron casi
   * siempre viene con un resets de pagina: si solo se escribiera la clave que
   * cambia, la pagina 7 se quedaria colgada en la URL al filtrar.
   *
   * @param {Object} [extra]  Valores que ganan a los del estado. Lo usa el
   *   buscador para escribir el texto tal como se escribio, con su capitalizacion,
   *   en vez de la version normalizada que se usa para comparar.
   */
  _persistirFiltros(extra) {
    this._obtenerFiltros().escribir({
      q: this._searchQuery,
      servicio: this._filterServicio,
      sede: this._filterSede,
      anemia: this._filterAnemia,
      edadModo: this._filterEdadModo,
      edadValor: this._filterEdadExacta,
      edadMin: this._filterEdadRango.min,
      edadMax: this._filterEdadRango.max,
      estado: this._filterEstado,
      sexo: this._filterSexo,
      pagina: this._currentPage,
      tam: this._pageSize,
      ...(extra || {}),
    });
  },

  /**
   * Toma el estado de filtrado de la URL y lo refleja en los controles.
   *
   * Se ejecuta antes de applyFilters, y por eso actualiza la interfaz a mano en
   * vez de llamar a los selectEstado()/setEdadExacta() de la vista: esos metodos
   * terminan en applyFilters(), y llamarlos aqui filtraria contra una lista
   * todavia vacia.
   *
   * Solo la primera vez: ver el guardia _filtrosLeidos.
   */
  _leerFiltrosDeURL() {
    if (this._filtrosLeidos) return;
    this._filtrosLeidos = true;

    const f = this._obtenerFiltros().leer();

    this._searchQuery = (f.q || "").toLowerCase();
    this._filterServicio = f.servicio;
    this._filterSede = f.sede;
    this._filterAnemia = f.anemia;
    this._filterEstado = f.estado;
    this._filterSexo = f.sexo;
    this._filterEdadModo = f.edadModo;
    this._filterEdadExacta = f.edadValor;
    this._currentPage = f.pagina;
    this._pageSize = f.tam;

    // Una URL puede pedir min=14 y max=3, porque los dos parametros se
    // acotan por separado. Aqui se ordenan, porque un rango invertido no
    // significa nada.
    const min = f.edadMin;
    const max = f.edadMax;
    this._filterEdadRango = { min: Math.min(min, max), max: Math.max(min, max) };

    const input = document.getElementById("inputPadronSearch");
    if (input) input.value = f.q;
    const clearBtn = document.getElementById("btnPadronSearchClear");
    if (clearBtn) clearBtn.style.display = f.q ? "flex" : "none";

    this._updateServicioDropdownUI();
    this._updateSedeDropdownUI();
    this._updateAnemiaDropdownUI();
    this._updateEdadUI();
    this._updateSexoDropdownUI();
    this._updateEstadoUI();
  },

  init(beneficiarios) {
    this._allBeneficiarios = beneficiarios || [];
    this._leerFiltrosDeURL();
    this._pageSize = this._getEffectivePageSize();
    this._syncPageSizeSelectUI();
    this.applyFilters(false);
  },

  /**
   * Punto de entrada real de esta vista. El punto de entrada de la pagina
   * llama a renderTable() y no a init(), asi que el estado de la URL tiene que
   * leerse tambien aqui.
   */
  renderTable(beneficiarios) {
    this._leerFiltrosDeURL();
    this._pageSize = this._getEffectivePageSize();
    if (beneficiarios) {
      this._allBeneficiarios = beneficiarios;
    }
    this._vigilarVariante();
    this.applyFilters(false);
  },

  /**
   * Se suscribe una sola vez por carga al cruce del corte de 768 px. Cuando se
   * cruza hay que repintar, porque la variante que estaba vacia es la que pasa
   * a verse: solo se dibuja la que se ve, y no las dos.
   */
  _vigilarVariante() {
    if (this._vigilaVariante) return;
    this._vigilaVariante = true;
    Responsive.alCambiarDeVariante(() => {
      this._pageSize = this._getEffectivePageSize();
      this.applyFilters(false);
    });
  },

  _getEffectivePageSize() {
    if (Responsive.esMovil()) {
      return Math.min(20, this._pageSize || 20);
    }
    return Math.min(50, this._pageSize || 20);
  },

  _syncPageSizeSelectUI() {
    const select = document.getElementById("selectPadronPageSize");
    if (select) {
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
      // En móvil, deshabilitar opción 50 y ajustar a 20 si estaba en 50
      const opt50 = select.querySelector('option[value="50"]');
      if (opt50) {
        opt50.disabled = isMobile;
        if (isMobile && select.value === "50") {
          select.value = "20";
          this._pageSize = 20;
        }
      }
      select.value = String(this._pageSize);
    }
  },

  setPageSize(size) {
    const num = parseInt(size, 10);
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    const maxAllowed = isMobile ? 20 : 50;
    this._pageSize = isNaN(num) ? 20 : Math.min(maxAllowed, Math.max(5, num));
    this._currentPage = 1;
    this._syncPageSizeSelectUI();
    this.applyFilters(false);
    this._persistirFiltros();
  },

  goToPage(page) {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    this._currentPage = Math.min(totalPages, Math.max(1, page));
    this._renderPagination(this._filteredBeneficiarios.length);
    this._renderCurrentPage();
    this._persistirFiltros();
  },

  prevPage() {
    if (this._currentPage > 1) {
      this.goToPage(this._currentPage - 1);
    }
  },

  nextPage() {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    if (this._currentPage < totalPages) {
      this.goToPage(this._currentPage + 1);
    }
  },

  filterBySearch(query) {
    this._searchQuery = (query || "").trim().toLowerCase();
    const clearBtn = document.getElementById("btnPadronSearchClear");
    if (clearBtn) {
      clearBtn.style.display = this._searchQuery.length > 0 ? "flex" : "none";
    }
    this.applyFilters();
    // Se escribe el texto tal como se escribio, no _searchQuery: este ultimo va
    // en minusculas y sin espacios, y al recargar el buscador mostraria algo que
    // la persona nunca habia tecleado.
    this._persistirFiltros({ q: query || "" });
  },

  clearSearch() {
    const input = document.getElementById("inputPadronSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  toggleInnerDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const isCurrentlyOpen = dropdown.classList.contains("open");
    // Cerrar otros dropdowns internos abiertos
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => {
      if (d !== dropdown) d.classList.remove("open");
    });
    dropdown.classList.toggle("open", !isCurrentlyOpen);
  },

  toggleServicio(val) {
    const allServicios = ["desayuno", "casita", "pastoral"];
    if (val === "all") {
      this._filterServicio = [];
    } else {
      const idx = this._filterServicio.indexOf(val);
      if (idx > -1) {
        this._filterServicio.splice(idx, 1);
      } else {
        this._filterServicio.push(val);
      }
      // Si se seleccionaron individualmente todas las opciones, se restablece a Todos automáticamente
      if (allServicios.every(s => this._filterServicio.includes(s))) {
        this._filterServicio = [];
      }
    }
    this._updateServicioDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  _updateServicioDropdownUI() {
    const isAll = this._filterServicio.length === 0;
    const items = document.querySelectorAll("#menuPadronServicio .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterServicio.includes(v));
      }
    });

    const labelEl = document.getElementById("labelPadronServicioSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Servicios";
      } else if (this._filterServicio.length === 1) {
        const s = this._filterServicio[0];
        if (s === "desayuno") labelEl.textContent = "Servicio Alimentario Nutricional";
        else if (s === "casita") labelEl.textContent = "Servicio Acompañamiento Educativo";
        else if (s === "pastoral") labelEl.textContent = "Área Social Pastoral";
      } else {
        labelEl.textContent = `${this._filterServicio.length} seleccionados`;
      }
    }
  },

  toggleSede(val) {
    const allSedes = ["Año Nuevo", "La Libertad", "San Pedro", "El Progreso", "Santa Rosa", "Los Bendecidos"];
    if (val === "all") {
      this._filterSede = [];
    } else {
      const idx = this._filterSede.indexOf(val);
      if (idx > -1) {
        this._filterSede.splice(idx, 1);
      } else {
        this._filterSede.push(val);
      }
      // Si se seleccionaron individualmente todas las sedes, se restablece a Todas automáticamente
      if (allSedes.every(s => this._filterSede.includes(s))) {
        this._filterSede = [];
      }
    }
    this._updateSedeDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  _updateSedeDropdownUI() {
    const isAll = this._filterSede.length === 0;
    const items = document.querySelectorAll("#menuPadronSede .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterSede.includes(v));
      }
    });

    const labelEl = document.getElementById("labelPadronSedeSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todas las Sedes";
      } else if (this._filterSede.length === 1) {
        const s = this._filterSede[0];
        const dist = (s === "Año Nuevo" || s === "La Libertad") ? "Comas" : "Carabayllo";
        labelEl.textContent = `${s} (${dist})`;
      } else {
        labelEl.textContent = `${this._filterSede.length} seleccionadas`;
      }
    }
  },

  toggleAnemia(val) {
    const allAnemias = ["Normal", "Leve", "Moderada"];
    if (val === "all") {
      this._filterAnemia = [];
    } else {
      const idx = this._filterAnemia.indexOf(val);
      if (idx > -1) {
        this._filterAnemia.splice(idx, 1);
      } else {
        this._filterAnemia.push(val);
      }
      // Si se seleccionaron individualmente todas las opciones, se restablece a Todos automáticamente
      if (allAnemias.every(a => this._filterAnemia.includes(a))) {
        this._filterAnemia = [];
      }
    }
    this._updateAnemiaDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  _updateAnemiaDropdownUI() {
    const isAll = this._filterAnemia.length === 0;
    const items = document.querySelectorAll("#menuPadronAnemia .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAnemia.includes(v));
      }
    });

    const labelEl = document.getElementById("labelPadronAnemiaSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todas las Condiciones";
      } else if (this._filterAnemia.length === 1) {
        const a = this._filterAnemia[0];
        labelEl.textContent = a === "Moderada" ? "Mod / Severa" : a;
      } else {
        labelEl.textContent = `${this._filterAnemia.length} seleccionadas`;
      }
    }
  },

  setEdadExacta(val) {
    if (val === "" || val === null || val === undefined) {
      this._filterEdadModo = "all";
      this._filterEdadExacta = null;
      this._filterEdadRango = { min: 0, max: 18 };
      this._updateEdadUI();
      this.applyFilters();
      this._persistirFiltros();
      return;
    }

    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) {
      this._filterEdadModo = "all";
      this._filterEdadExacta = null;
    } else {
      this._filterEdadModo = "exacta";
      this._filterEdadExacta = Math.min(18, Math.max(0, num));
      // Al usar edad específica, reseteamos el rango a 0-18
      this._filterEdadRango = { min: 0, max: 18 };
    }
    this._updateEdadUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  syncEdadRango(handle, val) {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = handle === "min" ? 0 : 18;
    num = Math.min(18, Math.max(0, num));

    let min = this._filterEdadRango.min;
    let max = this._filterEdadRango.max;

    if (handle === "min") {
      min = num;
      if (min > max) {
        max = min;
        const maxInput = document.getElementById("sliderPadronEdadMax");
        if (maxInput) maxInput.value = max;
      }
    } else if (handle === "max") {
      max = num;
      if (max < min) {
        min = max;
        const minInput = document.getElementById("sliderPadronEdadMin");
        if (minInput) minInput.value = min;
      }
    }

    this._filterEdadRango = { min, max };
    // Al usar rango, borramos el dígito de edad específica
    this._filterEdadExacta = null;
    const numInput = document.getElementById("numPadronEdad");
    if (numInput) numInput.value = "";

    if (min === 0 && max === 18) {
      this._filterEdadModo = "all";
    } else {
      this._filterEdadModo = "rango";
    }

    this._updateEdadUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  clearEdad() {
    this._filterEdadModo = "all";
    this._filterEdadExacta = null;
    this._filterEdadRango = { min: 0, max: 18 };
    const numInput = document.getElementById("numPadronEdad");
    if (numInput) numInput.value = "";
    this._updateEdadUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  _updateEdadUI() {
    const btnTodas = document.getElementById("btnPadronEdadTodas");
    const numInput = document.getElementById("numPadronEdad");
    const sliderMin = document.getElementById("sliderPadronEdadMin");
    const sliderMax = document.getElementById("sliderPadronEdadMax");
    const highlight = document.getElementById("sliderPadronEdadHighlight");
    const labelSlider = document.getElementById("labelPadronEdadSliderVal");

    const isAll = this._filterEdadModo === "all";
    if (btnTodas) btnTodas.classList.toggle("active", isAll);

    if (this._filterEdadModo === "exacta") {
      if (numInput && this._filterEdadExacta !== null) numInput.value = this._filterEdadExacta;
      if (sliderMin) sliderMin.value = 0;
      if (sliderMax) sliderMax.value = 18;
      if (highlight) {
        highlight.style.left = "0%";
        highlight.style.right = "0%";
      }
      if (labelSlider) labelSlider.textContent = "0 a 18 años";
    } else if (this._filterEdadModo === "rango") {
      if (numInput) numInput.value = "";
      const { min, max } = this._filterEdadRango;
      if (sliderMin) sliderMin.value = min;
      if (sliderMax) sliderMax.value = max;
      if (highlight) {
        const leftPct = (min / 18) * 100;
        const rightPct = 100 - (max / 18) * 100;
        highlight.style.left = `${leftPct}%`;
        highlight.style.right = `${rightPct}%`;
      }
      if (labelSlider) {
        labelSlider.textContent = min === max ? `Exactamente ${min} años` : `${min} a ${max} años`;
      }
    } else { // "all"
      if (numInput) numInput.value = "";
      if (sliderMin) sliderMin.value = 0;
      if (sliderMax) sliderMax.value = 18;
      if (highlight) {
        highlight.style.left = "0%";
        highlight.style.right = "0%";
      }
      if (labelSlider) labelSlider.textContent = "0 a 18 años";
    }
  },

  selectEstado(estadoVal) {
    this._filterEstado = estadoVal || "all";
    this._updateEstadoUI();

    // Cerrar dropdown de estado al seleccionar
    const drop = document.getElementById("dropdownPadronEstado");
    if (drop) drop.classList.remove("open");

    this.applyFilters();
    this._persistirFiltros();
  },

  /** Pinta el desplegable y la etiqueta del filtro de estado. */
  _updateEstadoUI() {
    const items = document.querySelectorAll("#menuPadronEstado .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterEstado);
    });

    const labelEl = document.getElementById("labelPadronEstadoSelect");
    if (labelEl) {
      if (this._filterEstado === "all") labelEl.textContent = "Todos los Estados";
      else if (this._filterEstado === "Activo") labelEl.textContent = "Activo";
      else if (this._filterEstado === "Inactivo") labelEl.textContent = "Inactivo / Baja";
    }
  },

  selectSexo(sexoVal) {
    this._filterSexo = sexoVal || "all";
    this._updateSexoDropdownUI();

    const drop = document.getElementById("dropdownPadronSexo");
    if (drop) drop.classList.remove("open");

    this.applyFilters();
    this._persistirFiltros();
  },

  _updateSexoDropdownUI() {
    const items = document.querySelectorAll("#menuPadronSexo .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterSexo);
    });
    const labelEl = document.getElementById("labelPadronSexoSelect");
    if (labelEl) {
      if (this._filterSexo === "all") labelEl.textContent = "Todos";
      else if (this._filterSexo === "M") labelEl.textContent = "Niños (M)";
      else if (this._filterSexo === "F") labelEl.textContent = "Niñas (F)";
    }
  },

  removeFilter(filterKey, specificVal) {
    if (filterKey === "search") this.clearSearch();
    if (filterKey === "servicio") {
      if (specificVal) {
        this.toggleServicio(specificVal);
      } else {
        this.toggleServicio("all");
      }
    }
    if (filterKey === "sede") {
      if (specificVal) {
        this.toggleSede(specificVal);
      } else {
        this.toggleSede("all");
      }
    }
    if (filterKey === "anemia") {
      if (specificVal) {
        this.toggleAnemia(specificVal);
      } else {
        this.toggleAnemia("all");
      }
    }
    if (filterKey === "edad") this.clearEdad();
    if (filterKey === "estado") this.selectEstado("all");
    if (filterKey === "sexo") this.selectSexo("all");
  },

  resetFilters() {
    this._searchQuery = "";
    this._filterServicio = [];
    this._filterSede = [];
    this._filterAnemia = [];
    this._filterEdadModo = "all";
    this._filterEdadExacta = null;
    this._filterEdadRango = { min: 0, max: 18 };
    this._filterEstado = "all";
    this._filterSexo = "all";

    const input = document.getElementById("inputPadronSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnPadronSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this._updateServicioDropdownUI();
    this._updateSedeDropdownUI();
    this._updateAnemiaDropdownUI();
    this._updateEdadUI();
    this._updateSexoDropdownUI();
    this._updateEstadoUI();

    // Cerrar cualquier dropdown interno que haya quedado abierto
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this.applyFilters();
    this._persistirFiltros();
  },

  _matchesServicio(beneficiario, servicioKeys) {
    if (!servicioKeys || servicioKeys.length === 0) return true;
    const servs = Array.isArray(beneficiario.servicios) ? beneficiario.servicios : [];
    return servicioKeys.some(key => {
      if (key === "desayuno") {
        return servs.some(s => {
          const low = (s || "").toLowerCase();
          return s === "Servicio Alimentario Nutricional" || low.includes("desayuno") || low.includes("alimento") || low.includes("nutric") || low.includes("lonchera");
        });
      }
      if (key === "casita") {
        return servs.some(s => {
          const low = (s || "").toLowerCase();
          return s === "Servicio Acompañamiento Educativo" || low.includes("casita") || low.includes("educativ") || low.includes("acompañ") || low.includes("refuerzo");
        });
      }
      if (key === "pastoral") {
        return servs.some(s => {
          const low = (s || "").toLowerCase();
          return s === "Área Social Pastoral" || low.includes("pastoral") || low.includes("social") || low.includes("asp");
        }) || (beneficiario.vulnerabilidad && beneficiario.vulnerabilidad >= 80);
      }
      return false;
    });
  },

  _getServiciosBadgesHtml(servicios) {
    const list = Array.isArray(servicios) ? servicios : [];
    if (list.length === 0) {
      return `<span class="badge" style="background:var(--surface-2); color:var(--text-dim); border:1px dashed var(--border-subtle); font-size:10.5px;">Sin servicios activos</span>`;
    }
    return list.map(s => {
      const low = (s || "").toLowerCase();
      let badgeCls = "badge-blue";
      if (s === "Servicio Alimentario Nutricional" || low.includes("nutric") || low.includes("aliment") || low.includes("desayuno") || low.includes("lonchera")) {
        badgeCls = "badge-green";
      } else if (s === "Área Social Pastoral" || low.includes("pastoral") || low.includes("social") || low.includes("asp")) {
        badgeCls = "badge-red";
      } else {
        badgeCls = "badge-blue";
      }
      return `<span class="badge ${badgeCls}">${s}</span>`;
    }).join("");
  },

  _matchesAnemia(beneficiario, anemiaKeys) {
    if (!anemiaKeys || anemiaKeys.length === 0) return true;
    return anemiaKeys.some(key => {
      if (key === "Moderada") {
        return beneficiario.anemia === "Moderada" || beneficiario.anemia === "Severa";
      }
      return beneficiario.anemia === key;
    });
  },

  applyFilters(resetPage = true) {
    if (resetPage) {
      this._currentPage = 1;
    }
    let list = [...this._allBeneficiarios];

    // 1. Buscador texto libre
    if (this._searchQuery) {
      const q = this._searchQuery;
      list = list.filter(b => {
        const full = `${b.nombres} ${b.apellidos} ${b.codigo} ${b.dni} ${b.sede} ${b.distrito} ${b.apoderado}`.toLowerCase();
        return full.includes(q);
      });
    }

    // 2. Servicio / Programa (Multi-selección)
    if (this._filterServicio.length > 0) {
      list = list.filter(b => this._matchesServicio(b, this._filterServicio));
    }

    // 3. Sede Operativa (Multi-selección)
    if (this._filterSede.length > 0) {
      list = list.filter(b => b.sede && this._filterSede.some(s => b.sede.toLowerCase().includes(s.toLowerCase())));
    }

    // 4. Condición Nutricional (Anemia - Multi-selección)
    if (this._filterAnemia.length > 0) {
      list = list.filter(b => this._matchesAnemia(b, this._filterAnemia));
    }

    // 5. Edad (Exacta o Rango)
    if (this._filterEdadModo === "exacta" && this._filterEdadExacta !== null) {
      const targetEdad = this._filterEdadExacta;
      list = list.filter(b => {
        const numEdad = parseInt(b.edad, 10);
        return !isNaN(numEdad) && numEdad === targetEdad;
      });
    } else if (this._filterEdadModo === "rango") {
      const { min, max } = this._filterEdadRango;
      list = list.filter(b => {
        const numEdad = parseInt(b.edad, 10);
        return !isNaN(numEdad) && numEdad >= min && numEdad <= max;
      });
    }

    // 6. Estado
    if (this._filterEstado !== "all") {
      list = list.filter(b => b.estado === this._filterEstado);
    }

    // 7. Sexo (Niñas F / Niños M)
    if (this._filterSexo !== "all") {
      list = list.filter(b => (b.sexo || "").toUpperCase() === this._filterSexo.toUpperCase());
    }

    this._filteredBeneficiarios = list;

    // Actualizar badge de filtros activos
    let activeFiltersCount = 0;
    if (this._filterServicio.length > 0) activeFiltersCount += this._filterServicio.length;
    if (this._filterSede.length > 0) activeFiltersCount += this._filterSede.length;
    if (this._filterAnemia.length > 0) activeFiltersCount += this._filterAnemia.length;
    if (this._filterEdadModo !== "all") activeFiltersCount++;
    if (this._filterEstado !== "all") activeFiltersCount++;
    if (this._filterSexo !== "all") activeFiltersCount++;

    const badgeEl = document.getElementById("padronActiveFiltersCount");
    const btnFilterEl = document.getElementById("btnDropdownPadronFilterPanel");

    if (badgeEl) {
      badgeEl.textContent = activeFiltersCount;
      badgeEl.style.display = activeFiltersCount > 0 ? "inline-flex" : "none";
    }
    if (btnFilterEl) {
      btnFilterEl.classList.toggle("has-filters", activeFiltersCount > 0);
    }

    this._updateFacetCounts();
    this._renderActiveChips();

    // Validar rango de página actual
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    if (this._currentPage > totalPages) {
      this._currentPage = totalPages;
    }
    if (this._currentPage < 1) {
      this._currentPage = 1;
    }

    this._renderPagination(this._filteredBeneficiarios.length);
    this._renderCurrentPage();
  },

  _renderCurrentPage() {
    const list = this._filteredBeneficiarios || [];
    const pageSize = this._getEffectivePageSize();
    const startIndex = (this._currentPage - 1) * pageSize;
    const pageItems = list.slice(startIndex, startIndex + pageSize);
    this._renderFilteredList(pageItems, list.length);
  },

  _renderPagination(totalCount) {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startRecord = totalCount === 0 ? 0 : (this._currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(totalCount, this._currentPage * pageSize);

    const infoEl = document.getElementById("padronPaginationInfo");
    if (infoEl) {
      infoEl.textContent = totalCount === 0
        ? "Mostrando 0 de 0 beneficiarios"
        : `Mostrando ${startRecord}–${endRecord} de ${totalCount} beneficiarios`;
    }

    const pageNumEl = document.getElementById("padronCurrentPageNum");
    if (pageNumEl) {
      pageNumEl.textContent = `Página ${this._currentPage} de ${totalPages}`;
    }

    const btnPrev = document.getElementById("btnPadronPagePrev");
    if (btnPrev) {
      btnPrev.disabled = this._currentPage <= 1 || totalCount === 0;
    }

    const btnNext = document.getElementById("btnPadronPageNext");
    if (btnNext) {
      btnNext.disabled = this._currentPage >= totalPages || totalCount === 0;
    }

    this._syncPageSizeSelectUI();
  },

  _updateFacetCounts() {
    // Calculo facetado con respecto a los otros filtros activos excepto la propia categoría
    const getFilteredExcluding = (excludeKey) => {
      let l = [...this._allBeneficiarios];
      if (this._searchQuery) {
        const q = this._searchQuery;
        l = l.filter(b => `${b.nombres} ${b.apellidos} ${b.codigo} ${b.dni} ${b.sede} ${b.distrito} ${b.apoderado}`.toLowerCase().includes(q));
      }
      if (excludeKey !== "servicio" && this._filterServicio.length > 0) {
        l = l.filter(b => this._matchesServicio(b, this._filterServicio));
      }
      if (excludeKey !== "sede" && this._filterSede.length > 0) {
        l = l.filter(b => b.sede && this._filterSede.some(s => b.sede.toLowerCase().includes(s.toLowerCase())));
      }
      if (excludeKey !== "anemia" && this._filterAnemia.length > 0) {
        l = l.filter(b => this._matchesAnemia(b, this._filterAnemia));
      }
      if (excludeKey !== "edad") {
        if (this._filterEdadModo === "exacta" && this._filterEdadExacta !== null) {
          const tEdad = this._filterEdadExacta;
          l = l.filter(b => (parseInt(b.edad, 10) || 0) === tEdad);
        } else if (this._filterEdadModo === "rango") {
          const { min, max } = this._filterEdadRango;
          l = l.filter(b => {
            const numEdad = parseInt(b.edad, 10);
            return !isNaN(numEdad) && numEdad >= min && numEdad <= max;
          });
        }
      }
      if (excludeKey !== "estado" && this._filterEstado !== "all") {
        l = l.filter(b => b.estado === this._filterEstado);
      }
      if (excludeKey !== "sexo" && this._filterSexo !== "all") {
        l = l.filter(b => (b.sexo || "").toUpperCase() === this._filterSexo.toUpperCase());
      }
      return l;
    };

    // 1. Facetas de Servicio
    const forServ = getFilteredExcluding("servicio");
    const countServDesayuno = forServ.filter(b => this._matchesServicio(b, ["desayuno"])).length;
    const countServCasita = forServ.filter(b => this._matchesServicio(b, ["casita"])).length;
    const countServPastoral = forServ.filter(b => this._matchesServicio(b, ["pastoral"])).length;

    this._setFacetBadge("countFacetServicio-all", `(${forServ.length})`, forServ.length === 0);
    this._setFacetBadge("countFacetServicio-desayuno", `(${countServDesayuno})`, countServDesayuno === 0);
    this._setFacetBadge("countFacetServicio-casita", `(${countServCasita})`, countServCasita === 0);
    this._setFacetBadge("countFacetServicio-pastoral", `(${countServPastoral})`, countServPastoral === 0);

    // 2. Facetas de Sede
    const forSede = getFilteredExcluding("sede");
    this._setFacetBadge("countFacetSede-all", `(${forSede.length})`, forSede.length === 0);
    this._setFacetBadge("countFacetSede-Año Nuevo", `(${forSede.filter(b => (b.sede || '').includes("Año Nuevo")).length})`, forSede.filter(b => (b.sede || '').includes("Año Nuevo")).length === 0);
    this._setFacetBadge("countFacetSede-La Libertad", `(${forSede.filter(b => (b.sede || '').includes("La Libertad")).length})`, forSede.filter(b => (b.sede || '').includes("La Libertad")).length === 0);
    this._setFacetBadge("countFacetSede-San Pedro", `(${forSede.filter(b => (b.sede || '').includes("San Pedro")).length})`, forSede.filter(b => (b.sede || '').includes("San Pedro")).length === 0);
    this._setFacetBadge("countFacetSede-El Progreso", `(${forSede.filter(b => (b.sede || '').includes("El Progreso")).length})`, forSede.filter(b => (b.sede || '').includes("El Progreso")).length === 0);
    this._setFacetBadge("countFacetSede-Santa Rosa", `(${forSede.filter(b => (b.sede || '').includes("Santa Rosa")).length})`, forSede.filter(b => (b.sede || '').includes("Santa Rosa")).length === 0);
    this._setFacetBadge("countFacetSede-Los Bendecidos", `(${forSede.filter(b => (b.sede || '').includes("Los Bendecidos")).length})`, forSede.filter(b => (b.sede || '').includes("Los Bendecidos")).length === 0);

    // 3. Facetas de Anemia
    const forAnemia = getFilteredExcluding("anemia");
    this._setFacetBadge("countFacetAnemia-all", `(${forAnemia.length})`, forAnemia.length === 0);
    this._setFacetBadge("countFacetAnemia-Normal", `(${forAnemia.filter(b => b.anemia === "Normal").length})`, forAnemia.filter(b => b.anemia === "Normal").length === 0);
    this._setFacetBadge("countFacetAnemia-Leve", `(${forAnemia.filter(b => b.anemia === "Leve").length})`, forAnemia.filter(b => b.anemia === "Leve").length === 0);
    this._setFacetBadge("countFacetAnemia-Moderada", `(${forAnemia.filter(b => b.anemia === "Moderada" || b.anemia === "Severa").length})`, forAnemia.filter(b => b.anemia === "Moderada" || b.anemia === "Severa").length === 0);

    // 4. Facetas de Estado
    const forEstado = getFilteredExcluding("estado");
    this._setFacetBadge("countFacetEstado-all", `(${forEstado.length})`, forEstado.length === 0);
    this._setFacetBadge("countFacetEstado-Activo", `(${forEstado.filter(b => b.estado === "Activo").length})`, forEstado.filter(b => b.estado === "Activo").length === 0);
    this._setFacetBadge("countFacetEstado-Inactivo", `(${forEstado.filter(b => b.estado === "Inactivo").length})`, forEstado.filter(b => b.estado === "Inactivo").length === 0);

    // 5. Facetas de Sexo
    const forSexo = getFilteredExcluding("sexo");
    this._setFacetBadge("countFacetSexo-all", `(${forSexo.length})`, forSexo.length === 0);
    this._setFacetBadge("countFacetSexo-M", `(${forSexo.filter(b => (b.sexo || '').toUpperCase() === 'M').length})`, forSexo.filter(b => (b.sexo || '').toUpperCase() === 'M').length === 0);
    this._setFacetBadge("countFacetSexo-F", `(${forSexo.filter(b => (b.sexo || '').toUpperCase() === 'F').length})`, forSexo.filter(b => (b.sexo || '').toUpperCase() === 'F').length === 0);
  },

  _setFacetBadge(id, text, isZero) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`[BeneficiariosView] Faceta sin elemento en el DOM: #${id}`);
      return;
    }
    el.textContent = text;
    const parentItem = el.closest(".padron-dropdown-item");
    if (parentItem && parentItem.getAttribute("data-value") !== "all") {
      parentItem.classList.toggle("zero-facet", isZero);
    }
  },

  _renderActiveChips() {
    const bar = document.getElementById("padronActiveChipsBar");
    const list = document.getElementById("padronActiveChipsList");
    if (!bar || !list) return;

    const chips = [];


    if (this._filterServicio.length > 0) {
      this._filterServicio.forEach(s => {
        let servLabel = "Servicio";
        if (s === "desayuno") servLabel = "Servicio Alimentario Nutricional";
        if (s === "casita") servLabel = "Servicio Acompañamiento Educativo";
        if (s === "pastoral") servLabel = "Área Social Pastoral";
        chips.push({
          id: "servicio",
          val: s,
          label: `Programa: ${servLabel}`,
        });
      });
    }

    if (this._filterSede.length > 0) {
      this._filterSede.forEach(s => {
        const dist = (s === "Año Nuevo" || s === "La Libertad") ? "Comas" : "Carabayllo";
        chips.push({
          id: "sede",
          val: s,
          label: `Sede: ${s} (${dist})`,
        });
      });
    }

    if (this._filterAnemia.length > 0) {
      this._filterAnemia.forEach(a => {
        chips.push({
          id: "anemia",
          val: a,
          label: `Anemia: ${a === "Moderada" ? "Mod / Severa" : a}`,
        });
      });
    }

    if (this._filterEdadModo === "exacta" && this._filterEdadExacta !== null) {
      chips.push({
        id: "edad",
        label: `Edad: ${this._filterEdadExacta} años`,
      });
    } else if (this._filterEdadModo === "rango") {
      const { min, max } = this._filterEdadRango;
      chips.push({
        id: "edad",
        label: min === max ? `Edad: ${min} años` : `Edad: ${min} a ${max} años`,
      });
    }

    if (this._filterEstado !== "all") {
      chips.push({
        id: "estado",
        label: `Estado: ${this._filterEstado === "Inactivo" ? "Inactivo / Baja" : this._filterEstado}`,
      });
    }

    if (this._filterSexo !== "all") {
      chips.push({
        id: "sexo",
        label: `Sexo: ${this._filterSexo === "F" ? "Niñas (F)" : "Niños (M)"}`,
      });
    }

    if (chips.length === 0) {
      bar.style.display = "none";
      list.innerHTML = "";
    } else {
      bar.style.display = "flex";
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${chip.label}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removePadronChip ? window.removePadronChip('${chip.id}', '${chip.val || ''}') : null" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      `).join("");
    }
  },

  _renderFilteredList(beneficiarios, totalCount) {
    const tbody = document.getElementById("tbodyBeneficiarios");
    const mobileContainer = document.getElementById("mobileCardsBeneficiarios");

    const badgeTotal = document.getElementById("badgeTotalBeneficiarios");
    if (badgeTotal) badgeTotal.textContent = totalCount !== undefined ? totalCount : beneficiarios.length;

    // Solo se dibuja la variante que se va a ver. La otra se deja vacia a
    // proposito: en escritorio la lista de tarjetas ocupaba 546 de los 1794
    // nodos del documento y 50 KB de marcado, y se regeneraba en cada pulsacion
    // del buscador. Al cruzar el corte, _vigilarVariante() repinta.
    const enMovil = Responsive.esMovil();

    // La que no se dibuja se vacia, y no se deja con lo que hubiera de antes.
    // Sin esto, girar el movil con la ventana sola dejaria las dos variantes
    // pintadas y se perderia justo el ahorro que motiva esto.
    if (enMovil) { if (tbody) tbody.innerHTML = ""; }
    else { if (mobileContainer) mobileContainer.innerHTML = ""; }

    // 1. Tabla tradicional para pantallas grandes (Desktop)
    if (tbody && !enMovil) {
      if (beneficiarios.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 32px 16px; color: var(--text-dim);">
              <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 8px; display:block; opacity:0.6;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              No se encontraron beneficiarios con los filtros seleccionados.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = beneficiarios.map(b => `
          <tr>
            <td><strong style="font-family:var(--mono-font); color:var(--gt-green);">${b.codigo}</strong></td>
            <td><strong>${b.nombres} ${b.apellidos}</strong></td>
            <td>${b.dni}</td>
            <td>${b.edad} / ${b.sexo}</td>
            <td>${b.distrito}: ${b.sede}</td>
            <td>
              <div class="servicios-badge-group">
                ${this._getServiciosBadgesHtml(b.servicios)}
              </div>
            </td>
            <td><span class="badge ${b.estado === 'Activo' ? 'badge-green' : 'badge-yellow'}">${b.estado}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn-action" onclick="window.openExpediente(${b.id})">
                Ver Expediente
              </button>
            </td>
          </tr>
        `).join("");
      }
    }

    // 2. Lista de tarjetas Data Card para teléfonos móviles (Patrón Beezlebub)
    if (mobileContainer && enMovil) {
      if (beneficiarios.length === 0) {
        mobileContainer.innerHTML = `
          <div style="text-align: center; padding: 28px 14px; color: var(--text-dim); background: var(--surface-1); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            No se encontraron beneficiarios con los criterios seleccionados.
          </div>
        `;
      } else {
        mobileContainer.innerHTML = beneficiarios.map(b => `
          <div class="mobile-card-item" id="mobile-card-${b.id}">
            <!-- Cabecera: ID + Badge Estado -->
            <div class="datacard-header">
              <div class="datacard-id">
                <span>ID:</span> ${b.codigo}
              </div>
              <div class="datacard-header-right">
                <span class="badge ${b.estado === 'Activo' ? 'badge-green' : 'badge-yellow'}">${b.estado}</span>
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
                  <div class="servicios-badge-group align-end">
                    ${this._getServiciosBadgesHtml(b.servicios)}
                  </div>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Seguro de Salud</span>
                  <span class="datacard-value">${b.seguro || 'SIS Gratuito'}</span>
                </div>
                <div class="datacard-actions-footer">
                  <button type="button" class="btn-action primary" style="width:100%; justify-content:center;" onclick="event.stopPropagation(); window.openExpediente(${b.id})">
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

  window.padronSetPageSize = (size) => BeneficiariosView.setPageSize(size);
  window.padronPrevPage = () => BeneficiariosView.prevPage();
  window.padronNextPage = () => BeneficiariosView.nextPage();
  window.selectPadronSexo = (sexo) => BeneficiariosView.selectSexo(sexo);

  window.addEventListener("resize", () => {
    BeneficiariosView._syncPageSizeSelectUI();
  });
}
