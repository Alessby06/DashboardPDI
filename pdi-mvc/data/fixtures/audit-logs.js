// ===========================================================================
//  DATOS SEMILLA - CONTENIDO FICTICIO
// ===========================================================================
//  Bitacora de auditoria y trazabilidad.
//
//  IMPORTANTE: los registros de este archivo son INVENTADOS. No corresponden
//  a menores, familias ni personas reales. Los documentos de identidad,
//  telefonos, coordenadas y domicilios son ficticios.
//
//  Sirven unicamente para poblar la interfaz mientras no exista la base de
//  datos del sistema. Cuando se conecte la fuente real, este archivo deja de
//  leerse y el modelo pasa a cargar los datos del servidor.
//
//  Los datos reales se incorporaran desde los archivos Excel del relevamiento
//  de campo; el modelo de datos ya esta disenado para recibirlos.
// ===========================================================================

export const defaultAuditLogs = [
  {
    id: "LOG-2026-001",
    timestamp: "2026-09-13 17:30",
    user: "Carmen Mendoza",
    role: "Facilitadora",
    action: "Tamizaje CRED",
    entity: "PDI-2026-001",
    detail: "Registro de control nutricional mensual y tamizaje de hemoglobina",
    status: "Registrado",
    ip: "192.168.1.45",
    sede: "Año Nuevo",
    diff: [
      { campo: "Hemoglobina (Hb)", valorAnterior: "9.8 g/dL (Moderada)", valorNuevo: "10.4 g/dL (Leve)" },
      { campo: "Peso / Talla", valorAnterior: "13.9 kg / 93.0 cm", valorNuevo: "14.2 kg / 94.5 cm" },
      { campo: "Diagnóstico Anemia", valorAnterior: "Anemia Moderada", valorNuevo: "Anemia Leve" }
    ]
  },
  {
    id: "LOG-2026-002",
    timestamp: "2026-09-13 16:45",
    user: "Lic. Ruth Soto",
    role: "Trabajadora Social",
    action: "Derivación Caso",
    entity: "PDI-2026-003",
    detail: "Canalización de caso social de urgencia alta a DEMUNA Carabayllo",
    status: "Sensible",
    ip: "192.168.1.18",
    sede: "El Progreso",
    diff: [
      { campo: "Estado Caso Social", valorAnterior: "Evaluación Preliminar", valorNuevo: "Canalizado a DEMUNA" },
      { campo: "Nivel de Urgencia", valorAnterior: "Media", valorNuevo: "Alta (Vulnerabilidad Extrema)" },
      { campo: "Oficio Notificación", valorAnterior: "-", valorNuevo: "OF-DEMUNA-2026-089" }
    ]
  },
  {
    id: "LOG-2026-003",
    timestamp: "2026-09-13 15:20",
    user: "Rosa Flores",
    role: "Promotora",
    action: "Pase Asistencia",
    entity: "Sede Año Nuevo",
    detail: "Registro y cierre de asistencia diaria en Casita del Saber",
    status: "Registrado",
    ip: "192.168.1.22",
    sede: "Año Nuevo",
    diff: [
      { campo: "Menores Presentes", valorAnterior: "0 / 20", valorNuevo: "18 / 20 presentes" },
      { campo: "Ración Lonchera", valorAnterior: "Pendiente", valorNuevo: "18 raciones distribuidas" }
    ]
  },
  {
    id: "LOG-2026-004",
    timestamp: "2026-09-13 14:10",
    user: "Dirección Gutenberg",
    role: "Coordinación",
    action: "Aprobación Padrón",
    entity: "Padrón 2026",
    detail: "Validación de expedientes del padrón institucional 2026 conforme a Ley 29733",
    status: "Registrado",
    ip: "192.168.1.10",
    sede: "Central Lima",
    diff: [
      { campo: "Expedientes Auditados", valorAnterior: "20 revisados", valorNuevo: "28 expedientes aprobados" },
      { campo: "Consentimientos Ley 29733", valorAnterior: "92%", valorNuevo: "100% verificados" }
    ]
  }
]
