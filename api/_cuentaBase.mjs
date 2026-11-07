// ===========================================================================
//  CUENTAS DE LA APLICACIÓN
// ===========================================================================
//  Login real, sesión de servidor y perfil. Vive en api/ para que la Function
//  de Vercel y el middleware de desarrollo compartan exactamente la misma
//  lógica.
//
//  Modelo de seguridad:
//    - La contraseña se guarda como hash Argon2id generado por SurrealDB.
//    - Ese hash se cifra con AES-256-GCM usando un secreto derivado de la
//      contraseña del servidor de base de datos, que nunca llega al navegador.
//      OJO: el navegador comparte hoy el usuario de base con los datos
//      clínicos; por eso puede leer y escribir `cuenta` aunque la tabla esté
//      en PERMISSIONS NONE. Aislar `cuenta` en otra base es el paso pendiente.
//    - La sesión es una cookie HttpOnly firmada con HMAC-SHA256, de 8 horas
//      deslizantes. El navegador no puede leerla ni modificarla.
//    - La recuperación es una clave temporal generada desde administración.
// ===========================================================================
import crypto from 'node:crypto';

const DURACION_SESION_MS = 8 * 60 * 60 * 1000;
// La cookie se renueva con la actividad, pero ninguna sesión puede superar
// este tope absoluto desde el login. Evita que una cookie robada viva para
// siempre mientras la víctima siga navegando.
const DURACION_MAXIMA_SESION_MS = 12 * 60 * 60 * 1000;
const NOMBRE_COOKIE = 'pdi_cuenta';
const MAX_INTENTOS = 8;
const BLOQUEO_INTENTOS_MS = 15 * 60 * 1000;
const MAX_FOTO_BYTES = 160 * 1024;

/** Secreto de firma/cifrado. Nunca sale del servidor. */
export function secretoDe(env = {}) {
  // Secreto propio de las cuentas. No depende de la contraseña de la base:
  // rotar `pdi_web` no debe dejar ilegibles los hashes.
  const dedicado = String(env.CUENTAS_SECRETO || '').trim();
  if (dedicado) return 'pdi-cuentas-v1:' + dedicado;

  // Compatibilidad con el esquema anterior mientras se ejecuta la migración.
  const base = String(env.SURREAL_PASS || '').trim();
  if (!base) {
    throw new Error('Falta CUENTAS_SECRETO (o SURREAL_PASS en el esquema anterior).');
  }
  return 'pdi-auth-v1:' + base;
}

/** Configuración de la base de cuentas. */
export function configDe(env = {}) {
  const url = String(
    env.SURREAL_AUTH_URL || env.SURREAL_URL || env.PUBLIC_SURREAL_URL || '',
  )
    .trim()
    .replace(/^ws:/, 'http:')
    .replace(/^wss:/, 'https:')
    .replace(/\/+$/, '');
  const cfg = {
    url,
    ns: env.SURREAL_AUTH_NS || env.SURREAL_NS || env.PUBLIC_SURREAL_NS,
    db: env.SURREAL_AUTH_DB || env.SURREAL_DB || env.PUBLIC_SURREAL_DB,
    user: env.SURREAL_AUTH_USER || env.SURREAL_USER,
    pass: env.SURREAL_AUTH_PASS || env.SURREAL_PASS,
    secreto: secretoDe(env),
  };
  if (!cfg.url || !cfg.ns || !cfg.db || !cfg.user || !cfg.pass) {
    throw new Error('Faltan credenciales de la base de cuentas en el servidor.');
  }
  return cfg;
}

// --- Cifrado del hash -------------------------------------------------------

function claveAes(secreto) {
  return crypto.createHash('sha256').update(String(secreto)).digest();
}

export function cifrar(texto, secreto) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', claveAes(secreto), iv);
  const datos = Buffer.concat([cipher.update(String(texto), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), datos.toString('base64url')].join('.');
}

export function descifrar(paquete, secreto) {
  const partes = String(paquete || '').split('.');
  if (partes.length !== 4 || partes[0] !== 'v1') throw new Error('Hash ilegible');
  const iv = Buffer.from(partes[1], 'base64url');
  const tag = Buffer.from(partes[2], 'base64url');
  const datos = Buffer.from(partes[3], 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', claveAes(secreto), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(datos), decipher.final()]).toString('utf8');
}

// --- TOTP (segundo factor) --------------------------------------------------

const ALFABETO_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Codificar(buffer) {
  let bits = 0;
  let valor = 0;
  let salida = '';
  for (const byte of buffer) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      salida += ALFABETO_BASE32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) salida += ALFABETO_BASE32[(valor << (5 - bits)) & 31];
  return salida;
}

