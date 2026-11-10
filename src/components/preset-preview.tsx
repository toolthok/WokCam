"use client";

/* ══════════ Pratinjau Preset — animasi · transisi · gaya teks ══════════
 * PERTANYAAN YANG DIJAWAB: "bisakah style/animasi yang masuk list bisa dilihat dulu?"
 *   - Semua pratinjau = CSS/WAAPI murni, TANPA database, TANPA berkas — nilai diambil
 *     langsung dari objek preset (kontrak koleksi v1) jadi logika ini nanti gampang
 *     dipindah ke Compose/Canvas di app Kotlin.
 *   - PratinjauAnimasi  : teks contoh bergerak sesuai gerakan·arah·durasi·easing·intensitas.
 *       tipe "in"  → mulai tersembunyi, masuk panggung (fade/slide/zoom/bounce/wipe)
 *       tipe "out" → mulai tampil lalu keluar; ada "hantu" tipis sebagai penanda posisi
 *       tipe "loop"→ gerak bolak-balik tanpa henti (zoom_in/out, pan 4 arah, none = statis)
 *   - PratinjauTransisi : dua panggung kecil "Scene 1 → Scene 2" yang bertukar tempat
 *       sesuai gerakan (none/crossfade/slide/wipe/zoom/flip) selama durasi_ms.
 *   - PratinjauStyle    : teks contoh dipakai font·ukuran·warna·outline·posisi persis
 *       seperti nilai style (font web = pendekatan; app Kotlin nanti pakai font asli).
 *   - Tombol ▶ di pojok kanan-atas memutar ulang tanpa menyentuh data koleksi.
 * Prinsip gerakan identik dengan daftar GERAKAN_ANIMASI / GERAKAN_TRANSISI di preset-store.
 */

import { useEffect, useRef, useState } from "react";
import type { PresetAnimasi, PresetTransisi, PresetStyle } from "@/lib/preset-store";

/* ── Easing kontrak → kurva CSS (dipakai pratinjau kartu & panggung editor) ── */

const CSS_EASING: Record<string, string> = {
  linear: "linear",
  ease_in: "cubic-bezier(0.42, 0, 1, 1)",
  ease_out: "cubic-bezier(0, 0, 0.58, 1)",
  ease_in_out: "cubic-bezier(0.42, 0, 0.58, 1)",
  /* spring: melampaui target sedikit lalu memantul balik */
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
};

export function cssEasing(e: string): string {
  return CSS_EASING[e] ?? CSS_EASING.ease_in_out;
}

const clampDurasi = (ms: number, min: number, max: number) => Math.min(max, Math.max(min, ms));

/* ── Panggung bersama: latar gelap + cahaya dekoratif, ukuran kartu ── */

