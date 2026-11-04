
# Auto Explainer Studio v0.4
## Advanced Composition & Preset Engine

### Tujuan

Versi 0.4 mengembangkan editor preview menjadi editor komposisi
visual yang dapat mengatur setiap elemen secara individual.

### 1. Sistem koordinat

Semua posisi dan ukuran menggunakan rentang 0–1000.

Contoh:

- x = 500: posisi horizontal tengah.
- y = 500: posisi vertikal tengah.
- width = 700: lebar 70% dari lebar kanvas.
- height = 200: tinggi 20% dari tinggi kanvas.

Sistem ini memungkinkan komposisi beradaptasi pada format 9:16
dan 16:9.

### 2. Tipe elemen

#### Text
Untuk judul, subtitle, label, dan teks informasi.

Properti:
- text
- x
- y
- width
- height
- size
- weight
- color
- align

#### Card
Untuk kartu informasi dan mockup sederhana.

Properti:
- label
- x
- y
- width
- height
- color
- accent
- radius
- shadow

#### Circle
Untuk dekorasi, indikator, dan infografik sederhana.

Properti:
- x
- y
- radius
- color
- stroke
- strokeWidth

### 3. Sistem animasi

Animasi masuk:
- fade
- slide-up
- slide-down
- slide-left
- slide-right
- scale
- pop
- none

Gerakan:
- float
- slow-zoom
- rotate
- none

Animasi keluar menggunakan exitDuration.

### 4. Waktu elemen

start = waktu mulai relatif terhadap awal adegan.
duration = lama elemen tampil.
entranceDuration = durasi animasi masuk.
exitDuration = durasi animasi keluar.

Contoh:
Elemen mulai pada detik 1, tampil selama 3 detik,
dan keluar pada 0,4 detik terakhir.

### 5. Preset

Preset berada di folder presets.

Preset utama:
minimalist-3d-editorial.json

Preset dibaca melalui fetch oleh aplikasi.

### 6. Penyimpanan

Proyek disimpan menggunakan Local Storage.
Ekspor JSON dapat digunakan untuk membuat cadangan.

### 7. Batasan

Versi ini belum menyediakan:
- Editor keyframe penuh.
- Drag-and-drop posisi langsung pada kanvas.
- Gambar dan video sebagai elemen.
- Audio dan subtitle.
- Ekspor video.
- Sinkronisasi preset ke GitHub.

### 8. Pengujian

Uji format vertikal dan horizontal.
Uji posisi elemen.
Uji animasi masuk dan keluar.
Uji penyimpanan dan impor proyek.
