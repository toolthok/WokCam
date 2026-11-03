// Generator Katalog Teknik Editing Mobile v1.0 (DOCX, Rasa R1 + palet DM-1)
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat, SectionType,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableLayoutType, TableOfContents,
} = require("docx");
const fs = require("fs");
const D = require("./data_teknik.js");

// ── Palet DM-1 (Deep Cyan — tech/AI) ──────────────────────────────────────
const P = {
  bg: "162235", accent: "37DCF2",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", accentLine: "1B6B7A", innerLine: "C8DDE2", surface: "EDF3F5" },
  primary: "0A1628", body: "1A2B40", secondary: "5A6B7D",
};
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── Perhitungan judul cover (latin-aware) ─────────────────────────────────
function textWidth(s, pt) {
  let w = 0;
  for (const ch of s) w += ch === " " ? pt * 5 : (/[\u4e00-\u9fff]/.test(ch) ? pt * 20 : pt * 10.5);
  return w;
}
function splitLatinLines(title, maxW, pt) {
  const words = title.split(" ");
  const lines = []; let cur = "";
  for (const w of words) {
    const cand = cur ? cur + " " + w : w;
    if (textWidth(cand, pt) <= maxW || !cur) cur = cand;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  // Seimbangkan: hindari baris terakhir satu kata bila kata terakhir baris pertama bisa turun
  if (lines.length === 2 && lines[1].split(" ").length === 1 && lines[0].split(" ").length >= 3) {
    const w0 = lines[0].split(" ");
    const moved = w0.pop();
    if (textWidth(w0.join(" "), pt) <= maxW) { lines[0] = w0.join(" "); lines[1] = moved + " " + lines[1]; }
  }
  return lines;
}
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    lines = splitLatinLines(title, maxWidthTwips, titlePt);
    const fits = lines.every(l => textWidth(l, titlePt) <= maxWidthTwips);
    if (fits && lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) { lines = splitLatinLines(title, maxWidthTwips, minPt); titlePt = minPt; }
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop(); lines[lines.length - 1] += " " + last;
  }
  return { titlePt, titleLines: lines };
}
function calcCoverSpacing(p) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false,
    metaLineCount = 0, fixedHeight = 800, pageHeight = 16838 } = p;
  const SAFETY = 1200;
  const usable = pageHeight - SAFETY;
  const titleH = titleLineCount * (titlePt * 23 + 200);
  const subH = hasSubtitle ? (12 * 23 + 600) + 330 : 0; // +330: cadangan wrap subjudul 2 baris
  const engH = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaH = metaLineCount * (10 * 23 + 100);
  const content = titleH + subH + engH + metaH + fixedHeight + 3 * 300;
  const remaining = Math.max(usable - content, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(remaining * 0.45), rawBottom = Math.floor(remaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  return { topSpacing, bottomSpacing };
}

// ── Cover R1 (Pure Paragraph Left) ────────────────────────────────────────
function buildCoverR1(cfg) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(cfg.title, availableWidth, 40, 24);
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!cfg.subtitle, hasEnglishLabel: !!cfg.englishLabel,
    metaLineCount: (cfg.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const ch = [];
  ch.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (cfg.englishLabel) ch.push(new Paragraph({
    indent: { left: padL, right: padR }, spacing: { after: 500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
    children: [new TextRun({ text: cfg.englishLabel.split("").join("  "), size: 18, color: P.accent, font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 40 })],
  }));
  titleLines.forEach((line, i) => ch.push(new Paragraph({
    indent: { left: padL },
    spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
    children: [new TextRun({ text: line, size: titlePt * 2, bold: true, color: P.cover.titleColor, font: { ascii: "Arial", eastAsia: "SimHei" } })],
  })));
  if (cfg.subtitle) ch.push(new Paragraph({
    indent: { left: padL, right: padR }, spacing: { after: 800, line: 312 },
    children: [new TextRun({ text: cfg.subtitle, size: 24, color: P.cover.subtitleColor, font: { ascii: "Arial", eastAsia: "Microsoft YaHei" } })],
  }));
  for (const line of (cfg.metaLines || [])) ch.push(new Paragraph({
    indent: { left: padL + 200 }, spacing: { after: 80 }, border: { left: accentLeft },
    children: [new TextRun({ text: line, size: 24, color: P.cover.metaColor, font: { ascii: "Arial", eastAsia: "Microsoft YaHei" } })],
  }));
  ch.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  ch.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: cfg.footerLeft || "", size: 16, color: P.cover.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: cfg.footerRight || "", size: 16, color: P.cover.footerColor, font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders, children: ch })],
    })],
  })];
}

