# WokCam: Dokumen Proyek Lengkap

Dokumen ini menjelaskan tujuan, keputusan, kondisi terkini, dan peta jalan WokCam dari awal sampai tujuan akhirnya. Tanggal acuan: 3 November 2026 (versi repo v5).

## 1. Ringkasan

**WokCam** adalah aplikasi web (PWA) untuk membuat video pendek media sosial dengan cepat, tanpa timeline dan tanpa editor yang ribet.

> Tulis atau ucapkan narasinya. App memahami tiap kalimat, memilihkan gaya editing, merakitnya jadi video. Kamu hanya mengoreksi.

**Tujuan akhir:** dari naskah (atau voice-over) dan footage mentah menjadi video siap posting dalam sekitar 10 menit, dengan gaya editing yang konsisten dan bisa ditiru dari video referensi.

**Pengguna utama:** kreator solo yang sudah paham editing (misalnya terbiasa dengan CapCut) tetapi enggan membuka editor penuh untuk konten sosmed sendiri.

## 2. Masalah yang diselesaikan

- Editor video punya terlalu banyak langkah untuk video pendek yang diproduksi rutin.
- Keputusan gaya (zoom di mana, teks apa, efek apa) diulang manual tiap video padahal polanya mirip.
- Meniru gaya video yang sedang ramai biasanya berarti menontonnya berulang kali lalu menebak teknik.

## 3. Prinsip desain

1. **AI mendeteksi, preset mengeksekusi, user memutuskan.** Pilihan otomatis boleh salah, tetapi selalu mudah diganti.
2. **Tanpa timeline.** Unit kerja adalah kartu per kalimat, bukan track dan klip.
3. **Hybrid.** Saran dengan keyakinan ≥85% terpasang otomatis, sisanya bertanda **?** dan menunggu satu ketukan konfirmasi.
4. **Lokal dan statis.** Tidak ada server sendiri, tidak ada akun. Data proyek tidak meninggalkan perangkat (kecuali pengunduhan model dan pustaka dari CDN).
5. **Tiru pola, bukan konten.** Jalur ATM hanya mengambil pola editing (ritme, jenis efek, struktur teks), tidak menyalin gambar, suara, atau kalimat referensi.
6. **Cepat dulu, sempurna kemudian.** Setiap tahap harus menghasilkan sesuatu yang bisa dipakai.

## 4. Dua metode kerja

### Metode 1: Buat Baru (naskah → video)
1. Tulis/tempel naskah (atau rekam voice-over).
2. Naskah dipecah per kalimat menjadi segmen.
3. Kamus pemicu memilihkan satu teknik per segmen.
4. Pengguna mengoreksi gaya per kartu.
5. Pratinjau, lalu ekspor video.

### Metode 2: ATM (Amati, Tiru, Modifikasi)
1. Amati: analisis video referensi menjadi "DNA gaya" (ritme potongan, teknik per bagian, pola teks).
2. Tiru: DNA dipetakan ke segmen naskah/footage pengguna.
3. Modifikasi: pengguna menyesuaikan gaya per kartu, sama seperti Metode 1.

Metode 2 belum dibangun. Skema DNA ada di bagian 8.

## 5. Arsitektur

Seluruh aplikasi adalah situs statis. Tidak ada build step.

```
naskah ──► analyze() ──► segmen[{teks, teknik, pasti?, durasi}]
                              │
 footage ─┐                   ▼
 VO ──────┼──► plan() ──► jadwal per segmen ──► frame(t) ──► kanvas 9:16
 latar ───┘                                          │          │
                                                     │          ├─► Pratinjau
                                  MediaPipe ◄────────┘          └─► MediaRecorder ─► MP4/WebM
                                  (subjek vs latar)
```

| Modul | Berkas | Peran |
|---|---|---|
| Antarmuka dan logika | `index.html` | Satu berkas berisi CSS, HTML, dan JS |
| Katalog teknik | `data/teknik.json` | Daftar teknik: kode, nama, ikon, deskripsi |
| Kamus pemicu | `data/pemicu.json` | Kata/pola → teknik, dengan tingkat keyakinan |
| Service worker | `sw.js` | Cache dan mode offline (network-first agar update cepat tampil) |
| Manifest dan ikon | `manifest.webmanifest`, `icon.svg` | Agar bisa dipasang di layar utama |

