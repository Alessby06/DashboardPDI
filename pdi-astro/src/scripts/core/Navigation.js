// ===========================================================================
//  NAVEGACION - Chrome comun a todas las paginas
// ===========================================================================
import { PageGuard } from "../auth/PageGuard.js";
import { RoleController } from "../controllers/RoleController.js";

export const Navigation = {
  _backdrop: null,
  _onKey: null,
  _onResize: null,
  _onRoleChange: null,
  _onMenuClick: null,
  _onDocClick: null,

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

  /** Sincroniza la clase .active del enlace según la página actual. */
  actualizarEnlaceActivo() {
    const paginaActual = document.body?.getAttribute("data-page");
    if (!paginaActual) return;
    document.querySelectorAll(".nav-sections .nav-btn").forEach((btn) => {
      const page = btn.getAttribute("data-page");
      if (page) {
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
    } else {
      sidebar.classList.add("closed-pc");
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
    } else {
      sidebar.classList.remove("closed-pc");
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
      sidebar.classList.toggle("closed-pc");
    }
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
    if (sidebar && !this._usaCajon()) {
      // En PC (> 900px) limpiar cualquier clase de drawer móvil
      sidebar.classList.remove("open");
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
      if (!this._usaCajon()) {
        sidebar.classList.remove("open");
        if (this._backdrop) this._backdrop.classList.remove("active");
      } else {
        sidebar.classList.remove("closed-pc");
      }
    };
    window.addEventListener("resize", this._onResize);
  },

  /**
   * Selector de rol.
   */
  bindRoleSelector() {
    const oculto = document.getElementById("roleSelector");
    if (oculto) {
      if (this._onRoleChange) oculto.removeEventListener("change", this._onRoleChange);
      this._onRoleChange = (e) => {
        this.seleccionarRol(e.target.value);
      };
      oculto.addEventListener("change", this._onRoleChange);
    }

    const desplegable = document.getElementById("dropdownRoleSelector");
    if (desplegable) {
      if (this._onMenuClick) desplegable.removeEventListener("click", this._onMenuClick);
      this._onMenuClick = (e) => {
        const item = e.target.closest(".custom-dropdown-item");
        if (!item) return;
        e.preventDefault();
        const texto = item.querySelector(".item-text")?.textContent?.trim();
        this.seleccionarRol(item.getAttribute("data-value"), texto);
      };
      desplegable.addEventListener("click", this._onMenuClick);

      if (this._onDocClick) document.removeEventListener("click", this._onDocClick);
      this._onDocClick = (e) => {
        if (!desplegable.contains(e.target)) desplegable.classList.remove("open");
      };
      document.addEventListener("click", this._onDocClick);
    }
  },

  seleccionarRol(rol, titulo = null) {
    if (!rol) return;
    PageGuard.guardarRol(rol);

    const oculto = document.getElementById("roleSelector");
    if (oculto) oculto.value = rol;

    if (titulo) {
      const etiqueta = document.getElementById("labelActiveRole");
      if (etiqueta) etiqueta.textContent = titulo;
    }

    PageGuard.alCambiarRol(rol);
    RoleController.applyRolePermissions(rol, null, false);
    this._cerrarDesplegable();
  },

  _cerrarDesplegable() {
    const desplegable = document.getElementById("dropdownRoleSelector");
    if (desplegable) desplegable.classList.remove("open");
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
    if (this._onRoleChange) document.getElementById("roleSelector")?.removeEventListener("change", this._onRoleChange);
    if (this._onMenuClick) document.getElementById("dropdownRoleSelector")?.removeEventListener("click", this._onMenuClick);
    if (this._onDocClick) document.removeEventListener("click", this._onDocClick);
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
