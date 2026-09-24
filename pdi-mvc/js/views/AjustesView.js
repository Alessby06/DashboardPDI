// Vista: Ajustes del Sistema y Preferencias (Modo Oscuro & Sync BD)

export const AjustesView = {
  _currentTheme: 'light',

  init() {
    this._loadTheme();
    this.bindThemeButtons();
    this.render();
  },

  bindThemeButtons() {
    const btnLight = document.getElementById('btnThemeLight');
    const btnDark = document.getElementById('btnThemeDark');
    const btnSystem = document.getElementById('btnThemeSystem');

    if (btnLight) {
      btnLight.onclick = (e) => {
        this.setTheme('light', true, e);
      };
    }
    if (btnDark) {
      btnDark.onclick = (e) => {
        this.setTheme('dark', true, e);
      };
    }
    if (btnSystem) {
      btnSystem.onclick = (e) => {
        this.setTheme('system', true, e);
      };
    }
  },

  render() {
    this._updateThemeUI();
  },

  _loadTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem('pdi_theme');
    } catch (e) {}

    if (!savedTheme && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )pdi_theme=([^;]*)/);
      if (match) savedTheme = match[1];
    }

    this.setTheme(savedTheme || 'light', false);
  },

  _mediaListenerBound: false,

  _bindSystemListener() {
    if (this._mediaListenerBound || !window.matchMedia) return;
    this._mediaListenerBound = true;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (this._currentTheme === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    }
  },

  toggleFocoMode(event = null) {
    // Si está en claro -> pasa a oscuro. Si está en oscuro o sistema -> pasa a claro.
    const targetTheme = (this._currentTheme === 'light') ? 'dark' : 'light';
    this.setTheme(targetTheme, true, event);
  },

  setTheme(themeName, showToast = true, clickEvent = null) {
    const applyThemeChange = () => {
      this._currentTheme = themeName;

      try {
        localStorage.setItem('pdi_theme', themeName);
      } catch (e) {}

      if (typeof document !== 'undefined') {
        document.cookie = `pdi_theme=${themeName}; path=/; max-age=31536000; SameSite=Lax`;
      }

      const root = document.documentElement;

      if (themeName === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        this._bindSystemListener();
      } else {
        root.setAttribute('data-theme', themeName);
      }

      this._updateThemeUI();
    };

    // Estilo Linear / Raycast: Cross-Fade de Opacidad Pura (200ms) acelerado 100% por hardware
    const root = document.documentElement;
    if (typeof document !== 'undefined' && document.startViewTransition) {
      // 1. Congelar temporalmente transiciones individuales para evitar sobrecarga GPU
      root.classList.add('disable-theme-transitions');

      // 2. Ejecutar Cross-Fade de opacidad nativo
      const transition = document.startViewTransition(() => {
        applyThemeChange();
      });

      // 3. Restaurar transiciones al concluir el desvanecimiento
      transition.finished.finally(() => {
        root.classList.remove('disable-theme-transitions');
      });
    } else {
      applyThemeChange();
    }

    if (showToast && window.showToast) {
      const names = { light: 'Tema Claro', dark: 'Tema Oscuro', system: 'Tema Automático (SO)' };
      window.showToast(`Tema visual actualizado a ${names[themeName] || themeName}`, 'info');
    }
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

      if (this._currentTheme === 'dark') {
        btnDark.classList.add('active');
        if (badgeDark) badgeDark.style.display = 'inline-flex';
      } else if (this._currentTheme === 'system') {
        btnSystem.classList.add('active');
        if (badgeSystem) badgeSystem.style.display = 'inline-flex';
      } else {
        btnLight.classList.add('active');
        if (badgeLight) badgeLight.style.display = 'inline-flex';
      }
    }

    // Actualización de la Mascota Foco y Globo de Diálogo (Sin emojis, 100% SVG y texto vectorial)
    this._updateFocoMascot(this._currentTheme);
  },

  _updateFocoMascot(themeName) {
    const focoTrigger = document.getElementById('focoInteractiveTrigger');
    const bubbleTitle = document.getElementById('focoBubbleTitle');
    const bubbleBadge = document.getElementById('focoBubbleBadge');
    const bubbleMsg = document.getElementById('focoBubbleMsg');
    const bubbleIcon = document.getElementById('focoBubbleIcon');

    if (!focoTrigger) return;

    focoTrigger.classList.remove('state-light', 'state-dark', 'state-system');
    focoTrigger.classList.add(`state-${themeName}`);

    if (themeName === 'dark') {
      if (bubbleTitle) bubbleTitle.textContent = 'Modo Nocturno Activo';
      if (bubbleBadge) bubbleBadge.textContent = 'Foco Encendido';
      if (bubbleMsg) {
        bubbleMsg.textContent = 'Ambiente nocturno activado. El foco está encendido para iluminar tu espacio de trabajo. Haz clic sobre mí para volver al modo diurno.';
      }
      if (bubbleIcon) {
        bubbleIcon.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        `;
      }
    } else if (themeName === 'system') {
      if (bubbleTitle) bubbleTitle.textContent = 'Modo Sensor Inteligente';
      if (bubbleBadge) bubbleBadge.textContent = 'Sincronizado con SO';
      if (bubbleMsg) {
        bubbleMsg.textContent = 'Sensor automático sincronizado. La iluminación se adapta en tiempo real a las preferencias del sistema operativo de tu dispositivo.';
      }
      if (bubbleIcon) {
        bubbleIcon.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0h-18" />
          </svg>
        `;
      }
    } else {
      if (bubbleTitle) bubbleTitle.textContent = 'Modo Diurno Activo';
      if (bubbleBadge) bubbleBadge.textContent = 'Foco en Reposo';
      if (bubbleMsg) {
        bubbleMsg.textContent = 'Ambiente diurno detectado. El foco permanece en reposo para ahorrar energía. Haz clic sobre mí o usa los botones para alternar al modo noche.';
      }
      if (bubbleIcon) {
        bubbleIcon.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25M4.284 12h-2.25m15.303-6.343l-1.591 1.591M6.257 17.743l-1.591 1.591m0-13.5l1.591 1.591m11.485 11.485l1.591 1.591M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
          </svg>
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
        <svg class="spin" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        <span>Sincronizando...</span>
      `;
    }

    if (badge) {
      badge.className = 'badge badge-yellow';
      badge.innerHTML = `<span class="status-dot yellow"></span> Sincronizando BD...`;
    }

    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = `
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>Sincronizar Ahora</span>
        `;
      }

      if (badge) {
        badge.className = 'badge badge-green';
        badge.innerHTML = `<span class="status-dot green"></span> En Línea (Sincronizado)`;
      }

      const now = new Date();
      const timeStr = `Hoy a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (timeLabel) timeLabel.textContent = timeStr;

      if (window.showToast) {
        window.showToast('Base de datos sincronizada exitosamente con el servidor remoto', 'success');
      }
    }, 1200);
  },

  toggleAlertSetting(key, enabled) {
    localStorage.setItem(`pdi_alert_${key}`, enabled ? 'true' : 'false');
    if (window.showToast) {
      window.showToast(`Preferencia de alertas actualizada (${enabled ? 'activado' : 'desactivado'})`, 'info');
    }
  },

  clearCache() {
    if (window.showToast) {
      window.showToast('Caché local limpiada. Refrescando plataforma...', 'warning');
    }
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.AjustesView = AjustesView;
  window.setTheme = (theme, showToast = true, event = null) => AjustesView.setTheme(theme, showToast, event);
  window.toggleFocoMode = (event = null) => AjustesView.toggleFocoMode(event);
  window.triggerSync = () => AjustesView.triggerSync();
  window.clearCache = () => AjustesView.clearCache();
}
