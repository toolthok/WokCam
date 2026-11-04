
# Auto Explainer Studio

Versi: 0.3.0  
Tipe: Progressive Web App (PWA)  
Rendering: Canvas 2D Preview  
Penyimpanan: Browser Local Storage (versi awal)

## 1. Deskripsi

Auto Explainer Studio adalah aplikasi untuk menyusun video explainer
dan dokumenter pendek dengan pendekatan local-first.

Tujuannya adalah mengubah naskah menjadi storyboard visual yang
memiliki komposisi, tipografi, dan gerakan yang terstruktur.

Aplikasi tidak memerlukan API AI berbayar.

## 2. Fitur v0.3

- Storyboard dengan banyak adegan.
- Pengaturan durasi adegan.
- Format vertikal 9:16 dan horizontal 16:9.
- Canvas preview.
- Animasi fade, slide, scale, dan pop.
- Gerakan float, slow zoom, dan rotate.
- Kartu informasi dan elemen teks.
- Impor dan ekspor storyboard JSON.
- Penyimpanan proyek di browser.
- PWA dasar dengan cache offline.

## 3. Instalasi GitHub Pages

1. Buat repository GitHub.
2. Unggah seluruh isi folder aplikasi.
3. Buka Settings pada repository.
4. Pilih Pages.
5. Pilih Deploy from a branch.
6. Pilih branch main dan folder root.
7. Simpan pengaturan.
8. Buka URL GitHub Pages setelah proses deployment selesai.

Jangan membuka index.html langsung dari file manager.
Gunakan GitHub Pages atau server lokal karena aplikasi
menggunakan JavaScript ES Modules.

## 4. Penggunaan

1. Buka aplikasi.
2. Pilih format vertikal atau horizontal.
3. Pilih adegan dari daftar Storyboard.
4. Edit judul, subjudul, dan durasi.
5. Tambahkan kartu atau teks.
6. Tekan Putar untuk melihat animasi.
7. Simpan proyek.
8. Ekspor storyboard sebagai JSON untuk cadangan.

## 5. Struktur modul

- motion-engine.js: menghitung keadaan animasi.
- composition-engine.js: menggambar elemen ke Canvas.
- storyboard-engine.js: mengelola adegan dan proyek.
- app.js: menghubungkan mesin dengan antarmuka.

## 6. Batasan versi ini

Versi 0.3 adalah prototipe editor dan preview animasi.

Belum tersedia:
- Ekspor video WebM atau MP4.
- Sinkronisasi narasi dan audio.
- Subtitle otomatis.
- Pemilihan footage otomatis.
- Analisis gerakan video referensi.
- Deteksi isi visual berbasis AI.
- Sinkronisasi GitHub untuk preset.
- Penyimpanan proyek berbasis IndexedDB.

Canvas preview tidak sama dengan hasil render video final.

## 7. Keamanan

Jangan memasukkan token GitHub atau kredensial rahasia ke
file proyek, preset, storyboard, maupun repository publik.

## 8. Roadmap

### v0.4
- Pengaturan elemen visual lebih lengkap.
- Preset dinamis.
- Pengelolaan posisi dan ukuran.
- IndexedDB.

### v0.5
- Timeline elemen.
- Sinkronisasi audio dan narasi.
- Asset manager.

### v0.6
- Local video rendering.
- Ekspor WebM jika didukung browser.
- Pengaturan resolusi dan frame rate.

### v0.7
- Reference analyzer.
- Sistem style mixer.
- Integrasi preset GitHub.
