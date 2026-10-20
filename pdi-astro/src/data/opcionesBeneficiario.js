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

export const MODALIDADES = [
  { valor: "Comunitaria", etiqueta: "Comunitaria" },
  { valor: "Institución Educativa", etiqueta: "Institución Educativa (I.E.)" },
];

// El padron filtra por sede operativa con el nombre suelto ("Año Nuevo"), no
// con el valor compuesto del catalogo ("Comas - Año Nuevo"). Esta lista sale
// del catalogo, no de una escrita a mano: asi una sede nueva no puede
// quedarse fuera del filtro, que es lo que paso con Carmen Alto.
export const SEDES_OPERATIVAS = SEDES.map((sede) => {
  const [distrito, nombre] = sede.valor.split(" - ");
  return { nombre, distrito, etiqueta: `${nombre} (${distrito})` };
});

export const ESTRATEGIAS = [
  { valor: "Desayuno Infantil", etiqueta: "Desayuno Infantil", clave: "desayuno" },
  { valor: "Lonchera Infantil", etiqueta: "Lonchera Infantil", clave: "lonchera" },
  { valor: "Casita del Saber", etiqueta: "Casita del Saber", clave: "casita" },
];

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

export const SEGUROS = [
  { valor: "SIS Gratuito", etiqueta: "SIS Gratuito" },
  { valor: "EsSalud", etiqueta: "EsSalud" },
  { valor: "PNP / FFAA", etiqueta: "PNP / FFAA" },
  { valor: "Ninguno", etiqueta: "Ninguno" },
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
];
