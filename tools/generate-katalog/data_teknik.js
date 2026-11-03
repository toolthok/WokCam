// Data katalog teknik — dipisah dari generator agar mudah direvisi.
// Kolom per teknik: [kode, namaEN, fungsi, parameter, kelas, prioritas]
// Kelas: A = real-time (pratinjau langsung), B = render saat ekspor, C = berat/cloud.
// Prioritas: Inti = wajib di MVP, Lanjutan = fase berikutnya.

const KATEGORI = [
  {
    id: "A", nama: "Potongan dan Ritme", kode: "CUT",
    intro: "Kategori paling dasar yang menentukan tempo video. Seluruh teknik di kategori ini bekerja pada urutan klip dan durasi, tanpa mengubah isi bingkai. Teknik kelas A pada kategori ini cukup dihitung saat pratinjau, sementara yang berbasis musik atau analisis audio sebaiknya difinalkan saat ekspor agar posisinya presisi.",
    rows: [
      ["CUT-A01", "Jump Cut", "Potongan langsung di adegan yang sama untuk memangkas jeda dan menjaga energi bicara; gaya khas vlog dan video edukasi.", "posisi potong; lompatan bingkai", "A", "Inti"],
      ["CUT-A02", "Hard Cut", "Perpindahan klip paling dasar tanpa transisi; fondasi dari semua pola ritme lain.", "urutan klip", "A", "Inti"],
      ["CUT-A03", "Beat Cut", "Potongan diselaraskan ke penanda beat musik sehingga tempo visual mengikuti tempo audio.", "BPM; offset; pola (tiap 1/2/4 beat)", "B", "Lanjutan"],
      ["CUT-A04", "J-Cut / L-Cut", "Audio adegan berikutnya masuk sebelum visualnya (atau sebaliknya) agar sambungan antar adengan mengalir.", "offset audio (ms)", "A", "Inti"],
      ["CUT-A05", "Match Cut", "Menghubungkan dua adegan lewat kesamaan bentuk atau gerak; membutuhkan pasangan klip yang cocok.", "pasangan klip; titik cocok", "B", "Lanjutan"],
      ["CUT-A06", "Speed Ramp", "Percepatan dan pelambatan halus pada satu titik untuk menekankan momen penting.", "kurva kecepatan; titik kunci", "B", "Lanjutan"],
      ["CUT-A07", "Freeze Frame", "Membekukan bingkai sejenak disertai zoom kecil sebagai penekanan atau pembuka teks.", "durasi beku; arah zoom", "B", "Inti"],
      ["CUT-A08", "Punch-In", "Zoom cepat 10-25 persen di momen penekanan tanpa memotong klip.", "skala; durasi; easing", "A", "Inti"],
      ["CUT-A09", "Silence Trim", "Pemangkasan otomatis jeda bicara di atas ambang tertentu untuk mempercepat ritme narasi.", "ambang dB; padding ms", "B", "Inti"],
      ["CUT-A10", "Loop Clip", "Pengulangan segmen pendek mengikuti beat; efektif untuk hook awal.", "segmen; jumlah loop", "A", "Lanjutan"]
    ]
  },
  {
    id: "B", nama: "Komposisi dan Layout", kode: "LAY",
    intro: "Kategori yang mengatur posisi tokoh dan lapisan gambar di dalam bingkai. Kategori ini memuat komposisi paling khas untuk video storytelling: tokoh menyusut ke sudut, grafik masuk ke tengah, lalu tokoh kembali utuh. Prinsip data modelnya satu: setiap perubahan layout adalah anchor dengan posisi awal, posisi akhir, dan durasi.",
    rows: [
      ["LAY-B01", "PiP Corner", "Tokoh menyusut ke jendela kecil di sudut sehingga bagian tengah bebas untuk grafik atau b-roll.", "posisi; skala; durasi; bingkai", "B", "Inti"],
      ["LAY-B02", "Split Screen", "Dua klip berbagi satu layar secara vertikal atau horizontal untuk perbandingan atau reaksi.", "rasio; arah; garis pemisah", "B", "Lanjutan"],
      ["LAY-B03", "Background Removal", "Isolasi tokoh dari latar memakai segmentasi potret on-device; prasyarat ganti latar.", "mode (potret/objek); feather tepi", "A", "Inti"],
      ["LAY-B04", "Background Swap", "Latar diganti video atau gambar lain setelah tokoh diisolasi; gabungan LAY-B03 dan penataan layer.", "aset latar; blend; skala", "B", "Inti"],
      ["LAY-B05", "Auto Reframe", "Pembingkaian mengikuti subjek ketika rasio video berubah, misalnya dari 16:9 ke 9:16.", "rasio target; kecepatan ikut", "B", "Lanjutan"],
      ["LAY-B06", "Ken Burns", "Pan dan zoom perlahan pada gambar diam agar terasa hidup.", "crop awal; crop akhir; durasi", "A", "Inti"],
      ["LAY-B07", "Parallax 2D", "Lapisan latar dan utama bergerak dengan kecepatan berbeda untuk kesan kedalaman pada gambar diam.", "jumlah lapisan; amplitudo", "C", "Lanjutan"],
      ["LAY-B08", "Motion Tracking", "Overlay atau stiker mengikuti titik atau wajah yang bergerak.", "titik jejak; smoothing", "B", "Lanjutan"],
      ["LAY-B09", "Fullscreen Return", "Tokoh kembali layar penuh dari jendela PiP dengan gerak halus; penutup alami dari momen bukti.", "posisi awal; posisi akhir; durasi", "A", "Inti"]
    ]
  },
  {
    id: "C", nama: "Teks, Grafik dan Data", kode: "TXT",
    intro: "Kategori untuk semua elemen informasi yang menempel di atas video. Entri penting di sini adalah Chart Animation dan Stat Counter: keduanya pasangan wajib dari momen narasi bertema angka, persis seperti kasus kata kunci statistik yang menjadi contoh utama konsep aplikasi. Grafik dibuat dari template bawaan plus angka dari user, sehingga tidak membutuhkan aset eksternal.",
    rows: [
      ["TXT-C01", "Title Pop", "Judul singkat muncul dengan pentalan kecil di awal video; identitas konten pada tiga detik pertama.", "teks; gaya; timing", "A", "Inti"],
      ["TXT-C02", "Kinetic Typography", "Teks bergerak mengikuti irama kata kunci narasi; menekankan frasa penting tanpa wajah kamera.", "teks; font; sinkron kata", "B", "Lanjutan"],
      ["TXT-C03", "Auto Caption", "Takarir otomatis dari hasil speech-to-text dengan sorotan kata aktif ala karaoke.", "gaya; posisi; sorotan", "B", "Inti"],
      ["TXT-C04", "Lower Third", "Nama dan peran pembicara pada sepertiga bawah layar; standar dokumenter dan wawancara.", "teks; animasi masuk", "A", "Inti"],
      ["TXT-C05", "Callout", "Panah atau lingkaran dengan label yang menunjuk detail tertentu di dalam bingkai.", "titik jangkar; gaya panah", "B", "Lanjutan"],
      ["TXT-C06", "Chart Animation", "Grafik animasi dari template bawaan plus angka user; pasangan utama momen statistik.", "data; jenis grafik; durasi", "B", "Inti"],
      ["TXT-C07", "Stat Counter", "Angka berjalan naik atau turun menuju nilai target; versi ringkas dari grafik.", "nilai awal; nilai akhir; format", "A", "Lanjutan"],
      ["TXT-C08", "Shape Reveal", "Bentuk geometris membuka klip atau grafik; transisi bercerita yang rapi.", "bentuk; arah; easing", "B", "Lanjutan"],
      ["TXT-C09", "End Card", "Kartu penutup berisi ajakan bertindak, tombol langganan, atau video lanjutan.", "tata letak; tautan", "A", "Inti"],
      ["TXT-C10", "Watermark", "Logo atau penanda identitas kecil yang menetap dengan opasitas rendah.", "posisi; opasitas; ukuran", "A", "Inti"],
      ["TXT-C11", "Progress Bar", "Bar progres cerita di tepi layar untuk format daftar atau tips berurutan.", "gaya; segmen", "A", "Lanjutan"]
    ]
  },
  {
    id: "D", nama: "Efek Visual, Warna dan Transisi", kode: "FX",
    intro: "Kategori atmosfer: warna, tekstur, dan cara berpindah antar adegan. Sebagian besar entri berkelas B karena dihitung penuh saat ekspor, tetapi filter warna dan vignette cukup ringan untuk pratinjau real-time. Aturan desain pentingnya: efek kategori ini harus selalu punya parameter intensitas agar gaya tetap konsisten antar klip dan tidak berlebihan.",
    rows: [
      ["FX-D01", "LUT Filter", "Penerapan profil warna tertentu, misalnya teal-orange atau nuansa film, pada satu segmen atau seluruh video.", "preset LUT; intensitas", "A", "Inti"],
      ["FX-D02", "Color Match", "Penyamaan warna antar klip agar sambungan tidak terlihat.", "klip acuan", "C", "Lanjutan"],
      ["FX-D03", "Vignette", "Penggelapan halus di sudut bingkai untuk memusatkan pandangan.", "intensitas; kelembutan", "A", "Inti"],
      ["FX-D04", "Film Grain", "Butiran halus khas film untuk nuansa analog.", "jumlah; ukuran butir", "B", "Lanjutan"],
      ["FX-D05", "Light Leak", "Cahaya hangat yang membocor di titik transisi; rasa sinematik nostalgia.", "preset; arah", "A", "Lanjutan"],
      ["FX-D06", "Zoom Transition", "Perpindahan adegan lewat zoom cepat yang menyembunyikan potongan kasar.", "skala; blur; easing", "B", "Inti"],
      ["FX-D07", "Whip Pan Transition", "Sapuan kamera cepat untuk berganti adegan; paling pas untuk pasangan klip berlawanan arah.", "arah; blur gerak", "B", "Lanjutan"],
      ["FX-D08", "Glitch Effect", "Distorsi digital singkat sebagai aksen tema teknologi atau penutup potongan.", "intensitas; durasi", "B", "Lanjutan"],
      ["FX-D09", "Camera Shake", "Guncangan kecil pada momen keras untuk menambah energi.", "amplitudo; frekuensi", "B", "Lanjutan"],
      ["FX-D10", "Glow / Bloom", "Cahaya lembut pada area terang; memoles momen emosional.", "ambang; radius", "B", "Lanjutan"],
      ["FX-D11", "Blur Region", "Pengaburan area atau wajah tertentu, untuk privasi maupun fokus.", "wilayah; ikut gerak", "B", "Inti"],
      ["FX-D12", "Shape Wipe", "Transisi sapu dengan bentuk tertentu yang selaras dengan objek di adegan.", "bentuk; arah", "B", "Lanjutan"],
      ["FX-D13", "Particle FX", "Konfeti atau percikan pada momen puncak seperti reveal atau skor.", "jenis; densitas", "B", "Lanjutan"],
      ["FX-D14", "Speed Reverse", "Pemutaran ulang segmen secara terbalik; efek kejadian ulang atau humor.", "segmen; kecepatan keluaran", "B", "Lanjutan"],
      ["FX-D15", "Letterbox", "Bar gelap atas dan bawah untuk nuansa layar lebar sinematik.", "rasio; durasi animasi", "A", "Inti"]
    ]
  },
  {
    id: "E", nama: "Audio", kode: "AUD",
    intro: "Kategori yang sering diremehkan tapi paling menentukan kesan profesional. Music ducking saja sudah membuat video bicara terasa rapi. Entri Beat Marker menjadi jembatan antara audio dan kategori lain karena menghasilkan anchor waktu yang dipakai Beat Cut, teks, dan grafik.",
    rows: [
      ["AUD-E01", "Music Duck", "Volume musik turun otomatis ketika narasi aktif dan naik kembali saat hening.", "ambang; gain; attack/release", "A", "Inti"],
      ["AUD-E02", "Beat Marker", "Penanda beat musik sebagai anchor waktu untuk potongan, teks, dan grafik.", "BPM; offset", "B", "Inti"],
      ["AUD-E03", "SFX Sting", "Efek suara pendek seperti whoosh, ding, atau pop untuk menandai momen atau kemunculan grafik.", "jenis; timing; gain", "A", "Inti"],
      ["AUD-E04", "Voice Enhance", "Perbaikan suara bicara: normalisasi, noise gate, dan ekualisasi sederhana.", "target loudness; gate", "B", "Lanjutan"],
      ["AUD-E05", "Audio Fade", "Masuk dan keluar halus pada musik atau suasana di tepi segmen.", "durasi; kurva", "A", "Inti"],
      ["AUD-E06", "TTS Voiceover", "Narasi tambahan dari teks memakai suara sintetis untuk bagian tanpa rekaman.", "teks; suara; kecepatan", "C", "Lanjutan"],
      ["AUD-E07", "Ambience Bed", "Lapisan suara suasana dengan volume rendah di bawah narasi.", "aset; gain", "A", "Lanjutan"],
      ["AUD-E08", "Rhythm Sync", "Penataan ulang seluruh potongan dan teks otomatis mengikuti peta beat.", "peta beat; toleransi", "C", "Lanjutan"]
    ]
  },
  {
    id: "F", nama: "Cerdas dan Struktur Naratif", kode: "AI",
    intro: "Kategori lapisan kecerdasan yang membuat aplikasi terasa seperti sutradara: mendeteksi momen, memetakan struktur, dan menyarankan preset. Semua entri kelas B atau C dirancang sebagai penghasil saran yang selalu dikonfirmasi user, bukan eksekutor otomatis, sesuai prinsip AI mendeteksi, preset mengeksekusi, user memutuskan.",
    rows: [
      ["AI-F01", "Narration Anchor", "Deteksi kata kunci narasi, misalnya kata statistik, sebagai pemicu anchor efek di titik waktu tersebut.", "kamus kata; jendela waktu", "B", "Inti"],
      ["AI-F02", "Hook Builder", "Pola pembuka tiga detik: pertanyaan, teks tebal, punch-in; dipasang otomatis di awal video.", "pola; teks", "B", "Lanjutan"],
      ["AI-F03", "Semantic B-Roll", "Pencarian klip di pustaka user berdasarkan makna kalimat narasi memakai embedding.", "query; pustaka; jumlah hasil", "C", "Lanjutan"],
      ["AI-F04", "Auto Highlight", "Ringkasan momen terbaik dari video panjang menjadi versi pendek.", "durasi target; skor", "C", "Lanjutan"],
      ["AI-F05", "Silence Cut AI", "Pemangkasan jeda dan kata pengisi tanpa merusak kealamian bicara.", "tingkat agresivitas", "B", "Inti"],
      ["AI-F06", "Face Priority", "Pembingkaian otomatis mengikuti pembicara aktif; berguna untuk rekaman dua orang.", "deteksi wajah; hysteresis", "C", "Lanjutan"],
      ["AI-F07", "Scene Detect", "Pemisahan otomatis klip pada perubahan adegan; fondasi tahap Amati pada pipeline.", "ambang perubahan", "B", "Inti"],
      ["AI-F08", "Style Transfer LUT", "Rekomendasi profil warna dari analisis mood video referensi.", "mood; kandidat LUT", "C", "Lanjutan"],
      ["AI-F09", "Story Beat Map", "Pemetaan struktur hook, konteks, bukti, dan payoff ke durasi video user.", "model beat", "C", "Lanjutan"],
      ["AI-F10", "Preset Suggest", "Saran preset komposisi berdasarkan DNA referensi yang dipilih user.", "DNA; katalog", "B", "Lanjutan"]
    ]
  }
];

