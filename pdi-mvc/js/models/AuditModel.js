// Modelo de Trazabilidad y Auditoría de Seguridad
// Los datos semilla viven fuera del codigo: son registros ficticios y estan
// marcados como tales. Ver data/fixtures/audit-logs.js
import { defaultAuditLogs } from '../../data/fixtures/audit-logs.js';
export { defaultAuditLogs };


export const AuditModel = {
  _logs: [...defaultAuditLogs],

  getAll() {
    return this._logs;
  },

  getById(id) {
    return this._logs.find(l => l.id === id) || null;
  },

  log(user, role, action, entity, detail, status = "Registrado", diff = null, ip = "192.168.1.x", sede = "Central") {
    const now = new Date();
    const timestamp = now.getFullYear() + "-" + 
      String(now.getMonth() + 1).padStart(2, '0') + "-" + 
      String(now.getDate()).padStart(2, '0') + " " + 
      String(now.getHours()).padStart(2, '0') + ":" + 
      String(now.getMinutes()).padStart(2, '0');

    const id = "LOG-" + now.getFullYear() + "-" + String(this._logs.length + 1).padStart(3, '0');
    const entry = { id, timestamp, user, role, action, entity, detail, status, ip, sede, diff };
    this._logs.unshift(entry);
    return entry;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.defaultAuditLogs = defaultAuditLogs;
  window.PDI.AuditModel = AuditModel;
}
