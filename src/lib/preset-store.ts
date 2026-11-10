/* ══════════ Koleksi Style wokCam — kontrak tunggal (prototype web ⇄ app Kotlin) ══════════
 *
 * PERTANYAAN YANG DIJAWAB MODUL INI: "hasil animasi/style disimpan di mana?"
 *   - Format berkas SATU untuk semuanya (versi 1):
 *       { "version": 1, "diperbarui": ISO, "presets": [...], "transitions": [...], "styles": [...] }
 *     presets     = animasi teks/elemen, tipe "in" | "out" | "loop"
 *     transitions = transisi antar scene
 *     styles      = gaya teks/subtitle
 *   - Web sekarang : localStorage kunci "wokcam.koleksi.v1" + ekspor/impor berkas .json
 *   - App Kotlin   : berkas JSON yang SAMA — paket bawaan di-bundle di assets/,
 *                    koleksi buatan user di penyimpanan internal (TANPA database, sesuai PRD).
 *   - Impor 2 mode : "gabung" (default — item baru ditambah, duplikat dilewati) dan
 *                    "ganti" (isi koleksi diganti persis dari berkas; butuh ≥1 item valid).
 *   - Paket siap pakai: PAKET_HORROR (6 animasi) + PAKET_MINIMALIS (6 animasi · 4 transisi ·
 *                    4 style) + PAKET_PROMO (gaya video referensi tipografi terang) — satu
 *                    klik masuk koleksi.
 *                    Penggabungan TIDAK dilakukan lewat ChatGPT (terbukti kehilangan data) —
 *                    app-lah yang menggabung lewat kunci dedupe.
 *   - Prinsip parser sama dengan naskah-parser: "AI tempel + validasi toleran" —
 *     nilai di luar daftar tidak membuat import gagal, tapi diperbaiki + diberi catatan.
 *
 * Prompt Urai Video: template untuk membedah video referensi lewat ChatGPT
 * (lampirkan video/screenshot/deskripsi) sehingga hasilnya PERSIS format koleksi ini.
 */

import { MOODS } from "./naskah-parser";

/* ── Daftar tertutup (sumber tunggal — identik dengan halaman generator) ── */

export const TIPE_ANIMASI = ["in", "out", "loop"] as const;
export const GERAKAN_ANIMASI: Record<(typeof TIPE_ANIMASI)[number], string[]> = {
  /* "kata" = teks muncul KATA-DEMI-KATA (teknik khas video promo referensi) —
   * ditangani khusus renderer (tiap kata pop masuk berurutan), bukan keyframe blok. */
  in: ["fade", "slide", "zoom", "bounce", "wipe", "kata"],
  out: ["fade", "slide", "zoom", "shrink", "wipe"],
  loop: ["none", "zoom_in", "zoom_out", "pan_kiri", "pan_kanan", "pan_atas", "pan_bawah"],
};
/* "blur" = scene tua mengabur + memudar, scene baru muncul dari kabur ke jelas. */
export const GERAKAN_TRANSISI = ["none", "crossfade", "slide", "wipe", "zoom", "flip", "blur"];
export const EASING = ["linear", "ease_in", "ease_out", "ease_in_out", "spring"];
export const ARAH = ["kiri", "kanan", "atas", "bawah"];
export const POSISI = ["atas", "tengah", "bawah"];

/* ── Tipe data ═══ */

export type PresetAnimasi = {
  nama: string;
  tipe: (typeof TIPE_ANIMASI)[number];
  gerakan: string;
  arah: string;
  durasi_ms: number;
  easing: string;
  intensitas: number;
  tag: string[];
  sfx: string; // usulan efek suara (2-5 kata); "" jika tidak perlu — dipakai fase audio nanti
};
export type PresetTransisi = {
  nama: string;
  gerakan: string;
  arah: string;
  durasi_ms: number;
  easing: string;
  tag: string[];
  sfx: string;
};
export type PresetStyle = {
  nama: string;
  font: string;
  ukuran: number;
  warna_teks: string;
  tebal_outline: number;
  warna_outline: string;
  posisi: string;
  tag: string[];
};
export type Koleksi = {
  version: 1;
  diperbarui: string; // ISO timestamp
  presets: PresetAnimasi[];
  transitions: PresetTransisi[];
  styles: PresetStyle[];
};

export const KUNCI_KOLEKSI = "wokcam.koleksi.v1";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ── Paket bawaan: 6 preset pertama hasil uji video referensi (JSON yang dikirim user) ── */

