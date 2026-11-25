// ===========================================================================
//  COLA DE AUDITORÍA: ALMACENAMIENTO Y REINTENTO
// ===========================================================================
//  Une la lógica pura de `utils/colaAuditoria.js` con un almacén y un emisor.
//  Todo se inyecta para poder probar el ciclo completo sin navegador:
//  falla el envío → queda guardado → se reintenta al volver a abrir.
//
//  No decide autoría: el servidor la deriva de la cookie al recibir el evento.
// ===========================================================================
import {
  normalizarCola,
  encolar as encolarEnCola,
  listos as listosEnCola,
  registrarFallo,
  quitar,
  resumenCola,
} from '../utils/colaAuditoria.js';

export const CLAVE_COLA_AUDITORIA = 'pdi_auditoria_pendiente';

/**
 * @param {{
 *   almacen: { getItem(k:string): string|null, setItem(k:string,v:string): void, removeItem(k:string): void },
 *   enviar: (payload: object) => Promise<void>,
 *   ahora?: () => number,
 * }} opciones
 */
export function crearColaAuditoria({ almacen, enviar, ahora = () => Date.now() } = {}) {
  if (!almacen) throw new Error('La cola de auditoría necesita un almacén.');

  function leer() {
    try {
      return normalizarCola(JSON.parse(almacen.getItem(CLAVE_COLA_AUDITORIA) || '[]'));
    } catch {
      return [];
    }
  }

  function guardar(cola) {
    try {
      if (cola.length) almacen.setItem(CLAVE_COLA_AUDITORIA, JSON.stringify(cola));
      else almacen.removeItem(CLAVE_COLA_AUDITORIA);
      return true;
    } catch {
      // Cuota llena o almacenamiento bloqueado: el llamador debe avisar.
      return false;
    }
  }

  return {
    leer,

    resumen() {
      return resumenCola(leer(), ahora());
    },

    /**
     * Guarda un evento. `guardado: false` significa que se perdió: sin
     * almacenamiento no hay reintento posible.
     */
    encolar(payload) {
      const { cola, descartado, duplicado } = encolarEnCola(leer(), payload);
      const guardado = guardar(cola);
      return { guardado, descartado, duplicado };
    },

    /** Eventos cuya espera ya venció, sin marcarlos como enviados. */
    listos() {
      return listosEnCola(leer(), ahora());
    },

    /** Quita eventos que otro canal ya confirmó (p. ej. un beacon). */
    confirmar(ids) {
      const bajar = new Set((ids || []).map((id) => String(id || '').trim()).filter(Boolean));
      if (!bajar.size) return leer();
      const cola = leer().filter((item) => !bajar.has(String(item.payload?.evento_id || '')));
      guardar(cola);
      return cola;
    },

    /**
     * Intenta enviar ahora y, si falla, guarda el evento para el reintento.
     * `respaldo` es la outbox del servidor: si la acepta, no hace falta la
     * cola del navegador. Es el camino que usa `crearBitacora` en producción.
     */
    async registrar(payload, respaldo = null) {
      try {
        await enviar(payload);
        return { ok: true, error: null };
      } catch (err) {
        if (typeof respaldo === 'function') {
          try {
            if (await respaldo(payload)) {
              return { ok: false, error: err, enOutbox: true, guardado: true, descartado: 0, duplicado: false };
            }
          } catch {}
        }
        const guardado = this.encolar(payload);
        return { ok: false, error: err, enOutbox: false, ...guardado };
      }
    },

    /**
     * Reintenta lo que ya venció. Es idempotente: el servidor reconoce el
     * `evento_id` y responde ok sin duplicar.
     */
    async reintentar() {
      let cola = leer();
      const pendientes = listosEnCola(cola, ahora());
      let enviados = 0;

      for (const item of pendientes) {
        const id = String(item.payload?.evento_id || '');
        try {
          await enviar(item.payload);
          cola = quitar(cola, id);
          enviados += 1;
        } catch (err) {
          const fallido = registrarFallo(item, ahora(), err?.permanente === true);
          cola = cola.map((actual) => (
            String(actual.payload?.evento_id || '') === id ? fallido : actual
          ));
        }
      }

      const guardado = guardar(cola);
      return { ...resumenCola(cola, ahora()), enviados, guardado };
    },
  };
}
