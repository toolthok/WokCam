# 02 · Alur Kerja Rp0 — Produksi Video Tanpa Biaya

> Peta dokumen: [01 Ikhtisar](01-ikhtisar.md) ← | → [03 Database Google Sheets](03-database-google-sheets.md)

## 1. Janji utama: biaya tahap awal = Rp0

Setiap tahap produksi video wokCam bisa dikerjakan dengan tool gratis. Tabel berikut adalah rincian yang juga tampil di panel **Panduan Tool** di dalam editor:

| Tahap | Tool yang dipakai | Biaya |
|---|---|---|
| Naskah | AI chat gratis (ChatGPT / Gemini / Claude free tier) | Rp0 |
| Database | Google Sheets — 1 tab per video | Rp0 |
| Visual | Pexels / Pixabay / Mixkit / Coverr | Rp0 |
| Voice-over | TTSMaker / CapCut TTS (ElevenLabs free tier 10k karakter) | Rp0 |
| Musik & SFX | YouTube Audio Library / Pixabay Music / FreePD | Rp0 |
| Gambar AI | Bing Image Creator / Leonardo.ai (kredit harian gratis) | Rp0 |
| Editing & render | Editor wokCam (blueprint) + CapCut Desktop (render 1080p) | Rp0 |

> ⚠️ Kuota free tier bisa berubah sewaktu-waktu. Cek halaman resmi masing-masing layanan sebelum rilis rutin. Data harga tool berbayar di [09-panduan-tool.md](09-panduan-tool.md) dicatat per September 2026.

## 2. Enam langkah produksi

Alur ini juga tertanam di panel **Panduan Tool** di dalam aplikasi (dibaca dari kiri ke kanan, satu video = satu putaran):

### Langkah 1 — Naskah di AI chat
Buat naskah di ChatGPT / Gemini / Claude dengan [template prompt](../templates/prompt-naskah-ai.md). Minta **kalimat pendek per baris** agar mudah dipotong menjadi scene. Target: hook ≤ 3 detik, 1 poin per scene.

### Langkah 2 — Catat ke Google Sheets
Buat tab baru bernama sesuai judul video, tempel header 12 kolom dari [template CSV](../templates/database-video.csv) atau salin langsung dari panel **Database** di editor. Masukkan naskah per scene + link aset. Ini database wajib — [detail lengkap di dokumen 03](03-database-google-sheets.md).

### Langkah 3 — Kumpulkan aset gratis
Ambil visual vertikal (9:16) dari Pexels/Pixabay, voice-over dari TTSMaker atau CapCut TTS, musik dari YouTube Audio Library. Daftar 18 situs + catatan lisensi ada di [dokumen 04](04-aset-gratis.md). Tempel URL aset ke kolom `aset` di Sheets agar tidak hilang.

### Langkah 4 — Impor naskah ke editor wokCam
Buka editor → tombol **Impor Naskah AI** → tempel seluruh naskah. Naskah otomatis:
- dipecah per kalimat,
- digabung jadi scene maksimal **22 kata** per scene,
- tiap scene dapat durasi otomatis dari rumus **kata ÷ 2,4 + 0,8 detik** (kecepatan bicara TTS Indonesia),
- tiap scene mendapat visual stok bergilir + gerakan Ken Burns bergilir sebagai titik awal.

### Langkah 5 — Rapikan dengan Koleksi Animasi
Buka **Animasi** di TopBar → pilih preset (mis. *Hook Sinematik* untuk scene 1, *Dokumenter Tenang* untuk isi, *CTA Penutup* untuk scene terakhir). Tombol **Terapkan ke semua** menjaga konsistensi gerakan. Simpan kombinasi favorit sebagai preset sendiri — tersimpan permanen di browser (`localStorage`, key `wokcam-presets`).

### Langkah 6 — Ekspor data, render, upload, update status
1. Panel **Database** → **Salin untuk Sheets** (TSV) → tempel di sel A1 tab video → kolom `gerakan`, `anim_in`, `anim_out`, `durasi_detik` langsung terisi sesuai hasil editing.
2. Ikuti blueprint di CapCut Desktop: susun klip, tempel voice-over, keyframe sesuai kolom gerakan, aktifkan auto caption (cocok dengan preset subtitle di editor).
3. Export 1080p tanpa watermark → upload ke TikTok / Reels / Shorts.
4. **Wajib**: update kolom `status` di Sheets menjadi `Upload` + isi `catatan` (hasil awal, ide revisi). Video viral berikutnya tinggal dibandingkan dengan baris database, bukan ingatan.

## 3. Diagram status produksi di Sheets

```
Draft ──▶ Siap ──▶ Render ──▶ Upload
  │         │
  └─────────┴──▶ (kembali ke Draft bila revisi besar)
```

- **Draft** — naskah belum final / aset belum lengkap.
- **Siap** — naskah + aset lengkap, siap dirender (nilai yang ditulis editor saat scene berstatus *ready*).
- **Render** — sedang dirakit di CapCut.
- **Upload** — sudah tayang; isi `catatan` dengan performa awal.

## 4. Pembagian waktu yang disarankan

Untuk target 3–5 video/minggu di sela kerja/kuliah (estimasi kasar, bukan janji):

| Blok | Isi | Durasi |
|---|---|---|
| Sesi 1 (1 jam) | Buat 3 naskah di AI chat + isi Sheets | ±20 mnt/video |
| Sesi 2 (1 jam) | Kumpulkan aset untuk 3 video sekaligus | ±20 mnt/video |
| Sesi 3–4 (1 jam) | Rapikan di editor + render di CapCut + upload | ±40 mnt/video |

Kunci efisiensinya: **batching** — naskah, aset, dan render dikerjakan untuk beberapa video sekaligus supaya tidak ganti-ganti konteks.

## 5. Batasan alur Rp0

- **Semuanya manual.** Tidak ada pipeline otomatis; wokCam mempercepat keputusan, bukan menghilangkan kerja.
- **Kuota free tier** (TTSMaker harian, ElevenLabs 10k karakter/bln, boost Bing) cukup untuk beberapa video/minggu — jika produksi naik, rotasikan beberapa penyedia.
- **Visual populer** di Pexels/Pixabay dipakai banyak kreator — pertahankan ciri khas lewat naskah + pilihan preset animasi + musik.
- **Render masih via CapCut** sampai mesin render sendiri jadi (lihat [roadmap Fase 2](11-roadmap.md)).
