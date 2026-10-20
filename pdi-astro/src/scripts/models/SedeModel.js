// Modelo: Directorio Territorial de Sedes, Iglesias y Redes Aliadas
// La fuente única de verdad es la instancia de SurrealDB Cloud (tabla sede).
// Sin fixtures: el modelo inicia vacío y se llena cuando la capa de datos
// hidrata. El conteo de niños inscritos se calcula del padrón en tiempo real.
export const SedeModel = {
  _sedes: null,

  init() {
    if (!this._sedes) this._sedes = [];
  },

  /** La capa de datos entrega el directorio hidratado de la nube. */
  aplicarDatos(lista) {
    if (!Array.isArray(lista)) return;
    this._sedes = lista;
  },

  getAll() {
    if (!this._sedes) this.init();

    // Calcular en tiempo real los niños inscritos según el padrón
    const bModel = window.PDI?.BeneficiarioModel;
    const allBeneficiarios = (bModel && bModel.getAll ? bModel.getAll() : []) || [];

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
