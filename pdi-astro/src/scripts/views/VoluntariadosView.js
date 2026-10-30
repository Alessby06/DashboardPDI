// Vista: Padrón y Gestión de Voluntariados y Personal Comunitario (PDI)
// Asociación Cultural Johannes Gutenberg - Lima Norte

import { VoluntarioModel, TEMATICAS_CAPACITACION } from '../models/VoluntarioModel.js';
import { crear as crearFiltros } from '../utils/Filters.js';
import { crearStore } from '../utils/FilterStore.js';
import { Responsive } from '../utils/Responsive.js';
import { AnimationEngine } from '../utils/AnimationEngine.js';
import { ToastView } from './ToastView.js';
import { AuditModel } from '../models/AuditModel.js';
import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";
import { OPCIONES_VOLUNTARIADO, SERVICIOS_VOLUNTARIADO } from '../../data/opcionesBeneficiario.js';
import { SEDES_POR_DISTRITO, etiquetaSede } from '../core/catalogos.js';
import { contarOpciones } from "../utils/FacetCounts.js";
import { iconHtml } from '../../data/iconos.js';
// Etiquetas de servicio desde el catálogo único de programas: un programa
// nuevo aparece en chips y desplegables sin tocar nada aquí.
const SERVICIO_LABELS = Object.fromEntries(
  OPCIONES_VOLUNTARIADO.map((opcion) => [opcion.valor, opcion.etiqueta]),
);

// Filtros del padrón de voluntarios que viajan en la URL.
const FILTROS_VOLUNTARIOS = {
  q:        { valor: "" },
  distrito: { valor: [], valores: Object.keys(SEDES_POR_DISTRITO), multiple: true },
  servicio: { valor: [], valores: SERVICIOS_VOLUNTARIADO, multiple: true },
  // El rol no tiene desplegable: se marca desde las pildoras de cada fila, asi
  // que el dominio son los roles que existan en los datos, no una lista cerrada.
  // Por eso se declara sin `valores` y Filters.js lo acota por longitud y
  // caracteres. Fijar aqui una lista seria hacer que un rol nuevo no se pudiera
  // filtrar ni compartir por enlace.
  rol:      { valor: [], multiple: true },
  estado:   { valor: "all", valores: ["all", "Activo", "En Pausa"] },
};

/**
 * Reparte 100% entre varios conteos con el metodo del mayor resto. Evita que
 * la barra muestre 50 + 38 + 13 = 101% o que tres porcentajes sumen 99%.
 */
function repartirPorcentajes(valores) {
  const total = valores.reduce((suma, valor) => suma + (Number(valor) || 0), 0);
  if (!total) return valores.map(() => 0);

  const exactos = valores.map((valor) => ((Number(valor) || 0) / total) * 100);
  const base = exactos.map((valor) => Math.floor(valor));
  let resto = 100 - base.reduce((suma, valor) => suma + valor, 0);
  const orden = exactos
    .map((valor, indice) => ({ indice, fraccion: valor - Math.floor(valor) }))
    .sort((a, b) => b.fraccion - a.fraccion);

  for (let i = 0; i < resto; i += 1) {
    base[orden[i % orden.length].indice] += 1;
  }
  return base;
}

const FACETAS_VOLUNTARIOS = {
  distrito: { tipo: "multi", opciones: Object.keys(SEDES_POR_DISTRITO), defecto: [] },
  servicio: { tipo: "multi", opciones: SERVICIOS_VOLUNTARIADO, defecto: [] },
  rol: { tipo: "multi", defecto: [] },
  estado: { tipo: "single", opciones: FILTROS_VOLUNTARIOS.estado.valores, defecto: "all" },
};

