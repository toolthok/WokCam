'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/editor/TopBar'
import { SceneList } from '@/components/editor/SceneList'
import { PreviewCanvas } from '@/components/editor/PreviewCanvas'
import { Timeline } from '@/components/editor/Timeline'
import { Inspector } from '@/components/editor/Inspector'
import { ExportModal } from '@/components/editor/ExportModal'
import { ToolGuidePanel } from '@/components/editor/ToolGuidePanel'
import { AnimationLibrary } from '@/components/editor/AnimationLibrary'
import { DatabasePanel } from '@/components/editor/DatabasePanel'
import { useEditor } from '@/lib/editor/store'
import { fmtTime, totalDuration } from '@/lib/editor/engine'

function PlaybackEngine() {
  const playing = useEditor((s) => s.playing)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const st = useEditor.getState()
      const total = totalDuration(st.scenes, st.voice.speed)
      const next = st.time + dt
      if (next >= total) {
        useEditor.setState({ time: total, playing: false })
        return
      }
      useEditor.setState({ time: next })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])
  return null
}

function StatusBar() {
  const scenes = useEditor((s) => s.scenes)
  const speed = useEditor((s) => s.voice.speed)
  const aspect = useEditor((s) => s.aspect)
  const total = totalDuration(scenes, speed)
  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t bg-zinc-950 px-3 text-[10.5px] text-zinc-500">
      <span className="flex items-center gap-2">
        <span className="font-medium text-zinc-400">
          {scenes.length} scene · {fmtTime(total)} · {aspect} · 1080p/30fps
        </span>
        <span className="hidden text-zinc-600 sm:inline">· Spasi untuk play/pause</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Autosave aktif · wokCam v0.1
      </span>
    </footer>
  )
}

export default function Page() {
  const [guideOpen, setGuideOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [animOpen, setAnimOpen] = useState(false)
  const [dbOpen, setDbOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing =
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
      if (typing) return
      if (e.code === 'Space') {
        e.preventDefault()
        useEditor.getState().togglePlay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-foreground lg:h-screen lg:overflow-hidden">
      <PlaybackEngine />
      <TopBar
        onOpenGuide={() => setGuideOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onOpenDatabase={() => setDbOpen(true)}
        onOpenAnims={() => setAnimOpen(true)}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <SceneList className="order-2 lg:order-1 lg:w-64 lg:shrink-0" />

        <main className="order-1 flex min-h-0 min-w-0 flex-1 flex-col lg:order-2">
          <PreviewCanvas />
          <Timeline />
        </main>

        <Inspector className="order-3 max-lg:max-h-[560px] lg:w-80 lg:shrink-0" />
      </div>

      <StatusBar />

      <ToolGuidePanel open={guideOpen} onOpenChange={setGuideOpen} />
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
      <AnimationLibrary open={animOpen} onOpenChange={setAnimOpen} />
      <DatabasePanel open={dbOpen} onOpenChange={setDbOpen} />
    </div>
  )
}
