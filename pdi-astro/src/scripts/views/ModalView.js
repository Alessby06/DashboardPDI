
import { escapar, escaparEnManejador } from "../utils/HtmlHelper.js";;
// Vista: Modales (Registro Nuevo Usuario, Informe Ejecutivo, Detalle de Auditoria)
// El expediente integral ya no esta aqui: es una pagina propia, expediente.html,
// con su vista en ExpedienteView. Se decidio al convertir la SPA en MPA que un
// documento que se imprime, se comparte y se navega por URL no puede vivir
// dentro de una ventana encima de otra pagina.

// Foco que habia antes de abrir la ficha: se devuelve al cerrar, para que
// quien cierra no aparezca al principio de la pagina.
let focoAntesDeFicha = null;
let dialogoFichaListo = false;
// Firma del borrador: el canvas se redibuja al abrir y sin esto se perdia el
// unico dato que no se puede reconstruir de memoria.
let firmaBorrador = null;

/** Hay trabajo sin guardar cuando alguien escribio algo o firmo. */
function hayBorrador(modal) {
  const form = modal.querySelector("#formNuevoUsuario");
  if (!form) return false;
  const escrito = Array.from(
    form.querySelectorAll("input[type='text'], input[type='date'], input[type='tel'], textarea"),
  ).some((el) => el.value.trim());
  if (escrito) return true;
  const helper = window.PDI?.BeneficiarioController?.signatureCanvasHelper;
  return Boolean(helper && helper.hasSignature && helper.hasSignature());
}

const SELECTOR_ENFOCABLES = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function enfocablesDe(contenedor) {
  return Array.from(contenedor.querySelectorAll(SELECTOR_ENFOCABLES)).filter(
    (el) => !el.closest("[hidden]") && el.getClientRects().length > 0,
  );
}

/**
 * La ficha es un dialogo modal de verdad: Escape lo cierra, Tab no se
 * escapa hacia la pagina de atras y el foco vuelve a donde estaba.
 */
function conectarDialogoFicha() {
  if (dialogoFichaListo) return;
  dialogoFichaListo = true;

  document.addEventListener("keydown", (evento) => {
    const modal = document.getElementById("modalNuevoUsuario");
    if (!modal || !modal.classList.contains("open")) return;

    if (evento.key === "Escape") {
      evento.preventDefault();
      ModalView.closeNuevoUsuario({ conservarBorrador: true });
      return;
    }

    if (evento.key !== "Tab") return;
    const caja = modal.querySelector(".modal-box");
    if (!caja) return;

    const lista = enfocablesDe(caja);
    if (!lista.length) return;
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];

    if (evento.shiftKey) {
      if (document.activeElement === primero || document.activeElement === caja) {
        evento.preventDefault();
        ultimo.focus();
      }
    } else if (document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  });
}

