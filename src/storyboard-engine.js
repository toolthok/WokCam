
export class StoryboardEngine {
  constructor() {
    this.scenes = [];
    this.activeSceneIndex = 0;
  }

  id() {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  createDefaultProject() {
    this.scenes = [
      {
        id: this.id(),
        title: "IDE BESAR DIMULAI DARI PERTANYAAN",
        subtitle: "Setiap perubahan besar berawal dari satu hal sederhana.",
        duration: 5,
        elements: [
          {
            id: this.id(),
            type: "circle",
            x: 760,
            y: 660,
            radius: 125,
            color: "#DCE9E1",
            start: 0.4,
            duration: 4,
            entrance: "scale",
            motion: "float"
          },
          {
            id: this.id(),
            type: "card",
            x: 500,
            y: 760,
            width: 650,
            height: 170,
            label: "MULAI SEKARANG",
            accent: "#A7C9B5",
            start: 0.9,
            duration: 3.7,
            entrance: "pop",
            motion: "float"
          }
        ]
      },
      {
        id: this.id(),
        title: "VISUAL YANG MENJELASKAN",
        subtitle: "Informasi kompleks menjadi lebih mudah dipahami melalui visual yang tepat.",
        duration: 5,
        elements: [
          {
            id: this.id(),
            type: "card",
            x: 500,
            y: 650,
            width: 760,
            height: 210,
            label: "DATA → INFORMASI",
            color: "#FFFFFF",
            accent: "#B7C8E5",
            start: 0.2,
            duration: 4.4,
            entrance: "slide-up"
          },
          {
            id: this.id(),
            type: "circle",
            x: 780,
            y: 830,
            radius: 80,
            color: "#E9DCCB",
            start: 1.2,
            duration: 3.5,
            entrance: "scale",
            motion: "float"
          }
        ]
      },
      {
        id: this.id(),
        title: "CERITAKAN DENGAN CARA BERBEDA",
        subtitle: "Naskah, komposisi, gerakan, dan ritme menjadi satu pengalaman visual.",
        duration: 5,
        elements: [
          {
            id: this.id(),
            type: "text",
            text: "CERITA • DATA • VISUAL",
            x: 500,
            y: 670,
            width: 850,
            height: 100,
            size: 48,
            weight: 800,
            color: "#537A65",
            start: 0.6,
            duration: 4,
            entrance: "pop"
          }
        ]
      }
    ];

    this.activeSceneIndex = 0;
    return this.scenes;
  }

  get activeScene() {
    return this.scenes[this.activeSceneIndex] || null;
  }

  addScene() {
    const item = {
      id: this.id(),
      title: `Adegan ${this.scenes.length + 1}`,
      subtitle: "",
      duration: 5,
      elements: []
    };

    this.scenes.push(item);
    this.activeSceneIndex = this.scenes.length - 1;
    return item;
  }

  selectScene(index) {
    if (index >= 0 && index < this.scenes.length) {
      this.activeSceneIndex = index;
    }
  }

  removeScene(index) {
    if (this.scenes.length <= 1) return false;
    if (index < 0 || index >= this.scenes.length) return false;

    this.scenes.splice(index, 1);
    this.activeSceneIndex = Math.min(
      this.activeSceneIndex,
      this.scenes.length - 1
    );

    return true;
  }

  totalDuration() {
    return this.scenes.reduce(
      (sum, item) => sum + Math.max(1, Number(item.duration) || 1),
      0
    );
  }

  getSceneAtTime(time) {
    let cursor = 0;

    for (let index = 0; index < this.scenes.length; index++) {
      const item = this.scenes[index];
      const duration = Math.max(1, Number(item.duration) || 1);

      if (time < cursor + duration || index === this.scenes.length - 1) {
        return {
          scene: item,
          index,
          sceneTime: Math.max(0, Math.min(duration, time - cursor)),
          sceneStart: cursor,
          duration
        };
      }

      cursor += duration;
    }

    return null;
  }

  exportJSON(projectName, format) {
    return {
      schemaVersion: 2,
      application: "Auto Explainer Studio",
      projectName,
      format,
      coordinateSystem: "relative-1000",
      updatedAt: new Date().toISOString(),
      scenes: this.scenes
    };
  }

  importJSON(data) {
    if (!data || !Array.isArray(data.scenes) || !data.scenes.length) {
      throw new Error("Storyboard tidak valid.");
    }

    const legacy = data.coordinateSystem !== "relative-1000";

    this.scenes = data.scenes.map((item, index) => {
      const elements = Array.isArray(item.elements)
        ? item.elements.map(element => {
            const copy = { ...element };

            // Migrasi v0.3: koordinat lama adalah piksel pada
            // kanvas 576x1024 atau 1280x720.
            if (legacy && copy.x != null && copy.y != null) {
              const oldW = data.format === "horizontal" ? 1280 : 576;
              const oldH = data.format === "horizontal" ? 720 : 1024;

              copy.x = Math.round(copy.x / oldW * 1000);
              copy.y = Math.round(copy.y / oldH * 1000);

              if (copy.width != null) {
                copy.width = Math.round(copy.width / oldW * 1000);
              }

              if (copy.height != null) {
                copy.height = Math.round(copy.height / oldH * 1000);
              }

              if (copy.radius != null) {
                copy.radius = Math.round(copy.radius / oldW * 1000);
              }

              if (copy.size != null) {
                // Ukuran font lama adalah piksel. Konversi ke
                // ukuran relatif terhadap lebar kanvas.
                copy.size = Math.round(copy.size / oldW * 1000);
              }
            }

            return {
              ...copy,
              id: copy.id || this.id()
            };
          })
        : [];

      return {
        id: item.id || this.id(),
        title: String(item.title || `Adegan ${index + 1}`),
        subtitle: String(item.subtitle || ""),
        duration: Math.max(1, Math.min(30, Number(item.duration) || 5)),
        elements
      };
    });

    this.activeSceneIndex = 0;
    return this.scenes;
  }
}
