'use client'

/* ══════════ Suara (TTS) — pengaturan, pemutar, dan "tahan scene" ══════════
 * Dua penyedia suara:
 *   • browser : Web Speech API (gratis, hanya Chrome yang andal)
 *   • gemini  : Gemini TTS dengan key milik user (audio asli, di-cache, durasi tepat)
 * Sinkron: bila narasi scene masih berjalan saat playhead mencapai akhir scene, playhead DITAHAN
 * (batasTahan) sampai suara selesai — suara tidak lagi terpotong saat pindah scene.
 * Pengaturan (termasuk key) hanya disimpan di localStorage perangkat ini.
 */

import { create } from 'zustand'
import { useEditor } from './store'
import { hitungTiming, sceneIndexDiWaktu, teksTanpaMarker, type SceneProyek } from './proyek'
import { kunciSuara } from './suara-audio'

export const KUNCI_SUARA = 'wokcam.suara.v1'
export const MODEL_GEMINI_BAWAAN = 'gemini-3.1-flash-tts-preview'
export const GAYA_BAWAAN = 'Bacakan dengan jelas dan natural dalam Bahasa Indonesia:'

export type PengaturanSuara = {
  aktif: boolean
  provider: 'browser' | 'gemini'
  voiceURI: string
  rate: number
  pitch: number
  tahan: boolean
  gKey: string
  gModel: string
  gVoice: string
  gGaya: string
}
const AWAL: PengaturanSuara = {
  aktif: false, provider: 'browser', voiceURI: '', rate: 1, pitch: 1, tahan: true,
  gKey: '', gModel: MODEL_GEMINI_BAWAAN, gVoice: 'Kore', gGaya: GAYA_BAWAAN,
}

type SuaraStore = PengaturanSuara & {
  hidrasi: () => void
  ubah: (patch: Partial<PengaturanSuara>) => void
}

const jepit = (v: number, lo: number, hi: number, bawaan: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : bawaan)
const str = (v: unknown, bawaan: string) => (typeof v === 'string' ? v : bawaan)

function ambilPengaturan(s: PengaturanSuara): PengaturanSuara {
  const { aktif, provider, voiceURI, rate, pitch, tahan, gKey, gModel, gVoice, gGaya } = s
  return { aktif, provider, voiceURI, rate, pitch, tahan, gKey, gModel, gVoice, gGaya }
}

export const useSuara = create<SuaraStore>((set, get) => ({
  ...AWAL,
  hidrasi: () => {
    try {
      const raw = window.localStorage.getItem(KUNCI_SUARA)
      if (!raw) return
      const o = JSON.parse(raw) as Partial<Record<keyof PengaturanSuara, unknown>>
      set({
        aktif: o.aktif === true,
        provider: o.provider === 'gemini' ? 'gemini' : 'browser',
        voiceURI: str(o.voiceURI, ''),
        rate: jepit(Number(o.rate), 0.6, 1.6, 1),
        pitch: jepit(Number(o.pitch), 0.5, 1.5, 1),
        tahan: o.tahan !== false,
        gKey: str(o.gKey, ''),
        gModel: str(o.gModel, MODEL_GEMINI_BAWAAN) || MODEL_GEMINI_BAWAAN,
        gVoice: str(o.gVoice, 'Kore') || 'Kore',
        gGaya: str(o.gGaya, GAYA_BAWAAN),
      })
    } catch {
      /* data rusak → pakai bawaan */
    }
  },
  ubah: (patch) => {
    set(patch)
    try {
      window.localStorage.setItem(KUNCI_SUARA, JSON.stringify(ambilPengaturan(get())))
    } catch {
      /* mode privat */
    }
  },
}))

/* ── Status "sedang bicara" (dipakai tahan scene) ── */
export const runtime = { bicara: false, sceneId: '', sejak: 0 }
let token = 0
let audioEl: HTMLAudioElement | null = null

/** Batas waktu (dtk) yang tak boleh dilewati playhead selagi narasi scene ini berjalan; null = bebas. */
export function batasTahan(): number | null {
  const p = useSuara.getState()
  if (!p.aktif || !p.tahan || !runtime.bicara) return null
  if (Date.now() - runtime.sejak > 90000) return null // pengaman: jangan membeku selamanya
  const { scenes, time } = useEditor.getState()
  const segs = hitungTiming(scenes)
  const i = sceneIndexDiWaktu(segs, time)
  const s = scenes[i]
  if (!s || s.id !== runtime.sceneId) return null
  return segs[i].mulai + segs[i].dur
}

