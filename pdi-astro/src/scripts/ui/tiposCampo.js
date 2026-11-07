// ===========================================================================
//  Tipo de dato en los campos de texto
// ===========================================================================
//  La ficha y el expediente escriben el mismo tipo de dato en el mismo sitio:
//  un DNI son ocho digitos, un telefono son nueve, y un nombre no lleva
//  numeros. El atributo `pattern` del HTML solo valida cuando se envia el
//  formulario, y como el boton de guardar esta deshabilitado hasta que todo
//  este bien, esa validacion no se ejecutaba nunca. Por eso el filtro va
//  aqui: mientras se escribe, lo que no es del tipo no entra.
//
//  El tipo se marca en el propio campo con `data-tipo`:
//
//    data-tipo="dni"        ocho digitos
//    data-tipo="telefono"   nueve digitos, con guiones
//    data-tipo="nombre"     letras, espacios, apostrofos, guiones y puntos
// ===========================================================================

const REGLAS = {
  dni: {
    inputmode: "numeric",
    max: 8,
    permite: /^[0-9]$/,
    valido: (valor) => /^\d{8}$/.test(valor),
  },
  celular: {
    inputmode: "numeric",
    max: 9,
    permite: /^[0-9]$/,
    valido: (valor) => /^9\d{8}$/.test(String(valor || "").replace(/\D/g, "")),
  },
  telefono: {
    inputmode: "numeric",
    max: 9,
    permite: /^[0-9]$/,
    valido: (valor) => /^9\d{8}$/.test(String(valor || "").replace(/\D/g, "")),
  },
  nombre: {
    inputmode: "text",
    max: 80,
    // Con tilde y enye: los nombres peruanos las tienen. El punto y el
    // apostrofo dejan pasar abreviaturas como "Vda. de Silva" u "O'Brien".
    permite: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’.\-\s]$/,
    valido: (valor) => valor.trim().length > 0,
  },
};

/** Dice si un valor cumple el tipo. */
export function validarTipo(tipo, valor) {
  const regla = REGLAS[tipo];
  if (!regla) return true;
  const texto = String(valor ?? "").trim();
  if (!texto) return false;
  return regla.valido(texto);
}

/** Nombre legible del tipo, para los mensajes de la ficha. */
export function etiquetaTipo(tipo) {
  if (tipo === "dni") return "DNI de 8 dígitos";
  if (tipo === "celular" || tipo === "telefono") return "Celular de 9 dígitos (inicia con 9)";
  if (tipo === "nombre") return "Nombre";
  return "";
}

function limpiar(valor, regla) {
  return Array.from(valor).filter((caracter) => regla.permite.test(caracter)).join("");
}

/** Aplica inputmode y maxlength a un campo, aunque se haya dibujado después. */
function aplicarAtributos(campo) {
  const regla = REGLAS[campo.dataset.tipo];
  if (!regla) return null;
  if (!campo.getAttribute("inputmode")) campo.setAttribute("inputmode", regla.inputmode);
  if (!campo.getAttribute("maxlength") && regla.max) {
    campo.setAttribute("maxlength", String(regla.max));
  }
  return regla;
}

function limpiarCampo(campo, regla) {
  const valor = campo.value;
  const limpio = limpiar(valor, regla);
  if (limpio === valor) return;

  // El cursor se queda donde estaba, contando solo los caracteres validos.
  const cursor = campo.selectionStart ?? valor.length;
  const validosAntes = Array.from(valor.slice(0, cursor)).filter((c) => regla.permite.test(c)).length;
  campo.value = limpio;
  const nuevaPos = Math.min(validosAntes, limpio.length);
  try {
    campo.setSelectionRange(nuevaPos, nuevaPos);
  } catch (e) {
    // Algunos tipos de campo no admiten selección: no es grave.
  }
}

let conectado = false;

function conectar() {
  if (conectado || typeof document === "undefined") return;
  conectado = true;

  // Delegación: cubre también los campos que se dibujan después (retiro del
  // expediente, evaluación). El foco fija maxlength antes de la primera tecla.
  document.addEventListener("input", (evento) => {
    const campo = evento.target?.closest?.("[data-tipo]");
    if (!campo) return;
    const regla = aplicarAtributos(campo);
    if (regla) limpiarCampo(campo, regla);
  });

  document.addEventListener("focusin", (evento) => {
    const campo = evento.target?.closest?.("[data-tipo]");
    if (campo) aplicarAtributos(campo);
  });
}

/**
 * Conecta los campos con tipo. Se puede llamar mas de una vez: la escucha es
 * única y los atributos se reaplican a los campos presentes.
 */
export function iniciarTiposCampo() {
  conectar();
  if (typeof document === "undefined") return;
  document.querySelectorAll("input[data-tipo], textarea[data-tipo]").forEach(aplicarAtributos);
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.TiposCampo = { iniciarTiposCampo, validarTipo, etiquetaTipo };
}
