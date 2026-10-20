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
  { id: "regDni", etiqueta: "DNI del usuario", tipo: "dni" },
  { id: "regFechaNacimiento", etiqueta: "Fecha de nacimiento" },
  { id: "regDireccion", etiqueta: "Direccion" },
  { id: "regCentroSalud", etiqueta: "Centro de Salud de Referencia" },
  { id: "regAlergias", etiqueta: "Alergia a medicamentos" },
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

/** La firma puede ser dibujada o subida como imagen: en los dos casos queda pintada en el canvas. */
function hayFirma() {
  const canvas = document.getElementById("canvasSignature");
  if (!canvas || !canvas.width || !canvas.height) return false;
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const pixeles = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // Se mira un punto de cada 16: alcanza para saber si hay tinta y no
    // custa leer el canvas entero en cada tecla.
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

/** Pinta el estado: el boton se habilita solo cuando no falta nada. */
export function refrescarEstadoFicha() {
  const boton = document.getElementById("btnGuardarFicha");
  const estado = document.getElementById("fichaEstadoDatos");
  if (!boton) return;

  const { listo, faltantes } = evaluarFicha();
  boton.disabled = !listo;

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

/** Conecta los eventos que cambian el estado de la ficha. */
export function iniciarFicha() {
  const form = document.getElementById("formNuevoMenor");
  if (!form) return;
  // Idempotente: con las transiciones de Astro el script puede pedir la
  // conexion dos veces sobre el mismo formulario.
  if (form.dataset.fichaIniciada === "1") return;
  form.dataset.fichaIniciada = "1";

  form.addEventListener("input", refrescarEstadoFicha);
  form.addEventListener("change", refrescarEstadoFicha);

  // El desplegable nativo abre hacia arriba cuando el campo queda al final
  // de la ventana: la lista tapaba el formulario y habia que cerrarla a
  // ciegas. Centrando el campo al recibir el foco hay sitio debajo y la
  // lista baja, que es lo que se espera de un menu.
  form.addEventListener("focusin", (evento) => {
    const el = evento.target;
    if (el && el.tagName === "SELECT") {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });

  // La estrategia se marca con casillas: no dispara input del formulario.
  form.addEventListener("pdi:estrategia-change", refrescarEstadoFicha);

  // La firma se dibuja en un canvas: tampoco dispara input.
  const canvas = document.getElementById("canvasSignature");
  ["pointerup", "mouseup", "touchend"].forEach((evento) => {
    canvas?.addEventListener(evento, () => refrescarEstadoFicha());
  });
  document.getElementById("inputUploadFirma")?.addEventListener("change", () => refrescarEstadoFicha());

  const botonRetiro2 = document.getElementById("btnToggleRetiro2");
  botonRetiro2?.addEventListener("click", () => alternarPersona2());

  refrescarEstadoFicha();
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.Ficha = { evaluarFicha, refrescarEstadoFicha, alternarPersona2, iniciarFicha };
}
