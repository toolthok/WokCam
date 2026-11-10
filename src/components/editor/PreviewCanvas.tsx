'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Images, Sparkles, SkipBack, SkipForward, Upload, MessageSquareText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/lib/editor/store'
import {
  entranceStyle,
  fmtTime,
  getRenderList,
  motionTransform,
  sceneDuration,
  totalDuration,
  withTimings,
  wordTimings,
  type WordTiming,
} from '@/lib/editor/engine'
import { FONT_MAP, MOTION_META, type Caption, type Scene } from '@/lib/editor/model'
import { cn } from '@/lib/utils'

const RATIO: Record<string, number> = { '9:16': 9 / 16, '1:1': 1, '16:9': 16 / 9 }

function useFit(ratio: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      let w = rect.width
      let h = w / ratio
      if (h > rect.height) {
        h = rect.height
        w = h * ratio
      }
      setSize({ w: Math.max(0, w), h: Math.max(0, h) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ratio])
  return { ref, size }
}

function SourceIcon({ scene }: { scene: Scene }) {
  if (scene.assetSource === 'ai') return <Sparkles className="h-3 w-3 text-fuchsia-400" />
  if (scene.assetSource === 'upload') return <Upload className="h-3 w-3 text-amber-400" />
  return <Images className="h-3 w-3 text-violet-300" />
}

export function CaptionView({
  script,
  local,
  dur,
  caption,
  playing,
}: {
  script: string
  local: number
  dur: number
  caption: Caption
  playing: boolean
}) {
  if (!caption.enabled || caption.preset === 'none' || !script.trim()) return null
  const timings: WordTiming[] = wordTimings(script, dur)
  if (!timings.length) return null
  const curIdx = playing || local > 0 ? timings.findIndex((t) => local >= t.start && local < t.end) : -1
  const font = FONT_MAP[caption.font]
  const pos =
    caption.position === 'bottom'
      ? 'bottom-[10%]'
      : caption.position === 'top'
        ? 'top-[8%]'
        : 'top-1/2 -translate-y-1/2'

  const base: React.CSSProperties = {
    fontFamily: font,
    fontSize: caption.size,
    lineHeight: 1.35,
  }

  const wordStyle = (i: number): React.CSSProperties => {
    const isCur = i === curIdx
    const passed = curIdx >= 0 && i < curIdx
    switch (caption.preset) {
      case 'karaoke':
        return isCur && caption.highlight
          ? { background: caption.accent, color: '#111', borderRadius: 6, padding: '0 0.18em' }
          : { color: passed || curIdx < 0 ? '#fff' : 'rgba(255,255,255,0.85)' }
      case 'tiktok':
        return {
          color: isCur && caption.highlight ? caption.accent : '#fff',
        }
      case 'box': {
        const isWindow = Math.abs(i - curIdx) <= 2 && curIdx >= 0
        if (!isWindow) return { opacity: 0 }
        return isCur
          ? { background: '#111', color: caption.accent, borderRadius: 4, padding: '0 0.15em' }
          : { background: caption.accent, color: '#111', borderRadius: 4, padding: '0 0.15em' }
      }
      default:
        return { color: '#fff' }
    }
  }

  const containerExtra: React.CSSProperties =
    caption.preset === 'tiktok'
      ? {
          fontWeight: 800,
          textTransform: 'uppercase',
          WebkitTextStroke: '1.3px #000',
          paintOrder: 'stroke',
          textShadow: '0 3px 0 rgba(0,0,0,0.35)',
        }
      : caption.preset === 'box'
        ? { fontWeight: 800 }
        : caption.preset === 'clean'
          ? { fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.6)' }
          : { fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.6)' }

  return (
    <div className={cn('pointer-events-none absolute inset-x-0 z-20 flex justify-center px-5', pos)}>
      <p className="max-w-[94%] text-center" style={{ ...base, ...containerExtra }}>
        {timings.map((t, i) => (
          <span key={i} style={{ display: 'inline-block', margin: '0 0.14em', ...wordStyle(i) }}>
            {t.word}
          </span>
        ))}
      </p>
    </div>
  )
}

