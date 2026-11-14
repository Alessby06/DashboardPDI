// ===========================================================================
//  VISTA: NUEVA DERIVACIÓN Y ATENCIÓN DEL CASO (ASP)
// ===========================================================================
//  La ficha de derivación se crea desde Social, con un usuario real de la
//  base. La atención posterior vive en evento_caso y no se mezcla con la
//  evaluación socioeconómica. Toda escritura pasa por db.js y se audita.
// ===========================================================================
import { crearDerivacion, crearEventoCaso } from '../core/db.js';
import { ToastView } from './ToastView.js';
import { escapar } from '../utils/HtmlHelper.js';
import { validarTipo } from '../ui/tiposCampo.js';

const ROLES = {
  coord: 'Coordinación',
  facilitadora: 'Facilitadora',
  promotora: 'Promotora',
  social: 'Trabajo Social',
  admin: 'Administración TI',
};

const ETIQUETAS = ['Violencia', 'Abandono', 'Nutricional'];

function porId(id) {
  return document.getElementById(id);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function nombreActivo() {
  try {
    return localStorage.getItem('pdi_usuario_nombre') || 'Equipo PDI';
  } catch {
    return 'Equipo PDI';
  }
}

function cargoActivo() {
  try {
    const rol = localStorage.getItem('pdi_active_role') || 'social';
    return ROLES[rol] || 'Equipo PDI';
  } catch {
    return 'Equipo PDI';
  }
}

function nombreCompleto(b) {
  return `${b?.nombres || ''} ${b?.apellidos || ''}`.trim() || b?.usuario || 'Sin nombre';
}

export const DerivacionView = {
  _seleccionado: null,
  _casoActivo: null,
  _referentes: [],
  _casoAtencion: null,
  _globalBound: false,

  init() {
    const boton = porId('btnNuevaDerivacion');
    if (!boton) return;

    if (boton.dataset.derivBound !== '1') {
      boton.dataset.derivBound = '1';
      boton.addEventListener('click', () => this.abrir());
      porId('btnCerrarNuevaDerivacion')?.addEventListener('click', () => this.cerrar());
      porId('btnCancelarNuevaDerivacion')?.addEventListener('click', () => this.cerrar());
      porId('formNuevaDerivacion')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.guardar();
      });

      const modal = porId('modalNuevaDerivacion');
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) this.cerrar();
      });

      const buscar = porId('derivBuscarUsuario');
      buscar?.addEventListener('input', () => this._buscar(buscar.value));
      buscar?.addEventListener('focus', () => this._buscar(buscar.value));

      porId('derivResultadosUsuarios')?.addEventListener('click', (e) => {
        const opcion = e.target.closest?.('[data-beneficiario-id]');
        if (opcion) this._seleccionar(opcion.getAttribute('data-beneficiario-id'));
      });

      porId('derivUsuarioSeleccionado')?.addEventListener('click', (e) => {
        if (e.target.closest?.('#derivCambiarUsuario')) {
          this._limpiarSeleccion();
          return;
        }
        if (e.target.closest?.('#derivAbrirCaso')) this._abrirCasoExistente();
      });

      porId('derivSoporteTiene')?.addEventListener('change', () => this._toggleSoporte());
      porId('derivReferenteSelect')?.addEventListener('change', () => this._cargarReferente());

      porId('btnCerrarAtencionCaso')?.addEventListener('click', () => this.cerrarAtencion());
      porId('btnCancelarAtencionCaso')?.addEventListener('click', () => this.cerrarAtencion());
      porId('formAtencionCaso')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.guardarAtencion();
      });
      const modalAtencion = porId('modalAtencionCaso');
      modalAtencion?.addEventListener('click', (e) => {
        if (e.target === modalAtencion) this.cerrarAtencion();
      });
    }

    if (!this._globalBound) {
      this._globalBound = true;
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (porId('modalAtencionCaso')?.classList.contains('open')) {
          this.cerrarAtencion();
          return;
        }
        if (porId('modalNuevaDerivacion')?.classList.contains('open')) this.cerrar();
      });
    }

    this._poblarReferentes();
  },

  abrir() {
    this._seleccionado = null;
    this._casoActivo = null;
    this._referentes = [];

    const modal = porId('modalNuevaDerivacion');
    if (!modal) return;

    const form = porId('formNuevaDerivacion');
    form?.reset();
    porId('derivFecha').value = hoyISO();
    porId('derivAmbito').value = 'Familiar';
    porId('derivUrgencia').value = 'Media';
    porId('derivUsuarioId').value = '';
    porId('derivPasoDatos').hidden = true;
    porId('derivUsuarioSeleccionado').hidden = true;
    porId('derivUsuarioSeleccionado').innerHTML = '';
    porId('derivResultadosUsuarios').hidden = true;
    porId('derivResultadosUsuarios').innerHTML = '';
    this._feedback('');
    this._toggleSoporte();
    this._poblarReferentes();
    this._cargarDatosActivos();
    this._actualizarBoton();

    modal.classList.add('open');
    modal.removeAttribute('inert');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pdi-derivacion-open');
    setTimeout(() => porId('derivBuscarUsuario')?.focus(), 60);
  },

  cerrar() {
    const modal = porId('modalNuevaDerivacion');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
    document.body.classList.remove('pdi-derivacion-open');
    this._seleccionado = null;
    this._casoActivo = null;
    setTimeout(() => porId('btnNuevaDerivacion')?.focus(), 30);
  },

  _feedback(texto, tipo = '') {
    const el = porId('derivFeedback');
    if (!el) return;
    el.textContent = texto || '';
    el.className = 'deriv-feedback' + (tipo ? ' is-' + tipo : '');
  },

  _cargarDatosActivos() {
    const nombre = porId('derivReferenteNombre');
    const cargo = porId('derivReferenteCargo');
    if (nombre && !nombre.value) nombre.value = nombreActivo();
    if (cargo && !cargo.value) cargo.value = cargoActivo();
  },

  _poblarReferentes() {
    const select = porId('derivReferenteSelect');
    if (!select) return;
    const lista = (window.PDI?.VoluntarioModel?.getAll?.() || []).slice().sort((a, b) =>
      nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'));

    this._referentes = lista.map(v => ({
      nombre: nombreCompleto(v),
      cargo: v.rol || v.servicio || 'Voluntariado',
      telefono: v.celular || '',
    }));

    const opciones = ['<option value="">— Escribir manualmente —</option>'];
    this._referentes.forEach((r, i) => {
      opciones.push(`<option value="${i}">${escapar(r.nombre)} · ${escapar(r.cargo)}</option>`);
    });
    select.innerHTML = opciones.join('');
  },

  _cargarReferente() {
    const select = porId('derivReferenteSelect');
    if (!select) return;
    const indice = Number(select.value);
    if (!Number.isInteger(indice) || !this._referentes[indice]) return;
    const r = this._referentes[indice];
    porId('derivReferenteNombre').value = r.nombre;
    porId('derivReferenteCargo').value = r.cargo;
    porId('derivReferenteTel').value = r.telefono;
  },

  _buscar(texto) {
    const contenedor = porId('derivResultadosUsuarios');
    if (!contenedor) return;
    const q = String(texto || '').trim().toLowerCase();
    const lista = window.PDI?.BeneficiarioModel?.getAll?.() || [];
    const ordenada = lista.slice().sort((a, b) =>
      nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'));

    const filtrada = (q
      ? ordenada.filter(b => [
          nombreCompleto(b),
          b.codigo,
          b.dni,
        ].some(v => String(v || '').toLowerCase().includes(q)))
      : ordenada).slice(0, 8);

    if (!filtrada.length) {
      contenedor.innerHTML = '<p class="deriv-empty">No se encontró un usuario con ese nombre, código o DNI.</p>';
      contenedor.hidden = false;
      return;
    }

    contenedor.innerHTML = filtrada.map(b => {
      const activo = this._buscarCasoActivo(b);
      return `
        <button type="button" class="deriv-result" data-beneficiario-id="${escaparEnAtributo(b.id)}">
          <span class="deriv-result-main">
            <strong>${escapar(nombreCompleto(b))}</strong>
            <span>${escapar(b.codigo || 'Sin código')} · ${escapar(b.dni || 'Sin documento')} · ${escapar(b.edad || '')}</span>
          </span>
          <span class="deriv-result-meta">${escapar(b.sede || 'Sin sede')}</span>
          ${activo ? '<span class="status-mark status-mark--warn deriv-result-mark"><span class="status-mark-dot" aria-hidden="true"></span><span>Caso abierto</span></span>' : ''}
        </button>
      `;
    }).join('');
    contenedor.hidden = false;
  },

  _seleccionar(id, casoActivoForzado = null) {
    const lista = window.PDI?.BeneficiarioModel?.getAll?.() || [];
    const b = lista.find(x => String(x.id) === String(id));
    if (!b) return;

    this._seleccionado = b;
    this._casoActivo = casoActivoForzado || this._buscarCasoActivo(b);
    porId('derivUsuarioId').value = b.id;
    porId('derivResultadosUsuarios').hidden = true;
    porId('derivBuscarUsuario').value = '';

    const activo = this._casoActivo;
    const resumen = porId('derivUsuarioSeleccionado');
    resumen.innerHTML = `
      <div class="deriv-selected-head">
        <div>
          <strong>${escapar(nombreCompleto(b))}</strong>
          <span>${escapar(b.codigo || 'Sin código')} · ${escapar(b.dni || 'Sin documento')} · ${escapar(b.edad || '')}</span>
        </div>
        <button type="button" class="deriv-link" id="derivCambiarUsuario">Cambiar</button>
      </div>
      <div class="deriv-selected-grid">
        <span><b>Sede</b>${escapar(b.sede || '—')}</span>
        <span><b>Apoderado</b>${escapar(b.apoderado || '—')}</span>
        <span><b>Parentesco</b>${escapar(b.parentesco || '—')}</span>
        <span><b>Teléfono</b>${escapar(b.telefono || '—')}</span>
        <span><b>Dirección</b>${escapar(b.direccion || '—')}</span>
        <span><b>Distrito</b>${escapar(b.distrito || '—')}</span>
      </div>
      ${activo ? `
        <div class="deriv-warning">
          <strong>Ya tiene una derivación abierta</strong>
          <span>${escapar(activo.folio || activo.codigo || '')}</span>
          <button type="button" class="deriv-link" id="derivAbrirCaso">Abrir caso existente</button>
        </div>
      ` : ''}
    `;
    resumen.hidden = false;
    porId('derivPasoDatos').hidden = Boolean(activo);
    this._cargarDatosActivos();
    this._toggleSoporte();
    this._actualizarBoton();
    this._feedback(activo ? 'Esta persona ya tiene un caso abierto. Ábrelo para continuar.' : '');
  },

  _limpiarSeleccion() {
    this._seleccionado = null;
    this._casoActivo = null;
    porId('derivUsuarioId').value = '';
    porId('derivUsuarioSeleccionado').hidden = true;
    porId('derivUsuarioSeleccionado').innerHTML = '';
    porId('derivPasoDatos').hidden = true;
    this._feedback('');
    this._actualizarBoton();
    porId('derivBuscarUsuario')?.focus();
  },

  _buscarCasoActivo(b) {
    const casos = window.PDI?.CasoSocialModel?.getAll?.() || [];
    return casos.find(c => {
      if (c.etapa === 'cerrado') return false;
      if (c._personaId && b._personaId && String(c._personaId) === String(b._personaId)) return true;
      return c.codigo && b.codigo && String(c.codigo).toLowerCase() === String(b.codigo).toLowerCase();
    }) || null;
  },

  _abrirCasoExistente() {
    const activo = this._casoActivo;
    if (!activo) return;
    const casos = window.PDI?.CasoSocialModel?.getAll?.() || [];
    const caso = casos.find(c => String(c._casoId) === String(activo._casoId)
      || String(c.folio) === String(activo.folio)
      || String(c.codigo) === String(activo.codigo));
    if (caso) {
      this.cerrar();
      window.PDI?.SocialKanbanView?.openDetalleCaso?.(caso._casoId || caso.id);
    } else {
      this._feedback('El caso existe, pero aún no está en la lista. Recarga la página e inténtalo de nuevo.', 'error');
    }
  },

  _toggleSoporte() {
    const tiene = Boolean(porId('derivSoporteTiene')?.checked);
    const campos = porId('derivSoporteCampos');
    if (campos) campos.hidden = !tiene;
    ['derivSoporteNombre', 'derivSoporteParentesco'].forEach(id => {
      const el = porId(id);
      if (el) el.required = tiene;
    });
  },

  _actualizarBoton() {
    const boton = porId('btnGuardarDerivacion');
    if (!boton) return;
    boton.disabled = !this._seleccionado || Boolean(this._casoActivo);
  },

  _leerFormulario() {
    const etiquetas = [...document.querySelectorAll('input[name="derivEtiqueta"]:checked')]
      .map(el => el.value)
      .filter(v => ETIQUETAS.includes(v));
    return {
      beneficiarioId: this._seleccionado?.id,
      codigo: this._seleccionado?.codigo,
      ambito: porId('derivAmbito')?.value || 'Familiar',
      urgencia: porId('derivUrgencia')?.value || 'Media',
      etiquetas,
      fecha: porId('derivFecha')?.value || hoyISO(),
      fechaSuceso: porId('derivFechaSuceso')?.value || '',
      situacionEncontrada: porId('derivSituacion')?.value || '',
      accionesPrevias: porId('derivAcciones')?.value || '',
      soporteFamiliar: {
        tiene: Boolean(porId('derivSoporteTiene')?.checked),
        nombre: porId('derivSoporteNombre')?.value || '',
        parentesco: porId('derivSoporteParentesco')?.value || '',
        detalle: porId('derivSoporteDetalle')?.value || '',
      },
      quienDeriva: {
        nombre: porId('derivReferenteNombre')?.value || '',
        cargo: porId('derivReferenteCargo')?.value || '',
        telefono: porId('derivReferenteTel')?.value || '',
      },
      origen: 'social',
      creadoPor: nombreActivo(),
      servicioOrigen: this._seleccionado?.servicios?.[0] || '',
    };
  },

  async guardar() {
    if (!this._seleccionado) {
      this._feedback('Selecciona primero un usuario.', 'error');
      return;
    }
    if (this._casoActivo) {
      this._feedback('Esta persona ya tiene un caso abierto.', 'error');
      return;
    }

    const telefonoReferente = (porId('derivReferenteTel')?.value || '').trim();
    if (telefonoReferente && !validarTipo('celular', telefonoReferente)) {
      this._feedback('El teléfono del referente debe tener 9 dígitos y empezar con 9.', 'error');
      porId('derivReferenteTel')?.focus();
      return;
    }

    const form = porId('formNuevaDerivacion');
    if (form && !form.checkValidity()) {
      this._feedback('Revisa los campos obligatorios de la ficha.', 'error');
      form.reportValidity();
      return;
    }

    const boton = porId('btnGuardarDerivacion');
    const texto = boton?.textContent;
    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Guardando…';
    }
    this._feedback('');

    try {
      const resultado = await crearDerivacion(this._leerFormulario());
      if (!resultado?.ok) {
        if (resultado?.code === 'CASO_ACTIVO') {
          this._seleccionar(this._seleccionado.id, resultado.caso || { folio: resultado.caso?.folio });
        }
        this._feedback(resultado?.error || 'No se pudo crear la derivación.', 'error');
        return;
      }

      ToastView.show('Derivación creada', `Ficha ${resultado.folio} generada y lista para imprimir.`, 'success');
      this.cerrar();
      this.imprimir(resultado.caso);
      window.PDI?.Bootstrap?.restaurarDatosLocales?.();
    } catch (err) {
      this._feedback(err?.message || 'No se pudo crear la derivación.', 'error');
    } finally {
      if (boton) {
        boton.disabled = false;
        boton.textContent = texto || 'Guardar y generar ficha';
      }
      this._actualizarBoton();
    }
  },

  _normalizarFicha(caso) {
    const snap = caso?.snapshot || {};
    const u = snap.usuario || {};
    const a = snap.apoderado || {};
    const f = snap.ficha || {};
    const quien = f.quienDeriva || caso?.quienDeriva || {};
    const soporte = f.soporte || caso?.soporteFamiliar || {};
    // Los casos anteriores a la ficha V2 no tienen snapshot: se completan con
    // el expediente vivo para que el documento siga siendo imprimible.
    const beneficiario = (window.PDI?.BeneficiarioModel?.getAll?.() || [])
      .find(b => (caso?._personaId && String(b._personaId) === String(caso._personaId))
        || (caso?.codigo && b.codigo && String(b.codigo).toLowerCase() === String(caso.codigo).toLowerCase()));
    return {
      folio: caso?.folio || caso?.codigo || '',
      fecha: f.fecha || caso?.fechaDerivacion || caso?.fecha || hoyISO(),
      usuario: [u.nombres, u.apellidos].filter(Boolean).join(' ').trim()
        || (beneficiario ? nombreCompleto(beneficiario) : caso?.usuario || ''),
      tipoDocumento: u.tipoDocumento || beneficiario?.tipoDocumento || 'DNI',
      documento: u.documento || beneficiario?.dni || '',
      edad: u.edad || beneficiario?.edad || '',
      direccion: u.direccion || beneficiario?.direccion || '',
      distrito: u.distrito || beneficiario?.distrito || '',
      referencia: u.referencia || beneficiario?.referencia || '',
      telefono: u.telefono || beneficiario?.telefono || '',
      sede: u.sede || caso?.sede || beneficiario?.sede || '',
      apoderado: a.nombre || beneficiario?.apoderado || '',
      apoderadoParentesco: a.parentesco || beneficiario?.parentesco || '',
      apoderadoDocumento: a.documento || beneficiario?.apoderadoDni || '',
      apoderadoTelefono: a.telefono || beneficiario?.telefono || '',
      ambito: f.ambito || caso?.ambito || caso?.tipoProblematica || '',
      etiquetas: Array.isArray(f.etiquetas) ? f.etiquetas : (Array.isArray(caso?.etiquetas) ? caso.etiquetas : []),
      urgencia: f.urgencia || caso?.urgencia || 'Media',
      fechaSuceso: f.fechaSuceso || caso?.fechaSuceso || '',
      situacion: f.situacion || caso?.situacionEncontrada || '',
      acciones: f.acciones || caso?.accionesPrevias || '',
      soporteTiene: Boolean(soporte.tiene),
      soporteNombre: soporte.nombre || caso?.soporteNombre || '',
      soporteParentesco: soporte.parentesco || caso?.soporteParentesco || '',
      soporteDetalle: soporte.detalle || '',
      quienNombre: quien.nombre || '',
      quienCargo: quien.cargo || '',
      quienTelefono: quien.telefono || '',
    };
  },

  imprimir(caso) {
    if (!caso) {
      ToastView.show('Sin ficha', 'Abre un caso para imprimir su ficha.', 'warning');
      return;
    }
    const d = this._normalizarFicha(caso);
    const marcar = (valor) => d.ambito === valor ? '☑' : '☐';
    const siNo = (valor) => valor ? '☑' : '☐';
    const etiquetas = d.etiquetas.length
      ? d.etiquetas.map(t => `<span class="tag">${escapar(t)}</span>`).join('')
      : '<span class="muted">Sin etiquetas</span>';

    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Ficha de derivación ${escapar(d.folio)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #111; margin: 0; padding: 28px; font-size: 12px; }
  .head { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
  .head h1 { font-size: 18px; margin: 0 0 4px; }
  .head p { margin: 0; color: #555; }
  .meta { text-align: right; font-size: 11px; line-height: 1.5; }
  .meta strong { display: block; font-size: 13px; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; background: #eee; padding: 5px 8px; margin: 14px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #bbb; padding: 6px 8px; vertical-align: top; text-align: left; }
  th { width: 24%; background: #f7f7f7; font-weight: 600; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
  .item { border-bottom: 1px solid #ddd; padding: 4px 0; }
  .item b { display: block; font-size: 9px; text-transform: uppercase; color: #666; letter-spacing: .04em; }
  .tag { display: inline-block; border: 1px solid #999; border-radius: 10px; padding: 1px 7px; margin-right: 4px; font-size: 10px; }
  .muted { color: #777; }
  .box { border: 1px solid #bbb; padding: 8px; min-height: 42px; }
  .checks { line-height: 1.8; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 42px; }
  .sign div { border-top: 1px solid #111; padding-top: 6px; text-align: center; font-size: 10px; color: #555; }
  .foot { margin-top: 18px; font-size: 9px; color: #777; text-align: center; }
  @media print { body { padding: 12mm; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>Ficha de derivación de caso social</h1>
      <p>Proyecto Infancia Saludable · Área Social Pastoral</p>
    </div>
    <div class="meta">
      <strong>${escapar(d.folio)}</strong>
      Fecha: ${escapar(d.fecha)}<br>
      Sede: ${escapar(d.sede)}
    </div>
  </div>

  <h2>Datos del colaborador, voluntario o persona que deriva</h2>
  <div class="grid">
    <div class="item"><b>Nombres y apellidos</b>${escapar(d.quienNombre || '—')}</div>
    <div class="item"><b>Cargo</b>${escapar(d.quienCargo || '—')}</div>
    <div class="item"><b>Teléfono</b>${escapar(d.quienTelefono || '—')}</div>
  </div>

  <h2>Datos del usuario derivado y apoderado</h2>
  <table>
    <tr><th>Usuario</th><td>${escapar(d.usuario || '—')}</td><th>${escapar(d.tipoDocumento)}</th><td>${escapar(d.documento || '—')}</td></tr>
    <tr><th>Edad</th><td>${escapar(d.edad || '—')}</td><th>Teléfono</th><td>${escapar(d.telefono || '—')}</td></tr>
    <tr><th>Dirección</th><td colspan="3">${escapar(d.direccion || '—')}</td></tr>
    <tr><th>Distrito</th><td>${escapar(d.distrito || '—')}</td><th>Referencia</th><td>${escapar(d.referencia || '—')}</td></tr>
    <tr><th>Apoderado</th><td>${escapar(d.apoderado || '—')}</td><th>Parentesco</th><td>${escapar(d.apoderadoParentesco || '—')}</td></tr>
    <tr><th>DNI apoderado</th><td>${escapar(d.apoderadoDocumento || '—')}</td><th>Teléfono</th><td>${escapar(d.apoderadoTelefono || '—')}</td></tr>
  </table>

  <h2>Motivo de la derivación</h2>
  <div class="checks">
    <b>Tipo de problemática:</b>
    ${marcar('Familiar')} Familiar &nbsp; ${marcar('Educativo')} Educativo &nbsp; ${marcar('Salud')} Salud
    ${etiquetas ? `<div style="margin-top:6px;">${etiquetas}</div>` : ''}
  </div>
  <div class="item" style="margin-top:8px;"><b>Breve situación encontrada y fecha aproximada del suceso</b>
    <div class="box">${escapar(d.situacion || '—')}</div>
    <div style="margin-top:4px;">Fecha aproximada: ${escapar(d.fechaSuceso || '—')}</div>
  </div>
  <div class="item"><b>Acciones realizadas por la usuaria / familia</b><div class="box">${escapar(d.acciones || '—')}</div></div>
  <div class="item">
    <b>Cuenta con soporte familiar</b>
    ${siNo(d.soporteTiene)} Sí &nbsp; ${siNo(!d.soporteTiene)} No
    ${d.soporteTiene ? `<div style="margin-top:4px;">${escapar(d.soporteNombre || '—')} · ${escapar(d.soporteParentesco || '—')}</div>` : ''}
    ${d.soporteDetalle ? `<div class="muted" style="margin-top:4px;">${escapar(d.soporteDetalle)}</div>` : ''}
  </div>

  <div class="sign">
    <div>Firma de quien deriva</div>
    <div>Recibido por / Área Social Pastoral</div>
  </div>
  <div class="foot">Documento generado desde el Sistema PDI · ${escapar(d.folio)} · Urgencia: ${escapar(d.urgencia)}</div>
  <script>window.onload = function () { window.print(); };<\/script>
</body>
</html>`;

    const ventana = window.open('', '_blank', 'width=920,height=760');
    if (!ventana) {
      ToastView.show('No se pudo abrir la impresión', 'Permite las ventanas emergentes para imprimir la ficha.', 'warning');
      return;
    }
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  },

  abrirAtencion(caso) {
    if (!caso) {
      ToastView.show('Sin caso', 'Abre un caso para registrar una atención.', 'warning');
      return;
    }
    this._casoAtencion = caso;
    // El detalle vive en GlobalModals y quedaría encima de este modal.
    window.PDI?.SocialKanbanView?.closeModalDetalleCaso?.();
    const form = porId('formAtencionCaso');
    form?.reset();
    const fecha = porId('atencionFecha');
    if (fecha) fecha.value = hoyISO();
    const responsable = porId('atencionResponsable');
    if (responsable) responsable.value = nombreActivo();
    const modal = porId('modalAtencionCaso');
    if (!modal) return;
    modal.classList.add('open');
    modal.removeAttribute('inert');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pdi-derivacion-open');
    setTimeout(() => porId('atencionDescripcion')?.focus(), 60);
  },

  cerrarAtencion(reabrirDetalle = true) {
    const modal = porId('modalAtencionCaso');
    if (!modal) return;
    const caso = this._casoAtencion;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
    document.body.classList.remove('pdi-derivacion-open');
    this._casoAtencion = null;
    if (reabrirDetalle && caso) {
      window.PDI?.SocialKanbanView?.openDetalleCaso?.(caso._casoId || caso.id);
    }
  },

  async guardarAtencion() {
    if (!this._casoAtencion) return;
    const form = porId('formAtencionCaso');
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const boton = porId('btnGuardarAtencion');
    const texto = boton?.textContent;
    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Guardando…';
    }
    const datos = {
      tipo: porId('atencionTipo')?.value || 'Visita Domiciliaria',
      fecha: porId('atencionFecha')?.value || hoyISO(),
      descripcion: porId('atencionDescripcion')?.value || '',
      oficio: porId('atencionOficio')?.value || '',
      responsable: porId('atencionResponsable')?.value || nombreActivo(),
    };
    try {
      const ok = await crearEventoCaso(this._casoAtencion, datos);
      if (!ok) {
        ToastView.show('No se pudo registrar la atención', 'Revisa la conexión e inténtalo de nuevo.', 'danger');
        return;
      }
      const caso = this._casoAtencion;
      caso.eventos = [{
        tipo: datos.tipo, fecha: datos.fecha, descripcion: datos.descripcion,
        responsable: datos.responsable, oficio: datos.oficio,
      }, ...(caso.eventos || [])];
      this.cerrarAtencion(false);
      window.PDI?.SocialKanbanView?.openDetalleCaso?.(caso._casoId || caso.id);
      ToastView.show('Atención registrada', `${datos.tipo} del ${datos.fecha}.`, 'success');
      window.PDI?.Bootstrap?.restaurarDatosLocales?.();
    } finally {
      if (boton) {
        boton.disabled = false;
        boton.textContent = texto || 'Registrar atención';
      }
    }
  },
};

/** Escapa un valor para usarlo dentro de un atributo HTML. */
function escaparEnAtributo(valor) {
  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.DerivacionView = DerivacionView;
}