// ── Komponen isi ──────────────────────────────────────────────────────────
const FONT = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 30, color: P.primary, font: FONT })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 26, color: P.primary, font: FONT })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 220, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, color: P.primary, font: FONT })] });
}
function body(runsOrText, opts = {}) {
  const runs = typeof runsOrText === "string"
    ? [new TextRun({ text: runsOrText, size: 22, color: P.body, font: FONT })]
    : runsOrText;
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 312 }, ...opts, children: runs });
}
function r(text, o = {}) { return new TextRun({ text, size: 22, color: P.body, font: FONT, ...o }); }
function bold(text) { return r(text, { bold: true }); }
function bullet(text, runs) {
  return new Paragraph({
    bullet: { level: 0 }, alignment: AlignmentType.LEFT, spacing: { after: 60, line: 312 },
    children: runs || [new TextRun({ text, size: 22, color: P.body, font: FONT })],
  });
}
function caption(text) {
  return new Paragraph({ keepNext: true, spacing: { before: 160, after: 80, line: 312 },
    children: [new TextRun({ text, bold: true, size: 21, color: P.secondary, font: FONT })] });
}
function cellPara(text, o = {}) {
  return new Paragraph({ spacing: { line: 264 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, size: o.size || 18, bold: !!o.bold, color: o.color || P.body, font: FONT })] });
}
function makeTable(headers, rows, widths, opts = {}) {
  const cellSize = opts.cellSize || 18;
  const mk = (text, isHead, i) => new TableCell({
    children: [cellPara(text, isHead ? { bold: true, color: P.table.headerText, size: cellSize } : { size: cellSize })],
    shading: isHead ? { type: ShadingType.CLEAR, fill: P.table.headerBg } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    width: { size: widths[i], type: WidthType.PERCENTAGE },
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: P.table.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((t, i) => mk(t, true, i)) }),
      ...rows.map((row, ri) => new TableRow({
        cantSplit: true,
        children: row.map((t, i) => new TableCell({
          children: [cellPara(String(t), { size: cellSize })],
          shading: opts.zebra && ri % 2 === 0 ? { type: ShadingType.CLEAR, fill: P.table.surface } : undefined,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          width: { size: widths[i], type: WidthType.PERCENTAGE },
        })),
      })),
    ],
  });
}
function jsonBlock(lines) {
  return lines.map(l => new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: P.table.surface },
    spacing: { line: 240, lineRule: "atLeast", after: 0, before: 0 },
    indent: { left: 240, right: 240 },
    children: [new TextRun({ text: l, size: 16, color: "1E3A46", font: { ascii: "Courier New", eastAsia: "SimSun" } })],
  }));
}

// ── Isi dokumen ───────────────────────────────────────────────────────────
const ringkasan = [
  body([r("Dokumen ini adalah acuan tunggal (single source of truth) untuk kosakata teknik penyuntingan pada konsep aplikasi kamera Android dengan editing tanpa timeline. Ia menjawab tiga kebutuhan sekaligus: menjadi kamus teknik yang disepakati tim, menjadi kontrak data antara lapisan AI dan mesin preset, dan menjadi peta prioritas implementasi dari MVP hingga ekosistem preset.")]),
  body([r("Isinya mencakup "), bold("63 teknik"), r(" yang dikelompokkan ke enam kategori (potongan dan ritme, komposisi, teks dan grafik, efek visual, audio, serta lapisan cerdas), "), bold("enam keluarga gaya"), r(" lengkap dengan skenario pemakaian, "), bold("skema data DNA Referensi"), r(" dalam format JSON yang memetakan video referensi menjadi profil teknik siap eksekusi, aturan eksekusi mobile berbasis kelas berat efek, dan peta jalan lima fase.")]),
  body([r("Tiga keputusan desain paling penting dalam dokumen ini: pertama, setiap teknik punya identitas berkode (misalnya LAY-B01 untuk PiP Corner) sehingga AI, preset, dan antarmuka radial menu berbicara dengan kosakata yang sama; kedua, teknik dibagi kelas eksekusi A, B, dan C untuk memisahkan apa yang tampil di pratinjau real-time dan apa yang dihitung saat ekspor; ketiga, prinsip kerja AI adalah AI mendeteksi, preset mengeksekusi, user memutuskan, sehingga setiap saran selalu melewati konfirmasi berupa kartu berpratinjau.")]),
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 312 }, children: [
    r("Langkah berikutnya yang direkomendasikan: mengunci skema DNA Referensi versi 1.0 sebagai kontrak data, membangun MVP dengan 24 teknik berprioritas Inti, lalu menguji alur Amati, Tiru, Modifikasi dengan prototipe interaktif sebelum menulis kode Android."),
    new PageBreak(),
  ] }),
];