Fungsi inti di `index.html`:
- `analyze(teks)` memecah kalimat dan memilih teknik. Aturan: kalimat pertama → `hook`, terakhir → `cta`, pola angka → `big-number`, selain itu kata pemicu dengan keyakinan tertinggi, tanpa pemicu → `b-roll` (tebakan, bertanda ?).
- `plan()` membagi durasi total (durasi VO bila ada) ke segmen sesuai jumlah kata.
- `frame(tl, t)` menggambar satu frame: video dasar, efek, lapisan subjek, subtitel, overlay.
- `run(rekam)` memutar jadwal secara real-time, dan merekam kanvas + audio bila mode ekspor.
- `cutout()` memakai MediaPipe Selfie Segmenter untuk memisahkan orang dari latar.

## 6. Kondisi terkini (v5)

| Tahap | Isi | Status |
|---|---|---|
| 1. Fondasi data | Katalog teknik dan kamus pemicu bersih | Selesai |
| 2. Naskah → kartu | Pecah kalimat, pilih gaya, konfirmasi, ganti gaya, salin rencana JSON | Selesai, teruji di HP |
| 3. Studio dasar | Upload footage + VO, pratinjau kanvas, ekspor rekam real-time | Dibangun, belum teruji penuh |
| 4. Gaya lanjutan | 27 teknik, termasuk potong subjek dan ganti latar | Dibangun, belum teruji |
| 3b. VO → subtitle + database kata | Transkripsi VO (Whisper di browser), subtitle bergaya film, efek dipicu per kata, database kata → editing yang bisa diedit dan belajar dari koreksi | Dibangun, belum teruji |
| 5. Dokumentasi | Dokumen ini | Selesai |

Riwayat repo lama (katalog 63 teknik, prototipe radial PauseCut, crosswalk 900 token) sudah diganti total. Konsep yang dipertahankan: kamus pemicu, pembagian teknik per keluarga, dan etika tiru pola.

## 7. Katalog teknik (27 teknik)

| Kode | Nama | Fungsi | Perilaku saat ini |
|---|---|---|---|
| `hook` | Hook Cepat | Potongan cepat + teks besar di 2 detik pertama | Zoom awal 0,35 dtk (potongan cepat + teks besar belum ada) |
| `punch-zoom` | Zoom Punch | Zoom mendadak 110–120% di kata penekanan | Zoom 115% lalu kembali dalam 0,35 dtk |
| `big-number` | Angka Besar | Angka atau persen tampil besar di layar | Angka/persen dari kalimat tampil besar di tengah |
| `jump-cut` | Jump Cut | Buang jeda, potong rapat antar kalimat | Zoom 112% dengan geser kiri/kanan bergantian (belum multi-klip) |
| `speed-ramp` | Speed Ramp | Melambat lalu ngebut | 2x di paruh pertama segmen |
| `freeze` | Freeze Frame | Bekukan frame, tambah teks keterangan | Video berhenti 0,7 dtk |
| `glitch` | Glitch | Gangguan singkat untuk kejutan | Irisan acak bergeser 0,3 dtk |
| `shake` | Getar | Layar bergetar untuk kaget atau kesal | Getar 0,5 dtk |
| `flash` | Flash Putih | Kilat singkat sebagai transisi | Kilat putih 0,2 dtk |
| `text-pop` | Teks Pop | Kata kunci muncul membal | Kata kunci besar muncul membal |
| `kinetic` | Teks Kinetik | Teks bergerak mengikuti ucapan | Subtitel muncul kata demi kata |
| `b-roll` | B-roll | Tutup dengan footage pendukung | Ken Burns pada video, atau gambar latar bila diunggah |
| `slowmo` | Slow Motion | Pelan untuk kesan dramatis | 0,5x sepanjang segmen |
| `whoosh` | Whoosh | Efek suara saat pindah bagian | Frame geser masuk 0,25 dtk (belum ada suara) |
| `cta` | CTA Akhir | Ajakan penutup: teks + ikon aksi | Tombol "Follow" di bawah layar |
| `cutout-outline` | Cutout Outline | Subjek dipotong dari latar, diberi garis tepi putih, latar diburamkan | Subjek + garis tepi putih, latar video diburamkan (segmentasi) |
| `bg-blur` | Latar Blur | Latar diburamkan, subjek tetap tajam | Latar blur, subjek tajam (segmentasi) |
| `bg-swap` | Ganti Latar | Subjek dipindah ke latar lain (gambar sendiri atau gradien) | Subjek di atas gambar/gradien pengganti (segmentasi) |
| `subject-shrink` | Subjek Mengecil | Subjek mengecil ke bawah dengan garis tepi, latar diganti | Subjek mengecil ke bawah + garis tepi, latar pengganti (segmentasi) |
| `subject-slide` | Subjek Geser | Subjek bergeser masuk dari samping dengan garis tepi | Subjek geser masuk + garis tepi, latar pengganti (segmentasi) |
| `tilt` | Miring | Frame miring sedikit untuk kesan aneh | Rotasi ±4° dengan zoom 115% |
| `zoom-out` | Zoom Out | Mulai dekat lalu melebar | Zoom 130% melebar ke 100% |
| `bw` | Hitam Putih | Kilas balik atau suasana sedih | Hitam putih berkontras |
| `color-pop` | Warna Pop | Warna dibuat lebih pekat dan ceria | Saturasi dan kontras dinaikkan |
| `pulse` | Pulse Beat | Frame berdenyut mengikuti ritme | Denyut zoom 2x per detik |
| `mirror` | Cermin | Separuh layar dicerminkan | Separuh kiri dicerminkan ke kanan |
| `rgb-split` | RGB Split | Warna terpisah tipis, kesan mimpi atau trippy | Bayangan warna bergeser 0,6 dtk |

