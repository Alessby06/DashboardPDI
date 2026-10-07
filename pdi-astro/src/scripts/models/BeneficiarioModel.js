// Modelo de Beneficiarios (Padrón de Menores PDI)
// Incorpora el 100% de los campos oficiales de las Fichas A0, A1, A2, A3, A6 CRED y ASP
import { StorageService } from './StorageService.js';

// Los datos semilla viven fuera del codigo: son registros ficticios y estan
// marcados como tales. Ver data/fixtures/beneficiarios.js
import { defaultBeneficiarios } from '../../data/fixtures/beneficiarios.js';
export { defaultBeneficiarios };


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
        normalized.add("Casita del Saber");
      } else if (low.includes("pastoral") || low.includes("social") || low.includes("asp")) {
        normalized.add("Área Social Pastoral");
      } else if (low.includes("mixto")) {
        normalized.add("Servicio Alimentario Nutricional");
        normalized.add("Casita del Saber");
      } else {
        normalized.add(s);
      }
    });
  }

  // Inferir de estrategia y vulnerabilidad
  if (lowerEstrategia.includes("desayuno") || lowerEstrategia.includes("alimento") || lowerEstrategia.includes("nutric") || lowerEstrategia.includes("lonchera")) {
    normalized.add("Servicio Alimentario Nutricional");
  }
  if (lowerEstrategia.includes("casita") || lowerEstrategia.includes("educat") || lowerEstrategia.includes("acompañ")) {
    normalized.add("Casita del Saber");
  }
  if (lowerEstrategia.includes("pastoral") || lowerEstrategia.includes("social") || lowerEstrategia.includes("asp") || (b.vulnerabilidad && b.vulnerabilidad >= 80) || (b.exoneracionAporte && b.exoneracionAporte.includes("100%"))) {
    normalized.add("Área Social Pastoral");
  }
  if (lowerEstrategia.includes("mixto")) {
    normalized.add("Servicio Alimentario Nutricional");
    normalized.add("Casita del Saber");
  }

  // Si no se asignó ninguno por defecto en datos iniciales
  if (normalized.size === 0) {
    normalized.add("Servicio Alimentario Nutricional");
  }

  b.servicios = Array.from(normalized);
  return b;
}

export const BeneficiarioModel = {
  _data: null,

  init() {
    const storage = window.PDI?.StorageService || StorageService;
    let list = storage.getItem("pdi_beneficiarios", defaultBeneficiarios);

    // Validación de integridad:
    // Si la lista está vacía, no es arreglo, tiene IDs no numéricos (ej. 'pdi_001')
    // o datos vacíos de un intento parcial con SurrealDB, restaurar datos semilla completos.
    const esValido = Array.isArray(list) && list.length > 0 && list.every(b =>
      b &&
      (typeof b.id === 'number' || (!isNaN(Number(b.id)) && typeof b.id !== 'boolean')) &&
      b.nombres &&
      b.apellidos
    ) && list.some(b => b.apoderado && String(b.apoderado).trim().length > 0);

    if (!esValido) {
      console.warn("[BeneficiarioModel] Cache local corrupta o incompleta. Restaurando fixtures normativos.");
      list = JSON.parse(JSON.stringify(defaultBeneficiarios));
      storage.setItem("pdi_beneficiarios", list);
    }

    // Normalizar servicios de todos los beneficiarios (existentes y por defecto)
    this._data = list.map(b => normalizeBeneficiarioServicios(b));
    storage.setItem("pdi_beneficiarios", this._data);
    return this._data;
  },

  getAll() {
    if (!this._data) this.init();
    return this._data;
  },

  getById(id) {
    const list = this.getAll();
    return list.find(b => String(b.id) === String(id) || b.id === Number(id)) || null;
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
    storage.setItem("pdi_beneficiarios", list);
    return nuevoMenor;
  },

  update(id, updatedData) {
    const list = this.getAll();
    const idx = list.findIndex(b => String(b.id) === String(id) || b.id === Number(id));
    if (idx !== -1) {
      list[idx] = normalizeBeneficiarioServicios({ ...list[idx], ...updatedData });
      const storage = window.PDI?.StorageService || StorageService;
      storage.setItem("pdi_beneficiarios", list);
      return list[idx];
    }
    return null;
  },

  delete(id) {
    const list = this.getAll();
    const idx = list.findIndex(b => String(b.id) === String(id) || b.id === Number(id));
    if (idx !== -1) {
      const removed = list.splice(idx, 1)[0];
      const storage = window.PDI?.StorageService || StorageService;
      storage.setItem("pdi_beneficiarios", list);
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
