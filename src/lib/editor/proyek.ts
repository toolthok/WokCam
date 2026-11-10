/* ══════════ Model Proyek wokCam — kontrak tunggal (prototype web ⇄ app Kotlin) ══════════
 *
 * PERTANYAAN YANG DIJAWAB MODUL INI: "data timeline disimpan & diedit di mana?"
 *   - TANPA DATABASE (sesuai PRD): satu proyek = satu objek JSON kecil yang hidup di
 *     memori editor + localStorage "wokcam.proyek.v1" (autosave). Di app Kotlin nanti
 *     bentuknya persis: berkas JSON proyek di penyimpanan internal.
 *   - Field scene = kontrak naskah (no/naskah/teks/durasi/mood/latar) hasil parseNaskah,
 *     ditambah ASSIGNMENT: nama preset dari Koleksi Style (kontrak koleksi v1):
 *       animIn / animOut / animLoop → koleksi.presets (tipe in | out | loop)
 *       transisi                    → koleksi.transitions (dipasang di BATAS ke scene berikutnya)
 *       style                       → koleksi.styles (gaya teks di layar)
 *     ditambah HIASAN TAMPILAN (dulu terlupakan, kini bagian resmi kontrak):
 *       latarPreset → katalog LATAR_PRESET (tema latar belakang; null = otomatis dari mood)
 *       overlayId   → katalog OVERLAY_PRESET (efek di atas video; null = tanpa)
 *   - Semua fungsi di sini MURNI (tanpa React/zustand) supaya gampang diuji bun dan
 *     dipindah ke Kotlin hampir baris-per-baris.
 *
 * Alur masuk data: naskah AI ditempel → parseNaskah → dariHasilNaskah → scenes.
 * Alur keluar: proyekKeJSON → berkas/clipboard (penerus ekspor TSV Google Sheets yang lama).
 */

import { MOODS, parseNaskah, type HasilNaskah } from "@/lib/naskah-parser";
import { koleksiStore, type Koleksi } from "@/lib/preset-store";

/* ── Tipe ═══ */

export type SceneProyek = {
  id: string;
  naskah: string; // dibacakan TTS
  teks: string; // tampil di layar (boleh beranotasi: **tebal** / *miring*)
  durasi: number; // detik, 2-15 langkah 0,5 (kontrak DURASI)
  mood: string; // salah satu MOODS
  latarId: string; // kata kunci gambar Indonesia dari naskah AI (dipakai app Kotlin utk stok)
  latarEn: string; // kata kunci Inggris dari naskah AI (dipakai app Kotlin utk stok)
  /* hiasan tampilan — id dari katalog bawaan proyek ini (bukan koleksi user) */
  latarPreset: string | null; // id LATAR_PRESET — tema latar belakang; null = otomatis (gradien mood)
  overlayId: string | null; // id OVERLAY_PRESET — lapisan efek di atas video; null = tanpa
  kartu: string | null; // judul KARTU MENGAMBANG ala mockup (gaya video referensi); null = tanpa
  /* assignment nama preset koleksi — null = belum diatur / tanpa */
  animIn: string | null;
  animOut: string | null;
  animLoop: string | null;
  transisi: string | null; // batas scene INI → scene BERIKUTNYA
  style: string | null;
};

export type Proyek = {
  version: 1;
  judul: string;
  rasio: string; // "9:16" | "1:1" | "16:9"
  /* BRANDING persisten ala video referensi: badge pill di atas + tanda air di bawah,
   * tampil di SEMUA scene dan TIDAK ikut transisi (tetap diam saat scene berganti). */
  badge: string | null; // teks pill atas (mis. nama brand); null = tanpa
  watermark: string | null; // teks kecil bawah (mis. @handle); null = tanpa
  scenes: SceneProyek[];
};

export const DURASI_MIN = 2;
export const DURASI_MAKS = 15;
export const RASIO_LIST = ["9:16", "1:1", "16:9"] as const;
export type Rasio = (typeof RASIO_LIST)[number];

/* ── Util dasar ═══ */

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Angka durasi ke langkah 0,5 dtk lalu dijepit 2-15 (kontrak DURASI). */
export function clampDurasi(v: number): number {
  if (!Number.isFinite(v)) return DURASI_MIN;
  return clamp(Math.round(v * 2) / 2, DURASI_MIN, DURASI_MAKS);
}

