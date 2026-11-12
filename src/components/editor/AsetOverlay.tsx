'use client'

/* ══════════ Render aset overlay (foto/video) di atas scene ══════════
 * Lapisan luar memegang posisi (tanpa animasi); lapisan dalam memegang gaya + animasi WAAPI.
 * Animasi masuk/keluar/loop diputar sesuai posisi playhead di aset (bisa di-scrub saat jeda).
 * Video overlay selalu dibisukan dan ikut playhead.
 */

import { useEffect, useRef, useState } from 'react'
import type { AsetOverlay, GayaAset, SceneProyek } from '@/lib/editor/proyek'
import { urlAset, urlAsetSinkron } from '@/lib/editor/aset-store'
import { bangunKeyframesAnimasi } from '@/components/preset-preview'
import type { PresetAnimasi } from '@/lib/preset-store'

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

const gayaBentuk = (g: GayaAset | undefined): React.CSSProperties => {
  switch (g) {
    case 'bulat': return { borderRadius: '16%', overflow: 'hidden' }
    case 'bingkai': return { border: '3px solid #ffffff', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }
    case 'bayangan': return { boxShadow: '0 14px 32px rgba(0,0,0,0.5)', borderRadius: 4 }
    default: return {}
  }
}

const cari = (presets: PresetAnimasi[], nama: string | null | undefined, tipe: 'in' | 'out' | 'loop') =>
  nama ? presets.find((p) => p.nama === nama && p.tipe === tipe) ?? null : null

function ItemAset({ a, rel, playing, tampilMs, presets }: {
  a: AsetOverlay; rel: number; playing: boolean; tampilMs: number; presets: PresetAnimasi[]
}) {
  const url = useUrlAset(a.id)
  const vRef = useRef<HTMLVideoElement>(null)
  const elRef = useRef<HTMLDivElement>(null)
  const animsRef = useRef<Animation[]>([])

  /* animasi masuk/keluar/loop — dibuat sekali (dalam keadaan jeda), lalu dikendalikan lewat currentTime */
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const anims: Animation[] = []
    const pIn = cari(presets, a.animIn, 'in')
    const hIn = pIn ? bangunKeyframesAnimasi(pIn) : null
    if (hIn) anims.push(el.animate(hIn.kf, { duration: hIn.durasi, easing: hIn.easing, fill: 'both' }))
    const pOut = cari(presets, a.animOut, 'out')
    const hOut = pOut ? bangunKeyframesAnimasi(pOut) : null
    if (hOut) {
      const d = Math.min(hOut.durasi, Math.max(100, tampilMs))
      anims.push(el.animate(hOut.kf, { duration: d, easing: hOut.easing, fill: 'both', delay: Math.max(0, tampilMs - d) }))
    }
    const pLoop = cari(presets, a.animLoop, 'loop')
    const hLoop = pLoop ? bangunKeyframesAnimasi(pLoop) : null
    if (hLoop) anims.push(el.animate(hLoop.kf, { duration: hLoop.durasi, easing: hLoop.easing, iterations: Infinity, direction: 'alternate', fill: 'both' }))
    anims.forEach((x) => x.pause())
    animsRef.current = anims
    return () => anims.forEach((x) => x.cancel())
  }, [a.animIn, a.animOut, a.animLoop, tampilMs, presets])

  /* sinkronkan dengan playhead: saat jeda → posisikan; saat putar → jalankan dari posisi ini */
  useEffect(() => {
    const ms = rel * 1000
    for (const x of animsRef.current) {
      if (!playing) { x.pause(); x.currentTime = ms }
      else if (x.playState !== 'running') { x.currentTime = ms; x.play() }
    }
  }, [rel, playing, url])

  /* video overlay: ikut playhead, dibisukan */
  useEffect(() => {
    const v = vRef.current
    if (!v || a.tipe !== 'video') return
    if (Math.abs(v.currentTime - rel) > (playing ? 0.35 : 0.02)) {
      try { v.currentTime = rel } catch { /* belum siap — diulang saat metadata */ }
    }
    if (playing) { if (v.paused) v.play().catch(() => {}) } else if (!v.paused) v.pause()
  }, [rel, playing, url, a.tipe])

  if (!url) return null
  return (
    <div className="pointer-events-none absolute z-[4]" style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.lebar}%`, opacity: a.opacity, transform: 'translate(-50%,-50%)' }}>
      <div ref={elRef} className="block w-full" style={gayaBentuk(a.gaya)}>
        {a.tipe === 'video' ? (
          <video
            ref={vRef}
            src={url}
            muted
            loop
            playsInline
            preload="auto"
            onLoadedMetadata={() => { const v = vRef.current; if (v) try { v.currentTime = rel } catch { /* abaikan */ } }}
            className="block h-auto w-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" draggable={false} className="block h-auto w-full" />
        )}
      </div>
    </div>
  )
}

/** Semua aset scene yang sedang tampil pada `offset` (dtk sejak awal scene). */
export function LapisAset({ scene, offset, playing, presets }: {
  scene: SceneProyek; offset: number; playing: boolean; presets: PresetAnimasi[]
}) {
  const daftar = scene.aset ?? []
  if (!daftar.length) return null
  return (
    <>
      {daftar.map((a) => {
        const tampil = durasiTampil(a, scene.durasi)
        const rel = offset - a.mulai
        if (rel < 0 || rel >= tampil) return null
        return <ItemAset key={a.id} a={a} rel={Math.max(0, rel)} playing={playing} tampilMs={tampil * 1000} presets={presets} />
      })}
    </>
  )
}
