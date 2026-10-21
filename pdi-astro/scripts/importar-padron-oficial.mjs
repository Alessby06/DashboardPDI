// ===========================================================================
//  Importador del padrón oficial (con conversiones)
// ===========================================================================
//  Las planillas del programa guardan las fechas como número de serie de
//  Excel, el DNI y el teléfono en notación científica, y el seguro escrito de
//  varias formas ("SiS", "Essalud", "No"). Este script nunca las lee tal
//  cual: convierte, valida y avisa de lo que no cuadra antes de que nada
//  llegue a la base.
//
//  Las planillas contienen datos personales de menores: el informe sale con el
//  DNI y el celular tapados, y la escritura a la base exige --apply.
//
//  Uso:
//    node scripts/importar-padron-oficial.mjs --archivo="...xlsx" [--hoja=Hoja1]
//    node scripts/importar-padron-oficial.mjs --archivo="...xlsx" --apply
// ===========================================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { basename, resolve, dirname } from 'node:path';
import { conectarMigracion } from './conexion-migracion.mjs';
import { seguroDbAUi } from '../src/scripts/core/catalogos.js';

const args = process.argv.slice(2);
const arg = (nombre) => {
  const encontrado = args.find((a) => a.startsWith(`--${nombre}=`));
  return encontrado ? encontrado.slice(nombre.length + 3).trim() : '';
};
const ARCHIVO = arg('archivo');
const HOJA = arg('hoja');
const APLICAR = args.includes('--apply');
if (!ARCHIVO) {
  console.error('Falta --archivo="ruta.xlsx"');
  process.exit(1);
}

// ---------------------------------------------------------------------------
//  Lector de ZIP mínimo (los .xlsx son ZIP con XML dentro)
// ---------------------------------------------------------------------------
function leerZip(ruta) {
  const buf = readFileSync(ruta);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('No es un archivo ZIP valido');
  const total = buf.readUInt16LE(eocd + 10);
  let pos = buf.readUInt32LE(eocd + 16);
  const entradas = {};
  for (let n = 0; n < total; n++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) break;
    const metodo = buf.readUInt16LE(pos + 10);
    const tamComprimido = buf.readUInt32LE(pos + 20);
    const tamNombre = buf.readUInt16LE(pos + 28);
    const tamExtra = buf.readUInt16LE(pos + 30);
    const tamComentario = buf.readUInt16LE(pos + 32);
    const offset = buf.readUInt32LE(pos + 42);
    const nombre = buf.toString('utf8', pos + 46, pos + 46 + tamNombre);
    // La cabecera local empieza en el offset: en ella estan la longitud del
    // nombre (26) y la del campo extra (28).
    const tamNombreLocal = buf.readUInt16LE(offset + 26);
    const tamExtraLocal = buf.readUInt16LE(offset + 28);
    const inicio = offset + 30 + tamNombreLocal + tamExtraLocal;
    const datos = buf.subarray(inicio, inicio + tamComprimido);
    entradas[nombre] = metodo === 0 ? datos : inflateRawSync(datos);
    pos += 46 + tamNombre + tamExtra + tamComentario;
  }
  return entradas;
}

const decodificar = (valor) => String(valor || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');

// ---------------------------------------------------------------------------
//  Lectura de la hoja
// ---------------------------------------------------------------------------
function textoCompartido(entradas) {
  const xml = entradas['xl/sharedStrings.xml'];
  if (!xml) return [];
  const contenido = xml.toString('utf8');
  return [...contenido.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => {
    const partes = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => decodificar(t[1]));
    return partes.join('');
  });
}

function hojasDe(entradas) {
  const libro = entradas['xl/workbook.xml']?.toString('utf8') || '';
  const rels = entradas['xl/_rels/workbook.xml.rels']?.toString('utf8') || '';
  const mapa = {};
  for (const m of rels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) mapa[m[1]] = m[2];
  const hojas = [];
  for (const m of libro.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    let destino = mapa[m[2]] || '';
    if (!destino.startsWith('xl/')) destino = 'xl/' + destino.replace(/^\/+/, '');
    hojas.push({ nombre: decodificar(m[1]), ruta: destino });
  }
  return hojas;
}

