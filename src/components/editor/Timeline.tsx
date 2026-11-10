'use client'

import { useEffect, useRef } from 'react'
import { Film, Mic, Music, Type, Volume2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEditor } from '@/lib/editor/store'
import { clamp, fmtTime, sceneDuration, totalDuration, waveform, withTimings } from '@/lib/editor/engine'
import { VOICES } from '@/lib/editor/model'
import { cn } from '@/lib/utils'

export function Timeline() {
  const scenes = useEditor((s) => s.scenes)
  const time = useEditor((s) => s.time)
  const playing = useEditor((s) => s.playing)
  const zoom = useEditor((s) => s.zoom)
  const transition = useEditor((s) => s.transition)
  const speed = useEditor((s) => s.voice.speed)
  const voiceId = useEditor((s) => s.voice.voiceId)
  const voiceSpeed = useEditor((s) => s.voice.speed)
  const caption = useEditor((s) => s.caption)
  const music = useEditor((s) => s.music)
  const setZoom = useEditor((s) => s.setZoom)
  const setTime = useEditor((s) => s.setTime)
  const setMusic = useEditor((s) => s.setMusic)
  const selectScene = useEditor((s) => s.selectScene)
  const selectedId = useEditor((s) => s.selectedId)

  const segs = withTimings(scenes, speed)
  const total = totalDuration(scenes, speed)
  const contentW = Math.max(total * zoom + 24, 320)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const voice = VOICES.find((v) => v.id === voiceId)

  // auto-follow playhead saat memutar
  const atZero = time === 0
  useEffect(() => {
    if (!scrollRef.current) return
    if (atZero) {
      scrollRef.current.scrollLeft = 0
      return
    }
    if (!playing) return
    const el = scrollRef.current
    const x = time * zoom
    if (x < el.scrollLeft + 24 || x > el.scrollLeft + el.clientWidth - 80) {
      el.scrollLeft = Math.max(0, x - el.clientWidth * 0.4)
    }
  }, [time, playing, zoom, atZero])

  const seekFromEvent = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const t = clamp((e.clientX - rect.left) / zoom, 0, total)
    setTime(t)
  }

  const onRulerPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    seekFromEvent(e)
  }

  const tickStep = zoom < 25 ? 4 : zoom < 60 ? 2 : 1
  const ticks: number[] = []
  for (let s = 0; s <= Math.ceil(total); s += 1) ticks.push(s)

  const tracks = [
    { icon: Film, label: 'Video', h: 'h-11' },
    { icon: Mic, label: 'Suara', h: 'h-8' },
    { icon: Music, label: 'Musik', h: 'h-7' },
    { icon: Type, label: 'Teks', h: 'h-7' },
  ]

  return (
    <section className="shrink-0 border-t bg-zinc-950/80 max-lg:h-56" aria-label="Timeline">
      {/* header */}
      <div className="flex h-9 items-center gap-2 border-b px-3">
        <span className="text-xs font-semibold text-zinc-300">Timeline</span>
        <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{fmtTime(total)}</span>
        <span className="hidden text-[10px] text-zinc-500 sm:inline">transisi {transition.toFixed(1)}s</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setMusic({ enabled: !music.enabled })}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] transition-colors',
              music.enabled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800',
            )}
            title="Klik untuk aktif/nonaktifkan musik latar"
          >
            <Music className="h-3 w-3" />
            {music.name} · {music.volume}%
          </button>
          <Select value={String(zoom)} onValueChange={(v) => setZoom(Number(v))}>
            <SelectTrigger className="h-7 w-[92px] text-[11px]" aria-label="Zoom timeline">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Zoom Kecil</SelectItem>
              <SelectItem value="40">Zoom Sedang</SelectItem>
              <SelectItem value="80">Zoom Besar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* body */}
      <div className="flex">
        {/* label kolom */}
        <div className="w-20 shrink-0 border-r bg-zinc-950">
          <div className="h-6 border-b" />
          {tracks.map((t) => (
            <div key={t.label} className={cn('flex items-center gap-1.5 border-b border-zinc-900/80 px-2', t.h)}>
              <t.icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="text-[10px] text-zinc-500">{t.label}</span>
            </div>
          ))}
        </div>

        {/* scroll konten */}
        <div ref={scrollRef} className="relative flex-1 overflow-x-auto overflow-y-hidden timeline-scroll">
          <div className="relative" style={{ width: contentW }}>
            {/* ruler */}
            <div
              className="relative h-6 cursor-pointer border-b border-zinc-900 select-none touch-none"
              onPointerDown={onRulerPointerDown}
              onPointerMove={(e) => dragging.current && seekFromEvent(e)}
              onPointerUp={() => (dragging.current = false)}
              onPointerCancel={() => (dragging.current = false)}
            >
              {ticks.map((s) => (
                <div key={s} className="absolute top-0 h-full" style={{ left: s * zoom }}>
                  <div className={cn('w-px', s % tickStep === 0 ? 'h-2.5 bg-zinc-600' : 'h-1.5 bg-zinc-800')} />
                  {s % tickStep === 0 && (
                    <span className="absolute left-1 top-0.5 font-mono text-[9px] leading-none text-zinc-600">{s}s</span>
                  )}
                </div>
              ))}
            </div>

            {/* track video */}
            <div className={cn('relative border-b border-zinc-900/80', tracks[0].h)}>
              {segs.map((seg) => {
                const sel = seg.scene.id === selectedId
                return (
                  <button
                    key={seg.scene.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      selectScene(seg.scene.id)
                    }}
                    className={cn(
                      'absolute top-1 bottom-1 overflow-hidden rounded-md border text-left transition-shadow',
                      sel
                        ? 'border-violet-400 ring-1 ring-violet-400/60 z-[5]'
                        : 'border-zinc-700/70 hover:border-zinc-500',
                    )}
                    style={{ left: seg.start * zoom + 1, width: Math.max(8, seg.dur * zoom - 2) }}
                    title={`Scene ${seg.index + 1} — ${seg.scene.assetLabel}`}
                  >
                    <div className="absolute inset-0 flex">
                      <div className={cn('h-full w-9 shrink-0 bg-gradient-to-br', seg.scene.gradient)}>
                        {seg.scene.image && (
                          <img src={seg.scene.image} alt="" className="h-full w-full object-cover" draggable={false} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 bg-zinc-900/80 px-1.5 py-1">
                        <div className="flex items-baseline gap-1">
                          <span className={cn('text-[10px] font-semibold', sel ? 'text-violet-200' : 'text-zinc-300')}>
                            Scene {seg.index + 1}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500">{seg.dur.toFixed(1)}s</span>
                        </div>
                        <p className="truncate text-[9px] text-zinc-500">{seg.scene.script || '(tanpa naskah)'}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* track suara */}
            <div className={cn('relative border-b border-zinc-900/80', tracks[1].h)}>
              {segs.map((seg) => {
                const sel = seg.scene.id === selectedId
                const bars = waveform(seg.index + 3, Math.max(8, Math.floor((seg.dur * zoom) / 4)))
                return (
                  <div
                    key={seg.scene.id}
                    className="absolute top-0.5 bottom-0.5 flex items-end gap-[1px] overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/60 px-1 py-0.5"
                    style={{ left: seg.start * zoom + 1, width: Math.max(10, seg.dur * zoom - 2) }}
                    title={`Voice-over ${voice?.name ?? 'AI'} ×${voiceSpeed.toFixed(2)}`}
                  >
                    <span className="absolute left-1.5 top-0.5 z-10 text-[8px] font-medium text-zinc-400">
                      {voice?.name} · ×{voiceSpeed.toFixed(2).replace(/0$/, '')}
                    </span>
                    {bars.map((h, i) => (
                      <div
                        key={i}
                        className={cn('w-[3px] shrink-0 rounded-sm', sel ? 'bg-violet-400/80' : 'bg-zinc-600/80')}
                        style={{ height: `${Math.round(h * 62)}%` }}
                      />
                    ))}
                  </div>
                )
              })}
            </div>

            {/* track musik */}
            <div className={cn('relative border-b border-zinc-900/80', tracks[2].h)}>
              <div
                className={cn(
                  'absolute top-0.5 bottom-0.5 flex items-center gap-1.5 overflow-hidden rounded-md border px-2',
                  music.enabled ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900 opacity-50',
                )}
                style={{ left: 1, width: Math.max(10, total * zoom - 2) }}
              >
                <Volume2 className="h-3 w-3 shrink-0 text-emerald-400" />
                <span className="truncate text-[9px] text-emerald-200/90">
                  Musik latar: {music.name} · volume {music.volume}% — klik di atas untuk on/off
                </span>
              </div>
            </div>

            {/* track subtitle */}
            <div className={cn('relative', tracks[3].h)}>
              {segs.map((seg) => (
                <div
                  key={seg.scene.id}
                  className={cn(
                    'absolute top-0.5 bottom-0.5 flex items-center overflow-hidden rounded-md border px-1.5',
                    caption.enabled && caption.preset !== 'none'
                      ? 'border-zinc-800 bg-zinc-800/60'
                      : 'border-zinc-800/50 bg-zinc-900/50 opacity-45',
                  )}
                  style={{ left: seg.start * zoom + 1, width: Math.max(10, seg.dur * zoom - 2) }}
                >
                  <span className="truncate text-[9px] italic text-zinc-400">
                    {caption.enabled && caption.preset !== 'none'
                      ? `“${seg.scene.script.slice(0, 40)}${seg.scene.script.length > 40 ? '…' : ''}”`
                      : 'subtitle nonaktif'}
                  </span>
                </div>
              ))}
            </div>

            {/* playhead */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-violet-400"
              style={{ left: time * zoom }}
            >
              <div className="absolute -left-[5px] -top-[1px] h-2.5 w-2.5 rounded-sm bg-violet-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
