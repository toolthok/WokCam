'use client'

/* ══════════ TopBar editor ══════════
 * TANPA DATABASE: tombol "Database" versi lama (Google Sheets + Prisma) dihapus.
 * Penggantinya: Impor Naskah (tempel hasil AI) dan Ekspor JSON (berkas proyek),
 * plus tautan Generator Prompt & Koleksi Style.
 */

import Link from 'next/link'
import { CircleHelp, Clapperboard, Download, FileUp, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEditor } from '@/lib/editor/store'
import { RASIO_LIST } from '@/lib/editor/proyek'
import { TombolSuara } from '@/components/editor/SuaraDialog'
import { TombolRender } from '@/components/editor/RenderDialog'

export function TopBar({
  onOpenImpor,
  onOpenEkspor,
  onOpenPanduan,
  onOpenSuara,
}: {
  onOpenImpor: () => void
  onOpenEkspor: () => void
  onOpenPanduan: () => void
  onOpenSuara: () => void
}) {
  const rasio = useEditor((s) => s.rasio)
  const setRasio = useEditor((s) => s.setRasio)
  const judul = useEditor((s) => s.judul)
  const setJudul = useEditor((s) => s.setJudul)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-zinc-950/95 px-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-950/50">
          <Clapperboard className="h-4 w-4 text-white" />
        </span>
        <span className="hidden text-sm font-bold tracking-tight text-zinc-100 sm:block">
          wok<span className="text-violet-400">Cam</span>
        </span>
      </div>

      <span className="hidden h-5 w-px bg-zinc-800 sm:block" aria-hidden />

      <Input
        value={judul}
        onChange={(e) => setJudul(e.target.value)}
        className="h-7 w-40 border-transparent bg-transparent text-xs text-zinc-300 hover:border-zinc-700 focus-visible:bg-zinc-900 sm:w-56"
        aria-label="Nama proyek"
      />

      <div className="ml-auto flex items-center gap-2">
        <Select value={rasio} onValueChange={setRasio}>
          <SelectTrigger className="h-8 w-[112px] text-[11px]" aria-label="Rasio aspek">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RASIO_LIST.map((r) => (
              <SelectItem key={r} value={r}>
                {r === '9:16' ? '9:16 · Vertikal' : r === '1:1' ? '1:1 · Persegi' : '16:9 · Lanskap'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Link
          href="/generator"
          className="hidden h-8 items-center gap-1.5 rounded-md px-2 text-xs text-zinc-300 transition hover:bg-zinc-800 md:flex"
        >
          <Wand2 className="h-3.5 w-3.5 text-fuchsia-400" /> Generator
        </Link>
        <Link
          href="/koleksi"
          className="hidden h-8 items-center gap-1.5 rounded-md px-2 text-xs text-zinc-300 transition hover:bg-zinc-800 md:flex"
        >
          <span className="text-fuchsia-400">📚</span> Koleksi
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-violet-300"
          onClick={onOpenPanduan}
          data-tour="panduan"
          title="Tur interaktif: cara pakai editing di timeline"
        >
          <CircleHelp className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Panduan</span>
        </Button>

        <TombolSuara onClick={onOpenSuara} />
        <TombolRender />

        <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-300" onClick={onOpenImpor} data-tour="topbar-impor">
          <FileUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden md:inline">Impor Naskah</span>
        </Button>

        <Button size="sm" className="h-8 bg-violet-600 text-xs text-white hover:bg-violet-500" onClick={onOpenEkspor} data-tour="topbar-ekspor">
          <Download className="h-3.5 w-3.5" /> Ekspor
        </Button>
      </div>
    </header>
  )
}
