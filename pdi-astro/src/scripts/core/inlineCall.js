/**
 * Convierte una expresión de manejador heredada (antes atributo on*= inline)
 * en una llamada estructurada que el despachante externo puede ejecutar sin
 * evaluar código: { nombre, args }.
 *
 * Formatos aceptados, todos usados por FilterField y FilterPanel:
 *   window.fn('a', 'b')
 *   window.fn ? window.fn('a') : null
 *   fn(event)
 */
function separarArgs(texto) {
  const args = [];
  let actual = '';
  let comilla = null;
  for (const ch of texto) {
    if (comilla) {
      actual += ch;
      if (ch === comilla) comilla = null;
    } else if (ch === "'" || ch === '"') {
      comilla = ch;
      actual += ch;
    } else if (ch === ',') {
      args.push(actual.trim());
      actual = '';
    } else {
      actual += ch;
    }
  }
  if (actual.trim()) args.push(actual.trim());
  return args;
}

function valorArg(arg) {
  if (arg === 'event') return '@event';
  if (arg === 'this') return '@this';
  if ((arg.startsWith("'") && arg.endsWith("'")) || (arg.startsWith('"') && arg.endsWith('"'))) {
    return arg.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
  }
  if (/^-?\d+(\.\d+)?$/.test(arg)) return Number(arg);
  return arg;
}

/**
 * Parsea manejadores generados en runtime (los que antes se escribían como
 * onclick="..." dentro de plantillas). Devuelve una descripción con las
 * llamadas candidatas, en orden de prioridad, y si hay que detener la
 * propagación. No evalúa código: el despachante resuelve las rutas contra
 * window y llama a la primera función que exista.
 */
export function parsearManejador(codigo) {
  let resto = String(codigo ?? '').trim();
  let stop = false;
  while (/^event\s*\.\s*stopPropagation\s*\(\s*\)\s*;?/.test(resto)) {
    stop = true;
    resto = resto.replace(/^event\s*\.\s*stopPropagation\s*\(\s*\)\s*;?\s*/, '').trim();
  }

  const llamadas = [];
  const esIdent = (ch) => /[\w$?.]/.test(ch);
  let i = 0;
  while (i < resto.length) {
    if (esIdent(resto[i])) {
      const inicioNombre = i;
      while (i < resto.length && esIdent(resto[i])) i++;
      let j = i;
      while (j < resto.length && /\s/.test(resto[j])) j++;
      if (resto[j] !== '(') continue;
      // Los argumentos pueden tener cadenas con paréntesis ("Hoy (Jornada en
      // curso)"): se escanean con balance. Al terminar, i salta el cierre para
      // no volver a encontrar identificadores dentro de la cadena.
      let profundidad = 0;
      let comilla = null;
      let fin = -1;
      for (let k = j; k < resto.length; k++) {
        const ch = resto[k];
        if (comilla) {
          if (ch === comilla && resto[k - 1] !== '\\') comilla = null;
        } else if (ch === "'" || ch === '"') {
          comilla = ch;
        } else if (ch === '(') {
          profundidad++;
        } else if (ch === ')') {
          profundidad--;
          if (profundidad === 0) { fin = k; break; }
        }
      }
      if (fin < 0) break;
      const argsTexto = resto.slice(j + 1, fin);
      const ruta = resto.slice(inicioNombre, i)
        .replace(/^window\./, '').replace(/\?\./g, '.').replace(/\.$/, '');
      llamadas.push({ ruta, args: argsTexto.trim() ? separarArgs(argsTexto).map(valorArg) : [] });
      i = fin + 1;
      continue;
    }
    i++;
  }
  return { stop, llamadas };
}

/** Atributos HTML que sustituyen a un manejador inline generado en runtime. */
export function attrsDe(codigo) {
  const desc = parsearManejador(codigo);
  const json = JSON.stringify(desc).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return ` data-pdi-llamadas="${json}"` + (desc.stop ? ' data-pdi-stop="1"' : '');
}

export function parsearLlamada(codigo) {
  const desc = parsearManejador(codigo);
  if (!desc || !desc.llamadas || !desc.llamadas.length) return null;
  const primera = desc.llamadas[0];
  return { nombre: primera.ruta, args: primera.args };
}
