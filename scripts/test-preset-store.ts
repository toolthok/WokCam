/// <reference types="bun-types" />
/* ═══ Test regresi: Koleksi Style (src/lib/preset-store.ts) ═══
 * Jalankan: bun scripts/test-preset-store.ts
 * Mencakup: impor paket asli user (paket-in-horror.json), dedupe, validasi toleran,
 *           bentuk berkas alternatif, ekspor, dan keamanan tanpa-browser.
 */

import {
  imporKeKoleksi, koleksiBawaan, muatKoleksi, simpanEntriKeKoleksi,
  eksporKoleksi, promptUraiVideo, kunciDedupe,
  type Koleksi,
} from "../src/lib/preset-store";

let ok = 0, gagal = 0;
function uji(nama: string, kondisi: boolean, detail = "") {
  if (kondisi) { ok++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
}

const berkasUser = await Bun.file(new URL("./fixtures/paket-in-horror.json", import.meta.url)).text();
const kosong: Koleksi = { version: 1, diperbarui: new Date(0).toISOString(), presets: [], transitions: [], styles: [] };

console.log("── 1 · Impor paket asli user (JSON yang ditempel di chat) ──");
{
  const h = imporKeKoleksi(kosong, berkasUser);
  uji("6 preset masuk", h.ditambah === 6, `ditambah=${h.ditambah}`);
  uji("0 duplikat, 0 ditolak", h.duplikat === 0 && h.ditolak === 0);
  uji("tanpa catatan perbaikan (JSON sudah rapi)", h.catatan.length === 0, JSON.stringify(h.catatan));
  uji("errorGlobal tidak ada", !h.errorGlobal);

  const harapan = JSON.parse(berkasUser).presets;
  let identik = true;
  for (let i = 0; i < 6; i++) {
    const a = h.koleksi.presets[i], b = harapan[i];
    const pas =
      a.nama === b.nama && a.tipe === b.tipe && a.gerakan === b.gerakan && a.arah === b.arah &&
      a.durasi_ms === b.durasi_ms && a.easing === b.easing && a.intensitas === b.intensitas &&
      JSON.stringify(a.tag) === JSON.stringify(b.tag) && a.sfx === "";
    if (!pas) { identik = false; console.log(`      beda di preset ${i + 1}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`); }
  }
  uji("18 field × 6 preset identik dengan berkas user", identik);
}

console.log("── 2 · Dedupe: impor ulang berkas yang sama ──");
{
  const h1 = imporKeKoleksi(kosong, berkasUser);
  const h2 = imporKeKoleksi(h1.koleksi, berkasUser);
  uji("impor ulang → 0 ditambah", h2.ditambah === 0, `ditambah=${h2.ditambah}`);
  uji("impor ulang → 6 duplikat dilewati", h2.duplikat === 6, `duplikat=${h2.duplikat}`);

  const h3 = imporKeKoleksi(koleksiBawaan(), berkasUser);
  uji("paket user == paket bawaan → 6 duplikat juga", h3.duplikat === 6 && h3.ditambah === 0);

  const namaBedar = berkasUser.replace("Kabut Perlahan Muncul", "Kabut Perlahan Muncul v2");
  const h4 = imporKeKoleksi(h1.koleksi, namaBedar);
  uji("nama beda sedikit → dianggap baru (1 ditambah, 5 duplikat)", h4.ditambah === 1 && h4.duplikat === 5);
}

console.log("── 3 · Bentuk berkas alternatif ──");
{
  const berpagar = "Ini hasil bedah videonya:\n```json\n" + berkasUser + "\n```\nSemoga membantu!";
  const h = imporKeKoleksi(kosong, berpagar);
  uji("fence markdown + basa-basi tetap terbaca (6 masuk)", h.ditambah === 6, `ditambah=${h.ditambah}`);

  const hArr = imporKeKoleksi(kosong, JSON.stringify(JSON.parse(berkasUser).presets));
  uji("array polos (tanpa pembungkus) dianggap presets", hArr.ditambah === 6, `ditambah=${hArr.ditambah}`);

  const transisi = `{"version":1,"transitions":[
    {"nama":"Sabuk Kencang","gerakan":"slide","arah":"kiri","durasi_ms":400,"easing":"ease_out","tag":["energik"],"sfx":"whoosh cepat"},
    {"nama":"Lembut Menyatu","gerakan":"crossfade","arah":"","durasi_ms":700,"easing":"ease_in_out","tag":["tenang"],"sfx":""},
    {"nama":"Cakram Terputar","gerakan":"spin","arah":"","durasi_ms":500,"easing":"linear","tag":["dramatis"],"sfx":""}
  ]}`;
  const hT = imporKeKoleksi(kosong, transisi);
  uji("transisi: 2 sah masuk, 1 diperbaiki", hT.ditambah === 3 && hT.koleksi.transitions.length === 3);
  uji('gerakan "spin" tidak dikenal → crossfade + catatan',
    hT.koleksi.transitions[2].gerakan === "crossfade" && hT.catatan.some(c => c.includes("spin")));

  const gaya = `{"styles":[
    {"nama":"Judul Berani","font":"bebas_condensed","ukuran":72,"warna_teks":"#FACC15","tebal_outline":10,"warna_outline":"#000000","posisi":"tengah","tag":["energik"]},
    {"nama":"Kapsul Rusak","font":"montserrat","ukuran":900,"warna_teks":"biru","tebal_outline":99,"warna_outline":"#000000","posisi":"samping","tag":["horor"]}
  ]}`;
  const hS = imporKeKoleksi(kosong, gaya);
  uji("style: 2 masuk", hS.ditambah === 2 && hS.koleksi.styles.length === 2);
  const s = hS.koleksi.styles[1];
  uji("ukuran 900 → clamp 120", s.ukuran === 120);
  uji('warna "biru" → #FFFFFF + catatan', s.warna_teks === "#FFFFFF" && hS.catatan.some(c => c.includes("warna_teks")));
  uji("tebal_outline 99 → clamp 16", s.tebal_outline === 16);
  uji('posisi "samping" → "bawah"', s.posisi === "bawah");
  uji('tag "horor" dibuang, tag jadi []', JSON.stringify(s.tag) === "[]");
}

console.log("── 4 · Validasi toleran (perbaikan otomatis + catatan) ──");
{
  const kacau = `{"presets":[
    {"nama":"Preset Kacau","tipe":"masuk","gerakan":"push_in","arah":"diagonal","durasi_ms":99999,"easing":"bouncy","intensitas":999,"tag":["horor","misterius","gelap","tenang"],"sfx":"  drum sinematik berderak hebat sekali suasananya mencekam sekali  "},
    {"nama":"   ","gerakan":"fade"},
    {"tipe":"out","gerakan":"shrink","nama":"Keluar Tanpa Nama? tidak, nama ada"}
  ]}`;
  const h = imporKeKoleksi(kosong, kacau);
  uji("2 masuk, 1 ditolak (nama kosong)", h.ditambah === 2 && h.ditolak === 1, `d=${h.ditambah} tolak=${h.ditolak}`);
  const p = h.koleksi.presets[0];
  uji('tipe "masuk" → "in" + catatan', p.tipe === "in" && h.catatan.some(c => c.includes("tipe")));
  uji('gerakan "push_in" → "fade" + catatan', p.gerakan === "fade" && h.catatan.some(c => c.includes("push_in")));
  uji('arah "diagonal" → ""', p.arah === "");
  uji("durasi_ms 99999 → clamp 5000", p.durasi_ms === 5000);
  uji('easing "bouncy" → "ease_in_out"', p.easing === "ease_in_out");
  uji("intensitas 999 → clamp 200", p.intensitas === 200);
  uji("tag: hanya mood sah yang tersisa (misterius, tenang), maks 3", JSON.stringify(p.tag) === '["misterius","tenang"]');
  uji("sfx dipangkas maksimal 60 karakter", p.sfx.length === 60);
  uji("preset tanpa nama ditolak dengan alasan", h.catatan.some(c => c.includes("ditolak: nama kosong")));

  const h2 = imporKeKoleksi(kosong, '{"presets": [{"nama":"A","tipe":"loop","gerakan":"pan_kiri","durasi_ms":2500}]}');
  uji("loop pan_kiri sah tanpa catatan gerakan", h2.ditambah === 1 && h2.koleksi.presets[0].gerakan === "pan_kiri");
}

console.log("── 5 · Input rusak / tidak sah ──");
{
  uji("string kosong → errorGlobal", imporKeKoleksi(kosong, "  ").errorGlobal !== undefined);
  uji("bukan JSON → errorGlobal", imporKeKoleksi(kosong, "hai ini hasilnya ya").errorGlobal !== undefined);
  uji("JSON tanpa array → errorGlobal", imporKeKoleksi(kosong, '{"version":1}').errorGlobal !== undefined);
  uji("angka polos → errorGlobal", imporKeKoleksi(kosong, "42").errorGlobal !== undefined);
}

console.log("── 6 · Ekspor & simpan dari generator ──");
{
  const h = imporKeKoleksi(kosong, berkasUser);
  const ekspor = eksporKoleksi(h.koleksi);
  const kembali = JSON.parse(ekspor);
  uji("ekspor punya version 1 + 3 array", kembali.version === 1 && Array.isArray(kembali.presets) && Array.isArray(kembali.transitions) && Array.isArray(kembali.styles));
  uji("ekspor berisi 6 preset", kembali.presets.length === 6);
  uji("ekspor punya timestamp diperbarui", typeof kembali.diperbarui === "string" && kembali.diperbarui.length > 10);

  const s1 = simpanEntriKeKoleksi(JSON.parse(berkasUser).presets, "presets");
  uji("simpanEntriKeKoleksi (tanpa browser): paket user vs bawaan → 0 baru, 6 duplikat", s1.ditambah === 0 && s1.duplikat === 6, JSON.stringify(s1));
  const baru = JSON.parse(berkasUser).presets.map((p: Record<string, unknown>, i: number) => ({ ...p, nama: `Uji Baru ${i}` }));
  const s2 = simpanEntriKeKoleksi(baru, "presets");
  uji("simpanEntriKeKoleksi nama baru → 6 ditambah", s2.ditambah === 6, JSON.stringify(s2));

  uji("muatKoleksi tanpa browser → kembalikan bawaan tanpa crash", muatKoleksi().presets.length === 6);
}

console.log("── 7 · Prompt Urai Video ──");
{
  const p = promptUraiVideo("horor joglo, kabut, gelap");
  uji("prompt memuat vibe user", p.includes("horor joglo, kabut, gelap"));
  for (const kata of ["presets", "transitions", "styles", '"in"', '"out"', '"loop"', "crossfade", "ease_in_out", "misterius", "tenang, energik, dramatis, ceria, misterius, fokus", "durasi_ms", "intensitas", "sfx", "SEBELUM MENJAWAB"]) {
    uji(`prompt menyebut ${kata}`, p.includes(kata));
  }
  uji("vibe kosong → kalimat vibe dilepas (kini opsional)", !promptUraiVideo("").includes("yang saya cari"));
  uji("kunci dedupe format benar", kunciDedupe("styles", { nama: "Judul", font: "x" }) === "styles|judul|x");
}

console.log(`\n${gagal === 0 ? "✅" : "❌"} SELESAI (${ok} lulus, ${gagal} gagal)`);
if (gagal > 0) process.exit(1);