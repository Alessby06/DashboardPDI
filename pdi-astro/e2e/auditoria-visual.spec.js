// ===========================================================================
//  AUDITORÍA VISUAL — desplegables, textos y parpadeos
// ===========================================================================
//  Qué protege este recorrido, en el orden en que se ejecuta:
//
//   1. Ninguna pantalla deja restos de carga ni textos imposibles
//      (`undefined`, `NaN`, "Cargando…") una vez asentada.
//   2. Un desplegable de la misma familia se ve y se comporta igual en todas
//      las pantallas: misma geometría, mismo hueco contra el disparador, mismo
//      aspecto de las opciones y misma tipografía. También comprueba que el
//      menú no se sale del viewport ni queda recortado por un ancestro.
//   3. Cambiar de sección no produce ni un solo cuadro en el que el contenido
//      y el esqueleto estén ocultos a la vez (eso es el parpadeo), ni pierde
//      la identidad de la barra superior o del menú lateral.
//
//  Los dos primeros bloques son deterministas: fallan solo con una diferencia
//  real. El tercero mide cuadro a cuadro y guarda la evidencia en
//  `auditoria-visual/evidencia/`.
//
//  Uso:
//    npx playwright test --config=playwright.audit.config.js
//    $env:PLAYWRIGHT_BASE_URL='http://localhost:4321'   # contra astro dev
//
//  Las capturas y los JSON de cada corrida quedan en `auditoria-visual/`.
// ===========================================================================

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { cuentas } from './env.js';
import { entrar } from './helpers.js';

const RAIZ = process.cwd();
const SALIDA = path.join(RAIZ, 'auditoria-visual');
const EVIDENCIA = path.join(SALIDA, 'evidencia');
const CORRIDA = new Date().toISOString().replace(/[:.]/g, '-');
const ANCHO_ESCRITORIO = 1440;

/** Pantallas que no aparecen en el menú pero forman parte del producto. */
const RUTAS_EXTRA = ['/perfil', '/ajustes'];

const problemas = [];

function anotar(bloque, mensaje) {
  problemas.push(`[${bloque}] ${mensaje}`);
}

function guardarJson(nombre, datos) {
  fs.mkdirSync(EVIDENCIA, { recursive: true });
  const destino = path.join(EVIDENCIA, `${CORRIDA}-${nombre}.json`);
  fs.writeFileSync(destino, JSON.stringify(datos, null, 2), 'utf8');
  return destino;
}

function captura(page, nombre) {
  fs.mkdirSync(EVIDENCIA, { recursive: true });
  return page.screenshot({
    path: path.join(EVIDENCIA, `${CORRIDA}-${nombre}.png`),
    fullPage: true,
    animations: 'disabled',
  });
}

/** Espera a que la capa de datos haya hidratado en esta sesión. */
async function esperarDatos(page) {
  await page.waitForFunction(
    () => window.PDI?.DB?.estadoActual?.() === 'ok',
    null,
    { timeout: 30_000 },
  );
}

/** Espera a que la vista esté pintada y el esqueleto retirado. */
async function esperarAsentado(page) {
  await page.waitForFunction(() => {
    const contenido = document.querySelector('#pdiViewContent');
    if (!contenido) return false;
    const estilo = getComputedStyle(contenido);
    const visible = estilo.display !== 'none'
      && estilo.visibility !== 'hidden'
      && Number(estilo.opacity) > 0.9;
    const esqueleto = document.querySelector('#pdiSkeleton');
    const estiloEsqueleto = esqueleto ? getComputedStyle(esqueleto) : null;
    const esqueletoVisible = !!estiloEsqueleto
      && estiloEsqueleto.display !== 'none'
      && Number(estiloEsqueleto.opacity) > 0.05;
    return visible && !esqueletoVisible;
  }, null, { timeout: 30_000 });
  // Deja terminar transiciones cortas (fundidos y desplazamientos de 120-200 ms).
  await page.waitForTimeout(300);
}

