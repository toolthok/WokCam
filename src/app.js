
import { CompositionEngine } from "./composition-engine.js";
import { StoryboardEngine } from "./storyboard-engine.js";

const $ = id => document.getElementById(id);

const canvas = $("previewCanvas");
const composition = new CompositionEngine(canvas);
const storyboard = new StoryboardEngine();

let projectName = "Proyek Explainer Baru";
let format = "vertical";
let playing = false;
let elapsed = 0;
let lastFrame = 0;
let animationFrame = null;
let speed = 1;

const STORAGE_KEY = "aes_v03_project";

const preset = {
  background: "#F7F7F5",
  grid: true,
  gridSize: 36
};

function setStatus(message) {
  $("status").textContent = message;
}

function currentScene() {
  return storyboard.activeScene;
}

function updateSceneList() {
  const container = $("sceneList");
  container.innerHTML = "";

  storyboard.scenes.forEach((scene, index) => {
    const button = document.createElement("button");
    button.className =
      "scene-item" +
      (index === storyboard.activeSceneIndex ? " active" : "");

    const title = document.createElement("strong");
    title.textContent = scene.title || `Adegan ${index + 1}`;

    const info = document.createElement("small");
    info.textContent =
      `${Number(scene.duration)} detik · ${scene.elements.length} elemen`;

    button.append(title, info);

    button.addEventListener("click", () => {
      stopPlayback();
      storyboard.selectScene(index);
      renderEditor();
      renderPreview();
    });

    container.appendChild(button);
  });
}

function updateElementList() {
  const container = $("elementList");
  container.innerHTML = "";

  const scene = currentScene();
  if (!scene) return;

  scene.elements.forEach((element, index) => {
    const button = document.createElement("button");
    button.className = "element-item";

    const name = document.createElement("strong");
    name.textContent = element.type.toUpperCase();

    const info = document.createElement("small");
    info.textContent = element.text || element.label ||
      `Elemen ${index + 1}`;

    button.append(name, info);
    button.addEventListener("click", () => {
      if (!confirm("Hapus elemen visual ini?")) return;
      scene.elements.splice(index, 1);
      updateElementList();
      updateSceneList();
      renderPreview();
    });

    container.appendChild(button);
  });
}

function renderEditor() {
  const scene = currentScene();
  if (!scene) return;

  $("sceneTitle").value = scene.title;
  $("sceneSubtitle").value = scene.subtitle;
  $("sceneDuration").value = scene.duration;

  updateSceneList();
  updateElementList();
}

