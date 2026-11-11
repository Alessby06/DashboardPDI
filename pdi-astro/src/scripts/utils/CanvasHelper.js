// Utilidad: Manejo de Firma Digital en Canvas (Ley N° 29733)
export const CanvasHelper = {
  init(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // El lienzo vive dentro de un modal cerrado al cargar la página: su caja
    // mide 0×0. Si ya se inicializó, se redimensiona al abrir en vez de
    // duplicar oyentes; si no, se prepara aquí y se completa al abrir.
    if (canvas._pdiCanvasHelper) {
      canvas._pdiCanvasHelper.resize();
      return canvas._pdiCanvasHelper;
    }

    const ctx = canvas.getContext("2d");
    let isDrawing = false;
    let hasDrawn = false;

    /** Ajusta el lienzo a su caja visible. Devuelve false si aún está oculto. */
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";
      hasDrawn = false;
      return true;
    }

    resize();

    function getCoords(e) {
      const r = canvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) {
        return {
          x: e.touches[0].clientX - r.left,
          y: e.touches[0].clientY - r.top
        };
      }
      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top
      };
    }

    function startDrawing(e) {
      isDrawing = true;
      hasDrawn = true;
      const coords = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      e.preventDefault();
    }

    function draw(e) {
      if (!isDrawing) return;
      const coords = getCoords(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      e.preventDefault();
    }

    function stopDrawing() {
      isDrawing = false;
    }

    function pintarImagen(img, callback) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Calcular aspect ratio para centrar la imagen en el canvas
      const scale = Math.min((canvas.width / 2) / img.width, (canvas.height / 2) / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = ((canvas.width / 2) - w) / 2;
      const y = ((canvas.height / 2) - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      hasDrawn = true;
      if (callback) callback();
    }

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);

    const helper = {
      resize,
      clear() {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        hasDrawn = false;
      },
      hasSignature() {
        return hasDrawn;
      },
      toDataURL() {
        return canvas.toDataURL();
      },
      loadFromImage(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => pintarImagen(img, callback);
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      },
      /** Restaura una firma ya capturada (borrador) sin pasar por un archivo. */
      loadFromDataURL(dataUrl, callback) {
        if (!dataUrl) return;
        const img = new Image();
        img.onload = () => pintarImagen(img, callback);
        img.src = dataUrl;
      }
    };

    canvas._pdiCanvasHelper = helper;
    return helper;
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CanvasHelper = CanvasHelper;
}
