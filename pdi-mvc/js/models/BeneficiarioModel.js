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

// Ficha A2 del proyecto: "Declaracion Jurada de Continuidad". El documento
// oficial pide cuatro columnas (nino, madre/padre, DNI, firma), pero el nino y
// el responsable ya viven en el beneficiario. Copiarlos aqui crearia una
// segunda fuente de verdad: si se corrige el nombre del menor en el padron, la
// declaracion quedaria con el nombre viejo. Solo se guarda lo que no existe
// todavia, y el firmante por defecto es el apoderado.
export function normalizeDeclaracionJurada(b) {
  if (!b) return b;
  if (typeof b.declaracionJurada !== "object" || b.declaracionJurada === null) {
    b.declaracionJurada = {
      suscrita: false,
      fecha: null,
      firmante: b.apoderado || null,
      firmaDigital: false
    };
  } else {
    const dj = b.declaracionJurada;
    if (typeof dj.suscrita !== "boolean") dj.suscrita = false;
    if (!dj.fecha) dj.fecha = null;
    if (!dj.firmante) dj.firmante = b.apoderado || null;
    if (typeof dj.firmaDigital !== "boolean") dj.firmaDigital = false;
  }
  return b;
}

// Ficha A1: "DERIVACION ASP ( )". El operador marca si el caso fue canalizado;
// el sistema, por su cuenta, ya lo deducía de la vulnerabilidad y la exoneración.
// Se guardan las dos cosas por separado (opción B) para poder contrastarlas en
// el expediente y detectar discrepancias, en lugar de que una tape a la otra.
// La ficha A1 pide una sola casilla en el alta: "DERIVACION ASP ( )". Eso es
// lo unico que se guarda aqui.
//
// Antes este bloque tambien guardaba fecha y profesional, pero esos datos ya
// vivian en CasoSocialModel (fechaDerivacion y quienDeriva), que es el flujo
// real de derivacion y el que pinta el kanban social. Tenerlos en los dos sitios
// permitia que una misma derivacion mostrara dos fechas distintas, asi que el
// bloque quedo reducido a la senalizacion y la fecha y el profesional se leen de
// ahi. La migracion conserva lo que ya se habia marcado: un registro guardado con
// la forma vieja viene con registrada en true o false, y eso pasa a
// requiereDerivacion.
export function normalizeDerivacionASP(b) {
  if (!b) return b;
  const previo = b.derivacionASP;
  const marcado = previo && typeof previo === "object"
    ? (typeof previo.requiereDerivacion === "boolean" ? previo.requiereDerivacion : previo.registrada === true)
    : false;
  b.derivacionASP = { requiereDerivacion: marcado };
  return b;
}

// Lo que el sistema dedujo por su cuenta. No se guarda en el beneficiario: se
// recalcula al pintar, porque depende de campos que el operador puede editar.
export function deducirDerivacionASP(b) {
  if (!b) return false;
  if (Array.isArray(b.servicios) && b.servicios.some(s => String(s).includes("Pastoral"))) return true;
  if (b.exoneracionAporte && String(b.exoneracionAporte).includes("100%")) return true;
  return typeof b.vulnerabilidad === "number" && b.vulnerabilidad >= 80;
}

export const BeneficiarioModel = {
  _data: null,

  init() {
    const storage = window.PDI?.StorageService || StorageService;
    let list = storage.getItem("pdi_beneficiarios", defaultBeneficiarios);
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = defaultBeneficiarios;
    }
    // Normalizar servicios y los bloques declarativos de todos los
    // beneficiarios (existentes y por defecto).
    this._data = list.map(b => normalizeDerivacionASP(normalizeDeclaracionJurada(normalizeBeneficiarioServicios(b))));
    storage.setItem("pdi_beneficiarios", this._data);
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
    normalizeDeclaracionJurada(nuevoMenor);
    normalizeDerivacionASP(nuevoMenor);
    list.unshift(nuevoMenor);
    const storage = window.PDI?.StorageService || StorageService;
    storage.setItem("pdi_beneficiarios", list);
    return nuevoMenor;
  },

  update(id, updatedData) {
    const list = this.getAll();
    const idx = list.findIndex(b => b.id === Number(id));
    if (idx !== -1) {
      list[idx] = normalizeDerivacionASP(normalizeDeclaracionJurada(
        normalizeBeneficiarioServicios({ ...list[idx], ...updatedData })
      ));
      const storage = window.PDI?.StorageService || StorageService;
      storage.setItem("pdi_beneficiarios", list);
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
  window.PDI.deducirDerivacionASP = deducirDerivacionASP;
}
