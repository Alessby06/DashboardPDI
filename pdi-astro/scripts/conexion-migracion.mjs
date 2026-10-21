// ===========================================================================
//  Conexión de los scripts de migración
// ===========================================================================
//  La base ya no acepta contraseñas desde el cliente: el navegador pide un
//  token de sesión al servidor (api/pdi.mjs) y se autentica con ese token.
//  Los scripts de migración usan la misma vía, para que haya una sola manera
//  de entrar y un solo lugar donde viven las credenciales.
//
//  Dos niveles de permiso, porque son dos cuentas distintas:
//
//    - pdi_web  (SURREAL_USER / SURREAL_PASS): opera sobre las tablas. Sirve
//      para las migraciones de DATOS.
//    - pdi_app  (SURREAL_ADMIN_USER / SURREAL_ADMIN_PASS): administra. Es la
//      unica que puede cambiar el esquema.
//
//  Si un script de esquema no encuentra la cuenta de administracion, lo dice
//  claro y no intenta nada: un "DEFINED FIELD" a medias es peor que no hacer
//  nada.
//
//  Uso:
//    import { conectarMigracion } from './conexion-migracion.mjs';
//    const db = await conectarMigracion({ esquema: true });
// ===========================================================================
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Surreal } from 'surrealdb';
import { emitirToken } from '../src/scripts/server/tokenBase.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');

/** Lee el .env del proyecto: acepta PUBLIC_ y las variables del servidor. */
export function leerEnv() {
  const env = {};
  const texto = readFileSync(resolve(RAIZ, '.env'), 'utf8');
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
  return env;
}

/**
 * Abre la base con la cuenta que corresponda.
 * @param {{esquema?: boolean}} opciones - esquema:true pide la cuenta de
 *        administracion, que es la unica que puede definir campos.
 */
export async function conectarMigracion({ esquema = false } = {}) {
  const env = leerEnv();
  const url = env.PUBLIC_SURREAL_URL;
  const ns = env.PUBLIC_SURREAL_NS;
  const dbNombre = env.PUBLIC_SURREAL_DB;
  if (!url || !ns || !dbNombre) {
    throw new Error('Faltan PUBLIC_SURREAL_URL / PUBLIC_SURREAL_NS / PUBLIC_SURREAL_DB en el .env');
  }

  const user = esquema
    ? (env.SURREAL_ADMIN_USER || env.PDI_APP_USER)
    : env.SURREAL_USER;
  const pass = esquema
    ? (env.SURREAL_ADMIN_PASS || env.PDI_APP_PASS)
    : env.SURREAL_PASS;

  if (!user || !pass) {
    if (esquema) {
      throw new Error(
        'Este script cambia el esquema y necesita una cuenta con ese permiso (pdi_app). '
        + 'Define SURREAL_ADMIN_USER y SURREAL_ADMIN_PASS en el .env, o ejecutalo donde esten.',
      );
    }
    throw new Error('Faltan SURREAL_USER / SURREAL_PASS en el .env');
  }

  const { token } = await emitirToken({ url, ns, db: dbNombre, user, pass });
  const db = new Surreal();
  await db.connect(url);
  await db.authenticate(token, { namespace: ns, database: dbNombre });
  return db;
}
