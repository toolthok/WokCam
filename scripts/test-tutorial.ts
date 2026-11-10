/* ═══ Test regresi: Proyek Tutorial — timeline sebagai contoh video terbaik + panduan wokCam ═══
 * Jalankan: bun scripts/test-tutorial.ts
 * Latar belakang (keputusan user):
 *   1. "kita melupakan overlays dan background" → keduanya KURANG di revisi awal; kini
 *      latar (LATAR_PRESET) & overlay (OVERLAY_PRESET) resmi di UI dan dipamerkan tutorial.
 *   2. Timeline harus "keren sebagai contoh video sebaik" → proyek default = showcase utuh.
 *   3. "sekaligus tutorial memakai wokCam" → isi 8 scene mengajarkan 6 langkah alur kerja.
 * Test ini mengunci kontrak itu: struktur craft, ritme bicara 2,4 kata/dtk, assignment
 * penuh yang SEMUA namanya resolve di Koleksi (Paket Minimalis), dan roundtrip JSON.
 */

import {
  NASKAH_TUTORIAL, JUDUL_TUTORIAL, TUTORIAL_ASSIGN, proyekTutorial,
  proyekKeJSON, proyekDariJSON, hitungTiming, totalDurasi, transisiDiWaktu,
  DURASI_MAKS, LATAR_PRESET, OVERLAY_PRESET, latarDariId, overlayDariId,
} from "../src/lib/editor/proyek";
import { parseNaskah, terapkanRitme, MOODS } from "../src/lib/naskah-parser";
import { koleksiBawaan, tambahkanPaket, type Koleksi } from "../src/lib/preset-store";

