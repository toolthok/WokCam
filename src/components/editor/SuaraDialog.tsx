'use client'

/* ══════════ Suara (TTS) — mesin pemutar + dialog pengaturan ══════════
 * SuaraEngine : mengikuti playhead — tiap pindah scene, naskah scene itu dibacakan.
 * SuaraDialog : pilih suara, kecepatan, nada, tes, dan "Ukur & cocokkan durasi".
 */

import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/lib/editor/store'
import { hitungTiming, sceneIndexDiWaktu } from '@/lib/editor/proyek'
import { adaSuaraIndonesia, durasiDisarankan, sisaTeks, urutkanSuara } from '@/lib/editor/suara-util'
import { ambilSuara, bicara, dukungSuara, henti, teksBacaan, ukurMs, useSuara } from '@/lib/editor/suara'

export function SuaraEngine() {
  useEffect(() => {
    useSuara.getState().hidrasi()
    if (!dukungSuara()) return
    let suara: SpeechSynthesisVoice[] = []
    let aktifKey = ''
    let waktuTerakhir = 0
    ambilSuara().then((v) => { suara = v })

    const cek = () => {
      const { playing, time, scenes } = useEditor.getState()
      const { aktif, voiceURI, rate, pitch } = useSuara.getState()
      if (!playing || !aktif) {
        if (aktifKey) { henti(); aktifKey = '' }
        waktuTerakhir = time
        return
      }
      if (time < waktuTerakhir - 0.5) aktifKey = '' // loncat mundur / ulang dari awal
      waktuTerakhir = time
      const segs = hitungTiming(scenes)
      const i = sceneIndexDiWaktu(segs, time)
      const sc = scenes[i]
      if (!sc || sc.id === aktifKey) return
      aktifKey = sc.id
      bicara(sisaTeks(teksBacaan(sc), time - segs[i].mulai, sc.durasi), { aktif, voiceURI, rate, pitch }, suara)
    }
    const b1 = useEditor.subscribe(cek)
    const b2 = useSuara.subscribe(() => { aktifKey = ''; cek() })
    return () => { b1(); b2(); henti() }
  }, [])
  return null
}

export function TombolSuara({ onClick }: { onClick: () => void }) {
  const aktif = useSuara((s) => s.aktif)
  return (
    <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-300" onClick={onClick} title="Suara pembaca naskah (TTS)">
      <Volume2 className={`h-3.5 w-3.5 ${aktif ? 'text-emerald-400' : 'text-zinc-500'}`} />
      <span className="hidden md:inline">Suara</span>
    </Button>
  )
}

