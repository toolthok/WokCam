/* Uji parser naskah wokCam — dijalankan: bun scripts/test-parser.ts */
import { parseNaskah } from "../src/lib/naskah-parser";

let gagal = 0;
function cek(nama: string, kondisi: boolean, detail = "") {
  if (kondisi) console.log(`  ✓ ${nama}`);
  else { gagal++; console.error(`  ✗ ${nama}  →  ${detail}`); }
}
function judul(t: string) { console.log(`\n${t}`); }

/* ─────────────────────────────────────────────────────────────
   KASUS 1 — Regresi nyata: hasil ChatGPT user (12 scene, semua field
   digabung dalam SATU baris setelah NASKAH:). Persis seperti laporan.
   ───────────────────────────────────────────────────────────── */
const BARIS = [
  "Bayangin kamu bisa bikin serial drama pendek pakai bantuan AI. Mulai dari ide cerita sampai jadi video. Nah, ada satu repository GitHub yang menarik untuk kamu kenali! TEKS: Bikin Drama Pendek Pakai AI? DURASI: 5 MOOD: misterius LATAR: kreator bekerja di depan laptop dengan layar AI | EN: creator working on laptop with AI interface",
  "Namanya UnderleveledBuilder slash awesome-short-drama-skills. Ini adalah kumpulan skill AI yang dirancang untuk membantu proses produksi drama pendek dan komik drama berbasis AI. TEKS: Kenalan dengan Awesome Short Drama Skills DURASI: 5 MOOD: energik LATAR: tampilan repository GitHub di layar komputer | EN: GitHub repository on computer screen",
  "Repository ini bukan aplikasi pembuat video biasa. Isinya kumpulan kemampuan tambahan untuk AI Agent, yang bisa membantu berbagai tahapan produksi drama. TEKS: Bukan Aplikasi, Tapi Kumpulan AI Skills DURASI: 5 MOOD: fokus LATAR: ilustrasi AI agent dan kumpulan modul digital | EN: AI agent and digital skill modules illustration",
  "Ada banyak hal yang bisa dibantu. Mulai dari adaptasi novel, pengembangan karakter, penulisan naskah, sampai penyusunan storyboard. TEKS: Dari Novel Sampai Storyboard DURASI: 5 MOOD: energik LATAR: proses kreatif penulisan novel menjadi storyboard | EN: novel to screenplay and storyboard creative process",
  "Bahkan, tersedia skill untuk membuat prompt visual dan video. Jadi, AI bisa diarahkan menghasilkan materi yang lebih terstruktur untuk proses produksi. TEKS: Prompt Visual dan Video Lebih Terarah DURASI: 5 MOOD: ceria LATAR: ilustrasi storyboard berubah menjadi adegan video sinematik | EN: storyboard transforming into cinematic video scene",
  "Menariknya, repository ini mengumpulkan 83 proyek skill dan 16 platform open source terkait. Semuanya disusun supaya pengguna lebih mudah menemukan alat sesuai kebutuhan. TEKS: 83 Skills, 16 Platform Open Source DURASI: 5 MOOD: energik LATAR: visual angka statistik dan banyak kartu proyek digital | EN: digital project cards and statistics visualization",
  "Kamu juga bisa mencari skill berdasarkan tahapan produksi. Misalnya, fokus ke penulisan naskah saja, atau mencari bantuan untuk storyboard dan pembuatan prompt video. TEKS: Pilih Skill Sesuai Kebutuhan DURASI: 5 MOOD: fokus LATAR: kategori produksi film pada dashboard digital | EN: film production categories on digital dashboard",
  "Beberapa skill juga mendukung berbagai AI Agent. Contohnya Claude Code, Codex, dan OpenClaw, selama format serta integrasinya kompatibel. TEKS: Mendukung Berbagai AI Agent DURASI: 5 MOOD: ceria LATAR: beberapa logo dan antarmuka AI agent di monitor | EN: multiple AI agent interfaces on computer monitor",
  "Sebagian besar proyek menggunakan format SKILL dot MD. File ini berisi instruksi yang membantu AI memahami cara menjalankan tugas tertentu. TEKS: Kuncinya Ada di SKILL.md DURASI: 5 MOOD: fokus LATAR: tampilan file markdown dan potongan instruksi pemrograman | EN: markdown skill file and coding instructions on screen",
  "Mau mencobanya? Salah satu cara instalasinya menggunakan perintah npx skills add, diikuti nama repository. Pastikan membaca petunjuk dan memeriksa isi skill sebelum memasangnya. TEKS: Instalasi Lewat npx skills add DURASI: 5 MOOD: energik LATAR: terminal komputer menampilkan perintah instalasi | EN: computer terminal displaying installation command",
  "Tapi ingat, masuk daftar bukan berarti semua skill sudah teruji menghasilkan video sempurna. Periksa dokumentasi, kompatibilitas, lisensi, dan script sebelum menggunakannya. TEKS: Tetap Periksa Sebelum Menggunakan! DURASI: 5 MOOD: tenang LATAR: programmer memeriksa dokumentasi dan kode di laptop | EN: programmer reviewing documentation and source code on laptop",
  "Intinya, repository ini bisa jadi titik awal untuk menjelajahi dunia produksi drama berbasis AI. Kalau menurutmu bermanfaat, simpan video ini dan bagikan ke temanmu yang tertarik dengan AI! TEKS: Simpan dan Bagikan ke Temanmu! DURASI: 5 MOOD: ceria LATAR: smartphone menampilkan tombol simpan dan bagikan media sosial | EN: smartphone showing save and share social media buttons",
];
const inputUser = BARIS.map((b, i) => `=== SCENE ${i + 1} ===\nNASKAH: ${b}`).join("\n\n");

