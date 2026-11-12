// ===========================================================================
//  VISTA: CUENTAS DEL SISTEMA Y PERMISOS
// ===========================================================================
//  Administración de cuentas del equipo (solo rol `admin`).
//  Cada operación se valida localmente según reglas de negocio / Ley N.° 29733
//  y se confirma en `/api/cuenta/admin`.
// ===========================================================================
import { iconHtml } from '../../data/iconos.js';
import { AnimationEngine } from '../utils/AnimationEngine.js';
import { escapar } from '../utils/HtmlHelper.js';
import { iniciarSheets } from '../utils/SheetController.js';
import { clasificarCuentaBasura } from '../utils/cuentasBasura.js';
import {
  esRolAlcanceGlobal,
  validarFormularioCrearCuenta,
  validarPermisosCuenta,
} from '../utils/cuentasValidacion.js';
import { fetchSedes } from '../core/db.js';
import { guardarCache, leerCache } from '../core/snapshot.js';
import { confirmar } from '../ui/confirmacion.js';

const ROLES = {
  facilitadora: 'Facilitadora',
  promotora: 'Promotora',
  social: 'Trabajo social',
  coord: 'Coordinación',
  admin: 'Administración',
};

const PICKER_CREATE = {
  rolId: 'ctaRol',
  gridId: 'ctaSedes',
  globalId: 'ctaSedesGlobal',
  toggleBtnId: 'btnCtaMarcarTodas',
  resumenId: 'ctaSedesResumen',
  hintId: 'ctaSedesHint',
  errorId: 'ctaSedesError',
  campoSelector: '[data-campo="sedes"]',
  hintBase: 'Ley N.° 29733: asigna solo las sedes necesarias o marca acceso global de forma explícita.',
};

const PICKER_PERMISOS = {
  rolId: 'permRol',
  gridId: 'permSedesLista',
  globalId: 'permSedesGlobal',
  toggleBtnId: 'btnPermMarcarTodas',
  resumenId: 'permSedesResumen',
  hintId: 'permSedesHint',
  errorId: 'permSedesError',
  campoSelector: '[data-campo="permSedes"]',
  hintBase: 'Ley N.° 29733: limita el alcance a las sedes que atiende esta persona, salvo autorización global.',
};

const SELECTOR_ENFOCABLES = [
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled]):not(.pdi-select-native)',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

let cuentas = [];
let sedes = [];
let actualId = '';
let filtro = { texto: '', rol: '', estado: '' };
let documentoEnlazado = false;
let cuerpoEnlazado = null;
let usuarioTocado = false;
let cuentaPermisosId = '';
let focoAntesDeModal = null;
let focoModalRespaldoId = '';
let copiarClaveTemporal = '';
let claveCopiada = false;
let confirmandoCierreClave = false;
let cargandoSedes = false;
let menuCuentaId = '';
let menuOrigenTrigger = null;

const seleccionadas = new Set();

function porId(id) {
  return document.getElementById(id);
}

