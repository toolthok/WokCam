'use client'

/* ══════════ Render aset overlay (foto/video) di atas scene ══════════
 * Video overlay mengikuti playhead: saat play ikut berjalan, saat pause/scrub ikut berhenti di
 * posisi yang sama. Selalu dibisukan (suara utama tetap dari TTS / rekaman).
 */

import { useEffect, useRef, useState } from 'react'
import type { AsetOverlay, SceneProyek } from '@/lib/editor/proyek'
import { urlAset, urlAsetSinkron } from '@/lib/editor/aset-store'

function useUrlAset(id: string): string | null {
  const [u, setU] = useState<string | null>(() => urlAsetSinkron(id))
  useEffect(() => {
    let on = true
    urlAset(id).then((x) => { if (on) setU(x) })
    return () => { on = false }
  }, [id])
  return u
}

function durasiTampil(a: AsetOverlay, durasiScene: number): number {
  const sisa = Math.max(0, durasiScene - a.mulai)
  return a.durasi > 0 ? Math.min(a.durasi, sisa) : sisa
}

function ItemAset({ a, rel, playing }: { a: AsetOverlay; rel: number; playing: boolean }) {
  const url = useUrlAset(a.id)
  const vRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = vRef.current
    if (!v || a.tipe !== 'video') return
    if (Math.abs(v.currentTime - rel) > (playing ? 0.35 : 0.02)) {
      try { v.currentTime = rel } catch { /* belum siap — diulang saat metadata */ }
    }
    if (playing) { if (v.paused) v.play().catch(() => {}) } else if (!v.paused) v.pause()
  }, [rel, playing, url, a.tipe])

  if (!url) return null
  const posisi: React.CSSProperties = {
    left: `${a.x}%`, top: `${a.y}%`, width: `${a.lebar}%`, opacity: a.opacity, transform: 'translate(-50%,-50%)',
  }
  return (
    <div className="pointer-events-none absolute z-[4]" style={posisi}>
      {a.tipe === 'video' ? (
        <video
          ref={vRef}
          src={url}
          muted
          loop
          playsInline
          preload="auto"
          onLoadedMetadata={() => { const v = vRef.current; if (v) try { v.currentTime = rel } catch { /* abaikan */ } }}
          className="block h-auto w-full rounded-md"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" draggable={false} className="block h-auto w-full rounded-md" />
      )}
    </div>
  )
}

/** Semua aset scene yang sedang tampil pada `offset` (dtk sejak awal scene). */
export function LapisAset({ scene, offset, playing }: { scene: SceneProyek; offset: number; playing: boolean }) {
  const daftar = scene.aset ?? []
  if (!daftar.length) return null
  return (
    <>
      {daftar.map((a) => {
        const rel = offset - a.mulai
        if (rel < 0 || rel >= durasiTampil(a, scene.durasi)) return null
        return <ItemAset key={a.id} a={a} rel={Math.max(0, rel)} playing={playing} />
      })}
    </>
  )
}
