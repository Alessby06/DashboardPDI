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

function extraerNumeroId(codigo, idStr, fallbackIdx) {
  if (codigo) {
    const parts = codigo.split('-');
    const last = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(last)) return last;
  }
  if (typeof idStr === 'string') {
    const num = parseInt(idStr.replace(/\D/g, ''), 10);
    if (!isNaN(num)) return num;
  }
  return fallbackIdx;
}

function edadDesdeFecha(fecha) {
  if (!fecha) return '4 años';
  const nacimiento = new Date(fecha);
  const hoy = new Date();
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  const faltaCumple = hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!faltaCumple) anios--;
  return anios <= 1 ? '1 año' : `${anios} años`;
}

// 1. Sedes
const [sedesRaw] = await db.query('SELECT * FROM sede');
const sedesMap = new Map();
const sedes = sedesRaw.map((s, idx) => {
  const sid = String(s.id);
  const obj = {
    id: extraerNumeroId(null, sid, idx + 1),
    nombre: s.nombre || '',
    distrito: s.distrito || 'Comas',
    direccion: s.direccion || '',
    referencia: s.referencia || '',
    facilitadora: s.facilitadora_nombre || '',
    facilitadoraTel: s.facilitadora_tel || '',
    iglesiaAliada: s.aliado_nombre || '',
    pastorAliado: s.aliado_nombre || '',
    aliadoTel: s.facilitadora_tel || '',
    tipoAliado: s.tipo_local || 'Local Comunal',
    servicios: Array.isArray(s.servicios) ? s.servicios : ['Servicio Alimentario Nutricional', 'Casita del Saber'],
    aforoMax: s.aforo_max || 30,
    horario: s.horario || 'Lunes a Viernes 08:00 - 14:00',
    estado: s.estado || 'Operativa',
  };
  sedesMap.set(sid, obj);
  return obj;
});

// 2. Beneficiarios
const [beneficiariosRaw] = await db.query(`
  SELECT *,
    (SELECT * FROM inscripcion WHERE persona_id = $parent.id AND activo = true LIMIT 1)[0] AS ins,
    (SELECT * FROM tamizaje_hemoglobina WHERE persona_id = $parent.id AND activo = true ORDER BY fecha_tamizaje DESC LIMIT 1)[0] AS tam,
    (SELECT cuidador_id.nombres AS c_nom, cuidador_id.apellidos AS c_ape, cuidador_id.numero_documento AS c_dni, parentesco FROM persona_vinculada WHERE menor_id = $parent.id LIMIT 1)[0] AS apo
  FROM persona
  WHERE string::starts_with(string::slice(codigo, 0, 3), 'PDI') OR id = persona:pdi_001;
`);

