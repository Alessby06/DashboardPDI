// ===========================================================================
//  PILOTO DE LA EVALUACIÓN SOCIOECONÓMICA
// ===========================================================================
//  Compara el puntaje del sistema con el puntaje del Excel oficial en 5 casos
//  reales. Es de solo lectura: no escribe en la base.
//
//  Uso:
//    node scripts/piloto-evaluacion.mjs --auditar
//    node scripts/piloto-evaluacion.mjs --template
//    node scripts/piloto-evaluacion.mjs --excel docs/piloto-evaluacion.csv
//
//  Columnas del CSV:
//    codigo, usuario, puntaje_excel, clasificacion_excel,
//    exoneracion_excel, observaciones
// ===========================================================================
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conectarMigracion } from './conexion-migracion.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const tiene = (nombre) => args.includes(nombre);
const valor = (nombre, porDefecto = '') => {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
};

const AUDITAR = tiene('--auditar');
const PLANTILLA = tiene('--template');
const INCLUIR_SEMILLA = tiene('--incluir-semilla');
const FORZAR = tiene('--force');
const TOLERANCIA = Number(valor('--tolerancia', '0.5')) || 0.5;
const EXCEL = resolve(RAIZ, valor('--excel', 'docs/piloto-evaluacion.csv'));
const SALIDA = resolve(RAIZ, valor('--salida', 'docs/piloto-resultados.md'));
const CODIGOS = valor('--codigos', '')
  .split(',').map(s => s.trim()).filter(Boolean);

const norm = (v) => String(v || '').trim().toLowerCase();

