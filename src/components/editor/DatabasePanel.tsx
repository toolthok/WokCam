'use client'

import { useMemo, useState } from 'react'
import {
  Check,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  Info,
  Table2,
} from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEditor } from '@/lib/editor/store'
import { VOICES } from '@/lib/editor/model'
import { buildSheetTsv, fmtTime, sceneDuration, totalDuration } from '@/lib/editor/engine'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  Siap: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Draft: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
}

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  // fallback untuk browser lama / context non-secure
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
  return Promise.resolve()
}

export function DatabasePanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const scenes = useEditor((s) => s.scenes)
  const projectName = useEditor((s) => s.projectName)
  const speed = useEditor((s) => s.voice.speed)
  const voiceId = useEditor((s) => s.voice.voiceId)
  const voiceName = VOICES.find((v) => v.id === voiceId)?.name ?? 'Sari'
  const [copied, setCopied] = useState(false)

  const total = totalDuration(scenes, speed)

  const rows = useMemo(
    () =>
      scenes.map((s, i) => ({
        no: i + 1,
        script: s.script || '(naskah kosong)',
        dur: sceneDuration(s, speed).toFixed(1),
        asset: s.assetLabel,
        status: s.status === 'ready' ? 'Siap' : 'Draft',
      })),
    [scenes, speed],
  )

  const handleCopy = async () => {
    const tsv = buildSheetTsv(scenes, projectName, speed, voiceName)
    try {
      await copyToClipboard(tsv)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      toast.success('Tabel tersalin!', { description: 'Buka Google Sheets → klik sel A1 → Ctrl+V. Tab otomatis jadi kolom.' })
    } catch {
      toast.error('Gagal menyalin — coba lagi')
    }
  }

  const handleDownloadCsv = () => {
    const rows = buildSheetTsv(scenes, projectName, speed, voiceName)
      .split('\n')
      .map((line) =>
        line
          .split('\t')
          .map((cell) => (/[",]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell))
          .join(','),
      )
    const blob = new Blob([`\uFEFF${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `database-${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'video'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV diunduh', { description: 'Bisa langsung diimpor ke Google Sheets (File → Impor).' })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-md thin-scroll">
        <SheetHeader className="pb-1">
          <SheetTitle className="flex items-center gap-2 text-zinc-100">
            <Database className="h-4 w-4 text-violet-400" /> Database Google Sheets
          </SheetTitle>
          <SheetDescription className="text-zinc-500">
            Setiap video punya 1 tab di spreadsheet: naskah, aset, animasi & status produksi.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-10">
          {/* alur 3 langkah */}
          <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <p className="text-sm font-bold text-zinc-100">Cara pakai</p>
            <ol className="space-y-2 text-[11px] leading-relaxed text-zinc-400">
              <li className="flex gap-2">
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-300">1</span>
                Buat spreadsheet baru di Google Sheets — nama file: <span className="text-zinc-200">Database Video</span>.
              </li>
              <li className="flex gap-2">
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-300">2</span>
                Setiap video = 1 tab (ganti nama tab dengan judul video). Klik tombol salin di bawah.
              </li>
              <li className="flex gap-2">
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-300">3</span>
                Tempel di sel <span className="font-mono text-violet-300">A1</span> — semua kolom langsung rapi. Update kolom <span className="font-mono text-violet-300">status</span> saat produksi berjalan.
              </li>
            </ol>
          </div>

          {/* struktur kolom */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <p className="flex items-center gap-1.5 text-sm font-bold text-zinc-100">
              <Table2 className="h-4 w-4 text-violet-400" /> Struktur kolom (12 kolom)
            </p>
            <div className="mt-2.5 space-y-1.5">
              {[
                ['A · video_id', 'ID unik per scene: V-001-001'],
                ['B · judul', 'Judul / hook video'],
                ['C · no_scene', 'Nomor urut scene'],
                ['D · naskah', 'Teks yang dibacakan TTS'],
                ['E · durasi_detik', 'Estimasi durasi scene'],
                ['F · aset', 'Link visual (Pexels / AI)'],
                ['G · gerakan', 'Ken Burns: zoom-in, pan-left…'],
                ['H · anim_in / I · anim_out', 'Animasi masuk & keluar'],
                ['J · voice', 'Nama suara AI'],
                ['K · status', 'Draft → Siap → Render → Upload'],
                ['L · catatan', 'Catatan produksi'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start gap-2 text-[11px]">
                  <span className="w-[118px] shrink-0 font-mono text-[10px] text-violet-300">{k}</span>
                  <span className="text-zinc-400">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* pratinjau live dari proyek */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-bold text-zinc-100">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Pratinjau proyek ini
              </p>
              <Badge variant="outline" className="h-4.5 border-zinc-700 px-1.5 text-[9px] font-normal text-zinc-400">
                {scenes.length} baris · {fmtTime(total)}
              </Badge>
            </div>
            <div className="mt-2.5 overflow-hidden rounded-lg border border-zinc-800">
              <div className="grid grid-cols-[26px_1fr_44px_58px] gap-1 border-b border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                <span>#</span>
                <span>Naskah</span>
                <span>Durasi</span>
                <span>Status</span>
              </div>
              <div className="max-h-44 overflow-y-auto thin-scroll">
                {rows.map((r) => (
                  <div key={r.no} className="grid grid-cols-[26px_1fr_44px_58px] items-center gap-1 border-b border-zinc-800/60 px-2 py-1.5 last:border-0">
                    <span className="text-[10px] text-zinc-500">{r.no}</span>
                    <span className="truncate text-[10.5px] text-zinc-300" title={r.script}>{r.script}</span>
                    <span className="font-mono text-[10px] text-zinc-400">{r.dur}s</span>
                    <span className="justify-self-start">
                      <Badge variant="outline" className={`h-4 px-1 text-[8.5px] ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </Badge>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">
              Kolom lain (aset, gerakan, animasi, voice) ikut tersalin di TSV — pratinjau ini hanya ringkasannya.
            </p>
          </div>

          {/* tombol aksi */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleCopy}
              className="h-9 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs text-white hover:from-violet-500 hover:to-fuchsia-500"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Tersalin!' : 'Salin untuk Sheets'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadCsv}
              className="h-9 border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" /> Unduh CSV
            </Button>
          </div>

          {/* tips lanjutan */}
          <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-200">
              <Info className="h-3.5 w-3.5" /> Tips biar makin rapi
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-violet-200/80">
              <li>• Tambah tab <span className="font-mono">Dashboard</span>: rekap semua video dengan rumus <span className="font-mono text-[10px]">IMPORTRANGE</span> antar spreadsheet.</li>
              <li>• Pakai dropdown di kolom <span className="font-mono">status</span> (Data → Validasi data) biar konsisten.</li>
              <li>• Kolom <span className="font-mono">naskah</span> tinggal copy ke editor ini (tombol “Impor Naskah AI”).</li>
              <li>• Catat link aset di kolom <span className="font-mono">aset</span> — kalau visual kena takedown, tinggal ganti cepat.</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