judul("Kasus 1 — format inline satu baris (kasus nyata user, 12 scene)");
const h1 = parseNaskah(inputUser, 60);
cek("12 scene terdeteksi", h1.scenes.length === 12, `dapat ${h1.scenes.length}`);
cek("tidak ada errorGlobal", !h1.errorGlobal, h1.errorGlobal ?? "");

const s1 = h1.scenes[0];
cek("S1 naskah bersih", s1.naskah.startsWith("Bayangin") && s1.naskah.endsWith("kenali!"), `"${s1.naskah.slice(-40)}"`);
cek("S1 tanpa sisa 'TEKS:'", !s1.naskah.includes("TEKS:"), s1.naskah);
cek("S1 teks tampilan", s1.teks === "Bikin Drama Pendek Pakai AI?", `"${s1.teks}"`);
cek("S1 durasi = 5 (bukan 15!)", s1.durasi === 5, String(s1.durasi));
cek("S1 mood = misterius (bukan fokus!)", s1.mood === "misterius", s1.mood);
cek("S1 latar_id terisi", s1.latarId === "kreator bekerja di depan laptop dengan layar AI", s1.latarId);
cek("S1 latar_en terisi", s1.latarEn === "creator working on laptop with AI interface", s1.latarEn);

const moodEkspek = ["misterius","energik","fokus","energik","ceria","energik","fokus","ceria","fokus","energik","tenang","ceria"];
cek("mood semua scene sesuai ChatGPT", h1.scenes.every((sc, i) => sc.mood === moodEkspek[i]),
  h1.scenes.map(sc => sc.mood).join(","));
cek("durasi semua scene = 5", h1.scenes.every(sc => sc.durasi === 5), h1.scenes.map(sc => sc.durasi).join(","));
const total = h1.scenes.reduce((s, sc) => s + sc.durasi, 0);
cek("total 60 dtk = target (tanpa peringatan meleset)", total === 60 && !h1.scenes.some(sc => sc.catatan.some(c => c.teks.includes("meleset"))), String(total));
cek("S4 'penulisan naskah,' tidak memutus naskah", h1.scenes[3].naskah.includes("penulisan naskah, sampai penyusunan storyboard"), `"${h1.scenes[3].naskah.slice(-60)}"`);
cek("S4 latar_id terisi", h1.scenes[3].latarId === "proses kreatif penulisan novel menjadi storyboard", h1.scenes[3].latarId);
cek("S12 teks CTA", h1.scenes[11].teks === "Simpan dan Bagikan ke Temanmu!", h1.scenes[11].teks);

