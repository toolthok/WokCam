/* ═══ Test regresi: Deteksi Video → Koleksi (video-analyzer) ═══
 * Jalankan: bun scripts/test-video-analyzer.ts
 * Frame sintetis 64×36: latar bertekstur deterministik A/B, lalu dibuat potong, pudar silang,
 * kabur, sapuan, geser, loop pan/zoom, dan teks berwarna untuk estimasi gaya.
 */
import {
  LEBAR as W, TINGGI as H, tandaDariPiksel, analisisStruktur, gabungHasil, itemKeBerkas,
  estimasiGayaTeks, cariPeristiwa, klasifikasiTransisi, type Tanda,
} from "../src/lib/video-analyzer";
import { imporKeKoleksi, koleksiBawaan } from "../src/lib/preset-store";

let lulus = 0, gagal = 0;
const ok = (c: boolean, m: string) => { if (c) lulus++; else { gagal++; console.log("  ✗ " + m); } };
const DT = 125;

/* latar bertekstur: blok 3×3 acak (seed) — punya gradien agar blur terukur */
function pola(seed: number): Uint8Array {
  let s = seed >>> 0;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const g = new Uint8Array(W * H), blok: number[] = [];
  for (let i = 0; i < Math.ceil(W / 3) * Math.ceil(H / 3); i++) blok.push(40 + Math.floor(r() * 180));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[y * W + x] = blok[Math.floor(y / 3) * Math.ceil(W / 3) + Math.floor(x / 3)];
  return g;
}
const A = pola(1), B = pola(7);
const tanda = (pix: Uint8Array, t: number): Tanda => {
  const rgba = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { rgba[i * 4] = pix[i]; rgba[i * 4 + 1] = pix[i]; rgba[i * 4 + 2] = pix[i]; rgba[i * 4 + 3] = 255; }
  return tandaDariPiksel(rgba, W, H, t);
};
const ulang = (pix: Uint8Array, n: number) => Array.from({ length: n }, () => pix);
const mix = (p: Uint8Array, q: Uint8Array, a: number) => p.map((v, i) => Math.round(v * (1 - a) + q[i] * a)) as unknown as Uint8Array;
function kabur(p: Uint8Array, r: number): Uint8Array {
  const o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let s = 0, c = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < H && xx >= 0 && xx < W) { s += p[yy * W + xx]; c++; }
    }
    o[y * W + x] = Math.round(s / c);
  }
  return o;
}
function geser(p: Uint8Array, dx: number, dy: number): Uint8Array { // dx boleh pecahan (interpolasi linear)
  const o = new Uint8Array(W * H), i0 = Math.floor(dx), f = dx - i0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sy = ((y - dy) % H + H) % H;
    const a = p[sy * W + ((x - i0) % W + W) % W], b = p[sy * W + ((x - i0 - 1) % W + W) % W];
    o[y * W + x] = Math.round(a * (1 - f) + b * f);
  }
  return o;
}
function sapuK(p: Uint8Array, q: Uint8Array, f: number): Uint8Array { // q muncul dari KANAN, tepi bergerak ke kiri
  const o = new Uint8Array(p);
  const x0 = Math.round(W * (1 - f));
  for (let y = 0; y < H; y++) for (let x = x0; x < W; x++) o[y * W + x] = q[y * W + x];
  return o;
}
const jalan = (pixs: Uint8Array[]) => pixs.map((p, i) => tanda(p, (i * DT) / 1000));
const adaGer = (st: ReturnType<typeof analisisStruktur>, kat: string, ger: string, arah?: string) =>
  st.items.some(i => i.kategori === kat && i.data.gerakan === ger && (arah === undefined || i.data.arah === arah));

