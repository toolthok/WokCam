/* ══════════ Uji regresi #5: "Misteri Alam Semesta" (YouTube 16:9, target 150 dtk) ══════════
 * Format ChatGPT: INLINE satu baris per scene, 30 scene — memvalidasi:
 *  1. Parser inline == JSON ekspor asli pengguna (30/30)
 *  2. Perbaikan prompt uji #4: jumlah scene & total durasi kini TEPAT
 *  3. Sisa masalah: batas kata per scene terlampaui → est. bicara melebihi durasi
 *  4. terapkanRitme() memperbaiki semuanya tanpa mengubah naskah
 * Jalankan: bun scripts/test-alam-semesta.ts
 */
import { readFileSync } from "node:fs";
import { parseNaskah, terapkanRitme, fmtDurasi } from "../src/lib/naskah-parser";

const baca = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const raw = baca("./fixtures/hasil-alam-semesta.txt");
const ekspor = JSON.parse(baca("./fixtures/hasil-alam-semesta.json"));

let lulus = 0, gagal = 0;
const cek = (nama: string, ok: boolean, detail = "") => {
  if (ok) { lulus++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
};
const kata = (s: string) => s.split(/\s+/).filter(Boolean).length;

console.log("── 1 · Struktur (efek prompt diperkuat uji #4) ──");
const hasil = parseNaskah(raw, 150);
cek("30 scene TEPAT sesuai permintaan prompt", hasil.scenes.length === 30, `dapat ${hasil.scenes.length}`);
cek("tanpa errorGlobal", !hasil.errorGlobal, hasil.errorGlobal ?? "");
const total0 = hasil.scenes.reduce((a, s) => a + s.durasi, 0);
cek(`total durasi ${total0}s TEPAT target 150s`, total0 === 150, `dapat ${total0}`);
cek("tanpa peringatan deviasi target", !hasil.scenes[0].catatan.some(c => c.teks.includes("meleset")));

console.log("── 2 · Field identik dengan ekspor asli pengguna ──");
for (const e of ekspor.scenes) {
  const s = hasil.scenes[e.no - 1];
  if (!s) { cek(`S${e.no} ada`, false); continue; }
  const beda: string[] = [];
  if (s.naskah !== e.naskah) beda.push("naskah");
  if (s.teks !== e.teks) beda.push("teks");
  if (s.durasi !== e.durasi) beda.push(`durasi`);
  if (s.mood !== e.mood) beda.push(`mood`);
  if (s.latarId !== e.latar_id) beda.push(`latar_id`);
  if (s.latarEn !== e.latar_en) beda.push(`latar_en`);
  cek(`S${String(e.no).padStart(2, "0")} identik`, beda.length === 0, beda.join(", "));
}

console.log("── 3 · Diagnosis ritme (sisa masalah) ──");
const totalKata = hasil.scenes.reduce((a, s) => a + kata(s.naskah), 0);
const est0 = Math.ceil(totalKata / 2.4);
const padat0 = hasil.scenes.filter(s => kata(s.naskah) / 2.4 > s.durasi + 1);
console.log(`  total kata        : ${totalKata} (anggaran prompt 360)`);
console.log(`  est. bicara TTS   : ${est0}s vs total durasi ${total0}s = ${Math.round((est0 / total0) * 100)}%`);
console.log(`  scene kepadatan berlebih: ${padat0.length} dari 30`);
console.log(`  rata-rata kata/scene: ${(totalKata / 30).toFixed(1)} (batas prompt 12)`);
cek("est. bicara melebihi 120% durasi (masalah terdeteksi)", est0 > total0 * 1.2);
cek("scene kepadatan berlebih > 0 (masalah terdeteksi)", padat0.length > 0);

console.log("── 4 · terapkanRitme() memperbaiki tanpa menyentuh naskah ──");
const hasil2 = terapkanRitme(hasil, 150);
const total2 = hasil2.scenes.reduce((a, s) => a + s.durasi, 0);
const est2 = Math.ceil(totalKata / 2.4);
const padat2 = hasil2.scenes.filter(s => kata(s.naskah) / 2.4 > s.durasi + 1);
cek("semua naskah/teks/mood/latar TIDAK berubah",
  JSON.stringify(hasil2.scenes.map(s => [s.no, s.naskah, s.teks, s.mood, s.latarId, s.latarEn])) ===
  JSON.stringify(hasil.scenes.map(s => [s.no, s.naskah, s.teks, s.mood, s.latarId, s.latarEn])));
cek("tidak ada lagi scene kepadatan berlebih", padat2.length === 0, padat2.map(s => `S${s.no}`).join(","));
cek("est. bicara sekarang muat dalam total durasi", est2 <= total2, `est ${est2}s vs total ${total2}s`);
cek("durasi hanya NAIK, tidak pernah turun",
  hasil2.scenes.every((s, i) => s.durasi >= hasil.scenes[i].durasi));
const naik = hasil2.scenes.filter((s, i) => s.durasi > hasil.scenes[i].durasi);
console.log(`  total durasi: ${total0}s → ${total2}s (target 150s)`);
console.log(`  scene yang dinikkan durasinya: ${naik.length}`);
cek("catatan info kenaikan durasi terpasang",
  naik.length > 0 && naik.every(s => s.catatan.some(c => c.teks.startsWith("Durasi dinaikkan otomatis"))));
cek("peringatan kepadatan lama terhapus",
  hasil2.scenes.every(s => !s.catatan.some(c => c.teks.startsWith("Naskah ±"))));
const dev2 = hasil2.scenes[0].catatan.find(c => c.teks.includes("meleset"));
console.log(`  peringatan deviasi baru: ${dev2 ? dev2.teks : "(tidak ada — total masih dalam toleransi)"}`);
cek("peringatan deviasi target dihitung ulang sesuai total baru",
  (total2 !== 150 && Math.abs(total2 - 150) > 30) === Boolean(dev2));

console.log(`\n${gagal === 0 ? "✅ SEMUA LULUS" : "❌ ADA YANG GAGAL"} (${lulus} lulus, ${gagal} gagal)`);
process.exit(gagal > 0 ? 1 : 0);
