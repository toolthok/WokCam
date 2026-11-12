"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bangunPromptRancangan } from "@/lib/editor/prompt-rancangan";
import { kirimKeEditorJson } from "@/lib/editor/proyek";

import { MOODS, fmtDurasi, parseNaskah, terapkanRitme, type HasilNaskah } from "@/lib/naskah-parser";
import { simpanEntriKeKoleksi, uraiJSONToleran } from "@/lib/preset-store";
import { PratinjauBersih } from "@/components/preset-preview";
import { kirimKeEditor } from "@/lib/editor/proyek";

/* ══════════ Konstanta kontrak (sumber tunggal, akan dipindah ke Kotlin) ══════════ */

const GERAKAN: Record<string, string[]> = {
  in: ["fade", "slide", "zoom", "bounce", "wipe", "kata"],
  out: ["fade", "slide", "zoom", "shrink", "wipe"],
  loop: ["none", "zoom_in", "zoom_out", "pan_kiri", "pan_kanan", "pan_atas", "pan_bawah"],
  transisi: ["none", "crossfade", "slide", "wipe", "zoom", "flip", "blur"],
};
const ARAH = ["atas", "bawah", "kiri", "kanan"];
const EASING = ["linear", "ease_in", "ease_out", "ease_in_out", "spring"];
const POSISI = ["atas", "tengah", "bawah"];

type JenisPreset = "in" | "out" | "loop" | "transisi" | "style";

const JENIS_LABEL: Record<JenisPreset, string> = {
  in: "Animasi Masuk (IN)",
  out: "Animasi Keluar (OUT)",
  loop: "Animasi Loop",
  transisi: "Transisi",
  style: "Gaya Teks",
};

const JENIS_KUNCI: Record<JenisPreset, "presets" | "transitions" | "styles"> = {
  in: "presets", out: "presets", loop: "presets",
  transisi: "transitions", style: "styles",
};

/* ══════════ Util ══════════ */

