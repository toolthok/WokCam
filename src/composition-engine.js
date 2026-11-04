
import { Motion } from "./motion-engine.js";

export class CompositionEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  setFormat(format) {
    if (format === "horizontal") {
      this.canvas.width = 1280;
      this.canvas.height = 720;
    } else {
      this.canvas.width = 576;
      this.canvas.height = 1024;
    }
  }

  drawBackground(style = {}) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = style.background || "#F7F7F5";
    ctx.fillRect(0, 0, w, h);

    if (style.grid !== false) {
      ctx.save();
      ctx.strokeStyle = "rgba(20,20,20,0.035)";
      ctx.lineWidth = 1;

      const gap = style.gridSize || 36;

      for (let x = 0; x < w; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let y = 0; y < h; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawText(text, x, y, options = {}) {
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = options.color || "#171717";
    ctx.font = `${options.weight || 700} ${
      options.size || 42
    }px ${options.font || "Arial, sans-serif"}`;
    ctx.textAlign = options.align || "left";
    ctx.textBaseline = "middle";

    const maxWidth = options.maxWidth || 0;
    const lineHeight = options.lineHeight || (options.size || 42) * 1.18;

    if (!maxWidth) {
      ctx.fillText(String(text || ""), x, y);
    } else {
      const words = String(text || "").split(/\s+/);
      let line = "";
      let lineNumber = 0;

      for (const word of words) {
        const test = line ? line + " " + word : word;

        if (ctx.measureText(test).width > maxWidth && line) {
          ctx.fillText(line, x, y + lineNumber * lineHeight);
          line = word;
          lineNumber++;
        } else {
          line = test;
        }
      }

      if (line) {
        ctx.fillText(line, x, y + lineNumber * lineHeight);
      }
    }

    ctx.restore();
  }

  drawCard(element, x, y, scale) {
    const ctx = this.ctx;
    const w = element.width || 300;
    const h = element.height || 180;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;

    ctx.fillStyle = element.color || "#FFFFFF";
    this.roundRect(-w / 2, -h / 2, w, h, 18);
    ctx.fill();

    ctx.shadowColor = "transparent";

    if (element.accent) {
      ctx.fillStyle = element.accent;
      this.roundRect(-w / 2 + 18, -h / 2 + 18, 8, h - 36, 4);
      ctx.fill();
    }

    ctx.restore();

    if (element.label) {
      this.drawText(
        element.label,
        x,
        y,
        {
          size: element.textSize || 25,
          weight: 700,
          align: "center",
          maxWidth: w - 45
        }
      );
    }
  }

  drawCircle(element, x, y, scale) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = element.color || "#D8E4DD";
    ctx.beginPath();
    ctx.arc(0, 0, element.radius || 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  roundRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  render(scene, sceneTime = 0, preset = {}) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.drawBackground(preset);

    const margin = w * 0.11;
    const centerX = w / 2;

    const elements = [...(scene.elements || [])];

    if (scene.title) {
      elements.unshift({
        id: "generated-title",
        type: "text",
        text: scene.title,
        x: margin,
        y: h * 0.27,
        size: w * 0.095,
        weight: 800,
        width: w - margin * 2,
        duration: scene.duration || 5,
        entrance: "slide",
        start: 0
      });
    }

    if (scene.subtitle) {
      elements.unshift({
        id: "generated-subtitle",
        type: "text",
        text: scene.subtitle,
        x: margin,
        y: h * 0.40,
        size: w * 0.042,
        weight: 400,
        width: w - margin * 2,
        duration: scene.duration || 5,
        entrance: "fade",
        start: 0.35
      });
    }

    for (const element of elements) {
      const state = Motion.getState(element, sceneTime);
      if (state.opacity <= 0) continue;

      const x = element.x ?? centerX;
      const y = element.y ?? h * 0.65;

      ctx.save();
      ctx.globalAlpha = state.opacity;
      ctx.translate(state.x, state.y);
      ctx.translate(x, y);
      ctx.rotate(state.rotation);
      ctx.scale(state.scale, state.scale);
      ctx.translate(-x, -y);

      if (element.type === "text") {
        this.drawText(
          element.text,
          x,
          y,
          {
            size: element.size || 36,
            weight: element.weight || 700,
            color: element.color || "#171717",
            maxWidth: element.width || w * 0.78,
            lineHeight: element.lineHeight
          }
        );
      } else if (element.type === "card") {
        this.drawCard(element, x, y, 1);
      } else if (element.type === "circle") {
        this.drawCircle(element, x, y, 1);
      }

      ctx.restore();
    }

    // Penanda adegan kecil
    ctx.save();
    ctx.fillStyle = "rgba(20,20,20,0.35)";
    ctx.font = "12px Arial";
    ctx.fillText("AUTO EXPLAINER STUDIO", margin, h - 25);
    ctx.restore();
  }
}