// Keluarga gaya: karakter, teknik andalan, skenario pemakaian.
const GAYA = [
  {
    nama: "Cinematic Storyteller",
    karakter: "Gaya untuk cerita yang ingin terasa personal dan berkelas. Tempo lambat hingga sedang dengan durasi klip lebih panjang, penerapan profil warna film yang konsisten, dan transisi halus antar adengan. Musik duduki peran besar sebagai pembawa emosi, sementara teks dipakai hemat hanya untuk judul dan penutup.",
    andalan: ["FX-D01", "FX-D04", "FX-D15", "CUT-A06", "CUT-A05", "LAY-B06", "AUD-E07"],
    skenario: "Paling cocok untuk cerita personal, brand film pendek, dan review mendalam berdurasi 2 sampai 5 menit. Contoh alur di aplikasi: rekam narasi utuh, lalu pada tahap Tiru pasang LUT film dari DNA referensi, beri Ken Burns pada tiga foto kenangan, tutup dengan Speed Ramp pada momen akhir. User cukup mengonfirmasi empat kartu saran tanpa menyentuh timeline."
  },
  {
    nama: "Fast-Cut Energetik",
    karakter: "Gaya bertempo tinggi di mana hampir setiap detik ada perubahan: potongan mengikuti beat, zoom menekan setiap klaim, dan efek suara menutup tiap transisi. Cocok untuk konten yang bersaing dengan kecepatan umpan pendek. Energi visual dijaga lewat variasi skala bingkai, bukan lewat tumpukan efek.",
    andalan: ["CUT-A03", "CUT-A01", "CUT-A08", "FX-D06", "FX-D09", "AUD-E03", "TXT-C07"],
    skenario: "Paling cocok untuk video produk singkat, tantangan, dan promo berdurasi 15 sampai 45 detik. Contoh di aplikasi: pilih musik dengan BPM jelas, jalankan Beat Cut agar seluruh potongan menempel pada beat, lalu pada detik-detik klaim utama pasang Stat Counter dan Punch-In. Sutradara digital menyarankan anchor per beat dan user cukup menolak yang kurang pas."
  },
  {
    nama: "Dokumenter Naratif",
    karakter: "Gaya inti untuk storytelling edukatif: pembicara di kamera, bukti visual muncul saat narasi menyebutnya, lalu kembali ke pembicara. Struktur beatnya tegas: hook, konteks, bukti, payoff. Komposisi PiP ke sudut plus grafik di tengah adalah tanda tangan gaya ini, dan takarir otomatis menjaga aksesibilitas.",
    andalan: ["LAY-B01", "LAY-B03", "LAY-B04", "LAY-B09", "TXT-C06", "TXT-C04", "TXT-C03", "CUT-A04", "AI-F01"],
    skenario: "Paling cocok untuk video eksplanasi, kajian kasus, dan konten edukasi 3 sampai 8 menit. Contoh di aplikasi: saat narasi mengucap kata statistik, Narration Anchor menandai titik itu, kartu saran menawarkan PiP Corner plus Chart Animation, user memilih grafik garis dan mengisi angkanya, lalu saat narasi beralih aplikasi menyarankan Fullscreen Return. Seluruh rangkaian hanya enam ketukan."
  },
  {
    nama: "Minimalis Kreator",
    karakter: "Gaya bersih dengan satu warna aksen, tipografi yang berbicara, dan ruang kosong yang disengaja. Efek visual nyaris tidak ada; penekanan datang dari gerak teks dan ritme potongan yang tenang. Terasa mahal justru karena menahan diri.",
    andalan: ["TXT-C02", "TXT-C08", "CUT-A08", "FX-D03", "TXT-C11", "CUT-A09"],
    skenario: "Paling cocok untuk tips cepat, kutipan, dan konten opini 30 sampai 90 detik. Contoh di aplikasi: Silence Trim memangkas jeda bicara, Kinetic Typography menyorot tiga frasa kunci yang dipilih user, Shape Reveal membuka tiap poin, dan vignette tipis menyatukan semuanya."
  },
  {
    nama: "Data Storyteller",
    karakter: "Gaya yang menjadikan angka sebagai tokoh utama. Grafik animasi, pencacah angka, dan penunjuk detail bekerja bersama PiP agar pembicara tetap hadir sambil menjelaskan. Karena isi didominasi data, kesalahan kecil pada angka sangat terlihat, sehingga setiap kartu data wajib dikonfirmasi user sebelum render.",
    andalan: ["TXT-C06", "TXT-C07", "TXT-C05", "LAY-B01", "LAY-B02", "AUD-E01", "TXT-C04"],
    skenario: "Paling cocok untuk laporan ringkas, perbandingan produk, dan konten finansial 1 sampai 4 menit. Contoh di aplikasi: user menempel tiga titik data, aplikasi mengusulkan Chart Animation untuk tren, Stat Counter untuk angka kunci, dan Callout untuk anomali, semuanya dengan pratinjau dua detik per kartu."
  },
  {
    nama: "Vlog Kasual",
    karakter: "Gaya paling santai: potongan cepat tanpa pamrih, takarir penuh warna, dan stiker yang mengikuti gerak. Kekurangan rekaman ditutupi oleh energi penyuntingan. Teks dan stiker justru menjadi bagian dari humor.",
    andalan: ["CUT-A01", "TXT-C03", "LAY-B08", "FX-D13", "TXT-C09", "AUD-E05", "CUT-A10"],
    skenario: "Paling cocok untuk vlog harian, reaksi, dan konten perjalanan 1 sampai 10 menit. Contoh di aplikasi: Auto Caption diaktifkan sekali untuk seluruh video, Jump Cut memangkas semua jeda, stiker pelacak ditempel pada wajah lewat Motion Tracking di satu momen, dan End Card menutup video."
  }
];

