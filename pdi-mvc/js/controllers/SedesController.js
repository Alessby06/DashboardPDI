// Controlador: Directorio Territorial de Sedes e Iglesias Aliadas
import { SedeModel } from '../models/SedeModel.js';
import { SedesView } from '../views/SedesView.js';

export const SedesController = {
  init() {
    SedeModel.init();
    const sedes = SedeModel.getAll();
    SedesView.init(sedes);
  },

  handleSearch(query) {
    const sView = window.PDI?.SedesView || SedesView;
    if (sView && sView.filterBySearch) {
      sView.filterBySearch(query);
    }
  },

  clearSearch() {
    const sView = window.PDI?.SedesView || SedesView;
    if (sView && sView.clearSearch) {
      sView.clearSearch();
    }
  },

  handleDistritoFilter(distrito) {
    const sView = window.PDI?.SedesView || SedesView;
    if (sView && sView.filterByDistrito) {
      sView.filterByDistrito(distrito);
    }
  },

  handleServicioFilter(servicio) {
    const sView = window.PDI?.SedesView || SedesView;
    if (sView && sView.filterByServicio) {
      sView.filterByServicio(servicio);
    }
  },

  clearFilters() {
    const input = document.getElementById("inputSedesSearch");
    if (input) input.value = "";
    const sView = window.PDI?.SedesView || SedesView;
    if (sView) {
      sView._searchQuery = "";
      sView._filterDistrito = "all";
      sView._filterServicio = "all";
      sView.render();
      const distChips = document.querySelectorAll(".sedes-chip-distrito");
      distChips.forEach(el => el.classList.toggle("active", el.getAttribute("data-distrito") === "all"));
      const servChips = document.querySelectorAll(".sedes-chip-servicio");
      servChips.forEach(el => el.classList.toggle("active", el.getAttribute("data-servicio") === "all"));
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.SedesController = SedesController;
}
