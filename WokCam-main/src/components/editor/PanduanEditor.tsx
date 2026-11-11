'use client'

/* ══════════ Panduan Editor — tur interaktif "cara pakai editing di timeline" ══════════
 * PERTANYAAN YANG DIJAWAB: "aku belum tahu cara pakainya!"
 *   Tur spotlight 10 langkah: elemen UI disorot (dim sekeliling), kartu penjelas
 *   singkat di dekatnya, tombol Lanjut/Kembali. Auto-buka pada kunjungan PERTAMA
 *   (localStorage), dibuka lagi kapan saja lewat tombol "Panduan" di TopBar atau
 *   tombol "Cara pakai" di banner tutorial.
 *   - Target = atribut data-tour="..." pada elemen asli (bukan salinan), jadi tur
 *     tak pernah salah tempat walau layout berubah.
 *   - Tanpa library eksternal: rect diukur via getBoundingClientRect + listener
 *     resize/scroll; supaya gampang direplikasi di Kotlin (Compose overlay).
 */

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

export const KUNCI_PANDUAN = 'wokcam.panduan.selesai.v1'

type Langkah = {
  target?: string
  judul: string
  isi: string
}

const LANGKAH: Langkah[] = [
  {
    target: 'stage',
    judul: 'Selamat datang di editor wokCam',
    isi: 'Inilah panggung pratinjau: hasil susunan scene-mu tampil persis seperti video yang akan direkam. Tur singkat ini (11 langkah) mengajarkan semua cara mengedit — ikuti sampai habis, nanti kamu langsung bisa.',
  },
  {
    target: 'play',
    judul: '1 · Putar untuk pratinjau',
    isi: 'Tekan tombol putar (atau Spasi) untuk menjalankan video. Playhead di timeline ikut bergerak, transisi menyala di pergantian scene. Tekan lagi untuk jeda.',
  },
  {
    target: 'blok-scene',
    judul: '2 · Blok scene di timeline',
    isi: 'Setiap scene = satu blok. Klik blok untuk memilih, seret ke kiri/kanan untuk mengubah urutan. Chip warna di kanan blok = animasi & style yang terpasang.',
  },
  {
    target: 'handle-durasi',
    judul: '3 · Tarik tepi kanan = ubah durasi',
    isi: 'Tarik garis kecil di tepi kanan blok: durasi berubah langkah 0,5 detik (2-15 dtk). Gelembung kuning menampilkan angkanya; scene lain otomatis bergeser.',
  },
  {
    target: 'blok-scene',
    judul: '4 · Klik-dua-kali = edit isi scene',
    isi: 'Klik-dua-kali blok (atau tekan Enter) untuk membuka kartu edit langsung di atasnya: teks di layar, kartu mengambang, naskah suara, durasi, mood, latar, dan overlay. Semua perubahan langsung tersimpan.',
  },
  {
    target: 'chip-transisi',
    judul: '5 · Chip ⚡ = transisi antar scene',
    isi: 'Di sela dua blok ada chip kecil ⚡. Klik untuk memilih efek pergantian (slide, wipe, zoom…) dari Koleksi. Chip hijau = sudah dipasang; ia membesar & menyala saat video melewatinya.',
  },
  {
    target: 'toolbar-anim',
    judul: '6 · Pasang animasi dari Koleksi',
    isi: 'Toolbar timeline: Masuk / Loop / Keluar memasang animasi pada scene terpilih. Daftarnya diambil dari Koleksi Style yang kamu impor dari ChatGPT — klik nama untuk pasang, ikon 👁 untuk pratinjau gerakan.',
  },
  {
    target: 'toolbar-latar',
    judul: '7 · Hias: Latar & Overlay',
    isi: 'Dua tombol hiasan: Latar mengganti latar belakang scene (gradien dulu, gambar stok di app nanti). Overlay menambah efek sinematik di atas video: vinyet, butiran film, bar sinema, bokeh… Coba klik keduanya!',
  },
  {
    target: 'toolbar-style',
    judul: '8 · Style teks + penekanan kata',
    isi: 'Tombol Style mengatur gaya teks: font, ukuran, warna, posisi. Bonus ala video promo viral: di teks pakai **kata** untuk tebal dan *kata* untuk miring — pratinjau langsung menunjukkan penekanannya. Animasi masuk “Kata Muncul Berturut” membuat teks muncul KATA-DEMI-KATA.',
  },
  {
    target: 'inspector-branding',
    judul: '9 · Branding: badge & tanda air',
    isi: 'Di panel kanan bagian atas: Branding proyek. Badge pill tampil di ATAS semua scene, tanda air di bawah — keduanya diam saat scene berganti (persis video referensi: logo pill atas + watermark bawah). Isi sekali, berlaku untuk seluruh video.',
  },
  {
    target: 'inspector',
    judul: '10 · Inspector (panel kanan)',
    isi: 'Panel kanan berisi semua pengaturan scene yang sama — plus kartu mengambang (mockup putih melayang ala screenshot) dan tombol “→ semua” untuk menerapkan ke SELURUH scene sekaligus. Panel kiri: daftar scene untuk navigasi cepat + naik/turunkan urutan.',
  },
  {
    target: 'topbar-impor',
    judul: '11 · Impor naskah, ekspor, dan simpan',
    isi: 'Impor Naskah: tempel hasil ChatGPT → scene terbentuk otomatis. Ekspor: unduh JSON proyek. Tanpa database: proyek tersimpan otomatis di browser ini, Ctrl+Z mengurungkan. Selamat mencoba — proyek tutorial di timeline ini sudah bergaya video referensi: boleh kamu edit bebas!',
  },
]

