/** Normaliza texto para comparar: minúsculas, sin tildes y sin espacios extremos. */
export function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Deja solo dígitos: sirve para comparar DNI con o sin espacios y guiones. */
export function normalizarDocumento(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}
