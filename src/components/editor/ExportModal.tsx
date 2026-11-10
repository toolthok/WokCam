'use client'

import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Download, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEditor } from '@/lib/editor/store'
import { fmtTime, totalDuration } from '@/lib/editor/engine'
import { toast } from 'sonner'

const STAGES = [
  'Menyiapkan scene…',
  'Menghasilkan voice-over…',
  'Menerapkan animasi & transisi…',
  'Membakar subtitle…',
  'Mencampur audio…',
  'Encoding video…',
]

export function ExportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const scenes = useEditor((s) => s.scenes)
  const speed = useEditor((s) => s.voice.speed)
  const caption = useEditor((s) => s.caption)
  const projectName = useEditor((s) => s.projectName)

  const [phase, setPhase] = useState<'idle' | 'render' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [res, setRes] = useState('1080p')
  const [fps, setFps] = useState('30')
  const [fmt, setFmt] = useState('MP4')
  const [burnSub, setBurnSub] = useState(true)
  const iv = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = totalDuration(scenes, speed)
  const mb = Math.max(1, Math.round(total * (res === '4K' ? 4 : res === '1080p' ? 1 : 0.45)))

  useEffect(() => {
    if (!open) {
      if (iv.current) clearInterval(iv.current)
      setTimeout(() => {
        setPhase('idle')
        setProgress(0)
      }, 200)
    }
    return () => {
      if (iv.current) clearInterval(iv.current)
    }
  }, [open])

  const startRender = () => {
    setPhase('render')
    setProgress(0)
    iv.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 1.6 + Math.random() * 2.4
        if (next >= 100) {
          if (iv.current) clearInterval(iv.current)
          setTimeout(() => setPhase('done'), 350)
          return 100
        }
        return next
      })
    }, 90)
  }

  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor((progress / 100) * STAGES.length))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-4 w-4 text-violet-400" /> Export Video
          </DialogTitle>
          <DialogDescription>
            {projectName} · {scenes.length} scene · {fmtTime(total)}
          </DialogDescription>
        </DialogHeader>

        {phase === 'idle' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Resolusi</Label>
                <Select value={res} onValueChange={setRes}>
                  <SelectTrigger className="h-9 border-zinc-700 bg-zinc-950 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p HD</SelectItem>
                    <SelectItem value="1080p">1080p Full HD</SelectItem>
                    <SelectItem value="4K">4K UHD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Frame rate</Label>
                <Select value={fps} onValueChange={setFps}>
                  <SelectTrigger className="h-9 border-zinc-700 bg-zinc-950 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 fps · sinematik</SelectItem>
                    <SelectItem value="30">30 fps · standar</SelectItem>
                    <SelectItem value="60">60 fps · halus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Format file</Label>
              <Select value={fmt} onValueChange={setFmt}>
                <SelectTrigger className="h-9 border-zinc-700 bg-zinc-950 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MP4">MP4 (H.264)</SelectItem>
                  <SelectItem value="WebM">WebM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <div>
                <Label className="text-xs text-zinc-300">Bakar subtitle ke video</Label>
                <p className="text-[10px] text-zinc-500">Teks tampil permanen di hasil render</p>
              </div>
              <Switch checked={burnSub} onCheckedChange={setBurnSub} disabled={!caption.enabled} aria-label="Bakar subtitle" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <div>
                <Label className="flex items-center gap-1.5 text-xs text-zinc-300">
                  Tanpa watermark <Badge className="bg-amber-500/15 text-[9px] text-amber-400 hover:bg-amber-500/15">Pro</Badge>
                </Label>
                <p className="text-[10px] text-zinc-500">Hilangkan logo di pojok video</p>
              </div>
              <Switch checked={false} onCheckedChange={() => toast.info('Fitur Pro — demo mockup')} aria-label="Watermark Pro" />
            </div>

            <DialogFooter className="items-center gap-2 sm:justify-between">
              <span className="text-[11px] text-zinc-500">
                Estimasi ukuran: <span className="font-medium text-zinc-300">±{mb} MB</span>
              </span>
              <Button onClick={startRender} className="bg-violet-600 text-white hover:bg-violet-500">
                <Download className="h-4 w-4" /> Mulai Render
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === 'render' && (
          <div className="space-y-4 py-2">
            <Progress value={progress} className="h-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-fuchsia-500" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{stage}</span>
              <span className="font-mono text-violet-300">{Math.floor(progress)}%</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Render berjalan di server — versi nyata memakai FFmpeg + API TTS. Jangan tutup tab ini.
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-4 py-2 text-center">
            <BadgeCheck className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="text-sm font-semibold text-zinc-100">Video siap diunduh! 🎉</p>
            <p className="text-xs text-zinc-500">
              {projectName} · {res} · {fps} fps · {fmt} · ±{mb} MB
            </p>
            <DialogFooter className="justify-center gap-2">
              <Button variant="outline" className="border-zinc-700" onClick={() => setPhase('idle')}>
                Atur ulang
              </Button>
              <Button
                className="bg-violet-600 text-white hover:bg-violet-500"
                onClick={() => toast.success('Unduhan dimulai (demo mockup)')}
              >
                <Download className="h-4 w-4" /> Unduh {fmt}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
