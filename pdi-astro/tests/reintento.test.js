import test from "node:test";
import assert from "node:assert/strict";

import { conReintentos, esConflictoTransitorio } from "../src/scripts/utils/reintento.js";

test("reintenta un conflicto transitorio y termina bien", async () => {
  let intentos = 0;
  const resultado = await conReintentos(async () => {
    intentos += 1;
    if (intentos < 3) throw new Error("Transaction conflict: Resource busy");
    return "ok";
  }, { intentos: 3, baseMs: 1, maxMs: 2 });

  assert.equal(resultado, "ok");
  assert.equal(intentos, 3);
});

test("no reintenta un error que no es transitorio", async () => {
  let intentos = 0;
  await assert.rejects(
    () => conReintentos(async () => {
      intentos += 1;
      throw new Error("Found field 'vive_con_usuario', but no such field exists");
    }, { intentos: 3, baseMs: 1, maxMs: 2 }),
    /Found field/,
  );
  assert.equal(intentos, 1);
});

test("agota los intentos y propaga el último error", async () => {
  let intentos = 0;
  await assert.rejects(
    () => conReintentos(async () => {
      intentos += 1;
      throw new Error("Transaction conflict: Resource busy");
    }, { intentos: 2, baseMs: 1, maxMs: 2 }),
    /Transaction conflict/,
  );
  assert.equal(intentos, 2);
});

test("reconoce los mensajes transitorios de SurrealDB", () => {
  assert.equal(esConflictoTransitorio(new Error("Transaction conflict: Resource busy")), true);
  assert.equal(esConflictoTransitorio(new Error("The query timed out")), false);
  assert.equal(esConflictoTransitorio(new Error("Found field 'x'")), false);
});