function renderPreview() {
  const sceneInfo = storyboard.getSceneAtTime(elapsed);
  if (!sceneInfo) return;

  const { scene, index, sceneTime } = sceneInfo;

  storyboard.activeSceneIndex = index;
  composition.render(scene, sceneTime, preset);

  $("timeLabel").textContent =
    `${formatTime(elapsed)} / ${formatTime(storyboard.totalDuration())}`;

  $("timelineRange").value =
    storyboard.totalDuration()
      ? elapsed / storyboard.totalDuration() * 1000
      : 0;

  updateSceneList();
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:` +
    `${String(value % 60).padStart(2, "0")}`;
}

function playFrame(timestamp) {
  if (!playing) return;

  if (!lastFrame) lastFrame = timestamp;

  const delta = Math.min((timestamp - lastFrame) / 1000, 0.1);
  lastFrame = timestamp;

  elapsed += delta * speed;

  if (elapsed >= storyboard.totalDuration()) {
    elapsed = storyboard.totalDuration();
    stopPlayback();
  }

  renderPreview();

  if (playing) {
    animationFrame = requestAnimationFrame(playFrame);
  }
}

function startPlayback() {
  if (playing) return;

  if (elapsed >= storyboard.totalDuration()) {
    elapsed = 0;
  }

  playing = true;
  lastFrame = 0;
  $("playBtn").textContent = "Ⅱ Jeda";
  setStatus("Memutar preview");

  animationFrame = requestAnimationFrame(playFrame);
}

function stopPlayback() {
  playing = false;

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  animationFrame = null;
  lastFrame = 0;
  $("playBtn").textContent = "▶ Putar";
  setStatus("Preview dijeda");
}

function saveProject() {
  const data = storyboard.exportJSON(projectName, format);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setStatus("Proyek tersimpan di perangkat");
  } catch (error) {
    setStatus("Penyimpanan gagal");
    console.error(error);
  }
}

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const data = JSON.parse(raw);
      storyboard.importJSON(data);
      projectName = data.projectName || projectName;
      format = data.format || format;
    } else {
      storyboard.createDefaultProject();
    }
  } catch (error) {
    console.warn("Memulai proyek baru:", error);
    storyboard.createDefaultProject();
  }

  $("projectName").value = projectName;
  $("formatSelect").value = format;
  composition.setFormat(format);
  elapsed = 0;
  renderEditor();
  renderPreview();
}

function downloadJSON(data, filename) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$("projectName").addEventListener("change", event => {
  projectName = event.target.value.trim() || "Proyek Baru";
});

$("formatSelect").addEventListener("change", event => {
  format = event.target.value;
  composition.setFormat(format);
  renderPreview();
});

$("speedRange").addEventListener("change", event => {
  speed = Number(event.target.value) || 1;
});

$("playBtn").addEventListener("click", () => {
  if (playing) {
    stopPlayback();
  } else {
    startPlayback();
  }
});

$("resetBtn").addEventListener("click", () => {
  stopPlayback();
  elapsed = 0;
  renderPreview();
});

$("timelineRange").addEventListener("input", event => {
  stopPlayback();
  elapsed = Number(event.target.value) / 1000 *
    storyboard.totalDuration();

  const info = storyboard.getSceneAtTime(elapsed);

  if (info) {
    storyboard.activeSceneIndex = info.index;
    renderEditor();
  }

  renderPreview();
});

$("addSceneBtn").addEventListener("click", () => {
  stopPlayback();
  storyboard.addScene();
  elapsed = storyboard.scenes
    .slice(0, -1)
    .reduce((sum, scene) => sum + Number(scene.duration), 0);

  renderEditor();
  renderPreview();
});

$("applySceneBtn").addEventListener("click", () => {
  const scene = currentScene();
  if (!scene) return;

  scene.title = $("sceneTitle").value.trim();
  scene.subtitle = $("sceneSubtitle").value.trim();
  scene.duration = Math.max(
    1,
    Math.min(30, Number($("sceneDuration").value) || 5)
  );

  elapsed = storyboard.scenes
    .slice(0, storyboard.activeSceneIndex)
    .reduce((sum, item) => sum + Number(item.duration), 0);

  renderEditor();
  renderPreview();
  setStatus("Adegan diperbarui");
});

$("addCardBtn").addEventListener("click", () => {
  const scene = currentScene();

  scene.elements.push({
    id: crypto.randomUUID(),
    type: "card",
    x: canvas.width / 2,
    y: canvas.height * 0.70,
    width: canvas.width * 0.65,
    height: canvas.width * 0.28,
    label: "KARTU INFORMASI",
    color: "#FFFFFF",
    accent: "#B7C8E5",
    start: 0.6,
    duration: Math.max(1, scene.duration - 0.8),
    entrance: "pop",
    exitDuration: 0.4,
    float: true
  });

  updateElementList();
  updateSceneList();
  renderPreview();
});

$("addTextBtn").addEventListener("click", () => {
  const scene = currentScene();

  scene.elements.push({
    id: crypto.randomUUID(),
    type: "text",
    text: "Teks informasi baru",
    x: canvas.width * 0.12,
    y: canvas.height * 0.55,
    width: canvas.width * 0.76,
    size: canvas.width * 0.055,
    weight: 700,
    color: "#537A65",
    start: 0.8,
    duration: Math.max(1, scene.duration - 1),
    entrance: "slide"
  });

  updateElementList();
  updateSceneList();
  renderPreview();
});

$("saveBtn").addEventListener("click", saveProject);

$("exportProjectBtn").addEventListener("click", () => {
  const data = storyboard.exportJSON(projectName, format);
  downloadJSON(data, "storyboard-auto-explainer.json");
});

$("importProjectInput").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    storyboard.importJSON(data);

    projectName = data.projectName || "Proyek Impor";
    format = data.format || "vertical";

    $("projectName").value = projectName;
    $("formatSelect").value = format;

    composition.setFormat(format);
    elapsed = 0;

    renderEditor();
    renderPreview();
    setStatus("Storyboard berhasil diimpor");
  } catch (error) {
    alert("Gagal mengimpor storyboard: " + error.message);
  }

  event.target.value = "";
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => console.warn("Service Worker:", error));
  });
}

loadProject();
