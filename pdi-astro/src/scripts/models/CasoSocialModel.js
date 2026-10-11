// Modelo de Casos Sociales (Derivaciones ASP - Área Social Pastoral)
// Sincronizado integralmente con los menores del Padrón Oficial de Beneficiarios
import { StorageService } from './StorageService.js';

// Los datos semilla viven fuera del codigo: son registros ficticios y estan
// marcados como tales. Ver data/fixtures/casos-sociales.js
import { defaultCasosSociales } from '../../data/fixtures/casos-sociales.js';
export { defaultCasosSociales };


export const CasoSocialModel = {
  _data: null,

  _obtenerMapaPersistente() {
    try {
      const raw = localStorage.getItem("pdi_solicitudes_sociales");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  _guardarMapaPersistente(mapa) {
    try {
      localStorage.setItem("pdi_solicitudes_sociales", JSON.stringify(mapa));
    } catch (e) {}
  },

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

    // Fusión con mapa persistente de solicitudes (garantiza que NUNCA desaparezcan al cambiar de rol o hidratar)
    const mapa = this._obtenerMapaPersistente();
    list.forEach(c => {
      const datosPersistidos = mapa[String(c.id)] || mapa[Number(c.id)];
      if (datosPersistidos) {
        if (datosPersistidos.solicitudCambio) {
          c.solicitudCambio = datosPersistidos.solicitudCambio;
        }
        if (Array.isArray(datosPersistidos.historialSolicitudes)) {
          c.historialSolicitudes = datosPersistidos.historialSolicitudes;
        }
        if (datosPersistidos.ultimaResolucion) {
          c.ultimaResolucion = datosPersistidos.ultimaResolucion;
        }
      }
    });

    this._data = list;
    return this._data;
  },

  /**
   * Actualiza los datos desde SurrealDB Cloud preservando fielmente las solicitudes
   * de cambio de estado activas y el historial de auditoría de cada caso.
   */
  actualizarDesdeRemoto(listaRemota) {
    if (!Array.isArray(listaRemota) || listaRemota.length === 0) return this.getAll();
    const mapa = this._obtenerMapaPersistente();
    listaRemota.forEach(c => {
      const datosPersistidos = mapa[String(c.id)] || mapa[Number(c.id)];
      if (datosPersistidos) {
        if (datosPersistidos.solicitudCambio) {
          c.solicitudCambio = datosPersistidos.solicitudCambio;
        }
        if (Array.isArray(datosPersistidos.historialSolicitudes)) {
          c.historialSolicitudes = datosPersistidos.historialSolicitudes;
        }
        if (datosPersistidos.ultimaResolucion) {
          c.ultimaResolucion = datosPersistidos.ultimaResolucion;
        }
      }
    });

    this._data = listaRemota;
    const storage = window.PDI?.StorageService || StorageService;
    storage.setItem("pdi_casos_sociales", this._data);
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
   * Conteo en tiempo real de solicitudes pendientes de autorización para Coordinación.
   */
  contarSolicitudesPendientes() {
    return this.getCasosConSolicitudPendiente().length;
  },

  /**
   * Conteo de todas las solicitudes enviadas (activas y resueltas).
   */
  contarTodasLasSolicitudes() {
    return this.getTodasLasSolicitudes().length;
  },

  /**
   * Retorna una lista unificada de todas las solicitudes de transición registradas.
   */
  getTodasLasSolicitudes() {
    const list = this.getAll();
    const map = new Map();

    list.forEach(c => {
      // 1. Si tiene solicitud activa pendiente
      if (c.solicitudCambio) {
        map.set(c.solicitudCambio.id, {
          ...c.solicitudCambio,
          casoId: c.id,
          codigo: c.codigo,
          menor: c.menor,
          sede: c.sede,
          urgencia: c.urgencia
        });
      }

      // 2. Si tiene última resolución
      if (c.ultimaResolucion && c.ultimaResolucion.id) {
        if (!map.has(c.ultimaResolucion.id)) {
          map.set(c.ultimaResolucion.id, {
            ...c.ultimaResolucion,
            casoId: c.id,
            codigo: c.codigo,
            menor: c.menor,
            sede: c.sede,
            urgencia: c.urgencia
          });
        }
      }

      // 3. Del historial de solicitudes
      if (Array.isArray(c.historialSolicitudes)) {
        c.historialSolicitudes.forEach(h => {
          if (!map.has(h.id)) {
            map.set(h.id, {
              id: h.id,
              casoId: c.id,
              codigo: c.codigo,
              menor: c.menor,
              sede: c.sede,
              urgencia: c.urgencia,
              etapaOrigen: h.etapaOrigen,
              etapaDestino: h.etapaDestino,
              solicitadoPor: h.solicitadoPor || c.trabajadoraSocial || "Trabajadora Social ASP",
              cargoSolicitante: h.cargoSolicitante || "Trabajadora Social ASP",
              fechaSolicitud: h.fecha,
              motivo: h.motivo || "Solicitud de transición de etapa",
              estado: h.evento === "aprobada" ? "aprobada" : (h.evento === "rechazada" ? "rechazada" : "pendiente"),
              resueltoPor: h.resueltoPor || null,
              cargoResuelve: h.cargoResuelve || null,
              fechaResolucion: (h.evento === "aprobada" || h.evento === "rechazada") ? h.fecha : null,
              comentarioResolucion: h.comentario || ""
            });
          }
        });
      }
    });

    const arr = Array.from(map.values());
    return arr.sort((a, b) => (b.fechaSolicitud || "").localeCompare(a.fechaSolicitud || ""));
  },

  /**
   * Casos con urgencia Alta que siguen abiertos. Alimenta el badge rojo del
   * menu lateral y el KPI "Casos en Alerta" del dashboard, para que no sean
   * numeros de adorno: reflejan siempre el estado real del tablero.
   */
  contarCriticos() {
    return this.getAll().filter(c => c && c.urgencia === "Alta" && c.etapa !== "cerrado").length;
  },

  /**
   * Solicita un cambio de estado para un caso social que requiere autorización de Coordinación.
   */
  solicitarCambioEtapa(id, nuevaEtapa, motivo = "", solicitante = null) {
    const list = this.getAll();
    const caso = list.find(c => String(c.id) === String(id) || c.id === Number(id));
    if (!caso) return null;

    const fechaAhora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const idSolicitud = `SOL-${Date.now().toString(36).toUpperCase()}`;

    caso.solicitudCambio = {
      id: idSolicitud,
      etapaOrigen: caso.etapa,
      etapaDestino: nuevaEtapa,
      solicitadoPor: solicitante?.nombre || "Lic. Ruth Soto",
      cargoSolicitante: solicitante?.cargo || "Trabajadora Social ASP",
      fechaSolicitud: fechaAhora,
      motivo: motivo.trim() || "Solicitud de transición de etapa operativa",
      estado: "pendiente" // 'pendiente' | 'aprobada' | 'rechazada'
    };

    if (!Array.isArray(caso.historialSolicitudes)) {
      caso.historialSolicitudes = [];
    }
    caso.historialSolicitudes.unshift({
      id: idSolicitud,
      evento: "solicitud",
      etapaOrigen: caso.etapa,
      etapaDestino: nuevaEtapa,
      solicitadoPor: caso.solicitudCambio.solicitadoPor,
      cargoSolicitante: caso.solicitudCambio.cargoSolicitante,
      fecha: fechaAhora,
      motivo: caso.solicitudCambio.motivo
    });

    const storage = window.PDI?.StorageService || StorageService;
    storage.setItem("pdi_casos_sociales", list);

    // Guardar en mapa persistente dedicado
    const mapa = this._obtenerMapaPersistente();
    mapa[String(caso.id)] = {
      solicitudCambio: caso.solicitudCambio,
      historialSolicitudes: caso.historialSolicitudes,
      ultimaResolucion: caso.ultimaResolucion || null
    };
    this._guardarMapaPersistente(mapa);

    return caso;
  },

  /**
   * Resuelve una solicitud de cambio de estado (Aprobar o Rechazar por Coordinación).
   */
  resolverSolicitudCambio(id, decision, comentario = "", autorizador = null) {
    const list = this.getAll();
    const caso = list.find(c => String(c.id) === String(id) || c.id === Number(id));
    if (!caso || !caso.solicitudCambio || caso.solicitudCambio.estado !== "pendiente") return null;

    const fechaAhora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const sol = caso.solicitudCambio;
    const esAprobado = decision === "aprobada";

    sol.estado = esAprobado ? "aprobada" : "rechazada";
    sol.fechaResolucion = fechaAhora;
    sol.resueltoPor = autorizador?.nombre || "Dirección y Coordinación General";
    sol.cargoResuelve = autorizador?.cargo || "Coordinación General PDI";
    sol.comentarioResolucion = comentario.trim();

    if (!Array.isArray(caso.historialSolicitudes)) {
      caso.historialSolicitudes = [];
    }
    caso.historialSolicitudes.unshift({
      id: sol.id,
      evento: esAprobado ? "aprobada" : "rechazada",
      etapaOrigen: sol.etapaOrigen,
      etapaDestino: sol.etapaDestino,
      resueltoPor: sol.resueltoPor,
      cargoResuelve: sol.cargoResuelve,
      fecha: fechaAhora,
      comentario: sol.comentarioResolucion
    });

    if (esAprobado) {
      caso.etapa = sol.etapaDestino;
    }
    // Si se rechaza, caso.etapa se mantiene intacto

    // Se archiva de activa a null (o se conserva como última resolución)
    caso.ultimaResolucion = { ...sol };
    delete caso.solicitudCambio;

    const storage = window.PDI?.StorageService || StorageService;
    storage.setItem("pdi_casos_sociales", list);

    // Actualizar mapa persistente dedicado
    const mapa = this._obtenerMapaPersistente();
    mapa[String(caso.id)] = {
      solicitudCambio: null,
      historialSolicitudes: caso.historialSolicitudes,
      ultimaResolucion: caso.ultimaResolucion
    };
    this._guardarMapaPersistente(mapa);

    return { caso, solicitud: sol, aprobada: esAprobado };
  },

  /**
   * Retorna todos los casos que tengan solicitudes pendientes de autorización.
   */
  getCasosConSolicitudPendiente() {
    return this.getAll().filter(c => c && c.solicitudCambio && c.solicitudCambio.estado === "pendiente");
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
