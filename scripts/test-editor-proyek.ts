/* ═══ Test regresi: Model & operasi timeline (src/lib/editor/proyek.ts) ═══
 * Jalankan: bun scripts/test-editor-proyek.ts
 * Mencakup: clamp durasi kontrak 2-15 (langkah 0,5), impor naskah → scene,
 *           timing berurutan, reorder/pisah/duplikat/hapus murni, serialisasi JSON
 *           (dua bentuk: ekspor & autosave), transisi antar scene, gelombang suara,
 *           dan keamanan tanpa-browser (localStorage diabaikan di bun).
 */

import {
  clampDurasi, dariNaskahMentah, dariHasilNaskah, duplikatScene, geserScene, hapusScene,
  hitungTiming, moodAman, pisahScene, pisahTeks, proyekDariJSON, proyekKeJSON, proyekTutorial,
  JUDUL_TUTORIAL, LATAR_PRESET, OVERLAY_PRESET, latarDariId, overlayDariId, kelasLatar,
  ringkasTeks, sceneKosong, totalDurasi, transisiDiWaktu, gelombangSuara, gradientMood,
  DURASI_MIN, DURASI_MAKS, type SceneProyek,
} from "../src/lib/editor/proyek";
import { koleksiBawaan, tambahkanPaket, type Koleksi } from "../src/lib/preset-store";

let ok = 0, gagal = 0;
/* kondisi menerima boolean|null|undefined: pola "h && ..." pada hasil fungsi yang bisa
 * null dihitung GAGAL bila null — hanya true yang lulus. Sekalian memenuhi tsc strict. */
