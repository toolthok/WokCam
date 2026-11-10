'use client'

/* ══════════ Dialog Impor Naskah ══════════
 * Jalur masuk data ke timeline: tempel naskah berformat === SCENE === (hasil ChatGPT/Claude)
 * atau berkas proyek JSON hasil ekspor app ini. Parser = parseNaskah kontrak (toleran).
 * Mode: GANTI semua scene / TAMBAH di akhir. Tanpa database — langsung ke store proyek.
 */

import { useMemo, useState } from 'react'
import { ClipboardPaste, FileJson, FileUp, Wand2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEditor, NASKAH_TUTORIAL } from '@/lib/editor/store'
import { fmtDurasi } from '@/lib/editor/proyek'
import { parseNaskah } from '@/lib/naskah-parser'
import { cn } from '@/lib/utils'

type HasilPratinjau = { ok: boolean; pesan?: string; error?: string; jumlah?: number; total?: number; peringatan?: number }

async function bacaClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText()
  } catch {
    return null
  }
}

export function ImportNaskahDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const muatNaskah = useEditor((s) => s.muatNaskah)
  const muatProyekJSON = useEditor((s) => s.muatProyekJSON)

  const [teks, setTeks] = useState('')
  const [mode, setMode] = useState<'ganti' | 'tambah'>('ganti')
  const [info, setInfo] = useState('')

  const pratinjau: HasilPratinjau | null = useMemo(() => {
    const rapi = teks.trim()
    if (!rapi) return null
    /* deteksi otomatis: JSON proyek (diawali {) vs naskah berformat */
    if (rapi.startsWith('{')) {
      return { ok: true, pesan: 'Terdeteksi JSON proyek — akan dimuat sebagai proyek (judul, rasio, scene, penugasan).' }
    }
    const hasil = parseNaskah(rapi, null)
    if (hasil.errorGlobal) return { ok: false, error: hasil.errorGlobal }
    if (hasil.scenes.length === 0) return { ok: false, error: 'Tidak ada scene terbaca. Pastikan tiap scene punya label NASKAH:.' }
    const total = hasil.scenes.reduce((a, s) => a + s.durasi, 0)
    const peringatan = hasil.scenes.reduce((a, s) => a + s.catatan.filter((c) => c.tipe === 'peringatan').length, 0)
    return { ok: true, jumlah: hasil.scenes.length, total, peringatan }
  }, [teks])

  const tempel = async () => {
    const t = await bacaClipboard()
    if (t === null) {
      setInfo('Browser menolak akses clipboard — tempel manual di kotak (klik kanan → Tempel).')
      return
    }
    if (!t.trim()) {
      setInfo('Clipboard masih kosong — salin dulu naskah dari ChatGPT.')
      return
    }
    setTeks(t)
    setInfo('')
  }

  const muat = () => {
    const rapi = teks.trim()
    if (!rapi) return
    if (rapi.startsWith('{')) {
      const h = muatProyekJSON(rapi)
      if (!h.ok) {
        setInfo(h.error ?? 'JSON proyek gagal dimuat.')
        return
      }
      setInfo('')
      setTeks('')
      onOpenChange(false)
      return
    }
    const jumlah = muatNaskah(rapi, mode)
    if (!jumlah) {
      setInfo('Naskah tidak menghasilkan scene — cek formatnya.')
      return
    }
    setInfo('')
    setTeks('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto border-zinc-800 bg-zinc-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-4 w-4 text-emerald-400" /> Impor Naskah ke Timeline
          </DialogTitle>
          <DialogDescription>
            Tempel naskah berformat <span className="font-mono text-zinc-300">=== SCENE n ===</span> hasil AI, atau JSON proyek hasil Ekspor. Durasi dijepit otomatis ke 2-15 detik.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <textarea
            id="impor-naskah-area"
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            rows={8}
            placeholder={'=== SCENE 1 ===\nNASKAH: ...\nTEKS: ...\nDURASI: 4\nMOOD: misterius\nLATAR: ... | EN: ...'}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 pb-14 font-mono text-xs text-zinc-200 outline-none focus:border-violet-500"
          />
          <button
            onClick={tempel}
            className="absolute bottom-3 right-3 flex min-h-[36px] items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-xs font-bold text-white shadow-lg shadow-violet-950/60 transition active:scale-95"
          >
            <ClipboardPaste className="h-3.5 w-3.5" /> Tempel dari Clipboard
          </button>
        </div>

        {info && <p className="text-[11px] text-amber-400">{info}</p>}

        {pratinjau && !pratinjau.ok && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-300">{pratinjau.error}</p>
        )}

        {pratinjau?.ok && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-200">
            {pratinjau.jumlah !== undefined ? (
              <>
                <FileJson className="h-3.5 w-3.5" />
                <span className="font-bold">{pratinjau.jumlah}</span> scene terbaca
                <span className="text-emerald-400/70">·</span> total <span className="font-bold">{fmtDurasi(pratinjau.total ?? 0)}s</span>
                {pratinjau.peringatan ? <span className="text-amber-300">· {pratinjau.peringatan} catatan otomatis</span> : null}
              </>
            ) : (
              <>
                <FileJson className="h-3.5 w-3.5" /> {pratinjau.pesan}
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-400">Mode:</span>
          {(['ganti', 'tambah'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition',
                mode === m ? 'border-violet-500/60 bg-violet-500/15 text-violet-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800',
              )}
            >
              {m === 'ganti' ? 'Ganti semua scene' : 'Tambah di akhir'}
            </button>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            className="border-zinc-700 text-xs text-zinc-300"
            onClick={() => { setTeks(NASKAH_TUTORIAL); setInfo('Contoh tutorial diisi — tekan Muat untuk memuat ke timeline.') }}
          >
            <Wand2 className="h-3.5 w-3.5 text-violet-400" /> Isi Contoh Tutorial
          </Button>
          <Button onClick={muat} disabled={!pratinjau?.ok} className="bg-violet-600 text-xs text-white hover:bg-violet-500">
            Muat ke Timeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
