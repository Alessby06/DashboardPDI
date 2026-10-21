// Catalogos compartidos por la ficha de inscripcion y el expediente.
//
// El alta y la edicion mostraban los mismos datos con controles distintos:
// el seguro era un desplegable en la ficha y un campo de texto libre en el
// expediente, y el nivel educativo ni siquiera llegaba a la edicion. Tener las
// opciones en un solo sitio evita que las dos pantallas vuelvan a separarse:
// si aqui se agrega una sede o un parentesco, aparece en las dos.
//
// `valor` es lo que se guarda en el modelo; `etiqueta` es lo que se lee.

export const SEDES = [
  { valor: "Comas - Año Nuevo", etiqueta: "Comas: Año Nuevo" },
  { valor: "Comas - La Libertad", etiqueta: "Comas: La Libertad" },
  { valor: "Comas - Carmen Alto", etiqueta: "Comas: Carmen Alto" },
  { valor: "Carabayllo - El Progreso", etiqueta: "Carabayllo: El Progreso" },
  { valor: "Carabayllo - San Pedro", etiqueta: "Carabayllo: San Pedro" },
  { valor: "Carabayllo - Los Bendecidos", etiqueta: "Carabayllo: Los Bendecidos" },
  { valor: "Carabayllo - Santa Rosa", etiqueta: "Carabayllo: Santa Rosa" },
];

// La modalidad de intervencion se escribe como la escribe el programa:
// "Comunitaria" e "I.E." (fichas A1 de Desayuno y de Casita). La etiqueta
// larga es solo lo que se lee; el dato que cruza con el programa es "I.E.".
export const MODALIDADES = [
  { valor: "Comunitaria", etiqueta: "Comunitaria" },
  { valor: "I.E.", etiqueta: "Institución Educativa (I.E.)" },
];

// El padron filtra por sede operativa con el nombre suelto ("Año Nuevo"), no
// con el valor compuesto del catalogo ("Comas - Año Nuevo"). Esta lista sale
// del catalogo, no de una escrita a mano: asi una sede nueva no puede
// quedarse fuera del filtro, que es lo que paso con Carmen Alto.
export const SEDES_OPERATIVAS = SEDES.map((sede) => {
  const [distrito, nombre] = sede.valor.split(" - ");
  return { nombre, distrito, etiqueta: `${nombre} (${distrito})` };
});

// ===========================================================================
//  PROGRAMAS INSTITUCIONALES (catálogo único)
// ===========================================================================
//  Las fuentes son los documentos del programa: la ficha A1 de Desayuno
//  Infantil (estrategia: Desayuno o Lonchera), la ficha A1 de Casita del Saber
//  (estrategia: atención fija o itinerante) y las hojas de seguimiento A5/A6,
//  donde Biblioteca Comunitaria aparece como acción y JAC, BTF y Repostería
//  como encuentros participativos y apoyos de la iglesia aliada.
//
//  Antes cada módulo llevaba su propia lista escrita a mano (ESTRATEGIAS aquí,
//  SERVICIOS en db.js y tres opciones fijas en el filtro de sedes y de
//  voluntariados): por eso Biblioteca Comunitaria, JAC, BTF y
//  Repostería no aparecían en ningún filtro y una sede nueva no podía
//  ofrecerlos. Con un solo catálogo, agregar un programa aquí basta para
//  que aparezca en todos los sitios.
//
//  `valor` es lo que se guarda en el modelo; `clave` es la palabra con la
//  que se filtra por subcadena sobre el texto guardado (igual que hacía el
//  filtro de sedes con "Desayuno", "Casita" y "Lonchera").
//
//  `enInscripcion` marca los programas que se ofrecen en la ficha de
//  inscripción como estrategia asignada. `enVoluntariado` marca los que
//  llevan voluntariado propio: JAC y BTF son cobertura sin personal
//  voluntario asignado en el padrón.
export const PROGRAMAS = [
  { valor: "Desayuno Infantil", etiqueta: "Desayuno Infantil", clave: "desayuno", enInscripcion: true, enVoluntariado: true },
  { valor: "Lonchera Infantil", etiqueta: "Lonchera Infantil", clave: "lonchera", enInscripcion: true, enVoluntariado: true },
  { valor: "Casita del Saber", etiqueta: "Casita del Saber", clave: "casita", enInscripcion: true, enVoluntariado: true },
  { valor: "Biblioteca Comunitaria", etiqueta: "Biblioteca Comunitaria", clave: "biblioteca", enInscripcion: false, enVoluntariado: true },
  { valor: "JAC", etiqueta: "JAC", clave: "jac", enInscripcion: false, enVoluntariado: false },
  { valor: "BTF (Buen Trato en Familia)", etiqueta: "BTF (Buen Trato en Familia)", clave: "btf", enInscripcion: false, enVoluntariado: false },
  { valor: "Talleres de Repostería", etiqueta: "Talleres de Repostería", clave: "repostería", enInscripcion: false, enVoluntariado: true },
];

