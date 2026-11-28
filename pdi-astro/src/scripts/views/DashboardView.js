import { AnimationEngine } from '../utils/AnimationEngine.js';
import { CsvExporter } from '../utils/CsvExporter.js';
import { escapar } from "../utils/HtmlHelper.js";
import { TallerBtfModel } from "../models/TallerBtfModel.js";
import { EncuentroJacModel } from "../models/EncuentroJacModel.js";
import { TallerReposteriaModel } from "../models/TallerReposteriaModel.js";
import { AccionEducativaModel } from "../models/AccionEducativaModel.js";

/**
 * Vista: Tablero Principal Dashboard (dashboard.astro)
 * Monitoreo ejecutivo de cobertura territorial, tríada de servicios y estado nutricional.
 */
export const DashboardView = {
  _haEntrado: false,
  _filtroSede: "all",
  _enlazado: false,
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
    const casosSinExpediente = casos.filter(c => c && c.sinExpediente).length;
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

    // Hero: tres cifras y su contexto.
    const totalPadron = Number(statsFiltradas.total ?? 0);
    const tamizados = Number(statsFiltradas.tamizados ?? 0);
    const comas = Number(statsFiltradas.comasCount ?? 0);
    const carabayllo = Number(statsFiltradas.carabaylloCount ?? 0);
    const otrasSedes = Math.max(0, totalPadron - comas - carabayllo);
    const cobertura = totalPadron > 0 ? Math.round((tamizados / totalPadron) * 100) : 0;
    const sinTamizaje = Number(statsFiltradas.sinTamizaje ?? 0);

    const kpiTotalPadron = document.getElementById("kpiTotalPadron");
    if (kpiTotalPadron) {
      this._cifra(kpiTotalPadron, datosOk ? totalPadron : 0, (n) => String(Math.round(n)), animarCifras);
    }
    const kpiTotalPadronSub = document.getElementById("kpiTotalPadronSub");
    if (kpiTotalPadronSub) {
      kpiTotalPadronSub.innerHTML = datosOk
        ? `<strong>${comas}</strong> en Comas · <strong>${carabayllo}</strong> en Carabayllo · <strong>${otrasSedes}</strong> en otras sedes`
        : "Cargando padrón…";
    }

    const kpiCobertura = document.getElementById("kpiCoberturaTamizaje");
    if (kpiCobertura) {
      this._cifra(kpiCobertura, datosOk ? cobertura : 0, (n) => `${Math.round(n)} %`, animarCifras);
    }
    const kpiCoberturaSub = document.getElementById("kpiCoberturaTamizajeSub");
    if (kpiCoberturaSub) {
      kpiCoberturaSub.innerHTML = datosOk
        ? `<strong>${tamizados} de ${totalPadron}</strong> usuarios con hemoglobina registrada`
        : "Cargando tamizajes…";
    }
    const barraCobertura = document.getElementById("dashBarraCobertura");
    if (barraCobertura) {
      barraCobertura.style.transform = `scaleX(${datosOk ? cobertura / 100 : 0})`;
    }
    const alertaSinTamizaje = document.getElementById("dashAlertaSinTamizaje");
    if (alertaSinTamizaje) {
      alertaSinTamizaje.hidden = !datosOk || sinTamizaje <= 0;
      alertaSinTamizaje.textContent = sinTamizaje > 0 ? `${sinTamizaje} sin tamizaje` : "";
    }

    const setGrow = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.style.flexGrow = String(Math.max(0, Number(valor) || 0));
    };
    setGrow("dashBarraComas", comas);
    setGrow("dashBarraCarabayllo", carabayllo);
    setGrow("dashBarraOtras", otrasSedes);

    const kpiTasaAnemia = document.getElementById("kpiTasaAnemia");
    if (kpiTasaAnemia) {
      this._cifra(kpiTasaAnemia, datosOk ? (statsFiltradas.pctTotalAnemia ?? 0) : 0, (n) => `${Math.round(n)} %`, animarCifras);
    }
    const kpiTasaAnemiaSub = document.getElementById("kpiTasaAnemiaSub");
    if (kpiTasaAnemiaSub) {
      kpiTasaAnemiaSub.textContent = datosOk
        ? `${statsFiltradas.totalAnemia ?? 0} de ${statsFiltradas.tamizados ?? 0} tamizados con anemia`
        : "En población tamizada";
    }

    const kpiCasosAsp = document.getElementById("kpiCasosAsp");
    if (kpiCasosAsp) {
      this._cifra(kpiCasosAsp, datosOk ? casosActivos : 0, (n) => String(Math.round(n)), animarCifras);
    }
    const kpiCasosAspSub = document.getElementById("kpiCasosAspSub");
    if (kpiCasosAspSub) {
      if (!datosOk) {
        kpiCasosAspSub.textContent = "Cargando seguimiento…";
      } else {
        const ninos = usuariosAsp.length;
        const alerta = casosSinExpediente > 0
          ? ` · <strong>${casosSinExpediente} ${casosSinExpediente === 1 ? "caso sin expediente" : "casos sin expediente"}</strong>`
          : "";
        kpiCasosAspSub.innerHTML = `<strong>${ninos} ${ninos === 1 ? "usuario" : "usuarios"}</strong> en acompañamiento · <strong>${casosActivos} ${casosActivos === 1 ? "caso" : "casos"}</strong> abiertos${alerta}`;
      }
    }

    const kpiSedesActivas = document.getElementById("kpiSedesActivas");
    if (kpiSedesActivas) {
      const sedesCount = window.PDI?.SedeModel?.getAll?.()?.length || 0;
      this._cifra(kpiSedesActivas, datosOk ? sedesCount : 0, (n) => String(Math.round(n)), animarCifras);
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
          const valor = datosOk ? Math.max(0, Math.min(100, Number(pct) || 0)) : 0;
          fill.style.flexGrow = String(valor);
        }

        const pctEl = document.getElementById(pctId);
        if (pctEl) this._cifra(pctEl, datosOk ? pct : 0, (n) => `${Math.round(n)} %`, animarCifras);
        const bandaEl = pctEl?.closest(".dash-banda");
        if (bandaEl) bandaEl.classList.toggle("is-cero", datosOk && Number(pct) === 0);
        const casosEl = document.getElementById(casosId);
        if (casosEl) {
          this._cifra(
            casosEl,
            datosOk ? casos : 0,
            (n) => (n === 1 ? "1 caso" : `${Math.round(n)} casos`),
            animarCifras,
          );
        }
      });

      const barraClinica = document.getElementById("dashAnemiaBarra");
      if (barraClinica) {
        if (datosOk) {
          barraClinica.classList.add("is-visible");
          if (esPrimeraEntrada) {
            barraClinica.classList.remove("is-visible");
            void barraClinica.offsetWidth;
            requestAnimationFrame(() => barraClinica.classList.add("is-visible"));
          }
        } else {
          barraClinica.classList.remove("is-visible");
        }
      }
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

  /** Chips de ámbito: relevan al select, que queda como soporte del filtro. */
  _pintarChips(select) {
    const host = document.getElementById("dashChips");
    if (!host || !select) return;

    const etiqueta = (texto) => String(texto || "").trim()
      .replace(/^(Distrito|Sede)\s+/i, "")
      .replace(/^Todas las sedes$/i, "Todas");

    host.innerHTML = [...select.options].map((opcion) => `
      <button type="button" class="dash-chip" data-value="${escapar(opcion.value)}" aria-pressed="${select.value === opcion.value}">
        ${escapar(etiqueta(opcion.textContent))}
      </button>
    `).join("");

    host.addEventListener("click", (evento) => {
      const chip = evento.target.closest(".dash-chip");
      if (!chip || select.value === chip.dataset.value) return;
      select.value = chip.dataset.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const cabecera = select.closest(".dash-cabecera");
    if (cabecera) cabecera.classList.add("is-chips");
    this._sincronizarChips(select);
  },

  _sincronizarChips(select) {
    if (!select) return;
    document.querySelectorAll("#dashChips .dash-chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.value === select.value));
    });
  },

  _cifra(elemento, valor, formato, animar) {    if (!elemento) return;
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
      if (/(^|\s)jac(\s|$)/.test(low) || low.includes("juntos aprendemos")) claves.add("jac");
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
    const valor = (n) => (datosOk ? String(n) : "0");
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

    // Cifra de cabecera de cada pliegue: resume sin abrir.
    const poner = (id, n) => {
      const el = document.getElementById(id);
      if (el) this._cifra(el, datosOk ? n : 0, (v) => String(Math.round(v)), animar);
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
          (n) => (n === 1 ? "1 caso abierto" : `${Math.round(n)} casos abiertos`),
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
    const biblioLocal = this._resumenBibliotecaPorDistrito();
    const biblioTotalLocal = biblioLocal.comas + biblioLocal.carabayllo + biblioLocal.otras;
    const repTotalLocal = (() => {
      try { return TallerReposteriaModel.resumenPorDistrito().totalMadres || 0; } catch { return 0; }
    })();

    poner("dashEduCasita", casita);
    poner("dashEduBiblioteca", biblioteca + biblioTotalLocal);
    const notaEdu = document.getElementById("dashEduNota");
    if (notaEdu) {
      notaEdu.textContent = datosOk
        ? `${educativo} de ${usuarios.length} usuarios del padrón con al menos un acompañamiento.`
        : "";
    }
    poner("dashAspDesayuno", aspDesayuno);
    poner("dashAspLonchera", aspLonchera);
    poner("dashAspCasita", aspCasita);

    const b2ServNum = document.getElementById("b2ServiciosNum");
    if (b2ServNum) b2ServNum.textContent = datosOk ? String(alimentario) : "—";
    const cred = Number(stats.tamizados) || 0;
    const maxServicio = Math.max(1, alimentario, desayuno, lonchera, cred);
    const valoresBarras = { desayuno, lonchera, cred };
    document.querySelectorAll("[data-b2-serv]").forEach((el) => {
      const valor = Number(valoresBarras[el.dataset.b2Serv]) || 0;
      el.style.height = `${datosOk ? Math.round((valor / maxServicio) * 100) : 0}%`;
    });

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
        { clave: "asp", nombre: "Social pastoral (ASP)" },
        { clave: "reposteria", nombre: "Talleres de repostería" },
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
        biblioteca: biblioteca + biblioTotalLocal,
        asp: usuariosAsp.length,
        reposteria: contar("reposteria") + repTotalLocal,
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
        const nombreHtml = escapar(f.nombre);

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
      if (totalEl) this._cifra(totalEl, datosOk ? total : 0, (v) => String(Math.round(v)), animar);

      const serviciosConDemanda = filas.filter((f) => (demanda[f.clave] || 0) > 0);
      const serviciosSinVoluntarios = datosOk
        ? serviciosConDemanda.filter((f) => (grupos[f.clave] || 0) === 0)
        : [];
      const brechasB2 = filas.filter((f) => {
        const n = grupos[f.clave] || 0;
        const us = demanda[f.clave] || 0;
        return (n === 0 && us > 0) || (n > 0 && us === 0);
      }).length;
      const b2EquipoNum = document.getElementById("b2EquipoNum");
      if (b2EquipoNum) b2EquipoNum.textContent = datosOk ? String(total) : "—";
      const b2EquipoSub = document.getElementById("b2EquipoSub");
      if (b2EquipoSub) b2EquipoSub.textContent = datosOk
        ? `${brechasB2} ${brechasB2 === 1 ? "brecha" : "brechas"}`
        : "—";
      this._renderAtencion(stats, {
        brecha: serviciosSinVoluntarios.length,
        base: datosOk ? serviciosConDemanda.length : 0,
        nombres: serviciosSinVoluntarios.map((f) => f.nombre),
      });
    }

    // Línea de conciliación de población y servicios
    const recon = document.getElementById("dashReconcile");
    if (recon) {
      recon.textContent = datosOk
        ? `Población: ${usuarios.length} usuarios · ${voluntarios.length} voluntarias activas.`
        : this._mensajeSinDatos("Sin datos para conciliar.");
    }

    this.renderTerritorio(usuarios, claves);
  },

  /** Prioridades del día: tres frentes accionables con su proporción real. */
  _renderAtencion(stats = {}, equipo = {}) {
    const estado = window.PDI?.DB?.estadoActual?.() || "ok";
    const datosOk = estado === "ok";

    const anemia = Number(stats?.moderadas) || 0;
    const tamizados = Number(stats?.tamizados) || 0;
    const sinTamizaje = Number(stats?.sinTamizaje) || 0;
    const padron = Number(stats?.total) || 0;
    const brecha = Number(equipo?.brecha) || 0;
    const baseEquipo = Number(equipo?.base) || 0;

    const pct = (parte, base) => (base > 0 ? Math.round((parte / base) * 100) : 0);
    const pctAnemia = pct(anemia, tamizados);
    const pctSinTamizaje = pct(sinTamizaje, padron);
    const pctBrecha = pct(brecha, baseEquipo);

    const set = (id, texto) => {
      const el = document.getElementById(id);
      if (el) el.textContent = texto;
    };
    const barra = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.style.width = `${datosOk ? Math.max(0, Math.min(100, valor)) : 0}%`;
    };

    set("atencionAnemiaTexto", String(anemia));
    set("atencionAnemiaUnidad", anemia === 1 ? "usuario" : "usuarios");
    set("atencionAnemiaMeta", tamizados > 0
      ? `${pctAnemia} % de los ${tamizados} usuarios tamizados`
      : "Sin tamizajes registrados");
    barra("atencionAnemiaBarra", pctAnemia);

    set("atencionSinTamizajeTexto", String(sinTamizaje));
    set("atencionSinTamizajeUnidad", sinTamizaje === 1 ? "usuario" : "usuarios");
    set("atencionSinTamizajeMeta", padron > 0
      ? `${pctSinTamizaje} % de los ${padron} usuarios del padrón`
      : "Sin padrón registrado");
    barra("atencionSinTamizajeBarra", pctSinTamizaje);

    set("atencionVoluntariosTexto", String(brecha));
    set("atencionVoluntariosUnidad", brecha === 1 ? "servicio" : "servicios");
    set("atencionVoluntariosMeta", baseEquipo > 0
      ? `${brecha} de ${baseEquipo} servicios con demanda`
      : "Sin servicios con demanda");
    barra("atencionVoluntariosBarra", pctBrecha);

    const detalle = document.getElementById("atencionVoluntariosDetalle");
    if (detalle) {
      const nombres = Array.isArray(equipo?.nombres) ? equipo.nombres : [];
      const visibles = nombres.slice(0, 2);
      const resto = nombres.length - visibles.length;
      detalle.textContent = visibles.join(" · ") + (resto > 0 ? ` · +${resto}` : "");
      detalle.hidden = !datosOk || visibles.length === 0;
    }

    const filas = [
      ["atencionFilaAnemia", anemia],
      ["atencionFilaSinTamizaje", sinTamizaje],
      ["atencionFilaVoluntarios", brecha],
    ];
    filas.forEach(([id, n]) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !datosOk || n <= 0;
    });

    const frentes = datosOk ? filas.filter(([, n]) => n > 0).length : 0;

    const resumen = document.getElementById("atencionResumen");
    if (resumen) {
      if (!datosOk) {
        resumen.textContent = estado === "sin_conexion"
          ? "Sin conexión con la base de datos."
          : "Revisando prioridades.";
      } else {
        const partes = [];
        const ninos = anemia + sinTamizaje;
        if (ninos > 0) partes.push(`${ninos} ${ninos === 1 ? "usuario" : "usuarios"}`);
        if (brecha > 0) partes.push(`${brecha} ${brecha === 1 ? "servicio" : "servicios"}`);
        resumen.textContent = partes.length
          ? `Pendientes: ${partes.join(" y ")}.`
          : "Sin pendientes abiertos.";
      }
    }

    const vacio = document.getElementById("atencionVacio");
    const vacioTexto = document.getElementById("atencionVacioTexto");
    if (vacio && vacioTexto) {
      vacio.hidden = frentes > 0;
      vacio.dataset.estado = !datosOk
        ? (estado === "sin_conexion" ? "error" : "cargando")
        : "ok";

      if (frentes <= 0) {
        if (estado === "sin_conexion") {
          vacioTexto.textContent = "Sin conexión con la base de datos. Reintentando…";
        } else if (!datosOk) {
          vacioTexto.textContent = "Revisando pendientes…";
        } else if (padron === 0 && baseEquipo === 0) {
          vacioTexto.textContent = "Aún no hay datos del padrón para priorizar.";
        } else {
          const serviciosConEquipo = Math.max(0, baseEquipo - brecha);
          vacioTexto.innerHTML = `Todo al día: <b>${tamizados} de ${padron}</b> usuarios tamizados`
            + (baseEquipo > 0 ? ` y <b>${serviciosConEquipo} de ${baseEquipo}</b> servicios con equipo.` : ".");
        }
      }
    }

    // Resumen B2: prevalencia total (leve + moderada) para el módulo de contexto.
    const anemiaTotal = anemia + (Number(stats?.leves) || 0);
    const pctAnemiaTotal = pct(anemiaTotal, tamizados);
    const b2AnemiaPct = document.getElementById("b2AnemiaPct");
    if (b2AnemiaPct) b2AnemiaPct.textContent = datosOk ? `${pctAnemiaTotal} %` : "—";
    const b2AnemiaSub = document.getElementById("b2AnemiaSub");
    if (b2AnemiaSub) b2AnemiaSub.textContent = datosOk ? `${anemiaTotal} de ${tamizados}` : "—";
    const segmentosB2 = {
      normal: Number(stats?.pctNormal) || 0,
      riesgo: Number(stats?.pctRiesgo) || 0,
      leve: Number(stats?.pctLeve) || 0,
      mod: Number(stats?.pctMod) || 0,
    };
    document.querySelectorAll("[data-b2-seg]").forEach((el) => {
      const valor = Number(segmentosB2[el.dataset.b2Seg]) || 0;
      el.style.width = `${datosOk ? Math.max(0, Math.min(100, valor)) : 0}%`;
    });
  },

  _resumenBibliotecaPorDistrito() {
    const out = { comas: 0, carabayllo: 0, otras: 0 };
    try {
      const lista = AccionEducativaModel.getAllAcciones();
      lista.forEach(item => {
        const acciones = Array.isArray(item.acciones) ? item.acciones : [];
        const esBiblio = acciones.some(a => {
          const low = String(a || "").toLowerCase();
          return low.includes("biblioteca") || low.includes("cuento");
        });
        if (!esBiblio) return;
        const total = (Number(item.participantesNinos) || 0) + (Number(item.participantesAdultos) || 0);
        const dist = String(item.distrito || "").trim().toLowerCase();
        if (dist === "comas") out.comas += total;
        else if (dist === "carabayllo") out.carabayllo += total;
        else out.otras += total;
      });
    } catch {
      // Sin acciones educativas registradas
    }
    return out;
  },

  /**
   * Matriz territorial clasificada: Servicios Principales e Iniciativas Territoriales Comunitarias.
   * Una sola tabla semántica: en móvil cada fila se recompone en servicio + barra
   * + distritos, en vez de duplicar el marcado por distrito.
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
        grupo: "Servicios Principales de Atención Directa",
        items: [
          { clave: "desayuno", nombre: "Desayuno infantil" },
          { clave: "lonchera", nombre: "Lonchera infantil" },
          { clave: "casita", nombre: "Casita del Saber" },
          { clave: "biblioteca", nombre: "Biblioteca comunitaria" },
        ]
      },
      {
        grupo: "Iniciativas Territoriales y Comunitarias",
        items: [
          { clave: "jac", nombre: "Juntos Aprendemos en Cristo (JAC)" },
          { clave: "btf", nombre: "Buen Trato en Familia (BTF)" },
          { clave: "reposteria", nombre: "Talleres Productivos de Repostería" },
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

    // Sumar cobertura real de Biblioteca Comunitaria, Talleres BTF, Encuentros JAC y Repostería
    try {
      const biblio = this._resumenBibliotecaPorDistrito();
      resumen.comas.servicios.biblioteca += biblio.comas;
      resumen.carabayllo.servicios.biblioteca += biblio.carabayllo;
      resumen.otras.servicios.biblioteca += biblio.otras;

      const fuentesTerritoriales = [
        ["btf", TallerBtfModel],
        ["jac", EncuentroJacModel],
        ["reposteria", TallerReposteriaModel],
      ];
      fuentesTerritoriales.forEach(([clave, modelo]) => {
        const datos = modelo.resumenPorDistrito();
        resumen.comas.servicios[clave] += datos.comas || 0;
        resumen.carabayllo.servicios[clave] += datos.carabayllo || 0;
        resumen.otras.servicios[clave] += datos.otras || 0;
      });
    } catch {
      // Sin registros locales complementarios
    }

    const totalUsuarios = usuarios.length;
    const basePct = totalUsuarios || 1;
    const ubicados = resumen.comas.total + resumen.carabayllo.total;
    const resto = resumen.otras.total;
    const visibles = resto > 0 ? [...distritos, otras] : distritos;

    const b2TerrUbicados = document.getElementById("b2TerritorioUbicados");
    if (b2TerrUbicados) b2TerrUbicados.textContent = String(ubicados);
    const b2TerrTotal = document.getElementById("b2TerritorioTotal");
    if (b2TerrTotal) b2TerrTotal.textContent = String(totalUsuarios);
    const distritosB2 = {
      comas: resumen.comas.total,
      carabayllo: resumen.carabayllo.total,
      otras: resumen.otras.total,
    };
    document.querySelectorAll("[data-b2-terr]").forEach((el) => {
      const valor = Number(distritosB2[el.dataset.b2Terr]) || 0;
      el.style.width = `${Math.round((valor / basePct) * 100)}%`;
    });

    const nota = document.getElementById("dashMatrixNote");
    if (nota) {
      const sustantivo = totalUsuarios === 1 ? "usuario" : "usuarios";
      const participio = totalUsuarios === 1 ? "ubicado" : "ubicados";
      nota.textContent = resto > 0
        ? `${ubicados} de ${totalUsuarios} ${sustantivo} ${participio} en Comas o Carabayllo; ${resto} en otras sedes o sin distrito.`
        : `${ubicados} de ${totalUsuarios} ${sustantivo} ${participio} en Comas o Carabayllo.`;
    }

    const sustantivoTotal = totalUsuarios === 1 ? "usuario" : "usuarios";

    const cabeceras = visibles.map(d => {
      const info = resumen[d.clave];
      const pct = Math.round((info.total / basePct) * 100);
      return `<th scope="col" data-dist="${d.clave}">
        <span class="dash-matrix-dist">${escapar(d.nombre)}</span>
        <span class="dash-matrix-total">${info.total} ${sustantivoTotal}</span>
        <span class="dash-matrix-share">${pct} %</span>
      </th>`;
    }).join("");

    // El total por servicio y la barra de móvil se miden contra el servicio
    // con más cobertura: así las barras comparan filas entre sí.
    const totalServicio = (p) => visibles.reduce((suma, d) => suma + resumen[d.clave].servicios[p.clave], 0);
    const mayorServicio = Math.max(1, ...todosProgramas.map(totalServicio));
    const cuota = (n) => `${((n / mayorServicio) * 100).toFixed(1)}%`;
    const totalColumnas = visibles.length + 1;
    const cabeceraGrupo = `
      <tr class="dash-matrix-col-row" aria-hidden="true">
        <th class="dash-matrix-col-servicio">Servicio</th>
        ${visibles.map(d => `<th>${escapar(d.nombre)}</th>`).join("")}
        <th>Total</th>
      </tr>`;

    const tbodyGrupos = taxonomiaProgramas.map(g => {
      const filasGrupo = g.items.map(p => {
        const celdas = visibles
          .map(d => `<td data-k="${escapar(d.nombre)}"><span class="dash-matrix-label">${escapar(d.nombre)}</span>${resumen[d.clave].servicios[p.clave]}</td>`)
          .join("");
        const comas = resumen.comas.servicios[p.clave];
        const carabayllo = resumen.carabayllo.servicios[p.clave];
        const total = totalServicio(p);
        return `<tr${total === 0 ? ' class="is-vacio"' : ""} style="--a:${cuota(comas)};--b:${cuota(comas + carabayllo)};--c:${cuota(total)}">
          <th scope="row">${escapar(p.nombre)}</th>${celdas}
          <td data-k="Total" class="dash-matrix-total-cell"><span class="dash-matrix-label">Total</span>${total}</td>
        </tr>`;
      }).join("");
      return `
        <tbody>
          <tr class="dash-matrix-group-row">
            <th colspan="${visibles.length + 2}" scope="rowgroup">
              <span class="dash-matrix-group-inner">
                <span>${escapar(g.grupo)}</span>
                <span class="dash-matrix-group-count">${g.items.length} servicios</span>
              </span>
            </th>
          </tr>
          ${cabeceraGrupo}
          ${filasGrupo}
        </tbody>
      `;
    }).join("");

    const firma = JSON.stringify({ cabeceras, tbodyGrupos });
    if (container.dataset.firma === firma) return;
    container.dataset.firma = firma;
    container.innerHTML = `
      <table class="dash-matrix" style="--cols:${totalColumnas}">
        <caption class="dash-sr-only">Cobertura territorial por distrito y servicio</caption>
        <thead>
          <tr>
            <th scope="col">Servicio</th>
            ${cabeceras}
            <th scope="col" class="dash-matrix-col-total">Total</th>
          </tr>
        </thead>
        ${tbodyGrupos}
      </table>
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
        this._sincronizarChips(selectSede);
        if (typeof alCambiar === "function") {
          alCambiar();
        } else {
          const stats = window.PDI?.BeneficiarioModel?.getStats?.(this._filtroSede) || {};
          this.render(stats);
        }
      });
      this._pintarChips(selectSede);
    }

    const btnExport = document.getElementById("btnExportarParte");
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        const hoy = new Date().toISOString().slice(0, 10);
        const ambito = this._filtroSede === "all" ? "Todas las sedes" : this._filtroSede;
        const stats = window.PDI?.BeneficiarioModel?.getStats?.(this._filtroSede) || {};
        const resaltado = 'style="font-family: var(--mono-font); color: var(--text-brand);"';

        // Mismo modal de descarga que auditoría y las demás secciones: cabecera,
        // resumen de registros, marco legal y aviso de confidencialidad.
        window.openModalExportGeneric({
          title: "Descarga del Parte Diario",
          subtitle: "Confirmación de generación de reporte",
          description: `Se generará un archivo <strong ${resaltado}>.CSV</strong> con el corte del <strong ${resaltado}>${escapar(hoy)}</strong> para <strong>${escapar(ambito)}</strong>.`,
          count: stats.total ?? 0,
          unit: "usuarios",
          legal: "Ley N.° 29733 (Datos Personales)",
          onConfirm: () => this.exportarParteDiario(),
        });
      });
    }

    this._conectarB2Sheets();
  },

  /**
   * B2 móvil: los cuatro módulos de contexto abren una hoja estándar de la app
   * con el contenido ya renderizado de su sección. No se duplica la lógica de
   * datos ni el marcado: se clona la sección, se le quitan los ids y se muestra
   * en la hoja. El SheetController global aporta arrastre, velo y Escape.
   */
  _conectarB2Sheets() {
    if (this._b2SheetsListo) return;
    this._b2SheetsListo = true;

    const modal = document.getElementById("modalDashboardDetalle");
    if (!modal) return;
    const caja = modal.querySelector(".modal-box");
    const cuerpo = document.getElementById("dashDetalleBody");
    const titulo = document.getElementById("dashDetalleTitle");
    const meta = document.getElementById("dashDetalleMeta");
    const cerrar = document.getElementById("btnCerrarDashboardDetalle");
    const disparadores = [...document.querySelectorAll("[data-dash-sheet]")];
    let ultimoDisparador = null;
    let abierto = false;

    const fuentes = {
      anemia: {
        titulo: "Anemia infantil (Hb)",
        fuente: () => document.querySelector(".dash-clinica"),
        meta: () => {
          const parrafo = document.querySelector(".dash-clinica-cab p");
          if (!parrafo) return "";
          return [...parrafo.querySelectorAll("span")]
            .map((span) => span.textContent.trim())
            .filter(Boolean)
            .join(" · ");
        },
      },
      services: {
        titulo: "Servicios del programa",
        fuente: () => document.querySelector(".dash-servicios"),
        meta: () => document.querySelector(".dash-servicios-seccion > .dash-seccion-cab span")?.textContent.trim() || "",
      },
      territory: {
        titulo: "Cobertura por distrito",
        fuente: () => document.querySelector(".dash-panel-bloque:not(.dash-voluntarios) .dash-panel"),
        meta: () => document.getElementById("dashMatrixNote")?.textContent.trim() || "",
      },
      team: {
        titulo: "Equipo en campo",
        fuente: () => document.querySelector(".dash-voluntarios .dash-panel"),
        meta: () => document.querySelector(".dash-voluntarios .dash-panel-cab p")?.textContent.trim() || "",
      },
    };

    const abrir = (tipo, disparador) => {
      const cfg = fuentes[tipo];
      if (!cfg || !cuerpo) return;
      ultimoDisparador = disparador || document.activeElement;
      cuerpo.replaceChildren();
      if (meta) meta.textContent = cfg.meta ? cfg.meta() : "";
      if (titulo) titulo.textContent = cfg.titulo;

      const origen = cfg.fuente ? cfg.fuente() : null;
      if (origen) {
        const clon = origen.cloneNode(true);
        clon.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
        clon.querySelectorAll("[aria-labelledby], [aria-describedby]").forEach((el) => {
          el.removeAttribute("aria-labelledby");
          el.removeAttribute("aria-describedby");
        });
        const contenedor = document.createElement("div");
        contenedor.className = "dash-detail-content";
        contenedor.append(clon);
        cuerpo.append(contenedor);
      } else {
        const vacio = document.createElement("p");
        vacio.className = "dash-detail-empty";
        vacio.textContent = "Cargando detalle…";
        cuerpo.append(vacio);
      }

      if (tipo === "team") {
        const recon = document.getElementById("dashReconcile")?.textContent.trim();
        if (recon) {
          const nota = document.createElement("p");
          nota.className = "dash-detail-note";
          nota.textContent = recon;
          cuerpo.append(nota);
        }
      }

      cuerpo.scrollTop = 0;
      modal.removeAttribute("inert");
      modal.setAttribute("aria-hidden", "false");
      modal.classList.add("open");
      abierto = true;
      if (caja) caja.focus({ preventScroll: true });
    };

    const cerrarHoja = () => {
      if (!abierto) return;
      abierto = false;
      modal.classList.remove("open");
      modal.setAttribute("inert", "");
      modal.setAttribute("aria-hidden", "true");
      if (ultimoDisparador instanceof HTMLElement) ultimoDisparador.focus({ preventScroll: true });
    };

    disparadores.forEach((btn) => btn.addEventListener("click", () => abrir(btn.dataset.dashSheet, btn)));
    cerrar?.addEventListener("click", cerrarHoja);

    document.addEventListener("keydown", (e) => {
      if (!abierto || e.key !== "Tab") return;
      const enfocables = [...modal.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")]
        .filter((el) => el.getClientRects().length > 0);
      if (!enfocables.length) {
        e.preventDefault();
        caja?.focus({ preventScroll: true });
        return;
      }
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === caja)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    });

    this._b2Cerrar = cerrarHoja;
  },

  exportarParteDiario() {
    const estado = window.PDI?.DB?.estadoActual?.() || "ok";
    if (estado !== "ok") {
      if (window.PDI?.ToastView) {
        window.PDI.ToastView.show("Los datos aún se están sincronizando...", "", "warning");
      }
      return;
    }
    const btnExport = document.getElementById("btnExportarParte");
    const btnLabel = document.getElementById("btnExportarParteLabel");
    if (btnExport) btnExport.setAttribute("aria-busy", "true");
    if (btnLabel) btnLabel.textContent = "Generando…";

    try {
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
          window.PDI.ToastView.show("Reporte exportado", `Consolidado territorial (${ambito.replace(/_/g, " ")}) descargado con éxito.`, "success");
        }
      }
    } finally {
      setTimeout(() => {
        if (btnExport) btnExport.setAttribute("aria-busy", "false");
        if (btnLabel) btnLabel.textContent = "Exportar reporte";
      }, 500);
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