async function irA(page, ruta, bloque = 'pantallas') {
  // La app navega en cliente con PDI.navigate. Algunas rutas hacen carga
  // completa: en ese caso PDI tarda en volver y hay que esperarlo, no asumirlo.
  const puedeNavegar = await page.evaluate(() => typeof window.PDI?.navigate === 'function');
  if (puedeNavegar) {
    await page.evaluate((destino) => window.PDI.navigate(destino), ruta);
  } else {
    await page.goto(ruta, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForURL((url) => url.pathname === ruta, { timeout: 20_000 });
  await esperarAsentado(page);

  const hayBootstrap = await page
    .waitForFunction(() => typeof window.PDI?.navigate === 'function', null, { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (!hayBootstrap) anotar(bloque, `${ruta}: la página no expone window.PDI.navigate`);
  return hayBootstrap;
}

/** Rutas del menú lateral más las que no salen en él. */
async function rutasDelMenu(page) {
  const rutas = await page.evaluate(() => {
    const enlaces = [...document.querySelectorAll('#sidebarNav a[href^="/"]')];
    return enlaces
      .map((a) => a.getAttribute('href').split('?')[0])
      .filter((href) => href && href !== '/');
  });
  return [...new Set([...rutas, ...RUTAS_EXTRA])];
}

async function abrirSesion(page) {
  await entrar(page, cuentas().coord);
  await esperarDatos(page);
}

// ---------------------------------------------------------------------------
//  1. Restos de carga y textos imposibles
// ---------------------------------------------------------------------------

test('las pantallas asientan sin restos de carga ni textos imposibles', async ({ page }) => {
  const errores = [];
  page.on('pageerror', (error) => errores.push(`pageerror: ${error.message}`));
  page.on('console', (mensaje) => {
    if (mensaje.type() === 'error') errores.push(`console: ${mensaje.text()}`);
  });

  await page.setViewportSize({ width: ANCHO_ESCRITORIO, height: 900 });
  await abrirSesion(page);
  const rutas = await rutasDelMenu(page);
  expect(rutas.length, 'El menú lateral no expuso ninguna ruta.').toBeGreaterThan(3);

  const informe = [];

  for (const ruta of rutas) {
    const fallos = [];
    try {
      await irA(page, ruta);

      const estado = await page.evaluate(() => {
        const contenido = document.querySelector('#pdiViewContent');
        const texto = (contenido?.innerText || '').replace(/\u00a0/g, ' ');
        const esqueleto = document.querySelector('#pdiSkeleton');
        const estiloEsqueleto = esqueleto ? getComputedStyle(esqueleto) : null;
        return {
          hayContenido: !!contenido,
          alto: contenido?.getBoundingClientRect().height || 0,
          texto,
          esqueletoVisible: !!estiloEsqueleto
            && estiloEsqueleto.display !== 'none'
            && Number(estiloEsqueleto.opacity) > 0.05,
        };
      });

      if (!estado.hayContenido) fallos.push('no hay #pdiViewContent');
      if (estado.alto < 80) fallos.push(`contenido con ${Math.round(estado.alto)}px de alto`);
      if (estado.esqueletoVisible) fallos.push('el esqueleto sigue visible tras asentar');

      const restos = [];
      if (/\bundefined\b/.test(estado.texto)) restos.push('undefined');
      if (/\bNaN\b/.test(estado.texto)) restos.push('NaN');
      if (/\bnull\b/.test(estado.texto)) restos.push('null');
      if (/Cargando\s+[a-záéíóú]/i.test(estado.texto)) restos.push('Cargando…');
      if (/^\s*…\s*$/m.test(estado.texto)) restos.push('… suelto');
      if (restos.length) fallos.push(`textos imposibles: ${restos.join(', ')}`);

      if (estado.alto > 0) await captura(page, `pantalla${ruta.replace(/\//g, '-') || '-inicio'}-1440`);

      informe.push({ ruta, alto: Math.round(estado.alto), fallos });
      for (const fallo of fallos) anotar('pantallas', `${ruta}: ${fallo}`);
    } catch (error) {
      fallos.push(error.message.split('\n')[0]);
      informe.push({ ruta, error: error.message.split('\n')[0] });
      anotar('pantallas', `${ruta}: no se pudo recorrer (${error.message.split('\n')[0]})`);
    }
  }

  // Un ancho de móvil para la pantalla con más controles.
  await irA(page, '/padron');
  await page.setViewportSize({ width: 390, height: 844 });
  await esperarAsentado(page);
  await captura(page, 'padron-390');
  await page.setViewportSize({ width: ANCHO_ESCRITORIO, height: 900 });

  const destino = guardarJson('pantallas', { corrida: CORRIDA, rutas: informe });
  await test.info().attach('pantallas.json', { path: destino, contentType: 'application/json' });

  expect(errores, `Errores de consola o de página:\n${errores.join('\n')}`).toEqual([]);
  expect(
    informe.filter((fila) => fila.fallos?.length),
    `Pantallas con restos de carga:\n${JSON.stringify(informe.filter((f) => f.fallos?.length), null, 2)}`,
  ).toEqual([]);
});

// ---------------------------------------------------------------------------
//  2. Desplegables: comportamiento y aspecto comparable
// ---------------------------------------------------------------------------

/**
 * Mide un desplegable ya abierto. Devuelve geometría, tokens visuales y la
 * relación con su disparador. Todo en coordenadas de viewport.
 */
function medirDesplegableEnPagina(id) {
  const contenedor = document.getElementById(id);
  if (!contenedor) return null;
  const disparador = contenedor.querySelector('button');
  const menu = contenedor.querySelector('.custom-dropdown-menu');
  if (!disparador || !menu) return null;

  const caja = (nodo) => {
    const b = nodo.getBoundingClientRect();
    return {
      x: Math.round(b.x * 10) / 10,
      y: Math.round(b.y * 10) / 10,
      ancho: Math.round(b.width * 10) / 10,
      alto: Math.round(b.height * 10) / 10,
      derecha: Math.round(b.right * 10) / 10,
      abajo: Math.round(b.bottom * 10) / 10,
    };
  };
  const tokens = (nodo) => {
    const e = getComputedStyle(nodo);
    return {
      fondo: e.backgroundColor,
      texto: e.color,
      borde: `${e.borderTopWidth} ${e.borderTopColor}`,
      radio: e.borderTopLeftRadius,
      sombra: e.boxShadow,
      relleno: e.padding,
      fuente: `${e.fontFamily.split(',')[0]} ${e.fontSize} / ${e.lineHeight} ${e.fontWeight}`,
      posicion: e.position,
      zIndex: e.zIndex,
    };
  };

  const cajaDisparador = caja(disparador);
  const cajaMenu = caja(menu);
  const estiloMenu = getComputedStyle(menu);
  const tokensMenu = tokens(menu);

  const opciones = [...menu.querySelectorAll('button')]
    .filter((b) => !b.classList.contains('btn-close-sheet'));
  // Se compara el estado base de la opción (no seleccionada) para no confundir
  // "esta opción está marcada" con "aquí las opciones se pintan distinto".
  const conEstado = opciones.filter((b) => b.hasAttribute('aria-selected'));
  const seleccionada = conEstado.find((b) => b.getAttribute('aria-selected') === 'true') || null;
  const noSeleccionada = conEstado.find((b) => b.getAttribute('aria-selected') !== 'true') || null;
  const referencia = noSeleccionada || seleccionada || opciones[0] || null;
  const primeraOpcion = referencia ? caja(referencia) : null;
  const tokenOpcion = referencia ? tokens(referencia) : null;
  const tokenSeleccionada = seleccionada ? tokens(seleccionada) : null;

  const esHojaMovil = estiloMenu.position === 'fixed' && window.innerWidth <= 768;

  // Hueco real entre disparador y menú, venga de arriba o de abajo.
  let hueco = null;
  if (esHojaMovil) {
    hueco = 0;
  } else if (cajaMenu.y >= cajaDisparador.abajo - 1) {
    hueco = Math.round((cajaMenu.y - cajaDisparador.abajo) * 10) / 10;
  } else {
    hueco = Math.round((cajaDisparador.y - cajaMenu.abajo) * 10) / 10;
  }

  const alineadoIzquierda = Math.abs(cajaMenu.x - cajaDisparador.x) <= 2;
  const alineadoDerecha = Math.abs(cajaMenu.derecha - cajaDisparador.derecha) <= 2;

  // Un ancestro con overflow recorta el menú si este no vive en el top layer.
  const enTopLayer = menu.matches(':popover-open');
  let recortado = false;
  let recortePor = null;
  if (!enTopLayer && !esHojaMovil && estiloMenu.position !== 'fixed') {
    let nodo = menu.parentElement;
    while (nodo && nodo !== document.body) {
      const e = getComputedStyle(nodo);
      const desborda = /(hidden|clip|auto|scroll)/.test(`${e.overflow} ${e.overflowY}`);
      if (desborda) {
        const b = nodo.getBoundingClientRect();
        if (cajaMenu.abajo > b.bottom + 1 || cajaMenu.y < b.top - 1
          || cajaMenu.derecha > b.right + 1 || cajaMenu.x < b.left - 1) {
          recortado = true;
          recortePor = nodo.id ? `#${nodo.id}` : (nodo.className || nodo.tagName);
          break;
        }
      }
      nodo = nodo.parentElement;
    }
  }

  const caret = contenedor.querySelector('.filter-caret');
  const transformCaret = caret ? getComputedStyle(caret).transform : null;

  return {
    id,
    familia: contenedor.classList.contains('audit-filters-dropdown') ? 'filtros'
      : contenedor.classList.contains('padron-sort-dropdown') ? 'orden' : 'otro',
    abierto: contenedor.classList.contains('open'),
    ariaExpandido: disparador.getAttribute('aria-expanded'),
    disparador: cajaDisparador,
    tokensDisparador: tokens(disparador),
    menu: cajaMenu,
    tokensMenu,
    opciones: {
      cantidad: opciones.length,
      primera: primeraOpcion,
      tokens: tokenOpcion,
      seleccionada: tokenSeleccionada,
    },
    hueco,
    alineadoIzquierda,
    alineadoDerecha,
    dentroViewport: cajaMenu.x >= -1 && cajaMenu.y >= -1
      && cajaMenu.derecha <= window.innerWidth + 1
      && cajaMenu.abajo <= window.innerHeight + 1,
    recortado,
    recortePor,
    esHojaMovil,
    caretRotado: transformCaret && transformCaret !== 'none',
  };
}

/** Compara una lista de valores y devuelve los distinctos con su pantalla. */
function divergenciasDe(muestras, campo, tolerancia = 0) {
  const grupos = new Map();
  for (const m of muestras) {
    const valor = m[campo];
    if (valor === undefined || valor === null) continue;
    const clave = tolerancia
      ? Math.round(Number(valor) / tolerancia) * tolerancia
      : String(valor);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(m.ruta);
  }
  return grupos.size > 1
    ? [...grupos.entries()].map(([valor, rutas]) => ({ valor, rutas }))
    : [];
}

test('los desplegables se comportan y se ven igual en todas las pantallas', async ({ page }) => {
  await page.setViewportSize({ width: ANCHO_ESCRITORIO, height: 900 });
  await abrirSesion(page);
  const rutas = await rutasDelMenu(page);

  const muestras = [];
  const comportamiento = [];

  for (const ruta of rutas) {
    try {
      await irA(page, ruta, 'desplegables');

      const desplegables = await page.evaluate(() => {
        const raiz = document.querySelector('#pdiViewContent') || document.body;
        return [...raiz.querySelectorAll('.custom-dropdown')]
          .filter((el) => el.offsetParent !== null && el.closest('.custom-dropdown') === el)
          .filter((el) => el.querySelector('button') && el.querySelector('.custom-dropdown-menu'))
          .map((el) => el.id)
          .filter(Boolean);
      });

      for (const id of desplegables) {
        const disparador = page.locator(`[id="${id}"] button`).first();
        if (!(await disparador.isVisible().catch(() => false))) continue;

        await disparador.click({ timeout: 5_000 });
        await page.waitForTimeout(350);

        const medida = await page.evaluate(medirDesplegableEnPagina, id);
        if (!medida) continue;
        medida.ruta = ruta;
        muestras.push(medida);

        const avisos = [];
        if (!medida.abierto) avisos.push('la clase .open no aparece al pulsar');
        if (medida.ariaExpandido !== 'true') avisos.push(`aria-expanded="${medida.ariaExpandido}" con el menú abierto`);
        if (medida.opciones.cantidad === 0) avisos.push('el menú no contiene opciones');
        if (!medida.dentroViewport) avisos.push(`el menú se sale del viewport (${JSON.stringify(medida.menu)})`);
        if (medida.recortado) avisos.push(`el menú queda recortado por ${medida.recortePor}`);
        if (medida.hueco !== null && (medida.hueco < -1 || medida.hueco > 12)) {
          avisos.push(`hueco disparador→menú de ${medida.hueco}px`);
        }
        if (!medida.esHojaMovil && !medida.alineadoIzquierda && !medida.alineadoDerecha) {
          avisos.push('el menú no está alineado con el disparador');
        }
        if (!medida.caretRotado) avisos.push('el caret no gira al abrir');

        comportamiento.push({ ruta, id, familia: medida.familia, avisos });
        for (const aviso of avisos) anotar('desplegables', `${ruta} · ${id}: ${aviso}`);

        await captura(page, `desplegable-${ruta.replace(/\//g, '-')}-${id}`);

        // Elegir una opción tiene que mover la selección y la etiqueta. Un menú
        // que abre pero no ordena sigue siendo un control muerto.
        if (medida.familia === 'orden') {
          const elegida = await page.evaluate((identificador) => {
            const menu = document.getElementById(identificador)?.querySelector('.custom-dropdown-menu');
            const opciones = [...(menu?.querySelectorAll('[role="option"]') || [])];
            const otra = opciones.find((opcion) => opcion.getAttribute('aria-selected') !== 'true');
            if (!otra) return null;
            const texto = otra.textContent.trim();
            otra.click();
            return { texto };
          }, id);

          if (elegida) {
            await page.waitForTimeout(300);
            const despues = await page.evaluate((identificador) => {
              const contenedor = document.getElementById(identificador);
              const menu = contenedor?.querySelector('.custom-dropdown-menu');
              // El padrón dibuja su menú a mano con `padronSortValue`; el resto
              // usa el componente y expone `<id>Value`.
              const etiqueta = contenedor?.querySelector('.padron-sort-value, [id$="Value"]');
              return {
                etiqueta: etiqueta?.textContent?.trim() || '',
                seleccionadas: [...(menu?.querySelectorAll('[role="option"]') || [])]
                  .filter((opcion) => opcion.getAttribute('aria-selected') === 'true')
                  .map((opcion) => opcion.textContent.trim()),
              };
            }, id);

            if (!despues.seleccionadas.includes(elegida.texto)
              || (despues.etiqueta && despues.etiqueta !== elegida.texto)) {
              anotar(
                'desplegables',
                `${ruta} · ${id}: elegir "${elegida.texto}" no actualiza la etiqueta (quedó "${despues.etiqueta}")`,
              );
              comportamiento.push({
                ruta,
                id,
                familia: medida.familia,
                avisos: [`la opción "${elegida.texto}" no se aplica`],
              });
            }
          }
        }

        // Cierre: Escape o clic fuera; si no cierra, es un fallo real.
        await page.keyboard.press('Escape');
        await page.waitForTimeout(120);
        const trasEscape = await page.evaluate((identificador) => {
          const el = document.getElementById(identificador);
          return el?.classList.contains('open') ?? false;
        }, id);
        if (trasEscape) {
          await page.mouse.click(4, 4);
          await page.waitForTimeout(120);
          const trasClic = await page.evaluate((identificador) => {
            const el = document.getElementById(identificador);
            return el?.classList.contains('open') ?? false;
          }, id);
          if (trasClic) {
            anotar('desplegables', `${ruta} · ${id}: no cierra ni con Escape ni con clic fuera`);
            comportamiento.push({ ruta, id, familia: medida.familia, avisos: ['no cierra'] });
          }
        }
      }
    } catch (error) {
      anotar('desplegables', `${ruta}: ${error.message.split('\n')[0]}`);
    }
  }

  expect(
    muestras.length,
    'No se abrió ningún desplegable. ¿Cambió el marcado de FilterPanel/SortMenu?',
  ).toBeGreaterThan(4);

  const porFamilia = {};
  for (const familia of ['filtros', 'orden']) {
    const grupo = muestras.filter((m) => m.familia === familia);
    if (grupo.length < 2) continue;
    porFamilia[familia] = {
      muestras: grupo.length,
      divergencias: {
        altoDisparador: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.disparador.alto })), 'valor', 2),
        rellenoDisparador: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.tokensDisparador.relleno })), 'valor'),
        radioDisparador: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.tokensDisparador.radio })), 'valor'),
        fondoDisparador: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.tokensDisparador.fondo })), 'valor'),
        fuenteDisparador: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.tokensDisparador.fuente })), 'valor'),
        rellenoMenu: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.tokensMenu.relleno })), 'valor'),
        radioMenu: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.tokensMenu.radio })), 'valor'),
        fondoMenu: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.tokensMenu.fondo })), 'valor'),
        sombraMenu: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.tokensMenu.sombra })), 'valor'),
        altoOpcion: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.opciones.primera?.alto })), 'valor', 2),
        fuenteOpcion: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.opciones.tokens?.fuente })), 'valor'),
        fuenteSeleccionada: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.opciones.seleccionada?.fuente })), 'valor'),
        colorSeleccionada: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.opciones.seleccionada?.texto })), 'valor'),
        radioOpcion: divergenciasDe(grupo.map((m) => ({ ...m, valor: m.opciones.tokens?.radio })), 'valor'),
      },
    };
    for (const [campo, lista] of Object.entries(porFamilia[familia].divergencias)) {
      if (lista.length) {
        anotar(
          'desplegables',
          `familia "${familia}" · ${campo} distinto entre pantallas: ${lista.map((d) => `${d.valor} (${d.rutas.join(', ')})`).join(' | ')}`,
        );
      }
    }
  }

  // Tipografía entre familias distintas: se registra como dato, no como fallo.
  // El panel de filtros y el menú de orden son controles diferentes y pueden
  // tener su propia escala; lo que no puede diferir es el mismo control entre
  // pantallas, y eso ya se comprueba arriba por familia.
  const tipografiaEntreFamilias = divergenciasDe(
    muestras.filter((m) => m.opciones.tokens).map((m) => ({ ...m, valor: m.opciones.tokens.fuente })),
    'valor',
  );

  const destino = guardarJson('desplegables', {
    corrida: CORRIDA,
    porFamilia,
    tipografiaEntreFamilias,
    comportamiento,
    muestras,
  });
  await test.info().attach('desplegables.json', { path: destino, contentType: 'application/json' });

  expect(
    comportamiento.filter((c) => c.avisos.length),
    `Desplegables con problemas:\n${JSON.stringify(comportamiento.filter((c) => c.avisos.length), null, 2)}`,
  ).toEqual([]);

  expect(problemas.filter((p) => p.startsWith('[desplegables]')), 'Inconsistencias de desplegables').toEqual([]);
});