const ch1 = [
  h1("1. Pendahuluan"),
  h2("1.1 Tujuan dan Ruang Lingkup"),
  body([r("Katalog ini lahir dari satu masalah konkret: creator ingin menyunting video berkualitas storytelling, seperti menyusutkan tokoh ke sudut ketika narasi menyebut statistik lalu menampilkan grafik, tetapi aplikasi penyunting berbasis timeline terlalu rumit untuk kebutuhan tersebut. Konsep aplikasi yang dibahas dalam dokumen ini menggantikan timeline dengan interaksi pause dan menu radial bertingkat, serta menambahkan lapisan AI yang menyarankan momen dan gaya.")]),
  body([r("Ruang lingkup dokumen mencakup definisi dan parameter seluruh teknik penyuntingan yang realistis dieksekusi di perangkat Android, klasifikasi beban eksekusinya, keluarga gaya sebagai bundel pemakaian, dan skema data yang menyatukan analisis referensi dengan eksekusi preset. Dokumen ini tidak mencakup spesifikasi antarmuka per layar, arsitektur kode aplikasi, maupun keputusan backend; ketiganya mengikuti setelah katalog ini disetujui.")]),
  h2("1.2 Cara Membaca Entri Katalog"),
  body([r("Setiap entri teknik memiliki lima atribut: "), bold("kode"), r(" (identitas unik yang dipakai oleh skema data dan antarmuka), "), bold("nama teknik"), r(" (istilah industri berbahasa Inggris agar mudah dicari tutorialnya), "), bold("fungsi"), r(" (penjelasan berbahasa Indonesia), "), bold("parameter utama"), r(" (variabel yang dapat diatur user atau disarankan AI), serta "), bold("kelas dan prioritas"), r(". Kelas menunjukkan beban eksekusi dan dijelaskan pada Bab 6; prioritas Inti berarti teknik wajib hadir di MVP, sedangkan Lanjutan menyusul pada fase berikutnya.")]),
  body([r("Pembaca teknis disarankan membaca Bab 2 dan Bab 5 terlebih dahulu karena keduanya mendefinisikan kontrak data; pembaca produk dapat langsung ke Bab 3 untuk memahami gaya yang akan dijual sebagai preset, lalu kembali ke Bab 7 untuk urutan pembangunan.")]),
  h2("1.3 Istilah Kunci"),
  bullet("Anchor: satu efek yang menempel pada titik waktu tertentu, dengan layer, parameter, dan durasi. Seluruh editing pada konsep ini adalah pembuatan dan penyetelan anchor.", [bold("Anchor: "), r("satu efek yang menempel pada titik waktu tertentu, dengan layer, parameter, dan durasi. Seluruh editing pada konsep ini adalah pembuatan dan penyetelan anchor.")]),
  bullet("Preset: rangkaian anchor berparameter yang dijalankan sekali klik, misalnya preset Komposisi Bukti yang menggabungkan PiP Corner dan Chart Animation.", [bold("Preset: "), r("rangkaian anchor berparameter yang dijalankan sekali klik, misalnya preset Komposisi Bukti yang menggabungkan PiP Corner dan Chart Animation.")]),
  bullet("Layer: urutan tumpukan visual. Layer 1 untuk video dan komposisi tokoh, layer 2 untuk grafik, teks, dan efek.", [bold("Layer: "), r("urutan tumpukan visual. Layer 1 untuk video dan komposisi tokoh, layer 2 untuk grafik, teks, dan efek.")]),
  bullet("DNA Referensi: profil teknik terstruktur hasil analisis video referensi; bahan baku tahap Tiru.", [bold("DNA Referensi: "), r("profil teknik terstruktur hasil analisis video referensi; bahan baku tahap Tiru.")]),
  bullet("Beat: satuan struktur narasi (hook, konteks, bukti, payoff, CTA) yang memetakan tujuan tiap segmen waktu.", [bold("Beat: "), r("satuan struktur narasi (hook, konteks, bukti, payoff, CTA) yang memetakan tujuan tiap segmen waktu.")]),
];

