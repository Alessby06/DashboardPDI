// ===========================================================================
//  VISTA: EVALUACIÓN SOCIOECONÓMICA
// ===========================================================================
//  Asistente de 7 secciones para el instrumento oficial. Guarda borradores en
//  evaluacion_socioeconomica, calcula el puntaje con los pesos F/J y solo la
//  evaluación aprobada alimenta el caso. La aprobación es de Coordinación.
// ===========================================================================
import {
  fetchEvaluaciones,
  crearEvaluacionSocioeconomica,
  actualizarEvaluacionSocioeconomica,
  enviarEvaluacion,
  resolverEvaluacion,
} from '../core/db.js';
import { calcularEvaluacion } from '../utils/EvaluacionSocioeconomica.js';
import { escapar } from '../utils/HtmlHelper.js';
import { ToastView } from './ToastView.js';

const INSTRUCCION = [
  { v: 'sin-instruccion', l: 'Sin instrucción' },
  { v: 'primaria-incompleta', l: 'Primaria incompleta' },
  { v: 'primaria-completa', l: 'Primaria completa' },
  { v: 'secundaria-incompleta', l: 'Secundaria incompleta' },
  { v: 'secundaria-completa', l: 'Secundaria completa' },
  { v: 'instituto-incompleto', l: 'Instituto incompleto' },
  { v: 'instituto-completo', l: 'Instituto completo' },
  { v: 'universidad-incompleto', l: 'Universidad incompleta' },
  { v: 'universidad-completo', l: 'Universidad completa' },
];

const OCUPACION = [
  { v: 'sin-actividad', l: 'Sin actividad por enfermedad' },
  { v: 'hogar', l: 'Trabajador/a del hogar' },
  { v: 'jubilado', l: 'Jubilado/a' },
  { v: 'estudiante', l: 'Estudiante' },
  { v: 'ama-casa', l: 'Ama de casa' },
  { v: 'microempresario', l: 'Microempresario / independiente estable' },
  { v: 'independiente-inestable', l: 'Independiente inestable / eventual' },
  { v: 'independiente-intermedio', l: 'Independiente intermedio' },
  { v: 'dependiente', l: 'Trabajo dependiente asalariado' },
];

const TIEMPO = [
  { v: 'informal-inestable', l: 'Informal inestable / por contratos' },
  { v: 'informal-estable', l: 'Informal estable (2 años o más)' },
  { v: 'formal-corto', l: 'Formal menos de 4 años / ama de casa' },
  { v: 'formal-largo', l: 'Formal 4 años o más' },
];

const SEGURO = [
  { v: 'SIS', l: 'SIS' },
  { v: 'EsSalud', l: 'EsSalud' },
  { v: 'PNP', l: 'PNP / FFAA' },
  { v: 'Otro', l: 'Otro' },
  { v: 'Ninguno', l: 'No tiene' },
];

const ESTADO_CIVIL = ['Soltero/a', 'Casado/a', 'Conviviente', 'Viudo/a', 'Divorciado/a'];

const TIPO_FAMILIA = ['Nuclear', 'Monoparental', 'Extensa', 'Reconstituida'];

const RIESGOS = ['Drogadicción', 'Delincuencia', 'Desempleo'];

const PROBLEMAS_FAMILIARES = [
  'Violencia física', 'Violencia psicológica', 'Violencia sexual',
  'Violencia económica', 'Abandono familiar', 'Relaciones inadecuadas',
  'Tema legal (DNI, partida, C4)',
];

const PROBLEMAS_EDUCATIVOS = [
  'Trámites de matrícula', 'Útiles escolares', 'Problema de aprendizaje',
  'Violencia escolar', 'Otros',
];

const AYUDAS = ['Silla de ruedas', 'Muletas', 'Terapias', 'Comedor', 'Vaso de leche', 'Iglesia'];

const BIENES = [
  { v: 'propiedades', l: 'Propiedades / terreno / chacra' },
  { v: 'casa', l: 'Casa' },
  { v: 'maquinas', l: 'Máquinas industriales' },
  { v: 'mototaxi', l: 'Mototaxi' },
  { v: 'carro', l: 'Carro' },
  { v: 'moto', l: 'Moto' },
  { v: 'triciclo', l: 'Triciclo / carrito' },
  { v: 'ninguno', l: 'Ninguno' },
];

const IDENTIFICACION = [
  { v: 'bueno', l: 'Bueno' },
  { v: 'más-que-regular', l: 'Más que regular' },
  { v: 'regular', l: 'Regular' },
  { v: 'más-o-menos', l: 'Más o menos' },
  { v: 'deficiente', l: 'Deficiente' },
];

const TIPOS_SALUD = [
  { v: 'crónica', l: 'Enfermedad crónica' },
  { v: 'adicciones', l: 'Adicciones' },
  { v: 'discapacidad-mental', l: 'Discapacidad mental' },
  { v: 'discapacidad-física', l: 'Discapacidad física' },
];

function attr(valor) {
  return escapar(String(valor == null ? '' : valor));
}

function opciones(lista) {
  return (lista || []).map(o => (typeof o === 'string' ? { v: o, l: o } : o));
}

