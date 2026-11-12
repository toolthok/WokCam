/* ═══ Test regresi: render video — matematika animasi & transisi ═══
 * Jalankan: bun scripts/test-render-math.ts */
import { IDENT, gabung, animasiMasukKeluar, animasiLoop, transisiPose, segitiga, warnaDariKelas, resolusiRasio, arahDir } from "../src/lib/editor/render-math";

let lulus = 0, gagal = 0;
const ok = (c: boolean, m: string) => { if (c) lulus++; else { gagal++; console.log("  ✗ " + m); } };
const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) <= e;

const fade = { gerakan: "fade", durasi_ms: 500 };
ok(animasiMasukKeluar(fade, 0, 5, "in").alpha === 0, "fade masuk mulai transparan");
ok(near(animasiMasukKeluar(fade, 0.25, 5, "in").alpha, 0.5), "fade masuk tengah = 0,5");
ok(animasiMasukKeluar(fade, 0.6, 5, "in") === IDENT, "setelah masuk = identitas");
ok(near(animasiMasukKeluar(fade, 4.75, 5, "out").alpha, 0.5), "fade keluar tengah jendela = 0,5");
ok(animasiMasukKeluar(fade, 2, 5, "out").alpha === 1, "di tengah scene keluar tidak aktif");
ok(animasiMasukKeluar(null, 0, 5, "in") === IDENT, "tanpa preset = identitas");

const slide = { gerakan: "slide", arah: "kiri", durasi_ms: 400 };
const s0 = animasiMasukKeluar(slide, 0, 5, "in");
ok(near(s0.dx, -0.25) && s0.alpha === 0, "slide dari kiri: mulai di -25% lebar");
ok(animasiMasukKeluar(slide, 0.4, 5, "in") === IDENT, "slide selesai = identitas");

const kata = { gerakan: "kata", durasi_ms: 800 };
ok(animasiMasukKeluar(kata, 0, 5, "in") === IDENT, "kata: ditangani renderer teks, bukan pose");

const wipe = { gerakan: "wipe", arah: "kanan", durasi_ms: 1000 };
ok(near(animasiMasukKeluar(wipe, 0.5, 5, "in").clip ?? -1, 0.5) && animasiMasukKeluar(wipe, 0.5, 5, "in").sisi === "kanan", "wipe masuk: klip 50% dari kanan");

ok(segitiga(0, 1) === 0 && segitiga(1, 1) === 1 && segitiga(1.5, 1) === 0.5 && segitiga(2, 1) === 0, "segitiga periode 1 dtk");
ok(animasiLoop(null, 3) === IDENT, "loop tanpa preset = identitas");
const zin = animasiLoop({ gerakan: "zoom_in", durasi_ms: 1000, intensitas: 100 }, 1);
ok(near(zin.sc, 1.1), "zoom_in puncak = 1 + 0,1·amp");
ok(animasiLoop({ gerakan: "pan_kanan", durasi_ms: 1000, intensitas: 100 }, 0).sc === 1.06, "pan skala dasar 1,06");

const x = transisiPose("crossfade", "", 0.25);
ok(near(x.A.alpha, 0.75) && near(x.B.alpha, 0.25), "crossfade: 0,75 / 0,25");
const sl = transisiPose("slide", "kiri", 0.5);
ok(near(sl.B.dx, -0.5) && near(sl.A.dx, 0.5), "slide kiri: B dari kiri, A keluar ke kanan");
ok(transisiPose("wipe", "atas", 0.3).B.clip === 0.3, "wipe: B terbuka 30%");

const g = gabung({ ...IDENT, alpha: 0.5, dx: 0.1, sc: 1.1 }, { ...IDENT, alpha: 0.5, dx: 0.1, sc: 1.2 });
ok(near(g.alpha, 0.25) && near(g.dx, 0.2) && near(g.sc, 1.32), "gabung: alpha×, dx+, sc×");

ok(warnaDariKelas("from-fuchsia-600 via-purple-800 to-zinc-950").join() === "#c026d3,#6b21a8,#09090b", "gradien 3 warna");
ok(warnaDariKelas("from-zinc-100 to-zinc-400").length === 2, "gradien 2 warna");
ok(warnaDariKelas("kosong").length === 2, "tanpa warna → cadangan");

ok(resolusiRasio("9:16").join("x") === "720x1280" && resolusiRasio("1:1").join("x") === "1080x1080" && resolusiRasio("16:9").join("x") === "1280x720", "resolusi per rasio");
ok(arahDir("atas").join() === "0,-1" && arahDir("x").join() === "0,0", "arah");

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
