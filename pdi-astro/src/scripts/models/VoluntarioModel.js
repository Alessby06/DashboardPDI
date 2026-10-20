// Modelo: Padrón y Gestión Operativa de Voluntariados y Personal Comunitario (PDI)
// Asociación Cultural Johannes Gutenberg - Lima Norte
// La fuente única de verdad es la instancia de SurrealDB Cloud (tabla voluntario,
// creada para este módulo). No hay fixtures ni localStorage.

import {
  crearVoluntario, actualizarVoluntario, darBajaVoluntario,
  addCapacitacionVoluntario, incrementarCanastaVoluntario,
} from '../core/db.js';

export const TEMATICAS_CAPACITACION = [
  "Higiene y manipulación de alimentos",
  "Malnutrición infantil y rendimiento escolar",
  "Prevención de Anemia en la 1ra infancia (6-36 meses)",
  "Anemia en la 2da infancia (3-12 años)",
  "Grupos de alimentos y refrigerios saludables",
  "Platos y refrigerios saludables",
  "Bienestar emocional y hábitos saludables",
  "Mediación lectora y cuenta cuentos",
  "Promoción de Derechos en las Infancias",
  "Buen Trato en Familia (BTF)",
  "Detección y derivación de casos de violencia y vulnerabilidad",
  "Acciones ecológicas comunitarias"
];

export const VoluntarioModel = {
  _data: null,

  init() {
    if (!this._data) this._data = [];
  },

  /** La capa de datos entrega el padrón hidratado de la nube. */
  aplicarDatos(lista) {
    if (!Array.isArray(lista)) return;
    this._data = lista;
  },

  getAll() {
    if (!this._data) this.init();
    return [...this._data];
  },

  getById(id) {
    if (!this._data) this.init();
    return this._data.find(v => String(v.id) === String(id)) || null;
  },

  getByDni(dni) {
    if (!this._data) this.init();
    return this._data.find(v => String(v.dni) === String(dni)) || null;
  },

  create(voluntarioData) {
    if (!this._data) this.init();
    const maxId = this._data.reduce((max, v) => Math.max(max, Number(v.id) || 0), 0);
    const nextId = maxId + 1;
    const padded = String(nextId).padStart(3, '0');
    const year = new Date().getFullYear();

    const newVoluntario = {
      id: nextId,
      codigo: `VOL-${year}-${padded}`,
      nombres: (voluntarioData.nombres || "").trim(),
      apellidos: (voluntarioData.apellidos || "").trim(),
      dni: (voluntarioData.dni || "").trim(),
      celular: (voluntarioData.celular || "").trim(),
      fechaNacimiento: voluntarioData.fechaNacimiento || "",
      edad: voluntarioData.edad ? Number(voluntarioData.edad) : this._calculateAge(voluntarioData.fechaNacimiento),
      domicilio: (voluntarioData.domicilio || "").trim(),
      distrito: voluntarioData.distrito || "Comas",
      sedeAsignada: voluntarioData.sedeAsignada || "",
      servicio: voluntarioData.servicio || "Desayuno Infantil",
      rol: voluntarioData.rol || "Voluntaria de Apoyo",
      estrategia: voluntarioData.estrategia || "Atención Fija",
      tipoVoluntariado: voluntarioData.tipoVoluntariado || "Distribución y Cocina",
      capacitaciones: Array.isArray(voluntarioData.capacitaciones) ? voluntarioData.capacitaciones : [],
      canastasRecibidas: Number(voluntarioData.canastasRecibidas) || 0,
      fechaIngreso: voluntarioData.fechaIngreso || new Date().toISOString().split('T')[0],
      estado: voluntarioData.estado || "Activo",
      disponibilidad: (voluntarioData.disponibilidad || "Disponibilidad estándar").trim(),
      observaciones: (voluntarioData.observaciones || "").trim()
    };

    this._data.unshift(newVoluntario);
    // La nube confirma; si el DNI está duplicado la voluntaria se retira.
    crearVoluntario(newVoluntario).then(ok => {
      if (!ok) {
        const idx = this._data.indexOf(newVoluntario);
        if (idx !== -1) this._data.splice(idx, 1);
      } else if (ok?.qid) {
        newVoluntario._qid = ok.qid;
      }
    });
    return newVoluntario;
  },

  update(id, updatedData) {
    if (!this._data) this.init();
    const original = this._data.find(v => String(v.id) === String(id));
    const index = this._data.findIndex(v => String(v.id) === String(id));
    if (index === -1) return null;

    if (updatedData.fechaNacimiento && !updatedData.edad) {
      updatedData.edad = this._calculateAge(updatedData.fechaNacimiento);
    }

    const actualizado = {
      ...this._data[index],
      ...updatedData
    };
    this._data[index] = actualizado;
    actualizarVoluntario(actualizado);
    return actualizado;
  },

  /**
   * Baja del padrón de voluntariados. La Ley 29733 prohibe el borrado físico:
   * en memoria se retira de la vista y en la nube pasa a Inactivo.
   */
  delete(id) {
    if (!this._data) this.init();
    const index = this._data.findIndex(v => String(v.id) === String(id));
    if (index === -1) return false;
    const vol = this._data[index];
    this._data.splice(index, 1);
    darBajaVoluntario(vol);
    return true;
  },

  addCapacitacion(id, tematica) {
    const vol = this.getById(id);
    if (!vol) return null;
    if (!vol.capacitaciones) vol.capacitaciones = [];
    if (!vol.capacitaciones.includes(tematica)) {
      vol.capacitaciones.push(tematica);
      // La nube agrega el taller sin duplicarlo en la lista del registro.
      addCapacitacionVoluntario(vol, tematica);
    }
    return vol;
  },

  incrementCanasta(id) {
    const vol = this.getById(id);
    if (!vol) return null;
    vol.canastasRecibidas = (Number(vol.canastasRecibidas) || 0) + 1;
    incrementarCanastaVoluntario(vol);
    return vol;
  },

  getStats() {
    const list = this.getAll();
    const total = list.length;
    const activos = list.filter(v => v.estado === "Activo").length;
    const enPausa = list.filter(v => v.estado === "En Pausa").length;
    const comas = list.filter(v => v.distrito === "Comas").length;
    const carabayllo = list.filter(v => v.distrito === "Carabayllo").length;
    const desayuno = list.filter(v => v.servicio === "Desayuno Infantil" || v.servicio === "Lonchera Infantil").length;
    const casita = list.filter(v => v.servicio === "Casita del Saber").length;
    const pastoral = list.filter(v => v.servicio === "Área Social Pastoral (ASP)").length;
    const canastasTotal = list.reduce((sum, v) => sum + (Number(v.canastasRecibidas) || 0), 0);

    return {
      total,
      activos,
      enPausa,
      comas,
      carabayllo,
      desayuno,
      casita,
      pastoral,
      canastasTotal
    };
  },

  _calculateAge(birthdayStr) {
    if (!birthdayStr) return 0;
    const dob = new Date(birthdayStr);
    if (isNaN(dob.getTime())) return 0;
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.VoluntarioModel = VoluntarioModel;
}
