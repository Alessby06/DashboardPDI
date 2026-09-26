// Controlador: Padrón y Gestión Operativa de Voluntariados y Personal Comunitario (PDI)
// Asociación Cultural Johannes Gutenberg - Lima Norte

import { VoluntarioModel } from '../models/VoluntarioModel.js';
import { VoluntariadosView } from '../views/VoluntariadosView.js';

export const VoluntariadosController = {
  init() {
    VoluntarioModel.init();
    const list = VoluntarioModel.getAll();
    VoluntariadosView.init(list);
    VoluntariadosView.render();
  },

  handleSearch(query) {
    const vView = window.PDI?.VoluntariadosView || VoluntariadosView;
    if (vView) {
      vView._searchQuery = query.toLowerCase().trim();
      vView.applyFilters();
    }
  },

  clearSearch() {
    const vView = window.PDI?.VoluntariadosView || VoluntariadosView;
    if (vView) {
      vView.clearSearch();
    }
  },

  resetFilters() {
    const vView = window.PDI?.VoluntariadosView || VoluntariadosView;
    if (vView) {
      vView.resetFilters();
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.VoluntariadosController = VoluntariadosController;
}