export const ModalView = {
  openNuevoUsuario() {
    const modal = document.getElementById("modalNuevoUsuario");
    if (!modal) return;

    conectarDialogoFicha();
    focoAntesDeFicha = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    // Cerrada llevaba inert: hay que quitarlo antes de mostrarla.
    modal.removeAttribute("inert");
    modal.removeAttribute("aria-hidden");
    modal.classList.add("open");

    // El foco entra en el dialogo. Si se queda en el fondo, el lector sigue
    // leyendo la pagina de atras y el teclado tabula por ahi. Se hace en el
    // acto y no en un frame: una pestana en segundo plano no lo pintaria.
    const caja = modal.querySelector(".modal-box");
    if (caja) caja.focus();

    // El borrador conserva los datos, pero la lectura empieza arriba.
    const cuerpo = modal.querySelector(".modal-body");
    if (cuerpo) cuerpo.scrollTop = 0;

    setTimeout(() => {
      const ctrl = window.PDI?.BeneficiarioController || (window.app && window.app.beneficiarioController);
      if (ctrl && ctrl.initSignature) ctrl.initSignature();
      const helper = ctrl && ctrl.signatureCanvasHelper;
      if (firmaBorrador && helper && helper.loadFromDataURL) {
        helper.loadFromDataURL(firmaBorrador, () => {
          window.PDI?.Ficha?.refrescarEstadoFicha?.();
        });
      }
      // El boton de guardar se habilita solo si no falta ningun dato.
      window.PDI?.Ficha?.refrescarEstadoFicha?.();
    }, 100);
  },

  closeNuevoUsuario({ conservarBorrador = false } = {}) {
    const modal = document.getElementById("modalNuevoUsuario");
    if (!modal) return;

    /* Cerrar no guarda, pero tampoco borra: el usuario decide. Si el cierre
       viene de Guardar, no hay borrador que conservar. */
    const helper = window.PDI?.BeneficiarioController?.signatureCanvasHelper;
    const habiaTrabajo = hayBorrador(modal);
    if (conservarBorrador && habiaTrabajo) {
      firmaBorrador = helper && helper.hasSignature && helper.hasSignature()
        ? helper.toDataURL()
        : null;
      window.showToast?.(
        "Borrador guardado",
        "Al reabrir la ficha seguirá como lo dejaste.",
        "info",
      );
    } else {
      // Guardar o cerrar sin trabajo pendiente no deja borrador que restaurar.
      firmaBorrador = null;
    }

    modal.classList.remove("open");

    // El foco sale antes de ocultar el dialogo: si se marca aria-hidden con
    // el foco dentro, Chrome lo bloquea y avisa por consola.
    const dentroDelModal = focoAntesDeFicha && modal.contains(focoAntesDeFicha);
    const destino = focoAntesDeFicha
      && !dentroDelModal
      && focoAntesDeFicha !== document.body
      && document.contains(focoAntesDeFicha)
      ? focoAntesDeFicha
      : document.getElementById("btnNuevoBeneficiario");
    focoAntesDeFicha = null;
    if (destino) destino.focus();

    // El modal cerrado no puede quedar en el orden de tabulacion.
    modal.setAttribute("inert", "");
    modal.setAttribute("aria-hidden", "true");
  },

  openInforme(stats, activeRole) {
    const fecha = new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
    const fechaEl = document.getElementById("informeFecha");
    if (fechaEl) fechaEl.textContent = fecha;

    const opEl = document.getElementById("informeOperador");
    if (opEl) opEl.textContent = `${activeRole.title} (${activeRole.desc.split(' ')[0]})`;

    const totalEl = document.getElementById("infTotalUsuarios");
    if (totalEl) totalEl.textContent = stats.total;

    const normEl = document.getElementById("infNormales");
    if (normEl) normEl.textContent = `${stats.normales} (${stats.pctNormal}%)`;

    const anEl = document.getElementById("infAnemia");
    if (anEl) anEl.textContent = `${stats.leves + stats.moderadas} (${stats.pctLeve + stats.pctMod}%)`;

    const modal = document.getElementById("modalInformeEjecutivo") || document.getElementById("modalInforme");
    if (modal) modal.classList.add("open");
  },

  closeInforme() {
    const modal = document.getElementById("modalInformeEjecutivo") || document.getElementById("modalInforme");
    if (modal) modal.classList.remove("open");
  },

  openAuditDetail(log) {
    if (!log) return;
    const modal = document.getElementById("modalAuditDetail");
    if (!modal) return;

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl("auditDetailId", log.id || "LOG-2026-REG");
    setEl("auditDetailTimestamp", log.timestamp);
    setEl("auditDetailUser", log.user);
    setEl("auditDetailRole", log.role);
    setEl("auditDetailAction", log.action);
    setEl("auditDetailStatus", log.status);
    setEl("auditDetailIp", log.ip || "192.168.1.x (Red Segura)");
    setEl("auditDetailSede", log.sede || "Central");
    setEl("auditDetailDetail", log.detail);

    const entityContainer = document.getElementById("auditDetailEntityLink");
    if (entityContainer) {
      if (log.entity && log.entity.startsWith("PDI-")) {
        entityContainer.innerHTML = `
          <a href="javascript:void(0)" onclick="window.openExpedienteByCodigo('${escaparEnManejador(log.entity)}')" class="audit-entity-link" title="Abrir expediente del usuario">
            <code style="font-family:var(--mono-font); font-size:13px; font-weight:700; color:var(--text-brand); text-decoration:underline;">${escapar(log.entity)}</code>
            <span style="font-size:11px; margin-left:4px; color:var(--text-brand); font-weight:600;">(Ver Expediente &rarr;)</span>
          </a>
        `;
      } else {
        entityContainer.innerHTML = `<code style="font-family:var(--mono-font); font-size:13px; font-weight:700; color:var(--text-main);">${escapar(log.entity || 'N/A')}</code>`;
      }
    }

    // Render diff table
    const diffContainer = document.getElementById("auditDetailDiffContainer");
    if (diffContainer) {
      if (log.diff && log.diff.length > 0) {
        diffContainer.innerHTML = `
          <table class="audit-diff-table">
            <thead>
              <tr>
                <th>Campo Modificado</th>
                <th>Estado Anterior</th>
                <th>Nuevo Valor Asignado</th>
              </tr>
            </thead>
            <tbody>
              ${log.diff.map(d => `
                <tr>
                  <td><strong>${escapar(d.campo)}</strong></td>
                  <td class="diff-prev"><span>${escapar(d.valorAnterior || '-')}</span></td>
                  <td class="diff-curr"><span>${escapar(d.valorNuevo || '-')}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } else {
        diffContainer.innerHTML = `
          <div style="padding:14px; background:var(--surface-2); border-radius:var(--radius-sm); border:1px solid var(--border-subtle); color:var(--text-dim); font-size:12.5px;">
            Este evento registra una operación de consulta o certificación sin alteración de campos individuales.
          </div>
        `;
      }
    }

    modal.classList.add("open");
  },

  closeAuditDetail() {
    const modal = document.getElementById("modalAuditDetail");
    if (modal) modal.classList.remove("open");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ModalView = ModalView;
}
