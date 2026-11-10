'use client'

import { ArrowRight, CheckCircle2, ListOrdered, MinusCircle, PlusCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ALT_TOOLS, FREE_STACK, TOOLS } from '@/lib/editor/model'

const FLOW_STEPS = [
  'Buat naskah di AI chat favorit (ChatGPT / Gemini / Claude) — minta kalimat pendek per baris.',
  'Catat naskah & link aset ke Google Sheets — 1 tab per video (lihat panel “Database”).',
  'Kumpulkan visual gratis dari Pexels/Pixabay, voice-over gratis dari TTSMaker/CapCut.',
  'Tempel naskah ke editor ini lewat tombol “Impor Naskah AI” → otomatis jadi scene.',
  'Pakai Koleksi Animasi biar gerakan antar scene konsisten & cepat diatur.',
  'Export 1080p → upload ke TikTok / Reels / Shorts → update kolom status di Sheets.',
]

const COST_ROWS: [string, string][] = [
  ['Naskah', 'AI chat gratis (ChatGPT/Gemini free)'],
  ['Database', 'Google Sheets — gratis'],
  ['Visual', 'Pexels / Pixabay / Mixkit — gratis'],
  ['Voice-over', 'TTSMaker / CapCut TTS — gratis'],
  ['Musik & SFX', 'YouTube Audio Library / Pixabay — gratis'],
  ['Gambar AI', 'Bing Image Creator / Leonardo free — gratis'],
  ['Editing & render', 'Editor ini + CapCut desktop — gratis'],
]

export function ToolGuidePanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-md thin-scroll">
        <SheetHeader className="pb-1">
          <SheetTitle className="text-zinc-100">Alur Kerja Rp0 — Faceless Video Gratis</SheetTitle>
          <SheetDescription className="text-zinc-500">
            Semua tahap bisa dikerjakan tanpa keluar biaya · cek ulang kuota free tier sebelum rilis rutin
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-4 pb-10">
          {/* rincian biaya Rp0 */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-200">Biaya tahap awal: Rp0</p>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[9px] text-emerald-300">
                Gratis semua
              </Badge>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {COST_ROWS.map(([k, v]) => (
                <div key={k} className="flex items-start gap-2 text-[11px]">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  <span className="w-[104px] shrink-0 font-medium text-emerald-100/90">{k}</span>
                  <span className="flex-1 text-emerald-100/60">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* stack gratis */}
          {FREE_STACK.map((t) => (
            <div key={t.name} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-zinc-100">
                  {t.name} <span className="text-[11px] font-normal text-violet-400">{t.url}</span>
                </span>
                <Badge variant="outline" className="shrink-0 border-violet-500/40 bg-violet-500/10 text-[9px] text-violet-300">
                  {t.badge}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">{t.tagline}</p>

              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-zinc-800/60 p-2 text-[11px] text-zinc-300">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>
                  <span className="font-medium">Paling cocok:</span> {t.bestFor}
                </span>
              </div>

              <p className="mt-2 text-[11px] font-medium text-emerald-300">{t.price}</p>

              <ul className="mt-2 space-y-1">
                {t.pros.map((p) => (
                  <li key={p} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                    <PlusCircle className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500/80" />
                    {p}
                  </li>
                ))}
                {t.cons.map((c) => (
                  <li key={c} className="flex items-start gap-1.5 text-[11px] text-zinc-500">
                    <MinusCircle className="mt-0.5 h-3 w-3 shrink-0 text-zinc-600" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* alur kerja */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <p className="flex items-center gap-1.5 text-sm font-bold text-zinc-100">
              <ListOrdered className="h-4 w-4 text-violet-400" /> Alur kerja yang disarankan
            </p>
            <ol className="mt-2.5 space-y-2">
              {FLOW_STEPS.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-400">
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-300">
                    {i + 1}
                  </span>
                  <span className="flex-1">{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-md bg-violet-500/10 p-2.5 text-[11px] leading-relaxed text-violet-200/90">
              <span className="font-semibold">Catatan:</span> Editor ini versi <span className="font-semibold">self-build</span> — kalau
              nanti dirilis, pipeline (TTS API + stok Pexels + render FFmpeg/Remotion) tetap jauh lebih murah daripada
              langganan SaaS bulanan.
            </p>
          </div>

          {/* opsi berbayar nanti */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-100">Nanti kalau sudah monetisasi</p>
              <Badge variant="outline" className="shrink-0 border-zinc-700 text-[9px] font-normal text-zinc-400">
                Opsional
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Simpan dulu — SaaS di bawah mempercepat produksi, tapi tidak wajib di tahap awal:
            </p>
            <div className="mt-2.5 space-y-2.5">
              {TOOLS.map((t) => (
                <div key={t.name} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-200">
                      {t.name} <span className="text-[10px] font-normal text-zinc-500">{t.url}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-medium text-amber-300/90">{t.price.split('·')[0]}</span>
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-zinc-400">{t.tagline}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <p className="text-sm font-bold text-zinc-100">Alternatif lain</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ALT_TOOLS.map((a) => (
                <span key={a} className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[10px] text-zinc-300">
                  {a}
                </span>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1 text-[10px] text-zinc-600">
              <ArrowRight className="h-3 w-3" />
              Sumber: situs resmi masing-masing tool (Sep 2026) — kuota free tier bisa berubah, cek situs resmi.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