/* ─────────────────────────────────────────────────────────────
   KASUS 2 — format klasik multiline (sesuai template)
   ───────────────────────────────────────────────────────────── */
judul("Kasus 2 — format klasik multiline");
const klasik = `=== SCENE 1 ===
NASKAH: Langit malam penuh bintang.
TEKS: Langit Malam
DURASI: 4
MOOD: tenang
LATAR: langit malam berbintang | EN: starry night sky

=== SCENE 2 ===
NASKAH: Ombak menggulung di tepi karang.
TEKS: Ombak Karang
DURASI: 6
MOOD: dramatis
LATAR: ombak menghantam karang | EN: waves crashing on rocks`;
const h2 = parseNaskah(klasik, 10);
cek("2 scene", h2.scenes.length === 2, `dapat ${h2.scenes.length}`);
cek("S1 durasi 4, mood tenang", h2.scenes[0].durasi === 4 && h2.scenes[0].mood === "tenang", `${h2.scenes[0].durasi}/${h2.scenes[0].mood}`);
cek("S2 latar_en", h2.scenes[1].latarEn === "waves crashing on rocks", h2.scenes[1].latarEn);
cek("tanpa catatan peringatan", !h2.scenes.some(sc => sc.catatan.some(c => c.tipe === "peringatan")),
  JSON.stringify(h2.scenes.flatMap(sc => sc.catatan)));

/* ─────────────────────────────────────────────────────────────
   KASUS 3 — markdown: fence ``` dan **bold**
   ───────────────────────────────────────────────────────────── */
judul("Kasus 3 — markdown fence + label bold");
const markdown = `\`\`\`text
**SCENE 1**
**NASKAH:** Awan bergerak perlahan di pegunungan. **TEKS:** Awan Pegunungan **DURASI:** 7 **MOOD:** tenang **LATAR:** awan pegunungan | EN: mountain clouds
\`\`\``;
const h3 = parseNaskah(markdown, null);
cek("1 scene", h3.scenes.length === 1, `dapat ${h3.scenes.length}${h3.errorGlobal ? " · " + h3.errorGlobal : ""}`);
cek("tanpa sisa **", !h3.scenes[0].naskah.includes("**") && !h3.scenes[0].teks.includes("**"), h3.scenes[0].naskah);
cek("durasi 7", h3.scenes[0].durasi === 7, String(h3.scenes[0].durasi));
cek("mood tenang", h3.scenes[0].mood === "tenang", h3.scenes[0].mood);
cek("latar_en = mountain clouds", h3.scenes[0].latarEn === "mountain clouds", h3.scenes[0].latarEn);

/* ─────────────────────────────────────────────────────────────
   KASUS 4 — tanpa penanda scene sama sekali (fallback NASKAH)
   ───────────────────────────────────────────────────────────── */
judul("Kasus 4 — tanpa penanda SCENE (fallback)");
const tanpaMarker = `NASKAH: Scene pembuka. TEKS: Pembuka DURASI: 3 MOOD: ceria LATAR: taman bunga | EN: flower garden
NASKAH: Scene kedua. TEKS: Kedua DURASI: 4 MOOD: fokus LATAR: meja kerja | EN: work desk`;
const h4 = parseNaskah(tanpaMarker, null);
cek("2 scene via fallback", h4.scenes.length === 2, `dapat ${h4.scenes.length}${h4.errorGlobal ? " · " + h4.errorGlobal : ""}`);
cek("S2 durasi 4", h4.scenes[1]?.durasi === 4, String(h4.scenes[1]?.durasi));
cek("S2 mood fokus", h4.scenes[1]?.mood === "fokus", h4.scenes[1]?.mood);