// ---------------------------------------------------------------------------
//  3. Parpadeo al cambiar de sección
// ---------------------------------------------------------------------------

/**
 * Instala una sonda que muestrea cada dos cuadros durante 3 s:
 *  - si el contenido y el esqueleto están ocultos a la vez (hueco = parpadeo),
 *  - si el contenido está visible pero vacío (vacío visible),
 *  - si la barra superior o el menú lateral pierden su identidad (remount),
 *  - si el scroll del menú lateral salta,
 *  - CLS y long-animation-frames con atribución.
 */
async function instalarSonda(page) {
  await page.evaluate(() => {
    const t0 = performance.now();
    const sonda = {
      frames: 0,
      maxGap: 0,
      huecos: [],
      vacios: [],
      ambosVisibles: 0,
      saltosSidebar: [],
      cls: 0,
      shifts: [],
      loaf: [],
      marcador: Math.random().toString(36).slice(2),
      contenedorInicial: document.querySelector('#pdiViewContent'),
      _ultimoScroll: null,
      _ultimoCuadro: null,
    };
    window.__sonda = sonda;

    const topbar = document.querySelector('.topbar');
    const sidebar = document.querySelector('#sidebarNav');
    if (topbar) topbar.__marcaAuditoria = sonda.marcador;
    if (sidebar) sidebar.__marcaAuditoria = sonda.marcador;

    try {
      new PerformanceObserver((lista) => {
        for (const entrada of lista.getEntries()) {
          if (entrada.hadRecentInput) continue;
          sonda.cls += entrada.value;
          if (entrada.value > 0.01) {
            const fuente = entrada.sources?.[0]?.node;
            sonda.shifts.push({
              valor: Number(entrada.value.toFixed(4)),
              t: Math.round(entrada.startTime),
              elemento: fuente ? (fuente.id ? `#${fuente.id}` : (fuente.className || fuente.tagName)) : null,
            });
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch { /* el navegador no expone layout-shift */ }

    try {
      new PerformanceObserver((lista) => {
        for (const entrada of lista.getEntries()) {
          if (entrada.duration > 50) {
            sonda.loaf.push({
              ms: Math.round(entrada.duration),
              bloqueo: Math.round(entrada.blockingDuration || 0),
              script: entrada.scripts?.[0]?.sourceFunctionName || null,
            });
          }
        }
      }).observe({ type: 'long-animation-frame', buffered: true });
    } catch { /* LoAF no disponible */ }

    const leer = () => {
      const contenido = document.querySelector('#pdiViewContent');
      const esqueleto = document.querySelector('#pdiSkeleton');
      const estado = (nodo) => {
        if (!nodo) return null;
        const e = getComputedStyle(nodo);
        return {
          visible: e.display !== 'none' && e.visibility !== 'hidden' && Number(e.opacity) > 0.05,
          vacio: (nodo.textContent || '').trim().length === 0,
        };
      };
      return { contenido: estado(contenido), esqueleto: estado(esqueleto) };
    };

    const ciclo = (t) => {
      sonda.frames++;
      if (sonda._ultimoCuadro !== null) sonda.maxGap = Math.max(sonda.maxGap, t - sonda._ultimoCuadro);
      sonda._ultimoCuadro = t;

      if (sonda.frames % 2 === 0) {
        const estado = leer();
        const cVisible = !!estado.contenido?.visible;
        const sVisible = !!estado.esqueleto?.visible;
        const reloj = Math.round(t - t0);
        if (!cVisible && !sVisible) sonda.huecos.push(reloj);
        if (cVisible && !sVisible && estado.contenido?.vacio) sonda.vacios.push(reloj);
        if (cVisible && sVisible) sonda.ambosVisibles++;

        const nav = document.querySelector('#sidebarNav');
        if (nav) {
          if (sonda._ultimoScroll !== null && Math.abs(nav.scrollTop - sonda._ultimoScroll) > 4) {
            sonda.saltosSidebar.push({ de: sonda._ultimoScroll, a: nav.scrollTop, t: reloj });
          }
          sonda._ultimoScroll = nav.scrollTop;
        }
      }

      if (t - t0 < 3000) requestAnimationFrame(ciclo);
    };
    requestAnimationFrame(ciclo);

    window.__resultadoSonda = () => {
      const topbarActual = document.querySelector('.topbar');
      const sidebarActual = document.querySelector('#sidebarNav');
      return {
        ...sonda,
        contenedorInicial: undefined,
        _ultimoScroll: undefined,
        _ultimoCuadro: undefined,
        identidadTopbar: !!topbarActual && topbarActual.__marcaAuditoria === sonda.marcador,
        identidadSidebar: !!sidebarActual && sidebarActual.__marcaAuditoria === sonda.marcador,
        contenedorReemplazado: document.querySelector('#pdiViewContent') !== sonda.contenedorInicial,
        cls: Number(sonda.cls.toFixed(4)),
      };
    };
  });
}

test('cambiar de sección no produce parpadeo ni pierde la barra superior', async ({ page }) => {
  const errores = [];
  page.on('pageerror', (error) => errores.push(`pageerror: ${error.message}`));
  page.on('console', (mensaje) => {
    if (mensaje.type() === 'error') errores.push(`console: ${mensaje.text()}`);
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await abrirSesion(page);

  const transiciones = [
    { desde: '/dashboard', hacia: '/padron' },
    { desde: '/padron', hacia: '/salud' },
    { desde: '/salud', hacia: '/auditoria' },
    { desde: '/auditoria', hacia: '/dashboard' },
  ];

  const resultados = [];

  for (const { desde, hacia } of transiciones) {
    await irA(page, desde, 'parpadeo');

    // El menú lateral se desplaza antes de navegar: así se comprueba que la
    // sección nueva no lo devuelve arriba.
    await page.evaluate(() => {
      const nav = document.querySelector('#sidebarNav');
      if (!nav) return;
      const destino = Math.min(120, Math.max(0, nav.scrollHeight - nav.clientHeight));
      const panel = window.__pdiPanes?.get(nav);
      if (panel?.lenis) panel.lenis.scrollTo(destino, { immediate: true, force: true });
      else nav.scrollTop = destino;
    });
    await page.waitForTimeout(250);

    await instalarSonda(page);
    await page.click(`a[href="${hacia}"]`, { timeout: 10_000 });
    await page.waitForURL((url) => url.pathname === hacia, { timeout: 20_000 });
    await esperarAsentado(page);
    await page.waitForTimeout(300);

    const resultado = await page.evaluate(() => window.__resultadoSonda());
    resultado.desde = desde;
    resultado.hacia = hacia;
    resultados.push(resultado);

    if (resultado.huecos.length) {
      anotar('parpadeo', `${desde}→${hacia}: ${resultado.huecos.length} cuadros sin contenido ni esqueleto (ms ${resultado.huecos.slice(0, 8).join(', ')})`);
    }
    if (resultado.vacios.length) {
      anotar('parpadeo', `${desde}→${hacia}: ${resultado.vacios.length} cuadros con contenido visible pero vacío (ms ${resultado.vacios.slice(0, 8).join(', ')})`);
    }
    if (!resultado.identidadTopbar) anotar('parpadeo', `${desde}→${hacia}: la barra superior se reconstruyó`);
    if (!resultado.identidadSidebar) anotar('parpadeo', `${desde}→${hacia}: el menú lateral se reconstruyó`);
    // Reemplazar el contenedor de la vista es lo normal en este producto: lo
    // que no puede pasar es que el cambio deje un cuadro a la vista sin nada.
    // El reemplazo queda en el JSON como dato, no como fallo.
    if (resultado.saltosSidebar.length) {
      anotar('parpadeo', `${desde}→${hacia}: el scroll del menú saltó (${JSON.stringify(resultado.saltosSidebar.slice(0, 3))})`);
    }
    if (resultado.cls >= 0.25) {
      anotar('parpadeo', `${desde}→${hacia}: CLS ${resultado.cls} (${JSON.stringify(resultado.shifts.slice(0, 3))})`);
    }
  }

  const destino = guardarJson('parpadeo', { corrida: CORRIDA, transiciones: resultados });
  await test.info().attach('parpadeo.json', { path: destino, contentType: 'application/json' });

  // Resumen legible por humanos, en la salida de la corrida.
  for (const r of resultados) {
    console.log(
      `[auditoría] ${r.desde}→${r.hacia}: frames=${r.frames} huecos=${r.huecos.length} `
      + `vacíos=${r.vacios.length} topbar=${r.identidadTopbar ? 'estable' : 'REMOUNT'} `
      + `CLS=${r.cls} gapMax=${Math.round(r.maxGap)}ms`,
    );
  }

  expect(errores, `Errores de consola durante la navegación:\n${errores.join('\n')}`).toEqual([]);
  expect(problemas.filter((p) => p.startsWith('[parpadeo]')), 'Parpadeos detectados').toEqual([]);
});

// ---------------------------------------------------------------------------
//  4. Control de la propia sonda
// ---------------------------------------------------------------------------

//  Un "0 huecos" solo significa algo si la sonda es capaz de ver un hueco.
//  Aquí se provoca uno de 200 ms ocultando contenido y esqueleto a la vez.
//  Si este test falla, el resultado del bloque anterior no vale como prueba.

test('la sonda detecta un parpadeo provocado', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrirSesion(page);

  await instalarSonda(page);
  await page.evaluate(() => {
    const contenido = document.querySelector('#pdiViewContent');
    const esqueleto = document.querySelector('#pdiSkeleton');
    const ocultar = (nodo) => nodo?.style.setProperty('visibility', 'hidden', 'important');
    const restaurar = (nodo) => nodo?.style.removeProperty('visibility');
    ocultar(contenido);
    ocultar(esqueleto);
    setTimeout(() => {
      restaurar(contenido);
      restaurar(esqueleto);
    }, 200);
  });

  await page.waitForTimeout(3_400);
  const resultado = await page.evaluate(() => window.__resultadoSonda());
  expect(
    resultado.huecos.length,
    `La sonda no registró el hueco provocado (frames=${resultado.frames}).`,
  ).toBeGreaterThan(0);
});
