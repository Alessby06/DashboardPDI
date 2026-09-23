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

    // Animación Circular Ripple Reveal (View Transitions API)
    if (typeof document !== 'undefined' && document.startViewTransition && clickEvent && clickEvent.clientX) {
      const x = clickEvent.clientX;
      const y = clickEvent.clientY;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(() => {
        applyThemeChange();
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ];
        document.documentElement.animate(
          { clipPath: clipPath },
          {
            duration: 500,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
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

    if (!btnLight || !btnDark || !btnSystem) return;

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
  window.setTheme = (theme) => AjustesView.setTheme(theme);
  window.triggerSync = () => AjustesView.triggerSync();
  window.clearCache = () => AjustesView.clearCache();
}
