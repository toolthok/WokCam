/* ══════════ Deteksi Video → Koleksi (tanpa AI) — fungsi MURNI ══════════
 *
 * Alur: video referensi → sampler browser (video-sampler.ts) mengambil cuplikan frame kecil
 * 64×36 → modul ini membaca "tanda" tiap frame → mendeteksi:
 *   • TRANSISI  : none (potong), crossfade, blur, wipe+arah, slide+arah, zoom
 *   • LOOP      : pan_kiri/kanan/atas/bawah, zoom_in/zoom_out (gerak latar saat scene diam)
 *   • ANIMASI IN/OUT teks : fade, slide+arah, zoom/shrink, wipe+arah, kata (kata-demi-kata)
 *   • GAYA TEKS : warna teks, warna & tebal outline, posisi, ukuran (dari frame tengah scene)
 * lalu menyusunnya jadi entri bersih bentuk Koleksi v1 (divalidasi lagi oleh imporKeKoleksi).
 *
 * Semua heuristik jujur: hasil = USULAN yang ditampilkan dengan centang — user memilih mana yang
 * disimpan. Tidak ada dependensi DOM → bisa diuji (bun/node) dan diport ke Kotlin.
 *
 * Konvensi arah (sama dengan preset-preview.tsx):
 *   slide transisi/loop pan : arah = ke mana ISI GAMBAR bergerak
 *   wipe                    : arah = ke mana TEPI pembersih berjalan
 *   animasi masuk slide     : arah = sisi asal elemen
 */

export const LEBAR = 64;
export const TINGGI = 36;
const SEL_W = 16, SEL_H = 9;

/* ── Tipe ── */

export type Tanda = {
  t: number;              // detik
  pix: Uint8Array;        // luminans LEBAR×TINGGI
  sel: Uint8Array;        // luminans 16×9 (rata blok 4×4)
  sharp: number;          // rata |gradien| — turun saat blur
  lum: number;            // rata luminans 0-255
  rgb: [number, number, number];
};

export type ItemDeteksi = {
  kategori: "presets" | "transitions" | "styles";
  label: string;          // judul singkat untuk UI
  ringkas: string;        // detail 1 baris
  jumlah: number;         // berapa kali terdeteksi (kepercayaan kasar)
  data: Record<string, unknown>;
};

export type Struktur = {
  durasiDetik: number;
  jumlahAdegan: number;
  items: ItemDeteksi[];                 // transisi + loop + animasi in/out
  waktuSampelGaya: number[];            // detik — frame tengah adegan terpanjang
  ciri: { lumRata: number; saturasi: number; potongPerDetik: number };
};

export type GayaTeks = {
  warna_teks: string; warna_outline: string; tebal_outline: number;
  posisi: "atas" | "tengah" | "bawah"; ukuran: number; font: string;
};

/* ── Util kecil ── */

const rata = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const bulat50 = (ms: number) => Math.round(ms / 50) * 50;
const hex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0").toUpperCase();
const hex = (r: number, g: number, b: number) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
const lawan = (a: string) => (a === "kiri" ? "kanan" : a === "kanan" ? "kiri" : a === "atas" ? "bawah" : "atas");

/** RGBA (LEBAR×TINGGI) → tanda frame. */
export function tandaDariPiksel(rgba: Uint8ClampedArray | Uint8Array, w: number, h: number, t: number): Tanda {
  const pix = new Uint8Array(w * h);
  let sr = 0, sg = 0, sb = 0;
  for (let i = 0; i < w * h; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
    pix[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    sr += r; sg += g; sb += b;
  }
  const n = w * h;
  const bw = Math.max(1, Math.floor(w / SEL_W)), bh = Math.max(1, Math.floor(h / SEL_H));
  const sel = new Uint8Array(SEL_W * SEL_H);
  for (let cy = 0; cy < SEL_H; cy++) for (let cx = 0; cx < SEL_W; cx++) {
    let s = 0, c = 0;
    for (let y = cy * bh; y < Math.min(h, (cy + 1) * bh); y++) for (let x = cx * bw; x < Math.min(w, (cx + 1) * bw); x++) { s += pix[y * w + x]; c++; }
    sel[cy * SEL_W + cx] = Math.round(s / (c || 1));
  }
  let gr = 0;
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const p = pix[y * w + x];
    gr += Math.abs(p - pix[y * w + x + 1]) + Math.abs(p - pix[(y + 1) * w + x]);
  }
  return { t, pix, sel, sharp: gr / ((w - 1) * (h - 1)), lum: rata(Array.from(sel)), rgb: [sr / n, sg / n, sb / n] };
}

