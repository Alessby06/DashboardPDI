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
  const porNombre = (a, b) =>
    (a.apellidos || '').localeCompare(b.apellidos || '', 'es')
    || (a.nombres || '').localeCompare(b.nombres || '', 'es');

  res.sort((a, b) => {
    switch (orden) {
      case 'apellido-desc':
        return (b.apellidos || '').localeCompare(a.apellidos || '', 'es') || porNombre(a, b);
      case 'sede-asc':
        return (a.sedeInstitucion || '').localeCompare(b.sedeInstitucion || '', 'es') || porNombre(a, b);
      case 'distrito-asc':
        return (a.distrito || '').localeCompare(b.distrito || '', 'es') || porNombre(a, b);
      case 'tipo-asc':
        return (a.tipoColaborador || '').localeCompare(b.tipoColaborador || '', 'es') || porNombre(a, b);
      case 'apellido-asc':
      default:
        return porNombre(a, b);
    }
  });
  return res;
}

/**
 * Cuenta cada faceta con el resto de filtros aplicados, sin la propia faceta.
 * Devuelve totales y mapas valor→conteo para rol, distrito y programa.
 */
export function contarFacetasColaboradores(lista, filtros = {}) {
  const contar = (items, campo) => items.reduce((acc, c) => {
    const valor = c[campo];
    if (valor) acc[valor] = (acc[valor] || 0) + 1;
    return acc;
  }, {});

  const rolBase = filtrarColaboradores(lista, { ...filtros, rol: '' });
  const distritoBase = filtrarColaboradores(lista, { ...filtros, distrito: '' });
  const estrategiaBase = filtrarColaboradores(lista, { ...filtros, estrategia: '' });

  const porEstrategia = estrategiaBase.reduce((acc, c) => {
    const estrategias = Array.isArray(c.estrategias) ? c.estrategias : [];
    estrategias.forEach((valor) => {
      acc[valor] = (acc[valor] || 0) + 1;
    });
    return acc;
  }, {});

  return {
    total: rolBase.length,
    porRol: contar(rolBase, 'tipoColaborador'),
    totalDistrito: distritoBase.length,
    porDistrito: contar(distritoBase, 'distrito'),
    totalEstrategia: estrategiaBase.length,
    porEstrategia,
  };
}
