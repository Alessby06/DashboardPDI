// ===========================================================================
//  TEMA VISUAL
// ===========================================================================
//  Este modulo existe por un motivo de peso. El boton de alternar tema esta
//  en la barra superior, o sea en el chrome de las diez
//  paginas, y para que funcionara el archivo de puentes tenia que importar
//  AjustesView entero: 11 KB en cada pagina para ejecutar tres lineas.
//
//  Lo que hay aqui es exactamente lo que hacia AjustesView (cargar el tema
//  guardado, alternarlo, aplicarlo con o sin transicion) y nada mas. La parte
//  que si es de la pagina de ajustes, que son los tres botones y la mascota de
//  foco, se queda en AjustesView y se avisa desde aqui con
//  window.PDI.AjustesView._updateThemeUI().
//
//  Dos formas de alternar, y no es un descuido que sean distintas:
//  - alternar() la usa el conmutador de la barra superior y lee el atributo
//    data-theme, que es el tema ya resuelto: desde "sistema" pasa al contrario
//    del que dice el sistema operativo.
//  - alternarFoco() la usa la mascota de la pagina de ajustes y lee el tema
//    elegido: desde "sistema" siempre cae a claro. Es lo que decia el
//    comentario original y lo que la gente espera de la mascota.
// ===========================================================================

export const Theme = {
  _currentTheme: (typeof localStorage !== 'undefined' && localStorage.getItem('pdi_theme')) || 'system',
  _mediaListenerBound: false,

  /** Tema elegido, tal cual se guardo: light, dark o system. */
  estado() {
    return this._currentTheme;
  },

  /**
   * Pinta el color de la barra del navegador con el chrome real de la app.
   *
   * Estaba fijo en #000000 en el <head> de todas las paginas mientras la
   * interfaz se pinta clara, asi que en movil se veia una barra negra sobre una
   * pantalla blanca. El script antiflash del <head> lo deja bien en la primera
   * carga; esto lo mantiene bien cuando el tema cambia o cuando el tema es
   * "system" y el sistema cambia por su cuenta. Los valores son --surface-1.
   */
  _pintarColorDeBarra() {
    const metaTema = document.getElementById('metaThemeColor');
    if (!metaTema) return;
    const oscuro = document.documentElement.getAttribute('data-theme') === 'dark';
    metaTema.setAttribute('content', oscuro ? '#181818' : '#ffffff');
  },

  /**
   * Restaura el tema guardado. Se ejecuta en todas las paginas, asi que no
   * pinta ningun boton: en la pagina de ajustes el aviso a
   * AjustesView._updateThemeUI() llega solo si esa vista esta cargada.
   */
  cargar() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem('pdi_theme');
    } catch (e) {}

    if (!savedTheme && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )pdi_theme=([^;]*)/);
      if (match) savedTheme = match[1];
    }

    // Restauro, no cambio: sin transicion. Ver el comentario de setTheme().
    this.setTheme(savedTheme || 'system', false, null, false);
  },

  /** Conmutador de la barra superior: alterna sobre el tema ya resuelto. */
  alternar(event = null) {
    const actual = document.documentElement.getAttribute('data-theme') || 'light';
    const siguiente = actual === 'light' ? 'dark' : 'light';
    this.setTheme(siguiente, true, event);
  },

  /** Mascota de foco: desde claro pasa a oscuro, y desde lo demas a claro. */
  alternarFoco(event = null) {
    const target = (this._currentTheme === 'light') ? 'dark' : 'light';
    this.setTheme(target, true, event);
  },

  /**
   * Aplica un tema.
   *
   * animar distingue dos cosas que antes iban juntas. Cuando el usuario pulsa el
   * conmutador, un fundido de 200 ms hace que el cambio se lea como intencionado.
   * Cuando la pagina arranca y hay que RESTAURAR el tema guardado, ese mismo
   * fundido es un fallo: en la SPA pasaba una sola vez al cargar, pero en la MPA
   * se repetiria en cada navegacion, con un destello en cada clic del menu. Por
   * eso cargar() restaura sin animar, y ademas el script antiflash de <head> ya
   * habia puesto el atributo en el HTML antes de que se pintara nada.
   */
  setTheme(themeName, showToast = true, clickEvent = null, animar = true) {
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
        this._escucharSistema();
      } else {
        root.setAttribute('data-theme', themeName);
      }

      this._pintarColorDeBarra();

      // Solo la pagina de ajustes tiene botones de tema. En las otras nueve el
      // global no existe y el aviso no llega a nadie, que es lo que debe pasar.
      window.PDI?.AjustesView?._updateThemeUI?.();
    };

    // Estilo Linear / Raycast: cross-fade de opacidad pura (200 ms) acelerado
    // por hardware. Solo cuando hay un cambio real pedido por la persona: ver
    // el comentario del parametro animar.
    const root = document.documentElement;
    if (animar && typeof document !== 'undefined' && document.startViewTransition) {
      // 1. Congelar temporalmente transiciones individuales para evitar sobrecarga GPU
      root.classList.add('disable-theme-transitions');

      // 2. Ejecutar cross-fade de opacidad nativo
      const transition = document.startViewTransition(() => {
        applyThemeChange();
      });

      // 3. Restaurar transiciones al concluir el desvanecimiento
      transition.finished
        .catch(() => {
          // Si otra transicion empezo antes de que acabara esta, el navegador la
          // aborta. No es un fallo del tema: el atributo ya quedo aplicado y hay
          // que quitar igualmente la clase de congelacion.
        })
        .finally(() => {
          root.classList.remove('disable-theme-transitions');
        });
    } else {
      applyThemeChange();
    }

    // Sin guarda: window.showToast lo define legacy-globals en todas las
    // paginas. Antes habia un `if (window.showToast)` que nunca se cumplia, y por
    // eso ninguno de los cuatro avisos de AjustesView llegaba a verse.
    if (showToast) {
      const names = { light: 'Tema Claro', dark: 'Tema Oscuro', system: 'Tema Automático (SO)' };
      window.showToast(`Tema visual actualizado a ${names[themeName] || themeName}`, 'info');
    }
  },

  /** Sigue al sistema operativo mientras el tema elegido sea "system". */
  _escucharSistema() {
    if (this._mediaListenerBound || !window.matchMedia) return;
    this._mediaListenerBound = true;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (this._currentTheme === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        this._pintarColorDeBarra();
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    }
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.Theme = Theme;
}
