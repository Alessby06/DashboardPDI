// Modelo de Casos Sociales (Derivaciones ASP - Área Social Pastoral)
// Sincronizado integralmente con los menores del Padrón Oficial de Beneficiarios
import { StorageService } from './StorageService.js';

// Los datos semilla viven fuera del codigo: son registros ficticios y estan
// marcados como tales. Ver data/fixtures/casos-sociales.js
import { defaultCasosSociales } from '../../data/fixtures/casos-sociales.js';
export { defaultCasosSociales };


export const CasoSocialModel = {
  _data: null,

  init() {
    const storage = window.PDI?.StorageService || StorageService;
    let list = storage.getItem("pdi_casos_sociales", defaultCasosSociales);

    // Validación de integridad:
    // Comprobar que los casos tengan menor o código y urgencia, y no registros
    // planos o vacíos de SurrealDB con nombres de campos distintos (persona, etc.)
    const esValido = Array.isArray(list) && list.length > 0 && list.every(c =>
      c && (c.menor || c.codigo) && c.urgencia && (typeof c.id === 'number' || (!isNaN(Number(c.id)) && typeof c.id !== 'boolean'))
    );

    if (!esValido) {
      console.warn("[CasoSocialModel] Cache local corrupta o incompatible. Restaurando fixtures normativos.");
      list = JSON.parse(JSON.stringify(defaultCasosSociales));
      storage.setItem("pdi_casos_sociales", list);
    }

    this._data = list;
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

  /**
   * Casos con urgencia Alta que siguen abiertos. Alimenta el badge rojo del
   * menu lateral y el KPI "Casos en Alerta" del dashboard, para que no sean
   * numeros de adorno: reflejan siempre el estado real del tablero.
   */
  contarCriticos() {
    return this.getAll().filter(c => c && c.urgencia === "Alta" && c.etapa !== "cerrado").length;
  },

  updateStage(id, nuevaEtapa) {
    const list = this.getAll();
    const caso = list.find(c => String(c.id) === String(id) || c.id === Number(id));
    if (caso) {
      caso.etapa = nuevaEtapa;
      const storage = window.PDI?.StorageService || StorageService;
      storage.setItem("pdi_casos_sociales", list);
      return caso;
    }
    return null;
  },

  add(nuevoCaso) {
    const list = this.getAll();
    list.unshift(nuevoCaso);
    const storage = window.PDI?.StorageService || StorageService;
    storage.setItem("pdi_casos_sociales", list);
    return nuevoCaso;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.defaultCasosSociales = defaultCasosSociales;
  window.PDI.CasoSocialModel = CasoSocialModel;
}
