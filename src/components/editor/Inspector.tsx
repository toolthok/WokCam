'use client'

/* ══════════ Inspector — detail scene terpilih (panel kanan), dikelompokkan per komponen ══════════
 * Tab: Scene (durasi/mood/transisi) · Teks · Latar · Kartu · Aset. Tiap tab mengatur style +
 * animasi masuk/keluar/loop komponen itu. Branding proyek tetap di atas (berlaku semua scene).
 * Durasi lewat slider memakai onValueCommit supaya riwayat undo tidak banjir.
 */

import { useState } from 'react'
import { Eraser, Tag, Type } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEditor } from '@/lib/editor/store'
import { BarisAssign } from '@/components/editor/BarisAssign'
import { AsetPanel } from '@/components/editor/AsetPanel'
import { fmtDurasi, kelasLatar, LATAR_PRESET, OVERLAY_PRESET, totalDurasi, type AnimMasukKeluar, type SceneProyek } from '@/lib/editor/proyek'
import { MOODS } from '@/lib/naskah-parser'
import { cn } from '@/lib/utils'

const label = 'mb-1 block text-[10px] uppercase tracking-wide text-zinc-400'
const kartuTab = 'space-y-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5'

export function Inspector({ className }: { className?: string }) {
  const scenes = useEditor((s) => s.scenes)
  const selectedId = useEditor((s) => s.selectedId)
  const badge = useEditor((s) => s.badge)
  const watermark = useEditor((s) => s.watermark)
  const setBranding = useEditor((s) => s.setBranding)
  const perbaruiScene = useEditor((s) => s.perbaruiScene)
  const rekamRiwayat = useEditor((s) => s.rekamRiwayat)
  const aturDurasi = useEditor((s) => s.aturDurasi)
  const terapkanAnimasi = useEditor((s) => s.terapkanAnimasi)
  const terapkanTransisi = useEditor((s) => s.terapkanTransisi)
  const terapkanTransisiSemua = useEditor((s) => s.terapkanTransisiSemua)
  const terapkanStyle = useEditor((s) => s.terapkanStyle)
  const terapkanLatar = useEditor((s) => s.terapkanLatar)
  const terapkanOverlay = useEditor((s) => s.terapkanOverlay)

  const scene = scenes.find((s) => s.id === selectedId) ?? scenes[0] ?? null
  const index = scene ? scenes.findIndex((s) => s.id === scene.id) : -1
  const kata = scene?.naskah.trim() ? scene.naskah.trim().split(/\s+/).filter(Boolean).length : 0
  const estBicara = Math.ceil(kata / 2.4)

  const [sliderDurasi, setSliderDurasi] = useState<number | null>(null)

  /* animasi masuk/keluar latar & kartu: disimpan per scene, "→ semua" menerapkan ke seluruh scene */
  const setAnim = (kunci: 'animLatar' | 'animKartu', k: 'in' | 'out', n: string | null) => {
    if (!scene) return
    const lama: AnimMasukKeluar = scene[kunci] ?? { in: null, out: null }
    perbaruiScene(scene.id, { [kunci]: { ...lama, [k]: n } } as Partial<SceneProyek>, false)
  }
  const setAnimSemua = (kunci: 'animLatar' | 'animKartu', k: 'in' | 'out', n: string | null) => {
    rekamRiwayat()
    for (const sc of scenes) {
      const lama: AnimMasukKeluar = sc[kunci] ?? { in: null, out: null }
      perbaruiScene(sc.id, { [kunci]: { ...lama, [k]: n } } as Partial<SceneProyek>, false)
    }
  }

  return (
    <aside className={cn('flex flex-col overflow-y-auto border-l bg-zinc-950/90 thin-scroll', className)} aria-label="Detail scene" data-tour="inspector">
      {/* BRANDING proyek — badge pill atas + tanda air bawah, tampil di SEMUA scene dan
       * tidak ikut transisi (ala video referensi). Proyek-level, bukan per-scene. */}
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/40 p-3.5" data-tour="inspector-branding">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300">
          <Tag className="h-3 w-3" /> Branding proyek
        </p>
        <div className="space-y-2">
          <div>
            <Label className={label}>Badge pill (atas)</Label>
            <Input
              value={badge ?? ''}
              onChange={(e) => setBranding({ badge: e.target.value || null })}
              onFocus={rekamRiwayat}
              placeholder="mis. wokCam — kosong = tanpa"
              className="h-8 border-zinc-700 bg-zinc-950 text-xs focus-visible:border-sky-500"
            />
          </div>
          <div>
            <Label className={label}>Tanda air (bawah)</Label>
            <Input
              value={watermark ?? ''}
              onChange={(e) => setBranding({ watermark: e.target.value || null })}
              onFocus={rekamRiwayat}
              placeholder="mis. @wokcam — kosong = tanpa"
              className="h-8 border-zinc-700 bg-zinc-950 text-xs focus-visible:border-sky-500"
            />
          </div>
        </div>
      </div>

      {!scene ? (
        <div className="p-4 text-sm text-zinc-500">Belum ada scene — impor naskah dulu.</div>
      ) : (
        <div className="p-3.5">
          <Tabs defaultValue="teks" className="flex flex-col">
            <TabsList className="grid h-auto w-full grid-cols-5 bg-zinc-900 p-1">
              <TabsTrigger value="scene" className="px-1 text-[11px]">Scene</TabsTrigger>
              <TabsTrigger value="teks" className="px-1 text-[11px]">Teks</TabsTrigger>
              <TabsTrigger value="latar" className="px-1 text-[11px]">Latar</TabsTrigger>
              <TabsTrigger value="kartu" className="px-1 text-[11px]">Kartu</TabsTrigger>
              <TabsTrigger value="aset" className="px-1 text-[11px]">Aset</TabsTrigger>
            </TabsList>

            {/* ── SCENE: identitas, durasi, mood, transisi ke scene berikutnya ── */}
            <TabsContent value="scene" className="space-y-4 pt-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300">
                    Scene {index + 1} / {scenes.length}
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                    {fmtDurasi(scene.durasi)}s · {scene.mood}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">
                  Proyek: {scenes.length} scene · {fmtDurasi(totalDurasi(scenes))}s total
                </p>
              </div>

              <div>
                <Label className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-zinc-400">
                  Durasi scene
                  <span className="font-mono text-xs text-violet-300">{fmtDurasi(sliderDurasi ?? scene.durasi)}s</span>
                </Label>
                <Slider
                  min={2} max={15} step={0.5}
                  value={[sliderDurasi ?? scene.durasi]}
                  onValueChange={(v) => setSliderDurasi(v[0])}
                  onValueCommit={(v) => { aturDurasi(scene.id, v[0]); setSliderDurasi(null) }}
                  className="accent-violet-500"
                  aria-label="Durasi scene"
                />
                <p className="mt-1 text-[10px] text-zinc-500">2-15 detik · langkah 0,5 — sama juga bisa lewat tarik tepi kanan blok di timeline.</p>
              </div>

              <div>
                <Label className={label}>Mood</Label>
                <Select value={scene.mood} onValueChange={(v) => perbaruiScene(scene.id, { mood: v })}>
                  <SelectTrigger className="h-8 border-zinc-700 bg-zinc-950 text-xs" aria-label="Mood">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className={kartuTab}>
                <BarisAssign label="Transisi →" jenis="transisi" nilai={scene.transisi}
                  onPilih={(n) => terapkanTransisi(n, scene.id)} onSemua={(n) => terapkanTransisiSemua(n)} />
                <p className="pt-1 text-[10px] leading-relaxed text-zinc-500">Transisi mengatur pergantian dari scene ini ke scene berikutnya.</p>
              </div>
            </TabsContent>

            {/* ── TEKS: isi, naskah, animasi masuk/keluar, gaya ── */}
            <TabsContent value="teks" className="space-y-4 pt-3">
              <div className="space-y-2">
                <div>
                  <Label className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-400">
                    <Type className="h-3 w-3" /> Teks di layar
                  </Label>
                  <Input
                    value={scene.teks}
                    onChange={(e) => perbaruiScene(scene.id, { teks: e.target.value }, false)}
                    onFocus={rekamRiwayat}
                    placeholder="maks 8 kata"
                    className="h-8 border-zinc-700 bg-zinc-950 text-xs focus-visible:border-violet-500"
                  />
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Penanda: <span className="font-mono text-zinc-400">**tebal**</span> dan <span className="font-mono text-zinc-400">*miring*</span> — kata muncul bergaya di pratinjau.
                  </p>
                </div>
                <div>
                  <Label className={label}>Naskah (dibacakan) · {kata} kata ≈ {estBicara}s bicara</Label>
                  <textarea
                    value={scene.naskah}
                    onChange={(e) => perbaruiScene(scene.id, { naskah: e.target.value }, false)}
                    onFocus={rekamRiwayat}
                    rows={3}
                    className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-200 outline-none focus:border-violet-500"
                    placeholder="Kalimat yang dibacakan suara AI…"
                  />
                </div>
              </div>
              <div className={kartuTab}>
                <BarisAssign label="Anim. Masuk" jenis="in" nilai={scene.animIn}
                  onPilih={(n) => terapkanAnimasi('in', n, scene.id)} onSemua={(n) => terapkanAnimasi('in', n, 'all')} />
                <BarisAssign label="Anim. Keluar" jenis="out" nilai={scene.animOut}
                  onPilih={(n) => terapkanAnimasi('out', n, scene.id)} onSemua={(n) => terapkanAnimasi('out', n, 'all')} />
                <BarisAssign label="Gaya Teks" jenis="style" nilai={scene.style}
                  onPilih={(n) => terapkanStyle(n, scene.id)} onSemua={(n) => terapkanStyle(n, 'all')} />
              </div>
            </TabsContent>

            {/* ── LATAR: tema, efek overlay, animasi masuk/keluar & loop ── */}
            <TabsContent value="latar" className="space-y-4 pt-3">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-wide text-zinc-400">Latar belakang</Label>
                  <button onClick={() => terapkanLatar(scene.latarPreset, 'all')} className="text-[10px] text-zinc-400 hover:text-violet-300" title="Terapkan latar ini ke semua scene">
                    → semua
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    onClick={() => perbaruiScene(scene.id, { latarPreset: null })}
                    className={cn(
                      'flex h-8 items-center justify-center rounded-md border bg-gradient-to-br text-[9px] font-bold',
                      kelasLatar(null, scene.mood),
                      scene.latarPreset === null ? 'border-violet-400 ring-1 ring-violet-400/70 text-white' : 'border-zinc-700 text-zinc-700 hover:text-zinc-500',
                    )}
                    title="Otomatis — gradien mengikuti mood scene"
                  >
                    Auto
                  </button>
                  {LATAR_PRESET.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => perbaruiScene(scene.id, { latarPreset: l.id })}
                      className={cn(
                        'h-8 rounded-md border bg-gradient-to-br transition',
                        l.kelas,
                        scene.latarPreset === l.id ? 'border-violet-400 ring-1 ring-violet-400/70' : 'border-zinc-700 hover:border-zinc-500',
                      )}
                      style={l.tekstur === 'grid' ? { backgroundImage: 'radial-gradient(rgba(24,24,27,0.22) 1px, transparent 1.3px)', backgroundSize: '8px 8px' } : undefined}
                      title={`${l.nama} (stok: ${l.kataKunciEn})`}
                      aria-label={`Latar ${l.nama}`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">Gradien dulu — di app nanti dipakai gambar stok sesuai kata kunci naskah.</p>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-wide text-zinc-400">Overlay efek</Label>
                  <button onClick={() => terapkanOverlay(scene.overlayId, 'all')} className="text-[10px] text-zinc-400 hover:text-violet-300" title="Terapkan overlay ini ke semua scene">
                    → semua
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => perbaruiScene(scene.id, { overlayId: null })}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      scene.overlayId === null ? 'border-violet-400 bg-violet-500/15 text-violet-200' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500',
                    )}
                  >
                    tanpa
                  </button>
                  {OVERLAY_PRESET.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => perbaruiScene(scene.id, { overlayId: o.id })}
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                        scene.overlayId === o.id ? 'border-violet-400 bg-violet-500/15 text-violet-200' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500',
                      )}
                      title={o.deskripsi}
                    >
                      {o.nama}
                    </button>
                  ))}
                </div>
              </div>

              <div className={kartuTab}>
                <BarisAssign label="Anim. Masuk" jenis="in" nilai={scene.animLatar?.in ?? null}
                  onPilih={(n) => setAnim('animLatar', 'in', n)} onSemua={(n) => setAnimSemua('animLatar', 'in', n)} />
                <BarisAssign label="Anim. Keluar" jenis="out" nilai={scene.animLatar?.out ?? null}
                  onPilih={(n) => setAnim('animLatar', 'out', n)} onSemua={(n) => setAnimSemua('animLatar', 'out', n)} />
                <BarisAssign label="Gerak Loop" jenis="loop" nilai={scene.animLoop}
                  onPilih={(n) => terapkanAnimasi('loop', n, scene.id)} onSemua={(n) => terapkanAnimasi('loop', n, 'all')} />
              </div>
            </TabsContent>

            {/* ── KARTU: teks kartu mengambang + animasinya ── */}
            <TabsContent value="kartu" className="space-y-4 pt-3">
              <div>
                <Label className={label}>Judul kartu (mockup)</Label>
                <Input
                  value={scene.kartu ?? ''}
                  onChange={(e) => perbaruiScene(scene.id, { kartu: e.target.value || null }, false)}
                  onFocus={rekamRiwayat}
                  placeholder="mis. ChatGPT — kosong = tanpa kartu"
                  className="h-8 border-zinc-700 bg-zinc-950 text-xs focus-visible:border-violet-500"
                />
                <p className="mt-1 text-[10px] text-zinc-500">Kartu putih melayang miring — pengganti screenshot di video referensi.</p>
              </div>
              <div className={kartuTab}>
                <BarisAssign label="Anim. Masuk" jenis="in" nilai={scene.animKartu?.in ?? null}
                  onPilih={(n) => setAnim('animKartu', 'in', n)} onSemua={(n) => setAnimSemua('animKartu', 'in', n)} />
                <BarisAssign label="Anim. Keluar" jenis="out" nilai={scene.animKartu?.out ?? null}
                  onPilih={(n) => setAnim('animKartu', 'out', n)} onSemua={(n) => setAnimSemua('animKartu', 'out', n)} />
              </div>
            </TabsContent>

            {/* ── ASET: foto/video overlay, masing-masing dengan gaya + animasi ── */}
            <TabsContent value="aset" className="pt-3">
              <AsetPanel scene={scene} />
            </TabsContent>
          </Tabs>

          <p className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-600">
            <Eraser className="h-3 w-3" /> Semua perubahan otomatis tersimpan di browser ini (tanpa database).
          </p>
        </div>
      )}
    </aside>
  )
}
