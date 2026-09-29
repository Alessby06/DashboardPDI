// ===========================================================================
//  NAVEGACION - Chrome comun a todas las paginas
// ===========================================================================
//  Reúne lo que antes hacia AppController.bindNavigation(), bindSidebar(),
//  bindRoleSelector() y bindModalTabs(). La SPA lo necesitaba porque las nueve
//  vistas vivian en un solo documento y cada una podia aparecer y desaparecer;
//  en la MPA el chrome es identico en todas las paginas, asi que se inicializa
//  una vez por carga desde Bootstrap.
//
//  Dos cosas que la SPA hacia mal y aqui quedan corregidas:
//
//  - La navegacion era con <button> y un enrutador propio. Ahora son enlaces
//    <a href> reales, de modo que funcionan con teclado, admiten abrir en pestana
//    nueva, y el historial del navegador tiene una entrada por pagina. El
//    unico evento que se intercepta es el clic sobre un enlace bloqueado por
//    rol, y ahi el preventDefault es intencional.
//
//  - La cascada escalonada del menu (--nav-idx) se calculaba con un NodeList
//    de botones. Se mantiene, pero ahora el indice se aplica tambien al estado
//    bloqueado, que antes salia sin animacion porque el nodo ya estaba pintado.
import { PageGuard } from "../auth/PageGuard.js";
import { RoleController } from "../controllers/RoleController.js";

