// Presupuesto de `!important`.
//
// La deuda de especificidad se paga hoja por hoja. Este test no la resuelve:
// impide que crezca. Cada vez que una hoja baje su número, baja también su
// presupuesto aquí. Una hoja nueva con `!important` falla con tope 0.
//
// El método para bajar una hoja está documentado en DESIGN.md: se comparan
// los estilos computados a 390 y 1440 px, con los estados abiertos y cerrados,
// y solo se retira el `!important` cuyo cambio no altera ninguna medición.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ESTILOS = path.join(AQUI, '..', 'src', 'styles');

const PRESUPUESTO = {
  'base.css': 40,
  'button-motion.css': 1,
  'components.css': 14,
  'custom-select.css': 12,
  'expediente.css': 71,
  'variables.css': 4,
  'views-auditoria.css': 21,
  'views-colaboradores.css': 1,
  'views-comun.css': 99,
  'views-educativo.css': 4,
  'views-evaluacion.css': 3,
  'views-expediente.css': 54,
  'views-filters.css': 2,
  'views-padron.css': 11,
  'views-perfil.css': 1,
  'views-salud.css': 4,
  'views-sedes.css': 60,
  'views-social.css': 31,
  'views-voluntariados.css': 53,
};

const TOPE_TOTAL = 486;

test('el presupuesto de !important solo puede bajar', () => {
  const fallos = [];
  let total = 0;
  for (const archivo of fs.readdirSync(ESTILOS).filter((f) => f.endsWith('.css')).sort()) {
    const css = fs.readFileSync(path.join(ESTILOS, archivo), 'utf8');
    const cuenta = (css.match(/!important/g) || []).length;
    total += cuenta;
    const tope = PRESUPUESTO[archivo] ?? 0;
    if (cuenta > tope) {
      fallos.push(`${archivo}: ${cuenta} > ${tope}`);
    }
  }
  if (total > TOPE_TOTAL) fallos.push(`total: ${total} > ${TOPE_TOTAL}`);

  assert.deepEqual(
    fallos,
    [],
    `El presupuesto de !important no puede crecer. Si redujiste una hoja, baja su tope;\nsi añadiste uno, resuelve la cascada con especificidad o tokens:\n${fallos.join('\n')}`,
  );
});

test('cada hoja con !important figura en el presupuesto', () => {
  const huerfanas = fs
    .readdirSync(ESTILOS)
    .filter((f) => f.endsWith('.css'))
    .filter((f) => {
      const css = fs.readFileSync(path.join(ESTILOS, f), 'utf8');
      return /!important/.test(css) && !(f in PRESUPUESTO);
    });
  assert.deepEqual(huerfanas, [], `Hoja sin presupuesto: ${huerfanas.join(', ')}`);
});
