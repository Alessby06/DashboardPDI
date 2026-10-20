// ===========================================================================
//  Grado escolar: depende del nivel educativo
// ===========================================================================
//  El grado era un campo de texto libre. Eso permitia el mismo dato escrito de
//  tres maneras ("Inicial", "Inicial 3 años", "3 años"), que despues no se
//  pueden contar, filtrar ni comparar. Ahora es un desplegable: la lista de
//  grados se arma con el nivel educativo elegido.
//
//  En el desplegable se lee el grado corto ("4 años", "1er Grado"): el nivel
//  ya esta en el campo anterior. Lo que se guarda conserva el nivel
//  ("Inicial 4 años") porque el grado tambien sale en el padron y en el CSV,
//  donde no hay una columna de nivel al lado.
//
//  Un valor que no este en el catalogo (datos guardados antes de esta regla)
//  no se borra: se muestra marcado "por corregir" para que se vea en el
//  expediente y se pueda arreglar al editarlo.
// ===========================================================================
import { gradosDeNivel, valoresDeGrado } from "../../data/opcionesBeneficiario.js";

const SIN_GRADO = "Seleccione…";

/**
 * Rehace la lista de grados del nivel y deja seleccionado el valor que se pida
 * (si existe en la lista).
 * @returns {string} el valor que quedo seleccionado.
 */
export function pintarGrados(selectGrado, nivel, valor = "") {
  if (!selectGrado) return "";

  const grados = gradosDeNivel(nivel);
  const valores = valoresDeGrado(nivel);
  const previo = String(valor || "").trim();
  const fueraDelCatalogo = previo && !valores.includes(previo) ? previo : "";

  selectGrado.replaceChildren(new Option(SIN_GRADO, ""));
  grados.forEach((grado) => selectGrado.add(new Option(grado.etiqueta, grado.valor)));
  if (fueraDelCatalogo) {
    // No se oculta: si se ocultara, el expediente mostraria un grado vacio.
    selectGrado.add(new Option(`${fueraDelCatalogo} (por corregir)`, fueraDelCatalogo));
  }

  selectGrado.value = valores.includes(previo) || fueraDelCatalogo ? previo : "";
  return selectGrado.value;
}

/**
 * Conecta el nivel con su grado. Es idempotente: llamarlo dos veces no
 * duplica los escuchas.
 */
export function conectarGrado(selectNivel, selectGrado) {
  if (!selectNivel || !selectGrado || selectGrado.dataset.gradoConectado === "1") return;
  selectGrado.dataset.gradoConectado = "1";

  // Al cambiar el nivel se rehace la lista. Si el grado elegido sigue
  // existiendo en el nuevo nivel se conserva; si no, se pide de nuevo.
  selectNivel.addEventListener("change", () => {
    const actual = selectGrado.value;
    const conservar = valoresDeGrado(selectNivel.value).includes(actual) ? actual : "";
    pintarGrados(selectGrado, selectNivel.value, conservar);
    // La ficha decide con estos eventos si ya se puede guardar.
    selectGrado.dispatchEvent(new Event("input", { bubbles: true }));
    selectGrado.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Al vaciar el formulario, el nivel vuelve a su valor inicial: la lista
  // tiene que volver con el, o quedarian los grados del nivel anterior.
  const formulario = selectGrado.closest("form");
  if (formulario) {
    formulario.addEventListener("reset", () => {
      setTimeout(() => pintarGrados(selectGrado, selectNivel.value, ""), 0);
    });
  }
}
