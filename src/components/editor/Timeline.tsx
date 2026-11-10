'use client'

/* ══════════ Timeline wokCam — editing LANGSUNG di timeline ══════════
 * PERTANYAAN YANG DIJAWAB: "kenapa timeline tidak bisa diedit langsung?"
 *   Versi lama hanya bisa klik-pilih + geser playhead; semua edit lewat Inspector
 *   dan paket animasi lama terikat konsep "database". Versi ini:
 *   1. Seret blok scene  → urutan scene berubah (drop slot dengan garis penanda)
 *   2. Tarik tepi kanan  → durasi scene berubah (langkah 0,5 dtk, jepit 2-15 s)
 *   3. Klik-dua-kali     → kartu edit langsung di atas blok (teks, naskah, durasi, mood)
 *   4. Chip ⚡ antar blok → pilih transisi antar scene dari Koleksi (+ pratinjau)
 *   5. Toolbar           → tambah / pisah / duplikat / hapus + pasang animasi & style
 *   Semua nilai mengikuti kontrak koleksi v1 & naskah — TANPA database; tiap perubahan
 *   langsung autosave ke localStorage. Logika drag/trim sengaja sederhana (pointer capture)
 *   supaya gampang dipindah ke GestureDetector di app Kotlin.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Plus, Scissors, Trash2, Type, Undo2, Redo2, Volume2, Film, X } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEditor } from '@/lib/editor/store'
import { AssignMenu, TombolAssign } from '@/components/editor/AssignMenu'
import {
  clampDurasi,
  fmtDurasi,
  fmtJam,
  gelombangSuara,
  gradientMood,
  hitungTiming,
  totalDurasi,
} from '@/lib/editor/proyek'
import { MOODS } from '@/lib/naskah-parser'
import { cn } from '@/lib/utils'

const H_RULER = 24
const H_VIDEO = 48
const H_TEKS = 26
const H_SUARA = 28

type GeserState = { id: string; dari: number; ke: number }
type PotongState = { id: string; durasi: number }

export function Timeline() {
  const scenes = useEditor((s) => s.scenes)
  const selectedId = useEditor((s) => s.selectedId)
  const time = useEditor((s) => s.time)
  const playing = useEditor((s) => s.playing)
  const zoom = useEditor((s) => s.zoom)
  const undoTumpuk = useEditor((s) => s.undoTumpuk.length)
  const redoTumpuk = useEditor((s) => s.redoTumpuk.length)
  const hydrasiSelesai = useEditor((s) => s.hydrasiSelesai)
  const pilih = useEditor((s) => s.pilih)
  const perbaruiScene = useEditor((s) => s.perbaruiScene)
  const rekamRiwayat = useEditor((s) => s.rekamRiwayat)
  const aturDurasi = useEditor((s) => s.aturDurasi)
  const tambahScene = useEditor((s) => s.tambahScene)
  const hapusScene = useEditor((s) => s.hapusScene)
  const duplikatScene = useEditor((s) => s.duplikatScene)
  const pisahSceneDipilih = useEditor((s) => s.pisahSceneDipilih)
  const pindahScene = useEditor((s) => s.pindahScene)
  const terapkanAnimasi = useEditor((s) => s.terapkanAnimasi)
  const terapkanTransisi = useEditor((s) => s.terapkanTransisi)
  const terapkanStyle = useEditor((s) => s.terapkanStyle)
  const setTime = useEditor((s) => s.setTime)
  const setZoom = useEditor((s) => s.setZoom)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)

  /* ── state drag & trim (lokal UI) ── */
  const [geser, setGeser] = useState<GeserState | null>(null)
  const [potong, setPotong] = useState<PotongState | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const seretRef = useRef<{ id: string; dari: number; startX: number; jalan: boolean } | null>(null)
  const potongRef = useRef<{ id: string; durasi0: number; startX: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const kontenRef = useRef<HTMLDivElement>(null)
  const rekamEditRef = useRef(false)

  const terpilih = scenes.find((s) => s.id === selectedId) ?? scenes[0] ?? null

  /* ── posisi tampil: memperhitungkan drag urutan & trim durasi secara langsung ── */
  const durasiTampil = useMemo(
    () => scenes.map((s) => (potong?.id === s.id ? potong.durasi : s.durasi)),
    [scenes, potong],
  )
  const urutanTampil = useMemo(() => {
    const semua = scenes.map((_, i) => i)
    if (!geser) return semua
    const sisa = semua.filter((i) => i !== geser.dari)
    sisa.splice(Math.min(Math.max(geser.ke, 0), sisa.length), 0, geser.dari)
    return sisa
  }, [scenes, geser])
  const posisiTampil = useMemo(() => {
    let acc = 0
    return urutanTampil.map((i) => {
      const p = { i, mulai: acc, dur: durasiTampil[i] }
      acc += durasiTampil[i]
      return p
    })
  }, [urutanTampil, durasiTampil])
  const totalTampil = useMemo(() => (geser || potong ? posisiTampil.reduce((a, p) => a + p.dur, 0) : totalDurasi(scenes)), [posisiTampil, geser, potong, scenes])
  const total = totalDurasi(scenes)
  const contentW = Math.max(totalTampil * zoom + 56, 340)

  /* ── auto-follow playhead saat memutar ── */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (time === 0) { el.scrollLeft = 0; return }
    if (!playing) return
    const x = time * zoom
    if (x < el.scrollLeft + 24 || x > el.scrollLeft + el.clientWidth - 80) {
      el.scrollLeft = Math.max(0, x - el.clientWidth * 0.4)
    }
  }, [time, playing, zoom])

  /* ── ruler: geser playhead ── */
  const draggingRuler = useRef(false)
  const seekDariEvent = (e: React.PointerEvent) => {
    const rect = kontenRef.current?.getBoundingClientRect()
    if (!rect) return
    const t = Math.min(Math.max((e.clientX - rect.left) / zoom, 0), total)
    setTime(t)
  }
  const onRulerPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    draggingRuler.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    seekDariEvent(e)
  }

  /* ── drag urutan ── */
  const hitungKe = (clientX: number): number => {
    const rect = kontenRef.current?.getBoundingClientRect()
    if (!rect) return geser?.ke ?? 0
    const px = clientX - rect.left
    let ke = 0
    for (const p of posisiTampil) {
      if (p.i === geser?.dari) continue
      if (px > (p.mulai + p.dur / 2) * zoom) ke++
    }
    return ke
  }

  const onBlokPointerDown = (e: React.PointerEvent, index: number, id: string) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-handle], [data-chip]')) return
    e.preventDefault()
    seretRef.current = { id, dari: index, startX: e.clientX, jalan: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onBlokPointerMove = (e: React.PointerEvent) => {
    const seret = seretRef.current
    if (!seret) return
    const dx = e.clientX - seret.startX
    if (!seret.jalan && Math.abs(dx) > 7) {
      seret.jalan = true
      setGeser({ id: seret.id, dari: seret.dari, ke: seret.dari })
    }
    if (seret.jalan && geser) {
      const ke = hitungKe(e.clientX)
      if (ke !== geser.ke) setGeser({ ...geser, ke })
    }
  }
  const onBlokPointerUp = () => {
    const seret = seretRef.current
    seretRef.current = null
    if (seret?.jalan && geser) {
      if (geser.ke !== geser.dari) pindahScene(geser.dari, geser.ke)
      setGeser(null)
    } else if (seret) {
      pilih(seret.id) // klik tanpa drag = pilih scene
    }
  }

  /* ── trim durasi (tepi kanan) ── */
  const onHandlePointerDown = (e: React.PointerEvent, id: string, durasi0: number) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    potongRef.current = { id, durasi0, startX: e.clientX }
    setPotong({ id, durasi: durasi0 })
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onHandlePointerMove = (e: React.PointerEvent) => {
    const pot = potongRef.current
    if (!pot) return
    const d = (e.clientX - pot.startX) / zoom
    setPotong({ id: pot.id, durasi: clampDurasi(Math.round((pot.durasi0 + d) * 2) / 2) })
  }
  const onHandlePointerUp = () => {
    const pot = potongRef.current
    potongRef.current = null
    if (pot && potong && potong.durasi !== pot.durasi0) aturDurasi(pot.id, potong.durasi)
    setPotong(null)
  }

  /* ── edit inline: buka kartu edit di atas blok (portal popover) ── */
  const bukaEdit = (id: string) => {
    rekamEditRef.current = false
    setEditId(id)
  }

  const ubahSceneEdit = (id: string, patch: Parameters<typeof perbaruiScene>[1]) => {
    if (!rekamEditRef.current) {
      rekamRiwayat() // satu entri riwayat per sesi edit
      rekamEditRef.current = true
    }
    perbaruiScene(id, patch, false)
  }

  /* ── ruler ticks ── */
  const tickStep = zoom < 25 ? 4 : zoom < 60 ? 2 : 1
  const ticks: number[] = []
  for (let s = 0; s <= Math.ceil(totalTampil); s += 1) ticks.push(s)

  return (
    <section className="shrink-0 border-t bg-zinc-950/85 max-lg:h-[300px]" aria-label="Timeline">
      {/* header */}
      <div className="flex h-9 items-center gap-2 border-b px-3">
        <span className="text-xs font-semibold text-zinc-300">Timeline</span>
        <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{fmtJam(total)}</span>
        <span className="hidden text-[10px] text-zinc-500 sm:inline">
          {scenes.length} scene · tersimpan otomatis
          <span className={cn('ml-1.5 inline-block h-1.5 w-1.5 rounded-full', hydrasiSelesai ? 'bg-emerald-500' : 'bg-amber-500')} />
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={undo}
            disabled={undoTumpuk === 0}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30"
            title="Urungkan (Ctrl+Z)"
            aria-label="Urungkan"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={redoTumpuk === 0}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30"
            title="Ulangi (Ctrl+Shift+Z)"
            aria-label="Ulangi"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
          <Select value={String(zoom)} onValueChange={(v) => setZoom(Number(v))}>
            <SelectTrigger className="h-7 w-[104px] text-[11px]" aria-label="Zoom timeline">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Zoom Kecil</SelectItem>
              <SelectItem value="48">Zoom Sedang</SelectItem>
              <SelectItem value="96">Zoom Besar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* toolbar aksi cepat + penugasan */}
      <div className="flex h-10 items-center gap-1.5 overflow-x-auto border-b px-3 toolbar-scroll">
        <button
          onClick={() => tambahScene()}
          className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800"
          title="Tambah scene kosong setelah scene terpilih"
        >
          <Plus className="h-3 w-3 text-emerald-400" /> Tambah
        </button>
        <button
          onClick={pisahSceneDipilih}
          className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800"
          title="Pisah scene terpilih jadi dua (di batas kalimat)"
        >
          <Scissors className="h-3 w-3 text-amber-400" /> Pisah
        </button>
        <button
          onClick={() => terpilih && duplikatScene(terpilih.id)}
          className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800"
          title="Duplikat scene terpilih"
        >
          <Copy className="h-3 w-3 text-sky-400" /> Duplikat
        </button>
        <button
          onClick={() => terpilih && hapusScene(terpilih.id)}
          disabled={scenes.length <= 1}
          className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-30"
          title="Hapus scene terpilih"
        >
          <Trash2 className="h-3 w-3 text-red-400" /> Hapus
        </button>

        <span className="mx-1 h-5 w-px bg-zinc-800" aria-hidden />

        {terpilih && (
          <>
            <AssignMenu jenis="in" terpasang={terpilih.animIn} onPilih={(n) => terapkanAnimasi('in', n, terpilih.id)}>
              <TombolAssign label="Masuk" terpasang={terpilih.animIn} />
            </AssignMenu>
            <AssignMenu jenis="loop" terpasang={terpilih.animLoop} onPilih={(n) => terapkanAnimasi('loop', n, terpilih.id)}>
              <TombolAssign label="Loop" terpasang={terpilih.animLoop} />
            </AssignMenu>
            <AssignMenu jenis="out" terpasang={terpilih.animOut} onPilih={(n) => terapkanAnimasi('out', n, terpilih.id)}>
              <TombolAssign label="Keluar" terpasang={terpilih.animOut} />
            </AssignMenu>
            <AssignMenu jenis="transisi" terpasang={terpilih.transisi} onPilih={(n) => terapkanTransisi(n, terpilih.id)}>
              <TombolAssign label="Transisi→" terpasang={terpilih.transisi} />
            </AssignMenu>
            <AssignMenu jenis="style" terpasang={terpilih.style} onPilih={(n) => terapkanStyle(n, terpilih.id)}>
              <TombolAssign label="Style" terpasang={terpilih.style} />
            </AssignMenu>
          </>
        )}

        <span className="ml-auto hidden shrink-0 text-[10px] text-zinc-500 lg:inline">
          seret = urutkan · tarik tepi kanan = durasi · klik-dua-kali = edit
        </span>
      </div>

      {/* badan timeline */}
      <div className="flex">
        {/* kolom label */}
        <div className="w-20 shrink-0 border-r bg-zinc-950">
          <div style={{ height: H_RULER }} className="border-b" />
          <div style={{ height: H_VIDEO }} className="flex items-center gap-1.5 border-b border-zinc-900/80 px-2">
            <Film className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span className="text-[10px] text-zinc-500">Video</span>
          </div>
          <div style={{ height: H_TEKS }} className="flex items-center gap-1.5 border-b border-zinc-900/80 px-2">
            <Type className="h-3 w-3 shrink-0 text-zinc-500" />
            <span className="text-[10px] text-zinc-500">Teks</span>
          </div>
          <div style={{ height: H_SUARA }} className="flex items-center gap-1.5 border-b border-zinc-900/80 px-2">
            <Volume2 className="h-3 w-3 shrink-0 text-zinc-500" />
            <span className="text-[10px] text-zinc-500">Suara</span>
          </div>
        </div>

        {/* konten geser */}
        <div ref={scrollRef} className="relative flex-1 overflow-x-auto overflow-y-hidden timeline-scroll">
          <div ref={kontenRef} className="relative select-none" style={{ width: contentW }}>
            {/* ruler */}
            <div
              className="relative cursor-pointer border-b border-zinc-900 touch-none"
              style={{ height: H_RULER }}
              onPointerDown={onRulerPointerDown}
              onPointerMove={(e) => draggingRuler.current && seekDariEvent(e)}
              onPointerUp={() => (draggingRuler.current = false)}
              onPointerCancel={() => (draggingRuler.current = false)}
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
            <div className="relative border-b border-zinc-900/80" style={{ height: H_VIDEO }}>
              {posisiTampil.map((p) => {
                const s = scenes[p.i]
                if (!s) return null
                const sel = s.id === selectedId
                const sedangGeser = geser?.id === s.id
                const sedangPotong = potong?.id === s.id
                const lebarPx = Math.max(10, p.dur * zoom - 2)
                const sempit = lebarPx < 74
                return (
                  <Fragment key={s.id}>
                  <Popover open={editId === s.id} onOpenChange={(v) => { if (!v) setEditId(null) }}>
                  <PopoverAnchor asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) => onBlokPointerDown(e, p.i, s.id)}
                    onPointerMove={onBlokPointerMove}
                    onPointerUp={onBlokPointerUp}
                    onPointerCancel={onBlokPointerUp}
                    onDoubleClick={() => bukaEdit(s.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') bukaEdit(s.id) }}
                    className={cn(
                      'absolute bottom-1 top-1 cursor-grab overflow-hidden rounded-md border text-left active:cursor-grabbing',
                      sel ? 'border-violet-400 ring-1 ring-violet-400/60' : 'border-zinc-700/70 hover:border-zinc-500',
                      sedangGeser && 'z-20 opacity-90 shadow-xl shadow-black/60',
                    )}
                    style={{
                      left: p.mulai * zoom + 1,
                      width: lebarPx,
                      transition: geser ? 'left 130ms ease' : undefined,
                    }}
                    title={`Scene ${p.i + 1} · ${s.mood} · ${fmtDurasi(s.durasi)}s — seret untuk urutkan, klik-dua-kali untuk edit`}
                  >
                    <div className="absolute inset-0 flex">
                      <div className={cn('h-full w-8 shrink-0 bg-gradient-to-br', gradientMood(s.mood))} />
                      <div className="min-w-0 flex-1 bg-zinc-900/80 px-1.5 py-1">
                        <div className="flex items-baseline gap-1">
                          <span className={cn('text-[10px] font-semibold', sel ? 'text-violet-200' : 'text-zinc-300')}>
                            Scene {p.i + 1}
                          </span>
                          <span className={cn('font-mono text-[9px]', sedangPotong ? 'font-bold text-amber-300' : 'text-zinc-500')}>
                            {fmtDurasi(p.dur)}s
                          </span>
                          <span className="ml-auto flex items-center gap-0.5">
                            {s.animIn && <span data-dot className="h-1.5 w-1.5 rounded-full bg-violet-400" title={`Animasi masuk: ${s.animIn}`} />}
                            {s.animLoop && <span data-dot className="h-1.5 w-1.5 rounded-full bg-sky-400" title={`Loop: ${s.animLoop}`} />}
                            {s.animOut && <span data-dot className="h-1.5 w-1.5 rounded-full bg-amber-400" title={`Animasi keluar: ${s.animOut}`} />}
                            {s.style && <span data-dot className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" title={`Style: ${s.style}`} />}
                            {s.transisi && <span data-dot className="h-1.5 w-1.5 rounded-full bg-emerald-400" title={`Transisi: ${s.transisi}`} />}
                          </span>
                        </div>
                        {!sempit && (
                          <p className="truncate text-[9px] text-zinc-500">{s.teks || s.naskah || '(tanpa teks)'}</p>
                        )}
                      </div>
                    </div>
                    {/* handle trim tepi kanan (bagian ATAS — bawah sengaja dibiarkan untuk chip transisi) */}
                    <div
                      data-handle
                      onPointerDown={(e) => onHandlePointerDown(e, s.id, s.durasi)}
                      onPointerMove={onHandlePointerMove}
                      onPointerUp={onHandlePointerUp}
                      onPointerCancel={onHandlePointerUp}
                      className="absolute right-0 top-0 z-10 h-[62%] w-2.5 cursor-ew-resize"
                      title="Tarik untuk ubah durasi (2-15 detik)"
                    >
                      <div className={cn(
                        'absolute right-0.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full transition-colors',
                        sedangPotong ? 'bg-amber-400' : sel ? 'bg-violet-400/80' : 'bg-zinc-600/0 hover:bg-zinc-500',
                      )} />
                    </div>
                    {/* gelembung durasi saat trim */}
                    {sedangPotong && (
                      <span className="absolute -top-6 left-1/2 z-30 -translate-x-1/2 rounded bg-amber-500 px-1.5 py-0.5 font-mono text-[10px] font-bold text-black">
                        {fmtDurasi(potong.durasi)}s
                      </span>
                    )}
                    {sedangGeser && (
                      <span className="absolute -top-6 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        pindah ke urutan {geser!.ke + 1}
                      </span>
                    )}
                  </div>
                  </PopoverAnchor>

                  {/* kartu edit langsung di atas blok (portal — tidak terpotong kontainer) */}
                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="w-[300px] rounded-xl border-violet-500/50 bg-zinc-900/95 p-3 shadow-2xl shadow-black/70"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-violet-300">
                        Edit Scene {p.i + 1}
                      </span>
                      <button onClick={() => setEditId(null)} className="rounded p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Tutup editor">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      autoFocus
                      value={s.teks}
                      onChange={(e) => ubahSceneEdit(s.id, { teks: e.target.value })}
                      placeholder="Teks di layar (maks 8 kata)"
                      className="mb-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-violet-500"
                    />
                    <textarea
                      value={s.naskah}
                      onChange={(e) => ubahSceneEdit(s.id, { naskah: e.target.value })}
                      placeholder="Naskah yang dibacakan suara…"
                      rows={2}
                      className="mb-2 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-violet-500"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-md border border-zinc-700 bg-zinc-950">
                        <button
                          onClick={() => ubahSceneEdit(s.id, { durasi: clampDurasi(s.durasi - 0.5) })}
                          className="h-7 w-7 text-sm font-bold text-zinc-400 hover:text-white"
                          aria-label="Kurangi durasi 0,5 detik"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-mono text-xs text-zinc-200">{fmtDurasi(s.durasi)}s</span>
                        <button
                          onClick={() => ubahSceneEdit(s.id, { durasi: clampDurasi(s.durasi + 0.5) })}
                          className="h-7 w-7 text-sm font-bold text-zinc-400 hover:text-white"
                          aria-label="Tambah durasi 0,5 detik"
                        >
                          +
                        </button>
                      </div>
                      <Select value={s.mood} onValueChange={(v) => ubahSceneEdit(s.id, { mood: v })}>
                        <SelectTrigger className="h-7 flex-1 text-[11px]" aria-label="Mood scene">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MOODS.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="mt-2 text-[10px] text-zinc-500">
                      Perubahan langsung tersimpan · Esc untuk tutup
                    </p>
                  </PopoverContent>
                  </Popover>
                  </Fragment>
                )
              })}

              {/* chip transisi di batas antar scene */}
              {posisiTampil.map((p, k) => {
                if (k === posisiTampil.length - 1) return null
                const berikut = posisiTampil[k + 1]
                const pemilik = scenes[p.i]
                if (!pemilik) return null
                const x = (p.mulai + p.dur) * zoom
                return (
                  <div key={`chip-${pemilik.id}`} className="absolute z-20" style={{ left: x - 9, top: H_VIDEO - 9 }} data-chip>
                    <AssignMenu
                      jenis="transisi"
                      terpasang={pemilik.transisi}
                      lebar="w-[260px]"
                      onPilih={(n) => terapkanTransisi(n, pemilik.id)}
                    >
                      <button
                        className={cn(
                          'flex h-5 w-[18px] items-center justify-center rounded-full border text-[9px] font-black leading-none transition',
                          pemilik.transisi
                            ? 'border-emerald-400/70 bg-emerald-500/25 text-emerald-200'
                            : 'border-dashed border-zinc-600 bg-zinc-900/90 text-zinc-500 hover:border-emerald-400/60 hover:text-emerald-300',
                        )}
                        title={pemilik.transisi ? `Transisi: ${pemilik.transisi}` : 'Tanpa transisi — klik untuk memilih'}
                        aria-label={`Transisi antara scene ${p.i + 1} dan ${berikut.i + 1}`}
                      >
                        ⚡
                      </button>
                    </AssignMenu>
                  </div>
                )
              })}
            </div>

            {/* track teks */}
            <div className="relative border-b border-zinc-900/80" style={{ height: H_TEKS }}>
              {posisiTampil.map((p) => {
                const s = scenes[p.i]
                if (!s) return null
                return (
                  <div
                    key={`t-${s.id}`}
                    className="absolute bottom-0.5 top-0.5 flex items-center gap-1 overflow-hidden rounded border border-zinc-800/80 bg-zinc-900/60 px-1.5"
                    style={{ left: p.mulai * zoom + 1, width: Math.max(10, p.dur * zoom - 2) }}
                    title={`Teks layar: ${s.teks || '(kosong)'}`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full border border-black/40"
                      style={{ background: s.style ? undefined : '#e4e4e7' }}
                      title={s.style ? `Style: ${s.style}` : 'Style bawaan'}
                    />
                    <span className="truncate text-[9px] italic text-zinc-400">
                      {s.teks ? `"${s.teks}"` : '(teks kosong — klik-dua-kali blok untuk mengisi)'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* track suara (estimasi VO) */}
            <div className="relative" style={{ height: H_SUARA }}>
              {posisiTampil.map((p) => {
                const s = scenes[p.i]
                if (!s) return null
                const kata = s.naskah.trim() ? s.naskah.trim().split(/\s+/).length : 0
                const lebarPx = Math.max(10, p.dur * zoom - 4)
                const bars = gelombangSuara(p.i + 3, Math.max(4, Math.min(64, Math.floor(lebarPx / 5))))
                const pekat = kata / Math.max(1, s.durasi)
                return (
                  <div
                    key={`v-${s.id}`}
                    className="absolute bottom-0.5 top-0.5 flex items-end gap-[1px] overflow-hidden rounded border border-zinc-800 bg-zinc-900/60 px-1 py-0.5"
                    style={{ left: p.mulai * zoom + 2, width: lebarPx }}
                    title={`Estimasi suara: ${kata} kata / ${fmtDurasi(s.durasi)}s (${pekat.toFixed(1)} kata/dtk)`}
                  >
                    {bars.map((h, i) => (
                      <div
                        key={i}
                        className="w-[3px] shrink-0 rounded-sm"
                        style={{ height: `${Math.round(h * 62)}%`, background: pekat > 3.2 ? '#fb923c' : '#52525b' }}
                      />
                    ))}
                    {kata === 0 && (
                      <span className="absolute left-1 top-0.5 text-[8px] text-zinc-600">tanpa naskah</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* playhead */}
            <div className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-violet-400" style={{ left: time * zoom }}>
              <div className="absolute -left-[5px] -top-[1px] h-2.5 w-2.5 rounded-sm bg-violet-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
