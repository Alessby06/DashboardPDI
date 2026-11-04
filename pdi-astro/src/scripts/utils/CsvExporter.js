// Utilidad: Exportador Tabular de Datos CSV
//
// Todos los valores salen entrecomillados y con las comillas dobles internas
// duplicadas (RFC 4180). Los nombres, las direcciones y los detalles de
// operacion pueden traerlas, y una comilla suelta desplazaba las columnas.
// El BOM inicial y el CRLF final son para que Excel abra el archivo en
// espanol sin pedir la codificacion ni pegar todas las filas en una sola.
export const CsvExporter = {
  /** Envuelve un valor en comillas y duplica las comillas internas. */
  _celda(valor) {
    if (valor === null || valor === undefined) return '""';
    return `"${String(valor).replace(/"/g, '""')}"`;
  },

  /** Compone las filas y dispara la descarga del archivo. */
  _descargar(nombreArchivo, encabezados, filas) {
    const lineas = [
      encabezados.map(h => this._celda(h)).join(","),
      ...filas.map(fila => fila.map(c => this._celda(c)).join(","))
    ];

    const blob = new Blob(["\uFEFF" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /** Padron de Beneficiarios (Padron). */
  exportBeneficiarios(beneficiarios) {
    const encabezados = ["Codigo", "Nombres", "Apellidos", "DNI", "Edad", "Sexo", "Distrito", "Sede", "Estrategias", "Servicios", "Seguro", "Hb", "Anemia", "Vulnerabilidad"];
    const filas = (beneficiarios || []).map(b => [
      b.codigo, b.nombres, b.apellidos, b.dni, b.edad, b.sexo, b.distrito, b.sede,
      Array.isArray(b.estrategias) ? b.estrategias.join("; ") : (b.estrategia || ""),
      Array.isArray(b.servicios) ? b.servicios.join("; ") : "",
      b.seguro, b.hb, b.anemia, b.vulnerabilidad
    ]);
    this._descargar("padron_pdi_usuarios_2026.csv", encabezados, filas);
  },

  /** Bitacora de Auditoria. */
  exportAuditLogs(logs) {
    const encabezados = ["Timestamp", "Usuario", "Rol", "Accion", "Entidad_Afectada", "Detalle_Operacion", "Estado_Registro"];
    const filas = (logs || []).map(l => [
      l.timestamp, l.user, l.role, l.action, l.entity, l.detail, l.status
    ]);
    this._descargar("bitacora_auditoria_pdi_ley29733.csv", encabezados, filas);
  },

  /** Control antropometrico CRED (Salud y Nutricion). */
  exportSalud(beneficiarios) {
    const encabezados = ["Codigo", "Nombres", "Apellidos", "DNI", "Edad", "Sexo", "Distrito", "Sede", "Peso (kg)", "Talla (cm)", "Hemoglobina (g/dL)", "Diagnostico Anemia", "Suplementacion", "Seguro"];
    const filas = (beneficiarios || []).map(b => [
      b.codigo, b.nombres, b.apellidos, b.dni, b.edad, b.sexo, b.distrito, b.sede,
      b.peso, b.talla, b.hb, b.anemia,
      b.anemia && b.anemia !== "Normal" ? "Sulfato Ferroso 1 dosis/dia" : "Dieta Preventiva",
      b.seguro
    ]);
    this._descargar("padron_salud_cred_pdi.csv", encabezados, filas);
  },

  /** Asistencia de una jornada de la Casita del Saber (Educativo).
   *  El estado vive en CasitasController; `mapa` llega como
   *  { [beneficiarioId]: { estado, observacion } } o como la forma antigua
   *  { [beneficiarioId]: 'P' }. `meta` es { dia, sede } de la jornada. */
  exportCasitas(list, mapa, meta = {}) {
    const etiquetas = { P: "Presente", T: "Tardanza", FJ: "Falta Justificada", FI: "Falta Injustificada" };
    const marcas = mapa || {};
    const encabezados = [
      "Codigo", "Nombres", "Apellidos", "DNI", "Edad", "Grado", "Colegio de Origen",
      "Apoderado", "Parentesco", "Telefono", "Distrito", "Sede", "Fecha",
      "Asistencia", "Motivo de Falta Justificada", "Racion Entregada", "Registrado por",
    ];
    const filas = (list || []).map(b => {
      const bruto = marcas[b.id];
      const marca = (bruto && typeof bruto === "object")
        ? bruto
        : { estado: bruto || "", observacion: "" };
      const estado = marca.estado || "";
      const grado = String(b.grado || "").trim() || "Sin registrar";
      const colegio = String(b.colegio || "").trim();
      return [
        b.codigo, b.nombres, b.apellidos, b.dni, b.edad, grado,
        (colegio && colegio !== "-") ? colegio : "Sin registrar",
        b.apoderado, b.parentesco, b.telefono, b.distrito, b.sede,
        meta.dia || "",
        estado ? (etiquetas[estado] || estado) : "Sin marcar",
        estado === "FJ" ? (marca.observacion || "") : "",
        estado === "P" || estado === "T" ? "Sí" : "No",
        marca.registradoPorNombre || "",
      ];
    });

    const slug = texto => String(texto || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
    const partes = ["asistencia_casita"];
    if (meta.sede) partes.push(slug(meta.sede));
    if (meta.dia) partes.push(meta.dia);
    this._descargar(`${partes.join("_")}.csv`, encabezados, filas);
  },

  /** Bandeja de derivaciones del Area Social Pastoral (Social). */
  exportCasosSociales(casos) {
    const etapas = {
      pendiente: "Pendientes / Alerta",
      evaluacion: "En Evaluacion Social",
      canalizado: "Canalizados (DEMUNA / BTF)",
      cerrado: "Cerrados con Informe"
    };
    const encabezados = ["Codigo", "Usuario", "Sede", "Etapa", "Urgencia", "Tipo de Problematica", "Fecha de Derivacion", "Vulnerabilidad (0-100)", "Derivado por", "Cargo", "Telefono", "Soporte Familiar", "Situacion Encontrada", "Acciones Previas"];
    const filas = (casos || []).map(c => {
      const deriva = c.quienDeriva || {};
      const soporte = c.soporteFamiliar
        ? (c.soporteFamiliar.tiene ? "Cuenta con soporte familiar" : "Sin red de soporte familiar")
        : "";
      return [
        c.codigo, c.usuario, c.sede, etapas[c.etapa] || c.etapa, c.urgencia, c.tipoProblematica,
        c.fechaDerivacion, c.vulnerabilidadPuntaje,
        deriva.nombre, deriva.cargo, deriva.telefono, soporte,
        c.situacionEncontrada || c.detalle, c.accionesPrevias
      ];
    });
    this._descargar("casos_sociales_asp_pdi.csv", encabezados, filas);
  },

  /** Directorio territorial de Sedes e Iglesias. */
  exportSedes(sedes) {
    const encabezados = ["Sede", "Distrito", "Direccion", "Referencia", "Tipo de Aliado", "Iglesia Aliada", "Pastor Aliado", "Facilitadora", "Cargo de Facilitadora", "Telefono", "Aforo Maximo", "Usuarios Inscritos", "Ocupacion (%)", "Servicios"];
    const filas = (sedes || []).map(s => [
      s.nombre, s.distrito, s.direccion, s.referencia, s.tipoAliado, s.iglesiaAliada, s.pastorAliado,
      s.facilitadora, s.facilitadoraCargo, s.facilitadoraTel, s.aforoMax, s.ninosInscritos, s.porcentajeOcupacion,
      Array.isArray(s.servicios) ? s.servicios.join("; ") : ""
    ]);
    this._descargar("directorio_sedes_pdi.csv", encabezados, filas);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CsvExporter = CsvExporter;
}