function base32Decodificar(texto) {
  const limpio = String(texto || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let valor = 0;
  const bytes = [];
  for (const caracter of limpio) {
    const indice = ALFABETO_BASE32.indexOf(caracter);
    if (indice < 0) continue;
    valor = (valor << 5) | indice;
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generarSecretoTotp() {
  return base32Codificar(crypto.randomBytes(20));
}

/** Comparación en tiempo constante: un `===` filtra por el primer dígito. */
function compararCodigos(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function codigoTotp(secreto, instante = Date.now()) {
  const contador = Math.floor(instante / 30000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(contador));
  const hmac = crypto.createHmac('sha1', base32Decodificar(secreto)).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const valor = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(valor).padStart(6, '0');
}

/**
 * Verifica un código y devuelve el paso usado, o null.
 * - Acepta solo el paso actual y el anterior (tolera relojes atrasados).
 * - Nunca acepta un paso ya consumido: el llamador guarda el contador.
 */
export function verificarTotp(secreto, codigo, ultimoContador = 0, instante = Date.now()) {
  const limpio = String(codigo || '').replace(/\D/g, '');
  if (limpio.length !== 6) return null;
  const actual = Math.floor(instante / 30000);
  const usados = Number(ultimoContador) || 0;
  for (const delta of [0, -1]) {
    const contador = actual + delta;
    if (contador <= usados) continue;
    if (compararCodigos(codigoTotp(secreto, contador * 30000), limpio)) return contador;
  }
  return null;
}

// --- Sesión -----------------------------------------------------------------

function firma(payload, secreto) {
  return crypto.createHmac('sha256', String(secreto)).update(payload).digest('base64url');
}

export function firmarSesion(datos, secreto) {
  const payload = Buffer.from(JSON.stringify(datos), 'utf8').toString('base64url');
  return `${payload}.${firma(payload, secreto)}`;
}

export function verificarSesion(token, secreto) {
  const partes = String(token || '').split('.');
  if (partes.length !== 2) return null;
  const [payload, recibida] = partes;
  const esperada = firma(payload, secreto);
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!datos || !datos.sub || !datos.exp || Number(datos.exp) <= Date.now()) return null;
    return datos;
  } catch {
    return null;
  }
}

// --- Validaciones -----------------------------------------------------------

export function validarUsuario(valor) {
  const usuario = String(valor || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(usuario)) {
    return { ok: false, usuario, error: 'El usuario debe tener entre 3 y 32 caracteres: letras minúsculas, números, punto, guion o guion bajo.' };
  }
  return { ok: true, usuario, error: '' };
}

export function validarClave(valor) {
  const clave = String(valor || '');
  if (clave.length < 10) return 'La contraseña debe tener al menos 10 caracteres.';
  if (clave.length > 128) return 'La contraseña no puede superar los 128 caracteres.';
  if (!clave.trim()) return 'La contraseña no puede ser solo espacios.';
  return '';
}

export function validarNombre(valor) {
  const nombre = String(valor || '').trim().replace(/\s+/g, ' ');
  if (nombre.length < 2 || nombre.length > 80) return { ok: false, nombre, error: 'El nombre debe tener entre 2 y 80 caracteres.' };
  return { ok: true, nombre, error: '' };
}

export function validarCorreo(valor) {
  const correo = String(valor || '').trim().toLowerCase();
  if (!correo) return { ok: true, correo: '', error: '' };
  if (correo.length > 120 || !/^[^\s@]+@[^\s@]+\.(com|org|pe)$/.test(correo)) {
    return { ok: false, correo, error: 'El correo debe tener @ y terminar en .com, .org o .pe.' };
  }
  return { ok: true, correo, error: '' };
}

export function validarTelefono(valor) {
  const crudo = String(valor || '').trim();
  if (!crudo) return { ok: true, telefono: '', error: '' };
  const telefono = crudo.replace(/\D/g, '');
  if (!/^9\d{8}$/.test(telefono)) {
    return { ok: false, telefono: crudo, error: 'El teléfono debe tener 9 dígitos y empezar con 9.' };
  }
  return { ok: true, telefono, error: '' };
}

// --- SurrealDB --------------------------------------------------------------

let cacheToken = null;

async function tokenDe(cfg) {
  const claveCache = cfg.url + '|' + cfg.ns + '|' + cfg.db + '|' + cfg.user;
  if (cacheToken && cacheToken.clave === claveCache && cacheToken.exp > Date.now() + 60_000) {
    return cacheToken.token;
  }
  const res = await fetch(cfg.url + '/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ user: cfg.user, pass: cfg.pass, ns: cfg.ns, db: cfg.db }),
  });
  if (!res.ok) throw new Error('El servidor no pudo autenticarse contra la base (' + res.status + ').');
  const datos = await res.json();
  if (!datos?.token) throw new Error('La base no devolvió un token de servicio.');
  // El token de `pdi_auth` vive 15 minutos: se renueva a los 10, no a los 20.
  cacheToken = { token: datos.token, exp: Date.now() + 10 * 60 * 1000, clave: claveCache };
  return datos.token;
}

/** Ejecuta SurrealQL y devuelve el resultado de la última sentencia correcta. */
export async function consulta(cfg, sql) {
  const token = await tokenDe(cfg);
  const res = await fetch(cfg.url + '/sql', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'surreal-ns': cfg.ns,
      'surreal-db': cfg.db,
      'Content-Type': 'text/plain',
      Accept: 'application/json',
    },
    body: sql,
  });
  const texto = await res.text();
  let datos;
  try { datos = JSON.parse(texto); } catch { throw new Error('Respuesta ilegible de la base.'); }
  if (!Array.isArray(datos)) {
    throw new Error(String(datos?.details || datos?.error || 'Error de base de datos.'));
  }
  const error = datos.find((d) => d && d.status === 'ERR');
  if (error) throw new Error(String(error.result || 'Error de base de datos.'));
  const ultimo = [...datos].reverse().find((d) => d && d.status === 'OK');
  return ultimo ? ultimo.result : null;
}

