// Utilidades compartidas por las pruebas E2E.
import fs from 'node:fs';

export const RUTA_ENV = new URL('../.env', import.meta.url);
export const RUTA_CUENTAS = new URL('./.cuentas.json', import.meta.url);
export const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://mvc-pdi.vercel.app';

export function cargarEnv() {
  const env = {};
  for (const linea of fs.readFileSync(RUTA_ENV, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

export function leerCuentas() {
  return JSON.parse(fs.readFileSync(RUTA_CUENTAS, 'utf8'));
}

export function cuentas() {
  return leerCuentas();
}
