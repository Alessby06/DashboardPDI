// Modelo de Casos Sociales (Derivaciones ASP - Área Social Pastoral)
// La fuente única de verdad es la instancia de SurrealDB Cloud: caso_social más
// solicitud_caso (autorizaciones de cambio de etapa de Coordinación). No hay
// fixtures ni mapa espejo en localStorage. Toda mutación se escribe en la nube
// de forma optimista y la capa de datos realinea con las suscripciones LIVE.
import {
  crearCasoSocial, cambiarEtapaCaso, crearSolicitudCaso, resolverSolicitudCaso,
} from '../core/db.js';

export const CasoSocialModel = {
  _data: null,
  // Etapas movidas localmente y aun no confirmadas por un snapshot de la nube.
  // Clave: id de registro (_casoId). Valor: { etapa, ts }.
  _etapasPendientes: new Map(),

  init() {
    if (!this._data) this._data = [];
    return this._data;
  },

  /** La capa de datos entrega los casos con sus solicitudes ya adjuntas. */
  aplicarDatos(lista) {
    if (!Array.isArray(lista)) return;

    // Un snapshot puede ser anterior a una escritura recien confirmada (LIVE
    // reordenado, reconexion con token nuevo, lectura que se solapa con el
    // commit). Mientras la etapa propia no vuelva confirmada, manda la local:
    // asi el caso no "regresa solo" a su fase anterior en la cara del usuario.
    if (this._etapasPendientes.size) {
      const ahora = Date.now();
      for (const [clave, pendiente] of this._etapasPendientes) {
        if (ahora - pendiente.ts > 20000) {
          this._etapasPendientes.delete(clave);
          continue;
        }
        const caso = lista.find(c => String(c._casoId || c.id) === clave);
        if (!caso) continue;
        if (caso.etapa === pendiente.etapa) {
          // La nube ya trae el cambio: se libera la propiedad local.
          this._etapasPendientes.delete(clave);
        } else {
          caso.etapa = pendiente.etapa;
        }
      }
    }

    this._data = lista;
  },

  /** Marca una etapa como propia mientras la nube la confirma. */
  recordarEtapaPendiente(caso, etapa) {
    if (!caso) return;
    const clave = String(caso._casoId || caso.id);
    if (!clave || clave === 'undefined') return;
    this._etapasPendientes.set(clave, { etapa, ts: Date.now() });
  },

  /** La escritura fallo: se suelta la etapa propia y se vuelve a la previa. */
  olvidarEtapaPendiente(caso, etapaPrevia) {
    if (!caso) return;
    const clave = String(caso._casoId || caso.id);
    this._etapasPendientes.delete(clave);
    if (etapaPrevia) caso.etapa = etapaPrevia;
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
          usuario: c.usuario,
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
            usuario: c.usuario,
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
              usuario: c.usuario,
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
   * menu lateral y el KPI "Casos en Alerta" del dashboard.
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
      estado: "pendiente"
    };

    if (!Array.isArray(caso.historialSolicitudes)) {
      caso.historialSolicitudes = [];
    }
    caso.historialSolicitudes.unshift({
      id: idSolicitud,
      evento: "solicitud",
      etapaOrigen: caso.solicitudCambio.etapaOrigen,
      etapaDestino: nuevaEtapa,
      solicitadoPor: caso.solicitudCambio.solicitadoPor,
      cargoSolicitante: caso.solicitudCambio.cargoSolicitante,
      fecha: fechaAhora,
      motivo: caso.solicitudCambio.motivo
    });

    // La nube es la fuente de verdad: la solicitud vive en solicitud_caso.
    // La promesa queda colgada del caso para que el controlador pueda saber
    // si la nube la acepto y revertir la vista si no.
    caso._solicitudPendiente = crearSolicitudCaso(caso, caso.solicitudCambio);
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

    caso.ultimaResolucion = { ...sol };
    delete caso.solicitudCambio;

    // En la nube: la solicitud se resuelve y, si se aprobó, la etapa cambia.
    resolverSolicitudCaso(sol.id, caso, esAprobado ? 'aprobada' : 'rechazada', comentario, autorizador);
    return { caso, solicitud: sol, aprobada: esAprobado };
  },

  /**
   * Retorna todos los casos que tengan solicitudes pendientes de autorización.
   */
  getCasosConSolicitudPendiente() {
    return this.getAll().filter(c => c && c.solicitudCambio && c.solicitudCambio.estado === "pendiente");
  },

  /** Movimiento directo de etapa desde el kanban. */
  updateStage(id, nuevaEtapa) {
    const list = this.getAll();
    const caso = list.find(c => String(c.id) === String(id) || c.id === Number(id));
    if (caso) {
      caso.etapa = nuevaEtapa;
      this.recordarEtapaPendiente(caso, nuevaEtapa);
      // Se guarda la promesa de la nube: el controlador espera la respuesta
      // para no anunciar un exito que la base haya rechazado.
      caso._guardadoPendiente = cambiarEtapaCaso(caso, nuevaEtapa);
      return caso;
    }
    return null;
  },

  /**
   * Alta de caso social. La nube localiza a la persona del usuario por su código;
   * sin expediente del usuario en la nube el alta es rechazada (avisado por db.js).
   */
  add(nuevoCaso) {
    const list = this.getAll();
    list.unshift(nuevoCaso);
    crearCasoSocial(nuevoCaso).then(ok => {
      if (!ok) list.splice(list.indexOf(nuevoCaso), 1);
    });
    return nuevoCaso;
  },

  /** Alias usado por ExpedienteView y el controlador del padrón. */
  addCaso(nuevoCaso) {
    return this.add(nuevoCaso);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasoSocialModel = CasoSocialModel;
}