export function fmtDurasi(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function fmtJam(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

let seq = 1000;
export function idBaru(): string {
  seq += 1;
  return `sc-${seq}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ── Katalog LATAR & OVERLAY (yang dulu terlupakan, kini resmi) ═══
 * LATAR: tema latar belakang per scene. Di prototype = gradien CSS; di app Kotlin
 * nanti `kataKunciEn` dipakai mencari gambar stok/AI sesuai kata kunci naskah.
 * null = "Otomatis" → gradien mengikuti mood scene (MOOD_GRADIENT).
 * OVERLAY: lapisan efek di ATAS video (teks & latar tetap di bawahnya). Semua
 * direalisasikan CSS murni + deterministik supaya gampang direplikasi di Compose.
 * Kedua katalog BAWAAN APLIKASI (bukan koleksi user) — sama seperti MOODS. */

export type LatarPreset = {
  id: string;
  nama: string;
  kelas: string;
  kataKunciEn: string;
  tekstur?: "grid" | null; // pola titik halus (gaya video referensi "paper grid")
  terang?: boolean; // latar terang → dekorasi gelap default dimatikan (teks gelap tetap terbaca)
};

export const LATAR_PRESET: LatarPreset[] = [
  { id: "malam-neon", nama: "Malam Neon", kelas: "from-fuchsia-600 via-purple-800 to-zinc-950", kataKunciEn: "neon city night" },
  { id: "senja-jogja", nama: "Senja Jogja", kelas: "from-amber-400 via-rose-600 to-purple-900", kataKunciEn: "tropical sunset" },
  { id: "pagi-bening", nama: "Pagi Bening", kelas: "from-sky-300 via-emerald-300 to-teal-600", kataKunciEn: "calm morning sky" },
  { id: "sawah-emerald", nama: "Sawah Emerald", kelas: "from-emerald-400 via-green-700 to-emerald-950", kataKunciEn: "green rice terrace" },
  { id: "laut-dalam", nama: "Laut Dalam", kelas: "from-blue-800 via-indigo-950 to-black", kataKunciEn: "deep ocean dark" },
  { id: "hutan-kabut", nama: "Hutan Kabut", kelas: "from-emerald-800 via-teal-900 to-zinc-950", kataKunciEn: "misty forest" },
  { id: "studio-gelap", nama: "Studio Gelap", kelas: "from-zinc-700 via-zinc-900 to-black", kataKunciEn: "dark studio backdrop" },
  { id: "kertas-terang", nama: "Kertas Terang", kelas: "from-zinc-100 via-zinc-200 to-zinc-400", kataKunciEn: "minimal paper texture", terang: true },
  { id: "kertas-grid", nama: "Kertas Grid", kelas: "from-zinc-100 via-zinc-200 to-zinc-300", kataKunciEn: "minimal dotted grid paper background", tekstur: "grid", terang: true },
  { id: "lava-dramatis", nama: "Lava Dramatis", kelas: "from-red-600 via-rose-900 to-zinc-950", kataKunciEn: "dramatic red smoke" },
  { id: "ungu-kuantum", nama: "Ungu Kuantum", kelas: "from-violet-500 via-violet-900 to-fuchsia-950", kataKunciEn: "abstract purple gradient" },
];

export function latarDariId(id: string | null): LatarPreset | null {
  if (!id) return null;
  return LATAR_PRESET.find((l) => l.id === id) ?? null;
}

/** Kelas gradien latar scene: preset dipilih → kelasnya; selain itu gradien mood. */
export function kelasLatar(latarPreset: string | null, mood: string): string {
  return latarDariId(latarPreset)?.kelas ?? gradientMood(mood);
}

export type OverlayPreset = { id: string; nama: string; deskripsi: string };

export const OVERLAY_PRESET: OverlayPreset[] = [
  { id: "vignette", nama: "Vinyet Sinema", deskripsi: "tepi gelap, fokus ke tengah" },
  { id: "grain", nama: "Butiran Film", deskripsi: "tekstur film analog halus" },
  { id: "letterbox", nama: "Bar Sinema", deskripsi: "hitam atas-bawah ala bioskop" },
  { id: "light-leak", nama: "Sorot Cahaya", deskripsi: "pendar hangat dari sudut" },
  { id: "bokeh", nama: "Bintik Bokeh", deskripsi: "titik cahaya melayang" },
  { id: "lower-third", nama: "Strip Bawah", deskripsi: "area gelap agar teks terbaca" },
  { id: "haze", nama: "Kabut Lembut", deskripsi: "kabut tipis merambat dari bawah" },
  { id: "progress", nama: "Progres Video", deskripsi: "garis kemajuan di tepi bawah" },
];

export function overlayDariId(id: string | null): OverlayPreset | null {
  if (!id) return null;
  return OVERLAY_PRESET.find((o) => o.id === id) ?? null;
}

/** Latar warna contoh per mood — pengganti visual stok di prototype (app asli pakai gambar). */
export const MOOD_GRADIENT: Record<string, string> = {
  tenang: "from-teal-500 via-emerald-600 to-teal-800",
  energik: "from-amber-400 via-orange-500 to-red-600",
  dramatis: "from-slate-600 via-zinc-800 to-zinc-950",
  ceria: "from-sky-400 via-fuchsia-500 to-pink-500",
  misterius: "from-violet-700 via-purple-900 to-zinc-950",
  fokus: "from-blue-500 via-indigo-600 to-slate-900",
};

export function gradientMood(mood: string): string {
  return MOOD_GRADIENT[mood] ?? MOOD_GRADIENT.fokus;
}

/** Mood luar daftar → "fokus" (prinsip toleran yang sama dengan parser; huruf besar/kecil diabaikan). */
export function moodAman(mood: string): string {
  const v = mood.trim().toLowerCase();
  return (MOODS as readonly string[]).includes(v) ? v : "fokus";
}

/* ── Teks beranotasi (gaya video referensi: penekanan campuran dalam satu blok) ═══
 * Penanda ringan: **kata** = tebal (hitam pekat, sedikit lebih besar), *kata* = miring
 * (abu — kata kunci). Tanpa penanda = normal. Murni string → mudah diuji & portabel;
 * di app Kotlin nanti parser yang sama menghasilkan SpanStyle. */

export type SegmenKata = { kata: string; gaya: "normal" | "tebal" | "miring" };

/** Urai teks beranotasi jadi daftar kata + gaya. Penanda tak berpasangan dibiarkan literal. */
export function uraiTeks(teks: string): SegmenKata[] {
  const hasil: SegmenKata[] = [];
  /* pecah dulu per segmen beranotasi (** ... lebih diutamakan daripada * ...), lalu tiap
   * segmen dipecah jadi kata — gaya menempel ke SEMUA kata dalam segmen itu */
  const bagian = teks.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  for (const bag of bagian) {
    if (!bag) continue;
    let gaya: SegmenKata["gaya"] = "normal";
    let isi = bag;
    if (/^\*\*[^*]+\*\*$/.test(bag)) {
      gaya = "tebal";
      isi = bag.slice(2, -2);
    } else if (/^\*[^*]+\*$/.test(bag)) {
      gaya = "miring";
      isi = bag.slice(1, -1);
    }
    for (const kata of isi.split(/\s+/)) {
      if (kata) hasil.push({ kata, gaya });
    }
  }
  /* tanda baca yang lepas dari penanda (mis. "**pratinjau**,") tidak boleh jadi kata
   * sendiri — tempel ke kata sebelumnya (atau berikutnya bila di awal) dan ikuti gayanya */
  const hanyaTanda = /^[^\p{L}\p{N}]+$/u;
  for (let i = hasil.length - 1; i >= 0; i--) {
    if (!hanyaTanda.test(hasil[i].kata)) continue;
    if (i > 0) {
      hasil[i - 1].kata += hasil[i].kata;
      hasil.splice(i, 1);
    } else if (hasil.length > 1) {
      hasil[1].kata = hasil[i].kata + hasil[1].kata;
      hasil.splice(i, 1);
    }
  }
  return hasil;
}

/** Teks tanpa penanda — untuk hitung kata VO/layar dan tampilan ringkas di timeline. */
export function teksTanpaMarker(teks: string): string {
  return teks
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── Timing ═══ */

export type Segmen = { scene: SceneProyek; index: number; mulai: number; dur: number };

/** Posisi tiap scene di timeline (detik) — scene berurutan, tidak bertumpuk. */
export function hitungTiming(scenes: SceneProyek[]): Segmen[] {
  let t = 0;
  return scenes.map((scene, index) => {
    const seg: Segmen = { scene, index, mulai: t, dur: scene.durasi };
    t += scene.durasi;
    return seg;
  });
}

export function totalDurasi(scenes: SceneProyek[]): number {
  return scenes.reduce((a, s) => a + s.durasi, 0);
}

export function sceneIndexDiWaktu(segs: Segmen[], t: number): number {
  const i = segs.findIndex((s) => t >= s.mulai && t < s.mulai + s.dur);
  return i >= 0 ? i : Math.max(0, segs.length - 1);
}

/* ── Operasi scene murni (dipakai store; mudah diuji) ═══ */

/** Pindahkan scene dari index `from` ke `to` — mengembalikan array baru. */
export function geserScene(arr: SceneProyek[], from: number, to: number): SceneProyek[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = [...arr];
  const [pindah] = next.splice(from, 1);
  next.splice(to, 0, pindah);
  return next;
}

/** Duplikat scene tepat setelah aslinya. */
export function duplikatScene(arr: SceneProyek[], id: string): { scenes: SceneProyek[]; idBaru_: string } | null {
  const i = arr.findIndex((s) => s.id === id);
  if (i < 0) return null;
  const salinan: SceneProyek = { ...arr[i], id: idBaru() };
  const next = [...arr];
  next.splice(i + 1, 0, salinan);
  return { scenes: next, idBaru_: salinan.id };
}

/** Hapus scene; kembalikan id terpilih berikutnya yang masuk akal. */
export function hapusScene(arr: SceneProyek[], id: string): { scenes: SceneProyek[]; pilih: string } | null {
  if (arr.length <= 1) return null;
  const i = arr.findIndex((s) => s.id === id);
  if (i < 0) return null;
  const next = arr.filter((s) => s.id !== id);
  const pilih = next[Math.min(i, next.length - 1)].id;
  return { scenes: next, pilih };
}

/* ── Pisah scene ═══ */

/** Kalimat dipecah di tanda baca akhir (.!?…) — dipakai pisah scene & buat scene baru. */
export function pisahTeks(teks: string): string[] {
  return teks
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .filter(Boolean);
}

/**
 * Pisah satu scene jadi dua: kalimat dibagi dua bagian seimbang,
 * durasi dibagi rata (langkah 0,5, min 2). Semua assignment disalin.
 */
export function pisahScene(arr: SceneProyek[], id: string): { scenes: SceneProyek[]; idBaru_: string } | null {
  const i = arr.findIndex((s) => s.id === id);
  if (i < 0) return null;
  const s = arr[i];
  const bagian = pisahTeks(s.naskah || s.teks);
  if (bagian.length < 2) return null;

  const tengah = Math.ceil(bagian.length / 2);
  const naskahA = bagian.slice(0, tengah).join(" ");
  const naskahB = bagian.slice(tengah).join(" ");

  const durA = clampDurasi(Math.round((s.durasi / 2) * 2) / 2);
  const durB = clampDurasi(s.durasi - durA);

  const a: SceneProyek = { ...s, naskah: naskahA, teks: s.teks || ringkasTeks(naskahA), durasi: durA };
  const b: SceneProyek = {
    ...s,
    id: idBaru(),
    naskah: naskahB,
    teks: ringkasTeks(naskahB),
    durasi: durB,
    animIn: null, // scene lanjutan tidak perlu animasi masuk ulang
    transisi: s.transisi, // batas ke scene berikutnya tetap di scene kedua
  };
  a.transisi = null; // batas baru A→B: belum ada transisi

  const next = [...arr];
  next.splice(i, 1, a);
  next.splice(i + 1, 0, b);
  return { scenes: next, idBaru_: b.id };
}

/** TEKS layar otomatis: kalimat pertama dipangkas ±8 kata. */
export function ringkasTeks(naskah: string, maks = 8): string {
  const kata = naskah.trim().split(/\s+/).filter(Boolean);
  if (!kata.length) return "";
  return kata.length <= maks ? kata.join(" ") : kata.slice(0, maks).join(" ") + "…";
}

/** Scene kosong untuk tombol "Tambah". */
export function sceneKosong(index: number): SceneProyek {
  const moods = (MOODS as readonly string[]).filter((m) => m !== "misterius");
  const mood = moods[index % moods.length];
  return {
    id: idBaru(),
    naskah: "",
    teks: "",
    durasi: 5,
    mood,
    latarId: "",
    latarEn: "",
    latarPreset: null,
    overlayId: null,
    kartu: null,
    animIn: null,
    animOut: null,
    animLoop: null,
    transisi: null,
    style: null,
  };
}

/* ── Dari naskah AI → timeline ═══ */

/** Hasil parseNaskah diubah jadi scene timeline (durasi dijepit, assignment masih kosong). */
export function dariHasilNaskah(hasil: HasilNaskah): SceneProyek[] {
  return hasil.scenes.map((sc) => ({
    id: idBaru(),
    naskah: sc.naskah,
    teks: sc.teks || ringkasTeks(sc.naskah),
    durasi: clampDurasi(sc.durasi),
    mood: moodAman(sc.mood),
    latarId: sc.latarId,
    latarEn: sc.latarEn,
    latarPreset: null,
    overlayId: null,
    kartu: null,
    animIn: null,
    animOut: null,
    animLoop: null,
    transisi: null,
    style: null,
  }));
}

/** Tempel teks naskah langsung → scenes (jalan pintas import). */
export function dariNaskahMentah(raw: string): SceneProyek[] {
  return dariHasilNaskah(parseNaskah(raw, null));
}

/* ── Proyek tutorial: contoh video terbaik sekaligus panduan pakai wokCam ═══
 * Pengganti "3 Kebiasaan Pagi": timeline yang dibuka user berisi SATU proyek utuh
 * yang (1) matang secara craft — hook → langkah → CTA, mood bervariasi, ritme 2,4
 * kata/dtk — dan (2) isinya MENGAJARKAN cara pakai wokCam (6 langkah alur kerja).
 *
 * V2 — TIRU GAYA VIDEO REFERENSI (promo tipografi terang ala opencode/insiderforce):
 *   - Latar konsisten "Kertas Grid" di SEMUA scene (branding konsisten seperti video
 *     referensi) + overlay yang BERGANTI tiap scene supaya ke-8 overlay tetap terpamerkan.
 *   - TEKS beranotasi **tebal** / *miring* — penekanan campuran khas video referensi.
 *   - animIn dominan "Kata Muncul Berturut" (kata-demi-kata) + kartu mengambang di
 *     scene langkah (pengganti screenshot mockup video referensi).
 *   - Transisi blur khas referensi; badge + tanda air persisten ala watermark.
 * Semua nama preset dari PAKET_PROMO — diverifikasi scripts/test-tutorial.ts. */

export const JUDUL_TUTORIAL = "Tutorial wokCam — 6 Langkah";
export const BADGE_TUTORIAL = "wokCam";
export const WATERMARK_TUTORIAL = "@wokcam";

export const NASKAH_TUTORIAL = `=== SCENE 1 ===
NASKAH: Ini wokCam, cara baru bikin video faceless tanpa wajah tanpa kamera. Enam langkah, semuanya dari HP.
TEKS: Bikin **video faceless** *tanpa kamera* wokCam!
DURASI: 7
MOOD: energik

=== SCENE 2 ===
NASKAH: Langkah satu, buka halaman Koleksi dan salin prompt bedah video yang tersedia di sana.
TEKS: Langkah 1: **Salin** prompt bedah video
DURASI: 6
MOOD: fokus

=== SCENE 3 ===
NASKAH: Langkah dua, tempel prompt itu ke ChatGPT dan minta naskah lengkap dengan format scene.
TEKS: Langkah 2: Tempel ke **ChatGPT**, minta naskah
DURASI: 6
MOOD: fokus

=== SCENE 4 ===
NASKAH: Langkah tiga, salin JSON jawaban ChatGPT lalu impor ke Koleksi. Gabung tanpa hilang satu item.
TEKS: Langkah 3: Impor **JSON** ke *koleksi* utuh
DURASI: 7
MOOD: fokus

=== SCENE 5 ===
NASKAH: Langkah empat, tulis naskah di Generator, lalu tempel hasilnya ke sini. Scene terbentuk otomatis.
TEKS: Langkah 4: Naskah jadi **scene** otomatis
DURASI: 6.5
MOOD: tenang

=== SCENE 6 ===
NASKAH: Langkah lima, hias tiap scene: seret urutan, pilih latar, overlay, animasi, dan gaya teks.
TEKS: Langkah 5: Hias **timeline**, pasang *animasi* & latar
DURASI: 6.5
MOOD: ceria

=== SCENE 7 ===
NASKAH: Langkah enam, tekan putar untuk pratinjau. Kalau sudah pas, rekam layar dan langsung unggah.
TEKS: Langkah 6: **Putar** pratinjau, *rekam* layar
DURASI: 6.5
MOOD: ceria

=== SCENE 8 ===
NASKAH: Proyek ini tersimpan otomatis tanpa database. Tekan Impor Naskah dan buat versimu sekarang.
TEKS: **Giliranmu!** Impor naskah, mulai *sekarang*
DURASI: 6.5
MOOD: energik`;

/* Assignment per scene tutorial (urutan = urutan scene). Nama preset PASTI ada di
 * PAKET_PROMO (lihat preset-store.ts) — diverifikasi test test-tutorial.ts.
 * Scene terakhir tanpa transisi (tidak ada scene berikutnya).
 * latarPreset konsisten "kertas-grid" (branding ala video referensi); overlayId BERGANTI
 * tiap scene supaya SEMUA 8 overlay tetap terpamerkan; kartu mengambang di 3 scene. */
export const TUTORIAL_ASSIGN: {
  animIn: string;
  animLoop: string;
  animOut: string;
  transisi: string | null;
  style: string;
  latarPreset: string;
  overlayId: string;
  kartu: string | null;
}[] = [
  { animIn: "Kata Muncul Berturut", animLoop: "Mockup Mengambang Santai", animOut: "Promo Memudar Bersih", transisi: "Blur Berganti Konten", style: "Judul Promo Hitam", latarPreset: "kertas-grid", overlayId: "grain", kartu: null },
  { animIn: "Kartu Promo Mengapung", animLoop: "Mockup Mengambang Santai", animOut: "Promo Memudar Bersih", transisi: "Geser Kartu Naik", style: "Caption Promo Bawah", latarPreset: "kertas-grid", overlayId: "progress", kartu: "Koleksi wokCam" },
  { animIn: "Kartu Promo Mengapung", animLoop: "Mockup Mengambang Santai", animOut: "Promo Memudar Bersih", transisi: "Blur Berganti Konten", style: "Caption Promo Bawah", latarPreset: "kertas-grid", overlayId: "haze", kartu: "ChatGPT" },
  { animIn: "Kata Muncul Berturut", animLoop: "Mockup Mengambang Santai", animOut: "Promo Memudar Bersih", transisi: "Blur Berganti Konten", style: "Teks Promo Sedang", latarPreset: "kertas-grid", overlayId: "vignette", kartu: null },
  { animIn: "Kartu Promo Mengapung", animLoop: "Mockup Mengambang Santai", animOut: "Promo Memudar Bersih", transisi: "Geser Kartu Naik", style: "Caption Promo Bawah", latarPreset: "kertas-grid", overlayId: "bokeh", kartu: "Generator Naskah" },
  { animIn: "Kata Muncul Berturut", animLoop: "Mockup Mengambang Santai", animOut: "Promo Memudar Bersih", transisi: "Blur Berganti Konten", style: "Teks Promo Sedang", latarPreset: "kertas-grid", overlayId: "letterbox", kartu: null },
  { animIn: "Kata Muncul Berturut", animLoop: "Mockup Mengambang Santai", animOut: "Promo Memudar Bersih", transisi: "Kabur Kilat Putih", style: "Teks Promo Sedang", latarPreset: "kertas-grid", overlayId: "lower-third", kartu: null },
  { animIn: "Kata Muncul Berturut", animLoop: "Mockup Mengambang Santai", animOut: "Promo Memudar Bersih", transisi: null, style: "Judul Promo Hitam", latarPreset: "kertas-grid", overlayId: "light-leak", kartu: null },
];

/** Proyek tutorial awal (dipakai store saat localStorage kosong & tombol "Muat ulang tutorial"). */
export function proyekTutorial(): Proyek {
  const scenes = dariNaskahMentah(NASKAH_TUTORIAL);
  return {
    version: 1,
    judul: JUDUL_TUTORIAL,
    rasio: "9:16",
    badge: BADGE_TUTORIAL,
    watermark: WATERMARK_TUTORIAL,
    scenes: scenes.map((s, i) => ({ ...s, ...(TUTORIAL_ASSIGN[i] ?? {}) })),
  };
}

/* ── Serialisasi proyek (penerus "database" — satu berkas JSON) ═══ */

export const KUNCI_PROYEK = "wokcam.proyek.v1";

export function proyekKeJSON(p: Proyek): string {
  return JSON.stringify(
    {
      version: 1,
      app: "wokCam",
      diperbarui: new Date().toISOString(),
      judul: p.judul,
      rasio: p.rasio,
      badge: p.badge,
      watermark: p.watermark,
      scenes: p.scenes.map((s, i) => ({
        no: i + 1,
        naskah: s.naskah,
        teks: s.teks,
        durasi: s.durasi,
        mood: s.mood,
        latar_id: s.latarId,
        latar_en: s.latarEn,
        latar_preset: s.latarPreset,
        overlay: s.overlayId,
        kartu: s.kartu,
        animasi: { in: s.animIn, out: s.animOut, loop: s.animLoop },
        transisi_ke_berikutnya: s.transisi,
        style: s.style,
      })),
    },
    null,
    2,
  );
}

export type HasilMuatJSON = { ok: true; proyek: Proyek } | { ok: false; error: string };

/** Muat JSON proyek (hasil ekspor app ini) — toleran tapi jelas kalau rusak. */
export function proyekDariJSON(raw: string): HasilMuatJSON {
  let o: unknown;
  try {
    o = JSON.parse(raw.trim().replace(/^\uFEFF/, ""));
  } catch {
    return { ok: false, error: "Bukan JSON valid — pastikan menempel berkas proyek yang diunduh dari app ini." };
  }
  if (!o || typeof o !== "object" || Array.isArray(o)) return { ok: false, error: "Struktur JSON tidak dikenali." };
  const obj = o as Record<string, unknown>;
  if (!Array.isArray(obj.scenes) || obj.scenes.length === 0) {
    return { ok: false, error: 'JSON tidak berisi array "scenes".' };
  }
  /* helper tingkat fungsi — dipakai di loop scene DAN untuk badge/watermark di akhir */
  const teksAman = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
  const scenes: SceneProyek[] = [];
  for (const item of obj.scenes) {
    const sc = (item ?? {}) as Record<string, unknown>;
    const anim = (sc.animasi ?? {}) as Record<string, unknown>;
    const nama = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    /* id latar/overlay harus anggota katalog — id asing/tak dikenal → null (toleran) */
    const anggota = (daftar: { id: string }[], v: unknown): string | null => {
      const s = nama(v);
      return s && daftar.some((d) => d.id === s) ? s : null;
    };
    /* Terima DUA bentuk: berkas ekspor (animasi:{in,out,loop}, transisi_ke_berikutnya)
     * dan autosave langsung (animIn/animOut/animLoop/transisi di level scene). */
    const dipilih = (bersarang: unknown, datar: unknown) => nama(bersarang) ?? nama(datar);
    scenes.push({
      id: idBaru(),
      naskah: String(sc.naskah ?? ""),
      teks: String(sc.teks ?? ""),
      durasi: clampDurasi(Number(sc.durasi ?? 5)),
      mood: moodAman(String(sc.mood ?? "fokus")),
      latarId: String(sc.latar_id ?? sc.latarId ?? ""),
      latarEn: String(sc.latar_en ?? sc.latarEn ?? ""),
      latarPreset: anggota(LATAR_PRESET, nama(sc.latar_preset) ?? nama(sc.latarPreset)),
      overlayId: anggota(OVERLAY_PRESET, nama(sc.overlay) ?? nama(sc.overlayId)),
      kartu: nama(sc.kartu),
      animIn: dipilih(anim.in, sc.animIn),
      animOut: dipilih(anim.out, sc.animOut),
      animLoop: dipilih(anim.loop, sc.animLoop),
      transisi: dipilih(sc.transisi_ke_berikutnya, sc.transisi),
      style: nama(sc.style),
    });
  }
  return {
    ok: true,
    proyek: {
      version: 1,
      judul: String(obj.judul ?? "Proyek Tanpa Judul"),
      rasio: (RASIO_LIST as readonly string[]).includes(String(obj.rasio)) ? String(obj.rasio) : "9:16",
      badge: teksAman(obj.badge) ?? teksAman(obj.lencana),
      watermark: teksAman(obj.watermark) ?? teksAman(obj.tanda_air),
      scenes,
    },
  };
}

/* ── Persistensi localStorage (autosave; aman di server/test) ═══ */

export function simpanProyek(p: Proyek): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KUNCI_PROYEK,
      JSON.stringify({ version: 1, judul: p.judul, rasio: p.rasio, badge: p.badge, watermark: p.watermark, scenes: p.scenes }),
    );
  } catch {
    /* penyimpanan penuh / mode privat — proyek tetap hidup di memori */
  }
}

export function muatProyek(): Proyek | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KUNCI_PROYEK);
    if (!raw) return null;
    const h = proyekDariJSON(raw);
    return h.ok ? h.proyek : null;
  } catch {
    return null;
  }
}

/* ══════════ Engine render pratinjau (dipakai PreviewCanvas) ══════════
 * Transisi = jendela di AKHIR scene: scene berikutnya menyusup di atas scene aktif.
 * Semua gaya fungsi murni dari q (0→1) supaya bisa diuji & gampang dipindah ke Compose. */

export type TransisiAktif = {
  presetArah: string;
  gerakan: string;
  durasi: number; // detik
  q: number; // progres 0..1
  indexA: number;
  indexB: number;
};

/** Transisi yang sedang berjalan pada waktu `t` (jika ada) — pakai preset batas scene A. */
export function transisiDiWaktu(scenes: SceneProyek[], koleksi: Koleksi, t: number): TransisiAktif | null {
  const segs = hitungTiming(scenes);
  const i = sceneIndexDiWaktu(segs, t);
  if (i >= segs.length - 1) return null;
  const batas = scenes[i].transisi;
  if (!batas) return null;
  const preset = koleksi.transitions.find((p) => p.nama === batas);
  if (!preset || preset.gerakan === "none") return null;
  const durasi = clamp(preset.durasi_ms / 1000, 0.15, 3);
  const segA = segs[i];
  const sisa = segA.mulai + segA.dur - t;
  if (sisa > durasi) return null;
  return {
    presetArah: preset.arah,
    gerakan: preset.gerakan,
    durasi,
    q: clamp(1 - sisa / durasi, 0, 1),
    indexA: i,
    indexB: i + 1,
  };
}

/* Transform layer scene A (keluar panggung) dan B (masuk) sesuai gerakan transisi.
   Amplitudo dalam % supaya pas untuk panggung berukuran apa pun. */

function transDari(arah: string, persen: number): string {
  switch (arah) {
    case "kiri": return `translateX(${-persen}%)`;
    case "kanan": return `translateX(${persen}%)`;
    case "atas": return `translateY(${-persen}%)`;
    default: return `translateY(${persen}%)`;
  }
}

export function gayaTransisiMasuk(gerakan: string, arah: string, q: number): React.CSSProperties {
  const e = 1 - Math.pow(1 - q, 3); // ease-out cubic
  switch (gerakan) {
    case "slide":
      return { transform: transDari(arah || "kiri", 100 * (1 - e)), opacity: 1 };
    case "wipe":
      return { clipPath: clipMasuk(arah || "kiri", q), opacity: 1 };
    case "zoom":
      return { transform: `scale(${(0.7 + 0.3 * e).toFixed(4)})`, opacity: e };
    case "flip":
      return { transform: `perspective(600px) rotateY(${(-90 * (1 - e)).toFixed(2)}deg)`, opacity: q > 0.5 ? 1 : 0 };
    case "blur":
      /* khas video referensi: scene baru muncul DARI KABUR ke jelas + sedikit membesar */
      return {
        filter: `blur(${(14 * (1 - e)).toFixed(2)}px)`,
        opacity: e,
        transform: `scale(${(0.97 + 0.03 * e).toFixed(4)})`,
      };
    case "none":
      return {};
    default: // crossfade
      return { opacity: e };
  }
}

export function gayaTransisiKeluar(gerakan: string, arah: string, q: number): React.CSSProperties {
  switch (gerakan) {
    case "slide":
      return { transform: transDari(arah || "kiri", 100 * q) };
    case "wipe":
      return {}; // A tetap; B menyapu di atasnya
    case "zoom":
      return { transform: `scale(${(1 + 0.25 * q).toFixed(4)})`, opacity: 1 - q };
    case "flip":
      return { transform: `perspective(600px) rotateY(${(-90 * q).toFixed(2)}deg)`, opacity: q > 0.5 ? 0 : 1 };
    case "blur":
      /* scene tua mengabur + sedikit membesar lalu lenyap (pasangan gayaTransisiMasuk) */
      return {
        filter: `blur(${(14 * q).toFixed(2)}px)`,
        opacity: 1 - q,
        transform: `scale(${(1 + 0.05 * q).toFixed(4)})`,
      };
    case "none":
      return {};
    default:
      return { opacity: 1 - q };
  }
}

/** clip-path untuk wipe: tepi pembersih berjalan sesuai arah; q 0 = tersembunyi. */
function clipMasuk(arah: string, q: number): string {
  const sisa = `${Math.round((1 - q) * 100)}%`;
  switch (arah) {
    case "kiri": return `inset(0 ${sisa} 0 0)`;
    case "kanan": return `inset(0 0 0 ${sisa})`;
    case "atas": return `inset(${sisa} 0 0 0)`;
    default: return `inset(0 0 ${sisa} 0)`;
  }
}

/** Gelombang suara deterministik untuk track estimasi VO. */
export function gelombangSuara(seed: number, count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const v = Math.abs(Math.sin(seed * 37.7 + i * 1.31) * Math.cos(i * 0.61 + seed * 0.3));
    out.push(0.18 + 0.82 * Math.pow(v, 0.8));
  }
  return out;
}