/** Programa por clave de filtro: lo usan las vistas que filtran por subcadena. */
export const PROGRAMA_POR_CLAVE = Object.fromEntries(
  PROGRAMAS.map((programa) => [programa.clave, programa]),
);

// La ficha de inscripción sigue ofreciendo solo los tres programas de
// atención directa: la estrategia asignada del usuario no cambia con este
// catálogo, solo deja de ser la fuente de los demás módulos.
export const ESTRATEGIAS = PROGRAMAS
  .filter((programa) => programa.enInscripcion)
  .map(({ valor, etiqueta, clave }) => ({ valor, etiqueta, clave }));

// El voluntariado cubre cinco programas más el área social, que es módulo
// y no programa de cobertura. Son los seis servicios del padrón de
// voluntarios del documento.
export const OPCIONES_VOLUNTARIADO = [
  ...PROGRAMAS
    .filter((programa) => programa.enVoluntariado)
    .map(({ valor, etiqueta }) => ({ valor, etiqueta })),
  { valor: "Área Social Pastoral (ASP)", etiqueta: "Pastoral ASP" },
];

/** Valores guardados válidos de servicio de un voluntario. */
export const SERVICIOS_VOLUNTARIADO = OPCIONES_VOLUNTARIADO.map((opcion) => opcion.valor);

// Antes la estrategia cabia en un solo texto de la inscripcion y por eso
// existia el valor "Mixto (Desayuno + Casita)": un multi-select de mentira, un
// solo valor que significaba dos. Ahora son varias y ese valor desaparece del
// catalogo: la combinacion se marca marcando las dos casillas.
//
// Esta funcion traduce el programa guardado (unico historico) a la lista de
// estrategias que le corresponde. Es la misma regla que usa el relleno de la
// base, para que el codigo y los datos nunca discrepen.
export function estrategiasDesdePrograma(programa) {
  const valor = String(programa || "").trim();
  if (valor === "Mixto") return ["Desayuno Infantil", "Casita del Saber"];
  if (valor === "Casita del Saber") return ["Casita del Saber"];
  if (valor === "Lonchera Infantil") return ["Lonchera Infantil"];
  return ["Desayuno Infantil"];
}

export const EXONERACIONES = [
  {
    valor: "100% (Exonerado Vulnerabilidad Extrema)",
    etiqueta: "100% (Exonerado Total - Extrema Pobreza / Caso Social)",
  },
  {
    valor: "50% (Semi-exonerado)",
    etiqueta: "50% (Semi-exonerado - Vulnerabilidad Intermedia)",
  },
  {
    valor: "0% (Aporte Ordinario)",
    etiqueta: "0% (Aporte Ordinario)",
  },
];

// La modalidad de atencion solo existe en el servicio educativo: la ficha A1
// de Casita del Saber la pide (ATENCION FIJA / ATENCION ITINERANTE) y las de
// Desayuno y Lonchera no la tienen. Por eso se guarda solo cuando la
// inscripcion es de Casita.
export const TIPOS_ATENCION = [
  { valor: "Atención fija", etiqueta: "Atención fija" },
  { valor: "Atención itinerante", etiqueta: "Atención itinerante" },
];

// El seguro distingue la cobertura que el niño tiene y la que se desconoce.
// Las etiquetas usan las palabras del programa: la ficha de inscripcion (A1)
// ofrece SIS, EsSalud, PNP y N.A.; la evaluacion socioeconómica ofrece
// Essalud, SIS, Posta/Hospital, Otro y No tiene. "Privado" es el "Otro" de
// esa ficha y "Ninguno" su "No tiene"; "Desconocido" es lo unico que la app
// anade, porque en el padron real hay familias que no dicen nada.
export const SEGUROS = [
  { valor: "SIS Gratuito", etiqueta: "SIS" },
  { valor: "EsSalud", etiqueta: "EsSalud" },
  { valor: "PNP / FFAA", etiqueta: "PNP / FFAA" },
  { valor: "Privado", etiqueta: "Plan privado (Otro)" },
  { valor: "Ninguno", etiqueta: "Ninguno (No tiene)" },
  { valor: "Desconocido", etiqueta: "Desconocido" },
];

// La alergia se guarda en la tabla `alergia` (tipo, severidad, descripcion).
// "Ninguna" es solo un valor de la interfaz: no se persiste ningun registro.
export const TIPOS_ALERGIA = [
  { valor: "Ninguna", etiqueta: "Sin alergia" },
  { valor: "Medicamento", etiqueta: "Medicamento" },
  { valor: "Alimento", etiqueta: "Alimento" },
  { valor: "Ambiental", etiqueta: "Ambiental" },
  { valor: "Otro", etiqueta: "Otro" },
];

// El orden de la lista es el orden de gravedad: la anafilaxia va al final.
export const SEVERIDADES_ALERGIA = [
  { valor: "Leve", etiqueta: "Leve" },
  { valor: "Moderada", etiqueta: "Moderada" },
  { valor: "Grave / Anafilaxia", etiqueta: "Grave / Anafilaxia" },
];

