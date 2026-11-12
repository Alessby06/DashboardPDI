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
import { AnimationEngine } from '../utils/AnimationEngine.js';
import { guardarCache, leerCache } from '../core/snapshot.js';
import { confirmar } from '../ui/confirmacion.js';
import { fetchSedes } from '../core/db.js';
import { clasificarCuentaBasura } from '../utils/cuentasBasura.js';

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
let actualId = '';
let filtro = { texto: '', rol: '', estado: '' };
let documentoEnlazado = false;
let cuerpoEnlazado = null;
let usuarioTocado = false;
let cuentaSedesId = '';
let focoAntesDeModal = null;
let copiarClaveTemporal = '';
const seleccionadas = new Set();

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

function adminsActivosCount() {
  return cuentas.filter((c) => c.rol === 'admin' && c.activo).length;
}

function motivoNoEliminable(cuenta) {
  if (!cuenta) return 'Cuenta no válida.';
  if (actualId && cuenta.id === actualId) return 'No puedes eliminar tu propia cuenta.';
  if (cuenta.rol === 'admin' && cuenta.activo && adminsActivosCount() <= 1) {
    return 'Debe quedar al menos una cuenta de administración activa.';
  }
  return '';
}

function puedeEliminar(cuenta) {
  return !motivoNoEliminable(cuenta);
}

function cuentasDetectadas() {
  return cuentas.filter(
    (c) => (!actualId || c.id !== actualId) && clasificarCuentaBasura(c) && puedeEliminar(c),
  );
}

function coincide(cuenta) {
  const texto = filtro.texto.trim().toLowerCase();
  if (texto) {
    const heno = `${cuenta.nombre} ${cuenta.usuario}`.toLowerCase();
    if (!heno.includes(texto)) return false;
  }
  if (filtro.rol && cuenta.rol !== filtro.rol) return false;
  if (filtro.estado === 'activas' && !cuenta.activo) return false;
  if (filtro.estado === 'inactivas' && cuenta.activo) return false;
  if (filtro.estado === 'sospechosas' && !clasificarCuentaBasura(cuenta)) return false;
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

  // El segundo factor es opcional para todos durante el desarrollo; solo se
  // destaca cuando ya está activo, para no repetir la misma nota en cada fila.
  const mfa = cuenta.totpActivo
    ? '<span class="cuenta-mfa">MFA activo</span>'
    : '';

  const esPropia = Boolean(actualId && cuenta.id === actualId);
  const deteccion = esPropia ? null : clasificarCuentaBasura(cuenta);
  const bloqueoEliminar = motivoNoEliminable(cuenta);
  const marcada = !bloqueoEliminar && seleccionadas.has(cuenta.id);

  return `
    <div class="cuenta-fila${cuenta.activo ? '' : ' is-inactiva'}${deteccion ? ' is-sospechosa' : ''}" role="listitem" data-id="${escapar(cuenta.id)}">
      <div class="cuenta-identidad">
        <label class="cuenta-check-wrap" title="${escapar(bloqueoEliminar || `Seleccionar ${cuenta.nombre}`)}">
          <input
            type="checkbox"
            class="cuenta-check"
            data-seleccionar="${escapar(cuenta.id)}"
            aria-label="${escapar(bloqueoEliminar ? `${cuenta.nombre}: ${bloqueoEliminar}` : `Seleccionar cuenta de ${cuenta.nombre}`)}"
            ${marcada ? 'checked' : ''}
            ${bloqueoEliminar ? 'disabled' : ''}
          />
        </label>
        <span class="cuenta-avatar" aria-hidden="true">${escapar(inicialesDe(cuenta.nombre))}</span>
        <span class="cuenta-texto">
          <span class="cuenta-nombre">${escapar(cuenta.nombre)}</span>
          <span class="cuenta-usuario-linea">
            <span class="cuenta-usuario">@${escapar(cuenta.usuario)}</span>
            ${esPropia ? '<span class="status-mark status-mark--ok cuenta-marca"><span class="status-mark-dot" aria-hidden="true"></span>Tu cuenta</span>' : ''}
            ${deteccion ? `<span class="status-mark status-mark--${deteccion.tipo === 'e2e' ? 'danger' : 'warn'} cuenta-marca" title="${escapar(deteccion.motivo)}"><span class="status-mark-dot" aria-hidden="true"></span>${escapar(deteccion.etiqueta)}</span>` : ''}
          </span>
        </span>
      </div>

      <div>
        <select class="cuentas-select cuenta-rol-select" data-accion="rol" data-pdi-select="native"
          aria-label="Rol de ${escapar(cuenta.nombre)}">
          ${opcionesRol}
        </select>
      </div>

      <div class="cuenta-sedes" aria-label="Sedes asignadas">${chips}</div>

      <div class="cuenta-acciones">
        <span class="cuenta-estado-bloque">
          <span class="cuenta-estado${cuenta.activo ? '' : ' is-inactiva'}">${cuenta.activo ? 'Activa' : 'Desactivada'}</span>
          ${mfa}
        </span>
        <button type="button" class="cuentas-btn" data-accion="sedes" aria-label="Editar sedes de ${escapar(cuenta.nombre)}">
          Sedes
        </button>
        <button type="button" class="cuentas-btn" data-accion="clave" aria-label="Reiniciar contraseña de ${escapar(cuenta.nombre)}">
          Clave
        </button>
        <button type="button" class="cuentas-btn"
          data-accion="estado" data-activo="${cuenta.activo ? '1' : '0'}" aria-label="${cuenta.activo ? 'Desactivar' : 'Activar'} cuenta de ${escapar(cuenta.nombre)}">
          ${cuenta.activo ? 'Desactivar' : 'Activar'}
        </button>
        <button type="button" class="cuentas-btn cuentas-btn--peligro"
          data-accion="eliminar"
          aria-label="${escapar(bloqueoEliminar ? `${cuenta.nombre}: ${bloqueoEliminar}` : `Eliminar cuenta de ${cuenta.nombre}`)}"
          title="${escapar(bloqueoEliminar || 'Eliminar cuenta definitivamente')}"
          ${bloqueoEliminar ? 'disabled' : ''}>
          Eliminar
        </button>
      </div>
    </div>`;
}

