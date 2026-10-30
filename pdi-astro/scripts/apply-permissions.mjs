#!/usr/bin/env node
/**
 * Script para ejecutar migraciones de permisos en SurrealDB
 * Uso: node apply-permissions.mjs
 * 
 * Requiere:
 * - Credenciales OWNER en .env (SURREAL_USER + SURREAL_PASS)
 * - npm install surrealdb
 */

import { Surreal } from 'surrealdb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ No se encontró .env en la raíz del proyecto');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && key.trim() && !key.startsWith('#')) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const URL = env.PUBLIC_SURREAL_URL;
const NS = env.PUBLIC_SURREAL_NS;
const DB = env.PUBLIC_SURREAL_DB;
const USER = env.SURREAL_USER;
const PASS = env.SURREAL_PASS;

if (!URL || !NS || !DB || !USER || !PASS) {
  console.error('❌ Faltan credenciales en .env');
  console.error('Requiere: PUBLIC_SURREAL_URL, PUBLIC_SURREAL_NS, PUBLIC_SURREAL_DB, SURREAL_USER, SURREAL_PASS');
  process.exit(1);
}

console.log('🔧 Conectando a SurrealDB...');
console.log(`   URL: ${URL}`);
console.log(`   Namespace: ${NS}`);
console.log(`   Database: ${DB}`);

const db = new Surreal();

async function main() {
  try {
    // Conectar
    await db.connect(URL);
    console.log('✅ Conectado a SurrealDB');

    // Autenticar con credenciales OWNER
    await db.authenticate({
      namespace: NS,
      database: DB,
      username: USER,
      password: PASS,
    });
    console.log('✅ Autenticado');

    // Seleccionar BD
    await db.use({ namespace: NS, database: DB });
    console.log('✅ BD seleccionada');

    // Leer el script SQL
    const sqlPath = path.join(__dirname, 'permisos-web-corregido.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ No se encontró ${sqlPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

    console.log(`\n📝 Ejecutando ${statements.length} comandos...`);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;

      try {
        console.log(`   ⏳ ${trimmed.substring(0, 80)}...`);
        const result = await db.query(trimmed);
        console.log(`   ✅ OK`);
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        // Continuar con el siguiente
      }
    }

    console.log('\n✅ Migración completada');
    console.log('\n📊 Estado final de la BD:');
    const info = await db.query('INFO FOR DB;');
    console.log(info);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
