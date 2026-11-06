#!/usr/bin/env node
// ===========================================================================
//  RESTABLECER CONTRASEÑA (ADMINISTRACIÓN)
// ===========================================================================
//  Genera una contraseña temporal para una cuenta y obliga a cambiarla en el
//  siguiente ingreso. Es la vía de recuperación mientras no haya dominio de
//  correo configurado.
//
//  Uso:
//    node scripts/restablecer-clave.mjs --usuario coordinacion
//    node scripts/restablecer-clave.mjs --usuario admin --clave Temporal12345
//    node scripts/restablecer-clave.mjs --usuario social --sin-forzar
//
//  Requiere pdi-astro/.env con SURREAL_USER / SURREAL_PASS.
// ===========================================================================
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { configDe, consulta, hashClave, cifrar } from '../../api/_cuentaBase.mjs';

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

function claveTemporal() {
  const alfabeto = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let salida = '';
  for (let i = 0; i < 14; i += 1) salida += alfabeto[crypto.randomInt(0, alfabeto.length)];
  return salida;
}

const lit = (valor) => JSON.stringify(String(valor ?? ''));

async function main() {
  const usuario = String(argumento('usuario') || '').trim().toLowerCase();
  if (!usuario) {
    console.error('Uso: node scripts/restablecer-clave.mjs --usuario <usuario> [--clave <temporal>] [--sin-forzar]');
    process.exit(1);
  }
  const clave = String(argumento('clave') || claveTemporal());
  if (clave.length < 10) {
    console.error('La clave temporal debe tener al menos 10 caracteres.');
    process.exit(1);
  }
  const forzar = !process.argv.includes('--sin-forzar');

  const env = cargarEnv();
  const cfg = configDe(env);
  const filas = await consulta(cfg, `SELECT id, usuario, nombre, session_version FROM cuenta WHERE usuario = ${lit(usuario)} LIMIT 1;`);
  if (!Array.isArray(filas) || !filas.length) {
    console.error(`No existe la cuenta "${usuario}".`);
    process.exit(1);
  }
  const cuenta = filas[0];
  const id = String(cuenta.id);
  if (!/^[a-z_]+:[A-Za-z0-9]+$/.test(id)) {
    console.error('Identificador de cuenta no válido.');
    process.exit(1);
  }

  const hash = cifrar(await hashClave(cfg, clave), cfg.secreto);
  // Un restablecimiento invalida cualquier sesión abierta de esa cuenta.
  const versionSesion = (Number(cuenta.session_version) || 0) + 1;
  await consulta(cfg, `UPDATE ${id} SET
    hash_cifrado = ${lit(hash)},
    debe_cambiar_clave = ${forzar ? 'true' : 'false'},
    session_version = ${versionSesion},
    intentos_fallidos = 0,
    bloqueado_hasta = NONE,
    totp_secret = NONE,
    totp_activo = false,
    totp_ultimo_contador = NONE;`);

  try {
    await consulta(cfg, `CREATE bitacora_auditoria CONTENT {
      usuario_nombre: 'Administración',
      rol: 'Sistema',
      accion: 'Clave restablecida',
      entidad: 'PDI - Perfil',
      registro_id: ${lit(id)},
      detalle: ${lit('Contraseña temporal generada para ' + usuario + (forzar ? ' (debe cambiarla al ingresar).' : '.'))},
      ip_origen: 'servidor',
      sede_nombre: 'Central',
      diff: NONE
    };`);
  } catch (err) {
    console.warn('No se pudo registrar en la bitácora:', err?.message || err);
  }

  console.log(`Cuenta: ${cuenta.usuario}`);
  console.log(`Clave temporal: ${clave}`);
  console.log(forzar ? 'Se pedirá cambiarla al ingresar.' : 'No se forzará el cambio.');
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exitCode = 1;
});
