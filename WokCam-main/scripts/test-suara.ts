/* ═══ Test regresi: Suara (TTS) — fungsi murni suara-util ═══
 * Jalankan: bun scripts/test-suara.ts */
import { sisaTeks, durasiDisarankan, urutkanSuara, adaSuaraIndonesia } from "../src/lib/editor/suara-util";

let lulus = 0, gagal = 0;
const ok = (c: boolean, m: string) => { if (c) lulus++; else { gagal++; console.log("  ✗ " + m); } };

const t = "satu dua tiga empat lima enam tujuh delapan sembilan sepuluh";
ok(sisaTeks(t, 0, 10) === t, "offset 0 → utuh");
ok(sisaTeks(t, 0.5, 10) === t, "offset <0,8 dtk → utuh");
ok(sisaTeks(t, 5, 10) === "enam tujuh delapan sembilan sepuluh", "offset 50% → separuh akhir");
ok(sisaTeks(t, 9.6, 10) === "", "hampir selesai → kosong");
ok(sisaTeks("  ", 3, 10) === "", "teks kosong → kosong");
ok(sisaTeks("a  b\n c", 0, 5) === "a b c", "spasi dirapikan");
ok(sisaTeks(t, 3, 0) === t, "durasi 0 aman");

ok(durasiDisarankan(0) === 2, "minimum 2 dtk");
ok(durasiDisarankan(3000) === 3.5, "3,0s + 0,4 → 3,5");
ok(durasiDisarankan(3200) === 4, "3,6 → naik ke 4,0");
ok(durasiDisarankan(30000) === 15, "maksimum 15 dtk");
ok(durasiDisarankan(4000, 0) === 4, "jeda 0");

const v = [{ name: "Zed", lang: "en-US" }, { name: "Gadis", lang: "id-ID" }, { name: "Amir", lang: "ms_MY" }, { name: "Budi", lang: "id_ID" }];
const u = urutkanSuara(v);
ok(u[0].name === "Budi" && u[1].name === "Gadis", "id dulu, menaik nama");
ok(u[2].lang === "ms_MY" && u[3].lang === "en-US", "ms lalu lainnya");
ok(adaSuaraIndonesia(v) && !adaSuaraIndonesia([{ lang: "en-US" }]), "adaSuaraIndonesia");
ok(v[0].name === "Zed", "input tidak dimutasi");

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