function campo(label, path, valor, opts = {}) {
  const id = 'ev_' + path.replace(/[^a-zA-Z0-9]+/g, '_');
  const full = opts.full ? ' eval-field--full' : '';
  const ph = opts.placeholder ? ` placeholder="${attr(opts.placeholder)}"` : '';
  return `<div class="eval-field${full}">
    <label for="${id}">${escapar(label)}</label>
    <input type="${opts.type || 'text'}" id="${id}" data-path="${attr(path)}" value="${attr(valor)}"${ph}${opts.min != null ? ` min="${opts.min}"` : ''}${opts.max != null ? ` max="${opts.max}"` : ''}${opts.step ? ` step="${opts.step}"` : ''}>
  </div>`;
}

function numero(label, path, valor, opts = {}) {
  return campo(label, path, valor, { ...opts, type: 'number', min: opts.min ?? 0, step: opts.step || 'any' });
}

function area(label, path, valor, opts = {}) {
  const id = 'ev_' + path.replace(/[^a-zA-Z0-9]+/g, '_');
  return `<div class="eval-field${opts.full ? ' eval-field--full' : ''}">
    <label for="${id}">${escapar(label)}</label>
    <textarea id="${id}" data-path="${attr(path)}" rows="${opts.rows || 3}"${opts.placeholder ? ` placeholder="${attr(opts.placeholder)}"` : ''}>${escapar(valor || '')}</textarea>
  </div>`;
}

function select(label, path, valor, lista, opts = {}) {
  const id = 'ev_' + path.replace(/[^a-zA-Z0-9]+/g, '_');
  const items = opciones(lista).map(o => `<option value="${attr(o.v)}"${String(valor) === String(o.v) ? ' selected' : ''}>${escapar(o.l)}</option>`).join('');
  return `<div class="eval-field${opts.full ? ' eval-field--full' : ''}">
    <label for="${id}">${escapar(label)}</label>
    <select id="${id}" data-path="${attr(path)}">
      <option value="">— Seleccionar —</option>${items}
    </select>
  </div>`;
}

function check(label, path, valor) {
  const id = 'ev_' + path.replace(/[^a-zA-Z0-9]+/g, '_');
  return `<label class="eval-check" for="${id}">
    <input type="checkbox" id="${id}" data-path="${attr(path)}"${valor ? ' checked' : ''}>
    <span>${escapar(label)}</span>
  </label>`;
}

function checkGroup(path, valores, lista) {
  const activos = Array.isArray(valores) ? valores : [];
  return `<div class="eval-checks">${opciones(lista).map(o => `
    <label><input type="checkbox" data-path="${attr(path)}" data-multi="1" value="${attr(o.v)}"${activos.includes(o.v) ? ' checked' : ''}> ${escapar(o.l)}</label>
  `).join('')}</div>`;
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, parte) => (acc == null ? undefined : acc[parte]), obj);
}

function setPath(obj, path, valor) {
  const partes = path.split('.');
  let actual = obj;
  partes.forEach((parte, i) => {
    if (i === partes.length - 1) {
      actual[parte] = valor;
      return;
    }
    if (actual[parte] == null) {
      actual[parte] = /^\d+$/.test(partes[i + 1]) ? [] : {};
    }
    actual = actual[parte];
  });
}

function datosIniciales() {
  return {
    padres: { madre: {}, padre: {} },
    composicion: [],
    economia: {
      ingresos: {
        padre: { monto: '', frecuencia: 'mensual' },
        madre: { monto: '', frecuencia: 'mensual' },
        hermanos: { monto: '', frecuencia: 'mensual' },
        pareja: { monto: '', frecuencia: 'mensual' },
        otrosMiembros: { monto: '', frecuencia: 'mensual' },
        otros: { monto: '', frecuencia: 'mensual' },
      },
      egresos: {
        alimentacion: '', alquiler: '', luz: '', gas: '', agua: '',
        telefono: '', internet: '', pension: '', pasajes: '', salud: '',
        deudas: '', otros: '',
      },
      dependientes: '',
    },
    vivienda: {
      tipo: '', ambientes: '', personas: '', tenencia: '', piso: '', pared: '',
      techo: '', agua: '', desague: '', equipamiento: '', bienes: [], electricidad: true,
    },
    salud: { enfermedadCronica: false, miembros: [], ayudas: [] },
    observaciones: {
      tipoFamilia: '', riesgos: [], problematicaFamiliar: [], problematicaEducativa: [],
      identificacion: '', notas: '',
    },
    otros: '',
  };
}

function fusionar(base, datos) {
  const d = datos || {};
  return {
    ...base,
    ...d,
    padres: { ...base.padres, ...(d.padres || {}) },
    economia: {
      ...base.economia,
      ...(d.economia || {}),
      ingresos: { ...base.economia.ingresos, ...(d.economia?.ingresos || {}) },
      egresos: { ...base.economia.egresos, ...(d.economia?.egresos || {}) },
    },
    vivienda: { ...base.vivienda, ...(d.vivienda || {}) },
    salud: { ...base.salud, ...(d.salud || {}) },
    observaciones: { ...base.observaciones, ...(d.observaciones || {}) },
  };
}

