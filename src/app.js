
import { CompositionEngine } from "./composition-engine.js";
import { StoryboardEngine } from "./storyboard-engine.js";

const $ = id => document.getElementById(id);

const canvas = $("previewCanvas");
const composition = new CompositionEngine(canvas);
const storyboard = new StoryboardEngine();

const STORAGE_KEY = "aes_v04_project";
const PRESET_URL = "./presets/minimalist-3d-editorial.json";

let projectName = "Proyek Explainer Baru";
let format = "vertical";
let selectedElementId = null;
let playing = false;
let elapsed = 0;
let speed = 1;
let lastFrame = 0;
let animationFrame = null;
let preset = {};

function status(message) {
  $("status").textContent = message;
}

function scene() {
  return storyboard.activeScene;
}

function selectedElement() {
  return scene()?.elements.find(
    item => item.id === selectedElementId
  ) || null;
}

function makeId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "el-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

async function loadPreset() {
  try {
    const response = await fetch(PRESET_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error("Preset tidak ditemukan.");

    preset = await response.json();
    composition.setPreset(preset);
    status("Preset berhasil dimuat");
  } catch (error) {
    console.warn("Preset menggunakan nilai bawaan:", error);
    preset = {
      visual: {
        background: "#F7F7F5",
        grid: true,
        gridSize: 36,
        textColor: "#171717",
        fontFamily: "Arial, sans-serif"
      }
    };
    composition.setPreset(preset);
  }
}

function updateSceneList() {
  const container = $("sceneList");
  container.replaceChildren();

  storyboard.scenes.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "scene-item" +
      (index === storyboard.activeSceneIndex ? " active" : "");

    const title = document.createElement("strong");
    title.textContent = item.title || `Adegan ${index + 1}`;

    const detail = document.createElement("small");
    detail.textContent =
      `${item.duration} detik · ${item.elements.length} elemen`;

    button.append(title, detail);

    button.addEventListener("click", () => {
      stop();
      storyboard.selectScene(index);
      selectedElementId = null;

      elapsed = storyboard.scenes
        .slice(0, index)
        .reduce((sum, s) => sum + Number(s.duration), 0);

      updateEditor();
      render();
    });

    container.appendChild(button);
  });
}

function updateElementList() {
  const container = $("elementList");
  container.replaceChildren();

  const current = scene();
  if (!current) return;

  current.elements.forEach(element => {
    const button = document.createElement("button");
    button.className = "element-item" +
      (element.id === selectedElementId ? " active" : "");

    const name = document.createElement("strong");
    name.textContent = element.type.toUpperCase();

    const detail = document.createElement("small");
    detail.textContent =
      element.text || element.label || element.id;

    button.append(name, detail);

    button.addEventListener("click", () => {
      selectedElementId = element.id;
      updateElementList();
      updateInspector();
      render();
    });

    container.appendChild(button);
  });
}

function updateInspector() {
  const element = selectedElement();

  $("emptyInspector").hidden = !!element;
  $("elementInspector").hidden = !element;

  if (!element) return;

  const values = {
    elementText: element.text ?? element.label ?? "",
    elementX: element.x ?? 500,
    elementY: element.y ?? 500,
    elementWidth: element.width ?? 700,
    elementHeight: element.height ?? 180,
    elementSize: element.size ?? 55,
    elementColor: element.color || "#171717",
    elementAccent: element.accent || "#A7C9B5",
    elementStart: element.start ?? 0,
    elementDuration: element.duration ?? scene().duration,
    elementEntrance: element.entrance || "fade",
    elementMotion: element.motion || "none",
    elementRotation: element.rotation || 0,
    elementExit: element.exitDuration ?? 0.4
  };

  for (const [id, value] of Object.entries(values)) {
    $(id).value = value;
  }
}

