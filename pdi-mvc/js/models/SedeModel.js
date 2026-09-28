// Modelo: Directorio Territorial de Sedes, Iglesias y Redes Aliadas
import { BeneficiarioModel } from './BeneficiarioModel.js';

// Los datos semilla viven fuera del codigo: son registros ficticios y estan
// marcados como tales. Ver data/fixtures/sedes.js
import { defaultSedes } from '../../data/fixtures/sedes.js';
export { defaultSedes };


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