Teknik bertanda "(segmentasi)" membutuhkan model pemotong latar yang diunduh sekali dari internet dan hanya mengenali orang.

## 8. Format data

### 8.1 `data/teknik.json`
Array objek: `id` (kode permanen, huruf kecil dengan tanda hubung), `nama`, `ikon`, `desc`. Kode adalah kontrak: jangan diubah setelah dipakai preset atau DNA.

### 8.2 `data/pemicu.json`
```json
{
  "awal": "hook",
  "akhir": "cta",
  "pola": [["regex", "kode-teknik"]],
  "auto": { "kode-teknik": ["kata", "kata"] },
  "cek":  { "kode-teknik": ["kata", "kata"] }
}
```
- `auto` = keyakinan 0,9 (terpasang otomatis). `cek` = 0,7 (bertanda ?). `pola` = keyakinan 0,95.
- Kata ditulis huruf kecil, satu kata per entri. Kata yang sama di dua teknik: yang ditulis terakhir (`auto` setelah `cek`) menang.
- Menambah kata: edit berkas, unggah ulang. Tidak perlu mengubah kode.

### 8.3 Rencana (tombol "Salin rencana")
```json
[{"no": 1, "teks": "…", "teknik": "hook", "dtk": 2.6, "pasti": true}]
```

### 8.4 DNA Referensi (rancangan untuk Jalur ATM)
```json
{
  "versi": "1.0",
  "durasi": 45,
  "ritme": {"potongan_per_menit": 28, "rata_durasi_klip": 2.1},
  "anchors": [{"t": 0.0, "teknik": "hook", "keyakinan": 0.9}],
  "teks": {"gaya": "kata-per-kata", "posisi": "tengah-bawah"}
}
```
Aturan: `teknik` wajib ada di katalog; keyakinan <0,75 menuntut pratinjau sebelum diterapkan. Skema akan dibekukan saat Tahap 7 dimulai.

### 8.5 Database kata → editing (v6)
- Bawaan: `data/pemicu.json`. Milik pengguna: disimpan di browser (`localStorage`, kunci `wokcam.db`), berbentuk `{"kata": "kode-teknik"}`, keyakinan 0,9, menimpa bawaan.
- Tiap kata yang ada di database memicu efeknya **tepat saat kata itu diucapkan** (timestamp dari transkripsi). Satu subtitle bisa memuat hingga 3 efek.
- Belajar dari koreksi: saat mengganti efek, isi kolom "Ingat kata ini"; kata itu masuk database dan langsung dipasang di semua subtitle yang memuatnya.
- Panel database bisa menambah, menghapus, menyalin, dan mengimpor JSON.

## 9. Cara menjalankan dan memperbarui

- **Deploy:** repo di GitHub, aktifkan Pages (branch `main`, folder root). Aplikasi tidak bisa dibuka lewat `file://` karena memuat data dengan `fetch`.
- **Pasang di HP:** buka URL Pages di browser berbasis Chromium, pilih "Tambahkan ke layar utama".
- **Update lewat zip:** unggah zip berisi berkas langsung di root (tanpa folder pembungkus). Uploader menimpa berkas bernama sama tetapi **tidak menghapus** berkas lama. Berkas yang tidak lagi dipakai harus dihapus manual di GitHub.
- **Cache:** setelah update, tutup dan buka ulang tab. Nama cache di `sw.js` dinaikkan tiap rilis.

