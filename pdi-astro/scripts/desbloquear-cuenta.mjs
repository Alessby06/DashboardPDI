#!/usr/bin/env node
// ===========================================================================
//  DESBLOQUEAR UNA CUENTA
// ===========================================================================
//  Limpia el bloqueo por intentos fallidos sin cambiar la contraseña.
//
//  Uso:
//    node scripts/desbloquear-cuenta.mjs --usuario coordinacion
//    node scripts/desbloquear-cuenta.mjs --usuario admin --limpiar-ips
//
//  --limpiar-ips borra todos los contadores por IP. Úsalo solo si el bloqueo
//  afecta a una oficina compartida; si no, deja que expiren solos.
// ===========================================================================
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { configDe, consulta } from '../../api/_cuentaBase.mjs';

function cargarEnv() {
  const ruta = fileURLToPath(new URL('../.env', import.meta.url));
  const env = {};
  for (const linea of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

function argumento(nombre) {
  const i = process.argv.indexOf('--' + nombre);
  return i >= 0 ? process.argv[i + 1] : null;
}

const lit = (v) => JSON.stringify(String(v ?? ''));
const usuario = String(argumento('usuario') || '').trim().toLowerCase();
if (!usuario) {
  console.error('Uso: node scripts/desbloquear-cuenta.mjs --usuario <usuario> [--limpiar-ips]');
  process.exit(1);
}

const cfg = configDe(cargarEnv());
const filas = await consulta(cfg, `SELECT id, usuario FROM cuenta WHERE usuario = ${lit(usuario)} LIMIT 1;`);
if (!Array.isArray(filas) || !filas.length) {
  console.error(`No existe la cuenta "${usuario}".`);
  process.exit(1);
}
const id = String(filas[0].id);
await consulta(cfg, `UPDATE ${id} SET intentos_fallidos = 0, bloqueado_hasta = NONE;`);
if (process.argv.includes('--limpiar-ips')) {
  await consulta(cfg, 'DELETE intento_login;');
}
try {
  await consulta(cfg, `CREATE bitacora_auditoria CONTENT {
    usuario_nombre: 'Administración',
    rol: 'Sistema',
    accion: 'Cuenta desbloqueada',
    entidad: 'PDI - Perfil',
    registro_id: ${lit(id)},
    detalle: ${lit('Se limpió el bloqueo de intentos de ' + usuario + (process.argv.includes('--limpiar-ips') ? ' y los contadores por IP.' : '.'))},
    ip_origen: 'servidor',
    sede_nombre: 'Central',
    timestamp: time::now(),
    diff: NONE
  };`);
} catch (err) {
  console.warn('No se pudo auditar el desbloqueo:', err?.message || err);
}
console.log(`Cuenta desbloqueada: ${usuario}`);
if (process.argv.includes('--limpiar-ips')) console.log('Contadores por IP limpiados.');
