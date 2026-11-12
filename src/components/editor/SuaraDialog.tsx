'use client'

/* ══════════ Suara (TTS) — mesin pemutar + dialog pengaturan ══════════
 * SuaraEngine : mengikuti playhead — tiap pindah scene, narasi scene itu diputar
 *               (browser TTS atau audio Gemini yang sudah dibuat). Playhead ditahan oleh page.tsx
 *               selama narasi berjalan (lihat batasTahan) → suara tidak terpotong.
 * SuaraDialog : penyedia suara, pengaturan, buat suara Gemini per scene, cocokkan durasi.
 */

import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/lib/editor/store'
import { hitungTiming, sceneIndexDiWaktu } from '@/lib/editor/proyek'
import { adaSuaraIndonesia, durasiDisarankan, sisaTeks, urutkanSuara } from '@/lib/editor/suara-util'
import { SUARA_GEMINI } from '@/lib/editor/suara-audio'
import { dariMem, muatDariCache, sintesisScene } from '@/lib/editor/suara-gemini'
import {
  ambilSuara, bicara, dukungSuara, henti, kunciScene, mainkanAudio, teksBacaan, ukurMs, useSuara,
  GAYA_BAWAAN, MODEL_GEMINI_BAWAAN,
} from '@/lib/editor/suara'

