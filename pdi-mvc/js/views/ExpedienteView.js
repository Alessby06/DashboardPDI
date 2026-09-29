// ===========================================================================
//  VISTA: Expediente Integral del Beneficiario
// ===========================================================================
//  Antes de la conversion a MPA el expediente era una ventana sobre el padron:
//  ModalView.openExpediente() llenaba #modalExpediente y lo abria encima. Como
//  pagina es un documento mas, con su propia URL, y eso cambia tres cosas:
//
//    1. Ya no hay una ventana que abrir. Esta vista se pinta sobre el DOM que
//       declaro src/pages/expediente.html, y no hay ningun 'modal.classList'.
//    2. El menor lo decide la URL (expediente?id=3), no un argumento. Por eso
//       render() lo lee, y por eso se puede compartir y recargar.
//    3. Una URL sin id, o con un id que no existe, es un caso real: un enlace
//       viejo, un menor dado de baja mientras el enlace circulaba. Se dice en
//       pantalla en vez de pintar un expediente vacio sin explicacion.
//
//  El marcado de las seis secciones no se toco: se movio del modal a la pagina.
//  Solo se reescribio el envoltura (cabecera y barra de acciones). Por eso las
//  clases modal-tab-btn y modal-tab-pane siguen llamandose asi: las selecciona
//  css/views.css y renombrarlas no compensaba el riesgo.
import { BeneficiarioModel } from "../models/BeneficiarioModel.js";
import { CasoSocialModel } from "../models/CasoSocialModel.js";
import { AuditModel } from "../models/AuditModel.js";
import { ToastView } from "./ToastView.js";
import { crear as crearFiltros } from "../utils/Filters.js";

// Avatares cuando no hay fotografia. Un expediente de DEMUNA tiene que poder
// imprimirse, y una imagen rota o un icono de usuario generico no sirven ni
// para eso ni para leerlo a distancia. Estos SVG no dependen de la red.
function getChildAvatarSvg(sex) {
  const isFemale = sex === "F";
  const bgColor = isFemale ? "#2a152f" : "#002b23";
  const accent = isFemale ? "#d946ef" : "#00b494";
  const skin = isFemale ? "#f0b88c" : "#e5a676";
  const hair = "#1e1b18";

  if (!isFemale) {
    return `<svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block; width:100%; height:100%; background:${bgColor};">
          <rect width="120" height="120" fill="${bgColor}"/>
          <circle cx="60" cy="52" r="26" fill="${skin}"/>
          <path d="M34 46 C34 30, 44 22, 60 22 C76 22, 86 30, 86 46 C80 40, 72 38, 60 38 C48 38, 40 40, 34 46 Z" fill="${hair}"/>
          <ellipse cx="50" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <ellipse cx="70" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <path d="M52 62 Q60 69 68 62" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M52 76 L68 76 L72 88 L48 88 Z" fill="${skin}"/>
          <path d="M30 120 C30 92, 45 84, 60 84 C75 84, 90 92, 90 120 Z" fill="${accent}"/>
          <polygon points="60,84 52,98 68,98" fill="#ffffff" opacity="0.9"/>
        </svg>`;
  }
  return `<svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block; width:100%; height:100%; background:${bgColor};">
          <rect width="120" height="120" fill="${bgColor}"/>
          <circle cx="60" cy="52" r="26" fill="${skin}"/>
          <path d="M32 50 C30 26, 44 20, 60 20 C76 20, 90 26, 88 50 C88 68, 84 76, 82 82 C78 72, 78 50, 78 40 C66 42, 54 42, 42 40 C42 50, 42 72, 38 82 C36 76, 32 68, 32 50 Z" fill="${hair}"/>
          <circle cx="36" cy="34" r="6" fill="${accent}"/>
          <circle cx="84" cy="34" r="6" fill="${accent}"/>
          <ellipse cx="50" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <ellipse cx="70" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <path d="M52 63 Q60 70 68 63" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M52 76 L68 76 L72 88 L48 88 Z" fill="${skin}"/>
          <path d="M28 120 C28 92, 44 84, 60 84 C76 84, 92 92, 92 120 Z" fill="${accent}"/>
          <path d="M50 84 Q60 94 70 84" fill="#ffffff" opacity="0.9"/>
        </svg>`;
}

function getAdultAvatarSvg(parentesco) {
  const isFemale = /madre|mama|mamá|tia|tía|abuela|hermana/i.test(parentesco || "");
  const bgColor = isFemale ? "#241829" : "#131b2e";
  const accent = isFemale ? "#f472b6" : "#38bdf8";
  const skin = isFemale ? "#e8ab80" : "#d99b6e";
  const hair = "#1e1b18";

  if (!isFemale) {
    return `<svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect width="100" height="100" rx="8" fill="${bgColor}"/>
          <circle cx="50" cy="42" r="21" fill="${skin}"/>
          <path d="M30 38 C30 24, 40 18, 50 18 C60 18, 70 24, 70 38 C64 33, 56 32, 50 32 C44 32, 36 33, 30 38 Z" fill="${hair}"/>
          <path d="M40 37 L46 37" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
          <path d="M54 37 L60 37" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
          <circle cx="43" cy="42" r="2.5" fill="#1e293b"/>
          <circle cx="57" cy="42" r="2.5" fill="#1e293b"/>
          <path d="M44 51 Q50 56 56 51" stroke="#92400e" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M44 62 L56 62 L58 72 L42 72 Z" fill="${skin}"/>
          <path d="M22 100 C22 76, 36 70, 50 70 C64 70, 78 76, 78 100 Z" fill="${accent}"/>
          <polygon points="50,70 44,82 56,82" fill="#ffffff" opacity="0.9"/>
        </svg>`;
  }
  return `<svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect width="100" height="100" rx="8" fill="${bgColor}"/>
          <circle cx="50" cy="42" r="21" fill="${skin}"/>
          <path d="M28 42 C26 22, 38 16, 50 16 C62 16, 74 22, 72 42 C72 58, 68 64, 66 68 C64 56, 64 40, 64 32 C54 34, 46 34, 36 32 C36 40, 36 56, 34 68 C32 64, 28 58, 28 42 Z" fill="${hair}"/>
          <circle cx="28" cy="48" r="2" fill="#fbbf24"/>
          <circle cx="72" cy="48" r="2" fill="#fbbf24"/>
          <path d="M40 37 Q43 35 46 37" stroke="#1e293b" stroke-width="1.8" fill="none"/>
          <path d="M54 37 Q57 35 60 37" stroke="#1e293b" stroke-width="1.8" fill="none"/>
          <circle cx="43" cy="42" r="2.5" fill="#1e293b"/>
          <circle cx="57" cy="42" r="2.5" fill="#1e293b"/>
          <path d="M44 52 Q50 57 56 52" stroke="#b91c1c" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M44 62 L56 62 L58 72 L42 72 Z" fill="${skin}"/>
          <path d="M20 100 C20 76, 35 70, 50 70 C65 70, 80 76, 80 100 Z" fill="${accent}"/>
          <path d="M42 70 Q50 80 58 70" fill="#ffffff" opacity="0.9"/>
        </svg>`;
}