function sincronizarChecks() {
  const lista = porId('cuentasLista');
  if (!lista) return;
  lista.querySelectorAll('input[data-seleccionar]').forEach((input) => {
    const id = input.getAttribute('data-seleccionar') || '';
    input.checked = !input.disabled && seleccionadas.has(id);
  });
}

function renderLoteBar() {
  const bar = porId('cuentasLoteBar');
  const info = porId('cuentasLoteInfo');
  const acciones = porId('cuentasLoteAcciones');
  if (!bar || !info || !acciones) return;

  const porIdCuenta = new Map(cuentas.map((c) => [c.id, c]));
  for (const id of [...seleccionadas]) {
    const cuenta = porIdCuenta.get(id);
    if (!cuenta || !puedeEliminar(cuenta)) seleccionadas.delete(id);
  }

  const detectadas = cuentasDetectadas();
  const e2eCount = detectadas.filter((c) => clasificarCuentaBasura(c)?.tipo === 'e2e').length;
  const pruebaCount = detectadas.length - e2eCount;
  const visiblesEliminables = cuentas.filter((c) => coincide(c) && puedeEliminar(c));

  if (!detectadas.length && !seleccionadas.size) {
    bar.hidden = true;
    info.innerHTML = '';
    acciones.innerHTML = '';
    return;
  }

  bar.hidden = false;

  if (seleccionadas.size > 0) {
    const sufijo = seleccionadas.size === 1 ? 'cuenta seleccionada' : 'cuentas seleccionadas';
    const extraDetectadas = detectadas.length
      ? ` <span class="cuentas-lote-detalle">(${detectadas.length} detectadas como posibles pruebas)</span>`
      : '';
    info.innerHTML = `<strong>${seleccionadas.size}</strong> ${sufijo} para eliminar.${extraDetectadas}`;
  } else if (e2eCount && pruebaCount) {
    info.innerHTML = `Detectadas <strong>${detectadas.length}</strong> cuentas posibles de prueba o basura (${e2eCount} E2E, ${pruebaCount} manuales).`;
  } else if (e2eCount) {
    info.innerHTML = `Detectadas <strong>${e2eCount}</strong> ${e2eCount === 1 ? 'cuenta temporal' : 'cuentas temporales'} de pruebas E2E.`;
  } else {
    info.innerHTML = `Detectadas <strong>${pruebaCount}</strong> ${pruebaCount === 1 ? 'posible cuenta' : 'posibles cuentas'} de prueba o basura.`;
  }

  const botones = [];
  if (detectadas.length > 0) {
    botones.push(
      `<button type="button" class="cuentas-btn cuentas-btn--mini" data-lote="filtrar">${filtro.estado === 'sospechosas' ? 'Ver todas' : `Ver detectadas (${detectadas.length})`}</button>`,
    );
    const faltanDetectadas = detectadas.some((c) => !seleccionadas.has(c.id));
    if (faltanDetectadas) {
      botones.push(
        `<button type="button" class="cuentas-btn cuentas-btn--mini" data-lote="seleccionar-detectadas">Seleccionar detectadas (${detectadas.length})</button>`,
      );
    }
  }

  if (seleccionadas.size > 0) {
    if (visiblesEliminables.some((c) => !seleccionadas.has(c.id))) {
      botones.push(
        `<button type="button" class="cuentas-btn cuentas-btn--mini" data-lote="seleccionar-visibles">Seleccionar visibles (${visiblesEliminables.length})</button>`,
      );
    }
    botones.push(
      '<button type="button" class="cuentas-btn cuentas-btn--mini" data-lote="limpiar">Deseleccionar</button>',
    );
    botones.push(
      `<button type="button" class="cuentas-btn cuentas-btn--mini cuentas-btn--peligro" data-lote="eliminar">Eliminar seleccionadas (${seleccionadas.size})</button>`,
    );
  }

  acciones.innerHTML = botones.join('');
}

