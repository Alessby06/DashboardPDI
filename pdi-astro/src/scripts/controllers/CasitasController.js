// Controlador: Acompañamiento Educativo (Casita del Saber)
import { ToastView } from '../views/ToastView.js';
import { registrarAsistencia } from '../core/db.js';

// Los cuatro estados del pase de asistencia, en un solo sitio. Antes estaban
// repetidos en el controlador y en la vista, con etiquetas ligeramente
// distintas en cada copia.
export const ESTADOS_ASISTENCIA = {
  "P":  { label: "Presente",            badgeClass: "badge badge-green"  },
  "T":  { label: "Tardanza",            badgeClass: "badge badge-yellow" },
  "FJ": { label: "Falta Justificada",   badgeClass: "badge badge-orange" },
  "FI": { label: "Falta Injustificada", badgeClass: "badge badge-red"    }
};

export const CasitasController = {
  // Estado de asistencia POR DIA en la nube (tabla asistencia_diaria). La capa
  // de datos lo hidrata al conectar y con cada cambio LIVE. Aqui solo queda el
  // estado en memoria para el filtro, los badges y el CSV de la pagina.
  _asistenciaMap: {},

  /** El dataset llega de la nube: { [beneficiarioId]: 'P'|'T'|'FJ'|'FI' } */
  aplicarDatosAsistencia(mapa) {
    this._asistenciaMap = (mapa && typeof mapa === "object") ? mapa : {};
  },

  _cargar() {
    return this._asistenciaMap || {};
  },

  /** Clave del estado guardado para un usuario ('P' por defecto). */
  getEstado(id) {
    const map = this._cargar();
    const valor = map[id] !== undefined ? map[id] : map[String(id)];
    return ESTADOS_ASISTENCIA[valor] ? valor : "P";
  },

  /** Clave, etiqueta y clase del badge que le corresponden a un usuario. */
  getEstadoInfo(id) {
    const clave = this.getEstado(id);
    return { clave, ...ESTADOS_ASISTENCIA[clave] };
  },

  toggleAsistencia(id, estado) {
    const clave = ESTADOS_ASISTENCIA[estado] ? estado : "P";
    const target = ESTADOS_ASISTENCIA[clave];

    const anterior = this._asistenciaMap[id] !== undefined
      ? this._asistenciaMap[id]
      : this._asistenciaMap[String(id)];
    const huboValor = this._asistenciaMap[id] !== undefined || this._asistenciaMap[String(id)] !== undefined;

    // 0. Estado en memoria: fuente del filtro y del CSV.
    this._asistenciaMap[id] = clave;
    this._refrescarDom(id, clave, target);

    // 1. La nube es la verdad: el registro se escribe en asistencia_diaria.
    const beneficiario = window.PDI?.BeneficiarioModel?.getById?.(id);
    registrarAsistencia(beneficiario, clave).then(ok => {
      if (!ok) {
        // Rollback inmediato: el estado que la nube no acepto no vive aqui.
        if (huboValor) this._asistenciaMap[id] = anterior;
        else delete this._asistenciaMap[id];
        this._refrescarDom(id, anterior, ESTADOS_ASISTENCIA[anterior] ? ESTADOS_ASISTENCIA[anterior] : ESTADOS_ASISTENCIA["P"]);
        const toast = window.PDI?.ToastView || ToastView;
        toast?.show?.("Asistencia no guardada", "La base de datos rechazó el registro. Revisa tu conexión.", "danger");
      }
    });

    const toast = window.PDI?.ToastView || ToastView;
    if (toast && toast.show) {
      toast.show("Asistencia Actualizada", `${target.label} registrado para el usuario ID ${id}`, "info");
    }
  },

  /** Pinta badges y botones del pase (escritorio y móvil) para un usuario. */
  _refrescarDom(id, clave, info) {
    // Enrollback puede llegar con clave undefined ('P' implícito).
    const finalInfo = info || ESTADOS_ASISTENCIA["P"];
    const finalClave = ESTADOS_ASISTENCIA[clave] ? clave : "P";
    const activeClass = `active-${finalClave}`;

    const badgeDesk = document.getElementById(`badgeAsist_${id}`);
    if (badgeDesk) {
      badgeDesk.textContent = finalInfo.label;
      badgeDesk.className = finalInfo.badgeClass;
    }

    const badgeMob = document.getElementById(`badgeAsistMob_${id}`);
    if (badgeMob) {
      badgeMob.textContent = finalInfo.label;
      badgeMob.className = finalInfo.badgeClass;
    }

    const btnGroupDesk = document.getElementById(`btnGroupAsist_${id}`);
    if (btnGroupDesk) {
      btnGroupDesk.querySelectorAll("button").forEach(btn => {
        btn.className = "btn-asist";
        if (btn.getAttribute("data-asist-btn") === finalClave) {
          btn.classList.add(activeClass);
        }
      });
    }

    const btnGroupMob = document.getElementById(`btnGroupMobAsist_${id}`);
    if (btnGroupMob) {
      btnGroupMob.querySelectorAll("button").forEach(btn => {
        btn.className = "btn-asist";
        if (btn.getAttribute("data-asist-btn") === finalClave) {
          btn.classList.add(activeClass);
        }
      });
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasController = CasitasController;
}