// Skema DNA Referensi — tiap elemen array = satu baris blok JSON pada dokumen.
const SKEMA_JSON = [
  "{",
  "  \"schema_version\": \"1.0\",",
  "  \"reference\": {",
  "    \"title\": \"string\",            \"duration_sec\": 0,",
  "    \"aspect_ratio\": \"9:16\",       \"language\": \"id\"",
  "  },",
  "  \"style\": {",
  "    \"family\": \"documentary-narrative\",",
  "    \"palette_mood\": \"warm-neutral\",",
  "    \"tempo\": { \"cuts_per_minute\": 0, \"avg_shot_sec\": 0 },",
  "    \"energy_curve\": [0.2, 0.8, 0.5]",
  "  },",
  "  \"beats\": [",
  "    { \"id\": \"b1\", \"type\": \"hook\",",
  "      \"start_sec\": 0.0, \"end_sec\": 3.0,",
  "      \"summary\": \"pertanyaan pembuka\", \"transcript\": \"...\" }",
  "  ],",
  "  \"anchors\": [",
  "    { \"id\": \"a1\", \"beat_id\": \"b2\", \"t_sec\": 12.3,",
  "      \"tolerance_sec\": 0.8,",
  "      \"technique\": \"PIP-CORNER\", \"layer\": 1,",
  "      \"params\": { \"position\": \"top-right\", \"scale\": 0.35,",
  "                   \"duration_sec\": 6.0 },",
  "      \"asset\": { \"type\": \"template\", \"ref\": \"chart-line-v1\" },",
  "      \"confidence\": 0.0,",
  "      \"trigger\": { \"type\": \"keyword\", \"value\": \"statistik\" } }",
  "  ],",
  "  \"audio_map\": {",
  "    \"bpm\": 0, \"beats_sec\": [0.0],",
  "    \"duck_regions\": [ { \"start_sec\": 0, \"end_sec\": 0 } ]",
  "  },",
  "  \"unknown_techniques\": [",
  "    { \"t_sec\": 41.0, \"observed\": \"transisi cair kustom\",",
  "      \"suggestion\": \"usul entri baru ke katalog\" }",
  "  ]",
  "}"
];

