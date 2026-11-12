'use client'

/* ══════════ Panggung Pratinjau wokCam (kontrak baru + gaya video referensi) ══════════
 * PERTANYAAN YANG DIJAWAB: "hasil penataan scene terlihat seperti apa sebelum direkam?"
 *   - Latar = gradien mood/preset + tekstur grid (kertas-grid) + label kata kunci LATAR
 *     (di app asli: gambar stok/AI).
 *   - Teks  = scene.teks (boleh beranotasi tebal/miring via penanda bintang) dengan style
 *     Koleksi; gerakan "kata" merender KATA-DEMI-KATA (teknik khas video promo referensi).
 *   - Kartu mengambang = mockup ala screenshot video referensi (scene.kartu).
 *   - BRANDING persisten: badge pill atas + tanda air bawah (proyek.badge/watermark)
 *     — tampil di semua scene, TIDAK ikut transisi.
 *   - Transisi antar scene dipasang per batas (scene.transisi): crossfade/slide/wipe/zoom/
 *     flip/BLUR.
 *   - TANPA database: semua nilai dari store proyek + koleksi localStorage.
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { MessageSquareText, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/lib/editor/store'
import { koleksiStore, type Koleksi, type PresetStyle } from '@/lib/preset-store'
import { KF_KATA, bangunKeyframesAnimasi, cssEasing, gayaAwalAnimasi, kelasFont, polaAnimasiKata } from '@/components/preset-preview'
import {
  fmtJam,
  gayaTransisiKeluar,
  gayaTransisiMasuk,
  kelasLatar,
  latarDariId,
  overlayDariId,
  uraiTeks,
  hitungTiming,
  sceneIndexDiWaktu,
  totalDurasi,
  transisiDiWaktu,
  type SegmenKata,
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

/* ── Gaya satu kata beranotasi — penekanan campuran ala video referensi:
 * normal = warna style; **tebal** = lebih besar & hitam pekat; *miring* = abu + italic. */
function gayaKata(seg: SegmenKata, warna: string): React.CSSProperties {
  if (seg.gaya === 'tebal') {
    return { fontWeight: 900, fontSize: '1.12em', color: warna, lineHeight: 1.1 }
  }
  if (seg.gaya === 'miring') {
    /* abu-kan warna teks (kata kunci "sampingan" ala video referensi) */
    return { fontStyle: 'italic', fontWeight: 600, color: warna, opacity: 0.62 }
  }
  return {}
}

/* ── Lapisan overlay (efek di atas latar, di bawah teks) — CSS murni, deterministik ═══ */

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")"

const TITIK_BOKEH = [
  { l: '10%', t: '18%', s: 34 },
  { l: '76%', t: '12%', s: 22 },
  { l: '62%', t: '66%', s: 42 },
  { l: '24%', t: '74%', s: 26 },
  { l: '86%', t: '48%', s: 16 },
]

function LapisOverlay({ scene, playing }: { scene: SceneProyek; playing: boolean }) {
  const ov = overlayDariId(scene.overlayId)
  if (!ov) return null
  switch (ov.id) {
    case 'vignette':
      return (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.55) 100%)' }}
        />
      )
    case 'grain':
      return <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: GRAIN_URL, backgroundSize: '180px 180px' }} />
    case 'letterbox':
      return (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-black" style={{ height: '11%' }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black" style={{ height: '11%' }} />
        </>
      )
    case 'light-leak':
      return (
        <div
          className={cn('pointer-events-none absolute inset-0 mix-blend-screen', playing && 'animate-pulse')}
          style={{ background: 'radial-gradient(circle at 82% 12%, rgba(255,196,120,0.5), rgba(255,120,80,0.18) 35%, transparent 62%)' }}
        />
      )
    case 'bokeh':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {TITIK_BOKEH.map((d, i) => (
            <div
              key={i}
              className={cn('absolute rounded-full bg-white/25 blur-[2px]', playing && 'wokcam-melayang')}
              style={{ left: d.l, top: d.t, width: d.s, height: d.s, animationDelay: `${i * 0.7}s`, animationDuration: '4s' }}
            />
          ))}
        </div>
      )
    case 'lower-third':
      return (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: '22%', background: 'linear-gradient(to top, rgba(0,0,0,0.62), transparent)' }}
        />
      )
    case 'haze':
      return (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: '45%', background: 'linear-gradient(to top, rgba(255,255,255,0.22), transparent)' }}
        />
      )
    case 'progress':
      return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4px] bg-white/15">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
            style={playing ? { animation: `wokcam-progres ${scene.durasi}s linear forwards` } : { width: '0%' }}
          />
        </div>
      )
    default:
      return null
  }
}

/* ── Kartu mengambang ala mockup video referensi — pengganti screenshot di prototype.
 * Deterministik (CSS murni): kartu putih miring dengan bayangan lembut + kerangka UI.
 * Di app Kotlin: Compose Card + drawBehind. Judul = scene.kartu. */