const ch2 = [
  h1("2. Arsitektur Katalog"),
  h2("2.1 Tiga Lapis: Teknik, Preset, Gaya"),
  body([r("Katalog disusun tiga lapis agar masing-masing pemangku punya wilayah jelas. Lapis pertama adalah "), bold("teknik"), r(" (Bab 4): atom eksekusi yang dikerjakan mesin render. Lapis kedua adalah "), bold("preset"), r(": bundel beberapa teknik yang dipicu satu ketukan pada radial menu, misalnya preset Komposisi Bukti memanggil LAY-B01, TXT-C06, dan AUD-E03 sekaligus. Lapis ketiga adalah "), bold("keluarga gaya"), r(" (Bab 3): identitas menyeluruh yang menentukan preset mana yang disarankan, profil warna, dan tempo.")]),
  body([r("Konsekuensi arsitektur ini penting untuk pertumbuhan: teknik baru tidak mengubah aplikasi, hanya menambah kosakata; preset baru tidak menulis render, hanya mengomposisi teknik; gaya baru tidak menambah teknik, hanya memilih dan menyetel. Semua tumbuh lewat data, bukan lewat kode baru.")]),
  h2("2.2 Tata Bahasa Naratif"),
  body([r("Penyuntingan storytelling mengikuti tata bahasa yang dapat dikodekan. Lima beat di bawah ini menjadi kerangka pemetaan struktur pada skema DNA Referensi dan menjadi dasar keluarga preset naratif. AI memakai tata bahasa ini untuk mengenali ke mana sebuah momen sedang berjalan, bukan menebak secara bebas.")]),
  caption("Tabel 1: Tata bahasa naratif lima beat dan teknik umumnya"),
  makeTable(["Beat", "Peran", "Pemicu khas", "Teknik umum"], D.TATA_BAHASA, [12, 38, 24, 26], { zebra: true }),
  body([r("Pemetaan ini bersifat pemandu, bukan paksaan: satu video boleh melewati beat yang sama dua kali, dan beat bukti boleh berisi sub-beat. Yang penting adalah setiap anchor punya atribut beat_id sehingga tahap Tiru dapat mencari padanan fungsional di video user, bukan sekadar menyalin posisi waktu.")], { spacing: { before: 120, after: 120, line: 312 } }),
  h2("2.3 Konvensi Penamaan dan Versi"),
  body([r("Kode teknik memakai pola KATEGORI-HURUFNOMOR, misalnya LAY-B01: huruf pertama kategori, huruf kedua urutan kategori (A sampai F), dan nomor urut entri. Kode bersifat permanen; teknik yang diubah parameternya tetap memakai kode lama dan mencatat versi di parameternya. Skema DNA Referensi membawa schema_version sehingga file analisis lama tetap terbaca ketika katalog bertambah. Teknik yang dihentikan tidak dihapus, melainkan ditandai usang agar file lama tetap valid.")]),
];

const ch3intro = [
  h1("3. Keluarga Gaya (Style Families)"),
  body([r("Keluarga gaya adalah jawaban atas pertanyaan paling praktis dari user: saya tidak tahu teknik apa yang harus dipilih. Alih-alih menyodorkan 63 pilihan, aplikasi menyodorkan enam identitas; keluarga gaya lalu menentukan preset mana yang disarankan dan bagaimana parameter default diisi. Enam keluarga berikut dipilih untuk menutupi spektrum konten terluas dengan tumpang tindih seminimal mungkin.")]),
];
const ch3fam = [];
D.GAYA.forEach((g, i) => {
  ch3fam.push(h2("3." + (i + 1) + " " + g.nama));
  ch3fam.push(body(g.karakter));
  ch3fam.push(body([bold("Teknik andalan: "), r(g.andalan.join(", ") + ".")], { spacing: { after: 80, line: 312 } }));
  ch3fam.push(body([bold("Skenario pemakaian: "), r(g.skenario)]));
});

