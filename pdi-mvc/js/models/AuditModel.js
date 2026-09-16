// Modelo de Trazabilidad y Auditoría de Seguridad
export const defaultAuditLogs = [
  {
    timestamp: "2026-09-13 17:30",
    user: "Carmen Mendoza",
    role: "Facilitadora",
    action: "Tamizaje CRED",
    entity: "PDI-2026-001",
    detail: "Registro Hb: 10.4 g/dL (Anemia Leve)",
    status: "Válido"
  },
  {
    timestamp: "2026-09-13 16:45",
    user: "Lic. Ruth Soto",
    role: "Trabajadora Social",
    action: "Derivación Caso",
    entity: "PDI-2026-003",
    detail: "Canalización a DEMUNA Carabayllo",
    status: "Activo"
  },
  {
    timestamp: "2026-09-13 15:20",
    user: "Rosa Flores",
    role: "Promotora",
    action: "Pase Asistencia",
    entity: "Sede Año Nuevo",
    detail: "Asistencia 18/20 niños",
    status: "Conforme"
  },
  {
    timestamp: "2026-09-13 14:10",
    user: "Dirección Gutenberg",
    role: "Coordinación",
    action: "Aprobación Padrón",
    entity: "Padrón 2026",
    detail: "Validación de 28 expedientes",
    status: "Aprobado"
  }
];

export const AuditModel = {
  _logs: [...defaultAuditLogs],

  getAll() {
    return this._logs;
  },

  log(user, role, action, entity, detail, status = "Válido") {
    const now = new Date();
    const timestamp = now.getFullYear() + "-" + 
      String(now.getMonth() + 1).padStart(2, '0') + "-" + 
      String(now.getDate()).padStart(2, '0') + " " + 
      String(now.getHours()).padStart(2, '0') + ":" + 
      String(now.getMinutes()).padStart(2, '0');

    const entry = { timestamp, user, role, action, entity, detail, status };
    this._logs.unshift(entry);
    return entry;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.defaultAuditLogs = defaultAuditLogs;
  window.PDI.AuditModel = AuditModel;
}
