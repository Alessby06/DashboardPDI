// ===========================================================================
//  NAVEGACION - Chrome comun a todas las paginas
// ===========================================================================
import { PageGuard } from "../auth/PageGuard.js";

export const Navigation = {
  _backdrop: null,
  _onKey: null,
  _onResize: null,
  _rielTimer: null,
  _rielToken: 0,

  /** Ancho por debajo del cual el menu es cajon (móvil / tablet). */
  ANCHO_CAJON: 900,

  /** El menu solo se comporta como cajon en pantallas pequenas o movil (<= 900px). */
  _usaCajon() {
    return window.innerWidth <= this.ANCHO_CAJON;
  },

  /**
   * Sincroniza la marca data-menu-cajon en <html> solo para pantallas moviles.
   */
  _sincronizarMarcaCajon() {
    if (this._usaCajon()) {
      document.documentElement.setAttribute("data-menu-cajon", "si");
    } else {
      document.documentElement.removeAttribute("data-menu-cajon");
    }
    // Asegurar que nunca quede bloqueado el menú
    document.documentElement.removeAttribute("data-menu-cerrandose");
  },

  /** Sincroniza la clase .active del enlace según la página actual y subvistas. */
  actualizarEnlaceActivo() {
    const paginaActual = document.body?.getAttribute("data-page");
    if (!paginaActual) return;

    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const tabParam = urlParams ? urlParams.get("tab") : null;

    document.querySelectorAll(".nav-sections .nav-btn").forEach((btn) => {
      const page = btn.getAttribute("data-page");
      const subview = btn.getAttribute("data-subview");
      if (!page) return;

      if (paginaActual === "social") {
        if (tabParam === "autorizaciones") {
          btn.classList.toggle("active", subview === "autorizaciones");
        } else if (tabParam === "mis-solicitudes") {
          btn.classList.toggle("active", subview === "mis-solicitudes");
        } else {
          btn.classList.toggle("active", page === "social" && !subview);
        }
      } else {
        btn.classList.toggle("active", page === paginaActual);
      }
    });
  },

  /** Cierra el menu lateral. Expuesto en window por los onclick del HTML. */
  closeSidebar() {
    document.documentElement.removeAttribute("data-menu-cerrandose");
    const sidebar = document.getElementById("appSidebar");
    if (!sidebar) return;
    if (this._usaCajon()) {
      sidebar.classList.remove("open");
      if (this._backdrop) this._backdrop.classList.remove("active");
    } else if (!sidebar.classList.contains("closed-pc")) {
      this._animarRiel(false);
    }
  },

  /** Abre el menu lateral. */
  openSidebar() {
    document.documentElement.removeAttribute("data-menu-cerrandose");
    const sidebar = document.getElementById("appSidebar");
    if (!sidebar) return;
    if (this._usaCajon()) {
      sidebar.classList.add("open");
      if (this._backdrop) this._backdrop.classList.add("active");
    } else if (sidebar.classList.contains("closed-pc")) {
      this._animarRiel(true);
    }
  },

  /** Alterna el menu (abrir o cerrar segun modo PC o movil). */
  toggleSidebar() {
    document.documentElement.removeAttribute("data-menu-cerrandose");
    const sidebar = document.getElementById("appSidebar");
    if (!sidebar) return;
    if (this._usaCajon()) {
      const abierto = sidebar.classList.toggle("open");
      if (this._backdrop) this._backdrop.classList.toggle("active", abierto);
    } else {
      this._animarRiel(sidebar.classList.contains("closed-pc"));
    }
  },

  /**
   * FLIP del riel de escritorio.
   *
   * El layout cambia una sola vez (margen -280 -> 0) y el movimiento se pinta
   * con transform, en el compositor. Antes se animaba margin-left: cada frame
   * obligaba a recalcular el ancho del contenido y a reflowear la tabla.
   * La lectura del rect actual permite revertir a mitad de camino sin saltos.
   */
  _animarRiel(abriendo) {
    const sidebar = document.getElementById("appSidebar");
    if (!sidebar || this._usaCajon()) return;

    const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const antes = sidebar.getBoundingClientRect();

    sidebar.classList.toggle("closed-pc", !abriendo);
    sidebar.toggleAttribute("inert", !abriendo);

    // Punto de partida visual actual, ya con el layout nuevo.
    sidebar.style.transition = "none";
    sidebar.style.removeProperty("transform");
    const despues = sidebar.getBoundingClientRect();
    const delta = antes.left - despues.left;

    if (reducir || Math.abs(delta) < 1) {
      sidebar.style.removeProperty("transition");
      sidebar.style.removeProperty("transform");
      sidebar.style.removeProperty("will-change");
      return;
    }

    const token = ++this._rielToken;
    clearTimeout(this._rielTimer);

    sidebar.style.transform = `translate3d(${delta}px, 0, 0)`;
    void sidebar.offsetWidth;
    sidebar.style.removeProperty("transition");
    sidebar.style.willChange = "transform";
    sidebar.style.transform = "translate3d(0, 0, 0)";

    const limpiar = () => {
      sidebar.removeEventListener("transitionend", limpiar);
      if (token !== this._rielToken) return;
      sidebar.style.removeProperty("transform");
      sidebar.style.removeProperty("transition");
      sidebar.style.removeProperty("will-change");
      clearTimeout(this._rielTimer);
      this._rielTimer = null;
    };

    sidebar.addEventListener("transitionend", limpiar, { once: true });
    this._rielTimer = setTimeout(limpiar, 520);
  },

  /**
   * Aplica el retardo escalonado a cada enlace del menu, para la animacion de
   * entrada en movil.
   */
  _pintarIndiceEscalonado() {
    const enlaces = document.querySelectorAll(".nav-sections .nav-btn");
    enlaces.forEach((enlace, i) => enlace.style.setProperty("--nav-idx", i));
  },

  /**
   * Calcula una vez, al arrancar, como queda el menu plegado.
   */
  _precalentarRiel() {
    const sidebar = document.getElementById("appSidebar");
    if (!sidebar || this._usaCajon()) return;
    const previo = sidebar.className;
    sidebar.classList.add("collapsed");
    void sidebar.offsetWidth;
    sidebar.className = previo;
  },

  /**
   * Enlaza el boton hamburguesa, el fondo oscurecido y la tecla Escape.
   * Utiliza asignación directa de onclick para garantizar idempotencia absoluta
   * y evitar duplicación de listeners entre transiciones de Astro.
   */
  bindSidebar() {
    const toggle = document.getElementById("btnSidebarToggle");
    this._backdrop = document.getElementById("sidebarBackdrop");

    // Limpieza de cualquier bloqueo residual
    document.documentElement.removeAttribute("data-menu-cerrandose");

    this._sincronizarMarcaCajon();
    this.actualizarEnlaceActivo();

    const sidebar = document.getElementById("appSidebar");
    if (sidebar) {
      // La entrada a la pagina limpia cualquier resto de una animacion previa.
      sidebar.style.removeProperty("transform");
      sidebar.style.removeProperty("transition");
      sidebar.style.removeProperty("will-change");

      if (this._usaCajon()) {
        sidebar.classList.remove("closed-pc");
        sidebar.toggleAttribute("inert", false);
      } else {
        // En PC (> 900px) limpiar cualquier clase de drawer movil
        sidebar.classList.remove("open");
        sidebar.toggleAttribute("inert", sidebar.classList.contains("closed-pc"));
      }
    }

    this._pintarIndiceEscalonado();
    this._precalentarRiel();

    // Idempotencia absoluta: asignación de propiedad directa onclick (nunca se duplica)
    if (toggle) {
      toggle.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.toggleSidebar();
      };
    }

    if (this._backdrop) {
      this._backdrop.onclick = (e) => {
        if (e) e.preventDefault();
        this.closeSidebar();
      };
    }

    if (this._onKey) {
      document.removeEventListener("keydown", this._onKey);
    }
    this._onKey = (e) => {
      if (e.key === "Escape") this.closeSidebar();
    };
    document.addEventListener("keydown", this._onKey);

    // Métodos globales para compatibilidad
    window.toggleSidebar = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      this.toggleSidebar();
    };
    window.closeSidebar = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      this.closeSidebar();
    };
  },

  /**
   * Sincroniza el cambio de tamano entre PC y movil.
   */
  bindResize() {
    if (this._onResize) {
      window.removeEventListener("resize", this._onResize);
    }
    this._onResize = () => {
      this._sincronizarMarcaCajon();
      const sidebar = document.getElementById("appSidebar");
      if (!sidebar) return;

      this._rielToken += 1;
      clearTimeout(this._rielTimer);
      sidebar.style.removeProperty("transform");
      sidebar.style.removeProperty("transition");
      sidebar.style.removeProperty("will-change");

      if (!this._usaCajon()) {
        sidebar.classList.remove("open");
        if (this._backdrop) this._backdrop.classList.remove("active");
        sidebar.toggleAttribute("inert", sidebar.classList.contains("closed-pc"));
      } else {
        sidebar.classList.remove("closed-pc");
        sidebar.toggleAttribute("inert", false);
      }
    };
    window.addEventListener("resize", this._onResize);
  },



  bindModalTabs() {
    const botones = document.querySelectorAll(".modal-tab-btn");
    if (!botones.length) return;

    const paneles = document.querySelectorAll(".tab-view-content, .modal-tab-pane");

    const activar = (destino) => {
      botones.forEach((b) => b.classList.remove("active"));
      paneles.forEach((p) => {
        p.classList.remove("active");
        p.style.display = "none";
      });
      if (!destino) return;
      destino.classList.add("active");
      destino.style.display = "block";
    };

    botones.forEach((btn) => {
      btn.onclick = () => activar(document.getElementById(btn.getAttribute("data-tab")));
    });
  },

  /**
   * Al hacer clic en un enlace del menú:
   * Si estamos en móvil y el cajón está abierto, se cierra el cajón
   * y Astro ClientRouter maneja la navegación con fluidez sin bloqueos ni retardos artificiales.
   */
  cerrarAlNavegar() {
    document.querySelectorAll(".nav-sections .nav-btn[href]").forEach((a) => {
      // Si el enlace ya tiene un listener vinculado, no lo volvemos a registrar
      if (a._pdiNavBound) return;
      a._pdiNavBound = true;

      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (a.classList.contains("role-restricted") || a.classList.contains("role-hidden")) return;

        const sidebar = document.getElementById("appSidebar");
        if (this._usaCajon() && sidebar && sidebar.classList.contains("open")) {
          // En móvil cerramos el cajón al navegar
          this.closeSidebar();
        }
      });
    });
  },

  destroy() {
    const toggle = document.getElementById("btnSidebarToggle");
    if (toggle) toggle.onclick = null;
    if (this._backdrop) this._backdrop.onclick = null;
    if (this._onKey) document.removeEventListener("keydown", this._onKey);
    if (this._onResize) window.removeEventListener("resize", this._onResize);
  },
};

// Sincronización continua de la navegación de Astro
if (typeof document !== "undefined") {
  const refrescarNavegacion = () => {
    document.documentElement.removeAttribute("data-menu-cerrandose");
    Navigation.actualizarEnlaceActivo();
  };
  document.addEventListener("astro:after-swap", refrescarNavegacion);
  document.addEventListener("astro:page-load", refrescarNavegacion);
}
