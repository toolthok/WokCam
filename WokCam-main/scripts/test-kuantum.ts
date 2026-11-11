/* ══════════ Analisis uji #6: "Kuantum Komputer" (YouTube 16:9, target 240 dtk) ══════════
 * Pengguna hanya melampirkan JSON ekspor (raw ChatGPT tidak ada), jadi ini analisis
 * struktur + ritme — bukan round-trip parser (parser sudah tervalidasi 100 tes).
 * Jalankan: bun scripts/test-kuantum.ts
 */
import { readFileSync } from "node:fs";
import { MOODS, fmtDurasi } from "../src/lib/naskah-parser";

const ekspor = JSON.parse(readFileSync(new URL("./fixtures/hasil-kuantum.json", import.meta.url), "utf8"));
const scenes: { no: number; naskah: string; teks: string; durasi: number; mood: string; latar_id: string; latar_en: string }[] = ekspor.scenes;

let lulus = 0, gagal = 0;
const cek = (nama: string, ok: boolean, detail = "") => {
  if (ok) { lulus++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
};
const kata = (s: string) => s.split(/\s+/).filter(Boolean).length;

console.log("── Struktur ──");
const target: number = ekspor.proyek.target_durasi;
cek(`48 scene (permintaan prompt = round(240/5) = 48)`, scenes.length === 48, `dapat ${scenes.length}`);
cek("penomoran scene berurutan 1..48", scenes.every((s, i) => s.no === i + 1));
const total = scenes.reduce((a, s) => a + s.durasi, 0);
cek(`total durasi ${total}s TEPAT target ${target}s`, total === target, `dapat ${total}`);
cek("semua DURASI dalam rentang 2-15", scenes.every(s => s.durasi >= 2 && s.durasi <= 15));
cek("semua MOOD dalam daftar tertutup", scenes.every(s => (MOODS as readonly string[]).includes(s.mood)),
  [...new Set(scenes.filter(s => !(MOODS as readonly string[]).includes(s.mood)).map(s => s.mood))].join(","));
cek("semua LATAR (id + EN) terisi", scenes.every(s => s.latar_id && s.latar_en));
cek("semua TEKS terisi", scenes.every(s => s.teks));
const teksTerpanjang = [...scenes].sort((a, b) => kata(b.teks) - kata(a.teks))[0];
cek(`TEKS ≤ 8 kata (terpanjang: "${teksTerpanjang.teks}" = ${kata(teksTerpanjang.teks)} kata)`, kata(teksTerpanjang.teks) <= 8);

console.log("── Ritme ──");
const totalKata = scenes.reduce((a, s) => a + kata(s.naskah), 0);
const anggaran = Math.round(target * 2.4);
const est = Math.ceil(totalKata / 2.4);
const padat = scenes.filter(s => kata(s.naskah) / 2.4 > s.durasi + 1);
console.log(`  total kata          : ${totalKata} (anggaran ${anggaran}, +${Math.round(((totalKata - anggaran) / anggaran) * 100)}%)`);
console.log(`  est. bicara TTS     : ${est}s vs ${total}s = ${Math.round((est / total) * 100)}% (uji #5: 132%, uji #2: 205%)`);
console.log(`  rata-rata kata/scene: ${(totalKata / scenes.length).toFixed(1)} (batas prompt 12)`);
console.log(`  scene kepadatan berlebih: ${padat.length} dari ${scenes.length}`);
console.log(`  daftar: ${padat.map(s => `S${s.no}(${kata(s.naskah)}k/${s.durasi}s)`).join(", ")}`);
const terpanjang = [...scenes].sort((a, b) => kata(b.naskah) - kata(a.naskah))[0];
console.log(`  naskah terpanjang   : S${terpanjang.no} ${kata(terpanjang.naskah)} kata / ${terpanjang.durasi}s`);
console.log(`  setelah ⚡ Perbaiki Ritme: total ±${fmtDurasi(scenes.reduce((a, s) => a + Math.max(s.durasi, Math.min(15, Math.ceil(kata(s.naskah) / 2.4))), 0))}s — masih wajar untuk YouTube`);

console.log(`\n${gagal === 0 ? "✅ SEMUA LULUS" : "❌ ADA YANG GAGAL"} (${lulus} lulus, ${gagal} gagal)`);
process.exit(gagal > 0 ? 1 : 0);
