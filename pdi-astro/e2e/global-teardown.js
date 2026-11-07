import fs from 'node:fs';
import { configDe, consulta } from '../../api/_cuentaBase.mjs';
import { RUTA_CUENTAS, cargarEnv, leerCuentas } from './env.js';

async function borrar(cfg, id) {
  await consulta(cfg, `DELETE ${id};`);
  await consulta(cfg, `DELETE bitacora_auditoria WHERE registro_id = ${JSON.stringify(String(id))};`);
}

export default async function globalTeardown() {
  const cfg = configDe(cargarEnv());
  try {
    let datos = null;
    try {
      datos = leerCuentas();
    } catch {
      datos = null;
    }
    if (datos) {
      await borrar(cfg, datos.coord.id);
      await borrar(cfg, datos.promo.id);
    }
    // Restos de ejecuciones interrumpidas.
    const filas = await consulta(cfg, "SELECT id FROM cuenta WHERE string::starts_with(usuario, 'e2e-');");
    for (const fila of filas) await borrar(cfg, fila.id);
    fs.rmSync(RUTA_CUENTAS, { force: true });
    console.log('[e2e] cuentas temporales eliminadas');
  } catch (err) {
    console.error('[e2e] no se pudieron limpiar las cuentas temporales:', err.message);
    throw err;
  }
}
