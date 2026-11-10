'use client'

/* ══════════ Panggung Pratinjau wokCam (kontrak baru) ══════════
 * PERTANYAAN YANG DIJAWAB: "hasil penataan scene terlihat seperti apa sebelum direkam?"
 *   - Latar = gradien mood + label kata kunci LATAR (di app asli: gambar stok/AI).
 *   - Teks  = scene.teks dengan style dari Koleksi (font·ukuran·warna·outline·posisi).
 *   - Animasi teks in/out memakai keyframes yang SAMA dengan kartu pratinjau preset
 *     (bangunKeyframesAnimasi) — satu sumber logika, gampang dipindah ke Kotlin.
 *   - Gerak loop dijalankan pada latar selama diputar (zoom/pan bolak-balik).
 *   - Transisi antar scene dipasang per batas (scene.transisi): jendela di akhir scene —
 *     scene berikutnya menyusup dengan gaya gerakan (crossfade/slide/wipe/zoom/flip).
 *   - TANPA database: semua nilai dari store proyek + koleksi localStorage.
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { MessageSquareText, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/lib/editor/store'
import { koleksiStore, type Koleksi, type PresetStyle } from '@/lib/preset-store'
import { bangunKeyframesAnimasi, cssEasing, gayaAwalAnimasi, kelasFont } from '@/components/preset-preview'
import {
  fmtJam,
  gayaTransisiKeluar,
  gayaTransisiMasuk,
  gradientMood,
  hitungTiming,
  sceneIndexDiWaktu,
  totalDurasi,
  transisiDiWaktu,
  type SceneProyek,
} from '@/lib/editor/proyek'
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

function useKoleksi(): Koleksi {
  return useSyncExternalStore(koleksiStore.subscribe, koleksiStore.getSnapshot, koleksiStore.getServerSnapshot)
}

/* ── Gaya teks dari preset style kontrak (ukuran berdasar 1080p → diskalakan ke panggung) ── */

function gayaTeks(style: PresetStyle | null, tinggi: number, ukuranBawaan = 3.4): React.CSSProperties {
  const skala = tinggi / 1080
  const ukuran = style ? style.ukuran * skala : tinggi * (ukuranBawaan / 100)
  const tebal = style ? (style.tebal_outline / 1080) * tinggi : 0
  return {
    fontSize: `${Math.max(9, ukuran).toFixed(1)}px`,
    color: style?.warna_teks ?? '#FFFFFF',
    WebkitTextStroke: tebal > 0 ? `${Math.max(0.6, tebal).toFixed(2)}px ${style?.warna_outline ?? '#000000'}` : undefined,
    paintOrder: 'stroke fill',
    textShadow: '0 2px 10px rgba(0,0,0,0.55)',
    lineHeight: 1.18,
  }
}

function posisiTeksClass(posisi: string | undefined): string {
  return posisi === 'atas'
    ? 'items-start pt-[7%]'
    : posisi === 'tengah'
      ? 'items-center'
      : 'items-end pb-[9%]'
}

/* ── Satu lapisan scene (latar + teks + animasi) ── */

function LapisScene({
  scene,
  koleksi,
  tinggi,
  playing,
}: {
  scene: SceneProyek
  koleksi: Koleksi
  tinggi: number
  playing: boolean
}) {
  const bgRef = useRef<HTMLDivElement>(null)
  const teksRef = useRef<HTMLDivElement>(null)

  const style = scene.style ? koleksi.styles.find((p) => p.nama === scene.style) ?? null : null
  const presetIn = scene.animIn ? koleksi.presets.find((p) => p.nama === scene.animIn && p.tipe === 'in') ?? null : null
  const presetOut = scene.animOut ? koleksi.presets.find((p) => p.nama === scene.animOut && p.tipe === 'out') ?? null : null
  const presetLoop = scene.animLoop ? koleksi.presets.find((p) => p.nama === scene.animLoop && p.tipe === 'loop') ?? null : null

  /* gerak loop pada latar — hanya saat diputar */
  useEffect(() => {
    const el = bgRef.current
    if (!el || !playing || !presetLoop) return
    const dur = Math.max(600, Math.min(presetLoop.durasi_ms, 6000))
    const eas = cssEasing(presetLoop.easing)
    const amp = Math.min(Math.max(presetLoop.intensitas, 0), 200) / 100 // 0–2
    const zoomAmp = 1 + 0.1 * amp
    let kf: Keyframe[]
    switch (presetLoop.gerakan) {
      case 'zoom_in': kf = [{ transform: 'scale(1)' }, { transform: `scale(${zoomAmp})` }]; break
      case 'zoom_out': kf = [{ transform: `scale(${zoomAmp})` }, { transform: 'scale(1)' }]; break
      case 'pan_kiri': kf = [{ transform: 'scale(1.06)' }, { transform: 'scale(1.06) translateX(-2%)' }]; break
      case 'pan_kanan': kf = [{ transform: 'scale(1.06)' }, { transform: 'scale(1.06) translateX(2%)' }]; break
      case 'pan_atas': kf = [{ transform: 'scale(1.06)' }, { transform: 'scale(1.06) translateY(-2%)' }]; break
      case 'pan_bawah': kf = [{ transform: 'scale(1.06)' }, { transform: 'scale(1.06) translateY(2%)' }]; break
      default: return
    }
    const anim = el.animate(kf, { duration: dur, easing: eas, direction: 'alternate', iterations: Infinity, fill: 'both' })
    return () => anim.cancel()
  }, [presetLoop, playing])

  /* animasi teks masuk → keluar (urutan waktu sesuai durasi scene) */
  useEffect(() => {
    const el = teksRef.current
    if (!el || !playing) return
    const anims: Animation[] = []
    const timer: ReturnType<typeof setTimeout>[] = []

    if (presetIn) {
      const h = bangunKeyframesAnimasi(presetIn)
      if (h) anims.push(el.animate(h.kf, { duration: h.durasi, easing: h.easing, fill: 'both' }))
    }
    if (presetOut) {
      const h = bangunKeyframesAnimasi(presetOut)
      if (h) {
        const mulaiOut = Math.max(0, scene.durasi * 1000 - h.durasi)
        timer.push(setTimeout(() => {
          anims.push(el.animate(h.kf, { duration: h.durasi, easing: h.easing, fill: 'both' }))
        }, mulaiOut))
      }
    }
    return () => {
      timer.forEach(clearTimeout)
      anims.forEach((a) => a.cancel())
    }
  }, [presetIn, presetOut, playing, scene.id, scene.durasi])

  const gayaAwalTeks = presetIn && playing ? gayaAwalAnimasi(presetIn) : undefined

  return (
    <>
      {/* latar scene */}
      <div ref={bgRef} className={cn('absolute inset-0 will-change-transform', gradientMood(scene.mood))}>
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(circle_at_78%_85%,rgba(0,0,0,0.35),transparent_50%)]"
        />
        <span className="absolute left-2 top-2 max-w-[70%] truncate rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-medium text-white/70">
          LATAR: {scene.latarId || (scene.latarEn ? '—' : 'bebas')}
          {scene.latarEn ? ` · EN: ${scene.latarEn}` : ''}
        </span>
      </div>

      {/* teks scene */}
      <div className={cn('absolute inset-0 flex justify-center px-[6%]', posisiTeksClass(style?.posisi))}>
        <div ref={teksRef} className="max-w-full text-center" style={gayaAwalTeks}>
          <span className={cn('inline-block break-words', style ? kelasFont(style.font) : 'font-extrabold')}>
            {scene.teks || scene.naskah}
          </span>
        </div>
      </div>
    </>
  )
}

