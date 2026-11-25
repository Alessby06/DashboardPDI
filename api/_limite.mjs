// ===========================================================================
//  FRENO DE PETICIONES POR INSTANCIA
// ===========================================================================
//  Las Functions de Vercel no comparten memoria entre instancias, así que este
//  límite es por instancia. No pretende ser un WAF: acota el consumo de cuota
//  de una sola cuenta (o IP) y evita que un script agote el cupo de la base.
// ===========================================================================

/**
 * Crea un límite de ventana deslizante.
 * @param {{maximo?: number, ventanaMs?: number, maxClaves?: number}} opciones
 */
export function crearLimite({ maximo = 600, ventanaMs = 15 * 60 * 1000, maxClaves = 2000 } = {}) {
  const registros = new Map();

  return {
    /**
     * Registra un intento. Devuelve `{ ok: true, restantes }` o
     * `{ ok: false, reintentarEn }` con los segundos que faltan.
     */
    permitir(clave, ahora = Date.now()) {
      const k = String(clave || 'anon');
      const desde = ahora - ventanaMs;
      let ventana = registros.get(k);
      if (!ventana) {
        ventana = [];
        registros.set(k, ventana);
      }
      // Descarta los intentos que ya salieron de la ventana.
      while (ventana.length && ventana[0] <= desde) ventana.shift();

      if (ventana.length >= maximo) {
        const espera = Math.ceil((ventana[0] + ventanaMs - ahora) / 1000);
        return { ok: false, reintentarEn: Math.max(1, espera) };
      }

      ventana.push(ahora);

      // Techo de memoria: si hay demasiadas claves, se expulsa la más antigua
      // (Map conserva el orden de inserción).
      if (registros.size > maxClaves) {
        registros.delete(registros.keys().next().value);
      }
      return { ok: true, restantes: maximo - ventana.length };
    },

    reiniciar() {
      registros.clear();
    },

    get claves() {
      return registros.size;
    },
  };
}
