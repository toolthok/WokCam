import type { AnimIn, Motion, Scene } from './model'

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
export const clamp01 = (v: number) => clamp(v, 0, 1)

// TTS Indonesia ≈ 140–150 kata/menit → ~2.4 kata/detik
export const WORDS_PER_SEC = 2.4

export function countWords(text: string) {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

export function estimateDuration(script: string, speed = 1) {
  const w = countWords(script)
  if (!w) return 2.5
  return clamp(w / (WORDS_PER_SEC * speed) + 0.8, 2.5, 30)
}

export function sceneDuration(s: Scene, speed = 1) {
  if (s.durationOverride != null) return clamp(s.durationOverride, 1, 60)
  return estimateDuration(s.script, speed)
}

export interface Segment {
  scene: Scene
  index: number
  start: number
  end: number
  dur: number
}

export function withTimings(scenes: Scene[], speed = 1): Segment[] {
  let t = 0
  return scenes.map((s, index) => {
    const dur = sceneDuration(s, speed)
    const seg: Segment = { scene: s, index, start: t, end: t + dur, dur }
    t += dur
    return seg
  })
}

export function totalDuration(scenes: Scene[], speed = 1) {
  return scenes.reduce((a, s) => a + sceneDuration(s, speed), 0)
}

export function fmtTime(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export interface RenderLayer {
  scene: Scene
  index: number
  local: number
  entrance: number
  motion: number
  top: boolean
}

export interface RenderResult {
  index: number
  layers: RenderLayer[]
  local: number
}

/**
 * Menentukan layer visual pada waktu `time`:
 * - layer dasar = scene aktif
 * - saat jendela transisi, scene berikutnya muncul di atas sebagai crossfade
 */
export function getRenderList(time: number, scenes: Scene[], speed = 1, trans = 0.5): RenderResult {
  if (!scenes.length) return { index: -1, layers: [], local: 0 }
  const total = totalDuration(scenes, speed)
  const t = clamp(time, 0, Math.max(0.0001, total - 0.0001))
  const segs = withTimings(scenes, speed)
  let i = segs.findIndex((s) => t >= s.start && t < s.end)
  if (i < 0) i = segs.length - 1
  const seg = segs[i]
  const local = clamp(t - seg.start, 0, seg.dur)
  const layers: RenderLayer[] = []
  const overlap = i < segs.length - 1 && trans > 0 && t > seg.end - trans
  if (overlap) {
    const q = clamp01((t - (seg.end - trans)) / trans)
    layers.push({ scene: seg.scene, index: i, local, entrance: 1, motion: local / seg.dur, top: false })
    layers.push({ scene: segs[i + 1].scene, index: i + 1, local: 0, entrance: q, motion: 0, top: true })
  } else {
    const e = i === 0 ? clamp01(local / Math.max(trans, 0.001)) : 1
    layers.push({ scene: seg.scene, index: i, local, entrance: e, motion: local / seg.dur, top: false })
  }
  return { index: i, layers, local }
}

/** Transform Ken Burns berdasar progres p (0..1). */
export function motionTransform(m: Motion, p: number, loop: boolean): string {
  const pe = loop ? clamp01(p) : clamp01(p / 0.4)
  const g = 0.16
  const pan = 7
  switch (m) {
    case 'zoom-in':
      return `scale(${(1 + g * pe).toFixed(4)})`
    case 'zoom-out':
      return `scale(${(1 + g * (1 - pe)).toFixed(4)})`
    case 'pan-left':
      return `scale(${(1 + g * 0.6).toFixed(4)}) translateX(${((0.5 - pe) * pan).toFixed(3)}%)`
    case 'pan-right':
      return `scale(${(1 + g * 0.6).toFixed(4)}) translateX(${((pe - 0.5) * pan).toFixed(3)}%)`
    case 'pan-up':
      return `scale(${(1 + g * 0.6).toFixed(4)}) translateY(${((0.5 - pe) * pan).toFixed(3)}%)`
    case 'pan-down':
      return `scale(${(1 + g * 0.6).toFixed(4)}) translateY(${((pe - 0.5) * pan).toFixed(3)}%)`
    default:
      return 'scale(1)'
  }
}

export function entranceStyle(a: AnimIn, e: number): React.CSSProperties {
  if (a === 'none') return { opacity: 1 }
  const ease = 1 - Math.pow(1 - e, 3)
  switch (a) {
    case 'fade':
      return { opacity: e }
    case 'slide-up':
      return { opacity: e, transform: `translateY(${((1 - ease) * 10).toFixed(3)}%)` }
    case 'slide-down':
      return { opacity: e, transform: `translateY(${(-(1 - ease) * 10).toFixed(3)}%)` }
    case 'zoom':
      return { opacity: e, transform: `scale(${(0.82 + 0.18 * ease).toFixed(4)})` }
  }
}

export interface WordTiming {
  word: string
  start: number
  end: number
}

export function wordTimings(script: string, dur: number): WordTiming[] {
  const words = script.trim() ? script.trim().split(/\s+/) : []
  if (!words.length) return []
  const weights = words.map((w) => Math.max(2, w.replace(/[^\p{L}\p{N}]/gu, '').length + 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let acc = 0
  return words.map((w, i) => {
    const s = (acc / total) * dur
    acc += weights[i]
    return { word: w, start: s, end: (acc / total) * dur }
  })
}

/** Waveform deterministik untuk mockup audio. */
export function waveform(seed: number, count: number) {
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    const v = Math.abs(Math.sin(seed * 37.7 + i * 1.31) * Math.cos(i * 0.61 + seed * 0.3))
    out.push(0.18 + 0.82 * Math.pow(v, 0.8))
  }
  return out
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .filter(Boolean)
}

export function groupIntoScenes(sentences: string[], maxWords = 22): string[] {
  const chunks: string[] = []
  let cur: string[] = []
  let n = 0
  for (const s of sentences) {
    const w = countWords(s)
    if (cur.length && n + w > maxWords) {
      chunks.push(cur.join(' '))
      cur = []
      n = 0
    }
    cur.push(s)
    n += w
  }
  if (cur.length) chunks.push(cur.join(' '))
  return chunks
}

/* ============================================================
   DATABASE GOOGLE SHEETS — ekspor TSV siap tempel (Ctrl+V di A1)
   ============================================================ */

const SHEET_HEADERS = [
  'video_id',
  'judul',
  'no_scene',
  'naskah',
  'durasi_detik',
  'aset',
  'gerakan',
  'anim_in',
  'anim_out',
  'voice',
  'status',
  'catatan',
]

/** ID video sederhana dari judul proyek: "3 Kebiasaan Pagi" → "3-kebiasaan-pagi" */
export function projectSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40) || 'video'
  )
}

/**
 * Membangun TSV (tab-separated) dari seluruh scene.
 * Tempel langsung di Google Sheets sel A1 — tab otomatis jadi kolom.
 */
export function buildSheetTsv(
  scenes: Scene[],
  projectName: string,
  speed = 1,
  voiceName = 'Sari',
): string {
  const id = projectSlug(projectName)
  const esc = (v: string) => v.replace(/\t/g, ' ').replace(/\r?\n/g, ' ')
  const rows: string[] = [SHEET_HEADERS.join('\t')]
  scenes.forEach((s, i) => {
    rows.push(
      [
        `${id}-${String(i + 1).padStart(3, '0')}`,
        esc(projectName),
        String(i + 1),
        esc(s.script),
        sceneDuration(s, speed).toFixed(1),
        s.assetLabel,
        s.motion,
        s.animIn,
        s.animOut,
        voiceName,
        s.status === 'ready' ? 'Siap' : 'Draft',
        '',
      ].join('\t'),
    )
  })
  return rows.join('\n')
}
