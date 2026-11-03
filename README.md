# Auto Explainer Studio v0.2

## Fitur saat ini
- PWA dasar dan cache offline.
- Bank preset lokal menggunakan IndexedDB.
- Impor/ekspor bank preset JSON.
- Ambil 6 sampel frame dari video referensi lokal.
- Catatan analisis gaya dan simpan sebagai preset.
- Storyboard awal dari paragraf narasi.
- Preview animasi Canvas 2D.
- Ekspor lokal WebM menggunakan MediaRecorder jika didukung browser.
- Sinkronisasi GitHub Contents API ke `presets/library.json`.

## Deploy
1. Buat repository GitHub baru, misalnya `auto-explainer-studio`.
2. Upload seluruh file ini ke root repository.
3. Settings → Pages → Deploy from a branch → `main` / root.
4. Buka URL GitHub Pages dari Chrome Android.
5. Menu Chrome → Add to Home screen / Install app.

## Sinkronisasi preset
Buat fine-grained personal access token:
- Repository access: Only select repositories → repository preset khusus.
- Repository permissions: Contents = Read and write.
- Metadata read-only otomatis.
Masukkan username, repository, dan token di tab GitHub. Token hanya berada di memori halaman; jangan simpan di localStorage dan jangan membagikannya. Untuk keamanan lebih tinggi, gunakan repository terpisah khusus preset, bukan repository kode utama.

## Batasan yang diketahui
- Analisis referensi saat ini mengekstrak enam sampel frame; belum mendeteksi gerakan secara otomatis atau memahami semantik video.
- Catatan analisis gaya masih dibantu ChatGPT secara manual.
- Renderer awal hanya membuat grafis Canvas dan merekam WebM; belum menyatukan footage asli, audio narasi, musik, subtitle otomatis, atau MP4.
- Performa rendering bergantung pada browser, memori, suhu, dan mode hemat daya Android.
- Sinkronisasi GitHub memerlukan internet dan token dengan izin yang sesuai.

## Tahap berikutnya
1. Analisis perubahan adegan dan motion signatures.
2. Style Mixer dan preset schema versi.
3. Pencocokan narasi → visual yang lebih baik.
4. Timeline dan footage/image layers.
5. Audio, subtitle, dan MP4 muxing/encoding lokal yang teruji di Chrome Android.