/** Literal seguro para interpolar valores controlados en SurrealQL. */
function lit(valor) {
  if (valor === null || valor === undefined || valor === '') return 'NONE';
  if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : 'NONE';
  if (typeof valor === 'boolean') return valor ? 'true' : 'false';
  return JSON.stringify(String(valor));
}

export async function hashClave(cfg, clave) {
  return String(await consulta(cfg, `RETURN crypto::argon2::generate(${lit(clave)});`));
}

export async function compararClave(cfg, hash, clave) {
  return Boolean(await consulta(cfg, `RETURN crypto::argon2::compare(${lit(hash)}, ${lit(clave)});`));
}

// --- Utilidades HTTP --------------------------------------------------------

function json(datos, status = 200, cookies = []) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(datos), { status, headers });
}

function leerCookie(request, nombre) {
  const raw = request.headers.get('cookie') || '';
  for (const parte of raw.split(';')) {
    const i = parte.indexOf('=');
    if (i < 0) continue;
    if (parte.slice(0, i).trim() === nombre) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return null;
}

function cookieSesion(request, datos, cfg) {
  const token = firmarSesion(datos, cfg.secreto);
  const seguro = new URL(request.url).protocol === 'https:';
  return `${NOMBRE_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(DURACION_SESION_MS / 1000)}${seguro ? '; Secure' : ''}`;
}

function cookieBorrada() {
  return `${NOMBRE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function ipDe(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'local';
}

/** Identificador estable de la IP, sin guardar la dirección en claro. */
function ipHash(ip) {
  return crypto.createHash('sha256').update(String(ip || 'local')).digest('hex').slice(0, 32);
}

/** Minutos que quedan de bloqueo; 0 si no hay bloqueo vigente. */
function minutosDeBloqueo(valor) {
  if (!valor) return 0;
  const instante = new Date(valor).getTime();
  if (!Number.isFinite(instante)) return 0;
  return instante > Date.now() ? Math.ceil((instante - Date.now()) / 60000) : 0;
}

/** Cuenta los intentos de una IP; al llegar al límite la bloquea 15 min. */
async function registrarIntentoIp(cfg, ip, exito) {
  const hash = ipHash(ip);
  const filas = await consulta(cfg, `SELECT id, intentos FROM intento_login WHERE ip_hash = ${lit(hash)} LIMIT 1;`);
  const fila = Array.isArray(filas) && filas.length ? filas[0] : null;

  if (exito) {
    if (fila) {
      await consulta(cfg, `UPDATE ${idRegistro(String(fila.id))} SET intentos = 0, bloqueado_hasta = NONE;`);
    }
    return;
  }

  const intentos = (Number(fila?.intentos) || 0) + 1;
  const bloqueo = intentos >= MAX_INTENTOS
    ? `time::now() + ${Math.floor(BLOQUEO_INTENTOS_MS / 1000)}s`
    : 'NONE';
  if (fila) {
    await consulta(cfg, `UPDATE ${idRegistro(String(fila.id))} SET intentos = ${intentos}, bloqueado_hasta = ${bloqueo};`);
  } else {
    await consulta(cfg, `CREATE intento_login CONTENT {
      ip_hash: ${lit(hash)},
      intentos: ${intentos},
      bloqueado_hasta: ${bloqueo},
      actualizado_el: time::now()
    };`);
  }
}

/** Cuenta los fallos de una cuenta concreta; bloquea al llegar al límite. */
async function registrarIntentoCuenta(cfg, cuenta, exito) {
  if (exito) {
    await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET intentos_fallidos = 0, bloqueado_hasta = NONE;`);
    return;
  }
  const intentos = (Number(cuenta.intentos_fallidos) || 0) + 1;
  const bloqueo = intentos >= MAX_INTENTOS
    ? `time::now() + ${Math.floor(BLOQUEO_INTENTOS_MS / 1000)}s`
    : 'NONE';
  await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET intentos_fallidos = ${intentos}, bloqueado_hasta = ${bloqueo};`);
}

async function ipBloqueada(cfg, ip) {
  const hash = ipHash(ip);
  const filas = await consulta(cfg, `SELECT bloqueado_hasta FROM intento_login WHERE ip_hash = ${lit(hash)} LIMIT 1;`);
  return Array.isArray(filas) && filas.length ? minutosDeBloqueo(filas[0].bloqueado_hasta) : 0;
}

function origenValido(request) {
  const origen = request.headers.get('origin');
  if (!origen) return true;
  try { return new URL(origen).host === new URL(request.url).host; } catch { return false; }
}

async function cuerpo(request) {
  const largo = Number(request.headers.get('content-length') || 0);
  if (largo > 2 * 1024 * 1024) throw new Error('La petición es demasiado grande.');
  const texto = await request.text();
  if (texto.length > 2 * 1024 * 1024) throw new Error('La petición es demasiado grande.');
  if (!texto) return {};
  try { return JSON.parse(texto); } catch { throw new Error('El cuerpo no es JSON válido.'); }
}

/** Id de registro seguro para SurrealQL (`cuenta:abc123`). */
function idRegistro(id) {
  const texto = String(id || '');
  if (!/^[a-z_]+:[A-Za-z0-9]+$/.test(texto)) throw new Error('Identificador de cuenta no válido.');
  return texto;
}

async function cuentaPorId(cfg, id) {
  const fila = await consulta(cfg, `SELECT * FROM ${idRegistro(id)} LIMIT 1;`);
  return Array.isArray(fila) && fila.length ? fila[0] : null;
}

async function cuentaPorUsuario(cfg, usuario) {
  const fila = await consulta(cfg, `SELECT * FROM cuenta WHERE usuario = ${lit(usuario)} LIMIT 1;`);
  return Array.isArray(fila) && fila.length ? fila[0] : null;
}

function publica(cuenta) {
  return {
    id: String(cuenta.id),
    usuario: cuenta.usuario,
    nombre: cuenta.nombre,
    correo: cuenta.correo || '',
    telefono: cuenta.telefono || '',
    rol: cuenta.rol,
    foto: cuenta.foto || '',
    debeCambiarClave: Boolean(cuenta.debe_cambiar_clave),
    totpActivo: Boolean(cuenta.totp_activo),
    creadoEl: cuenta.creado_el || null,
  };
}

function datosSesion(cuenta, emitida = Date.now()) {
  return {
    sub: String(cuenta.id),
    usuario: cuenta.usuario,
    rol: cuenta.rol,
    nombre: cuenta.nombre,
    // Versión de sesión: se incrementa al cambiar o restablecer la contraseña.
    // Las cookies anteriores dejan de valer en cuanto el número no coincide.
    sv: Number(cuenta.session_version || 0),
    // Instante del login. No se renueva con la actividad: marca el tope
    // absoluto de 12 horas.
    iat: Number(emitida) || Date.now(),
    exp: Date.now() + DURACION_SESION_MS,
  };
}

async function auditar(cfg, cuenta, accion, detalle, diff = null, ip = '') {
  try {
    // El esquema de bitacora_auditoria no admite claves libres dentro de
    // `diff`; el resumen legible va en `detalle` y el diff se deja vacío.
    const cambios = Array.isArray(diff) && diff.length
      ? ' Cambios: ' + diff.map((d) => {
          const antes = d.antes === '' || d.antes === null || d.antes === undefined ? '(vacío)' : d.antes;
          const despues = d.despues === '' || d.despues === null || d.despues === undefined ? '(vacío)' : d.despues;
          return `${d.campo} de "${antes}" a "${despues}"`;
        }).join('; ') + '.'
      : '';
    await consulta(cfg, `CREATE bitacora_auditoria CONTENT {
      usuario_nombre: ${lit(cuenta.nombre)},
      rol: ${lit(cuenta.rol)},
      accion: ${lit(accion)},
      entidad: 'PDI - Perfil',
      registro_id: ${lit(String(cuenta.id))},
      detalle: ${lit(detalle + cambios)},
      ip_origen: ${lit(ip)},
      sede_nombre: 'Central',
      diff: NONE
    };`);
  } catch (err) {
    console.error('[cuenta] no se pudo auditar:', err?.message || err);
  }
}

async function sesionDe(request, cfg) {
  const token = leerCookie(request, NOMBRE_COOKIE);
  const datos = verificarSesion(token, cfg.secreto);
  if (!datos) return null;

  // Un fallo de base NO es una sesión inválida: debe propagarse para que el
  // llamador responda 5xx sin borrar la cookie. Si se confundieran, una caída
  // transitoria de SurrealDB cerraría la sesión de todos los usuarios.
  // Las cookies anteriores no llevaban `iat`. Se les da una ventana nueva
  // cuando el servidor las reemite; no se pueden prolongar más de 12 h.
  const emitida = Number(datos.iat) || 0;
  if (emitida && Date.now() - emitida > DURACION_MAXIMA_SESION_MS) return null;

  const cuenta = await cuentaPorId(cfg, datos.sub);
  if (!cuenta || cuenta.activo === false) return null;
  if (Number(datos.sv || 0) !== Number(cuenta.session_version || 0)) return null;
  return { cuenta, datos };
}

/**
 * Comprueba la cookie de sesión sin devolver datos de la cuenta. La usa el
 * endpoint que entrega el token de base de datos: sin sesión no hay token.
 */
export async function sesionValida(request, env = {}) {
  const cfg = configDe(env);
  return Boolean(await sesionDe(request, cfg));
}

/** Una clave temporal solo permite iniciar sesión y cambiarla. */
function bloqueoClaveTemporal(cuenta) {
  if (!cuenta?.debe_cambiar_clave) return null;
  return json({
    ok: false,
    error: 'Debes cambiar la contraseña temporal antes de continuar.',
    cambioClaveRequerido: true,
  }, 403);
}

// --- Acciones ---------------------------------------------------------------

async function login(request, cfg) {
  if (!origenValido(request)) return json({ ok: false, error: 'Origen no permitido.' }, 403);
  const ip = ipDe(request);

  // El bloqueo por IP y por cuenta vive en la base de cuentas: sobrevive a
  // reinicios y se comparte entre instancias. El mensaje no revela si el
  // usuario existe.
  if (await ipBloqueada(cfg, ip)) {
    return json({ ok: false, error: 'Demasiados intentos. Espera 15 minutos antes de volver a probar.' }, 429);
  }

  const { usuario, clave, codigo } = await cuerpo(request);
  const limpio = String(usuario || '').trim().toLowerCase();
  if (!limpio || !clave) return json({ ok: false, error: 'Escribe tu usuario y tu contraseña.' }, 400);

  const cuenta = await cuentaPorUsuario(cfg, limpio);
  const generico = 'Usuario o contraseña incorrectos.';
  if (!cuenta || cuenta.activo === false) {
    await registrarIntentoIp(cfg, ip, false);
    return json({ ok: false, error: generico }, 401);
  }
  if (minutosDeBloqueo(cuenta.bloqueado_hasta)) {
    return json({ ok: false, error: 'Demasiados intentos. Espera 15 minutos o pide a administración que desbloquee la cuenta.' }, 429);
  }

  let hash;
  try { hash = descifrar(cuenta.hash_cifrado, cfg.secreto); } catch { return json({ ok: false, error: generico }, 401); }
  if (!(await compararClave(cfg, hash, String(clave)))) {
    await registrarIntentoCuenta(cfg, cuenta, false);
    await registrarIntentoIp(cfg, ip, false);
    return json({ ok: false, error: generico }, 401);
  }

  if (cuenta.totp_activo) {
    if (!codigo) {
      // Primera etapa: la contraseña es correcta, falta el segundo factor.
      // No cuenta como intento fallido ni entrega cookie.
      return json({
        ok: false,
        requiereTotp: true,
        error: 'Escribe el código de 6 dígitos de tu aplicación de autenticación.',
      }, 401);
    }
    let secreto;
    try {
      secreto = descifrar(cuenta.totp_secret, cfg.secreto);
    } catch {
      // Fallo cerrado: un secreto ilegible no puede convertirse en una clave
      // vacía y predecible. Sin secreto no hay forma de verificar.
      await auditar(cfg.auditoria || cfg, cuenta, 'MFA ilegible', 'No se pudo descifrar el secreto de verificación.', null, ip);
      return json({ ok: false, error: 'No se pudo verificar el segundo factor. Avisa a administración.' }, 500);
    }
    const contador = verificarTotp(secreto, codigo, cuenta.totp_ultimo_contador);
    if (!contador) {
      await registrarIntentoCuenta(cfg, cuenta, false);
      await registrarIntentoIp(cfg, ip, false);
      return json({
        ok: false,
        requiereTotp: true,
        error: 'El código no es correcto, ya se usó o expiró.',
      }, 401);
    }
    // Consumo atómico: dos inicios simultáneos con el mismo código no pueden
    // pasar los dos. La condición se evalúa dentro del propio UPDATE.
    const reclamado = await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET
      totp_ultimo_contador = ${contador}
      WHERE (totp_ultimo_contador IS NONE OR totp_ultimo_contador < ${contador})
      RETURN AFTER;`);
    if (!Array.isArray(reclamado) || !reclamado.length) {
      return json({
        ok: false,
        requiereTotp: true,
        error: 'Ese código ya se usó. Espera al siguiente.',
      }, 401);
    }
  }

  await registrarIntentoCuenta(cfg, cuenta, true);
  await registrarIntentoIp(cfg, ip, true);
  const sesion = datosSesion(cuenta);
  return json({
    ok: true,
    usuario: cuenta.usuario,
    nombre: cuenta.nombre,
    rol: cuenta.rol,
    foto: cuenta.foto || '',
    exp: sesion.exp,
    debeCambiarClave: Boolean(cuenta.debe_cambiar_clave),
  }, 200, [cookieSesion(request, sesion, cfg)]);
}

