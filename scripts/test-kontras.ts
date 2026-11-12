/* ═══ Test regresi: kontras teks ═══  Jalankan: bun scripts/test-kontras.ts */
import { luminansi, rasioKontras, pilihWarnaTeks, TEKS_GELAP, TEKS_TERANG } from "../src/lib/editor/render-math";

let lulus = 0, gagal = 0;
const ok = (c: boolean, m: string) => { if (c) lulus++; else { gagal++; console.log("  ✗ " + m); } };

ok(Math.abs(rasioKontras("#000000", "#FFFFFF") - 21) < 0.01, "hitam vs putih = 21");
ok(Math.abs(rasioKontras("#777777", "#777777") - 1) < 1e-9, "warna sama = 1");
ok(luminansi("#FFFFFF") > 0.99 && luminansi("#000000") === 0, "luminansi batas");

const putih = ["#F4F4F5", "#E4E4E7", "#A1A1AA"];
ok(pilihWarnaTeks(putih, "#FFFFFF") === TEKS_GELAP, "teks putih di latar terang → charcoal");
ok(pilihWarnaTeks(putih, TEKS_GELAP) === TEKS_GELAP, "charcoal di latar terang → dipertahankan");
const gelap = ["#09090B", "#18181B"];
ok(pilihWarnaTeks(gelap, TEKS_GELAP) === TEKS_TERANG, "charcoal di latar gelap → putih");
ok(pilihWarnaTeks(gelap, "#FFFFFF") === "#FFFFFF", "putih di latar gelap → dipertahankan");
const hijau = ["#34D399", "#15803D"];
const h = pilihWarnaTeks(hijau, "#FFDD00");
ok(h === TEKS_GELAP || h === TEKS_TERANG, "kuning di hijau → diganti");
ok(Math.min(...hijau.map((l) => rasioKontras(h, l))) >= 2.5, "hasil ganti kontras memadai");

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
