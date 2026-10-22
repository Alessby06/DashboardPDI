// ===========================================================================
//  Ficha de Inscripcion 2026: panel plegable y estado del boton de guardar
// ===========================================================================
//  La ficha no marca los campos con asterisco: todos los que se ven se
//  llenan. Lo que dice si se puede guardar es el boton, y al lado el texto
//  con lo que falta. Asi el formulario no se llena de asteriscos y nadie
//  descubre al final, al pulsar guardar, que faltaba un dato.
//
//  Persona Autorizada 2 es opcional y ocupa el mismo espacio que la titular.
//  Por eso va plegada: se abre solo si se la va a usar.
// ===========================================================================
import { validarTipo, etiquetaTipo } from "./tiposCampo.js";

// Los datos que de verdad hacen falta para dar de alta a un usuario. Los que
// tienen un valor por defecto (sexo, sede, modalidad, exoneracion, seguro,
// nivel educativo, parentesco) siempre estan listos y no se listan aqui.
const OBLIGATORIOS = [
  { id: "regNombres", etiqueta: "Nombres", tipo: "nombre" },
  { id: "regApellidos", etiqueta: "Apellidos", tipo: "nombre" },
  { id: "regDni", etiqueta: "Documento del usuario" },
  { id: "regFechaNacimiento", etiqueta: "Fecha de nacimiento" },
  { id: "regDireccion", etiqueta: "Direccion" },
  { id: "regCentroSalud", etiqueta: "Centro de Salud de Referencia" },
  { id: "regAlergiaDescripcion", etiqueta: "Alergia" },
  { id: "regTipoAtencion", etiqueta: "Modalidad de atención (Casita)" },
  { id: "regGrado", etiqueta: "Grado Escolar" },
  { id: "regColegio", etiqueta: "I.E. de Origen" },
  { id: "regApoderado", etiqueta: "Apellidos y nombres del apoderado", tipo: "nombre" },
  { id: "regApoderadoDni", etiqueta: "DNI del apoderado", tipo: "dni" },
  { id: "regTelefono", etiqueta: "Telefono del apoderado", tipo: "telefono" },
  { id: "regRetiroNombre1", etiqueta: "Nombre de la Persona Autorizada 1", tipo: "nombre" },
  { id: "regRetiroDni1", etiqueta: "DNI de la Persona Autorizada 1", tipo: "dni" },
  { id: "regRetiroTel1", etiqueta: "Telefono de la Persona Autorizada 1", tipo: "telefono" },
];

// La Persona Autorizada 2 es opcional, pero si se empieza a llenar se
// completa entera: antes el sistema guardaba "Por validar" y "-" en los
// huecos, y eso terminaba en el padron de retiro.
const PERSONA_2 = [
  { id: "regRetiroNombre2", etiqueta: "Nombre de la Persona Autorizada 2", tipo: "nombre" },
  { id: "regRetiroDni2", etiqueta: "DNI de la Persona Autorizada 2", tipo: "dni" },
  { id: "regRetiroTel2", etiqueta: "Telefono de la Persona Autorizada 2", tipo: "telefono" },
  { id: "regRetiroParentesco2", etiqueta: "Parentesco de la Persona Autorizada 2" },
];

