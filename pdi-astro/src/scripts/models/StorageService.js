// Servicio de Almacenamiento Local (Persistence Layer)
export const StorageService = {
  getItem(key, defaultValue = null) {
    try {
      if (typeof localStorage === 'undefined') return defaultValue;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error("Error al leer StorageService:", e);
      return defaultValue;
    }
  },
  setItem(key, value) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error al escribir StorageService:", e);
    }
  },
  removeItem(key) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Error al eliminar StorageService:", e);
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.StorageService = StorageService;
}
