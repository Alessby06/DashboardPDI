// ===========================================================================
//  AVATARES DE USUARIO
// ===========================================================================
//  Las chicas sin fotografia usan uno de los cuatro retratos vectoriales de
//  /avatars. La eleccion es aleatoria pero se fija por usuaria en localStorage,
//  de modo que el mismo rostro se conserve entre el padron y el expediente.
//  Los chicos usan sus iniciales sobre el color del servicio.
//
//  Este modulo no toca el DOM: devuelve datos y, como mucho, el HTML del
//  avatar circular. Asi lo pueden usar las dos vistas sin duplicar la regla.
import { escapar } from "./HtmlHelper.js";

export const RETRATOS_F = ["/avatars/f1.svg", "/avatars/f2.svg", "/avatars/f3.svg", "/avatars/f4.svg"];
const CLAVE_RETRATO = "pdi_retrato_f_";

/** Dato estable que identifica al usuario para fijar su retrato. */
export function avatarSeed(b) {
  return b?.id ?? b?.codigo ?? b?.dni ?? `${b?.nombres || ""}${b?.apellidos || ""}`;
}

/** El sexo llega como "F"/"M" o como "Femenino"/"Masculino". */
export function esFemenino(sexo) {
  return String(sexo || "").trim().toUpperCase().startsWith("F");
}

/** Iniciales de nombre y apellido, o "?" si no hay datos. */
export function inicialesDe(b) {
  const iniciales = `${(b?.nombres || "").charAt(0)}${(b?.apellidos || "").charAt(0)}`.toUpperCase();
  return iniciales || "?";
}

/** Color del servicio, el mismo que usa el avatar del padron. */
export function claseServicio(b) {
  const principal = (Array.isArray(b?.estrategias) && b.estrategias[0]) || b?.estrategia || "";
  if (/casita/i.test(principal)) return "serv-casita";
  if (/pastoral|social|asp/i.test(principal)) return "serv-pastoral";
  if (/biblioteca/i.test(principal)) return "serv-biblioteca";
  return "serv-desayuno";
}

/**
 * Retrato femenino estable por usuaria. La primera vez se elige al azar y se
 * guarda; las siguientes cargas reutilizan el mismo indice.
 */
export function retratoFemenino(seed) {
  const llave = CLAVE_RETRATO + String(seed ?? "");
  try {
    const guardado = Number.parseInt(window.localStorage.getItem(llave), 10);
    if (Number.isInteger(guardado) && guardado >= 0 && guardado < RETRATOS_F.length) {
      return RETRATOS_F[guardado];
    }
  } catch {
    /* sin almacenamiento: la eleccion vive solo en esta carga */
  }

  const indice = Math.floor(Math.random() * RETRATOS_F.length);
  try {
    window.localStorage.setItem(llave, String(indice));
  } catch {
    /* idem */
  }
  return RETRATOS_F[indice];
}

/**
 * Avatar circular: retrato para las chicas, iniciales para los chicos.
 * `claseExtra` permite ajustar tamano o contexto desde la vista.
 */
export function avatarHtml(b, claseExtra = "") {
  const clase = ["padron-avatar", claseServicio(b), claseExtra].filter(Boolean).join(" ");
  if (esFemenino(b?.sexo)) {
    return `<div class="${clase} is-retrato" aria-hidden="true"><img src="${retratoFemenino(avatarSeed(b))}" alt=""></div>`;
  }
  return `<div class="${clase}" aria-hidden="true">${escapar(inicialesDe(b))}</div>`;
}