export const PRESET_BAWAAN: PresetAnimasi[] = [
  { nama: "Kabut Perlahan Muncul", tipe: "in", gerakan: "fade", arah: "", durasi_ms: 1800, easing: "ease_in_out", intensitas: 80, tag: ["misterius", "tenang"], sfx: "" },
  { nama: "Bayangan Merayap dari Bawah", tipe: "in", gerakan: "slide", arah: "bawah", durasi_ms: 1200, easing: "ease_out", intensitas: 90, tag: ["misterius", "dramatis"], sfx: "" },
  { nama: "Tirai Gelap Tersingkap", tipe: "in", gerakan: "wipe", arah: "kanan", durasi_ms: 900, easing: "ease_in_out", intensitas: 110, tag: ["dramatis"], sfx: "" },
  { nama: "Sorotan Mendekat Tajam", tipe: "in", gerakan: "zoom", arah: "", durasi_ms: 1500, easing: "ease_in", intensitas: 130, tag: ["dramatis", "fokus"], sfx: "" },
  { nama: "Hantaman Teror Mendadak", tipe: "in", gerakan: "bounce", arah: "atas", durasi_ms: 500, easing: "spring", intensitas: 160, tag: ["energik", "dramatis"], sfx: "" },
  { nama: "Pintu Berderit Terbuka", tipe: "in", gerakan: "wipe", arah: "kiri", durasi_ms: 2200, easing: "linear", intensitas: 70, tag: ["misterius", "tenang"], sfx: "" },
];

export function koleksiBawaan(): Koleksi {
  return { version: 1, diperbarui: new Date(0).toISOString(), presets: PRESET_BAWAAN.map(p => ({ ...p, tag: [...p.tag] })), transitions: [], styles: [] };
}

/* ── Validasi toleran per kategori — mengembalikan entri bersih + catatan perbaikan ── */

type HasilValidasi<T> = { bersih: T | null; catatan: string[]; alasanTolak?: string };

function bersihkanTag(o: Record<string, unknown>): { tag: string[]; dicatat: string[] } {
  const sah = new Set<string>(MOODS);
  const mentah = Array.isArray(o.tag) ? o.tag.map(t => String(t).toLowerCase().trim()) : [];
  const tag = mentah.filter(t => sah.has(t)).slice(0, 3);
  const buang = mentah.filter(t => !sah.has(t));
  const dicatat = buang.length ? [`tag di luar daftar dibuang: ${buang.join(", ")}`] : [];
  return { tag, dicatat };
}

function bersihkanSfx(o: Record<string, unknown>): string {
  return String(o.sfx ?? "").trim().slice(0, 60);
}

export function validasiAnimasi(o: Record<string, unknown>): HasilValidasi<PresetAnimasi> {
  const catatan: string[] = [];
  const nama = String(o.nama ?? "").trim();
  if (!nama) return { bersih: null, catatan, alasanTolak: "nama kosong" };
  if (typeof o.nama !== "string" || o.nama !== nama) catatan.push("nama dirapikan");

  const tipeMentah = String(o.tipe ?? "in").trim().toLowerCase();
  const tipe = (TIPE_ANIMASI as readonly string[]).includes(tipeMentah)
    ? (tipeMentah as PresetAnimasi["tipe"])
    : "in";
  if (tipe !== tipeMentah) catatan.push(`tipe "${tipeMentah}" tidak dikenal — pakai "in"`);

  const gerMentah = String(o.gerakan ?? "").trim().toLowerCase();
  const gerSah = GERAKAN_ANIMASI[tipe];
  const gerakan = gerSah.includes(gerMentah) ? gerMentah : "fade";
  if (gerakan !== gerMentah) catatan.push(`gerakan "${gerMentah || "(kosong)"}" tidak ada untuk tipe ${tipe} — pakai "fade"`);

  const arahMentah = String(o.arah ?? "").trim().toLowerCase();
  const arah = ARAH.includes(arahMentah) ? arahMentah : "";
  if (arah !== arahMentah && arahMentah) catatan.push(`arah "${arahMentah}" tidak sah — dikosongkan`);

  const durasiMentah = Math.round(Number(o.durasi_ms ?? 600));
  const durasi = Number.isFinite(durasiMentah) ? clamp(durasiMentah, 150, 5000) : 600;
  if (durasi !== durasiMentah) catatan.push(`durasi_ms dipangkas ke ${durasi}`);

  const easMentah = String(o.easing ?? "").trim().toLowerCase();
  const easing = EASING.includes(easMentah) ? easMentah : "ease_in_out";
  if (easing !== easMentah) catatan.push(`easing "${easMentah || "(kosong)"}" tidak dikenal — pakai "ease_in_out"`);

  const intensMentah = Math.round(Number(o.intensitas ?? 100));
  const intensitas = Number.isFinite(intensMentah) ? clamp(intensMentah, 0, 200) : 100;
  if (intensitas !== intensMentah) catatan.push(`intensitas dipangkas ke ${intensitas}`);

  const { tag, dicatat } = bersihkanTag(o);
  catatan.push(...dicatat);

  return { bersih: { nama, tipe, gerakan, arah, durasi_ms: durasi, easing, intensitas, tag, sfx: bersihkanSfx(o) }, catatan };
}