function KartuMengambang({ judul, tinggi, playing }: { judul: string; tinggi: number; playing: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  /* melayang pelan saat diputar — sama rasa dengan loop pan pada latar */
  useEffect(() => {
    const el = ref.current
    if (!el || !playing) return
    const anim = el.animate(
      [{ transform: 'rotate(-2.5deg) translateY(0)' }, { transform: 'rotate(-2.5deg) translateY(-8px)' }],
      { duration: 3200, easing: 'ease-in-out', direction: 'alternate', iterations: Infinity, fill: 'both' },
    )
    return () => anim.cancel()
  }, [playing])

  const skala = tinggi / 1080
  return (
    <div className="pointer-events-none absolute left-1/2 z-[4] w-[62%] -translate-x-1/2" style={{ top: '9%' }}>
      <div
        ref={ref}
        className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white"
        style={{
          transform: 'rotate(-2.5deg)',
          boxShadow: '0 18px 44px rgba(24,24,27,0.16), 0 4px 10px rgba(24,24,27,0.08)',
          padding: `${Math.max(8, 22 * skala)}px`,
        }}
      >
        {/* bar atas ala jendela aplikasi */}
        <div className="mb-2 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
          <span className="ml-auto h-2.5 w-10 rounded-full bg-zinc-100" />
        </div>
        {/* judul kartu */}
        <p
          className="truncate text-center font-bold text-zinc-800"
          style={{ fontSize: `${Math.max(9, 30 * skala).toFixed(1)}px`, lineHeight: 1.2 }}
        >
          {judul}
        </p>
        {/* kerangka konten: banner violet + baris abu — rasa "screenshot aplikasi" */}
        <div
          className="mt-2 w-full rounded-lg bg-gradient-to-r from-violet-400 to-fuchsia-400"
          style={{ height: `${Math.max(6, 40 * skala).toFixed(1)}px` }}
        />
        <div className="mt-2 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-zinc-200" />
          <div className="h-1.5 w-4/5 rounded bg-zinc-200" />
          <div className="h-1.5 w-3/5 rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  )
}

/* ── Satu lapisan scene (latar + kartu + overlay + teks beranotasi + animasi) ── */

function LapisScene({
  scene,
  koleksi,
  tinggi,
  playing,
  offset,
}: {
  scene: SceneProyek
  koleksi: Koleksi
  tinggi: number
  playing: boolean
  offset: number
}) {
  const bgRef = useRef<HTMLDivElement>(null)
  const teksRef = useRef<HTMLDivElement>(null)

  const style = scene.style ? koleksi.styles.find((p) => p.nama === scene.style) ?? null : null
  const presetIn = scene.animIn ? koleksi.presets.find((p) => p.nama === scene.animIn && p.tipe === 'in') ?? null : null
  const presetOut = scene.animOut ? koleksi.presets.find((p) => p.nama === scene.animOut && p.tipe === 'out') ?? null : null
  const presetLoop = scene.animLoop ? koleksi.presets.find((p) => p.nama === scene.animLoop && p.tipe === 'loop') ?? null : null
  const latar = latarDariId(scene.latarPreset)

  /* teks dipecah kata beranotasi (penanda bintang tebal/miring) — satu sumber untuk semua mode render */
  const kataSegmen = useMemo(() => uraiTeks(scene.teks || scene.naskah), [scene.teks, scene.naskah])
  /* gerakan "kata": tiap kata pop berurutan — jendela reveal ≤ 55% durasi scene */
  const polaKata = useMemo(
    () => (presetIn ? polaAnimasiKata(presetIn, kataSegmen.length, scene.durasi) : null),
    [presetIn, kataSegmen.length, scene.durasi],
  )

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

  /* animasi teks masuk → keluar. Gerakan "kata" TIDAK memakai keyframe container —
   * tiap kata punya animasi pop sendiri (dengan delay bertahap). */
  useEffect(() => {
    const el = teksRef.current
    if (!el || !playing) return
    const anims: Animation[] = []
    const timer: ReturnType<typeof setTimeout>[] = []

    if (polaKata) {
      el.querySelectorAll('[data-kata]').forEach((node, i) => {
        anims.push(
          node.animate(KF_KATA, {
            duration: polaKata.durasiPerKata,
            easing: polaKata.easing,
            delay: i * polaKata.langkah,
            fill: 'both',
          }),
        )
      })
    } else if (presetIn) {
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
  }, [presetIn, presetOut, polaKata, playing, scene.id, scene.durasi])

  const gayaAwalTeks = presetIn && playing && !polaKata ? gayaAwalAnimasi(presetIn) : undefined

  return (
    <>
      {/* latar scene — preset katalog bila dipilih, selain itu gradien mood */}
      <div ref={bgRef} className={cn('absolute inset-0 bg-gradient-to-br will-change-transform', kelasLatar(scene.latarPreset, scene.mood))}>
        {/* tekstur kertas-grid (gaya video referensi) — pola titik halus deterministik */}
        {latar?.tekstur === 'grid' && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(rgba(24,24,27,0.13) 1.1px, transparent 1.4px)', backgroundSize: '22px 22px' }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            /* latar terang → dekorasi lembut; latar gelap → glow + gelap sudut seperti sebelumnya */
            background: latar?.terang
              ? 'radial-gradient(circle at 28% 18%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(circle at 78% 85%, rgba(24,24,27,0.07), transparent 50%)'
              : 'radial-gradient(circle at 28% 18%, rgba(255,255,255,0.10), transparent 55%), radial-gradient(circle at 78% 85%, rgba(0,0,0,0.35), transparent 50%)',
          }}
        />
      </div>

      {/* kartu mengambang ala mockup — konten scene (di atas latar, di bawah overlay/teks) */}
      {scene.kartu && <KartuMengambang judul={scene.kartu} tinggi={tinggi} playing={playing} />}

      {/* overlay efek — di ATAS latar/kartu & DI BAWAH teks: teks faceless video adalah raja,
          jadi strip bawah/bar sinema justru menjadi “latar” teks agar selalu terbaca */}
      <LapisOverlay scene={scene} playing={playing} />

      {/* aset foto/video (bisa banyak) — di atas overlay efek, di bawah teks */}
      <LapisAset scene={scene} offset={offset} playing={playing} />

      {/* teks scene — kata beranotasi (penanda tebal/miring) + style dari preset koleksi */}
      <div className={cn('absolute inset-0 z-[5] flex justify-center px-[7%]', posisiTeksClass(style?.posisi))}>
        <div ref={teksRef} className="max-w-full text-center" style={gayaAwalTeks}>
          <span className={cn('inline-block break-words', style ? kelasFont(style.font) : 'font-extrabold')} style={gayaTeks(style, tinggi)}>
            {kataSegmen.map((seg, i) => (
              <span key={i} data-kata={polaKata ? '' : undefined} className="inline-block whitespace-pre" style={gayaKata(seg, style?.warna_teks ?? '#FFFFFF')}>
                {seg.kata}
                {i < kataSegmen.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        </div>
      </div>
    </>
  )
}

import { LapisAset } from '@/components/editor/AsetOverlay'

export function PreviewCanvas() {
  const scenes = useEditor((s) => s.scenes)
  const time = useEditor((s) => s.time)
  const playing = useEditor((s) => s.playing)
  const rasio = useEditor((s) => s.rasio)
  const judul = useEditor((s) => s.judul)
  const badge = useEditor((s) => s.badge)
  const watermark = useEditor((s) => s.watermark)
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
  /* jarak playhead dari awal masing-masing scene (untuk video overlay & aset) */
  const offA = trans ? time - (segs[trans.indexA]?.mulai ?? 0) : time - (segs[curIndex]?.mulai ?? 0)
  const offB = trans ? time - (segs[trans.indexB]?.mulai ?? 0) : 0
  const gayaA = trans ? gayaTransisiKeluar(trans.gerakan, trans.presetArah, trans.q) : undefined
  const gayaB = trans ? gayaTransisiMasuk(trans.gerakan, trans.presetArah, trans.q) : undefined
  /* latar terang (kertas*) → gradien pembacaan gelap stage dilepas */
  const latarTerang = latarDariId(cur?.latarPreset ?? null)?.terang === true

  return (
    <section className="relative flex min-h-[240px] flex-1 flex-col max-lg:h-[56dvh] max-lg:flex-none" aria-label="Pratinjau video">
      <div ref={ref} className="relative flex-1 overflow-hidden bg-zinc-950 bg-grid" data-tour="stage">
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
                  <LapisScene scene={layerA} koleksi={koleksi} tinggi={size.h} playing={playing} offset={offA} />
                </div>
              )}
              {size.w > 0 && layerB && (
                <div className="absolute inset-0" style={gayaB}>
                  <LapisScene scene={layerB} koleksi={koleksi} tinggi={size.h} playing={playing} offset={offB} />
                </div>
              )}

              {/* BRANDING persisten ala video referensi — badge pill atas + tanda air bawah.
               * Tidak ikut layer scene: tetap diam & jernih saat scene berganti/transisi. */}
              {badge && (
                <div
                  className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-zinc-200/70 bg-white px-3.5 py-1 font-bold text-zinc-900"
                  style={{
                    top: '3.2%',
                    fontSize: `${Math.max(9, size.h * 0.030).toFixed(1)}px`,
                    boxShadow: '0 6px 16px rgba(24,24,27,0.14)',
                  }}
                >
                  {badge}
                </div>
              )}
              {watermark && (
                <div
                  className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-semibold text-zinc-500"
                  style={{ bottom: '1.6%', fontSize: `${Math.max(7, size.h * 0.020).toFixed(1)}px`, opacity: 0.85 }}
                >
                  {watermark}
                </div>
              )}

              {/* vignette agar teks terbaca — dimatikan pada latar terang (kertas*):
               * gradien gelap justru mengotori gaya putih bersih video referensi */}
              {!latarTerang && (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black/40 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-black/45 to-transparent" />
                </>
              )}

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
                  {/* label "wokCam" pojok lama dihapus — digantikan tanda air proyek (watermark) */}
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
          data-tour="play"
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
