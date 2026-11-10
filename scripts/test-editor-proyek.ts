/* ═══ Test regresi: Model & operasi timeline (src/lib/editor/proyek.ts) ═══
 * Jalankan: bun scripts/test-editor-proyek.ts
 * Mencakup: clamp durasi kontrak 2-15 (langkah 0,5), impor naskah → scene,
 *           timing berurutan, reorder/pisah/duplikat/hapus murni, serialisasi JSON
 *           (dua bentuk: ekspor & autosave), transisi antar scene, gelombang suara,
 *           dan keamanan tanpa-browser (localStorage diabaikan di bun).
 */

import {
  clampDurasi, dariNaskahMentah, dariHasilNaskah, duplikatScene, geserScene, hapusScene,
  hitungTiming, moodAman, pisahScene, pisahTeks, proyekDariJSON, proyekKeJSON, proyekContoh,
  ringkasTeks, sceneKosong, totalDurasi, transisiDiWaktu, gelombangSuara, gradientMood,
  DURASI_MIN, DURASI_MAKS, type SceneProyek,
} from "../src/lib/editor/proyek";
import { koleksiBawaan, tambahkanPaket, type Koleksi } from "../src/lib/preset-store";

let ok = 0, gagal = 0;
function uji(nama: string, kondisi: boolean, detail = "") {
  if (kondisi) { ok++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
}

function scene(u: Partial<SceneProyek>): SceneProyek {
  return {
    id: u.id ?? "x", naskah: u.naskah ?? "", teks: u.teks ?? "", durasi: u.durasi ?? 5,
    mood: u.mood ?? "fokus", latarId: u.latarId ?? "", latarEn: u.latarEn ?? "",
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
  const contoh = proyekContoh();
  uji("proyek contoh 5 scene", contoh.scenes.length === 5, String(contoh.scenes.length));
  uji("judul contoh terisi", contoh.judul.length > 0);
  uji("semua durasi di rentang 2-15", contoh.scenes.every((s) => s.durasi >= 2 && s.durasi <= 15));
  uji("id unik", new Set(contoh.scenes.map((s) => s.id)).size === 5);
  uji("assignment awal kosong (belum diatur)", contoh.scenes.every((s) => !s.animIn && !s.animOut && !s.animLoop && !s.transisi && !s.style));
  uji("mood dalam daftar", contoh.scenes.every((s) => ["tenang","energik","dramatis","ceria","misterius","fokus"].includes(s.mood)));
  uji("teks layar diisi dari TEKS", contoh.scenes[0].teks.length > 0);
  uji("latar EN terpisah dari latar ID", contoh.scenes[0].latarEn.length > 0 && contoh.scenes[0].latarId.length > 0);

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
  const json = proyekKeJSON({ version: 1, judul: "Uji Proyek!", rasio: "9:16", scenes: arr });
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

  uji("JSON rusak → error jelas", !proyekDariJSON("{pecah").ok);
  uji("tanpa scenes → error", !proyekDariJSON('{"judul":"x"}').ok);
  uji("rasio tak dikenal → 9:16", proyekDariJSON('{"scenes":[{"durasi":5}],"rasio":"21:9"}').ok && (proyekDariJSON('{"scenes":[{"durasi":5}],"rasio":"21:9"}') as { ok: true }).proyek.rasio === "9:16");
  uji("durasi hilang → 5", (proyekDariJSON('{"scenes":[{}]}') as { ok: true }).proyek.scenes[0].durasi === 5);
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

console.log(`\nHasil: ${ok} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