export function validasiTransisi(o: Record<string, unknown>): HasilValidasi<PresetTransisi> {
  const catatan: string[] = [];
  const nama = String(o.nama ?? "").trim();
  if (!nama) return { bersih: null, catatan, alasanTolak: "nama kosong" };

  const gerMentah = String(o.gerakan ?? "").trim().toLowerCase();
  const gerakan = GERAKAN_TRANSISI.includes(gerMentah) ? gerMentah : "crossfade";
  if (gerakan !== gerMentah) catatan.push(`gerakan "${gerMentah || "(kosong)"}" tidak ada — pakai "crossfade"`);

  const arahMentah = String(o.arah ?? "").trim().toLowerCase();
  const arah = ARAH.includes(arahMentah) ? arahMentah : "";
  if (arah !== arahMentah && arahMentah) catatan.push(`arah "${arahMentah}" tidak sah — dikosongkan`);

  const durasiMentah = Math.round(Number(o.durasi_ms ?? 500));
  const durasi = Number.isFinite(durasiMentah) ? clamp(durasiMentah, 150, 3000) : 500;
  if (durasi !== durasiMentah) catatan.push(`durasi_ms dipangkas ke ${durasi}`);

  const easMentah = String(o.easing ?? "").trim().toLowerCase();
  const easing = EASING.includes(easMentah) ? easMentah : "ease_in_out";
  if (easing !== easMentah) catatan.push(`easing "${easMentah || "(kosong)"}" tidak dikenal — pakai "ease_in_out"`);

  const { tag, dicatat } = bersihkanTag(o);
  catatan.push(...dicatat);

  return { bersih: { nama, gerakan, arah, durasi_ms: durasi, easing, tag, sfx: bersihkanSfx(o) }, catatan };
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function validasiStyle(o: Record<string, unknown>): HasilValidasi<PresetStyle> {
  const catatan: string[] = [];
  const nama = String(o.nama ?? "").trim();
  if (!nama) return { bersih: null, catatan, alasanTolak: "nama kosong" };

  const font = String(o.font ?? "").trim() || "poppins_bold";
  if (!String(o.font ?? "").trim()) catatan.push('font kosong — pakai "poppins_bold"');

  const ukuranMentah = Math.round(Number(o.ukuran ?? 56));
  const ukuran = Number.isFinite(ukuranMentah) ? clamp(ukuranMentah, 24, 120) : 56;
  if (ukuran !== ukuranMentah) catatan.push(`ukuran dipangkas ke ${ukuran}`);

  const warnaTeks = HEX.test(String(o.warna_teks ?? "")) ? String(o.warna_teks) : "#FFFFFF";
  if (warnaTeks !== o.warna_teks) catatan.push("warna_teks tidak sah — pakai #FFFFFF");
  const warnaOutline = HEX.test(String(o.warna_outline ?? "")) ? String(o.warna_outline) : "#000000";
  if (warnaOutline !== o.warna_outline) catatan.push("warna_outline tidak sah — pakai #000000");

  const outlineMentah = Math.round(Number(o.tebal_outline ?? 0));
  const tebal = Number.isFinite(outlineMentah) ? clamp(outlineMentah, 0, 16) : 0;
  if (tebal !== outlineMentah) catatan.push(`tebal_outline dipangkas ke ${tebal}`);

  const posMentah = String(o.posisi ?? "").trim().toLowerCase();
  const posisi = POSISI.includes(posMentah) ? posMentah : "bawah";
  if (posisi !== posMentah) catatan.push(`posisi "${posMentah || "(kosong)"}" tidak dikenal — pakai "bawah"`);

  const { tag, dicatat } = bersihkanTag(o);
  catatan.push(...dicatat);

  return { bersih: { nama, font, ukuran, warna_teks: warnaTeks, tebal_outline: tebal, warna_outline: warnaOutline, posisi, tag }, catatan };
}

/* ── Kunci deduplikasi: kategori + nama + ciri khas (gerakan/font) ── */

export function kunciDedupe(kategori: "presets" | "transitions" | "styles", o: Record<string, unknown>): string {
  const ciri = kategori === "styles" ? o.font : o.gerakan;
  return `${kategori}|${String(o.nama ?? "").toLowerCase()}|${String(ciri ?? "")}`;
}

/* ── Urai JSON keluaran AI (ChatGPT/Claude/Gemini) secara toleran ──
 * "Bukan JSON valid" hanya boleh untuk kerusakan sungguhan. Ikon salin AI menghasilkan
 * bentuk yang bermacam-macam, jadi pencarian berlapis:
 *   1. bersihkan karakter halus (BOM, zero-width, NBSP) yang ikut saat menyalin
 *   2. kumpulkan kandidat: tiap blok fence ```…``` → seluruh teks → potongan kurung
 *      seimbang dari tiap { / [ (tahan basa-basi berisi kurung yang ikut tersalin)
 *   3. tiap kandidat dicoba: apa adanya → tanpa komentar → tanpa koma menggantung → keduanya
 *   4. kandidat yang tampak seperti paket (punya array presets/transitions/styles, atau array
 *      polos) langsung menang; jika tak ada, pakai objek/array pertama yang berhasil diurai */

function bersihkanKarakterHalus(s: string): string {
  return s.replace(/\uFEFF/g, "").replace(/[\u00A0\u2007\u202F\u200B-\u200D\u2060]/g, " ");
}

function buangKomentar(s: string): string {
  let out = "";
  let dalamString = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i], d = s[i + 1];
    if (dalamString) {
      out += c;
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') dalamString = false;
      continue;
    }
    if (c === '"') { dalamString = true; out += c; continue; }
    if (c === "/" && d === "/") { while (i < s.length && s[i] !== "\n") i++; out += " "; continue; }
    if (c === "/" && d === "*") { i += 2; while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++; i++; out += " "; continue; }
    out += c;
  }
  return out;
}

