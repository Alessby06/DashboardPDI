// ===========================================================================
//  VISTA: CUENTAS Y ACCESO
// ===========================================================================
//  Administración de identidades del programa. Solo entra el rol `admin`
//  (PageGuard y el endpoint lo comprueban por separado). La vista no guarda
//  nada por su cuenta: cada acción va a /api/cuenta/admin y el servidor
//  devuelve el estado.
//
//  La contraseña temporal se muestra una sola vez, en un diálogo propio. Ni
//  se registra ni se puede recuperar después: si se pierde, se reinicia.
// ===========================================================================
import { escapar } from '../utils/HtmlHelper.js';
import { confirmar } from '../ui/confirmacion.js';
import { fetchSedes } from '../core/db.js';

const ROLES = {
  coord: 'Coordinación',
  facilitadora: 'Facilitadora',
  promotora: 'Promotora',
  social: 'Trabajo Social',
  admin: 'Administración TI',
};

const ROL_OPCIONES = Object.entries(ROLES);

let cuentas = [];
let sedes = [];
let filtro = { texto: '', rol: '', estado: '' };
let documentoEnlazado = false;
let cuerpoEnlazado = null;
let usuarioTocado = false;
let cuentaSedesId = '';
let focoAntesDeModal = null;
let copiarClaveTemporal = '';

function porId(id) {
  return document.getElementById(id);
}

function aviso(titulo, mensaje, tipo = 'success') {
  try {
    if (window.PDI?.ToastView?.show) window.PDI.ToastView.show(titulo, mensaje, tipo);
    else window.showToast?.(titulo, mensaje, tipo);
  } catch {
    // El aviso es cortesía: si falla, la acción ya se hizo.
  }
}

async function pedir(url, opciones = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
    ...opciones,
  });
  const datos = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.replace('/login');
    throw new Error('Sesión expirada');
  }
  if (res.status === 403) {
    aviso('Sin permiso', datos.error || 'Solo administración puede gestionar cuentas.', 'danger');
    window.location.replace('/dashboard');
    throw new Error('Sin permiso');
  }
  return { res, datos };
}

function inicialesDe(nombre) {
  return String(nombre || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('') || '?';
}

function nombreSede(id) {
  const encontrada = sedes.find((s) => s._rawId === id);
  return encontrada?.nombre || String(id || '').replace(/^sede:/, '').replace(/_/g, ' ');
}

/** `Camila Quispe Rojas` → `camila.quispe`. */
function usuarioSugerido(nombre) {
  const partes = String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!partes.length) return '';
  const base = partes.length > 1 ? `${partes[0]}.${partes[1]}` : partes[0];
  return base.slice(0, 32);
}

// --- Modales ---------------------------------------------------------------

function abrirModal(id) {
  const modal = porId(id);
  if (!modal) return;
  focoAntesDeModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modal.removeAttribute('inert');
  modal.removeAttribute('aria-hidden');
  modal.classList.add('open');
  const primero = modal.querySelector('[data-autofocus]')
    || modal.querySelector('input:not([type="hidden"]), select, button');
  if (primero) {
    try {
      primero.focus({ preventScroll: true });
    } catch {
      // Sin foco programático, el teclado entra por el primer control.
    }
  }
}

function cerrarModal(id) {
  const modal = porId(id);
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('inert', '');
  modal.setAttribute('aria-hidden', 'true');
  if (focoAntesDeModal && document.contains(focoAntesDeModal)) {
    try {
      focoAntesDeModal.focus({ preventScroll: true });
    } catch {
      // El origen pudo desaparecer al redibujar la lista.
    }
  }
  focoAntesDeModal = null;
}

function cerrarTodosLosModales() {
  const abierto = document.querySelector('.cuentas-modal.open');
  if (abierto) cerrarModal(abierto.id);
}

// --- Lista -----------------------------------------------------------------

function coincide(cuenta) {
  const texto = filtro.texto.trim().toLowerCase();
  if (texto) {
    const heno = `${cuenta.nombre} ${cuenta.usuario}`.toLowerCase();
    if (!heno.includes(texto)) return false;
  }
  if (filtro.rol && cuenta.rol !== filtro.rol) return false;
  if (filtro.estado === 'activas' && !cuenta.activo) return false;
  if (filtro.estado === 'inactivas' && cuenta.activo) return false;
  return true;
}

