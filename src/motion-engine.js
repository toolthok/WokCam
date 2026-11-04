
export const Motion = {
  clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  },

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  },

  easeInOut(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3)
      + c1 * Math.pow(t - 1, 2);
  },

  interpolate(from, to, t) {
    return from + (to - from) * t;
  },

  evaluate(type, progress) {
    const t = this.clamp(progress);

    switch (type) {
      case "fade":
      case "slide":
      case "scale":
        return this.easeOutCubic(t);
      case "pop":
        return this.easeOutBack(t);
      case "smooth":
        return this.easeInOut(t);
      default:
        return t;
    }
  },

  getState(element, sceneTime) {
    const start = element.start ?? 0;
    const duration = Math.max(0.1, element.duration ?? 1);
    const end = start + duration;
    const entrance = Math.max(0.1, element.entranceDuration ?? 0.65);
    const exit = Math.max(0, element.exitDuration ?? 0.4);

    let opacity = 1;
    let x = 0;
    let y = 0;
    let scale = 1;
    let rotation = 0;

    if (sceneTime < start) {
      opacity = 0;
    } else {
      const p = this.evaluate(
        element.entrance || "fade",
        (sceneTime - start) / entrance
      );

      if (element.entrance === "slide") {
        const distance = element.slideDistance ?? 70;
        x = distance * (1 - p);
      }

      if (element.entrance === "scale" ||
          element.entrance === "pop") {
        scale = this.interpolate(0.72, 1, p);
      }

      opacity = p;
    }

    if (sceneTime > end - exit && exit > 0) {
      const p = this.clamp((sceneTime - (end - exit)) / exit);
      opacity *= 1 - this.easeOutCubic(p);
    }

    if (sceneTime > end) opacity = 0;

    const float = element.float || false;
    if (float && opacity > 0) {
      const amplitude = element.floatAmplitude ?? 8;
      const frequency = element.floatFrequency ?? 1.4;
      y += Math.sin(sceneTime * frequency * Math.PI * 2)
        * amplitude;
    }

    if (element.motion === "slow-zoom") {
      const p = this.clamp((sceneTime - start) / duration);
      scale *= 1 + p * (element.zoomAmount ?? 0.08);
    }

    if (element.motion === "rotate") {
      rotation = Math.sin(sceneTime * 1.3) * 0.035;
    }

    return { opacity, x, y, scale, rotation };
  }
};