export const Navigation = {
  _sidebarToggle: null,
  _backdrop: null,
  _tAnimando: null,

  /** Cierra el menu lateral. Expuesto en window por los onclick del HTML. */
  closeSidebar() {
    const sidebar = document.getElementById("appSidebar");
    if (sidebar) sidebar.classList.remove("open");
    if (this._backdrop) this._backdrop.classList.remove("active");
  },

  /** Alterna el menu. En movil abre y cierra; en PC colapsa a icon rail. */
  toggleSidebar() {
    const sidebar = document.getElementById("appSidebar");
    if (!sidebar) return;
    if (window.innerWidth <= 900) {
      const abierto = sidebar.classList.toggle("open");
      if (this._backdrop) this._backdrop.classList.toggle("active", abierto);
    } else {
      sidebar.classList.toggle("collapsed");
      if (this._backdrop) this._backdrop.classList.remove("active");
      this._marcarAnimando(sidebar);
    }
  },

  /**
   * Promociona el panel durante el encogido y lo degrada al terminar.
   *
   * will-change no puede ponerse siempre en el CSS: el ancho obliga a maquetar,
   * de modo que anunciarlo sin motivo reserva memoria y crea capas que no se
   * usan el resto del tiempo. Aqui se pone solo mientras dura la transicion y
   * se quita al acabar, que es cuando el navegador ya sabe que sigue.
   */
  _marcarAnimando(sidebar) {
    sidebar.classList.add("animando");
    clearTimeout(this._tAnimando);
    this._tAnimando = setTimeout(() => {
      sidebar.classList.remove("animando");
    }, 340);
  },

  /**
   * Aplica el retardo escalonado a cada enlace del menu, para la animacion de
   * entrada en movil. Se ejecuta una vez por carga; al ser HTML estatico, el
   * orden es estable y el indice se puede calcular aqui mismo.
   */
  _pintarIndiceEscalonado() {
    const enlaces = document.querySelectorAll(".nav-sections .nav-btn");
    enlaces.forEach((enlace, i) => enlace.style.setProperty("--nav-idx", i));
  },

  /**
   * Enlaza el boton hamburguesa, el fondo oscurecido y la tecla Escape.
   * A diferencia de la SPA, los escuchadores se desconectan en destroy(): al
   * vivir en documentos distintos nunca se acumulan, pero dejar la puerta
   * abierta para el ciclo de vida evita que vuelva a colarse.
   */
  bindSidebar() {
    const toggle = document.getElementById("btnSidebarToggle");
    this._backdrop = document.getElementById("sidebarBackdrop");

    this._pintarIndiceEscalonado();

    this._onToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleSidebar();
    };
    if (toggle) toggle.addEventListener("click", this._onToggle);

    this._onBackdrop = (e) => {
      e.preventDefault();
      this.closeSidebar();
    };
    if (this._backdrop) this._backdrop.addEventListener("click", this._onBackdrop);

    this._onKey = (e) => {
      if (e.key === "Escape") this.closeSidebar();
    };
    document.addEventListener("keydown", this._onKey);

    // Los onclick del HTML llaman a estas por nombre global.
    window.toggleSidebar = () => this.toggleSidebar();
    window.closeSidebar = () => this.closeSidebar();
  },

  /**
   * Sincroniza el cambio de tamano entre PC y movil. Al vivir en una pagina
   * distinta por carga, el escuchador muere con el documento: no hace falta
   * quitarlo, pero se guarda la referencia por si destroy() se invoca.
   */
  bindResize() {
    this._onResize = () => {
      const sidebar = document.getElementById("appSidebar");
      if (!sidebar) return;
      if (window.innerWidth > 900) {
        sidebar.classList.remove("open");
        if (this._backdrop) this._backdrop.classList.remove("active");
      } else {
        sidebar.classList.remove("collapsed");
      }
    };
    window.addEventListener("resize", this._onResize);
  },

  /**
   * Selector de rol. El cambio ahora pasa por PageGuard, que es quien decide si
   * la pagina en curso sigue siendo accesible; si el rol nuevo pierde el
   * acceso, redirige. La SPA hacia lo mismo pero solo con atencion al boton del
   * menu activo, y se olvidaba de las vistas Cacheadas en el DOM.
   */
  bindRoleSelector() {
    const oculto = document.getElementById("roleSelector");

    if (oculto) {
      this._onRoleChange = (e) => {
        this.seleccionarRol(e.target.value);
      };
      oculto.addEventListener("change", this._onRoleChange);
    }

    // El desplegable real no es un <select>: son divs con data-value. Se
    // delega en el contenedor para no ligar nueve elementos sueltos.
    const desplegable = document.getElementById("dropdownRoleSelector");
    if (desplegable) {
      this._onMenuClick = (e) => {
        const item = e.target.closest(".custom-dropdown-item");
        if (!item) return;
        e.preventDefault();
        const texto = item.querySelector(".item-text")?.textContent?.trim();
        this.seleccionarRol(item.getAttribute("data-value"), texto);
      };
      desplegable.addEventListener("click", this._onMenuClick);

      this._onDocClick = (e) => {
        if (!desplegable.contains(e.target)) desplegable.classList.remove("open");
      };
      document.addEventListener("click", this._onDocClick);
    }
  },

  /**
   * Cambia el rol activo. Punto unico de verdad: lo usan tanto el clic en el
   * desplegable como el onchange del <select> oculto y el onclick de cada item
   * del HTML. Antes esas tres rutas cada una hacia su propio trabajo y era
   * facil que se desincronizaran.
   */
  seleccionarRol(rol, titulo = null) {
    if (!rol) return;

    PageGuard.guardarRol(rol);

    const oculto = document.getElementById("roleSelector");
    if (oculto) oculto.value = rol;

    if (titulo) {
      const etiqueta = document.getElementById("labelActiveRole");
      if (etiqueta) etiqueta.textContent = titulo;
    }

    // El guardian decide si la pagina en curso sigue siendo accesible y
    // bloquea los enlaces del menu que correspondan.
    PageGuard.alCambiarRol(rol);

    // Banner y tooltip del rol.
    RoleController.applyRolePermissions(rol, null, false);

    this._cerrarDesplegable();
  },

  _cerrarDesplegable() {
    const desplegable = document.getElementById("dropdownRoleSelector");
    if (desplegable) desplegable.classList.remove("open");
  },

  /**
   * Pestanas de los modales. Sin cambios respecto a la SPA, salvo que ahora se
   * consulta el DOM una sola vez por carga.
   */
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
      btn.addEventListener("click", () => activar(document.getElementById(btn.getAttribute("data-tab"))));
    });
  },

  /** Cierra el menu al navegar: el enlace ya se va a su pagina. */
  cerrarAlNavegar() {
    document.querySelectorAll(".nav-btn[href]").forEach((a) => {
      a.addEventListener("click", () => this.closeSidebar());
    });
  },

  destroy() {
    if (this._onToggle) document.getElementById("btnSidebarToggle")?.removeEventListener("click", this._onToggle);
    if (this._onBackdrop) this._backdrop?.removeEventListener("click", this._onBackdrop);
    if (this._onKey) document.removeEventListener("keydown", this._onKey);
    if (this._onResize) window.removeEventListener("resize", this._onResize);
    if (this._onRoleChange) document.getElementById("roleSelector")?.removeEventListener("change", this._onRoleChange);
    if (this._onMenuClick) document.getElementById("dropdownRoleSelector")?.removeEventListener("click", this._onMenuClick);
    if (this._onDocClick) document.removeEventListener("click", this._onDocClick);
  },
};