function buangKomaMenggantung(s: string): string {
  return s.replace(/,(\s*[}\]])/g, "$1");
}

/* Potong kurung seimbang dari posisi awal — sadar string, jadi { di dalam nilai teks aman */
function potongSeimbangDari(s: string, awal: number): string | null {
  const buka = s[awal];
  const tutup = buka === "{" ? "}" : buka === "[" ? "]" : null;
  if (!tutup) return null;
  let kedalaman = 0, dalamString = false, escape = false;
  for (let i = awal; i < s.length; i++) {
    const c = s[i];
    if (dalamString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') dalamString = false;
      continue;
    }
    if (c === '"') { dalamString = true; continue; }
    if (c === buka) kedalaman++;
    else if (c === tutup) {
      kedalaman--;
      if (kedalaman === 0) return s.slice(awal, i + 1);
    }
  }
  return null; // tidak seimbang — balasan terpotong
}

export function tampakSepertiPaket(data: unknown): boolean {
  /* Array polos hanya dihitung paket bila isinya OBJEK (preset) — bukan array kecil dalam
   * nilai JSON (mis. ["tenang","fokus"]) yang bisa ikut terselamatkan dari balasan terpotong */
  if (Array.isArray(data)) return data.some(x => x && typeof x === "object");
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (["presets", "transitions", "styles"] as const).some(k => Array.isArray(o[k]));
}

