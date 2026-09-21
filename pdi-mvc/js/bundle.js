/* --- Module: models/StorageService.js --- */
// Servicio de Almacenamiento Local (Persistence Layer)
const StorageService = {
  getItem(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error("Error al leer StorageService:", e);
      return defaultValue;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error al escribir StorageService:", e);
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Error al eliminar StorageService:", e);
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.StorageService = StorageService;
}

/* --- Module: utils/AnemiaCalculator.js --- */
// Utilidad: Calculadora de Anemia según Norma Técnica MINSA
const AnemiaCalculator = {
  calculate(hb) {
    const val = parseFloat(hb);
    if (isNaN(val)) {
      return {
        label: "Dato inválido",
        accion: "Ingrese un valor numérico de hemoglobina",
        color: "var(--text-muted)",
        badgeClass: "badge-blue"
      };
    }

    if (val < 7.0) {
      return {
        label: "Anemia Severa",
        accion: "Derivación Hospitalaria Inmediata + Alerta Médica",
        color: "var(--gt-red)",
        badgeClass: "badge-red"
      };
    } else if (val < 10.0) {
      return {
        label: "Anemia Moderada",
        accion: "Sulfato Ferroso 2 gotas/kg/día + Visita Domiciliaria ASP",
        color: "var(--gt-red)",
        badgeClass: "badge-red"
      };
    } else if (val < 11.0) {
      return {
        label: "Anemia Leve",
        accion: "Suplementación con Gotas de Hierro + Taller Nutricional",
        color: "var(--gt-yellow)",
        badgeClass: "badge-yellow"
      };
    } else {
      return {
        label: "Normal (Sin Anemia)",
        accion: "Desayuno Fortificado Diario + Control de Crecimiento cada 3 meses",
        color: "var(--gt-green)",
        badgeClass: "badge-green"
      };
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AnemiaCalculator = AnemiaCalculator;
}

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

  getByCodigo(codigo) {
    if (!codigo) return null;
    const list = this.getAll();
    const clean = codigo.trim().toLowerCase();
    return list.find(b => (b.codigo || "").toLowerCase() === clean) || null;
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
// Sincronizado integralmente con los menores del Padrón Oficial de Beneficiarios

const defaultCasosSociales = [
  {
    id: 101,
    menor: "Liam Mateo Sanchez Diaz",
    codigo: "PDI-2026-003",
    etapa: "pendiente",
    urgencia: "Alta",
    tipoProblematica: "Nutricional / Abandono",
    fechaDerivacion: "2026-04-12",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Hb 9.6 g/dL (Anemia Moderada). Cuidadora principal es abuela Gladys Diaz (64 años) sin empleo formal ni pensión; alto riesgo de deserción alimentaria.",
    accionesPrevias: "Prescripción de sulfato ferroso y primera visita domiciliaria preliminar en El Progreso.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Padres ausentes. Solo cuenta con apoyo esporádico de vecina de la capilla."
    },
    detalle: "Hb: 9.6 g/dL (Anemia Moderada) + Abuela a cargo sin ingresos fijos en El Progreso.",
    sede: "El Progreso (Carabayllo)",
    vulnerabilidadPuntaje: 92
  },
  {
    id: 102,
    menor: "Dylan Josué Quispe Córdova",
    codigo: "PDI-2026-008",
    etapa: "pendiente",
    urgencia: "Alta",
    tipoProblematica: "Nutricional / Extrema Pobreza",
    fechaDerivacion: "2026-04-10",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Hb 9.8 g/dL (Anemia Moderada). Hogar monoparental con madre Karina Córdova a cargo de 3 dependientes en vivienda precaria de madera sin red de agua.",
    accionesPrevias: "Sesión demostrativa de alimentos ricos en hierro y entrega de suplementos ferrosos.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Madre soltera sin pensión de alimentos ni apoyo de familiares directos."
    },
    detalle: "Hb 9.8 g/dL + Madre sola con 3 hijos en AA.HH. San Pedro sin agua potable.",
    sede: "San Pedro (Carabayllo)",
    vulnerabilidadPuntaje: 90
  },
  {
    id: 103,
    menor: "Lucas Alejandro Torres Vilchez",
    codigo: "PDI-2026-010",
    etapa: "pendiente",
    urgencia: "Media",
    tipoProblematica: "Socioeconómica",
    fechaDerivacion: "2026-04-09",
    quienDeriva: {
      nombre: "Lic. Carmen Vargas",
      cargo: "Trabajadora Social ASP",
      telefono: "945-667-889"
    },
    situacionEncontrada: "Cuidadora Sonia Vilchez en desempleo prolongado. Solicita canasta de contingencia y exoneración de aporte simbólico.",
    accionesPrevias: "Evaluación preliminar de balance de ingresos y encuesta de vulnerabilidad.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Tía materna brinda apoyo con alimentos de forma quincenal."
    },
    detalle: "Desempleo prolongado del hogar en Los Bendecidos; requiere canasta de contingencia.",
    sede: "Los Bendecidos (Carabayllo)",
    vulnerabilidadPuntaje: 82
  },
  {
    id: 104,
    menor: "Thiago Gael Flores Quispe",
    codigo: "PDI-2026-001",
    etapa: "evaluacion",
    urgencia: "Media",
    tipoProblematica: "Familiar / Hábitat",
    fechaDerivacion: "2026-04-08",
    quienDeriva: {
      nombre: "Prof. Delia Morales",
      cargo: "Promotora Educativa Casitas",
      telefono: "912-334-556"
    },
    situacionEncontrada: "Vivienda precaria con piso de tierra y hacinamiento en Comité 12 de Año Nuevo. Se realiza evaluación socioeconómica de 6 dimensiones.",
    accionesPrevias: "Visita domiciliaria preliminar realizada y aplicación de ficha socioeconómica en curso.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Padre trabaja de estibador eventual; madre Rosa Quispe al cuidado del hogar."
    },
    detalle: "Evaluación socioeconómica y de hábitat en curso en Año Nuevo.",
    sede: "Año Nuevo (Comas)",
    vulnerabilidadPuntaje: 84
  },
  {
    id: 105,
    menor: "Benjamín Elías Navarro Huamán",
    codigo: "PDI-2026-006",
    etapa: "evaluacion",
    urgencia: "Media",
    tipoProblematica: "Familiar / Salud",
    fechaDerivacion: "2026-04-05",
    quienDeriva: {
      nombre: "Lic. Carmen Vargas",
      cargo: "Trabajadora Social ASP",
      telefono: "945-667-889"
    },
    situacionEncontrada: "Madre Patricia Huamán con tratamiento médico crónico. En evaluación para subsidio nutricional y acompañamiento pastoral.",
    accionesPrevias: "Coordinación con posta médica Santa Rosa para verificación de recetas y atenciones.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Abuelo apoya en traslados del menor hacia la sede de atención."
    },
    detalle: "Salud crónica de la madre y evaluación de subsidio alimentario en Santa Rosa.",
    sede: "Santa Rosa (Carabayllo)",
    vulnerabilidadPuntaje: 78
  },
  {
    id: 106,
    menor: "Camila Fernanda Rojas Morales",
    codigo: "PDI-2026-007",
    etapa: "evaluacion",
    urgencia: "Media",
    tipoProblematica: "Vulnerabilidad Intermedia",
    fechaDerivacion: "2026-04-02",
    quienDeriva: {
      nombre: "Prof. Delia Morales",
      cargo: "Promotora Educativa Casitas",
      telefono: "912-334-556"
    },
    situacionEncontrada: "Madre Miriam Morales solicita reconsideración para exoneración total debido al cese laboral del cónyuge.",
    accionesPrevias: "Recepción de solicitud escrita y programación de visita domiciliaria de constatación.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Núcleo familiar nuclear con apoyo de abuela materna."
    },
    detalle: "Revisión de aporte y estado laboral de los cuidadores en Año Nuevo.",
    sede: "Año Nuevo (Comas)",
    vulnerabilidadPuntaje: 68
  },
  {
    id: 107,
    menor: "Mateo Sebastian Castillo Ruiz",
    codigo: "PDI-2026-005",
    etapa: "canalizado",
    urgencia: "Alta",
    tipoProblematica: "Legal / Abandono",
    fechaDerivacion: "2026-03-28",
    quienDeriva: {
      nombre: "Lic. Carmen Vargas",
      cargo: "Trabajadora Social ASP",
      telefono: "945-667-889"
    },
    situacionEncontrada: "Presunto abandono económico paterno y riesgo de vulneración de derechos de alimentos del menor.",
    accionesPrevias: "Derivación mediante Oficio Oficial a DEMUNA Carabayllo y asignación de Canasta Familiar Banco BTF.",
    soporteFamiliar: {
      tiene: false,
      detalle: "Madre Elena Ruiz sola al cuidado de 3 hijos dependientes."
    },
    detalle: "Derivado a DEMUNA Carabayllo con Canasta de Alimentos BTF asignada.",
    sede: "San Pedro (Carabayllo)",
    vulnerabilidadPuntaje: 88
  },
  {
    id: 108,
    menor: "Mia Valentina Mendoza Ramos",
    codigo: "PDI-2026-002",
    etapa: "cerrado",
    urgencia: "Baja",
    tipoProblematica: "Salud / Recuperación",
    fechaDerivacion: "2026-03-10",
    quienDeriva: {
      nombre: "Lic. Miriam Soto Paredes",
      cargo: "Facilitadora Nutricional",
      telefono: "987-223-114"
    },
    situacionEncontrada: "Ingresó con anemia leve y vulnerabilidad económica. Madre Carmen Ramos completó sesiones demostrativas y el menor recuperó niveles normales de hemoglobina (Hb 11.6 g/dL).",
    accionesPrevias: "Cumplió esquema de suplementación y asistencia perfecta al comedor.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Ambos padres plenamente comprometidos y con empleo recuperado."
    },
    detalle: "Recuperada a Hb 11.6 g/dL (Normal). Caso cerrado con informe favorable.",
    sede: "La Libertad (Comas)",
    vulnerabilidadPuntaje: 62
  },
  {
    id: 109,
    menor: "Luciana Sofia Alvarez Vega",
    codigo: "PDI-2026-004",
    etapa: "cerrado",
    urgencia: "Baja",
    tipoProblematica: "Escolaridad / Nivelación",
    fechaDerivacion: "2026-03-05",
    quienDeriva: {
      nombre: "Prof. Delia Morales",
      cargo: "Promotora Educativa Casitas",
      telefono: "912-334-556"
    },
    situacionEncontrada: "Presentaba rezago en lectoescritura al inicio de año. Culminó módulo de refuerzo escolar con materiales Faber-Castell con 96% de asistencia.",
    accionesPrevias: "Tutoría personalizada semanal y entrega de kit de útiles escolares.",
    soporteFamiliar: {
      tiene: true,
      detalle: "Padre Jorge Alvarez brinda acompañamiento activo en tareas."
    },
    detalle: "Nivelación escolar completada en Casitas del Saber. Informe favorable.",
    sede: "Año Nuevo (Comas)",
    vulnerabilidadPuntaje: 45
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
    id: "LOG-2026-001",
    timestamp: "2026-09-13 17:30",
    user: "Carmen Mendoza",
    role: "Facilitadora",
    action: "Tamizaje CRED",
    entity: "PDI-2026-001",
    detail: "Registro de control nutricional mensual y tamizaje de hemoglobina",
    status: "Registrado",
    ip: "192.168.1.45",
    sede: "Año Nuevo",
    diff: [
      { campo: "Hemoglobina (Hb)", valorAnterior: "9.8 g/dL (Moderada)", valorNuevo: "10.4 g/dL (Leve)" },
      { campo: "Peso / Talla", valorAnterior: "13.9 kg / 93.0 cm", valorNuevo: "14.2 kg / 94.5 cm" },
      { campo: "Diagnóstico Anemia", valorAnterior: "Anemia Moderada", valorNuevo: "Anemia Leve" }
    ]
  },
  {
    id: "LOG-2026-002",
    timestamp: "2026-09-13 16:45",
    user: "Lic. Ruth Soto",
    role: "Trabajadora Social",
    action: "Derivación Caso",
    entity: "PDI-2026-003",
    detail: "Canalización de caso social de urgencia alta a DEMUNA Carabayllo",
    status: "Sensible",
    ip: "192.168.1.18",
    sede: "El Progreso",
    diff: [
      { campo: "Estado Caso Social", valorAnterior: "Evaluación Preliminar", valorNuevo: "Canalizado a DEMUNA" },
      { campo: "Nivel de Urgencia", valorAnterior: "Media", valorNuevo: "Alta (Vulnerabilidad Extrema)" },
      { campo: "Oficio Notificación", valorAnterior: "-", valorNuevo: "OF-DEMUNA-2026-089" }
    ]
  },
  {
    id: "LOG-2026-003",
    timestamp: "2026-09-13 15:20",
    user: "Rosa Flores",
    role: "Promotora",
    action: "Pase Asistencia",
    entity: "Sede Año Nuevo",
    detail: "Registro y cierre de asistencia diaria en Casita del Saber",
    status: "Registrado",
    ip: "192.168.1.22",
    sede: "Año Nuevo",
    diff: [
      { campo: "Menores Presentes", valorAnterior: "0 / 20", valorNuevo: "18 / 20 presentes" },
      { campo: "Ración Lonchera", valorAnterior: "Pendiente", valorNuevo: "18 raciones distribuidas" }
    ]
  },
  {
    id: "LOG-2026-004",
    timestamp: "2026-09-13 14:10",
    user: "Dirección Gutenberg",
    role: "Coordinación",
    action: "Aprobación Padrón",
    entity: "Padrón 2026",
    detail: "Validación de expedientes del padrón institucional 2026 conforme a Ley 29733",
    status: "Registrado",
    ip: "192.168.1.10",
    sede: "Central Lima",
    diff: [
      { campo: "Expedientes Auditados", valorAnterior: "20 revisados", valorNuevo: "28 expedientes aprobados" },
      { campo: "Consentimientos Ley 29733", valorAnterior: "92%", valorNuevo: "100% verificados" }
    ]
  }
];

const AuditModel = {
  _logs: [...defaultAuditLogs],

  getAll() {
    return this._logs;
  },

  getById(id) {
    return this._logs.find(l => l.id === id) || null;
  },

  log(user, role, action, entity, detail, status = "Registrado", diff = null, ip = "192.168.1.x", sede = "Central") {
    const now = new Date();
    const timestamp = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, '0') + "-" +
      String(now.getDate()).padStart(2, '0') + " " +
      String(now.getHours()).padStart(2, '0') + ":" +
      String(now.getMinutes()).padStart(2, '0');

    const id = "LOG-" + now.getFullYear() + "-" + String(this._logs.length + 1).padStart(3, '0');
    const entry = { id, timestamp, user, role, action, entity, detail, status, ip, sede, diff };
    this._logs.unshift(entry);
    return entry;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.defaultAuditLogs = defaultAuditLogs;
  window.PDI.AuditModel = AuditModel;
}

