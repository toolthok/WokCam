'use client'

import { create } from 'zustand'
import {
  ANIMATION_PRESETS,
  IMG_STOCKS,
  INITIAL_SCENES,
  makeScene,
  newId,
  type AnimationPreset,
  type Aspect,
  type Caption,
  type Scene,
} from './model'
import { groupIntoScenes, splitSentences, totalDuration, sceneDuration } from './engine'

const PRESETS_KEY = 'wokcam-presets'

function loadCustomPresets(): AnimationPreset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    return raw ? (JSON.parse(raw) as AnimationPreset[]) : []
  } catch {
    return []
  }
}

function persistCustomPresets(list: AnimationPreset[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(list))
  } catch {
    /* demo: abaikan kalau storage penuh */
  }
}

interface VoiceState {
  voiceId: string
  speed: number
  pitch: number
  volume: number
}

interface EditorStore {
  scenes: Scene[]
  selectedId: string
  playing: boolean
  time: number
  aspect: Aspect
  zoom: number // px per detik
  transition: number
  voice: VoiceState
  caption: Caption
  music: { name: string; volume: number; enabled: boolean }
  projectName: string
  customPresets: AnimationPreset[]

  // koleksi animasi
  applyPreset: (presetId: string, targetSceneId?: string | 'all') => void
  savePresetFromScene: (sceneId: string, name: string) => void
  deletePreset: (presetId: string) => void

  // aksi scene
  addScene: (afterId?: string) => void
  deleteScene: (id: string) => void
  duplicateScene: (id: string) => void
  moveScene: (id: string, dir: -1 | 1) => void
  reorder: (from: number, to: number) => void
  selectScene: (id: string, seek?: boolean) => void
  updateScene: (id: string, patch: Partial<Scene>) => void
  importScript: (text: string) => number
  splitScene: (id: string) => void
  summarizeScene: (id: string) => void

  // playback
  setTime: (t: number) => void
  setPlaying: (p: boolean) => void
  togglePlay: () => void
  seekScene: (index: number) => void

  // pengaturan global
  setAspect: (a: Aspect) => void
  setZoom: (z: number) => void
  setTransition: (t: number) => void
  setVoice: (patch: Partial<VoiceState>) => void
  setCaption: (patch: Partial<Caption>) => void
  setMusic: (patch: Partial<EditorStore['music']>) => void
  setProjectName: (n: string) => void
  reset: () => void
}

