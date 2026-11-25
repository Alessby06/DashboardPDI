// ===========================================================================
//  SELLO PARA LA OUTBOX DE AUDITORÍA (cliente)
// ===========================================================================
//  El sello lo firma el servidor y attests identidad, rol, IP y vencimiento.
//  Se guarda en localStorage para poder escribir la outbox clínica cuando la
//  API de auditoría no responde. Se renueva con margen; si la red falla y el
//  sello todavía no venció, se sigue usando.
// ===========================================================================

export const CLAVE_SELLO = 'pdi_auditoria_sello';

/**
 * @param {{
 *   almacen: { getItem(k:string): string|null, setItem(k:string,v:string): void },
 *   fetchImpl: (url: string, opciones?: object) => Promise<Response>,
 *   ahora?: () => number,
 *   margenMs?: number,
 *   ruta?: string,
 * }} opciones
 */
export function crearSelloAuditoria({
  almacen,
  fetchImpl,
  ahora = () => Date.now(),
  margenMs = 5 * 60 * 1000,
  ruta = '/api/auditoria/sellos',
} = {}) {
  if (!almacen) throw new Error('El sello necesita un almacén.');

  function leer() {
    try {
      const guardado = JSON.parse(almacen.getItem(CLAVE_SELLO) || 'null');
      if (!guardado?.sello) return null;
      return { sello: String(guardado.sello), exp: Number(guardado.exp) || 0 };
    } catch {
      return null;
    }
  }

  function guardar(datos) {
    try {
      almacen.setItem(CLAVE_SELLO, JSON.stringify(datos));
    } catch {}
  }

  const vigente = (datos) => Boolean(datos?.sello) && datos.exp - margenMs > ahora();

  return {
    leer,

    /**
     * Devuelve un sello utilizable o `null`. Renueva cuando está por vencer y
     * la red lo permite; si no, usa el que todavía esté vigente.
     */
    async obtener({ forzar = false } = {}) {
      const guardado = leer();
      if (!forzar && vigente(guardado)) return guardado.sello;

      try {
        const res = await fetchImpl(ruta, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        if (!res.ok) {
          return guardado && guardado.exp > ahora() ? guardado.sello : null;
        }
        const datos = await res.json().catch(() => null);
        const exp = Number(datos?.exp) || 0;
        if (!datos?.sello || !exp) {
          return guardado && guardado.exp > ahora() ? guardado.sello : null;
        }
        const nuevo = { sello: String(datos.sello), exp };
        guardar(nuevo);
        return nuevo.sello;
      } catch {
        return guardado && guardado.exp > ahora() ? guardado.sello : null;
      }
    },
  };
}
