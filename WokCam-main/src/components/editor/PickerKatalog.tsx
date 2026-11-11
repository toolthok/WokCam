"use client";

/* ══════════ Picker Katalog Latar & Overlay (bukan koleksi user) ══════════
 * PERTANYAAN YANG DIJAWAB: "cara ganti latar belakang / pasang efek overlay?"
 *   - Daftar diambil dari katalog BAWAAN aplikasi (LATAR_PRESET / OVERLAY_PRESET di
 *     proyek.ts) — beda dengan AssignMenu yang membaca Koleksi Style user.
 *   - Latar: baris "Otomatis (dari mood)" + 10 tema gradien dengan swatch warna.
 *   - Overlay: baris "Tanpa overlay" + 8 efek dengan ikon & deskripsi.
 *   - Pemakaian: <PickerKatalog jenis="latar" nilai={s.latarPreset} onPilih={(id)=>...}>
 */

import { useState } from "react";
import {
  Activity,
  Circle,
  CloudFog,
  Film,
  Grip,
  Image as ImageIcon,
  PanelBottom,
  RectangleHorizontal,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LATAR_PRESET, OVERLAY_PRESET, kelasLatar } from "@/lib/editor/proyek";

const IKON_OVERLAY: Record<string, React.ComponentType<{ className?: string }>> = {
  vignette: Circle,
  grain: Grip,
  letterbox: RectangleHorizontal,
  "light-leak": Sun,
  bokeh: Sparkles,
  "lower-third": PanelBottom,
  haze: CloudFog,
  progress: Activity,
};

export function PickerKatalog({
  jenis,
  nilai,
  moodScene,
  onPilih,
  children,
  align = "start",
}: {
  jenis: "latar" | "overlay";
  nilai: string | null;
  /** mood scene terpilih — untuk swatch pilihan "Otomatis" */
  moodScene?: string;
  onPilih: (id: string | null) => void;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}) {
  const [buka, setBuka] = useState(false);

  const label = jenis === "latar" ? "Latar Belakang" : "Overlay Efek";
  const isLatar = jenis === "latar";

  const pilih = (id: string | null) => {
    onPilih(id);
    setBuka(false);
  };

  return (
    <Popover open={buka} onOpenChange={setBuka}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-[250px] p-0" side="bottom">
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-300">
            {isLatar ? <ImageIcon className="h-3 w-3" /> : <Film className="h-3 w-3" />} {label}
          </span>
          {nilai && (
            <button
              onClick={() => pilih(null)}
              className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 hover:bg-zinc-700"
              title={isLatar ? "Kembali otomatis (dari mood)" : "Lepas overlay"}
            >
              <X className="h-3 w-3" /> hapus
            </button>
          )}
        </div>

        <div className="max-h-[290px] overflow-y-auto p-1.5">
          {/* pilihan netral */}
          <button
            onClick={() => pilih(null)}
            className={cn(
              "mb-1 flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left",
              nilai === null ? "border-violet-500/60 bg-violet-500/10" : "border-transparent hover:border-zinc-700 hover:bg-zinc-800/60",
            )}
          >
            <span
              className={cn("h-5 w-8 shrink-0 rounded border border-zinc-600 bg-gradient-to-br", kelasLatar(null, moodScene ?? "fokus"))}
              title="Pratinjau otomatis"
            />
            <span className={cn("text-xs font-semibold", nilai === null ? "text-violet-200" : "text-zinc-100")}>
              {isLatar ? "Otomatis (dari mood)" : "Tanpa overlay"}
            </span>
          </button>

          {isLatar
            ? LATAR_PRESET.map((l) => {
                const aktif = nilai === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => pilih(l.id)}
                    className={cn(
                      "mb-1 flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left",
                      aktif ? "border-violet-500/60 bg-violet-500/10" : "border-transparent hover:border-zinc-700 hover:bg-zinc-800/60",
                    )}
                    title={`Pakai latar "${l.nama}"`}
                  >
                    <span className={cn("h-5 w-8 shrink-0 rounded border border-zinc-600 bg-gradient-to-br", l.kelas)} />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-xs font-semibold", aktif ? "text-violet-200" : "text-zinc-100")}>{l.nama}</span>
                      <span className="block truncate text-[10px] text-zinc-500">{l.kataKunciEn}</span>
                    </span>
                  </button>
                );
              })
            : OVERLAY_PRESET.map((o) => {
                const aktif = nilai === o.id;
                const Ikon = IKON_OVERLAY[o.id] ?? Film;
                return (
                  <button
                    key={o.id}
                    onClick={() => pilih(o.id)}
                    className={cn(
                      "mb-1 flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left",
                      aktif ? "border-violet-500/60 bg-violet-500/10" : "border-transparent hover:border-zinc-700 hover:bg-zinc-800/60",
                    )}
                    title={`Pasang overlay "${o.nama}"`}
                  >
                    <span className="flex h-5 w-8 shrink-0 items-center justify-center rounded border border-zinc-600 bg-zinc-800">
                      <Ikon className="h-3 w-3 text-zinc-300" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-xs font-semibold", aktif ? "text-violet-200" : "text-zinc-100")}>{o.nama}</span>
                      <span className="block truncate text-[10px] text-zinc-500">{o.deskripsi}</span>
                    </span>
                  </button>
                );
              })}
        </div>

        <div className="border-t border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-500">
          katalog bawaan wokCam · klik untuk memasang
        </div>
      </PopoverContent>
    </Popover>
  );
}
