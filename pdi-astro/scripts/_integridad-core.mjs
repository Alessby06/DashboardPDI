// ===========================================================================
//  AUDITORIA DE INTEGRIDAD (PURA, SIN BASE DE DATOS)
// ===========================================================================
//  Recibe colecciones ya normalizadas y devuelve violaciones (bloqueantes) y
//  advertencias (historicas, no bloqueantes). No conoce SurrealDB ni la UI.
// ===========================================================================

/** Clave comparable: quita tabla, corchetes angulares y backticks. */
export function claveRegistro(valor) {
  return String(valor ?? '')
    .trim()
    .replace(/^[a-z_]+:/i, '')
    .replace(/[`⟨⟩]/g, '');
}

function esBeneficiario(persona) {
  return /-IS/i.test(String(persona?.codigo || ''));
}

function activo(registro) {
  return registro?.activo === true;
}

function ordenar(lista) {
  return lista.sort((a, b) => `${a.codigo}|${a.id}`.localeCompare(`${b.codigo}|${b.id}`));
}

/**
 * @param {{
 *   personas: Array<{id:string, activo:boolean, codigo:string}>,
 *   inscripciones: Array<{id:string, persona_id:string, activo:boolean}>,
 *   casos: Array<{id:string, persona_id:string, activo:boolean}>,
 *   tamizajes: Array<{id:string, persona_id:string, inscripcion_id:string, activo:boolean}>,
 *   aportes: Array<{id:string, inscripcion_id:string}>,
 *   asistencias: Array<{id:string, inscripcion_id:string}>,
 *   evaluaciones: Array<{id:string, persona_id:string, activo:boolean}>,
 * }} datos
 */
export function auditar(datos = {}) {
  const personas = Array.isArray(datos.personas) ? datos.personas : [];
  const inscripciones = Array.isArray(datos.inscripciones) ? datos.inscripciones : [];
  const casos = Array.isArray(datos.casos) ? datos.casos : [];
  const tamizajes = Array.isArray(datos.tamizajes) ? datos.tamizajes : [];
  const aportes = Array.isArray(datos.aportes) ? datos.aportes : [];
  const asistencias = Array.isArray(datos.asistencias) ? datos.asistencias : [];
  const evaluaciones = Array.isArray(datos.evaluaciones) ? datos.evaluaciones : [];

  const violaciones = [];
  const advertencias = [];

  const personasPorId = new Map(personas.map(p => [claveRegistro(p.id), p]));
  const inscripcionesPorId = new Map(inscripciones.map(i => [claveRegistro(i.id), i]));
  const activasPorPersona = new Map();
  for (const ins of inscripciones) {
    if (!activo(ins)) continue;
    const pid = claveRegistro(ins.persona_id);
    if (!activasPorPersona.has(pid)) activasPorPersona.set(pid, []);
    activasPorPersona.get(pid).push(ins);
  }

  for (const persona of personas) {
    if (!activo(persona) || !esBeneficiario(persona)) continue;
    const pid = claveRegistro(persona.id);
    if (!activasPorPersona.has(pid)) {
      violaciones.push({
        codigo: 'PERSONA_SIN_INSCRIPCION',
        entidad: 'persona',
        id: String(persona.id),
        detalle: `${persona.codigo || pid} esta activa y no tiene inscripcion activa.`,
      });
    }
  }

  for (const persona of personas) {
    if (activo(persona) || !esBeneficiario(persona)) continue;
    const pid = claveRegistro(persona.id);
    const tieneAlguna = inscripciones.some(i => claveRegistro(i.persona_id) === pid);
    if (!tieneAlguna) {
      advertencias.push({
        codigo: 'RETIRADO_SIN_INSCRIPCION',
        entidad: 'persona',
        id: String(persona.id),
        detalle: `${persona.codigo || pid} esta inactiva y no conserva inscripcion historica.`,
      });
    }
  }

  for (const [pid, lista] of activasPorPersona) {
    if (lista.length > 1) {
      violaciones.push({
        codigo: 'INSCRIPCION_DUPLICADA_ACTIVA',
        entidad: 'inscripcion',
        id: lista.map(i => String(i.id)).join(', '),
        detalle: `La persona ${pid} tiene ${lista.length} inscripciones activas.`,
      });
    }
  }

  for (const caso of casos) {
    if (!activo(caso)) continue;
    const pid = claveRegistro(caso.persona_id);
    if (!personasPorId.has(pid)) {
      violaciones.push({
        codigo: 'CASO_SIN_PERSONA',
        entidad: 'caso_social',
        id: String(caso.id),
        detalle: `El caso apunta a una persona inexistente (${caso.persona_id || 'NONE'}).`,
      });
      continue;
    }
    if (!activasPorPersona.has(pid)) {
      violaciones.push({
        codigo: 'CASO_SIN_INSCRIPCION',
        entidad: 'caso_social',
        id: String(caso.id),
        detalle: `La persona ${pid} no tiene inscripcion activa.`,
      });
    }
  }

  for (const evaluacion of evaluaciones) {
    if (!activo(evaluacion)) continue;
    const pid = claveRegistro(evaluacion.persona_id);
    if (pid && !personasPorId.has(pid)) {
      violaciones.push({
        codigo: 'EVALUACION_SIN_PERSONA',
        entidad: 'evaluacion_socioeconomica',
        id: String(evaluacion.id),
        detalle: `La evaluacion apunta a una persona inexistente (${evaluacion.persona_id}).`,
      });
    }
  }

  for (const tamizaje of tamizajes) {
    if (!activo(tamizaje)) continue;
    const pid = claveRegistro(tamizaje.persona_id);
    const iid = claveRegistro(tamizaje.inscripcion_id);
    if (!iid) continue;
    // Solo es violacion si la persona esta en el padron activo: los historicos
    // de personas inactivas conservan su ID original como archivo.
    if (!activasPorPersona.has(pid)) continue;
    if (!inscripcionesPorId.has(iid) || !activo(inscripcionesPorId.get(iid))) {
      violaciones.push({
        codigo: 'TAMIZAJE_SIN_INSCRIPCION',
        entidad: 'tamizaje_hemoglobina',
        id: String(tamizaje.id),
        detalle: `El tamizaje apunta a una inscripcion inexistente o inactiva (${tamizaje.inscripcion_id}).`,
      });
    }
  }

  for (const aporte of aportes) {
    const iid = claveRegistro(aporte.inscripcion_id);
    if (iid && !inscripcionesPorId.has(iid)) {
      advertencias.push({
        codigo: 'APORTE_SIN_INSCRIPCION',
        entidad: 'aporte',
        id: String(aporte.id),
        detalle: `El aporte apunta a una inscripcion inexistente (${aporte.inscripcion_id}).`,
      });
    }
  }

  for (const asistencia of asistencias) {
    const iid = claveRegistro(asistencia.inscripcion_id);
    if (iid && !inscripcionesPorId.has(iid)) {
      advertencias.push({
        codigo: 'ASISTENCIA_SIN_INSCRIPCION',
        entidad: 'asistencia_diaria',
        id: String(asistencia.id),
        detalle: `La asistencia apunta a una inscripcion inexistente (${asistencia.inscripcion_id}).`,
      });
    }
  }

  const porCodigo = new Map();
  for (const persona of personas) {
    const codigo = String(persona.codigo || '').trim();
    if (!codigo) continue;
    if (!porCodigo.has(codigo)) porCodigo.set(codigo, []);
    porCodigo.get(codigo).push(persona);
  }
  for (const [codigo, lista] of porCodigo) {
    if (lista.length > 1) {
      violaciones.push({
        codigo: 'CODIGO_DUPLICADO',
        entidad: 'persona',
        id: lista.map(p => String(p.id)).join(', '),
        detalle: `El codigo ${codigo} lo comparten ${lista.length} personas.`,
      });
    }
  }

  const contar = (lista) => lista.reduce((acc, v) => {
    acc[v.codigo] = (acc[v.codigo] || 0) + 1;
    return acc;
  }, {});

  ordenar(violaciones);
  ordenar(advertencias);

  return {
    ok: violaciones.length === 0,
    violaciones,
    advertencias,
    resumen: {
      personas: personas.length,
      personasActivas: personas.filter(activo).length,
      inscripciones: inscripciones.length,
      inscripcionesActivas: inscripciones.filter(activo).length,
      casosActivos: casos.filter(activo).length,
      tamizajes: tamizajes.length,
      aportes: aportes.length,
      asistencias: asistencias.length,
      violaciones: contar(violaciones),
      advertencias: contar(advertencias),
    },
  };
}