const PADDING = 8

export function PanduanEditor({ open, onTutup }: { open: boolean; onTutup: () => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const ukur = useCallback(() => {
    const target = LANGKAH[i].target
    if (!target) {
      setRect(null)
      return
    }
    const el = document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null
    if (!el) {
      setRect(null)
      return
    }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    setRect(el.getBoundingClientRect())
  }, [i])

  useLayoutEffect(() => {
    if (open) ukur()
    else setRect(null)
  }, [open, ukur])

  /* ulangi pengukuran saat jendela berubah (resize / scroll di kontainer mana pun) */
  useEffect(() => {
    if (!open) return
    const handler = () => ukur()
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [open, ukur])

  /* mulai dari langkah 0 setiap kali tur dibuka */
  useEffect(() => {
    if (open) setI(0)
  }, [open])

  /* navigasi keyboard */
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if (e.key === 'Escape') onTutup()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') setI((v) => Math.min(v + 1, LANGKAH.length - 1))
      else if (e.key === 'ArrowLeft') setI((v) => Math.max(v - 1, 0))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onTutup])

  if (!open) return null

  const L = LANGKAH[i]
  const pertama = i === 0
  const terakhir = i === LANGKAH.length - 1

  const box = rect
    ? { left: rect.left - PADDING, top: rect.top - PADDING, width: rect.width + PADDING * 2, height: rect.height + PADDING * 2 }
    : null

  /* posisi kartu: di bawah target bila muat, selain itu di atas; target tak ada → tengah */
  const tinggiKartu = 210
  let kartuStyle: React.CSSProperties
  if (!box) {
    kartuStyle = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  } else if (box.top + box.height + 14 + tinggiKartu < window.innerHeight) {
    kartuStyle = { left: Math.max(12, Math.min(box.left, window.innerWidth - 372)), top: box.top + box.height + 14 }
  } else if (box.top - 14 - tinggiKartu > 0) {
    kartuStyle = { left: Math.max(12, Math.min(box.left, window.innerWidth - 372)), top: box.top - 14 - tinggiKartu }
  } else {
    kartuStyle = { left: Math.max(12, Math.min(box.left, window.innerWidth - 372)), top: 12 }
  }

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-label="Panduan penggunaan editor">
      {/* perisai: blok klik ke editor, klik = lanjut */}
      <div className="absolute inset-0" onClick={() => !terakhir && setI(i + 1)} />

      {/* spotlight */}
      {box && (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-300"
          style={{
            ...box,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.74)',
            outline: '2px solid rgba(167,139,250,0.9)',
            outlineOffset: 2,
          }}
        />
      )}

      {/* kartu langkah */}
      <div
        className="absolute w-[360px] max-w-[calc(100vw-24px)] rounded-xl border border-violet-500/50 bg-zinc-900/95 p-4 shadow-2xl shadow-black/80 transition-all duration-300"
        style={kartuStyle}
      >
        <div className="mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300">
            <GraduationCap className="h-3 w-3" />
            {pertama ? 'Panduan' : `Langkah ${i} / ${LANGKAH.length - 1}`}
          </span>
          <button onClick={onTutup} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Tutup panduan">
            ✕
          </button>
        </div>
        <h2 className="text-sm font-bold text-violet-100">{L.judul}</h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-300">{L.isi}</p>

        <div className="mt-3 flex items-center gap-1">
          {LANGKAH.map((_, k) => (
            <span key={k} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-4 bg-violet-400' : 'w-1.5 bg-zinc-700')} />
          ))}
          <span className="ml-auto flex items-center gap-1.5">
            {!pertama && (
              <button
                onClick={() => setI(i - 1)}
                className="flex items-center gap-0.5 rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                <ChevronLeft className="h-3 w-3" /> Kembali
              </button>
            )}
            <button
              onClick={() => (terakhir ? onTutup() : setI(i + 1))}
              className="flex items-center gap-0.5 rounded-md bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-violet-500"
            >
              {terakhir ? 'Selesai' : 'Lanjut'} <ChevronRight className="h-3 w-3" />
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
