#!/usr/bin/env node
// ===========================================================================
//  MIGRACIÓN DE CUENTAS
// ===========================================================================
//  Crea la tabla `cuenta` y siembra las cinco cuentas iniciales. La contraseña
//  no se guarda en claro: se genera un hash Argon2id en SurrealDB y se cifra
//  antes de escribir.
//
//  Uso:
//    node scripts/migrar-cuentas.mjs
//    node scripts/migrar-cuentas.mjs --forzar   (reescribe las existentes)
//
//  Requiere pdi-astro/.env con SURREAL_USER / SURREAL_PASS. El cifrado de los
//  hashes deriva de SURREAL_PASS: si esa contraseña cambia, hay que volver a
//  ejecutar esta migración con --forzar para re-cifrar las cuentas.
//
//  No hay contraseñas fijas en el repositorio: cada cuenta recibe una clave
//  temporal aleatoria que se imprime una sola vez y obliga a cambiarla al
//  entrar. Así una copia pública del código no entrega credenciales.
// ===========================================================================
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { configDe, consulta, hashClave, cifrar } from '../../api/_cuentaBase.mjs';

const CUENTAS = [
  { usuario: 'coordinacion', rol: 'coord', nombre: 'Coordinación General' },
  { usuario: 'facilitadora', rol: 'facilitadora', nombre: 'Facilitadora Nutricional' },
  { usuario: 'promotora', rol: 'promotora', nombre: 'Promotora Educativa' },
  { usuario: 'social', rol: 'social', nombre: 'Trabajadora Social' },
  { usuario: 'admin', rol: 'admin', nombre: 'Administrador TI' },
];

/** Clave temporal legible, sin caracteres ambiguos. */
function claveTemporal() {
  const alfabeto = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let salida = '';
  for (let i = 0; i < 16; i += 1) salida += alfabeto[crypto.randomInt(0, alfabeto.length)];
  return salida;
}

function cargarEnv() {
  const ruta = fileURLToPath(new URL('../.env', import.meta.url));
  const env = {};
  for (const linea of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const lit = (valor) => JSON.stringify(String(valor ?? ''));
const forzar = process.argv.includes('--forzar');

const ESQUEMA = [
  'DEFINE TABLE IF NOT EXISTS cuenta SCHEMAFULL PERMISSIONS NONE;',
  'DEFINE FIELD IF NOT EXISTS usuario ON cuenta TYPE string;',
  'DEFINE FIELD IF NOT EXISTS nombre ON cuenta TYPE string;',
  'DEFINE FIELD IF NOT EXISTS correo ON cuenta TYPE option<string>;',
  'DEFINE FIELD IF NOT EXISTS telefono ON cuenta TYPE option<string>;',
  'DEFINE FIELD IF NOT EXISTS rol ON cuenta TYPE string;',
  'DEFINE FIELD IF NOT EXISTS activo ON cuenta TYPE bool DEFAULT true;',
  'DEFINE FIELD IF NOT EXISTS hash_cifrado ON cuenta TYPE string;',
  'DEFINE FIELD IF NOT EXISTS foto ON cuenta TYPE option<string>;',
  'DEFINE FIELD IF NOT EXISTS debe_cambiar_clave ON cuenta TYPE bool DEFAULT false;',
  'DEFINE FIELD IF NOT EXISTS session_version ON cuenta TYPE int DEFAULT 0;',
  'DEFINE FIELD IF NOT EXISTS intentos_fallidos ON cuenta TYPE int DEFAULT 0;',
  'DEFINE FIELD IF NOT EXISTS bloqueado_hasta ON cuenta TYPE option<datetime>;',
  'DEFINE TABLE IF NOT EXISTS intento_login SCHEMAFULL PERMISSIONS NONE;',
  'DEFINE FIELD IF NOT EXISTS ip_hash ON intento_login TYPE string;',
  'DEFINE FIELD IF NOT EXISTS intentos ON intento_login TYPE int DEFAULT 0;',
  'DEFINE FIELD IF NOT EXISTS bloqueado_hasta ON intento_login TYPE option<datetime>;',
  'DEFINE FIELD IF NOT EXISTS actualizado_el ON intento_login TYPE datetime VALUE time::now();',
  'DEFINE INDEX IF NOT EXISTS intento_login_ip_unico ON intento_login FIELDS ip_hash UNIQUE;',
  'DEFINE FIELD IF NOT EXISTS creado_el ON cuenta TYPE datetime DEFAULT time::now();',
  'DEFINE FIELD IF NOT EXISTS actualizado_el ON cuenta TYPE datetime VALUE time::now();',
  'DEFINE INDEX IF NOT EXISTS cuenta_usuario_unico ON cuenta FIELDS usuario UNIQUE;',
];

async function main() {
  const env = cargarEnv();
  const cfg = configDe(env);

  console.log('[cuentas] preparando esquema…');
  for (const sentencia of ESQUEMA) {
    try {
      await consulta(cfg, sentencia);
    } catch (err) {
      const mensaje = String(err?.message || err);
      if (/already exists|already contains/i.test(mensaje)) continue;
      throw err;
    }
  }
  console.log('[cuentas] esquema listo.');

  const temporales = [];

  for (const cuenta of CUENTAS) {
    const existentes = await consulta(cfg, `SELECT id, usuario, session_version FROM cuenta WHERE usuario = ${lit(cuenta.usuario)} LIMIT 1;`);
    const yaExiste = Array.isArray(existentes) && existentes.length > 0;

    if (yaExiste && !forzar) {
      console.log(`[cuentas] ${cuenta.usuario}: ya existe, se conserva.`);
      continue;
    }

    const clave = claveTemporal();
    const hash = await hashClave(cfg, clave);
    const cifrado = cifrar(hash, cfg.secreto);
    if (yaExiste) {
      const id = String(existentes[0].id);
      const versionSesion = (Number(existentes[0].session_version) || 0) + 1;
      await consulta(cfg, `UPDATE type::thing(${lit(id)}) SET
        nombre = ${lit(cuenta.nombre)},
        rol = ${lit(cuenta.rol)},
        activo = true,
        hash_cifrado = ${lit(cifrado)},
        debe_cambiar_clave = true,
        session_version = ${versionSesion};`);
      console.log(`[cuentas] ${cuenta.usuario}: actualizada (--forzar).`);
    } else {
      await consulta(cfg, `CREATE cuenta CONTENT {
        usuario: ${lit(cuenta.usuario)},
        nombre: ${lit(cuenta.nombre)},
        correo: NONE,
        telefono: NONE,
        rol: ${lit(cuenta.rol)},
        activo: true,
        hash_cifrado: ${lit(cifrado)},
        foto: NONE,
        debe_cambiar_clave: true,
        session_version: 0
      };`);
      console.log(`[cuentas] ${cuenta.usuario}: creada.`);
    }
    temporales.push({ usuario: cuenta.usuario, clave });
  }

  if (temporales.length) {
    console.log('\n[cuentas] Claves temporales (se muestran una sola vez):');
    for (const t of temporales) console.log(`  ${t.usuario}: ${t.clave}`);
    console.log('[cuentas] Cada cuenta deberá cambiar la clave al entrar.\n');
  }

  const total = await consulta(cfg, 'SELECT count() AS total FROM cuenta GROUP ALL;');
  console.log('[cuentas] total en la tabla:', Array.isArray(total) ? total[0]?.total : total);
}

main().catch((err) => {
  console.error('[cuentas] error:', err?.message || err);
  process.exitCode = 1;
});