export function SuaraDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const s = useSuara()
  const scenes = useEditor((st) => st.scenes)
  const selectedId = useEditor((st) => st.selectedId)
  const [daftar, setDaftar] = useState<SpeechSynthesisVoice[]>([])
  const [ukur, setUkur] = useState<{ i: number } | null>(null)
  const [hasil, setHasil] = useState<Record<string, number>>({})
  const batal = useRef(false)

  useEffect(() => {
    if (!open || !dukungSuara()) return
    ambilSuara().then((v) => setDaftar(urutkanSuara(v)))
  }, [open])

  const pengaturan = { aktif: s.aktif, voiceURI: s.voiceURI, rate: s.rate, pitch: s.pitch }
  const adaId = adaSuaraIndonesia(daftar)

  const tes = () => {
    const sc = scenes.find((x) => x.id === selectedId) ?? scenes[0]
    bicara(sc ? teksBacaan(sc) : 'Halo, ini suara pembaca naskah wokCam.', pengaturan, daftar)
  }

  const ukurSemua = async () => {
    henti(); batal.current = false; setHasil({})
    const out: Record<string, number> = {}
    for (let i = 0; i < scenes.length; i++) {
      if (batal.current) break
      setUkur({ i })
      const ms = await ukurMs(teksBacaan(scenes[i]), pengaturan, daftar)
      if (ms > 0) out[scenes[i].id] = ms
    }
    setHasil(out); setUkur(null)
  }

  const terapkan = () => {
    const st = useEditor.getState()
    st.rekamRiwayat()
    for (const sc of st.scenes) if (hasil[sc.id]) st.perbaruiScene(sc.id, { durasi: durasiDisarankan(hasil[sc.id]) }, false)
    setHasil({})
  }

  const kartu = 'rounded-lg border border-zinc-800 bg-zinc-950 p-3'
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { batal.current = true; henti() } onOpenChange(v) }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto border-zinc-800 bg-zinc-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Suara Pembaca Naskah (TTS)</DialogTitle>
          <DialogDescription>
            Memakai suara bawaan perangkat — gratis, tanpa key. Naskah scene dibacakan mengikuti playhead saat ▶ Putar.
            Suara ini tidak ikut terekam di berkas video (khusus pratinjau); rekam layar tetap menangkap suara perangkat bila diizinkan.
          </DialogDescription>
        </DialogHeader>

        {!dukungSuara() ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">Browser ini tidak mendukung Web Speech API. Coba Chrome.</p>
        ) : (
          <div className="space-y-3 text-sm text-zinc-200">
            <label className={`${kartu} flex min-h-[44px] items-center gap-3`}>
              <input type="checkbox" className="h-5 w-5 accent-violet-500" checked={s.aktif} onChange={(e) => s.ubah({ aktif: e.target.checked })} />
              Bacakan naskah saat memutar
            </label>

            <div className={kartu}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Suara</label>
              <select className="min-h-[44px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm" value={s.voiceURI} onChange={(e) => s.ubah({ voiceURI: e.target.value })}>
                <option value="">Otomatis (Bahasa Indonesia)</option>
                {daftar.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
              </select>
              {!adaId && daftar.length > 0 && (
                <p className="mt-2 text-[11px] text-amber-300">Belum ada suara Bahasa Indonesia. Android: Pengaturan → Sistem → Bahasa → Text-to-speech → pasang data suara “Indonesia”.</p>
              )}
            </div>

            <div className={kartu}>
              <label className="flex items-center justify-between text-xs text-zinc-400">Kecepatan <span className="font-mono text-zinc-300">{s.rate.toFixed(2)}×</span></label>
              <input type="range" min={0.6} max={1.6} step={0.05} value={s.rate} onChange={(e) => s.ubah({ rate: +e.target.value })} className="h-8 w-full accent-violet-500" />
              <label className="flex items-center justify-between text-xs text-zinc-400">Nada <span className="font-mono text-zinc-300">{s.pitch.toFixed(2)}</span></label>
              <input type="range" min={0.5} max={1.5} step={0.05} value={s.pitch} onChange={(e) => s.ubah({ pitch: +e.target.value })} className="h-8 w-full accent-violet-500" />
              <Button variant="outline" className="mt-2 w-full border-zinc-700 text-xs text-zinc-200" onClick={tes}>🔊 Tes dengan scene terpilih</Button>
            </div>

            <div className={kartu}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Cocokkan durasi dengan suara</p>
              <p className="mb-2 text-[11px] leading-relaxed text-zinc-500">
                Membacakan tiap scene diam-diam (volume 0) untuk mengukur lama bicara nyata, lalu menyarankan durasi scene.
                Di sebagian perangkat suara tetap terdengar saat mengukur.
              </p>
              {ukur ? (
                <Button variant="outline" className="w-full border-zinc-700 text-xs" onClick={() => { batal.current = true; henti() }}>Batal · mengukur {ukur.i + 1}/{scenes.length}…</Button>
              ) : (
                <Button className="w-full bg-violet-600 text-xs text-white hover:bg-violet-500" onClick={ukurSemua} disabled={!scenes.length}>📏 Ukur semua scene</Button>
              )}
              {Object.keys(hasil).length > 0 && (
                <>
                  <div className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded border border-zinc-800 p-2 font-mono text-[11px]">
                    {scenes.map((sc, i) => hasil[sc.id] ? (
                      <div key={sc.id} className="flex justify-between gap-2">
                        <span className="text-zinc-400">#{i + 1}</span>
                        <span>suara {(hasil[sc.id] / 1000).toFixed(1)}s</span>
                        <span className="text-zinc-500">{sc.durasi}s →</span>
                        <span className={hasil[sc.id] / 1000 + 0.4 > 15 ? 'text-red-400' : 'text-emerald-300'}>{durasiDisarankan(hasil[sc.id])}s</span>
                      </div>
                    ) : null)}
                  </div>
                  <Button className="mt-2 w-full bg-emerald-600 text-xs text-white hover:bg-emerald-500" onClick={terapkan}>✓ Terapkan durasi (bisa di-Undo)</Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
