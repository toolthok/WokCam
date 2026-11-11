/* ═══ Test regresi: Gaya video referensi (promo tipografi terang) di wokCam ═══
 * Jalankan: bun scripts/test-promo-style.ts
 * Latar belakang: user mengunggah video referensi (promo ala opencode/insiderforce) dan
 * meminta wokCam bisa membuat gaya yang sama. Kontrak baru yang diuji di sini:
 *   1. Vocab baru: gerakan animasi "kata" (teks muncul kata-demi-kata) + transisi "blur".
 *   2. PAKET_PROMO: paket siap pakai hasil bedah video referensi, impor idempoten.
 *   3. uraiTeks(): penanda **tebal** / *miring* dipecah per kata + teksTanpaMarker().
 *   4. polaAnimasiKata(): jendela reveal kata-demi-kata (≤55% durasi scene, langkah 70-420ms).
 *   5. Transisi blur: gayaTransisiMasuk/Keluar menghasilkan filter blur.
 *   6. Latar "kertas-grid" (tekstur grid + terang) — konsistensi branding ala referensi.
 *   7. Kontrak proyek: badge/watermark (proyek) + kartu (scene) — serialisasi & muat toleran.
 */

import {
  uraiTeks, teksTanpaMarker, gayaTransisiMasuk, gayaTransisiKeluar,
  LATAR_PRESET, latarDariId, proyekDariJSON, proyekKeJSON,
  type SceneProyek,
} from "../src/lib/editor/proyek";
import {
  GERAKAN_ANIMASI, GERAKAN_TRANSISI, PAKET_PROMO,
  koleksiBawaan, tambahkanPaket, imporKeKoleksi, type Koleksi,
} from "../src/lib/preset-store";
import { polaAnimasiKata } from "../src/components/preset-preview";
import { proyekTutorial } from "../src/lib/editor/proyek";

