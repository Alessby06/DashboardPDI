// Modelo de Beneficiarios (Padrón de Menores PDI)
// La fuente única de verdad es la instancia de SurrealDB Cloud. No hay fixtures
// ni espejo en localStorage: el modelo inicia vacío y se llena cuando la capa de
// datos (core/db.js) hidrata desde la nube. Toda mutación se escribe en la nube
// de forma optimista: la memoria se actualiza aquí y db.js confirma el cambio.
import {
  crearBeneficiario, actualizarBeneficiario, darBajaBeneficiario,
} from '../core/db.js';

export function normalizeBeneficiarioServicios(b) {
  if (!b) return b;
  const rawServicios = Array.isArray(b.servicios) ? b.servicios : null;
  const normalized = new Set();
  const lowerEstrategia = (b.estrategia || "").toLowerCase();

  // La estrategia es una lista y de ella salen los servicios. Es la fuente mas
  // fiel: el valor "Mixto (Desayuno + Casita)" ya no existe.
  if (Array.isArray(b.estrategias) && b.estrategias.length) {
    b.estrategias.forEach((e) => {
      if (!e) return;
      const low = String(e).toLowerCase();
      if (low.includes("desayuno") || low.includes("lonchera") || low.includes("alimento") || low.includes("nutric")) {
        normalized.add("Servicio Alimentario Nutricional");
      } else if (low.includes("casita") || low.includes("educativ") || low.includes("refuerzo") || low.includes("escolar") || low.includes("acompañ")) {
        normalized.add("Casita del Saber");
      } else if (low.includes("pastoral") || low.includes("social") || low.includes("asp")) {
        normalized.add("Área Social Pastoral");
      } else {
        normalized.add(e);
      }
    });
  }

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
  if (lowerEstrategia.includes("pastoral") || lowerEstrategia.includes("social") || lowerEstrategia.includes("asp")) {
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
    // Sin conexión aún no hay lista: db.js rehidrata sola al reconectar.
    if (!this._data) this._data = [];
    return this._data;
  },

  /** La capa de datos entrega la lista hidratada de la nube. */
  aplicarDatos(lista) {
    if (!Array.isArray(lista)) return;
    this._data = lista.map(b => normalizeBeneficiarioServicios(b));
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

  /**
   * Alta de menor: se crea en memoria para la vista y se escribe en la nube
   * (persona + inscripción + apoderado + tamizaje inicial). Si la nube
   * rechaza, db.js notifica el error y la próxima hidratación realinea los
   * estados; no se toca ningun almacen local.
   */
  add(nuevoMenor) {
    const list = this.getAll();
    normalizeBeneficiarioServicios(nuevoMenor);
    list.unshift(nuevoMenor);
    crearBeneficiario(nuevoMenor).then(ok => {
      if (!ok) list.splice(list.indexOf(nuevoMenor), 1);
    });
    return nuevoMenor;
  },

  update(id, updatedData) {
    const list = this.getAll();
    const idx = list.findIndex(b => String(b.id) === String(id) || b.id === Number(id));
    if (idx !== -1) {
      const previo = list[idx];
      const actualizado = normalizeBeneficiarioServicios({ ...previo, ...updatedData });
      list[idx] = actualizado;
      actualizarBeneficiario(actualizado);
      return actualizado;
    }
    return null;
  },

  /**
   * Baja del padrón. La Ley 29733 prohibe el borrado físico: en memoria se
   * retira de la vista y en la nube la inscripción pasa a Retirado.
   */
  delete(id) {
    const list = this.getAll();
    const idx = list.findIndex(b => String(b.id) === String(id) || b.id === Number(id));
    if (idx !== -1) {
      const removed = list.splice(idx, 1)[0];
      darBajaBeneficiario(removed);
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
    const leves = list.filter(b => b.anemia === "Leve" || b.anemia === "En riesgo").length;
    const moderadas = list.filter(b => b.anemia === "Moderada" || b.anemia === "Severa").length;

    const pctNormal = total > 0 ? Math.round((normales / total) * 100) : 0;
    const pctLeve = total > 0 ? Math.round((leves / total) * 100) : 0;
    const pctMod = total > 0 ? Math.round((moderadas / total) * 100) : 0;

    const comasCount = list.filter(b => b.distrito === "Comas").length;
    const carabaylloCount = list.filter(b => b.distrito === "Carabayllo").length;

    // Tamizado CREAL real: menor con dosaje de Hb registrado (valor, no vacio).
    const tamizados = list.filter(b => b.hb !== null && b.hb !== undefined && b.hb !== "").length;

    return {
      total,
      tamizados,
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
  window.PDI.BeneficiarioModel = BeneficiarioModel;
}
