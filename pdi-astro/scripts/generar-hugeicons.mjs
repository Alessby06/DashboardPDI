// Genera src/data/hugeicons.js desde Hugeicons Free 4.4.0 (MIT).
//
// Uso:  node scripts/generar-hugeicons.mjs
//
// El paquete NO es una dependencia del proyecto: los 59 iconos que usa la app
// se copian aquí, con la versión fijada, y el build no depende de la red.
// Actualizar la familia es volver a ejecutar este script con otra versión.

import fs from 'node:fs/promises';
import path from 'node:path';

const VERSION = '4.4.0';
const BASE = `https://unpkg.com/@hugeicons/core-free-icons@${VERSION}/dist/esm/`;
const SALIDA = path.resolve('src/data/hugeicons.js');

// Catálogo exacto que usa el producto. Si una vista necesita un icono nuevo,
// se añade aquí y se regenera; no se importa nada en tiempo de ejecución.
const ICONOS = [
  'Add01Icon', 'Alert02Icon', 'AlertCircleIcon', 'Archive01Icon', 'ArrowDown01Icon',
  'ArrowLeft01Icon', 'ArrowRight01Icon', 'BankIcon', 'BookOpen01Icon', 'Briefcase01Icon',
  'Calendar03Icon', 'CallIcon', 'Camera01Icon', 'Cancel01Icon', 'Chart01Icon',
  'CheckmarkCircle02Icon', 'ClipboardListIcon', 'Clock01Icon', 'Cursor01Icon',
  'DashboardSquare01Icon', 'Database01Icon', 'Delete02Icon', 'Download01Icon', 'EyeIcon',
  'EyeOffIcon', 'FavouriteIcon', 'File01Icon', 'FilterIcon', 'FireIcon', 'Folder01Icon',
  'Gps01Icon', 'HealthIcon', 'Home01Icon', 'InboxIcon', 'InformationCircleIcon',
  'ListViewIcon', 'Location01Icon', 'Logout01Icon', 'MapsIcon', 'Menu01Icon', 'Moon02Icon',
  'Mortarboard01Icon', 'Mouse01Icon', 'PencilEdit02Icon', 'PieChartIcon', 'PrinterIcon',
  'RefreshIcon', 'Route01Icon', 'Search01Icon', 'SentIcon', 'Settings01Icon',
  'ShieldCheckIcon', 'SmartPhone01Icon', 'Sun03Icon', 'Tick02Icon', 'Upload01Icon',
  'UserAdd01Icon', 'UserGroupIcon', 'UserIcon',
];

/** Cancel01Icon → cancel-01; SmartPhone01Icon → smart-phone-01. */
function claveDe(nombre) {
  return nombre
    .replace(/Icon$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z])(\d)/g, '$1-$2')
    .toLowerCase();
}

/** Quita el peso y el color incrustados: los decide el componente/token. */
function normalizar(data) {
  return data.map(([tag, attrs]) => {
    const limpios = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (['stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'key'].includes(k)) continue;
      limpios[k] = v;
    }
    return [tag, limpios];
  });
}

async function bajar(nombre) {
  const res = await fetch(BASE + nombre + '.js');
  if (!res.ok) throw new Error(`${nombre}: HTTP ${res.status}`);
  const texto = await res.text();
  const m = texto.match(/const\s+\w+\s*=\s*(\[[\s\S]*?\]);\s*export\s*\{/);
  if (!m) throw new Error(`${nombre}: formato inesperado del módulo`);
  // El literal del paquete usa claves sin comillas; es JS válido.
  const data = new Function(`return ${m[1]};`)();
  if (!Array.isArray(data) || !data.length) throw new Error(`${nombre}: icono vacio`);
  return normalizar(data);
}

const entradas = [];
for (const nombre of ICONOS) {
  process.stdout.write(`· ${nombre}\n`);
  entradas.push([claveDe(nombre), await bajar(nombre)]);
}
entradas.sort((a, b) => a[0].localeCompare(b[0]));

const contenido = `// GENERADO por scripts/generar-hugeicons.mjs — no editar a mano.
// Hugeicons Free ${VERSION} · licencia MIT · https://hugeicons.com
// Los paths ya vienen sin stroke/strokeWidth: el grosor lo fija --icon-stroke.

export const HUGEICONS_VERSION = '${VERSION}';

export const ICONOS = ${JSON.stringify(Object.fromEntries(entradas), null, 2)};
`;

await fs.mkdir(path.dirname(SALIDA), { recursive: true });
await fs.writeFile(SALIDA, contenido, 'utf8');
console.log(`\n${entradas.length} iconos escritos en ${path.relative(process.cwd(), SALIDA)}`);
