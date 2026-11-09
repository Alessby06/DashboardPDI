// Vista: Acompañamiento Educativo (Casita del Saber)
//
// La página ya no es "el pase de hoy": es una jornada de un día y una sede.
// El estado de cada alumno vive en CasitasController hasta que se pulsa
// "Guardar jornada"; esta vista solo dibuja ese estado, los filtros que
// estrechan la lista (grado y búsqueda) y el resumen.
import { crear as crearFiltros } from '../utils/Filters.js';
import { crearStore } from '../utils/FilterStore.js';
import { Responsive } from '../utils/Responsive.js';

import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";
import { SEDES_NOMBRES, etiquetaSede } from "../core/catalogos.js";
import { contarOpciones } from "../utils/FacetCounts.js";
import { initSortMenu } from "../ui/SortMenu.js";
import { iconHtml } from '../../data/iconos.js';
import { avatarHtml } from "../utils/Avatar.js";
import { ESTADOS_ASISTENCIA } from '../core/jornadaAsistencia.js';
import { confirmar } from '../ui/confirmacion.js';

// Filtros que viajan en la URL. El día y la sede definen la jornada; grado y
// búsqueda solo estrechan la lista.
const FILTROS_CASITAS = {
  q:     { valor: "" },
  grado: { valor: "all", valores: ["all", "inicial", "primaria", "secundaria"] },
  fecha: { valor: "" },
  sede:  { valor: "", valores: [...SEDES_NOMBRES] },
};

const FACETAS_CASITAS = {
  grado: { tipo: "single", opciones: FILTROS_CASITAS.grado.valores, defecto: "all" },
};

function colegioOrigenVisible(beneficiario) {
  const colegio = String(beneficiario?.colegio ?? '').trim();
  return colegio && colegio !== '-' ? colegio : 'Sin registrar';
}

function gradoVisible(beneficiario) {
  const grado = String(beneficiario?.grado ?? '').trim();
  return grado || 'Sin registrar';
}

function nivelEducativoVisible(beneficiario) {
  const nivel = String(beneficiario?.nivelEducativo ?? '').trim();
  if (nivel) return nivel;
  const grado = String(beneficiario?.grado ?? '').trim();
  if (grado.includes('Prim')) return 'Primaria';
  if (grado.includes('Secund')) return 'Secundaria';
  if (grado) return 'Inicial';
  return 'Sin registrar';
}

function hoyLocal() {
  const ctrl = window.PDI?.CasitasController;
  return ctrl?.diaHoy ? ctrl.diaHoy() : new Date().toISOString().slice(0, 10);
}