const ch4 = [
  h1("4. Katalog Teknik"),
  body([r("Enam kategori berikut memuat 63 teknik dengan prioritas Inti sebanyak 29 dan Lanjutan sebanyak 34. Klasifikasi kelas (A, B, C) mengikuti definisi pada Bab 6; ringkasnya, kelas A tampil pada pratinjau real-time, kelas B dihitung penuh saat ekspor, dan kelas C membutuhkan pipeline berat atau layanan cloud. Setiap tabel memuat kode, nama, fungsi, parameter utama, serta gabungan kelas dan prioritas.")]),
];
D.KATEGORI.forEach((k, i) => {
  ch4.push(h2("4." + (i + 1) + " " + k.nama + " (" + k.kode + ")"));
  ch4.push(body(k.intro));
  ch4.push(caption("Tabel " + (i + 2) + ": Kategori " + k.nama + " (" + k.kode + ") — " + k.rows.length + " teknik"));
  ch4.push(makeTable(
    ["Kode", "Teknik", "Fungsi", "Parameter utama", "Kelas"],
    k.rows.map(row => [row[0], row[1], row[2], row[3], row[4] + " \u00B7 " + row[5]]),
    [11, 16, 40, 21, 12]
  ));
  ch4.push(body([r("Kolom Kelas memuat kelas eksekusi dan prioritas; entri bertanda Inti adalah wajib MVP.")], { spacing: { before: 80, after: 160, line: 312 } }));
});

const ch5 = [
  h1("5. Skema Data DNA Referensi"),
  h2("5.1 Prinsip Skema"),
  body([r("DNA Referensi adalah keluaran tahap Amati dan bahan baku tahap Tiru. Prinsipnya: AI tidak boleh menghasilkan instruksi bebas; ia hanya memetakan apa yang dilihatnya ke kosakata katalog. Karena itu nilai pada field technique selalu berupa kode teknik yang terdaftar, dan hal yang tidak dikenali masuk ke unknown_techniques untuk dievaluasi menjadi entri katalog baru. Skema yang sama dipakai tiga kali: dibaca mesin render saat ekspor, dibaca antarmuka untuk menggambar kartu saran, dan dibaca pemetaan struktur saat mengarahkan DNA ke video user.")]),
  h2("5.2 Struktur JSON"),
  body([r("Struktur penuh skema versi 1.0 adalah sebagai berikut. Contoh pemakaian nyata tersedia pada Lampiran B.")]),
  ...jsonBlock(D.SKEMA_JSON),
  h2("5.3 Penjelasan Field"),
  body([r("Tabel berikut merinci field utama beserta sifat wajibnya. Field yang tidak wajib boleh dihilangkan dari file bila nilainya tidak relevan, misalnya audio_map untuk referensi tanpa musik.")]),
  caption("Tabel 8: Field skema DNA Referensi"),
  makeTable(["Field", "Tipe", "Wajib", "Deskripsi"], D.SKEMA_FIELD, [18, 9, 9, 64], { zebra: true }),
  body([r("Satu aturan validasi penting: anchor dengan confidence di bawah ambang (disarankan 0,75) wajib menampilkan pratinjau dua detik sebelum tombol konfirmasi aktif. Aturan ini menjaga kepercayaan user terhadap seluruh sistem, karena satu saran yang mengecewakan merusak lebih banyak kepercayaan daripada sepuluh saran yang berhasil.")], { spacing: { before: 120, after: 120, line: 312 } }),
  h2("5.4 Pemetaan ke Pipeline Amati, Tiru, Modifikasi"),
  body([r("Skema dirancang agar tiap tahap pipeline hanya membaca field yang ia butuhkan, sehingga tahap dapat diuji dan diganti secara terpisah.")]),
  caption("Tabel 9: Pemetaan field DNA ke tahap pipeline"),
  makeTable(
    ["Tahap", "Field DNA yang dibaca", "Keluaran untuk user"],
    [
      ["Amati", "reference, style, beats, anchors (analisis), unknown_techniques", "Kartu profil: struktur beat, daftar teknik terdeteksi, tempo, dan tanda teknik belum dikenali yang bisa user terima atau tolak"],
      ["Tiru", "beats (pemetaan fungsional), anchors.trigger, audio_map", "Kartu anchor di timeline user: posisi, teknik, aset, dan pratinjau dua detik per kartu"],
      ["Modifikasi", "anchors.params, style.family, style.palette_mood", "Varian satu ketukan: tukar gaya, tukar aset dari pustaka, ubah intensitas lewat radial menu"]
    ],
    [12, 40, 48]
  ),
  body([r("Dengan pemetaan ini, mengganti model AI di belakang tahap Amati tidak mengubah apa pun pada tahap lain, selama keluarannya tetap mematuhi skema. Inilah alasan skema disebut kontrak data, bukan sekadar format file.")], { spacing: { before: 120, after: 120, line: 312 } }),
];