function filasDe(entradas, ruta, compartidas) {
  const xml = entradas[ruta]?.toString('utf8') || '';
  const indiceColumna = (letras) => {
    let n = 0;
    for (const ch of letras) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  };
  const filas = [];
  for (const fila of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const celdas = {};
    let max = -1;
    for (const c of fila[1].matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const atributos = c[1] || '';
      const cuerpo = c[2] || '';
      const ref = (atributos.match(/r="([A-Z]+)/) || [])[1] || '';
      const tipo = (atributos.match(/t="([^"]+)"/) || [])[1] || '';
      let valor = '';
      if (tipo === 'inlineStr') {
        valor = [...cuerpo.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => decodificar(t[1])).join('');
      } else {
        const v = cuerpo.match(/<v>([\s\S]*?)<\/v>/);
        if (v) {
          valor = v[1];
          if (tipo === 's') {
            const i = parseInt(valor, 10);
            if (Number.isFinite(i) && i < compartidas.length) valor = compartidas[i];
          }
        }
      }
      const columna = indiceColumna(ref);
      const limpio = String(valor).replace(/[\r\n\t]/g, ' ').trim();
      if (limpio) {
        celdas[columna] = limpio;
        if (columna > max) max = columna;
      }
    }
    if (max < 0) continue;
    const linea = [];
    for (let i = 0; i <= max; i++) linea.push(celdas[i] || '');
    filas.push(linea);
  }
  return filas;
}

// ---------------------------------------------------------------------------
//  Conversiones
// ---------------------------------------------------------------------------
/** Numero de serie de Excel -> fecha ISO. Epoch: 1899-12-30. */
function serialAFecha(serial) {
  const numero = Number(String(serial).replace(',', '.'));
  if (!Number.isFinite(numero) || numero <= 0 || numero > 60000) return '';
  const milisegundos = Math.round((numero - 25569) * 86400 * 1000);
  return new Date(milisegundos).toISOString().slice(0, 10);
}

/** "7.7636872E7" -> "77636872". */
function numeroPlano(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return '';
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(texto)) {
    const numero = Number(texto);
    return Number.isFinite(numero) ? String(Math.round(numero)) : texto;
  }
  if (/^\d{2,5}\.\d+$/.test(texto)) {
    // Los telefonos de la planilla vienen como "97112.8742": el punto es de
    // miles, no decimal.
    const digitos = texto.replace(/\D/g, '');
    return digitos.length >= 7 && digitos.length <= 15 ? digitos : texto;
  }
  return texto.replace(/[^\d]/g, '');
}

const tapar = (valor) => {
  const texto = String(valor || '');
  if (texto.length <= 4) return texto;
  return `${texto.slice(0, 2)}${'*'.repeat(Math.max(0, texto.length - 4))}${texto.slice(-2)}`;
};

// Los encabezados varian entre hojas ("TIPO DE SEGURO" y "SEGURO", "ALERGICO
// A MEDICAMENTOS" y "ALERGICO"). Se comparan sin tildes, sin puntos y sin
// mayusculas, y gana la primera columna que aparece: en la hoja por sede el
// DNI del niño va antes que el del padre.
const ALIAS = {
  CODIGO: ['CODIGO', 'CODIGO DE USUARIO'],
  APELLIDOS: ['APELLIDOS'],
  NOMBRES: ['NOMBRES'],
  SEXO: ['SEXO'],
  'FECHA DE NACIMIENTO': ['FECHA DE NACIMIENTO', 'FECH.D NAC.', 'FECHA.NAC.'],
  EDAD: ['EDAD'],
  DNI: ['DNI'],
  DIRECCION: ['DIRECCION ACTUAL', 'DIRECCION'],
  DISTRITO: ['DISTRITO'],
  SEDE: ['LUGAR'],
  GRADO: ['GRADO'],
  'NIVEL EDUCATIVO': ['NIVEL EDUCATIVO'],
  'INSTITUCION EDUCATIVA': ['INSTITUCION EDUCATIVA', 'NOMBRE DEL I.E.'],
  'TIPO DE SEGURO': ['TIPO DE SEGURO', 'SEGURO'],
  'CENTRO DE SALUD': ['CENTRO DE SALUD'],
  'ALERGICO A MEDICAMENTOS': ['ALERGICO A MEDICAMENTOS', 'ALERGICO'],
  PARENTESCO: ['PARENTESCO'],
};

function claveEncabezado(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\s]+/g, ' ').trim().toUpperCase();
}

function mapaDeCabecera(cabecera) {
  const mapa = {};
  const disponibles = new Map();
  cabecera.forEach((columna, i) => {
    const clave = claveEncabezado(columna);
    if (!clave || disponibles.has(clave)) return;
    disponibles.set(clave, i);
  });
  for (const [campo, nombres] of Object.entries(ALIAS)) {
    for (const nombre of nombres) {
      const clave = claveEncabezado(nombre);
      if (disponibles.has(clave)) {
        mapa[campo] = disponibles.get(clave);
        break;
      }
    }
  }
  return mapa;
}

function cabeceraDe(filas) {
  return filas.findIndex((f) => f.some((c) => /nombres/i.test(c)) && f.some((c) => /apellidos/i.test(c)));
}

function valorDe(fila, mapa, nombre) {
  const columna = mapa[nombre];
  if (columna === undefined) return '';
  return String(fila[columna] || '').trim();
}