function uji(nama: string, kondisi: boolean | null | undefined, detail = "") {
  if (kondisi === true) { ok++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
}

function scene(u: Partial<SceneProyek>): SceneProyek {
  return {
    id: u.id ?? "x", naskah: u.naskah ?? "", teks: u.teks ?? "", durasi: u.durasi ?? 5,
    mood: u.mood ?? "fokus", latarId: u.latarId ?? "", latarEn: u.latarEn ?? "",
    latarPreset: u.latarPreset ?? null, overlayId: u.overlayId ?? null, kartu: u.kartu ?? null,
    animIn: u.animIn ?? null, animOut: u.animOut ?? null, animLoop: u.animLoop ?? null,
    transisi: u.transisi ?? null, style: u.style ?? null,
  };
}

console.log("── 1 · clampDurasi (kontrak DURASI 2-15, langkah 0,5) ──");
{
  uji("1.2 → 2 (batas bawah)", clampDurasi(1.2) === 2, String(clampDurasi(1.2)));
  uji("0 → 2", clampDurasi(0) === 2);
  uji("20 → 15 (batas atas)", clampDurasi(20) === DURASI_MAKS, String(clampDurasi(20)));
  uji("5 → 5", clampDurasi(5) === 5);
  uji("4.3 → 4.5 (langkah 0,5)", clampDurasi(4.3) === 4.5, String(clampDurasi(4.3)));
  uji("4.24 → 4.0", clampDurasi(4.24) === 4, String(clampDurasi(4.24)));
  uji("NaN → 2", clampDurasi(Number.NaN) === DURASI_MIN);
  uji("DURASI_MIN = 2 dan DURASI_MAKS = 15", DURASI_MIN === 2 && DURASI_MAKS === 15);
}

console.log("── 2 · dariNaskahMentah (naskah berformat → scene) ──");
{
  const contoh = proyekTutorial();
  uji("proyek tutorial 8 scene", contoh.scenes.length === 8, String(contoh.scenes.length));
  uji("judul = judul tutorial", contoh.judul === JUDUL_TUTORIAL, contoh.judul);
  uji("semua durasi di rentang 2-15", contoh.scenes.every((s) => s.durasi >= 2 && s.durasi <= 15));
  uji("id unik", new Set(contoh.scenes.map((s) => s.id)).size === 8);
  uji("assignment penuh (showcase): in/loop/out/style terisi semua", contoh.scenes.every((s) => s.animIn && s.animLoop && s.animOut && s.style));
  uji("transisi terisi kecuali scene terakhir", contoh.scenes.slice(0, -1).every((s) => s.transisi) && contoh.scenes[7].transisi === null);
  uji("mood dalam daftar", contoh.scenes.every((s) => ["tenang","energik","dramatis","ceria","misterius","fokus"].includes(s.mood)));
  uji("teks layar diisi dari TEKS", contoh.scenes[0].teks.length > 0);
  uji("tutorial memakai latar preset yang SAH semua", contoh.scenes.every((s) => latarDariId(s.latarPreset) !== null));
  uji("tutorial memakai overlay yang SAH semua", contoh.scenes.every((s) => overlayDariId(s.overlayId) !== null));
  uji("latar KONSISTEN (semua kertas-grid — branding ala video referensi)", contoh.scenes.every((s) => s.latarPreset === "kertas-grid"));
  uji("overlay 8 jenis berbeda SEMUA terpakai", new Set(contoh.scenes.map((s) => s.overlayId)).size === OVERLAY_PRESET.length);

  const rusak = dariNaskahMentah("=== SCENE 1 ===\nNASKAH: nol kata? tidak.\nDURASI: 99\nMOOD: aneh sekali\nTEKS: Hi");
  uji("durasi 99 dijepit ke 15", rusak[0].durasi === 15, String(rusak[0].durasi));
  uji("mood tak dikenal → fokus", rusak[0].mood === "fokus", rusak[0].mood);

  const kosong = dariNaskahMentah("");
  uji("naskah kosong → 0 scene", kosong.length === 0);
}

console.log("── 3 · dariHasilNaskah + ringkasTeks ──");
{
  const hasil = dariHasilNaskah({
    scenes: [{ no: 1, naskah: "Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas", teks: "", durasi: 7, mood: "Tenang", latarId: "a", latarEn: "b", catatan: [] }],
    errorGlobal: undefined,
  });
  uji("teks layar otomatis dari naskah (maks 8 kata + …)", hasil[0].teks.endsWith("…") && hasil[0].teks.split(" ").length <= 9, hasil[0].teks);
  uji("mood 'Tenang' (huruf besar) → tetap tenang", hasil[0].mood === "tenang");
  uji("ringkasTeks pendek tanpa …", ringkasTeks("dua kata") === "dua kata");
  uji("pisahTeks memecah kalimat", pisahTeks("Satu. Dua! Tiga?").length === 3);
}

console.log("── 4 · Timing timeline berurutan ──");
{
  const arr = [scene({ durasi: 3 }), scene({ durasi: 4 }), scene({ durasi: 5 })];
  const segs = hitungTiming(arr);
  uji("start scene 2 = 3", segs[1].mulai === 3, String(segs[1].mulai));
  uji("start scene 3 = 7", segs[2].mulai === 7, String(segs[2].mulai));
  uji("total = 12", totalDurasi(arr) === 12);
}

console.log("── 5 · Reorder / duplikat / hapus (fungsi murni) ──");
{
  const arr = [scene({ id: "a" }), scene({ id: "b" }), scene({ id: "c" })];
  const geser = geserScene(arr, 2, 0);
  uji("geser c ke depan", geser.map((s) => s.id).join("") === "cab", geser.map((s) => s.id).join(""));
  uji("array asli tidak berubah (murni)", arr.map((s) => s.id).join("") === "abc");
  uji("geser invalid → array sama", geserScene(arr, 1, 1) === arr && geserScene(arr, -1, 0) === arr);

  const dup = duplikatScene(arr, "b");
  uji("duplikat tepat setelah asli", dup && dup.scenes.length === 4 && dup.scenes[1].id === "b" && dup.scenes[2].id === dup.idBaru_ && dup.scenes[3].id === "c", dup ? dup.scenes.map((s) => s.id).join(",") : "null");
  uji("duplikat id baru berbeda", dup && dup.scenes[2].id !== "b");
  uji("duplikat field disalin", dup && dup.scenes[2].durasi === dup.scenes[1].durasi);
  uji("duplikat id tak ada → null", duplikatScene(arr, "zz") === null);

  const hps = hapusScene(arr, "b");
  uji("hapus b", hps && hps.scenes.map((s) => s.id).join("") === "ac");
  uji("pilih berikutnya masuk akal", hps && hps.pilih === "c");
  uji("tolak hapus scene terakhir", hapusScene([scene({ id: "a" })], "a") === null);
}

console.log("── 6 · Pisah scene ──");
{
  const arr = [scene({ id: "s1", naskah: "Kalimat pertama di sini. Kalimat kedua menyusul. Kalimat ketiga juga ada.", teks: "Judul", durasi: 8, animIn: "X", transisi: "Y" })];
  const h = pisahScene(arr, "s1");
  uji("pisah menghasilkan 2 scene", h && h.scenes.length === 2, String(h?.scenes.length));
  uji("naskah dibagi kalimat", h && h.scenes[0].naskah.length > 0 && h.scenes[1].naskah.length > 0);
  uji("durasi dibagi rata & sah (≥2)", h && h.scenes[0].durasi === 4 && h.scenes[1].durasi === 4, `${h?.scenes[0].durasi}/${h?.scenes[1].durasi}`);
  uji("animasi disalin ke A, animIn B di-nol-kan", h && h.scenes[0].animIn === "X" && h.scenes[1].animIn === null);
  uji("transisi lama pindah ke scene kedua", h && h.scenes[0].transisi === null && h.scenes[1].transisi === "Y");
  uji("id baru berbeda", h && h.scenes[1].id !== "s1");
  uji("scene satu kalimat → null (tidak bisa dipisah)", pisahScene([scene({ id: "s2", naskah: "Satu kalimat saja." })], "s2") === null);
}

console.log("── 7 · Serialisasi JSON proyek (dua bentuk) ──");
{
  const arr: SceneProyek[] = [
    scene({ id: "a", naskah: "hai", teks: "Hai", durasi: 5, mood: "ceria", latarId: "kota", latarEn: "city", animIn: "Fade", animLoop: "Loop", style: "Bold", transisi: "Geser" }),
    scene({ id: "b", naskah: "bye", teks: "Bye", durasi: 6 }),
  ];
  const json = proyekKeJSON({ version: 1, judul: "Uji Proyek!", rasio: "9:16", badge: "Demo", watermark: "@uji", scenes: arr });
  const parsed = JSON.parse(json);
  uji("nomor scene dihitung ulang (no=1,2)", parsed.scenes[0].no === 1 && parsed.scenes[1].no === 2);
  uji("animasi bersarang (animasi.in)", parsed.scenes[0].animasi.in === "Fade");
  uji("transisi_ke_berikutnya ada", parsed.scenes[0].transisi_ke_berikutnya === "Geser");
  uji("id internal TIDAK ikut diekspor", parsed.scenes[0].id === undefined);

  const balik = proyekDariJSON(json);
  uji("JSON ekspor terbaca", balik.ok);
  if (balik.ok) {
    uji("judul dipertahankan", balik.proyek.judul === "Uji Proyek!");
    uji("assignment bentuk bersarang terbaca", balik.proyek.scenes[0].animIn === "Fade" && balik.proyek.scenes[0].animLoop === "Loop" && balik.proyek.scenes[0].style === "Bold");
    uji("transisi terbaca", balik.proyek.scenes[0].transisi === "Geser");
  }

  /* bentuk autosave: field datar di level scene */
  const autosave = JSON.stringify({ version: 1, judul: "Autosave", rasio: "1:1", scenes: arr.map((s) => ({ ...s })) });
  const balik2 = proyekDariJSON(autosave);
  uji("bentuk autosave (field datar) terbaca", balik2.ok);
  if (balik2.ok) {
    uji("animIn datar terbaca", balik2.proyek.scenes[0].animIn === "Fade");
    uji("rasio 1:1 dipertahankan", balik2.proyek.rasio === "1:1");
    uji("id BARU diberikan saat muat (hindari bentrok)", balik2.proyek.scenes.every((s) => s.id !== "a" && s.id !== "b"));
  }

  const r9 = proyekDariJSON('{"scenes":[{"durasi":5}],"rasio":"21:9"}');
  const rKosong = proyekDariJSON('{"scenes":[{}]}');
  uji("JSON rusak → error jelas", !proyekDariJSON("{pecah").ok);
  uji("tanpa scenes → error", !proyekDariJSON('{"judul":"x"}').ok);
  uji("rasio tak dikenal → 9:16", r9.ok && r9.proyek.rasio === "9:16");
  uji("durasi hilang → 5", rKosong.ok && rKosong.proyek.scenes[0].durasi === 5);
}

console.log("── 8 · Transisi antar scene (jendela akhir scene) ──");
{
  const koleksi = koleksiBawaan();
  const penuh: Koleksi = tambahkanPaket(koleksi, "minimalis").koleksi;
  const trans = penuh.transitions[0];
  const durasiTrans = trans.durasi_ms / 1000;

  const arr = [
    scene({ id: "a", durasi: 10, transisi: trans.nama }),
    scene({ id: "b", durasi: 10 }),
    scene({ id: "c", durasi: 10, transisi: "tidak ada presetnya" }),
  ];

  const t1 = transisiDiWaktu(arr, penuh, 10 - durasiTrans + 0.05);
  uji("jendela transisi aktif di akhir scene A", t1 !== null && t1.indexA === 0 && t1.indexB === 1, JSON.stringify(t1));
  uji("q berjalan 0→1", t1 !== null && t1.q > 0 && t1.q <= 1);

  const t2 = transisiDiWaktu(arr, penuh, 3);
  uji("di luar jendela → null", t2 === null);
  const t3 = transisiDiWaktu(arr, penuh, 15.5);
  uji("scene B→C tanpa transisi → null", t3 === null);
  const t4 = transisiDiWaktu(arr, penuh, 29.9);
  uji("preset tak ada di koleksi → null (toleran)", t4 === null, JSON.stringify(t4));
  const t5 = transisiDiWaktu(arr, penuh, 10 - durasiTrans - 0.5);
  uji("sebelum jendela → null", t5 === null);

  const arrNone = [scene({ id: "a", durasi: 5, transisi: trans.nama }), scene({ id: "b", durasi: 5 })];
  const presetNone = penuh.transitions.find((p) => p.gerakan === "none");
  if (presetNone) {
    const arrN = [scene({ id: "a", durasi: 5, transisi: presetNone.nama }), scene({ id: "b", durasi: 5 })];
    uji("gerakan none → bukan transisi visual", transisiDiWaktu(arrN, penuh, 4.9) === null);
  }
}

console.log("── 9 · Util kecil ──");
{
  uji("sceneKosong punya id & mood sah", (() => { const s = sceneKosong(3); return s.id.length > 0 && moodAman(s.mood) === s.mood && s.durasi === 5 })());
  uji("gradientMood semua mood ada", ["tenang","energik","dramatis","ceria","misterius","fokus"].every((m) => gradientMood(m).includes("from-")));
  uji("gradientMood tak dikenal → fallback", gradientMood("aneh") === gradientMood("fokus"));
  const g = gelombangSuara(1, 10);
  uji("gelombang suara 10 nilai 0..1", g.length === 10 && g.every((v) => v > 0 && v <= 1));
  uji("gelombang suara deterministik", JSON.stringify(gelombangSuara(7, 5)) === JSON.stringify(gelombangSuara(7, 5)));
}

console.log("── 10 · Katalog latar & overlay (dulu terlupakan, kini resmi) ──");
{
  const idLatar = LATAR_PRESET.map((l) => l.id);
  const idOverlay = OVERLAY_PRESET.map((o) => o.id);
  uji("11 latar: id unik (10 lama + kertas-grid baru)", new Set(idLatar).size === LATAR_PRESET.length && LATAR_PRESET.length === 11);
  uji("latar semua punya kelas gradien & kata kunci", LATAR_PRESET.every((l) => l.kelas.includes("from-") && l.kataKunciEn.length > 0 && l.nama.length > 0));
  uji("8 overlay: id unik", new Set(idOverlay).size === OVERLAY_PRESET.length && OVERLAY_PRESET.length === 8);
  uji("overlay semua punya nama & deskripsi", OVERLAY_PRESET.every((o) => o.nama.length > 0 && o.deskripsi.length > 0));
  uji("latarDariId(null) → null", latarDariId(null) === null);
  uji("latarDariId tak dikenal → null", latarDariId("tidak-ada") === null);
  uji("overlayDariId tak dikenal → null", overlayDariId("tidak-ada") === null);
  uji("kelasLatar preset → kelasnya", kelasLatar("malam-neon", "fokus") === LATAR_PRESET[0].kelas);
  uji("kelasLatar null → gradien mood", kelasLatar(null, "energik") === gradientMood("energik"));
  uji("kelasLatar tak dikenal → gradien mood (toleran)", kelasLatar("aneh", "ceria") === gradientMood("ceria"));

  /* serialisasi: latar/overlay ikut ekspor & balik utuh */
  const arr: SceneProyek[] = [
    scene({ id: "a", latarPreset: "senja-jogja", overlayId: "bokeh" }),
    scene({ id: "b" }), // tanpa latar/overlay (null)
  ];
  const json = proyekKeJSON({ version: 1, judul: "Uji Latar", rasio: "9:16", badge: null, watermark: null, scenes: arr });
  const parsed = JSON.parse(json);
  uji("ekspor berisi latar_preset", parsed.scenes[0].latar_preset === "senja-jogja", String(parsed.scenes[0].latar_preset));
  uji("ekspor berisi overlay", parsed.scenes[0].overlay === "bokeh", String(parsed.scenes[0].overlay));
  const balik = proyekDariJSON(json);
  uji("JSON latar/overlay terbaca balik", balik.ok && balik.proyek.scenes[0].latarPreset === "senja-jogja" && balik.proyek.scenes[0].overlayId === "bokeh");
  uji("scene tanpa latar/overlay → null", balik.ok && balik.proyek.scenes[1].latarPreset === null && balik.proyek.scenes[1].overlayId === null);

  /* JSON lama (sebelum fitur ini) tetap terbaca — field hilang → null */
  const lama = proyekDariJSON('{"scenes":[{"durasi":5,"style":"X"}],"judul":"Lama"}');
  uji("JSON lama tanpa field latar/overlay → null (kompatibel)", lama.ok && lama.proyek.scenes[0].latarPreset === null && lama.proyek.scenes[0].overlayId === null);

  /* id asing dipoloskan → null, bukan error */
  const asing = proyekDariJSON('{"scenes":[{"durasi":5,"latar_preset":"hacker-dark","overlay":"confetti"}]}');
  uji("id latar/overlay asing → null (toleran)", asing.ok && asing.proyek.scenes[0].latarPreset === null && asing.proyek.scenes[0].overlayId === null);

  /* bentuk autosave (field datar camelCase) juga terbaca */
  const autosave = proyekDariJSON(JSON.stringify({ version: 1, judul: "A", rasio: "9:16", scenes: [{ durasi: 5, latarPreset: "laut-dalam", overlayId: "grain" }] }));
  uji("autosave camelCase latarPreset/overlayId terbaca", autosave.ok && autosave.proyek.scenes[0].latarPreset === "laut-dalam" && autosave.proyek.scenes[0].overlayId === "grain");
}

console.log(`\nHasil: ${ok} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