export const CasitasView = {
  _allBeneficiarios: [],
  _filteredBeneficiarios: [],
  _searchQuery: "",
  _filterGrado: "all",
  _jornadaDia: "",
  _jornadaSede: "",
  _jornadaInicializada: false,
  _jornadaCargando: false,
  _guardando: false,
  _preguntando: false,
  _asistenciaDelegada: false,
  _currentPage: 1,
  _pageSize: 20,
  _sortKey: "apellido",
  _sortDir: "asc",

  _filtros: null,
  _filtrosLeidos: false,

  _store: null,

  _fjPendiente: null,

  _obtenerStore() {
    if (!this._store) this._store = crearStore(FACETAS_CASITAS);
    return this._store;
  },

  _espejarStore() {
    const s = this._obtenerStore().instantanea();
    this._filterGrado = s.grado;
  },

  _obtenerFiltros() {
    if (!this._filtros) {
      this._filtros = crearFiltros(FILTROS_CASITAS);
    }
    return this._filtros;
  },

  _controlador() {
    return window.PDI?.CasitasController || null;
  },

  _getEffectivePageSize() {
    if (Responsive.esMovil()) {
      return Math.min(20, this._pageSize || 20);
    }
    return Math.min(50, this._pageSize || 20);
  },

  _syncPageSizeSelectUI() {
    const select = document.getElementById("selectCasitasPageSize");
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
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    this._currentPage = Math.min(totalPages, Math.max(1, page));
    this._renderTableAndCards(this._filteredBeneficiarios);
  },

  prevPage() {
    if (this._currentPage > 1) this.goToPage(this._currentPage - 1);
  },

  nextPage() {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    if (this._currentPage < totalPages) this.goToPage(this._currentPage + 1);
  },

  _renderPagination(totalCount) {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startRecord = totalCount === 0 ? 0 : (this._currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(totalCount, this._currentPage * pageSize);

    const infoEl = document.getElementById("casitasPaginationInfo");
    if (infoEl) {
      infoEl.textContent = totalCount === 0
        ? "Mostrando 0 de 0 usuarios"
        : `Mostrando ${startRecord}-${endRecord} de ${totalCount} usuarios`;
    }

    const pageNumEl = document.getElementById("casitasCurrentPageNum");
    if (pageNumEl) {
      pageNumEl.textContent = `Página ${this._currentPage} de ${totalPages}`;
    }

    const btnPrev = document.getElementById("btnCasitasPagePrev");
    if (btnPrev) btnPrev.disabled = this._currentPage <= 1 || totalCount === 0;

    const btnNext = document.getElementById("btnCasitasPageNext");
    if (btnNext) btnNext.disabled = this._currentPage >= totalPages || totalCount === 0;

    this._syncPageSizeSelectUI();
  },

  _persistirFiltros(extra) {
    this._obtenerFiltros().escribir({
      q: this._searchQuery,
      grado: this._filterGrado,
      fecha: this._jornadaDia,
      sede: this._jornadaSede,
      ...(extra || {}),
    });
  },

  _leerFiltrosDeURL() {
    if (this._filtrosLeidos) return;
    this._filtrosLeidos = true;

    const f = this._obtenerFiltros().leer();
    this._searchQuery = (f.q || "").toLowerCase();
    this._obtenerStore().cargar({ grado: f.grado });
    this._espejarStore();
    const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(f.fecha || "");
    this._jornadaDia = fechaValida ? f.fecha : hoyLocal();
    this._jornadaSede = f.sede || "";

    const input = document.getElementById("inputCasitasSearch");
    if (input) input.value = f.q;
    const clearBtn = document.getElementById("btnCasitasSearchClear");
    if (clearBtn) clearBtn.style.display = f.q ? "flex" : "none";

    this._updateGradoUI();
  },

  /** Pinta un desplegable de opción única leyendo la etiqueta del propio HTML. */
  _pintarOpcionUnica(idMenu, idEtiqueta, valor, alternativa) {
    const items = document.querySelectorAll("#" + idMenu + " .padron-dropdown-item");
    let texto = null;
    items.forEach(item => {
      const coincide = item.getAttribute("data-value") === valor;
      item.classList.toggle("selected", coincide);
      if (coincide) {
        const span = item.querySelector(".padron-item-label");
        if (span) texto = span.textContent.trim();
      }
    });

    const labelEl = document.getElementById(idEtiqueta);
    if (labelEl) labelEl.textContent = texto || alternativa || "";
    return texto;
  },

  // -------------------------------------------------------------------------
  //  Jornada: día y sede
  // -------------------------------------------------------------------------

  /** Sedes con al menos un alumno de Casita, en el orden del catálogo. */
  _sedesDisponibles() {
    const presentes = new Set(
      this._baseCasitas().map(b => String(b.sede || "").trim()).filter(Boolean),
    );
    const ordenadas = SEDES_NOMBRES.filter(sede => presentes.has(sede));
    const fueraDelCatalogo = [...presentes].filter(sede => !SEDES_NOMBRES.includes(sede));
    return [...ordenadas, ...fueraDelCatalogo.sort((a, b) => a.localeCompare(b, "es"))];
  },

  /** Sede inicial: solo la que venga elegida (enlace con `sede`). Sin
   *  elección previa se queda vacía y la jornada espera a que se elija una:
   *  no se impone la primera sede con alumnos. */
  _sedePorDefecto() {
    if (this._jornadaSede && SEDES_NOMBRES.includes(this._jornadaSede)) {
      return this._jornadaSede;
    }
    return "";
  },

  /** Inicia la jornada una sola vez, cuando ya hay beneficiarios cargados. */
  _prepararJornada() {
    if (!this._jornadaDia) this._jornadaDia = hoyLocal();
    this._jornadaSede = this._sedePorDefecto();
    // Sin sede elegida el estado inicial es «Elige una sede»: no hay nada que
    // consultar ni que imponer. Se marca como preparada para no repetir el
    // intento en cada hidratación.
    this._jornadaInicializada = true;
    this._sincronizarBarra();
    if (this._jornadaSede) {
      this._cargarJornada();
      return;
    }
    this.renderJornada();
  },

  /** La fecha de la URL no puede saltarse el límite del rol. */
  _normalizarJornadaPorRol() {
    const hoy = hoyLocal();
    const rol = this._controlador()?.rolActual?.();
    if (!this._jornadaDia || this._jornadaDia > hoy) this._jornadaDia = hoy;
    if (rol === "promotora") this._jornadaDia = hoy;
  },

  async _cargarJornada() {
    const ctrl = this._controlador();
    if (!ctrl || this._jornadaCargando) return;

    this._jornadaCargando = true;
    this._sincronizarBarra();
    this.applyFilters();

    const ok = await ctrl.cargarJornada(this._jornadaDia, this._jornadaSede);

    this._jornadaCargando = false;
    if (ok) {
      this._persistirFiltros();
      this.renderJornada();
    } else {
      this._renderAvisos();
      this._sincronizarBarra();
      this.applyFilters();
    }
  },

  async cambiarDia(valor) {
    const input = document.getElementById("inputJornadaFecha");
    const ctrl = this._controlador();
    const hoy = hoyLocal();

    // La promotora solo registra hoy; el selector no debe permitirle abrir
    // otro día ni siquiera escribiendo la fecha a mano.
    if (valor && ctrl?.rolActual?.() === "promotora" && valor !== hoy) {
      if (input) input.value = this._jornadaDia || hoy;
      window.PDI?.ToastView?.show?.(
        "Solo la jornada de hoy",
        "La promotora no puede abrir una jornada de otra fecha.",
        "warning",
      );
      return;
    }
    if (valor && valor > hoy) {
      if (input) input.value = this._jornadaDia || hoy;
      return;
    }
    if (!valor) {
      if (input) input.value = this._jornadaDia;
      return;
    }
    if (ctrl?.hayCambios?.()) {
      if (this._preguntando) {
        if (input) input.value = this._jornadaDia || hoy;
        return;
      }
      this._preguntando = true;
      const seguir = await confirmar({
        titulo: "Cambios sin guardar",
        mensaje: "Si cambias de día se pierden los estados que marcaste y no guardaste.",
        confirmar: "Cambiar de día",
        cancelar: "Seguir editando",
        peligro: true,
        origen: input,
      });
      this._preguntando = false;
      if (!seguir) {
        if (input) input.value = this._jornadaDia;
        return;
      }
    }
    this._jornadaDia = valor;
    this._currentPage = 1;
    this._persistirFiltros();
    this._cargarJornada();
  },

  async cambiarSede(valor) {
    const ctrl = this._controlador();
    if (ctrl?.hayCambios?.()) {
      if (this._preguntando) {
        const select = document.getElementById("selectJornadaSede");
        if (select) select.value = this._jornadaSede;
        return;
      }
      this._preguntando = true;
      const seguir = await confirmar({
        titulo: "Cambios sin guardar",
        mensaje: "Si cambias de sede se pierden los estados que marcaste y no guardaste.",
        confirmar: "Cambiar de sede",
        cancelar: "Seguir editando",
        peligro: true,
        origen: document.getElementById("selectJornadaSede"),
      });
      this._preguntando = false;
      if (!seguir) {
        const select = document.getElementById("selectJornadaSede");
        if (select) select.value = this._jornadaSede;
        return;
      }
    }
    this._jornadaSede = valor || "";
    this._currentPage = 1;
    this._persistirFiltros();
    this._cargarJornada();
  },

  async recargarJornada() {
    const ctrl = this._controlador();
    if (!ctrl) return;
    this._jornadaCargando = true;
    this._sincronizarBarra();
    this.applyFilters();
    const ok = await ctrl.recargarJornada();
    this._jornadaCargando = false;
    if (ok) this.renderJornada();
    else {
      this._sincronizarBarra();
      this.applyFilters();
    }
  },

  /** Barra de jornada: valores, permisos, estado y botones. */
  _sincronizarBarra() {
    const ctrl = this._controlador();
    const hoy = hoyLocal();

    const inputFecha = document.getElementById("inputJornadaFecha");
    if (inputFecha) {
      inputFecha.value = this._jornadaDia || hoy;
      inputFecha.max = hoy;
      const rol = ctrl?.rolActual?.() || "coord";
      if (rol === "promotora") {
        inputFecha.min = hoy;
      } else {
        inputFecha.removeAttribute("min");
      }
    }

    const selectSede = document.getElementById("selectJornadaSede");
    if (selectSede) {
      // Las sedes del catálogo ya vienen en el marcado. Se añaden las que
      // existan solo en la base (inscripciones heredadas) y la sede de la URL
      // aunque todavía no tenga alumnos, para no dejar el selector en blanco.
      const valores = new Set(this._sedesDisponibles());
      if (this._jornadaSede) valores.add(this._jornadaSede);
      for (const sede of valores) {
        if (sede && ![...selectSede.options].some(o => o.value === sede)) {
          selectSede.add(new Option(etiquetaSede(sede), sede));
        }
      }
      selectSede.value = this._jornadaSede || "";
    }

    const tituloSede = document.getElementById("jornadaSubtituloSede");
    if (tituloSede) {
      tituloSede.textContent = this._jornadaSede
        ? `Casita del Saber: ${etiquetaSede(this._jornadaSede)}`
        : "Elige una sede para abrir la jornada";
    }

    const puedeEditar = Boolean(ctrl?.puedeEditar?.());
    const hayCambios = Boolean(ctrl?.hayCambios?.());
    const cambios = ctrl?.numeroCambios?.() || 0;

    const btnGuardar = document.getElementById("btnGuardarJornada");
    if (btnGuardar) {
      btnGuardar.disabled = this._jornadaCargando || this._guardando || !puedeEditar || !hayCambios;
      const label = btnGuardar.querySelector(".btn-label");
      if (label) {
        label.textContent = this._guardando
          ? "Guardando…"
          : (hayCambios ? `Guardar jornada (${cambios})` : "Guardar jornada");
      }
    }

    const btnRecargar = document.getElementById("btnRecargarJornada");
    if (btnRecargar) btnRecargar.disabled = this._jornadaCargando || this._guardando;

    const estado = document.getElementById("jornadaEstadoGuardado");
    if (estado) {
      let texto = "Jornada sin iniciar";
      let clase = "jornada-estado";
      if (this._jornadaCargando) {
        texto = "Cargando jornada…";
        clase += " is-loading";
      } else if (this._guardando) {
        texto = "Guardando…";
        clase += " is-saving";
      } else if (hayCambios) {
        texto = `${cambios} cambio${cambios === 1 ? "" : "s"} sin guardar`;
        clase += " is-dirty";
      } else if (ctrl?.esJornadaIniciada?.()) {
        texto = "Sin cambios pendientes";
        clase += " is-ok";
      }
      estado.textContent = texto;
      estado.className = clase;
    }

    const soloLectura = document.getElementById("jornadaSoloLectura");
    if (soloLectura) {
      if (ctrl?.esJornadaIniciada?.() && !puedeEditar) {
        soloLectura.textContent = ctrl.motivoSoloLectura?.() || "Jornada de solo lectura.";
        soloLectura.hidden = false;
      } else {
        soloLectura.hidden = true;
      }
    }
  },

  _idsJornada() {
    return this._baseJornada().map(b => b.id);
  },

  _renderResumen() {
    const contenedor = document.getElementById("jornadaResumen");
    if (!contenedor) return;
    const ctrl = this._controlador();

    if (!this._jornadaSede) {
      contenedor.innerHTML = `<span class="jornada-resumen-vacio">Sin sede seleccionada</span>`;
      return;
    }
    if (!ctrl?.esJornadaIniciada?.()) {
      contenedor.innerHTML = `<span class="jornada-resumen-vacio">Cargando la jornada…</span>`;
      return;
    }

    const r = ctrl.getResumen(this._idsJornada());
    const chips = [
      { clave: "total", etiqueta: "Alumnos", valor: r.total, clase: "is-total" },
      { clave: "P", etiqueta: "Presentes", valor: r.P, clase: "is-p" },
      { clave: "T", etiqueta: "Tardanzas", valor: r.T, clase: "is-t" },
      { clave: "FJ", etiqueta: "Faltas just.", valor: r.FJ, clase: "is-fj" },
      { clave: "FI", etiqueta: "Faltas injust.", valor: r.FI, clase: "is-fi" },
      { clave: "sin", etiqueta: "Sin marcar", valor: r.sinMarcar, clase: "is-sin" },
    ];

    contenedor.innerHTML = chips.map(chip => `
      <span class="jornada-chip ${chip.clase}" title="${escapar(chip.etiqueta)}">
        <span class="jornada-chip-punto"></span>
        <span class="jornada-chip-label">${escapar(chip.etiqueta)}</span>
        <strong>${chip.valor}</strong>
      </span>
    `).join("") + (r.FJ > 0
      ? `<span class="jornada-chip is-motivo" title="Faltas justificadas con motivo escrito">
           <span class="jornada-chip-label">Con motivo</span>
           <strong>${r.conMotivo}/${r.FJ}</strong>
         </span>`
      : "");
  },

  /**
   * Avisos de la jornada: conflicto con otro dispositivo y cambios remotos.
   * No se abre un modal para no interrumpir el marcado; el aviso queda sobre
   * la tabla y ofrece recargar o sobrescribir con conocimiento de causa.
   */
  _renderAvisos() {
    const caja = document.getElementById("jornadaAvisos");
    if (!caja) return;

    const ctrl = this._controlador();
    const bloques = [];

    if (ctrl?.tieneConflicto?.()) {
      const detalles = ctrl.getConflictosDetalle();
      const filas = detalles.slice(0, 6).map(d => `
        <li>
          <strong>${escapar(d.nombre)}</strong>
          ${d.codigo ? `<span class="jornada-conflicto-codigo">${escapar(d.codigo)}</span>` : ""}
          <span class="jornada-conflicto-cambio">
            ${this._textoMarca(d.antes)} → ${this._textoMarca(d.ahora)}
            <span class="jornada-conflicto-propio">Tu marca: ${this._textoMarca(d.nuevo)}</span>
          </span>
        </li>
      `).join("");
      const resto = detalles.length > 6
        ? `<li class="jornada-conflicto-resto">y ${detalles.length - 6} más…</li>`
        : "";

      bloques.push(`
        <div class="jornada-aviso is-conflicto" role="alert">
          <div class="jornada-aviso-texto">
            <strong>La jornada cambió en otro dispositivo.</strong>
            <p>Estos alumnos tienen otro estado en la nube desde que abriste la jornada:</p>
            <ul class="jornada-conflicto-lista">${filas}${resto}</ul>
          </div>
          <div class="jornada-aviso-acciones">
            <button type="button" class="btn-action btn-secondary" onclick="window.casitasRecargarJornada ? window.casitasRecargarJornada() : null">
              Recargar jornada
            </button>
            <button type="button" class="btn-action primary" onclick="window.casitasSobrescribirJornada ? window.casitasSobrescribirJornada() : null">
              Sobrescribir con mis cambios
            </button>
          </div>
        </div>
      `);
    } else if (ctrl?.tieneAvisoRemoto?.()) {
      bloques.push(`
        <div class="jornada-aviso is-remoto" role="status">
          <div class="jornada-aviso-texto">
            <strong>Hay cambios sin guardar y la jornada se actualizó en otro dispositivo.</strong>
            <p>Puedes seguir marcando: al guardar se comprobarán las diferencias antes de sobrescribir.</p>
          </div>
          <div class="jornada-aviso-acciones">
            <button type="button" class="btn-action btn-secondary" onclick="window.casitasDescartarAviso ? window.casitasDescartarAviso() : null">
              Entendido
            </button>
          </div>
        </div>
      `);
    }

    caja.innerHTML = bloques.join("");
    caja.hidden = bloques.length === 0;
  },

  _textoMarca(marca) {
    if (!marca?.estado) return "Sin marcar";
    const etiqueta = ESTADOS_ASISTENCIA[marca.estado]?.label || marca.estado;
    return marca.estado === "FJ" && marca.observacion
      ? `${etiqueta} (${marca.observacion})`
      : etiqueta;
  },

  // -------------------------------------------------------------------------
  //  Asistencia: botones y modal de motivo
  // -------------------------------------------------------------------------

  _estadoAsistenciaInfo(id) {
    const ctrl = this._controlador();
    if (ctrl && typeof ctrl.getEstadoInfo === "function") return ctrl.getEstadoInfo(id);
    return { clave: "", label: "Sin marcar", badgeClass: "badge badge-neutral" };
  },

  _botonesAsistencia(id) {
    const info = this._estadoAsistenciaInfo(id);
    const ctrl = this._controlador();
    const bloqueado = !ctrl?.puedeEditar?.() || this._jornadaCargando || this._guardando;
    return ["P", "T", "FJ", "FI"].map(clave => `
      <button type="button"
        class="btn-asist${clave === info.clave ? " active-" + clave : ""}"
        data-asist-btn="${clave}" data-asist-id="${escapar(id)}"
        ${bloqueado ? "disabled" : ""}
        aria-pressed="${clave === info.clave ? "true" : "false"}"
        aria-label="${escapar(ESTADOS_ASISTENCIA[clave].label)}"
        title="${bloqueado ? "Jornada de solo lectura" : ESTADOS_ASISTENCIA[clave].label}">${clave}</button>
    `).join("") + (info.clave ? `
      <button type="button" class="btn-asist btn-asist-clear"
        data-asist-clear="${escapar(id)}"
        ${bloqueado ? "disabled" : ""}
        aria-label="Quitar la marca"
        title="Quitar la marca">×</button>
    ` : "");
  },

  _badgeAsistencia(id, prefijo) {
    const info = this._estadoAsistenciaInfo(id);
    return `<span class="${info.badgeClass}" id="${prefijo}${escapar(id)}">${info.label}</span>`;
  },

  /** Versión de la tabla nueva: punto de color + texto, como el estado del padrón. */
  _tagAsistencia(id, prefijo) {
    const info = this._estadoAsistenciaInfo(id);
    const dotClase = { P: "dot-green", T: "dot-yellow", FJ: "dot-amber", FI: "dot-red" }[info.clave] || "dot-gray";
    return `<span class="padron-status-tag estado-${info.clave || "sin"}" id="${prefijo}${escapar(id)}"><span class="padron-dot ${dotClase}"></span><span>${escapar(info.label)}</span></span>`;
  },

  _motivoAsistencia(id) {
    const marca = this._controlador()?.getMarca?.(id);
    if (marca?.estado !== "FJ" || !marca.observacion) return "";
    return `<div class="asist-motivo" title="${escapar(marca.observacion)}">${escapar(marca.observacion)}</div>`;
  },

  _delegarAsistencia() {
    if (this._asistenciaDelegada) return;
    this._asistenciaDelegada = true;

    const alPulsar = (e) => {
      const id = e.target.getAttribute("data-asist-id") || e.target.getAttribute("data-asist-clear");
      if (!id) return;
      e.stopPropagation();

      const ctrl = this._controlador();
      if (!ctrl) return;

      if (e.target.hasAttribute("data-asist-clear")) {
        const res = ctrl.limpiarMarca(id);
        if (!res.ok) return this._avisarError(res.error);
        this.renderJornada();
        return;
      }

      const estado = e.target.getAttribute("data-asist-btn");
      if (!estado) return;

      if (estado === "FJ") {
        this.abrirMotivoFJ(id);
        return;
      }

      const res = ctrl.marcar(id, estado);
      if (!res.ok) return this._avisarError(res.error);
      this.renderJornada();
    };

    document.addEventListener("click", alPulsar);
  },

  _avisarError(mensaje) {
    const toast = window.PDI?.ToastView;
    toast?.show?.("No se pudo marcar la asistencia", mensaje || "Intenta de nuevo.", "warning");
  },

  abrirMotivoFJ(id) {
    const ctrl = this._controlador();
    if (!ctrl?.puedeEditar?.()) {
      this._avisarError(ctrl?.motivoSoloLectura?.() || "Jornada de solo lectura.");
      return;
    }
    const beneficiario = window.PDI?.BeneficiarioModel?.getById?.(id);
    const marca = ctrl.getMarca(id);
    this._fjPendiente = { id, nombre: beneficiario ? `${beneficiario.nombres} ${beneficiario.apellidos}` : `Usuario ${id}` };

    const alumno = document.getElementById("motivoFJAlumno");
    if (alumno) alumno.textContent = this._fjPendiente.nombre;
    const input = document.getElementById("inputMotivoFJ");
    if (input) input.value = marca?.estado === "FJ" ? (marca.observacion || "") : "";
    const error = document.getElementById("motivoFJError");
    if (error) error.hidden = true;
    this._actualizarContadorMotivo();

    const modal = document.getElementById("modalMotivoFJ");
    if (!modal) return;
    if (!modal._fjCierre) {
      modal._fjCierre = true;
      modal.addEventListener("close", () => { this._fjPendiente = null; });
    }
    if (typeof modal.showModal === "function") {
      if (!modal.open) modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
    setTimeout(() => input?.focus(), 40);
  },

  cerrarMotivoFJ() {
    const modal = document.getElementById("modalMotivoFJ");
    if (!modal) return;
    if (typeof modal.close === "function") {
      if (modal.open) modal.close();
    } else {
      modal.removeAttribute("open");
    }
    this._fjPendiente = null;
  },

  _actualizarContadorMotivo() {
    const input = document.getElementById("inputMotivoFJ");
    const contador = document.getElementById("motivoFJContador");
    if (input && contador) contador.textContent = String(input.value.length);
  },

  confirmarMotivoFJ() {
    if (!this._fjPendiente) return;
    const ctrl = this._controlador();
    const input = document.getElementById("inputMotivoFJ");
    const error = document.getElementById("motivoFJError");
    const res = ctrl?.marcarFJ?.(this._fjPendiente.id, input?.value || "");

    if (!res?.ok) {
      if (error) {
        error.textContent = res?.error || "Escribe el motivo de la falta.";
        error.hidden = false;
      }
      return;
    }

    this.cerrarMotivoFJ();
    this.renderJornada();
  },

  // -------------------------------------------------------------------------
  //  Guardado
  // -------------------------------------------------------------------------

  async guardarJornada() {
    if (this._guardando) return;
    const ctrl = this._controlador();
    if (!ctrl) return;

    this._guardando = true;
    this._sincronizarBarra();
    this.applyFilters();

    const resultado = await ctrl.guardarJornada();

    this._guardando = false;

    if (resultado.ok) {
      const n = resultado.guardados || 0;
      window.PDI?.ToastView?.show?.(
        "Jornada guardada",
        `${n} marca${n === 1 ? "" : "s"} sincronizada${n === 1 ? "" : "s"} con SurrealDB.`,
        "success",
      );
      this.renderJornada();
      return;
    }

    if (resultado.conflictos) {
      window.PDI?.ToastView?.show?.(
        "La jornada cambió en otro dispositivo",
        "Revisa las diferencias antes de sobrescribir.",
        "warning",
      );
      this.renderJornada();
      return;
    }

    window.PDI?.ToastView?.show?.(
      "No se pudo guardar la jornada",
      resultado.error || "Revisa la conexión e intenta de nuevo.",
      "danger",
    );
    this._sincronizarBarra();
    this.applyFilters();
  },

  async sobrescribirJornada() {
    const ctrl = this._controlador();
    if (!ctrl) return;
    const seguir = await confirmar({
      titulo: "Sobrescribir la jornada",
      mensaje: "Se sobrescribirán los estados que otro dispositivo guardó para los alumnos que has marcado.",
      confirmar: "Sobrescribir",
      cancelar: "Cancelar",
      peligro: true,
    });
    if (!seguir) return;

    this._guardando = true;
    this._sincronizarBarra();
    this.applyFilters();
    const resultado = await ctrl.guardarJornada({ forzar: true });
    this._guardando = false;

    if (resultado.ok) {
      window.PDI?.ToastView?.show?.("Jornada sobrescrita", "Tus cambios quedaron guardados.", "success");
      this.renderJornada();
    } else {
      window.PDI?.ToastView?.show?.(
        "No se pudo sobrescribir",
        resultado.error || "Intenta de nuevo.",
        "danger",
      );
      this._sincronizarBarra();
      this.applyFilters();
    }
  },

  descartarAvisoRemoto() {
    this._controlador()?.descartarAvisoRemoto?.();
    this._renderAvisos();
    this._sincronizarBarra();
  },

  // -------------------------------------------------------------------------
  //  Filtros
  // -------------------------------------------------------------------------

  _initSort() {
    this._sortMenu = initSortMenu({
      id: "CasitasSort",
      onSelect: (valor) => this.sortBy(valor),
    });
    this._sortMenu?.sync(`${this._sortKey}-${this._sortDir}`);
  },

  sortBy(valor) {
    const [key, dir] = String(valor || "").split("-");
    if (!key) return;
    this._sortKey = key;
    this._sortDir = dir === "desc" ? "desc" : "asc";
    this._sortMenu?.sync(`${this._sortKey}-${this._sortDir}`);
    this.applyFilters();
  },

  _ordenarLista(lista) {
    const dir = this._sortDir === "desc" ? -1 : 1;
    const nombre = (b) => `${b.apellidos || ""} ${b.nombres || ""}`;
    const pesoNivel = { Inicial: 0, Primaria: 1, Secundaria: 2 };
    return [...lista].sort((a, b) => {
      let cmp = 0;
      switch (this._sortKey) {
        case "sede":
          cmp = String(a.sede || "").localeCompare(String(b.sede || ""), "es");
          break;
        case "edad": {
          const va = parseInt(a.edad, 10);
          const vb = parseInt(b.edad, 10);
          cmp = (isNaN(va) ? 999 : va) - (isNaN(vb) ? 999 : vb);
          break;
        }
        case "grado": {
          const na = pesoNivel[a.nivelEducativo] ?? 9;
          const nb = pesoNivel[b.nivelEducativo] ?? 9;
          cmp = na - nb;
          if (cmp === 0) cmp = String(a.grado || "").localeCompare(String(b.grado || ""), "es");
          break;
        }
        default:
          cmp = nombre(a).localeCompare(nombre(b), "es");
      }
      if (cmp === 0) cmp = nombre(a).localeCompare(nombre(b), "es");
      return cmp * dir;
    });
  },

  renderTable(beneficiarios) {
    this._delegarAsistencia();
    this._leerFiltrosDeURL();
    this._normalizarJornadaPorRol();
    if (this._jornadaSede) this._jornadaInicializada = true;
    this._initSort();
    if (beneficiarios && Array.isArray(beneficiarios)) {
      this._allBeneficiarios = beneficiarios;
    } else if (window.PDI?.BeneficiarioModel) {
      this._allBeneficiarios = window.PDI.BeneficiarioModel.getAll();
    }
    this._vigilarVariante();

    // Si nadie eligió sede todavía, se abre la primera con alumnos. Si ya hay
    // una jornada cargada para el mismo día/sede, no se vuelve a consultar:
    // las hidrataciones no deben borrar el estado ni multiplicar lecturas.
    const ctrl = this._controlador();
    const actual = ctrl?.getJornada?.();
    const misma = actual && actual.dia === this._jornadaDia && actual.sede === this._jornadaSede;

    if (!this._jornadaSede && !misma) {
      if (!this._jornadaInicializada) {
        this._prepararJornada();
      } else {
        this.renderJornada();
      }
      return;
    }
    if (!misma) {
      this._cargarJornada();
      return;
    }

    this._sincronizarBarra();
    this.renderJornada();
  },

  /** Redibuja solo lo que depende de la jornada, sin volver a consultar. */
  renderJornada() {
    this._sincronizarBarra();
    this._renderResumen();
    this._renderAvisos();
    this.applyFilters();
  },

  _vigilarVariante() {
    if (this._vigilaVariante) return;
    this._vigilaVariante = true;
    Responsive.alCambiarDeVariante(() => this.applyFilters());
  },

  filterBySearch(query) {
    this._searchQuery = (query || "").trim().toLowerCase();
    const clearBtn = document.getElementById("btnCasitasSearchClear");
    if (clearBtn) clearBtn.style.display = this._searchQuery.length > 0 ? "flex" : "none";
    this.applyFilters();
    this._persistirFiltros({ q: query || "" });
  },

  clearSearch() {
    const input = document.getElementById("inputCasitasSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  selectGrado(val, label) {
    this._obtenerStore().fijar("grado", val || "all");
    this._espejarStore();
    this._updateGradoUI(label);

    const drop = document.getElementById("dropdownCasitasGrado");
    if (drop) drop.classList.remove("open");

    this.applyFilters();
    this._persistirFiltros();
  },

  _updateGradoUI(alternativa) {
    this._pintarOpcionUnica(
      "menuCasitasGrado", "labelCasitasGradoSelect",
      this._filterGrado, alternativa || "Todos los Grados",
    );
  },

  removeFilter(filterKey) {
    if (filterKey === "search") this.clearSearch();
    if (filterKey === "grado") this.selectGrado("all", "Todos los Grados");
  },

  resetFilters() {
    this._searchQuery = "";
    this._obtenerStore().limpiar();
    this._espejarStore();

    const input = document.getElementById("inputCasitasSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnCasitasSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this._updateGradoUI();
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this.applyFilters();
    this._persistirFiltros();
  },

  _matchesGrado(b, gradoKey) {
    if (!gradoKey || gradoKey === "all") return true;
    const g = (b.grado || "").toLowerCase();
    if (gradoKey === "inicial") return g.includes("inicial") || g.includes("kinder") || g.includes("pre");
    if (gradoKey === "primaria") return g.includes("prim") || /^[1-6]/.test(g);
    if (gradoKey === "secundaria") return g.includes("sec") || g.includes("secundaria");
    return true;
  },

  /** Base fija de la vista: solo usuarios con servicio de Casita del Saber. */
  _baseCasitas() {
    return (this._allBeneficiarios || []).filter(b => {
      const servicios = Array.isArray(b.servicios) ? b.servicios : [];
      const estrategias = Array.isArray(b.estrategias) ? b.estrategias : [];
      return [...servicios, ...estrategias].some(s => {
        const texto = String(s || "").toLowerCase();
        return texto === "casita del saber" ||
          texto.includes("casita") ||
          texto.includes("educat") ||
          texto.includes("acompa");
      });
    });
  },

  /** Alumnos de la sede elegida. Es el universo de la jornada. */
  _baseJornada() {
    if (!this._jornadaSede) return [];
    return this._baseCasitas().filter(b => String(b.sede || "") === this._jornadaSede);
  },

  /** Búsqueda común a la lista y a los contadores de faceta. */
  _aplicaBusqueda(lista) {
    if (!this._searchQuery) return lista;
    const q = this._searchQuery;
    return lista.filter(b => {
      const full = `${b.nombres} ${b.apellidos} ${b.codigo} ${b.colegio} ${b.grado} ${b.apoderado} ${b.sede} ${b.distrito}`.toLowerCase();
      return full.includes(q);
    });
  },

  _updateFacetCounts() {
    const base = this._aplicaBusqueda(this._baseJornada());
    contarOpciones("menuCasitasGrado", base, (b, valor) => this._matchesGrado(b, valor));
  },

  applyFilters() {
    let lista = this._aplicaBusqueda(this._baseJornada());

    if (this._filterGrado !== "all") {
      lista = lista.filter(b => this._matchesGrado(b, this._filterGrado));
    }

    lista = this._ordenarLista(lista);
    this._filteredBeneficiarios = lista;

    this._updateFacetCounts();

    const count = this._obtenerStore().contarActivos();
    const badgeEl = document.getElementById("casitasActiveFiltersCount");
    const btnFilterEl = document.getElementById("btnDropdownCasitasFilterPanel");
    if (badgeEl) {
      badgeEl.textContent = count;
      badgeEl.style.display = count > 0 ? "inline-flex" : "none";
    }
    if (btnFilterEl) btnFilterEl.classList.toggle("has-filters", count > 0);

    this._renderActiveChips();
    this._renderTableAndCards(lista);
  },

  _renderActiveChips() {
    const bar = document.getElementById("casitasActiveChipsBar");
    const list = document.getElementById("casitasActiveChipsList");
    if (!bar || !list) return;

    const chips = [];
    if (this._filterGrado !== "all") {
      const gradoNames = {
        inicial: "Inicial / Pre-escolar",
        primaria: "Primaria (1° a 6°)",
        secundaria: "Secundaria (1° a 5°)",
      };
      chips.push({
        id: "grado",
        label: `Nivel: ${gradoNames[this._filterGrado] || this._filterGrado}`,
      });
    }

    if (chips.length > 0) {
      bar.classList.add("is-visible");
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${escapar(chip.label)}</span>
          <button type="button" class="padron-chip-remove"
            onclick="window.removeCasitasChip ? window.removeCasitasChip('${escaparEnManejador(chip.id)}') : null"
            title="Eliminar filtro">
            ${iconHtml("accion.cerrar", { size: 10 })}
          </button>
        </span>
      `).join("");
    } else {
      bar.classList.remove("is-visible");
      list.innerHTML = "";
    }
  },

  _renderTableAndCards(casitaList) {
    const tbody = document.getElementById("tbodyAsistenciaCasita");
    const mobileContainer = document.getElementById("mobileCardsCasita");
    const paginationBar = document.getElementById("casitasPaginationBar");

    const totalCount = casitaList.length;
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (this._currentPage > totalPages) this._currentPage = totalPages;
    if (this._currentPage < 1) this._currentPage = 1;

    const startIndex = (this._currentPage - 1) * pageSize;
    const pageItems = casitaList.slice(startIndex, startIndex + pageSize);

    this._renderPagination(totalCount);
    if (paginationBar) paginationBar.style.display = totalCount === 0 ? "none" : "flex";

    const enMovil = Responsive.esMovil();

    if (enMovil) { if (tbody) tbody.innerHTML = ""; }
    else { if (mobileContainer) mobileContainer.innerHTML = ""; }

    if (casitaList.length === 0) {
      const mensaje = !this._jornadaSede
        ? { titulo: "Elige una sede", detalle: "La jornada se abre con un día y una sede." }
        : (this._baseJornada().length === 0
          ? { titulo: "No hay alumnos de Casita en esta sede", detalle: "Solo aparecen inscripciones activas con la estrategia Casita del Saber." }
          : { titulo: "No se encontraron registros", detalle: "Prueba con otro término de búsqueda o restablece los filtros." });

      const vacioHtml = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px 16px;">
            <div class="jornada-empty-icon">${iconHtml("archivo.libro", { size: 24 })}</div>
            <div class="jornada-empty-title">${escapar(mensaje.titulo)}</div>
            <div class="jornada-empty-text">${escapar(mensaje.detalle)}</div>
          </td>
        </tr>
      `;
      if (tbody && !enMovil) tbody.innerHTML = vacioHtml;

      if (mobileContainer && enMovil) {
        mobileContainer.innerHTML = `
          <div class="jornada-empty-mobile">
            <div class="jornada-empty-icon">${iconHtml("archivo.libro", { size: 24 })}</div>
            <div class="jornada-empty-title">${escapar(mensaje.titulo)}</div>
            <div class="jornada-empty-text">${escapar(mensaje.detalle)}</div>
          </div>
        `;
      }
      return;
    }

    if (tbody && !enMovil) {
      tbody.innerHTML = pageItems.map(b => {
        const colegio = colegioOrigenVisible(b);
        const nivel = nivelEducativoVisible(b);
        return `
        <tr class="padron-tr">
          <td>
            <div class="padron-user-cell">
              ${avatarHtml(b)}
              <div class="padron-user-info">
                <div class="padron-user-name" title="${escapar(`${b.nombres} ${b.apellidos}`)}">${escapar(b.nombres)} ${escapar(b.apellidos)}</div>
                <div class="padron-user-meta">
                  <span class="padron-code">${escapar(b.codigo)}</span>
                  <span class="padron-meta-sep">&bull;</span>
                  <span>DNI ${escapar(b.dni || '—')}</span>
                </div>
              </div>
            </div>
          </td>
          <td><div class="padron-location-title">${escapar(nivel)}</div></td>
          <td><div class="padron-location-title">${escapar(gradoVisible(b))}</div></td>
          <td><span class="celda-recortada" title="${escapar(colegio)}">${escapar(colegio)}</span></td>
          <td>
            <div class="padron-location-title">${escapar(b.apoderado)}</div>
            <div class="padron-location-sub">${escapar(b.parentesco)} &bull; ${escapar(b.telefono || 'Sin tel')}</div>
          </td>
          <td>
            ${this._tagAsistencia(b.id, "badgeAsist_")}
            ${this._motivoAsistencia(b.id)}
          </td>
          <td>
            <div class="asist-botones" id="btnGroupAsist_${escapar(b.id)}">
              ${this._botonesAsistencia(b.id)}
            </div>
          </td>
        </tr>
      `;
      }).join("");
    }

    if (mobileContainer && enMovil) {
      mobileContainer.innerHTML = pageItems.map(b => `
        <div class="mobile-card-item" id="mobile-casita-${escapar(b.id)}">
          <div class="datacard-header">
            <div class="datacard-id"><span>ID:</span> ${escapar(b.codigo)}</div>
            <div class="datacard-header-right">${this._badgeAsistencia(b.id, "badgeAsistMob_")}</div>
          </div>

          <div class="datacard-body">
            <div class="datacard-row">
              <span class="datacard-label">Usuario</span>
              <span class="datacard-value">${escapar(b.nombres)} ${escapar(b.apellidos)}</span>
            </div>
            <div class="datacard-row">
              <span class="datacard-label">Apoderado Autorizado</span>
              <span class="datacard-value">${escapar(b.apoderado)} <span class="celda-subtexto">(${escapar(b.parentesco)})</span></span>
            </div>

            <div class="asist-bloque-movil">
              <div class="asist-bloque-titulo">Asistencia del día</div>
              <div class="asist-botones asist-botones-movil" id="btnGroupMobAsist_${escapar(b.id)}">
                ${this._botonesAsistencia(b.id)}
              </div>
              ${this._motivoAsistencia(b.id)}
            </div>

            <div class="datacard-extra" id="extra-casita-${escapar(b.id)}">
              <div class="datacard-row">
                <span class="datacard-label">Nivel Educativo</span>
                <span class="datacard-value">${escapar(nivelEducativoVisible(b))}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Grado Escolar</span>
                <span class="datacard-value">${escapar(gradoVisible(b))}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Colegio de Origen</span>
                <span class="datacard-value">${escapar(colegioOrigenVisible(b))}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Sede Casita</span>
                <span class="datacard-value">${escapar(b.distrito)} - ${escapar(b.sede)}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Teléfono de Salida</span>
                <span class="datacard-value">${escapar(b.telefono || 'Sin registro')}</span>
              </div>
            </div>

            <button type="button" class="datacard-toggle-btn" id="btnToggleCasita-${escapar(b.id)}"
              onclick="window.PDI ? window.PDI.CasitasView.toggleCard(${escaparEnManejador(b.id)}) : null">
              <span class="btn-text">Ver más</span>
              ${iconHtml("nav.desplegar", { size: null })}
            </button>
          </div>
        </div>
      `).join("");
    }
  },

  toggleCard(id) {
    const card = document.getElementById(`mobile-casita-${id}`);
    const btn = document.getElementById(`btnToggleCasita-${id}`);
    if (card) {
      const isExp = card.classList.toggle("expanded");
      if (btn) {
        const textSpan = btn.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = isExp ? "Ver menos" : "Ver más";
      }
    }
  },

  /** Datos que consume el modal de exportación. */
  getDatosExportacion() {
    return {
      list: this._filteredBeneficiarios || [],
      mapa: this._controlador()?.getMapaExport?.() || {},
      meta: this._controlador()?.getJornada?.() || null,
    };
  },
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasView = CasitasView;
  window.filterCasitasSearch = (val) => CasitasView.filterBySearch(val);
  window.clearCasitasSearch = () => CasitasView.clearSearch();
  window.selectCasitasGrado = (val, label) => CasitasView.selectGrado(val, label);
  window.removeCasitasChip = (key) => CasitasView.removeFilter(key);
  window.resetCasitasFilters = () => CasitasView.resetFilters();
  window.casitasSetPageSize = (size) => CasitasView.setPageSize(size);
  window.casitasPrevPage = () => CasitasView.prevPage();
  window.casitasNextPage = () => CasitasView.nextPage();
  window.casitasCambiarDia = (dia) => CasitasView.cambiarDia(dia);
  window.casitasCambiarSede = (sede) => CasitasView.cambiarSede(sede);
  window.casitasGuardarJornada = () => CasitasView.guardarJornada();
  window.casitasSobrescribirJornada = () => CasitasView.sobrescribirJornada();
  window.casitasRecargarJornada = () => CasitasView.recargarJornada();
  window.casitasDescartarAviso = () => CasitasView.descartarAvisoRemoto();
  window.casitasConfirmarMotivoFJ = () => CasitasView.confirmarMotivoFJ();
  window.casitasCerrarMotivoFJ = () => CasitasView.cerrarMotivoFJ();
}
