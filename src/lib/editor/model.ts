export type Motion =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down'
  | 'static'

export type AnimIn = 'fade' | 'slide-up' | 'slide-down' | 'zoom' | 'none'
export type AnimOut = 'fade' | 'slide-down' | 'zoom' | 'none'
export type AssetSource = 'stock' | 'ai' | 'upload'
export type CaptionPreset = 'karaoke' | 'tiktok' | 'box' | 'clean' | 'none'
export type CaptionFont = 'poppins' | 'montserrat' | 'geist'
export type CaptionPosition = 'top' | 'center' | 'bottom'
export type Aspect = '9:16' | '1:1' | '16:9'

export interface Scene {
  id: string
  script: string
  durationOverride: number | null
  motion: Motion
  animIn: AnimIn
  animOut: AnimOut
  loop: boolean
  image: string
  gradient: string
  assetSource: AssetSource
  assetLabel: string
  status: 'ready' | 'pending'
}

export interface Voice {
  id: string
  name: string
  desc: string
  tag: string
  color: string
}

export interface Caption {
  enabled: boolean
  preset: CaptionPreset
  font: CaptionFont
  size: number
  position: CaptionPosition
  highlight: boolean
  accent: string
}

export interface StockAsset {
  id: string
  label: string
  img: string
  gradient: string
  tags: string
}

export const VOICES: Voice[] = [
  { id: 'sari', name: 'Sari', desc: 'Wanita · Santai hangat', tag: 'Storytelling', color: '#F472B6' },
  { id: 'arif', name: 'Arif', desc: 'Pria · Berita formal', tag: 'Dokumenter', color: '#A78BFA' },
  { id: 'dimas', name: 'Dimas', desc: 'Pria · Enerjik muda', tag: 'Hype', color: '#34D399' },
  { id: 'ratna', name: 'Ratna', desc: 'Wanita · Jernih tenang', tag: 'Edukatif', color: '#FACC15' },
  { id: 'bagas', name: 'Bagas', desc: 'Pria · Berat sinematik', tag: 'Sinematik', color: '#FB923C' },
  { id: 'nayla', name: 'Nayla', desc: 'Wanita · Ceria cepat', tag: 'Vlog', color: '#22D3EE' },
]

export const STOCKS: StockAsset[] = [
  { id: 'sunrise', label: 'Sunrise City', img: '/scenes/sunrise.png', gradient: 'from-orange-500 to-pink-600', tags: 'kota pagi matahari langit' },
  { id: 'calm', label: 'Desk Morning', img: '/scenes/calm.png', gradient: 'from-amber-400 to-orange-600', tags: 'meja kopi jurnal tenang' },
  { id: 'goals', label: 'Planner Goals', img: '/scenes/goals.png', gradient: 'from-emerald-400 to-teal-600', tags: 'tulis target planner jurnal' },
  { id: 'move', label: 'Rooftop Workout', img: '/scenes/move.png', gradient: 'from-amber-500 to-red-600', tags: 'olahraga senam lari pagi' },
  { id: 'cta', label: 'Neon Arrow', img: '/scenes/cta.png', gradient: 'from-fuchsia-500 to-violet-600', tags: 'follow like ikon cta neon' },
  { id: 'ocean', label: 'Ocean Waves', img: '', gradient: 'from-teal-400 to-emerald-700', tags: 'laut ombak pantai tenang' },
  { id: 'forest', label: 'Forest Walk', img: '', gradient: 'from-lime-400 to-green-700', tags: 'hutan jalan pohon sehat' },
  { id: 'night', label: 'Night Drive', img: '', gradient: 'from-slate-500 to-zinc-900', tags: 'malam jalan lampu kota' },
]

export const MOTION_META: { id: Motion; label: string }[] = [
  { id: 'zoom-in', label: 'Zoom In' },
  { id: 'zoom-out', label: 'Zoom Out' },
  { id: 'pan-left', label: 'Geser Kiri' },
  { id: 'pan-right', label: 'Geser Kanan' },
  { id: 'pan-up', label: 'Geser Atas' },
  { id: 'pan-down', label: 'Geser Bawah' },
  { id: 'static', label: 'Statis' },
]

