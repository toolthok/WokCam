
export class StoryboardEngine {
  constructor() {
    this.scenes = [];
    this.activeSceneIndex = 0;
  }

  createScene(title = "Adegan Baru") {
    return {
      id: crypto.randomUUID(),
      title,
      subtitle: "",
      duration: 5,
      elements: []
    };
  }

  createDefaultProject() {
    this.scenes = [
      {
        id: crypto.randomUUID(),
        title: "IDE BESAR DIMULAI DARI PERTANYAAN",
        subtitle: "Setiap perubahan besar berawal dari satu hal sederhana.",
        duration: 5,
        elements: [
          {
            id: crypto.randomUUID(),
            type: "circle",
            x: 430,
            y: 650,
            radius: 85,
            color: "#DCE9E1",
            start: 0.4,
            duration: 4,
            entrance: "scale",
            float: true
          },
          {
            id: crypto.randomUUID(),
            type: "card",
            x: 285,
            y: 760,
            width: 310,
            height: 145,
            label: "MULAI SEKARANG",
            accent: "#A7C9B5",
            start: 0.9,
            duration: 3.7,
            entrance: "pop",
            float: true
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        title: "VISUAL YANG MENJELASKAN",
        subtitle: "Informasi kompleks menjadi lebih mudah dipahami melalui visual yang tepat.",
        duration: 5,
        elements: [
          {
            id: crypto.randomUUID(),
            type: "card",
            x: 285,
            y: 650,
            width: 390,
            height: 190,
            label: "DATA → INFORMASI",
            color: "#FFFFFF",
            accent: "#B7C8E5",
            start: 0.2,
            duration: 4.4,
            entrance: "slide"
          },
          {
            id: crypto.randomUUID(),
            type: "circle",
            x: 420,
            y: 820,
            radius: 55,
            color: "#E9DCCB",
            start: 1.2,
            duration: 3.5,
            entrance: "scale",
            float: true
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        title: "CERITAKAN DENGAN CARA BERBEDA",
        subtitle: "Naskah, komposisi, gerakan, dan ritme menjadi satu pengalaman visual.",
        duration: 5,
        elements: [
          {
            id: crypto.randomUUID(),
            type: "text",
            text: "CERITA • DATA • VISUAL",
            x: 288,
            y: 670,
            width: 470,
            size: 30,
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
    const scene = this.createScene(
      `Adegan ${this.scenes.length + 1}`
    );
    this.scenes.push(scene);
    this.activeSceneIndex = this.scenes.length - 1;
    return scene;
  }

  selectScene(index) {
    if (index < 0 || index >= this.scenes.length) return;
    this.activeSceneIndex = index;
  }

  removeScene(index) {
    if (this.scenes.length <= 1) return false;
    this.scenes.splice(index, 1);
    this.activeSceneIndex = Math.min(
      this.activeSceneIndex,
      this.scenes.length - 1
    );
    return true;
  }

  totalDuration() {
    return this.scenes.reduce(
      (total, scene) => total + Math.max(1, Number(scene.duration) || 1),
      0
    );
  }

  getSceneAtTime(projectTime) {
    let cursor = 0;

    for (let i = 0; i < this.scenes.length; i++) {
      const scene = this.scenes[i];
      const duration = Math.max(1, Number(scene.duration) || 1);

      if (projectTime < cursor + duration || i === this.scenes.length - 1) {
        return {
          scene,
          index: i,
          sceneTime: Math.min(duration, Math.max(0, projectTime - cursor)),
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
      schemaVersion: 1,
      application: "Auto Explainer Studio",
      projectName,
      format,
      updatedAt: new Date().toISOString(),
      scenes: this.scenes
    };
  }

  importJSON(data) {
    if (!data || !Array.isArray(data.scenes)) {
      throw new Error("Format storyboard tidak valid.");
    }

    if (data.scenes.length < 1) {
      throw new Error("Storyboard harus memiliki minimal satu adegan.");
    }

    this.scenes = data.scenes.map((scene, index) => ({
      id: scene.id || crypto.randomUUID(),
      title: String(scene.title || `Adegan ${index + 1}`),
      subtitle: String(scene.subtitle || ""),
      duration: Math.max(1, Math.min(30, Number(scene.duration) || 5)),
      elements: Array.isArray(scene.elements)
        ? scene.elements.map(element => ({
            ...element,
            id: element.id || crypto.randomUUID()
          }))
        : []
    }));

    this.activeSceneIndex = 0;
    return this.scenes;
  }
}
