import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const db = fs.readFileSync(path.join(import.meta.dirname, '..', 'src/scripts/core/db.js'), 'utf8');

test('la consulta de casos trae el DNI de la persona', () => {
  assert.match(db, /\$\{F_CASO\}\.numero_documento AS p_dni/);
});

test('el caso mapeado expone dni', () => {
  assert.match(db, /dni:\s*c\.p_dni/);
});
