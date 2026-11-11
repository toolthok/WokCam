/// <reference types="bun-types" />
/* ═══ Test regresi: uraiJSONToleran — keluaran AI nyata yang dulu gagal ═══
 * Latar: user menyalin balasan ChatGPT/Claude pakai IKON SALIN, tapi impor selalu
 * "Bukan JSON valid". Parser lama hanya mencoba 1 pola (fence pertama / kurung
 * pertama–terakhir). Parser baru mencoba berlapis. Jalankan:
 *   bun scripts/test-impor-toleran.ts
 */

import { imporKeKoleksi, uraiJSONToleran, koleksiBawaan, tampakSepertiPaket } from "../src/lib/preset-store";

let ok = 0, gagal = 0;
function uji(nama: string, kondisi: boolean, detail = "") {
  if (kondisi) { ok++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
}

const jsonBersih = await Bun.file(new URL("./fixtures/paket-minimalis.json", import.meta.url)).text();

console.log("── 1 · Baseline: JSON polos & fence tunggal tetap jalan ──");
{
  const a = uraiJSONToleran(jsonBersih);
  uji("JSON polos → ok, tampak seperti paket", a.ok && tampakSepertiPaket(a.ok ? a.data : null));
  const b = uraiJSONToleran("Berikut hasilnya:\n```json\n" + jsonBersih + "\n```\nSemoga cocok!");
  uji("fence + basa-basi → ok", b.ok && (b.ok ? (b.data as { presets: unknown[] }).presets.length === 6 : false));
}

console.log("── 2 · DUA blok kode (contoh kecil dulu, JSON asli di fence kedua) ──");
{
  const dua = "Bentuknya seperti ini:\n```json\n{\"nama\":\"contoh\"}\n```\n\nIni hasil aslinya:\n```json\n" + jsonBersih + "\n```";
  const h = imporKeKoleksi(koleksiBawaan(), dua);
  uji("fence kedua yang dipakai → 14 item masuk", h.ditambah === 14, `ditambah=${h.ditambah} err=${h.errorGlobal ?? "-"}`);
}

console.log("── 3 · Basa-basi BERISI KURUNG di sekitar JSON tanpa fence ──");
{
  const berisik = "Formatnya kira-kira {version:1} ya. Ini dia:\n\n" + jsonBersih + "\n\nCatatan: nilai {intensitas} boleh diubah sesuai selera.";
  const h = imporKeKoleksi(koleksiBawaan(), berisik);
  uji("kurung di basa-basi tidak mengacaukan → 14 item", h.ditambah === 14, `ditambah=${h.ditambah} err=${h.errorGlobal ?? "-"}`);
}

console.log("── 4 · Koma menggantung (kesalahan AI paling umum) ──");
{
  const koma = `{"presets":[
    {"nama":"Uji Satu","tipe":"in","gerakan":"fade","tag":["tenang"],},
    {"nama":"Uji Dua","tipe":"out","gerakan":"fade","tag":["tenang"],},
  ],"transitions":[],"styles":[],}`;
  const h = imporKeKoleksi(koleksiBawaan(), koma);
  uji("koma sebelum } / ] diperbaiki → 2 preset masuk", h.ditambah === 2, `ditambah=${h.ditambah} err=${h.errorGlobal ?? "-"}`);
}

console.log("── 5 · Komentar // dan /* */ di dalam JSON ──");
{
  const berkomentar = `{
    // daftar animasi masuk
    "presets": [
      {"nama":"Uji Komentar","tipe":"in","gerakan":"slide","arah":"atas"} /* arah dari bawah */
    ],
    "transitions": [],
    "styles": []
  }`;
  const h = imporKeKoleksi(koleksiBawaan(), berkomentar);
  uji("komentar dibuang → 1 preset masuk", h.ditambah === 1, `ditambah=${h.ditambah} err=${h.errorGlobal ?? "-"}`);
}

console.log("── 6 · Karakter halus dari ikon salin (NBSP, zero-width, BOM) ──");
{
  const halus = "\uFEFF" + jsonBersih.replace(/: /g, ":\u00A0").replace(/\{/g, "{\u200B");
  const h = imporKeKoleksi(koleksiBawaan(), halus);
  uji("BOM + NBSP + zero-width dibersihkan → 14 item", h.ditambah === 14, `ditambah=${h.ditambah} err=${h.errorGlobal ?? "-"}`);
}

console.log("── 7 · Respons TANPA JSON (JSON tersisa di artifact Claude) ──");
{
  const h = imporKeKoleksi(koleksiBawaan(), "Berikut penjelasan gaya videonya: minimalis editorial, teks hitam di kartu putih, gerakan halus. Semoga membantu!");
  uji("prosa polos → gagal dengan pesan artifact", h.errorGlobal !== undefined && h.errorGlobal.includes("artifact"), h.errorGlobal ?? "-");
}

console.log("── 8 · Balasan TERPOTONG saat disalin ──");
{
  const h = imporKeKoleksi(koleksiBawaan(), jsonBersih.slice(0, 400));
  uji("JSON terpotong → petunjuk TERPOTONG", h.errorGlobal !== undefined && h.errorGlobal.includes("TERPOTONG"), h.errorGlobal ?? "-");
}

console.log("── 9 · Bentuk lama tetap aman (tidak ada regresi) ──");
{
  uji('"42" → ditolak', imporKeKoleksi(koleksiBawaan(), "42").errorGlobal !== undefined);
  uji('{"version":1} tanpa array → pesan array', imporKeKoleksi(koleksiBawaan(), '{"version":1}').errorGlobal !== undefined);
  uji('"[]" array kosong → error, bukan diam-diam', imporKeKoleksi(koleksiBawaan(), "[]").errorGlobal !== undefined);
  uji('array string kecil ["tenang","fokus"] → BUKAN dianggap paket', imporKeKoleksi(koleksiBawaan(), '["tenang","fokus"]').errorGlobal !== undefined);
  const arr = imporKeKoleksi(koleksiBawaan(), JSON.stringify(JSON.parse(jsonBersih).presets));
  uji("array polos berisi objek → dianggap presets, 6 masuk", arr.ditambah === 6, `d=${arr.ditambah}`);
  uji("koma di dalam nilai teks TIDAK dirusak", (() => {
    const h = imporKeKoleksi(koleksiBawaan(), '{"presets":[{"nama":"Sfx, Koma","tipe":"in","gerakan":"fade","sfx":"boom, keras, menggelegar"}],"transitions":[],"styles":[]}');
    const p = h.koleksi.presets.find(q => q.nama === "Sfx, Koma");
    return h.ditambah === 1 && p !== undefined && p.sfx === "boom, keras, menggelegar";
  })(), JSON.stringify(imporKeKoleksi(koleksiBawaan(), '{"presets":[{"nama":"Sfx, Koma","tipe":"in","gerakan":"fade","sfx":"boom, keras, menggelegar"}],"transitions":[],"styles":[]}').catatan));
}

console.log("── 10 · Skema user yang sebenarnya: keluaran Claude berisik ujung-ke-ujung ──");
{
  const claude = "Sure! Here's the JSON in the exact format requested:\n\n```json\n" + jsonBersih + "\n```\n\n**Notes:**\n- The {intensitas} values are subtle for the loop presets\n- Adjust {durasi_ms} as needed\n\nLet me know if you want variations!";
  const h = imporKeKoleksi(koleksiBawaan(), claude);
  uji("keluaran Claude penuh basa-basi + kurung → 14 item masuk", h.ditambah === 14 && !h.errorGlobal, `d=${h.ditambah} err=${h.errorGlobal ?? "-"}`);
}

console.log(`\n${gagal === 0 ? "✅" : "❌"} SELESAI (${ok} lulus, ${gagal} gagal)`);
if (gagal > 0) process.exit(1);