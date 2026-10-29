import test from "node:test";
import assert from "node:assert/strict";

import { campoUsuario, campoViveCon } from "../src/scripts/core/esquemaCampos.js";

test("el esquema de producción usa persona_id y vive_con_menor", () => {
  assert.equal(campoUsuario(false), "persona_id");
  assert.equal(campoViveCon(false), "vive_con_menor");
});

test("el esquema nuevo usa usuario_id y vive_con_usuario", () => {
  assert.equal(campoUsuario(true), "usuario_id");
  assert.equal(campoViveCon(true), "vive_con_usuario");
});