function kandidatJSON(teks: string): string[] {
  const set = new Set<string>();
  for (const f of teks.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
    if (f[1]?.trim()) set.add(f[1].trim());
  }
  set.add(teks.trim());
  const posisi = [...teks.matchAll(/[{\[]/g)].map(m => m.index ?? -1).filter(i => i >= 0).slice(0, 30);
  for (const p of posisi) {
    const potong = potongSeimbangDari(teks, p);
    if (potong && potong.length > 2) set.add(potong);
  }
  set.delete("");
  return [...set];
}

export type HasilUraiJSON = { ok: true; data: unknown } | { ok: false; error: string };

export function uraiJSONToleran(raw: string): HasilUraiJSON {
  const teks = bersihkanKarakterHalus(raw.trim());
  if (!teks) return { ok: false, error: "Tempelan masih kosong — salin dulu hasil AI." };

  let fallback: unknown = null;
  let pesanGagal = "";
  let adaTerpotong = false;

  for (const kandidat of kandidatJSON(teks)) {
    const tanpaKomentar = buangKomentar(kandidat);
    const calon = [kandidat, tanpaKomentar, buangKomaMenggantung(kandidat), buangKomaMenggantung(tanpaKomentar)]
      .filter((v, i, a) => a.indexOf(v) === i);
    for (const c of calon) {
      let hasil: unknown;
      try { hasil = JSON.parse(c); } catch (e) {
        pesanGagal = e instanceof Error ? e.message : String(e);
        /* Tanda balasan terpotong: pesan engine ATAU kurung/string yang tidak seimbang
         * (pesan beda-beda: V8 "Unexpected end", JSC "Unexpected EOF" / "Unterminated string") */
        const awalKurung = kandidat.search(/[{\[]/);
        if (/unexpected (end|eof)|unterminated/i.test(pesanGagal) ||
            (awalKurung >= 0 && potongSeimbangDari(kandidat, awalKurung) === null)) {
          adaTerpotong = true;
        }
        continue;
      }
      if (tampakSepertiPaket(hasil)) return { ok: true, data: hasil };
      if (fallback === null && hasil && typeof hasil === "object" && !Array.isArray(hasil)) fallback = hasil;
    }
  }

  /* Balasan terpotong = kerusakan utama: jangan selamatkan potongan dalam — minta user salin ulang */
  if (fallback !== null && !adaTerpotong) return { ok: true, data: fallback };

  if (!/[{\[]/.test(teks)) {
    return {
      ok: false,
      error: 'Respons AI tidak mengandung JSON (tidak ada tanda { atau [). Kemungkinan JSON-nya terpisah di artifact/canvas — klik ikon salin tepat pada blok JSON-nya, atau minta AI: "tulis JSON langsung di pesan". Lalu tempel ulang di sini.',
    };
  }
  const petunjuk = adaTerpotong
    ? " Balasan tampak TERPOTONG — salin sampai kurung penutup terakhir } atau ]."
    : pesanGagal
      ? ` Detail: ${pesanGagal}.`
      : "";
  return {
    ok: false,
    error: `JSON ditemukan tapi gagal diurai.${petunjuk} Salin SELURUH balasan AI (diawali { dan diakhiri }), lalu tempel ulang.`,
  };
}

/* ── Impor toleran: terima fence markdown (berapa pun), basa-basi, {presets}, {transitions}, {styles}, atau array polos ── */

export type HasilImporKoleksi = {
  koleksi: Koleksi;
  ditambah: number;
  duplikat: number;
  ditolak: number;
  catatan: string[];
  errorGlobal?: string;
};

export function imporKeKoleksi(koleksiLama: Koleksi, raw: string, mode: "gabung" | "ganti" = "gabung"): HasilImporKoleksi {
  const t = raw.trim();
  if (!t) return { koleksi: koleksiLama, ditambah: 0, duplikat: 0, ditolak: 0, catatan: [], errorGlobal: "Kotak tempel masih kosong." };

  const urai = uraiJSONToleran(t);
  if (!urai.ok) {
    return { koleksi: koleksiLama, ditambah: 0, duplikat: 0, ditolak: 0, catatan: [], errorGlobal: urai.error };
  }
  const data = urai.data;

  const kumpul: Record<"presets" | "transitions" | "styles", unknown[]> = { presets: [], transitions: [], styles: [] };
  if (Array.isArray(data)) {
    kumpul.presets = data; // array polos → dianggap animasi (bentuk paket dari generator preset "in")
  } else if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k of ["presets", "transitions", "styles"] as const) {
      if (Array.isArray(o[k])) kumpul[k] = o[k];
    }
  } else {
    return { koleksi: koleksiLama, ditambah: 0, duplikat: 0, ditolak: 0, catatan: [], errorGlobal: "Struktur JSON tidak dikenali." };
  }
  /* Penjaga kosong untuk SEMUA bentuk (termasuk array polos kosong) — impor tanpa item = error, bukan diam */
  if (kumpul.presets.length + kumpul.transitions.length + kumpul.styles.length === 0) {
    return { koleksi: koleksiLama, ditambah: 0, duplikat: 0, ditolak: 0, catatan: [], errorGlobal: 'JSON tidak berisi item "presets", "transitions", atau "styles".' };
  }

  const kosongDariNol = mode === "ganti";
  const koleksi: Koleksi = {
    version: 1,
    diperbarui: new Date().toISOString(),
    presets: kosongDariNol ? [] : koleksiLama.presets.map(p => ({ ...p, tag: [...p.tag] })),
    transitions: kosongDariNol ? [] : koleksiLama.transitions.map(p => ({ ...p, tag: [...p.tag] })),
    styles: kosongDariNol ? [] : koleksiLama.styles.map(p => ({ ...p, tag: [...p.tag] })),
  };

  const terpakai = new Set<string>([
    ...koleksi.presets.map(p => kunciDedupe("presets", p as unknown as Record<string, unknown>)),
    ...koleksi.transitions.map(p => kunciDedupe("transitions", p as unknown as Record<string, unknown>)),
    ...koleksi.styles.map(p => kunciDedupe("styles", p as unknown as Record<string, unknown>)),
  ]);

  let ditambah = 0, duplikat = 0, ditolak = 0;
  const catatan: string[] = [];
  const catat = (s: string) => { if (catatan.length < 24 && !catatan.includes(s)) catatan.push(s); };

  for (const item of kumpul.presets) {
    const o = (item ?? {}) as Record<string, unknown>;
    const h = validasiAnimasi(o);
    if (!h.bersih) { ditolak++; catat(`animasi "${String(o.nama ?? "(tanpa nama)")}" ditolak: ${h.alasanTolak}`); continue; }
    const kunci = kunciDedupe("presets", h.bersih as unknown as Record<string, unknown>);
    if (terpakai.has(kunci)) { duplikat++; continue; }
    terpakai.add(kunci);
    koleksi.presets.push(h.bersih);
    ditambah++;
    h.catatan.forEach(c => catat(`${h.bersih!.nama}: ${c}`));
  }
  for (const item of kumpul.transitions) {
    const o = (item ?? {}) as Record<string, unknown>;
    const h = validasiTransisi(o);
    if (!h.bersih) { ditolak++; catat(`transisi "${String(o.nama ?? "(tanpa nama)")}" ditolak: ${h.alasanTolak}`); continue; }
    const kunci = kunciDedupe("transitions", h.bersih as unknown as Record<string, unknown>);
    if (terpakai.has(kunci)) { duplikat++; continue; }
    terpakai.add(kunci);
    koleksi.transitions.push(h.bersih);
    ditambah++;
    h.catatan.forEach(c => catat(`${h.bersih!.nama}: ${c}`));
  }
  for (const item of kumpul.styles) {
    const o = (item ?? {}) as Record<string, unknown>;
    const h = validasiStyle(o);
    if (!h.bersih) { ditolak++; catat(`style "${String(o.nama ?? "(tanpa nama)")}" ditolak: ${h.alasanTolak}`); continue; }
    const kunci = kunciDedupe("styles", h.bersih as unknown as Record<string, unknown>);
    if (terpakai.has(kunci)) { duplikat++; continue; }
    terpakai.add(kunci);
    koleksi.styles.push(h.bersih);
    ditambah++;
    h.catatan.forEach(c => catat(`${h.bersih!.nama}: ${c}`));
  }

  if (mode === "ganti" && ditambah === 0) {
    return {
      koleksi: koleksiLama, ditambah: 0, duplikat, ditolak, catatan,
      errorGlobal: "Mode ganti dibatalkan: tidak ada item valid pada JSON ini — koleksi lama tidak diubah.",
    };
  }

  return { koleksi, ditambah, duplikat, ditolak, catatan };
}

/* ── Paket siap pakai — hasil uji bedah video referensi, satu klik masuk koleksi ──
 * PAKET_MINIMALIS = keluaran asli ChatGPT dari video referensi bergaya screenshot/editorial
 * (JSON yang dikirim user). Nilai disimpan persis; impor memvalidasi ulang tanpa mengubah. */

export type PaketBawaan = { presets: PresetAnimasi[]; transitions: PresetTransisi[]; styles: PresetStyle[] };

export const PAKET_MINIMALIS: PaketBawaan = {
  presets: [
    { nama: "Teks Minimalis Muncul", tipe: "in", gerakan: "fade", arah: "", durasi_ms: 600, easing: "ease_out", intensitas: 85, tag: ["tenang", "fokus"], sfx: "whoosh lembut" },
    { nama: "Judul Bergeser Elegan", tipe: "in", gerakan: "slide", arah: "atas", durasi_ms: 700, easing: "ease_out", intensitas: 75, tag: ["fokus", "tenang"], sfx: "swipe halus" },
    { nama: "Kartu Screenshot Mengambang", tipe: "in", gerakan: "zoom", arah: "", durasi_ms: 800, easing: "ease_out", intensitas: 90, tag: ["fokus"], sfx: "pop lembut" },
    { nama: "Elemen Menghilang Perlahan", tipe: "out", gerakan: "fade", arah: "", durasi_ms: 450, easing: "ease_in", intensitas: 80, tag: ["tenang"], sfx: "whoosh pendek" },
    { nama: "Gerakan Kamera Halus", tipe: "loop", gerakan: "zoom_in", arah: "", durasi_ms: 3000, easing: "ease_in_out", intensitas: 25, tag: ["tenang", "fokus"], sfx: "" },
    { nama: "Logo Melayang Lembut", tipe: "loop", gerakan: "pan_kanan", arah: "", durasi_ms: 3000, easing: "ease_in_out", intensitas: 20, tag: ["tenang"], sfx: "" },
  ],
  transitions: [
    { nama: "Perpindahan Putih Bersih", gerakan: "crossfade", arah: "", durasi_ms: 450, easing: "ease_in_out", tag: ["tenang", "fokus"], sfx: "whoosh lembut" },
    { nama: "Geser Antar Konten", gerakan: "slide", arah: "atas", durasi_ms: 400, easing: "ease_in_out", tag: ["fokus"], sfx: "swipe pendek" },
    { nama: "Zoom Pergantian Screenshot", gerakan: "zoom", arah: "", durasi_ms: 500, easing: "ease_out", tag: ["energik", "fokus"], sfx: "pop digital" },
    { nama: "Fade Putih Minimalis", gerakan: "crossfade", arah: "", durasi_ms: 650, easing: "ease_in_out", tag: ["tenang"], sfx: "desir halus" },
  ],
  styles: [
    { nama: "Tipografi Editorial Minimalis", font: "montserrat_black", ukuran: 56, warna_teks: "#171717", tebal_outline: 0, warna_outline: "#FFFFFF", posisi: "tengah", tag: ["fokus", "tenang"] },
    { nama: "Judul Tebal Kontras", font: "poppins_bold", ukuran: 64, warna_teks: "#111111", tebal_outline: 0, warna_outline: "#FFFFFF", posisi: "tengah", tag: ["fokus", "energik"] },
    { nama: "Teks Penjelasan Ringkas", font: "poppins_bold", ukuran: 32, warna_teks: "#333333", tebal_outline: 0, warna_outline: "#FFFFFF", posisi: "bawah", tag: ["tenang", "fokus"] },
    { nama: "Label Logo dan Branding", font: "montserrat_black", ukuran: 28, warna_teks: "#FFFFFF", tebal_outline: 0, warna_outline: "#FFFFFF", posisi: "atas", tag: ["tenang"] },
  ],
};

export const PAKET_HORROR: PaketBawaan = {
  presets: PRESET_BAWAAN.map(p => ({ ...p, tag: [...p.tag] })),
  transitions: [],
  styles: [],
};

/* PAKET_PROMO — hasil bedah video referensi "promo tipografi terang" (opencode/insiderforce
 * style): latar putih bersih, teks muncul KATA-DEMI-KATA dengan penekanan campuran
 * (tebal / miring via penanda bintang), kartu mockup melayang, badge + tanda air persisten,
 * transisi blur. Preset "Kata Muncul Berturut" = gerakan "kata" (renderer khusus). */
export const PAKET_PROMO: PaketBawaan = {
  presets: [
    { nama: "Kata Muncul Berturut", tipe: "in", gerakan: "kata", arah: "", durasi_ms: 2400, easing: "ease_out", intensitas: 100, tag: ["tenang", "fokus"], sfx: "tik tipis" },
    { nama: "Kartu Promo Mengapung", tipe: "in", gerakan: "slide", arah: "bawah", durasi_ms: 650, easing: "ease_out", intensitas: 70, tag: ["fokus", "tenang"], sfx: "swish kertas" },
    { nama: "Promo Memudar Bersih", tipe: "out", gerakan: "fade", arah: "", durasi_ms: 420, easing: "ease_in", intensitas: 80, tag: ["tenang"], sfx: "desir halus" },
    { nama: "Mockup Mengambang Santai", tipe: "loop", gerakan: "pan_atas", arah: "", durasi_ms: 3600, easing: "ease_in_out", intensitas: 15, tag: ["tenang"], sfx: "" },
  ],
  transitions: [
    { nama: "Blur Berganti Konten", gerakan: "blur", arah: "", durasi_ms: 520, easing: "ease_in_out", tag: ["fokus", "tenang"], sfx: "whoosh blur" },
    { nama: "Kabur Kilat Putih", gerakan: "blur", arah: "", durasi_ms: 700, easing: "ease_in_out", tag: ["tenang"], sfx: "desir lembut" },
    { nama: "Geser Kartu Naik", gerakan: "slide", arah: "atas", durasi_ms: 420, easing: "ease_in_out", tag: ["fokus"], sfx: "swipe pendek" },
  ],
  styles: [
    { nama: "Judul Promo Hitam", font: "sf_black", ukuran: 72, warna_teks: "#111111", tebal_outline: 0, warna_outline: "#FFFFFF", posisi: "tengah", tag: ["fokus", "energik"] },
    { nama: "Teks Promo Sedang", font: "sf_bold", ukuran: 46, warna_teks: "#27272a", tebal_outline: 0, warna_outline: "#FFFFFF", posisi: "tengah", tag: ["fokus", "tenang"] },
    { nama: "Caption Promo Bawah", font: "sf_bold", ukuran: 34, warna_teks: "#3f3f46", tebal_outline: 0, warna_outline: "#FFFFFF", posisi: "bawah", tag: ["tenang", "fokus"] },
  ],
};

export type NamaPaket = "horror" | "minimalis" | "promo";

/** Satu klik dari halaman Koleksi: masukkan paket bawaan ke koleksi user (mode gabung). */
export function tambahkanPaket(koleksiLama: Koleksi, paket: NamaPaket): HasilImporKoleksi {
  const sumber = paket === "minimalis" ? PAKET_MINIMALIS : paket === "promo" ? PAKET_PROMO : PAKET_HORROR;
  const json = JSON.stringify({ version: 1, presets: sumber.presets, transitions: sumber.transitions, styles: sumber.styles });
  return imporKeKoleksi(koleksiLama, json, "gabung");
}

/* ── Penyimpanan localStorage (hanya jalan di browser; di bun/test aman) ── */

export function muatKoleksi(): Koleksi {
  if (typeof window === "undefined") return koleksiBawaan();
  try {
    const raw = window.localStorage.getItem(KUNCI_KOLEKSI);
    if (!raw) return koleksiBawaan();
    const o = JSON.parse(raw) as Record<string, unknown>;
    const dasar = koleksiBawaan();
    const hasil: Koleksi = {
      version: 1,
      diperbarui: String(o.diperbarui ?? dasar.diperbarui),
      presets: [], transitions: [], styles: [],
    };
    for (const item of Array.isArray(o.presets) ? o.presets : []) {
      const h = validasiAnimasi((item ?? {}) as Record<string, unknown>);
      if (h.bersih) hasil.presets.push(h.bersih);
    }
    for (const item of Array.isArray(o.transitions) ? o.transitions : []) {
      const h = validasiTransisi((item ?? {}) as Record<string, unknown>);
      if (h.bersih) hasil.transitions.push(h.bersih);
    }
    for (const item of Array.isArray(o.styles) ? o.styles : []) {
      const h = validasiStyle((item ?? {}) as Record<string, unknown>);
      if (h.bersih) hasil.styles.push(h.bersih);
    }
    return hasil;
  } catch {
    return koleksiBawaan();
  }
}

export function simpanKoleksi(k: Koleksi): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KUNCI_KOLEKSI, JSON.stringify(k));
  } catch {
    /* penyimpanan penuh / mode privat — koleksi tetap hidup di memori halaman */
  }
}

/* ── Store reaktif untuk React (useSyncExternalStore — aman SSR/hidrasi) ──
 * Sumber kebenaran tunggal: cache memori → localStorage → pendengar UI. */

type Pendengar = () => void;
let cache: Koleksi | null = null;
let cacheServer: Koleksi | null = null;
const pendengar = new Set<Pendengar>();

function beriOnar(k: Koleksi): Koleksi {
  return {
    version: 1,
    diperbarui: new Date().toISOString(),
    presets: k.presets.map(p => ({ ...p, tag: [...p.tag] })),
    transitions: k.transitions.map(p => ({ ...p, tag: [...p.tag] })),
    styles: k.styles.map(p => ({ ...p, tag: [...p.tag] })),
  };
}

function ambilSnapshot(): Koleksi {
  if (cache === null) cache = muatKoleksi();
  return cache;
}

function ambilSnapshotServer(): Koleksi {
  if (cacheServer === null) cacheServer = koleksiBawaan();
  return cacheServer;
}

function berlangganan(fn: Pendengar): () => void {
  pendengar.add(fn);
  return () => { pendengar.delete(fn); };
}

/** Satu-satunya cara mengubah koleksi: simpan ke localStorage + kabari semua UI. */
export function ubahKoleksi(k: Koleksi): void {
  cache = beriOnar(k);
  simpanKoleksi(cache);
  pendengar.forEach(f => f());
}

export const koleksiStore = {
  subscribe: berlangganan,
  getSnapshot: ambilSnapshot,
  getServerSnapshot: ambilSnapshotServer,
};

/* ── Dipakai halaman generator: simpan entri bersih (hasil validasi tab preset) ke koleksi ── */

export function simpanEntriKeKoleksi(
  entriBersih: Record<string, unknown>[],
  kunci: "presets" | "transitions" | "styles",
): { ditambah: number; duplikat: number; ditolak: number } {
  const berkas = JSON.stringify({ version: 1, [kunci]: entriBersih });
  const hasil = imporKeKoleksi(ambilSnapshot(), berkas);
  if (hasil.ditambah > 0) ubahKoleksi(hasil.koleksi);
  return { ditambah: hasil.ditambah, duplikat: hasil.duplikat, ditolak: hasil.ditolak };
}

/* ── Ekspor: berkas JSON versi-1 — bentuk yang sama nanti di-bundle di app Kotlin ── */

export function eksporKoleksi(k: Koleksi): string {
  return JSON.stringify({ version: 1, diperbarui: new Date().toISOString(), presets: k.presets, transitions: k.transitions, styles: k.styles }, null, 2);
}

/* ── Prompt Urai Video Referensi — alur "temukan video bagus → bedah lewat ChatGPT → masuk koleksi" ── */

export function promptUraiVideo(vibe: string): string {
  const v = vibe.trim();
  const barisVibe = v ? `\n\nKarakter gaya video referensi yang saya cari: ${v}.` : "";
  return `Kamu adalah ahli motion design dan editor video profesional. Saya menemukan video referensi yang bagus dan ingin meniru gayanya.

Saya akan melampirkan VIDEO REFERENSI (atau screenshot / deskripsi penjelasannya). Bedah gaya visual, animasi teks, transisi, dan kesan efek suaranya. Lalu keluarkan HANYA SATU JSON lengkap yang siap dipakai aplikasi penyusun video faceless saya — tanpa kalimat pembuka/penjelasan, tulis langsung di pesan balasan (BUKAN di artifact/canvas/jendela terpisah), satu blok utuh dari { sampai }.

Keluarkan JSON dengan struktur persis:
{"version":1,"presets":[{"nama":"...","tipe":"in","gerakan":"fade","arah":"","durasi_ms":600,"easing":"ease_out","intensitas":100,"tag":["dramatis"],"sfx":"whoosh pendek"}],"transitions":[{"nama":"...","gerakan":"crossfade","arah":"","durasi_ms":500,"easing":"ease_in_out","tag":["tenang"],"sfx":"angin lembut"}],"styles":[{"nama":"...","font":"poppins_bold","ukuran":56,"warna_teks":"#FFFFFF","tebal_outline":8,"warna_outline":"#000000","posisi":"bawah","tag":["energik"]}]}

ATURAN WAJIB (angka & kata HANYA dari daftar ini):
1. presets = animasi teks/elemen. tipe: "in" (masuk), "out" (keluar), "loop" (gerakan berulang selama scene diam).
2. gerakan presets — in: fade, slide, zoom, bounce, wipe | out: fade, slide, zoom, shrink, wipe | loop: zoom_in, zoom_out, pan_kiri, pan_kanan, pan_atas, pan_bawah
3. gerakan transitions: none, crossfade, slide, wipe, zoom, flip
4. arah: kiri, kanan, atas, bawah — pakai string kosong "" jika gerakannya tidak butuh arah (mis. fade, zoom)
5. easing: linear, ease_in, ease_out, ease_in_out, spring
6. durasi_ms: 150-3000. presets in biasanya 300-1800, out 200-1000, loop 1000-3000, transitions 150-800.
7. intensitas: 0-200 (100 = normal; di atas 100 lebih agresif, di bawah lebih halus)
8. styles: ukuran 24-120; warna format hex #RRGGBB; tebal_outline 0-16; posisi: atas, tengah, bawah; font bebas gaya (contoh: poppins_bold, bebas_condensed, montserrat_black)
9. tag: 1-3 dari daftar mood: tenang, energik, dramatis, ceria, misterius, fokus — pilih sesuai mood video referensi
10. sfx: usulan efek suara 2-5 kata (contoh: "drum sinematik", "gemuruh gelap", "klik cepat") — boleh "" jika tidak cocok. Untuk styles tidak perlu sfx.
11. nama: bahasa Indonesia yang deskriptif dan menarik (contoh bagus: "Kabut Perlahan Muncul", "Tirai Gelap Tersingkap")
12. Isi 4-6 item untuk presets (CAMPUR tipe in, out, dan loop), 3-4 untuk transitions, 3-4 untuk styles. Tiru APA ADANYA yang terlihat di video referensi, sesuaikan nilai ke daftar di atas.

SEBELUM MENJAWAB, periksa sendiri: (a) semua gerakan/easing/posisi/tag hanya dari daftar; (b) semua angka di dalam rentang; (c) ada array presets, transitions, styles; (d) JSON valid tanpa teks/komentar lain; (e) JSON utuh satu blok — diawali { dan diakhiri }, tidak terpotong. Jika ada yang salah, perbaiki dulu baru keluarkan.${barisVibe}`;
}
