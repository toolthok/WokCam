# 09 · Panduan Tool — Gratis Dulu, Berbayar Nanti

> Peta dokumen: [08 Arsitektur Teknis](08-arsitektur-teknis.md) ← | → [10 Strategi Konten](10-strategi-konten.md)

Dokumen ini versi teks dari dialog **Panduan Tool** di dalam editor, ditambah perbandingan harga tool all-in-one sebagai referensi keputusan nanti.

## 1. Stack gratis wajib (4 pilar)

### 🗄️ Google Sheets — Database
- **Paling cocok untuk:** satu tab per video + tab Dashboard rekap.
- **Gratis:** akun Google.
- ✅ Kolom naskah tinggal copy-paste ke editor · kolom status untuk tracking (Draft→Render→Upload) · bisa diakses dari HP saat mencari aset.
- ❌ Manual — tidak otomatis generate video.

### 🎬 Pexels + Pixabay — Aset
- **Paling cocok untuk:** visual b-roll tanpa lisensi ribet.
- **Gratis:** tanpa atribusi.
- ✅ Filter orientasi vertikal langsung sesuai 9:16 · koleksi besar (lifestyle, kota, alam, bisnis) · aman komersial & monetisasi.
- ❌ Visual populer bisa terpakai banyak kreator juga.

### 🗣️ TTSMaker / CapCut TTS — Voice
- **Paling cocok untuk:** narasi bahasa Indonesia natural.
- **Gratis:** TTSMaker boleh komersial.
- ✅ TTSMaker: suara Indonesia, unduh MP3 langsung · CapCut TTS bawaan + auto caption gratis · ElevenLabs free tier 10k karakter/bln untuk kualitas premium.
- ❌ Free tier punya batas karakter harian.

### ✂️ CapCut Desktop — Editor & render
- **Paling cocok untuk:** menyusun scene + subtitle otomatis + ekspor 1080p.
- **Gratis:** fitur pro ditandai jelas.
- ✅ Auto caption gratis (cocok dengan preset subtitle wokCam) · keyframe untuk Ken Burns manual · ekspor 1080p tanpa watermark (versi desktop).
- ❌ Bisa berbayar nanti kalau butuh fitur pro tertentu.

## 2. Opsi berbayar — simpan untuk nanti

Tabel ini **tidak wajib** di tahap awal. Harga dicatat dari situs resmi masing-masing per **September 2026** dan bisa berubah.

| Tool | Tagline | Paling cocok | Harga | Kelebihan utama | Kekurangan |
|---|---|---|---|---|---|
| **InVideo AI** (invideo.ai) | Satu prompt → video utuh dirakit AI | Cepat punya video jadi tanpa menyusun sendiri | Plus **$20/bln** (75 kredit) · paket gratis ber-watermark | AI agent merakit naskah+visual+voice; 200+ model generatif; revisi lewat perintah teks | Kredit cepat habis untuk proyek panjang; hasil butuh dicek agar tidak generik |
| **Fliki** (fliki.ai) | Naskah → video dengan voice-over terbaik | Kualitas suara AI & channel multi-bahasa | Standard **±$28/bln** (180 menit) · gratis 5 menit/bln (720p, watermark) | 1.000+ suara dalam 80+ bahasa termasuk Indonesia; harga per menit mudah dihitung; voice cloning di paket atas | Visual stok, bukan generatif; editor timeline sederhana |
| **Pictory** (pictory.ai) | Naskah/blog panjang → video stok otomatis | Repurpose tulisan jadi video cepat | Starter **$29/bln** · Professional **$59/bln** (600 menit export) | Matching stok footage otomatis dari teks; edit berbasis teks; jutaan clip stok (Getty opsional +$8/bln) | Tidak ada generate AI; kurang cocok untuk gaya kreatif |

### Kapan naik ke berbayar?

Naik **hanya setelah** dua syarat terpenuhi sekaligus:
1. Channel sudah monetisasi / ada pendapatan (Affiliate, AdSense, jasa).
2. Ada bottleneck nyata yang terukur — mis. TTSMaker sering penuh kuota saat produksi 5+ video/minggu.

Sampai syarat itu terjadi, kombinasi **wokCam + Sheets + Pexels + TTSMaker + CapCut** menyelesaikan seluruh pipeline dengan Rp0.

### Perbandingan biaya setahun (illustratif)

| Skenario | Biaya setahun |
|---|---|
| Jalur wokCam Rp0 | **Rp0** |
| 1 langganan SaaS entry (±$20–29/bln) | ±Rp3,8–5,5 juta/tahun |
| Jalur self-build Fase 2 (VPS render + TTS pay-as-you-go) | tergantung volume; biasanya jauh di bawah SaaS bulanan |

## 3. Alternatif lain (chips di panel)

| Tool | Peruntukan |
|---|---|
| CapCut | Edit manual gratis |
| ElevenLabs | TTS terbaik (ada API — target integrasi [Fase 2](11-roadmap.md)) |
| AutoShorts.ai | Short otomatis |
| Zebracat | Teks ke video |
| OpusClip | Potong video panjang jadi short |

## 4. Cara memilih tool: 4 pertanyaan

1. **Apakah gratisannya cukup untuk 3 video pertama?** Kalau ya, jangan bayar dulu.
2. **Apakah output bisa diekspor?** (file MP3/MP4/CSV tanpa watermark) — kalau terkunci, skip.
3. **Apakah datanya bisa dibawa?** naskah/aset harus bisa masuk ke Sheets (database wajib).
4. **Apakah menggantikan langkah yang sudah jalan?** Tool baru harus menggantikan langkah paling menyita waktu, bukan menambah langkah.

> Sumber: situs resmi masing-masing tool (September 2026). Kuota free tier bisa berubah — cek halaman resmi sebelum membangun rutinitas di atas satu tool.
