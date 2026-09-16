/* ==========================================================================
   SISTEMA DE GESTIÓN INTEGRAL PDI - ASOCIACIÓN CULTURAL JOHANNES GUTENBERG
   PRODUCCIÓN BUNDLE JS (DISTRIBUCIÓN MODULAR UNIFICADA)
   ========================================================================== */


/* --- Module: models/BeneficiarioModel.js --- */
// Modelo de Beneficiarios (Padrón de Menores PDI)
// Incorpora el 100% de los campos oficiales de las Fichas A0, A1, A2, A3, A6 CRED y ASP

const defaultBeneficiarios = [
  {
    "id": 1,
    "codigo": "PDI-2026-001",
    "nombres": "Thiago Gael",
    "apellidos": "Flores Quispe",
    "dni": "78491023",
    "fechaNacimiento": "2022-03-14",
    "edad": "4 años",
    "sexo": "M",
    "direccion": "Mz. 4W Lt. 30, Comité 12",
    "referencia": "Frente al Comedor Popular San Benito",
    "distrito": "Comas",
    "sede": "Año Nuevo",
    "modalidad": "Comunitaria",
    "estrategia": "Mixto (Desayuno + Casita)",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Desayuno Infantil",
      "Casita del Saber"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "C.S. Año Nuevo",
    "alergias": "Ninguna",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 4 años",
    "colegio": "I.E. 3054",
    "apoderado": "Rosa Quispe Huamán",
    "parentesco": "Madre",
    "apoderadoDni": "41982341",
    "telefono": "987-654-321",
    "telefonoAlt": "912-883-112",
    "estado": "Activo",
    "hb": 10.4,
    "peso": 14.2,
    "talla": 94.5,
    "anemia": "Leve",
    "canastaEntregada": true,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Rosa Quispe (Madre) / Carlos Flores (Padre)",
    "retiroPadron": [
      {
        "nombre": "Rosa Quispe Huamán",
        "dni": "41982341",
        "parentesco": "Madre",
        "telefono": "987-654-321"
      },
      {
        "nombre": "Carlos Flores Mendoza",
        "dni": "09823412",
        "parentesco": "Padre",
        "telefono": "976-112-445"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 84
  },
  {
    "id": 2,
    "codigo": "PDI-2026-002",
    "nombres": "Mia Valentina",
    "apellidos": "Mendoza Ramos",
    "dni": "79102485",
    "fechaNacimiento": "2021-08-20",
    "edad": "5 años",
    "sexo": "F",
    "direccion": "Jr. Los Pinos 145, Sector La Libertad",
    "referencia": "Cruce con Av. Túpac Amaru",
    "distrito": "Comas",
    "sede": "La Libertad",
    "modalidad": "Comunitaria",
    "estrategia": "Desayuno Infantil",
    "exoneracionAporte": "50% (Semi-exonerado)",
    "servicios": [
      "Desayuno Infantil"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "C.S. La Libertad",
    "alergias": "Penicilina",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 5 años",
    "colegio": "I.E. Los Angelitos",
    "apoderado": "Carmen Ramos",
    "parentesco": "Madre",
    "apoderadoDni": "42891044",
    "telefono": "912-345-678",
    "telefonoAlt": "923-456-789",
    "estado": "Activo",
    "hb": 11.6,
    "peso": 16.5,
    "talla": 102.0,
    "anemia": "Normal",
    "canastaEntregada": false,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Carmen Ramos (Madre)",
    "retiroPadron": [
      {
        "nombre": "Carmen Ramos",
        "dni": "42891044",
        "parentesco": "Madre",
        "telefono": "912-345-678"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 62
  },
  {
    "id": 3,
    "codigo": "PDI-2026-003",
    "nombres": "Liam Mateo",
    "apellidos": "Sanchez Diaz",
    "dni": "80145922",
    "fechaNacimiento": "2023-01-11",
    "edad": "3 años",
    "sexo": "M",
    "direccion": "Asociación El Progreso Mz. B Lt. 14",
    "referencia": "Espalda de la Posta Médica El Progreso",
    "distrito": "Carabayllo",
    "sede": "El Progreso",
    "modalidad": "Comunitaria",
    "estrategia": "Mixto (Desayuno + Casita)",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Desayuno Infantil",
      "Casita del Saber"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "C.S. El Progreso",
    "alergias": "Ninguna",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 3 años",
    "colegio": "I.E. 3058",
    "apoderado": "Gladys Diaz",
    "parentesco": "Abuela",
    "apoderadoDni": "08941233",
    "telefono": "976-543-210",
    "telefonoAlt": "987-112-990",
    "estado": "Activo",
    "hb": 9.6,
    "peso": 12.8,
    "talla": 88.0,
    "anemia": "Moderada",
    "canastaEntregada": true,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Gladys Diaz (Abuela)",
    "retiroPadron": [
      {
        "nombre": "Gladys Diaz",
        "dni": "08941233",
        "parentesco": "Abuela",
        "telefono": "976-543-210"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 92
  },
  {
    "id": 4,
    "codigo": "PDI-2026-004",
    "nombres": "Luciana Sofia",
    "apellidos": "Alvarez Vega",
    "dni": "81203948",
    "fechaNacimiento": "2020-05-18",
    "edad": "6 años",
    "sexo": "F",
    "direccion": "Av. Revolución 890, Comas",
    "referencia": "Paradero La Pascana",
    "distrito": "Comas",
    "sede": "Año Nuevo",
    "modalidad": "Institución Educativa",
    "estrategia": "Casita del Saber",
    "exoneracionAporte": "0% (Aporte Ordinario)",
    "servicios": [
      "Casita del Saber"
    ],
    "seguro": "EsSalud",
    "centroSalud": "Policlínico Comas",
    "alergias": "Ninguna",
    "nivelEducativo": "Primaria",
    "grado": "1er Grado Primaria",
    "colegio": "I.E. San Martín",
    "apoderado": "Jorge Alvarez",
    "parentesco": "Padre",
    "apoderadoDni": "40192837",
    "telefono": "945-678-123",
    "telefonoAlt": "956-789-012",
    "estado": "Activo",
    "hb": 12.2,
    "peso": 19.4,
    "talla": 112.5,
    "anemia": "Normal",
    "canastaEntregada": false,
    "orientacionFamiliar": false,
    "retiroAutorizado": "Jorge Alvarez (Padre)",
    "retiroPadron": [
      {
        "nombre": "Jorge Alvarez",
        "dni": "40192837",
        "parentesco": "Padre",
        "telefono": "945-678-123"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 45
  },
  {
    "id": 5,
    "codigo": "PDI-2026-005",
    "nombres": "Mateo Sebastian",
    "apellidos": "Castillo Ruiz",
    "dni": "82394019",
    "fechaNacimiento": "2022-09-05",
    "edad": "4 años",
    "sexo": "M",
    "direccion": "Mz. G Lt. 12, AA.HH. San Pedro",
    "referencia": "Cerca al Vaso de Leche San Pedro",
    "distrito": "Carabayllo",
    "sede": "San Pedro",
    "modalidad": "Comunitaria",
    "estrategia": "Desayuno Infantil",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Desayuno Infantil"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "P.S. San Pedro",
    "alergias": "Sulfas",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 4 años",
    "colegio": "I.E. San Pedro",
    "apoderado": "Elena Ruiz",
    "parentesco": "Madre",
    "apoderadoDni": "45019284",
    "telefono": "934-567-890",
    "telefonoAlt": "945-678-901",
    "estado": "Activo",
    "hb": 10.2,
    "peso": 14.8,
    "talla": 95.0,
    "anemia": "Leve",
    "canastaEntregada": true,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Elena Ruiz (Madre)",
    "retiroPadron": [
      {
        "nombre": "Elena Ruiz",
        "dni": "45019284",
        "parentesco": "Madre",
        "telefono": "934-567-890"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 88
  },
  {
    "id": 6,
    "codigo": "PDI-2026-006",
    "nombres": "Benjamín Elías",
    "apellidos": "Navarro Huamán",
    "dni": "84120934",
    "fechaNacimiento": "2021-06-15",
    "edad": "5 años",
    "sexo": "M",
    "direccion": "Asoc. Viv. Santa Rosa Mz. K Lt. 4",
    "referencia": "A espaldas de la Capilla Santa Rosa",
    "distrito": "Carabayllo",
    "sede": "Santa Rosa",
    "modalidad": "Comunitaria",
    "estrategia": "Mixto (Desayuno + Casita)",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Desayuno Infantil",
      "Casita del Saber"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "C.S. San Benito",
    "alergias": "Ninguna",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 5 años",
    "colegio": "I.E. Santa Rosa de Lima",
    "apoderado": "Patricia Huamán Soto",
    "parentesco": "Madre",
    "apoderadoDni": "45129834",
    "telefono": "987-112-334",
    "telefonoAlt": "998-776-554",
    "estado": "Activo",
    "hb": 11.4,
    "peso": 17.1,
    "talla": 104.2,
    "anemia": "Normal",
    "canastaEntregada": true,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Patricia Huamán Soto (Madre)",
    "retiroPadron": [
      {
        "nombre": "Patricia Huamán Soto",
        "dni": "45129834",
        "parentesco": "Madre",
        "telefono": "987-112-334"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 78
  },
  {
    "id": 7,
    "codigo": "PDI-2026-007",
    "nombres": "Camila Fernanda",
    "apellidos": "Rojas Morales",
    "dni": "85231045",
    "fechaNacimiento": "2022-04-22",
    "edad": "4 años",
    "sexo": "F",
    "direccion": "Pasaje Los Claveles 120, Año Nuevo",
    "referencia": "A dos cuadras del Mercado Central",
    "distrito": "Comas",
    "sede": "Año Nuevo",
    "modalidad": "Comunitaria",
    "estrategia": "Desayuno Infantil",
    "exoneracionAporte": "50% (Semi-exonerado)",
    "servicios": [
      "Desayuno Infantil"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "C.S. Año Nuevo",
    "alergias": "Ninguna",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 4 años",
    "colegio": "I.E. 3054",
    "apoderado": "Miriam Morales Vega",
    "parentesco": "Madre",
    "apoderadoDni": "43219087",
    "telefono": "913-445-566",
    "telefonoAlt": "924-556-677",
    "estado": "Activo",
    "hb": 10.7,
    "peso": 15.2,
    "talla": 96.4,
    "anemia": "Leve",
    "canastaEntregada": true,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Miriam Morales (Madre) / Pedro Rojas (Padre)",
    "retiroPadron": [
      {
        "nombre": "Miriam Morales Vega",
        "dni": "43219087",
        "parentesco": "Madre",
        "telefono": "913-445-566"
      },
      {
        "nombre": "Pedro Rojas Paucar",
        "dni": "10234567",
        "parentesco": "Padre",
        "telefono": "981-223-344"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 68
  },
  {
    "id": 8,
    "codigo": "PDI-2026-008",
    "nombres": "Dylan Josué",
    "apellidos": "Quispe Córdova",
    "dni": "86342156",
    "fechaNacimiento": "2023-02-10",
    "edad": "3 años",
    "sexo": "M",
    "direccion": "Mz. F Lt. 8, San Pedro de Carabayllo",
    "referencia": "Paradero Final Línea 22",
    "distrito": "Carabayllo",
    "sede": "San Pedro",
    "modalidad": "Comunitaria",
    "estrategia": "Desayuno Infantil",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Desayuno Infantil"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "P.S. San Pedro",
    "alergias": "Amoxicilina",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 3 años",
    "colegio": "I.E. Los Chiquitines",
    "apoderado": "Karina Córdova Quispe",
    "parentesco": "Madre",
    "apoderadoDni": "46781234",
    "telefono": "935-667-788",
    "telefonoAlt": "946-778-899",
    "estado": "Activo",
    "hb": 9.8,
    "peso": 12.4,
    "talla": 86.8,
    "anemia": "Moderada",
    "canastaEntregada": true,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Karina Córdova (Madre)",
    "retiroPadron": [
      {
        "nombre": "Karina Córdova Quispe",
        "dni": "46781234",
        "parentesco": "Madre",
        "telefono": "935-667-788"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 90
  },
  {
    "id": 9,
    "codigo": "PDI-2026-009",
    "nombres": "Zoe Valentina",
    "apellidos": "Huamán Chavez",
    "dni": "87453267",
    "fechaNacimiento": "2021-07-30",
    "edad": "5 años",
    "sexo": "F",
    "direccion": "Calle Los Pinos 230, La Libertad",
    "referencia": "Cerca al Parque Infantil",
    "distrito": "Comas",
    "sede": "La Libertad",
    "modalidad": "Institución Educativa",
    "estrategia": "Casita del Saber",
    "exoneracionAporte": "0% (Aporte Ordinario)",
    "servicios": [
      "Casita del Saber"
    ],
    "seguro": "EsSalud",
    "centroSalud": "Policlínico Comas",
    "alergias": "Ninguna",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 5 años",
    "colegio": "I.E. Los Angelitos",
    "apoderado": "Victor Huamán Paredes",
    "parentesco": "Padre",
    "apoderadoDni": "41238901",
    "telefono": "956-778-899",
    "telefonoAlt": "967-889-900",
    "estado": "Activo",
    "hb": 11.9,
    "peso": 17.5,
    "talla": 105.0,
    "anemia": "Normal",
    "canastaEntregada": false,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Victor Huamán (Padre)",
    "retiroPadron": [
      {
        "nombre": "Victor Huamán Paredes",
        "dni": "41238901",
        "parentesco": "Padre",
        "telefono": "956-778-899"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 40
  },
  {
    "id": 10,
    "codigo": "PDI-2026-010",
    "nombres": "Lucas Alejandro",
    "apellidos": "Torres Vilchez",
    "dni": "88564378",
    "fechaNacimiento": "2022-10-18",
    "edad": "4 años",
    "sexo": "M",
    "direccion": "AA.HH. Los Bendecidos Mz. C Lt. 7",
    "referencia": "Frente al Comedor Bendición de Dios",
    "distrito": "Carabayllo",
    "sede": "Los Bendecidos",
    "modalidad": "Comunitaria",
    "estrategia": "Mixto (Desayuno + Casita)",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Desayuno Infantil",
      "Casita del Saber"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "C.S. El Progreso",
    "alergias": "Ninguna",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 4 años",
    "colegio": "I.E. Carmen Alto",
    "apoderado": "Sonia Vilchez Romero",
    "parentesco": "Madre",
    "apoderadoDni": "44567890",
    "telefono": "947-889-900",
    "telefonoAlt": "958-990-011",
    "estado": "Activo",
    "hb": 10.3,
    "peso": 14.5,
    "talla": 94.0,
    "anemia": "Leve",
    "canastaEntregada": true,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Sonia Vilchez (Madre)",
    "retiroPadron": [
      {
        "nombre": "Sonia Vilchez Romero",
        "dni": "44567890",
        "parentesco": "Madre",
        "telefono": "947-889-900"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 82
  },
  {
    "id": 11,
    "codigo": "PDI-2026-011",
    "nombres": "Emily Yamileth",
    "apellidos": "Mamani Cruz",
    "dni": "89675489",
    "fechaNacimiento": "2020-02-14",
    "edad": "6 años",
    "sexo": "F",
    "direccion": "Jr. San Martín 450, Carmen Alto",
    "referencia": "A una cuadra de la Capilla del Carmen",
    "distrito": "Comas",
    "sede": "Carmen Alto",
    "modalidad": "Institución Educativa",
    "estrategia": "Casita del Saber",
    "exoneracionAporte": "50% (Semi-exonerado)",
    "servicios": [
      "Casita del Saber"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "C.S. Año Nuevo",
    "alergias": "Ninguna",
    "nivelEducativo": "Primaria",
    "grado": "1er Grado Primaria",
    "colegio": "I.E. Valverde Caro",
    "apoderado": "Luz Cruz Mamani",
    "parentesco": "Madre",
    "apoderadoDni": "42345678",
    "telefono": "968-990-011",
    "telefonoAlt": "979-001-122",
    "estado": "Activo",
    "hb": 12.1,
    "peso": 20.2,
    "talla": 114.0,
    "anemia": "Normal",
    "canastaEntregada": false,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Luz Cruz (Madre)",
    "retiroPadron": [
      {
        "nombre": "Luz Cruz Mamani",
        "dni": "42345678",
        "parentesco": "Madre",
        "telefono": "968-990-011"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 52
  },
  {
    "id": 12,
    "codigo": "PDI-2026-012",
    "nombres": "Facundo Gabriel",
    "apellidos": "Ruiz Espinoza",
    "dni": "80786590",
    "fechaNacimiento": "2023-03-25",
    "edad": "3 años",
    "sexo": "M",
    "direccion": "Mz. D Lt. 19, Sector San Pedro",
    "referencia": "Cerca al Tanque de Agua de Sedapal",
    "distrito": "Carabayllo",
    "sede": "San Pedro",
    "modalidad": "Comunitaria",
    "estrategia": "Desayuno Infantil",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Desayuno Infantil"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "P.S. San Pedro",
    "alergias": "Ninguna",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 3 años",
    "colegio": "I.E. San Pedro",
    "apoderado": "Mercedes Espinoza Loayza",
    "parentesco": "Tía",
    "apoderadoDni": "43456789",
    "telefono": "978-001-122",
    "telefonoAlt": "989-112-233",
    "estado": "Activo",
    "hb": 10.1,
    "peso": 13.0,
    "talla": 89.2,
    "anemia": "Leve",
    "canastaEntregada": true,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Mercedes Espinoza (Tía)",
    "retiroPadron": [
      {
        "nombre": "Mercedes Espinoza Loayza",
        "dni": "43456789",
        "parentesco": "Tía",
        "telefono": "978-001-122"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 86
  },
  {
    "id": 13,
    "codigo": "PDI-2026-013",
    "nombres": "Valentina Nicolle",
    "apellidos": "Perez Ramos",
    "dni": "81897601",
    "fechaNacimiento": "2021-09-12",
    "edad": "5 años",
    "sexo": "F",
    "direccion": "Calle Los Pinos 78, Año Nuevo",
    "referencia": "A media cuadra del Parque Los Pinos",
    "distrito": "Comas",
    "sede": "Año Nuevo",
    "modalidad": "Comunitaria",
    "estrategia": "Mixto (Desayuno + Casita)",
    "exoneracionAporte": "50% (Semi-exonerado)",
    "servicios": [
      "Desayuno Infantil",
      "Casita del Saber"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "C.S. Año Nuevo",
    "alergias": "Ninguna",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 5 años",
    "colegio": "I.E. 3054",
    "apoderado": "Jessica Ramos Palomino",
    "parentesco": "Madre",
    "apoderadoDni": "44678901",
    "telefono": "989-112-233",
    "telefonoAlt": "990-223-344",
    "estado": "Activo",
    "hb": 11.5,
    "peso": 16.8,
    "talla": 103.5,
    "anemia": "Normal",
    "canastaEntregada": false,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Jessica Ramos (Madre)",
    "retiroPadron": [
      {
        "nombre": "Jessica Ramos Palomino",
        "dni": "44678901",
        "parentesco": "Madre",
        "telefono": "989-112-233"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 58
  },
  {
    "id": 14,
    "codigo": "PDI-2026-014",
    "nombres": "Ian Mathias",
    "apellidos": "Garcia Tello",
    "dni": "82908712",
    "fechaNacimiento": "2022-05-08",
    "edad": "4 años",
    "sexo": "M",
    "direccion": "Sector El Progreso Mz. H Lt. 15",
    "referencia": "Frente a la Capilla Virgen de Copacabana",
    "distrito": "Carabayllo",
    "sede": "El Progreso",
    "modalidad": "Comunitaria",
    "estrategia": "Desayuno Infantil",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Desayuno Infantil"
    ],
    "seguro": "SIS Gratuito",
    "centroSalud": "C.S. El Progreso",
    "alergias": "Ninguna",
    "nivelEducativo": "Inicial",
    "grado": "Inicial 4 años",
    "colegio": "I.E. 3058",
    "apoderado": "Gloria Tello Huamaní",
    "parentesco": "Abuela",
    "apoderadoDni": "09123456",
    "telefono": "990-223-344",
    "telefonoAlt": "911-334-455",
    "estado": "Activo",
    "hb": 10.5,
    "peso": 15.0,
    "talla": 96.0,
    "anemia": "Leve",
    "canastaEntregada": true,
    "orientacionFamiliar": true,
    "retiroAutorizado": "Gloria Tello (Abuela)",
    "retiroPadron": [
      {
        "nombre": "Gloria Tello Huamaní",
        "dni": "09123456",
        "parentesco": "Abuela",
        "telefono": "990-223-344"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 80
  },
  {
    "id": 15,
    "codigo": "PDI-2026-015",
    "nombres": "Genesis Adriana",
    "apellidos": "Soto Gutierrez",
    "dni": "83019823",
    "fechaNacimiento": "2020-08-19",
    "edad": "6 años",
    "sexo": "F",
    "direccion": "Av. Belaunde Este 540, La Libertad",
    "referencia": "Paradero San Carlos",
    "distrito": "Comas",
    "sede": "La Libertad",
    "modalidad": "Institución Educativa",
    "estrategia": "Casita del Saber",
    "exoneracionAporte": "0% (Aporte Ordinario)",
    "servicios": [
      "Casita del Saber"
    ],
    "seguro": "EsSalud",
    "centroSalud": "Policlínico Comas",
    "alergias": "Ninguna",
    "nivelEducativo": "Primaria",
    "grado": "1er Grado Primaria",
    "colegio": "I.E. San Martín",
    "apoderado": "Raúl Soto Mendoza",
    "parentesco": "Padre",
    "apoderadoDni": "40987654",
    "telefono": "911-334-455",
    "telefonoAlt": "922-445-566",
    "estado": "Activo",
    "hb": 12.4,
    "peso": 19.8,
    "talla": 113.2,
    "anemia": "Normal",
    "canastaEntregada": false,
    "orientacionFamiliar": false,
    "retiroAutorizado": "Raúl Soto (Padre)",
    "retiroPadron": [
      {
        "nombre": "Raúl Soto Mendoza",
        "dni": "40987654",
        "parentesco": "Padre",
        "telefono": "911-334-455"
      }
    ],
    "consentimientos": {
      "evaluacionSocial": true,
      "usoFotografia": true,
      "gestionDonaciones": true,
      "flujoTransfronterizo": true
    },
    "firmaDigital": true,
    "vulnerabilidad": 42
  }
];

const BeneficiarioModel = {
  _data: null,

  init() {
    const storage = window.PDI?.StorageService || StorageService;
    this._data = storage.getItem("pdi_mock_beneficiarios", defaultBeneficiarios);
    return this._data;
  },

  getAll() {
    if (!this._data) this.init();
    return this._data;
  },

  getById(id) {
    const list = this.getAll();
    return list.find(b => b.id === Number(id)) || null;
  },

  add(nuevoMenor) {
    const list = this.getAll();
    list.unshift(nuevoMenor);
    const storage = window.PDI?.StorageService || StorageService;
    storage.setItem("pdi_mock_beneficiarios", list);
    return nuevoMenor;
  },

  update(id, updatedData) {
    const list = this.getAll();
    const idx = list.findIndex(b => b.id === Number(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedData };
      const storage = window.PDI?.StorageService || StorageService;
      storage.setItem("pdi_mock_beneficiarios", list);
      return list[idx];
    }
    return null;
  },

  delete(id) {
    const list = this.getAll();
    const idx = list.findIndex(b => b.id === Number(id));
    if (idx !== -1) {
      const removed = list.splice(idx, 1)[0];
      const storage = window.PDI?.StorageService || StorageService;
      storage.setItem("pdi_mock_beneficiarios", list);
      return removed;
    }
    return null;
  },

  search(query) {
    const list = this.getAll();
    if (!query || query.trim() === "") return list;
    const q = query.toLowerCase().trim();
    return list.filter(b => 
      b.nombres.toLowerCase().includes(q) ||
      b.apellidos.toLowerCase().includes(q) ||
      b.codigo.toLowerCase().includes(q) ||
      b.dni.includes(q) ||
      b.distrito.toLowerCase().includes(q) ||
      b.sede.toLowerCase().includes(q)
    );
  },

  getStats() {
    const list = this.getAll();
    const total = list.length;
    const normales = list.filter(b => b.anemia === "Normal").length;
    const leves = list.filter(b => b.anemia === "Leve").length;
    const moderadas = list.filter(b => b.anemia === "Moderada" || b.anemia === "Severa").length;

    const pctNormal = total > 0 ? Math.round((normales / total) * 100) : 0;
    const pctLeve = total > 0 ? Math.round((leves / total) * 100) : 0;
    const pctMod = total > 0 ? Math.round((moderadas / total) * 100) : 0;

    const comasCount = list.filter(b => b.distrito === "Comas").length;
    const carabaylloCount = list.filter(b => b.distrito === "Carabayllo").length;

    return {
      total,
      normales,
      leves,
      moderadas,
      pctNormal,
      pctLeve,
      pctMod,
      comasCount,
      carabaylloCount
    };
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.defaultBeneficiarios = defaultBeneficiarios;
  window.PDI.BeneficiarioModel = BeneficiarioModel;
}


/* --- Module: models/CasoSocialModel.js --- */
// Modelo de Casos Sociales (Derivaciones ASP - Área Social Pastoral)
// Basado fielmente en la FICHA DE DERIVACIÓN DE CASO SOCIAL oficial

const defaultCasosSociales = [
  {
    id: 101,
    menor: "Liam Mateo Sanchez Diaz",
    codigo: "PDI-2026-003",
    etapa: "pendiente",
    urgencia: "Alta",
    tipoProblematica: "Salud",
    fechaDerivacion: "2026-04-12",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Hb 9.6 g/dL (Anemia Moderada). Cuidadora principal es abuela de 64 años sin empleo formal ni pensión.",
    accionesPrevias: "Prescripción de gotas de sulfato ferroso y primera sesión demostrativa de alimentos ricos en hierro.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Padres ausentes. Solo cuenta con apoyo esporádico de vecina de la capilla."
    },
    detalle: "Hb: 9.6 g/dL (Anemia Moderada) + Abuela a cargo sin ingresos fijos.",
    sede: "El Progreso (Carabayllo)"
  },
  {
    id: 102,
    menor: "Thiago Gael Flores Quispe",
    codigo: "PDI-2026-001",
    etapa: "evaluacion",
    urgencia: "Media",
    tipoProblematica: "Familiar",
    fechaDerivacion: "2026-04-08",
    quienDeriva: {
      nombre: "Prof. Delia Morales",
      cargo: "Promotora Educativa Casitas",
      telefono: "912-334-556"
    },
    situacionEncontrada: "Vivienda precaria con piso de tierra y hacinamiento severo (5 miembros en 1 habitación).",
    accionesPrevias: "Visita domiciliaria preliminar y llenado de Ficha Socioeconómica de 6 factores.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Padre trabaja de estibador eventual; madre apoya en el cuidado pero sin ingresos estables."
    },
    detalle: "Evaluación de vivienda y soporte de alimentos familiares.",
    sede: "Año Nuevo (Comas)"
  },
  {
    id: 103,
    menor: "Mateo Sebastian Castillo Ruiz",
    codigo: "PDI-2026-005",
    etapa: "canalizado",
    urgencia: "Alta",
    tipoProblematica: "Familiar",
    fechaDerivacion: "2026-03-28",
    quienDeriva: {
      nombre: "Lic. Carmen Vargas",
      cargo: "Trabajadora Social ASP",
      telefono: "945-667-889"
    },
    situacionEncontrada: "Presunto abandono económico y riesgo de vulneración de derechos alimentarios.",
    accionesPrevias: "Derivación con oficio oficial a DEMUNA Carabayllo y entrega de Canasta Alimentaria BTF.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Madre sola a cargo de 3 menores dependientes."
    },
    detalle: "Derivado a DEMUNA y asignada Bolsa de Alimentos BTF.",
    sede: "San Pedro (Carabayllo)"
  },
  {
    id: 104,
    menor: "Mia Valentina Mendoza Ramos",
    codigo: "PDI-2026-002",
    etapa: "cerrado",
    urgencia: "Baja",
    tipoProblematica: "Salud",
    fechaDerivacion: "2026-03-10",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Ingresó con anemia leve (Hb 10.8 g/dL).",
    accionesPrevias: "Cumplió tratamiento de hierro supervisado y sesiones de platos saludables.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Ambos padres comprometidos con la alimentación del hogar."
    },
    detalle: "Recuperada a Hb 11.6 g/dL con informe social final archivado.",
    sede: "La Libertad (Comas)"
  }
];

const CasoSocialModel = {
  _data: null,

  init() {
    const storage = window.PDI?.StorageService || StorageService;
    this._data = storage.getItem("pdi_mock_casos", defaultCasosSociales);
    return this._data;
  },

  getAll() {
    if (!this._data) this.init();
    return this._data;
  },

  getByStage(stage) {
    const list = this.getAll();
    return list.filter(c => c.etapa === stage);
  },

  updateStage(id, nuevaEtapa) {
    const list = this.getAll();
    const caso = list.find(c => c.id === Number(id));
    if (caso) {
      caso.etapa = nuevaEtapa;
      const storage = window.PDI?.StorageService || StorageService;
      storage.setItem("pdi_mock_casos", list);
      return caso;
    }
    return null;
  },

  add(nuevoCaso) {
    const list = this.getAll();
    list.unshift(nuevoCaso);
    const storage = window.PDI?.StorageService || StorageService;
    storage.setItem("pdi_mock_casos", list);
    return nuevoCaso;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.defaultCasosSociales = defaultCasosSociales;
  window.PDI.CasoSocialModel = CasoSocialModel;
}


/* --- Module: models/AuditModel.js --- */
// Modelo de Trazabilidad y Auditoría de Seguridad
const defaultAuditLogs = [
  {
    timestamp: "2026-09-13 17:30",
    user: "Carmen Mendoza",
    role: "Facilitadora",
    action: "Tamizaje CRED",
    entity: "PDI-2026-001",
    detail: "Registro Hb: 10.4 g/dL (Anemia Leve)",
    status: "Válido"
  },
  {
    timestamp: "2026-09-13 16:45",
    user: "Lic. Ruth Soto",
    role: "Trabajadora Social",
    action: "Derivación Caso",
    entity: "PDI-2026-003",
    detail: "Canalización a DEMUNA Carabayllo",
    status: "Activo"
  },
  {
    timestamp: "2026-09-13 15:20",
    user: "Rosa Flores",
    role: "Promotora",
    action: "Pase Asistencia",
    entity: "Sede Año Nuevo",
    detail: "Asistencia 18/20 niños",
    status: "Conforme"
  },
  {
    timestamp: "2026-09-13 14:10",
    user: "Dirección Gutenberg",
    role: "Coordinación",
    action: "Aprobación Padrón",
    entity: "Padrón 2026",
    detail: "Validación de 28 expedientes",
    status: "Aprobado"
  }
];

const AuditModel = {
  _logs: [...defaultAuditLogs],

  getAll() {
    return this._logs;
  },

  log(user, role, action, entity, detail, status = "Válido") {
    const now = new Date();
    const timestamp = now.getFullYear() + "-" + 
      String(now.getMonth() + 1).padStart(2, '0') + "-" + 
      String(now.getDate()).padStart(2, '0') + " " + 
      String(now.getHours()).padStart(2, '0') + ":" + 
      String(now.getMinutes()).padStart(2, '0');

    const entry = { timestamp, user, role, action, entity, detail, status };
    this._logs.unshift(entry);
    return entry;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.defaultAuditLogs = defaultAuditLogs;
  window.PDI.AuditModel = AuditModel;
}


/* --- Module: views/DashboardView.js --- */
// Vista: Tablero Principal Dashboard
const DashboardView = {
  render(stats, auditLogs) {
    const statEl = document.getElementById("statTotalNinos");
    if (statEl) statEl.textContent = stats.total;

    const pctNormalEl = document.getElementById("pctNormal");
    if (pctNormalEl) pctNormalEl.textContent = stats.pctNormal + "%";

    const pctLeveEl = document.getElementById("pctLeve");
    if (pctLeveEl) pctLeveEl.textContent = stats.pctLeve + "%";

    const pctModEl = document.getElementById("pctModerada");
    if (pctModEl) pctModEl.textContent = stats.pctMod + "%";

    const barNormal = document.getElementById("barNormal");
    if (barNormal) barNormal.style.width = stats.pctNormal + "%";

    const barLeve = document.getElementById("barLeve");
    if (barLeve) barLeve.style.width = stats.pctLeve + "%";

    const barMod = document.getElementById("barMod");
    if (barMod) barMod.style.width = stats.pctMod + "%";

    const comasEl = document.getElementById("comasProgress");
    if (comasEl) comasEl.style.width = (stats.total > 0 ? (stats.comasCount / stats.total) * 100 : 0) + "%";

    const carabaylloEl = document.getElementById("carabaylloProgress");
    if (carabaylloEl) carabaylloEl.style.width = (stats.total > 0 ? (stats.carabaylloCount / stats.total) * 100 : 0) + "%";

    
    const anemiaContainer = document.getElementById("dashAnemiaBars");
    if (anemiaContainer) {
      const C = 251.32;
      const sNormal = (stats.pctNormal / 100) * C;
      const sLeve = (stats.pctLeve / 100) * C;
      const sMod = (stats.pctMod / 100) * C;
      
      anemiaContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-around; gap: 20px; flex-wrap: wrap; padding: 6px 0;">
          <div style="position: relative; width: 140px; height: 140px; flex-shrink: 0;">
            <svg viewBox="0 0 100 100" width="140" height="140" style="transform: rotate(-90deg);">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border-subtle)" stroke-width="14" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-green)" stroke-width="14"
                stroke-dasharray="${sNormal} ${C}" stroke-dashoffset="0" stroke-linecap="round" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-yellow)" stroke-width="14"
                stroke-dasharray="${sLeve} ${C}" stroke-dashoffset="${-sNormal}" stroke-linecap="round" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-red)" stroke-width="14"
                stroke-dasharray="${sMod} ${C}" stroke-dashoffset="${-(sNormal + sLeve)}" stroke-linecap="round" />
            </svg>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none;">
              <span style="font-size: 20px; font-weight: 800; color: var(--text-main); font-family: var(--mono-font);">${stats.total}</span>
              <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Menores</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 170px;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-green); display: inline-block;"></span>
                <span>Normal (&ge; 11.0)</span>
              </div>
              <strong style="color: var(--gt-green); font-family: var(--mono-font);">${stats.normales} (${stats.pctNormal}%)</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-yellow); display: inline-block;"></span>
                <span>Anemia Leve</span>
              </div>
              <strong style="color: var(--gt-yellow); font-family: var(--mono-font);">${stats.leves} (${stats.pctLeve}%)</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-red); display: inline-block;"></span>
                <span>Anemia Mod/Sev</span>
              </div>
              <strong style="color: var(--gt-red); font-family: var(--mono-font);">${stats.moderadas} (${stats.pctMod}%)</strong>
            </div>
          </div>
        </div>
      `;
    }

    this.renderAuditLogs(auditLogs);
  },

  renderAuditLogs(logs) {
    const tbody = document.getElementById("tbodyAuditLogs");
    if (!tbody) return;

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td style="font-family:var(--mono-font); font-size:12px; color:var(--text-dim);">${l.timestamp}</td>
        <td><strong>${l.user}</strong><div style="font-size:11px; color:var(--text-muted);">${l.role}</div></td>
        <td><span class="badge badge-blue">${l.action}</span></td>
        <td><code style="font-family:var(--mono-font);">${l.entity}</code></td>
        <td style="font-size:12px;">${l.detail}</td>
        <td><span class="badge badge-green">${l.status}</span></td>
      </tr>
    `).join("");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}


/* --- Module: views/BeneficiariosView.js --- */
// Vista: Padrón de Menores Beneficiarios
const BeneficiariosView = {
  renderTable(beneficiarios) {
    const tbody = document.getElementById("tbodyBeneficiarios");
    if (!tbody) return;

    const badgeTotal = document.getElementById("badgeTotalBeneficiarios");
    if (badgeTotal) badgeTotal.textContent = beneficiarios.length;

    tbody.innerHTML = beneficiarios.map(b => `
      <tr>
        <td><strong style="font-family:var(--mono-font); color:var(--gt-green);">${b.codigo}</strong></td>
        <td><strong>${b.nombres} ${b.apellidos}</strong></td>
        <td>${b.dni}</td>
        <td>${b.edad} / ${b.sexo}</td>
        <td>${b.distrito}: ${b.sede}</td>
        <td>
          ${b.servicios.map(s => `<span class="badge badge-blue" style="margin-right:4px;">${s}</span>`).join("")}
        </td>
        <td><span class="badge badge-green">${b.estado}</span></td>
        <td style="text-align: right;">
          <button type="button" class="btn-action" onclick="window.openExpediente ? window.openExpediente(${b.id}) : window.app.beneficiarioController.openExpediente(${b.id})">
            Ver Expediente
          </button>
        </td>
      </tr>
    `).join("");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.BeneficiariosView = BeneficiariosView;
}


/* --- Module: views/SaludCredView.js --- */
// Vista: Módulo de Salud y Nutrición CRED
const SaludCredView = {
  renderTable(beneficiarios) {
    const tbody = document.getElementById("tbodySaludCred");
    if (!tbody) return;

    tbody.innerHTML = beneficiarios.map(b => {
      let badgeClass = "badge-green";
      if (b.anemia === "Leve") badgeClass = "badge-yellow";
      if (b.anemia === "Moderada" || b.anemia === "Severa") badgeClass = "badge-red";

      return `
        <tr>
          <td><strong>${b.nombres} ${b.apellidos}</strong><div style="font-size:11.5px; color:var(--text-dim);">${b.codigo}</div></td>
          <td>${b.edad}</td>
          <td>${b.peso} kg / ${b.talla} cm</td>
          <td><strong style="font-family:var(--mono-font);">${b.hb} g/dL</strong></td>
          <td><span class="badge ${badgeClass}">${b.anemia}</span></td>
          <td>${b.anemia !== "Normal" ? "Sulfato Ferroso 1 dosis/día" : "Dieta Preventiva"}</td>
          <td><button type="button" class="btn-action" onclick="window.app.beneficiarioController.openExpediente(${b.id})">Detalle</button></td>
        </tr>
      `;
    }).join("");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SaludCredView = SaludCredView;
}


/* --- Module: views/ModalView.js --- */

    // Generadores de Avatares Biométricos SVG para Niños y Adultos Autorizados
    function getChildAvatarSvg(sex, name) {
      const isFemale = (sex === 'F');
      const bgColor = isFemale ? "#2a152f" : "#002b23";
      const accent = isFemale ? "#d946ef" : "#00b494";
      const skin = isFemale ? "#f0b88c" : "#e5a676";
      const hair = "#1e1b18";

      if (!isFemale) {
        return `<svg viewBox="0 0 120 120" width="100%" height="100%">
          <rect width="120" height="120" rx="10" fill="${bgColor}"/>
          <circle cx="60" cy="52" r="26" fill="${skin}"/>
          <path d="M34 46 C34 30, 44 22, 60 22 C76 22, 86 30, 86 46 C80 40, 72 38, 60 38 C48 38, 40 40, 34 46 Z" fill="${hair}"/>
          <ellipse cx="50" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <ellipse cx="70" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <path d="M52 62 Q60 69 68 62" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M52 76 L68 76 L72 88 L48 88 Z" fill="${skin}"/>
          <path d="M30 120 C30 92, 45 84, 60 84 C75 84, 90 92, 90 120 Z" fill="${accent}"/>
          <polygon points="60,84 52,98 68,98" fill="#ffffff" opacity="0.9"/>
        </svg>`;
      } else {
        return `<svg viewBox="0 0 120 120" width="100%" height="100%">
          <rect width="120" height="120" rx="10" fill="${bgColor}"/>
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
    }

    function getAdultAvatarSvg(parentesco, name) {
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
      } else {
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
    }

// Vista: Modales (Expediente Integral, Registro Nuevo Menor, Informe Ejecutivo)
// Muestra el 100% de los datos de todas las fichas oficiales del PDI
const ModalView = {
  openExpediente(b, caso) {
    if (!b) return;

        ModalView._currentId = b.id;
    ModalView.isEditing = false;

    const editBtn = document.getElementById("btnToggleEditExp");
    const saveBtn = document.getElementById("btnSaveExpChanges");
    const delBtn = document.getElementById("btnDeleteBeneficiario");
    if (editBtn) editBtn.style.display = "inline-flex";
    if (saveBtn) saveBtn.style.display = "none";

    const roleSel = document.getElementById("roleSelector");
    const activeRole = roleSel ? roleSel.value : "coord";
    if (delBtn) delBtn.style.display = (activeRole === "coord" || activeRole === "admin") ? "inline-flex" : "none";

    // Setup tab listeners inside modalExpediente
    const modalEl = document.getElementById("modalExpediente");
    if (modalEl) {
      modalEl.querySelectorAll(".modal-tab-btn").forEach(tab => {
        tab.onclick = () => {
          modalEl.querySelectorAll(".modal-tab-btn").forEach(t => t.classList.remove("active"));
          modalEl.querySelectorAll(".modal-tab-pane").forEach(p => p.style.display = "none");
          tab.classList.add("active");
          const target = modalEl.querySelector("#" + tab.dataset.tab);
          if (target) target.style.display = "block";
        };
      });
    }

    // Cabecera Principal
    const titleEl = document.getElementById("modalExpedienteTitle");
    if (titleEl) {
      titleEl.textContent = `Expediente Integral: ${b.nombres} ${b.apellidos} (${b.codigo})`;
    }

    // Helper para asignar valor o contenido con seguridad
    const setSafe = (id, val) => {
      const el = document.getElementById(id);
      if (el) {
        if ('value' in el && el.tagName === 'INPUT') el.value = val || '-';
        else el.textContent = val || '-';
      }
    };

    // Renderizado de Foto / Carnet del Menor en Identidad
    const childPhotoFrame = document.getElementById("expChildPhotoFrame");
    if (childPhotoFrame) {
      if (b.fotoUrl) {
        childPhotoFrame.innerHTML = `<img src="${b.fotoUrl}" alt="Foto de ${b.nombres}">`;
      } else {
        childPhotoFrame.innerHTML = getChildAvatarSvg(b.sexo, b.nombres);
      }
    }

    const photoName = document.getElementById("expPhotoName");
    if (photoName) photoName.textContent = `${b.nombres} ${b.apellidos}`;

    const photoCode = document.getElementById("expPhotoCode");
    if (photoCode) photoCode.textContent = b.codigo;

    const photoMeta = document.getElementById("expPhotoMeta");
    if (photoMeta) photoMeta.textContent = `${b.edad} • ${b.sexo === 'M' ? 'Masculino' : 'Femenino'} • Sede ${b.sede}`;

    // Listener para subir foto personalizada
    const photoInput = document.getElementById("childPhotoInput");
    if (photoInput) {
      photoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            b.fotoUrl = re.target.result;
            if (childPhotoFrame) {
              childPhotoFrame.innerHTML = `<img src="${b.fotoUrl}" alt="Foto de ${b.nombres}">`;
            }
          };
          reader.readAsDataURL(file);
        }
      };
    }

    // 1. Identidad y Filiación
    setSafe("expCodigo", b.codigo);
    setSafe("expNombres", b.nombres);
    setSafe("expApellidos", b.apellidos);
    setSafe("expDni", b.dni);
    setSafe("expFechaNac", b.fechaNacimiento || "No registrada");
    setSafe("expEdad", `${b.edad} (${b.sexo === 'M' ? 'Masculino' : 'Femenino'})`);
    setSafe("expEdadSexo", `${b.edad} / ${b.sexo}`);
    setSafe("expSexo", b.sexo === 'M' ? 'Masculino' : 'Femenino');
    setSafe("expDireccion", b.direccion || "Mz. 4W Lt. 30, Comité 12");
    setSafe("expReferencia", b.referencia || "Sin referencia adicional");
    setSafe("expDistritoSede", `${b.distrito} - Sede ${b.sede}`);
    setSafe("expSede", `${b.distrito} - Sede ${b.sede}`);
    setSafe("expModalidadEstrategia", `${b.modalidad || 'Comunitaria'} | ${b.estrategia || (b.servicios ? b.servicios.join(' + ') : 'Desayuno Infantil')}`);
    setSafe("expExoneracion", b.exoneracionAporte || "100% (Exonerado Vulnerabilidad Extrema)");

    // 2. Salud Base y CRED
    setSafe("expSeguro", b.seguro || "SIS Gratuito");
    setSafe("expCentroSalud", b.centroSalud || `C.S. ${b.sede}`);
    setSafe("expAlergias", b.alergias || "Ninguna");
    setSafe("expPesoTalla", `${b.peso || 14.5} kg / ${b.talla || 96.0} cm`);
    setSafe("expHb", `${b.hb || 11.0} g/dL (${b.anemia || 'Normal'})`);
    setSafe("expCanasta", b.canastaEntregada ? "Entregada (Canasta Nutricional)" : "No requerida");
    setSafe("expOrientacion", b.orientacionFamiliar ? "Completada con Cuidador" : "En programación");

    // 3. Escolaridad y Casitas
    setSafe("expNivelEducativo", b.nivelEducativo || (b.grado && b.grado.includes('Prim') ? 'Primaria' : 'Inicial'));
    setSafe("expGrado", b.grado || "Inicial");
    setSafe("expColegio", b.colegio || "I.E. Local de la Zona");
    setSafe("expAsistencia", "94.2% de Asistencia (Sede Regular)");
    setSafe("expKits", "Kit Escolar Faber-Castell Entregado");

    // 4. Entorno Familiar y Retiro Seguro
    setSafe("expApoderado", `${b.apoderado} (${b.parentesco || 'Madre'}) - DNI ${b.apoderadoDni || '-'}`);
    setSafe("expApoderadoNombre", b.apoderado);
    setSafe("expApoderadoParentesco", b.parentesco || "Madre");
    setSafe("expApoderadoDni", b.apoderadoDni || "En validación");
    setSafe("expTelefono", b.telefono || "-");
    setSafe("expApoderadoTel", b.telefono || "-");
    setSafe("expTelefonoAlt", b.telefonoAlt || "No registrado");
    setSafe("expRetiro", b.retiroAutorizado || `${b.apoderado} (Apoderado Principal)`);

    // Padrón Anexo 2: Personas autorizadas de retiro con Fotografía
    const retiroPadronContainer = document.getElementById("expRetiroPadronContainer");
    if (retiroPadronContainer) {
      const lista = (b.retiroPadron && b.retiroPadron.length > 0)
        ? b.retiroPadron
        : [{ nombre: b.apoderado, dni: b.apoderadoDni || '41982341', parentesco: b.parentesco || 'Madre', telefono: b.telefono }];
      
      retiroPadronContainer.innerHTML = lista.map((p, idx) => {
        const avatarSvg = getAdultAvatarSvg(p.parentesco, p.nombre);
        return `
          <div class="retiro-person-card">
            <div class="retiro-person-photo">
              ${p.fotoUrl ? `<img src="${p.fotoUrl}" alt="${p.nombre}">` : avatarSvg}
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
              <div style="margin-top:6px; display:flex; align-items:center; justify-content:space-between;">
                <span class="badge badge-green" style="font-size:10px; padding:2px 6px;">Acreditado Anexo 2</span>
                <span style="font-size:10.5px; color:var(--gt-green); font-weight:700;"></span>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    // 5. Consentimiento Informado Ley N.° 29733 (Ficha A3)
    const consentContainer = document.getElementById("expConsentimientoChecksContainer");
    if (consentContainer) {
      consentContainer.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
          <div style="background:var(--surface-hover); padding:10px; border-radius:6px; border:1px solid var(--gt-green-border);">
            <div style="color:var(--gt-green); font-weight:700; font-size:12px;">[AUTORIZADO] Evaluación Social</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Elaboración de historias de vida y seguimiento del impacto (Art. 13 num 5 y 6).</div>
          </div>
          <div style="background:var(--surface-hover); padding:10px; border-radius:6px; border:1px solid var(--gt-green-border);">
            <div style="color:var(--gt-green); font-weight:700; font-size:12px;">[AUTORIZADO] Fotografías y Videos</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Difusión institucional y rendición de cuentas en plataformas oficiales (Art. 13 num 5).</div>
          </div>
          <div style="background:var(--surface-hover); padding:10px; border-radius:6px; border:1px solid var(--gt-green-border);">
            <div style="color:var(--gt-green); font-weight:700; font-size:12px;">[AUTORIZADO] Gestión de Donaciones</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Recaudación de fondos y reportes institucionales de sostenibilidad (Art. 13 num 5 y 6).</div>
          </div>
          <div style="background:var(--surface-hover); padding:10px; border-radius:6px; border:1px solid var(--gt-green-border);">
            <div style="color:var(--gt-green); font-weight:700; font-size:12px;">[AUTORIZADO] Flujo Transfronterizo</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Transferencia a cooperante Kinderwerk Lima e.V. (Alemania) con garantías de seguridad.</div>
          </div>
        </div>
        <div style="border:1.5px dashed var(--gt-green); border-radius:8px; padding:12px; text-align:center; background:rgba(0,180,148,0.06); color:var(--gt-green); font-size:12.5px; font-weight:700;">
          Consentimiento Informado Firmado Digitalmente &bull; Titular: ${b.apoderado} (DNI ${b.apoderadoDni || '41982341'}) &bull; Ley N.° 29733 / D.S. N.° 016-2024-JUS
        </div>
      `;
    }

    // 6. Área Social Pastoral ASP y Scoring de Vulnerabilidad
    setSafe("expVulnerabilidad", `${b.vulnerabilidad || 60}/100`);
    const socialDiv = document.getElementById("expCasoSocialDetail");
    if (socialDiv) {
      if (caso) {
        socialDiv.innerHTML = `
          <div style="background:var(--surface-hover); padding:14px; border-radius:var(--radius-sm); border-left:3px solid var(--gt-yellow);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div>
                <strong style="font-size:13px; color:var(--gt-yellow);">Derivación Activa: Problemática ${caso.tipoProblematica ? caso.tipoProblematica.toUpperCase() : 'SOCIAL'}</strong>
                <div style="font-size:11.5px; color:var(--text-dim);">Derivado por: ${caso.quienDeriva ? caso.quienDeriva.nombre + ' (' + caso.quienDeriva.cargo + ')' : 'Personal Operativo'} &bull; Tel: ${caso.quienDeriva ? caso.quienDeriva.telefono : '-'}</div>
              </div>
              <span class="badge badge-${caso.urgencia === 'Alta' ? 'red' : 'yellow'}">Urgencia: ${caso.urgencia}</span>
            </div>
            <div style="font-size:12.5px; color:var(--text-main); margin-bottom:6px;"><strong>Situación Encontrada:</strong> ${caso.situacionEncontrada || caso.detalle}</div>
            <div style="font-size:12px; color:var(--text-dim); margin-bottom:4px;"><strong>Acciones Realizadas:</strong> ${caso.accionesPrevias || 'Seguimiento domiciliario programado.'}</div>
            <div style="font-size:12px; color:var(--text-dim);"><strong>Soporte Familiar:</strong> ${caso.soporteFamiliar ? (caso.soporteFamiliar.tiene ? 'Sí cuenta con soporte familiar' : 'No cuenta con soporte: ' + caso.soporteFamiliar.detalle) : 'En evaluación'}</div>
          </div>
        `;
      } else {
        socialDiv.innerHTML = `
          <div style="background:var(--surface-hover); padding:12px; border-radius:var(--radius-sm); font-size:12px; color:var(--text-muted);">
            El menor no registra derivaciones activas a DEMUNA ni alertas de vulnerabilidad extrema. Monitoreo regular activo.
          </div>
        `;
      }
    }

    // Abrir modal y posicionar primera pestaña
    const modal = document.getElementById("modalExpediente");
    if (modal) {
      modal.classList.add("open");
      const firstTabBtn = modal.querySelector(".modal-tab-btn");
      if (firstTabBtn) firstTabBtn.click();
    }
  },

  
    toggleEdit() {
    this.isEditing = !this.isEditing;
    const editBtn = document.getElementById("btnToggleEditExp");
    const saveBtn = document.getElementById("btnSaveExpChanges");
    const editBadge = document.getElementById("expEditingBadge");

    const editableInputs = [
      "expNombres", "expApellidos", "expDni", "expFechaNac", "expEdad",
      "expDireccion", "expReferencia", "expDistritoSede", "expModalidadEstrategia",
      "expExoneracion", "expSeguro", "expCentroSalud", "expAlergias", "expGrado",
      "expColegio", "expApoderadoNombre", "expApoderadoParentesco", "expApoderadoDni",
      "expApoderadoTel", "expTelefonoAlt", "expPesoTalla", "expHb"
    ];

    editableInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.readOnly = !this.isEditing;
        if (this.isEditing) {
          el.removeAttribute("readonly");
          el.style.borderColor = "var(--gt-green)";
          el.style.background = "#ffffff";
          el.style.boxShadow = "0 0 0 3px rgba(0, 180, 148, 0.15)";
          el.style.cursor = "text";
        } else {
          el.setAttribute("readonly", "true");
          el.style.borderColor = "var(--border-subtle)";
          el.style.background = "var(--surface-2)";
          el.style.boxShadow = "none";
          el.style.cursor = "default";
        }
      }
    });

    if (this.isEditing) {
      if (editBtn) {
        editBtn.classList.add("danger");
        editBtn.innerHTML = `
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          <span>Cancelar Edición</span>
        `;
      }
      if (saveBtn) saveBtn.style.display = "inline-flex";
      if (editBadge) editBadge.style.display = "inline-flex";
      const tView = window.PDI?.ToastView;
      if (tView) tView.show("Modo Edición Activado", "Los campos son editables. Modifique los datos y presione Guardar Cambios.", "info");
    } else {
      if (editBtn) {
        editBtn.classList.remove("danger");
        editBtn.innerHTML = `
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
          <span>Editar Datos</span>
        `;
      }
      if (saveBtn) saveBtn.style.display = "none";
      if (editBadge) editBadge.style.display = "none";
    }
  },

  saveChanges() {
    const id = this._currentId;
    const bModel = window.PDI?.BeneficiarioModel;
    const aModel = window.PDI?.AuditModel;
    const b = bModel ? bModel.getById(id) : null;
    if (!b) return;

    const getVal = (id) => document.getElementById(id)?.value?.trim() || "";

    b.nombres = getVal("expNombres") || b.nombres;
    b.apellidos = getVal("expApellidos") || b.apellidos;
    b.dni = getVal("expDni") || b.dni;
    b.direccion = getVal("expDireccion") || b.direccion;
    b.referencia = getVal("expReferencia") || b.referencia;
    b.seguro = getVal("expSeguro") || b.seguro;
    b.centroSalud = getVal("expCentroSalud") || b.centroSalud;
    b.alergias = getVal("expAlergias") || b.alergias;
    b.grado = getVal("expGrado") || b.grado;
    b.colegio = getVal("expColegio") || b.colegio;
    b.apoderado = getVal("expApoderadoNombre") || b.apoderado;
    b.parentesco = getVal("expApoderadoParentesco") || b.parentesco;
    b.apoderadoDni = getVal("expApoderadoDni") || b.apoderadoDni;
    b.telefono = getVal("expApoderadoTel") || b.telefono;
    b.telefonoAlt = getVal("expTelefonoAlt") || b.telefonoAlt;

    bModel.update(id, b);

    // Auditoría
    const roleBanner = document.getElementById("roleBannerTitle")?.textContent || "Coordinador General";
    if (aModel && aModel.addLog) {
      aModel.addLog({
        user: roleBanner,
        role: "Dirección",
        action: "Edición de Expediente",
        entity: b.codigo,
        detail: `Actualización de datos del menor ${b.nombres} ${b.apellidos} en el padrón`,
        status: "Auditado"
      });
    }

    if (window.app && window.app.refreshAllViews) {
      window.app.refreshAllViews();
    } else {
      const bView = window.PDI?.BeneficiariosView;
      if (bView) bView.renderTable(bModel.getAll());
    }

    this.toggleEdit();
    const titleEl = document.getElementById("modalExpedienteTitle");
    if (titleEl) titleEl.textContent = `Expediente Integral: ${b.nombres} ${b.apellidos} (${b.codigo})`;
    const photoName = document.getElementById("expPhotoName");
    if (photoName) photoName.textContent = `${b.nombres} ${b.apellidos}`;

    const tView = window.PDI?.ToastView;
    if (tView) tView.show("Expediente Actualizado", `Los cambios en ${b.nombres} ${b.apellidos} se guardaron y auditaron correctamente.`, "success");
  },

  deleteBeneficiario() {
    const roleSel = document.getElementById("roleSelector");
    const currentRole = roleSel ? roleSel.value : "coord";
    if (currentRole !== "coord" && currentRole !== "admin") {
      const tView = window.PDI?.ToastView;
      if (tView) tView.show("Acción Restringida", "Únicamente el Coordinador General o Administrador TI pueden dar de baja a un menor.", "danger");
      return;
    }

    const id = this._currentId;
    const bModel = window.PDI?.BeneficiarioModel;
    const aModel = window.PDI?.AuditModel;
    const b = bModel ? bModel.getById(id) : null;
    if (!b) return;

    if (!confirm(`¿Está seguro de eliminar definitivamente al menor ${b.nombres} ${b.apellidos} (${b.codigo})?\n\nEsta acción retirará al menor del Padrón Único y de todos los servicios. Se registrará en la auditoría del sistema.`)) {
      return;
    }

    bModel.delete(id);

    const roleBanner = document.getElementById("roleBannerTitle")?.textContent || "Coordinador General";
    if (aModel && aModel.addLog) {
      aModel.addLog({
        user: roleBanner,
        role: "Dirección / Admin",
        action: "Baja de Beneficiario",
        entity: b.codigo,
        detail: `Baja definitiva del menor ${b.nombres} ${b.apellidos} autorizada por rol directivo`,
        status: "Ejecutado"
      });
    }

    if (window.app && window.app.refreshAllViews) {
      window.app.refreshAllViews();
    } else {
      const bView = window.PDI?.BeneficiariosView;
      if (bView) bView.renderTable(bModel.getAll());
    }

    this.closeExpediente();
    const tView = window.PDI?.ToastView;
    if (tView) tView.show("Baja Ejecutada", `El menor ${b.nombres} fue retirado del sistema y la acción quedó auditada.`, "warning");
  },

  closeExpediente() {
    const modal = document.getElementById("modalExpediente");
    if (modal) modal.classList.remove("open");
  },

  openNuevoMenor() {
    const modal = document.getElementById("modalNuevoMenor");
    if (modal) {
      modal.classList.add("open");
      setTimeout(() => {
        const ctrl = window.PDI?.BeneficiarioController || (window.app && window.app.beneficiarioController);
        if (ctrl && ctrl.initSignature) ctrl.initSignature();
      }, 100);
    }
  },

  closeNuevoMenor() {
    const modal = document.getElementById("modalNuevoMenor");
    if (modal) modal.classList.remove("open");
  },

  openInforme(stats, activeRole) {
    const fecha = new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
    const fechaEl = document.getElementById("informeFecha");
    if (fechaEl) fechaEl.textContent = fecha;

    const opEl = document.getElementById("informeOperador");
    if (opEl) opEl.textContent = `${activeRole.title} (${activeRole.desc.split(' ')[0]})`;

    const totalEl = document.getElementById("infTotalMenores");
    if (totalEl) totalEl.textContent = stats.total;

    const normEl = document.getElementById("infNormales");
    if (normEl) normEl.textContent = `${stats.normales} (${stats.pctNormal}%)`;

    const anEl = document.getElementById("infAnemia");
    if (anEl) anEl.textContent = `${stats.leves + stats.moderadas} (${stats.pctLeve + stats.pctMod}%)`;

    const modal = document.getElementById("modalInformeEjecutivo") || document.getElementById("modalInforme");
    if (modal) modal.classList.add("open");
  },

  closeInforme() {
    const modal = document.getElementById("modalInformeEjecutivo") || document.getElementById("modalInforme");
    if (modal) modal.classList.remove("open");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ModalView = ModalView;
}


/* --- Module: controllers/BeneficiarioController.js --- */
// Controlador: Gestión de Menores Beneficiarios y Expediente
// Maneja el 100% de los campos normativos de inscripción PDI

const BeneficiarioController = {
  signatureCanvasHelper: null,

  initSignature() {
    this.signatureCanvasHelper = CanvasHelper.init("canvasSignature");
  },

  clearSignature() {
    if (this.signatureCanvasHelper) {
      this.signatureCanvasHelper.clear();
    }
  },

  search(query) {
    const model = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const view = window.PDI?.BeneficiariosView || BeneficiariosView;
    const filtered = model.search(query);
    view.renderTable(filtered);
  },

  openExpediente(id) {
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const cModel = window.PDI?.CasoSocialModel || CasoSocialModel;
    const mView = window.PDI?.ModalView || ModalView;

    const menor = bModel.getById(id);
    if (!menor) return;

    const casos = cModel.getAll();
    const caso = casos.find(c => c.codigo === menor.codigo);

    mView.openExpediente(menor, caso);
  },

  saveNuevoMenor(event, onComplete) {
    event.preventDefault();

    const getVal = (id, fallback = "") => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : fallback;
    };

    const getChecked = (id) => {
      const el = document.getElementById(id);
      return el ? el.checked : true;
    };

    const nombres = getVal("regNombres");
    const apellidos = getVal("regApellidos");
    const dni = getVal("regDni");
    const fechaNacimiento = getVal("regFechaNacimiento");
    const edad = getVal("regEdad");
    const sexo = getVal("regSexo", "M");
    const direccion = getVal("regDireccion");
    const referencia = getVal("regReferencia");

    const distritoSedeVal = getVal("regDistritoSede") || getVal("regDistrito");
    const distSedeParts = distritoSedeVal.includes(" - ") ? distritoSedeVal.split(" - ") : distritoSedeVal.split(": ");
    const distrito = distSedeParts[0] || "Comas";
    const sede = distSedeParts[1] || "Año Nuevo";

    const modalidad = getVal("regModalidad", "Comunitaria");
    const estrategia = getVal("regEstrategia", "Desayuno Infantil");
    const exoneracionAporte = getVal("regExoneracion", "100% (Exonerado Vulnerabilidad Extrema)");

    const seguro = getVal("regSeguro", "SIS Gratuito");
    const centroSalud = getVal("regCentroSalud", `C.S. ${sede}`);
    const alergias = getVal("regAlergias", "Ninguna");
    const nivelEducativo = getVal("regNivelEducativo", "Inicial");
    const grado = getVal("regGrado", "Inicial 4 años");
    const colegio = getVal("regColegio", "I.E. Local");

    const apoderado = getVal("regApoderado");
    const apoderadoDni = getVal("regApoderadoDni");
    const parentesco = getVal("regParentesco", "Madre");
    const telefono = getVal("regTelefono");
    const telefonoAlt = getVal("regTelefonoAlt");

    const acomp1 = getVal("regRetiroAcomp1");
    const acomp2 = getVal("regRetiroAcomp2");

    const consentimientos = {
      evaluacionSocial: getChecked("checkHistorialVida"),
      usoFotografia: getChecked("checkFotoVideo"),
      gestionDonaciones: getChecked("checkDonaciones"),
      flujoTransfronterizo: getChecked("checkTransfronterizo")
    };

    const toast = window.PDI?.ToastView || ToastView;

    // Validación de firma digital (Ley 29733)
    if (this.signatureCanvasHelper && !this.signatureCanvasHelper.hasSignature()) {
      toast.show("Firma Obligatoria", "El apoderado debe estampar su firma digital en el recuadro para validar el Consentimiento Ley N.° 29733.", "warning");
      return;
    }

    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const list = bModel.getAll();
    const newId = list.length + 1;
    const correlativo = `PDI-2026-${String(newId).padStart(3, "0")}`;

    const padronRetiro = [];
    if (acomp1) {
      padronRetiro.push({ nombre: acomp1, dni: apoderadoDni, parentesco: parentesco, telefono: telefono });
    } else {
      padronRetiro.push({ nombre: apoderado, dni: apoderadoDni, parentesco: parentesco, telefono: telefono });
    }
    if (acomp2) {
      padronRetiro.push({ nombre: acomp2, dni: "Por validar", parentesco: "Familiar", telefono: telefonoAlt || "-" });
    }

    const nuevoObj = {
      id: newId,
      codigo: correlativo,
      nombres,
      apellidos,
      dni,
      fechaNacimiento: fechaNacimiento || "2022-01-01",
      edad: edad || "4 años",
      sexo,
      direccion: direccion || "Sector Local PDI",
      referencia: referencia || "-",
      distrito,
      sede,
      modalidad,
      estrategia,
      exoneracionAporte,
      servicios: estrategia.includes("Mixto") ? ["Desayuno Infantil", "Casita del Saber"] : [estrategia],
      seguro,
      centroSalud,
      alergias,
      nivelEducativo,
      grado,
      colegio,
      apoderado,
      parentesco,
      apoderadoDni,
      telefono,
      telefonoAlt: telefonoAlt || "-",
      estado: "Activo",
      hb: 11.2,
      peso: 15.0,
      talla: 98.0,
      anemia: "Normal",
      canastaEntregada: exoneracionAporte.includes("100%"),
      orientacionFamiliar: true,
      retiroAutorizado: acomp1 ? acomp1 : `${apoderado} (${parentesco})`,
      retiroPadron: padronRetiro,
      consentimientos,
      firmaDigital: true,
      vulnerabilidad: exoneracionAporte.includes("100%") ? 82 : 55
    };

    bModel.add(nuevoObj);

    // Registro en Log de Auditoría Inviolable
    const audit = window.PDI?.AuditModel || AuditModel;
    if (audit) {
      audit.log(
        "Usuario Activo",
        "Coordinación",
        "Inscripción Menor",
        nuevoObj.codigo,
        `Alta integral con Ficha A1/A3 Ley 29733: ${nombres} ${apellidos} (DNI ${dni})`,
        "Válido"
      );
    }

    toast.show("Beneficiario Incorporado", `${nombres} ${apellidos} registrado exitosamente con código ${nuevoObj.codigo}`, "success");

    const mView = window.PDI?.ModalView || ModalView;
    mView.closeNuevoMenor();
    const form = document.getElementById("formNuevoMenor");
    if (form) form.reset();
    this.clearSignature();

    if (onComplete) onComplete();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.BeneficiarioController = BeneficiarioController;
}


/* --- Module: controllers/SocialController.js --- */
// Controlador: Tablero Kanban y Evaluación de Vulnerabilidad ASP

const SocialController = {
  moverCaso(id, nuevaEtapa) {
    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const caso = model.updateStage(id, nuevaEtapa);
    if (!caso) return;

    const audit = window.PDI?.AuditModel || AuditModel;
    audit.log(
      "Lic. Ruth Soto",
      "Trabajadora Social",
      "Transición Kanban",
      caso.codigo,
      `Caso de ${caso.menor} trasladado a etapa: ${nuevaEtapa.toUpperCase()}`,
      "Activo"
    );

    const toast = window.PDI?.ToastView || ToastView;
    toast.show("Tablero Kanban Actualizado", `Caso ${caso.codigo} ahora en etapa: ${nuevaEtapa}`, "success");

    const view = window.PDI?.SocialKanbanView || SocialKanbanView;
    view.renderKanban(model.getAll());
  },

  handleVulnerabilidadChange() {
    const factors = {
      ing: document.getElementById("valIngreso")?.value || 70,
      viv: document.getElementById("valVivienda")?.value || 80,
      emp: document.getElementById("valEmpleo")?.value || 60,
      ins: document.getElementById("valInseguridad")?.value || 85,
      sal: document.getElementById("valSalud")?.value || 75,
      sop: document.getElementById("valSoporte")?.value || 90
    };

    const calc = window.PDI?.VulnerabilityCalculator || VulnerabilityCalculator;
    const res = calc.calculate(factors);

    const scoreEl = document.getElementById("scoreVulnerabilidad");
    const badgeEl = document.getElementById("badgeNivelVulnerabilidad");
    const accionEl = document.getElementById("accionVulnerabilidad");

    if (scoreEl) scoreEl.textContent = `${res.total}/100`;

    if (badgeEl) {
      badgeEl.textContent = res.category;
      badgeEl.className = `badge ${res.badgeClass}`;
    }

    if (accionEl) {
      accionEl.textContent = res.accion;
      accionEl.style.color = res.color;
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialController = SocialController;
}


/* --- Module: controllers/AppController.js --- */
// Controlador Principal: Enrutador de Vistas, Temas y Ciclo de Vida

const AppController = {
  roleController: RoleController,
  beneficiarioController: BeneficiarioController,
  saludController: SaludController,
  socialController: SocialController,
  casitasController: CasitasController,

  init() {
    // 1. Inicializar modelos
    BeneficiarioModel.init();
    CasoSocialModel.init();

    // 2. Inicializar componentes de vista
    this.refreshAllViews();

    // 3. Inicializar firma digital
    BeneficiarioController.initSignature();

    // 4. Configurar escuchadores de navegación
    this.bindNavigation();

    // 5. Configurar selector de rol
    this.bindRoleSelector();

    // 6. Configurar búsqueda contextual en tiempo real
    this.bindSearch();

    // 7. Configurar tabs en modales
    this.bindModalTabs();

    // 8. Inicializar valores de calculadoras
    SaludController.handleHbChange(10.4);
    SocialController.handleVulnerabilidadChange();

    // 9. Estado inicial de la barra de búsqueda (en Dashboard se oculta)
    this.updateSearchVisibility("view-dashboard");

    console.log('Sistema "PDI" MVC inicializado correctamente.');
  },

  refreshAllViews() {
    const stats = BeneficiarioModel.getStats();
    const auditLogs = AuditModel.getAll();
    const beneficiarios = BeneficiarioModel.getAll();
    const casos = CasoSocialModel.getAll();

    DashboardView.render(stats, auditLogs);
    BeneficiariosView.renderTable(beneficiarios);
    SaludCredView.renderTable(beneficiarios);
    CasitasView.renderTable(beneficiarios);
    SocialKanbanView.renderKanban(casos);
  },

  navigateToView(viewId) {
    const navButtons = document.querySelectorAll(".nav-btn");
    const appViews = document.querySelectorAll(".content-view, .app-view");

    navButtons.forEach(b => b.classList.remove("active"));
    appViews.forEach(v => v.classList.remove("active"));

    const targetBtn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
    if (targetBtn) targetBtn.classList.add("active");

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add("active");

    const mainContent = document.getElementById("mainContent");
    if (mainContent) mainContent.scrollTop = 0;

    // Control de visibilidad de la barra de búsqueda: solo en módulos con tablas
    this.updateSearchVisibility(viewId);
  },

  updateSearchVisibility(viewId) {
    const searchWrap = document.querySelector(".search-wrap");
    const searchInput = document.getElementById("globalSearchInput");
    if (!searchWrap) return;

    // Módulos con tablas y sus placeholders específicos
    const viewsConTablas = {
      "view-beneficiarios": "Buscar en padrón por DNI, nombres o sede...",
      "view-salud": "Buscar en tamizaje CRED por DNI, menor o sede...",
      "view-educativo": "Buscar en asistencia Casitas por menor o grado...",
      "view-auditoria": "Buscar en auditoría por acción, usuario o entidad..."
    };

    if (viewsConTablas[viewId]) {
      searchWrap.classList.remove("search-hidden");
      searchWrap.style.removeProperty("display");
      searchWrap.style.display = "flex";
      if (searchInput) {
        searchInput.placeholder = viewsConTablas[viewId];
        searchInput.disabled = false;
        // Si hay una búsqueda previa, aplicarla al módulo actual
        if (searchInput.value.trim() !== "") {
          this.executeFilter(searchInput.value, viewId);
        }
      }
    } else {
      // Módulos sin tablas (Dashboard, Social ASP, Sedes): Ocultar barra de búsqueda
      searchWrap.classList.add("search-hidden");
      searchWrap.style.display = "none";
      if (searchInput) {
        searchInput.disabled = true;
        searchInput.value = "";
      }
    }
  },

  executeFilter(query, viewId) {
    const q = query.toLowerCase().trim();
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const allBeneficiarios = bModel.getAll();

    if (viewId === "view-beneficiarios") {
      const filtered = q === "" ? allBeneficiarios : allBeneficiarios.filter(b =>
        b.nombres.toLowerCase().includes(q) ||
        b.apellidos.toLowerCase().includes(q) ||
        b.codigo.toLowerCase().includes(q) ||
        b.dni.includes(q) ||
        b.distrito.toLowerCase().includes(q) ||
        b.sede.toLowerCase().includes(q)
      );
      BeneficiariosView.renderTable(filtered);
    } else if (viewId === "view-salud") {
      const filtered = q === "" ? allBeneficiarios : allBeneficiarios.filter(b =>
        b.nombres.toLowerCase().includes(q) ||
        b.apellidos.toLowerCase().includes(q) ||
        b.dni.includes(q) ||
        b.sede.toLowerCase().includes(q) ||
        (b.anemia && b.anemia.toLowerCase().includes(q))
      );
      SaludCredView.renderTable(filtered);
    } else if (viewId === "view-educativo") {
      const filtered = q === "" ? allBeneficiarios : allBeneficiarios.filter(b =>
        b.nombres.toLowerCase().includes(q) ||
        b.apellidos.toLowerCase().includes(q) ||
        (b.grado && b.grado.toLowerCase().includes(q)) ||
        (b.colegio && b.colegio.toLowerCase().includes(q)) ||
        b.sede.toLowerCase().includes(q)
      );
      CasitasView.renderTable(filtered);
    } else if (viewId === "view-auditoria") {
      const audit = window.PDI?.AuditModel || AuditModel;
      const logs = audit.getAll();
      const filtered = q === "" ? logs : logs.filter(l =>
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.user && l.user.toLowerCase().includes(q)) ||
        (l.entity && l.entity.toLowerCase().includes(q)) ||
        (l.detail && l.detail.toLowerCase().includes(q))
      );
      // Re-render audit table if container exists
      const auditTbody = document.getElementById("auditTableBody");
      if (auditTbody) {
        auditTbody.innerHTML = filtered.map(log => `
          <tr>
            <td style="font-family:var(--mono-font); font-size:12px; color:var(--text-dim);">${log.timestamp}</td>
            <td><strong>${log.user}</strong> <span style="font-size:11px; color:var(--text-dim);">(${log.role})</span></td>
            <td><span class="badge badge-blue">${log.action}</span></td>
            <td style="font-family:var(--mono-font); font-size:12px; color:var(--gt-green);">${log.entity}</td>
            <td style="font-size:12.5px;">${log.detail}</td>
            <td><span class="badge badge-green">${log.status}</span></td>
          </tr>
        `).join("");
      }
    }
  },

  bindNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const viewId = btn.getAttribute("data-view");
        if (viewId && !btn.classList.contains("role-restricted")) {
          this.navigateToView(viewId);
        }
      });
    });
  },

  bindRoleSelector() {
    const selector = document.getElementById("roleSelector");
    if (selector) {
      selector.addEventListener("change", (e) => {
        RoleController.applyRolePermissions(e.target.value, (view) => this.navigateToView(view));
      });
      RoleController.applyRolePermissions(selector.value, (view) => this.navigateToView(view));
    }
  },

  bindSearch() {
    const searchInput = document.getElementById("globalSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const activeViewEl = document.querySelector(".app-view.active, .content-view.active");
        const activeViewId = activeViewEl ? activeViewEl.id : "view-beneficiarios";
        this.executeFilter(e.target.value, activeViewId);
      });
    }
  },

  bindModalTabs() {
    const tabBtns = document.querySelectorAll(".modal-tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        tabBtns.forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-view-content, .modal-tab-pane").forEach(v => {
          v.classList.remove("active");
          v.style.display = "none";
        });

        btn.classList.add("active");
        const targetTabId = btn.getAttribute("data-tab");
        const targetTab = document.getElementById(targetTabId);
        if (targetTab) {
          targetTab.classList.add("active");
          targetTab.style.display = "block";
        }
      });
    });
  },

  toggleTheme(event) {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "light" ? "dark" : "light";

    const applyTheme = () => {
      if (nextTheme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        StorageService.setItem("pdi_app_theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
        StorageService.setItem("pdi_app_theme", "dark");
      }
    };

    if (!document.startViewTransition) {
      applyTheme();
      return;
    }

    const btn = event.currentTarget || document.getElementById("btnThemeToggle");
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    if (nextTheme === "dark") {
      document.documentElement.classList.add("theme-transitioning-to-dark");
    }

    const transition = document.startViewTransition(applyTheme);
    transition.ready.then(() => {
      if (nextTheme === "light") {
        document.documentElement.animate(
          [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }],
          { duration: 400, easing: "cubic-bezier(0.2, 0, 0, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }
    });
  },

  exportCSV() {
    const data = BeneficiarioModel.getAll();
    CsvExporter.exportBeneficiarios(data);
    ToastView.show("Reporte Exportado", 'Consolidado oficial "PDI" descargado en formato CSV', "success");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AppController = AppController;
}


/* --- Module: app.js --- */
// Punto de Entrada Principal (Bootstrap MVC)

// Asignar al contexto global para handlers inline de compatibilidad
window.app = AppController;

// Exponer funciones invocadas por inline handlers en el HTML
window.clearSignatureCanvas = () => BeneficiarioController.clearSignature();
window.closeModalExpediente = () => ModalView.closeExpediente();
window.closeModalNuevoMenor = () => ModalView.closeNuevoMenor();
window.openModalNuevoMenor = () => ModalView.openNuevoMenor();
window.closeModalInforme = () => ModalView.closeInforme();
window.closeSpotlightTour = () => SpotlightView.closeTour();
window.spotlightNext = () => SpotlightView.next((view) => AppController.navigateToView(view));
window.spotlightPrev = () => SpotlightView.prev((view) => AppController.navigateToView(view));
window.calculateAnemiaPreview = () => {
  const val = document.getElementById("quickHbSlider")?.value || 10.4;
  SaludController.handleHbChange(val);
};
window.calculateVulnerabilidad = () => SocialController.handleVulnerabilidadChange();
window.guardarNuevoMenor = (e) => BeneficiarioController.saveNuevoMenor(e, () => AppController.refreshAllViews());
window.exportDataCSV = () => AppController.exportCSV();
window.toggleTheme = (e) => AppController.toggleTheme(e);
window.openExpediente = (id) => BeneficiarioController.openExpediente(id);
window.moverCaso = (id, etapa) => SocialController.moverCaso(id, etapa);

// Arrancar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  AppController.init();
});


window.toggleEditExpediente = () => {
  if (window.PDI?.ModalView) window.PDI.ModalView.toggleEdit();
};
window.saveExpedienteChanges = () => {
  if (window.PDI?.ModalView) window.PDI.ModalView.saveChanges();
};
window.deleteBeneficiarioExpediente = () => {
  if (window.PDI?.ModalView) window.PDI.ModalView.deleteBeneficiario();
};
window.closeModalExpediente = () => {
  if (window.PDI?.ModalView) window.PDI.ModalView.closeExpediente();
};

