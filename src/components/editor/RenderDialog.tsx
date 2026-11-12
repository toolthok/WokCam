'use client'

/* ══════════ Render video — dialog + tombol (TopBar) ══════════
 * Render berjalan real-time di perangkat. Hasil bisa diunduh atau dibagikan (Android share sheet).
 */

import { useRef, useState } from 'react'
import { Clapperboard, Download, Share2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/lib/editor/store'
import { dukungRender, renderVideo, type HasilRender } from '@/lib/editor/render-video'

type Fase = 'siap' | 'jalan' | 'selesai' | 'galat'

/* baca durasi yang TERBACA dari berkas (metadata WebM/MP4 hasil rekaman sering tidak lengkap) */
function ukurDurasiFile(url: string): Promise<number> {
  return new Promise((res) => {
    const v = document.createElement('video');
    const selesai = (d: number) => { v.removeAttribute('src'); v.load(); res(d); };
    const t = setTimeout(() => selesai(NaN), 6000);
    v.preload = 'auto'; v.muted = true;
    v.onloadedmetadata = () => {
      if (Number.isFinite(v.duration)) { clearTimeout(t); selesai(v.duration); return; }
      v.currentTime = 1e101; // paksa browser menghitung durasi
      v.ontimeupdate = () => { if (Number.isFinite(v.duration)) { clearTimeout(t); v.ontimeupdate = null; selesai(v.duration); } };
    };
    v.onerror = () => { clearTimeout(t); selesai(NaN); };
    v.src = url;
  });
}

export function TombolRender() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-300" onClick={() => setOpen(true)} title="Render ke video">
        <Clapperboard className="h-3.5 w-3.5 text-violet-300" />
        <span className="hidden md:inline">Render</span>
      </Button>
      <RenderDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function RenderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const judul = useEditor((s) => s.judul)
  const total = useEditor((s) => s.scenes.reduce((a, sc) => a + sc.durasi, 0))
  const [fase, setFase] = useState<Fase>('siap')
  const [persen, setPersen] = useState(0)
  const [galat, setGalat] = useState('')
  const [hasil, setHasil] = useState<(HasilRender & { url: string; durasiFile: number }) | null>(null)
  const sinyal = useRef({ batal: false })

  const mulai = async () => {
    sinyal.current = { batal: false }
    setGalat(''); setPersen(0); setFase('jalan')
    try {
      const h = await renderVideo({ onProgres: (p) => setPersen(p.persen), sinyal: sinyal.current })
      const url = URL.createObjectURL(h.blob)
      const durasiFile = await ukurDurasiFile(url)
      setHasil({ ...h, url, durasiFile })
      setFase('selesai')
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Render gagal.')
      setFase('galat')
    }
  }

  const nama = `${(judul || 'wokcam').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'wokcam'}.${hasil?.ext ?? 'webm'}`

  const bagikan = async () => {
    if (!hasil) return
    const berkas = new File([hasil.blob], nama, { type: hasil.blob.type })
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[]; title?: string }) => Promise<void> }
    if (nav.canShare?.({ files: [berkas] }) && nav.share) {
      await nav.share({ files: [berkas], title: judul || 'Video wokCam' }).catch(() => {})
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) sinyal.current.batal = true; onOpenChange(v) }}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto border-zinc-800 bg-zinc-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Render video</DialogTitle>
          <DialogDescription>
            Membuat berkas video dari proyek ini langsung di perangkatmu. Durasi ±{Math.round(total)} dtk.
          </DialogDescription>
        </DialogHeader>

        {!dukungRender() ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            Browser ini tidak bisa merekam video. Pakai Chrome versi terbaru.
          </p>
        ) : fase === 'siap' || fase === 'galat' ? (
          <div className="space-y-3 text-sm text-zinc-300">
            <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-400">
              <li>Render berjalan sebenar waktu: video 30 dtk ≈ 30 dtk. Biarkan layar menyala.</li>
              <li>Jangan pindah aplikasi atau tutup tab selama render.</li>
              <li>Suara ikut masuk bila penyedia Gemini aktif dan suara scene sudah dibuat.</li>
              <li>Suara bawaan browser tidak ikut dirender.</li>
            </ul>
            {galat && <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{galat}</p>}
            <Button className="w-full bg-violet-600 text-white hover:bg-violet-500" onClick={mulai} disabled={total <= 0}>
              🎬 Mulai render
            </Button>
          </div>
        ) : fase === 'jalan' ? (
          <div className="space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${persen}%` }} />
            </div>
            <p className="text-xs text-zinc-400">Merender… {persen}%</p>
            <Button variant="outline" className="w-full border-zinc-700 text-xs" onClick={() => { sinyal.current.batal = true }}>Batalkan</Button>
          </div>
        ) : (
          hasil && (
            <div className="space-y-3">
              <p className="text-xs text-emerald-300">✓ Selesai — {hasil.ext.toUpperCase()} · {(hasil.blob.size / 1048576).toFixed(1)} MB</p>
              <p className="text-[11px] text-zinc-500">Audio: {hasil.suara}</p>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-400">
                <div>durasi target : {Math.round(total)} dtk</div>
                <div>durasi render : {hasil.detikNyata.toFixed(1)} dtk (waktu nyata)</div>
                <div>frame direkam : {hasil.frames}</div>
                <div>durasi file   : {Number.isFinite(hasil.durasiFile) ? hasil.durasiFile.toFixed(2) + ' dtk' : 'tidak terbaca'}</div>
                {Number.isFinite(hasil.durasiFile) && hasil.durasiFile < total * 0.8 && (
                  <div className="pt-1 text-amber-300">⚠ File lebih pendek dari target. Kirim angka ini ke developer.</div>
                )}
              </div>
              <a href={hasil.url} download={nama} className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-bold text-white">
                <Download className="h-4 w-4" /> Unduh {nama}
              </a>
              <Button variant="outline" className="w-full border-zinc-700 text-xs" onClick={bagikan}>
                <Share2 className="mr-1.5 h-3.5 w-3.5" /> Bagikan (jika didukung)
              </Button>
              <Button variant="ghost" className="w-full text-xs text-zinc-400" onClick={() => setFase('siap')}>Render ulang</Button>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