function render() {
  const lista = porId('cuentasLista');
  if (!lista) return;

  const visibles = cuentas.filter(coincide);

  const resumen = porId('cuentasResumen');
  if (resumen) {
    const activas = cuentas.filter((c) => c.activo).length;
    const detectadas = cuentasDetectadas().length;
    resumen.innerHTML = cuentas.length
      ? `<span><strong>${cuentas.length}</strong> cuentas</span>
         <span><strong>${activas}</strong> activas</span>
         <span><strong>${cuentas.length - activas}</strong> desactivadas</span>
         ${detectadas ? `<span><strong>${detectadas}</strong> posibles pruebas</span>` : ''}`
      : '';
  }

  renderLoteBar();

  if (!visibles.length) {
    lista.innerHTML = `<div class="cuentas-vacio">
      <strong>${cuentas.length ? 'Ninguna cuenta coincide con el filtro' : 'Todavía no hay cuentas'}</strong>
      ${cuentas.length ? 'Cambia la búsqueda o el filtro.' : 'Crea la primera cuenta con el botón «Nueva cuenta».'}
    </div>`;
    return;
  }

  lista.innerHTML = visibles.map(filaHtml).join('');
  AnimationEngine.destacarCambio(lista);
}

async function cargar() {
  const res = await pedir('/api/cuenta/admin', { method: 'GET' });
  if (!res.res.ok || !res.datos.ok) {
    throw new Error(res.datos.error || 'No se pudieron cargar las cuentas.');
  }
  actualId = String(res.datos.actualId || '');
  cuentas = Array.isArray(res.datos.cuentas) ? res.datos.cuentas : [];
  render();
  guardarCache('cuentas', cuentas, { ttlMs: 10 * 60 * 1000 });
}

function actualizarResumenSedes() {
  const resumen = porId('ctaSedesResumen');
  const caja = porId('ctaSedes');
  if (!resumen || !caja) return;
  const casillas = caja.querySelectorAll('input[type="checkbox"]');
  if (!sedes.length) {
    resumen.textContent = 'Las sedes estarán disponibles en un momento.';
    return;
  }
  const marcadas = caja.querySelectorAll('input[type="checkbox"]:checked').length;
  resumen.textContent = marcadas === 0
    ? 'Verá: todas las sedes'
    : `Verá: ${marcadas} de ${casillas.length} sedes`;
}

