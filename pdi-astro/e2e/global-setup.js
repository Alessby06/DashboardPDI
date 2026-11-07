import fs from 'node:fs';
import crypto from 'node:crypto';
import { configDe, consulta, hashClave, cifrar } from '../../api/_cuentaBase.mjs';
import { RUTA_CUENTAS, cargarEnv } from './env.js';

async function limpiarCuentasE2E(cfg) {
  const filas = await consulta(cfg, "SELECT id FROM cuenta WHERE string::starts_with(usuario, 'e2e-');");
  for (const fila of filas) {
    await consulta(cfg, `DELETE ${fila.id};`);
    await consulta(cfg, `DELETE bitacora_auditoria WHERE registro_id = ${JSON.stringify(String(fila.id))};`);
  }
}

async function crearCuenta(cfg, rol, etiqueta) {
  const usuario = `e2e-${etiqueta}-${crypto.randomInt(100000, 999999)}`;
  const clave = 'E2E-' + crypto.randomBytes(12).toString('base64url');
  const hash = await hashClave(cfg, clave);
  const fila = await consulta(cfg, `CREATE cuenta CONTENT {
    usuario: ${JSON.stringify(usuario)},
    nombre: ${JSON.stringify('E2E ' + etiqueta)},
    rol: ${JSON.stringify(rol)},
    hash_cifrado: ${JSON.stringify(cifrar(hash, cfg.secreto))},
    activo: true,
    debe_cambiar_clave: false,
    session_version: 0,
    intentos_fallidos: 0
  };`);
  return { usuario, clave, id: fila[0].id };
}

export default async function globalSetup() {
  const cfg = configDe(cargarEnv());
  await limpiarCuentasE2E(cfg);
  const coord = await crearCuenta(cfg, 'coord', 'coord');
  const promo = await crearCuenta(cfg, 'promotora', 'promo');
  fs.writeFileSync(RUTA_CUENTAS, JSON.stringify({ coord, promo }, null, 2));
  console.log('[e2e] cuentas temporales creadas:', coord.usuario, '/', promo.usuario);
}