export const ANIM_IN_META: { id: AnimIn; label: string }[] = [
  { id: 'fade', label: 'Fade' },
  { id: 'slide-up', label: 'Geser Atas' },
  { id: 'slide-down', label: 'Geser Bawah' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'none', label: 'Tanpa' },
]

export const ANIM_OUT_META: { id: AnimOut; label: string }[] = [
  { id: 'fade', label: 'Fade' },
  { id: 'slide-down', label: 'Geser Bawah' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'none', label: 'Tanpa' },
]

export const CAPTION_PRESETS: { id: CaptionPreset; label: string; desc: string }[] = [
  { id: 'karaoke', label: 'Karaoke Neon', desc: 'Kata aktif disorot warna' },
  { id: 'tiktok', label: 'TikTok Tebal', desc: 'Kapital, outline hitam' },
  { id: 'box', label: 'Kotak Sorot', desc: 'Frase dalam kotak warna' },
  { id: 'clean', label: 'Bersih', desc: 'Putih polos elegan' },
  { id: 'none', label: 'Tanpa Teks', desc: 'Subtitle disembunyikan' },
]

export const ACCENTS = ['#FACC15', '#34D399', '#A78BFA', '#F472B6', '#FFFFFF']

export const FONT_MAP: Record<CaptionFont, string> = {
  poppins: 'var(--font-poppins)',
  montserrat: 'var(--font-montserrat)',
  geist: 'var(--font-geist-sans)',
}

let seq = 100
export function newId() {
  seq += 1
  return `s${seq}-${Math.random().toString(36).slice(2, 7)}`
}

/** Asset stok yang punya gambar (untuk scene baru & impor naskah). */
export const IMG_STOCKS = STOCKS.filter((s) => s.img)

export function makeScene(partial: Partial<Scene> = {}, index = 0): Scene {
  const asset = IMG_STOCKS[index % IMG_STOCKS.length]
  const motions: Motion[] = ['zoom-in', 'pan-right', 'zoom-out', 'pan-left']
  const anims: AnimIn[] = ['fade', 'slide-up', 'zoom']
  return {
    id: newId(),
    script: '',
    durationOverride: null,
    motion: motions[index % motions.length],
    animIn: anims[index % anims.length],
    animOut: 'fade',
    loop: true,
    image: asset.img,
    gradient: asset.gradient,
    assetSource: 'stock',
    assetLabel: `Stok: ${asset.label}`,
    status: 'ready',
    ...partial,
  }
}

export const INITIAL_SCENES: Scene[] = [
  makeScene(
    {
      id: 's1',
      script: 'Kebanyakan orang gagal bukan karena malas, tapi karena urutan pagi mereka salah.',
      image: '/scenes/sunrise.png',
      gradient: 'from-orange-500 to-pink-600',
      motion: 'zoom-in',
      animIn: 'fade',
      assetLabel: 'Stok: Sunrise City',
    },
    0,
  ),
  makeScene(
    {
      id: 's2',
      script: 'Kebiasaan pertama: bangun dan jangan sentuh HP selama 10 menit pertama. Otakmu akan jauh lebih tenang.',
      image: '/scenes/calm.png',
      gradient: 'from-amber-400 to-orange-600',
      motion: 'pan-right',
      animIn: 'slide-up',
      assetLabel: 'Stok: Desk Morning',
    },
    1,
  ),
  makeScene(
    {
      id: 's3',
      script: 'Kebiasaan kedua: tulis 3 target terpenting sebelum jam 9 pagi. Yang tidak ditulis, tidak akan dikerjakan.',
      image: '/scenes/goals.png',
      gradient: 'from-emerald-400 to-teal-600',
      motion: 'zoom-in',
      animIn: 'fade',
      assetLabel: 'Stok: Planner Goals',
    },
    2,
  ),
  makeScene(
    {
      id: 's4',
      script: 'Kebiasaan ketiga: gerakkan badan 15 menit. Bukan demi sixpack, tapi demi fokus sepanjang hari.',
      image: '/scenes/move.png',
      gradient: 'from-amber-500 to-red-600',
      motion: 'pan-left',
      animIn: 'slide-up',
      assetLabel: 'Stok: Rooftop Workout',
    },
    3,
  ),
  makeScene(
    {
      id: 's5',
      script: 'Simpan video ini, lalu coba besok pagi. Follow untuk tips produktivitas lainnya.',
      image: '/scenes/cta.png',
      gradient: 'from-fuchsia-500 to-violet-600',
      motion: 'zoom-out',
      animIn: 'zoom',
      assetLabel: 'AI: Neon CTA arrow',
      assetSource: 'ai',
    },
    4,
  ),
]

