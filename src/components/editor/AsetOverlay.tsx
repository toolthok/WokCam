'use client'

/* ══════════ Render aset overlay (foto/video) di atas scene ══════════
 * Lapisan luar memegang posisi (tanpa animasi); lapisan dalam memegang gaya + animasi WAAPI.
 * Animasi masuk/keluar/loop diputar sesuai posisi playhead di aset (bisa di-scrub saat jeda).
 * Video overlay selalu dibisukan dan ikut playhead.
 */

import { useEffect, useRef, useState } from 'react'
import type { AsetOverlay, GayaAset, SceneProyek } from '@/lib/editor/proyek'
import { urlAset, urlAsetSinkron } from '@/lib/editor/aset-store'
import { asetBawaanUrl } from '@/lib/editor/aset-bawaan'
import { bangunKeyframesAnimasi } from '@/components/preset-preview'
import type { PresetAnimasi } from '@/lib/preset-store'
import { useEditor } from '@/lib/editor/store'

function useUrlAset(a: AsetOverlay): string | null {
  const bawaan = asetBawaanUrl(a.bawaanId)
  const [u, setU] = useState<string | null>(() => bawaan ?? urlAsetSinkron(a.id))
  useEffect(() => {
    if (bawaan) { setU(bawaan); return }
    let on = true
    urlAset(a.id).then((x) => { if (on) setU(x) })
    return () => { on = false }
  }, [a.id, bawaan])
  return bawaan ?? u
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

function ItemAset({ a, rel, playing, tampilMs, presets, sceneId, aktif }: {
  a: AsetOverlay; rel: number; playing: boolean; tampilMs: number; presets: PresetAnimasi[]; sceneId: string; aktif: boolean
}) {
  const url = useUrlAset(a)
  const vRef = useRef<HTMLVideoElement>(null)
  const elRef = useRef<HTMLDivElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)
  const animsRef = useRef<Animation[]>([])
  const seret = useRef<{ mode: 'pindah' | 'ubah'; sx: number; sy: number; x0: number; y0: number; l0: number; rect: DOMRect } | null>(null)

  /* tulis perubahan posisi/ukuran ke scene (tanpa riwayat per gerak — riwayat dicatat sekali saat tekan) */
  const ubahAset = (patch: Partial<AsetOverlay>) => {
    const st = useEditor.getState()
    const sc = st.scenes.find((s) => s.id === sceneId)
    if (!sc) return
    st.perbaruiScene(sceneId, { aset: (sc.aset ?? []).map((x) => (x.id === a.id ? { ...x, ...patch } : x)) }, false)
  }
  const onTekan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!aktif) return
    const host = outerRef.current?.offsetParent as HTMLElement | null
    if (!host) return
    e.stopPropagation()
    e.preventDefault()
    const mode = (e.target as HTMLElement).dataset.handle ? 'ubah' : 'pindah'
    useEditor.getState().rekamRiwayat()
    seret.current = { mode, sx: e.clientX, sy: e.clientY, x0: a.x, y0: a.y, l0: a.lebar, rect: host.getBoundingClientRect() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onGerak = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = seret.current
    if (!s) return
    const dx = ((e.clientX - s.sx) / s.rect.width) * 100
    const dy = ((e.clientY - s.sy) / s.rect.height) * 100
    if (s.mode === 'pindah') ubahAset({ x: Math.min(100, Math.max(0, s.x0 + dx)), y: Math.min(100, Math.max(0, s.y0 + dy)) })
    else ubahAset({ lebar: Math.min(100, Math.max(5, s.l0 + dx)) })
  }
  const onLepas = () => { seret.current = null }

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
    <div
      ref={outerRef}
      className="absolute z-[4]"
      style={{
        left: `${a.x}%`, top: `${a.y}%`, width: `${a.lebar}%`, opacity: a.opacity, transform: 'translate(-50%,-50%)',
        pointerEvents: aktif ? 'auto' : 'none', touchAction: aktif ? 'none' : undefined,
        cursor: aktif ? 'move' : undefined, outline: aktif ? '1.5px dashed rgba(167,139,250,0.9)' : undefined,
      }}
      onPointerDown={onTekan}
      onPointerMove={onGerak}
      onPointerUp={onLepas}
      onPointerCancel={onLepas}
    >
      {aktif && (
        <div
          data-handle="1"
          className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border border-violet-200 bg-violet-500"
          style={{ touchAction: 'none' }}
        />
      )}
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
  const selectedId = useEditor((s) => s.selectedId)
  const daftar = scene.aset ?? []
  if (!daftar.length) return null
  return (
    <>
      {daftar.map((a) => {
        const tampil = durasiTampil(a, scene.durasi)
        const rel = offset - a.mulai
        if (rel < 0 || rel >= tampil) return null
        return <ItemAset key={a.id} a={a} rel={Math.max(0, rel)} playing={playing} tampilMs={tampil * 1000} presets={presets} sceneId={scene.id} aktif={scene.id === selectedId} />
      })}
    </>
  )
}
