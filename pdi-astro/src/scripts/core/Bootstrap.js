// ===========================================================================
//  BOOTSTRAP - Arranque comun a todas las paginas
// ===========================================================================
//  La SPA tenia un unico arranque (AppController.init) que hacia nueve cosas en
//  un orden fijo, porque las nueve vistas vivian en el mismo documento. En la
//  MPA cada pagina arranca lo suyo; lo unico que comparten es el chrome.
//
//  Este modulo hace esa parte comun y nada mas. El orden importa:
//
//    1. PageGuard    - decide si esta pagina puede siquiera mostrarse. Si deniega,
//                      redirige y el resto no debe ejecutarse.
//    2. VistaConexion- la app depende por completo de SurrealDB Cloud: el velo
//                      tapa la pantall mientras conecta y BLOQUEA si falla.
//    3. Modelos      - datos en memoria (vacias hasta que la nube hidrata).
//    4. Chrome       - tema, menu lateral, selector de rol, pestanas de modales.
//    5. Vista        - lo registra cada js/pages/<slug>.js, fuera de aqui.
//
//  Que NO se hace aqui, a diferencia de la SPA: no se redibuja ninguna tabla y
//  no se inicializa ninguna calculadora. Eso es responsabilidad de la pagina, y
//  es justo lo que evita que padron.html cargue el kanban social o que
//  salud.html cargue la tabla de auditoria.
import { PageGuard } from "../auth/PageGuard.js";
import { haySesion, CLAVE_ROL } from "../auth/usuarios.js";
import { Navigation } from "./Navigation.js";
import { RoleController } from "../controllers/RoleController.js";
import { BeneficiarioModel } from "../models/BeneficiarioModel.js";
import { CasoSocialModel } from "../models/CasoSocialModel.js";
import { SedeModel } from "../models/SedeModel.js";
import { VoluntarioModel } from "../models/VoluntarioModel.js";
import { ColaboradorModel } from "../models/ColaboradorModel.js";
import { AuditModel } from "../models/AuditModel.js";
import { Theme } from "./Theme.js";
import { ToastView } from "../views/ToastView.js";
import {
  iniciarCapaDatos, refrescarDesdeNube, hidratarDesdeSurreal, aplicarSnapshotInicial,
  fetchBitacora, LIMITE_BITACORA,
} from "./db.js";
import { guardarCache, leerCache } from "./snapshot.js";
import { iniciarEstadoCarga } from "./LoadingState.js";

/**
 * Deja la bitácora lista antes de que se abra Historial de Cambios.
 *
 * Esa vista no puede pintar nada hasta que responde su API (~0,8-1,1 s en
 * frío). Pedirla en tiempo muerto, solo para coordinación y administración,
 * hace que la primera visita pinte de inmediato y que la revalidación sea
 * invisible. No se adelanta en la propia página: allí la pide su script.
 */
let bitacoraPrecargada = false;

function precargarBitacora(slug) {
  if (bitacoraPrecargada || slug === "auditoria") return;
  let rol = "";
  try { rol = localStorage.getItem(CLAVE_ROL) || ""; } catch (e) { /* sin almacenamiento */ }
  if (!["coord", "admin"].includes(rol)) return;
  const conexion = navigator.connection;
  if (conexion?.saveData || /^(slow-2g|2g)$/.test(String(conexion?.effectiveType || ""))) return;
  bitacoraPrecargada = true;

  const lanzar = async () => {
    const cache = leerCache("bitacora", { ttlMs: 30 * 1000 });
    if (Array.isArray(cache) && cache.length) {
      if (!AuditModel.getAll().length) AuditModel.aplicarDatos(cache);
      return;
    }
    const { logs } = await fetchBitacora({ limit: LIMITE_BITACORA });
    if (!logs.length) return;
    if (!AuditModel.getAll().length) AuditModel.aplicarDatos(logs);
    guardarCache("bitacora", logs, { ttlMs: 10 * 60 * 1000, maxBytes: 2_000_000 });
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => { void lanzar(); }, { timeout: 3000 });
  } else {
    setTimeout(() => { void lanzar(); }, 1500);
  }
}

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

  // 1. La conexión con la nube es silenciosa: la capa de datos (db.js) carga
  //    y rehidrata por su cuenta; en caso de fallo solo avisos (toasts).

  // Modelos. AuditModel no tiene init(): su lista vive en la nube.
  BeneficiarioModel.init();
  CasoSocialModel.init();
  SedeModel.init();
  VoluntarioModel.init();
  ColaboradorModel.init();

  // Copia de la última hidratación en esta pestaña: permite retirar el
  // esqueleto sin esperar a la nube. Si no hay copia válida, no hace nada.
  aplicarSnapshotInicial();

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

  // Encender la capa de datos (conexion, hidratacion, LIVE y reintentos).
  // No es await: el controlador de carga retira el esqueleto cuando la capa
  // avisa que la primera hidratacion termino.
  iniciarEstadoCarga();
  iniciarCapaDatos();
  precargarBitacora(slug);

  return slug;
}

/**
 * Ya no se "restauran datos locales": la unica fuente es la nube. El boton de
 * Ajustes re-descarga todos los datasets desde SurrealDB (cache fresca).
 */
export function restaurarDatosLocales() {
  return refrescarDesdeNube();
}

/** Publica el redibujado de la pagina, para los puentes heredados. */
export function publicarRefresco(fn) {
  window.PDI = window.PDI || {};
  window.PDI.refrescarVistaActual = fn;
}

if (typeof window !== "undefined") {
  // Chromium aborta una View Transition si la pestaña pasa a segundo plano
  // mientras se prepara. Es un aborto benigno del navegador, no un fallo de la
  // aplicación: se evita que ensucie la consola cuando Astro intenta navegar
  // desde una pestaña oculta.
  if (!window.__pdiTransitionAbortGuard) {
    window.__pdiTransitionAbortGuard = true;
    window.addEventListener("unhandledrejection", (evento) => {
      const mensaje = String(evento.reason?.message || evento.reason || "");
      if (/Transition was aborted because of invalid state/i.test(mensaje)
        && /Document hidden/i.test(mensaje)) {
        evento.preventDefault();
      }
    });
  }

  window.PDI = window.PDI || {};
  window.PDI.Bootstrap = { arrancarComun, publicarRefresco, restaurarDatosLocales, hidratarDesdeSurreal };
  window.PDI.restaurarDatosLocales = restaurarDatosLocales;
  window.PDI.ToastView = ToastView;
  window.PDI.Navigation = Navigation;
  window.PDI.RoleController = RoleController;
  window.PDI.AuditModel = AuditModel;
}
