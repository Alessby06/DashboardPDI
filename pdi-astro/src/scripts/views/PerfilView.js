// ===========================================================================
//  VISTA: MI PERFIL
// ===========================================================================
//  Autoservicio de la cuenta: datos personales, foto, usuario de acceso y
//  contraseña. Toda escritura pasa por /api/cuenta/*; la cookie HttpOnly es la
//  que autoriza. La vista solo refleja el resultado.
//
//  Los datos personales tienen estado sucio: el guardado se habilita cuando
//  hay cambios válidos, la barra fija de móvil aparece con ellos y salir de la
//  página avisa antes de perderlos. La foto vive en un menú (ver, actualizar,
//  eliminar) y se guarda al instante; al eliminarla queda un deshacer breve.
// ===========================================================================
import { sincronizarSesion } from '../auth/usuarios.js';
import { iconBody } from '../../data/iconos.js';
import { validarTipo, iniciarTiposCampo } from '../ui/tiposCampo.js';
import { confirmar } from '../ui/confirmacion.js';
import qrcode from 'qrcode-generator';

const ICONO_CLAVE_VER = iconBody('password.ver');
const ICONO_CLAVE_OCULTAR = iconBody('password.ocultar');

const ROLES = {
  coord: 'Coordinación',
  facilitadora: 'Facilitadora',
  promotora: 'Promotora',
  social: 'Trabajo Social',
  admin: 'Administración TI',
};

const LADO_FOTO = 480;
const MAX_FOTO_BYTES = 120 * 1024;
const MS_DESHACER_FOTO = 8000;

const CAMPOS = {
  nombre: 'perfilInputNombre',
  correo: 'perfilInputCorreo',
  telefono: 'perfilInputTelefono',
};

const ERRORES = {
  nombre: 'perfilErrorNombre',
  correo: 'perfilErrorCorreo',
  telefono: 'perfilErrorTelefono',
};

function porId(id) {
  return document.getElementById(id);
}

function inicialesDe(nombre) {
  return String(nombre || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('') || '?';
}

function fechaLarga(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function aviso(id, texto, tipo = '') {
  const el = porId(id);
  if (!el) return;
  el.textContent = texto || '';
  el.className = 'perfil-feedback' + (tipo ? ' is-' + tipo : '');
}

// Última cuenta buena de esta pestaña: si el servidor no responde al montar,
// la vista repinta esto en el acto en vez de quedarse en el esqueleto.
const CLAVE_CACHE_CUENTA = 'pdi_perfil_cuenta_v1';
const TTL_CACHE_CUENTA = 10 * 60 * 1000;

function guardarCacheCuenta(cuenta) {
  if (!cuenta?.usuario) return;
  try {
    sessionStorage.setItem(CLAVE_CACHE_CUENTA, JSON.stringify({ t: Date.now(), cuenta }));
  } catch (e) {}
}

function leerCacheCuenta() {
  try {
    const bruto = sessionStorage.getItem(CLAVE_CACHE_CUENTA);
    if (!bruto) return null;
    const datos = JSON.parse(bruto);
    if (!datos?.cuenta?.usuario) return null;
    if (Date.now() - Number(datos.t || 0) > TTL_CACHE_CUENTA) {
      sessionStorage.removeItem(CLAVE_CACHE_CUENTA);
      return null;
    }
    return datos.cuenta;
  } catch (e) {
    return null;
  }
}

function toast(titulo, mensaje, tipo = 'success') {
  try {
    if (window.PDI?.ToastView?.show) window.PDI.ToastView.show(titulo, mensaje, tipo);
    else window.showToast?.(titulo, mensaje, tipo);
  } catch (e) {}
}

/** Bloquea un botón y muestra el progreso; devuelve la función que lo restaura. */
function ocupado(boton, texto, textoOriginal) {
  if (!boton) return () => {};
  const original = textoOriginal || boton.textContent;
  boton.disabled = true;
  boton.textContent = texto;
  return () => {
    boton.disabled = false;
    boton.textContent = original;
  };
}

async function pedir(url, opciones = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
    ...opciones,
  });
  const datos = await res.json().catch(() => ({}));
  if (res.status === 401 && url !== '/api/cuenta/login') {
    window.location.replace('/login');
    throw new Error('Sesión expirada');
  }
  return { res, datos };
}

function pintarTopbar(cuenta) {
  const nombre = cuenta.nombre || 'Sesión';
  const foto = cuenta.foto || '';
  const rol = ROLES[cuenta.rol] || 'Perfil';
  const nombreEl = porId('topbarUsuarioNombre');
  const rolEl = porId('topbarUsuarioRol');
  const iniciales = porId('topbarAvatarIniciales');
  const fotoEl = porId('topbarAvatarFoto');
  if (nombreEl) nombreEl.textContent = nombre;
  if (rolEl) rolEl.textContent = rol;
  if (iniciales) {
    iniciales.textContent = inicialesDe(nombre);
    iniciales.style.display = foto ? 'none' : '';
  }
  if (fotoEl) {
    if (foto) {
      fotoEl.src = foto;
      fotoEl.hidden = false;
    } else {
      fotoEl.removeAttribute('src');
      fotoEl.hidden = true;
    }
  }
}

function archivoAImagen(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No se eligió ningún archivo.'));
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
      return reject(new Error('Usa una imagen PNG, JPG o WebP.'));
    }
    if (file.size > 6 * 1024 * 1024) {
      return reject(new Error('La imagen original no puede superar 6 MB.'));
    }

    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('La imagen no se pudo abrir.'));
      img.onload = () => {
        // Encuadre automático: recorte cuadrado centrado. El sesgo vertical
        // leve (0,42) evita cortar la frente en retratos verticales.
        const lado = Math.min(img.width, img.height);
        const sx = (img.width - lado) / 2;
        const sy = (img.height - lado) * 0.42;
        const escala = Math.min(1, LADO_FOTO / lado);
        const destino = Math.max(1, Math.round(lado * escala));
        const canvas = document.createElement('canvas');
        canvas.width = destino;
        canvas.height = destino;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('El navegador no pudo procesar la imagen.'));
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, destino, destino);

        let calidad = 0.86;
        let data = canvas.toDataURL('image/jpeg', calidad);
        while (data.length * 0.75 > MAX_FOTO_BYTES && calidad > 0.45) {
          calidad -= 0.08;
          data = canvas.toDataURL('image/jpeg', calidad);
        }
        if (data.length * 0.75 > MAX_FOTO_BYTES) {
          return reject(new Error('La foto sigue siendo pesada. Prueba con otra imagen.'));
        }
        resolve(data);
      };
      img.src = String(lector.result || '');
    };
    lector.readAsDataURL(file);
  });
}

