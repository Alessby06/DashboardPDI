// ===========================================================================
//  Catálogos puros y mapeos entre la interfaz y SurrealDB
// ===========================================================================
//  Este módulo no toca el DOM ni importa import.meta.env, así que se puede
//  probar con `node --test`. La fuente de las opciones sigue siendo
//  data/opcionesBeneficiario.js.
// ===========================================================================
import {
  PARENTESCOS,
  SEDES,
  SEDES_OPERATIVAS,
  SEGUROS,
  MODALIDADES,
  TIPOS_DOCUMENTO,
  TIPOS_LOCAL,
  TIPOS_ALERGIA,
  SEVERIDADES_ALERGIA,
} from '../../data/opcionesBeneficiario.js';

/** Normaliza texto para comparar sin tildes, mayúsculas ni espacios extra. */
export function claveCatalogo(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// ---------------------------------------------------------------------------
//  Tipo de documento
// ---------------------------------------------------------------------------
const TIPO_DOCUMENTO_POR_CLAVE = new Map(
  TIPOS_DOCUMENTO.map((tipo) => [claveCatalogo(tipo.valor), tipo.valor]),
);
const TIPO_DOCUMENTO_ALIAS = new Map([
  [claveCatalogo('Carnet de Extranjería'), 'Carnet Extranjeria'],
  [claveCatalogo('Partida de Nacimiento'), 'Partida Nacimiento'],
  [claveCatalogo('Sin DNI'), 'Sin Documento'],
]);

/**
 * Devuelve el valor que guarda la base. Si no se reconoce el tipo, usa DNI
 * cuando hay número y "Sin Documento" cuando no lo hay.
 */
export function tipoDocumentoCanonico(valor, tieneDocumento = true) {
  const original = String(valor || '').trim();
  if (!original) return tieneDocumento ? 'DNI' : 'Sin Documento';
  const k = claveCatalogo(original);
  if (TIPO_DOCUMENTO_ALIAS.has(k)) return TIPO_DOCUMENTO_ALIAS.get(k);
  return TIPO_DOCUMENTO_POR_CLAVE.get(k) || (tieneDocumento ? 'DNI' : 'Sin Documento');
}

// ---------------------------------------------------------------------------
//  Parentescos
// ---------------------------------------------------------------------------
const PARENTESCO_POR_CLAVE = new Map(PARENTESCOS.map((p) => [claveCatalogo(p), p]));
const PARENTESCO_ALIAS = new Map([
  [claveCatalogo('Tutor Legal'), 'Cuidador Legal'],
]);
const PARENTESCOS_VALIDOS = new Set(PARENTESCOS);

/** Devuelve el parentesco canónico o "Otro" si no se reconoce. */
export function normalizarParentesco(valor) {
  const k = claveCatalogo(valor);
  if (!k) return 'Otro';
  if (PARENTESCO_ALIAS.has(k)) return PARENTESCO_ALIAS.get(k);
  return PARENTESCO_POR_CLAVE.get(k) || 'Otro';
}

/** Indica si el valor ya es una opción exacta del catálogo. */
export function parentescoValido(valor) {
  return PARENTESCOS_VALIDOS.has(String(valor || '').trim());
}

/**
 * Clasifica un parentesco para la migración:
 * - sin_cambio: ya es canónico.
 * - migrar: es un alias conocido y se puede reemplazar.
 * - revisar: no se reconoce; se conserva y se reporta.
 */
export function migracionParentesco(valor) {
  const original = String(valor || '').trim();
  if (!original) return { original, destino: original, accion: 'revisar' };
  if (parentescoValido(original)) {
    return { original, destino: original, accion: 'sin_cambio' };
  }
  const destino = normalizarParentesco(original);
  if (destino !== 'Otro') {
    return { original, destino, accion: 'migrar' };
  }
  return { original, destino: original, accion: 'revisar' };
}

// ---------------------------------------------------------------------------
//  Seguro
// ---------------------------------------------------------------------------
const SEGURO_POR_CLAVE = new Map(SEGUROS.map((s) => [claveCatalogo(s.valor), s.valor]));
const SEGURO_ALIAS = new Map([
  [claveCatalogo('SIS'), 'SIS Gratuito'],
  [claveCatalogo('PNP/FFAA'), 'PNP / FFAA'],
  [claveCatalogo('No tiene'), 'Ninguno'],
]);
const SEGUROS_VALIDOS = new Set(SEGUROS.map((s) => s.valor));

/** Traduce el valor guardado a la etiqueta visible del catálogo. */
export function seguroDbAUi(valor) {
  const original = String(valor || '').trim();
  if (!original) return '';
  const k = claveCatalogo(original);
  if (SEGURO_POR_CLAVE.has(k)) return SEGURO_POR_CLAVE.get(k);
  if (SEGURO_ALIAS.has(k)) return SEGURO_ALIAS.get(k);
  // Valor legado desconocido: se conserva para reportarlo, no se inventa.
  return original;
}

/** Traduce la etiqueta visible al valor que se guarda en la base. */
export function seguroUiADb(valor) {
  const original = String(valor || '').trim();
  if (!original) return 'Ninguno';
  return seguroDbAUi(original);
}

/** Indica si el valor es una etiqueta exacta del catálogo de seguros. */
export function seguroValido(valor) {
  return SEGUROS_VALIDOS.has(String(valor || '').trim());
}

// ---------------------------------------------------------------------------
//  Alergias
// ---------------------------------------------------------------------------
// La alergia vive en la tabla `alergia`: tipo, severidad y descripcion. Una
// persona tiene una sola alergia vigente (la de mayor gravedad cuando el
// registro se importó con más de una); "Ninguna" es solo un valor de la
// interfaz y no llega a la base.
//
// Esto va un paso más allá de la ficha del programa, que pide una sola línea
// de texto ("ALÉRGICO A MEDICAMENTOS"): el tipo y la gravedad no están en esa
// ficha, pero sí en el modelo oficial de la base, y la gravedad es la que
// decide en una urgencia. Se deja anotado para que el programa sepa que la
// app se adelantó al documento.
const TIPO_ALERGIA_POR_CLAVE = new Map(
  TIPOS_ALERGIA.map((tipo) => [claveCatalogo(tipo.valor), tipo.valor]),
);
const SEVERIDAD_ALERGIA_POR_CLAVE = new Map(
  SEVERIDADES_ALERGIA.map((s) => [claveCatalogo(s.valor), s.valor]),
);
const PESO_SEVERIDAD = new Map(
  SEVERIDADES_ALERGIA.map((s, i) => [s.valor, i + 1]),
);

/** Tipo de alergia que se guarda, o '' si no hay alergia que registrar. */
export function tipoAlergiaCanonico(valor) {
  const k = claveCatalogo(valor);
  if (!k || k === claveCatalogo('Ninguna')) return '';
  const tipo = TIPO_ALERGIA_POR_CLAVE.get(k);
  return tipo === 'Ninguna' ? '' : tipo || '';
}

/** Gravedad de la alergia, o '' si no se reconoce. */
export function severidadAlergiaCanonico(valor) {
  const k = claveCatalogo(valor);
  return SEVERIDAD_ALERGIA_POR_CLAVE.get(k) || '';
}

/** Peso de la gravedad: la anafilaxia pesa más que la moderada. */
export function pesoSeveridadAlergia(valor) {
  return PESO_SEVERIDAD.get(severidadAlergiaCanonico(valor)) || 0;
}

/** Descripción de la alergia: '' cuando no hay ninguna ("Ninguna" cuenta). */
export function descripcionAlergia(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return '';
  if (claveCatalogo(texto) === claveCatalogo('Ninguna')) return '';
  return texto;
}

/** El registro de alergia que cuenta: el de mayor gravedad entre los vigentes. */
export function alergiaPrincipal(lista) {
  const vigentes = (Array.isArray(lista) ? lista : []).filter(
    (a) => a && a.activo !== false && descripcionAlergia(a.descripcion),
  );
  if (!vigentes.length) return null;
  return vigentes.reduce((mejor, actual) => (
    pesoSeveridadAlergia(actual.severidad) >= pesoSeveridadAlergia(mejor.severidad) ? actual : mejor
  ));
}

/** Texto que ve la gente: "Penicilina (Grave / Anafilaxia)" o "Ninguna". */
export function resumenAlergias(lista) {
  const principal = alergiaPrincipal(lista);
  if (!principal) return 'Ninguna';
  const descripcion = descripcionAlergia(principal.descripcion);
  const severidad = severidadAlergiaCanonico(principal.severidad);
  if (!severidad) return descripcion;
  return `${descripcion} (${severidad})`;
}

// ---------------------------------------------------------------------------
//  Modalidad
// ---------------------------------------------------------------------------
const MODALIDAD_POR_CLAVE = new Map(MODALIDADES.map((m) => [claveCatalogo(m.valor), m.valor]));
const MODALIDADES_VALIDAS = new Set(MODALIDADES.map((m) => m.valor));

/** Traduce el valor guardado a la etiqueta visible del catálogo. */
export function modalidadDbAUi(valor) {
  const original = String(valor || '').trim();
  if (!original) return 'Comunitaria';
  const k = claveCatalogo(original);
  if (MODALIDAD_POR_CLAVE.has(k)) return MODALIDAD_POR_CLAVE.get(k);
  // Cualquier otra forma de la misma idea se lleva al valor que usa el
  // programa: "I.E.".
  if (/institu|escolar|^ie$|^i\.e\.?$/.test(k)) return 'I.E.';
  if (/comunitar/.test(k)) return 'Comunitaria';
  return original;
}

/** Traduce la etiqueta visible al valor que se guarda en la base. */
export function modalidadUiADb(valor) {
  return modalidadDbAUi(valor);
}

/** Indica si el valor es una etiqueta exacta del catálogo de modalidades. */
export function modalidadValida(valor) {
  return MODALIDADES_VALIDAS.has(String(valor || '').trim());
}

// ---------------------------------------------------------------------------
//  Exoneración
// ---------------------------------------------------------------------------
/** Convierte un porcentaje (0, 50, 100) a la etiqueta canónica. */
export function exoneracionDesdePct(pct) {
  if (pct === null || pct === undefined || pct === '') return 'No registrado';
  const n = Number(pct);
  if (!Number.isFinite(n)) return 'No registrado';
  if (n === 100) return '100% (Exonerado Vulnerabilidad Extrema)';
  if (n === 50) return '50% (Semi-exonerado)';
  if (n === 0) return '0% (Aporte Ordinario)';
  return 'No registrado';
}

/** Convierte una etiqueta de exoneración al porcentaje que manda en la base. */
export function pctDesdeExoneracion(valor) {
  const texto = String(valor || '');
  if (texto.includes('100%')) return 100;
  if (texto.includes('50%')) return 50;
  if (texto.includes('0%')) return 0;
  return 0;
}

// ---------------------------------------------------------------------------
//  Tipo de local de una sede
// ---------------------------------------------------------------------------
const TIPO_LOCAL_POR_CLAVE = new Map(
  TIPOS_LOCAL.map((tipo) => [claveCatalogo(tipo.valor), tipo.valor]),
);
const TIPO_LOCAL_ALIAS = new Map([
  [claveCatalogo('Colegio Publico (I.E.)'), 'Colegio Público (I.E.)'],
  [claveCatalogo('Colegio Público Aliado'), 'Colegio Público (I.E.)'],
]);

/** Devuelve el tipo de local canónico o "Local Comunal" si no se reconoce. */
export function tipoLocalCanonico(valor) {
  const original = String(valor || '').trim();
  if (!original) return 'Local Comunal';
  const k = claveCatalogo(original);
  if (TIPO_LOCAL_ALIAS.has(k)) return TIPO_LOCAL_ALIAS.get(k);
  return TIPO_LOCAL_POR_CLAVE.get(k) || 'Local Comunal';
}

// ---------------------------------------------------------------------------
//  Sedes y distritos
// ---------------------------------------------------------------------------
const SEDE_POR_CLAVE = new Map(
  SEDES_OPERATIVAS.map((sede) => [claveCatalogo(sede.nombre), sede]),
);

/** Devuelve la sede operativa (nombre y distrito) o null si no existe. */
export function sedeOperativa(nombre) {
  const original = String(nombre || '').trim();
  if (!original) return null;
  const directa = SEDE_POR_CLAVE.get(claveCatalogo(original));
  if (directa) return directa;
  // Acepta también el valor compuesto del catálogo: "Comas - Año Nuevo".
  if (original.includes(' - ')) {
    const resto = original.split(' - ').slice(1).join(' - ');
    return SEDE_POR_CLAVE.get(claveCatalogo(resto)) || null;
  }
  return null;
}

/** Indica si el nombre corresponde a una sede del catálogo. */
export function sedeConocida(nombre) {
  return Boolean(sedeOperativa(nombre));
}

/** Distrito de la sede, o null si la sede no está en el catálogo. */
export function distritoDeSede(nombre) {
  return sedeOperativa(nombre)?.distrito || null;
}

/** Etiqueta visible: "Carmen Alto (Comas)" o "Torre Blanca (No registrada)". */
export function etiquetaSede(nombre) {
  const original = String(nombre || '').trim();
  if (!original) return 'Sin sede';
  const sede = sedeOperativa(original);
  return sede ? `${sede.nombre} (${sede.distrito})` : `${original} (No registrada)`;
}

/** Valor compuesto del catálogo: "Comas - Año Nuevo". */
export function valorCompuestoSede(nombre) {
  const sede = sedeOperativa(nombre);
  if (!sede) return String(nombre || '').trim();
  const encontrada = SEDES.find((s) => {
    const [distrito, ...resto] = s.valor.split(' - ');
    return claveCatalogo(distrito) === claveCatalogo(sede.distrito)
      && claveCatalogo(resto.join(' - ')) === claveCatalogo(sede.nombre);
  });
  return encontrada ? encontrada.valor : `${sede.distrito} - ${sede.nombre}`;
}

/** Sedes agrupadas por distrito, derivadas del catálogo único. */
export const SEDES_POR_DISTRITO = SEDES_OPERATIVAS.reduce((acc, sede) => {
  if (!acc[sede.distrito]) acc[sede.distrito] = [];
  acc[sede.distrito].push(sede.nombre);
  return acc;
}, {});

/** Nombres sueltos de las sedes del catálogo. */
export const SEDES_NOMBRES = SEDES_OPERATIVAS.map((sede) => sede.nombre);
