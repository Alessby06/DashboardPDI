// Modelo de Beneficiarios (Padrón de Usuarios PDI)
// La fuente única de verdad es la instancia de SurrealDB Cloud. No hay fixtures
// ni espejo en localStorage: el modelo inicia vacío y se llena cuando la capa de
// datos (core/db.js) hidrata desde la nube. Toda mutación se escribe en la nube
// de forma optimista: la memoria se actualiza aquí y db.js confirma el cambio.
import {
  crearBeneficiario, actualizarBeneficiario, darBajaBeneficiario,
  crearTamizaje, desactivarTamizaje,
} from '../core/db.js';
import { AnemiaCalculator } from '../utils/AnemiaCalculator.js';

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
   * Alta de usuario: se crea en memoria para la vista y se escribe en la nube
   * (persona + inscripción + apoderado + tamizaje inicial). Si la nube
   * rechaza, db.js notifica el error y la próxima hidratación realinea los
   * estados; no se toca ningun almacen local.
   */
  add(nuevoUsuario) {
    const list = this.getAll();
    normalizeBeneficiarioServicios(nuevoUsuario);
    list.unshift(nuevoUsuario);
    crearBeneficiario(nuevoUsuario).then(res => {
      if (!res) {
        list.splice(list.indexOf(nuevoUsuario), 1);
        return;
      }
      // El codigo con el formato del programa lo asigna la base; el de memoria
      // era provisional.
      if (res.codigo) nuevoUsuario.codigo = res.codigo;
    });
    return nuevoUsuario;
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
   * Nueva prueba de hemoglobina para el historial del usuario (append-only).
   * Optimista: la fila entra en memoria al instante y los valores vigentes
   * (hb/peso/talla/anemia) pasan a ser los de esta prueba; db.js escribe en la
   * nube. Devuelve la fila cuando la nube confirma y null si la rechaza, en
   * cuyo caso deshace el cambio optimista. No se edita ni anula ningún
   * tamizaje previo.
   */
  async registrarTamizaje(id, prueba) {
    const b = this.getById(id);
    if (!b || prueba.hb == null) return null;
    const fila = {
      _tamizajeId: '', // el id canonico lo asigna la nube y lo trae la hidratacion
      fecha: prueba.fecha ? `${prueba.fecha}T12:00:00Z` : new Date().toISOString(),
      hb: prueba.hb,
      hbAjustada: null,
      peso: prueba.peso ?? null,
      talla: prueba.talla ?? null,
      resultado: prueba.resultado || '',
      anemia: prueba.anemia || '',
    };
    const previo = { hb: b.hb, peso: b.peso, talla: b.talla, anemia: b.anemia };
    if (!Array.isArray(b.tamizajes)) b.tamizajes = [];
    b.tamizajes.unshift(fila);
    b.hb = prueba.hb;
    if (prueba.peso != null) b.peso = prueba.peso;
    if (prueba.talla != null) b.talla = prueba.talla;
    b.anemia = prueba.anemia;
    // El id canonico de la hidratacion reemplazara a _tamizajeId '' despues.
    const ok = await crearTamizaje({
      _personaId: b._personaId,
      _inscripcionId: b._inscripcionId,
      _sedeRawId: b._sedeRawId,
      fecha: prueba.fecha,
      hb: prueba.hb,
      peso: prueba.peso,
      talla: prueba.talla,
      resultado: prueba.resultado,
      anemia: prueba.anemia,
    });
    if (!ok) {
      const pos = b.tamizajes.indexOf(fila);
      if (pos !== -1) b.tamizajes.splice(pos, 1);
      b.hb = previo.hb;
      b.peso = previo.peso;
      b.talla = previo.talla;
      b.anemia = previo.anemia;
      return null;
    }
    return fila;
  },

  /**
   * Desactiva una prueba del historial (soft delete por id canonico). La fila
   * sale de memoria al instante y los valores vigentes (hb/peso/talla/anemia)
   * pasan a los de la prueba activa mas reciente restante; si no queda ninguna
   * quedan en null (se pintan vacios). Devuelve la fila cuando la nube
   * confirma y null si la rechaza, restaurando el estado anterior. El motivo lo
   * registra la vista en la bitacora: aqui solo se saca la fila del historial.
   */
  async desactivarTamizaje(id, tamId) {
    const b = this.getById(id);
    if (!b || !tamId || !Array.isArray(b.tamizajes)) return null;
    const idx = b.tamizajes.findIndex(t => String(t._tamizajeId || '') === String(tamId));
    if (idx === -1) return null;
    const previo = { hb: b.hb, peso: b.peso, talla: b.talla, anemia: b.anemia };
    const fuera = b.tamizajes[idx];
    b.tamizajes.splice(idx, 1);
    const vigente = b.tamizajes[0] || null;
    b.hb = vigente ? vigente.hb : null;
    b.peso = vigente && vigente.peso != null ? vigente.peso : null;
    b.talla = vigente && vigente.talla != null ? vigente.talla : null;
    b.anemia = vigente ? vigente.anemia : null;
    const ok = await desactivarTamizaje(tamId);
    if (!ok) {
      b.tamizajes.splice(idx, 0, fuera);
      b.hb = previo.hb;
      b.peso = previo.peso;
      b.talla = previo.talla;
      b.anemia = previo.anemia;
      return null;
    }
    return fuera;
  },

  /**
   * Baja del padrón. La Ley 29733 prohibe el borrado físico: en memoria se
   * retira de la vista y en la nube la inscripción pasa a Retirado.
   *
   * Devuelve una promesa: la vista debe esperar la confirmación de la nube
   * antes de auditar y redirigir. Si la escritura falla, el usuario vuelve a
   * la lista para que la pantalla no muestre una baja que no ocurrió.
   */
  async delete(id) {
    const list = this.getAll();
    const idx = list.findIndex(b => String(b.id) === String(id) || b.id === Number(id));
    if (idx === -1) return false;
    const removed = list.splice(idx, 1)[0];
    const bajaOk = await darBajaBeneficiario(removed);
    if (!bajaOk) {
      list.splice(idx, 0, removed);
      return false;
    }
    return true;
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
    const clase = (b) => AnemiaCalculator.normalizar(b && b.anemia);
    const normales = list.filter(b => clase(b) === "Normal").length;
    const leves = list.filter(b => clase(b) === "Leve").length;
    const moderadas = list.filter(b => clase(b) === "Moderada" || clase(b) === "Severa").length;

    const pctNormal = total > 0 ? Math.round((normales / total) * 100) : 0;
    const pctLeve = total > 0 ? Math.round((leves / total) * 100) : 0;
    const pctMod = total > 0 ? Math.round((moderadas / total) * 100) : 0;

    const comasCount = list.filter(b => b.distrito === "Comas").length;
    const carabaylloCount = list.filter(b => b.distrito === "Carabayllo").length;

    // Tamizado CREAL real: usuario con dosaje de Hb registrado (valor, no vacio).
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