function filaHtml(cuenta) {
  const sedesCuenta = Array.isArray(cuenta.sedes) ? cuenta.sedes : [];
  const chips = sedesCuenta.length
    ? sedesCuenta.map((id) => `<span class="cuenta-sede">${escapar(nombreSede(id))}</span>`).join('')
    : '<span class="cuenta-sede cuenta-sede--vacia">Sin sede · ve todas</span>';

  const opcionesRol = ROL_OPCIONES.map(
    ([valor, etiqueta]) => `<option value="${valor}"${valor === cuenta.rol ? ' selected' : ''}>${etiqueta}</option>`,
  ).join('');

  // El segundo factor es opcional para todos mientras dure el desarrollo; se
  // muestra solo su estado, sin insinuar una obligación que no existe.
  const mfa = cuenta.totpActivo ? 'MFA activo' : 'MFA opcional';

  return `
    <div class="cuenta-fila${cuenta.activo ? '' : ' is-inactiva'}" data-id="${escapar(cuenta.id)}">
      <div class="cuenta-identidad">
        <span class="cuenta-avatar" aria-hidden="true">${escapar(inicialesDe(cuenta.nombre))}</span>
        <span class="cuenta-texto">
          <span class="cuenta-nombre">${escapar(cuenta.nombre)}</span>
          <span class="cuenta-usuario">@${escapar(cuenta.usuario)}</span>
        </span>
      </div>

      <div>
        <select class="cuentas-select cuenta-rol-select" data-accion="rol" data-pdi-select="native"
          aria-label="Rol de ${escapar(cuenta.nombre)}">
          ${opcionesRol}
        </select>
      </div>

      <div class="cuenta-sedes">${chips}</div>

      <div class="cuenta-acciones">
        <span class="cuenta-estado-bloque">
          <span class="cuenta-estado${cuenta.activo ? '' : ' is-inactiva'}">${cuenta.activo ? 'Activa' : 'Desactivada'}</span>
          <span class="cuenta-mfa">${escapar(mfa)}</span>
        </span>
        <button type="button" class="cuentas-btn" data-accion="sedes" title="Editar sedes">
          Sedes
        </button>
        <button type="button" class="cuentas-btn" data-accion="clave" title="Reiniciar contraseña">
          Clave
        </button>
        <button type="button" class="cuentas-btn${cuenta.activo ? ' cuentas-btn--peligro' : ''}"
          data-accion="estado" data-activo="${cuenta.activo ? '1' : '0'}" title="${cuenta.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}">
          ${cuenta.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>`;
}

function render() {
  const lista = porId('cuentasLista');
  if (!lista) return;

  const visibles = cuentas.filter(coincide);

  const resumen = porId('cuentasResumen');
  if (resumen) {
    const activas = cuentas.filter((c) => c.activo).length;
    resumen.innerHTML = cuentas.length
      ? `<span><strong>${cuentas.length}</strong> cuentas</span>
         <span><strong>${activas}</strong> activas</span>
         <span><strong>${cuentas.length - activas}</strong> desactivadas</span>`
      : '';
  }

  if (!visibles.length) {
    lista.innerHTML = `<div class="cuentas-vacio">
      <strong>${cuentas.length ? 'Ninguna cuenta coincide con el filtro' : 'Todavía no hay cuentas'}</strong>
      ${cuentas.length ? 'Cambia la búsqueda o el filtro.' : 'Crea la primera cuenta con el botón «Nueva cuenta».'}
    </div>`;
    return;
  }

  lista.innerHTML = visibles.map(filaHtml).join('');
}

async function cargar() {
  const res = await pedir('/api/cuenta/admin', { method: 'GET' });
  if (!res.res.ok || !res.datos.ok) {
    throw new Error(res.datos.error || 'No se pudieron cargar las cuentas.');
  }
  cuentas = Array.isArray(res.datos.cuentas) ? res.datos.cuentas : [];
  render();
}

async function cargarSedes() {
  try {
    const lista = await fetchSedes();
    sedes = Array.isArray(lista) ? lista : [];
  } catch {
    sedes = [];
  }
  pintarSedes('ctaSedes', []);
}

function pintarSedes(contenedorId, seleccionadas) {
  const caja = porId(contenedorId);
  if (!caja) return;
  if (!sedes.length) {
    caja.innerHTML = '<span class="cuentas-hint">No se pudieron cargar las sedes. Vuelve a abrir el formulario.</span>';
    return;
  }
  const marcadas = new Set(seleccionadas);
  caja.innerHTML = sedes.map((sede) => `
    <label>
      <input type="checkbox" value="${escapar(sede._rawId)}"${marcadas.has(sede._rawId) ? ' checked' : ''} />
      <span>${escapar(sede.nombre)}</span>
    </label>`).join('');
}