function Panggung({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative h-24 w-full overflow-hidden rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 ${className}`}>
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(167,139,250,0.16),transparent_55%),radial-gradient(circle_at_78%_85%,rgba(232,121,249,0.12),transparent_50%)]"
      />
      {children}
    </div>
  );
}

function TombolPutar({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-1.5 top-1.5 z-10 rounded-md border border-zinc-700 bg-zinc-900/85 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 transition hover:border-violet-500 hover:text-white active:scale-95"
      aria-label="Putar ulang pratinjau"
    >
      ▶ putar
    </button>
  );
}

/* ── Potongan clip-path wipe: tepi pembersih BERJALAN ke arah tsb ──
 * inset(top right bottom left); nilai awal menyembunyikan teks, akhir = terlihat penuh. */

export function clipWipeMasuk(arah: string): string {
  switch (arah) {
    case "kiri": return "inset(0 0 0 100%)";   // tepi dari kanan menuju kiri
    case "atas": return "inset(100% 0 0 0)";   // tepi dari bawah menuju atas
    case "bawah": return "inset(0 0 100% 0)";  // tepi dari atas menuju bawah
    default: return "inset(0 100% 0 0)";       // kanan (default)
  }
}

export function clipWipeKeluar(arah: string): string {
  switch (arah) {
    case "kiri": return "inset(0 100% 0 0)";
    case "atas": return "inset(0 0 100% 0)";
    case "bawah": return "inset(100% 0 0 0)";
    default: return "inset(0 0 0 100%)";
  }
}

/* Offset translate sesuai arah: elemen MASUK dari sisi arah (contoh: "dari Bawah") */
function transDari(arah: string, jarak: number): string {
  switch (arah) {
    case "kiri": return `translateX(${-jarak}px)`;
    case "kanan": return `translateX(${jarak}px)`;
    case "atas": return `translateY(${-jarak}px)`;
    default: return `translateY(${jarak}px)`; // bawah / kosong
  }
}

/* Offset translate untuk KELUAR ke arah */

function transKe(arah: string, jarak: number): string {
  switch (arah) {
    case "kiri": return `translateX(${-jarak}px)`;
    case "kanan": return `translateX(${jarak}px)`;
    case "atas": return `translateY(${-jarak}px)`;
    default: return `translateY(${jarak}px)`;
  }
}

/* ══════════ Pratinjau Animasi (tipe in / out / loop) ══════════ */

export type HasilKeyframeAnimasi = {
  kf: Keyframe[];
  durasi: number;
  easing: string;
  iterasi: number;
};

/* Membangun keyframes WAAPI dari preset animasi kontrak — DIPAKAI BERSAMA:
 * kartu pratinjau (generator/koleksi/timeline) dan panggung editor (animasi teks scene).
 * Mengembalikan null bila memang tidak ada animasi (loop "none" / gerakan tak dikenal). */
export function bangunKeyframesAnimasi(preset: PresetAnimasi): HasilKeyframeAnimasi | null {
  if (preset.tipe === "loop" && preset.gerakan === "none") return null;
  /* "kata" = animasi kata-demi-kata — DITANGANI KHUSUS per-kata oleh renderer
   * (PratinjauAnimasi & LapisScene), bukan keyframe satu elemen. */
  if (preset.tipe === "in" && preset.gerakan === "kata") return null;

  const dur = clampDurasi(preset.durasi_ms, 250, 5000);
  const eas = cssEasing(preset.easing);
  const i = Math.min(Math.max(preset.intensitas, 0), 200) / 100; // 0–2
  const jarak = Math.round(64 * Math.min(i, 1.6));
  const pantul = Math.round(jarak * 0.22);
  const g = preset.gerakan;
  const d = preset.arah;

  let kf: Keyframe[] = [];
  let iterasi = 1;

  if (preset.tipe === "in") {
    switch (g) {
      case "fade":
        kf = [{ opacity: 0 }, { opacity: 1 }];
        break;
      case "slide":
        kf = [
          { opacity: 0, transform: transDari(d, jarak) },
          { opacity: 1, offset: 0.35 },
          { opacity: 1, transform: "translate(0, 0)" },
        ];
        break;
      case "zoom": {
        const s0 = Math.max(0.3, 1 - 0.4 * Math.min(i, 1.6));
        kf = [
          { opacity: 0, transform: `scale(${s0})` },
          { opacity: 1, offset: 0.3 },
          { opacity: 1, transform: "scale(1)" },
        ];
        break;
      }
      case "bounce": {
        // jatuh/naik lalu dua pantulan kecil lalu tenang
        const mulai = transDari(d || "atas", jarak);
        const pantulT = d === "kiri" || d === "kanan"
          ? `translateX(${d === "kiri" ? -pantul : pantul}px)`
          : `translateY(${!d || d === "atas" ? -pantul : pantul}px)`;
        kf = [
          { opacity: 0, transform: mulai, easing: "linear" },
          { opacity: 1, transform: mulai, offset: 0.08, easing: "ease-in" },
          { transform: "translate(0, 0)", offset: 0.45, easing: "ease-out" },
          { transform: pantulT, offset: 0.66, easing: "ease-in" },
          { opacity: 1, transform: "translate(0, 0)" },
        ];
        break;
      }
      case "wipe":
        kf = [{ clipPath: clipWipeMasuk(d), opacity: 1 }, { clipPath: "inset(0 0 0 0)", opacity: 1 }];
        break;
      default:
        kf = [{ opacity: 0 }, { opacity: 1 }];
    }
  } else if (preset.tipe === "out") {
    switch (g) {
      case "fade":
        kf = [{ opacity: 1 }, { opacity: 0 }];
        break;
      case "slide":
        kf = [
          { opacity: 1, transform: "translate(0, 0)" },
          { opacity: 1, offset: 0.55 },
          { opacity: 0, transform: transKe(d || "kiri", jarak) },
        ];
        break;
      case "zoom": {
        const s1 = 1 + 0.4 * Math.min(i, 1.6);
        kf = [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: `scale(${s1})` }];
        break;
      }
      case "shrink": {
        const s1 = Math.max(0.3, 1 - 0.45 * Math.min(i, 1.6));
        kf = [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: `scale(${s1})` }];
        break;
      }
      case "wipe":
        kf = [{ clipPath: "inset(0 0 0 0)", opacity: 1 }, { clipPath: clipWipeKeluar(d), opacity: 1 }];
        break;
      default:
        kf = [{ opacity: 1 }, { opacity: 0 }];
    }
  } else {
    // loop — bolak-balik mulus, tanpa henti
    iterasi = Infinity;
    const pan = Math.round(16 * Math.min(i, 1.8));
    const zoomAmplitudo = 1 + 0.12 * Math.min(i, 1.8);
    switch (g) {
      case "zoom_in":
        kf = [{ transform: "scale(1)" }, { transform: `scale(${zoomAmplitudo})`, offset: 0.5 }, { transform: "scale(1)" }];
        break;
      case "zoom_out":
        kf = [{ transform: `scale(${zoomAmplitudo})` }, { transform: "scale(1)", offset: 0.5 }, { transform: `scale(${zoomAmplitudo})` }];
        break;
      case "pan_kiri":
        kf = [{ transform: "translateX(0)" }, { transform: `translateX(${-pan}px)`, offset: 0.5 }, { transform: "translateX(0)" }];
        break;
      case "pan_kanan":
        kf = [{ transform: "translateX(0)" }, { transform: `translateX(${pan}px)`, offset: 0.5 }, { transform: "translateX(0)" }];
        break;
      case "pan_atas":
        kf = [{ transform: "translateY(0)" }, { transform: `translateY(${-pan}px)`, offset: 0.5 }, { transform: "translateY(0)" }];
        break;
      case "pan_bawah":
        kf = [{ transform: "translateY(0)" }, { transform: `translateY(${pan}px)`, offset: 0.5 }, { transform: "translateY(0)" }];
        break;
      default:
        return null; // none / tak dikenal — statis
    }
  }

  return { kf, durasi: dur, easing: eas, iterasi };
}

/* Gaya awal sebelum animasi jalan: "in" mulai tersembunyi agar tidak kedip di paint pertama.
 * Gerakan "kata" dikelola per-kata → tanpa gaya sembunyi di container. */
export function gayaAwalAnimasi(preset: PresetAnimasi): React.CSSProperties {
  const gaya: React.CSSProperties = {};
  if (preset.tipe === "in") {
    if (preset.gerakan === "kata") return gaya;
    if (preset.gerakan === "wipe") gaya.clipPath = clipWipeMasuk(preset.arah);
    else gaya.opacity = 0;
  }
  return gaya;
}

/* ── Animasi KATA-DEMI-KATA (gerakan "kata") — dipakai pratinjau & panggung editor ──
 * Tiap kata pop masuk berurutan: opacity 0→1 + naik sedikit + scale 0.92→1.
 * Mengembalikan null bila bukan gerakan kata (pemanggil memakai jalur biasa). */
const KATA_CONTOH = ["kata", "muncul", "satu", "demi", "satu"];

export type HasilAnimasiKata = { langkah: number; durasiPerKata: number; easing: string };

export function polaAnimasiKata(preset: PresetAnimasi, jumlahKata: number, durasiSceneDtk?: number): HasilAnimasiKata | null {
  if (preset.tipe !== "in" || preset.gerakan !== "kata" || jumlahKata <= 0) return null;
  const durasiPerKata = clampDurasi(preset.durasi_ms, 250, 1200);
  /* jendela reveal: kalau durasi scene diketahui, kata-kata selesai muncul sebelum 55% scene */
  const jendela = durasiSceneDtk ? Math.min(preset.durasi_ms, durasiSceneDtk * 1000 * 0.55) : preset.durasi_ms;
  const langkah = Math.max(70, Math.min(420, Math.round(jendela / jumlahKata)));
  return { langkah, durasiPerKata, easing: cssEasing(preset.easing) };
}

/** Keyframe pop untuk SATU kata (urutan waktu relatif, delay diatur pemanggil). */
export const KF_KATA: Keyframe[] = [
  { opacity: 0, transform: "translateY(0.45em) scale(0.92)" },
  { opacity: 1, transform: "translateY(0) scale(1)" },
];

export function PratinjauAnimasi({ preset }: { preset: PresetAnimasi }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idPutar, setIdPutar] = useState(0);

  /* gerakan "kata": animasi per-kata berurutan (teknik khas video promo referensi) */
  const polaKata = polaAnimasiKata(preset, KATA_CONTOH.length);
  useEffect(() => {
    if (!polaKata) return;
    const el = ref.current;
    if (!el) return;
    const anims: Animation[] = [];
    el.querySelectorAll("[data-kata]").forEach((node, i) => {
      anims.push(
        node.animate(KF_KATA, {
          duration: polaKata.durasiPerKata,
          easing: polaKata.easing,
          delay: i * polaKata.langkah,
          fill: "both",
        }),
      );
    });
    return () => anims.forEach((a) => a.cancel());
  }, [idPutar, preset, polaKata]);

  useEffect(() => {
    if (polaKata) return;
    const el = ref.current;
    if (!el) return;
    const hasil = bangunKeyframesAnimasi(preset);
    if (!hasil) return;
    const anim = el.animate(hasil.kf, { duration: hasil.durasi, easing: hasil.easing, fill: "both", iterations: hasil.iterasi });
    return () => anim.cancel();
  }, [idPutar, preset, polaKata]);

  const gayaAwal = gayaAwalAnimasi(preset);

  return (
    <Panggung>
      {preset.tipe === "out" && (
        <div aria-hidden className="absolute inset-0 flex items-center justify-center px-3">
          <span className="truncate text-sm font-bold text-zinc-100 opacity-10">{preset.nama}</span>
        </div>
      )}
      <div ref={ref} className="absolute inset-0 flex items-center justify-center px-3" style={gayaAwal}>
        {polaKata ? (
          <span className="max-w-full text-center text-sm font-bold text-zinc-100">
            {KATA_CONTOH.map((k, i) => (
              <span key={i} data-kata className="inline-block whitespace-pre">
                {k}{i < KATA_CONTOH.length - 1 ? " " : ""}
              </span>
            ))}
          </span>
        ) : (
          <span className="truncate text-sm font-bold text-zinc-100">{preset.nama}</span>
        )}
      </div>
      <TombolPutar onClick={() => setIdPutar(n => n + 1)} />
    </Panggung>
  );
}

/* ══════════ Pratinjau Transisi (Scene 1 → Scene 2) ══════════ */

export function PratinjauTransisi({ preset }: { preset: PresetTransisi }) {
  const refA = useRef<HTMLDivElement>(null);
  const refB = useRef<HTMLDivElement>(null);
  const [idPutar, setIdPutar] = useState(0);

  useEffect(() => {
    const A = refA.current;
    const B = refB.current;
    if (!A || !B) return;

    const dur = clampDurasi(preset.durasi_ms, 300, 3000);
    const g = preset.gerakan;
    const d = preset.arah || "kiri";
    const eas = g === "none" ? "linear" : cssEasing(preset.easing);

    const kfA: Keyframe[] = [];
    const kfB: Keyframe[] = [];

    switch (g) {
      case "none":
        kfA.push({ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.499 }, { opacity: 0, offset: 0.5 }, { opacity: 0, offset: 1 });
        kfB.push({ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.499 }, { opacity: 1, offset: 0.5 }, { opacity: 1, offset: 1 });
        break;
      case "slide": {
        const keluar = d === "atas" ? "translateY(-100%)" : d === "bawah" ? "translateY(100%)" : d === "kanan" ? "translateX(100%)" : "translateX(-100%)";
        const masuk = d === "atas" ? "translateY(100%)" : d === "bawah" ? "translateY(-100%)" : d === "kanan" ? "translateX(-100%)" : "translateX(100%)";
        kfA.push({ transform: "translate(0, 0)" }, { transform: keluar });
        kfB.push({ transform: masuk }, { transform: "translate(0, 0)" });
        break;
      }
      case "wipe":
        kfB.push({ clipPath: clipWipeMasuk(d) }, { clipPath: "inset(0 0 0 0)" });
        break;
      case "zoom":
        kfA.push({ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.25)", opacity: 0 });
        kfB.push({ transform: "scale(0.7)", opacity: 0 }, { transform: "scale(1)", opacity: 1 });
        break;
      case "blur":
        /* khas video referensi: scene tua mengabur membesar, scene baru jernih dari kabur */
        kfA.push({ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(14px)", transform: "scale(1.05)" });
        kfB.push({ opacity: 0, filter: "blur(14px)", transform: "scale(0.97)" }, { opacity: 1, filter: "blur(0px)", transform: "scale(1)" });
        break;
      case "flip":
        kfA.push(
          { transform: "perspective(500px) rotateY(0deg)" },
          { transform: "perspective(500px) rotateY(-90deg)", offset: 0.5 },
          { transform: "perspective(500px) rotateY(-90deg)", opacity: 0, offset: 1 },
        );
        kfB.push(
          { transform: "perspective(500px) rotateY(90deg)", opacity: 0 },
          { transform: "perspective(500px) rotateY(90deg)", opacity: 1, offset: 0.5 },
          { transform: "perspective(500px) rotateY(0deg)", opacity: 1, offset: 1 },
        );
        break;
      default: // crossfade / tak dikenal
        kfA.push({ opacity: 1 }, { opacity: 0 });
        kfB.push({ opacity: 0 }, { opacity: 1 });
    }

    const animA = kfA.length ? A.animate(kfA, { duration: dur, easing: eas, fill: "both" }) : null;
    const animB = kfB.length ? B.animate(kfB, { duration: dur, easing: eas, fill: "both" }) : null;
    return () => {
      animA?.cancel();
      animB?.cancel();
    };
  }, [idPutar, preset]);

  /* B tersembunyi di awal (kecuali wipe: lewat clip-path; blur: lewat opacity+filter) */
  const gayaB: React.CSSProperties =
    preset.gerakan === "wipe"
      ? { clipPath: clipWipeMasuk(preset.arah || "kiri") }
      : preset.gerakan === "blur"
        ? { opacity: 0, filter: "blur(14px)" }
        : { opacity: 0 };

  return (
    <Panggung>
      <div ref={refA} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800">
        <span className="text-xl font-black tracking-widest text-white/70">SCENE 1</span>
      </div>
      <div ref={refB} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-600 via-fuchsia-600 to-fuchsia-800" style={gayaB}>
        <span className="text-xl font-black tracking-widest text-white/90">SCENE 2</span>
      </div>
      <TombolPutar onClick={() => setIdPutar(n => n + 1)} />
    </Panggung>
  );
}

/* ══════════ Pratinjau Gaya Teks ══════════ */

/* Font kontrak (nama bebas) → kelas pendekatan terdekat dengan font sistem web.
 * App Kotlin nanti memuat font asli; di sini cukup memberi RASA (tebal/hitam/condensed/serif). */
export function kelasFont(font: string): string {
  const f = font.toLowerCase();
  const kelas: string[] = [];
  if (/(black|heavy|extra|berat)/.test(f)) kelas.push("font-black");
  else if (/(bold|tebal|condensed|bebas|narrow)/.test(f)) kelas.push("font-bold");
  else if (/(light|tipis)/.test(f)) kelas.push("font-light");
  else kelas.push("font-semibold");
  if (/(condensed|bebas|narrow|sempit)/.test(f)) kelas.push("uppercase", "tracking-tighter");
  if (/(mono|kode)/.test(f)) kelas.push("font-mono");
  if (/(serif|timbul)/.test(f)) kelas.push("font-serif");
  if (/(italic|miring)/.test(f)) kelas.push("italic");
  return kelas.join(" ");
}

export function PratinjauStyle({ preset }: { preset: PresetStyle }) {
  const ukuranPx = Math.max(9, Math.min(40, Math.round(preset.ukuran / 3)));
  const tebal = preset.tebal_outline > 0 ? Math.max(0.6, preset.tebal_outline / 3) : 0;
  const posisi = preset.posisi === "atas" ? "items-start pt-1.5" : preset.posisi === "tengah" ? "items-center" : "items-end pb-1.5";

  /* Latar panggung mengikuti warna teks: teks gelap → latar terang, teks terang → latar gelap,
   * supaya tiap style selalu terbaca (contoh: editorial #171717 = video screenshot berlatar putih). */
  const hex = /^#?([0-9A-Fa-f]{6})$/.exec(preset.warna_teks)?.[1] ?? "FFFFFF";
  const [r, g, b] = [0, 2, 4].map(k => parseInt(hex.slice(k, k + 2), 16));
  const luminans = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const latar = luminans < 0.45
    ? "border-zinc-700 bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-400"
    : "border-zinc-800 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950";

  const gayaTeks: React.CSSProperties = {
    fontSize: `${ukuranPx}px`,
    color: preset.warna_teks,
    WebkitTextStroke: tebal > 0 ? `${tebal}px ${preset.warna_outline}` : undefined,
    paintOrder: "stroke fill",
    textShadow: tebal > 0 ? "0 2px 6px rgba(0,0,0,0.45)" : "0 1px 3px rgba(0,0,0,0.4)",
    lineHeight: 1.15,
  };

  return (
    <div className={`relative h-24 w-full overflow-hidden rounded-lg ${latar}`}>
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(167,139,250,0.16),transparent_55%),radial-gradient(circle_at_78%_85%,rgba(232,121,249,0.12),transparent_50%)]"
      />
      <div className={`relative flex h-full w-full flex-col justify-center ${posisi}`}>
        <div className="px-3 text-center">
          <span className={`inline-block ${kelasFont(preset.font)}`} style={gayaTeks}>
            Contoh Teks Aa
          </span>
        </div>
      </div>
      <span aria-hidden className={`absolute bottom-1 right-2 text-[9px] font-medium ${luminans < 0.45 ? "text-zinc-600" : "text-zinc-500"}`}>
        ≈ {preset.font} · {preset.posisi}
      </span>
      <span aria-hidden className={`absolute left-1.5 top-1.5 text-[9px] font-medium ${luminans < 0.45 ? "text-zinc-600" : "text-zinc-500"}`}>
        {preset.ukuran}px
      </span>
    </div>
  );
}

/* ══════════ Adapter untuk halaman generator (data "bersih" tanpa tipe) ══════════
 * Entri hasil validasi generator berbentuk Record<string, unknown> — disusun ulang
 * di sini menjadi objek kontrak lalu dirender pratinjau yang sesuai. */

export function PratinjauBersih({
  jenis,
  data,
}: {
  jenis: "in" | "out" | "loop" | "transisi" | "style";
  data: Record<string, unknown>;
}) {
  const angka = (v: unknown, bawaan: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : bawaan;
  };

  if (jenis === "style") {
    const style: PresetStyle = {
      nama: String(data.nama ?? "(tanpa nama)"),
      font: String(data.font ?? "poppins_bold"),
      ukuran: angka(data.ukuran, 56),
      warna_teks: String(data.warna_teks ?? "#FFFFFF"),
      tebal_outline: angka(data.tebal_outline, 0),
      warna_outline: String(data.warna_outline ?? "#000000"),
      posisi: String(data.posisi ?? "bawah"),
      tag: [],
    };
    return <PratinjauStyle preset={style} />;
  }

  const dasar = {
    nama: String(data.nama ?? "(tanpa nama)"),
    gerakan: String(data.gerakan ?? ""),
    arah: String(data.arah ?? ""),
    durasi_ms: angka(data.durasi_ms, 500),
    easing: String(data.easing ?? "ease_out"),
    tag: [] as string[],
    sfx: "",
  };

  if (jenis === "transisi") return <PratinjauTransisi preset={dasar} />;
  return (
    <PratinjauAnimasi
      preset={{ ...dasar, tipe: jenis, intensitas: angka(data.intensitas, 100) }}
    />
  );
}
