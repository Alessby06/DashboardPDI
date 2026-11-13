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

    const antes = sidebar.getBoundingClientRect();

    sidebar.classList.toggle("closed-pc", !abriendo);
    sidebar.toggleAttribute("inert", !abriendo);
    try {
      localStorage.setItem("pdi_sidebar_pc", abriendo ? "open" : "closed");
    } catch {}
    if (abriendo) {
      document.documentElement.removeAttribute("data-sidebar-pc");
    } else {
      document.documentElement.setAttribute("data-sidebar-pc", "closed");
    }

    // Punto de partida visual actual, ya con el layout nuevo.
    sidebar.style.transition = "none";
    sidebar.style.removeProperty("transform");
    const despues = sidebar.getBoundingClientRect();
    const delta = antes.left - despues.left;

    if (Math.abs(delta) < 1) {
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

    // Un frame con el punto de partida ya pintado evita que el navegador
    // agrupe el cambio y arranque la transicion tarde (se notaba al abrir).
    requestAnimationFrame(() => {
      if (token !== this._rielToken) return;
      sidebar.style.transform = "translate3d(0, 0, 0)";
    });

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
    if (sidebar.classList.contains("closed-pc")) return;
    const previo = sidebar.className;
    sidebar.classList.add("closed-pc");
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
        document.documentElement.removeAttribute("data-sidebar-pc");
      } else {
        // En PC (> 900px) limpiar cualquier clase de drawer movil y restaurar estado persistido
        sidebar.classList.remove("open");
        let guardado = null;
        try { guardado = localStorage.getItem("pdi_sidebar_pc"); } catch {}
        const cerrado = guardado === "closed"
          ? true
          : guardado === "open"
            ? false
            : sidebar.classList.contains("closed-pc");
        sidebar.classList.toggle("closed-pc", cerrado);
        sidebar.toggleAttribute("inert", cerrado);
        if (cerrado) {
          document.documentElement.setAttribute("data-sidebar-pc", "closed");
        } else {
          document.documentElement.removeAttribute("data-sidebar-pc");
        }
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
      if (e.key !== "Escape" || e.defaultPrevented || !this._usaCajon()) return;
      if (document.querySelector(".modal-backdrop.open, .pdi-select.is-open, .cuenta-menu:not([hidden])")) {
        return;
      }
      this.closeSidebar();
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
        const cerrado = sidebar.classList.contains("closed-pc");
        sidebar.toggleAttribute("inert", cerrado);
        if (cerrado) {
          document.documentElement.setAttribute("data-sidebar-pc", "closed");
        } else {
          document.documentElement.removeAttribute("data-sidebar-pc");
        }
      } else {
        sidebar.classList.remove("closed-pc");
        sidebar.toggleAttribute("inert", false);
        document.documentElement.removeAttribute("data-sidebar-pc");
      }
    };
    window.addEventListener("resize", this._onResize);
  },



  bindModalTabs() {
    // El expediente tiene su propio manejador (_enlazarSecciones): mueve el
    // desplazamiento, restaura la seccion desde la URL y navega con el teclado.
    // Aqui solo se enganchan las pestañas de los modales; si se incluyeran las
    // del expediente, el ultimo en arrancar decidiria el comportamiento.
    const fueraDelExpediente = (el) => !el.closest("#view-expediente");

    const botones = Array.from(document.querySelectorAll(".modal-tab-btn"))
      .filter(fueraDelExpediente);
    if (!botones.length) return;

    const paneles = Array.from(document.querySelectorAll(".tab-view-content, .modal-tab-pane"))
      .filter(fueraDelExpediente);

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
  // El <aside> persiste entre páginas, pero Astro lo mueve en el DOM y Lenis
  // vuelve a medirlo: sin esta memoria, el menú reaparece arriba aunque el
  // usuario lo hubiera bajado. Se guarda antes del cambio y se restaura
  // después, sincronizando también el estado interno de Lenis.
  const CLAVE_SCROLL_NAV = "pdi_sidebar_scroll";
  let scrollNavGuardado = 0;
  let temporizadorScrollNav = null;

  const navLateral = () => document.getElementById("sidebarNav");

  const leerScrollNav = () => {
    const nav = navLateral();
    if (nav) scrollNavGuardado = Number(nav.scrollTop) || 0;
    return scrollNavGuardado;
  };

  const persistirScrollNav = () => {
    try {
      sessionStorage.setItem(CLAVE_SCROLL_NAV, String(scrollNavGuardado));
    } catch (e) { /* almacenamiento bloqueado: se conserva en memoria */ }
  };

  const vincularScrollNav = () => {
    const nav = navLateral();
    if (!nav || nav.dataset.pdiScrollGuard === "1") return;
    nav.dataset.pdiScrollGuard = "1";
    nav.addEventListener("scroll", () => {
      leerScrollNav();
      clearTimeout(temporizadorScrollNav);
      temporizadorScrollNav = setTimeout(persistirScrollNav, 150);
    }, { passive: true });
  };

  const restaurarScrollNav = () => {
    const nav = navLateral();
    if (!nav) return;
    if (!scrollNavGuardado) {
      try {
        scrollNavGuardado = Number(sessionStorage.getItem(CLAVE_SCROLL_NAV) || 0);
      } catch (e) {
        scrollNavGuardado = 0;
      }
    }
    if (!scrollNavGuardado || scrollNavGuardado <= 0) return;
    // Si Astro o Lenis conservaron la posición, o el usuario ya movió el
    // menú, no se toca.
    if (nav.scrollTop > 1) return;

    const aplicar = () => {
      if (nav.scrollTop > 1 || !scrollNavGuardado) return;
      // El tope solo se aplica cuando el sidebar ya tiene layout. Durante
      // after-swap puede medir 0 y dejaría la posición en 0 justo antes de
      // la captura de la transición.
      const maxScroll = nav.scrollHeight - nav.clientHeight;
      const destino = maxScroll > 0
        ? Math.min(scrollNavGuardado, maxScroll)
        : scrollNavGuardado;
      // 1) Asignación directa primero. La instantánea de la transición se
      //    toma dentro de `after-swap`; `lenis.scrollTo` aplica en el
      //    fotograma siguiente, así que el menú aparecía arriba y saltaba
      //    después. `scrollTop` deja la posición correcta en esa instantánea.
      try { nav.scrollTop = destino; } catch (e) { /* sin scroll */ }
      // 2) Lenis después, para que su estado interno no devuelva el menú a la
      //    posición anterior en la primera rueda.
      try {
        const pane = window.__pdiPanes?.get(nav);
        if (pane?.lenis) {
          pane.lenis.scrollTo(destino, { immediate: true, force: true });
        }
      } catch (e) { /* sin lenis */ }
    };

    aplicar();
    requestAnimationFrame(aplicar);
    setTimeout(aplicar, 140);
  };

  // --- Dirección del empuje de página -------------------------------
  // El empuje lateral global vive en base.css y solo se activa con
  // data-page-dir. Astro reemplaza todos los atributos de <html> en el swap,
  // así que la dirección se escribe en el documento entrante (before-swap) y
  // se confirma después del intercambio. No se retira hasta que la animación
  // terminó: hacerlo en after-swap dejaría la transición a medias.
  let tokenDirPagina = 0;
  let direccionPaginaPendiente = "";

  const paginaDeRuta = (url) => {
    try {
      const ruta = new URL(url, window.location.href).pathname.replace(/\/+$/, "");
      const ultimo = ruta.split("/").pop();
      return ultimo || "dashboard";
    } catch (e) {
      return "";
    }
  };

  const ordenDePaginas = () => {
    const orden = [];
    document.querySelectorAll(".nav-sections .nav-btn[data-page]:not([data-subview])").forEach((btn) => {
      if (btn.classList.contains("role-restricted")) return;
      if (btn.offsetParent === null) return;
      orden.push(btn.getAttribute("data-page"));
    });
    return orden;
  };

  const prepararDireccionPagina = (evento) => {
    direccionPaginaPendiente = "";
    const destino = paginaDeRuta(evento?.to);
    const actual = document.body?.getAttribute("data-page") || "dashboard";
    const orden = ordenDePaginas();
    const desde = orden.indexOf(actual);
    const hasta = orden.indexOf(destino);
    if (desde < 0 || hasta < 0) return;
    direccionPaginaPendiente = hasta < desde ? "prev" : "next";
  };

  const marcarNuevoDocumento = (evento) => {
    if (!direccionPaginaPendiente) return;
    try {
      evento?.newDocument?.documentElement?.setAttribute("data-page-dir", direccionPaginaPendiente);
    } catch (e) {
      /* Documento sin acceso: se confirma en after-swap. */
    }
  };

  const confirmarDireccionPagina = () => {
    if (!direccionPaginaPendiente) return;
    document.documentElement.dataset.pageDir = direccionPaginaPendiente;
    direccionPaginaPendiente = "";
    const token = ++tokenDirPagina;
    window.setTimeout(() => {
      if (tokenDirPagina !== token) return;
      document.documentElement.removeAttribute("data-page-dir");
    }, 420);
  };

  const refrescarNavegacion = () => {
    document.documentElement.removeAttribute("data-menu-cerrandose");
    // Una transición de subvista cancelada por la navegación no debe dejar la
    // dirección puesta: la página nueva no tiene paneles de Social que empujar.
    document.documentElement.removeAttribute("data-social-dir");
    vincularScrollNav();
    Navigation.actualizarEnlaceActivo();
    restaurarScrollNav();
  };

  document.addEventListener("astro:before-preparation", prepararDireccionPagina);
  document.addEventListener("astro:before-swap", (evento) => {
    marcarNuevoDocumento(evento);
    leerScrollNav();
    persistirScrollNav();
  });
  document.addEventListener("astro:after-swap", confirmarDireccionPagina);
  document.addEventListener("astro:after-swap", refrescarNavegacion);
  document.addEventListener("astro:page-load", refrescarNavegacion);
}