// --- Validación en línea ----------------------------------------------------
// Duplica las reglas del servidor para avisar antes de enviar. El servidor
// sigue siendo la autoridad: si algo se escapa aquí, allí se rechaza igual.

function validarNombre(valor) {
  const nombre = String(valor || '').trim().replace(/\s+/g, ' ');
  if (nombre.length < 2) return 'Escribe al menos 2 caracteres.';
  if (nombre.length > 80) return 'El nombre no puede superar los 80 caracteres.';
  return '';
}

function validarCorreo(valor) {
  const correo = String(valor || '').trim();
  if (!correo) return '';
  if (correo.length > 120 || !/^[^\s@]+@[^\s@]+\.(com|org|pe)$/i.test(correo)) {
    return 'Escribe un correo con @ y terminación .com, .org o .pe.';
  }
  return '';
}

function validarTelefono(valor) {
  const telefono = String(valor || '').trim();
  if (!telefono) return '';
  if (!validarTipo('telefono', telefono)) {
    return 'El teléfono debe tener 9 dígitos y empezar con 9.';
  }
  return '';
}

const VALIDADORES = {
  nombre: validarNombre,
  correo: validarCorreo,
  telefono: validarTelefono,
};

function fuerzaDe(clave) {
  const texto = String(clave || '');
  if (!texto) return { nivel: 0, texto: 'Mínimo 10 caracteres. Se recomienda una frase larga.' };
  let puntos = 0;
  if (texto.length >= 10) puntos += 2;
  if (texto.length >= 14) puntos += 1;
  if (/[a-z]/.test(texto) && /[A-Z]/.test(texto)) puntos += 1;
  if (/\d/.test(texto)) puntos += 1;
  if (/[^A-Za-z0-9]/.test(texto)) puntos += 1;

  if (texto.length < 10) {
    return { nivel: 1, texto: 'Débil. Necesita al menos 10 caracteres.' };
  }
  if (puntos <= 2) return { nivel: 1, texto: 'Débil. Alarga la frase o mezcla mayúsculas y números.' };
  if (puntos === 3) return { nivel: 2, texto: 'Aceptable. Añade variedad para reforzarla.' };
  if (puntos === 4) return { nivel: 3, texto: 'Buena. Una frase más larga la haría fuerte.' };
  return { nivel: 4, texto: 'Fuerte. Buena longitud y variedad.' };
}