export const useEditor = create<EditorStore>((set, get) => ({
  scenes: INITIAL_SCENES,
  selectedId: INITIAL_SCENES[0].id,
  playing: false,
  time: 0,
  aspect: '9:16',
  zoom: 40,
  transition: 0.5,
  voice: { voiceId: 'sari', speed: 1, pitch: 0, volume: 80 },
  caption: {
    enabled: true,
    preset: 'karaoke',
    font: 'poppins',
    size: 22,
    position: 'bottom',
    highlight: true,
    accent: '#FACC15',
  },
  music: { name: 'Lo-fi Chill — Optimis', volume: 40, enabled: true },
  projectName: '3 Kebiasaan Pagi yang Mengubah Hidup',
  customPresets: loadCustomPresets(),

  applyPreset: (presetId, targetSceneId) => {
    const { scenes, customPresets, selectedId } = get()
    const preset = [...ANIMATION_PRESETS, ...customPresets].find((p) => p.id === presetId)
    if (!preset) return
    const patch: Partial<Scene> = {
      motion: preset.motion,
      animIn: preset.animIn,
      animOut: preset.animOut,
      loop: preset.loop,
    }
    if (targetSceneId === 'all') {
      set({ scenes: scenes.map((s) => ({ ...s, ...patch })) })
      return
    }
    const id = targetSceneId ?? selectedId
    set({ scenes: scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  },

  savePresetFromScene: (sceneId, name) => {
    const { scenes, customPresets } = get()
    const s = scenes.find((x) => x.id === sceneId)
    if (!s || !name.trim()) return
    const preset: AnimationPreset = {
      id: `c-${newId()}`,
      name: name.trim().slice(0, 28),
      desc: `Preset dari scene: ${s.script.slice(0, 60)}${s.script.length > 60 ? '…' : ''}`,
      bestFor: 'Preset buatan sendiri',
      motion: s.motion,
      animIn: s.animIn,
      animOut: s.animOut,
      loop: s.loop,
      custom: true,
    }
    const next = [preset, ...customPresets]
    persistCustomPresets(next)
    set({ customPresets: next })
  },

  deletePreset: (presetId) => {
    const { customPresets } = get()
    const next = customPresets.filter((p) => p.id !== presetId)
    persistCustomPresets(next)
    set({ customPresets: next })
  },

  addScene: (afterId) => {
    const { scenes, selectedId } = get()
    const idx = afterId ? scenes.findIndex((s) => s.id === afterId) : scenes.findIndex((s) => s.id === selectedId)
    const at = idx < 0 ? scenes.length : idx + 1
    const s = makeScene({ script: '' }, scenes.length)
    const next = [...scenes]
    next.splice(at, 0, s)
    set({ scenes: next, selectedId: s.id, playing: false })
  },

  deleteScene: (id) => {
    const { scenes } = get()
    if (scenes.length <= 1) return
    const idx = scenes.findIndex((s) => s.id === id)
    const next = scenes.filter((s) => s.id !== id)
    const newSel = next[Math.min(idx, next.length - 1)]
    set({ scenes: next, selectedId: newSel.id, time: 0, playing: false })
  },

  duplicateScene: (id) => {
    const { scenes } = get()
    const idx = scenes.findIndex((s) => s.id === id)
    if (idx < 0) return
    const copy: Scene = { ...scenes[idx], id: newId() }
    const next = [...scenes]
    next.splice(idx + 1, 0, copy)
    set({ scenes: next, selectedId: copy.id, playing: false })
  },

  moveScene: (id, dir) => {
    const { scenes } = get()
    const idx = scenes.findIndex((s) => s.id === id)
    const to = idx + dir
    if (idx < 0 || to < 0 || to >= scenes.length) return
    const next = [...scenes]
    ;[next[idx], next[to]] = [next[to], next[idx]]
    set({ scenes: next, time: 0 })
  },

  reorder: (from, to) => {
    const { scenes } = get()
    if (from === to || from < 0 || to < 0 || from >= scenes.length || to >= scenes.length) return
    const next = [...scenes]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    set({ scenes: next, time: 0 })
  },

  selectScene: (id, seek = true) => {
    const { scenes, voice } = get()
    set({ selectedId: id })
    if (seek) {
      const idx = scenes.findIndex((s) => s.id === id)
      if (idx >= 0) {
        let t = 0
        for (let i = 0; i < idx; i++) t += sceneDuration(scenes[i], voice.speed)
        set({ time: t })
      }
    }
  },

  updateScene: (id, patch) => {
    const { scenes } = get()
    set({ scenes: scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  },

  importScript: (text) => {
    const chunks = groupIntoScenes(splitSentences(text))
    if (!chunks.length) return 0
    const base = get().scenes.length
    const created = chunks.map((c, i) =>
      makeScene(
        {
          script: c,
          image: IMG_STOCKS[(base + i) % IMG_STOCKS.length].img,
          gradient: IMG_STOCKS[(base + i) % IMG_STOCKS.length].gradient,
          assetLabel: `Stok: ${IMG_STOCKS[(base + i) % IMG_STOCKS.length].label}`,
        },
        base + i,
      ),
    )
    set({ scenes: created, selectedId: created[0].id, time: 0, playing: false })
    return created.length
  },

  splitScene: (id) => {
    const { scenes } = get()
    const idx = scenes.findIndex((s) => s.id === id)
    if (idx < 0) return
    const s = scenes[idx]
    const parts = splitSentences(s.script)
    if (parts.length < 2) return
    const half = Math.ceil(parts.length / 2)
    const a = parts.slice(0, half).join(' ')
    const b = parts.slice(half).join(' ')
    const copy: Scene = { ...s, script: a }
    const nb: Scene = { ...s, id: newId(), script: b }
    const next = [...scenes]
    next.splice(idx, 1, copy)
    next.splice(idx + 1, 0, nb)
    set({ scenes: next, selectedId: copy.id })
  },

  summarizeScene: (id) => {
    const { scenes } = get()
    const s = scenes.find((x) => x.id === id)
    if (!s) return
    const parts = splitSentences(s.script)
    if (parts.length < 2) return
    const short = parts.slice(0, Math.max(1, Math.round(parts.length / 2))).join(' ')
    set({ scenes: scenes.map((x) => (x.id === id ? { ...x, script: short } : x)) })
  },

  setTime: (t) => set({ time: t }),
  setPlaying: (p) => set({ playing: p }),
  togglePlay: () => {
    const { playing, time, scenes, voice } = get()
    const total = totalDuration(scenes, voice.speed)
    if (!playing && time >= total) set({ time: 0, playing: true })
    else set({ playing: !playing })
  },
  seekScene: (index) => {
    const { scenes, voice } = get()
    if (index < 0 || index >= scenes.length) return
    let t = 0
    for (let i = 0; i < index; i++) t += sceneDuration(scenes[i], voice.speed)
    set({ time: t, selectedId: scenes[index].id })
  },

  setAspect: (a) => set({ aspect: a }),
  setZoom: (z) => set({ zoom: z }),
  setTransition: (t) => set({ transition: clampT(t) }),
  setVoice: (patch) => set({ voice: { ...get().voice, ...patch } }),
  setCaption: (patch) => set({ caption: { ...get().caption, ...patch } }),
  setMusic: (patch) => set({ music: { ...get().music, ...patch } }),
  setProjectName: (n) => set({ projectName: n }),
  reset: () =>
    set({
      scenes: INITIAL_SCENES,
      selectedId: INITIAL_SCENES[0].id,
      time: 0,
      playing: false,
    }),
}))

function clampT(t: number) {
  return Math.min(1.5, Math.max(0.1, t))
}
