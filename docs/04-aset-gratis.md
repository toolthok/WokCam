# 04 · Sumber Aset Gratis (Rp0)

> Peta dokumen: [03 Database Google Sheets](03-database-google-sheets.md) ← | → [05 Koleksi Animasi](05-koleksi-animasi.md)

Daftar ini juga tertanam di dalam aplikasi: tab **Visual** di Inspector → bagian **Sumber Aset Gratis (Rp0)** — lengkap dengan filter kategori, sehingga bisa dibuka sambil mengedit. Sumbernya identik dengan konstanta `FREE_SOURCES` di `src/lib/editor/model.ts`.

**18 situs · 7 kategori · semua bisa dipakai tanpa biaya.**

## 1. Video stok 🎬

| Situs | URL | Catatan | Lisensi |
|---|---|---|---|
| **Pexels Video** | pexels.com/video | Ribuan video stok berkualitas; gratis komersial tanpa atribusi | Pexels License |
| **Pixabay Video** | pixabay.com/videos | B-roll 4K, banyak topik lifestyle & alam | Pixabay License |
| **Mixkit** | mixkit.co/free-stock-video | Kurasi video pendek rapi — cocok untuk hook & b-roll | Mixkit License |
| **Coverr** | coverr.co | Video estetik untuk latar & establishing shot | Gratis tanpa atribusi |

**Tips:** filter orientasi **vertikal/portrait** sebelum mencari — hasilnya langsung pas 9:16 tanpa perlu crop. Unduh resolusi minimal 1080p (720p akan pecah saat zoom Ken Burns).

## 2. Foto 📷

| Situs | URL | Catatan | Lisensi |
|---|---|---|---|
| **Pexels Foto** | pexels.com | Terlengkap; ada filter orientasi vertikal | Pexels License |
| **Unsplash** | unsplash.com | Foto artistik kualitas tinggi untuk latar scene | Unsplash License |

**Tips:** foto cocok untuk scene *quote/teks* (preset **Poster Statis**) atau latar yang hanya perlu satu gerakan pelan.

## 3. Musik 🎵

| Situs | URL | Catatan | Lisensi |
|---|---|---|---|
| **Pixabay Music** | pixabay.com/music | Bebas royalti per genre & mood | Pixabay License |
| **YouTube Audio Library** | studio.youtube.com → Audio Library | Musik & SFX resmi YouTube — paling aman untuk monetisasi | Bebas royalti |
| **FreePD** | freepd.com | Domain publik (CC0) — paling bebas dipakai | CC0 |

**Tips:** satu channel = satu "karakter suara musik". Pilih 2–3 track dan pakai berulang agar penonton mengenali vibe; hindari ganti genre tiap video.

## 4. Efek suara (SFX) 💥

| Situs | URL | Catatan | Lisensi |
|---|---|---|---|
| **Mixkit SFX** | mixkit.co/free-sound-effects | Whoosh, pop, riser untuk transisi & hook | Mixkit License |
| **Freesound** | freesound.org | Bank SFX komunitas terbesar | CC0 / CC-BY per suara |

**Tips:** ⚠️ di Freesound, **cek lisensi per suara** — sebagian CC-BY mewajibkan atribusi. Untuk konten monetisasi, filter CC0 saja. SFX yang paling sering dipakai faceless: `whoosh` (transisi scene), `ding` (poin penting), `crowd/applause` (CTA).

## 5. Voice AI (TTS) 🗣️

| Situs | URL | Catatan | Lisensi/Batas |
|---|---|---|---|
| **TTSMaker** | ttsmaker.com | Punya suara bahasa Indonesia; hasil boleh komersial | Gratis komersial |
| **CapCut TTS** | capcut.com | Text-to-speech bawaan CapCut Desktop — instan | Gratis |
| **ElevenLabs** | elevenlabs.io | Kualitas suara terbaik | Free tier 10.000 karakter/bulan |

**Tips:** rotasi — pakai TTSMaker/CapCut untuk video rutin, simpan kuota ElevenLabs untuk naskah penting. Detail pemilihan suara & rumus durasi ada di [dokumen 06](06-voice-over-tts.md).

## 6. Gambar AI ✨

| Situs | URL | Catatan | Lisensi/Batas |
|---|---|---|---|
| **Bing Image Creator** | bing.com/create | Generate via akun Microsoft (DALL·E) | Gratis, boost harian |
| **Leonardo.ai** | leonardo.ai | Kredit harian gratis; gaya konsisten untuk feed | Free daily credit |

**Tips:** simpan **prompt yang berhasil** di kolom `catatan` Sheets — konsistensi gaya antar video datang dari prompt yang sama + model yang sama. Pakai untuk scene yang tidak ada di stok (mis. visual abstrak).

## 7. Font 🔤

| Situs | URL | Catatan | Lisensi |
|---|---|---|---|
| **Google Fonts** | fonts.google.com | Poppins & Montserrat — font subtitle yang juga tersedia di editor | OFL |
| **Fontshare** | fontshare.com | Font premium gratis (General Sans, Satoshi, dll.) | ITF Free Font |

**Tips:** subtitle faceless cukup 2 font: satu tebal untuk kata sorot (Poppins Bold/Montserrat ExtraBold), satu untuk sisanya. Jangan lebih — keterbacaan di layar kecil lebih penting dari variasi.

## 8. Checklist lisensi sebelum upload

- [ ] Visual & musik dari daftar di atas (semua bebas atribusi, kecuali SFX CC-BY di Freesound → hindari atau beri kredit)
- [ ] Kalau pakai SFX/musik CC-BY: kredit ditulis di deskripsi video
- [ ] Gambar AI: pastikan tidak mengandung wajah orang nyata/logo merek
- [ ] Voice-over: simpan file MP3 asli di folder produksi (bukti kalau ada klaim hak)
- [ ] Link sumber aset tercatat di kolom `aset` di Google Sheets

> Disclaimer: kondisi lisensi dicatat per **September 2026** dari halaman resmi masing-masing situs. Selalu cek ulang halaman license situs terkait sebelum monetisasi.
