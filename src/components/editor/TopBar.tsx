'use client'

import { BookOpen, Clapperboard, Database, Download, Save, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEditor } from '@/lib/editor/store'
import { toast } from 'sonner'

export function TopBar({
  onOpenGuide,
  onOpenExport,
  onOpenDatabase,
  onOpenAnims,
}: {
  onOpenGuide: () => void
  onOpenExport: () => void
  onOpenDatabase: () => void
  onOpenAnims: () => void
}) {
  const aspect = useEditor((s) => s.aspect)
  const setAspect = useEditor((s) => s.setAspect)
  const projectName = useEditor((s) => s.projectName)
  const setProjectName = useEditor((s) => s.setProjectName)

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
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="h-7 w-40 border-transparent bg-transparent text-xs text-zinc-300 hover:border-zinc-700 focus-visible:bg-zinc-900 sm:w-56"
        aria-label="Nama proyek"
      />

      <div className="ml-auto flex items-center gap-2">
        <Select value={aspect} onValueChange={setAspect}>
          <SelectTrigger className="h-8 w-[110px] text-[11px]" aria-label="Rasio aspek">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="9:16">9:16 · Vertikal</SelectItem>
            <SelectItem value="1:1">1:1 · Persegi</SelectItem>
            <SelectItem value="16:9">16:9 · Lanskap</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-300" onClick={onOpenDatabase}>
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden md:inline">Database</span>
        </Button>

        <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-300" onClick={onOpenAnims}>
          <Wand2 className="h-3.5 w-3.5 text-violet-400" />
          <span className="hidden md:inline">Animasi</span>
        </Button>

        <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-300" onClick={onOpenGuide}>
          <BookOpen className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Panduan Tool</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-zinc-300"
          onClick={() => toast.success('Proyek tersimpan (demo)')}
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Simpan</span>
        </Button>

        <Button
          size="sm"
          className="h-8 bg-violet-600 text-xs text-white hover:bg-violet-500"
          onClick={onOpenExport}
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>
    </header>
  )
}
