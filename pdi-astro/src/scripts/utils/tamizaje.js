/** Estado del tamizaje vigente de un beneficiario. */
export function estadoTamizaje(beneficiario, hoy = new Date()) {
  const tams = Array.isArray(beneficiario?.tamizajes) ? beneficiario.tamizajes : [];
  const fechas = tams
    .map((t) => new Date(t?.fecha))
    .filter((f) => !Number.isNaN(f.getTime()));
  if (!fechas.length) return 'sin';

  const ultima = fechas.sort((a, b) => b - a)[0];
  const limite = new Date(hoy);
  limite.setMonth(limite.getMonth() - 6);
  return ultima < limite ? 'vencido' : 'vigente';
}

/** `all` no filtra; `sin` y `vencido` comparan el estado calculado. */
export function coincideTamizaje(beneficiario, filtro, hoy = new Date()) {
  if (!filtro || filtro === 'all') return true;
  return estadoTamizaje(beneficiario, hoy) === filtro;
}