function selisihSel(a: Uint8Array, b: Uint8Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

/* ── Estimasi gerak global antar dua frame ── */

/** b[x,y] ≈ a[x-dx, y-dy]  → dx>0 = isi bergerak ke kanan; dy>0 = ke bawah. */
export function geserGlobal(a: Uint8Array, b: Uint8Array, mx: number, my: number = mx): { dx: number; dy: number; err: number; err0: number } {
  let best = { dx: 0, dy: 0, err: Infinity }, err0 = 0;
  for (let dy = -my; dy <= my; dy++) for (let dx = -mx; dx <= mx; dx++) {
    let e = 0, c = 0;
    for (let y = Math.max(0, dy); y < Math.min(TINGGI, TINGGI + dy); y++) {
      for (let x = Math.max(0, dx); x < Math.min(LEBAR, LEBAR + dx); x++) {
        e += Math.abs(b[y * LEBAR + x] - a[(y - dy) * LEBAR + (x - dx)]); c++;
      }
    }
    e /= c || 1;
    if (dx === 0 && dy === 0) err0 = e;
    if (e < best.err) best = { dx, dy, err: e };
  }
  return { ...best, err0 };
}

/** b ≈ a diskalakan s dari pusat (s>1 = b lebih besar/zoom in). Kembalikan galat rata. */
function galatSkala(a: Uint8Array, b: Uint8Array, s: number): number {
  const cx = (LEBAR - 1) / 2, cy = (TINGGI - 1) / 2;
  let e = 0, c = 0;
  for (let y = 0; y < TINGGI; y++) for (let x = 0; x < LEBAR; x++) {
    const sx = Math.round((x - cx) / s + cx), sy = Math.round((y - cy) / s + cy);
    if (sx < 0 || sy < 0 || sx >= LEBAR || sy >= TINGGI) continue;
    e += Math.abs(b[y * LEBAR + x] - a[sy * LEBAR + sx]); c++;
  }
  return e / (c || 1);
}

function skalaTerbaik(a: Uint8Array, b: Uint8Array): { s: number; err: number } {
  let best = { s: 1, err: Infinity };
  for (let s = 0.94; s <= 1.0601; s += 0.01) {
    if (Math.abs(s - 1) < 0.005) continue;
    const e = galatSkala(a, b, s);
    if (e < best.err) best = { s, err: e };
  }
  return best;
}

/* ── 1. Peristiwa pergantian (transisi) ── */

export type Peristiwa = { sebelum: number; sesudah: number; k: number };

export function cariPeristiwa(frames: Tanda[], dtMs: number): Peristiwa[] {
  const n = frames.length;
  if (n < 4) return [];
  const d: number[] = [0];
  for (let i = 1; i < n; i++) d.push(selisihSel(frames[i - 1].sel, frames[i].sel));
  const ambang = Math.max(3, median(d.slice(1)) * 3);
  const aktif = d.map((v, i) => i > 0 && v > ambang);
  for (let i = 2; i < n - 1; i++) if (!aktif[i] && aktif[i - 1] && aktif[i + 1]) aktif[i] = true; // tutup celah 1 frame

  const hasil: Peristiwa[] = [];
  let i = 1;
  while (i < n) {
    if (!aktif[i]) { i++; continue; }
    let j = i;
    while (j + 1 < n && aktif[j + 1]) j++;
    const sebelum = i - 1, sesudah = j, k = j - i + 1;
    i = j + 1;
    if (k * dtMs > 3000) continue; // gerak panjang, bukan transisi
    const A = frames[sebelum], B = frames[sesudah];
    let luas = 0;
    for (let c = 0; c < A.sel.length; c++) if (Math.abs(A.sel[c] - B.sel[c]) > 25) luas++;
    luas /= A.sel.length;
    let sharpMin = Infinity;
    for (let m = sebelum + 1; m < sesudah; m++) sharpMin = Math.min(sharpMin, frames[m].sharp);
    const ref = Math.min(A.sharp, B.sharp);
    const dip = Number.isFinite(sharpMin) && ref > 0.5 ? 1 - sharpMin / ref : 0;
    if (luas >= 0.3 || dip >= 0.25) hasil.push({ sebelum, sesudah, k });
  }
  return hasil;
}

export type HasilTransisi = { gerakan: string; arah: string; durasi_ms: number };

export function klasifikasiTransisi(frames: Tanda[], ev: Peristiwa, dtMs: number): HasilTransisi {
  const durasi = clamp(bulat50(ev.k * dtMs), 150, 3000);
  if (ev.k === 1) return { gerakan: "none", arah: "", durasi_ms: 150 };
  const A = frames[ev.sebelum], B = frames[ev.sesudah];
  const mid = Math.floor((ev.sebelum + ev.sesudah) / 2);
  const M = frames[mid];

  /* blur: ketajaman anjlok di tengah padahal ujung-ujungnya sepadan */
  let sharpMin = Infinity;
  for (let m = ev.sebelum + 1; m < ev.sesudah; m++) sharpMin = Math.min(sharpMin, frames[m].sharp);
  const lo = Math.min(A.sharp, B.sharp), hi = Math.max(A.sharp, B.sharp);
  if (lo > 0.5 && sharpMin < 0.7 * lo && hi / lo < 1.6) return { gerakan: "blur", arah: "", durasi_ms: durasi };

  /* preferensi sel: apakah M lebih mirip B (+1) atau A (−1) */
  const pref: number[] = [], bx: number[] = [], by: number[] = [];
  for (let c = 0; c < SEL_W * SEL_H; c++) {
    if (Math.abs(A.sel[c] - B.sel[c]) < 12) continue;
    const dA = Math.abs(M.sel[c] - A.sel[c]), dB = Math.abs(M.sel[c] - B.sel[c]);
    const p = (dA - dB) / (dA + dB + 1);
    pref.push(p);
    if (p > 0) { bx.push(c % SEL_W); by.push(Math.floor(c / SEL_W)); }
  }
  if (pref.length < 6) return { gerakan: "crossfade", arah: "", durasi_ms: durasi };

  /* slide: isi gambar ikut bergeser konsisten antar frame peristiwa */
  {
    let sx = 0, sy = 0, pasang = 0;
    for (let m = ev.sebelum; m < ev.sesudah; m++) {
      const g = geserGlobal(frames[m].pix, frames[m + 1].pix, 24, 14);
      if (g.err < g.err0 * 0.7 && g.err0 > 3) { sx += g.dx; sy += g.dy; pasang++; }
    }
    if (pasang >= Math.max(1, Math.floor(ev.k * 0.6))) {
      const horiz = Math.abs(sx) / LEBAR >= Math.abs(sy) / TINGGI;
      if (horiz && Math.abs(sx) >= 3) return { gerakan: "slide", arah: sx > 0 ? "kanan" : "kiri", durasi_ms: durasi };
      if (!horiz && Math.abs(sy) >= 2) return { gerakan: "slide", arah: sy > 0 ? "bawah" : "atas", durasi_ms: durasi };
    }
  }

  const bimodal = pref.filter(p => Math.abs(p) > 0.6).length / pref.length;
  if (bimodal >= 0.6) {
    /* wipe: sel mirip-B berkumpul di satu sisi */
    const fB = bx.length / pref.length;
    if (fB > 0.12 && fB < 0.88) {
      const cx = (rata(bx) - (SEL_W - 1) / 2) / SEL_W, cy = (rata(by) - (SEL_H - 1) / 2) / SEL_H;
      const sisiB = Math.abs(cx) >= Math.abs(cy) ? (cx > 0 ? "kanan" : "kiri") : (cy > 0 ? "bawah" : "atas");
      return { gerakan: "wipe", arah: lawan(sisiB), durasi_ms: durasi };
    }
  }

  /* zoom: perubahan lebih kuat di tepi daripada pusat */
  let pusat = 0, nP = 0, tepi = 0, nT = 0;
  for (let y = 0; y < SEL_H; y++) for (let x = 0; x < SEL_W; x++) {
    const v = Math.abs(M.sel[y * SEL_W + x] - A.sel[y * SEL_W + x]);
    if (x >= 4 && x < 12 && y >= 2 && y < 7) { pusat += v; nP++; } else { tepi += v; nT++; }
  }
  if (tepi / nT / (pusat / nP + 1) > 1.9) return { gerakan: "zoom", arah: "", durasi_ms: durasi };

  return { gerakan: "crossfade", arah: "", durasi_ms: durasi };
}

/* ── 2. Loop (gerak latar saat scene diam) ── */

export function deteksiLoop(frames: Tanda[], a: number, b: number, dtMs: number): { gerakan: string; durasi_ms: number; intensitas: number } | null {
  const gap = Math.max(2, Math.round(1000 / dtMs));
  if (b - a < gap + 1) return null;
  const suara: Record<string, number> = {};
  const laju: Record<string, number[]> = {};
  let pasang = 0;
  for (let i = a; i + gap <= b; i += gap) {
    pasang++;
    const A = frames[i].pix, B = frames[i + gap].pix;
    const g = geserGlobal(A, B, 6, 6);
    const z = skalaTerbaik(A, B);
    if (g.err0 < 2.5) continue; // datar/statis
    const detik = (gap * dtMs) / 1000;
    const kandidat: [string, number, number][] = [];
    if (g.err < g.err0 * 0.7 && (g.dx !== 0 || g.dy !== 0)) {
      const horiz = Math.abs(g.dx) / LEBAR >= Math.abs(g.dy) / TINGGI;
      kandidat.push([horiz ? (g.dx > 0 ? "pan_kanan" : "pan_kiri") : (g.dy > 0 ? "pan_bawah" : "pan_atas"), g.err, (Math.abs(g.dx) + Math.abs(g.dy)) / detik]);
    }
    if (z.err < g.err0 * 0.7) kandidat.push([z.s > 1 ? "zoom_in" : "zoom_out", z.err, Math.abs(z.s - 1) * 100 / detik]);
    kandidat.sort((p, q) => p[1] - q[1]);
    if (kandidat.length) {
      const [nama, , kecepatan] = kandidat[0];
      suara[nama] = (suara[nama] || 0) + 1;
      (laju[nama] ||= []).push(kecepatan);
    }
  }
  const urut = Object.entries(suara).sort((p, q) => q[1] - p[1]);
  if (!urut.length || urut[0][1] < Math.max(2, pasang * 0.5)) return null;
  const nama = urut[0][0];
  const kec = median(laju[nama]);
  const ref = nama.startsWith("pan") ? 4 : 3; // px/s (pan) atau %/s (zoom) yang dianggap "normal"
  return {
    gerakan: nama,
    durasi_ms: clamp(bulat50((b - a) * dtMs), 1000, 3000),
    intensitas: clamp(Math.round((100 * kec) / ref), 40, 180),
  };
}

/* ── 3. Animasi masuk / keluar teks ── */

type Maska = { r: number; cx: number; cy: number; x0: number; x1: number; y0: number; y1: number };

function maska(pix: Uint8Array, ref: Uint8Array, ambang: number): Maska {
  let n = 0, sx = 0, sy = 0, x0 = LEBAR, x1 = -1, y0 = TINGGI, y1 = -1;
  for (let y = 0; y < TINGGI; y++) for (let x = 0; x < LEBAR; x++) {
    if (Math.abs(pix[y * LEBAR + x] - ref[y * LEBAR + x]) > ambang) {
      n++; sx += x; sy += y;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return { r: n / (LEBAR * TINGGI), cx: n ? sx / n : 0, cy: n ? sy / n : 0, x0, x1, y0, y1 };
}

/** Analisis "masuk" dari urutan frame yang diawali latar tanpa teks. null jika tak meyakinkan. */
function analisisMasuk(urut: Tanda[], dtMs: number): { gerakan: string; arah: string; durasi_ms: number } | null {
  if (urut.length < 8) return null;
  const mid = Math.floor(urut.length / 2);
  const F0 = urut[0].pix;
  const tengah = maska(urut[mid].pix, F0, 50);
  if (tengah.r < 0.004 || tengah.r > 0.5) return null;
  const seri: Maska[] = [];
  for (let k = 0; k <= mid; k++) seri.push(maska(urut[k].pix, F0, 50));
  const target = tengah.r;
  let onset = seri.findIndex(m => m.r > 0.1 * target);
  let penuh = seri.findIndex(m => m.r >= 0.9 * target);
  if (onset < 0 || penuh < 0 || penuh < onset) return null;
  if (onset === 0 && seri[0].r > 0.1 * target) return null;
  const durasi = clamp(bulat50((penuh - onset + 1) * dtMs), 150, 1800);

  const awal = seri.findIndex(m => m.r >= 0.4 * target);
  const E = seri[awal < 0 ? penuh : awal];
  const lebarAkhir = tengah.x1 - tengah.x0 + 1, tinggiAkhir = tengah.y1 - tengah.y0 + 1;
  const lebarE = E.x1 - E.x0 + 1, tinggiE = E.y1 - E.y0 + 1;

  /* slide: KEDUA tepi kotak teks bergerak searah (pertumbuhan dari tengah = berlawanan arah) */
  const d0x = tengah.x0 - E.x0, d1x = tengah.x1 - E.x1, d0y = tengah.y0 - E.y0, d1y = tengah.y1 - E.y1;
  const slideX = Math.abs(d0x) > 3 && Math.abs(d1x) > 3 && Math.sign(d0x) === Math.sign(d1x);
  const slideY = Math.abs(d0y) > 2 && Math.abs(d1y) > 2 && Math.sign(d0y) === Math.sign(d1y);
  if (slideX || slideY) {
    const horiz = slideX && (!slideY || Math.abs(d0x) / LEBAR >= Math.abs(d0y) / TINGGI);
    const asal = horiz ? (d0x > 0 ? "kiri" : "kanan") : (d0y > 0 ? "atas" : "bawah");
    return { gerakan: "slide", arah: asal, durasi_ms: durasi };
  }

  let loncat = 0;
  for (let k = Math.max(1, onset); k <= penuh; k++) if (seri[k].r - seri[k - 1].r >= 0.18 * target) loncat++;
  if (loncat >= 3) return { gerakan: "kata", arah: "", durasi_ms: clamp(bulat50((penuh - onset + 1) * dtMs), 300, 1800) };

  if (lebarE / lebarAkhir < 0.7 && (Math.abs(E.x0 - tengah.x0) <= 2 || Math.abs(E.x1 - tengah.x1) <= 2)) {
    return { gerakan: "wipe", arah: Math.abs(E.x0 - tengah.x0) <= 2 ? "kanan" : "kiri", durasi_ms: durasi };
  }
  if (tinggiE / tinggiAkhir < 0.7 && (Math.abs(E.y0 - tengah.y0) <= 1 || Math.abs(E.y1 - tengah.y1) <= 1)) {
    return { gerakan: "wipe", arah: Math.abs(E.y0 - tengah.y0) <= 1 ? "bawah" : "atas", durasi_ms: durasi };
  }
  if ((lebarE * tinggiE) / (lebarAkhir * tinggiAkhir) < 0.55) return { gerakan: "zoom", arah: "", durasi_ms: durasi };
  return { gerakan: "fade", arah: "", durasi_ms: durasi };
}

export function deteksiMasukKeluar(frames: Tanda[], a: number, b: number, dtMs: number) {
  const adegan = frames.slice(a, b + 1);
  if (adegan.length < 10) return { masuk: null, keluar: null };
  const masuk = analisisMasuk(adegan, dtMs);
  const rev = analisisMasuk([...adegan].reverse(), dtMs);
  let keluar: { gerakan: string; arah: string; durasi_ms: number } | null = null;
  if (rev) {
    /* waktu dibalik: zoom → shrink; wipe → tepi berbalik; slide → ke sisi tujuan (sama) */
    if (rev.gerakan === "zoom") keluar = { gerakan: "shrink", arah: "", durasi_ms: rev.durasi_ms };
    else if (rev.gerakan === "wipe") keluar = { gerakan: "wipe", arah: lawan(rev.arah), durasi_ms: rev.durasi_ms };
    else if (rev.gerakan === "kata") keluar = { gerakan: "fade", arah: "", durasi_ms: clamp(rev.durasi_ms, 200, 1000) };
    else keluar = { gerakan: rev.gerakan, arah: rev.arah, durasi_ms: clamp(rev.durasi_ms, 200, 1000) };
  }
  return { masuk, keluar };
}

/* ── 4. Gaya teks dari satu frame (resolusi lebih besar) ── */

export function estimasiGayaTeks(rgba: Uint8ClampedArray | Uint8Array, w: number, h: number): GayaTeks | null {
  const n = w * h;
  const kunci = (i: number) => ((rgba[i * 4] >> 4) << 8) | ((rgba[i * 4 + 1] >> 4) << 4) | (rgba[i * 4 + 2] >> 4);
  const hist = new Map<number, number>();
  for (let i = 0; i < n; i++) hist.set(kunci(i), (hist.get(kunci(i)) || 0) + 1);
  const modus = (m: Map<number, number>) => { let bk = -1, bv = -1; m.forEach((v, k) => { if (v > bv) { bv = v; bk = k; } }); return bk; };
  const kRGB = (k: number): [number, number, number] => [((k >> 8) & 15) * 17, ((k >> 4) & 15) * 17, (k & 15) * 17];
  const jarak = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const bg = kRGB(modus(hist));

  const warna = (i: number): [number, number, number] => [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]];
  const cand = new Uint8Array(n);
  const hTeks = new Map<number, number>();
  let jml = 0;
  for (let i = 0; i < n; i++) if (jarak(warna(i), bg) > 90) { cand[i] = 1; jml++; hTeks.set(kunci(i), (hTeks.get(kunci(i)) || 0) + 1); }
  if (jml / n < 0.002) return null;
  const teks = kRGB(modus(hTeks));

  /* outline: piksel kandidat yang jauh dari warna teks & latar dan bersebelahan dengan piksel teks */
  const hOut = new Map<number, number>();
  let nTeks = 0, nOut = 0;
  const x0s = { v: w }, x1s = { v: -1 };
  const barisTeks = new Uint32Array(h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (!cand[i]) continue;
    const c = warna(i);
    if (jarak(c, teks) < 60) {
      nTeks++; barisTeks[y]++;
      if (x < x0s.v) x0s.v = x; if (x > x1s.v) x1s.v = x;
      continue;
    }
    if (jarak(c, bg) < 60) continue;
    let dekat = false;
    for (let dy = -1; dy <= 1 && !dekat; dy++) for (let dx = -1; dx <= 1; dx++) {
      const j = (y + dy) * w + (x + dx);
      if (cand[j] && jarak(warna(j), teks) < 60) { dekat = true; break; }
    }
    if (dekat) { nOut++; hOut.set(kunci(i), (hOut.get(kunci(i)) || 0) + 1); }
  }
  if (nTeks < 8) return null;
  const adaOutline = nOut / nTeks >= 0.15;
  const outline = adaOutline ? kRGB(modus(hOut)) : ([0, 0, 0] as [number, number, number]);
  const tebal = adaOutline ? clamp(Math.round((nOut / nTeks) * 10), 2, 12) : 0;

  /* posisi vertikal & tinggi pita teks terbesar */
  let sy = 0, nY = 0;
  for (let y = 0; y < h; y++) { sy += y * barisTeks[y]; nY += barisTeks[y]; }
  const cy = nY ? sy / nY / h : 0.5;
  let best = 0, cur = 0;
  const ambangBaris = Math.max(1, (x1s.v - x0s.v) * 0.04);
  for (let y = 0; y < h; y++) { if (barisTeks[y] > ambangBaris) { cur++; best = Math.max(best, cur); } else cur = 0; }
  const ukuran = clamp(Math.round((best / w) * 1080), 24, 120);
  const rapat = nTeks / Math.max(1, (x1s.v - x0s.v + 1) * Math.max(1, best));
  const font = rapat > 0.4 ? "montserrat_black" : rapat < 0.2 ? "poppins_regular" : "poppins_bold";

  return {
    warna_teks: hex(...teks), warna_outline: hex(...outline), tebal_outline: tebal,
    posisi: cy < 0.38 ? "atas" : cy > 0.62 ? "bawah" : "tengah", ukuran, font,
  };
}

/* ── 5. Orkestrasi: frame → struktur → entri koleksi ── */

const NAMA_TRANSISI: Record<string, string> = {
  none: "Potong Cepat", crossfade: "Pudar Silang", blur: "Kabur Lembut", wipe: "Sapuan", slide: "Geser", zoom: "Zoom Tembus", flip: "Balik",
};
const NAMA_GERAK: Record<string, string> = {
  fade: "Pudar", slide: "Geser", zoom: "Zoom", bounce: "Memantul", wipe: "Sapuan", kata: "Kata Demi Kata", shrink: "Mengecil",
  zoom_in: "Zoom Masuk Pelan", zoom_out: "Zoom Keluar Pelan", pan_kiri: "Geser Pelan Kiri", pan_kanan: "Geser Pelan Kanan",
  pan_atas: "Geser Pelan Atas", pan_bawah: "Geser Pelan Bawah",
};
const SFX_TRANSISI: Record<string, string> = { none: "klik cepat", blur: "whoosh lembut", wipe: "whoosh", slide: "whoosh geser", zoom: "swish zoom", crossfade: "" };

export function moodDariCiri(c: Struktur["ciri"]): string[] {
  const tag: string[] = [];
  if (c.lumRata < 70) tag.push("dramatis");
  else if (c.lumRata > 170 && c.saturasi > 0.35) tag.push("ceria");
  if (c.potongPerDetik > 0.35) tag.push("energik");
  else if (c.potongPerDetik < 0.12) tag.push("tenang");
  if (!tag.length) tag.push("fokus");
  return tag.slice(0, 2);
}

function saturasi(rgb: [number, number, number]): number {
  const mx = Math.max(...rgb), mn = Math.min(...rgb);
  return mx === 0 ? 0 : (mx - mn) / mx;
}

export function analisisStruktur(frames: Tanda[], dtMs: number): Struktur {
  const n = frames.length;
  const durasiDetik = n ? frames[n - 1].t - frames[0].t : 0;
  const ev = cariPeristiwa(frames, dtMs);
  const ciri = {
    lumRata: rata(frames.map(f => f.lum)),
    saturasi: rata(frames.map(f => saturasi(f.rgb))),
    potongPerDetik: durasiDetik > 0 ? ev.length / durasiDetik : 0,
  };
  const tag = moodDariCiri(ciri);

  const grup = new Map<string, { item: ItemDeteksi; durasi: number[] }>();
  const tambah = (kunci: string, buat: () => ItemDeteksi, durasi: number) => {
    const g = grup.get(kunci);
    if (g) { g.item.jumlah++; g.durasi.push(durasi); } else grup.set(kunci, { item: buat(), durasi: [durasi] });
  };

  /* transisi */
  for (const e of ev) {
    const h = klasifikasiTransisi(frames, e, dtMs);
    tambah(`t|${h.gerakan}|${h.arah}`, () => ({
      kategori: "transitions",
      label: `${NAMA_TRANSISI[h.gerakan] ?? h.gerakan}${h.arah ? " " + h.arah : ""}`,
      ringkas: "", jumlah: 1,
      data: { nama: "", gerakan: h.gerakan, arah: h.arah, durasi_ms: h.durasi_ms, easing: h.gerakan === "none" ? "linear" : "ease_in_out", tag, sfx: SFX_TRANSISI[h.gerakan] ?? "" },
    }), h.durasi_ms);
  }

  /* adegan di antara peristiwa */
  const adegan: { a: number; b: number }[] = [];
  let mulai = 0;
  for (const e of ev) { if (e.sebelum - mulai >= 2) adegan.push({ a: mulai, b: e.sebelum }); mulai = e.sesudah; }
  if (n - 1 - mulai >= 2) adegan.push({ a: mulai, b: n - 1 });

  for (const s of adegan) {
    const lp = deteksiLoop(frames, s.a, s.b, dtMs);
    if (lp) {
      tambah(`p|loop|${lp.gerakan}`, () => ({
        kategori: "presets", label: `Loop · ${NAMA_GERAK[lp.gerakan] ?? lp.gerakan}`, ringkas: "", jumlah: 1,
        data: { nama: "", tipe: "loop", gerakan: lp.gerakan, arah: "", durasi_ms: lp.durasi_ms, easing: "linear", intensitas: lp.intensitas, tag, sfx: "" },
      }), lp.durasi_ms);
      continue; // latar bergerak → deteksi teks tak andal
    }
    const { masuk, keluar } = deteksiMasukKeluar(frames, s.a, s.b, dtMs);
    for (const [tipe, h] of [["in", masuk], ["out", keluar]] as const) {
      if (!h) continue;
      tambah(`p|${tipe}|${h.gerakan}|${h.arah}`, () => ({
        kategori: "presets", label: `${tipe === "in" ? "Masuk" : "Keluar"} · ${NAMA_GERAK[h.gerakan] ?? h.gerakan}${h.arah ? " " + h.arah : ""}`,
        ringkas: "", jumlah: 1,
        data: { nama: "", tipe, gerakan: h.gerakan, arah: h.arah, durasi_ms: h.durasi_ms, easing: tipe === "in" ? "ease_out" : "ease_in", intensitas: 100, tag, sfx: "" },
      }), h.durasi_ms);
    }
  }

  const items: ItemDeteksi[] = [];
  grup.forEach(g => {
    g.item.data.durasi_ms = clamp(bulat50(median(g.durasi)), 150, 3000);
    g.item.ringkas = `${g.item.data.durasi_ms} ms · terdeteksi ${g.item.jumlah}×`;
    items.push(g.item);
  });

  const terpanjang = [...adegan].sort((p, q) => (q.b - q.a) - (p.b - p.a)).slice(0, 4);
  return {
    durasiDetik, jumlahAdegan: adegan.length, items,
    waktuSampelGaya: terpanjang.map(s => frames[Math.floor((s.a + s.b) / 2)].t),
    ciri,
  };
}

/** Gabung struktur + sampel gaya → daftar entri akhir (nama unik dengan akhiran dari nama berkas). */
export function gabungHasil(st: Struktur, gaya: (GayaTeks | null)[], namaBerkas: string): ItemDeteksi[] {
  const sufiks = namaBerkas.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").trim().slice(0, 18) || "video";
  const tag = moodDariCiri(st.ciri);
  const hasil: ItemDeteksi[] = st.items.map(it => ({ ...it, data: { ...it.data, nama: `${it.label} · ${sufiks}` } }));

  const lihat = new Set<string>();
  gaya.forEach(g => {
    if (!g) return;
    const k = `${g.warna_teks}|${g.warna_outline}|${g.posisi}|${g.font}`;
    if (lihat.has(k)) return;
    lihat.add(k);
    hasil.push({
      kategori: "styles", label: `Gaya teks ${g.warna_teks}`, jumlah: 1,
      ringkas: `${g.font} ${g.ukuran}px · ${g.posisi} · outline ${g.tebal_outline ? g.tebal_outline + " " + g.warna_outline : "tanpa"}`,
      data: { nama: `Gaya ${g.warna_teks} ${g.posisi} · ${sufiks}`, font: g.font, ukuran: g.ukuran, warna_teks: g.warna_teks, tebal_outline: g.tebal_outline, warna_outline: g.warna_outline, posisi: g.posisi, tag },
    });
  });
  return hasil;
}

/** Entri terpilih → JSON berkas koleksi v1 (siap ke imporKeKoleksi — validasi & dedupe di sana). */
export function itemKeBerkas(items: ItemDeteksi[]): string {
  const out: { version: 1; presets: unknown[]; transitions: unknown[]; styles: unknown[] } = { version: 1, presets: [], transitions: [], styles: [] };
  for (const it of items) out[it.kategori].push(it.data);
  return JSON.stringify(out);
}