## 10. Batasan yang diketahui

1. Ekspor berjalan real-time: video 30 detik butuh 30 detik, dan layar tidak boleh terkunci.
2. Waktu per kalimat masih estimasi dari jumlah kata, sehingga potongan bisa meleset dari ucapan sampai Tahap 3 (ASR) selesai.
3. Pemotong latar hanya untuk orang, memerlukan internet saat pertama dipakai, dan tepi rambut tidak mulus.
4. Baru satu footage per video. `jump-cut` dan `b-roll` belum punya efek visual.
5. `whoosh` belum bersuara. Belum ada musik latar maupun efek suara.
6. Format keluaran bergantung browser (MP4 bila didukung, selain itu WebM).
7. Bagian studio (Tahap 3-4) baru lolos pemeriksaan sintaks, belum diuji penuh di berbagai perangkat.
8. Aplikasi bergantung pada CDN (jsDelivr) dan penyimpanan model Google untuk fitur cutout.

## 11. Peta jalan sampai tujuan akhir

Urutan ditentukan oleh ketergantungan: tahap berikutnya butuh hasil tahap sebelumnya.

### Tahap 3: Transkripsi VO dengan timestamp per kata
- **Tujuan:** segmen dan subtitel pas dengan ucapan.
- **Isi:** transkripsi bahasa Indonesia di browser (kandidat: Whisper lewat pustaka JS; pilihan final menunggu uji kecepatan di HP), timestamp per kata, naskah otomatis dari VO, koreksi naskah.
- **Selesai bila:** VO 60 detik menghasilkan segmen dengan batas waktu meleset kurang dari 0,3 detik pada sebagian besar kalimat, dan model tersimpan di cache setelah unduhan pertama.
- **Risiko:** ukuran model dan kecepatan di HP kelas menengah; akurasi bahasa gaul dan campuran Inggris.

### Tahap 4: Banyak klip dan b-roll
- **Tujuan:** tiap segmen bisa memakai klip berbeda.
- **Isi:** upload beberapa klip, penugasan klip per kartu (otomatis berurutan, bisa diganti), `jump-cut` dan `b-roll` mendapat efek nyata, pemangkasan jeda diam.
- **Selesai bila:** video dari 3+ klip dirakit tanpa mengatur satu pun titik potong manual.

### Tahap 5: Audio
- **Tujuan:** hasil terdengar utuh.
- **Isi:** musik latar dengan pengecilan volume saat VO (ducking), efek suara untuk `whoosh`, `glitch`, `flash`, `shake`, pengaturan volume.
- **Selesai bila:** video hasil ekspor memuat VO, musik, dan efek suara yang seimbang tanpa edit lanjutan.
- **Catatan:** musik dan efek suara harus bebas hak cipta atau milik pengguna.

### Tahap 6: Ekspor yang kuat
- **Tujuan:** ekspor cepat dan stabil.
- **Isi:** render non-real-time (WebCodecs, atau ffmpeg.wasm sebagai cadangan), pilihan resolusi (720p/1080p), bilah progres, pembatalan.
- **Selesai bila:** video 60 detik terekspor lebih cepat dari durasinya di HP target dan tidak gagal karena layar mati.

### Tahap 7: Jalur ATM
- **Tujuan:** meniru gaya video referensi.
- **Isi:** analisis video referensi (deteksi potongan dan ritme, deteksi teks di layar, perkiraan teknik per bagian) menjadi DNA, pemetaan DNA ke segmen pengguna, tampilan selisih antara saran ATM dan pilihan otomatis.
- **Selesai bila:** satu referensi 30-45 detik menghasilkan DNA valid terhadap skema dan hasil penerapannya terasa mirip menurut penilaian pengguna.
- **Risiko:** deteksi teknik dari video adalah bagian paling sulit dan mungkin hanya akurat untuk teknik tertentu (potongan, zoom, teks). Pada awalnya sebagian bisa tetap berupa konfirmasi manual.

### Tahap 8: Proyek dan preset
- **Tujuan:** pekerjaan tidak hilang dan gaya bisa dipakai ulang.
- **Isi:** simpan proyek di IndexedDB, "keluarga gaya" (paket teknik dengan karakter tertentu), preset pribadi dari DNA, ekspor/impor proyek.
- **Selesai bila:** menutup app lalu membukanya kembali mengembalikan proyek terakhir, dan satu preset bisa dipakai di video baru dengan satu ketukan.

