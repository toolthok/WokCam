/* ══════════ Prompt Rancangan Visual — AI mengerjakan ±50% pekerjaan awal ══════════
 * Hasil AI berupa JSON proyek lengkap (scene, durasi, teks, gaya, animasi, transisi, latar, overlay,
 * kartu, keyframe teks, slot aset). Yang belum ada di WokCam masuk "kebutuhan_baru" → antrian pengembangan.
 */

export type ParamRancangan = { topik: string; platform: string; rasio: string; durasi: number; jumlahScene: number; gaya: string; penonton: string; cta: string };

const LATAR = 'malam-neon, senja-jogja, pagi-bening, sawah-emerald, laut-dalam, hutan-kabut, studio-gelap, kertas-terang, kertas-grid, lava-dramatis, ungu-kuantum';
const OVERLAY = 'vignette, grain, letterbox, haze, bokeh, progress';
const PRESET = {
  in: 'Kata Muncul Berturut, Kartu Promo Mengapung',
  out: 'Promo Memudar Bersih',
  loop: 'Mockup Mengambang Santai',
  transisi: 'Geser Kartu Naik, Blur Berganti Konten, Potong Cepat',
  style: 'Judul Promo Hitam, Caption Promo Bawah, Teks Promo Sedang',
};

export function bangunPromptRancangan(f: ParamRancangan): string {
  const detik = (f.durasi / f.jumlahScene).toFixed(1);
  return `Kamu adalah perancang video faceless pendek berbahasa Indonesia. Rancang video LENGKAP untuk aplikasi editor wokCam.

TOPIK: ${f.topik || '(isi topik)'}
PLATFORM: ${f.platform} · RASIO: ${f.rasio} · GAYA: ${f.gaya} · PENONTON: ${f.penonton} · CTA: ${f.cta || 'ajakan singkat'}
TOTAL DURASI: TEPAT ${f.durasi} detik · JUMLAH SCENE: TEPAT ${f.jumlahScene} (rata-rata ${detik} dtk per scene, rentang 2–15 dtk, kelipatan 0,5)

TUJUAN: kerjakan ±50% pekerjaan desain sejak awal, supaya pengguna hanya perlu menempel hasil ini dan merapikannya.

ATURAN OUTPUT (WAJIB):
1. Keluarkan HANYA satu objek JSON valid. Tanpa penjelasan, tanpa blok kode markdown.
2. Jumlah semua "durasi" TEPAT ${f.durasi}. Tiap "naskah" maksimal ${Math.round(2.4 * Number(detik))} kata per scene (±2,4 kata/detik).
3. "teks" maksimal 8 kata; penekanan kata dengan **tebal** dan *miring*.
4. "mood" salah satu: tenang, energik, dramatis, ceria, misterius, fokus.
5. "latar_preset" salah satu: ${LATAR}.
6. "overlay" salah satu: ${OVERLAY}, atau null.
7. "animasi.in" / "animasi.out" / "animasi.loop", "style", "transisi_ke_berikutnya", "animLatar", "animKartu": PAKAI NAMA PRESET DARI DAFTAR INI bila cocok:
   masuk: ${PRESET.in} · keluar: ${PRESET.out} · loop: ${PRESET.loop} · transisi: ${PRESET.transisi} · gaya teks: ${PRESET.style}.
   Bila tidak ada yang cocok, tetap isi nama terdekat dari daftar, dan CATAT kebutuhannya di "kebutuhan_baru".
8. "kartu": judul kartu mengambang (mockup/layar) atau null. Pakai ini untuk scene yang seharusnya memperlihatkan layar/aplikasi.
9. "teks_kf": untuk scene yang teksnya harus bergerak, isi 2–3 keyframe [{"t": detik dari awal scene, "x": 0–100, "y": 0–100}] (x,y = pusat teks dalam persen layar). Kosongkan [] bila posisi bawaan gaya sudah cukup.
10. "aset_slot": untuk tiap foto/video yang perlu diisi pengguna, tulis [{"tipe":"foto|video","keterangan":"...","x":0–100,"y":0–100,"lebar":5–100,"mulai":0–15,"durasi":0–15}]. Durasi 0 = sampai akhir scene. Kosongkan [] bila tidak perlu.
11. "kebutuhan_baru": daftar gaya, animasi, transisi, efek, atau FITUR yang menurutmu penting tapi belum ada di daftar di atas. Tiap item: {"jenis":"style|animasi|transisi|efek|fitur","nama":"...","deskripsi":"...","alasan":"..."}. Kosongkan [] bila tidak ada.
12. Sebelum menjawab, hitung ulang: (a) jumlah scene tepat ${f.jumlahScene}; (b) total durasi tepat ${f.durasi}; (c) tiap naskah tidak melewati batas kata.

SKEMA (ikuti persis nama field):
{
  "judul": "...",
  "rasio": "${f.rasio}",
  "watermark": null,
  "scenes": [
    {
      "naskah": "...",
      "teks": "...",
      "durasi": 4,
      "mood": "fokus",
      "latar_preset": "kertas-grid",
      "overlay": "vignette",
      "kartu": null,
      "animasi": { "in": "Kata Muncul Berturut", "out": "Promo Memudar Bersih", "loop": "Mockup Mengambang Santai" },
      "animLatar": { "in": null, "out": null },
      "animKartu": { "in": null, "out": null },
      "transisi_ke_berikutnya": "Potong Cepat",
      "style": "Judul Promo Hitam",
      "teks_kf": [],
      "aset_slot": []
    }
  ],
  "kebutuhan_baru": [
    { "jenis": "animasi", "nama": "...", "deskripsi": "...", "alasan": "..." }
  ]
}`;
}
