import fs from 'fs';
import path from 'path';
import os from 'os';

// Polyfills para Node.js
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Rutas base
const baseDir = 'c:/Users/USER/Downloads/AREA-PDI-JOJANNES G/pdi-mvc/js';
const desktopDir = path.join(os.homedir(), 'Desktop');
const targetJsonPath = path.join(desktopDir, 'esquema_tablas_mvc_pdi_oficial.json');

async function runExport() {
  console.log('Importando módulos desde:', baseDir);

  // Importar modelos
  const { defaultBeneficiarios } = await import(`file:///${baseDir}/models/BeneficiarioModel.js`);
  const { SedeModel } = await import(`file:///${baseDir}/models/SedeModel.js`);
  const { VoluntarioModel, TEMATICAS_CAPACITACION } = await import(`file:///${baseDir}/models/VoluntarioModel.js`);
  const { defaultCasosSociales } = await import(`file:///${baseDir}/models/CasoSocialModel.js`);
  const { defaultAuditLogs } = await import(`file:///${baseDir}/models/AuditModel.js`);
  const { RoleController } = await import(`file:///${baseDir}/controllers/RoleController.js`);

  // Inicializar modelos
  SedeModel.init();
  VoluntarioModel.init();

  const sedesData = SedeModel.getAll();
  const voluntariosData = VoluntarioModel.getAll();

  const fullExport = {
    metadata: {
      proyecto: "Sistema PDI - Programa de Desarrollo Infantil",
      institucion: "Asociación Cultural Johannes Gutenberg - Lima Norte (Comas y Carabayllo)",
      version_mvc: "2.0-oficial",
      fecha_exportacion: new Date().toISOString(),
      archivo_destino: targetJsonPath,
      proposito: "Conciliación e importación oficial hacia Base de Datos Relacional SQL (PostgreSQL / MySQL / SQLite)",
      total_tablas_entidades: 7
    },
    resumen_entidades: [
      {
        tabla: "sedes",
        descripcion: "Directorio territorial de sedes comunitarias, locales de atención y convenios con iglesias/colegios",
        total_registros: sedesData.length,
        clave_primaria: "id"
      },
      {
        tabla: "beneficiarios",
        descripcion: "Padrón maestro único de menores, apoderados, tamizaje CRED, salud, educación y consentimientos Ley 29733",
        total_registros: defaultBeneficiarios.length,
        clave_primaria: "id",
        claves_unicas: ["codigo", "dni"]
      },
      {
        tabla: "personas_retiro_autorizadas",
        descripcion: "Personas acreditadas para el retiro seguro de menores en Casita del Saber (Ficha A2)",
        sub_entidad_de: "beneficiarios",
        clave_foranea: "beneficiario_id"
      },
      {
        tabla: "voluntarios",
        descripcion: "Padrón operativo de voluntariado y personal comunitario por sede, servicio, capacitaciones y estímulos",
        total_registros: voluntariosData.length,
        clave_primaria: "id",
        claves_unicas: ["codigo", "dni"]
      },
      {
        tabla: "casos_sociales",
        descripcion: "Mesa de derivaciones de vulnerabilidad y casos de urgencia del Área Social Pastoral (Kanban ASP)",
        total_registros: defaultCasosSociales.length,
        clave_primaria: "id",
        clave_foranea: "codigo -> beneficiarios.codigo"
      },
      {
        tabla: "audit_logs",
        descripcion: "Trazabilidad inmutable de seguridad, eventos de auditoría, modificaciones (diffs), IPs y usuarios",
        total_registros: defaultAuditLogs.length,
        clave_primaria: "id"
      },
      {
        tabla: "asistencia_casitas",
        descripcion: "Control de asistencia diaria escolar en Casitas del Saber (P: Presente, T: Tardanza, FJ: Falta Justificada, FI: Falta Injustificada)",
        clave_foranea: "beneficiario_id"
      }
    ],
    tablas: {
      sedes: {
        nombre_fisico: "sedes",
        pk: "id",
        descripcion: "Directorio de Sedes Operativas, Iglesias Aliadas y Colegios Aliados en Comas y Carabayllo.",
        origen_documental: "Fichas A0, A4, A5 e Informe Territorial PDI",
        diccionario_campos: {
          id: { tipo_sql: "VARCHAR(50)", nulo: false, pk: true, desc: "Identificador slug único de la sede (ej: sede-ano-nuevo)" },
          nombre: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Nombre oficial de la sede (ej. Año Nuevo, El Progreso)" },
          distrito: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Distrito de intervención (Comas / Carabayllo)" },
          direccion: { tipo_sql: "VARCHAR(255)", nulo: false, desc: "Dirección exacta del local" },
          referencia: { tipo_sql: "VARCHAR(255)", nulo: true, desc: "Referencia geográfica del local" },
          facilitadora: { tipo_sql: "VARCHAR(150)", nulo: false, desc: "Nombre de la Facilitadora o Responsable PDI" },
          facilitadoraCargo: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Cargo formal de la facilitadora" },
          facilitadoraTel: { tipo_sql: "VARCHAR(20)", nulo: false, desc: "Teléfono de contacto de la facilitadora" },
          pastorAliado: { tipo_sql: "VARCHAR(150)", nulo: false, desc: "Nombre del Pastor Responsable o Director(a) I.E." },
          iglesiaAliada: { tipo_sql: "VARCHAR(150)", nulo: false, desc: "Nombre de la Iglesia o Institución Educativa aliada" },
          tipoAliado: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Iglesia Aliada o Colegio Público Aliado" },
          aforoMax: { tipo_sql: "INT", nulo: false, desc: "Capacidad máxima instalada de menores (35 a 55)" },
          servicios: { tipo_sql: "JSON", nulo: false, desc: "Array de servicios que brinda la sede" },
          horario: { tipo_sql: "VARCHAR(100)", nulo: true, desc: "Horario de atención comunitaria" },
          estado: { tipo_sql: "VARCHAR(20)", nulo: false, desc: "Estado de operación (Operativa / Inactiva)" },
          coordenadas: { tipo_sql: "JSON", nulo: true, desc: "Objeto con latitud y longitud GPS" }
        },
        datos: sedesData
      },
      beneficiarios: {
        nombre_fisico: "beneficiarios",
        pk: "id",
        uk: ["codigo", "dni"],
        descripcion: "Padrón Maestro de Menores Beneficiarios con consolidación de datos personales, familiares, salud CRED y educativos.",
        origen_documental: "Fichas A1, A2, A3, Ficha A6 Hoja 4 (CRED) y Evaluación Socioeconómica ASP",
        diccionario_campos: {
          id: { tipo_sql: "INT AUTO_INCREMENT", nulo: false, pk: true, desc: "Identificador correlativo interno" },
          codigo: { tipo_sql: "VARCHAR(20)", nulo: false, uk: true, desc: "Código institucional único del menor (ej. PDI-2026-001)" },
          nombres: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Nombres del menor" },
          apellidos: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Apellidos del menor" },
          dni: { tipo_sql: "VARCHAR(12)", nulo: false, uk: true, desc: "Número de DNI o Carnet de Extranjería" },
          fechaNacimiento: { tipo_sql: "DATE", nulo: false, desc: "Fecha de nacimiento (YYYY-MM-DD)" },
          edad: { tipo_sql: "VARCHAR(15)", nulo: false, desc: "Edad en texto/calculada (ej. 4 años)" },
          sexo: { tipo_sql: "CHAR(1)", nulo: false, desc: "Sexo biológico (M / F)" },
          direccion: { tipo_sql: "VARCHAR(255)", nulo: false, desc: "Dirección domiciliaria actual" },
          referencia: { tipo_sql: "VARCHAR(255)", nulo: true, desc: "Referencia de la vivienda" },
          distrito: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Distrito de residencia (Comas / Carabayllo)" },
          sede: { tipo_sql: "VARCHAR(50)", nulo: false, fk: "sedes.nombre", desc: "Sede asignada" },
          modalidad: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Comunitaria / Institución Educativa (I.E.)" },
          estrategia: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Desayuno Infantil / Lonchera Infantil / Mixto" },
          exoneracionAporte: { tipo_sql: "VARCHAR(50)", nulo: true, desc: "Porcentaje de exoneración de aporte mensual (0%, 50%, 100%)" },
          servicios: { tipo_sql: "JSON", nulo: false, desc: "Array de servicios asignados al menor" },
          seguro: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Tipo de seguro (SIS, EsSalud, etc.)" },
          centroSalud: { tipo_sql: "VARCHAR(100)", nulo: true, desc: "Centro de Salud de atención" },
          alergias: { tipo_sql: "VARCHAR(255)", nulo: true, desc: "Alergias a medicamentos o alimentos" },
          nivelEducativo: { tipo_sql: "VARCHAR(50)", nulo: true, desc: "Nivel educativo (Inicial / Primaria / Secundaria)" },
          grado: { tipo_sql: "VARCHAR(50)", nulo: true, desc: "Grado escolar que cursa" },
          colegio: { tipo_sql: "VARCHAR(150)", nulo: true, desc: "Institución Educativa donde estudia" },
          apoderado: { tipo_sql: "VARCHAR(150)", nulo: false, desc: "Nombres y apellidos del apoderado principal" },
          parentesco: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Parentesco del apoderado con el menor" },
          apoderadoDni: { tipo_sql: "VARCHAR(12)", nulo: false, desc: "DNI del apoderado titular" },
          telefono: { tipo_sql: "VARCHAR(20)", nulo: false, desc: "Teléfono principal de contacto" },
          telefonoAlt: { tipo_sql: "VARCHAR(20)", nulo: true, desc: "Teléfono alternativo" },
          estado: { tipo_sql: "VARCHAR(20)", nulo: false, desc: "Activo / Inactivo / Derivado / Graduado" },
          hb: { tipo_sql: "DECIMAL(4,1)", nulo: true, desc: "Último valor de hemoglobina tamizada (g/dL)" },
          peso: { tipo_sql: "DECIMAL(5,2)", nulo: true, desc: "Último peso registrado en kg" },
          talla: { tipo_sql: "DECIMAL(5,2)", nulo: true, desc: "Última talla registrada en cm" },
          anemia: { tipo_sql: "VARCHAR(30)", nulo: true, desc: "Diagnóstico de anemia según MINSA (Normal, Leve, Moderada, Severa)" },
          canastaEntregada: { tipo_sql: "BOOLEAN", nulo: false, desc: "Si se le entregó canasta complementaria" },
          orientacionFamiliar: { tipo_sql: "BOOLEAN", nulo: false, desc: "Si recibió sesión/orientación familiar" },
          retiroPadron: { tipo_sql: "JSON", nulo: false, desc: "Lista de personas autorizadas para retirar al menor" },
          consentimientos: { tipo_sql: "JSON", nulo: false, desc: "Consentimientos informados bajo Ley 29733 (social, foto, fondos, flujo)" },
          firmaDigital: { tipo_sql: "BOOLEAN", nulo: false, desc: "Estado de firma digitalizada" },
          vulnerabilidad: { tipo_sql: "INT", nulo: true, desc: "Score de vulnerabilidad calculado (0-100 pts)" },
          fotoFachada: { tipo_sql: "TEXT", nulo: true, desc: "Base64 o URL de la foto de la vivienda" },
          coordenadas: { tipo_sql: "JSON", nulo: true, desc: "Coordenadas GPS de la vivienda" }
        },
        datos: defaultBeneficiarios
      },
      voluntarios: {
        nombre_fisico: "voluntarios",
        pk: "id",
        uk: ["codigo", "dni"],
        descripcion: "Padrón de Voluntariado Comunitario y Personal de Apoyo en Sedes y Servicios PDI.",
        origen_documental: "Ficha A4 (Facilitador/Voluntaria), Ficha A5 (Voluntarias) y Registro Operativo",
        diccionario_campos: {
          id: { tipo_sql: "INT AUTO_INCREMENT", nulo: false, pk: true, desc: "Identificador correlativo" },
          codigo: { tipo_sql: "VARCHAR(20)", nulo: false, uk: true, desc: "Código oficial (ej. VOL-2026-001)" },
          nombres: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Nombres del voluntario(a)" },
          apellidos: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Apellidos del voluntario(a)" },
          dni: { tipo_sql: "VARCHAR(12)", nulo: false, uk: true, desc: "Número de DNI" },
          celular: { tipo_sql: "VARCHAR(20)", nulo: false, desc: "Número de celular" },
          fechaNacimiento: { tipo_sql: "DATE", nulo: true, desc: "Fecha de nacimiento" },
          edad: { tipo_sql: "INT", nulo: true, desc: "Edad en años" },
          domicilio: { tipo_sql: "VARCHAR(255)", nulo: true, desc: "Dirección del voluntario" },
          distrito: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Distrito (Comas / Carabayllo)" },
          sedeAsignada: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Sede donde opera" },
          servicio: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Desayuno Infantil / Casita del Saber / ASP" },
          rol: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Voluntaria Responsable / Voluntaria de Apoyo / Acompañante Pedagógica / Mediadora Lectora / Pastoral Comunitario" },
          estrategia: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Atención Fija / Atención Itinerante" },
          tipoVoluntariado: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Distribución y Cocina / Apoyo en Espacios Casita / Biblioteca Comunitaria / Talleres y Consejería" },
          capacitaciones: { tipo_sql: "JSON", nulo: true, desc: "Array de capacitaciones aprobadas" },
          canastasRecibidas: { tipo_sql: "INT", nulo: false, desc: "Cantidad de canastas de estímulo recibidas" },
          fechaIngreso: { tipo_sql: "DATE", nulo: false, desc: "Fecha de registro en el programa" },
          estado: { tipo_sql: "VARCHAR(20)", nulo: false, desc: "Activo / En Pausa / Inactivo" },
          disponibilidad: { tipo_sql: "VARCHAR(150)", nulo: true, desc: "Días y horarios de disponibilidad" },
          observaciones: { tipo_sql: "TEXT", nulo: true, desc: "Observaciones del coordinador" }
        },
        datos: voluntariosData
      },
      casos_sociales: {
        nombre_fisico: "casos_sociales",
        pk: "id",
        fk: [{ campo: "codigo", referencia: "beneficiarios.codigo" }],
        descripcion: "Mesa de Derivaciones y Casos de Protección Social del Área Social Pastoral (ASP) administrados vía Kanban.",
        origen_documental: "Ficha de Derivación de Caso Social y Evaluación Socioeconómica PDI",
        diccionario_campos: {
          id: { tipo_sql: "INT AUTO_INCREMENT", nulo: false, pk: true, desc: "Identificador único del caso social" },
          menor: { tipo_sql: "VARCHAR(150)", nulo: false, desc: "Nombre del menor derivado" },
          codigo: { tipo_sql: "VARCHAR(20)", nulo: false, fk: "beneficiarios.codigo", desc: "Código del beneficiario en padrón" },
          etapa: { tipo_sql: "VARCHAR(30)", nulo: false, desc: "Etapa Kanban: pendiente / en_evaluacion / canalizado / resuelto" },
          urgencia: { tipo_sql: "VARCHAR(20)", nulo: false, desc: "Nivel de urgencia: Alta / Media / Baja" },
          tipoProblematica: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Nutricional / Abandono / Familiar / Extrema Pobreza / Educativo" },
          fechaDerivacion: { tipo_sql: "DATE", nulo: false, desc: "Fecha de emisión de la ficha de derivación" },
          quienDeriva: { tipo_sql: "JSON", nulo: false, desc: "Objeto con nombre, cargo y teléfono del colaborador/voluntario que deriva" },
          situacionEncontrada: { tipo_sql: "TEXT", nulo: false, desc: "Descripción de la situación y diagnóstico inicial" },
          accionesPrevias: { tipo_sql: "TEXT", nulo: true, desc: "Acciones realizadas previamente por la sede" },
          soporteFamiliar: { tipo_sql: "JSON", nulo: false, desc: "Objeto con tiene (boolean) y detalle (string)" },
          detalle: { tipo_sql: "TEXT", nulo: true, desc: "Resumen rápido para tarjeta Kanban" },
          sede: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Sede de origen" },
          vulnerabilidadPuntaje: { tipo_sql: "INT", nulo: true, desc: "Score de vulnerabilidad del caso (0-100 pts)" }
        },
        datos: defaultCasosSociales
      },
      audit_logs: {
        nombre_fisico: "audit_logs",
        pk: "id",
        descripcion: "Registro Inviolable de Trazabilidad, Seguridad, Modificación de Datos (Diffs) y Auditoría de Accesos.",
        origen_documental: "Requerimientos no funcionales de seguridad, Ley 29733 y estándares OWASP",
        diccionario_campos: {
          id: { tipo_sql: "VARCHAR(30)", nulo: false, pk: true, desc: "Código único de log (ej. LOG-2026-001)" },
          timestamp: { tipo_sql: "DATETIME", nulo: false, desc: "Fecha y hora exacta del evento" },
          user: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Nombre del usuario que realizó la operación" },
          role: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Rol en sesión (Coordinación, Facilitadora, Promotora, Trabajadora Social, Admin)" },
          action: { tipo_sql: "VARCHAR(100)", nulo: false, desc: "Acción ejecutada (Tamizaje CRED, Derivación Caso, Pase Asistencia, etc.)" },
          entity: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "ID o código de la entidad afectada" },
          detail: { tipo_sql: "TEXT", nulo: false, desc: "Descripción detallada del evento" },
          status: { tipo_sql: "VARCHAR(30)", nulo: false, desc: "Estado/Clasificación (Registrado, Sensible, Alerta)" },
          ip: { tipo_sql: "VARCHAR(45)", nulo: false, desc: "Dirección IP del cliente" },
          sede: { tipo_sql: "VARCHAR(50)", nulo: false, desc: "Sede de operación" },
          diff: { tipo_sql: "JSON", nulo: true, desc: "Array de cambios { campo, valorAnterior, valorNuevo }" }
        },
        datos: defaultAuditLogs
      }
    },
    estructuras_auxiliares_y_reglas: {
      roles_rbac: RoleController.rolesConfig,
      tematicas_capacitacion_voluntariado: TEMATICAS_CAPACITACION,
      algoritmo_vulnerabilidad_asp: {
        metodologia: "Scoring Paramétrico PDI (0 a 100 puntos)",
        dimensiones_y_ponderaciones_maximas: {
          "ingresos_per_capita (ing)": 28,
          "habitabilidad_vivienda (viv)": 20,
          "estabilidad_laboral_cuidadores (emp)": 16,
          "composicion_y_sobrecarga_familiar (sop)": 19,
          "nivel_instruccion_apoderados (ins)": 10,
          "condiciones_salud_cronica_discapacidad (sal)": 7
        },
        umbrales_de_decision: {
          "80_a_100_pts": { clasificacion: "Extrema Pobreza / Vulnerabilidad Crítica", exoneracion: "100% Exoneración Total" },
          "60_a_79_pts": { clasificacion: "Vulnerabilidad Alta / Prioridad Social", exoneracion: "50% Semi-exoneración" },
          "40_a_59_pts": { clasificacion: "Vulnerabilidad Moderada", exoneracion: "Aporte Ordinario / Semi-exoneración Condicionada" },
          "0_a_39_pts": { clasificacion: "Baja Vulnerabilidad / Situación Estable", exoneracion: "0% Aporte Ordinario" }
        }
      },
      reglas_diagnostico_anemia_minsa: {
        "hb_menor_7_0": { diagnostico: "Anemia Severa", accion: "Derivación Hospitalaria Inmediata + Alerta Médica ASP" },
        "hb_7_0_a_9_9": { diagnostico: "Anemia Moderada", accion: "Sulfato Ferroso 2 gotas/kg/día + Visita Domiciliaria ASP" },
        "hb_10_0_a_10_9": { diagnostico: "Anemia Leve", accion: "Suplementación con Gotas de Hierro + Taller Nutricional" },
        "hb_mayor_igual_11_0": { diagnostico: "Normal (Sin Anemia)", accion: "Desayuno Fortificado Diario + Control CRED trimestral" }
      }
    }
  };

  fs.writeFileSync(targetJsonPath, JSON.stringify(fullExport, null, 2), 'utf-8');
  console.log('✅ Archivo exportado exitosamente a:', targetJsonPath);
  console.log('📦 Tamaño del archivo generado:', (fs.statSync(targetJsonPath).size / 1024).toFixed(2), 'KB');
}

runExport().catch(err => {
  console.error('Error al exportar:', err);
  process.exit(1);
});