async function sesion(request, cfg) {
  const actual = await sesionDe(request, cfg);
  if (!actual) return json({ ok: false }, 401, [cookieBorrada()]);
  const nueva = datosSesion(actual.cuenta, actual.datos.iat);
  return json({ ok: true, cuenta: publica(actual.cuenta), exp: nueva.exp }, 200, [cookieSesion(request, nueva, cfg)]);
}

async function perfil(request, cfg) {
  const actual = await sesionDe(request, cfg);
  if (!actual) return json({ ok: false, error: 'La sesión expiró.' }, 401, [cookieBorrada()]);
  const bloqueo = bloqueoClaveTemporal(actual.cuenta);
  if (bloqueo) return bloqueo;
  const { nombre, correo, telefono } = await cuerpo(request);
  const n = validarNombre(nombre);
  if (!n.ok) return json({ ok: false, error: n.error }, 400);
  const c = validarCorreo(correo);
  if (!c.ok) return json({ ok: false, error: c.error }, 400);
  const t = validarTelefono(telefono);
  if (!t.ok) return json({ ok: false, error: t.error }, 400);

  const antes = actual.cuenta;
  const diff = [];
  if ((antes.nombre || '') !== n.nombre) diff.push({ campo: 'nombre', antes: antes.nombre, despues: n.nombre });
  if ((antes.correo || '') !== c.correo) diff.push({ campo: 'correo', antes: antes.correo || '', despues: c.correo });
  if ((antes.telefono || '') !== t.telefono) diff.push({ campo: 'telefono', antes: antes.telefono || '', despues: t.telefono });

  // Sin cambios reales no se escribe ni se audita: un guardado vacío no debe
  // dejar rastro en la bitácora ni tocar la fecha de modificación.
  if (!diff.length) {
    const nueva = datosSesion(antes, actual.datos.iat);
    return json({ ok: true, cuenta: publica(antes), exp: nueva.exp }, 200, [cookieSesion(request, nueva, cfg)]);
  }

  await consulta(cfg, `UPDATE ${idRegistro(antes.id)} SET
    nombre = ${lit(n.nombre)},
    correo = ${lit(c.correo)},
    telefono = ${lit(t.telefono)};`);

  await auditar(cfg.auditoria || cfg, antes, 'Perfil actualizado', 'Datos personales del perfil.', diff, ipDe(request));

  const cuenta = await cuentaPorId(cfg, String(antes.id));
  const nueva = datosSesion(cuenta, actual.datos.iat);
  return json({ ok: true, cuenta: publica(cuenta), exp: nueva.exp }, 200, [cookieSesion(request, nueva, cfg)]);
}

