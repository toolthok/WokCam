'use client'

/* ══════════ Halaman Editor wokCam (penerus editor versi database) ══════════
 * Susunan: TopBar · SceneList | PreviewCanvas + Timeline | Inspector
 * - TANPA DATABASE: proyek autosave ke localStorage (wokcam.proyek.v1).
 * - Editing langsung di timeline: seret urutkan, trim durasi, klik-dua-kali edit,
 *   chip transisi, toolbar penugasan animasi/style dari Koleksi.
 * - PlaybackEngine: raf loop — memindahkan playhead; berhenti otomatis di akhir.
 */

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/editor/TopBar'
import { SceneList } from '@/components/editor/SceneList'
import { PreviewCanvas } from '@/components/editor/PreviewCanvas'
import { Timeline } from '@/components/editor/Timeline'
import { Inspector } from '@/components/editor/Inspector'
import { ImportNaskahDialog } from '@/components/editor/ImportNaskahDialog'
import { ExportDialog } from '@/components/editor/ExportDialog'
import { SuaraDialog, SuaraEngine } from '@/components/editor/SuaraDialog'
import { PanduanEditor, KUNCI_PANDUAN } from '@/components/editor/PanduanEditor'
import { useEditor } from '@/lib/editor/store'
import { fmtJam, totalDurasi } from '@/lib/editor/proyek'

function PlaybackEngine() {
  const playing = useEditor((s) => s.playing)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const st = useEditor.getState()
      const total = totalDurasi(st.scenes)
      const next = st.time + dt
      if (next >= total) {
        useEditor.setState({ time: total, playing: false })
        return
      }
      useEditor.setState({ time: next })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])
  return null
}

function StatusBar() {
  const scenes = useEditor((s) => s.scenes)
  const rasio = useEditor((s) => s.rasio)
  const hydrasiSelesai = useEditor((s) => s.hydrasiSelesai)
  const total = totalDurasi(scenes)
  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t bg-zinc-950 px-3 text-[10.5px] text-zinc-500">
      <span className="flex items-center gap-2">
        <span className="font-medium text-zinc-400">
          {scenes.length} scene · {fmtJam(total)} · {rasio} · 1080p/30fps
        </span>
        <span className="hidden text-zinc-600 sm:inline">· Spasi = putar/jeda · Ctrl+Z = urungkan</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {hydrasiSelesai ? 'Tersimpan otomatis · tanpa database' : 'Memuat proyek…'} · wokCam v0.2
      </span>
    </footer>
  )
}

export default function Page() {
  const [imporOpen, setImporOpen] = useState(false)
  const [eksporOpen, setEksporOpen] = useState(false)
  const [panduanOpen, setPanduanOpen] = useState(false)
  const [suaraOpen, setSuaraOpen] = useState(false)
  const hidrasi = useEditor((s) => s.hidrasi)
  const panduanMinta = useEditor((s) => s.panduanMinta)

  const tutupPanduan = () => {
    setPanduanOpen(false)
    /* tandai sudah melihat — kunjungan berikutnya tidak auto-buka */
    try {
      window.localStorage.setItem(KUNCI_PANDUAN, '1')
    } catch {
      /* mode privat — hanya berarti tur tampil lagi nanti */
    }
  }

  /* hidrasi proyek dari localStorage SETELAH mount — hindari hydration mismatch */
  useEffect(() => {
    hidrasi()
  }, [hidrasi])

  /* kunjungan pertama → tur langsung jalan (jawaban "belum tahu cara pakainya") */
  useEffect(() => {
    if (!hydrasiSelesaiLihat()) return
    let sudah = false
    try {
      sudah = window.localStorage.getItem(KUNCI_PANDUAN) === '1'
    } catch {
      sudah = false
    }
    if (!sudah) {
      const t = setTimeout(() => setPanduanOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  /* tombol "Cara pakai" di banner tutorial & aksi lain minta tur dibuka */
  useEffect(() => {
    if (panduanMinta > 0) setPanduanOpen(true)
  }, [panduanMinta])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
      if (typing) return
      if (e.code === 'Space') {
        e.preventDefault()
        useEditor.getState().togglePlay()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) useEditor.getState().redo()
        else useEditor.getState().undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        useEditor.getState().redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-foreground lg:h-screen lg:overflow-hidden">
      <PlaybackEngine />
      <SuaraEngine />
      <TopBar
        onOpenImpor={() => setImporOpen(true)}
        onOpenEkspor={() => setEksporOpen(true)}
        onOpenPanduan={() => setPanduanOpen(true)}
        onOpenSuara={() => setSuaraOpen(true)}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <SceneList className="order-2 lg:order-1 lg:w-60 lg:shrink-0 max-lg:max-h-72" />

        <main className="order-1 flex min-h-0 min-w-0 flex-1 flex-col lg:order-2">
          <PreviewCanvas />
          <Timeline />
        </main>

        <Inspector className="order-3 max-lg:max-h-[620px] lg:w-80 lg:shrink-0" />
      </div>

      <StatusBar />

      <ImportNaskahDialog open={imporOpen} onOpenChange={setImporOpen} />
      <ExportDialog open={eksporOpen} onOpenChange={setEksporOpen} />
      <SuaraDialog open={suaraOpen} onOpenChange={setSuaraOpen} />
      <PanduanEditor open={panduanOpen} onTutup={tutupPanduan} />
    </div>
  )
}

/* hidrasi selesai ditandai di store — baca lepas hook agar effect sekali jalan */
function hydrasiSelesaiLihat(): boolean {
  return useEditor.getState().hydrasiSelesai
}
