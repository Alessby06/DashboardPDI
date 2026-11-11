// ===========================================================================
//  JORNADA DE ASISTENCIA - Reglas puras
// ===========================================================================
//  Esta pieza no toca el DOM ni la base: decide que dia es "hoy" en la zona
//  del programa, quien puede editar una jornada, como se combina lo guardado
//  con el borrador y cuando dos dispositivos entran en conflicto. Vive aparte
//  del controlador para poder probarla con `node --test` sin navegador ni
//  conexion a SurrealDB.
// ===========================================================================

/** Zona horaria oficial del programa. `toISOString()` corta a las 19:00. */
export const ZONA_HORARIA = "America/Lima";

export const ESTADOS_ASISTENCIA = {
  P:  { label: "Presente",            markClass: "status-mark--ok"  },
  T:  { label: "Tardanza",            markClass: "status-mark--warn" },
  FJ: { label: "Falta Justificada",   markClass: "status-mark--severe" },
  FI: { label: "Falta Injustificada", markClass: "status-mark--danger"    },
};

/** Un alumno sin marcar no es una falta: es una ausencia de dato. */
export const SIN_MARCAR = {
  clave: "",
  label: "Sin marcar",
  markClass: "status-mark--idle",
};

const LARGO_MAXIMO_MOTIVO = 120;

/**
 * Dia local en formato YYYY-MM-DD.
 *
 * `new Date().toISOString().slice(0, 10)` devuelve el dia UTC. En Lima eso
 * adelanta la fecha a partir de las 19:00 y guarda la jornada en el dia
 * siguiente. Aqui se pregunta la fecha a la zona del programa.
 */
export function diaEnZona(fecha = new Date(), zona = ZONA_HORARIA) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha instanceof Date ? fecha : new Date(fecha));
  const piezas = {};
  for (const parte of partes) {
    if (parte.type !== "literal") piezas[parte.type] = parte.value;
  }
  return `${piezas.year}-${piezas.month}-${piezas.day}`;
}

/** Normaliza una fila de asistencia a la forma que compara el conflicto. */
export function normalizarMarca(marca) {
  if (!marca || !ESTADOS_ASISTENCIA[marca.estado]) {
    return { estado: "", observacion: "" };
  }
  return {
    estado: marca.estado,
    observacion: marca.estado === "FJ" ? String(marca.observacion || "").trim() : "",
  };
}

export function mismasMarcas(a, b) {
  const na = normalizarMarca(a);
  const nb = normalizarMarca(b);
  return na.estado === nb.estado && na.observacion === nb.observacion;
}

/**
 * Que puede hacer cada rol con una jornada.
 *
 * - Promotora: solo el dia de hoy, en cualquier sede. La base no relaciona
 *   usuarios con sedes, asi que la restriccion real es temporal.
 * - Coordinacion y administracion: cualquier dia del periodo actual.
 * - Periodos anteriores y fechas futuras: solo lectura.
 */
export function puedeEditarJornada(rol, dia, hoy = diaEnZona()) {
  if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false;
  if (dia > hoy) return false;
  if (rol === "promotora") return dia === hoy;
  if (rol === "coord" || rol === "admin") return dia.slice(0, 4) === hoy.slice(0, 4);
  return false;
}

/** Texto que explica por que una jornada esta en solo lectura. */
export function motivoEdicionBloqueada(rol, dia, hoy = diaEnZona()) {
  if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return "Elige un día para la jornada.";
  if (dia > hoy) return "No se puede registrar una jornada futura.";
  if (rol === "promotora") return "La promotora solo puede registrar la jornada de hoy.";
  if (rol === "coord" || rol === "admin") {
    return "Este periodo está cerrado: la jornada queda solo para consulta.";
  }
  return "Tu rol no puede editar la asistencia.";
}

/** Estado efectivo de un alumno: el borrador manda sobre lo guardado. */
export function estadoEfectivo(guardado, borrador, inscripcionId) {
  if (Object.prototype.hasOwnProperty.call(borrador, inscripcionId)) {
    return normalizarMarca(borrador[inscripcionId]);
  }
  return normalizarMarca(guardado[inscripcionId]);
}

/** Info de marca para el estado efectivo. */
export function infoEstado(marca) {
  const normal = normalizarMarca(marca);
  if (!normal.estado) return SIN_MARCAR;
  return { clave: normal.estado, ...ESTADOS_ASISTENCIA[normal.estado] };
}

/**
 * Recuento de la jornada completa. `ids` son todos los alumnos de la sede,
 * antes de aplicar grado o busqueda: el resumen no debe cambiar porque el
 * usuario este mirando un subconjunto.
 */
export function resumenJornada(ids, obtenerMarca) {
  const resumen = { total: 0, P: 0, T: 0, FJ: 0, FI: 0, sinMarcar: 0, conMotivo: 0 };
  for (const id of ids || []) {
    const marca = normalizarMarca(obtenerMarca(id));
    resumen.total += 1;
    if (!marca.estado) {
      resumen.sinMarcar += 1;
      continue;
    }
    resumen[marca.estado] += 1;
    if (marca.estado === "FJ" && marca.observacion) resumen.conMotivo += 1;
  }
  return resumen;
}