function updateEditor() {
  const current = scene();
  if (!current) return;

  $("sceneTitle").value = current.title;
  $("sceneSubtitle").value = current.subtitle;
  $("sceneDuration").value = current.duration;

  updateSceneList();
  updateElementList();
  updateInspector();
}

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(value));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:` +
    `${String(seconds % 60).padStart(2, "0")}`;
}

function render() {
  const info = storyboard.getSceneAtTime(elapsed);
  if (!info) return;

  storyboard.activeSceneIndex = info.index;

  composition.render(info.scene, info.sceneTime);

  $("timeLabel").textContent =
    `${formatTime(elapsed)} / ${formatTime(storyboard.totalDuration())}`;

  $("timelineRange").value = storyboard.totalDuration()
    ? elapsed / storyboard.totalDuration() * 1000
    : 0;

  updateSceneList();
}

function frame(timestamp) {
  if (!playing) return;

  if (!lastFrame) lastFrame = timestamp;

  const delta = Math.min((timestamp - lastFrame) / 1000, 0.1);
  lastFrame = timestamp;

  elapsed += delta * speed;

  if (elapsed >= storyboard.totalDuration()) {
    elapsed = storyboard.totalDuration();
    stop();
    render();
    return;
  }

  render();
  animationFrame = requestAnimationFrame(frame);
}

function play() {
  if (playing) return;

  if (elapsed >= storyboard.totalDuration()) elapsed = 0;

  playing = true;
  lastFrame = 0;
  $("playBtn").textContent = "Ⅱ Jeda";
  status("Preview berjalan");

  animationFrame = requestAnimationFrame(frame);
}

function stop() {
  playing = false;

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  animationFrame = null;
  lastFrame = 0;
  $("playBtn").textContent = "▶ Putar";
}

function addElement(type) {
  const current = scene();
  if (!current) return;

  const base = {
    id: makeId(),
    type,
    x: 500,
    y: 650,
    width: 700,
    height: 180,
    start: 0.5,
    duration: Math.max(0.1, current.duration - 0.5),
    entranceDuration: 0.65,
    exitDuration: 0.4,
    entrance: "pop",
    easing: "ease-out",
    motion: "none",
    rotation: 0
  };

  let element;

  if (type === "text") {
    element = {
      ...base,
      text: "Teks informasi baru",
      size: 58,
      weight: 700,
      color: "#171717",
      width: 800
    };
  } else if (type === "card") {
    element = {
      ...base,
      label: "KARTU INFORMASI",
      color: "#FFFFFF",
      accent: "#A7C9B5",
      width: 680,
      height: 230
    };
  } else {
    element = {
      ...base,
      radius: 110,
      color: "#DCE9E1",
      width: 220,
      height: 220
    };
  }

  current.elements.push(element);
  selectedElementId = element.id;

  updateEditor();
  render();
}

function applyInspector() {
  const element = selectedElement();
  if (!element) return;

  const numberFields = {
    x: "elementX",
    y: "elementY",
    width: "elementWidth",
    height: "elementHeight",
    size: "elementSize",
    start: "elementStart",
    duration: "elementDuration",
    rotation: "elementRotation",
    exitDuration: "elementExit"
  };

  for (const [key, id] of Object.entries(numberFields)) {
    const input = $(id);
    if (input.value !== "") {
      element[key] = Number(input.value);
    }
  }

  element.x = Math.max(0, Math.min(1000, element.x));
  element.y = Math.max(0, Math.min(1000, element.y));
  element.width = Math.max(10, Math.min(1000, element.width));
  element.height = Math.max(10, Math.min(1000, element.height));
  element.start = Math.max(0, element.start);
  element.duration = Math.max(0.1, element.duration);
  element.exitDuration = Math.max(0, element.exitDuration);

  const text = $("elementText").value;

  if (element.type === "card") {
    element.label = text;
  } else if (element.type === "text") {
    element.text = text;
  }

  element.color = $("elementColor").value;
  element.accent = $("elementAccent").value;
  element.entrance = $("elementEntrance").value;
  element.motion = $("elementMotion").value;
  element.rotation = Number($("elementRotation").value) || 0;

  updateElementList();
  render();
}

function saveProject() {
  const data = storyboard.exportJSON(projectName, format);

  data.presetId = preset.id || "minimalist-3d-editorial";
  data.schemaVersion = 2;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    status("Proyek tersimpan di perangkat");
  } catch (error) {
    status("Penyimpanan gagal");
    console.error(error);
  }
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
    console.warn("Proyek lama tidak dapat dimuat:", error);
    storyboard.createDefaultProject();
  }

  $("projectName").value = projectName;
  $("formatSelect").value = format;

  composition.setFormat(format);
  elapsed = 0;

  updateEditor();
  render();
}

// Scene controls
$("addSceneBtn").addEventListener("click", () => {
  stop();
  const item = storyboard.addScene();

  elapsed = storyboard.scenes
    .slice(0, -1)
    .reduce((sum, s) => sum + Number(s.duration), 0);

  selectedElementId = null;
  updateEditor();
  render();
});

$("applySceneBtn").addEventListener("click", () => {
  const current = scene();
  if (!current) return;

  current.title = $("sceneTitle").value.trim();
  current.subtitle = $("sceneSubtitle").value.trim();
  current.duration = Math.max(
    1,
    Math.min(30, Number($("sceneDuration").value) || 5)
  );

  updateEditor();
  render();
  status("Adegan diperbarui");
});

// Element controls
$("addCardBtn").addEventListener("click", () => addElement("card"));
$("addTextBtn").addEventListener("click", () => addElement("text"));
$("addCircleBtn").addEventListener("click", () => addElement("circle"));

$("deleteElementBtn").addEventListener("click", () => {
  const current = scene();
  if (!current || !selectedElementId) return;

  current.elements = current.elements.filter(
    item => item.id !== selectedElementId
  );

  selectedElementId = null;
  updateEditor();
  render();
});

const inspectorInputs = [
  "elementText",
  "elementX",
  "elementY",
  "elementWidth",
  "elementHeight",
  "elementSize",
  "elementColor",
  "elementAccent",
  "elementStart",
  "elementDuration",
  "elementEntrance",
  "elementMotion",
  "elementRotation",
  "elementExit"
];

inspectorInputs.forEach(id => {
  $(id).addEventListener("input", applyInspector);
  $(id).addEventListener("change", applyInspector);
});

// Playback
$("playBtn").addEventListener("click", () => {
  if (playing) {
    stop();
    status("Preview dijeda");
  } else {
    play();
  }
});

$("resetBtn").addEventListener("click", () => {
  stop();
  elapsed = 0;
  render();
});

$("speedRange").addEventListener("change", event => {
  speed = Number(event.target.value) || 1;
});

$("timelineRange").addEventListener("input", event => {
  stop();
  elapsed = Number(event.target.value) / 1000 *
    storyboard.totalDuration();

  const info = storyboard.getSceneAtTime(elapsed);
  if (info) {
    storyboard.activeSceneIndex = info.index;
    updateEditor();
  }

  render();
});

// Format and project
$("formatSelect").addEventListener("change", event => {
  format = event.target.value;
  composition.setFormat(format);
  render();
});

$("projectName").addEventListener("change", event => {
  projectName = event.target.value.trim() || "Proyek Baru";
});

$("saveBtn").addEventListener("click", saveProject);

$("exportProjectBtn").addEventListener("click", () => {
  const data = storyboard.exportJSON(projectName, format);
  data.schemaVersion = 2;
  data.presetId = preset.id || "minimalist-3d-editorial";

  downloadJSON(data, "aes-storyboard-v04.json");
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
    selectedElementId = null;
    elapsed = 0;

    updateEditor();
    render();
    status("Storyboard berhasil diimpor");
  } catch (error) {
    alert("Impor gagal: " + error.message);
  }

  event.target.value = "";
});

async function initialize() {
  await loadPreset();
  loadProject();

  if ("serviceWorker" in navigator &&
      location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => console.warn("Service Worker:", error));
  }
}

initialize();
