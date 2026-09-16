
    // Generadores de Avatares Biométricos SVG para Niños y Adultos Autorizados
    function getChildAvatarSvg(sex, name) {
      const isFemale = (sex === 'F');
      const bgColor = isFemale ? "#2a152f" : "#002b23";
      const accent = isFemale ? "#d946ef" : "#00b494";
      const skin = isFemale ? "#f0b88c" : "#e5a676";
      const hair = "#1e1b18";

      if (!isFemale) {
        return `<svg viewBox="0 0 120 120" width="100%" height="100%">
          <rect width="120" height="120" rx="10" fill="${bgColor}"/>
          <circle cx="60" cy="52" r="26" fill="${skin}"/>
          <path d="M34 46 C34 30, 44 22, 60 22 C76 22, 86 30, 86 46 C80 40, 72 38, 60 38 C48 38, 40 40, 34 46 Z" fill="${hair}"/>
          <ellipse cx="50" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <ellipse cx="70" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <path d="M52 62 Q60 69 68 62" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M52 76 L68 76 L72 88 L48 88 Z" fill="${skin}"/>
          <path d="M30 120 C30 92, 45 84, 60 84 C75 84, 90 92, 90 120 Z" fill="${accent}"/>
          <polygon points="60,84 52,98 68,98" fill="#ffffff" opacity="0.9"/>
        </svg>`;
      } else {
        return `<svg viewBox="0 0 120 120" width="100%" height="100%">
          <rect width="120" height="120" rx="10" fill="${bgColor}"/>
          <circle cx="60" cy="52" r="26" fill="${skin}"/>
          <path d="M32 50 C30 26, 44 20, 60 20 C76 20, 90 26, 88 50 C88 68, 84 76, 82 82 C78 72, 78 50, 78 40 C66 42, 54 42, 42 40 C42 50, 42 72, 38 82 C36 76, 32 68, 32 50 Z" fill="${hair}"/>
          <circle cx="36" cy="34" r="6" fill="${accent}"/>
          <circle cx="84" cy="34" r="6" fill="${accent}"/>
          <ellipse cx="50" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <ellipse cx="70" cy="52" rx="3" ry="3.5" fill="#1e293b"/>
          <path d="M52 63 Q60 70 68 63" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M52 76 L68 76 L72 88 L48 88 Z" fill="${skin}"/>
          <path d="M28 120 C28 92, 44 84, 60 84 C76 84, 92 92, 92 120 Z" fill="${accent}"/>
          <path d="M50 84 Q60 94 70 84" fill="#ffffff" opacity="0.9"/>
        </svg>`;
      }
    }

    function getAdultAvatarSvg(parentesco, name) {
      const isFemale = /madre|mama|mamá|tia|tía|abuela|hermana/i.test(parentesco || "");
      const bgColor = isFemale ? "#241829" : "#131b2e";
      const accent = isFemale ? "#f472b6" : "#38bdf8";
      const skin = isFemale ? "#e8ab80" : "#d99b6e";
      const hair = "#1e1b18";

      if (!isFemale) {
        return `<svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect width="100" height="100" rx="8" fill="${bgColor}"/>
          <circle cx="50" cy="42" r="21" fill="${skin}"/>
          <path d="M30 38 C30 24, 40 18, 50 18 C60 18, 70 24, 70 38 C64 33, 56 32, 50 32 C44 32, 36 33, 30 38 Z" fill="${hair}"/>
          <path d="M40 37 L46 37" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
          <path d="M54 37 L60 37" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
          <circle cx="43" cy="42" r="2.5" fill="#1e293b"/>
          <circle cx="57" cy="42" r="2.5" fill="#1e293b"/>
          <path d="M44 51 Q50 56 56 51" stroke="#92400e" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M44 62 L56 62 L58 72 L42 72 Z" fill="${skin}"/>
          <path d="M22 100 C22 76, 36 70, 50 70 C64 70, 78 76, 78 100 Z" fill="${accent}"/>
          <polygon points="50,70 44,82 56,82" fill="#ffffff" opacity="0.9"/>
        </svg>`;
      } else {
        return `<svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect width="100" height="100" rx="8" fill="${bgColor}"/>
          <circle cx="50" cy="42" r="21" fill="${skin}"/>
          <path d="M28 42 C26 22, 38 16, 50 16 C62 16, 74 22, 72 42 C72 58, 68 64, 66 68 C64 56, 64 40, 64 32 C54 34, 46 34, 36 32 C36 40, 36 56, 34 68 C32 64, 28 58, 28 42 Z" fill="${hair}"/>
          <circle cx="28" cy="48" r="2" fill="#fbbf24"/>
          <circle cx="72" cy="48" r="2" fill="#fbbf24"/>
          <path d="M40 37 Q43 35 46 37" stroke="#1e293b" stroke-width="1.8" fill="none"/>
          <path d="M54 37 Q57 35 60 37" stroke="#1e293b" stroke-width="1.8" fill="none"/>
          <circle cx="43" cy="42" r="2.5" fill="#1e293b"/>
          <circle cx="57" cy="42" r="2.5" fill="#1e293b"/>
          <path d="M44 52 Q50 57 56 52" stroke="#b91c1c" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M44 62 L56 62 L58 72 L42 72 Z" fill="${skin}"/>
          <path d="M20 100 C20 76, 35 70, 50 70 C65 70, 80 76, 80 100 Z" fill="${accent}"/>
          <path d="M42 70 Q50 80 58 70" fill="#ffffff" opacity="0.9"/>
        </svg>`;
      }
    }