async function cargarSedes() {
  // Si la lista ya está en memoria se pinta sin bloquear el botón y se
  // refresca en segundo plano, por si se añadió una sede en otra sección.
  if (sedes.length) {
    pintarSedes('ctaSedes', []);
    actualizarResumenSedes();
    fetchSedes()
      .then((lista) => {
        const nuevas = Array.isArray(lista) ? lista : [];
        if (!nuevas.length) return;
        sedes = nuevas;
        // Si el formulario está abierto, se conservan las sedes marcadas.
        const marcadas = Array.from(
          porId('ctaSedes')?.querySelectorAll('input:checked') || [],
        ).map((el) => el.value);
        pintarSedes('ctaSedes', marcadas);
        actualizarResumenSedes();
      })
      .catch(() => { /* se conserva la copia en memoria */ });
    return;
  }

  const boton = porId('btnCrearCuenta');
  if (boton) boton.disabled = true;
  try {
    const lista = await fetchSedes();
    sedes = Array.isArray(lista) ? lista : [];
  } catch {
    sedes = [];
  }
  pintarSedes('ctaSedes', []);
  actualizarResumenSedes();
  if (boton) boton.disabled = false;
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

  limpiarErrorCampo('ctaNombre', 'ctaNombreError');
  limpiarErrorCampo('ctaUsuario', 'ctaUsuarioError');

  const nombre = porId('ctaNombre')?.value.trim() || '';
  const usuario = porId('ctaUsuario')?.value.trim() || '';
  const rol = porId('ctaRol')?.value || 'promotora';
  const correo = porId('ctaCorreo')?.value.trim() || '';
  const telefono = porId('ctaTelefono')?.value.trim() || '';
  const sedesMarcadas = Array.from(porId('ctaSedes')?.querySelectorAll('input:checked') || []).map(
    (el) => el.value,
  );

  if (!nombre) {
    mostrarErrorCampo('ctaNombre', 'ctaNombreError', 'Escribe el nombre completo.');
    porId('ctaNombre')?.focus();
    return;
  }
  if (!usuario) {
    mostrarErrorCampo('ctaUsuario', 'ctaUsuarioError', 'Escribe el nombre de usuario.');
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
      mostrarErrorCampo('ctaUsuario', 'ctaUsuarioError', datos.error || 'No se pudo crear la cuenta.');
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
    AnimationEngine.marcarCambio(datos.cuenta?.id);
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

function mostrarErrorCampo(campoId, errorId, mensaje) {
  const campo = porId(campoId);
  const errorCampo = porId(errorId);
  if (campo) campo.setAttribute('aria-invalid', 'true');
  if (errorCampo) {
    errorCampo.textContent = mensaje || '';
    errorCampo.hidden = !mensaje;
  }
}

function limpiarErrorCampo(campoId, errorId) {
  const campo = porId(campoId);
  const errorCampo = porId(errorId);
  if (campo) campo.removeAttribute('aria-invalid');
  if (errorCampo) {
    errorCampo.textContent = '';
    errorCampo.hidden = true;
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
  limpiarErrorCampo('ctaNombre', 'ctaNombreError');
  limpiarErrorCampo('ctaUsuario', 'ctaUsuarioError');
  const error = porId('ctaError');
  if (error) error.textContent = '';
  pintarSedes('ctaSedes', []);
  actualizarResumenSedes();
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
  AnimationEngine.marcarCambio(cuenta.id);
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
  AnimationEngine.marcarCambio(cuenta.id);
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
    AnimationEngine.marcarCambio(cuenta.id);
    await cargar();
  } finally {
    if (boton) {
      boton.disabled = false;
      boton.textContent = original || 'Guardar sedes';
    }
  }
}

async function eliminarCuenta(cuenta, origen = null) {
  const bloqueo = motivoNoEliminable(cuenta);
  if (bloqueo) {
    aviso('No se puede eliminar', bloqueo, 'warning');
    return;
  }

  const confirmado = await confirmar({
    titulo: 'Eliminar cuenta',
    mensaje: `Se eliminará definitivamente la cuenta de ${cuenta.nombre} (@${cuenta.usuario}). No podrá volver a entrar y esta acción no se puede deshacer.`,
    confirmar: 'Eliminar cuenta',
    peligro: true,
    origen,
  });
  if (!confirmado) return;

  try {
    const { res, datos } = await pedir('/api/cuenta/admin', {
      method: 'POST',
      body: JSON.stringify({ accion: 'eliminar', id: cuenta.id }),
    });
    if (!res.ok || !datos.ok) {
      aviso('No se pudo eliminar', datos.error || 'Intenta de nuevo.', 'danger');
      return;
    }
    seleccionadas.delete(cuenta.id);
    aviso('Cuenta eliminada', `${cuenta.nombre} (@${cuenta.usuario})`);
    await cargar();
    if (filtro.estado === 'sospechosas' && !cuentasDetectadas().length) {
      restablecerFiltroEstado();
    }
  } catch (err) {
    aviso('No se pudo eliminar', err?.message || 'Intenta de nuevo.', 'danger');
  }
}

async function eliminarSeleccionadas(origen = null) {
  const porIdCuenta = new Map(cuentas.map((c) => [c.id, c]));
  const objetivoLista = [...seleccionadas]
    .map((id) => porIdCuenta.get(id))
    .filter((c) => c && puedeEliminar(c));

  if (!objetivoLista.length) {
    seleccionadas.clear();
    renderLoteBar();
    return;
  }

  const muestra = objetivoLista.slice(0, 5).map((c) => `@${c.usuario}`).join(', ');
  const extra = objetivoLista.length > 5 ? ` y ${objetivoLista.length - 5} más` : '';
  const confirmado = await confirmar({
    titulo: 'Eliminar cuentas seleccionadas',
    mensaje: `Se eliminarán definitivamente ${objetivoLista.length} cuenta(s): ${muestra}${extra}. Esta acción no se puede deshacer.`,
    confirmar: `Eliminar ${objetivoLista.length} cuenta(s)`,
    peligro: true,
    origen,
  });
  if (!confirmado) return;

  if (origen) origen.disabled = true;
  try {
    const { res, datos } = await pedir('/api/cuenta/admin', {
      method: 'POST',
      body: JSON.stringify({ accion: 'eliminar_lote', ids: objetivoLista.map((c) => c.id) }),
    });
    if (!res.ok || !datos.ok) {
      aviso('No se pudieron eliminar', datos.error || 'Intenta de nuevo.', 'danger');
      return;
    }
    for (const c of objetivoLista) seleccionadas.delete(c.id);
    const total = Array.isArray(datos.eliminadas) ? datos.eliminadas.length : objetivoLista.length;
    aviso('Cuentas eliminadas', `Se eliminaron ${total} cuenta(s).`);
    await cargar();
    if (filtro.estado === 'sospechosas' && !cuentasDetectadas().length) {
      restablecerFiltroEstado();
    }
  } catch (err) {
    aviso('No se pudieron eliminar', err?.message || 'Intenta de nuevo.', 'danger');
  } finally {
    if (origen && document.contains(origen)) origen.disabled = false;
  }
}

function restablecerFiltroEstado(valor = '') {
  const select = porId('cuentasEstado');
  if (select) {
    select.value = valor;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    filtro.estado = valor;
    render();
  }
}

function manejarAccionLote(accion, boton) {
  if (accion === 'filtrar') {
    restablecerFiltroEstado(filtro.estado === 'sospechosas' ? '' : 'sospechosas');
    return;
  }
  if (accion === 'seleccionar-detectadas') {
    for (const c of cuentasDetectadas()) seleccionadas.add(c.id);
    sincronizarChecks();
    renderLoteBar();
    return;
  }
  if (accion === 'seleccionar-visibles') {
    for (const c of cuentas) {
      if (coincide(c) && puedeEliminar(c)) seleccionadas.add(c.id);
    }
    sincronizarChecks();
    renderLoteBar();
    return;
  }
  if (accion === 'limpiar') {
    seleccionadas.clear();
    sincronizarChecks();
    renderLoteBar();
    return;
  }
  if (accion === 'eliminar') {
    eliminarSeleccionadas(boton);
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

  const loteBoton = evento.target.closest('#cuentasLoteBar [data-lote]');
  if (loteBoton) {
    manejarAccionLote(loteBoton.getAttribute('data-lote'), loteBoton);
    return;
  }

  const boton = evento.target.closest('#cuentasLista [data-accion]');
  if (!boton || boton.disabled) return;
  const fila = boton.closest('.cuenta-fila');
  const cuenta = cuentas.find((c) => c.id === fila?.dataset.id);
  if (!cuenta) return;

  const accion = boton.getAttribute('data-accion');
  if (accion === 'estado') cambiarEstado(cuenta);
  else if (accion === 'clave') reiniciarClave(cuenta);
  else if (accion === 'sedes') abrirSedes(cuenta);
  else if (accion === 'eliminar') eliminarCuenta(cuenta, boton);
}

function alCambiar(evento) {
  const check = evento.target.closest('#cuentasLista input[data-seleccionar]');
  if (check) {
    const id = check.getAttribute('data-seleccionar') || '';
    const cuenta = cuentas.find((c) => c.id === id);
    if (!cuenta || !puedeEliminar(cuenta)) {
      check.checked = false;
      return;
    }
    if (check.checked) seleccionadas.add(id);
    else seleccionadas.delete(id);
    renderLoteBar();
    return;
  }

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

    // Los modales viven dentro de #pdiViewContent, cuya opacidad la controla
    // el estado de carga. Mientras dure ese estado (o si se reactiva), los
    // modales quedan invisibles aunque tengan .open. Se sacan al <body> para
    // que no hereden esa opacidad.
    document.querySelectorAll('.cuentas-modal').forEach((modal) => {
      if (modal.parentElement !== document.body) document.body.appendChild(modal);
    });

    porId('btnNuevaCuenta')?.addEventListener('click', () => {
      reiniciarFormulario();
      abrirModal('cuentasModal');
    });

    porId('formNuevaCuenta')?.addEventListener('submit', crearCuenta);

    porId('ctaNombre')?.addEventListener('input', (evento) => {
      porId('campoNombre')?.classList.remove('is-invalid');
      limpiarErrorCampo('ctaNombre', 'ctaNombreError');
      if (usuarioTocado) return;
      const campo = porId('ctaUsuario');
      if (campo) campo.value = usuarioSugerido(evento.target.value);
      porId('campoUsuario')?.classList.remove('is-invalid');
    });

    porId('ctaUsuario')?.addEventListener('input', () => {
      usuarioTocado = true;
      porId('campoUsuario')?.classList.remove('is-invalid');
      limpiarErrorCampo('ctaUsuario', 'ctaUsuarioError');
    });

    porId('ctaSedes')?.addEventListener('change', actualizarResumenSedes);

    porId('btnMarcarTodasSedes')?.addEventListener('click', () => {
      porId('ctaSedes')?.querySelectorAll('input[type="checkbox"]').forEach((casilla) => {
        casilla.checked = true;
      });
      actualizarResumenSedes();
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

  // La copia en memoria sobrevive a la navegación interna. Al volver a la
  // sección se pinta en el acto, sin el "Cargando cuentas…" de cada visita;
  // la red solo confirma y actualiza. Tras una recarga, la copia de sesión
  // hace el mismo trabajo antes de que responda /api/cuenta/admin.
  if (!cuentas.length) {
    const cache = leerCache("cuentas", { ttlMs: 10 * 60 * 1000 });
    if (Array.isArray(cache) && cache.length) cuentas = cache;
  }
  if (cuentas.length) render();
  if (sedes.length) {
    pintarSedes('ctaSedes', []);
    actualizarResumenSedes();
  }

  try {
    await Promise.all([cargarSedes(), cargar()]);
  } catch (err) {
    // Con datos en pantalla, un fallo de red no borra la lista: se avisa y se
    // conserva la última copia.
    if (cuentas.length) {
      aviso('No se pudieron actualizar las cuentas', 'Se muestra la última copia cargada.', 'warning');
      return;
    }
    lista.innerHTML = `<div class="cuentas-vacio">
      <strong>No se pudieron cargar las cuentas</strong>
      <p>${escapar(err?.message || 'Revisa la conexión y recarga la página.')}</p>
      <button type="button" class="cuentas-btn" id="btnReintentarCuentas">Reintentar</button>
    </div>`;
    porId('btnReintentarCuentas')?.addEventListener('click', () => {
      lista.innerHTML = `<div class="cuentas-vacio"><strong>Cargando cuentas…</strong></div>`;
      iniciar();
    });
  }
}

export const CuentasView = { iniciar, cargar };
