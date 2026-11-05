// ===========================================================================
//  ESQUEMA DE DERIVACIÓN · FASE 1
// ===========================================================================
//  Añade a caso_social los campos de la ficha de derivación que no existen en
//  el esquema actual: ámbito, etiquetas, fecha del suceso, soporte estructurado
//  y la instantánea del documento. También amplía evento_caso para la atención
//  y enlaza la evaluación socioeconómica con el caso.
//
//  Requiere la cuenta de administración (pdi_app): los cambios de esquema no
//  los puede hacer pdi_web. Define SURREAL_ADMIN_USER / SURREAL_ADMIN_PASS en
//  .env, o ejecútalo donde estén.
//
//  Uso:
//    node scripts/migrar-esquema-derivacion.mjs           # dry-run
//    node scripts/migrar-esquema-derivacion.mjs --apply   # aplica
// ===========================================================================
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conectarMigracion } from './conexion-migracion.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');
const DIR_BACKUPS = resolve(RAIZ, 'backups');
const APPLY = process.argv.includes('--apply');

const CAMBIOS = [
  {
    tabla: 'caso_social',
    campo: 'ambito',
    sql: `DEFINE FIELD OVERWRITE ambito ON caso_social TYPE string
      ASSERT $value INSIDE ['Familiar', 'Educativo', 'Salud'] PERMISSIONS FULL;`,
  },
  {
    tabla: 'caso_social',
    campo: 'etiquetas',
    sql: `DEFINE FIELD OVERWRITE etiquetas ON caso_social TYPE array<string> DEFAULT []
      PERMISSIONS FULL;`,
  },
  {
    tabla: 'caso_social',
    campo: 'fecha_suceso',
    sql: 'DEFINE FIELD OVERWRITE fecha_suceso ON caso_social TYPE none | datetime PERMISSIONS FULL;',
  },
  {
    tabla: 'caso_social',
    campo: 'soporte_nombre',
    sql: 'DEFINE FIELD OVERWRITE soporte_nombre ON caso_social TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'caso_social',
    campo: 'soporte_parentesco',
    sql: 'DEFINE FIELD OVERWRITE soporte_parentesco ON caso_social TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'caso_social',
    campo: 'snapshot',
    sql: 'DEFINE FIELD OVERWRITE snapshot ON caso_social TYPE any PERMISSIONS FULL;',
  },
  {
    tabla: 'caso_social',
    campo: 'origen',
    sql: `DEFINE FIELD OVERWRITE origen ON caso_social TYPE string DEFAULT 'social'
      ASSERT $value INSIDE ['social', 'padron', 'expediente', 'importacion', 'seed', 'sistema']
      PERMISSIONS FULL;`,
  },
  {
    tabla: 'caso_social',
    campo: 'creado_por',
    sql: 'DEFINE FIELD OVERWRITE creado_por ON caso_social TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'caso_social',
    campo: 'servicio_origen',
    sql: 'DEFINE FIELD OVERWRITE servicio_origen ON caso_social TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'caso_social',
    campo: 'fase_documental',
    sql: `DEFINE FIELD OVERWRITE fase_documental ON caso_social TYPE string DEFAULT 'derivacion'
      ASSERT $value INSIDE ['derivacion', 'atencion', 'reporte'] PERMISSIONS FULL;`,
  },
  {
    tabla: 'caso_social',
    campo: 'puntaje_origen',
    sql: `DEFINE FIELD OVERWRITE puntaje_origen ON caso_social TYPE string DEFAULT 'sin_evaluacion'
      ASSERT $value INSIDE ['sin_evaluacion', 'evaluacion', 'legado'] PERMISSIONS FULL;`,
  },
  {
    tabla: 'caso_social',
    campo: 'evaluacion_id',
    sql: 'DEFINE FIELD OVERWRITE evaluacion_id ON caso_social TYPE none | record<evaluacion_socioeconomica> PERMISSIONS FULL;',
  },
  {
    tabla: 'caso_social',
    campo: 'informe_social',
    sql: 'DEFINE FIELD OVERWRITE informe_social ON caso_social TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'caso_social',
    campo: 'fecha_cierre',
    sql: 'DEFINE FIELD OVERWRITE fecha_cierre ON caso_social TYPE none | datetime PERMISSIONS FULL;',
  },
  {
    tabla: 'caso_social',
    campo: 'actualizado_por',
    sql: 'DEFINE FIELD OVERWRITE actualizado_por ON caso_social TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'evento_caso',
    campo: 'naturaleza_visita',
    sql: 'DEFINE FIELD OVERWRITE naturaleza_visita ON evento_caso TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'evento_caso',
    campo: 'resultado',
    sql: 'DEFINE FIELD OVERWRITE resultado ON evento_caso TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'evento_caso',
    campo: 'tipo_institucion',
    sql: 'DEFINE FIELD OVERWRITE tipo_institucion ON evento_caso TYPE none | string PERMISSIONS FULL;',
  },
  {
    tabla: 'evento_caso',
    campo: 'tipo_evento',
    sql: `DEFINE FIELD OVERWRITE tipo_evento ON evento_caso TYPE string
      ASSERT $value INSIDE [
        'Visita Domiciliaria', 'Entrega BTF', 'Derivacion DEMUNA',
        'Derivacion MINSA', 'Derivacion Iglesia', 'Consejería Pastoral',
        'Entrega de Canasta', 'Cierre de Caso', 'Otra Atencion'
      ] PERMISSIONS FULL;`,
  },
  {
    tabla: 'evaluacion_socioeconomica',
    campo: 'caso_id',
    sql: 'DEFINE FIELD OVERWRITE caso_id ON evaluacion_socioeconomica TYPE none | record<caso_social> PERMISSIONS FULL;',
  },
];

async function main() {
  const db = await conectarMigracion({ esquema: true });
  try {
    console.log('');
    console.log('=== Esquema de derivación · ' + (APPLY ? 'APPLY' : 'DRY-RUN') + ' ===');
    console.log(`Cambios: ${CAMBIOS.length}`);
    for (const c of CAMBIOS) {
      console.log(`  ${c.tabla}.${c.campo}`);
    }
    console.log('');

    if (!APPLY) {
      console.log('Dry-run: no se escribe nada. Ejecuta con --apply para aplicar.');
      return;
    }

    mkdirSync(DIR_BACKUPS, { recursive: true });
    const respaldo = {};
    for (const tabla of [...new Set(CAMBIOS.map(c => c.tabla))]) {
      const info = await db.query(`INFO FOR TABLE ${tabla};`);
      respaldo[tabla] = info[0]?.fields || {};
    }
    const sello = new Date().toISOString().replace(/[:.]/g, '-');
    const archivo = resolve(DIR_BACKUPS, `esquema-derivacion-${sello}.json`);
    writeFileSync(archivo, JSON.stringify(respaldo, null, 2), 'utf8');
    console.log(`Respaldo del esquema: ${archivo}`);

    for (const c of CAMBIOS) {
      try {
        await db.query(c.sql);
        console.log(`  OK  ${c.tabla}.${c.campo}`);
      } catch (err) {
        console.error(`  ERR ${c.tabla}.${c.campo}: ${err?.message || err}`);
        throw err;
      }
    }
    console.log('');
    console.log('Esquema de derivación aplicado.');
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Error al aplicar el esquema:', err?.message || err);
  process.exit(1);
});
