import { iconHtml } from '../../data/iconos.js';
// Vista: Ajustes del Sistema y Preferencias (Modo Oscuro & Sync BD)
//
// El tema vive en js/core/Theme.js, no aqui. Antes estaba en esta vista y
// arrastraba sus 11 KB a las diez paginas, porque el conmutador de la barra
// superior es del chrome comun y llegaba a traves de legacy-globals. Aqui solo
// queda la parte que es de esta pagina: los tres botones y la mascota de foco.
// Los metodos setTheme y toggleFocoMode se mantienen porque ajustes.html los
// invoca por window.PDI.AjustesView, y ahora delegan en Theme.
import { Theme } from "../core/Theme.js";
import { limpiarSnapshot } from "../core/snapshot.js";

const ESTADOS_BD = {
  ok: { clase: 'status-mark--ok', texto: 'En Línea' },
  conectando: { clase: 'status-mark--warn', texto: 'Conectando…' },
  sin_conexion: { clase: 'status-mark--danger', texto: 'Sin Conexión' },
};

export const AjustesView = {
  init() {
    // El tema ya quedo restaurado por Theme.cargar() dentro de arrancarComun(),
    // que corre en todas las paginas. Aqui solo queda su parte propia.
    this.bindThemeButtons();

    const btnSync = document.getElementById('btnTriggerSync');
    if (btnSync) btnSync.onclick = () => this.triggerSync();
    const btnCache = document.getElementById('btnClearCache');
    if (btnCache) btnCache.onclick = () => this.clearCache();

    this._suscribirEstadoBD();
    this.render();
  },

  bindThemeButtons() {
    const btnLight = document.getElementById('btnThemeLight');
    const btnDark = document.getElementById('btnThemeDark');
    const btnSystem = document.getElementById('btnThemeSystem');

    if (btnLight) {
      btnLight.onclick = (e) => {
        this.setTheme('light', false, e);
      };
    }
    if (btnDark) {
      btnDark.onclick = (e) => {
        this.setTheme('dark', false, e);
      };
    }
    if (btnSystem) {
      btnSystem.onclick = (e) => {
        this.setTheme('system', false, e);
      };
    }
  },

  render() {
    this._updateThemeUI();
    // Estado real de la base y de la ultima hidratacion: antes eran textos
    // fijos ("En Linea", "Hoy a las 10:45 AM") que no decian la verdad.
    this._pintarEstadoBD(window.PDI?.DB?.estadoActual?.() ?? null);
    this._pintarUltimaSync();
  },

  /**
   * Una sola suscripcion por documento. El modulo sobrevive a la navegacion
   * con ClientRouter; el oyente se queda y, fuera de /ajustes, no encuentra la
   * marca y no hace nada.
   */
  _suscribirEstadoBD() {
    if (this._desuscribirBD) return;
    const DB = window.PDI?.DB;
    if (!DB?.suscribirEstado) return;
    this._desuscribirBD = DB.suscribirEstado((estado) => this._pintarEstadoBD(estado));
  },

  _pintarEstadoBD(estado) {
    const marca = document.getElementById('syncStatusMark');
    if (!marca) return;
    const info = ESTADOS_BD[estado] || ESTADOS_BD.conectando;
    marca.className = 'status-mark ' + info.clase;
    marca.innerHTML = `<span class="status-mark-dot" aria-hidden="true"></span><span>${info.texto}</span>`;
  },

  _pintarUltimaSync() {
    const etiqueta = document.getElementById('labelLastSyncTime');
    if (!etiqueta) return;
    const ms = Number(window.PDI?.DB?.ultimaHidratacion?.() || 0);
    const fecha = new Date(ms);
    if (!ms || Number.isNaN(fecha.getTime())) {
      etiqueta.textContent = '—';
      return;
    }
    const hora = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mismoDia = fecha.toDateString() === new Date().toDateString();
    etiqueta.textContent = mismoDia
      ? `Hoy a las ${hora}`
      : fecha.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  },

  /** Mascota de foco. */
  toggleFocoMode(event = null) {
    Theme.alternarFoco(event);
  },

  setTheme(themeName, showToast = false, clickEvent = null, animar = true) {
    Theme.setTheme(themeName, false, clickEvent, animar);
  },

  _updateThemeUI() {
    const btnLight = document.getElementById('btnThemeLight');
    const btnDark = document.getElementById('btnThemeDark');
    const btnSystem = document.getElementById('btnThemeSystem');

    const badgeLight = document.getElementById('badgeThemeLight');
    const badgeDark = document.getElementById('badgeThemeDark');
    const badgeSystem = document.getElementById('badgeThemeSystem');

    if (btnLight && btnDark && btnSystem) {
      [btnLight, btnDark, btnSystem].forEach(btn => btn.classList.remove('active'));
      [badgeLight, badgeDark, badgeSystem].forEach(badge => {
        if (badge) badge.style.display = 'none';
      });

      const actual = Theme.estado();
      if (actual === 'dark') {
        btnDark.classList.add('active');
        if (badgeDark) badgeDark.style.display = 'inline-flex';
      } else if (actual === 'system') {
        btnSystem.classList.add('active');
        if (badgeSystem) badgeSystem.style.display = 'inline-flex';
      } else {
        btnLight.classList.add('active');
        if (badgeLight) badgeLight.style.display = 'inline-flex';
      }
    }

    // Actualización de la Mascota Foco y Globo de Diálogo (Sin emojis, 100% SVG y texto vectorial)
    this._updateFocoMascot(Theme.estado());
  },

  _updateFocoMascot(themeName) {
    const focoTrigger = document.getElementById('focoInteractiveTrigger');
    const bubbleTitle = document.getElementById('focoBubbleTitle');
    const bubbleMsg = document.getElementById('focoBubbleMsg');
    const bubbleIcon = document.getElementById('focoBubbleIcon');

    if (!focoTrigger) return;

    focoTrigger.classList.remove('state-light', 'state-dark', 'state-system');
    focoTrigger.classList.add(`state-${themeName}`);

    if (themeName === 'dark') {
      if (bubbleTitle) bubbleTitle.textContent = 'Modo Nocturno Activo';
      if (bubbleMsg) {
        bubbleMsg.textContent = 'Ambiente nocturno activado. El foco está encendido para iluminar tu espacio de trabajo. Haz clic sobre mí para volver al modo diurno.';
      }
      if (bubbleIcon) {
        bubbleIcon.innerHTML = `
          ${iconHtml("tema.oscuro", { size: 18 })}
        `;
      }
    } else if (themeName === 'system') {
      if (bubbleTitle) bubbleTitle.textContent = 'Modo Sensor Inteligente';
      if (bubbleMsg) {
        bubbleMsg.textContent = 'Sensor automático sincronizado. La iluminación se adapta en tiempo real a las preferencias del sistema operativo de tu dispositivo.';
      }
      if (bubbleIcon) {
        bubbleIcon.innerHTML = `
          ${iconHtml("tema.sistema", { size: 18 })}
        `;
      }
    } else {
      if (bubbleTitle) bubbleTitle.textContent = 'Modo Diurno Activo';
      if (bubbleMsg) {
        bubbleMsg.textContent = 'Ambiente diurno detectado. El foco permanece en reposo para ahorrar energía. Haz clic sobre mí o usa los botones para alternar al modo noche.';
      }
      if (bubbleIcon) {
        bubbleIcon.innerHTML = `
          ${iconHtml("tema.claro", { size: 18 })}
        `;
      }
    }
  },

  triggerSync() {
    const btn = document.getElementById('btnTriggerSync');
    const marca = document.getElementById('syncStatusMark');

    // Sin el puente de Bootstrap no hay nada que sincronizar: antes se
    // resolvia igual y el aviso podia decir "sincronizada" sin hacer nada.
    const restaurador = window.PDI?.Bootstrap?.restaurarDatosLocales;
    if (typeof restaurador !== 'function') {
      window.showToast?.('La sincronización no está disponible en este momento', 'warning');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.style.opacity = '0.7';
      btn.innerHTML = `
        ${iconHtml("accion.actualizar", { size: 15 })}
        <span>Sincronizando...</span>
      `;
    }

    if (marca) {
      marca.className = 'status-mark status-mark--warn';
      marca.innerHTML = `<span class="status-mark-dot" aria-hidden="true"></span><span>Sincronizando BD...</span>`;
    }

    // Sincronización REAL: re-descarga los datasets desde SurrealDB y espera
    // a que termine antes de pintar el resultado.
    Promise.resolve(restaurador()).then(() => {
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.style.opacity = '1';
        btn.innerHTML = `
          ${iconHtml("accion.actualizar", { size: 15 })}
          <span>Sincronizar Ahora</span>
        `;
      }

      const estado = window.PDI?.DB?.estadoActual?.() ?? null;
      this._pintarEstadoBD(estado);
      this._pintarUltimaSync();

      const enLinea = estado === 'ok';
      window.showToast(
        enLinea
          ? 'Base de datos sincronizada exitosamente con el servidor remoto'
          : 'No hay conexión con el servidor remoto; los datos se mantienen ocultos',
        enLinea ? 'success' : 'warning'
      );
    });
  },

  /**
   * Borra la copia de sesión y las cachés de vista de esta pestaña. No toca la
   * sesión ni el tema: eso vive en localStorage y no es caché.
   */
  clearCache() {
    try {
      limpiarSnapshot();
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const clave = sessionStorage.key(i);
        if (clave && clave.startsWith('pdi_')) sessionStorage.removeItem(clave);
      }
    } catch (e) {}

    window.showToast('Caché local limpiada. Refrescando plataforma...', 'warning');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  },

};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.AjustesView = AjustesView;
  window.setTheme = (theme, showToast = false, event = null) => AjustesView.setTheme(theme, false, event);
  window.toggleFocoMode = (event = null) => AjustesView.toggleFocoMode(event);
}
