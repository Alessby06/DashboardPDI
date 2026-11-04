// Controlador: Acompañamiento Educativo (Casita del Saber)
//
// La asistencia ya no se escribe con cada clic. Se carga una jornada (un día y
// una sede), el usuario marca alumnos en un borrador y pulsa "Guardar
// jornada": una sola transacción y un único estado coherente. El borrador
// sobrevive a las rehidrataciones de la capa de datos, que antes volvían a
// pintar "la asistencia de hoy" y pisaban lo que se estaba marcando.
import { ToastView } from '../views/ToastView.js';
import {
  fetchAsistenciaJornada,
  guardarAsistenciaJornada,
  mapaJornada,
} from '../core/db.js';
import {
  ESTADOS_ASISTENCIA,
  diaEnZona,
  puedeEditarJornada,
  motivoEdicionBloqueada,
  estadoEfectivo,
  infoEstado,
  resumenJornada,
  validarMotivoFJ,
  compararJornadas,
  normalizarMarca,
} from '../core/jornadaAsistencia.js';

function clonarMapa(mapa) {
  return JSON.parse(JSON.stringify(mapa || {}));
}

function mostrarToast(mensaje, detalle, tono = 'danger') {
  const toast = (typeof window !== 'undefined' && window.PDI?.ToastView) || ToastView;
  toast?.show?.(mensaje, detalle, tono);
}

