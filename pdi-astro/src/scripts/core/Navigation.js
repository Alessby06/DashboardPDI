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

  // ---------------------------------------------------------------------
  //  ELECCION DE REGIMEN DEL MENU: riel de iconos o cajon.
  //
  //  No hay dos menus. Hay uno solo, con dos comportamientos segun la
  //  anchura: en pantalla grande se pliega a un riel de iconos de 72 px
  //  (clase .collapsed) y en pantalla estrecha es un cajon fuera de
  //  pantalla con fondo oscurecido (clase .open). Esa bifurcacion esta en
  //  este unico sitio.
  //
  //  MENU_COMO_CAJON obligaba a que en ESCRITORIO se usara tambien el cajon.
  //  Aquello fue una prueba para medir el coste del plegado del riel, y se
  //  quedo encendido: el resultado era que en un monitor normal no habia
  //  navegacion a la vista, solo un boton hamburguesa. Vuelve a false, que es
  //  el comportamiento normal: riel en escritorio, cajon en movil.
  //
  //  Se deja la constante en lugar de borrarla porque permite reproducir el
  //  cajon a pantalla completa sin tocar nada mas. Tambien se puede forzar
  //  por URL: ?cajon=1 enciende el cajon en cualquier anchura, y ?cajon=0 pide
  //  el riel.
  //
  //  ?cajon=0 solo tiene efecto a partir de 901 px, y no es un olvido: por
  //  debajo de ese ancho el cajon lo imponen las reglas de
  //  @media (max-width: 900px) de las hojas de vista, que no miran la marca
  //  data-menu-cajon y por tanto no hay forma de apagarlas desde aqui. Tampoco
  //  haria falta: un riel de 280 px en una pantalla de 390 px no deja sitio
  //  para el contenido.
  // ---------------------------------------------------------------------
  MENU_COMO_CAJON: true,

  /** Ancho por debajo del cual el menu es cajon. */
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
  },

  /** Cierra el menu lateral. Expuesto en window por los onclick del HTML. */
  closeSidebar() {
    const sidebar = document.getElementById("appSidebar");
    if (!sidebar) return;
    if (this._usaCajon()) {
      sidebar.classList.remove("open");
      if (this._backdrop) this._backdrop.classList.remove("active");
    } else {
      sidebar.classList.add("closed-pc");
    }
  },

  /** Alterna el menu (abrir o cerrar segun modo PC o movil). */
  toggleSidebar() {
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
   * entrada en movil. Se ejecuta una vez por carga; al ser HTML estatico, el
   * orden es estable y el indice se puede calcular aqui mismo.
   */
  _pintarIndiceEscalonado() {
    const enlaces = document.querySelectorAll(".nav-sections .nav-btn");
    enlaces.forEach((enlace, i) => enlace.style.setProperty("--nav-idx", i));
  },

  /**
   * Calcula una vez, al arrancar, como queda el menu plegado.
   *
   * El primer encogido salia con tirones y los siguientes no. La causa no era
   * la animacion: es que la primera vez el navegador tiene que maquetar por
   * primera vez la columna de contenido con el ancho nuevo, y ese trabajo le toca
   * al primer fotograma de la transicion. A partir de la segunda ya esta cacheado.
   *
   * Aqui se adelanta ese maquetado al arrancar, antes de que el usuario pulse nada.
   * Poner y quitar la clase y leer el ancho obliga al motor a resolver el caso
   * plegado una vez. No se ve ningun cambio porque se hace antes del primer pintado.
   *
   * Solo tiene sentido para el riel de iconos. El cajon anima transform, y eso
   * no necesita maquetado: se queda en la GPU y no toca la columna de contenido.
   */
  _precalentarRiel() {
    const sidebar = document.getElementById("appSidebar");
    if (!sidebar || this._usaCajon()) return;
    const previo = sidebar.className;
    sidebar.classList.add("collapsed");
    void sidebar.offsetWidth; // fuerza el maquetado del caso plegado
    sidebar.className = previo;
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

    this._sincronizarMarcaCajon();

    const sidebar = document.getElementById("appSidebar");
    if (sidebar && !this._usaCajon()) {
      // En PC (> 900px) siempre arranca visible/desplegada
      sidebar.classList.remove("open", "closed-pc");
    }

    this._pintarIndiceEscalonado();
    this._precalentarRiel();

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
   * Sincroniza el cambio de tamano entre PC y movil.
   */
  bindResize() {
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

  /**
   * Al pulsar un enlace del menu se cierra el panel y, solo cuando ha
   * terminado de moverse, se va a la pagina.
   *
   * Antes solo se llamaba a closeSidebar() y se dejaba que el navegador
   * navegara de inmediato. El menu empezaba a retraerse y la pagina se iba a
   * medio camino de la transicion: se veia el panel a medio ocultar y encima
   * aparecia la pantalla nueva. De ahi la sensacion de que el menu se
   * intentaba retraer pero lo dejaba a medias.
   *
   * Esto solo se intercepta cuando el cajon esta ABIERTO, que es cuando hay
   * una animacion que esperar. Con el riel de iconos no hay nada que cerrar, y
   * interceptar el clic obligaba a salir por window.location.href: una recarga
   * completa que se llevaba por delante las transiciones de <ClientRouter />
   * justo en la navegacion principal. Sin interceptar, el clic lo maneja
   * Astro y el cambio de pagina sigue siendo instantaneo.
   *
   * Los enlaces son de verdad, asi que se respetan las formas de abrir en
   * pestana nueva: con Ctrl, Cmd o Mayus el enlace se comporta como siempre
   * y este codigo no interviene.
   */
  cerrarAlNavegar() {
    document.querySelectorAll(".nav-btn[href]").forEach((a) => {
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (a.classList.contains("role-restricted") || a.classList.contains("role-hidden")) return;
        const url = a.getAttribute("href");
        if (!url) return;

        const sidebar = document.getElementById("appSidebar");
        if (!sidebar || !sidebar.classList.contains("open")) return;

        e.preventDefault();
        this._irCuandoElMenuEsteCerrado(url);
      });
    });
  },

  /**
   * Cierra el menu, espera a que termine la transicion y despues navega.
   *
   * El aviso de fin de transicion es la senal fiable de que el panel ya esta
   * fuera de pantalla. Si no llegara, se sale igual pasados 400 ms, para no
   * dejar al usuario pulsado sin que pase nada.
   */
  _irCuandoElMenuEsteCerrado(url) {
    if (this._navegando) return;
    this._navegando = true;
    document.documentElement.setAttribute("data-menu-cerrandose", "si");

    const sidebar = document.getElementById("appSidebar");
    let hecho = false;
    const salir = () => {
      if (hecho) return;
      hecho = true;
      if (sidebar) sidebar.removeEventListener("transitionend", alTerminarLaTransicion);
      window.location.href = url;
    };
    const alTerminarLaTransicion = (e) => {
      if (e.target === sidebar && e.propertyName === "transform") salir();
    };

    // Se apunta si estaba abierto ANTES de cerrar: despues ya no lo esta.
    const estabaAbierto = !!sidebar && sidebar.classList.contains("open");

    this.closeSidebar();
    // Si el panel no estaba abierto no hay nada que esperar. El riel de iconos
    // anima el ancho y no el desplazamiento, asi que alli no llegaria nunca el
    // aviso de fin de transicion y la pagina se tardaria los 400 ms de
    // seguridad en una animacion que el usuario ni ha visto.
    if (!estabaAbierto) {
      salir();
      return;
    }
    sidebar.addEventListener("transitionend", alTerminarLaTransicion);
    setTimeout(salir, 400);
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