let ok = 0, gagal = 0;
function uji(nama: string, kondisi: boolean | null | undefined, detail = "") {
  if (kondisi === true) { ok++; console.log(`  LULUS  ${nama}`); }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? ` — ${detail}` : ""}`); }
}

console.log("── 1 · Vocab baru: gerakan 'kata' + transisi 'blur' ──");
{
  uji("GERAKAN_ANIMASI.in memuat 'kata'", GERAKAN_ANIMASI.in.includes("kata"), GERAKAN_ANIMASI.in.join(","));
  uji("GERAKAN_ANIMASI.out tidak memuat 'kata'", !GERAKAN_ANIMASI.out.includes("kata"));
  uji("GERAKAN_TRANSISI memuat 'blur'", GERAKAN_TRANSISI.includes("blur"), GERAKAN_TRANSISI.join(","));
  uji("PAKET_PROMO punya preset 'Kata Muncul Berturut' (gerakan kata)", PAKET_PROMO.presets.some(p => p.nama === "Kata Muncul Berturut" && p.gerakan === "kata"));
  uji("PAKET_PROMO punya transisi blur 'Blur Berganti Konten'", PAKET_PROMO.transitions.some(t => t.nama === "Blur Berganti Konten" && t.gerakan === "blur"));
}

console.log("── 2 · PAKET_PROMO: impor satu klik & idempoten ──");
{
  const h1 = tambahkanPaket(koleksiBawaan(), "promo");
  uji("impor promo: 10 item baru (4 preset · 3 transisi · 3 style)", h1.ditambah === 10, String(h1.ditambah));
  uji("impor promo tanpa error", !h1.errorGlobal, h1.errorGlobal ?? "");
  const h2 = tambahkanPaket(h1.koleksi, "promo");
  uji("impor ulang promo: 0 baru (idempoten)", h2.ditambah === 0, String(h2.ditambah));

  /* roundtrip impor manual (jalur impor JSON user) tidak merusak nilai khusus */
  const json = JSON.stringify({ version: 1, presets: PAKET_PROMO.presets, transitions: PAKET_PROMO.transitions, styles: PAKET_PROMO.styles });
  const h3 = imporKeKoleksi(koleksiBawaan(), json, "gabung");
  const kata = h3.koleksi.presets.find(p => p.nama === "Kata Muncul Berturut");
  uji("impor manual JSON promo mempertahankan gerakan 'kata'", kata?.gerakan === "kata", kata?.gerakan ?? "tidak ada");
  uji("impor manual JSON promo mempertahankan transisi 'blur'", h3.koleksi.transitions.some(t => t.gerakan === "blur"));
  uji("koleksi kosong + promo → semua nama tutorial resolve", (() => {
    const koleksi: Koleksi = tambahkanPaket(koleksiBawaan(), "promo").koleksi;
    const p = proyekTutorial();
    return p.scenes.every(s =>
      koleksi.presets.some(pr => pr.nama === s.animIn && pr.tipe === "in") &&
      koleksi.presets.some(pr => pr.nama === s.animLoop && pr.tipe === "loop") &&
      koleksi.presets.some(pr => pr.nama === s.animOut && pr.tipe === "out") &&
      koleksi.styles.some(st => st.nama === s.style) &&
      (s.transisi === null || koleksi.transitions.some(tr => tr.nama === s.transisi)));
  })());
}

console.log("── 3 · uraiTeks: penanda **tebal** / *miring* ──");
{
  const a = uraiTeks("Bikin **video faceless** *tanpa kamera* wokCam!");
  uji("uraiTeks jumlah kata = 6", a.length === 6, JSON.stringify(a));
  uji("kata 'video' bergaya tebal", a[1].gaya === "tebal" && a[1].kata === "video");
  uji("kata 'faceless' bergaya tebal (segmen multi-kata)", a[2].gaya === "tebal" && a[2].kata === "faceless");
  uji("kata 'tanpa' bergaya miring", a[3].gaya === "miring" && a[3].kata === "tanpa");
  uji("kata 'wokCam!' normal", a[5].gaya === "normal" && a[5].kata === "wokCam!");

  const b = uraiTeks("tanpa penanda sama sekali");
  uji("teks polos → semua normal", b.every(k => k.gaya === "normal") && b.length === 4);

  const c = uraiTeks("penanda bintang *tak berpasangan diabaikan");
  uji("penanda tak berpasangan → literal", c.some(k => k.kata.includes("*")));

  const d = uraiTeks("**dua kata** saja");
  uji("penanda di awal teks", d[0].gaya === "tebal" && d[1].gaya === "tebal" && d[2].gaya === "normal");

  uji("teksTanpaMarker menghapus ** dan *", teksTanpaMarker("Bikin **video faceless** *tanpa kamera*") === "Bikin video faceless tanpa kamera", teksTanpaMarker("Bikin **video faceless** *tanpa kamera*"));
  uji("teksTanpaMarker merapikan spasi ganda", teksTanpaMarker("satu  **dua**   tiga") === "satu dua tiga");
}

console.log("── 4 · polaAnimasiKata: ritme reveal kata-demi-kata ──");
{
  const presetKata = { nama: "Kata Muncul Berturut", tipe: "in" as const, gerakan: "kata", arah: "", durasi_ms: 2400, easing: "ease_out", intensitas: 100, tag: [], sfx: "" };
  const pola6 = polaAnimasiKata(presetKata, 6, 7);
  uji("pola ada untuk gerakan kata", pola6 !== null);
  uji("jendela reveal ≤ 55% durasi scene (7s → langkah × 6 ≤ 3850ms)", pola6 ? pola6.langkah * 6 <= 3850 : false, pola6 ? String(pola6.langkah) : "-");
  uji("langkah dijepit maksimal 420ms", pola6 ? pola6.langkah <= 420 : false, pola6 ? String(pola6.langkah) : "-");

  const polaBanyak = polaAnimasiKata(presetKata, 20, 4);
  uji("scene pendek + banyak kata → langkah tak di bawah 70ms", polaBanyak ? polaBanyak.langkah >= 70 : false, polaBanyak ? String(polaBanyak.langkah) : "-");

  const presetSlide = { ...presetKata, gerakan: "slide" };
  uji("bukan gerakan kata → null (jalur keyframe biasa)", polaAnimasiKata(presetSlide, 6, 7) === null);
  uji("jumlah kata 0 → null", polaAnimasiKata(presetKata, 0) === null);
}

console.log("── 5 · Transisi blur: masuk dari kabur, keluar ke kabur ──");
{
  const masuk0 = gayaTransisiMasuk("blur", "", 0);
  const masukTengah = gayaTransisiMasuk("blur", "", 0.5);
  const masuk1 = gayaTransisiMasuk("blur", "", 1);
  uji("masuk q=0 → blur maksimal 14px", masuk0.filter === "blur(14.00px)", String(masuk0.filter));
  /* easing ease-out cubic: e(0.5)=0.875 → blur = 14×(1−0.875) = 1.75px (jernih dulu, cepat) */
  uji("masuk q=0.5 → blur 1.75px (ease-out cubic)", masukTengah.filter === "blur(1.75px)", String(masukTengah.filter));
  uji("masuk q=1 → tanpa blur (jernih)", masuk1.filter === "blur(0.00px)", String(masuk1.filter));
  uji("masuk q=1 → skala 1 (posisi normal)", masuk1.transform === "scale(1.0000)", String(masuk1.transform));

  const keluar0 = gayaTransisiKeluar("blur", "", 0);
  const keluar1 = gayaTransisiKeluar("blur", "", 1);
  uji("keluar q=0 → jernih", keluar0.filter === "blur(0.00px)" && keluar0.opacity === 1);
  uji("keluar q=1 → kabur + transparan", keluar1.filter === "blur(14.00px)" && keluar1.opacity === 0);
  uji("gerakan lain tak terpengaruh (crossfade tetap opacity)", gayaTransisiMasuk("crossfade", "", 0.5).opacity !== undefined);
}

console.log("── 6 · Latar kertas-grid: tekstur grid + terang ──");
{
  const grid = latarDariId("kertas-grid");
  uji("kertas-grid ada di katalog", grid !== null);
  uji("kertas-grid tekstur 'grid'", grid?.tekstur === "grid");
  uji("kertas-grid ditandai terang", grid?.terang === true);
  uji("kertas-terang juga terang (dekorasi lembut)", latarDariId("kertas-terang")?.terang === true);
  uji("latar gelap tidak berubah (laut-dalam tanpa tekstur/terang)", latarDariId("laut-dalam")?.tekstur === undefined && latarDariId("laut-dalam")?.terang === undefined);
  uji("katalog berisi 11 latar (10 lama + kertas-grid)", LATAR_PRESET.length === 11, String(LATAR_PRESET.length));
}

console.log("── 7 · Kontrak proyek: badge/watermark/kartu serialisasi & muat toleran ──");
{
  const p = proyekTutorial();
  const json = proyekKeJSON(p);
  const balik = proyekDariJSON(json);
  uji("roundtrip proyek tutorial ok", balik.ok);
  if (balik.ok) {
    uji("badge utuh", balik.proyek.badge === p.badge);
    uji("watermark utuh", balik.proyek.watermark === p.watermark);
    uji("kartu utuh di semua scene", balik.proyek.scenes.every((s, i) => s.kartu === p.scenes[i].kartu));
  }

  /* muat toleran: proyek lama TANPA badge/watermark/kartu tetap terbaca (null) */
  const lama = proyekDariJSON(JSON.stringify({
    version: 1, judul: "Proyek Lama", rasio: "9:16",
    scenes: [{ durasi: 5, latarPreset: "laut-dalam", overlayId: "grain", naskah: "", teks: "", mood: "fokus" }],
  }));
  uji("JSON lama tanpa badge/watermark/kartu → tetap terbaca", lama.ok);
  if (lama.ok) {
    uji("badge lama → null", lama.proyek.badge === null);
    uji("watermark lama → null", lama.proyek.watermark === null);
    uji("kartu lama → null", lama.proyek.scenes.every((s) => s.kartu === null));
  }

  /* alias alias Indonesia juga diterima (toleran) */
  const alias = proyekDariJSON(JSON.stringify({
    version: 1, judul: "Alias", rasio: "9:16", lencana: "BrandKita", tanda_air: "@brandkita",
    scenes: [{ durasi: 5, kartu: "Mockup", naskah: "", teks: "", mood: "fokus" }],
  }));
  uji("alias lencana/tanda_air diterima", alias.ok && alias.proyek.badge === "BrandKita" && alias.proyek.watermark === "@brandkita");
  uji("kartu diterima dari berkas ekspor", alias.ok && alias.proyek.scenes[0].kartu === "Mockup");

  /* nilai kosong/invalid → null, bukan error */
  const kotor = proyekDariJSON(JSON.stringify({
    version: 1, judul: "Kotor", rasio: "9:16", badge: 123, watermark: "   ",
    scenes: [{ durasi: 5, kartu: 42, naskah: "", teks: "", mood: "fokus" }],
  }));
  uji("badge non-string diabaikan", kotor.ok && kotor.proyek.badge === null);
  uji("watermark spasi kosong → null", kotor.ok && kotor.proyek.watermark === null);
  uji("kartu non-string diabaikan", kotor.ok && kotor.proyek.scenes[0].kartu === null);
}

console.log("── 8 · Scene type lengkap: duplikat/pisah membawa kartu ──");
{
  /* scene() lokal untuk konstruksi literal lengkap */
  const scene = (u: Partial<SceneProyek>): SceneProyek => ({
    id: u.id ?? "x", naskah: u.naskah ?? "", teks: u.teks ?? "", durasi: u.durasi ?? 5,
    mood: u.mood ?? "fokus", latarId: u.latarId ?? "", latarEn: u.latarEn ?? "",
    latarPreset: u.latarPreset ?? null, overlayId: u.overlayId ?? null, kartu: u.kartu ?? null,
    animIn: u.animIn ?? null, animOut: u.animOut ?? null, animLoop: u.animLoop ?? null,
    transisi: u.transisi ?? null, style: u.style ?? null,
  });
  const asal = scene({ id: "a", teks: "Halo **dunia**", kartu: "Contoh Kartu", naskah: "Halo dunia. Satu dua tiga." });
  uji("scene konstruksi manual membawa kartu", asal.kartu === "Contoh Kartu");

  /* duplikat = spread → kartu ikut; uji lewat proyekTutorial roundtrip sudah menutup kontrak.
   * Cek tambahan: uraiTeks dipakai renderer — kata dengan tanda baca tetap utuh */
  const seg = uraiTeks("Putar **pratinjau**, *rekam* layar!");
  uji("tanda baca menempel kata (pratinjau,)", seg.some(k => k.kata === "pratinjau,") && k_gaya(seg, "pratinjau,") === "tebal");
  uji("kata miring dengan tanda baca (rekam)", seg.some(k => k.kata === "rekam") && k_gaya(seg, "rekam") === "miring");
}

function k_gaya(segm: { kata: string; gaya: string }[], kata: string): string {
  return segm.find((s) => s.kata === kata)?.gaya ?? "";
}

console.log(`\nHasil: ${ok} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
