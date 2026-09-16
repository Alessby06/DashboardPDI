// Controlador: Gestión de Menores Beneficiarios y Expediente
// Maneja el 100% de los campos normativos de inscripción PDI
import { BeneficiarioModel } from '../models/BeneficiarioModel.js';
import { CasoSocialModel } from '../models/CasoSocialModel.js';
import { AuditModel } from '../models/AuditModel.js';
import { BeneficiariosView } from '../views/BeneficiariosView.js';
import { ModalView } from '../views/ModalView.js';
import { ToastView } from '../views/ToastView.js';
import { CanvasHelper } from '../utils/CanvasHelper.js';

export const BeneficiarioController = {
  signatureCanvasHelper: null,

  initSignature() {
    this.signatureCanvasHelper = CanvasHelper.init("canvasSignature");
  },

  clearSignature() {
    if (this.signatureCanvasHelper) {
      this.signatureCanvasHelper.clear();
    }
  },

  search(query) {
    const model = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const view = window.PDI?.BeneficiariosView || BeneficiariosView;
    const filtered = model.search(query);
    view.renderTable(filtered);
  },

  openExpediente(id) {
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const cModel = window.PDI?.CasoSocialModel || CasoSocialModel;
    const mView = window.PDI?.ModalView || ModalView;

    const menor = bModel.getById(id);
    if (!menor) return;

    const casos = cModel.getAll();
    const caso = casos.find(c => c.codigo === menor.codigo);

    mView.openExpediente(menor, caso);
  },

  saveNuevoMenor(event, onComplete) {
    event.preventDefault();

    const getVal = (id, fallback = "") => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : fallback;
    };

    const getChecked = (id) => {
      const el = document.getElementById(id);
      return el ? el.checked : true;
    };

    const nombres = getVal("regNombres");
    const apellidos = getVal("regApellidos");
    const dni = getVal("regDni");
    const fechaNacimiento = getVal("regFechaNacimiento");
    const edad = getVal("regEdad");
    const sexo = getVal("regSexo", "M");
    const direccion = getVal("regDireccion");
    const referencia = getVal("regReferencia");

    const distritoSedeVal = getVal("regDistritoSede") || getVal("regDistrito");
    const distSedeParts = distritoSedeVal.includes(" - ") ? distritoSedeVal.split(" - ") : distritoSedeVal.split(": ");
    const distrito = distSedeParts[0] || "Comas";
    const sede = distSedeParts[1] || "Año Nuevo";

    const modalidad = getVal("regModalidad", "Comunitaria");
    const estrategia = getVal("regEstrategia", "Desayuno Infantil");
    const exoneracionAporte = getVal("regExoneracion", "100% (Exonerado Vulnerabilidad Extrema)");

    const seguro = getVal("regSeguro", "SIS Gratuito");
    const centroSalud = getVal("regCentroSalud", `C.S. ${sede}`);
    const alergias = getVal("regAlergias", "Ninguna");
    const nivelEducativo = getVal("regNivelEducativo", "Inicial");
    const grado = getVal("regGrado", "Inicial 4 años");
    const colegio = getVal("regColegio", "I.E. Local");

    const apoderado = getVal("regApoderado");
    const apoderadoDni = getVal("regApoderadoDni");
    const parentesco = getVal("regParentesco", "Madre");
    const telefono = getVal("regTelefono");
    const telefonoAlt = getVal("regTelefonoAlt");

    const acomp1 = getVal("regRetiroAcomp1");
    const acomp2 = getVal("regRetiroAcomp2");

    const consentimientos = {
      evaluacionSocial: getChecked("checkHistorialVida"),
      usoFotografia: getChecked("checkFotoVideo"),
      gestionDonaciones: getChecked("checkDonaciones"),
      flujoTransfronterizo: getChecked("checkTransfronterizo")
    };

    const toast = window.PDI?.ToastView || ToastView;

    // Validación de firma digital (Ley 29733)
    if (this.signatureCanvasHelper && !this.signatureCanvasHelper.hasSignature()) {
      toast.show("Firma Obligatoria", "El apoderado debe estampar su firma digital en el recuadro para validar el Consentimiento Ley N.° 29733.", "warning");
      return;
    }

    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const list = bModel.getAll();
    const newId = list.length + 1;
    const correlativo = `PDI-2026-${String(newId).padStart(3, "0")}`;

    const padronRetiro = [];
    if (acomp1) {
      padronRetiro.push({ nombre: acomp1, dni: apoderadoDni, parentesco: parentesco, telefono: telefono });
    } else {
      padronRetiro.push({ nombre: apoderado, dni: apoderadoDni, parentesco: parentesco, telefono: telefono });
    }
    if (acomp2) {
      padronRetiro.push({ nombre: acomp2, dni: "Por validar", parentesco: "Familiar", telefono: telefonoAlt || "-" });
    }

    const nuevoObj = {
      id: newId,
      codigo: correlativo,
      nombres,
      apellidos,
      dni,
      fechaNacimiento: fechaNacimiento || "2022-01-01",
      edad: edad || "4 años",
      sexo,
      direccion: direccion || "Sector Local PDI",
      referencia: referencia || "-",
      distrito,
      sede,
      modalidad,
      estrategia,
      exoneracionAporte,
      servicios: estrategia.includes("Mixto") ? ["Desayuno Infantil", "Casita del Saber"] : [estrategia],
      seguro,
      centroSalud,
      alergias,
      nivelEducativo,
      grado,
      colegio,
      apoderado,
      parentesco,
      apoderadoDni,
      telefono,
      telefonoAlt: telefonoAlt || "-",
      estado: "Activo",
      hb: 11.2,
      peso: 15.0,
      talla: 98.0,
      anemia: "Normal",
      canastaEntregada: exoneracionAporte.includes("100%"),
      orientacionFamiliar: true,
      retiroAutorizado: acomp1 ? acomp1 : `${apoderado} (${parentesco})`,
      retiroPadron: padronRetiro,
      consentimientos,
      firmaDigital: true,
      vulnerabilidad: exoneracionAporte.includes("100%") ? 82 : 55
    };

    bModel.add(nuevoObj);

    // Registro en Log de Auditoría Inviolable
    const audit = window.PDI?.AuditModel || AuditModel;
    if (audit) {
      audit.log(
        "Usuario Activo",
        "Coordinación",
        "Inscripción Menor",
        nuevoObj.codigo,
        `Alta integral con Ficha A1/A3 Ley 29733: ${nombres} ${apellidos} (DNI ${dni})`,
        "Válido"
      );
    }

    toast.show("Beneficiario Incorporado", `${nombres} ${apellidos} registrado exitosamente con código ${nuevoObj.codigo}`, "success");

    const mView = window.PDI?.ModalView || ModalView;
    mView.closeNuevoMenor();
    const form = document.getElementById("formNuevoMenor");
    if (form) form.reset();
    this.clearSignature();

    if (onComplete) onComplete();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.BeneficiarioController = BeneficiarioController;
}
