
export class MotionEngine {
  static clamp(v, min = 0, max = 1) {
    return Math.max(min, Math.min(max, v));
  }

  static ease(name, t) {
    t = this.clamp(t);

    switch (name) {
      case "ease-in":
        return t * t * t;

      case "ease-out":
        return 1 - Math.pow(1 - t, 3);

      case "ease-in-out":
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;

      case "back":
        return 1 + 2.70158 * Math.pow(t - 1, 3)
          + 1.70158 * Math.pow(t - 1, 2);

      case "linear":
      default:
        return t;
    }
  }

  static getState(element, time) {
    const start = Math.max(0, Number(element.start) || 0);
    const duration = Math.max(0.1, Number(element.duration) || 1);
    const end = start + duration;

    const enterDuration = Math.max(
      0.05,
      Number(element.entranceDuration) || 0.65
    );

    const exitDuration = Math.min(
      duration,
      Math.max(0, Number(element.exitDuration) || 0.4)
    );

    const entrance = element.entrance || "fade";
    const easing = element.easing || "ease-out";

    let opacity = 0;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let rotation = 0;

    if (time < start || time > end) {
      return { opacity, scale, offsetX, offsetY, rotation };
    }

    const enterProgress = this.ease(
      easing,
      (time - start) / enterDuration
    );

    switch (entrance) {
      case "slide-left":
        offsetX = 90 * (1 - enterProgress);
        opacity = enterProgress;
        break;

      case "slide-right":
        offsetX = -90 * (1 - enterProgress);
        opacity = enterProgress;
        break;

      case "slide-up":
        offsetY = 90 * (1 - enterProgress);
        opacity = enterProgress;
        break;

      case "slide-down":
        offsetY = -90 * (1 - enterProgress);
        opacity = enterProgress;
        break;

      case "scale":
        scale = 0.65 + 0.35 * enterProgress;
        opacity = enterProgress;
        break;

      case "pop":
        scale = this.ease("back", (time - start) / enterDuration);
        opacity = enterProgress;
        break;

      case "none":
        opacity = 1;
        break;

      case "fade":
      default:
        opacity = enterProgress;
    }

    if (exitDuration > 0 && time > end - exitDuration) {
      const exitProgress = this.ease(
        "ease-in",
        (time - (end - exitDuration)) / exitDuration
      );

      opacity *= 1 - exitProgress;
    }

    const elapsed = Math.max(0, time - start);

    if (element.motion === "float" || element.float === true) {
      const amplitude = Number(element.floatAmplitude) || 8;
      const frequency = Number(element.floatFrequency) || 1.2;

      offsetY += Math.sin(elapsed * frequency * Math.PI * 2)
        * amplitude;
    }

    if (element.motion === "slow-zoom") {
      const progress = this.clamp(elapsed / duration);
      scale *= 1 + progress * (Number(element.zoomAmount) || 0.08);
    }

    if (element.motion === "rotate") {
      rotation += Math.sin(elapsed * 1.4) * 0.035;
    }

    rotation += (Number(element.rotation) || 0) * Math.PI / 180;

    return {
      opacity: this.clamp(opacity),
      scale,
      offsetX,
      offsetY,
      rotation
    };
  }
}