// El tipo de documento es el valor que exige la base. La etiqueta puede llevar
// tilde ("Carnet de Extranjería") sin cambiar lo que se guarda.
export const TIPOS_DOCUMENTO = [
  { valor: "DNI", etiqueta: "DNI" },
  { valor: "Carnet Extranjeria", etiqueta: "Carnet de Extranjería" },
  { valor: "Partida Nacimiento", etiqueta: "Partida de Nacimiento" },
  { valor: "Sin Documento", etiqueta: "Sin Documento" },
];

// Tipos de local del Directorio Territorial. "Colegio Publico (I.E.)" sin
// tilde se conserva como valor legado; la interfaz y los fixtures hablan de
// "Colegio Público Aliado", que se normaliza al valor canónico.
export const TIPOS_LOCAL = [
  { valor: "Comedor Comunitario", etiqueta: "Comedor Comunitario" },
  { valor: "Iglesia Aliada", etiqueta: "Iglesia Aliada" },
  { valor: "Colegio Público (I.E.)", etiqueta: "Colegio Público (I.E.)" },
  { valor: "Biblioteca Comunal", etiqueta: "Biblioteca Comunal" },
  { valor: "Local Comunal", etiqueta: "Local Comunal" },
];

export const NIVELES_EDUCATIVOS = [
  { valor: "Inicial", etiqueta: "Inicial" },
  { valor: "Primaria", etiqueta: "Primaria" },
  { valor: "Secundaria", etiqueta: "Secundaria" },
  { valor: "N.A.", etiqueta: "N.A. (Menos de 3 años)" },
];

// El grado no se escribe: se elige de la lista que corresponde al nivel. Antes
// era texto libre y el mismo grado quedo guardado de tres formas ("Inicial",
// "Inicial 3 años" y "3 años"), que despues no se pueden contar ni filtrar.
//
// `valor` es lo que se guarda y lleva el nivel ("Inicial 4 años") porque el
// grado tambien sale en el padron y en el CSV, donde no hay una columna de
// nivel al lado. `etiqueta` es lo que se lee en el desplegable: ahi el nivel
// ya esta en el campo anterior, y repetirlo ("Inicial: Inicial 4 años") sobra.
//
// Los valores siguen la forma que ya tienen los datos: cambiarla obligaria a
// reescribir lo guardado.
export const GRADOS_POR_NIVEL = {
  "Inicial": [
    { valor: "Inicial 3 años", etiqueta: "3 años" },
    { valor: "Inicial 4 años", etiqueta: "4 años" },
    { valor: "Inicial 5 años", etiqueta: "5 años" },
  ],
  "Primaria": [
    { valor: "1er Grado Primaria", etiqueta: "1er Grado" },
    { valor: "2do Grado Primaria", etiqueta: "2do Grado" },
    { valor: "3er Grado Primaria", etiqueta: "3er Grado" },
    { valor: "4to Grado Primaria", etiqueta: "4to Grado" },
    { valor: "5to Grado Primaria", etiqueta: "5to Grado" },
    { valor: "6to Grado Primaria", etiqueta: "6to Grado" },
  ],
  "Secundaria": [
    { valor: "1er Grado Secundaria", etiqueta: "1er Grado" },
    { valor: "2do Grado Secundaria", etiqueta: "2do Grado" },
    { valor: "3er Grado Secundaria", etiqueta: "3er Grado" },
    { valor: "4to Grado Secundaria", etiqueta: "4to Grado" },
    { valor: "5to Grado Secundaria", etiqueta: "5to Grado" },
  ],
  // N.A. son los usuarios que aun no tienen edad escolar.
  "N.A.": [{ valor: "No aplica (menos de 3 años)", etiqueta: "No aplica" }],
};

/** Grados (valor y etiqueta) que corresponden a un nivel educativo. */
export function gradosDeNivel(nivel) {
  return GRADOS_POR_NIVEL[nivel] || [];
}

/** Solo los valores guardados de un nivel: sirve para comprobar pertenencia. */
export function valoresDeGrado(nivel) {
  return gradosDeNivel(nivel).map((grado) => grado.valor);
}

// Un solo catalogo para el apoderado y las dos personas autorizadas de retiro.
// Antes la Persona 2 tenia "Familiar" y las otras dos "Cuidador Legal"; con
// dos listas distintas, el mismo dato se podia guardar de formas que no
// coincidian. Ahora las tres ofrecen exactamente las mismas opciones.
export const PARENTESCOS = [
  "Madre",
  "Padre",
  "Abuela",
  "Abuelo",
  "Tía",
  "Tío",
  "Prima",
  "Primo",
  "Hermana",
  "Hermano",
  "Padrino",
  "Madrina",
  "Cuidador Legal",
  "Familiar",
  // Opciones que ya existian en la base o en fichas antiguas. Se conservan
  // para no convertir esos datos en "Otro" al editar.
  "Padrastro",
  "Madrastra",
  "Hermano/a",
  "Otro",
];