function SceneLayer({ scene, layer, playing }: { scene: Scene; layer: { entrance: number; motion: number }; playing: boolean }) {
  const entrance = playing ? layer.entrance : layer.top ? layer.entrance : Math.max(layer.entrance, 1)
  const eStyle = entranceStyle(scene.animIn, entrance)
  return (
    <div className="absolute inset-0 overflow-hidden" style={eStyle}>
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: motionTransform(scene.motion, layer.motion, scene.loop) }}
      >
        <div className={cn('absolute inset-0 bg-gradient-to-br', scene.gradient)} />
        {scene.image ? (
          <img
            src={scene.image}
            alt={scene.assetLabel}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">{scene.assetLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function PreviewCanvas() {
  const scenes = useEditor((s) => s.scenes)
  const time = useEditor((s) => s.time)
  const playing = useEditor((s) => s.playing)
  const aspect = useEditor((s) => s.aspect)
  const trans = useEditor((s) => s.transition)
  const speed = useEditor((s) => s.voice.speed)
  const caption = useEditor((s) => s.caption)
  const projectName = useEditor((s) => s.projectName)
  const togglePlay = useEditor((s) => s.togglePlay)
  const setTime = useEditor((s) => s.setTime)
  const seekScene = useEditor((s) => s.seekScene)
  const scenesLen = scenes.length

  const { ref, size } = useFit(RATIO[aspect])
  const total = totalDuration(scenes, speed)
  const render = getRenderList(time, scenes, speed, trans)
  const segs = withTimings(scenes, speed)
  const cur = render.index >= 0 ? scenes[render.index] : null

  const wordDur = cur ? sceneDuration(cur, speed) : 0

  return (
    <section className="relative flex min-h-[260px] flex-1 flex-col max-lg:h-[68dvh] max-lg:flex-none" aria-label="Pratinjau video">
      <div ref={ref} className="relative flex-1 overflow-hidden bg-zinc-950 bg-grid">
        <div className="absolute inset-0 flex items-center justify-center">
          {scenesLen === 0 ? (
            <div className="flex max-w-xs flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
              <MessageSquareText className="h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-400">Belum ada scene. Tempel naskah dari AI chat lewat <span className="font-medium text-violet-300">Impor Naskah</span>.</p>
            </div>
          ) : (
            <div
              className="relative overflow-hidden rounded-lg border border-zinc-800 shadow-2xl shadow-black/60"
              style={{ width: size.w || undefined, height: size.h || undefined }}
            >
              {size.w > 0 &&
                render.layers.map((l, li) => <SceneLayer key={`${l.scene.id}-${li}`} scene={l.scene} layer={l} playing={playing} />)}

              {/* vignette agar teks terbaca */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black/45 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/55 to-transparent" />

              {cur && (
                <CaptionView
                  script={cur.script}
                  local={render.local}
                  dur={wordDur}
                  caption={caption}
                  playing={playing}
                />
              )}

              {/* overlay info */}
              {cur && (
                <>
                  <div className="absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-zinc-200 backdrop-blur">
                    <span className="text-violet-300">Scene {render.index + 1}</span>
                    <span className="text-zinc-500">·</span>
                    <span>{MOTION_META.find((m) => m.id === cur.motion)?.label}</span>
                    <span className="text-zinc-500">·</span>
                    <SourceIcon scene={cur} />
                  </div>
                  <div className="absolute right-2.5 top-2.5 z-20 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur">
                    {aspect} · 1080p
                  </div>
                  <div className="pointer-events-none absolute bottom-1.5 right-2.5 z-20 text-[9px] font-semibold uppercase tracking-widest text-white/25">
                    wokCam
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* kontrol playback */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-t bg-zinc-950/90 px-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTime(0)} aria-label="Ulang dari awal">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="h-9 w-9 rounded-full bg-violet-600 hover:bg-violet-500"
          onClick={togglePlay}
          aria-label={playing ? 'Jeda' : 'Putar'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => seekScene(scenesLen - 1)}
          aria-label="Ke scene terakhir"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <span className="ml-1 font-mono text-xs text-zinc-400">
          {fmtTime(time)} <span className="text-zinc-600">/ {fmtTime(total)}</span>
        </span>
        <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-zinc-500 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {projectName}
        </span>
      </div>
    </section>
  )
}
