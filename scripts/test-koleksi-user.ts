/* ═══ Test regresi: skenario asli user — 2026-11-10 ═══
 * Kasus: JSON hasil bedah video referensi (paket minimalis editorial) harus
 * digabung ke koleksi yang berisi 6 preset horror. User mencoba merge lewat
 * ChatGPT → hasilnya 6 preset horror saja, transitions [] dan styles []
 * (14 item hilang). Impor di app WAJIB tanpa kehilangan satu field pun.
 *
 * Jalankan: bun scripts/test-koleksi-user.ts
 */

import {
  imporKeKoleksi, koleksiBawaan, eksporKoleksi, tambahkanPaket,
  PAKET_MINIMALIS, PAKET_HORROR, promptUraiVideo,
  type Koleksi,
} from "../src/lib/preset-store";

let ok = 0, gagal = 0;
function uji(nama: string, kondisi: boolean, detail = "") {
  if (kondisi) { ok++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
}

/* Perbandingan field-per-field (bukan stringify utuh, agar kebal urutan kunci) */
function presetCocok(a: unknown, b: Record<string, unknown>): boolean {
  const x = a as Record<string, unknown>;
  if (!x) return false;
  const skalar = ["nama", "tipe", "gerakan", "arah", "durasi_ms", "easing", "intensitas", "sfx"]
    .every(k => x[k] === b[k]);
  return skalar && JSON.stringify(x.tag) === JSON.stringify(b.tag);
}
function transisiCocok(a: unknown, b: Record<string, unknown>): boolean {
  const x = a as Record<string, unknown>;
  if (!x) return false;
  const skalar = ["nama", "gerakan", "arah", "durasi_ms", "easing", "sfx"]
    .every(k => x[k] === b[k]);
  return skalar && JSON.stringify(x.tag) === JSON.stringify(b.tag);
}
function styleCocok(a: unknown, b: Record<string, unknown>): boolean {
  const x = a as Record<string, unknown>;
  if (!x) return false;
  const skalar = ["nama", "font", "ukuran", "warna_teks", "tebal_outline", "warna_outline", "posisi"]
    .every(k => x[k] === b[k]);
  return skalar && JSON.stringify(x.tag) === JSON.stringify(b.tag);
}

const jsonMinimalis = await Bun.file(new URL("./fixtures/paket-minimalis.json", import.meta.url)).text();
const sumber = JSON.parse(jsonMinimalis) as {
  presets: Record<string, unknown>[]; transitions: Record<string, unknown>[]; styles: Record<string, unknown>[];
};

console.log("── 1 · Gabung: paket minimalis → koleksi horror (skenario asli user) ──");
{
  const h = imporKeKoleksi(koleksiBawaan(), jsonMinimalis);
  uji("14 item baru (6 animasi + 4 transisi + 4 style)", h.ditambah === 14, `ditambah=${h.ditambah}`);
  uji("0 duplikat, 0 ditolak, 0 catatan perbaikan",
    h.duplikat === 0 && h.ditolak === 0 && h.catatan.length === 0,
    JSON.stringify({ dup: h.duplikat, tolak: h.ditolak, catatan: h.catatan }));
  uji("errorGlobal tidak ada", !h.errorGlobal);

  const k = h.koleksi;
  uji("koleksi kini 12 animasi (6 horror + 6 minimalis)", k.presets.length === 12, `n=${k.presets.length}`);
  uji("4 transisi tersimpan (dulu hilang jadi [])", k.transitions.length === 4, `n=${k.transitions.length}`);
  uji("4 gaya teks tersimpan (dulu hilang jadi [])", k.styles.length === 4, `n=${k.styles.length}`);

  uji("6 preset horror tidak ada yang hilang",
    koleksiBawaan().presets.every(p => k.presets.some(q => q.nama === p.nama)));

  uji("6 preset minimalis: 9 field + tag identik dengan berkas user",
    sumber.presets.every(b => k.presets.find(q => q.nama === String(b.nama)) && presetCocok(k.presets.find(q => q.nama === String(b.nama)), b)));
  uji("tipe out & loop dipertahankan (tidak dipaksa 'in')",
    k.presets.some(p => p.nama === "Elemen Menghilang Perlahan" && p.tipe === "out") &&
    k.presets.some(p => p.nama === "Gerakan Kamera Halus" && p.tipe === "loop" && p.gerakan === "zoom_in") &&
    k.presets.some(p => p.nama === "Logo Melayang Lembut" && p.tipe === "loop" && p.gerakan === "pan_kanan"));
  uji("sfx minimalis tersimpan (whoosh lembut, pop lembut, dst.)",
    k.presets.some(p => p.nama === "Teks Minimalis Muncul" && p.sfx === "whoosh lembut") &&
    k.presets.some(p => p.nama === "Kartu Screenshot Mengambang" && p.sfx === "pop lembut"));

  uji("4 transisi: semua field identik dengan berkas user",
    sumber.transitions.every(b => transisiCocok(k.transitions.find(q => q.nama === String(b.nama)), b)));
  uji("4 style: semua field identik dengan berkas user",
    sumber.styles.every(b => styleCocok(k.styles.find(q => q.nama === String(b.nama)), b)));
  uji('style "#171717" teks gelap & outline 0 tersimpan apa adanya',
    k.styles.some(s => s.nama === "Tipografi Editorial Minimalis" && s.warna_teks === "#171717" && s.tebal_outline === 0));

  uji("diperbarui naik ke waktu sekarang", k.diperbarui > new Date(0).toISOString());
}

console.log("── 2 · Roundtrip ekspor → impor ulang (stabil, tidak berubah) ──");
{
  const h1 = imporKeKoleksi(koleksiBawaan(), jsonMinimalis);
  const ekspor = eksporKoleksi(h1.koleksi);
  const kembali = JSON.parse(ekspor);
  uji("ekspor memuat 12 preset + 4 transisi + 4 style",
    kembali.presets.length === 12 && kembali.transitions.length === 4 && kembali.styles.length === 4);

  const h2 = imporKeKoleksi(h1.koleksi, ekspor);
  uji("impor ulang hasil ekspor → 0 ditambah", h2.ditambah === 0, `d=${h2.ditambah}`);
  uji("20 duplikat dilewati (12+4+4) — tidak ada isu dedupe", h2.duplikat === 20, `dup=${h2.duplikat}`);
  uji("isi identik 100% setelah roundtrip",
    JSON.stringify(h2.koleksi.presets) === JSON.stringify(h1.koleksi.presets) &&
    JSON.stringify(h2.koleksi.transitions) === JSON.stringify(h1.koleksi.transitions) &&
    JSON.stringify(h2.koleksi.styles) === JSON.stringify(h1.koleksi.styles));
}

console.log("── 3 · Mode ganti: pulihkan koleksi persis dari berkas backup ──");
{
  const h = imporKeKoleksi(koleksiBawaan(), jsonMinimalis, "ganti");
  uji("ganti: koleksi = persis 6 + 4 + 4 dari berkas",
    h.koleksi.presets.length === 6 && h.koleksi.transitions.length === 4 && h.koleksi.styles.length === 4,
    JSON.stringify({ p: h.koleksi.presets.length, t: h.koleksi.transitions.length, s: h.koleksi.styles.length }));
  uji("ganti: preset horror lama tidak tersisa", !h.koleksi.presets.some(p => p.nama === "Kabut Perlahan Muncul"));
  uji("ganti: 14 ditambah tanpa duplikat", h.ditambah === 14 && h.duplikat === 0);

  const hBatal = imporKeKoleksi(koleksiBawaan(), '{"presets":[{"nama":"   ","gerakan":"fade"}]}', "ganti");
  uji("ganti dibatalkan bila 0 item valid — koleksi lama utuh",
    hBatal.errorGlobal !== undefined &&
    hBatal.koleksi.presets.length === koleksiBawaan().presets.length,
    JSON.stringify({ err: hBatal.errorGlobal, n: hBatal.koleksi.presets.length }));

  const hGabung = imporKeKoleksi(koleksiBawaan(), jsonMinimalis, "gabung");
  uji("mode default (tanpa argumen) = gabung",
    imporKeKoleksi(koleksiBawaan(), jsonMinimalis).ditambah === hGabung.ditambah);
}

console.log("── 4 · Paket siap pakai satu klik (tambahkanPaket) ──");
{
  const kosong: Koleksi = { version: 1, diperbarui: new Date(0).toISOString(), presets: [], transitions: [], styles: [] };
  const hM = tambahkanPaket(kosong, "minimalis");
  uji("paket minimalis: 14 masuk ke koleksi kosong", hM.ditambah === 14, `d=${hM.ditambah}`);
  uji("paket minimalis: field identik dengan berkas asli user",
    PAKET_MINIMALIS.presets.every((b, i) => presetCocok(b, sumber.presets[i])) &&
    PAKET_MINIMALIS.transitions.every((b, i) => transisiCocok(b, sumber.transitions[i])) &&
    PAKET_MINIMALIS.styles.every((b, i) => styleCocok(b, sumber.styles[i])));

  const hH = tambahkanPaket(hM.koleksi, "horror");
  uji("paket horror setelahnya: 6 masuk (total 12 animasi = 6+6)", hH.ditambah === 6 && hH.koleksi.presets.length === 12,
    `d=${hH.ditambah} n=${hH.koleksi.presets.length}`);
  uji("koleksi campuran: transisi & style minimalis tetap utuh",
    hH.koleksi.transitions.length === 4 && hH.koleksi.styles.length === 4);
  uji("PAKET_HORROR = 6 animasi, tanpa transisi/style",
    PAKET_HORROR.presets.length === 6 && PAKET_HORROR.transitions.length === 0 && PAKET_HORROR.styles.length === 0);

  const hUlang = tambahkanPaket(hH.koleksi, "minimalis");
  uji("paket sama dua kali → 0 baru, 14 duplikat", hUlang.ditambah === 0 && hUlang.duplikat === 14,
    `d=${hUlang.ditambah} dup=${hUlang.duplikat}`);
}

console.log("── 5 · Prompt bedah: kalimat 'yang saya cari' jadi OPSIONAL ──");
{
  const netral = promptUraiVideo("");
  uji("vibe kosong → kalimat 'yang saya cari' dilepas sepenuhnya", !netral.includes("yang saya cari"));
  uji("vibe kosong → aturan inti & 3 array tetap lengkap",
    netral.includes("ATURAN WAJIB") && netral.includes('"transitions"') && netral.includes('"styles"') && netral.includes("SEBELUM MENJAWAB"));
  uji("vibe spasi saja → dianggap kosong", !promptUraiVideo("   ").includes("yang saya cari"));
  const bervibe = promptUraiVideo("horor joglo, kabut");
  uji("vibe diisi → kalimat karakter gaya muncul utuh",
    bervibe.includes("Karakter gaya video referensi yang saya cari: horor joglo, kabut."));
}

console.log(`\n${gagal === 0 ? "✅" : "❌"} SELESAI (${ok} lulus, ${gagal} gagal)`);
if (gagal > 0) process.exit(1);
