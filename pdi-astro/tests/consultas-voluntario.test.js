import test from "node:test";
import assert from "node:assert/strict";

import { consultaCapacitacion } from "../src/scripts/core/consultasVoluntario.js";

test("taller y canasta viajan en una sola sentencia", () => {
  const ql = consultaCapacitacion({ conCanasta: true, conTematica: true });
  assert.match(ql, /capacitaciones \+= \$tematica/);
  assert.match(ql, /canastas_recibidas \+= 1/);
  assert.equal((ql.match(/UPDATE/g) || []).length, 1);
});

test("solo taller no toca el contador de canastas", () => {
  const ql = consultaCapacitacion({ conCanasta: false, conTematica: true });
  assert.match(ql, /capacitaciones \+= \$tematica/);
  assert.doesNotMatch(ql, /canastas_recibidas/);
});

test("solo canasta no duplica la temática", () => {
  const ql = consultaCapacitacion({ conCanasta: true, conTematica: false });
  assert.match(ql, /canastas_recibidas \+= 1/);
  assert.doesNotMatch(ql, /capacitaciones/);
});

test("sin cambios no genera una escritura vacía", () => {
  assert.equal(consultaCapacitacion({ conCanasta: false, conTematica: false }), "");
});
