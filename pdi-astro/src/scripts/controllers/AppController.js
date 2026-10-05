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
import { ToastView } from "../views/ToastView.js";

export const AppController = {
  /** Descarga el padron completo en CSV. */
  exportCSV() {
    const datos = BeneficiarioModel.getAll();
    CsvExporter.exportBeneficiarios(datos);
    ToastView.show(
      "Reporte Exportado",
      'Consolidado oficial "PDI" descargado en formato CSV',
      "success"
    );
  },

  /** Descarga la bitacora de auditoria en CSV. */
  exportAuditCSV() {
    const logs = AuditModel.getAll();
    CsvExporter.exportAuditLogs(logs);
    ToastView.show(
      "Bitácora Descargada",
      "Registro oficial de auditoría descargado en formato CSV (Ley 29733)",
      "success"
    );
  },
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AppController = AppController;
}
