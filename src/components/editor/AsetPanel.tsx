'use client'

/* ══════════ Panel aset overlay di Inspector ══════════
 * Tambah foto/video (boleh banyak sekaligus), atur posisi/lebar/transparansi/waktu tampil, hapus.
 * Semua aset hanya berlaku untuk scene ini.
 */

import { useRef, useState } from 'react'
import { Film, ImagePlus, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useEditor } from '@/lib/editor/store'
import type { AsetOverlay, SceneProyek } from '@/lib/editor/proyek'
import { hapusBerkasAset, kecilkanGambar, simpanBerkasAset } from '@/lib/editor/aset-store'

const MAKS_VIDEO = 80 * 1024 * 1024

function idBaruAset(): string {
  return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function Rentang({ label, nilai, min, max, step, format, onMulai, onUbah }: {
  label: string; nilai: number; min: number; max: number; step: number
  format: (n: number) => string; onMulai: () => void; onUbah: (n: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-zinc-400">
        <span>{label}</span><span className="font-mono text-zinc-300">{format(nilai)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={nilai}
        onPointerDown={onMulai} onChange={(e) => onUbah(+e.target.value)}
        className="h-7 w-full accent-violet-500"
      />
    </div>
  )
}

export function AsetPanel({ scene }: { scene: SceneProyek }) {
  const perbaruiScene = useEditor((s) => s.perbaruiScene)
  const rekamRiwayat = useEditor((s) => s.rekamRiwayat)
  const input = useRef<HTMLInputElement>(null)
  const [pesan, setPesan] = useState('')
  const [busy, setBusy] = useState(false)
  const aset = scene.aset ?? []

  const set = (daftar: AsetOverlay[]) => perbaruiScene(scene.id, { aset: daftar }, false)
  const ubah = (id: string, patch: Partial<AsetOverlay>) =>
    set(aset.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  const tambah = async (files: FileList) => {
    setBusy(true); setPesan('')
    rekamRiwayat()
    const baru: AsetOverlay[] = []
    const gagal: string[] = []
    for (const f of Array.from(files)) {
      const tipe = f.type.startsWith('video/') ? 'video' : f.type.startsWith('image/') ? 'gambar' : null
      if (!tipe) { gagal.push(`${f.name} (bukan foto/video)`); continue }
      if (tipe === 'video' && f.size > MAKS_VIDEO) { gagal.push(`${f.name} (>80 MB, pangkas dulu)`); continue }
      const id = idBaruAset()
      const blob = tipe === 'gambar' ? await kecilkanGambar(f) : f
      if (!(await simpanBerkasAset(id, blob))) { gagal.push(`${f.name} (penyimpanan penuh)`); continue }
      baru.push({
        id, tipe, nama: f.name, x: 50, y: 50,
        lebar: tipe === 'video' ? 70 : 45, opacity: 1, mulai: 0, durasi: 0,
      })
    }
    if (baru.length) set([...aset, ...baru])
    if (gagal.length) setPesan('Dilewati: ' + gagal.join(', '))
    setBusy(false)
  }

  const hapus = (id: string) => {
    rekamRiwayat()
    set(aset.filter((a) => a.id !== id))
    void hapusBerkasAset(id)
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-zinc-400">Aset overlay (foto / video)</span>
        <span className="text-[10px] text-zinc-500">{aset.length} aset</span>
      </div>
      <button
        onClick={() => input.current?.click()} disabled={busy}
        className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-700 text-xs text-zinc-200 active:opacity-80 disabled:opacity-40"
      >
        <ImagePlus className="h-4 w-4" /> {busy ? 'Menyimpan…' : 'Tambah foto / video'}
      </button>
      <input
        ref={input} type="file" accept="image/*,video/*" multiple hidden
        onChange={(e) => { if (e.target.files?.length) void tambah(e.target.files); e.target.value = '' }}
      />
      {pesan && <p className="mt-1 text-[10px] text-amber-300">{pesan}</p>}

      <div className="mt-2 space-y-2">
        {aset.map((a) => (
          <div key={a.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-2">
            <div className="mb-1 flex items-center gap-2">
              {a.tipe === 'video' ? <Film className="h-3.5 w-3.5 text-fuchsia-300" /> : <ImageIcon className="h-3.5 w-3.5 text-sky-300" />}
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-200" title={a.nama}>{a.nama || (a.tipe === 'video' ? 'Video' : 'Foto')}</span>
              <button onClick={() => hapus(a.id)} className="rounded p-1 text-zinc-500 hover:text-red-400" aria-label="Hapus aset">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-3">
              <Rentang label="Posisi X" nilai={a.x} min={0} max={100} step={1} format={(n) => `${n}%`}
                onMulai={rekamRiwayat} onUbah={(n) => ubah(a.id, { x: n })} />
              <Rentang label="Posisi Y" nilai={a.y} min={0} max={100} step={1} format={(n) => `${n}%`}
                onMulai={rekamRiwayat} onUbah={(n) => ubah(a.id, { y: n })} />
              <Rentang label="Lebar" nilai={a.lebar} min={5} max={100} step={1} format={(n) => `${n}%`}
                onMulai={rekamRiwayat} onUbah={(n) => ubah(a.id, { lebar: n })} />
              <Rentang label="Transparansi" nilai={Math.round(a.opacity * 100)} min={0} max={100} step={5} format={(n) => `${n}%`}
                onMulai={rekamRiwayat} onUbah={(n) => ubah(a.id, { opacity: n / 100 })} />
              <Rentang label="Muncul di detik ke-" nilai={a.mulai} min={0} max={Math.max(0, scene.durasi - 0.5)} step={0.5}
                format={(n) => `${n.toFixed(1)}s`} onMulai={rekamRiwayat} onUbah={(n) => ubah(a.id, { mulai: n })} />
              <Rentang label="Tampil (0 = sampai habis)" nilai={a.durasi} min={0} max={15} step={0.5}
                format={(n) => (n === 0 ? 'sampai akhir' : `${n.toFixed(1)}s`)} onMulai={rekamRiwayat} onUbah={(n) => ubah(a.id, { durasi: n })} />
            </div>
          </div>
        ))}
      </div>
      {aset.length > 0 && (
        <p className="mt-1 text-[10px] text-zinc-500">Video overlay selalu tanpa suara dan mengikuti playhead.</p>
      )}
    </div>
  )
}
