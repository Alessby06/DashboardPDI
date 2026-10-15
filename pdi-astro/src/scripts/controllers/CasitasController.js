// Controlador: Acompañamiento Educativo (Casita del Saber)
import { ToastView } from '../views/ToastView.js';

// Los cuatro estados del pase de asistencia, en un solo sitio. Antes estaban
// repetidos en el controlador y en la vista, con etiquetas ligeramente
// distintas en cada copia.
export const ESTADOS_ASISTENCIA = {
  "P":  { label: "Presente",            badgeClass: "badge badge-green"  },
  "T":  { label: "Tardanza",            badgeClass: "badge badge-yellow" },
  "FJ": { label: "Falta Justificada",   badgeClass: "badge badge-orange" },
  "FI": { label: "Falta Injustificada", badgeClass: "badge badge-red"    }
};

const CLAVE_ASISTENCIA = "pdi_asistencia_casita";

export const CasitasController = {
  // Estado de asistencia por menor. Antes vivia solo en el DOM: el badge se
  // pintaba siempre "Presente" y el filtro por asistencia no filtraba nada.
  // Persistirlo es lo que hace que el filtro y la exportacion digan la verdad.
  _asistenciaMap: null,

  _cargar() {
    if (this._asistenciaMap) return this._asistenciaMap;
    try {
      const raw = localStorage.getItem(CLAVE_ASISTENCIA);
      this._asistenciaMap = raw ? JSON.parse(raw) : {};
    } catch (e) {
      this._asistenciaMap = {};
    }
    if (!this._asistenciaMap || typeof this._asistenciaMap !== "object") {
      this._asistenciaMap = {};
    }
    return this._asistenciaMap;
  },

  _guardar() {
    try {
      localStorage.setItem(CLAVE_ASISTENCIA, JSON.stringify(this._cargar()));
    } catch (e) {}
  },

  /** Clave del estado guardado para un menor ('P' por defecto). */
  getEstado(id) {
    const map = this._cargar();
    const valor = map[id] !== undefined ? map[id] : map[String(id)];
    return ESTADOS_ASISTENCIA[valor] ? valor : "P";
  },

  /** Clave, etiqueta y clase del badge que le corresponden a un menor. */
  getEstadoInfo(id) {
    const clave = this.getEstado(id);
    return { clave, ...ESTADOS_ASISTENCIA[clave] };
  },

  toggleAsistencia(id, estado) {
    const clave = ESTADOS_ASISTENCIA[estado] ? estado : "P";
    const target = ESTADOS_ASISTENCIA[clave];

    // 0. Persistir el estado, que es la fuente de verdad del filtro y del CSV.
    const map = this._cargar();
    map[id] = clave;
    this._guardar();

    const activeClass = `active-${clave}`;

    // 1. Sincronizar badge de Escritorio (PC)
    const badgeDesk = document.getElementById(`badgeAsist_${id}`);
    if (badgeDesk) {
      badgeDesk.textContent = target.label;
      badgeDesk.className = target.badgeClass;
    }

    // 2. Sincronizar badge de Móvil
    const badgeMob = document.getElementById(`badgeAsistMob_${id}`);
    if (badgeMob) {
      badgeMob.textContent = target.label;
      badgeMob.className = target.badgeClass;
    }

    // 3. Sincronizar botones activos en Escritorio
    const btnGroupDesk = document.getElementById(`btnGroupAsist_${id}`);
    if (btnGroupDesk) {
      btnGroupDesk.querySelectorAll("button").forEach(btn => {
        btn.className = "btn-asist";
        if (btn.getAttribute("data-asist-btn") === clave) {
          btn.classList.add(activeClass);
        }
      });
    }

    // 4. Sincronizar botones activos en Móvil
    const btnGroupMob = document.getElementById(`btnGroupMobAsist_${id}`);
    if (btnGroupMob) {
      btnGroupMob.querySelectorAll("button").forEach(btn => {
        btn.className = "btn-asist";
        if (btn.getAttribute("data-asist-btn") === clave) {
          btn.classList.add(activeClass);
        }
      });
    }

    const toast = window.PDI?.ToastView || ToastView;
    if (toast && toast.show) {
      toast.show("Asistencia Actualizada", `${target.label} registrado para el menor ID ${id}`, "info");
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasController = CasitasController;
}
