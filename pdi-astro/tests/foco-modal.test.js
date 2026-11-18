import test from 'node:test';
import assert from 'node:assert/strict';

import { elegirReenganche, moverFocoFueraDeModal } from '../src/scripts/utils/focoModal.js';

function boton({ visible = true, inerte = false, etiqueta = '' } = {}) {
  return {
    etiqueta,
    getClientRects: () => (visible ? [{}] : []),
    closest: (selector) => (inerte && selector === '[inert]' ? {} : null),
    focus(opciones) { this.opcionesFocus = opciones; },
    blur() { this.blurado = true; },
  };
}

test('el reenganche elige el botón visible del usuario, no el primero del DOM', () => {
  const escritorioOculto = boton({ visible: false, etiqueta: 'escritorio' });
  const movilVisible = boton({ visible: true, etiqueta: 'movil' });

  assert.equal(elegirReenganche([escritorioOculto, movilVisible]), movilVisible);
});

test('el reenganche descarta un botón visible dentro de un contenedor inerte', () => {
  const inerte = boton({ visible: true, inerte: true, etiqueta: 'inerte' });
  const valido = boton({ visible: true, etiqueta: 'valido' });

  assert.equal(elegirReenganche([inerte, valido]), valido);
});

test('mover el foco enfoca el destino con preventScroll y blurea el foco residual del modal', () => {
  const anterior = boton({ etiqueta: 'anterior' });
  const destino = boton({ etiqueta: 'destino' });
  const modal = { contains: (elemento) => elemento === anterior };
  const documento = { activeElement: anterior, contains: () => true };

  moverFocoFueraDeModal(documento, modal, destino);

  assert.deepEqual(destino.opcionesFocus, { preventScroll: true });
  assert.equal(anterior.blurado, true);
});

test('si el destino no está conectado, no se enfoca pero el foco residual sale del modal', () => {
  const anterior = boton({ etiqueta: 'anterior' });
  const destino = boton({ etiqueta: 'desconectado' });
  const modal = { contains: (elemento) => elemento === anterior };
  const documento = { activeElement: anterior, contains: () => false };

  moverFocoFueraDeModal(documento, modal, destino);

  assert.equal(destino.opcionesFocus, undefined);
  assert.equal(anterior.blurado, true);
});

test('un destino conectado pero oculto o inerte no recibe el foco', () => {
  const anterior = boton({ etiqueta: 'anterior' });
  const oculto = boton({ visible: false, etiqueta: 'oculto' });
  const inerte = boton({ inerte: true, etiqueta: 'inerte' });
  const modal = { contains: (elemento) => elemento === anterior };
  const documento = { activeElement: anterior, contains: () => true };

  moverFocoFueraDeModal(documento, modal, oculto);
  moverFocoFueraDeModal(documento, modal, inerte);

  assert.equal(oculto.opcionesFocus, undefined);
  assert.equal(inerte.opcionesFocus, undefined);
  assert.equal(anterior.blurado, true);
});
