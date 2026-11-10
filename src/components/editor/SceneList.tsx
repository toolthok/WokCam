'use client'

import { useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Clock3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useEditor } from '@/lib/editor/store'
import { countWords, fmtTime, sceneDuration, totalDuration } from '@/lib/editor/engine'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [text, setText] = useState('')
  const [gen, setGen] = useState(false)
  const importScript = useEditor((s) => s.importScript)

  const handle = () => {
    if (!text.trim()) return
    setGen(true)
    setTimeout(() => {
      const n = importScript(text)
      setGen(false)
      onOpenChange(false)
      setText('')
      if (n > 0) toast.success(`${n} scene dibuat dari naskah`, { description: 'Naskah dibagi otomatis per kalimat — atur suara & visual di panel kanan.' })
    }, 1400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-fuchsia-400" /> Impor Naskah dari AI Chat
          </DialogTitle>
          <DialogDescription>
            Tempel naskah lengkap hasil AI chat (ChatGPT/Gemini/Claude). Naskah dibagi otomatis per kalimat menjadi scene.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Contoh:\nKebanyakan orang gagal bukan karena malas. Karena urutan pagi mereka salah...\n\nTips: minta AI chat menulis naskah per kalimat pendek agar mudah dibagi.'}
          className="border-zinc-700 bg-zinc-950 text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {countWords(text)} kata {text.trim() && '· akan dibagi menjadi beberapa scene'}
          </span>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={!text.trim() || gen}
              onClick={handle}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
            >
              {gen ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {gen ? 'AI membagi naskah…' : 'Bagi dengan AI'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SceneList({ className }: { className?: string }) {
  const scenes = useEditor((s) => s.scenes)
  const selectedId = useEditor((s) => s.selectedId)
  const selectScene = useEditor((s) => s.selectScene)
  const addScene = useEditor((s) => s.addScene)
  const deleteScene = useEditor((s) => s.deleteScene)
  const duplicateScene = useEditor((s) => s.duplicateScene)
  const moveScene = useEditor((s) => s.moveScene)
  const reorder = useEditor((s) => s.reorder)
  const speed = useEditor((s) => s.voice.speed)

  const [impOpen, setImpOpen] = useState(false)
  const dragIdx = useRef<number | null>(null)

  const total = totalDuration(scenes, speed)

  const handleDelete = (id: string) => {
    if (scenes.length <= 1) {
      toast.error('Minimal harus ada 1 scene')
      return
    }
    deleteScene(id)
    toast.success('Scene dihapus')
  }

  return (
    <aside className={cn('flex flex-col border-r bg-zinc-950/60 max-lg:max-h-[420px]', className)} aria-label="Daftar scene">
      <div className="space-y-2.5 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Scene</h2>
          <Badge variant="outline" className="gap-1 border-zinc-700 text-[10px] font-normal text-zinc-400">
            <Clock3 className="h-3 w-3" /> {scenes.length} scene · {fmtTime(total)}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() => setImpOpen(true)}
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
        >
          <Sparkles className="h-4 w-4" /> Impor Naskah AI
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-2 thin-scroll">
        {scenes.map((s, i) => {
          const sel = s.id === selectedId
          const dur = sceneDuration(s, speed)
          return (
            <div
              key={s.id}
              draggable
              onDragStart={() => (dragIdx.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => {
                if (dragIdx.current !== null && dragIdx.current !== i) {
                  reorder(dragIdx.current, i)
                  dragIdx.current = i
                }
              }}
              onDragEnd={() => (dragIdx.current = null)}
              onClick={() => selectScene(s.id)}
              className={cn(
                'group relative mx-3 mb-2 flex cursor-pointer gap-2 rounded-lg border p-2 transition-colors',
                sel ? 'border-violet-500/70 bg-violet-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900',
              )}
            >
              <GripVertical className="mt-3 h-4 w-4 shrink-0 cursor-grab text-zinc-600" aria-hidden />
              <div className={cn('relative h-14 w-9 shrink-0 overflow-hidden rounded bg-gradient-to-br', s.gradient)}>
                {s.image && (
                  <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" draggable={false} />
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[8px] text-white">
                  {i + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-xs font-semibold', sel ? 'text-violet-200' : 'text-zinc-300')}>
                    Scene {i + 1}
                  </span>
                  <span className="rounded bg-zinc-800 px-1 font-mono text-[9px] text-zinc-400">±{dur.toFixed(1)}s</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Suara siap" />
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-400">
                  {s.script || 'Klik lalu tulis naskah di panel kanan…'}
                </p>
              </div>
              <div className="absolute right-1 top-1 hidden gap-0.5 rounded-md bg-zinc-900/90 p-0.5 group-hover:flex">
                <button
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveScene(s.id, -1)
                  }}
                  aria-label="Naikkan scene"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveScene(s.id, 1)
                  }}
                  aria-label="Turunkan scene"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    duplicateScene(s.id)
                    toast.success('Scene diduplikasi')
                  }}
                  aria-label="Duplikasi scene"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  className="rounded p-1 text-zinc-400 hover:bg-red-950 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(s.id)
                  }}
                  aria-label="Hapus scene"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t p-3">
        <Button variant="outline" size="sm" className="w-full border-zinc-700 bg-transparent" onClick={() => addScene()}>
          <Plus className="h-4 w-4" /> Tambah Scene
        </Button>
      </div>

      <ImportDialog open={impOpen} onOpenChange={setImpOpen} />
    </aside>
  )
}
