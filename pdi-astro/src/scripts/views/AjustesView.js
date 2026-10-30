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

export const AjustesView = {
  init() {
    // El tema ya quedo restaurado por Theme.cargar() dentro de arrancarComun(),
    // que corre en todas las paginas. Aqui solo queda su parte propia.
    this.bindThemeButtons();
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
  },

  _loadTheme() {
    Theme.cargar();
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
    const badge = document.getElementById('syncStatusBadge');
    const timeLabel = document.getElementById('labelLastSyncTime');

    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.innerHTML = `
        ${iconHtml("accion.actualizar", { size: 15 })}
        <span>Sincronizando...</span>
      `;
    }

    if (badge) {
      badge.className = 'badge badge-yellow';
      badge.innerHTML = `<span class="status-dot yellow"></span> Sincronizando BD...`;
    }

    // Sincronización REAL: re-descarga los datasets desde SurrealDB.
    // Antes era un setTimeout decorativo que no tocaba la base de datos.
    const restaurador = window.PDI?.Bootstrap?.restaurarDatosLocales
      ?? (() => Promise.resolve());
    Promise.resolve(restaurador()).then(() => {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = `
          ${iconHtml("accion.actualizar", { size: 15 })}
          <span>Sincronizar Ahora</span>
        `;
      }

      const enLinea = window.PDI?.DB?.estadoActual?.() === 'ok';
      if (badge) {
        if (enLinea) {
          badge.className = 'badge badge-green';
          badge.innerHTML = `<span class="status-dot green"></span> En Línea`;
        } else {
          badge.className = 'badge badge-red';
          badge.innerHTML = `<span class="status-dot red"></span> Sin Conexión`;
        }
      }

      const now = new Date();
      const timeStr = `Hoy a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (timeLabel) timeLabel.textContent = timeStr;

      window.showToast(
        enLinea
          ? 'Base de datos sincronizada exitosamente con el servidor remoto'
          : 'No hay conexión con el servidor remoto; los datos se mantienen ocultos',
        enLinea ? 'success' : 'warning'
      );
    });
  },

  toggleAlertSetting(key, enabled) {
    localStorage.setItem(`pdi_alert_${key}`, enabled ? 'true' : 'false');
    window.showToast(`Preferencia de alertas actualizada (${enabled ? 'activado' : 'desactivado'})`, 'info');
  },

  clearCache() {
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
  window.triggerSync = () => AjustesView.triggerSync();
  window.clearCache = () => AjustesView.clearCache();
}