export const PerfilView = {
  cuenta: null,
  _formulario: null,
  _base: { nombre: '', correo: '', telefono: '' },
  _tocados: new Set(),
  _temporizadorMenuFoto: null,
  _deshacerFoto: null,
  _temporizadorFoto: null,
  _totpUri: '',
  _salidaPermitida: false,
  _guardiaEnlaces: null,
  _swapSalida: null,

  init() {
    const form = porId('formPerfil');
    if (!form) return;
    if (form === this._formulario) {
      // Misma página (page-load duplicado): no reenganchar ni volver a pedir.
      return;
    }
    this._formulario = form;
    this._tocados = new Set();
    iniciarTiposCampo();
    this._conectarFormularios();
    this._conectarSalida();

    porId('btnReintentarPerfil')?.addEventListener('click', async () => {
      const bloque = porId('perfilCargaError');
      if (bloque) bloque.hidden = true;
      aviso('perfilDatosFeedback', '');
      const boton = porId('btnReintentarPerfil');
      if (boton) boton.disabled = true;
      try {
        await this.cargar();
      } finally {
        if (boton) boton.disabled = false;
      }
    });

    // Al volver a la sección, la copia en memoria (o la última cuenta buena de
    // esta pestaña) se pinta en el acto. La red solo confirma; así no
    // reaparece "cargando" en cada entrada.
    if (!this.cuenta) this.cuenta = leerCacheCuenta();
    if (this.cuenta) {
      this.render();
      this.actualizarEstado();
    }
    this.cargar({ fondo: Boolean(this.cuenta) });
  },

  async cargar({ fondo = false } = {}) {
    // `undefined` marca fallo temporal (red caída o respuesta incompleta);
    // `null` marca sesión terminada: el servidor respondió 401.
    let cuenta;
    let fallos = 0;
    while (true) {
      try {
        cuenta = await sincronizarSesion();
        // Una respuesta 200 sin identificador no es una sesión válida: se
        // trata como fallo y se reintenta, nunca como cuenta real.
        if (cuenta && !cuenta.usuario) cuenta = undefined;
      } catch (err) {
        // Fallo del servidor o de la base: la cookie sigue siendo válida. No
        // se expulsa al usuario; se le pide reintentar. Si ya hay datos en
        // pantalla, se conservan sin un aviso en cada vuelta.
        cuenta = undefined;
      }
      if (cuenta !== undefined) break;
      fallos++;
      // En segundo plano no se insiste ni se avisa: los datos en pantalla
      // siguen siendo válidos y la próxima entrada lo reintentará.
      if (fondo || fallos >= 3) break;
      await new Promise((r) => setTimeout(r, 700 * fallos));
    }

    if (cuenta === undefined) {
      if (!fondo) this._mostrarFalloCarga();
      return;
    }
    if (!cuenta) {
      window.location.replace('/login');
      return;
    }

    this.cuenta = cuenta;
    guardarCacheCuenta(cuenta);
    const falloVisible = porId('perfilCargaError');
    if (falloVisible) falloVisible.hidden = true;

    // Si el usuario ya está escribiendo mientras responde el servidor, no se
    // pisan sus campos: solo se actualiza lo estructural.
    if (fondo && this._enEdicion()) {
      pintarTopbar(cuenta);
      this._pintarAvisoTemporal();
      return;
    }

    this.render();
    this._cargarUsuario();
    this.actualizarEstado();
  },

  /** Fallo de carga sin datos en pantalla: visible, honesto y con salida. */
  _mostrarFalloCarga() {
    aviso('perfilDatosFeedback', 'No se pudo cargar tu perfil. Revisa la conexión e intenta de nuevo.', 'error');
    toast('No se pudo cargar el perfil', 'El servidor no respondió. Usa Reintentar.', 'danger');
    const bloque = porId('perfilCargaError');
    if (bloque) bloque.hidden = false;
    // El esqueleto no debe aparentar un estado real: "Cargando…" solo tiene
    // sentido mientras hay una petición viva.
    const estado = porId('perfilIdentidadEstado');
    if (estado) estado.textContent = '—';
  },

  render({ conservarTotp = false } = {}) {
    const cuenta = this.cuenta;
    if (!cuenta) return;

    const nombre = cuenta.nombre || '—';
    const rol = ROLES[cuenta.rol] || cuenta.rol || '—';

    const set = (id, valor) => {
      const el = porId(id);
      if (el) el.textContent = valor;
    };

    set('perfilNombre', nombre);
    set('perfilIdentidadUsuario', '@' + (cuenta.usuario || '—'));
    set('perfilIdentidadRol', rol);
    set('perfilIdentidadDesde', fechaLarga(cuenta.creadoEl) || '—');
    set('perfilIdentidadEstado', cuenta.activo === false ? 'Inactiva' : 'Activa');

    this._pintarAvatar();
    this._cargarCampos();
    this._pintarAvisoTemporal();
    this._actualizarBotonesSeguridad();
    // Guardar los datos personales no debe cerrar una activación de MFA en curso.
    if (!conservarTotp) this._pintarTotp();
  },

  /** Repinta solo la foto: cambiar de avatar no debe pisar lo que se escribe. */
  _pintarAvatar() {
    const foto = this.cuenta?.foto || '';
    const iniciales = porId('perfilIniciales');
    const fotoEl = porId('perfilFoto');
    if (iniciales) {
      iniciales.textContent = inicialesDe(this.cuenta?.nombre || '');
      iniciales.style.display = foto ? 'none' : '';
    }
    if (fotoEl) {
      if (foto) {
        fotoEl.src = foto;
        fotoEl.hidden = false;
      } else {
        fotoEl.removeAttribute('src');
        fotoEl.hidden = true;
      }
    }
    // Sin foto no hay nada que ver ni que eliminar.
    const ver = porId('btnVerFoto');
    if (ver) ver.disabled = !foto;
    const eliminar = porId('btnEliminarFoto');
    if (eliminar) eliminar.disabled = !foto;
    const grande = porId('perfilFotoGrande');
    if (grande) {
      if (foto) grande.src = foto;
      else grande.removeAttribute('src');
    }
    const visor = porId('perfilFotoDialog');
    if (visor?.open && !foto) visor.close();
    if (this.cuenta) pintarTopbar(this.cuenta);
  },

  _pintarAvisoTemporal() {
    const el = porId('perfilAvisoTemporal');
    if (el) el.hidden = !this.cuenta?.debeCambiarClave;
  },

  _pintarTotp() {
    const bloque = porId('perfilTotp');
    if (!bloque) return;
    const permitido = Boolean(this.cuenta);
    // La fila entera se oculta: sin cuenta no debe quedar la etiqueta sola.
    const fila = porId('perfilTotpFila');
    if (fila) fila.hidden = !permitido;
    bloque.hidden = !permitido;
    if (!permitido) return;

    const activo = Boolean(this.cuenta.totpActivo);
    const estado = porId('perfilTotpEstado');
    if (estado) estado.textContent = activo ? 'Activada' : 'Desactivada';
    const activar = porId('btnTotpActivar');
    if (activar) activar.hidden = activo;
    const desactivar = porId('btnTotpDesactivar');
    if (desactivar) desactivar.hidden = !activo;
    const panel = porId('perfilTotpPanel');
    if (panel) panel.hidden = true;
    const panelBaja = porId('perfilTotpDesactivarPanel');
    if (panelBaja) panelBaja.hidden = true;
    const secreto = porId('perfilTotpSecreto');
    if (secreto) secreto.textContent = '';
    this._totpUri = '';
    this._pintarQrTotp();
    aviso('perfilTotpFeedback', '');
    aviso('perfilTotpDesactivarFeedback', '');
  },

  /** QR local del otpauth: el secreto no sale del navegador. */
  _pintarQrTotp() {
    const contenedor = porId('perfilTotpQr');
    if (!contenedor) return;
    const uri = this._totpUri || '';
    if (!uri) {
      contenedor.hidden = true;
      contenedor.innerHTML = '';
      return;
    }
    try {
      const qr = qrcode(0, 'M');
      qr.addData(uri);
      qr.make();
      contenedor.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      contenedor.hidden = false;
    } catch (err) {
      contenedor.hidden = true;
      contenedor.innerHTML = '';
    }
  },

  async iniciarTotp() {
    const boton = porId('btnTotpActivar');
    const liberar = ocupado(boton, 'Generando…');
    aviso('perfilTotpFeedback', '');
    try {
      const { res, datos } = await pedir('/api/cuenta/totp', {
        method: 'POST',
        body: JSON.stringify({ accion: 'iniciar' }),
      });
      if (!res.ok || !datos.ok) {
        aviso('perfilTotpFeedback', datos.error || 'No se pudo iniciar la verificación.', 'error');
        return;
      }
      const secreto = porId('perfilTotpSecreto');
      if (secreto) secreto.textContent = datos.secreto || '';
      this._totpUri = datos.uri || '';
      this._pintarQrTotp();
      const panel = porId('perfilTotpPanel');
      if (panel) panel.hidden = false;
      const panelBaja = porId('perfilTotpDesactivarPanel');
      if (panelBaja) panelBaja.hidden = true;
      aviso('perfilTotpDesactivarFeedback', '');
      if (boton) boton.hidden = true;
      const desactivar = porId('btnTotpDesactivar');
      if (desactivar) desactivar.hidden = true;
      const codigo = porId('perfilTotpCodigo');
      if (codigo) { codigo.value = ''; codigo.focus({ preventScroll: true }); }
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        aviso('perfilTotpFeedback', 'No se pudo conectar. Intenta de nuevo.', 'error');
      }
    } finally {
      liberar();
    }
  },

  async confirmarTotp() {
    const boton = porId('btnTotpConfirmar');
    const codigo = (porId('perfilTotpCodigo')?.value || '').replace(/\D/g, '');
    aviso('perfilTotpFeedback', '');
    if (codigo.length !== 6) {
      aviso('perfilTotpFeedback', 'Escribe el código de 6 dígitos.', 'error');
      porId('perfilTotpCodigo')?.focus();
      return;
    }
    const liberar = ocupado(boton, 'Confirmando…');
    try {
      const { res, datos } = await pedir('/api/cuenta/totp', {
        method: 'POST',
        body: JSON.stringify({ accion: 'confirmar', codigo }),
      });
      if (!res.ok || !datos.ok) {
        aviso('perfilTotpFeedback', datos.error || 'El código no es correcto.', 'error');
        return;
      }
      this.cuenta.totpActivo = true;
      this._pintarTotp();
      toast('Verificación activada', 'La próxima vez se pedirá el código de tu aplicación.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        aviso('perfilTotpFeedback', 'No se pudo conectar. Intenta de nuevo.', 'error');
      }
    } finally {
      liberar();
    }
  },

  async copiarSecretoTotp() {
    const secreto = (porId('perfilTotpSecreto')?.textContent || '').trim();
    if (!secreto) return;
    try {
      await navigator.clipboard.writeText(secreto);
      toast('Secreto copiado', 'Pégalo en tu aplicación de autenticación.');
    } catch (err) {
      toast('No se pudo copiar', 'Selecciona el secreto y cópialo a mano.', 'danger');
    }
  },

  mostrarBajaTotp() {
    // Los dos formularios nunca conviven: abrir uno cierra el otro.
    const activacion = porId('perfilTotpPanel');
    if (activacion) activacion.hidden = true;
    aviso('perfilTotpFeedback', '');
    const panel = porId('perfilTotpDesactivarPanel');
    if (panel) panel.hidden = false;
    aviso('perfilTotpDesactivarFeedback', '');
    const codigo = porId('perfilTotpBajaCodigo');
    if (codigo) codigo.value = '';
    porId('perfilTotpClave')?.focus({ preventScroll: true });
  },

  cancelarTotp() {
    const panel = porId('perfilTotpPanel');
    if (panel) panel.hidden = true;
    const secreto = porId('perfilTotpSecreto');
    if (secreto) secreto.textContent = '';
    const codigo = porId('perfilTotpCodigo');
    if (codigo) codigo.value = '';
    this._totpUri = '';
    this._pintarQrTotp();
    aviso('perfilTotpFeedback', '');
    const activar = porId('btnTotpActivar');
    if (activar) activar.hidden = false;
    porId('btnTotpActivar')?.focus({ preventScroll: true });
  },

  cancelarBajaTotp() {
    const panel = porId('perfilTotpDesactivarPanel');
    if (panel) panel.hidden = true;
    const clave = porId('perfilTotpClave');
    if (clave) clave.value = '';
    const codigo = porId('perfilTotpBajaCodigo');
    if (codigo) codigo.value = '';
    aviso('perfilTotpDesactivarFeedback', '');
    porId('btnTotpDesactivar')?.focus({ preventScroll: true });
  },

  async desactivarTotp() {
    const boton = porId('btnTotpDesactivarConfirmar');
    const clave = porId('perfilTotpClave')?.value || '';
    const codigo = (porId('perfilTotpBajaCodigo')?.value || '').replace(/\D/g, '');
    aviso('perfilTotpDesactivarFeedback', '');
    if (!clave) {
      aviso('perfilTotpDesactivarFeedback', 'Escribe tu contraseña actual.', 'error');
      porId('perfilTotpClave')?.focus();
      return;
    }
    if (codigo.length !== 6) {
      aviso('perfilTotpDesactivarFeedback', 'Escribe el código de 6 dígitos de tu aplicación.', 'error');
      porId('perfilTotpBajaCodigo')?.focus();
      return;
    }
    const liberar = ocupado(boton, 'Desactivando…');
    try {
      const { res, datos } = await pedir('/api/cuenta/totp', {
        method: 'POST',
        body: JSON.stringify({ accion: 'desactivar', clave, codigo }),
      });
      if (!res.ok || !datos.ok) {
        aviso('perfilTotpDesactivarFeedback', datos.error || 'No se pudo desactivar.', 'error');
        return;
      }
      this.cuenta.totpActivo = false;
      const input = porId('perfilTotpClave');
      if (input) input.value = '';
      const inputCodigo = porId('perfilTotpBajaCodigo');
      if (inputCodigo) inputCodigo.value = '';
      this._pintarTotp();
      toast('Verificación desactivada', 'Tu cuenta vuelve a usar solo contraseña.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        aviso('perfilTotpDesactivarFeedback', 'No se pudo conectar. Intenta de nuevo.', 'error');
      }
    } finally {
      liberar();
    }
  },

  _cargarCampos() {
    const cuenta = this.cuenta;
    if (!cuenta) return;
    const valores = {
      nombre: cuenta.nombre || '',
      correo: cuenta.correo || '',
      telefono: cuenta.telefono || '',
    };
    Object.entries(CAMPOS).forEach(([clave, id]) => {
      const input = porId(id);
      if (input) input.value = valores[clave];
      this._marcarError(clave, '');
    });
    this._base = valores;
    this._tocados = new Set();
  },

  _cargarUsuario() {
    const usuario = porId('perfilInputUsuario');
    if (usuario) usuario.value = this.cuenta?.usuario || '';
    this._actualizarBotonesSeguridad();
  },

  /** Gris hasta que el bloque de seguridad tenga todo lo que necesita. */
  _actualizarBotonesSeguridad() {
    const cuenta = this.cuenta;
    const usuario = (porId('perfilInputUsuario')?.value || '').trim().toLowerCase();
    const claveUsuario = porId('perfilInputUsuarioClave')?.value || '';
    const usuarioListo = /^[a-z0-9._-]{3,32}$/.test(usuario)
      && usuario !== (cuenta?.usuario || '')
      && Boolean(claveUsuario);
    const btnUsuario = porId('btnGuardarUsuario');
    if (btnUsuario) btnUsuario.disabled = !usuarioListo;

    const actual = porId('perfilInputClaveActual')?.value || '';
    const nueva = porId('perfilInputClaveNueva')?.value || '';
    const repetir = porId('perfilInputClaveRepetir')?.value || '';
    const nuevaLista = nueva.length >= 10 && nueva.trim().length > 0;
    const claveLista = Boolean(actual) && nuevaLista && nueva !== actual && nueva === repetir;
    const btnClave = porId('btnGuardarClave');
    if (btnClave) btnClave.disabled = !claveLista;
  },

  _conectarFormularios() {
    porId('formPerfil')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.guardarDatos();
    });
    porId('formUsuario')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.guardarUsuario();
    });
    porId('formClave')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.guardarClave();
    });

    Object.entries(CAMPOS).forEach(([clave, id]) => {
      const input = porId(id);
      if (!input) return;
      input.addEventListener('blur', () => {
        this._tocados.add(clave);
        this._validarCampo(clave);
        this.actualizarEstado();
      });
      input.addEventListener('input', () => {
        if (this._tocados.has(clave) || this._errorVisible(clave)) this._validarCampo(clave);
        this.actualizarEstado();
      });
    });

    [
      'perfilInputUsuario',
      'perfilInputUsuarioClave',
      'perfilInputClaveActual',
      'perfilInputClaveNueva',
      'perfilInputClaveRepetir',
    ].forEach((id) => {
      porId(id)?.addEventListener('input', () => this._actualizarBotonesSeguridad());
    });

    porId('btnCambiarFoto')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.alternarMenuFoto();
    });
    porId('btnVerFoto')?.addEventListener('click', () => {
      this.cerrarMenuFoto();
      this.abrirFotoGrande();
    });
    porId('btnActualizarFoto')?.addEventListener('click', () => {
      this.cerrarMenuFoto();
      porId('perfilFotoInput')?.click();
    });
    porId('btnEliminarFoto')?.addEventListener('click', () => {
      this.cerrarMenuFoto();
      const dialogo = porId('perfilEliminarDialog');
      if (dialogo && !dialogo.open) dialogo.showModal();
    });
    porId('perfilFotoInput')?.addEventListener('change', (e) => {
      const archivo = e.target.files?.[0];
      e.target.value = '';
      if (archivo) this.subirFoto(archivo);
    });
    porId('btnDeshacerFoto')?.addEventListener('click', () => this.deshacerQuitarFoto());

    const menuFoto = porId('perfilFotoMenu');
    menuFoto?.addEventListener('keydown', (e) => {
      const items = [...menuFoto.querySelectorAll('.perfil-photo-item:not(:disabled)')];
      if (!items.length) return;
      const actual = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const paso = e.key === 'ArrowDown' ? 1 : -1;
        items[(Math.max(0, actual) + paso + items.length) % items.length].focus();
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        items[e.key === 'Home' ? 0 : items.length - 1].focus();
      } else if (e.key === 'Tab') {
        this.cerrarMenuFoto();
      }
    });

    porId('btnCerrarFotoDialog')?.addEventListener('click', () => porId('perfilFotoDialog')?.close());
    porId('btnActualizarFotoDialog')?.addEventListener('click', () => {
      porId('perfilFotoDialog')?.close();
      porId('perfilFotoInput')?.click();
    });
    porId('btnCancelarEliminar')?.addEventListener('click', () => porId('perfilEliminarDialog')?.close());
    porId('btnConfirmarEliminar')?.addEventListener('click', () => this.quitarFoto());
    ['perfilFotoDialog', 'perfilEliminarDialog'].forEach((id) => {
      const dialogo = porId(id);
      if (!dialogo) return;
      // El clic en el fondo (fuera de la caja) cierra; el de dentro no.
      dialogo.addEventListener('click', (e) => {
        if (e.target === dialogo) dialogo.close();
      });
    });
    porId('perfilFotoDialog')?.addEventListener('close', () => {
      porId('btnCambiarFoto')?.focus({ preventScroll: true });
    });
    porId('perfilEliminarDialog')?.addEventListener('close', () => {
      porId('btnCambiarFoto')?.focus({ preventScroll: true });
    });

    // Una sola escucha global por carga de página: clic fuera y Escape.
    if (!window.__pdiFotoMenuGlobal) {
      window.__pdiFotoMenuGlobal = true;
      document.addEventListener('click', (e) => {
        if (!e.target.closest?.('.perfil-photo')) this.cerrarMenuFoto();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const menu = porId('perfilFotoMenu');
        if (menu && !menu.hidden) {
          e.preventDefault();
          this.cerrarMenuFoto(true);
        }
      });
    }
    porId('btnTotpActivar')?.addEventListener('click', () => this.iniciarTotp());
    porId('btnCopiarTotp')?.addEventListener('click', () => this.copiarSecretoTotp());
    porId('btnTotpCancelar')?.addEventListener('click', () => this.cancelarTotp());
    porId('btnTotpCancelarBaja')?.addEventListener('click', () => this.cancelarBajaTotp());
    porId('btnTotpConfirmar')?.addEventListener('click', () => this.confirmarTotp());
    porId('btnTotpDesactivar')?.addEventListener('click', () => this.mostrarBajaTotp());
    porId('btnTotpDesactivarConfirmar')?.addEventListener('click', () => this.desactivarTotp());

    porId('btnGuardarPerfilBar')?.addEventListener('click', () => this.guardarDatos());
    porId('btnDescartarPerfil')?.addEventListener('click', () => this.descartar());

    document.querySelectorAll('[data-toggle-clave]').forEach((boton) => {
      boton.addEventListener('click', () => {
        const input = porId(boton.dataset.toggleClave || '');
        if (!input) return;
        const oculto = input.type === 'password';
        input.type = oculto ? 'text' : 'password';
        const svg = boton.querySelector('svg');
        if (svg) svg.innerHTML = oculto ? ICONO_CLAVE_OCULTAR : ICONO_CLAVE_VER;
        const etiqueta = boton.getAttribute('aria-label') || '';
        boton.setAttribute('aria-label', oculto
          ? etiqueta.replace(/^Mostrar/, 'Ocultar')
          : etiqueta.replace(/^Ocultar/, 'Mostrar'));
        boton.setAttribute('aria-pressed', oculto ? 'true' : 'false');
      });
    });

    const nueva = porId('perfilInputClaveNueva');
    nueva?.addEventListener('input', () => this._pintarFuerza(nueva.value));
  },

  /** Confirmación propia al salir con datos sin guardar. */
  _conectarSalida() {
    this._soltarGuardiaSalida();

    // El ClientRouter navega sin recargar: se interceptan los enlaces internos
    // en captura para preguntar antes de descartar los cambios.
    this._guardiaEnlaces = (e) => {
      // Si el formulario ya no está (otra página), no hay nada que perder.
      if (!porId('formPerfil')) {
        this._soltarGuardiaSalida();
        return;
      }
      if (this._salidaPermitida) return;
      if (!this.hayCambios() || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const enlace = e.target?.closest?.('a[href]');
      if (!enlace || enlace.target === '_blank' || enlace.hasAttribute('download')) return;
      let url;
      try { url = new URL(enlace.href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      // Misma página con solo un ancla: no se pierde nada.
      if (url.pathname === location.pathname && url.search === location.search) return;

      // Se detiene ahora y se pregunta con el modal del sistema.
      e.preventDefault();
      e.stopImmediatePropagation();
      this._preguntarSalida(enlace);
    };
    document.addEventListener('click', this._guardiaEnlaces, true);

    // Al cambiar de página, la guarda se retira: no debe seguir viva en /ajustes
    // ni en ninguna otra vista.
    if (!this._swapSalida) {
      this._swapSalida = () => this._soltarGuardiaSalida();
      document.addEventListener('astro:before-swap', this._swapSalida);
    }
  },

  _soltarGuardiaSalida() {
    if (!this._guardiaEnlaces) return;
    document.removeEventListener('click', this._guardiaEnlaces, true);
    this._guardiaEnlaces = null;
  },

  async _preguntarSalida(enlace) {
    const acepta = await confirmar({
      titulo: 'Cambios sin guardar',
      mensaje: 'Si sales ahora, los cambios que escribiste en tus datos se pierden.',
      confirmar: 'Salir y descartar',
      cancelar: 'Seguir editando',
      peligro: true,
      origen: enlace,
    });
    if (!acepta) return;

    // Se autoriza esta salida y se re-dispara el enlace: el router navega sin
    // recargar y la guardia no vuelve a preguntar.
    this._salidaPermitida = true;
    try {
      enlace.click();
    } finally {
      setTimeout(() => {
        this._salidaPermitida = false;
      }, 0);
    }
  },

  _valor(clave) {
    return porId(CAMPOS[clave])?.value || '';
  },

  _normalizado(clave) {
    const valor = this._valor(clave);
    if (clave === 'nombre') return valor.trim().replace(/\s+/g, ' ');
    if (clave === 'correo') return valor.trim().toLowerCase();
    return valor.trim();
  },

  hayCambios() {
    // Sin el formulario en el DOM (otra página) no hay nada que perder.
    if (!porId('formPerfil')) return false;
    return Object.keys(CAMPOS).some((clave) => this._normalizado(clave) !== (this._base[clave] || ''));
  },

  /** ¿Hay algo que el usuario esté editando y no deba pisar el refresco? */
  _enEdicion() {
    if (this._tocados.size > 0) return true;
    const panelTotp = porId('perfilTotpPanel');
    if (panelTotp && !panelTotp.hidden) return true;
    const usuario = (porId('perfilInputUsuario')?.value || '').trim();
    if (usuario && usuario !== (this.cuenta?.usuario || '')) return true;
    return [
      'perfilInputUsuarioClave',
      'perfilInputClaveActual',
      'perfilInputClaveNueva',
      'perfilInputClaveRepetir',
    ].some((id) => (porId(id)?.value || '').length > 0);
  },

  _marcarError(clave, mensaje) {
    const errorEl = porId(ERRORES[clave]);
    if (errorEl) errorEl.textContent = mensaje || '';
    const campo = porId(CAMPOS[clave])?.closest('.perfil-field');
    if (campo) campo.classList.toggle('is-invalid', Boolean(mensaje));
  },

  _errorVisible(clave) {
    return Boolean(porId(ERRORES[clave])?.textContent);
  },

  _validarCampo(clave) {
    const mensaje = VALIDADORES[clave](this._valor(clave));
    this._marcarError(clave, mensaje);
    return !mensaje;
  },

  _todoValido() {
    return Object.keys(CAMPOS).every((clave) => !VALIDADORES[clave](this._valor(clave)));
  },

  /** Habilita el guardado solo con cambios y datos válidos. */
  actualizarEstado() {
    const valido = this._todoValido();
    const cambios = this.hayCambios();
    const puede = valido && cambios && !this._guardando;

    const principal = porId('btnGuardarPerfil');
    if (principal) principal.disabled = !puede;
    const barra = porId('btnGuardarPerfilBar');
    if (barra) barra.disabled = !puede;

    const barraEl = porId('perfilSaveBar');
    if (barraEl) barraEl.hidden = !cambios;
  },

  descartar() {
    const base = this._base;
    Object.entries(CAMPOS).forEach(([clave, id]) => {
      const input = porId(id);
      if (input) input.value = base[clave] || '';
      this._marcarError(clave, '');
    });
    this._tocados = new Set();
    aviso('perfilDatosFeedback', 'Cambios descartados.');
    this.actualizarEstado();
    porId(CAMPOS.nombre)?.focus({ preventScroll: true });
  },

  _bloquear(activo) {
    this._guardando = activo;
    [
      porId('btnGuardarPerfil'),
      porId('btnGuardarPerfilBar'),
    ].forEach((boton) => {
      if (!boton) return;
      if (activo) {
        if (!boton.dataset.textoOriginal) boton.dataset.textoOriginal = boton.textContent;
        boton.textContent = 'Guardando…';
        boton.disabled = true;
      } else if (boton.dataset.textoOriginal) {
        boton.textContent = boton.dataset.textoOriginal;
        delete boton.dataset.textoOriginal;
      }
    });
  },

  async guardarDatos() {
    aviso('perfilDatosFeedback', '');

    // Marca todo como tocado: el envío revela cualquier error pendiente.
    Object.keys(CAMPOS).forEach((clave) => {
      this._tocados.add(clave);
      this._validarCampo(clave);
    });
    if (!this._todoValido()) {
      aviso('perfilDatosFeedback', 'Revisa los campos marcados.', 'error');
      porId(CAMPOS.nombre)?.focus({ preventScroll: true });
      this.actualizarEstado();
      return;
    }
    if (!this.hayCambios()) {
      this.actualizarEstado();
      return;
    }

    this._bloquear(true);
    try {
      const { res, datos } = await pedir('/api/cuenta/perfil', {
        method: 'POST',
        body: JSON.stringify({
          nombre: this._valor('nombre'),
          correo: this._valor('correo'),
          telefono: this._valor('telefono'),
        }),
      });
      if (!res.ok || !datos.ok) {
        aviso('perfilDatosFeedback', datos.error || 'No se pudieron guardar los cambios.', 'error');
        return;
      }
      this.cuenta = datos.cuenta;
      guardarCacheCuenta(this.cuenta);
      localStorage.setItem('pdi_usuario_nombre', this.cuenta.nombre || '');
      this.render({ conservarTotp: true });
      aviso('perfilDatosFeedback', 'Datos guardados.', 'ok');
      toast('Perfil actualizado', 'Tus datos personales se guardaron.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        aviso('perfilDatosFeedback', 'No se pudo conectar. Intenta de nuevo.', 'error');
      }
    } finally {
      this._bloquear(false);
      this.actualizarEstado();
    }
  },

  async guardarUsuario() {
    const boton = porId('btnGuardarUsuario');
    const usuario = (porId('perfilInputUsuario')?.value || '').trim().toLowerCase();
    const clave = porId('perfilInputUsuarioClave')?.value || '';
    aviso('perfilUsuarioFeedback', '');

    if (!/^[a-z0-9._-]{3,32}$/.test(usuario)) {
      aviso('perfilUsuarioFeedback', 'Entre 3 y 32 caracteres: minúsculas, números, punto, guion o guion bajo.', 'error');
      porId('perfilInputUsuario')?.focus();
      return;
    }
    if (usuario === (this.cuenta?.usuario || '')) {
      aviso('perfilUsuarioFeedback', 'Ese ya es tu usuario actual.', 'error');
      return;
    }
    if (!clave) {
      aviso('perfilUsuarioFeedback', 'Escribe tu contraseña actual para confirmar.', 'error');
      porId('perfilInputUsuarioClave')?.focus();
      return;
    }

    const liberar = ocupado(boton, 'Guardando…');
    try {
      const { res, datos } = await pedir('/api/cuenta/usuario', {
        method: 'POST',
        body: JSON.stringify({ usuario, clave }),
      });
      if (!res.ok || !datos.ok) {
        aviso('perfilUsuarioFeedback', datos.error || 'No se pudo cambiar el usuario.', 'error');
        return;
      }
      this.cuenta = datos.cuenta;
      guardarCacheCuenta(this.cuenta);
      localStorage.setItem('pdi_usuario_login', this.cuenta.usuario || '');
      const inputClave = porId('perfilInputUsuarioClave');
      if (inputClave) inputClave.value = '';
      const inputUsuario = porId('perfilInputUsuario');
      if (inputUsuario) inputUsuario.value = this.cuenta.usuario || '';
      // Solo cambia el identificador: no se recargan los datos personales para
      // no borrar lo que el usuario tenga escrito sin guardar.
      const identidad = porId('perfilIdentidadUsuario');
      if (identidad) identidad.textContent = '@' + (this.cuenta.usuario || '—');
      aviso('perfilUsuarioFeedback', 'Usuario actualizado.', 'ok');
      toast('Usuario actualizado', 'La próxima vez entra con @' + this.cuenta.usuario + '.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        aviso('perfilUsuarioFeedback', 'No se pudo conectar. Intenta de nuevo.', 'error');
      }
    } finally {
      liberar();
      this._actualizarBotonesSeguridad();
    }
  },

  _pintarFuerza(clave) {
    const medidor = document.querySelector('.perfil-strength');
    const texto = porId('perfilFuerzaTexto');
    const { nivel, texto: mensaje } = fuerzaDe(clave);
    if (medidor) {
      if (nivel) medidor.setAttribute('data-nivel', String(nivel));
      else medidor.removeAttribute('data-nivel');
    }
    if (texto) texto.textContent = mensaje;
  },

  async guardarClave() {
    const boton = porId('btnGuardarClave');
    const actual = porId('perfilInputClaveActual')?.value || '';
    const nueva = porId('perfilInputClaveNueva')?.value || '';
    const repetir = porId('perfilInputClaveRepetir')?.value || '';
    aviso('perfilClaveFeedback', '');

    if (!actual) {
      aviso('perfilClaveFeedback', 'Escribe tu contraseña actual.', 'error');
      porId('perfilInputClaveActual')?.focus();
      return;
    }
    if (nueva.length < 10) {
      aviso('perfilClaveFeedback', 'La nueva contraseña debe tener al menos 10 caracteres.', 'error');
      porId('perfilInputClaveNueva')?.focus();
      return;
    }
    if (nueva === actual) {
      aviso('perfilClaveFeedback', 'La nueva contraseña debe ser distinta de la actual.', 'error');
      porId('perfilInputClaveNueva')?.focus();
      return;
    }
    if (nueva !== repetir) {
      aviso('perfilClaveFeedback', 'Las dos contraseñas nuevas no coinciden.', 'error');
      porId('perfilInputClaveRepetir')?.focus();
      return;
    }

    const liberar = ocupado(boton, 'Guardando…');
    try {
      const { res, datos } = await pedir('/api/cuenta/clave', {
        method: 'POST',
        body: JSON.stringify({ actual, nueva }),
      });
      if (!res.ok || !datos.ok) {
        aviso('perfilClaveFeedback', datos.error || 'No se pudo cambiar la contraseña.', 'error');
        return;
      }
      ['perfilInputClaveActual', 'perfilInputClaveNueva', 'perfilInputClaveRepetir'].forEach((id) => {
        const el = porId(id);
        if (el) el.value = '';
      });
      this._pintarFuerza('');
      this.cuenta.debeCambiarClave = false;
      this._pintarAvisoTemporal();
      aviso('perfilClaveFeedback', 'Contraseña actualizada.', 'ok');
      toast('Contraseña actualizada', 'Tu nueva contraseña ya está activa. Se cerraron las sesiones abiertas en otros dispositivos.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        aviso('perfilClaveFeedback', 'No se pudo conectar. Intenta de nuevo.', 'error');
      }
    } finally {
      liberar();
      this._actualizarBotonesSeguridad();
    }
  },

  /** Abre o cierra el menú de la foto, con el mismo patrón que la topbar. */
  alternarMenuFoto() {
    const menu = porId('perfilFotoMenu');
    if (!menu) return;
    if (!menu.hidden && menu.classList.contains('is-open')) {
      this.cerrarMenuFoto(true);
      return;
    }
    this.abrirMenuFoto();
  },

  abrirMenuFoto() {
    const menu = porId('perfilFotoMenu');
    const boton = porId('btnCambiarFoto');
    if (!menu || !boton) return;
    clearTimeout(this._temporizadorMenuFoto);
    menu.hidden = false;
    void menu.offsetWidth;
    menu.classList.add('is-open');
    boton.setAttribute('aria-expanded', 'true');
    menu.querySelector('.perfil-photo-item:not(:disabled)')?.focus?.({ preventScroll: true });
  },

  cerrarMenuFoto(devolverFoco = false) {
    const menu = porId('perfilFotoMenu');
    const boton = porId('btnCambiarFoto');
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open');
    boton?.setAttribute('aria-expanded', 'false');
    clearTimeout(this._temporizadorMenuFoto);
    this._temporizadorMenuFoto = setTimeout(() => {
      if (!menu.classList.contains('is-open')) menu.hidden = true;
    }, 200);
    if (devolverFoco) boton?.focus?.({ preventScroll: true });
  },

  abrirFotoGrande() {
    const foto = this.cuenta?.foto || '';
    if (!foto) return;
    const grande = porId('perfilFotoGrande');
    if (grande) grande.src = foto;
    const dialogo = porId('perfilFotoDialog');
    if (dialogo && !dialogo.open) dialogo.showModal();
  },

  _limpiarDeshacer() {
    if (this._temporizadorFoto) {
      clearTimeout(this._temporizadorFoto);
      this._temporizadorFoto = null;
    }
    const barra = porId('perfilUndoFoto');
    if (barra) barra.hidden = true;
    this._deshacerFoto = null;
  },

  _mostrarDeshacer(foto) {
    this._limpiarDeshacer();
    this._deshacerFoto = foto;
    const barra = porId('perfilUndoFoto');
    if (barra) barra.hidden = false;
    this._temporizadorFoto = setTimeout(() => this._limpiarDeshacer(), MS_DESHACER_FOTO);
  },

  async subirFoto(archivo) {
    let data;
    try {
      data = await archivoAImagen(archivo);
    } catch (err) {
      toast('No se pudo usar la imagen', err.message || 'Prueba con otro archivo.', 'danger');
      return;
    }

    this._limpiarDeshacer();
    const anterior = this.cuenta?.foto || '';
    // Vista previa inmediata; si el servidor la rechaza se restaura.
    if (this.cuenta) this.cuenta.foto = data;
    this._pintarAvatar();

    try {
      const { res, datos } = await pedir('/api/cuenta/foto', {
        method: 'POST',
        body: JSON.stringify({ foto: data }),
      });
      if (!res.ok || !datos.ok) {
        if (this.cuenta) this.cuenta.foto = anterior;
        this._pintarAvatar();
        toast('No se pudo guardar la foto', datos.error || 'Intenta de nuevo.', 'danger');
        return;
      }
      if (this.cuenta) {
        this.cuenta.foto = datos.foto || data;
        guardarCacheCuenta(this.cuenta);
        localStorage.setItem('pdi_usuario_foto', this.cuenta.foto);
        this._pintarAvatar();
      }
      toast('Foto actualizada', 'Tu nueva foto ya está activa.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        if (this.cuenta) this.cuenta.foto = anterior;
        this._pintarAvatar();
        toast('No se pudo guardar la foto', 'Revisa la conexión e intenta de nuevo.', 'danger');
      }
    }
  },

  /** Elimina la foto. La confirmación avisa y queda un deshacer de 8 segundos. */
  async quitarFoto() {
    if (!this.cuenta?.foto) return;
    const anterior = this.cuenta.foto;
    const boton = porId('btnConfirmarEliminar');
    const liberar = ocupado(boton, 'Eliminando…');

    try {
      const { res, datos } = await pedir('/api/cuenta/foto', {
        method: 'POST',
        body: JSON.stringify({ foto: null }),
      });
      if (!res.ok || !datos.ok) {
        toast('No se pudo quitar la foto', datos.error || 'Intenta de nuevo.', 'danger');
        return;
      }
      this.cuenta.foto = '';
      guardarCacheCuenta(this.cuenta);
      localStorage.removeItem('pdi_usuario_foto');
      this._pintarAvatar();
      porId('perfilEliminarDialog')?.close();
      this._mostrarDeshacer(anterior);
      toast('Foto eliminada', 'Vuelven tus iniciales. Puedes deshacerlo unos segundos.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        toast('No se pudo quitar la foto', 'Revisa la conexión e intenta de nuevo.', 'danger');
      }
    } finally {
      liberar();
    }
  },

  async deshacerQuitarFoto() {
    const foto = this._deshacerFoto;
    if (!foto) return;
    this._limpiarDeshacer();

    if (this.cuenta) this.cuenta.foto = foto;
    this._pintarAvatar();

    try {
      const { res, datos } = await pedir('/api/cuenta/foto', {
        method: 'POST',
        body: JSON.stringify({ foto }),
      });
      if (!res.ok || !datos.ok) {
        if (this.cuenta) this.cuenta.foto = '';
        this._pintarAvatar();
        toast('No se pudo restaurar la foto', datos.error || 'Intenta de nuevo.', 'danger');
        return;
      }
      if (this.cuenta) {
        this.cuenta.foto = datos.foto || foto;
        guardarCacheCuenta(this.cuenta);
        localStorage.setItem('pdi_usuario_foto', this.cuenta.foto);
      }
      toast('Foto restaurada', 'Tu foto vuelve a estar activa.');
      porId('btnCambiarFoto')?.focus({ preventScroll: true });
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        if (this.cuenta) this.cuenta.foto = '';
        this._pintarAvatar();
        toast('No se pudo restaurar la foto', 'Revisa la conexión e intenta de nuevo.', 'danger');
      }
    }
  },
};
