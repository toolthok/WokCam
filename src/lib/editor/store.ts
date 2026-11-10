'use client'

/* ══════════ Store Editor Timeline wokCam ══════════
 * PERTANYAAN YANG DIJAWAB: "siapa pemegang state timeline?"
 *   - zustand satu toko: proyek (judul/rasio/scenes) + playhead + undo/redo.
 *   - TANPA DATABASE: tiap mutasi langsung autosave ke localStorage lewat
 *     simpanProyek() — di app Kotlin nanti satu berkas JSON di storage internal.
 *   - Semua operasi scene memakai fungsi murni dari proyek.ts (mudah diuji),
 *     store hanya membungkus: dorong riwayat → ubah → simpan.
 *   - Hidrasi: server & client mulai dari proyek contoh (identik, tanpa hydration
 *     mismatch); setelah mount, localStorage menang bila ada proyek tersimpan.
 */

import { create } from 'zustand'
import {
  clampDurasi,
  dariNaskahMentah,
  duplikatScene,
  geserScene,
  hapusScene,
  muatProyek,
  NASKAH_CONTOH,
  pisahScene,
  proyekContoh,
  proyekDariJSON,
  sceneKosong,
  simpanProyek,
  totalDurasi,
  type Proyek,
  type SceneProyek,
} from './proyek'

/* Re-export agar dialog impor bisa ambil contoh dari satu sumber */
export { NASKAH_CONTOH }

type Snapshot = { judul: string; rasio: string; scenes: SceneProyek[]; selectedId: string }

export type TipeAnimasi = 'in' | 'out' | 'loop'

interface EditorStore {
  judul: string
  rasio: string
  scenes: SceneProyek[]
  selectedId: string
  time: number
  playing: boolean
  zoom: number // px per detik
  hydrasiSelesai: boolean
  undoTumpuk: Snapshot[]
  redoTumpuk: Snapshot[]

  /* hidrasi & proyek */
  hidrasi: () => void
  setJudul: (n: string) => void
  setRasio: (r: string) => void
  muatNaskah: (raw: string, mode: 'ganti' | 'tambah') => number
  muatProyekJSON: (raw: string) => { ok: boolean; error?: string; jumlah?: number }
  muatContoh: () => void

  /* operasi scene langsung di timeline */
  pilih: (id: string, seek?: boolean) => void
  perbaruiScene: (id: string, patch: Partial<SceneProyek>, rekam?: boolean) => void
  rekamRiwayat: () => void
  aturDurasi: (id: string, durasi: number) => void
  tambahScene: (afterId?: string) => void
  hapusScene: (id: string) => void
  duplikatScene: (id: string) => void
  pisahSceneDipilih: () => void
  pindahScene: (from: number, to: number) => void

  /* assignment koleksi */
  terapkanAnimasi: (tipe: TipeAnimasi, nama: string | null, target?: string | 'all') => void
  terapkanTransisi: (nama: string | null, sceneId: string) => void
  terapkanTransisiSemua: (nama: string | null) => void
  terapkanStyle: (nama: string | null, target?: string | 'all') => void

  /* playback */
  setTime: (t: number) => void
  setPlaying: (p: boolean) => void
  togglePlay: () => void
  keScene: (index: number) => void
  setZoom: (z: number) => void

  /* riwayat */
  undo: () => void
  redo: () => void
}

const MAKS_RIWAYAT = 60

