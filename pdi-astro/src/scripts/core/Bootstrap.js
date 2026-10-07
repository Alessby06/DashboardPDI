// ===========================================================================
//  BOOTSTRAP - Arranque comun a todas las paginas
// ===========================================================================
//  La SPA tenia un unico arranque (AppController.init) que hacia nueve cosas en
//  un orden fijo, porque las nueve vistas vivian en el mismo documento. En la
//  MPA cada pagina arranca lo suyo; lo unico que comparten es el chrome.
//
//  Este modulo hace esa parte comun y nada mas. El orden importa:
//
//    1. PageGuard  - decide si esta pagina puede siquiera mostrarse. Si deniega,
//                    redirige y el resto no debe ejecutarse.
//    2. Modelos    - datos en memoria, sin tocar el DOM.
//    3. Chrome     - tema, menu lateral, selector de rol, pestanas de modales.
//    4. Vista      - lo registra cada js/pages/<slug>.js, fuera de aqui.
//
//  Que NO se hace aqui, a diferencia de la SPA: no se redibuja ninguna tabla y
//  no se inicializa ninguna calculadora. Eso es responsabilidad de la pagina, y
//  es justo lo que evita que padron.html cargue el kanban social o que
//  salud.html cargue la tabla de auditoria.
import { PageGuard } from "../auth/PageGuard.js";
import { haySesion } from "../auth/usuarios.js";
import { Navigation } from "./Navigation.js";
import { RoleController } from "../controllers/RoleController.js";
import { BeneficiarioModel } from "../models/BeneficiarioModel.js";
import { CasoSocialModel } from "../models/CasoSocialModel.js";
import { SedeModel } from "../models/SedeModel.js";
import { VoluntarioModel } from "../models/VoluntarioModel.js";
import { AuditModel } from "../models/AuditModel.js";
import { Theme } from "./Theme.js";
import { ToastView } from "../views/ToastView.js";
import { hidratarDesdeSurreal } from "./db.js";

/**
 * Arranca el chrome. Devuelve el slug de la pagina si el acceso fue concedido,
 * o null si PageGuard denego y ya redirigio.
 *
 * Los modelos se inicializan siempre y todos: son cuatro llamadas sobre arrays
 * en memoria, sin lectura del DOM, y su coste es despreciable. Cargarlos de
 * forma selectiva por pagina solo produciria fallos del tipo "el filtro de sedes
 * se encuentra con la lista vacia" en cuanto alguien reordenara las llamadas.
 */
export function arrancarComun() {
  // 0. Sesión — si no hay sesión activa, ni siquiera ejecutamos PageGuard.
  if (!haySesion()) {
    window.location.replace("/login");
    return null;
  }

  const slug = PageGuard.init();
  if (!slug) return null;

  // Modelos. AuditModel no tiene init(): su lista semilla vive en el modulo.
  BeneficiarioModel.init();
  CasoSocialModel.init();
  SedeModel.init();
  VoluntarioModel.init();

  if (typeof AuditModel.getAll !== "function") {
    console.error("[Bootstrap] AuditModel no responde; la vista de auditoria quedara vacia.");
  }

  // Chrome. El tema se restaura en todas las paginas, pero desde Theme y no
  // desde AjustesView: asi las nueve que no son ajustes no descargan sus 11 KB.
  Theme.cargar();
  Navigation.bindSidebar();
  Navigation.bindResize();
  Navigation.bindModalTabs();
  Navigation.cerrarAlNavegar();

  // Banner y tooltip del rol activo. Las decisiones de acceso ya las tomo
  // PageGuard; esto es solo presentacion.
  RoleController.applyRolePermissions(PageGuard.rolActual, null, false);

  // Badges del menu lateral: se calculan de los modelos, nunca de numeros
  // escritos a mano en el HTML.
  actualizarBadgesSidebar();

  // Carga datos reales de SurrealDB en segundo plano; al terminar refresca la vista.
  hidratarDesdeSurreal();

  return slug;
}

/**
 * Escribe en los badges del sidebar los conteos reales de los modelos.
 * Llamar tambien tras cualquier alta/baja/cambio de etapa que altere un total.
 */
export function actualizarBadgesSidebar() {
  const set = (id, valor) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(valor);
  };

  try {
    set("badgeTotalBeneficiarios", BeneficiarioModel.getAll().length);
  } catch (e) { /* badge no presente en esta pagina */ }

  try {
    set("badgeCasosCriticos", CasoSocialModel.contarCriticos());
  } catch (e) { /* idem */ }

  try {
    set("badgeTotalVoluntarios", VoluntarioModel.getAll().length);
  } catch (e) { /* idem */ }
}

export function restaurarDatosLocales() {
  localStorage.removeItem("pdi_beneficiarios");
  localStorage.removeItem("pdi_casos_sociales");
  BeneficiarioModel.init();
  CasoSocialModel.init();
  SedeModel.init();
  VoluntarioModel.init();
  if (typeof window.PDI?.refrescarVistaActual === "function") {
    window.PDI.refrescarVistaActual();
  }
  console.log("[PDI] Datos locales y tablas restauradas exitosamente.");
}

/** Publica el redibujado de la pagina, para los puentes heredados. */
export function publicarRefresco(fn) {
  window.PDI = window.PDI || {};
  window.PDI.refrescarVistaActual = fn;
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.Bootstrap = { arrancarComun, publicarRefresco, restaurarDatosLocales, actualizarBadgesSidebar };
  window.PDI.restaurarDatosLocales = restaurarDatosLocales;
  window.PDI.ToastView = ToastView;
  window.PDI.Navigation = Navigation;
  window.PDI.RoleController = RoleController;
  window.PDI.AuditModel = AuditModel;
}
