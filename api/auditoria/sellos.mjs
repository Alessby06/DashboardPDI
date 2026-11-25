// ===========================================================================
//  FUNCTION DE VERCEL: SELLO DE AUDITORÍA
// ===========================================================================
//  Ruta: POST /api/auditoria/sellos
//
//  Entrega un sello firmado (identidad + rol + IP + vencimiento) para que el
//  navegador pueda escribir un evento en la outbox clínica cuando la API de
//  auditoría no responde. El sello no lleva contraseña ni cookie: solo un HMAC
//  que el servidor verifica al drenar la outbox.
// ===========================================================================
import { handleSello } from '../_cuentaBase.mjs';

export default {
  fetch(request) {
    return handleSello(request, process.env);
  },
};
