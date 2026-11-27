const OFFSET_PERU_MS = 5 * 60 * 60 * 1000;

/** Día calendario en hora de Perú (UTC-5), sin horas ni zonas. */
function diaDe(valor) {
  const raw = String(valor ?? '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const fecha = new Date(raw);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Date(fecha.getTime() - OFFSET_PERU_MS).toISOString().slice(0, 10);
}

/** Resta meses conservando el día, sin desbordar a fin de mes (31/08 → 28/02). */
function restarMeses(ymd, meses) {
  const [anio, mes, dia] = ymd.split('-').map(Number);
  const base = new Date(Date.UTC(anio, mes - 1 - meses, 1));
  const anioDestino = base.getUTCFullYear();
  const mesDestino = base.getUTCMonth();
  const ultimoDia = new Date(Date.UTC(anioDestino, mesDestino + 1, 0)).getUTCDate();
  const diaDestino = Math.min(dia, ultimoDia);
  return `${anioDestino}-${String(mesDestino + 1).padStart(2, '0')}-${String(diaDestino).padStart(2, '0')}`;
}

/** Estado del tamizaje vigente de un beneficiario, comparado por día. */
export function estadoTamizaje(beneficiario, hoy = new Date()) {
  const tams = Array.isArray(beneficiario?.tamizajes) ? beneficiario.tamizajes : [];
  const fechas = tams
    .map((t) => diaDe(t?.fecha))
    .filter(Boolean);
  if (!fechas.length) return 'sin';

  const ultima = fechas.sort().at(-1);
  const hoyDia = diaDe(hoy);
  if (!hoyDia) return 'vigente';

  const corte = restarMeses(hoyDia, 6);
  return ultima < corte ? 'vencido' : 'vigente';
}

/** `all` no filtra; `sin` y `vencido` comparan el estado calculado. */
export function coincideTamizaje(beneficiario, filtro, hoy = new Date()) {
  if (!filtro || filtro === 'all') return true;
  return estadoTamizaje(beneficiario, hoy) === filtro;
}
