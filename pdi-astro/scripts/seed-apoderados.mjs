import { readFileSync } from 'node:fs';
import { Surreal } from 'surrealdb';

const env = {};
for (const l of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}

const db = new Surreal();
await db.connect(env.PUBLIC_SURREAL_URL);
await db.signin({
  username: env.PUBLIC_SURREAL_USER,
  password: env.PUBLIC_SURREAL_PASS,
  namespace: env.PUBLIC_SURREAL_NS,
  database: env.PUBLIC_SURREAL_DB,
});
await db.use({
  namespace: env.PUBLIC_SURREAL_NS,
  database: env.PUBLIC_SURREAL_DB,
});

const { defaultBeneficiarios } = await import('../src/data/fixtures/beneficiarios.js');
const idClean = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_');

// Limpiar persona_vinculada previa
await db.query('DELETE persona_vinculada;');

const [personasExistentes] = await db.query('SELECT id, numero_documento, codigo FROM persona');
const personaPorDoc = new Map(personasExistentes.map(p => [String(p.numero_documento), p.id]));
const personaPorCod = new Map(personasExistentes.map(p => [String(p.codigo).toLowerCase(), p.id]));

for (const b of defaultBeneficiarios) {
  if (!b.apoderado) continue;
  const menorId = personaPorDoc.get(String(b.dni)) || personaPorCod.get(String(b.codigo).toLowerCase());
  if (!menorId) continue;

  const apoDni = String(b.apoderadoDni || `00${b.id}9999`);
  let apoId = personaPorDoc.get(apoDni);

  if (!apoId) {
    const nombresArr = b.apoderado.trim().split(' ');
    const nom = nombresArr[0];
    const ape = nombresArr.slice(1).join(' ') || 'Apoderado';
    const pidStr = `persona:\`apo_${idClean(apoDni)}\``;

    await db.query(
      `CREATE ${pidStr} SET
        codigo = $codigo,
        nombres = $nom,
        apellidos = $ape,
        numero_documento = $dni,
        tipo_documento = 'DNI',
        sexo = 'F',
        distrito = $dist,
        direccion = $dir,
        telefono = $tel,
        esquema_salud = 'SIS',
        fecha_nacimiento = <datetime>'1990-01-01T00:00:00Z',
        activo = true`,
      {
        codigo: `APO-${String(b.id).padStart(3, '0')}`,
        nom,
        ape,
        dni: apoDni,
        dist: b.distrito === 'Carabayllo' ? 'Carabayllo' : 'Comas',
        dir: b.direccion || 'Comas',
        tel: b.telefono || null,
      }
    );
    apoId = pidStr;
    personaPorDoc.set(apoDni, apoId);
  }

  const parentescoValido = ['Madre', 'Padre', 'Abuela', 'Abuelo', 'Tia', 'Tio', 'Hermano/a', 'Padrastro', 'Madrastra', 'Tutor Legal', 'Otro'].includes(b.parentesco) ? b.parentesco : 'Madre';

  await db.query(
    `CREATE persona_vinculada SET
      menor_id = ${menorId},
      cuidador_id = ${apoId},
      parentesco = $parentesco,
      rol_vinculo = 'Responsable',
      vive_con_menor = true`,
    { parentesco: parentescoValido }
  );
  console.log('[OK] Apoderado vinculado:', b.apoderado, '->', b.nombres);
}

const [rVinc] = await db.query('SELECT count() FROM persona_vinculada GROUP ALL');
console.log('Total vinculos familiares creados:', rVinc[0]?.count);

await db.close();
