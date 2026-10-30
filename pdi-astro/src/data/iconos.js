// Registro semántico de iconos. Único punto de entrada para Astro y para las
// plantillas JS: las vistas nunca escriben un <svg> a mano ni conocen los
// nombres de Hugeicons.
//
// El cuerpo de los iconos vive en hugeicons.js, generado desde la versión
// fijada del set. Aquí solo se decide "qué icono representa cada intención".

import { ICONOS, HUGEICONS_VERSION } from './hugeicons.js';

export { ICONOS, HUGEICONS_VERSION };

/** Grosor único de la familia (fase 0: 1.75 en todos los tamaños). */
export const ICON_STROKE = 1.75;

/**
 * Alias por intención. Un mismo icono puede tener varios alias; las vistas
 * usan el alias, no el nombre del set.
 */
export const ALIAS = {
  'nav.panel': 'dashboard-square-01',
  'nav.inicio': 'home-01',
  'nav.usuarios': 'user',
  'nav.grupo': 'user-group',
  'nav.voluntarios': 'user-multiple',
  'nav.desplegar': 'arrow-down-01',
  'nav.ajustes': 'settings-01',
  'nav.salir': 'logout-01',
  'nav.menu': 'menu-01',

  'accion.cerrar': 'cancel-01',
  'accion.confirmar': 'tick-02',
  'accion.agregar': 'add-01',
  'accion.editar': 'pencil-edit-02',
  'accion.eliminar': 'delete-02',
  'accion.buscar': 'search-01',
  'accion.subir': 'upload-01',
  'accion.descargar': 'download-01',
  'accion.actualizar': 'refresh',
  'accion.filtrar': 'filter',
  'accion.ver': 'eye',
  'accion.ocultar': 'eye-off',
  'accion.imprimir': 'printer',
  'accion.abrir': 'arrow-right-01',
  'accion.volver': 'arrow-left-01',
  'accion.exportar': 'download-01',
  'accion.archivar': 'archive-01',
  'accion.foto': 'camera-01',
  'accion.lista': 'list-view',

  'estado.alerta': 'alert-02',
  'estado.error': 'alert-circle',
  'estado.info': 'information-circle',
  'estado.ok': 'checkmark-circle-02',
  'estado.pendiente': 'clock-01',
  'estado.racha': 'fire',

  'tema.claro': 'sun-03',
  'tema.oscuro': 'moon-02',
  'tema.sistema': 'computer',

  'persona.usuario': 'user',
  'persona.grupo': 'user-group',
  'persona.agregar': 'user-add-01',

  'lugar.ubicacion': 'location-01',
  'lugar.mapa': 'maps',
  'lugar.ruta': 'route-01',
  'lugar.gps': 'gps-01',

  'fecha.calendario': 'calendar-03',

  'archivo.documento': 'file-01',
  'archivo.carpeta': 'folder-01',
  'archivo.lista': 'clipboard-list',
  'archivo.bandeja': 'inbox',
  'archivo.libro': 'book-open-01',

  'salud.escudo': 'shield-check',
  'salud.corazon': 'favourite',
  'salud.medico': 'health',

  'educacion.grado': 'mortarboard-01',
  'dinero.banco': 'bank',
  'datos.base': 'database-01',
  'grafico.barras': 'chart-01',
  'grafico.torta': 'pie-chart',
  'comunicacion.llamar': 'call',
  'comunicacion.enviar': 'sent',
  'dispositivo.movil': 'smart-phone-01',
  'trabajo.maletin': 'briefcase-01',
};

// Un alias roto es un error de programación, no un icono vacío en pantalla.
for (const [alias, clave] of Object.entries(ALIAS)) {
  if (!ICONOS[clave]) {
    throw new Error(`[iconos] El alias "${alias}" apunta a un icono inexistente: "${clave}"`);
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapar = (valor) => String(valor).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/**
 * Devuelve el SVG completo como cadena.
 *
 * @param {string} nombre alias semántico ("accion.cerrar") o clave del set
 *                        ("cancel-01").
 * @param {object} [opciones]
 * @param {number|null} [opciones.size=16] px; null deja que el CSS lo dimensione.
 * @param {number} [opciones.stroke=ICON_STROKE] grosor; por defecto sigue el
 *                        token --icon-stroke para poder ajustarlo en un sitio.
 * @param {string} [opciones.className] clases que espera el CSS existente
 *                        (filter-caret, caret, audit-search-icon...).
 * @param {string} [opciones.title] nombre accesible; sin él, decorativo.
 * @param {string} [opciones.style] estilos extra.
 */
export function iconHtml(nombre, opciones = {}) {
  const {
    size = 16,
    stroke = ICON_STROKE,
    className = '',
    title = '',
    style = '',
  } = opciones;

  const clave = ALIAS[nombre] || nombre;
  const cuerpo = ICONOS[clave];
  if (!cuerpo) {
    throw new Error(`[iconos] Icono desconocido: "${nombre}". Añádelo a scripts/generar-hugeicons.mjs y regenera.`);
  }

  // Con el grosor por defecto se usa el token; si alguien pide uno explícito,
  // se respeta sin tocar el token global.
  const grosor = Number(stroke) === ICON_STROKE
    ? `var(--icon-stroke, ${ICON_STROKE})`
    : String(stroke);
  const estilo = [style, `stroke-width:${grosor}`].filter(Boolean).join(';');

  const attrs = [
    'viewBox="0 0 24 24"',
    size ? `width="${escapar(size)}" height="${escapar(size)}"` : '',
    'fill="none"',
    'stroke="currentColor"',
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
    `style="${escapar(estilo)}"`,
    className ? `class="${escapar(className)}"` : '',
    title ? `role="img" aria-label="${escapar(title)}"` : 'aria-hidden="true"',
  ].filter(Boolean).join(' ');

  const titulo = title ? `<title>${escapar(title)}</title>` : '';
  const path = cuerpo.map(([tag, a]) => {
    const atributos = Object.entries(a).map(([k, v]) => `${k}="${escapar(v)}"`).join(' ');
    return `<${tag} ${atributos}></${tag}>`;
  }).join('');

  return `<svg ${attrs}>${titulo}${path}</svg>`;
}

/** Nombres de icono disponibles, para validaciones y tests. */
export const CLAVES = Object.keys(ICONOS);