/* ============================================================
   KOLEKSI ANIMASI — preset siap pakai + preset buatan sendiri
   ============================================================ */

export interface AnimationPreset {
  id: string
  name: string
  desc: string
  bestFor: string
  motion: Motion
  animIn: AnimIn
  animOut: AnimOut
  loop: boolean
  custom?: boolean
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'p-hook',
    name: 'Hook Sinematik',
    desc: 'Perlahan mendekat ke visual + fade halus. Fokus penonton langsung ke tengah.',
    bestFor: 'Scene pembuka / hook 3 detik pertama',
    motion: 'zoom-in',
    animIn: 'fade',
    animOut: 'fade',
    loop: true,
  },
  {
    id: 'p-docu',
    name: 'Dokumenter Tenang',
    desc: 'Geser kiri pelan seperti kamera di rel. Cocok untuk narasi panjang yang kalem.',
    bestFor: 'Narasi storytelling / edukasi',
    motion: 'pan-left',
    animIn: 'fade',
    animOut: 'fade',
    loop: true,
  },
  {
    id: 'p-hype',
    name: 'TikTok Hype',
    desc: 'Zoom cepat + teks menyelinap dari bawah. Energi tinggi untuk konten cepat.',
    bestFor: 'Konten cepat / listicle',
    motion: 'zoom-in',
    animIn: 'slide-up',
    animOut: 'zoom',
    loop: true,
  },
  {
    id: 'p-jurnal',
    name: 'Jurnal Estetik',
    desc: 'Kamera naik pelan ke atas, vibe meja kerja / planner / morning routine.',
    bestFor: 'Visual flat-lay & kebiasaan pagi',
    motion: 'pan-up',
    animIn: 'slide-up',
    animOut: 'fade',
    loop: true,
  },
  {
    id: 'p-cta',
    name: 'CTA Penutup',
    desc: 'Mundur perlahan (zoom out) — memperlihatkan seluruh visual sebelum CTA muncul.',
    bestFor: 'Scene penutup / ajakan follow',
    motion: 'zoom-out',
    animIn: 'zoom',
    animOut: 'fade',
    loop: true,
  },
  {
    id: 'p-travel',
    name: 'Travel Pan',
    desc: 'Geser kanan lebar, cocok untuk lanskap / kota / visual lebar.',
    bestFor: 'Lanskap & establishing shot',
    motion: 'pan-right',
    animIn: 'fade',
    animOut: 'fade',
    loop: true,
  },
  {
    id: 'p-reveal',
    name: 'Dolly Reveal',
    desc: 'Masuk dengan zoom dari kecil — dramatis untuk memperkenalkan sesuatu.',
    bestFor: 'Reveal produk / momen penting',
    motion: 'zoom-in',
    animIn: 'zoom',
    animOut: 'zoom',
    loop: false,
  },
  {
    id: 'p-statis',
    name: 'Poster Statis',
    desc: 'Tanpa gerakan kamera, hanya fade. Untuk teks besar, quote, atau infografis.',
    bestFor: 'Quote / teks penting / data',
    motion: 'static',
    animIn: 'fade',
    animOut: 'fade',
    loop: false,
  },
]

