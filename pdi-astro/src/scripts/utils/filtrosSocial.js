import { normalizarTexto, normalizarDocumento } from './texto.js';

export const ORDEN_SOCIAL = [
  { valor: 'urgencia', etiqueta: 'Urgencia (Alta primero)' },
  { valor: 'fecha', etiqueta: 'Fecha de derivación (reciente)' },
  { valor: 'nombre', etiqueta: 'Nombre (A-Z)' },
];

const PESO_URGENCIA = { Alta: 0, Media: 1, Baja: 2 };

function rango(desde, hasta) {
  const d = String(desde || '').slice(0, 10);
  const h = String(hasta || '').slice(0, 10);
  if (d && h && d > h) return { desde: h, hasta: d };
  return { desde: d, hasta: h };
}

/** Compara una fecha ISO (YYYY-MM-DD...) con un rango inclusivo. */
export function enRangoFecha(fecha, desde, hasta) {
  const f = String(fecha || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
  const r = rango(desde, hasta);
  if (r.desde && f < r.desde) return false;
  if (r.hasta && f > r.hasta) return false;
  return true;
}

/**
 * Filtra casos sociales por texto, DNI, urgencia, sede y rango de derivación.
 * Un caso sin fecha queda fuera cuando hay rango: no se puede demostrar que
 * pertenezca al periodo.
 */
export function filtrarCasosSociales(casos, { q = '', urgencia = 'all', sede = 'all', desde = '', hasta = '' } = {}) {
  const texto = normalizarTexto(q);
  const digitos = normalizarDocumento(q);
  const buscarDni = digitos.length >= 4;
  const hayRango = Boolean(String(desde || '').trim() || String(hasta || '').trim());

  return (Array.isArray(casos) ? casos : []).filter((caso) => {
    if (urgencia !== 'all' && caso.urgencia !== urgencia) return false;
    if (sede !== 'all' && !String(caso.sede || '').includes(sede)) return false;
    if (hayRango && !enRangoFecha(caso.fechaDerivacion, desde, hasta)) return false;
    if (!texto) return true;

    if (buscarDni && normalizarDocumento(caso.dni).includes(digitos)) return true;
    return [caso.usuario, caso.dni, caso.codigo, caso.sede, caso.situacionEncontrada, caso.tipoProblematica]
      .some((valor) => normalizarTexto(valor).includes(texto));
  });
}

/** Ordena una copia: urgencia (Alta primero), fecha reciente o nombre (A-Z). */
export function ordenarCasosSociales(casos, orden = 'urgencia') {
  const lista = [...(Array.isArray(casos) ? casos : [])];
  const porNombre = (a, b) => String(a.usuario || '').localeCompare(String(b.usuario || ''), 'es');

  lista.sort((a, b) => {
    if (orden === 'fecha') {
      return String(b.fechaDerivacion || '').localeCompare(String(a.fechaDerivacion || '')) || porNombre(a, b);
    }
    if (orden === 'nombre') {
      return porNombre(a, b) || String(a._casoId || '').localeCompare(String(b._casoId || ''));
    }
    const pa = PESO_URGENCIA[a.urgencia] ?? 99;
    const pb = PESO_URGENCIA[b.urgencia] ?? 99;
    return pa - pb || porNombre(a, b);
  });

  return lista;
}