export function SuaraEngine() {
  useEffect(() => {
    useSuara.getState().hidrasi()
    let suara: SpeechSynthesisVoice[] = []
    let aktifKey = ''
    let waktuTerakhir = 0
    if (dukungSuara()) ambilSuara().then((v) => { suara = v })

    /* muat audio Gemini yang sudah tersimpan (IndexedDB) ke memori agar bisa diputar seketika */
    let timerCache: ReturnType<typeof setTimeout> | undefined
    const siapkanCache = () => {
      clearTimeout(timerCache)
      timerCache = setTimeout(() => {
        const p = useSuara.getState()
        if (p.provider !== 'gemini') return
        for (const sc of useEditor.getState().scenes) { const k = kunciScene(sc, p); if (!dariMem(k)) void muatDariCache(k) }
      }, 300)
    }

    const cek = () => {
      const { playing, time, scenes } = useEditor.getState()
      const p = useSuara.getState()
      if (!playing || !p.aktif) {
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
      const offset = time - segs[i].mulai
      if (p.provider === 'gemini') {
        const e = dariMem(kunciScene(sc, p))
        if (e) mainkanAudio(e.url, offset, sc.id)
        else henti() // suara scene ini belum dibuat → diam (lihat dialog Suara)
      } else {
        bicara(sisaTeks(teksBacaan(sc), offset, sc.durasi), p, suara, sc.id)
      }
    }

    let sceneLama = useEditor.getState().scenes
    const b1 = useEditor.subscribe((st) => { if (st.scenes !== sceneLama) { sceneLama = st.scenes; siapkanCache() } cek() })
    const b2 = useSuara.subscribe(() => { aktifKey = ''; siapkanCache(); cek() })
    siapkanCache()
    return () => { b1(); b2(); clearTimeout(timerCache); henti() }
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

const kartu = 'rounded-lg border border-zinc-800 bg-zinc-950 p-3'
const inputCls = 'min-h-[44px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100'
const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400'

export function SuaraDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const s = useSuara()
  const scenes = useEditor((st) => st.scenes)
  const selectedId = useEditor((st) => st.selectedId)
  const [daftar, setDaftar] = useState<SpeechSynthesisVoice[]>([])
  const [proses, setProses] = useState<{ i: number; tunggu: number } | null>(null)
  const [hasil, setHasil] = useState<Record<string, number>>({})
  const [galat, setGalat] = useState('')
  const [versi, setVersi] = useState(0)
  const [lihatKey, setLihatKey] = useState(false)
  const sinyal = useRef({ batal: false })

  useEffect(() => {
    if (!open) return
    if (dukungSuara()) ambilSuara().then((v) => setDaftar(urutkanSuara(v)))
    if (useSuara.getState().provider === 'gemini') {
      Promise.all(scenes.map((sc) => muatDariCache(kunciScene(sc, useSuara.getState())))).then(() => setVersi((x) => x + 1))
    }
  }, [open, scenes, s.provider, s.gVoice, s.gModel, s.gGaya])

  const gemini = s.provider === 'gemini'
  const siap = scenes.filter((sc) => dariMem(kunciScene(sc, s))).length
  const adaId = adaSuaraIndonesia(daftar)
  void versi

  const tes = () => {
    const sc = scenes.find((x) => x.id === selectedId) ?? scenes[0]
    if (gemini) {
      const e = sc && dariMem(kunciScene(sc, s))
      if (e) mainkanAudio(e.url, 0, sc.id)
      else setGalat('Suara scene ini belum dibuat — tekan “Buat suara semua scene”.')
      return
    }
    bicara(sc ? teksBacaan(sc) : 'Halo, ini suara pembaca naskah wokCam.', s, daftar, sc?.id ?? '')
  }

  const henti2 = () => { sinyal.current.batal = true; henti() }

  const buatSemua = async () => {
    if (!s.gKey.trim()) { setGalat('Isi API key Gemini dulu.'); return }
    henti(); sinyal.current = { batal: false }; setGalat(''); setHasil({})
    const out: Record<string, number> = {}
    const opsi = { kunciApi: s.gKey, model: s.gModel, voice: s.gVoice, gaya: s.gGaya }
    for (let i = 0; i < scenes.length; i++) {
      if (sinyal.current.batal) break
      const sc = scenes[i]
      const teks = teksBacaan(sc)
      if (!teks) continue
      setProses({ i, tunggu: 0 })
      const k = kunciScene(sc, s)
      try {
        const e = dariMem(k) ?? (await muatDariCache(k)) ?? (await sintesisScene(opsi, teks, k, { sinyal: sinyal.current, onTunggu: (d) => setProses({ i, tunggu: d }) }))
        out[sc.id] = e.durMs
        setVersi((x) => x + 1)
      } catch (err) {
        setGalat(`Scene ${i + 1}: ${err instanceof Error ? err.message : 'gagal'}`)
        break
      }
    }
    setHasil(out); setProses(null)
  }

  const ukurSemua = async () => {
    henti(); sinyal.current = { batal: false }; setHasil({}); setGalat('')
    const out: Record<string, number> = {}
    for (let i = 0; i < scenes.length; i++) {
      if (sinyal.current.batal) break
      setProses({ i, tunggu: 0 })
      const ms = await ukurMs(teksBacaan(scenes[i]), s, daftar)
      if (ms > 0) out[scenes[i].id] = ms
    }
    setHasil(out); setProses(null)
  }

  const terapkan = () => {
    const st = useEditor.getState()
    st.rekamRiwayat()
    for (const sc of st.scenes) if (hasil[sc.id]) st.perbaruiScene(sc.id, { durasi: durasiDisarankan(hasil[sc.id]) }, false)
    setHasil({})
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) henti2(); onOpenChange(v) }}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto border-zinc-800 bg-zinc-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Suara Pembaca Naskah (TTS)</DialogTitle>
          <DialogDescription>
            Naskah tiap scene dibacakan saat ▶ Putar. Bila suara belum selesai di akhir scene, playhead menunggu — suara tidak lagi terpotong.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-zinc-200">
          <label className={`${kartu} flex min-h-[44px] items-center gap-3`}>
            <input type="checkbox" className="h-5 w-5 accent-violet-500" checked={s.aktif} onChange={(e) => s.ubah({ aktif: e.target.checked })} />
            Bacakan naskah saat memutar
          </label>
          <label className={`${kartu} flex min-h-[44px] items-center gap-3`}>
            <input type="checkbox" className="h-5 w-5 accent-violet-500" checked={s.tahan} onChange={(e) => s.ubah({ tahan: e.target.checked })} />
            <span>Tahan scene sampai suara selesai <span className="block text-[11px] text-zinc-500">Matikan bila ingin scene selalu persis sesuai durasi.</span></span>
          </label>

          <div className={kartu}>
            <label className={labelCls}>Penyedia suara</label>
            <div className="grid grid-cols-2 gap-2">
              {([['browser', 'Browser (gratis, Chrome)'], ['gemini', 'Gemini (semua browser)']] as const).map(([k, label]) => (
                <button key={k} onClick={() => s.ubah({ provider: k })}
                  className={`min-h-[44px] rounded-lg px-2 text-xs font-bold ${s.provider === k ? 'bg-violet-600 text-white' : 'border border-zinc-700 text-zinc-400'}`}>{label}</button>
              ))}
            </div>
          </div>

          {!gemini && (
            !dukungSuara() ? (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">Browser ini tidak mendukung suara bawaan. Pakai Chrome, atau pilih penyedia Gemini.</p>
            ) : (
              <>
                <div className={kartu}>
                  <label className={labelCls}>Suara</label>
                  <select className={inputCls} value={s.voiceURI} onChange={(e) => s.ubah({ voiceURI: e.target.value })}>
                    <option value="">Otomatis (Bahasa Indonesia)</option>
                    {daftar.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
                  </select>
                  {daftar.length === 0 && <p className="mt-2 text-[11px] text-amber-300">Browser ini tidak menyediakan suara. Pakai Chrome atau pilih Gemini.</p>}
                  {daftar.length > 0 && !adaId && <p className="mt-2 text-[11px] text-amber-300">Belum ada suara Bahasa Indonesia. Android: Pengaturan → Text-to-speech → pasang data suara “Indonesia”.</p>}
                </div>
                <div className={kartu}>
                  <label className="flex items-center justify-between text-xs text-zinc-400">Kecepatan <span className="font-mono text-zinc-300">{s.rate.toFixed(2)}×</span></label>
                  <input type="range" min={0.6} max={1.6} step={0.05} value={s.rate} onChange={(e) => s.ubah({ rate: +e.target.value })} className="h-8 w-full accent-violet-500" />
                  <label className="flex items-center justify-between text-xs text-zinc-400">Nada <span className="font-mono text-zinc-300">{s.pitch.toFixed(2)}</span></label>
                  <input type="range" min={0.5} max={1.5} step={0.05} value={s.pitch} onChange={(e) => s.ubah({ pitch: +e.target.value })} className="h-8 w-full accent-violet-500" />
                </div>
              </>
            )
          )}

          {gemini && (
            <div className={kartu}>
              <label className={labelCls}>API key Gemini</label>
              <div className="flex gap-2">
                <input type={lihatKey ? 'text' : 'password'} className={inputCls} value={s.gKey} autoComplete="off" spellCheck={false}
                  placeholder="tempel key dari aistudio.google.com" onChange={(e) => s.ubah({ gKey: e.target.value })} />
                <Button variant="outline" className="min-h-[44px] border-zinc-700 text-xs" onClick={() => setLihatKey((v) => !v)}>{lihatKey ? 'Sembunyi' : 'Lihat'}</Button>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                Key hanya disimpan di perangkat ini dan dikirim langsung ke Google — tidak lewat server lain. Jangan dipakai di perangkat bersama.
                Tier gratis punya batas permintaan per menit/hari: wokCam menunggu otomatis dan tidak membuat ulang scene yang sudah jadi.
              </p>
              <label className={`${labelCls} mt-3`}>Suara</label>
              <select className={inputCls} value={s.gVoice} onChange={(e) => s.ubah({ gVoice: e.target.value })}>
                {SUARA_GEMINI.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <label className={`${labelCls} mt-3`}>Gaya bicara (opsional)</label>
              <input className={inputCls} value={s.gGaya} onChange={(e) => s.ubah({ gGaya: e.target.value })} placeholder={GAYA_BAWAAN} />
              <label className={`${labelCls} mt-3`}>Model</label>
              <input className={inputCls} value={s.gModel} onChange={(e) => s.ubah({ gModel: e.target.value })} placeholder={MODEL_GEMINI_BAWAAN} />
              <p className="mt-1 text-[11px] text-zinc-500">Model preview bisa berubah nama. Alternatif: gemini-2.5-flash-preview-tts.</p>
              <p className="mt-3 text-xs text-zinc-300">Suara siap: <b>{siap}/{scenes.length}</b> scene</p>
              {proses ? (
                <Button variant="outline" className="mt-2 w-full border-zinc-700 text-xs" onClick={henti2}>
                  Batal · scene {proses.i + 1}/{scenes.length}{proses.tunggu > 0 ? ` · menunggu kuota ${proses.tunggu}s` : ' · membuat…'}
                </Button>
              ) : (
                <Button className="mt-2 w-full bg-violet-600 text-xs text-white hover:bg-violet-500" onClick={buatSemua} disabled={!scenes.length}>🎙️ Buat suara semua scene</Button>
              )}
            </div>
          )}

          <Button variant="outline" className="w-full border-zinc-700 text-xs text-zinc-200" onClick={tes}>🔊 Tes dengan scene terpilih</Button>
          {galat && <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{galat}</p>}

          <div className={kartu}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Cocokkan durasi dengan suara</p>
            {gemini ? (
              <p className="mb-2 text-[11px] leading-relaxed text-zinc-500">Setelah “Buat suara”, durasi tiap scene disarankan dari panjang audio sebenarnya (tepat) — tekan Terapkan agar scene pas dengan suaranya.</p>
            ) : (
              <>
                <p className="mb-2 text-[11px] leading-relaxed text-zinc-500">Membacakan tiap scene diam-diam (volume 0) untuk mengukur lama bicara; di sebagian perangkat suara tetap terdengar.</p>
                {!proses && <Button className="w-full bg-violet-600 text-xs text-white hover:bg-violet-500" onClick={ukurSemua} disabled={!scenes.length || !dukungSuara()}>📏 Ukur semua scene</Button>}
                {proses && <Button variant="outline" className="w-full border-zinc-700 text-xs" onClick={henti2}>Batal · mengukur {proses.i + 1}/{scenes.length}…</Button>}
              </>
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
      </DialogContent>
    </Dialog>
  )
}