let ok = 0, gagal = 0;
function uji(nama: string, kondisi: boolean, detail = "") {
  if (kondisi) { ok++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
}
const kata = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

console.log("── 1 · Struktur narasi tutorial (hook → langkah → CTA) ──");
{
  const p = proyekTutorial();
  uji("judul proyek = JUDUL_TUTORIAL", p.judul === JUDUL_TUTORIAL, p.judul);
  uji("8 scene", p.scenes.length === 8, String(p.scenes.length));
  const total = totalDurasi(p.scenes);
  uji("total durasi 45-60 detik (format vertikal pendek)", total >= 45 && total <= 60, `${total}s`);

  const teks = p.scenes.map((s) => s.teks.toLowerCase());
  uji("scene 1 = hook yang menyebut wokCam", teks[0].includes("wokcam"), teks[0]);
  uji("scene 2-7 = enam langkah bernomor", teks.slice(1, 7).every((t) => t.includes("langkah")), teks.slice(1, 7).join(" | "));
  for (let i = 0; i < 6; i++) uji(`  langkah ${i + 1} urut benar`, teks[i + 1].includes(`langkah ${i + 1}`), teks[i + 1]);
  uji("scene 8 = CTA (ajakan meniru)", teks[7].includes("giliranmu") || teks[7].includes("mulai"), teks[7]);

  const moodUnik = new Set(p.scenes.map((s) => s.mood));
  uji("mood bervariasi (≥3 jenis) — bukan monoton", moodUnik.size >= 3, [...moodUnik].join(","));
  uji("mood semua sah", p.scenes.every((s) => (MOODS as readonly string[]).includes(s.mood)));
}

console.log("── 2 · Craft: ritme bicara 2,4 kata/dtk (tanpa perlu 'Perbaiki Ritme') ──");
{
  const hasil = parseNaskah(NASKAH_TUTORIAL, null);
  uji("parser tidak error global", !hasil.errorGlobal, hasil.errorGlobal ?? "");
  uji("parser membaca 8 scene", hasil.scenes.length === 8, String(hasil.scenes.length));

  /* terapkanRitme tidak boleh mengubah satu pun durasi → durasi manual sudah pas */
  const target = hasil.scenes.map((s) => s.durasi);
  const sesudah = terapkanRitme(hasil, null).scenes.map((s) => s.durasi);
  uji("terapkanRitme no-op (durasi sudah muat naskah)", JSON.stringify(target) === JSON.stringify(sesudah), `${target.join("/")} → ${sesudah.join("/")}`);

  const p = proyekTutorial();
  uji("naskah ≤ 2,6 kata per detik di tiap scene", p.scenes.every((s) => kata(s.naskah) <= s.durasi * 2.6 + 0.01));
  uji("teks layar maks 8 kata", p.scenes.every((s) => kata(s.teks) <= 8), p.scenes.map((s) => `${kata(s.teks)}:"${s.teks}"`).join(" "));
  uji("durasi semua di rentang 2-15", p.scenes.every((s) => s.durasi >= 2 && s.durasi <= DURASI_MAKS));
  uji("durasi langkah 0,5 (6,5 dtk dipertahankan parser)", p.scenes.some((s) => s.durasi === 6.5));
}

console.log("── 3 · Showcase: assignment penuh & semua resolve di Koleksi ──");
{
  let koleksi: Koleksi = tambahkanPaket(koleksiBawaan(), "minimalis").koleksi;
  koleksi = tambahkanPaket(koleksi, "horror").koleksi; // koleksi user nyata bisa keduanya
  koleksi = tambahkanPaket(koleksi, "promo").koleksi; // v2: tutorial merujuk Paket Promo
  const p = proyekTutorial();

  uji("TUTORIAL_ASSIGN panjangnya = jumlah scene", TUTORIAL_ASSIGN.length === p.scenes.length);
  uji("tiap scene punya animIn", p.scenes.every((s) => !!s.animIn));
  uji("tiap scene punya animLoop", p.scenes.every((s) => !!s.animLoop));
  uji("tiap scene punya animOut", p.scenes.every((s) => !!s.animOut));
  uji("tiap scene punya style", p.scenes.every((s) => !!s.style));
  uji("transisi terisi kecuali scene terakhir", p.scenes.slice(0, -1).every((s) => !!s.transisi) && p.scenes[7].transisi === null);

  for (const s of p.scenes) {
    const inOk = koleksi.presets.some((pr) => pr.nama === s.animIn && pr.tipe === "in");
    const loopOk = koleksi.presets.some((pr) => pr.nama === s.animLoop && pr.tipe === "loop");
    const outOk = koleksi.presets.some((pr) => pr.nama === s.animOut && pr.tipe === "out");
    const styleOk = koleksi.styles.some((st) => st.nama === s.style);
    const transOk = s.transisi === null || koleksi.transitions.some((tr) => tr.nama === s.transisi);
    uji(`scene "${s.teks}" — semua nama preset ada di Koleksi`, inOk && loopOk && outOk && styleOk && transOk,
      `in:${s.animIn} loop:${s.animLoop} out:${s.animOut} style:${s.style} trans:${s.transisi}`);
  }

  /* variasi: tutorial bukan melekat satu preset doang */
  uji("animIn bervariasi (≥2 nama: kata-demi-kata + kartu)", new Set(p.scenes.map((s) => s.animIn)).size >= 2);
  uji("transisi bervariasi (≥3 nama)", new Set(p.scenes.filter((s) => s.transisi).map((s) => s.transisi)).size >= 3);
  uji("style memakai ≥3 nama", new Set(p.scenes.map((s) => s.style)).size >= 3);
}

console.log("── 3a · Gaya video referensi: badge, tanda air, kartu, teks beranotasi ──");
{
  const p = proyekTutorial();
  uji("badge proyek terisi (pill atas)", p.badge === "wokCam", String(p.badge));
  uji("watermark proyek terisi (bawah)", !!p.watermark && p.watermark.startsWith("@"), String(p.watermark));
  uji("kartu mengambang di ≥2 scene", p.scenes.filter((s) => s.kartu).length >= 2);
  uji("kartu berada di scene ber-animIn 'Kartu Promo Mengapung'", p.scenes.every((s) => !s.kartu || s.animIn === "Kartu Promo Mengapung"));
  uji("teks beranotasi: ≥4 scene memakai penanda ** atau *", p.scenes.filter((s) => /\*\*[^*]+\*\*|\*[^*]+\*/.test(s.teks)).length >= 4);
  uji("teks scene 1 menyebut wokCam", p.scenes[0].teks.toLowerCase().includes("wokcam"), p.scenes[0].teks);
}

console.log("── 3b · Latar & overlay (dulu terlupakan — kini dipamerkan tutorial) ──");
{
  const p = proyekTutorial();
  uji("tiap scene punya latarPreset katalog", p.scenes.every((s) => latarDariId(s.latarPreset) !== null));
  uji("tiap scene punya overlayId katalog", p.scenes.every((s) => overlayDariId(s.overlayId) !== null));
  /* v2 ala video referensi: latar KONSISTEN kertas-grid (branding), overlay yang berganti */
  uji("latar konsisten kertas-grid di semua scene (ala video referensi)", p.scenes.every((s) => s.latarPreset === "kertas-grid"), [...new Set(p.scenes.map((s) => s.latarPreset))].join(","));
  uji("kertas-grid punya tekstur grid", latarDariId("kertas-grid")?.tekstur === "grid");
  uji("SEMUA 8 overlay terpakai sekali", new Set(p.scenes.map((s) => s.overlayId)).size === OVERLAY_PRESET.length);
  uji("TUTORIAL_ASSIGN punya kolom latar/overlay/kartu", TUTORIAL_ASSIGN.every((a) => LATAR_PRESET.some((l) => l.id === a.latarPreset) && OVERLAY_PRESET.some((o) => o.id === a.overlayId)));
  uji("scene 'Hias timeline' menyebut latar & overlay", (() => {
    const n = p.scenes[5].naskah.toLowerCase();
    return n.includes("latar") && n.includes("overlay");
  })(), p.scenes[5].naskah);
}

console.log("── 4 · Integrasi timeline: transisi benar-benar berjalan di jendela akhir scene ──");
{
  let koleksi: Koleksi = tambahkanPaket(koleksiBawaan(), "promo").koleksi;
  const p = proyekTutorial();
  const segs = hitungTiming(p.scenes);

  const batas1 = segs[0].mulai + segs[0].dur - 0.1; // 0,1 dtk sebelum scene 1 selesai
  const t = transisiDiWaktu(p.scenes, koleksi, batas1);
  uji("jendela transisi scene 1→2 aktif", t !== null && t.indexA === 0 && t.indexB === 1, JSON.stringify(t));
  uji("gerakan = blur (Blur Berganti Konten — khas video referensi)", t?.gerakan === "blur", t?.gerakan ?? "null");

  uji("tengah scene tanpa transisi visual", transisiDiWaktu(p.scenes, koleksi, segs[1].mulai + 1) === null);
  uji("akhir proyek tanpa transisi (scene 8 null)", transisiDiWaktu(p.scenes, koleksi, totalDurasi(p.scenes) - 0.05) === null);
}

console.log("── 5 · Roundtrip ekspor JSON (penerus berkas database) ──");
{
  const p = proyekTutorial();
  const json = proyekKeJSON(p);
  const balik = proyekDariJSON(json);
  uji("JSON proyek terbaca balik", balik.ok);
  if (balik.ok) {
    const q = balik.proyek;
    uji("judul & jumlah scene utuh", q.judul === p.judul && q.scenes.length === 8);
    uji("seluruh assignment utuh setelah roundtrip", q.scenes.every((s, i) =>
      s.animIn === p.scenes[i].animIn && s.animLoop === p.scenes[i].animLoop &&
      s.animOut === p.scenes[i].animOut && s.style === p.scenes[i].style &&
      s.transisi === p.scenes[i].transisi && s.durasi === p.scenes[i].durasi && s.mood === p.scenes[i].mood));
    uji("latar & overlay utuh setelah roundtrip", q.scenes.every((s, i) =>
      s.latarPreset === p.scenes[i].latarPreset && s.overlayId === p.scenes[i].overlayId));
    uji("kartu utuh setelah roundtrip", q.scenes.every((s, i) => s.kartu === p.scenes[i].kartu));
    uji("badge & watermark utuh setelah roundtrip", q.badge === p.badge && q.watermark === p.watermark);
    const parsed = JSON.parse(json);
    uji("bentuk ekspor bersarang (animasi.in)", parsed.scenes[0].animasi.in === p.scenes[0].animIn);
    uji("bentuk ekspor transisi_ke_berikutnya", parsed.scenes[0].transisi_ke_berikutnya === p.scenes[0].transisi);
    uji("bentuk ekspor latar_preset & overlay", parsed.scenes[0].latar_preset === p.scenes[0].latarPreset && parsed.scenes[0].overlay === p.scenes[0].overlayId);
  }
}

console.log("── 6 · Naskah tanpa baris LATAR: parser tetap toleran, hiasan lewat katalog ──");
{
  const hasil = parseNaskah(NASKAH_TUTORIAL, null);
  uji("naskah tutorial sama sekali tanpa baris LATAR", !NASKAH_TUTORIAL.includes("LATAR:"));
  uji("scene hasil parse punya latar kosong", hasil.scenes.every((s) => s.latarId === "" && s.latarEn === ""));
  uji("LATAR hilang hanya jadi catatan info (toleran)", hasil.scenes.every((s) => s.catatan.some((c) => c.tipe === "info" && c.teks.includes("LATAR"))));
  uji("tidak ada catatan error di scene mana pun", hasil.scenes.every((s) => !s.catatan.some((c) => c.tipe === "error")));
}

console.log(`\nHasil: ${ok} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
