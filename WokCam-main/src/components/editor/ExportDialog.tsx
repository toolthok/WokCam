'use client'

/* ══════════ Dialog Ekspor ══════════
 * PENERUS ERA DATABASE: TSV Google Sheets + "render server" pura-pura dihapus.
 * Sekarang: satu berkas JSON proyek (kontrak v1 — sama yang nanti dipakai app Kotlin)
 * + panduan rekam layar karena pratinjau inilah yang direkam untuk jadi video.
 */

import { useMemo, useState } from 'react'
import { Check, Copy, Download, MonitorPlay } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/lib/editor/store'
import { fmtJam, proyekKeJSON, totalDurasi, type Proyek } from '@/lib/editor/proyek'

function slugJudul(nama: string): string {
  return (
    nama
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40) || 'proyek'
  )
}

const LANGKAH_REKAM = [
  'Siapkan rekaman layar (Android: Screen recorder / laptop: OBS atau Win+G).',
  'Tekan Putar di pratinjau — scene, animasi, transisi & teks berjalan otomatis.',
  'Rekam layar area pratinjau sampai scene terakhir selesai, lalu stop.',
  'Hasil rekaman: crop ke rasio, tambah suara TTS (TTSMaker/CapCut) + musik, unggah.',
]

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const judul = useEditor((s) => s.judul)
  const rasio = useEditor((s) => s.rasio)
  const badge = useEditor((s) => s.badge)
  const watermark = useEditor((s) => s.watermark)
  const scenes = useEditor((s) => s.scenes)
  const [tersalin, setTersalin] = useState(false)

  const proyek: Proyek = useMemo(() => ({ version: 1, judul, rasio, badge, watermark, scenes }), [judul, rasio, badge, watermark, scenes])
  const json = useMemo(() => proyekKeJSON(proyek), [proyek])
  const total = totalDurasi(scenes)

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setTersalin(true)
      setTimeout(() => setTersalin(false), 1800)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = json
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setTersalin(true)
      setTimeout(() => setTersalin(false), 1800)
    }
  }

  const unduh = () => {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wokcam-${slugJudul(judul)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto border-zinc-800 bg-zinc-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ekspor Proyek</DialogTitle>
          <DialogDescription>
            {judul} · {scenes.length} scene · {fmtJam(total)} · {rasio} — tersimpan sebagai berkas JSON, tanpa database.
          </DialogDescription>
        </DialogHeader>

        <textarea
          readOnly
          value={json}
          rows={8}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-[10.5px] leading-relaxed text-zinc-300"
          aria-label="JSON proyek"
        />

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={salin} variant="outline" className="border-zinc-700 text-xs text-zinc-200">
            {tersalin ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {tersalin ? 'Tersalin!' : 'Salin JSON'}
          </Button>
          <Button onClick={unduh} className="bg-violet-600 text-xs text-white hover:bg-violet-500">
            <Download className="h-4 w-4" /> Unduh .json
          </Button>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
            <MonitorPlay className="h-3.5 w-3.5" /> Jadi video: rekam layar pratinjau
          </p>
          <ol className="space-y-1 text-[11px] leading-relaxed text-emerald-100/85">
            {LANGKAH_REKAM.map((l, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="font-bold text-emerald-400">{i + 1}.</span>
                <span>{l}</span>
              </li>
            ))}
          </ol>
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-zinc-700 text-xs" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