async function usuario(request, cfg) {
  const actual = await sesionDe(request, cfg);
  if (!actual) return json({ ok: false, error: 'La sesión expiró.' }, 401, [cookieBorrada()]);
  const bloqueo = bloqueoClaveTemporal(actual.cuenta);
  if (bloqueo) return bloqueo;
  const { usuario, clave } = await cuerpo(request);
  const v = validarUsuario(usuario);
  if (!v.ok) return json({ ok: false, error: v.error }, 400);
  if (!clave) return json({ ok: false, error: 'Escribe tu contraseña actual para confirmar.' }, 400);

  const cuenta = actual.cuenta;
  let hash;
  try { hash = descifrar(cuenta.hash_cifrado, cfg.secreto); } catch { return json({ ok: false, error: 'No se pudo verificar la cuenta.' }, 500); }
  if (!(await compararClave(cfg, hash, String(clave)))) {
    // 403, no 401: la sesión es válida; lo que falla es la confirmación.
    // Un 401 haría que el cliente creyera que la sesión expiró y lo expulsara.
    return json({ ok: false, error: 'La contraseña actual no coincide.' }, 403);
  }
  if (v.usuario === cuenta.usuario) {
    return json({ ok: true, cuenta: publica(cuenta) }, 200, [cookieSesion(request, datosSesion(cuenta, actual.datos.iat), cfg)]);
  }
  const ocupado = await cuentaPorUsuario(cfg, v.usuario);
  if (ocupado) return json({ ok: false, error: 'Ese usuario ya está en uso.' }, 409);

  await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET usuario = ${lit(v.usuario)};`);
  await auditar(cfg.auditoria || cfg, cuenta, 'Usuario actualizado', 'Cambio del usuario de acceso.', [
    { campo: 'usuario', antes: cuenta.usuario, despues: v.usuario },
  ], ipDe(request));

  const fresca = await cuentaPorId(cfg, String(cuenta.id));
  return json({ ok: true, cuenta: publica(fresca) }, 200, [cookieSesion(request, datosSesion(fresca, actual.datos.iat), cfg)]);
}

async function clave(request, cfg) {
  const actual = await sesionDe(request, cfg);
  if (!actual) return json({ ok: false, error: 'La sesión expiró.' }, 401, [cookieBorrada()]);
  const { actual: claveActual, nueva } = await cuerpo(request);
  if (!claveActual) return json({ ok: false, error: 'Escribe tu contraseña actual.' }, 400);
  const errorPolitica = validarClave(nueva);
  if (errorPolitica) return json({ ok: false, error: errorPolitica }, 400);
  if (String(claveActual) === String(nueva)) return json({ ok: false, error: 'La nueva contraseña debe ser distinta de la actual.' }, 400);

  const cuenta = actual.cuenta;
  let hash;
  try { hash = descifrar(cuenta.hash_cifrado, cfg.secreto); } catch { return json({ ok: false, error: 'No se pudo verificar la cuenta.' }, 500); }
  if (!(await compararClave(cfg, hash, String(claveActual)))) {
    // 403, no 401: la sesión sigue siendo válida. El 401 está reservado para
    // una sesión ausente o caducada.
    return json({ ok: false, error: 'La contraseña actual no coincide.' }, 403);
  }

  const nuevoHash = cifrar(await hashClave(cfg, String(nueva)), cfg.secreto);
  const versionSesion = (Number(cuenta.session_version) || 0) + 1;
  await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET
    hash_cifrado = ${lit(nuevoHash)},
    debe_cambiar_clave = false,
    session_version = ${versionSesion};`);
  await auditar(cfg.auditoria || cfg, cuenta, 'Contraseña actualizada', 'Cambio de contraseña del perfil.', null, ipDe(request));

  // Las demás sesiones de esta cuenta quedan invalidadas al cambiar el número
  // de versión. La sesión actual recibe una cookie nueva con el número nuevo.
  const fresca = (await cuentaPorId(cfg, String(cuenta.id))) || {
    ...cuenta,
    session_version: versionSesion,
    debe_cambiar_clave: false,
  };
  return json({ ok: true }, 200, [cookieSesion(request, datosSesion(fresca), cfg)]);
}