function csvCampo(valor) {
  const texto = String(valor == null ? '' : valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function parseCsv(texto) {
  const filas = [];
  let fila = [];
  let campo = '';
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else { comillas = false; }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      comillas = true;
    } else if (c === ',') {
      fila.push(campo); campo = '';
    } else if (c === '\n') {
      fila.push(campo); filas.push(fila); fila = []; campo = '';
    } else if (c !== '\r') {
      campo += c;
    }
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const resultado = filas.filter(f => f.some(v => String(v).trim() !== ''));
  if (resultado[0]?.[0]) resultado[0][0] = String(resultado[0][0]).replace(/^\uFEFF/, '');
  return resultado;
}

function esReal(caso) {
  return Boolean(caso.origen) && caso.origen !== 'seed';
}

function evaluacionDe(caso, evaluaciones) {
  const porCaso = evaluaciones.find(e => norm(e.caso_id) === norm(caso.id));
  if (porCaso) return porCaso;
  return evaluaciones.find(e => norm(e.persona_id) === norm(caso.persona)) || null;
}

function filaCaso(caso, evaluacion) {
  return {
    codigo: caso.codigo_caso || caso.codigo_usuario || '',
    codigoUsuario: caso.codigo_usuario || '',
    usuario: `${caso.nombres || ''} ${caso.apellidos || ''}`.trim(),
    origen: caso.origen || '(sin origen)',
    sistema: evaluacion?.puntaje_total != null ? Number(evaluacion.puntaje_total) : null,
    clasificacion: evaluacion?.clasificacion || '',
    exoneracion: evaluacion?.exoneracion_sugerida || '',
    evaluacion,
  };
}

async function main() {
  const db = await conectarMigracion();
  try {
    const [casosRaw] = await db.query(`SELECT id, codigo_caso, origen,
      usuario_id.codigo AS codigo_usuario,
      usuario_id.nombres AS nombres,
      usuario_id.apellidos AS apellidos,
      usuario_id AS persona
      FROM caso_social WHERE activo = true ORDER BY creado_el;`);
    const [evaluacionesRaw] = await db.query(`SELECT id, persona_id, caso_id, periodo,
      version, estado, puntaje_total, clasificacion, exoneracion_sugerida,
      evaluador_nombre, fecha_evaluacion
      FROM evaluacion_socioeconomica
      WHERE estado = 'aprobada'
      ORDER BY fecha_evaluacion DESC;`);

    const casos = Array.isArray(casosRaw) ? casosRaw : [];
    const evaluaciones = Array.isArray(evaluacionesRaw) ? evaluacionesRaw : [];
    const reales = casos.filter(esReal);
    const semilla = casos.filter(c => c.origen === 'seed');
    const sinOrigen = casos.filter(c => !c.origen);

    console.log('');
    console.log('=== Piloto de evaluación socioeconómica ===');
    console.log(`Casos activos: ${casos.length} · reales: ${reales.length} · seed: ${semilla.length} · sin origen: ${sinOrigen.length}`);
    console.log(`Evaluaciones aprobadas: ${evaluaciones.length}`);
    console.log('');

    if (AUDITAR) {
      const mostrar = (titulo, lista) => {
        if (!lista.length) return;
        console.log(titulo);
        lista.slice(0, 12).forEach(c => {
          console.log(`  ${c.codigo_caso || c.codigo_usuario || c.id} · ${c.nombres || ''} ${c.apellidos || ''} · origen: ${c.origen || '(sin origen)'}`);
        });
        console.log('');
      };
      mostrar('Casos reales:', reales);
      mostrar('Casos seed:', semilla);
      mostrar('Casos sin origen (se tratarán como demostración):', sinOrigen);
      if (!reales.length) {
        console.log('No hay casos reales cargados. El piloto no puede ejecutarse todavía.');
        console.log('Importa o marca los 5 casos reales con un origen distinto de "seed".');
      }
      return;
    }

    const candidatos = (INCLUIR_SEMILLA ? casos : reales)
      .filter(c => !CODIGOS.length || CODIGOS.includes(c.codigo_caso) || CODIGOS.includes(c.codigo_usuario))
      .slice(0, 5);

    if (PLANTILLA) {
      if (existsSync(EXCEL) && !FORZAR) {
        console.log(`La plantilla ya existe: ${EXCEL}`);
        console.log('Usa --force si quieres reemplazarla.');
        return;
      }
      const lineas = ['codigo,usuario,puntaje_excel,clasificacion_excel,exoneracion_excel,observaciones'];
      for (const caso of candidatos) {
        const evaluacion = evaluacionDe(caso, evaluaciones);
        const f = filaCaso(caso, evaluacion);
        lineas.push([
          csvCampo(f.codigo), csvCampo(f.usuario), '', '', '', '',
        ].join(','));
      }
      mkdirSync(dirname(EXCEL), { recursive: true });
      writeFileSync(EXCEL, '\uFEFF' + lineas.join('\n') + '\n', 'utf8');
      console.log(`Plantilla escrita: ${EXCEL}`);
      console.log(`Filas: ${candidatos.length}. Completa las columnas de Excel y ejecuta --excel.`);
      if (!candidatos.length) {
        console.log('No hay casos reales para incluir. La plantilla quedó solo con el encabezado.');
      }
      return;
    }

    if (!existsSync(EXCEL)) {
      console.error(`No existe el CSV del piloto: ${EXCEL}`);
      console.error('Genera una plantilla con --template o pasa --excel <ruta>.');
      process.exitCode = 1;
      return;
    }

    const filas = parseCsv(readFileSync(EXCEL, 'utf8'));
    if (!filas.length) {
      console.error('El CSV está vacío.');
      process.exitCode = 1;
      return;
    }
    const encabezado = filas[0].map(h => norm(h));
    const idx = (nombre, alterno) => {
      const i = encabezado.indexOf(nombre);
      return i >= 0 ? i : encabezado.indexOf(alterno);
    };
    const iCodigo = idx('codigo', 'código');
    const iPuntaje = idx('puntaje_excel', 'puntaje excel');
    const iClasificacion = idx('clasificacion_excel', 'clasificación_excel');
    const iExoneracion = idx('exoneracion_excel', 'exoneración_excel');
    const iObservaciones = idx('observaciones', 'observación');

    const resultados = [];
    for (const fila of filas.slice(1)) {
      const codigo = fila[iCodigo] || '';
      const textoExcel = String(fila[iPuntaje] || '').trim();
      const excel = textoExcel === '' ? null : Number(textoExcel.replace(',', '.'));
      const clasificacionExcel = fila[iClasificacion] || '';
      const exoneracionExcel = fila[iExoneracion] || '';
      const observaciones = iObservaciones >= 0 ? (fila[iObservaciones] || '') : '';
      const caso = casos.find(c => norm(c.codigo_caso) === norm(codigo) || norm(c.codigo_usuario) === norm(codigo));
      if (!caso) {
        resultados.push({ codigo, usuario: '—', sistema: null, excel, delta: null, clasificacion: '', exoneracion: '', estado: 'CASO NO ENCONTRADO', observaciones });
        continue;
      }
      const evaluacion = evaluacionDe(caso, evaluaciones);
      const sistema = evaluacion?.puntaje_total != null ? Number(evaluacion.puntaje_total) : null;
      let estado = 'PENDIENTE';
      let delta = null;
      if (sistema == null) {
        estado = 'SIN EVALUACIÓN';
      } else if (!Number.isFinite(excel)) {
        estado = 'PENDIENTE';
      } else {
        delta = Math.round((sistema - excel) * 10) / 10;
        const coincidePuntaje = Math.abs(delta) <= TOLERANCIA;
        const coincideClase = !clasificacionExcel || norm(clasificacionExcel) === norm(evaluacion.clasificacion);
        const coincideExo = !exoneracionExcel || norm(exoneracionExcel) === norm(evaluacion.exoneracion_sugerida);
        estado = coincidePuntaje && coincideClase && coincideExo ? 'OK' : 'REVISAR';
      }
      resultados.push({
        codigo, usuario: `${caso.nombres || ''} ${caso.apellidos || ''}`.trim(),
        sistema, excel: Number.isFinite(excel) ? excel : null,
        delta, clasificacion: evaluacion?.clasificacion || '',
        exoneracion: evaluacion?.exoneracion_sugerida || '',
        estado, observaciones,
      });
    }

    const cuenta = (estado) => resultados.filter(r => r.estado === estado).length;
    const comparables = resultados.filter(r => Number.isFinite(r.delta));
    const deltaPromedio = comparables.length
      ? Math.round(comparables.reduce((t, r) => t + Math.abs(r.delta), 0) / comparables.length * 10) / 10
      : null;

    const lineas = [
      '# Piloto de evaluación socioeconómica',
      '',
      `Fecha: ${new Date().toISOString().slice(0, 10)}`,
      `Casos en el CSV: ${resultados.length}`,
      `OK: ${cuenta('OK')} · Revisar: ${cuenta('REVISAR')} · Pendientes: ${cuenta('PENDIENTE')} · Sin evaluación: ${cuenta('SIN EVALUACIÓN')}`,
      `Delta absoluto promedio: ${deltaPromedio != null ? deltaPromedio : '—'} puntos`,
      `Tolerancia: ±${TOLERANCIA} puntos`,
      '',
      '| Código | Usuario | Sistema | Excel | Δ | Clasificación | Exoneración | Estado | Observaciones |',
      '|---|---|---:|---:|---:|---|---|---|---|',
      ...resultados.map(r => `| ${r.codigo} | ${r.usuario || '—'} | ${r.sistema ?? '—'} | ${r.excel ?? '—'} | ${r.delta ?? '—'} | ${r.clasificacion || '—'} | ${r.exoneracion || '—'} | ${r.estado} | ${r.observaciones || ''} |`),
      '',
      '## Lectura',
      '',
      '- **OK**: el puntaje coincide dentro de la tolerancia y la clasificación/exoneración coinciden.',
      '- **REVISAR**: hay una diferencia de puntaje, clasificación o exoneración; revisar la rúbrica y el mapeo de campos.',
      '- **SIN EVALUACIÓN**: el caso no tiene una evaluación aprobada en el sistema.',
      '- **PENDIENTE**: falta el puntaje del Excel en el CSV.',
      '',
      'El piloto no se considera cerrado hasta que los 5 casos estén en OK y el Área firme la comparación.',
      '',
    ];

    mkdirSync(dirname(SALIDA), { recursive: true });
    writeFileSync(SALIDA, lineas.join('\n'), 'utf8');

    console.log('=== Resultado del piloto ===');
    console.log(`OK: ${cuenta('OK')} · Revisar: ${cuenta('REVISAR')} · Pendientes: ${cuenta('PENDIENTE')} · Sin evaluación: ${cuenta('SIN EVALUACIÓN')}`);
    console.log(`Delta absoluto promedio: ${deltaPromedio != null ? deltaPromedio : '—'}`);
    console.log(`Informe: ${SALIDA}`);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error en el piloto:', err?.message || err);
  process.exit(1);
});
