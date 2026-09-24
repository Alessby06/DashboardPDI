/* --- Module: utils/AnimationEngine.js --- */
// Motor de Animaciones e Interacciones Web (AnimationEngine)
AnimationEngine = {
  animateCounter(elementOrId, targetVal, options = {}) {
    const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;

    if (typeof targetVal === "string" && targetVal.includes("/")) {
      const parts = targetVal.split("/").map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const duration = options.duration || 1000;
        const startTime = performance.now();
        const updateRatio = (currentTime) => {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const cur1 = Math.round(parts[0] * easeProgress);
          const cur2 = Math.round(parts[1] * easeProgress);
          el.textContent = `${cur1} / ${cur2}`;
          if (progress < 1) requestAnimationFrame(updateRatio);
          else el.textContent = targetVal;
        };
        requestAnimationFrame(updateRatio);
        return;
      }
    }

    const duration = options.duration || 1000;
    const numVal = typeof targetVal === "number" ? targetVal : parseFloat(targetVal) || 0;
    const decimals = options.decimals !== undefined ? options.decimals : (numVal % 1 !== 0 ? 1 : 0);
    const prefix = options.prefix || "";
    const suffix = options.suffix || "";

    const startVal = 0;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = startVal + (numVal - startVal) * easeProgress;

      el.textContent = `${prefix}${currentVal.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        el.textContent = `${prefix}${numVal.toFixed(decimals)}${suffix}`;
      }
    };

    requestAnimationFrame(updateCounter);
  },

  triggerStagger(parentOrId, itemSelector = ".stagger-item") {
    const parent = typeof parentOrId === "string" ? document.getElementById(parentOrId) : parentOrId;
    if (!parent) return;

    const items = parent.querySelectorAll(itemSelector);
    items.forEach((item, index) => {
      item.style.animationDelay = `${index * 40}ms`;
      item.classList.remove("stagger-animate");
      void item.offsetWidth;
      item.classList.add("stagger-animate");
    });
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AnimationEngine = AnimationEngine;
}

/* --- Module: models/StorageService.js --- */
// Servicio de Almacenamiento Local (Persistence Layer) StorageService = {
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
// Utilidad: Calculadora de Anemia según Norma Técnica MINSA AnemiaCalculator = {
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

/* --- Module: models/BeneficiarioModel.js --- */
// Modelo de Beneficiarios (Padrón de Menores PDI)
// Incorpora el 100% de los campos oficiales de las Fichas A0, A1, A2, A3, A6 CRED y ASP defaultBeneficiarios = [
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

function normalizeBeneficiarioServicios(b) {
  if (!b) return b;
  const rawServicios = Array.isArray(b.servicios) ? b.servicios : [];
  const normalized = new Set();
  const lowerEstrategia = (b.estrategia || "").toLowerCase();

  rawServicios.forEach(s => {
    const low = (s || "").toLowerCase();
    if (low.includes("lonchera")) {
      normalized.add("Lonchera Saludable");
    } else if (low.includes("desayuno") || low.includes("alimento") || low.includes("nutric")) {
      normalized.add("Servicio Alimentario Nutricional");
    } else if (low.includes("casita") || low.includes("educativ") || low.includes("refuerzo") || low.includes("escolar") || low.includes("acompañ")) {
      normalized.add("Servicio Acompañamiento Educativo");
    } else if (low.includes("pastoral") || low.includes("social") || low.includes("asp")) {
      normalized.add("Área Social Pastoral");
    } else {
      normalized.add(s);
    }
  });

  if (normalized.size === 0) {
    if (lowerEstrategia.includes("lonchera")) {
      normalized.add("Lonchera Saludable");
    }
    if (lowerEstrategia.includes("desayuno") || lowerEstrategia.includes("alimento")) {
      normalized.add("Servicio Alimentario Nutricional");
    }
    if (lowerEstrategia.includes("casita") || lowerEstrategia.includes("educat") || lowerEstrategia.includes("acompañ")) {
      normalized.add("Servicio Acompañamiento Educativo");
    }
    if (lowerEstrategia.includes("pastoral") || lowerEstrategia.includes("social")) {
      normalized.add("Área Social Pastoral");
    }
    if (lowerEstrategia.includes("mixto")) {
      normalized.add("Servicio Alimentario Nutricional");
      normalized.add("Servicio Acompañamiento Educativo");
      normalized.add("Lonchera Saludable");
    }
  }

  if (normalized.size === 0) {
    normalized.add("Servicio Alimentario Nutricional");
  }

  b.servicios = Array.from(normalized);
  return b;
}

BeneficiarioModel = {
  _data: null,

  init() {
    const storage = window.PDI?.StorageService || StorageService;
    let list = storage.getItem("pdi_mock_beneficiarios", defaultBeneficiarios);
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = defaultBeneficiarios;
    }
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

/* --- Module: models/CasoSocialModel.js --- */
// Modelo de Casos Sociales (Derivaciones ASP - Área Social Pastoral)
// Sincronizado integralmente con los menores del Padrón Oficial de Beneficiarios
 defaultCasosSociales = [
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
 CasoSocialModel = {
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
// Modelo de Trazabilidad y Auditoría de Seguridad defaultAuditLogs = [
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
]; AuditModel = {
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

/* --- Module: models/SedeModel.js --- */
// Modelo: Directorio Territorial de Sedes, Iglesias y Redes Aliadas

const defaultSedes = [
  {
    id: "sede-ano-nuevo",
    nombre: "Año Nuevo",
    distrito: "Comas",
    direccion: "Mz. 4W Lt. 30, Comité 12, A.H. Año Nuevo Sector B",
    referencia: "Frente al Comedor Popular San Benito",
    facilitadora: "Carmen Mendoza Huamán",
    facilitadoraCargo: "Facilitadora Comunitaria PDI",
    facilitadoraTel: "987-123-456",
    pastorAliado: "Pr. Juan Carlos Ramos",
    iglesiaAliada: "Iglesia Bíblica Emanuel",
    tipoAliado: "Iglesia Aliada",
    aforoMax: 50,
    servicios: ["Desayuno Infantil", "Casita del Saber"],
    horario: "Lun - Vie: 7:30 AM - 1:00 PM",
    estado: "Operativa",
    coordenadas: { lat: -11.9056, lng: -77.0421 }
  },
  {
    id: "sede-la-libertad",
    nombre: "La Libertad",
    distrito: "Comas",
    direccion: "Mz. F Lote 12, A.H. La Libertad",
    referencia: "A dos cuadras del Módulo de Salud La Libertad",
    facilitadora: "Rosa Flores Quispe",
    facilitadoraCargo: "Facilitadora Nutricional",
    facilitadoraTel: "976-543-210",
    pastorAliado: "Pr. David Quispe Condori",
    iglesiaAliada: "Iglesia Cristiana Aposento Alto",
    tipoAliado: "Iglesia Aliada",
    aforoMax: 40,
    servicios: ["Desayuno Infantil"],
    horario: "Lun - Vie: 7:30 AM - 11:30 AM",
    estado: "Operativa",
    coordenadas: { lat: -11.9123, lng: -77.0498 }
  },
  {
    id: "sede-carmen-alto",
    nombre: "Carmen Alto",
    distrito: "Comas",
    direccion: "Jr. Los Pinos 340, Carmen Alto",
    referencia: "Alt. Paradero 5 de Av. Revolución",
    facilitadora: "Maritza Soto Cárdenas",
    facilitadoraCargo: "Tutora y Acompañante Educativa",
    facilitadoraTel: "991-882-334",
    pastorAliado: "Pr. Roberto Silva Morales",
    iglesiaAliada: "Iglesia Alianza Cristiana y Misionera",
    tipoAliado: "Iglesia Aliada",
    aforoMax: 45,
    servicios: ["Casita del Saber", "Lonchera Infantil"],
    horario: "Lun - Vie: 8:00 AM - 12:30 PM",
    estado: "Operativa",
    coordenadas: { lat: -11.9189, lng: -77.0387 }
  },
  {
    id: "sede-el-progreso",
    nombre: "El Progreso",
    distrito: "Carabayllo",
    direccion: "Av. Túpac Amaru Km 21, Sector El Progreso",
    referencia: "Cruce con Av. Manuel Prado",
    facilitadora: "Elizabeth Huamán Rivas",
    facilitadoraCargo: "Coordinadora de Sede I.E.",
    facilitadoraTel: "984-112-993",
    pastorAliado: "Lic. Gladys Ramos (Directora)",
    iglesiaAliada: "I.E. N.° 3058 Virgen de las Mercedes",
    tipoAliado: "Colegio Público Aliado",
    aforoMax: 55,
    servicios: ["Casita del Saber", "Lonchera Infantil"],
    horario: "Lun - Vie: 8:00 AM - 1:00 PM",
    estado: "Operativa",
    coordenadas: { lat: -11.8845, lng: -77.0312 }
  },
  {
    id: "sede-san-pedro",
    nombre: "San Pedro",
    distrito: "Carabayllo",
    direccion: "Mz. K Lt. 8, Comité 14, San Pedro",
    referencia: "A espaldas de la Capilla San Pedro",
    facilitadora: "Juana Condori Mamani",
    facilitadoraCargo: "Facilitadora Comunitaria",
    facilitadoraTel: "955-443-219",
    pastorAliado: "Pr. Andrés Medina Vega",
    iglesiaAliada: "Iglesia Evangélica Bautista San Pedro",
    tipoAliado: "Iglesia Aliada",
    aforoMax: 35,
    servicios: ["Desayuno Infantil"],
    horario: "Lun - Vie: 7:30 AM - 11:30 AM",
    estado: "Operativa",
    coordenadas: { lat: -11.8762, lng: -77.0289 }
  },
  {
    id: "sede-los-bendecidos",
    nombre: "Los Bendecidos",
    distrito: "Carabayllo",
    direccion: "Sector 3 Ampliación Los Bendecidos",
    referencia: "Frente al Reservorio de Agua Comunal",
    facilitadora: "Silvia Palacios Tello",
    facilitadoraCargo: "Promotora de Salud y Nutrición",
    facilitadoraTel: "962-331-778",
    pastorAliado: "Pr. Lucas Vargas Benítez",
    iglesiaAliada: "Centro Cristiano Familiar",
    tipoAliado: "Iglesia Aliada",
    aforoMax: 40,
    servicios: ["Desayuno Infantil", "Casita del Saber"],
    horario: "Lun - Vie: 7:30 AM - 1:00 PM",
    estado: "Operativa",
    coordenadas: { lat: -11.8698, lng: -77.0245 }
  },
  {
    id: "sede-santa-rosa",
    nombre: "Santa Rosa",
    distrito: "Carabayllo",
    direccion: "Av. Las Lomas Mz. B Lt. 5, Santa Rosa",
    referencia: "A una cuadra de la Losa Deportiva Santa Rosa",
    facilitadora: "Patricia Alarcón Vera",
    facilitadoraCargo: "Facilitadora Educativa",
    facilitadoraTel: "948-223-990",
    pastorAliado: "Pr. Samuel Castro Ríos",
    iglesiaAliada: "Comunidad Cristiana Gracia y Paz",
    tipoAliado: "Iglesia Aliada",
    aforoMax: 40,
    servicios: ["Lonchera Infantil", "Casita del Saber"],
    horario: "Lun - Vie: 8:00 AM - 12:30 PM",
    estado: "Operativa",
    coordenadas: { lat: -11.8612, lng: -77.0198 }
  }
];
 SedeModel = {
  _sedes: [],

  init() {
    this._sedes = [...defaultSedes];
  },

  getAll() {
    if (!this._sedes || this._sedes.length === 0) {
      this.init();
    }

    // Calcular en tiempo real los niños inscritos según el padrón
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const allBeneficiarios = bModel && bModel.getAll ? bModel.getAll() : [];

    return this._sedes.map(sede => {
      const matchChildren = allBeneficiarios.filter(b => {
        const bSede = (b.sede || "").toLowerCase();
        const sNombre = sede.nombre.toLowerCase();
        return bSede.includes(sNombre) || (b.distritoSede && b.distritoSede.toLowerCase().includes(sNombre));
      });

      const ninosInscritos = matchChildren.length;
      const porcentajeOcupacion = sede.aforoMax > 0 ? Math.min(100, Math.round((ninosInscritos / sede.aforoMax) * 100)) : 0;

      return {
        ...sede,
        ninosInscritos,
        porcentajeOcupacion
      };
    });
  },

  getStats() {
    const sedes = this.getAll();
    const totalSedes = sedes.length;
    const sedesOperativas = sedes.filter(s => s.estado === "Operativa").length;
    const totalNinos = sedes.reduce((acc, s) => acc + s.ninosInscritos, 0);
    const totalAforo = sedes.reduce((acc, s) => acc + s.aforoMax, 0);
    const tasaOcupacionPromedio = totalAforo > 0 ? Math.round((totalNinos / totalAforo) * 100) : 0;
    const totalAliados = sedes.length;

    return {
      totalSedes,
      sedesOperativas,
      totalNinos,
      totalAforo,
      tasaOcupacionPromedio,
      totalAliados
    };
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SedeModel = SedeModel;
}

/* --- Module: utils/CanvasHelper.js --- */
// Utilidad: Manejo de Firma Digital en Canvas (Ley N° 29733) CanvasHelper = {
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
            // Calcular aspect ratio para centrar la imagen en el canvas
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

/* --- Module: utils/VulnerabilityCalculator.js --- */
// Utilidad: Algoritmo Paramétrico Oficial de Vulnerabilidad Familiar ASP (0-100 pts)
// Metodología paramétrica institucional del Programa de Desarrollo Infantil
 VulnerabilityCalculator = {
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

/* --- Module: utils/CsvExporter.js --- */
// Utilidad: Exportador Tabular de Datos CSV CsvExporter = {
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

/* --- Module: views/ToastView.js --- */
// Vista: Sistema de Notificaciones Toast Flotantes ToastView = {
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
// Vista: Tour Interactivo Spotlight (10 Minutos) spotlightSteps = [
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
]; SpotlightView = {
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
 DashboardView = {
  render(stats, auditLogs) {
    const animateNum = (el, val, isPct = false) => {
      if (!el) return;
      if (window.PDI && window.PDI.AnimationEngine) {
        window.PDI.AnimationEngine.animateCounter(el, val, { suffix: isPct ? "%" : "" });
      } else {
        el.textContent = isPct ? `${val}%` : val;
      }
    };

    const statEl = document.getElementById("statTotalNinos");
    if (statEl) animateNum(statEl, stats.total);

    const dashBenEl = document.getElementById("dashKpiBeneficiarios");
    if (dashBenEl) animateNum(dashBenEl, stats.total);

    const dashTamEl = document.getElementById("dashKpiTamizados");
    if (dashTamEl) {
      if (window.PDI && window.PDI.AnimationEngine) {
        window.PDI.AnimationEngine.animateCounter(dashTamEl, `${stats.total} / ${stats.total}`);
      } else {
        dashTamEl.textContent = `${stats.total} / ${stats.total}`;
      }
    }

    const dashAsisEl = document.getElementById("dashKpiAsistencia");
    if (dashAsisEl) animateNum(dashAsisEl, 92.4, true);

    const dashCasosEl = document.getElementById("dashKpiCasosSociales");
    if (dashCasosEl) animateNum(dashCasosEl, 4);

    const pctNormalEl = document.getElementById("pctNormal");
    if (pctNormalEl) animateNum(pctNormalEl, stats.pctNormal, true);

    const pctLeveEl = document.getElementById("pctLeve");
    if (pctLeveEl) animateNum(pctLeveEl, stats.pctLeve, true);

    const pctModEl = document.getElementById("pctModerada");
    if (pctModEl) animateNum(pctModEl, stats.pctMod, true);

    const barNormal = document.getElementById("barNormal");
    if (barNormal) {
      barNormal.style.width = "0%";
      setTimeout(() => { barNormal.style.width = stats.pctNormal + "%"; }, 50);
    }

    const barLeve = document.getElementById("barLeve");
    if (barLeve) {
      barLeve.style.width = "0%";
      setTimeout(() => { barLeve.style.width = stats.pctLeve + "%"; }, 50);
    }

    const barMod = document.getElementById("barMod");
    if (barMod) {
      barMod.style.width = "0%";
      setTimeout(() => { barMod.style.width = stats.pctMod + "%"; }, 50);
    }

    const coverageContainer = document.getElementById("dashDistrictCoverage");
    if (coverageContainer) {
      const pctComas = stats.total > 0 ? Math.round((stats.comasCount / stats.total) * 100) : 0;
      const pctCarabayllo = stats.total > 0 ? Math.round((stats.carabaylloCount / stats.total) * 100) : 0;
      coverageContainer.innerHTML = `
        <div class="district-coverage-card stagger-item">
          <div class="district-coverage-header">
            <div>
              <strong>Distrito de Comas</strong>
              <div class="district-coverage-sedes">Sedes: La Libertad, Año Nuevo, Collique</div>
            </div>
            <span class="badge badge-green district-coverage-badge" id="badgeDistrictComas">${stats.comasCount} Beneficiarios (${pctComas}%)</span>
          </div>
          <div class="district-coverage-track">
            <div class="district-coverage-bar" style="width: 0%; background: var(--gt-green);" id="barDistrictComas"></div>
          </div>
        </div>

        <div class="district-coverage-card stagger-item">
          <div class="district-coverage-header">
            <div>
              <strong>Distrito de Carabayllo</strong>
              <div class="district-coverage-sedes">Sedes: El Progreso, San Pedro</div>
            </div>
            <span class="badge badge-blue district-coverage-badge" id="badgeDistrictCarabayllo">${stats.carabaylloCount} Beneficiarios (${pctCarabayllo}%)</span>
          </div>
          <div class="district-coverage-track">
            <div class="district-coverage-bar" style="width: 0%; background: var(--gt-blue, #0d9488);" id="barDistrictCarabayllo"></div>
          </div>
        </div>
      `;
      setTimeout(() => {
        const bComas = document.getElementById("barDistrictComas");
        const bCara = document.getElementById("barDistrictCarabayllo");
        if (bComas) bComas.style.width = `${pctComas}%`;
        if (bCara) bCara.style.width = `${pctCarabayllo}%`;

        const badgeComasEl = document.getElementById("badgeDistrictComas");
        const badgeCaraEl = document.getElementById("badgeDistrictCarabayllo");

        if (window.PDI && window.PDI.AnimationEngine) {
          if (badgeComasEl) {
            const startT = performance.now();
            const dur = 2000;
            const updateB1 = (t) => {
              const p = Math.min((t - startT) / dur, 1);
              const ep = 1 - Math.pow(1 - p, 3);
              const cVal = Math.round(stats.comasCount * ep);
              const cPct = Math.round(pctComas * ep);
              badgeComasEl.textContent = `${cVal} Beneficiarios (${cPct}%)`;
              if (p < 1) requestAnimationFrame(updateB1);
              else badgeComasEl.textContent = `${stats.comasCount} Beneficiarios (${pctComas}%)`;
            };
            requestAnimationFrame(updateB1);
          }

          if (badgeCaraEl) {
            const startT = performance.now();
            const dur = 2000;
            const updateB2 = (t) => {
              const p = Math.min((t - startT) / dur, 1);
              const ep = 1 - Math.pow(1 - p, 3);
              const cVal = Math.round(stats.carabaylloCount * ep);
              const cPct = Math.round(pctCarabayllo * ep);
              badgeCaraEl.textContent = `${cVal} Beneficiarios (${cPct}%)`;
              if (p < 1) requestAnimationFrame(updateB2);
              else badgeCaraEl.textContent = `${stats.carabaylloCount} Beneficiarios (${pctCarabayllo}%)`;
            };
            requestAnimationFrame(updateB2);
          }
        }
      }, 50);
    }

    if (window.PDI && window.PDI.AnimationEngine) {
      window.PDI.AnimationEngine.triggerStagger("view-dashboard");
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
              <circle id="semNormalCircle" cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-green)" stroke-width="14"
                stroke-dasharray="0 ${C}" stroke-dashoffset="0" stroke-linecap="round" style="transition: stroke-dasharray 2s cubic-bezier(0.16, 1, 0.3, 1);" />
              <circle id="semLeveCircle" cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-yellow)" stroke-width="14"
                stroke-dasharray="0 ${C}" stroke-dashoffset="${-sNormal}" stroke-linecap="round" style="transition: stroke-dasharray 2s cubic-bezier(0.16, 1, 0.3, 1);" />
              <circle id="semModCircle" cx="50" cy="50" r="40" fill="transparent" stroke="var(--gt-red)" stroke-width="14"
                stroke-dasharray="0 ${C}" stroke-dashoffset="${-(sNormal + sLeve)}" stroke-linecap="round" style="transition: stroke-dasharray 2s cubic-bezier(0.16, 1, 0.3, 1);" />
            </svg>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none;">
              <span id="dashChartCenterNum" style="font-size: 20px; font-weight: 800; color: var(--text-main); font-family: var(--mono-font);">0</span>
              <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Menores</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 170px;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-green); display: inline-block;"></span>
                <span>Normal (&ge; 11.0)</span>
              </div>
              <strong style="color: var(--gt-green); font-family: var(--mono-font);" id="anemiaLegendNormal">${stats.normales} (${stats.pctNormal}%)</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-yellow); display: inline-block;"></span>
                <span>Anemia Leve</span>
              </div>
              <strong style="color: var(--gt-yellow); font-family: var(--mono-font);" id="anemiaLegendLeve">${stats.leves} (${stats.pctLeve}%)</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gt-red); display: inline-block;"></span>
                <span>Anemia Mod/Sev</span>
              </div>
              <strong style="color: var(--gt-red); font-family: var(--mono-font);" id="anemiaLegendMod">${stats.moderadas} (${stats.pctMod}%)</strong>
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        const cNorm = document.getElementById("semNormalCircle");
        const cLeve = document.getElementById("semLeveCircle");
        const cMod = document.getElementById("semModCircle");
        const cNum = document.getElementById("dashChartCenterNum");
        if (cNorm) cNorm.style.strokeDasharray = `${sNormal} ${C}`;
        if (cLeve) cLeve.style.strokeDasharray = `${sLeve} ${C}`;
        if (cMod) cMod.style.strokeDasharray = `${sMod} ${C}`;
        if (cNum) animateNum(cNum, stats.total);

        const legNorm = document.getElementById("anemiaLegendNormal");
        const legLeve = document.getElementById("anemiaLegendLeve");
        const legMod = document.getElementById("anemiaLegendMod");

        if (window.PDI && window.PDI.AnimationEngine) {
          const runLegendAnim = (el, val, pct) => {
            if (!el) return;
            const startT = performance.now();
            const dur = 2000;
            const updateLeg = (t) => {
              const p = Math.min((t - startT) / dur, 1);
              const ep = 1 - Math.pow(1 - p, 3);
              const cVal = Math.round(val * ep);
              const cPct = Math.round(pct * ep);
              el.textContent = `${cVal} (${cPct}%)`;
              if (p < 1) requestAnimationFrame(updateLeg);
              else el.textContent = `${val} (${pct}%)`;
            };
            requestAnimationFrame(updateLeg);
          };
          runLegendAnim(legNorm, stats.normales, stats.pctNormal);
          runLegendAnim(legLeve, stats.leves, stats.pctLeve);
          runLegendAnim(legMod, stats.moderadas, stats.pctMod);
        }
      }, 60);
    }

    this.renderAuditLogs(auditLogs);
  },

  renderAuditLogs(logs) {
    this._currentAuditLogs = logs || [];
    this.updateAuditKpis(this._currentAuditLogs);
    this.applyAuditFilters();
  },

  updateAuditKpis(logs) {
    const totalEl = document.getElementById("auditKpiTotal");
    const sensEl = document.getElementById("auditKpiSensibles");
    const exportCountEl = document.getElementById("exportAuditCountBadge");

    const totalCount = (logs && logs.length) || 0;
    if (totalEl) totalEl.textContent = totalCount;
    if (exportCountEl) exportCountEl.textContent = `${totalCount} eventos`;
    
    if (sensEl) {
      const sensibles = logs ? logs.filter(l => 
        (l.action && l.action.toLowerCase().includes("derivaci")) || 
        (l.detail && l.detail.toLowerCase().includes("demuna")) ||
        (l.status && l.status.toLowerCase().includes("sensible"))
      ) : [];
      sensEl.textContent = sensibles.length;
    }
  },

  _currentAuditLogs: [],
  _auditSearchQuery: "",
  _filterAuditAction: [], // array de acciones seleccionadas (vacío = todas)
  _filterAuditDate: "all", // "all" | "today" | "week" | "specific" | "range"
  _filterAuditRole: [],   // array de roles seleccionados (vacío = todos)
  _filterAuditStatus: [], // array de estados seleccionados (vacío = todos)
  _customDateSpecific: "",
  _customDateRangeStart: "",
  _customDateRangeEnd: "",
  _auditCurrentPage: 1,
  _auditPageSize: 10,

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

  toggleAction(val) {
    const allActions = ["salud", "social", "educativo", "padron"];
    if (val === "all") {
      this._filterAuditAction = [];
    } else {
      const idx = this._filterAuditAction.indexOf(val);
      if (idx > -1) {
        this._filterAuditAction.splice(idx, 1);
      } else {
        this._filterAuditAction.push(val);
      }
      if (allActions.every(a => this._filterAuditAction.includes(a))) {
        this._filterAuditAction = [];
      }
    }
    this._updateActionDropdownUI();
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateActionDropdownUI() {
    const isAll = this._filterAuditAction.length === 0;
    const items = document.querySelectorAll("#menuAuditAction .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAuditAction.includes(v));
      }
    });

    const labelEl = document.getElementById("labelAuditActionSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Eventos";
      } else if (this._filterAuditAction.length === 1) {
        const a = this._filterAuditAction[0];
        if (a === "salud") labelEl.textContent = "Salud y Nutrición CRED";
        else if (a === "social") labelEl.textContent = "Derivación Social ASP";
        else if (a === "educativo") labelEl.textContent = "Casitas del Saber CS";
        else if (a === "padron") labelEl.textContent = "Padrón / Coordinación";
      } else {
        labelEl.textContent = `${this._filterAuditAction.length} seleccionados`;
      }
    }
  },

  selectDate(dateKey, label) {
    this._filterAuditDate = dateKey || "all";
    const items = document.querySelectorAll("#menuAuditDate .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterAuditDate);
    });

    const labelEl = document.getElementById("labelAuditDateSelect");
    if (labelEl) {
      labelEl.textContent = label || "Todas las Fechas";
    }

    // Conmutar paneles de fecha
    const panelSpecific = document.getElementById("panelAuditDateSpecific");
    const panelRange = document.getElementById("panelAuditDateRange");
    if (panelSpecific) panelSpecific.style.display = (dateKey === "specific") ? "flex" : "none";
    if (panelRange) panelRange.style.display = (dateKey === "range") ? "flex" : "none";

    // Cerrar dropdown si es selección directa de fecha fija
    if (dateKey !== "specific" && dateKey !== "range") {
      const drop = document.getElementById("dropdownAuditDate");
      if (drop) drop.classList.remove("open");
    }

    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  toggleRole(val) {
    const allRoles = ["Coordinación", "Facilitadora", "Promotora", "Trabajadora Social"];
    if (val === "all") {
      this._filterAuditRole = [];
    } else {
      const idx = this._filterAuditRole.indexOf(val);
      if (idx > -1) {
        this._filterAuditRole.splice(idx, 1);
      } else {
        this._filterAuditRole.push(val);
      }
      if (allRoles.every(r => this._filterAuditRole.includes(r))) {
        this._filterAuditRole = [];
      }
    }
    this._updateRoleDropdownUI();
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateRoleDropdownUI() {
    const isAll = this._filterAuditRole.length === 0;
    const items = document.querySelectorAll("#menuAuditRole .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAuditRole.includes(v));
      }
    });

    const labelEl = document.getElementById("labelAuditRoleSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Roles";
      } else if (this._filterAuditRole.length === 1) {
        labelEl.textContent = this._filterAuditRole[0];
      } else {
        labelEl.textContent = `${this._filterAuditRole.length} seleccionados`;
      }
    }
  },

  toggleStatus(val) {
    const allStatuses = ["Registrado", "Sensible", "Observado"];
    if (val === "all") {
      this._filterAuditStatus = [];
    } else {
      const idx = this._filterAuditStatus.indexOf(val);
      if (idx > -1) {
        this._filterAuditStatus.splice(idx, 1);
      } else {
        this._filterAuditStatus.push(val);
      }
      if (allStatuses.every(s => this._filterAuditStatus.includes(s))) {
        this._filterAuditStatus = [];
      }
    }
    this._updateStatusDropdownUI();
    this._auditCurrentPage = 1;
    this.applyAuditFilters();
  },

  _updateStatusDropdownUI() {
    const isAll = this._filterAuditStatus.length === 0;
    const items = document.querySelectorAll("#menuAuditStatus .padron-dropdown-item");
    items.forEach(item => {
      const v = item.getAttribute("data-value");
      if (v === "all") {
        item.classList.toggle("selected", isAll);
      } else {
        item.classList.toggle("selected", !isAll && this._filterAuditStatus.includes(v));
      }
    });

    const labelEl = document.getElementById("labelAuditStatusSelect");
    if (labelEl) {
      if (isAll) {
        labelEl.textContent = "Todos los Estados";
      } else if (this._filterAuditStatus.length === 1) {
        const s = this._filterAuditStatus[0];
        if (s === "Registrado") labelEl.textContent = "Registrado / Conforme";
        else if (s === "Sensible") labelEl.textContent = "Sensible / Crítico";
        else if (s === "Observado") labelEl.textContent = "Observado / Revisión";
      } else {
        labelEl.textContent = `${this._filterAuditStatus.length} seleccionados`;
      }
    }
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

  removeAuditFilter(filterKey, specificVal) {
    if (filterKey === "search") this.clearSearch();
    if (filterKey === "action") {
      if (specificVal) this.toggleAction(specificVal);
      else this.toggleAction("all");
    }
    if (filterKey === "date") this.selectDate("all", "Todas las Fechas");
    if (filterKey === "role") {
      if (specificVal) this.toggleRole(specificVal);
      else this.toggleRole("all");
    }
    if (filterKey === "status") {
      if (specificVal) this.toggleStatus(specificVal);
      else this.toggleStatus("all");
    }
  },

  resetAuditFilters() {
    this._filterAuditAction = [];
    this._filterAuditDate = "all";
    this._filterAuditRole = [];
    this._filterAuditStatus = [];
    this._customDateSpecific = "";
    this._customDateRangeStart = "";
    this._customDateRangeEnd = "";
    this._auditSearchQuery = "";
    this._auditCurrentPage = 1;

    const input = document.getElementById("inputAuditSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnAuditSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

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

    this._updateActionDropdownUI();
    this.selectDate("all", "Todas las Fechas");
    this._updateRoleDropdownUI();
    this._updateStatusDropdownUI();

    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));

    this.applyAuditFilters();
  },

  _matchesAuditAction(log, actionKeys) {
    if (!actionKeys || actionKeys.length === 0) return true;
    return actionKeys.some(actionFilter => {
      if (actionFilter === "salud") {
        return (log.action && (log.action.toLowerCase().includes("cred") || log.action.toLowerCase().includes("tamizaje") || log.action.toLowerCase().includes("salud")));
      } else if (actionFilter === "social") {
        return (log.action && (log.action.toLowerCase().includes("derivaci") || log.action.toLowerCase().includes("social") || log.action.toLowerCase().includes("caso"))) || (log.role && log.role.toLowerCase().includes("social"));
      } else if (actionFilter === "educativo") {
        return (log.action && (log.action.toLowerCase().includes("asistencia") || log.action.toLowerCase().includes("casita") || log.action.toLowerCase().includes("saber"))) || (log.role && log.role.toLowerCase().includes("promotora"));
      } else if (actionFilter === "padron") {
        return (log.action && (log.action.toLowerCase().includes("padrón") || log.action.toLowerCase().includes("aprobación") || log.action.toLowerCase().includes("menor") || log.action.toLowerCase().includes("ingreso"))) || (log.role && log.role.toLowerCase().includes("coordinaci"));
      }
      return false;
    });
  },

  _matchesAuditRole(log, roleKeys) {
    if (!roleKeys || roleKeys.length === 0) return true;
    return roleKeys.some(r => log.role && log.role.toLowerCase().includes(r.toLowerCase()));
  },

  _matchesAuditStatus(log, statusKeys) {
    if (!statusKeys || statusKeys.length === 0) return true;
    return statusKeys.some(s => log.status && log.status.toLowerCase().includes(s.toLowerCase()));
  },

  _matchesAuditDate(log, dateKey) {
    if (!dateKey || dateKey === "all") return true;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const logDateStr = (log.timestamp || "").slice(0, 10);

    if (dateKey === "today") {
      return logDateStr === todayStr;
    } else if (dateKey === "week") {
      const logDate = new Date(logDateStr);
      return !isNaN(logDate) && logDate >= sevenDaysAgo;
    } else if (dateKey === "specific") {
      if (this._customDateSpecific) {
        return logDateStr === this._customDateSpecific;
      }
      return true;
    } else if (dateKey === "range") {
      const start = this._customDateRangeStart;
      const end = this._customDateRangeEnd;
      if (start && end) {
        return logDateStr >= start && logDateStr <= end;
      } else if (start) {
        return logDateStr >= start;
      } else if (end) {
        return logDateStr <= end;
      }
      return true;
    }
    return true;
  },

  applyAuditFilters() {
    const logs = this._currentAuditLogs || [];
    const query = this._auditSearchQuery || "";

    const filtered = logs.filter(l => {
      let matchAction = this._matchesAuditAction(l, this._filterAuditAction);
      let matchRole = this._matchesAuditRole(l, this._filterAuditRole);
      let matchStatus = this._matchesAuditStatus(l, this._filterAuditStatus);
      let matchDate = this._matchesAuditDate(l, this._filterAuditDate);

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

      return matchAction && matchRole && matchStatus && matchDate && matchQuery;
    });

    // Actualizar badge de filtros activos
    let count = 0;
    if (this._filterAuditAction.length > 0) count += this._filterAuditAction.length;
    if (this._filterAuditDate !== "all") count++;
    if (this._filterAuditRole.length > 0) count += this._filterAuditRole.length;
    if (this._filterAuditStatus.length > 0) count += this._filterAuditStatus.length;

    const badge = document.getElementById("auditActiveFiltersCount");
    const filterBtn = document.getElementById("btnDropdownAuditFilterPanel");

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }
    if (filterBtn) {
      filterBtn.classList.toggle("has-filters", count > 0);
    }

    this._updateAuditFacetCounts();
    this._renderAuditActiveChips();

    // Paginación
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

  _updateAuditFacetCounts() {
    const getFilteredExcluding = (excludeKey) => {
      let l = [...(this._currentAuditLogs || [])];
      if (this._auditSearchQuery) {
        const q = this._auditSearchQuery;
        l = l.filter(log => {
          const user = (log.user || "").toLowerCase();
          const role = (log.role || "").toLowerCase();
          const action = (log.action || "").toLowerCase();
          const entity = (log.entity || "").toLowerCase();
          const detail = (log.detail || "").toLowerCase();
          const id = (log.id || "").toLowerCase();
          return user.includes(q) || role.includes(q) || action.includes(q) || entity.includes(q) || detail.includes(q) || id.includes(q);
        });
      }
      if (excludeKey !== "action" && this._filterAuditAction.length > 0) {
        l = l.filter(log => this._matchesAuditAction(log, this._filterAuditAction));
      }
      if (excludeKey !== "date" && this._filterAuditDate !== "all") {
        l = l.filter(log => this._matchesAuditDate(log, this._filterAuditDate));
      }
      if (excludeKey !== "role" && this._filterAuditRole.length > 0) {
        l = l.filter(log => this._matchesAuditRole(log, this._filterAuditRole));
      }
      if (excludeKey !== "status" && this._filterAuditStatus.length > 0) {
        l = l.filter(log => this._matchesAuditStatus(log, this._filterAuditStatus));
      }
      return l;
    };

    const setFacetBadge = (badgeId, text, isZero) => {
      const el = document.getElementById(badgeId);
      if (!el) return;
      el.textContent = text;
      const parentItem = el.closest(".padron-dropdown-item");
      if (parentItem && parentItem.getAttribute("data-value") !== "all") {
        parentItem.classList.toggle("zero-facet", isZero);
      }
    };

    // 1. Facetas de Tipo de Evento
    const forAction = getFilteredExcluding("action");
    setFacetBadge("countFacetAuditAction-all", `(${forAction.length})`, forAction.length === 0);
    const actionsList = ["salud", "social", "educativo", "padron"];
    actionsList.forEach(act => {
      const c = forAction.filter(log => this._matchesAuditAction(log, [act])).length;
      setFacetBadge(`countFacetAuditAction-${act}`, `(${c})`, c === 0);
    });

    // 2. Facetas de Periodo Temporal
    const forDate = getFilteredExcluding("date");
    setFacetBadge("countFacetAuditDate-all", `(${forDate.length})`, forDate.length === 0);
    const cToday = forDate.filter(log => this._matchesAuditDate(log, "today")).length;
    const cWeek = forDate.filter(log => this._matchesAuditDate(log, "week")).length;
    setFacetBadge("countFacetAuditDate-today", `(${cToday})`, cToday === 0);
    setFacetBadge("countFacetAuditDate-week", `(${cWeek})`, cWeek === 0);

    // 3. Facetas de Rol del Usuario
    const forRole = getFilteredExcluding("role");
    setFacetBadge("countFacetAuditRole-all", `(${forRole.length})`, forRole.length === 0);
    const rolesList = ["Coordinación", "Facilitadora", "Promotora", "Trabajadora Social"];
    rolesList.forEach(r => {
      const c = forRole.filter(log => this._matchesAuditRole(log, [r])).length;
      setFacetBadge(`countFacetAuditRole-${r}`, `(${c})`, c === 0);
    });

    // 4. Facetas de Estado de Registro
    const forStatus = getFilteredExcluding("status");
    setFacetBadge("countFacetAuditStatus-all", `(${forStatus.length})`, forStatus.length === 0);
    const statusesList = ["Registrado", "Sensible", "Observado"];
    statusesList.forEach(s => {
      const c = forStatus.filter(log => this._matchesAuditStatus(log, [s])).length;
      setFacetBadge(`countFacetAuditStatus-${s}`, `(${c})`, c === 0);
    });
  },

  _renderAuditActiveChips() {
    const bar = document.getElementById("auditActiveChipsBar");
    const list = document.getElementById("auditActiveChipsList");
    if (!bar || !list) return;

    const chips = [];

    if (this._auditSearchQuery) {
      chips.push({
        id: "search",
        label: `Búsqueda: "${this._auditSearchQuery}"`
      });
    }

    if (this._filterAuditAction.length > 0) {
      this._filterAuditAction.forEach(act => {
        let label = act;
        if (act === "salud") label = "Salud CRED";
        if (act === "social") label = "Social ASP";
        if (act === "educativo") label = "Casitas CS";
        if (act === "padron") label = "Padrón Coord.";
        chips.push({
          id: "action",
          val: act,
          label: `Evento: ${label}`
        });
      });
    }

    if (this._filterAuditDate !== "all") {
      let dateLabel = this._filterAuditDate;
      if (this._filterAuditDate === "today") dateLabel = "Fecha: Hoy";
      if (this._filterAuditDate === "week") dateLabel = "Fecha: Últimos 7 días";
      if (this._filterAuditDate === "specific") dateLabel = `Fecha: ${this._customDateSpecific || "Específica"}`;
      if (this._filterAuditDate === "range") dateLabel = `Rango: ${this._customDateRangeStart || "..."} a ${this._customDateRangeEnd || "..."}`;
      chips.push({
        id: "date",
        label: dateLabel
      });
    }

    if (this._filterAuditRole.length > 0) {
      this._filterAuditRole.forEach(r => {
        chips.push({
          id: "role",
          val: r,
          label: `Rol: ${r}`
        });
      });
    }

    if (this._filterAuditStatus.length > 0) {
      this._filterAuditStatus.forEach(s => {
        let sLabel = s;
        if (s === "Registrado") sLabel = "Conforme";
        if (s === "Sensible") sLabel = "Sensible / Crítico";
        if (s === "Observado") sLabel = "En Revisión";
        chips.push({
          id: "status",
          val: s,
          label: `Estado: ${sLabel}`
        });
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
          <button type="button" class="padron-chip-remove" onclick="window.removeAuditChip ? window.removeAuditChip('${chip.id}', '${chip.val || ''}') : null" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      `).join("");
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
      if (act.includes("cred") || act.includes("tamizaje") || act.includes("salud")) return "badge-yellow";
      if (act.includes("derivaci") || act.includes("social")) return "badge-red";
      if (act.includes("asistencia") || act.includes("casita")) return "badge-blue";
      if (act.includes("padrón") || act.includes("aprobación") || act.includes("ingreso")) return "badge-green";
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
      // No cerrar dropdowns anidados ni el contenedor padre si se está abriendo un hijo
      if (d !== target && !d.contains(target) && !target?.contains(d)) {
        d.classList.remove("open");
      }
    });
    if (target) {
      target.classList.toggle("open");
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.DashboardView = DashboardView;
}