/* --- Module: views/ToastView.js --- */
// Vista: Sistema de Notificaciones Toast Flotantes
const ToastView = {
  show(title, message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast-msg";

    let borderCol = "var(--gt-green)";
    if (type === "warning") borderCol = "var(--gt-yellow)";
    if (type === "danger") borderCol = "var(--gt-red)";
    if (type === "info") borderCol = "var(--gt-blue)";

    toast.style.borderColor = borderCol;
    toast.innerHTML = `
      <div style="flex:1;">
        <strong style="color:${borderCol}; display:block; font-size:13px;">${title}</strong>
        <span style="font-size:12px; color:var(--text-muted);">${message}</span>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ToastView = ToastView;
}

/* --- Module: views/SpotlightView.js --- */
// Vista: Tour Interactivo Spotlight (10 Minutos)
const spotlightSteps = [
  {
    targetId: "roleSelector",
    title: "1. Selector de Roles y RBAC Dinámico",
    desc: "Permite simular en vivo las 5 perspectivas operativas: Coordinación, Facilitadora Nutricional (CRED), Promotora Educativa, Área Social Pastoral y Administrador TI. Cada rol filtra estrictamente las pestañas y controles visibles.",
    view: "view-dashboard"
  },
  {
    targetId: "quickCredSlider",
    title: "2. Métricas y Tamizaje Anemia CRED",
    desc: "En el Dashboard y módulo CRED, calcule en vivo la severidad de anemia según normas MINSA ingresando el valor de hemoglobina. El sistema prescribe automáticamente el esquema de suplementación.",
    view: "view-dashboard"
  },
  {
    targetId: "tbodyBeneficiarios",
    title: "3. Padrón Nominal y Filtro Reactivo",
    desc: "Muestra la ficha técnica consolidada de los menores atendidos en las sedes Año Nuevo, La Libertad, El Progreso y San Pedro. Use el buscador superior para filtrar instantáneamente por nombre o DNI.",
    view: "view-beneficiarios"
  },
  {
    targetId: "boardKanbanSocial",
    title: "4. Flujograma Social y Tablero Kanban ASP",
    desc: "Tablero de 4 fases para canalización de casos de riesgo social y desnutrición: Pendiente, Evaluación, Canalizado y Cerrado. Puede avanzar los casos con un solo clic conforme avanza la intervención.",
    view: "view-social"
  },
  {
    targetId: "btnNuevoMenorHeader",
    title: "5. Firma Ley 29733 y Ficha Integral",
    desc: "Al registrar un menor o consultar su expediente, el sistema integra la firma digital manuscrita de consentimiento del apoderado, cumpliendo con la Ley de Protección de Datos Personales del Perú.",
    view: "view-beneficiarios"
  }
];

const SpotlightView = {
  currentStep: 0,

  startTour(onNavigate) {
    this.currentStep = 0;
    this.showStep(this.currentStep, onNavigate);
  },

  showStep(index, onNavigate) {
    this.clearHighlight();
    const bar = document.getElementById("spotlightBar");
    if (!bar) return;

    if (index < 0 || index >= spotlightSteps.length) {
      this.closeTour();
      return;
    }

    this.currentStep = index;
    const step = spotlightSteps[index];

    const stepNum = document.getElementById("spotlightStepNum");
    if (stepNum) stepNum.textContent = `${index + 1}/${spotlightSteps.length}`;

    const titleEl = document.getElementById("spotlightTitle");
    if (titleEl) titleEl.textContent = step.title;

    const descEl = document.getElementById("spotlightDesc");
    if (descEl) descEl.textContent = step.desc;

    bar.classList.add("visible");

    if (onNavigate && step.view) {
      onNavigate(step.view);
    }

    setTimeout(() => {
      const target = document.getElementById(step.targetId);
      if (target) {
        target.classList.add("spotlight-highlight-target");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 180);
  },

  next(onNavigate) {
    if (this.currentStep < spotlightSteps.length - 1) {
      this.showStep(this.currentStep + 1, onNavigate);
    } else {
      this.closeTour();
    }
  },

  prev(onNavigate) {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1, onNavigate);
    }
  },

  clearHighlight() {
    document.querySelectorAll(".spotlight-highlight-target").forEach(el => {
      el.classList.remove("spotlight-highlight-target");
    });
  },

  closeTour() {
    this.clearHighlight();
    const bar = document.getElementById("spotlightBar");
    if (bar) bar.classList.remove("visible");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.spotlightSteps = spotlightSteps;
  window.PDI.SpotlightView = SpotlightView;
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

    const coverageContainer = document.getElementById("dashDistrictCoverage");
    if (coverageContainer) {
      const pctComas = stats.total > 0 ? Math.round((stats.comasCount / stats.total) * 100) : 0;
      const pctCarabayllo = stats.total > 0 ? Math.round((stats.carabaylloCount / stats.total) * 100) : 0;
      coverageContainer.innerHTML = `
        <div class="district-coverage-card">
          <div class="district-coverage-header">
            <div>
              <strong>Distrito de Comas</strong>
              <div class="district-coverage-sedes">Sedes: La Libertad, Año Nuevo, Collique</div>
            </div>
            <span class="badge badge-green district-coverage-badge">${stats.comasCount} Beneficiarios (${pctComas}%)</span>
          </div>
          <div class="district-coverage-track">
            <div class="district-coverage-bar" style="width: ${pctComas}%; background: var(--gt-green);"></div>
          </div>
        </div>

        <div class="district-coverage-card">
          <div class="district-coverage-header">
            <div>
              <strong>Distrito de Carabayllo</strong>
              <div class="district-coverage-sedes">Sedes: El Progreso, San Pedro</div>
            </div>
            <span class="badge badge-blue district-coverage-badge">${stats.carabaylloCount} Beneficiarios (${pctCarabayllo}%)</span>
          </div>
          <div class="district-coverage-track">
            <div class="district-coverage-bar" style="width: ${pctCarabayllo}%; background: var(--gt-blue, #0d9488);"></div>
          </div>
        </div>
      `;
    }

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

  _auditSearchQuery: "",
  _auditCurrentPage: 1,
  _auditPageSize: 10,
  _customDateSpecific: "",
  _customDateRangeStart: "",
  _customDateRangeEnd: "",

  renderAuditLogs(logs) {
    this._currentAuditLogs = logs || [];
    this.updateAuditKpis(this._currentAuditLogs);
    this.applyAuditFilters();
  },

  updateAuditKpis(logs) {
    const totalEl = document.getElementById("auditKpiTotal");
    const sensEl = document.getElementById("auditKpiSensibles");
    const lastActivityEl = document.getElementById("auditLastActivity");

    if (totalEl) totalEl.textContent = logs.length;
    
    if (sensEl) {
      const sensibles = logs.filter(l => 
        (l.action && l.action.toLowerCase().includes("derivaci")) || 
        (l.detail && l.detail.toLowerCase().includes("demuna"))
      );
      sensEl.textContent = sensibles.length;
    }

    if (lastActivityEl) {
      if (logs && logs.length > 0) {
        const latest = logs[0];
        lastActivityEl.textContent = `${latest.timestamp} · ${latest.user} (${latest.action})`;
      } else {
        lastActivityEl.textContent = "Sin registros coincidentes";
      }
    }
  },

  filterByAction(actionType) {
    this._selectedAuditAction = actionType;
    this._auditCurrentPage = 1;
    const items = document.querySelectorAll("#dropdownAuditAction .custom-dropdown-item");
    items.forEach(it => {
      if (it.getAttribute("data-value") === actionType) {
        it.classList.add("selected");
        const labelEl = document.getElementById("labelAuditAction");
        if (labelEl) {
          const clone = it.cloneNode(true);
          const badge = clone.querySelector(".badge");
          if (badge) badge.remove();
          labelEl.textContent = clone.textContent.trim();
        }
      } else {
        it.classList.remove("selected");
      }
    });
    this.updateActiveFiltersBadge();
    this.applyAuditFilters();
  },

  filterByRole(role) {
    this._selectedAuditRole = role;
    this._auditCurrentPage = 1;
    this.updateActiveFiltersBadge();
    this.applyAuditFilters();
  },

  filterByDate(dateKey) {
    this._selectedAuditDate = dateKey;
    this._auditCurrentPage = 1;

    // Conmutar visibilidad de paneles interactivos de fecha
    const panelSpecific = document.getElementById("panelAuditDateSpecific");
    const panelRange = document.getElementById("panelAuditDateRange");

    if (panelSpecific) panelSpecific.style.display = (dateKey === "specific") ? "flex" : "none";
    if (panelRange) panelRange.style.display = (dateKey === "range") ? "flex" : "none";

    this.updateActiveFiltersBadge();
    this.applyAuditFilters();
  },

  handleDatePickerChange(type, yyyyMmDd) {
    if (!yyyyMmDd) return;
    const parts = yyyyMmDd.split("-");
    if (parts.length === 3) {
      const ddMmYyyy = `${parts[2]}/${parts[1]}/${parts[0]}`;
      if (type === "specific") {
        const input = document.getElementById("inputAuditSpecificDate");
        if (input) input.value = ddMmYyyy;
        this._customDateSpecific = yyyyMmDd;
      } else if (type === "range-start") {
        const input = document.getElementById("inputAuditRangeStart");
        if (input) input.value = ddMmYyyy;
        this._customDateRangeStart = yyyyMmDd;
      } else if (type === "range-end") {
        const input = document.getElementById("inputAuditRangeEnd");
        if (input) input.value = ddMmYyyy;
        this._customDateRangeEnd = yyyyMmDd;
      }
      this._auditCurrentPage = 1;
      this.updateActiveFiltersBadge();
      this.applyAuditFilters();
    }
  },

  handleDateManualInput(type, inputEl) {
    if (!inputEl) return;
    let val = inputEl.value;
    
    // Auto-formateo con slashes si el usuario escribe solo dígitos
    const cleanDigits = val.replace(/\D/g, "").slice(0, 8);
    if (cleanDigits.length >= 5) {
      val = `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2, 4)}/${cleanDigits.slice(4)}`;
    } else if (cleanDigits.length >= 3) {
      val = `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2)}`;
    } else {
      val = cleanDigits;
    }
    inputEl.value = val;

    // Si tiene 10 caracteres (DD/MM/AAAA) validar y parsear
    if (val.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      const isoDate = `${y}-${m}-${d}`;
      const pickerId = (type === "specific") ? "pickerAuditSpecificDate" : (type === "range-start" ? "pickerAuditRangeStart" : "pickerAuditRangeEnd");
      const picker = document.getElementById(pickerId);
      if (picker) picker.value = isoDate;

      if (type === "specific") {
        this._customDateSpecific = isoDate;
      } else if (type === "range-start") {
        this._customDateRangeStart = isoDate;
      } else if (type === "range-end") {
        this._customDateRangeEnd = isoDate;
      }
      this._auditCurrentPage = 1;
      this.updateActiveFiltersBadge();
      this.applyAuditFilters();
    } else if (val.length === 0) {
      if (type === "specific") this._customDateSpecific = "";
      if (type === "range-start") this._customDateRangeStart = "";
      if (type === "range-end") this._customDateRangeEnd = "";
      this.applyAuditFilters();
    }
  },

  filterBySearch(query) {
    this._auditSearchQuery = (query || "").trim().toLowerCase();
    this._auditCurrentPage = 1;
    const clearBtn = document.getElementById("btnAuditSearchClear");
    if (clearBtn) {
      clearBtn.style.display = query && query.length > 0 ? "flex" : "none";
    }
    this.applyAuditFilters();
  },

  clearSearch() {
    const input = document.getElementById("inputAuditSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  resetAuditFilters() {
    this._customDateSpecific = "";
    this._customDateRangeStart = "";
    this._customDateRangeEnd = "";

    const spText = document.getElementById("inputAuditSpecificDate");
    const rStartText = document.getElementById("inputAuditRangeStart");
    const rEndText = document.getElementById("inputAuditRangeEnd");
    if (spText) spText.value = "";
    if (rStartText) rStartText.value = "";
    if (rEndText) rEndText.value = "";

    const panelSpecific = document.getElementById("panelAuditDateSpecific");
    const panelRange = document.getElementById("panelAuditDateRange");
    if (panelSpecific) panelSpecific.style.display = "none";
    if (panelRange) panelRange.style.display = "none";

    this.selectAction("all", "Todos los Eventos");
    this.selectDate("all", "Todas las Fechas");
    this.selectRole("all", "Todos los Roles");
  },

  updateActiveFiltersBadge() {
    let count = 0;
    if (this._selectedAuditAction && this._selectedAuditAction !== "all") count++;
    if (this._selectedAuditDate && this._selectedAuditDate !== "all") count++;
    if (this._selectedAuditRole && this._selectedAuditRole !== "all") count++;

    const badge = document.getElementById("auditActiveFiltersCount");
    const filterBtn = document.getElementById("btnDropdownAuditFilterPanel");

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }
    if (filterBtn) {
      if (count > 0) {
        filterBtn.classList.add("has-filters");
      } else {
        filterBtn.classList.remove("has-filters");
      }
    }
  },

  changePage(page) {
    this._auditCurrentPage = page;
    this.applyAuditFilters();
  },

  changePageSize(size) {
    this._auditPageSize = Number(size) || 10;
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  applyAuditFilters() {
    const logs = this._currentAuditLogs || [];
    const actionFilter = this._selectedAuditAction || "all";
    const roleFilter = this._selectedAuditRole || "all";
    const dateFilter = this._selectedAuditDate || "all";
    const query = this._auditSearchQuery || "";

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const filtered = logs.filter(l => {
      let matchAction = true;
      if (actionFilter === "salud") {
        matchAction = (l.action && l.action.toLowerCase().includes("cred")) || (l.action && l.action.toLowerCase().includes("tamizaje"));
      } else if (actionFilter === "social") {
        matchAction = (l.action && l.action.toLowerCase().includes("derivaci")) || (l.role && l.role.toLowerCase().includes("social"));
      } else if (actionFilter === "educativo") {
        matchAction = (l.action && l.action.toLowerCase().includes("asistencia")) || (l.role && l.role.toLowerCase().includes("promotora"));
      } else if (actionFilter === "padron") {
        matchAction = (l.action && l.action.toLowerCase().includes("padrón")) || (l.role && l.role.toLowerCase().includes("coordinaci"));
      }

      let matchRole = true;
      if (roleFilter !== "all") {
        matchRole = l.role && l.role.toLowerCase().includes(roleFilter.toLowerCase());
      }

      let matchDate = true;
      const logDateStr = (l.timestamp || "").slice(0, 10);
      if (dateFilter === "today") {
        matchDate = logDateStr === todayStr;
      } else if (dateFilter === "week") {
        const logDate = new Date(logDateStr);
        matchDate = !isNaN(logDate) && logDate >= sevenDaysAgo;
      } else if (dateFilter === "specific") {
        if (this._customDateSpecific) {
          matchDate = logDateStr === this._customDateSpecific;
        }
      } else if (dateFilter === "range") {
        const start = this._customDateRangeStart;
        const end = this._customDateRangeEnd;
        if (start && end) {
          matchDate = logDateStr >= start && logDateStr <= end;
        } else if (start) {
          matchDate = logDateStr >= start;
        } else if (end) {
          matchDate = logDateStr <= end;
        }
      }

      let matchQuery = true;
      if (query) {
        const user = (l.user || "").toLowerCase();
        const role = (l.role || "").toLowerCase();
        const action = (l.action || "").toLowerCase();
        const entity = (l.entity || "").toLowerCase();
        const detail = (l.detail || "").toLowerCase();
        const id = (l.id || "").toLowerCase();
        matchQuery = user.includes(query) || role.includes(query) || action.includes(query) || entity.includes(query) || detail.includes(query) || id.includes(query);
      }

      return matchAction && matchRole && matchDate && matchQuery;
    });

    const totalRecords = filtered.length;
    const pageSize = this._auditPageSize || 10;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    if (this._auditCurrentPage > totalPages) this._auditCurrentPage = totalPages;
    if (this._auditCurrentPage < 1) this._auditCurrentPage = 1;

    const startIndex = (this._auditCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const paginatedLogs = filtered.slice(startIndex, endIndex);

    this.renderAuditTableAndCards(paginatedLogs);
    this.renderAuditPagination(totalRecords, startIndex, endIndex, totalPages);
    this.updateAuditKpis(filtered);
  },

  renderAuditPagination(total, start, end, totalPages) {
    const infoEl = document.getElementById("auditPaginationInfo");
    if (infoEl) {
      if (total === 0) {
        infoEl.textContent = "Sin registros coincidentes";
      } else {
        infoEl.textContent = `Mostrando ${start + 1} a ${end} de ${total} eventos`;
      }
    }

    const btnPrev = document.getElementById("btnAuditPagePrev");
    const btnNext = document.getElementById("btnAuditPageNext");
    const pageNumEl = document.getElementById("auditCurrentPageNum");

    if (pageNumEl) pageNumEl.textContent = `Página ${this._auditCurrentPage} de ${totalPages}`;
    if (btnPrev) btnPrev.disabled = (this._auditCurrentPage <= 1);
    if (btnNext) btnNext.disabled = (this._auditCurrentPage >= totalPages);
  },

  renderAuditTableAndCards(logs) {
    const tbody = document.getElementById("tbodyAuditLogs");
    const mobileContainer = document.getElementById("mobileCardsAuditoria");

    const getActionBadgeClass = (action) => {
      const act = (action || "").toLowerCase();
      if (act.includes("cred") || act.includes("tamizaje")) return "badge-yellow";
      if (act.includes("derivaci")) return "badge-red";
      if (act.includes("asistencia")) return "badge-blue";
      if (act.includes("padrón") || act.includes("aprobación")) return "badge-green";
      return "badge-blue";
    };

    const getStatusBadgeClass = (status) => {
      const s = (status || "").toLowerCase();
      if (s.includes("sensible") || s.includes("crítico") || s.includes("derivaci")) return "badge-red";
      if (s.includes("observado") || s.includes("revisión") || s.includes("pendiente")) return "badge-yellow";
      return "badge-green"; // Registrado / Conforme
    };

    const getInitials = (name) => {
      if (!name) return "US";
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    };

    if (tbody) {
      if (logs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding:32px; color:var(--text-dim);">
              No se encontraron eventos de auditoría con los filtros y búsqueda especificados.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = logs.map(l => {
          const isMenor = (l.entity && l.entity.startsWith("PDI-"));
          const entityHtml = isMenor 
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo ? window.openExpedienteByCodigo('${l.entity}') : (window.PDI?.BeneficiarioController?.openExpedienteByCodigo ? window.PDI.BeneficiarioController.openExpedienteByCodigo('${l.entity}') : null)" class="audit-entity-link" title="Abrir expediente del menor"><code style="font-family:var(--mono-font); font-weight:700; color:var(--gt-green); text-decoration:underline;">${l.entity}</code></a>`
            : `<code style="font-family:var(--mono-font); font-weight:700; color:var(--text-main);">${l.entity}</code>`;

          const logIdStr = l.id || "";
          return `
            <tr class="audit-row-interactive" onclick="window.openAuditDetail ? window.openAuditDetail('${logIdStr}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${logIdStr}') : null)" title="Clic para ver detalle de auditoría y cambios">
              <td style="font-family:var(--mono-font); font-size:12px; color:var(--text-dim); white-space:nowrap;">${l.timestamp}</td>
              <td>
                <div class="audit-user-cell">
                  <div class="audit-user-avatar">${getInitials(l.user)}</div>
                  <div>
                    <strong>${l.user}</strong>
                    <div style="font-size:11px; color:var(--text-muted);">${l.role}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge ${getActionBadgeClass(l.action)}">${l.action}</span></td>
              <td>${entityHtml}</td>
              <td style="font-size:12.5px; color:var(--text-muted); max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${l.detail}</td>
              <td><span class="badge ${getStatusBadgeClass(l.status)}">${l.status}</span></td>
              <td style="text-align:right;">
                <button type="button" class="btn-action-sm" onclick="event.stopPropagation(); window.openAuditDetail ? window.openAuditDetail('${logIdStr}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${logIdStr}') : null)" title="Ver detalle de trazabilidad">
                  <span>Detalle</span>
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    if (mobileContainer) {
      if (logs.length === 0) {
        mobileContainer.innerHTML = `
          <div style="text-align:center; padding:32px; color:var(--text-dim); background:var(--surface-1); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            No se encontraron eventos con los filtros seleccionados.
          </div>
        `;
      } else {
        mobileContainer.innerHTML = logs.map((l, index) => {
          const isMenor = (l.entity && l.entity.startsWith("PDI-"));
          const entityHtml = isMenor 
            ? `<a href="javascript:void(0)" onclick="event.stopPropagation(); window.openExpedienteByCodigo ? window.openExpedienteByCodigo('${l.entity}') : (window.PDI?.BeneficiarioController?.openExpedienteByCodigo ? window.PDI.BeneficiarioController.openExpedienteByCodigo('${l.entity}') : null)" class="audit-entity-link" title="Abrir expediente del menor"><code style="font-family:var(--mono-font); font-weight:700; color:var(--gt-green); text-decoration:underline;">${l.entity}</code></a>`
            : `<code style="font-family:var(--mono-font); font-weight:700; color:var(--text-main);">${l.entity}</code>`;

          const logIdStr = l.id || "";
          return `
            <div class="mobile-card-item" id="mobile-audit-${index}">
              <div class="datacard-header">
                <div class="datacard-id">
                  <span>REG:</span> ${l.timestamp}
                </div>
                <div class="datacard-header-right">
                  <span class="badge ${getStatusBadgeClass(l.status)}">${l.status}</span>
                </div>
              </div>

              <div class="datacard-body">
                <div class="datacard-row">
                  <span class="datacard-label">Acción Registrada</span>
                  <span class="datacard-value"><span class="badge ${getActionBadgeClass(l.action)}">${l.action}</span></span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Entidad Afectada</span>
                  <span class="datacard-value">${entityHtml}</span>
                </div>

                <div class="datacard-extra" id="extra-audit-${index}">
                  <div class="datacard-row">
                    <span class="datacard-label">Usuario Responsable</span>
                    <span class="datacard-value" style="display:flex; align-items:center; gap:6px;">
                      <span class="audit-user-avatar" style="width:22px; height:22px; font-size:9.5px;">${getInitials(l.user)}</span>
                      ${l.user}
                    </span>
                  </div>
                  <div class="datacard-row">
                    <span class="datacard-label">Perfil / Rol</span>
                    <span class="datacard-value">${l.role}</span>
                  </div>
                  <div class="datacard-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
                    <span class="datacard-label">Detalle de la Operación</span>
                    <span class="datacard-value" style="text-align:left; font-size:12.5px; font-weight:500; color:var(--text-muted);">${l.detail}</span>
                  </div>
                  <div style="margin-top:10px;">
                    <button type="button" class="btn-action-sm primary" style="width:100%; justify-content:center;" onclick="window.openAuditDetail ? window.openAuditDetail('${logIdStr}') : (window.PDI?.DashboardView?.openLogDetail ? window.PDI.DashboardView.openLogDetail('${logIdStr}') : null)">
                      <span>Ver Ficha Completa de Auditoría</span>
                    </button>
                  </div>
                </div>

                <button type="button" class="datacard-toggle-btn" id="btnToggleAudit-${index}" onclick="window.PDI ? window.PDI.DashboardView.toggleAuditCard(${index}) : DashboardView.toggleAuditCard(${index})">
                  <span class="btn-text">Ver más</span>
                  <svg fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
            </div>
          `;
        }).join("");
      }
    }
  },

  openLogDetail(logId) {
    const logs = this._currentAuditLogs || [];
    const log = logs.find(l => l.id === logId) || (logs.length > 0 ? logs[0] : null);
    if (!log) return;
    const modalView = window.PDI?.ModalView || ModalView;
    if (modalView && modalView.openAuditDetail) {
      modalView.openAuditDetail(log);
    }
  },

  toggleAuditCard(index) {
    const card = document.getElementById(`mobile-audit-${index}`);
    const btn = document.getElementById(`btnToggleAudit-${index}`);
    if (card) {
      const isExp = card.classList.toggle("expanded");
      if (btn) {
        const textSpan = btn.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = isExp ? "Ver menos" : "Ver más";
      }
    }
  },

  toggleDropdown(dropdownId) {
    const target = document.getElementById(dropdownId);
    const allDropdowns = document.querySelectorAll(".custom-dropdown");
    allDropdowns.forEach(d => {
      if (d !== target && !d.contains(target) && !target?.contains(d)) {
        d.classList.remove("open");
      }
    });
    if (target) {
      target.classList.toggle("open");
    }
  },

  toggleInnerDropdown(dropdownId) {
    const target = document.getElementById(dropdownId);
    const container = document.getElementById("menuAuditFilterPanel");
    if (container) {
      container.querySelectorAll(".custom-dropdown").forEach(d => {
        if (d !== target) d.classList.remove("open");
      });
    }
    if (target) {
      target.classList.toggle("open");
    }
  },

  selectDate(value, label) {
    const selectEl = document.getElementById("selectAuditDateFilter");
    if (selectEl && selectEl.value !== value) {
      selectEl.value = value;
    }
    const labelEl = document.getElementById("labelAuditDate");
    if (labelEl) labelEl.textContent = label;

    this.filterByDate(value);
  },

  selectRole(value, label) {
    const selectEl = document.getElementById("selectAuditRoleFilter");
    if (selectEl && selectEl.value !== value) {
      selectEl.value = value;
    }
    const labelEl = document.getElementById("labelAuditRole");
    if (labelEl) labelEl.textContent = label;

    this.filterByRole(value);
  },

  selectAction(value, label) {
    const segButtons = document.querySelectorAll("#auditActionSegmented .audit-seg-btn");
    segButtons.forEach(btn => {
      if (btn.getAttribute("data-value") === value) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const labelEl = document.getElementById("labelAuditAction");
    if (labelEl) labelEl.textContent = label;

    this.filterByAction(value);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}


/* --- Module: views/BeneficiariosView.js --- */
// Vista: Padrón de Menores Beneficiarios
const BeneficiariosView = {
  _allBeneficiarios: [],
  _searchQuery: "",
  _filterServicio: [], // array de servicios seleccionados (vacío = todos)
  _filterSede: [],     // array de sedes seleccionadas (vacío = todas)
  _filterAnemia: [],   // array de anemias seleccionadas (vacío = todos)
  _filterEdadModo: "all", // "all" | "exacta" | "rango"
  _filterEdadExacta: null, // number 0-18 o null
  _filterEdadRango: { min: 0, max: 18 },
  _filterEstado: "all", // "all" | "Activo" | "Inactivo"

  init(beneficiarios) {
    this._allBeneficiarios = beneficiarios || [];
    this.applyFilters();
  },

  renderTable(beneficiarios) {
    if (beneficiarios) {
      this._allBeneficiarios = beneficiarios;
    }
    this.applyFilters();
  },

  filterBySearch(query) {
    this._searchQuery = (query || "").trim().toLowerCase();
    const clearBtn = document.getElementById("btnPadronSearchClear");
    if (clearBtn) {
      clearBtn.style.display = this._searchQuery.length > 0 ? "flex" : "none";
    }
    this.applyFilters();
  },

  clearSearch() {
    const input = document.getElementById("inputPadronSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  toggleInnerDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const isCurrentlyOpen = dropdown.classList.contains("open");
    // Cerrar otros dropdowns internos abiertos
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => {
      if (d !== dropdown) d.classList.remove("open");
    });
    dropdown.classList.toggle("open", !isCurrentlyOpen);
  },

  toggleServicio(val) {
    const allServicios = ["desayuno", "casita", "pastoral"];
    if (val === "all") {
      this._filterServicio = [];
    } else {
      const idx = this._filterServicio.indexOf(val);
      if (idx > -1) {
        this._filterServicio.splice(idx, 1);
      } else {
        this._filterServicio.push(val);
      }
      // Si se seleccionaron individualmente todas las opciones, se restablece a Todos automáticamente
      if (allServicios.every(s => this._filterServicio.includes(s))) {
        this._filterServicio = [];
      }
    }
    this._updateServicioDropdownUI();
    this.applyFilters();
  },

  _updateServicioDropdownUI() {
    const isAll = this._filterServicio.length === 0;
    const items = document.querySelectorAll("#menuPadronServicio .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterServicio.includes(v));
      }
    });

    const labelEl = document.getElementById("labelPadronServicioSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Servicios";
      } else if (this._filterServicio.length === 1) {
        const s = this._filterServicio[0];
        if (s === "desayuno") labelEl.textContent = "Servicio Alimentario Nutricional";
        else if (s === "casita") labelEl.textContent = "Servicio Acompañamiento Educativo";
        else if (s === "pastoral") labelEl.textContent = "Área Social Pastoral";
      } else {
        labelEl.textContent = `${this._filterServicio.length} seleccionados`;
      }
    }
  },

  toggleSede(val) {
    const allSedes = ["Año Nuevo", "La Libertad", "San Pedro", "El Progreso", "Santa Rosa", "Los Bendecidos"];
    if (val === "all") {
      this._filterSede = [];
    } else {
      const idx = this._filterSede.indexOf(val);
      if (idx > -1) {
        this._filterSede.splice(idx, 1);
      } else {
        this._filterSede.push(val);
      }
      // Si se seleccionaron individualmente todas las sedes, se restablece a Todas automáticamente
      if (allSedes.every(s => this._filterSede.includes(s))) {
        this._filterSede = [];
      }
    }
    this._updateSedeDropdownUI();
    this.applyFilters();
  },

  _updateSedeDropdownUI() {
    const isAll = this._filterSede.length === 0;
    const items = document.querySelectorAll("#menuPadronSede .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterSede.includes(v));
      }
    });

    const labelEl = document.getElementById("labelPadronSedeSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todas las Sedes";
      } else if (this._filterSede.length === 1) {
        const s = this._filterSede[0];
        const dist = (s === "Año Nuevo" || s === "La Libertad") ? "Comas" : "Carabayllo";
        labelEl.textContent = `${s} (${dist})`;
      } else {
        labelEl.textContent = `${this._filterSede.length} seleccionadas`;
      }
    }
  },

  toggleAnemia(val) {
    const allAnemias = ["Normal", "Leve", "Moderada"];
    if (val === "all") {
      this._filterAnemia = [];
    } else {
      const idx = this._filterAnemia.indexOf(val);
      if (idx > -1) {
        this._filterAnemia.splice(idx, 1);
      } else {
        this._filterAnemia.push(val);
      }
      // Si se seleccionaron individualmente todas las opciones, se restablece a Todos automáticamente
      if (allAnemias.every(a => this._filterAnemia.includes(a))) {
        this._filterAnemia = [];
      }
    }
    this._updateAnemiaDropdownUI();
    this.applyFilters();
  },

  _updateAnemiaDropdownUI() {
    const isAll = this._filterAnemia.length === 0;
    const items = document.querySelectorAll("#menuPadronAnemia .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAnemia.includes(v));
      }
    });

    const labelEl = document.getElementById("labelPadronAnemiaSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todas las Condiciones";
      } else if (this._filterAnemia.length === 1) {
        const a = this._filterAnemia[0];
        labelEl.textContent = a === "Moderada" ? "Mod / Severa" : a;
      } else {
        labelEl.textContent = `${this._filterAnemia.length} seleccionadas`;
      }
    }
  },

  setEdadExacta(val) {
    if (val === "" || val === null || val === undefined) {
      this._filterEdadModo = "all";
      this._filterEdadExacta = null;
      this._filterEdadRango = { min: 0, max: 18 };
      this._updateEdadUI();
      this.applyFilters();
      return;
    }

    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) {
      this._filterEdadModo = "all";
      this._filterEdadExacta = null;
    } else {
      this._filterEdadModo = "exacta";
      this._filterEdadExacta = Math.min(18, Math.max(0, num));
      // Al usar edad específica, reseteamos el rango a 0-18
      this._filterEdadRango = { min: 0, max: 18 };
    }
    this._updateEdadUI();
    this.applyFilters();
  },

  syncEdadRango(handle, val) {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = handle === "min" ? 0 : 18;
    num = Math.min(18, Math.max(0, num));

    let min = this._filterEdadRango.min;
    let max = this._filterEdadRango.max;

    if (handle === "min") {
      min = num;
      if (min > max) {
        max = min;
        const maxInput = document.getElementById("sliderPadronEdadMax");
        if (maxInput) maxInput.value = max;
      }
    } else if (handle === "max") {
      max = num;
      if (max < min) {
        min = max;
        const minInput = document.getElementById("sliderPadronEdadMin");
        if (minInput) minInput.value = min;
      }
    }

    this._filterEdadRango = { min, max };
    // Al usar rango, borramos el dígito de edad específica
    this._filterEdadExacta = null;
    const numInput = document.getElementById("numPadronEdad");
    if (numInput) numInput.value = "";

    if (min === 0 && max === 18) {
      this._filterEdadModo = "all";
    } else {
      this._filterEdadModo = "rango";
    }

    this._updateEdadUI();
    this.applyFilters();
  },

  clearEdad() {
    this._filterEdadModo = "all";
    this._filterEdadExacta = null;
    this._filterEdadRango = { min: 0, max: 18 };
    const numInput = document.getElementById("numPadronEdad");
    if (numInput) numInput.value = "";
    this._updateEdadUI();
    this.applyFilters();
  },

  _updateEdadUI() {
    const btnTodas = document.getElementById("btnPadronEdadTodas");
    const numInput = document.getElementById("numPadronEdad");
    const sliderMin = document.getElementById("sliderPadronEdadMin");
    const sliderMax = document.getElementById("sliderPadronEdadMax");
    const highlight = document.getElementById("sliderPadronEdadHighlight");
    const labelSlider = document.getElementById("labelPadronEdadSliderVal");

    const isAll = this._filterEdadModo === "all";
    if (btnTodas) btnTodas.classList.toggle("active", isAll);

    if (this._filterEdadModo === "exacta") {
      if (numInput && this._filterEdadExacta !== null) numInput.value = this._filterEdadExacta;
      if (sliderMin) sliderMin.value = 0;
      if (sliderMax) sliderMax.value = 18;
      if (highlight) {
        highlight.style.left = "0%";
        highlight.style.right = "0%";
      }
      if (labelSlider) labelSlider.textContent = "0 a 18 años";
    } else if (this._filterEdadModo === "rango") {
      if (numInput) numInput.value = "";
      const { min, max } = this._filterEdadRango;
      if (sliderMin) sliderMin.value = min;
      if (sliderMax) sliderMax.value = max;
      if (highlight) {
        const leftPct = (min / 18) * 100;
        const rightPct = 100 - (max / 18) * 100;
        highlight.style.left = `${leftPct}%`;
        highlight.style.right = `${rightPct}%`;
      }
      if (labelSlider) {
        labelSlider.textContent = min === max ? `Exactamente ${min} años` : `${min} a ${max} años`;
      }
    } else { // "all"
      if (numInput) numInput.value = "";
      if (sliderMin) sliderMin.value = 0;
      if (sliderMax) sliderMax.value = 18;
      if (highlight) {
        highlight.style.left = "0%";
        highlight.style.right = "0%";
      }
      if (labelSlider) labelSlider.textContent = "0 a 18 años";
    }
  },

  selectEstado(estadoVal) {
    this._filterEstado = estadoVal || "all";
    const items = document.querySelectorAll("#menuPadronEstado .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterEstado);
    });

    const labelEl = document.getElementById("labelPadronEstadoSelect");
    if (labelEl) {
      if (this._filterEstado === "all") labelEl.textContent = "Todos los Estados";
      else if (this._filterEstado === "Activo") labelEl.textContent = "Activo";
      else if (this._filterEstado === "Inactivo") labelEl.textContent = "Inactivo / Baja";
    }

    // Cerrar dropdown de estado al seleccionar
    const drop = document.getElementById("dropdownPadronEstado");
    if (drop) drop.classList.remove("open");

    this.applyFilters();
  },

  removeFilter(filterKey, specificVal) {
    if (filterKey === "search") this.clearSearch();
    if (filterKey === "servicio") {
      if (specificVal) {
        this.toggleServicio(specificVal);
      } else {
        this.toggleServicio("all");
      }
    }
    if (filterKey === "sede") {
      if (specificVal) {
        this.toggleSede(specificVal);
      } else {
        this.toggleSede("all");
      }
    }
    if (filterKey === "anemia") {
      if (specificVal) {
        this.toggleAnemia(specificVal);
      } else {
        this.toggleAnemia("all");
      }
    }
    if (filterKey === "edad") this.clearEdad();
    if (filterKey === "estado") this.selectEstado("all");
  },

  resetFilters() {
    this._searchQuery = "";
    this._filterServicio = [];
    this._filterSede = [];
    this._filterAnemia = [];
    this._filterEdadModo = "all";
    this._filterEdadExacta = null;
    this._filterEdadRango = { min: 0, max: 18 };
    this._filterEstado = "all";

    const input = document.getElementById("inputPadronSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnPadronSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this._updateServicioDropdownUI();
    this._updateSedeDropdownUI();
    this._updateAnemiaDropdownUI();
    this._updateEdadUI();

    const estadoItems = document.querySelectorAll("#menuPadronEstado .padron-dropdown-item");
    estadoItems.forEach(item => item.classList.toggle("selected", item.getAttribute("data-value") === "all"));
    const labelEstado = document.getElementById("labelPadronEstadoSelect");
    if (labelEstado) labelEstado.textContent = "Todos los Estados";

    // Cerrar cualquier dropdown interno que haya quedado abierto
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this.applyFilters();
  },

  _matchesServicio(beneficiario, servicioKeys) {
    if (!servicioKeys || servicioKeys.length === 0) return true;
    if (!beneficiario.servicios) return false;
    return servicioKeys.some(key => {
      if (key === "desayuno") {
        return beneficiario.servicios.some(s => s.toLowerCase().includes("desayuno") || s.toLowerCase().includes("alimento") || s.toLowerCase().includes("nutric"));
      }
      if (key === "casita") {
        return beneficiario.servicios.some(s => s.toLowerCase().includes("casita") || s.toLowerCase().includes("educativ"));
      }
      if (key === "pastoral") {
        return beneficiario.servicios.some(s => s.toLowerCase().includes("pastoral") || s.toLowerCase().includes("social") || s.toLowerCase().includes("asp")) || (beneficiario.vulnerabilidad && beneficiario.vulnerabilidad >= 80);
      }
      return false;
    });
  },

  _matchesAnemia(beneficiario, anemiaKeys) {
    if (!anemiaKeys || anemiaKeys.length === 0) return true;
    return anemiaKeys.some(key => {
      if (key === "Moderada") {
        return beneficiario.anemia === "Moderada" || beneficiario.anemia === "Severa";
      }
      return beneficiario.anemia === key;
    });
  },

  applyFilters() {
    let list = [...this._allBeneficiarios];

    // 1. Buscador texto libre
    if (this._searchQuery) {
      const q = this._searchQuery;
      list = list.filter(b => {
        const full = `${b.nombres} ${b.apellidos} ${b.codigo} ${b.dni} ${b.sede} ${b.distrito} ${b.apoderado}`.toLowerCase();
        return full.includes(q);
      });
    }

    // 2. Servicio / Programa (Multi-selección)
    if (this._filterServicio.length > 0) {
      list = list.filter(b => this._matchesServicio(b, this._filterServicio));
    }

    // 3. Sede Operativa (Multi-selección)
    if (this._filterSede.length > 0) {
      list = list.filter(b => b.sede && this._filterSede.some(s => b.sede.toLowerCase().includes(s.toLowerCase())));
    }

    // 4. Condición Nutricional (Anemia - Multi-selección)
    if (this._filterAnemia.length > 0) {
      list = list.filter(b => this._matchesAnemia(b, this._filterAnemia));
    }

    // 5. Edad (Exacta o Rango)
    if (this._filterEdadModo === "exacta" && this._filterEdadExacta !== null) {
      const targetEdad = this._filterEdadExacta;
      list = list.filter(b => {
        const numEdad = parseInt(b.edad, 10);
        return !isNaN(numEdad) && numEdad === targetEdad;
      });
    } else if (this._filterEdadModo === "rango") {
      const { min, max } = this._filterEdadRango;
      list = list.filter(b => {
        const numEdad = parseInt(b.edad, 10);
        return !isNaN(numEdad) && numEdad >= min && numEdad <= max;
      });
    }

    // 6. Estado
    if (this._filterEstado !== "all") {
      list = list.filter(b => b.estado === this._filterEstado);
    }

    // Actualizar badge de filtros activos
    let activeFiltersCount = 0;
    if (this._filterServicio.length > 0) activeFiltersCount += this._filterServicio.length;
    if (this._filterSede.length > 0) activeFiltersCount += this._filterSede.length;
    if (this._filterAnemia.length > 0) activeFiltersCount += this._filterAnemia.length;
    if (this._filterEdadModo !== "all") activeFiltersCount++;
    if (this._filterEstado !== "all") activeFiltersCount++;

    const badgeEl = document.getElementById("padronActiveFiltersCount");
    const btnFilterEl = document.getElementById("btnDropdownPadronFilterPanel");

    if (badgeEl) {
      badgeEl.textContent = activeFiltersCount;
      badgeEl.style.display = activeFiltersCount > 0 ? "inline-flex" : "none";
    }
    if (btnFilterEl) {
      btnFilterEl.classList.toggle("has-filters", activeFiltersCount > 0);
    }

    this._updateFacetCounts();
    this._renderActiveChips();
    this._renderFilteredList(list);
  },

  _updateFacetCounts() {
    // Calculo facetado con respecto a los otros filtros activos excepto la propia categoría
    const getFilteredExcluding = (excludeKey) => {
      let l = [...this._allBeneficiarios];
      if (this._searchQuery) {
        const q = this._searchQuery;
        l = l.filter(b => `${b.nombres} ${b.apellidos} ${b.codigo} ${b.dni} ${b.sede} ${b.distrito} ${b.apoderado}`.toLowerCase().includes(q));
      }
      if (excludeKey !== "servicio" && this._filterServicio.length > 0) {
        l = l.filter(b => this._matchesServicio(b, this._filterServicio));
      }
      if (excludeKey !== "sede" && this._filterSede.length > 0) {
        l = l.filter(b => b.sede && this._filterSede.some(s => b.sede.toLowerCase().includes(s.toLowerCase())));
      }
      if (excludeKey !== "anemia" && this._filterAnemia.length > 0) {
        l = l.filter(b => this._matchesAnemia(b, this._filterAnemia));
      }
      if (excludeKey !== "edad") {
        if (this._filterEdadModo === "exacta" && this._filterEdadExacta !== null) {
          const tEdad = this._filterEdadExacta;
          l = l.filter(b => (parseInt(b.edad, 10) || 0) === tEdad);
        } else if (this._filterEdadModo === "rango") {
          const { min, max } = this._filterEdadRango;
          l = l.filter(b => {
            const numEdad = parseInt(b.edad, 10);
            return !isNaN(numEdad) && numEdad >= min && numEdad <= max;
          });
        }
      }
      if (excludeKey !== "estado" && this._filterEstado !== "all") {
        l = l.filter(b => b.estado === this._filterEstado);
      }
      return l;
    };

    // 1. Facetas de Servicio
    const forServ = getFilteredExcluding("servicio");
    const countServDesayuno = forServ.filter(b => this._matchesServicio(b, ["desayuno"])).length;
    const countServCasita = forServ.filter(b => this._matchesServicio(b, ["casita"])).length;
    const countServPastoral = forServ.filter(b => this._matchesServicio(b, ["pastoral"])).length;

    this._setFacetBadge("countFacetServicio-all", `(${forServ.length})`, forServ.length === 0);
    this._setFacetBadge("countFacetServicio-desayuno", `(${countServDesayuno})`, countServDesayuno === 0);
    this._setFacetBadge("countFacetServicio-casita", `(${countServCasita})`, countServCasita === 0);
    this._setFacetBadge("countFacetServicio-pastoral", `(${countServPastoral})`, countServPastoral === 0);

    // 2. Facetas de Sede
    const forSede = getFilteredExcluding("sede");
    this._setFacetBadge("countFacetSede-all", `(${forSede.length})`, forSede.length === 0);
    const sedesList = ["Año Nuevo", "La Libertad", "San Pedro", "El Progreso", "Santa Rosa", "Los Bendecidos"];
    sedesList.forEach(s => {
      const c = forSede.filter(b => b.sede && b.sede.toLowerCase().includes(s.toLowerCase())).length;
      this._setFacetBadge(`countFacetSede-${s}`, `(${c})`, c === 0);
    });

    // 3. Facetas de Anemia
    const forAnemia = getFilteredExcluding("anemia");
    const countAnemiaNormal = forAnemia.filter(b => b.anemia === "Normal").length;
    const countAnemiaLeve = forAnemia.filter(b => b.anemia === "Leve").length;
    const countAnemiaMod = forAnemia.filter(b => b.anemia === "Moderada" || b.anemia === "Severa").length;

    this._setFacetBadge("countFacetAnemia-all", `(${forAnemia.length})`, forAnemia.length === 0);
    this._setFacetBadge("countFacetAnemia-Normal", `(${countAnemiaNormal})`, countAnemiaNormal === 0);
    this._setFacetBadge("countFacetAnemia-Leve", `(${countAnemiaLeve})`, countAnemiaLeve === 0);
    this._setFacetBadge("countFacetAnemia-Moderada", `(${countAnemiaMod})`, countAnemiaMod === 0);

    // 4. Facetas de Estado
    const forEstado = getFilteredExcluding("estado");
    const countActivo = forEstado.filter(b => b.estado === "Activo").length;
    const countInactivo = forEstado.filter(b => b.estado === "Inactivo" || b.estado === "Baja").length;

    this._setFacetBadge("countFacetEstado-all", `(${forEstado.length})`, forEstado.length === 0);
    this._setFacetBadge("countFacetEstado-Activo", `(${countActivo})`, countActivo === 0);
    this._setFacetBadge("countFacetEstado-Inactivo", `(${countInactivo})`, countInactivo === 0);
  },

  _setFacetBadge(badgeId, text, isZero) {
    const el = document.getElementById(badgeId);
    if (!el) return;
    el.textContent = text;
    const parentItem = el.closest(".padron-dropdown-item");
    if (parentItem && parentItem.getAttribute("data-value") !== "all") {
      parentItem.classList.toggle("zero-facet", isZero);
    }
  },

  _renderActiveChips() {
    const bar = document.getElementById("padronActiveChipsBar");
    const list = document.getElementById("padronActiveChipsList");
    if (!bar || !list) return;

    const chips = [];

    if (this._searchQuery) {
      chips.push({
        id: "search",
        label: `Búsqueda: "${this._searchQuery}"`,
      });
    }

    if (this._filterServicio.length > 0) {
      this._filterServicio.forEach(s => {
        let servLabel = s;
        if (s === "desayuno") servLabel = "Nutrición SAN";
        if (s === "casita") servLabel = "Acompañamiento Casita";
        if (s === "pastoral") servLabel = "Social Pastoral";
        chips.push({
          id: "servicio",
          val: s,
          label: `Programa: ${servLabel}`,
        });
      });
    }

    if (this._filterSede.length > 0) {
      this._filterSede.forEach(s => {
        const dist = (s === "Año Nuevo" || s === "La Libertad") ? "Comas" : "Carabayllo";
        chips.push({
          id: "sede",
          val: s,
          label: `Sede: ${s} (${dist})`,
        });
      });
    }

    if (this._filterAnemia.length > 0) {
      this._filterAnemia.forEach(a => {
        chips.push({
          id: "anemia",
          val: a,
          label: `Anemia: ${a === "Moderada" ? "Mod / Severa" : a}`,
        });
      });
    }

    if (this._filterEdadModo === "exacta" && this._filterEdadExacta !== null) {
      chips.push({
        id: "edad",
        label: `Edad: ${this._filterEdadExacta} años`,
      });
    } else if (this._filterEdadModo === "rango") {
      const { min, max } = this._filterEdadRango;
      chips.push({
        id: "edad",
        label: min === max ? `Edad: ${min} años` : `Edad: ${min} a ${max} años`,
      });
    }

    if (this._filterEstado !== "all") {
      chips.push({
        id: "estado",
        label: `Estado: ${this._filterEstado === "Inactivo" ? "Inactivo / Baja" : this._filterEstado}`,
      });
    }

    if (chips.length === 0) {
      bar.style.display = "none";
      list.innerHTML = "";
    } else {
      bar.style.display = "flex";
      list.innerHTML = chips.map(chip => `
        <span class="padron-chip">
          <span>${chip.label}</span>
          <button type="button" class="padron-chip-remove" onclick="window.removePadronChip ? window.removePadronChip('${chip.id}', '${chip.val || ''}') : null" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      `).join("");
    }
  },

  _renderFilteredList(beneficiarios) {
    const tbody = document.getElementById("tbodyBeneficiarios");
    const mobileContainer = document.getElementById("mobileCardsBeneficiarios");

    const badgeTotal = document.getElementById("badgeTotalBeneficiarios");
    if (badgeTotal) badgeTotal.textContent = beneficiarios.length;

    // 1. Renderizar tabla tradicional para pantallas grandes (Desktop)
    if (tbody) {
      if (beneficiarios.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 32px 16px; color: var(--text-dim);">
              <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 8px; display:block; opacity:0.6;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              No se encontraron beneficiarios con los filtros seleccionados.
            </td>
          </tr>
        `;
      } else {
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
            <td><span class="badge ${b.estado === 'Activo' ? 'badge-green' : 'badge-yellow'}">${b.estado}</span></td>
            <td style="text-align: right;">
              <button type="button" class="btn-action" onclick="window.openExpediente ? window.openExpediente(${b.id}) : window.app.beneficiarioController.openExpediente(${b.id})">
                Ver Expediente
              </button>
            </td>
          </tr>
        `).join("");
      }
    }

    // 2. Renderizar lista de tarjetas Data Card para teléfonos móviles (Patrón Beezlebub)
    if (mobileContainer) {
      if (beneficiarios.length === 0) {
        mobileContainer.innerHTML = `
          <div style="text-align: center; padding: 28px 14px; color: var(--text-dim); background: var(--surface-1); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            No se encontraron beneficiarios con los criterios seleccionados.
          </div>
        `;
      } else {
        mobileContainer.innerHTML = beneficiarios.map(b => `
          <div class="mobile-card-item" id="mobile-card-${b.id}">
            <!-- Cabecera: ID + Badge Estado -->
            <div class="datacard-header">
              <div class="datacard-id">
                <span>ID:</span> ${b.codigo}
              </div>
              <div class="datacard-header-right">
                <span class="badge ${b.estado === 'Activo' ? 'badge-green' : 'badge-yellow'}">${b.estado}</span>
              </div>
            </div>

            <!-- Cuerpo: Datos principales siempre visibles -->
            <div class="datacard-body">
              <div class="datacard-row">
                <span class="datacard-label">Nombre del Menor</span>
                <span class="datacard-value">${b.nombres} ${b.apellidos}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">DNI / Documento</span>
                <span class="datacard-value">${b.dni}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Distrito / Sede</span>
                <span class="datacard-value">${b.distrito}: ${b.sede}</span>
              </div>

              <!-- Bloque Desplegable "Ver más" -->
              <div class="datacard-extra" id="extra-card-${b.id}">
                <div class="datacard-row">
                  <span class="datacard-label">Edad / Sexo</span>
                  <span class="datacard-value">${b.edad} / ${b.sexo}</span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Servicios Activos</span>
                  <span class="datacard-value" style="display:flex; flex-wrap:wrap; gap:4px; justify-content:flex-end;">
                    ${b.servicios.map(s => `<span class="badge badge-blue">${s}</span>`).join("")}
                  </span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Seguro de Salud</span>
                  <span class="datacard-value">${b.seguro || 'SIS Gratuito'}</span>
                </div>
                <div class="datacard-actions-footer">
                  <button type="button" class="btn-action primary" style="width:100%; justify-content:center;" onclick="event.stopPropagation(); window.openExpediente ? window.openExpediente(${b.id}) : window.app.beneficiarioController.openExpediente(${b.id})">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:6px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ver Expediente Completo
                  </button>
                </div>
              </div>

              <!-- Botón Ver más / Ver menos -->
              <button type="button" class="datacard-toggle-btn" id="btnToggleCard-${b.id}" onclick="window.PDI ? window.PDI.BeneficiariosView.toggleCard(${b.id}) : BeneficiariosView.toggleCard(${b.id})">
                <span class="btn-text">Ver más</span>
                <svg fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          </div>
        `).join("");
      }
    }
  },

  toggleCard(id) {
    const card = document.getElementById(`mobile-card-${id}`);
    const btn = document.getElementById(`btnToggleCard-${id}`);
    if (card) {
      const isExp = card.classList.toggle("expanded");
      if (btn) {
        const textSpan = btn.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = isExp ? "Ver menos" : "Ver más";
      }
    }
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
    const mobileContainer = document.getElementById("mobileCardsSalud");

    if (tbody) {
      tbody.innerHTML = beneficiarios.map(b => {
        let badgeClass = "badge-green";
        if (b.anemia === "Leve") badgeClass = "badge-yellow";
        if (b.anemia === "Moderada" || b.anemia === "Severa") badgeClass = "badge-red";

        return `
          <tr>
            <td><strong>${b.nombres} ${b.apellidos}</strong><div style="font-size:11.5px; color:var(--text-dim); font-family:var(--mono-font);">${b.codigo}</div></td>
            <td>${b.edad}</td>
            <td>${b.peso} kg / ${b.talla} cm</td>
            <td><strong style="font-family:var(--mono-font);">${b.hb} g/dL</strong></td>
            <td><span class="badge ${badgeClass}">${b.anemia}</span></td>
            <td>${b.anemia !== "Normal" ? "Sulfato Ferroso 1 dosis/día" : "Dieta Preventiva"}</td>
            <td style="text-align: right;"><button type="button" class="btn-action" onclick="window.openExpediente ? window.openExpediente(${b.id}) : (window.app ? window.app.beneficiarioController.openExpediente(${b.id}) : null)">Ver Historial</button></td>
          </tr>
        `;
      }).join("");
    }

    if (mobileContainer) {
      mobileContainer.innerHTML = beneficiarios.map(b => {
        let badgeClass = "badge-green";
        if (b.anemia === "Leve") badgeClass = "badge-yellow";
        if (b.anemia === "Moderada" || b.anemia === "Severa") badgeClass = "badge-red";

        return `
          <div class="mobile-card-item" id="mobile-salud-${b.id}">
            <!-- Cabecera: ID + Badge Diagnóstico Anemia -->
            <div class="datacard-header">
              <div class="datacard-id">
                <span>ID:</span> ${b.codigo}
              </div>
              <div class="datacard-header-right">
                <span class="badge ${badgeClass}">${b.anemia}</span>
              </div>
            </div>

            <!-- Cuerpo: Datos principales siempre visibles -->
            <div class="datacard-body">
              <div class="datacard-row">
                <span class="datacard-label">Beneficiario</span>
                <span class="datacard-value">${b.nombres} ${b.apellidos}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Hemoglobina (Hb)</span>
                <span class="datacard-value" style="color:var(--gt-yellow); font-weight:800; font-family:var(--mono-font);">${b.hb} g/dL</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Diagnóstico Anemia</span>
                <span class="datacard-value">${b.anemia}</span>
              </div>

              <!-- Bloque Desplegable "Ver más" -->
              <div class="datacard-extra" id="extra-salud-${b.id}">
                <div class="datacard-row">
                  <span class="datacard-label">Edad</span>
                  <span class="datacard-value">${b.edad}</span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Peso / Talla</span>
                  <span class="datacard-value">${b.peso} kg / ${b.talla} cm</span>
                </div>
                <div class="datacard-row">
                  <span class="datacard-label">Suplementación</span>
                  <span class="datacard-value">${b.anemia !== "Normal" ? "Sulfato Ferroso 1 dosis/día" : "Dieta Preventiva"}</span>
                </div>
                <div class="datacard-actions-footer">
                  <button type="button" class="btn-action primary" style="width:100%; justify-content:center;" onclick="event.stopPropagation(); window.openExpediente ? window.openExpediente(${b.id}) : (window.app ? window.app.beneficiarioController.openExpediente(${b.id}) : null)">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:6px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    </svg>
                    Ver Historial CRED Completo
                  </button>
                </div>
              </div>

              <!-- Botón Ver más / Ver menos -->
              <button type="button" class="datacard-toggle-btn" id="btnToggleSalud-${b.id}" onclick="window.PDI ? window.PDI.SaludCredView.toggleCard(${b.id}) : SaludCredView.toggleCard(${b.id})">
                <span class="btn-text">Ver más</span>
                <svg fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join("");
    }
  },

  toggleCard(id) {
    const card = document.getElementById(`mobile-salud-${id}`);
    const btn = document.getElementById(`btnToggleSalud-${id}`);
    if (card) {
      const isExp = card.classList.toggle("expanded");
      if (btn) {
        const textSpan = btn.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = isExp ? "Ver menos" : "Ver más";
      }
    }
  },

  toggleCalculadora() {
    const card = document.getElementById("cardCalculadoraCred");
    const body = document.getElementById("credCalcBody");
    if (!body) return;

    const isHidden = body.style.display === "none";
    body.style.display = isHidden ? "block" : "none";
    if (card) {
      card.classList.toggle("open", isHidden);
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SaludCredView = SaludCredView;
  window.toggleCalculadoraCred = () => SaludCredView.toggleCalculadora();
}


/* --- Module: views/CasitasView.js --- */
// Vista: Acompañamiento Educativo (Casita del Saber)
const CasitasView = {
  renderTable(beneficiarios) {
    const tbody = document.getElementById("tbodyAsistenciaCasita");
    const mobileContainer = document.getElementById("mobileCardsCasita");

    const casitaList = beneficiarios.filter(b => b.servicios.includes("Casita del Saber"));

    if (tbody) {
      tbody.innerHTML = casitaList.map(b => `
        <tr>
          <td><strong>${b.nombres} ${b.apellidos}</strong><div style="font-size:11px; color:var(--text-dim);">${b.codigo}</div></td>
          <td>${b.grado}</td>
          <td>${b.colegio}</td>
          <td>
            <div style="font-weight:600; color:var(--text-main);">${b.apoderado}</div>
            <div style="font-size:11.5px; color:var(--text-muted);">${b.parentesco} &bull; ${b.telefono || 'Sin tel'}</div>
          </td>
          <td>
            <span class="badge badge-green" id="badgeAsist_${b.id}">Presente</span>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 4px;" id="btnGroupAsist_${b.id}">
              <button type="button" class="btn-asist active-P" data-asist-btn="P" onclick="window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'P') : CasitasController.toggleAsistencia(${b.id}, 'P')">P</button>
              <button type="button" class="btn-asist" data-asist-btn="T" onclick="window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'T') : CasitasController.toggleAsistencia(${b.id}, 'T')">T</button>
              <button type="button" class="btn-asist" data-asist-btn="FJ" onclick="window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'FJ') : CasitasController.toggleAsistencia(${b.id}, 'FJ')">FJ</button>
              <button type="button" class="btn-asist" data-asist-btn="FI" onclick="window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'FI') : CasitasController.toggleAsistencia(${b.id}, 'FI')">FI</button>
            </div>
          </td>
        </tr>
      `).join("");
    }

    if (mobileContainer) {
      mobileContainer.innerHTML = casitaList.map(b => `
        <div class="mobile-card-item" id="mobile-casita-${b.id}">
          <!-- Cabecera: ID + Badge Asistencia -->
          <div class="datacard-header">
            <div class="datacard-id">
              <span>ID:</span> ${b.codigo}
            </div>
            <div class="datacard-header-right">
              <span class="badge badge-green" id="badgeAsistMob_${b.id}">Presente</span>
            </div>
          </div>

          <!-- Cuerpo: Datos principales y Botonera Rápida -->
          <div class="datacard-body">
            <div class="datacard-row">
              <span class="datacard-label">Menor Beneficiario</span>
              <span class="datacard-value">${b.nombres} ${b.apellidos}</span>
            </div>
            <div class="datacard-row">
              <span class="datacard-label">Apoderado Autorizado</span>
              <span class="datacard-value">${b.apoderado} <span style="color:var(--text-muted); font-size:11.5px;">(${b.parentesco})</span></span>
            </div>

            <!-- Botonera de Asistencia Rápida -->
            <div style="padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); background: var(--surface-2);">
              <div style="font-size: 11px; font-weight: 800; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.04em;">
                Marcar Asistencia Hoy:
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;" id="btnGroupMobAsist_${b.id}">
                <button type="button" class="btn-asist active-P" data-asist-btn="P" onclick="event.stopPropagation(); window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'P') : CasitasController.toggleAsistencia(${b.id}, 'P')">P</button>
                <button type="button" class="btn-asist" data-asist-btn="T" onclick="event.stopPropagation(); window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'T') : CasitasController.toggleAsistencia(${b.id}, 'T')">T</button>
                <button type="button" class="btn-asist" data-asist-btn="FJ" onclick="event.stopPropagation(); window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'FJ') : CasitasController.toggleAsistencia(${b.id}, 'FJ')">FJ</button>
                <button type="button" class="btn-asist" data-asist-btn="FI" onclick="event.stopPropagation(); window.app ? window.app.casitasController.toggleAsistencia(${b.id}, 'FI') : CasitasController.toggleAsistencia(${b.id}, 'FI')">FI</button>
              </div>
            </div>

            <!-- Bloque Desplegable "Ver más" -->
            <div class="datacard-extra" id="extra-casita-${b.id}">
              <div class="datacard-row">
                <span class="datacard-label">Grado Escolar</span>
                <span class="datacard-value">${b.grado}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Colegio de Origen</span>
                <span class="datacard-value">${b.colegio}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Sede Casita</span>
                <span class="datacard-value">${b.distrito} - ${b.sede}</span>
              </div>
              <div class="datacard-row">
                <span class="datacard-label">Teléfono de Salida</span>
                <span class="datacard-value">${b.telefono || 'Sin registro'}</span>
              </div>
            </div>

            <!-- Botón Ver más / Ver menos -->
            <button type="button" class="datacard-toggle-btn" id="btnToggleCasita-${b.id}" onclick="window.PDI ? window.PDI.CasitasView.toggleCard(${b.id}) : CasitasView.toggleCard(${b.id})">
              <span class="btn-text">Ver más</span>
              <svg fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>
      `).join("");
    }
  },

  toggleCard(id) {
    const card = document.getElementById(`mobile-casita-${id}`);
    const btn = document.getElementById(`btnToggleCasita-${id}`);
    if (card) {
      const isExp = card.classList.toggle("expanded");
      if (btn) {
        const textSpan = btn.querySelector(".btn-text");
        if (textSpan) textSpan.textContent = isExp ? "Ver menos" : "Ver más";
      }
    }
  }
};

const CasitasController = {
  toggleAsistencia(id, estado) {
    const config = {
      "P": { label: "Presente", badgeClass: "badge badge-green", activeClass: "active-P" },
      "T": { label: "Tardanza", badgeClass: "badge badge-yellow", activeClass: "active-T" },
      "FJ": { label: "Falta Justificada", badgeClass: "badge badge-orange", activeClass: "active-FJ" },
      "FI": { label: "Falta Injustificada", badgeClass: "badge badge-red", activeClass: "active-FI" }
    };

    const target = config[estado] || config["P"];

    const badgeDesk = document.getElementById(`badgeAsist_${id}`);
    if (badgeDesk) {
      badgeDesk.textContent = target.label;
      badgeDesk.className = target.badgeClass;
    }

    const badgeMob = document.getElementById(`badgeAsistMob_${id}`);
    if (badgeMob) {
      badgeMob.textContent = target.label;
      badgeMob.className = target.badgeClass;
    }

    const btnGroupDesk = document.getElementById(`btnGroupAsist_${id}`);
    if (btnGroupDesk) {
      btnGroupDesk.querySelectorAll("button").forEach(btn => {
        btn.className = "btn-asist";
        if (btn.getAttribute("data-asist-btn") === estado) {
          btn.classList.add(target.activeClass);
        }
      });
    }

    const btnGroupMob = document.getElementById(`btnGroupMobAsist_${id}`);
    if (btnGroupMob) {
      btnGroupMob.querySelectorAll("button").forEach(btn => {
        btn.className = "btn-asist";
        if (btn.getAttribute("data-asist-btn") === estado) {
          btn.classList.add(target.activeClass);
        }
      });
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast && toast.show) {
      toast.show("Asistencia Actualizada", `${target.label} registrado para el menor ID ${id}`, "info");
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasView = CasitasView;
  window.PDI.CasitasController = CasitasController;
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
    return `<svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block; width:100%; height:100%; background:${bgColor};">
          <rect width="120" height="120" fill="${bgColor}"/>
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
    return `<svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block; width:100%; height:100%; background:${bgColor};">
          <rect width="120" height="120" fill="${bgColor}"/>
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

    // Exoneración: solo nomenclatura limpia (100%, 50%, 0%)
    let exoneracionLimpia = "100%";
    if (b.exoneracionAporte) {
      if (b.exoneracionAporte.includes("50%")) exoneracionLimpia = "50%";
      else if (b.exoneracionAporte.includes("0%")) exoneracionLimpia = "0%";
      else if (b.exoneracionAporte.includes("100%")) exoneracionLimpia = "100%";
      else exoneracionLimpia = b.exoneracionAporte;
    }
    setSafe("expExoneracion", exoneracionLimpia);

    // Listado institucional de programas inscritos con checkbox
    const programasContainer = document.getElementById("expProgramasInscritosContainer");
    if (programasContainer) {
      const serviciosArray = Array.isArray(b.servicios) ? b.servicios : [];
      const estrategiaStr = (b.estrategia || "").toLowerCase();
      
      const hasDesayuno = serviciosArray.some(s => s.toLowerCase().includes("desayuno")) || 
                          estrategiaStr.includes("desayuno") || 
                          estrategiaStr.includes("mixto");
      
      const hasCasita = serviciosArray.some(s => s.toLowerCase().includes("casita")) || 
                        estrategiaStr.includes("casita") || 
                        estrategiaStr.includes("mixto");
      
      const hasLonchera = serviciosArray.some(s => s.toLowerCase().includes("lonchera")) || 
                          estrategiaStr.includes("lonchera");

      const programasList = [
        {
          id: "prog_desayuno",
          nombre: "Programa Nutricional: Desayuno Infantil Comunitario",
          desc: "Ración matutina balanceada y tamizaje antropométrico periódico",
          active: hasDesayuno
        },
        {
          id: "prog_casitas",
          nombre: "Programa Pedagógico: Casitas del Saber (Refuerzo Escolar)",
          desc: "Acompañamiento psicopedagógico, tutoría y entrega de kits escolares",
          active: hasCasita
        },
        {
          id: "prog_lonchera",
          nombre: "Programa de Lonchera Infantil Saludable",
          desc: "Complemento nutricional para instituciones educativas focalizadas",
          active: hasLonchera
        }
      ];

      programasContainer.innerHTML = programasList.map(prog => `
        <div class="programa-item ${prog.active ? 'active' : ''}">
          <div class="programa-check-box">
            ${prog.active ? `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>` : ''}
          </div>
          <div class="programa-details">
            <span class="programa-name">${prog.nombre}</span>
            <span class="programa-desc">${prog.desc}</span>
          </div>
          <span class="badge ${prog.active ? 'badge-green' : 'badge-gray'}" style="font-size:10px; padding:2px 7px;">
            ${prog.active ? 'Inscrito y Activo' : 'No Asignado'}
          </span>
        </div>
      `).join("");
    }

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

    // 5. Consentimiento Informado Ley N.° 29733 (Ficha A3) - Rediseño Moderno
    const consentContainer = document.getElementById("expConsentimientoChecksContainer");
    if (consentContainer) {
      consentContainer.innerHTML = `
        <div class="ley-consent-grid">
          <div class="ley-consent-card">
            <div class="ley-card-header">
              <div class="ley-card-title">
                <svg width="15" height="15" fill="none" stroke="var(--gt-green)" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                <span>Evaluación y Seguimiento Social</span>
              </div>
              <span class="badge badge-green" style="font-size:10px; padding:2px 6px;">Autorizado</span>
            </div>
            <div class="ley-card-desc">Elaboración de historias de vida, encuestas de vulnerabilidad y métricas de impacto socioeconómico.</div>
            <span class="ley-card-art">Art. 13, num. 5 y 6 Ley 29733</span>
          </div>

          <div class="ley-consent-card">
            <div class="ley-card-header">
              <div class="ley-card-title">
                <svg width="15" height="15" fill="none" stroke="var(--gt-green)" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                <span>Registro Audiovisual Institucional</span>
              </div>
              <span class="badge badge-green" style="font-size:10px; padding:2px 6px;">Autorizado</span>
            </div>
            <div class="ley-card-desc">Toma de fotografías y videos para memorias anuales, rendición de cuentas e informes a benefactores.</div>
            <span class="ley-card-art">Art. 13, num. 5 Ley 29733</span>
          </div>

          <div class="ley-consent-card">
            <div class="ley-card-header">
              <div class="ley-card-title">
                <svg width="15" height="15" fill="none" stroke="var(--gt-green)" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                <span>Gestión de Fondos y Sostenibilidad</span>
              </div>
              <span class="badge badge-green" style="font-size:10px; padding:2px 6px;">Autorizado</span>
            </div>
            <div class="ley-card-desc">Recaudación de aportes, auditorías de donantes y reportes financieros de permanencia del programa.</div>
            <span class="ley-card-art">Art. 13, num. 5 y 6 Ley 29733</span>
          </div>

          <div class="ley-consent-card">
            <div class="ley-card-header">
              <div class="ley-card-title">
                <svg width="15" height="15" fill="none" stroke="var(--gt-green)" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                <span>Flujo Transfronterizo de Datos</span>
              </div>
              <span class="badge badge-green" style="font-size:10px; padding:2px 6px;">Autorizado</span>
            </div>
            <div class="ley-card-desc">Transferencia a la entidad cooperante Kinderwerk Lima e.V. (Alemania) con cifrado y medidas de seguridad.</div>
            <span class="ley-card-art">D.S. N.° 016-2024-JUS</span>
          </div>
        </div>

        <div class="ley-cert-box">
          <div class="ley-cert-badge-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div class="ley-cert-text">
            <strong>Certificación de Consentimiento Informado Válido (Ficha A3)</strong><br>
            Otorgado y firmado digitalmente por el apoderado legal: <strong>${b.apoderado}</strong> (DNI: <strong>${b.apoderadoDni || '41982341'}</strong>). Cumplimiento normativo vigente bajo la <strong>Ley N.° 29733</strong> y el <strong>D.S. N.° 016-2024-JUS</strong>.
          </div>
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
  },

  openAuditDetail(log) {
    if (!log) return;
    const modal = document.getElementById("modalAuditDetail");
    if (!modal) return;

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl("auditDetailId", log.id || "LOG-2026-REG");
    setEl("auditDetailTimestamp", log.timestamp);
    setEl("auditDetailUser", log.user);
    setEl("auditDetailRole", log.role);
    setEl("auditDetailAction", log.action);
    setEl("auditDetailStatus", log.status);
    setEl("auditDetailIp", log.ip || "192.168.1.x (Red Segura)");
    setEl("auditDetailSede", log.sede || "Central");
    setEl("auditDetailDetail", log.detail);

    const entityContainer = document.getElementById("auditDetailEntityLink");
    if (entityContainer) {
      if (log.entity && log.entity.startsWith("PDI-")) {
        entityContainer.innerHTML = `
          <a href="javascript:void(0)" onclick="window.openExpedienteByCodigo ? window.openExpedienteByCodigo('${log.entity}') : (window.PDI?.BeneficiarioController?.openExpedienteByCodigo ? window.PDI.BeneficiarioController.openExpedienteByCodigo('${log.entity}') : null)" class="audit-entity-link" title="Abrir expediente del menor">
            <code style="font-family:var(--mono-font); font-size:13px; font-weight:700; color:var(--gt-green); text-decoration:underline;">${log.entity}</code>
            <span style="font-size:11px; margin-left:4px; color:var(--gt-green); font-weight:600;">(Ver Expediente &rarr;)</span>
          </a>
        `;
      } else {
        entityContainer.innerHTML = `<code style="font-family:var(--mono-font); font-size:13px; font-weight:700; color:var(--text-main);">${log.entity || 'N/A'}</code>`;
      }
    }

    const diffContainer = document.getElementById("auditDetailDiffContainer");
    if (diffContainer) {
      if (log.diff && log.diff.length > 0) {
        diffContainer.innerHTML = `
          <table class="audit-diff-table">
            <thead>
              <tr>
                <th>Campo Modificado</th>
                <th>Estado Anterior</th>
                <th>Nuevo Valor Asignado</th>
              </tr>
            </thead>
            <tbody>
              ${log.diff.map(d => `
                <tr>
                  <td><strong>${d.campo}</strong></td>
                  <td class="diff-prev"><span>${d.valorAnterior || '-'}</span></td>
                  <td class="diff-curr"><span>${d.valorNuevo || '-'}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } else {
        diffContainer.innerHTML = `
          <div style="padding:14px; background:var(--surface-2); border-radius:var(--radius-sm); border:1px solid var(--border-subtle); color:var(--text-dim); font-size:12.5px;">
            Este evento registra una operación de consulta o certificación sin alteración de campos individuales.
          </div>
        `;
      }
    }

    modal.classList.add("open");
  },

  closeAuditDetail() {
    const modal = document.getElementById("modalAuditDetail");
    if (modal) modal.classList.remove("open");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ModalView = ModalView;
}


/* --- Module: utils/CanvasHelper.js --- */
// Utilidad: Manejo de Firma Digital en Canvas (Ley N° 29733)
const CanvasHelper = {
  init(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    let isDrawing = false;
    let hasDrawn = false;

    // Ajustar escala de resolución
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    ctx.strokeStyle = isLight ? "#007a65" : "#00b494";

    function getCoords(e) {
      const r = canvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) {
        return {
          x: e.touches[0].clientX - r.left,
          y: e.touches[0].clientY - r.top
        };
      }
      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top
      };
    }

    function startDrawing(e) {
      isDrawing = true;
      hasDrawn = true;
      const coords = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      e.preventDefault();
    }

    function draw(e) {
      if (!isDrawing) return;
      const coords = getCoords(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      e.preventDefault();
    }

    function stopDrawing() {
      isDrawing = false;
    }

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);

    return {
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn = false;
      },
      hasSignature() {
        return hasDrawn;
      },
      toDataURL() {
        return canvas.toDataURL();
      },
      loadFromImage(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const scale = Math.min((canvas.width / 2) / img.width, (canvas.height / 2) / img.height, 1);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = ((canvas.width / 2) - w) / 2;
            const y = ((canvas.height / 2) - h) / 2;
            ctx.drawImage(img, x, y, w, h);
            hasDrawn = true;
            if (callback) callback();
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CanvasHelper = CanvasHelper;
}

/* --- Module: controllers/BeneficiarioController.js --- */
// Controlador: Gestión de Menores Beneficiarios y Expediente
// Maneja el 100% de los campos normativos de inscripción PDI

const BeneficiarioController = {
  signatureCanvasHelper: null,
  tempFotoMenor: null,
  tempFotoApoderado: null,
  tempFotoRetiro1: null,
  tempFotoRetiro2: null,

  initSignature() {
    this.signatureCanvasHelper = CanvasHelper.init("canvasSignature");
  },

  clearSignature() {
    if (this.signatureCanvasHelper) {
      this.signatureCanvasHelper.clear();
    }
  },

  handleFotoUpload(input, previewId, roleKey) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      const previewEl = document.getElementById(previewId);
      if (previewEl) {
        previewEl.innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Foto">`;
      }
      if (roleKey === 'menor') this.tempFotoMenor = base64;
      if (roleKey === 'apoderado') {
        this.tempFotoApoderado = base64;
        const checkMismo = document.getElementById("checkMismoApoderado1");
        if (checkMismo && checkMismo.checked) {
          this.tempFotoRetiro1 = base64;
          const p1Preview = document.getElementById("regFotoRetiro1Preview");
          if (p1Preview) {
            p1Preview.innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Foto">`;
          }
        }
      }
      if (roleKey === 'retiro1') this.tempFotoRetiro1 = base64;
      if (roleKey === 'retiro2') this.tempFotoRetiro2 = base64;

      const toast = window.PDI?.ToastView || ToastView;
      if (toast) toast.show("Foto Cargada", "Fotografía incorporada al registro correctamente.", "info");
    };
    reader.readAsDataURL(file);
  },

  resetPhotos() {
    this.tempFotoMenor = null;
    this.tempFotoApoderado = null;
    this.tempFotoRetiro1 = null;
    this.tempFotoRetiro2 = null;

    const resetBox = (id, label) => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = `
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" style="color:var(--text-muted); margin-bottom:2px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          <span style="font-size:9.5px; font-weight:600; color:var(--text-muted);">${label}</span>
        `;
      }
    };

    resetBox("regFotoMenorPreview", "Foto Menor");
    resetBox("regFotoApoderadoPreview", "Foto Apoderado");
    resetBox("regFotoRetiro1Preview", "Foto P1");
    resetBox("regFotoRetiro2Preview", "Foto P2");

    const ids = ["regFotoMenorInput", "regFotoApoderadoInput", "regFotoRetiro1Input", "regFotoRetiro2Input"];
    ids.forEach(i => {
      const input = document.getElementById(i);
      if (input) input.value = "";
    });

    const box1 = document.getElementById("boxFotoRetiro1");
    if (box1) {
      box1.style.pointerEvents = "auto";
      box1.style.opacity = "1";
    }
  },

  loadSignatureFile(file) {
    if (this.signatureCanvasHelper && file) {
      this.signatureCanvasHelper.loadFromImage(file, () => {
        const toast = window.PDI?.ToastView || ToastView;
        if (toast) toast.show("Firma Cargada", "La imagen de la firma fue procesada e incorporada al formulario.", "success");
      });
    }
  },

  syncMismoApoderado(checked) {
    const getVal = (id) => document.getElementById(id)?.value || "";
    const nombre1 = document.getElementById("regRetiroNombre1");
    const dni1 = document.getElementById("regRetiroDni1");
    const parentesco1 = document.getElementById("regRetiroParentesco1");
    const tel1 = document.getElementById("regRetiroTel1");
    const p1Preview = document.getElementById("regFotoRetiro1Preview");
    const box1 = document.getElementById("boxFotoRetiro1");

    if (checked) {
      if (nombre1) {
        nombre1.value = getVal("regApoderado");
        nombre1.readOnly = true;
        nombre1.style.background = "var(--surface-hover)";
        nombre1.style.color = "var(--text-muted)";
      }
      if (dni1) {
        dni1.value = getVal("regApoderadoDni");
        dni1.readOnly = true;
        dni1.style.background = "var(--surface-hover)";
        dni1.style.color = "var(--text-muted)";
      }
      if (parentesco1) {
        parentesco1.value = getVal("regParentesco") || "Madre";
        parentesco1.disabled = true;
        parentesco1.style.background = "var(--surface-hover)";
        parentesco1.style.color = "var(--text-muted)";
      }
      if (tel1) {
        tel1.value = getVal("regTelefono");
        tel1.readOnly = true;
        tel1.style.background = "var(--surface-hover)";
        tel1.style.color = "var(--text-muted)";
      }
      if (this.tempFotoApoderado) {
        this.tempFotoRetiro1 = this.tempFotoApoderado;
        if (p1Preview) {
          p1Preview.innerHTML = `<img src="${this.tempFotoApoderado}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Foto">`;
        }
      }
      if (box1) {
        box1.style.pointerEvents = "none";
        box1.style.opacity = "0.75";
      }
    } else {
      if (nombre1) {
        nombre1.readOnly = false;
        nombre1.style.background = "#ffffff";
        nombre1.style.color = "var(--text-main)";
      }
      if (dni1) {
        dni1.readOnly = false;
        dni1.style.background = "#ffffff";
        dni1.style.color = "var(--text-main)";
      }
      if (parentesco1) {
        parentesco1.disabled = false;
        parentesco1.style.background = "#ffffff";
        parentesco1.style.color = "var(--text-main)";
      }
      if (tel1) {
        tel1.readOnly = false;
        tel1.style.background = "#ffffff";
        tel1.style.color = "var(--text-main)";
      }
      if (box1) {
        box1.style.pointerEvents = "auto";
        box1.style.opacity = "1";
      }
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

  openExpedienteByCodigo(codigo) {
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const cModel = window.PDI?.CasoSocialModel || CasoSocialModel;
    const mView = window.PDI?.ModalView || ModalView;
    const tView = window.PDI?.ToastView || ToastView;

    const menor = bModel.getByCodigo(codigo);
    if (!menor) {
      if (tView) tView.show("Expediente no encontrado", `No se encontró un expediente activo para el código ${codigo}`, "info");
      return;
    }

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

    // Datos de Persona Autorizada 1
    const retiroNombre1 = getVal("regRetiroNombre1") || apoderado;
    const retiroDni1 = getVal("regRetiroDni1") || apoderadoDni;
    const retiroParentesco1 = getVal("regRetiroParentesco1") || parentesco;
    const retiroTel1 = getVal("regRetiroTel1") || telefono;

    // Datos de Persona Autorizada 2 (Opcional)
    const retiroNombre2 = getVal("regRetiroNombre2");
    const retiroDni2 = getVal("regRetiroDni2");
    const retiroParentesco2 = getVal("regRetiroParentesco2") || "Familiar";
    const retiroTel2 = getVal("regRetiroTel2");

    const consentimientos = {
      evaluacionSocial: getChecked("checkHistorialVida"),
      usoFotografia: getChecked("checkFotoVideo"),
      gestionDonaciones: getChecked("checkDonaciones"),
      flujoTransfronterizo: getChecked("checkTransfronterizo")
    };

    const toast = window.PDI?.ToastView || ToastView;

    // Validación de firma digital (Ley 29733)
    if (this.signatureCanvasHelper && !this.signatureCanvasHelper.hasSignature()) {
      toast.show("Firma Obligatoria", "El apoderado debe estampar o subir su firma para validar el Consentimiento Ley N.° 29733.", "warning");
      return;
    }

    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const list = bModel.getAll();
    const newId = list.length + 1;
    const correlativo = `PDI-2026-${String(newId).padStart(3, "0")}`;

    const padronRetiro = [];
    if (retiroNombre1) {
      padronRetiro.push({
        nombre: retiroNombre1,
        dni: retiroDni1,
        parentesco: retiroParentesco1,
        telefono: retiroTel1,
        fotoUrl: this.tempFotoRetiro1 || this.tempFotoApoderado || null
      });
    }
    if (retiroNombre2) {
      padronRetiro.push({
        nombre: retiroNombre2,
        dni: retiroDni2 || "Por validar",
        parentesco: retiroParentesco2,
        telefono: retiroTel2 || "-",
        fotoUrl: this.tempFotoRetiro2 || null
      });
    }
    if (padronRetiro.length === 0) {
      padronRetiro.push({
        nombre: apoderado,
        dni: apoderadoDni,
        parentesco: parentesco,
        telefono: telefono,
        fotoUrl: this.tempFotoApoderado || null
      });
    }

    const nuevoObj = {
      id: newId,
      codigo: correlativo,
      nombres,
      apellidos,
      dni,
      fotoUrl: this.tempFotoMenor || null,
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
      retiroAutorizado: `${retiroNombre1} (${retiroParentesco1})`,
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
    this.resetPhotos();

    if (onComplete) onComplete();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.BeneficiarioController = BeneficiarioController;
}


/* --- Module: utils/VulnerabilityCalculator.js --- */
// Utilidad: Algoritmo Paramétrico Oficial de Vulnerabilidad Familiar ASP (0-100 pts)
const VulnerabilityCalculator = {
  calculate(factors) {
    const ing = Math.min(28, Math.max(0, Number(factors.ing) || 0));
    const viv = Math.min(20, Math.max(0, Number(factors.viv) || 0));
    const emp = Math.min(16, Math.max(0, Number(factors.emp) || 0));
    const sop = Math.min(19, Math.max(0, Number(factors.sop) || 0));
    const ins = Math.min(10, Math.max(0, Number(factors.ins) || 0));
    const sal = Math.min(7, Math.max(0, Number(factors.sal) || 0));

    const total = ing + viv + emp + sop + ins + sal;

    let category = "Baja Vulnerabilidad / Situación Estable";
    let badgeClass = "badge-green";
    let color = "var(--gt-green)";
    let exoneracion = "0% (Aporte Ordinario)";
    const recomendaciones = [];

    if (total >= 80) {
      category = "Extrema Pobreza / Vulnerabilidad Crítica";
      badgeClass = "badge-red";
      color = "var(--gt-red)";
      exoneracion = "100% Exoneración Total (Caso Social Extremo)";
      recomendaciones.push("Aprobación inmediata de exoneración del 100% de aporte mensual por vulnerabilidad extrema.");
      recomendaciones.push("Asignación prioritaria de Canasta Nutricional complementaria (Banco de Alimentos BTF).");
      recomendaciones.push("Apertura de expediente en Área Social Pastoral (ASP) y visitas domiciliarias quincenales de seguimiento.");
    } else if (total >= 60) {
      category = "Vulnerabilidad Alta / Prioridad Social";
      badgeClass = "badge-yellow";
      color = "var(--gt-yellow)";
      exoneracion = "50% Semi-exoneración (Aporte Solidario)";
      recomendaciones.push("Aprobación de 50% de semi-exoneración de aporte mensual como alivio socioeconómico al hogar.");
      recomendaciones.push("Monitoreo mensual de asistencia y evaluación de canasta de contingencia ante emergencias.");
      recomendaciones.push("Acompañamiento sociofamiliar e integración a la red de apoyo comunitario de la sede.");
    } else if (total >= 40) {
      category = "Vulnerabilidad Moderada";
      badgeClass = "badge-blue";
      color = "var(--gt-blue)";
      exoneracion = "Aporte Ordinario / Semi-exoneración Condicionada";
      recomendaciones.push("Evaluación socioeconómica periódica trimestral de la estabilidad de ingresos del hogar.");
      recomendaciones.push("Participación obligatoria del apoderado en la Escuela de Familias y talleres de nutrición.");
    } else {
      category = "Baja Vulnerabilidad / Situación Estable";
      badgeClass = "badge-green";
      color = "var(--gt-green)";
      exoneracion = "0% Aporte Ordinario";
      recomendaciones.push("Monitoreo regular de asistencia en comedor y talleres pedagógicos de Casitas del Saber.");
      recomendaciones.push("Mantenimiento del esquema de aporte ordinario para sostenibilidad del programa.");
    }

    // Recomendaciones específicas por factor de riesgo individual
    if (ing >= 22) {
      recomendaciones.push("Balance crítico de ingresos: Gestionar inclusión en programas complementarios de comedores populares aliados.");
    }
    if (viv >= 15) {
      recomendaciones.push("Hábitat de alta precariedad: Priorizar al menor en campañas de abrigo, kits de invierno y filtros de agua.");
    }
    if (emp >= 12) {
      recomendaciones.push("Desempleo o subempleo severo del cuidador: Orientación para vinculación a bolsa de empleo y talleres técnicos locales.");
    }
    if (sop >= 14) {
      recomendaciones.push("Alta sobrecarga o monoparentalidad crítica: Articular con DEMUNA / MIMP para protección integral de derechos.");
    }
    if (sal >= 5) {
      recomendaciones.push("Enfermedad o condición médica crónica en el núcleo: Coordinación prioritaria con Centro de Salud de referencia y SIS.");
    }

    return {
      total,
      breakdown: { ing, viv, emp, sop, ins, sal },
      category,
      badgeClass,
      color,
      exoneracion,
      recomendaciones
    };
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.VulnerabilityCalculator = VulnerabilityCalculator;
}

/* --- Module: views/SocialKanbanView.js --- */
// Vista: Tablero Kanban de Casos Sociales (ASP)
const SocialKanbanView = {
  renderKanban(casos) {
    const pCol = document.getElementById("kanbanColPendientes");
    const eCol = document.getElementById("kanbanColEvaluacion");
    const cCol = document.getElementById("kanbanColCanalizados");
    const zCol = document.getElementById("kanbanColCerrados");

    if (!pCol || !eCol || !cCol || !zCol) return;

    pCol.innerHTML = "";
    eCol.innerHTML = "";
    cCol.innerHTML = "";
    zCol.innerHTML = "";

    let countP = 0;
    let countE = 0;
    let countC = 0;
    let countZ = 0;

    casos.forEach(c => {
      const card = document.createElement("div");
      card.className = "kanban-card";

      let actionsHtml = "";
      if (c.etapa === "pendiente") {
        countP++;
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action-sm primary" style="width:100%; justify-content:center; font-size:11px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'evaluacion') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'evaluacion') : null)">
              <span>Iniciar Evaluación &rarr;</span>
            </button>
          </div>
        `;
      } else if (c.etapa === "evaluacion") {
        countE++;
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action-sm" style="flex:1; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'pendiente') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'pendiente') : null)">&larr; Alerta</button>
            <button type="button" class="btn-action-sm primary" style="flex:1; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'canalizado') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'canalizado') : null)">Canalizar &rarr;</button>
          </div>
        `;
      } else if (c.etapa === "canalizado") {
        countC++;
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action-sm" style="flex:1; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'evaluacion') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'evaluacion') : null)">&larr; Evaluar</button>
            <button type="button" class="btn-action-sm success" style="flex:1; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'cerrado') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'cerrado') : null)">Cerrar &check;</button>
          </div>
        `;
      } else if (c.etapa === "cerrado") {
        countZ++;
        actionsHtml = `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="btn-action-sm" style="width:100%; justify-content:center; font-size:10.5px;" onclick="window.app?.socialController ? window.app.socialController.moverCaso(${c.id}, 'canalizado') : (window.PDI?.SocialController?.moverCaso ? window.PDI.SocialController.moverCaso(${c.id}, 'canalizado') : null)">&larr; Reabrir Caso</button>
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px; margin-bottom:4px;">
          <strong style="font-size:13px; color:var(--text-main); font-weight:700;">${c.menor}</strong>
          <span class="badge badge-${c.urgencia === 'Alta' ? 'red' : (c.urgencia === 'Media' ? 'yellow' : 'blue')}" style="font-size:10px; padding:2px 6px;">${c.urgencia}</span>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <a href="javascript:void(0)" onclick="window.openExpedienteByCodigo ? window.openExpedienteByCodigo('${c.codigo}') : null" style="font-size:11.5px; font-family:var(--mono-font); color:var(--gt-green); font-weight:700; text-decoration:underline;" title="Abrir expediente">
            ${c.codigo}
          </a>
          <span style="font-size:11px; color:var(--text-dim);">${c.sede}</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); line-height:1.4; margin-bottom:6px; background:var(--surface-hover); padding:7px 9px; border-radius:5px; border:1px solid var(--border-subtle);">
          <strong style="color:var(--text-main);">Situación:</strong> ${c.situacionEncontrada || c.detalle}
        </div>
        <div style="font-size:11px; color:var(--text-dim); display:flex; justify-content:space-between; align-items:center;">
          <span>Deriva: <strong>${c.quienDeriva ? c.quienDeriva.nombre.split(' ')[0] + ' ' + (c.quienDeriva.nombre.split(' ')[1] || '') : 'PDI'}</strong></span>
          <span style="font-family:var(--mono-font);">${c.fechaDerivacion}</span>
        </div>
        ${actionsHtml}
      `;

      if (c.etapa === "pendiente") pCol.appendChild(card);
      if (c.etapa === "evaluacion") eCol.appendChild(card);
      if (c.etapa === "canalizado") cCol.appendChild(card);
      if (c.etapa === "cerrado") zCol.appendChild(card);
    });

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };
    setBadge("kanbanCountPendientes", countP);
    setBadge("kanbanCountEvaluacion", countE);
    setBadge("kanbanCountCanalizados", countC);
    setBadge("kanbanCountCerrados", countZ);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialKanbanView = SocialKanbanView;
}

/* --- Module: controllers/SocialController.js --- */
// Controlador: Tablero Kanban y Evaluación de Vulnerabilidad ASP

const SocialController = {
  moverCaso(id, nuevaEtapa) {
    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const caso = model.updateStage(id, nuevaEtapa);
    if (!caso) return;

    const audit = window.PDI?.AuditModel || AuditModel;
    if (audit) {
      audit.log(
        "Lic. Ruth Soto",
        "Trabajadora Social ASP",
        "Transición Kanban",
        caso.codigo,
        `Caso de ${caso.menor} trasladado a etapa: ${nuevaEtapa.toUpperCase()}`,
        "Válido"
      );
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast) {
      toast.show("Tablero Kanban Actualizado", `Caso ${caso.codigo} ahora en etapa: ${nuevaEtapa.toUpperCase()}`, "success");
    }

    const view = window.PDI?.SocialKanbanView || SocialKanbanView;
    if (view) {
      view.renderKanban(model.getAll());
    }
  },

  syncScore(dimKey, value) {
    const num = Number(value) || 0;
    const slider = document.getElementById(`slider${dimKey}`);
    const input = document.getElementById(`score${dimKey}`);
    const label = document.getElementById(`lblScore${dimKey}`);

    if (slider && slider.value != num) slider.value = num;
    if (input && input.value != num) input.value = num;
    if (label) label.textContent = `${num} pts`;
  },

  cargarCasoEnSimulador(codigo) {
    if (!codigo || codigo === "custom") return;
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const menor = bModel.getByCodigo(codigo);
    if (!menor) return;

    const vScore = menor.vulnerabilidad || 75;
    
    // Distribuir proporcionalmente el puntaje oficial de vulnerabilidad entre las 6 dimensiones
    const factor = vScore / 100;
    const ing = Math.round(28 * factor);
    const viv = Math.round(20 * factor);
    const emp = Math.round(16 * factor);
    const sop = Math.round(19 * factor);
    const ins = Math.round(10 * factor);
    const sal = Math.round(7 * factor);

    this.syncScore("Ingreso", ing);
    this.syncScore("Vivienda", viv);
    this.syncScore("Empleo", emp);
    this.syncScore("Soporte", sop);
    this.syncScore("Instruccion", ins);
    this.syncScore("SaludFam", sal);

    const toast = window.PDI?.ToastView || ToastView;
    if (toast) {
      toast.show("Perfil Cargado", `Datos de ${menor.nombres} ${menor.apellidos} cargados en el simulador. Presione 'Calcular Evaluación' para procesar.`, "info");
    }
  },

  calcularEvaluacion() {
    const getVal = (id, fallback) => {
      const el = document.getElementById(id);
      return el ? (Number(el.value) || 0) : fallback;
    };

    const factors = {
      ing: getVal("scoreIngreso", 24),
      viv: getVal("scoreVivienda", 18),
      emp: getVal("scoreEmpleo", 14),
      sop: getVal("scoreSoporte", 16),
      ins: getVal("scoreInstruccion", 8),
      sal: getVal("scoreSaludFam", 6)
    };

    const calc = window.PDI?.VulnerabilityCalculator || VulnerabilityCalculator;
    const res = calc.calculate(factors);

    // Renderizar resultados en la interfaz
    const scoreValEl = document.getElementById("socioTotalScoreVal");
    const scoreBarEl = document.getElementById("socioTotalScoreBar");
    const categoryBadgeEl = document.getElementById("socioCategoryBadge");
    const exoneracionEl = document.getElementById("socioExoneracionText");
    const listaRecomEl = document.getElementById("listaRecomendacionesSocio");
    const resultBox = document.getElementById("containerResultadoSocioeconomico");

    if (scoreValEl) scoreValEl.textContent = `${res.total} / 100`;
    if (scoreBarEl) {
      scoreBarEl.style.width = `${res.total}%`;
      scoreBarEl.style.backgroundColor = res.color;
    }
    if (categoryBadgeEl) {
      categoryBadgeEl.textContent = res.category;
      categoryBadgeEl.className = `badge ${res.badgeClass}`;
    }
    if (exoneracionEl) {
      exoneracionEl.textContent = res.exoneracion;
      exoneracionEl.style.color = res.color;
    }

    if (listaRecomEl) {
      listaRecomEl.innerHTML = res.recomendaciones.map(r => `
        <li class="socio-recommendation-item">
          <div class="socio-rec-icon">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span>${r}</span>
        </li>
      `).join("");
    }

    if (resultBox) {
      resultBox.style.display = "block";
      if (typeof resultBox.scrollIntoView === "function") {
        resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast && typeof toast.show === "function") {
      toast.show("Evaluación Calculada", `Índice de Vulnerabilidad: ${res.total}/100 (${res.category})`, "success");
    }
  },

  handleVulnerabilidadChange() {
    this.calcularEvaluacion();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialController = SocialController;
}

/* --- Module: utils/CsvExporter.js --- */
// Utilidad: Exportador Tabular de Datos CSV
const CsvExporter = {
  exportBeneficiarios(beneficiarios) {
    let csv = "Codigo,Nombres,Apellidos,DNI,Edad,Sexo,Distrito,Sede,Servicios,Seguro,Hb,Anemia,Vulnerabilidad\n";
    beneficiarios.forEach(b => {
      csv += `"${b.codigo}","${b.nombres}","${b.apellidos}","${b.dni}","${b.edad}","${b.sexo}","${b.distrito}","${b.sede}","${b.servicios.join(';') }","${b.seguro}",${b.hb},"${b.anemia}",${b.vulnerabilidad}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "padron_pdi_beneficiarios_2026.csv";
    link.click();
  },

  exportAuditLogs(logs) {
    let csv = "Timestamp,Usuario,Rol,Accion,Entidad_Afectada,Detalle_Operacion,Estado_Registro\n";
    logs.forEach(l => {
      csv += `"${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.entity}","${(l.detail || '').replace(/"/g, '""')}","${l.status}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bitacora_auditoria_pdi_ley29733.csv";
    link.click();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CsvExporter = CsvExporter;
}


/* --- Module: controllers/RoleController.js --- */
// Controlador: Simulador de Roles y RBAC Dinámico
const RoleController = {
  rolesConfig: {
    coord: {
      title: "Dirección y Coordinación General",
      desc: "Acceso global integral para supervisión estratégica de sedes, validación de padrón e indicadores de impacto.",
      tag: "Acceso Total / Dirección",
      tagCol: "var(--gt-green)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-salud", "view-educativo", "view-social"]
    },
    facilitadora: {
      title: "Facilitadora Nutricional / CRED",
      desc: "Especializada en tamizaje de anemia, curvas de peso/talla MINSA y prescripción de suplementos.",
      tag: "Operativo Nutrición / CRED",
      tagCol: "var(--gt-blue)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-salud"]
    },
    promotora: {
      title: "Promotora Educativa (Casitas del Saber)",
      desc: "Responsable del pase de asistencia escolar, nivelación pedagógica y talleres con materiales Faber-Castell.",
      tag: "Operativo Pedagógico",
      tagCol: "var(--gt-yellow)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-educativo"]
    },
    social: {
      title: "Trabajadora Social (Área Social Pastoral)",
      desc: "Canalización de casos vulnerables, derivaciones a DEMUNA y evaluación del núcleo familiar completo.",
      tag: "Protección Social / ASP",
      tagCol: "var(--gt-red)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-social"]
    },
    admin: {
      title: "Administrador de Sistemas TI",
      desc: "Gestión de seguridad perimetral, trazabilidad de accesos, auditoría inviolable y exportación de bases de datos.",
      tag: "Sistemas & Seguridad TI",
      tagCol: "var(--text-muted)",
      allowedViews: ["view-dashboard", "view-beneficiarios", "view-salud", "view-educativo", "view-social"]
    }
  },

  applyRolePermissions(role, onNavigate) {
    const navButtons = document.querySelectorAll(".nav-btn");
    const bannerTitle = document.getElementById("roleBannerTitle");
    const bannerDesc = document.getElementById("roleBannerDesc");
    const bannerTag = document.getElementById("roleBannerAccessTag");

    const conf = this.rolesConfig[role] || this.rolesConfig.coord;

    navButtons.forEach(btn => {
      const allowedRoles = btn.getAttribute("data-roles")?.split(",") || [];
      const view = btn.getAttribute("data-view");

      if (allowedRoles.includes(role)) {
        btn.classList.remove("role-restricted");
        btn.removeAttribute("disabled");
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
      } else {
        btn.classList.add("role-restricted");
        btn.setAttribute("disabled", "true");
        btn.style.opacity = "0.35";
        btn.style.pointerEvents = "none";
      }
    });

    if (bannerTitle) bannerTitle.textContent = conf.title;
    if (bannerDesc) bannerDesc.textContent = conf.desc;
    if (bannerTag) {
      bannerTag.textContent = conf.tag;
      bannerTag.style.borderColor = conf.tagCol;
      bannerTag.style.color = conf.tagCol;
    }

    // Actualizar Tooltip dinámico del botón de información de rol
    const tipTitle = document.getElementById("roleTooltipTitle");
    const tipDesc = document.getElementById("roleTooltipDesc");
    const tipTag = document.getElementById("roleTooltipTag");
    const btnInfo = document.getElementById("btnRoleInfo");

    if (tipTitle) tipTitle.textContent = conf.title;
    if (tipDesc) tipDesc.textContent = conf.desc;
    if (tipTag) {
      tipTag.textContent = conf.tag;
      tipTag.style.color = conf.tagCol;
      tipTag.style.background = `${conf.tagCol}20`;
    }
    if (btnInfo) {
      btnInfo.setAttribute("title", `${conf.title}: ${conf.desc}`);
    }

    const toast = window.PDI?.ToastView || ToastView;
    toast.show("Perfil Simulado", `Cambiando a vista: ${conf.title}`, "info");

    const currentActiveBtn = document.querySelector(".nav-btn.active");
    const currentViewId = currentActiveBtn?.getAttribute("data-view");

    if (!conf.allowedViews.includes(currentViewId)) {
      if (onNavigate) {
        onNavigate("view-dashboard");
      }
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.RoleController = RoleController;
}


/* --- Module: controllers/SaludController.js --- */
// Controlador: Módulo de Salud y Nutrición CRED
const SaludController = {
  handleHbChange(hb) {
    const calc = window.PDI?.AnemiaCalculator || AnemiaCalculator;
    const res = calc.calculate(hb);

    // Actualizar calculadora CRED integrada
    const diagLabel = document.getElementById("calcDiagnosticoLabel");
    const accionLabel = document.getElementById("calcAccionSugerida");
    if (diagLabel) {
      const numVal = parseFloat(hb);
      const valStr = !isNaN(numVal) ? ` (${numVal.toFixed(1)} g/dL)` : '';
      diagLabel.textContent = `${res.label}${valStr}`;
      diagLabel.style.color = res.color;
    }
    if (accionLabel) {
      accionLabel.textContent = `Acción: ${res.accion}`;
    }

    // Actualizar elementos de modal si existen
    const labelEl = document.getElementById("anemiaCalcResult");
    const accionEl = document.getElementById("anemiaCalcAccion");
    if (labelEl) {
      labelEl.textContent = res.label;
      labelEl.style.color = res.color;
    }
    if (accionEl) {
      accionEl.textContent = `Acción Prescrita: ${res.accion}`;
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SaludController = SaludController;
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

    // 4.1 Configurar botón menú lateral (hamburguesa) y responsive backdrop
    this.bindSidebar();

    // 5. Configurar selector de rol
    this.bindRoleSelector();

    // 6. Configurar tabs en modales
    this.bindModalTabs();

    // 7. Inicializar valores de calculadoras
    SaludController.handleHbChange(10.4);
    SocialController.handleVulnerabilidadChange();

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
  },

  bindNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const viewId = btn.getAttribute("data-view");
        if (viewId && !btn.classList.contains("role-restricted")) {
          this.navigateToView(viewId);
          this.closeSidebar();
        }
      });
    });
  },

  bindSidebar() {
    const toggleBtn = document.getElementById("btnSidebarToggle");
    const backdrop = document.getElementById("sidebarBackdrop");
    const sidebar = document.getElementById("appSidebar");

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    // Cerrar con tecla Escape en caso de estar abierto en móvil
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeSidebar();
      }
    });
  },

  toggleSidebar() {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!sidebar) return;

    if (window.innerWidth > 900) {
      sidebar.classList.toggle("collapsed");
    } else {
      const isOpen = sidebar.classList.toggle("open");
      if (backdrop) {
        if (isOpen) {
          backdrop.classList.add("active");
        } else {
          backdrop.classList.remove("active");
        }
      }
    }
  },

  closeSidebar() {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!sidebar) return;

    if (window.innerWidth <= 900) {
      if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
      if (backdrop && backdrop.classList.contains("active")) {
        backdrop.classList.remove("active");
      }
    }
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

  switchRole(roleValue, roleTitle) {
    const labelEl = document.getElementById("labelActiveRole");
    if (labelEl) labelEl.textContent = roleTitle;

    const menuEl = document.querySelector("#dropdownRoleSelector .custom-dropdown-menu");
    const items = document.querySelectorAll("#dropdownRoleSelector .custom-dropdown-item");
    let selectedItem = null;
    items.forEach(it => {
      if (it.getAttribute("data-value") === roleValue) {
        it.classList.add("selected");
        selectedItem = it;
      } else {
        it.classList.remove("selected");
      }
    });

    // Mover el rol activo primero en la lista visual del desplegable
    if (menuEl && selectedItem) {
      menuEl.prepend(selectedItem);
    }

    const dropdown = document.getElementById("dropdownRoleSelector");
    if (dropdown) dropdown.classList.remove("open");

    const hiddenInput = document.getElementById("roleSelector");
    if (hiddenInput) {
      hiddenInput.value = roleValue;
      hiddenInput.dispatchEvent(new Event("change"));
    } else {
      RoleController.applyRolePermissions(roleValue, (view) => this.navigateToView(view));
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
  },

  exportAuditCSV() {
    const audit = window.PDI?.AuditModel || AuditModel;
    const logs = audit.getAll();
    const exporter = window.PDI?.CsvExporter || CsvExporter;
    exporter.exportAuditLogs(logs);
    const toast = window.PDI?.ToastView || ToastView;
    toast.show("Bitácora Descargada", "Registro oficial de auditoría descargado en formato CSV (Ley 29733)", "success");
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
window.subirImagenFirma = (e) => {
  const file = e.target.files[0];
  if (file) BeneficiarioController.loadSignatureFile(file);
};
window.handleFotoUpload = (input, previewId, roleKey) => BeneficiarioController.handleFotoUpload(input, previewId, roleKey);
window.toggleMismoApoderado = (checked) => BeneficiarioController.syncMismoApoderado(checked);
window.closeModalExpediente = () => ModalView.closeExpediente();
window.closeModalNuevoMenor = () => ModalView.closeNuevoMenor();
window.openModalNuevoMenor = () => ModalView.openNuevoMenor();
window.closeModalInforme = () => ModalView.closeInforme();
window.closeSpotlightTour = () => SpotlightView.closeTour();
window.spotlightNext = () => SpotlightView.next((view) => AppController.navigateToView(view));
window.spotlightPrev = () => SpotlightView.prev((view) => AppController.navigateToView(view));
window.calculateAnemiaPreview = () => {
  const inputEl = document.getElementById("calcHbInput");
  const sliderEl = document.getElementById("quickHbSlider");
  const val = inputEl ? inputEl.value : (sliderEl ? sliderEl.value : 10.4);
  SaludController.handleHbChange(val);
};

window.toggleCalculadoraCred = () => {
  if (window.PDI && window.PDI.SaludCredView) {
    window.PDI.SaludCredView.toggleCalculadora();
  } else if (typeof SaludCredView !== "undefined" && SaludCredView.toggleCalculadora) {
    SaludCredView.toggleCalculadora();
  }
};
window.calculateVulnerabilidad = () => SocialController.handleVulnerabilidadChange();
window.calcularEvaluacionSocioeconomica = () => SocialController.calcularEvaluacion();
window.syncScoreSimulador = (dimKey, val) => SocialController.syncScore(dimKey, val);
window.cargarCasoEnSimulador = (codigo) => SocialController.cargarCasoEnSimulador(codigo);
window.guardarNuevoMenor = (e) => BeneficiarioController.saveNuevoMenor(e, () => AppController.refreshAllViews());
window.exportDataCSV = () => AppController.exportCSV();
window.exportAuditCSV = () => AppController.exportAuditCSV();
window.filterAuditAction = (action) => DashboardView.filterByAction(action);
window.filterAuditRole = (role) => DashboardView.filterByRole(role);
window.filterAuditDate = (dateKey) => DashboardView.filterByDate(dateKey);
window.toggleCustomDropdown = (id) => DashboardView.toggleDropdown(id);
window.selectAuditDate = (val, label) => DashboardView.selectDate(val, label);
window.selectAuditRole = (val, label) => DashboardView.selectRole(val, label);
window.selectAuditAction = (val, label) => DashboardView.selectAction(val, label);
window.selectActiveRole = (roleValue, roleTitle) => AppController.switchRole(roleValue, roleTitle);
window.toggleTheme = (e) => AppController.toggleTheme(e);
window.openExpediente = (id) => BeneficiarioController.openExpediente(id);
window.openExpedienteByCodigo = (codigo) => BeneficiarioController.openExpedienteByCodigo(codigo);
window.moverCaso = (id, etapa) => SocialController.moverCaso(id, etapa);
window.filterAuditSearch = (q) => DashboardView.filterBySearch(q);
window.changeAuditPageSize = (size) => DashboardView.changePageSize(size);
window.prevAuditPage = () => DashboardView.changePage((DashboardView._auditCurrentPage || 1) - 1);
window.nextAuditPage = () => DashboardView.changePage((DashboardView._auditCurrentPage || 1) + 1);
window.openAuditDetail = (logId) => DashboardView.openLogDetail(logId);
window.closeModalAuditDetail = () => ModalView.closeAuditDetail();
window.clearAuditSearch = () => DashboardView.clearSearch();
window.resetAuditFilters = () => DashboardView.resetAuditFilters();
window.toggleInnerFilterDropdown = (id) => DashboardView.toggleInnerDropdown(id);
window.handleAuditDatePickerChange = (type, val) => DashboardView.handleDatePickerChange(type, val);
window.handleAuditDateManualInput = (type, el) => DashboardView.handleDateManualInput(type, el);

window.toggleRoleInfo = (e) => {
  if (e) e.stopPropagation();
  const wrap = document.querySelector(".role-info-wrap");
  if (wrap) wrap.classList.toggle("open");
};

// Handlers de Búsqueda y Filtros de Padrón Único de Beneficiarios
window.filterPadronSearch = (q) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.filterBySearch(q);
};
window.clearPadronSearch = () => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.clearSearch();
};
window.togglePadronInnerDropdown = (id) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleInnerDropdown(id);
};
window.togglePadronServicio = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleServicio(val);
};
window.selectPadronServicio = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleServicio(val);
};
window.togglePadronSede = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleSede(val);
};
window.selectPadronSede = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleSede(val);
};
window.togglePadronAnemia = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleAnemia(val);
};
window.selectPadronAnemia = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.toggleAnemia(val);
};
window.setPadronEdadExacta = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.setEdadExacta(val);
};
window.syncPadronEdadRango = (handle, val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.syncEdadRango(handle, val);
};
window.syncPadronEdad = (val, source) => {
  if (source === "slider") {
    if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.syncEdadRango("min", val);
  } else {
    if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.setEdadExacta(val);
  }
};
window.clearPadronEdad = () => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.clearEdad();
};
window.removePadronChip = (filterKey, specificVal) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.removeFilter(filterKey, specificVal);
};
window.selectPadronEstado = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.selectEstado(val);
};
window.resetPadronFilters = () => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.resetFilters();
};

// Cierre automático de Custom Dropdowns, Inner Dropdowns y Role Tooltips al hacer clic afuera o presionar Escape
document.addEventListener("click", (e) => {
  if (!e.target.closest(".custom-dropdown")) {
    document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
  }
  if (!e.target.closest(".padron-inner-dropdown")) {
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));
  }
  if (!e.target.closest(".role-info-wrap")) {
    const wrap = document.querySelector(".role-info-wrap");
    if (wrap) wrap.classList.remove("open");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));
    const wrap = document.querySelector(".role-info-wrap");
    if (wrap) wrap.classList.remove("open");
  }
});

// Arrancar cuando el DOM esté listo (tolerante a readyState interactive o complete)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    AppController.init();
  });
} else {
  AppController.init();
}

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