console.log("— potong cepat");
{
  const f = jalan([...ulang(A, 20), ...ulang(B, 20)]);
  const ev = cariPeristiwa(f, DT);
  ok(ev.length === 1, "1 peristiwa pada potongan (dapat " + ev.length + ")");
  ok(klasifikasiTransisi(f, ev[0], DT).gerakan === "none", "potong = none");
}
console.log("— pudar silang 4 frame");
{
  const mid = [0.2, 0.4, 0.6, 0.8].map(a => mix(A, B, a));
  const f = jalan([...ulang(A, 20), ...mid, ...ulang(B, 20)]);
  const st = analisisStruktur(f, DT);
  ok(adaGer(st, "transitions", "crossfade"), "crossfade terdeteksi: " + st.items.map(i => i.label).join(","));
  const t = st.items.find(i => i.data.gerakan === "crossfade");
  ok(!!t && Math.abs((t!.data.durasi_ms as number) - 500) <= 150, "durasi ≈ 500 ms (dapat " + t?.data.durasi_ms + ")");
}
console.log("— blur");
{
  const mid = [kabur(A, 1), kabur(A, 3), kabur(B, 3), kabur(B, 1)];
  const f = jalan([...ulang(A, 20), ...mid, ...ulang(B, 20)]);
  const st = analisisStruktur(f, DT);
  ok(adaGer(st, "transitions", "blur"), "blur terdeteksi: " + st.items.map(i => i.label).join(","));
}
console.log("— sapuan (tepi ke kiri)");
{
  const mid = [0.2, 0.4, 0.6, 0.8].map(a => sapuK(A, B, a));
  const f = jalan([...ulang(A, 20), ...mid, ...ulang(B, 20)]);
  const st = analisisStruktur(f, DT);
  ok(adaGer(st, "transitions", "wipe", "kiri"), "wipe arah kiri: " + st.items.map(i => i.label).join(","));
}
console.log("— geser (isi ke kiri)");
{
  const comp = (p: Uint8Array, q: Uint8Array, off: number) => { // p bergeser keluar kiri sebesar off, q masuk dari kanan
    const o = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) o[y * W + x] = x + off < W ? p[y * W + x + off] : q[y * W + (x + off - W)];
    return o;
  };
  const mid = [0.2, 0.4, 0.6, 0.8].map(a => comp(A, B, Math.round(W * a)));
  const f = jalan([...ulang(A, 20), ...mid, ...ulang(B, 20)]);
  const st = analisisStruktur(f, DT);
  ok(adaGer(st, "transitions", "slide", "kiri"), "slide kiri: " + st.items.map(i => i.label).join(","));
}
console.log("— loop pan_kanan");
{
  const f = jalan(Array.from({ length: 40 }, (_, i) => geser(A, i * 0.5, 0)));
  const st = analisisStruktur(f, DT);
  ok(adaGer(st, "presets", "pan_kanan"), "pan_kanan: " + st.items.map(i => i.label).join(","));
}
console.log("— statis tidak menghasilkan apa-apa");
{
  const st = analisisStruktur(jalan(ulang(A, 40)), DT);
  ok(st.items.length === 0, "tanpa item (dapat " + st.items.length + ")");
}
console.log("— animasi masuk fade vs slide");
{
  const bg = new Uint8Array(W * H).fill(235);
  const dengan = (aT: number, dx = 0) => { const o = new Uint8Array(bg); for (let y = 15; y < 21; y++) for (let x = 16 + dx; x < 48 + dx; x++) if (x >= 0 && x < W) o[y * W + x] = Math.round(235 - aT * 215); return o; };
  const fade = jalan([...ulang(bg, 4), ...[0.2, 0.5, 0.8, 1].map(a => dengan(a)), ...ulang(dengan(1), 14)]);
  const sf = analisisStruktur(fade, DT);
  ok(adaGer(sf, "presets", "fade") && sf.items.some(i => i.data.tipe === "in"), "masuk fade: " + sf.items.map(i => i.label).join(","));
  const sl = jalan([...ulang(bg, 4), ...[-40, -28, -14, -4, 0].map(d => dengan(1, d)), ...ulang(dengan(1), 14)]);
  const ss = analisisStruktur(sl, DT);
  ok(adaGer(ss, "presets", "slide", "kiri"), "masuk slide dari kiri: " + ss.items.map(i => i.label).join(","));
}
console.log("— gaya teks");
{
  const w = 160, h = 90, rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { rgba[i * 4] = 20; rgba[i * 4 + 1] = 20; rgba[i * 4 + 2] = 40; rgba[i * 4 + 3] = 255; }
  for (let y = 70; y < 82; y++) for (let x = 20; x < 140; x++) { const i = y * w + x; rgba[i * 4] = 255; rgba[i * 4 + 1] = 221; rgba[i * 4 + 2] = 0; }
  const g = estimasiGayaTeks(rgba, w, h);
  ok(!!g, "gaya terdeteksi");
  ok(g!.posisi === "bawah", "posisi bawah (" + g?.posisi + ")");
  ok(/^#FF[CD][D-F]00$|^#FFDD00$|^#FFEE00$|^#FFCC00$/.test(g!.warna_teks) || g!.warna_teks.startsWith("#FF"), "warna kuning (" + g?.warna_teks + ")");
  ok(estimasiGayaTeks(new Uint8ClampedArray(w * h * 4).fill(255), w, h) === null, "frame polos → null");
}
console.log("— integrasi ke koleksi");
{
  const mid = [0.2, 0.4, 0.6, 0.8].map(a => mix(A, B, a));
  const st = analisisStruktur(jalan([...ulang(A, 20), ...mid, ...ulang(B, 20)]), DT);
  const items = gabungHasil(st, [], "Video Referensi_01.mp4");
  ok(items.length >= 1 && String(items[0].data.nama).includes("Video Referensi 01"), "nama memuat sufiks berkas");
  const h = imporKeKoleksi(koleksiBawaan(), itemKeBerkas(items));
  ok(h.ditambah >= 1 && h.ditolak === 0, `diimpor ${h.ditambah}, ditolak ${h.ditolak}`);
  const h2 = imporKeKoleksi(h.koleksi, itemKeBerkas(items));
  ok(h2.ditambah === 0, "impor ulang idempoten");
}
console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
