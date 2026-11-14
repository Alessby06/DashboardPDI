import { AnimationEngine } from '../utils/AnimationEngine.js';
import { CsvExporter } from '../utils/CsvExporter.js';
import { escapar } from "../utils/HtmlHelper.js";

/**
 * Vista: Tablero Principal Dashboard (dashboard.astro)
 * Monitoreo ejecutivo de cobertura territorial, tríada de servicios y estado nutricional.
 */
export const DashboardView = {
  _haEntrado: false,
  _filtroSede: "all",
  _enlazado: false,

  _sello: null,
  _selloTimer: null,
  _selloLimpieza: false,
  _selloAnterior: 0,
  _cifrasPintadas: false,

  reiniciarEntrada() {
    this._haEntrado = false;
    this._enlazado = false;
    const desdeUrl = this._leerFiltroSedeDeURL();
    if (desdeUrl && desdeUrl !== "all") {
      this._filtroSede = desdeUrl;
    }
  },

  _leerFiltroSedeDeURL() {
    if (typeof window === "undefined" || !window.location) return "all";
    try {
      const params = new URLSearchParams(window.location.search);
      const sede = params.get("sede") || params.get("distrito");
      if (sede) return sede;
    } catch {
      // Ignorar fallos de URL
    }
    return "all";
  },

  _escribirFiltroSedeAURL(sede) {
    if (typeof window === "undefined" || !window.location || !window.history) return;
    try {
      const url = new URL(window.location.href);
      if (!sede || sede === "all") {
        url.searchParams.delete("sede");
        url.searchParams.delete("distrito");
      } else {
        url.searchParams.set("sede", sede);
      }
      const queryStr = url.searchParams.toString();
      const nuevoPath = url.pathname + (queryStr ? `?${queryStr}` : "") + url.hash;
      window.history.replaceState(null, "", nuevoPath);
    } catch {
      // Ignorar fallos de URL
    }
  },

  render(stats) {
    const esPrimeraEntrada = !this._haEntrado;
    this._haEntrado = true;

    const estado = window.PDI?.DB?.estadoActual?.() || "ok";
    const ultima = window.PDI?.DB?.ultimaHidratacion?.() || 0;

    // Sincronización del selector de sede con URL y memoria
    if (!this._filtroSede || this._filtroSede === "all") {
      const desdeUrl = this._leerFiltroSedeDeURL();
      if (desdeUrl && desdeUrl !== "all") {
        this._filtroSede = desdeUrl;
      }
    }

    const selectSede = document.getElementById("dashSelectSede");
    if (selectSede && selectSede.value !== this._filtroSede) {
      if (!this._filtroSede || this._filtroSede === "all") {
        selectSede.value = "all";
      } else {
        const tieneOpcion = Array.from(selectSede.options).some(
          opt => opt.value.toLowerCase() === this._filtroSede.toLowerCase()
        );
        if (tieneOpcion) {
          selectSede.value = this._filtroSede;
        }
      }
    }
    const filtroSede = this._filtroSede || (selectSede ? selectSede.value : "all");

    const statsFiltradas = (filtroSede && filtroSede !== "all" && window.PDI?.BeneficiarioModel?.getStats)
      ? window.PDI.BeneficiarioModel.getStats(filtroSede)
      : (stats || {});

    // Cálculo de subconjunto ASP para el ledger ejecutivo
    const allUsuarios = window.PDI?.BeneficiarioModel?.getAll?.() || [];
    let usuariosParaAsp = allUsuarios;
    if (filtroSede && filtroSede !== "all") {
      const q = String(filtroSede).toLowerCase();
      usuariosParaAsp = allUsuarios.filter(b => (b.sede && b.sede.toLowerCase().includes(q)) || (b.distrito && b.distrito.toLowerCase().includes(q)));
    }
    const casos = window.PDI?.CasoSocialModel?.getAll?.() || [];
    const casosActivos = casos.filter(c => c && c.etapa !== "cerrado").length;
    const personasAsp = new Set(
      casos
        .filter(c => c && c.etapa !== "cerrado")
        .map(c => String(c._personaId || c.beneficiarioId || ""))
        .filter(Boolean),
    );
    const usuariosAsp = usuariosParaAsp.filter(b => personasAsp.has(String(b._personaId || b.id)));

    // Estrategia Stale-While-Revalidate: si hay registros en memoria, pintar de inmediato (0 ms)
    const hayDatosEnMemoria = (statsFiltradas?.total != null && statsFiltradas.total > 0) || (allUsuarios?.length > 0);
    const datosOk = hayDatosEnMemoria || estado === "ok";
    const animarCifras = this._cifrasPintadas && datosOk;

    const ambitoLabel = document.getElementById("dashAmbitoLabel");
    if (ambitoLabel) {
      ambitoLabel.textContent = filtroSede === "all"
        ? "Ámbito: todas las sedes"
        : `Ámbito: ${filtroSede}`;
    }

    const fechaEl = document.getElementById("dashFolioFecha");
    if (fechaEl) {
      const ahora = new Date();
      try {
        fechaEl.textContent = new Intl.DateTimeFormat("es-PE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(ahora);
      } catch {
        fechaEl.textContent = "hoy";
      }
      try {
        fechaEl.dateTime = new Intl.DateTimeFormat("en-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(ahora);
      } catch {
        fechaEl.dateTime = "";
      }
    }

    // Folio firmado: responsable de la sesión
    const respEl = document.getElementById("dashFolioResponsable");
    if (respEl) {
      let nombre = "";
      try {
        nombre = localStorage.getItem("pdi_usuario_nombre") || "";
      } catch {
        nombre = "";
      }
      respEl.textContent = nombre || "Sesión no identificada";
    }

    // Sello de frescura
    this._sello = { estado, ultima };
    this._pintarSello();
    this._iniciarSello();

    // Banda Maestra de Resumen Institucional (Ledger ejecutivo 4 KPIs)
    const kpiTotalPadron = document.getElementById("kpiTotalPadron");
    if (kpiTotalPadron) {
      this._cifra(kpiTotalPadron, datosOk ? (statsFiltradas.total ?? 0) : "—", (n) => String(Math.round(n)), animarCifras);
    }
    const kpiTotalPadronSub = document.getElementById("kpiTotalPadronSub");
    if (kpiTotalPadronSub) {
      if (!datosOk) {
        kpiTotalPadronSub.textContent = "Cargando matrícula…";
      } else if (filtroSede && filtroSede !== "all") {
        kpiTotalPadronSub.textContent = `Filtro activo: ${filtroSede}`;
      } else {
        kpiTotalPadronSub.textContent = `${statsFiltradas.comasCount ?? 0} Comas · ${statsFiltradas.carabaylloCount ?? 0} Carabayllo`;
      }
    }

    const kpiTasaAnemia = document.getElementById("kpiTasaAnemia");
    if (kpiTasaAnemia) {
      this._cifra(kpiTasaAnemia, datosOk ? (statsFiltradas.pctTotalAnemia ?? 0) : "—", (n) => `${Math.round(n)} %`, animarCifras);
    }
    const kpiTasaAnemiaSub = document.getElementById("kpiTasaAnemiaSub");
    if (kpiTasaAnemiaSub) {
      if (!datosOk) {
        kpiTasaAnemiaSub.textContent = "En población tamizada";
      } else {
        kpiTasaAnemiaSub.textContent = `${statsFiltradas.totalAnemia ?? 0} de ${statsFiltradas.tamizados ?? 0} tamizados`;
      }
    }

    const kpiCasosAsp = document.getElementById("kpiCasosAsp");
    if (kpiCasosAsp) {
      this._cifra(kpiCasosAsp, datosOk ? casosActivos : "—", (n) => String(Math.round(n)), animarCifras);
    }
    const kpiCasosAspSub = document.getElementById("kpiCasosAspSub");
    if (kpiCasosAspSub) {
      if (!datosOk) {
        kpiCasosAspSub.textContent = "Seguimiento pastoral";
      } else {
        kpiCasosAspSub.textContent = `${usuariosAsp.length} niños en seguimiento`;
      }
    }

    const kpiSedesActivas = document.getElementById("kpiSedesActivas");
    if (kpiSedesActivas) {
      const sedesCount = window.PDI?.SedeModel?.getAll?.()?.length || 6;
      this._cifra(kpiSedesActivas, datosOk ? sedesCount : "—", (n) => String(Math.round(n)), animarCifras);
    }
    const kpiSedesActivasSub = document.getElementById("kpiSedesActivasSub");
    if (kpiSedesActivasSub) {
      kpiSedesActivasSub.textContent = "Comas y Carabayllo";
    }

    // Franja clínica: cifras directas y conteo calibrado (Ficha A6)
    const anemiaContainer = document.getElementById("dashAnemiaTable");
    if (anemiaContainer) {
      const bandas = [
        { fillId: "segAnemiaNormal", pctId: "anemiaPctNormal", casosId: "anemiaCasosNormal", pct: statsFiltradas.pctNormal, casos: statsFiltradas.normales },
        { fillId: "segAnemiaRiesgo", pctId: "anemiaPctRiesgo", casosId: "anemiaCasosRiesgo", pct: statsFiltradas.pctRiesgo, casos: statsFiltradas.riesgo },
        { fillId: "segAnemiaLeve", pctId: "anemiaPctLeve", casosId: "anemiaCasosLeve", pct: statsFiltradas.pctLeve, casos: statsFiltradas.leves },
        { fillId: "segAnemiaMod", pctId: "anemiaPctMod", casosId: "anemiaCasosMod", pct: statsFiltradas.pctMod, casos: statsFiltradas.moderadas },
      ];

      bandas.forEach(({ fillId, pctId, casosId, pct, casos }) => {
        const fill = document.getElementById(fillId);
        if (fill) {
          const escala = datosOk ? Math.max(0, Math.min(100, Number(pct) || 0)) / 100 : 0;
          fill.dataset.targetScale = String(escala);
          if (esPrimeraEntrada || !datosOk) {
            fill.style.transform = "scaleX(0)";
            if (datosOk) {
              void fill.offsetWidth;
              requestAnimationFrame(() => { fill.style.transform = `scaleX(${fill.dataset.targetScale})`; });
            }
          } else {
            fill.style.transform = `scaleX(${escala})`;
          }
        }

        const pctEl = document.getElementById(pctId);
        if (pctEl) this._cifra(pctEl, datosOk ? pct : "—", (n) => `${Math.round(n)} %`, animarCifras);
        const casosEl = document.getElementById(casosId);
        if (casosEl) {
          this._cifra(
            casosEl,
            datosOk ? casos : "—",
            (n) => (n === 1 ? "1 caso" : `${Math.round(n)} casos`),
            animarCifras,
          );
        }
      });
    }

    const tamEl = document.getElementById("dashTamizados");
    if (tamEl) {
      tamEl.textContent = datosOk
        ? `${statsFiltradas.tamizados ?? 0} de ${statsFiltradas.total ?? 0} tamizados`
        : "Sin datos clínicos";
    }
    const sinTamEl = document.getElementById("dashSinTamizaje");
    if (sinTamEl) {
      const sinTam = datosOk ? (statsFiltradas.sinTamizaje ?? 0) : 0;
      sinTamEl.hidden = sinTam <= 0;
      sinTamEl.textContent = sinTam > 0
        ? `Sin tamizaje: ${sinTam}`
        : "";
    }

    this._renderServicios(statsFiltradas, animarCifras);
    if (datosOk) this._cifrasPintadas = true;
  },

  _cifra(elemento, valor, formato, animar) {
    if (!elemento) return;
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
      elemento.textContent = String(valor);
      delete elemento.dataset.contadorValor;
      return;
    }
    if (!animar) {
      elemento.textContent = formato(numero);
      elemento.dataset.contadorValor = String(numero);
      return;
    }
    AnimationEngine.contar(elemento, numero, { formato });
  },

  _hace(ms) {
    const min = Math.floor(Math.max(0, ms) / 60000);
    if (min < 1) return "(hace menos de 1 min)";
    if (min < 60) return `(hace ${min} min)`;
    const h = Math.floor(min / 60);
    const resto = min % 60;
    if (h < 24) return resto ? `(hace ${h} h ${resto} min)` : `(hace ${h} h)`;
    const dias = Math.floor(h / 24);
    return dias === 1 ? "(hace 1 día)" : `(hace ${dias} días)`;
  },

  _pintarSello() {
    const chip = document.getElementById("dashEstado");
    const texto = document.getElementById("dashEstadoTexto");
    const haceEl = document.getElementById("dashEstadoHace");
    if (!chip || !texto) return;

    const { estado = "ok", ultima = 0 } = this._sello || {};
    const anterior = this._selloAnterior;
    this._selloAnterior = ultima;
    const refrescado = Boolean(anterior && ultima && ultima !== anterior);
    chip.classList.remove("is-warn", "is-loading");
    if (haceEl) haceEl.textContent = "";

    const poner = (mensaje) => {
      if (texto.textContent !== mensaje) texto.textContent = mensaje;
    };

    if (estado === "sin_conexion" && !ultima) {
      chip.classList.add("is-warn");
      poner("Sin conexión · reintentando");
      return;
    }
    if (estado !== "ok" && !ultima) {
      chip.classList.add("is-loading");
      poner("Cargando datos…");
      return;
    }
    if (!ultima) {
      poner("Datos disponibles");
      return;
    }

    let fecha;
    try {
      fecha = new Date(ultima);
    } catch {
      fecha = null;
    }
    if (!fecha || Number.isNaN(fecha.getTime())) {
      poner("Datos disponibles");
      return;
    }

    const ahora = new Date();
    const mismoDia = fecha.getFullYear() === ahora.getFullYear()
      && fecha.getMonth() === ahora.getMonth()
      && fecha.getDate() === ahora.getDate();

    let horaTexto = "-";
    let diaTexto = "";
    try {
      horaTexto = new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(fecha);
      diaTexto = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" }).format(fecha);
    } catch {
      // Ignorar fallos de formato
    }

    if (estado === "sin_conexion") {
      chip.classList.add("is-warn");
      poner(mismoDia
        ? `Actualizado hoy ${horaTexto} · sin conexión`
        : `Actualizado ${diaTexto} · sin conexión`);
    } else if (estado !== "ok") {
      chip.classList.add("is-loading");
      poner(mismoDia
        ? `Actualizado hoy ${horaTexto} · sincronizando…`
        : `Actualizado ${diaTexto} · sincronizando…`);
    } else {
      poner(mismoDia
        ? `Actualizado hoy ${horaTexto}`
        : `Actualizado ${diaTexto} · ${horaTexto}`);
    }
    const edad = Math.max(0, Date.now() - fecha.getTime());
    if (haceEl) haceEl.textContent = this._hace(edad);
    if (edad > 30 * 60 * 1000) chip.classList.add("is-warn");
    if (refrescado) AnimationEngine.destacar(chip);
  },

  _iniciarSello() {
    if (this._selloTimer) return;
    this._selloTimer = setInterval(() => this._pintarSello(), 60000);
    if (!this._selloLimpieza) {
      this._selloLimpieza = true;
      document.addEventListener("astro:before-swap", () => {
        clearInterval(this._selloTimer);
        this._selloTimer = null;
      });
    }
  },

  _mensajeSinDatos(textoVacio) {
    const estado = window.PDI?.DB?.estadoActual?.() || "ok";
    if (estado === "sin_conexion") {
      return "Sin conexión con la base de datos. Reintentando…";
    }
    if (estado !== "ok") return "Cargando datos…";
    return textoVacio;
  },

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

  _renderServicios(stats, animar = false) {
    let usuarios = window.PDI?.BeneficiarioModel?.getAll?.() || [];
    const filtroSede = this._filtroSede;
    if (filtroSede && filtroSede !== "all") {
      const q = String(filtroSede).toLowerCase();
      usuarios = usuarios.filter(b => (b.sede && b.sede.toLowerCase().includes(q)) || (b.distrito && b.distrito.toLowerCase().includes(q)));
    }
    const voluntarios = window.PDI?.VoluntarioModel?.getAll?.() || [];
    const casos = window.PDI?.CasoSocialModel?.getAll?.() || [];
    const claves = new Map(usuarios.map(b => [b, this._clavesServicio(b)]));
    const estado = window.PDI?.DB?.estadoActual?.() || "ok";
    const datosOk = estado === "ok";
    const valor = (n) => (datosOk ? String(n) : "-");
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

    const personasAsp = new Set(
      casos
        .filter(c => c && c.etapa !== "cerrado")
        .map(c => String(c._personaId || c.beneficiarioId || ""))
        .filter(Boolean),
    );
    const usuariosAsp = usuarios.filter(b => personasAsp.has(String(b._personaId || b.id)));
    const aspDesayuno = usuariosAsp.filter(b => claves.get(b).has("desayuno")).length;
    const aspLonchera = usuariosAsp.filter(b => claves.get(b).has("lonchera")).length;
    const aspCasita = usuariosAsp.filter(b => claves.get(b).has("casita")).length;

    const poner = (id, n) => {
      const el = document.getElementById(id);
      if (el) this._cifra(el, datosOk ? n : "—", (v) => String(Math.round(v)), animar);
    };

    poner("dashAlimUsuarios", alimentario);
    poner("dashEduActivos", educativo);
    poner("dashAspUsuarios", usuariosAsp.length);
    const microAsp = document.getElementById("dashAspCasosMicro");
    if (microAsp) {
      if (datosOk) {
        this._cifra(
          microAsp,
          casosActivos,
          (n) => (n === 1 ? "· 1 caso" : `· ${Math.round(n)} casos`),
          animar,
        );
      } else {
        microAsp.textContent = "";
        delete microAsp.dataset.contadorValor;
      }
    }
    poner("dashAlimDesayuno", desayuno);
    poner("dashAlimLonchera", lonchera);
    poner("dashAlimCred", stats.tamizados ?? 0);
    poner("dashEduCasita", casita);
    poner("dashEduBiblioteca", biblioteca);
    poner("dashAspDesayuno", aspDesayuno);
    poner("dashAspLonchera", aspLonchera);
    poner("dashAspCasita", aspCasita);

    // Voluntarios por servicio con soporte de tooltips abreviados
    const listaVol = document.getElementById("dashVoluntariosList");
    if (listaVol) {
      const previos = new Map();
      listaVol.querySelectorAll(".dash-vol-row").forEach((row) => {
        const clave = row.dataset.servicio;
        const cuenta = row.querySelector(".dash-vol-count");
        if (!clave || !cuenta) return;
        const n = Number(cuenta.dataset.contadorValor ?? cuenta.textContent);
        if (Number.isFinite(n)) previos.set(clave, n);
      });

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
        { clave: "asp", nombre: "Social pastoral (ASP)", abbrTitle: "Acompañamiento Social Pastoral" },
        { clave: "reposteria", nombre: "Talleres de repostería", abbrTitle: "Talleres Vocacionales y Repostería" },
      ];
      if ((grupos.otros || 0) > 0) {
        filas.push({ clave: "otros", nombre: "Otros servicios" });
      }
      const total = filas.reduce((s, f) => s + (grupos[f.clave] || 0), 0);
      const base = total || 1;
      const demanda = {
        desayuno,
        lonchera,
        casita,
        biblioteca,
        asp: usuariosAsp.length,
        reposteria: contar("reposteria"),
      };
      listaVol.innerHTML = filas.map(f => {
        const n = grupos[f.clave] || 0;
        const pct = datosOk ? Math.round((n / base) * 100) : 0;
        const usuariosServicio = demanda[f.clave] ?? 0;
        const falta = datosOk && n === 0 && usuariosServicio > 0;
        const sobra = datosOk && n > 0 && usuariosServicio === 0;
        const bandera = falta
          ? `<span class="dash-vol-flag">sin voluntarios</span>`
          : sobra
            ? `<span class="dash-vol-flag dash-vol-flag--dim">sin usuarios</span>`
            : "";
        const clase = falta ? " is-gap" : sobra ? " is-idle" : "";
        const nombreHtml = f.abbrTitle
          ? `<abbr title="${escapar(f.abbrTitle)}">${escapar(f.nombre)}</abbr>`
          : escapar(f.nombre);

        return `
          <li class="dash-vol-row${clase}" data-servicio="${f.clave}">
            <span class="dash-vol-name">${nombreHtml}${bandera}</span>
            <strong class="dash-vol-count">${valor(n)}</strong>
            <span class="dash-vol-track" aria-hidden="true"><span class="dash-vol-fill" style="width:${pct}%"></span></span>
          </li>
        `;
      }).join("");

      if (datosOk) {
        listaVol.querySelectorAll(".dash-vol-row").forEach((row) => {
          const clave = row.dataset.servicio;
          const cuenta = row.querySelector(".dash-vol-count");
          if (!clave || !cuenta) return;
          const n = grupos[clave] || 0;
          if (animar && previos.has(clave)) {
            cuenta.dataset.contadorValor = String(previos.get(clave));
            this._cifra(cuenta, n, (v) => String(Math.round(v)), true);
          } else {
            cuenta.textContent = String(n);
            cuenta.dataset.contadorValor = String(n);
          }
        });
      }

      const totalEl = document.getElementById("dashVolTotal");
      if (totalEl) this._cifra(totalEl, datosOk ? total : "—", (v) => String(Math.round(v)), animar);
    }

    // Línea de conciliación de población y servicios
    const recon = document.getElementById("dashReconcile");
    if (recon) {
      recon.textContent = datosOk
        ? `Población: ${usuarios.length} usuarios · ${alimentario} con ración · ${educativo} con acompañamiento · ${usuariosAsp.length} con caso ASP (${casosActivos} casos) · ${voluntarios.length} voluntarios.`
        : this._mensajeSinDatos("Sin datos para conciliar.");
    }

    this.renderTerritorio(usuarios, claves);
  },

  /**
   * Matriz territorial clasificada: Tríada Troncal e Iniciativas Comunitarias.
   * Organizada en escritorio como tabla semántica con encabezados de categoría;
   * en móvil, en bloques por distrito con subtítulos de sección.
   */
  renderTerritorio(usuarios, claves) {
    const container = document.getElementById("dashTerritoryMatrix");
    if (!container) return;

    const estado = window.PDI?.DB?.estadoActual?.() || "ok";
    if (estado !== "ok" || !usuarios.length) {
      const notaVacia = document.getElementById("dashMatrixNote");
      if (notaVacia) notaVacia.textContent = "";
      const mensaje = this._mensajeSinDatos("Sin usuarios registrados en el padrón.");
      const firmaVacia = `vacio:${mensaje}`;
      if (container.dataset.firma === firmaVacia) return;
      container.dataset.firma = firmaVacia;
      container.innerHTML = `<p class="dash-empty">${escapar(mensaje)}</p>`;
      return;
    }

    const distritos = [
      { clave: "comas", nombre: "Comas", largo: "Comas" },
      { clave: "carabayllo", nombre: "Carabayllo", largo: "Carabayllo" },
    ];
    const otras = { clave: "otras", nombre: "Otras sedes", largo: "Otras sedes / sin distrito" };

    const taxonomiaProgramas = [
      {
        grupo: "Tríada Troncal (Infancia Saludable)",
        items: [
          { clave: "desayuno", nombre: "Desayuno infantil", abbrTitle: "" },
          { clave: "lonchera", nombre: "Lonchera infantil", abbrTitle: "" },
          { clave: "casita", nombre: "Casita del Saber", abbrTitle: "" },
          { clave: "biblioteca", nombre: "Biblioteca comunitaria", abbrTitle: "" },
        ]
      },
      {
        grupo: "Iniciativas Comunitarias Complementarias",
        items: [
          { clave: "jac", nombre: "JAC", abbrTitle: "Juegos y Aprendizaje Comunitario" },
          { clave: "btf", nombre: "BTF", abbrTitle: "Bienestar y Terapia Familiar" },
          { clave: "reposteria", nombre: "Talleres de repostería", abbrTitle: "Talleres Vocacionales y Repostería" },
        ]
      }
    ];

    const todosProgramas = taxonomiaProgramas.flatMap(g => g.items);
    const mapaClaves = claves || new Map(usuarios.map(b => [b, this._clavesServicio(b)]));
    const resumen = Object.fromEntries([...distritos, otras].map(d => [d.clave, {
      total: 0,
      servicios: Object.fromEntries(todosProgramas.map(p => [p.clave, 0])),
    }]));

    usuarios.forEach(b => {
      const distrito = String(b?.distrito || "").trim().toLowerCase();
      const grupo = distritos.find(d => d.nombre.toLowerCase() === distrito);
      const clave = grupo ? grupo.clave : otras.clave;
      resumen[clave].total += 1;
      const c = mapaClaves.get(b);
      todosProgramas.forEach(p => { if (c.has(p.clave)) resumen[clave].servicios[p.clave] += 1; });
    });

    const totalUsuarios = usuarios.length;
    const basePct = totalUsuarios || 1;
    const ubicados = resumen.comas.total + resumen.carabayllo.total;
    const resto = resumen.otras.total;
    const visibles = resto > 0 ? [...distritos, otras] : distritos;

    const nota = document.getElementById("dashMatrixNote");
    if (nota) {
      const sustantivo = totalUsuarios === 1 ? "usuario" : "usuarios";
      const participio = totalUsuarios === 1 ? "ubicado" : "ubicados";
      nota.textContent = resto > 0
        ? `${ubicados} de ${totalUsuarios} ${sustantivo} ${participio} en Comas o Carabayllo; ${resto} en otras sedes o sin distrito.`
        : `${ubicados} de ${totalUsuarios} ${sustantivo} ${participio} en Comas o Carabayllo.`;
    }

    const cabeceras = visibles.map(d => {
      const info = resumen[d.clave];
      const pct = Math.round((info.total / basePct) * 100);
      return `<th scope="col" data-dist="${d.clave}">
        <span class="dash-matrix-dist">${escapar(d.nombre)}</span>
        <span class="dash-matrix-total">${info.total} usuarios · ${pct} %</span>
      </th>`;
    }).join("");

    const renderNombreProg = (p) => {
      if (p.abbrTitle) {
        return `<abbr title="${escapar(p.abbrTitle)}">${escapar(p.nombre)}</abbr>`;
      }
      return escapar(p.nombre);
    };

    const tbodyGrupos = taxonomiaProgramas.map(g => {
      const filasGrupo = g.items.map(p => {
        const celdas = visibles
          .map(d => `<td>${resumen[d.clave].servicios[p.clave]}</td>`)
          .join("");
        return `<tr><th scope="row">${renderNombreProg(p)}</th>${celdas}</tr>`;
      }).join("");
      return `
        <tbody>
          <tr class="dash-matrix-group-row">
            <th colspan="${visibles.length + 1}">${escapar(g.grupo)}</th>
          </tr>
          ${filasGrupo}
        </tbody>
      `;
    }).join("");

    const bloques = visibles.map(d => {
      const info = resumen[d.clave];
      const pct = Math.round((info.total / basePct) * 100);
      const gruposMovil = taxonomiaProgramas.map(g => {
        const filasMovil = g.items.map(p => `
          <div class="dash-matrix-mobile-row">
            <dt>${renderNombreProg(p)}</dt>
            <dd>${info.servicios[p.clave]}</dd>
          </div>`).join("");
        return `
          <h4 class="dash-matrix-mobile-subtitle">${escapar(g.grupo)}</h4>
          <dl class="dash-matrix-mobile-list">${filasMovil}</dl>
        `;
      }).join("");
      const etiqueta = d.clave === "otras" ? "Otras sedes o sin distrito" : `Distrito de ${d.nombre}`;
      return `
        <section class="dash-matrix-mobile-district" data-dist="${d.clave}" aria-label="${escapar(etiqueta)}">
          <h3>
            <span>${escapar(d.largo)}</span>
            <span class="dash-matrix-mobile-total">${info.total} usuarios · ${pct} %</span>
          </h3>
          ${gruposMovil}
        </section>`;
    }).join("");

    const firma = JSON.stringify({ cabeceras, tbodyGrupos, bloques });
    if (container.dataset.firma === firma) return;
    container.dataset.firma = firma;
    container.innerHTML = `
      <table class="dash-matrix">
        <caption class="dash-sr-only">Cobertura territorial por distrito y servicio</caption>
        <thead><tr><th scope="col">Servicio</th>${cabeceras}</tr></thead>
        ${tbodyGrupos}
      </table>
      <div class="dash-matrix-mobile">${bloques}</div>
    `;
  },

  enlazarEventos(alCambiar) {
    if (this._enlazado) return;
    this._enlazado = true;

    const selectSede = document.getElementById("dashSelectSede");
    if (selectSede) {
      const desdeUrl = this._leerFiltroSedeDeURL();
      if (desdeUrl && desdeUrl !== "all") {
        this._filtroSede = desdeUrl;
        selectSede.value = desdeUrl;
      }
      selectSede.addEventListener("change", (e) => {
        this._filtroSede = e.target.value;
        this._escribirFiltroSedeAURL(this._filtroSede);
        if (typeof alCambiar === "function") {
          alCambiar();
        } else {
          const stats = window.PDI?.BeneficiarioModel?.getStats?.(this._filtroSede) || {};
          this.render(stats);
        }
      });
    }

    const btnExport = document.getElementById("btnExportarParte");
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        this.exportarParteDiario();
      });
    }
  },

  exportarParteDiario() {
    const estado = window.PDI?.DB?.estadoActual?.() || "ok";
    if (estado !== "ok") {
      if (window.PDI?.ToastView) {
        window.PDI.ToastView.mostrar("Los datos aún se están sincronizando...", "warning");
      }
      return;
    }
    const filtroSede = this._filtroSede || "all";
    const bModel = window.PDI?.BeneficiarioModel;
    const stats = (bModel && bModel.getStats) ? bModel.getStats(filtroSede) : {};
    const hoy = new Date().toISOString().slice(0, 10);
    const ambito = filtroSede === "all" ? "Todas_las_Sedes" : filtroSede.replace(/\s+/g, "_");
    const nombreArchivo = `parte_diario_pdi_${ambito}_${hoy}.csv`;

    const encabezados = ["Seccion", "Indicador", "Cifra", "Detalle_Porcentaje"];
    const filas = [
      ["Encabezado", "Fecha de Corte", hoy, ""],
      ["Encabezado", "Ámbito Territorial", filtroSede === "all" ? "Todas las sedes" : filtroSede, ""],
      ["Padrón", "Padrón Activo Total", stats.total ?? 0, "100 %"],
      ["Padrón", "Tamizados con Dosaje Hb", stats.tamizados ?? 0, `${stats.tamizados ? Math.round((stats.tamizados / (stats.total || 1)) * 100) : 0} % cobertura`],
      ["Padrón", "Sin Tamizaje Registrado", stats.sinTamizaje ?? 0, ""],
      ["Clínica Hb", "Sin Anemia (>= 11.5 g/dL)", stats.normales ?? 0, `${stats.pctNormal ?? 0} % de tamizados`],
      ["Clínica Hb", "En Riesgo Sub-estándar (11.0 - 11.4 g/dL)", stats.riesgo ?? 0, `${stats.pctRiesgo ?? 0} % de tamizados`],
      ["Clínica Hb", "Anemia Leve (10.0 - 10.9 g/dL)", stats.leves ?? 0, `${stats.pctLeve ?? 0} % de tamizados`],
      ["Clínica Hb", "Anemia Moderada / Severa (< 10.0 g/dL)", stats.moderadas ?? 0, `${stats.pctMod ?? 0} % de tamizados`],
      ["Clínica Hb", "Prevalencia Total de Anemia", stats.totalAnemia ?? 0, `${stats.pctTotalAnemia ?? 0} % de tamizados`],
    ];

    if (CsvExporter && CsvExporter._descargar) {
      CsvExporter._descargar(nombreArchivo, encabezados, filas);
      if (window.PDI?.ToastView) {
        window.PDI.ToastView.mostrar("Parte diario descargado con éxito.", "success");
      }
    }
  },

  // Puente de compatibilidad con llamadas anteriores a métodos de auditoría
  renderAuditLogs(logs) {
    if (typeof window !== "undefined" && window.PDI?.AuditView?.renderAuditLogs) {
      return window.PDI.AuditView.renderAuditLogs(logs);
    }
  },
  openLogDetail(logId) {
    if (typeof window !== "undefined" && window.PDI?.AuditView?.openLogDetail) {
      return window.PDI.AuditView.openLogDetail(logId);
    }
  },
  toggleAuditCard(index) {
    if (typeof window !== "undefined" && window.PDI?.AuditView?.toggleAuditCard) {
      return window.PDI.AuditView.toggleAuditCard(index);
    }
  },
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}