// Penjelasan field skema: [field, tipe, wajib, deskripsi]
const SKEMA_FIELD = [
  ["schema_version", "string", "Ya", "Versi skema; wajib agar file lama tetap bisa dibaca saat skema berkembang."],
  ["reference", "object", "Ya", "Metadata video referensi: judul, durasi, rasio, dan bahasa narasi."],
  ["style", "object", "Ya", "Lapisan gaya: keluarga gaya, mood warna, tempo potongan, dan kurva energi per segmen."],
  ["beats", "array", "Ya", "Struktur naratif: daftar beat dengan jenis (hook, konteks, bukti, payoff, CTA), rentang waktu, dan ringkasan."],
  ["anchors", "array", "Ya", "Inti skema: daftar efek dengan titik waktu, teknik katalog, parameter, aset, dan tingkat keyakinan AI."],
  ["anchors.tolerance_sec", "number", "Ya", "Rentang toleransi posisi; pratinjau wajib dikonfirmasi user bila penyimpangan melebihi nilai ini."],
  ["anchors.trigger", "object", "Tidak", "Pemicu semantik, misalnya kata kunci narasi atau beat musik, agar anchor bisa dipetakan ulang ke video user."],
  ["audio_map", "object", "Tidak", "Peta beat musik dan wilayah ducking; dipakai Beat Cut dan Music Duck pada tahap Tiru."],
  ["unknown_techniques", "array", "Tidak", "Teknik yang terlihat di referensi tapi belum ada di katalog; bahan pengembangan katalog."],
  ["confidence", "number", "Ya", "Keyakinan AI 0.0 sampai 1.0; di bawah ambang, kartu saran wajib menampilkan pratinjau sebelum konfirmasi."]
];

