// ===========================================================================
//  VISTA: MI PERFIL
// ===========================================================================
//  Autoservicio de la cuenta: datos personales, foto, usuario de acceso y
//  contraseña. Toda escritura pasa por /api/cuenta/*; la cookie HttpOnly es la
//  que autoriza. La vista solo refleja el resultado.
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

function toast(titulo, mensaje) {
  try { window.showToast?.(titulo, mensaje, 'success'); } catch (e) {}
}

/** Bloquea un botón y muestra el progreso; devuelve la función que lo restaura. */
function ocupado(boton, texto) {
  if (!boton) return () => {};
  const original = boton.textContent;
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
          return reject(new Error('La foto sigue siendo muy pesada. Prueba con otra imagen.'));
        }
        resolve(data);
      };
      img.src = String(lector.result || '');
    };
    lector.readAsDataURL(file);
  });
}

export const PerfilView = {
  cuenta: null,
  _formulario: null,

  init() {
    const form = porId('formPerfil');
    if (!form || form === this._formulario) return;
    this._formulario = form;
    this._conectarFormularios();
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
  },

  render() {
    const cuenta = this.cuenta;
    if (!cuenta) return;

    const nombre = cuenta.nombre || 'Mi perfil';
    const rol = ROLES[cuenta.rol] || cuenta.rol || '—';
    const foto = cuenta.foto || '';

    const set = (id, valor) => {
      const el = porId(id);
      if (el) el.textContent = valor;
    };

    set('perfilNombre', nombre);
    set('perfilRol', rol);
    set('perfilUsuario', '@' + (cuenta.usuario || '—'));
    set('perfilUsuarioActual', '@' + (cuenta.usuario || '—'));
    set('perfilRolActual', rol);
    const desde = fechaLarga(cuenta.creadoEl);
    set('perfilDesde', desde ? `Miembro desde ${desde}` : '');

    const iniciales = inicialesDe(nombre);
    set('perfilIniciales', iniciales);
    set('perfilFotoIniciales', iniciales);

    const fotoEl = porId('perfilFoto');
    if (fotoEl) {
      if (foto) {
        fotoEl.src = foto;
        fotoEl.hidden = false;
        const ini = porId('perfilIniciales');
        if (ini) ini.style.display = 'none';
      } else {
        fotoEl.removeAttribute('src');
        fotoEl.hidden = true;
        const ini = porId('perfilIniciales');
        if (ini) ini.style.display = '';
      }
    }

    const preview = porId('perfilFotoPreviewImg');
    if (preview) {
      if (foto) {
        preview.src = foto;
        preview.hidden = false;
        const ini = porId('perfilFotoIniciales');
        if (ini) ini.style.display = 'none';
      } else {
        preview.removeAttribute('src');
        preview.hidden = true;
        const ini = porId('perfilFotoIniciales');
        if (ini) ini.style.display = '';
      }
    }

    const nombreInput = porId('perfilInputNombre');
    if (nombreInput) nombreInput.value = cuenta.nombre || '';
    const correoInput = porId('perfilInputCorreo');
    if (correoInput) correoInput.value = cuenta.correo || '';
    const telefonoInput = porId('perfilInputTelefono');
    if (telefonoInput) telefonoInput.value = cuenta.telefono || '';
    const usuarioInput = porId('perfilInputUsuario');
    if (usuarioInput) usuarioInput.value = cuenta.usuario || '';

    const avisoTemporal = porId('perfilAvisoTemporal');
    if (avisoTemporal) avisoTemporal.hidden = !cuenta.debeCambiarClave;

    pintarTopbar(cuenta);
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
    porId('btnElegirFoto')?.addEventListener('click', () => porId('perfilFotoInput')?.click());
    porId('perfilFotoInput')?.addEventListener('change', (e) => {
      const archivo = e.target.files?.[0];
      e.target.value = '';
      if (archivo) this.subirFoto(archivo);
    });
    porId('btnQuitarFoto')?.addEventListener('click', () => this.quitarFoto());
  },

  async guardarDatos() {
    const boton = porId('btnGuardarPerfil');
    const nombre = porId('perfilInputNombre')?.value || '';
    const correo = porId('perfilInputCorreo')?.value || '';
    const telefono = porId('perfilInputTelefono')?.value || '';
    aviso('perfilDatosFeedback', '');

    const liberar = ocupado(boton, 'Guardando…');
    try {
      const { res, datos } = await pedir('/api/cuenta/perfil', {
        method: 'POST',
        body: JSON.stringify({ nombre, correo, telefono }),
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
      liberar();
    }
  },

  async guardarUsuario() {
    const boton = porId('btnGuardarUsuario');
    const usuario = porId('perfilInputUsuario')?.value || '';
    const clave = porId('perfilInputUsuarioClave')?.value || '';
    aviso('perfilUsuarioFeedback', '');

    if (!clave) {
      aviso('perfilUsuarioFeedback', 'Escribe tu contraseña actual para confirmar.', 'error');
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
      porId('perfilInputUsuarioClave').value = '';
      this.render();
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

  async guardarClave() {
    const boton = porId('btnGuardarClave');
    const actual = porId('perfilInputClaveActual')?.value || '';
    const nueva = porId('perfilInputClaveNueva')?.value || '';
    const repetir = porId('perfilInputClaveRepetir')?.value || '';
    aviso('perfilClaveFeedback', '');

    if (nueva.length < 10) {
      aviso('perfilClaveFeedback', 'La nueva contraseña debe tener al menos 10 caracteres.', 'error');
      return;
    }
    if (nueva !== repetir) {
      aviso('perfilClaveFeedback', 'Las dos contraseñas nuevas no coinciden.', 'error');
      return;
    }
    if (nueva === actual) {
      aviso('perfilClaveFeedback', 'La nueva contraseña debe ser distinta de la actual.', 'error');
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
      this.cuenta.debeCambiarClave = false;
      const avisoTemporal = porId('perfilAvisoTemporal');
      if (avisoTemporal) avisoTemporal.hidden = true;
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

  async subirFoto(archivo) {
    aviso('perfilFotoFeedback', 'Preparando la imagen…');
    let data;
    try {
      data = await archivoAImagen(archivo);
    } catch (err) {
      aviso('perfilFotoFeedback', err.message || 'No se pudo preparar la imagen.', 'error');
      return;
    }

    const preview = porId('perfilFotoPreviewImg');
    if (preview) {
      preview.src = data;
      preview.hidden = false;
      const ini = porId('perfilFotoIniciales');
      if (ini) ini.style.display = 'none';
    }

    aviso('perfilFotoFeedback', 'Guardando foto…');
    try {
      const { res, datos } = await pedir('/api/cuenta/foto', {
        method: 'POST',
        body: JSON.stringify({ foto: data }),
      });
      if (!res.ok || !datos.ok) {
        aviso('perfilFotoFeedback', datos.error || 'No se pudo guardar la foto.', 'error');
        return;
      }
      this.cuenta.foto = datos.foto || data;
      localStorage.setItem('pdi_usuario_foto', this.cuenta.foto);
      this.render();
      aviso('perfilFotoFeedback', 'Foto actualizada.', 'ok');
      toast('Foto actualizada', 'Tu nueva foto ya aparece en el menú.');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        aviso('perfilFotoFeedback', 'No se pudo conectar. Intenta de nuevo.', 'error');
      }
    }
  },

  async quitarFoto() {
    aviso('perfilFotoFeedback', 'Quitando foto…');
    try {
      const { res, datos } = await pedir('/api/cuenta/foto', {
        method: 'POST',
        body: JSON.stringify({ foto: null }),
      });
      if (!res.ok || !datos.ok) {
        aviso('perfilFotoFeedback', datos.error || 'No se pudo quitar la foto.', 'error');
        return;
      }
      this.cuenta.foto = '';
      localStorage.removeItem('pdi_usuario_foto');
      this.render();
      aviso('perfilFotoFeedback', 'Foto retirada. Vuelven las iniciales.', 'ok');
    } catch (err) {
      if (err?.message !== 'Sesión expirada') {
        aviso('perfilFotoFeedback', 'No se pudo conectar. Intenta de nuevo.', 'error');
      }
    }
  },
};
