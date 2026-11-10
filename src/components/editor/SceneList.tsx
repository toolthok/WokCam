'use client'

/* ══════════ Daftar Scene (panel kiri) ══════════
 * Ringkasan vertikal untuk navigasi cepat — editing penuh tetap di timeline & inspector.
 * Klik = pilih + playhead melompat ke scene; tombol ▲▼ mengurutkan (alternatif drag di HP).
 */

import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react'
import { useEditor } from '@/lib/editor/store'
import { fmtDurasi, gradientMood, totalDurasi } from '@/lib/editor/proyek'
import { cn } from '@/lib/utils'

export function SceneList({ className }: { className?: string }) {
  const scenes = useEditor((s) => s.scenes)
  const selectedId = useEditor((s) => s.selectedId)
  const pilih = useEditor((s) => s.pilih)
  const pindahScene = useEditor((s) => s.pindahScene)
  const duplikatScene = useEditor((s) => s.duplikatScene)
  const hapusScene = useEditor((s) => s.hapusScene)

  return (
    <aside className={cn('flex flex-col overflow-y-auto border-r bg-zinc-950/90 thin-scroll', className)} aria-label="Daftar scene">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-zinc-950/95 px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Scene</span>
        <span className="font-mono text-[10px] text-zinc-500">{fmtDurasi(totalDurasi(scenes))}s</span>
      </div>

      {scenes.map((s, i) => {
        const sel = s.id === selectedId
        return (
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            onClick={() => pilih(s.id, true)}
            onKeyDown={(e) => { if (e.key === 'Enter') pilih(s.id, true) }}
            className={cn(
              'group relative cursor-pointer border-b border-zinc-900/70 px-3 py-2 transition-colors',
              sel ? 'bg-violet-500/10' : 'hover:bg-zinc-900/60',
            )}
          >
            {sel && <span className="absolute inset-y-0 left-0 w-0.5 bg-violet-400" />}
            <div className="flex items-center gap-2">
              <span className={cn('flex h-6 w-8 shrink-0 rounded-md bg-gradient-to-br', gradientMood(s.mood))} title={`mood: ${s.mood}`}>
                <span className="m-auto text-[9px] font-black text-white/90 drop-shadow">{i + 1}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-[11px] font-semibold', sel ? 'text-violet-200' : 'text-zinc-200')}>
                  {s.teks || s.naskah || `(tanpa teks)`}
                </p>
                <p className="truncate text-[9.5px] text-zinc-500">
                  {fmtDurasi(s.durasi)}s · {s.mood}
                  {s.animIn ? ' · masuk' : ''}{s.animLoop ? ' · loop' : ''}{s.animOut ? ' · keluar' : ''}{s.style ? ' · style' : ''}
                  {s.transisi ? ' · ⚡' : ''}
                </p>
              </div>
            </div>
            {/* aksi cepat muncul saat hover / fokus */}
            <div className="absolute right-1.5 top-1 hidden items-center gap-0.5 rounded-md border border-zinc-700 bg-zinc-900/95 p-0.5 group-hover:flex group-focus-within:flex">
              <button
                onClick={(e) => { e.stopPropagation(); pindahScene(i, i - 1) }}
                disabled={i === 0}
                className="rounded p-1 text-zinc-400 hover:text-white disabled:opacity-25"
                title="Naikkan urutan"
                aria-label={`Naikkan scene ${i + 1}`}
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); pindahScene(i, i + 1) }}
                disabled={i === scenes.length - 1}
                className="rounded p-1 text-zinc-400 hover:text-white disabled:opacity-25"
                title="Turunkan urutan"
                aria-label={`Turunkan scene ${i + 1}`}
              >
                <ArrowDown className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); duplikatScene(s.id) }}
                className="rounded p-1 text-zinc-400 hover:text-white"
                title="Duplikat scene"
                aria-label={`Duplikat scene ${i + 1}`}
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); hapusScene(s.id) }}
                disabled={scenes.length <= 1}
                className="rounded p-1 text-zinc-400 hover:text-red-400 disabled:opacity-25"
                title="Hapus scene"
                aria-label={`Hapus scene ${i + 1}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        )
      })}
    </aside>
  )
}
