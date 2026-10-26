// Modelo de Trazabilidad y Auditoría de Seguridad
// La fuente única de verdad es la instancia de SurrealDB Cloud
// (bitacora_auditoria). Sin fixtures: los eventos históricos llegan de la nube
// y cada log() new también escribe allí (registro inalterable para exportación
// forense bajo Ley N.° 29733).
import { crearBitacora } from '../core/db.js';

export const AuditModel = {
  _logs: null,

  init() {
    if (!this._logs) this._logs = [];
  },

  /** La capa de datos entrega la bitácora hidratada de la nube. */
  aplicarDatos(lista) {
    if (!Array.isArray(lista)) return;
    this._logs = lista;
  },

  getAll() {
    if (!this._logs) this.init();
    return this._logs;
  },

  getById(id) {
    this.init();
    return this._logs.find(l => l.id === id) || null;
  },

  async log(user, role, action, entity, detail, diff = null, ip = "192.168.1.x", sede = "Central") {
    this.init();
    const now = new Date();
    const timestamp = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, '0') + "-" +
      String(now.getDate()).padStart(2, '0') + " " +
      String(now.getHours()).padStart(2, '0') + ":" +
      String(now.getMinutes()).padStart(2, '0');

    const id = "LOG-" + String(this._logs.length + 1).padStart(4, '0');
    const entry = { id, timestamp, user, role, action, entity, detail, status: "Registrado", ip, sede, diff };
    this._logs.unshift(entry);
    // Persistencia real: el evento vive en bitacora_auditoria. Se espera la
    // escritura para que una navegación inmediata no la deje a medias.
    await crearBitacora(entry);
    return entry;
  },

  /**
   * Variante por objeto que ExpedienteView y VoluntariadosView ya invocaban.
   * Mapea sus llaves al contrato del log() clásico sin dejar huérfanos.
   */
  addLog(entry = {}) {
    if (!entry || typeof entry !== "object") return null;
    return this.log(
      entry.user || "Sistema",
      entry.role || "Sistema",
      entry.action || "Evento",
      entry.entity || "",
      entry.detail || "",
      entry.diff ?? null,
      entry.ip || "192.168.1.x",
      entry.sede || "Central"
    );
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AuditModel = AuditModel;
}