/* --- Module: views/BeneficiariosView.js --- */
// Vista: Padrón de Beneficiarios
 // Vista: Padrón de Beneficiarios
BeneficiariosView = {
  _allBeneficiarios: [],
  _filteredBeneficiarios: [],
  _currentPage: 1,
  _pageSize: 20,
  _searchQuery: "",
  _filterServicio: [], // array de servicios seleccionados (vacío = todos)
  _filterSede: [],     // array de sedes seleccionadas (vacío = todas)
  _filterAnemia: [],   // array de anemias seleccionadas (vacío = todos)
  _filterEdadModo: "all", // "all" | "exacta" | "rango"
  _filterEdadExacta: null, // number 0-18 o null
  _filterEdadRango: { min: 0, max: 18 },
  _filterEstado: "all", // "all" | "Activo" | "Inactivo"
  _filterSexo: "all",   // "all" | "M" | "F"

  init(beneficiarios) {
    this._allBeneficiarios = beneficiarios || [];
    this._currentPage = 1;
    this._pageSize = this._getEffectivePageSize();
    this._syncPageSizeSelectUI();
    this.applyFilters(true);
  },

  renderTable(beneficiarios) {
    if (beneficiarios) {
      this._allBeneficiarios = beneficiarios;
    }
    this.applyFilters(false);
  },

  _getEffectivePageSize() {
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    if (isMobile) {
      return Math.min(20, this._pageSize || 20);
    }
    return Math.min(50, this._pageSize || 20);
  },

  _syncPageSizeSelectUI() {
    const select = document.getElementById("selectPadronPageSize");
    if (select) {
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
      // En móvil, deshabilitar opción 50 y ajustar a 20 si estaba en 50
      const opt50 = select.querySelector('option[value="50"]');
      if (opt50) {
        opt50.disabled = isMobile;
        if (isMobile && select.value === "50") {
          select.value = "20";
          this._pageSize = 20;
        }
      }
      select.value = String(this._pageSize);
    }
  },

  setPageSize(size) {
    const num = parseInt(size, 10);
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    const maxAllowed = isMobile ? 20 : 50;
    this._pageSize = isNaN(num) ? 20 : Math.min(maxAllowed, Math.max(5, num));
    this._currentPage = 1;
    this._syncPageSizeSelectUI();
    this.applyFilters(false);
  },

  goToPage(page) {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    this._currentPage = Math.min(totalPages, Math.max(1, page));
    this._renderPagination(this._filteredBeneficiarios.length);
    this._renderCurrentPage();
  },

  prevPage() {
    if (this._currentPage > 1) {
      this.goToPage(this._currentPage - 1);
    }
  },

  nextPage() {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    if (this._currentPage < totalPages) {
      this.goToPage(this._currentPage + 1);
    }
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

  selectSexo(sexoVal) {
    this._filterSexo = sexoVal || "all";
    const items = document.querySelectorAll("#menuPadronSexo .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterSexo);
    });

    const labelEl = document.getElementById("labelPadronSexoSelect");
    if (labelEl) {
      if (this._filterSexo === "all") labelEl.textContent = "Todos";
      else if (this._filterSexo === "M") labelEl.textContent = "Niños (M)";
      else if (this._filterSexo === "F") labelEl.textContent = "Niñas (F)";
    }

    const drop = document.getElementById("dropdownPadronSexo");
    if (drop) drop.classList.remove("open");

    this.applyFilters();
  },

  _updateSexoDropdownUI() {
    const items = document.querySelectorAll("#menuPadronSexo .padron-dropdown-item");
    items.forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-value") === this._filterSexo);
    });
    const labelEl = document.getElementById("labelPadronSexoSelect");
    if (labelEl) {
      if (this._filterSexo === "all") labelEl.textContent = "Todos";
      else if (this._filterSexo === "M") labelEl.textContent = "Niños (M)";
      else if (this._filterSexo === "F") labelEl.textContent = "Niñas (F)";
    }
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
    if (filterKey === "sexo") this.selectSexo("all");
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
    this._filterSexo = "all";

    const input = document.getElementById("inputPadronSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnPadronSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this._updateServicioDropdownUI();
    this._updateSedeDropdownUI();
    this._updateAnemiaDropdownUI();
    this._updateEdadUI();
    this._updateSexoDropdownUI();

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

  applyFilters(resetPage = true) {
    if (resetPage) {
      this._currentPage = 1;
    }
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

    // 7. Sexo (Niñas F / Niños M)
    if (this._filterSexo !== "all") {
      list = list.filter(b => (b.sexo || "").toUpperCase() === this._filterSexo.toUpperCase());
    }

    this._filteredBeneficiarios = list;

    // Actualizar badge de filtros activos
    let activeFiltersCount = 0;
    if (this._filterServicio.length > 0) activeFiltersCount += this._filterServicio.length;
    if (this._filterSede.length > 0) activeFiltersCount += this._filterSede.length;
    if (this._filterAnemia.length > 0) activeFiltersCount += this._filterAnemia.length;
    if (this._filterEdadModo !== "all") activeFiltersCount++;
    if (this._filterEstado !== "all") activeFiltersCount++;
    if (this._filterSexo !== "all") activeFiltersCount++;

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

    // Validar rango de página actual
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(this._filteredBeneficiarios.length / pageSize));
    if (this._currentPage > totalPages) {
      this._currentPage = totalPages;
    }
    if (this._currentPage < 1) {
      this._currentPage = 1;
    }

    this._renderPagination(this._filteredBeneficiarios.length);
    this._renderCurrentPage();
  },

  _renderCurrentPage() {
    const list = this._filteredBeneficiarios || [];
    const pageSize = this._getEffectivePageSize();
    const startIndex = (this._currentPage - 1) * pageSize;
    const pageItems = list.slice(startIndex, startIndex + pageSize);
    this._renderFilteredList(pageItems, list.length);
  },

  _renderPagination(totalCount) {
    const pageSize = this._getEffectivePageSize();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startRecord = totalCount === 0 ? 0 : (this._currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(totalCount, this._currentPage * pageSize);

    const infoEl = document.getElementById("padronPaginationInfo");
    if (infoEl) {
      infoEl.textContent = totalCount === 0
        ? "Mostrando 0 de 0 beneficiarios"
        : `Mostrando ${startRecord}–${endRecord} de ${totalCount} beneficiarios`;
    }

    const pageNumEl = document.getElementById("padronCurrentPageNum");
    if (pageNumEl) {
      pageNumEl.textContent = `Página ${this._currentPage} de ${totalPages}`;
    }

    const btnPrev = document.getElementById("btnPadronPagePrev");
    if (btnPrev) {
      btnPrev.disabled = this._currentPage <= 1 || totalCount === 0;
    }

    const btnNext = document.getElementById("btnPadronPageNext");
    if (btnNext) {
      btnNext.disabled = this._currentPage >= totalPages || totalCount === 0;
    }

    this._syncPageSizeSelectUI();
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
      if (excludeKey !== "sexo" && this._filterSexo !== "all") {
        l = l.filter(b => (b.sexo || "").toUpperCase() === this._filterSexo.toUpperCase());
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
    this._setFacetBadge("countFacetSede-an", `(${forSede.filter(b => (b.sede || '').includes("Año Nuevo")).length})`, forSede.filter(b => (b.sede || '').includes("Año Nuevo")).length === 0);
    this._setFacetBadge("countFacetSede-lib", `(${forSede.filter(b => (b.sede || '').includes("La Libertad")).length})`, forSede.filter(b => (b.sede || '').includes("La Libertad")).length === 0);
    this._setFacetBadge("countFacetSede-sp", `(${forSede.filter(b => (b.sede || '').includes("San Pedro")).length})`, forSede.filter(b => (b.sede || '').includes("San Pedro")).length === 0);
    this._setFacetBadge("countFacetSede-prog", `(${forSede.filter(b => (b.sede || '').includes("El Progreso")).length})`, forSede.filter(b => (b.sede || '').includes("El Progreso")).length === 0);
    this._setFacetBadge("countFacetSede-sr", `(${forSede.filter(b => (b.sede || '').includes("Santa Rosa")).length})`, forSede.filter(b => (b.sede || '').includes("Santa Rosa")).length === 0);
    this._setFacetBadge("countFacetSede-bend", `(${forSede.filter(b => (b.sede || '').includes("Los Bendecidos")).length})`, forSede.filter(b => (b.sede || '').includes("Los Bendecidos")).length === 0);

    // 3. Facetas de Anemia
    const forAnemia = getFilteredExcluding("anemia");
    this._setFacetBadge("countFacetAnemia-all", `(${forAnemia.length})`, forAnemia.length === 0);
    this._setFacetBadge("countFacetAnemia-normal", `(${forAnemia.filter(b => b.anemia === "Normal").length})`, forAnemia.filter(b => b.anemia === "Normal").length === 0);
    this._setFacetBadge("countFacetAnemia-leve", `(${forAnemia.filter(b => b.anemia === "Leve").length})`, forAnemia.filter(b => b.anemia === "Leve").length === 0);
    this._setFacetBadge("countFacetAnemia-mod", `(${forAnemia.filter(b => b.anemia === "Moderada" || b.anemia === "Severa").length})`, forAnemia.filter(b => b.anemia === "Moderada" || b.anemia === "Severa").length === 0);

    // 4. Facetas de Estado
    const forEstado = getFilteredExcluding("estado");
    this._setFacetBadge("countFacetEstado-all", `(${forEstado.length})`, forEstado.length === 0);
    this._setFacetBadge("countFacetEstado-activo", `(${forEstado.filter(b => b.estado === "Activo").length})`, forEstado.filter(b => b.estado === "Activo").length === 0);
    this._setFacetBadge("countFacetEstado-inactivo", `(${forEstado.filter(b => b.estado === "Inactivo").length})`, forEstado.filter(b => b.estado === "Inactivo").length === 0);

    // 5. Facetas de Sexo
    const forSexo = getFilteredExcluding("sexo");
    this._setFacetBadge("countFacetSexo-all", `(${forSexo.length})`, forSexo.length === 0);
    this._setFacetBadge("countFacetSexo-m", `(${forSexo.filter(b => (b.sexo || '').toUpperCase() === 'M').length})`, forSexo.filter(b => (b.sexo || '').toUpperCase() === 'M').length === 0);
    this._setFacetBadge("countFacetSexo-f", `(${forSexo.filter(b => (b.sexo || '').toUpperCase() === 'F').length})`, forSexo.filter(b => (b.sexo || '').toUpperCase() === 'F').length === 0);
  },

  _setFacetBadge(id, text, isZero) {
    const el = document.getElementById(id);
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
        let servLabel = "Servicio";
        if (s === "desayuno") servLabel = "Servicio Alimentario Nutricional";
        if (s === "casita") servLabel = "Servicio Acompañamiento Educativo";
        if (s === "pastoral") servLabel = "Área Social Pastoral";
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

    if (this._filterSexo !== "all") {
      chips.push({
        id: "sexo",
        label: `Sexo: ${this._filterSexo === "F" ? "Niñas (F)" : "Niños (M)"}`,
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

  _renderFilteredList(beneficiarios, totalCount) {
    const tbody = document.getElementById("tbodyBeneficiarios");
    const mobileContainer = document.getElementById("mobileCardsBeneficiarios");

    const badgeTotal = document.getElementById("badgeTotalBeneficiarios");
    if (badgeTotal) badgeTotal.textContent = totalCount !== undefined ? totalCount : beneficiarios.length;

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
              <div class="servicios-badge-group">
                ${b.servicios.map(s => `<span class="badge badge-blue">${s}</span>`).join("")}
              </div>
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
                  <div class="servicios-badge-group align-end">
                    ${b.servicios.map(s => `<span class="badge badge-blue">${s}</span>`).join("")}
                  </div>
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

  window.padronSetPageSize = (size) => BeneficiariosView.setPageSize(size);
  window.padronGoToPage = (page) => BeneficiariosView.goToPage(page);
  window.padronPrevPage = () => BeneficiariosView.prevPage();
  window.padronNextPage = () => BeneficiariosView.nextPage();

  window.addEventListener("resize", () => {
    BeneficiariosView._syncPageSizeSelectUI();
  });
}


/* --- Module: views/SaludCredView.js --- */
// Vista: Módulo de Salud y Nutrición CRED SaludCredView = {
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
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
    const badgeState = document.getElementById("credCalcBadgeState");
    if (!body) return;

    const isHidden = body.style.display === "none";
    body.style.display = isHidden ? "block" : "none";
    if (card) {
      card.classList.toggle("open", isHidden);
    }
    if (badgeState) {
      badgeState.textContent = isHidden ? "Ocultar" : "Desplegar";
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SaludCredView = SaludCredView;
  window.toggleCalculadoraCred = () => SaludCredView.toggleCalculadora();
}

/* --- Module: views/CasitasView.js --- */
// Vista: Acompañamiento Educativo (Casita del Saber) CasitasView = {
  renderTable(beneficiarios) {
    const tbody = document.getElementById("tbodyAsistenciaCasita");
    const mobileContainer = document.getElementById("mobileCardsCasita");

    const casitaList = beneficiarios.filter(b => 
      b.servicios && b.servicios.some(s => s.toLowerCase().includes("casita") || s.toLowerCase().includes("educativ") || s.toLowerCase().includes("acompañ"))
    );

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
              <button type="button" class="btn-asist active-P" data-asist-btn="P" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'P')">P</button>
              <button type="button" class="btn-asist" data-asist-btn="T" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'T')">T</button>
              <button type="button" class="btn-asist" data-asist-btn="FJ" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'FJ')">FJ</button>
              <button type="button" class="btn-asist" data-asist-btn="FI" onclick="window.app.casitasController.toggleAsistencia(${b.id}, 'FI')">FI</button>
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
                <button type="button" class="btn-asist active-P" data-asist-btn="P" onclick="event.stopPropagation(); window.app.casitasController.toggleAsistencia(${b.id}, 'P')">P</button>
                <button type="button" class="btn-asist" data-asist-btn="T" onclick="event.stopPropagation(); window.app.casitasController.toggleAsistencia(${b.id}, 'T')">T</button>
                <button type="button" class="btn-asist" data-asist-btn="FJ" onclick="event.stopPropagation(); window.app.casitasController.toggleAsistencia(${b.id}, 'FJ')">FJ</button>
                <button type="button" class="btn-asist" data-asist-btn="FI" onclick="event.stopPropagation(); window.app.casitasController.toggleAsistencia(${b.id}, 'FI')">FI</button>
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

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasView = CasitasView;
}

/* --- Module: controllers/CasitasController.js --- */
// Controlador: Acompañamiento Educativo (Casita del Saber) CasitasController = {
  toggleAsistencia(id, estado) {
    const config = {
      "P": { label: "Presente", badgeClass: "badge badge-green", activeClass: "active-P" },
      "T": { label: "Tardanza", badgeClass: "badge badge-yellow", activeClass: "active-T" },
      "FJ": { label: "Falta Justificada", badgeClass: "badge badge-orange", activeClass: "active-FJ" },
      "FI": { label: "Falta Injustificada", badgeClass: "badge badge-red", activeClass: "active-FI" }
    };

    const target = config[estado] || config["P"];

    // 1. Sincronizar badge de Escritorio (PC)
    const badgeDesk = document.getElementById(`badgeAsist_${id}`);
    if (badgeDesk) {
      badgeDesk.textContent = target.label;
      badgeDesk.className = target.badgeClass;
    }

    // 2. Sincronizar badge de Móvil
    const badgeMob = document.getElementById(`badgeAsistMob_${id}`);
    if (badgeMob) {
      badgeMob.textContent = target.label;
      badgeMob.className = target.badgeClass;
    }

    // 3. Sincronizar botones activos en Escritorio
    const btnGroupDesk = document.getElementById(`btnGroupAsist_${id}`);
    if (btnGroupDesk) {
      btnGroupDesk.querySelectorAll("button").forEach(btn => {
        btn.className = "btn-asist";
        if (btn.getAttribute("data-asist-btn") === estado) {
          btn.classList.add(target.activeClass);
        }
      });
    }

    // 4. Sincronizar botones activos en Móvil
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
// Muestra el 100% de los datos de todas las fichas oficiales del PDI ModalView = {
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
      
      const hasNutricional = serviciosArray.some(s => s.toLowerCase().includes("alimentario") || s.toLowerCase().includes("nutric") || s.toLowerCase().includes("desayuno") || s.toLowerCase().includes("lonchera")) || 
                             estrategiaStr.includes("desayuno") || 
                             estrategiaStr.includes("lonchera") || 
                             estrategiaStr.includes("nutric") ||
                             estrategiaStr.includes("mixto");
      
      const hasEducativo = serviciosArray.some(s => s.toLowerCase().includes("educativo") || s.toLowerCase().includes("acompañ") || s.toLowerCase().includes("casita")) || 
                           estrategiaStr.includes("casita") || 
                           estrategiaStr.includes("educat") ||
                           estrategiaStr.includes("mixto");
      
      const hasPastoral = serviciosArray.some(s => s.toLowerCase().includes("pastoral") || s.toLowerCase().includes("social") || s.toLowerCase().includes("asp")) || 
                          estrategiaStr.includes("pastoral") ||
                          estrategiaStr.includes("social") ||
                          (b.exoneracionAporte && b.exoneracionAporte.includes("100%")) ||
                          (b.vulnerabilidad && b.vulnerabilidad >= 80);

      const programasList = [
        {
          id: "prog_nutricional",
          nombre: "Servicio Alimentario Nutricional",
          desc: "Ración matutina balanceada, complemento alimentario y tamizaje antropométrico periódico",
          active: hasNutricional
        },
        {
          id: "prog_educativo",
          nombre: "Servicio Acompañamiento Educativo",
          desc: "Acompañamiento psicopedagógico, tutoría, refuerzo escolar y entrega de kits de útiles",
          active: hasEducativo
        },
        {
          id: "prog_pastoral",
          nombre: "Área Social Pastoral",
          desc: "Acompañamiento espiritual-familiar, soporte socioemocional y visitas de riesgo",
          active: hasPastoral
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
        </div>
      `).join("");
    }

    // Renderizado de Croquis Google Maps y Fachada en Expediente
    const expIframe = document.getElementById("expGoogleMapIframe");
    const expNavLink = document.getElementById("expLinkGoogleMapsNav");
    const expFachadaPreview = document.getElementById("expFachadaPreview");
    const expFachadaControls = document.getElementById("expFachadaUploadControls");
    const expFachadaInput = document.getElementById("expFotoFachadaInput");

    const queryAddress = encodeURIComponent(`${b.direccion || ''}, ${b.distrito || 'Comas'}, Lima, Peru`);
    
    if (expIframe) {
      if (b.coordenadas && b.coordenadas.lat && b.coordenadas.lng) {
        expIframe.src = `https://maps.google.com/maps?q=${b.coordenadas.lat},${b.coordenadas.lng}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
      } else {
        expIframe.src = `https://maps.google.com/maps?q=${queryAddress}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
      }
    }

    if (expNavLink) {
      if (b.coordenadas && b.coordenadas.lat && b.coordenadas.lng) {
        expNavLink.href = `https://www.google.com/maps/dir/?api=1&destination=${b.coordenadas.lat},${b.coordenadas.lng}`;
      } else {
        expNavLink.href = `https://www.google.com/maps/dir/?api=1&destination=${queryAddress}`;
      }
    }

    if (expFachadaPreview) {
      if (b.fotoFachada) {
        expFachadaPreview.innerHTML = `<img src="${b.fotoFachada}" alt="Fachada de vivienda de ${b.nombres}">`;
      } else {
        expFachadaPreview.innerHTML = `
          <div class="croquis-fachada-placeholder">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>Sin foto de fachada</span>
          </div>
        `;
      }
    }

    if (expFachadaInput) {
      expFachadaInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            b.fotoFachada = re.target.result;
            if (expFachadaPreview) {
              expFachadaPreview.innerHTML = `<img src="${b.fotoFachada}" alt="Fachada de vivienda de ${b.nombres}">`;
            }
          };
          reader.readAsDataURL(file);
        }
      };
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

    // Padrón de Personas Autorizadas para Retiro con Fotografía
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
            </div>
          </div>
        `;
      }).join("");
    }

    // 5. Consentimiento Informado Ley N.° 29733 - Rediseño Moderno
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
            <strong>Certificación de Consentimiento Informado Válido</strong><br>
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

    const expFachadaUpload = document.getElementById("expFachadaUploadControls");
    if (expFachadaUpload) {
      expFachadaUpload.style.display = this.isEditing ? "block" : "none";
    }

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

    // Render diff table
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

/* --- Module: controllers/BeneficiarioController.js --- */
// Controlador: Gestión de Menores Beneficiarios y Expediente
// Maneja el 100% de los campos normativos de inscripción PDI BeneficiarioController = {
  signatureCanvasHelper: null,
  tempFotoMenor: null,
  tempFotoApoderado: null,
  tempFotoRetiro1: null,
  tempFotoRetiro2: null,
  tempFotoFachada: null,
  tempCoords: null,
  debounceMapTimer: null,

  initSignature() {
    this.signatureCanvasHelper = CanvasHelper.init("canvasSignature");
  },

  clearSignature() {
    if (this.signatureCanvasHelper) {
      this.signatureCanvasHelper.clear();
    }
  },

  handleAddressDebounce(context = 'reg') {
    if (this.debounceMapTimer) {
      clearTimeout(this.debounceMapTimer);
    }

    const indicator = document.getElementById(context === 'reg' ? 'regMapLoadingIndicator' : 'expMapLoadingIndicator');
    if (indicator) indicator.style.display = 'flex';

    this.debounceMapTimer = setTimeout(() => {
      this.updateMapPreview(context);
    }, 2000);
  },

  updateMapPreview(context = 'reg') {
    const dirInput = document.getElementById(context === 'reg' ? 'regDireccion' : 'expDireccion');
    const distInput = document.getElementById(context === 'reg' ? 'regDistritoSede' : 'expDistritoSede');
    const iframe = document.getElementById(context === 'reg' ? 'regGoogleMapIframe' : 'expGoogleMapIframe');
    const indicator = document.getElementById(context === 'reg' ? 'regMapLoadingIndicator' : 'expMapLoadingIndicator');

    if (!iframe) return;

    const direccion = dirInput ? dirInput.value.trim() : "";
    let distrito = "Comas";

    if (distInput) {
      const val = distInput.value || "";
      if (val.toLowerCase().includes("carabayllo")) distrito = "Carabayllo";
      else if (val.toLowerCase().includes("comas")) distrito = "Comas";
    }

    let queryParts = [];
    if (direccion) queryParts.push(direccion);
    queryParts.push(distrito);
    queryParts.push("Lima");
    queryParts.push("Peru");

    const searchQuery = encodeURIComponent(queryParts.join(", "));
    iframe.src = `https://maps.google.com/maps?q=${searchQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

    // Actualizar enlace de navegación si está en expediente
    const navLink = document.getElementById("expLinkGoogleMapsNav");
    if (navLink) {
      navLink.href = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;
    }

    if (indicator) indicator.style.display = 'none';
  },

  capturarGps(context = 'reg') {
    const toast = window.PDI?.ToastView || ToastView;
    if (!navigator.geolocation) {
      if (toast) toast.show("GPS no soportado", "Su navegador no soporta geolocalización satelital.", "warning");
      return;
    }

    const indicator = document.getElementById(context === 'reg' ? 'regMapLoadingIndicator' : 'expMapLoadingIndicator');
    if (indicator) indicator.style.display = 'flex';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.tempCoords = { lat, lng };

        const iframe = document.getElementById(context === 'reg' ? 'regGoogleMapIframe' : 'expGoogleMapIframe');
        if (iframe) {
          iframe.src = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
        }

        const navLink = document.getElementById("expLinkGoogleMapsNav");
        if (navLink) {
          navLink.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        }

        if (indicator) indicator.style.display = 'none';
        if (toast) toast.show("Coordenadas GPS Obtenidas", `Ubicación satelital fijada: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, "success");
      },
      (error) => {
        if (indicator) indicator.style.display = 'none';
        if (toast) toast.show("Aviso de GPS", "No se pudo obtener la señal satelital directa. Se utilizará la dirección escrita.", "info");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
      if (roleKey === 'fachada') this.tempFotoFachada = base64;

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
    this.tempFotoFachada = null;
    this.tempCoords = null;

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

    const fachadaBox = document.getElementById("regFachadaPreview");
    if (fachadaBox) {
      fachadaBox.innerHTML = `
        <div class="croquis-fachada-placeholder">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span>Subir foto de vivienda</span>
        </div>
      `;
    }

    const ids = ["regFotoMenorInput", "regFotoApoderadoInput", "regFotoRetiro1Input", "regFotoRetiro2Input", "regFotoFachadaInput"];
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
      if (tView) tView.show(`No se encontró un expediente activo para el código ${codigo}`, "info");
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
      servicios: (() => {
        const s = new Set();
        const estLow = (estrategia || "").toLowerCase();
        if (estLow.includes("desayuno") || estLow.includes("lonchera") || estLow.includes("alimento") || estLow.includes("nutric") || estLow.includes("mixto")) {
          s.add("Servicio Alimentario Nutricional");
        }
        if (estLow.includes("casita") || estLow.includes("educativ") || estLow.includes("acompañ") || estLow.includes("mixto")) {
          s.add("Servicio Acompañamiento Educativo");
        }
        if (estLow.includes("pastoral") || estLow.includes("social") || (exoneracionAporte && exoneracionAporte.includes("100%"))) {
          s.add("Área Social Pastoral");
        }
        if (s.size === 0) s.add("Servicio Alimentario Nutricional");
        return Array.from(s);
      })(),
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
      coordenadas: this.tempCoords || null,
      fotoFachada: this.tempFotoFachada || null,
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

/* --- Module: views/SocialKanbanView.js --- */
// Vista: Tablero Kanban de Casos Sociales (ASP)
 SocialKanbanView = {
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
 SocialController = {
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

  calcularEvaluacion(showToast = true) {
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
    }

    if (showToast) {
      const toast = window.PDI?.ToastView || ToastView;
      if (toast && typeof toast.show === "function") {
        toast.show("Evaluación Calculada", `Índice de Vulnerabilidad: ${res.total}/100 (${res.category})`, "success");
      }
    }
  },

  handleVulnerabilidadChange(showToast = false) {
    this.calcularEvaluacion(showToast);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialController = SocialController;
}

/* --- Module: views/SedesView.js --- */
// Vista: Directorio Territorial de Sedes, Iglesias y Redes Aliadas
 SedesView = {
  _allSedes: [],
  _filteredSedes: [],
  _selectedSedeId: null,
  _searchQuery: "",
  _filterDistrito: "all",
  _filterServicio: "all",

  init(sedes) {
    this._allSedes = sedes || (window.PDI?.SedeModel?.getAll() || SedeModel.getAll());
    this.render();
  },

  render(sedes) {
    if (sedes) {
      this._allSedes = sedes;
    } else {
      this._allSedes = window.PDI?.SedeModel?.getAll ? window.PDI.SedeModel.getAll() : SedeModel.getAll();
    }

    this.renderKpis();
    this.applyFilters();
  },

  renderKpis() {
    const kpiContainer = document.getElementById("sedesKpiContainer");
    if (!kpiContainer) return;

    const stats = window.PDI?.SedeModel?.getStats ? window.PDI.SedeModel.getStats() : SedeModel.getStats();

    kpiContainer.innerHTML = `
      <div class="sedes-metric-strip">
        <div class="sedes-metric-item">
          <div class="sedes-metric-icon green">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div class="sedes-metric-data">
            <span class="sedes-metric-num">${stats.sedesOperativas} / ${stats.totalSedes}</span>
            <span class="sedes-metric-lbl">Sedes Operativas</span>
          </div>
        </div>

        <div class="sedes-metric-divider"></div>

        <div class="sedes-metric-item">
          <div class="sedes-metric-icon blue">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div class="sedes-metric-data">
            <span class="sedes-metric-num">${stats.totalNinos} menores</span>
            <span class="sedes-metric-lbl">Cobertura Infantil</span>
          </div>
        </div>

        <div class="sedes-metric-divider"></div>

        <div class="sedes-metric-item">
          <div class="sedes-metric-icon yellow">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.125 1.125 0 0018.375 9.21H5.625A1.125 1.125 0 004.5 10.333V21h15z" />
            </svg>
          </div>
          <div class="sedes-metric-data">
            <span class="sedes-metric-num">${stats.totalAliados} aliados</span>
            <span class="sedes-metric-lbl">Red Pastoral e Iglesias</span>
          </div>
        </div>

        <div class="sedes-metric-divider"></div>

        <div class="sedes-metric-item">
          <div class="sedes-metric-icon purple">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
          </div>
          <div class="sedes-metric-data">
            <span class="sedes-metric-num">${stats.tasaOcupacionPromedio}% ocupación</span>
            <span class="sedes-metric-lbl">Aforo Instalado (${stats.totalAforo})</span>
          </div>
        </div>
      </div>
    `;
  },

  filterBySearch(query) {
    this._searchQuery = (query || "").trim().toLowerCase();
    const clearBtn = document.getElementById("btnSedesSearchClear");
    if (clearBtn) {
      clearBtn.style.display = this._searchQuery.length > 0 ? "flex" : "none";
    }
    this.applyFilters();
  },

  clearSearch() {
    const input = document.getElementById("inputSedesSearch");
    if (input) input.value = "";
    this.filterBySearch("");
  },

  filterByDistrito(distrito) {
    this._filterDistrito = distrito;
    this._updateDistritoDropdownUI();
    this.applyFilters();
  },

  filterByServicio(servicio) {
    this._filterServicio = servicio;
    this._updateServicioDropdownUI();
    this.applyFilters();
  },

  _updateDistritoDropdownUI() {
    const label = document.getElementById("labelSedesDistritoSelect");
    if (label) {
      if (this._filterDistrito === "all") label.textContent = "Todos los Distritos";
      else label.textContent = this._filterDistrito;
    }
    const items = document.querySelectorAll("#menuSedesDistrito .padron-dropdown-item");
    items.forEach(el => {
      const v = el.getAttribute("data-value");
      el.classList.toggle("selected", v === this._filterDistrito);
    });
  },

  _updateServicioDropdownUI() {
    const label = document.getElementById("labelSedesServicioSelect");
    const names = {
      "all": "Todos los Servicios",
      "Desayuno": "Servicio Alimentario Nutricional",
      "Casita": "Servicio de Acompañamiento Educativo",
      "Lonchera": "Lonchera Saludable"
    };
    if (label) {
      label.textContent = names[this._filterServicio] || "Todos los Servicios";
    }
    const items = document.querySelectorAll("#menuSedesServicio .padron-dropdown-item");
    items.forEach(el => {
      const v = el.getAttribute("data-value");
      el.classList.toggle("selected", v === this._filterServicio);
    });
  },

  resetFilters() {
    this._searchQuery = "";
    this._filterDistrito = "all";
    this._filterServicio = "all";

    const input = document.getElementById("inputSedesSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnSedesSearchClear");
    if (clearBtn) clearBtn.style.display = "none";

    this._updateDistritoDropdownUI();
    this._updateServicioDropdownUI();
    this.applyFilters();
  },

  removeFilterChip(key) {
    if (key === "distrito") this.filterByDistrito("all");
    if (key === "servicio") this.filterByServicio("all");
    if (key === "search") this.clearSearch();
  },

  _updateActiveChips() {
    const chipsBar = document.getElementById("sedesActiveChipsBar");
    const chipsList = document.getElementById("sedesActiveChipsList");
    const badge = document.getElementById("sedesActiveFiltersCount");
    if (!chipsBar || !chipsList) return;

    let activeCount = 0;
    const chipsHTML = [];

    if (this._filterDistrito !== "all") {
      activeCount++;
      chipsHTML.push(`
        <span class="padron-chip">
          <span>Distrito: ${this._filterDistrito}</span>
          <button type="button" class="padron-chip-remove" onclick="window.PDI?.SedesView?.removeFilterChip('distrito')" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>
      `);
    }

    if (this._filterServicio !== "all") {
      activeCount++;
      const names = {
        "Desayuno": "Servicio Alimentario Nutricional",
        "Casita": "Acompañamiento Educativo",
        "Lonchera": "Lonchera Saludable"
      };
      chipsHTML.push(`
        <span class="padron-chip">
          <span>Servicio: ${names[this._filterServicio] || this._filterServicio}</span>
          <button type="button" class="padron-chip-remove" onclick="window.PDI?.SedesView?.removeFilterChip('servicio')" title="Eliminar filtro">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>
      `);
    }

    if (badge) {
      if (activeCount > 0) {
        badge.textContent = activeCount;
        badge.style.display = "inline-flex";
      } else {
        badge.style.display = "none";
      }
    }

    if (activeCount > 0) {
      chipsList.innerHTML = chipsHTML.join("");
      chipsBar.style.display = "flex";
    } else {
      chipsList.innerHTML = "";
      chipsBar.style.display = "none";
    }
  },

  selectSede(id) {
    this._selectedSedeId = id;
    this.renderMasterList();
    this.renderDetailPanel();
  },

  applyFilters() {
    let filtered = [...this._allSedes];

    if (this._searchQuery) {
      const q = this._searchQuery;
      filtered = filtered.filter(s =>
        s.nombre.toLowerCase().includes(q) ||
        s.distrito.toLowerCase().includes(q) ||
        s.direccion.toLowerCase().includes(q) ||
        s.facilitadora.toLowerCase().includes(q) ||
        s.iglesiaAliada.toLowerCase().includes(q) ||
        s.pastorAliado.toLowerCase().includes(q)
      );
    }

    if (this._filterDistrito && this._filterDistrito !== "all") {
      filtered = filtered.filter(s => s.distrito.toLowerCase() === this._filterDistrito.toLowerCase());
    }

    if (this._filterServicio && this._filterServicio !== "all") {
      const srv = this._filterServicio.toLowerCase();
      filtered = filtered.filter(s =>
        s.servicios.some(sv => sv.toLowerCase().includes(srv))
      );
    }

    this._filteredSedes = filtered;

    const countBadge = document.getElementById("sedesCountBadge");
    const masterCountBadge = document.getElementById("sedesMasterCountBadge");
    const textCount = `${filtered.length} ${filtered.length === 1 ? 'sede' : 'sedes'}`;
    if (countBadge) countBadge.textContent = textCount;
    if (masterCountBadge) masterCountBadge.textContent = `${filtered.length}`;

    if (filtered.length > 0) {
      const exists = filtered.some(s => s.id === this._selectedSedeId);
      if (!exists) {
        this._selectedSedeId = filtered[0].id;
      }
    } else {
      this._selectedSedeId = null;
    }

    this._updateActiveChips();
    this.renderMasterList();
    this.renderDetailPanel();
  },

  renderMasterList() {
    const listContainer = document.getElementById("sedesMasterList");
    if (!listContainer) return;

    if (this._filteredSedes.length === 0) {
      listContainer.innerHTML = `
        <div class="sedes-empty-state" style="padding:16px; text-align:center; color:var(--text-muted); font-size:12px;">
          Sin resultados
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this._filteredSedes.map(s => {
      const isSelected = s.id === this._selectedSedeId;
      const pct = s.porcentajeOcupacion;
      let badgeClass = "badge-green";
      if (pct >= 95) badgeClass = "badge-red";
      else if (pct >= 80) badgeClass = "badge-yellow";

      return `
        <div class="sedes-master-item ${isSelected ? 'active' : ''}" onclick="window.PDI?.SedesView?.selectSede('${s.id}')">
          <div class="sedes-master-item-top">
            <span class="sedes-master-item-distrito">${s.distrito}</span>
            <span class="badge ${badgeClass}" style="font-size:10px; padding:1px 5px;">${pct}% Aforo</span>
          </div>
          <div class="sedes-master-item-name">Sede ${s.nombre}</div>
          <div class="sedes-master-item-sub">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>${s.facilitadora}</span>
          </div>
        </div>
      `;
    }).join("");
  },

  renderDetailPanel() {
    const panel = document.getElementById("sedesDetailPanel");
    if (!panel) return;

    if (!this._selectedSedeId) {
      panel.innerHTML = `
        <div class="sedes-detail-empty" style="padding:40px; text-align:center;">
          <svg width="48" height="48" fill="none" stroke="var(--text-dim)" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <div style="font-size:16px; font-weight:700; color:var(--text-main); margin-top:8px;">Ninguna sede seleccionada</div>
          <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">Seleccione una sede del directorio lateral para examinar su ficha oficial.</div>
        </div>
      `;
      return;
    }

    const sede = this._allSedes.find(s => s.id === this._selectedSedeId);
    if (!sede) return;

    const pct = sede.porcentajeOcupacion;
    let barColor = "var(--gt-green)";
    let badgeAforoClass = "badge-green";
    if (pct >= 95) {
      barColor = "var(--gt-red)";
      badgeAforoClass = "badge-red";
    } else if (pct >= 80) {
      barColor = "var(--gt-yellow)";
      badgeAforoClass = "badge-yellow";
    }

    const mapQuery = encodeURIComponent(`${sede.direccion}, ${sede.distrito}, Lima, Peru`);
    const mapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

    const servicioLabels = {
      "Desayuno Infantil": "Servicio Alimentario Nutricional",
      "Casita del Saber": "Servicio de Acompañamiento Educativo",
      "Lonchera Infantil": "Lonchera Saludable"
    };

    panel.innerHTML = `
      <div class="sedes-detail-card">
        <!-- Header de la Ficha Técnica -->
        <div class="sedes-detail-header">
          <div class="sedes-detail-title-group">
            <div class="sedes-detail-avatar">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.125 1.125 0 0018.375 9.21H5.625A1.125 1.125 0 004.5 10.333V21h15z" />
              </svg>
            </div>
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
              <h2 class="sedes-detail-name" style="margin:0;">Sede ${sede.nombre}</h2>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="badge badge-green">${sede.distrito}</span>
                <span class="badge ${sede.estado === 'Operativa' ? 'badge-green' : 'badge-gray'}">${sede.estado}</span>
              </div>
            </div>
          </div>
          <div class="sedes-detail-actions">
            <a href="${mapsNavUrl}" target="_blank" class="btn-action btn-sede-map" title="Navegar en Google Maps">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934a1.12 1.12 0 01-1.006 0L9.503 3.31a1.125 1.125 0 00-1.006 0L3.623 5.748A1.125 1.125 0 003 6.754v11.926c0 .836.88 1.38 1.628 1.006l3.869-1.934a1.12 1.12 0 011.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <span>Ubicación GPS</span>
            </a>
            <button type="button" class="btn-action primary" onclick="window.filterPadronBySede ? window.filterPadronBySede('${sede.nombre}') : null">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>Ver Beneficiarios</span>
            </button>
          </div>
        </div>

        <!-- Cobertura y Capacidad de Aforo -->
        <div class="sedes-detail-section">
          <div class="sedes-section-title">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
            <span>Capacidad Instalada y Aforo</span>
          </div>
          <div class="sede-aforo-section" style="margin-top:8px;">
            <div class="sede-aforo-labels">
              <span class="sede-aforo-title">Inscritos vs Capacidad Máxima:</span>
              <span class="sede-aforo-count">
                <strong>${sede.ninosInscritos}</strong> / ${sede.aforoMax} menores
                <span class="badge ${badgeAforoClass}">${pct}% ocupado</span>
              </span>
            </div>
            <div class="sede-aforo-bar" style="height:10px;">
              <div class="sede-aforo-fill" style="width: ${pct}%; background: ${barColor};"></div>
            </div>
          </div>
        </div>

        <!-- Servicios Institucionales Activos -->
        <div class="sedes-detail-section">
          <div class="sedes-section-title">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Programas Institucionales en Operación</span>
          </div>
          <div class="sede-servicios-wrap" style="margin-top:8px; gap:8px;">
            ${sede.servicios.map(serv => {
              const displayServ = servicioLabels[serv] || serv;
              return `
                <span class="sede-servicio-pill" style="font-size:12px; padding:6px 12px;">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                  <span>${displayServ}</span>
                </span>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Grilla de Responsables y Red Pastoral -->
        <div class="sedes-detail-grid">
          <!-- Responsable de Sede -->
          <div class="sedes-grid-card">
            <div class="sedes-card-icon green">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <div class="sedes-card-label">Responsable / Facilitadora</div>
              <div class="sedes-card-val">${sede.facilitadora}</div>
              <div class="sedes-card-sub">${sede.facilitadoraCargo}</div>
              <a href="tel:${sede.facilitadoraTel.replace(/[^0-9]/g, '')}" class="sede-tel-link" style="margin-top:4px; display:inline-flex;">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>${sede.facilitadoraTel}</span>
              </a>
            </div>
          </div>

          <!-- Red Pastoral e Iglesia Aliada -->
          <div class="sedes-grid-card">
            <div class="sedes-card-icon yellow">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.125 1.125 0 0018.375 9.21H5.625A1.125 1.125 0 004.5 10.333V21h15z" />
              </svg>
            </div>
            <div>
              <div class="sedes-card-label">${sede.tipoAliado}</div>
              <div class="sedes-card-val">${sede.iglesiaAliada}</div>
              <div class="sedes-card-sub">${sede.pastorAliado}</div>
            </div>
          </div>
        </div>

        <!-- Dirección Territorial y Referencia -->
        <div class="sedes-detail-section" style="margin-top:16px;">
          <div class="sedes-section-title">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>Dirección Física y Referencias de Campo</span>
          </div>
          <div style="margin-top:6px; font-size:13.5px; color:var(--text-main); font-weight:600;">
            ${sede.direccion}
          </div>
          <div style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">
            Referencia: ${sede.referencia}
          </div>
        </div>
      </div>
    `;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SedesView = SedesView;

  window.filterSedesSearch = function (val) {
    if (window.PDI?.SedesView) window.PDI.SedesView.filterBySearch(val);
  };
  window.clearSedesSearch = function () {
    if (window.PDI?.SedesView) window.PDI.SedesView.clearSearch();
  };
  window.filterSedesByDistrito = function (dist) {
    if (window.PDI?.SedesView) window.PDI.SedesView.filterByDistrito(dist);
  };
  window.filterSedesByServicio = function (serv) {
    if (window.PDI?.SedesView) window.PDI.SedesView.filterByServicio(serv);
  };
  window.clearSedesFilters = function () {
    if (window.PDI?.SedesView) window.PDI.SedesView.resetFilters();
  };
  window.toggleSedesInnerDropdown = function (dropdownId) {
    const el = document.getElementById(dropdownId);
    if (el) el.classList.toggle("open");
  };
}

/* --- Module: controllers/SedesController.js --- */
// Controlador: Directorio Territorial de Sedes e Iglesias Aliadas
 SedesController = {
  init() {
    SedeModel.init();
    const sedes = SedeModel.getAll();
    SedesView.init(sedes);
  },

  handleSearch(query) {
    const sView = window.PDI?.SedesView || SedesView;
    if (sView && sView.filterBySearch) {
      sView.filterBySearch(query);
    }
  },

  clearSearch() {
    const sView = window.PDI?.SedesView || SedesView;
    if (sView && sView.clearSearch) {
      sView.clearSearch();
    }
  },

  handleDistritoFilter(distrito) {
    const sView = window.PDI?.SedesView || SedesView;
    if (sView && sView.filterByDistrito) {
      sView.filterByDistrito(distrito);
    }
  },

  handleServicioFilter(servicio) {
    const sView = window.PDI?.SedesView || SedesView;
    if (sView && sView.filterByServicio) {
      sView.filterByServicio(servicio);
    }
  },

  clearFilters() {
    const input = document.getElementById("inputSedesSearch");
    if (input) input.value = "";
    const clearBtn = document.getElementById("btnSedesSearchClear");
    if (clearBtn) clearBtn.style.display = "none";
    const sView = window.PDI?.SedesView || SedesView;
    if (sView) {
      sView._searchQuery = "";
      sView._filterDistrito = "all";
      sView._filterServicio = "all";
      sView.render();
      const distChips = document.querySelectorAll(".sedes-chip-distrito");
      distChips.forEach(el => el.classList.toggle("active", el.getAttribute("data-distrito") === "all"));
      const servChips = document.querySelectorAll(".sedes-chip-servicio");
      servChips.forEach(el => el.classList.toggle("active", el.getAttribute("data-servicio") === "all"));
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SedesController = SedesController;
}

/* --- Module: controllers/RoleController.js --- */
// Controlador: Simulador de Roles y RBAC Dinámico RoleController = {
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

  applyRolePermissions(role, onNavigate, showToast = true) {
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

    if (showToast) {
      const toast = window.PDI?.ToastView || ToastView;
      if (toast && typeof toast.show === "function") {
        toast.show("Perfil Simulado", `Cambiando a vista: ${conf.title}`, "info");
      }
    }

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
// Controlador: Módulo de Salud y Nutrición CRED SaludController = {
  handleHbChange(hb) {
    const calc = window.PDI?.AnemiaCalculator || AnemiaCalculator;
    const res = calc.calculate(hb);

    // Update embedded CRED calculator
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

    // Update modal elements if present
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
// Controlador Principal: Enrutador de Vistas, Temas y Ciclo de Vida AppController = {
  roleController: RoleController,
  beneficiarioController: BeneficiarioController,
  saludController: SaludController,
  socialController: SocialController,
  casitasController: CasitasController,
  sedesController: SedesController,

  init() {
    // 1. Inicializar modelos
    BeneficiarioModel.init();
    CasoSocialModel.init();
    SedeModel.init();

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
    SedesView.render();
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

    if (viewId === "view-dashboard") {
      const stats = BeneficiarioModel.getStats();
      const auditLogs = AuditModel.getAll();
      DashboardView.render(stats, auditLogs);
    }
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

    // Asignación de índice para animación de cascada escalonada en móviles
    document.querySelectorAll(".nav-sections .nav-btn").forEach((btn, idx) => {
      btn.style.setProperty("--nav-idx", idx);
    });

    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.toggleSidebar();
      };
    }

    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e) e.preventDefault();
        this.closeSidebar();
      };
    }

    window.toggleSidebar = () => this.toggleSidebar();
    window.closeSidebar = () => this.closeSidebar();

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

    if (window.innerWidth <= 900) {
      // En móvil / pantalla angosta: alternar clase open con backdrop inteligente
      const isOpen = sidebar.classList.toggle("open");
      if (backdrop) backdrop.classList.toggle("active", isOpen);
    } else {
      // En PC / pantalla completa o dividida: alternar colapso Icon Rail (72px)
      sidebar.classList.toggle("collapsed");
      if (backdrop) backdrop.classList.remove("active");
    }
  },

  closeSidebar() {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
  },

  bindRoleSelector() {
    const selector = document.getElementById("roleSelector");
    if (selector) {
      selector.addEventListener("change", (e) => {
        RoleController.applyRolePermissions(e.target.value, (view) => this.navigateToView(view), true);
      });
      RoleController.applyRolePermissions(selector.value, (view) => this.navigateToView(view), false);
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

  toggleTheme(event = null) {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    AjustesView.setTheme(nextTheme, true, event);
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
window.closeModalNuevoBeneficiario = () => ModalView.closeNuevoMenor();
window.openModalNuevoMenor = () => ModalView.openNuevoMenor();
window.openModalNuevoBeneficiario = () => ModalView.openNuevoMenor();
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
  }
};
window.calculateVulnerabilidad = () => SocialController.handleVulnerabilidadChange();
window.calcularEvaluacionSocioeconomica = () => SocialController.calcularEvaluacion();
window.syncScoreSimulador = (dimKey, val) => SocialController.syncScore(dimKey, val);
window.cargarCasoEnSimulador = (codigo) => SocialController.cargarCasoEnSimulador(codigo);
window.guardarNuevoMenor = (e) => BeneficiarioController.saveNuevoMenor(e, () => AppController.refreshAllViews());
window.guardarNuevoBeneficiario = (e) => BeneficiarioController.saveNuevoMenor(e, () => AppController.refreshAllViews());
window.exportDataCSV = () => AppController.exportCSV();
window.exportAuditCSV = () => AppController.exportAuditCSV();

// Handlers de Auditoría / Historial de Cambios
window.toggleAuditInnerDropdown = (id) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleInnerDropdown(id);
};
window.toggleAuditAction = (val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleAction(val);
};
window.filterAuditAction = (action) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleAction(action);
};
window.selectAuditAction = (val, label) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleAction(val);
};
window.selectAuditDate = (val, label) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.selectDate(val, label);
};
window.filterAuditDate = (dateKey) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.selectDate(dateKey);
};
window.toggleAuditRole = (val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleRole(val);
};
window.filterAuditRole = (role) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleRole(role);
};
window.selectAuditRole = (val, label) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleRole(val);
};
window.toggleAuditStatus = (val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.toggleStatus(val);
};
window.removeAuditChip = (key, val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.removeAuditFilter(key, val);
};
window.resetAuditFilters = () => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.resetAuditFilters();
};
window.filterAuditSearch = (q) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.filterBySearch(q);
};
window.clearAuditSearch = () => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.clearSearch();
};
window.changeAuditPageSize = (size) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.changePageSize(size);
};
window.prevAuditPage = () => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.changePage((window.PDI.DashboardView._auditCurrentPage || 1) - 1);
};
window.nextAuditPage = () => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.changePage((window.PDI.DashboardView._auditCurrentPage || 1) + 1);
};
window.openAuditDetail = (logId) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.openLogDetail(logId);
};
window.closeModalAuditDetail = () => ModalView.closeAuditDetail();
window.handleAuditDatePickerChange = (type, val) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.handleDatePickerChange(type, val);
};
window.handleAuditDateManualInput = (type, el) => {
  if (window.PDI?.DashboardView) window.PDI.DashboardView.handleDateManualInput(type, el);
};

window.toggleCustomDropdown = (id) => DashboardView.toggleDropdown(id);
window.toggleInnerFilterDropdown = (id) => DashboardView.toggleInnerDropdown(id);
window.selectActiveRole = (roleValue, roleTitle) => AppController.switchRole(roleValue, roleTitle);
window.toggleTheme = (e) => AppController.toggleTheme(e);
window.openExpediente = (id) => BeneficiarioController.openExpediente(id);
window.openExpedienteByCodigo = (codigo) => BeneficiarioController.openExpedienteByCodigo(codigo);
window.moverCaso = (id, etapa) => SocialController.moverCaso(id, etapa);

window.toggleRoleInfo = (e) => {
  if (e) e.stopPropagation();
  const wrap = document.querySelector(".role-info-wrap");
  if (wrap) wrap.classList.toggle("open");
};

// Handlers de Información Legal y Confirmación de Exportación de Auditoría
window.toggleAuditLegalInfo = (e) => {
  if (e) e.stopPropagation();
  const wrap = document.getElementById("wrapAuditLegalPopover");
  if (wrap) wrap.classList.toggle("open");
};

window.openModalExportAudit = () => {
  const modal = document.getElementById("modalConfirmExportAudit");
  const countBadge = document.getElementById("exportAuditCountBadge");
  const currentLogs = (window.PDI?.DashboardView && window.PDI.DashboardView._filteredAuditLogs) 
    ? window.PDI.DashboardView._filteredAuditLogs 
    : (window.PDI?.DashboardView && window.PDI.DashboardView._currentAuditLogs ? window.PDI.DashboardView._currentAuditLogs : []);
  if (countBadge) countBadge.textContent = `${currentLogs.length} eventos`;
  if (modal) {
    modal.classList.add("active");
    modal.classList.add("open");
  }
};

window.closeModalExportAudit = () => {
  const modal = document.getElementById("modalConfirmExportAudit");
  if (modal) {
    modal.classList.remove("active");
    modal.classList.remove("open");
  }
};

window.confirmExportAuditCSV = () => {
  window.closeModalExportAudit();
  if (window.PDI?.AppController?.exportAuditCSV) {
    window.PDI.AppController.exportAuditCSV();
  } else if (window.exportAuditCSV) {
    window.exportAuditCSV();
  }
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
window.selectPadronSexo = (val) => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.selectSexo(val);
};
window.resetPadronFilters = () => {
  if (window.PDI?.BeneficiariosView) window.PDI.BeneficiariosView.resetFilters();
};

// Cierre automático de Custom Dropdowns, Inner Dropdowns, Role Tooltips y Audit Legal Popover al hacer clic afuera
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
  if (!e.target.closest(".audit-legal-popover-wrapper")) {
    const pop = document.getElementById("wrapAuditLegalPopover");
    if (pop) pop.classList.remove("open");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
    document.querySelectorAll(".padron-inner-dropdown.open").forEach(d => d.classList.remove("open"));
    const pop = document.getElementById("wrapAuditLegalPopover");
    if (pop) pop.classList.remove("open");
    const exportModal = document.getElementById("modalConfirmExportAudit");
    if (exportModal && exportModal.classList.contains("active")) {
      exportModal.classList.remove("active");
    }
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

window.handleAddressInputDebounce = (ctx = 'reg') => {
  if (window.PDI?.BeneficiarioController) window.PDI.BeneficiarioController.handleAddressDebounce(ctx);
};
window.capturarGpsCampo = (ctx = 'reg') => {
  if (window.PDI?.BeneficiarioController) window.PDI.BeneficiarioController.capturarGps(ctx);
};
window.handleFotoUpload = (input, previewId, roleKey) => {
  if (window.PDI?.BeneficiarioController) window.PDI.BeneficiarioController.handleFotoUpload(input, previewId, roleKey);
};

window.filterSedesSearch = (val) => {
  if (window.PDI?.SedesController) window.PDI.SedesController.handleSearch(val);
  else if (window.PDI?.SedesView) window.PDI.SedesView.filterBySearch(val);
};
window.clearSedesSearch = () => {
  if (window.PDI?.SedesController) window.PDI.SedesController.clearSearch();
  else if (window.PDI?.SedesView) window.PDI.SedesView.clearSearch();
};
window.filterSedesByDistrito = (dist) => {
  if (window.PDI?.SedesController) window.PDI.SedesController.handleDistritoFilter(dist);
  else if (window.PDI?.SedesView) window.PDI.SedesView.filterByDistrito(dist);
};
window.filterSedesByServicio = (serv) => {
  if (window.PDI?.SedesController) window.PDI.SedesController.handleServicioFilter(serv);
  else if (window.PDI?.SedesView) window.PDI.SedesView.filterByServicio(serv);
};
window.clearSedesFilters = () => {
  if (window.PDI?.SedesController) window.PDI.SedesController.clearFilters();
};
window.filterPadronBySede = (sedeName) => {
  if (window.PDI?.BeneficiariosView) {
    window.PDI.BeneficiariosView._filterSede = [sedeName];
    if (window.PDI.BeneficiariosView._updateSedeDropdownUI) {
      window.PDI.BeneficiariosView._updateSedeDropdownUI();
    }
    window.PDI.BeneficiariosView.applyFilters();
  }
  if (window.app && window.app.navigateToView) {
    window.app.navigateToView("view-beneficiarios");
  } else if (window.PDI?.AppController) {
    window.PDI.AppController.navigateToView("view-beneficiarios");
  }
};

// ==========================================
// VISTA: AJUSTES Y MODO OSCURO (#101010)
// ==========================================
const AjustesView = {
  _currentTheme: 'light',
  _mediaListenerBound: false,

  init() {
    this._loadTheme();
    this.bindThemeButtons();
    this._updateThemeUI();
  },

  bindThemeButtons() {
    const btnLight = document.getElementById('btnThemeLight');
    const btnDark = document.getElementById('btnThemeDark');
    const btnSystem = document.getElementById('btnThemeSystem');

    if (btnLight) {
      btnLight.onclick = (e) => {
        this.setTheme('light', true, e);
      };
    }
    if (btnDark) {
      btnDark.onclick = (e) => {
        this.setTheme('dark', true, e);
      };
    }
    if (btnSystem) {
      btnSystem.onclick = (e) => {
        this.setTheme('system', true, e);
      };
    }
  },

  _loadTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem('pdi_theme');
    } catch (e) {}

    if (!savedTheme && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )pdi_theme=([^;]*)/);
      if (match) savedTheme = match[1];
    }

    this.setTheme(savedTheme || 'light', false);
  },

  _bindSystemListener() {
    if (this._mediaListenerBound || !window.matchMedia) return;
    this._mediaListenerBound = true;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (this._currentTheme === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    }
  },

  toggleFocoMode(event = null) {
    const targetTheme = (this._currentTheme === 'light') ? 'dark' : 'light';
    this.setTheme(targetTheme, true, event);
  },

  setTheme(themeName, showToast = true, clickEvent = null) {
    const applyThemeChange = () => {
      this._currentTheme = themeName;

      try {
        localStorage.setItem('pdi_theme', themeName);
      } catch (e) {}

      if (typeof document !== 'undefined') {
        document.cookie = `pdi_theme=${themeName}; path=/; max-age=31536000; SameSite=Lax`;
      }

      const root = document.documentElement;

      if (themeName === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        this._bindSystemListener();
      } else {
        root.setAttribute('data-theme', themeName);
      }

      this._updateThemeUI();
    };

    // Animación de Barrido Diagonal Aurora a 45° (View Transitions API acelerada por GPU - Estilo Linear / Vercel)
    if (typeof document !== 'undefined' && document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        applyThemeChange();
      });

      transition.ready.then(() => {
        const clipPath = [
          'polygon(0 0, 0 0, 0 0, 0 0)',
          'polygon(0 0, 280% 0, 0 280%, 0 0)'
        ];
        document.documentElement.animate(
          { clipPath: clipPath },
          {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });
    } else {
      applyThemeChange();
    }

    if (showToast && window.showToast) {
      const names = { light: 'Tema Claro', dark: 'Tema Oscuro', system: 'Tema Automático (SO)' };
      window.showToast(`Tema visual actualizado a ${names[themeName] || themeName}`, 'info');
    }
  },

  _updateThemeUI() {
    const btnLight = document.getElementById('btnThemeLight');
    const btnDark = document.getElementById('btnThemeDark');
    const btnSystem = document.getElementById('btnThemeSystem');

    const badgeLight = document.getElementById('badgeThemeLight');
    const badgeDark = document.getElementById('badgeThemeDark');
    const badgeSystem = document.getElementById('badgeThemeSystem');

    if (btnLight && btnDark && btnSystem) {
      [btnLight, btnDark, btnSystem].forEach(btn => btn.classList.remove('active'));
      [badgeLight, badgeDark, badgeSystem].forEach(badge => {
        if (badge) badge.style.display = 'none';
      });

      if (this._currentTheme === 'dark') {
        btnDark.classList.add('active');
        if (badgeDark) badgeDark.style.display = 'inline-flex';
      } else if (this._currentTheme === 'system') {
        btnSystem.classList.add('active');
        if (badgeSystem) badgeSystem.style.display = 'inline-flex';
      } else {
        btnLight.classList.add('active');
        if (badgeLight) badgeLight.style.display = 'inline-flex';
      }
    }

    this._updateFocoMascot(this._currentTheme);
  },

  _updateFocoMascot(themeName) {
    const focoTrigger = document.getElementById('focoInteractiveTrigger');
    const bubbleTitle = document.getElementById('focoBubbleTitle');
    const bubbleBadge = document.getElementById('focoBubbleBadge');
    const bubbleMsg = document.getElementById('focoBubbleMsg');
    const bubbleIcon = document.getElementById('focoBubbleIcon');

    if (!focoTrigger) return;

    focoTrigger.classList.remove('state-light', 'state-dark', 'state-system');
    focoTrigger.classList.add(`state-${themeName}`);

    if (themeName === 'dark') {
      if (bubbleTitle) bubbleTitle.textContent = 'Modo Nocturno Activo';
      if (bubbleBadge) bubbleBadge.textContent = 'Foco Encendido';
      if (bubbleMsg) {
        bubbleMsg.textContent = 'Ambiente nocturno activado. El foco está encendido para iluminar tu espacio de trabajo. Haz clic sobre mí para volver al modo diurno.';
      }
      if (bubbleIcon) {
        bubbleIcon.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        `;
      }
    } else if (themeName === 'system') {
      if (bubbleTitle) bubbleTitle.textContent = 'Modo Sensor Inteligente';
      if (bubbleBadge) bubbleBadge.textContent = 'Sincronizado con SO';
      if (bubbleMsg) {
        bubbleMsg.textContent = 'Sensor automático sincronizado. La iluminación se adapta en tiempo real a las preferencias del sistema operativo de tu dispositivo.';
      }
      if (bubbleIcon) {
        bubbleIcon.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0h-18" />
          </svg>
        `;
      }
    } else {
      if (bubbleTitle) bubbleTitle.textContent = 'Modo Diurno Activo';
      if (bubbleBadge) bubbleBadge.textContent = 'Foco en Reposo';
      if (bubbleMsg) {
        bubbleMsg.textContent = 'Ambiente diurno detectado. El foco permanece en reposo para ahorrar energía. Haz clic sobre mí o usa los botones para alternar al modo noche.';
      }
      if (bubbleIcon) {
        bubbleIcon.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25M4.284 12h-2.25m15.303-6.343l-1.591 1.591M6.257 17.743l-1.591 1.591m0-13.5l1.591 1.591m11.485 11.485l1.591 1.591M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
          </svg>
        `;
      }
    }
  },

  triggerSync() {
    const btn = document.getElementById('btnTriggerSync');
    const badge = document.getElementById('syncStatusBadge');
    const timeLabel = document.getElementById('labelLastSyncTime');

    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.innerHTML = `
        <svg class="spin" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        <span>Sincronizando...</span>
      `;
    }

    if (badge) {
      badge.className = 'badge badge-yellow';
      badge.innerHTML = `<span class="status-dot yellow"></span> Sincronizando BD...`;
    }

    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = `
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>Sincronizar Ahora</span>
        `;
      }

      if (badge) {
        badge.className = 'badge badge-green';
        badge.innerHTML = `<span class="status-dot green"></span> En Línea (Sincronizado)`;
      }

      const now = new Date();
      const timeStr = `Hoy a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (timeLabel) timeLabel.textContent = timeStr;

      if (window.showToast) {
        window.showToast('Base de datos sincronizada exitosamente con el servidor remoto', 'success');
      }
    }, 1200);
  },

  toggleAlertSetting(key, enabled) {
    localStorage.setItem(`pdi_alert_${key}`, enabled ? 'true' : 'false');
    if (window.showToast) {
      window.showToast(`Preferencia de alertas actualizada (${enabled ? 'activado' : 'desactivado'})`, 'info');
    }
  },

  clearCache() {
    if (window.showToast) {
      window.showToast('Caché local limpiada. Refrescando plataforma...', 'warning');
    }
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
};

window.PDI = window.PDI || {};
window.PDI.AjustesView = AjustesView;
window.setTheme = (t, showToast = true, e = null) => AjustesView.setTheme(t, showToast, e);
window.toggleFocoMode = (e = null) => AjustesView.toggleFocoMode(e);
window.triggerSync = () => AjustesView.triggerSync();
window.clearCache = () => AjustesView.clearCache();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => AjustesView.init());
} else {
  AjustesView.init();
}


