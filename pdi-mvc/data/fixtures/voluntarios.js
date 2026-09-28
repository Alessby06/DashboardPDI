// ===========================================================================
//  DATOS SEMILLA - CONTENIDO FICTICIO
// ===========================================================================
//  Padron de voluntariado y personal comunitario.
//
//  IMPORTANTE: los registros de este archivo son INVENTADOS. No corresponden
//  a menores, familias ni personas reales. Los documentos de identidad,
//  telefonos, coordenadas y domicilios son ficticios.
//
//  Sirven unicamente para poblar la interfaz mientras no exista la base de
//  datos del sistema. Cuando se conecte la fuente real, este archivo deja de
//  leerse y el modelo pasa a cargar los datos del servidor.
//
//  Los datos reales se incorporaran desde los archivos Excel del relevamiento
//  de campo; el modelo de datos ya esta disenado para recibirlos.
// ===========================================================================

export const defaultVoluntarios = [
  {
    id: 1,
    codigo: "VOL-2026-001",
    nombres: "María Elena",
    apellidos: "Gutiérrez Vega",
    dni: "41892341",
    celular: "987-342-119",
    fechaNacimiento: "1988-05-14",
    edad: 37,
    domicilio: "Mz. 4W Lt. 32, Comité 12, A.H. Año Nuevo Sector B",
    distrito: "Comas",
    sedeAsignada: "Año Nuevo",
    servicio: "Desayuno Infantil",
    rol: "Voluntaria Responsable",
    estrategia: "Atención Fija",
    tipoVoluntariado: "Distribución y Cocina",
    capacitaciones: [
      "Higiene y manipulación de alimentos",
      "Prevención de Anemia en la 1ra infancia (6-36 meses)",
      "Grupos de alimentos y refrigerios saludables"
    ],
    canastasRecibidas: 3,
    fechaIngreso: "2025-03-01",
    estado: "Activo",
    disponibilidad: "Lunes a Viernes (7:00 AM - 10:30 AM)",
    observaciones: "Coordina recepción y distribución de raciones calientes en el Comedor San Benito."
  },
  {
    id: 2,
    codigo: "VOL-2026-002",
    nombres: "Rosa Isabel",
    apellidos: "Paredes Mamani",
    dni: "45210984",
    celular: "976-112-453",
    fechaNacimiento: "1994-11-20",
    edad: 31,
    domicilio: "Jr. Los Pinos 348, Carmen Alto",
    distrito: "Comas",
    sedeAsignada: "Carmen Alto",
    servicio: "Casita del Saber",
    rol: "Acompañante Pedagógica",
    estrategia: "Atención Fija",
    tipoVoluntariado: "Apoyo en Espacios Casita",
    capacitaciones: [
      "Malnutrición infantil y rendimiento escolar",
      "Mediación lectora y cuenta cuentos",
      "Bienestar emocional y hábitos saludables"
    ],
    canastasRecibidas: 2,
    fechaIngreso: "2025-06-15",
    estado: "Activo",
    disponibilidad: "Lunes, Miércoles y Viernes (8:00 AM - 12:30 PM)",
    observaciones: "Estudiante de educación primaria. Apoya en refuerzo de lectoescritura con menores de 6 a 8 años."
  },
  {
    id: 3,
    codigo: "VOL-2026-003",
    nombres: "Juana Patricia",
    apellidos: "Condori Quispe",
    dni: "09823412",
    celular: "991-884-210",
    fechaNacimiento: "1979-02-18",
    edad: 47,
    domicilio: "Mz. F Lote 14, A.H. La Libertad",
    distrito: "Comas",
    sedeAsignada: "La Libertad",
    servicio: "Desayuno Infantil",
    rol: "Voluntaria Responsable",
    estrategia: "Atención Fija",
    tipoVoluntariado: "Distribución y Cocina",
    capacitaciones: [
      "Higiene y manipulación de alimentos",
      "Anemia en la 2da infancia (3-12 años)",
      "Platos y refrigerios saludables"
    ],
    canastasRecibidas: 4,
    fechaIngreso: "2024-04-10",
    estado: "Activo",
    disponibilidad: "Lunes a Viernes (7:15 AM - 11:00 AM)",
    observaciones: "Lideresa comunitaria en La Libertad. Control estricto de higiene y raciones sobrantes."
  },
  {
    id: 4,
    codigo: "VOL-2026-004",
    nombres: "Lucía Teresa",
    apellidos: "Ramos Salazar",
    dni: "71239014",
    celular: "984-556-781",
    fechaNacimiento: "1999-08-04",
    edad: 26,
    domicilio: "Av. Túpac Amaru Km 21, Mz. C Lt. 8, El Progreso",
    distrito: "Carabayllo",
    sedeAsignada: "El Progreso",
    servicio: "Casita del Saber",
    rol: "Mediadora Lectora",
    estrategia: "Atención Itinerante",
    tipoVoluntariado: "Biblioteca Comunitaria",
    capacitaciones: [
      "Mediación lectora y cuenta cuentos",
      "Promoción de Derechos en las Infancias",
      "Acciones ecológicas comunitarias"
    ],
    canastasRecibidas: 1,
    fechaIngreso: "2026-01-10",
    estado: "Activo",
    disponibilidad: "Martes y Jueves (2:00 PM - 5:30 PM)",
    observaciones: "Responsable de dinámicas de biblioteca móvil y talleres ecológicos en Carabayllo."
  },
  {
    id: 5,
    codigo: "VOL-2026-005",
    nombres: "Carmen Gloria",
    apellidos: "Mendoza Vda. de Silva",
    dni: "08761234",
    celular: "965-432-870",
    fechaNacimiento: "1973-12-09",
    edad: 52,
    domicilio: "Mz. B Lt. 15, Sector Torre Blanca Parte Alta",
    distrito: "Carabayllo",
    sedeAsignada: "Torre Blanca",
    servicio: "Área Social Pastoral (ASP)",
    rol: "Pastoral Comunitario",
    estrategia: "Atención Fija",
    tipoVoluntariado: "Talleres y Consejería",
    capacitaciones: [
      "Buen Trato en Familia (BTF)",
      "Bienestar emocional y hábitos saludables",
      "Detección y derivación de casos de violencia y vulnerabilidad"
    ],
    canastasRecibidas: 3,
    fechaIngreso: "2024-08-20",
    estado: "Activo",
    disponibilidad: "Miércoles y Sábados (9:00 AM - 1:00 PM)",
    observaciones: "Consejera pastoral en Iglesia Torre Blanca. Canaliza derivaciones urgentes de soporte familiar."
  },
  {
    id: 6,
    codigo: "VOL-2026-006",
    nombres: "Sonia Marisol",
    apellidos: "Alvarado Benites",
    dni: "46781290",
    celular: "951-223-904",
    fechaNacimiento: "1991-04-25",
    edad: 34,
    domicilio: "Calle San Martín 142, San Pedro",
    distrito: "Carabayllo",
    sedeAsignada: "San Pedro",
    servicio: "Desayuno Infantil",
    rol: "Voluntaria de Apoyo",
    estrategia: "Atención Fija",
    tipoVoluntariado: "Distribución y Cocina",
    capacitaciones: [
      "Higiene y manipulación de alimentos",
      "Grupos de alimentos y refrigerios saludables"
    ],
    canastasRecibidas: 2,
    fechaIngreso: "2025-09-01",
    estado: "Activo",
    disponibilidad: "Lunes a Jueves (7:30 AM - 10:00 AM)",
    observaciones: "Apoyo en desinfección y registro de asistencia diaria de comensales."
  },
  {
    id: 7,
    codigo: "VOL-2026-007",
    nombres: "Esther Noemí",
    apellidos: "Huanca Chura",
    dni: "43129876",
    celular: "940-128-449",
    fechaNacimiento: "1986-09-12",
    edad: 39,
    domicilio: "Mz. 2K Lt. 19, Año Nuevo",
    distrito: "Comas",
    sedeAsignada: "Año Nuevo",
    servicio: "Casita del Saber",
    rol: "Voluntaria de Apoyo",
    estrategia: "Atención Fija",
    tipoVoluntariado: "Apoyo en Espacios Casita",
    capacitaciones: [
      "Promoción de Derechos en las Infancias"
    ],
    canastasRecibidas: 1,
    fechaIngreso: "2026-02-01",
    estado: "Activo",
    disponibilidad: "Martes y Jueves (8:30 AM - 12:00 PM)",
    observaciones: "Madre de familia voluntaria en dinámicas pedagógicas y manualidades."
  },
  {
    id: 8,
    codigo: "VOL-2026-008",
    nombres: "Gladys Elena",
    apellidos: "Rojas Vilca",
    dni: "07891245",
    celular: "931-778-210",
    fechaNacimiento: "1968-07-30",
    edad: 57,
    domicilio: "Jr. Alfonso Ugarte 502, La Libertad",
    distrito: "Comas",
    sedeAsignada: "La Libertad",
    servicio: "Desayuno Infantil",
    rol: "Voluntaria de Apoyo",
    estrategia: "Atención Fija",
    tipoVoluntariado: "Distribución y Cocina",
    capacitaciones: [
      "Higiene y manipulación de alimentos"
    ],
    canastasRecibidas: 2,
    fechaIngreso: "2024-03-15",
    estado: "En Pausa",
    disponibilidad: "En pausa temporal por temas de salud familiar.",
    observaciones: "Voluntaria histórica. Reincorporación proyectada para el siguiente trimestre."
  }
]
