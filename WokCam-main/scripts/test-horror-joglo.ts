/* ══════════ Uji regresi #4: "Rumah Joglo" (horor, TikTok 9:16, target 60 dtk) ══════════
 * Keluaran ChatGPT asli: 18 scene (ChatGPT MENGABAIKAN "Jumlah scene: 12" dari prompt).
 * Bandingkan hasil parser dengan JSON ekspor asli yang diunduh pengguna dari app.
 * Jalankan: bun scripts/test-horror-joglo.ts
 */
import { readFileSync } from "node:fs";
import { parseNaskah, fmtDurasi } from "../src/lib/naskah-parser";

const baca = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const raw = baca("./fixtures/hasil-horror-joglo.txt");
const ekspor = JSON.parse(baca("./fixtures/hasil-horror-joglo.json"));

const hasil = parseNaskah(raw, 60);

let lulus = 0, gagal = 0;
const cek = (nama: string, ok: boolean, detail = "") => {
  if (ok) { lulus++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
};

console.log("── Struktur ──");
cek("18 scene terdeteksi", hasil.scenes.length === 18, `dapat ${hasil.scenes.length}`);
cek("tanpa errorGlobal", !hasil.errorGlobal, hasil.errorGlobal ?? "");

console.log("── Field identik dengan ekspor asli pengguna ──");
for (const e of ekspor.scenes) {
  const s = hasil.scenes[e.no - 1];
  if (!s) { cek(`S${e.no} ada`, false); continue; }
  const beda: string[] = [];
  if (s.naskah !== e.naskah) beda.push("naskah");
  if (s.teks !== e.teks) beda.push("teks");
  if (s.durasi !== e.durasi) beda.push(`durasi (${s.durasi} vs ${e.durasi})`);
  if (s.mood !== e.mood) beda.push(`mood (${s.mood} vs ${e.mood})`);
  if (s.latarId !== e.latar_id) beda.push(`latar_id ("${s.latarId}" vs "${e.latar_id}")`);
  if (s.latarEn !== e.latar_en) beda.push(`latar_en ("${s.latarEn}" vs "${e.latar_en}")`);
  cek(`S${String(e.no).padStart(2, "0")} identik`, beda.length === 0, beda.join(", "));
}

console.log("── Peringatan yang seharusnya muncul ──");
const cat1 = hasil.scenes[0].catatan.map(c => c.teks).join(" | ");
cek("peringatan deviasi target 60 dtk muncul di S1",
  cat1.includes("meleset") && cat1.includes("60"), cat1 || "(kosong)");

console.log("── Statistik ritme ──");
const kata = (s: string) => s.split(/\s+/).filter(Boolean).length;
const totalDurasi = hasil.scenes.reduce((a, s) => a + s.durasi, 0);
const totalKata = hasil.scenes.reduce((a, s) => a + kata(s.naskah), 0);
const estBicara = Math.ceil(totalKata / 2.4);
console.log(`  scene        : ${hasil.scenes.length}`);
console.log(`  total durasi : ${fmtDurasi(totalDurasi)}s (target 60s → meleset ${Math.round(((totalDurasi - 60) / 60) * 100)}%)`);
console.log(`  total kata   : ${totalKata} (anggaran prompt 144)`);
console.log(`  est. bicara  : ${estBicara}s = ${Math.round((estBicara / totalDurasi) * 100)}% dari total durasi (sehat <100%)`);
const padat = hasil.scenes.filter(s => kata(s.naskah) / 2.4 > s.durasi + 1);
console.log(`  scene kepadatan berlebih: ${padat.length === 0 ? "tidak ada ✓" : padat.map(s => `S${s.no}(${kata(s.naskah)} kata/${s.durasi}s)`).join(", ")}`);
const terBanyak = [...hasil.scenes].sort((a, b) => kata(b.naskah) - kata(a.naskah))[0];
console.log(`  naskah terpanjang: S${terBanyak.no} ${kata(terBanyak.naskah)} kata / ${terBanyak.durasi}s`);
const catatanNonInfo = hasil.scenes.flatMap(s => s.catatan.filter(c => c.tipe !== "info").map(c => `S${s.no}: ${c.teks}`));
console.log(`  total peringatan/error per scene: ${catatanNonInfo.length}`);
for (const c of catatanNonInfo) console.log(`    ⚠ ${c}`);

console.log(`\n${gagal === 0 ? "✅ SEMUA LULUS" : "❌ ADA YANG GAGAL"} (${lulus} lulus, ${gagal} gagal)`);
process.exit(gagal > 0 ? 1 : 0);