// Contoh DNA Referensi untuk Lampiran B (video fiktif 45 detik, ilustratif).
const CONTOH_JSON = [
  "{",
  "  \"schema_version\": \"1.0\",",
  "  \"reference\": { \"title\": \"CONTOH-ILUSTRATIF-45s\",",
  "    \"duration_sec\": 45, \"aspect_ratio\": \"9:16\", \"language\": \"id\" },",
  "  \"style\": { \"family\": \"documentary-narrative\",",
  "    \"palette_mood\": \"warm-neutral\",",
  "    \"tempo\": { \"cuts_per_minute\": 26, \"avg_shot_sec\": 2.3 },",
  "    \"energy_curve\": [0.9, 0.5, 0.8, 0.6] },",
  "  \"beats\": [",
  "    { \"id\": \"b1\", \"type\": \"hook\",     \"start_sec\": 0.0,  \"end_sec\": 3.5 },",
  "    { \"id\": \"b2\", \"type\": \"konteks\",  \"start_sec\": 3.5,  \"end_sec\": 12.0 },",
  "    { \"id\": \"b3\", \"type\": \"bukti\",    \"start_sec\": 12.0, \"end_sec\": 30.0 },",
  "    { \"id\": \"b4\", \"type\": \"payoff\",   \"start_sec\": 30.0, \"end_sec\": 41.0 },",
  "    { \"id\": \"b5\", \"type\": \"CTA\",      \"start_sec\": 41.0, \"end_sec\": 45.0 }",
  "  ],",
  "  \"anchors\": [",
  "    { \"id\": \"a1\", \"beat_id\": \"b1\", \"t_sec\": 1.0, \"tolerance_sec\": 0.5,",
  "      \"technique\": \"TXT-C01\", \"layer\": 2,",
  "      \"params\": { \"text\": \"3 KESALAHAN UMUM\", \"anim\": \"pop\" },",
  "      \"confidence\": 0.92 },",
  "    { \"id\": \"a2\", \"beat_id\": \"b3\", \"t_sec\": 12.4, \"tolerance_sec\": 0.8,",
  "      \"technique\": \"LAY-B01\", \"layer\": 1,",
  "      \"params\": { \"position\": \"top-right\", \"scale\": 0.35,",
  "                   \"duration_sec\": 14.0 },",
  "      \"trigger\": { \"type\": \"keyword\", \"value\": \"statistik\" },",
  "      \"confidence\": 0.88 },",
  "    { \"id\": \"a3\", \"beat_id\": \"b3\", \"t_sec\": 13.0, \"tolerance_sec\": 0.8,",
  "      \"technique\": \"TXT-C06\", \"layer\": 2,",
  "      \"asset\": { \"type\": \"template\", \"ref\": \"chart-bar-v1\" },",
  "      \"params\": { \"data\": [32, 58, 74], \"duration_sec\": 8.0 },",
  "      \"confidence\": 0.85 },",
  "    { \"id\": \"a4\", \"beat_id\": \"b4\", \"t_sec\": 30.2, \"tolerance_sec\": 1.0,",
  "      \"technique\": \"LAY-B09\", \"layer\": 1,",
  "      \"params\": { \"duration_sec\": 1.2 },",
  "      \"confidence\": 0.9 },",
  "    { \"id\": \"a5\", \"beat_id\": \"b5\", \"t_sec\": 42.0, \"tolerance_sec\": 0.5,",
  "      \"technique\": \"TXT-C09\", \"layer\": 2,",
  "      \"params\": { \"cta\": \"ikuti\", \"duration_sec\": 3.0 },",
  "      \"confidence\": 0.95 }",
  "  ],",
  "  \"audio_map\": { \"bpm\": 96,",
  "    \"beats_sec\": [0.0, 0.63, 1.25, 1.88],",
  "    \"duck_regions\": [ { \"start_sec\": 3.5, \"end_sec\": 41.0 } ] },",
  "  \"unknown_techniques\": [",
  "    { \"t_sec\": 37.5, \"observed\": \"transisi sapu bentuk kustom\",",
  "      \"suggestion\": \"evaluasi sebagai varian FX-D12\" }",
  "  ]",
  "}"
];