export const dukungSuara = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

export function teksBacaan(s: Pick<SceneProyek, 'naskah' | 'teks'>): string {
  return (s.naskah || teksTanpaMarker(s.teks)).replace(/\s+/g, ' ').trim()
}

/** Kunci cache audio Gemini untuk satu scene (berubah bila teks/model/suara/gaya berubah). */
export function kunciScene(s: Pick<SceneProyek, 'naskah' | 'teks'>, p: Pick<PengaturanSuara, 'gModel' | 'gVoice' | 'gGaya'>): string {
  return kunciSuara([teksBacaan(s), p.gModel.trim(), p.gVoice, p.gGaya.trim()])
}

export function ambilSuara(): Promise<SpeechSynthesisVoice[]> {
  if (!dukungSuara()) return Promise.resolve([])
  const ss = window.speechSynthesis
  const sekarang = ss.getVoices()
  if (sekarang.length) return Promise.resolve(sekarang)
  return new Promise((res) => {
    const selesai = () => { ss.removeEventListener('voiceschanged', selesai); res(ss.getVoices()) }
    ss.addEventListener('voiceschanged', selesai)
    setTimeout(selesai, 1500) // sebagian browser tak pernah memicu event
  })
}

function buatUtterance(teks: string, p: PengaturanSuara, suara: SpeechSynthesisVoice[], volume = 1): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(teks)
  const v = suara.find((x) => x.voiceURI === p.voiceURI)
  if (v) { u.voice = v; u.lang = v.lang } else u.lang = 'id-ID'
  u.rate = p.rate
  u.pitch = p.pitch
  u.volume = volume
  return u
}

export function henti(): void {
  token++
  runtime.bicara = false
  if (dukungSuara()) window.speechSynthesis.cancel()
  if (audioEl) { audioEl.pause(); audioEl = null }
}

/** Web Speech: bacakan `teks` untuk scene `sceneId`. */
export function bicara(teks: string, p: PengaturanSuara, suara: SpeechSynthesisVoice[], sceneId = ''): void {
  henti()
  if (!dukungSuara() || !teks) return
  const tok = token
  const u = buatUtterance(teks, p, suara)
  runtime.bicara = true; runtime.sceneId = sceneId; runtime.sejak = Date.now()
  const selesai = () => { if (tok === token) runtime.bicara = false }
  u.onend = selesai
  u.onerror = selesai
  window.speechSynthesis.speak(u)
  setTimeout(() => { if (tok === token && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) runtime.bicara = false }, 4000)
}

/** Putar audio jadi (Gemini) mulai dari `offsetDetik` di dalam scene. */
export function mainkanAudio(url: string, offsetDetik: number, sceneId: string): void {
  henti()
  const tok = token
  const a = new Audio(url)
  audioEl = a
  runtime.bicara = true; runtime.sceneId = sceneId; runtime.sejak = Date.now()
  const selesai = () => { if (tok === token) runtime.bicara = false }
  a.onended = selesai
  a.onerror = selesai
  a.onloadedmetadata = () => { if (offsetDetik > 0.05 && offsetDetik < a.duration - 0.05) a.currentTime = offsetDetik }
  a.play().catch(selesai)
}

/** Ukur lama bicara nyata (ms) dengan volume 0 (Web Speech). 0 = gagal/dibatalkan. */
export function ukurMs(teks: string, p: PengaturanSuara, suara: SpeechSynthesisVoice[]): Promise<number> {
  return new Promise((res) => {
    if (!dukungSuara() || !teks) return res(0)
    const u = buatUtterance(teks, p, suara, 0)
    let mulai = 0
    const timer = setTimeout(() => { window.speechSynthesis.cancel(); res(0) }, 40000)
    u.onstart = () => { mulai = performance.now() }
    u.onend = () => { clearTimeout(timer); res(mulai ? performance.now() - mulai : 0) }
    u.onerror = () => { clearTimeout(timer); res(0) }
    window.speechSynthesis.speak(u)
  })
}
