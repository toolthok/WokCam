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
  teks: string; // tampil di layar
  durasi: number; // detik, 2-15 langkah 0,5 (kontrak DURASI)
  mood: string; // salah satu MOODS
  latarId: string; // kata kunci gambar Indonesia
  latarEn: string; // kata kunci Inggris (pencarian stok)
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

/* Naskah contoh — juga bukti parser: format === SCENE === ditempel persis seperti hasil AI. */
export const NASKAH_CONTOH = `=== SCENE 1 ===
NASKAH: Kebanyakan orang gagal bukan karena malas, tapi karena urutan pagi mereka salah.
TEKS: Urutan pagimu salah
DURASI: 6
MOOD: fokus
LATAR: meja kerja pagi jendela | EN: morning desk window

=== SCENE 2 ===
NASKAH: Kebiasaan pertama, bangun dan jangan sentuh HP sepuluh menit pertama. Otakmu jauh lebih tenang.
TEKS: 10 menit tanpa HP
DURASI: 6
MOOD: tenang
LATAR: ponsel tergeletak di meja | EN: phone on desk

=== SCENE 3 ===
NASKAH: Kebiasaan kedua, tulis tiga target terpenting sebelum jam sembilan pagi.
TEKS: Tulis 3 target
DURASI: 6
MOOD: fokus
LATAR: buku jurnal dan pena | EN: journal notebook pen

=== SCENE 4 ===
NASKAH: Kebiasaan ketiga, gerakkan badan lima belas menit supaya fokus sepanjang hari.
TEKS: Gerak 15 menit
DURASI: 6
MOOD: energik
LATAR: orang olahraga pagi di rooftop | EN: morning workout rooftop

=== SCENE 5 ===
NASKAH: Simpan video ini lalu coba besok pagi, dan ikuti untuk tips lainnya.
TEKS: Simpan & ikuti
DURASI: 5
MOOD: ceria
LATAR: jari menekan tombol ikon | EN: hand pressing button icon`

/** Proyek demo awal (dipakai store saat localStorage kosong). */
export function proyekContoh(): Proyek {
  return {
    version: 1,
    judul: "3 Kebiasaan Pagi",
    rasio: "9:16",
    scenes: dariNaskahMentah(NASKAH_CONTOH),
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
      scenes: p.scenes.map((s, i) => ({
        no: i + 1,
        naskah: s.naskah,
        teks: s.teks,
        durasi: s.durasi,
        mood: s.mood,
        latar_id: s.latarId,
        latar_en: s.latarEn,
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
  const scenes: SceneProyek[] = [];
  for (const item of obj.scenes) {
    const sc = (item ?? {}) as Record<string, unknown>;
    const anim = (sc.animasi ?? {}) as Record<string, unknown>;
    const nama = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
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
      scenes,
    },
  };
}

/* ── Persistensi localStorage (autosave; aman di server/test) ═══ */

export function simpanProyek(p: Proyek): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KUNCI_PROYEK, JSON.stringify({ version: 1, judul: p.judul, rasio: p.rasio, scenes: p.scenes }));
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