/**
 * Compara lo que habia al cargar con lo que hay ahora en la nube, solo para
 * los alumnos que este dispositivo va a escribir. Los cambios de otros
 * alumnos no se tocan al guardar y por eso no son un conflicto.
 */
export function compararJornadas(lineaBase, actuales, cambios) {
  const conflictos = [];
  for (const inscripcionId of Object.keys(cambios || {})) {
    const antes = normalizarMarca(lineaBase?.[inscripcionId]);
    const ahora = normalizarMarca(actuales?.[inscripcionId]);
    if (antes.estado !== ahora.estado || antes.observacion !== ahora.observacion) {
      conflictos.push({ inscripcionId, antes, ahora });
    }
  }
  return conflictos;
}

/** Un FJ sin motivo no se puede guardar; el resto de estados no llevan texto. */
export function validarMotivoFJ(estado, motivo) {
  if (estado !== "FJ") return { ok: true, observacion: "" };
  const texto = String(motivo || "").trim();
  if (!texto) return { ok: false, error: "La falta justificada necesita un motivo." };
  if (texto.length > LARGO_MAXIMO_MOTIVO) {
    return { ok: false, error: `El motivo no puede superar los ${LARGO_MAXIMO_MOTIVO} caracteres.` };
  }
  return { ok: true, observacion: texto };
}

/** Clave utilizable en type::record(): quita el prefijo y los corchetes angulares. */
export function claveRegistro(rid) {
  return String(rid == null ? "" : rid)
    .split(":").pop()
    .replace(/^⟨/, "")
    .replace(/⟩$/, "");
}

/**
 * Construye la transacción de guardado de una jornada.
 *
 * Se genera una sentencia por alumno y una sola transacción. Un estado vacío
 * borra la fila: así "sin marcar" no se representa con un registro fantasma.
 * Devuelve SurrealQL y parámetros, para que la capa de datos no repita la
 * construcción y las pruebas puedan validar el texto exacto.
 */
export function construirGuardadoJornada({ dia, cambios, registradoPorNombre = "" }) {
  let ql = "BEGIN TRANSACTION;\n";
  const params = { dia };
  let indice = 0;

  for (const [inscripcionId, cambio] of Object.entries(cambios || {})) {
    const clave = claveRegistro(inscripcionId);
    if (!clave) continue;
    const i = indice++;

    if (!cambio || !cambio.estado) {
      ql += `DELETE asistencia_diaria
        WHERE inscripcion_id = type::record('inscripcion', $iid${i}) AND dia = $dia;\n`;
      params[`iid${i}`] = clave;
      continue;
    }

    const sedeClave = claveRegistro(cambio.sedeId);
    if (!sedeClave) {
      throw new Error("El alumno no tiene una sede registrada en su inscripción.");
    }
    if (!ESTADOS_ASISTENCIA[cambio.estado]) {
      throw new Error("Estado de asistencia no válido.");
    }

    const observacion = cambio.estado === "FJ"
      ? String(cambio.observacion || "").trim().slice(0, LARGO_MAXIMO_MOTIVO)
      : "";

    params[`iid${i}`] = clave;
    params[`sid${i}`] = sedeClave;
    params[`data${i}`] = {
      estado: cambio.estado,
      racion_entregada: cambio.estado === "P" || cambio.estado === "T",
      ...(observacion ? { observacion } : {}),
      ...(registradoPorNombre ? { registrado_por_nombre: registradoPorNombre } : {}),
    };

    // `observacion` y `registrado_por_nombre` son none|string: el SDK manda
    // NULL cuando el parámetro es null y el esquema lo rechaza. Donde no hay
    // texto se escribe NONE literal, que además limpia el valor anterior.
    const observacionSql = observacion ? `$data${i}.observacion` : "NONE";
    const porSql = registradoPorNombre ? `$data${i}.registrado_por_nombre` : "NONE";

    ql += `INSERT INTO asistencia_diaria {
      inscripcion_id: type::record('inscripcion', $iid${i}),
      sede_id: type::record('sede', $sid${i}),
      dia: $dia,
      fecha: time::now(),
      estado: $data${i}.estado,
      observacion: ${observacionSql},
      racion_entregada: $data${i}.racion_entregada,
      registrado_por_nombre: ${porSql},
      actualizado_el: time::now()
    } ON DUPLICATE KEY UPDATE
      estado = $data${i}.estado,
      observacion = ${observacionSql},
      racion_entregada = $data${i}.racion_entregada,
      registrado_por_nombre = ${porSql},
      actualizado_el = time::now();\n`;
  }

  ql += "COMMIT TRANSACTION;";
  return { ql, params };
}

export { LARGO_MAXIMO_MOTIVO };
