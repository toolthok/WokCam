/* Bangun fixture raw inline (format ChatGPT uji #5: semua field SATU baris per scene)
   dari JSON ekspor asli pengguna — supaya konten raw & ekspor dijamin konsisten. */
import { writeFileSync, readFileSync } from "node:fs";
import { parseNaskah } from "../src/lib/naskah-parser";

const ekspor = JSON.parse(readFileSync(new URL("./fixtures/hasil-alam-semesta.json", import.meta.url), "utf8"));

const raw = ekspor.scenes
  .map((e: any) =>
    `=== SCENE ${e.no} === NASKAH: ${e.naskah} TEKS: ${e.teks} DURASI: ${e.durasi} MOOD: ${e.mood} LATAR: ${e.latar_id} | EN: ${e.latar_en}`
  )
  .join("\n\n");

writeFileSync(new URL("./fixtures/hasil-alam-semesta.txt", import.meta.url), raw + "\n");
console.log(`fixture raw ditulis: ${ekspor.scenes.length} scene inline satu baris`);

/* Sanity: hasil parse harus persis sama dengan ekspor */
const hasil = parseNaskah(raw, 150);
let beda = 0;
for (const e of ekspor.scenes) {
  const s = hasil.scenes[e.no - 1];
  if (!s || s.naskah !== e.naskah || s.teks !== e.teks || s.durasi !== e.durasi ||
      s.mood !== e.mood || s.latarId !== e.latar_id || s.latarEn !== e.latar_en) {
    beda++;
    console.log(`  BEDA di S${e.no}`);
  }
}
console.log(beda === 0 ? "✅ parse == ekspor (30/30 identik)" : `❌ ${beda} scene beda`);
