import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configDe, consulta } from '../_cuentaBase.mjs';

function cargarEnv() {
  const env = { ...process.env };
  const ruta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../pdi-astro/.env');
  if (fs.existsSync(ruta)) {
    for (const linea of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const archivo = process.argv[2] || '001_solicitud_recuperacion.surql';
const ruta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), archivo);
const sql = fs.readFileSync(ruta, 'utf8');
const cfg = configDe(cargarEnv());

console.log(`Aplicando ${archivo} en ${cfg.ns}/${cfg.db}...`);
const resultado = await consulta(cfg, sql);
console.log('OK', JSON.stringify(resultado));