function valorDe(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

function tipoDocumentoActual() {
  return valorDe("regTipoDocumento") || "DNI";
}

// La alergia se registra como ficha completa (descripcion, tipo y gravedad)
// solo cuando la persona tiene alguna. "Ninguna" o vacio significa que no
// tiene: en ese caso la gravedad no se pregunta y no se guarda nada.
function tieneAlergia() {
  const descripcion = valorDe("regAlergiaDescripcion");
  if (!descripcion) return false;
  return descripcion.toLowerCase() !== "ninguna";
}

/** Lo que falta de la alergia, o '' si esta completa. */
function avisoAlergia() {
  if (!tieneAlergia()) return "";
  if (valorDe("regAlergiaTipo") === "Ninguna") return "Falta el tipo de alergia";
  if (!valorDe("regAlergiaSeveridad")) return "Falta la gravedad de la alergia";
  return "";
}

/** La gravedad solo se pide cuando hay algo que gravedar. */
function refrescarGravedadAlergia() {
  const select = document.getElementById("regAlergiaSeveridad");
  if (!select) return;
  select.disabled = !tieneAlergia();
}

// La modalidad de atencion (fija o itinerante) solo existe en el servicio
// educativo: la pide la ficha de Casita del Saber y no la de Desayuno ni la
// de Lonchera. Si no hay Casita marcada, el control se cierra.
function estrategiasMarcadas() {
  const control = window.PDI?.EstrategiaMultiSelect;
  if (!control?.getValues) return [];
  const valores = control.getValues("regEstrategia");
  return Array.isArray(valores) ? valores : [];
}

function esCasita() {
  return estrategiasMarcadas().some((e) => String(e).includes("Casita del Saber"));
}

function avisoAtencion() {
  if (!esCasita()) return "";
  if (!valorDe("regTipoAtencion")) return "Falta la modalidad de atención de Casita";
  return "";
}

function refrescarAtencion() {
  const select = document.getElementById("regTipoAtencion");
  if (!select) return;
  select.disabled = !esCasita();
}

/** Sin Documento no exige número; DNI exige ocho dígitos; el resto, que haya número. */
function documentoInvalido() {
  const tipo = tipoDocumentoActual();
  if (tipo === "Sin Documento") return false;
  const valor = valorDe("regDni");
  if (!valor) return true;
  if (tipo === "DNI") return !validarTipo("dni", valor);
  return false;
}

function avisoDocumento() {
  if (tipoDocumentoActual() === "Sin Documento") return "";
  if (!valorDe("regDni")) return "Falta Documento del usuario";
  if (tipoDocumentoActual() === "DNI") {
    return "Documento del usuario (DNI de 8 dígitos)";
  }
  return "";
}

/** La firma puede ser dibujada o subida como imagen: en los dos casos queda pintada en el canvas. */
function hayFirma() {
  // El helper sabe si se dibujo sin leer un solo pixel: recorrer el canvas
  // entero en cada tecla costaba milisegundos y no cambiaba el resultado.
  const helper = window.PDI?.BeneficiarioController?.signatureCanvasHelper;
  if (helper && typeof helper.hasSignature === "function") {
    return helper.hasSignature();
  }

  // Sin helper (antes de abrir la ficha) se mira el canvas una vez.
  const canvas = document.getElementById("canvasSignature");
  if (!canvas || !canvas.width || !canvas.height) return false;
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const pixeles = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // Se mira un punto de cada 16: alcanza para saber si hay tinta y no
    // cuesta leer el canvas entero en cada tecla.
    for (let i = 3; i < pixeles.length; i += 64) {
      if (pixeles[i] !== 0) return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

/** Devuelve que falta para poder guardar la ficha. */
export function evaluarFicha() {
  const faltantes = [];

  // Un campo puede estar vacio (falta) o lleno pero con el tipo equivocado
  // (por ejemplo un DNI de siete digitos): las dos cosas impiden guardar.
  const comprobar = (campo) => {
    if (campo.id === "regDni") {
      if (documentoInvalido()) faltantes.push(avisoDocumento());
      return;
    }
    if (campo.id === "regAlergiaDescripcion") {
      const falta = avisoAlergia();
      if (falta) faltantes.push(falta);
      return;
    }
    if (campo.id === "regTipoAtencion") {
      const falta = avisoAtencion();
      if (falta) faltantes.push(falta);
      return;
    }
    const valor = valorDe(campo.id);
    if (!valor) {
      faltantes.push(campo.etiqueta);
      return;
    }
    if (campo.tipo && !validarTipo(campo.tipo, valor)) {
      faltantes.push(`${campo.etiqueta} (${etiquetaTipo(campo.tipo)})`);
    }
  };

  OBLIGATORIOS.forEach(comprobar);

  // Una fecha futura dejaba la edad vacia y, sin este control, la ficha se
  // daba por completa igual.
  const fechaNacimiento = valorDe("regFechaNacimiento");
  if (fechaNacimiento) {
    const fecha = new Date(`${fechaNacimiento}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    if (Number.isNaN(fecha.getTime())) {
      faltantes.push("Fecha de nacimiento (fecha invalida)");
    } else if (fecha > hoy) {
      faltantes.push("Fecha de nacimiento (no puede ser futura)");
    } else if (fecha.getFullYear() < 1900) {
      faltantes.push("Fecha de nacimiento (revisa el año)");
    }
  }

  // Persona Autorizada 2: si se usa, se completa entera.
  if (PERSONA_2.some((campo) => valorDe(campo.id))) {
    PERSONA_2.forEach(comprobar);
  }

  if (!window.PDI?.EstrategiaMultiSelect?.getValues("regEstrategia")?.length) {
    faltantes.push("Estrategia asignada");
  }

  if (!hayFirma()) {
    faltantes.push("Firma del apoderado");
  }

  return { listo: faltantes.length === 0, faltantes };
}

/**
 * Lo que se anuncia no es lo que se ve: el texto visible cambia con cada
 * tecla y un lector de pantalla no puede leer esa rafaga. La region viva
 * recibe solo avisos concretos (campo que quedo mal, ficha que ya se puede
 * guardar).
 */
function anunciar(texto) {
  const region = document.getElementById("fichaEstadoAnuncio");
  if (!region || !texto) return;
  // Se vacia antes para que el lector repita el aviso aunque sea el mismo.
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = texto;
  }, 20);
}

// Sirve para avisar una sola vez cuando la ficha pasa a estar completa.
let estabaListo = null;

/** Pinta el estado: el boton se habilita solo cuando no falta nada. */
export function refrescarEstadoFicha(pedidoDeAnuncio = false) {
  const boton = document.getElementById("btnGuardarFicha");
  const estado = document.getElementById("fichaEstadoDatos");
  if (!boton) return;

  const { listo, faltantes } = evaluarFicha();
  boton.disabled = !listo;
  // La gravedad de la alergia se abre y se cierra con la descripcion.
  refrescarGravedadAlergia();
  // La modalidad de atencion solo se abre cuando la inscripcion es de Casita.
  refrescarAtencion();

  let resumen = "";
  if (estado) {
    if (listo) {
      estado.textContent = "Todo listo. Ya se puede guardar.";
      estado.classList.remove("ficha-estado--faltan");
      estado.classList.add("ficha-estado--listo");
    } else {
      const muestra = faltantes.slice(0, 3).join(", ");
      const resto = faltantes.length > 3 ? ` y ${faltantes.length - 3} más` : "";
      const encabezado = faltantes.length === 1 ? "Falta 1 dato" : `Faltan ${faltantes.length} datos`;
      estado.textContent = `${encabezado}: ${muestra}${resto}.`;
      estado.classList.add("ficha-estado--faltan");
      estado.classList.remove("ficha-estado--listo");
    }
    resumen = estado.textContent;
  }

  const cambio = estabaListo !== null && estabaListo !== listo;
  estabaListo = listo;

  if (!pedidoDeAnuncio && !cambio) return;
  if (listo) {
    anunciar("Todo listo. Ya se puede guardar la ficha.");
  } else {
    anunciar(`Todavía no se puede guardar. ${resumen}`);
  }
}

/** Abre o cierra el panel de la Persona Autorizada 2. */
export function alternarPersona2(forzar) {
  const cuerpo = document.getElementById("cuerpoRetiro2");
  const boton = document.getElementById("btnToggleRetiro2");
  if (!cuerpo || !boton) return;
  const abierto = forzar === undefined ? cuerpo.hidden : !!forzar;
  cuerpo.hidden = !abierto;
  boton.setAttribute("aria-expanded", abierto ? "true" : "false");
}

/** Marca o desmarca un campo como invalido para lectores y para el borde rojo. */
function marcarCampo(el, invalido) {
  if (!el || el.nodeType !== 1 || !el.id) return;
  if (invalido) el.setAttribute("aria-invalid", "true");
  else el.removeAttribute("aria-invalid");
}

/** Al escribir, la marca roja desaparece en cuanto el dato queda bien. */
function limpiarMarcaDeCampo(el) {
  if (!el || !el.id || el.getAttribute("aria-invalid") !== "true") return;
  const campo = [...OBLIGATORIOS, ...PERSONA_2].find((item) => item.id === el.id);
  if (!campo) return;
  const valor = valorDe(campo.id);
  const sigueMal = campo.id === "regDni"
    ? documentoInvalido()
    : (!valor || (campo.tipo && !validarTipo(campo.tipo, valor)));
  if (!sigueMal) marcarCampo(el, false);
}

function prefiereMenosMovimiento() {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * El croquis se carga solo cuando alguien lo pide. Al abrir la ficha el
 * iframe de Google no recibe el domicilio del usuario: ese dato es suyo y
 * no tiene por que salir a un tercero sin una decision explicita.
 */
export function iniciarCroquis() {
  const boton = document.getElementById("btnCargarCroquis");
  const iframe = document.getElementById("regGoogleMapIframe");
  const capa = document.getElementById("regMapaActivar");
  if (!boton || !iframe) return;
  if (boton.dataset.croquisListo === "1") return;
  boton.dataset.croquisListo = "1";

  boton.addEventListener("click", () => {
    const url = iframe.dataset.src;
    if (!url) return;
    iframe.dataset.mapaAutorizado = "1";
    iframe.src = url;
    if (capa) capa.hidden = true;
  });
}

/** Conecta los eventos que cambian el estado de la ficha. */
export function iniciarFicha() {
  const form = document.getElementById("formNuevoMenor");
  if (!form) return;
  // Idempotente: con las transiciones de Astro el script puede pedir la
  // conexion dos veces sobre el mismo formulario.
  if (form.dataset.fichaIniciada === "1") return;
  form.dataset.fichaIniciada = "1";

  // Las funciones reciben el evento como argumento: si se pasan tal cual,
  // el evento cuenta como "pedido de anuncio" y se anunciaria en cada tecla.
  form.addEventListener("input", () => {
    refrescarEstadoFicha();
    limpiarMarcaDeCampo(document.activeElement);
  });
  form.addEventListener("change", () => refrescarEstadoFicha());

  // El selector de estrategias avisa con un evento propio (no es un input):
  // cuando se marca Casita del Saber, la modalidad de atencion se abre; cuando
  // se quita, se cierra y el dato deja de contar.
  form.addEventListener("pdi:estrategia-change", () => refrescarEstadoFicha());

  // El desplegable nativo abre hacia arriba cuando el campo queda al final
  // de la ventana: la lista tapaba el formulario y habia que cerrarla a
  // ciegas. Centrando el campo al recibir el foco hay sitio debajo y la
  // lista baja, que es lo que se espera de un menu.
  form.addEventListener("focusin", (evento) => {
    const el = evento.target;
    if (el && el.tagName === "SELECT") {
      el.scrollIntoView({
        block: "center",
        behavior: prefiereMenosMovimiento() ? "auto" : "smooth",
      });
    }
  });

  // Al salir de un campo se dice que quedo mal, una sola vez. Mientras se
  // escribe no se interrumpe: el aviso espera a que la persona termine.
  form.addEventListener("focusout", (evento) => {
    const el = evento.target;
    if (!el || !el.id) return;
    const campo = [...OBLIGATORIOS, ...PERSONA_2].find((item) => item.id === el.id);
    if (!campo) return;

    if (campo.id === "regDni") {
      if (documentoInvalido()) {
        marcarCampo(el, true);
        anunciar(avisoDocumento());
      } else {
        marcarCampo(el, false);
      }
      return;
    }
    const valor = valorDe(campo.id);
    if (!valor) {
      marcarCampo(el, false);
      return;
    }
    if (campo.tipo && !validarTipo(campo.tipo, valor)) {
      marcarCampo(el, true);
      anunciar(`${campo.etiqueta}: ${etiquetaTipo(campo.tipo)}`);
      return;
    }
    marcarCampo(el, false);
  });

  // La estrategia se marca con casillas: no dispara input del formulario.
  form.addEventListener("pdi:estrategia-change", () => refrescarEstadoFicha());

  // La firma se dibuja en un canvas: tampoco dispara input.
  const canvas = document.getElementById("canvasSignature");
  ["pointerup", "mouseup", "touchend"].forEach((evento) => {
    canvas?.addEventListener(evento, () => refrescarEstadoFicha());
  });
  document.getElementById("inputUploadFirma")?.addEventListener("change", () => refrescarEstadoFicha());

  // Limpiar la firma la quita: el estado tiene que volver a decir que falta.
  document.getElementById("btnLimpiarFirma")?.addEventListener("click", () => refrescarEstadoFicha());

  const botonRetiro2 = document.getElementById("btnToggleRetiro2");
  botonRetiro2?.addEventListener("click", () => alternarPersona2());

  refrescarEstadoFicha();
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.Ficha = { evaluarFicha, refrescarEstadoFicha, alternarPersona2, iniciarFicha, iniciarCroquis };
}
