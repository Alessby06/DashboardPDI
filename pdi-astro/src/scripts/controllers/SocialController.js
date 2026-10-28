// Controlador: Tablero Kanban y Evaluación de Vulnerabilidad ASP
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { BeneficiarioModel } from '../models/BeneficiarioModel.js';
import { AuditModel } from '../models/AuditModel.js';
import { VulnerabilityCalculator } from '../utils/VulnerabilityCalculator.js';
import { SocialKanbanView } from '../views/SocialKanbanView.js';
import { ToastView } from '../views/ToastView.js';

export const SocialController = {
  /**
   * Dispara el flujo de cambio de estado.
   * Si el rol es Coordinación General o Administrador TI, el cambio se ejecuta DE MANERA INMEDIATA
   * sin requerir solicitud de autorización. Si es otro rol (Trabajadora Social, etc.), se abre
   * el modal de solicitud de cambio de fase con justificación.
   */
  moverCaso(id, nuevaEtapa) {
    const activeRole = localStorage.getItem("pdi_active_role") || "coord";
    const esCoordinacionOAdmin = activeRole === "coord" || activeRole === "admin";

    if (esCoordinacionOAdmin) {
      this.moverCasoInmediato(id, nuevaEtapa);
      return;
    }

    const view = window.PDI?.SocialKanbanView || SocialKanbanView;
    if (view && typeof view.abrirModalSolicitarCambio === 'function') {
      view.abrirModalSolicitarCambio(id, nuevaEtapa);
    } else {
      this.solicitarCambio(id, nuevaEtapa, "Cambio de etapa solicitado desde el tablero Kanban");
    }
  },

  /**
   * Ejecuta el cambio de fase inmediato por parte de Coordinación General / Dirección.
   * La vista se mueve de forma optimista, pero el exito solo se anuncia cuando
   * SurrealDB confirma. Si la nube rechaza, la tarjeta vuelve a su fase.
   */
  async moverCasoInmediato(id, nuevaEtapa) {
    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const activeRole = localStorage.getItem("pdi_active_role") || "coord";
    const userName = localStorage.getItem("pdi_usuario_nombre") || "Coordinación General";
    const cargo = (activeRole === "admin") ? "Administrador de Sistemas TI" : "Dirección y Coordinación General";

    const previa = model.getAll().find(c => String(c.id) === String(id))?.etapa;
    const caso = model.updateStage(id, nuevaEtapa);
    if (!caso) return;

    const view = window.PDI?.SocialKanbanView || SocialKanbanView;
    // Optimista: la tarjeta viaja ya. La hidratacion no pisara este cambio
    // mientras la escritura siga en vuelo (ver guard en db.js).
    view?.renderKanban(model.getAll());

    const guardado = caso._guardadoPendiente ? await caso._guardadoPendiente : true;
    delete caso._guardadoPendiente;

    if (guardado === false) {
      // La nube rechazo la escritura (db.js ya aviso el motivo): se deshace
      // el movimiento local para no mentir en el tablero.
      if (previa) caso.etapa = previa;
      view?.renderKanban(model.getAll());
      return;
    }

    // Si había una solicitud pendiente para este caso, se cierra/resuelve como aprobada directamente
    if (caso.solicitudCambio && caso.solicitudCambio.estado === "pendiente") {
      model.resolverSolicitudCambio(id, "aprobada", "Aprobado directamente por Coordinación General", {
        nombre: userName,
        cargo: cargo
      });
    }

    const audit = window.PDI?.AuditModel || AuditModel;
    if (audit) {
      audit.log(
        userName,
        cargo,
        "Transición Directa Kanban",
        caso.codigo,
        `Coordinación trasladó inmediatamente a ${caso.usuario} a la etapa: ${nuevaEtapa.toUpperCase()}`,
        "Válido"
      );
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast) {
      toast.show(
        "Fase Actualizada",
        `Caso ${caso.codigo} ahora en etapa: ${nuevaEtapa.toUpperCase()} (Autorización Directa)`,
        "success"
      );
    }

    view?.renderKanban(model.getAll());
    window.PDI?.Bootstrap?.actualizarBadgesSidebar?.();
  },

  /**
   * Registra la solicitud de cambio de estado enviada a Coordinación y notifica al usuario.
   */
  async solicitarCambio(id, nuevaEtapa, motivo = "") {
    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const activeRole = localStorage.getItem("pdi_active_role") || "social";
    const userName = localStorage.getItem("pdi_usuario_nombre") || "Lic. Ruth Soto";
    const cargo = (activeRole === "coord" || activeRole === "admin") ? "Coordinación General PDI" : "Trabajadora Social ASP";

    const caso = model.solicitarCambioEtapa(id, nuevaEtapa, motivo, {
      nombre: userName,
      cargo: cargo
    });
    if (!caso) return;

    const view = window.PDI?.SocialKanbanView || SocialKanbanView;
    view?.renderKanban(model.getAll());

    const guardada = caso._solicitudPendiente ? await caso._solicitudPendiente : true;
    delete caso._solicitudPendiente;

    if (guardada === false) {
      // La nube no registro la solicitud: se retira de la vista para que no
      // quede un "en proceso" que Coordinacion jamas podra resolver.
      delete caso.solicitudCambio;
      if (Array.isArray(caso.historialSolicitudes)) caso.historialSolicitudes.shift();
      view?.renderKanban(model.getAll());
      view?.actualizarBadgesPestañas?.();
      return;
    }

    const audit = window.PDI?.AuditModel || AuditModel;
    if (audit) {
      audit.log(
        userName,
        cargo,
        "Solicitud de Transición Kanban",
        caso.codigo,
        `Solicitud de pase de etapa (${caso.etapa.toUpperCase()} → ${nuevaEtapa.toUpperCase()}) enviada a Coordinación para ${caso.usuario}. Motivo: ${motivo || 'Sin justificación adicional'}`,
        "Pendiente"
      );
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast) {
      toast.show(
        "Solicitud Enviada a Coordinación",
        `Caso ${caso.codigo}: cambio a etapa "${nuevaEtapa.toUpperCase()}" en proceso de autorización.`,
        "info"
      );
    }

    if (view) {
      view.renderKanban(model.getAll());
      view.renderVistaAutorizaciones?.();
      view.renderVistaMisSolicitudes?.();
      view.actualizarBadgesPestañas?.();
    }
    window.PDI?.Bootstrap?.actualizarBadgesSidebar?.();
  },

  /**
   * Resuelve una solicitud de cambio: Aprobada o Rechazada por Coordinación.
   */
  resolverSolicitud(id, decision, comentario = "") {
    const model = window.PDI?.CasoSocialModel || CasoSocialModel;
    const activeRole = localStorage.getItem("pdi_active_role") || "coord";
    const userName = localStorage.getItem("pdi_usuario_nombre") || "Coordinación General";
    const cargo = (activeRole === "admin") ? "Administrador de Sistemas TI" : "Dirección y Coordinación General";

    const resultado = model.resolverSolicitudCambio(id, decision, comentario, {
      nombre: userName,
      cargo: cargo
    });
    if (!resultado) return;

    const { caso, solicitud, aprobada } = resultado;
    const audit = window.PDI?.AuditModel || AuditModel;
    const auditStatus = aprobada ? "Válido" : "Observado";
    const accionTitulo = aprobada ? "Autorización de Transición Kanban" : "Rechazo de Transición Kanban";

    if (audit) {
      audit.log(
        userName,
        cargo,
        accionTitulo,
        caso.codigo,
        aprobada
          ? `Coordinación APROBÓ cambio a ${solicitud.etapaDestino.toUpperCase()} para ${caso.usuario}. Observación: ${comentario || 'Aprobado sin observaciones'}`
          : `Coordinación RECHAZÓ cambio a ${solicitud.etapaDestino.toUpperCase()} para ${caso.usuario}. Se mantiene en ${caso.etapa.toUpperCase()}. Motivo: ${comentario || 'Falta documentación de sustento'}`,
        auditStatus
      );
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast) {
      if (aprobada) {
        toast.show(
          "Solicitud Aprobada",
          `Caso ${caso.codigo} ahora en etapa: ${caso.etapa.toUpperCase()}`,
          "success"
        );
      } else {
        toast.show(
          "Solicitud Rechazada",
          `Caso ${caso.codigo} se mantiene en: ${caso.etapa.toUpperCase()}`,
          "warning"
        );
      }
    }

    const view = window.PDI?.SocialKanbanView || SocialKanbanView;
    if (view) {
      view.renderKanban(model.getAll());
      view.renderVistaAutorizaciones?.();
      view.renderVistaMisSolicitudes?.();
      view.actualizarBadgesPestañas?.();
    }

    // Actualizar badges si cambió estado crítico
    window.PDI?.Bootstrap?.actualizarBadgesSidebar?.();
  },

  syncScore(dimKey, value) {
    const num = Number(value) || 0;
    const slider = document.getElementById(`slider${dimKey}`);
    const input = document.getElementById(`score${dimKey}`);
    const label = document.getElementById(`lblScore${dimKey}`);

    if (slider && slider.value != num) slider.value = num;
    if (input && input.value != num) input.value = num;
    if (label) label.textContent = `${num} pts`;

    // Reactividad en vivo: calcular y actualizar el resultado inmediatamente sin toast intrusivo
    this.calcularEvaluacion(false);
  },

  cargarCasoEnSimulador(codigo) {
    if (!codigo || codigo === "custom") return;
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const usuario = bModel.getByCodigo(codigo);
    if (!usuario) return;

    const vScore = usuario.vulnerabilidad || 75;
    
    // Distribuir proporcionalmente el puntaje oficial de vulnerabilidad entre las 6 dimensiones
    const factor = vScore / 100;
    const ing = Math.round(28 * factor);
    const viv = Math.round(20 * factor);
    const emp = Math.round(16 * factor);
    const sop = Math.round(19 * factor);
    const ins = Math.round(10 * factor);
    const sal = Math.round(7 * factor);

    this.syncScore("Ingreso", ing);
    this.syncScore("Vivienda", viv);
    this.syncScore("Empleo", emp);
    this.syncScore("Soporte", sop);
    this.syncScore("Instruccion", ins);
    this.syncScore("SaludFam", sal);

    // Calcular resultado en vivo para el perfil cargado
    this.calcularEvaluacion(false);

    const toast = window.PDI?.ToastView || ToastView;
    if (toast) {
      toast.show("Perfil Cargado", `Datos de ${usuario.nombres} ${usuario.apellidos} sincronizados en el simulador (${vScore}/100 pts).`, "info");
    }
  },

  calcularEvaluacion(showToast = true) {
    const getVal = (id, fallback) => {
      const el = document.getElementById(id);
      return el ? (Number(el.value) || 0) : fallback;
    };

    const factors = {
      ing: getVal("scoreIngreso", 24),
      viv: getVal("scoreVivienda", 18),
      emp: getVal("scoreEmpleo", 14),
      sop: getVal("scoreSoporte", 16),
      ins: getVal("scoreInstruccion", 8),
      sal: getVal("scoreSaludFam", 6)
    };

    const calc = window.PDI?.VulnerabilityCalculator || VulnerabilityCalculator;
    const res = calc.calculate(factors);

    // Renderizar resultados en la interfaz
    const scoreValEl = document.getElementById("socioTotalScoreVal");
    const scoreBarEl = document.getElementById("socioTotalScoreBar");
    const categoryBadgeEl = document.getElementById("socioCategoryBadge");
    const exoneracionEl = document.getElementById("socioExoneracionText");
    const listaRecomEl = document.getElementById("listaRecomendacionesSocio");
    const resultBox = document.getElementById("containerResultadoSocioeconomico");

    if (scoreValEl) scoreValEl.textContent = `${res.total} / 100`;
    if (scoreBarEl) {
      scoreBarEl.style.width = `${res.total}%`;
      scoreBarEl.style.backgroundColor = res.color;
    }
    if (categoryBadgeEl) {
      categoryBadgeEl.textContent = res.category;
      categoryBadgeEl.className = `badge ${res.badgeClass}`;
    }
    if (exoneracionEl) {
      exoneracionEl.textContent = res.exoneracion;
      exoneracionEl.style.color = res.color;
    }

    if (listaRecomEl) {
      listaRecomEl.innerHTML = res.recomendaciones.map(r => `
        <li class="socio-recommendation-item">
          <div class="socio-rec-icon">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span>${r}</span>
        </li>
      `).join("");
    }

    if (resultBox) {
      resultBox.style.display = "block";
    }

    if (showToast) {
      const toast = window.PDI?.ToastView || ToastView;
      if (toast && typeof toast.show === "function") {
        toast.show("Evaluación Calculada", `Índice de Vulnerabilidad: ${res.total}/100 (${res.category})`, "success");
      }
    }
  },

  handleVulnerabilidadChange(showToast = false) {
    this.calcularEvaluacion(showToast);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SocialController = SocialController;
}
