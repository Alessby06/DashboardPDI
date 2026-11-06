// ===========================================================================
//  FUNCTION DE VERCEL: AUDITORÍA
// ===========================================================================
//  Ruta: /api/auditoria
//  La bitácora vive en el namespace de cuentas, fuera del alcance del token
//  clínico. Solo esta API, con cookie de sesión, la lee y la escribe.
// ===========================================================================
import { handleAuditoria } from './_cuentaBase.mjs';

export default {
  fetch(request) {
    return handleAuditoria(request, process.env);
  },
};
