// ===========================================================================
//  VALIDACION INLINE DE CAMPOS
// ===========================================================================
//  Los formularios largos (ficha de inscripcion, expediente, dosaje,
//  voluntariados) avisaban de un campo invalido con un toast flotante. El
//  mensaje desaparecia a los pocos segundos y no decia donde corregir.
//
//  Aqui el aviso vive pegado al campo: se marca el control, se inserta el
//  texto debajo y se lleva el foco. Al escribir o cambiar el valor, el aviso
//  se retira solo.
//
//  No conoce ningun formulario concreto: recibe el campo (o su id) y, si el
//  control es compuesto (firma, estrategias), el contenedor y el elemento que
//  debe recibir el foco.
const CONTENEDORES = ".form-group, .form-field, .ficha-form-group";

function resolver(campo) {
  return typeof campo === "string" ? document.getElementById(campo) : campo;
}

function contenedorDe(el, opciones) {
  return opciones.contenedor || el.closest(CONTENEDORES) || el.parentElement;
}

/**
 * Marca un campo como invalido y muestra el motivo debajo.
 *
 * @param {string|HTMLElement} campo   id o elemento del control
 * @param {string} mensaje             texto para el usuario
 * @param {object} [opciones]
 * @param {HTMLElement} [opciones.contenedor] donde se inserta el aviso
 * @param {HTMLElement} [opciones.marca]      elemento que recibe la clase
 * @param {HTMLElement} [opciones.foco]       elemento que recibe el foco
 * @param {boolean} [opciones.focus=true]     llevar el foco al campo
 */
export function marcarError(campo, mensaje, opciones = {}) {
  const el = resolver(campo);
  if (!el || !mensaje) return false;

  const marca = opciones.marca || el;
  const cont = contenedorDe(el, opciones);

  marca.classList.add("campo-invalido");
  if (typeof el.setAttribute === "function") el.setAttribute("aria-invalid", "true");

  let err = marca.__pdiError;
  if (!err || !err.isConnected) {
    err = document.createElement("small");
    err.className = "campo-error";
    err.setAttribute("role", "alert");
    cont.appendChild(err);
    marca.__pdiError = err;
  }
  err.textContent = mensaje;

  if (opciones.focus !== false) {
    const foco = opciones.foco || el;
    if (foco && typeof foco.focus === "function") {
      try { foco.focus({ preventScroll: true }); } catch { foco.focus(); }
      foco.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    }
  }
  return true;
}

/** Retira el aviso y la marca de un campo (o de un contenedor compuesto). */
export function limpiarError(campo) {
  const el = resolver(campo);
  if (!el) return;
  const err = el.__pdiError;
  if (err) {
    err.remove();
    delete el.__pdiError;
  }
  el.classList.remove("campo-invalido");
  if (typeof el.removeAttribute === "function") el.removeAttribute("aria-invalid");
}

if (typeof document !== "undefined") {
  // Al corregir el valor, el aviso desaparece sin esperar a otro submit.
  document.addEventListener("input", (e) => limpiarError(e.target), true);
  document.addEventListener("change", (e) => limpiarError(e.target), true);
  document.addEventListener("click", (e) => {
    // Controles compuestos: elegir una estrategia o tocar la firma ya cuenta
    // como correccion, aunque no emitan input/change.
    const compuesto = e.target.closest?.(".estr-chips, .ficha-signature-block");
    if (compuesto) limpiarError(compuesto);
  }, true);
}
