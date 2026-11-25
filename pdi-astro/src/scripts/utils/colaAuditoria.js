// ===========================================================================
//  COLA DE AUDITORÍA PENDIENTE (lógica pura)
// ===========================================================================
//  La bitácora legal la escribe el servidor. Si el POST falla, el evento se
//  queda en el navegador y se reintenta con espera creciente. Este módulo no
//  toca localStorage ni la red: recibe y devuelve listas, para poder probarlo
//  sin navegador.
//
//  Garantías:
//    - un evento con `evento_id` no se encola dos veces;
//    - un evento agotado no se descarta: queda marcado y deja de reintentarse
//      solo, para que la interfaz avise;
//    - al llegar al tope se descarta el más antiguo y se informa cuántos.
// ===========================================================================

export const TOPE_COLA = 200;
export const MAX_INTENTOS = 8;
export const BASE_ESPERA_MS = 30_000;
export const ESPERA_MAX_MS = 30 * 60_000;

/** Identificador estable del evento; sin él no hay idempotencia. */
export function claveEvento(payload) {
  return String(payload?.evento_id || '').trim();
}

/** Limpia lo leído del almacenamiento y quita duplicados por `evento_id`. */
export function normalizarCola(crudo) {
  if (!Array.isArray(crudo)) return [];
  const vistos = new Set();
  const salida = [];
  for (const item of crudo) {
    if (!item || typeof item !== 'object') continue;
    const payload = item.payload;
    if (!payload || typeof payload !== 'object') continue;
    const id = claveEvento(payload);
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    salida.push({
      payload,
      intentos: Math.max(0, Math.trunc(Number(item.intentos) || 0)),
      proximoIntento: Math.max(0, Number(item.proximoIntento) || 0),
    });
  }
  return salida;
}

/**
 * Encola un evento nuevo. Devuelve la cola resultante y qué pasó, para que el
 * llamador pueda avisar en vez de perder eventos en silencio.
 */
export function encolar(cola, payload) {
  const lista = normalizarCola(cola);
  const id = claveEvento(payload);
  if (!id) return { cola: lista, descartado: 0, duplicado: false };
  if (lista.some((item) => claveEvento(item.payload) === id)) {
    return { cola: lista, descartado: 0, duplicado: true };
  }

  lista.push({ payload, intentos: 0, proximoIntento: 0 });

  let descartado = 0;
  while (lista.length > TOPE_COLA) {
    lista.shift();
    descartado += 1;
  }
  return { cola: lista, descartado, duplicado: false };
}

/** Elementos cuya espera ya venció. */
export function listos(cola, ahora = Date.now()) {
  return normalizarCola(cola).filter((item) => item.proximoIntento <= ahora);
}

/** Espera exponencial: 30 s, 1 min, 2 min… hasta 30 min. */
export function esperaTrasFallo(intentos) {
  const n = Math.max(1, Math.trunc(Number(intentos) || 1));
  return Math.min(BASE_ESPERA_MS * 2 ** (n - 1), ESPERA_MAX_MS);
}

/**
 * Registra un fallo de envío. Al llegar al máximo el evento no se borra: se
 * aparca con `proximoIntento` inalcanzable y `agotado: true`. Un rechazo
 * permanente (400/403, p. ej. un payload inválido) se aparca de inmediato:
 * reintentarlo no lo va a arreglar.
 */
export function registrarFallo(item, ahora = Date.now(), permanente = false) {
  const intentos = permanente
    ? MAX_INTENTOS
    : Math.max(0, Math.trunc(Number(item?.intentos) || 0)) + 1;
  const agotado = intentos >= MAX_INTENTOS;
  return {
    payload: item.payload,
    intentos,
    proximoIntento: agotado ? Number.MAX_SAFE_INTEGER : ahora + esperaTrasFallo(intentos),
    agotado,
  };
}

/** Quita un evento ya confirmado por el servidor. */
export function quitar(cola, eventoId) {
  const id = String(eventoId || '').trim();
  return normalizarCola(cola).filter((item) => claveEvento(item.payload) !== id);
}

/** Totales para el indicador de la interfaz. */
export function resumenCola(cola, ahora = Date.now()) {
  const lista = normalizarCola(cola);
  return {
    total: lista.length,
    listos: lista.filter((item) => item.proximoIntento <= ahora).length,
    agotados: lista.filter((item) => item.intentos >= MAX_INTENTOS).length,
  };
}