/* ============================================================
   SUMBER ASET GRATIS — semua bisa dipakai tanpa biaya
   ============================================================ */

export type AssetCategory = 'video' | 'foto' | 'musik' | 'sfx' | 'tts' | 'ai-img' | 'font'

export interface FreeSource {
  name: string
  url: string
  category: AssetCategory
  desc: string
  license: string
}

export const CATEGORY_META: { id: AssetCategory; label: string; emoji: string }[] = [
  { id: 'video', label: 'Video Stok', emoji: '🎬' },
  { id: 'foto', label: 'Foto', emoji: '📷' },
  { id: 'musik', label: 'Musik', emoji: '🎵' },
  { id: 'sfx', label: 'Efek Suara', emoji: '💥' },
  { id: 'tts', label: 'Voice AI', emoji: '🗣️' },
  { id: 'ai-img', label: 'Gambar AI', emoji: '✨' },
  { id: 'font', label: 'Font', emoji: '🔤' },
]

export const FREE_SOURCES: FreeSource[] = [
  { name: 'Pexels', url: 'https://www.pexels.com/video/', category: 'video', desc: 'Ribuan video stok berkualitas, gratis komersial tanpa atribusi.', license: 'Pexels License' },
  { name: 'Pixabay Video', url: 'https://pixabay.com/videos/', category: 'video', desc: 'Video stok & b-roll 4K, banyak topik lifestyle & alam.', license: 'Pixabay License' },
  { name: 'Mixkit', url: 'https://mixkit.co/free-stock-video/', category: 'video', desc: 'Kurasi video pendek rapi — cocok untuk hook & b-roll.', license: 'Mixkit License' },
  { name: 'Coverr', url: 'https://coverr.co/', category: 'video', desc: 'Video stok estetik untuk latar & establishing shot.', license: 'Gratis tanpa atribusi' },
  { name: 'Pexels', url: 'https://www.pexels.com/', category: 'foto', desc: 'Foto stok terlengkap, filter orientasi vertikal tersedia.', license: 'Pexels License' },
  { name: 'Unsplash', url: 'https://unsplash.com/', category: 'foto', desc: 'Foto artistik kualitas tinggi untuk latar scene.', license: 'Unsplash License' },
  { name: 'Pixabay Music', url: 'https://pixabay.com/music/', category: 'musik', desc: 'Musik latar bebas royalti per genre & mood.', license: 'Pixabay License' },
  { name: 'YouTube Audio Library', url: 'https://studio.youtube.com/channel/UC/music', category: 'musik', desc: 'Musik & SFX resmi YouTube, aman untuk monetisasi.', license: 'Bebas royalti' },
  { name: 'FreePD', url: 'https://freepd.com/', category: 'musik', desc: 'Musik domain publik (CC0) — paling bebas dipakai.', license: 'CC0 / Public Domain' },
  { name: 'Mixkit SFX', url: 'https://mixkit.co/free-sound-effects/', category: 'sfx', desc: 'Efek suara whoosh, pop, riser untuk transisi & hook.', license: 'Mixkit License' },
  { name: 'Freesound', url: 'https://freesound.org/', category: 'sfx', desc: 'Bank SFX komunitas terbesar — cek lisensi per suara.', license: 'CC0 / CC-BY per suara' },
  { name: 'TTSMaker', url: 'https://ttsmaker.com/', category: 'tts', desc: 'TTS gratis ada bahasa Indonesia, hasil boleh dipakai komersial.', license: 'Gratis komersial' },
  { name: 'CapCut TTS', url: 'https://www.capcut.com/', category: 'tts', desc: 'Text-to-speech bawaan CapCut desktop — gratis & instan.', license: 'Gratis' },
  { name: 'ElevenLabs (free tier)', url: 'https://elevenlabs.io/', category: 'tts', desc: 'Kualitas suara terbaik — gratis 10 ribu karakter/bulan.', license: 'Free tier' },
  { name: 'Bing Image Creator', url: 'https://www.bing.com/create', category: 'ai-img', desc: 'Generate gambar AI gratis via akun Microsoft (DALL·E).', license: 'Gratis dengan boost harian' },
  { name: 'Leonardo.ai', url: 'https://leonardo.ai/', category: 'ai-img', desc: 'Kredit harian gratis — gaya konsisten untuk feed.', license: 'Free daily credit' },
  { name: 'Google Fonts', url: 'https://fonts.google.com/', category: 'font', desc: 'Poppins & Montserrat untuk subtitle — lisensi terbuka.', license: 'OFL' },
  { name: 'Fontshare', url: 'https://www.fontshare.com/', category: 'font', desc: 'Font premium gratis (General Sans, Satoshi, dll).', license: 'ITF Free Font' },
]