// --- Acciones --------------------------------------------------------------

async function crearCuenta(evento) {
  evento.preventDefault();
  const boton = porId('btnCrearCuenta');
  const error = porId('ctaError');
  if (error) error.textContent = '';

  const nombre = porId('ctaNombre')?.value.trim() || '';
  const usuario = porId('ctaUsuario')?.value.trim() || '';
  const rol = porId('ctaRol')?.value || 'promotora';
  const correo = porId('ctaCorreo')?.value.trim() || '';
  const telefono = porId('ctaTelefono')?.value.trim() || '';
  const sedesMarcadas = Array.from(porId('ctaSedes')?.querySelectorAll('input:checked') || []).map(
    (el) => el.value,
  );

  if (!nombre) {
    if (error) error.textContent = 'Escribe el nombre completo.';
    porId('campoNombre')?.classList.add('is-invalid');
    porId('ctaNombre')?.focus();
    return;
  }
  if (!usuario) {
    if (error) error.textContent = 'Escribe el nombre de usuario.';
    porId('campoUsuario')?.classList.add('is-invalid');
    porId('ctaUsuario')?.focus();
    return;
  }

  const original = boton?.textContent || '';
  if (boton) {
    boton.disabled = true;
    boton.textContent = 'Creando…';
  }

  try {
    const { res, datos } = await pedir('/api/cuenta/admin', {
      method: 'POST',
      body: JSON.stringify({ accion: 'crear', nombre, usuario, rol, correo, telefono, sedes: sedesMarcadas }),
    });

    if (!res.ok || !datos.ok) {
      if (error) error.textContent = datos.error || 'No se pudo crear la cuenta.';
      porId('campoUsuario')?.classList.add('is-invalid');
      return;
    }

    cerrarModal('cuentasModal');
    reiniciarFormulario();
    mostrarClave(
      'Cuenta creada',
      `Contraseña temporal de ${datos.cuenta?.nombre || nombre} (@${datos.cuenta?.usuario || usuario}).`,
      datos.claveTemporal,
    );
    aviso('Cuenta creada', `${datos.cuenta?.nombre || nombre} ya puede entrar.`);
    await cargar();
  } catch (err) {
    if (error) error.textContent = err?.message || 'No se pudo crear la cuenta.';
  } finally {
    if (boton) {
      boton.disabled = false;
      boton.textContent = original || 'Crear cuenta';
    }
  }
}

function reiniciarFormulario() {
  const form = porId('formNuevaCuenta');
  if (!form) return;
  form.reset();
  usuarioTocado = false;
  // El select de rol viaja envuelto por customSelect: `reset()` cambia el
  // valor pero no repinta la etiqueta del botón visible.
  const rol = porId('ctaRol');
  if (rol) {
    rol.value = 'promotora';
    rol.dispatchEvent(new Event('change', { bubbles: true }));
  }
  for (const id of ['campoNombre', 'campoUsuario']) {
    porId(id)?.classList.remove('is-invalid');
  }
  const error = porId('ctaError');
  if (error) error.textContent = '';
  pintarSedes('ctaSedes', []);
}

function mostrarClave(titulo, texto, clave) {
  copiarClaveTemporal = String(clave || '');
  const elTitulo = porId('claveModalTitulo');
  const elTexto = porId('claveModalTexto');
  const elValor = porId('claveModalValor');
  if (elTitulo) elTitulo.textContent = titulo;
  if (elTexto) elTexto.textContent = texto;
  if (elValor) elValor.textContent = copiarClaveTemporal;
  abrirModal('cuentasClaveModal');
}

async function cambiarEstado(cuenta) {
  const desactivar = cuenta.activo;
  const confirmado = await confirmar({
    titulo: desactivar ? 'Desactivar cuenta' : 'Reactivar cuenta',
    mensaje: desactivar
      ? `${cuenta.nombre} dejará de poder entrar y sus sesiones abiertas se cerrarán en el acto. La cuenta y su historial se conservan.`
      : `${cuenta.nombre} podrá volver a entrar con su contraseña actual.`,
    confirmar: desactivar ? 'Desactivar' : 'Reactivar',
    peligro: desactivar,
  });
  if (!confirmado) return;

  const { res, datos } = await pedir('/api/cuenta/admin', {
    method: 'POST',
    body: JSON.stringify({ accion: 'estado', id: cuenta.id, activo: !desactivar }),
  });
  if (!res.ok || !datos.ok) {
    aviso('No se pudo cambiar', datos.error || 'Intenta de nuevo.', 'danger');
    return;
  }
  aviso(desactivar ? 'Cuenta desactivada' : 'Cuenta reactivada', cuenta.nombre);
  await cargar();
}

