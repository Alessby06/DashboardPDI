// ===========================================================================
//  REGLAS DE INTEGRIDAD DE LA INTERFAZ
// ===========================================================================
//  Funciones puras para que las vistas no inventen criterios propios.
// ===========================================================================

/** Clave comparable: quita tabla, corchetes angulares y backticks. */
export function claveRegistro(valor) {
  return String(valor ?? '')
    .trim()
    .replace(/^[a-z_]+:/i, '')
    .replace(/[`⟨⟩]/g, '');
}

/** ¿La persona tiene un caso social que aun no se cerro? */
export function tieneCasoAbierto(casos = [], personaId) {
  const clave = claveRegistro(personaId);
  if (!clave) return false;
  return (Array.isArray(casos) ? casos : []).some(c =>
    claveRegistro(c?._personaId || c?.personaId) === clave
    && c?.etapa !== 'cerrado');
}

/**
 * Anota cada caso con `sinExpediente`: la persona del caso no esta en la lista
 * de beneficiarios activos (padron). No filtra: la vista decide como mostrarlo.
 */
export function marcarCasosHuerfanos(casos = [], beneficiarios = []) {
  const lista = Array.isArray(casos) ? casos : [];
  if (!Array.isArray(beneficiarios)) return lista;
  const conExpediente = new Set(
    beneficiarios.map(b => claveRegistro(b?._personaId || b?.personaId || b?.id)),
  );
  return lista.map(caso => ({
    ...caso,
    sinExpediente: !conExpediente.has(claveRegistro(caso?._personaId || caso?.personaId)),
  }));
}

/** Una baja solo es exitosa si el UPDATE devolvio al menos una inscripcion. */
export function bajaTuvoEfecto(filas) {
  return Array.isArray(filas) && filas.length > 0;
}

/**
 * Un retirado con inscripcion puede reactivarse directo. Sin inscripcion, la
 * vista debe pedir sede, programa y modalidad para crearla.
 */
export function puedeReactivar(beneficiario) {
  if (!beneficiario) return { ok: false, faltan: ['beneficiario'] };
  if (beneficiario._inscripcionId) return { ok: true, faltan: [] };
  const faltan = [];
  if (!beneficiario.sede && !beneficiario._sedeRawId) faltan.push('sede');
  if (!beneficiario.programa) faltan.push('programa');
  if (!beneficiario.modalidad) faltan.push('modalidad');
  return { ok: faltan.length === 0, faltan };
}

/**
 * Que hacer cuando el alta encuentra un DNI ya registrado.
 * - ACTIVO: no se puede duplicar.
 * - RETIRADO: ofrecer reactivacion.
 * - SIN_INSCRIPCION: enviar a reparacion de expediente.
 */
export function clasificarDuplicado({ persona, inscripcionActiva } = {}) {
  if (inscripcionActiva) return 'ACTIVO';
  if (persona && persona.activo === false) return 'RETIRADO';
  return 'SIN_INSCRIPCION';
}

/** ¿La cuenta puede ver el panel global de integridad? */
export function puedeVerIntegridad(rol) {
  return rol === 'coord' || rol === 'admin';
}

/**
 * Personas activas con codigo de beneficiario que no tienen inscripcion activa.
 * Es el listado que Ajustes > Integridad muestra para reparar.
 */
export function resumirExpedientesIncompletos(personas = [], inscripciones = []) {
  const activas = new Set(
    (Array.isArray(inscripciones) ? inscripciones : [])
      .filter(i => i?.activo === true)
      .map(i => claveRegistro(i?.persona_id)),
  );
  const filas = (Array.isArray(personas) ? personas : [])
    .filter(p => p?.activo === true && /-IS/i.test(String(p?.codigo || '')))
    .filter(p => !activas.has(claveRegistro(p.id)))
    .map(p => ({
      personaId: String(p.id),
      codigo: p.codigo || '',
      nombres: `${p.nombres || ''} ${p.apellidos || ''}`.trim(),
    }));
  return { total: filas.length, filas };
}
