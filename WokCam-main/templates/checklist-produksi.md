# Checklist Produksi per Video (wokCam)

> Satu video = satu putaran checklist ini. Cocokkan dengan [02-alur-kerja-rp0.md](../docs/02-alur-kerja-rp0.md).
> Cara pakai: salin bagian ini ke catatan/canban-mu per video, atau tempel di kolom `catatan` Sheets sebagai penanda.

## Video: `____________________`  ·  video_id: `____________________`

### 1️⃣ Naskah (status: Draft)
- [ ] Prompt AI terisi lengkap (topik, durasi, jumlah poin) — [template](prompt-naskah-ai.md)
- [ ] Hook ≤ 12 kata, tanpa sapaan
- [ ] 2–4 poin, ≤ 12 kata per kalimat, satu ide per baris
- [ ] CTA ≤ 12 kata (simpan + follow)
- [ ] Total 60–110 kata (≈ 30–45 detik)
- [ ] Tab baru di Google Sheets dibuat, header 12 kolom terisi
- [ ] Kolom `video_id` terisi (slug-nomor: `________-001`…)
- [ ] Kolom `status` = **Draft**

### 2️⃣ Aset (status: Siap)
- [ ] Visual 9:16 untuk setiap scene — dari [daftar 18 situs gratis](../docs/04-aset-gratis.md)
- [ ] Resolusi minimal 1080p (aman saat zoom Ken Burns)
- [ ] URL aset ditempel di kolom `aset`
- [ ] Voice-over MP3 per scene dibuat (TTSMaker/CapCut) — file bernama sesuai `no_scene`
- [ ] Voice dicek: istilah asing & angka dibaca benar
- [ ] Musik latar dipilih (1 dari 2–3 track khas channel)
- [ ] Kolom `voice` terisi nama suara

### 3️⃣ Edit di wokCam (blueprint)
- [ ] **Impor Naskah AI** → jumlah scene masuk akal (5–10)
- [ ] Preset animasi: Hook Sinematik (scene 1) → satu preset isi konsisten → CTA Penutup (scene akhir)
- [ ] Gerakan antar scene bervariasi TIDAK terlalu banyak (maks 2–3 preset/video)
- [ ] Subtitle: preset dipilih + sorot kata aktif + aksen konsisten
- [ ] Preview play dari awal sampai akhir — ritme enak, tidak ada scene kosong/kepanjangan
- [ ] Panel **Database** → **Salin untuk Sheets** → tempel di A1 → kolom G–K terisi
- [ ] Kolom `status` = **Siap**

### 4️⃣ Render di CapCut (status: Render)
- [ ] Klip diurutkan sesuai `no_scene`, durasi sesuai `durasi_detik`
- [ ] Keyframe sesuai kolom `gerakan` / `anim_in` / `anim_out`
- [ ] Voice + musik dimasukkan; musik volume ±30–40%, tidak menutupi voice
- [ ] Auto caption atau tempel teks sesuai preset subtitle
- [ ] Cek ulang: tidak ada watermark, teks tidak terpotong area UI TikTok (atas & kanan)
- [ ] Export 1080p (vertical 9:16)
- [ ] Kolom `status` = **Render**

### 5️⃣ Upload & pencatatan (status: Upload)
- [ ] Caption + 3–5 hashtag ditulis
- [ ] Upload TikTok / Reels / Shorts (jam konsisten)
- [ ] Kolom `status` = **Upload** + tanggal di kolom `catatan`
- [ ] 24 jam kemudian: catat retensi 3 dtk, save, share, follow di kolom `catatan`
- [ ] Keputusan: format diulang / hook diganti / ide lanjutan? (tulis 1 baris di `catatan`)

---

## Checklist lisensi (sebelum video pertama & tiap bulan)
- [ ] Semua aset dari sumber berlisensi bebas (lihat [04-aset-gratis.md §8](../docs/04-aset-gratis.md#8-checklist-lisensi-sebelum-upload))
- [ ] Tidak ada SFX/musik CC-BY tanpa kredit di deskripsi
- [ ] Kuota free tier TTS masih cukup untuk target minggu ini