### Tahap 9: Penyempurnaan dan rilis
- **Isi:** perluasan kamus pemicu dari naskah-naskah nyata, teks multi-gaya, preset ukuran (9:16, 1:1, 16:9), aksesibilitas dan performa, uji lintas perangkat, panduan pengguna.
- **Selesai bila:** semua kriteria tahap 3-8 lolos di minimal tiga perangkat berbeda.

### Opsional (setelah Tahap 9): aplikasi Android native
Baru dipertimbangkan bila PWA terbentur batas performa. Tumpukan teknologi kandidat: Kotlin, CameraX, Media3 Transformer. Katalog, kamus, dan skema DNA dirancang netral platform agar bisa dipakai ulang.

## 12. Ukuran keberhasilan (usulan, diverifikasi saat uji)

- Waktu dari naskah ke video jadi: ≤ 10 menit untuk video 45 detik.
- Saran gaya yang diterima tanpa diganti: ≥ 70% setelah kamus dilengkapi.
- Kegagalan ekspor: < 5% pada perangkat target.
- Jumlah ketukan untuk mengganti gaya satu segmen: ≤ 2.

## 13. Risiko dan pertanyaan terbuka

| Risiko / pertanyaan | Dampak | Rencana |
|---|---|---|
| Performa segmentasi dan ekspor di HP kelas menengah | Patah-patah, ekspor gagal | Ukur di Tahap 6; turunkan resolusi bila perlu |
| Ketergantungan CDN dan model eksternal | Gagal bila offline | Salin pustaka dan model ke repo atau cache saat Tahap 9 (periksa ukuran dan lisensi) |
| Akurasi ASR untuk bahasa gaul | Segmen salah | Koreksi naskah manual, perluas kamus |
| Ekspor langsung ke format proyek CapCut | Tidak ada format resmi terdokumentasi | Jangan diandalkan; tetap ekspor MP4 |
| Kualitas deteksi gaya dari video referensi | Jalur ATM kurang akurat | Mulai dari teknik yang mudah dideteksi |
| Lisensi pustaka, model, dan aset | Masalah distribusi | Periksa lisensi tiap dependensi sebelum rilis publik |

## 14. Catatan keputusan

| Keputusan | Alasan |
|---|---|
| Repo lama dikosongkan dan dibangun ulang | Konsep awal (kamera Android dengan menu radial) terlalu mahal dibanding manfaatnya |
| PWA lebih dahulu, bukan Android native | Paling cepat sampai bisa dipakai; tanpa instalasi dan tanpa toko aplikasi |
| Narasi → video sebagai inti | Menghilangkan keputusan teknis terbanyak untuk pengguna |
| Kode teknik baru, tidak memakai kode lama | Kode lama tidak sinkron antara kamus dan katalog |
| Ekspor dengan MediaRecorder dulu | Tanpa pustaka tambahan; cukup untuk video pendek, diganti di Tahap 6 |
| Pemotong latar: MediaPipe Selfie Segmenter | Ringan, jalan di browser, cukup untuk subjek orang |
| Tampilan nama kode `pasti`/`cek` | Menjaga prinsip hybrid: otomatis bila yakin, konfirmasi bila ragu |

## 15. Etika dan hak cipta

- Jalur ATM meniru **pola** editing, bukan konten referensi.
- Pengguna bertanggung jawab atas hak footage, musik, dan gambar latar yang diunggah.
- Pemrosesan video terjadi di perangkat pengguna.

## 16. Glosarium

- **Segmen/kartu:** satu kalimat naskah beserta teknik yang dipilih.
- **Pemicu:** kata atau pola yang mengarahkan ke satu teknik.
- **Pasti / ?:** status saran. Pasti = keyakinan ≥85% atau sudah dikonfirmasi pengguna.
- **Hybrid:** perilaku otomatis bila yakin, konfirmasi satu ketukan bila ragu.
- **ATM:** Amati, Tiru, Modifikasi.
- **DNA Referensi:** ringkasan data pola editing sebuah video.
- **Cutout:** subjek dipisahkan dari latar.
- **Ducking:** volume musik dikecilkan otomatis saat ada suara bicara.
- **ASR:** pengenalan ucapan otomatis.