async function cambiarRol(cuenta, select) {
  const nuevo = select.value;
  if (nuevo === cuenta.rol) return;

  const confirmado = await confirmar({
    titulo: 'Cambiar rol',
    mensaje: `El rol de ${cuenta.nombre} pasará de ${ROLES[cuenta.rol] || cuenta.rol} a ${ROLES[nuevo] || nuevo}. Se cerrará su sesión y deberá volver a entrar para ver el menú nuevo.`,
    confirmar: 'Cambiar rol',
  });
  if (!confirmado) {
    select.value = cuenta.rol;
    return;
  }

  const { res, datos } = await pedir('/api/cuenta/admin', {
    method: 'POST',
    body: JSON.stringify({ accion: 'rol', id: cuenta.id, rol: nuevo }),
  });
  if (!res.ok || !datos.ok) {
    select.value = cuenta.rol;
    aviso('No se pudo cambiar el rol', datos.error || 'Intenta de nuevo.', 'danger');
    return;
  }
  aviso('Rol actualizado', `${cuenta.nombre} deberá volver a entrar.`);
  await cargar();
}

async function reiniciarClave(cuenta) {
  const confirmado = await confirmar({
    titulo: 'Reiniciar contraseña',
    mensaje: `Se generará una contraseña temporal para ${cuenta.nombre} y se cerrarán sus sesiones abiertas. La anterior dejará de funcionar.`,
    confirmar: 'Generar contraseña',
    peligro: true,
  });
  if (!confirmado) return;

  const { res, datos } = await pedir('/api/cuenta/admin', {
    method: 'POST',
    body: JSON.stringify({ accion: 'clave', id: cuenta.id }),
  });
  if (!res.ok || !datos.ok) {
    aviso('No se pudo reiniciar', datos.error || 'Intenta de nuevo.', 'danger');
    return;
  }
  mostrarClave(
    'Contraseña reiniciada',
    `Nueva contraseña temporal de ${cuenta.nombre} (@${cuenta.usuario}).`,
    datos.claveTemporal,
  );
}

function abrirSedes(cuenta) {
  cuentaSedesId = cuenta.id;
  const texto = porId('sedesModalTexto');
  if (texto) texto.textContent = `Marca las sedes que ${cuenta.nombre} puede atender.`;
  const error = porId('sedesModalError');
  if (error) error.textContent = '';
  pintarSedes('sedesModalLista', Array.isArray(cuenta.sedes) ? cuenta.sedes : []);
  abrirModal('cuentasSedesModal');
}

async function guardarSedes() {
  const cuenta = cuentas.find((c) => c.id === cuentaSedesId);
  if (!cuenta) return;
  const marcadas = Array.from(porId('sedesModalLista')?.querySelectorAll('input:checked') || []).map(
    (el) => el.value,
  );

  const boton = porId('btnGuardarSedes');
  const original = boton?.textContent || '';
  if (boton) {
    boton.disabled = true;
    boton.textContent = 'Guardando…';
  }
  try {
    const { res, datos } = await pedir('/api/cuenta/admin', {
      method: 'POST',
      body: JSON.stringify({ accion: 'sedes', id: cuenta.id, sedes: marcadas }),
    });
    if (!res.ok || !datos.ok) {
      const error = porId('sedesModalError');
      if (error) error.textContent = datos.error || 'No se pudieron guardar las sedes.';
      return;
    }
    cerrarModal('cuentasSedesModal');
    aviso('Sedes actualizadas', cuenta.nombre);
    await cargar();
  } finally {
    if (boton) {
      boton.disabled = false;
      boton.textContent = original || 'Guardar sedes';
    }
  }
}

// --- Enlace ----------------------------------------------------------------

