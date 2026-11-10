'use client'

import { useState } from 'react'
import { Clock3, Loader2, Scissors, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { useEditor } from '@/lib/editor/store'
import { countWords, estimateDuration, sceneDuration } from '@/lib/editor/engine'
import { toast } from 'sonner'

export function NaskahTab() {
  const scenes = useEditor((s) => s.scenes)
  const selectedId = useEditor((s) => s.selectedId)
  const updateScene = useEditor((s) => s.updateScene)
  const splitScene = useEditor((s) => s.splitScene)
  const summarizeScene = useEditor((s) => s.summarizeScene)
  const speed = useEditor((s) => s.voice.speed)
  const [aiBusy, setAiBusy] = useState(false)

  const scene = scenes.find((s) => s.id === selectedId)
  if (!scene) return <p className="text-xs text-zinc-500">Pilih sebuah scene dulu.</p>

  const words = countWords(scene.script)
  const auto = estimateDuration(scene.script, speed)
  const dur = sceneDuration(scene, speed)
  const manual = scene.durationOverride != null

  const handleAI = () => {
    if (!scene.script.trim()) {
      toast.error('Tulis naskah dulu sebelum pakai AI')
      return
    }
    setAiBusy(true)
    setTimeout(() => {
      setAiBusy(false)
      const fixed = scene.script.trim()
      updateScene(scene.id, { script: fixed.endsWith('.') || fixed.endsWith('!') || fixed.endsWith('?') ? fixed : fixed + '.' })
      toast.success('Naskah dirapikan AI (demo)', { description: 'Versi penuh akan terhubung ke API AI chat-mu.' })
    }, 1100)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">Naskah scene ini</Label>
        <Textarea
          rows={6}
          value={scene.script}
          onChange={(e) => updateScene(scene.id, { script: e.target.value })}
          placeholder="Tulis / tempel potongan naskah untuk scene ini…"
          className="border-zinc-700 bg-zinc-950 text-sm leading-relaxed"
        />
        <p className="text-[11px] text-zinc-500">
          <span className="font-medium text-zinc-300">{words} kata</span> · ±{auto.toFixed(1)}s pada kecepatan ×{speed.toFixed(2)}
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
          <Clock3 className="h-3.5 w-3.5 text-violet-400" /> Durasi scene: <span className="font-mono">{dur.toFixed(1)}s</span>
        </div>
        <RadioGroup
          value={manual ? 'manual' : 'auto'}
          onValueChange={(v) => updateScene(scene.id, { durationOverride: v === 'manual' ? Math.round(dur * 10) / 10 : null })}
          className="flex gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="auto" id="dur-auto" className="h-3.5 w-3.5" />
            <Label htmlFor="dur-auto" className="text-xs font-normal text-zinc-300">
              Otomatis (ikuti naskah)
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="manual" id="dur-manual" className="h-3.5 w-3.5" />
            <Label htmlFor="dur-manual" className="text-xs font-normal text-zinc-300">
              Manual
            </Label>
          </div>
        </RadioGroup>
        {manual && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={60}
              step={0.5}
              value={scene.durationOverride ?? dur}
              onChange={(e) => updateScene(scene.id, { durationOverride: Number(e.target.value) })}
              className="h-8 w-24 border-zinc-700 bg-zinc-950 text-xs"
            />
            <span className="text-xs text-zinc-500">detik</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-zinc-700 text-xs"
          onClick={() => {
            splitScene(scene.id)
            toast.success('Scene dibagi menjadi dua')
          }}
        >
          <Scissors className="h-3.5 w-3.5" /> Bagi 2 Scene
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-zinc-700 text-xs"
          onClick={() => {
            summarizeScene(scene.id)
            toast.success('Naskah diringkas (demo)')
          }}
        >
          <Wand2 className="h-3.5 w-3.5" /> Ringkas AI
        </Button>
      </div>

      <Button
        size="sm"
        disabled={aiBusy}
        onClick={handleAI}
        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
      >
        {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {aiBusy ? 'AI sedang menulis…' : 'Gunakan AI untuk Naskah'}
      </Button>

      <p className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2.5 text-[11px] leading-relaxed text-zinc-500">
        Tips: durasi otomatis dihitung ±2.4 kata/detik (kecepatan bicara normal). Kecepatan suara di tab{' '}
        <span className="text-zinc-300">Suara</span> ikut memengaruhi durasi.
      </p>
    </div>
  )
}
