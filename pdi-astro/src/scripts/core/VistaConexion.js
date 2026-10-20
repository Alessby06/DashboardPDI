// ===========================================================================
//  VISTA CONEXIÓN (retirada)
// ===========================================================================
//  La pantalla de conexión/bloqueo se eliminó a pedido del usuario: la conexión
//  con SurrealDB Cloud es ahora silenciosa. La capa de datos (db.js) sigue
//  reconectando sola con reintentos escalonados y las fallas de escritura se
//  informan por toasts (ToastView), sin overlays ni bloqueos.
// ===========================================================================

export const VistaConexion = { sincronizar: () => {} };

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.VistaConexion = VistaConexion;
}
