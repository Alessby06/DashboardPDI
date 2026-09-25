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
  tempFotoFachada: null,
  tempCoords: null,
  debounceMapTimer: null,

  initSignature() {
    this.signatureCanvasHelper = CanvasHelper.init("canvasSignature");
  },

  clearSignature() {
    if (this.signatureCanvasHelper) {
      this.signatureCanvasHelper.clear();
    }
  },

  handleAddressDebounce(context = 'reg') {
    if (this.debounceMapTimer) {
      clearTimeout(this.debounceMapTimer);
    }

    const indicator = document.getElementById(context === 'reg' ? 'regMapLoadingIndicator' : 'expMapLoadingIndicator');
    if (indicator) indicator.style.display = 'flex';

    this.debounceMapTimer = setTimeout(() => {
      this.updateMapPreview(context);
    }, 2000);
  },

  updateMapPreview(context = 'reg') {
    const dirInput = document.getElementById(context === 'reg' ? 'regDireccion' : 'expDireccion');
    const distInput = document.getElementById(context === 'reg' ? 'regDistritoSede' : 'expDistritoSede');
    const iframe = document.getElementById(context === 'reg' ? 'regGoogleMapIframe' : 'expGoogleMapIframe');
    const indicator = document.getElementById(context === 'reg' ? 'regMapLoadingIndicator' : 'expMapLoadingIndicator');

    if (!iframe) return;

    const direccion = dirInput ? dirInput.value.trim() : "";
    let distrito = "Comas";

    if (distInput) {
      const val = distInput.value || "";
      if (val.toLowerCase().includes("carabayllo")) distrito = "Carabayllo";
      else if (val.toLowerCase().includes("comas")) distrito = "Comas";
    }

    let queryParts = [];
    if (direccion) queryParts.push(direccion);
    queryParts.push(distrito);
    queryParts.push("Lima");
    queryParts.push("Peru");

    const searchQuery = encodeURIComponent(queryParts.join(", "));
    iframe.src = `https://maps.google.com/maps?q=${searchQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

    // Actualizar enlace de navegación si está en expediente
    const navLink = document.getElementById("expLinkGoogleMapsNav");
    if (navLink) {
      navLink.href = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;
    }

    if (indicator) indicator.style.display = 'none';
  },

  capturarGps(context = 'reg') {
    const toast = window.PDI?.ToastView || ToastView;
    if (!navigator.geolocation) {
      if (toast) toast.show("GPS no soportado", "Su navegador no soporta geolocalización satelital.", "warning");
      return;
    }

    const indicator = document.getElementById(context === 'reg' ? 'regMapLoadingIndicator' : 'expMapLoadingIndicator');
    if (indicator) indicator.style.display = 'flex';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.tempCoords = { lat, lng };

        const iframe = document.getElementById(context === 'reg' ? 'regGoogleMapIframe' : 'expGoogleMapIframe');
        if (iframe) {
          iframe.src = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
        }

        const navLink = document.getElementById("expLinkGoogleMapsNav");
        if (navLink) {
          navLink.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        }

        if (indicator) indicator.style.display = 'none';
        if (toast) toast.show("Coordenadas GPS Obtenidas", `Ubicación satelital fijada: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, "success");
      },
      (error) => {
        if (indicator) indicator.style.display = 'none';
        if (toast) toast.show("Aviso de GPS", "No se pudo obtener la señal satelital directa. Se utilizará la dirección escrita.", "info");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
      if (roleKey === 'fachada') this.tempFotoFachada = base64;

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
    this.tempFotoFachada = null;
    this.tempCoords = null;

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

    const fachadaBox = document.getElementById("regFachadaPreview");
    if (fachadaBox) {
      fachadaBox.innerHTML = `
        <div class="croquis-fachada-placeholder">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span>Subir foto de vivienda</span>
        </div>
      `;
    }

    const ids = ["regFotoMenorInput", "regFotoApoderadoInput", "regFotoRetiro1Input", "regFotoRetiro2Input", "regFotoFachadaInput"];
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
      servicios: (() => {
        const s = new Set();
        const estLow = (estrategia || "").toLowerCase();
        if (estLow.includes("desayuno") || estLow.includes("lonchera") || estLow.includes("alimento") || estLow.includes("nutric") || estLow.includes("mixto")) {
          s.add("Servicio Alimentario Nutricional");
        }
        if (estLow.includes("casita") || estLow.includes("educativ") || estLow.includes("acompañ") || estLow.includes("mixto")) {
          s.add("Servicio Acompañamiento Educativo");
        }
        if (estLow.includes("pastoral") || estLow.includes("social") || (exoneracionAporte && exoneracionAporte.includes("100%"))) {
          s.add("Área Social Pastoral");
        }
        if (s.size === 0) s.add("Servicio Alimentario Nutricional");
        return Array.from(s);
      })(),
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
      coordenadas: this.tempCoords || null,
      fotoFachada: this.tempFotoFachada || null,
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
  },

  toggleServicio(id, servicioNombre) {
    const bModel = window.PDI?.BeneficiarioModel || BeneficiarioModel;
    const toast = window.PDI?.ToastView || ToastView;
    const menor = bModel.getById(id);
    if (!menor) return;

    if (!Array.isArray(menor.servicios)) menor.servicios = [];

    // Resolver nombre canónico oficial
    let canonicalName = servicioNombre;
    const low = (servicioNombre || "").toLowerCase();
    if (low.includes("nutric") || low.includes("aliment") || low.includes("desayuno") || low.includes("lonchera")) {
      canonicalName = "Servicio Alimentario Nutricional";
    } else if (low.includes("educat") || low.includes("casita") || low.includes("acompañ") || low.includes("refuerzo")) {
      canonicalName = "Servicio Acompañamiento Educativo";
    } else if (low.includes("pastoral") || low.includes("social") || low.includes("asp")) {
      canonicalName = "Área Social Pastoral";
    }

    const idx = menor.servicios.findIndex(s => {
      const sLow = (s || "").toLowerCase();
      if (canonicalName === "Servicio Alimentario Nutricional") {
        return s === canonicalName || sLow.includes("nutric") || sLow.includes("aliment") || sLow.includes("desayuno") || sLow.includes("lonchera");
      }
      if (canonicalName === "Servicio Acompañamiento Educativo") {
        return s === canonicalName || sLow.includes("educat") || sLow.includes("casita") || sLow.includes("acompañ");
      }
      if (canonicalName === "Área Social Pastoral") {
        return s === canonicalName || sLow.includes("pastoral") || sLow.includes("social") || sLow.includes("asp");
      }
      return s === canonicalName;
    });

    let isAdded = false;
    if (idx !== -1) {
      menor.servicios.splice(idx, 1);
      isAdded = false;
    } else {
      menor.servicios.push(canonicalName);
      isAdded = true;
    }

    // Actualizar en el modelo y persistir
    bModel.update(id, { servicios: menor.servicios });

    // Sincronizar con CasoSocialModel si es Área Social Pastoral
    if (canonicalName === "Área Social Pastoral") {
      const socialModel = window.PDI?.CasoSocialModel || CasoSocialModel;
      if (socialModel) {
        if (isAdded) {
          const listCasos = socialModel.getAll ? socialModel.getAll() : [];
          const existing = listCasos.find(c => c.beneficiarioId === Number(id) || (c.codigo && c.codigo.toLowerCase() === (menor.codigo || "").toLowerCase()));
          if (!existing) {
            socialModel.addCaso?.({
              beneficiarioId: Number(id),
              codigo: menor.codigo,
              menor: `${menor.nombres} ${menor.apellidos}`,
              sede: menor.sede,
              distrito: menor.distrito,
              estado: "Evaluación",
              prioridad: "Alta",
              motivo: "Activación de Área Social Pastoral desde Expediente",
              fecha: new Date().toISOString().split("T")[0],
              scoreVulnerabilidad: menor.vulnerabilidad || 82,
              apoderado: menor.apoderado,
              telefono: menor.telefono
            });
          }
        }
      }
    }

    // Registro en Log de Auditoría Inviolable
    const audit = window.PDI?.AuditModel || AuditModel;
    if (audit) {
      audit.log(
        "Usuario Activo",
        "Coordinación",
        isAdded ? "Activación de Servicio" : "Desactivación de Servicio",
        menor.codigo,
        `${isAdded ? 'Habilitado' : 'Deshabilitado'} servicio "${canonicalName}" para el menor ${menor.nombres} ${menor.apellidos}`,
        "Válido"
      );
    }

    // Notificación Toast
    if (toast) {
      toast.show(
        isAdded ? "Servicio Activado" : "Servicio Desactivado",
        `${canonicalName} ${isAdded ? 'habilitado para' : 'retirado de'} ${menor.nombres} ${menor.apellidos}`,
        isAdded ? "success" : "info"
      );
    }

    // Refrescar Expediente si está abierto
    const modalView = window.PDI?.ModalView || ModalView;
    if (modalView && typeof modalView.renderExpediente === "function") {
      modalView.renderExpediente(menor);
    }

    // Refrescar vistas en tiempo real
    const bView = window.PDI?.BeneficiariosView || BeneficiariosView;
    if (bView && typeof bView.renderTable === "function") {
      bView.renderTable(bModel.getAll());
    }
    if (window.app) {
      if (window.app.beneficiariosView) window.app.beneficiariosView.renderTable(bModel.getAll());
      if (window.app.casitasView) window.app.casitasView.renderTable(bModel.getAll());
      if (window.app.socialKanbanView && (window.PDI?.CasoSocialModel || CasoSocialModel)) {
        window.app.socialKanbanView.renderBoard((window.PDI?.CasoSocialModel || CasoSocialModel).getAll());
      }
    }
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.BeneficiarioController = BeneficiarioController;
  window.toggleBeneficiarioServicio = (id, servicio) => BeneficiarioController.toggleServicio(id, servicio);
}