export const VoluntariadosView = {
  _voluntarios: [],
  _searchQuery: "",
  _filterDistrito: [],
  _filterServicio: [],
  _filterRol: [],
  _filterEstado: "all",
  _filteredList: [],
  _haEntrado: false,
  _lastRenderSerial: "",
  _currentPage: 1,
  _pageSize: 20,
  _guardando: false,

  reiniciarEntrada() {
    this._haEntrado = false;
    this._lastRenderSerial = "";
  },

  _getEffectivePageSize() {
    if (Responsive.esMovil()) {
      return Math.min(20, this._pageSize || 20);
    }
    return Math.min(50, this._pageSize || 20);
  },

  _syncPageSizeSelectUI() {
    const select = document.getElementById("selectVoluntariosPageSize");
    if (select) {
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
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
  },

  goToPage(page) {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredList.length / pageSize));
    this._currentPage = Math.min(totalPages, Math.max(1, page));
    this._renderTableAndCards(this._filteredList);
  },

  prevPage() {
    if (this._currentPage > 1) {
      this.goToPage(this._currentPage - 1);
    }
  },

  nextPage() {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredList.length / pageSize));
    if (this._currentPage < totalPages) {
      this.goToPage(this._currentPage + 1);
    }
  },

  _renderPagination(totalCount) {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startRecord = totalCount === 0 ? 0 : (this._currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(totalCount, this._currentPage * pageSize);

    const infoEl = document.getElementById("voluntariosPaginationInfo");
    if (infoEl) {
      infoEl.textContent = totalCount === 0
        ? "Mostrando 0 de 0 voluntarios"
        : `Mostrando ${startRecord}–${endRecord} de ${totalCount} voluntarios`;
    }

    const pageNumEl = document.getElementById("voluntariosCurrentPageNum");
    if (pageNumEl) {
      pageNumEl.textContent = `Página ${this._currentPage} de ${totalPages}`;
    }

    const btnPrev = document.getElementById("btnVoluntariosPagePrev");
    if (btnPrev) {
      btnPrev.disabled = this._currentPage <= 1 || totalCount === 0;
    }

    const btnNext = document.getElementById("btnVoluntariosPageNext");
    if (btnNext) {
      btnNext.disabled = this._currentPage >= totalPages || totalCount === 0;
    }

    this._syncPageSizeSelectUI();
  },

  // Estado de edicion en curso. No va en la URL: es un modal, no una vista, y
  // relajar a alguien a mitad de una ficha es peor que no recorderlo.
  _currentEditingId: null,

  _filtros: null,
  _filtrosLeidos: false,

  _store: null,

  _obtenerStore() {
    if (!this._store) {
      this._store = crearStore(FACETAS_VOLUNTARIOS);
    }
    return this._store;
  },

  _espejarStore() {
    const s = this._obtenerStore().instantanea();
    this._filterDistrito = s.distrito;
    this._filterServicio = s.servicio;
    this._filterRol = s.rol;
    this._filterEstado = s.estado;
  },

  _obtenerFiltros() {
    if (!this._filtros) {
      this._filtros = crearFiltros(FILTROS_VOLUNTARIOS);
    }
    return this._filtros;
  },

  _persistirFiltros(extra) {
    this._obtenerFiltros().escribir({
      q: this._searchQuery,
      distrito: this._filterDistrito,
      servicio: this._filterServicio,
      rol: this._filterRol,
      estado: this._filterEstado,
      ...(extra || {}),
    });
  },

  _leerFiltrosDeURL() {
    if (this._filtrosLeidos) return;
    this._filtrosLeidos = true;

    const f = this._obtenerFiltros().leer();
    this._searchQuery = (f.q || "").toLowerCase();
    this._obtenerStore().cargar({
      distrito: f.distrito,
      servicio: f.servicio,
      rol: f.rol,
      estado: f.estado,
    });
    this._espejarStore();

    const input = document.getElementById("inputVoluntariosSearch");
    if (input) input.value = f.q;
    const clearBtn = document.getElementById("btnVoluntariosSearchClear");
    if (clearBtn) clearBtn.style.display = f.q ? "inline-flex" : "none";

    this._updateFilterDropdownUI();
  },

  init(voluntarios) {
    this._voluntarios = voluntarios || VoluntarioModel.getAll();
    this._attachEventListeners();
  },

  _attachEventListeners() {
    // Search input
    const searchInput = document.getElementById("inputVoluntariosSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this._searchQuery = e.target.value.toLowerCase().trim();
        const clearBtn = document.getElementById("btnVoluntariosSearchClear");
        if (clearBtn) clearBtn.style.display = this._searchQuery ? "inline-flex" : "none";
        this.applyFilters();
        this._persistirFiltros({ q: e.target.value });
      });
    }

    // Close dropdowns on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-dropdown")) {
        document.querySelectorAll(".custom-dropdown.open").forEach(d => {
          if (d.id.startsWith("dropdownVoluntarios") || d.id === "dropdownVoluntariosFilterPanel") {
            d.classList.remove("open");
          }
        });
      }
    });
  },

  render(forzarAnimacion = false) {
    const esPrimeraEntrada = !this._haEntrado || forzarAnimacion;
    this._haEntrado = true;

    this._leerFiltrosDeURL();
    this._voluntarios = VoluntarioModel.getAll();
    this._renderReparto(esPrimeraEntrada);
    this._renderActiveChips();
    this._vigilarVariante();
    this.applyFilters(esPrimeraEntrada);
  },

  /**
   * Se suscribe una sola vez por carga al cruce del corte de 768 px. Cuando se
   * cruza hay que repintar, porque la variante que estaba vacia es la que pasa
   * a verse: solo se dibuja la que se ve, y no las dos.
   */
  _vigilarVariante() {
    if (this._vigilaVariante) return;
    this._vigilaVariante = true;
    Responsive.alCambiarDeVariante(() => this.applyFilters(false));
  },

  _renderReparto(animar = false) {
    const stats = VoluntarioModel.getStats();

    // Reparto en campo: el dato se lee como asignacion operativa, no como metrica de gestion.
    const setTexto = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };

    setTexto("volRepartoTotal", stats.total);
    setTexto("volRepartoPausa", stats.enPausa);

    const valores = [stats.desayuno, stats.casita, stats.pastoral, stats.otros];
    const pcts = repartirPorcentajes(valores);
    const grupos = [
      { count: stats.desayuno, barId: "volRepartoBarFood",   countId: "volRepartoDesayuno", pctId: "volRepartoPctDesayuno" },
      { count: stats.casita,   barId: "volRepartoBarCasita", countId: "volRepartoCasita",   pctId: "volRepartoPctCasita" },
      { count: stats.pastoral, barId: "volRepartoBarAsp",    countId: "volRepartoAsp",      pctId: "volRepartoPctAsp" },
      { count: stats.otros,    barId: "volRepartoBarOtros",  countId: "volRepartoOtros",    pctId: "volRepartoPctOtros" },
    ];

    grupos.forEach((grupo, indice) => {
      setTexto(grupo.countId, grupo.count);
      setTexto(grupo.pctId, `${pcts[indice]}%`);

      const el = document.getElementById(grupo.barId);
      if (!el) return;
      const ancho = stats.total > 0 ? (grupo.count / stats.total) * 100 : 0;
      if (animar) {
        el.style.width = "0%";
        requestAnimationFrame(() => { el.style.width = `${ancho}%`; });
      } else {
        el.style.width = `${ancho}%`;
      }
    });

    // "Otros" solo ocupa espacio cuando hay servicios fuera de los tres
    // programas principales; si no, la barra y la lista mantienen su forma.
    const hayOtros = stats.otros > 0;
    const filaOtros = document.getElementById("volRepartoRowOtros");
    if (filaOtros) filaOtros.hidden = !hayOtros;
    const barraOtros = document.getElementById("volRepartoBarOtros");
    if (barraOtros) barraOtros.hidden = !hayOtros;

    const barra = document.querySelector(".vol-reparto-bar");
    if (barra) {
      const detalle = [
        `${pcts[0]}% Servicio Alimentario`,
        `${pcts[1]}% Casita del Saber`,
        `${pcts[2]}% Área Social Pastoral`,
        hayOtros ? `${pcts[3]}% otros servicios` : "",
      ].filter(Boolean).join(", ");
      barra.setAttribute("aria-label", `Composición del voluntariado por servicio: ${detalle}.`);
    }

    setTexto("volRepartoComas", stats.comas);
    setTexto("volRepartoCarabayllo", stats.carabayllo);
    setTexto("volRepartoCanastas", stats.canastasTotal);

    const badgeNav = document.getElementById("badgeTotalVoluntarios");
    if (badgeNav) badgeNav.textContent = stats.total;
  },

  /** Busqueda comun a la lista y a los contadores de faceta. */
  _aplicaBusqueda(lista) {
    if (!this._searchQuery) return lista;
    const normalize = s => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const q = normalize(this._searchQuery);
    return lista.filter(v => {
      const fullName = `${normalize(v.nombres)} ${normalize(v.apellidos)}`;
      const reverseName = `${normalize(v.apellidos)} ${normalize(v.nombres)}`;
      return fullName.includes(q) ||
        reverseName.includes(q) ||
        (v.dni && v.dni.includes(q)) ||
        (v.codigo && normalize(v.codigo).includes(q)) ||
        (v.sedeAsignada && normalize(v.sedeAsignada).includes(q)) ||
        (v.distrito && normalize(v.distrito).includes(q)) ||
        (v.servicio && normalize(v.servicio).includes(q)) ||
        (v.rol && normalize(v.rol).includes(q)) ||
        (v.celular && v.celular.includes(q));
    });
  },

  /**
   * Contadores de distrito, servicio, rol y estado. Cada faceta se cuenta con
   * las otras tres y la busqueda aplicadas, sin su propia seleccion.
   */
  _updateFacetCounts() {
    const base = this._aplicaBusqueda([...(this._voluntarios || [])]);

    const distritoOk = (v) => this._filterDistrito.length === 0 || this._filterDistrito.includes(v.distrito);
    const servicioOk = (v) => this._filterServicio.length === 0 || this._filterServicio.includes(v.servicio);
    const rolOk = (v) => this._filterRol.length === 0 || this._filterRol.includes(v.rol);
    const estadoOk = (v) => this._filterEstado === "all" || v.estado === this._filterEstado;

    const sinDistrito = base.filter(v => servicioOk(v) && rolOk(v) && estadoOk(v));
    const sinServicio = base.filter(v => distritoOk(v) && rolOk(v) && estadoOk(v));
    const sinRol = base.filter(v => distritoOk(v) && servicioOk(v) && estadoOk(v));
    const sinEstado = base.filter(v => distritoOk(v) && servicioOk(v) && rolOk(v));

    contarOpciones("menuVoluntariosDistrito", sinDistrito, (v, valor) => v.distrito === valor);
    contarOpciones("menuVoluntariosServicio", sinServicio, (v, valor) => v.servicio === valor);
    contarOpciones("menuVoluntariosRol", sinRol, (v, valor) => v.rol === valor);
    contarOpciones("menuVoluntariosEstado", sinEstado, (v, valor) => v.estado === valor);
  },

  applyFilters(animar = false) {
    let list = [...this._voluntarios];

    // Búsqueda inteligente: insensible a tildes y búsqueda de nombre completo
    list = this._aplicaBusqueda(list);

    // Filter Distrito
    if (this._filterDistrito.length > 0) {
      list = list.filter(v => this._filterDistrito.includes(v.distrito));
    }

    // Filter Servicio
    if (this._filterServicio.length > 0) {
      list = list.filter(v => this._filterServicio.includes(v.servicio));
    }

    // Filter Rol
    if (this._filterRol.length > 0) {
      list = list.filter(v => this._filterRol.includes(v.rol));
    }

    // Filter Estado
    if (this._filterEstado !== "all") {
      list = list.filter(v => v.estado === this._filterEstado);
    }

    // Clave con la variante activa incluida: mismo motivo que en
    // BeneficiariosView, para que cruzar el corte de 768 px no deje la tabla
    // vacia al saltarse el repinto de abajo.
    const enMovil = Responsive.esMovil();

    const serial = `${enMovil ? 'M' : 'D'}|${this._searchQuery}_${this._filterDistrito.join(',')}_${this._filterServicio.join(',')}_${this._filterRol.join(',')}_${this._filterEstado}_` +
      list.map(v => [
        v.id, v.estado, v.nombres, v.apellidos, v.dni, v.celular,
        v.distrito, v.sedeAsignada, v.servicio, v.rol, v.estrategia,
        v.capacitaciones?.length || 0, v.canastasRecibidas,
      ].join('~')).join('|');

    const tbody = document.getElementById("tbodyVoluntarios");
    const mobileContainer = document.getElementById("mobileCardsVoluntarios");
    // Solo cuenta la variante que va a pintarse; la otra es residuo del corte anterior.
    const hasContent = enMovil
      ? (mobileContainer && mobileContainer.children.length > 0)
      : (tbody && tbody.children.length > 0);

    if (!animar && this._lastRenderSerial === serial && hasContent) {
      return;
    }
    this._lastRenderSerial = serial;

    this._filteredList = list;
    this._updateFacetCounts();
    this._updateActiveFilterBadge();
    this._renderActiveChips();
    this._renderTableAndCards(list);

    // La entrada se dispara solo cuando corresponde (primera carga o filtro manual)
    if (animar) {
      AnimationEngine.entradaEscalonada("tbodyVoluntarios", ":scope > tr", { paso: 22, maxDesfase: 10 });
      AnimationEngine.entradaEscalonada("mobileCardsVoluntarios", ":scope > *", { paso: 22, maxDesfase: 10 });
    }
  },

  _updateActiveFilterBadge() {
    const count = this._obtenerStore().contarActivos();

    const badge = document.getElementById("voluntariosActiveFiltersCount");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }

    const btn = document.getElementById("btnDropdownVoluntariosFilterPanel");
    if (btn) btn.classList.toggle("has-filters", count > 0);
  },

  _renderActiveChips() {
    const bar = document.getElementById("voluntariosActiveChipsBar");
    const list = document.getElementById("voluntariosActiveChipsList");
    if (!bar || !list) return;

    const chips = [];

    if (this._filterDistrito.length > 0) {
      this._filterDistrito.forEach(d => {
        chips.push({ id: "distrito", val: d, label: `Distrito: ${d}` });
      });
    }

    if (this._filterServicio.length > 0) {
      this._filterServicio.forEach(s => {
        chips.push({ id: "servicio", val: s, label: `Servicio: ${SERVICIO_LABELS[s] || s}` });
      });
    }

    if (this._filterRol.length > 0) {
      this._filterRol.forEach(r => {
        chips.push({ id: "rol", val: r, label: `Rol: ${r}` });
      });
    }

    if (this._filterEstado !== "all") {
      chips.push({ id: "estado", val: this._filterEstado, label: `Estado: ${this._filterEstado}` });
    }

    if (chips.length > 0) {
      bar.classList.add("is-visible");
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${escapar(chip.label)}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removeVoluntarioChip ? window.removeVoluntarioChip('${escaparEnManejador(chip.id)}', '${escaparEnManejador(chip.val || '')}') : null" title="Eliminar filtro">
            ${iconHtml("accion.cerrar", { size: 10 })}
          </button>
        </span>
      `).join("");
    } else {
      bar.classList.remove("is-visible");
      list.innerHTML = "";
    }
  },

  _renderTableAndCards(voluntarios) {
    const tbody = document.getElementById("tbodyVoluntarios");
    const mobileContainer = document.getElementById("mobileCardsVoluntarios");
    const paginationBar = document.getElementById("voluntariosPaginationBar");

    const totalCount = voluntarios.length;
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (this._currentPage > totalPages) this._currentPage = totalPages;
    if (this._currentPage < 1) this._currentPage = 1;

    const startIndex = (this._currentPage - 1) * pageSize;
    const pageItems = voluntarios.slice(startIndex, startIndex + pageSize);

    this._renderPagination(totalCount);
    if (paginationBar) {
      paginationBar.style.display = totalCount === 0 ? "none" : "flex";
    }

    const enMovil = Responsive.esMovil();

    // La que no se dibuja se vacia, y no se deja con lo que hubiera de antes:
    // si no, girar el movil con la ventana sola dejaria las dos pintadas.
    if (enMovil) { if (tbody) tbody.innerHTML = ""; }
    else { if (mobileContainer) mobileContainer.innerHTML = ""; }

    if (voluntarios.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px 16px;">
            <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 50%; background: var(--gt-green-bg); display: flex; align-items: center; justify-content: center; color: var(--gt-green);">
              ${iconHtml("persona.grupo", { size: 24 })}
            </div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 15px;">No se encontraron voluntarias o personal comunitario</div>
            <div style="color: var(--text-muted); font-size: 12.5px; margin-top: 4px;">Prueba ajustando el término de búsqueda o restableciendo los filtros.</div>
            <button type="button" class="btn-action btn-secondary" style="margin-top: 14px; display: inline-flex;" onclick="window.resetVoluntariosFilters ? window.resetVoluntariosFilters() : null">
              Restablecer Filtros
            </button>
          </td>
        </tr>
      `;
      if (tbody && !enMovil) tbody.innerHTML = emptyHtml;

      if (mobileContainer && enMovil) {
        mobileContainer.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; background: var(--surface-1); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 8px;">
            <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 50%; background: var(--gt-green-bg); display: flex; align-items: center; justify-content: center; color: var(--gt-green);">
              ${iconHtml("persona.grupo", { size: 24 })}
            </div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">No se encontraron registros</div>
            <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">No hay voluntarias que coincidan con la búsqueda o filtros.</div>
            <button type="button" class="btn-action btn-secondary" style="margin-top: 12px; display: inline-flex;" onclick="window.resetVoluntariosFilters ? window.resetVoluntariosFilters() : null">
              Restablecer Filtros
            </button>
          </div>
        `;
      }
      return;
    }

    // Render Table (PC)
    if (tbody && !enMovil) {
      tbody.innerHTML = pageItems.map(v => {
        let badgeServClass = "badge-green";
        let servDotClass = "dot-green";
        let servColorClass = "serv-desayuno";
        if (v.servicio === "Casita del Saber") {
          badgeServClass = "badge-yellow";
          servDotClass = "dot-amber";
          servColorClass = "serv-casita";
        }
        if (v.servicio === "Área Social Pastoral (ASP)") {
          badgeServClass = "badge-blue";
          servDotClass = "dot-blue";
          servColorClass = "serv-pastoral";
        }

        let badgeEstadoClass = v.estado === "Activo" ? "badge-green" : (v.estado === "En Pausa" ? "badge-yellow" : "badge-gray");
        let estadoDotClass = v.estado === "Activo" ? "dot-green" : (v.estado === "En Pausa" ? "dot-amber" : "dot-gray");
        const capCount = (v.capacitaciones && v.capacitaciones.length) || 0;

        // Formato limpio de teléfono: 987 342 119
        const celularFormateado = v.celular ? v.celular.replace(/-/g, " ") : "Sin teléfono";

        return `
          <tr class="padron-tr">
            <td>
              <div class="padron-user-cell">
                <div class="padron-avatar ${servColorClass}" aria-hidden="true">
                  ${escapar(v.nombres.charAt(0))}${escapar(v.apellidos.charAt(0))}
                </div>
                <div class="padron-user-info">
                  <div class="padron-user-name">${escapar(v.nombres)} ${escapar(v.apellidos)}</div>
                  <div class="padron-user-meta">
                    <span class="padron-code">${escapar(v.codigo)}</span>
                    <span class="padron-meta-sep">&bull;</span>
                    <span>DNI ${escapar(v.dni)}</span>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="padron-location-title">${escapar(v.sedeAsignada)}</div>
              <div class="padron-location-sub">${escapar(v.distrito)} &bull; ${escapar(v.estrategia)}</div>
            </td>
            <td>
              <div class="padron-service-stack">
                <span class="padron-service-indicator ${servColorClass}">
                  <span class="padron-dot ${servDotClass}"></span>
                  <strong>${escapar(v.servicio)}</strong>
                </span>
                <span class="padron-role-text" title="Rol asignado">
                  ${escapar(v.rol)}
                </span>
              </div>
            </td>
            <td>
              <div class="padron-contact-phone">${escapar(celularFormateado)}</div>
              <div class="padron-contact-sub">${v.edad ? `${escapar(v.edad)} años` : "Edad no reg."}</div>
            </td>
            <td>
              <div class="padron-rewards-wrap">
                <div class="padron-metric-item" title="Talleres de capacitación cursados">
                  ${iconHtml("educacion.grado", { size: 13 })}
                  <span>${capCount} taller${capCount === 1 ? '' : 'es'}</span>
                </div>
                ${v.canastasRecibidas > 0 ? `
                  <div class="padron-metric-item padron-metric-sub" title="Canastas de alimentos entregadas">
                    ${iconHtml("accion.archivar", { size: 13 })}
                    <span>${v.canastasRecibidas} canasta${v.canastasRecibidas === 1 ? '' : 's'}</span>
                  </div>
                ` : ''}
              </div>
            </td>
            <td>
              <div class="padron-status-tag ${v.estado === 'Activo' ? 'is-active' : 'is-paused'}">
                <span class="padron-dot ${estadoDotClass}"></span>
                <span>${escapar(v.estado)}</span>
              </div>
            </td>
            <td>
              <div class="row-actions">
                <button type="button" class="row-action" onclick="window.openFichaVoluntario ? window.openFichaVoluntario(${escaparEnManejador(v.id)}) : null" title="Ver ficha y credencial" aria-label="Ver ficha y credencial">
                  ${iconHtml("accion.ver", { size: 15 })}
                </button>
                <button type="button" class="row-action row-action--edit" onclick="window.openEditVoluntario ? window.openEditVoluntario(${escaparEnManejador(v.id)}) : null" title="Editar voluntario" aria-label="Editar voluntario">
                  ${iconHtml("accion.editar", { size: 15 })}
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    // Render Cards (Mobile)
    if (mobileContainer && enMovil) {
      mobileContainer.innerHTML = pageItems.map(v => {
        let badgeServClass = "badge-green";
        let servDotClass = "dot-green";
        let servColorClass = "serv-desayuno";
        if (v.servicio === "Casita del Saber") {
          badgeServClass = "badge-yellow";
          servDotClass = "dot-amber";
          servColorClass = "serv-casita";
        }
        if (v.servicio === "Área Social Pastoral (ASP)") {
          badgeServClass = "badge-blue";
          servDotClass = "dot-blue";
          servColorClass = "serv-pastoral";
        }

        let badgeEstadoClass = v.estado === "Activo" ? "badge-green" : (v.estado === "En Pausa" ? "badge-yellow" : "badge-gray");
        let estadoDotClass = v.estado === "Activo" ? "dot-green" : (v.estado === "En Pausa" ? "dot-amber" : "dot-gray");
        const capCount = (v.capacitaciones && v.capacitaciones.length) || 0;

        return `
          <div class="padron-mobile-card">
            <!-- Header: Avatar + Nombre + Estado -->
            <div class="padron-mcard-header">
              <div class="padron-mcard-identity">
                <div class="padron-avatar padron-mcard-avatar ${servColorClass}">
                  ${escapar(v.nombres.charAt(0))}${escapar(v.apellidos.charAt(0))}
                </div>
                <div class="padron-mcard-title-group">
                  <div class="padron-mcard-name">${escapar(v.nombres)} ${escapar(v.apellidos)}</div>
                  <div class="padron-user-meta">
                    <span class="padron-code">${escapar(v.codigo)}</span>
                    <span class="padron-meta-sep">&bull;</span>
                    <span>DNI ${escapar(v.dni)}</span>
                  </div>
                </div>
              </div>
              <span class="badge ${badgeEstadoClass} padron-status-badge">
                <span class="padron-dot ${estadoDotClass}"></span>
                ${escapar(v.estado)}
              </span>
            </div>

            <!-- Datos limpios sin caja interna (Anti-containeritis) -->
            <div class="padron-mcard-body">
              <div class="padron-mcard-detail-item">
                <span class="padron-mcard-detail-label">Sede / Territorio</span>
                <div class="padron-mcard-detail-val">
                  <strong>${escapar(v.sedeAsignada)}</strong>
                  <span class="padron-mcard-detail-sub">(${escapar(v.distrito)})</span>
                </div>
              </div>

              <div class="padron-mcard-detail-item">
                <span class="padron-mcard-detail-label">Contacto</span>
                <div class="padron-mcard-detail-val">
                  <a href="tel:${escapar(v.celular)}" class="padron-mcard-phone-link">${escapar(v.celular)}</a>
                </div>
              </div>

              <div class="padron-mcard-detail-item">
                <span class="padron-mcard-detail-label">Servicio</span>
                <span class="badge ${badgeServClass} padron-service-badge">
                  <span class="padron-dot ${servDotClass}"></span>
                  ${escapar(v.servicio)}
                </span>
              </div>

              <div class="padron-mcard-detail-item">
                <span class="padron-mcard-detail-label">Rol</span>
                <button type="button" class="padron-role-pill" onclick="window.toggleVoluntariosRol ? window.toggleVoluntariosRol('${escaparEnManejador(v.rol)}') : null" title="Filtrar por rol: ${escapar(v.rol)}">
                  ${escapar(v.rol)}
                </button>
              </div>
            </div>

            <!-- Footer: Métricas comunitarias + Acciones primarias -->
            <div class="padron-mcard-footer">
              <div class="padron-rewards-wrap">
                <span class="padron-metric-chip chip-talleres">
                  ${iconHtml("educacion.grado", { size: 12 })}
                  <span>${capCount} cap.</span>
                </span>
                ${v.canastasRecibidas > 0 ? `
                  <span class="padron-metric-chip chip-canastas">
                    ${iconHtml("accion.archivar", { size: 12 })}
                    <span>${v.canastasRecibidas}</span>
                  </span>
                ` : ''}
              </div>
              <div class="padron-mcard-actions">
                <button type="button" class="padron-btn-ficha" onclick="window.openFichaVoluntario ? window.openFichaVoluntario(${escaparEnManejador(v.id)}) : null">
                  Ficha
                </button>
                <button type="button" class="padron-btn-edit" onclick="window.openEditVoluntario ? window.openEditVoluntario(${escaparEnManejador(v.id)}) : null">
                  Editar
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  },


  handleDistritoChange(distrito) {
    this.updateSedeSelectOptions(distrito);
  },

  updateSedeSelectOptions(distrito, selectedSede = null) {
    const sedeSelect = document.getElementById("volSelectSede");
    if (!sedeSelect) return;
    const sedes = [...(SEDES_POR_DISTRITO[distrito] || SEDES_POR_DISTRITO["Comas"])];
    // Una sede antigua o fuera de catálogo se conserva como opción propia:
    // nunca se cambia en silencio al abrir la ficha.
    if (selectedSede && !sedes.includes(selectedSede)) sedes.push(selectedSede);
    sedeSelect.innerHTML = sedes.map(s => `
      <option value="${s}" ${selectedSede === s ? 'selected' : ''}>${etiquetaSede(s)}</option>
    `).join("");
    if (!selectedSede && sedes.length > 0) {
      sedeSelect.value = sedes[0];
    }
  },

  // Modal Inscripción (Ficha A4 / A5)
  openModalInscripcion(voluntarioId = null) {
    this._currentEditingId = voluntarioId;
    const modal = document.getElementById("modalInscripcionVoluntario");
    const titleEl = document.getElementById("modalInscripcionVoluntarioTitle");
    const form = document.getElementById("formInscripcionVoluntario");
    if (!modal) return;

    if (form) form.reset();

    if (voluntarioId) {
      const vol = VoluntarioModel.getById(voluntarioId);
      if (vol) {
        if (titleEl) titleEl.textContent = `Editar Ficha de Voluntario(a) • ${vol.codigo}`;
        this._setVal("volInputNombres", vol.nombres);
        this._setVal("volInputApellidos", vol.apellidos);
        this._setVal("volInputDni", vol.dni);
        this._setVal("volInputCelular", vol.celular);
        this._setVal("volInputFechaNac", vol.fechaNacimiento);
        this._setVal("volInputDomicilio", vol.domicilio);
        this._setVal("volSelectDistrito", vol.distrito || "Comas");
        this.updateSedeSelectOptions(vol.distrito || "Comas", vol.sedeAsignada);
        this._setVal("volSelectServicio", vol.servicio);
        this._setVal("volSelectRol", vol.rol);
        this._setVal("volSelectEstrategia", vol.estrategia);
        this._setVal("volSelectTipo", vol.tipoVoluntariado);
        this._setVal("volSelectEstado", vol.estado);
        this._setVal("volInputDisponibilidad", vol.disponibilidad);
        this._setVal("volInputObservaciones", vol.observaciones);
      }
    } else {
      if (titleEl) titleEl.textContent = "Nueva Ficha de Inscripción de Voluntario(a) (Ficha A4/A5)";
      this._setVal("volSelectDistrito", "Comas");
      this.updateSedeSelectOptions("Comas", SEDES_POR_DISTRITO["Comas"][0]);
      this._setVal("volSelectServicio", "Desayuno Infantil");
      this._setVal("volSelectRol", "Voluntaria de Apoyo");
      this._setVal("volSelectEstrategia", "Atención Fija");
      this._setVal("volSelectTipo", "Distribución y Cocina");
      this._setVal("volSelectEstado", "Activo");
    }

    modal.classList.add("open");
  },

  closeModalInscripcion() {
    const modal = document.getElementById("modalInscripcionVoluntario");
    if (modal) modal.classList.remove("open");
    this._currentEditingId = null;
  },

  async saveInscripcion(e) {
    if (e) e.preventDefault();
    // El guardado ahora espera a la nube: un doble clic no debe crear dos altas.
    if (this._guardando) return;
    const nombres = this._getVal("volInputNombres");
    const apellidos = this._getVal("volInputApellidos");
    const dni = this._getVal("volInputDni");
    const celular = this._getVal("volInputCelular");
    const fechaNacimiento = this._getVal("volInputFechaNac");
    const domicilio = this._getVal("volInputDomicilio");
    const distrito = this._getVal("volSelectDistrito");
    const sedeAsignada = this._getVal("volSelectSede");
    const servicio = this._getVal("volSelectServicio");
    const rol = this._getVal("volSelectRol");
    const estrategia = this._getVal("volSelectEstrategia");
    const tipoVoluntariado = this._getVal("volSelectTipo");
    const estado = this._getVal("volSelectEstado");
    const disponibilidad = this._getVal("volInputDisponibilidad");
    const observaciones = this._getVal("volInputObservaciones");

    // La sede y el distrito deben pertenecer al mismo territorio. Se conserva
    // una sede antigua fuera de catalogo solo si el registro ya estaba asi y no
    // se cambio de distrito.
    const sedesDelDistrito = SEDES_POR_DISTRITO[distrito] || [];
    const registroActual = this._currentEditingId ? VoluntarioModel.getById(this._currentEditingId) : null;
    const conservaSede = registroActual
      && registroActual.distrito === distrito
      && registroActual.sedeAsignada === sedeAsignada;
    if (sedeAsignada && !sedesDelDistrito.includes(sedeAsignada) && !conservaSede) {
      ToastView.show(
        "Sede incompatible",
        `La sede "${sedeAsignada}" no pertenece al distrito ${distrito}. Elige una sede de ese distrito.`,
        "danger",
      );
      return;
    }

    if (!nombres || !apellidos || !dni) {
      ToastView.show("Campos Incompletos", "Por favor complete los campos obligatorios (Nombres, Apellidos y DNI).", "warning");
      return;
    }

    if (!/^\d{8}$/.test(dni)) {
      ToastView.show("DNI Inválido", "El DNI peruano debe contener exactamente 8 dígitos numéricos.", "danger");
      return;
    }

    // Validación de DNI único para evitar duplicados accidentales
    const existing = VoluntarioModel.getByDni(dni);
    if (existing && String(existing.id) !== String(this._currentEditingId || "")) {
      ToastView.show("DNI Duplicado", `Ya existe un registro a nombre de ${existing.nombres} ${existing.apellidos} con el DNI ${dni}.`, "danger");
      return;
    }

    const payload = {
      nombres,
      apellidos,
      dni,
      celular,
      fechaNacimiento,
      domicilio,
      distrito,
      sedeAsignada,
      servicio,
      rol,
      estrategia,
      tipoVoluntariado,
      estado,
      disponibilidad,
      observaciones
    };

    this._guardando = true;
    try {
      if (this._currentEditingId) {
        const savedRecord = await VoluntarioModel.update(this._currentEditingId, payload);
        // Si la nube rechaza el cambio, la ficha sigue abierta para corregir.
        if (!savedRecord) {
          this.render();
          return;
        }
        ToastView.show("Ficha Actualizada", `Los datos de ${nombres} ${apellidos} se guardaron exitosamente.`, "success");
        if (AuditModel && AuditModel.log) {
          AuditModel.log("Sistema", "Coordinación", "Actualización de Voluntario", payload.dni, `Ficha de ${nombres} ${apellidos} editada`);
        }
      } else {
        const savedRecord = await VoluntarioModel.create(payload);
        // Sin confirmación de la base no hay alta: se retira la fila optimista
        // y la ficha queda abierta con el aviso de error.
        if (!savedRecord) {
          this.render();
          return;
        }
        ToastView.show("Inscripción Exitosa", `Se registró a ${nombres} ${apellidos} en el padrón de voluntariados.`, "success");
        if (AuditModel && AuditModel.log) {
          AuditModel.log("Sistema", "Coordinación", "Alta de Voluntario", payload.dni, `Inscripción de ${nombres} ${apellidos} (${payload.sedeAsignada})`);
        }
      }

      this.closeModalInscripcion();
      this._lastRenderSerial = null;
      this.render();
    } finally {
      this._guardando = false;
    }
  },

  // Modal Ficha y Credencial del Voluntario
  openModalFicha(id) {
    const vol = VoluntarioModel.getById(id);
    if (!vol) return;

    this._setTxt("fichaVolNombreCompleto", `${vol.nombres} ${vol.apellidos}`);
    this._setTxt("fichaVolCodigo", vol.codigo);
    this._setTxt("fichaVolDni", vol.dni);
    this._setTxt("fichaVolCelular", vol.celular || "Sin teléfono");
    this._setTxt("fichaVolEdad", `${vol.edad} años (${vol.fechaNacimiento || 'Fecha N/A'})`);
    this._setTxt("fichaVolDomicilio", vol.domicilio || "No registrado");
    this._setTxt("fichaVolSede", vol.sedeEtiqueta || `${vol.sedeAsignada} (${vol.distrito})`);
    this._setTxt("fichaVolServicio", vol.servicio);
    this._setTxt("fichaVolRol", vol.rol);
    this._setTxt("fichaVolEstrategia", `${vol.estrategia} &bull; ${vol.tipoVoluntariado}`);
    this._setTxt("fichaVolDisponibilidad", vol.disponibilidad || "Estándar");
    this._setTxt("fichaVolObservaciones", vol.observaciones || "Sin observaciones registradas.");
    this._setTxt("fichaVolFechaIngreso", vol.fechaIngreso || "No registrada");
    this._setTxt("fichaVolCanastasCount", `${vol.canastasRecibidas || 0} canastas entregadas`);

    const estadoBadge = document.getElementById("fichaVolEstadoBadge");
    if (estadoBadge) {
      let badgeCls = vol.estado === "Activo" ? "badge-green" : (vol.estado === "En Pausa" ? "badge-yellow" : "badge-gray");
      estadoBadge.className = `badge ${badgeCls}`;
      estadoBadge.textContent = vol.estado;
    }

    // Capacitaciones list
    const capListEl = document.getElementById("fichaVolCapacitacionesList");
    if (capListEl) {
      const caps = vol.capacitaciones || [];
      if (caps.length === 0) {
        capListEl.innerHTML = `<div style="font-size: 12px; color: var(--text-dim); padding: 6px 0;">No registra capacitaciones oficiales aún.</div>`;
      } else {
        capListEl.innerHTML = caps.map(c => `
          <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border-subtle); font-size: 12.5px; color: var(--text-main);">
            ${iconHtml("accion.confirmar", { size: 14, style: "color: var(--text-brand); flex-shrink: 0;" })}
            <span>${escapar(c)}</span>
          </div>
        `).join("");
      }
    }

    // Action buttons inside modal
    const btnCap = document.getElementById("btnFichaVolRegistrarCap");
    if (btnCap) {
      btnCap.onclick = () => {
        this.closeModalFicha();
        this.openModalCapacitacion(vol.id);
      };
    }

    const btnCanasta = document.getElementById("btnFichaVolEntregarCanasta");
    if (btnCanasta) {
      btnCanasta.onclick = async () => {
        if (this._guardandoCanasta) return;
        this._guardandoCanasta = true;
        btnCanasta.disabled = true;
        try {
          const updated = await VoluntarioModel.incrementCanasta(vol.id);
          // Sin confirmación de la nube no hay toast de éxito ni auditoría.
          if (!updated) return;

          this._lastRenderSerial = null;
          this.render();
          this.openModalFicha(vol.id);
          const total = updated.canastasRecibidas;
          ToastView.show("Canasta Entregada", `Se acreditó una canasta de estímulo a ${vol.nombres} ${vol.apellidos} (Total: ${total}).`, "success");
          if (AuditModel && AuditModel.log) {
            AuditModel.log("Sistema", "Coordinación", "Entrega de Canasta", vol.codigo, `Canasta entregada a ${vol.nombres} ${vol.apellidos}`);
          }
        } finally {
          this._guardandoCanasta = false;
          btnCanasta.disabled = false;
        }
      };
    }

    const btnEdit = document.getElementById("btnFichaVolEditar");
    if (btnEdit) {
      btnEdit.onclick = () => {
        this.closeModalFicha();
        this.openModalInscripcion(vol.id);
      };
    }

    const modal = document.getElementById("modalFichaVoluntario");
    if (modal) modal.classList.add("open");
  },

  closeModalFicha() {
    const modal = document.getElementById("modalFichaVoluntario");
    if (modal) modal.classList.remove("open");
  },

  // Modal Registrar Capacitación (Ficha A6)
  openModalCapacitacion(voluntarioId) {
    const vol = VoluntarioModel.getById(voluntarioId);
    if (!vol) return;

    this._currentEditingId = voluntarioId;
    this._setTxt("modalCapVoluntariaNombre", `${vol.nombres} ${vol.apellidos} (${vol.sedeAsignada})`);

    const selectEl = document.getElementById("selectCapacitacionTematica");
    if (selectEl) {
      selectEl.innerHTML = TEMATICAS_CAPACITACION.map(t => {
        const isDone = (vol.capacitaciones || []).includes(t);
        return `<option value="${t}" ${isDone ? 'disabled' : ''}>${t} ${isDone ? '(Ya completado)' : ''}</option>`;
      }).join("");
    }

    const modal = document.getElementById("modalCapacitacionVoluntarias");
    if (modal) modal.classList.add("open");
  },

  closeModalCapacitacion() {
    const modal = document.getElementById("modalCapacitacionVoluntarias");
    if (modal) modal.classList.remove("open");
    this._currentEditingId = null;
  },

  async saveCapacitacion() {
    if (!this._currentEditingId || this._guardandoCapacitacion) return;
    const selectEl = document.getElementById("selectCapacitacionTematica");
    if (!selectEl || !selectEl.value) return;

    const vol = VoluntarioModel.getById(this._currentEditingId);
    const chkCanasta = document.getElementById("chkEntregarCanastaCap");
    const conCanasta = Boolean(chkCanasta && chkCanasta.checked);

    this._guardandoCapacitacion = true;
    const btnGuardar = document.getElementById("btnGuardarCapacitacion");
    if (btnGuardar) btnGuardar.disabled = true;

    try {
      // Una sola escritura: el taller y la canasta se confirman juntos o no se
      // confirma ninguno. Antes eran dos UPDATE simultáneos y la canasta se
      // perdía con "Transaction conflict: Resource busy".
      const actualizado = await VoluntarioModel.registrarCapacitacion(
        this._currentEditingId,
        selectEl.value,
        { canasta: conCanasta },
      );

      // Sin confirmación de la nube no se cierra el modal ni se muestra éxito:
      // db.js ya mostró el error y la ficha sigue abierta para reintentar.
      if (!actualizado) return;

      if (chkCanasta) chkCanasta.checked = false;
      ToastView.show(
        "Capacitación Registrada",
        `Taller "${selectEl.value}" acreditado para ${vol ? vol.nombres : "voluntaria"}${conCanasta ? " y canasta de estímulo registrada" : ""}.`,
        "success",
      );
      if (AuditModel && AuditModel.log && vol) {
        AuditModel.log(
          "Sistema",
          "Coordinación",
          "Capacitación Voluntaria",
          vol.codigo,
          `Taller "${selectEl.value}" registrado${conCanasta ? " con entrega de canasta" : ""}`,
        );
      }

      this.closeModalCapacitacion();
      this._lastRenderSerial = null;
      this.render();
    } finally {
      this._guardandoCapacitacion = false;
      if (btnGuardar) btnGuardar.disabled = false;
    }
  },

  // Exportar Padrón en CSV
  exportCSV() {
    const list = (this._filteredList && this._filteredList.length > 0) ? this._filteredList : VoluntarioModel.getAll();
    if (list.length === 0) {
      ToastView.show("Sin Registros", "No hay registros de voluntariados para exportar.", "warning");
      return;
    }

    const headers = ["Código", "Nombres", "Apellidos", "DNI", "Celular", "Edad", "Distrito", "Sede Asignada", "Servicio", "Rol", "Estrategia", "Capacitaciones Completadas", "Canastas Recibidas", "Estado"];
    const rows = list.map(v => [
      `"${v.codigo}"`,
      `"${v.nombres}"`,
      `"${v.apellidos}"`,
      `"${v.dni}"`,
      `"${v.celular}"`,
      v.edad,
      `"${v.distrito}"`,
      `"${v.sedeAsignada}"`,
      `"${v.servicio}"`,
      `"${v.rol}"`,
      `"${v.estrategia}"`,
      `"${(v.capacitaciones || []).join('; ')}"`,
      v.canastasRecibidas || 0,
      `"${v.estado}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Padron_Voluntariados_PDI_Johannes_Gutenberg_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ToastView.show("Padrón Exportado", `Se descargó el reporte CSV con ${list.length} voluntaria(s).`, "info");
  },

  // Helpers
  _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : "";
  },

  _getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  },

  _setTxt(id, txt) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = txt !== undefined && txt !== null ? txt : "";
  },

  clearSearch() {
    this._searchQuery = "";
    const input = document.getElementById("inputVoluntariosSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnVoluntariosSearchClear");
    if (clearBtn) clearBtn.style.display = "none";
    this.applyFilters();
    this._persistirFiltros();
  },

  toggleDistrito(dist) {
    this._obtenerStore().alternar("distrito", dist);
    this._espejarStore();
    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  toggleServicio(serv) {
    this._obtenerStore().alternar("servicio", serv);
    this._espejarStore();
    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  toggleRol(rol) {
    // El rol no tiene catálogo cerrado: el store acepta cualquier valor.
    this._obtenerStore().alternar("rol", rol);
    this._espejarStore();
    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  toggleEstado(estado) {
    this._obtenerStore().fijar("estado", estado);
    this._espejarStore();
    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  removeFilter(filterKey, specificVal) {
    if (filterKey === "distrito") {
      if (specificVal) this.toggleDistrito(specificVal);
      else this.toggleDistrito("all");
    }
    if (filterKey === "servicio") {
      if (specificVal) this.toggleServicio(specificVal);
      else this.toggleServicio("all");
    }
    if (filterKey === "rol") {
      if (specificVal) this.toggleRol(specificVal);
      else this.toggleRol("all");
    }
    if (filterKey === "estado") {
      this.toggleEstado("all");
    }
  },

  resetFilters() {
    this._searchQuery = "";
    this._obtenerStore().limpiar();
    this._espejarStore();

    const input = document.getElementById("inputVoluntariosSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnVoluntariosSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this._updateFilterDropdownUI();
    this.applyFilters();
    this._persistirFiltros();
  },

  _updateDistritoDropdownUI() {
    const isAll = this._filterDistrito.length === 0;
    const items = document.querySelectorAll("#menuVoluntariosDistrito .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterDistrito.includes(v));
      }
    });

    const label = document.getElementById("labelVoluntariosDistritoSelect");
    if (label) {
      if (isAll) label.textContent = "Todos los Distritos";
      else if (this._filterDistrito.length === 1) label.textContent = this._filterDistrito[0];
      else label.textContent = `${this._filterDistrito.length} seleccionados`;
    }
  },

  _updateServicioDropdownUI() {
    const isAll = this._filterServicio.length === 0;
    const items = document.querySelectorAll("#menuVoluntariosServicio .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterServicio.includes(v));
      }
    });

    const label = document.getElementById("labelVoluntariosServicioSelect");
    if (label) {
      if (isAll) {
        label.textContent = "Todos los Servicios";
      } else if (this._filterServicio.length === 1) {
        label.textContent = SERVICIO_LABELS[this._filterServicio[0]] || this._filterServicio[0];
      } else {
        label.textContent = `${this._filterServicio.length} seleccionados`;
      }
    }
  },

  _updateEstadoDropdownUI() {
    const items = document.querySelectorAll("#menuVoluntariosEstado .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterEstado);
    });

    const label = document.getElementById("labelVoluntariosEstadoSelect");
    if (label) {
      label.textContent = this._filterEstado === "all" ? "Todos los Estados" : this._filterEstado;
    }
  },


  _updateRolDropdownUI() {
    const isAll = this._filterRol.length === 0;
    const items = document.querySelectorAll("#menuVoluntariosRol .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterRol.includes(v));
      }
    });

    const label = document.getElementById("labelVoluntariosRolSelect");
    if (label) {
      if (isAll) {
        label.textContent = "Todos los Roles";
      } else if (this._filterRol.length === 1) {
        label.textContent = this._filterRol[0];
      } else {
        label.textContent = `${this._filterRol.length} seleccionados`;
      }
    }
  },

  _updateFilterDropdownUI() {
    this._updateDistritoDropdownUI();
    this._updateServicioDropdownUI();
    this._updateRolDropdownUI();
    this._updateEstadoDropdownUI();
  }
};