async function foto(request, cfg) {
  const actual = await sesionDe(request, cfg);
  if (!actual) return json({ ok: false, error: 'La sesión expiró.' }, 401, [cookieBorrada()]);
  const bloqueo = bloqueoClaveTemporal(actual.cuenta);
  if (bloqueo) return bloqueo;
  const { foto: valor } = await cuerpo(request);
  const cuenta = actual.cuenta;

  if (valor === null || valor === undefined || valor === '') {
    if (!cuenta.foto) return json({ ok: true, foto: '' });
    await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET foto = NONE;`);
    await auditar(cfg.auditoria || cfg, cuenta, 'Foto actualizada', 'Foto de perfil retirada.', [{ campo: 'foto', antes: '(anterior)', despues: '' }], ipDe(request));
    return json({ ok: true, foto: '' });
  }

  const texto = String(valor);
  const m = texto.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return json({ ok: false, error: 'La imagen debe ser PNG, JPG o WebP.' }, 400);
  const bytes = Math.floor((m[2].length * 3) / 4);
  if (bytes > MAX_FOTO_BYTES) return json({ ok: false, error: 'La foto supera los 160 KB. Prueba con una imagen más pequeña.' }, 413);

  // Reenviar la misma foto (por ejemplo al deshacer dos veces) no es un cambio.
  if (cuenta.foto === texto) return json({ ok: true, foto: texto });

  await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET foto = ${lit(texto)};`);
  await auditar(cfg.auditoria || cfg, cuenta, 'Foto actualizada', 'Foto de perfil actualizada.', [{ campo: 'foto', antes: '(anterior)', despues: '(actualizada)' }], ipDe(request));
  return json({ ok: true, foto: texto });
}

