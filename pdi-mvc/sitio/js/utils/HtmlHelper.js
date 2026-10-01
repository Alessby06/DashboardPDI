// Utilidad: Escapado de texto para insertarlo en el DOM.
//
// POR QUE EXISTE ESTE FICHERO
// ---------------------------
// El proyecto monta el HTML con plantillas de texto y lo mete con innerHTML.
// En las 96 asignaciones a innerHTML no habia ni una sola funcion de escapado,
// asi que cualquier dato de un registro (un nombre, un teléfono, una
// dirección) se interpretaba como marcado. Se comprobo con un beneficiario de
// prueba cuyo nombre llevaba <img src=x onerror="...">: en padron.html el
// manejador llego a ejecutarse. Es decir, era posible inyectar codigo.
//
// QUE HACE ESCAPAR
// ----------------
// Convierte los cinco caracteres con significado en HTML en su entidad:
//   &  ->  &amp;     empieza una entidad, "AT&T" se rompia
//   <  ->  &lt;      empieza una etiqueta
//   >  ->  &gt;      termina una etiqueta
//   "  ->  &quot;    abre y cierra un atributo
//   '  ->  &#39;     abre y cierra un atributo
//
// El ampersand va primero a proposito: si se sustituyeran los demas primero, un
// texto que ya trajera "&lt;" pasaria a "&amp;lt;" y se veria en pantalla
// como "<" en vez de "<". Ese error se llama doble escapado y es facil de
// cometer, asi que el orden importa.
//
// QUE NO HACE
// -----------
// No escapa las etiquetas. Si en una plantilla escribes <div>, sigue yendo
// <div>. Solo se escapa lo que viene de los datos.

// Mapa de sustitucion. El orden del objeto no importa porque cada
// sustitucion se busca con split/join sobre el ampersand primero.
const SUSTITUCIONES = [
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
];

/**
 * Escapa un valor para meterlo en el HTML como texto.
 * Lo que no sea texto (numero, null, indefinido) se convierte antes, para que
 * nunca aparezca "null" ni "undefined" pintado en la pantalla.
 * @param {*} valor
 * @returns {string}
 */
export function escapar(valor) {
  if (valor === null || valor === undefined) return "";
  let texto = typeof valor === "string" ? valor : String(valor);
  for (const [buscar, cambio] of SUSTITUCIONES) {
    texto = texto.split(buscar).join(cambio);
  }
  return texto;
}

/**
 * Escapa un valor para meterlo dentro de un manejador en linea, que es un caso
 * aparte y en el que escapar() NO BASTA.
 *
 * Que pasa: onclick="abrir('${valor}')". Si el valor trae una comilla simple,
 * escapar() la convierte en &#39;, pero el navegador convierte de nuevo
 * &#39; en ' antes de ejecutar el JavaScript. El escapado protege el HTML y
 * deja el JavaScript igual de abierto: la comilla vuelve a cerrar la cadena.
 *
 * Que se hace: primero se protege el JavaScript (la comilla se convierte en
 * barra-comilla, que si sobrevive a la conversion del navegador) y despues se
 * protege el HTML con escapar(). Ese es el orden: si se hiciera al reves,
 * escapar() volveria a tocar las comillas que escaparJs acaba de dejar sanas.
 *
 * Solo protege la cadena de JavaScript de un solo nivel. No sustituye a poner
 * el manejador con addEventListener, que es la solucion de verdad, pero deja
 * el patron que ya hay en el proyecto cerrado.
 *
 * @param {*} valor
 * @returns {string}
 */
export function escaparEnManejador(valor) {
  return escapar(escaparJs(valor));
}

/**
 * Escapa un valor para que no rompa una cadena de JavaScript de comillas
 * simples. Convierte lo que el navegador no deshace por su cuenta.
 * @param {*} valor
 * @returns {string}
 */
export function escaparJs(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .split("\\").join("\\\\")   // una barra suelta se comeria la que va despues
    .split("'").join("\\'")     // cierra la cadena
    .split("\n").join("\\n")    // salto de linea: rompe la sentencia
    .split("\r").join("\\r")
    .split("<").join("\\u003C");// por si el valor acaba dentro de un <script>
}

/**
 * Igual que escapar(), y de hecho hace lo mismo, pero con el nombre puesto
 * para cuando lo que se escapa va dentro de las comillas de un atributo.
 * @param {*} valor
 * @returns {string}
 */
export function escaparAtributo(valor) {
  return escapar(valor);
}

/**
 * Marca una plantilla de texto como HTML. Todo lo que se meta con ${...}
 * pasa por escapar() y sale como texto; las etiquetas escritas en la
 * plantilla se quedan como estan.
 *
 *   html`<p>${beneficiario.nombres}</p>`   // el nombre va escapado
 *   html`<p>Hola</p>`                     // la etiqueta va tal cual
 *
 * @param {TemplateStringsArray} literales
 * @param {...*} valores
 * @returns {string}
 */
export function html(literales, ...valores) {
  let salida = literales[0];
  for (let i = 0; i < valores.length; i++) {
    salida += escapar(valores[i]) + literales[i + 1];
  }
  return salida;
}

// Se dejan a mano por si algun sitio necesita la version con la primera y la
// ultima parte sin escapar, que es el patron habitual para sacar un solo dato
// de un fragmento.
export const HtmlHelper = { escapar, escaparAtributo, escaparEnManejador, escaparJs, html };

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.HtmlHelper = HtmlHelper;
}