// Global handlers for window onclick bindings
//
// Los de abrir y guardar son de esta pagina, asi que viven aqui. Los de cerrar el
// modal no: los botones de cerrar estan en el chrome, que va en las diez paginas,
// y esta vista solo se importa en la suya. Esos cuatro los define
// legacy-globals.js, para que existan tambien donde la vista no esta cargada. Un
// puente, un solo dueno: antes cada uno estaba definido aqui y alla, y ganaba el
// ultimo en evaluarse.
if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.VoluntariadosView = VoluntariadosView;

  window.openInscripcionVoluntario = () => VoluntariadosView.openModalInscripcion();
  window.openEditVoluntario = (id) => VoluntariadosView.openModalInscripcion(id);
  window.openFichaVoluntario = (id) => VoluntariadosView.openModalFicha(id);
  window.saveInscripcionVoluntario = (e) => VoluntariadosView.saveInscripcion(e);
  window.removeVoluntarioChip = (k, v) => VoluntariadosView.removeFilter(k, v);
  window.resetVoluntariosFilters = () => VoluntariadosView.resetFilters();
  window.voluntariosSetPageSize = (size) => VoluntariadosView.setPageSize(size);
  window.voluntariosPrevPage = () => VoluntariadosView.prevPage();
  window.voluntariosNextPage = () => VoluntariadosView.nextPage();
  window.clearVoluntariosSearch = () => VoluntariadosView.clearSearch();
  window.exportVoluntariosCSV = () => VoluntariadosView.exportCSV();
  window.toggleVoluntariosDistrito = (d) => VoluntariadosView.toggleDistrito(d);
  window.toggleVoluntariosServicio = (s) => VoluntariadosView.toggleServicio(s);
  window.toggleVoluntariosEstado = (e) => VoluntariadosView.toggleEstado(e);
  window.toggleVoluntariosInnerDropdown = function (dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains("open");
    // Cerrar los demás dropdowns internos del panel
    document.querySelectorAll("#menuVoluntariosFilterPanel .padron-inner-dropdown.open").forEach(d => {
      if (d !== dropdown) d.classList.remove("open");
    });
    dropdown.classList.toggle("open", !isOpen);
  };
}