export function PreviewCanvas() {
  const scenes = useEditor((s) => s.scenes)
  const time = useEditor((s) => s.time)
  const playing = useEditor((s) => s.playing)
  const rasio = useEditor((s) => s.rasio)
  const judul = useEditor((s) => s.judul)
  const togglePlay = useEditor((s) => s.togglePlay)
  const setTime = useEditor((s) => s.setTime)
  const keScene = useEditor((s) => s.keScene)
  const koleksi = useKoleksi()

  const { ref, size } = useFit(RATIO[rasio] ?? RATIO['9:16'])
  const total = totalDurasi(scenes)
  const segs = useMemo(() => hitungTiming(scenes), [scenes])
  const curIndex = sceneIndexDiWaktu(segs, time)
  const cur = scenes[curIndex] ?? null
  const trans = transisiDiWaktu(scenes, koleksi, time)

  const layerA = trans ? scenes[trans.indexA] : cur
  const layerB = trans ? scenes[trans.indexB] : null
  const gayaA = trans ? gayaTransisiKeluar(trans.gerakan, trans.presetArah, trans.q) : undefined
  const gayaB = trans ? gayaTransisiMasuk(trans.gerakan, trans.presetArah, trans.q) : undefined

  return (
    <section className="relative flex min-h-[240px] flex-1 flex-col max-lg:h-[56dvh] max-lg:flex-none" aria-label="Pratinjau video">
      <div ref={ref} className="relative flex-1 overflow-hidden bg-zinc-950 bg-grid">
        <div className="absolute inset-0 flex items-center justify-center">
          {scenes.length === 0 ? (
            <div className="flex max-w-xs flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
              <MessageSquareText className="h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-400">
                Belum ada scene. Tempel naskah dari ChatGPT lewat tombol <span className="font-medium text-violet-300">Impor Naskah</span> di atas.
              </p>
            </div>
          ) : (
            <div
              className="relative overflow-hidden rounded-lg border border-zinc-800 shadow-2xl shadow-black/60"
              style={{ width: size.w || undefined, height: size.h || undefined }}
            >
              {size.w > 0 && layerA && (
                <div className="absolute inset-0" style={gayaA}>
                  <LapisScene scene={layerA} koleksi={koleksi} tinggi={size.h} playing={playing} />
                </div>
              )}
              {size.w > 0 && layerB && (
                <div className="absolute inset-0" style={gayaB}>
                  <LapisScene scene={layerB} koleksi={koleksi} tinggi={size.h} playing={playing} />
                </div>
              )}

              {/* vignette agar teks terbaca */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black/40 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-black/45 to-transparent" />

              {/* overlay info */}
              {cur && (
                <>
                  <div className="absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-zinc-200 backdrop-blur">
                    <span className="text-violet-300">Scene {curIndex + 1}</span>
                    <span className="text-zinc-500">·</span>
                    <span>{cur.mood}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="font-mono">{cur.durasi}s</span>
                    {trans && (
                      <>
                        <span className="text-zinc-500">·</span>
                        <span className="text-emerald-300">transisi {Math.round(trans.q * 100)}%</span>
                      </>
                    )}
                  </div>
                  <div className="absolute right-2.5 top-2.5 z-20 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur">
                    {rasio} · 1080p
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
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => keScene(curIndex - 1)}
          aria-label="Scene sebelumnya"
        >
          <SkipBack className="h-3.5 w-3.5 text-zinc-500" />
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
          onClick={() => keScene(curIndex + 1)}
          aria-label="Scene berikutnya"
        >
          <SkipForward className="h-3.5 w-3.5 text-zinc-500" />
        </Button>
        <span className="ml-1 font-mono text-xs text-zinc-400">
          {fmtJam(time)} <span className="text-zinc-600">/ {fmtJam(total)}</span>
        </span>
        <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-zinc-500 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {judul}
        </span>
      </div>
    </section>
  )
}
