// Modelo: Directorio Territorial de Sedes, Iglesias y Redes Aliadas
import { BeneficiarioModel } from './BeneficiarioModel.js';

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

export const SedeModel = {
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
