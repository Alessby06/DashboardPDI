// ===========================================================================
//  Indicadores de la evaluación socioeconómica (pesos oficiales)
// ===========================================================================
//  Carga en la base los 13 indicadores y sus pesos, que hasta ahora estaban
//  escritos a mano en el simulador social del código (seis dimensiones con
//  porcentajes aproximados).
//
//  La fuente es la hoja "Indicadores" de "Evaluación Socioeconómica.xlsx",
//  documento oficial del programa. Los pesos suman 1.12 porque la hoja
//  pondera cada bloque por separado y además trae una fila de "posible
//  cambio" con otros pesos: se carga el bloque vigente tal cual, sin
//  normalizar, para no inventar un total que el documento no dice.
//
//  Uso:
//    node scripts/cargar-indicadores-socioeconomicos.mjs           # dry-run
//    node scripts/cargar-indicadores-socioeconomicos.mjs --apply   # carga
// ===========================================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conectarMigracion } from './conexion-migracion.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');
const DIR_BACKUPS = resolve(RAIZ, 'backups');
const APPLY = process.argv.includes('--apply');

const INDICADORES = [
  { id: 'edad', dimension: 'Edad', peso: 0.04, orden: 1, descripcion: 'Edad del menor' },
  { id: 'nivel_instruccion', dimension: 'Nivel de instrucción', peso: 0.10, orden: 2, descripcion: 'Nivel de instrucción de los responsables' },
  { id: 'ocupacion', dimension: 'Ocupación o Actividad', peso: 0.16, orden: 3, descripcion: 'Ocupación o actividad principal de los responsables' },
  { id: 'tiempo_servicio', dimension: 'Tiempo de servicio', peso: 0.05, orden: 4, descripcion: 'Tiempo de servicio en el empleo' },
  { id: 'ingreso_egreso', dimension: 'Ingreso/Egreso', peso: 0.28, orden: 5, descripcion: 'Ingreso per cápita contra egreso per cápita' },
  { id: 'vivienda', dimension: 'Vivienda', peso: 0.20, orden: 6, descripcion: 'Tipo, tenencia, materiales, agua y desagüe' },
  { id: 'seguro', dimension: 'Seguro', peso: 0.05, orden: 7, descripcion: 'Cobertura de salud de la familia' },
  { id: 'enfermedades', dimension: 'Enfermedades', peso: 0.07, orden: 8, descripcion: 'Enfermedad crónica, adicciones o discapacidad en el hogar' },
  { id: 'apoyo_instituciones', dimension: 'Apoyo de otros Instituciones', peso: 0.00, orden: 9, descripcion: 'Apoyo recibido de otras instituciones' },
  { id: 'identificacion_proyecto', dimension: 'Identificación con el proyecto educativo', peso: 0.05, orden: 10, descripcion: 'Identificación de la familia con el proyecto' },
  { id: 'equipamiento', dimension: 'Equipamiento', peso: 0.04, orden: 11, descripcion: 'Bienes del hogar' },
  { id: 'bienes_propiedades', dimension: 'Bienes y propiedades', peso: 0.03, orden: 12, descripcion: 'Bienes y propiedades de la familia' },
  { id: 'electricidad', dimension: 'Electricidad', peso: 0.05, orden: 13, descripcion: 'Acceso a electricidad' },
];

async function main() {
  const db = await conectarMigracion({ esquema: false });
  try {
    const [info] = await db.query('INFO FOR TABLE indicador_socioeconomico;');
    if (!info?.fields) {
      console.error('La tabla indicador_socioeconomico no existe todavia: '
        + 'aplica antes migrar-esquema-lote-3.mjs --apply (necesita la cuenta de administracion).');
      process.exit(1);
    }

    const [actuales] = await db.query('SELECT id, dimension, peso, orden FROM indicador_socioeconomico;');
    const porDimension = new Map((actuales || []).map((f) => [f.dimension, f]));

    const altas = INDICADORES.filter((i) => !porDimension.has(i.dimension));
    const cambios = INDICADORES.filter((i) => porDimension.has(i.dimension)
      && Number(porDimension.get(i.dimension).peso) !== Number(i.peso));

    console.log('');
    console.log('=== Indicadores socioeconómicos · ' + (APPLY ? 'APPLY' : 'DRY-RUN') + ' ===');
    console.log(`Altas: ${altas.length} · cambios de peso: ${cambios.length} · total: ${INDICADORES.length}`);
    for (const indicador of INDICADORES) {
      const previo = porDimension.get(indicador.dimension);
      const marca = previo ? (Number(previo.peso) === indicador.peso ? 'igual' : 'cambia') : 'nuevo';
      console.log(`  ${indicador.orden}. ${indicador.dimension}: ${indicador.peso} (${marca})`);
    }
    console.log('');

    if (!APPLY) {
      console.log('Dry-run: no se escribe nada.');
      return;
    }

    mkdirSync(DIR_BACKUPS, { recursive: true });
    for (const indicador of INDICADORES) {
      await db.query(`
        UPSERT indicador_socioeconomico:${indicador.id} CONTENT {
          dimension: $dimension, peso: $peso, orden: $orden,
          descripcion: $descripcion, activo: true
        };`, {
        dimension: indicador.dimension,
        peso: indicador.peso,
        orden: indicador.orden,
        descripcion: indicador.descripcion,
      });
    }
    console.log(`Cargados ${INDICADORES.length} indicadores oficiales.`);
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error al cargar los indicadores:', err?.message || err);
  process.exit(1);
});