// ---------------------------------------------------------------------------
//  Conversion principal
// ---------------------------------------------------------------------------
function convertir(filas, mapa) {
  const personas = [];
  const problemas = [];
  const ignoradas = [];
  for (const fila of filas) {
    const codigo = valorDe(fila, mapa, 'CODIGO');
    const nombres = valorDe(fila, mapa, 'NOMBRES');
    const apellidos = valorDe(fila, mapa, 'APELLIDOS');
    if (!nombres && !apellidos) continue;
    const dni = numeroPlano(valorDe(fila, mapa, 'DNI'));
    // Una fila de persona tiene documento. Las filas de encabezado (la de
    // "INFORMACION ADICIONAL POR SERVICIO", por ejemplo) no lo tienen y se
    // dejan fuera: no son niños.
    if (!dni) {
      ignoradas.push({ codigo, motivo: 'sin numero de documento' });
      continue;
    }
    if (!/^\d{8}$/.test(dni)) {
      problemas.push({ codigo, motivo: `DNI con forma invalida: ${dni}` });
      continue;
    }
    const fecha = serialAFecha(valorDe(fila, mapa, 'FECHA DE NACIMIENTO'));
    if (valorDe(fila, mapa, 'FECHA DE NACIMIENTO') && !fecha) {
      problemas.push({ codigo, motivo: 'fecha de nacimiento ilegible' });
    }
    const seguroCrudo = valorDe(fila, mapa, 'TIPO DE SEGURO');
    const seguro = seguroDbAUi(seguroCrudo);
    personas.push({
      codigo,
      nombres,
      apellidos,
      dni,
      fechaNacimiento: fecha,
      sexo: valorDe(fila, mapa, 'SEXO'),
      distrito: valorDe(fila, mapa, 'DISTRITO'),
      sede: valorDe(fila, mapa, 'LUGAR'),
      grado: valorDe(fila, mapa, 'GRADO'),
      nivel: valorDe(fila, mapa, 'NIVEL EDUCATIVO'),
      ie: valorDe(fila, mapa, 'INSTITUCION EDUCATIVA'),
      seguro,
      centroSalud: valorDe(fila, mapa, 'CENTRO DE SALUD'),
      alergia: valorDe(fila, mapa, 'ALERGICO A MEDICAMENTOS'),
    });
  }
  return { personas, problemas, ignoradas };
}

async function main() {
  const entradas = leerZip(ARCHIVO);
  const compartidas = textoCompartido(entradas);
  const hojas = hojasDe(entradas);
  const elegida = HOJA
    ? hojas.find((h) => h.nombre.toLowerCase() === HOJA.toLowerCase())
    : hojas[0];
  if (!elegida) {
    console.error('Hojas disponibles:', hojas.map((h) => h.nombre).join(', '));
    process.exit(1);
  }
  const filas = filasDe(entradas, elegida.ruta, compartidas);
  const indiceCabecera = cabeceraDe(filas);
  if (indiceCabecera < 0) {
    console.error('No se encontro la fila de cabecera (CODIGO + NOMBRES).');
    process.exit(1);
  }
  const cabecera = filas[indiceCabecera];
  const mapa = mapaDeCabecera(cabecera);
  console.log('Hoja:', elegida.nombre, '· filas:', filas.length - indiceCabecera - 1);
  console.log('Columnas reconocidas:', Object.keys(mapa).join(' | '));

  const { personas, problemas, ignoradas } = convertir(filas.slice(indiceCabecera + 1), mapa);
  console.log(`\nPersonas convertidas: ${personas.length}`);
  if (problemas.length) {
    console.log('Problemas (no se importan esas filas):');
    for (const problema of problemas) console.log(`  ${problema.codigo}: ${problema.motivo}`);
  }
  if (ignoradas.length) {
    console.log(`Filas que no son personas (ignoradas): ${ignoradas.length}`);
  }
  console.log('\nMuestra (DNI y celular tapados):');
  for (const persona of personas.slice(0, 5)) {
    console.log(`  ${persona.codigo} | ${persona.apellidos}, ${persona.nombres} | ${persona.fechaNacimiento} | DNI ${tapar(persona.dni)} | ${persona.seguro} | ${persona.centroSalud}`);
  }

  if (!APLICAR) {
    console.log('\nDry-run: no se escribe nada en la base.');
    return;
  }

  const db = await conectarMigracion({ esquema: false });
  try {
    for (const persona of personas) {
      if (!persona.codigo || !persona.dni) continue;
      // El identificador es el codigo oficial del programa: si la persona ya
      // esta, se actualiza; si no, se crea.
      const id = `persona:${persona.codigo.replace(/[^\w-]/g, '_')}`;
      await db.query(`
        UPSERT ${id} CONTENT {
          codigo: $codigo, nombres: $nombres, apellidos: $apellidos,
          numero_documento: $dni, fecha_nacimiento: type::datetime($fecha),
          sexo: $sexo, distrito: $distrito, esquema_salud: $seguro,
          tipo_documento = 'DNI', activo = true
        };`, {
        codigo: persona.codigo, nombres: persona.nombres, apellidos: persona.apellidos,
        dni: persona.dni, fecha: persona.fechaNacimiento, sexo: persona.sexo,
        distrito: ['Comas', 'Carabayllo'].includes(persona.distrito) ? persona.distrito : 'Comas',
        seguro: persona.seguro,
      });
    }
    console.log(`\nImportadas ${personas.filter((p) => p.codigo && p.dni).length} personas de ${basename(ARCHIVO)}.`);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en la importacion:', err?.message || err);
  if (process.argv.includes('--verbose')) console.error(err?.stack);
  process.exit(1);
});