const SECCIONES = [
  {
    id: 'padres',
    titulo: 'Padres',
    desc: 'Datos de la madre y el padre o cuidadores principales.',
    html(d) {
      const bloque = (clave, titulo) => {
        const p = d.padres?.[clave] || {};
        return `<div class="eval-section-block">
          <h4>${titulo}</h4>
          <div class="eval-grid">
            ${campo('Nombres', `padres.${clave}.nombres`, p.nombres)}
            ${campo('Apellidos', `padres.${clave}.apellidos`, p.apellidos)}
            ${campo('DNI', `padres.${clave}.dni`, p.dni)}
            ${campo('Teléfono', `padres.${clave}.telefono`, p.telefono, { type: 'tel' })}
            ${campo('Fecha de nacimiento', `padres.${clave}.fechaNacimiento`, p.fechaNacimiento, { type: 'date' })}
            ${numero('Edad (años)', `padres.${clave}.edad`, p.edad, { max: 120 })}
            ${select('Estado civil', `padres.${clave}.estadoCivil`, p.estadoCivil, ESTADO_CIVIL)}
            ${select('Nivel de instrucción', `padres.${clave}.instruccion`, p.instruccion, INSTRUCCION)}
            ${select('Ocupación', `padres.${clave}.ocupacion`, p.ocupacion, OCUPACION)}
            ${campo('Centro laboral / estudios', `padres.${clave}.centroLaboral`, p.centroLaboral)}
            ${campo('Horario', `padres.${clave}.horario`, p.horario)}
            ${select('Seguro', `padres.${clave}.seguro`, p.seguro, SEGURO)}
          </div>
        </div>`;
      };
      return bloque('madre', 'Madre / adolescente madre') + bloque('padre', 'Padre');
    },
  },
  {
    id: 'composicion',
    titulo: 'Composición familiar',
    desc: 'Personas que comparten la vivienda o comen de la misma olla.',
    html(d) {
      const lista = Array.isArray(d.composicion) ? d.composicion : [];
      const bloques = lista.map((m, i) => `
        <div class="eval-member">
          <div class="eval-member-head">
            <strong>Miembro ${i + 1}</strong>
            <button type="button" class="eval-mini" data-action="remove-miembro" data-index="${i}">Quitar</button>
          </div>
          <div class="eval-grid">
            ${campo('Parentesco', `composicion.${i}.parentesco`, m.parentesco)}
            ${campo('Nombres y apellidos', `composicion.${i}.nombres`, m.nombres)}
            ${campo('Fecha de nacimiento', `composicion.${i}.fechaNacimiento`, m.fechaNacimiento, { type: 'date' })}
            ${numero('Edad (años)', `composicion.${i}.edad`, m.edad, { max: 120 })}
            ${campo('DNI', `composicion.${i}.dni`, m.dni)}
            ${select('Nivel de instrucción', `composicion.${i}.instruccion`, m.instruccion, INSTRUCCION)}
            ${select('Ocupación', `composicion.${i}.ocupacion`, m.ocupacion, OCUPACION)}
            ${campo('Centro laboral / estudios', `composicion.${i}.centro`, m.centro)}
            ${select('Tiempo de servicio', `composicion.${i}.tiempoServicio`, m.tiempoServicio, TIEMPO)}
            ${select('Estado civil', `composicion.${i}.estadoCivil`, m.estadoCivil, ESTADO_CIVIL)}
            ${select('Seguro', `composicion.${i}.seguro`, m.seguro, SEGURO)}
          </div>
        </div>`).join('');
      return `<div class="eval-section-block">
        <h4>Miembros del hogar</h4>
        <p class="eval-empty">Incluye al usuario solo si comparte la olla; no repitas a la madre ni al padre.</p>
        ${bloques || '<p class="eval-empty">Aún no agregaste miembros.</p>'}
        <button type="button" class="eval-add" data-action="add-miembro"${lista.length >= 5 ? ' disabled' : ''}>+ Agregar miembro</button>
      </div>`;
    },
  },
  {
    id: 'economia',
    titulo: 'Situación económica',
    desc: 'Ingresos, egresos y personas dependientes del hogar.',
    html(d) {
      const e = d.economia || {};
      const ingreso = (clave, label) => {
        const item = e.ingresos?.[clave] || {};
        return `<div class="eval-member">
          <strong>${label}</strong>
          <div class="eval-grid">
            ${numero('Monto (S/)', `economia.ingresos.${clave}.monto`, item.monto)}
            ${select('Frecuencia', `economia.ingresos.${clave}.frecuencia`, item.frecuencia || 'mensual', [
              { v: 'diario', l: 'Diario' }, { v: 'semanal', l: 'Semanal' },
              { v: 'quincenal', l: 'Quincenal' }, { v: 'mensual', l: 'Mensual' },
            ])}
          </div>
        </div>`;
      };
      const egreso = (clave, label) => numero(label, `economia.egresos.${clave}`, e.egresos?.[clave]);
      return `<div class="eval-section-block">
        <h4>Ingresos líquidos</h4>
        <div class="eval-grid">
          ${ingreso('padre', 'Padre')}
          ${ingreso('madre', 'Madre')}
          ${ingreso('hermanos', 'Hermanos')}
          ${ingreso('pareja', 'Pareja')}
          ${ingreso('otrosMiembros', 'Otros miembros')}
          ${ingreso('otros', 'Otros')}
        </div>
      </div>
      <div class="eval-section-block">
        <h4>Egresos mensuales (S/)</h4>
        <div class="eval-grid eval-grid--3">
          ${egreso('alimentacion', 'Alimentación')}
          ${egreso('alquiler', 'Alquiler de vivienda')}
          ${egreso('luz', 'Luz')}
          ${egreso('gas', 'Gas')}
          ${egreso('agua', 'Agua')}
          ${egreso('telefono', 'Teléfono / celular')}
          ${egreso('internet', 'Cable / internet')}
          ${egreso('pension', 'Pensión de estudios')}
          ${egreso('pasajes', 'Pasajes')}
          ${egreso('salud', 'Consulta / medicina')}
          ${egreso('deudas', 'Deudas')}
          ${egreso('otros', 'Otros')}
        </div>
        ${numero('Personas dependientes (comen de la misma olla)', 'economia.dependientes', e.dependientes, { full: true, min: 1 })}
      </div>`;
    },
  },
  {
    id: 'vivienda',
    titulo: 'Vivienda',
    desc: 'Tipo, espacio, tenencia, materiales, servicios y equipamiento.',
    html(d) {
      const v = d.vivienda || {};
      return `<div class="eval-section-block">
        <h4>Características de la vivienda</h4>
        <div class="eval-grid">
          ${select('Tipo', 'vivienda.tipo', v.tipo, [
            { v: 'independiente', l: 'Independiente (casa, departamento)' },
            { v: 'compartida', l: 'Multifamiliar (servicios compartidos)' },
            { v: 'alojado', l: 'Multifamiliar (alojado)' },
          ])}
          ${select('Tenencia', 'vivienda.tenencia', v.tenencia, [
            { v: 'familiar', l: 'De algún familiar' },
            { v: 'alquilada', l: 'Alquilada' },
            { v: 'propia', l: 'Propia' },
            { v: 'guardiania', l: 'Guardianía' },
            { v: 'terreno', l: 'Terreno en trámite' },
          ])}
          ${numero('N° de ambientes', 'vivienda.ambientes', v.ambientes, { min: 1 })}
          ${numero('Personas en la vivienda', 'vivienda.personas', v.personas, { min: 1 })}
          ${select('Material del piso', 'vivienda.piso', v.piso, [
            { v: 'vinilicos', l: 'Vinílicos o similares' },
            { v: 'losetas', l: 'Losetas / terrazos' },
            { v: 'madera', l: 'Madera (parquet)' },
            { v: 'cemento', l: 'Cemento pulido' },
            { v: 'tierra', l: 'Tierra afirmada' },
            { v: 'falso-piso', l: 'Falso piso' },
          ])}
          ${select('Material de paredes', 'vivienda.pared', v.pared, [
            { v: 'ladrillo-sin-tarrajeo', l: 'Ladrillo sin tarrajear' },
            { v: 'ladrillo-acabado', l: 'Ladrillo concreto acabado' },
            { v: 'piedra', l: 'Piedra o sillar' },
            { v: 'adobe', l: 'Adobe' },
            { v: 'madera-prefabricada', l: 'Madera prefabricada' },
            { v: 'madera-provisional', l: 'Madera provisional' },
            { v: 'estera', l: 'Estera / plástico' },
          ])}
          ${select('Material de techos', 'vivienda.techo', v.techo, [
            { v: 'concreto', l: 'Concreto armado' },
            { v: 'estera', l: 'Estera / plástico' },
            { v: 'calamina', l: 'Calamina' },
            { v: 'cana', l: 'Caña con torta de barro' },
          ])}
          ${select('Abastecimiento de agua', 'vivienda.agua', v.agua, [
            { v: 'red-dentro', l: 'Red pública dentro de la vivienda' },
            { v: 'red-fuera', l: 'Red pública fuera de la vivienda' },
            { v: 'pilon', l: 'Pilón de uso público' },
            { v: 'cisterna', l: 'Camión cisterna' },
          ])}
          ${select('Servicio higiénico', 'vivienda.desague', v.desague, [
            { v: 'red-dentro', l: 'Red pública dentro de la vivienda' },
            { v: 'red-fuera', l: 'Red pública fuera de la vivienda' },
            { v: 'pozo', l: 'Pozo ciego / letrina' },
            { v: 'no-tiene', l: 'No tiene' },
          ])}
          ${select('Equipamiento', 'vivienda.equipamiento', v.equipamiento, [
            { v: '1-3', l: '1 a 3 cosas' },
            { v: '4-6', l: '4 a 6 cosas' },
            { v: '7-9', l: '7 a 9 cosas' },
            { v: '10+', l: 'Más de 10 cosas' },
          ])}
        </div>
        <div class="eval-field eval-field--full">
          <span class="eval-label">Bienes y propiedades</span>
          ${checkGroup('vivienda.bienes', v.bienes, BIENES)}
        </div>
        ${check('Tiene electricidad', 'vivienda.electricidad', v.electricidad !== false)}
      </div>`;
    },
  },
  {
    id: 'salud',
    titulo: 'Salud',
    desc: 'Enfermedad crónica, discapacidad y ayudas que recibe la familia.',
    html(d) {
      const s = d.salud || {};
      const miembros = Array.isArray(s.miembros) ? s.miembros : [];
      const bloques = miembros.map((m, i) => `
        <div class="eval-member">
          <div class="eval-member-head">
            <strong>Miembro ${i + 1}</strong>
            <button type="button" class="eval-mini" data-action="remove-salud" data-index="${i}">Quitar</button>
          </div>
          <div class="eval-grid">
            ${campo('Quién (parentesco)', `salud.miembros.${i}.parentesco`, m.parentesco)}
            ${select('Tipo', `salud.miembros.${i}.tipo`, m.tipo, TIPOS_SALUD)}
            ${campo('Hospital / institución', `salud.miembros.${i}.hospital`, m.hospital)}
            ${numero('Año de diagnóstico', `salud.miembros.${i}.anio`, m.anio, { min: 1900, max: 2100 })}
          </div>
        </div>`).join('');
      return `<div class="eval-section-block">
        <h4>Salud del hogar</h4>
        ${check('Hay miembros con enfermedad crónica o discapacidad', 'salud.enfermedadCronica', s.enfermedadCronica)}
        ${bloques || '<p class="eval-empty">Sin miembros registrados.</p>'}
        <button type="button" class="eval-add" data-action="add-salud"${miembros.length >= 3 ? ' disabled' : ''}>+ Agregar miembro</button>
      </div>
      <div class="eval-section-block">
        <h4>Ayudas que recibe</h4>
        ${checkGroup('salud.ayudas', s.ayudas, AYUDAS)}
      </div>`;
    },
  },
  {
    id: 'observaciones',
    titulo: 'Observaciones',
    desc: 'Tipo de familia, riesgos y problemáticas identificadas.',
    html(d) {
      const o = d.observaciones || {};
      return `<div class="eval-section-block">
        <h4>Tipo de familia</h4>
        ${select('Tipo de familia', 'observaciones.tipoFamilia', o.tipoFamilia, TIPO_FAMILIA)}
      </div>
      <div class="eval-section-block">
        <h4>Riesgos de la familia</h4>
        ${checkGroup('observaciones.riesgos', o.riesgos, RIESGOS)}
      </div>
      <div class="eval-section-block">
        <h4>Problemática familiar</h4>
        ${checkGroup('observaciones.problematicaFamiliar', o.problematicaFamiliar, PROBLEMAS_FAMILIARES)}
      </div>
      <div class="eval-section-block">
        <h4>Problemática educativa</h4>
        ${checkGroup('observaciones.problematicaEducativa', o.problematicaEducativa, PROBLEMAS_EDUCATIVOS)}
      </div>
      <div class="eval-section-block">
        ${area('Observaciones del evaluador', 'observaciones.notas', o.notas, { full: true, rows: 3 })}
      </div>`;
    },
  },
  {
    id: 'otros',
    titulo: 'Cierre',
    desc: 'Identificación con el proyecto y observaciones finales.',
    html(d) {
      const o = d.observaciones || {};
      return `<div class="eval-section-block">
        <h4>Identificación con el proyecto educativo</h4>
        <p class="eval-empty">Valoración del evaluador según la rúbrica: bueno 100, más que regular 75, regular 50, más o menos 25, deficiente 0.</p>
        ${select('Nivel de identificación', 'observaciones.identificacion', o.identificacion, IDENTIFICACION)}
      </div>
      <div class="eval-section-block">
        ${area('Otros datos relevantes', 'otros', d.otros, { full: true, rows: 3 })}
      </div>`;
    },
  },
];