/* ─────────────────────────────────────────────────────────────
   KASUS 5 — DURASI: desimal, satuan, di luar rentang, kosong
   ───────────────────────────────────────────────────────────── */
judul("Kasus 5 — variasi DURASI");
const d1 = parseNaskah("=== SCENE 1 ===\nNASKAH: Uji durasi desimal. TEKS: A DURASI: 4,5 MOOD: ceria LATAR: x | EN: y", null);
cek("DURASI 4,5 → 4.5", d1.scenes[0].durasi === 4.5, String(d1.scenes[0].durasi));
const d2 = parseNaskah("=== SCENE 1 ===\nNASKAH: Uji satuan. TEKS: A DURASI: 5 detik MOOD: ceria LATAR: x | EN: y", null);
cek("'5 detik' → 5", d2.scenes[0].durasi === 5, String(d2.scenes[0].durasi));
const d3 = parseNaskah("=== SCENE 1 ===\nNASKAH: Uji clamp. TEKS: A DURASI: 20 MOOD: ceria LATAR: x | EN: y", null);
cek("DURASI 20 → clamp 15 + peringatan", d3.scenes[0].durasi === 15 && d3.scenes[0].catatan.some(c => c.tipe === "peringatan" && c.teks.includes("dipangkas")), String(d3.scenes[0].durasi));
const d4 = parseNaskah("=== SCENE 1 ===\nNASKAH: Ini kalimat panjang untuk menguji estimasi otomatis ketika durasi tidak ada sama sekali. TEKS: A MOOD: ceria LATAR: x | EN: y", null);
cek("DURASI hilang → estimasi", d4.scenes[0].durasi > 0 && d4.scenes[0].catatan.some(c => c.teks.includes("diperkirakan")), `${d4.scenes[0].durasi}`);

/* ─────────────────────────────────────────────────────────────
   KASUS 6 — MOOD asing / kapital / kosong, TEKS kosong
   ───────────────────────────────────────────────────────────── */
judul("Kasus 6 — normalisasi MOOD & fallback TEKS");
const m1 = parseNaskah("=== SCENE 1 ===\nNASKAH: Uji mood. TEKS: A DURASI: 4 MOOD: Misterius. LATAR: x | EN: y", null);
cek("'Misterius.' → misterius", m1.scenes[0].mood === "misterius", m1.scenes[0].mood);
const m2 = parseNaskah("=== SCENE 1 ===\nNASKAH: Uji mood asing. TEKS: A DURASI: 4 MOOD: bahaya LATAR: x | EN: y", null);
cek("mood asing → fokus + peringatan", m2.scenes[0].mood === "fokus" && m2.scenes[0].catatan.some(c => c.teks.includes("tidak dikenal")), m2.scenes[0].mood);
const m3 = parseNaskah("=== SCENE 1 ===\nNASKAH: Uji teks kosong dan mood kosong. TEKS: DURASI: 4 MOOD: LATAR: x | EN: y", null);
cek("TEKS kosong → pakai NASKAH", m3.scenes[0].teks === m3.scenes[0].naskah, m3.scenes[0].teks);
cek("MOOD kosong → fokus", m3.scenes[0].mood === "fokus", m3.scenes[0].mood);

/* ─────────────────────────────────────────────────────────────
   KASUS 7 — input kosong & format sampah
   ───────────────────────────────────────────────────────────── */
judul("Kasus 7 — input tidak sah");
cek("kosong → errorGlobal", parseNaskah("   ", null).errorGlobal !== undefined);
cek("teks acak → errorGlobal", parseNaskah("halo dunia ini bukan format", null).errorGlobal !== undefined);

/* ───────────────────────────────────────────────────────────── */
console.log(gagal === 0 ? "\n Semua uji LULUS ✓" : `\n ${gagal} uji GAGAL ✗`);
process.exitCode = gagal === 0 ? 0 : 1;