/* ============================================================
   DATABASE GOOGLE SHEETS — struktur 1 tab per video
   ============================================================ */

export interface SheetColumn {
  col: string
  key: string
  label: string
  desc: string
  example: string
}

export const SHEET_COLUMNS: SheetColumn[] = [
  { col: 'A', key: 'video_id', label: 'video_id', desc: 'ID unik video (V-001, V-002…)', example: 'V-001' },
  { col: 'B', key: 'judul', label: 'judul', desc: 'Judul / hook video', example: '3 Kebiasaan Pagi' },
  { col: 'C', key: 'no_scene', label: 'no_scene', desc: 'Nomor urut scene', example: '1' },
  { col: 'D', key: 'naskah', label: 'naskah', desc: 'Teks yang dibacakan TTS', example: 'Kebanyakan orang gagal…' },
  { col: 'E', key: 'durasi', label: 'durasi_detik', desc: 'Estimasi durasi scene (detik)', example: '5.8' },
  { col: 'F', key: 'aset', label: 'aset', desc: 'URL visual (Pexels / AI / upload)', example: 'pexels.com/photo/…' },
  { col: 'G', key: 'gerakan', label: 'gerakan', desc: 'Ken Burns: zoom-in, pan-left…', example: 'zoom-in' },
  { col: 'H', key: 'anim_in', label: 'anim_in', desc: 'Animasi masuk', example: 'fade' },
  { col: 'I', key: 'anim_out', label: 'anim_out', desc: 'Animasi keluar', example: 'fade' },
  { col: 'J', key: 'voice', label: 'voice', desc: 'Nama suara AI', example: 'Sari' },
  { col: 'K', key: 'status', label: 'status', desc: 'Draft / Siap / Render / Upload', example: 'Siap' },
  { col: 'L', key: 'catatan', label: 'catatan', desc: 'Catatan produksi', example: 'Ganti visual klip 3' },
]

export interface ToolInfo {
  name: string
  url: string
  tagline: string
  bestFor: string
  price: string
  pros: string[]
  cons: string[]
  badge: string
}

