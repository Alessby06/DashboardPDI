import { normalizarTexto } from './texto.js';

/**
 * Filtra colaboradores ya normalizados: cada elemento debe traer `categoria`
 * calculada por la vista. Por defecto solo muestra activos.
 */
export function filtrarColaboradores(lista, {
  categoria = '',
  q = '',
  distrito = '',
  estrategia = '',
  rol = '',
  incluirInactivos = false,
} = {}) {
  const texto = normalizarTexto(q);

  return (Array.isArray(lista) ? lista : []).filter((c) => {
    if (categoria && c.categoria !== categoria) return false;
    if (!incluirInactivos && c.estado !== 'Activo') return false;
    if (rol && c.tipoColaborador !== rol) return false;
    if (distrito && c.distrito !== distrito) return false;
    if (estrategia && !(Array.isArray(c.estrategias) && c.estrategias.includes(estrategia))) return false;
    if (!texto) return true;

    return [
      c.nombres,
      c.apellidos,
      c.dni,
      c.celular,
      c.telefonoFijo,
      c.sedeInstitucion,
      c.codigo,
      c.codigoModular,
      c.tipoColaborador,
      c.distrito,
      c.observaciones,
      c.email,
    ].some((valor) => normalizarTexto(valor).includes(texto));
  });
}

/** Ordena una copia con los criterios actuales del directorio. */
export function ordenarColaboradores(lista, orden = 'apellido-asc') {
  const res = [...(Array.isArray(lista) ? lista : [])];
  res.sort((a, b) => {
    switch (orden) {
      case 'apellido-desc':
        return (b.apellidos || '').localeCompare(a.apellidos || '');
      case 'sede-asc':
        return (a.sedeInstitucion || '').localeCompare(b.sedeInstitucion || '');
      case 'distrito-asc':
        return (a.distrito || '').localeCompare(b.distrito || '');
      case 'tipo-asc':
        return (a.tipoColaborador || '').localeCompare(b.tipoColaborador || '');
      case 'apellido-asc':
      default:
        return (a.apellidos || '').localeCompare(b.apellidos || '');
    }
  });
  return res;
}