// Tata bahasa naratif: [beat, peran, pemicu khas, teknik umum]
const TATA_BAHASA = [
  ["Hook", "Menahan perhatian 3 detik pertama; menjanjikan nilai menonton.", "Kalimat pertama; musik mulai.", "TXT-C01, CUT-A08, AI-F02"],
  ["Konteks", "Memberi latar masalah sebelum menawarkan jawaban.", "Kata kunci misalnya masalah atau pertanyaan.", "LAY-B06, TXT-C03, CUT-A09"],
  ["Bukti", "Mendukung klaim dengan data, contoh, atau b-roll.", "Kata kunci misalnya statistik atau penelitian.", "LAY-B01, TXT-C06, TXT-C05, LAY-B04"],
  ["Payoff", "Jawaban utama atau kesimpulan; momen puncak emosi.", "Kalimat karena itu atau intinya.", "LAY-B09, CUT-A06, FX-D10"],
  ["CTA", "Ajakan bertindak penutup.", "Kalimat ajakan di akhir.", "TXT-C09, AUD-E05"]
];

// Aturan eksekusi: [aturan, penjelasan]
const ATURAN_EKSEKUSI = [
  ["Pratinjau kelas A, ekspor semua", "Seluruh anchor, apa pun kelasnya, dirender penuh saat ekspor memakai pipeline decode-render-encode. Kelas A hanya berarti efeknya ikut tampil pada pratinjau real-time di layar edit."],
  ["Maksimum dua layer aktif", "Sebuah anchor menempati salah satu layer: video (1), grafik dan teks (2). Dua layer ini menghormati keterbatasan memori GPU ponsel kelas menengah dan menjaga keterbacaan komposisi."],
  ["Durasi minimum efek 1,5 detik", "Efek yang lebih pendek dari 1,5 detik sulit dibaca penonton dan rawan terlihat seperti kesalahan; kartu saran menolak nilai di bawah ambang ini."],
  ["Jarak antar anchor di layer sama", "Dua anchor pada layer yang sama wajib berjarak minimal satu detik, atau digabung menjadi satu anchor dengan parameter gabungan."],
  ["Prioritas pratinjau murah", "Pratinjau memakai resolusi rendah saat banyak anchor aktif, lalu kembali ke resolusi penuh saat anchor sedikit, agar interaksi tetap mulus pada ponsel menengah."],
  ["Konfirmasi wajib untuk angka", "Semua anchor bertipe data, seperti Chart Animation dan Stat Counter, wajib melewati konfirmasi user karena kesalahan angka paling merusak kredibilitas."],
  ["Batas termal sesi edit", "Sesi editing pasca-rekam tidak membebani GPU terus-menerus, tetapi pratinjau berulang pada video 4K tetap menyebabkan panas; pada suhu tinggi pratinjau otomatis turun ke 1080p."],
  ["Pola, bukan konten", "Pipeline referensi hanya boleh menyalin pola teknik dari video referensi, tidak pernah menyalin aset, teks, atau grafik milik orang lain."]
];

