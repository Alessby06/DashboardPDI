// Modelo de Beneficiarios (Padrón de Menores PDI)
// Incorpora el 100% de los campos oficiales de las Fichas A0, A1, A2, A3, A6 CRED y ASP
import { StorageService } from './StorageService.js';

export const defaultBeneficiarios = [
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
      "Servicio Alimentario Nutricional",
      "Servicio Acompañamiento Educativo",
      "Lonchera Saludable"
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
    "coordenadas": {
      "lat": -11.9056,
      "lng": -77.0421
    },
    "fotoFachada": null,
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
    "estrategia": "Servicio Alimentario Nutricional",
    "exoneracionAporte": "50% (Semi-exonerado)",
    "servicios": [
      "Servicio Alimentario Nutricional"
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
      "Servicio Alimentario Nutricional",
      "Servicio Acompañamiento Educativo"
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
    "estrategia": "Servicio Acompañamiento Educativo",
    "exoneracionAporte": "0% (Aporte Ordinario)",
    "servicios": [
      "Servicio Acompañamiento Educativo"
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
    "estrategia": "Servicio Alimentario Nutricional",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Servicio Alimentario Nutricional"
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
      "Servicio Alimentario Nutricional",
      "Servicio Acompañamiento Educativo"
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
    "estrategia": "Servicio Alimentario Nutricional",
    "exoneracionAporte": "50% (Semi-exonerado)",
    "servicios": [
      "Servicio Alimentario Nutricional"
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
    "estrategia": "Servicio Alimentario Nutricional",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Servicio Alimentario Nutricional"
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
    "estrategia": "Servicio Acompañamiento Educativo",
    "exoneracionAporte": "0% (Aporte Ordinario)",
    "servicios": [
      "Servicio Acompañamiento Educativo"
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
      "Servicio Alimentario Nutricional",
      "Servicio Acompañamiento Educativo"
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
    "estrategia": "Servicio Acompañamiento Educativo",
    "exoneracionAporte": "50% (Semi-exonerado)",
    "servicios": [
      "Servicio Acompañamiento Educativo"
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
    "estrategia": "Servicio Alimentario Nutricional",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Servicio Alimentario Nutricional"
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
      "Servicio Alimentario Nutricional",
      "Servicio Acompañamiento Educativo"
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
    "estrategia": "Servicio Alimentario Nutricional",
    "exoneracionAporte": "100% (Exonerado Vulnerabilidad Extrema)",
    "servicios": [
      "Servicio Alimentario Nutricional"
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
    "estrategia": "Servicio Acompañamiento Educativo",
    "exoneracionAporte": "0% (Aporte Ordinario)",
    "servicios": [
      "Servicio Acompañamiento Educativo"
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

export function normalizeBeneficiarioServicios(b) {
  if (!b) return b;
  const rawServicios = Array.isArray(b.servicios) ? b.servicios : null;
  const normalized = new Set();
  const lowerEstrategia = (b.estrategia || "").toLowerCase();

  if (rawServicios !== null) {
    rawServicios.forEach(s => {
      if (!s) return;
      const low = String(s).toLowerCase();
      if (low.includes("desayuno") || low.includes("alimento") || low.includes("nutric") || low.includes("lonchera")) {
        normalized.add("Servicio Alimentario Nutricional");
      } else if (low.includes("casita") || low.includes("educativ") || low.includes("refuerzo") || low.includes("escolar") || low.includes("acompañ")) {
        normalized.add("Servicio Acompañamiento Educativo");
      } else if (low.includes("pastoral") || low.includes("social") || low.includes("asp")) {
        normalized.add("Área Social Pastoral");
      } else {
        normalized.add(s);
      }
    });
  } else {
    // Si no tiene arreglo de servicios definido, inferir de estrategia y vulnerabilidad
    if (lowerEstrategia.includes("desayuno") || lowerEstrategia.includes("alimento") || lowerEstrategia.includes("nutric") || lowerEstrategia.includes("lonchera")) {
      normalized.add("Servicio Alimentario Nutricional");
    }
    if (lowerEstrategia.includes("casita") || lowerEstrategia.includes("educat") || lowerEstrategia.includes("acompañ")) {
      normalized.add("Servicio Acompañamiento Educativo");
    }
    if (lowerEstrategia.includes("pastoral") || lowerEstrategia.includes("social") || lowerEstrategia.includes("asp") || (b.vulnerabilidad && b.vulnerabilidad >= 80) || (b.exoneracionAporte && b.exoneracionAporte.includes("100%"))) {
      normalized.add("Área Social Pastoral");
    }
    if (lowerEstrategia.includes("mixto")) {
      normalized.add("Servicio Alimentario Nutricional");
      normalized.add("Servicio Acompañamiento Educativo");
    }
  }

  // Si no se asignó ninguno por defecto en datos iniciales
  if (normalized.size === 0 && rawServicios === null) {
    normalized.add("Servicio Alimentario Nutricional");
  }

  b.servicios = Array.from(normalized);
  return b;
}

export const BeneficiarioModel = {
  _data: null,

  init() {
    const storage = window.PDI?.StorageService || StorageService;
    let list = storage.getItem("pdi_mock_beneficiarios", defaultBeneficiarios);
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = defaultBeneficiarios;
    }
    // Normalizar servicios de todos los beneficiarios (existentes y por defecto)
    this._data = list.map(b => normalizeBeneficiarioServicios(b));
    storage.setItem("pdi_mock_beneficiarios", this._data);
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

  getByCodigo(codigo) {
    if (!codigo) return null;
    const list = this.getAll();
    const clean = codigo.trim().toLowerCase();
    return list.find(b => (b.codigo || "").toLowerCase() === clean) || null;
  },

  add(nuevoMenor) {
    const list = this.getAll();
    normalizeBeneficiarioServicios(nuevoMenor);
    list.unshift(nuevoMenor);
    const storage = window.PDI?.StorageService || StorageService;
    storage.setItem("pdi_mock_beneficiarios", list);
    return nuevoMenor;
  },

  update(id, updatedData) {
    const list = this.getAll();
    const idx = list.findIndex(b => b.id === Number(id));
    if (idx !== -1) {
      list[idx] = normalizeBeneficiarioServicios({ ...list[idx], ...updatedData });
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