export const useEditor = create<EditorStore>((set, get) => {

  /* ── helper internal ── */
  const simpan = () => {
    const { judul, rasio, scenes } = get()
    simpanProyek({ version: 1, judul, rasio, scenes })
  }

  /** Rekam kondisi sebelum mutasi (dipanggil di awal tiap aksi yang mengubah proyek). */
  const dorongRiwayat = () => {
    const { judul, rasio, scenes, selectedId, undoTumpuk } = get()
    const snap: Snapshot = { judul, rasio, scenes: scenes.map((s) => ({ ...s })), selectedId }
    set({ undoTumpuk: [...undoTumpuk.slice(-MAKS_RIWAYAT + 1), snap], redoTumpuk: [] })
  }

  const terapkanSnapshot = (snap: Snapshot) => {
    set({
      judul: snap.judul,
      rasio: snap.rasio,
      scenes: snap.scenes.map((s) => ({ ...s })),
      selectedId: snap.selectedId,
    })
    simpan()
  }

  const awal = proyekContoh()

  return {
    judul: awal.judul,
    rasio: awal.rasio,
    scenes: awal.scenes,
    selectedId: awal.scenes[0]?.id ?? '',
    time: 0,
    playing: false,
    zoom: 48,
    hydrasiSelesai: false,
    undoTumpuk: [],
    redoTumpuk: [],

    hidrasi: () => {
      const tersimpan = muatProyek()
      if (tersimpan && tersimpan.scenes.length > 0) {
        set({ judul: tersimpan.judul, rasio: tersimpan.rasio, scenes: tersimpan.scenes, selectedId: tersimpan.scenes[0].id, hydrasiSelesai: true })
      } else {
        simpan() // simpan proyek contoh sebagai titik awal
        set({ hydrasiSelesai: true })
      }
    },

    setJudul: (n) => {
      dorongRiwayat()
      set({ judul: n })
      simpan()
    },

    setRasio: (r) => {
      dorongRiwayat()
      set({ rasio: r })
      simpan()
    },

    muatNaskah: (raw, mode) => {
      const scenes = dariNaskahMentah(raw)
      if (!scenes.length) return 0
      dorongRiwayat()
      if (mode === 'ganti') {
        set({ scenes, selectedId: scenes[0].id, time: 0, playing: false })
      } else {
        const gabung = [...get().scenes, ...scenes]
        set({ scenes: gabung, selectedId: scenes[0].id, playing: false })
      }
      simpan()
      return scenes.length
    },

    muatProyekJSON: (raw) => {
      const h = proyekDariJSON(raw)
      if (!h.ok) return { ok: false, error: h.error }
      dorongRiwayat()
      set({ judul: h.proyek.judul, rasio: h.proyek.rasio, scenes: h.proyek.scenes, selectedId: h.proyek.scenes[0].id, time: 0, playing: false })
      simpan()
      return { ok: true, jumlah: h.proyek.scenes.length }
    },

    muatContoh: () => {
      const contoh = proyekContoh()
      dorongRiwayat()
      set({ judul: contoh.judul, rasio: contoh.rasio, scenes: contoh.scenes, selectedId: contoh.scenes[0].id, time: 0, playing: false })
      simpan()
    },

    pilih: (id, seek = false) => {
      set({ selectedId: id })
      if (seek) {
        const { scenes } = get()
        const i = scenes.findIndex((s) => s.id === id)
        if (i > 0) {
          set({ time: totalDurasi(scenes.slice(0, i)) })
        } else if (i === 0) {
          set({ time: 0 })
        }
      }
    },

    perbaruiScene: (id, patch, rekam = true) => {
      if (rekam) dorongRiwayat()
      set({ scenes: get().scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
      simpan()
    },

    rekamRiwayat: () => dorongRiwayat(),

    aturDurasi: (id, durasi) => {
      const nilai = clampDurasi(durasi)
      const target = get().scenes.find((s) => s.id === id)
      if (!target || target.durasi === nilai) return
      dorongRiwayat()
      set({ scenes: get().scenes.map((s) => (s.id === id ? { ...s, durasi: nilai } : s)) })
      simpan()
    },

    tambahScene: (afterId) => {
      dorongRiwayat()
      const { scenes, selectedId } = get()
      const acuan = afterId ?? selectedId
      const i = acuan ? scenes.findIndex((s) => s.id === acuan) : scenes.length - 1
      const s = sceneKosong(scenes.length)
      const next = [...scenes]
      next.splice(i < 0 ? scenes.length : i + 1, 0, s)
      set({ scenes: next, selectedId: s.id, playing: false })
      simpan()
    },

    hapusScene: (id) => {
      const h = hapusScene(get().scenes, id)
      if (!h) return
      dorongRiwayat()
      set({ scenes: h.scenes, selectedId: h.pilih, time: 0, playing: false })
      simpan()
    },

    duplikatScene: (id) => {
      const h = duplikatScene(get().scenes, id)
      if (!h) return
      dorongRiwayat()
      set({ scenes: h.scenes, selectedId: h.idBaru_, playing: false })
      simpan()
    },

    pisahSceneDipilih: () => {
      const { selectedId } = get()
      const h = pisahScene(get().scenes, selectedId)
      if (!h) return
      dorongRiwayat()
      set({ scenes: h.scenes, selectedId: h.idBaru_ })
      simpan()
    },

    pindahScene: (from, to) => {
      const next = geserScene(get().scenes, from, to)
      if (next === get().scenes) return
      dorongRiwayat()
      set({ scenes: next })
      simpan()
    },

    terapkanAnimasi: (tipe, nama, target) => {
      dorongRiwayat()
      const { scenes, selectedId } = get()
      const kunci: keyof SceneProyek = tipe === 'in' ? 'animIn' : tipe === 'out' ? 'animOut' : 'animLoop'
      const patch = { [kunci]: nama } as Partial<SceneProyek>
      if (target === 'all') {
        set({ scenes: scenes.map((s) => ({ ...s, ...patch })) })
      } else {
        const id = target ?? selectedId
        set({ scenes: scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
      }
      simpan()
    },

    terapkanTransisi: (nama, sceneId) => {
      dorongRiwayat()
      set({ scenes: get().scenes.map((s) => (s.id === sceneId ? { ...s, transisi: nama } : s)) })
      simpan()
    },

    terapkanTransisiSemua: (nama) => {
      dorongRiwayat()
      set({ scenes: get().scenes.map((s) => ({ ...s, transisi: nama })) })
      simpan()
    },

    terapkanStyle: (nama, target) => {
      dorongRiwayat()
      const { scenes, selectedId } = get()
      if (target === 'all') {
        set({ scenes: scenes.map((s) => ({ ...s, style: nama })) })
      } else {
        const id = target ?? selectedId
        set({ scenes: scenes.map((s) => (s.id === id ? { ...s, style: nama } : s)) })
      }
      simpan()
    },

    setTime: (t) => set({ time: Math.max(0, t) }),
    setPlaying: (p) => set({ playing: p }),
    togglePlay: () => {
      const { playing, time, scenes } = get()
      const total = totalDurasi(scenes)
      if (!playing && time >= total) set({ time: 0, playing: true })
      else set({ playing: !playing })
    },
    keScene: (index) => {
      const { scenes } = get()
      if (index < 0 || index >= scenes.length) return
      set({ time: totalDurasi(scenes.slice(0, index)), selectedId: scenes[index].id })
    },
    setZoom: (z) => set({ zoom: z }),

    undo: () => {
      const { undoTumpuk, redoTumpuk } = get()
      const snap = undoTumpuk[undoTumpuk.length - 1]
      if (!snap) return
      const { judul, rasio, scenes, selectedId } = get()
      const sekarang: Snapshot = { judul, rasio, scenes: scenes.map((s) => ({ ...s })), selectedId }
      set({ undoTumpuk: undoTumpuk.slice(0, -1), redoTumpuk: [...redoTumpuk, sekarang].slice(-MAKS_RIWAYAT) })
      terapkanSnapshot(snap)
    },

    redo: () => {
      const { undoTumpuk, redoTumpuk } = get()
      const snap = redoTumpuk[redoTumpuk.length - 1]
      if (!snap) return
      const { judul, rasio, scenes, selectedId } = get()
      const sekarang: Snapshot = { judul, rasio, scenes: scenes.map((s) => ({ ...s })), selectedId }
      set({ redoTumpuk: redoTumpuk.slice(0, -1), undoTumpuk: [...undoTumpuk, sekarang].slice(-MAKS_RIWAYAT) })
      terapkanSnapshot(snap)
    },
  }
})