// El unico estado que vive en la URL es el id del menor. Se declara con
// Filters.js y no a mano para que la escritura de la barra de direcciones siga
// having un solo responsable, y para que una URL editada a mano no rompa nada.
const FILTROS_EXPEDIENTE = {
  id: { valor: null, numeros: { min: 1 } },
};

// Campos que pasa a editar el modo edicion. estan en la vista y no en el DOM:
// repetirlos en el marcado y aqui es la forma de que se separen.
const CAMPOS_EDITABLES = [
  "expNombres", "expApellidos", "expDni", "expFechaNac", "expEdad",
  "expDireccion", "expReferencia", "expDistritoSede", "expModalidadEstrategia",
  "expExoneracion", "expSeguro", "expCentroSalud", "expAlergias", "expGrado",
  "expColegio", "expApoderadoNombre", "expApoderadoParentesco", "expApoderadoDni",
  "expApoderadoTel", "expTelefonoAlt", "expPesoTalla", "expHb",
];

export const ExpedienteView = {
  _id: null,
  isEditing: false,
  _editServicios: [],
  _enlazado: false,

  _obtenerFiltros() {
    if (!this._filtros) this._filtros = crearFiltros(FILTROS_EXPEDIENTE);
    return this._filtros;
  },

  /** Escucha lo que solo ocurre una vez por carga. */
  init() {
    if (this._enlazado) return;
    this._enlazado = true;

    this._enlazarSecciones();

    const anterior = document.getElementById("expPrevBtn");
    if (anterior) anterior.onclick = () => this._desplazar(-1);
    const siguiente = document.getElementById("expNextBtn");
    if (siguiente) siguiente.onclick = () => this._desplazar(1);

    // El boton de volver reutiliza la URL que ya da RouteMap, para que un cambio
    // de nombre de pagina no deje un enlace roto en el expediente.
    const volver = document.getElementById("expBackToPadron");
    if (volver) {
      const url = window.PDI?.RouteMap?.urlDe?.("padron");
      if (url) volver.href = url;
    }
  },

  /**
   * Las seis secciones del expediente.
   *
   * Antes eran pestanas de un modal y el ambito era el propio modal; aqui es la
   * pagina entera, asi que el ambito es #view-expediente. Se acota a proposito:
   * sin el, un .modal-tab-btn de otro sitio (el modal deNuevoMenor tambien
   * tiene) cambiaria de estilo al hacer clic.
   */
  _enlazarSecciones() {
    const raiz = document.getElementById("view-expediente");
    if (!raiz) return;

    raiz.querySelectorAll(".modal-tab-btn").forEach(boton => {
      boton.onclick = () => {
        raiz.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
        raiz.querySelectorAll(".modal-tab-pane").forEach(p => { p.style.display = "none"; });
        boton.classList.add("active");
        const destino = raiz.querySelector("#" + boton.dataset.tab);
        if (destino) destino.style.display = "block";
      };
    });
  },

  /**
   * Punto de dibujado. Lee la URL, resuelve el menor y pinta.
   *
   * No lleva guardia de una sola ejecucion, al contrario que en las paginas de
   * listados: aqui releer la URL en cada repintado es justo lo que hace falta,
   * porque el boton de atras y el de siguiente cambian el id sin recargar.
   */
  render() {
    const estadoSinExpediente = document.getElementById("expSinExpediente");

    // Un enlace puede venir por codigo (openExpedienteByCodigo) en vez de por
    // id. Se resuelve y se reescribe la URL con replaceState: no es un paso
    // que el usuario pueda deshacer, es la misma direccion en otra forma. Asi
    // todo lo de aqui abajo trabaja con un solo criterio.
    //
    // El codigo se quita de la URL, no se deja al lado. Con las dos, la
    // direccion que se comparte seria "?codigo=X&id=3", y bastaria con que
    // alguien la tocara para que las dos dejaran de concordar sin que nada se
    // avise. El codigo solo sobrevive en la barra cuando no se pudo resolver,
    // que es justo cuando hace falta para poder explicar el error.
    const params = new URLSearchParams(window.location.search);
    const codigoPedido = params.get("codigo");
    let codigoNoEncontrado = null;

    if (codigoPedido) {
      if (params.get("id")) {
        // Llegan las dos. Manda el id, que es la clave que la pagina sabe leer,
        // y el codigo se va por redundante, diga o no lo que dijera.
        this._obtenerFiltros().escribir({}, { quitar: ["codigo"] });
      } else {
        const porCodigo = BeneficiarioModel.getByCodigo(codigoPedido);
        if (porCodigo) {
          this._obtenerFiltros().escribir({ id: porCodigo.id }, { quitar: ["codigo"] });
          return this.render();
        }
        codigoNoEncontrado = codigoPedido;
      }
    }

    const f = this._obtenerFiltros().leer();
    const menor = f.id ? BeneficiarioModel.getById(f.id) : null;

    if (!menor) {
      this._id = null;
      this.isEditing = false;
      if (estadoSinExpediente) estadoSinExpediente.style.display = "block";
      document.getElementById("expPageTitle").textContent = "Expediente Integral del Beneficiario";
      const sub = document.getElementById("expPageSubtitle");
      if (sub) sub.textContent = "";
      document.querySelector(".expediente-page-body").style.display = "none";
      document.querySelector(".expediente-page-actions").style.display = "none";
      document.querySelector(".expediente-page-nav").style.display = "none";

      // Se nombra lo que se pidio. Con un codigo inexistente decir "no se
      // indico que expediente abrir" seria falso: si se indico, y no existe.
      const buscado = f.id
        ? `el id ${f.id}`
        : (codigoNoEncontrado ? `el código ${codigoNoEncontrado}` : null);
      document.getElementById("expSinExpedienteTitulo").textContent = buscado
        ? `No hay ningún menor con ${buscado}`
        : "No se indicó qué expediente abrir";
      document.getElementById("expSinExpedienteDetalle").textContent = buscado
        ? "Puede que se haya dado de baja, o que el enlace sea de otra instalación."
        : "Esta página necesita saber a qué menor corresponde. Se llega desde el Padrón de Beneficiarios.";
      return;
    }

    if (estadoSinExpediente) estadoSinExpediente.style.display = "none";
    document.querySelector(".expediente-page-body").style.display = "";
    document.querySelector(".expediente-page-actions").style.display = "";
    document.querySelector(".expediente-page-nav").style.display = "";

    const casos = CasoSocialModel.getAll();
    const caso = casos.find(c => c.codigo === menor.codigo);

    this._pintar(menor, caso);
    this._pintarPosicion();
  },

  _pintar(b, caso) {
    this._id = b.id;
    if (this.isEditing) this.isEditing = false;
    this._editServicios = Array.isArray(b.servicios) ? [...b.servicios] : [];

    this._pintarBotones();
    this._pintarCabecera(b);
    this._pintarIdentidad(b);
    this._pintarSalud(b);
    this._pintarEscolaridad(b);
    this._pintarEntornoFamiliar(b);
    this._pintarConsentimiento(b);
    this._pintarDeclaracionJurada(b);
    this._pintarSocial(b, caso);
    this._pintarDerivacionASP(b, caso);
    this.renderProgramasInscritos(b.servicios, false);
    this._pintarCroquisYFachada(b);
  },

  // --- cabecera, estado de los botones y navegacion entre menores ------------

  _pintarCabecera(b) {
    const titulo = document.getElementById("expPageTitle");
    if (titulo) titulo.textContent = `Expediente Integral: ${b.nombres} ${b.apellidos} (${b.codigo})`;

    const sub = document.getElementById("expPageSubtitle");
    if (sub) {
      const sede = b.sede ? `Sede ${b.sede}` : "Sin sede asignada";
      // b.edad ya viene con su unidad desde data/fixtures ("4 años"), igual que
      // en el padron y en salud. Pegarle aqui un sufijo segundo producia
      // "4 años anios" en el subtitulo.
      sub.textContent = `${b.edad} - ${b.sexo === "M" ? "Masculino" : "Femenino"} - ${sede}`;
    }
  },

  _pintarBotones() {
    const editBtn = document.getElementById("btnToggleEditExp");
    const saveBtn = document.getElementById("btnSaveExpChanges");
    const delBtn = document.getElementById("btnDeleteBeneficiario");

    if (editBtn) {
      editBtn.style.display = "inline-flex";
      editBtn.classList.remove("danger");
      editBtn.innerHTML = `
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
        <span>Editar Datos</span>`;
    }
    if (saveBtn) saveBtn.style.display = "none";
    if (delBtn) delBtn.style.display = this._rolEsDirectivo() ? "inline-flex" : "none";

    const badge = document.getElementById("expEditingBadge");
    if (badge) badge.style.display = "none";
  },

  _rolEsDirectivo() {
    const sel = document.getElementById("roleSelector");
    const rol = sel ? sel.value : "coord";
    return rol === "coord" || rol === "admin";
  },

  /**
   * Recorre el padron en su orden natural. Va con pushState y no con replaceState
   * porque pasar de menor a menor si es un paso por el que se quiere volver con
   * el boton atras, a diferencia de cambiar un filtro.
   *
   * Recorre el padron entero, no el subconjunto que se estaba viendo en el
   * padron: la pagina no sabe que filtros tenia aplicados, y adivinarlo
   * produciria saltos que el usuario no pidio. Si algun dia hace falta, el
   * lugar es pasar los filtros aplicados en el enlace, no suponerlos aqui.
   */
  _desplazar(direccion) {
    if (!this._id) return;
    const lista = BeneficiarioModel.getAll();
    const indice = lista.findIndex(b => b.id === this._id);
    if (indice === -1) return;

    const destino = lista[indice + direccion];
    if (!destino) return;

    // Salir del modo edicion antes de cambiar de menor. Los campos editables se
    // rellenan con los del destino, asi que lo que se hubiera escrito a mano se
    // pierde igual, pero al menos no se llega a la ficha siguiente con la
    // pantalla en modo edicion y sin avisar. El mismo repintado lo usa el boton
    // atras del navegador, asi que el comportamiento es el mismo en las dos
    // direcciones.
    this.isEditing = false;
    this._obtenerFiltros().anadir({ id: destino.id }, () => this.render());
    window.scrollTo(0, 0);
  },

  _pintarPosicion() {
    const lista = BeneficiarioModel.getAll();
    const indice = lista.findIndex(b => b.id === this._id);
    const total = lista.length;

    const prev = document.getElementById("expPrevBtn");
    const next = document.getElementById("expNextBtn");
    if (prev) {
      prev.disabled = indice <= 0;
      prev.title = indice > 0
        ? `Expediente ${indice} de ${total}: ${lista[indice - 1].nombres} ${lista[indice - 1].apellidos}`
        : "Es el primero del padron";
    }
    if (next) {
      next.disabled = indice === -1 || indice >= total - 1;
      next.title = indice >= 0 && indice < total - 1
        ? `Expediente ${indice + 2} de ${total}: ${lista[indice + 1].nombres} ${lista[indice + 1].apellidos}`
        : "Es el ultimo del padron";
    }
  },

  // --- secciones ------------------------------------------------------------

  /** Asigna un valor a un campo, o "-" si el dato no existe. */
  _set(id, valor) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "INPUT") el.value = valor || "-";
    else el.textContent = valor || "-";
  },

  _pintarIdentidad(b) {
    const marco = document.getElementById("expChildPhotoFrame");
    if (marco) {
      marco.innerHTML = b.fotoUrl
        ? `<img src="${b.fotoUrl}" alt="Foto de ${b.nombres}">`
        : getChildAvatarSvg(b.sexo);
    }
    this._set("expPhotoName", `${b.nombres} ${b.apellidos}`);
    this._set("expPhotoCode", b.codigo);
    this._set("expPhotoMeta", `${b.edad} - ${b.sexo === "M" ? "Masculino" : "Femenino"} - ${b.sede ? `Sede ${b.sede}` : "Sin sede asignada"}`);

    // La foto se guarda en cuanto se elige, sin pasar por Guardar Cambios: es un
    // archivo, no un campo, y el guardado de datos no tiene por que arrastrarlo.
    const input = document.getElementById("childPhotoInput");
    if (input) {
      input.onchange = (e) => {
        const archivo = e.target.files && e.target.files[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = (ev) => {
          b.fotoUrl = ev.target.result;
          if (marco) marco.innerHTML = `<img src="${b.fotoUrl}" alt="Foto de ${b.nombres}">`;
          BeneficiarioModel.update(b.id, b);
          ToastView.show("Fotografia actualizada", `Se guardo la fotografia de ${b.nombres} ${b.apellidos}.`, "success");
        };
        lector.readAsDataURL(archivo);
      };
    }

    this._set("expCodigo", b.codigo);
    this._set("expNombres", b.nombres);
    this._set("expApellidos", b.apellidos);
    this._set("expDni", b.dni);
    this._set("expFechaNac", b.fechaNacimiento || "No registrada");
    this._set("expEdad", `${b.edad} (${b.sexo === "M" ? "Masculino" : "Femenino"})`);
    this._set("expEdadSexo", `${b.edad} / ${b.sexo}`);
    this._set("expSexo", b.sexo === "M" ? "Masculino" : "Femenino");
    this._set("expDireccion", b.direccion || "Mz. 4W Lt. 30, Comite 12");
    this._set("expReferencia", b.referencia || "Sin referencia adicional");
    this._set("expDistritoSede", `${b.distrito} - Sede ${b.sede}`);
    this._set("expSede", `${b.distrito} - Sede ${b.sede}`);

    // Exoneracion: solo nomenclatura limpia (100%, 50%, 0%). El dato guardado
    // puede traer el texto largo del formulario y el expediente la nomenclatura
    // que se cita en el documento oficial.
    let exoneracion = "100%";
    if (b.exoneracionAporte) {
      if (b.exoneracionAporte.includes("50%")) exoneracion = "50%";
      else if (b.exoneracionAporte.includes("0%")) exoneracion = "0%";
      else if (b.exoneracionAporte.includes("100%")) exoneracion = "100%";
      else exoneracion = b.exoneracionAporte;
    }
    this._set("expExoneracion", exoneracion);
  },

  _pintarSalud(b) {
    this._set("expSeguro", b.seguro || "SIS Gratuito");
    this._set("expCentroSalud", b.centroSalud || `C.S. ${b.sede}`);
    this._set("expAlergias", b.alergias || "Ninguna");
    this._set("expPesoTalla", `${b.peso || 14.5} kg / ${b.talla || 96.0} cm`);
    this._set("expHb", `${b.hb || 11.0} g/dL (${b.anemia || "Normal"})`);
    this._set("expCanasta", b.canastaEntregada ? "Entregada (Canasta Nutricional)" : "No requerida");
    this._set("expOrientacion", b.orientacionFamiliar ? "Completada con Cuidador" : "En programacion");
  },

  _pintarEscolaridad(b) {
    this._set("expNivelEducativo", b.nivelEducativo || (b.grado && b.grado.includes("Prim") ? "Primaria" : "Inicial"));
    this._set("expGrado", b.grado || "Inicial");
    this._set("expColegio", b.colegio || "I.E. Local de la Zona");
    this._set("expAsistencia", "94.2% de Asistencia (Sede Regular)");
    this._set("expKits", "Kit Escolar Faber-Castell Entregado");
  },

  _pintarEntornoFamiliar(b) {
    this._set("expApoderado", `${b.apoderado} (${b.parentesco || "Madre"}) - DNI ${b.apoderadoDni || "-"}`);
    this._set("expApoderadoNombre", b.apoderado);
    this._set("expApoderadoParentesco", b.parentesco || "Madre");
    this._set("expApoderadoDni", b.apoderadoDni || "En validacion");
    this._set("expTelefono", b.telefono || "-");
    this._set("expApoderadoTel", b.telefono || "-");
    this._set("expTelefonoAlt", b.telefonoAlt || "No registrado");
    this._set("expRetiro", b.retiroAutorizado || `${b.apoderado} (Apoderado Principal)`);

    const contenedor = document.getElementById("expRetiroPadronContainer");
    if (!contenedor) return;

    // El padron de retiro autorizado. Si no hay ninguno, se muestra el apoderado
    // principal: un expediente sin ninguna persona autorizada deja un hueco en
    // el control de retiro seguro, y conviene que se vea en la pantalla.
    const lista = (b.retiroPadron && b.retiroPadron.length > 0)
      ? b.retiroPadron
      : [{ nombre: b.apoderado, dni: b.apoderadoDni || "41982341", parentesco: b.parentesco || "Madre", telefono: b.telefono }];

    contenedor.innerHTML = lista.map((p, idx) => `
      <div class="retiro-person-card">
        <div class="retiro-person-photo">
          ${p.fotoUrl ? `<img src="${p.fotoUrl}" alt="${p.nombre}">` : getAdultAvatarSvg(p.parentesco)}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
            <strong style="font-size:13px; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${idx + 1}. ${p.nombre}</strong>
          </div>
          <div style="display:flex; align-items:center; gap:6px; margin:3px 0;">
            <span class="badge badge-blue" style="font-size:10.5px; padding:2px 6px;">${p.parentesco}</span>
            <span style="font-size:11.5px; color:var(--text-muted); font-family:var(--mono-font);">DNI ${p.dni}</span>
          </div>
          <div style="font-size:11.5px; color:var(--text-dim); display:flex; align-items:center; gap:4px;">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
            <span>Tel: ${p.telefono}</span>
          </div>
        </div>
      </div>
    `).join("");
  },

  _pintarConsentimiento(b) {
    const cont = document.getElementById("expConsentimientoChecksContainer");
    if (!cont) return;

    const tarjeta = (titulo, desc, norma) => `
      <div class="ley-consent-card">
        <div class="ley-card-header">
          <div class="ley-card-title">
            <svg width="15" height="15" fill="none" stroke="var(--gt-green)" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            <span>${titulo}</span>
          </div>
        </div>
        <div class="ley-card-desc">${desc}</div>
        <span class="ley-card-art">${norma}</span>
      </div>`;

    cont.innerHTML = `
      <div class="ley-consent-grid">
        ${tarjeta("Evaluacion y Seguimiento Social", "Elaboracion de historias de vida, encuestas de vulnerabilidad y metricas de impacto socioeconico.", "Art. 13, num. 5 y 6 Ley 29733")}
        ${tarjeta("Registro Audiovisual Institucional", "Toma de fotografias y videos para memorias anuales, rendicion de cuentas e informes a benefactores.", "Art. 13, num. 5 Ley 29733")}
        ${tarjeta("Gestion de Fondos y Sostenibilidad", "Recaudacion de aportes, auditorias de donantes y reportes financieros de permanencia del programa.", "Art. 13, num. 5 y 6 Ley 29733")}
        ${tarjeta("Flujo Transfronterizo de Datos", "Transferencia a la entidad cooperante Kinderwerk Lima e.V. (Alemania) con cifrado y medidas de seguridad.", "D.S. N. 016-2024-JUS")}
      </div>
      <div class="ley-cert-box">
        <div class="ley-cert-badge-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div class="ley-cert-text">
          <strong>Certificacion de Consentimiento Informado Valido</strong><br>
          Otorgado y firmado digitalmente por el apoderado legal: <strong>${b.apoderado}</strong> (DNI: <strong>${b.apoderadoDni || "41982341"}</strong>). Cumplimiento normativo vigente bajo la <strong>Ley N. 29733</strong> y el <strong>D.S. N. 016-2024-JUS</strong>.
        </div>
      </div>`;
  },

  // Ficha A2: Declaracion Jurada de Continuidad. Los registros guardados antes
  // de que existiera este bloque no tienen el campo, y eso se muestra como
  // "No suscrita" en lugar de fallar: leer b.declaracionJurada.suscrita a pelo
  // daria undefined en pantalla, que es indistinguible de un dato no leido.
  _pintarDeclaracionJurada(b) {
    const cont = document.getElementById("expDeclaracionJuradaBox");
    if (!cont) return;

    const dj = (b && typeof b.declaracionJurada === "object" && b.declaracionJurada !== null)
      ? b.declaracionJurada
      : { suscrita: false, fecha: null, firmante: null, firmaDigital: false };

    const fecha = dj.fecha ? dj.fecha.split("-").reverse().join("/") : null;

    if (!dj.suscrita) {
      cont.innerHTML = `
        <div class="ley-cert-box" style="opacity:0.85;">
          <div class="ley-cert-badge-icon" style="color:var(--text-muted);">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div class="ley-cert-text">
            <strong>Declaracion Jurada de Continuidad: No suscrita</strong><br>
            El menor no tiene registrada la declaracion jurada de continuidad (Anexo N.° 02). Puede declararse
            durante la atencion en campo.
          </div>
        </div>`;
      return;
    }

    cont.innerHTML = `
      <div class="ley-cert-box">
        <div class="ley-cert-badge-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div class="ley-cert-text">
          <strong>Declaracion Jurada de Continuidad suscrita</strong><br>
          Suscrita el <strong>${fecha || "sin fecha registrada"}</strong> por <strong>${dj.firmante || b.apoderado || "el apoderado"}</strong>${dj.firmaDigital ? ", con firma digital validada" : ", mediante firma manuscrita"}. Declara que la informacion del menor inscrita es continua y vigente.
        </div>
      </div>`;
  },

  // Contraste de tres fuentes, porque responder "declarada, prevista y hecha" no
  // es lo mismo que responder una sola: la casilla del alta solo senaliza, el
  // sistema la estima por indicadores, y la derivacion efectiva vive en el caso
  // social. Asi una discrepancia se ve en lugar de quedar tapada por otra.
  _pintarDerivacionASP(b, caso) {
    const cont = document.getElementById("expDerivacionASPBox");
    if (!cont) return;

    const deducir = window.PDI?.deducirDerivacionASP || (() => false);
    const deducida = deducir(b);
    const da = (b && typeof b.derivacionASP === "object" && b.derivacionASP !== null)
      ? b.derivacionASP
      : { requiereDerivacion: false };
    // Un registro guardado con la forma vieja trae "registrada"; la migracion la
    // pasa a requiereDerivacion, pero un dato que llega por otra via no.
    const senalizada = typeof da.requiereDerivacion === "boolean" ? da.requiereDerivacion : da.registrada === true;
    const efectiva = !!caso;

    const fila = (etiqueta, valor, nota) => `
      <div style="display:flex; justify-content:space-between; gap:10px; padding:6px 0; border-bottom:1px dashed var(--border-subtle); font-size:12px;">
        <span style="color:var(--text-muted);">${etiqueta}</span>
        <span style="font-weight:700; text-align:right;">${valor}${nota ? `<br><span style="font-weight:400; font-size:11px; color:var(--text-muted);">${nota}</span>` : ""}</span>
      </div>`;

    const fechaCaso = caso && caso.fechaDerivacion
      ? String(caso.fechaDerivacion).split("-").reverse().join("/")
      : null;
    const quienCaso = caso && caso.quienDeriva ? caso.quienDeriva.nombre : null;

    // Avisos: lo que se pidio y no se hizo, y lo que se hizo sin haberlo pedido.
    const avisos = [];
    if (senalizada && !efectiva) {
      avisos.push("Se pidio derivacion en el alta pero el menor no tiene ficha de derivacion de caso social.");
    }
    if (!senalizada && efectiva) {
      avisos.push("El menor tiene caso social abierto sin haber marcado la derivacion en el alta.");
    }
    if (!senalizada && !efectiva && deducida) {
      avisos.push("Los indicadores del menor superan el umbral de derivacion y no hay caso social abierto.");
    }

    const bloqueAvisos = avisos.length ? `
      <div style="margin-top:8px; padding:8px 10px; border-radius:var(--radius-sm); font-size:11.5px; line-height:1.5;
        background:var(--surface-hover); border-left:3px solid var(--gt-yellow); color:var(--text-main);">
        <strong>Revisar.</strong> ${avisos.join(" ")}
      </div>` : "";

    cont.innerHTML = `
      <div style="background:var(--surface-hover); border:1px solid var(--border-subtle); padding:12px; border-radius:var(--radius-sm);">
        ${fila("Senalada en el alta", senalizada ? "Si" : "No", "Casilla DERIVACION ASP de la ficha A1")}
        ${fila("Prevista por el sistema", deducida ? "Si" : "No", "Vulnerabilidad, exoneracion o servicio pastoral")}
        ${fila("Derivacion efectiva", efectiva ? "Si" : "No", [fechaCaso, quienCaso].filter(Boolean).join(" - ") || null)}
        ${bloqueAvisos}
      </div>`;
  },

  _pintarSocial(b, caso) {
    this._set("expVulnerabilidad", `${b.vulnerabilidad || 60}/100`);
    const cont = document.getElementById("expCasoSocialDetail");
    if (!cont) return;

    if (!caso) {
      cont.innerHTML = `
        <div style="background:var(--surface-hover); padding:12px; border-radius:var(--radius-sm); font-size:12px; color:var(--text-muted);">
          El menor no registra derivaciones activas a DEMUNA ni alertas de vulnerabilidad extrema. Monitoreo regular activo.
        </div>`;
      return;
    }

    const quien = caso.quienDeriva
      ? `${caso.quienDeriva.nombre} (${caso.quienDeriva.cargo})`
      : "Personal Operativo";
    const telefono = caso.quienDeriva ? caso.quienDeriva.telefono : "-";
    const tipo = caso.tipoProblematica ? caso.tipoProblematica.toUpperCase() : "SOCIAL";
    const soporte = caso.sorteFamiliar
      ? (caso.soporteFamiliar.tiene ? "Si cuenta con soporte familiar" : "No cuenta con soporte: " + caso.soporteFamiliar.detalle)
      : "En evaluacion";

    cont.innerHTML = `
      <div style="background:var(--surface-hover); padding:14px; border-radius:var(--radius-sm); border-left:3px solid var(--gt-yellow);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <strong style="font-size:13px; color:var(--gt-yellow);">Derivacion Activa: Problemática ${tipo}</strong>
            <div style="font-size:11.5px; color:var(--text-dim);">Derivado por: ${quien} &bull; Tel: ${telefono}</div>
          </div>
          <span class="badge badge-${caso.urgencia === "Alta" ? "red" : "yellow"}">Urgencia: ${caso.urgencia}</span>
        </div>
        <div style="font-size:12.5px; color:var(--text-main); margin-bottom:6px;"><strong>Situacion Encontrada:</strong> ${caso.situacionEncontrada || caso.detalle}</div>
        <div style="font-size:12px; color:var(--text-dim); margin-bottom:4px;"><strong>Acciones Realizadas:</strong> ${caso.accionesPrevias || "Seguimiento domiciliario programado."}</div>
        <div style="font-size:12px; color:var(--text-dim);"><strong>Soporte Familiar:</strong> ${soporte}</div>
      </div>`;
  },

  /**
   * Croquis del domicilio y foto de fachada.
   *
   * El iframe de Google Maps es lo unico del expediente que sale a la red, asi
   * que va en loading="lazy": sin el, abrir un expediente pedia la peticion
   * aunque el usuario no bajara nunca a esa seccion.
   */
  _pintarCroquisYFachada(b) {
    const consulta = encodeURIComponent(`${b.direccion || ""}, ${b.distrito || "Comas"}, Lima, Peru`);
    const hayCoordenadas = b.coordenadas && b.coordenadas.lat && b.coordenadas.lng;

    const iframe = document.getElementById("expGoogleMapIframe");
    if (iframe) {
      iframe.loading = "lazy";
      iframe.src = hayCoordenadas
        ? `https://maps.google.com/maps?q=${b.coordenadas.lat},${b.coordenadas.lng}&t=&z=17&ie=UTF8&iwloc=&output=embed`
        : `https://maps.google.com/maps?q=${consulta}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    }

    const enlace = document.getElementById("expLinkGoogleMapsNav");
    if (enlace) {
      enlace.href = hayCoordenadas
        ? `https://www.google.com/maps/dir/?api=1&destination=${b.coordenadas.lat},${b.coordenadas.lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${consulta}`;
    }

    const vista = document.getElementById("expFachadaPreview");
    if (vista) {
      vista.innerHTML = b.fotoFachada
        ? `<img src="${b.fotoFachada}" alt="Fachada de vivienda de ${b.nombres}">`
        : `
          <div class="croquis-fachada-placeholder">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>Sin foto de fachada</span>
          </div>`;
    }

    const input = document.getElementById("expFotoFachadaInput");
    if (input) {
      input.onchange = (e) => {
        const archivo = e.target.files && e.target.files[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = (ev) => {
          b.fotoFachada = ev.target.result;
          if (vista) vista.innerHTML = `<img src="${b.fotoFachada}" alt="Fachada de vivienda de ${b.nombres}">`;
          BeneficiarioModel.update(b.id, b);
          ToastView.show("Fachada actualizada", `Se guardo la foto de la fachada de ${b.nombres} ${b.apellidos}.`, "success");
        };
        lector.readAsDataURL(archivo);
      };
    }
  },

  // --- programas inscritos y edicion ----------------------------------------

  renderProgramasInscritos(serviciosList, isEditing = false) {
    const cont = document.getElementById("expProgramasInscritosContainer");
    if (!cont) return;

    const servicios = Array.isArray(serviciosList) ? serviciosList : [];
    const incluye = (clave) => servicios.some(s => s && s.toLowerCase().includes(clave));

    const programas = [
      {
        nombre: "Servicio Alimentario Nutricional",
        desc: "Racion matutina balanceada, complemento alimentario y tamizaje antropometrico periodico",
        activo: incluye("aliment") || incluye("nutric") || incluye("desayuno") || incluye("lonchera"),
      },
      {
        nombre: "Servicio Acompanamiento Educativo",
        desc: "Acompanamiento psicopedagogico, tutoria, refuerzo escolar y entrega de kits de utiles",
        activo: incluye("educat") || incluye("acomp") || incluye("casita") || incluye("refuerzo"),
      },
      {
        nombre: "Area Social Pastoral",
        desc: "Acompanamiento espiritual-familiar, soporte socioemocional y visitas de riesgo",
        activo: incluye("pastoral") || incluye("social") || incluye("asp"),
      },
    ];

    cont.innerHTML = programas.map(p => `
      <div class="programa-item ${p.activo ? "active" : ""} ${isEditing ? "editable" : ""}"
           ${isEditing ? `title="Haga clic para ${p.activo ? "deseleccionar" : "seleccionar"} este servicio"`
                       : `title="${p.activo ? "Inscrito" : "No inscrito"}"`}
           ${isEditing ? `data-prog-btn="${p.nombre}"` : ""}>
        <div class="programa-check-box">
          ${p.activo ? `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>` : ""}
        </div>
        <div class="programa-details">
          <span class="programa-name">${p.nombre}</span>
          <span class="programa-desc">${p.desc}</span>
        </div>
      </div>
    `).join("");

    // El clic va delegado en el contenedor, no como onclick en cada fila. Las
    // filas se redibujan en cada cambio, y un onclick por fila habria que
    // volver a colar tras cada repintado.
    if (isEditing) {
      cont.onclick = (e) => {
        const fila = e.target.closest("[data-prog-btn]");
        if (fila) this.toggleEditServicio(fila.dataset.progBtn);
      };
    } else {
      cont.onclick = null;
    }
  },

  toggleEditServicio(nombrePrograma) {
    if (!this.isEditing) return;
    if (!Array.isArray(this._editServicios)) this._editServicios = [];

    // El padron guarda los servicios con nombres largos ("Servicio Acompanamiento
    // Educativo") y con nombres cortos ("Casita del Saber"). Se canoniza a una
    // sola forma para que la comparacion no falle por como se escribio.
    const canonico = {
      "Servicio Alimentario Nutricional": ["aliment", "nutric", "desayuno", "lonchera"],
      "Servicio Acompanamiento Educativo": ["educat", "casita", "acomp", "refuerzo"],
      "Area Social Pastoral": ["pastoral", "social", "asp"],
    };
    const bajo = (nombrePrograma || "").toLowerCase();
    const destino = Object.keys(canonico).find(k => canonico[k].some(c => bajo.includes(c)));
    if (!destino) return;

    const esElMismo = (s) => {
      const sb = (s || "").toLowerCase();
      return sb === destino.toLowerCase() || canonico[destino].some(c => sb.includes(c));
    };

    const indice = this._editServicios.findIndex(esElMismo);
    if (indice !== -1) this._editServicios.splice(indice, 1);
    else this._editServicios.push(destino);

    this.renderProgramasInscritos(this._editServicios, true);
  },

  toggleEdit() {
    if (!this._id) return;
    this.isEditing = !this.isEditing;

    const b = BeneficiarioModel.getById(this._id);
    this._editServicios = b && Array.isArray(b.servicios) ? [...b.servicios] : [];
    this.renderProgramasInscritos(this.isEditing ? this._editServicios : (b ? b.servicios : []), this.isEditing);

    CAMPOS_EDITABLES.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.readOnly = !this.isEditing;
      if (this.isEditing) {
        el.style.borderColor = "var(--gt-green)";
        el.style.background = "#ffffff";
        el.style.boxShadow = "0 0 0 3px rgba(0, 180, 148, 0.15)";
        el.style.cursor = "text";
      } else {
        el.style.borderColor = "var(--border-subtle)";
        el.style.background = "var(--surface-2)";
        el.style.boxShadow = "none";
        el.style.cursor = "default";
      }
    });

    const subidaFachada = document.getElementById("expFachadaUploadControls");
    if (subidaFachada) subidaFachada.style.display = this.isEditing ? "block" : "none";

    const editBtn = document.getElementById("btnToggleEditExp");
    const saveBtn = document.getElementById("btnSaveExpChanges");
    const badge = document.getElementById("expEditingBadge");

    if (this.isEditing) {
      if (editBtn) {
        editBtn.classList.add("danger");
        editBtn.innerHTML = `
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          <span>Cancelar Edicion</span>`;
      }
      if (saveBtn) saveBtn.style.display = "inline-flex";
      if (badge) badge.style.display = "inline-flex";
      ToastView.show("Modo Edicion Activado", "Los campos y los servicios son editables. Modifique los datos y presione Guardar Cambios.", "info");
    } else {
      if (editBtn) {
        editBtn.classList.remove("danger");
        editBtn.innerHTML = `
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
          <span>Editar Datos</span>`;
      }
      if (saveBtn) saveBtn.style.display = "none";
      if (badge) badge.style.display = "none";
    }
  },

  saveChanges() {
    if (!this._id) return;
    const b = BeneficiarioModel.getById(this._id);
    if (!b) return;

    const valor = (id) => {
      const el = document.getElementById(id);
      return el && el.value ? el.value.trim() : "";
    };

    // Cada campo cae al valor anterior si el usuario lo dejo vacio. Un
    // expediente es un documento oficial: vaciar un campo por descuido no debe
    // borrar un dato, la pulsacion se ignora y el valor anterior se conserva.
    b.nombres = valor("expNombres") || b.nombres;
    b.apellidos = valor("expApellidos") || b.apellidos;
    b.dni = valor("expDni") || b.dni;
    b.direccion = valor("expDireccion") || b.direccion;
    b.referencia = valor("expReferencia") || b.referencia;
    b.seguro = valor("expSeguro") || b.seguro;
    b.centroSalud = valor("expCentroSalud") || b.centroSalud;
    b.alergias = valor("expAlergias") || b.alergias;
    b.grado = valor("expGrado") || b.grado;
    b.colegio = valor("expColegio") || b.colegio;
    b.apoderado = valor("expApoderadoNombre") || b.apoderado;
    b.parentesco = valor("expApoderadoParentesco") || b.parentesco;
    b.apoderadoDni = valor("expApoderadoDni") || b.apoderadoDni;
    b.telefono = valor("expApoderadoTel") || b.telefono;
    b.telefonoAlt = valor("expTelefonoAlt") || b.telefonoAlt;

    if (Array.isArray(this._editServicios)) {
      b.servicios = Array.from(new Set(this._editServicios));
    }

    BeneficiarioModel.update(b.id, b);

    // Activar el Area Social Pastoral implica que el menor tiene caso social. Si
    // no lo tenia, se crea: de lo contrario el expediente prometeria un
    // acompanhamento que en el kanban no existe.
    if (b.servicios && b.servicios.some(s => s && /pastoral|social|asp/i.test(s))) {
      const casos = CasoSocialModel.getAll();
      const existe = casos.find(c => c.beneficiarioId === Number(b.id) || (c.codigo || "").toLowerCase() === (b.codigo || "").toLowerCase());
      if (!existe && CasoSocialModel.addCaso) {
        CasoSocialModel.addCaso({
          beneficiarioId: Number(b.id),
          codigo: b.codigo,
          menor: `${b.nombres} ${b.apellidos}`,
          sede: b.sede,
          distrito: b.distrito,
          estado: "Evaluacion",
          prioridad: "Alta",
          motivo: "Activacion de Area Social Pastoral desde Expediente",
          fecha: new Date().toISOString().split("T")[0],
          scoreVulnerabilidad: b.vulnerabilidad || 82,
          apoderado: b.apoderado,
          telefono: b.telefono,
        });
      }
    }

    const banner = document.getElementById("roleBannerTitle");
    if (AuditModel && AuditModel.addLog) {
      AuditModel.addLog({
        user: (banner && banner.textContent) || "Coordinador General",
        role: "Direccion",
        action: "Edicion de Expediente",
        entity: b.codigo,
        detail: `Actualizacion de datos y servicios del menor ${b.nombres} ${b.apellidos} en el padron`,
        status: "Auditado",
      });
    }

    this.isEditing = false;
    this.render();
    ToastView.show("Expediente Actualizado", `Los cambios en ${b.nombres} ${b.apellidos} se guardaron y auditaron correctamente.`, "success");
  },

  deleteBeneficiario() {
    if (!this._rolEsDirectivo()) {
      ToastView.show("Accion Restringida", "Unicamente el Coordinador General o el Administrador TI pueden dar de baja a un menor.", "danger");
      return;
    }
    if (!this._id) return;

    const b = BeneficiarioModel.getById(this._id);
    if (!b) return;

    if (!confirm(`¿Está seguro de eliminar definitivamente al menor ${b.nombres} ${b.apellidos} (${b.codigo})?\n\nEsta acción retirará al menor del Padrón Único y de todos los servicios. Se registrará en la auditoría del sistema.`)) {
      return;
    }

    BeneficiarioModel.delete(b.id);

    const banner = document.getElementById("roleBannerTitle");
    if (AuditModel && AuditModel.addLog) {
      AuditModel.addLog({
        user: (banner && banner.textContent) || "Coordinador General",
        role: "Direccion / Admin",
        action: "Baja de Beneficiario",
        entity: b.codigo,
        detail: `Baja definitiva del menor ${b.nombres} ${b.apellidos} autorizada por rol directivo`,
        status: "Ejecutado",
      });
    }

    // Tras la baja el expediente ya no existe, asi que no hay nada que volver a
    // pintar: se vuelve al padron, que es donde el usuario puede ver el efecto.
    const destino = window.PDI?.RouteMap?.urlDe?.("padron") || "./padron.html";
    window.location.href = destino;
  },
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ExpedienteView = ExpedienteView;
}