const ch6 = [
  h1("6. Aturan Eksekusi dan Batasan Mobile"),
  h2("6.1 Kelas Eksekusi A, B, C"),
  body([r("Setiap teknik diberi satu kelas eksekusi yang menentukan kapan ia dihitung. Pembagian ini menjaga dua hal sekaligus: pengalaman pratinjau yang mulus di perangkat menengah, dan hasil ekspor yang selalu kualitas penuh karena seluruh anchor dirender ulang saat ekspor.")]),
  caption("Tabel 10: Definisi kelas eksekusi"),
  makeTable(
    ["Kelas", "Arti", "Contoh"],
    [
      ["A", "Tampil langsung pada pratinjau real-time; beban GPU ringan; parameternya terbatas agar tetap 30 fps.", "FX-D01 LUT Filter, CUT-A01 Jump Cut, AUD-E01 Music Duck"],
      ["B", "Dihitung penuh saat ekspor; pratinjau memakai aproksimasi ringan (misalnya bingkai statis untuk grafik).", "LAY-B01 PiP Corner, TXT-C06 Chart Animation, CUT-A06 Speed Ramp"],
      ["C", "Membutuhkan pipeline berat atau layanan cloud; hasilnya datang sebagai saran yang dikonfirmasi, bukan efek real-time.", "AI-F03 Semantic B-Roll, AUD-E06 TTS Voiceover, LAY-B07 Parallax 2D"]
    ],
    [8, 52, 40]
  ),
  body([r("Kelas bersifat atribut teknik, bukan batas perangkat permanen: seiring optimasi, teknik bisa naik kelas dari B ke A tanpa mengubah kode atau skema, cukup memperbarui atribut exec_class pada entri katalog.")], { spacing: { before: 120, after: 120, line: 312 } }),
  h2("6.2 Aturan Eksekusi Wajib"),
  body([r("Delapan aturan berikut mengikat semua fitur yang menyentuh anchor. Tujuannya konsisten: hasil dapat diprediksi, pratinjau tidak menyesatkan, dan perangkat menengah tetap nyaman dipakai.")]),
  caption("Tabel 11: Aturan eksekusi dan alasannya"),
  makeTable(["Aturan", "Penjelasan"], D.ATURAN_EKSEKUSI, [26, 74], { zebra: true }),
  h2("6.3 Etika Peniruan dan Batas Pipeline Referensi"),
  body([r("Pipeline referensi menyalin pola, bukan konten. Teknik penyuntingan tidak berhak cipta, sehingga mengenali bahwa sebuah video memakai ritme beat cut atau komposisi PiP adalah hal yang sah. Namun aset, teks, grafik, dan potongan konten milik pencipta referensi tidak boleh diambil. Karena itu field asset pada skema hanya menerima tipe template (aset bawaan aplikasi) atau library (aset milik user); tidak ada jalur untuk menyalin aset dari video referensi, dan analisis tidak menyimpan bingkai video referensi lebih lama dari proses analisis itu sendiri.")]),
  body([r("Aturan kedua: keluaran analisis selalu berupa profil teknik, bukan video hasil olah referensi. Aplikasi tidak pernah mengekspor turunan langsung dari video orang lain; ia hanya mengekspor video milik user yang disunting memakai pola yang dipelajari. Dengan dua aturan ini, fitur referensi memberi nilai belajar tanpa menjadi mesin plagiarisme.")]),
];