export const EvaluacionView = {
  persona: null,
  caso: null,
  evaluaciones: [],
  evalId: '',
  estado: 'borrador',
  datos: datosIniciales(),
  calculo: null,
  paso: 0,
  soloLectura: false,
  _bound: false,
  _cargado: false,
  _dirty: false,
  _guardando: false,

  init() {
    const body = document.getElementById('evalStepBody');
    if (!body) return;
    if (!this._bound) {
      this._bound = true;
      document.getElementById('evalPrev')?.addEventListener('click', () => this.irPaso(this.paso - 1));
      document.getElementById('evalNext')?.addEventListener('click', () => this.irPaso(this.paso + 1));
      document.getElementById('evalSave')?.addEventListener('click', () => this.guardar());
      document.getElementById('evalSend')?.addEventListener('click', () => this.enviar());
      document.getElementById('evalSteps')?.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-step]');
        if (boton) this.irPaso(Number(boton.dataset.step));
      });
      document.getElementById('evalHistory')?.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-eval-id]');
        if (boton) this.abrirEvaluacion(boton.dataset.evalId);
      });
      document.getElementById('evalBanner')?.addEventListener('click', (e) => {
        const accion = e.target.closest('[data-eval-action]')?.dataset.evalAction;
        if (accion === 'aprobada' || accion === 'rechazada') this.resolver(accion);
        if (accion === 'nueva-version') this.nuevaVersion();
      });
      body.addEventListener('input', (e) => this.cambiar(e.target));
      body.addEventListener('change', (e) => this.cambiar(e.target));
      body.addEventListener('click', (e) => this.accionFila(e));
      document.addEventListener('pdi:datos-actualizados', () => {
        if (!this._cargado) this.cargar();
      });
    }
    this.cargar();
  },

  async cargar() {
    if (this._cargado) return;
    const params = new URLSearchParams(location.search);
    const personaParam = params.get('persona') || '';
    const casoParam = params.get('caso') || '';
    const evalParam = params.get('eval') || '';
    const esperar = (intentos = 0) => {
      const lista = window.PDI?.BeneficiarioModel?.getAll?.() || [];
      if (!lista.length && intentos < 40) {
        setTimeout(() => esperar(intentos + 1), 250);
        return;
      }
      this._resolver(personaParam, casoParam, evalParam, lista);
    };
    esperar();
  },

  async _resolver(personaParam, casoParam, evalParam, beneficiarios) {
    const norm = (v) => String(v || '').replace(/[⟨⟩]/g, '');
    let persona = beneficiarios.find(b =>
      norm(b._personaId) === norm(personaParam)
      || String(b.codigo) === String(personaParam)
      || String(b.id) === String(personaParam));

    // Un caso puede seguir activo aunque la persona ya esté inactiva y, por
    // tanto, fuera de BeneficiarioModel. En ese caso se usa el caso como
    // fuente mínima para no bloquear la evaluación.
    if (!persona && casoParam) {
      const caso = (window.PDI?.CasoSocialModel?.getAll?.() || []).find(c =>
        norm(c._casoId) === norm(casoParam) || String(c.codigo) === String(casoParam));
      if (caso?._personaId) {
        persona = {
          _personaId: caso._personaId,
          codigo: caso.codigo || '',
          nombres: caso.usuario || '',
          apellidos: '',
          sede: caso.sede || '',
        };
      }
    }

    if (!persona) {
      this._banner('No se encontró el usuario. Abre la evaluación desde un caso o desde el expediente.', 'danger');
      document.getElementById('evalUsuario').textContent = 'Sin usuario';
      document.getElementById('evalMeta').textContent = 'Vuelve al caso e inténtalo de nuevo.';
      return;
    }
    this.persona = persona;
    const casos = window.PDI?.CasoSocialModel?.getAll?.() || [];
    this.caso = casos.find(c =>
      norm(c._casoId) === norm(casoParam)
      || String(c.codigo) === String(casoParam)
      || (String(c._personaId) === String(persona._personaId) && c.etapa !== 'cerrado')) || null;

    try {
      this.evaluaciones = await fetchEvaluaciones(persona._personaId);
    } catch {
      this.evaluaciones = [];
    }

    let elegida = evalParam
      ? this.evaluaciones.find(e => String(e._evalId) === String(evalParam))
      : null;
    if (!elegida) {
      elegida = this.evaluaciones.find(e => e.estado === 'borrador' || e.estado === 'rechazada')
        || this.evaluaciones.find(e => e.estado === 'enviada')
        || this.evaluaciones[0]
        || null;
    }

    if (elegida) {
      this.evalId = elegida._evalId;
      this.estado = elegida.estado;
      this.datos = fusionar(datosIniciales(), elegida.datos || {});
    } else {
      this.evalId = '';
      this.estado = 'borrador';
      this.datos = datosIniciales();
    }

    this._cargado = true;
    this.render();
  },

  render() {
    const nombre = this.persona ? `${this.persona.nombres || ''} ${this.persona.apellidos || ''}`.trim() : 'Evaluación socioeconómica';
    document.getElementById('evalUsuario').textContent = nombre || 'Evaluación socioeconómica';
    const meta = [
      this.persona?.codigo,
      this.persona?.sede,
      this.caso?.folio ? `Caso ${this.caso.folio}` : '',
      this.estado ? `Estado: ${this.estado}` : '',
    ].filter(Boolean).join(' · ');
    document.getElementById('evalMeta').textContent = meta || 'Selecciona un usuario para comenzar.';
    const volver = document.getElementById('evalVolver');
    if (volver) {
      volver.href = this.persona?.codigo
        ? `/expediente?codigo=${encodeURIComponent(this.persona.codigo)}`
        : '/social';
    }
    this.soloLectura = this.estado === 'aprobada' || this.estado === 'enviada';
    this.renderPasos();
    this.renderPaso();
    this.renderScore();
    this.renderHistorial();
    this.renderBanner();
    this.actualizarBotones();
  },

  renderPasos() {
    const contenedor = document.getElementById('evalSteps');
    if (!contenedor) return;
    contenedor.innerHTML = SECCIONES.map((s, i) => `
      <button type="button" class="eval-step${i === this.paso ? ' is-active' : ''}${i < this.paso ? ' is-done' : ''}" data-step="${i}">
        <span class="eval-step-num">${i + 1}</span>
        <span>${escapar(s.titulo)}</span>
      </button>
    `).join('');
  },

  renderPaso() {
    const seccion = SECCIONES[this.paso];
    const cuerpo = document.getElementById('evalStepBody');
    if (!seccion || !cuerpo) return;
    document.getElementById('evalStepNum').textContent = `${this.paso + 1} / ${SECCIONES.length}`;
    document.getElementById('evalStepTitle').textContent = seccion.titulo;
    document.getElementById('evalStepDesc').textContent = seccion.desc;
    cuerpo.innerHTML = seccion.html(this.datos);
    if (this.soloLectura) {
      cuerpo.querySelectorAll('input, select, textarea, button').forEach(el => {
        el.disabled = true;
      });
    }
    const prev = document.getElementById('evalPrev');
    const next = document.getElementById('evalNext');
    if (prev) prev.disabled = this.paso === 0;
    if (next) {
      next.disabled = this.paso === SECCIONES.length - 1;
      next.textContent = this.paso === SECCIONES.length - 1 ? 'Fin' : 'Siguiente';
    }
  },

  irPaso(paso) {
    if (paso < 0 || paso >= SECCIONES.length) return;
    this.paso = paso;
    this.renderPasos();
    this.renderPaso();
  },

  cambiar(el) {
    if (!el || !el.dataset?.path || this.soloLectura) return;
    const path = el.dataset.path;
    if (el.type === 'checkbox') {
      if (el.dataset.multi === '1') {
        const valores = [...document.querySelectorAll('#evalStepBody input[data-multi="1"]')]
          .filter(x => x.dataset.path === path && x.checked)
          .map(x => x.value);
        setPath(this.datos, path, valores);
      } else {
        setPath(this.datos, path, el.checked);
      }
    } else if (el.type === 'number') {
      setPath(this.datos, path, el.value === '' ? '' : Number(el.value));
    } else {
      setPath(this.datos, path, el.value);
    }
    this._dirty = true;
    this.recalcular();
  },

  recalcular() {
    this.calculo = calcularEvaluacion(this.datos);
    this.renderScore();
  },

  renderScore() {
    const r = this.calculo || calcularEvaluacion(this.datos);
    const vacio = r.dimensiones.every(d => d.puntaje === 0);
    const valor = document.getElementById('evalScoreValor');
    const clase = document.getElementById('evalScoreClase');
    const exo = document.getElementById('evalScoreExoneracion');
    if (valor) valor.textContent = vacio ? '—' : `${r.puntaje}`;
    if (clase) clase.textContent = vacio ? 'Sin evaluar' : r.clasificacion;
    if (exo) exo.textContent = vacio ? '' : `Exoneración sugerida: ${r.exoneracionSugerida}`;
    const contenedor = document.getElementById('evalDimensions');
    if (contenedor) {
      contenedor.innerHTML = r.dimensiones.map(d => `
        <div class="eval-dim">
          <div class="eval-dim-row"><span>${escapar(d.etiqueta)}</span><strong>${d.puntaje}</strong></div>
          <div class="eval-dim-bar"><span style="width:${Math.max(0, Math.min(100, d.puntaje))}%"></span></div>
        </div>
      `).join('');
    }
  },

  renderHistorial() {
    const contenedor = document.getElementById('evalHistory');
    if (!contenedor) return;
    if (!this.evaluaciones.length) {
      contenedor.innerHTML = '<p class="eval-empty">Aún no hay evaluaciones guardadas.</p>';
      return;
    }
    contenedor.innerHTML = this.evaluaciones.map(e => `
      <div class="eval-history-row">
        <strong>v${e.version}</strong>
        <span>${escapar(e.fecha || '')} · ${escapar(e.clasificacion || 'Sin clasificar')}</span>
        <span>${e.puntajeTotal != null ? `${e.puntajeTotal}/100` : '—'} · ${escapar(e.estado)}</span>
        <button type="button" data-eval-id="${attr(e._evalId)}">Abrir</button>
      </div>
    `).join('');
  },

  renderBanner() {
    const banner = document.getElementById('evalBanner');
    if (!banner) return;
    const rol = localStorage.getItem('pdi_active_role') || 'social';
    const puedeResolver = rol === 'coord' || rol === 'admin';
    if (this.estado === 'aprobada') {
      banner.hidden = false;
      banner.className = 'eval-banner is-ok';
      banner.innerHTML = `<div><strong>Evaluación aprobada.</strong> Puedes crear una nueva versión si la situación cambió.</div>
        <button type="button" class="btn-action btn-secondary" data-eval-action="nueva-version">Nueva versión</button>`;
      return;
    }
    if (this.estado === 'enviada') {
      banner.hidden = false;
      banner.className = 'eval-banner is-warning';
      banner.innerHTML = `<div><strong>Pendiente de revisión de Coordinación.</strong> ${puedeResolver ? 'Revisa el puntaje y decide.' : 'No se puede editar mientras está en revisión.'}</div>
        ${puedeResolver ? `<div style="display:flex; flex-direction:column; gap:6px; min-width:220px;">
          <textarea id="evalComentario" rows="2" placeholder="Comentario de la decisión (opcional)" style="width:100%; padding:7px; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); background:var(--surface-1); color:var(--text-main); font-family:var(--ui-font);"></textarea>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-action primary" data-eval-action="aprobada">Aprobar</button>
            <button type="button" class="btn-action btn-secondary" data-eval-action="rechazada">Rechazar</button>
          </div>
        </div>` : ''}`;
      return;
    }
    if (this.estado === 'rechazada') {
      banner.hidden = false;
      banner.className = 'eval-banner is-danger';
      banner.innerHTML = `<div><strong>Evaluación rechazada.</strong> ${escapar(this.evaluaciones.find(e => e._evalId === this.evalId)?.comentario || 'Corrige lo observado y vuelve a enviarla.')}</div>`;
      return;
    }
    banner.hidden = true;
    banner.innerHTML = '';
  },

  actualizarBotones() {
    const save = document.getElementById('evalSave');
    const send = document.getElementById('evalSend');
    const editable = !this.soloLectura;
    if (save) save.hidden = !editable;
    if (send) send.hidden = !editable;
    if (send) send.disabled = this._guardando;
    if (save) save.disabled = this._guardando;
  },

  _feedback(texto, tipo = '') {
    const el = document.getElementById('evalFeedback');
    if (!el) return;
    el.textContent = texto || '';
    el.className = 'eval-feedback' + (tipo ? ' is-' + tipo : '');
  },

  _banner(texto, tipo = 'warning') {
    const el = document.getElementById('evalBanner');
    if (!el) return;
    el.hidden = false;
    el.className = `eval-banner is-${tipo}`;
    el.innerHTML = `<div>${escapar(texto)}</div>`;
  },

  _bloquear(activo) {
    this._guardando = activo;
    this.actualizarBotones();
  },

  async guardar() {
    if (!this.persona || this.soloLectura) return false;
    this._bloquear(true);
    try {
      const calculo = calcularEvaluacion(this.datos);
      const comun = {
        personaId: this.persona._personaId,
        casoId: this.caso?._casoId || '',
        datos: this.datos,
        calculo,
        evaluador: localStorage.getItem('pdi_usuario_nombre') || 'Equipo PDI',
        nombres: this.persona.nombres,
        apellidos: this.persona.apellidos,
        codigo: this.persona.codigo,
      };
      const res = this.evalId
        ? await actualizarEvaluacionSocioeconomica(this.evalId, comun)
        : await crearEvaluacionSocioeconomica(comun);
      if (!res?.ok) {
        this._feedback(res?.error || 'No se pudo guardar la evaluación.', 'error');
        return false;
      }
      this.evalId = res.evaluacion?._evalId || this.evalId;
      this.estado = res.evaluacion?.estado || 'borrador';
      this.calculo = calculo;
      this._dirty = false;
      this._feedback('Borrador guardado.', 'ok');
      const url = new URL(location.href);
      if (this.evalId) url.searchParams.set('eval', this.evalId);
      history.replaceState(null, '', url);
      await this._recargarHistorial();
      this.render();
      ToastView.show('Evaluación guardada', 'El borrador quedó en la nube.', 'success');
      return true;
    } finally {
      this._bloquear(false);
    }
  },

  async enviar() {
    if (!this.persona || this.soloLectura) return;
    const guardado = await this.guardar();
    if (!guardado || !this.evalId) return;
    const res = await enviarEvaluacion(this.evalId);
    if (!res?.ok) {
      this._feedback(res?.error || 'No se pudo enviar la evaluación.', 'error');
      return;
    }
    this.estado = 'enviada';
    this._feedback('Evaluación enviada a Coordinación.', 'ok');
    await this._recargarHistorial();
    this.render();
    ToastView.show('Evaluación enviada', 'Coordinación puede revisarla.', 'success');
  },

  async resolver(decision) {
    if (!this.evalId) return;
    const comentario = document.getElementById('evalComentario')?.value || '';
    const res = await resolverEvaluacion(
      this.evalId, decision, comentario,
      localStorage.getItem('pdi_usuario_nombre') || 'Coordinación',
    );
    if (!res?.ok) {
      this._feedback(res?.error || 'No se pudo resolver la evaluación.', 'error');
      return;
    }
    this.estado = res.evaluacion?.estado || decision;
    this.soloLectura = true;
    await this._recargarHistorial();
    this.render();
    ToastView.show(decision === 'aprobada' ? 'Evaluación aprobada' : 'Evaluación rechazada',
      decision === 'aprobada' ? 'El caso ya tiene un puntaje oficial.' : 'Trabajo Social puede corregirla.', 'success');
  },

  async nuevaVersion() {
    if (!this.persona) return;
    const res = await crearEvaluacionSocioeconomica({
      personaId: this.persona._personaId,
      casoId: this.caso?._casoId || '',
      datos: this.datos,
      calculo: calcularEvaluacion(this.datos),
      evaluador: localStorage.getItem('pdi_usuario_nombre') || 'Equipo PDI',
      nombres: this.persona.nombres,
      apellidos: this.persona.apellidos,
      codigo: this.persona.codigo,
    });
    if (!res?.ok) {
      this._feedback(res?.error || 'No se pudo crear la nueva versión.', 'error');
      return;
    }
    this.evalId = res.evaluacion?._evalId || '';
    this.estado = 'borrador';
    this.soloLectura = false;
    await this._recargarHistorial();
    this.render();
    ToastView.show('Nueva versión', 'Se creó un borrador con los datos actuales.', 'success');
  },

  async _recargarHistorial() {
    if (!this.persona) return;
    try {
      this.evaluaciones = await fetchEvaluaciones(this.persona._personaId);
    } catch {
      /* sin conexión: se conserva la lista anterior */
    }
  },

  abrirEvaluacion(evalId) {
    const ev = this.evaluaciones.find(e => String(e._evalId) === String(evalId));
    if (!ev) return;
    this.evalId = ev._evalId;
    this.estado = ev.estado;
    this.datos = fusionar(datosIniciales(), ev.datos || {});
    this.paso = 0;
    this.soloLectura = ev.estado === 'aprobada' || ev.estado === 'enviada';
    const url = new URL(location.href);
    url.searchParams.set('eval', ev._evalId);
    history.replaceState(null, '', url);
    this.render();
  },

  accionFila(evento) {
    const boton = evento.target.closest('[data-action]');
    if (!boton) return;
    const accion = boton.dataset.action;
    const index = Number(boton.dataset.index);
    if (accion === 'add-miembro') {
      if (!Array.isArray(this.datos.composicion)) this.datos.composicion = [];
      if (this.datos.composicion.length >= 5) return;
      this.datos.composicion.push({});
      this.renderPaso();
    }
    if (accion === 'remove-miembro') {
      this.datos.composicion.splice(index, 1);
      this.renderPaso();
    }
    if (accion === 'add-salud') {
      if (!Array.isArray(this.datos.salud.miembros)) this.datos.salud.miembros = [];
      if (this.datos.salud.miembros.length >= 3) return;
      this.datos.salud.miembros.push({});
      this.renderPaso();
    }
    if (accion === 'remove-salud') {
      this.datos.salud.miembros.splice(index, 1);
      this.renderPaso();
    }
  },
};

if (typeof window !== 'undefined') {
  window.PDI = window.PDI || {};
  window.PDI.EvaluacionView = EvaluacionView;
}
