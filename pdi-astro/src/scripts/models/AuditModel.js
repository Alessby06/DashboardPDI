// Modelo de Trazabilidad y Auditoría de Seguridad
// La fuente única de verdad es la instancia de SurrealDB Cloud (bitacora_auditoria).
// Cada log() escribe en la nube bajo el nuevo contrato estructurado con severidades,
// módulos oficiales y diffs normalizados para cumplimiento de la Ley N.° 29733.
import { crearBitacora } from '../core/db.js';

export const AuditModel = {
  _logs: null,

  init() {
    if (!this._logs) this._logs = [];
  },

  /** La capa de datos entrega la bitácora hidratada de la nube. */
  aplicarDatos(lista) {
    if (!Array.isArray(lista)) return;
    this._logs = lista;
  },

  getAll() {
    if (!this._logs) this.init();
    return this._logs;
  },

  getById(id) {
    this.init();
    return this._logs.find(l => l.id === id) || null;
  },

  /** Helper para generar título determinista estándar */
  generarTitulo(accion, entidad, codigo = '') {
    const act = String(accion || 'Operación').trim();
    const ent = String(entidad || '').trim();
    const cod = String(codigo || '').trim();
    const ref = cod ? `${ent ? ent + ' · ' : ''}${cod}` : ent;
    return ref ? `${act} · ${ref}` : act;
  },

  /** Helper para inferir módulo a partir de entidad o acción */
  inferirModulo(entidad = '', accion = '') {
    const t = `${entidad} ${accion}`.toLowerCase();
    if (t.includes('salud') || t.includes('cred') || t.includes('hb') || t.includes('hemoglobina') || t.includes('nutrici') || t.includes('ración') || t.includes('desayuno') || t.includes('lonchera')) {
      return 'Servicio Alimentario y Nutricional';
    }
    if (t.includes('educa') || t.includes('casita') || t.includes('asistencia') || t.includes('pedagóg') || t.includes('biblioteca')) {
      return 'Servicio de Acompañamiento Educativo';
    }
    if (t.includes('social') || t.includes('pastoral') || t.includes('asp') || t.includes('vulnerab') || t.includes('demuna') || t.includes('caso')) {
      return 'Servicio Social Pastoral (ASP)';
    }
    if (t.includes('voluntar') || t.includes('btf') || t.includes('jac') || t.includes('comunitaria')) {
      return 'Padrón de Voluntarios';
    }
    if (t.includes('colaborador') || t.includes('personal') || t.includes('docente') || t.includes('promotor')) {
      return 'Padrón de Colaboradores';
    }
    if (t.includes('sede') || t.includes('iglesia') || t.includes('pastor') || t.includes('aforo')) {
      return 'Sedes e Iglesias Aliadas';
    }
    if (t.includes('cuenta') || t.includes('clave') || t.includes('mfa') || t.includes('perfil') || t.includes('sesi') || t.includes('permiso')) {
      return 'Cuentas y Acceso';
    }
    if (t.includes('beneficiario') || t.includes('padrón') || t.includes('matricula') || t.includes('familiar') || t.includes('apoderado') || t.includes('expediente')) {
      return 'Padrón de Usuarios';
    }
    return 'General';
  },

  /** Helper para inferir severidad institucional */
  inferirSeveridad(accion = '', detalle = '', diff = null) {
    const t = `${accion} ${detalle}`.toLowerCase();
    if (t.includes('demuna') || t.includes('cem') || t.includes('fiscal') || t.includes('polic') || t.includes('baja') || t.includes('bloque') || t.includes('contrase') || t.includes('elimin')) {
      return 'Crítico/Legal';
    }
    if (t.includes('anemia severa') || t.includes('anemia moderada') || t.includes('vulnerabilidad extrema') || t.includes('confidencial') || t.includes('clínic')) {
      return 'Sensible';
    }
    return 'Rutinario';
  },

  /** Helper para calcular diff entre dos estados de entidad */
  calcularDiff(antes = {}, despues = {}, etiquetas = {}) {
    if (!antes || !despues) return null;
    const diffs = [];
    const denylist = new Set(['clave', 'password', 'token', 'hash', 'salt', 'secreto']);
    const todasLasClaves = new Set([...Object.keys(antes), ...Object.keys(despues)]);

    for (const k of todasLasClaves) {
      if (denylist.has(k.toLowerCase())) continue;
      const vAntes = antes[k];
      const vDesp = despues[k];
      if (JSON.stringify(vAntes) !== JSON.stringify(vDesp)) {
        diffs.push({
          campo: k,
          etiqueta: etiquetas[k] || k,
          antes: vAntes ?? null,
          despues: vDesp ?? null,
        });
      }
    }
    return diffs.length ? diffs : null;
  },

  async log(user, role, action, entity, detail, diff = null, ip = "192.168.1.x", sede = "Central", opciones = {}) {
    this.init();
    const now = new Date();
    const timestamp = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, '0') + "-" +
      String(now.getDate()).padStart(2, '0') + " " +
      String(now.getHours()).padStart(2, '0') + ":" +
      String(now.getMinutes()).padStart(2, '0');

    const id = "LOG-" + String(this._logs.length + 1).padStart(4, '0');
    const modulo = opciones.modulo || this.inferirModulo(entity, action);
    const severidad = opciones.severidad || this.inferirSeveridad(action, detail, diff);
    const titulo = opciones.titulo || this.generarTitulo(action, entity);
    const subtitulo = opciones.subtitulo || detail || '';

    const entry = {
      id,
      timestamp,
      titulo,
      subtitulo,
      modulo,
      submodulo: opciones.submodulo || null,
      severidad,
      user,
      role,
      action,
      entity,
      detail,
      status: "Registrado",
      ip,
      sede,
      diff
    };
    this._logs.unshift(entry);
    // Persistencia real en bitacora_auditoria
    await crearBitacora(entry);
    return entry;
  },

  /**
   * Variante por objeto que controladores y vistas invocan.
   * Totalmente retrocompatible con soporte para opciones enriquecidas.
   */
  addLog(entry = {}) {
    if (!entry || typeof entry !== "object") return null;
    return this.log(
      entry.user || "Sistema",
      entry.role || "Sistema",
      entry.action || "Evento",
      entry.entity || "",
      entry.detail || "",
      entry.diff ?? null,
      entry.ip || "192.168.1.x",
      entry.sede || "Central",
      {
        modulo: entry.modulo,
        submodulo: entry.submodulo,
        severidad: entry.severidad,
        titulo: entry.titulo,
        subtitulo: entry.subtitulo,
      }
    );
  },

  /**
   * Helper estándar para registrar acciones operativas desde cualquier vista o modelo.
   */
  registrarAccion(accion, detalle, entidad = 'Colaborador') {
    return this.addLog({
      action: accion,
      detail: detalle,
      entity: entidad,
    });
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.AuditModel = AuditModel;
}
