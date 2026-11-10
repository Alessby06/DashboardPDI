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
import {
  iniciarCapaDatos, refrescarDesdeNube, hidratarDesdeSurreal, aplicarSnapshotInicial,
} from "./db.js";
import { iniciarEstadoCarga } from "./LoadingState.js";

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

  // Badges del menu lateral: se calculan de los modelos, nunca de numeros
  // escritos a mano en el HTML.
  actualizarBadgesSidebar();

  // Encender la capa de datos (conexion, hidratacion, LIVE y reintentos).
  // No es await: el controlador de carga retira el esqueleto cuando la capa
  // avisa que la primera hidratacion termino.
  iniciarEstadoCarga();
  iniciarCapaDatos();

  return slug;
}

/**
 * Ultimo valor canonico de cada badge. Se compara contra este mapa y no
 * contra el texto del DOM: al navegar, el marcado puede reaparecer con su
 * valor de servidor y no queremos que eso cuente como un cambio real.
 */
const ultimosBadges = new Map();

/** Últimos conteos conocidos de los badges, para pintarlos sin parpadeo. */
const CLAVE_BADGES = "pdi_badges_sidebar";
const IDS_BADGES = [
  "badgeTotalBeneficiarios",
  "badgeTotalVoluntarios",
  "badgeCasosCriticos",
  "badgeSolicitudesPendientes",
  "badgeMisSolicitudesTotal",
];

/**
 * Guarda los conteos para que el script en línea del sidebar los pinte en la
 * primera pintura, antes de que arranque la hidratación. Sin esto, al navegar
 * el marcado nuevo llega con los badges vacíos y las pastillas aparecen un
 * instante después de que la página ya se ve.
 *
 * No se guarda mientras los modelos aún están vacíos: en una recarga dura eso
 * sustituiría los conteos buenos por ceros.
 */
function guardarBadgesEnCache() {
  try {
    const datos = {};
    for (const id of IDS_BADGES) {
      const el = document.getElementById(id);
      if (!el) continue;
      const num = el.querySelector(".nav-badge-num");
      datos[id] = Number((num ? num.textContent : el.textContent) || 0);
    }
    const listo = window.PDI?.__pdiDatosListos
      || Number(datos.badgeTotalBeneficiarios) > 0
      || Number(datos.badgeTotalVoluntarios) > 0;
    if (listo) localStorage.setItem(CLAVE_BADGES, JSON.stringify(datos));
  } catch (e) { /* sin almacenamiento disponible: se pinta al hidratar */ }
}

/**
 * Escribe en los badges del sidebar los conteos reales de los modelos.
 * Llamar tambien tras cualquier alta/baja/cambio de etapa que altere un total.
 */
export function actualizarBadgesSidebar() {
  const set = (id, valor) => {
    const el = document.getElementById(id);
    if (!el) return;
    const texto = String(valor);
    const anterior = ultimosBadges.get(id);
    ultimosBadges.set(id, texto);

    // El numero vive en su propio span: asi la animacion no mueve la pastilla.
    let num = el.querySelector(".nav-badge-num");
    if (!num) {
      num = document.createElement("span");
      num.className = "nav-badge-num";
      num.textContent = (el.textContent || "").trim();
      el.textContent = "";
      el.appendChild(num);
    }

    if (num.textContent === texto) return;
    num.textContent = texto;

    // Solo celebra un cambio real de cifra. El primer pintado (sin anterior) y
    // el paso por 0 de la hidratacion no cuentan: ahi el badge se limita a
    // aparecer con su valor.
    if (anterior === undefined || anterior === "0" || texto === "0") return;

    const sube = Number(texto) > Number(anterior);
    num.classList.remove("contador-pulso", "is-up", "is-down");
    void num.offsetWidth;
    num.classList.add("contador-pulso", sube ? "is-up" : "is-down");
    window.clearTimeout(el._pulsoTimer);
    el._pulsoTimer = window.setTimeout(() => {
      num.classList.remove("contador-pulso", "is-up", "is-down");
    }, 260);
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

  try {
    const pendCount = CasoSocialModel.contarSolicitudesPendientes ? CasoSocialModel.contarSolicitudesPendientes() : 0;
    set("badgeSolicitudesPendientes", pendCount);
    const pendBadgeEl = document.getElementById("badgeSolicitudesPendientes");
    if (pendBadgeEl) {
      pendBadgeEl.style.display = pendCount > 0 ? "inline-flex" : "none";
    }

    // #region DEBUG
    const totalSol = CasoSocialModel.contarTodasLasSolicitudes ? CasoSocialModel.contarTodasLasSolicitudes() : 0;
    set("badgeMisSolicitudesTotal", totalSol);
    const misSolBadgeEl = document.getElementById("badgeMisSolicitudesTotal");
    if (misSolBadgeEl) {
      misSolBadgeEl.style.display = totalSol > 0 ? "inline-flex" : "none";
    }
  } catch (e) {}

  guardarBadgesEnCache();
}

/**
 * Ya no se "restauran datos locales": la unica fuente es la nube. El boton de
 * Ajustes re-descarga todos los datasets desde SurrealDB (cache fresca).
 */
export function restaurarDatosLocales() {
  refrescarDesdeNube();
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
  window.PDI.Bootstrap = { arrancarComun, publicarRefresco, restaurarDatosLocales, actualizarBadgesSidebar, hidratarDesdeSurreal };
  window.PDI.restaurarDatosLocales = restaurarDatosLocales;
  window.PDI.ToastView = ToastView;
  window.PDI.Navigation = Navigation;
  window.PDI.RoleController = RoleController;
  window.PDI.AuditModel = AuditModel;
}