function alHacerClic(evento) {
  const cerrar = evento.target.closest('[data-cerrar]');
  if (cerrar) {
    cerrarModal(cerrar.getAttribute('data-cerrar'));
    return;
  }

  // Clic en el velo, fuera de la caja: se cierra.
  const velo = evento.target.classList?.contains('cuentas-modal') ? evento.target : null;
  if (velo) {
    cerrarModal(velo.id);
    return;
  }

  const boton = evento.target.closest('#cuentasLista [data-accion]');
  if (!boton) return;
  const fila = boton.closest('.cuenta-fila');
  const cuenta = cuentas.find((c) => c.id === fila?.dataset.id);
  if (!cuenta) return;

  const accion = boton.getAttribute('data-accion');
  if (accion === 'estado') cambiarEstado(cuenta);
  else if (accion === 'clave') reiniciarClave(cuenta);
  else if (accion === 'sedes') abrirSedes(cuenta);
}

function alCambiar(evento) {
  const select = evento.target.closest('#cuentasLista select[data-accion="rol"]');
  if (!select) return;
  const fila = select.closest('.cuenta-fila');
  const cuenta = cuentas.find((c) => c.id === fila?.dataset.id);
  if (cuenta) cambiarRol(cuenta, select);
}

function alTeclear(evento) {
  const abierto = document.querySelector('.cuentas-modal.open');
  if (!abierto) return;

  if (evento.key === 'Escape') {
    evento.preventDefault();
    cerrarModal(abierto.id);
    return;
  }

  if (evento.key !== 'Tab') return;
  const caja = abierto.querySelector('.cuentas-modal-box');
  if (!caja) return;
  const enfocables = Array.from(
    caja.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]'),
  ).filter((el) => el.getClientRects().length > 0);
  if (!enfocables.length) return;
  const primero = enfocables[0];
  const ultimo = enfocables[enfocables.length - 1];
  if (evento.shiftKey && document.activeElement === primero) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault();
    primero.focus();
  }
}

function enlazar() {
  // El ClientRouter reemplaza el <body> en cada navegación interna, pero el
  // documento (y estos listeners) sobreviven. Los de documento se enganchan
  // una sola vez; los de los elementos, una vez por body.
  if (!documentoEnlazado) {
    documentoEnlazado = true;
    document.addEventListener('click', alHacerClic);
    document.addEventListener('change', alCambiar);
    document.addEventListener('keydown', alTeclear);
  }

  if (cuerpoEnlazado !== document.body) {
    cuerpoEnlazado = document.body;

    porId('btnNuevaCuenta')?.addEventListener('click', () => {
      reiniciarFormulario();
      abrirModal('cuentasModal');
    });

    porId('formNuevaCuenta')?.addEventListener('submit', crearCuenta);

    porId('ctaNombre')?.addEventListener('input', (evento) => {
      if (usuarioTocado) return;
      const campo = porId('ctaUsuario');
      if (campo) campo.value = usuarioSugerido(evento.target.value);
      porId('campoNombre')?.classList.remove('is-invalid');
      porId('campoUsuario')?.classList.remove('is-invalid');
    });

    porId('ctaUsuario')?.addEventListener('input', () => {
      usuarioTocado = true;
      porId('campoUsuario')?.classList.remove('is-invalid');
    });

    porId('btnGuardarSedes')?.addEventListener('click', guardarSedes);

    porId('btnCopiarClave')?.addEventListener('click', async () => {
      if (!copiarClaveTemporal) return;
      try {
        await navigator.clipboard.writeText(copiarClaveTemporal);
        aviso('Copiada', 'La contraseña está en el portapapeles. Compártela por un canal privado.', 'info');
      } catch {
        aviso('No se pudo copiar', 'Selecciona la contraseña y cópiala a mano.', 'warning');
      }
    });

    const buscar = porId('cuentasBuscar');
    buscar?.addEventListener('input', () => {
      filtro.texto = buscar.value;
      render();
    });

    const rol = porId('cuentasRol');
    rol?.addEventListener('change', () => {
      filtro.rol = rol.value;
      render();
    });

    const estado = porId('cuentasEstado');
    estado?.addEventListener('change', () => {
      filtro.estado = estado.value;
      render();
    });
  }
}

async function iniciar() {
  enlazar();

  const lista = porId('cuentasLista');
  if (!lista) return;
  try {
    await cargarSedes();
    await cargar();
  } catch (err) {
    lista.innerHTML = `<div class="cuentas-vacio">
      <strong>No se pudieron cargar las cuentas</strong>
      ${escapar(err?.message || 'Revisa la conexión y recarga la página.')}
    </div>`;
  }
}

export const CuentasView = { iniciar, cargar };