// Peta jalan: [fase, isi, teknik yang diaktifkan, keluaran]
const ROADMAP = [
  ["Fase 0 — Fondasi", "Adopsi katalog dan skema DNA Referensi sebagai kontrak data internal; penetapan kosakata aksi terkekang untuk agen AI.", "Seluruh ID katalog", "Dokumen ini disetujui; skema JSON dikunci v1.0"],
  ["Fase 1 — MVP preset manual", "Rekam polos, tahap pause-edit dengan radial menu, preset komposisi kelas A dan B, ekspor via pipeline Media3 Transformer.", "Semua Inti kelas A dan B (24 teknik)", "Prototipe bisa dipakai harian"],
  ["Fase 2 — Sutradara digital", "Speech-to-text on-device, kartu saran momen dari kata kunci narasi, konfirmasi satu ketukan.", "AI-F01, AI-F05, AI-F07, AUD-E02", "Alur tanpa mengetik kecuali niat awal"],
  ["Fase 3 — Amati Tiru Modifikasi", "Analisis referensi ke DNA, pemetaan struktur ke video user, variasi gaya otomatis.", "AI-F09, AI-F10, AI-F03, seluruh Lanjutan", "Pipeline referensi lengkap"],
  ["Fase 4 — Ekosistem preset", "Pasar preset komunitas, pembagian paket gaya, monetisasi selera.", "Seluruh katalog", "Jaring efek kreatif aplikasi"]
];

module.exports = { KATEGORI, GAYA, SKEMA_JSON, SKEMA_FIELD, CONTOH_JSON, TATA_BAHASA, ATURAN_EKSEKUSI, ROADMAP };
