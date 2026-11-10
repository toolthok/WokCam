'use client'

import { useState } from 'react'
import { Loader2, Play, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useEditor } from '@/lib/editor/store'
import { VOICES } from '@/lib/editor/model'
import { cn } from '@/lib/utils'

function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] rounded-sm bg-violet-400',
            active ? 'animate-pulse' : 'opacity-40',
          )}
          style={{ height: active ? `${[60, 100, 40][i]}%` : '40%', animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}

export function SuaraTab() {
  const voice = useEditor((s) => s.voice)
  const setVoice = useEditor((s) => s.setVoice)
  const scenes = useEditor((s) => s.scenes)
  const selectedId = useEditor((s) => s.selectedId)
  const [previewing, setPreviewing] = useState<string | null>(null)

  const scene = scenes.find((s) => s.id === selectedId)

  const startPreview = (id: string, ms: number) => {
    setPreviewing(id)
    setTimeout(() => setPreviewing(null), ms)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-zinc-400">Pilih suara AI (voice-over)</Label>
        <div className="space-y-1.5">
          {VOICES.map((v) => {
            const active = v.id === voice.voiceId
            return (
              <button
                key={v.id}
                onClick={() => setVoice({ voiceId: v.id })}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg border p-2 text-left transition-colors',
                  active ? 'border-violet-500/70 bg-violet-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900',
                )}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: `${v.color}22`, color: v.color }}
                >
                  {v.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-semibold', active ? 'text-violet-200' : 'text-zinc-200')}>{v.name}</span>
                    <Badge variant="outline" className="h-4 border-zinc-700 px-1 text-[9px] font-normal text-zinc-500">
                      {v.tag}
                    </Badge>
                  </span>
                  <span className="block truncate text-[10px] text-zinc-500">{v.desc}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    startPreview(`v-${v.id}`, 1800)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && startPreview(`v-${v.id}`, 1800)}
                  aria-label={`Preview suara ${v.name}`}
                >
                  {previewing === `v-${v.id}` ? <Equalizer active /> : <Play className="h-3 w-3" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <div>
          <div className="flex justify-between text-xs">
            <Label className="text-zinc-400">Kecepatan bicara</Label>
            <span className="font-mono text-violet-300">×{voice.speed.toFixed(2)}</span>
          </div>
          <Slider
            value={[voice.speed]}
            min={0.7}
            max={1.5}
            step={0.05}
            onValueChange={([v]) => setVoice({ speed: v })}
            className="mt-1.5"
            aria-label="Kecepatan bicara"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs">
            <Label className="text-zinc-400">Nada (pitch)</Label>
            <span className="font-mono text-violet-300">{voice.pitch > 0 ? `+${voice.pitch}` : voice.pitch} sm</span>
          </div>
          <Slider
            value={[voice.pitch]}
            min={-4}
            max={4}
            step={1}
            onValueChange={([v]) => setVoice({ pitch: v })}
            className="mt-1.5"
            aria-label="Nada"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs">
            <Label className="text-zinc-400">Volume voice-over</Label>
            <span className="font-mono text-violet-300">{voice.volume}%</span>
          </div>
          <Slider
            value={[voice.volume]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => setVoice({ volume: v })}
            className="mt-1.5"
            aria-label="Volume voice-over"
          />
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full border-zinc-700 text-xs"
        onClick={() => scene && startPreview('scene', 1600)}
        disabled={!scene}
      >
        {previewing === 'scene' ? <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" /> : <Play className="h-3.5 w-3.5" />}
        Preview suara untuk scene ini
      </Button>

      <p className="flex gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 p-2.5 text-[11px] leading-relaxed text-zinc-500">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        Kecepatan memengaruhi durasi scene otomatis — makin cepat, scene makin pendek. Versi jadi akan memakai API TTS
        (mis. ElevenLabs / Fliki) dan sinkron otomatis.
      </p>
    </div>
  )
}
