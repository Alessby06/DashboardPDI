// ===========================================================================
//  AppController - Acciones transversales
// ===========================================================================
//  Este controlador era el nucleo de la SPA: inicializaba los cuatro modelos,
//  enrutaba entre ocho vistas, refrescaba todas las tablas de golpe y ataba el
//  menu lateral, el selector de rol y las pestanas de los modales. Todo eso
//  tiene ahora un sitio mejor:
//
//    - El arranque comun        -> core/Bootstrap.js
//    - El menu y el rol         -> core/Navigation.js
//    - El control de acceso     -> auth/PageGuard.js
//    - El dibujo de cada pagina  -> js/pages/<slug>.js
//
//  Lo que sobrevive es lo que no pertenece a ninguna de esas piezas: exportar
//  datos. Es una accion de un clic, sin estado y sin DOM que sobre, asi que un
//  modulo de funciones sueltas es el alcance correcto. El tema se fue a
//  core/Theme.js, que lo carga Bootstrap en todas las paginas.
import { BeneficiarioModel } from "../models/BeneficiarioModel.js";
import { AuditModel } from "../models/AuditModel.js";
import { CsvExporter } from "../utils/CsvExporter.js";

export const AppController = {
  /** Descarga el padron en CSV (filtrado o completo). */
  exportCSV(customList) {
    const datos = customList || BeneficiarioModel.getAll();
    CsvExporter.exportBeneficiarios(datos);
  },

  /** Descarga la bitacora de auditoria en CSV (filtrada o completa). */
  exportAuditCSV(customLogs) {
    const logs = customLogs || AuditModel.getAll();
    CsvExporter.exportAuditLogs(logs);
  },

  /** Descarga las evaluaciones CRED en CSV (filtradas o completas). */
  exportSaludCSV(customList) {
    const list = customList || BeneficiarioModel.getAll();
    CsvExporter.exportSalud(list);
  },

  /** Descarga el pase de asistencia de la Casita del Saber en CSV. */
  exportCasitasCSV(customList, asistenciaMap, meta) {
    const list = customList || BeneficiarioModel.getAll();
    CsvExporter.exportCasitas(list, asistenciaMap, meta);
  },

  /** Descarga las derivaciones del Area Social Pastoral en CSV. */
  exportCasosSocialesCSV(customList) {
    const list = customList || [];
    CsvExporter.exportCasosSociales(list);
  },

  /** Descarga el directorio territorial de sedes en CSV. */
  exportSedesCSV(customList) {
    const list = customList || [];
    CsvExporter.exportSedes(list);
  },
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AppController = AppController;
}