function aviso(titulo, mensaje, tipo = 'success') {
  try {
    if (window.PDI?.ToastView?.show) window.PDI.ToastView.show(titulo, mensaje, tipo);
    else window.showToast?.(titulo, mensaje, tipo);
  } catch {
    // El aviso es complementario al resultado en servidor.
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

function normalizarListaSedes(lista) {
  return [...new Set((Array.isArray(lista) ? lista : []).map((s) => String(s || '').trim()).filter(Boolean))].sort();
}

function arreglosIguales(a, b) {
  if (a.length !== b.length) return false;
  return a.every((valor, idx) => valor === b[idx]);
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

// --- Errores y campos ------------------------------------------------------

function marcarErrorCampo(campoId, errorId, mensaje) {
  const campo = porId(campoId);
  const errorEl = porId(errorId);
  const contenedor = campo?.closest('.cuentas-field');
  if (campo) campo.setAttribute('aria-invalid', 'true');
  if (contenedor) contenedor.classList.add('is-invalid');
  if (errorEl) {
    errorEl.textContent = mensaje || '';
    errorEl.hidden = !mensaje;
  }
}

function limpiarErrorCampo(campoId, errorId) {
  const campo = porId(campoId);
  const errorEl = porId(errorId);
  const contenedor = campo?.closest('.cuentas-field');
  if (campo) campo.removeAttribute('aria-invalid');
  if (contenedor) contenedor.classList.remove('is-invalid');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

function mostrarErrorBloque(picker, mensaje) {
  const errorEl = porId(picker.errorId);
  const contenedor = errorEl?.closest('.cuentas-field') || document.querySelector(picker.campoSelector);
  if (contenedor) contenedor.classList.toggle('is-invalid', Boolean(mensaje));
  if (errorEl) {
    errorEl.textContent = mensaje || '';
    errorEl.hidden = !mensaje;
  }
}

function mostrarAlertaGeneral(errorId, mensaje) {
  const el = porId(errorId);
  if (!el) return;
  el.textContent = mensaje || '';
  el.hidden = !mensaje;
}

// --- Modales y foco --------------------------------------------------------

function setEstadoModalAbierto(modal, abierto) {
  if (!modal) return;
  if (abierto) {
    modal.removeAttribute('inert');
    modal.removeAttribute('aria-hidden');
    modal.classList.add('open');
  } else {
    modal.classList.remove('open');
    modal.setAttribute('inert', '');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function enfocarPrimerElemento(contenedor) {
  if (!contenedor) return;
  const candidato = contenedor.querySelector('[data-autofocus]')
    || Array.from(contenedor.querySelectorAll(SELECTOR_ENFOCABLES)).find((el) => {
      if (el.classList.contains('btn-close-modal')) return false;
      return el.getClientRects().length > 0;
    })
    || contenedor.querySelector('.btn-close-modal');
  if (!candidato) return;
  try {
    candidato.focus({ preventScroll: true });
  } catch {
    // El usuario entra con teclado si focus no aplica.
  }
}

function abrirModal(id, origen = null, respaldoCuentaId = '') {
  const modal = porId(id);
  if (!modal) return;
  cerrarMenuFila({ devolverFoco: false });
  focoAntesDeModal = origen instanceof HTMLElement
    ? origen
    : (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  focoModalRespaldoId = respaldoCuentaId || '';
  setEstadoModalAbierto(modal, true);
  requestAnimationFrame(() => enfocarPrimerElemento(modal.querySelector('.modal-box') || modal));
}

function cerrarModal(id) {
  const modal = porId(id);
  if (!modal) return;
  setEstadoModalAbierto(modal, false);

  let destino = focoAntesDeModal && document.contains(focoAntesDeModal)
    ? focoAntesDeModal
    : null;
  if (!destino && focoModalRespaldoId) {
    destino = document.querySelector(
      `.cuenta-fila[data-id="${CSS.escape(focoModalRespaldoId)}"] .btn-row-permisos`,
    );
  }
  if (!destino) {
    destino = porId('btnNuevaCuenta') || porId('cuentasBuscar');
  }
  focoAntesDeModal = null;
  focoModalRespaldoId = '';

  if (destino instanceof HTMLElement) {
    try {
      destino.focus({ preventScroll: true });
    } catch {
      // Sin elemento enfocable disponible.
    }
  }
}

async function solicitarCierreModal(id, disparador = null) {
  if (!id) return;
  if (id === 'cuentasClaveModal' && !claveCopiada) {
    if (confirmandoCierreClave) return;
    confirmandoCierreClave = true;
    try {
      const cerrarIgual = await confirmar({
        titulo: '¿Cerrar sin copiar la contraseña?',
        mensaje: 'Esta contraseña temporal no se volverá a mostrar. Si no la copiaste, deberás reiniciarla más adelante.',
        confirmar: 'Cerrar de todas formas',
        cancelar: 'Seguir viendo la clave',
        peligro: true,
        origen: disparador || porId('btnCopiarClave'),
      });
      if (!cerrarIgual) {
        porId('btnCopiarClave')?.focus({ preventScroll: true });
        return;
      }
    } finally {
      confirmandoCierreClave = false;
    }
  }
  cerrarModal(id);
}

// --- Reglas de negocio y filtros ------------------------------------------

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
    const nombresSedes = (Array.isArray(cuenta.sedes) ? cuenta.sedes : []).map(nombreSede).join(' ');
    const heno = `${cuenta.nombre} ${cuenta.usuario} ${cuenta.correo || ''} ${nombresSedes}`.toLowerCase();
    if (!heno.includes(texto)) return false;
  }
  if (filtro.rol && cuenta.rol !== filtro.rol) return false;
  if (filtro.estado === 'activas' && !cuenta.activo) return false;
  if (filtro.estado === 'inactivas' && cuenta.activo) return false;
  if (filtro.estado === 'sospechosas' && !clasificarCuentaBasura(cuenta)) return false;
  return true;
}

// --- Picker unificado de sedes ---------------------------------------------

function pintarSedesEnGrid(gridId, seleccionadasIds = []) {
  const caja = porId(gridId);
  if (!caja) return;

  if (!sedes.length) {
    const etiqueta = cargandoSedes ? 'Cargando sedes...' : 'No se pudieron cargar las sedes.';
    const botonReintento = cargandoSedes
      ? ''
      : '<button type="button" class="btn-action" data-accion="reintentar-sedes">Reintentar</button>';
    caja.innerHTML = `<div class="cuentas-sedes-estado"><span>${etiqueta}</span>${botonReintento}</div>`;
    return;
  }

  const marcadas = new Set(normalizarListaSedes(seleccionadasIds));
  caja.innerHTML = sedes
    .map(
      (sede) => `
      <label class="cuentas-sede-item">
        <input type="checkbox" value="${escapar(sede._rawId)}"${marcadas.has(sede._rawId) ? ' checked' : ''} />
        <span>${escapar(sede.nombre)}</span>
      </label>`,
    )
    .join('');
}

function leerSeleccionSedes(picker) {
  const rol = porId(picker.rolId)?.value || 'facilitadora';
  const caja = porId(picker.gridId);
  const globalEl = porId(picker.globalId);
  const sedesSeleccionadas = Array.from(
    caja?.querySelectorAll('input[type="checkbox"]:checked') || [],
  ).map((el) => el.value);
  return {
    rol,
    sedesSeleccionadas,
    accesoGlobal: Boolean(globalEl?.checked),
  };
}

function sincronizarPickerSedes(picker) {
  const caja = porId(picker.gridId);
  const globalEl = porId(picker.globalId);
  const btnToggle = porId(picker.toggleBtnId);
  const resumenEl = porId(picker.resumenId);
  const hintEl = porId(picker.hintId);
  if (!caja) return;

  const rol = porId(picker.rolId)?.value || 'facilitadora';
  const rolGlobal = esRolAlcanceGlobal(rol);
  const casillas = Array.from(caja.querySelectorAll('input[type="checkbox"]'));

  if (globalEl) {
    if (rolGlobal) {
      globalEl.checked = true;
      globalEl.disabled = true;
    } else {
      globalEl.disabled = false;
    }
  }

  const accesoGlobal = rolGlobal || Boolean(globalEl?.checked);
  caja.classList.toggle('is-locked', accesoGlobal);
  for (const casilla of casillas) {
    casilla.disabled = accesoGlobal;
  }

  if (btnToggle) {
    const todasMarcadas = casillas.length > 0 && casillas.every((c) => c.checked);
    btnToggle.disabled = accesoGlobal || casillas.length === 0;
    btnToggle.textContent = todasMarcadas ? 'Desmarcar todas' : 'Marcar todas';
  }

  const marcadasCount = casillas.filter((c) => c.checked).length;

  if (resumenEl) {
    if (rolGlobal) {
      resumenEl.textContent = 'Acceso global por rol';
    } else if (accesoGlobal) {
      resumenEl.textContent = 'Todas las sedes (global)';
    } else if (!sedes.length) {
      resumenEl.textContent = 'Sin sedes disponibles';
    } else {
      resumenEl.textContent = `${marcadasCount} de ${casillas.length} sedes`;
    }
  }

  if (hintEl) {
    if (rolGlobal) {
      hintEl.textContent = 'Administración y Trabajo social tienen acceso global automático a todas las sedes.';
    } else if (accesoGlobal) {
      hintEl.textContent = 'Autorización global activa (incluye sedes futuras). Desmárcala si quieres limitar por sede.';
    } else {
      hintEl.textContent = picker.hintBase;
    }
  }

  if (rolGlobal || accesoGlobal || marcadasCount > 0) {
    mostrarErrorBloque(picker, '');
  }
}

function alternarTodasSedes(picker) {
  const caja = porId(picker.gridId);
  if (!caja) return;
  const casillas = Array.from(caja.querySelectorAll('input[type="checkbox"]:not(:disabled)'));
  if (!casillas.length) return;
  const marcar = !casillas.every((c) => c.checked);
  for (const casilla of casillas) casilla.checked = marcar;
  sincronizarPickerSedes(picker);
}

async function cargarSedes({ forzar = false } = {}) {
  if (sedes.length && !forzar) {
    pintarSedesEnGrid('ctaSedes', []);
    sincronizarPickerSedes(PICKER_CREATE);
    fetchSedes()
      .then((lista) => {
        const nuevas = Array.isArray(lista) ? lista : [];
        if (!nuevas.length) return;
        sedes = nuevas;
        const marcadas = leerSeleccionSedes(PICKER_CREATE).sedesSeleccionadas;
        pintarSedesEnGrid('ctaSedes', marcadas);
        sincronizarPickerSedes(PICKER_CREATE);
      })
      .catch(() => { /* conserva caché en memoria */ });
    return;
  }

  cargandoSedes = true;
  pintarSedesEnGrid('ctaSedes', leerSeleccionSedes(PICKER_CREATE).sedesSeleccionadas);
  if (porId('cuentasPermisosModal')?.classList.contains('open')) {
    pintarSedesEnGrid('permSedesLista', leerSeleccionSedes(PICKER_PERMISOS).sedesSeleccionadas);
  }

  try {
    const lista = await fetchSedes();
    sedes = Array.isArray(lista) ? lista : [];
  } catch {
    sedes = [];
  } finally {
    cargandoSedes = false;
  }

  pintarSedesEnGrid('ctaSedes', leerSeleccionSedes(PICKER_CREATE).sedesSeleccionadas);
  sincronizarPickerSedes(PICKER_CREATE);
  if (porId('cuentasPermisosModal')?.classList.contains('open')) {
    const cuenta = cuentas.find((c) => c.id === cuentaPermisosId);
    const marcadas = cuenta ? cuenta.sedes : leerSeleccionSedes(PICKER_PERMISOS).sedesSeleccionadas;
    pintarSedesEnGrid('permSedesLista', marcadas);
    sincronizarPickerSedes(PICKER_PERMISOS);
  }
}

// --- Render de listado, resumen y lote -------------------------------------

function sedesColumnaHtml(cuenta) {
  if (esRolAlcanceGlobal(cuenta.rol)) {
    return '<span class="chip cuenta-sede-chip cuenta-sede-chip--global">Todas las sedes</span>';
  }
  const sedesCuenta = normalizarListaSedes(cuenta.sedes);
  if (!sedesCuenta.length) {
    return '<span class="chip cuenta-sede-chip cuenta-sede-chip--global">Todas las sedes (global)</span>';
  }
  const visibles = sedesCuenta.slice(0, 2);
  const nombres = sedesCuenta.map(nombreSede);
  const chips = visibles.map(
    (id) => `<span class="chip cuenta-sede-chip">${escapar(nombreSede(id))}</span>`,
  );
  if (sedesCuenta.length > 2) {
    chips.push(
      `<span class="chip cuenta-sede-chip cuenta-sede-chip--extra" title="${escapar(nombres.join(', '))}">+${sedesCuenta.length - 2} más</span>`,
    );
  }
  return chips.join('');
}

function filaHtml(cuenta) {
  const esYo = Boolean(actualId && cuenta.id === actualId);
  const eliminable = puedeEliminar(cuenta);
  const marcada = seleccionadas.has(cuenta.id);
  const enModoLote = filtro.estado === 'sospechosas' || seleccionadas.size > 0;
  const det = enModoLote ? clasificarCuentaBasura(cuenta) : null;

  const clases = ['cuenta-fila'];
  if (!cuenta.activo) clases.push('is-desactivada');
  if (marcada) clases.push('is-seleccionada');

  const contacto = cuenta.correo ? ` · ${escapar(cuenta.correo)}` : '';
  const estadoTexto = cuenta.activo ? 'Activa' : 'Desactivada';
  const estadoMarcaClase = cuenta.activo ? 'status-mark--ok' : 'status-mark--idle';
  const estadoClase = cuenta.activo
    ? 'cuenta-estado-mark--activa'
    : 'cuenta-estado-mark--inactiva';

  return `
    <div class="${clases.join(' ')}" role="listitem" data-id="${escapar(cuenta.id)}">
      <div class="cuenta-ident">
        ${
          enModoLote
            ? `<label class="cuenta-check" aria-label="Seleccionar a ${escapar(cuenta.nombre)}">
                <input type="checkbox" data-seleccionar="${escapar(cuenta.id)}"${marcada ? ' checked' : ''}${eliminable ? '' : ' disabled'} />
              </label>`
            : ''
        }
        <span class="cuenta-avatar" aria-hidden="true">${escapar(inicialesDe(cuenta.nombre))}</span>
        <div class="cuenta-ident-texto">
          <div class="cuenta-nombre-linea">
            <span class="cuenta-nombre">${escapar(cuenta.nombre)}</span>
            ${esYo ? '<span class="chip cuenta-yo-chip">Tú</span>' : ''}
          </div>
          <span class="cuenta-sub">@${escapar(cuenta.usuario)}${contacto}</span>
          ${det ? `<span class="cuenta-motivo-chip" title="${escapar(det.motivo)}">${escapar(det.etiqueta)}: ${escapar(det.motivo)}</span>` : ''}
        </div>
      </div>

      <div class="cuenta-rol-col">
        <span class="cuenta-celda-label">Rol</span>
        <span class="chip cuenta-rol-chip">${escapar(ROLES[cuenta.rol] || cuenta.rol)}</span>
      </div>

      <div class="cuenta-sedes-col">
        <span class="cuenta-celda-label">Sedes asignadas</span>
        ${sedesColumnaHtml(cuenta)}
      </div>

      <div class="cuenta-acciones-col">
        <span class="status-mark ${estadoMarcaClase} ${estadoClase}"><span class="status-mark-dot" aria-hidden="true"></span>${estadoTexto}</span>
        <div class="cuenta-acciones-grupo">
          <button
            type="button"
            class="btn-action btn-row-permisos"
            data-accion="permisos"
          >
            Editar permisos
          </button>
          <button
            type="button"
            class="btn-action btn-row-menu"
            data-accion="menu-fila"
            aria-haspopup="menu"
            aria-expanded="false"
            aria-label="Más acciones para ${escapar(cuenta.nombre)}"
          >
            ${iconHtml('accion.mas', { size: 16 })}
          </button>
        </div>
      </div>
    </div>`;
}

function sincronizarChecks() {
  const lista = porId('cuentasLista');
  if (!lista) return;
  lista.querySelectorAll('input[data-seleccionar]').forEach((input) => {
    const id = input.getAttribute('data-seleccionar') || '';
    input.checked = !input.disabled && seleccionadas.has(id);
    input.closest('.cuenta-fila')?.classList.toggle('is-seleccionada', input.checked);
  });
}

function renderLoteBar() {
  const bar = porId('cuentasLoteBar');
  const texto = porId('cuentasLoteTexto');
  const btnMarcarPruebas = porId('btnLoteMarcarPruebas');
  const btnLimpiar = porId('btnLoteLimpiar');
  const btnSalirRevision = porId('btnLoteSalirRevision');
  const btnEliminar = porId('btnLoteEliminar');
  const btnEliminarTexto = porId('btnLoteEliminarTexto');
  if (!bar || !texto) return;

  const porIdCuenta = new Map(cuentas.map((c) => [c.id, c]));
  for (const id of [...seleccionadas]) {
    const cuenta = porIdCuenta.get(id);
    if (!cuenta || !puedeEliminar(cuenta)) seleccionadas.delete(id);
  }

  const detectadas = cuentasDetectadas();
  const enRevision = filtro.estado === 'sospechosas';
  const haySeleccion = seleccionadas.size > 0;

  if (!haySeleccion && !enRevision) {
    bar.hidden = true;
    return;
  }

  bar.hidden = false;

  if (haySeleccion) {
    const sufijo = seleccionadas.size === 1 ? 'cuenta seleccionada' : 'cuentas seleccionadas';
    texto.textContent = `${seleccionadas.size} ${sufijo} para eliminar`;
  } else {
    texto.textContent = detectadas.length
      ? `${detectadas.length} cuenta(s) en revisión de prueba`
      : 'No hay cuentas de prueba detectadas';
  }

  if (btnMarcarPruebas) {
    const faltan = detectadas.some((c) => !seleccionadas.has(c.id));
    btnMarcarPruebas.hidden = !enRevision || !detectadas.length || !faltan;
    btnMarcarPruebas.textContent = `Seleccionar detectadas (${detectadas.length})`;
  }
  if (btnLimpiar) btnLimpiar.hidden = !haySeleccion;
  if (btnSalirRevision) btnSalirRevision.hidden = !enRevision;
  if (btnEliminar && btnEliminarTexto) {
    btnEliminar.hidden = !haySeleccion;
    btnEliminarTexto.textContent = `Eliminar seleccionadas (${seleccionadas.size})`;
  }
}

function renderResumen() {
  const resumen = porId('cuentasResumen');
  if (!resumen) return;
  if (!cuentas.length) {
    resumen.innerHTML = '';
    return;
  }

  const activas = cuentas.filter((c) => c.activo).length;
  const desactivadas = cuentas.length - activas;
  const detectadas = cuentasDetectadas().length;
  const enRevision = filtro.estado === 'sospechosas';

  let accionPruebas = '';
  if (enRevision) {
    accionPruebas = `
      <button type="button" class="cuentas-resumen-link" id="btnRevisarPruebas">
        Salir de revisión
      </button>`;
  } else if (detectadas > 0) {
    accionPruebas = `
      <button type="button" class="cuentas-resumen-link" id="btnRevisarPruebas">
        ${iconHtml('estado.alerta', { size: 13 })}
        <span>Revisar ${detectadas} ${detectadas === 1 ? 'cuenta de prueba' : 'cuentas de prueba'}</span>
      </button>`;
  }

  resumen.innerHTML = `
    <span><strong>${cuentas.length}</strong> ${cuentas.length === 1 ? 'cuenta' : 'cuentas'}</span>
    <span><strong>${activas}</strong> activas</span>
    <span><strong>${desactivadas}</strong> desactivadas</span>
    ${accionPruebas}`;
}

function render() {
  const lista = porId('cuentasLista');
  const head = porId('cuentasListaHead');
  const vacio = porId('cuentasVacio');
  const wrap = porId('cuentasListaWrap');
  if (!lista) return;

  cerrarMenuFila({ devolverFoco: false });

  const visibles = cuentas.filter(coincide);
  renderResumen();
  renderLoteBar();

  if (!visibles.length) {
    lista.innerHTML = '';
    if (head) head.hidden = true;
    if (wrap) wrap.setAttribute('data-vacio', 'true');
    if (vacio) {
      const hayFiltro = Boolean(filtro.texto.trim() || filtro.rol || filtro.estado);
      vacio.innerHTML = cuentas.length
        ? `<p class="cuentas-vacio-titulo">Ninguna cuenta coincide con los filtros</p>
           <p class="cuentas-vacio-sub">Ajusta la búsqueda o limpia el filtro actual para ver todo el equipo.</p>
           ${hayFiltro ? '<button type="button" class="btn-action" id="btnLimpiarFiltros">Limpiar filtros</button>' : ''}`
        : `<p class="cuentas-vacio-titulo">Todavía no hay cuentas registradas</p>
           <p class="cuentas-vacio-sub">Crea la primera cuenta con el botón «Nueva cuenta».</p>`;
      vacio.hidden = false;
    }
    return;
  }

  if (vacio) {
    vacio.hidden = true;
    vacio.innerHTML = '';
  }
  if (wrap) wrap.removeAttribute('data-vacio');
  if (head) head.hidden = false;

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

// --- Menú contextual accesible por fila ------------------------------------

function obtenerMenuFlotante() {
  let menu = porId('cuentaMenuFlotante');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'cuentaMenuFlotante';
    menu.className = 'cuenta-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    document.body.appendChild(menu);
  }
  return menu;
}

function posicionarMenuFlotante(menu, trigger) {
  menu.style.top = '0px';
  menu.style.left = '0px';
  const trigRect = trigger.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();

  const espacioAbajo = window.innerHeight - trigRect.bottom;
  const abrirArriba = espacioAbajo < menuRect.height + 16 && trigRect.top > menuRect.height + 16;
  const top = abrirArriba
    ? Math.max(12, trigRect.top - menuRect.height - 6)
    : Math.min(window.innerHeight - menuRect.height - 12, trigRect.bottom + 6);
  const left = Math.max(
    12,
    Math.min(trigRect.right - menuRect.width, window.innerWidth - menuRect.width - 12),
  );

  menu.style.top = `${Math.round(top)}px`;
  menu.style.left = `${Math.round(left)}px`;
}

function cerrarMenuFila({ devolverFoco = false } = {}) {
  const menu = porId('cuentaMenuFlotante');
  if (menu) menu.hidden = true;
  if (menuOrigenTrigger instanceof HTMLElement) {
    menuOrigenTrigger.setAttribute('aria-expanded', 'false');
    if (devolverFoco && document.contains(menuOrigenTrigger)) {
      menuOrigenTrigger.focus({ preventScroll: true });
    }
  }
  menuCuentaId = '';
  menuOrigenTrigger = null;
}

function abrirMenuFila(cuenta, trigger) {
  if (!cuenta || !trigger) return;
  if (menuOrigenTrigger === trigger && !porId('cuentaMenuFlotante')?.hidden) {
    cerrarMenuFila({ devolverFoco: true });
    return;
  }
  cerrarMenuFila({ devolverFoco: false });

  const esYo = Boolean(actualId && cuenta.id === actualId);
  const unSoloAdminActivo = cuenta.rol === 'admin' && cuenta.activo && adminsActivosCount() <= 1;
  const bloqueoEstado = esYo
    ? 'No puedes desactivar tu propia cuenta.'
    : unSoloAdminActivo
      ? 'Debe quedar al menos una administración activa.'
      : '';
  const bloqueoEliminar = motivoNoEliminable(cuenta);

  const menu = obtenerMenuFlotante();
  menu.setAttribute('aria-label', `Acciones para ${cuenta.nombre}`);
  menu.innerHTML = `
    <button type="button" class="cuenta-menu-item" role="menuitem" data-menu-accion="clave">
      ${iconHtml('seguridad.candado', { size: 15 })}
      <span>Reiniciar contraseña</span>
    </button>
    <button
      type="button"
      class="cuenta-menu-item"
      role="menuitem"
      data-menu-accion="estado"
      ${bloqueoEstado ? `disabled title="${escapar(bloqueoEstado)}"` : ''}
    >
      ${iconHtml(cuenta.activo ? 'accion.desactivar' : 'accion.reactivar', { size: 15 })}
      <span>${cuenta.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}</span>
    </button>
    <div class="cuenta-menu-sep" role="separator"></div>
    <button
      type="button"
      class="cuenta-menu-item cuenta-menu-item--danger"
      role="menuitem"
      data-menu-accion="eliminar"
      ${bloqueoEliminar ? `disabled title="${escapar(bloqueoEliminar)}"` : ''}
    >
      ${iconHtml('accion.eliminar', { size: 15 })}
      <span>Eliminar cuenta</span>
    </button>`;

  menuCuentaId = cuenta.id;
  menuOrigenTrigger = trigger;
  trigger.setAttribute('aria-expanded', 'true');
  menu.hidden = false;
  posicionarMenuFlotante(menu, trigger);

  const primerItem = menu.querySelector('.cuenta-menu-item:not([disabled])');
  primerItem?.focus({ preventScroll: true });
}

function manejarTecladoMenuFila(evento, menu) {
  if (!menu || menu.hidden) return false;
  if (evento.key === 'Escape' || evento.key === 'Tab') {
    evento.preventDefault();
    evento.stopPropagation();
    cerrarMenuFila({ devolverFoco: true });
    return true;
  }

  const items = Array.from(menu.querySelectorAll('.cuenta-menu-item:not([disabled])'));
  if (!items.length) return false;
  const idx = items.indexOf(document.activeElement);

  if (evento.key === 'ArrowDown') {
    evento.preventDefault();
    items[(idx + 1) % items.length]?.focus();
    return true;
  }
  if (evento.key === 'ArrowUp') {
    evento.preventDefault();
    items[(idx - 1 + items.length) % items.length]?.focus();
    return true;
  }
  if (evento.key === 'Home') {
    evento.preventDefault();
    items[0]?.focus();
    return true;
  }
  if (evento.key === 'End') {
    evento.preventDefault();
    items[items.length - 1]?.focus();
    return true;
  }
  return false;
}

// --- Clave temporal y resguardo de copia ----------------------------------

function actualizarEstadoCopia(copiada, mensaje = '') {
  claveCopiada = Boolean(copiada);
  const estado = porId('claveCopiaEstado');
  const textoBoton = porId('btnCopiarClaveTexto');
  if (estado) {
    estado.classList.toggle('is-copied', claveCopiada);
    estado.textContent = mensaje || (claveCopiada
      ? 'Copiada al portapapeles. Compártela por un canal privado.'
      : 'Pendiente de copiar: no se volverá a mostrar después de cerrar.');
  }
  if (textoBoton) {
    textoBoton.textContent = claveCopiada ? 'Copiada' : 'Copiar';
  }
}

function mostrarClave(titulo, usuarioEtiqueta, clave, origen = null) {
  copiarClaveTemporal = String(clave || '');
  const elTitulo = porId('claveModalTitulo');
  const elUsuario = porId('claveModalUsuario');
  const elValor = porId('claveModalValor');
  if (elTitulo) elTitulo.textContent = titulo;
  if (elUsuario) elUsuario.textContent = usuarioEtiqueta;
  if (elValor) elValor.textContent = copiarClaveTemporal;
  actualizarEstadoCopia(false);
  abrirModal('cuentasClaveModal', origen);
}

async function copiarClaveAlPortapapeles() {
  if (!copiarClaveTemporal) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(copiarClaveTemporal);
      actualizarEstadoCopia(true);
      aviso('Copiada', 'La contraseña está en el portapapeles. Compártela por un canal privado.', 'info');
      return;
    }
  } catch {
    // Intenta el respaldo con área de selección temporal.
  }

  const area = document.createElement('textarea');
  area.value = copiarClaveTemporal;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.select();
  let exito = false;
  try {
    exito = Boolean(document.execCommand?.('copy'));
  } catch {
    exito = false;
  } finally {
    area.remove();
  }

  if (exito) {
    actualizarEstadoCopia(true);
    aviso('Copiada', 'La contraseña está en el portapapeles. Compártela por un canal privado.', 'info');
    return;
  }

  const valorEl = porId('claveModalValor');
  if (valorEl && window.getSelection) {
    const rango = document.createRange();
    rango.selectNodeContents(valorEl);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(rango);
  }
  aviso('Selección lista', 'Presiona Ctrl+C para copiar la contraseña antes de cerrar.', 'warning');
}

// --- Acciones CRUD ---------------------------------------------------------

function reiniciarFormulario() {
  const form = porId('cuentasForm');
  if (form) form.reset();
  usuarioTocado = false;

  const rol = porId('ctaRol');
  if (rol) {
    rol.value = 'facilitadora';
    rol.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const globalEl = porId('ctaSedesGlobal');
  if (globalEl) globalEl.checked = false;

  limpiarErrorCampo('ctaNombre', 'ctaNombreError');
  limpiarErrorCampo('ctaUsuario', 'ctaUsuarioError');
  limpiarErrorCampo('ctaCorreo', 'ctaCorreoError');
  limpiarErrorCampo('ctaTelefono', 'ctaTelefonoError');
  mostrarErrorBloque(PICKER_CREATE, '');
  mostrarAlertaGeneral('ctaError', '');

  pintarSedesEnGrid('ctaSedes', []);
  sincronizarPickerSedes(PICKER_CREATE);
}

function enfocarPrimerErrorCrear(errores) {
  const orden = [
    ['nombre', 'ctaNombre'],
    ['usuario', 'ctaUsuario'],
    ['correo', 'ctaCorreo'],
    ['telefono', 'ctaTelefono'],
  ];
  for (const [clave, campoId] of orden) {
    if (errores[clave]) {
      porId(campoId)?.focus();
      return;
    }
  }
  if (errores.sedes) {
    const primerSede = porId('ctaSedes')?.querySelector('input:not(:disabled)') || porId('ctaSedesGlobal');
    primerSede?.focus();
  }
}

async function crearCuenta(evento) {
  evento.preventDefault();
  const boton = porId('btnCrearCuenta');
  mostrarAlertaGeneral('ctaError', '');

  limpiarErrorCampo('ctaNombre', 'ctaNombreError');
  limpiarErrorCampo('ctaUsuario', 'ctaUsuarioError');
  limpiarErrorCampo('ctaCorreo', 'ctaCorreoError');
  limpiarErrorCampo('ctaTelefono', 'ctaTelefonoError');
  mostrarErrorBloque(PICKER_CREATE, '');

  const seleccionSedes = leerSeleccionSedes(PICKER_CREATE);
  const validacion = validarFormularioCrearCuenta({
    nombre: porId('ctaNombre')?.value,
    usuario: porId('ctaUsuario')?.value,
    rol: seleccionSedes.rol,
    correo: porId('ctaCorreo')?.value,
    telefono: porId('ctaTelefono')?.value,
    sedes: seleccionSedes.sedesSeleccionadas,
    accesoGlobal: seleccionSedes.accesoGlobal,
    sedesDisponiblesCount: sedes.length,
  });

  if (!validacion.ok) {
    if (validacion.errores.nombre) marcarErrorCampo('ctaNombre', 'ctaNombreError', validacion.errores.nombre);
    if (validacion.errores.usuario) marcarErrorCampo('ctaUsuario', 'ctaUsuarioError', validacion.errores.usuario);
    if (validacion.errores.correo) marcarErrorCampo('ctaCorreo', 'ctaCorreoError', validacion.errores.correo);
    if (validacion.errores.telefono) marcarErrorCampo('ctaTelefono', 'ctaTelefonoError', validacion.errores.telefono);
    if (validacion.errores.sedes) mostrarErrorBloque(PICKER_CREATE, validacion.errores.sedes);
    enfocarPrimerErrorCrear(validacion.errores);
    return;
  }

  const original = boton?.textContent || '';
  if (boton) {
    boton.disabled = true;
    boton.textContent = 'Creando…';
  }

  try {
    const { datos: payload } = validacion;
    const { res, datos } = await pedir('/api/cuenta/admin', {
      method: 'POST',
      body: JSON.stringify({ accion: 'crear', ...payload }),
    });

    if (!res.ok || !datos.ok) {
      const msg = datos.error || 'No se pudo crear la cuenta.';
      const lower = msg.toLowerCase();
      if (lower.includes('usuario')) {
        marcarErrorCampo('ctaUsuario', 'ctaUsuarioError', msg);
        porId('ctaUsuario')?.focus();
      } else if (lower.includes('correo')) {
        marcarErrorCampo('ctaCorreo', 'ctaCorreoError', msg);
        porId('ctaCorreo')?.focus();
      } else if (lower.includes('teléfono') || lower.includes('telefono')) {
        marcarErrorCampo('ctaTelefono', 'ctaTelefonoError', msg);
        porId('ctaTelefono')?.focus();
      } else if (lower.includes('nombre')) {
        marcarErrorCampo('ctaNombre', 'ctaNombreError', msg);
        porId('ctaNombre')?.focus();
      } else {
        mostrarAlertaGeneral('ctaError', msg);
      }
      return;
    }

    const creada = datos.cuenta;
    const respaldoId = creada?.id || '';
    cerrarModal('cuentasModal');
    reiniciarFormulario();
    mostrarClave(
      'Cuenta creada',
      `${creada?.nombre || payload.nombre} (@${creada?.usuario || payload.usuario})`,
      datos.claveTemporal,
      porId('btnNuevaCuenta'),
    );
    if (respaldoId) focoModalRespaldoId = respaldoId;
    aviso('Cuenta creada', `${creada?.nombre || payload.nombre} ya puede ingresar.`);
    AnimationEngine.marcarCambio(creada?.id);
    await cargar();
  } catch (err) {
    mostrarAlertaGeneral('ctaError', err?.message || 'No se pudo crear la cuenta.');
  } finally {
    if (boton) {
      boton.disabled = false;
      boton.textContent = original || 'Crear cuenta y generar clave';
    }
  }
}

function actualizarAvisoRolPermisos(cuenta) {
  const avisoRol = porId('permRolAviso');
  const rolSelect = porId('permRol');
  if (!avisoRol || !rolSelect || !cuenta) return;

  const esYo = Boolean(actualId && cuenta.id === actualId);
  const unicoAdmin = cuenta.rol === 'admin' && cuenta.activo && adminsActivosCount() <= 1;

  if (esYo) {
    avisoRol.textContent = 'No puedes cambiar tu propio rol desde esta pantalla.';
    avisoRol.hidden = false;
  } else if (unicoAdmin) {
    avisoRol.textContent = 'Es la única cuenta de administración activa: asigna otro administrador antes de cambiar su rol.';
    avisoRol.hidden = false;
  } else if (rolSelect.value !== cuenta.rol) {
    avisoRol.textContent = 'Cambiar el rol cerrará la sesión activa de esta cuenta para aplicar los nuevos permisos.';
    avisoRol.hidden = false;
  } else {
    avisoRol.hidden = true;
  }
}

function abrirPermisos(cuenta, origen = null) {
  cuentaPermisosId = cuenta.id;
  const sub = porId('permModalSub');
  if (sub) sub.textContent = `Configura el rol y alcance por sede de ${cuenta.nombre} (@${cuenta.usuario}).`;

  mostrarAlertaGeneral('permError', '');
  mostrarErrorBloque(PICKER_PERMISOS, '');

  const rolSelect = porId('permRol');
  const esYo = Boolean(actualId && cuenta.id === actualId);
  const unicoAdmin = cuenta.rol === 'admin' && cuenta.activo && adminsActivosCount() <= 1;
  if (rolSelect) {
    rolSelect.disabled = esYo || unicoAdmin;
    rolSelect.value = cuenta.rol;
    rolSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const sedesCuenta = normalizarListaSedes(cuenta.sedes);
  pintarSedesEnGrid('permSedesLista', sedesCuenta);

  const globalEl = porId('permSedesGlobal');
  if (globalEl) {
    globalEl.checked = !esRolAlcanceGlobal(cuenta.rol) && sedesCuenta.length === 0;
  }

  actualizarAvisoRolPermisos(cuenta);
  sincronizarPickerSedes(PICKER_PERMISOS);
  abrirModal('cuentasPermisosModal', origen, cuenta.id);
}

async function guardarPermisos(evento) {
  evento.preventDefault();
  const cuenta = cuentas.find((c) => c.id === cuentaPermisosId);
  if (!cuenta) return;

  mostrarAlertaGeneral('permError', '');
  mostrarErrorBloque(PICKER_PERMISOS, '');

  const seleccion = leerSeleccionSedes(PICKER_PERMISOS);
  const permisos = validarPermisosCuenta({
    rol: seleccion.rol,
    sedes: seleccion.sedesSeleccionadas,
    accesoGlobal: seleccion.accesoGlobal,
    sedesDisponiblesCount: sedes.length,
  });

  if (!permisos.ok) {
    mostrarErrorBloque(PICKER_PERMISOS, permisos.error || 'Selecciona al menos una sede.');
    const primero = porId('permSedesLista')?.querySelector('input:not(:disabled)') || porId('permSedesGlobal');
    primero?.focus();
    return;
  }

  const sedesActuales = normalizarListaSedes(cuenta.sedes);
  const sedesNuevas = normalizarListaSedes(permisos.sedes);
  const cambioRol = seleccion.rol !== cuenta.rol;
  const cambioSedes = !arreglosIguales(sedesActuales, sedesNuevas);
  const activaAccesoGlobal =
    !esRolAlcanceGlobal(seleccion.rol) &&
    sedesNuevas.length === 0 &&
    (sedesActuales.length > 0 || esRolAlcanceGlobal(cuenta.rol));

  if (!cambioRol && !cambioSedes) {
    cerrarModal('cuentasPermisosModal');
    return;
  }

  const boton = porId('btnGuardarPermisos');
  if (cambioRol || activaAccesoGlobal) {
    const partes = [];
    if (cambioRol) {
      partes.push(
        `El rol de ${cuenta.nombre} pasará de ${ROLES[cuenta.rol] || cuenta.rol} a ${ROLES[seleccion.rol] || seleccion.rol} y se cerrará su sesión actual.`,
      );
    }
    if (activaAccesoGlobal) {
      partes.push(
        'Ley N.° 29733: activar acceso a todas las sedes otorgará visibilidad territorial completa, incluidas futuras sedes.',
      );
    }
    const confirmado = await confirmar({
      titulo: cambioRol ? 'Confirmar cambio de rol' : 'Confirmar acceso territorial global',
      mensaje: partes.join(' '),
      confirmar: cambioRol ? 'Guardar rol y permisos' : 'Confirmar acceso global',
      origen: boton,
    });
    if (!confirmado) return;
  }

  const original = boton?.textContent || '';
  if (boton) {
    boton.disabled = true;
    boton.textContent = 'Guardando…';
  }

  try {
    if (cambioRol) {
      const { res, datos } = await pedir('/api/cuenta/admin', {
        method: 'POST',
        body: JSON.stringify({ accion: 'rol', id: cuenta.id, rol: seleccion.rol }),
      });
      if (!res.ok || !datos.ok) {
        mostrarAlertaGeneral('permError', datos.error || 'No se pudo actualizar el rol.');
        return;
      }
    }

    if (cambioSedes) {
      const { res, datos } = await pedir('/api/cuenta/admin', {
        method: 'POST',
        body: JSON.stringify({ accion: 'sedes', id: cuenta.id, sedes: sedesNuevas }),
      });
      if (!res.ok || !datos.ok) {
        mostrarAlertaGeneral('permError', datos.error || 'No se pudieron actualizar las sedes.');
        return;
      }
    }

    cerrarModal('cuentasPermisosModal');
    aviso(
      'Permisos actualizados',
      cambioRol ? `${cuenta.nombre} deberá volver a ingresar.` : cuenta.nombre,
    );
    AnimationEngine.marcarCambio(cuenta.id);
    await cargar();
  } catch (err) {
    mostrarAlertaGeneral('permError', err?.message || 'No se pudieron guardar los permisos.');
  } finally {
    if (boton) {
      boton.disabled = false;
      boton.textContent = original || 'Guardar cambios';
    }
  }
}

async function cambiarEstado(cuenta, origen = null) {
  const desactivar = cuenta.activo;
  const confirmado = await confirmar({
    titulo: desactivar ? 'Desactivar cuenta' : 'Reactivar cuenta',
    mensaje: desactivar
      ? `${cuenta.nombre} dejará de poder ingresar y sus sesiones abiertas se cerrarán en el acto. Su historial se conserva.`
      : `${cuenta.nombre} podrá volver a ingresar con su contraseña vigente.`,
    confirmar: desactivar ? 'Desactivar cuenta' : 'Reactivar cuenta',
    peligro: desactivar,
    origen,
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

async function reiniciarClave(cuenta, origen = null) {
  const confirmado = await confirmar({
    titulo: 'Reiniciar contraseña',
    mensaje: `Se generará una nueva contraseña temporal para ${cuenta.nombre} y se cerrarán sus sesiones activas. La clave anterior dejará de funcionar.`,
    confirmar: 'Generar contraseña',
    peligro: true,
    origen,
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
    `${cuenta.nombre} (@${cuenta.usuario})`,
    datos.claveTemporal,
    origen,
  );
}

function enfocarFilaCercana(indicePrevio) {
  const filas = Array.from(document.querySelectorAll('#cuentasLista .cuenta-fila'));
  if (!filas.length) {
    porId('cuentasBuscar')?.focus({ preventScroll: true });
    return;
  }
  const objetivo = filas[Math.min(indicePrevio, filas.length - 1)];
  objetivo?.querySelector('.btn-row-permisos')?.focus({ preventScroll: true });
}

async function eliminarCuenta(cuenta, origen = null) {
  const bloqueo = motivoNoEliminable(cuenta);
  if (bloqueo) {
    aviso('No se puede eliminar', bloqueo, 'warning');
    return;
  }

  const visiblesAntes = cuentas.filter(coincide);
  const indicePrevio = Math.max(0, visiblesAntes.findIndex((c) => c.id === cuenta.id));

  const confirmado = await confirmar({
    titulo: 'Eliminar cuenta',
    mensaje: `Se eliminará definitivamente la cuenta de ${cuenta.nombre} (@${cuenta.usuario}). No podrá volver a ingresar y esta acción no se puede deshacer.`,
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
    enfocarFilaCercana(indicePrevio);
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
    enfocarFilaCercana(0);
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

function limpiarTodosLosFiltros() {
  filtro = { texto: '', rol: '', estado: '' };
  const buscar = porId('cuentasBuscar');
  if (buscar) buscar.value = '';
  const rol = porId('cuentasRol');
  if (rol) {
    rol.value = '';
    rol.dispatchEvent(new Event('change', { bubbles: false }));
  }
  const estado = porId('cuentasEstado');
  if (estado) {
    estado.value = '';
    estado.dispatchEvent(new Event('change', { bubbles: false }));
  }
  render();
  buscar?.focus({ preventScroll: true });
}

// --- Delegación de eventos -------------------------------------------------

function alHacerClic(evento) {
  const objetivo = evento.target;
  if (!(objetivo instanceof Element)) return;

  const btnCerrar = objetivo.closest('[data-cerrar]');
  if (btnCerrar) {
    solicitarCierreModal(btnCerrar.getAttribute('data-cerrar'), btnCerrar);
    return;
  }

  if (objetivo.classList.contains('modal-backdrop') && objetivo.hasAttribute('data-cuentas-modal')) {
    solicitarCierreModal(objetivo.id, objetivo);
    return;
  }

  const menuItem = objetivo.closest('#cuentaMenuFlotante [data-menu-accion]');
  if (menuItem && !menuItem.hasAttribute('disabled')) {
    const accion = menuItem.getAttribute('data-menu-accion');
    const cuenta = cuentas.find((c) => c.id === menuCuentaId);
    const filaTrigger = menuOrigenTrigger;
    const respaldo = document.querySelector(
      `.cuenta-fila[data-id="${CSS.escape(menuCuentaId)}"] .btn-row-menu`,
    ) || filaTrigger;
    cerrarMenuFila({ devolverFoco: false });
    if (!cuenta) return;
    if (accion === 'clave') reiniciarClave(cuenta, respaldo);
    else if (accion === 'estado') cambiarEstado(cuenta, respaldo);
    else if (accion === 'eliminar') eliminarCuenta(cuenta, respaldo);
    return;
  }

  if (!objetivo.closest('#cuentaMenuFlotante') && !objetivo.closest('[data-accion="menu-fila"]')) {
    cerrarMenuFila({ devolverFoco: false });
  }

  if (objetivo.closest('[data-accion="reintentar-sedes"]')) {
    cargarSedes({ forzar: true });
    return;
  }

  if (objetivo.closest('#btnRevisarPruebas')) {
    restablecerFiltroEstado(filtro.estado === 'sospechosas' ? '' : 'sospechosas');
    return;
  }

  if (objetivo.closest('#btnLimpiarFiltros')) {
    limpiarTodosLosFiltros();
    return;
  }

  const accionFila = objetivo.closest('#cuentasLista [data-accion]');
  if (accionFila) {
    const fila = accionFila.closest('.cuenta-fila');
    const cuenta = cuentas.find((c) => c.id === fila?.dataset.id);
    if (!cuenta) return;
    const accion = accionFila.getAttribute('data-accion');
    if (accion === 'permisos') abrirPermisos(cuenta, accionFila);
    else if (accion === 'menu-fila') abrirMenuFila(cuenta, accionFila);
  }
}

function alCambiar(evento) {
  const check = evento.target.closest?.('#cuentasLista input[data-seleccionar]');
  if (!check) return;
  const id = check.getAttribute('data-seleccionar') || '';
  const cuenta = cuentas.find((c) => c.id === id);
  if (!cuenta || !puedeEliminar(cuenta)) {
    check.checked = false;
    return;
  }
  if (check.checked) seleccionadas.add(id);
  else seleccionadas.delete(id);
  sincronizarChecks();
  renderLoteBar();
}

function alTeclear(evento) {
  const menu = porId('cuentaMenuFlotante');
  if (menu && !menu.hidden && manejarTecladoMenuFila(evento, menu)) return;

  if (evento.key !== 'Tab') return;
  const abiertos = Array.from(document.querySelectorAll('[data-cuentas-modal].open'));
  const abierto = abiertos[abiertos.length - 1];
  if (!abierto) return;
  const caja = abierto.querySelector('.modal-box');
  if (!caja) return;
  const enfocables = Array.from(caja.querySelectorAll(SELECTOR_ENFOCABLES))
    .filter((el) => el.getClientRects().length > 0);
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

function enlazarCamposCrear() {
  porId('cuentasForm')?.addEventListener('submit', crearCuenta);

  porId('ctaNombre')?.addEventListener('input', (evento) => {
    limpiarErrorCampo('ctaNombre', 'ctaNombreError');
    if (usuarioTocado) return;
    const campo = porId('ctaUsuario');
    if (campo) campo.value = usuarioSugerido(evento.target.value);
    limpiarErrorCampo('ctaUsuario', 'ctaUsuarioError');
  });

  porId('ctaUsuario')?.addEventListener('input', () => {
    usuarioTocado = true;
    limpiarErrorCampo('ctaUsuario', 'ctaUsuarioError');
  });

  porId('ctaCorreo')?.addEventListener('input', () => limpiarErrorCampo('ctaCorreo', 'ctaCorreoError'));
  porId('ctaTelefono')?.addEventListener('input', () => limpiarErrorCampo('ctaTelefono', 'ctaTelefonoError'));

  porId('ctaRol')?.addEventListener('change', () => sincronizarPickerSedes(PICKER_CREATE));
  porId('ctaSedes')?.addEventListener('change', () => sincronizarPickerSedes(PICKER_CREATE));
  porId('ctaSedesGlobal')?.addEventListener('change', () => sincronizarPickerSedes(PICKER_CREATE));
  porId('btnCtaMarcarTodas')?.addEventListener('click', () => alternarTodasSedes(PICKER_CREATE));
}

function enlazarCamposPermisos() {
  porId('permForm')?.addEventListener('submit', guardarPermisos);
  porId('permRol')?.addEventListener('change', () => {
    const cuenta = cuentas.find((c) => c.id === cuentaPermisosId);
    actualizarAvisoRolPermisos(cuenta);
    sincronizarPickerSedes(PICKER_PERMISOS);
  });
  porId('permSedesLista')?.addEventListener('change', () => sincronizarPickerSedes(PICKER_PERMISOS));
  porId('permSedesGlobal')?.addEventListener('change', () => sincronizarPickerSedes(PICKER_PERMISOS));
  porId('btnPermMarcarTodas')?.addEventListener('click', () => alternarTodasSedes(PICKER_PERMISOS));
}

function enlazarFiltrosYLote() {
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

  porId('btnLoteMarcarPruebas')?.addEventListener('click', () => {
    for (const c of cuentasDetectadas()) seleccionadas.add(c.id);
    sincronizarChecks();
    renderLoteBar();
  });

  porId('btnLoteLimpiar')?.addEventListener('click', () => {
    seleccionadas.clear();
    sincronizarChecks();
    renderLoteBar();
  });

  porId('btnLoteSalirRevision')?.addEventListener('click', () => {
    restablecerFiltroEstado('');
  });

  porId('btnLoteEliminar')?.addEventListener('click', (evento) => {
    eliminarSeleccionadas(evento.currentTarget);
  });
}

function enlazar() {
  if (!documentoEnlazado) {
    documentoEnlazado = true;
    document.addEventListener('click', alHacerClic);
    document.addEventListener('change', alCambiar);
    document.addEventListener('keydown', alTeclear);
    window.addEventListener('resize', () => cerrarMenuFila({ devolverFoco: false }));
    window.addEventListener('scroll', () => cerrarMenuFila({ devolverFoco: false }), true);
  }

  if (cuerpoEnlazado === document.body) return;
  cuerpoEnlazado = document.body;

  // Mueve los drawers al <body> para evitar recortes u opacidad del contenedor
  // de carga, y vuelve a enganchar SheetController tras moverlos.
  document.querySelectorAll('[data-cuentas-modal]').forEach((modal) => {
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    setEstadoModalAbierto(modal, false);
  });
  iniciarSheets();

  porId('btnNuevaCuenta')?.addEventListener('click', (evento) => {
    reiniciarFormulario();
    abrirModal('cuentasModal', evento.currentTarget);
  });

  porId('btnCopiarClave')?.addEventListener('click', copiarClaveAlPortapapeles);
  porId('claveModalValor')?.addEventListener('copy', () => {
    actualizarEstadoCopia(true);
  });

  enlazarCamposCrear();
  enlazarCamposPermisos();
  enlazarFiltrosYLote();
}

async function iniciar() {
  enlazar();

  const lista = porId('cuentasLista');
  if (!lista) return;

  if (!cuentas.length) {
    const cache = leerCache('cuentas', { ttlMs: 10 * 60 * 1000 });
    if (Array.isArray(cache) && cache.length) cuentas = cache;
  }
  if (cuentas.length) render();
  if (sedes.length) {
    pintarSedesEnGrid('ctaSedes', []);
    sincronizarPickerSedes(PICKER_CREATE);
  }

  try {
    await Promise.all([cargarSedes(), cargar()]);
  } catch (err) {
    if (cuentas.length) {
      aviso('No se pudieron actualizar las cuentas', 'Se muestra la última copia cargada.', 'warning');
      return;
    }
    const head = porId('cuentasListaHead');
    const vacio = porId('cuentasVacio');
    if (head) head.hidden = true;
    if (vacio) {
      vacio.innerHTML = `
        <p class="cuentas-vacio-titulo">No se pudieron cargar las cuentas</p>
        <p class="cuentas-vacio-sub">${escapar(err?.message || 'Revisa la conexión y vuelve a intentarlo.')}</p>
        <button type="button" class="btn-action" id="btnReintentarCuentas">Reintentar</button>`;
      vacio.hidden = false;
      porId('btnReintentarCuentas')?.addEventListener('click', () => {
        vacio.innerHTML = '<p class="cuentas-vacio-sub">Cargando cuentas…</p>';
        iniciar();
      });
    }
  }
}

export const CuentasView = { iniciar, cargar };