const ch7 = [
  h1("7. Peta Jalan Implementasi"),
  body([r("Urutan pembangunan mengikuti prinsip nilai lebih dulu: setiap fase harus menghasilkan aplikasi yang bisa dipakai sehari-hari meskipun fase berikutnya belum ada. Fase 0 dan 1 tidak memerlukan AI sama sekali; aplikasi sudah mengalahkan alur manual pada kecepatan untuk kasus komposisi standar bahkan tanpa lapisan cerdas.")]),
  caption("Tabel 12: Lima fase implementasi"),
  makeTable(["Fase", "Isi utama", "Teknik yang diaktifkan", "Keluaran"], D.ROADMAP, [16, 38, 24, 22], { zebra: true }),
  body([r("Rekomendasi urutan di dalam fase 1: mulai dari teknik Inti kelas A (terasa langsung di pratinjau), lalu PiP Corner dan Chart Animation yang menjadi tanda tangan konsep, lalu pemangkas jeda Silence Trim yang memberi peningkatan kualitas paling terasa dengan usaha paling kecil.")], { spacing: { before: 120, after: 120, line: 312 } }),
  body([r("Tiga risiko yang harus dipantau sejak fase 1. Pertama, presisi pause: wajib menyediakan scrub halus per frame sebelum radial menu muncul, karena pause yang meleset membuat seluruh saran AI terasa salah walau benar. Kedua, semantik akhir efek: gunakan aturan default efek aktif sampai user menandai berhenti atau video berakhir, lalu evaluasi dari data pemakaian. Ketiga, ekspektasi chat: permukaan AI dipresentasikan sebagai bar saran yang dibalas satu ketukan, bukan layar percakapan, agar user tidak mengharapkan keajaiban tak terbatas.")]),
  body([r("Keputusan yang diminta dari pembaca dokumen ini: mengunci skema DNA Referensi v1.0 (Bab 5) sebagai kontrak data, menyetujui daftar 24 teknik Inti sebagai lingkup MVP, dan menetapkan prototipe alur Amati, Tiru, Modifikasi sebagai uji rasa sebelum pengembangan Android dimulai.")]),
];

const lampA = [
  h1("Lampiran A: Format Entri Teknik Baru"),
  body([r("Katalog adalah dokumen hidup: tiap kali pipeline referensi menandai teknik belum dikenali, tim mengevaluasi apakah ia layak menjadi entri baru. Entri baru wajib mengikuti format berikut agar otomatis terbaca oleh skema data dan antarmuka.")]),
  ...jsonBlock([
    "{",
    "  \"id\": \"LAY-B10\",",
    "  \"name\": \"Nama Teknik\",",
    "  \"category\": \"LAY\",",
    "  \"exec_class\": \"A | B | C\",",
    "  \"priority\": \"inti | lanjutan\",",
    "  \"params_schema\": { \"position\": \"top-right\", \"scale\": 0.35 },",
    "  \"default_duration_sec\": 3.0,",
    "  \"requires\": [ \"LAY-B03\" ],",
    "  \"conflicts\": [ ],",
    "  \"render\": { \"engine\": \"gl-shader\", \"cost\": \"sedang\" }",
    "}"
  ]),
  body([r("Field requires memuat kode teknik yang harus aktif terlebih dahulu (contoh: Background Swap membutuhkan Background Removal), sedangkan conflicts memuat kode yang tidak boleh aktif pada layer sama dalam rentang waktu beririsan. Alur pengembangannya: teknik terdeteksi sebagai unknown, tim membuat entri mengikuti format di atas, mesin preset mendefinisikan rendernya, lalu entri diuji pada kartu saran sebelum diberi prioritas. Katalog versi dokumen ini diperbarui setiap kali lima entri baru terkumpul.")], { spacing: { before: 120, after: 120, line: 312 } }),
];