// Vista: Modales (Expediente Integral, Registro Nuevo Menor, Informe Ejecutivo)
// Muestra el 100% de los datos de todas las fichas oficiales del PDI
export const ModalView = {
  openExpediente(b, caso) {
    if (!b) return;

        ModalView._currentId = b.id;
    ModalView.isEditing = false;

    const editBtn = document.getElementById("btnToggleEditExp");
    const saveBtn = document.getElementById("btnSaveExpChanges");
    const delBtn = document.getElementById("btnDeleteBeneficiario");
    if (editBtn) editBtn.style.display = "inline-flex";
    if (saveBtn) saveBtn.style.display = "none";

    const roleSel = document.getElementById("roleSelector");
    const activeRole = roleSel ? roleSel.value : "coord";
    if (delBtn) delBtn.style.display = (activeRole === "coord" || activeRole === "admin") ? "inline-flex" : "none";

    // Setup tab listeners inside modalExpediente
    const modalEl = document.getElementById("modalExpediente");
    if (modalEl) {
      modalEl.querySelectorAll(".modal-tab-btn").forEach(tab => {
        tab.onclick = () => {
          modalEl.querySelectorAll(".modal-tab-btn").forEach(t => t.classList.remove("active"));
          modalEl.querySelectorAll(".modal-tab-pane").forEach(p => p.style.display = "none");
          tab.classList.add("active");
          const target = modalEl.querySelector("#" + tab.dataset.tab);
          if (target) target.style.display = "block";
        };
      });
    }

    // Cabecera Principal
    const titleEl = document.getElementById("modalExpedienteTitle");
    if (titleEl) {
      titleEl.textContent = `Expediente Integral: ${b.nombres} ${b.apellidos} (${b.codigo})`;
    }

    // Helper para asignar valor o contenido con seguridad
    const setSafe = (id, val) => {
      const el = document.getElementById(id);
      if (el) {
        if ('value' in el && el.tagName === 'INPUT') el.value = val || '-';
        else el.textContent = val || '-';
      }
    };

    // Renderizado de Foto / Carnet del Menor en Identidad
    const childPhotoFrame = document.getElementById("expChildPhotoFrame");
    if (childPhotoFrame) {
      if (b.fotoUrl) {
        childPhotoFrame.innerHTML = `<img src="${b.fotoUrl}" alt="Foto de ${b.nombres}">`;
      } else {
        childPhotoFrame.innerHTML = getChildAvatarSvg(b.sexo, b.nombres);
      }
    }

    const photoName = document.getElementById("expPhotoName");
    if (photoName) photoName.textContent = `${b.nombres} ${b.apellidos}`;

    const photoCode = document.getElementById("expPhotoCode");
    if (photoCode) photoCode.textContent = b.codigo;

    const photoMeta = document.getElementById("expPhotoMeta");
    if (photoMeta) photoMeta.textContent = `${b.edad} • ${b.sexo === 'M' ? 'Masculino' : 'Femenino'} • Sede ${b.sede}`;

    // Listener para subir foto personalizada
    const photoInput = document.getElementById("childPhotoInput");
    if (photoInput) {
      photoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            b.fotoUrl = re.target.result;
            if (childPhotoFrame) {
              childPhotoFrame.innerHTML = `<img src="${b.fotoUrl}" alt="Foto de ${b.nombres}">`;
            }
          };
          reader.readAsDataURL(file);
        }
      };
    }

    // 1. Identidad y Filiación
    setSafe("expCodigo", b.codigo);
    setSafe("expNombres", b.nombres);
    setSafe("expApellidos", b.apellidos);
    setSafe("expDni", b.dni);
    setSafe("expFechaNac", b.fechaNacimiento || "No registrada");
    setSafe("expEdad", `${b.edad} (${b.sexo === 'M' ? 'Masculino' : 'Femenino'})`);
    setSafe("expEdadSexo", `${b.edad} / ${b.sexo}`);
    setSafe("expSexo", b.sexo === 'M' ? 'Masculino' : 'Femenino');
    setSafe("expDireccion", b.direccion || "Mz. 4W Lt. 30, Comité 12");
    setSafe("expReferencia", b.referencia || "Sin referencia adicional");
    setSafe("expDistritoSede", `${b.distrito} - Sede ${b.sede}`);
    setSafe("expSede", `${b.distrito} - Sede ${b.sede}`);
    setSafe("expModalidadEstrategia", `${b.modalidad || 'Comunitaria'} | ${b.estrategia || (b.servicios ? b.servicios.join(' + ') : 'Desayuno Infantil')}`);
    setSafe("expExoneracion", b.exoneracionAporte || "100% (Exonerado Vulnerabilidad Extrema)");

    // 2. Salud Base y CRED
    setSafe("expSeguro", b.seguro || "SIS Gratuito");
    setSafe("expCentroSalud", b.centroSalud || `C.S. ${b.sede}`);
    setSafe("expAlergias", b.alergias || "Ninguna");
    setSafe("expPesoTalla", `${b.peso || 14.5} kg / ${b.talla || 96.0} cm`);
    setSafe("expHb", `${b.hb || 11.0} g/dL (${b.anemia || 'Normal'})`);
    setSafe("expCanasta", b.canastaEntregada ? "Entregada (Canasta Nutricional)" : "No requerida");
    setSafe("expOrientacion", b.orientacionFamiliar ? "Completada con Cuidador" : "En programación");

    // 3. Escolaridad y Casitas
    setSafe("expNivelEducativo", b.nivelEducativo || (b.grado && b.grado.includes('Prim') ? 'Primaria' : 'Inicial'));
    setSafe("expGrado", b.grado || "Inicial");
    setSafe("expColegio", b.colegio || "I.E. Local de la Zona");
    setSafe("expAsistencia", "94.2% de Asistencia (Sede Regular)");
    setSafe("expKits", "Kit Escolar Faber-Castell Entregado");

    // 4. Entorno Familiar y Retiro Seguro
    setSafe("expApoderado", `${b.apoderado} (${b.parentesco || 'Madre'}) - DNI ${b.apoderadoDni || '-'}`);
    setSafe("expApoderadoNombre", b.apoderado);
    setSafe("expApoderadoParentesco", b.parentesco || "Madre");
    setSafe("expApoderadoDni", b.apoderadoDni || "En validación");
    setSafe("expTelefono", b.telefono || "-");
    setSafe("expApoderadoTel", b.telefono || "-");
    setSafe("expTelefonoAlt", b.telefonoAlt || "No registrado");
    setSafe("expRetiro", b.retiroAutorizado || `${b.apoderado} (Apoderado Principal)`);

    // Padrón Anexo 2: Personas autorizadas de retiro con Fotografía
    const retiroPadronContainer = document.getElementById("expRetiroPadronContainer");
    if (retiroPadronContainer) {
      const lista = (b.retiroPadron && b.retiroPadron.length > 0)
        ? b.retiroPadron
        : [{ nombre: b.apoderado, dni: b.apoderadoDni || '41982341', parentesco: b.parentesco || 'Madre', telefono: b.telefono }];
      
      retiroPadronContainer.innerHTML = lista.map((p, idx) => {
        const avatarSvg = getAdultAvatarSvg(p.parentesco, p.nombre);
        return `
          <div class="retiro-person-card">
            <div class="retiro-person-photo">
              ${p.fotoUrl ? `<img src="${p.fotoUrl}" alt="${p.nombre}">` : avatarSvg}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
                <strong style="font-size:13px; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${idx + 1}. ${p.nombre}</strong>
              </div>
              <div style="display:flex; align-items:center; gap:6px; margin:3px 0;">
                <span class="badge badge-blue" style="font-size:10.5px; padding:2px 6px;">${p.parentesco}</span>
                <span style="font-size:11.5px; color:var(--text-muted); font-family:var(--mono-font);">DNI ${p.dni}</span>
              </div>
              <div style="font-size:11.5px; color:var(--text-dim); display:flex; align-items:center; gap:4px;">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                <span>Tel: ${p.telefono}</span>
              </div>
              <div style="margin-top:6px; display:flex; align-items:center; justify-content:space-between;">
                <span class="badge badge-green" style="font-size:10px; padding:2px 6px;">Acreditado Anexo 2</span>
                <span style="font-size:10.5px; color:var(--gt-green); font-weight:700;"></span>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    // 5. Consentimiento Informado Ley N.° 29733 (Ficha A3)
    const consentContainer = document.getElementById("expConsentimientoChecksContainer");
    if (consentContainer) {
      consentContainer.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
          <div style="background:var(--surface-hover); padding:10px; border-radius:6px; border:1px solid var(--gt-green-border);">
            <div style="color:var(--gt-green); font-weight:700; font-size:12px;">[AUTORIZADO] Evaluación Social</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Elaboración de historias de vida y seguimiento del impacto (Art. 13 num 5 y 6).</div>
          </div>
          <div style="background:var(--surface-hover); padding:10px; border-radius:6px; border:1px solid var(--gt-green-border);">
            <div style="color:var(--gt-green); font-weight:700; font-size:12px;">[AUTORIZADO] Fotografías y Videos</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Difusión institucional y rendición de cuentas en plataformas oficiales (Art. 13 num 5).</div>
          </div>
          <div style="background:var(--surface-hover); padding:10px; border-radius:6px; border:1px solid var(--gt-green-border);">
            <div style="color:var(--gt-green); font-weight:700; font-size:12px;">[AUTORIZADO] Gestión de Donaciones</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Recaudación de fondos y reportes institucionales de sostenibilidad (Art. 13 num 5 y 6).</div>
          </div>
          <div style="background:var(--surface-hover); padding:10px; border-radius:6px; border:1px solid var(--gt-green-border);">
            <div style="color:var(--gt-green); font-weight:700; font-size:12px;">[AUTORIZADO] Flujo Transfronterizo</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Transferencia a cooperante Kinderwerk Lima e.V. (Alemania) con garantías de seguridad.</div>
          </div>
        </div>
        <div style="border:1.5px dashed var(--gt-green); border-radius:8px; padding:12px; text-align:center; background:rgba(0,180,148,0.06); color:var(--gt-green); font-size:12.5px; font-weight:700;">
          Consentimiento Informado Firmado Digitalmente &bull; Titular: ${b.apoderado} (DNI ${b.apoderadoDni || '41982341'}) &bull; Ley N.° 29733 / D.S. N.° 016-2024-JUS
        </div>
      `;
    }

    // 6. Área Social Pastoral ASP y Scoring de Vulnerabilidad
    setSafe("expVulnerabilidad", `${b.vulnerabilidad || 60}/100`);
    const socialDiv = document.getElementById("expCasoSocialDetail");
    if (socialDiv) {
      if (caso) {
        socialDiv.innerHTML = `
          <div style="background:var(--surface-hover); padding:14px; border-radius:var(--radius-sm); border-left:3px solid var(--gt-yellow);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div>
                <strong style="font-size:13px; color:var(--gt-yellow);">Derivación Activa: Problemática ${caso.tipoProblematica ? caso.tipoProblematica.toUpperCase() : 'SOCIAL'}</strong>
                <div style="font-size:11.5px; color:var(--text-dim);">Derivado por: ${caso.quienDeriva ? caso.quienDeriva.nombre + ' (' + caso.quienDeriva.cargo + ')' : 'Personal Operativo'} &bull; Tel: ${caso.quienDeriva ? caso.quienDeriva.telefono : '-'}</div>
              </div>
              <span class="badge badge-${caso.urgencia === 'Alta' ? 'red' : 'yellow'}">Urgencia: ${caso.urgencia}</span>
            </div>
            <div style="font-size:12.5px; color:var(--text-main); margin-bottom:6px;"><strong>Situación Encontrada:</strong> ${caso.situacionEncontrada || caso.detalle}</div>
            <div style="font-size:12px; color:var(--text-dim); margin-bottom:4px;"><strong>Acciones Realizadas:</strong> ${caso.accionesPrevias || 'Seguimiento domiciliario programado.'}</div>
            <div style="font-size:12px; color:var(--text-dim);"><strong>Soporte Familiar:</strong> ${caso.soporteFamiliar ? (caso.soporteFamiliar.tiene ? 'Sí cuenta con soporte familiar' : 'No cuenta con soporte: ' + caso.soporteFamiliar.detalle) : 'En evaluación'}</div>
          </div>
        `;
      } else {
        socialDiv.innerHTML = `
          <div style="background:var(--surface-hover); padding:12px; border-radius:var(--radius-sm); font-size:12px; color:var(--text-muted);">
            El menor no registra derivaciones activas a DEMUNA ni alertas de vulnerabilidad extrema. Monitoreo regular activo.
          </div>
        `;
      }
    }

    // Abrir modal y posicionar primera pestaña
    const modal = document.getElementById("modalExpediente");
    if (modal) {
      modal.classList.add("open");
      const firstTabBtn = modal.querySelector(".modal-tab-btn");
      if (firstTabBtn) firstTabBtn.click();
    }
  },

  
    toggleEdit() {
    this.isEditing = !this.isEditing;
    const editBtn = document.getElementById("btnToggleEditExp");
    const saveBtn = document.getElementById("btnSaveExpChanges");
    const editBadge = document.getElementById("expEditingBadge");

    const editableInputs = [
      "expNombres", "expApellidos", "expDni", "expFechaNac", "expEdad",
      "expDireccion", "expReferencia", "expDistritoSede", "expModalidadEstrategia",
      "expExoneracion", "expSeguro", "expCentroSalud", "expAlergias", "expGrado",
      "expColegio", "expApoderadoNombre", "expApoderadoParentesco", "expApoderadoDni",
      "expApoderadoTel", "expTelefonoAlt", "expPesoTalla", "expHb"
    ];

    editableInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.readOnly = !this.isEditing;
        if (this.isEditing) {
          el.removeAttribute("readonly");
          el.style.borderColor = "var(--gt-green)";
          el.style.background = "#ffffff";
          el.style.boxShadow = "0 0 0 3px rgba(0, 180, 148, 0.15)";
          el.style.cursor = "text";
        } else {
          el.setAttribute("readonly", "true");
          el.style.borderColor = "var(--border-subtle)";
          el.style.background = "var(--surface-2)";
          el.style.boxShadow = "none";
          el.style.cursor = "default";
        }
      }
    });

    if (this.isEditing) {
      if (editBtn) {
        editBtn.classList.add("danger");
        editBtn.innerHTML = `
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          <span>Cancelar Edición</span>
        `;
      }
      if (saveBtn) saveBtn.style.display = "inline-flex";
      if (editBadge) editBadge.style.display = "inline-flex";
      const tView = window.PDI?.ToastView;
      if (tView) tView.show("Modo Edición Activado", "Los campos son editables. Modifique los datos y presione Guardar Cambios.", "info");
    } else {
      if (editBtn) {
        editBtn.classList.remove("danger");
        editBtn.innerHTML = `
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
          <span>Editar Datos</span>
        `;
      }
      if (saveBtn) saveBtn.style.display = "none";
      if (editBadge) editBadge.style.display = "none";
    }
  },

  saveChanges() {
    const id = this._currentId;
    const bModel = window.PDI?.BeneficiarioModel;
    const aModel = window.PDI?.AuditModel;
    const b = bModel ? bModel.getById(id) : null;
    if (!b) return;

    const getVal = (id) => document.getElementById(id)?.value?.trim() || "";

    b.nombres = getVal("expNombres") || b.nombres;
    b.apellidos = getVal("expApellidos") || b.apellidos;
    b.dni = getVal("expDni") || b.dni;
    b.direccion = getVal("expDireccion") || b.direccion;
    b.referencia = getVal("expReferencia") || b.referencia;
    b.seguro = getVal("expSeguro") || b.seguro;
    b.centroSalud = getVal("expCentroSalud") || b.centroSalud;
    b.alergias = getVal("expAlergias") || b.alergias;
    b.grado = getVal("expGrado") || b.grado;
    b.colegio = getVal("expColegio") || b.colegio;
    b.apoderado = getVal("expApoderadoNombre") || b.apoderado;
    b.parentesco = getVal("expApoderadoParentesco") || b.parentesco;
    b.apoderadoDni = getVal("expApoderadoDni") || b.apoderadoDni;
    b.telefono = getVal("expApoderadoTel") || b.telefono;
    b.telefonoAlt = getVal("expTelefonoAlt") || b.telefonoAlt;

    bModel.update(id, b);

    // Auditoría
    const roleBanner = document.getElementById("roleBannerTitle")?.textContent || "Coordinador General";
    if (aModel && aModel.addLog) {
      aModel.addLog({
        user: roleBanner,
        role: "Dirección",
        action: "Edición de Expediente",
        entity: b.codigo,
        detail: `Actualización de datos del menor ${b.nombres} ${b.apellidos} en el padrón`,
        status: "Auditado"
      });
    }

    if (window.app && window.app.refreshAllViews) {
      window.app.refreshAllViews();
    } else {
      const bView = window.PDI?.BeneficiariosView;
      if (bView) bView.renderTable(bModel.getAll());
    }

    this.toggleEdit();
    const titleEl = document.getElementById("modalExpedienteTitle");
    if (titleEl) titleEl.textContent = `Expediente Integral: ${b.nombres} ${b.apellidos} (${b.codigo})`;
    const photoName = document.getElementById("expPhotoName");
    if (photoName) photoName.textContent = `${b.nombres} ${b.apellidos}`;

    const tView = window.PDI?.ToastView;
    if (tView) tView.show("Expediente Actualizado", `Los cambios en ${b.nombres} ${b.apellidos} se guardaron y auditaron correctamente.`, "success");
  },

  deleteBeneficiario() {
    const roleSel = document.getElementById("roleSelector");
    const currentRole = roleSel ? roleSel.value : "coord";
    if (currentRole !== "coord" && currentRole !== "admin") {
      const tView = window.PDI?.ToastView;
      if (tView) tView.show("Acción Restringida", "Únicamente el Coordinador General o Administrador TI pueden dar de baja a un menor.", "danger");
      return;
    }

    const id = this._currentId;
    const bModel = window.PDI?.BeneficiarioModel;
    const aModel = window.PDI?.AuditModel;
    const b = bModel ? bModel.getById(id) : null;
    if (!b) return;

    if (!confirm(`¿Está seguro de eliminar definitivamente al menor ${b.nombres} ${b.apellidos} (${b.codigo})?\n\nEsta acción retirará al menor del Padrón Único y de todos los servicios. Se registrará en la auditoría del sistema.`)) {
      return;
    }

    bModel.delete(id);

    const roleBanner = document.getElementById("roleBannerTitle")?.textContent || "Coordinador General";
    if (aModel && aModel.addLog) {
      aModel.addLog({
        user: roleBanner,
        role: "Dirección / Admin",
        action: "Baja de Beneficiario",
        entity: b.codigo,
        detail: `Baja definitiva del menor ${b.nombres} ${b.apellidos} autorizada por rol directivo`,
        status: "Ejecutado"
      });
    }

    if (window.app && window.app.refreshAllViews) {
      window.app.refreshAllViews();
    } else {
      const bView = window.PDI?.BeneficiariosView;
      if (bView) bView.renderTable(bModel.getAll());
    }

    this.closeExpediente();
    const tView = window.PDI?.ToastView;
    if (tView) tView.show("Baja Ejecutada", `El menor ${b.nombres} fue retirado del sistema y la acción quedó auditada.`, "warning");
  },

  closeExpediente() {
    const modal = document.getElementById("modalExpediente");
    if (modal) modal.classList.remove("open");
  },

  openNuevoMenor() {
    const modal = document.getElementById("modalNuevoMenor");
    if (modal) {
      modal.classList.add("open");
      setTimeout(() => {
        const ctrl = window.PDI?.BeneficiarioController || (window.app && window.app.beneficiarioController);
        if (ctrl && ctrl.initSignature) ctrl.initSignature();
      }, 100);
    }
  },

  closeNuevoMenor() {
    const modal = document.getElementById("modalNuevoMenor");
    if (modal) modal.classList.remove("open");
  },

  openInforme(stats, activeRole) {
    const fecha = new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
    const fechaEl = document.getElementById("informeFecha");
    if (fechaEl) fechaEl.textContent = fecha;

    const opEl = document.getElementById("informeOperador");
    if (opEl) opEl.textContent = `${activeRole.title} (${activeRole.desc.split(' ')[0]})`;

    const totalEl = document.getElementById("infTotalMenores");
    if (totalEl) totalEl.textContent = stats.total;

    const normEl = document.getElementById("infNormales");
    if (normEl) normEl.textContent = `${stats.normales} (${stats.pctNormal}%)`;

    const anEl = document.getElementById("infAnemia");
    if (anEl) anEl.textContent = `${stats.leves + stats.moderadas} (${stats.pctLeve + stats.pctMod}%)`;

    const modal = document.getElementById("modalInformeEjecutivo") || document.getElementById("modalInforme");
    if (modal) modal.classList.add("open");
  },

  closeInforme() {
    const modal = document.getElementById("modalInformeEjecutivo") || document.getElementById("modalInforme");
    if (modal) modal.classList.remove("open");
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.ModalView = ModalView;
}