const beneficiarios = beneficiariosRaw.map((m, idx) => {
  const idNum = extraerNumeroId(m.codigo, String(m.id), idx + 1);
  const sedeObj = sedesMap.get(String(m.ins?.sede_id)) || sedes[0] || {};
  const prog = m.ins?.programa || 'Mixto';
  
  let servicios = ['Servicio Alimentario Nutricional'];
  let estrategia = 'Servicio Alimentario Nutricional';
  if (prog === 'Mixto') {
    servicios = ['Servicio Alimentario Nutricional', 'Casita del Saber'];
    estrategia = 'Mixto (Desayuno + Casita)';
  } else if (prog === 'Casita del Saber') {
    servicios = ['Casita del Saber'];
    estrategia = 'Casita del Saber';
  } else if (prog.includes('Lonchera')) {
    servicios = ['Servicio Alimentario Nutricional', 'Lonchera Saludable'];
    estrategia = 'Lonchera Infantil';
  }

  const apoderadoNom = m.apo ? `${m.apo.c_nom} ${m.apo.c_ape}` : 'Rosa Quispe Huamán';
  const apoderadoPar = m.apo?.parentesco || 'Madre';
  const apoderadoDni = m.apo?.c_dni || '41982341';

  let anemia = 'Normal';
  const resTam = (m.tam?.resultado || '').toLowerCase();
  if (resTam.includes('moderada')) anemia = 'Moderada';
  else if (resTam.includes('leve')) anemia = 'Leve';
  else if (resTam.includes('grave') || resTam.includes('severa')) anemia = 'Severa';

  return {
    id: idNum,
    codigo: m.codigo || `PDI-2026-${String(idNum).padStart(3, '0')}`,
    nombres: m.nombres || '',
    apellidos: m.apellidos || '',
    dni: m.numero_documento || '',
    fechaNacimiento: m.fecha_nacimiento ? new Date(m.fecha_nacimiento).toISOString().slice(0, 10) : '',
    edad: edadDesdeFecha(m.fecha_nacimiento),
    sexo: m.sexo || 'M',
    direccion: m.direccion || '',
    referencia: m.referencia || '',
    distrito: m.distrito || sedeObj.distrito || 'Comas',
    sede: sedeObj.nombre || 'Año Nuevo',
    modalidad: m.ins?.modalidad || 'Comunitaria',
    estrategia,
    exoneracionAporte: idNum % 3 === 0 ? '100% (Exonerado Vulnerabilidad Extrema)' : '0% (Aporte Ordinario)',
    servicios,
    seguro: m.esquema_salud || 'SIS Gratuito',
    centroSalud: m.distrito === 'Carabayllo' ? 'C.S. El Progreso' : 'C.S. Año Nuevo',
    alergias: 'Ninguna',
    nivelEducativo: m.nivel_educativo || 'Inicial',
    grado: m.grado || 'Inicial 4 años',
    colegio: m.grado?.includes('Prim') ? 'I.E. 3054' : 'I.E. 2026',
    apoderado: apoderadoNom,
    parentesco: apoderadoPar,
    apoderadoDni,
    telefono: m.telefono || '987-654-321',
    telefonoAlt: m.telefono_alt || '912-883-112',
    estado: m.ins?.estado || 'Activo',
    hb: m.tam?.hb_valor != null ? Number(m.tam.hb_valor) : 11.2,
    peso: m.tam?.peso_kg != null ? Number(m.tam.peso_kg) : 14.5,
    talla: m.tam?.talla_cm != null ? Number(m.tam.talla_cm) : 96.0,
    anemia,
    canastaEntregada: true,
    orientacionFamiliar: true,
    retiroAutorizado: `${apoderadoNom} (${apoderadoPar})`,
    retiroPadron: [
      {
        acreditado: apoderadoNom,
        parentesco: apoderadoPar,
        dni: apoderadoDni,
        telefono: m.telefono || '987-654-321',
        autorizadoPor: 'Dirección PDI',
        estado: 'Acreditado',
      }
    ],
  };
});

// 3. Casos Sociales
const [casosRaw] = await db.query(`
  SELECT *,
    persona_id.nombres AS p_nom,
    persona_id.apellidos AS p_ape,
    persona_id.codigo AS p_cod,
    sede_id.nombre AS s_nom
  FROM caso_social;
`);

const casos = casosRaw.map((c, idx) => {
  const idNum = c.id_numerico || extraerNumeroId(c.codigo_caso, String(c.id), 101 + idx);
  const menorNom = c.p_nom && c.p_ape ? `${c.p_nom} ${c.p_ape}` : 'Menor PDI';
  return {
    id: idNum,
    menor: menorNom,
    codigo: c.p_cod || c.codigo_caso || `PDI-2026-${String(idNum).padStart(3, '0')}`,
    etapa: c.etapa || 'pendiente',
    urgencia: c.urgencia || 'Media',
    tipoProblematica: c.tipo_problematica || 'Nutricional / Abandono',
    fechaDerivacion: c.fecha_derivacion ? new Date(c.fecha_derivacion).toISOString().slice(0, 10) : '2026-04-12',
    quienDeriva: {
      nombre: c.quien_deriva_nombre || 'Lic. Miriam Soto Paredes',
      cargo: c.quien_deriva_cargo || 'Facilitadora Nutricional',
      telefono: c.quien_deriva_tel || '987-223-114',
    },
    situacionEncontrada: c.situacion_encontrada || '',
    accionesPrevias: c.acciones_previas || 'Visita preliminar realizada',
    soporteFamiliar: {
      tiene: c.tiene_soporte_familiar ?? false,
      detalle: c.detalle_soporte_familiar || 'Sin soporte adicional',
    },
    detalle: c.situacion_encontrada || '',
    sede: c.s_nom || 'Año Nuevo (Comas)',
    vulnerabilidadPuntaje: c.urgencia === 'Alta' ? 90 : (c.urgencia === 'Media' ? 70 : 45),
  };
});

console.log('=== TEST DEL ADAPTADOR DTO ===');
console.log('Beneficiarios adaptados:', beneficiarios.length);
console.log('Ejemplo beneficiario:', JSON.stringify(beneficiarios[0], null, 2));
console.log('Casos sociales adaptados:', casos.length);
console.log('Ejemplo caso social:', JSON.stringify(casos[0], null, 2));
console.log('Sedes adaptadas:', sedes.length);

await db.close();