const lampB = [
  h1("Lampiran B: Contoh DNA Referensi (Ilustratif)"),
  body([r("Contoh berikut adalah hasil analisis untuk video fiktif berdurasi 45 detik berformat vertikal, disusun murni untuk mengilustrasikan bentuk file akhir; angka dan judul di dalamnya tidak mengacu pada video nyata. Perhatikan tiga hal: setiap anchor menunjuk kode katalog, anchor a2 memakai trigger kata kunci agar dapat dipetakan ulang ke video user, dan satu teknik yang belum dikenali masuk ke unknown_techniques sebagai usulan varian FX-D12.")]),
  ...jsonBlock(D.CONTOH_JSON),
  body([r("Saat user memilih video ini sebagai referensi, tahap Tiru mencari padanan fungsional: anchor a1 (Title Pop) dipetakan ke detik-detik awal video user, a2 dan a3 menunggu narasi user menyentuh tema angka atau kata yang terdaftar di kamus trigger, dan a5 dipasang di akhir. Kartu saran menampilkan kelima anchor beserta pratinjau; user mengonfirmasi, menggeser, atau menolak masing-masing.")], { spacing: { before: 120, after: 120, line: 312 } }),
];

// ── Footer & header ───────────────────────────────────────────────────────
function footerRoman() {
  return new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888887", font: FONT })] })] });
}
function footerArabic() {
  return new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT })] })] });
}
function pageHeader() {
  return new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Katalog Teknik Editing Mobile \u00B7 v1.0", size: 18, color: "808080", font: FONT })] })] });
}

// ── Perakitan dokumen ─────────────────────────────────────────────────────
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const frontMatter = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 300 },
    children: [new TextRun({ text: "Ringkasan Eksekutif", bold: true, size: 32, color: P.primary, font: FONT })] }),
  ...ringkasan,
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 300 },
    children: [new TextRun({ text: "Daftar Isi", bold: true, size: 32, color: P.primary, font: FONT })] }),
  new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ spacing: { before: 200 },
    children: [new TextRun({ text: "Catatan: Daftar isi dibuat dengan field kode. Setelah dokumen diedit, klik kanan daftar isi lalu pilih Update Field untuk memperbarui nomor halaman.", italics: true, size: 18, color: "888888", font: FONT })] }),
];

const doc = new Document({
  creator: "Tim Produk",
  title: "Katalog Teknik Editing Mobile v1.0",
  styles: {
    default: {
      document: { run: { font: FONT, size: 22, color: P.body }, paragraph: { spacing: { line: 312 } } },
      heading1: { run: { font: FONT, size: 30, bold: true, color: P.primary }, paragraph: { spacing: { before: 360, after: 160, line: 312 }, outlineLevel: 0 } },
      heading2: { run: { font: FONT, size: 26, bold: true, color: P.primary }, paragraph: { spacing: { before: 260, after: 120, line: 312 }, outlineLevel: 1 } },
      heading3: { run: { font: FONT, size: 24, bold: true, color: P.primary }, paragraph: { spacing: { before: 220, after: 100, line: 312 }, outlineLevel: 2 } },
    },
  },
  sections: [
    { // Sampul — margin 0, tanpa nomor halaman
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1({
        title: "Katalog Teknik Editing Mobile",
        subtitle: "Peta teknik, keluarga gaya, dan skema data DNA Referensi untuk pipeline Amati \u2013 Tiru \u2013 Modifikasi",
        englishLabel: "TECHNIQUE CATALOG",
        metaLines: [
          "Proyek: App kamera Android dengan editing tanpa timeline",
          "Fungsi dokumen: Kontrak data internal dan referensi desain",
          "Versi: 1.0 (draf untuk diskusi produk)",
          "Tanggal: 3 November 2026",
        ],
        footerLeft: "Dokumen Desain Internal",
        footerRight: "Katalog Teknik \u00B7 v1.0 \u00B7 2026",
      }),
    },
    { // Bagian depan — ringkasan + daftar isi, angka Romawi
      properties: { type: SectionType.NEXT_PAGE, page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } } },
      footers: { default: footerRoman() },
      children: frontMatter,
    },
    { // Isi — angka Arab mulai 1
      properties: { type: SectionType.NEXT_PAGE, page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: pageHeader() },
      footers: { default: footerArabic() },
      children: [...ch1, ...ch2, ...ch3intro, ...ch3fam, ...ch4, ...ch5, ...ch6, ...ch7, ...lampA, ...lampB],
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/download/Katalog_Teknik_Editing_Mobile_v1.docx", buf);
  console.log("OK: Katalog_Teknik_Editing_Mobile_v1.docx (" + Math.round(buf.length / 1024) + " KB)");
});
