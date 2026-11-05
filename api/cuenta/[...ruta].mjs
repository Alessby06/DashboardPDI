// ===========================================================================
//  FUNCTION DE VERCEL: CUENTAS Y PERFIL
// ===========================================================================
//  Ruta: /api/cuenta/*
//  Toda la lógica vive en _cuentaBase.mjs para compartirla con el middleware
//  de desarrollo local.
// ===========================================================================
import { handleCuenta } from '../_cuentaBase.mjs';

export default {
  fetch(request) {
    return handleCuenta(request, process.env);
  },
};
