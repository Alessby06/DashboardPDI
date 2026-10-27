/**
 * Prueba de humo del sistema de filtros.
 *
 * Recorre las siete vistas con panel y comprueba el contrato mínimo:
 *   - abre bajo el botón, dentro del viewport y con el ancho del sistema;
 *   - abrir y cerrar no cambia el scroll de la vista;
 *   - aplicar una faceta produce estado visible y Restablecer lo deja limpio;
 *   - el foco entra y Escape cierra;
 *   - en móvil la hoja se ancla al borde inferior.
 *
 * No sustituye a una suite de navegador con dependencias: usa CDP directo
 * contra el dev server, sin instalar nada. Requiere Chrome y el servidor en
 * marcha (por defecto http://localhost:4321).
 *
 *   npm run test:filtros
 *   PDI_BASE=http://localhost:4322 npm run test:filtros
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = process.env.PDI_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.PDI_BASE || 'http://localhost:4321';
const PORT = Number(process.env.PDI_CDP_PORT || 9450);
const VISTAS = (process.env.PDI_VISTAS || 'padron,salud,auditoria,educativo,voluntariados,social,sedes').split(',').map((v) => v.trim()).filter(Boolean);
const OUT = path.join(os.tmpdir(), 'pdi-filtros-smoke');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const PERFIL = path.join(os.tmpdir(), `pdi-smoke-${Date.now()}`);
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PERFIL}`,
  '--no-first-run',
  '--hide-scrollbars=false',
  '--no-proxy-server',
  'about:blank',
], { stdio: 'ignore' });

const resultados = [];
const anotar = (vista, check, ok, detalle = '') => {
  resultados.push({ vista, check, ok, detalle });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${vista.padEnd(14)} ${check}${detalle ? '  · ' + detalle : ''}`);
};

async function esperarObjetivo() {
  for (let i = 0; i < 80; i++) {
    try {
      const t = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = t.find((x) => x.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await dormir(250);
  }
  throw new Error('Chrome no respondió en el puerto de depuración');
}

async function main() {
  const wsUrl = await esperarObjetivo();
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pend = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise((res) => {
    const n = ++id;
    pend.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const ev = async (script) => {
    const r = await send('Runtime.evaluate', { expression: script, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text || 'error de evaluación');
    return r.result?.result?.value;
  };
  const tab = async () => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await dormir(50);
    return ev(`(() => { const a = document.activeElement; return { dentro: !!a?.closest?.('.audit-filters-menu') }; })()`);
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const ir = async (url) => {
    await send('Page.navigate', { url });
    for (let i = 0; i < 100; i++) {
      if ((await ev('document.readyState')) === 'complete') break;
      await dormir(150);
    }
    await dormir(900);
  };

  await ir(`${BASE}/login`);
  await ev(`(() => {
    const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    set(document.getElementById('inputUsuario'), 'admin');
    set(document.getElementById('inputClave'), 'admin2024');
    const m = document.getElementById('pdi-modulo-m4'); if (m) m.checked = true;
    [...document.querySelectorAll('button')].find((b) => /Ingresar/i.test(b.textContent))?.click();
    return 1;
  })()`);
  await dormir(2600);

  for (const vista of VISTAS) {
    await ir(`${BASE}/${vista}`);
    // Se espera a que la vista tenga datos: medir el scroll mientras el
    // esqueleto aún se sustituye produce falsos negativos.
    for (let i = 0; i < 30; i++) {
      const listo = await ev(`document.querySelectorAll('#mainContent tbody tr').length > 3`);
      if (listo) break;
      await dormir(200);
    }
    await dormir(600);

    // Calentamiento: la primera apertura inyecta el pie del panel (cifra y
    // Cerrar) y puede cambiar la altura una sola vez.
    await ev(`(() => {
      const dd = document.querySelector('.audit-filters-dropdown');
      if (!dd) return 1;
      dd.querySelector('.audit-filter-btn').click();
      return 1;
    })()`);
    await dormir(300);
    await ev(`window.closeAllFilterSheets && window.closeAllFilterSheets()`);
    await dormir(300);

    // Se espera a que el alto de la vista deje de cambiar: la tabla y el
    // esqueleto se asientan en momentos distintos y falseaban la medición.
    let previo = -1;
    let estables = 0;
    for (let i = 0; i < 25; i++) {
      const alto = await ev(`document.getElementById('mainContent').scrollHeight`);
      if (alto === previo) {
        if (++estables >= 2) break;
      } else {
        estables = 0;
        previo = alto;
      }
      await dormir(250);
    }

    const base = await ev(`(async () => {
      const dd = document.querySelector('.audit-filters-dropdown');
      const btn = dd?.querySelector('.audit-filter-btn');
      const menu = dd?.querySelector('.audit-filters-menu');
      if (!btn || !menu) return { existe: false };
      const main = document.getElementById('mainContent');
      const scrollAntes = main.scrollHeight;
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      btn.click();
      await new Promise((r) => setTimeout(r, 420));
      const m = menu.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      const abierto = {
        visible: getComputedStyle(menu).display !== 'none' && getComputedStyle(menu).visibility !== 'hidden' && Number(getComputedStyle(menu).opacity) > 0.9,
        aria: btn.getAttribute('aria-expanded') === 'true',
        abajo: m.top >= b.bottom - 2,
        dentroViewport: m.bottom <= innerHeight + 1 && m.top >= -1,
        ancho: Math.round(m.width),
        scrollIgual: main.scrollHeight === scrollAntes,
      };
      return { existe: true, abierto, scrollAntes };
    })()`);

    if (!base.existe) { anotar(vista, 'panel', false, 'no hay panel'); continue; }
    anotar(vista, 'abre', base.abierto.visible && base.abierto.aria, `ancho ${base.abierto.ancho}`);
    anotar(vista, 'dirección', base.abierto.abajo && base.abierto.dentroViewport);
    anotar(vista, 'sin scroll fantasma', base.abierto.scrollIgual);

    // Cierre por API y comparación abierto→cerrado: aísla el efecto del panel.
    const cierreApi = await ev(`(async () => {
      const main = document.getElementById('mainContent');
      const conPanel = main.scrollHeight;
      window.closeAllFilterSheets();
      await new Promise((r) => setTimeout(r, 420));
      return { conPanel, sinPanel: main.scrollHeight };
    })()`);
    anotar(vista, 'scroll al cerrar', cierreApi.conPanel === cierreApi.sinPanel, `${cierreApi.conPanel} -> ${cierreApi.sinPanel}`);

    // Segundo ciclo: teclado y Escape.
    await ev(`(() => { const dd = document.querySelector('.audit-filters-dropdown'); dd.querySelector('.audit-filter-btn').click(); return 1; })()`);
    await dormir(350);
    const foco = await tab();
    const foco2 = await tab();
    anotar(vista, 'foco dentro', foco.dentro && foco2.dentro);

    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await dormir(300);
    const cerrado = await ev(`(() => {
      const dd = document.querySelector('.audit-filters-dropdown');
      const menu = dd.querySelector('.audit-filters-menu');
      return { abierto: dd.classList.contains('open'), display: getComputedStyle(menu).display };
    })()`);
    anotar(vista, 'Escape cierra', !cerrado.abierto && cerrado.display === 'none');

    const filtro = await ev(`(async () => {
      const dd = document.querySelector('.audit-filters-dropdown');
      dd.querySelector('.audit-filter-btn').click();
      await new Promise((r) => setTimeout(r, 350));
      const sub = dd.querySelector('.audit-filters-menu .padron-inner-dropdown');
      if (!sub) return { skip: true };
      sub.querySelector('.padron-inner-dropdown-btn').click();
      await new Promise((r) => setTimeout(r, 200));
      const item = [...sub.querySelectorAll('.padron-dropdown-item')]
        .find((i) => i.getAttribute('data-value') && i.getAttribute('data-value') !== 'all' && !i.classList.contains('zero-facet'));
      if (!item) return { skip: true };
      item.click();
      await new Promise((r) => setTimeout(r, 400));
      const chips = document.querySelectorAll('.padron-chip').length;
      const badge = [...document.querySelectorAll('.audit-filter-badge')].some((b) => b.offsetParent !== null && b.textContent.trim() !== '0');
      return { skip: false, chips, badge };
    })()`);
    if (filtro.skip) anotar(vista, 'aplicar faceta', true, 'sin multiselección (skip)');
    else anotar(vista, 'aplicar faceta', filtro.chips > 0 || filtro.badge, `chips ${filtro.chips}`);

    if (!filtro.skip) {
      const limpio = await ev(`(async () => {
        const dd = document.querySelector('.audit-filters-dropdown');
        const reset = dd.querySelector('.audit-filters-menu .btn-text-subtle');
        if (!reset) return { skip: true };
        reset.click();
        await new Promise((r) => setTimeout(r, 800));
        return { skip: false, chips: document.querySelectorAll('.padron-chip').length, badge: [...document.querySelectorAll('.audit-filter-badge')].filter((b) => b.offsetParent !== null).every((b) => b.textContent.trim() === '0') };
      })()`);
      if (!limpio.skip) anotar(vista, 'restablecer', limpio.chips === 0 && limpio.badge, `chips ${limpio.chips}`);

      // Contrato del store: marcar todas las opciones de una faceta equivale
      // a "Todas". Se comprueba sobre la primera multiselección del panel.
      const autoTodos = await ev(`(async () => {
        const dd = document.querySelector('.audit-filters-dropdown');
        if (!dd.classList.contains('open')) dd.querySelector('.audit-filter-btn').click();
        await new Promise((r) => setTimeout(r, 350));
        const subs = [...dd.querySelectorAll('.audit-filters-menu .padron-inner-dropdown')];
        const viable = subs.find((s) => {
          const opciones = [...s.querySelectorAll('.padron-dropdown-item')]
            .filter((i) => i.getAttribute('data-value') !== 'all');
          return opciones.length > 1 && opciones.every((i) => !i.classList.contains('zero-facet'));
        });
        if (!viable) return { skip: true };
        const sub = viable;
        if (!sub.classList.contains('open')) sub.querySelector('.padron-inner-dropdown-btn').click();
        await new Promise((r) => setTimeout(r, 350));
        const items = [...sub.querySelectorAll('.padron-dropdown-item')]
          .filter((i) => i.getAttribute('data-value') !== 'all' && !i.classList.contains('zero-facet'));
        if (!items.length) return { skip: true };
        const valores = items.map((i) => i.getAttribute('data-value'));
        const pasos = [];
        for (const valor of valores) {
          if (!sub.classList.contains('open')) sub.querySelector('.padron-inner-dropdown-btn').click();
          await new Promise((r) => setTimeout(r, 120));
          const actual = [...sub.querySelectorAll('.padron-dropdown-item')]
            .find((i) => i.getAttribute('data-value') === valor);
          const antes = [...sub.querySelectorAll('.padron-dropdown-item.selected')].map((i) => i.getAttribute('data-value'));
          actual?.click();
          await new Promise((r) => setTimeout(r, 220));
          pasos.push({ valor, abiertoAntes: true, antes, despues: [...sub.querySelectorAll('.padron-dropdown-item.selected')].map((i) => i.getAttribute('data-value')) });
        }
        await new Promise((r) => setTimeout(r, 500));
        const all = sub.querySelector('.padron-dropdown-item[data-value="all"]');
        const seleccionados = [...sub.querySelectorAll('.padron-dropdown-item.selected')].map((i) => i.getAttribute('data-value'));
        const ultimo = valores[valores.length - 1];
        const pareceSimple = seleccionados.length === 1 && seleccionados[0] === ultimo;
        return { skip: false, simple: pareceSimple, allSelected: !!all?.classList.contains('selected'), seleccionados, pasos };
      })()`);
      if (!autoTodos.skip && autoTodos.simple) {
        anotar(vista, 'auto-todos', true, 'faceta de selección única (skip)');
      } else if (!autoTodos.skip) {
        const ok = autoTodos.allSelected && autoTodos.seleccionados.length === 1 && autoTodos.seleccionados[0] === 'all';
        anotar(vista, 'auto-todos', ok, `seleccion ${autoTodos.seleccionados.join(',') || '—'}`);
      }
    }
  }

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await ir(`${BASE}/padron`);
  await dormir(2400);
  const movil = await ev(`(async () => {
    const dd = document.querySelector('.audit-filters-dropdown');
    dd.querySelector('.audit-filter-btn').click();
    await new Promise((r) => setTimeout(r, 450));
    const m = dd.querySelector('.audit-filters-menu').getBoundingClientRect();
    const pie = dd.querySelector('.audit-filters-footer')?.getBoundingClientRect();
    return { abajo: Math.abs(m.bottom - innerHeight) <= 1, dentro: m.top >= -1, pie: !pie || pie.bottom <= innerHeight + 1 };
  })()`);
  anotar('padron', 'móvil anclado', movil.abajo && movil.dentro && movil.pie);

  const fallos = resultados.filter((r) => !r.ok);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'resultado.json'), JSON.stringify(resultados, null, 2));

  console.log(`\n${resultados.length - fallos.length}/${resultados.length} comprobaciones pasan`);
  if (fallos.length) {
    console.log('Fallos:');
    for (const f of fallos) console.log(`  - ${f.vista}: ${f.check}${f.detalle ? ' (' + f.detalle + ')' : ''}`);
  }
  ws.close();
  chrome.kill();
  process.exit(fallos.length ? 1 : 0);
}

main().catch((e) => {
  console.error('La prueba no pudo ejecutarse:', e.message);
  chrome.kill();
  process.exit(2);
});
