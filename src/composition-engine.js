
import { MotionEngine } from "./motion-engine.js";

export class CompositionEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", {
      alpha: false
    });

    this.format = "vertical";
    this.preset = {};
  }

  setFormat(format) {
    this.format = format;

    if (format === "horizontal") {
      this.canvas.width = 1280;
      this.canvas.height = 720;
    } else {
      this.canvas.width = 576;
      this.canvas.height = 1024;
    }
  }

  setPreset(preset) {
    this.preset = preset || {};
  }

  getSize(value, reference) {
    return (Number(value) || 0) / 1000 * reference;
  }

  roundRect(x, y, w, h, radius) {
    const ctx = this.ctx;
    const r = Math.min(radius, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawGrid() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const visual = this.preset.visual || {};

    if (visual.grid === false) return;

    const gap = Math.max(12, Number(visual.gridSize) || 36);

    ctx.save();
    ctx.strokeStyle = visual.gridColor || "rgba(20,20,20,0.035)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= w; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawBackground() {
    const ctx = this.ctx;
    const visual = this.preset.visual || {};

    ctx.fillStyle = visual.background || "#F7F7F5";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();
  }

  wrapText(text, maxWidth, font) {
    const ctx = this.ctx;
    ctx.font = font;

    const words = String(text || "").split(/\s+/);
    const lines = [];
    let line = "";

    for (const word of words) {
      const test = line ? line + " " + word : word;

      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }

    if (line) lines.push(line);
    return lines;
  }

  drawText(element, x, y, w) {
    const ctx = this.ctx;
    const visual = this.preset.visual || {};

    const size = Math.max(
      8,
      this.getSize(element.size || 55, this.canvas.width)
    );

    const weight = element.weight || 700;
    const font = `${weight} ${size}px ${visual.fontFamily || "Arial, sans-serif"}`;

    const color = element.color ||
      visual.textColor || "#171717";

    const maxWidth = Math.max(
      20,
      this.getSize(element.width || 780, this.canvas.width)
    );

    const lineHeight = size * (Number(element.lineHeight) || 1.18);

    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";

    const lines = this.wrapText(element.text, maxWidth, font);

    if (element.align === "center") {
      ctx.textAlign = "center";
    } else if (element.align === "right") {
      ctx.textAlign = "right";
    } else {
      ctx.textAlign = "left";
    }

    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });

    ctx.restore();
  }

  drawCard(element, x, y, w, h) {
    const ctx = this.ctx;
    const visual = this.preset.visual || {};

    const radius = Number(element.radius) || 18;
    const color = element.color || "#FFFFFF";

    ctx.save();

    if (element.shadow !== false) {
      ctx.shadowColor = "rgba(0,0,0,0.13)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 9;
    }

    ctx.fillStyle = color;
    this.roundRect(x - w / 2, y - h / 2, w, h, radius);
    ctx.fill();

    ctx.shadowColor = "transparent";

    if (element.accent) {
      ctx.fillStyle = element.accent;
      this.roundRect(
        x - w / 2 + 16,
        y - h / 2 + 16,
        7,
        h - 32,
        4
      );
      ctx.fill();
    }

    if (element.label) {
      const textSize = Math.max(12, w * 0.075);

      ctx.fillStyle = element.textColor || "#202020";
      ctx.font = `700 ${textSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const maxWidth = w - 48;
      const lines = this.wrapText(
        element.label,
        maxWidth,
        ctx.font
      );

      const lineHeight = textSize * 1.2;
      const totalHeight = lines.length * lineHeight;

      lines.forEach((line, i) => {
        ctx.fillText(
          line,
          x,
          y - totalHeight / 2 + i * lineHeight
        );
      });
    }

    ctx.restore();
  }

  drawCircle(element, x, y, w) {
    const ctx = this.ctx;
    const radius = this.getSize(
      element.radius || 100,
      this.canvas.width
    );

    ctx.save();
    ctx.fillStyle = element.color || "#DCE9E1";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (element.stroke) {
      ctx.strokeStyle = element.stroke;
      ctx.lineWidth = Number(element.strokeWidth) || 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawElement(element, time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const state = MotionEngine.getState(element, time);
    if (state.opacity <= 0) return;

    const x = this.getSize(element.x ?? 500, w) + state.offsetX;
    const y = this.getSize(element.y ?? 500, h) + state.offsetY;

    const elementWidth = this.getSize(element.width || 700, w);
    const elementHeight = this.getSize(element.height || 180, h);

    ctx.save();
    ctx.globalAlpha = state.opacity;

    // Transform diterapkan sekali, relatif terhadap titik pusat elemen.
    ctx.translate(x, y);
    ctx.rotate(state.rotation);
    ctx.scale(state.scale, state.scale);

    if (element.type === "text") {
      this.drawText(element, -elementWidth / 2, -elementHeight / 2, elementWidth);
    } else if (element.type === "card") {
      this.drawCard(
        element,
        0,
        0,
        elementWidth,
        elementHeight
      );
    } else if (element.type === "circle") {
      this.drawCircle(element, 0, 0, w);
    }

    ctx.restore();
  }

  render(scene, time = 0) {
    this.drawBackground();

    const elements = Array.isArray(scene.elements)
      ? [...scene.elements]
      : [];

    // Judul dan subjudul otomatis hanya jika belum ada elemen
    // khusus yang ditandai sebagai title/subtitle.
    const hasTitle = elements.some(e => e.role === "title");
    const hasSubtitle = elements.some(e => e.role === "subtitle");

    if (scene.title && !hasTitle) {
      elements.push({
        id: "auto-title",
        role: "title",
        type: "text",
        text: scene.title,
        x: 500,
        y: 260,
        width: 790,
        height: 260,
        size: 92,
        weight: 800,
        entrance: "slide-up",
        start: 0,
        duration: scene.duration,
        exitDuration: 0.3
      });
    }

    if (scene.subtitle && !hasSubtitle) {
      elements.push({
        id: "auto-subtitle",
        role: "subtitle",
        type: "text",
        text: scene.subtitle,
        x: 500,
        y: 410,
        width: 770,
        height: 220,
        size: 42,
        weight: 400,
        entrance: "fade",
        start: 0.35,
        duration: scene.duration,
        exitDuration: 0.3
      });
    }

    // Urutan array menentukan urutan lapisan:
    // elemen terakhir digambar paling depan.
    elements.forEach(element => this.drawElement(element, time));

    const margin = w * 0.07;

    this.ctx.save();
    this.ctx.fillStyle = "rgba(20,20,20,0.35)";
    this.ctx.font = "11px Arial";
    this.ctx.fillText(
      "AUTO EXPLAINER STUDIO",
      margin,
      h - 18
    );
    this.ctx.restore();
  }
}
