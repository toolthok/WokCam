/* ═══ Test regresi: keyframe posisi teks ═══  Jalankan: bun scripts/test-teks-kf.ts */
import { kfTeksDariJSON, posTeksDiWaktu, tulisKfTeks } from "../src/lib/editor/teks-kf";

let lulus = 0, gagal = 0;
const ok = (c: boolean, m: string) => { if (c) lulus++; else { gagal++; console.log("  ✗ " + m); } };
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

ok(posTeksDiWaktu([], 1) === null, "tanpa keyframe = null");
const kf = [{ t: 0, x: 10, y: 20 }, { t: 2, x: 50, y: 80 }];
ok(near(posTeksDiWaktu(kf, 0)!.x, 10), "t=0 → posisi pertama");
ok(near(posTeksDiWaktu(kf, 1)!.x, 30) && near(posTeksDiWaktu(kf, 1)!.y, 50), "tengah = linear (30,50)");
ok(near(posTeksDiWaktu(kf, 9)!.y, 80), "setelah terakhir = terakhir");
ok(near(posTeksDiWaktu([{ t: 3, x: 40, y: 40 }], 0)!.x, 40), "satu keyframe = konstan");

const a = tulisKfTeks([], 1, 60, 30);
ok(a.length === 1 && a[0].t === 1, "tulis tanpa kf → sisipkan");
const b = tulisKfTeks(a, 1.1, 70, 35);
ok(b.length === 1 && b[0].x === 70, "dalam toleransi → perbarui yang ada");
const c = tulisKfTeks(b, 3, 20, 90);
ok(c.length === 2 && c[1].t === 3 && c[0].t === 1, "di luar toleransi → sisip & urut");
ok(a[0].x === 60 && b !== a, "input tidak dimutasi");

const bersih = kfTeksDariJSON([{ t: 2, x: 200, y: -5 }, { t: "x" }, { t: 0.5, x: 1, y: 2 }, null]);
ok(bersih.length === 2 && bersih[0].t === 0.5 && bersih[1].x === 100 && bersih[1].y === 0, "normalisasi: jepit, buang tak valid, urut");
ok(kfTeksDariJSON("bukan array").length === 0, "non-array aman");

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