async function salinTeks(teks: string) {
  try {
    await navigator.clipboard.writeText(teks);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = teks;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
}

async function bacaClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

function unduhBerkas(nama: string, isi: string) {
  const blob = new Blob([isi], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ══════════ Tipe hasil validasi preset ══════════ */

/* Tipe scene hasil parse (Catatan, Scene, HasilNaskah) ada di @/lib/naskah-parser */

type EntriPreset = {
  nama: string; ringkas: string; status: "valid" | "diperbaiki" | "ditolak";
  alasan?: string; bersih?: Record<string, unknown>;
};
type HasilPreset = { entri: EntriPreset[]; kunci: "presets" | "transitions" | "styles"; jenis: JenisPreset; errorGlobal?: string };

/* ══════════ Template Prompt Naskah ══════════ */

function bangunPromptNaskah(f: {
  topik: string; platform: string; rasio: string; durasi: number;
  gaya: string; penonton: string; cta: string; jumlahScene: number;
}) {
  const anggaranKata = Math.round(f.durasi * 2.4);
  const kataPerScene = Math.max(8, Math.round((f.durasi * 2.4) / f.jumlahScene));
  const detikPerScene = fmtDurasi(Math.round((f.durasi / f.jumlahScene) * 2) / 2);
  return `Kamu adalah penulis naskah video faceless berbahasa Indonesia yang berpengalaman.

TUGAS: Buatkan naskah video tentang ${f.topik} untuk platform ${f.platform} (rasio ${f.rasio}).
- Target durasi total: ${f.durasi} detik
- Gaya bahasa: ${f.gaya}
- Target penonton: ${f.penonton}
- Jumlah scene: TEPAT ${f.jumlahScene} scene (tiap scene ±${detikPerScene} detik, rentang 2-15 detik) — DILARANG menambah atau mengurangi jumlah scene.
- Scene terakhir berisi ajakan (CTA): ${f.cta} — tetap PATUH anggaran kata (maksimal ±${kataPerScene} kata juga)

ATURAN OUTPUT (WAJIB, TANPA PENGECUALIAN):
1. Keluarkan HANYA teks berformat di bawah. Tanpa kalimat pembuka, tanpa penjelasan, tanpa blok kode markdown.
2. Tiap scene WAJIB punya 5 field: NASKAH, TEKS, DURASI, MOOD, LATAR.
3. NASKAH = kalimat yang akan dibacakan (1-3 kalimat pendek). BATAS KATA PER SCENE: MAKSIMAL ${kataPerScene} kata per NASKAH (kecepatan bicara ±2,4 kata/detik = ${f.durasi} detik ÷ ${f.jumlahScene} scene). HITUNG jumlah kata tiap NASKAH dan pastikan tidak melebihi batas. Total seluruh NASKAH maksimal ${anggaranKata} kata. Kalimat padat lebih baik daripada penjelasan panjang.
4. TEKS = versi singkat maksimal 8 kata untuk tampil di layar.
5. DURASI = angka detik (bilangan bulat 2-15). Jumlah SEMUA DURASI WAJIB TEPAT ${f.durasi} detik — jangan lebih, jangan kurang.
6. MOOD = pilih salah satu: tenang, energik, dramatis, ceria, misterius, fokus.
7. LATAR = kata kunci gambar Indonesia + | EN: kata kunci Inggris untuk pencarian stok.
8. Tulis SETIAP field pada BARIS TERPISAH. JANGAN pernah menggabungkan dua field dalam satu baris yang sama.
9. Tanpa markdown (tanpa **, tanpa #), tanpa penjelasan sebelum atau sesudah daftar scene.
10. SEBELUM MENJAWAB, hitung ulang sendiri: (a) jumlah scene PERSIS ${f.jumlahScene}; (b) jumlah semua DURASI TEPAT ${f.durasi} detik; (c) setiap NASKAH MAKSIMAL ${kataPerScene} kata. Jika ada yang belum pas, perbaiki sampai tepat, baru keluarkan hasilnya.

FORMAT:
=== SCENE 1 ===
NASKAH: ...
TEKS: ...
DURASI: 4
MOOD: misterius
LATAR: langit malam berbintang | EN: starry night sky

(lanjut sampai SCENE ${f.jumlahScene})`;
}


/* ══════════ Template Prompt Preset ══════════ */

function bangunPromptPreset(jenis: JenisPreset, jumlah: number, vibe: string): string {
  if (jenis === "style") {
    return `Buatkan ${jumlah} preset gaya teks (style) untuk aplikasi penyusun video faceless, karakter gaya: ${vibe}.

Keluarkan HANYA JSON valid (tanpa penjelasan, tanpa blok kode) dengan struktur persis:
{"version":1,"styles":[{"nama":"...","font":"...","ukuran":56,"warna_teks":"#FFFFFF","tebal_outline":8,"warna_outline":"#000000","posisi":"bawah","tag":["energik"]}]}

ATURAN:
- nama: bahasa Indonesia, menarik dan deskriptif
- font: nama gaya bebas (contoh: poppins_bold, bebas_condensed)
- ukuran: 24-120
- warna_teks / warna_outline: kode hex #RRGGBB
- tebal_outline: 0-16
- posisi: salah satu dari atas, tengah, bawah
- tag: 1-3 dari: tenang, energik, dramatis, ceria, misterius, fokus`;
  }
  if (jenis === "transisi") {
    return `Buatkan ${jumlah} preset transisi untuk aplikasi penyusun video faceless, karakter gaya: ${vibe}.

Keluarkan HANYA JSON valid (tanpa penjelasan, tanpa blok kode) dengan struktur persis:
{"version":1,"transitions":[{"nama":"...","gerakan":"crossfade","arah":"kiri","durasi_ms":500,"easing":"ease_in_out","tag":["tenang"]}]}

ATURAN:
- nama: bahasa Indonesia, menarik dan deskriptif
- gerakan: HANYA dari daftar ini: ${GERAKAN.transisi.join(", ")}
- arah: salah satu dari ${ARAH.join(", ")} (kosongkan string jika tidak relevan)
- durasi_ms: 150-3000
- easing: salah satu dari ${EASING.join(", ")}
- tag: 1-3 dari: tenang, energik, dramatis, ceria, misterius, fokus`;
  }
  return `Buatkan ${jumlah} preset animasi (tipe "${jenis}") untuk aplikasi penyusun video faceless, karakter gaya: ${vibe}.

Keluarkan HANYA JSON valid (tanpa penjelasan, tanpa blok kode) dengan struktur persis:
{"version":1,"presets":[{"nama":"...","tipe":"${jenis}","gerakan":"slide","arah":"bawah","durasi_ms":600,"easing":"ease_out","intensitas":100,"tag":["dramatis"]}]}

ATURAN:
- nama: bahasa Indonesia, menarik dan deskriptif
- tipe: selalu "${jenis}"
- gerakan: HANYA dari daftar ini: ${GERAKAN[jenis].join(", ")}
- arah: salah satu dari ${ARAH.join(", ")} (kosongkan string jika tidak relevan)
- durasi_ms: 150-3000
- easing: salah satu dari ${EASING.join(", ")}
- intensitas: 0-200
- tag: 1-3 dari: tenang, energik, dramatis, ceria, misterius, fokus`;
}

/* ══════════ Validator Preset ══════════ */

function validasiPreset(raw: string, jenis: JenisPreset): HasilPreset {
  /* Parser toleran yang sama dengan halaman Koleksi — tahan fence ganda, basa-basi, koma menggantung */
  const urai = uraiJSONToleran(raw);
  if (!urai.ok) {
    return { entri: [], kunci: JENIS_KUNCI[jenis], jenis, errorGlobal: urai.error };
  }
  const data = urai.data as Record<string, unknown>;
  const kunci = JENIS_KUNCI[jenis];
  const arr = (data[kunci] ?? data.presets ?? data.transitions ?? data.styles) as unknown;
  if (!Array.isArray(arr) || arr.length === 0) {
    const pesan: Record<typeof kunci, string> = {
      presets: '"presets"', transitions: '"transitions"', styles: '"styles"',
    };
    return { entri: [], kunci, jenis, errorGlobal: `JSON tidak berisi array ${pesan[kunci]}. Cek kembali template prompt.` };
  }

  const entri: EntriPreset[] = [];
  const tagSah = new Set<string>(MOODS);

  for (const item of arr) {
    const o = (item ?? {}) as Record<string, unknown>;
    const nama = String(o.nama ?? "").trim() || "(tanpa nama)";
    const alasanList: string[] = [];
    let diperbaiki = false;
    const bersih: Record<string, unknown> = { nama };

    if (jenis === "style") {
      const ukuranRaw = Number(o.ukuran ?? 56);
      const ukuran = clamp(Math.round(ukuranRaw), 24, 120);
      if (ukuran !== ukuranRaw) { diperbaiki = true; alasanList.push(`ukuran dipangkas ke ${ukuran}`); }
      const warnaTeks = /^#[0-9A-Fa-f]{6}$/.test(String(o.warna_teks ?? "")) ? String(o.warna_teks) : "#FFFFFF";
      if (warnaTeks !== o.warna_teks) { diperbaiki = true; alasanList.push("warna_teks tidak sah — pakai #FFFFFF"); }
      const warnaOutline = /^#[0-9A-Fa-f]{6}$/.test(String(o.warna_outline ?? "")) ? String(o.warna_outline) : "#000000";
      if (warnaOutline !== o.warna_outline) { diperbaiki = true; alasanList.push("warna_outline tidak sah — pakai #000000"); }
      const outline = clamp(Math.round(Number(o.tebal_outline ?? 0)), 0, 16);
      if (outline !== Number(o.tebal_outline)) { diperbaiki = true; alasanList.push(`tebal_outline dipangkas ke ${outline}`); }
      const posisi = POSISI.includes(String(o.posisi ?? "")) ? String(o.posisi) : "bawah";
      if (posisi !== o.posisi) { diperbaiki = true; alasanList.push(`posisi "${String(o.posisi ?? "")}" tidak sah — pakai bawah`); }
      bersih.font = String(o.font ?? "poppins_bold");
      Object.assign(bersih, { ukuran, warna_teks: warnaTeks, tebal_outline: outline, warna_outline: warnaOutline, posisi });
    } else {
      const gerSah = GERAKAN[jenis === "transisi" ? "transisi" : jenis];
      const gerakan = String(o.gerakan ?? "").trim().toLowerCase();
      if (!gerSah.includes(gerakan)) {
        entri.push({ nama, ringkas: `gerakan: ${gerakan || "(kosong)"}`, status: "ditolak", alasan: `gerakan "${gerakan}" tidak ada di daftar: ${gerSah.join(", ")}` });
        continue;
      }
      bersih.gerakan = gerakan;
      if (jenis !== "transisi") bersih.tipe = jenis;

      const arahRaw = String(o.arah ?? "").trim().toLowerCase();
      bersih.arah = arahRaw && ARAH.includes(arahRaw) ? arahRaw : "";

      const durasiRaw = Math.round(Number(o.durasi_ms ?? 500));
      const durasi = clamp(durasiRaw, 150, 3000);
      if (durasi !== durasiRaw) { diperbaiki = true; alasanList.push(`durasi_ms dipangkas ke ${durasi}`); }
      bersih.durasi_ms = durasi;

      const easing = EASING.includes(String(o.easing ?? "")) ? String(o.easing) : "ease_out";
      if (easing !== o.easing) { diperbaiki = true; alasanList.push("easing tidak sah — pakai ease_out"); }
      bersih.easing = easing;

      if (jenis !== "transisi") {
        const intensRaw = Math.round(Number(o.intensitas ?? 100));
        const intensitas = clamp(intensRaw, 0, 200);
        if (intensitas !== intensRaw) { diperbaiki = true; alasanList.push(`intensitas dipangkas ke ${intensitas}`); }
        bersih.intensitas = intensitas;
      }
    }

    const tagRaw = Array.isArray(o.tag) ? o.tag.map(t => String(t).toLowerCase()).filter(t => tagSah.has(t)).slice(0, 3) : [];
    if (tagRaw.length) bersih.tag = tagRaw;

    const ringkas = jenis === "style"
      ? `${bersih.font} · ${bersih.ukuran}px · ${bersih.warna_teks}`
      : `${bersih.gerakan}${bersih.arah ? " " + bersih.arah : ""} · ${bersih.durasi_ms}ms`;

    entri.push({
      nama, ringkas,
      status: diperbaiki ? "diperbaiki" : "valid",
      alasan: diperbaiki ? alasanList.join("; ") : undefined,
      bersih,
    });
  }
  return { entri, kunci, jenis };
}

/* ══════════ Komponen UI ══════════ */

const inputCls = "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500 min-h-[44px]";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400";
const btnUtama = "w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white active:opacity-80 min-h-[44px]";
const btnKedua = "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100 active:opacity-80 min-h-[44px]";

export default function GeneratorPage() {
  const [tab, setTab] = useState<"naskah" | "preset">("naskah");
  const [copied, setCopied] = useState("");

  const flash = async (teks: string, kunci: string) => {
    await salinTeks(teks);
    setCopied(kunci);
    setTimeout(() => setCopied(""), 1800);
  };

  /* ── state naskah ── */
  const [topik, setTopik] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [rasio, setRasio] = useState("9:16");
  const [durasi, setDurasi] = useState(60);
  const [jumlahScene, setJumlahScene] = useState(12);
  const [gaya, setGaya] = useState("santai edukatif");
  const [penonton, setPenonton] = useState("umum, usia 18-34");
  const [cta, setCta] = useState("ikutkan dan bagikan");
  const [hasilNaskah, setHasilNaskah] = useState<HasilNaskah | null>(null);
  const [pasteInfo, setPasteInfo] = useState("");
  const router = useRouter();
  const [kirimGalat, setKirimGalat] = useState("");
  const kirim = (mode: "ganti" | "tambah") => {
    if (rancanganJson) {
      if (kirimKeEditorJson(rancanganJson, mode)) router.push("/");
      else setKirimGalat("Penyimpanan browser penuh/dinonaktifkan — gunakan Salin JSON lalu Impor di editor.");
      return;
    }
    if (!hasilNaskah) return;
    if (kirimKeEditor(hasilNaskah, mode)) router.push("/");
    else setKirimGalat("Penyimpanan browser penuh/dinonaktifkan — gunakan Salin JSON lalu Impor di editor.");
  };

  const promptNaskah = useMemo(
    () => bangunPromptNaskah({
      topik: topik || "(isi topik)",
      platform, rasio, durasi, gaya, penonton: penonton || "umum", cta: cta || "ikutkan",
      jumlahScene,
    }),
    [topik, platform, rasio, durasi, gaya, penonton, cta, jumlahScene]
  );

  /* Tempel dari clipboard + urai sekali jepit — tombol di pojok kanan bawah (zona jempol kanan) */
  const tempelNaskah = async () => {
    const teks = await bacaClipboard();
    if (teks === null) { setPasteInfo("Browser menolak akses clipboard — tempel manual di kotak, lalu tekan Urai Naskah."); return; }
    if (!teks.trim()) { setPasteInfo("Clipboard masih kosong — salin dulu hasil AI."); return; }
    const el = document.getElementById("paste-naskah") as HTMLTextAreaElement | null;
    if (el) el.value = teks;
    setPasteInfo("");
    terapkanTeks(teks);
  };

  /* ── state preset ── */
  const [jenis, setJenis] = useState<JenisPreset>("in");
  const [jumlah, setJumlah] = useState(6);
  const [vibe, setVibe] = useState("sinematik, gelap, dramatis");
  const [hasilPreset, setHasilPreset] = useState<HasilPreset | null>(null);
  const [pasteInfoPreset, setPasteInfoPreset] = useState("");
  const [simpanInfo, setSimpanInfo] = useState("");

  const [modeRancangan, setModeRancangan] = useState(false);
  const [rancanganJson, setRancanganJson] = useState<string | null>(null);
  const [rancanganInfo, setRancanganInfo] = useState("");
  /* tempel: JSON rancangan (mode visual) atau naskah teks biasa */
  const terapkanTeks = (teks: string) => {
    const t = teks.trim();
    if (t.startsWith("{")) {
      try {
        const o = JSON.parse(t) as { scenes?: unknown[]; kebutuhan_baru?: unknown[] };
        if (!Array.isArray(o.scenes) || o.scenes.length === 0) throw new Error("tanpa scenes");
        const jumlahDurasi = (o.scenes as { durasi?: number }[]).reduce((a, s) => a + Number(s.durasi ?? 0), 0);
        setRancanganJson(t);
        setHasilNaskah(null);
        setRancanganInfo(`✓ JSON rancangan: ${o.scenes.length} scene · total ${jumlahDurasi} dtk · ${o.kebutuhan_baru?.length ?? 0} kebutuhan baru (masuk antrian)`);
        return;
      } catch {
        setRancanganInfo("JSON tidak valid — pastikan hasil AI hanya berisi JSON (tanpa teks tambahan).");
        return;
      }
    }
    setRancanganJson(null);
    setRancanganInfo("");
    setHasilNaskah(parseNaskah(teks, durasi));
  };
  const promptRancangan = useMemo(
    () => bangunPromptRancangan({
      topik: topik || "(isi topik)", platform, rasio, durasi, gaya, penonton: penonton || "umum", cta: cta || "ikutkan", jumlahScene,
    }),
    [topik, platform, rasio, durasi, gaya, penonton, cta, jumlahScene]
  );
  const promptAktif = modeRancangan ? promptRancangan : promptNaskah;
  const promptPreset = useMemo(() => bangunPromptPreset(jenis, jumlah, vibe || "beragam"), [jenis, jumlah, vibe]);

  const tempelPreset = async () => {
    const teks = await bacaClipboard();
    if (teks === null) { setPasteInfoPreset("Browser menolak akses clipboard — tempel manual di kotak, lalu tekan Validasi JSON."); return; }
    if (!teks.trim()) { setPasteInfoPreset("Clipboard masih kosong — salin dulu hasil AI."); return; }
    const el = document.getElementById("paste-preset") as HTMLTextAreaElement | null;
    if (el) el.value = teks;
    setPasteInfoPreset("");
    setSimpanInfo("");
    setHasilPreset(validasiPreset(teks, jenis));
  };

  const jsonNaskah = useMemo(() => {
    if (!hasilNaskah?.scenes.length) return "";
    return JSON.stringify({
      app: "wokCam Mobile",
      version: 1,
      dibuat: new Date().toISOString(),
      proyek: { judul: topik ? (topik.length > 80 ? topik.slice(0, 77).trimEnd() + "..." : topik) : "Tanpa Judul", platform, rasio, target_durasi: durasi },
      scenes: hasilNaskah.scenes.map(sc => ({
        no: sc.no, naskah: sc.naskah, teks: sc.teks, durasi: sc.durasi,
        mood: sc.mood, latar_id: sc.latarId, latar_en: sc.latarEn,
      })),
    }, null, 2);
  }, [hasilNaskah, topik, platform, rasio, durasi]);

  const jsonPresetBersih = useMemo(() => {
    if (!hasilPreset) return "";
    const ok = hasilPreset.entri.filter(e => e.bersih).map(e => e.bersih);
    return JSON.stringify({ version: 1, [hasilPreset.kunci]: ok }, null, 2);
  }, [hasilPreset]);

  const totalDurasi = hasilNaskah?.scenes.reduce((s, sc) => s + sc.durasi, 0) ?? 0;
  const totalKata = hasilNaskah?.scenes.reduce((s, sc) => s + sc.naskah.split(/\s+/).filter(Boolean).length, 0) ?? 0;
  const estBicara = Math.ceil(totalKata / 2.4);
  const jumlahValid = hasilPreset?.entri.filter(e => e.status !== "ditolak").length ?? 0;
  const adaScenePadat = hasilNaskah?.scenes.some(sc => sc.naskah.split(/\s+/).filter(Boolean).length / 2.4 > sc.durasi + 1) ?? false;

  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        {/* Header */}
        <div className="mb-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-violet-300">
            <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
            Prototype Tahap 0 — wokCam Mobile
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-extrabold">Generator Prompt AI</h1>
            <Link href="/koleksi" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-fuchsia-300 transition hover:border-fuchsia-500">
              📚 Koleksi Style →
            </Link>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Tahap 1 sebelum ke ChatGPT: susun prompt, salin, tempel hasilnya balik ke sini untuk divalidasi. Logika halaman ini yang nanti dipindah ke app Kotlin.
          </p>
        </div>

        {/* Tab */}
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5">
          {(["naskah", "preset"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`min-h-[44px] rounded-lg px-3 text-sm font-bold transition ${tab === t ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "text-zinc-400"}`}
            >
              {t === "naskah" ? "Generator Naskah" : "Generator Preset"}
            </button>
          ))}
        </div>

        {tab === "naskah" ? (
          <div className="space-y-5">
            {/* Form */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-300">1 · Isi Brief</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Topik video</label>
                  <input className={inputCls} value={topik} onChange={e => setTopik(e.target.value)}
                    placeholder="misal: 5 fakta menarik tentang lautan dalam" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Platform</label>
                    <select className={inputCls} value={platform} onChange={e => setPlatform(e.target.value)}>
                      {["TikTok", "YouTube Shorts", "Instagram Reels", "YouTube", "Feed Instagram"].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Rasio</label>
                    <select className={inputCls} value={rasio} onChange={e => setRasio(e.target.value)}>
                      {["9:16", "16:9", "1:1", "4:5"].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Target durasi total: {durasi} detik</label>
                  <input type="range" min={30} max={360} step={30} value={durasi}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setDurasi(v);
                      setJumlahScene(Math.max(3, Math.round(v / 5)));
                    }} className="w-full accent-violet-500" />
                  <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                    {[30, 60, 120, 180, 240, 300, 360].map(v => <span key={v}>{v >= 60 ? `${v / 60}m` : `${v}s`}</span>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Jumlah scene</label>
                    <input type="number" min={3} max={Math.max(3, Math.floor(durasi / 2))} value={jumlahScene}
                      onChange={e => setJumlahScene(Math.min(Math.max(3, Math.floor(durasi / 2)), Math.max(3, Number(e.target.value) || 3)))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Rata-rata per scene</label>
                    <div className={`${inputCls} flex items-center text-zinc-400`}>
                      ±{fmtDurasi(Math.round((durasi / Math.max(1, jumlahScene)) * 2) / 2)} detik
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Gaya bahasa</label>
                    <select className={inputCls} value={gaya} onChange={e => setGaya(e.target.value)}>
                      {["santai edukatif", "dramatis", "lucu", "formal", "storytelling"].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Target penonton</label>
                    <input className={inputCls} value={penonton} onChange={e => setPenonton(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Ajakan penutup (CTA)</label>
                  <input className={inputCls} value={cta} onChange={e => setCta(e.target.value)} />
                </div>
              </div>
            </section>

            {/* Prompt */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-300">2 · Salin Prompt ke ChatGPT/Claude</h2>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <button onClick={() => setModeRancangan(false)}
                  className={`min-h-[40px] rounded-lg text-xs font-bold ${!modeRancangan ? "bg-violet-600 text-white" : "border border-zinc-700 text-zinc-400"}`}>Naskah saja</button>
                <button onClick={() => setModeRancangan(true)}
                  className={`min-h-[40px] rounded-lg text-xs font-bold ${modeRancangan ? "bg-violet-600 text-white" : "border border-zinc-700 text-zinc-400"}`}>Rancangan visual (±50%)</button>
              </div>
              <textarea readOnly value={promptAktif} rows={10}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-300" />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">{promptAktif.length} karakter · {jumlahScene} scene{modeRancangan ? " · JSON lengkap" : ""}</span>
                <button onClick={() => flash(promptAktif, "pn")} className={`${btnUtama} max-w-[240px]`}>
                  {copied === "pn" ? "✓ Tersalin!" : "Salin Prompt"}
                </button>
              </div>
            </section>

            {/* Paste & parse */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-300">3 · Tempel Hasil AI</h2>
              <div className="relative">
                <textarea rows={8} id="paste-naskah"
                  placeholder={'=== SCENE 1 ===\nNASKAH: ...\nTEKS: ...\nDURASI: 4\nMOOD: misterius\nLATAR: ... | EN: ...'}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 pb-16 font-mono text-xs text-zinc-200 outline-none focus:border-violet-500"
                  onChange={e => setHasilNaskah(null)} />
                <button onClick={tempelNaskah}
                  className="absolute bottom-3 right-3 min-h-[44px] rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-xs font-bold text-white shadow-lg shadow-violet-950/60 transition active:scale-95">
                  📋 Tempel &amp; Urai
                </button>
              </div>
              {pasteInfo && <p className="mt-1 text-[11px] text-amber-400">{pasteInfo}</p>}
              <button
                onClick={() => {
                  const el = document.getElementById("paste-naskah") as HTMLTextAreaElement | null;
                  terapkanTeks(el?.value ?? "");
                }}
                className={`${btnUtama} mt-3`}
              >
                Urai Naskah
              </button>

              {hasilNaskah?.errorGlobal && (
                <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{hasilNaskah.errorGlobal}</p>
              )}

              {rancanganJson && (
                <div className="mt-3 space-y-2 rounded-lg border border-violet-500/40 bg-violet-500/10 p-3">
                  <p className="text-xs text-violet-200">{rancanganInfo}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => kirim("ganti")} className={btnUtama}>🚀 Kirim ke Editor</button>
                    <button onClick={() => kirim("tambah")} className={btnKedua}>➕ Tambah ke proyek</button>
                  </div>
                  {kirimGalat && <p className="text-[11px] text-red-400">{kirimGalat}</p>}
                </div>
              )}
              {hasilNaskah && !hasilNaskah.errorGlobal && hasilNaskah.scenes.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-2">
                      <div className={`text-lg font-extrabold ${hasilNaskah.scenes.length === jumlahScene ? "text-violet-300" : "text-amber-400"}`}>{hasilNaskah.scenes.length}</div>
                      <div className="text-[10px] uppercase text-zinc-500">scene{hasilNaskah.scenes.length === jumlahScene ? "" : ` (minta ${jumlahScene})`}</div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-2">
                      <div className="text-lg font-extrabold text-violet-300">{fmtDurasi(totalDurasi)}s</div>
                      <div className="text-[10px] uppercase text-zinc-500">total durasi</div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-2">
                      <div className="text-lg font-extrabold text-violet-300">{fmtDurasi(Math.abs(totalDurasi - durasi))}s</div>
                      <div className="text-[10px] uppercase text-zinc-500">selisih target</div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-2">
                      <div className={`text-lg font-extrabold ${totalDurasi > 0 && estBicara > totalDurasi * 1.2 ? "text-amber-400" : "text-violet-300"}`}>{fmtDurasi(estBicara)}s</div>
                      <div className="text-[10px] uppercase text-zinc-500">est. bicara TTS</div>
                    </div>
                  </div>
                  {adaScenePadat && (
                    <button onClick={() => hasilNaskah && setHasilNaskah(terapkanRitme(hasilNaskah, durasi))} className={`${btnKedua} w-full`}>
                      ⚡ Perbaiki Ritme — naikkan durasi scene yang naskahnya kepadatan berlebih
                    </button>
                  )}
                  <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl border border-zinc-800 p-2">
                    {hasilNaskah.scenes.map(sc => (
                      <div key={sc.no} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-violet-300">SCENE {sc.no}</span>
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">{fmtDurasi(sc.durasi)}s · {sc.mood}</span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-200">{sc.teks || sc.naskah}</p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">LATAR: {sc.latarId || "default"}{sc.latarEn ? ` · ${sc.latarEn}` : ""}</p>
                        {sc.catatan.map((c, i) => (
                          <p key={i} className={`mt-1 text-[11px] ${c.tipe === "error" ? "text-red-400" : c.tipe === "peringatan" ? "text-amber-400" : "text-zinc-500"}`}>
                            {c.tipe === "error" ? "✗ " : c.tipe === "peringatan" ? "⚠ " : "· "}{c.teks}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => kirim("ganti")} className={btnUtama}>🚀 Kirim ke Editor</button>
                    <button onClick={() => kirim("tambah")} className={btnKedua}>➕ Tambah ke proyek</button>
                  </div>
                  <p className="text-[11px] text-zinc-500">“Kirim” mengganti scene proyek aktif (bisa di-Undo di editor); “Tambah” menempelkannya di akhir.</p>
                  {kirimGalat && <p className="text-[11px] text-red-400">{kirimGalat}</p>}
                  {jsonNaskah && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => flash(jsonNaskah, "jn")} className={btnKedua}>
                        {copied === "jn" ? "✓ Tersalin!" : "Salin JSON"}
                      </button>
                      <button onClick={() => unduhBerkas("wokcam-proyek.json", jsonNaskah)} className={btnKedua}>
                        Unduh JSON
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Form preset */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-300">1 · Tentukan Paket</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Jenis paket</label>
                  <select className={inputCls} value={jenis} onChange={e => setJenis(e.target.value as JenisPreset)}>
                    {(Object.keys(JENIS_LABEL) as JenisPreset[]).map(k => <option key={k} value={k}>{JENIS_LABEL[k]}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Jumlah preset: {jumlah}</label>
                    <input type="range" min={4} max={12} value={jumlah}
                      onChange={e => setJumlah(Number(e.target.value))} className="w-full accent-violet-500" />
                  </div>
                  <div>
                    <label className={labelCls}>Karakter gaya</label>
                    <input className={inputCls} value={vibe} onChange={e => setVibe(e.target.value)} />
                  </div>
                </div>
                {jenis === "style" ? (
                  <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-[11px] leading-relaxed text-zinc-400">
                    Gaya teks: font bebas (mis. poppins_bold) · ukuran 24-120px · warna hex #RRGGBB ·
                    outline 0-16px · posisi: <span className="font-mono text-violet-300">atas, tengah, bawah</span>
                  </p>
                ) : (
                  <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-[11px] leading-relaxed text-zinc-400">
                    Gerakan sah: <span className="font-mono text-violet-300">{GERAKAN[jenis === "transisi" ? "transisi" : jenis].join(", ")}</span>
                  </p>
                )}
              </div>
            </section>

            {/* Prompt preset */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-300">2 · Salin Prompt ke ChatGPT/Claude</h2>
              <textarea readOnly value={promptPreset} rows={9}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-300" />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">{promptPreset.length} karakter</span>
                <button onClick={() => flash(promptPreset, "pp")} className={`${btnUtama} max-w-[240px]`}>
                  {copied === "pp" ? "✓ Tersalin!" : "Salin Prompt"}
                </button>
              </div>
            </section>

            {/* Paste & validasi */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-300">3 · Tempel JSON Hasil AI</h2>
              <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
                Setelah validasi, tiap preset yang layak langsung diberi <span className="font-semibold text-zinc-300">pratinjau gerakan/gaya</span> — cek dulu sebelum disimpan ke Koleksi.
              </p>
              <div className="relative">
                <textarea rows={7} id="paste-preset"
                  placeholder='{"version":1,"presets":[ ... ]}'
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 pb-16 font-mono text-xs text-zinc-200 outline-none focus:border-violet-500"
                  onChange={e => setHasilPreset(null)} />
                <button onClick={tempelPreset}
                  className="absolute bottom-3 right-3 min-h-[44px] rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-xs font-bold text-white shadow-lg shadow-violet-950/60 transition active:scale-95">
                  📋 Tempel &amp; Validasi
                </button>
              </div>
              {pasteInfoPreset && <p className="mt-1 text-[11px] text-amber-400">{pasteInfoPreset}</p>}
              <button
                onClick={() => {
                  const el = document.getElementById("paste-preset") as HTMLTextAreaElement | null;
                  setSimpanInfo("");
                  setHasilPreset(validasiPreset(el?.value ?? "", jenis));
                }}
                className={`${btnUtama} mt-3`}
              >
                Validasi JSON
              </button>

              {hasilPreset?.errorGlobal && (
                <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{hasilPreset.errorGlobal}</p>
              )}

              {hasilPreset && !hasilPreset.errorGlobal && hasilPreset.entri.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-zinc-400">
                    <span className="font-bold text-emerald-400">{jumlahValid} layak masuk</span>
                    {" · "}
                    <span className="font-bold text-amber-400">{hasilPreset.entri.filter(e => e.status === "diperbaiki").length} diperbaiki otomatis</span>
                    {" · "}
                    <span className="font-bold text-red-400">{hasilPreset.entri.filter(e => e.status === "ditolak").length} ditolak</span>
                  </p>
                  <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-zinc-800 p-2">
                    {hasilPreset.entri.map((e, i) => (
                      <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-zinc-100">{e.nama}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            e.status === "valid" ? "bg-emerald-500/15 text-emerald-400"
                            : e.status === "diperbaiki" ? "bg-amber-500/15 text-amber-400"
                            : "bg-red-500/15 text-red-400"}`}>
                            {e.status === "valid" ? "✓ valid" : e.status === "diperbaiki" ? "± diperbaiki" : "✗ ditolak"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500">{e.ringkas}</p>
                        {e.alasan && <p className="mt-1 text-[11px] text-amber-400/90">{e.alasan}</p>}
                        {e.bersih && e.status !== "ditolak" && (
                          <div className="mt-2">
                            <PratinjauBersih jenis={hasilPreset.jenis} data={e.bersih} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {jsonPresetBersih && jumlahValid > 0 && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => flash(jsonPresetBersih, "jp")} className={btnKedua}>
                          {copied === "jp" ? "✓ Tersalin!" : "Salin JSON Bersih"}
                        </button>
                        <button onClick={() => unduhBerkas(`wokcam-paket-${jenis}.json`, jsonPresetBersih)} className={btnKedua}>
                          Unduh Paket
                        </button>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            const bersih = hasilPreset.entri
                              .filter(e => e.bersih && e.status !== "ditolak")
                              .map(e => e.bersih as Record<string, unknown>);
                            const h = simpanEntriKeKoleksi(bersih, hasilPreset.kunci);
                            setSimpanInfo(
                              `${h.ditambah} preset baru masuk Koleksi Style` +
                              (h.duplikat ? ` · ${h.duplikat} duplikat dilewati` : "") +
                              (h.ditolak ? ` · ${h.ditolak} ditolak` : ""),
                            );
                          }}
                          className={`${btnUtama} w-full`}
                        >
                          💾 Simpan Semua ke Koleksi Style
                        </button>
                        {simpanInfo && (
                          <p className="mt-1 text-center text-[11px] text-emerald-400">
                            ✓ {simpanInfo} —{" "}
                            <Link href="/koleksi" className="font-bold underline">Lihat Koleksi →</Link>
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-zinc-600">
          Kontrak format di halaman ini identik dengan PRD wokCam Mobile v1.0 (Lampiran A-B).
        </p>
      </div>
    </main>
  );
}
