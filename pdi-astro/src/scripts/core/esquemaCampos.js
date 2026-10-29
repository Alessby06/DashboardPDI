// ===========================================================================
//  Campos que cambian de nombre durante la migración de esquema
// ===========================================================================
//  Producción conserva el esquema anterior (persona_id / persona_vinculada /
//  menor_id). Staging y la migración futura usan el nuevo (usuario_id /
//  usuario_vinculado / firmante_id). La bandera
//  PUBLIC_ESQUEMA_USUARIO decide cuál se escribe.
//
//  Este módulo concentra la decisión para que las consultas no vuelvan a
//  mezclar nombres de las dos etapas. En particular, el vínculo con el
//  apoderado usa `vive_con_menor` en producción y `vive_con_usuario` en el
//  esquema nuevo; escribir el nombre nuevo contra la tabla vieja es lo que
//  rompía el alta y la edición del expediente.
// ===========================================================================

/** Campo que identifica al usuario en la tabla de inscripción. */
export function campoUsuario(esquemaUsuario) {
  return esquemaUsuario ? "usuario_id" : "persona_id";
}

/** Campo booleano del vínculo que indica que el menor vive con el cuidador. */
export function campoViveCon(esquemaUsuario) {
  return esquemaUsuario ? "vive_con_usuario" : "vive_con_menor";
}
