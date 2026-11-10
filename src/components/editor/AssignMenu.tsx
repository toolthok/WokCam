"use client";

/* ══════════ Menu Penugasan Preset dari Koleksi Style ══════════
 * PERTANYAAN YANG DIJAWAB: "cara pasang animasi/transisi/style ke scene?"
 *   - Satu popover untuk 5 jenis assignment: animasi in/out/loop, transisi, style.
 *   - Daftar diambil LANGSUNG dari Koleksi Style (localStorage kontrak v1) — tanpa
 *     database, tanpa daftar ganda. Tiap baris bisa diperluas untuk pratinjau gerakan.
 *   - Koleksi kosong → tawarkan Paket Minimalis bawaan (satu klik masuk koleksi)
 *     + tautan ke halaman Koleksi.
 *   - Pemakaian: <AssignMenu jenis="in" terpasang={s.animIn} onPilih={(nama)=>...}>
 */

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronDown, Eye, Layers, Play, Square, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { koleksiStore, tambahkanPaket, ubahKoleksi, type Koleksi, type PresetAnimasi, type PresetStyle, type PresetTransisi } from "@/lib/preset-store";
import { PratinjauAnimasi, PratinjauStyle, PratinjauTransisi } from "@/components/preset-preview";

export type JenisAssign = "in" | "out" | "loop" | "transisi" | "style";

const LABEL: Record<JenisAssign, string> = {
  in: "Animasi Masuk",
  out: "Animasi Keluar",
  loop: "Gerak Loop",
  transisi: "Transisi",
  style: "Gaya Teks",
};

function useKoleksi(): Koleksi {
  return useSyncExternalStore(koleksiStore.subscribe, koleksiStore.getSnapshot, koleksiStore.getServerSnapshot);
}

export function AssignMenu({
  jenis,
  terpasang,
  onPilih,
  children,
  align = "start",
  lebar = "w-[270px]",
}: {
  jenis: JenisAssign;
  terpasang: string | null;
  onPilih: (nama: string | null) => void;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  lebar?: string;
}) {
  const koleksi = useKoleksi();
  const [buka, setBuka] = useState(false);
  const [pratinjau, setPratinjau] = useState<string | null>(null);

  const animasi = koleksi.presets.filter((p) => p.tipe === jenis);
  const daftar =
    jenis === "transisi"
      ? koleksi.transitions.map((p) => ({ nama: p.nama, meta: `${p.gerakan}${p.arah ? " " + p.arah : ""} · ${p.durasi_ms}ms` }))
      : jenis === "style"
        ? koleksi.styles.map((p) => ({ nama: p.nama, meta: `${p.font} · ${p.ukuran}px · ${p.warna_teks}` }))
        : animasi.map((p) => ({ nama: p.nama, meta: `${p.gerakan}${p.arah ? " " + p.arah : ""} · ${p.durasi_ms}ms · ${p.easing}` }));

  const kosong = daftar.length === 0;
  const namaTerpasang = terpasang;

  const pilih = (nama: string | null) => {
    onPilih(nama);
    setPratinjau(null);
    setBuka(false);
  };

  const presetObjek = (nama: string) => {
    if (jenis === "transisi") return koleksi.transitions.find((p) => p.nama === nama);
    if (jenis === "style") return koleksi.styles.find((p) => p.nama === nama);
    return koleksi.presets.find((p) => p.nama === nama && p.tipe === jenis);
  };

  const masukkanPaket = () => {
    ubahKoleksi(tambahkanPaket(koleksi, "minimalis").koleksi);
  };

  return (
    <Popover open={buka} onOpenChange={(v) => { setBuka(v); if (!v) setPratinjau(null); }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className={cn("p-0", lebar)} side="bottom">
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-300">
            <Layers className="h-3 w-3" /> {LABEL[jenis]}
          </span>
          {namaTerpasang && (
            <button onClick={() => pilih(null)} className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 hover:bg-zinc-700" title="Hapus assignment">
              <X className="h-3 w-3" /> hapus
            </button>
          )}
        </div>

        {kosong ? (
          <div className="space-y-2 px-3 py-3">
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Koleksi belum punya item untuk kategori ini.
            </p>
            <button onClick={masukkanPaket} className="w-full rounded-lg border border-violet-500/50 bg-violet-500/10 px-2 py-2 text-[11px] font-bold text-violet-300 hover:bg-violet-500/20">
              + Masukkan Paket Minimalis (6 animasi · 4 transisi · 4 style)
            </button>
            <Link href="/koleksi" className="block text-center text-[11px] font-semibold text-fuchsia-400 underline decoration-dotted">
              Kelola Koleksi Style →
            </Link>
          </div>
        ) : (
          <div className="max-h-[290px] overflow-y-auto p-1.5">
            {daftar.map((d) => {
              const aktif = terpasang === d.nama;
              const sedangPratinjau = pratinjau === d.nama;
              const preset = presetObjek(d.nama);
              return (
                <div key={d.nama} className={cn("mb-1 rounded-lg border", aktif ? "border-violet-500/60 bg-violet-500/10" : "border-transparent hover:border-zinc-700 hover:bg-zinc-800/60")}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => pilih(d.nama)} className="min-w-0 flex-1 px-2 py-1.5 text-left" title={`Pakai "${d.nama}"`}>
                      <span className={cn("block truncate text-xs font-semibold", aktif ? "text-violet-200" : "text-zinc-100")}>{d.nama}</span>
                      <span className="block truncate text-[10px] text-zinc-500">{d.meta}</span>
                    </button>
                    {preset && (
                      <button
                        onClick={() => setPratinjau(sedangPratinjau ? null : d.nama)}
                        className={cn("mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border", sedangPratinjau ? "border-violet-500/60 bg-violet-500/15 text-violet-300" : "border-zinc-700 text-zinc-400 hover:text-zinc-200")}
                        title="Pratinjau gerakan/gaya"
                        aria-label={`Pratinjau ${d.nama}`}
                      >
                        {sedangPratinjau ? <Square className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                  {sedangPratinjau && preset && (
                    <div className="px-2 pb-2">
                      {jenis === "transisi" ? (
                        <PratinjauTransisi preset={preset as PresetTransisi} />
                      ) : jenis === "style" ? (
                        <PratinjauStyle preset={preset as PresetStyle} />
                      ) : (
                        <PratinjauAnimasi preset={preset as PresetAnimasi} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-500">
          <span>{namaTerpasang ? `terpasang: ${namaTerpasang.slice(0, 22)}` : "belum diatur"}</span>
          <span className="flex items-center gap-1"><Play className="h-2.5 w-2.5" /> klik nama = pasang</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Tombol pemicu kecil untuk toolbar timeline.
 *  WAJIB meneruskan ...props: Radix PopoverTrigger asChild menyematkan onClick/
 *  aria-* ke komponen ini via Slot — kalau dibuang (versi lama), tombol toolbar
 *  sama sekali tidak bisa diklik (bug yang bikin user bingung "cara pakainya").
 *  Elemen akhirnya <button> asli agar aksesibel. */
export function TombolAssign({
  label,
  terpasang,
  className,
  ...props
}: {
  label: string;
  terpasang: string | null;
  className?: string;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-colors",
        terpasang
          ? "border-violet-500/50 bg-violet-500/10 text-violet-200"
          : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800",
        className,
      )}
      {...props}
    >
      {label}
      {terpasang ? <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a78bfa]" /> : <ChevronDown className="h-3 w-3 opacity-70" />}
    </button>
  );
}
