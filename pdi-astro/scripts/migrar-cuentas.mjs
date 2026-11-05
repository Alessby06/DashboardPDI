#!/usr/bin/env node
// ===========================================================================
//  MIGRACIÓN DE CUENTAS
// ===========================================================================
//  Crea la tabla `cuenta` y siembra las cinco cuentas actuales con su misma
//  contraseña (marcha blanca). La contraseña no se guarda en claro: se genera
//  un hash Argon2id en SurrealDB y se cifra antes de escribir.
//
//  Uso:
//    node scripts/migrar-cuentas.mjs
//    node scripts/migrar-cuentas.mjs --forzar   (reescribe las existentes)
//
//  Requiere pdi-astro/.env con SURREAL_USER / SURREAL_PASS. El cifrado de los
//  hashes deriva de SURREAL_PASS: si esa contraseña cambia, hay que volver a
//  ejecutar esta migración con --forzar para re-cifrar las cuentas.
//
//  Las claves de demostración viven aquí solo para la marcha blanca. Al pasar
//  a producción hay que retirar este archivo (o vaciar CUENTAS) y rotar las
//  contraseñas desde administración.
// ===========================================================================
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { configDe, consulta, hashClave, cifrar } from '../../api/_cuentaBase.mjs';

const CUENTAS = [
  { usuario: 'coordinacion', clave: 'coord2024', rol: 'coord', nombre: 'Coordinación General' },
  { usuario: 'facilitadora', clave: 'facil2024', rol: 'facilitadora', nombre: 'Facilitadora Nutricional' },
  { usuario: 'promotora', clave: 'promo2024', rol: 'promotora', nombre: 'Promotora Educativa' },
  { usuario: 'social', clave: 'social2024', rol: 'social', nombre: 'Trabajadora Social' },
  { usuario: 'admin', clave: 'admin2024', rol: 'admin', nombre: 'Administrador TI' },
];

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

  for (const cuenta of CUENTAS) {
    const existentes = await consulta(cfg, `SELECT id, usuario FROM cuenta WHERE usuario = ${lit(cuenta.usuario)} LIMIT 1;`);
    const yaExiste = Array.isArray(existentes) && existentes.length > 0;

    if (yaExiste && !forzar) {
      console.log(`[cuentas] ${cuenta.usuario}: ya existe, se conserva.`);
      continue;
    }

    const hash = await hashClave(cfg, cuenta.clave);
    const cifrado = cifrar(hash, cfg.secreto);
    if (yaExiste) {
      const id = String(existentes[0].id);
      await consulta(cfg, `UPDATE type::thing(${lit(id)}) SET
        nombre = ${lit(cuenta.nombre)},
        rol = ${lit(cuenta.rol)},
        activo = true,
        hash_cifrado = ${lit(cifrado)},
        debe_cambiar_clave = false;`);
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
        debe_cambiar_clave: false
      };`);
      console.log(`[cuentas] ${cuenta.usuario}: creada.`);
    }
  }

  const total = await consulta(cfg, 'SELECT count() AS total FROM cuenta GROUP ALL;');
  console.log('[cuentas] total en la tabla:', Array.isArray(total) ? total[0]?.total : total);
}

main().catch((err) => {
  console.error('[cuentas] error:', err?.message || err);
  process.exitCode = 1;
});
