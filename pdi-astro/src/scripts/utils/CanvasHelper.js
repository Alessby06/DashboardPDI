// Utilidad: Manejo de Firma Digital en Canvas (Ley N° 29733)
export const CanvasHelper = {
  init(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    let isDrawing = false;
    let hasDrawn = false;

    // Ajustar escala de resolución
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    ctx.strokeStyle = isLight ? "#007a65" : "#00b494";

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

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);

    return {
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
          img.onload = () => {
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
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CanvasHelper = CanvasHelper;
}
