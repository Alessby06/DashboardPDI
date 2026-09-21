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
  tempFotoMenor: null,
  tempFotoApoderado: null,
  tempFotoRetiro1: null,
  tempFotoRetiro2: null,

  initSignature() {
    this.signatureCanvasHelper = CanvasHelper.init("canvasSignature");
  },

  clearSignature() {
    if (this.signatureCanvasHelper) {
      this.signatureCanvasHelper.clear();
    }
  },

  handleFotoUpload(input, previewId, roleKey) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      const previewEl = document.getElementById(previewId);
      if (previewEl) {
        previewEl.innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Foto">`;
      }
      if (roleKey === 'menor') this.tempFotoMenor = base64;
      if (roleKey === 'apoderado') {
        this.tempFotoApoderado = base64;
        const checkMismo = document.getElementById("checkMismoApoderado1");
        if (checkMismo && checkMismo.checked) {
          this.tempFotoRetiro1 = base64;
          const p1Preview = document.getElementById("regFotoRetiro1Preview");
          if (p1Preview) {
            p1Preview.innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Foto">`;
          }
        }
      }
      if (roleKey === 'retiro1') this.tempFotoRetiro1 = base64;
      if (roleKey === 'retiro2') this.tempFotoRetiro2 = base64;

      const toast = window.PDI?.ToastView || ToastView;
      if (toast) toast.show("Foto Cargada", "Fotografía incorporada al registro correctamente.", "info");
    };
    reader.readAsDataURL(file);
  },

  resetPhotos() {
    this.tempFotoMenor = null;
    this.tempFotoApoderado = null;
    this.tempFotoRetiro1 = null;
    this.tempFotoRetiro2 = null;

    const resetBox = (id, label) => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = `
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" style="color:var(--text-muted); margin-bottom:2px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          <span style="font-size:9.5px; font-weight:600; color:var(--text-muted);">${label}</span>
        `;
      }
    };

    resetBox("regFotoMenorPreview", "Foto Menor");
    resetBox("regFotoApoderadoPreview", "Foto Apoderado");
    resetBox("regFotoRetiro1Preview", "Foto P1");
    resetBox("regFotoRetiro2Preview", "Foto P2");

    const ids = ["regFotoMenorInput", "regFotoApoderadoInput", "regFotoRetiro1Input", "regFotoRetiro2Input"];
    ids.forEach(i => {
      const input = document.getElementById(i);
      if (input) input.value = "";
    });

    const box1 = document.getElementById("boxFotoRetiro1");
    if (box1) {
      box1.style.pointerEvents = "auto";
      box1.style.opacity = "1";
    }
  },

  loadSignatureFile(file) {
    if (this.signatureCanvasHelper && file) {
      this.signatureCanvasHelper.loadFromImage(file, () => {
        const toast = window.PDI?.ToastView || ToastView;
        if (toast) toast.show("Firma Cargada", "La imagen de la firma fue procesada e incorporada al formulario.", "success");
      });
    }
  },

  syncMismoApoderado(checked) {
    const getVal = (id) => document.getElementById(id)?.value || "";
    const nombre1 = document.getElementById("regRetiroNombre1");
    const dni1 = document.getElementById("regRetiroDni1");
    const parentesco1 = document.getElementById("regRetiroParentesco1");
    const tel1 = document.getElementById("regRetiroTel1");
    const p1Preview = document.getElementById("regFotoRetiro1Preview");
    const box1 = document.getElementById("boxFotoRetiro1");

    if (checked) {
      if (nombre1) {
        nombre1.value = getVal("regApoderado");
        nombre1.readOnly = true;
        nombre1.style.background = "var(--surface-hover)";
        nombre1.style.color = "var(--text-muted)";
      }
      if (dni1) {
        dni1.value = getVal("regApoderadoDni");
        dni1.readOnly = true;
        dni1.style.background = "var(--surface-hover)";
        dni1.style.color = "var(--text-muted)";
      }
      if (parentesco1) {
        parentesco1.value = getVal("regParentesco") || "Madre";
        parentesco1.disabled = true;
        parentesco1.style.background = "var(--surface-hover)";
        parentesco1.style.color = "var(--text-muted)";
      }
      if (tel1) {
        tel1.value = getVal("regTelefono");
        tel1.readOnly = true;
        tel1.style.background = "var(--surface-hover)";
        tel1.style.color = "var(--text-muted)";
      }
      if (this.tempFotoApoderado) {
        this.tempFotoRetiro1 = this.tempFotoApoderado;
        if (p1Preview) {
          p1Preview.innerHTML = `<img src="${this.tempFotoApoderado}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Foto">`;
        }
      }
      if (box1) {
        box1.style.pointerEvents = "none";
        box1.style.opacity = "0.75";
      }
    } else {
      if (nombre1) {
        nombre1.readOnly = false;
        nombre1.style.background = "#ffffff";
        nombre1.style.color = "var(--text-main)";
      }
      if (dni1) {
        dni1.readOnly = false;
        dni1.style.background = "#ffffff";
        dni1.style.color = "var(--text-main)";
      }
      if (parentesco1) {
        parentesco1.disabled = false;
        parentesco1.style.background = "#ffffff";
        parentesco1.style.color = "var(--text-main)";
      }
      if (tel1) {
        tel1.readOnly = false;
        tel1.style.background = "#ffffff";
        tel1.style.color = "var(--text-main)";
      }
      if (box1) {
        box1.style.pointerEvents = "auto";
        box1.style.opacity = "1";
      }
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

  openExpedienteByCodigo(codigo) {
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const cModel = window.PDI?.CasoSocialModel || CasoSocialModel;
    const mView = window.PDI?.ModalView || ModalView;
    const tView = window.PDI?.ToastView || ToastView;

    const menor = bModel.getByCodigo(codigo);
    if (!menor) {
      if (tView) tView.show(`No se encontró un expediente activo para el código ${codigo}`, "info");
      return;
    }

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

    // Datos de Persona Autorizada 1
    const retiroNombre1 = getVal("regRetiroNombre1") || apoderado;
    const retiroDni1 = getVal("regRetiroDni1") || apoderadoDni;
    const retiroParentesco1 = getVal("regRetiroParentesco1") || parentesco;
    const retiroTel1 = getVal("regRetiroTel1") || telefono;

    // Datos de Persona Autorizada 2 (Opcional)
    const retiroNombre2 = getVal("regRetiroNombre2");
    const retiroDni2 = getVal("regRetiroDni2");
    const retiroParentesco2 = getVal("regRetiroParentesco2") || "Familiar";
    const retiroTel2 = getVal("regRetiroTel2");

    const consentimientos = {
      evaluacionSocial: getChecked("checkHistorialVida"),
      usoFotografia: getChecked("checkFotoVideo"),
      gestionDonaciones: getChecked("checkDonaciones"),
      flujoTransfronterizo: getChecked("checkTransfronterizo")
    };

    const toast = window.PDI?.ToastView || ToastView;

    // Validación de firma digital (Ley 29733)
    if (this.signatureCanvasHelper && !this.signatureCanvasHelper.hasSignature()) {
      toast.show("Firma Obligatoria", "El apoderado debe estampar o subir su firma para validar el Consentimiento Ley N.° 29733.", "warning");
      return;
    }

    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const list = bModel.getAll();
    const newId = list.length + 1;
    const correlativo = `PDI-2026-${String(newId).padStart(3, "0")}`;

    const padronRetiro = [];
    if (retiroNombre1) {
      padronRetiro.push({
        nombre: retiroNombre1,
        dni: retiroDni1,
        parentesco: retiroParentesco1,
        telefono: retiroTel1,
        fotoUrl: this.tempFotoRetiro1 || this.tempFotoApoderado || null
      });
    }
    if (retiroNombre2) {
      padronRetiro.push({
        nombre: retiroNombre2,
        dni: retiroDni2 || "Por validar",
        parentesco: retiroParentesco2,
        telefono: retiroTel2 || "-",
        fotoUrl: this.tempFotoRetiro2 || null
      });
    }
    if (padronRetiro.length === 0) {
      padronRetiro.push({
        nombre: apoderado,
        dni: apoderadoDni,
        parentesco: parentesco,
        telefono: telefono,
        fotoUrl: this.tempFotoApoderado || null
      });
    }

    const nuevoObj = {
      id: newId,
      codigo: correlativo,
      nombres,
      apellidos,
      dni,
      fotoUrl: this.tempFotoMenor || null,
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
      retiroAutorizado: `${retiroNombre1} (${retiroParentesco1})`,
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
    this.resetPhotos();

    if (onComplete) onComplete();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.BeneficiarioController = BeneficiarioController;
}