export const CasitasController = {
  _jornada: null,          // { dia: 'YYYY-MM-DD', sede: 'Año Nuevo' }
  _guardado: {},           // inscripcionId -> { estado, observacion }
  _borrador: {},           // inscripcionId -> { estado, observacion } | null
  _lineaBase: {},          // copia de _guardado al cargar, para el conflicto
  _cargando: false,
  _guardando: false,
  _sincronizando: false,
  _avisoRemoto: false,
  _conflictos: [],
  _ultimoError: '',
  // Asistencia de hoy para el KPI del panel general. Es un mapa
  // { [beneficiarioId]: estado } que llega con la hidratación y NO se mezcla
  // con la jornada de esta página.
  _asistenciaHoy: {},

  /** Lo llama la capa de datos tras hidratar. No toca el borrador. */
  aplicarDatosAsistencia(mapa) {
    this._asistenciaHoy = (mapa && typeof mapa === 'object') ? mapa : {};
  },

  /** Compatibilidad con el panel general: mapa de hoy { [id]: estado }. */
  _cargar() {
    return this._asistenciaHoy || {};
  },

  /** Rol activo. La sesión lo guarda en localStorage (ver auth/usuarios.js). */
  rolActual() {
    if (typeof localStorage === 'undefined') return 'coord';
    return localStorage.getItem('pdi_active_role') || 'coord';
  },

  nombreUsuario() {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('pdi_usuario_nombre') || '';
  },

  diaHoy() {
    return diaEnZona();
  },

  getJornada() {
    return this._jornada ? { ...this._jornada } : null;
  },

  esJornadaIniciada() {
    return Boolean(this._jornada?.dia && this._jornada?.sede);
  },

  puedeEditar() {
    return puedeEditarJornada(this.rolActual(), this._jornada?.dia);
  },

  motivoSoloLectura() {
    return motivoEdicionBloqueada(this.rolActual(), this._jornada?.dia);
  },

  /** Una carga o un guardado en vuelo no deben aceptar marcas nuevas. */
  _ocupado() {
    return this._cargando || this._guardando;
  },

  /** Carga la jornada de una sede y un día desde la nube. */
  async cargarJornada(dia, sede) {
    if (this._cargando) return false;
    this._cargando = true;
    this._ultimoError = '';
    try {
      const filas = (dia && sede) ? await fetchAsistenciaJornada(dia, sede) : [];
      this._jornada = dia && sede ? { dia, sede } : null;
      this._guardado = mapaJornada(filas);
      this._lineaBase = clonarMapa(this._guardado);
      this._borrador = {};
      this._conflictos = [];
      this._avisoRemoto = false;
      return true;
    } catch (err) {
      this._ultimoError = err?.message || 'No se pudo cargar la jornada.';
      mostrarToast('No se pudo cargar la jornada', this._ultimoError, 'danger');
      return false;
    } finally {
      this._cargando = false;
    }
  },

  /** Inscripción de un alumno, a partir del id que usa la vista. */
  _inscripcionDe(id) {
    const beneficiario = window.PDI?.BeneficiarioModel?.getById?.(id);
    return beneficiario?._inscripcionId ? String(beneficiario._inscripcionId) : '';
  },

  _beneficiarioPorInscripcion(inscripcionId) {
    const lista = window.PDI?.BeneficiarioModel?.getAll?.() || [];
    return lista.find(b => String(b._inscripcionId || '') === String(inscripcionId)) || null;
  },

  /** Marca efectiva de un alumno: borrador primero, luego lo guardado. */
  getMarca(id) {
    const inscripcionId = this._inscripcionDe(id);
    if (!inscripcionId) return normalizarVacio();
    return estadoEfectivo(this._guardado, this._borrador, inscripcionId);
  },

  /** Clave, etiqueta y clase del badge. Sin marcar devuelve clave vacía. */
  getEstadoInfo(id) {
    return infoEstado(this.getMarca(id));
  },

  /** Compatibilidad: un alumno sin marcar ya no se asume "P". */
  getEstado(id) {
    return this.getEstadoInfo(id).clave || '';
  },

  /**
   * Marca un alumno en el borrador. Devuelve { ok, error }.
   * Volver a pulsar el mismo estado lo desmarca.
   */
  marcar(id, estado) {
    if (this._ocupado()) {
      return { ok: false, error: 'Espera a que termine la operación en curso.' };
    }
    if (!this.puedeEditar()) {
      return { ok: false, error: this.motivoSoloLectura() };
    }
    const inscripcionId = this._inscripcionDe(id);
    if (!inscripcionId) {
      return { ok: false, error: 'El usuario no tiene una inscripción activa.' };
    }
    if (!ESTADOS_ASISTENCIA[estado]) {
      return { ok: false, error: 'Estado de asistencia no válido.' };
    }

    const nueva = { estado, observacion: '' };
    const guardada = this._guardado[inscripcionId] || null;
    if (guardada && guardada.estado === estado && (guardada.observacion || '') === '') {
      // Mismo estado que ya estaba guardado: no hay cambio que conservar.
      delete this._borrador[inscripcionId];
      return { ok: true, desmarcado: true };
    }

    const borradorActual = this._borrador[inscripcionId];
    if (borradorActual && borradorActual.estado === estado && (borradorActual.observacion || '') === '') {
      delete this._borrador[inscripcionId];
      return { ok: true, desmarcado: true };
    }

    this._borrador[inscripcionId] = nueva;
    return { ok: true };
  },

  /** Marca una falta justificada con su motivo obligatorio. */
  marcarFJ(id, motivo) {
    if (this._ocupado()) {
      return { ok: false, error: 'Espera a que termine la operación en curso.' };
    }
    if (!this.puedeEditar()) {
      return { ok: false, error: this.motivoSoloLectura() };
    }
    const inscripcionId = this._inscripcionDe(id);
    if (!inscripcionId) {
      return { ok: false, error: 'El usuario no tiene una inscripción activa.' };
    }
    const validacion = validarMotivoFJ('FJ', motivo);
    if (!validacion.ok) return { ok: false, error: validacion.error };

    const guardada = this._guardado[inscripcionId] || null;
    if (guardada && guardada.estado === 'FJ' && (guardada.observacion || '') === validacion.observacion) {
      delete this._borrador[inscripcionId];
      return { ok: true, desmarcado: true };
    }
    this._borrador[inscripcionId] = { estado: 'FJ', observacion: validacion.observacion };
    return { ok: true };
  },

  /** Quita la marca de un alumno (se borrará al guardar si estaba en la nube). */
  limpiarMarca(id) {
    if (this._ocupado()) {
      return { ok: false, error: 'Espera a que termine la operación en curso.' };
    }
    if (!this.puedeEditar()) {
      return { ok: false, error: this.motivoSoloLectura() };
    }
    const inscripcionId = this._inscripcionDe(id);
    if (!inscripcionId) return { ok: false, error: 'Inscripción no encontrada.' };

    if (this._guardado[inscripcionId]) {
      // Aunque hubiera un borrador encima, "quitar" significa dejar el día
      // sin marca; el guardado eliminará la fila.
      this._borrador[inscripcionId] = null;
    } else {
      delete this._borrador[inscripcionId];
    }
    return { ok: true };
  },

  hayCambios() {
    return Object.keys(this._borrador).length > 0;
  },

  numeroCambios() {
    return Object.keys(this._borrador).length;
  },

  /** Resumen completo de la jornada (sin aplicar grado ni búsqueda). */
  getResumen(ids) {
    return resumenJornada(ids || [], id => this.getMarca(id));
  },

  _cambiosParaGuardar() {
    const cambios = {};
    for (const [inscripcionId, marca] of Object.entries(this._borrador)) {
      const beneficiario = this._beneficiarioPorInscripcion(inscripcionId);
      if (!beneficiario) continue;
      cambios[inscripcionId] = {
        estado: marca?.estado || '',
        observacion: marca?.observacion || '',
        sedeId: beneficiario._sedeRawId || '',
      };
    }
    return cambios;
  },

  /** Guarda la jornada. Devuelve { ok, conflictos?, error? }. */
  async guardarJornada({ forzar = false } = {}) {
    if (!this.esJornadaIniciada()) {
      return { ok: false, error: 'Elige un día y una sede antes de guardar.' };
    }
    if (!this.puedeEditar()) {
      return { ok: false, error: this.motivoSoloLectura() };
    }
    if (!this.hayCambios()) {
      return { ok: false, error: 'No hay cambios que guardar.' };
    }
    if (this._guardando) return { ok: false, error: 'La jornada ya se está guardando.' };

    this._guardando = true;
    try {
      const cambios = this._cambiosParaGuardar();
      if (!Object.keys(cambios).length) {
        return { ok: false, error: 'No se pudo identificar a los alumnos marcados.' };
      }
      const sinBeneficiario = Object.keys(this._borrador).filter(ins => !cambios[ins]);
      if (sinBeneficiario.length) {
        return {
          ok: false,
          error: 'Alguno de los alumnos marcados ya no está en el padrón. Recarga la jornada.',
        };
      }

      const resultado = await guardarAsistenciaJornada({
        dia: this._jornada.dia,
        sede: this._jornada.sede,
        cambios,
        lineaBase: this._lineaBase,
        registradoPorNombre: this.nombreUsuario(),
        forzar,
      });

      if (!resultado.ok) {
        if (resultado.conflictos) {
          this._conflictos = resultado.conflictos;
          this._avisoRemoto = true;
          return resultado;
        }
        this._ultimoError = resultado.error || 'No se pudo guardar la jornada.';
        return resultado;
      }

      // La línea base pasa a ser lo recién guardado.
      for (const guardado of resultado.guardados || []) {
        if (guardado.estado) {
          const marca = {
            estado: guardado.estado,
            observacion: guardado.observacion || '',
            registradoPorNombre: this.nombreUsuario(),
          };
          this._guardado[guardado.inscripcionId] = marca;
          this._lineaBase[guardado.inscripcionId] = { ...marca };
        } else {
          delete this._guardado[guardado.inscripcionId];
          delete this._lineaBase[guardado.inscripcionId];
        }
      }
      this._borrador = {};
      this._conflictos = [];
      this._avisoRemoto = false;
      return { ok: true, guardados: (resultado.guardados || []).length };
    } finally {
      this._guardando = false;
    }
  },

  /** Conflictos con nombres, para que la vista pueda explicarlos. */
  getConflictosDetalle() {
    return (this._conflictos || []).map(conflicto => {
      const beneficiario = this._beneficiarioPorInscripcion(conflicto.inscripcionId);
      return {
        ...conflicto,
        nombre: beneficiario
          ? `${beneficiario.nombres || ''} ${beneficiario.apellidos || ''}`.trim()
          : conflicto.inscripcionId,
        codigo: beneficiario?.codigo || '',
      };
    });
  },

  tieneConflicto() {
    return (this._conflictos || []).length > 0;
  },

  tieneAvisoRemoto() {
    return this._avisoRemoto;
  },

  /** Descarta el aviso sin recargar (el guardado volverá a comprobar). */
  descartarAvisoRemoto() {
    this._avisoRemoto = false;
    this._conflictos = [];
  },

  /**
   * Reacciona a una hidratación/LIVE: si no hay borrador, trae la jornada
   * otra vez; si lo hay, avisa en vez de pisar lo que el usuario escribió.
   */
  async sincronizarJornada() {
    if (!this.esJornadaIniciada()) return;
    if (this._cargando || this._guardando || this._sincronizando) return;
    if (this.hayCambios()) {
      // No se pisa el borrador. Se consulta la nube y solo se avisa si cambió
      // alguno de los alumnos que este dispositivo va a escribir; una
      // hidratación por otro módulo no debe parecer un conflicto.
      try {
        const actuales = mapaJornada(
          await fetchAsistenciaJornada(this._jornada.dia, this._jornada.sede),
        );
        const conflictos = compararJornadas(this._lineaBase, actuales, this._borrador)
          .map(conflicto => ({
            ...conflicto,
            nuevo: normalizarMarca(this._borrador[conflicto.inscripcionId]),
          }));
        if (conflictos.length) {
          this._conflictos = conflictos;
          this._avisoRemoto = true;
          window.PDI?.CasitasView?._renderAvisos?.();
        } else if (this._conflictos.length || this._avisoRemoto) {
          // La nube volvió al estado de la línea base: el aviso ya no aplica.
          this._conflictos = [];
          this._avisoRemoto = false;
          window.PDI?.CasitasView?._renderAvisos?.();
        }
      } catch (e) {
        // Silencio: el guardado vuelve a comprobar el conflicto antes de escribir.
      }
      return;
    }
    this._sincronizando = true;
    try {
      await this.cargarJornada(this._jornada.dia, this._jornada.sede);
      window.PDI?.CasitasView?.renderJornada?.();
    } finally {
      this._sincronizando = false;
    }
  },

  /** Recarga manual de la jornada, con confirmación si hay cambios. */
  async recargarJornada() {
    if (!this.esJornadaIniciada()) return false;
    if (this.hayCambios()) {
      const seguir = window.confirm(
        'Hay cambios sin guardar. Si recargas la jornada se perderán. ¿Continuar?',
      );
      if (!seguir) return false;
    }
    const ok = await this.cargarJornada(this._jornada.dia, this._jornada.sede);
    return ok;
  },

  /** Mapa para el CSV: { [beneficiarioId]: { estado, observacion, registradoPorNombre } }. */
  getMapaExport() {
    const mapa = {};
    const lista = window.PDI?.BeneficiarioModel?.getAll?.() || [];
    for (const beneficiario of lista) {
      const marca = this.getMarca(beneficiario.id);
      if (!marca.estado) continue;
      const inscripcionId = String(beneficiario._inscripcionId || '');
      const enBorrador = Object.prototype.hasOwnProperty.call(this._borrador, inscripcionId);
      mapa[beneficiario.id] = {
        ...marca,
        registradoPorNombre: enBorrador
          ? this.nombreUsuario()
          : (this._guardado[inscripcionId]?.registradoPorNombre || this.nombreUsuario()),
      };
    }
    return mapa;
  },
};

function normalizarVacio() {
  return { estado: '', observacion: '' };
}

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CasitasController = CasitasController;
}
