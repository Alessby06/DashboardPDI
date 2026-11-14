import test from "node:test";
import assert from "node:assert/strict";

// Mock de localStorage y sessionStorage para Node.js
class StorageMock {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

globalThis.localStorage = new StorageMock();
globalThis.sessionStorage = new StorageMock();

import {
  guardarSnapshot,
  leerSnapshot,
  limpiarSnapshot,
  guardarCache,
  leerCache,
  CLAVE_SNAPSHOT,
} from "../src/scripts/core/snapshot.js";

test("snapshot: guarda en almacenamiento persistente y sobrevive a nueva pestaña (sessionStorage vacío)", () => {
  localStorage.clear();
  sessionStorage.clear();

  localStorage.setItem("pdi_usuario_login", "coord_juan");
  localStorage.setItem("pdi_active_role", "coord");
  localStorage.setItem("pdi_usuario_sedes", JSON.stringify(["Comas", "Carabayllo"]));

  const datosClinicos = {
    beneficiarios: [{ id: 1, nombres: "Maria" }],
    sedes: [{ id: 10, nombre: "San Pedro" }],
    casos: [{ id: 20 }],
    voluntarios: [{ id: 30 }],
    asistencia: {},
    retirados: [],
  };

  guardarSnapshot(datosClinicos);

  // Simulamos que el usuario abre una nueva pestaña: sessionStorage está COMPLETAMENTE VACÍO
  sessionStorage.clear();

  const recuperado = leerSnapshot();
  assert.ok(recuperado, "Debe recuperar el snapshot desde localStorage aunque sessionStorage esté vacío");
  assert.equal(recuperado.usuario, "coord_juan");
  assert.equal(recuperado.datos.beneficiarios.length, 1);
  assert.equal(recuperado.datos.sedes.length, 1);
});

test("snapshot: descarta la copia si el usuario activo difiere del que guardó el snapshot", () => {
  localStorage.clear();
  sessionStorage.clear();

  localStorage.setItem("pdi_usuario_login", "coord_juan");
  localStorage.setItem("pdi_active_role", "coord");

  guardarSnapshot({
    beneficiarios: [{ id: 1 }],
    sedes: [{ id: 10 }],
    casos: [],
    voluntarios: [],
  });

  // Cambia el usuario logueado en las marcas
  localStorage.setItem("pdi_usuario_login", "coord_maria");

  const recuperado = leerSnapshot();
  assert.equal(recuperado, null, "Debe descartar el snapshot de otro usuario");
});

test("snapshot: tolera diferencias de mayúsculas/minúsculas en el usuario", () => {
  localStorage.clear();
  sessionStorage.clear();

  localStorage.setItem("pdi_usuario_login", "Admin");
  localStorage.setItem("pdi_active_role", "admin");

  guardarSnapshot({
    beneficiarios: [{ id: 1 }],
    sedes: [{ id: 10 }],
    casos: [],
    voluntarios: [],
  });

  // Al recargar, pdi_usuario_login puede estar en minúsculas
  localStorage.setItem("pdi_usuario_login", "admin");

  const recuperado = leerSnapshot();
  assert.ok(recuperado, "Debe normalizar el usuario a minúsculas sin descartar la copia");
});

test("snapshot: alcance normaliza sedes ordenadas y formato JSON", () => {
  localStorage.clear();
  sessionStorage.clear();

  localStorage.setItem("pdi_usuario_login", "admin");
  localStorage.setItem("pdi_active_role", "admin");
  localStorage.setItem("pdi_usuario_sedes", JSON.stringify(["San Pedro", "La Libertad"]));

  guardarSnapshot({
    beneficiarios: [{ id: 1 }],
    sedes: [{ id: 10 }],
    casos: [],
    voluntarios: [],
  });

  // Si el orden de las sedes llega invertido en la sesión
  localStorage.setItem("pdi_usuario_sedes", JSON.stringify(["La Libertad", "San Pedro"]));

  const recuperado = leerSnapshot();
  assert.ok(recuperado, "El alcance canónico ordenado debe considerar equivalentes las sedes");
});

test("snapshot: limpiarSnapshot borra tanto localStorage como sessionStorage", () => {
  localStorage.clear();
  sessionStorage.clear();

  localStorage.setItem("pdi_usuario_login", "admin");
  localStorage.setItem("pdi_active_role", "admin");

  guardarSnapshot({
    beneficiarios: [{ id: 1 }],
    sedes: [{ id: 10 }],
    casos: [],
    voluntarios: [],
  });

  guardarCache("bitacora", [{ id: "log-1" }]);

  limpiarSnapshot();

  assert.equal(localStorage.getItem(CLAVE_SNAPSHOT), null);
  assert.equal(sessionStorage.getItem(CLAVE_SNAPSHOT), null);
  assert.equal(leerSnapshot(), null);
  assert.equal(leerCache("bitacora"), null);
});
