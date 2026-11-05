// ===========================================================================
//  VISTA: MI PERFIL
// ===========================================================================
//  Autoservicio de la cuenta: datos personales, foto, usuario de acceso y
//  contraseña. Toda escritura pasa por /api/cuenta/*; la cookie HttpOnly es la
//  que autoriza. La vista solo refleja el resultado.
//
//  Los datos personales tienen estado sucio: el guardado se habilita cuando
//  hay cambios válidos, la barra fija de móvil aparece con ellos y salir de la
//  página avisa antes de perderlos. La foto se guarda al instante y su retirada
//  se puede deshacer durante unos segundos.
// ===========================================================================
import { sincronizarSesion } from '../auth/usuarios.js';

const ROLES = {
  coord: 'Coordinación',
  facilitadora: 'Facilitadora',
  promotora: 'Promotora',
  social: 'Trabajo Social',
  admin: 'Administración TI',
};

const LADO_FOTO = 320;
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
  const nombre = cuenta.nombre || 'Mi perfil';
  const foto = cuenta.foto || '';
  const rol = ROLES[cuenta.rol] || 'Perfil';
  const nombreEl = porId('topbarMenuNombre');
  const rolEl = porId('topbarMenuRol');
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
        const escala = Math.min(1, LADO_FOTO / Math.max(img.width, img.height));
        const ancho = Math.max(1, Math.round(img.width * escala));
        const alto = Math.max(1, Math.round(img.height * escala));
        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('El navegador no pudo procesar la imagen.'));
        ctx.drawImage(img, 0, 0, ancho, alto);

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
  if (correo.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return 'El correo no tiene un formato válido.';
  }
  return '';
}

function validarTelefono(valor) {
  const telefono = String(valor || '').trim();
  if (!telefono) return '';
  if (!/^[+()\d\s-]{6,20}$/.test(telefono)) {
    return 'Solo números, espacios, guiones, paréntesis y +.';
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
  _deshacerFoto: null,
  _temporizadorFoto: null,
  _beforeUnload: null,
  _guardiaEnlaces: null,

  init() {
    const form = porId('formPerfil');
    if (!form || form === this._formulario) return;
    this._formulario = form;
    this._tocados = new Set();
    this._conectarFormularios();
    this._conectarSalida();
    this.cargar();
  },

  async cargar() {
    const cuenta = await sincronizarSesion();
    if (!cuenta) {
      window.location.replace('/login');
      return;
    }
    this.cuenta = cuenta;
    this.render();
    this._cargarUsuario();
    this.actualizarEstado();
  },

  render() {
    const cuenta = this.cuenta;
    if (!cuenta) return;

    const nombre = cuenta.nombre || 'Mi perfil';
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
    const quitar = porId('btnQuitarFoto');
    if (quitar) quitar.hidden = !foto;
    const fila = porId('perfilFotoFila');
    if (fila) fila.hidden = !foto;
    if (this.cuenta) pintarTopbar(this.cuenta);
  },

  _pintarAvisoTemporal() {
    const el = porId('perfilAvisoTemporal');
    if (el) el.hidden = !this.cuenta?.debeCambiarClave;
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

    porId('btnCambiarFoto')?.addEventListener('click', () => porId('perfilFotoInput')?.click());
    porId('perfilFotoInput')?.addEventListener('change', (e) => {
      const archivo = e.target.files?.[0];
      e.target.value = '';
      if (archivo) this.subirFoto(archivo);
    });
    porId('btnQuitarFoto')?.addEventListener('click', () => this.quitarFoto());
    porId('btnDeshacerFoto')?.addEventListener('click', () => this.deshacerQuitarFoto());

    porId('btnGuardarPerfilBar')?.addEventListener('click', () => this.guardarDatos());
    porId('btnDescartarPerfil')?.addEventListener('click', () => this.descartar());

    document.querySelectorAll('[data-toggle-clave]').forEach((boton) => {
      boton.addEventListener('click', () => {
        const input = porId(boton.dataset.toggleClave || '');
        if (!input) return;
        const oculto = input.type === 'password';
        input.type = oculto ? 'text' : 'password';
        boton.textContent = oculto ? 'Ocultar' : 'Ver';
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

  /** Aviso del navegador si se sale con datos sin guardar. */
  _conectarSalida() {
    if (this._beforeUnload) window.removeEventListener('beforeunload', this._beforeUnload);
    if (this._guardiaEnlaces) document.removeEventListener('click', this._guardiaEnlaces, true);
    this._beforeUnload = (e) => {
      if (!this.hayCambios()) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', this._beforeUnload);

    // El ClientRouter navega sin recargar, así que beforeunload no llega a
    // dispararse. Se interceptan los enlaces internos en captura para
    // preguntar antes de descartar los cambios.
    this._guardiaEnlaces = (e) => {
      if (!this.hayCambios() || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const enlace = e.target?.closest?.('a[href]');
      if (!enlace || enlace.target === '_blank' || enlace.hasAttribute('download')) return;
      let url;
      try { url = new URL(enlace.href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      // Misma página con solo un ancla: no se pierde nada.
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (window.confirm('Tienes cambios sin guardar en tu perfil. ¿Salir y descartarlos?')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    document.addEventListener('click', this._guardiaEnlaces, true);
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
    return Object.keys(CAMPOS).some((clave) => this._normalizado(clave) !== (this._base[clave] || ''));
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
      localStorage.setItem('pdi_usuario_nombre', this.cuenta.nombre || '');
      this.render();
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
      toast('Contraseña actualizada', 'Tu nueva contraseña ya está activa.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        aviso('perfilClaveFeedback', 'No se pudo conectar. Intenta de nuevo.', 'error');
      }
    } finally {
      liberar();
    }
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
        localStorage.setItem('pdi_usuario_foto', this.cuenta.foto);
        this._pintarAvatar();
      }
      toast('Foto actualizada', 'Tu nueva foto ya aparece en el menú.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        if (this.cuenta) this.cuenta.foto = anterior;
        this._pintarAvatar();
        toast('No se pudo guardar la foto', 'Revisa la conexión e intenta de nuevo.', 'danger');
      }
    }
  },

  async quitarFoto() {
    if (!this.cuenta?.foto) return;
    const anterior = this.cuenta.foto;

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
      localStorage.removeItem('pdi_usuario_foto');
      this._pintarAvatar();
      this._mostrarDeshacer(anterior);
      toast('Foto retirada', 'Vuelven tus iniciales. Puedes deshacerlo unos segundos.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        toast('No se pudo quitar la foto', 'Revisa la conexión e intenta de nuevo.', 'danger');
      }
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