async function totp(request, cfg) {
  const actual = await sesionDe(request, cfg);
  if (!actual) return json({ ok: false, error: 'La sesión expiró.' }, 401, [cookieBorrada()]);
  const cuenta = actual.cuenta;
  if (!['coord', 'admin'].includes(cuenta.rol)) {
    return json({ ok: false, error: 'La verificación en dos pasos solo está disponible para coordinación y administración.' }, 403);
  }

  const { accion, codigo, clave } = await cuerpo(request);

  if (accion === 'iniciar') {
    const secreto = generarSecretoTotp();
    const cifrado = cifrar(secreto, cfg.secreto);
    await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET
      totp_secret = ${lit(cifrado)},
      totp_activo = false,
      totp_ultimo_contador = NONE;`);
    const uri = `otpauth://totp/PDI:${encodeURIComponent(cuenta.usuario)}?secret=${secreto}&issuer=PDI&algorithm=SHA1&digits=6&period=30`;
    return json({ ok: true, secreto, uri });
  }

  if (accion === 'confirmar') {
    if (!cuenta.totp_secret) return json({ ok: false, error: 'Primero inicia la activación.' }, 400);
    let secreto;
    try { secreto = descifrar(cuenta.totp_secret, cfg.secreto); } catch {
      return json({ ok: false, error: 'No se pudo leer el secreto de verificación.' }, 500);
    }
    if (!verificarTotp(secreto, codigo)) {
      return json({ ok: false, error: 'El código no es correcto o ya expiró.' }, 400);
    }
    await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET totp_activo = true;`);
    await auditar(cfg.auditoria || cfg, cuenta, 'MFA activado', 'Verificación en dos pasos activada.', null, ipDe(request));
    return json({ ok: true, totpActivo: true });
  }

  if (accion === 'desactivar') {
    if (!cuenta.totp_activo) {
      return json({ ok: false, error: 'La verificación en dos pasos no está activa.' }, 400);
    }
    if (!clave) return json({ ok: false, error: 'Escribe tu contraseña actual para confirmar.' }, 400);
    if (!codigo) return json({ ok: false, error: 'Escribe el código de 6 dígitos de tu aplicación.' }, 400);
    let hash;
    try { hash = descifrar(cuenta.hash_cifrado, cfg.secreto); } catch {
      return json({ ok: false, error: 'No se pudo verificar la cuenta.' }, 500);
    }
    if (!(await compararClave(cfg, hash, String(clave)))) {
      return json({ ok: false, error: 'La contraseña actual no coincide.' }, 403);
    }
    let secreto;
    try { secreto = descifrar(cuenta.totp_secret, cfg.secreto); } catch {
      return json({ ok: false, error: 'No se pudo leer el secreto de verificación.' }, 500);
    }
    if (!verificarTotp(secreto, codigo, cuenta.totp_ultimo_contador)) {
      return json({ ok: false, error: 'El código no es correcto, ya se usó o expiró.' }, 403);
    }
    await consulta(cfg, `UPDATE ${idRegistro(cuenta.id)} SET
      totp_secret = NONE,
      totp_activo = false,
      totp_ultimo_contador = NONE;`);
    await auditar(cfg.auditoria || cfg, cuenta, 'MFA desactivado', 'Verificación en dos pasos desactivada.', null, ipDe(request));
    return json({ ok: true, totpActivo: false });
  }

  return json({ ok: false, error: 'Acción no válida.' }, 400);
}

async function logout(request) {
  return json({ ok: true }, 200, [cookieBorrada()]);
}

// --- Auditoría --------------------------------------------------------------

/**
 * La bitácora vive en el namespace de cuentas. El navegador no puede abrir ese
 * namespace, así que toda lectura y escritura pasa por aquí, con cookie de
 * sesión. No hay ruta de actualización ni borrado: solo alta y consulta.
 */
export async function handleAuditoria(request, env = {}) {
  try {
    const cfg = configDe(env);
    const actual = await sesionDe(request, cfg);
    if (!actual) return json({ ok: false, error: 'La sesión expiró.' }, 401);

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const limite = Math.min(Math.max(Number(url.searchParams.get('limit')) || 500, 1), 1000);
      const filas = await consulta(cfg, `SELECT * FROM bitacora_auditoria ORDER BY timestamp DESC LIMIT ${limite};`);
      return json({ ok: true, logs: Array.isArray(filas) ? filas : [] });
    }

    if (request.method === 'POST') {
      if (!origenValido(request)) return json({ ok: false, error: 'Origen no permitido.' }, 403);
      const entrada = await cuerpo(request);
      const accion = String(entrada.action || entrada.accion || '').trim().slice(0, 160);
      if (!accion) return json({ ok: false, error: 'La acción es obligatoria.' }, 400);
      const entidad = String(entrada.entidad || 'PDI · Sistema').slice(0, 80);
      const detalle = String(entrada.detalle || entrada.detail || '').slice(0, 1000);
      const sede = String(entrada.sede || 'Central').slice(0, 80);
      const registro = String(entrada.entity || entrada.registro || '').slice(0, 120);
      await consulta(cfg, `CREATE bitacora_auditoria CONTENT {
        usuario_nombre: ${lit(actual.cuenta.nombre || 'Sistema')},
        rol: ${lit(actual.cuenta.rol || 'Sistema')},
        accion: ${lit(accion)},
        entidad: ${lit(entidad)},
        registro_id: ${lit(registro)},
        detalle: ${lit(detalle)},
        ip_origen: ${lit(ipDe(request))},
        sede_nombre: ${lit(sede)},
        timestamp: time::now(),
        diff: NONE
      };`);
      return json({ ok: true });
    }

    return json({ ok: false, error: 'Método no permitido.' }, 405);
  } catch (err) {
    console.error('[auditoria]', err?.message || err);
    return json({ ok: false, error: 'No se pudo acceder a la auditoría.' }, 500);
  }
}

// --- Entrada ----------------------------------------------------------------

export async function handleCuenta(request, env = {}) {
  try {
    const url = new URL(request.url);
    const ruta = url.pathname.replace(/\/+$/, '');
    const cfg = configDe(env);
    // La auditoría vive en el mismo namespace de cuentas, fuera del alcance
    // del token clínico que usa el navegador.
    cfg.auditoria = cfg;

    if (ruta === '/api/cuenta/login') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Se espera POST.' }, 405);
      return await login(request, cfg);
    }
    if (ruta === '/api/cuenta/logout') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Se espera POST.' }, 405);
      return await logout(request);
    }
    if (ruta === '/api/cuenta/sesion') {
      if (request.method !== 'GET') return json({ ok: false, error: 'Se espera GET.' }, 405);
      return await sesion(request, cfg);
    }
    if (ruta === '/api/cuenta/perfil') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Se espera POST.' }, 405);
      if (!origenValido(request)) return json({ ok: false, error: 'Origen no permitido.' }, 403);
      return await perfil(request, cfg);
    }
    if (ruta === '/api/cuenta/usuario') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Se espera POST.' }, 405);
      if (!origenValido(request)) return json({ ok: false, error: 'Origen no permitido.' }, 403);
      return await usuario(request, cfg);
    }
    if (ruta === '/api/cuenta/clave') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Se espera POST.' }, 405);
      if (!origenValido(request)) return json({ ok: false, error: 'Origen no permitido.' }, 403);
      return await clave(request, cfg);
    }
    if (ruta === '/api/cuenta/foto') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Se espera POST.' }, 405);
      if (!origenValido(request)) return json({ ok: false, error: 'Origen no permitido.' }, 403);
      return await foto(request, cfg);
    }
    if (ruta === '/api/cuenta/totp') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Se espera POST.' }, 405);
      if (!origenValido(request)) return json({ ok: false, error: 'Origen no permitido.' }, 403);
      return await totp(request, cfg);
    }

    return json({ ok: false, error: 'Ruta no encontrada.' }, 404);
  } catch (err) {
    console.error('[cuenta]', err?.message || err);
    return json({ ok: false, error: 'No se pudo completar la operación. Intenta de nuevo.' }, 500);
  }
}
