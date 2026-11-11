'use client'

/* ══════════ Suara (TTS) — pengaturan + pembungkus Web Speech API ══════════
 * Pengaturan persisten di localStorage "wokcam.suara.v1" (tanpa server, tanpa key).
 * Catatan jujur: suara bawaan browser TIDAK bisa direkam ke berkas video — ini untuk
 * pratinjau yang sinkron dengan playhead + mengukur panjang bicara agar durasi pas.
 */

import { create } from 'zustand'
import { teksTanpaMarker, type SceneProyek } from './proyek'

export const KUNCI_SUARA = 'wokcam.suara.v1'

export type PengaturanSuara = { aktif: boolean; voiceURI: string; rate: number; pitch: number }
const AWAL: PengaturanSuara = { aktif: false, voiceURI: '', rate: 1, pitch: 1 }

type SuaraStore = PengaturanSuara & {
  hidrasi: () => void
  ubah: (patch: Partial<PengaturanSuara>) => void
}

const jepit = (v: number, lo: number, hi: number, bawaan: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : bawaan)

export const useSuara = create<SuaraStore>((set, get) => ({
  ...AWAL,
  hidrasi: () => {
    try {
      const raw = window.localStorage.getItem(KUNCI_SUARA)
      if (!raw) return
      const o = JSON.parse(raw) as Partial<PengaturanSuara>
      set({
        aktif: o.aktif === true,
        voiceURI: typeof o.voiceURI === 'string' ? o.voiceURI : '',
        rate: jepit(Number(o.rate), 0.6, 1.6, 1),
        pitch: jepit(Number(o.pitch), 0.5, 1.5, 1),
      })
    } catch {
      /* data rusak → pakai bawaan */
    }
  },
  ubah: (patch) => {
    set(patch)
    const { aktif, voiceURI, rate, pitch } = get()
    try {
      window.localStorage.setItem(KUNCI_SUARA, JSON.stringify({ aktif, voiceURI, rate, pitch }))
    } catch {
      /* mode privat */
    }
  },
}))

export const dukungSuara = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

export function teksBacaan(s: Pick<SceneProyek, 'naskah' | 'teks'>): string {
  return (s.naskah || teksTanpaMarker(s.teks)).replace(/\s+/g, ' ').trim()
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
  if (dukungSuara()) window.speechSynthesis.cancel()
}

export function bicara(teks: string, p: PengaturanSuara, suara: SpeechSynthesisVoice[]): void {
  if (!dukungSuara()) return
  window.speechSynthesis.cancel()
  if (!teks) return
  window.speechSynthesis.speak(buatUtterance(teks, p, suara))
}

/** Ukur lama bicara nyata (ms) dengan volume 0. 0 = gagal/dibatalkan. Sebagian perangkat tetap bersuara. */
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