/* Stack Rp0 — urutan sesuai alur produksi */
export const FREE_STACK: ToolInfo[] = [
  {
    name: 'Google Sheets',
    url: 'sheets.google.com',
    tagline: 'Database setiap video: naskah, aset, status produksi',
    bestFor: 'Satu tab per video + tab Dashboard rekap',
    price: 'Gratis · akun Google',
    pros: [
      'Kolom naskah → tinggal copy-paste ke editor',
      'Kolom status untuk tracking (Draft → Render → Upload)',
      'Bisa diakses dari HP saat merekam / mencari aset',
    ],
    cons: ['Manual — tidak otomatis generate video'],
    badge: 'Database',
  },
  {
    name: 'Pexels + Pixabay',
    url: 'pexels.com · pixabay.com',
    tagline: 'Stok video & foto gratis untuk semua scene',
    bestFor: 'Visual b-roll tanpa lisensi ribet',
    price: 'Gratis · tanpa atribusi',
    pros: [
      'Filter orientasi vertikal langsung sesuai 9:16',
      'Koleksi besar: lifestyle, kota, alam, bisnis',
      'Aman dipakai komersial & monetisasi',
    ],
    cons: ['Visual populer bisa dipakai banyak kreator juga'],
    badge: 'Aset',
  },
  {
    name: 'TTSMaker / CapCut TTS',
    url: 'ttsmaker.com · capcut.com',
    tagline: 'Voice-over gratis tanpa langganan',
    bestFor: 'Narasi bahasa Indonesia natural',
    price: 'Gratis (TTSMaker boleh komersial)',
    pros: [
      'TTSMaker: pilih suara Indonesia, unduh MP3 langsung',
      'CapCut TTS bawaan + auto caption gratis',
      'ElevenLabs free tier 10k karakter/bln untuk kualitas premium',
    ],
    cons: ['Free tier punya batas karakter harian'],
    badge: 'Voice',
  },
  {
    name: 'CapCut Desktop',
    url: 'capcut.com',
    tagline: 'Editor video gratis tempat merakit semuanya',
    bestFor: 'Susun scene + subtitle otomatis + ekspor 1080p',
    price: 'Gratis (fitur pro ditandai jelas)',
    pros: [
      'Auto caption gratis — cocok dengan preset subtitle editor ini',
      'Keyframe untuk gerakan Ken Burns manual',
      'Ekspor 1080p tanpa watermark (versi desktop)',
    ],
    cons: ['Bisa berbayar nanti kalau butuh fitur pro tertentu'],
    badge: 'Editor',
  },
]

/* Opsi berbayar — simpan untuk nanti kalau channel sudah monetisasi */
export const TOOLS: ToolInfo[] = [
  {
    name: 'InVideo AI',
    url: 'invideo.ai',
    tagline: 'Satu prompt → video utuh dirakit AI',
    bestFor: 'Cepat punya video jadi tanpa menyusun sendiri',
    price: 'Plus $20/bln (75 kredit) · paket gratis ber-watermark',
    pros: [
      'AI agent merakit naskah, visual & voice-over sekaligus',
      '200+ model generatif untuk teks, gambar, video & suara',
      'Revisi lewat perintah teks ("ganti scene 2 jadi...")',
    ],
    cons: ['Sistem kredit cepat habis untuk proyek panjang', 'Hasil butuh dicek manual agar tidak generik'],
    badge: 'Terotomatis',
  },
  {
    name: 'Fliki',
    url: 'fliki.ai',
    tagline: 'Naskah → video dengan voice-over terbaik',
    bestFor: 'Kualitas suara AI & channel multi-bahasa',
    price: 'Standard ±$28/bln (180 menit) · gratis 5 menit/bln (720p, watermark)',
    pros: [
      '1.000+ suara AI dalam 80+ bahasa, termasuk Indonesia',
      'Model harga per menit — mudah dihitung & diprediksi',
      'Voice cloning tersedia di paket atas',
    ],
    cons: ['Visual dari stok, bukan gambar generatif', 'Editor timeline sederhana'],
    badge: 'Suara terbaik',
  },
  {
    name: 'Pictory',
    url: 'pictory.ai',
    tagline: 'Naskah/blog panjang → video stok otomatis',
    bestFor: 'Repurpose tulisan jadi video dengan cepat',
    price: 'Starter $29/bln · Professional $59/bln (600 menit export)',
    pros: [
      'Matching stok footage otomatis dari teks naskah',
      'Edit berbasis teks: hapus kata = video terpotong',
      'Jutaan clip stok (Getty Images opsional +$8/bln)',
    ],
    cons: ['Tidak ada generate gambar/video AI', 'Kurang cocok untuk gaya visual kreatif'],
    badge: 'Repurpose',
  },
]

export const ALT_TOOLS = [
  'CapCut — edit manual gratis',
  'ElevenLabs — TTS terbaik (ada API)',
  'AutoShorts.ai — short otomatis',
  'Zebracat — teks ke video',
  'OpusClip — potong video panjang',
]
